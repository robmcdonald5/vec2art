/**
 * Analytics Integration and Reporting System
 * Comprehensive analytics providers integration and automated reporting
 */

import type {
	AnalyticsProvider,
	GA4Config,
	PrivacyConfig,
	PerformanceReport,
	TimeFrame,
	SessionData,
	ErrorTracking,
	UserInteraction,
	PerformanceSnapshot
} from '../types/performance.js';

/**
 * Analytics event structure
 */
export interface AnalyticsEvent {
	name: string;
	category: 'performance' | 'user_interaction' | 'error' | 'feature_usage' | 'conversion';
	parameters: Record<string, string | number | boolean>;
	timestamp: Date;
	sessionId: string;
	userId?: string;
}

/**
 * Report configuration
 */
export interface ReportConfig {
	name: string;
	description: string;
	schedule: 'hourly' | 'daily' | 'weekly' | 'monthly';
	enabled: boolean;
	recipients: string[];
	includeCharts: boolean;
	includeRecommendations: boolean;
	customMetrics?: string[];
}

/**
 * Analytics integration configuration
 */
export interface AnalyticsIntegrationConfig {
	providers: AnalyticsProvider[];
	enableEventBatching: boolean;
	batchSize: number;
	batchInterval: number;
	retryAttempts: number;
	enableOfflineQueue: boolean;
	privacySettings: PrivacyConfig;
	debugMode: boolean;
}

/**
 * Report delivery methods
 */
export interface ReportDelivery {
	email?: {
		enabled: boolean;
		smtpConfig?: any;
		templates: Record<string, string>;
	};
	webhook?: {
		enabled: boolean;
		url: string;
		headers?: Record<string, string>;
	};
	storage?: {
		enabled: boolean;
		location: 'localStorage' | 'indexedDB' | 'custom';
		retention: number; // days
	};
}

/**
 * Analytics Integration Service Class
 */
export class AnalyticsIntegrationService {
	private config: AnalyticsIntegrationConfig;
	private eventQueue: AnalyticsEvent[] = [];
	private batchTimer?: number;
	private reports = new Map<string, ReportConfig>();
	private reportSchedules = new Map<string, number>();
	private isOnline = navigator.onLine;
	private offlineQueue: AnalyticsEvent[] = [];

	constructor(config: Partial<AnalyticsIntegrationConfig> = {}) {
		this.config = {
			providers: [],
			enableEventBatching: true,
			batchSize: 20,
			batchInterval: 30000, // 30 seconds
			retryAttempts: 3,
			enableOfflineQueue: true,
			privacySettings: {
				collectPII: false,
				cookieConsent: true,
				dataRetentionDays: 30,
				anonymizeIPs: true,
				optOutAvailable: true
			},
			debugMode: false,
			...config
		};

		this.initialize();
	}

	/**
	 * Add analytics provider
	 */
	addProvider(provider: AnalyticsProvider): void {
		this.config.providers.push(provider);
		this.log(
			`Added analytics provider: ${provider.ga4Integration?.measurementId || provider.customEndpoint}`
		);
	}

	/**
	 * Track performance event
	 */
	trackPerformanceEvent(
		eventName: string,
		metrics: Record<string, number>,
		metadata?: Record<string, string>
	): void {
		if (!this.canCollectData()) return;

		const event: AnalyticsEvent = {
			name: eventName,
			category: 'performance',
			parameters: {
				...metrics,
				...metadata
			},
			timestamp: new Date(),
			sessionId: this.getCurrentSessionId()
		};

		this.queueEvent(event);
	}

	/**
	 * Track user interaction event
	 */
	trackUserInteractionEvent(interaction: UserInteraction): void {
		if (!this.canCollectData()) return;

		const event: AnalyticsEvent = {
			name: 'user_interaction',
			category: 'user_interaction',
			parameters: {
				interaction_type: interaction.type,
				target: interaction.target,
				duration: interaction.duration || 0,
				success: interaction.success,
				...interaction.metadata
			},
			timestamp: interaction.timestamp,
			sessionId: this.getCurrentSessionId()
		};

		this.queueEvent(event);
	}

