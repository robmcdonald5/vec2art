<script lang="ts">
	import {
		FileImage,
		ZoomIn,
		ZoomOut,
		Maximize2,
		ArrowLeftRight,
		Download,
		Link,
		Unlink
	} from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import ConverterHeader from './ConverterHeader.svelte';
	import ModernPanZoomViewer from '../ui/ModernPanZoomViewer.svelte';
	import type { ConverterComponentProps } from '$lib/types/shared-props';
	import { modernPanZoomStore } from '$lib/stores/modern-pan-zoom.svelte';

	interface Props extends ConverterComponentProps {}

	let {
		files,
		originalImageUrls,
		filesMetadata,
		currentImageIndex,
		currentProgress,
		results,
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
		onRemoveFile,
		isPanicked = false,
		onEmergencyRecovery,
		settingsSyncMode,
		onSettingsModeChange
	}: Props = $props();

	// Modern store access - clean and simple
	// Component references for viewport-aware zooming
	let originalViewer = $state<ModernPanZoomViewer>();
	let convertedViewer = $state<ModernPanZoomViewer>();

	// Comparison slider state
	let viewMode = $state<'side-by-side' | 'slider'>('side-by-side');
	let sliderPosition = $state(50);
	let isDragging = $state(false);
	let sliderContainer = $state<HTMLDivElement>();
	let isVerticalSplit = $state(false);

	// Derived states
	const currentFile = $derived(files[currentImageIndex]);
	const currentImageUrl = $derived(originalImageUrls[currentImageIndex]);
	const currentSvgUrl = $derived(previewSvgUrls?.[currentImageIndex]);
	const hasResult = $derived(Boolean(currentSvgUrl));
	const currentResult = $derived(results?.[currentImageIndex]);
	const isError = $derived(currentResult?.svg?.includes('Failed to convert') ?? false);

	// Modern control functions with viewport-centered zooming
	function zoomInOriginal() {
		originalViewer?.zoomToCenter(1.2);
	}

	function zoomOutOriginal() {
		originalViewer?.zoomToCenter(1 / 1.2);
	}

	function resetOriginalView() {
		modernPanZoomStore.resetPanel('original');
	}

	function zoomInConverted() {
		convertedViewer?.zoomToCenter(1.2);
	}

	function zoomOutConverted() {
		convertedViewer?.zoomToCenter(1 / 1.2);
	}

	function resetConvertedView() {
		modernPanZoomStore.resetPanel('converted');
	}

	function toggleSync() {
		modernPanZoomStore.toggleSync();
	}

	// Reset pan/zoom when changing images
	function handleImageIndexChange(newIndex: number) {
		onImageIndexChange?.(newIndex);
		// FIXED: Don't reset pan/zoom state - let each image maintain its own state
		// Each image should remember its pan/zoom position when you return to it
		// modernPanZoomStore.resetAll(); // REMOVED - this was causing pan/zoom to reset for every image
	}

	// Download original image functionality
	function downloadOriginal(file: File | null, imageUrl: string | null) {
		if (!file && !imageUrl) {
			console.warn('No file or image URL available for download');
			return;
		}

		// If we have the original file, download it directly
		if (file) {
			const link = document.createElement('a');
			const url = URL.createObjectURL(file);
			link.href = url;
			link.download = file.name;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
			return;
		}

		// If we only have an image URL (like from originalImageUrls),
		// try to download it
		if (imageUrl) {
			try {
				const link = document.createElement('a');
				link.href = imageUrl;
				// Try to extract filename from URL or use generic name
				const urlPath = new URL(imageUrl).pathname;
				const filename = urlPath.split('/').pop() || 'original-image';
				link.download = filename;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
			} catch (error) {
				console.warn('Failed to download original image:', error);
				// Fallback: open in new tab
				window.open(imageUrl, '_blank');
			}
		}
	}

	// Slider functions (unchanged)
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
		if (viewMode === 'slider') resetSlider();
	}

	// Global event listeners for slider
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

