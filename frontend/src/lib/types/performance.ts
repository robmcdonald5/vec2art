/**
 * Performance monitoring types for vec2art application
 * Comprehensive type definitions for telemetry, metrics, and monitoring
 */

// Core Web Vitals metrics
export interface WebVitalsMetrics {
	/** Largest Contentful Paint - Loading performance */
	LCP: number;
	/** First Input Delay - Interactivity */
	FID: number;
	/** Cumulative Layout Shift - Visual stability */
	CLS: number;
	/** First Contentful Paint - Time to first content */
	FCP: number;
	/** Time to Interactive - Full interactivity */
	TTI: number;
	/** Time to First Byte - Server response time */
	TTFB: number;
}

// Custom application metrics
export interface CustomMetrics {
	/** WASM module loading time */
	wasmLoadTime: number;
	/** Thread pool initialization time */
	threadInitTime: number;
	/** Image processing time */
	imageProcessingTime: number;
	/** File upload speed */
	fileUploadSpeed: number;
	/** SVG generation time */
	svgGenerationTime: number;
}

// User experience metrics
export interface UserExperienceMetrics {
	/** Page load time */
	pageLoadTime: number;
	/** Time to interactive */
	timeToInteractive: number;
	/** WASM load time */
	wasmLoadTime: number;
	/** Thread initialization time */
	threadInitTime: number;
	/** Image processing time */
	imageProcessingTime: number;
	/** Processing throughput */
	processingThroughput: number;
	/** User interaction delay */
	userInteractionDelay: number;
	/** Error rate */
	errorRate: number;
}

// WASM performance metrics
export interface WASMPerformanceMetrics {
	/** Loading metrics */
	moduleLoadTime: number;
	instantiationTime: number;

	/** Threading metrics */
	threadPoolInitTime: number;
	activeThreadCount: number;
	threadUtilization: number;

	/** Processing metrics */
	algorithmPerformance: {
		edge: number;
		centerline: number;
		superpixel: number;
		dots: number;
	};

	/** Memory usage */
	wasmMemoryUsage: number;
	heapUtilization: number;
}

// Image processing analytics
export interface ProcessingAnalytics {
	/** Input characteristics */
	inputImageSize: number;
	inputDimensions: [number, number];
	inputFormat: string;

	/** Processing configuration */
	backend: string;
	threadCount: number;
	processingOptions: Record<string, any>;

	/** Performance results */
	processingTime: number;
	outputSize: number;
	compressionRatio: number;

	/** Quality metrics */
	pathCount: number;
	optimizationLevel: number;
}

// Error tracking
export interface ErrorTracking {
	/** Error classification */
	errorType: 'wasm' | 'ui' | 'network' | 'processing' | 'unknown';
	errorMessage: string;
	stackTrace: string;

	/** Context information */
	userAgent: string;
	url: string;
	timestamp: Date;
	sessionId: string;

	/** Performance impact */
	performanceImpact: number;
	recoveryTime: number;

	/** User experience impact */
	userImpact: 'critical' | 'major' | 'minor' | 'none';
}

// Resource monitoring
export interface ResourceMonitoring {
	/** Memory usage */
	heapUsage: number;
	wasmMemoryUsage: number;

	/** CPU utilization */
	cpuUsage: number;
	threadUtilization: Record<number, number>;

	/** Network performance */
	networkLatency: number;
	bandwidthUtilization: number;

	/** Storage usage */
	localStorageUsage: number;
	cacheUtilization: number;
}

// User experience analytics
export interface UXAnalytics {
	/** Interaction metrics */
	timeToFirstInteraction: number;
	interactionResponseTime: number;

	/** Task completion metrics */
	taskCompletionRate: number;
	averageTaskTime: number;

	/** Feature usage */
	featureUsageStats: Record<string, number>;
	userFlowAnalytics: FlowStep[];

	/** Satisfaction metrics */
	errorEncounterRate: number;
	retryAttempts: number;
	sessionDuration: number;
}

// Flow step for user journey tracking
export interface FlowStep {
	stepName: string;
	timestamp: number;
	duration: number;
	completed: boolean;
	errorEncountered?: string;
}

// Performance snapshot
export interface PerformanceSnapshot {
	timestamp: number;
	webVitals: WebVitalsMetrics;
	customMetrics: CustomMetrics;
	wasmMetrics: WASMPerformanceMetrics;
	resourceUsage: ResourceMonitoring;
	sessionId: string;
}

// Performance report
export interface PerformanceReport {
	timeframe: TimeFrame;
	aggregatedMetrics: AggregatedMetrics;
	trends: TrendData[];
	recommendations: Recommendation[];
	alerts: Alert[];
	summary: ReportSummary;
}

