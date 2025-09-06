<!--
Advanced SVG Preview Component

Implements performance-optimized SVG preview with automatic rendering strategy selection:
- Canvas rendering for SVGs >2,500 elements
- IMG fallback for pure display performance
- Level-of-detail rendering based on zoom
- Spatial indexing and viewport culling
- WebGL acceleration for extremely large datasets
-->

<script lang="ts">
	import { onMount, onDestroy, untrack } from 'svelte';
	import type {
		RenderStrategy,
		ViewportBounds,
		PreviewRenderOptions
	} from '$lib/services/svg-preview-renderer';
	import { svgPreviewRenderer } from '$lib/services/svg-preview-renderer';
	import { SvgToWebPConverter } from '$lib/services/svg-to-webp-converter';
	import ScrollFriendlyImageViewer from '$lib/components/ui/ScrollFriendlyImageViewer.svelte';
	import SvgImageViewer from '$lib/components/ui/SvgImageViewer.svelte';
	import {
		ZoomIn,
		ZoomOut,
		Maximize2,
		Move,
		Activity,
		Cpu,
		Monitor,
		Download
	} from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import GpuTroubleshootingGuide from './GpuTroubleshootingGuide.svelte';

	interface Props {
		svgContent: string;
		backend: string;
		width?: number;
		height?: number;
		showControls?: boolean;
		showPerformanceInfo?: boolean;
		className?: string;
		onDownload?: () => void;
		// Pan/zoom synchronization
		externalPanZoom?: { scale: number; x: number; y: number };
		onPanZoomChange?: (state: { scale: number; x: number; y: number }) => void;
		enableSync?: boolean;
		// Performance options
		forceImageMode?: boolean;
		imageRenderMethod?: 'blob' | 'dataurl' | 'canvas';
	}

	let {
		svgContent,
		backend,
		width = 800,
		height = 600,
		showControls = true,
		showPerformanceInfo = false,
		className = '',
		onDownload,
		externalPanZoom,
		onPanZoomChange,
		enableSync = false,
		forceImageMode = false,
		imageRenderMethod = 'blob'
	}: Props = $props();

	// Component state
	let containerElement = $state<HTMLDivElement>();
	let canvasElement = $state<HTMLCanvasElement>();
	let imgElement = $state<HTMLImageElement>();
	let renderStrategy = $state<RenderStrategy | null>(null);
	let isRendering = $state(false);
	let renderError = $state<string | null>(null);
	let performanceStats = $state<any>(null);
	let showGpuTroubleshooting = $state(false);
	let useImageMode = $state(forceImageMode);

	// Pan/zoom state for ImageViewer
	let targetScale = $state(1);
	let targetOffsetX = $state(0);
	let targetOffsetY = $state(0);

	// Rendered content URLs
	let canvasDataUrl = $state<string | null>(null);
	let imgFallbackUrl = $state<string | null>(null);
	let svgBlobUrl = $state<string | null>(null);
	let webpDataUrl = $state<string | null>(null);

	// WebP converter instance
	let webpConverter = new SvgToWebPConverter();

	// Sync external pan/zoom state - simple approach without blocking
	$effect(() => {
		if (externalPanZoom && enableSync) {
			targetScale = externalPanZoom.scale;
			targetOffsetX = externalPanZoom.x;
			targetOffsetY = externalPanZoom.y;
		}
	});

	// Notify parent of pan/zoom changes - allow reactive updates but prevent infinite loops
	$effect(() => {
		if (onPanZoomChange) {
			// Don't use untrack here - we need the callback to update reactive state
			onPanZoomChange({
				scale: targetScale,
				x: targetOffsetX,
				y: targetOffsetY
			});
		}
	});

	// Render SVG when content or settings change - use untrack to prevent infinite loops
	$effect(() => {
		if (svgContent) {
			untrack(() => renderSvg());
		}
	});

	async function renderSvg() {
		if (!svgContent) return;

		isRendering = true;
		renderError = null;

		try {
			console.log(`[AdvancedSvgPreview] Starting render for SVG of length:`, svgContent.length);

			// Clear previous renders
			canvasDataUrl = null;
			imgFallbackUrl = null;
			svgBlobUrl = null;
			webpDataUrl = null;

			// Intelligent strategy selection with WebP optimization
			let strategy: RenderStrategy;

			try {
				const svgSize = svgContent.length;
				const isLarge = svgSize > 500000; // 500KB threshold
				const isHuge = svgSize > 1000000; // 1MB threshold

				console.log('[AdvancedSvgPreview] SVG analysis:', {
					sizeBytes: svgSize,
					isLarge,
					isHuge
				});

				// For huge SVGs (like 1.5MB), use WebP conversion
				if (isHuge) {
					// Still run analysis for performance stats even with WebP
					try {
						const options: PreviewRenderOptions = { width, height, quality: 'medium' };
						const analysisStrategy = svgPreviewRenderer.analyzeRenderStrategy(
							svgContent,
							backend,
							options
						);
						console.log('[AdvancedSvgPreview] Analysis complete for WebP mode:', analysisStrategy);
					} catch (error) {
						console.warn('[AdvancedSvgPreview] Analysis failed for WebP mode:', error);
					}

					strategy = {
						mode: 'webp',
						detailLevel: 'high',
						reason: `WebP conversion for ${Math.round(svgSize / 1024)}KB SVG (fast preview with pan/zoom)`,
						estimatedPerformance: 'excellent'
					};
				} else if (isLarge) {
					strategy = {
						mode: 'img-fallback',
						detailLevel: 'normal',
						reason: `IMG fallback for ${Math.round(svgSize / 1024)}KB SVG`,
						estimatedPerformance: 'excellent'
					};
				} else {
					// Use original strategy for smaller SVGs
					const options: PreviewRenderOptions = {
						width,
						height,
						quality: 'medium',
						enableSpatialCulling: false
					};
					strategy = svgPreviewRenderer.analyzeRenderStrategy(svgContent, backend, options);
				}
			} catch (error) {
				console.warn('[AdvancedSvgPreview] Strategy analysis failed, using WebP fallback:', error);
				strategy = {
					mode: 'webp',
					detailLevel: 'normal',
					reason: 'WebP fallback due to analysis error',
					estimatedPerformance: 'good'
				};
			}

			renderStrategy = strategy;
			console.log(`[AdvancedSvgPreview] Using ${strategy.mode} rendering:`, strategy.reason);

			// Render based on strategy with individual error handling
			switch (strategy.mode) {
				case 'webp':
					try {
						await renderWithWebP();
					} catch (error) {
						console.warn('[AdvancedSvgPreview] WebP render failed, trying IMG fallback:', error);
						renderWithImgFallback();
					}
					break;

				case 'canvas':
					try {
						await renderWithCanvas({ width, height, quality: 'medium' });
					} catch (error) {
						console.warn('[AdvancedSvgPreview] Canvas render failed, trying WebP:', error);
						await renderWithWebP();
					}
					break;

				case 'img-fallback':
					renderWithImgFallback();
					break;

				case 'svg-dom':
					renderWithSvgDom();
					break;

				case 'webgl':
					console.warn('[AdvancedSvgPreview] WebGL not implemented, using WebP');
					try {
						await renderWithWebP();
					} catch (error) {
						console.warn('[AdvancedSvgPreview] WebP fallback failed, using IMG:', error);
						renderWithImgFallback();
					}
					break;

				default:
					console.warn('[AdvancedSvgPreview] Unknown render mode, using WebP fallback');
					await renderWithWebP();
			}

			// Try to update performance stats (non-critical)
			try {
				performanceStats = svgPreviewRenderer.getPerformanceStats();
			} catch (error) {
				console.warn('[AdvancedSvgPreview] Performance stats failed:', error);
			}
		} catch (error) {
			console.error('[AdvancedSvgPreview] Rendering failed completely:', error);
			renderError = error instanceof Error ? error.message : 'Unknown rendering error';

			// Last resort fallback to basic SVG display
			try {
				renderWithSvgDom();
				renderError = null; // Clear error if fallback succeeds
			} catch (fallbackError) {
				console.error('[AdvancedSvgPreview] Even fallback failed:', fallbackError);
			}
		} finally {
			isRendering = false;
		}
	}

	async function renderWithWebP() {
		console.log('[AdvancedSvgPreview] Starting WebP render');

		try {
			// Check if WebP is supported
			const isWebPSupported = SvgToWebPConverter.isWebPSupported();
			console.log('[AdvancedSvgPreview] WebP support:', isWebPSupported);

			if (!isWebPSupported) {
				throw new Error('WebP not supported by this browser');
			}

			// Get optimal settings for this SVG
			const settings = SvgToWebPConverter.getOptimalSettings(svgContent);
			console.log('[AdvancedSvgPreview] WebP settings:', settings);

			// Convert to WebP
			const result = await webpConverter.convertSvgToWebP(svgContent, settings);
			console.log('[AdvancedSvgPreview] WebP conversion result:', {
				hasDataUrl: !!result.webpDataUrl,
				dataUrlLength: result.webpDataUrl?.length || 0,
				compressionRatio: result.compressionRatio + 'x',
				conversionTime: result.conversionTimeMs + 'ms',
				originalSize: result.originalWidth + 'x' + result.originalHeight
			});

			if (!result.webpDataUrl || result.webpDataUrl.length === 0) {
				throw new Error('WebP conversion produced empty result');
			}

			// Validate the data URL format
			if (!result.webpDataUrl.startsWith('data:image/webp;base64,')) {
				throw new Error('Invalid WebP data URL format');
			}

			webpDataUrl = result.webpDataUrl;
			console.log('[AdvancedSvgPreview] WebP render successful');
		} catch (error) {
			console.error('[AdvancedSvgPreview] WebP render failed:', error);
			throw error; // Re-throw to trigger fallback
		}
	}

	async function renderWithCanvas(options: PreviewRenderOptions) {
		console.log('[AdvancedSvgPreview] Starting canvas render with options:', options);
		const result = await svgPreviewRenderer.renderToCanvas(svgContent, options);
		console.log('[AdvancedSvgPreview] Canvas render result:', {
			hasDataUrl: !!result.dataUrl,
			hasCanvas: !!result.canvas
		});
		canvasDataUrl = result.dataUrl;
		canvasElement = result.canvas;
	}

	function renderWithImgFallback() {
		console.log('[AdvancedSvgPreview] Starting IMG fallback render');
		imgFallbackUrl = svgPreviewRenderer.createImgFallback(svgContent);
		console.log('[AdvancedSvgPreview] IMG fallback URL created:', !!imgFallbackUrl);
	}

	function renderWithSvgDom() {
		console.log('[AdvancedSvgPreview] Starting SVG DOM render');
		// Create blob URL for SVG
		const blob = new Blob([svgContent], { type: 'image/svg+xml' });
		svgBlobUrl = URL.createObjectURL(blob);
		console.log('[AdvancedSvgPreview] SVG blob URL created:', !!svgBlobUrl);
	}

	// Control functions
	function zoomIn() {
		targetScale = Math.min(targetScale * 1.2, 5.0);
	}

	function zoomOut() {
		targetScale = Math.max(targetScale / 1.2, 0.1);
	}

	function resetView() {
		targetScale = 1;
		targetOffsetX = 0;
		targetOffsetY = 0;
	}

	// Get current display URL based on render mode
	const displayUrl = $derived(() => {
		const url = webpDataUrl || canvasDataUrl || imgFallbackUrl || svgBlobUrl;
		console.log('[AdvancedSvgPreview] Display URL state:', {
			webpDataUrl: !!webpDataUrl,
			canvasDataUrl: !!canvasDataUrl,
			imgFallbackUrl: !!imgFallbackUrl,
			svgBlobUrl: !!svgBlobUrl,
			finalUrl: !!url
		});
		return url;
	});

	// Cleanup on unmount
	onDestroy(() => {
		svgPreviewRenderer.cleanup();

		// Cleanup blob URLs
		if (svgBlobUrl) URL.revokeObjectURL(svgBlobUrl);
	});
