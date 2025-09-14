/**
 * VectorizerService - Core Service Layer Abstraction (Refactored)
 *
 * This service provides a high-level API for image vectorization,
 * decoupling the frontend from worker implementation details and
 * providing a clean, promise-based interface with proper error handling.
 */

import {
	MessageFactory,
	type VectorizerConfiguration,
	type SerializedImageData,
	ProcessingStage
} from '../types/worker-protocol';
import { WorkerPool } from './worker-pool';
import { ProcessingQueue } from './processing-queue';
import { VectorizerCache } from './vectorizer-cache';
import { ProgressAggregator } from './progress-aggregator';
import { MessageValidator } from '../workers/message-validator';
import type {
	ProcessingResult,
	ProcessingOptions,
	VectorizerCapabilities
} from '../types/service-types';

/**
 * Service configuration
 */
export interface VectorizerServiceConfig {
	workerCount?: number;
	maxQueueSize?: number;
	cacheEnabled?: boolean;
	cacheMaxSize?: number;
	defaultTimeout?: number;
	retryAttempts?: number;
	retryDelay?: number;
}

/**
 * Default service configuration
 */
const DEFAULT_CONFIG: Required<VectorizerServiceConfig> = {
	workerCount: 4,
	maxQueueSize: 100,
	cacheEnabled: true,
	cacheMaxSize: 50,
	defaultTimeout: 120000, // 2 minutes
	retryAttempts: 3,
	retryDelay: 1000
};

/**
 * Processing request handle
 */
export interface ProcessingHandle {
	id: string;
	cancel: () => void;
	priority: number;
	setPriority: (priority: number) => void;
	getProgress: () => { stage: ProcessingStage; percent: number; message: string };
	promise: Promise<ProcessingResult>;
}

/**
 * Main VectorizerService class
 */
export class VectorizerServiceRefactored {
	private config: Required<VectorizerServiceConfig>;
	private workerPool: WorkerPool;
	private processingQueue: ProcessingQueue;
	private cache: VectorizerCache;
	private progressAggregator: ProgressAggregator;
	private initialized = false;
	private capabilities: VectorizerCapabilities | null = null;
	private activeRequests = new Map<string, ProcessingHandle>();

	constructor(config: VectorizerServiceConfig = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };

		// Initialize sub-services
		this.workerPool = new WorkerPool({
			maxWorkers: this.config.workerCount,
			workerPath: '/workers/wasm-processor.worker.js'
		});

		this.processingQueue = new ProcessingQueue({
			maxConcurrent: 2,
			maxSize: this.config.maxQueueSize
		});

		this.cache = new VectorizerCache({
			enabled: this.config.cacheEnabled,
			maxSize: this.config.cacheMaxSize
		});

