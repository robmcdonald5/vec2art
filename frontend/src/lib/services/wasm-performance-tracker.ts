/**
 * WASM Performance Tracker
 * Specialized performance monitoring for WebAssembly operations
 */

import type { WASMPerformanceMetrics, ProcessingAnalytics } from '../types/performance.js';
import {
	performanceMonitor,
	trackWASMMetrics,
	trackProcessingAnalytics,
	trackCustomMetric,
	trackError
} from './performance-monitor.js';

/**
 * WASM Performance Tracker Class
 * Handles all WASM-specific performance monitoring
 */
export class WASMPerformanceTracker {
	private moduleLoadStartTime?: number;
	private threadInitStartTime?: number;
	private processingStartTime?: number;
	private activeThreads = new Set<number>();
	private memoryUsageHistory: Array<{ timestamp: number; usage: number }> = [];
	private processingHistory: Array<ProcessingAnalytics> = [];

	/**
	 * Track WASM module loading performance
	 */
	trackModuleLoading(): { start: () => void; end: () => void } {
		return {
			start: () => {
				this.moduleLoadStartTime = performance.now();
				trackCustomMetric('wasm_module_load_started', 1);
			},
			end: () => {
				if (this.moduleLoadStartTime) {
					const loadTime = performance.now() - this.moduleLoadStartTime;
					trackCustomMetric('wasm_module_load_time', loadTime);

					// Update WASM metrics
					trackWASMMetrics({
						moduleLoadTime: loadTime
					});

					this.moduleLoadStartTime = undefined;
				}
			}
		};
	}

	/**
	 * Track WASM instantiation performance
	 */
	trackInstantiation(): { start: () => void; end: () => void } {
		let instantiationStartTime: number;

		return {
			start: () => {
				instantiationStartTime = performance.now();
				trackCustomMetric('wasm_instantiation_started', 1);
			},
			end: () => {
				const instantiationTime = performance.now() - instantiationStartTime;
				trackCustomMetric('wasm_instantiation_time', instantiationTime);

				trackWASMMetrics({
					instantiationTime
				});
			}
		};
	}

	/**
	 * Track thread pool initialization
	 */
	trackThreadPoolInit(): { start: () => void; end: (threadCount: number) => void } {
		return {
			start: () => {
				this.threadInitStartTime = performance.now();
				trackCustomMetric('wasm_thread_init_started', 1);
			},
			end: (threadCount: number) => {
				if (this.threadInitStartTime) {
					const initTime = performance.now() - this.threadInitStartTime;
					trackCustomMetric('wasm_thread_init_time', initTime);
					trackCustomMetric('wasm_thread_count', threadCount);

					trackWASMMetrics({
						threadPoolInitTime: initTime,
						activeThreadCount: threadCount
					});

					this.threadInitStartTime = undefined;
				}
			}
		};
	}

	/**
	 * Track thread utilization
	 */
	trackThreadUtilization(threadId: number, isActive: boolean): void {
		if (isActive) {
			this.activeThreads.add(threadId);
		} else {
			this.activeThreads.delete(threadId);
		}

		const utilization = this.activeThreads.size;
		trackCustomMetric('wasm_active_threads', utilization);

		trackWASMMetrics({
			activeThreadCount: utilization,
			threadUtilization: utilization / 12 // Assuming max 12 threads
		});
	}

	/**
	 * Track WASM memory usage
	 */
	trackMemoryUsage(wasmMemory: WebAssembly.Memory): void {
		const memorySize = wasmMemory.buffer.byteLength;
		const timestamp = Date.now();

		this.memoryUsageHistory.push({ timestamp, usage: memorySize });

		// Keep only last 100 measurements
		if (this.memoryUsageHistory.length > 100) {
			this.memoryUsageHistory.shift();
		}

		trackCustomMetric('wasm_memory_usage', memorySize);

		// Calculate heap utilization (approximation)
		const heapUtilization = this.calculateHeapUtilization(memorySize);

		trackWASMMetrics({
			wasmMemoryUsage: memorySize,
			heapUtilization
		});
	}

