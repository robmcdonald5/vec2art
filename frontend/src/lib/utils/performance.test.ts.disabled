/**
 * @file performance.test.ts
 * Comprehensive tests for performance utility functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	PerformanceMonitor,
	globalPerformanceMonitor as _globalPerformanceMonitor,
	debounce,
	throttle,
	memoize,
	AnimationFrameManager,
	globalAnimationFrameManager as _globalAnimationFrameManager,
	createLazyLoader,
	ResourcePool,
	TaskScheduler,
	globalTaskScheduler as _globalTaskScheduler,
	createWorkerPool
} from './performance';
import { setupBrowserMocks, cleanupBrowserMocks } from '@tests/test-utils';

describe('Performance Utilities', () => {
	beforeEach(() => {
		setupBrowserMocks();
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	afterEach(() => {
		cleanupBrowserMocks();
		vi.useRealTimers();
	});

	describe('PerformanceMonitor', () => {
		let monitor: PerformanceMonitor;

		beforeEach(() => {
			monitor = new PerformanceMonitor();
		});

		afterEach(() => {
			monitor.dispose();
		});

		describe('Basic Functionality', () => {
			it('should add custom metrics', () => {
				const metric = {
					name: 'test-metric',
					value: 100,
					unit: 'ms' as const,
					timestamp: Date.now(),
					category: 'custom' as const
				};

				monitor.addMetric(metric);
				const metrics = monitor.getMetrics();

				expect(metrics).toHaveLength(1);
				expect(metrics[0]).toEqual(metric);
			});

			it('should filter metrics by category', () => {
				const timingMetric = {
					name: 'timing-test',
					value: 50,
					unit: 'ms' as const,
					timestamp: Date.now(),
					category: 'timing' as const
				};

				const memoryMetric = {
					name: 'memory-test',
					value: 1024,
					unit: 'bytes' as const,
					timestamp: Date.now(),
					category: 'memory' as const
				};

				monitor.addMetric(timingMetric);
				monitor.addMetric(memoryMetric);

				const timingMetrics = monitor.getMetrics('timing');
				const memoryMetrics = monitor.getMetrics('memory');

				expect(timingMetrics).toHaveLength(1);
				expect(timingMetrics[0]).toEqual(timingMetric);
				expect(memoryMetrics).toHaveLength(1);
				expect(memoryMetrics[0]).toEqual(memoryMetric);
			});

			it('should clear all metrics', () => {
				monitor.addMetric({
					name: 'test',
					value: 100,
					unit: 'ms',
					timestamp: Date.now(),
					category: 'custom'
				});

				expect(monitor.getMetrics()).toHaveLength(1);

				monitor.clear();
				expect(monitor.getMetrics()).toHaveLength(0);
			});
		});

		describe('Function Measurement', () => {
			it('should measure synchronous function execution time', () => {
				const testFunction = vi.fn(() => {
					// Simulate some work
					const start = Date.now();
					while (Date.now() - start < 10) {
						// Busy wait
					}
					return 'result';
				});

				const result = monitor.measure('sync-test', testFunction);

				expect(result).toBe('result');
				expect(testFunction).toHaveBeenCalled();

				const metrics = monitor.getMetrics('custom');
				expect(metrics).toHaveLength(1);
				expect(metrics[0].name).toBe('sync-test');
				expect(metrics[0].value).toBeGreaterThan(0);
				expect(metrics[0].unit).toBe('ms');
			});

			it('should measure asynchronous function execution time', async () => {
				const testFunction = vi.fn(async () => {
					await new Promise((resolve) => setTimeout(resolve, 10));
					return 'async-result';
				});

				const result = await monitor.measureAsync('async-test', testFunction);

				expect(result).toBe('async-result');
				expect(testFunction).toHaveBeenCalled();

				const metrics = monitor.getMetrics('custom');
				expect(metrics).toHaveLength(1);
				expect(metrics[0].name).toBe('async-test');
				expect(metrics[0].value).toBeGreaterThan(0);
			});

			it('should handle synchronous function errors', () => {
				const errorFunction = vi.fn(() => {
					throw new Error('Test error');
				});

				expect(() => monitor.measure('error-test', errorFunction)).toThrow('Test error');

				const metrics = monitor.getMetrics('custom');
				expect(metrics).toHaveLength(1);
				expect(metrics[0].name).toBe('error-test-error');
			});

			it('should handle asynchronous function errors', async () => {
				const errorFunction = vi.fn(async () => {
					throw new Error('Async test error');
				});

				await expect(monitor.measureAsync('async-error-test', errorFunction)).rejects.toThrow(
					'Async test error'
				);

				const metrics = monitor.getMetrics('custom');
				expect(metrics).toHaveLength(1);
				expect(metrics[0].name).toBe('async-error-test-error');
			});
		});

		describe('Memory Monitoring', () => {
			it('should record memory usage when available', () => {
				// Mock performance.memory
				Object.defineProperty(performance, 'memory', {
					value: {
						usedJSHeapSize: 1024 * 1024,
						totalJSHeapSize: 2 * 1024 * 1024,
						jsHeapSizeLimit: 10 * 1024 * 1024
					},
					configurable: true
				});

				monitor.recordMemoryUsage();

				const memoryMetrics = monitor.getMetrics('memory');
				expect(memoryMetrics).toHaveLength(3);

				const heapUsed = memoryMetrics.find((m) => m.name === 'heap-used');
				const heapTotal = memoryMetrics.find((m) => m.name === 'heap-total');
				const heapLimit = memoryMetrics.find((m) => m.name === 'heap-limit');

				expect(heapUsed?.value).toBe(1024 * 1024);
				expect(heapTotal?.value).toBe(2 * 1024 * 1024);
				expect(heapLimit?.value).toBe(10 * 1024 * 1024);
			});

			it('should handle missing memory API gracefully', () => {
				// Ensure performance.memory is not available
				delete (performance as any).memory;

				expect(() => monitor.recordMemoryUsage()).not.toThrow();

				const memoryMetrics = monitor.getMetrics('memory');
				expect(memoryMetrics).toHaveLength(0);
			});
		});

		describe('Summary Generation', () => {
			it('should generate metrics summary', () => {
				// Add multiple metrics with same name
				monitor.addMetric({
					name: 'test-metric',
					value: 10,
					unit: 'ms',
					timestamp: Date.now(),
					category: 'custom'
				});

				monitor.addMetric({
					name: 'test-metric',
					value: 20,
					unit: 'ms',
					timestamp: Date.now(),
					category: 'custom'
				});

				monitor.addMetric({
					name: 'test-metric',
					value: 30,
					unit: 'ms',
					timestamp: Date.now(),
					category: 'custom'
				});

				const summary = monitor.getSummary();

				expect(summary['test-metric']).toEqual({
					min: 10,
					max: 30,
					avg: 20,
					count: 3
				});
			});
		});

		describe('Performance Budget', () => {
			it('should warn when budget is exceeded', () => {
				const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

				const monitor = new PerformanceMonitor({
					custom: { 'test-metric': 50 }
				});

				monitor.addMetric({
					name: 'test-metric',
					value: 100, // Exceeds budget of 50
					unit: 'ms',
					timestamp: Date.now(),
					category: 'custom'
				});

				expect(consoleSpy).toHaveBeenCalledWith(
					expect.stringContaining('Performance budget exceeded for test-metric')
				);

				monitor.dispose();
				consoleSpy.mockRestore();
			});

			it('should handle custom budget configuration', () => {
				const monitor = new PerformanceMonitor({
					timing: {
						initial_load: 1000,
						first_paint: 500,
						first_contentful_paint: 750,
						largest_contentful_paint: 1250,
						time_to_interactive: 2000
					}
				});

				expect(() => monitor).not.toThrow();
				monitor.dispose();
			});
		});
	});

	describe('debounce', () => {
		it('should delay function execution', () => {
			const fn = vi.fn();
			const debouncedFn = debounce(fn, 100);

			debouncedFn();
			expect(fn).not.toHaveBeenCalled();

			vi.advanceTimersByTime(100);
			expect(fn).toHaveBeenCalledTimes(1);
		});

		it('should reset delay on subsequent calls', () => {
			const fn = vi.fn();
			const debouncedFn = debounce(fn, 100);

			debouncedFn();
			vi.advanceTimersByTime(50);
			debouncedFn();
			vi.advanceTimersByTime(50);

			expect(fn).not.toHaveBeenCalled();

			vi.advanceTimersByTime(50);
			expect(fn).toHaveBeenCalledTimes(1);
		});

		it('should execute immediately when immediate flag is set', () => {
			const fn = vi.fn();
			const debouncedFn = debounce(fn, 100, true);

			debouncedFn();
			expect(fn).toHaveBeenCalledTimes(1);

			debouncedFn();
			expect(fn).toHaveBeenCalledTimes(1); // Should not call again immediately
		});

		it('should pass arguments correctly', () => {
			const fn = vi.fn();
			const debouncedFn = debounce(fn, 100);

			debouncedFn('arg1', 'arg2');
			vi.advanceTimersByTime(100);

			expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
		});
	});

	describe('throttle', () => {
		it('should limit function execution rate', () => {
			const fn = vi.fn();
			const throttledFn = throttle(fn, 100);

			throttledFn();
			expect(fn).toHaveBeenCalledTimes(1);

			throttledFn();
			throttledFn();
			expect(fn).toHaveBeenCalledTimes(1);

			vi.advanceTimersByTime(100);
			throttledFn();
			expect(fn).toHaveBeenCalledTimes(2);
		});

		it('should pass arguments correctly', () => {
			const fn = vi.fn();
			const throttledFn = throttle(fn, 100);

			throttledFn('arg1', 'arg2');
			expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
		});
	});

	describe('memoize', () => {
		it('should cache function results', () => {
			const fn = vi.fn((x: number) => x * 2);
			const memoizedFn = memoize(fn);

			const result1 = memoizedFn(5);
			const result2 = memoizedFn(5);

			expect(result1).toBe(10);
			expect(result2).toBe(10);
			expect(fn).toHaveBeenCalledTimes(1);
		});

		it('should use custom key generator', () => {
			const fn = vi.fn((obj: { x: number; y: number }) => obj.x + obj.y);
			const memoizedFn = memoize(fn, (obj) => `${obj.x}-${obj.y}`);

			const result1 = memoizedFn({ x: 1, y: 2 });
			const result2 = memoizedFn({ x: 1, y: 2 });

			expect(result1).toBe(3);
			expect(result2).toBe(3);
			expect(fn).toHaveBeenCalledTimes(1);
		});

		it('should provide cache access and clearing', () => {
			const fn = vi.fn((x: number) => x * 2);
			const memoizedFn = memoize(fn);

			memoizedFn(5);
			expect(memoizedFn.cache.size).toBe(1);

			memoizedFn.clearCache();
			expect(memoizedFn.cache.size).toBe(0);

			memoizedFn(5);
			expect(fn).toHaveBeenCalledTimes(2);
		});
	});

	describe('AnimationFrameManager', () => {
		let manager: AnimationFrameManager;

		beforeEach(() => {
			manager = new AnimationFrameManager();
		});

		it('should schedule callbacks for next frame', () => {
			const callback1 = vi.fn();
			const callback2 = vi.fn();

			manager.schedule(callback1);
			manager.schedule(callback2);

			expect(callback1).not.toHaveBeenCalled();
			expect(callback2).not.toHaveBeenCalled();

			// Simulate requestAnimationFrame
			vi.advanceTimersByTime(16);

			expect(callback1).toHaveBeenCalled();
			expect(callback2).toHaveBeenCalled();
		});

		it('should handle callback errors gracefully', () => {
			const errorCallback = vi.fn(() => {
				throw new Error('Callback error');
			});
			const normalCallback = vi.fn();

			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

			manager.schedule(errorCallback);
			manager.schedule(normalCallback);

			vi.advanceTimersByTime(16);

			expect(errorCallback).toHaveBeenCalled();
			expect(normalCallback).toHaveBeenCalled();
			expect(consoleSpy).toHaveBeenCalledWith('Animation frame callback error:', expect.any(Error));

			consoleSpy.mockRestore();
		});

		it('should allow unscheduling callbacks', () => {
			const callback = vi.fn();

			manager.schedule(callback);
			manager.unschedule(callback);

			vi.advanceTimersByTime(16);

			expect(callback).not.toHaveBeenCalled();
		});
	});

	describe('createLazyLoader', () => {
		it('should load resource only when first accessed', async () => {
			const loader = vi.fn().mockResolvedValue('loaded-resource');
			const lazyLoader = createLazyLoader(loader);

			expect(loader).not.toHaveBeenCalled();

			const result = await lazyLoader();
			expect(result).toBe('loaded-resource');
			expect(loader).toHaveBeenCalledTimes(1);
		});

		it('should cache the result for subsequent calls', async () => {
			const loader = vi.fn().mockResolvedValue('loaded-resource');
			const lazyLoader = createLazyLoader(loader);

			const result1 = await lazyLoader();
			const result2 = await lazyLoader();

			expect(result1).toBe('loaded-resource');
			expect(result2).toBe('loaded-resource');
			expect(loader).toHaveBeenCalledTimes(1);
		});

		it('should handle loader errors', async () => {
			const loader = vi.fn().mockRejectedValue(new Error('Load failed'));
			const lazyLoader = createLazyLoader(loader);

			await expect(lazyLoader()).rejects.toThrow('Load failed');

			// Should not cache error, next call should try again
			const loader2 = vi.fn().mockResolvedValue('success');
			const lazyLoader2 = createLazyLoader(loader2);

			const result = await lazyLoader2();
			expect(result).toBe('success');
		});

		it('should support timeout-based cache invalidation', async () => {
			const loader = vi.fn().mockResolvedValue('resource');
			const lazyLoader = createLazyLoader(loader, 100);

			await lazyLoader();
			expect(loader).toHaveBeenCalledTimes(1);

			vi.advanceTimersByTime(150);

			await lazyLoader();
			expect(loader).toHaveBeenCalledTimes(2);
		});
	});

	describe('ResourcePool', () => {
		let pool: ResourcePool<{ id: number }>;

		beforeEach(() => {
			let id = 0;
			pool = new ResourcePool(() => ({ id: id++ }), { maxSize: 3 });
		});

		afterEach(() => {
			pool.clear();
		});

		it('should create resources on demand', () => {
			const resource = pool.acquire();
			expect(resource).toEqual({ id: 0 });

			const stats = pool.getStats();
			expect(stats.inUse).toBe(1);
			expect(stats.available).toBe(0);
		});

		it('should reuse released resources', () => {
			const resource1 = pool.acquire();
			pool.release(resource1);

			const resource2 = pool.acquire();
			expect(resource2).toBe(resource1); // Same object reference
		});

		it('should respect maximum pool size', () => {
			const resources = [pool.acquire(), pool.acquire(), pool.acquire()];
			resources.forEach((r) => pool.release(r));

			const extraResource = pool.acquire();
			pool.release(extraResource);

			const stats = pool.getStats();
			expect(stats.available).toBe(3); // Should not exceed maxSize
		});

		it('should call cleanup function when pool is full', () => {
			const cleanup = vi.fn();
			const poolWithCleanup = new ResourcePool(() => ({ value: 'test' }), { maxSize: 1, cleanup });

			const resource1 = poolWithCleanup.acquire();
			const resource2 = poolWithCleanup.acquire();

			poolWithCleanup.release(resource1);
			poolWithCleanup.release(resource2);

			expect(cleanup).toHaveBeenCalledWith(resource2);
			poolWithCleanup.clear();
		});

		it('should initialize with pre-created resources', () => {
			const initialPool = new ResourcePool(() => ({ value: 'initial' }), { initialSize: 2 });

			const stats = initialPool.getStats();
			expect(stats.available).toBe(2);
			expect(stats.inUse).toBe(0);

			initialPool.clear();
		});

		it('should warn when releasing non-acquired resources', () => {
			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

			const foreignResource = { id: 999 };
			pool.release(foreignResource);

			expect(consoleSpy).toHaveBeenCalledWith(
				'Attempting to release resource not acquired from this pool'
			);

			consoleSpy.mockRestore();
		});
	});

	describe('TaskScheduler', () => {
		let scheduler: TaskScheduler;

		beforeEach(() => {
			scheduler = new TaskScheduler();
		});

		afterEach(() => {
			scheduler.clear();
		});

		it('should execute scheduled tasks', async () => {
			const task = vi.fn();
			scheduler.schedule(task);

			await vi.runAllTimersAsync();

			expect(task).toHaveBeenCalled();
		});

		it('should execute tasks in priority order', async () => {
			const execOrder: number[] = [];

			scheduler.schedule(() => execOrder.push(1), 1);
			scheduler.schedule(() => execOrder.push(3), 3);
			scheduler.schedule(() => execOrder.push(2), 2);

			await vi.runAllTimersAsync();

			expect(execOrder).toEqual([3, 2, 1]); // Higher priority first
		});

		it('should handle task errors gracefully', async () => {
			const errorTask = vi.fn(() => {
				throw new Error('Task error');
			});
			const normalTask = vi.fn();

			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

			scheduler.schedule(errorTask);
			scheduler.schedule(normalTask);

			await vi.runAllTimersAsync();

			expect(errorTask).toHaveBeenCalled();
			expect(normalTask).toHaveBeenCalled();
			expect(consoleSpy).toHaveBeenCalledWith('Scheduled task error:', expect.any(Error));

			consoleSpy.mockRestore();
		});

		it('should provide pending task count', () => {
			scheduler.schedule(() => {});
			scheduler.schedule(() => {});

			expect(scheduler.getPendingCount()).toBe(2);

			scheduler.clear();
			expect(scheduler.getPendingCount()).toBe(0);
		});
	});

	describe('createWorkerPool', () => {
		it('should create worker pool with correct size', () => {
			const mockWorker = {
				postMessage: vi.fn(),
				terminate: vi.fn(),
				addEventListener: vi.fn(),
				removeEventListener: vi.fn()
			};

			global.Worker = vi.fn().mockImplementation(() => mockWorker);

			const pool = createWorkerPool('test-worker.js', 2);

			expect(global.Worker).toHaveBeenCalledTimes(2);
			expect(global.Worker).toHaveBeenCalledWith('test-worker.js');

			pool.terminate();
		});

		it('should execute tasks using available workers', async () => {
			const mockWorker = {
				postMessage: vi.fn(),
				terminate: vi.fn(),
				addEventListener: vi.fn(),
				removeEventListener: vi.fn()
			};

			global.Worker = vi.fn().mockImplementation(() => mockWorker);

			const pool = createWorkerPool('test-worker.js', 1);

			const executePromise = pool.execute({ data: 'test' });

			// Simulate worker response
			const messageHandler = mockWorker.addEventListener.mock.calls.find(
				(call) => call[0] === 'message'
			)?.[1];

			if (messageHandler) {
				messageHandler({ data: 'result' });
			}

			const result = await executePromise;
			expect(result).toBe('result');
			expect(mockWorker.postMessage).toHaveBeenCalledWith({ data: 'test' });

			pool.terminate();
		});

		it('should handle worker errors', async () => {
			const mockWorker = {
				postMessage: vi.fn(),
				terminate: vi.fn(),
				addEventListener: vi.fn(),
				removeEventListener: vi.fn()
			};

			global.Worker = vi.fn().mockImplementation(() => mockWorker);

			const pool = createWorkerPool('test-worker.js', 1);

			const executePromise = pool.execute({ data: 'test' });

			// Simulate worker error
			const errorHandler = mockWorker.addEventListener.mock.calls.find(
				(call) => call[0] === 'error'
			)?.[1];

			if (errorHandler) {
				errorHandler(new Error('Worker error'));
			}

			await expect(executePromise).rejects.toThrow('Worker error');

			pool.terminate();
		});

		it('should reject when no workers are available', async () => {
			global.Worker = vi.fn().mockImplementation(() => ({
				postMessage: vi.fn(),
				terminate: vi.fn(),
				addEventListener: vi.fn(),
				removeEventListener: vi.fn()
			}));

			const pool = createWorkerPool('test-worker.js', 0);

			await expect(pool.execute({ data: 'test' })).rejects.toThrow('No workers available');

			pool.terminate();
		});
	});

	describe('Edge Cases and Error Handling', () => {
		it('should handle missing performance API gracefully', () => {
			const originalPerformance = global.performance;
			delete (global as any).performance;

			expect(() => new PerformanceMonitor()).not.toThrow();

			global.performance = originalPerformance;
		});

		it('should handle missing Worker API gracefully', () => {
			const originalWorker = global.Worker;
			delete (global as any).Worker;

			expect(() => createWorkerPool('test.js', 1)).toThrow();

			global.Worker = originalWorker;
		});

		it('should handle invalid function inputs gracefully', () => {
			expect(() => debounce(null as any, 100)).not.toThrow();
			expect(() => throttle(undefined as any, 100)).not.toThrow();
			expect(() => memoize(() => {}, null as any)).not.toThrow();
		});
	});

	describe('Performance', () => {
		it('should handle large numbers of metrics efficiently', () => {
			const monitor = new PerformanceMonitor();
			const startTime = performance.now();

			// Add 1000 metrics
			for (let i = 0; i < 1000; i++) {
				monitor.addMetric({
					name: `metric-${i}`,
					value: i,
					unit: 'ms',
					timestamp: Date.now(),
					category: 'custom'
				});
			}

			const endTime = performance.now();
			expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms

			monitor.dispose();
		});

		it('should handle rapid debounce calls efficiently', () => {
			const fn = vi.fn();
			const debouncedFn = debounce(fn, 100);

			const startTime = performance.now();

			// Make 1000 rapid calls
			for (let i = 0; i < 1000; i++) {
				debouncedFn();
			}

			const endTime = performance.now();
			expect(endTime - startTime).toBeLessThan(50); // Should complete within 50ms

			vi.advanceTimersByTime(100);
			expect(fn).toHaveBeenCalledTimes(1);
		});
	});
});
