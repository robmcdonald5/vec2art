/**
 * Validation Cache System
 * 
 * High-performance parameter validation caching to eliminate redundant validation calls.
 * Implements LRU eviction, hash-based caching, and intelligent cache invalidation.
 */

import type { VectorizerConfig } from '$lib/types/vectorizer';

export interface ValidationResult {
	isValid: boolean;
	errors: Array<{ field: string; message: string }>;
	warnings: Array<{ field: string; message: string }>;
}

interface CacheEntry {
	result: ValidationResult;
	expiry: number;
	lastAccess: number;
	parameterHash: string;
	created: number;
}

interface ValidationCacheStats {
	hits: number;
	misses: number;
	evictions: number;
	totalValidations: number;
	averageValidationTime: number;
	cacheSize: number;
	hitRatio: number;
}

/**
 * High-performance validation cache with LRU eviction
 */
export class ValidationCache {
	private cache = new Map<string, CacheEntry>();
	private readonly maxSize: number;
	private readonly ttl: number;
	private stats: ValidationCacheStats;

	constructor(maxSize = 1000, ttlMs = 300000) { // 5 minutes default TTL
		this.maxSize = maxSize;
		this.ttl = ttlMs;
		this.stats = {
			hits: 0,
			misses: 0,
			evictions: 0,
			totalValidations: 0,
			averageValidationTime: 0,
			cacheSize: 0,
			hitRatio: 0
		};
	}

	/**
	 * Get cached validation result
	 */
	get(parameterHash: string): ValidationResult | null {
		const entry = this.cache.get(parameterHash);
		
		if (!entry) {
			this.stats.misses++;
			this.updateStats();
			return null;
		}

		// Check if entry has expired
		if (Date.now() > entry.expiry) {
			this.cache.delete(parameterHash);
			this.stats.misses++;
			this.updateStats();
			return null;
		}

		// Update access time for LRU
		entry.lastAccess = Date.now();
		this.stats.hits++;
		this.updateStats();
		
		return entry.result;
	}

	/**
	 * Store validation result in cache
	 */
	set(parameterHash: string, result: ValidationResult, validationTimeMs?: number): void {
		// Evict if cache is full
		if (this.cache.size >= this.maxSize) {
			this.evictLRU();
		}

		const now = Date.now();
		const entry: CacheEntry = {
			result,
			expiry: now + this.ttl,
			lastAccess: now,
			parameterHash,
			created: now
		};

		this.cache.set(parameterHash, entry);
		this.stats.totalValidations++;
		
		if (validationTimeMs) {
			this.updateAverageValidationTime(validationTimeMs);
		}
		
		this.updateStats();
	}

	/**
	 * Generate hash for parameter configuration
	 */
	generateParameterHash(config: Partial<VectorizerConfig>): string {
		// Create sorted key-value pairs for consistent hashing
		const sortedEntries = Object.entries(config)
			.filter(([_, value]) => value !== undefined)
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([key, value]) => `${key}:${JSON.stringify(value)}`)
			.join('|');

		// Simple but effective hash function
		let hash = 0;
		for (let i = 0; i < sortedEntries.length; i++) {
			const char = sortedEntries.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash; // Convert to 32-bit integer
		}
		
		return `param_${Math.abs(hash).toString(36)}`;
	}

	/**
	 * Check if parameters have changed since last validation
	 */
	hasParametersChanged(config: Partial<VectorizerConfig>, lastHash?: string): boolean {
		const currentHash = this.generateParameterHash(config);
		return currentHash !== lastHash;
	}

	/**
	 * Validate with caching
	 */
	validateWithCache(
		config: Partial<VectorizerConfig>, 
		validatorFn: (config: Partial<VectorizerConfig>) => ValidationResult
	): { result: ValidationResult; fromCache: boolean; hash: string } {
		const hash = this.generateParameterHash(config);
		const cached = this.get(hash);
		
		if (cached) {
			return { result: cached, fromCache: true, hash };
		}

		// Perform validation and cache result
		const startTime = performance.now();
		const result = validatorFn(config);
		const validationTime = performance.now() - startTime;
		
		this.set(hash, result, validationTime);
		
		return { result, fromCache: false, hash };
	}

	/**
	 * Clear cache entries matching predicate
	 */
	invalidate(predicate?: (entry: CacheEntry) => boolean): number {
		if (!predicate) {
			const count = this.cache.size;
			this.cache.clear();
			this.updateStats();
			return count;
		}

		let deletedCount = 0;
		for (const [hash, entry] of this.cache.entries()) {
			if (predicate(entry)) {
				this.cache.delete(hash);
				deletedCount++;
			}
		}
		
		this.updateStats();
		return deletedCount;
	}

	/**
	 * Get cache statistics
	 */
	getStats(): ValidationCacheStats {
		return { ...this.stats };
	}

	/**
	 * Clear all cache statistics
	 */
	clearStats(): void {
		this.stats = {
			hits: 0,
			misses: 0,
			evictions: 0,
			totalValidations: 0,
			averageValidationTime: 0,
			cacheSize: this.cache.size,
			hitRatio: 0
		};
	}

	/**
	 * Evict least recently used entry
	 */
	private evictLRU(): void {
		let oldestTime = Date.now();
		let oldestHash = '';

		for (const [hash, entry] of this.cache.entries()) {
			if (entry.lastAccess < oldestTime) {
				oldestTime = entry.lastAccess;
				oldestHash = hash;
			}
		}

		if (oldestHash) {
			this.cache.delete(oldestHash);
			this.stats.evictions++;
		}
	}

	/**
	 * Update cache statistics
	 */
	private updateStats(): void {
		this.stats.cacheSize = this.cache.size;
		const total = this.stats.hits + this.stats.misses;
		this.stats.hitRatio = total > 0 ? this.stats.hits / total : 0;
	}

	/**
	 * Update running average of validation time
	 */
	private updateAverageValidationTime(newTime: number): void {
		const count = this.stats.totalValidations;
		this.stats.averageValidationTime = 
			(this.stats.averageValidationTime * (count - 1) + newTime) / count;
	}
}

// Global validation cache instance
export const globalValidationCache = new ValidationCache();

/**
 * Debounced validation helper
 */
export class DebouncedValidator {
	private timeoutId: number | null = null;
	private readonly debounceMs: number;
	private readonly cache: ValidationCache;

	constructor(debounceMs = 150, cache = globalValidationCache) {
		this.debounceMs = debounceMs;
		this.cache = cache;
	}

	/**
	 * Validate with debouncing to prevent excessive validation calls
	 */
	validate(
		config: Partial<VectorizerConfig>,
		validatorFn: (config: Partial<VectorizerConfig>) => ValidationResult,
		callback: (result: ValidationResult, fromCache: boolean) => void
	): void {
		// Clear existing timeout
		if (this.timeoutId !== null) {
			clearTimeout(this.timeoutId);
		}

		// Check cache immediately for instant feedback
		const hash = this.cache.generateParameterHash(config);
		const cached = this.cache.get(hash);
		
		if (cached) {
			callback(cached, true);
			return;
		}

		// Debounce the actual validation
		this.timeoutId = window.setTimeout(() => {
			const { result, fromCache } = this.cache.validateWithCache(config, validatorFn);
			callback(result, fromCache);
			this.timeoutId = null;
		}, this.debounceMs);
	}

	/**
	 * Cancel pending validation
	 */
	cancel(): void {
		if (this.timeoutId !== null) {
			clearTimeout(this.timeoutId);
			this.timeoutId = null;
		}
	}
}

// Global debounced validator instance
export const globalDebouncedValidator = new DebouncedValidator();