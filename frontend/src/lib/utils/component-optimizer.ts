/**
 * Component Performance Optimizer - Phase 3.4
 * 
 * Advanced frontend performance optimizations including selective store updates,
 * component memoization, virtual scrolling, and render throttling for maximum
 * UI responsiveness during intensive operations.
 */

import { untrack } from 'svelte';

export interface ComponentMemoConfig {
	dependencies: string[];
	cacheSize: number;
	ttl: number; // time to live in ms
	deepEqual: boolean;
}

export interface RenderThrottleConfig {
	maxUpdatesPerSecond: number;
	batchWindow: number; // ms to batch updates
	priorityLevels: Record<string, number>; // higher number = higher priority
}

export interface VirtualScrollConfig {
	itemHeight: number;
	overscan: number; // number of extra items to render
	threshold: number; // when to start virtualizing
	estimatedItemHeight?: number;
}

interface MemoEntry<T> {
	value: T;
	dependencies: any[];
	timestamp: number;
	accessCount: number;
}

interface ThrottleEntry {
	callback: () => void;
	priority: number;
	timestamp: number;
	id: string;
}

/**
 * Advanced component memoization with dependency tracking
 */
export class ComponentMemoizer<T> {
	private cache = new Map<string, MemoEntry<T>>();
	private config: ComponentMemoConfig;

	constructor(config: Partial<ComponentMemoConfig> = {}) {
		this.config = {
			dependencies: [],
			cacheSize: 100,
			ttl: 60000, // 1 minute
			deepEqual: false,
			...config
		};

		// Cleanup old entries periodically
		setInterval(() => this.cleanup(), this.config.ttl / 2);
	}

	/**
	 * Memoize a computation with dependency tracking
	 */
	memo(key: string, compute: () => T, dependencies: any[] = []): T {
		// Generate cache key with dependencies
		const cacheKey = this.generateCacheKey(key, dependencies);
		const existing = this.cache.get(cacheKey);

		// Check if we have a valid cached result
		if (existing && this.isValidEntry(existing, dependencies)) {
			existing.accessCount++;
			return existing.value;
		}

		// Compute new value
		const value = untrack(compute);

		// Store in cache
		this.cache.set(cacheKey, {
			value,
			dependencies: [...dependencies],
			timestamp: Date.now(),
			accessCount: 1
		});

		// Evict old entries if cache is full
		if (this.cache.size > this.config.cacheSize) {
			this.evictLeastUsed();
		}

		return value;
	}

	/**
	 * Generate cache key from key and dependencies
	 */
	private generateCacheKey(key: string, dependencies: any[]): string {
		if (dependencies.length === 0) return key;
		
		const depString = dependencies
			.map(dep => typeof dep === 'object' ? JSON.stringify(dep) : String(dep))
			.join('|');
		
		return `${key}:${depString}`;
	}

	/**
	 * Check if cache entry is still valid
	 */
	private isValidEntry(entry: MemoEntry<T>, currentDeps: any[]): boolean {
		// Check TTL
		if (Date.now() - entry.timestamp > this.config.ttl) {
			return false;
		}

		// Check dependencies
		if (entry.dependencies.length !== currentDeps.length) {
			return false;
		}

		for (let i = 0; i < entry.dependencies.length; i++) {
			if (this.config.deepEqual) {
				if (JSON.stringify(entry.dependencies[i]) !== JSON.stringify(currentDeps[i])) {
					return false;
				}
			} else {
				if (entry.dependencies[i] !== currentDeps[i]) {
					return false;
				}
			}
		}

		return true;
	}

	/**
	 * Evict least recently used entries
	 */
	private evictLeastUsed(): void {
		const entries = Array.from(this.cache.entries())
			.sort((a, b) => a[1].accessCount - b[1].accessCount);

		const toEvict = entries.slice(0, Math.floor(this.config.cacheSize * 0.1)); // Evict 10%
		
		for (const [key] of toEvict) {
			this.cache.delete(key);
		}
	}

