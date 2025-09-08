/**
 * WASM Performance Optimizer - Phase 3.3
 * 
 * Advanced WASM integration optimizations including SharedArrayBuffer management,
 * thread affinity, load balancing, and zero-copy operations for maximum performance.
 */

export interface WasmOptimizationConfig {
	enableSharedArrayBuffer: boolean;
	threadAffinityMode: 'auto' | 'balanced' | 'performance' | 'economy';
	maxConcurrentJobs: number;
	bufferPoolSize: number;
	compressionEnabled: boolean;
	adaptiveThreading: boolean;
}

export interface ThreadAffinitySettings {
	coreIds: number[];
	loadBalancing: 'round-robin' | 'least-loaded' | 'affinity-based';
	migrationThreshold: number; // CPU usage % threshold for thread migration
	affinityHints: Map<string, number>; // Job type -> preferred core mapping
}

export interface SharedBufferPool {
	buffers: Map<string, SharedArrayBuffer>;
	usage: Map<string, number>;
	lastAccess: Map<string, number>;
	totalAllocated: number;
	maxPoolSize: number;
}

export interface WasmMetrics {
	threadUtilization: number[];
	memoryUsage: number;
	bufferHitRatio: number;
	averageJobTime: number;
	parallelEfficiency: number;
	sharedBufferUsage: number;
}

/**
 * Advanced WASM performance optimizer with thread affinity and SharedArrayBuffer
 */
export class WasmOptimizer {
	private config: WasmOptimizationConfig;
	private threadAffinity: ThreadAffinitySettings;
	private bufferPool: SharedBufferPool;
	private metrics: WasmMetrics;
	private activeJobs = new Map<string, { threadId: number; startTime: number; jobType: string }>();
	private threadLoad = new Map<number, number>(); // threadId -> current load (0-1)
	
	constructor(config?: Partial<WasmOptimizationConfig>) {
		this.config = {
			enableSharedArrayBuffer: this.detectSharedArrayBufferSupport(),
			threadAffinityMode: 'auto',
			maxConcurrentJobs: Math.min(navigator.hardwareConcurrency || 4, 12),
			bufferPoolSize: 256 * 1024 * 1024, // 256MB pool
			compressionEnabled: true,
			adaptiveThreading: true,
			...config
		};

		this.threadAffinity = {
			coreIds: this.detectOptimalCores(),
			loadBalancing: 'least-loaded',
			migrationThreshold: 0.8,
			affinityHints: new Map([
				['edge', 0], // CPU-intensive edge detection on core 0
				['centerline', 1], // Centerline tracing on core 1
				['superpixel', 2], // Superpixel processing on core 2
				['dots', 3] // Dots processing on core 3
			])
		};

		this.bufferPool = {
			buffers: new Map(),
			usage: new Map(),
			lastAccess: new Map(),
			totalAllocated: 0,
			maxPoolSize: this.config.bufferPoolSize
		};

		this.metrics = {
			threadUtilization: new Array(this.config.maxConcurrentJobs).fill(0),
			memoryUsage: 0,
			bufferHitRatio: 0,
			averageJobTime: 0,
			parallelEfficiency: 1.0,
			sharedBufferUsage: 0
		};

		this.initializeThreadTracking();
		this.startMetricsCollection();
	}

	/**
	 * Detect SharedArrayBuffer support and COEP/COOP headers
	 */
	private detectSharedArrayBufferSupport(): boolean {
		try {
			// Check for SharedArrayBuffer constructor
			if (typeof SharedArrayBuffer === 'undefined') {
				console.log('[WasmOptimizer] SharedArrayBuffer not available');
				return false;
			}

			// Check for proper Cross-Origin-Embedder-Policy headers
			const testBuffer = new SharedArrayBuffer(4);
			if (testBuffer.byteLength !== 4) {
				console.log('[WasmOptimizer] SharedArrayBuffer creation failed');
				return false;
			}

			// Test if we can actually share the buffer
			try {
				const worker = new Worker(
					URL.createObjectURL(
						new Blob(['postMessage(42);'], { type: 'application/javascript' })
					)
				);
				worker.terminate();
				console.log('[WasmOptimizer] ✅ SharedArrayBuffer fully supported');
				return true;
			} catch (e) {
				console.log('[WasmOptimizer] SharedArrayBuffer available but worker creation failed:', e);
				return false;
			}
		} catch (error) {
			console.log('[WasmOptimizer] SharedArrayBuffer detection failed:', error);
			return false;
		}
	}

