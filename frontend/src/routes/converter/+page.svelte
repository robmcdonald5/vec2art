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
	import MultiFileDropzone from '$lib/components/ui/multi-file-dropzone.svelte';
	import ImagePreviewCarousel from '$lib/components/converter/ImagePreviewCarousel.svelte';
	import ConverterLayout from '$lib/components/converter/ConverterLayout.svelte';
	import DevTestingPanel from '$lib/components/dev/DevTestingPanel.svelte';

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
	let previewSvgUrls = $state<(string | null)[]>([]);

	// Smart initialization state
	let isInitializing = $state(false);
	let selectedPerformanceMode = $state<string>('balanced');
	let hasUserInitiatedConversion = $state(false);

	// Batch processing state
	let isBatchProcessing = $state(false);
	let batchProgress = $state<{ imageIndex: number; totalImages: number; progress: any } | null>(null);

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

	function handleFilesSelect(files: File[]) {
		if (files.length > 0) {
			// Multi-file upload doesn't need threading - just store the files
			store.setInputFiles(files);
			announceToScreenReader(`${files.length} file(s) selected`);
		} else {
			store.clearInput();
			announceToScreenReader('All files removed');
		}
		// Clear previous results when new files are selected
		previewSvgUrls.forEach(url => {
			if (url) URL.revokeObjectURL(url);
		});
		previewSvgUrls = [];
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

		// Check if this is batch processing
		if (store.hasMultipleImages) {
			await handleBatchConvert();
		} else {
			await handleSingleConvert();
		}
	}

	async function handleSingleConvert() {
		announceProcessingStatus('Starting image conversion');
		try {
			const result = await store.processImage();

			// Create blob URL for preview
			if (previewSvgUrls[0]) {
				URL.revokeObjectURL(previewSvgUrls[0]);
			}
			const blob = new Blob([result.svg], { type: 'image/svg+xml' });
			previewSvgUrls[0] = URL.createObjectURL(blob);

			announceProcessingStatus('Conversion completed successfully');
		} catch (error) {
			console.error('Conversion failed:', error);
			announceProcessingStatus('Conversion failed');
		}
	}

	async function handleBatchConvert() {
		isBatchProcessing = true;
		announceProcessingStatus('Starting batch conversion');
		
		try {
			const results = await store.processBatch((imageIndex, totalImages, progress) => {
				batchProgress = { imageIndex, totalImages, progress };
				announceProcessingStatus(`Processing image ${imageIndex + 1} of ${totalImages}: ${progress.stage}`);
			});

			// Create blob URLs for all results
			previewSvgUrls.forEach(url => {
				if (url) URL.revokeObjectURL(url);
			});
			
			previewSvgUrls = results.map(result => {
				const blob = new Blob([result.svg], { type: 'image/svg+xml' });
				return URL.createObjectURL(blob);
			});

			announceProcessingStatus(`Batch conversion completed: ${results.length} images processed`);
		} catch (error) {
			console.error('Batch conversion failed:', error);
			announceProcessingStatus('Batch conversion failed');
		} finally {
			isBatchProcessing = false;
			batchProgress = null;
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
		previewSvgUrls.forEach(url => {
			if (url) URL.revokeObjectURL(url);
		});
		previewSvgUrls = [];
		store.reset();
	}

	function handleDownload(imageIndex?: number) {
		if (store.hasMultipleImages) {
			handleBatchDownload(imageIndex);
		} else {
			handleSingleDownload();
		}
	}

	function handleSingleDownload() {
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
		announceToScreenReader('SVG file downloaded');
	}

	function handleBatchDownload(imageIndex?: number) {
		const results = store.batchResults;
		const files = store.inputFiles;

		if (imageIndex !== undefined) {
			// Download single image from batch
			const result = results[imageIndex];
			const file = files[imageIndex];
			if (!result || !file) return;

			const blob = new Blob([result.svg], { type: 'image/svg+xml' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${file.name.replace(/\.[^/.]+$/, '')}.svg`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			announceToScreenReader(`Downloaded ${file.name}.svg`);
		} else {
			// Download all as zip would be complex, so download individually
			results.forEach((result, index) => {
				const file = files[index];
				if (result && file) {
					const blob = new Blob([result.svg], { type: 'image/svg+xml' });
					const url = URL.createObjectURL(blob);
					const a = document.createElement('a');
					a.href = url;
					a.download = `${file.name.replace(/\.[^/.]+$/, '')}.svg`;
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
					URL.revokeObjectURL(url);
				}
			});
			announceToScreenReader(`Downloaded ${results.length} SVG files`);
		}
	}

	function handleImageIndexChange(index: number) {
		store.setCurrentImageIndex(index);
	}

	function handleAbort() {
		store.abortProcessing();
		announceProcessingStatus('Processing stopped');
	}

	// Derived values
	$effect(() => {
		// Clean up blob URLs when component is destroyed
		return () => {
			previewSvgUrls.forEach(url => {
				if (url) URL.revokeObjectURL(url);
			});
		};
	});

	// Can convert as long as we have images and valid config (threads will initialize on-demand)
	const canConvert = $derived(
		(store.inputImages.length > 0 || store.inputImage) && 
		store.isConfigValid() && 
		!store.isProcessing && 
		!isInitializing && 
		!isBatchProcessing
	);

	const canDownload = $derived(
		(store.batchResults.length > 0 || store.lastResult) && 
		!store.isProcessing && 
		!isBatchProcessing
	);

	const hasImages = $derived(store.inputFiles.length > 0 || !!store.inputFile);
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
		<section class="lg:col-span-2 space-y-6">
			<!-- Upload Area -->
			<MultiFileDropzone
				onFilesSelect={handleFilesSelect}
				currentFiles={store.inputFiles}
				disabled={store.isProcessing || isBatchProcessing}
				maxFiles={5}
			/>

			<!-- Dynamic Preview with Carousel -->
			<ImagePreviewCarousel
				inputFiles={store.inputFiles}
				inputImages={store.inputImages}
				currentImageIndex={store.currentImageIndex}
				isProcessing={store.isProcessing || isBatchProcessing}
				currentProgress={batchProgress?.progress || store.currentProgress}
				results={store.batchResults}
				{previewSvgUrls}
				onImageIndexChange={handleImageIndexChange}
				onDownload={handleDownload}
			/>
		</section>

		<!-- Desktop Settings Panel -->
		<aside class="hidden lg:block">
			<ConverterLayout
				config={store.config}
				{selectedPreset}
				{canConvert}
				{canDownload}
				isProcessing={store.isProcessing || isBatchProcessing}
				{hasImages}
				onConfigChange={handleConfigChange}
				onPresetChange={handlePresetChange}
				onBackendChange={handleBackendChange}
				onParameterChange={handleParameterChange}
				onConvert={handleConvert}
				onDownload={handleDownload}
				onReset={handleResetAll}
				onAbort={handleAbort}
			/>
		</aside>
	</main>

	<!-- Development Testing Panel (only visible in dev mode) -->
	<DevTestingPanel />
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
