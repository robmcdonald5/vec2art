/**
 * WASM Worker Service
 * Manages communication between main thread and WASM Web Worker
 *
 * Benefits:
 * - Prevents main thread blocking during WASM operations
 * - Maintains browser responsiveness during image processing
 * - Proper error handling and recovery
 */

import { browser } from '$app/environment';
import type {
	ProcessingProgress,
	ProcessingResult,
	VectorizerError
} from '$lib/workers/vectorizer.worker';
import type { AlgorithmConfig } from '$lib/types/algorithm-configs';

// Message ID generator for request/response matching
let messageIdCounter = 0;
const generateMessageId = () => `msg_${Date.now()}_${++messageIdCounter}`;

// Pending requests map for promise resolution
const pendingRequests = new Map<
	string,
	{
		resolve: (value: any) => void;
		reject: (reason: any) => void;
	}
>();

// Worker state management to prevent race conditions
enum WorkerState {
	IDLE = 'idle',
	INITIALIZING = 'initializing',
	PROCESSING = 'processing',
	RESTARTING = 'restarting'
}

export class WasmWorkerService {
	private static instance: WasmWorkerService | null = null;
	private worker: Worker | null = null;
	private isInitialized = false;
	private initPromise: Promise<void> | null = null;
	private progressCallback: ((progress: ProcessingProgress) => void) | null = null;
	private workerState: WorkerState = WorkerState.IDLE;
	private processingQueue: Array<() => Promise<any>> = [];
	private isProcessingQueue = false;

	private constructor() {}

	static getInstance(): WasmWorkerService {
		if (!WasmWorkerService.instance) {
			WasmWorkerService.instance = new WasmWorkerService();
		}
		return WasmWorkerService.instance;
	}

	/**
	 * Initialize the Web Worker and WASM module
	 */
	async initialize(options?: { threadCount?: number; backend?: string }): Promise<void> {
		if (!browser) {
			throw new Error('Web Worker can only be initialized in browser');
		}

		// iOS compatibility check
		const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
		if (isIOS) {
			console.log('[WasmWorkerService] iOS detected - limiting resources');
			options = {
				...options,
				threadCount: 1 // Force single thread on iOS
			};
		}

		// Allow re-initialization with threading configuration
		// Initialize called with options

		if (this.isInitialized && (!options?.threadCount || options.threadCount <= 1)) {
			// Already initialized, no threading config needed
			return;
		}

		if (this.initPromise && (!options?.threadCount || options.threadCount <= 1)) {
			// Initialization in progress, no threading config needed
			return this.initPromise;
		}

		// Handle threading configuration for existing worker
		if (this.isInitialized && options?.threadCount && options.threadCount > 1) {
			// Configuring threading on existing worker

			// Send threading configuration to existing worker
			try {
				const result = await this.sendMessage('init', {
					threadCount: options.threadCount,
					backend: options.backend
				});

				if (result.success) {
					// Threading configuration complete
				} else {
					console.error('[WasmWorkerService] Threading configuration failed:', result.error);
				}
				return;
			} catch (error) {
				console.error('[WasmWorkerService] Failed to configure threading:', error);
				return;
			}
		}

		// Full initialization for new worker
		if (!this.initPromise) {
			this.initPromise = this._doInitialize(options);
		}
		return this.initPromise;
	}

	private async _doInitialize(options?: { threadCount?: number; backend?: string }): Promise<void> {
		try {
			// Initializing Web Worker

			// Create Web Worker
			this.worker = new Worker(new URL('../workers/wasm-processor.worker', import.meta.url), {
				type: 'module'
			});

			// Set up message handler
			this.worker.addEventListener('message', this.handleWorkerMessage.bind(this));

			// Set up error handler
			this.worker.addEventListener('error', (error) => {
				console.error('[WasmWorkerService] Worker error:', error);
			});

			// Initialize WASM in worker
			const result = await this.sendMessage('init', {
				threadCount: options?.threadCount,
				backend: options?.backend
			});

			if (!result.success) {
				throw new Error(result.error || 'WASM initialization failed');
			}

			this.isInitialized = true;
			// Initialization complete
		} catch (error) {
			console.error('[WasmWorkerService] Initialization failed:', error);
			this.cleanup();
			throw error;
		}
	}

