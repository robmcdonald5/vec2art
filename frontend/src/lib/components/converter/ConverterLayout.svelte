<script lang="ts">
	import { Settings, Play, Download, RotateCcw, ChevronDown, ChevronUp, Sliders } from 'lucide-svelte';
	import Button from '$lib/components/ui/button.svelte';
	import type { VectorizerConfig, VectorizerBackend, VectorizerPreset } from '$lib/types/vectorizer';
	import BackendSelector from './BackendSelector.svelte';
	import PresetSelector from './PresetSelector.svelte';
	import ParameterPanel from './ParameterPanel.svelte';
	import AdvancedControls from './AdvancedControls.svelte';

	interface Props {
		config: VectorizerConfig;
		selectedPreset: VectorizerPreset | 'custom';
		canConvert: boolean;
		canDownload: boolean;
		isProcessing: boolean;
		hasImages: boolean;
		onConfigChange: (updates: Partial<VectorizerConfig>) => void;
		onPresetChange: (preset: VectorizerPreset | 'custom') => void;
		onBackendChange: (backend: VectorizerBackend) => void;
		onParameterChange: () => void;
		onConvert: () => void;
		onDownload: () => void;
		onReset: () => void;
		onAbort: () => void;
	}

	let {
		config,
		selectedPreset,
		canConvert,
		canDownload,
		isProcessing,
		hasImages,
		onConfigChange,
		onPresetChange,
		onBackendChange,
		onParameterChange,
		onConvert,
		onDownload,
		onReset,
		onAbort
	}: Props = $props();

	// UI State
	let showAdvanced = $state(false);
	let showQuickSettings = $state(true);
	let isMobileSettingsOpen = $state(false);

	// Auto-hide quick settings when images are uploaded to give more space to preview
	$effect(() => {
		if (hasImages) {
			showQuickSettings = false;
		}
	});
</script>

