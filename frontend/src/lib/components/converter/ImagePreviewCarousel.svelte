<script lang="ts">
	import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Download, Loader2, FileImage } from 'lucide-svelte';
	import Button from '$lib/components/ui/button.svelte';
	import ProgressBar from '$lib/components/ui/progress-bar.svelte';
	import type { ProcessingProgress, ProcessingResult } from '$lib/types/vectorizer';

	interface Props {
		inputFiles: File[];
		inputImages: ImageData[];
		currentImageIndex: number;
		isProcessing: boolean;
		currentProgress?: ProcessingProgress;
		results: ProcessingResult[];
		previewSvgUrls: (string | null)[];
		onImageIndexChange: (index: number) => void;
		onDownload?: (index: number) => void;
		showOriginal?: boolean;
	}

	let {
		inputFiles,
		inputImages,
		currentImageIndex = 0,
		isProcessing = false,
		currentProgress,
		results = [],
		previewSvgUrls = [],
		onImageIndexChange,
		onDownload,
		showOriginal = false
	}: Props = $props();

	let zoomLevel = $state(1);
	let panOffset = $state({ x: 0, y: 0 });
	let isDragging = $state(false);
	let dragStart = $state({ x: 0, y: 0 });
	let imageContainer: HTMLDivElement;

	// Computed properties
	const hasMultipleImages = $derived(inputFiles.length > 1);
	const currentFile = $derived(inputFiles[currentImageIndex]);
	const currentResult = $derived(results[currentImageIndex]);
	const currentPreviewUrl = $derived(previewSvgUrls[currentImageIndex]);
	const canNavigatePrev = $derived(currentImageIndex > 0);
	const canNavigateNext = $derived(currentImageIndex < inputFiles.length - 1);

	function navigateImage(direction: 'prev' | 'next') {
		if (!hasMultipleImages) return;
		
		let newIndex = currentImageIndex;
		if (direction === 'prev' && canNavigatePrev) {
			newIndex = currentImageIndex - 1;
		} else if (direction === 'next' && canNavigateNext) {
			newIndex = currentImageIndex + 1;
		}
		
		if (newIndex !== currentImageIndex) {
			onImageIndexChange(newIndex);
			resetView();
		}
	}

	function handleKeyNavigation(event: KeyboardEvent) {
		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			navigateImage('prev');
		} else if (event.key === 'ArrowRight') {
			event.preventDefault();
			navigateImage('next');
		} else if (event.key === 'Escape') {
			resetView();
		}
	}

	function zoomIn() {
		zoomLevel = Math.min(zoomLevel * 1.5, 5);
	}

	function zoomOut() {
		zoomLevel = Math.max(zoomLevel / 1.5, 0.1);
	}

	function resetView() {
		zoomLevel = 1;
		panOffset = { x: 0, y: 0 };
	}

	function startDrag(event: MouseEvent) {
		isDragging = true;
		dragStart = { x: event.clientX - panOffset.x, y: event.clientY - panOffset.y };
	}

	function handleDrag(event: MouseEvent) {
		if (!isDragging) return;
		panOffset = {
			x: event.clientX - dragStart.x,
			y: event.clientY - dragStart.y
		};
	}

	function endDrag() {
		isDragging = false;
	}

	function handleDownload() {
		if (onDownload) {
			onDownload(currentImageIndex);
		}
	}

	// Keyboard event listener
	$effect(() => {
		document.addEventListener('keydown', handleKeyNavigation);
		return () => document.removeEventListener('keydown', handleKeyNavigation);
	});

	// Mouse event listeners for dragging
	$effect(() => {
		if (imageContainer) {
			const handleMouseMove = (e: MouseEvent) => handleDrag(e);
			const handleMouseUp = () => endDrag();

			if (isDragging) {
				document.addEventListener('mousemove', handleMouseMove);
				document.addEventListener('mouseup', handleMouseUp);
			}

			return () => {
				document.removeEventListener('mousemove', handleMouseMove);
				document.removeEventListener('mouseup', handleMouseUp);
			};
		}
	});
</script>