	/**
	 * Handle messages from Web Worker
	 */
	private handleWorkerMessage(event: MessageEvent) {
		const { type, id, data, error } = event.data;

		// Received worker message

		// Handle progress updates
		if (type === 'progress') {
			// Progress update
			if (this.progressCallback) {
				this.progressCallback(data);
			}
			return;
		}

		// Handle request responses
		const pending = pendingRequests.get(id);
		if (pending) {
			pendingRequests.delete(id);
			// Resolving pending request

			if (type === 'ready' || type === 'result') {
				// Success response from worker
				pending.resolve({ success: true, ...data });
			} else if (type === 'error') {
				console.log(`[WasmWorkerService]  Error response for ${id}:`, error);
				pending.reject(new Error(error || 'Unknown worker error'));
			}
		} else {
			console.warn(
				`[WasmWorkerService]  No pending request found for message ${id} (type: ${type})`
			);
		}
	}

	/**
	 * Send message to worker and wait for response
	 */
	private async sendMessage(type: string, payload?: any): Promise<any> {
		if (!this.worker) {
			throw new Error('Worker not initialized');
		}

		const id = generateMessageId();

		// Calculate dynamic timeout based on operation type and image size
		let timeout = 60000; // Default 60 seconds

		if (type === 'process' && payload?.imageData) {
			const pixelCount = payload.imageData.width * payload.imageData.height;
			const megapixels = pixelCount / 1_000_000;

			// Dynamic timeout: 60s base + 30s per megapixel, max 300s (5min)
			timeout = Math.min(300000, 60000 + megapixels * 30000);

			// Dynamic timeout calculated
		}

		return new Promise((resolve, reject) => {
			// Store pending request
			pendingRequests.set(id, { resolve, reject });

			// Send message to worker
			this.worker!.postMessage({ type, id, payload });

			// Set timeout for response
			setTimeout(() => {
				if (pendingRequests.has(id)) {
					pendingRequests.delete(id);
					reject(new Error(`Worker timeout for message ${type} after ${timeout / 1000}s`));
				}
			}, timeout);
		});
	}

	/**
	 * Add a task to the processing queue to prevent race conditions
	 */
	private async addToQueue<T>(task: () => Promise<T>): Promise<T> {
		return new Promise((resolve, reject) => {
			this.processingQueue.push(async () => {
				try {
					const result = await task();
					resolve(result);
				} catch (error) {
					reject(error);
				}
			});
			this.processQueue();
		});
	}

	/**
	 * Process the request queue serially to prevent race conditions
	 */
	private async processQueue(): Promise<void> {
		if (this.isProcessingQueue || this.processingQueue.length === 0) {
			return;
		}

		this.isProcessingQueue = true;

		while (this.processingQueue.length > 0) {
			const task = this.processingQueue.shift()!;

			try {
				this.workerState = WorkerState.PROCESSING;
				await task();
			} catch (error) {
				console.error('[WasmWorkerService] Queue task failed:', error);
				// Continue processing other tasks even if one fails
			} finally {
				this.workerState = WorkerState.IDLE;
			}
		}

		this.isProcessingQueue = false;
	}

