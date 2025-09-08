<script lang="ts">
	import { modernPanZoomStore } from '$lib/stores/modern-pan-zoom.svelte';
	import type { Transform } from '$lib/stores/modern-pan-zoom.svelte';

	interface Props {
		src: string;
		alt: string;
		panel: 'original' | 'converted';
		class?: string;
	}

	const { src, alt, panel, class: className = '' }: Props = $props();

	let container: HTMLDivElement;
	let image: HTMLImageElement;
	
	// Local interaction state
	let isPointerDown = $state(false);
	let startPointer = $state({ x: 0, y: 0 });
	let startTransform = $state<Transform>({ x: 0, y: 0, scale: 1 });
	let imageLoaded = $state(false);
	
	// Track last known mouse position for button-based zooming
	let lastMousePosition = $state<{ x: number; y: number } | null>(null);

	// Get reactive transform string from store
	const transformStyle = $derived(
		panel === 'original' 
			? modernPanZoomStore.originalTransform 
			: modernPanZoomStore.convertedTransform
	);

	// Get current state for this panel
	const currentState = $derived(
		panel === 'original' 
			? modernPanZoomStore.originalState 
			: modernPanZoomStore.convertedState
	);

	/**
	 * Handle pointer down (mouse/touch start)
	 */
	function handlePointerDown(event: PointerEvent) {
		if (!event.isPrimary) return;
		
		isPointerDown = true;
		startPointer = { x: event.clientX, y: event.clientY };
		startTransform = { ...currentState };
		
		modernPanZoomStore.setDragging(true, panel);
		container.setPointerCapture(event.pointerId);
		event.preventDefault();
	}

	/**
	 * Handle pointer move (mouse/touch drag)
	 */
	function handlePointerMove(event: PointerEvent) {
		if (!isPointerDown || !event.isPrimary) return;
		
		const deltaX = event.clientX - startPointer.x;
		const deltaY = event.clientY - startPointer.y;
		
		modernPanZoomStore.updatePanel(panel, {
			x: startTransform.x + deltaX,
			y: startTransform.y + deltaY,
			scale: startTransform.scale
		});
	}

	/**
	 * Handle pointer up (mouse/touch end)
	 */
	function handlePointerUp(event: PointerEvent) {
		if (!event.isPrimary) return;
		
		isPointerDown = false;
		modernPanZoomStore.setDragging(false);
		
		if (container.hasPointerCapture(event.pointerId)) {
			container.releasePointerCapture(event.pointerId);
		}
	}

	/**
	 * Handle wheel zoom
	 */
	function handleWheel(event: WheelEvent) {
		event.preventDefault();
		
		const rect = container.getBoundingClientRect();
		const centerX = event.clientX - rect.left;
		const centerY = event.clientY - rect.top;
		
		const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
		
		modernPanZoomStore.zoom(panel, zoomFactor, {
			x: centerX,
			y: centerY
		});
	}

	/**
	 * Handle keyboard navigation
	 */
	function handleKeyDown(event: KeyboardEvent) {
		const panStep = 50;
		const zoomStep = 1.1;
		
		switch (event.code) {
			case 'ArrowUp':
				event.preventDefault();
				modernPanZoomStore.pan(panel, 0, panStep);
				break;
			case 'ArrowDown':
				event.preventDefault();
				modernPanZoomStore.pan(panel, 0, -panStep);
				break;
			case 'ArrowLeft':
				event.preventDefault();
				modernPanZoomStore.pan(panel, panStep, 0);
				break;
			case 'ArrowRight':
				event.preventDefault();
				modernPanZoomStore.pan(panel, -panStep, 0);
				break;
			case 'Equal':
			case 'NumpadAdd':
				event.preventDefault();
				modernPanZoomStore.zoom(panel, zoomStep);
				break;
			case 'Minus':
			case 'NumpadSubtract':
				event.preventDefault();
				modernPanZoomStore.zoom(panel, 1 / zoomStep);
				break;
			case 'Digit0':
			case 'Numpad0':
				event.preventDefault();
				modernPanZoomStore.resetPanel(panel);
				break;
		}
	}

	/**
	 * Handle image load
	 */
	function handleImageLoad() {
		imageLoaded = true;
	}

	/**
	 * Handle touch gestures (pinch to zoom)
	 */
	let initialTouchDistance = $state(0);
	let initialScale = $state(1);

	function handleTouchStart(event: TouchEvent) {
		if (event.touches.length === 2) {
			const touch1 = event.touches[0];
			const touch2 = event.touches[1];
			
			initialTouchDistance = Math.hypot(
				touch2.clientX - touch1.clientX,
				touch2.clientY - touch1.clientY
			);
			initialScale = currentState.scale;
			event.preventDefault();
		}
	}

	function handleTouchMove(event: TouchEvent) {
		if (event.touches.length === 2) {
			const touch1 = event.touches[0];
			const touch2 = event.touches[1];
			
			const currentDistance = Math.hypot(
				touch2.clientX - touch1.clientX,
				touch2.clientY - touch1.clientY
			);
			
			const scaleChange = currentDistance / initialTouchDistance;
			const newScale = initialScale * scaleChange;
			
			modernPanZoomStore.updatePanel(panel, {
				...currentState,
				scale: newScale
			});
			
			event.preventDefault();
		}
	}

	// Global event listeners for smooth dragging
	$effect(() => {
		if (!isPointerDown) return;
		
		const handleGlobalPointerMove = (e: PointerEvent) => handlePointerMove(e);
		const handleGlobalPointerUp = (e: PointerEvent) => handlePointerUp(e);
		
		document.addEventListener('pointermove', handleGlobalPointerMove);
		document.addEventListener('pointerup', handleGlobalPointerUp);
		
		return () => {
			document.removeEventListener('pointermove', handleGlobalPointerMove);
			document.removeEventListener('pointerup', handleGlobalPointerUp);
		};
	});

	// Accessibility features
	const zoomPercentage = $derived(Math.round(currentState.scale * 100));
	
	/**
	 * Get the current viewport dimensions for centered zooming
	 */
	export function getViewportRect(): DOMRect | null {
		return container?.getBoundingClientRect() || null;
	}
	
	/**
	 * Zoom towards last mouse position (for button-based controls)
	 */
	export function zoomToCenter(factor: number) {
		if (lastMousePosition) {
			// Zoom towards last known mouse position
			modernPanZoomStore.zoom(panel, factor, lastMousePosition);
		} else {
			// Fallback to viewport center if no mouse position tracked
			const rect = getViewportRect();
			if (rect) {
				const centerX = rect.width / 2;
				const centerY = rect.height / 2;
				modernPanZoomStore.zoom(panel, factor, { x: centerX, y: centerY });
			} else {
				modernPanZoomStore.zoom(panel, factor);
			}
		}
	}
	
	/**
	 * Track mouse position even when not dragging
	 */
	function trackMousePosition(event: PointerEvent) {
		if (container && event.isPrimary) {
			const rect = container.getBoundingClientRect();
			lastMousePosition = {
				x: event.clientX - rect.left,
				y: event.clientY - rect.top
			};
		}
	}