// Time frame for reports
export interface TimeFrame {
	start: Date;
	end: Date;
	period: 'hour' | 'day' | 'week' | 'month';
}

// Aggregated metrics
export interface AggregatedMetrics {
	webVitals: {
		[K in keyof WebVitalsMetrics]: MetricAggregation;
	};
	custom: {
		[K in keyof CustomMetrics]: MetricAggregation;
	};
	wasm: {
		[K in keyof WASMPerformanceMetrics]: MetricAggregation;
	};
}

// Metric aggregation
export interface MetricAggregation {
	mean: number;
	median: number;
	p95: number;
	p99: number;
	min: number;
	max: number;
	count: number;
}

// Trend data
export interface TrendData {
	timestamp: number;
	metric: string;
	value: number;
	change: number;
	changePercent: number;
}

// Recommendations
export interface Recommendation {
	id: string;
	type: 'performance' | 'optimization' | 'user-experience';
	priority: 'high' | 'medium' | 'low';
	title: string;
	description: string;
	impact: string;
	effort: 'low' | 'medium' | 'high';
	actionUrl?: string;
}

// Alerts
export interface Alert {
	id: string;
	type: 'budget-exceeded' | 'performance-regression' | 'error-spike' | 'resource-limit';
	severity: 'critical' | 'warning' | 'info';
	title: string;
	description: string;
	threshold: number;
	currentValue: number;
	timestamp: Date;
	resolved: boolean;
}

// Report summary
export interface ReportSummary {
	totalSessions: number;
	averageSessionDuration: number;
	errorRate: number;
	performanceScore: number;
	budgetViolations: number;
	improvementSuggestions: number;
}

// Performance budgets
export interface PerformanceBudgets {
	/** Core Web Vitals thresholds */
	LCP: number;
	FID: number;
	CLS: number;
	FCP: number;
	TTI: number;
	TTFB: number;

	/** Application-specific budgets */
	wasmLoadTime: number;
	threadInitTime: number;
	imageProcessing: number;
	uiResponseTime: number;

	/** Resource budgets */
	bundleSize: number;
	imageUploadSize: number;
	memoryUsage: number;
}

// Analytics provider configuration
export interface AnalyticsProvider {
	/** Google Analytics 4 */
	ga4Integration?: GA4Config;

	/** Custom analytics endpoint */
	customEndpoint?: string;

	/** Privacy settings */
	privacySettings: PrivacyConfig;
}

// GA4 configuration
export interface GA4Config {
	measurementId: string;
	apiSecret: string;
	enabled: boolean;
}

// Privacy configuration
export interface PrivacyConfig {
	collectPII: boolean;
	cookieConsent: boolean;
	dataRetentionDays: number;
	anonymizeIPs: boolean;
	optOutAvailable: boolean;
}

// Live metrics for dashboard
export interface LiveMetrics {
	currentPerformance: PerformanceSnapshot;
	realtimeUsers: number;
	activeProcessing: number;
	errorRate: number;
	systemHealth: 'healthy' | 'warning' | 'critical';
}

// Health status
export interface HealthStatus {
	overall: 'healthy' | 'warning' | 'critical';
	components: {
		frontend: 'healthy' | 'warning' | 'critical';
		wasm: 'healthy' | 'warning' | 'critical';
		threading: 'healthy' | 'warning' | 'critical';
		processing: 'healthy' | 'warning' | 'critical';
	};
	uptime: number;
	lastHealthCheck: Date;
}

// Performance dashboard interface
export interface PerformanceDashboard {
	/** Current performance status */
	currentMetrics: LiveMetrics;

	/** Historical trends */
	performanceTrends: TrendData[];

	/** User experience insights */
	userExperience: UXMetrics;

	/** System health */
	systemHealth: HealthStatus;

	/** Alerts and recommendations */
	alerts: Alert[];
	recommendations: Recommendation[];
}

// UX metrics for dashboard
export interface UXMetrics {
	satisfaction: number;
	taskCompletion: number;
	errorRecovery: number;
	featureAdoption: Record<string, number>;
}

// Session tracking
export interface SessionData {
	sessionId: string;
	startTime: Date;
	endTime?: Date;
	duration?: number;
	userAgent: string;
	viewport: { width: number; height: number };
	pageViews: PageView[];
	interactions: UserInteraction[];
	errors: ErrorTracking[];
	performanceMetrics: PerformanceSnapshot[];
}

// Page view tracking
export interface PageView {
	url: string;
	timestamp: Date;
	duration?: number;
	performanceMetrics?: Partial<WebVitalsMetrics>;
}

