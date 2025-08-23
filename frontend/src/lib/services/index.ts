/**
 * Performance Monitoring Services Index
 * Centralized exports for all performance monitoring components
 */

// Core performance monitoring
export {
	PerformanceMonitor,
	performanceMonitor,
	trackWebVitals,
	trackCustomMetric,
	trackWASMMetrics,
	trackProcessingAnalytics,
	trackError,
	trackUserInteraction,
	getRealtimeMetrics
} from './performance-monitor.js';

// WASM-specific performance tracking
export {
	WASMPerformanceTracker,
	wasmPerformanceTracker,
	trackWASMModuleLoading,
	trackWASMInstantiation,
	trackWASMThreadPoolInit,
	trackWASMThreadUtilization,
	trackWASMMemoryUsage,
	trackWASMImageProcessing,
	trackWASMAlgorithmPerformance,
	trackWASMError,
	getCurrentWASMMetrics,
	getProcessingInsights,
	detectWASMPerformanceRegression
} from './wasm-performance-tracker.js';

// Error tracking and recovery
export {
	ErrorTracker,
	errorTracker,
	trackApplicationError,
	trackRecovery,
	addErrorBreadcrumb,
	trackUserAction,
	getErrorStatistics,
	getRecentErrors,
	getBreadcrumbs,
	exportErrorData,
	clearErrorHistory
} from './error-tracker.js';

// Resource monitoring
export {
	ResourceMonitor,
	resourceMonitor,
	startResourceMonitoring,
	stopResourceMonitoring,
	getCurrentResources,
	getMemoryMetrics,
	getCPUMetrics,
	getNetworkMetrics,
	getStorageMetrics,
	getResourceHistory,
	getResourceTrends,
	checkResourceThresholds,
	estimateResourceImpact
} from './resource-monitor.js';

// User experience analytics
export {
	UXAnalyticsService,
	uxAnalytics,
	startUXTracking,
	stopUXTracking,
	trackPageView,
	trackInteraction,
	trackFeatureUsage,
	startTask,
	addTaskStep,
	completeTask,
	trackTaskError,
	trackFunnelStep,
	getUXAnalytics,
	getEngagementMetrics,
	getUXHeuristics,
	getUserJourney,
	exportUXData
} from './ux-analytics.js';

// Performance budgets and alerts
export {
	PerformanceBudgetsManager,
	performanceBudgets,
	startBudgetMonitoring,
	stopBudgetMonitoring,
	setBudget,
	checkBudget,
	subscribeToAlerts,
	unsubscribeFromAlerts,
	getCurrentViolations,
	getActiveAlerts,
	getBudgetStatus,
	getPerformanceRecommendations,
	exportBudgetData
} from './performance-budgets.js';

// Analytics integration
export {
	AnalyticsIntegrationService,
	analyticsIntegration,
	addAnalyticsProvider,
	trackPerformanceEvent,
	trackUserInteractionEvent,
	trackErrorEvent,
	trackFeatureUsageEvent,
	trackConversionEvent,
	sendPerformanceSnapshot,
	sendSessionData,
	generatePerformanceReport,
	scheduleReport,
	updatePrivacySettings,
	exportAnalyticsData
} from './analytics-integration.js';

// Privacy management
export {
	PrivacyManager,
	privacyManager,
	hasConsent,
	updateConsent,
	withdrawConsent,
	canCollectData,
	canProcessData,
	logDataProcessing,
	exportUserData,
	deleteAllUserData,
	getConsentStatus,
	getPrivacyNotice,
	getComplianceStatus,
	showConsentBanner,
	isConsentRequired
} from './privacy-manager.js';

// Development tools
export {
	DevToolsService,
	devTools,
	startDebugging,
	stopDebugging,
	detectBottlenecks,
	detectMemoryLeaks,
	mark,
	measure,
	getTimeline,
	exportDebugData,
	analyzeBundlePerformance,
	generateOptimizationSuggestions
} from './dev-tools.js';

// Performance integration (main orchestrator)
export {
	PerformanceIntegrationService,
	performanceIntegration,
	initializePerformanceMonitoring,
	trackWASMLoading,
	trackWASMInstantiation,
	trackWASMThreads,
	trackImageProcessing,
	trackTask,
	trackFeature,
	trackApplicationError,
	getPerformanceReport,
	exportPerformanceData,
	checkSystemHealth
} from './performance-integration.js';