	/**
	 * Track image processing performance
	 */
	trackImageProcessing(
		backend: string,
		inputImage: { size: number; width: number; height: number; format: string },
		options: Record<string, any> = {}
	): {
		start: () => void;
		end: (result: { outputSize: number; pathCount: number }) => void;
	} {
		let startTime: number;
		let threadCount = this.activeThreads.size;

		return {
			start: () => {
				startTime = performance.now();
				this.processingStartTime = startTime;

				trackCustomMetric('image_processing_started', 1, {
					backend,
					format: inputImage.format,
					threadCount: threadCount.toString()
				});
			},
			end: (result: { outputSize: number; pathCount: number }) => {
				const processingTime = performance.now() - startTime;
				const compressionRatio = result.outputSize / inputImage.size;

				const analytics: ProcessingAnalytics = {
					inputImageSize: inputImage.size,
					inputDimensions: [inputImage.width, inputImage.height],
					inputFormat: inputImage.format,
					backend,
					threadCount,
					processingOptions: options,
					processingTime,
					outputSize: result.outputSize,
					compressionRatio,
					pathCount: result.pathCount,
					optimizationLevel: this.calculateOptimizationLevel(processingTime, inputImage.size)
				};

				// Track detailed metrics
				trackCustomMetric('image_processing_time', processingTime, {
					backend,
					format: inputImage.format
				});

				trackCustomMetric('compression_ratio', compressionRatio, { backend });
				trackCustomMetric('processing_throughput', inputImage.size / processingTime, { backend });
				trackCustomMetric('paths_per_second', result.pathCount / (processingTime / 1000), {
					backend
				});

				// Store processing analytics
				this.processingHistory.push(analytics);
				trackProcessingAnalytics(analytics);

				// Update algorithm performance metrics
				this.updateAlgorithmPerformance(backend, processingTime);

				this.processingStartTime = undefined;
			}
		};
	}

	/**
	 * Track algorithm-specific performance
	 */
	trackAlgorithmPerformance(
		algorithm: keyof WASMPerformanceMetrics['algorithmPerformance'],
		duration: number
	): void {
		trackCustomMetric(`algorithm_${algorithm}_time`, duration);

		const algorithmPerformance = {
			edge: 0,
			centerline: 0,
			superpixel: 0,
			dots: 0,
			[algorithm]: duration
		};

		trackWASMMetrics({
			algorithmPerformance
		});
	}

	/**
	 * Track WASM error with performance context
	 */
	trackWASMError(
		error: Error,
		context: {
			operation: string;
			threadCount?: number;
			memoryUsage?: number;
			processingTime?: number;
		}
	): void {
		const errorContext = {
			...context,
			type: 'wasm',
			activeThreads: this.activeThreads.size,
			memoryHistory: this.memoryUsageHistory.slice(-5), // Last 5 measurements
			processingHistory: this.processingHistory.slice(-3) // Last 3 processing operations
		};

		trackError(error, errorContext);

		// Track error-specific metrics
		trackCustomMetric('wasm_error_count', 1, {
			operation: context.operation,
			errorType: error.name
		});
	}

	/**
	 * Get current WASM performance snapshot
	 */
	getCurrentWASMMetrics(): WASMPerformanceMetrics {
		const latestMemory = this.memoryUsageHistory[this.memoryUsageHistory.length - 1];
		const avgAlgorithmPerf = this.calculateAverageAlgorithmPerformance();

		return {
			moduleLoadTime: 0, // Would be set during module loading
			instantiationTime: 0, // Would be set during instantiation
			threadPoolInitTime: 0, // Would be set during thread init
			activeThreadCount: this.activeThreads.size,
			threadUtilization: this.activeThreads.size / 12,
			algorithmPerformance: avgAlgorithmPerf,
			wasmMemoryUsage: latestMemory?.usage || 0,
			heapUtilization: this.calculateHeapUtilization(latestMemory?.usage || 0)
		};
	}

