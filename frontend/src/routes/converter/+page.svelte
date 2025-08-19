<script lang="ts">
/**
 * Converter Page - Layered State Architecture 
 * State: EMPTY -> Shows only upload area
 * State: LOADED -> Shows converter interface with settings
 */

import { onMount } from 'svelte';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-svelte';

// Import new layered components
import UploadArea from '$lib/components/converter/UploadArea.svelte';
import ConverterInterface from '$lib/components/converter/ConverterInterface.svelte';
import SettingsPanel from '$lib/components/converter/SettingsPanel.svelte';
import ConversionProgress from '$lib/components/ui/progress/ConversionProgress.svelte';
import BatchProgress from '$lib/components/ui/progress/BatchProgress.svelte';
import KeyboardShortcuts from '$lib/components/ui/keyboard/KeyboardShortcuts.svelte';
import UndoRedo from '$lib/components/ui/history/UndoRedo.svelte';
import { toastStore } from '$lib/stores/toast.svelte';
import { parameterHistory } from '$lib/stores/parameter-history.svelte';

// Types and stores
import type { 
	ProcessingProgress, 
	ProcessingResult,
	VectorizerConfig,
	VectorizerBackend,
	VectorizerPreset
} from '$lib/types/vectorizer';
import type { PerformanceMode } from '$lib/utils/performance-monitor';
import { vectorizerStore } from '$lib/stores/vectorizer.svelte.js';

// UI State Management - Using Svelte 5 runes
let files = $state<File[]>([]);
let currentImageIndex = $state(0);
let currentProgress = $state<ProcessingProgress | null>(null);
let results = $state<ProcessingResult[]>([]);
let previewSvgUrls = $state<(string | null)[]>([]);
let isProcessing = $state(false);

// Batch processing state
let completedImages = $state(0);
let batchStartTime = $state<Date | null>(null);

// Page initialization state
let pageLoaded = $state(false);
let initError = $state<string | null>(null);

// Converter configuration state
let config = $state<VectorizerConfig>({
	backend: 'edge',
	detail: 0.5,
	stroke_width: 1.5,
	noise_filtering: true,
	multipass: false,
	reverse_pass: false,
	diagonal_pass: false,
	enable_etf_fdog: false,
	enable_flow_tracing: false,
	enable_bezier_fitting: true,
	hand_drawn_preset: 'medium',
	variable_weights: 0.3,
	tremor_strength: 0.3,
	tapering: 0.7,
	optimize_svg: true,
	svg_precision: 2
});

let selectedPreset = $state<VectorizerPreset | 'custom'>('artistic');
let performanceMode = $state<PerformanceMode>('balanced');
let threadCount = $state(4);
let threadsInitialized = $state(false);

// Derived states for UI logic
const uiState = $derived(files.length === 0 ? 'EMPTY' : 'LOADED');
const hasFiles = $derived(files.length > 0);
const canConvert = $derived(hasFiles && !isProcessing);
const canDownload = $derived(results.length > 0 && !isProcessing);

// Accessibility announcements
let announceText = $state('');

function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
	announceText = message;
	setTimeout(() => {
		announceText = '';
	}, 1000);
}

// File management functions
function handleFilesSelect(selectedFiles: File[]) {
	files = selectedFiles;
	currentImageIndex = 0;
	// Clear previous results
	results = [];
	previewSvgUrls = [];
	
	if (selectedFiles.length > 0) {
		toastStore.info(`${selectedFiles.length} file(s) ready for conversion`);
	}
	announceToScreenReader(`${selectedFiles.length} file(s) selected`);
}

function handleImageIndexChange(index: number) {
	if (index >= 0 && index < files.length) {
		currentImageIndex = index;
	}
}

function handleAddMore() {
	const input = document.createElement('input');
	input.type = 'file';
	input.accept = 'image/*';
	input.multiple = true;
	input.onchange = (e) => {
		const newFiles = Array.from((e.target as HTMLInputElement).files || []);
		if (newFiles.length > 0) {
			const allFiles = [...files, ...newFiles];
			handleFilesSelect(allFiles);
		}
	};
	input.click();
}