	/**
	 * Clean up expired entries
	 */
	private cleanup(): void {
		const now = Date.now();
		for (const [key, entry] of this.cache.entries()) {
			if (now - entry.timestamp > this.config.ttl) {
				this.cache.delete(key);
			}
		}
	}

	/**
	 * Clear all cached entries
	 */
	clear(): void {
		this.cache.clear();
	}

	/**
	 * Get cache statistics
	 */
	getStats() {
		return {
			size: this.cache.size,
			maxSize: this.config.cacheSize,
			hitRatio: this.cache.size > 0 ? 
				Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.accessCount, 0) / this.cache.size : 0
		};
	}
}

/**
 * Render throttling for high-frequency updates
 */
export class RenderThrottler {
	private pendingUpdates = new Map<string, ThrottleEntry>();
	private config: RenderThrottleConfig;
	private frameId: number | null = null;
	private lastBatch = 0;

	constructor(config: Partial<RenderThrottleConfig> = {}) {
		this.config = {
			maxUpdatesPerSecond: 60,
			batchWindow: 16, // ~60fps
			priorityLevels: {
				low: 1,
				normal: 2,
				high: 3,
				critical: 4
			},
			...config
		};
	}

	/**
	 * Schedule a throttled update
	 */
	scheduleUpdate(
		id: string,
		callback: () => void,
		priority: string = 'normal'
	): void {
		const priorityLevel = this.config.priorityLevels[priority] || 2;
		
		this.pendingUpdates.set(id, {
			callback,
			priority: priorityLevel,
			timestamp: Date.now(),
			id
		});

		// Schedule batch processing
		if (this.frameId === null) {
			this.scheduleNextBatch();
		}
	}

	/**
	 * Cancel a pending update
	 */
	cancelUpdate(id: string): void {
		this.pendingUpdates.delete(id);
	}

	/**
	 * Process pending updates in priority order
	 */
	private processBatch(): void {
		const now = Date.now();
		const timeSinceLastBatch = now - this.lastBatch;

		if (timeSinceLastBatch < this.config.batchWindow) {
			// Too soon, schedule for later
			this.frameId = requestAnimationFrame(() => this.processBatch());
			return;
		}

		// Sort updates by priority (highest first)
		const updates = Array.from(this.pendingUpdates.values())
			.sort((a, b) => b.priority - a.priority);

		// Limit updates per batch based on maxUpdatesPerSecond
		const maxUpdatesPerBatch = Math.ceil(
			this.config.maxUpdatesPerSecond * (this.config.batchWindow / 1000)
		);

		const batch = updates.slice(0, maxUpdatesPerBatch);
		
		// Execute updates
		for (const update of batch) {
			try {
				update.callback();
			} catch (error) {
				console.error('[RenderThrottler] Update failed:', error);
			}
			this.pendingUpdates.delete(update.id);
		}

		this.lastBatch = now;
		this.frameId = null;

		// Schedule next batch if there are remaining updates
		if (this.pendingUpdates.size > 0) {
			this.scheduleNextBatch();
		}
	}

	/**
	 * Schedule next batch processing
	 */
	private scheduleNextBatch(): void {
		this.frameId = requestAnimationFrame(() => this.processBatch());
	}

	/**
	 * Get throttler statistics
	 */
	getStats() {
		return {
			pendingUpdates: this.pendingUpdates.size,
			priorityDistribution: Array.from(this.pendingUpdates.values())
				.reduce((acc, update) => {
					const priority = Object.entries(this.config.priorityLevels)
						.find(([, level]) => level === update.priority)?.[0] || 'unknown';
					acc[priority] = (acc[priority] || 0) + 1;
					return acc;
				}, {} as Record<string, number>)
		};
	}
}

/**
 * Virtual scrolling implementation for large lists
 */
export class VirtualScroller {
	private config: VirtualScrollConfig;
	private scrollTop = 0;
	private containerHeight = 0;
	private itemCount = 0;

	constructor(config: VirtualScrollConfig) {
		this.config = config;
	}

