/**
 * Performance monitoring and optimization utilities for vec2art frontend
 */

export interface PerformanceMetric {
	name: string;
	value: number;
	unit: 'ms' | 'bytes' | 'count' | 'percent';
	timestamp: number;
	category: 'timing' | 'memory' | 'rendering' | 'network' | 'custom';
}

export interface PerformanceBudget {
	timing: {
		initial_load: number;
		first_paint: number;
		first_contentful_paint: number;
		largest_contentful_paint: number;
		time_to_interactive: number;
	};
	memory: {
		max_heap_size: number;
		max_used_heap: number;
	};
	custom: Record<string, number>;
}

export class PerformanceMonitor {
	private metrics: PerformanceMetric[] = [];
	private observers: PerformanceObserver[] = [];
	private budget: PerformanceBudget;

	constructor(budget?: Partial<PerformanceBudget>) {
		this.budget = {
			timing: {
				initial_load: 3000,
				first_paint: 1000,
				first_contentful_paint: 1500,
				largest_contentful_paint: 2500,
				time_to_interactive: 5000
			},
			memory: {
				max_heap_size: 100 * 1024 * 1024, // 100MB
				max_used_heap: 50 * 1024 * 1024 // 50MB
			},
			custom: {},
			...budget
		};

		this.initializeObservers();
	}