// User interaction tracking
export interface UserInteraction {
	type: 'click' | 'scroll' | 'input' | 'upload' | 'download' | 'process';
	target: string;
	timestamp: Date;
	duration?: number;
	success: boolean;
	metadata?: Record<string, any>;
}

// Development tools interfaces
export interface DevTools {
	/** Performance debugging */
	performanceProfiler: Profiler;

	/** Memory leak detection */
	memoryProfiler: MemoryProfiler;

	/** Bundle analysis */
	bundleAnalyzer: BundleAnalyzer;

	/** Performance recommendations */
	optimizationSuggestions: OptimizationEngine;
}

// Profiler interface
export interface Profiler {
	start(): void;
	stop(): ProfileResult;
	getSnapshot(): PerformanceSnapshot;
}

// Network profile
export interface NetworkProfile {
	requests: NetworkRequest[];
	totalBytes: number;
	totalDuration: number;
	averageLatency: number;
	errorRate: number;
}

// Network request
export interface NetworkRequest {
	url: string;
	method: string;
	status: number;
	duration: number;
	bytes: number;
	timestamp: number;
	error?: string;
}

// Profile result
export interface ProfileResult {
	duration: number;
	cpuProfile: CPUProfile;
	memoryProfile: MemoryProfile;
	networkProfile: NetworkProfile;
}

// CPU profile
export interface CPUProfile {
	totalTime: number;
	functionCalls: FunctionCall[];
	hotSpots: HotSpot[];
}

// Function call
export interface FunctionCall {
	name: string;
	file: string;
	line: number;
	duration: number;
	calls: number;
}

// Hot spot
export interface HotSpot {
	function: string;
	percentage: number;
	time: number;
}

// Memory profiler
export interface MemoryProfiler {
	startTracking(): void;
	stopTracking(): MemoryProfile;
	getSnapshot(): MemorySnapshot;
	detectLeaks(): MemoryLeak[];
}

// Memory profile
export interface MemoryProfile {
	heapSize: number;
	usedHeapSize: number;
	allocations: MemoryAllocation[];
	deallocations: MemoryDeallocation[];
	leaks: MemoryLeak[];
}

// Memory snapshot
export interface MemorySnapshot {
	timestamp: number;
	heapSize: number;
	usedHeapSize: number;
	allocatedObjects: number;
}

// Memory allocation
export interface MemoryAllocation {
	size: number;
	type: string;
	stackTrace: string;
	timestamp: number;
}

// Memory deallocation
export interface MemoryDeallocation {
	size: number;
	timestamp: number;
}

// Memory leak
export interface MemoryLeak {
	type: string;
	size: number;
	age: number;
	stackTrace: string;
	severity: 'low' | 'medium' | 'high';
}

// Bundle analyzer
export interface BundleAnalyzer {
	analyzeBundle(): BundleAnalysis;
	getChunkSizes(): ChunkSize[];
	findDuplicates(): Duplicate[];
}

// Bundle analysis
export interface BundleAnalysis {
	totalSize: number;
	compressedSize: number;
	chunks: ChunkAnalysis[];
	dependencies: DependencyAnalysis[];
	recommendations: BundleRecommendation[];
}

// Chunk analysis
export interface ChunkAnalysis {
	name: string;
	size: number;
	compressedSize: number;
	modules: ModuleInfo[];
}

// Chunk size
export interface ChunkSize {
	name: string;
	size: number;
	percentage: number;
}

// Duplicate
export interface Duplicate {
	module: string;
	chunks: string[];
	size: number;
}

// Module info
export interface ModuleInfo {
	name: string;
	size: number;
	imports: string[];
	exports: string[];
}

// Dependency analysis
export interface DependencyAnalysis {
	name: string;
	version: string;
	size: number;
	usageCount: number;
	treeshakeable: boolean;
}

// Bundle recommendation
export interface BundleRecommendation {
	type: 'code-splitting' | 'tree-shaking' | 'compression' | 'dependency-optimization';
	description: string;
	impact: string;
	effort: 'low' | 'medium' | 'high';
}

// Optimization engine
export interface OptimizationEngine {
	analyzePerformance(): OptimizationSuggestion[];
	generateRecommendations(): Recommendation[];
	prioritizeOptimizations(): PrioritizedOptimization[];
}

// Optimization suggestion
export interface OptimizationSuggestion {
	type: 'performance' | 'memory' | 'network' | 'rendering';
	title: string;
	description: string;
	impact: 'high' | 'medium' | 'low';
	effort: 'low' | 'medium' | 'high';
	implementation: string;
}

// Prioritized optimization
export interface PrioritizedOptimization {
	suggestion: OptimizationSuggestion;
	priority: number;
	roi: number;
	dependencies: string[];
}

// Export all types for easier imports
export type * from './performance';