	/**
	 * Update scroll state
	 */
	updateScroll(scrollTop: number, containerHeight: number): void {
		this.scrollTop = scrollTop;
		this.containerHeight = containerHeight;
	}

	/**
	 * Set total item count
	 */
	setItemCount(count: number): void {
		this.itemCount = count;
	}

	/**
	 * Calculate visible range with overscan
	 */
	getVisibleRange(): { start: number; end: number; totalHeight: number } {
		if (this.itemCount < this.config.threshold) {
			// Don't virtualize small lists
			return {
				start: 0,
				end: this.itemCount,
				totalHeight: this.itemCount * this.config.itemHeight
			};
		}

		const itemHeight = this.config.estimatedItemHeight || this.config.itemHeight;
		const visibleStart = Math.floor(this.scrollTop / itemHeight);
		const visibleEnd = Math.ceil((this.scrollTop + this.containerHeight) / itemHeight);

		// Add overscan
		const start = Math.max(0, visibleStart - this.config.overscan);
		const end = Math.min(this.itemCount, visibleEnd + this.config.overscan);

		return {
			start,
			end,
			totalHeight: this.itemCount * itemHeight
		};
	}

	/**
	 * Get item position for given index
	 */
	getItemPosition(index: number): { top: number; height: number } {
		const itemHeight = this.config.estimatedItemHeight || this.config.itemHeight;
		return {
			top: index * itemHeight,
			height: itemHeight
		};
	}
}

/**
 * Selective store update utility
 */
export class SelectiveStoreUpdater {
	private updateMask = new Set<string>();
	private pendingUpdates = new Map<string, any>();
	private throttler: RenderThrottler;

	constructor(throttleConfig?: Partial<RenderThrottleConfig>) {
		this.throttler = new RenderThrottler(throttleConfig);
	}

	/**
	 * Mark a property for update
	 */
	markForUpdate(propertyPath: string, value: any): void {
		this.updateMask.add(propertyPath);
		this.pendingUpdates.set(propertyPath, value);
	}

	/**
	 * Check if a property should be updated
	 */
	shouldUpdate(propertyPath: string): boolean {
		return this.updateMask.has(propertyPath);
	}

	/**
	 * Apply pending updates with throttling
	 */
	applyUpdates(
		target: Record<string, any>, 
		priority: string = 'normal'
	): void {
		const updateId = `store_update_${Date.now()}`;
		
		this.throttler.scheduleUpdate(updateId, () => {
			for (const [propertyPath, value] of this.pendingUpdates) {
				this.setNestedProperty(target, propertyPath, value);
			}
			
			// Clear processed updates
			this.updateMask.clear();
			this.pendingUpdates.clear();
		}, priority);
	}

	/**
	 * Set nested property by path
	 */
	private setNestedProperty(obj: any, path: string, value: any): void {
		const parts = path.split('.');
		let current = obj;
		
		for (let i = 0; i < parts.length - 1; i++) {
			const part = parts[i];
			if (!(part in current) || typeof current[part] !== 'object') {
				current[part] = {};
			}
			current = current[part];
		}
		
		current[parts[parts.length - 1]] = value;
	}

	/**
	 * Get updater statistics
	 */
	getStats() {
		return {
			pendingUpdates: this.pendingUpdates.size,
			markedProperties: this.updateMask.size,
			throttlerStats: this.throttler.getStats()
		};
	}
}

/**
 * Global instances for easy access
 */
export const globalComponentMemoizer = new ComponentMemoizer();
export const globalRenderThrottler = new RenderThrottler();
export const globalStoreUpdater = new SelectiveStoreUpdater();

/**
 * Utility function for memoizing expensive computations
 */
export function useMemo<T>(
	key: string,
	compute: () => T,
	dependencies: any[] = []
): T {
	return globalComponentMemoizer.memo(key, compute, dependencies) as T;
}

/**
 * Utility function for throttling render updates
 */
export function useRenderThrottle(
	id: string,
	callback: () => void,
	priority: string = 'normal'
): void {
	globalRenderThrottler.scheduleUpdate(id, callback, priority);
}