// Conversion functions
async function handleConvert() {
	if (!canConvert) {
		console.warn('Cannot convert - no files or already processing');
		return;
	}

	try {
		isProcessing = true;
		completedImages = 0;
		batchStartTime = new Date();
		announceToScreenReader('Starting image conversion');

		// Initialize WASM if needed
		if (!vectorizerStore.isInitialized) {
			await vectorizerStore.initialize({ autoInitThreads: true });
		}

		// Set up vectorizer with current files
		vectorizerStore.setInputFiles(files);

		// Process files
		const processedResults = await vectorizerStore.processBatch((imageIndex, totalImages, progress) => {
			currentImageIndex = imageIndex;
			currentProgress = progress;
			
			// Update completed count when a new image starts processing
			if (progress.stage === 'preprocessing' && progress.progress === 0) {
				completedImages = imageIndex;
			}
			
			announceToScreenReader(`Processing image ${imageIndex + 1} of ${totalImages}: ${progress.stage}`);
		});

		// Create preview URLs
		const urls = processedResults.map(result => {
			if (result && result.svg) {
				const blob = new Blob([result.svg], { type: 'image/svg+xml' });
				return URL.createObjectURL(blob);
			}
			return null;
		});

		results = processedResults;
		previewSvgUrls = urls;
		completedImages = processedResults.length;
		toastStore.success(`Successfully converted ${processedResults.length} image(s) to SVG`);
		announceToScreenReader(`Conversion completed: ${processedResults.length} images processed`);

	} catch (error) {
		console.error('Conversion failed:', error);
		const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
		toastStore.error(`Conversion failed: ${errorMessage}`);
		announceToScreenReader('Conversion failed', 'assertive');
	} finally {
		isProcessing = false;
		currentProgress = null;
	}
}

function handleDownload() {
	if (!canDownload) {
		console.warn('Cannot download - no results available');
		return;
	}

	try {
		const result = results[currentImageIndex];
		const file = files[currentImageIndex];
		
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
			
			announceToScreenReader(`Downloaded ${file.name}.svg`);
		}
	} catch (error) {
		console.error('Download failed:', error);
		announceToScreenReader('Download failed', 'assertive');
	}
}

function handleAbort() {
	vectorizerStore.abortProcessing();
	isProcessing = false;
	currentProgress = null;
	announceToScreenReader('Conversion stopped');
}

function handleReset() {
	// Clean up blob URLs
	previewSvgUrls.forEach(url => {
		if (url) URL.revokeObjectURL(url);
	});
	
	files = [];
	currentImageIndex = 0;
	results = [];
	previewSvgUrls = [];
	currentProgress = null;
	isProcessing = false;
	completedImages = 0;
	batchStartTime = null;
	announceToScreenReader('Converter reset');
}

// Configuration functions
function handleConfigChange(updates: Partial<VectorizerConfig>) {
	const newConfig = { ...config, ...updates };
	config = newConfig;
	
	// Add to parameter history with description
	const description = Object.keys(updates).join(', ') + ' changed';
	parameterHistory.push(newConfig, description);
}

function handleConfigReplace(newConfig: VectorizerConfig) {
	config = newConfig;
}

function handlePresetChange(preset: VectorizerPreset | 'custom') {
	selectedPreset = preset;
}

function handleBackendChange(backend: VectorizerBackend) {
	config = { ...config, backend };
}

function handleParameterChange() {
	// Parameter change handled by config updates
}

function handlePerformanceModeChange(mode: PerformanceMode, threads: number) {
	performanceMode = mode;
	threadCount = threads;
}

// Initialize page
onMount(async () => {
	try {
		
		// Initialize WASM module 
		await vectorizerStore.initialize({ autoInitThreads: false });
		
		// Initialize parameter history with default config
		parameterHistory.initialize(config);
		
		pageLoaded = true;
		announceToScreenReader('Converter page loaded');
		
	} catch (error) {
		console.error('❌ Failed to initialize converter page:', error);
		initError = error instanceof Error ? error.message : 'Failed to load converter';
		announceToScreenReader('Failed to load converter page', 'assertive');
	}
});

// Cleanup on page unload
$effect(() => {
	return () => {
		// Cleanup resources
	};
});

// Debug logging in development
if (import.meta.env.DEV) {
	$effect(() => {
		console.log('🔍 Converter Page State:', {
			uiState,
			pageLoaded,
			filesCount: files.length,
			currentImageIndex,
			hasFiles,
			canConvert,
			canDownload,
			isProcessing
		});
	});
}
</script>

<svelte:head>
	<title>Image to SVG Converter - vec2art</title>
	<meta name="description" content="Convert images to SVG line art using advanced algorithms powered by Rust and WebAssembly" />
</svelte:head>

<!-- Screen reader live region -->
<div aria-live="polite" aria-atomic="true" class="sr-only">
	{announceText}
</div>

