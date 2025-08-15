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
	import type { VectorizerBackend, VectorizerPreset, VectorizerConfig } from '$lib/types/vectorizer';
	import { PRESET_CONFIGS } from '$lib/types/vectorizer';

	// Import new component system
	import BackendSelector from '$lib/components/converter/BackendSelector.svelte';
	import PresetSelector from '$lib/components/converter/PresetSelector.svelte';
	import ParameterPanel from '$lib/components/converter/ParameterPanel.svelte';
	import AdvancedControls from '$lib/components/converter/AdvancedControls.svelte';
	import MobileControlsSheet from '$lib/components/converter/MobileControlsSheet.svelte';

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

	// Mobile controls state
	let showMobileControls = $state(false);

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

	function handleBackendChange(backend: VectorizerBackend) {
		store.updateConfig({ backend });
		announceToScreenReader(`Algorithm changed to ${backend.replace('_', ' ')}`);
		if (selectedPreset !== 'custom') {
			selectedPreset = 'custom';
		}
	}

	function handlePresetChange(preset: VectorizerPreset | 'custom') {
		selectedPreset = preset;
		if (preset !== 'custom' && PRESET_CONFIGS[preset]) {
			// Apply preset configuration
			const presetConfig = PRESET_CONFIGS[preset];
			store.updateConfig(presetConfig);
			announceToScreenReader(`Preset changed to ${preset}`);
		} else {
			announceToScreenReader('Custom settings mode enabled');
		}
	}

	function handleParameterChange() {
		// Switch to custom mode when any parameter is changed
		if (selectedPreset !== 'custom') {
			selectedPreset = 'custom';
		}
	}

	function handleConfigChange(updates: Partial<VectorizerConfig>) {
		store.updateConfig(updates);
		handleParameterChange();
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
						High-performance mode active ({store.requestedThreadCount ||
							store.capabilities.hardware_concurrency} threads)
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

		<!-- Desktop Controls Panel -->
		<aside class="hidden space-y-6 lg:block" aria-labelledby="controls-heading">
			<h2 id="controls-heading" class="sr-only">Conversion Settings</h2>

			<!-- Preset Selection -->
			<PresetSelector
				{selectedPreset}
				onPresetChange={handlePresetChange}
				disabled={store.isProcessing}
				isCustom={selectedPreset === 'custom'}
			/>

			<!-- Backend Selection -->
			<BackendSelector
				selectedBackend={store.config.backend}
				onBackendChange={handleBackendChange}
				disabled={store.isProcessing}
			/>

			<!-- Essential Parameters -->
			<ParameterPanel
				config={store.config}
				onConfigChange={handleConfigChange}
				disabled={store.isProcessing}
				onParameterChange={handleParameterChange}
			/>

			<!-- Advanced Controls -->
			<AdvancedControls
				config={store.config}
				onConfigChange={handleConfigChange}
				disabled={store.isProcessing}
				onParameterChange={handleParameterChange}
			/>

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

		<!-- Mobile Controls Button -->
		<div class="fixed right-4 bottom-4 z-40 lg:hidden">
			<Button
				size="lg"
				onclick={() => (showMobileControls = true)}
				class="rounded-full shadow-lg"
				aria-label="Open conversion settings"
			>
				<Settings class="h-5 w-5" aria-hidden="true" />
			</Button>
		</div>
	</main>

	<!-- Mobile Controls Sheet -->
	<MobileControlsSheet
		isOpen={showMobileControls}
		onClose={() => (showMobileControls = false)}
		config={store.config}
		onConfigChange={handleConfigChange}
		{selectedPreset}
		onPresetChange={handlePresetChange}
		onBackendChange={handleBackendChange}
		disabled={store.isProcessing}
		onParameterChange={handleParameterChange}
	/>
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