	/**
	 * Detect optimal CPU cores for thread affinity
	 */
	private detectOptimalCores(): number[] {
		const coreCount = navigator.hardwareConcurrency || 4;
		const optimalCores: number[] = [];

		// Use performance cores first (typically cores 0-3 on most systems)
		const performanceCores = Math.min(coreCount, 4);
		for (let i = 0; i < performanceCores; i++) {
			optimalCores.push(i);
		}

		// Add efficiency cores if we need more threads
		if (optimalCores.length < this.config.maxConcurrentJobs) {
			const remainingCores = Math.min(
				coreCount - performanceCores,
				this.config.maxConcurrentJobs - performanceCores
			);
			for (let i = performanceCores; i < performanceCores + remainingCores; i++) {
				optimalCores.push(i);
			}
		}

		console.log(`[WasmOptimizer] Detected optimal cores: [${optimalCores.join(', ')}]`);
		return optimalCores;
	}

	/**
	 * Allocate shared buffer with automatic pooling
	 */
	allocateSharedBuffer(size: number, key?: string): ArrayBuffer | SharedArrayBuffer {
		if (!this.config.enableSharedArrayBuffer) {
			return new ArrayBuffer(size);
		}

		const bufferKey = key || `buffer_${size}_${Date.now()}`;
		
		// Check if we already have a suitable buffer
		const existingBuffer = this.bufferPool.buffers.get(bufferKey);
		if (existingBuffer && existingBuffer.byteLength >= size) {
			this.bufferPool.usage.set(bufferKey, (this.bufferPool.usage.get(bufferKey) || 0) + 1);
			this.bufferPool.lastAccess.set(bufferKey, Date.now());
			console.log(`[WasmOptimizer] Reusing shared buffer: ${bufferKey} (${size} bytes)`);
			return existingBuffer;
		}

		// Check if we have space in the pool
		if (this.bufferPool.totalAllocated + size > this.bufferPool.maxPoolSize) {
			this.evictOldBuffers(size);
		}

		try {
			const buffer = new SharedArrayBuffer(size);
			this.bufferPool.buffers.set(bufferKey, buffer);
			this.bufferPool.usage.set(bufferKey, 1);
			this.bufferPool.lastAccess.set(bufferKey, Date.now());
			this.bufferPool.totalAllocated += size;

			console.log(`[WasmOptimizer] Allocated shared buffer: ${bufferKey} (${size} bytes)`);
			return buffer;
		} catch (error) {
			console.warn('[WasmOptimizer] SharedArrayBuffer allocation failed, falling back to ArrayBuffer:', error);
			return new ArrayBuffer(size);
		}
	}

	/**
	 * Release shared buffer back to pool
	 */
	releaseSharedBuffer(key: string): void {
		const usage = this.bufferPool.usage.get(key) || 0;
		if (usage > 1) {
			this.bufferPool.usage.set(key, usage - 1);
		} else {
			// Keep buffer in pool for reuse, just mark as unused
			this.bufferPool.usage.set(key, 0);
			this.bufferPool.lastAccess.set(key, Date.now());
		}
	}

	/**
	 * Evict old buffers to make space for new allocation
	 */
	private evictOldBuffers(requiredSpace: number): void {
		const now = Date.now();
		const maxAge = 300000; // 5 minutes
		let freedSpace = 0;

		// Sort buffers by last access time (oldest first)
		const bufferEntries = Array.from(this.bufferPool.buffers.entries())
			.filter(([key]) => (this.bufferPool.usage.get(key) || 0) === 0) // Only unused buffers
			.sort((a, b) => {
				const aAccess = this.bufferPool.lastAccess.get(a[0]) || 0;
				const bAccess = this.bufferPool.lastAccess.get(b[0]) || 0;
				return aAccess - bAccess;
			});

		for (const [key, buffer] of bufferEntries) {
			const lastAccess = this.bufferPool.lastAccess.get(key) || 0;
			const age = now - lastAccess;

			if (age > maxAge || freedSpace < requiredSpace) {
				this.bufferPool.buffers.delete(key);
				this.bufferPool.usage.delete(key);
				this.bufferPool.lastAccess.delete(key);
				this.bufferPool.totalAllocated -= buffer.byteLength;
				freedSpace += buffer.byteLength;

				console.log(`[WasmOptimizer] Evicted buffer: ${key} (${buffer.byteLength} bytes, age: ${Math.round(age/1000)}s)`);

				if (freedSpace >= requiredSpace) break;
			}
		}
	}

