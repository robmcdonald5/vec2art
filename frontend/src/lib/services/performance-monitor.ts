/**
 * Core Performance Monitoring Service
 * Comprehensive performance tracking and telemetry for vec2art application
 */

import { browser } from '$app/environment';
import type {
	WebVitalsMetrics,
	CustomMetrics,
	WASMPerformanceMetrics,
	ProcessingAnalytics,
	ErrorTracking,
	ResourceMonitoring,
	UXAnalytics,
	PerformanceSnapshot,
	PerformanceReport,
	PerformanceBudgets,
	SessionData,
	UserInteraction,
	PageView,
	Alert,
	Recommendation,
	TimeFrame,
	AnalyticsProvider,
	LiveMetrics,
	HealthStatus
} from '../types/performance.js';

/**
 * Core Performance Monitor Class
 * Handles all performance tracking, Web Vitals, and custom metrics
 */
export class PerformanceMonitor {
	private sessionId: string;
	private sessionStartTime: Date;
	private currentSession: SessionData;
	private performanceObserver?: PerformanceObserver;
	private budgets: PerformanceBudgets;
	private alerts: Alert[] = [];
	private recommendations: Recommendation[] = [];
	private analyticsProviders: AnalyticsProvider[] = [];
	private isTracking = false;

	constructor(budgets?: Partial<PerformanceBudgets>) {
		this.sessionId = this.generateSessionId();
		this.sessionStartTime = new Date();
		this.budgets = this.getDefaultBudgets(budgets);

		// Initialize session data (with safe defaults for SSR)
		this.currentSession = this.initializeSession();

		// Only initialize browser-specific features in the browser
		if (browser) {
			// Initialize performance tracking
			this.initializeWebVitalsTracking();
			this.initializeResourceMonitoring();
			this.setupErrorTracking();
		}
	}

	/**
	 * Start performance monitoring session
	 */
	startSession(): string {
		this.sessionId = this.generateSessionId();
		this.sessionStartTime = new Date();
		this.currentSession = this.initializeSession();
		this.isTracking = true;

		this.trackCustomMetric('session_started', 1, { sessionId: this.sessionId });
		return this.sessionId;
	}

	/**
	 * End performance monitoring session
	 */
	endSession(sessionId: string): void {
		if (sessionId === this.sessionId) {
			this.currentSession.endTime = new Date();
			this.currentSession.duration =
				this.currentSession.endTime.getTime() - this.sessionStartTime.getTime();
			this.isTracking = false;

			this.trackCustomMetric('session_ended', this.currentSession.duration, { sessionId });
			this.sendSessionData();
		}
	}

	/**
	 * Track Web Vitals metrics
	 */
	trackWebVitals(): void {
		if (!browser || !('PerformanceObserver' in window)) {
			if (browser) console.warn('PerformanceObserver not supported');
			return;
		}

		// Largest Contentful Paint (LCP)
		this.observePerformanceEntries('largest-contentful-paint', (entries) => {
			const lcpEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
			this.trackWebVitalMetric('LCP', lcpEntry.startTime);
		});

		// First Input Delay (FID)
		this.observePerformanceEntries('first-input', (entries) => {
			const fidEntry = entries[0] as PerformanceEntry & {
				processingStart: number;
				startTime: number;
			};
			const fid = fidEntry.processingStart - fidEntry.startTime;
			this.trackWebVitalMetric('FID', fid);
		});

		// Cumulative Layout Shift (CLS)
		this.observePerformanceEntries('layout-shift', (entries) => {
			let clsValue = 0;
			entries.forEach((entry: any) => {
				if (!entry.hadRecentInput) {
					clsValue += entry.value;
				}
			});
			this.trackWebVitalMetric('CLS', clsValue);
		});

		// First Contentful Paint (FCP)
		this.observePerformanceEntries('paint', (entries) => {
			const fcpEntry = entries.find(
				(entry: PerformanceEntry) => entry.name === 'first-contentful-paint'
			);
			if (fcpEntry) {
				this.trackWebVitalMetric('FCP', fcpEntry.startTime);
			}
		});

		// Navigation timing for TTFB and other metrics
		this.trackNavigationTiming();
	}

