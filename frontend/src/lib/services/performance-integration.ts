/**
 * Performance Integration Service
 * Central coordination and initialization of all performance monitoring components
 */

import { performanceMonitor } from './performance-monitor.js';
import { wasmPerformanceTracker } from './wasm-performance-tracker.js';
import { errorTracker } from './error-tracker.js';
import { resourceMonitor } from './resource-monitor.js';
import { uxAnalytics } from './ux-analytics.js';
import type { PerformanceBudgets, AnalyticsProvider } from '../types/performance.js';

/**
 * Performance Integration Configuration
 */
export interface PerformanceConfig {
	budgets?: Partial<PerformanceBudgets>;
	analyticsProviders?: AnalyticsProvider[];
	autoStart?: boolean;
	resourceMonitoringInterval?: number;
	enableWebVitals?: boolean;
	enableWASMTracking?: boolean;
	enableUXTracking?: boolean;
	enableErrorTracking?: boolean;
	enableResourceMonitoring?: boolean;
	enableDevTools?: boolean;
	debugMode?: boolean;
}

/**
 * Performance Integration Service Class
 */
export class PerformanceIntegrationService {
	private config: Required<PerformanceConfig>;
	private isInitialized = false;
	private isRunning = false;

	constructor(config: PerformanceConfig = {}) {
		this.config = {
			budgets: {},
			analyticsProviders: [],
			autoStart: true,
			resourceMonitoringInterval: 5000,
			enableWebVitals: true,
			enableWASMTracking: true,
			enableUXTracking: true,
			enableErrorTracking: true,
			enableResourceMonitoring: true,
			enableDevTools: false,
			debugMode: false,
			...config
		};
	}

	/**
	 * Initialize the performance monitoring system
	 */
	async initialize(): Promise<void> {
		if (this.isInitialized) {
			console.warn('Performance monitoring already initialized');
			return;
		}

		this.log('Initializing performance monitoring system...');

		try {
			// Initialize performance monitor with budgets
			if (this.config.budgets) {
				// Performance monitor is already initialized via import
			}

			// Add analytics providers
			this.config.analyticsProviders.forEach((provider) => {
				performanceMonitor.addAnalyticsProvider(provider);
			});

			// Set up component integrations
			this.setupIntegrations();

			this.isInitialized = true;
			this.log('Performance monitoring system initialized successfully');

			// Auto-start if configured
			if (this.config.autoStart) {
				await this.start();
			}
		} catch (error) {
			console.error('Failed to initialize performance monitoring:', error);
			throw error;
		}
	}

	/**
	 * Start all performance monitoring
	 */
	async start(): Promise<void> {
		if (!this.isInitialized) {
			await this.initialize();
		}

		if (this.isRunning) {
			console.warn('Performance monitoring already running');
			return;
		}

		this.log('Starting performance monitoring...');

		try {
			// Start session
			const sessionId = performanceMonitor.startSession();
			this.log(`Started session: ${sessionId}`);

			// Start Web Vitals tracking
			if (this.config.enableWebVitals) {
				performanceMonitor.trackWebVitals();
				this.log('Web Vitals tracking started');
			}

			// Start UX analytics
			if (this.config.enableUXTracking) {
				uxAnalytics.startTracking();
				this.log('UX analytics started');
			}

			// Start resource monitoring
			if (this.config.enableResourceMonitoring) {
				resourceMonitor.startMonitoring(this.config.resourceMonitoringInterval);
				this.log('Resource monitoring started');
			}

			// Track initial page view
			this.trackInitialPageView();

			this.isRunning = true;
			this.log('Performance monitoring started successfully');
		} catch (error) {
			console.error('Failed to start performance monitoring:', error);
			throw error;
		}
	}

	/**
	 * Stop all performance monitoring
	 */
	stop(): void {
		if (!this.isRunning) {
			console.warn('Performance monitoring not running');
			return;
		}

		this.log('Stopping performance monitoring...');

		// Stop UX analytics
		if (this.config.enableUXTracking) {
			uxAnalytics.stopTracking();
		}

		// Stop resource monitoring
		if (this.config.enableResourceMonitoring) {
			resourceMonitor.stopMonitoring();
		}

		// End session
		const sessionId = performanceMonitor.getCurrentSession().sessionId;
		performanceMonitor.endSession(sessionId);

		this.isRunning = false;
		this.log('Performance monitoring stopped');
	}

	/**
	 * Track WASM module loading
	 */
	trackWASMModuleLoad(): { start: () => void; end: () => void } {
		if (!this.config.enableWASMTracking) {
			return { start: () => {}, end: () => {} };
		}

		return wasmPerformanceTracker.trackModuleLoading();
	}

