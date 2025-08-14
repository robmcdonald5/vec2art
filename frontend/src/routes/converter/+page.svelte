<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/ui/button.svelte';
	import FileDropzone from '$lib/components/ui/file-dropzone.svelte';
	import ProgressBar from '$lib/components/ui/progress-bar.svelte';
	import { Upload, Settings, Download, Image, AlertCircle, CheckCircle, Loader2 } from 'lucide-svelte';
	import { vectorizerStore } from '$lib/stores/vectorizer.svelte';
	import ErrorBoundary from '$lib/components/ui/error-boundary.svelte';
	import type { VectorizerBackend, VectorizerPreset } from '$lib/types/vectorizer';
	import { BACKEND_DESCRIPTIONS, PRESET_DESCRIPTIONS } from '$lib/types/vectorizer';

	// Reactive state from store
	let store = vectorizerStore;
	
	let selectedPreset = $state<VectorizerPreset | 'custom'>('sketch');
	let previewSvgUrl = $state<string | null>(null);

	onMount(async () => {
		try {
			await store.initialize();
		} catch (error) {
			console.error('Failed to initialize vectorizer:', error);
		}
	});

	function handleFileSelect(file: File | null) {
		if (file) {
			store.setInputFile(file);
		} else {
			store.clearInput();
		}
		// Clear previous result when new file is selected
		if (previewSvgUrl) {
			URL.revokeObjectURL(previewSvgUrl);
			previewSvgUrl = null;
		}
	}

	function handleBackendChange(event: Event) {
		const target = event.target as HTMLInputElement;
		store.updateConfig({ backend: target.value as VectorizerBackend });
	}

	function handlePresetChange(preset: VectorizerPreset | 'custom') {
		selectedPreset = preset;
		if (preset !== 'custom') {
			store.usePreset(preset);
		}
	}

	function handleDetailChange(event: Event) {
		const target = event.target as HTMLInputElement;
		store.updateConfig({ detail: parseInt(target.value) });
		if (selectedPreset !== 'custom') {
			selectedPreset = 'custom';
		}
	}

	function handleSmoothnessChange(event: Event) {
		const target = event.target as HTMLInputElement;
		// Map smoothness to stroke width (inverted - higher smoothness = lower stroke width)
		const smoothness = parseInt(target.value);
		const strokeWidth = 2.0 - (smoothness - 1) * 0.15; // Range from 0.5 to 2.0
		store.updateConfig({ stroke_width: Math.max(0.5, Math.min(2.0, strokeWidth)) });
		if (selectedPreset !== 'custom') {
			selectedPreset = 'custom';
		}
	}

	function handleArtisticEffect(property: string, event: Event) {
		const target = event.target as HTMLInputElement;
		store.updateConfig({ [property]: target.checked } as any);
		if (selectedPreset !== 'custom') {
			selectedPreset = 'custom';
		}
	}

	async function handleConvert() {
		try {
			const result = await store.processImage();
			
			// Create blob URL for preview
			if (previewSvgUrl) {
				URL.revokeObjectURL(previewSvgUrl);
			}
			const blob = new Blob([result.svg], { type: 'image/svg+xml' });
			previewSvgUrl = URL.createObjectURL(blob);
			
		} catch (error) {
			// Error is already handled by the store
			console.error('Conversion failed:', error);
		}
	}

	async function handleRetryOperation() {
		try {
			await store.retryLastOperation();
		} catch (error) {
			console.error('Retry failed:', error);
		}
	}

	function handleResetAll() {
		if (previewSvgUrl) {
			URL.revokeObjectURL(previewSvgUrl);
			previewSvgUrl = null;
		}
		store.reset();
	}

	function handleDownload() {
		if (!store.lastResult) return;
		
		const blob = new Blob([store.lastResult.svg], { type: 'image/svg+xml' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${store.inputFile?.name.replace(/\.[^/.]+$/, '') || 'converted'}.svg`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	// Derived values
	$effect(() => {
		// Clean up blob URL when component is destroyed
		return () => {
			if (previewSvgUrl) {
				URL.revokeObjectURL(previewSvgUrl);
			}
		};
	});

	const canConvert = $derived(store.inputImage && store.isConfigValid() && !store.isProcessing);
	const canDownload = $derived(store.lastResult && !store.isProcessing);
	const stats = $derived(store.getStats());
</script>

<div class="mx-auto max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold bg-gradient-to-r from-orange-800 to-red-700 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">Image to SVG Converter</h1>
		<p class="text-muted-foreground mt-2">
			Transform any raster image into expressive line art SVGs
		</p>
		
		<!-- Initialization Status -->
		{#if !store.isInitialized}
			<div class="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
				<Loader2 class="h-4 w-4 animate-spin" />
				Initializing vectorizer...
			</div>
		{:else if store.capabilities}
			<div class="mt-4 flex items-center gap-2 text-sm">
				{#if store.capabilities.threading_supported}
					<CheckCircle class="h-4 w-4 text-green-500" />
					<span class="text-green-700 dark:text-green-400">Multi-threading enabled ({store.capabilities.hardware_concurrency} cores)</span>
				{:else}
					<AlertCircle class="h-4 w-4 text-yellow-500" />
					<span class="text-yellow-700 dark:text-yellow-400">Single-threaded mode (CORS headers required for multi-threading)</span>
				{/if}
			</div>
		{/if}

		<!-- Enhanced Error Display -->
		{#if store.hasError && store.error}
			<div class="mt-4">
				<ErrorBoundary
					error={new Error(store.getErrorMessage())}
					title="Vectorizer Error"
					description={store.error.details}
					showRetry={true}
					showDismiss={true}
					onRetry={handleRetryOperation}
					onDismiss={() => store.clearError()}
					variant="error"
				/>
				
				<!-- Recovery Suggestions -->
				{#if store.getRecoverySuggestions().length > 0}
					{@const suggestions = store.getRecoverySuggestions()}
					<div class="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
						<h4 class="font-medium text-blue-700 dark:text-blue-400 mb-2">Suggestions:</h4>
						<ul class="text-sm text-blue-600 dark:text-blue-300 space-y-1">
							{#each suggestions as suggestion}
								<li>• {suggestion}</li>
							{/each}
						</ul>
						<div class="mt-3 flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onclick={handleResetAll}
								class="text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-600"
							>
								Reset All
							</Button>
							<Button
								variant="outline"
								size="sm"
								onclick={() => store.resetConfig()}
								class="text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-600"
							>
								Reset Settings
							</Button>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Main Converter Interface -->
	<div class="grid gap-8 lg:grid-cols-3">
		<!-- Upload and Preview Area -->
		<div class="lg:col-span-2">
			<!-- Upload Area -->
			<FileDropzone 
				onFileSelect={handleFileSelect}
				currentFile={store.inputFile}
				disabled={store.isProcessing}
			/>

			<!-- Preview Area -->
			<div class="mt-6 rounded-lg border">
				<div class="border-b p-4">
					<div class="flex items-center justify-between">
						<h3 class="font-semibold">Preview</h3>
						{#if store.inputImage}
							<span class="text-sm text-muted-foreground">
								{store.inputImage.width}×{store.inputImage.height}
							</span>
						{/if}
					</div>
				</div>
				<div class="aspect-video bg-muted/30 flex items-center justify-center p-4">
					{#if store.isProcessing && store.currentProgress}
						<!-- Processing State -->
						<div class="w-full max-w-md space-y-4 text-center">
							<Loader2 class="mx-auto h-12 w-12 animate-spin text-primary" />
							<div class="space-y-2">
								<p class="font-medium">{store.currentProgress.stage}</p>
								<ProgressBar 
									value={store.currentProgress.progress} 
									label="Processing..." 
									showValue={true}
								/>
								<p class="text-sm text-muted-foreground">
									{Math.round(store.currentProgress.elapsed_ms / 1000)}s elapsed
									{#if store.currentProgress.estimated_remaining_ms}
										• ~{Math.round(store.currentProgress.estimated_remaining_ms / 1000)}s remaining
									{/if}
								</p>
							</div>
						</div>
					{:else if previewSvgUrl}
						<!-- Result Preview -->
						<div class="h-full w-full flex items-center justify-center">
							<img 
								src={previewSvgUrl} 
								alt="Converted SVG" 
								class="max-h-full max-w-full object-contain"
							/>
						</div>
					{:else if store.inputFile}
						<!-- Input Image Preview -->
						<div class="h-full w-full flex items-center justify-center">
							<img 
								src={URL.createObjectURL(store.inputFile)} 
								alt="Input" 
								class="max-h-full max-w-full object-contain"
							/>
						</div>
					{:else}
						<!-- Empty State -->
						<div class="text-center">
							<Image class="text-muted-foreground mx-auto h-12 w-12" />
							<p class="text-muted-foreground mt-2 text-sm">
								Upload an image to see the preview
							</p>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Controls Panel -->
		<div class="space-y-6">
			<!-- Preset Selection -->
			<div class="rounded-lg border p-4">
				<h3 class="font-semibold mb-3">Style Presets</h3>
				<div class="grid grid-cols-2 gap-2">
					{#each Object.entries(PRESET_DESCRIPTIONS) as [preset, description]}
						<button
							class="p-2 text-left text-sm rounded border transition-colors
								{selectedPreset === preset ? 'border-primary bg-primary/10' : 'border-muted hover:border-primary/50'}"
							onclick={() => handlePresetChange(preset as VectorizerPreset)}
							disabled={store.isProcessing}
						>
							<div class="font-medium capitalize">{preset.replace('_', ' ')}</div>
						</button>
					{/each}
					<button
						class="p-2 text-left text-sm rounded border transition-colors
							{selectedPreset === 'custom' ? 'border-primary bg-primary/10' : 'border-muted hover:border-primary/50'}"
						onclick={() => handlePresetChange('custom')}
						disabled={store.isProcessing}
					>
						<div class="font-medium">Custom</div>
					</button>
				</div>
			</div>

			<!-- Algorithm Selection -->
			<div class="rounded-lg border p-4">
				<h3 class="flex items-center gap-2 font-semibold">
					<Settings class="h-4 w-4" />
					Algorithm
				</h3>
				<div class="mt-3 space-y-3">
					{#each Object.entries(BACKEND_DESCRIPTIONS) as [backend, description]}
						<label class="flex items-start gap-3">
							<input 
								type="radio" 
								name="algorithm" 
								value={backend}
								checked={store.config.backend === backend}
								onchange={handleBackendChange}
								disabled={store.isProcessing}
								class="text-primary mt-0.5" 
							/>
							<div class="flex-1">
								<span class="text-sm font-medium capitalize">{backend.replace('_', ' ')}</span>
								<p class="text-xs text-muted-foreground mt-1">{description}</p>
							</div>
						</label>
					{/each}
				</div>
			</div>

			<!-- Quality Settings -->
			<div class="rounded-lg border p-4">
				<h3 class="font-semibold">Quality Settings</h3>
				<div class="mt-3 space-y-4">
					<div>
						<div class="flex justify-between">
							<label for="detail-level" class="text-sm font-medium">Detail Level</label>
							<span class="text-sm text-muted-foreground">{store.config.detail}</span>
						</div>
						<input 
							id="detail-level" 
							type="range" 
							min="1" 
							max="10" 
							value={store.config.detail}
							onchange={handleDetailChange}
							disabled={store.isProcessing}
							class="mt-1 w-full" 
						/>
					</div>
					<div>
						<div class="flex justify-between">
							<label for="smoothness" class="text-sm font-medium">Smoothness</label>
							<span class="text-sm text-muted-foreground">{Math.round((2.0 - store.config.stroke_width) / 0.15) + 1}</span>
						</div>
						<input 
							id="smoothness" 
							type="range" 
							min="1" 
							max="10" 
							value={Math.round((2.0 - store.config.stroke_width) / 0.15) + 1}
							onchange={handleSmoothnessChange}
							disabled={store.isProcessing}
							class="mt-1 w-full" 
						/>
					</div>
				</div>
			</div>

			<!-- Artistic Effects -->
			<div class="rounded-lg border p-4">
				<h3 class="font-semibold">Artistic Effects</h3>
				<div class="mt-3 space-y-3">
					<label class="flex items-center gap-2">
						<input 
							type="checkbox" 
							checked={store.config.hand_drawn_style}
							onchange={(e) => handleArtisticEffect('hand_drawn_style', e)}
							disabled={store.isProcessing}
							class="text-primary" 
						/>
						<span class="text-sm">Hand-drawn style</span>
					</label>
					<label class="flex items-center gap-2">
						<input 
							type="checkbox" 
							checked={store.config.variable_weights}
							onchange={(e) => handleArtisticEffect('variable_weights', e)}
							disabled={store.isProcessing}
							class="text-primary" 
						/>
						<span class="text-sm">Variable line weights</span>
					</label>
					<label class="flex items-center gap-2">
						<input 
							type="checkbox" 
							checked={store.config.tremor_effects}
							onchange={(e) => handleArtisticEffect('tremor_effects', e)}
							disabled={store.isProcessing}
							class="text-primary" 
						/>
						<span class="text-sm">Tremor effects</span>
					</label>
				</div>
			</div>

			<!-- Action Buttons -->
			<div class="space-y-3">
				<Button 
					class="w-full" 
					size="lg"
					disabled={!canConvert}
					onclick={handleConvert}
				>
					{#if store.isProcessing}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						Processing...
					{:else}
						Convert to SVG
					{/if}
				</Button>
				<Button 
					variant="outline" 
					class="w-full gap-2" 
					disabled={!canDownload}
					onclick={handleDownload}
				>
					<Download class="h-4 w-4" />
					Download SVG
				</Button>
			</div>

			<!-- Processing Info -->
			<div class="rounded-lg border p-4">
				<h3 class="font-semibold">Processing Info</h3>
				<div class="text-muted-foreground mt-2 space-y-1 text-xs">
					{#if stats.processing_time}
						<p>• Processing time: {Math.round(stats.processing_time)}ms</p>
					{:else}
						<p>• Processing time: ~1.5s</p>
					{/if}
					{#if stats.input_size}
						<p>• Input size: {stats.input_size}</p>
					{/if}
					{#if stats.output_size}
						<p>• Output size: {stats.output_size}</p>
					{/if}
					{#if stats.compression_ratio}
						<p>• Compression: {(stats.compression_ratio * 100).toFixed(1)}%</p>
					{/if}
					<p>• Output format: SVG</p>
					<p>• Client-side processing</p>
				</div>
			</div>
		</div>
	</div>
</div>