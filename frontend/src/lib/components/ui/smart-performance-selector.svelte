<script lang="ts">
	import { onMount } from 'svelte';
	import { 
		detectCPUCapabilities, 
		generatePerformanceRecommendations, 
		getDefaultRecommendation,
		type CPUCapabilities,
		type PerformanceRecommendation 
	} from '$lib/utils/cpu-detection';
	import { Loader2, Cpu, Battery, Zap, Rocket, AlertTriangle, CheckCircle, Info } from 'lucide-svelte';

	interface Props {
		onSelect: (threadCount: number, mode: string) => void;
		isInitializing?: boolean;
		disabled?: boolean;
	}
	
	let { onSelect, isInitializing = false, disabled = false }: Props = $props();
	
	let capabilities = $state<CPUCapabilities | null>(null);
	let recommendations = $state<PerformanceRecommendation[]>([]);
	let selectedMode = $state<string>('balanced');
	let defaultRecommendation = $state<PerformanceRecommendation | null>(null);
	let showAdvanced = $state(false);
	let customThreadCount = $state(4);
	let isDetecting = $state(true);
	let detectionError = $state<string | null>(null);
	
	// Icons for different modes
	const modeIcons = {
		battery: Battery,
		balanced: Zap,
		performance: Rocket,
		extreme: Cpu
	};
	
	// Mode colors
	const modeColors = {
		battery: 'text-green-600 border-green-300 bg-green-50 dark:bg-green-950',
		balanced: 'text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-950',
		performance: 'text-orange-600 border-orange-300 bg-orange-50 dark:bg-orange-950',
		extreme: 'text-red-600 border-red-300 bg-red-50 dark:bg-red-950'
	};
	
	onMount(async () => {
		try {
			console.log('Detecting CPU capabilities...');
			capabilities = await detectCPUCapabilities();
			console.log('CPU capabilities detected:', capabilities);
			
			recommendations = generatePerformanceRecommendations(capabilities);
			defaultRecommendation = getDefaultRecommendation(capabilities);
			selectedMode = defaultRecommendation.mode;
			customThreadCount = capabilities.recommendedThreads;
			
			console.log('Performance recommendations:', recommendations);
			console.log('Default recommendation:', defaultRecommendation);
			
		} catch (error) {
			console.error('Failed to detect CPU capabilities:', error);
			detectionError = error instanceof Error ? error.message : 'Unknown error';
			
			// Fallback to basic recommendations
			const cores = navigator.hardwareConcurrency || 4;
			recommendations = [
				{
					mode: 'battery',
					threadCount: 1,
					reasoning: ['Minimal CPU usage'],
					warnings: [],
					estimatedProcessingTime: '3-5 seconds',
					cpuUsageEstimate: 25
				},
				{
					mode: 'balanced',
					threadCount: Math.max(1, cores - 2),
					reasoning: ['Balanced performance'],
					warnings: [],
					estimatedProcessingTime: '2-3 seconds',
					cpuUsageEstimate: 60
				},
				{
					mode: 'performance',
					threadCount: cores,
					reasoning: ['Maximum speed'],
					warnings: ['High CPU usage'],
					estimatedProcessingTime: '1-2 seconds',
					cpuUsageEstimate: 85
				}
			];
			selectedMode = 'balanced';
		} finally {
			isDetecting = false;
		}
	});
	
	function handleModeSelect(mode: string) {
		selectedMode = mode;
		const recommendation = recommendations.find(r => r.mode === mode);
		if (recommendation) {
			console.log(`Selected ${mode} mode with ${recommendation.threadCount} threads`);
		}
	}
	
	function handleInitialize() {
		const recommendation = recommendations.find(r => r.mode === selectedMode);
		if (recommendation) {
			onSelect(recommendation.threadCount, selectedMode);
		} else if (selectedMode === 'custom') {
			onSelect(customThreadCount, 'custom');
		}
	}
	
	function getSelectedRecommendation(): PerformanceRecommendation | null {
		return recommendations.find(r => r.mode === selectedMode) || null;
	}