	/**
	 * Get processing performance insights
	 */
	getProcessingInsights(): {
		averageProcessingTime: number;
		bestPerformingBackend: string;
		recommendedThreadCount: number;
		memoryEfficiency: number;
	} {
		if (this.processingHistory.length === 0) {
			return {
				averageProcessingTime: 0,
				bestPerformingBackend: 'edge',
				recommendedThreadCount: 8,
				memoryEfficiency: 0
			};
		}

		const avgProcessingTime =
			this.processingHistory.reduce((sum, analytics) => sum + analytics.processingTime, 0) /
			this.processingHistory.length;

		const backendPerformance = this.processingHistory.reduce(
			(acc, analytics) => {
				if (!acc[analytics.backend]) {
					acc[analytics.backend] = { total: 0, count: 0 };
				}
				acc[analytics.backend].total += analytics.processingTime;
				acc[analytics.backend].count += 1;
				return acc;
			},
			{} as Record<string, { total: number; count: number }>
		);

		const bestBackend = Object.entries(backendPerformance).reduce(
			(best, [backend, perf]) => {
				const avgTime = perf.total / perf.count;
				return avgTime < best.avgTime ? { backend, avgTime } : best;
			},
			{ backend: 'edge', avgTime: Infinity }
		).backend;

		const threadPerformance = this.analyzeThreadPerformance();
		const memoryEfficiency = this.calculateMemoryEfficiency();

		return {
			averageProcessingTime: avgProcessingTime,
			bestPerformingBackend: bestBackend,
			recommendedThreadCount: threadPerformance.optimal,
			memoryEfficiency
		};
	}

	/**
	 * Track thread performance regression
	 */
	detectPerformanceRegression(): {
		hasRegression: boolean;
		severity: 'low' | 'medium' | 'high';
		affectedMetrics: string[];
	} {
		if (this.processingHistory.length < 5) {
			return { hasRegression: false, severity: 'low', affectedMetrics: [] };
		}

		const recent = this.processingHistory.slice(-3);
		const baseline = this.processingHistory.slice(-6, -3);

		const recentAvg = recent.reduce((sum, p) => sum + p.processingTime, 0) / recent.length;
		const baselineAvg = baseline.reduce((sum, p) => sum + p.processingTime, 0) / baseline.length;

		const regression = (recentAvg - baselineAvg) / baselineAvg;

		let severity: 'low' | 'medium' | 'high' = 'low';
		if (regression > 0.5) severity = 'high';
		else if (regression > 0.2) severity = 'medium';

		const affectedMetrics: string[] = [];
		if (regression > 0.1) affectedMetrics.push('processing_time');

		return {
			hasRegression: regression > 0.1,
			severity,
			affectedMetrics
		};
	}

	// Private methods

	private calculateHeapUtilization(memorySize: number): number {
		// Approximate heap utilization based on memory growth
		if (this.memoryUsageHistory.length < 2) return 0;

		const growth = this.memoryUsageHistory.slice(-5).reduce((acc, curr, idx, arr) => {
			if (idx === 0) return acc;
			return acc + (curr.usage - arr[idx - 1].usage);
		}, 0);

		return Math.min(100, Math.max(0, (growth / memorySize) * 100));
	}

	private calculateOptimizationLevel(processingTime: number, inputSize: number): number {
		// Simple optimization level calculation
		const throughput = inputSize / processingTime;
		if (throughput > 10000) return 3; // High optimization
		if (throughput > 5000) return 2; // Medium optimization
		return 1; // Basic optimization
	}

	private updateAlgorithmPerformance(backend: string, time: number): void {
		const algorithmPerformance = {
			edge: 0,
			centerline: 0,
			superpixel: 0,
			dots: 0
		};

		if (backend in algorithmPerformance) {
			algorithmPerformance[backend as keyof typeof algorithmPerformance] = time;

			trackWASMMetrics({
				algorithmPerformance
			});
		}
	}