	/**
	 * Track error event
	 */
	trackErrorEvent(error: ErrorTracking): void {
		if (!this.canCollectData()) return;

		const event: AnalyticsEvent = {
			name: 'application_error',
			category: 'error',
			parameters: {
				error_type: error.errorType,
				error_message: this.sanitizeErrorMessage(error.errorMessage),
				user_impact: error.userImpact,
				performance_impact: error.performanceImpact,
				recovery_time: error.recoveryTime
			},
			timestamp: error.timestamp,
			sessionId: error.sessionId
		};

		this.queueEvent(event);
	}

	/**
	 * Track feature usage event
	 */
	trackFeatureUsageEvent(
		featureName: string,
		duration: number,
		completed: boolean,
		metadata?: Record<string, any>
	): void {
		if (!this.canCollectData()) return;

		const event: AnalyticsEvent = {
			name: 'feature_usage',
			category: 'feature_usage',
			parameters: {
				feature_name: featureName,
				duration,
				completed,
				...metadata
			},
			timestamp: new Date(),
			sessionId: this.getCurrentSessionId()
		};

		this.queueEvent(event);
	}

	/**
	 * Track conversion event
	 */
	trackConversionEvent(
		conversionName: string,
		value?: number,
		metadata?: Record<string, any>
	): void {
		if (!this.canCollectData()) return;

		const event: AnalyticsEvent = {
			name: conversionName,
			category: 'conversion',
			parameters: {
				conversion_value: value || 1,
				...metadata
			},
			timestamp: new Date(),
			sessionId: this.getCurrentSessionId()
		};

		this.queueEvent(event);
	}

	/**
	 * Send performance snapshot
	 */
	sendPerformanceSnapshot(snapshot: PerformanceSnapshot): void {
		if (!this.canCollectData()) return;

		// Send web vitals
		Object.entries(snapshot.webVitals).forEach(([metric, value]) => {
			if (value > 0) {
				this.trackPerformanceEvent(`web_vital_${metric.toLowerCase()}`, { [metric]: value });
			}
		});

		// Send custom metrics
		Object.entries(snapshot.customMetrics).forEach(([metric, value]) => {
			if (value > 0) {
				this.trackPerformanceEvent(`custom_metric_${metric}`, { [metric]: value });
			}
		});

		// Send WASM metrics
		this.trackPerformanceEvent('wasm_performance', {
			module_load_time: snapshot.wasmMetrics.moduleLoadTime,
			thread_count: snapshot.wasmMetrics.activeThreadCount,
			memory_usage: snapshot.wasmMetrics.wasmMemoryUsage
		});

		// Send resource metrics
		this.trackPerformanceEvent('resource_usage', {
			heap_usage: snapshot.resourceUsage.heapUsage,
			cpu_usage: snapshot.resourceUsage.cpuUsage,
			network_latency: snapshot.resourceUsage.networkLatency
		});
	}

	/**
	 * Send session data
	 */
	sendSessionData(session: SessionData): void {
		if (!this.canCollectData()) return;

		const sessionEvent: AnalyticsEvent = {
			name: 'session_summary',
			category: 'user_interaction',
			parameters: {
				session_duration: session.duration || 0,
				page_views: session.pageViews.length,
				interactions: session.interactions.length,
				errors: session.errors.length,
				user_agent: this.sanitizeUserAgent(session.userAgent),
				viewport_width: session.viewport.width,
				viewport_height: session.viewport.height
			},
			timestamp: session.endTime || new Date(),
			sessionId: session.sessionId
		};

		this.queueEvent(sessionEvent);
	}

	/**
	 * Generate and send performance report
	 */
	async generatePerformanceReport(
		timeframe: TimeFrame,
		includeCharts = false
	): Promise<PerformanceReport | null> {
		try {
			// This would typically aggregate data from analytics providers
			// For now, we'll create a basic report structure
			const report: PerformanceReport = {
				timeframe,
				aggregatedMetrics: await this.aggregateMetrics(timeframe),
				trends: await this.calculateTrends(timeframe),
				recommendations: await this.generateRecommendations(timeframe),
				alerts: [], // Would be populated from alert system
				summary: {
					totalSessions: 0,
					averageSessionDuration: 0,
					errorRate: 0,
					performanceScore: 0,
					budgetViolations: 0,
					improvementSuggestions: 0
				}
			};

			// Send report to all configured providers
			await this.sendReport(report, includeCharts);

			return report;
		} catch (error) {
			this.log(`Failed to generate performance report: ${error}`);
			return null;
		}
	}