</script>

<div class="space-y-4">
	{#if isDetecting}
		<div class="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
			<Loader2 class="w-5 h-5 animate-spin text-blue-600" />
			<div>
				<div class="font-medium text-blue-900 dark:text-blue-100">Analyzing Your System</div>
				<div class="text-sm text-blue-700 dark:text-blue-300">
					Detecting CPU capabilities and optimizing settings...
				</div>
			</div>
		</div>
	{:else if detectionError}
		<div class="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
			<AlertTriangle class="w-5 h-5 text-yellow-600" />
			<div>
				<div class="font-medium text-yellow-900 dark:text-yellow-100">Detection Failed</div>
				<div class="text-sm text-yellow-700 dark:text-yellow-300">
					Using fallback settings. Advanced features may not be available.
				</div>
			</div>
		</div>
	{:else if capabilities}
		<!-- System Information -->
		<div class="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
			<div class="text-center">
				<div class="text-2xl font-bold text-gray-900 dark:text-gray-100">{capabilities.cores}</div>
				<div class="text-xs text-gray-600 dark:text-gray-400">CPU Cores</div>
			</div>
			<div class="text-center">
				<div class="text-lg font-bold text-gray-900 dark:text-gray-100 capitalize">{capabilities.estimatedPerformance}</div>
				<div class="text-xs text-gray-600 dark:text-gray-400">Performance</div>
			</div>
			<div class="text-center">
				<div class="text-lg font-bold text-gray-900 dark:text-gray-100 capitalize">{capabilities.deviceType}</div>
				<div class="text-xs text-gray-600 dark:text-gray-400">Device Type</div>
			</div>
			<div class="text-center">
				<div class="text-lg font-bold text-gray-900 dark:text-gray-100">{capabilities.memoryGB}GB</div>
				<div class="text-xs text-gray-600 dark:text-gray-400">Est. Memory</div>
			</div>
		</div>
		
		<!-- Smart Recommendations -->
		{#if defaultRecommendation}
			<div class="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
				<div class="flex items-center gap-2 mb-2">
					<CheckCircle class="w-4 h-4 text-green-600" />
					<div class="font-medium text-green-900 dark:text-green-100">Recommended for Your System</div>
				</div>
				<div class="text-sm text-green-700 dark:text-green-300">
					<strong class="capitalize">{defaultRecommendation.mode} mode</strong> with {defaultRecommendation.threadCount} threads
					{#if capabilities.batteryStatus === 'discharging'}
						(optimized for battery life)
					{:else if capabilities.isLowEndDevice}
						(optimized for your device)
					{:else}
						(best balance for your hardware)
					{/if}
				</div>
			</div>
		{/if}
		
		<!-- Performance Mode Selection -->
		<div class="grid grid-cols-1 md:grid-cols-{recommendations.length} gap-3">
			{#each recommendations as recommendation}
				{@const IconComponent = modeIcons[recommendation.mode] || Cpu}
				{@const isSelected = selectedMode === recommendation.mode}
				{@const isRecommended = recommendation.mode === defaultRecommendation?.mode}
				
				<button
					class="relative p-4 rounded-lg border-2 transition-all text-left
						{isSelected ? modeColors[recommendation.mode] : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'}"
					onclick={() => handleModeSelect(recommendation.mode)}
					disabled={disabled || isInitializing}
				>
					{#if isRecommended}
						<div class="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
							<CheckCircle class="w-3 h-3 text-white" />
						</div>
					{/if}
					
					<div class="flex items-center gap-3 mb-2">
						<IconComponent class="w-6 h-6" />
						<div class="font-medium capitalize">{recommendation.mode}</div>
					</div>
					
					<div class="space-y-1 text-sm">
						<div class="font-medium">{recommendation.threadCount} threads</div>
						<div class="text-opacity-80">~{recommendation.estimatedProcessingTime}</div>
						<div class="text-opacity-70">{recommendation.cpuUsageEstimate}% CPU</div>
					</div>
					
					<!-- Reasoning -->
					<div class="mt-3 space-y-1">
						{#each recommendation.reasoning.slice(0, 2) as reason}
							<div class="text-xs opacity-75">• {reason}</div>
						{/each}
					</div>
					
					<!-- Warnings -->
					{#if recommendation.warnings.length > 0}
						<div class="mt-2 flex items-center gap-1">
							<AlertTriangle class="w-3 h-3 text-yellow-500" />
							<div class="text-xs text-yellow-600 dark:text-yellow-400">
								{recommendation.warnings[0]}
							</div>
						</div>
					{/if}
				</button>
			{/each}
		</div>
		
		<!-- Advanced Settings -->
		{#if showAdvanced}
			<div class="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium mb-2">
							Custom thread count: {customThreadCount}
						</label>
						<input
							type="range"
							min="1"
							max={capabilities.maxSafeThreads}
							bind:value={customThreadCount}
							onchange={() => selectedMode = 'custom'}
							disabled={disabled || isInitializing}
							class="w-full"
						/>
						<div class="flex justify-between text-xs text-gray-500 mt-1">
							<span>1 (minimal)</span>
							<span>{capabilities.recommendedThreads} (recommended)</span>
							<span>{capabilities.maxSafeThreads} (maximum safe)</span>
						</div>
					</div>
					
					<!-- Feature Support -->
					<div class="grid grid-cols-2 gap-2 text-xs">
						<div class="flex items-center gap-2">
							{#if capabilities.features.threading}
								<CheckCircle class="w-3 h-3 text-green-500" />
								<span>Multi-threading supported</span>
							{:else}
								<AlertTriangle class="w-3 h-3 text-yellow-500" />
								<span>Single-threaded only</span>
							{/if}
						</div>
						<div class="flex items-center gap-2">
							{#if capabilities.features.simd}
								<CheckCircle class="w-3 h-3 text-green-500" />
								<span>SIMD acceleration</span>
							{:else}
								<AlertTriangle class="w-3 h-3 text-gray-400" />
								<span>Basic processing</span>
							{/if}
						</div>
						{#if capabilities.batteryStatus !== 'unknown'}
							<div class="flex items-center gap-2">
								<Battery class="w-3 h-3" />
								<span class="capitalize">{capabilities.batteryStatus}</span>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}
		
		<!-- Current Selection Summary -->
		{@const selectedRec = getSelectedRecommendation()}
		{#if selectedRec}
			<div class="p-3 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800">
				<div class="text-sm">
					<div class="font-medium text-blue-900 dark:text-blue-100 mb-1">
						Selected: <span class="capitalize">{selectedRec.mode}</span> mode with {selectedRec.threadCount} threads
					</div>
					<div class="text-blue-700 dark:text-blue-300">
						Expected: {selectedRec.estimatedProcessingTime} processing time, {selectedRec.cpuUsageEstimate}% CPU usage
					</div>
					{#if selectedRec.warnings.length > 0}
						<div class="text-yellow-600 dark:text-yellow-400 mt-1">
							⚠️ {selectedRec.warnings.join(', ')}
						</div>
					{/if}
				</div>
			</div>
		{/if}
		
		<!-- Action Buttons -->
		<div class="flex gap-2">
			<button
				class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded font-medium transition-colors flex items-center justify-center gap-2"
				onclick={handleInitialize}
				disabled={disabled || isInitializing}
			>
				{#if isInitializing}
					<Loader2 class="w-4 h-4 animate-spin" />
					Initializing...
				{:else}
					Initialize Converter
				{/if}
			</button>
			
			<button
				class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
				onclick={() => showAdvanced = !showAdvanced}
				disabled={disabled || isInitializing}
			>
				{showAdvanced ? 'Hide' : 'Advanced'}
			</button>
		</div>
	{/if}
</div>