	private calculateAverageAlgorithmPerformance(): WASMPerformanceMetrics['algorithmPerformance'] {
		const algorithms = { edge: [], centerline: [], superpixel: [], dots: [] } as Record<
			string,
			number[]
		>;

		this.processingHistory.forEach((analytics) => {
			if (analytics.backend in algorithms) {
				algorithms[analytics.backend].push(analytics.processingTime);
			}
		});

		return {
			edge: this.average(algorithms.edge),
			centerline: this.average(algorithms.centerline),
			superpixel: this.average(algorithms.superpixel),
			dots: this.average(algorithms.dots)
		};
	}

	private analyzeThreadPerformance(): { optimal: number; efficiency: Record<number, number> } {
		const threadPerformance = this.processingHistory.reduce(
			(acc, analytics) => {
				const threadCount = analytics.threadCount;
				if (!acc[threadCount]) {
					acc[threadCount] = { total: 0, count: 0 };
				}
				acc[threadCount].total += analytics.processingTime;
				acc[threadCount].count += 1;
				return acc;
			},
			{} as Record<number, { total: number; count: number }>
		);

		const efficiency = Object.entries(threadPerformance).reduce(
			(acc, [threads, perf]) => {
				acc[parseInt(threads)] = perf.total / perf.count;
				return acc;
			},
			{} as Record<number, number>
		);

		const optimal = Object.entries(efficiency).reduce((best, [threads, time]) => {
			return time < efficiency[best] ? parseInt(threads) : best;
		}, 8);

		return { optimal, efficiency };
	}

	private calculateMemoryEfficiency(): number {
		if (this.memoryUsageHistory.length === 0) return 0;

		const maxMemory = Math.max(...this.memoryUsageHistory.map((h) => h.usage));
		const avgMemory = this.average(this.memoryUsageHistory.map((h) => h.usage));

		return (avgMemory / maxMemory) * 100;
	}

	private average(numbers: number[]): number {
		return numbers.length > 0 ? numbers.reduce((sum, n) => sum + n, 0) / numbers.length : 0;
	}
}

// Create singleton instance
export const wasmPerformanceTracker = new WASMPerformanceTracker();

// Export helper functions for easy use
export function trackWASMModuleLoading() {
	return wasmPerformanceTracker.trackModuleLoading();
}

export function trackWASMInstantiation() {
	return wasmPerformanceTracker.trackInstantiation();
}

export function trackWASMThreadPoolInit() {
	return wasmPerformanceTracker.trackThreadPoolInit();
}

export function trackWASMThreadUtilization(threadId: number, isActive: boolean) {
	wasmPerformanceTracker.trackThreadUtilization(threadId, isActive);
}

export function trackWASMMemoryUsage(wasmMemory: WebAssembly.Memory) {
	wasmPerformanceTracker.trackMemoryUsage(wasmMemory);
}

export function trackWASMImageProcessing(
	backend: string,
	inputImage: { size: number; width: number; height: number; format: string },
	options?: Record<string, any>
) {
	return wasmPerformanceTracker.trackImageProcessing(backend, inputImage, options);
}

export function trackWASMAlgorithmPerformance(
	algorithm: keyof WASMPerformanceMetrics['algorithmPerformance'],
	duration: number
) {
	wasmPerformanceTracker.trackAlgorithmPerformance(algorithm, duration);
}

export function trackWASMError(error: Error, context: any) {
	wasmPerformanceTracker.trackWASMError(error, context);
}

export function getCurrentWASMMetrics(): WASMPerformanceMetrics {
	return wasmPerformanceTracker.getCurrentWASMMetrics();
}

export function getProcessingInsights() {
	return wasmPerformanceTracker.getProcessingInsights();
}

export function detectWASMPerformanceRegression() {
	return wasmPerformanceTracker.detectPerformanceRegression();
}
