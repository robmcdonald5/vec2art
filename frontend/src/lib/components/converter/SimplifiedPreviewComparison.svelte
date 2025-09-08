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
	import ScrollFriendlyImageViewer from '../ui/ScrollFriendlyImageViewer.svelte';
	import type { ConverterComponentProps } from '$lib/types/shared-props';

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

	// **SIMPLIFIED**: Single pan/zoom state in parent component
	let panZoomState = $state({
		scale: 1,
		x: 0,
		y: 0,
		syncEnabled: true
	});

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

	// **SIMPLIFIED**: Direct control functions
	function zoomIn() {
		panZoomState.scale = Math.min(5.0, panZoomState.scale * 1.2);
	}

	function zoomOut() {
		panZoomState.scale = Math.max(0.1, panZoomState.scale / 1.2);
	}

	function resetView() {
		panZoomState.scale = 1;
		panZoomState.x = 0;
		panZoomState.y = 0;
	}

	function toggleSync() {
		panZoomState.syncEnabled = !panZoomState.syncEnabled;
		console.log('🔄 [SimplifiedPreview] Sync toggled:', panZoomState.syncEnabled);
	}

	// Reset pan/zoom when changing images
	function handleImageIndexChange(newIndex: number) {
		onImageIndexChange?.(newIndex);
		resetView(); // Clean reset for each image
	}

	// **SIMPLIFIED**: Single update handler
	function updatePanZoom(updates: Partial<typeof panZoomState>) {
		Object.assign(panZoomState, updates);
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
		onRemoveFile={onRemoveFile || ((index: number) => {})}
		{isPanicked}
		{onEmergencyRecovery}
		{settingsSyncMode}
		{onSettingsModeChange}
	/>

	{#if viewMode === 'slider' && hasResult && currentImageUrl && currentSvgUrl}
		<!-- Slider Mode -->
		<div
			bind:this={sliderContainer}
			class="relative aspect-video overflow-hidden bg-gray-50"
			role="application"
			aria-label="Interactive image comparison slider"
		>
			<!-- Slider Controls -->
			<div class="absolute top-4 right-4 left-4 z-20 flex items-center justify-between">
				<span class="text-converter-primary rounded bg-white/90 px-2 py-1 text-sm font-medium">
					Comparison Slider ({Math.round(sliderPosition)}%)
				</span>
				<div class="flex items-center gap-1">
					<Button
						variant="outline"
						size="icon"
						class="h-8 w-8 bg-white/90 hover:bg-white"
						onclick={() => (isVerticalSplit = !isVerticalSplit)}
					>
						<ArrowLeftRight class="h-4 w-4 {isVerticalSplit ? 'rotate-90' : ''}" />
					</Button>
					<Button variant="outline" size="icon" class="h-8 w-8 bg-white/90" onclick={resetSlider}>
						<Maximize2 class="h-4 w-4" />
					</Button>
				</div>
			</div>

			<!-- Background: Converted SVG -->
			<img
				src={currentSvgUrl}
				alt="Converted SVG"
				class="absolute inset-0 h-full w-full object-contain"
				draggable="false"
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
				tabindex="0"
			>
				<div class="bg-white shadow-lg {isVerticalSplit ? 'h-0.5 w-full' : 'h-full w-0.5'}"></div>
				<div class="absolute top-1/2 left-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-red-600 bg-white flex items-center justify-center shadow-lg">
					<ArrowLeftRight class="h-4 w-4 text-red-600 {isVerticalSplit ? 'rotate-90' : ''}" />
				</div>
			</div>
		</div>
	{:else}
		<!-- Side-by-Side Mode -->
		<div class="divide-ferrari-200 grid grid-cols-1 divide-y lg:grid-cols-2 lg:divide-x lg:divide-y-0">
			<!-- Original Image -->
			<div class="bg-ferrari-50/30 relative aspect-square">
				<div class="absolute inset-4 flex flex-col">
					<!-- Header with sync controls -->
					<div class="mb-3 flex items-center justify-between px-2">
						<span class="text-converter-primary text-sm font-medium">Original</span>
						<div class="flex items-center gap-1">
							<!-- Zoom Controls -->
							<Button variant="outline" size="icon" class="h-8 w-8" onclick={zoomOut}>
								<ZoomOut class="h-4 w-4" />
							</Button>
							<Button variant="outline" size="icon" class="h-8 w-8" onclick={zoomIn}>
								<ZoomIn class="h-4 w-4" />
							</Button>
							<Button variant="outline" size="icon" class="h-8 w-8" onclick={resetView}>
								<Maximize2 class="h-4 w-4" />
							</Button>
							<!-- Sync Toggle -->
							<button
								class="text-converter-primary hover:text-ferrari-600 p-2 {panZoomState.syncEnabled
									? 'text-ferrari-600'
									: 'text-gray-400'}"
								onclick={toggleSync}
								title={panZoomState.syncEnabled ? 'Views are synchronized' : 'Click to sync views'}
							>
								{#if panZoomState.syncEnabled}
									<Link class="h-4 w-4" />
								{:else}
									<Unlink class="h-4 w-4" />
								{/if}
							</button>
						</div>
					</div>

					<!-- **SIMPLIFIED**: Direct ScrollFriendlyImageViewer -->
					<div class="dark:bg-ferrari-900 flex-1 overflow-hidden rounded-lg bg-white">
						{#if currentImageUrl}
							<ScrollFriendlyImageViewer
								src={currentImageUrl}
								alt={currentFile?.name || 'Original image'}
								bind:targetScale={panZoomState.scale}
								bind:targetOffsetX={panZoomState.x}
								bind:targetOffsetY={panZoomState.y}
								minScale={0.1}
								maxScale={5.0}
								scaleSmoothing={800}
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
					<div class="mb-3 flex items-center justify-between px-2">
						<span class="text-converter-primary text-sm font-medium">
							{isError ? 'Failed' : 'Converted'}
						</span>
						{#if hasResult}
							<Button variant="outline" size="icon" class="h-8 w-8" onclick={onDownload}>
								<Download class="h-4 w-4" />
							</Button>
						{/if}
					</div>

					<div class="dark:bg-ferrari-900 flex-1 overflow-hidden rounded-lg bg-white">
						{#if hasResult && currentSvgUrl}
							{#if panZoomState.syncEnabled}
								<!-- Synced SVG viewer -->
								<ScrollFriendlyImageViewer
									src={currentSvgUrl}
									alt="Converted SVG"
									bind:targetScale={panZoomState.scale}
									bind:targetOffsetX={panZoomState.x}
									bind:targetOffsetY={panZoomState.y}
									minScale={0.1}
									maxScale={5.0}
									scaleSmoothing={800}
								/>
							{:else}
								<!-- Independent SVG viewer -->
								<ScrollFriendlyImageViewer
									src={currentSvgUrl}
									alt="Converted SVG"
									minScale={0.1}
									maxScale={5.0}
									scaleSmoothing={800}
								/>
							{/if}
						{:else if currentProgress}
							<div class="flex h-full items-center justify-center">
								<div class="text-center space-y-3">
									<div class="border-ferrari-500 mx-auto h-12 w-12 animate-spin rounded-full border-4 border-t-transparent"></div>
									<p class="text-converter-secondary text-sm">Converting...</p>
								</div>
							</div>
						{:else}
							<div class="flex h-full items-center justify-center">
								<div class="text-center space-y-3">
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