	private initializeObservers(): void {
		if (typeof window === 'undefined' || !window.PerformanceObserver) {
			return;
		}

		try {
			// Observe navigation timing
			const navigationObserver = new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					if (entry.entryType === 'navigation') {
						this.recordNavigationTimings(entry as PerformanceNavigationTiming);
					}
				}
			});
			navigationObserver.observe({ entryTypes: ['navigation'] });
			this.observers.push(navigationObserver);

			// Observe paint timing
			const paintObserver = new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					this.addMetric({
						name: entry.name,
						value: entry.startTime,
						unit: 'ms',
						timestamp: Date.now(),
						category: 'timing'
					});
				}
			});
			paintObserver.observe({ entryTypes: ['paint'] });
			this.observers.push(paintObserver);

			// Observe largest contentful paint
			const lcpObserver = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				const lastEntry = entries[entries.length - 1];
				this.addMetric({
					name: 'largest-contentful-paint',
					value: lastEntry.startTime,
					unit: 'ms',
					timestamp: Date.now(),
					category: 'timing'
				});
			});
			lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
			this.observers.push(lcpObserver);
		} catch (error) {
			console.warn('Failed to initialize performance observers:', error);
		}
	}

	private recordNavigationTimings(entry: PerformanceNavigationTiming): void {
		const timings = [
			{ name: 'dns-lookup', value: entry.domainLookupEnd - entry.domainLookupStart },
			{ name: 'tcp-connect', value: entry.connectEnd - entry.connectStart },
			{ name: 'request-response', value: entry.responseEnd - entry.requestStart },
			{ name: 'dom-loading', value: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart },
			{ name: 'page-load', value: entry.loadEventEnd - entry.loadEventStart }
		];

		timings.forEach((timing) => {
			if (timing.value > 0) {
				this.addMetric({
					name: timing.name,
					value: timing.value,
					unit: 'ms',
					timestamp: Date.now(),
					category: 'timing'
				});
			}
		});
	}

	/**
	 * Add a custom performance metric
	 */
	addMetric(metric: PerformanceMetric): void {
		this.metrics.push(metric);
		this.checkBudget(metric);
	}

	/**
	 * Measure execution time of a function
	 */
	async measureAsync<T>(
		name: string,
		fn: () => Promise<T>,
		category: PerformanceMetric['category'] = 'custom'
	): Promise<T> {
		const startTime = performance.now();
		try {
			const result = await fn();
			const endTime = performance.now();

			this.addMetric({
				name,
				value: endTime - startTime,
				unit: 'ms',
				timestamp: Date.now(),
				category
			});

			return result;
		} catch (error) {
			const endTime = performance.now();
			this.addMetric({
				name: `${name}-error`,
				value: endTime - startTime,
				unit: 'ms',
				timestamp: Date.now(),
				category
			});
			throw error;
		}
	}

	/**
	 * Measure execution time of a synchronous function
	 */
	measure<T>(name: string, fn: () => T, category: PerformanceMetric['category'] = 'custom'): T {
		const startTime = performance.now();
		try {
			const result = fn();
			const endTime = performance.now();

			this.addMetric({
				name,
				value: endTime - startTime,
				unit: 'ms',
				timestamp: Date.now(),
				category
			});

			return result;
		} catch (error) {
			const endTime = performance.now();
			this.addMetric({
				name: `${name}-error`,
				value: endTime - startTime,
				unit: 'ms',
				timestamp: Date.now(),
				category
			});
			throw error;
		}
	}

	/**
	 * Record memory usage
	 */
	recordMemoryUsage(): void {
		if (typeof window !== 'undefined' && 'memory' in performance) {
			const memory = (performance as any).memory;

			this.addMetric({
				name: 'heap-used',
				value: memory.usedJSHeapSize,
				unit: 'bytes',
				timestamp: Date.now(),
				category: 'memory'
			});

			this.addMetric({
				name: 'heap-total',
				value: memory.totalJSHeapSize,
				unit: 'bytes',
				timestamp: Date.now(),
				category: 'memory'
			});

			this.addMetric({
				name: 'heap-limit',
				value: memory.jsHeapSizeLimit,
				unit: 'bytes',
				timestamp: Date.now(),
				category: 'memory'
			});
		}
	}

	/**
	 * Get all recorded metrics
	 */
	getMetrics(category?: PerformanceMetric['category']): PerformanceMetric[] {
		return category
			? this.metrics.filter((metric) => metric.category === category)
			: [...this.metrics];
	}

	/**
	 * Get metrics summary
	 */
	getSummary(): Record<string, { min: number; max: number; avg: number; count: number }> {
		const summary: Record<string, { min: number; max: number; avg: number; count: number }> = {};

		this.metrics.forEach((metric) => {
			if (!summary[metric.name]) {
				summary[metric.name] = {
					min: metric.value,
					max: metric.value,
					avg: metric.value,
					count: 1
				};
			} else {
				const current = summary[metric.name];
				current.min = Math.min(current.min, metric.value);
				current.max = Math.max(current.max, metric.value);
				current.avg = (current.avg * current.count + metric.value) / (current.count + 1);
				current.count += 1;
			}
		});

		return summary;
	}

	/**
	 * Check if metric exceeds budget
	 */
	private checkBudget(metric: PerformanceMetric): void {
		const budgetValue = this.getBudgetValue(metric.name);
		if (budgetValue && metric.value > budgetValue) {
			console.warn(
				`Performance budget exceeded for ${metric.name}: ${metric.value}${metric.unit} > ${budgetValue}${metric.unit}`
			);
		}
	}

	private getBudgetValue(metricName: string): number | undefined {
		// Check timing budgets
		if (metricName in this.budget.timing) {
			return this.budget.timing[metricName as keyof typeof this.budget.timing];
		}

		// Check memory budgets
		if (metricName.includes('heap') && metricName.includes('used')) {
			return this.budget.memory.max_used_heap;
		}

		if (metricName.includes('heap') && metricName.includes('total')) {
			return this.budget.memory.max_heap_size;
		}

		// Check custom budgets
		return this.budget.custom[metricName];
	}

	/**
	 * Clear all metrics
	 */
	clear(): void {
		this.metrics = [];
	}

	/**
	 * Dispose of observers
	 */
	dispose(): void {
		this.observers.forEach((observer) => observer.disconnect());
		this.observers = [];
	}
}

/**
 * Global performance monitor instance
 */
export const globalPerformanceMonitor = new PerformanceMonitor();

/**
 * Debounce function calls for performance
 */
