/**
 * WorkerPool - Manages a pool of Web Workers for parallel processing
 *
 * This module provides efficient worker management with automatic
 * lifecycle handling, health monitoring, and load balancing.
 */

import type { WorkerInstance, WorkerPoolConfig } from '../types/service-types';
import { WorkerStateMachine } from '../workers/worker-state-machine';
import type { MainToWorkerMessage, WorkerToMainMessage } from '../types/worker-protocol';

/**
 * Default worker pool configuration
 */
const DEFAULT_CONFIG: Required<WorkerPoolConfig> = {
	maxWorkers: 4,
	workerPath: '/workers/wasm-processor.worker.js',
	initTimeout: 30000,
	healthCheckInterval: 60000
};

/**
 * Worker pool statistics
 */
export interface WorkerPoolStats {
	totalWorkers: number;
	availableWorkers: number;
	busyWorkers: number;
	errorWorkers: number;
	readyWorkers: number; // Alias for availableWorkers
	totalProcessed: number;
	averageProcessingTime: number;
}

/**
 * WorkerPool class for managing multiple workers
 */
export class WorkerPool {
	private config: Required<WorkerPoolConfig>;
	private workers: Map<string, WorkerInstance> = new Map();
	private availableWorkers: Set<string> = new Set();
	private busyWorkers: Set<string> = new Set();
	private errorWorkers: Set<string> = new Set();
	private workerStateMap: Map<string, WorkerStateMachine> = new Map();
	private waitQueue: Array<(worker: Worker | null) => void> = [];
	private healthCheckInterval: NodeJS.Timeout | null = null;
	private initialized = false;
	private totalProcessed = 0;
	private processingTimes: number[] = [];

	constructor(config: WorkerPoolConfig) {
		this.config = { ...DEFAULT_CONFIG, ...config };
	}

	/**
	 * Initialize the worker pool
	 */
	async initialize(): Promise<void> {
		if (this.initialized) {
			return;
		}

		console.log(`[WorkerPool] Initializing with ${this.config.maxWorkers} workers`);

		// Create workers
		const initPromises: Promise<void>[] = [];
		for (let i = 0; i < this.config.maxWorkers; i++) {
			initPromises.push(this.createWorker());
		}

		// Wait for all workers to initialize
		await Promise.all(initPromises);

		// Start health monitoring
		this.startHealthMonitoring();

		this.initialized = true;
		console.log(`[WorkerPool] Initialized with ${this.workers.size} workers`);
	}

	/**
	 * Get an available worker
	 */
	async getWorker(): Promise<Worker | null> {
		// Return immediately if worker available
		if (this.availableWorkers.size > 0) {
			const workerId = this.availableWorkers.values().next().value;
			if (!workerId) {
				throw new Error('Available worker ID is undefined');
			}

			const workerInstance = this.workers.get(workerId);

			if (workerInstance) {
				this.availableWorkers.delete(workerId);
				this.busyWorkers.add(workerId);
				workerInstance.state = 'busy';
				workerInstance.lastUsed = Date.now();

				return workerInstance.worker;
			}
		}

		// Try to recover error workers
		if (this.errorWorkers.size > 0) {
			await this.recoverErrorWorkers();
			// Recursive call after recovery attempt
			return this.getWorker();
		}

		// Wait for a worker to become available
		return new Promise<Worker | null>((resolve) => {
			this.waitQueue.push(resolve);

			// Timeout after 10 seconds
			setTimeout(() => {
				const index = this.waitQueue.indexOf(resolve);
				if (index !== -1) {
					this.waitQueue.splice(index, 1);
					resolve(null);
				}
			}, 10000);
		});
	}

	/**
	 * Release a worker back to the pool
	 */
	releaseWorker(worker: Worker): void {
		// Find the worker instance
		let workerId: string | null = null;
		for (const [id, instance] of this.workers) {
			if (instance.worker === worker) {
				workerId = id;
				break;
			}
		}

		if (!workerId) {
			console.warn('[WorkerPool] Attempted to release unknown worker');
			return;
		}

		const workerInstance = this.workers.get(workerId)!;

		// Update state
		this.busyWorkers.delete(workerId);
		this.availableWorkers.add(workerId);
		workerInstance.state = 'idle';
		workerInstance.processedCount++;
		this.totalProcessed++;

		// Process wait queue
		if (this.waitQueue.length > 0) {
			const waiter = this.waitQueue.shift()!;
			this.getWorker().then(waiter);
		}
	}