<div class="rounded-lg border bg-background" role="region" aria-label="Image preview">
	<!-- Header -->
	<div class="border-b p-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<h3 class="font-semibold">Preview</h3>
				{#if hasMultipleImages}
					<div class="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onclick={() => navigateImage('prev')}
							disabled={!canNavigatePrev}
							aria-label="Previous image"
							class="p-1 h-7 w-7"
						>
							<ChevronLeft class="h-4 w-4" />
						</Button>
						<span class="text-sm text-muted-foreground min-w-[4rem] text-center">
							{currentImageIndex + 1} / {inputFiles.length}
						</span>
						<Button
							variant="outline"
							size="sm"
							onclick={() => navigateImage('next')}
							disabled={!canNavigateNext}
							aria-label="Next image"
							class="p-1 h-7 w-7"
						>
							<ChevronRight class="h-4 w-4" />
						</Button>
					</div>
				{/if}
			</div>

			<!-- Controls -->
			<div class="flex items-center gap-2">
				{#if currentFile}
					<span class="text-sm text-muted-foreground hidden sm:inline">
						{currentFile.name}
					</span>
					{#if inputImages[currentImageIndex]}
						<span class="text-xs text-muted-foreground">
							{inputImages[currentImageIndex].width}×{inputImages[currentImageIndex].height}
						</span>
					{/if}
				{/if}

				<!-- Zoom Controls -->
				<div class="flex items-center gap-1 border rounded-md">
					<Button
						variant="ghost"
						size="sm"
						onclick={zoomOut}
						disabled={zoomLevel <= 0.1}
						aria-label="Zoom out"
						class="p-1 h-6 w-6"
					>
						<ZoomOut class="h-3 w-3" />
					</Button>
					<span class="text-xs px-1 min-w-[2rem] text-center">
						{Math.round(zoomLevel * 100)}%
					</span>
					<Button
						variant="ghost"
						size="sm"
						onclick={zoomIn}
						disabled={zoomLevel >= 5}
						aria-label="Zoom in"
						class="p-1 h-6 w-6"
					>
						<ZoomIn class="h-3 w-3" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onclick={resetView}
						aria-label="Reset view"
						class="p-1 h-6 w-6"
					>
						<RotateCcw class="h-3 w-3" />
					</Button>
				</div>

				{#if currentResult}
					<Button
						variant="outline"
						size="sm"
						onclick={handleDownload}
						aria-label="Download converted SVG"
					>
						<Download class="h-4 w-4 mr-1" />
						Download
					</Button>
				{/if}
			</div>
		</div>
	</div>

	<!-- Preview Area -->
	<div class="relative bg-muted/30 aspect-video overflow-hidden">
		{#if isProcessing && currentProgress}
			<!-- Processing State -->
			<div class="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
				<div class="w-full max-w-md space-y-4 text-center p-6">
					<Loader2 class="text-primary mx-auto h-12 w-12 animate-spin" />
					<div class="space-y-2">
						<p class="font-medium">{currentProgress.stage}</p>
						{#if hasMultipleImages}
							<p class="text-sm text-muted-foreground">
								Processing image {currentImageIndex + 1} of {inputFiles.length}
							</p>
						{/if}
						<ProgressBar
							value={currentProgress.progress}
							label="Processing..."
							showValue={true}
						/>
						<p class="text-muted-foreground text-sm">
							{Math.round(currentProgress.elapsed_ms / 1000)}s elapsed
							{#if currentProgress.estimated_remaining_ms}
								• ~{Math.round(currentProgress.estimated_remaining_ms / 1000)}s remaining
							{/if}
						</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Image Container -->
		<div
			bind:this={imageContainer}
			class="absolute inset-0 flex items-center justify-center cursor-{isDragging ? 'grabbing' : zoomLevel > 1 ? 'grab' : 'default'}"
			onmousedown={zoomLevel > 1 ? startDrag : undefined}
			style="transform: translate({panOffset.x}px, {panOffset.y}px) scale({zoomLevel})"
			role={zoomLevel > 1 ? "button" : undefined}
			aria-label={zoomLevel > 1 ? "Drag to pan image" : undefined}
		>
			{#if currentPreviewUrl && !showOriginal}
				<!-- SVG Preview -->
				<img
					src={currentPreviewUrl}
					alt="Converted SVG: {currentFile?.name || 'Image'}"
					class="max-h-full max-w-full object-contain rounded"
					draggable={false}
				/>
			{:else if currentFile}
				<!-- Original Image Preview -->
				<img
					src={URL.createObjectURL(currentFile)}
					alt="Original image: {currentFile.name}"
					class="max-h-full max-w-full object-contain rounded"
					draggable={false}
				/>
			{:else}
				<!-- Empty State -->
				<div class="text-center">
					<FileImage class="text-muted-foreground mx-auto h-12 w-12 mb-2" />
					<p class="text-muted-foreground text-sm">Upload images to see preview</p>
				</div>
			{/if}
		</div>

		<!-- Navigation Arrows for touch devices -->
		{#if hasMultipleImages}
			<!-- Left Arrow -->
			<button
				class="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 border border-border rounded-full p-2 shadow-lg opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity
				{canNavigatePrev ? '' : 'opacity-25 cursor-not-allowed'}"
				onclick={() => navigateImage('prev')}
				disabled={!canNavigatePrev}
				aria-label="Previous image"
			>
				<ChevronLeft class="h-5 w-5" />
			</button>

			<!-- Right Arrow -->
			<button
				class="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 border border-border rounded-full p-2 shadow-lg opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity
				{canNavigateNext ? '' : 'opacity-25 cursor-not-allowed'}"
				onclick={() => navigateImage('next')}
				disabled={!canNavigateNext}
				aria-label="Next image"
			>
				<ChevronRight class="h-5 w-5" />
			</button>
		{/if}

		<!-- Image Indicator Dots -->
		{#if hasMultipleImages && inputFiles.length <= 10}
			<div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
				{#each inputFiles as file, index}
					<button
						class="w-2 h-2 rounded-full transition-colors
						{index === currentImageIndex ? 'bg-primary' : 'bg-background/50 hover:bg-background/80'}"
						onclick={() => onImageIndexChange(index)}
						aria-label="Go to image {index + 1}"
					></button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Footer with Image Info -->
	{#if currentFile}
		<div class="border-t p-3 bg-muted/20">
			<div class="flex items-center justify-between text-sm">
				<div class="flex items-center gap-4">
					<span class="font-medium truncate max-w-[200px]" title={currentFile.name}>
						{currentFile.name}
					</span>
					<span class="text-muted-foreground">
						{(currentFile.size / 1024 / 1024).toFixed(1)} MB
					</span>
				</div>
				
				{#if currentResult}
					<div class="flex items-center gap-4 text-xs text-muted-foreground">
						{#if currentResult.processing_time_ms}
							<span>Processed in {Math.round(currentResult.processing_time_ms)}ms</span>
						{/if}
						{#if currentResult.statistics?.paths_generated}
							<span>{currentResult.statistics.paths_generated} paths</span>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	/* Prevent text selection while dragging */
	.cursor-grabbing * {
		user-select: none;
	}
</style>