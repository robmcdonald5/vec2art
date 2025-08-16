<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Button from '$lib/components/ui/button.svelte';
	import { 
		Zap, 
		Battery, 
		Gauge, 
		Settings2, 
		AlertTriangle, 
		CheckCircle,
		Cpu,
		Activity,
		Info
	} from 'lucide-svelte';
	import type { PerformanceMode } from '$lib/utils/performance-monitor';
	import { performanceMonitor, getOptimalThreadCount, isLowEndDevice } from '$lib/utils/performance-monitor';

	interface Props {
		currentMode: PerformanceMode;
		currentThreadCount?: number;
		isProcessing?: boolean;
		onModeChange: (mode: PerformanceMode, threadCount: number) => void;
		onAdvancedSettingsToggle?: (show: boolean) => void;
	}

	let { 
		currentMode = $bindable(),
		currentThreadCount = 0,
		isProcessing = false,
		onModeChange,
		onAdvancedSettingsToggle
	}: Props = $props();

	// State
	let customThreadCount = $state(4);
	let showAdvanced = $state(false);
	let systemCapabilities = $state(performanceMonitor.getSystemCapabilities());
	let currentMetrics = $state(performanceMonitor.getCurrentMetrics());
	let monitoringInterval: ReturnType<typeof setInterval> | undefined;
	let isStressed = $state(false);

	// Load saved preferences
	onMount(() => {
		const savedMode = localStorage.getItem('vec2art-performance-mode') as PerformanceMode;
		const savedThreadCount = localStorage.getItem('vec2art-custom-threads');
		
		if (savedMode && ['economy', 'balanced', 'performance', 'custom'].includes(savedMode)) {
			currentMode = savedMode;
		} else {
			// Auto-detect recommended mode for new users
			currentMode = performanceMonitor.getRecommendedPerformanceMode();
		}
		
		if (savedThreadCount) {
			customThreadCount = parseInt(savedThreadCount, 10) || 4;
		} else {
			customThreadCount = getOptimalThreadCount('balanced');
		}

		// Start performance monitoring
		performanceMonitor.startMonitoring();
		
		// Update metrics periodically
		monitoringInterval = setInterval(() => {
			currentMetrics = performanceMonitor.getCurrentMetrics();
			isStressed = performanceMonitor.isSystemStressed();
		}, 1000);

		// Apply initial mode
		handleModeChange(currentMode);
	});

	onDestroy(() => {
		performanceMonitor.stopMonitoring();
		if (monitoringInterval) {
			clearInterval(monitoringInterval);
		}
	});

	// Performance mode configurations
	const modeConfigs = {
		economy: {
			label: 'Economy',
			icon: Battery,
			description: 'Minimal CPU usage, slower processing',
			color: 'text-green-600 dark:text-green-400',
			bgColor: 'bg-green-50 dark:bg-green-950',
			borderColor: 'border-green-200 dark:border-green-800'
		},
		balanced: {
			label: 'Balanced',
			icon: Gauge,
			description: 'Good balance of speed and system responsiveness',
			color: 'text-blue-600 dark:text-blue-400',
			bgColor: 'bg-blue-50 dark:bg-blue-950',
			borderColor: 'border-blue-200 dark:border-blue-800'
		},
		performance: {
			label: 'Performance',
			icon: Zap,
			description: 'Maximum speed, may slow down browser',
			color: 'text-orange-600 dark:text-orange-400',
			bgColor: 'bg-orange-50 dark:bg-orange-950',
			borderColor: 'border-orange-200 dark:border-orange-800'
		},
		custom: {
			label: 'Custom',
			icon: Settings2,
			description: 'Manual thread count control',
			color: 'text-purple-600 dark:text-purple-400',
			bgColor: 'bg-purple-50 dark:bg-purple-950',
			borderColor: 'border-purple-200 dark:border-purple-800'
		}
	};

	function handleModeChange(mode: PerformanceMode) {
		currentMode = mode;
		let threadCount: number;

		if (mode === 'custom') {
			threadCount = customThreadCount;
		} else {
			threadCount = getOptimalThreadCount(mode);
		}

		// Save preferences
		localStorage.setItem('vec2art-performance-mode', mode);
		if (mode === 'custom') {
			localStorage.setItem('vec2art-custom-threads', threadCount.toString());
		}

		onModeChange(mode, threadCount);
	}

	function handleCustomThreadChange() {
		if (currentMode === 'custom') {
			localStorage.setItem('vec2art-custom-threads', customThreadCount.toString());
			onModeChange('custom', customThreadCount);
		}
	}

	function toggleAdvanced() {
		showAdvanced = !showAdvanced;
		onAdvancedSettingsToggle?.(showAdvanced);
	}

	// Reactive computed values
	const recommendedMode = $derived(performanceMonitor.getRecommendedPerformanceMode());
	const optimalThreads = $derived({
		economy: getOptimalThreadCount('economy'),
		balanced: getOptimalThreadCount('balanced'),
		performance: getOptimalThreadCount('performance'),
		custom: customThreadCount
	});
	const currentConfig = $derived(modeConfigs[currentMode]);
	const shouldShowWarning = $derived(
		currentMode === 'performance' && (systemCapabilities.cores <= 4 || isStressed)
	);
	const showRecommendation = $derived(
		currentMode !== recommendedMode && !isProcessing
	);