	/**
	 * Track custom application metrics
	 */
	trackCustomMetric(name: string, value: number, tags?: Record<string, string>): void {
		const metric = {
			name,
			value,
			timestamp: Date.now(),
			sessionId: this.sessionId,
			tags: tags || {}
		};

		// Check against performance budgets
		this.checkPerformanceBudget(name, value);

		// Store in current session
		this.currentSession.performanceMetrics.push({
			timestamp: Date.now(),
			webVitals: {} as WebVitalsMetrics,
			customMetrics: { [name]: value } as any,
			wasmMetrics: {} as WASMPerformanceMetrics,
			resourceUsage: {} as ResourceMonitoring,
			sessionId: this.sessionId
		});

		// Send to analytics providers
		this.sendMetricToProviders(metric);
	}

	/**
	 * Track WASM-specific performance metrics
	 */
	trackWASMMetrics(metrics: Partial<WASMPerformanceMetrics>): void {
		const wasmMetrics: WASMPerformanceMetrics = {
			moduleLoadTime: metrics.moduleLoadTime || 0,
			instantiationTime: metrics.instantiationTime || 0,
			threadPoolInitTime: metrics.threadPoolInitTime || 0,
			activeThreadCount: metrics.activeThreadCount || 0,
			threadUtilization: metrics.threadUtilization || 0,
			algorithmPerformance: metrics.algorithmPerformance || {
				edge: 0,
				centerline: 0,
				superpixel: 0,
				dots: 0
			},
			wasmMemoryUsage: metrics.wasmMemoryUsage || 0,
			heapUtilization: metrics.heapUtilization || 0
		};

		// Check budgets for WASM metrics
		if (wasmMetrics.moduleLoadTime > 0) {
			this.checkPerformanceBudget('wasmLoadTime', wasmMetrics.moduleLoadTime);
		}
		if (wasmMetrics.threadPoolInitTime > 0) {
			this.checkPerformanceBudget('threadInitTime', wasmMetrics.threadPoolInitTime);
		}

		// Store metrics
		this.currentSession.performanceMetrics.push({
			timestamp: Date.now(),
			webVitals: {} as WebVitalsMetrics,
			customMetrics: {} as CustomMetrics,
			wasmMetrics,
			resourceUsage: {} as ResourceMonitoring,
			sessionId: this.sessionId
		});
	}

	/**
	 * Track image processing analytics
	 */
	trackProcessingAnalytics(analytics: ProcessingAnalytics): void {
		// Check processing time against budget
		this.checkPerformanceBudget('imageProcessing', analytics.processingTime);

		// Track processing efficiency metrics
		this.trackCustomMetric('processing_time', analytics.processingTime, {
			backend: analytics.backend,
			format: analytics.inputFormat,
			threadCount: analytics.threadCount.toString()
		});

		this.trackCustomMetric('compression_ratio', analytics.compressionRatio, {
			backend: analytics.backend
		});

		this.trackCustomMetric('path_count', analytics.pathCount, {
			backend: analytics.backend
		});

		// Generate processing insights
		this.generateProcessingRecommendations(analytics);
	}

	/**
	 * Track errors with context
	 */
	trackError(error: Error, context?: Record<string, any>): void {
		const errorTracking: ErrorTracking = {
			errorType: this.classifyError(error, context),
			errorMessage: error.message,
			stackTrace: error.stack || '',
			userAgent: browser ? navigator.userAgent : 'server',
			url: browser ? window.location.href : 'server',
			timestamp: new Date(),
			sessionId: this.sessionId,
			performanceImpact: this.calculatePerformanceImpact(error),
			recoveryTime: 0,
			userImpact: this.assessUserImpact(error)
		};

		this.currentSession.errors.push(errorTracking);

		// Generate alert if error rate is high
		this.checkErrorRate();

		// Send to analytics
		this.sendErrorToProviders(errorTracking);
	}

