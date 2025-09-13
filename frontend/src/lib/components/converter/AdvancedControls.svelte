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
		Check,
		AlertTriangle,
		Palette,
		Eraser,
		Filter
	} from 'lucide-svelte';
	import type { VectorizerConfig } from '$lib/types/vectorizer';
	import { calculateMultipassConfig } from '$lib/types/vectorizer';

	// Import dots backend parameter ranges (for dot size controls)
	import { DOTS_PARAMETER_RANGES } from '$lib/types/dots-backend';
	import FerrariSlider from '$lib/components/ui/FerrariSlider.svelte';

	interface AdvancedControlsProps {
		config: VectorizerConfig;
		onConfigChange: (_config: Partial<VectorizerConfig>) => void;
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
		backgroundFiltering: false,
		multipass: false,
		edgeDetection: false,
		colorControls: false,
		centerlineAdvanced: false,
		dotsAdvanced: false,
		superpixelAdvanced: false,
		performance: false
	});

	// Dots validation state
	let dotsValidation = $state<{ isValid: boolean; errors: any[]; warnings: string[] }>({
		isValid: true,
		errors: [],
		warnings: []
	});

	// Reactive state for FerrariSlider components
	let backgroundStrengthValue = $state(0.5);
	let passCountValue = $state(1);
	let directionalThresholdValue = $state(0.3);
	let colorAccuracyValue = $state(0.7);
	let maxColorsPathValue = $state(3);
	let colorToleranceValue = $state(0.15);
	let minRadiusValue = $state(0.5);
	let maxRadiusValue = $state(3.0);
	let compactnessValue = $state(20);
	let maxProcessingTimeValue = $state(30000);

	// Update dots validation when config changes
	$effect(() => {
		if (config.backend === 'dots') {
			// Dots validation is handled internally now - just track state
			dotsValidation = { isValid: true, errors: [], warnings: [] };
		}
	});

	// Update reactive values when config changes
	$effect(() => {
		backgroundStrengthValue = config.background_removal_strength ?? 0.5;
		passCountValue = config.pass_count || 1;
		directionalThresholdValue = config.directional_strength_threshold ?? 0.3;
		colorAccuracyValue = config.color_accuracy ?? 0.7;
		maxColorsPathValue = config.max_colors_per_path ?? 3;
		colorToleranceValue = config.color_tolerance ?? 0.15;
		minRadiusValue = config.min_radius ?? 0.5;
		maxRadiusValue = config.max_radius ?? 3.0;
		compactnessValue = config.compactness ?? 20;
		maxProcessingTimeValue = config.max_processing_time_ms ?? 30000;
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

	// Dots-specific parameter handlers with architectural mapping

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
		<!-- Background Filtering (All algorithms) -->
		<div
			class="border-ferrari-200/30 border bg-white {expandedSections.backgroundFiltering
				? 'rounded-t-lg'
				: 'rounded-lg'}"
		>
			<button
				class="hover:bg-ferrari-50/10 flex w-full items-center justify-between p-4 text-left transition-colors focus:ring-0 focus:outline-none {expandedSections.backgroundFiltering
					? 'rounded-t-lg'
					: 'rounded-lg'}"
				onclick={() => toggleSection('backgroundFiltering')}
				{disabled}
				type="button"
			>
				<div class="flex items-center gap-2">
					<Eraser class="text-ferrari-600 h-4 w-4" />
					<span class="text-converter-primary font-medium">Background Filtering</span>
					{#if config.enable_background_removal}
						<Check class="h-4 w-4 text-green-600" />
					{/if}
				</div>
				<div class="flex-shrink-0">
					{#if expandedSections.backgroundFiltering}
						<ChevronUp class="text-ferrari-600 h-4 w-4" />
					{:else}
						<ChevronDown class="text-ferrari-600 h-4 w-4" />
					{/if}
				</div>
			</button>

			{#if expandedSections.backgroundFiltering}
				<div class="border-ferrari-200/20 space-y-4 rounded-b-lg border-t p-4">
					<div class="text-converter-secondary text-xs">
						Extra background removal pass to further try to isolate larger elements in the image.
					</div>

					<!-- Enable Background Filtering Toggle -->
					<div class="flex items-center space-x-3">
						<input
							type="checkbox"
							id="enable-background-filtering"
							checked={config.enable_background_removal ?? false}
							onchange={(e) => {
								const checked = e.currentTarget.checked;
								console.log(`🟡 Advanced Controls - Background removal toggle: ${checked}`);
								onConfigChange({ enable_background_removal: checked });
								onParameterChange?.();
							}}
							{disabled}
							class="text-ferrari-600 border-ferrari-300 focus:ring-ferrari-500 h-4 w-4 rounded"
						/>
						<label
							for="enable-background-filtering"
							class="text-converter-primary cursor-pointer text-sm font-medium"
						>
							Enable Background Filtering
						</label>
					</div>

					<!-- Background Filtering Options (shown when enabled) -->
					{#if config.enable_background_removal}
						<div class="ml-7 space-y-4 pt-2">
							<!-- Algorithm Selection -->
							<div class="space-y-2">
								<div id="bg-algorithm-label" class="text-converter-primary text-sm font-medium">
									Algorithm
								</div>

								<!-- Algorithm Button Group -->
								<div
									class="grid grid-cols-2 gap-2"
									role="radiogroup"
									aria-labelledby="bg-algorithm-label"
								>
									<button
										type="button"
										class="relative rounded-lg border-2 p-3 text-sm font-medium transition-all duration-200 hover:bg-gray-50 focus:ring-0 focus:outline-none {(config.background_removal_algorithm ??
											'otsu') === 'otsu'
											? 'border-ferrari-500 bg-ferrari-50 text-ferrari-700'
											: 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}"
										onclick={() => {
											console.log('🟡 Advanced Controls - Background removal algorithm: otsu');
											onConfigChange({ background_removal_algorithm: 'otsu' });
											onParameterChange?.();
										}}
										{disabled}
										aria-checked={(config.background_removal_algorithm ?? 'otsu') === 'otsu'}
										role="radio"
									>
										{#if (config.background_removal_algorithm ?? 'otsu') === 'otsu'}
											<div class="bg-ferrari-600 absolute top-2 right-2 h-3 w-3 rounded-full"></div>
										{/if}
										<div class="text-center">
											<div class="font-medium">OTSU</div>
											<div class="text-xs text-current opacity-75">Fast</div>
										</div>
									</button>

									<button
										type="button"
										class="relative rounded-lg border-2 p-3 text-sm font-medium transition-all duration-200 hover:bg-gray-50 focus:ring-0 focus:outline-none {config.background_removal_algorithm ===
										'adaptive'
											? 'border-ferrari-500 bg-ferrari-50 text-ferrari-700'
											: 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}"
										onclick={() => {
											console.log('🟡 Advanced Controls - Background removal algorithm: adaptive');
											onConfigChange({ background_removal_algorithm: 'adaptive' });
											onParameterChange?.();
										}}
										{disabled}
										aria-checked={config.background_removal_algorithm === 'adaptive'}
										role="radio"
									>
										{#if config.background_removal_algorithm === 'adaptive'}
											<div class="bg-ferrari-600 absolute top-2 right-2 h-3 w-3 rounded-full"></div>
										{/if}
										<div class="text-center">
											<div class="font-medium">Adaptive</div>
											<div class="text-xs text-current opacity-75">Better Quality</div>
										</div>
									</button>
								</div>

								<!-- Algorithm Description -->
								<div class="text-converter-secondary rounded bg-gray-50 p-2 text-xs">
									{#if (config.background_removal_algorithm ?? 'otsu') === 'otsu'}
										Fast automatic thresholding. Works well for simple, uniform backgrounds.
									{:else if config.background_removal_algorithm === 'adaptive'}
										Adaptive thresholding for complex lighting. Slower but better quality.
									{/if}
								</div>
							</div>

							<!-- Strength Slider -->
							<div class="space-y-2">
								<div class="flex items-center justify-between">
									<label
										for="bg-strength-slider"
										class="text-converter-primary flex items-center gap-2 text-sm font-medium"
									>
										<Filter class="text-ferrari-600 h-4 w-4" />
										Strength
									</label>
									<span class="bg-ferrari-50 rounded px-2 py-1 font-mono text-xs">
										{Math.round((config.background_removal_strength ?? 0.5) * 100)}%
									</span>
								</div>
								<FerrariSlider
									id="bg-strength-slider"
									bind:value={backgroundStrengthValue}
									min={0.0}
									max={1.0}
									step={0.1}
									oninput={(value) => {
										console.log(`🟡 Advanced Controls - Background removal strength: ${value}`);
										onConfigChange({ background_removal_strength: value });
										onParameterChange?.();
									}}
									{disabled}
									class="w-full"
								/>
								<div class="text-converter-secondary text-xs">
									Higher values remove more background (more aggressive), lower values are more
									conservative.
								</div>
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Multi-pass Processing (Edge backend only) -->
		{#if config.backend === 'edge'}
			<div
				class="border-ferrari-200/30 border bg-white {expandedSections.multipass
					? 'rounded-t-lg'
					: 'rounded-lg'}"
			>
				<button
					class="hover:bg-ferrari-50/10 flex w-full items-center justify-between p-4 text-left transition-colors focus:ring-0 focus:outline-none {expandedSections.multipass
						? 'rounded-t-lg'
						: 'rounded-lg'}"
					onclick={() => toggleSection('multipass')}
					{disabled}
					type="button"
				>
					<div class="flex items-center gap-2">
						<Layers class="text-ferrari-600 h-4 w-4" />
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
					<div class="border-ferrari-200/20 space-y-4 rounded-b-lg border-t p-4">
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
							<FerrariSlider
								id="pass-count"
								bind:value={passCountValue}
								min={1}
								max={10}
								step={1}
								oninput={(value) => {
									const passCount = parseInt(value.toString());
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
								}}
								{disabled}
								class="w-full"
							/>
							<div id="pass-count-desc" class="text-converter-secondary text-xs">
								{getPassCountDescription(config.pass_count || 1)}
							</div>
						</div>

						<!-- Directional Processing (shown when pass count > 1) -->
						{#if (config.pass_count || 1) > 1}
							<div class="border-ferrari-200/20 space-y-4 border-t pt-4">
								<div class="flex items-center gap-2">
									<Target class="text-ferrari-600 h-4 w-4" />
									<span class="text-converter-primary text-sm font-medium"
										>Directional Enhancements</span
									>
									{#if config.reverse_pass || config.diagonal_pass}
										<Check class="h-4 w-4 text-green-600" />
									{/if}
								</div>

								<!-- Reverse Pass -->
								<div class="space-y-2">
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
									<div class="ml-7 text-xs font-medium text-blue-600">
										Best for: portraits, objects with directional lighting
									</div>
								</div>

								<!-- Diagonal Pass -->
								<div class="space-y-2">
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
									<div class="ml-7 text-xs font-medium text-blue-600">
										Best for: buildings, geometric shapes, technical drawings
									</div>
								</div>

								<!-- Directional Sensitivity -->
								{#if config.reverse_pass || config.diagonal_pass}
									<div class="border-ferrari-200/20 ml-7 space-y-3 border-t pt-4">
										<div class="flex items-center justify-between">
											<label
												for="directional-threshold"
												class="text-converter-primary text-sm font-medium"
												>Directional Sensitivity</label
											>
											<span class="bg-ferrari-50 rounded px-2 py-1 font-mono text-xs">
												{(config.directional_strength_threshold ?? 0.3).toFixed(1)}
											</span>
										</div>
										<FerrariSlider
											id="directional-threshold"
											bind:value={directionalThresholdValue}
											min={0.1}
											max={0.8}
											step={0.1}
											oninput={(value) => {
												console.log(
													`🟡 Advanced Controls - Range change: directional_strength_threshold = ${value}`
												);
												onConfigChange({ directional_strength_threshold: value });
												onParameterChange?.();
											}}
											{disabled}
											class="w-full"
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
			</div>
		{/if}

		<!-- Unified Color Controls (All backends) -->
		<div
			class="border-ferrari-200/30 border bg-white {expandedSections.colorControls
				? 'rounded-t-lg'
				: 'rounded-lg'}"
		>
			<button
				class="hover:bg-ferrari-50/10 flex w-full items-center justify-between p-4 text-left transition-colors focus:ring-0 focus:outline-none {expandedSections.colorControls
					? 'rounded-t-lg'
					: 'rounded-lg'}"
				onclick={() => toggleSection('colorControls')}
				{disabled}
				type="button"
			>
				<div class="flex items-center gap-2">
					<Palette class="text-ferrari-600 h-4 w-4" />
					<span class="text-converter-primary font-medium">Color Controls</span>
					{#if config.preserve_colors}
						<span
							class="inline-block h-3 w-3 rounded-full bg-gradient-to-r from-red-400 via-yellow-400 to-blue-400"
						></span>
					{/if}
				</div>
				<div class="flex-shrink-0">
					{#if expandedSections.colorControls}
						<ChevronUp class="text-ferrari-600 h-4 w-4" />
					{:else}
						<ChevronDown class="text-ferrari-600 h-4 w-4" />
					{/if}
				</div>
			</button>

			{#if expandedSections.colorControls}
				<div class="border-ferrari-200/20 space-y-4 rounded-b-lg border-t p-4">
					<!-- Color Mode Toggle -->
					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<label for="color-mode-buttons" class="text-converter-primary text-sm font-medium"
								>Color Mode</label
							>
							<span class="bg-ferrari-50 rounded px-2 py-1 text-xs">
								{config.preserve_colors ? 'Color' : 'Mono'}
							</span>
						</div>

						<div
							id="color-mode-buttons"
							class="grid grid-cols-2 gap-2"
							role="radiogroup"
							aria-labelledby="color-mode-buttons"
						>
							<button
								class="group flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-all duration-200 hover:bg-gray-50 focus:outline-none {!config.preserve_colors
									? 'border-gray-500 bg-gray-50 text-gray-700'
									: 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}"
								onclick={() => {
									onConfigChange({ preserve_colors: false });
									onParameterChange?.();
								}}
								{disabled}
								type="button"
							>
								{#if !config.preserve_colors}
									<div class="h-3 w-3 flex-shrink-0 rounded-full bg-gray-600"></div>
								{/if}
								<span>Monochrome</span>
							</button>
							<button
								class="group flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-all duration-200 hover:bg-gray-50 focus:outline-none {config.preserve_colors
									? 'border-ferrari-500 bg-ferrari-50 text-ferrari-700'
									: 'hover:border-ferrari-300 border-gray-200 bg-white text-gray-700'}"
								onclick={() => {
									onConfigChange({ preserve_colors: true });
									onParameterChange?.();
								}}
								{disabled}
								type="button"
							>
								{#if config.preserve_colors}
									<div
										class="h-3 w-3 flex-shrink-0 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500"
									></div>
								{/if}
								<span>Preserve Colors</span>
							</button>
						</div>

						<div class="text-converter-secondary text-xs">
							{#if config.preserve_colors}
								{#if config.backend === 'edge' || config.backend === 'centerline'}
									Colors will be sampled from the original image and applied to line paths
								{:else if config.backend === 'superpixel'}
									Colors will be preserved in superpixel regions
								{:else}
									Colors will be preserved in stippled dots
								{/if}
							{:else if config.backend === 'edge' || config.backend === 'centerline'}
								Traditional black line art output (fastest processing)
							{:else if config.backend === 'superpixel'}
								Monochrome grayscale regions with enhanced contrast
							{:else}
								Monochrome grayscale stippling with enhanced contrast
							{/if}
						</div>
					</div>

					{#if config.preserve_colors}
						<!-- Color Accuracy Slider -->
						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<label for="color-accuracy-unified" class="text-converter-primary text-sm"
									>Color Accuracy</label
								>
								<span class="bg-ferrari-50 rounded px-2 py-1 font-mono text-xs">
									{Math.round((config.color_accuracy ?? 0.7) * 100)}%
								</span>
							</div>
							<FerrariSlider
								id="color-accuracy-unified"
								bind:value={colorAccuracyValue}
								min={0.3}
								max={1.0}
								step={0.1}
								oninput={(value) => {
									console.log(`🟡 Advanced Controls - Range change: color_accuracy = ${value}`);
									onConfigChange({ color_accuracy: value });
									onParameterChange?.();
								}}
								{disabled}
								class="w-full"
							/>
							<div class="text-converter-secondary text-xs">
								Higher accuracy preserves more colors but increases processing time
							</div>
						</div>

						{#if config.backend === 'edge' || config.backend === 'centerline'}
							<!-- Max Colors Per Path (line tracing only) -->
							<div class="space-y-2">
								<div class="flex items-center justify-between">
									<label for="max-colors-path-unified" class="text-converter-primary text-sm"
										>Max Colors per Path</label
									>
									<span class="bg-ferrari-50 rounded px-2 py-1 font-mono text-xs">
										{config.max_colors_per_path ?? 3}
									</span>
								</div>
								<FerrariSlider
									id="max-colors-path-unified"
									bind:value={maxColorsPathValue}
									min={1}
									max={10}
									step={1}
									oninput={(value) => {
										console.log(
											`🟡 Advanced Controls - Range change: max_colors_per_path = ${value}`
										);
										onConfigChange({ max_colors_per_path: value });
										onParameterChange?.();
									}}
									{disabled}
									class="w-full"
								/>
								<div class="text-converter-secondary text-xs">
									Limits the number of different colors per individual line path
								</div>
							</div>
						{/if}

						<!-- Color Tolerance -->
						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<label for="color-tolerance-unified" class="text-converter-primary text-sm"
									>Color Similarity</label
								>
								<span class="bg-ferrari-50 rounded px-2 py-1 font-mono text-xs">
									{Math.round((config.color_tolerance ?? 0.15) * 100)}%
								</span>
							</div>
							<FerrariSlider
								id="color-tolerance-unified"
								bind:value={colorToleranceValue}
								min={0.05}
								max={0.4}
								step={0.05}
								oninput={(value) => {
									console.log(`🟡 Advanced Controls - Range change: color_tolerance = ${value}`);
									onConfigChange({ color_tolerance: value });
									onParameterChange?.();
								}}
								{disabled}
								class="w-full"
							/>
							<div class="text-converter-secondary text-xs">
								Controls color clustering sensitivity (lower = more distinct colors, higher = more
								grouping)
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Advanced Edge Detection (Edge backend only) -->
		{#if config.backend === 'edge'}
			<div
				class="border-ferrari-200/30 border bg-white {expandedSections.edgeDetection
					? 'rounded-t-lg'
					: 'rounded-lg'}"
			>
				<button
					class="hover:bg-ferrari-50/10 flex w-full items-center justify-between p-4 text-left transition-colors focus:ring-0 focus:outline-none {expandedSections.edgeDetection
						? 'rounded-t-lg'
						: 'rounded-lg'}"
					onclick={() => toggleSection('edgeDetection')}
					{disabled}
					type="button"
				>
					<div class="flex items-center gap-2">
						<!-- Edge Detection Icon - Simple square with detected edges -->
						<svg
							class="text-ferrari-600 h-4 w-4"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<!-- Original filled shape (representing image content) -->
							<rect x="6" y="6" width="12" height="12" fill="currentColor" fill-opacity="0.1" />
							<!-- Detected edges as bold outlines -->
							<rect x="6" y="6" width="12" height="12" stroke-width="2.5" />
							<!-- Corner detection points -->
							<circle cx="6" cy="6" r="1.5" fill="currentColor" />
							<circle cx="18" cy="6" r="1.5" fill="currentColor" />
							<circle cx="18" cy="18" r="1.5" fill="currentColor" />
							<circle cx="6" cy="18" r="1.5" fill="currentColor" />
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
					<div class="border-ferrari-200/20 space-y-4 rounded-b-lg border-t p-4">
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
							Advanced edge tangent flow processing (temporarily disabled due to performance
							issues).
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
			<div
				class="border-ferrari-200/30 border bg-white {expandedSections.dotsAdvanced
					? 'rounded-t-lg'
					: 'rounded-lg'}"
			>
				<button
					class="hover:bg-ferrari-50/10 flex w-full items-center justify-between p-4 text-left transition-colors focus:ring-0 focus:outline-none {expandedSections.dotsAdvanced
						? 'rounded-t-lg'
						: 'rounded-lg'}"
					onclick={() => toggleSection('dotsAdvanced')}
					{disabled}
					type="button"
				>
					<div class="flex items-center gap-2">
						<Sparkles class="text-ferrari-600 h-4 w-4" />
						<span class="text-converter-primary font-medium">Advanced Dot Settings</span>
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
					<div class="border-ferrari-200/20 space-y-6 rounded-b-lg border-t p-4">
						<!-- Configuration Summary and Validation -->
						<div class="space-y-3">
							<!-- Validation Feedback -->
							{#if !dotsValidation.isValid}
								<div class="rounded-lg border border-red-200 bg-red-50 p-3">
									<div class="mb-2 flex items-center gap-2 text-sm font-medium text-red-700">
										<AlertTriangle size={14} />
										Configuration Issues
									</div>
									<ul class="space-y-1 text-xs text-red-600">
										{#each dotsValidation.errors as error, index (index)}
											<li>• {error.message}</li>
										{/each}
									</ul>
								</div>
							{/if}

							{#if dotsValidation.warnings.length > 0}
								<div class="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
									<div class="mb-2 text-sm font-medium text-yellow-700">Recommendations</div>
									<ul class="space-y-1 text-xs text-yellow-600">
										{#each dotsValidation.warnings as warning, index (index)}
											<li>• {warning}</li>
										{/each}
									</ul>
								</div>
							{/if}
						</div>

						<!-- Expert Parameter Controls -->
						<div class="space-y-4">
							<div class="text-converter-secondary text-sm font-medium">Expert Parameters</div>

							<!-- Dot Size Range -->
							<div class="grid grid-cols-2 gap-4">
								<!-- Min Radius -->
								<div class="space-y-2">
									<div class="flex items-center justify-between">
										<label for="min-radius" class="text-converter-primary text-sm font-medium">
											Min Radius
										</label>
										<span class="bg-ferrari-50 rounded px-2 py-1 font-mono text-xs">
											{(config.min_radius ?? 0.5).toFixed(1)}px
										</span>
									</div>
									<FerrariSlider
										id="min-radius"
										bind:value={minRadiusValue}
										min={DOTS_PARAMETER_RANGES.RADIUS.MIN_ALLOWED}
										max={4.0}
										step={0.1}
										oninput={(value) => {
											// Ensure max_radius is always larger than min_radius
											const maxRadius = Math.max(value + 0.1, config.max_radius || value + 1.0);
											console.log(
												`🎯 Advanced Controls - Min radius: ${value}, adjusted max: ${maxRadius}`
											);
											onConfigChange({
												min_radius: value,
												max_radius: maxRadius
											});
											onParameterChange?.();
										}}
										{disabled}
										class="w-full"
									/>
								</div>

								<!-- Max Radius -->
								<div class="space-y-2">
									<div class="flex items-center justify-between">
										<label for="max-radius" class="text-converter-primary text-sm font-medium">
											Max Radius
										</label>
										<span class="bg-ferrari-50 rounded px-2 py-1 font-mono text-xs">
											{(config.max_radius ?? 3.0).toFixed(1)}px
										</span>
									</div>
									<FerrariSlider
										id="max-radius"
										bind:value={maxRadiusValue}
										min={1.0}
										max={DOTS_PARAMETER_RANGES.RADIUS.MAX_ALLOWED}
										step={0.1}
										oninput={(value) => {
											// Ensure max_radius is always larger than min_radius
											const minRadius = Math.min(value - 0.1, config.min_radius || value - 1.0);
											const constrainedMinRadius = Math.max(0.3, minRadius);
											console.log(
												`🎯 Advanced Controls - Max radius: ${value}, adjusted min: ${constrainedMinRadius}`
											);
											onConfigChange({
												min_radius: constrainedMinRadius,
												max_radius: value
											});
											onParameterChange?.();
										}}
										{disabled}
										class="w-full"
									/>
								</div>
							</div>
							<div class="text-converter-muted text-xs">
								{#if config.min_radius !== undefined && config.max_radius !== undefined}
									{@const avgSize = ((config.min_radius + config.max_radius) / 2).toFixed(1)}
									{@const sizeRange = (config.max_radius - config.min_radius).toFixed(1)}
									Average dot size: {avgSize}px • Size variation: {sizeRange}px
								{:else}
									Controls the size variation of individual dots (max must be larger than min)
								{/if}
							</div>
						</div>

						<!-- Algorithm Features -->
						<div class="space-y-4">
							<div class="text-converter-secondary text-sm font-medium">Algorithm Features</div>

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
								Varies dot sizes based on image content and gradients for more natural appearance.
							</div>

							<!-- Gradient-Based Sizing -->
							<div class="flex items-center space-x-3">
								<input
									type="checkbox"
									id="gradient-sizing"
									checked={config.gradient_based_sizing ?? true}
									onchange={handleCheckboxChange('gradient_based_sizing')}
									{disabled}
									class="text-ferrari-600 border-ferrari-300 focus:ring-ferrari-500 h-4 w-4 rounded"
								/>
								<label
									for="gradient-sizing"
									class="text-converter-primary cursor-pointer text-sm font-medium"
								>
									Gradient-Based Sizing
								</label>
							</div>
							<div class="text-converter-secondary ml-7 text-xs">
								Uses image gradients to determine dot placement and sizing for enhanced detail.
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
								Ensures more uniform distribution vs random placement (may be slower on large
								images).
							</div>
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Advanced Superpixel Controls -->
		{#if config.backend === 'superpixel'}
			<div
				class="border-ferrari-200/30 border bg-white {expandedSections.superpixelAdvanced
					? 'rounded-t-lg'
					: 'rounded-lg'}"
			>
				<button
					class="hover:bg-ferrari-50/10 flex w-full items-center justify-between p-4 text-left transition-colors focus:ring-0 focus:outline-none {expandedSections.superpixelAdvanced
						? 'rounded-t-lg'
						: 'rounded-lg'}"
					onclick={() => toggleSection('superpixelAdvanced')}
					{disabled}
					type="button"
				>
					<div class="flex items-center gap-2">
						<Grid class="text-ferrari-600 h-4 w-4" />
						<span class="text-converter-primary font-medium">Advanced Regions</span>
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
					<div class="border-ferrari-200/20 space-y-4 rounded-b-lg border-t p-4">
						<!-- Compactness -->
						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<label for="compactness" class="text-converter-primary text-sm"
									>Shape Regularity</label
								>
								<span class="bg-ferrari-50 rounded px-2 py-1 font-mono text-xs">
									{config.compactness ?? 20}
								</span>
							</div>
							<FerrariSlider
								id="compactness"
								bind:value={compactnessValue}
								min={5}
								max={30}
								step={1}
								oninput={(value) => {
									console.log(`🟡 Advanced Controls - Range change: compactness = ${value}`);
									onConfigChange({ compactness: value });
									onParameterChange?.();
								}}
								{disabled}
								class="w-full"
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

						<!-- Fill Regions -->
						<div class="flex items-center space-x-3">
							<input
								type="checkbox"
								id="fill-regions-advanced"
								checked={config.fill_regions ?? true}
								onchange={handleCheckboxChange('fill_regions')}
								{disabled}
								class="text-ferrari-600 border-ferrari-300 focus:ring-ferrari-500 h-4 w-4 rounded"
							/>
							<label
								for="fill-regions-advanced"
								class="text-converter-primary cursor-pointer text-sm font-medium"
							>
								Fill Regions
							</label>
						</div>
						<div class="text-converter-secondary ml-7 text-xs">
							Fill color regions instead of showing only outlines for bolder poster-style effects.
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Performance Settings -->
		<div
			class="border-ferrari-200/30 border bg-white {expandedSections.performance
				? 'rounded-t-lg'
				: 'rounded-lg'}"
		>
			<button
				class="hover:bg-ferrari-50/10 flex w-full items-center justify-between p-4 text-left transition-colors focus:ring-0 focus:outline-none {expandedSections.performance
					? 'rounded-t-lg'
					: 'rounded-lg'}"
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
				<div class="border-ferrari-200/20 space-y-4 rounded-b-lg border-t p-4">
					<!-- Include Metadata (NOT YET IMPLEMENTED) -->
					<div class="cursor-not-allowed opacity-50" title="This feature is coming soon">
						<div class="flex items-center space-x-3">
							<input
								type="checkbox"
								id="include-metadata"
								checked={config.include_metadata ?? false}
								onchange={handleCheckboxChange('include_metadata')}
								disabled={true}
								class="text-ferrari-600 border-ferrari-300 focus:ring-ferrari-500 h-4 w-4 cursor-not-allowed rounded"
							/>
							<label
								for="include-metadata"
								class="text-converter-primary cursor-not-allowed text-sm font-medium"
							>
								Include Processing Metadata <span class="text-ferrari-400 text-xs"
									>(Coming Soon)</span
								>
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
								{#if (config.max_processing_time_ms ?? 30000) >= 999999}
									Unlimited
								{:else}
									{Math.round((config.max_processing_time_ms ?? 30000) / 1000)}s
								{/if}
							</span>
						</div>
						<FerrariSlider
							id="max-time"
							bind:value={maxProcessingTimeValue}
							min={5000}
							max={999999}
							step={5000}
							oninput={(value) => {
								console.log(
									`🟡 Advanced Controls - Range change: max_processing_time_ms = ${value}`
								);
								onConfigChange({ max_processing_time_ms: value });
								onParameterChange?.();
							}}
							{disabled}
							class="w-full"
						/>
						<div class="text-converter-secondary text-xs">
							{#if (config.max_processing_time_ms ?? 30000) >= 999999}
								<span class="font-medium text-amber-600">⚠️ UNLIMITED PROCESSING:</span> No time limit
								- processing may run indefinitely. Use for complex images only.
							{:else}
								Maximum time budget before processing is interrupted (5-{Math.round(999999 / 1000)}+
								seconds). Uses JavaScript-based timeout.
							{/if}
						</div>

						{#if (config.max_processing_time_ms ?? 30000) >= 999999}
							<div class="rounded-lg border border-amber-200 bg-amber-50 p-3">
								<div class="flex items-start gap-2">
									<div class="mt-0.5 flex-shrink-0">
										<svg class="h-4 w-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
											<path
												fill-rule="evenodd"
												d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
												clip-rule="evenodd"
											/>
										</svg>
									</div>
									<div class="space-y-1">
										<div class="text-sm font-medium text-amber-800">
											Unlimited Processing Enabled
										</div>
										<div class="space-y-1 text-xs text-amber-700">
											<div>• Processing will run without time limits</div>
											<div>• May cause browser to appear unresponsive</div>
											<div>• Use only for complex images requiring extended processing</div>
											<div>• You can still abort manually if needed</div>
										</div>
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
</section>
