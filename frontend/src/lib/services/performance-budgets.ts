/**
 * Performance Budgets and Alerts System
 * Comprehensive budget enforcement and alerting for performance metrics
 */

import type {
	PerformanceBudgets,
	Alert,
	Recommendation,
	WebVitalsMetrics,
	CustomMetrics,
	WASMPerformanceMetrics,
	ResourceMonitoring
} from '../types/performance.js';
import { trackCustomMetric } from './performance-monitor.js';
import { addErrorBreadcrumb } from './error-tracker.js';

/**
 * Budget violation details
 */
export interface BudgetViolation {
	metric: string;
	category: 'web-vitals' | 'wasm' | 'resource' | 'custom';
	currentValue: number;
	budgetValue: number;
	violationPercent: number;
	severity: 'warning' | 'critical';
	timestamp: Date;
	trend: 'improving' | 'stable' | 'degrading';
}

/**
 * Budget rule configuration
 */
export interface BudgetRule {
	metric: string;
	category: 'web-vitals' | 'wasm' | 'resource' | 'custom';
	budget: number;
	warningThreshold: number; // Percentage of budget (e.g., 80 for 80%)
	criticalThreshold: number; // Percentage of budget (e.g., 100 for 100%)
	enabled: boolean;
	description: string;
	recommendations: string[];
}

/**
 * Alert subscription
 */
export interface AlertSubscription {
	id: string;
	name: string;
	metrics: string[];
	severities: Array<'warning' | 'critical'>;
	callback: (alert: Alert) => void;
	enabled: boolean;
}

/**
 * Budget monitoring configuration
 */
export interface BudgetMonitoringConfig {
	enableContinuousMonitoring: boolean;
	monitoringInterval: number;
	alertThrottleInterval: number;
	maxAlertsPerHour: number;
	enableTrendAnalysis: boolean;
	trendAnalysisWindow: number;
}

/**
 * Performance Budgets Manager Class
 */
export class PerformanceBudgetsManager {
	private budgetRules = new Map<string, BudgetRule>();
	private violations = new Map<string, BudgetViolation>();
	private alerts: Alert[] = [];
	private subscriptions = new Map<string, AlertSubscription>();
	private config: BudgetMonitoringConfig;
	private monitoringInterval?: number;
	private alertHistory = new Map<string, Date[]>();
	private metricHistory = new Map<string, Array<{ value: number; timestamp: number }>>();
	private isMonitoring = false;

	constructor(budgets?: Partial<PerformanceBudgets>, config?: Partial<BudgetMonitoringConfig>) {
		this.config = {
			enableContinuousMonitoring: true,
			monitoringInterval: 10000, // 10 seconds
			alertThrottleInterval: 60000, // 1 minute
			maxAlertsPerHour: 10,
			enableTrendAnalysis: true,
			trendAnalysisWindow: 300000, // 5 minutes
			...config
		};

		this.initializeDefaultBudgets(budgets);
	}

	/**
	 * Start budget monitoring
	 */
	startMonitoring(): void {
		if (this.isMonitoring) return;

		this.isMonitoring = true;

		if (this.config.enableContinuousMonitoring) {
			this.monitoringInterval = window.setInterval(() => {
				this.checkAllBudgets();
			}, this.config.monitoringInterval);
		}

		addErrorBreadcrumb('Performance budget monitoring started');
	}

	/**
	 * Stop budget monitoring
	 */
	stopMonitoring(): void {
		if (!this.isMonitoring) return;

		this.isMonitoring = false;

		if (this.monitoringInterval) {
			clearInterval(this.monitoringInterval);
			this.monitoringInterval = undefined;
		}

		addErrorBreadcrumb('Performance budget monitoring stopped');
	}

	/**
	 * Set budget for a metric
	 */
	setBudget(
		metric: string,
		category: BudgetRule['category'],
		budget: number,
		options?: {
			warningThreshold?: number;
			criticalThreshold?: number;
			description?: string;
			recommendations?: string[];
		}
	): void {
		const rule: BudgetRule = {
			metric,
			category,
			budget,
			warningThreshold: options?.warningThreshold || 80,
			criticalThreshold: options?.criticalThreshold || 100,
			enabled: true,
			description: options?.description || `Budget for ${metric}`,
			recommendations: options?.recommendations || []
		};

		this.budgetRules.set(metric, rule);

		trackCustomMetric('budget_set', 1, {
			metric,
			category,
			budget: budget.toString()
		});
	}

