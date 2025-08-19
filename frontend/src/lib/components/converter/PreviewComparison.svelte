<script lang="ts">
import { FileImage, ZoomIn, ZoomOut, Maximize2, ArrowLeftRight, Download, X } from 'lucide-svelte';
import { Button } from '$lib/components/ui/button';
import type { ProcessingProgress } from '$lib/types/vectorizer';
import ConverterHeader from './ConverterHeader.svelte';

interface Props {
	files: File[];
	currentImageIndex: number;
	currentProgress?: ProcessingProgress;
	previewSvgUrls: (string | null)[];
	canConvert: boolean;
	canDownload: boolean;
	isProcessing: boolean;
	onImageIndexChange: (index: number) => void;
	onConvert: () => void;
	onDownload: () => void;
	onAbort: () => void;
	onReset: () => void;
	onAddMore: () => void;
	onRemoveFile: (index: number) => void;
}

let {
	files,
	currentImageIndex,
	currentProgress,
	previewSvgUrls,
	canConvert,
	canDownload,
	isProcessing,
	onImageIndexChange,
	onConvert,
	onDownload,
	onAbort,
	onReset,
	onAddMore,
	onRemoveFile
}: Props = $props();

// Preview state - separate for original and converted
let originalZoomLevel = $state(1);
let originalPanOffset = $state({ x: 0, y: 0 });
let originalAutoFitZoom = $state(1);
let convertedZoomLevel = $state(1);
let convertedPanOffset = $state({ x: 0, y: 0 });
let convertedAutoFitZoom = $state(1);

let imageElement = $state<HTMLImageElement>();
let imageContainer = $state<HTMLDivElement>();

// Comparison slider state
let viewMode = $state<'side-by-side' | 'slider'>('side-by-side');
let sliderPosition = $state(50); // Percentage from left
let isDragging = $state(false);
let sliderContainer = $state<HTMLDivElement>();
let isVerticalSplit = $state(false);

// Derived states
const hasMultipleFiles = $derived(files.length > 1);
const currentFile = $derived(files[currentImageIndex]);
const currentImageUrl = $derived(currentFile ? URL.createObjectURL(currentFile) : null);
const currentSvgUrl = $derived(previewSvgUrls[currentImageIndex]);
const hasResult = $derived(Boolean(currentSvgUrl));

// Zoom levels
const zoomLevels = [0.1, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0];

function findClosestZoomIndex(currentZoom: number): number {
	return zoomLevels.reduce((closest, level, index) => {
		return Math.abs(level - currentZoom) < Math.abs(zoomLevels[closest] - currentZoom)
			? index
			: closest;
	}, 0);
}

// Original image zoom functions
function originalZoomIn() {
	const currentIndex = findClosestZoomIndex(originalZoomLevel);
	const nextIndex = Math.min(currentIndex + 1, zoomLevels.length - 1);
	originalZoomLevel = zoomLevels[nextIndex];
}

function originalZoomOut() {
	const currentIndex = findClosestZoomIndex(originalZoomLevel);
	const prevIndex = Math.max(currentIndex - 1, 0);
	originalZoomLevel = zoomLevels[prevIndex];
}

function originalResetView() {
	originalZoomLevel = originalAutoFitZoom;
	originalPanOffset = { x: 0, y: 0 };
}

// Converted image zoom functions
function convertedZoomIn() {
	const currentIndex = findClosestZoomIndex(convertedZoomLevel);
	const nextIndex = Math.min(currentIndex + 1, zoomLevels.length - 1);
	convertedZoomLevel = zoomLevels[nextIndex];
}

function convertedZoomOut() {
	const currentIndex = findClosestZoomIndex(convertedZoomLevel);
	const prevIndex = Math.max(currentIndex - 1, 0);
	convertedZoomLevel = zoomLevels[prevIndex];
}

function convertedResetView() {
	convertedZoomLevel = convertedAutoFitZoom;
	convertedPanOffset = { x: 0, y: 0 };
}

function handleImageIndexChange(newIndex: number) {
	onImageIndexChange(newIndex);
	originalResetView();
	convertedResetView();
}

function fitToContainer() {
	if (!imageElement || !imageContainer) return;

	const containerRect = imageContainer.getBoundingClientRect();
	const scaleX = (containerRect.width * 0.9) / imageElement.naturalWidth;
	const scaleY = (containerRect.height * 0.9) / imageElement.naturalHeight;
	const optimalScale = Math.min(scaleX, scaleY, 1);

	const closestIndex = findClosestZoomIndex(optimalScale);
	originalAutoFitZoom = zoomLevels[closestIndex];
	originalZoomLevel = originalAutoFitZoom;
	originalPanOffset = { x: 0, y: 0 };

	// Also set converted image to same initial zoom
	convertedAutoFitZoom = zoomLevels[closestIndex];
	convertedZoomLevel = convertedAutoFitZoom;
	convertedPanOffset = { x: 0, y: 0 };
}

