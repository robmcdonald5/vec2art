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
		hideControls?: boolean;
		// For synchronized pan/zoom (keeping interface for compatibility)
		externalPanZoom?: { scale: number; x: number; y: number };
		onPanZoomChange?: (_state: { scale: number; x: number; y: number }) => void;
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
		hideControls = false,
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
	// let initialFitScale = $state(1);
	// let hasCalculatedInitialFit = $state(false);

	// Track previous sync state to detect changes - initialized to undefined
	let prevEnableSync = $state<boolean | undefined>();

	// Combined pan/zoom synchronization effect with change detection to prevent infinite loops
	let previousExternalState = $state<{ scale: number; x: number; y: number } | null>(null);
	let previousLocalState = $state<{ scale: number; x: number; y: number } | null>(null);

	$effect(() => {
		// Check if external state has changed
		const currentExternalState = externalPanZoom
			? {
					scale: externalPanZoom.scale,
					x: externalPanZoom.x,
					y: externalPanZoom.y
				}
			: null;

		// Check if local state has changed
		const currentLocalState = {
			scale: targetScale,
			x: targetOffsetX,
			y: targetOffsetY
		};

		// Only update from external if external state actually changed and sync is enabled
		if (
			currentExternalState &&
			enableSync &&
			(!previousExternalState ||
				previousExternalState.scale !== currentExternalState.scale ||
				previousExternalState.x !== currentExternalState.x ||
				previousExternalState.y !== currentExternalState.y)
		) {
			console.log('🔄 [InteractiveImagePanel] Updating from external state:', {
				external: currentExternalState,
				previous: $state.snapshot(previousExternalState),
				syncEnabled: enableSync
			});

			// Update local state from external
			targetScale = currentExternalState.scale;
			targetOffsetX = currentExternalState.x;
			targetOffsetY = currentExternalState.y;

			previousExternalState = { ...currentExternalState };
		}
		// Only notify parent if local state actually changed and we're not just syncing from external
		else if (
			onPanZoomChange &&
			(!previousLocalState ||
				previousLocalState.scale !== currentLocalState.scale ||
				previousLocalState.x !== currentLocalState.x ||
				previousLocalState.y !== currentLocalState.y)
		) {
			console.log('📤 [InteractiveImagePanel] Notifying parent of local changes:', {
				current: currentLocalState,
				previous: $state.snapshot(previousLocalState)
			});

			// Notify parent of local changes
			onPanZoomChange(currentLocalState);
			previousLocalState = { ...currentLocalState };
		}

		// Track sync state changes - skip first run when prevEnableSync is undefined
		if (prevEnableSync !== undefined && prevEnableSync && !enableSync) {
			// Sync was just disabled - preserve current state
			console.log('[InteractiveImagePanel] Sync disabled, preserving state:', currentLocalState);
		}
		prevEnableSync = enableSync;
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
	async function _fitToContainer() {
		try {
			if (!imageUrl) return;
			const { width, height } = await waitForImageLoad(imageUrl);

			// Get container dimensions
			if (!containerElement) return;
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
			console.log('[ImageViewer] Image URL changed, calculating proper scale');

			// Check if we should preserve existing zoom/pan state (but still calculate proper dimensions)
			const shouldPreserveState =
				(externalPanZoom &&
					enableSync &&
					(externalPanZoom.scale !== 1 || externalPanZoom.x !== 0 || externalPanZoom.y !== 0)) ||
				// Also preserve state if sync was just disabled and we have non-default values
				(!enableSync && (targetScale !== 1 || targetOffsetX !== 0 || targetOffsetY !== 0));

			// Store current state to preserve it later
			const preservedScale = shouldPreserveState ? targetScale : null;
			const preservedX = shouldPreserveState ? targetOffsetX : null;
			const preservedY = shouldPreserveState ? targetOffsetY : null;

			if (shouldPreserveState) {
				console.log('[ImageViewer] Will preserve pan/zoom state after calculating dimensions:', {
					scale: preservedScale,
					x: preservedX,
					y: preservedY,
					syncEnabled: enableSync
				});
			} else {
				// Reset position for new images
				targetOffsetX = 0;
				targetOffsetY = 0;
			}

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

					// Apply the calculated scale, but restore preserved state if needed
					if (shouldPreserveState && preservedScale !== null) {
						// Preserve the user's zoom/pan state
						targetScale = preservedScale;
						targetOffsetX = preservedX || 0;
						targetOffsetY = preservedY || 0;
						console.log('[ImageViewer] Restored preserved state:', {
							scale: targetScale,
							x: targetOffsetX,
							y: targetOffsetY
						});
					} else {
						// Use calculated optimal scale for new images
						targetScale = Math.max(optimalScale, 0.1);
					}
				} catch (error) {
					console.error('[ImageViewer] Failed to calculate proper scale:', error);

					// Fallback: preserve state if requested, otherwise default
					if (shouldPreserveState && preservedScale !== null) {
						targetScale = preservedScale;
						targetOffsetX = preservedX || 0;
						targetOffsetY = preservedY || 0;
					} else {
						targetScale = 1.0;
					}
				}
			})();
		}
	});
</script>

<div class="relative flex h-full flex-col {className}">
	<!-- Header with title and controls -->
	{#if !hideControls}
		<div class="mb-3 flex items-center justify-between px-2">
			<div
				class="text-converter-primary flex flex-1 items-center gap-2 text-sm font-medium"
				{title}
			>
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
	{/if}

	<!-- Interactive image container with svelte-image-viewer and scroll fix -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		bind:this={containerElement}
		class="dark:bg-ferrari-900 group relative flex-1 overflow-hidden rounded-lg bg-white"
		tabindex="0"
		role="application"
		aria-label="Interactive {imageAlt} viewer - Use arrow keys to pan, +/- to zoom, 0 to reset, or mouse drag and scroll"
		style="touch-action: pan-x pan-y; /* Allow page scrolling but enable pan */"
		onkeydown={(e) => {
			// Handle keyboard navigation for the image viewer
			if (e.key === 'ArrowLeft') {
				e.preventDefault();
				targetOffsetX += 20;
			} else if (e.key === 'ArrowRight') {
				e.preventDefault();
				targetOffsetX -= 20;
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				targetOffsetY += 20;
			} else if (e.key === 'ArrowDown') {
				e.preventDefault();
				targetOffsetY -= 20;
			} else if (e.key === '=' || e.key === '+') {
				e.preventDefault();
				targetScale = Math.min(5.0, targetScale * 1.2);
			} else if (e.key === '-' || e.key === '_') {
				e.preventDefault();
				targetScale = Math.max(0.1, targetScale / 1.2);
			} else if (e.key === '0' || e.key === 'Home') {
				e.preventDefault();
				// Reset to center
				targetScale = 1;
				targetOffsetX = 0;
				targetOffsetY = 0;
			}
		}}
	>
		{#if imageUrl}
			<!-- svelte-image-viewer component with programmatic controls -->
			<div class="h-full w-full">
				<ScrollFriendlyImageViewer src={imageUrl} alt={imageAlt} panel="original" />
			</div>

			<!-- Interactive cursor hint -->
			<div
				class="pointer-events-none absolute bottom-2 left-2 rounded bg-black/75 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
			>
				<Move class="mr-1 inline h-3 w-3" />
				Drag to pan • Scroll wheel to zoom
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