	/**
	 * Track user interactions
	 */
	trackUserInteraction(interaction: Omit<UserInteraction, 'timestamp'>): void {
		const fullInteraction: UserInteraction = {
			...interaction,
			timestamp: new Date()
		};

		this.currentSession.interactions.push(fullInteraction);

		// Track interaction response time
		if (interaction.duration) {
			this.checkPerformanceBudget('uiResponseTime', interaction.duration);
		}
	}

	/**
	 * Check performance budget compliance
	 */
	checkPerformanceBudget(metric: string, value: number): boolean {
		const budget = this.budgets[metric as keyof PerformanceBudgets];
		if (budget && value > budget) {
			this.generateBudgetAlert(metric, value, budget);
			return false;
		}
		return true;
	}

	/**
	 * Get real-time performance metrics
	 */
	getRealtimeMetrics(): LiveMetrics {
		const currentSnapshot = this.getCurrentSnapshot();

		return {
			currentPerformance: currentSnapshot,
			realtimeUsers: 1, // Single user application
			activeProcessing: this.getActiveProcessingCount(),
			errorRate: this.calculateErrorRate(),
			systemHealth: this.assessSystemHealth()
		};
	}

	/**
	 * Generate performance report
	 */
	generateReport(timeframe: TimeFrame): PerformanceReport {
		// This would typically aggregate data from storage
		// For now, return current session data
		return {
			timeframe,
			aggregatedMetrics: this.aggregateMetrics(),
			trends: this.calculateTrends(),
			recommendations: this.recommendations,
			alerts: this.alerts,
			summary: this.generateReportSummary()
		};
	}

	/**
	 * Add analytics provider
	 */
	addAnalyticsProvider(provider: AnalyticsProvider): void {
		this.analyticsProviders.push(provider);
	}

	/**
	 * Get current session data
	 */
	getCurrentSession(): SessionData {
		return { ...this.currentSession };
	}

	// Private methods

