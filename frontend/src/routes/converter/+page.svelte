<script lang="ts">
	/**
	 * Converter Page - Sophisticated UI with Algorithm Configuration Architecture
	 * State: EMPTY -> Shows rich upload area with title and instructions
	 * State: LOADED -> Shows converter interface with before/after comparison and advanced controls
	 */

	import { onMount } from 'svelte';

	// Import sophisticated UI components
	import UploadArea from '$lib/components/converter/UploadArea.svelte';
	import ConverterInterface from '$lib/components/converter/ConverterInterface.svelte';
	import SettingsPanel from '$lib/components/converter/SettingsPanel.svelte';
	import KeyboardShortcuts from '$lib/components/ui/keyboard/KeyboardShortcuts.svelte';
	import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';
	import SEOHead from '$lib/components/seo/SEOHead.svelte';
	import StructuredData from '$lib/components/seo/StructuredData.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import DownloadFormatSelector from '$lib/components/ui/DownloadFormatSelector.svelte';
	import LoadingState from '$lib/components/ui/LoadingState.svelte';
	import ErrorState from '$lib/components/ui/ErrorState.svelte';

	// Types and stores - NEW: Algorithm Configuration System
	import { algorithmConfigStore } from '$lib/stores/algorithm-config-store.svelte';
	import { converterState } from '$lib/stores/converter-state.svelte';
	import { wasmWorkerService } from '$lib/services/wasm-worker-service';
	import type { ProcessingProgress, ProcessingResult } from '$lib/workers/vectorizer.worker';
	// import type { AlgorithmConfig } from '$lib/types/algorithm-configs';

	// UI State Management - Using Svelte 5 runes (adapted from original sophisticated structure)
	let files = $state<File[]>([]);
	let originalImageUrls = $state<(string | null)[]>([]);
	let currentImageIndex = $state(0);
	let currentProgress = $state<ProcessingProgress | undefined>(undefined);
	let results = $state<(ProcessingResult | null)[]>([]);
	let previewSvgUrls = $state<(string | null)[]>([]);
	let isProcessing = $state(false);

	// Page initialization state
	let pageLoaded = $state(false);
	let initError = $state<string | null>(null);

	// Download format selector state
	let showDownloadSelector = $state(false);
	let pendingDownloadData = $state<{ filename: string; svgContent: string } | null>(null);

	// Derived states for UI logic
	const uiState = $derived(
		files.length === 0 && originalImageUrls.length === 0 && results.length === 0
			? 'EMPTY'
			: 'LOADED'
	);
	const hasFiles = $derived(files.length > 0 || originalImageUrls.length > 0);
	const canConvert = $derived(hasFiles && !isProcessing && pageLoaded && !initError);
	const canDownload = $derived(results.length > 0 && !isProcessing);

	// Accessibility announcements
	let announceText = $state('');

	function announceToScreenReader(message: string) {
		announceText = message;
		setTimeout(() => {
			announceText = '';
		}, 1000);
	}

	// Page initialization
	onMount(async () => {
		try {
			// Initialize the algorithm configuration store
			await algorithmConfigStore.initialize();

			// Initialize WASM worker service
			await wasmWorkerService.initialize({});

			// Try to load saved images from previous session using IndexedDB
			console.log('[Converter] Attempting to load saved images from IndexedDB...');
			const hasRestoredImages = await converterState.loadSavedImageState();
			if (hasRestoredImages) {
				console.log('[Converter] Successfully restored images from IndexedDB');

				// Get the restored images - already loaded in converterState
				const restoredFiles = converterState.inputFiles;
				const restoredImages = converterState.inputImages;
				const restoredIndex = converterState.currentImageIndex;

				if (restoredFiles.length > 0 && restoredImages.length > 0) {
					// Create display URLs for the restored files
					const urls: string[] = [];
					for (const file of restoredFiles) {
						urls.push(URL.createObjectURL(file));
					}

					// Update UI state with restored data
					files = restoredFiles;
					originalImageUrls = urls;
					currentImageIndex = Math.min(restoredIndex, restoredFiles.length - 1);

					// Clear previous results since these are restored images
					results = [];
					previewSvgUrls = [];

					const message =
						restoredFiles.length === 1
							? `Restored "${restoredFiles[0].name}" from previous session`
							: `Restored ${restoredFiles.length} images from previous session`;

					toastStore.add(message, { type: 'info' });
					console.log(`[Converter] Successfully restored ${restoredFiles.length} image(s) to UI`);
				}
			} else {
				console.log('[Converter] No saved images to restore');
			}

			pageLoaded = true;
		} catch (error) {
			console.error('[Converter] Failed to initialize:', error);
			initError = error instanceof Error ? error.message : 'Unknown initialization error';
		}
	});

	// File management functions
	async function handleFilesSelect(selectedFiles: File[]) {
		console.log(`[Converter] Selected ${selectedFiles.length} files`);

		// Save to converter state store for persistence with IndexedDB
		try {
			console.log('[Converter] Saving files to IndexedDB...');
			await converterState.setInputFiles(selectedFiles);
			console.log('[Converter] Successfully saved to IndexedDB');

			// Update local UI state after successful save
			files = selectedFiles;

			// Create original image URLs for display
			const newImageUrls: (string | null)[] = [];
			for (const file of selectedFiles) {
				if (file.type.startsWith('image/')) {
					newImageUrls.push(URL.createObjectURL(file));
				} else {
					newImageUrls.push(null);
				}
			}
			originalImageUrls = newImageUrls;

			// Only reset to index 0 for initial uploads, not when adding more
			if (currentImageIndex >= selectedFiles.length) {
				currentImageIndex = 0;
			}

			// Clear previous results
			results = [];
			previewSvgUrls = [];

			if (selectedFiles.length > 0) {
				toastStore.add(`${selectedFiles.length} file(s) ready for conversion`, {
					type: 'success'
				});
			}
			announceToScreenReader(`${selectedFiles.length} file(s) selected`);
		} catch (error) {
			console.error('[Converter] Failed to save files:', error);
			toastStore.add('Failed to save images. Please try again.', { type: 'error' });
		}
	}

	async function handleImageIndexChange(index: number) {
		if (index >= 0 && index < files.length) {
			currentImageIndex = index;
			// Update the session index in IndexedDB
			await converterState.setCurrentImageIndex(index);
		}
	}

	async function handleAddMore() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'image/*';
		input.multiple = true;
		input.onchange = async (e) => {
			const newFiles = Array.from((e.target as HTMLInputElement).files || []);
			if (newFiles.length > 0) {
				const oldFilesCount = files.length;
				const allFiles = [...files, ...newFiles];

				// Save all files to IndexedDB
				await handleFilesSelect(allFiles);

				// Automatically select the first newly uploaded image
				const newImageIndex = oldFilesCount; // Index of first new image
				await handleImageIndexChange(newImageIndex);
			}
		};
		input.click();
	}

	async function handleRemoveFile(index: number) {
		if (index < 0 || index >= files.length || isProcessing) {
			return;
		}

		const removedFileName = files[index]?.name || 'Unknown';

		// Create new arrays without the removed file
		const newFiles = files.filter((_, i) => i !== index);
		const newResults = results.filter((_, i) => i !== index);
		const newPreviewUrls = previewSvgUrls.filter((_, i) => i !== index);
		const newOriginalUrls = originalImageUrls.filter((_, i) => i !== index);

		// Clean up URLs
		if (previewSvgUrls[index]) {
			URL.revokeObjectURL(previewSvgUrls[index]!);
		}
		if (originalImageUrls[index]) {
			URL.revokeObjectURL(originalImageUrls[index]!);
		}

		// Update current index if necessary
		let newCurrentIndex = currentImageIndex;
		if (index === currentImageIndex) {
			newCurrentIndex = Math.max(0, currentImageIndex - 1);
		} else if (index < currentImageIndex) {
			newCurrentIndex = currentImageIndex - 1;
		}

		// Apply changes
		files = newFiles;
		results = newResults;
		previewSvgUrls = newPreviewUrls;
		originalImageUrls = newOriginalUrls;
		currentImageIndex = Math.min(newCurrentIndex, newFiles.length - 1);

		// If no files left, reset everything
		if (newFiles.length === 0) {
			handleReset();
			return;
		}

		// Update IndexedDB session with the new file list
		try {
			await converterState.setInputFiles(newFiles);
			console.log(`[Converter] Updated IndexedDB session after removing ${removedFileName}`);
		} catch (error) {
			console.error('[Converter] Failed to update IndexedDB after file removal:', error);
		}

		toastStore.add(`Removed ${removedFileName}`, { type: 'info' });
		announceToScreenReader(`Removed ${removedFileName}. ${newFiles.length} files remaining`);
	}

	// Conversion functions
	async function handleConvert() {
		if (!canConvert) {
			if (!hasFiles) {
				toastStore.add('Please upload an image first', { type: 'error' });
			} else if (isProcessing) {
				toastStore.add('Conversion already in progress', { type: 'warning' });
			} else if (!pageLoaded) {
				toastStore.add('System not ready - please wait for initialization', { type: 'error' });
			}
			return;
		}

		try {
			isProcessing = true;
			announceToScreenReader('Starting image conversion');

			// Get current algorithm configuration
			const currentAlgorithm = algorithmConfigStore.currentAlgorithm;
			const config = algorithmConfigStore.getCurrentConfig();
			console.log(
				`[Converter] Converting ${files.length} files using ${currentAlgorithm} algorithm`
			);

			// Debug: Log the full config to see if parameters are included
			if (currentAlgorithm === 'dots') {
				console.log('[Converter] Dots config being sent:', {
					dotShape: (config as any).dotShape,
					noiseFiltering: (config as any).noiseFiltering,
					noiseFilterSpatialSigma: (config as any).noiseFilterSpatialSigma,
					noiseFilterRangeSigma: (config as any).noiseFilterRangeSigma,
					fullConfig: config
				});
			}

			// Process each file
			const processedResults: ProcessingResult[] = [];
			const newPreviewUrls: (string | null)[] = [];

			for (let i = 0; i < files.length; i++) {
				const file = files[i];

				// Update progress
				currentProgress = {
					stage: `Processing ${file.name}`,
					progress: 0,
					elapsed_ms: 0
				};

				try {
					// Convert file to image data
					const canvas = document.createElement('canvas');
					const ctx = canvas.getContext('2d')!;
					const img = new Image();

					await new Promise((resolve, reject) => {
						img.onload = resolve;
						img.onerror = reject;
						img.src = originalImageUrls[i]!;
					});

					canvas.width = img.width;
					canvas.height = img.height;
					ctx.drawImage(img, 0, 0);

					const imageData = ctx.getImageData(0, 0, img.width, img.height);

					// Process with WASM worker
					const result = await wasmWorkerService.processImage(imageData, config);

					processedResults.push(result);

					// Create preview URL
					if (result.svg) {
						const blob = new Blob([result.svg], { type: 'image/svg+xml' });
						newPreviewUrls.push(URL.createObjectURL(blob));
					} else {
						newPreviewUrls.push(null);
					}
				} catch (error) {
					console.error(`Failed to process ${file.name}:`, error);
					// Skip failed files - don't add to results
					newPreviewUrls.push(null);
				}
			}

			// Update results
			results = processedResults;
			previewSvgUrls = newPreviewUrls;

			console.log('[Converter] Results updated:', {
				resultsLength: results.length,
				firstResult: results[0],
				firstResultHasSvg: results[0]?.svg ? 'yes' : 'no',
				firstResultSvgLength: results[0]?.svg?.length
			});

			const successCount = processedResults.filter((r) => r && r.svg).length;
			const message =
				successCount === 1
					? `Successfully converted image to SVG`
					: `Successfully converted ${successCount} image(s) to SVG`;

			toastStore.add(message, { type: 'success' });
			announceToScreenReader(`Conversion completed: ${successCount} images processed`);
		} catch (error) {
			console.error('[Converter] Processing failed:', error);
			toastStore.add(
				`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
				{
					type: 'error'
				}
			);
		} finally {
			isProcessing = false;
			currentProgress = undefined;
		}
	}

	function handleDownload(indexOrEvent?: number | Event) {
		// Handle both direct index and event calls
		const targetIndex = typeof indexOrEvent === 'number' ? indexOrEvent : currentImageIndex;
		const result = results[targetIndex];
		const filename = files[targetIndex]?.name || `converted-${targetIndex}`;

		console.log('[handleDownload] Debug:', {
			targetIndex,
			resultsLength: results.length,
			result,
			hasSvg: result?.svg ? 'yes' : 'no',
			svgLength: result?.svg?.length
		});

		if (!result || !result.svg) {
			toastStore.add('No SVG available for download', { type: 'error' });
			return;
		}

		// Show download format selector
		pendingDownloadData = {
			filename: filename.replace(/\.[^/.]+$/, ''), // Remove extension
			svgContent: result.svg
		};
		showDownloadSelector = true;
	}

	function handleDownloadSvg(filename: string, svgContent: string) {
		const blob = new Blob([svgContent], { type: 'image/svg+xml' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${filename}.svg`;
		a.click();
		URL.revokeObjectURL(url);

		showDownloadSelector = false;
		pendingDownloadData = null;
	}

	function handleDownloadWebP(_filename: string, _svgContent: string) {
		// TODO: Implement WebP conversion
		toastStore.add('WebP conversion not yet implemented', { type: 'info' });
		showDownloadSelector = false;
		pendingDownloadData = null;
	}

	function handleDownloadCancel() {
		showDownloadSelector = false;
		pendingDownloadData = null;
	}

	function handleAbort() {
		if (isProcessing) {
			isProcessing = false;
			currentProgress = undefined;
			toastStore.add('Processing aborted', { type: 'info' });
		}
	}

	function handleReset() {
		// Clean up URLs
		originalImageUrls.forEach((url) => {
			if (url) URL.revokeObjectURL(url);
		});
		previewSvgUrls.forEach((url) => {
			if (url) URL.revokeObjectURL(url);
		});

		files = [];
		originalImageUrls = [];
		results = [];
		previewSvgUrls = [];
		currentImageIndex = 0;
		currentProgress = undefined;

		// Reset algorithm configurations to defaults
		algorithmConfigStore.resetAllConfigs();

		toastStore.add('All files and settings cleared', { type: 'info' });
		announceToScreenReader('All files and settings cleared');
	}

	// Error boundary handlers
	function handleConverterError(error: Error, errorInfo: any) {
		console.error(' [ErrorBoundary] Converter component error:', error, errorInfo);
		toastStore.add(`Converter error: ${error.message}. The system will attempt to recover.`, {
			type: 'error'
		});
	}

	function handleSettingsError(error: Error, errorInfo: any) {
		console.error(' [ErrorBoundary] Settings panel error:', error, errorInfo);
		toastStore.add(`Settings error: ${error.message}. Settings have been reset to defaults.`, {
			type: 'error'
		});
	}
</script>

<!-- SEO and Structured Data -->
<SEOHead
	title="Image to SVG Converter - vec2art"
	description="Convert raster images to scalable vector graphics (SVG) using advanced line tracing algorithms. Fast, browser-based conversion with artistic enhancements."
	keywords="SVG converter, vector graphics, line art, image tracing, vector conversion"
/>

<StructuredData
	type="WebApplication"
	data={{
		name: 'vec2art',
		description: 'High-performance image to SVG conversion with advanced algorithms',
		url: 'https://vec2art.com/converter',
		applicationCategory: 'GraphicsApplication',
		operatingSystem: 'Any'
	}}
/>

<!-- Accessibility announcements -->
<div aria-live="polite" aria-atomic="true" class="sr-only">
	{announceText}
</div>

<!-- Main Content -->
<div
	class="from-speed-gray-50 to-speed-gray-100 dark:from-speed-gray-900 dark:to-speed-gray-800 flex min-h-screen flex-col bg-gradient-to-br"
>
	<div class="flex-1">
		{#if pageLoaded}
			{#if uiState === 'EMPTY'}
				<!-- Rich Upload State with Title and Instructions -->
				<div class="flex min-h-screen items-center justify-center p-4">
					<div class="w-full max-w-4xl text-center">
						<!-- Hero Title Section -->
						<div class="mb-12">
							<h1
								class="text-speed-gray-900 dark:text-speed-gray-100 mb-4 text-4xl font-bold md:text-5xl"
							>
								Transform Images to
								<span
									class="from-ferrari-500 to-ferrari-600 bg-gradient-to-r bg-clip-text text-transparent"
								>
									Vector Art
								</span>
							</h1>
							<p class="text-speed-gray-600 dark:text-speed-gray-400 mx-auto max-w-2xl text-lg">
								Transform any raster image into expressive line art SVGs using advanced algorithms
							</p>
						</div>

						<!-- Upload Area -->
						<UploadArea onFilesSelect={handleFilesSelect} />

						<!-- Features Grid -->
						<div class="mt-16 grid gap-6 md:grid-cols-3">
							<div class="bg-speed-white/80 dark:bg-speed-gray-800/80 rounded-lg p-6">
								<div class="mb-4 flex justify-center">
									<div class="bg-ferrari-500/10 rounded-full p-3">
										<svg
											class="text-ferrari-500 h-6 w-6"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M13 10V3L4 14h7v7l9-11h-7z"
											/>
										</svg>
									</div>
								</div>
								<h3 class="text-speed-gray-900 dark:text-speed-gray-100 mb-2 font-semibold">
									Lightning Fast
								</h3>
								<p class="text-speed-gray-600 dark:text-speed-gray-400 text-sm">
									High-performance WASM processing with multi-threaded algorithms
								</p>
							</div>

							<div class="bg-speed-white/80 dark:bg-speed-gray-800/80 rounded-lg p-6">
								<div class="mb-4 flex justify-center">
									<div class="bg-ferrari-500/10 rounded-full p-3">
										<svg
											class="text-ferrari-500 h-6 w-6"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
											/>
										</svg>
									</div>
								</div>
								<h3 class="text-speed-gray-900 dark:text-speed-gray-100 mb-2 font-semibold">
									Multiple Algorithms
								</h3>
								<p class="text-speed-gray-600 dark:text-speed-gray-400 text-sm">
									Choose from edge detection, centerline, superpixel, and dots algorithms
								</p>
							</div>

							<div class="bg-speed-white/80 dark:bg-speed-gray-800/80 rounded-lg p-6">
								<div class="mb-4 flex justify-center">
									<div class="bg-ferrari-500/10 rounded-full p-3">
										<svg
											class="text-ferrari-500 h-6 w-6"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
											/>
										</svg>
									</div>
								</div>
								<h3 class="text-speed-gray-900 dark:text-speed-gray-100 mb-2 font-semibold">
									Fine Control
								</h3>
								<p class="text-speed-gray-600 dark:text-speed-gray-400 text-sm">
									Extensive parameter controls for precise artistic results
								</p>
							</div>
						</div>
					</div>
				</div>
			{:else}
				<!-- Sophisticated Converter Interface with Before/After Preview -->
				<main class="container mx-auto flex min-h-screen flex-col gap-4 p-4 xl:flex-row xl:gap-6">
					<!-- Main converter interface with error boundary -->
					<div class="flex-1 space-y-4">
						<ErrorBoundary onError={handleConverterError}>
							<ConverterInterface
								{files}
								{originalImageUrls}
								filesMetadata={files.map((f) => ({
									name: f.name,
									size: f.size,
									type: f.type,
									lastModified: f.lastModified
								}))}
								{currentImageIndex}
								{currentProgress}
								{results}
								{previewSvgUrls}
								{canConvert}
								{canDownload}
								{isProcessing}
								onImageIndexChange={handleImageIndexChange}
								onConvert={handleConvert}
								onDownload={handleDownload}
								onAbort={handleAbort}
								onReset={handleReset}
								onAddMore={handleAddMore}
								onRemoveFile={handleRemoveFile}
								isPanicked={false}
								onEmergencyRecovery={handleReset}
								settingsSyncMode="global"
								onSettingsModeChange={() => {}}
							/>
						</ErrorBoundary>
					</div>

					<!-- Settings panel with error boundary -->
					<div class="space-y-4 xl:w-80">
						<ErrorBoundary onError={handleSettingsError}>
							<SettingsPanel disabled={isProcessing} />
						</ErrorBoundary>
					</div>
				</main>
			{/if}

			<!-- Keyboard Shortcuts -->
			<KeyboardShortcuts
				onConvert={handleConvert}
				onDownload={() => handleDownload()}
				onReset={handleReset}
				onAbort={handleAbort}
				onAddMore={handleAddMore}
				{canConvert}
				{canDownload}
				{isProcessing}
			/>
		{:else if initError}
			<!-- Error State -->
			<div class="flex min-h-screen items-center justify-center p-4">
				<div class="card-ferrari-static rounded-3xl p-8">
					<ErrorState
						title="Failed to Load Converter"
						message={initError}
						size="lg"
						showRetry={true}
						showReload={true}
						onRetry={() => {
							initError = null;
							handleReset();
							pageLoaded = true;
						}}
						onReload={() => location.reload()}
					/>
				</div>
			</div>
		{:else}
			<!-- Loading State -->
			<div class="flex min-h-screen items-center justify-center p-4">
				<div class="card-ferrari-static rounded-3xl p-8">
					<LoadingState message="Loading Converter..." size="lg" center={true}>
						{#snippet subtitle()}
							Initializing high-performance image processing engine
						{/snippet}
					</LoadingState>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Download Format Selector Modal -->
{#if pendingDownloadData}
	<DownloadFormatSelector
		filename={pendingDownloadData.filename}
		svgContent={pendingDownloadData.svgContent}
		onDownloadSvg={() =>
			pendingDownloadData &&
			handleDownloadSvg(pendingDownloadData.filename, pendingDownloadData.svgContent)}
		onDownloadWebP={async () => {
			if (pendingDownloadData)
				await handleDownloadWebP(pendingDownloadData.filename, pendingDownloadData.svgContent);
		}}
		onCancel={handleDownloadCancel}
		show={showDownloadSelector}
		{isProcessing}
	/>
{/if}

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
