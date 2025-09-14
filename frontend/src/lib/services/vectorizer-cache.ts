/**
 * VectorizerCache - Intelligent caching for vectorization results
 *
 * Provides memory-efficient caching with LRU eviction and
 * content-based cache keys for optimal hit rates.
 */

import type { ProcessingResult, CacheConfig, CacheEntry } from '../types/service-types';
import type { SerializedImageData, VectorizerConfiguration } from '../types/worker-protocol';
import { createHash } from '../utils/hash';

/**
 * Default cache configuration
 */
const DEFAULT_CONFIG: Required<CacheConfig> = {
	enabled: true,
	maxSize: 50,
	maxAge: 3600000, // 1 hour
	ttl: 3600000, // 1 hour
	storage: 'memory'
};

/**
 * VectorizerCache class
 */
export class VectorizerCache {
	private config: Required<CacheConfig>;
	private cache: Map<string, CacheEntry> = new Map();
	private accessOrder: string[] = [];
	private totalHits = 0;
	private totalMisses = 0;
	private totalEvictions = 0;

	constructor(config: CacheConfig) {
		this.config = { ...DEFAULT_CONFIG, ...config };

		// Initialize storage backend if needed
		if (this.config.storage === 'indexeddb') {
			this.initializeIndexedDB();
		}
	}

	/**
	 * Generate a cache key from image data and configuration
	 */
	generateKey(imageData: SerializedImageData, config: VectorizerConfiguration): string {
		// Create a deterministic key from image dimensions and config
		const keyData = {
			width: imageData.width,
			height: imageData.height,
			dataHash: this.hashImageData(imageData.data),
			backend: config.backend,
			detail: config.detail,
			strokeWidth: config.strokeWidth,
			multipass: config.multipass,
			passCount: config.passCount,
			reversePass: config.reversePass,
			diagonalPass: config.diagonalPass,
			noiseFiltering: config.noiseFiltering,
			handDrawnPreset: config.handDrawnPreset,
			backgroundRemoval: config.backgroundRemoval
		};

		return createHash(JSON.stringify(keyData));
	}

	/**
	 * Get a cached result
	 */
	async get(key: string): Promise<ProcessingResult | null> {
		if (!this.config.enabled) {
			return null;
		}

		if (this.config.storage === 'indexeddb') {
			return this.getFromIndexedDB(key);
		}

		const entry = this.cache.get(key);

		if (!entry) {
			this.totalMisses++;
			return null;
		}

		// Check TTL
		if (this.config.ttl && Date.now() - entry.timestamp > this.config.ttl) {
			this.cache.delete(key);
			this.removeFromAccessOrder(key);
			this.totalMisses++;
			return null;
		}

		// Update access order for LRU
		this.updateAccessOrder(key);

		// Update hit count
		entry.hits++;
		this.totalHits++;

		return entry.result;
	}

	/**
	 * Set a cached result
	 */
	async set(key: string, result: ProcessingResult): Promise<void> {
		if (!this.config.enabled) {
			return;
		}

		if (this.config.storage === 'indexeddb') {
			return this.setInIndexedDB(key, result);
		}

		// Check if we need to evict
		if (this.cache.size >= this.config.maxSize) {
			this.evictLRU();
		}

		// Calculate approximate size
		const size = this.estimateResultSize(result);

		// Create cache entry
		const entry: CacheEntry = {
			key,
			result,
			timestamp: Date.now(),
			size,
			hits: 0
		};

		// Store in cache
		this.cache.set(key, entry);
		this.updateAccessOrder(key);
	}

	/**
	 * Clear the cache
	 */
	clear(): void {
		this.cache.clear();
		this.accessOrder = [];
		this.totalHits = 0;
		this.totalMisses = 0;
		this.totalEvictions = 0;

		if (this.config.storage === 'indexeddb') {
			this.clearIndexedDB();
		}
	}

	/**
	 * Get cache statistics
	 */
	getStats(): {
		size: number;
		maxSize: number;
		hitRate: number;
		totalHits: number;
		totalMisses: number;
		totalEvictions: number;
		averageEntrySize: number;
	} {
		const totalSize = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0);

		const averageEntrySize = this.cache.size > 0 ? totalSize / this.cache.size : 0;

		const totalRequests = this.totalHits + this.totalMisses;
		const hitRate = totalRequests > 0 ? this.totalHits / totalRequests : 0;

		return {
			size: this.cache.size,
			maxSize: this.config.maxSize,
			hitRate,
			totalHits: this.totalHits,
			totalMisses: this.totalMisses,
			totalEvictions: this.totalEvictions,
			averageEntrySize
		};
	}

	/**
	 * Preload cache with results
	 */
	async preload(entries: Array<{ key: string; result: ProcessingResult }>): Promise<void> {
		for (const { key, result } of entries) {
			await this.set(key, result);
		}
	}

	// Private helper methods

	private hashImageData(data: number[] | Uint8Array | Uint8ClampedArray): string {
		// Sample the data for efficiency (every 100th pixel)
		const sample: number[] = [];
		const step = Math.max(1, Math.floor(data.length / 1000));

		for (let i = 0; i < data.length; i += step) {
			sample.push(data[i]);
		}

		return createHash(sample.join(','));
	}

	private estimateResultSize(result: ProcessingResult): number {
		// Rough estimate of memory usage
		return (
			result.svg.length * 2 + // UTF-16 characters
			JSON.stringify(result.stats).length * 2 +
			8
		); // processing time number
	}

	private updateAccessOrder(key: string): void {
		// Remove from current position
		this.removeFromAccessOrder(key);

		// Add to end (most recently used)
		this.accessOrder.push(key);
	}

	private removeFromAccessOrder(key: string): void {
		const index = this.accessOrder.indexOf(key);
		if (index !== -1) {
			this.accessOrder.splice(index, 1);
		}
	}

	private evictLRU(): void {
		if (this.accessOrder.length === 0) {
			return;
		}

		// Remove least recently used
		const lruKey = this.accessOrder.shift()!;
		this.cache.delete(lruKey);
		this.totalEvictions++;

		console.log(`[VectorizerCache] Evicted LRU entry: ${lruKey}`);
	}

	// IndexedDB methods (stubs for now)

	private async initializeIndexedDB(): Promise<void> {
		// TODO: Implement IndexedDB storage
		console.log('[VectorizerCache] IndexedDB storage not yet implemented, falling back to memory');
		this.config.storage = 'memory';
	}

	private async getFromIndexedDB(_key: string): Promise<ProcessingResult | null> {
		// TODO: Implement IndexedDB retrieval
		return null;
	}

	private async setInIndexedDB(_key: string, _result: ProcessingResult): Promise<void> {
		// TODO: Implement IndexedDB storage
	}

	private async clearIndexedDB(): Promise<void> {
		// TODO: Implement IndexedDB clearing
	}
}
