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
			console.log(`🟡 Advanced Controls - Range change: ${configKey} = ${value}`);
			onConfigChange({ [configKey]: value } as Partial<VectorizerConfig>);
			onParameterChange?.();
		};
	}
</script>

<section class="space-y-4">
	<div class="flex items-center gap-2">
		<div class="bg-ferrari-100 rounded-lg p-1.5">
			<Settings2 class="h-4 w-4 text-ferrari-600" />
		</div>
		<h3 class="text-lg font-semibold text-converter-primary">Advanced Controls</h3>
	</div>

	<p class="text-sm text-converter-secondary">
		Fine-tune processing algorithms with advanced parameters. Changes automatically switch to custom mode.
	</p>

	<div class="space-y-3">
		<!-- Multi-pass Processing -->
		<div class="bg-white rounded-lg border border-ferrari-200/30">
			<button
				class="w-full flex items-center justify-between p-4 text-left hover:bg-ferrari-50/10 transition-colors duration-200 focus:outline-none rounded-lg"
				onclick={() => toggleSection('multipass')}
				{disabled}
				type="button"
			>
				<div class="flex items-center gap-2">
					<div class="bg-ferrari-100 rounded p-1">
						<Layers class="h-4 w-4 text-ferrari-600" />
					</div>
					<span class="font-medium text-converter-primary">Multi-pass Processing</span>
					{#if config.multipass}
						<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-ferrari-600 text-white">
							Active
						</span>
					{/if}
				</div>
				<div class="flex-shrink-0">
					{#if expandedSections.multipass}
						<ChevronUp class="h-4 w-4 text-ferrari-600" />
					{:else}
						<ChevronDown class="h-4 w-4 text-ferrari-600" />
					{/if}
				</div>
			</button>

			{#if expandedSections.multipass}
				<div class="border-t border-ferrari-200/20 p-4 space-y-4">
					<!-- Enable Multi-pass -->
					<div class="flex items-center space-x-3">
						<input
							type="checkbox"
							id="multipass"
							checked={config.multipass}
							onchange={handleCheckboxChange('multipass')}
							{disabled}
							class="h-4 w-4 text-ferrari-600 rounded border-ferrari-300 focus:ring-ferrari-500"
						/>
						<label for="multipass" class="text-sm font-medium text-converter-primary cursor-pointer">
							Enable Multi-pass Processing
						</label>
					</div>
					<div class="ml-7 text-xs text-converter-secondary">
						Dual-pass processing for enhanced quality. Roughly doubles processing time but significantly improves results.
					</div>

					<!-- Conservative Detail -->
					{#if config.multipass}
						<div class="ml-7 space-y-2">
							<div class="flex items-center justify-between">
								<label for="conservative-detail" class="text-sm text-converter-primary">Conservative Detail</label>
								<span class="text-xs font-mono bg-ferrari-50 px-2 py-1 rounded">
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
								class="w-full h-2 bg-ferrari-100 rounded-lg appearance-none cursor-pointer"
							/>
							<div class="text-xs text-converter-secondary">
								First pass threshold. Leave at auto to use main detail level.
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Directional Processing (Edge backend only) -->
		{#if config.backend === 'edge'}
			<div class="bg-white rounded-lg border border-ferrari-200/30">
				<button
					class="w-full flex items-center justify-between p-4 text-left hover:bg-ferrari-50/10 transition-colors focus:outline-none rounded-lg"
					onclick={() => toggleSection('directional')}
					{disabled}
					type="button"
				>
					<div class="flex items-center gap-2">
						<Target class="h-4 w-4 text-ferrari-600" />
						<span class="font-medium text-converter-primary">Directional Processing</span>
						{#if config.reverse_pass || config.diagonal_pass}
							<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
								Active
							</span>
						{/if}
					</div>
					<div class="flex-shrink-0">
						{#if expandedSections.directional}
							<ChevronUp class="h-4 w-4 text-ferrari-600" />
						{:else}
							<ChevronDown class="h-4 w-4 text-ferrari-600" />
						{/if}
					</div>
				</button>

				{#if expandedSections.directional}
					<div class="border-t border-ferrari-200/20 p-4 space-y-4">
						<!-- Reverse Pass -->
						<div class="flex items-center space-x-3">
							<input
								type="checkbox"
								id="reverse-pass"
								checked={config.reverse_pass}
								onchange={handleCheckboxChange('reverse_pass')}
								{disabled}
								class="h-4 w-4 text-ferrari-600 rounded border-ferrari-300 focus:ring-ferrari-500"
							/>
							<label for="reverse-pass" class="text-sm font-medium text-converter-primary cursor-pointer">
								Enable Reverse Pass
							</label>
						</div>
						<div class="ml-7 text-xs text-converter-secondary">
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
								class="h-4 w-4 text-ferrari-600 rounded border-ferrari-300 focus:ring-ferrari-500"
							/>
							<label for="diagonal-pass" class="text-sm font-medium text-converter-primary cursor-pointer">
								Enable Diagonal Pass
							</label>
						</div>
						<div class="ml-7 text-xs text-converter-secondary">
							Diagonal direction processing for complex geometries.
						</div>

						<!-- Directional Strength Threshold -->
						{#if config.reverse_pass || config.diagonal_pass}
							<div class="ml-7 space-y-2">
								<div class="flex items-center justify-between">
									<label for="directional-threshold" class="text-sm text-converter-primary">Strength Threshold</label>
									<span class="text-xs font-mono bg-ferrari-50 px-2 py-1 rounded">
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
									class="w-full h-2 bg-ferrari-100 rounded-lg appearance-none cursor-pointer"
								/>
								<div class="text-xs text-converter-secondary">
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
			<div class="bg-white rounded-lg border border-ferrari-200/30">
				<button
					class="w-full flex items-center justify-between p-4 text-left hover:bg-ferrari-50/10 transition-colors focus:outline-none rounded-lg"
					onclick={() => toggleSection('artistic')}
					{disabled}
					type="button"
				>
					<div class="flex items-center gap-2">
						<Brush class="h-4 w-4 text-ferrari-600" />
						<span class="font-medium text-converter-primary">Artistic Effects</span>
					</div>
					<div class="flex-shrink-0">
						{#if expandedSections.artistic}
							<ChevronUp class="h-4 w-4 text-ferrari-600" />
						{:else}
							<ChevronDown class="h-4 w-4 text-ferrari-600" />
						{/if}
					</div>
				</button>

				{#if expandedSections.artistic}
					<div class="border-t border-ferrari-200/20 p-4 space-y-4">
						<!-- Variable Weights -->
						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<label for="variable-weights" class="text-sm text-converter-primary">Variable Line Weights</label>
								<span class="text-xs font-mono bg-ferrari-50 px-2 py-1 rounded">
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
								class="w-full h-2 bg-ferrari-100 rounded-lg appearance-none cursor-pointer"
							/>
							<div class="text-xs text-converter-secondary">
								Line weight variation based on confidence for more expressive results.
							</div>
						</div>

						<!-- Tremor Strength -->
						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<label for="tremor-strength" class="text-sm text-converter-primary">Tremor Strength</label>
								<span class="text-xs font-mono bg-ferrari-50 px-2 py-1 rounded">
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
								class="w-full h-2 bg-ferrari-100 rounded-lg appearance-none cursor-pointer"
							/>
							<div class="text-xs text-converter-secondary">
								Organic line jitter and imperfection for natural hand-drawn feel.
							</div>
						</div>

						<!-- Tapering -->
						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<label for="tapering" class="text-sm text-converter-primary">Line Tapering</label>
								<span class="text-xs font-mono bg-ferrari-50 px-2 py-1 rounded">
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
								class="w-full h-2 bg-ferrari-100 rounded-lg appearance-none cursor-pointer"
							/>
							<div class="text-xs text-converter-secondary">
								Natural line endpoint tapering for smoother line endings.
							</div>
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Advanced Edge Detection (Edge backend only) -->
		{#if config.backend === 'edge'}
			<div class="bg-white rounded-lg border border-ferrari-200/30">
				<button
					class="w-full flex items-center justify-between p-4 text-left hover:bg-ferrari-50/10 transition-colors focus:outline-none rounded-lg"
					onclick={() => toggleSection('edgeDetection')}
					{disabled}
					type="button"
				>
					<div class="flex items-center gap-2">
						<Zap class="h-4 w-4 text-ferrari-600" />
						<span class="font-medium text-converter-primary">Advanced Edge Detection</span>
						{#if config.enable_etf_fdog || config.enable_flow_tracing}
							<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
								Active
							</span>
						{/if}
					</div>
					<div class="flex-shrink-0">
						{#if expandedSections.edgeDetection}
							<ChevronUp class="h-4 w-4 text-ferrari-600" />
						{:else}
							<ChevronDown class="h-4 w-4 text-ferrari-600" />
						{/if}
					</div>
				</button>

				{#if expandedSections.edgeDetection}
					<div class="border-t border-ferrari-200/20 p-4 space-y-4">
						<div class="bg-amber-50 rounded-lg p-3">
							<p class="text-xs text-amber-700">
								⚠️ Advanced features add 20-50% processing time but can significantly improve quality for complex images.
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
								class="h-4 w-4 text-ferrari-600 rounded border-ferrari-300 focus:ring-ferrari-500"
							/>
							<label for="etf-fdog" class="text-sm font-medium text-converter-primary cursor-pointer">
								Enable ETF/FDoG Processing
							</label>
						</div>
						<div class="ml-7 text-xs text-converter-secondary">
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
								class="h-4 w-4 text-ferrari-600 rounded border-ferrari-300 focus:ring-ferrari-500"
							/>
							<label for="flow-tracing" class="text-sm font-medium text-converter-primary cursor-pointer">
								Enable Flow-Guided Tracing
							</label>
						</div>
						<div class="ml-7 text-xs text-converter-secondary">
							Flow-guided polyline tracing for smoother, more coherent paths.
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Advanced Dots Controls -->
		{#if config.backend === 'dots'}
			<div class="bg-white rounded-lg border border-ferrari-200/30">
				<button
					class="w-full flex items-center justify-between p-4 text-left hover:bg-ferrari-50/10 transition-colors focus:outline-none rounded-lg"
					onclick={() => toggleSection('dotsAdvanced')}
					{disabled}
					type="button"
				>
					<div class="flex items-center gap-2">
						<Sparkles class="h-4 w-4 text-ferrari-600" />
						<span class="font-medium text-converter-primary">Advanced Stippling</span>
						{#if config.adaptive_sizing !== false || config.poisson_disk_sampling}
							<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
								Active
							</span>
						{/if}
					</div>
					<div class="flex-shrink-0">
						{#if expandedSections.dotsAdvanced}
							<ChevronUp class="h-4 w-4 text-ferrari-600" />
						{:else}
							<ChevronDown class="h-4 w-4 text-ferrari-600" />
						{/if}
					</div>
				</button>

				{#if expandedSections.dotsAdvanced}
					<div class="border-t border-ferrari-200/20 p-4 space-y-4">
						<!-- Adaptive Sizing -->
						<div class="flex items-center space-x-3">
							<input
								type="checkbox"
								id="adaptive-sizing"
								checked={config.adaptive_sizing ?? true}
								onchange={handleCheckboxChange('adaptive_sizing')}
								{disabled}
								class="h-4 w-4 text-ferrari-600 rounded border-ferrari-300 focus:ring-ferrari-500"
							/>
							<label for="adaptive-sizing" class="text-sm font-medium text-converter-primary cursor-pointer">
								Adaptive Dot Sizing
							</label>
						</div>
						<div class="ml-7 text-xs text-converter-secondary">
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
								class="h-4 w-4 text-ferrari-600 rounded border-ferrari-300 focus:ring-ferrari-500"
							/>
							<label for="poisson-sampling" class="text-sm font-medium text-converter-primary cursor-pointer">
								Poisson Disk Sampling
							</label>
						</div>
						<div class="ml-7 text-xs text-converter-secondary">
							Even distribution vs random placement for more uniform stippling.
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Advanced Superpixel Controls -->
		{#if config.backend === 'superpixel'}
			<div class="bg-white rounded-lg border border-ferrari-200/30">
				<button
					class="w-full flex items-center justify-between p-4 text-left hover:bg-ferrari-50/10 transition-colors focus:outline-none rounded-lg"
					onclick={() => toggleSection('superpixelAdvanced')}
					{disabled}
					type="button"
				>
					<div class="flex items-center gap-2">
						<Grid class="h-4 w-4 text-ferrari-600" />
						<span class="font-medium text-converter-primary">Advanced Regions</span>
						{#if (config.compactness && config.compactness !== 20) || config.simplify_boundaries !== true}
							<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
								Active
							</span>
						{/if}
					</div>
					<div class="flex-shrink-0">
						{#if expandedSections.superpixelAdvanced}
							<ChevronUp class="h-4 w-4 text-ferrari-600" />
						{:else}
							<ChevronDown class="h-4 w-4 text-ferrari-600" />
						{/if}
					</div>
				</button>

				{#if expandedSections.superpixelAdvanced}
					<div class="border-t border-ferrari-200/20 p-4 space-y-4">
						<!-- Compactness -->
						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<label for="compactness" class="text-sm text-converter-primary">Region Shape</label>
								<span class="text-xs font-mono bg-ferrari-50 px-2 py-1 rounded">
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
								class="w-full h-2 bg-ferrari-100 rounded-lg appearance-none cursor-pointer"
							/>
							<div class="text-xs text-converter-secondary">
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
								class="h-4 w-4 text-ferrari-600 rounded border-ferrari-300 focus:ring-ferrari-500"
							/>
							<label for="simplify-boundaries" class="text-sm font-medium text-converter-primary cursor-pointer">
								Simplify Boundaries
							</label>
						</div>
						<div class="ml-7 text-xs text-converter-secondary">
							Smooth region edges for cleaner, more stylized look.
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Performance Settings -->
		<div class="bg-white rounded-lg border border-ferrari-200/30">
			<button
				class="w-full flex items-center justify-between p-4 text-left hover:bg-ferrari-50/10 transition-colors focus:outline-none rounded-lg"
				onclick={() => toggleSection('performance')}
				{disabled}
				type="button"
			>
				<div class="flex items-center gap-2">
					<Zap class="h-4 w-4 text-ferrari-600" />
					<span class="font-medium text-converter-primary">Performance & Output</span>
				</div>
				<div class="flex-shrink-0">
					{#if expandedSections.performance}
						<ChevronUp class="h-4 w-4 text-ferrari-600" />
					{:else}
						<ChevronDown class="h-4 w-4 text-ferrari-600" />
					{/if}
				</div>
			</button>

			{#if expandedSections.performance}
				<div class="border-t border-ferrari-200/20 p-4 space-y-4">
					<!-- SVG Optimization -->
					<div class="flex items-center space-x-3">
						<input
							type="checkbox"
							id="optimize-svg"
							checked={config.optimize_svg ?? true}
							onchange={handleCheckboxChange('optimize_svg')}
							{disabled}
							class="h-4 w-4 text-ferrari-600 rounded border-ferrari-300 focus:ring-ferrari-500"
						/>
						<label for="optimize-svg" class="text-sm font-medium text-converter-primary cursor-pointer">
							Optimize SVG Output
						</label>
					</div>
					<div class="ml-7 text-xs text-converter-secondary">
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
							class="h-4 w-4 text-ferrari-600 rounded border-ferrari-300 focus:ring-ferrari-500"
						/>
						<label for="include-metadata" class="text-sm font-medium text-converter-primary cursor-pointer">
							Include Processing Metadata
						</label>
					</div>
					<div class="ml-7 text-xs text-converter-secondary">
						Embed processing information and settings in the SVG file.
					</div>

					<!-- Max Processing Time -->
					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<label for="max-time" class="text-sm text-converter-primary">Max Processing Time</label>
							<span class="text-xs font-mono bg-ferrari-50 px-2 py-1 rounded">
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
							class="w-full h-2 bg-ferrari-100 rounded-lg appearance-none cursor-pointer"
						/>
						<div class="text-xs text-converter-secondary">
							Maximum time budget before processing is interrupted (5-120 seconds).
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</section>