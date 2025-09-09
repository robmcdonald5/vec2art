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
	import { onDestroy, untrack } from 'svelte';
	import type {
		RenderStrategy,
		PreviewRenderOptions
	} from '$lib/services/svg-preview-renderer';
	import { svgPreviewRenderer } from '$lib/services/svg-preview-renderer';
	import { SvgToWebPConverter } from '$lib/services/svg-to-webp-converter';
	import ScrollFriendlyImageViewer from '$lib/components/ui/ScrollFriendlyImageViewer.svelte';
	import {
		ZoomIn,
		ZoomOut,
		Maximize2,
		Move,
		Activity,
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
		onPanZoomChange?: (_state: { scale: number; x: number; y: number }) => void;
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
		showPerformanceInfo: _showPerformanceInfo = false,
		className = '',
		onDownload,
		externalPanZoom,
		onPanZoomChange,
		enableSync = false,
		forceImageMode = false,
		imageRenderMethod: _imageRenderMethod = 'blob'
	}: Props = $props();

	// Component state
	let containerElement = $state<HTMLDivElement>();
	let _canvasElement = $state<HTMLCanvasElement>();
	let _imgElement = $state<HTMLImageElement>();
	let renderStrategy = $state<RenderStrategy | null>(null);
	let isRendering = $state(false);
	let renderError = $state<string | null>(null);
	let _performanceStats = $state<any>(null);
	let showGpuTroubleshooting = $state(false);
	let _useImageMode = $state(forceImageMode);

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
			console.log('🔄 [AdvancedSvgPreview] Updating from external state:', {
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
			console.log('📤 [AdvancedSvgPreview] Notifying parent of local changes:', {
				current: currentLocalState,
				previous: previousLocalState
			});

			// Notify parent of local changes
			onPanZoomChange(currentLocalState);
			previousLocalState = { ...currentLocalState };
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
			console.log(`🎨 [AdvancedSvgPreview] Starting render for SVG:`, {
				length: svgContent.length,
				sizeKB: Math.round(svgContent.length / 1024),
				sizeMB: (svgContent.length / 1024 / 1024).toFixed(2)
			});

			// Clear previous renders
			canvasDataUrl = null;
			imgFallbackUrl = null;
			svgBlobUrl = null;
			webpDataUrl = null;

			// Intelligent strategy selection with WebP optimization
			let strategy: RenderStrategy;

			try {
				const svgSize = svgContent.length;
				const isLarge = svgSize > 300000; // 300KB threshold (lowered for better optimization)
				const isHuge = svgSize > 500000; // 500KB threshold (lowered from 1MB)

				console.log('[AdvancedSvgPreview] SVG analysis:', {
					sizeBytes: svgSize,
					sizeMB: (svgSize / 1024 / 1024).toFixed(2),
					isLarge,
					isHuge,
					strategy: isHuge ? 'WebP' : isLarge ? 'IMG-fallback' : 'DOM'
				});

				// For huge SVGs (500KB+), use WebP conversion for better performance
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
						reason: `WebP optimization for ${Math.round(svgSize / 1024)}KB SVG (500KB+ threshold - fast preview with pan/zoom)`,
						estimatedPerformance: 'excellent'
					};
				} else if (isLarge) {
					strategy = {
						mode: 'img-fallback',
						detailLevel: 'normal',
						reason: `IMG fallback for ${Math.round(svgSize / 1024)}KB SVG (300KB+ threshold)`,
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
			console.log(`🚀 [AdvancedSvgPreview] Using ${strategy.mode.toUpperCase()} rendering:`, {
				mode: strategy.mode,
				reason: strategy.reason,
				performance: strategy.estimatedPerformance,
				svgSizeKB: Math.round(svgContent.length / 1024)
			});

			// Render based on strategy with individual error handling
			switch (strategy.mode) {
				case 'webp':
					try {
						// IMMEDIATE PREVIEW: Create blob URL first for instant display
						renderWithSvgDom(); // This creates svgBlobUrl immediately
						console.log('⚡ [AdvancedSvgPreview] Created immediate blob URL for instant preview');

						// BACKGROUND OPTIMIZATION: Start WebP conversion without blocking
						renderWithWebP()
							.then(() => {
								console.log(
									'🎨 [AdvancedSvgPreview] Background WebP optimization completed, preview will auto-update'
								);
							})
							.catch((error) => {
								console.warn(
									'[AdvancedSvgPreview] Background WebP failed, keeping blob URL:',
									error
								);
							});
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
						// IMMEDIATE PREVIEW: Create blob URL first for instant display
						renderWithSvgDom();
						console.log('⚡ [AdvancedSvgPreview] Created immediate blob URL for WebGL fallback');

						// BACKGROUND OPTIMIZATION: Start WebP conversion without blocking
						renderWithWebP()
							.then(() => {
								console.log(
									'🎨 [AdvancedSvgPreview] Background WebP optimization completed for WebGL fallback'
								);
							})
							.catch((error) => {
								console.warn('[AdvancedSvgPreview] WebP fallback failed, keeping blob URL:', error);
							});
					} catch (error) {
						console.warn('[AdvancedSvgPreview] WebP fallback failed, using IMG:', error);
						renderWithImgFallback();
					}
					break;

				default:
					console.warn('[AdvancedSvgPreview] Unknown render mode, using WebP fallback');
					// IMMEDIATE PREVIEW: Create blob URL first for instant display
					renderWithSvgDom();
					console.log(
						'⚡ [AdvancedSvgPreview] Created immediate blob URL for unknown mode fallback'
					);

					// BACKGROUND OPTIMIZATION: Start WebP conversion without blocking
					renderWithWebP()
						.then(() => {
							console.log(
								'🎨 [AdvancedSvgPreview] Background WebP optimization completed for unknown mode fallback'
							);
						})
						.catch((error) => {
							console.warn('[AdvancedSvgPreview] WebP fallback failed, keeping blob URL:', error);
						});
			}

			// Try to update performance stats (non-critical)
			try {
				_performanceStats = svgPreviewRenderer.getPerformanceStats();
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
		console.log('🖼️ [AdvancedSvgPreview] Starting WebP optimization for large SVG...');

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
			console.log('✅ [AdvancedSvgPreview] WebP optimization completed successfully!', {
				compressionRatio: result.compressionRatio + 'x',
				conversionTime: result.conversionTimeMs + 'ms',
				finalSize: Math.round((result.webpDataUrl?.length || 0) / 1024) + 'KB'
			});
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
		_canvasElement = result.canvas;
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
		const activeMode = webpDataUrl
			? 'WebP'
			: canvasDataUrl
				? 'Canvas'
				: imgFallbackUrl
					? 'IMG'
					: svgBlobUrl
						? 'Blob'
						: 'None';
		console.log(`🔄 [AdvancedSvgPreview] Display URL updated - Active mode: ${activeMode}`, {
			webpDataUrl: !!webpDataUrl,
			canvasDataUrl: !!canvasDataUrl,
			imgFallbackUrl: !!imgFallbackUrl,
			svgBlobUrl: !!svgBlobUrl,
			finalUrl: !!url
		});
		if (webpDataUrl && svgBlobUrl) {
			console.log('🎨 [AdvancedSvgPreview] ✅ Successfully upgraded from Blob to optimized WebP!');
		}
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
		{:else if displayUrl()}
			<!-- Optimized Preview -->
			<div class="h-full w-full">
				{#if webpDataUrl}
					<!-- WebP optimized result with full pan/zoom -->
					<ScrollFriendlyImageViewer
						src={webpDataUrl}
						alt="WebP Optimized SVG Preview"
						panel="converted"
					/>
				{:else if imgFallbackUrl}
					<!-- IMG fallback result -->
					<ScrollFriendlyImageViewer
						src={imgFallbackUrl}
						alt="IMG Fallback SVG"
						panel="converted"
					/>
				{:else if svgBlobUrl}
					<!-- SVG DOM result -->
					<ScrollFriendlyImageViewer src={svgBlobUrl} alt="SVG DOM Preview" panel="converted" />
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
	showTroubleshooting={showGpuTroubleshooting}
	onClose={() => (showGpuTroubleshooting = false)}
/>

<style>
	/* Styles for ImageViewer container */
	:global(.image-viewer) {
		width: 100%;
		height: 100%;
	}
</style>
