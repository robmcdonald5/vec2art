<script lang="ts">
	import { ImageViewer } from 'svelte-image-viewer';
	import { onMount, onDestroy } from 'svelte';

	interface Props {
		src: string;
		alt?: string;
		targetScale?: number;
		targetOffsetX?: number;
		targetOffsetY?: number;
		minScale?: number;
		maxScale?: number;
	}

	let {
		src,
		alt = '',
		targetScale = $bindable(1),
		targetOffsetX = $bindable(0),
		targetOffsetY = $bindable(0),
		minScale = 0.1,
		maxScale = 5.0
	}: Props = $props();

	let containerEl: HTMLDivElement;
	let imageViewerEl: HTMLElement;

	// Override ImageViewer's wheel handler to only work with Ctrl
	function handleWheel(e: WheelEvent) {
		// Only prevent default (stop page scroll) if Ctrl is pressed for zooming
		if (e.ctrlKey || e.metaKey) {
			// This will be handled by ImageViewer for zooming
			return;
		}
		// For regular scroll, we need to prevent ImageViewer from calling preventDefault
		// We'll temporarily remove the listener and re-add it
		e.stopImmediatePropagation();
	}

	onMount(() => {
		if (containerEl) {
			// Find the ImageViewer element
			imageViewerEl = containerEl.querySelector('[style*="touch-action: none"]') as HTMLElement;
			if (imageViewerEl) {
				// Add our handler with highest priority
				imageViewerEl.addEventListener('wheel', handleWheel, { capture: true });
			}
		}
	});

	onDestroy(() => {
		if (imageViewerEl) {
			imageViewerEl.removeEventListener('wheel', handleWheel, { capture: true });
		}
	});
</script>

<div bind:this={containerEl} class="h-full w-full">
	<ImageViewer
		{src}
		{alt}
		bind:targetScale
		bind:targetOffsetX
		bind:targetOffsetY
		{minScale}
		{maxScale}
	/>
</div>