export function debounce<T extends (...args: any[]) => any>(
	func: T,
	wait: number,
	immediate?: boolean
): (...args: Parameters<T>) => void {
	let timeout: NodeJS.Timeout | null = null;

	return function executedFunction(...args: Parameters<T>) {
		const later = () => {
			timeout = null;
			if (!immediate) func(...args);
		};

		const callNow = immediate && !timeout;

		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(later, wait);

		if (callNow) func(...args);
	};
}

/**
 * Throttle function calls for performance
 */
export function throttle<T extends (...args: any[]) => any>(
	func: T,
	limit: number
): (...args: Parameters<T>) => void {
	let inThrottle: boolean;

	return function executedFunction(...args: Parameters<T>) {
		if (!inThrottle) {
			func(...args);
			inThrottle = true;
			setTimeout(() => (inThrottle = false), limit);
		}
	};
}

/**
 * Create a memoized version of a function
 */
export function memoize<T extends (...args: any[]) => any>(
	func: T,
	keyGenerator?: (...args: Parameters<T>) => string
): T & { cache: Map<string, ReturnType<T>>; clearCache: () => void } {
	const cache = new Map<string, ReturnType<T>>();

	const memoizedFunc = (...args: Parameters<T>): ReturnType<T> => {
		const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

		if (cache.has(key)) {
			return cache.get(key)!;
		}

		const result = func(...args);
		cache.set(key, result);
		return result;
	};

	(memoizedFunc as any).cache = cache;
	(memoizedFunc as any).clearCache = () => cache.clear();

	return memoizedFunc as any;
}

/**
 * RAF-based animation frame utility
 */
export class AnimationFrameManager {
	private callbacks = new Set<() => void>();
	private running = false;

	/**
	 * Add callback to be executed on next frame
	 */
	schedule(callback: () => void): void {
		this.callbacks.add(callback);
		this.start();
	}

	/**
	 * Remove callback
	 */
	unschedule(callback: () => void): void {
		this.callbacks.delete(callback);
	}

	private start(): void {
		if (this.running) return;

		this.running = true;
		requestAnimationFrame(() => {
			const currentCallbacks = Array.from(this.callbacks);
			this.callbacks.clear();
			this.running = false;

			currentCallbacks.forEach((callback) => {
				try {
					callback();
				} catch (error) {
					console.error('Animation frame callback error:', error);
				}
			});
		});
	}
}

export const globalAnimationFrameManager = new AnimationFrameManager();

/**
 * Lazy loading utility
 */
export function createLazyLoader<T>(loader: () => Promise<T>, timeout?: number): () => Promise<T> {
	let promise: Promise<T> | null = null;
	let timeoutId: NodeJS.Timeout | null = null;

	return () => {
		if (promise) return promise;

		promise = loader();

		if (timeout) {
			timeoutId = setTimeout(() => {
				promise = null;
				timeoutId = null;
			}, timeout);
		}

		return promise.catch((error) => {
			promise = null;
			if (timeoutId) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}
			throw error;
		});
	};
}

/**
 * Resource pooling for expensive objects
 */
export class ResourcePool<T> {
	private available: T[] = [];
	private inUse = new Set<T>();
	private factory: () => T;
	private cleanup?: (resource: T) => void;
	private maxSize: number;

	constructor(
		factory: () => T,
		options: {
			initialSize?: number;
			maxSize?: number;
			cleanup?: (resource: T) => void;
		} = {}
	) {
		this.factory = factory;
		this.cleanup = options.cleanup;
		this.maxSize = options.maxSize || 10;

		// Pre-create initial resources
		const initialSize = options.initialSize || 0;
		for (let i = 0; i < initialSize; i++) {
			this.available.push(this.factory());
		}
	}

	/**
	 * Acquire a resource from the pool
	 */
	acquire(): T {
		let resource: T;

		if (this.available.length > 0) {
			resource = this.available.pop()!;
		} else {
			resource = this.factory();
		}

		this.inUse.add(resource);
		return resource;
	}