<div class="space-y-6">
	<!-- Quick Settings Bar (Collapsible) -->
	<div class="rounded-lg border bg-card">
		<div class="p-4">
			<div class="flex items-center justify-between">
				<h3 class="font-medium flex items-center gap-2">
					<Sliders class="h-4 w-4" />
					Quick Settings
				</h3>
				<Button
					variant="ghost"
					size="sm"
					onclick={() => showQuickSettings = !showQuickSettings}
					aria-label={showQuickSettings ? 'Hide quick settings' : 'Show quick settings'}
				>
					{#if showQuickSettings}
						<ChevronUp class="h-4 w-4" />
					{:else}
						<ChevronDown class="h-4 w-4" />
					{/if}
				</Button>
			</div>

			{#if showQuickSettings}
				<div class="mt-4 space-y-4">
					<!-- Preset Selection - Most Important -->
					<div>
						<div class="text-sm font-medium mb-2">Style Preset</div>
						<PresetSelector
							{selectedPreset}
							onPresetChange={onPresetChange}
							disabled={isProcessing}
							isCustom={selectedPreset === 'custom'}
							compact={true}
						/>
					</div>

					<!-- Algorithm Selection -->
					<div>
						<div class="text-sm font-medium mb-2">Algorithm</div>
						<BackendSelector
							selectedBackend={config.backend}
							onBackendChange={onBackendChange}
							disabled={isProcessing}
							compact={true}
						/>
					</div>

					<!-- Essential Parameters -->
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label for="detail-slider" class="text-sm font-medium mb-1 block">Detail Level</label>
							<input
								id="detail-slider"
								type="range"
								min="0.1"
								max="1"
								step="0.1"
								value={config.detail}
								oninput={(e) => onConfigChange({ detail: parseFloat(e.currentTarget.value) })}
								disabled={isProcessing}
								class="w-full"
							/>
							<div class="flex justify-between text-xs text-muted-foreground mt-1">
								<span>Simple</span>
								<span>{Math.round(config.detail * 10)}/10</span>
								<span>Detailed</span>
							</div>
						</div>

						<div>
							<label for="stroke-width-slider" class="text-sm font-medium mb-1 block">Line Width</label>
							<input
								id="stroke-width-slider"
								type="range"
								min="0.5"
								max="5"
								step="0.1"
								value={config.stroke_width}
								oninput={(e) => onConfigChange({ stroke_width: parseFloat(e.currentTarget.value) })}
								disabled={isProcessing}
								class="w-full"
							/>
							<div class="flex justify-between text-xs text-muted-foreground mt-1">
								<span>Thin</span>
								<span>{config.stroke_width.toFixed(1)}px</span>
								<span>Thick</span>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Primary Action Button - Most Prominent -->
	{#if hasImages}
		<div class="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 rounded-lg border-2 border-dashed border-orange-200 dark:border-orange-800 p-6 text-center">
			<div class="space-y-4">
				<div>
					<h3 class="text-lg font-semibold text-orange-900 dark:text-orange-100">Ready to Convert</h3>
					<p class="text-sm text-orange-700 dark:text-orange-300">
						Transform your images into beautiful line art SVGs
					</p>
				</div>

				{#if isProcessing}
					<Button
						size="lg"
						variant="destructive"
						onclick={onAbort}
						class="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3"
					>
						<div class="flex items-center gap-2">
							<div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
							Stop Processing
						</div>
					</Button>
				{:else}
					<Button
						size="lg"
						onclick={onConvert}
						disabled={!canConvert}
						class="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold px-8 py-3"
					>
						<div class="flex items-center gap-2">
							<Play class="h-5 w-5" />
							Convert to SVG
						</div>
					</Button>
				{/if}

				{#if canDownload}
					<div class="flex items-center justify-center gap-3">
						<Button
							variant="outline"
							onclick={onDownload}
							class="flex items-center gap-2"
						>
							<Download class="h-4 w-4" />
							Download Result
						</Button>
						<Button
							variant="ghost"
							onclick={onReset}
							class="flex items-center gap-2 text-muted-foreground"
						>
							<RotateCcw class="h-4 w-4" />
							Start Over
						</Button>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Advanced Settings (Collapsible) -->
	<div class="rounded-lg border bg-card">
		<div class="p-4">
			<div class="flex items-center justify-between">
				<h3 class="font-medium flex items-center gap-2">
					<Settings class="h-4 w-4" />
					Advanced Settings
				</h3>
				<Button
					variant="ghost"
					size="sm"
					onclick={() => showAdvanced = !showAdvanced}
					aria-label={showAdvanced ? 'Hide advanced settings' : 'Show advanced settings'}
				>
					{#if showAdvanced}
						<ChevronUp class="h-4 w-4" />
					{:else}
						<ChevronDown class="h-4 w-4" />
					{/if}
				</Button>
			</div>

			{#if showAdvanced}
				<div class="mt-4 space-y-6">
					<!-- Essential Parameters Panel -->
					<ParameterPanel
						{config}
						onConfigChange={onConfigChange}
						disabled={isProcessing}
						onParameterChange={onParameterChange}
					/>

					<!-- Advanced Controls -->
					<AdvancedControls
						{config}
						onConfigChange={onConfigChange}
						disabled={isProcessing}
						onParameterChange={onParameterChange}
					/>
				</div>
			{/if}
		</div>
	</div>

	<!-- Mobile Sticky Action Bar -->
	<div class="fixed bottom-0 left-0 right-0 p-4 bg-background border-t lg:hidden z-40" class:hidden={!hasImages}>
		<div class="flex items-center gap-3">
			<Button
				class="flex-1"
				onclick={onConvert}
				disabled={!canConvert}
			>
				{#if isProcessing}
					<div class="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
					Converting...
				{:else}
					<Play class="h-4 w-4 mr-2" />
					Convert
				{/if}
			</Button>

			{#if canDownload}
				<Button
					variant="outline"
					onclick={onDownload}
				>
					<Download class="h-4 w-4" />
				</Button>
			{/if}

			<Button
				variant="outline"
				onclick={() => isMobileSettingsOpen = !isMobileSettingsOpen}
				aria-label="Toggle settings"
			>
				<Settings class="h-4 w-4" />
			</Button>
		</div>
	</div>

	<!-- Mobile Settings Overlay -->
	{#if isMobileSettingsOpen}
		<div class="fixed inset-0 bg-background z-50 overflow-y-auto lg:hidden">
			<div class="p-4 space-y-6">
				<!-- Header -->
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-semibold">Conversion Settings</h2>
					<Button
						variant="ghost"
						onclick={() => isMobileSettingsOpen = false}
					>
						Done
					</Button>
				</div>

				<!-- Mobile Settings Content -->
				<div class="space-y-6">
					<!-- Preset Selection -->
					<PresetSelector
						{selectedPreset}
						onPresetChange={onPresetChange}
						disabled={isProcessing}
						isCustom={selectedPreset === 'custom'}
					/>

					<!-- Backend Selection -->
					<BackendSelector
						selectedBackend={config.backend}
						onBackendChange={onBackendChange}
						disabled={isProcessing}
					/>

					<!-- Essential Parameters -->
					<ParameterPanel
						{config}
						onConfigChange={onConfigChange}
						disabled={isProcessing}
						onParameterChange={onParameterChange}
					/>

					<!-- Advanced Controls -->
					<AdvancedControls
						{config}
						onConfigChange={onConfigChange}
						disabled={isProcessing}
						onParameterChange={onParameterChange}
					/>
				</div>

				<!-- Mobile Bottom Padding -->
				<div class="h-20"></div>
			</div>
		</div>
	{/if}
</div>

<style>
	/* Add safe area padding for mobile */
	@supports (padding-bottom: env(safe-area-inset-bottom)) {
		.fixed.bottom-0 {
			padding-bottom: calc(1rem + env(safe-area-inset-bottom));
		}
	}
</style>