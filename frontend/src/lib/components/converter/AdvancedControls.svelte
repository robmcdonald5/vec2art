<script lang="ts">
	import {
		ChevronDown,
		ChevronUp,
		Settings2,
		Layers,
		Zap,
		Brush,
		Grid,
		Sparkles,
		Target
	} from 'lucide-svelte';
	import type { VectorizerConfig } from '$lib/types/vectorizer';

	interface AdvancedControlsProps {
		config: VectorizerConfig;
		onConfigChange: (updates: Partial<VectorizerConfig>) => void;
		disabled?: boolean;
		onParameterChange?: () => void;
	}

	let {
		config,
		onConfigChange,
		disabled = false,
		onParameterChange
	}: AdvancedControlsProps = $props();

	// Simple section state management
	let expandedSections = $state({
		multipass: false,
		directional: false,
		artistic: false,
		edgeDetection: false,
		centerlineAdvanced: false,
		dotsAdvanced: false,
		superpixelAdvanced: false,
		performance: false
	});

	// Simple section toggle with logging
	function toggleSection(sectionName: keyof typeof expandedSections) {
		console.log(`🟡 Advanced Controls - Toggle section: ${sectionName}`);
		expandedSections[sectionName] = !expandedSections[sectionName];
	}

	// Simple checkbox handler
	function handleCheckboxChange(configKey: keyof VectorizerConfig) {
		return (event: Event) => {
			const checkbox = event.target as HTMLInputElement;
			console.log(`🟡 Advanced Controls - Checkbox change: ${configKey} = ${checkbox.checked}`);
			onConfigChange({ [configKey]: checkbox.checked } as Partial<VectorizerConfig>);
			onParameterChange?.();
		};
	}

	// Simple range input handler
	function handleRangeChange(configKey: keyof VectorizerConfig, scale = 1) {
		return (event: Event) => {
			const input = event.target as HTMLInputElement;
			const value = parseFloat(input.value) * scale;

			// Update progressive fill
			updateSliderFill(input);

			console.log(`🟡 Advanced Controls - Range change: ${configKey} = ${value}`);
			onConfigChange({ [configKey]: value } as Partial<VectorizerConfig>);
			onParameterChange?.();
		};
	}

	// Progressive slider functionality
	function updateSliderFill(slider: HTMLInputElement) {
		const min = parseFloat(slider.min);
		const max = parseFloat(slider.max);
		const value = parseFloat(slider.value);
		const percentage = ((value - min) / (max - min)) * 100;
		slider.style.setProperty('--value', `${percentage}%`);
	}

	function initializeSliderFill(slider: HTMLInputElement) {
		updateSliderFill(slider);
		slider.addEventListener('input', () => updateSliderFill(slider));
	}
</script>

