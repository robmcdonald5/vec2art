<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		beforeImage: string;
		afterImage: string;
		beforeAlt?: string;
		afterAlt?: string;
		startPosition?: number;
		class?: string;
		loading?: 'lazy' | 'eager';
		beforePlaceholder?: string;
		afterPlaceholder?: string;
	}

	let {
		beforeImage,
		afterImage,
		beforeAlt = 'Before',
		afterAlt = 'After',
		startPosition = 50,
		class: className = '',
		loading = 'lazy',
		beforePlaceholder = '',
		afterPlaceholder = ''
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

		// Only preventDefault on mouse events, not touch events (passive listeners)
		const isTouchEvent = 'touches' in e;
		if (!isTouchEvent) {
			e.preventDefault();
		}

		const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
		const position = ((clientX - containerRect.left) / containerRect.width) * 100;
		sliderPosition = Math.max(0, Math.min(100, position));
	}

	function handleEnd() {
		isDragging = false;
	}

	onMount(() => {
		document.addEventListener('mousemove', handleMove as any);
		document.addEventListener('mouseup', handleEnd);
		document.addEventListener('touchmove', handleMove as any, { passive: true });
		document.addEventListener('touchend', handleEnd);

		return () => {
			document.removeEventListener('mousemove', handleMove as any);
			document.removeEventListener('mouseup', handleEnd);
			document.removeEventListener('touchmove', handleMove as any);
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
	<div class="relative h-full w-full">
		{#if afterPlaceholder}
			<img
				src={afterPlaceholder}
				alt=""
				aria-hidden="true"
				class="absolute inset-0 h-full w-full object-contain blur-xl"
				draggable="false"
			/>
		{/if}
		<img
			src={afterImage}
			alt={afterAlt}
			{loading}
			width="800"
			height="800"
			class="relative h-full w-full object-contain"
			draggable="false"
			decoding="async"
		/>
	</div>

	<!-- Before Image (Top Layer with Clip) -->
	<div
		class="absolute inset-0"
		style="clip-path: polygon(0 0, {sliderPosition}% 0, {sliderPosition}% 100%, 0 100%)"
	>
		{#if beforePlaceholder}
			<img
				src={beforePlaceholder}
				alt=""
				aria-hidden="true"
				class="absolute inset-0 h-full w-full object-contain blur-xl"
				draggable="false"
			/>
		{/if}
		<img
			src={beforeImage}
			alt={beforeAlt}
			{loading}
			width="800"
			height="800"
			class="relative h-full w-full object-contain"
			draggable="false"
			decoding="async"
		/>
	</div>

	<!-- Before Label (Left Side) - Clipped with before image area -->
	<div
		class="pointer-events-none absolute inset-0 z-10"
		style="clip-path: polygon(0 0, {sliderPosition}% 0, {sliderPosition}% 100%, 0 100%)"
	>
		<div class="absolute top-1/2 left-4 -translate-y-1/2">
			<div
				class="rounded-lg bg-black/50 px-3 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-sm"
			>
				Before
			</div>
		</div>
	</div>

	<!-- After Label (Right Side) - Clipped with after image area -->
	<div
		class="pointer-events-none absolute inset-0 z-10"
		style="clip-path: polygon({sliderPosition}% 0, 100% 0, 100% 100%, {sliderPosition}% 100%)"
	>
		<div class="absolute top-1/2 right-4 -translate-y-1/2">
			<div
				class="rounded-lg bg-black/50 px-3 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-sm"
			>
				After
			</div>
		</div>
	</div>

	<!-- Slider Handle with Mobile-Optimized Touch Area -->
	<div
		class="absolute top-0 bottom-0 z-20 w-1 cursor-ew-resize border-r border-l border-gray-400 bg-white shadow-lg"
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
		<!-- Invisible Touch Area for Better Mobile Interaction -->
		<div
			class="absolute top-0 -left-6 h-full w-12 md:-left-3 md:w-6"
			role="button"
			tabindex="-1"
			aria-label="Drag area for comparison slider"
			onmousedown={handleStart}
			ontouchstart={handleStart}
		></div>

		<!-- Handle Rectangle and Arrows (Enhanced for Touch) -->
		<div
			class="absolute top-1/2 left-1/2 flex h-16 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 md:h-12 md:w-3"
		>
			<!-- Left Arrow -->
			<svg
				class="absolute -left-4 h-4 w-4 text-white md:-left-3 md:h-3 md:w-3"
				fill="currentColor"
				viewBox="0 0 12 12"
			>
				<path d="M8 2L4 6l4 4V2z" stroke="#374151" stroke-width="0.5" />
			</svg>
			<!-- Right Arrow -->
			<svg
				class="absolute -right-4 h-4 w-4 text-white md:-right-3 md:h-3 md:w-3"
				fill="currentColor"
				viewBox="0 0 12 12"
			>
				<path d="M4 2l4 4-4 4V2z" stroke="#374151" stroke-width="0.5" />
			</svg>
		</div>

		<!-- Mobile Touch Indicator (Shows on Touch Devices) -->
		<div
			class="bg-ferrari-500/20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 transition-opacity duration-200 md:hidden {isDragging
				? 'opacity-100'
				: ''}"
			style="width: 48px; height: 48px; transform: translate(-50%, -50%)"
		></div>
	</div>
</div>