	/**
	 * Schedule automated reports
	 */
	scheduleReport(config: ReportConfig): void {
		this.reports.set(config.name, config);

		if (config.enabled) {
			const interval = this.getReportInterval(config.schedule);
			const timerId = window.setInterval(() => {
				this.generateScheduledReport(config.name);
			}, interval);

			this.reportSchedules.set(config.name, timerId);
			this.log(`Scheduled ${config.schedule} report: ${config.name}`);
		}
	}

	/**
	 * Unschedule report
	 */
	unscheduleReport(reportName: string): void {
		const timerId = this.reportSchedules.get(reportName);
		if (timerId) {
			clearInterval(timerId);
			this.reportSchedules.delete(reportName);
		}
		this.reports.delete(reportName);
	}

	/**
	 * Update privacy settings
	 */
	updatePrivacySettings(settings: Partial<PrivacyConfig>): void {
		this.config.privacySettings = {
			...this.config.privacySettings,
			...settings
		};

		// Clear queues if data collection is disabled
		if (!this.canCollectData()) {
			this.eventQueue = [];
			this.offlineQueue = [];
		}
	}

	/**
	 * Export analytics data
	 */
	exportAnalyticsData(): {
		config: AnalyticsIntegrationConfig;
		queuedEvents: number;
		offlineEvents: number;
		scheduledReports: string[];
		dataCollectionEnabled: boolean;
	} {
		return {
			config: this.config,
			queuedEvents: this.eventQueue.length,
			offlineEvents: this.offlineQueue.length,
			scheduledReports: Array.from(this.reports.keys()),
			dataCollectionEnabled: this.canCollectData()
		};
	}

	/**
	 * Clear all analytics data
	 */
	clearAnalyticsData(): void {
		this.eventQueue = [];
		this.offlineQueue = [];

		// Clear stored data based on privacy settings
		if (this.config.privacySettings.dataRetentionDays === 0) {
			// Clear all stored analytics data
			this.clearStoredData();
		}
	}

	// Private methods

	private initialize(): void {
		// Set up event batching
		if (this.config.enableEventBatching) {
			this.startBatchTimer();
		}

		// Set up offline/online handlers
		window.addEventListener('online', () => {
			this.isOnline = true;
			this.processOfflineQueue();
		});

		window.addEventListener('offline', () => {
			this.isOnline = false;
		});

		// Set up privacy compliance
		this.checkPrivacyCompliance();

		this.log('Analytics integration service initialized');
	}

	private queueEvent(event: AnalyticsEvent): void {
		// Check data retention
		if (!this.isWithinRetentionPeriod(event.timestamp)) {
			return;
		}

		// Sanitize event data
		const sanitizedEvent = this.sanitizeEvent(event);

		if (this.isOnline) {
			this.eventQueue.push(sanitizedEvent);

			if (!this.config.enableEventBatching || this.eventQueue.length >= this.config.batchSize) {
				this.processBatch();
			}
		} else if (this.config.enableOfflineQueue) {
			this.offlineQueue.push(sanitizedEvent);
		}
	}

	private startBatchTimer(): void {
		this.batchTimer = window.setInterval(() => {
			if (this.eventQueue.length > 0) {
				this.processBatch();
			}
		}, this.config.batchInterval);
	}

	private async processBatch(): Promise<void> {
		if (this.eventQueue.length === 0) return;

		const batch = [...this.eventQueue];
		this.eventQueue = [];

		try {
			await this.sendBatchToProviders(batch);
			this.log(`Sent batch of ${batch.length} events`);
		} catch (error) {
			this.log(`Failed to send batch: ${error}`);

			// Retry or add back to queue
			if (this.config.enableOfflineQueue) {
				this.offlineQueue.push(...batch);
			}
		}
	}

	private async processOfflineQueue(): Promise<void> {
		if (this.offlineQueue.length === 0) return;

		const batch = [...this.offlineQueue];
		this.offlineQueue = [];

		try {
			await this.sendBatchToProviders(batch);
			this.log(`Sent offline batch of ${batch.length} events`);
		} catch (error) {
			this.log(`Failed to send offline batch: ${error}`);
		}
	}

	private async sendBatchToProviders(events: AnalyticsEvent[]): Promise<void> {
		const promises = this.config.providers.map((provider) =>
			this.sendBatchToProvider(events, provider)
		);

		await Promise.allSettled(promises);
	}