		this.progressAggregator = new ProgressAggregator();
	}

	/**
	 * Initialize the service
	 */
	async initialize(): Promise<void> {
		if (this.initialized) {
			return;
		}

		try {
			// Initialize worker pool
			await this.workerPool.initialize();

			// Get capabilities from a worker
			const worker = await this.workerPool.getWorker();
			if (!worker) {
				throw new Error('No worker available for initialization');
			}

			const message = MessageFactory.createInitializeMessage();
			const response = await this.sendMessageToWorker(worker, message);

			if (response.type === 'initialized' && response.payload.capabilities) {
				this.capabilities = response.payload.capabilities;
			}

			this.workerPool.releaseWorker(worker);
			this.initialized = true;

			console.log('[VectorizerService] Initialized with capabilities:', this.capabilities);
		} catch (error) {
			console.error('[VectorizerService] Initialization failed:', error);
			throw new Error(`Failed to initialize VectorizerService: ${error}`);
		}
	}

	/**
	 * Process an image with the given configuration
	 */
	async processImage(
		imageData: ImageData | SerializedImageData,
		config: VectorizerConfiguration,
		options: ProcessingOptions = {}
	): Promise<ProcessingResult> {
		if (!this.initialized) {
			await this.initialize();
		}

		// Serialize image data if needed
		const serializedImage = this.serializeImageData(imageData);

		// Check cache
		const cacheKey = this.cache.generateKey(serializedImage, config);
		const cachedResult = await this.cache.get(cacheKey);
		if (cachedResult) {
			console.log('[VectorizerService] Cache hit for request');
			return cachedResult;
		}

		// Create processing handle
		const handle = this.createProcessingHandle(serializedImage, config, options);
		this.activeRequests.set(handle.id, handle);

		// Add to queue
		await this.processingQueue.enqueue({
			id: handle.id,
			imageData: serializedImage,
			config,
			options,
			priority: options.priority || 0
		});

		// Process when worker available
		this.processNextInQueue();

		return handle.promise;
	}

	/**
	 * Process multiple images in batch
	 */
	async processBatch(
		images: Array<{ imageData: ImageData | SerializedImageData; config: VectorizerConfiguration }>,
		options: ProcessingOptions = {}
	): Promise<ProcessingResult[]> {
		const promises = images.map(({ imageData, config }) =>
			this.processImage(imageData, config, options)
		);

		return Promise.all(promises);
	}

	/**
	 * Cancel a processing request
	 */
	cancelRequest(requestId: string): boolean {
		const handle = this.activeRequests.get(requestId);
		if (!handle) {
			return false;
		}

		handle.cancel();
		this.activeRequests.delete(requestId);
		this.processingQueue.remove(requestId);

		return true;
	}

	/**
	 * Get current service status
	 */
	getStatus(): {
		initialized: boolean;
		activeRequests: number;
		queueLength: number;
		availableWorkers: number;
		capabilities: VectorizerCapabilities | null;
	} {
		return {
			initialized: this.initialized,
			activeRequests: this.activeRequests.size,
			queueLength: this.processingQueue.size(),
			availableWorkers: this.workerPool.getAvailableCount(),
			capabilities: this.capabilities
		};
	}

	/**
	 * Update default configuration
	 */
	updateConfiguration(config: Partial<VectorizerConfiguration>): void {
		// Update all workers with new configuration
		this.workerPool.broadcast(MessageFactory.createUpdateConfigMessage(config));
	}

	/**
	 * Clear cache
	 */
	clearCache(): void {
		this.cache.clear();
	}

	/**
	 * Shutdown the service
	 */
	async shutdown(): Promise<void> {
		// Cancel all active requests
		for (const [_id, handle] of this.activeRequests) {
			handle.cancel();
		}
		this.activeRequests.clear();

		// Clear queue
		this.processingQueue.clear();

		// Shutdown worker pool
		await this.workerPool.shutdown();

		// Clear cache
		this.cache.clear();

		this.initialized = false;
		console.log('[VectorizerService] Shutdown complete');
	}

	// Private helper methods

	private createProcessingHandle(
		imageData: SerializedImageData,
		config: VectorizerConfiguration,
		options: ProcessingOptions
	): ProcessingHandle {
		const id = this.generateRequestId();
		let isCancelled = false;
		let currentProgress = {
			stage: ProcessingStage.INITIALIZING,
			percent: 0,
			message: 'Preparing...'
		};

		// Create promise handlers
		let resolvePromise: (result: ProcessingResult) => void;
		let rejectPromise: (error: Error) => void;

		const promise = new Promise<ProcessingResult>((resolve, reject) => {
			resolvePromise = resolve;
			rejectPromise = reject;
		});

		const handle: ProcessingHandle = {
			id,
			cancel: () => {
				isCancelled = true;
				rejectPromise(new Error('Processing cancelled'));
			},
			priority: options.priority || 0,
			setPriority: (priority: number) => {
				handle.priority = priority;
				this.processingQueue.updatePriority(id, priority);
			},
			getProgress: () => currentProgress,
			promise
		};

		// Store promise handlers for later use
		(handle as any)._resolve = resolvePromise!;
		(handle as any)._reject = rejectPromise!;
		(handle as any)._updateProgress = (progress: typeof currentProgress) => {
			currentProgress = progress;
		};
		(handle as any)._isCancelled = () => isCancelled;

		return handle;
	}

	private async processNextInQueue(): Promise<void> {
		const worker = await this.workerPool.getWorker();
		if (!worker) {
			// No available workers, will retry when one becomes available
			return;
		}

		const item = await this.processingQueue.dequeue();
		if (!item) {
			// No items in queue
			this.workerPool.releaseWorker(worker);
			return;
		}

		const handle = this.activeRequests.get(item.id);
		if (!handle || (handle as any)._isCancelled()) {
			// Request was cancelled
			this.workerPool.releaseWorker(worker);
			this.processNextInQueue(); // Process next item
			return;
		}

		// Process the item
		try {
			const message = MessageFactory.createProcessImageMessage(item.imageData, item.config);

			// Set up progress tracking
			this.progressAggregator.trackRequest(item.id, (progress) => {
				(handle as any)._updateProgress(progress);
			});

			// Send to worker
			const result = await this.processWithWorker(worker, message, item.options);

			// Cache the result
			const cacheKey = this.cache.generateKey(item.imageData, item.config);
			await this.cache.set(cacheKey, result);

			// Resolve the promise
			(handle as any)._resolve(result);
		} catch (error) {
			// Reject the promise
			(handle as any)._reject(error as Error);
		} finally {
			// Clean up
			this.activeRequests.delete(item.id);
			this.progressAggregator.stopTracking(item.id);
			this.workerPool.releaseWorker(worker);

			// Process next item
			this.processNextInQueue();
		}
	}

	private async processWithWorker(
		worker: Worker,
		message: any,
		options: ProcessingOptions
	): Promise<ProcessingResult> {
		const timeout = options.timeout || this.config.defaultTimeout;
		const retryAttempts = options.retryAttempts ?? this.config.retryAttempts;
		const retryDelay = options.retryDelay ?? this.config.retryDelay;

		let lastError: Error | null = null;

		for (let attempt = 0; attempt <= retryAttempts; attempt++) {
			try {
				const response = await this.sendMessageToWorker(worker, message, timeout);

				if (response.type === 'processing-complete') {
					return {
						svg: response.payload.svg,
						stats: response.payload.stats,
						processingTime: response.payload.processingTime
					};
				} else if (response.type === 'processing-error') {
					throw new Error(response.payload.error.message);
				} else {
					throw new Error(`Unexpected response type: ${response.type}`);
				}
			} catch (error) {
				lastError = error as Error;

				if (attempt < retryAttempts) {
					console.warn(`[VectorizerService] Attempt ${attempt + 1} failed, retrying...`, error);
					await this.delay(retryDelay);
				}
			}
		}

		throw lastError || new Error('Processing failed after all retry attempts');
	}

	private sendMessageToWorker(worker: Worker, message: any, timeout?: number): Promise<any> {
		return new Promise((resolve, reject) => {
			const timeoutId = timeout
				? setTimeout(() => {
						reject(new Error('Worker timeout'));
					}, timeout)
				: null;

			const handler = (event: MessageEvent) => {
				const validation = MessageValidator.validateWorkerToMain(event.data);
				if (validation.valid && validation.data && validation.data.id === message.id) {
					if (timeoutId) clearTimeout(timeoutId);
					worker.removeEventListener('message', handler);
					resolve(validation.data);
				}
			};

			worker.addEventListener('message', handler);
			worker.postMessage(message);
		});
	}

	private serializeImageData(imageData: ImageData | SerializedImageData): SerializedImageData {
		if ('data' in imageData && 'width' in imageData && 'height' in imageData) {
			// Already serialized
			return imageData as SerializedImageData;
		}

		// Convert ImageData to SerializedImageData
		const imgData = imageData as ImageData;
		return {
			data: Array.from(imgData.data),
			width: imgData.width,
			height: imgData.height,
			colorSpace: imgData.colorSpace as 'srgb' | 'display-p3'
		};
	}

	private generateRequestId(): string {
		return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

// Export singleton instance for convenience
export const vectorizerServiceRefactored = new VectorizerServiceRefactored();