	/**
	 * Process an image using WASM in Web Worker
	 */
	async processImage(
		imageData: ImageData,
		config: AlgorithmConfig,
		onProgress?: (progress: ProcessingProgress) => void
	): Promise<ProcessingResult> {
		// Use queue to prevent race conditions when spamming converter
		return this.addToQueue(async () => {
			if (!this.isInitialized) {
				await this.initialize({
					backend: config.algorithm
				});
			}

			// Analyze image size and complexity for optimization
			const pixelCount = imageData.width * imageData.height;
			const megapixels = pixelCount / 1_000_000;
			const isLargeImage = megapixels > 10; // 10MP+ is considered large
			const isVeryLargeImage = megapixels > 20; // 20MP+ is very large
			let processingTimeoutMs = 60000; // Default 60 seconds

			// Processing image

			// Check if GPU acceleration should be used
			let preferGpu = false;
			try {
				const { gpuService } = await import('./gpu-service');
				await gpuService.initialize();

				if (
					gpuService.isGpuAvailable() &&
					gpuService.shouldUseGpu(imageData.width, imageData.height)
				) {
					const strategy = gpuService.getProcessingStrategy(
						imageData.width,
						imageData.height,
						config.algorithm
					);
					if (strategy.includes('gpu-preferred')) {
						preferGpu = true;
						console.log(`[WasmWorkerService] 🚀 GPU acceleration enabled: ${strategy}`);
					} else {
						console.log(`[WasmWorkerService] 💻 CPU processing recommended: ${strategy}`);
					}
				}
			} catch (error) {
				console.warn('[WasmWorkerService] GPU service initialization failed:', error);
			}

			// Apply optimizations for large images
			if (isLargeImage) {
				console.log('[WasmWorkerService] 🔧 Large image detected, applying optimizations...');

				// For very large images, reduce detail automatically to prevent memory issues
				if (
					isVeryLargeImage &&
					config.algorithm === 'dots' &&
					config.detail &&
					config.detail > 0.4
				) {
					console.log(
						`[WasmWorkerService]  Very large image: reducing detail from ${config.detail} to 0.4 for stability`
					);
					config = { ...config, detail: 0.4 };
				}

				// Set processing timeout for large images (separate from config)
				processingTimeoutMs = 300000; // 5 minutes
				console.log('[WasmWorkerService]  Extended processing timeout for large image');
			}

			// Use isolated worker for high-intensity operations (7+ passes) OR very large images
			// This prevents thread pool corruption during intensive processing
			const passCount = (config as any).passCount; // Only EdgeConfig has passCount
			if ((passCount && passCount >= 7) || isVeryLargeImage) {
				const reason =
					passCount && passCount >= 7 ? 'high-intensity multipass' : 'very large image';
				console.log(`[WasmWorkerService] ${reason} operation detected, using isolated worker`);
				return this.processImageWithIsolatedWorker(imageData, config, onProgress, preferGpu);
			}

			return this.processImageInternal(imageData, config, onProgress, 0, preferGpu);
		});
	}

	/**
	 * Internal image processing method (called through queue)
	 */
	private async processImageInternal(
		imageData: ImageData,
		config: AlgorithmConfig,
		onProgress?: (progress: ProcessingProgress) => void,
		retryAttempt: number = 0,
		preferGpu: boolean = false
	): Promise<ProcessingResult> {
		try {
			// Set progress callback
			this.progressCallback = onProgress || null;


			// Serialize config to plain object (removes Proxy wrapper from Svelte stores)
			const plainConfig = JSON.parse(JSON.stringify(config));

			// Ensure critical defaults are included (in case they got lost in serialization)
			// Note: passCount only exists on EdgeConfig, not on all AlgorithmConfig types
			if (plainConfig.algorithm === 'edge' && plainConfig.passCount === undefined) {
				plainConfig.passCount = 1;
			}


			// Send processing request to worker
			const result = await this.sendMessage('process', {
				imageData: {
					data: Array.from(imageData.data), // Convert Uint8ClampedArray to regular array for serialization
					width: imageData.width,
					height: imageData.height
				},
				config: plainConfig,
				preferGpu: preferGpu
			});

			if (!result.success) {
				throw new Error(result.error || 'Processing failed');
			}

			// Extract SVG data - check both direct access and payload
			const svgData = result.svg || (result.payload && result.payload.svg);
			const processingTime =
				result.processingTime || (result.payload && result.payload.processingTime);
			const pathCount =
				result.pathCount ||
				(result.payload && result.payload.stats && result.payload.stats.pathCount);

			if (!svgData) {
				console.error('[WasmWorkerService]  No SVG data found in result:', result);
				throw new Error('No SVG data returned from worker');
			}

			// Check for large result and add memory management
			const svgSize = new Blob([svgData]).size;
			const sizeMB = svgSize / (1024 * 1024);

			if (sizeMB > 10) {
				console.warn(`[WasmWorkerService] 📊 Large SVG result: ${sizeMB.toFixed(1)}MB`);

				// Trigger garbage collection hint for large results
				if ('gc' in window && typeof window.gc === 'function') {
					window.gc();
				}

				// Add processing delay for memory stability
				await new Promise((resolve) => setTimeout(resolve, 100));
			}

			// Return successful result
			return {
				svg: svgData,
				processing_time_ms: processingTime || 0,
				// config_used will be set by the higher-level vectorizer-service
				config_used: {} as any, // Placeholder - will be overwritten by vectorizer-service
				statistics: {
					input_dimensions: [imageData.width, imageData.height] as [number, number],
					paths_generated: pathCount || 0,
					compression_ratio: svgSize / (imageData.width * imageData.height * 4)
				}
			};
		} catch (error) {
			console.error('[WasmWorkerService] Processing failed:', error);
			console.log('[WasmWorkerService] Error structure:', {
				message: (error as any)?.message,
				wasmErrorType: (error as any)?.wasmErrorType,
				hasOriginalError: !!(error as any)?.originalError,
				originalMessage: (error as any)?.originalError?.message
			});

			// Check if this is a timeout or memory error for large images - attempt fallback
			const pixelCount = imageData.width * imageData.height;
			const megapixels = pixelCount / 1_000_000;
			const isLargeImage = megapixels > 10;
			const errorMsg = error instanceof Error ? error.message : String(error);

			if (
				isLargeImage &&
				retryAttempt === 0 &&
				(errorMsg.includes('timeout') ||
					errorMsg.includes('memory') ||
					errorMsg.includes('out of bounds'))
			) {
				console.warn(
					`[WasmWorkerService] 🔄 Large image (${megapixels.toFixed(1)}MP) failed, attempting recovery with reduced settings...`
				);

				// Try again with simplified settings for large images
				const fallbackConfig = {
					...config,
					detail: Math.min(config.detail || 0.5, 0.3), // Reduce detail
					threadCount: 1, // Single thread for stability
					maxProcessingTimeMs: 600000, // 10 minutes maximum
					// Add passCount only for Edge algorithm
					...(config.algorithm === 'edge' ? { passCount: 1 } : {})
				};

				try {

					// Force worker restart for clean state
					await this.handleCriticalError(error);

					// Recursive call with fallback config (prevent infinite recursion)
					return await this.processImageInternal(
						imageData,
						fallbackConfig,
						onProgress,
						retryAttempt + 1,
						preferGpu
					);
				} catch (fallbackError) {
					console.error('[WasmWorkerService] Fallback processing also failed:', fallbackError);
					// Fall through to throw the original error
				}
			} else if (retryAttempt > 0) {
				console.warn(
					`[WasmWorkerService] 🚫 Already attempted fallback for large image, not retrying again`
				);
			}

			// Check if this is a critical WASM error that requires worker restart
			if (this.isCriticalWasmError(error)) {
				console.warn('[WasmWorkerService] Critical WASM error detected, restarting worker...');
				await this.handleCriticalError(error);
			} else if ((error as any)?.message?.includes?.('Processing failed due to internal error')) {
				// Additional fallback for masked critical errors
				console.warn(
					'[WasmWorkerService] Suspected critical error based on message, forcing restart...'
				);
				await this.handleCriticalError(error);
			}

			const processingError: VectorizerError = {
				type: 'processing',
				message: isLargeImage
					? 'Failed to process large image - try reducing detail level or image size'
					: 'Failed to process image',
				details: error instanceof Error ? error.message : String(error)
			};

			throw processingError;
		} finally {
			this.progressCallback = null;
		}
	}