	/**
	 * Release a resource back to the pool
	 */
	release(resource: T): void {
		if (!this.inUse.has(resource)) {
			console.warn('Attempting to release resource not acquired from this pool');
			return;
		}

		this.inUse.delete(resource);

		if (this.available.length < this.maxSize) {
			this.available.push(resource);
		} else {
			// Pool is full, cleanup the resource
			this.cleanup?.(resource);
		}
	}

	/**
	 * Get pool statistics
	 */
	getStats(): { available: number; inUse: number; total: number } {
		return {
			available: this.available.length,
			inUse: this.inUse.size,
			total: this.available.length + this.inUse.size
		};
	}

	/**
	 * Clear the pool
	 */
	clear(): void {
		// Cleanup all available resources
		this.available.forEach((resource) => this.cleanup?.(resource));
		this.available = [];

		// Note: We don't clean up in-use resources as they might still be needed
		// The caller is responsible for releasing them properly
	}
}

/**
 * Performance-aware task scheduler
 */
export class TaskScheduler {
	private tasks: Array<{ fn: () => void; priority: number }> = [];
	private running = false;
	private yieldTime = 5; // ms

	/**
	 * Schedule a task with optional priority
	 */
	schedule(task: () => void, priority: number = 0): void {
		this.tasks.push({ fn: task, priority });
		this.tasks.sort((a, b) => b.priority - a.priority);
		this.run();
	}

	private async run(): Promise<void> {
		if (this.running) return;
		this.running = true;

		while (this.tasks.length > 0) {
			const startTime = performance.now();

			// Execute tasks until we need to yield
			while (this.tasks.length > 0 && performance.now() - startTime < this.yieldTime) {
				const task = this.tasks.shift()!;
				try {
					task.fn();
				} catch (error) {
					console.error('Scheduled task error:', error);
				}
			}

			// Yield to browser if we have more tasks
			if (this.tasks.length > 0) {
				await new Promise((resolve) => setTimeout(resolve, 0));
			}
		}

		this.running = false;
	}

	/**
	 * Clear all pending tasks
	 */
	clear(): void {
		this.tasks = [];
	}

	/**
	 * Get number of pending tasks
	 */
	getPendingCount(): number {
		return this.tasks.length;
	}
}

export const globalTaskScheduler = new TaskScheduler();

/**
 * Web Worker utility for offloading heavy computations
 */
export function createWorkerPool(
	workerScript: string,
	poolSize: number = navigator.hardwareConcurrency || 4
): {
	execute: <T>(data: any) => Promise<T>;
	terminate: () => void;
} {
	const workers: Worker[] = [];
	const available: Worker[] = [];
	const busy = new Set<Worker>();

	// Create worker pool
	for (let i = 0; i < poolSize; i++) {
		const worker = new Worker(workerScript);
		workers.push(worker);
		available.push(worker);
	}

	async function execute<T>(data: any): Promise<T> {
		return new Promise((resolve, reject) => {
			const worker = available.pop();
			if (!worker) {
				reject(new Error('No workers available'));
				return;
			}

			busy.add(worker);

			const handleMessage = (event: MessageEvent) => {
				worker.removeEventListener('message', handleMessage);
				worker.removeEventListener('error', handleError);

				busy.delete(worker);
				available.push(worker);

				resolve(event.data);
			};

			const handleError = (error: ErrorEvent) => {
				worker.removeEventListener('message', handleMessage);
				worker.removeEventListener('error', handleError);

				busy.delete(worker);
				available.push(worker);

				reject(error);
			};

			worker.addEventListener('message', handleMessage);
			worker.addEventListener('error', handleError);
			worker.postMessage(data);
		});
	}

	function terminate(): void {
		workers.forEach((worker) => worker.terminate());
		workers.length = 0;
		available.length = 0;
		busy.clear();
	}

	return { execute, terminate };
}