	/**
	 * Broadcast a message to all workers
	 */
	broadcast(message: MainToWorkerMessage): void {
		for (const instance of this.workers.values()) {
			instance.worker.postMessage(message);
		}
	}

	/**
	 * Get the number of available workers
	 */
	getAvailableCount(): number {
		return this.availableWorkers.size;
	}

	/**
	 * Get worker capabilities
	 */
	getCapabilities() {
		return {
			maxWorkers: this.config.maxWorkers,
			currentWorkers: this.workers.size,
			supportsWebWorkers: typeof Worker !== 'undefined',
			supportsSharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
			supportsWebAssembly: typeof WebAssembly !== 'undefined'
		};
	}

	/**
	 * Get pool statistics
	 */
	getStats(): WorkerPoolStats {
		const avgProcessingTime =
			this.processingTimes.length > 0
				? this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length
				: 0;

		return {
			totalWorkers: this.workers.size,
			availableWorkers: this.availableWorkers.size,
			busyWorkers: this.busyWorkers.size,
			errorWorkers: this.errorWorkers.size,
			readyWorkers: this.availableWorkers.size, // Alias for availableWorkers
			totalProcessed: this.totalProcessed,
			averageProcessingTime: avgProcessingTime
		};
	}

	/**
	 * Shutdown the worker pool
	 */
	async shutdown(): Promise<void> {
		console.log('[WorkerPool] Shutting down...');

		// Stop health monitoring
		if (this.healthCheckInterval) {
			clearInterval(this.healthCheckInterval);
			this.healthCheckInterval = null;
		}

		// Clear wait queue
		for (const waiter of this.waitQueue) {
			waiter(null);
		}
		this.waitQueue = [];

		// Terminate all workers
		const terminatePromises: Promise<void>[] = [];
		for (const [id, _instance] of this.workers) {
			terminatePromises.push(this.terminateWorker(id));
		}

		await Promise.all(terminatePromises);

		// Clear collections
		this.workers.clear();
		this.availableWorkers.clear();
		this.busyWorkers.clear();
		this.errorWorkers.clear();
		this.workerStateMap.clear();

		this.initialized = false;
		console.log('[WorkerPool] Shutdown complete');
	}

	/**
	 * Resize the worker pool
	 */
	async resize(newSize: number): Promise<void> {
		const currentSize = this.workers.size;

		if (newSize === currentSize) {
			return;
		}

		console.log(`[WorkerPool] Resizing from ${currentSize} to ${newSize} workers`);

		if (newSize > currentSize) {
			// Add workers
			const addPromises: Promise<void>[] = [];
			for (let i = currentSize; i < newSize; i++) {
				addPromises.push(this.createWorker());
			}
			await Promise.all(addPromises);
		} else {
			// Remove workers (prefer removing idle ones)
			const toRemove = currentSize - newSize;
			let removed = 0;

			// First remove idle workers
			for (const workerId of this.availableWorkers) {
				if (removed >= toRemove) break;
				await this.terminateWorker(workerId);
				removed++;
			}

			// Then remove error workers
			for (const workerId of this.errorWorkers) {
				if (removed >= toRemove) break;
				await this.terminateWorker(workerId);
				removed++;
			}

			// Finally remove busy workers if necessary (dangerous!)
			if (removed < toRemove) {
				console.warn('[WorkerPool] Removing busy workers, processing may be interrupted');
				for (const workerId of this.busyWorkers) {
					if (removed >= toRemove) break;
					await this.terminateWorker(workerId);
					removed++;
				}
			}
		}

		this.config.maxWorkers = newSize;
	}

	// Private helper methods

	private async createWorker(): Promise<void> {
		const workerId = this.generateWorkerId();

		try {
			const worker = new Worker(this.config.workerPath, { type: 'module' });
			const stateMachine = new WorkerStateMachine();

			// Set up message handlers
			worker.addEventListener('message', (event: MessageEvent) => {
				this.handleWorkerMessage(workerId, event.data);
			});

			worker.addEventListener('error', (error: ErrorEvent) => {
				this.handleWorkerError(workerId, error);
			});

			// Create worker instance
			const instance: WorkerInstance = {
				id: workerId,
				worker,
				state: 'idle',
				lastUsed: Date.now(),
				processedCount: 0
			};

			// Store worker
			this.workers.set(workerId, instance);
			this.workerStateMap.set(workerId, stateMachine);
			this.availableWorkers.add(workerId);

			// Initialize worker with timeout
			await this.initializeWorker(worker, stateMachine);

			console.log(`[WorkerPool] Worker ${workerId} created and initialized`);
		} catch (_error) {
			console.error(`[WorkerPool] Failed to create worker ${workerId}:`, _error);
			throw _error;
		}
	}