	/**
	 * Process image with isolated worker for high-intensity operations
	 * Creates a fresh worker instance to prevent thread pool corruption
	 */
	private async processImageWithIsolatedWorker(
		imageData: ImageData,
		config: AlgorithmConfig,
		onProgress?: (progress: ProcessingProgress) => void,
		preferGpu: boolean = false
	): Promise<ProcessingResult> {
		let isolatedWorker: Worker | null = null;
		const pendingMessages = new Map<
			string,
			{ resolve: (value: any) => void; reject: (reason: any) => void }
		>();

		// GPU preference is passed as parameter to avoid duplicate detection
		if (preferGpu) {
			console.log('[WasmWorkerService] 🚀 GPU acceleration enabled for isolated worker');
		} else {
			console.log('[WasmWorkerService] 💻 CPU processing for isolated worker');
		}

		try {
			console.log('[WasmWorkerService] 🚀 Creating isolated worker for high-intensity operation');

			// Create fresh isolated worker
			isolatedWorker = new Worker(new URL('../workers/wasm-processor.worker', import.meta.url), {
				type: 'module'
			});

			// Set up isolated worker message handler
			isolatedWorker.addEventListener('message', (event) => {
				const { type, id, data, error } = event.data;

				if (type === 'progress' && onProgress) {
					onProgress(data);
					return;
				}

				const pending = pendingMessages.get(id);
				if (pending) {
					pendingMessages.delete(id);
					if (error) {
						pending.reject(new Error(error));
					} else {
						pending.resolve(data);
					}
				}
			});

			// Set up isolated worker error handler
			isolatedWorker.addEventListener('error', (error) => {
				console.error('[WasmWorkerService] Isolated worker error:', error);
				// Reject all pending promises
				for (const [_id, pending] of pendingMessages) {
					pending.reject(new Error(`Isolated worker error: ${error.message}`));
				}
				pendingMessages.clear();
			});

			// Helper function to send message to isolated worker
			const sendIsolatedMessage = (type: string, payload?: any): Promise<any> => {
				return new Promise((resolve, reject) => {
					const id = generateMessageId();
					pendingMessages.set(id, { resolve, reject });

					isolatedWorker!.postMessage({ type, id, payload });

					// Dynamic timeout for isolated worker operations
					const pixelCount = imageData.width * imageData.height;
					const megapixels = pixelCount / 1_000_000;
					let timeout = 60000; // Base 1 minute

					// Increase timeout for multi-pass processing
					const passCount = (config as any).passCount; // Only EdgeConfig has passCount
					if (passCount && passCount >= 8) timeout = 120000; // 2 minutes for 8+ passes

					// Further increase timeout for very large images
					if (megapixels > 20) {
						timeout = Math.max(timeout, 300000); // 5 minutes minimum for 20MP+
					} else if (megapixels > 15) {
						timeout = Math.max(timeout, 240000); // 4 minutes for 15MP+
					}
					setTimeout(() => {
						if (pendingMessages.has(id)) {
							pendingMessages.delete(id);
							reject(new Error(`Isolated worker operation timeout after ${timeout}ms`));
						}
					}, timeout);
				});
			};

			// Initialize isolated worker WASM
			console.log('[WasmWorkerService] 🔧 Initializing isolated worker WASM module');
			await sendIsolatedMessage('init', {
				backend: config.algorithm
			});

			// Process with isolated worker
			console.log('[WasmWorkerService] 🎯 Processing with isolated worker');
			const plainConfig = JSON.parse(JSON.stringify(config));

			// Ensure critical defaults are included for isolated worker too
			if (plainConfig.algorithm === 'edge' && plainConfig.passCount === undefined) {
				plainConfig.passCount = 1;
				console.log(
					'[WasmWorkerService] 🔧 Adding missing passCount default=1 to isolated Edge config'
				);
			}

			const result = await sendIsolatedMessage('process', {
				imageData: {
					data: Array.from(imageData.data),
					width: imageData.width,
					height: imageData.height
				},
				config: plainConfig,
				preferGpu: preferGpu
			});

			console.log('[WasmWorkerService]  Isolated worker processing complete');
			return result;
		} catch (error) {
			console.error('[WasmWorkerService] Isolated worker processing failed:', error);
			throw error;
		} finally {
			// Clean up isolated worker
			if (isolatedWorker) {
				console.log('[WasmWorkerService] 🧹 Terminating isolated worker');
				isolatedWorker.terminate();
				isolatedWorker = null;
			}
			pendingMessages.clear();
		}
	}

