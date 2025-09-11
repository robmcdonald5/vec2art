/**
 * Image Data Memory Pool
 *
 * High-performance memory management for image processing with buffer recycling,
 * size-based pooling, and garbage collection optimization.
 */

export interface PooledImageData {
	buffer: ArrayBuffer;
	width: number;
	height: number;
	format: 'RGBA' | 'RGB' | 'GRAY';
	channels: number;
	poolKey: string;
	allocated: number;
	lastUsed: number;
}

export interface ImagePoolConfig {
	maxPoolSize: number;
	maxBufferAge: number; // ms
	cleanupInterval: number; // ms
	minPoolSize: number;
	preallocationSizes: Array<{ width: number; height: number; count: number }>;
}

export interface PoolStats {
	totalPools: number;
	totalBuffers: number;
	totalMemoryMB: number;
	hitRatio: number;
	allocations: number;
	releases: number;
	hits: number;
	misses: number;
}

/**
 * Memory pool manager for efficient image buffer allocation
 */
export class ImageDataPool {
	private pools = new Map<string, ArrayBuffer[]>();
	private config: ImagePoolConfig;
	private stats: PoolStats;
	private cleanupInterval: number | null = null;

	constructor(config?: Partial<ImagePoolConfig>) {
		this.config = {
			maxPoolSize: 50,
			maxBufferAge: 300000, // 5 minutes
			cleanupInterval: 60000, // 1 minute
			minPoolSize: 5,
			preallocationSizes: [
				{ width: 800, height: 600, count: 5 },
				{ width: 1024, height: 768, count: 5 },
				{ width: 1920, height: 1080, count: 3 },
				{ width: 2560, height: 1440, count: 2 }
			],
			...config
		};

		this.stats = {
			totalPools: 0,
			totalBuffers: 0,
			totalMemoryMB: 0,
			hitRatio: 0,
			allocations: 0,
			releases: 0,
			hits: 0,
			misses: 0
		};

		this.initialize();
	}

	/**
	 * Allocate image buffer from pool or create new
	 */
	allocateBuffer(
		width: number,
		height: number,
		format: 'RGBA' | 'RGB' | 'GRAY' = 'RGBA'
	): PooledImageData {
		const channels = this.getChannelCount(format);
		const bufferSize = width * height * channels;
		const poolKey = this.getPoolKey(width, height, format);

		this.stats.allocations++;

		// Try to get from pool first
		const pool = this.pools.get(poolKey);
		if (pool && pool.length > 0) {
			const buffer = pool.pop()!;
			this.stats.hits++;
			this.updateStats();

			return {
				buffer,
				width,
				height,
				format,
				channels,
				poolKey,
				allocated: Date.now(),
				lastUsed: Date.now()
			};
		}

		// Create new buffer
		this.stats.misses++;
		const buffer = new ArrayBuffer(bufferSize);
		this.updateStats();

		return {
			buffer,
			width,
			height,
			format,
			channels,
			poolKey,
			allocated: Date.now(),
			lastUsed: Date.now()
		};
	}

	/**
	 * Release buffer back to pool
	 */
	releaseBuffer(pooledData: PooledImageData): void {
		const pool = this.pools.get(pooledData.poolKey) || [];

		// Don't add if pool is full
		if (pool.length >= this.config.maxPoolSize) {
			this.stats.releases++;
			this.updateStats();
			return;
		}

		// Clear buffer before returning to pool
		this.clearBuffer(pooledData.buffer);

		pool.push(pooledData.buffer);
		this.pools.set(pooledData.poolKey, pool);

		this.stats.releases++;
		this.updateStats();
	}

	/**
	 * Get optimal buffer size for given dimensions
	 */
	getOptimalSize(width: number, height: number): { width: number; height: number } {
		// Round up to next power of 2 for better pooling
		const optimalWidth = this.nextPowerOfTwo(width);
		const optimalHeight = this.nextPowerOfTwo(height);

		// Don't make buffer too much larger than needed
		const widthRatio = optimalWidth / width;
		const heightRatio = optimalHeight / height;

		return {
			width: widthRatio <= 1.5 ? optimalWidth : width,
			height: heightRatio <= 1.5 ? optimalHeight : height
		};
	}

	/**
	 * Create ImageData from pooled buffer
	 */
	createImageData(
		pooledData: PooledImageData,
		actualWidth?: number,
		actualHeight?: number
	): ImageData {
		const width = actualWidth || pooledData.width;
		const height = actualHeight || pooledData.height;

		if (pooledData.format !== 'RGBA') {
			throw new Error('ImageData requires RGBA format');
		}

		const uint8Array = new Uint8ClampedArray(pooledData.buffer, 0, width * height * 4);

		return new ImageData(uint8Array, width, height);
	}

	/**
	 * Clone ImageData using pool
	 */
	cloneImageData(source: ImageData): { imageData: ImageData; pooledData: PooledImageData } {
		const pooledData = this.allocateBuffer(source.width, source.height, 'RGBA');
		const imageData = this.createImageData(pooledData, source.width, source.height);

		// Copy data
		imageData.data.set(source.data);

		return { imageData, pooledData };
	}