	private async sendBatchToProvider(
		events: AnalyticsEvent[],
		provider: AnalyticsProvider
	): Promise<void> {
		// Send to GA4
		if (provider.ga4Integration?.enabled) {
			await this.sendToGA4(events, provider.ga4Integration);
		}

		// Send to custom endpoint
		if (provider.customEndpoint) {
			await this.sendToCustomEndpoint(events, provider.customEndpoint);
		}
	}

	private async sendToGA4(events: AnalyticsEvent[], config: GA4Config): Promise<void> {
		// GA4 Measurement Protocol implementation
		const payload = {
			client_id: this.getClientId(),
			events: events.map((event) => ({
				name: event.name,
				params: event.parameters
			}))
		};

		try {
			await fetch(
				`https://www.google-analytics.com/mp/collect?measurement_id=${config.measurementId}&api_secret=${config.apiSecret}`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				}
			);
		} catch (error) {
			throw new Error(`GA4 send failed: ${error}`);
		}
	}

	private async sendToCustomEndpoint(events: AnalyticsEvent[], endpoint: string): Promise<void> {
		try {
			await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ events })
			});
		} catch (error) {
			throw new Error(`Custom endpoint send failed: ${error}`);
		}
	}

	private async sendReport(report: PerformanceReport, includeCharts: boolean): Promise<void> {
		// Send report to configured delivery methods
		// Implementation would depend on delivery configuration
		this.log(`Generated performance report for ${report.timeframe.period}`);
	}

	private async generateScheduledReport(reportName: string): Promise<void> {
		const config = this.reports.get(reportName);
		if (!config || !config.enabled) return;

		const timeframe = this.getTimeframeForSchedule(config.schedule);
		await this.generatePerformanceReport(timeframe, config.includeCharts);
	}

	private async aggregateMetrics(timeframe: TimeFrame): Promise<any> {
		// Implementation would aggregate metrics from analytics providers
		return {};
	}

	private async calculateTrends(timeframe: TimeFrame): Promise<any[]> {
		// Implementation would calculate trends from historical data
		return [];
	}

	private async generateRecommendations(timeframe: TimeFrame): Promise<any[]> {
		// Implementation would generate recommendations based on data
		return [];
	}

	private canCollectData(): boolean {
		return !this.config.privacySettings.cookieConsent || this.hasUserConsent();
	}

	private hasUserConsent(): boolean {
		// Check for user consent (would integrate with consent management platform)
		try {
			return localStorage.getItem('analytics_consent') === 'true';
		} catch {
			return false;
		}
	}

	private checkPrivacyCompliance(): void {
		// Implement privacy compliance checks
		if (this.config.privacySettings.dataRetentionDays === 0) {
			this.clearStoredData();
		}
	}

	private sanitizeEvent(event: AnalyticsEvent): AnalyticsEvent {
		const sanitized = { ...event };

		// Remove PII if configured
		if (!this.config.privacySettings.collectPII) {
			// Remove potentially sensitive data
			delete sanitized.userId;

			// Sanitize parameters
			Object.keys(sanitized.parameters).forEach((key) => {
				const value = sanitized.parameters[key];
				if (typeof value === 'string' && this.mightContainPII(value)) {
					sanitized.parameters[key] = '[REDACTED]';
				}
			});
		}

		return sanitized;
	}

	private sanitizeErrorMessage(message: string): string {
		if (!this.config.privacySettings.collectPII) {
			// Remove potential file paths, URLs, or other sensitive info
			return message
				.replace(/\/[^\s]+/g, '[PATH]')
				.replace(/https?:\/\/[^\s]+/g, '[URL]')
				.replace(/\b\d{4,}\b/g, '[NUMBER]');
		}
		return message;
	}

	private sanitizeUserAgent(userAgent: string): string {
		if (!this.config.privacySettings.collectPII) {
			// Keep only browser/OS info, remove version specifics
			const match = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/);
			return match ? match[0] : 'Unknown';
		}
		return userAgent;
	}

	private mightContainPII(value: string): boolean {
		// Simple PII detection patterns
		const piiPatterns = [
			/\b[\w._%+-]+@[\w.-]+\.[A-Z|a-z]{2,}\b/, // Email
			/\b\d{3}[-.]\d{3}[-.]\d{4}\b/, // Phone
			/\b\d{4}[-.]\d{4}[-.]\d{4}[-.]\d{4}\b/ // Credit card pattern
		];

		return piiPatterns.some((pattern) => pattern.test(value));
	}

	private isWithinRetentionPeriod(timestamp: Date): boolean {
		const retentionMs = this.config.privacySettings.dataRetentionDays * 24 * 60 * 60 * 1000;
		return Date.now() - timestamp.getTime() < retentionMs;
	}

	private getReportInterval(schedule: ReportConfig['schedule']): number {
		switch (schedule) {
			case 'hourly':
				return 60 * 60 * 1000;
			case 'daily':
				return 24 * 60 * 60 * 1000;
			case 'weekly':
				return 7 * 24 * 60 * 60 * 1000;
			case 'monthly':
				return 30 * 24 * 60 * 60 * 1000;
			default:
				return 24 * 60 * 60 * 1000;
		}
	}

	private getTimeframeForSchedule(schedule: ReportConfig['schedule']): TimeFrame {
		const end = new Date();
		let start: Date;

		switch (schedule) {
			case 'hourly':
				start = new Date(end.getTime() - 60 * 60 * 1000);
				break;
			case 'daily':
				start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
				break;
			case 'weekly':
				start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
				break;
			case 'monthly':
				start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
				break;
			default:
				start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
		}

		return { start, end, period: schedule };
	}

	private getCurrentSessionId(): string {
		// Would get session ID from performance monitor
		return `session_${Date.now()}`;
	}

	private getClientId(): string {
		// Generate or retrieve client ID for analytics
		try {
			let clientId = localStorage.getItem('analytics_client_id');
			if (!clientId) {
				clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
				localStorage.setItem('analytics_client_id', clientId);
			}
			return clientId;
		} catch {
			return `temp_${Date.now()}`;
		}
	}

	private clearStoredData(): void {
		try {
			localStorage.removeItem('analytics_client_id');
			localStorage.removeItem('analytics_consent');
			// Clear other analytics-related data
		} catch {
			// Ignore localStorage errors
		}
	}

	private log(message: string): void {
		if (this.config.debugMode) {
			console.log(`[AnalyticsIntegration] ${message}`);
		}
	}
}