	/**
	 * Handle critical WASM errors with robust restart mechanism
	 */
	private async handleCriticalError(_error: any): Promise<void> {
		try {
			this.workerState = WorkerState.RESTARTING;

			// 1. Reject all pending requests immediately
			const pendingCount = pendingRequests.size;
			for (const [_id, pending] of pendingRequests) {
				pending.reject(new Error('Worker restarting due to critical error'));
			}
			pendingRequests.clear();

			// 2. Clear processing queue
			this.processingQueue = [];
			this.isProcessingQueue = false;

			// 3. Terminate worker forcefully
			if (this.worker) {
				this.worker.terminate();
				this.worker = null;
			}

			// 4. Reset all state
			this.isInitialized = false;
			this.initPromise = null;
			this.progressCallback = null;

			// 5. Wait for cleanup to propagate
			await new Promise((resolve) => setTimeout(resolve, 500));

			// 6. Reset to idle state
			this.workerState = WorkerState.IDLE;

			console.log(
				`[WasmWorkerService] Critical error recovery complete, dropped ${pendingCount} pending requests`
			);
		} catch (restartError) {
			console.error('[WasmWorkerService] Error during critical error handling:', restartError);
			// Force reset everything even if cleanup fails
			this.worker = null;
			this.isInitialized = false;
			this.initPromise = null;
			this.progressCallback = null;
			this.workerState = WorkerState.IDLE;
			this.processingQueue = [];
			this.isProcessingQueue = false;
			pendingRequests.clear();
		}
	}