	private async initializeWorker(worker: Worker, stateMachine: WorkerStateMachine): Promise<void> {
		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				reject(new Error('Worker initialization timeout'));
			}, this.config.initTimeout);

			const handler = (event: MessageEvent) => {
				const message = event.data as WorkerToMainMessage;
				if (message.type === 'initialized' || message.type === 'ready') {
					clearTimeout(timeout);
					worker.removeEventListener('message', handler);
					stateMachine.handleMessage(message);
					resolve();
				}
			};

			worker.addEventListener('message', handler);

			// Send initialization message
			worker.postMessage({
				type: 'initialize',
				id: this.generateMessageId(),
				payload: {}
			});
		});
	}

	private async terminateWorker(workerId: string): Promise<void> {
		const instance = this.workers.get(workerId);
		if (!instance) {
			return;
		}

		// Remove from all sets
		this.availableWorkers.delete(workerId);
		this.busyWorkers.delete(workerId);
		this.errorWorkers.delete(workerId);

		// Terminate the worker
		instance.worker.terminate();

		// Remove from maps
		this.workers.delete(workerId);
		this.workerStateMap.delete(workerId);

		console.log(`[WorkerPool] Worker ${workerId} terminated`);
	}

	private handleWorkerMessage(workerId: string, message: WorkerToMainMessage): void {
		const stateMachine = this.workerStateMap.get(workerId);
		if (stateMachine) {
			stateMachine.handleMessage(message);
		}
	}

	private handleWorkerError(workerId: string, error: ErrorEvent): void {
		console.error(`[WorkerPool] Worker ${workerId} error:`, error);

		const instance = this.workers.get(workerId);
		if (!instance) {
			return;
		}

		// Move to error state
		this.availableWorkers.delete(workerId);
		this.busyWorkers.delete(workerId);
		this.errorWorkers.add(workerId);
		instance.state = 'error';

		// Try to create a replacement worker if below minimum
		if (this.workers.size < this.config.maxWorkers) {
			this.createWorker().catch((err) => {
				console.error('[WorkerPool] Failed to create replacement worker:', err);
			});
		}
	}

	private async recoverErrorWorkers(): Promise<void> {
		const errorWorkerIds = Array.from(this.errorWorkers);

		for (const workerId of errorWorkerIds) {
			try {
				// Terminate the error worker
				await this.terminateWorker(workerId);

				// Create a new worker
				await this.createWorker();

				console.log(`[WorkerPool] Recovered error worker ${workerId}`);
			} catch (_error) {
				console.error(`[WorkerPool] Failed to recover worker ${workerId}:`, _error);
			}
		}
	}

	private startHealthMonitoring(): void {
		if (this.config.healthCheckInterval <= 0) {
			return;
		}

		this.healthCheckInterval = setInterval(() => {
			this.performHealthCheck();
		}, this.config.healthCheckInterval);
	}

	private async performHealthCheck(): Promise<void> {
		console.log('[WorkerPool] Performing health check...');

		for (const [workerId, instance] of this.workers) {
			if (instance.state === 'idle') {
				// Send a status request
				const message = {
					type: 'get-status',
					id: this.generateMessageId()
				};

				try {
					await this.sendMessageWithTimeout(instance.worker, message, 5000);
				} catch (_error) {
					console.warn(`[WorkerPool] Worker ${workerId} failed health check`);
					this.handleWorkerError(workerId, new ErrorEvent('Health check failed'));
				}
			}
		}

		// Log stats
		const stats = this.getStats();
		console.log('[WorkerPool] Health check complete:', stats);
	}

	private sendMessageWithTimeout(worker: Worker, message: any, timeout: number): Promise<any> {
		return new Promise((resolve, reject) => {
			const timeoutId = setTimeout(() => {
				reject(new Error('Message timeout'));
			}, timeout);

			const handler = (event: MessageEvent) => {
				if (event.data.id === message.id) {
					clearTimeout(timeoutId);
					worker.removeEventListener('message', handler);
					resolve(event.data);
				}
			};

			worker.addEventListener('message', handler);
			worker.postMessage(message);
		});
	}

	private generateWorkerId(): string {
		return `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	private generateMessageId(): string {
		return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * Record processing time for statistics
	 */
	recordProcessingTime(time: number): void {
		this.processingTimes.push(time);

		// Keep only last 100 times
		if (this.processingTimes.length > 100) {
			this.processingTimes = this.processingTimes.slice(-100);
		}
	}
}
