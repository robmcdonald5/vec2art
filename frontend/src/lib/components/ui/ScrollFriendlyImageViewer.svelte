<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		src: string;
		alt?: string;
		targetScale?: number;
		targetOffsetX?: number;
		targetOffsetY?: number;
		minScale?: number;
		maxScale?: number;
		scaleSmoothing?: number;
	}

	let {
		src,
		alt = '',
		targetScale = $bindable(1),
		targetOffsetX = $bindable(0),
		targetOffsetY = $bindable(0),
		minScale = 0.1,
		maxScale = 5.0,
		scaleSmoothing = 1200
	}: Props = $props();

	let containerEl: HTMLDivElement = $state()!;
	let imgEl: HTMLButtonElement = $state()!;
	let isDragging = $state(false);
	let startX = 0;
	let startY = 0;

	// Apply transforms
	$effect(() => {
		if (imgEl) {
			imgEl.style.transform = `translate(${targetOffsetX}px, ${targetOffsetY}px) scale(${targetScale})`;
		}
	});

	// Handle mouse drag for panning
	function handleMouseDown(e: MouseEvent) {
		isDragging = true;
		startX = e.clientX - targetOffsetX;
		startY = e.clientY - targetOffsetY;
		e.preventDefault();
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging) return;
		targetOffsetX = e.clientX - startX;
		targetOffsetY = e.clientY - startY;
	}

	function handleMouseUp() {
		isDragging = false;
	}

	// Handle wheel for zoom - allow both Ctrl+scroll and regular scroll over image
	function handleWheel(e: WheelEvent) {
		// Always handle scroll when over the image viewer for better UX
		// Users expect scroll zoom to work in image viewers
		e.preventDefault(); // Prevent page scrolling when zooming image

		const delta = -e.deltaY;
		const scaleChange = 1 + delta / scaleSmoothing;
		const newScale = Math.max(minScale, Math.min(maxScale, targetScale * scaleChange));

		// Zoom towards mouse position
		const rect = containerEl.getBoundingClientRect();
		const x = e.clientX - rect.left - rect.width / 2;
		const y = e.clientY - rect.top - rect.height / 2;

		const scaleRatio = newScale / targetScale;
		targetOffsetX = x - scaleRatio * (x - targetOffsetX);
		targetOffsetY = y - scaleRatio * (y - targetOffsetY);
		targetScale = newScale;
	}

	onMount(() => {
		// Add global mouse listeners for drag
		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);

		return () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
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
			// Allow keyboard interaction - Enter/Space to start drag mode or reset position
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				// Reset to center position
				targetOffsetX = 0;
				targetOffsetY = 0;
				targetScale = 1;
			}
		}}
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
