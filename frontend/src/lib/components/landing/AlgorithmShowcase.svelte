<script lang="ts">
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import BeforeAfterSlider from '$lib/components/ui/before-after-slider/before-after-slider.svelte';
	import emblaCarouselSvelte from 'embla-carousel-svelte';
	import Autoplay from 'embla-carousel-autoplay';
	import type { EmblaCarouselType } from 'embla-carousel';
	import { ArrowRight, Check, Zap } from 'lucide-svelte';

	// Import showcase data from gallery
	import {
		showcaseAlgorithms,
		type ShowcaseAlgorithm,
	} from '$lib/data/showcase-gallery';

	// Use the curated showcase algorithms from gallery
	const algorithms = showcaseAlgorithms;

	let selectedAlgorithm = $state(algorithms[0] || null);
	let emblaApi: EmblaCarouselType;
	let autoplayPlugin = Autoplay({ delay: 4000, stopOnInteraction: true });
	let isInitialized = $state(false);

	// Embla carousel options
	const options = {
		loop: true,
		align: 'center' as const,
		skipSnaps: false,
		dragFree: false,
		slidesToScroll: 1
	};

	// FIXED: Use original algorithms array consistently (no reversal)
	// This prevents state synchronization bugs between carousel and selection
	const carouselAlgorithms = algorithms;

	function onEmblaInit(event: CustomEvent<EmblaCarouselType>) {
		emblaApi = event.detail;

		// Listen for slide changes to update selected algorithm
		emblaApi.on('select', () => {
			const selectedIndex = emblaApi.selectedScrollSnap();
			// FIXED: Use bounds checking to prevent array access errors
			if (selectedIndex >= 0 && selectedIndex < carouselAlgorithms.length) {
				selectedAlgorithm = carouselAlgorithms[selectedIndex];
			}
		});

		// Set initial selected algorithm with bounds checking
		const initialIndex = emblaApi.selectedScrollSnap();
		if (initialIndex >= 0 && initialIndex < carouselAlgorithms.length) {
			selectedAlgorithm = carouselAlgorithms[initialIndex];
		}

		isInitialized = true;
	}

	function handleTabClick(algorithm: ShowcaseAlgorithm) {
		if (!emblaApi || !isInitialized) return;

		// FIXED: Find algorithm index in correct array with validation
		const algorithmIndex = carouselAlgorithms.findIndex((alg) => alg.id === algorithm.id);
		if (algorithmIndex !== -1 && algorithmIndex < carouselAlgorithms.length) {
			// Stop autoplay when user manually interacts
			if (autoplayPlugin) {
				autoplayPlugin.stop();
			}
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

	function handleTryEffect() {
		// Validate selected algorithm before navigation
		if (!selectedAlgorithm || !selectedAlgorithm.isAvailable) {
			console.warn('Cannot navigate: invalid or unavailable algorithm', selectedAlgorithm);
			return;
		}

		try {
			// Navigate to converter with algorithm parameters
			const params = new window.URLSearchParams({
				backend: selectedAlgorithm.backend
			});

			if (selectedAlgorithm.preset) {
				params.append('preset', selectedAlgorithm.preset);
			}

			// Store the algorithm selection in sessionStorage for the converter to pick up
			if (typeof window !== 'undefined') {
				sessionStorage.setItem(
					'selectedAlgorithm',
					JSON.stringify({
						backend: selectedAlgorithm.backend,
						preset: selectedAlgorithm.preset,
						name: selectedAlgorithm.name
					})
				);
			}

			goto(`/converter?${params.toString()}`);
		} catch (error) {
			console.error('Failed to navigate to converter:', error);
		}
	}

	// Validate selectedAlgorithm state consistency
	$effect(() => {
		if (selectedAlgorithm && emblaApi && isInitialized) {
			const currentIndex = emblaApi.selectedScrollSnap();
			const expectedAlgorithm = carouselAlgorithms[currentIndex];

			// Only log warnings for debugging, don't auto-correct to avoid infinite loops
			if (expectedAlgorithm && selectedAlgorithm.id !== expectedAlgorithm.id) {
				console.warn('Carousel state inconsistency detected:', {
					currentIndex,
					selectedId: selectedAlgorithm.id,
					expectedId: expectedAlgorithm.id
				});
			}
		}
	});

	onDestroy(() => {
		if (emblaApi) {
			emblaApi.destroy();
		}
	});
</script>

<!-- Header -->
<div class="mx-auto mb-12 max-w-screen-xl px-4 sm:px-6 lg:px-8">
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
		<div class="embla__container flex gap-4 pt-2 pb-4 pl-4">
			{#each carouselAlgorithms as algorithm (algorithm.id)}
				<div class="embla__slide flex-shrink-0" style="flex: 0 0 auto;">
					<button
						class="algorithm-tab group relative flex w-44 items-center gap-2 rounded-xl border-2 px-4 py-3 transition-all duration-300 sm:w-52 sm:px-6 sm:py-4 {selectedAlgorithm.id ===
						algorithm.id
							? 'border-ferrari-500 bg-ferrari-50 scale-105 shadow-lg'
							: 'hover:border-ferrari-500 hover:bg-ferrari-25 border-gray-200 bg-white hover:scale-102 hover:shadow-md'}"
						onclick={() => handleTabClick(algorithm)}
						aria-pressed={selectedAlgorithm.id === algorithm.id}
						aria-label={`Select ${algorithm.name} algorithm`}
					>
						{#if algorithm.icon}
							<algorithm.icon
								class="h-5 w-5 flex-shrink-0 sm:h-6 sm:w-6 {selectedAlgorithm.id === algorithm.id
									? algorithm.color
									: 'group-hover:text-ferrari-500 text-gray-400'} transition-colors duration-300"
							/>
						{/if}
						<div class="flex-1 text-left">
							<div
								class="text-sm font-semibold whitespace-nowrap sm:text-base {selectedAlgorithm.id ===
								algorithm.id
									? 'text-ferrari-700'
									: 'group-hover:text-ferrari-600 text-gray-700'}"
							>
								{algorithm.name}
							</div>
						</div>
						{#if selectedAlgorithm.id === algorithm.id}
							<div
								class="bg-ferrari-500 absolute -bottom-2 left-1/2 h-1 w-12 -translate-x-1/2 animate-pulse rounded-full"
							></div>
						{/if}
					</button>
				</div>
			{/each}
		</div>
	</div>
</div>

<!-- Interactive Preview Area -->
<div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
	<div
		class="algorithm-showcase-container shadow-elegant overflow-hidden rounded-3xl border border-gray-200 bg-white"
		onclick={handleSceneClick}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				handleSceneClick();
			}
		}}
		tabindex="0"
		role="button"
		aria-label="Interactive algorithm preview"
	>
		<div class="grid gap-0 lg:grid-cols-2">
			<!-- Preview Panel -->
			<div class="relative bg-gradient-to-br {selectedAlgorithm.bgGradient} p-8 lg:p-12">
				<!-- Before/After Comparison -->
				<div
					class="shadow-frame-elegant relative aspect-square overflow-hidden rounded-2xl bg-white ring-1 ring-black/5"
				>
					<BeforeAfterSlider
						beforeImage={selectedAlgorithm.beforeImage}
						afterImage={selectedAlgorithm.afterImage}
						loading={isInitialized && selectedAlgorithm === algorithms[0] ? 'eager' : 'lazy'}
						class="h-full w-full"
					/>
				</div>
			</div>

			<!-- Details Panel -->
			<div class="flex flex-col bg-slate-50 p-8 lg:p-12">
				<div class="mb-6">
					<h3 class="mb-2 text-3xl font-bold text-gray-900">
						{selectedAlgorithm.name}
					</h3>
					<p class="text-sm font-medium text-gray-500">
						{selectedAlgorithm.technicalName}
					</p>
				</div>

				<p class="mb-8 text-lg leading-relaxed text-gray-600">
					{selectedAlgorithm.description}
				</p>

				<!-- Features -->
				<div class="mb-8">
					<h4 class="mb-4 text-sm font-semibold tracking-wider text-gray-900 uppercase">
						Key Features
					</h4>
					<div class="space-y-3">
						{#each selectedAlgorithm?.features || [] as feature, index (index)}
							<div class="flex items-center gap-3">
								<div
									class="h-8 w-8 flex-shrink-0 rounded-full {selectedAlgorithm.bgGradient} flex items-center justify-center"
								>
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
						<div class="flex h-8 w-8 flex-shrink-0 items-center justify-center">
							<Zap class="text-ferrari-600 h-4 w-4" />
						</div>
						<span class="text-ferrari-600 font-semibold">Best for {selectedAlgorithm.bestFor}</span>
					</div>
				</div>

				<!-- CTA -->
				<div class="mt-auto">
					<button
						onclick={handleTryEffect}
						disabled={!selectedAlgorithm.isAvailable}
						class="group inline-flex w-56 items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-white shadow-lg transition-all duration-300 {selectedAlgorithm.isAvailable
							? 'bg-ferrari-600 hover:bg-ferrari-700 cursor-pointer hover:-translate-y-0.5 hover:shadow-xl'
							: 'cursor-not-allowed bg-gray-400 opacity-75'}"
					>
						{selectedAlgorithm.isAvailable
							? 'Try This Style'
							: `Coming Soon: ${selectedAlgorithm.name}`}
						<ArrowRight
							class="h-5 w-5 transition-transform {selectedAlgorithm.isAvailable
								? 'group-hover:translate-x-1'
								: ''}"
						/>
					</button>
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
		0%,
		100% {
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