	/**
	 * Check if an error is a critical WASM error that requires worker restart
	 */
	private isCriticalWasmError(error: any): boolean {
		// Check for preserved WASM error type first (from worker error handling)
		if (error?.wasmErrorType) {
			const criticalWasmTypes = [
				'unreachable executed',
				'RuntimeError',
				'memory access out of bounds'
			];
			if (criticalWasmTypes.includes(error.wasmErrorType)) {
				console.log(
					`[WasmWorkerService] Critical WASM error detected via wasmErrorType: ${error.wasmErrorType}`
				);
				return true;
			}
		}

		// Check original error if available
		if (error?.originalError?.message) {
			const originalMessage = String(error.originalError.message);
			console.log(`[WasmWorkerService] Checking original error message: ${originalMessage}`);
			if (
				originalMessage.includes('unreachable executed') ||
				originalMessage.includes('RuntimeError') ||
				originalMessage.includes('memory access out of bounds')
			) {
				return true;
			}
		}

		// Fallback to checking the main error message
		const errorMessage = error instanceof Error ? error.message : String(error);
		const criticalErrors = [
			'unreachable executed',
			'RuntimeError',
			'wasm is not instantiated',
			'WebAssembly.instantiate',
			'memory out of bounds',
			'recursive use of an object',
			'already borrowed',
			'index out of bounds',
			'wasm function signature contains illegal type',
			'Configuration build failed',
			'Validation failed'
		];

		return criticalErrors.some((criticalError) =>
			errorMessage.toLowerCase().includes(criticalError.toLowerCase())
		);
	}

	/**
	 * Abort current processing
	 */
	async abort(): Promise<void> {
		if (this.worker) {
			try {
				await this.sendMessage('abort');
			} catch (error) {
				console.warn('[WasmWorkerService] Abort message failed:', error);
			}
		}
	}

	/**
	 * Force reset worker state - cancels all operations and clears queue
	 * Use this when UI state is reset (like Clear All button)
	 */
	async forceReset(): Promise<void> {
		console.log('[WasmWorkerService] 🔄 Force reset initiated - cancelling all operations');

		try {
			// 1. Mark as restarting to prevent new operations
			this.workerState = WorkerState.RESTARTING;

			// 2. Abort current processing if any
			await this.abort();

			// 3. Reject all pending requests
			const pendingCount = pendingRequests.size;
			for (const [_id, pending] of pendingRequests) {
				pending.reject(new Error('Force reset - operation cancelled'));
			}
			pendingRequests.clear();

			// 4. Clear processing queue
			this.processingQueue = [];
			this.isProcessingQueue = false;

			// 5. Wait a moment for cleanup to propagate
			await new Promise((resolve) => setTimeout(resolve, 100));

			// 6. Reset to idle state
			this.workerState = WorkerState.IDLE;

			console.log(
				`[WasmWorkerService]  Force reset complete - cancelled ${pendingCount} operations`
			);
		} catch (error) {
			console.error('[WasmWorkerService] Error during force reset:', error);
			// Force reset state anyway
			this.workerState = WorkerState.IDLE;
			this.processingQueue = [];
			this.isProcessingQueue = false;
			pendingRequests.clear();
		}
	}

	/**
	 * Clean up worker and resources
	 */
	cleanup(): void {
		if (this.worker) {
			// Send cleanup message
			this.sendMessage('cleanup').catch(() => {});

			// Terminate worker
			this.worker.terminate();
			this.worker = null;
		}

		// Clear pending requests
		pendingRequests.clear();

		// Reset state
		this.isInitialized = false;
		this.initPromise = null;
		this.progressCallback = null;

		console.log('[WasmWorkerService] Cleanup complete');
	}

	/**
	 * Check if service is initialized
	 */
	get initialized(): boolean {
		return this.isInitialized;
	}
}

// Export singleton instance
// Lazy getter to avoid SSR instantiation - simple proxy approach
let _wasmWorkerServiceInstance: WasmWorkerService | null = null;
export const wasmWorkerService = new Proxy({} as WasmWorkerService, {
	get(target, prop) {
		if (!_wasmWorkerServiceInstance) {
			_wasmWorkerServiceInstance = WasmWorkerService.getInstance();
		}
		const value = (_wasmWorkerServiceInstance as any)[prop];
		if (typeof value === 'function') {
			return value.bind(_wasmWorkerServiceInstance);
		}
		return value;
	}
});
