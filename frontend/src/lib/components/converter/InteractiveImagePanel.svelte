<script lang="ts">
	import ScrollFriendlyImageViewer from '$lib/components/ui/ScrollFriendlyImageViewer.svelte';
	import { ZoomIn, ZoomOut, Maximize2, Move, Download } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		imageUrl: string | null;
		imageAlt: string;
		title: string;
		onRemove?: () => void;
		showRemoveButton?: boolean;
		isProcessing?: boolean;
		className?: string;
		onDownloadOriginal?: () => void;
		// For synchronized pan/zoom (keeping interface for compatibility)
		externalPanZoom?: { scale: number; x: number; y: number };
		onPanZoomChange?: (state: { scale: number; x: number; y: number }) => void;
		enableSync?: boolean;
	}

	let {
		imageUrl,
		imageAlt,
		title,
		onRemove,
		showRemoveButton = false,
		isProcessing = false,
		className = '',
		onDownloadOriginal,
		externalPanZoom,
		onPanZoomChange,
		enableSync = false
	}: Props = $props();

	// Component state for controls
	let containerElement = $state<HTMLDivElement>();
	let isInitialized = $state(true); // svelte-image-viewer is always ready

	// Pan/zoom state that connects to svelte-image-viewer
	let targetScale = $state(1);
	let targetOffsetX = $state(0);
	let targetOffsetY = $state(0);
	let initialFitScale = $state(1);
	let hasCalculatedInitialFit = $state(false);

	// Track previous sync state to detect changes
	let prevEnableSync = enableSync;
	
	// Sync external pan/zoom state when provided, preserve state when sync is disabled
	$effect(() => {
		if (externalPanZoom && enableSync) {
			targetScale = externalPanZoom.scale;
			targetOffsetX = externalPanZoom.x;
			targetOffsetY = externalPanZoom.y;
		}
		
		// Detect when sync is being disabled - preserve current internal state
		if (prevEnableSync && !enableSync) {
			// Sync was just disabled - keep current internal state unchanged
			// (targetScale, targetOffsetX, targetOffsetY retain their current values)
		}
		
		prevEnableSync = enableSync;
	});

	// Notify parent of pan/zoom changes when callback is provided
	$effect(() => {
		if (onPanZoomChange) {
			onPanZoomChange({
				scale: targetScale,
				x: targetOffsetX,
				y: targetOffsetY
			});
		}
	});

	// Zoom levels for discrete stepping - more granular for better control
	const zoomLevels = [0.1, 0.2, 0.3, 0.5, 0.67, 0.8, 1.0, 1.2, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0];

	function findClosestZoomIndex(currentZoom: number): number {
		return zoomLevels.reduce((closest, level, index) => {
			return Math.abs(level - currentZoom) < Math.abs(zoomLevels[closest] - currentZoom)
				? index
				: closest;
		}, 0);
	}

	// Calculate optimal scale by replicating CSS object-fit: contain behavior
	// This mimics what the slider mode does automatically with CSS
	function calculateOptimalScale(imageWidth: number, imageHeight: number): number {
		if (!containerElement) return 1;

		const containerRect = containerElement.getBoundingClientRect();
		const containerWidth = containerRect.width - 20; // Account for padding
		const containerHeight = containerRect.height - 20;

		// Replicate CSS object-fit: contain algorithm
		// This is the exact same logic that makes the slider mode work perfectly
		const scaleX = containerWidth / imageWidth;
		const scaleY = containerHeight / imageHeight;

		// Use the smaller scale to ensure entire image fits (contain behavior)
		// This matches your requirement: wide images fit to sides, tall images fit to top/bottom
		const fitScale = Math.min(scaleX, scaleY);

		console.log('[ImageViewer] CSS object-fit contain scale calculation:', {
			imageSize: `${imageWidth}x${imageHeight}`,
			containerSize: `${containerWidth}x${containerHeight}`,
			scaleX: scaleX.toFixed(3),
			scaleY: scaleY.toFixed(3),
			finalScale: fitScale.toFixed(3)
		});

		return Math.max(fitScale, 0.1);
	}

	// Proven solution pattern from research - handles both cached and uncached images
	function waitForImageLoad(imageUrl: string): Promise<{ width: number; height: number }> {
		return new Promise((resolve, reject) => {
			const img = new Image();

			console.log('[ImageViewer] Starting to load image:', imageUrl);

			const handleLoad = () => {
				console.log(
					'[ImageViewer] Load event fired - dimensions:',
					img.naturalWidth,
					'x',
					img.naturalHeight
				);
				if (img.naturalWidth === 0 || img.naturalHeight === 0) {
					console.error('[ImageViewer] Image loaded but dimensions are 0');
					reject(new Error('Image dimensions are 0'));
					return;
				}
				resolve({ width: img.naturalWidth, height: img.naturalHeight });
			};

			const handleError = () => {
				console.error('[ImageViewer] Failed to load image:', imageUrl);
				reject(new Error('Failed to load image'));
			};

			// Setup event handlers for non-cached images
			img.addEventListener('load', handleLoad);
			img.addEventListener('error', handleError);

			// Set src FIRST - required for complete property to work
			img.src = imageUrl;

			// Then check if already cached (research-proven timing)
			if (img.complete && img.naturalWidth !== 0) {
				// Image is cached and dimensions are available immediately
				console.log(
					'[ImageViewer] Image already cached with dimensions:',
					img.naturalWidth,
					'x',
					img.naturalHeight
				);
				// Remove event listeners since we don't need them
				img.removeEventListener('load', handleLoad);
				img.removeEventListener('error', handleError);
				resolve({ width: img.naturalWidth, height: img.naturalHeight });
			}
			// If not complete, the load event handler will resolve the promise
		});
	}

	// Working control functions using svelte-image-viewer's targetScale API
	function zoomIn() {
		const currentIndex = findClosestZoomIndex(targetScale);
		const nextIndex = Math.min(currentIndex + 1, zoomLevels.length - 1);
		targetScale = zoomLevels[nextIndex];
		console.log('[ImageViewer] Zoom in to', targetScale);
	}

	function zoomOut() {
		const currentIndex = findClosestZoomIndex(targetScale);
		const prevIndex = Math.max(currentIndex - 1, 0);
		targetScale = zoomLevels[prevIndex];
		console.log('[ImageViewer] Zoom out to', targetScale);
	}

	async function resetView() {
		if (!imageUrl) return;

		try {
			const { width, height } = await waitForImageLoad(imageUrl);
			const optimalScale = calculateOptimalScale(width, height);
			targetScale = optimalScale;
			targetOffsetX = 0;
			targetOffsetY = 0;
			console.log('[ImageViewer] Reset to optimal scale:', optimalScale);
		} catch (error) {
			console.error('[ImageViewer] Failed to reset view:', error);
		}
	}

	// Simple approach: just try to fit the image to container like object-fit: contain would
	async function fitToContainer() {
		if (!imageUrl || !containerElement) return;

		try {
			// Get actual image dimensions
			const { width, height } = await waitForImageLoad(imageUrl);

			// Get container dimensions
			const containerRect = containerElement.getBoundingClientRect();
			const containerWidth = containerRect.width - 40; // Some padding
			const containerHeight = containerRect.height - 40;

			// Simple object-fit: contain calculation
			const scaleX = containerWidth / width;
			const scaleY = containerHeight / height;
			const fitScale = Math.min(scaleX, scaleY); // This is exactly what object-fit: contain does

			console.log('[ImageViewer] Simple fit calculation:', {
				imageSize: `${width}x${height}`,
				containerSize: `${containerWidth.toFixed(0)}x${containerHeight.toFixed(0)}`,
				scaleX: scaleX.toFixed(3),
				scaleY: scaleY.toFixed(3),
				fitScale: fitScale.toFixed(3),
				currentTargetScale: targetScale
			});

			// Just set it - no complex math
			targetScale = Math.max(fitScale, 0.1);
			targetOffsetX = 0;
			targetOffsetY = 0;
		} catch (error) {
			console.error('[ImageViewer] Failed to fit to container:', error);
		}
	}

	// Proper object-fit: contain calculation for each image
	$effect(() => {
		if (imageUrl && containerElement) {
			// Check if we should preserve existing zoom/pan state
			const shouldPreserveState = (externalPanZoom && enableSync && 
				(externalPanZoom.scale !== 1 || externalPanZoom.x !== 0 || externalPanZoom.y !== 0)) ||
				// Also preserve state if sync was just disabled and we have non-default values
				(!enableSync && (targetScale !== 1 || targetOffsetX !== 0 || targetOffsetY !== 0));
			
			if (shouldPreserveState) {
				console.log('[ImageViewer] Preserving current pan/zoom state on image change:', {
					scale: targetScale,
					x: targetOffsetX,
					y: targetOffsetY,
					syncEnabled: enableSync
				});
				// Don't reset - preserve current state
				return;
			}
			
			console.log('[ImageViewer] Image URL changed, calculating proper scale');

			// Reset position immediately only if not preserving state
			targetOffsetX = 0;
			targetOffsetY = 0;

			// Calculate proper scale asynchronously
			(async () => {
				try {
					const { width, height } = await waitForImageLoad(imageUrl);
					const containerRect = containerElement.getBoundingClientRect();

					// Real object-fit: contain calculation
					const scaleX = containerRect.width / width;
					const scaleY = containerRect.height / height;
					const optimalScale = Math.min(scaleX, scaleY); // This is what CSS object-fit: contain does

					console.log('[ImageViewer] Proper scale calculation:', {
						imageSize: `${width}x${height}`,
						containerSize: `${containerRect.width.toFixed(0)}x${containerRect.height.toFixed(0)}`,
						scaleX: scaleX.toFixed(4),
						scaleY: scaleY.toFixed(4),
						optimalScale: optimalScale.toFixed(4)
					});

					// Apply the calculated scale
					targetScale = Math.max(optimalScale, 0.1);
				} catch (error) {
					console.error('[ImageViewer] Failed to calculate proper scale:', error);
					targetScale = 1.0; // Fallback
				}
			})();
		}
	});