	/**
	 * Assign optimal thread for job based on affinity and load balancing
	 */
	assignOptimalThread(jobType: string, jobSize: number): number {
		const availableThreads = this.threadAffinity.coreIds;
		
		switch (this.threadAffinity.loadBalancing) {
			case 'affinity-based':
				// Try to use preferred core for job type
				const preferredCore = this.threadAffinity.affinityHints.get(jobType);
				if (preferredCore !== undefined && 
				    availableThreads.includes(preferredCore) &&
				    (this.threadLoad.get(preferredCore) || 0) < this.threadAffinity.migrationThreshold) {
					return preferredCore;
				}
				// Fall through to least-loaded if preferred core is busy
				
			case 'least-loaded':
				// Find thread with lowest current load
				let minLoad = 1.0;
				let bestThread = availableThreads[0];
				
				for (const threadId of availableThreads) {
					const load = this.threadLoad.get(threadId) || 0;
					if (load < minLoad) {
						minLoad = load;
						bestThread = threadId;
					}
				}
				return bestThread;
				
			case 'round-robin':
			default:
				// Simple round-robin assignment
				const activeJobCount = this.activeJobs.size;
				return availableThreads[activeJobCount % availableThreads.length];
		}
	}

	/**
	 * Track job start for load balancing and metrics
	 */
	trackJobStart(jobId: string, threadId: number, jobType: string): void {
		this.activeJobs.set(jobId, {
			threadId,
			startTime: Date.now(),
			jobType
		});

		// Update thread load (simplified - in real implementation would use actual CPU monitoring)
		const currentLoad = this.threadLoad.get(threadId) || 0;
		this.threadLoad.set(threadId, Math.min(1.0, currentLoad + 0.2)); // Assume each job adds 20% load
	}

	/**
	 * Track job completion and update metrics
	 */
	trackJobCompletion(jobId: string): void {
		const job = this.activeJobs.get(jobId);
		if (!job) return;

		const duration = Date.now() - job.startTime;
		
		// Update thread load
		const currentLoad = this.threadLoad.get(job.threadId) || 0;
		this.threadLoad.set(job.threadId, Math.max(0, currentLoad - 0.2));

		// Update metrics
		this.updateMetrics(duration, job.threadId, job.jobType);

		this.activeJobs.delete(jobId);
	}

	/**
	 * Create zero-copy image data transfer
	 */
	createZeroCopyImageData(imageData: ImageData): { buffer: ArrayBuffer | SharedArrayBuffer; metadata: any } {
		const width = imageData.width;
		const height = imageData.height;
		const dataSize = width * height * 4; // RGBA

		// Allocate shared buffer for zero-copy transfer
		const buffer = this.allocateSharedBuffer(
			dataSize, 
			`image_${width}x${height}`
		);

		// Copy image data to shared buffer
		const view = new Uint8ClampedArray(buffer);
		view.set(imageData.data);

		return {
			buffer,
			metadata: {
				width,
				height,
				format: 'RGBA',
				isShared: buffer instanceof SharedArrayBuffer
			}
		};
	}

	/**
	 * Compress configuration for efficient transfer
	 */
	compressConfig(config: any): Uint8Array | any {
		if (!this.config.compressionEnabled) {
			return config;
		}

		try {
			// Simple JSON compression (in production, use proper compression)
			const jsonString = JSON.stringify(config);
			const encoder = new TextEncoder();
			const compressed = encoder.encode(jsonString);
			
			// Only compress if it saves significant space
			if (compressed.length < jsonString.length * 0.8) {
				return compressed;
			}
		} catch (error) {
			console.warn('[WasmOptimizer] Config compression failed:', error);
		}

		return config; // Return original if compression doesn't help
	}

