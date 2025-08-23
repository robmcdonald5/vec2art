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
const pendingRequests = new Map<string, {
	resolve: (value: any) => void;
	reject: (reason: any) => void;
}>();

export class WasmWorkerService {
	private static instance: WasmWorkerService | null = null;
	private worker: Worker | null = null;
	private isInitialized = false;
	private initPromise: Promise<void> | null = null;
	private progressCallback: ((progress: ProcessingProgress) => void) | null = null;
	
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
	async initialize(options?: { threadCount?: number, backend?: string }): Promise<void> {
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
	
	private async _doInitialize(options?: { threadCount?: number, backend?: string }): Promise<void> {
		try {
			console.log('[WasmWorkerService] Initializing Web Worker...');
			
			// Create Web Worker
			this.worker = new Worker(
				new URL('../workers/wasm-processor.worker.ts', import.meta.url),
				{ type: 'module' }
			);
			
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
	 * Process an image using WASM in Web Worker
	 */
	async processImage(
		imageData: ImageData,
		config: VectorizerConfig,
		onProgress?: (progress: ProcessingProgress) => void
	): Promise<ProcessingResult> {
		if (!this.isInitialized) {
			await this.initialize({ 
				threadCount: config.thread_count || 1,
				backend: config.backend 
			});
		}
		
		try {
			// Set progress callback
			this.progressCallback = onProgress || null;
			
			console.log('[WasmWorkerService] Processing image:', { width: imageData.width, height: imageData.height, config });
			
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
				this.cleanup();
				// Mark as uninitialized so it will reinitialize on next use
				this.isInitialized = false;
				this.initPromise = null;
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
		
		return criticalErrors.some(criticalError => 
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