<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import BeforeAfterSlider from '$lib/components/ui/before-after-slider/before-after-slider.svelte';
	import { 
		BarChart3, 
		Palette, 
		PenTool, 
		Grid3x3,
		ArrowRight,
		Check,
		Sparkles,
		Zap,
		Image,
		Layers
	} from 'lucide-svelte';

	interface Algorithm {
		id: string;
		name: string;
		technicalName: string;
		description: string;
		icon: any;
		bestFor: string;
		features: string[];
		beforeImage: string;
		afterImage: string;
		color: string;
		bgGradient: string;
	}

	const algorithms: Algorithm[] = [
		{
			id: 'centerline',
			name: 'Bold Graphics',
			technicalName: 'Centerline Tracing',
			description: 'Perfect for logos and bold shapes with the Zhang-Suen algorithm creating precise, clean paths.',
			icon: BarChart3,
			bestFor: 'Logos & Icons',
			features: ['Clean lines', 'Precise paths', 'Minimal complexity'],
			beforeImage: '/gallery-stock-before.png',
			afterImage: '/gallery-stock-after.svg',
			color: 'text-blue-600',
			bgGradient: 'from-blue-50 to-indigo-50'
		},
		{
			id: 'dots',
			name: 'Vintage Dots',
			technicalName: 'Dot Mapping',
			description: 'Create artistic stippling effects with adaptive dot patterns for unique textures and vintage aesthetics.',
			icon: Palette,
			bestFor: 'Artistic Effects',
			features: ['Stippling style', 'Texture emphasis', 'Vintage look'],
			beforeImage: '/gallery-stock-before.png',
			afterImage: '/gallery-stock-after.svg',
			color: 'text-purple-600',
			bgGradient: 'from-purple-50 to-pink-50'
		},
		{
			id: 'line',
			name: 'Sketch Art',
			technicalName: 'Line Tracing',
			description: 'Detailed line art using Canny edge detection, ideal for converting photos to sketch-like drawings.',
			icon: PenTool,
			bestFor: 'Detailed Art',
			features: ['Hand-drawn feel', 'Fine details', 'Natural strokes'],
			beforeImage: '/gallery-stock-before.png',
			afterImage: '/gallery-stock-after.svg',
			color: 'text-emerald-600',
			bgGradient: 'from-emerald-50 to-teal-50'
		},
		{
			id: 'superpixel',
			name: 'Modern Abstract',
			technicalName: 'Superpixel',
			description: 'SLIC segmentation creates stylized, abstract interpretations perfect for modern design.',
			icon: Grid3x3,
			bestFor: 'Abstract Art',
			features: ['Geometric shapes', 'Color regions', 'Modern style'],
			beforeImage: '/gallery-stock-before.png',
			afterImage: '/gallery-stock-after.svg',
			color: 'text-orange-600',
			bgGradient: 'from-orange-50 to-amber-50'
		},
		// Placeholder algorithms for carousel demo
		{
			id: 'watercolor',
			name: 'Watercolor Style',
			technicalName: 'Fluid Simulation',
			description: 'Coming soon: Advanced fluid dynamics to create beautiful watercolor painting effects.',
			icon: Layers,
			bestFor: 'Artistic Paintings',
			features: ['Fluid dynamics', 'Color bleeding', 'Organic textures'],
			beforeImage: '/gallery-stock-before.png',
			afterImage: '/gallery-stock-after.svg',
			color: 'text-cyan-600',
			bgGradient: 'from-cyan-50 to-blue-50'
		},
		{
			id: 'pencil',
			name: 'Pencil Sketch',
			technicalName: 'Gradient Analysis',
			description: 'Coming soon: Realistic pencil sketching with pressure sensitivity and shading gradients.',
			icon: PenTool,
			bestFor: 'Realistic Sketches',
			features: ['Pressure variation', 'Cross-hatching', 'Shading gradients'],
			beforeImage: '/gallery-stock-before.png',
			afterImage: '/gallery-stock-after.svg',
			color: 'text-gray-600',
			bgGradient: 'from-gray-50 to-slate-50'
		},
		{
			id: 'neon',
			name: 'Neon Glow',
			technicalName: 'Luminance Mapping',
			description: 'Coming soon: Electric neon sign effects with customizable glow intensity and colors.',
			icon: Zap,
			bestFor: 'Digital Art',
			features: ['Glow effects', 'Electric colors', 'Night aesthetics'],
			beforeImage: '/gallery-stock-before.png',
			afterImage: '/gallery-stock-after.svg',
			color: 'text-pink-600',
			bgGradient: 'from-pink-50 to-rose-50'
		},
		{
			id: 'mosaic',
			name: 'Mosaic Tiles',
			technicalName: 'Tessellation',
			description: 'Coming soon: Beautiful mosaic tile patterns with customizable tile size and grout effects.',
			icon: Grid3x3,
			bestFor: 'Decorative Art',
			features: ['Tile patterns', 'Grout effects', 'Color clustering'],
			beforeImage: '/gallery-stock-before.png',
			afterImage: '/gallery-stock-after.svg',
			color: 'text-amber-600',
			bgGradient: 'from-amber-50 to-yellow-50'
		}
	];

	let selectedAlgorithm = $state(algorithms[0]);
	let carouselContainer: HTMLDivElement;
	let carouselScrollInterval: NodeJS.Timeout | undefined;
	let isAutoScrolling = $state(true);
	let isAutoSelecting = $state(true);
	let scrollPosition = $state(0);
	
	// Create infinite loop by duplicating algorithms in reverse order for left-to-right progression
	const reversedAlgorithms = [...algorithms].reverse();
	const infiniteAlgorithms = [...reversedAlgorithms, ...reversedAlgorithms, ...reversedAlgorithms];
	const SCROLL_SPEED = 0.5; // pixels per frame
	const TAB_WIDTH = 288; // approximate width of each tab (w-60 sm:w-72 + gap)

	function startCarouselScroll() {
		if (!carouselContainer) return;
		
		// Start from the end to scroll left-to-right
		const maxScroll = algorithms.length * TAB_WIDTH;
		scrollPosition = maxScroll * 2; // Start from second copy
		carouselContainer.scrollLeft = scrollPosition;
		
		carouselScrollInterval = setInterval(() => {
			if (!carouselContainer) return;
			
			scrollPosition -= SCROLL_SPEED;
			carouselContainer.scrollLeft = scrollPosition;
			
			// Reset scroll position when we've scrolled one full set of algorithms backwards
			if (scrollPosition <= maxScroll) {
				scrollPosition = maxScroll * 2;
				carouselContainer.scrollLeft = scrollPosition;
			}
			
			// Only update selected algorithm if auto-selection is still enabled
			if (isAutoSelecting) {
				updateSelectedFromCenter();
			}
		}, 16); // ~60fps
	}

	function stopCarouselScroll() {
		if (carouselScrollInterval) {
			clearInterval(carouselScrollInterval);
			carouselScrollInterval = undefined;
		}
		isAutoScrolling = false;
	}

	function updateSelectedFromCenter() {
		if (!carouselContainer) return;
		
		const containerCenter = carouselContainer.offsetWidth / 2;
		const scrollCenter = carouselContainer.scrollLeft + containerCenter;
		
		// Account for the fact we start from the second copy and scroll backwards
		const maxScroll = algorithms.length * TAB_WIDTH;
		const adjustedScrollCenter = scrollCenter - maxScroll; // Adjust to the first copy's coordinate system
		let centerTabIndex = Math.floor(adjustedScrollCenter / TAB_WIDTH);
		
		// Ensure we wrap around correctly for negative indices and stay within bounds
		centerTabIndex = ((centerTabIndex % algorithms.length) + algorithms.length) % algorithms.length;
		
		// Since we reversed the array, we need to get from the reversed array
		selectedAlgorithm = reversedAlgorithms[centerTabIndex];
	}

	function handleTabClick(algorithm: Algorithm) {
		// Stop auto-selection but keep carousel moving
		isAutoSelecting = false;
		selectedAlgorithm = algorithm;
	}

	function handleSceneClick() {
		// Stop auto-selection but keep carousel moving
		isAutoSelecting = false;
	}

	onMount(() => {
		if (typeof document !== 'undefined') {
			startCarouselScroll();
		}
	});

	onDestroy(() => {
		stopCarouselScroll();
	});