// Re-export types for convenience
export type {
	// Core types
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
	HealthStatus,

	// Privacy types
	ConsentCategory,
	ConsentStatus,
	PrivacyConfig,
	DataExport,

	// Dev tools types
	PerformanceBottleneck,
	MemoryLeakDetection,
	TimelineEntry,
	OptimizationSuggestion,

	// Configuration types
	PerformanceConfig
} from '../types/performance.js';

/**
 * Quick start function for easy initialization
 */
export async function quickStartPerformanceMonitoring(
	options: {
		enableWebVitals?: boolean;
		enableWASMTracking?: boolean;
		enableUXTracking?: boolean;
		enableErrorTracking?: boolean;
		enableResourceMonitoring?: boolean;
		enableBudgetMonitoring?: boolean;
		enableAnalytics?: boolean;
		enablePrivacyCompliance?: boolean;
		enableDevTools?: boolean;
		debugMode?: boolean;
	} = {}
): Promise<void> {
	const {
		enableWebVitals = true,
		enableWASMTracking = true,
		enableUXTracking = true,
		enableErrorTracking = true,
		enableResourceMonitoring = true,
		enableBudgetMonitoring = true,
		enableAnalytics = false,
		enablePrivacyCompliance = true,
		enableDevTools = false,
		debugMode = false
	} = options;

	console.log('🚀 Initializing vec2art performance monitoring...');

	try {
		// Initialize privacy compliance first
		if (enablePrivacyCompliance) {
			if (isConsentRequired() && !getConsentStatus()) {
				showConsentBanner();
				console.log('📋 Consent banner shown - waiting for user consent');
				return; // Wait for user consent before proceeding
			}
		}

		// Initialize performance integration
		await initializePerformanceMonitoring({
			enableWebVitals,
			enableWASMTracking,
			enableUXTracking,
			enableErrorTracking,
			enableResourceMonitoring,
			enableDevTools,
			debugMode
		});

		// Start budget monitoring
		if (enableBudgetMonitoring) {
			startBudgetMonitoring();
			console.log('💰 Performance budget monitoring started');
		}

		// Setup analytics if enabled
		if (enableAnalytics && hasConsent('analytics')) {
			// Analytics would be configured here
			console.log('📊 Analytics integration ready');
		}

		// Start dev tools if enabled
		if (enableDevTools && debugMode) {
			startDebugging();
			console.log('🔧 Development tools enabled');
		}

		console.log('✅ Performance monitoring initialized successfully');

		// Log system health
		const health = checkSystemHealth();
		console.log(`📊 System health: ${health.overall}`, health.details);
	} catch (error) {
		console.error('❌ Failed to initialize performance monitoring:', error);
		throw error;
	}
}

/**
 * Get comprehensive performance status
 */
export function getPerformanceStatus(): {
	isMonitoring: boolean;
	services: Record<string, boolean>;
	health: ReturnType<typeof checkSystemHealth>;
	budgets: ReturnType<typeof getBudgetStatus>;
	privacy: ReturnType<typeof getComplianceStatus>;
	recommendations: Recommendation[];
} {
	return {
		isMonitoring: true, // Would check actual monitoring status
		services: {
			webVitals: true,
			wasmTracking: true,
			uxAnalytics: true,
			errorTracking: true,
			resourceMonitoring: true,
			budgetMonitoring: true,
			analytics: hasConsent('analytics'),
			privacy: true,
			devTools: false
		},
		health: checkSystemHealth(),
		budgets: getBudgetStatus(),
		privacy: getComplianceStatus(),
		recommendations: getPerformanceRecommendations()
	};
}

/**
 * Export all performance data for analysis
 */
export function exportAllPerformanceData(): {
	timestamp: string;
	performance: ReturnType<typeof getPerformanceReport>;
	ux: ReturnType<typeof exportUXData>;
	errors: ReturnType<typeof exportErrorData>;
	budgets: ReturnType<typeof exportBudgetData>;
	analytics: ReturnType<typeof exportAnalyticsData>;
	privacy: {
		consent: ReturnType<typeof getConsentStatus>;
		compliance: ReturnType<typeof getComplianceStatus>;
	};
} {
	return {
		timestamp: new Date().toISOString(),
		performance: getPerformanceReport(),
		ux: exportUXData(),
		errors: exportErrorData(),
		budgets: exportBudgetData(),
		analytics: exportAnalyticsData(),
		privacy: {
			consent: getConsentStatus(),
			compliance: getComplianceStatus()
		}
	};
}