	private generateSessionId(): string {
		return `vec2art_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private getDefaultBudgets(customBudgets?: Partial<PerformanceBudgets>): PerformanceBudgets {
		const defaults: PerformanceBudgets = {
			LCP: 2500,
			FID: 100,
			CLS: 0.1,
			FCP: 1800,
			TTI: 3800,
			TTFB: 800,
			wasmLoadTime: 1000,
			threadInitTime: 200,
			imageProcessing: 1500,
			uiResponseTime: 16,
			bundleSize: 1024 * 1024,
			imageUploadSize: 10 * 1024 * 1024,
			memoryUsage: 512 * 1024 * 1024
		};

		return { ...defaults, ...customBudgets };
	}

	private initializeSession(): SessionData {
		return {
			sessionId: this.sessionId,
			startTime: this.sessionStartTime,
			userAgent: browser ? navigator.userAgent : 'server',
			viewport: {
				width: browser ? window.innerWidth : 0,
				height: browser ? window.innerHeight : 0
			},
			pageViews: [],
			interactions: [],
			errors: [],
			performanceMetrics: []
		};
	}

	private initializeWebVitalsTracking(): void {
		if (!browser) return;

		// Track page view
		this.trackPageView();

		// Start Web Vitals tracking
		this.trackWebVitals();
	}

	private initializeResourceMonitoring(): void {
		if (!browser) return;

		if ('memory' in performance && !import.meta.env.DEV) {
			// Monitor memory usage periodically (disabled in development to prevent high CPU usage)
			setInterval(() => {
				this.trackResourceUsage();
			}, 5000);
		}
	}

	private setupErrorTracking(): void {
		if (!browser) return;

		// Global error handler
		window.addEventListener('error', (event) => {
			this.trackError(event.error, { type: 'javascript' });
		});

		// Promise rejection handler
		window.addEventListener('unhandledrejection', (event) => {
			this.trackError(new Error(event.reason), { type: 'promise' });
		});
	}

	private observePerformanceEntries(
		type: string,
		callback: (entries: PerformanceEntry[]) => void
	): void {
		if (!browser || !('PerformanceObserver' in window)) return;

		try {
			const observer = new PerformanceObserver((list) => {
				callback(list.getEntries());
			});
			observer.observe({ entryTypes: [type] });
		} catch (e) {
			console.warn(`Failed to observe ${type} entries:`, e);
		}
	}

	private trackWebVitalMetric(metric: keyof WebVitalsMetrics, value: number): void {
		this.trackCustomMetric(`webvital_${metric.toLowerCase()}`, value);
		this.checkPerformanceBudget(metric, value);
	}

	private trackNavigationTiming(): void {
		if (!browser) return;

		window.addEventListener('load', () => {
			const navigation = performance.getEntriesByType(
				'navigation'
			)[0] as PerformanceNavigationTiming;

			if (navigation) {
				// Time to First Byte
				const ttfb = navigation.responseStart - navigation.requestStart;
				this.trackWebVitalMetric('TTFB', ttfb);

				// Calculate TTI (approximation)
				const tti = navigation.loadEventEnd - navigation.fetchStart;
				this.trackWebVitalMetric('TTI', tti);
			}
		});
	}

	private trackPageView(): void {
		const pageView: PageView = {
			url: browser ? window.location.href : 'server',
			timestamp: new Date()
		};

		this.currentSession.pageViews.push(pageView);
	}

	private trackResourceUsage(): void {
		if ('memory' in performance) {
			const memory = (performance as any).memory;
			const resourceUsage: ResourceMonitoring = {
				heapUsage: memory.usedJSHeapSize,
				wasmMemoryUsage: 0, // Will be updated by WASM module
				cpuUsage: 0, // Not directly available in browser
				threadUtilization: {},
				networkLatency: 0,
				bandwidthUtilization: 0,
				localStorageUsage: this.calculateStorageUsage(),
				cacheUtilization: 0
			};

			this.currentSession.performanceMetrics.push({
				timestamp: Date.now(),
				webVitals: {} as WebVitalsMetrics,
				customMetrics: {} as CustomMetrics,
				wasmMetrics: {} as WASMPerformanceMetrics,
				resourceUsage,
				sessionId: this.sessionId
			});
		}
	}

	private calculateStorageUsage(): number {
		try {
			let total = 0;
			for (const key in localStorage) {
				if (localStorage.hasOwnProperty(key)) {
					total += localStorage[key].length;
				}
			}
			return total;
		} catch {
			return 0;
		}
	}

	private classifyError(error: Error, context?: Record<string, any>): ErrorTracking['errorType'] {
		if (context?.type === 'wasm' || error.message.includes('wasm')) return 'wasm';
		if (error.message.includes('network') || error.message.includes('fetch')) return 'network';
		if (context?.type === 'processing') return 'processing';
		if (error.message.includes('UI') || error.message.includes('component')) return 'ui';
		return 'unknown';
	}

	private calculatePerformanceImpact(error: Error): number {
		// Simple heuristic for performance impact
		if (error.message.includes('wasm') || error.message.includes('thread')) return 100;
		if (error.message.includes('processing')) return 75;
		if (error.message.includes('network')) return 50;
		return 25;
	}

	private assessUserImpact(error: Error): ErrorTracking['userImpact'] {
		if (error.message.includes('wasm') || error.message.includes('processing')) return 'critical';
		if (error.message.includes('network') || error.message.includes('upload')) return 'major';
		if (error.message.includes('ui')) return 'minor';
		return 'none';
	}

	private checkErrorRate(): void {
		const recentErrors = this.currentSession.errors.filter(
			(error) => Date.now() - error.timestamp.getTime() < 60000 // Last minute
		);

		if (recentErrors.length > 5) {
			this.generateErrorAlert(recentErrors.length);
		}
	}

	private generateBudgetAlert(metric: string, value: number, budget: number): void {
		const alert: Alert = {
			id: `budget_${metric}_${Date.now()}`,
			type: 'budget-exceeded',
			severity: this.calculateAlertSeverity(value, budget),
			title: `Performance Budget Exceeded: ${metric}`,
			description: `${metric} (${value.toFixed(2)}) exceeded budget of ${budget}`,
			threshold: budget,
			currentValue: value,
			timestamp: new Date(),
			resolved: false
		};

		this.alerts.push(alert);
	}

	private generateErrorAlert(errorCount: number): void {
		const alert: Alert = {
			id: `errors_${Date.now()}`,
			type: 'error-spike',
			severity: 'warning',
			title: 'High Error Rate Detected',
			description: `${errorCount} errors in the last minute`,
			threshold: 5,
			currentValue: errorCount,
			timestamp: new Date(),
			resolved: false
		};

		this.alerts.push(alert);
	}

	private calculateAlertSeverity(value: number, threshold: number): Alert['severity'] {
		const ratio = value / threshold;
		if (ratio > 2) return 'critical';
		if (ratio > 1.5) return 'warning';
		return 'info';
	}

	private generateProcessingRecommendations(analytics: ProcessingAnalytics): void {
		const recommendations: Recommendation[] = [];

		// Processing time recommendation
		if (analytics.processingTime > this.budgets.imageProcessing) {
			recommendations.push({
				id: `processing_time_${Date.now()}`,
				type: 'performance',
				priority: 'high',
				title: 'Optimize Processing Time',
				description: `Processing time (${analytics.processingTime}ms) exceeds target of ${this.budgets.imageProcessing}ms`,
				impact: 'Faster processing improves user experience',
				effort: 'medium'
			});
		}

		// Thread utilization recommendation
		if (analytics.threadCount < 8) {
			recommendations.push({
				id: `thread_utilization_${Date.now()}`,
				type: 'optimization',
				priority: 'medium',
				title: 'Increase Thread Utilization',
				description: `Currently using ${analytics.threadCount} threads, consider increasing to 8-12 for better performance`,
				impact: 'Significant processing speed improvement',
				effort: 'low'
			});
		}

		this.recommendations.push(...recommendations);
	}

	private getCurrentSnapshot(): PerformanceSnapshot {
		return {
			timestamp: Date.now(),
			webVitals: this.getLatestWebVitals(),
			customMetrics: this.getLatestCustomMetrics(),
			wasmMetrics: this.getLatestWASMMetrics(),
			resourceUsage: this.getLatestResourceUsage(),
			sessionId: this.sessionId
		};
	}

	private getLatestWebVitals(): WebVitalsMetrics {
		// Return latest or default values
		return {
			LCP: 0,
			FID: 0,
			CLS: 0,
			FCP: 0,
			TTI: 0,
			TTFB: 0
		};
	}

	private getLatestCustomMetrics(): CustomMetrics {
		return {
			wasmLoadTime: 0,
			threadInitTime: 0,
			imageProcessingTime: 0,
			fileUploadSpeed: 0,
			svgGenerationTime: 0
		};
	}

	private getLatestWASMMetrics(): WASMPerformanceMetrics {
		return {
			moduleLoadTime: 0,
			instantiationTime: 0,
			threadPoolInitTime: 0,
			activeThreadCount: 0,
			threadUtilization: 0,
			algorithmPerformance: {
				edge: 0,
				centerline: 0,
				superpixel: 0,
				dots: 0
			},
			wasmMemoryUsage: 0,
			heapUtilization: 0
		};
	}

	private getLatestResourceUsage(): ResourceMonitoring {
		return {
			heapUsage: 0,
			wasmMemoryUsage: 0,
			cpuUsage: 0,
			threadUtilization: {},
			networkLatency: 0,
			bandwidthUtilization: 0,
			localStorageUsage: 0,
			cacheUtilization: 0
		};
	}

	private getActiveProcessingCount(): number {
		// Would track active processing operations
		return 0;
	}

	private calculateErrorRate(): number {
		const totalInteractions = this.currentSession.interactions.length;
		const totalErrors = this.currentSession.errors.length;
		return totalInteractions > 0 ? (totalErrors / totalInteractions) * 100 : 0;
	}

	private assessSystemHealth(): HealthStatus['overall'] {
		const errorRate = this.calculateErrorRate();

		if (errorRate > 10) return 'critical';
		if (errorRate > 5) return 'warning';
		return 'healthy';
	}

	private aggregateMetrics(): any {
		// Implementation would aggregate metrics from stored data
		return {};
	}

	private calculateTrends(): any[] {
		// Implementation would calculate trends from historical data
		return [];
	}

	private generateReportSummary(): any {
		return {
			totalSessions: 1,
			averageSessionDuration: this.currentSession.duration || 0,
			errorRate: this.calculateErrorRate(),
			performanceScore: this.calculatePerformanceScore(),
			budgetViolations: this.alerts.filter((a) => a.type === 'budget-exceeded').length,
			improvementSuggestions: this.recommendations.length
		};
	}

	private calculatePerformanceScore(): number {
		// Simple performance score calculation
		const budgetViolations = this.alerts.filter((a) => a.type === 'budget-exceeded').length;
		const errorRate = this.calculateErrorRate();

		let score = 100;
		score -= budgetViolations * 10;
		score -= errorRate * 2;

		return Math.max(0, Math.min(100, score));
	}

	private sendMetricToProviders(metric: any): void {
		this.analyticsProviders.forEach((provider) => {
			if (provider.ga4Integration?.enabled) {
				this.sendToGA4(metric, provider.ga4Integration);
			}
			if (provider.customEndpoint) {
				this.sendToCustomEndpoint(metric, provider.customEndpoint);
			}
		});
	}

	private sendErrorToProviders(error: ErrorTracking): void {
		this.analyticsProviders.forEach((provider) => {
			if (provider.ga4Integration?.enabled) {
				this.sendErrorToGA4(error, provider.ga4Integration);
			}
			if (provider.customEndpoint) {
				this.sendErrorToCustomEndpoint(error, provider.customEndpoint);
			}
		});
	}

	private sendSessionData(): void {
		this.analyticsProviders.forEach((provider) => {
			if (provider.customEndpoint) {
				this.sendSessionToCustomEndpoint(this.currentSession, provider.customEndpoint);
			}
		});
	}

	private sendToGA4(metric: any, config: any): void {
		// GA4 implementation would go here
		console.log('Sending metric to GA4:', metric);
	}

	private sendToCustomEndpoint(metric: any, endpoint: string): void {
		fetch(endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(metric)
		}).catch(console.error);
	}

	private sendErrorToGA4(error: ErrorTracking, config: any): void {
		// GA4 error tracking implementation
		console.log('Sending error to GA4:', error);
	}

	private sendErrorToCustomEndpoint(error: ErrorTracking, endpoint: string): void {
		fetch(`${endpoint}/errors`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(error)
		}).catch(console.error);
	}

	private sendSessionToCustomEndpoint(session: SessionData, endpoint: string): void {
		fetch(`${endpoint}/sessions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(session)
		}).catch(console.error);
	}
}

// Create a singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export helper functions
export function trackWebVitals(): void {
	performanceMonitor.trackWebVitals();
}

export function trackCustomMetric(
	name: string,
	value: number,
	tags?: Record<string, string>
): void {
	performanceMonitor.trackCustomMetric(name, value, tags);
}

export function trackWASMMetrics(metrics: Partial<WASMPerformanceMetrics>): void {
	performanceMonitor.trackWASMMetrics(metrics);
}

export function trackProcessingAnalytics(analytics: ProcessingAnalytics): void {
	performanceMonitor.trackProcessingAnalytics(analytics);
}

export function trackError(error: Error, context?: Record<string, any>): void {
	performanceMonitor.trackError(error, context);
}

export function trackUserInteraction(interaction: Omit<UserInteraction, 'timestamp'>): void {
	performanceMonitor.trackUserInteraction(interaction);
}

export function getRealtimeMetrics(): LiveMetrics {
	return performanceMonitor.getRealtimeMetrics();
}