	/**
	 * Check budget for a specific metric
	 */
	checkBudget(metric: string, currentValue: number): BudgetViolation | null {
		const rule = this.budgetRules.get(metric);
		if (!rule || !rule.enabled) return null;

		// Store metric value for trend analysis
		this.storeMetricValue(metric, currentValue);

		const violationPercent = (currentValue / rule.budget) * 100;

		// Check if budget is violated
		if (violationPercent < rule.warningThreshold) {
			// No violation, remove any existing violation
			this.violations.delete(metric);
			return null;
		}

		const severity: 'warning' | 'critical' =
			violationPercent >= rule.criticalThreshold ? 'critical' : 'warning';

		const violation: BudgetViolation = {
			metric,
			category: rule.category,
			currentValue,
			budgetValue: rule.budget,
			violationPercent,
			severity,
			timestamp: new Date(),
			trend: this.calculateTrend(metric)
		};

		// Store violation
		this.violations.set(metric, violation);

		// Generate alert
		this.generateBudgetAlert(violation, rule);

		// Track violation metrics
		trackCustomMetric('budget_violation', 1, {
			metric,
			category: rule.category,
			severity,
			violationPercent: violationPercent.toString()
		});

		return violation;
	}

	/**
	 * Check Web Vitals budgets
	 */
	checkWebVitalsBudgets(metrics: Partial<WebVitalsMetrics>): BudgetViolation[] {
		const violations: BudgetViolation[] = [];

		Object.entries(metrics).forEach(([metric, value]) => {
			if (value !== undefined) {
				const violation = this.checkBudget(`webvitals_${metric.toLowerCase()}`, value);
				if (violation) violations.push(violation);
			}
		});

		return violations;
	}

	/**
	 * Check WASM performance budgets
	 */
	checkWASMBudgets(metrics: Partial<WASMPerformanceMetrics>): BudgetViolation[] {
		const violations: BudgetViolation[] = [];

		// Check individual WASM metrics
		if (metrics.moduleLoadTime) {
			const violation = this.checkBudget('wasm_module_load_time', metrics.moduleLoadTime);
			if (violation) violations.push(violation);
		}

		if (metrics.threadPoolInitTime) {
			const violation = this.checkBudget('wasm_thread_init_time', metrics.threadPoolInitTime);
			if (violation) violations.push(violation);
		}

		if (metrics.wasmMemoryUsage) {
			const violation = this.checkBudget('wasm_memory_usage', metrics.wasmMemoryUsage);
			if (violation) violations.push(violation);
		}

		if (metrics.threadUtilization !== undefined) {
			const violation = this.checkBudget(
				'wasm_thread_utilization',
				metrics.threadUtilization * 100
			);
			if (violation) violations.push(violation);
		}

		return violations;
	}

	/**
	 * Check SVG performance budgets
	 */
	checkSVGBudgets(elementCount: number, fileSizeBytes: number): BudgetViolation[] {
		const violations: BudgetViolation[] = [];

		// Check element count budget
		const elementViolation = this.checkBudget('svg_element_count', elementCount);
		if (elementViolation) violations.push(elementViolation);

		// Check file size budget
		const sizeViolation = this.checkBudget('svg_file_size', fileSizeBytes);
		if (sizeViolation) violations.push(sizeViolation);

		return violations;
	}

	/**
	 * Check resource budgets
	 */
	checkResourceBudgets(metrics: Partial<ResourceMonitoring>): BudgetViolation[] {
		const violations: BudgetViolation[] = [];

		if (metrics.heapUsage) {
			const violation = this.checkBudget('resource_heap_usage', metrics.heapUsage);
			if (violation) violations.push(violation);
		}

		if (metrics.cpuUsage) {
			const violation = this.checkBudget('resource_cpu_usage', metrics.cpuUsage);
			if (violation) violations.push(violation);
		}

		if (metrics.networkLatency) {
			const violation = this.checkBudget('resource_network_latency', metrics.networkLatency);
			if (violation) violations.push(violation);
		}

		if (metrics.localStorageUsage) {
			const violation = this.checkBudget('resource_storage_usage', metrics.localStorageUsage);
			if (violation) violations.push(violation);
		}

		return violations;
	}