<div class="card-ferrari-static overflow-hidden rounded-3xl">
	<ConverterHeader
		{files}
		{originalImageUrls}
		{filesMetadata}
		{currentImageIndex}
		{currentProgress}
		{viewMode}
		{hasResult}
		{canConvert}
		{canDownload}
		{isProcessing}
		onImageIndexChange={handleImageIndexChange}
		onViewModeToggle={toggleViewMode}
		{onConvert}
		{onAbort}
		{onReset}
		{onAddMore}
		onRemoveFile={onRemoveFile || ((_index: number) => {})}
		{isPanicked}
		{onEmergencyRecovery}
		{settingsSyncMode}
		{onSettingsModeChange}
	/>

	{#if viewMode === 'slider' && hasResult && currentImageUrl && currentSvgUrl}
		<!-- Slider Mode -->
		<div
			bind:this={sliderContainer}
			class="relative aspect-[2/1] overflow-hidden bg-gray-50"
			role="application"
			aria-label="Interactive image comparison slider"
		>
			<!-- Slider Controls -->
			<div class="absolute inset-x-2 top-2 z-20 md:inset-x-4 md:top-4">
				<!-- Mobile: Stacked layout -->
				<div class="flex flex-col gap-2 md:hidden">
					<div
						class="text-converter-primary rounded-lg bg-white/95 px-3 py-2 text-center text-sm font-medium shadow-sm backdrop-blur-sm"
					>
						Comparison Slider ({Math.round(sliderPosition)}%)
					</div>
					<div class="flex items-center justify-center gap-3">
						<Button
							variant="outline"
							size="default"
							class="mobile-touch-target border-ferrari-300 dark:border-ferrari-600 dark:bg-ferrari-900/95 dark:hover:bg-ferrari-800 hover:border-ferrari-400 dark:hover:border-ferrari-500 rounded-lg bg-white/95 shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-white hover:shadow-md active:scale-95"
							onclick={() => (isVerticalSplit = !isVerticalSplit)}
							aria-label={isVerticalSplit
								? 'Switch to horizontal split'
								: 'Switch to vertical split'}
							title={isVerticalSplit ? 'Switch to horizontal split' : 'Switch to vertical split'}
						>
							<ArrowLeftRight
								class="h-5 w-5 {isVerticalSplit ? 'rotate-90' : ''} transition-transform"
							/>
							<span class="ml-2 text-sm font-medium"
								>{isVerticalSplit ? 'Horizontal' : 'Vertical'}</span
							>
						</Button>
						{#if onDownload && hasResult}
							<Button
								variant="outline"
								size="default"
								class="mobile-touch-target border-ferrari-300 dark:border-ferrari-600 dark:bg-ferrari-900/95 dark:hover:bg-ferrari-800 hover:border-ferrari-400 dark:hover:border-ferrari-500 rounded-lg bg-white/95 shadow-sm backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-white hover:shadow-md active:scale-95"
								onclick={onDownload}
								disabled={isProcessing}
								aria-label="Download SVG"
								title="Download SVG"
							>
								<Download class="h-5 w-5" />
								<span class="ml-2 text-sm font-medium">Download</span>
							</Button>
						{/if}
					</div>
				</div>

				<!-- Desktop: Original horizontal layout -->
				<div class="hidden items-center justify-between md:flex">
					<span class="text-converter-primary rounded bg-white/90 px-2 py-1 text-sm font-medium">
						Comparison Slider ({Math.round(sliderPosition)}%)
					</span>
					<div class="flex items-center gap-1">
						<Button
							variant="outline"
							size="icon"
							class="border-ferrari-300 dark:border-ferrari-600 dark:bg-ferrari-900/90 dark:hover:bg-ferrari-800 hover:border-ferrari-400 dark:hover:border-ferrari-500 h-8 w-8 rounded bg-white/90 transition-all duration-200 hover:scale-110 hover:bg-white hover:shadow-md active:scale-95"
							onclick={() => (isVerticalSplit = !isVerticalSplit)}
							aria-label={isVerticalSplit
								? 'Switch to horizontal split'
								: 'Switch to vertical split'}
							title={isVerticalSplit ? 'Switch to horizontal split' : 'Switch to vertical split'}
						>
							<ArrowLeftRight class="h-4 w-4 {isVerticalSplit ? 'rotate-90' : ''}" />
						</Button>
						{#if onDownload && hasResult}
							<Button
								variant="outline"
								size="icon"
								class="border-ferrari-300 dark:border-ferrari-600 dark:bg-ferrari-900/90 dark:hover:bg-ferrari-800 hover:border-ferrari-400 dark:hover:border-ferrari-500 h-8 w-8 rounded bg-white/90 transition-all duration-200 hover:scale-110 hover:bg-white hover:shadow-md active:scale-95"
								onclick={onDownload}
								disabled={isProcessing}
								aria-label="Download SVG"
								title="Download SVG"
							>
								<Download class="h-4 w-4" />
							</Button>
						{/if}
					</div>
				</div>
			</div>

			<!-- Background: Converted SVG -->
			<img
				src={currentSvgUrl}
				alt="Converted SVG"
				class="absolute inset-0 h-full w-full object-contain"
				draggable="false"
				loading="eager"
				decoding="async"
			/>

			<!-- Foreground: Original (clipped) -->
			<div
				class="absolute inset-0"
				style={isVerticalSplit
					? `clip-path: polygon(0 0, 100% 0, 100% ${sliderPosition}%, 0 ${sliderPosition}%)`
					: `clip-path: polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`}
			>
				<img
					src={currentImageUrl}
					alt="Original"
					class="h-full w-full object-contain"
					draggable="false"
					loading="eager"
					decoding="async"
				/>
			</div>

			<!-- Slider Handle -->
			<div
				class="absolute z-10 cursor-{isVerticalSplit ? 'row' : 'col'}-resize"
				style={isVerticalSplit
					? `top: ${sliderPosition}%; left: 0; right: 0; transform: translateY(-50%);`
					: `left: ${sliderPosition}%; top: 0; bottom: 0; transform: translateX(-50%);`}
				onmousedown={handleSliderMouseDown}
				role="slider"
				aria-valuemin="0"
				aria-valuemax="100"
				aria-valuenow={Math.round(sliderPosition)}
				aria-label="Comparison slider"
				tabindex="0"
			>
				<div class="bg-white shadow-lg {isVerticalSplit ? 'h-0.5 w-full' : 'h-full w-0.5'}"></div>
				<div
					class="absolute top-1/2 left-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-red-600 bg-white shadow-lg"
				>
					<ArrowLeftRight class="h-4 w-4 text-red-600 {isVerticalSplit ? 'rotate-90' : ''}" />
				</div>
			</div>
		</div>
	{:else}
		<!-- Side-by-Side Mode -->
		<div
			class="divide-ferrari-200 grid grid-cols-1 divide-y lg:grid-cols-2 lg:divide-x lg:divide-y-0"
		>
			<!-- Original Image -->
			<div class="bg-ferrari-50/30 relative aspect-square">
				<div class="absolute inset-4 flex flex-col">
					<!-- Original Frame Header with Controls -->
					<div class="mb-3 px-2">
						<!-- Mobile: Stacked layout -->
						<div class="flex flex-col gap-3 md:hidden">
							<div class="flex items-center justify-between">
								<span class="text-converter-primary text-base font-semibold select-none"
									>Original</span
								>
								<button
									class="mobile-touch-target text-converter-primary hover:text-ferrari-600 transition-all duration-200 hover:scale-110 {modernPanZoomStore.syncEnabled
										? 'text-ferrari-600'
										: 'text-gray-400'}"
									onclick={toggleSync}
									aria-label={modernPanZoomStore.syncEnabled ? 'Disable sync' : 'Enable sync'}
									title={modernPanZoomStore.syncEnabled
										? 'Views are synchronized'
										: 'Click to sync both views'}
								>
									{#if modernPanZoomStore.syncEnabled}
										<Link class="h-6 w-6" />
									{:else}
										<Unlink class="h-6 w-6" />
									{/if}
								</button>
							</div>
							<div class="flex justify-center gap-2">
								<Button
									variant="outline"
									size="sm"
									class="mobile-touch-target border-ferrari-300 dark:border-ferrari-600 dark:bg-ferrari-900/90 dark:hover:bg-ferrari-800 hover:border-ferrari-400 dark:hover:border-ferrari-500 rounded bg-white/90 transition-all duration-200 hover:scale-105 hover:bg-white hover:shadow-md active:scale-95"
									onclick={zoomOutOriginal}
									aria-label="Zoom out"
									title="Zoom out"
								>
									<ZoomOut class="h-4 w-4" />
								</Button>
								<Button
									variant="outline"
									size="sm"
									class="mobile-touch-target border-ferrari-300 dark:border-ferrari-600 dark:bg-ferrari-900/90 dark:hover:bg-ferrari-800 hover:border-ferrari-400 dark:hover:border-ferrari-500 rounded bg-white/90 transition-all duration-200 hover:scale-105 hover:bg-white hover:shadow-md active:scale-95"
									onclick={zoomInOriginal}
									aria-label="Zoom in"
									title="Zoom in"
								>
									<ZoomIn class="h-4 w-4" />
								</Button>
								<Button
									variant="outline"
									size="sm"
									class="mobile-touch-target border-ferrari-300 dark:border-ferrari-600 dark:bg-ferrari-900/90 dark:hover:bg-ferrari-800 hover:border-ferrari-400 dark:hover:border-ferrari-500 rounded bg-white/90 transition-all duration-200 hover:scale-105 hover:bg-white hover:shadow-md active:scale-95"
									onclick={resetOriginalView}
									aria-label="Reset view"
									title="Reset view"
								>
									<Maximize2 class="h-4 w-4" />
								</Button>
								<Button
									variant="outline"
									size="sm"
									class="mobile-touch-target border-ferrari-300 dark:border-ferrari-600 dark:bg-ferrari-900/90 dark:hover:bg-ferrari-800 hover:border-ferrari-400 dark:hover:border-ferrari-500 rounded bg-white/90 transition-all duration-200 hover:scale-105 hover:bg-white hover:shadow-md active:scale-95"
									onclick={() => downloadOriginal(currentFile, currentImageUrl)}
									aria-label="Download original"
									title="Download original image"
								>
									<Download class="h-4 w-4" />
								</Button>
							</div>
						</div>

						<!-- Desktop: Original horizontal layout -->
						<div class="hidden items-center justify-between md:flex">
							<div class="flex items-center gap-2">
								<span class="text-converter-primary text-sm font-medium select-none">Original</span>
								<button
									class="text-converter-primary hover:text-ferrari-600 transition-all duration-200 hover:scale-110 {modernPanZoomStore.syncEnabled
										? 'text-ferrari-600'
										: 'text-gray-400'}"
									onclick={toggleSync}
									aria-label={modernPanZoomStore.syncEnabled ? 'Disable sync' : 'Enable sync'}
									title={modernPanZoomStore.syncEnabled
										? 'Views are synchronized'
										: 'Click to sync both views'}
								>
									{#if modernPanZoomStore.syncEnabled}
										<Link class="h-4 w-4" />
									{:else}
										<Unlink class="h-4 w-4" />
									{/if}
								</button>
							</div>

							<!-- Original Frame Controls -->
							<div class="flex gap-1">
								<Button
									variant="outline"
									size="icon"
									class="border-ferrari-300 dark:border-ferrari-600 dark:bg-ferrari-900/90 dark:hover:bg-ferrari-800 hover:border-ferrari-400 dark:hover:border-ferrari-500 h-8 w-8 rounded bg-white/90 transition-all duration-200 hover:scale-110 hover:bg-white hover:shadow-md active:scale-95"
									onclick={zoomOutOriginal}
									aria-label="Zoom out"
									title="Zoom out"
								>
									<ZoomOut class="h-4 w-4" />
								</Button>
								<Button
									variant="outline"
									size="icon"
									class="border-ferrari-300 dark:border-ferrari-600 dark:bg-ferrari-900/90 dark:hover:bg-ferrari-800 hover:border-ferrari-400 dark:hover:border-ferrari-500 h-8 w-8 rounded bg-white/90 transition-all duration-200 hover:scale-110 hover:bg-white hover:shadow-md active:scale-95"
									onclick={zoomInOriginal}
									aria-label="Zoom in"
									title="Zoom in"
								>
									<ZoomIn class="h-4 w-4" />
								</Button>
								<Button
									variant="outline"
									size="icon"
									class="border-ferrari-300 dark:border-ferrari-600 dark:bg-ferrari-900/90 dark:hover:bg-ferrari-800 hover:border-ferrari-400 dark:hover:border-ferrari-500 h-8 w-8 rounded bg-white/90 transition-all duration-200 hover:scale-110 hover:bg-white hover:shadow-md active:scale-95"
									onclick={resetOriginalView}
									aria-label="Reset view"
									title="Reset view"
								>
									<Maximize2 class="h-4 w-4" />
								</Button>
								<Button
									variant="outline"
									size="icon"
									class="border-ferrari-300 dark:border-ferrari-600 dark:bg-ferrari-900/90 dark:hover:bg-ferrari-800 hover:border-ferrari-400 dark:hover:border-ferrari-500 h-8 w-8 rounded bg-white/90 transition-all duration-200 hover:scale-110 hover:bg-white hover:shadow-md active:scale-95"
									onclick={() => downloadOriginal(currentFile, currentImageUrl)}
									aria-label="Download original"
									title="Download original image"
								>
									<Download class="h-4 w-4" />
								</Button>
							</div>
						</div>
					</div>

					<!-- File Name and Remove Button -->
					<div class="mb-2 flex min-h-[1.25rem] items-center px-2">
						{#if currentFile}
							<span class="text-converter-secondary truncate text-xs" title={currentFile.name}>
								{currentFile.name}
							</span>
							<button
								class="ml-1 text-sm font-medium text-gray-400 transition-colors duration-200 hover:scale-110 hover:text-red-500"
								onclick={() => onRemoveFile?.(currentImageIndex)}
								disabled={isProcessing}
								aria-label="Remove image"
								title="Remove this image"
							>
								×
							</button>
						{/if}
					</div>

					<!-- **MODERN**: Clean ModernPanZoomViewer -->
					<div class="dark:bg-ferrari-900 flex-1 overflow-hidden rounded-lg bg-white">
						{#if currentImageUrl}
							<ModernPanZoomViewer
								bind:this={originalViewer}
								src={currentImageUrl}
								alt={currentFile?.name || 'Original image'}
								panel="original"
								class="h-full w-full"
							/>
						{:else}
							<div class="flex h-full items-center justify-center text-gray-400">
								<p class="text-sm">No image</p>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Converted SVG -->
			<div class="bg-ferrari-50/30 relative aspect-square">
				<div class="absolute inset-4 flex flex-col">
					<!-- Converted Frame Header with Controls -->
					<div class="mb-3 px-2">
						<!-- Mobile: Stacked layout -->
						<div class="flex flex-col gap-3 md:hidden">
							<div class="flex items-center justify-center">
								<span
									class="text-base font-semibold select-none"
									class:text-red-600={isError}
									class:text-converter-primary={!isError}
								>
									{isError ? 'Failed' : 'Converted'}
								</span>
							</div>
							<div class="flex justify-center gap-2">
								<Button
									variant="outline"
									size="sm"
									class="mobile-touch-target border-ferrari-300 dark:border-ferrari-600 dark:bg-ferrari-900/90 dark:hover:bg-ferrari-800 hover:border-ferrari-400 dark:hover:border-ferrari-500 rounded bg-white/90 transition-all duration-200 hover:scale-105 hover:bg-white hover:shadow-md active:scale-95"
									onclick={zoomOutConverted}
									disabled={!hasResult}
									aria-label="Zoom out"
									title="Zoom out"
								>
									<ZoomOut class="h-4 w-4" />
								</Button>
								<Button
									variant="outline"
									size="sm"
									class="mobile-touch-target border-ferrari-300 dark:border-ferrari-600 dark:bg-ferrari-900/90 dark:hover:bg-ferrari-800 hover:border-ferrari-400 dark:hover:border-ferrari-500 rounded bg-white/90 transition-all duration-200 hover:scale-105 hover:bg-white hover:shadow-md active:scale-95"
									onclick={zoomInConverted}
									disabled={!hasResult}
									aria-label="Zoom in"
									title="Zoom in"
								>
									<ZoomIn class="h-4 w-4" />
								</Button>
								<Button
									variant="outline"
									size="sm"
									class="mobile-touch-target border-ferrari-300 dark:border-ferrari-600 dark:bg-ferrari-900/90 dark:hover:bg-ferrari-800 hover:border-ferrari-400 dark:hover:border-ferrari-500 rounded bg-white/90 transition-all duration-200 hover:scale-105 hover:bg-white hover:shadow-md active:scale-95"
									onclick={resetConvertedView}
									disabled={!hasResult}
									aria-label="Reset view"
									title="Reset view"
								>
									<Maximize2 class="h-4 w-4" />
								</Button>
								{#if onDownload && hasResult}
									<Button
										variant="outline"
										size="sm"
										class="mobile-touch-target border-ferrari-300 dark:border-ferrari-600 dark:bg-ferrari-900/90 dark:hover:bg-ferrari-800 hover:border-ferrari-400 dark:hover:border-ferrari-500 rounded bg-white/90 transition-all duration-200 hover:scale-105 hover:bg-white hover:shadow-md active:scale-95"
										onclick={onDownload}
										disabled={isProcessing}
										aria-label="Download SVG"
										title="Download SVG"
									>
										<Download class="h-4 w-4" />
									</Button>
								{/if}
							</div>
						</div>

						<!-- Desktop: Original horizontal layout -->
						<div class="hidden items-center justify-between md:flex">
							<div class="flex items-center gap-2">
								<span
									class="text-sm font-medium select-none"
									class:text-red-600={isError}
									class:text-converter-primary={!isError}
								>
									{isError ? 'Failed' : 'Converted'}
								</span>
							</div>

							<!-- Converted Frame Controls -->
							<div class="flex gap-1">
								<Button
									variant="outline"
									size="icon"
									class="border-ferrari-300 dark:border-ferrari-600 dark:bg-ferrari-900/90 dark:hover:bg-ferrari-800 hover:border-ferrari-400 dark:hover:border-ferrari-500 h-8 w-8 rounded bg-white/90 transition-all duration-200 hover:scale-110 hover:bg-white hover:shadow-md active:scale-95"
									onclick={zoomOutConverted}
									disabled={!hasResult}
									aria-label="Zoom out"
									title="Zoom out"
								>
									<ZoomOut class="h-4 w-4" />
								</Button>
								<Button
									variant="outline"
									size="icon"
									class="border-ferrari-300 dark:border-ferrari-600 dark:bg-ferrari-900/90 dark:hover:bg-ferrari-800 hover:border-ferrari-400 dark:hover:border-ferrari-500 h-8 w-8 rounded bg-white/90 transition-all duration-200 hover:scale-110 hover:bg-white hover:shadow-md active:scale-95"
									onclick={zoomInConverted}
									disabled={!hasResult}
									aria-label="Zoom in"
									title="Zoom in"
								>
									<ZoomIn class="h-4 w-4" />
								</Button>
								<Button
									variant="outline"
									size="icon"
									class="border-ferrari-300 dark:border-ferrari-600 dark:bg-ferrari-900/90 dark:hover:bg-ferrari-800 hover:border-ferrari-400 dark:hover:border-ferrari-500 h-8 w-8 rounded bg-white/90 transition-all duration-200 hover:scale-110 hover:bg-white hover:shadow-md active:scale-95"
									onclick={resetConvertedView}
									disabled={!hasResult}
									aria-label="Reset view"
									title="Reset view"
								>
									<Maximize2 class="h-4 w-4" />
								</Button>
								{#if onDownload && hasResult}
									<Button
										variant="outline"
										size="icon"
										class="border-ferrari-300 dark:border-ferrari-600 dark:bg-ferrari-900/90 dark:hover:bg-ferrari-800 hover:border-ferrari-400 dark:hover:border-ferrari-500 h-8 w-8 rounded bg-white/90 transition-all duration-200 hover:scale-110 hover:bg-white hover:shadow-md active:scale-95"
										onclick={onDownload}
										disabled={isProcessing}
										aria-label="Download SVG"
										title="Download SVG"
									>
										<Download class="h-4 w-4" />
									</Button>
								{/if}
							</div>
						</div>
					</div>

					<!-- Matching spacing for vertical alignment -->
					<div class="mb-2 min-h-[1.25rem]"></div>

					<div class="dark:bg-ferrari-900 flex-1 overflow-hidden rounded-lg bg-white">
						{#if hasResult && currentSvgUrl}
							<!-- Modern SVG viewer -->
							<ModernPanZoomViewer
								bind:this={convertedViewer}
								src={currentSvgUrl}
								alt="Converted SVG"
								panel="converted"
								class="h-full w-full"
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
									{#if settingsSyncMode === 'per-image-individual'}
										<div>
											<p class="text-converter-secondary text-sm font-medium">
												Individual Convert Mode
											</p>
											<p class="text-converter-muted text-xs">
												Click Convert to process this specific image
											</p>
										</div>
									{:else}
										<div>
											<p class="text-converter-secondary text-sm font-medium">Ready to Convert</p>
											<p class="text-converter-muted text-xs">
												{settingsSyncMode === 'global'
													? 'Will process all images with same settings'
													: 'Will process all images with individual settings'}
											</p>
										</div>
									{/if}
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
