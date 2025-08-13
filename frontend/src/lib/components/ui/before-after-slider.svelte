<script lang="ts">
	import { onMount } from 'svelte';
	
	interface Props {
		beforeImage: string;
		afterImage: string;
		beforeAlt?: string;
		afterAlt?: string;
		startPosition?: number;
		class?: string;
	}
	
	let {
		beforeImage,
		afterImage,
		beforeAlt = 'Before',
		afterAlt = 'After',
		startPosition = 50,
		class: className = ''
	}: Props = $props();
	
	let container: HTMLDivElement;
	let isDragging = $state(false);
	let sliderPosition = $state(startPosition);
	let containerRect: DOMRect | null = null;
	
	function handleStart(e: MouseEvent | TouchEvent) {
		isDragging = true;
		containerRect = container.getBoundingClientRect();
		handleMove(e);
	}
	
	function handleMove(e: MouseEvent | TouchEvent) {
		if (!isDragging || !containerRect) return;
		
		e.preventDefault();
		const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
		const position = ((clientX - containerRect.left) / containerRect.width) * 100;
		sliderPosition = Math.max(0, Math.min(100, position));
	}
	
	function handleEnd() {
		isDragging = false;
	}
	
	onMount(() => {
		document.addEventListener('mousemove', handleMove as EventListener);
		document.addEventListener('mouseup', handleEnd);
		document.addEventListener('touchmove', handleMove as EventListener);
		document.addEventListener('touchend', handleEnd);
		
		return () => {
			document.removeEventListener('mousemove', handleMove as EventListener);
			document.removeEventListener('mouseup', handleEnd);
			document.removeEventListener('touchmove', handleMove as EventListener);
			document.removeEventListener('touchend', handleEnd);
		};
	});
</script>

<div 
	bind:this={container}
	class="relative overflow-hidden select-none {className}"
	role="application"
	aria-label="Before and after comparison slider"
>
	<!-- After Image (Bottom Layer) -->
	<div class="relative w-full h-full">
		<img 
			src={afterImage} 
			alt={afterAlt}
			class="w-full h-full object-contain"
			draggable="false"
		/>
	</div>
	
	<!-- Before Image (Top Layer with Clip) -->
	<div 
		class="absolute inset-0"
		style="clip-path: polygon(0 0, {sliderPosition}% 0, {sliderPosition}% 100%, 0 100%)"
	>
		<img 
			src={beforeImage} 
			alt={beforeAlt}
			class="w-full h-full object-contain"
			draggable="false"
		/>
	</div>
	
	<!-- Slider Handle -->
	<div 
		class="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg cursor-ew-resize"
		style="left: {sliderPosition}%"
		onmousedown={handleStart}
		ontouchstart={handleStart}
		role="slider"
		aria-valuenow={sliderPosition}
		aria-valuemin={0}
		aria-valuemax={100}
		aria-label="Comparison slider position"
		tabindex="0"
	>
		<!-- Handle Button -->
		<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-gray-300">
			<svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l-3 3m0 0l3 3m-3-3h12m-7-3l3-3m0 0l-3-3" />
			</svg>
		</div>
		
		<!-- Labels -->
		<div class="absolute top-4 -left-12 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
			Before
		</div>
		<div class="absolute top-4 left-4 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
			After
		</div>
	</div>
</div>