	/**
	 * Track WASM instantiation
	 */
	trackWASMInstantiation(): { start: () => void; end: () => void } {
		if (!this.config.enableWASMTracking) {
			return { start: () => {}, end: () => {} };
		}

		return wasmPerformanceTracker.trackInstantiation();
	}

	/**
	 * Track WASM thread pool initialization
	 */
	trackWASMThreadPoolInit(): { start: () => void; end: (threadCount: number) => void } {
		if (!this.config.enableWASMTracking) {
			return { start: () => {}, end: () => {} };
		}

		return wasmPerformanceTracker.trackThreadPoolInit();
	}

	/**
	 * Track image processing operation
	 */
	trackImageProcessing(
		backend: string,
		inputImage: { size: number; width: number; height: number; format: string },
		options?: Record<string, any>
	): { start: () => void; end: (result: { outputSize: number; pathCount: number }) => void } {
		if (!this.config.enableWASMTracking) {
			return { start: () => {}, end: () => {} };
		}

		return wasmPerformanceTracker.trackImageProcessing(backend, inputImage, options);
	}

	/**
	 * Track user task
	 */
	trackUserTask(
		taskId: string,
		taskName: string
	): {
		addStep: (stepName: string, metadata?: Record<string, any>) => void;
		complete: (success?: boolean, metadata?: Record<string, any>) => void;
		error: (error: string, metadata?: Record<string, any>) => void;
	} {
		if (!this.config.enableUXTracking) {
			return {
				addStep: () => {},
				complete: () => {},
				error: () => {}
			};
		}

		uxAnalytics.startTask(taskId, taskName);

		return {
			addStep: (stepName: string, metadata?: Record<string, any>) => {
				uxAnalytics.addTaskStep(taskId, stepName, metadata);
			},
			complete: (success = true, metadata?: Record<string, any>) => {
				uxAnalytics.completeTask(taskId, success, metadata);
			},
			error: (error: string, metadata?: Record<string, any>) => {
				uxAnalytics.trackTaskError(taskId, error, metadata);
			}
		};
	}

	/**
	 * Track feature usage
	 */
	trackFeature(featureName: string): {
		start: () => void;
		end: (completed?: boolean, error?: string) => void;
	} {
		if (!this.config.enableUXTracking) {
			return { start: () => {}, end: () => {} };
		}

		let startTime: number;

		return {
			start: () => {
				startTime = performance.now();
			},
			end: (completed = true, error?: string) => {
				const duration = performance.now() - startTime;
				uxAnalytics.trackFeatureUsage(featureName, duration, completed, error);
			}
		};
	}

	/**
	 * Track application error
	 */
	trackError(error: Error, context?: Record<string, any>): string {
		if (!this.config.enableErrorTracking) {
			return '';
		}

		return errorTracker.trackError(error, context);
	}

	/**
	 * Get comprehensive performance report
	 */
	getPerformanceReport(): {
		session: any;
		webVitals: any;
		wasm: any;
		resources: any;
		ux: any;
		errors: any;
		recommendations: string[];
	} {
		const session = performanceMonitor.getCurrentSession();
		const webVitals = performanceMonitor.getRealtimeMetrics();
		const wasm = wasmPerformanceTracker.getCurrentWASMMetrics();
		const resources = resourceMonitor.getCurrentResources();
		const ux = uxAnalytics.exportUXData();
		const errors = errorTracker.exportErrorData();

		const recommendations = this.generateRecommendations(wasm, resources, ux, errors);

		return {
			session,
			webVitals,
			wasm,
			resources,
			ux,
			errors,
			recommendations
		};
	}

	/**
	 * Export all performance data
	 */
	exportAllData(): any {
		return {
			timestamp: new Date().toISOString(),
			config: this.config,
			isRunning: this.isRunning,
			report: this.getPerformanceReport()
		};
	}