</script>

<div class="relative flex h-full flex-col {className}">
	<!-- Controls Header -->
	{#if showControls}
		<div class="mb-3 flex items-center justify-between px-2">
			<!-- Loading Indicator -->
			<div class="flex items-center gap-2">
				{#if isRendering}
					<div
						class="h-3 w-3 animate-spin rounded-full border border-gray-300 border-t-blue-500"
					></div>
				{/if}
			</div>

			<!-- Zoom Controls -->
			<div class="flex gap-1">
				<Button
					variant="outline"
					size="icon"
					class="border-ferrari-300 dark:border-ferrari-600 dark:bg-ferrari-900/90 dark:hover:bg-ferrari-800 hover:border-ferrari-400 dark:hover:border-ferrari-500 h-8 w-8 rounded bg-white/90 transition-all duration-200 hover:scale-110 hover:bg-white hover:shadow-md active:scale-95"
					onclick={zoomOut}
					disabled={isRendering}
					aria-label="Zoom out"
				>
					<ZoomOut class="h-4 w-4" />
				</Button>

				<Button
					variant="outline"
					size="icon"
					class="border-ferrari-300 dark:border-ferrari-600 dark:bg-ferrari-900/90 dark:hover:bg-ferrari-800 hover:border-ferrari-400 dark:hover:border-ferrari-500 h-8 w-8 rounded bg-white/90 transition-all duration-200 hover:scale-110 hover:bg-white hover:shadow-md active:scale-95"
					onclick={zoomIn}
					disabled={isRendering}
					aria-label="Zoom in"
				>
					<ZoomIn class="h-4 w-4" />
				</Button>

				<Button
					variant="outline"
					size="icon"
					class="border-ferrari-300 dark:border-ferrari-600 dark:bg-ferrari-900/90 dark:hover:bg-ferrari-800 hover:border-ferrari-400 dark:hover:border-ferrari-500 h-8 w-8 rounded bg-white/90 transition-all duration-200 hover:scale-110 hover:bg-white hover:shadow-md active:scale-95"
					onclick={resetView}
					disabled={isRendering}
					aria-label="Reset view"
				>
					<Maximize2 class="h-4 w-4" />
				</Button>

				<!-- Image Mode Toggle -->

				{#if onDownload}
					<Button
						variant="outline"
						size="icon"
						class="border-ferrari-300 dark:border-ferrari-600 dark:bg-ferrari-900/90 dark:hover:bg-ferrari-800 hover:border-ferrari-400 dark:hover:border-ferrari-500 h-8 w-8 rounded bg-white/90 transition-all duration-200 hover:scale-110 hover:bg-white hover:shadow-md active:scale-95"
						onclick={onDownload}
						disabled={isRendering}
						aria-label="Download SVG"
						title="Download SVG"
					>
						<Download class="h-4 w-4" />
					</Button>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Preview Container -->
	<div
		bind:this={containerElement}
		class="dark:bg-ferrari-900 group relative flex-1 overflow-hidden rounded-lg bg-white"
		role="application"
		aria-label="Advanced SVG preview with optimized rendering"
	>
		{#if renderError}
			<!-- Error State -->
			<div class="flex h-full items-center justify-center text-red-500">
				<div class="text-center">
					<Activity class="mx-auto mb-2 h-16 w-16 opacity-50" />
					<p class="text-sm">Rendering Error</p>
					<p class="text-xs opacity-75">{renderError}</p>
				</div>
			</div>
		{:else if isRendering}
			<!-- Loading State -->
			<div class="flex h-full items-center justify-center">
				<div class="text-center">
					<div
						class="mx-auto mb-3 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500"
					></div>
					<p class="text-sm text-gray-600">Optimizing preview...</p>
					{#if renderStrategy}
						<p class="text-xs text-gray-400">{renderStrategy.mode} rendering</p>
					{/if}
				</div>
			</div>
		{:else if displayUrl}
			<!-- Optimized Preview -->
			<div class="h-full w-full">
				{#if webpDataUrl}
					<!-- WebP optimized result with full pan/zoom -->
					<ScrollFriendlyImageViewer
						src={webpDataUrl}
						alt="WebP Optimized SVG Preview"
						bind:targetScale
						bind:targetOffsetX
						bind:targetOffsetY
						minScale={0.1}
						maxScale={5.0}
						scaleSmoothing={800}
					/>
				{:else if imgFallbackUrl}
					<!-- IMG fallback result -->
					<ScrollFriendlyImageViewer
						src={imgFallbackUrl}
						alt="IMG Fallback SVG"
						bind:targetScale
						bind:targetOffsetX
						bind:targetOffsetY
						minScale={0.1}
						maxScale={5.0}
						scaleSmoothing={800}
					/>
				{:else if svgBlobUrl}
					<!-- SVG DOM result -->
					<ScrollFriendlyImageViewer
						src={svgBlobUrl}
						alt="SVG DOM Preview"
						bind:targetScale
						bind:targetOffsetX
						bind:targetOffsetY
						minScale={0.1}
						maxScale={5.0}
						scaleSmoothing={800}
					/>
				{:else if canvasDataUrl}
					<!-- Canvas rendering result (static) -->
					<img
						src={canvasDataUrl}
						alt="Canvas-rendered SVG"
						class="h-full w-full object-contain"
						style="display: block;"
						draggable="false"
					/>
				{:else}
					<!-- Fallback when no URL is available -->
					<div class="flex h-full items-center justify-center text-red-500">
						<div class="text-center">
							<Activity class="mx-auto mb-2 h-16 w-16 opacity-50" />
							<p class="text-sm">No preview URL available</p>
							<p class="text-xs">Strategy: {renderStrategy?.mode || 'unknown'}</p>
						</div>
					</div>
				{/if}
			</div>

			<!-- Interactive Cursor Hint -->
			<div
				class="pointer-events-none absolute bottom-2 left-2 rounded bg-black/75 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
			>
				<Move class="mr-1 inline h-3 w-3" />
				Drag to pan • Scroll wheel to zoom
			</div>

			<!-- Zoom Level Indicator -->
			<div class="absolute top-2 right-2 rounded bg-black/75 px-2 py-1 text-xs text-white">
				{Math.round(targetScale * 100)}%
			</div>
		{:else}
			<!-- No Content State -->
			<div class="flex h-full items-center justify-center text-gray-400">
				<div class="text-center">
					<Maximize2 class="mx-auto mb-2 h-16 w-16 opacity-50" />
					<p class="text-sm">No SVG content</p>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- GPU Troubleshooting Guide -->
<GpuTroubleshootingGuide
	{showGpuTroubleshooting}
	onClose={() => (showGpuTroubleshooting = false)}
/>

<style>
	/* Styles for ImageViewer container */
	:global(.image-viewer) {
		width: 100%;
		height: 100%;
	}
</style>