<!-- Full viewport background wrapper -->
<div class="bg-section-elevated min-h-screen">
	<div class="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
		
		<!-- Page Header -->
		<header class="mb-8 text-center">
			<h1 class="text-gradient-modern mb-4 text-4xl font-bold">Image to SVG Converter</h1>
			<p class="text-premium mx-auto mt-6 max-w-3xl">
				Transform any raster image into expressive line art SVGs using advanced algorithms
			</p>

			<!-- Status Display -->
			{#if !pageLoaded}
				<div
					class="text-ferrari-600 mt-4 flex items-center justify-center gap-2 text-sm"
					role="status"
					aria-label="Loading converter"
				>
					<Loader2 class="h-4 w-4 animate-spin" aria-hidden="true" />
					Loading converter...
				</div>
			{:else if initError}
				<div
					class="mt-4 flex items-center justify-center gap-2 text-sm text-red-600"
					role="alert"
					aria-label="Converter error"
				>
					<AlertCircle class="h-4 w-4" aria-hidden="true" />
					<span>{initError}</span>
				</div>
			{:else}
				<div
					class="mt-4 flex items-center justify-center gap-2 text-sm"
					role="status"
					aria-label="Converter status"
				>
					<CheckCircle class="text-ferrari-600 h-4 w-4" aria-hidden="true" />
					<span class="status-indicator-success">Converter ready</span>
				</div>
			{/if}
		</header>

		<!-- Main Content - Layered State UI -->
		{#if pageLoaded && !initError}
			{#if uiState === 'EMPTY'}
				<!-- EMPTY State: Just upload area -->
				<main class="flex justify-center">
					<div class="w-full max-w-4xl">
						<UploadArea
							onFilesSelect={handleFilesSelect}
							disabled={isProcessing}
						/>
					</div>
				</main>
			{:else if uiState === 'LOADED'}
				<!-- LOADED State: Converter interface with settings -->
				<main class="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-8">
					<!-- Main converter area -->
					<div class="space-y-6">
						<ConverterInterface
							{files}
							{currentImageIndex}
							currentProgress={currentProgress ?? undefined}
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
						/>
					</div>

					<!-- Settings panel -->
					<div class="xl:w-80 space-y-4">
						<!-- Undo/Redo Controls -->
						<div class="flex justify-end">
							<UndoRedo 
								onConfigChange={handleConfigReplace}
								disabled={isProcessing}
							/>
						</div>
						
						<SettingsPanel
							{config}
							{selectedPreset}
							{performanceMode}
							{threadCount}
							{threadsInitialized}
							disabled={isProcessing}
							onConfigChange={handleConfigChange}
							onPresetChange={handlePresetChange}
							onBackendChange={handleBackendChange}
							onParameterChange={handleParameterChange}
							onPerformanceModeChange={handlePerformanceModeChange}
						/>
					</div>
				</main>
			{/if}
			
			<!-- Batch Progress (for multiple images) -->
			{#if files.length > 1 && (isProcessing || completedImages > 0)}
				<div class="fixed bottom-4 right-4 z-30 max-w-sm">
					<BatchProgress 
						totalImages={files.length}
						{currentImageIndex}
						{currentProgress}
						{completedImages}
						{isProcessing}
						startTime={batchStartTime}
					/>
				</div>
			{/if}
			
			<!-- Conversion Progress Overlay -->
			<ConversionProgress {isProcessing} progress={currentProgress} />
			
			<!-- Keyboard Shortcuts -->
			<KeyboardShortcuts 
				onConvert={handleConvert}
				onDownload={handleDownload}
				onReset={handleReset}
				onAbort={handleAbort}
				onAddMore={handleAddMore}
				{canConvert}
				{canDownload}
				{isProcessing}
			/>
		{:else if initError}
			<!-- Error State -->
			<div class="card-ferrari-static rounded-3xl p-8 text-center" role="alert">
				<div class="mb-4">
					<AlertCircle class="mx-auto h-16 w-16 text-red-500" />
				</div>
				<h2 class="mb-4 text-xl font-bold text-red-700 dark:text-red-400">
					Failed to Load Converter
				</h2>
				<p class="mb-6 text-gray-600 dark:text-gray-300">
					{initError}
				</p>
				<div class="flex justify-center gap-4">
					<button
						class="btn-ferrari-secondary px-6 py-2 text-sm"
						onclick={() => location.reload()}
					>
						Reload Page
					</button>
					<button
						class="btn-ferrari-primary px-6 py-2 text-sm"
						onclick={() => {
							initError = null;
							handleReset();
							pageLoaded = true;
						}}
					>
						Try Again
					</button>
				</div>
			</div>
		{:else}
			<!-- Loading State -->
			<div class="card-ferrari-static rounded-3xl p-8 text-center" role="status">
				<div class="mb-4">
					<Loader2 class="mx-auto h-16 w-16 animate-spin text-ferrari-600" />
				</div>
				<h2 class="mb-2 text-xl font-bold">Loading Converter...</h2>
				<p class="text-gray-600 dark:text-gray-300">
					Initializing high-performance image processing engine
				</p>
			</div>
		{/if}
	</div>
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