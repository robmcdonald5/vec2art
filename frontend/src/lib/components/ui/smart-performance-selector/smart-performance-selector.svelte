<script lang="ts">
	import { onMount, tick } from 'svelte';
	import {
		detectCPUCapabilities,
		generatePerformanceRecommendations,
		getDefaultRecommendation,
		type CPUCapabilities,
		type PerformanceRecommendation
	} from '$lib/utils/cpu-detection';
	import { Loader2, Cpu, Battery, Zap, Rocket, AlertTriangle, CheckCircle } from 'lucide-svelte';

	interface Props {
		onSelect: (_threadCount: number, _mode: string) => void;
		isInitializing?: boolean;
		disabled?: boolean;
	}

	let { onSelect, isInitializing = false, disabled = false }: Props = $props();

	let capabilities = $state<CPUCapabilities | null>(null);
	let recommendations = $state<PerformanceRecommendation[]>([]);
	let selectedMode = $state<'battery' | 'balanced' | 'performance' | 'extreme' | 'custom'>(
		'balanced'
	);
	let defaultRecommendation = $state<PerformanceRecommendation | null>(null);
	let showAdvanced = $state(false);
	let customThreadCount = $state(4);
	let isDetecting = $state(true);
	let detectionError = $state<string | null>(null);

	// Accessibility state
	let announceText = $state<string>('');
	let selectorElement: HTMLElement;

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

	// Mode descriptions for screen readers
	const modeDescriptions = {
		battery: 'Minimal CPU usage, best for battery life, processing time 3-5 seconds',
		balanced: 'Balanced performance and efficiency, processing time 2-3 seconds',
		performance: 'High performance mode, faster processing, 1-2 seconds',
		extreme: 'Maximum performance, highest CPU usage, under 1 second'
	};

	// Accessibility functions
	function announceToScreenReader(message: string) {
		announceText = message;
		// Clear after announcement
		setTimeout(() => {
			announceText = '';
		}, 1000);
	}

	function handleKeyboardNavigation(
		event: KeyboardEvent,
		_mode: 'battery' | 'balanced' | 'performance' | 'extreme' | 'custom'
	) {
		switch (event.key) {
			case 'ArrowLeft':
			case 'ArrowUp':
				event.preventDefault();
				navigateToMode('previous');
				break;
			case 'ArrowRight':
			case 'ArrowDown':
				event.preventDefault();
				navigateToMode('next');
				break;
			case 'Home':
				event.preventDefault();
				navigateToMode('first');
				break;
			case 'End':
				event.preventDefault();
				navigateToMode('last');
				break;
		}
	}

	function navigateToMode(direction: 'previous' | 'next' | 'first' | 'last') {
		const modes = recommendations.map((r) => r.mode);
		// Handle 'custom' mode by treating it as not in the recommendations
		const currentIndex = selectedMode === 'custom' ? -1 : modes.indexOf(selectedMode);
		let newIndex: number;

		switch (direction) {
			case 'previous':
				newIndex = currentIndex > 0 ? currentIndex - 1 : modes.length - 1;
				break;
			case 'next':
				newIndex = currentIndex < modes.length - 1 ? currentIndex + 1 : 0;
				break;
			case 'first':
				newIndex = 0;
				break;
			case 'last':
				newIndex = modes.length - 1;
				break;
		}

		const newMode = modes[newIndex];
		if (newMode) {
			handleModeSelect(newMode);

			// Focus the selected button
			tick().then(() => {
				const button = selectorElement?.querySelector(
					`[data-mode="${newMode}"]`
				) as HTMLButtonElement;
				button?.focus();
			});
		}
	}

	onMount(async () => {
		try {
			announceToScreenReader('Analyzing system capabilities');
			console.log('Detecting CPU capabilities...');
			capabilities = await detectCPUCapabilities();
			console.log('CPU capabilities detected:', capabilities);

			recommendations = generatePerformanceRecommendations(capabilities);
			defaultRecommendation = getDefaultRecommendation(capabilities);
			selectedMode = defaultRecommendation.mode;
			customThreadCount = capabilities.recommendedThreads;

			console.log('Performance recommendations:', recommendations);
			console.log('Default recommendation:', defaultRecommendation);

			announceToScreenReader(
				`System analysis complete. Recommended mode: ${defaultRecommendation.mode} with ${defaultRecommendation.threadCount} threads`
			);
		} catch (error) {
			console.error('Failed to detect CPU capabilities:', error);
			detectionError = error instanceof Error ? error.message : 'Unknown error';
			announceToScreenReader('System detection failed, using fallback settings');

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
					threadCount: Math.floor(cores * 0.5),
					reasoning: [`Balanced performance, uses ${Math.floor(cores * 0.5)}/${cores} cores`],
					warnings: [],
					estimatedProcessingTime: '2-3 seconds',
					cpuUsageEstimate: 60
				},
				{
					mode: 'performance',
					threadCount: Math.max(1, cores - 1),
					reasoning: [`High performance, uses ${Math.max(1, cores - 1)}/${cores} cores`],
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

	function handleModeSelect(mode: 'battery' | 'balanced' | 'performance' | 'extreme' | 'custom') {
		selectedMode = mode;
		const recommendation = recommendations.find((r) => r.mode === mode);
		if (recommendation) {
			console.log(`Selected ${mode} mode with ${recommendation.threadCount} threads`);
			announceToScreenReader(
				`Selected ${mode} mode with ${recommendation.threadCount} threads, estimated processing time ${recommendation.estimatedProcessingTime}`
			);
		}
	}

	function handleInitialize() {
		const recommendation = recommendations.find((r) => r.mode === selectedMode);
		if (recommendation) {
			announceToScreenReader(
				`Initializing converter with ${recommendation.threadCount} threads in ${selectedMode} mode`
			);
			onSelect(recommendation.threadCount, selectedMode);
		} else if (selectedMode === 'custom') {
			announceToScreenReader(`Initializing converter with ${customThreadCount} custom threads`);
			onSelect(customThreadCount, 'custom');
		}
	}

	const selectedRecommendation = $derived(
		recommendations.find((r) => r.mode === selectedMode) || null
	);
</script>

<div class="space-y-4" bind:this={selectorElement}>
	<!-- Live region for announcements -->
	<div aria-live="polite" aria-atomic="true" class="sr-only">
		{announceText}
	</div>

	{#if isDetecting}
		<div
			class="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950"
			role="status"
			aria-label="System analysis in progress"
		>
			<Loader2 class="h-5 w-5 animate-spin text-blue-600" aria-hidden="true" />
			<div>
				<div class="font-medium text-blue-900 dark:text-blue-100">Analyzing Your System</div>
				<div class="text-sm text-blue-700 dark:text-blue-300">
					Detecting CPU capabilities and optimizing settings...
				</div>
			</div>
		</div>
	{:else if detectionError}
		<div
			class="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950"
			role="alert"
			aria-labelledby="detection-error-title"
			aria-describedby="detection-error-desc"
		>
			<AlertTriangle class="h-5 w-5 text-yellow-600" aria-hidden="true" />
			<div>
				<div id="detection-error-title" class="font-medium text-yellow-900 dark:text-yellow-100">
					Detection Failed
				</div>
				<div id="detection-error-desc" class="text-sm text-yellow-700 dark:text-yellow-300">
					Using fallback settings. Advanced features may not be available.
				</div>
			</div>
		</div>
	{:else if capabilities}
		<!-- System Information -->
		<section
			class="grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-4 md:grid-cols-4 dark:bg-gray-900"
			aria-labelledby="system-info-title"
		>
			<h3 id="system-info-title" class="sr-only">System Information</h3>
			<div class="text-center">
				<div
					class="text-2xl font-bold text-gray-900 dark:text-gray-100"
					aria-label="{capabilities.cores} CPU cores"
				>
					{capabilities.cores}
				</div>
				<div class="text-xs text-gray-600 dark:text-gray-400">CPU Cores</div>
			</div>
			<div class="text-center">
				<div
					class="text-lg font-bold text-gray-900 capitalize dark:text-gray-100"
					aria-label="Performance level: {capabilities.estimatedPerformance}"
				>
					{capabilities.estimatedPerformance}
				</div>
				<div class="text-xs text-gray-600 dark:text-gray-400">Performance</div>
			</div>
			<div class="text-center">
				<div
					class="text-lg font-bold text-gray-900 capitalize dark:text-gray-100"
					aria-label="Device type: {capabilities.deviceType}"
				>
					{capabilities.deviceType}
				</div>
				<div class="text-xs text-gray-600 dark:text-gray-400">Device Type</div>
			</div>
			<div class="text-center">
				<div
					class="text-lg font-bold text-gray-900 dark:text-gray-100"
					aria-label="Estimated memory: {capabilities.memoryGB} gigabytes"
				>
					{capabilities.memoryGB}GB
				</div>
				<div class="text-xs text-gray-600 dark:text-gray-400">Est. Memory</div>
			</div>
		</section>

		<!-- Smart Recommendations -->
		{#if defaultRecommendation}
			<section
				class="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950"
				aria-labelledby="recommendation-title"
				aria-describedby="recommendation-desc"
			>
				<div class="mb-2 flex items-center gap-2">
					<CheckCircle class="h-4 w-4 text-green-600" aria-hidden="true" />
					<div id="recommendation-title" class="font-medium text-green-900 dark:text-green-100">
						Recommended for Your System
					</div>
				</div>
				<div id="recommendation-desc" class="text-sm text-green-700 dark:text-green-300">
					<strong class="capitalize">{defaultRecommendation.mode} mode</strong> with {defaultRecommendation.threadCount}
					threads
					{#if capabilities.batteryStatus === 'discharging'}
						(optimized for battery life)
					{:else if capabilities.isLowEndDevice}
						(optimized for your device)
					{:else}
						(best balance for your hardware)
					{/if}
				</div>
			</section>
		{/if}

		<!-- Performance Mode Selection -->
		<fieldset class="grid grid-cols-1 md:grid-cols-{recommendations.length} gap-3">
			<legend class="sr-only">Performance Mode Selection</legend>
			{#each recommendations as recommendation (recommendation.mode)}
				{@const IconComponent = modeIcons[recommendation.mode] || Cpu}
				{@const isSelected = selectedMode === recommendation.mode}
				{@const isRecommended = recommendation.mode === defaultRecommendation?.mode}

				<button
					class="relative rounded-lg border-2 p-4 text-left transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none
						{isSelected
						? modeColors[recommendation.mode]
						: 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'}"
					onclick={() => handleModeSelect(recommendation.mode)}
					onkeydown={(e) => handleKeyboardNavigation(e, recommendation.mode)}
					disabled={disabled || isInitializing}
					aria-checked={isSelected}
					aria-describedby="mode-{recommendation.mode}-desc"
					data-mode={recommendation.mode}
					role="radio"
					tabindex={isSelected ? 0 : -1}
				>
					{#if isRecommended}
						<div
							class="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-500"
							aria-label="Recommended"
						>
							<CheckCircle class="h-3 w-3 text-white" aria-hidden="true" />
						</div>
					{/if}

					<div class="mb-2 flex items-center gap-3">
						<IconComponent class="h-6 w-6" aria-hidden="true" />
						<div class="font-medium capitalize">{recommendation.mode}</div>
					</div>

					<div class="space-y-1 text-sm">
						<div class="font-medium">{recommendation.threadCount} threads</div>
						<div class="text-opacity-80">~{recommendation.estimatedProcessingTime}</div>
						<div class="text-opacity-70">{recommendation.cpuUsageEstimate}% CPU</div>
					</div>

					<!-- Reasoning -->
					<div class="mt-3 space-y-1">
						{#each recommendation.reasoning.slice(0, 2) as reason, index (index)}
							<div class="text-xs opacity-75">• {reason}</div>
						{/each}
					</div>

					<!-- Warnings -->
					{#if recommendation.warnings.length > 0}
						<div class="mt-2 flex items-center gap-1">
							<AlertTriangle class="h-3 w-3 text-yellow-500" aria-hidden="true" />
							<div class="text-xs text-yellow-600 dark:text-yellow-400">
								{recommendation.warnings[0]}
							</div>
						</div>
					{/if}

					<!-- Screen reader description -->
					<div id="mode-{recommendation.mode}-desc" class="sr-only">
						{modeDescriptions[recommendation.mode] || ''}
						{#if recommendation.warnings.length > 0}
							Warning: {recommendation.warnings.join(', ')}
						{/if}
						{#if isRecommended}
							This is the recommended setting for your system.
						{/if}
					</div>
				</button>
			{/each}
		</fieldset>

		<!-- Advanced Settings -->
		{#if showAdvanced}
			<section
				class="rounded-lg border bg-gray-50 p-4 dark:bg-gray-900"
				aria-labelledby="advanced-settings-title"
			>
				<h3 id="advanced-settings-title" class="sr-only">Advanced Settings</h3>
				<div class="space-y-4">
					<div>
						<label for="custom-thread-count" class="mb-2 block text-sm font-medium">
							Custom thread count: {customThreadCount}
						</label>
						<input
							id="custom-thread-count"
							type="range"
							min="1"
							max={capabilities.maxSafeThreads}
							bind:value={customThreadCount}
							onchange={() => (selectedMode = 'custom')}
							oninput={() => announceToScreenReader(`Thread count set to ${customThreadCount}`)}
							disabled={disabled || isInitializing}
							class="w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
							aria-describedby="thread-count-desc"
						/>
						<div id="thread-count-desc" class="mt-1 flex justify-between text-xs text-gray-500">
							<span>1 (minimal)</span>
							<span>{capabilities.recommendedThreads} (recommended)</span>
							<span>{capabilities.maxSafeThreads} (maximum safe)</span>
						</div>
					</div>

					<!-- Feature Support -->
					<div
						class="grid grid-cols-2 gap-2 text-xs"
						role="list"
						aria-label="System feature support"
					>
						<div class="flex items-center gap-2" role="listitem">
							{#if capabilities.features.threading}
								<CheckCircle class="h-3 w-3 text-green-500" aria-hidden="true" />
								<span>Multi-threading supported</span>
							{:else}
								<AlertTriangle class="h-3 w-3 text-yellow-500" aria-hidden="true" />
								<span>Single-threaded only</span>
							{/if}
						</div>
						<div class="flex items-center gap-2" role="listitem">
							{#if capabilities.features.simd}
								<CheckCircle class="h-3 w-3 text-green-500" aria-hidden="true" />
								<span>SIMD acceleration</span>
							{:else}
								<AlertTriangle class="h-3 w-3 text-gray-400" aria-hidden="true" />
								<span>Basic processing</span>
							{/if}
						</div>
						{#if capabilities.batteryStatus !== 'unknown'}
							<div class="flex items-center gap-2" role="listitem">
								<Battery class="h-3 w-3" aria-hidden="true" />
								<span class="capitalize">Battery: {capabilities.batteryStatus}</span>
							</div>
						{/if}
					</div>
				</div>
			</section>
		{/if}

		<!-- Current Selection Summary -->
		{#if selectedRecommendation}
			{@const selectedRec = selectedRecommendation}
			<section
				class="rounded border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950"
				aria-labelledby="selection-summary-title"
				aria-describedby="selection-summary-desc"
			>
				<div class="text-sm">
					<div
						id="selection-summary-title"
						class="mb-1 font-medium text-blue-900 dark:text-blue-100"
					>
						Selected: <span class="capitalize">{selectedRec.mode}</span> mode with {selectedRec.threadCount}
						threads
					</div>
					<div id="selection-summary-desc" class="text-blue-700 dark:text-blue-300">
						Expected: {selectedRec.estimatedProcessingTime} processing time, {selectedRec.cpuUsageEstimate}%
						CPU usage
					</div>
					{#if selectedRec.warnings.length > 0}
						<div class="mt-1 text-yellow-600 dark:text-yellow-400" role="alert">
							<AlertTriangle class="mr-1 inline h-3 w-3" aria-hidden="true" />
							{selectedRec.warnings.join(', ')}
						</div>
					{/if}
				</div>
			</section>
		{/if}

		<!-- Action Buttons -->
		<div class="flex gap-2" role="group" aria-label="Performance selector actions">
			<button
				class="flex flex-1 items-center justify-center gap-2 rounded bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:bg-gray-400"
				onclick={handleInitialize}
				disabled={disabled || isInitializing}
				aria-describedby={selectedRecommendation ? 'selection-summary-title' : undefined}
			>
				{#if isInitializing}
					<Loader2 class="h-4 w-4 animate-spin" aria-hidden="true" />
					Initializing...
				{:else}
					Initialize Converter
				{/if}
			</button>

			<button
				class="rounded border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
				onclick={() => {
					showAdvanced = !showAdvanced;
					announceToScreenReader(
						showAdvanced ? 'Advanced settings shown' : 'Advanced settings hidden'
					);
				}}
				disabled={disabled || isInitializing}
				aria-expanded={showAdvanced}
				aria-controls="advanced-settings"
			>
				{showAdvanced ? 'Hide' : 'Advanced'}
			</button>
		</div>
	{/if}
</div>

<style>
	/* Screen reader only text */
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
