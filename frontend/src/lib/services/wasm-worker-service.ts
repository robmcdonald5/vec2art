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
	VectorizerConfig,
	ProcessingProgress,
	ProcessingResult,
	VectorizerError
} from '$lib/types/vectorizer';

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

		if (this.isInitialized) {
			return;
		}

		if (this.initPromise) {
			return this.initPromise;
		}

		this.initPromise = this._doInitialize(options);
		return this.initPromise;
	}

	private async _doInitialize(options?: { threadCount?: number; backend?: string }): Promise<void> {
		try {
			console.log('[WasmWorkerService] Initializing Web Worker...');

			// Create Web Worker
			this.worker = new Worker(new URL('../workers/wasm-processor.worker.ts', import.meta.url), {
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
			console.log('[WasmWorkerService] ✅ Initialization complete', result);
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

		// Handle progress updates
		if (type === 'progress') {
			if (this.progressCallback) {
				this.progressCallback(data);
			}
			return;
		}

		// Handle request responses
		const pending = pendingRequests.get(id);
		if (pending) {
			pendingRequests.delete(id);

			if (type === 'success') {
				pending.resolve(data);
			} else if (type === 'error') {
				pending.reject(new Error(error || 'Unknown worker error'));
			}
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

		return new Promise((resolve, reject) => {
			// Store pending request
			pendingRequests.set(id, { resolve, reject });

			// Send message to worker
			this.worker!.postMessage({ type, id, payload });

			// Set timeout for response
			setTimeout(() => {
				if (pendingRequests.has(id)) {
					pendingRequests.delete(id);
					reject(new Error(`Worker timeout for message ${type}`));
				}
			}, 60000); // 60 second timeout
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
		config: VectorizerConfig,
		onProgress?: (progress: ProcessingProgress) => void
	): Promise<ProcessingResult> {
		// Use queue to prevent race conditions when spamming converter
		return this.addToQueue(async () => {
			if (!this.isInitialized) {
				await this.initialize({
					threadCount: config.thread_count || 1,
					backend: config.backend
				});
			}

			// Use isolated worker for high-intensity operations (7+ passes)
			// This prevents thread pool corruption during intensive multipass processing
			if (config.pass_count >= 7) {
				console.log('[WasmWorkerService] High-intensity operation detected, using isolated worker');
				return this.processImageWithIsolatedWorker(imageData, config, onProgress);
			}

			return this.processImageInternal(imageData, config, onProgress);
		});
	}

	/**
	 * Internal image processing method (called through queue)
	 */
	private async processImageInternal(
		imageData: ImageData,
		config: VectorizerConfig,
		onProgress?: (progress: ProcessingProgress) => void
	): Promise<ProcessingResult> {
		try {
			// Set progress callback
			this.progressCallback = onProgress || null;

			console.log('[WasmWorkerService] Processing image:', {
				width: imageData.width,
				height: imageData.height,
				config
			});

			// Serialize config to plain object (removes Proxy wrapper from Svelte stores)
			const plainConfig = JSON.parse(JSON.stringify(config));

			// Send processing request to worker
			const result = await this.sendMessage('process', {
				imageData: {
					data: Array.from(imageData.data), // Convert Uint8ClampedArray to regular array for serialization
					width: imageData.width,
					height: imageData.height
				},
				config: plainConfig
			});

			if (!result.success) {
				throw new Error(result.error || 'Processing failed');
			}

			// Return successful result
			return {
				svg: result.svg,
				processing_time_ms: result.processingTime || 0,
				config_used: config,
				statistics: {
					input_dimensions: [imageData.width, imageData.height] as [number, number],
					paths_generated: result.pathCount || 0,
					compression_ratio: new Blob([result.svg]).size / (imageData.width * imageData.height * 4)
				}
			};
		} catch (error) {
			console.error('[WasmWorkerService] Processing failed:', error);

			// Check if this is a critical WASM error that requires worker restart
			if (this.isCriticalWasmError(error)) {
				console.warn('[WasmWorkerService] Critical WASM error detected, restarting worker...');
				await this.handleCriticalError(error);
			}

			const processingError: VectorizerError = {
				type: 'processing',
				message: 'Failed to process image',
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
		config: VectorizerConfig,
		onProgress?: (progress: ProcessingProgress) => void
	): Promise<ProcessingResult> {
		let isolatedWorker: Worker | null = null;
		const pendingMessages = new Map<string, { resolve: (value: any) => void; reject: (reason: any) => void }>();
		
		try {
			console.log('[WasmWorkerService] 🚀 Creating isolated worker for high-intensity operation');
			
			// Create fresh isolated worker
			isolatedWorker = new Worker(new URL('../workers/wasm-processor.worker.ts', import.meta.url), {
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
				for (const [id, pending] of pendingMessages) {
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
					
					// Timeout for isolated worker operations (longer for high-intensity)
					const timeout = config.pass_count >= 8 ? 120000 : 60000; // 2min for 8+, 1min for 7
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
				threadCount: config.thread_count || 1,
				backend: config.backend
			});

			// Process with isolated worker
			console.log('[WasmWorkerService] 🎯 Processing with isolated worker');
			const plainConfig = JSON.parse(JSON.stringify(config));
			
			const result = await sendIsolatedMessage('process', {
				imageData: {
					data: Array.from(imageData.data),
					width: imageData.width,
					height: imageData.height
				},
				config: plainConfig
			});

			console.log('[WasmWorkerService] ✅ Isolated worker processing complete');
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
	private async handleCriticalError(error: any): Promise<void> {
		try {
			this.workerState = WorkerState.RESTARTING;

			// 1. Reject all pending requests immediately
			const pendingCount = pendingRequests.size;
			for (const [id, pending] of pendingRequests) {
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
			'wasm function signature contains illegal type'
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
			await this.sendMessage('abort');
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
export const wasmWorkerService = WasmWorkerService.getInstance();