	/**
	 * Subscribe to alerts
	 */
	subscribeToAlerts(subscription: Omit<AlertSubscription, 'id'>): string {
		const id = `alert_sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		this.subscriptions.set(id, {
			id,
			...subscription
		});

		return id;
	}

	/**
	 * Unsubscribe from alerts
	 */
	unsubscribeFromAlerts(subscriptionId: string): boolean {
		return this.subscriptions.delete(subscriptionId);
	}

	/**
	 * Get current violations
	 */
	getCurrentViolations(): BudgetViolation[] {
		return Array.from(this.violations.values());
	}

	/**
	 * Get active alerts
	 */
	getActiveAlerts(): Alert[] {
		return this.alerts.filter((alert) => !alert.resolved);
	}

	/**
	 * Get budget status summary
	 */
	getBudgetStatus(): {
		totalBudgets: number;
		activeBudgets: number;
		violations: number;
		criticalViolations: number;
		warningViolations: number;
		overallHealth: 'healthy' | 'warning' | 'critical';
	} {
		const totalBudgets = this.budgetRules.size;
		const activeBudgets = Array.from(this.budgetRules.values()).filter(
			(rule) => rule.enabled
		).length;
		const violations = this.violations.size;
		const criticalViolations = Array.from(this.violations.values()).filter(
			(v) => v.severity === 'critical'
		).length;
		const warningViolations = violations - criticalViolations;

		let overallHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
		if (criticalViolations > 0) {
			overallHealth = 'critical';
		} else if (warningViolations > 0) {
			overallHealth = 'warning';
		}

		return {
			totalBudgets,
			activeBudgets,
			violations,
			criticalViolations,
			warningViolations,
			overallHealth
		};
	}

	/**
	 * Get performance recommendations based on violations
	 */
	getPerformanceRecommendations(): Recommendation[] {
		const recommendations: Recommendation[] = [];
		const violations = this.getCurrentViolations();

		violations.forEach((violation) => {
			const rule = this.budgetRules.get(violation.metric);
			if (!rule) return;

			rule.recommendations.forEach((rec, index) => {
				recommendations.push({
					id: `budget_rec_${violation.metric}_${index}`,
					type: 'performance',
					priority: violation.severity === 'critical' ? 'high' : 'medium',
					title: `Optimize ${violation.metric}`,
					description: rec,
					impact: `Reduce ${violation.metric} by ${(violation.violationPercent - 100).toFixed(1)}%`,
					effort: violation.violationPercent > 150 ? 'high' : 'medium'
				});
			});

			// Add generic recommendations
			if (rule.recommendations.length === 0) {
				recommendations.push({
					id: `budget_rec_generic_${violation.metric}`,
					type: 'performance',
					priority: violation.severity === 'critical' ? 'high' : 'medium',
					title: `${violation.metric} exceeds budget`,
					description: `Current value (${violation.currentValue}) exceeds budget (${violation.budgetValue})`,
					impact: `Performance improvement needed`,
					effort: 'medium'
				});
			}
		});

		return recommendations;
	}

	/**
	 * Export budget configuration and status
	 */
	exportBudgetData(): {
		rules: BudgetRule[];
		violations: BudgetViolation[];
		alerts: Alert[];
		status: ReturnType<typeof this.getBudgetStatus>;
		recommendations: Recommendation[];
	} {
		return {
			rules: Array.from(this.budgetRules.values()),
			violations: Array.from(this.violations.values()),
			alerts: this.alerts,
			status: this.getBudgetStatus(),
			recommendations: this.getPerformanceRecommendations()
		};
	}

	/**
	 * Reset all violations and alerts
	 */
	reset(): void {
		this.violations.clear();
		this.alerts = [];
		this.alertHistory.clear();
		this.metricHistory.clear();

		addErrorBreadcrumb('Performance budgets reset');
	}

	// Private methods

	private initializeDefaultBudgets(customBudgets?: Partial<PerformanceBudgets>): void {
		const defaultBudgets: PerformanceBudgets = {
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

		const finalBudgets = { ...defaultBudgets, ...customBudgets };

		// Web Vitals budgets
		this.setBudget('webvitals_lcp', 'web-vitals', finalBudgets.LCP, {
			description: 'Largest Contentful Paint - Loading performance',
			recommendations: [
				'Optimize critical resource loading',
				'Reduce server response times',
				'Eliminate render-blocking resources'
			]
		});

		this.setBudget('webvitals_fid', 'web-vitals', finalBudgets.FID, {
			description: 'First Input Delay - Interactivity',
			recommendations: [
				'Minimize main thread work',
				'Reduce JavaScript execution time',
				'Optimize third-party code'
			]
		});

		this.setBudget('webvitals_cls', 'web-vitals', finalBudgets.CLS, {
			description: 'Cumulative Layout Shift - Visual stability',
			recommendations: [
				'Include size attributes on images and videos',
				'Reserve space for ads and embeds',
				'Avoid inserting content above existing content'
			]
		});

		this.setBudget('webvitals_fcp', 'web-vitals', finalBudgets.FCP, {
			description: 'First Contentful Paint - Time to first content',
			recommendations: [
				'Eliminate render-blocking resources',
				'Minify CSS and JavaScript',
				'Optimize fonts'
			]
		});

		this.setBudget('webvitals_tti', 'web-vitals', finalBudgets.TTI, {
			description: 'Time to Interactive - Full interactivity',
			recommendations: [
				'Minimize main thread work',
				'Reduce impact of third-party code',
				'Minimize critical request depth'
			]
		});

		this.setBudget('webvitals_ttfb', 'web-vitals', finalBudgets.TTFB, {
			description: 'Time to First Byte - Server response time',
			recommendations: ['Optimize server processing', 'Use CDN', 'Enable compression']
		});

		// WASM budgets
		this.setBudget('wasm_module_load_time', 'wasm', finalBudgets.wasmLoadTime, {
			description: 'WASM module loading time',
			recommendations: [
				'Enable WASM caching',
				'Optimize WASM bundle size',
				'Use streaming compilation'
			]
		});

		this.setBudget('wasm_thread_init_time', 'wasm', finalBudgets.threadInitTime, {
			description: 'WASM thread pool initialization time',
			recommendations: [
				'Pre-initialize thread pool',
				'Optimize SharedArrayBuffer usage',
				'Check browser thread support'
			]
		});

		this.setBudget('wasm_memory_usage', 'wasm', 64 * 1024 * 1024, {
			// 64MB
			description: 'WASM memory usage',
			recommendations: [
				'Optimize WASM memory allocation',
				'Implement memory pooling',
				'Free unused memory promptly'
			]
		});

		this.setBudget('wasm_thread_utilization', 'wasm', 90, {
			// 90%
			description: 'WASM thread utilization percentage',
			recommendations: [
				'Balance workload across threads',
				'Optimize algorithm parallelization',
				'Reduce thread synchronization overhead'
			]
		});

		// Resource budgets
		this.setBudget('resource_heap_usage', 'resource', finalBudgets.memoryUsage, {
			description: 'JavaScript heap memory usage',
			recommendations: [
				'Implement memory management',
				'Clear unused references',
				'Optimize data structures'
			]
		});

		this.setBudget('resource_cpu_usage', 'resource', 80, {
			// 80%
			description: 'Estimated CPU usage percentage',
			recommendations: [
				'Optimize intensive computations',
				'Use Web Workers for heavy tasks',
				'Implement request batching'
			]
		});

		this.setBudget('resource_network_latency', 'resource', 1000, {
			description: 'Network latency in milliseconds',
			recommendations: [
				'Use CDN for static assets',
				'Optimize API response times',
				'Implement request caching'
			]
		});

		this.setBudget('resource_storage_usage', 'resource', 50 * 1024 * 1024, {
			// 50MB
			description: 'Local storage usage',
			recommendations: [
				'Clean up old data regularly',
				'Implement storage quotas',
				'Use compression for stored data'
			]
		});

		// Custom application budgets
		this.setBudget('image_processing_time', 'custom', finalBudgets.imageProcessing, {
			description: 'Image processing time',
			recommendations: [
				'Increase thread count',
				'Optimize image size before processing',
				'Use more efficient algorithms'
			]
		});

		this.setBudget('ui_response_time', 'custom', finalBudgets.uiResponseTime, {
			description: 'UI response time for 60fps',
			recommendations: [
				'Minimize DOM operations',
				'Use virtual scrolling for long lists',
				'Debounce expensive operations'
			]
		});

		// SVG complexity budgets
		this.setBudget('svg_element_count', 'custom', 2500, {
			description: 'SVG DOM element count for smooth preview',
			warningThreshold: 60, // 1500 elements (60% of 2500)
			criticalThreshold: 100, // 2500+ elements
			recommendations: [
				'Reduce detail level or quality settings',
				'Use symbol reuse for repeated elements',
				'Consider alternative rendering backends',
				'Enable SVG optimization and minification'
			]
		});

		this.setBudget('svg_file_size', 'custom', 1024 * 1024, {
			description: 'SVG file size for efficient transfer and parsing',
			warningThreshold: 50, // 512KB
			criticalThreshold: 100, // 1MB+
			recommendations: [
				'Enable SVG minification and compression',
				'Remove unnecessary metadata and attributes',
				'Use symbol reuse for repeated patterns',
				'Consider raster fallbacks for complex areas'
			]
		});
	}

	private checkAllBudgets(): void {
		// This would be called by the performance integration service
		// with current metrics from all monitoring services
	}

	private storeMetricValue(metric: string, value: number): void {
		if (!this.metricHistory.has(metric)) {
			this.metricHistory.set(metric, []);
		}

		const history = this.metricHistory.get(metric)!;
		const timestamp = Date.now();

		history.push({ value, timestamp });

		// Keep only values within the trend analysis window
		const cutoff = timestamp - this.config.trendAnalysisWindow;
		const filtered = history.filter((entry) => entry.timestamp > cutoff);
		this.metricHistory.set(metric, filtered);
	}

	private calculateTrend(metric: string): 'improving' | 'stable' | 'degrading' {
		if (!this.config.enableTrendAnalysis) return 'stable';

		const history = this.metricHistory.get(metric);
		if (!history || history.length < 3) return 'stable';

		const recent = history.slice(-3);
		const older = history.slice(-6, -3);

		if (older.length === 0) return 'stable';

		const recentAvg = recent.reduce((sum, entry) => sum + entry.value, 0) / recent.length;
		const olderAvg = older.reduce((sum, entry) => sum + entry.value, 0) / older.length;

		const change = ((recentAvg - olderAvg) / olderAvg) * 100;

		if (Math.abs(change) < 5) return 'stable';

		// For most metrics, lower is better (improving)
		// Exception: thread utilization where higher might be better
		const isUtilizationMetric = metric.includes('utilization');

		if (isUtilizationMetric) {
			return change > 0 ? 'improving' : 'degrading';
		} else {
			return change > 0 ? 'degrading' : 'improving';
		}
	}

	private generateBudgetAlert(violation: BudgetViolation, rule: BudgetRule): void {
		// Check if we should throttle this alert
		if (this.shouldThrottleAlert(violation.metric, violation.severity)) {
			return;
		}

		const alert: Alert = {
			id: `budget_alert_${violation.metric}_${Date.now()}`,
			type: 'budget-exceeded',
			severity: violation.severity === 'critical' ? 'critical' : 'warning',
			title: `Performance Budget Exceeded: ${violation.metric}`,
			description: `${rule.description} (${violation.currentValue}) exceeded budget of ${violation.budgetValue} by ${(violation.violationPercent - 100).toFixed(1)}%`,
			threshold: rule.budget,
			currentValue: violation.currentValue,
			timestamp: new Date(),
			resolved: false
		};

		this.alerts.push(alert);

		// Notify subscribers
		this.notifySubscribers(alert);

		// Track alert history for throttling
		this.trackAlertHistory(violation.metric);
	}

	private shouldThrottleAlert(metric: string, severity: 'warning' | 'critical'): boolean {
		const now = Date.now();
		const history = this.alertHistory.get(metric) || [];

		// Remove old alerts outside throttle window
		const recentAlerts = history.filter(
			(timestamp) => now - timestamp.getTime() < this.config.alertThrottleInterval
		);

		// Check if we've exceeded max alerts per hour
		const hourAgo = now - 3600000; // 1 hour
		const recentAlertsCount = recentAlerts.filter(
			(timestamp) => timestamp.getTime() > hourAgo
		).length;

		if (recentAlertsCount >= this.config.maxAlertsPerHour) {
			return true; // Throttle
		}

		// Don't throttle critical alerts as aggressively
		if (severity === 'critical') {
			return (
				recentAlerts.length > 0 &&
				now - recentAlerts[recentAlerts.length - 1].getTime() <
					this.config.alertThrottleInterval / 2
			);
		}

		// Throttle warning alerts if there was one recently
		return recentAlerts.length > 0;
	}

	private trackAlertHistory(metric: string): void {
		if (!this.alertHistory.has(metric)) {
			this.alertHistory.set(metric, []);
		}

		const history = this.alertHistory.get(metric)!;
		history.push(new Date());

		// Keep only recent history
		const cutoff = Date.now() - 3600000; // 1 hour
		const filtered = history.filter((timestamp) => timestamp.getTime() > cutoff);
		this.alertHistory.set(metric, filtered);
	}

	private notifySubscribers(alert: Alert): void {
		this.subscriptions.forEach((subscription) => {
			if (!subscription.enabled) return;

			// Check if subscriber is interested in this metric
			const isRelevant =
				subscription.metrics.length === 0 ||
				subscription.metrics.some((metric) => alert.title.includes(metric));

			// Check if subscriber is interested in this severity
			const severityMatch = subscription.severities.includes(alert.severity as any);

			if (isRelevant && severityMatch) {
				try {
					subscription.callback(alert);
				} catch (error) {
					console.error(`Error notifying alert subscriber ${subscription.id}:`, error);
				}
			}
		});
	}
}

// Create singleton instance
export const performanceBudgets = new PerformanceBudgetsManager();

// Export helper functions
export function startBudgetMonitoring(
	budgets?: Partial<PerformanceBudgets>,
	config?: Partial<BudgetMonitoringConfig>
): void {
	if (budgets || config) {
		// Create new instance with custom config
		const customBudgets = new PerformanceBudgetsManager(budgets, config);
		customBudgets.startMonitoring();
	} else {
		performanceBudgets.startMonitoring();
	}
}

export function stopBudgetMonitoring(): void {
	performanceBudgets.stopMonitoring();
}

export function setBudget(
	metric: string,
	category: BudgetRule['category'],
	budget: number,
	options?: {
		warningThreshold?: number;
		criticalThreshold?: number;
		description?: string;
		recommendations?: string[];
	}
): void {
	performanceBudgets.setBudget(metric, category, budget, options);
}

export function checkBudget(metric: string, currentValue: number): BudgetViolation | null {
	return performanceBudgets.checkBudget(metric, currentValue);
}

export function subscribeToAlerts(subscription: Omit<AlertSubscription, 'id'>): string {
	return performanceBudgets.subscribeToAlerts(subscription);
}

export function unsubscribeFromAlerts(subscriptionId: string): boolean {
	return performanceBudgets.unsubscribeFromAlerts(subscriptionId);
}

export function getCurrentViolations(): BudgetViolation[] {
	return performanceBudgets.getCurrentViolations();
}

export function getActiveAlerts(): Alert[] {
	return performanceBudgets.getActiveAlerts();
}

export function getBudgetStatus() {
	return performanceBudgets.getBudgetStatus();
}

export function getPerformanceRecommendations(): Recommendation[] {
	return performanceBudgets.getPerformanceRecommendations();
}

export function exportBudgetData() {
	return performanceBudgets.exportBudgetData();
}

export function checkSVGBudgets(elementCount: number, fileSizeBytes: number) {
	return performanceBudgets.checkSVGBudgets(elementCount, fileSizeBytes);
}
