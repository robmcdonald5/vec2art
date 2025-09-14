/**
 * Service Layer Entry Point
 * Centralized exports for all services including new refactored architecture
 * and legacy performance monitoring components
 */

// === NEW REFACTORED ARCHITECTURE ===

// Core Refactored Services
import { VectorizerServiceRefactored } from './vectorizer-service-refactored';
import { WorkerPool } from './worker-pool';
import { ProcessingQueue } from './processing-queue';
import { VectorizerCache } from './vectorizer-cache';
import { ProgressAggregator } from './progress-aggregator';

// Utility Services
import { ValidationService } from './validation-service';
import { ErrorService } from './error-service';

// Re-export for external usage
export {
	VectorizerServiceRefactored,
	WorkerPool,
	ProcessingQueue,
	VectorizerCache,
	ProgressAggregator,
	ValidationService,
	ErrorService
};

// Legacy Services (for gradual migration)
export { WasmWorkerService } from './wasm-worker-service';

// Service Factory
export class ServiceContainer {
	private static instance: ServiceContainer;

	private workerPool: WorkerPool;
	private cache: VectorizerCache;
	private queue: ProcessingQueue;
	private progressAggregator: ProgressAggregator;
	private validationService: ValidationService;
	private errorService: ErrorService;
	private vectorizerService: VectorizerServiceRefactored;

	private constructor() {
		// Initialize utility services first
		this.validationService = new ValidationService();
		this.errorService = new ErrorService();

		// Initialize vectorizer service with configuration
		this.vectorizerService = new VectorizerServiceRefactored({
			workerCount: 4,
			maxQueueSize: 100,
			cacheEnabled: true,
			cacheMaxSize: 50,
			defaultTimeout: 120000,
			retryAttempts: 3,
			retryDelay: 1000
		});

		// Get references to the internal services for direct access
		this.workerPool = (this.vectorizerService as any).workerPool;
		this.cache = (this.vectorizerService as any).cache;
		this.queue = (this.vectorizerService as any).processingQueue;
		this.progressAggregator = (this.vectorizerService as any).progressAggregator;
	}

	static getInstance(): ServiceContainer {
		if (!ServiceContainer.instance) {
			ServiceContainer.instance = new ServiceContainer();
		}
		return ServiceContainer.instance;
	}

	// Service Accessors
	getVectorizerService(): VectorizerServiceRefactored {
		return this.vectorizerService;
	}

	getWorkerPool(): WorkerPool {
		return this.workerPool;
	}

	getCache(): VectorizerCache {
		return this.cache;
	}

	getQueue(): ProcessingQueue {
		return this.queue;
	}

	getProgressAggregator(): ProgressAggregator {
		return this.progressAggregator;
	}

	getValidationService(): ValidationService {
		return this.validationService;
	}

	getErrorService(): ErrorService {
		return this.errorService;
	}

	// Lifecycle Management
	async initialize(): Promise<void> {
		await this.workerPool.initialize();
		await this.vectorizerService.initialize();
	}

	async shutdown(): Promise<void> {
		await this.vectorizerService.shutdown();
		await this.workerPool.shutdown();
		this.cache.clear();
		this.queue.clear();
	}

	// Health Check
	getHealthStatus() {
		return {
			workerPool: this.workerPool.getStats(),
			cache: this.cache.getStats(),
			queue: this.queue.getStats(),
			errors: this.errorService.getErrorStats()
		};
	}
}

// Migration Utilities
export class MigrationHelper {
	/**
	 * Migrate from old WasmWorkerService to new architecture
	 */
	static async migrateFromLegacy(): Promise<ServiceContainer> {
		const container = ServiceContainer.getInstance();
		await container.initialize();
		return container;
	}

	/**
	 * Check if new architecture is available and ready
	 */
	static async isNewArchitectureReady(): Promise<boolean> {
		try {
			const container = ServiceContainer.getInstance();
			const health = container.getHealthStatus();
			return health.workerPool.readyWorkers > 0;
		} catch {
			return false;
		}
	}

	/**
	 * Gradual feature flag for migration
	 */
	static shouldUseLegacyService(): boolean {
		// Check for feature flag or environment variable
		return typeof globalThis !== 'undefined' && (globalThis as any).__VEC2ART_USE_LEGACY__ === true;
	}
}

// Convenience exports for direct usage
export const serviceContainer = ServiceContainer.getInstance();

// === LEGACY PERFORMANCE MONITORING SERVICES ===

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
	trackWASMInstantiation as trackWASMInstantiationIntegration,
	trackWASMThreads,
	trackImageProcessing,
	trackTask,
	trackFeature,
	trackApplicationError as trackApplicationErrorIntegration,
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
	// Import functions locally to avoid circular dependencies
	const {
		isConsentRequired,
		getConsentStatus,
		showConsentBanner,
		hasConsent,
		getComplianceStatus: _getComplianceStatus
	} = await import('./privacy-manager.js');
	const { initializePerformanceMonitoring, checkSystemHealth } = await import(
		'./performance-integration.js'
	);
	const {
		startBudgetMonitoring,
		getBudgetStatus: _getBudgetStatus,
		getPerformanceRecommendations: _getPerformanceRecommendations
	} = await import('./performance-budgets.js');
	const { startDebugging } = await import('./dev-tools.js');
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
export async function getPerformanceStatus(): Promise<{
	isMonitoring: boolean;
	services: Record<string, boolean>;
	health: any;
	budgets: any;
	privacy: any;
	recommendations: any[];
}> {
	// Import functions locally to avoid circular dependencies
	const { hasConsent, getComplianceStatus } = await import('./privacy-manager.js');
	const { checkSystemHealth } = await import('./performance-integration.js');
	const { getBudgetStatus, getPerformanceRecommendations } = await import(
		'./performance-budgets.js'
	);

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
export async function exportAllPerformanceData(): Promise<{
	timestamp: string;
	performance: any;
	ux: any;
	errors: any;
	budgets: any;
	analytics: any;
	privacy: {
		consent: any;
		compliance: any;
	};
}> {
	// Import functions locally to avoid circular dependencies
	const { getPerformanceReport } = await import('./performance-integration.js');
	const { exportUXData } = await import('./ux-analytics.js');
	const { exportErrorData } = await import('./error-tracker.js');
	const { exportBudgetData } = await import('./performance-budgets.js');
	const { exportAnalyticsData } = await import('./analytics-integration.js');
	const { getConsentStatus, getComplianceStatus } = await import('./privacy-manager.js');

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

// === INTEGRATED SERVICE EXPORT ===

/**
 * Default export combining new architecture with legacy services
 */
export default {
	// New Architecture
	ServiceContainer,
	MigrationHelper,
	serviceContainer,

	// Quick access to new services
	VectorizerService: VectorizerServiceRefactored,
	WorkerPool,
	ProcessingQueue,
	VectorizerCache,
	ProgressAggregator,
	ValidationService,
	ErrorService,

	// Migration utilities
	migrateFromLegacy: MigrationHelper.migrateFromLegacy,
	isNewArchitectureReady: MigrationHelper.isNewArchitectureReady,
	shouldUseLegacyService: MigrationHelper.shouldUseLegacyService,

	// Legacy performance monitoring initialization
	quickStartPerformanceMonitoring,
	getPerformanceStatus,
	exportAllPerformanceData
};