	/**
	 * Check system health
	 */
	checkSystemHealth(): {
		overall: 'healthy' | 'warning' | 'critical';
		details: Record<string, any>;
		recommendations: string[];
	} {
		const resources = resourceMonitor.getCurrentResources();
		const errors = errorTracker.getErrorStatistics();
		const ux = uxAnalytics.getUXHeuristics();

		let overall: 'healthy' | 'warning' | 'critical' = 'healthy';
		const details: Record<string, any> = {};
		const recommendations: string[] = [];

		// Check memory usage
		const memoryUsageMB = resources.heapUsage / (1024 * 1024);
		if (memoryUsageMB > 256) {
			overall = 'critical';
			details.memory = 'Critical';
			recommendations.push(
				'Memory usage is very high. Consider clearing caches or reducing image sizes.'
			);
		} else if (memoryUsageMB > 128) {
			if (overall === 'healthy') overall = 'warning';
			details.memory = 'Warning';
			recommendations.push('Memory usage is elevated. Monitor for memory leaks.');
		} else {
			details.memory = 'Healthy';
		}

		// Check error rate
		if (errors.totalErrors > 10) {
			overall = 'critical';
			details.errors = 'Critical';
			recommendations.push('High error count detected. Check error logs for patterns.');
		} else if (errors.totalErrors > 5) {
			if (overall === 'healthy') overall = 'warning';
			details.errors = 'Warning';
			recommendations.push('Moderate error count. Monitor error trends.');
		} else {
			details.errors = 'Healthy';
		}

		// Check UX score
		if (ux.overallScore < 60) {
			overall = 'critical';
			details.ux = 'Critical';
			recommendations.push('User experience score is low. Review usability and performance.');
		} else if (ux.overallScore < 80) {
			if (overall === 'healthy') overall = 'warning';
			details.ux = 'Warning';
			recommendations.push('User experience could be improved.');
		} else {
			details.ux = 'Healthy';
		}

		return { overall, details, recommendations };
	}

	// Private methods

	private setupIntegrations(): void {
		// Set up WASM error tracking
		if (this.config.enableWASMTracking && this.config.enableErrorTracking) {
			// WASM tracker will use error tracker automatically
		}

		// Set up resource monitoring alerts
		if (this.config.enableResourceMonitoring) {
			// Resource monitor will generate alerts automatically
		}
	}

	private trackInitialPageView(): void {
		if (this.config.enableUXTracking) {
			uxAnalytics.trackPageView(window.location.href, document.title, {
				referrer: document.referrer,
				userAgent: navigator.userAgent,
				viewport: {
					width: window.innerWidth,
					height: window.innerHeight
				}
			});
		}
	}

	private generateRecommendations(wasm: any, resources: any, ux: any, errors: any): string[] {
		const recommendations: string[] = [];

		// WASM recommendations
		if (wasm.activeThreadCount < 8) {
			recommendations.push('Consider increasing thread count for better WASM performance');
		}

		if (wasm.moduleLoadTime > 1000) {
			recommendations.push(
				'WASM module loading is slow. Check network conditions or enable caching'
			);
		}

		// Resource recommendations
		const memoryUsageMB = resources.heapUsage / (1024 * 1024);
		if (memoryUsageMB > 128) {
			recommendations.push('High memory usage detected. Consider optimizing memory usage');
		}

		if (resources.cpuUsage > 80) {
			recommendations.push('High CPU usage detected. Consider optimizing processing algorithms');
		}

		// UX recommendations
		if (ux.analytics.taskCompletionRate < 80) {
			recommendations.push('Low task completion rate. Review user flow and error handling');
		}

		if (ux.analytics.averageTaskTime > 120000) {
			recommendations.push('Tasks are taking too long. Consider optimizing processing speed');
		}

		// Error recommendations
		if (errors.statistics.recoveryRate < 70) {
			recommendations.push(
				'Low error recovery rate. Improve error handling and recovery mechanisms'
			);
		}

		return recommendations;
	}

	private log(message: string): void {
		if (this.config.debugMode) {
			console.log(`[PerformanceIntegration] ${message}`);
		}
	}
}

// Create default instance
export const performanceIntegration = new PerformanceIntegrationService();

// Convenience functions for easy integration
export async function initializePerformanceMonitoring(config?: PerformanceConfig): Promise<void> {
	const service = new PerformanceIntegrationService(config);
	await service.initialize();
	return service.start();
}

export function trackWASMLoading() {
	return performanceIntegration.trackWASMModuleLoad();
}

export function trackWASMInstantiation() {
	return performanceIntegration.trackWASMInstantiation();
}

export function trackWASMThreads() {
	return performanceIntegration.trackWASMThreadPoolInit();
}

export function trackImageProcessing(
	backend: string,
	inputImage: { size: number; width: number; height: number; format: string },
	options?: Record<string, any>
) {
	return performanceIntegration.trackImageProcessing(backend, inputImage, options);
}

export function trackTask(taskId: string, taskName: string) {
	return performanceIntegration.trackUserTask(taskId, taskName);
}

export function trackFeature(featureName: string) {
	return performanceIntegration.trackFeature(featureName);
}

export function trackApplicationError(error: Error, context?: Record<string, any>): string {
	return performanceIntegration.trackError(error, context);
}

export function getPerformanceReport() {
	return performanceIntegration.getPerformanceReport();
}

export function exportPerformanceData() {
	return performanceIntegration.exportAllData();
}

export function checkSystemHealth() {
	return performanceIntegration.checkSystemHealth();
}
