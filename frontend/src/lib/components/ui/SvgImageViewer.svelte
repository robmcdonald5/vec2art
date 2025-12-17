<script lang="ts">
	import { onDestroy } from 'svelte';
	import ScrollFriendlyImageViewer from './ScrollFriendlyImageViewer.svelte';

	interface Props {
		svgContent: string;
		alt?: string;
		// Pan/zoom sync props (same as other viewers) - bindable
		targetScale?: number;
		targetOffsetX?: number;
		targetOffsetY?: number;
		minScale?: number;
		maxScale?: number;
		scaleSmoothing?: number;
		// Rendering options
		renderMethod?: 'blob' | 'dataurl' | 'canvas';
		maxWidth?: number;
		maxHeight?: number;
		// Sync props (same as InteractiveImagePanel)
		externalPanZoom?: { scale: number; x: number; y: number };
		onPanZoomChange?: (_state: { scale: number; x: number; y: number }) => void;
		enableSync?: boolean;
	}

	let {
		svgContent,
		alt = 'SVG Image',
		targetScale = $bindable(1),
		targetOffsetX = $bindable(0),
		targetOffsetY = $bindable(0),
		minScale: _minScale = 0.1,
		maxScale: _maxScale = 5.0,
		scaleSmoothing: _scaleSmoothing = 1200,
		renderMethod = 'blob',
		maxWidth,
		maxHeight,
		externalPanZoom,
		onPanZoomChange,
		enableSync = false
	}: Props = $props();

	let imageUrl = $state<string | null>(null);
	let error = $state<string | null>(null);
	let blobUrl: string | null = null;

	// Zoom control functions - use discrete zoom levels like InteractiveImagePanel
	const zoomLevels = [0.1, 0.2, 0.3, 0.5, 0.67, 0.8, 1.0, 1.2, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0];

	function findClosestZoomIndex(currentZoom: number): number {
		return zoomLevels.reduce((closest, level, index) => {
			return Math.abs(level - currentZoom) < Math.abs(zoomLevels[closest] - currentZoom)
				? index
				: closest;
		}, 0);
	}

	export function zoomIn() {
		const currentIndex = findClosestZoomIndex(targetScale);
		const nextIndex = Math.min(currentIndex + 1, zoomLevels.length - 1);
		targetScale = zoomLevels[nextIndex];
	}

	export function zoomOut() {
		const currentIndex = findClosestZoomIndex(targetScale);
		const prevIndex = Math.max(currentIndex - 1, 0);
		targetScale = zoomLevels[prevIndex];
	}

	export function resetView() {
		targetScale = 1;
		targetOffsetX = 0;
		targetOffsetY = 0;
	}

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
			console.log('🔄 [SvgImageViewer] Updating from external state:', {
				external: currentExternalState,
				previous: previousExternalState,
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
			console.log('📤 [SvgImageViewer] Notifying parent of local changes:', {
				current: currentLocalState,
				previous: previousLocalState
			});

			// Notify parent of local changes
			onPanZoomChange(currentLocalState);
			previousLocalState = { ...currentLocalState };
		}

		// Track sync state changes - skip first run when prevEnableSync is undefined
		if (prevEnableSync !== undefined && prevEnableSync && !enableSync) {
			// Sync was just disabled - preserve current state
			console.log('[SvgImageViewer] Sync disabled, preserving state:', currentLocalState);
		}
		prevEnableSync = enableSync;
	});

	// Convert SVG content to image URL
	async function convertSvgToImageUrl(
		svgContent: string,
		method: 'blob' | 'dataurl' | 'canvas'
	): Promise<string> {
		if (!svgContent.trim()) {
			throw new Error('SVG content is empty');
		}

		switch (method) {
			case 'blob':
				return createBlobUrl(svgContent);

			case 'dataurl':
				return createDataUrl(svgContent);

			case 'canvas':
				return await createCanvasUrl(svgContent);

			default:
				throw new Error(`Unknown render method: ${method}`);
		}
	}

	// Method 1: Blob URL (Best performance, automatic cleanup)
	function createBlobUrl(svgContent: string): string {
		// Clean up previous blob URL
		if (blobUrl) {
			URL.revokeObjectURL(blobUrl);
		}

		// Ensure SVG has proper XML declaration and namespace
		let cleanSvg = svgContent.trim();
		if (!cleanSvg.startsWith('<?xml')) {
			cleanSvg = `<?xml version="1.0" encoding="UTF-8"?>\n${cleanSvg}`;
		}

		// Ensure SVG has proper namespace
		if (!cleanSvg.includes('xmlns=')) {
			cleanSvg = cleanSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
		}

		const blob = new Blob([cleanSvg], { type: 'image/svg+xml;charset=utf-8' });
		blobUrl = URL.createObjectURL(blob);
		return blobUrl;
	}

	// Method 2: Data URL (Simple, but can be large)
	function createDataUrl(svgContent: string): string {
		// Clean and encode SVG
		let cleanSvg = svgContent.trim();
		if (!cleanSvg.startsWith('<?xml')) {
			cleanSvg = `<?xml version="1.0" encoding="UTF-8"?>\n${cleanSvg}`;
		}

		if (!cleanSvg.includes('xmlns=')) {
			cleanSvg = cleanSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
		}

		// For data URLs, we can use base64 or URL encoding
		// URL encoding is often smaller for SVGs
		const encoded = encodeURIComponent(cleanSvg);
		return `data:image/svg+xml;charset=utf-8,${encoded}`;
	}

	// Method 3: Canvas conversion (Most compatible, but performance overhead)
	async function createCanvasUrl(svgContent: string): Promise<string> {
		return new Promise((resolve, reject) => {
			// Create a temporary image to get SVG dimensions
			const tempImg = new Image();
			const tempSvgUrl = createDataUrl(svgContent);

			tempImg.onload = () => {
				try {
					const canvas = document.createElement('canvas');
					const ctx = canvas.getContext('2d');

					if (!ctx) {
						throw new Error('Could not get canvas context');
					}

					// Set canvas size (respect max dimensions if provided)
					let { width, height } = tempImg;

					if (maxWidth && width > maxWidth) {
						height = (height * maxWidth) / width;
						width = maxWidth;
					}

					if (maxHeight && height > maxHeight) {
						width = (width * maxHeight) / height;
						height = maxHeight;
					}

					canvas.width = width;
					canvas.height = height;

					// Draw SVG to canvas
					ctx.drawImage(tempImg, 0, 0, width, height);

					// Convert canvas to blob URL
					canvas.toBlob((blob) => {
						if (blob) {
							const url = URL.createObjectURL(blob);
							resolve(url);
						} else {
							reject(new Error('Failed to create blob from canvas'));
						}
					}, 'image/png');
				} catch (err) {
					reject(err);
				}
			};

			tempImg.onerror = () => {
				reject(new Error('Failed to load SVG for canvas conversion'));
			};

			tempImg.src = tempSvgUrl;
		});
	}

	// Convert SVG when content changes
	$effect(() => {
		if (svgContent) {
			error = null;

			convertSvgToImageUrl(svgContent, renderMethod)
				.then((url) => {
					imageUrl = url;
				})
				.catch((err) => {
					console.error('[SvgImageViewer] Failed to convert SVG:', err);
					error = `Failed to render SVG: ${err.message}`;
					imageUrl = null;
				});
		} else {
			imageUrl = null;
			error = null;
		}
	});

	// Cleanup blob URLs on destroy
	onDestroy(() => {
		if (blobUrl) {
			URL.revokeObjectURL(blobUrl);
		}

		// Also cleanup if imageUrl is a blob URL from canvas method
		if (imageUrl && imageUrl.startsWith('blob:')) {
			URL.revokeObjectURL(imageUrl);
		}
	});
</script>

{#if error}
	<div class="flex h-full items-center justify-center text-red-500">
		<div class="text-center">
			<p class="text-sm font-medium">SVG Rendering Error</p>
			<p class="mt-1 text-xs text-gray-500">{error}</p>
		</div>
	</div>
{:else if imageUrl}
	<!-- Use the same ScrollFriendlyImageViewer for consistent pan/zoom experience -->
	<ScrollFriendlyImageViewer src={imageUrl} {alt} panel="converted" />
{:else if svgContent}
	<div class="flex h-full items-center justify-center text-gray-400">
		<div class="text-center">
			<div
				class="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"
			></div>
			<p class="text-sm">Converting SVG...</p>
		</div>
	</div>
{:else}
	<div class="flex h-full items-center justify-center text-gray-400">
		<p class="text-sm">No SVG content</p>
	</div>
{/if}