</script>

<div class="space-y-4">
	<!-- Performance Mode Selector -->
	<div class="space-y-3">
		<div class="flex items-center justify-between">
			<h3 class="text-sm font-medium text-gray-900 dark:text-gray-100">
				Performance Mode
			</h3>
			<Button
				variant="ghost"
				size="sm"
				onclick={toggleAdvanced}
				class="h-6 px-2 text-xs"
				disabled={isProcessing}
			>
				<Settings2 class="mr-1 h-3 w-3" />
				{showAdvanced ? 'Hide' : 'Show'} Details
			</Button>
		</div>

		<!-- Mode Buttons -->
		<div class="grid grid-cols-2 gap-2">
			{#each Object.entries(modeConfigs) as [mode, config]}
				{@const isSelected = currentMode === mode}
				{@const Icon = config.icon}
				{@const threadCount = optimalThreads[mode as PerformanceMode]}
				
				<button
					type="button"
					onclick={() => handleModeChange(mode as PerformanceMode)}
					disabled={isProcessing}
					class="relative flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-all hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed {isSelected 
						? `${config.bgColor} ${config.borderColor} ${config.color} ring-2 ring-current ring-opacity-20` 
						: 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600'}"
				>
					<Icon class="h-4 w-4" />
					<span class="text-xs font-medium">{config.label}</span>
					<span class="text-xs opacity-75">{threadCount} threads</span>
					
					{#if mode === 'performance' && systemCapabilities.cores <= 4}
						<AlertTriangle class="absolute -top-1 -right-1 h-3 w-3 text-yellow-500" />
					{/if}
				</button>
			{/each}
		</div>

		<!-- Custom Thread Count Slider -->
		{#if currentMode === 'custom'}
			<div class="space-y-2">
				<label for="thread-count" class="text-xs text-gray-600 dark:text-gray-400">
					Thread Count: {customThreadCount}
				</label>
				<input
					id="thread-count"
					type="range"
					min="1"
					max={systemCapabilities.cores}
					bind:value={customThreadCount}
					onchange={handleCustomThreadChange}
					disabled={isProcessing}
					class="w-full accent-purple-600"
				/>
				<div class="flex justify-between text-xs text-gray-500 dark:text-gray-400">
					<span>1</span>
					<span>{systemCapabilities.cores} (max)</span>
				</div>
			</div>
		{/if}

		<!-- Performance Warning -->
		{#if shouldShowWarning}
			<div class="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950">
				<AlertTriangle class="mt-0.5 h-4 w-4 text-yellow-600 dark:text-yellow-400" />
				<div class="flex-1 text-xs text-yellow-700 dark:text-yellow-300">
					<p class="font-medium">Performance mode may impact browser responsiveness</p>
					<p class="mt-1">Consider using "Balanced" mode for better stability.</p>
				</div>
			</div>
		{/if}

		<!-- Recommendation -->
		{#if showRecommendation}
			<div class="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
				<Info class="mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-400" />
				<div class="flex-1 text-xs text-blue-700 dark:text-blue-300">
					<p>
						<strong>Recommended:</strong> {modeConfigs[recommendedMode].label} mode 
						for your system
					</p>
					<Button
						variant="ghost"
						size="sm"
						onclick={() => handleModeChange(recommendedMode)}
						class="mt-1 h-5 px-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
					>
						Switch to {modeConfigs[recommendedMode].label}
					</Button>
				</div>
			</div>
		{/if}
	</div>

	<!-- Advanced Details -->
	{#if showAdvanced}
		<div class="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
			<h4 class="text-xs font-medium text-gray-900 dark:text-gray-100">
				System Information
			</h4>
			
			<!-- System Capabilities -->
			<div class="grid grid-cols-2 gap-3 text-xs">
				<div class="space-y-1">
					<div class="flex items-center gap-1">
						<Cpu class="h-3 w-3" />
						<span class="text-gray-600 dark:text-gray-400">CPU Cores:</span>
						<span class="font-medium">{systemCapabilities.cores}</span>
					</div>
					<div class="flex items-center gap-1">
						<span class="h-3 w-3 flex items-center justify-center text-gray-600 dark:text-gray-400">📱</span>
						<span class="text-gray-600 dark:text-gray-400">Device:</span>
						<span class="font-medium capitalize">{systemCapabilities.deviceType}</span>
					</div>
				</div>
				
				<div class="space-y-1">
					<div class="flex items-center gap-1">
						<Activity class="h-3 w-3" />
						<span class="text-gray-600 dark:text-gray-400">Frame Rate:</span>
						<span class="font-medium {currentMetrics.frameRate < 30 ? 'text-red-500' : 'text-green-500'}">
							{Math.round(currentMetrics.frameRate)} FPS
						</span>
					</div>
					<div class="flex items-center gap-1">
						<span class="h-3 w-3 flex items-center justify-center text-gray-600 dark:text-gray-400">💾</span>
						<span class="text-gray-600 dark:text-gray-400">Memory:</span>
						<span class="font-medium capitalize">{systemCapabilities.memoryEstimate}</span>
					</div>
				</div>
			</div>

			<!-- Current Status -->
			<div class="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
				{#if isStressed}
					<AlertTriangle class="h-3 w-3 text-yellow-500" />
					<span class="text-xs text-yellow-700 dark:text-yellow-300">
						System under stress - consider reducing thread count
					</span>
				{:else}
					<CheckCircle class="h-3 w-3 text-green-500" />
					<span class="text-xs text-green-700 dark:text-green-300">
						System performing well
					</span>
				{/if}
			</div>

			<!-- Thread Count Information -->
			<div class="pt-2 border-t border-gray-200 dark:border-gray-600">
				<p class="text-xs text-gray-600 dark:text-gray-400 mb-2">
					Current Configuration:
				</p>
				<div class="flex items-center justify-between text-xs">
					<span class="text-gray-700 dark:text-gray-300">
						Active Threads: 
						<span class="font-medium {currentConfig.color}">
							{currentThreadCount || optimalThreads[currentMode]}
						</span>
					</span>
					<span class="text-gray-700 dark:text-gray-300">
						Free Cores: 
						<span class="font-medium">
							{systemCapabilities.cores - (currentThreadCount || optimalThreads[currentMode])}
						</span>
					</span>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	/* Custom range slider styling */
	input[type="range"] {
		-webkit-appearance: none;
		appearance: none;
		background: transparent;
		cursor: pointer;
		height: 20px;
	}

	input[type="range"]::-webkit-slider-track {
		background: rgb(209 213 219);
		height: 4px;
		border-radius: 2px;
	}

	input[type="range"]::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		background: rgb(147 51 234);
		height: 16px;
		width: 16px;
		border-radius: 50%;
		margin-top: -6px;
	}

	input[type="range"]::-moz-range-track {
		background: rgb(209 213 219);
		height: 4px;
		border-radius: 2px;
		border: none;
	}

	input[type="range"]::-moz-range-thumb {
		background: rgb(147 51 234);
		height: 16px;
		width: 16px;
		border-radius: 50%;
		border: none;
		cursor: pointer;
	}

	:global(.dark) input[type="range"]::-webkit-slider-track {
		background: rgb(75 85 99);
	}

	:global(.dark) input[type="range"]::-moz-range-track {
		background: rgb(75 85 99);
	}
</style>