// Slider comparison functions
function handleSliderMouseDown(event: MouseEvent) {
	if (!sliderContainer) return;
	isDragging = true;
	updateSliderPosition(event);
	event.preventDefault();
}

function handleSliderMouseMove(event: MouseEvent) {
	if (!isDragging || !sliderContainer) return;
	updateSliderPosition(event);
}

function handleSliderMouseUp() {
	isDragging = false;
}

function updateSliderPosition(event: MouseEvent) {
	if (!sliderContainer) return;
	
	const rect = sliderContainer.getBoundingClientRect();
	const percentage = isVerticalSplit
		? ((event.clientY - rect.top) / rect.height) * 100
		: ((event.clientX - rect.left) / rect.width) * 100;
	
	sliderPosition = Math.max(0, Math.min(100, percentage));
}

function resetSlider() {
	sliderPosition = 50;
}

function toggleViewMode() {
	viewMode = viewMode === 'side-by-side' ? 'slider' : 'side-by-side';
	if (viewMode === 'slider') {
		resetSlider();
	}
}

// Keyboard handling for slider mode
function handleKeydown(event: KeyboardEvent) {
	if (viewMode !== 'slider') return;
	
	switch (event.key) {
		case 'ArrowLeft':
			sliderPosition = Math.max(0, sliderPosition - 1);
			break;
		case 'ArrowRight':
			sliderPosition = Math.min(100, sliderPosition + 1);
			break;
		case 'ArrowUp':
			if (isVerticalSplit) sliderPosition = Math.max(0, sliderPosition - 1);
			break;
		case 'ArrowDown':
			if (isVerticalSplit) sliderPosition = Math.min(100, sliderPosition + 1);
			break;
	}
}

// Global event listeners for slider dragging
$effect(() => {
	const handleGlobalMouseMove = (e: MouseEvent) => handleSliderMouseMove(e);
	const handleGlobalMouseUp = () => handleSliderMouseUp();
	
	if (isDragging) {
		document.addEventListener('mousemove', handleGlobalMouseMove);
		document.addEventListener('mouseup', handleGlobalMouseUp);
	}
	
	return () => {
		document.removeEventListener('mousemove', handleGlobalMouseMove);
		document.removeEventListener('mouseup', handleGlobalMouseUp);
	};
});
</script>

