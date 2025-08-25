<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import BeforeAfterSlider from '$lib/components/ui/before-after-slider/before-after-slider.svelte';
	import emblaCarouselSvelte from 'embla-carousel-svelte';
	import Autoplay from 'embla-carousel-autoplay';
	import type { EmblaCarouselType } from 'embla-carousel';
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
			bgGradient: 'from-zinc-100 to-neutral-100'
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
		},
		{
			id: 'oil-painting',
			name: 'Oil Painting',
			technicalName: 'Brush Stroke Simulation',
			description: 'Coming soon: Rich oil painting effects with realistic brush strokes and color blending.',
			icon: Palette,
			bestFor: 'Fine Art',
			features: ['Brush textures', 'Color blending', 'Canvas effects'],
			beforeImage: '/gallery-stock-before.png',
			afterImage: '/gallery-stock-after.svg',
			color: 'text-red-600',
			bgGradient: 'from-red-50 to-orange-50'
		},
		{
			id: 'comic-book',
			name: 'Comic Book',
			technicalName: 'Cel Shading',
			description: 'Coming soon: Bold comic book style with flat colors and strong outlines for graphic novel aesthetics.',
			icon: Image,
			bestFor: 'Graphic Design',
			features: ['Bold outlines', 'Flat colors', 'Pop art style'],
			beforeImage: '/gallery-stock-before.png',
			afterImage: '/gallery-stock-after.svg',
			color: 'text-indigo-600',
			bgGradient: 'from-indigo-50 to-purple-50'
		},
		{
			id: 'charcoal',
			name: 'Charcoal Draw',
			technicalName: 'Texture Mapping',
			description: 'Coming soon: Realistic charcoal drawing effects with natural texture and smudging techniques.',
			icon: PenTool,
			bestFor: 'Portrait Art',
			features: ['Natural texture', 'Smudge effects', 'Paper grain'],
			beforeImage: '/gallery-stock-before.png',
			afterImage: '/gallery-stock-after.svg',
			color: 'text-stone-600',
			bgGradient: 'from-yellow-100 to-orange-100'
		},
		{
			id: 'glass-effect',
			name: 'Glass Effect',
			technicalName: 'Refraction Simulation',
			description: 'Coming soon: Stunning glass and crystal effects with realistic light refraction and transparency.',
			icon: Sparkles,
			bestFor: 'Modern Design',
			features: ['Light refraction', 'Transparency', 'Reflections'],
			beforeImage: '/gallery-stock-before.png',
			afterImage: '/gallery-stock-after.svg',
			color: 'text-teal-600',
			bgGradient: 'from-teal-50 to-cyan-50'
		}
	];

	let selectedAlgorithm = $state(algorithms[0]);
	let emblaApi: EmblaCarouselType;
	let autoplayPlugin = Autoplay({ delay: 3000, stopOnInteraction: true });

	// Embla carousel options
	const options = {
		loop: true,
		align: 'center' as const,
		skipSnaps: false,
		dragFree: false,
		slidesToScroll: 1
	};

	// Use reversed algorithms for left-to-right progression
	const reversedAlgorithms = [...algorithms].reverse();

	function onEmblaInit(event: CustomEvent<EmblaCarouselType>) {
		emblaApi = event.detail;
		
		// Listen for slide changes to update selected algorithm
		emblaApi.on('select', () => {
			const selectedIndex = emblaApi.selectedScrollSnap();
			selectedAlgorithm = reversedAlgorithms[selectedIndex];
		});
		
		// Set initial selected algorithm
		const initialIndex = emblaApi.selectedScrollSnap();
		selectedAlgorithm = reversedAlgorithms[initialIndex];
	}

	function handleTabClick(algorithm: Algorithm) {
		if (!emblaApi) return;
		
		// Find the algorithm index and scroll to it
		const algorithmIndex = reversedAlgorithms.findIndex(alg => alg.id === algorithm.id);
		if (algorithmIndex !== -1) {
			emblaApi.scrollTo(algorithmIndex);
			selectedAlgorithm = algorithm;
		}
	}

	function handleSceneClick() {
		// Scene click just stops autoplay - the carousel stays centered on current selection
		if (autoplayPlugin) {
			autoplayPlugin.stop();
		}
	}

	onDestroy(() => {
		if (emblaApi) {
			emblaApi.destroy();
		}
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
		class="embla overflow-hidden"
		use:emblaCarouselSvelte={{ options, plugins: [autoplayPlugin] }}
		onemblaInit={onEmblaInit}
	>
		<div class="embla__container flex gap-4 pl-4 pb-4 pt-2">
			{#each reversedAlgorithms as algorithm (algorithm.id)}
				<div class="embla__slide flex-shrink-0" style="flex: 0 0 auto;">
					<button
						class="algorithm-tab group relative flex items-center gap-2 rounded-xl border-2 px-4 py-3 transition-all duration-300 sm:px-6 sm:py-4 w-44 sm:w-52 {
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
						<div class="text-left flex-1">
							<div class="text-sm font-semibold sm:text-base whitespace-nowrap {
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
				</div>
			{/each}
		</div>
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
			<div class="p-8 lg:p-12 flex flex-col bg-slate-50">
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
						class="group inline-flex items-center justify-center gap-2 rounded-xl bg-ferrari-600 px-4 py-2.5 text-white font-semibold shadow-lg transition-all duration-300 hover:bg-ferrari-700 hover:shadow-xl hover:-translate-y-0.5 w-56"
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

	/* Embla Carousel styles */
	.embla {
		cursor: grab;
	}
	
	.embla:active {
		cursor: grabbing;
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