</script>

<!-- Header -->
<div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 mb-12">
	<div class="animate-on-scroll text-center">
		<h2 class="heading-section">
			Choose Your <span class="text-gradient-modern">Conversion Style</span>
		</h2>
		<p class="text-premium mx-auto mt-6 max-w-3xl">
			Select the perfect algorithm for your image type and artistic vision
		</p>
	</div>
</div>

<!-- Full-Width Infinite Carousel -->
<div class="mb-12 w-full">
	<div
		bind:this={carouselContainer}
		class="carousel-container flex gap-4 overflow-x-scroll scrollbar-hide pl-4 pb-4 pt-2"
		style="scroll-behavior: auto;"
	>
			{#each infiniteAlgorithms as algorithm, index (algorithm.id + '-' + index)}
				<button
					class="algorithm-tab group relative flex-shrink-0 flex items-center gap-2 rounded-xl border-2 px-4 py-3 transition-all duration-300 sm:px-6 sm:py-4 w-60 sm:w-72 {
						selectedAlgorithm.id === algorithm.id
							? 'border-ferrari-500 bg-ferrari-50 shadow-lg scale-105'
							: 'border-gray-200 bg-white hover:border-ferrari-500 hover:bg-ferrari-25 hover:scale-102 hover:shadow-md'
					}"
					onclick={() => handleTabClick(algorithm)}
					aria-pressed={selectedAlgorithm.id === algorithm.id}
					aria-label={`Select ${algorithm.name} algorithm`}
				>
					<svelte:component 
						this={algorithm.icon} 
						class="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 {
							selectedAlgorithm.id === algorithm.id
								? algorithm.color
								: 'text-gray-400 group-hover:text-ferrari-500'
						} transition-colors duration-300"
					/>
					<div class="text-left min-w-0 flex-1">
						<div class="text-sm font-semibold sm:text-base truncate {
							selectedAlgorithm.id === algorithm.id
								? 'text-ferrari-700'
								: 'text-gray-700 group-hover:text-ferrari-600'
						}">
							{algorithm.name}
						</div>
					</div>
					{#if selectedAlgorithm.id === algorithm.id}
						<div class="absolute -bottom-2 left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-ferrari-500 animate-pulse"></div>
					{/if}
				</button>
			{/each}
	</div>
</div>

<!-- Interactive Preview Area -->
<div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
	<div class="algorithm-showcase-container rounded-3xl border border-gray-200 bg-white overflow-hidden shadow-elegant" onclick={handleSceneClick}>
		<div class="grid lg:grid-cols-2 gap-0">
			<!-- Preview Panel -->
			<div class="relative bg-gradient-to-br {selectedAlgorithm.bgGradient} p-8 lg:p-12">
				<!-- Before/After Comparison -->
				<div class="relative aspect-square overflow-hidden rounded-2xl bg-white shadow-frame-elegant ring-1 ring-black/5">
					<BeforeAfterSlider
						beforeImage={selectedAlgorithm.beforeImage}
						afterImage={selectedAlgorithm.afterImage}
						class="h-full w-full"
					/>
				</div>
			</div>

			<!-- Details Panel -->
			<div class="p-8 lg:p-12 flex flex-col">
				<div class="mb-6">
					<h3 class="text-3xl font-bold text-gray-900 mb-2">
						{selectedAlgorithm.name}
					</h3>
					<p class="text-sm text-gray-500 font-medium">
						{selectedAlgorithm.technicalName}
					</p>
				</div>

				<p class="text-lg text-gray-600 mb-8 leading-relaxed">
					{selectedAlgorithm.description}
				</p>

				<!-- Features -->
				<div class="mb-8">
					<h4 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
						Key Features
					</h4>
					<div class="space-y-3">
						{#each selectedAlgorithm.features as feature}
							<div class="flex items-center gap-3">
								<div class="flex-shrink-0 h-8 w-8 rounded-full {selectedAlgorithm.bgGradient} flex items-center justify-center">
									<Check class="h-4 w-4 {selectedAlgorithm.color}" />
								</div>
								<span class="text-gray-700">{feature}</span>
							</div>
						{/each}
					</div>
				</div>

				<!-- Best For Text -->
				<div class="mb-8">
					<div class="flex items-center gap-3">
						<div class="flex-shrink-0 h-8 w-8 flex items-center justify-center">
							<Zap class="h-4 w-4 text-ferrari-600" />
						</div>
						<span class="font-semibold text-ferrari-600">Best for {selectedAlgorithm.bestFor}</span>
					</div>
				</div>

				<!-- CTA -->
				<div class="mt-auto">
					<a 
						href="/converter?algorithm={selectedAlgorithm.id}"
						class="group inline-flex items-center gap-2 rounded-xl bg-ferrari-600 px-6 py-3 text-white font-semibold shadow-lg transition-all duration-300 hover:bg-ferrari-700 hover:shadow-xl hover:-translate-y-0.5"
					>
						Try {selectedAlgorithm.name}
						<ArrowRight class="h-5 w-5 transition-transform group-hover:translate-x-1" />
					</a>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.algorithm-tab {
		/* Ensure consistent border rendering */
		box-sizing: border-box;
		background-clip: padding-box;
	}

	.carousel-container {
		scroll-behavior: auto;
		-webkit-overflow-scrolling: touch;
	}

	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}

	.algorithm-showcase-container {
		animation: subtle-glow 4s ease-in-out infinite;
	}

	/* Modern shadow system for elegant visual separation */
	:global(.shadow-elegant) {
		box-shadow: 
			0 20px 25px -5px rgba(0, 0, 0, 0.1),
			0 10px 10px -5px rgba(0, 0, 0, 0.04),
			0 0 0 1px rgba(0, 0, 0, 0.05);
	}

	:global(.shadow-frame-elegant) {
		box-shadow: 
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06),
			0 0 0 1px rgba(0, 0, 0, 0.05);
	}

	@keyframes subtle-glow {
		0%, 100% {
			box-shadow: 
				0 20px 25px -5px rgba(0, 0, 0, 0.1),
				0 10px 10px -5px rgba(0, 0, 0, 0.04);
		}
		50% {
			box-shadow: 
				0 20px 25px -5px rgba(220, 20, 60, 0.1),
				0 10px 10px -5px rgba(220, 20, 60, 0.04),
				0 0 30px rgba(220, 20, 60, 0.05);
		}
	}

</style>