	/**
	 * Resize image using pool
	 */
	resizeImageData(
		source: ImageData,
		newWidth: number,
		newHeight: number
	): { imageData: ImageData; pooledData: PooledImageData } {
		const pooledData = this.allocateBuffer(newWidth, newHeight, 'RGBA');
		const imageData = this.createImageData(pooledData);

		// Simple nearest neighbor resize (can be enhanced with better algorithms)
		const scaleX = source.width / newWidth;
		const scaleY = source.height / newHeight;

		for (let y = 0; y < newHeight; y++) {
			for (let x = 0; x < newWidth; x++) {
				const srcX = Math.floor(x * scaleX);
				const srcY = Math.floor(y * scaleY);

				const srcIdx = (srcY * source.width + srcX) * 4;
				const dstIdx = (y * newWidth + x) * 4;

				imageData.data[dstIdx] = source.data[srcIdx];
				imageData.data[dstIdx + 1] = source.data[srcIdx + 1];
				imageData.data[dstIdx + 2] = source.data[srcIdx + 2];
				imageData.data[dstIdx + 3] = source.data[srcIdx + 3];
			}
		}

		return { imageData, pooledData };
	}

	/**
	 * Get pool statistics
	 */
	getStats(): PoolStats {
		this.updateStats();
		return { ...this.stats };
	}

	/**
	 * Clear all pools
	 */
	clear(): void {
		this.pools.clear();
		this.stats.totalPools = 0;
		this.stats.totalBuffers = 0;
		this.stats.totalMemoryMB = 0;
	}

	/**
	 * Force cleanup of old buffers
	 */
	cleanup(): void {
		const _now = Date.now();
		let totalCleared = 0;

		for (const [poolKey, pool] of this.pools.entries()) {
			// Keep minimum pool size
			const keepCount = Math.max(this.config.minPoolSize, Math.floor(pool.length * 0.5));
			const clearCount = pool.length - keepCount;

			if (clearCount > 0) {
				pool.splice(0, clearCount);
				totalCleared += clearCount;

				if (pool.length === 0) {
					this.pools.delete(poolKey);
				}
			}
		}

		console.log(`[ImagePool] Cleaned up ${totalCleared} buffers`);
		this.updateStats();
	}

	/**
	 * Initialize pools and cleanup interval
	 */
	private initialize(): void {
		// Pre-allocate common sizes
		for (const size of this.config.preallocationSizes) {
			const poolKey = this.getPoolKey(size.width, size.height, 'RGBA');
			const pool: ArrayBuffer[] = [];

			for (let i = 0; i < size.count; i++) {
				const buffer = new ArrayBuffer(size.width * size.height * 4);
				pool.push(buffer);
			}

			this.pools.set(poolKey, pool);
		}

		// Start cleanup interval
		this.cleanupInterval = window.setInterval(() => {
			this.cleanup();
		}, this.config.cleanupInterval);

		this.updateStats();
		console.log('[ImagePool] Initialized with pre-allocated buffers:', this.stats);
	}

	/**
	 * Generate pool key for buffer categorization
	 */
	private getPoolKey(width: number, height: number, format: 'RGBA' | 'RGB' | 'GRAY'): string {
		// Round to nearest 32 pixels for better pooling efficiency
		const roundedWidth = Math.ceil(width / 32) * 32;
		const roundedHeight = Math.ceil(height / 32) * 32;
		return `${roundedWidth}x${roundedHeight}_${format}`;
	}

	/**
	 * Get channel count for format
	 */
	private getChannelCount(format: 'RGBA' | 'RGB' | 'GRAY'): number {
		switch (format) {
			case 'RGBA':
				return 4;
			case 'RGB':
				return 3;
			case 'GRAY':
				return 1;
		}
	}

	/**
	 * Find next power of 2
	 */
	private nextPowerOfTwo(n: number): number {
		return Math.pow(2, Math.ceil(Math.log2(n)));
	}

	/**
	 * Clear buffer contents
	 */
	private clearBuffer(buffer: ArrayBuffer): void {
		const view = new Uint8Array(buffer);
		view.fill(0);
	}

	/**
	 * Update internal statistics
	 */
	private updateStats(): void {
		this.stats.totalPools = this.pools.size;
		this.stats.totalBuffers = Array.from(this.pools.values()).reduce(
			(sum, pool) => sum + pool.length,
			0
		);

		this.stats.totalMemoryMB =
			Array.from(this.pools.entries()).reduce((sum, [key, pool]) => {
				const [dimensions, format] = key.split('_');
				const [width, height] = dimensions.split('x').map(Number);
				const channels = this.getChannelCount(format as any);
				const bytesPerBuffer = width * height * channels;
				return sum + pool.length * bytesPerBuffer;
			}, 0) /
			(1024 * 1024);

		const totalRequests = this.stats.hits + this.stats.misses;
		this.stats.hitRatio = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
	}

	/**
	 * Cleanup when pool is destroyed
	 */
	destroy(): void {
		if (this.cleanupInterval !== null) {
			clearInterval(this.cleanupInterval);
			this.cleanupInterval = null;
		}
		this.clear();
	}
}

/**
 * Global image pool instance
 */
export const globalImagePool = new ImageDataPool();

/**
 * Utility function for easy buffer allocation
 */
export function allocateImageBuffer(
	width: number,
	height: number,
	format: 'RGBA' | 'RGB' | 'GRAY' = 'RGBA'
): PooledImageData {
	return globalImagePool.allocateBuffer(width, height, format);
}

/**
 * Utility function for easy buffer release
 */
export function releaseImageBuffer(pooledData: PooledImageData): void {
	globalImagePool.releaseBuffer(pooledData);
}