</script>

<div class="relative flex h-full flex-col {className}">
	<!-- Header with title and controls -->
	<div class="mb-3 flex items-center justify-between px-2">
		<div class="text-converter-primary flex flex-1 items-center gap-2 text-sm font-medium" {title}>
			<span class="truncate">{title}</span>
			{#if showRemoveButton && onRemove}
				<button
					class="ml-2 text-sm font-medium text-gray-400 transition-colors duration-200 hover:text-red-500"
					onclick={onRemove}
					disabled={isProcessing}
					aria-label="Remove image"
					title="Remove this image"
				>
					×
				</button>
			{/if}
		</div>

		<!-- Working control buttons -->
		<div class="flex gap-1">
			<Button
				variant="outline"
				size="icon"
				class="border-ferrari-300 dark:border-ferrari-600 dark:bg-ferrari-900/90 dark:hover:bg-ferrari-800 hover:border-ferrari-400 dark:hover:border-ferrari-500 h-8 w-8 rounded bg-white/90 transition-all duration-200 hover:scale-110 hover:bg-white hover:shadow-md active:scale-95"
				onclick={zoomOut}
				disabled={!isInitialized}
				aria-label="Zoom out"
				title="Zoom out (- key)"
			>
				<ZoomOut class="h-4 w-4" />
			</Button>
			<Button
				variant="outline"
				size="icon"
				class="border-ferrari-300 dark:border-ferrari-600 dark:bg-ferrari-900/90 dark:hover:bg-ferrari-800 hover:border-ferrari-400 dark:hover:border-ferrari-500 h-8 w-8 rounded bg-white/90 transition-all duration-200 hover:scale-110 hover:bg-white hover:shadow-md active:scale-95"
				onclick={zoomIn}
				disabled={!isInitialized}
				aria-label="Zoom in"
				title="Zoom in (+ key)"
			>
				<ZoomIn class="h-4 w-4" />
			</Button>
			<Button
				variant="outline"
				size="icon"
				class="border-ferrari-300 dark:border-ferrari-600 dark:bg-ferrari-900/90 dark:hover:bg-ferrari-800 hover:border-ferrari-400 dark:hover:border-ferrari-500 h-8 w-8 rounded bg-white/90 transition-all duration-200 hover:scale-110 hover:bg-white hover:shadow-md active:scale-95"
				onclick={resetView}
				disabled={!isInitialized}
				aria-label="Reset view"
				title="Reset view (0 key)"
			>
				<Maximize2 class="h-4 w-4" />
			</Button>
			{#if onDownloadOriginal}
				<Button
					variant="outline"
					size="icon"
					class="border-ferrari-300 dark:border-ferrari-600 dark:bg-ferrari-900/90 dark:hover:bg-ferrari-800 hover:border-ferrari-400 dark:hover:border-ferrari-500 h-8 w-8 rounded bg-white/90 transition-all duration-200 hover:scale-110 hover:bg-white hover:shadow-md active:scale-95"
					onclick={onDownloadOriginal}
					disabled={!isInitialized}
					aria-label="Download original image"
					title="Download original image"
				>
					<Download class="h-4 w-4" />
				</Button>
			{/if}
		</div>
	</div>

	<!-- Interactive image container with svelte-image-viewer and scroll fix -->
	<div
		bind:this={containerElement}
		class="dark:bg-ferrari-900 group relative flex-1 overflow-hidden rounded-lg bg-white"
		tabindex="0"
		role="application"
		aria-label="Interactive {imageAlt} viewer - Hold Ctrl/Cmd + scroll to zoom, drag to pan"
		style="touch-action: pan-x pan-y; /* Allow page scrolling but enable pan */"
	>
		{#if imageUrl}
			<!-- svelte-image-viewer component with programmatic controls -->
			<div class="h-full w-full">
				<ScrollFriendlyImageViewer
					src={imageUrl}
					alt={imageAlt}
					bind:targetScale
					bind:targetOffsetX
					bind:targetOffsetY
					minScale={0.1}
					maxScale={5.0}
					scaleSmoothing={800}
				/>
			</div>

			<!-- Interactive cursor hint -->
			<div
				class="pointer-events-none absolute bottom-2 left-2 rounded bg-black/75 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
			>
				<Move class="mr-1 inline h-3 w-3" />
				Drag to pan • Ctrl+Wheel to zoom
			</div>
		{:else}
			<div class="flex h-full items-center justify-center text-gray-400">
				<div class="text-center">
					<Maximize2 class="mx-auto mb-2 h-16 w-16 opacity-50" />
					<p class="text-sm">No image</p>
				</div>
			</div>
		{/if}

		<!-- Zoom level indicator -->
		{#if imageUrl}
			<div class="absolute top-2 right-2 rounded bg-black/75 px-2 py-1 text-xs text-white">
				{Math.round(targetScale * 100)}%
			</div>
		{/if}
	</div>
</div>

<style>
	/* Styles for svelte-image-viewer container */
	:global(.image-viewer) {
		width: 100%;
		height: 100%;
	}
</style>
