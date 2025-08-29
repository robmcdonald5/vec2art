<script lang="ts">
	import {
		FileImage,
		ZoomIn,
		ZoomOut,
		Maximize2,
		ArrowLeftRight,
		Download,
		X,
		Link,
		Unlink
	} from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import type { ProcessingProgress } from '$lib/types/vectorizer';
	import type { FileMetadata } from '$lib/stores/converter-persistence';
	import ConverterHeader from './ConverterHeader.svelte';
	import InteractiveImagePanel from './InteractiveImagePanel.svelte';
	import { panZoomStore } from '$lib/stores/pan-zoom-sync.svelte';
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

	// Legacy state for slider comparison mode only
	let imageElement = $state<HTMLImageElement>();
	let imageContainer = $state<HTMLDivElement>();

	// Comparison slider state
	let viewMode = $state<'side-by-side' | 'slider'>('side-by-side');
	let sliderPosition = $state(50); // Percentage from left
	let isDragging = $state(false);
	let sliderContainer = $state<HTMLDivElement>();
	let isVerticalSplit = $state(false);

	// Derived states
	const hasMultipleFiles = $derived(Math.max(files.length, originalImageUrls.length) > 1);
	const currentFile = $derived(files[currentImageIndex]);
	const currentImageUrl = $derived(
		originalImageUrls[currentImageIndex] || (currentFile ? URL.createObjectURL(currentFile) : null)
	);
	const currentSvgUrl = $derived(previewSvgUrls[currentImageIndex]);
	const hasResult = $derived(Boolean(currentSvgUrl));
	const currentResult = $derived(results?.[currentImageIndex]);
	const isError = $derived(currentResult?.svg?.includes('Failed to convert') ?? false);

	// Zoom levels
	const zoomLevels = [0.1, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0];

	function findClosestZoomIndex(currentZoom: number): number {
		return zoomLevels.reduce((closest, level, index) => {
			return Math.abs(level - currentZoom) < Math.abs(zoomLevels[closest] - currentZoom)
				? index
				: closest;
		}, 0);
	}

	// Reset pan/zoom store when changing images
	function resetPanZoomState() {
		panZoomStore.resetStates();
	}

	function handleImageIndexChange(newIndex: number) {
		onImageIndexChange(newIndex);
		resetPanZoomState();
	}

	// Legacy function for slider mode only - basic fit behavior
	function fitToSliderContainer() {
		// This is only used for slider comparison mode
		// The intelligent scaling is now handled by InteractiveImagePanel
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
		{originalImageUrls}
		{filesMetadata}
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
		{isPanicked}
		{onEmergencyRecovery}
		{settingsSyncMode}
		{onSettingsModeChange}
	/>

	<!-- Image Comparison Content -->
	{#if viewMode === 'slider' && hasResult && currentImageUrl && currentSvgUrl}
		<!-- Slider Comparison Mode -->
		<div
			bind:this={sliderContainer}
			class="relative aspect-video overflow-hidden bg-gray-50"
			role="img"
			aria-label="Interactive image comparison slider"
			tabindex="0"
			onkeydown={handleKeydown}
		>
			<!-- Slider Controls -->
			<div class="absolute top-4 right-4 left-4 z-20 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<span class="text-converter-primary rounded bg-white/90 px-2 py-1 text-sm font-medium">
						Comparison Slider
					</span>
					<span class="text-converter-secondary rounded bg-white/90 px-2 py-1 text-xs">
						{Math.round(sliderPosition)}%
					</span>
				</div>

				<div class="flex items-center gap-1">
					<!-- Split Direction Toggle -->
					<Button
						variant="outline"
						size="icon"
						class="h-8 w-8 bg-white/90 hover:bg-white"
						onclick={() => (isVerticalSplit = !isVerticalSplit)}
						aria-label={isVerticalSplit ? 'Switch to horizontal split' : 'Switch to vertical split'}
					>
						<ArrowLeftRight
							class="h-4 w-4 {isVerticalSplit ? 'rotate-90' : ''} transition-transform"
						/>
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

			<!-- Background Image (Converted SVG) -->
			<div class="absolute inset-0 flex items-center justify-center">
				<img
					src={currentSvgUrl}
					alt="Converted SVG"
					class="max-h-full max-w-full object-contain"
					draggable="false"
					style="display: block;"
				/>
			</div>

			<!-- Overlay Image (Original) with clip mask -->
			<div
				class="absolute inset-0"
				style={isVerticalSplit
					? `clip-path: polygon(0 0, 100% 0, 100% ${sliderPosition}%, 0 ${sliderPosition}%)`
					: `clip-path: polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`}
			>
				<div class="flex h-full w-full items-center justify-center">
					<img
						src={currentImageUrl}
						alt="Original"
						class="max-h-full max-w-full object-contain"
						draggable="false"
						style="display: block;"
					/>
				</div>
			</div>

			<!-- Slider Handle -->
			<div
				class="absolute z-10 cursor-{isVerticalSplit ? 'row' : 'col'}-resize"
				style={isVerticalSplit
					? `top: ${sliderPosition}%; left: 0; right: 0; transform: translateY(-50%);`
					: `left: ${sliderPosition}%; top: 0; bottom: 0; transform: translateX(-50%);`}
				onmousedown={handleSliderMouseDown}
				role="slider"
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={sliderPosition}
				aria-label="Comparison slider"
				tabindex="0"
			>
				<!-- Slider Line -->
				<div class="bg-white shadow-lg {isVerticalSplit ? 'h-0.5 w-full' : 'h-full w-0.5'}"></div>

				<!-- Slider Handle Circle -->
				<div
					class="absolute flex h-8 w-8 items-center justify-center rounded-full border-2 border-red-600 bg-white shadow-lg {isVerticalSplit
						? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
						: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'}"
				>
					<ArrowLeftRight class="h-4 w-4 text-red-600 {isVerticalSplit ? 'rotate-90' : ''}" />
				</div>
			</div>

			<!-- Keyboard Hints -->
			<div
				class="text-converter-secondary absolute bottom-4 left-4 rounded bg-white/90 px-2 py-1 text-xs"
			>
				Use ← → arrows to adjust
			</div>
		</div>
	{:else}
		<!-- Side-by-Side Grid Mode -->
		<div
			class="divide-ferrari-200 dark:divide-ferrari-800 grid grid-cols-1 divide-y lg:grid-cols-2 lg:divide-x lg:divide-y-0"
		>
			<!-- Original Image -->
			<div class="bg-ferrari-50/30 dark:bg-ferrari-950/30 relative aspect-square">
				<div class="absolute inset-4 flex flex-col">
					<!-- Sync Controls -->
					<div class="mb-3 flex items-center justify-between px-2">
						<div class="flex items-center gap-2">
							<span class="text-converter-primary text-sm font-medium">Original</span>
							<button
								class="text-converter-primary hover:text-ferrari-600 transition-colors duration-200 {panZoomStore.isSyncEnabled
									? 'text-ferrari-600'
									: 'text-gray-400'}"
								onclick={panZoomStore.toggleSync}
								aria-label={panZoomStore.isSyncEnabled ? 'Disable sync' : 'Enable sync'}
								title={panZoomStore.isSyncEnabled
									? 'Views are synchronized'
									: 'Click to sync both views'}
							>
								{#if panZoomStore.isSyncEnabled}
									<Link class="h-4 w-4" />
								{:else}
									<Unlink class="h-4 w-4" />
								{/if}
							</button>
						</div>
					</div>

					<InteractiveImagePanel
						imageUrl={currentImageUrl}
						imageAlt={currentFile?.name || 'Original image'}
						title={currentFile?.name || 'Original'}
						onRemove={currentFile ? () => onRemoveFile(currentImageIndex) : undefined}
						showRemoveButton={Boolean(currentFile)}
						{isProcessing}
						className="flex-1"
						externalPanZoom={panZoomStore.isSyncEnabled ? panZoomStore.convertedState : undefined}
						onPanZoomChange={(state) => panZoomStore.updateOriginalState(state)}
						enableSync={panZoomStore.isSyncEnabled}
					/>
				</div>
			</div>

			<!-- Converted SVG -->
			<div class="bg-ferrari-50/30 dark:bg-ferrari-950/30 relative aspect-square">
				<div class="absolute inset-4 flex flex-col">
					<div class="mb-3 flex items-center justify-between px-2">
						<div class="text-sm font-medium" class:text-red-600={isError} class:text-converter-primary={!isError}>
							{isError ? 'Failed to convert' : 'Converted SVG'}
						</div>
						<!-- Download Button (only show when result is available) -->
						{#if hasResult && canDownload && !isError}
							<Button
								variant="ferrari"
								size="sm"
								class="transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg active:translate-y-0 active:scale-95"
								onclick={onDownload}
								disabled={isProcessing}
							>
								<Download class="h-4 w-4 transition-transform group-hover:scale-110" />
								Download
							</Button>
						{/if}
					</div>

					{#if hasResult && currentSvgUrl}
						<InteractiveImagePanel
							imageUrl={currentSvgUrl}
							imageAlt="Converted SVG"
							{isProcessing}
							className="flex-1"
							externalPanZoom={panZoomStore.isSyncEnabled ? panZoomStore.originalState : undefined}
							onPanZoomChange={(state) => panZoomStore.updateConvertedState(state)}
							enableSync={panZoomStore.isSyncEnabled}
						/>
					{:else if currentProgress}
						<div
							class="dark:bg-ferrari-900 flex flex-1 items-center justify-center overflow-hidden rounded-lg bg-white"
						>
							<div class="space-y-3 text-center">
								<div
									class="border-ferrari-500 mx-auto h-12 w-12 animate-spin rounded-full border-4 border-t-transparent"
								></div>
								<p class="text-converter-secondary text-sm">Converting...</p>
							</div>
						</div>
					{:else}
						<div
							class="dark:bg-ferrari-900 flex flex-1 items-center justify-center overflow-hidden rounded-lg bg-white"
						>
							<div class="space-y-3 text-center">
								<FileImage class="text-converter-muted mx-auto h-16 w-16" />
								<p class="text-converter-secondary text-sm">Click Convert to see result</p>
							</div>
						</div>
					{/if}
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
