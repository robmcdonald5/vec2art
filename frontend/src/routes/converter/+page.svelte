<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/ui/button.svelte';
	import FileDropzone from '$lib/components/ui/file-dropzone.svelte';
	import ProgressBar from '$lib/components/ui/progress-bar.svelte';
	import {
		Upload,
		Settings,
		Download,
		Image,
		AlertCircle,
		CheckCircle,
		Loader2
	} from 'lucide-svelte';
	import { vectorizerStore } from '$lib/stores/vectorizer.svelte';
	import ErrorBoundary from '$lib/components/ui/error-boundary.svelte';
	import type { VectorizerBackend, VectorizerPreset } from '$lib/types/vectorizer';
	import { BACKEND_DESCRIPTIONS, PRESET_DESCRIPTIONS } from '$lib/types/vectorizer';

	// Reactive state from store
	let store = vectorizerStore;

	// Accessibility state
	let announceText = $state<string>('');
	let processingAnnouncement = $state<string>('');

	// Announce processing status changes to screen readers
	function announceProcessingStatus(status: string) {
		processingAnnouncement = status;
		setTimeout(() => {
			processingAnnouncement = '';
		}, 1000);
	}

	function announceToScreenReader(message: string) {
		announceText = message;
		setTimeout(() => {
			announceText = '';
		}, 1000);
	}

	let selectedPreset = $state<VectorizerPreset | 'custom'>('sketch');
	let previewSvgUrl = $state<string | null>(null);

	// Smart initialization state
	let isInitializing = $state(false);
	let selectedPerformanceMode = $state<string>('balanced');
	let hasUserInitiatedConversion = $state(false);

	// Initialize WASM without threads (lazy loading)
	onMount(async () => {
		try {
			// Only load WASM module, don't initialize threads
			await store.initialize({ autoInitThreads: false });
			console.log('WASM module loaded (threads not initialized)');
		} catch (error) {
			console.error('Failed to load WASM module:', error);
		}
	});

	// Initialize threads on-demand for conversions
	async function initializeThreadsForConversion(): Promise<boolean> {
		if (store.threadsInitialized) {
			return true;
		}

		isInitializing = true;
		announceProcessingStatus('Initializing converter for optimal performance...');

		try {
			// Determine optimal thread count based on system capabilities
			const cores = navigator.hardwareConcurrency || 4;
			const optimalThreadCount = Math.min(Math.max(1, cores - 1), 8); // Leave 1 core free, max 8
			
			console.log(`Auto-initializing with ${optimalThreadCount} threads for conversion`);
			const success = await store.initializeThreads(optimalThreadCount);

			if (!success) {
				console.warn('Thread pool initialization failed, will use single-threaded mode');
				announceProcessingStatus('Using single-threaded mode');
				// Still return true as single-threaded mode is valid
				return true;
			} else {
				console.log(`Successfully initialized ${optimalThreadCount} threads`);
				selectedPerformanceMode = cores > 4 ? 'performance' : 'balanced';
				announceProcessingStatus(`Converter ready with ${optimalThreadCount} threads`);
				return true;
			}
		} catch (error) {
			console.error('Failed to initialize thread pool:', error);
			announceProcessingStatus('Using fallback processing mode');
			// Still return true to allow single-threaded processing
			return true;
		} finally {
			isInitializing = false;
		}
	}

	function handleFileSelect(file: File | null) {
		if (file) {
			// File upload doesn't need threading - just store the file
			store.setInputFile(file);
			announceToScreenReader(`File selected: ${file.name}`);
		} else {
			store.clearInput();
			announceToScreenReader('File removed');
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
		announceToScreenReader(`Algorithm changed to ${target.value.replace('_', ' ')}`);
	}

	function handlePresetChange(preset: VectorizerPreset | 'custom') {
		selectedPreset = preset;
		if (preset !== 'custom') {
			store.usePreset(preset);
			announceToScreenReader(`Preset changed to ${preset.replace('_', ' ')}`);
		} else {
			announceToScreenReader('Custom settings mode enabled');
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
		hasUserInitiatedConversion = true;
		
		// Initialize threads if not already done (lazy initialization)
		if (!store.threadsInitialized) {
			const initialized = await initializeThreadsForConversion();
			if (!initialized) {
				console.error('Failed to initialize converter');
				return;
			}
		}
		
		announceProcessingStatus('Starting image conversion');
		try {
			const result = await store.processImage();

			// Create blob URL for preview
			if (previewSvgUrl) {
				URL.revokeObjectURL(previewSvgUrl);
			}
			const blob = new Blob([result.svg], { type: 'image/svg+xml' });
			previewSvgUrl = URL.createObjectURL(blob);

			announceProcessingStatus('Conversion completed successfully');
		} catch (error) {
			// Error is already handled by the store
			console.error('Conversion failed:', error);
			announceProcessingStatus('Conversion failed');
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

		// Downloads don't need threading - just use the already processed result
		const blob = new Blob([store.lastResult.svg], { type: 'image/svg+xml' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${store.inputFile?.name.replace(/\.[^/.]+$/, '') || 'converted'}.svg`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		announceToScreenReader('SVG file downloaded');
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

	// Can convert as long as we have an image and valid config (threads will initialize on-demand)
	const canConvert = $derived(
		store.inputImage && store.isConfigValid() && !store.isProcessing && !isInitializing
	);
	const canDownload = $derived(store.lastResult && !store.isProcessing);
	const stats = $derived(store.getStats());
</script>

<div class="mx-auto max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8">
	<!-- Live regions for screen reader announcements -->
	<div aria-live="polite" aria-atomic="true" class="sr-only">
		{announceText}
	</div>
	<div aria-live="assertive" aria-atomic="true" class="sr-only">
		{processingAnnouncement}
	</div>

	<!-- Header -->
	<header class="mb-8">
		<h1
			class="bg-gradient-to-r from-orange-800 to-red-700 bg-clip-text text-3xl font-bold text-transparent dark:from-purple-400 dark:to-blue-400"
		>
			Image to SVG Converter
		</h1>
		<p class="text-muted-foreground mt-2">
			Transform any raster image into expressive line art SVGs
		</p>

		<!-- Initialization Status -->
		{#if !store.wasmLoaded}
			<div
				class="text-muted-foreground mt-4 flex items-center gap-2 text-sm"
				role="status"
				aria-label="Loading converter module"
			>
				<Loader2 class="h-4 w-4 animate-spin" aria-hidden="true" />
				Loading converter module...
			</div>
		{:else if store.capabilities}
			<div class="mt-4 flex items-center gap-2 text-sm" role="status" aria-label="Converter status">
				{#if store.threadsInitialized && store.capabilities.threading_supported}
					<CheckCircle class="h-4 w-4 text-green-500" aria-hidden="true" />
					<span class="text-green-700 dark:text-green-400">
						High-performance mode active ({store.requestedThreadCount || store.capabilities.hardware_concurrency} threads)
					</span>
				{:else if store.threadsInitialized}
					<AlertCircle class="h-4 w-4 text-yellow-500" aria-hidden="true" />
					<span class="text-yellow-700 dark:text-yellow-400">Single-threaded mode active</span>
				{:else}
					<CheckCircle class="h-4 w-4 text-blue-500" aria-hidden="true" />
					<span class="text-blue-700 dark:text-blue-400">Converter ready</span>
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
					<div
						class="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950"
					>
						<h4 class="mb-2 font-medium text-blue-700 dark:text-blue-400">Suggestions:</h4>
						<ul class="space-y-1 text-sm text-blue-600 dark:text-blue-300">
							{#each suggestions as suggestion}
								<li>• {suggestion}</li>
							{/each}
						</ul>
						<div class="mt-3 flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onclick={handleResetAll}
								class="border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-400"
							>
								Reset All
							</Button>
							<Button
								variant="outline"
								size="sm"
								onclick={() => store.resetConfig()}
								class="border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-400"
							>
								Reset Settings
							</Button>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</header>

	<!-- Main Converter Interface -->
	<main class="grid gap-8 lg:grid-cols-3">
		<!-- Upload and Preview Area -->
		<section class="lg:col-span-2" aria-labelledby="upload-preview-heading">
			<h2 id="upload-preview-heading" class="sr-only">Upload and Preview</h2>

			<!-- Upload Area -->
			<FileDropzone
				onFileSelect={handleFileSelect}
				currentFile={store.inputFile}
				disabled={store.isProcessing}
			/>

			<!-- Preview Area -->
			<section class="mt-6 rounded-lg border" aria-labelledby="preview-heading">
				<header class="border-b p-4">
					<div class="flex items-center justify-between">
						<h3 id="preview-heading" class="font-semibold">Preview</h3>
						{#if store.inputImage}
							<span class="text-muted-foreground text-sm" aria-label="Image dimensions">
								{store.inputImage.width}×{store.inputImage.height}
							</span>
						{/if}
					</div>
				</header>
				<div
					class="bg-muted/30 flex aspect-video items-center justify-center p-4"
					role="img"
					aria-label="Image preview area"
				>
					{#if isInitializing}
						<!-- Initialization State -->
						<div
							class="w-full max-w-md space-y-4 text-center"
							role="status"
							aria-live="polite"
							aria-label="Initializing converter"
						>
							<Loader2 class="text-primary mx-auto h-12 w-12 animate-spin" aria-hidden="true" />
							<div class="space-y-2">
								<p class="font-medium">Initializing high-performance converter...</p>
								<p class="text-muted-foreground text-sm">
									Setting up optimal processing with {navigator.hardwareConcurrency || 4} CPU cores
								</p>
							</div>
						</div>
					{:else if store.isProcessing && store.currentProgress}
						<!-- Processing State -->
						<div
							class="w-full max-w-md space-y-4 text-center"
							role="status"
							aria-live="polite"
							aria-label="Processing status"
						>
							<Loader2 class="text-primary mx-auto h-12 w-12 animate-spin" aria-hidden="true" />
							<div class="space-y-2">
								<p class="font-medium" id="processing-stage">{store.currentProgress.stage}</p>
								<ProgressBar
									value={store.currentProgress.progress}
									label="Processing..."
									showValue={true}
									id="main-progress"
								/>
								<p class="text-muted-foreground text-sm" aria-describedby="processing-stage">
									{Math.round(store.currentProgress.elapsed_ms / 1000)}s elapsed
									{#if store.currentProgress.estimated_remaining_ms}
										• ~{Math.round(store.currentProgress.estimated_remaining_ms / 1000)}s remaining
									{/if}
								</p>
							</div>
						</div>
					{:else if previewSvgUrl}
						<!-- Result Preview -->
						<div class="flex h-full w-full items-center justify-center">
							<img
								src={previewSvgUrl}
								alt="Converted SVG line art from {store.inputFile?.name || 'uploaded image'}"
								class="max-h-full max-w-full object-contain"
							/>
						</div>
					{:else if store.inputFile}
						<!-- Input Image Preview -->
						<div class="flex h-full w-full items-center justify-center">
							<img
								src={URL.createObjectURL(store.inputFile)}
								alt="Original image: {store.inputFile.name}"
								class="max-h-full max-w-full object-contain"
							/>
						</div>
					{:else}
						<!-- Empty State -->
						<div class="text-center" role="status">
							<Image class="text-muted-foreground mx-auto h-12 w-12" aria-hidden="true" />
							<p class="text-muted-foreground mt-2 text-sm">Upload an image to see the preview</p>
						</div>
					{/if}
				</div>
			</section>
		</section>

		<!-- Controls Panel -->
		<aside class="space-y-6" aria-labelledby="controls-heading">
			<h2 id="controls-heading" class="sr-only">Conversion Settings</h2>

			<!-- Preset Selection -->
			<section class="rounded-lg border p-4" aria-labelledby="presets-heading">
				<h3 id="presets-heading" class="mb-3 font-semibold">Style Presets</h3>
				<fieldset class="grid grid-cols-2 gap-2">
					<legend class="sr-only">Choose a style preset</legend>
					{#each Object.entries(PRESET_DESCRIPTIONS) as [preset, description]}
						<button
							class="rounded border p-2 text-left text-sm transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none
								{selectedPreset === preset
								? 'border-primary bg-primary/10'
								: 'border-muted hover:border-primary/50'}"
							onclick={() => handlePresetChange(preset as VectorizerPreset)}
							disabled={store.isProcessing}
							aria-pressed={selectedPreset === preset}
							aria-describedby="preset-{preset}-desc"
						>
							<div class="font-medium capitalize">{preset.replace('_', ' ')}</div>
							<div id="preset-{preset}-desc" class="sr-only">{description}</div>
						</button>
					{/each}
					<button
						class="rounded border p-2 text-left text-sm transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none
							{selectedPreset === 'custom'
							? 'border-primary bg-primary/10'
							: 'border-muted hover:border-primary/50'}"
						onclick={() => handlePresetChange('custom')}
						disabled={store.isProcessing}
						aria-pressed={selectedPreset === 'custom'}
						aria-describedby="preset-custom-desc"
					>
						<div class="font-medium">Custom</div>
						<div id="preset-custom-desc" class="sr-only">Create your own custom settings</div>
					</button>
				</fieldset>
			</section>

			<!-- Algorithm Selection -->
			<section class="rounded-lg border p-4" aria-labelledby="algorithm-heading">
				<h3 id="algorithm-heading" class="flex items-center gap-2 font-semibold">
					<Settings class="h-4 w-4" aria-hidden="true" />
					Algorithm
				</h3>
				<fieldset class="mt-3 space-y-3">
					<legend class="sr-only">Choose conversion algorithm</legend>
					{#each Object.entries(BACKEND_DESCRIPTIONS) as [backend, description]}
						<label class="flex cursor-pointer items-start gap-3">
							<input
								type="radio"
								name="algorithm"
								value={backend}
								checked={store.config.backend === backend}
								onchange={handleBackendChange}
								disabled={store.isProcessing}
								class="text-primary mt-0.5 focus:ring-2 focus:ring-blue-500"
								aria-describedby="backend-{backend}-desc"
							/>
							<div class="flex-1">
								<span class="text-sm font-medium capitalize">{backend.replace('_', ' ')}</span>
								<p id="backend-{backend}-desc" class="text-muted-foreground mt-1 text-xs">
									{description}
								</p>
							</div>
						</label>
					{/each}
				</fieldset>
			</section>

			<!-- Quality Settings -->
			<section class="rounded-lg border p-4" aria-labelledby="quality-heading">
				<h3 id="quality-heading" class="font-semibold">Quality Settings</h3>
				<div class="mt-3 space-y-4">
					<div>
						<div class="flex justify-between">
							<label for="detail-level" class="text-sm font-medium">Detail Level</label>
							<span class="text-muted-foreground text-sm" aria-live="polite"
								>{store.config.detail}</span
							>
						</div>
						<input
							id="detail-level"
							type="range"
							min="1"
							max="10"
							value={store.config.detail}
							onchange={handleDetailChange}
							oninput={() => announceToScreenReader(`Detail level set to ${store.config.detail}`)}
							disabled={store.isProcessing}
							class="mt-1 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
							aria-describedby="detail-level-desc"
						/>
						<div id="detail-level-desc" class="sr-only">
							Controls the amount of detail captured. Higher values capture more details but may
							include noise.
						</div>
					</div>
					<div>
						<div class="flex justify-between">
							<label for="smoothness" class="text-sm font-medium">Smoothness</label>
							<span class="text-muted-foreground text-sm" aria-live="polite"
								>{Math.round((2.0 - store.config.stroke_width) / 0.15) + 1}</span
							>
						</div>
						<input
							id="smoothness"
							type="range"
							min="1"
							max="10"
							value={Math.round((2.0 - store.config.stroke_width) / 0.15) + 1}
							onchange={handleSmoothnessChange}
							oninput={() =>
								announceToScreenReader(
									`Smoothness set to ${Math.round((2.0 - store.config.stroke_width) / 0.15) + 1}`
								)}
							disabled={store.isProcessing}
							class="mt-1 w-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
							aria-describedby="smoothness-desc"
						/>
						<div id="smoothness-desc" class="sr-only">
							Controls line smoothness. Higher values create smoother, more flowing lines.
						</div>
					</div>
				</div>
			</section>

			<!-- Artistic Effects -->
			<section class="rounded-lg border p-4" aria-labelledby="effects-heading">
				<h3 id="effects-heading" class="font-semibold">Artistic Effects</h3>
				<fieldset class="mt-3 space-y-3">
					<legend class="sr-only">Enable artistic effects</legend>
					<label class="flex cursor-pointer items-center gap-2">
						<input
							type="checkbox"
							checked={store.config.hand_drawn_style}
							onchange={(e) => handleArtisticEffect('hand_drawn_style', e)}
							disabled={store.isProcessing}
							class="text-primary focus:ring-2 focus:ring-blue-500"
							aria-describedby="hand-drawn-desc"
						/>
						<span class="text-sm">Hand-drawn style</span>
						<div id="hand-drawn-desc" class="sr-only">
							Adds natural hand-drawn characteristics with slight irregularities
						</div>
					</label>
					<label class="flex cursor-pointer items-center gap-2">
						<input
							type="checkbox"
							checked={store.config.variable_weights}
							onchange={(e) => handleArtisticEffect('variable_weights', e)}
							disabled={store.isProcessing}
							class="text-primary focus:ring-2 focus:ring-blue-500"
							aria-describedby="variable-weights-desc"
						/>
						<span class="text-sm">Variable line weights</span>
						<div id="variable-weights-desc" class="sr-only">
							Creates lines with varying thickness for more expressive results
						</div>
					</label>
					<label class="flex cursor-pointer items-center gap-2">
						<input
							type="checkbox"
							checked={store.config.tremor_effects}
							onchange={(e) => handleArtisticEffect('tremor_effects', e)}
							disabled={store.isProcessing}
							class="text-primary focus:ring-2 focus:ring-blue-500"
							aria-describedby="tremor-desc"
						/>
						<span class="text-sm">Tremor effects</span>
						<div id="tremor-desc" class="sr-only">
							Adds subtle tremor for organic, human-like line quality
						</div>
					</label>
				</fieldset>
			</section>

			<!-- Action Buttons -->
			<section class="space-y-3" aria-labelledby="actions-heading">
				<h3 id="actions-heading" class="sr-only">Actions</h3>
				<Button
					class="w-full focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
					size="lg"
					disabled={!canConvert}
					onclick={handleConvert}
					aria-describedby={!canConvert ? 'convert-requirements' : undefined}
				>
					{#if store.isProcessing}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
						Processing...
					{:else if !store.threadsInitialized}
						Initialize Converter First
					{:else}
						Convert to SVG
					{/if}
				</Button>
				{#if !canConvert}
					<div id="convert-requirements" class="sr-only">
						{#if !store.inputImage}
							Upload an image first.
						{:else if !store.threadsInitialized}
							Initialize the converter first.
						{:else if !store.isConfigValid()}
							Check your settings configuration.
						{/if}
					</div>
				{/if}
				<Button
					variant="outline"
					class="w-full gap-2 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
					disabled={!canDownload}
					onclick={handleDownload}
					aria-describedby={!canDownload ? 'download-requirements' : undefined}
				>
					<Download class="h-4 w-4" aria-hidden="true" />
					Download SVG
				</Button>
				{#if !canDownload}
					<div id="download-requirements" class="sr-only">
						Convert an image first to download the result.
					</div>
				{/if}
			</section>

			<!-- Processing Info -->
			<section class="rounded-lg border p-4" aria-labelledby="processing-info-heading">
				<h3 id="processing-info-heading" class="font-semibold">Processing Info</h3>
				<div
					class="text-muted-foreground mt-2 space-y-1 text-xs"
					role="list"
					aria-label="Processing statistics"
				>
					{#if stats.processing_time}
						<p role="listitem">• Processing time: {Math.round(stats.processing_time)}ms</p>
					{:else}
						<p role="listitem">• Processing time: ~1.5s</p>
					{/if}
					{#if stats.input_size}
						<p role="listitem">• Input size: {stats.input_size}</p>
					{/if}
					{#if stats.output_size}
						<p role="listitem">• Output size: {stats.output_size}</p>
					{/if}
					{#if stats.compression_ratio}
						<p role="listitem">• Compression: {(stats.compression_ratio * 100).toFixed(1)}%</p>
					{/if}
					<p role="listitem">• Output format: SVG</p>
					<p role="listitem">• Client-side processing</p>
				</div>
			</section>
		</aside>
	</main>
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
