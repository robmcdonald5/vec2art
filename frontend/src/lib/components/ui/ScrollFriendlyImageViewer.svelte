<script lang="ts">
	import { onMount } from 'svelte';
	import { panZoomStore } from '$lib/stores/pan-zoom-sync.svelte';

	interface Props {
		src: string;
		alt?: string;
		panel: 'original' | 'converted';
		minScale?: number;
		maxScale?: number;
		scaleSmoothing?: number;
	}

	let {
		src,
		alt = '',
		panel,
		minScale = 0.1,
		maxScale = 5.0,
		scaleSmoothing = 1200
	}: Props = $props();

	let containerEl: HTMLDivElement = $state()!;
	let imgEl: HTMLButtonElement = $state()!;
	let isDragging = $state(false);
	let startX = 0;
	let startY = 0;
	let hasDragged = $state(false);

	// Track if this specific component initiated the drag
	let isThisPanelDragging = $state(false);

	// Get current state from store for this panel
	const currentState = $derived(
		panel === 'original' ? panZoomStore.originalState : panZoomStore.convertedState
	);

	// Apply transforms using store state
	$effect(() => {
		if (imgEl && currentState) {
			const transformString = `translate(${currentState.x}px, ${currentState.y}px) scale(${currentState.scale})`;
			console.log(`🎨 [ScrollFriendlyImageViewer] ${panel} applying transform:`, transformString);
			imgEl.style.transform = transformString;
		}
	});

	// Handle mouse drag for panning - calls store methods
	function handleMouseDown(e: MouseEvent) {
		console.log(`🚨 [ScrollFriendlyImageViewer] ${panel} MOUSEDOWN - currentState:`, currentState);
		console.log(
			`🚨 [ScrollFriendlyImageViewer] ${panel} MOUSEDOWN - clientX: ${e.clientX}, clientY: ${e.clientY}`
		);

		isDragging = true;
		isThisPanelDragging = true; // Mark this panel as the active dragger
		hasDragged = false;
		startX = e.clientX - currentState.x;
		startY = e.clientY - currentState.y;
		e.preventDefault();

		console.log(
			`🚨 [ScrollFriendlyImageViewer] ${panel} DRAG STARTED - startX: ${startX}, startY: ${startY}`
		);
	}

	function handleMouseMove(e: MouseEvent) {
		console.log(
			`🔍 [ScrollFriendlyImageViewer] ${panel} mousemove - isDragging: ${isDragging}, isThisPanelDragging: ${isThisPanelDragging}`
		);

		// Only handle mouse move if this panel initiated the drag
		if (!isDragging || !isThisPanelDragging) {
			console.log(
				`🔍 [ScrollFriendlyImageViewer] ${panel} mousemove SKIPPED - not dragging or not this panel`
			);
			return;
		}

		// Mark that we've actually dragged (not just clicked)
		hasDragged = true;

		const newState = {
			scale: currentState.scale,
			x: e.clientX - startX,
			y: e.clientY - startY
		};

		console.log(`🔧 [ScrollFriendlyImageViewer] ${panel} pan update:`, newState);

		// Update store based on panel
		if (panel === 'original') {
			panZoomStore.updateOriginalState(newState);
		} else {
			panZoomStore.updateConvertedState(newState);
		}
	}

	function handleMouseUp() {
		console.log(
			`🔧 [ScrollFriendlyImageViewer] ${panel} ended drag (was active: ${isThisPanelDragging})`
		);
		isDragging = false;
		isThisPanelDragging = false; // Reset active dragger
	}

	// Prevent button click if dragging occurred
	function handleClick(e: MouseEvent) {
		if (hasDragged) {
			e.preventDefault();
			e.stopPropagation();
		}
		// Reset hasDragged flag after a short delay to allow for legitimate clicks
		setTimeout(() => {
			hasDragged = false;
		}, 10);
	}

	// Handle wheel for zoom - calls store methods
	function handleWheel(e: WheelEvent) {
		// Always handle scroll when over the image viewer for better UX
		// Users expect scroll zoom to work in image viewers
		e.preventDefault(); // Prevent page scrolling when zooming image

		const delta = -e.deltaY;
		const scaleChange = 1 + delta / scaleSmoothing;
		const newScale = Math.max(minScale, Math.min(maxScale, currentState.scale * scaleChange));

		// Zoom towards mouse position
		const rect = containerEl.getBoundingClientRect();
		const x = e.clientX - rect.left - rect.width / 2;
		const y = e.clientY - rect.top - rect.height / 2;

		const scaleRatio = newScale / currentState.scale;
		const newX = x - scaleRatio * (x - currentState.x);
		const newY = y - scaleRatio * (y - currentState.y);

		const newState = {
			scale: newScale,
			x: newX,
			y: newY
		};

		// Update store based on panel
		if (panel === 'original') {
			panZoomStore.updateOriginalState(newState);
		} else {
			panZoomStore.updateConvertedState(newState);
		}
	}

	// Create unique instance ID for debugging
	const instanceId = Math.random().toString(36).substring(2, 8);

	onMount(() => {
		console.log(`🔧 [ScrollFriendlyImageViewer] Instance ${instanceId} loaded for panel: ${panel}`);

		// We'll use global listeners but with better isolation
		const handleGlobalMouseMove = (e: MouseEvent) => {
			console.log(
				`🌐 [ScrollFriendlyImageViewer] Instance ${instanceId} (${panel}) global mousemove - isThisPanelDragging: ${isThisPanelDragging}`
			);
			if (isThisPanelDragging) {
				handleMouseMove(e);
			}
		};

		const handleGlobalMouseUp = (_e: MouseEvent) => {
			console.log(
				`🌐 [ScrollFriendlyImageViewer] Instance ${instanceId} (${panel}) global mouseup - isThisPanelDragging: ${isThisPanelDragging}`
			);
			if (isThisPanelDragging) {
				handleMouseUp();
			}
		};

		document.addEventListener('mousemove', handleGlobalMouseMove);
		document.addEventListener('mouseup', handleGlobalMouseUp);

		return () => {
			document.removeEventListener('mousemove', handleGlobalMouseMove);
			document.removeEventListener('mouseup', handleGlobalMouseUp);
		};
	});
</script>

<div bind:this={containerEl} class="relative h-full w-full overflow-hidden" onwheel={handleWheel}>
	<!-- Interactive button wrapper for keyboard accessibility -->
	<button
		bind:this={imgEl}
		class="absolute inset-0 m-auto max-h-full max-w-full origin-center border-0 bg-transparent p-0 transition-transform duration-0"
		style="cursor: {isDragging ? 'grabbing' : 'grab'};"
		onmousedown={handleMouseDown}
		onkeydown={(e) => {
			// Allow keyboard interaction - Enter/Space to reset position
			// But don't reset if currently dragging
			if ((e.key === 'Enter' || e.key === ' ') && !isDragging) {
				e.preventDefault();
				// Reset to center position using store methods
				const resetState = { scale: 1, x: 0, y: 0 };
				if (panel === 'original') {
					panZoomStore.updateOriginalState(resetState);
				} else {
					panZoomStore.updateConvertedState(resetState);
				}
			}
		}}
		onclick={handleClick}
		aria-label="{alt
			? alt + ' - '
			: ''}Pannable and zoomable image. Use mouse to drag and scroll to zoom, or press Enter to reset."
		type="button"
	>
		<img {src} {alt} class="h-full max-h-full w-full max-w-full object-contain" draggable="false" />
	</button>
</div>

<style>
	img {
		user-select: none;
		-webkit-user-drag: none;
	}
</style>