// Create singleton instance
export const analyticsIntegration = new AnalyticsIntegrationService();

// Export helper functions
export function addAnalyticsProvider(provider: AnalyticsProvider): void {
	analyticsIntegration.addProvider(provider);
}

export function trackPerformanceEvent(
	eventName: string,
	metrics: Record<string, number>,
	metadata?: Record<string, string>
): void {
	analyticsIntegration.trackPerformanceEvent(eventName, metrics, metadata);
}

export function trackUserInteractionEvent(interaction: UserInteraction): void {
	analyticsIntegration.trackUserInteractionEvent(interaction);
}

export function trackErrorEvent(error: ErrorTracking): void {
	analyticsIntegration.trackErrorEvent(error);
}

export function trackFeatureUsageEvent(
	featureName: string,
	duration: number,
	completed: boolean,
	metadata?: Record<string, any>
): void {
	analyticsIntegration.trackFeatureUsageEvent(featureName, duration, completed, metadata);
}

export function trackConversionEvent(
	conversionName: string,
	value?: number,
	metadata?: Record<string, any>
): void {
	analyticsIntegration.trackConversionEvent(conversionName, value, metadata);
}

export function sendPerformanceSnapshot(snapshot: PerformanceSnapshot): void {
	analyticsIntegration.sendPerformanceSnapshot(snapshot);
}

export function sendSessionData(session: SessionData): void {
	analyticsIntegration.sendSessionData(session);
}

export function generatePerformanceReport(
	timeframe: TimeFrame,
	includeCharts = false
): Promise<PerformanceReport | null> {
	return analyticsIntegration.generatePerformanceReport(timeframe, includeCharts);
}

export function scheduleReport(config: ReportConfig): void {
	analyticsIntegration.scheduleReport(config);
}

export function updatePrivacySettings(settings: Partial<PrivacyConfig>): void {
	analyticsIntegration.updatePrivacySettings(settings);
}

export function exportAnalyticsData() {
	return analyticsIntegration.exportAnalyticsData();
}