</script>

<div 
	bind:this={container}
	class="modern-pan-zoom-container {className}"
	role="application"
	aria-label="{alt} - Pannable and zoomable image viewer"
	aria-describedby="zoom-info-{panel}"
	tabindex="0"
	onpointerdown={handlePointerDown}
	onpointermove={trackMousePosition}
	onwheel={handleWheel}
	onkeydown={handleKeyDown}
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
>
	<img 
		bind:this={image}
		{src} 
		{alt}
		onload={handleImageLoad}
		style="transform: {transformStyle}"
		draggable="false"
		class="pan-zoom-image"
	/>
	
	<!-- Screen reader info -->
	<div 
		id="zoom-info-{panel}" 
		class="sr-only" 
		aria-live="polite"
	>
		{panel} panel: {zoomPercentage}% zoom, position {Math.round(currentState.x)}, {Math.round(currentState.y)}
	</div>
</div>

<style>
	.modern-pan-zoom-container {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		cursor: grab;
		user-select: none;
		touch-action: none;
		background: transparent;
	}
	
	.modern-pan-zoom-container:active {
		cursor: grabbing;
	}
	
	.modern-pan-zoom-container:focus {
		outline: 2px solid #0066cc;
		outline-offset: 2px;
	}
	
	.pan-zoom-image {
		display: block;
		max-width: none;
		max-height: none;
		width: 100%;
		height: 100%;
		object-fit: contain;
		transform-origin: center center;
		will-change: transform;
		pointer-events: none;
	}
	
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>