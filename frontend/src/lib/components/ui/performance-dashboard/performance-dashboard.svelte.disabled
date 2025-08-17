<script lang="ts">
	/**
	 * Performance Dashboard Component
	 * Real-time performance monitoring and metrics visualization
	 */

	import { onMount, onDestroy } from 'svelte';
	import type {
		LiveMetrics,
		PerformanceSnapshot,
		Alert,
		Recommendation,
		HealthStatus,
		WebVitalsMetrics,
		WASMPerformanceMetrics,
		ResourceMonitoring
	} from '../../types/performance.js';
	import { getRealtimeMetrics } from '../../services/performance-monitor.js';
	import { getCurrentWASMMetrics } from '../../services/wasm-performance-tracker.js';
	import { getCurrentResources, getResourceTrends } from '../../services/resource-monitor.js';
	import {
		getUXAnalytics,
		getEngagementMetrics,
		getUXHeuristics
	} from '../../services/ux-analytics.js';
	import { getErrorStatistics, getRecentErrors } from '../../services/error-tracker.js';

	// Component props
	export let expanded = false;
	export let showDetails = false;
	export let refreshInterval = 5000;
	export let darkMode = false;

	// Reactive state
	let liveMetrics: LiveMetrics | null = null;
	let webVitals: WebVitalsMetrics | null = null;
	let wasmMetrics: WASMPerformanceMetrics | null = null;
	let resourceMetrics: ResourceMonitoring | null = null;
	let alerts: Alert[] = [];
	let recommendations: Recommendation[] = [];
	let systemHealth: HealthStatus | null = null;
	let errorStats: any = null;
	let uxMetrics: any = null;
	let refreshTimer: number | null = null;
	let isLoading = true;

	// Chart data
	let performanceHistory: Array<{ timestamp: number; value: number }> = [];
	let memoryHistory: Array<{ timestamp: number; value: number }> = [];
	let errorHistory: Array<{ timestamp: number; count: number }> = [];

	// Component lifecycle
	onMount(() => {
		startMonitoring();
	});

	onDestroy(() => {
		stopMonitoring();
	});

	// Monitoring functions
	function startMonitoring() {
		refreshMetrics();
		refreshTimer = window.setInterval(refreshMetrics, refreshInterval);
	}

	function stopMonitoring() {
		if (refreshTimer) {
			clearInterval(refreshTimer);
			refreshTimer = null;
		}
	}

	async function refreshMetrics() {
		try {
			// Get real-time metrics
			liveMetrics = getRealtimeMetrics();
			wasmMetrics = getCurrentWASMMetrics();
			resourceMetrics = getCurrentResources();

			// Get UX metrics
			uxMetrics = {
				analytics: getUXAnalytics(),
				engagement: getEngagementMetrics(),
				heuristics: getUXHeuristics()
			};

			// Get error statistics
			errorStats = getErrorStatistics();

			// Update performance history
			updatePerformanceHistory();
			updateMemoryHistory();
			updateErrorHistory();

			// System health assessment
			systemHealth = assessSystemHealth();

			isLoading = false;
		} catch (error) {
			console.error('Failed to refresh metrics:', error);
		}
	}

	function updatePerformanceHistory() {
		const timestamp = Date.now();
		const performanceScore = calculatePerformanceScore();

		performanceHistory = [
			...performanceHistory.slice(-49), // Keep last 50 points
			{ timestamp, value: performanceScore }
		];
	}

	function updateMemoryHistory() {
		const timestamp = Date.now();
		const memoryUsage = resourceMetrics?.heapUsage || 0;

		memoryHistory = [
			...memoryHistory.slice(-49), // Keep last 50 points
			{ timestamp, value: memoryUsage / (1024 * 1024) } // Convert to MB
		];
	}

	function updateErrorHistory() {
		const timestamp = Date.now();
		const errorCount = errorStats?.totalErrors || 0;

		errorHistory = [
			...errorHistory.slice(-49), // Keep last 50 points
			{ timestamp, count: errorCount }
		];
	}

	function calculatePerformanceScore(): number {
		if (!liveMetrics) return 0;

		let score = 100;

		// Factor in error rate
		score -= liveMetrics.errorRate * 2;

		// Factor in system health
		if (liveMetrics.systemHealth === 'critical') score -= 40;
		else if (liveMetrics.systemHealth === 'warning') score -= 20;

		return Math.max(0, Math.min(100, score));
	}

	function assessSystemHealth(): HealthStatus {
		const memoryUsage = resourceMetrics?.heapUsage || 0;
		const errorRate = liveMetrics?.errorRate || 0;

		let overall: HealthStatus['overall'] = 'healthy';

		if (memoryUsage > 200 * 1024 * 1024 || errorRate > 10) {
			overall = 'critical';
		} else if (memoryUsage > 100 * 1024 * 1024 || errorRate > 5) {
			overall = 'warning';
		}

		return {
			overall,
			components: {
				frontend: overall,
				wasm: wasmMetrics?.moduleLoadTime ? 'healthy' : 'warning',
				threading: wasmMetrics?.activeThreadCount > 0 ? 'healthy' : 'warning',
				processing: liveMetrics?.activeProcessing > 0 ? 'healthy' : 'healthy'
			},
			uptime: Date.now() - (performance.timeOrigin || 0),
			lastHealthCheck: new Date()
		};
	}

	function formatBytes(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	function formatDuration(ms: number): string {
		if (ms < 1000) return `${ms.toFixed(0)}ms`;
		if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
		return `${(ms / 60000).toFixed(1)}m`;
	}

	function getHealthColor(health: string): string {
		switch (health) {
			case 'healthy':
				return 'text-green-500';
			case 'warning':
				return 'text-yellow-500';
			case 'critical':
				return 'text-red-500';
			default:
				return 'text-gray-500';
		}
	}

	function getPerformanceColor(score: number): string {
		if (score >= 90) return 'text-green-500';
		if (score >= 70) return 'text-yellow-500';
		return 'text-red-500';
	}

	// Simple chart rendering function
	function renderSparkline(
		data: Array<{ timestamp: number; value: number }>,
		width = 100,
		height = 30
	): string {
		if (data.length < 2) return '';

		const maxValue = Math.max(...data.map((d) => d.value));
		const minValue = Math.min(...data.map((d) => d.value));
		const range = maxValue - minValue || 1;

		const points = data
			.map((d, i) => {
				const x = (i / (data.length - 1)) * width;
				const y = height - ((d.value - minValue) / range) * height;
				return `${x},${y}`;
			})
			.join(' ');

		return `<svg width="${width}" height="${height}" class="inline-block">
			<polyline fill="none" stroke="currentColor" stroke-width="1" points="${points}"/>
		</svg>`;
	}
</script>

<div class="performance-dashboard {darkMode ? 'dark' : ''}" class:expanded>
	<div class="dashboard-header">
		<div class="flex items-center justify-between">
			<h2 class="text-lg font-semibold">Performance Monitor</h2>
			<div class="flex items-center gap-2">
				<button
					on:click={() => (expanded = !expanded)}
					class="rounded bg-gray-100 px-3 py-1 text-sm transition-colors hover:bg-gray-200"
				>
					{expanded ? 'Collapse' : 'Expand'}
				</button>
				<div class="status-indicator {getHealthColor(systemHealth?.overall || 'unknown')}">
					<div class="h-2 w-2 rounded-full bg-current"></div>
					<span class="ml-1 text-xs">{systemHealth?.overall || 'Unknown'}</span>
				</div>
			</div>
		</div>
	</div>

	{#if isLoading}
		<div class="loading-state p-4 text-center">
			<div
				class="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
			></div>
			<p class="text-sm text-gray-600">Loading performance metrics...</p>
		</div>
	{:else}
		<div class="dashboard-content">
			<!-- Performance Overview -->
			<div class="metrics-grid">
				<div class="metric-card">
					<div class="metric-header">
						<h3>Performance Score</h3>
						<span class={getPerformanceColor(calculatePerformanceScore())}
							>{calculatePerformanceScore().toFixed(0)}</span
						>
					</div>
					<div class="metric-chart">
						{@html renderSparkline(performanceHistory)}
					</div>
				</div>

				<div class="metric-card">
					<div class="metric-header">
						<h3>Memory Usage</h3>
						<span>{formatBytes(resourceMetrics?.heapUsage || 0)}</span>
					</div>
					<div class="metric-chart">
						{@html renderSparkline(memoryHistory)}
					</div>
				</div>

				<div class="metric-card">
					<div class="metric-header">
						<h3>Error Rate</h3>
						<span class={liveMetrics?.errorRate > 5 ? 'text-red-500' : 'text-green-500'}>
							{liveMetrics?.errorRate.toFixed(1)}%
						</span>
					</div>
					<div class="metric-chart">
						{@html renderSparkline(
							errorHistory.map((e) => ({ timestamp: e.timestamp, value: e.count }))
						)}
					</div>
				</div>

				<div class="metric-card">
					<div class="metric-header">
						<h3>Active Processing</h3>
						<span>{liveMetrics?.activeProcessing || 0}</span>
					</div>
					<div class="metric-chart">
						<div class="text-xs text-gray-500">Real-time</div>
					</div>
				</div>
			</div>

			{#if expanded}
				<!-- Detailed Metrics -->
				<div class="detailed-metrics">
					<!-- WASM Metrics -->
					<div class="metric-section">
						<h3>WASM Performance</h3>
						<div class="metric-row">
							<span>Active Threads:</span>
							<span>{wasmMetrics?.activeThreadCount || 0}</span>
						</div>
						<div class="metric-row">
							<span>Thread Utilization:</span>
							<span>{((wasmMetrics?.threadUtilization || 0) * 100).toFixed(1)}%</span>
						</div>
						<div class="metric-row">
							<span>WASM Memory:</span>
							<span>{formatBytes(wasmMetrics?.wasmMemoryUsage || 0)}</span>
						</div>
						<div class="metric-row">
							<span>Heap Utilization:</span>
							<span>{wasmMetrics?.heapUtilization.toFixed(1)}%</span>
						</div>
					</div>

					<!-- Resource Metrics -->
					<div class="metric-section">
						<h3>System Resources</h3>
						<div class="metric-row">
							<span>CPU Usage:</span>
							<span class={resourceMetrics?.cpuUsage > 80 ? 'text-red-500' : 'text-green-500'}>
								{resourceMetrics?.cpuUsage.toFixed(1)}%
							</span>
						</div>
						<div class="metric-row">
							<span>Network Latency:</span>
							<span>{resourceMetrics?.networkLatency.toFixed(0)}ms</span>
						</div>
						<div class="metric-row">
							<span>Storage Usage:</span>
							<span>{formatBytes(resourceMetrics?.localStorageUsage || 0)}</span>
						</div>
					</div>

					<!-- UX Metrics -->
					<div class="metric-section">
						<h3>User Experience</h3>
						<div class="metric-row">
							<span>Task Completion Rate:</span>
							<span
								class={uxMetrics?.analytics.taskCompletionRate > 80
									? 'text-green-500'
									: 'text-yellow-500'}
							>
								{uxMetrics?.analytics.taskCompletionRate.toFixed(1)}%
							</span>
						</div>
						<div class="metric-row">
							<span>Average Task Time:</span>
							<span>{formatDuration(uxMetrics?.analytics.averageTaskTime || 0)}</span>
						</div>
						<div class="metric-row">
							<span>Session Duration:</span>
							<span>{formatDuration(uxMetrics?.engagement.sessionDuration || 0)}</span>
						</div>
						<div class="metric-row">
							<span>UX Score:</span>
							<span
								class={uxMetrics?.heuristics.overallScore > 80
									? 'text-green-500'
									: 'text-yellow-500'}
							>
								{uxMetrics?.heuristics.overallScore.toFixed(0)}/100
							</span>
						</div>
					</div>

					<!-- Error Statistics -->
					<div class="metric-section">
						<h3>Error Statistics</h3>
						<div class="metric-row">
							<span>Total Errors:</span>
							<span class={errorStats?.totalErrors > 0 ? 'text-red-500' : 'text-green-500'}>
								{errorStats?.totalErrors || 0}
							</span>
						</div>
						<div class="metric-row">
							<span>Recovery Rate:</span>
							<span class={errorStats?.recoveryRate > 80 ? 'text-green-500' : 'text-yellow-500'}>
								{errorStats?.recoveryRate.toFixed(1)}%
							</span>
						</div>
						<div class="metric-row">
							<span>Avg Recovery Time:</span>
							<span>{formatDuration(errorStats?.averageRecoveryTime || 0)}</span>
						</div>
					</div>
				</div>

				<!-- Alerts and Recommendations -->
				{#if alerts.length > 0 || recommendations.length > 0}
					<div class="alerts-section">
						{#if alerts.length > 0}
							<div class="alerts">
								<h3>Active Alerts</h3>
								{#each alerts.slice(0, 5) as alert}
									<div class="alert-item {alert.severity}">
										<div class="alert-title">{alert.title}</div>
										<div class="alert-description">{alert.description}</div>
									</div>
								{/each}
							</div>
						{/if}

						{#if recommendations.length > 0}
							<div class="recommendations">
								<h3>Recommendations</h3>
								{#each recommendations.slice(0, 3) as rec}
									<div class="recommendation-item {rec.priority}">
										<div class="recommendation-title">{rec.title}</div>
										<div class="recommendation-description">{rec.description}</div>
										<div class="recommendation-impact">Impact: {rec.impact}</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			{/if}
		</div>
	{/if}
</div>

<style>
	.performance-dashboard {
		@apply rounded-lg border border-gray-200 bg-white shadow-sm;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.performance-dashboard.dark {
		@apply border-gray-700 bg-gray-800 text-white;
	}

	.dashboard-header {
		@apply border-b border-gray-200 px-4 py-3;
	}

	.dashboard-header h2 {
		@apply text-gray-900;
	}

	.dark .dashboard-header {
		@apply border-gray-700;
	}

	.dark .dashboard-header h2 {
		@apply text-white;
	}

	.status-indicator {
		@apply flex items-center text-xs font-medium;
	}

	.loading-state {
		@apply text-gray-600;
	}

	.dark .loading-state {
		@apply text-gray-300;
	}

	.dashboard-content {
		@apply p-4;
	}

	.metrics-grid {
		@apply mb-6 grid grid-cols-2 gap-4 md:grid-cols-4;
	}

	.metric-card {
		@apply rounded-lg bg-gray-50 p-3;
	}

	.dark .metric-card {
		@apply bg-gray-700;
	}

	.metric-header {
		@apply mb-2 flex items-center justify-between;
	}

	.metric-header h3 {
		@apply text-sm font-medium text-gray-600;
	}

	.dark .metric-header h3 {
		@apply text-gray-300;
	}

	.metric-header span {
		@apply text-lg font-semibold;
	}

	.metric-chart {
		@apply flex h-8 items-center;
	}

	.detailed-metrics {
		@apply mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4;
	}

	.metric-section {
		@apply rounded-lg bg-gray-50 p-4;
	}

	.dark .metric-section {
		@apply bg-gray-700;
	}

	.metric-section h3 {
		@apply mb-3 text-sm font-semibold text-gray-900;
	}

	.dark .metric-section h3 {
		@apply text-white;
	}

	.metric-row {
		@apply flex items-center justify-between py-1 text-sm;
	}

	.metric-row span:first-child {
		@apply text-gray-600;
	}

	.dark .metric-row span:first-child {
		@apply text-gray-300;
	}

	.metric-row span:last-child {
		@apply font-medium;
	}

	.alerts-section {
		@apply grid grid-cols-1 gap-6 md:grid-cols-2;
	}

	.alerts h3,
	.recommendations h3 {
		@apply mb-3 text-sm font-semibold text-gray-900;
	}

	.dark .alerts h3,
	.dark .recommendations h3 {
		@apply text-white;
	}

	.alert-item {
		@apply mb-2 rounded-lg border-l-4 p-3;
	}

	.alert-item.critical {
		@apply border-red-500 bg-red-50;
	}

	.alert-item.warning {
		@apply border-yellow-500 bg-yellow-50;
	}

	.alert-item.info {
		@apply border-blue-500 bg-blue-50;
	}

	.dark .alert-item.critical {
		@apply border-red-400 bg-red-900;
	}

	.dark .alert-item.warning {
		@apply border-yellow-400 bg-yellow-900;
	}

	.dark .alert-item.info {
		@apply border-blue-400 bg-blue-900;
	}

	.alert-title {
		@apply mb-1 text-sm font-medium;
	}

	.alert-description {
		@apply text-xs text-gray-600;
	}

	.dark .alert-description {
		@apply text-gray-300;
	}

	.recommendation-item {
		@apply mb-2 rounded-lg border-l-4 p-3;
	}

	.recommendation-item.high {
		@apply border-orange-500 bg-orange-50;
	}

	.recommendation-item.medium {
		@apply border-blue-500 bg-blue-50;
	}

	.recommendation-item.low {
		@apply border-gray-500 bg-gray-50;
	}

	.dark .recommendation-item.high {
		@apply border-orange-400 bg-orange-900;
	}

	.dark .recommendation-item.medium {
		@apply border-blue-400 bg-blue-900;
	}

	.dark .recommendation-item.low {
		@apply border-gray-400 bg-gray-700;
	}

	.recommendation-title {
		@apply mb-1 text-sm font-medium;
	}

	.recommendation-description {
		@apply mb-1 text-xs text-gray-600;
	}

	.dark .recommendation-description {
		@apply text-gray-300;
	}

	.recommendation-impact {
		@apply text-xs text-gray-500 italic;
	}

	.dark .recommendation-impact {
		@apply text-gray-400;
	}

	.expanded .dashboard-content {
		@apply max-h-none;
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.metrics-grid {
			@apply grid-cols-2;
		}

		.detailed-metrics {
			@apply grid-cols-1;
		}

		.alerts-section {
			@apply grid-cols-1;
		}
	}
</style>
