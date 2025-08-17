<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { FileDropzone } from '$lib/components/ui/file-dropzone';
	import { ProgressBar } from '$lib/components/ui/progress-bar';
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
	import { ErrorBoundary } from '$lib/components/ui/error-boundary';
	import type { VectorizerBackend, VectorizerPreset, VectorizerConfig } from '$lib/types/vectorizer';
	import { PRESET_CONFIGS } from '$lib/types/vectorizer';

	// Import new component system
	import UnifiedImageProcessor from '$lib/components/converter/UnifiedImageProcessor.svelte';
	import ConverterLayout from '$lib/components/converter/ConverterLayout.svelte';
	import DevTestingPanel from '$lib/components/dev/DevTestingPanel.svelte';
	
	// Import performance monitoring
	import { performanceMonitor, getOptimalThreadCount, type PerformanceMode } from '$lib/utils/performance-monitor';

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
	let selectedPerformanceMode = $state<PerformanceMode>('balanced');
	let currentOptimalThreads = $state(4);
	let hasUserInitiatedConversion = $state(false);
	let performanceWarningShown = $state(false);

	// Enhanced processing state tracking
	let isBatchProcessing = $state(false);
	let batchProgress = $state<{ imageIndex: number; totalImages: number; progress: any } | null>(null);
	let localProcessingState = $state(false);
	let processingStartTime = $state<Date | null>(null);
	let showProgressBar = $state(false);
	let progressBarTimeout: NodeJS.Timeout | null = null;
	
	// Enhanced progress tracking
	let currentProgress = $state(0);
	let progressSimulationInterval: NodeJS.Timeout | null = null;

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

	// Initialize threads on-demand for conversions with performance awareness
	async function initializeThreadsForConversion(): Promise<boolean> {
		if (store.threadsInitialized) {
			// Check if current thread count matches selected performance mode
			const expectedThreads = getOptimalThreadCount(selectedPerformanceMode, currentOptimalThreads);
			if (store.requestedThreadCount !== expectedThreads) {
				console.log(`Adjusting thread count from ${store.requestedThreadCount} to ${expectedThreads} for ${selectedPerformanceMode} mode`);
				return await store.initializeThreads(expectedThreads);
			}
			return true;
		}

		isInitializing = true;
		announceProcessingStatus('Initializing converter for optimal performance...');

		try {
			// Use performance-aware thread calculation
			const optimalThreadCount = getOptimalThreadCount(selectedPerformanceMode, currentOptimalThreads);
			const systemCapabilities = performanceMonitor.getSystemCapabilities();

			console.log(`Auto-initializing with ${optimalThreadCount} threads for conversion (${selectedPerformanceMode} mode, ${systemCapabilities.cores} cores available)`);
			
			// Start performance monitoring
			performanceMonitor.startMonitoring();
			
			const success = await store.initializeThreads(optimalThreadCount);

			if (!success) {
				console.warn('Thread pool initialization failed, will use single-threaded mode');
				announceProcessingStatus('Using single-threaded mode');
				// Still return true as single-threaded mode is valid
				return true;
			} else {
				console.log(`Successfully initialized ${optimalThreadCount} threads`);
				currentOptimalThreads = optimalThreadCount;
				announceProcessingStatus(`Converter ready with ${optimalThreadCount} threads (${selectedPerformanceMode} mode)`);
				
				// Show performance warning for high-performance mode on lower-end systems
				if (selectedPerformanceMode === 'performance' && !systemCapabilities.supportsHighPerformance && !performanceWarningShown) {
					console.warn('Performance mode enabled on system that may not support it well');
					performanceWarningShown = true;
				}
				
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
		cleanupPreviewUrls();
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
		// Set local processing state immediately
		localProcessingState = true;
		processingStartTime = new Date();
		startProgressBar();
		announceProcessingStatus('Starting image conversion');
		
		try {
			// Process image with progress callback
			const result = await store.processImage();

			// Create blob URL for preview - handle single image properly
			const currentIndex = store.currentImageIndex || 0;
			if (previewSvgUrls[currentIndex]) {
				URL.revokeObjectURL(previewSvgUrls[currentIndex]);
			}
			
			// Ensure array is large enough
			while (previewSvgUrls.length <= currentIndex) {
				previewSvgUrls.push(null);
			}
			
			const blob = new Blob([result.svg], { type: 'image/svg+xml' });
			previewSvgUrls[currentIndex] = URL.createObjectURL(blob);

			announceProcessingStatus('Conversion completed successfully');
		} catch (error) {
			console.error('Conversion failed:', error);
			announceProcessingStatus('Conversion failed');
		} finally {
			// Always clear local processing state
			localProcessingState = false;
			processingStartTime = null;
			endProgressBar();
		}
	}

	async function handleBatchConvert() {
		isBatchProcessing = true;
		localProcessingState = true;
		processingStartTime = new Date();
		startProgressBar();
		announceProcessingStatus('Starting batch conversion');
		
		try {
			const results = await store.processBatch((imageIndex, totalImages, progress) => {
				batchProgress = { imageIndex, totalImages, progress };
				announceProcessingStatus(`Processing image ${imageIndex + 1} of ${totalImages}: ${progress.stage}`);
			});

			// Create blob URLs for all results - proper cleanup and assignment
			// Clean up existing URLs
			cleanupPreviewUrls();
			
			// Create new URLs for all results
			previewSvgUrls = results.map(result => {
				if (result && result.svg) {
					const blob = new Blob([result.svg], { type: 'image/svg+xml' });
					return URL.createObjectURL(blob);
				}
				return null;
			});
			
			// Reset to first image after batch completion
			store.setCurrentImageIndex(0);

			announceProcessingStatus(`Batch conversion completed: ${results.length} images processed`);
		} catch (error) {
			console.error('Batch conversion failed:', error);
			announceProcessingStatus('Batch conversion failed');
		} finally {
			isBatchProcessing = false;
			localProcessingState = false;
			processingStartTime = null;
			batchProgress = null;
			endProgressBar();
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
		cleanupPreviewUrls();
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
		console.log(`Image index changed to ${index}, previewSvgUrls.length: ${previewSvgUrls.length}`);
		console.log(`Preview URL at index ${index}:`, previewSvgUrls[index] ? 'exists' : 'null/undefined');
		store.setCurrentImageIndex(index);
	}

	function handleAbort() {
		store.abortProcessing();
		// Clear all local processing states
		localProcessingState = false;
		isBatchProcessing = false;
		processingStartTime = null;
		batchProgress = null;
		endProgressBar();
		announceProcessingStatus('Processing stopped');
	}

	function handlePerformanceModeChange(mode: PerformanceMode, threadCount: number) {
		selectedPerformanceMode = mode;
		currentOptimalThreads = threadCount;
		
		// Update the vectorizer service performance mode
		store.setPerformanceMode(mode);
		
		// If threads are already initialized, update them
		if (store.threadsInitialized) {
			store.initializeThreads(threadCount).then(success => {
				if (success) {
					announceToScreenReader(`Performance mode changed to ${mode} with ${threadCount} threads`);
				} else {
					announceToScreenReader(`Failed to change performance mode, continuing with current settings`);
				}
			}).catch(error => {
				console.error('Failed to update thread count:', error);
				announceToScreenReader('Failed to update performance settings');
			});
		}
	}

	function handleAdvancedPerformanceToggle(show: boolean) {
		// Handle showing/hiding advanced performance details
		console.log(`Advanced performance details ${show ? 'shown' : 'hidden'}`);
	}


	// Derived values
	$effect(() => {
		// Clean up blob URLs and intervals when component is destroyed
		return () => {
			cleanupPreviewUrls();
			stopProgressSimulation();
			if (progressBarTimeout) {
				clearTimeout(progressBarTimeout);
			}
		};
	});

	// Comprehensive processing state tracking
	const isAnyProcessing = $derived(
		store.isProcessing || 
		isBatchProcessing || 
		isInitializing || 
		localProcessingState
	);

	// Can convert as long as we have images and valid config (threads will initialize on-demand)
	// Allow conversion even after failed attempts - users should be able to retry with different settings
	const canConvert = $derived(
		Boolean(
			(store.inputImages.length > 0 || store.inputImage) && 
			store.isConfigValid() && 
			!isAnyProcessing
		)
	);

	const canDownload = $derived(
		Boolean(
			(store.batchResults.length > 0 || store.lastResult) && 
			!isAnyProcessing
		)
	);

	const hasImages = $derived(store.inputFiles.length > 0 || !!store.inputFile);
	const stats = $derived(store.getStats());
	
	// Progress bar management with minimum display time
	function startProgressBar() {
		showProgressBar = true;
		currentProgress = 0;
		if (progressBarTimeout) {
			clearTimeout(progressBarTimeout);
			progressBarTimeout = null;
		}
		startProgressSimulation();
	}
	
	function endProgressBar() {
		currentProgress = 100;
		stopProgressSimulation();
		
		// Keep progress bar visible for at least 1 second
		if (progressBarTimeout) {
			clearTimeout(progressBarTimeout);
		}
		progressBarTimeout = setTimeout(() => {
			showProgressBar = false;
			progressBarTimeout = null;
			currentProgress = 0;
		}, 1000);
	}
	
	// Progress simulation for smooth user experience
	function startProgressSimulation() {
		stopProgressSimulation();
		let elapsed = 0;
		const updateInterval = 100; // Update every 100ms
		
		progressSimulationInterval = setInterval(() => {
			elapsed += updateInterval;
			
			// Simulate realistic progress curve
			// Fast initial progress (0-30% in first 200ms)
			// Slower middle progress (30-80% over next 1-2 seconds)
			// Final progress (80-95%) waits for actual completion
			if (elapsed < 200) {
				currentProgress = Math.min(30, (elapsed / 200) * 30);
			} else if (elapsed < 2000) {
				const midProgress = ((elapsed - 200) / 1800) * 50; // 50% over 1.8 seconds
				currentProgress = Math.min(80, 30 + midProgress);
			} else {
				// Slow progress from 80-95%, waiting for real completion
				const slowProgress = Math.min(15, ((elapsed - 2000) / 3000) * 15);
				currentProgress = Math.min(95, 80 + slowProgress);
			}
		}, updateInterval);
	}
	
	function stopProgressSimulation() {
		if (progressSimulationInterval) {
			clearInterval(progressSimulationInterval);
			progressSimulationInterval = null;
		}
	}
	
	// Update progress from WASM if available
	function updateProgress(progress: number) {
		// If we have real progress from WASM, use it (but keep it above simulation)
		if (progress > currentProgress) {
			currentProgress = progress;
		}
	}
	
	// Watch for real progress updates from the store
	$effect(() => {
		if (store.currentProgress?.progress) {
			updateProgress(store.currentProgress.progress);
		}
	});
	
	// Helper function to clean up preview URLs
	function cleanupPreviewUrls() {
		previewSvgUrls.forEach(url => {
			if (url) {
				URL.revokeObjectURL(url);
			}
		});
		previewSvgUrls = [];
	}
	
	// Debug effect to track preview URLs changes
	$effect(() => {
		console.log(`Preview URLs changed: length=${previewSvgUrls.length}`, 
			previewSvgUrls.map((url, i) => `${i}: ${url ? 'exists' : 'null'}`));
	});
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
						{selectedPerformanceMode.charAt(0).toUpperCase() + selectedPerformanceMode.slice(1)} mode active 
						({currentOptimalThreads} threads)
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


	<!-- Global Progress Bar -->
	{#if showProgressBar || isAnyProcessing}
		<div class="mb-6 rounded-lg border bg-card p-4 shadow-sm" role="status" aria-live="polite">
			<div class="space-y-3">
				<!-- Progress Header -->
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<div class="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
						<span class="font-medium text-sm">
							{#if isBatchProcessing && batchProgress}
								Processing image {batchProgress.imageIndex + 1} of {store.inputFiles.length}
							{:else if isInitializing}
								Initializing converter...
							{:else}
								Converting image...
							{/if}
						</span>
					</div>
					<Button
						variant="outline"
						size="sm"
						onclick={handleAbort}
						class="text-xs px-3 py-1 h-auto"
					>
						Cancel
					</Button>
				</div>

				<!-- Progress Bar -->
				<div class="space-y-2">
					<div class="flex justify-between text-xs text-muted-foreground">
						<span>
							{#if batchProgress?.progress?.stage}
								{batchProgress.progress.stage}
							{:else if store.currentProgress?.stage}
								{store.currentProgress.stage}
							{:else if currentProgress < 30}
								Loading...
							{:else if currentProgress < 80}
								Processing...
							{:else}
								Finalizing...
							{/if}
						</span>
						<span>
							{Math.round(currentProgress)}%
						</span>
					</div>
					
					<!-- Main Progress Bar -->
					<div class="w-full bg-muted rounded-full h-2 overflow-hidden">
						<div 
							class="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300 ease-out relative"
							style="width: {currentProgress}%"
						>
							<!-- Animated shimmer effect -->
							<div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
						</div>
					</div>

					<!-- Time Information -->
					{#if batchProgress?.progress || store.currentProgress}
						{@const progress = batchProgress?.progress || store.currentProgress}
						<div class="flex justify-between text-xs text-muted-foreground">
							<span>
								{Math.round(progress.elapsed_ms / 1000)}s elapsed
							</span>
							{#if progress.estimated_remaining_ms}
								<span>
									~{Math.round(progress.estimated_remaining_ms / 1000)}s remaining
								</span>
							{/if}
						</div>
					{/if}

					<!-- Batch Progress -->
					{#if isBatchProcessing && batchProgress}
						<div class="mt-2 pt-2 border-t border-muted">
							<div class="flex justify-between text-xs text-muted-foreground mb-1">
								<span>Overall Progress</span>
								<span>{batchProgress.imageIndex + 1} / {store.inputFiles.length}</span>
							</div>
							<div class="w-full bg-muted rounded-full h-1">
								<div 
									class="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-500"
									style="width: {((batchProgress.imageIndex + 1) / store.inputFiles.length) * 100}%"
								></div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- Main Converter Interface -->
	<main class="grid gap-8 lg:grid-cols-3 items-start">
		<!-- Upload and Preview Area -->
		<section class="lg:col-span-2 space-y-6">
			<!-- Unified Image Processor with Side-by-Side Preview -->
			<UnifiedImageProcessor
				onFilesSelect={handleFilesSelect}
				currentFiles={store.inputFiles}
				disabled={isAnyProcessing}
				{canConvert}
				{canDownload}
				isProcessing={isAnyProcessing}
				onConvert={handleConvert}
				onDownload={() => handleDownload()}
				onReset={handleResetAll}
				onAbort={handleAbort}
				inputImages={store.inputImages}
				currentImageIndex={store.currentImageIndex}
				currentProgress={batchProgress?.progress || store.currentProgress}
				results={store.batchResults}
				{previewSvgUrls}
				onImageIndexChange={handleImageIndexChange}
			/>
			
			<!-- Mobile Settings Panel - Visible on mobile only -->
			<div class="lg:hidden">
				<ConverterLayout
					config={store.config}
					{selectedPreset}
					{canConvert}
					{canDownload}
					isProcessing={isAnyProcessing}
					{hasImages}
					performanceMode={selectedPerformanceMode}
					threadCount={currentOptimalThreads}
					threadsInitialized={store.threadsInitialized}
					onConfigChange={handleConfigChange}
					onPresetChange={handlePresetChange}
					onBackendChange={handleBackendChange}
					onParameterChange={handleParameterChange}
					onConvert={handleConvert}
					onDownload={handleDownload}
					onReset={handleResetAll}
					onAbort={handleAbort}
					onPerformanceModeChange={handlePerformanceModeChange}
				/>
			</div>
		</section>

		<!-- Desktop Settings Panel -->
		<aside class="hidden lg:block space-y-6 self-start">
			<!-- Converter Settings with integrated performance controls -->
			<ConverterLayout
				config={store.config}
				{selectedPreset}
				{canConvert}
				{canDownload}
				isProcessing={isAnyProcessing}
				{hasImages}
				performanceMode={selectedPerformanceMode}
				threadCount={currentOptimalThreads}
				threadsInitialized={store.threadsInitialized}
				onConfigChange={handleConfigChange}
				onPresetChange={handlePresetChange}
				onBackendChange={handleBackendChange}
				onParameterChange={handleParameterChange}
				onConvert={handleConvert}
				onDownload={handleDownload}
				onReset={handleResetAll}
				onAbort={handleAbort}
				onPerformanceModeChange={handlePerformanceModeChange}
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