<section class="space-y-4">
	<div class="flex items-center gap-2">
		<div class="bg-ferrari-100 rounded-lg p-1.5">
			<Settings2 class="text-ferrari-600 h-4 w-4" />
		</div>
		<h3 class="text-converter-primary text-lg font-semibold">Advanced Controls</h3>
	</div>

	<p class="text-converter-secondary text-sm">
		Fine-tune processing algorithms with advanced parameters. Changes automatically switch to custom
		mode.
	</p>

	<div class="space-y-3">
		<!-- Multi-pass Processing -->
		<div class="border-ferrari-200/30 rounded-lg border bg-white">
			<button
				class="hover:bg-ferrari-50/10 flex w-full items-center justify-between rounded-lg p-4 text-left transition-colors duration-200 focus:outline-none"
				onclick={() => toggleSection('multipass')}
				{disabled}
				type="button"
			>
				<div class="flex items-center gap-2">
					<div class="bg-ferrari-100 rounded p-1">
						<Layers class="text-ferrari-600 h-4 w-4" />
					</div>
					<span class="text-converter-primary font-medium">Multi-pass Processing</span>
					{#if config.multipass}
						<span
							class="bg-ferrari-600 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white"
						>
							Active
						</span>
					{/if}
				</div>
				<div class="flex-shrink-0">
					{#if expandedSections.multipass}
						<ChevronUp class="text-ferrari-600 h-4 w-4" />
					{:else}
						<ChevronDown class="text-ferrari-600 h-4 w-4" />
					{/if}
				</div>
			</button>

			{#if expandedSections.multipass}
				<div class="border-ferrari-200/20 space-y-4 border-t p-4">
					<!-- Enable Multi-pass -->
					<div class="flex items-center space-x-3">
						<input
							type="checkbox"
							id="multipass"
							checked={config.multipass}
							onchange={handleCheckboxChange('multipass')}
							{disabled}
							class="text-ferrari-600 border-ferrari-300 focus:ring-ferrari-500 h-4 w-4 rounded"
						/>
						<label
							for="multipass"
							class="text-converter-primary cursor-pointer text-sm font-medium"
						>
							Enable Multi-pass Processing
						</label>
					</div>
					<div class="text-converter-secondary ml-7 text-xs">
						Dual-pass processing for enhanced quality. Roughly doubles processing time but
						significantly improves results.
					</div>

					<!-- Conservative Detail -->
					{#if config.multipass}
						<div class="ml-7 space-y-2">
							<div class="flex items-center justify-between">
								<label for="conservative-detail" class="text-converter-primary text-sm"
									>Conservative Detail</label
								>
								<span class="bg-ferrari-50 rounded px-2 py-1 font-mono text-xs">
									{config.conservative_detail?.toFixed(2) ?? 'Auto'}
								</span>
							</div>
							<input
								type="range"
								id="conservative-detail"
								min="0"
								max="1"
								step="0.01"
								value={config.conservative_detail ?? config.detail}
								oninput={handleRangeChange('conservative_detail')}
								{disabled}
								class="slider-ferrari w-full"
								use:initializeSliderFill
							/>
							<div class="text-converter-secondary text-xs">
								First pass threshold. Leave at auto to use main detail level.
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Directional Processing (Edge backend only) -->
		{#if config.backend === 'edge'}
			<div class="border-ferrari-200/30 rounded-lg border bg-white">
				<button
					class="hover:bg-ferrari-50/10 flex w-full items-center justify-between rounded-lg p-4 text-left transition-colors focus:outline-none"
					onclick={() => toggleSection('directional')}
					{disabled}
					type="button"
				>
					<div class="flex items-center gap-2">
						<Target class="text-ferrari-600 h-4 w-4" />
						<span class="text-converter-primary font-medium">Directional Processing</span>
						{#if config.reverse_pass || config.diagonal_pass}
							<span
								class="inline-flex items-center rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
							>
								Active
							</span>
						{/if}
					</div>
					<div class="flex-shrink-0">
						{#if expandedSections.directional}
							<ChevronUp class="text-ferrari-600 h-4 w-4" />
						{:else}
							<ChevronDown class="text-ferrari-600 h-4 w-4" />
						{/if}
					</div>
				</button>

				{#if expandedSections.directional}
					<div class="border-ferrari-200/20 space-y-4 border-t p-4">
						<!-- Reverse Pass -->
						<div class="flex items-center space-x-3">
							<input
								type="checkbox"
								id="reverse-pass"
								checked={config.reverse_pass}
								onchange={handleCheckboxChange('reverse_pass')}
								{disabled}
								class="text-ferrari-600 border-ferrari-300 focus:ring-ferrari-500 h-4 w-4 rounded"
							/>
							<label
								for="reverse-pass"
								class="text-converter-primary cursor-pointer text-sm font-medium"
							>
								Enable Reverse Pass
							</label>
						</div>
						<div class="text-converter-secondary ml-7 text-xs">
							Right-to-left, bottom-to-top processing for missed details.
						</div>

						<!-- Diagonal Pass -->
						<div class="flex items-center space-x-3">
							<input
								type="checkbox"
								id="diagonal-pass"
								checked={config.diagonal_pass}
								onchange={handleCheckboxChange('diagonal_pass')}
								{disabled}
								class="text-ferrari-600 border-ferrari-300 focus:ring-ferrari-500 h-4 w-4 rounded"
							/>
							<label
								for="diagonal-pass"
								class="text-converter-primary cursor-pointer text-sm font-medium"
							>
								Enable Diagonal Pass
							</label>
						</div>
						<div class="text-converter-secondary ml-7 text-xs">
							Diagonal direction processing for complex geometries.
						</div>

						<!-- Directional Strength Threshold -->
						{#if config.reverse_pass || config.diagonal_pass}
							<div class="ml-7 space-y-2">
								<div class="flex items-center justify-between">
									<label for="directional-threshold" class="text-converter-primary text-sm"
										>Strength Threshold</label
									>
									<span class="bg-ferrari-50 rounded px-2 py-1 font-mono text-xs">
										{config.directional_strength_threshold?.toFixed(2) ?? '0.30'}
									</span>
								</div>
								<input
									type="range"
									id="directional-threshold"
									min="0"
									max="1"
									step="0.01"
									value={config.directional_strength_threshold ?? 0.3}
									oninput={handleRangeChange('directional_strength_threshold')}
									{disabled}
									class="slider-ferrari w-full"
									use:initializeSliderFill
								/>
								<div class="text-converter-secondary text-xs">
									Skip directional passes if not beneficial (0.0 = always run, 1.0 = never run).
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Artistic Effects (Edge backend only) -->
		{#if config.backend === 'edge'}
			<div class="border-ferrari-200/30 rounded-lg border bg-white">
				<button
					class="hover:bg-ferrari-50/10 flex w-full items-center justify-between rounded-lg p-4 text-left transition-colors focus:outline-none"
					onclick={() => toggleSection('artistic')}
					{disabled}
					type="button"
				>
					<div class="flex items-center gap-2">
						<Brush class="text-ferrari-600 h-4 w-4" />
						<span class="text-converter-primary font-medium">Artistic Effects</span>
					</div>
					<div class="flex-shrink-0">
						{#if expandedSections.artistic}
							<ChevronUp class="text-ferrari-600 h-4 w-4" />
						{:else}
							<ChevronDown class="text-ferrari-600 h-4 w-4" />
						{/if}
					</div>
				</button>

				{#if expandedSections.artistic}
					<div class="border-ferrari-200/20 space-y-4 border-t p-4">
						<!-- Variable Weights -->
						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<label for="variable-weights" class="text-converter-primary text-sm"
									>Variable Line Weights</label
								>
								<span class="bg-ferrari-50 rounded px-2 py-1 font-mono text-xs">
									{config.variable_weights.toFixed(1)}
								</span>
							</div>
							<input
								type="range"
								id="variable-weights"
								min="0"
								max="1"
								step="0.1"
								value={config.variable_weights}
								oninput={handleRangeChange('variable_weights')}
								{disabled}
								class="slider-ferrari w-full"
								use:initializeSliderFill
							/>
							<div class="text-converter-secondary text-xs">
								Line weight variation based on confidence for more expressive results.
							</div>
						</div>

						<!-- Tremor Strength -->
						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<label for="tremor-strength" class="text-converter-primary text-sm"
									>Tremor Strength</label
								>
								<span class="bg-ferrari-50 rounded px-2 py-1 font-mono text-xs">
									{config.tremor_strength.toFixed(1)}
								</span>
							</div>
							<input
								type="range"
								id="tremor-strength"
								min="0"
								max="0.5"
								step="0.1"
								value={config.tremor_strength}
								oninput={handleRangeChange('tremor_strength')}
								{disabled}
								class="slider-ferrari w-full"
								use:initializeSliderFill
							/>
							<div class="text-converter-secondary text-xs">
								Organic line jitter and imperfection for natural hand-drawn feel.
							</div>
						</div>

						<!-- Tapering -->
						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<label for="tapering" class="text-converter-primary text-sm">Line Tapering</label>
								<span class="bg-ferrari-50 rounded px-2 py-1 font-mono text-xs">
									{config.tapering.toFixed(1)}
								</span>
							</div>
							<input
								type="range"
								id="tapering"
								min="0"
								max="1"
								step="0.1"
								value={config.tapering}
								oninput={handleRangeChange('tapering')}
								{disabled}
								class="slider-ferrari w-full"
								use:initializeSliderFill
							/>
							<div class="text-converter-secondary text-xs">
								Natural line endpoint tapering for smoother line endings.
							</div>
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Advanced Edge Detection (Edge backend only) -->
		{#if config.backend === 'edge'}
			<div class="border-ferrari-200/30 rounded-lg border bg-white">
				<button
					class="hover:bg-ferrari-50/10 flex w-full items-center justify-between rounded-lg p-4 text-left transition-colors focus:outline-none"
					onclick={() => toggleSection('edgeDetection')}
					{disabled}
					type="button"
				>
					<div class="flex items-center gap-2">
						<Zap class="text-ferrari-600 h-4 w-4" />
						<span class="text-converter-primary font-medium">Advanced Edge Detection</span>
						{#if config.enable_etf_fdog || config.enable_flow_tracing}
							<span
								class="inline-flex items-center rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
							>
								Active
							</span>
						{/if}
					</div>
					<div class="flex-shrink-0">
						{#if expandedSections.edgeDetection}
							<ChevronUp class="text-ferrari-600 h-4 w-4" />
						{:else}
							<ChevronDown class="text-ferrari-600 h-4 w-4" />
						{/if}
					</div>
				</button>

				{#if expandedSections.edgeDetection}
					<div class="border-ferrari-200/20 space-y-4 border-t p-4">
						<div class="rounded-lg bg-amber-50 p-3">
							<p class="text-xs text-amber-700">
								⚠️ Advanced features add 20-50% processing time but can significantly improve
								quality for complex images.
							</p>
						</div>

						<!-- ETF/FDoG -->
						<div class="flex items-center space-x-3">
							<input
								type="checkbox"
								id="etf-fdog"
								checked={config.enable_etf_fdog}
								onchange={handleCheckboxChange('enable_etf_fdog')}
								{disabled}
								class="text-ferrari-600 border-ferrari-300 focus:ring-ferrari-500 h-4 w-4 rounded"
							/>
							<label
								for="etf-fdog"
								class="text-converter-primary cursor-pointer text-sm font-medium"
							>
								Enable ETF/FDoG Processing
							</label>
						</div>
						<div class="text-converter-secondary ml-7 text-xs">
							Advanced edge tangent flow processing for coherent edge detection.
						</div>

						<!-- Flow Tracing -->
						<div class="flex items-center space-x-3">
							<input
								type="checkbox"
								id="flow-tracing"
								checked={config.enable_flow_tracing}
								onchange={handleCheckboxChange('enable_flow_tracing')}
								{disabled}
								class="text-ferrari-600 border-ferrari-300 focus:ring-ferrari-500 h-4 w-4 rounded"
							/>
							<label
								for="flow-tracing"
								class="text-converter-primary cursor-pointer text-sm font-medium"
							>
								Enable Flow-Guided Tracing
							</label>
						</div>
						<div class="text-converter-secondary ml-7 text-xs">
							Flow-guided polyline tracing for smoother, more coherent paths.
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Advanced Dots Controls -->
		{#if config.backend === 'dots'}
			<div class="border-ferrari-200/30 rounded-lg border bg-white">
				<button
					class="hover:bg-ferrari-50/10 flex w-full items-center justify-between rounded-lg p-4 text-left transition-colors focus:outline-none"
					onclick={() => toggleSection('dotsAdvanced')}
					{disabled}
					type="button"
				>
					<div class="flex items-center gap-2">
						<Sparkles class="text-ferrari-600 h-4 w-4" />
						<span class="text-converter-primary font-medium">Advanced Stippling</span>
						{#if config.adaptive_sizing !== false || config.poisson_disk_sampling}
							<span
								class="inline-flex items-center rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
							>
								Active
							</span>
						{/if}
					</div>
					<div class="flex-shrink-0">
						{#if expandedSections.dotsAdvanced}
							<ChevronUp class="text-ferrari-600 h-4 w-4" />
						{:else}
							<ChevronDown class="text-ferrari-600 h-4 w-4" />
						{/if}
					</div>
				</button>

				{#if expandedSections.dotsAdvanced}
					<div class="border-ferrari-200/20 space-y-4 border-t p-4">
						<!-- Adaptive Sizing -->
						<div class="flex items-center space-x-3">
							<input
								type="checkbox"
								id="adaptive-sizing"
								checked={config.adaptive_sizing ?? true}
								onchange={handleCheckboxChange('adaptive_sizing')}
								{disabled}
								class="text-ferrari-600 border-ferrari-300 focus:ring-ferrari-500 h-4 w-4 rounded"
							/>
							<label
								for="adaptive-sizing"
								class="text-converter-primary cursor-pointer text-sm font-medium"
							>
								Adaptive Dot Sizing
							</label>
						</div>
						<div class="text-converter-secondary ml-7 text-xs">
							Variance-based size adjustment for detail areas.
						</div>

						<!-- Poisson Disk Sampling -->
						<div class="flex items-center space-x-3">
							<input
								type="checkbox"
								id="poisson-sampling"
								checked={config.poisson_disk_sampling ?? false}
								onchange={handleCheckboxChange('poisson_disk_sampling')}
								{disabled}
								class="text-ferrari-600 border-ferrari-300 focus:ring-ferrari-500 h-4 w-4 rounded"
							/>
							<label
								for="poisson-sampling"
								class="text-converter-primary cursor-pointer text-sm font-medium"
							>
								Poisson Disk Sampling
							</label>
						</div>
						<div class="text-converter-secondary ml-7 text-xs">
							Even distribution vs random placement for more uniform stippling.
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Advanced Superpixel Controls -->
		{#if config.backend === 'superpixel'}
			<div class="border-ferrari-200/30 rounded-lg border bg-white">
				<button
					class="hover:bg-ferrari-50/10 flex w-full items-center justify-between rounded-lg p-4 text-left transition-colors focus:outline-none"
					onclick={() => toggleSection('superpixelAdvanced')}
					{disabled}
					type="button"
				>
					<div class="flex items-center gap-2">
						<Grid class="text-ferrari-600 h-4 w-4" />
						<span class="text-converter-primary font-medium">Advanced Regions</span>
						{#if (config.compactness && config.compactness !== 20) || config.simplify_boundaries !== true}
							<span
								class="inline-flex items-center rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
							>
								Active
							</span>
						{/if}
					</div>
					<div class="flex-shrink-0">
						{#if expandedSections.superpixelAdvanced}
							<ChevronUp class="text-ferrari-600 h-4 w-4" />
						{:else}
							<ChevronDown class="text-ferrari-600 h-4 w-4" />
						{/if}
					</div>
				</button>

				{#if expandedSections.superpixelAdvanced}
					<div class="border-ferrari-200/20 space-y-4 border-t p-4">
						<!-- Compactness -->
						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<label for="compactness" class="text-converter-primary text-sm">Region Shape</label>
								<span class="bg-ferrari-50 rounded px-2 py-1 font-mono text-xs">
									{config.compactness ?? 20}
								</span>
							</div>
							<input
								type="range"
								id="compactness"
								min="5"
								max="30"
								step="1"
								value={config.compactness ?? 20}
								oninput={handleRangeChange('compactness')}
								{disabled}
								class="slider-ferrari w-full"
								use:initializeSliderFill
							/>
							<div class="text-converter-secondary text-xs">
								Region regularity vs color fidelity (5=irregular/accurate, 30=regular/smooth).
							</div>
						</div>

						<!-- Simplify Boundaries -->
						<div class="flex items-center space-x-3">
							<input
								type="checkbox"
								id="simplify-boundaries"
								checked={config.simplify_boundaries ?? true}
								onchange={handleCheckboxChange('simplify_boundaries')}
								{disabled}
								class="text-ferrari-600 border-ferrari-300 focus:ring-ferrari-500 h-4 w-4 rounded"
							/>
							<label
								for="simplify-boundaries"
								class="text-converter-primary cursor-pointer text-sm font-medium"
							>
								Simplify Boundaries
							</label>
						</div>
						<div class="text-converter-secondary ml-7 text-xs">
							Smooth region edges for cleaner, more stylized look.
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Performance Settings -->
		<div class="border-ferrari-200/30 rounded-lg border bg-white">
			<button
				class="hover:bg-ferrari-50/10 flex w-full items-center justify-between rounded-lg p-4 text-left transition-colors focus:outline-none"
				onclick={() => toggleSection('performance')}
				{disabled}
				type="button"
			>
				<div class="flex items-center gap-2">
					<Zap class="text-ferrari-600 h-4 w-4" />
					<span class="text-converter-primary font-medium">Performance & Output</span>
				</div>
				<div class="flex-shrink-0">
					{#if expandedSections.performance}
						<ChevronUp class="text-ferrari-600 h-4 w-4" />
					{:else}
						<ChevronDown class="text-ferrari-600 h-4 w-4" />
					{/if}
				</div>
			</button>

			{#if expandedSections.performance}
				<div class="border-ferrari-200/20 space-y-4 border-t p-4">
					<!-- SVG Optimization -->
					<div class="flex items-center space-x-3">
						<input
							type="checkbox"
							id="optimize-svg"
							checked={config.optimize_svg ?? true}
							onchange={handleCheckboxChange('optimize_svg')}
							{disabled}
							class="text-ferrari-600 border-ferrari-300 focus:ring-ferrari-500 h-4 w-4 rounded"
						/>
						<label
							for="optimize-svg"
							class="text-converter-primary cursor-pointer text-sm font-medium"
						>
							Optimize SVG Output
						</label>
					</div>
					<div class="text-converter-secondary ml-7 text-xs">
						Apply output optimization and cleanup for smaller file sizes.
					</div>

					<!-- Include Metadata -->
					<div class="flex items-center space-x-3">
						<input
							type="checkbox"
							id="include-metadata"
							checked={config.include_metadata ?? false}
							onchange={handleCheckboxChange('include_metadata')}
							{disabled}
							class="text-ferrari-600 border-ferrari-300 focus:ring-ferrari-500 h-4 w-4 rounded"
						/>
						<label
							for="include-metadata"
							class="text-converter-primary cursor-pointer text-sm font-medium"
						>
							Include Processing Metadata
						</label>
					</div>
					<div class="text-converter-secondary ml-7 text-xs">
						Embed processing information and settings in the SVG file.
					</div>

					<!-- Max Processing Time -->
					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<label for="max-time" class="text-converter-primary text-sm"
								>Max Processing Time</label
							>
							<span class="bg-ferrari-50 rounded px-2 py-1 font-mono text-xs">
								{Math.round((config.max_processing_time_ms ?? 30000) / 1000)}s
							</span>
						</div>
						<input
							type="range"
							id="max-time"
							min="5000"
							max="120000"
							step="5000"
							value={config.max_processing_time_ms ?? 30000}
							oninput={handleRangeChange('max_processing_time_ms')}
							{disabled}
							class="slider-ferrari w-full"
							use:initializeSliderFill
						/>
						<div class="text-converter-secondary text-xs">
							Maximum time budget before processing is interrupted (5-120 seconds).
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</section>

<style>
	/* Unified Progressive Ferrari Slider Styles */
	.slider-ferrari {
		-webkit-appearance: none;
		appearance: none;
		background: linear-gradient(
			to right,
			#dc143c 0%,
			#dc143c var(--value, 0%),
			#ffe5e0 var(--value, 0%),
			#ffe5e0 100%
		);
		height: 8px;
		border-radius: 4px;
		cursor: pointer;
		outline: none;
		transition: all 0.2s ease;
		box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	.slider-ferrari:hover {
		background: linear-gradient(
			to right,
			#ff2800 0%,
			#ff2800 var(--value, 0%),
			#ffb5b0 var(--value, 0%),
			#ffb5b0 100%
		);
	}

	.slider-ferrari::-webkit-slider-track {
		background: transparent;
	}

	.slider-ferrari::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		background: linear-gradient(135deg, #ff2800, #dc2626);
		width: 20px;
		height: 20px;
		border-radius: 50%;
		border: 2px solid white;
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.2),
			0 1px 2px rgba(0, 0, 0, 0.1);
		transition:
			transform 0.2s,
			box-shadow 0.2s;
		cursor: pointer;
	}

	.slider-ferrari::-webkit-slider-thumb:hover {
		transform: scale(1.1);
		box-shadow:
			0 4px 8px rgba(255, 40, 0, 0.3),
			0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.slider-ferrari::-moz-range-track {
		background: transparent;
		height: 8px;
		border-radius: 4px;
	}

	.slider-ferrari::-moz-range-thumb {
		background: linear-gradient(135deg, #ff2800, #dc2626);
		width: 20px;
		height: 20px;
		border-radius: 50%;
		border: 2px solid white;
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.2),
			0 1px 2px rgba(0, 0, 0, 0.1);
		transition:
			transform 0.2s,
			box-shadow 0.2s;
		cursor: pointer;
		border: none;
	}

	.slider-ferrari::-moz-range-thumb:hover {
		transform: scale(1.1);
		box-shadow:
			0 4px 8px rgba(255, 40, 0, 0.3),
			0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.slider-ferrari:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.slider-ferrari:disabled::-webkit-slider-thumb {
		cursor: not-allowed;
	}
</style>
