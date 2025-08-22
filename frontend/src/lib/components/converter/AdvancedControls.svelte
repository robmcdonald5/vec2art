<script lang="ts">
	import {
		ChevronDown,
		ChevronUp,
		Settings2,
		Layers,
		Zap,
		Grid,
		Sparkles,
		Target,
		Check
	} from 'lucide-svelte';
	import type { VectorizerConfig } from '$lib/types/vectorizer';
	import { calculateMultipassConfig, PASS_COUNT_DESCRIPTIONS } from '$lib/types/vectorizer';

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

	// Slider refs for multipass controls  
	let passCountSliderRef = $state<HTMLInputElement>();

	// Pass count slider handler
	function handlePassCountSliderChange(event: Event) {
		const slider = event.target as HTMLInputElement;
		const passCount = parseInt(slider.value);
		
		// Update progressive fill
		updateSliderFill(slider);
		
		console.log(`🟡 Advanced Controls - Pass count change: ${passCount}`);
		
		// Calculate the new multipass configuration
		const tempConfig = { ...config, pass_count: passCount };
		const multipassConfig = calculateMultipassConfig(tempConfig);
		
		// Update configuration with new pass count and computed multipass settings
		onConfigChange({
			pass_count: passCount,
			multipass: multipassConfig.multipass
		});
		onParameterChange?.();
	}

	// Get description for pass count
	function getPassCountDescription(passCount: number): string {
		if (passCount === 1) {
			return 'Single pass - fastest processing, good for simple images';
		} else if (passCount === 2) {
			return '2 passes - multi-scale processing, slower processing';
		} else if (passCount === 3) {
			return '3 passes - extended multi-scale processing, slower processing';
		} else if (passCount === 4) {
			return '4 passes - maximum scale coverage, significantly slower processing';
		} else if (passCount <= 6) {
			return `${passCount} passes - experimental scale range, slower processing`;
		} else {
			return `${passCount} passes - extended experimental processing, significantly slower`;
		}
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
					{#if (config.pass_count || 1) > 1}
						<Check class="h-4 w-4 text-green-600" />
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
					<!-- Pass Count Slider -->
					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<label for="pass-count" class="text-converter-primary text-sm font-medium">
								Processing Passes
							</label>
							<span class="bg-ferrari-50 rounded px-2 py-1 font-mono text-xs">
								{config.pass_count || 1}/10
							</span>
						</div>
						<input
							bind:this={passCountSliderRef}
							type="range"
							id="pass-count"
							min="1"
							max="10"
							step="1"
							value={config.pass_count || 1}
							oninput={handlePassCountSliderChange}
							onchange={handlePassCountSliderChange}
							{disabled}
							class="slider-ferrari w-full"
							aria-describedby="pass-count-desc"
							use:initializeSliderFill
						/>
						<div id="pass-count-desc" class="text-converter-secondary text-xs">
							{getPassCountDescription(config.pass_count || 1)}
						</div>
					</div>


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
							<Check class="h-4 w-4 text-green-600" />
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
							Right-to-left, bottom-to-top scan for shadows and lighting effects.
						</div>
						<div class="text-blue-600 ml-7 text-xs font-medium">
							Best for: portraits, objects with directional lighting
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
							Diagonal scan (NW→SE, NE→SW) for architectural and angled features.
						</div>
						<div class="text-blue-600 ml-7 text-xs font-medium">
							Best for: buildings, geometric shapes, technical drawings
						</div>

						<!-- Directional Sensitivity -->
						{#if config.reverse_pass || config.diagonal_pass}
							<div class="ml-7 space-y-3 border-t border-ferrari-200/20 pt-4">
								<div class="flex items-center justify-between">
									<label for="directional-threshold" class="text-converter-primary text-sm font-medium"
										>Directional Sensitivity</label
									>
									<span class="bg-ferrari-50 rounded px-2 py-1 font-mono text-xs">
										{(config.directional_strength_threshold ?? 0.3).toFixed(1)}
									</span>
								</div>
								<input
									type="range"
									id="directional-threshold"
									min="0.1"
									max="0.8"
									step="0.1"
									value={config.directional_strength_threshold ?? 0.3}
									oninput={handleRangeChange('directional_strength_threshold')}
									{disabled}
									class="slider-ferrari w-full"
									use:initializeSliderFill
								/>
								<div class="space-y-1 text-xs">
									<div class="text-converter-secondary">
										Controls how selective the algorithm is about running directional passes:
									</div>
									<div class="grid grid-cols-3 gap-2 text-xs">
										<div class="text-center">
											<span class="font-medium text-green-600">Low (0.1-0.3)</span>
											<div class="text-converter-secondary">Run on most images</div>
										</div>
										<div class="text-center">
											<span class="font-medium text-yellow-600">Med (0.4-0.6)</span>
											<div class="text-converter-secondary">Run when beneficial</div>
										</div>
										<div class="text-center">
											<span class="font-medium text-red-600">High (0.7-0.8)</span>
											<div class="text-converter-secondary">Only when clearly beneficial</div>
										</div>
									</div>
								</div>
								<div class="rounded-lg bg-amber-50 p-2">
									<div class="text-xs text-amber-700">
										⏱️ Each enabled pass adds ~30% processing time
									</div>
								</div>
							</div>
						{/if}
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
						<!-- Edge Detection Icon - Simple square with detected edges -->
						<svg class="text-ferrari-600 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<!-- Original filled shape (representing image content) -->
							<rect x="6" y="6" width="12" height="12" fill="currentColor" fill-opacity="0.1"/>
							<!-- Detected edges as bold outlines -->
							<rect x="6" y="6" width="12" height="12" stroke-width="2.5"/>
							<!-- Corner detection points -->
							<circle cx="6" cy="6" r="1.5" fill="currentColor"/>
							<circle cx="18" cy="6" r="1.5" fill="currentColor"/>
							<circle cx="18" cy="18" r="1.5" fill="currentColor"/>
							<circle cx="6" cy="18" r="1.5" fill="currentColor"/>
						</svg>
						<span class="text-converter-primary font-medium">Advanced Edge Detection</span>
						{#if config.enable_etf_fdog || config.enable_flow_tracing}
							<Check class="h-4 w-4 text-green-600" />
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
						<div class="flex items-center space-x-3 opacity-50">
							<input
								type="checkbox"
								id="etf-fdog"
								checked={config.enable_etf_fdog}
								onchange={handleCheckboxChange('enable_etf_fdog')}
								disabled
								class="text-ferrari-600 border-ferrari-300 focus:ring-ferrari-500 h-4 w-4 rounded"
							/>
							<label
								for="etf-fdog"
								class="text-converter-primary cursor-not-allowed text-sm font-medium"
							>
								Enable ETF/FDoG Processing
							</label>
						</div>
						<div class="text-converter-secondary ml-7 text-xs opacity-50">
							Advanced edge tangent flow processing (temporarily disabled due to performance issues).
						</div>

						<!-- Flow Tracing -->
						<div class="flex items-center space-x-3 opacity-50">
							<input
								type="checkbox"
								id="flow-tracing"
								checked={config.enable_flow_tracing}
								onchange={handleCheckboxChange('enable_flow_tracing')}
								disabled
								class="text-ferrari-600 border-ferrari-300 focus:ring-ferrari-500 h-4 w-4 rounded"
							/>
							<label
								for="flow-tracing"
								class="text-converter-primary cursor-not-allowed text-sm font-medium"
							>
								Enable Flow-Guided Tracing
							</label>
						</div>
						<div class="text-converter-secondary ml-7 text-xs opacity-50">
							Flow-guided polyline tracing (temporarily disabled due to performance issues).
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
							<Check class="h-4 w-4 text-green-600" />
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
							<Check class="h-4 w-4 text-green-600" />
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
					<!-- SVG Optimization (NOT YET IMPLEMENTED) -->
					<div class="opacity-50 cursor-not-allowed" title="This feature is coming soon">
						<div class="flex items-center space-x-3">
							<input
								type="checkbox"
								id="optimize-svg"
								checked={config.optimize_svg ?? true}
								onchange={handleCheckboxChange('optimize_svg')}
								disabled={true}
								class="text-ferrari-600 border-ferrari-300 focus:ring-ferrari-500 h-4 w-4 rounded cursor-not-allowed"
							/>
							<label
								for="optimize-svg"
								class="text-converter-primary text-sm font-medium cursor-not-allowed"
							>
								Optimize SVG Output <span class="text-xs text-ferrari-400">(Coming Soon)</span>
							</label>
						</div>
						<div class="text-converter-secondary ml-7 text-xs">
							Apply output optimization and cleanup for smaller file sizes.
						</div>
					</div>

					<!-- Include Metadata (NOT YET IMPLEMENTED) -->
					<div class="opacity-50 cursor-not-allowed" title="This feature is coming soon">
						<div class="flex items-center space-x-3">
							<input
								type="checkbox"
								id="include-metadata"
								checked={config.include_metadata ?? false}
								onchange={handleCheckboxChange('include_metadata')}
								disabled={true}
								class="text-ferrari-600 border-ferrari-300 focus:ring-ferrari-500 h-4 w-4 rounded cursor-not-allowed"
							/>
							<label
								for="include-metadata"
								class="text-converter-primary text-sm font-medium cursor-not-allowed"
							>
								Include Processing Metadata <span class="text-xs text-ferrari-400">(Coming Soon)</span>
							</label>
						</div>
						<div class="text-converter-secondary ml-7 text-xs">
							Embed processing information and settings in the SVG file.
						</div>
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
