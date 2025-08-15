<script lang="ts">
	import {
		ChevronDown,
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

	// Collapsible section state
	let openSections = $state({
		multipass: false,
		directional: false,
		artistic: false,
		edgeDetection: false,
		centerlineAdvanced: false,
		dotsAdvanced: false,
		superpixelAdvanced: false,
		performance: false
	});

	function toggleSection(section: keyof typeof openSections) {
		openSections[section] = !openSections[section];
	}

	// Parameter change handlers
	function handleToggle(key: keyof VectorizerConfig) {
		return (event: Event) => {
			const target = event.target as HTMLInputElement;
			onConfigChange({ [key]: target.checked } as Partial<VectorizerConfig>);
			onParameterChange?.();
		};
	}

	function handleRangeChange(key: keyof VectorizerConfig, scale = 1) {
		return (event: Event) => {
			const target = event.target as HTMLInputElement;
			const value = parseFloat(target.value) * scale;
			onConfigChange({ [key]: value } as Partial<VectorizerConfig>);
			onParameterChange?.();
		};
	}

	// Check if any advanced parameters are non-default  
	let hasAdvancedChanges = $derived(
		config.enable_etf_fdog ||
		config.enable_flow_tracing ||
		config.reverse_pass ||
		config.diagonal_pass ||
		config.conservative_detail !== undefined ||
		config.aggressive_detail !== undefined
	);
</script>

<section class="space-y-4" aria-labelledby="advanced-controls-heading">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<Settings2 class="text-primary h-5 w-5" aria-hidden="true" />
			<h3 id="advanced-controls-heading" class="text-lg font-semibold">Advanced Controls</h3>
		</div>
		{#if hasAdvancedChanges}
			<span
				class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200"
			>
				Modified
			</span>
		{/if}
	</div>

	<p class="text-muted-foreground text-sm">
		Fine-tune processing algorithms with advanced parameters. Changes automatically switch to custom
		mode.
	</p>

	<div class="space-y-3">
		<!-- Multi-pass Processing -->
		<div class="rounded-lg border">
			<button
				class="hover:bg-accent/50 focus:ring-primary flex w-full items-center justify-between rounded-lg p-4 text-left focus:ring-2 focus:ring-offset-2 focus:outline-none"
				onclick={() => toggleSection('multipass')}
				aria-expanded={openSections.multipass}
				{disabled}
			>
				<div class="flex items-center gap-2">
					<Layers class="text-muted-foreground h-4 w-4" aria-hidden="true" />
					<span class="font-medium">Multi-pass Processing</span>
					{#if config.multipass}
						<span
							class="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200"
						>
							Enabled
						</span>
					{/if}
				</div>
				<ChevronDown
					class="h-4 w-4 transition-transform duration-200 {openSections.multipass
						? 'rotate-180'
						: ''}"
					aria-hidden="true"
				/>
			</button>

			{#if openSections.multipass}
				<div class="space-y-4 border-t p-4">
					<!-- Enable Multi-pass -->
					<div class="flex items-center space-x-3">
						<input
							type="checkbox"
							id="multipass"
							checked={config.multipass}
							onchange={handleToggle('multipass')}
							{disabled}
							class="border-border text-primary focus:ring-primary h-4 w-4 rounded focus:ring-2"
						/>
						<label for="multipass" class="cursor-pointer text-sm font-medium">
							Enable Multi-pass Processing
						</label>
					</div>
					<div class="text-muted-foreground ml-7 text-xs">
						Dual-pass processing for enhanced quality. Roughly doubles processing time but
						significantly improves results.
					</div>

					<!-- Conservative Detail -->
					{#if config.multipass}
						<div class="ml-7 space-y-2">
							<div class="flex items-center justify-between">
								<label for="conservative-detail" class="text-sm">Conservative Detail</label>
								<span class="bg-muted rounded px-2 py-1 font-mono text-xs">
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
								onchange={handleRangeChange('conservative_detail')}
								{disabled}
								class="bg-muted h-1 w-full rounded-lg"
							/>
							<div class="text-muted-foreground text-xs">
								First pass threshold. Leave at auto to use main detail level.
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Directional Processing (Edge backend only) -->
		{#if config.backend === 'edge'}
			<div class="rounded-lg border">
				<button
					class="hover:bg-accent/50 focus:ring-primary flex w-full items-center justify-between rounded-lg p-4 text-left focus:ring-2 focus:ring-offset-2 focus:outline-none"
					onclick={() => toggleSection('directional')}
					aria-expanded={openSections.directional}
					{disabled}
				>
					<div class="flex items-center gap-2">
						<Target class="text-muted-foreground h-4 w-4" aria-hidden="true" />
						<span class="font-medium">Directional Processing</span>
						{#if config.reverse_pass || config.diagonal_pass}
							<span
								class="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200"
							>
								Active
							</span>
						{/if}
					</div>
					<ChevronDown
						class="h-4 w-4 transition-transform duration-200 {openSections.directional
							? 'rotate-180'
							: ''}"
						aria-hidden="true"
					/>
				</button>

				{#if openSections.directional}
					<div class="space-y-4 border-t p-4">
						<!-- Reverse Pass -->
						<div class="flex items-center space-x-3">
							<input
								type="checkbox"
								id="reverse-pass"
								checked={config.reverse_pass}
								onchange={handleToggle('reverse_pass')}
								{disabled}
								class="border-border text-primary focus:ring-primary h-4 w-4 rounded focus:ring-2"
							/>
							<label for="reverse-pass" class="cursor-pointer text-sm font-medium">
								Enable Reverse Pass
							</label>
						</div>
						<div class="text-muted-foreground ml-7 text-xs">
							Right-to-left, bottom-to-top processing for missed details.
						</div>

						<!-- Diagonal Pass -->
						<div class="flex items-center space-x-3">
							<input
								type="checkbox"
								id="diagonal-pass"
								checked={config.diagonal_pass}
								onchange={handleToggle('diagonal_pass')}
								{disabled}
								class="border-border text-primary focus:ring-primary h-4 w-4 rounded focus:ring-2"
							/>
							<label for="diagonal-pass" class="cursor-pointer text-sm font-medium">
								Enable Diagonal Pass
							</label>
						</div>
						<div class="text-muted-foreground ml-7 text-xs">
							Diagonal direction processing for complex geometries.
						</div>

						<!-- Directional Strength Threshold -->
						{#if config.reverse_pass || config.diagonal_pass}
							<div class="ml-7 space-y-2">
								<div class="flex items-center justify-between">
									<label for="directional-threshold" class="text-sm">Strength Threshold</label>
									<span class="bg-muted rounded px-2 py-1 font-mono text-xs">
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
									onchange={handleRangeChange('directional_strength_threshold')}
									{disabled}
									class="bg-muted h-1 w-full rounded-lg"
								/>
								<div class="text-muted-foreground text-xs">
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
			<div class="rounded-lg border">
				<button
					class="hover:bg-accent/50 focus:ring-primary flex w-full items-center justify-between rounded-lg p-4 text-left focus:ring-2 focus:ring-offset-2 focus:outline-none"
					onclick={() => toggleSection('artistic')}
					aria-expanded={openSections.artistic}
					{disabled}
				>
					<div class="flex items-center gap-2">
						<Brush class="text-muted-foreground h-4 w-4" aria-hidden="true" />
						<span class="font-medium">Artistic Effects</span>
						{#if config.variable_weights > 0 || config.tremor_strength > 0 || config.tapering > 0}
							<span
								class="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200"
							>
								Active
							</span>
						{/if}
					</div>
					<ChevronDown
						class="h-4 w-4 transition-transform duration-200 {openSections.artistic
							? 'rotate-180'
							: ''}"
						aria-hidden="true"
					/>
				</button>

				{#if openSections.artistic}
					<div class="space-y-4 border-t p-4">
						<!-- Variable Weights -->
						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<label for="variable-weights" class="text-sm">Variable Line Weights</label>
								<span class="bg-muted rounded px-2 py-1 font-mono text-xs">
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
								onchange={handleRangeChange('variable_weights')}
								{disabled}
								class="bg-muted h-1 w-full rounded-lg"
							/>
							<div class="text-muted-foreground text-xs">
								Line weight variation based on confidence for more expressive results.
							</div>
						</div>

						<!-- Tremor Strength -->
						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<label for="tremor-strength" class="text-sm">Tremor Strength</label>
								<span class="bg-muted rounded px-2 py-1 font-mono text-xs">
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
								onchange={handleRangeChange('tremor_strength')}
								{disabled}
								class="bg-muted h-1 w-full rounded-lg"
							/>
							<div class="text-muted-foreground text-xs">
								Organic line jitter and imperfection for natural hand-drawn feel.
							</div>
						</div>

						<!-- Tapering -->
						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<label for="tapering" class="text-sm">Line Tapering</label>
								<span class="bg-muted rounded px-2 py-1 font-mono text-xs">
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
								onchange={handleRangeChange('tapering')}
								{disabled}
								class="bg-muted h-1 w-full rounded-lg"
							/>
							<div class="text-muted-foreground text-xs">
								Natural line endpoint tapering for smoother line endings.
							</div>
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Advanced Edge Detection (Edge backend only) -->
		{#if config.backend === 'edge'}
			<div class="rounded-lg border">
				<button
					class="hover:bg-accent/50 focus:ring-primary flex w-full items-center justify-between rounded-lg p-4 text-left focus:ring-2 focus:ring-offset-2 focus:outline-none"
					onclick={() => toggleSection('edgeDetection')}
					aria-expanded={openSections.edgeDetection}
					{disabled}
				>
					<div class="flex items-center gap-2">
						<Zap class="text-muted-foreground h-4 w-4" aria-hidden="true" />
						<span class="font-medium">Advanced Edge Detection</span>
						{#if config.enable_etf_fdog || config.enable_flow_tracing}
							<span
								class="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900 dark:text-orange-200"
							>
								Active
							</span>
						{/if}
					</div>
					<ChevronDown
						class="h-4 w-4 transition-transform duration-200 {openSections.edgeDetection
							? 'rotate-180'
							: ''}"
						aria-hidden="true"
					/>
				</button>

				{#if openSections.edgeDetection}
					<div class="space-y-4 border-t p-4">
						<div class="rounded-lg bg-amber-50 p-3 dark:bg-amber-950/50">
							<p class="text-xs text-amber-700 dark:text-amber-300">
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
								onchange={handleToggle('enable_etf_fdog')}
								{disabled}
								class="border-border text-primary focus:ring-primary h-4 w-4 rounded focus:ring-2"
							/>
							<label for="etf-fdog" class="cursor-pointer text-sm font-medium">
								Enable ETF/FDoG Processing
							</label>
						</div>
						<div class="text-muted-foreground ml-7 text-xs">
							Advanced edge tangent flow processing for coherent edge detection.
						</div>

						<!-- Flow Tracing -->
						<div class="flex items-center space-x-3">
							<input
								type="checkbox"
								id="flow-tracing"
								checked={config.enable_flow_tracing}
								onchange={handleToggle('enable_flow_tracing')}
								{disabled}
								class="border-border text-primary focus:ring-primary h-4 w-4 rounded focus:ring-2"
							/>
							<label for="flow-tracing" class="cursor-pointer text-sm font-medium">
								Enable Flow-Guided Tracing
							</label>
						</div>
						<div class="text-muted-foreground ml-7 text-xs">
							Flow-guided polyline tracing for smoother, more coherent paths.
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Advanced Dots Controls -->
		{#if config.backend === 'dots'}
			<div class="rounded-lg border">
				<button
					class="hover:bg-accent/50 focus:ring-primary flex w-full items-center justify-between rounded-lg p-4 text-left focus:ring-2 focus:ring-offset-2 focus:outline-none"
					onclick={() => toggleSection('dotsAdvanced')}
					aria-expanded={openSections.dotsAdvanced}
					{disabled}
				>
					<div class="flex items-center gap-2">
						<Sparkles class="text-muted-foreground h-4 w-4" aria-hidden="true" />
						<span class="font-medium">Advanced Stippling</span>
					</div>
					<ChevronDown
						class="h-4 w-4 transition-transform duration-200 {openSections.dotsAdvanced
							? 'rotate-180'
							: ''}"
						aria-hidden="true"
					/>
				</button>

				{#if openSections.dotsAdvanced}
					<div class="space-y-4 border-t p-4">
						<!-- Adaptive Sizing -->
						<div class="flex items-center space-x-3">
							<input
								type="checkbox"
								id="adaptive-sizing"
								checked={config.adaptive_sizing ?? true}
								onchange={handleToggle('adaptive_sizing')}
								{disabled}
								class="border-border text-primary focus:ring-primary h-4 w-4 rounded focus:ring-2"
							/>
							<label for="adaptive-sizing" class="cursor-pointer text-sm font-medium">
								Adaptive Dot Sizing
							</label>
						</div>
						<div class="text-muted-foreground ml-7 text-xs">
							Variance-based size adjustment for detail areas.
						</div>

						<!-- Poisson Disk Sampling -->
						<div class="flex items-center space-x-3">
							<input
								type="checkbox"
								id="poisson-sampling"
								checked={config.poisson_disk_sampling ?? false}
								onchange={handleToggle('poisson_disk_sampling')}
								{disabled}
								class="border-border text-primary focus:ring-primary h-4 w-4 rounded focus:ring-2"
							/>
							<label for="poisson-sampling" class="cursor-pointer text-sm font-medium">
								Poisson Disk Sampling
							</label>
						</div>
						<div class="text-muted-foreground ml-7 text-xs">
							Even distribution vs random placement for more uniform stippling.
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Advanced Superpixel Controls -->
		{#if config.backend === 'superpixel'}
			<div class="rounded-lg border">
				<button
					class="hover:bg-accent/50 focus:ring-primary flex w-full items-center justify-between rounded-lg p-4 text-left focus:ring-2 focus:ring-offset-2 focus:outline-none"
					onclick={() => toggleSection('superpixelAdvanced')}
					aria-expanded={openSections.superpixelAdvanced}
					{disabled}
				>
					<div class="flex items-center gap-2">
						<Grid class="text-muted-foreground h-4 w-4" aria-hidden="true" />
						<span class="font-medium">Advanced Regions</span>
					</div>
					<ChevronDown
						class="h-4 w-4 transition-transform duration-200 {openSections.superpixelAdvanced
							? 'rotate-180'
							: ''}"
						aria-hidden="true"
					/>
				</button>

				{#if openSections.superpixelAdvanced}
					<div class="space-y-4 border-t p-4">
						<!-- Compactness -->
						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<label for="compactness" class="text-sm">Region Shape</label>
								<span class="bg-muted rounded px-2 py-1 font-mono text-xs">
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
								onchange={handleRangeChange('compactness')}
								{disabled}
								class="bg-muted h-1 w-full rounded-lg"
							/>
							<div class="text-muted-foreground text-xs">
								Region regularity vs color fidelity (5=irregular/accurate, 30=regular/smooth).
							</div>
						</div>

						<!-- Simplify Boundaries -->
						<div class="flex items-center space-x-3">
							<input
								type="checkbox"
								id="simplify-boundaries"
								checked={config.simplify_boundaries ?? true}
								onchange={handleToggle('simplify_boundaries')}
								{disabled}
								class="border-border text-primary focus:ring-primary h-4 w-4 rounded focus:ring-2"
							/>
							<label for="simplify-boundaries" class="cursor-pointer text-sm font-medium">
								Simplify Boundaries
							</label>
						</div>
						<div class="text-muted-foreground ml-7 text-xs">
							Smooth region edges for cleaner, more stylized look.
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Performance Settings -->
		<div class="rounded-lg border">
			<button
				class="hover:bg-accent/50 focus:ring-primary flex w-full items-center justify-between rounded-lg p-4 text-left focus:ring-2 focus:ring-offset-2 focus:outline-none"
				onclick={() => toggleSection('performance')}
				aria-expanded={openSections.performance}
				{disabled}
			>
				<div class="flex items-center gap-2">
					<Zap class="text-muted-foreground h-4 w-4" aria-hidden="true" />
					<span class="font-medium">Performance & Output</span>
				</div>
				<ChevronDown
					class="h-4 w-4 transition-transform duration-200 {openSections.performance
						? 'rotate-180'
						: ''}"
					aria-hidden="true"
				/>
			</button>

			{#if openSections.performance}
				<div class="space-y-4 border-t p-4">
					<!-- SVG Optimization -->
					<div class="flex items-center space-x-3">
						<input
							type="checkbox"
							id="optimize-svg"
							checked={config.optimize_svg ?? true}
							onchange={handleToggle('optimize_svg')}
							{disabled}
							class="border-border text-primary focus:ring-primary h-4 w-4 rounded focus:ring-2"
						/>
						<label for="optimize-svg" class="cursor-pointer text-sm font-medium">
							Optimize SVG Output
						</label>
					</div>
					<div class="text-muted-foreground ml-7 text-xs">
						Apply output optimization and cleanup for smaller file sizes.
					</div>

					<!-- Include Metadata -->
					<div class="flex items-center space-x-3">
						<input
							type="checkbox"
							id="include-metadata"
							checked={config.include_metadata ?? false}
							onchange={handleToggle('include_metadata')}
							{disabled}
							class="border-border text-primary focus:ring-primary h-4 w-4 rounded focus:ring-2"
						/>
						<label for="include-metadata" class="cursor-pointer text-sm font-medium">
							Include Processing Metadata
						</label>
					</div>
					<div class="text-muted-foreground ml-7 text-xs">
						Embed processing information and settings in the SVG file.
					</div>

					<!-- Max Processing Time -->
					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<label for="max-time" class="text-sm">Max Processing Time</label>
							<span class="bg-muted rounded px-2 py-1 font-mono text-xs">
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
							onchange={handleRangeChange('max_processing_time_ms')}
							{disabled}
							class="bg-muted h-1 w-full rounded-lg"
						/>
						<div class="text-muted-foreground text-xs">
							Maximum time budget before processing is interrupted (5-120 seconds).
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</section>

<style>
	/* Range slider styling */
	input[type='range'] {
		-webkit-appearance: none;
		background: transparent;
	}

	input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		height: 16px;
		width: 16px;
		border-radius: 50%;
		background: hsl(var(--primary));
		cursor: pointer;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
		border: 1px solid white;
	}

	input[type='range']::-webkit-slider-track {
		background: hsl(var(--muted));
		height: 4px;
		border-radius: 2px;
	}

	input[type='range']::-moz-range-thumb {
		height: 16px;
		width: 16px;
		border-radius: 50%;
		background: hsl(var(--primary));
		cursor: pointer;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
		border: 1px solid white;
	}

	input[type='range']::-moz-range-track {
		background: hsl(var(--muted));
		height: 4px;
		border-radius: 2px;
		border: none;
	}

	input[type='range']:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