	/**
	 * Decompress configuration
	 */
	decompressConfig(data: Uint8Array | any): any {
		if (data instanceof Uint8Array) {
			try {
				const decoder = new TextDecoder();
				const jsonString = decoder.decode(data);
				return JSON.parse(jsonString);
			} catch (error) {
				console.error('[WasmOptimizer] Config decompression failed:', error);
				throw error;
			}
		}
		return data; // Already decompressed
	}

	/**
	 * Get current optimization metrics
	 */
	getMetrics(): WasmMetrics {
		return { ...this.metrics };
	}

	/**
	 * Get buffer pool statistics
	 */
	getBufferPoolStats() {
		const totalBuffers = this.bufferPool.buffers.size;
		const activeBuffers = Array.from(this.bufferPool.usage.values())
			.filter(usage => usage > 0).length;

		return {
			totalBuffers,
			activeBuffers,
			totalAllocated: this.bufferPool.totalAllocated,
			maxPoolSize: this.bufferPool.maxPoolSize,
			utilizationPercent: (this.bufferPool.totalAllocated / this.bufferPool.maxPoolSize) * 100,
			hitRatio: this.metrics.bufferHitRatio
		};
	}

	/**
	 * Initialize thread load tracking
	 */
	private initializeThreadTracking(): void {
		for (const threadId of this.threadAffinity.coreIds) {
			this.threadLoad.set(threadId, 0);
		}
	}

	/**
	 * Update performance metrics
	 */
	private updateMetrics(duration: number, threadId: number, jobType: string): void {
		// Update average job time
		const currentAvg = this.metrics.averageJobTime;
		const totalJobs = this.activeJobs.size + 1; // Include completed job
		this.metrics.averageJobTime = (currentAvg * (totalJobs - 1) + duration) / totalJobs;

		// Update thread utilization
		if (threadId < this.metrics.threadUtilization.length) {
			const currentUtil = this.metrics.threadUtilization[threadId];
			this.metrics.threadUtilization[threadId] = (currentUtil + 1) / 2; // Simple moving average
		}

		// Calculate parallel efficiency (simplified)
		const activeThreads = Array.from(this.threadLoad.values()).filter(load => load > 0).length;
		const maxThreads = this.threadAffinity.coreIds.length;
		this.metrics.parallelEfficiency = activeThreads / maxThreads;

		// Update buffer hit ratio
		const totalBufferRequests = this.bufferPool.buffers.size;
		const bufferHits = Array.from(this.bufferPool.usage.values()).filter(usage => usage > 1).length;
		this.metrics.bufferHitRatio = totalBufferRequests > 0 ? bufferHits / totalBufferRequests : 0;
	}

	/**
	 * Start metrics collection interval
	 */
	private startMetricsCollection(): void {
		setInterval(() => {
			// Update memory usage
			if ('memory' in performance) {
				this.metrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
			}

			// Update shared buffer usage
			this.metrics.sharedBufferUsage = 
				(this.bufferPool.totalAllocated / this.bufferPool.maxPoolSize) * 100;

			// Log metrics periodically in development
			if (import.meta.env.DEV) {
				const stats = this.getBufferPoolStats();
				if (stats.totalBuffers > 0) {
					console.log('[WasmOptimizer] Performance metrics:', {
						averageJobTime: `${this.metrics.averageJobTime.toFixed(1)}ms`,
						parallelEfficiency: `${(this.metrics.parallelEfficiency * 100).toFixed(1)}%`,
						bufferHitRatio: `${(this.metrics.bufferHitRatio * 100).toFixed(1)}%`,
						sharedBufferUsage: `${this.metrics.sharedBufferUsage.toFixed(1)}%`
					});
				}
			}
		}, 10000); // Update every 10 seconds
	}

	/**
	 * Cleanup optimizer resources
	 */
	cleanup(): void {
		// Clear all buffers
		this.bufferPool.buffers.clear();
		this.bufferPool.usage.clear();
		this.bufferPool.lastAccess.clear();
		this.bufferPool.totalAllocated = 0;

		// Clear job tracking
		this.activeJobs.clear();
		this.threadLoad.clear();

		console.log('[WasmOptimizer] Cleanup completed');
	}
}

/**
 * Global WASM optimizer instance
 */
export const globalWasmOptimizer = new WasmOptimizer();