<!-- Side-by-Side Preview -->
<div class="card-ferrari-static overflow-hidden rounded-3xl">
	<!-- New Unified Header -->
	<ConverterHeader
		{files}
		{currentImageIndex}
		{currentProgress}
		{viewMode}
		{hasResult}
		{canConvert}
		{isProcessing}
		onImageIndexChange={handleImageIndexChange}
		onViewModeToggle={toggleViewMode}
		{onConvert}
		{onAbort}
		{onReset}
		{onAddMore}
		{onRemoveFile}
	/>

	<!-- Image Comparison Content -->
	{#if viewMode === 'slider' && hasResult && currentImageUrl && currentSvgUrl}
		<!-- Slider Comparison Mode -->
		<div 
			bind:this={sliderContainer}
			class="relative aspect-video bg-gray-50 overflow-hidden"
			role="img"
			aria-label="Interactive image comparison slider"
			tabindex="0"
			onkeydown={handleKeydown}
		>
			<!-- Slider Controls -->
			<div class="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<span class="text-sm font-medium text-converter-primary bg-white/90 px-2 py-1 rounded">
						Comparison Slider
					</span>
					<span class="text-xs text-converter-secondary bg-white/90 px-2 py-1 rounded">
						{Math.round(sliderPosition)}%
					</span>
				</div>
				
				<div class="flex items-center gap-1">
					<!-- Split Direction Toggle -->
					<Button
						variant="outline"
						size="icon"
						class="h-8 w-8 bg-white/90 hover:bg-white"
						onclick={() => isVerticalSplit = !isVerticalSplit}
						aria-label={isVerticalSplit ? 'Switch to horizontal split' : 'Switch to vertical split'}
					>
						<ArrowLeftRight class="h-4 w-4 {isVerticalSplit ? 'rotate-90' : ''} transition-transform" />
					</Button>
					
					<!-- Reset Button -->
					<Button
						variant="outline"
						size="icon"
						class="h-8 w-8 bg-white/90 hover:bg-white"
						onclick={resetSlider}
						aria-label="Reset slider to center"
					>
						<Maximize2 class="h-4 w-4" />
					</Button>
				</div>
			</div>

			<!-- Background Image (Original) -->
			<div class="absolute inset-0">
				<img 
					src={currentImageUrl}
					alt="Original"
					class="w-full h-full object-contain"
					draggable="false"
				/>
				<div class="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
					Original
				</div>
			</div>

			<!-- Overlay Image (Converted SVG) with clip mask -->
			<div 
				class="absolute inset-0"
				style={isVerticalSplit 
					? `clip-path: polygon(0 0, 100% 0, 100% ${sliderPosition}%, 0 ${sliderPosition}%)`
					: `clip-path: polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`
				}
			>
				<div class="w-full h-full flex items-center justify-center bg-white">
					<img 
						src={currentSvgUrl}
						alt="Converted SVG"
						class="max-w-full max-h-full object-contain"
						draggable="false"
					/>
				</div>
				<div class="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
					Converted
				</div>
			</div>

			<!-- Slider Handle -->
			<div 
				class="absolute z-10 cursor-{isVerticalSplit ? 'row' : 'col'}-resize"
				style={isVerticalSplit 
					? `top: ${sliderPosition}%; left: 0; right: 0; transform: translateY(-50%);`
					: `left: ${sliderPosition}%; top: 0; bottom: 0; transform: translateX(-50%);`
				}
				onmousedown={handleSliderMouseDown}
				role="slider"
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={sliderPosition}
				aria-label="Comparison slider"
				tabindex="0"
			>
				<!-- Slider Line -->
				<div 
					class="bg-white shadow-lg {isVerticalSplit ? 'h-0.5 w-full' : 'w-0.5 h-full'}"
				></div>
				
				<!-- Slider Handle Circle -->
				<div 
					class="absolute bg-white rounded-full border-2 border-red-600 shadow-lg w-8 h-8 flex items-center justify-center {isVerticalSplit ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2' : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'}"
				>
					<ArrowLeftRight class="h-4 w-4 text-red-600 {isVerticalSplit ? 'rotate-90' : ''}" />
				</div>
			</div>

			<!-- Keyboard Hints -->
			<div class="absolute bottom-4 left-4 text-xs text-converter-secondary bg-white/90 px-2 py-1 rounded">
				Use ← → arrows to adjust
			</div>
		</div>
	{:else}
		<!-- Side-by-Side Grid Mode -->
		<div class="grid grid-cols-1 divide-y divide-ferrari-200 dark:divide-ferrari-800 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
		<!-- Original Image -->
		<div class="bg-ferrari-50/30 dark:bg-ferrari-950/30 relative aspect-square">
			<div class="absolute inset-4 flex flex-col">
				<div class="mb-3 flex items-center justify-between px-2">
					<div class="text-converter-primary text-sm font-medium flex-1 mr-2" title={currentFile?.name}>
						<div class="filename-display">
							{currentFile?.name || 'Original'}
						</div>
					</div>
					<!-- Zoom Controls for Original -->
					<div class="flex gap-1">
						<!-- Remove current image button -->
						<Button
							variant="outline"
							size="icon"
							class="h-8 w-8 rounded border-ferrari-300 dark:border-ferrari-600 bg-white/90 dark:bg-ferrari-900/90 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-400 dark:hover:border-red-500 hover:shadow-md transition-all duration-200 hover:scale-110 active:scale-95"
							onclick={() => onRemoveFile(currentImageIndex)}
							disabled={isProcessing}
							aria-label="Remove current image"
							title="Remove this image"
						>
							<X class="h-4 w-4 text-red-600 dark:text-red-400 transition-transform group-hover:scale-110" />
						</Button>
						
						<Button
							variant="outline"
							size="icon"
							class="h-8 w-8 rounded border-ferrari-300 dark:border-ferrari-600 bg-white/90 dark:bg-ferrari-900/90 hover:bg-white dark:hover:bg-ferrari-800 hover:border-ferrari-400 dark:hover:border-ferrari-500 hover:shadow-md transition-all duration-200 hover:scale-110 active:scale-95"
							onclick={originalZoomOut}
							aria-label="Zoom out original image"
						>
							<ZoomOut class="h-4 w-4 transition-transform group-hover:scale-110" />
						</Button>
						<Button
							variant="outline"
							size="icon"
							class="h-8 w-8 rounded border-ferrari-300 dark:border-ferrari-600 bg-white/90 dark:bg-ferrari-900/90 hover:bg-white dark:hover:bg-ferrari-800 hover:border-ferrari-400 dark:hover:border-ferrari-500 hover:shadow-md transition-all duration-200 hover:scale-110 active:scale-95"
							onclick={originalResetView}
							aria-label="Reset original image view"
						>
							<Maximize2 class="h-4 w-4 transition-transform group-hover:scale-110" />
						</Button>
						<Button
							variant="outline"
							size="icon"
							class="h-8 w-8 rounded border-ferrari-300 dark:border-ferrari-600 bg-white/90 dark:bg-ferrari-900/90 hover:bg-white dark:hover:bg-ferrari-800 hover:border-ferrari-400 dark:hover:border-ferrari-500 hover:shadow-md transition-all duration-200 hover:scale-110 active:scale-95"
							onclick={originalZoomIn}
							aria-label="Zoom in original image"
						>
							<ZoomIn class="h-4 w-4 transition-transform group-hover:scale-110" />
						</Button>
					</div>
				</div>
				<div bind:this={imageContainer} class="flex-1 overflow-hidden rounded-lg bg-white dark:bg-ferrari-900">
					{#if currentImageUrl}
						<img
							bind:this={imageElement}
							src={currentImageUrl}
							alt={currentFile?.name}
							class="h-full w-full cursor-move object-contain transition-transform"
							style="transform: scale({originalZoomLevel}) translate({originalPanOffset.x}px, {originalPanOffset.y}px)"
							onload={fitToContainer}
							draggable="false"
						/>
					{:else}
						<div class="flex h-full items-center justify-center">
							<FileImage class="text-converter-muted h-16 w-16" />
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Converted SVG -->
		<div class="bg-ferrari-50/30 dark:bg-ferrari-950/30 relative aspect-square">
			<div class="absolute inset-4 flex flex-col">
				<div class="mb-3 flex items-center justify-between px-2">
					<div class="text-converter-primary text-sm font-medium">Converted SVG</div>
					<div class="flex items-center gap-2">
						<!-- Download Button (only show when result is available) -->
						{#if hasResult && canDownload}
							<Button
								variant="default"
								size="sm"
								style="background-color: #FF2800 !important; color: white !important; border-color: #FF2800 !important;"
								class="hover:shadow-lg transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 active:scale-95 active:translate-y-0"
								onclick={onDownload}
								disabled={isProcessing}
							>
								<Download class="h-4 w-4 transition-transform group-hover:scale-110" />
								Download
							</Button>
						{/if}
						<!-- Zoom Controls for Converted SVG -->
						<div class="flex gap-1">
							<Button
								variant="outline"
								size="icon"
								class="h-8 w-8 rounded border-ferrari-300 dark:border-ferrari-600 bg-white/90 dark:bg-ferrari-900/90 hover:bg-white dark:hover:bg-ferrari-800 hover:border-ferrari-400 dark:hover:border-ferrari-500 hover:shadow-md transition-all duration-200 hover:scale-110 active:scale-95"
								onclick={convertedZoomOut}
								aria-label="Zoom out converted SVG"
							>
								<ZoomOut class="h-4 w-4 transition-transform group-hover:scale-110" />
							</Button>
							<Button
								variant="outline"
								size="icon"
								class="h-8 w-8 rounded border-ferrari-300 dark:border-ferrari-600 bg-white/90 dark:bg-ferrari-900/90 hover:bg-white dark:hover:bg-ferrari-800 hover:border-ferrari-400 dark:hover:border-ferrari-500 hover:shadow-md transition-all duration-200 hover:scale-110 active:scale-95"
								onclick={convertedResetView}
								aria-label="Reset converted SVG view"
							>
								<Maximize2 class="h-4 w-4 transition-transform group-hover:scale-110" />
							</Button>
							<Button
								variant="outline"
								size="icon"
								class="h-8 w-8 rounded border-ferrari-300 dark:border-ferrari-600 bg-white/90 dark:bg-ferrari-900/90 hover:bg-white dark:hover:bg-ferrari-800 hover:border-ferrari-400 dark:hover:border-ferrari-500 hover:shadow-md transition-all duration-200 hover:scale-110 active:scale-95"
								onclick={convertedZoomIn}
								aria-label="Zoom in converted SVG"
							>
								<ZoomIn class="h-4 w-4 transition-transform group-hover:scale-110" />
							</Button>
						</div>
					</div>
				</div>
				<div class="flex-1 overflow-hidden rounded-lg bg-white dark:bg-ferrari-900">
					{#if hasResult && currentSvgUrl}
						<img
							src={currentSvgUrl}
							alt="Converted SVG"
							class="h-full w-full object-contain transition-transform"
							style="transform: scale({convertedZoomLevel}) translate({convertedPanOffset.x}px, {convertedPanOffset.y}px)"
							draggable="false"
						/>
					{:else if currentProgress}
						<div class="flex h-full items-center justify-center">
							<div class="space-y-3 text-center">
								<div
									class="border-ferrari-500 mx-auto h-12 w-12 animate-spin rounded-full border-4 border-t-transparent"
								></div>
								<p class="text-converter-secondary text-sm">Converting...</p>
							</div>
						</div>
					{:else}
						<div class="flex h-full items-center justify-center">
							<div class="space-y-3 text-center">
								<FileImage class="text-converter-muted mx-auto h-16 w-16" />
								<p class="text-converter-secondary text-sm">Click Convert to see result</p>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
		</div>
	{/if}
</div>

<style>
	.filename-display {
		word-break: break-all;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		max-width: 200px;
	}
</style>