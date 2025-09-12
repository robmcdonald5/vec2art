<script lang="ts">
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import BeforeAfterSlider from '$lib/components/ui/before-after-slider/before-after-slider.svelte';
	import emblaCarouselSvelte from 'embla-carousel-svelte';
	import Autoplay from 'embla-carousel-autoplay';
	import type { EmblaCarouselType } from 'embla-carousel';
	import { ArrowRight, Check, Zap } from 'lucide-svelte';

	// Import showcase data from gallery
	import { showcaseAlgorithms, type ShowcaseAlgorithm } from '$lib/data/showcase-gallery';

	// Use the curated showcase algorithms from gallery
	const algorithms = showcaseAlgorithms;

	// Mobile optimization: show limited algorithms initially
	let showAllAlgorithms = $state(false);
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

	// Image preloading state for mobile optimization
	let preloadedImages = $state(new Set<string>());
	let intersectionObserver: IntersectionObserver | undefined;

	// Mobile optimization: limit displayed algorithms
	const MOBILE_LIMIT = 6; // Show 6 algorithms initially on mobile

	// Dynamic algorithm list based on mobile expand state
	let carouselAlgorithms = $derived(() => {
		if (showAllAlgorithms) {
			return algorithms; // Show all algorithms
		} else {
			return algorithms.slice(0, MOBILE_LIMIT); // Show limited set on mobile
		}
	});

	// Function to toggle show more/less
	function toggleShowMore() {
		showAllAlgorithms = !showAllAlgorithms;

		// If collapsing, ensure selected algorithm is within visible range
		if (!showAllAlgorithms && selectedAlgorithm) {
			const visibleAlgorithms = algorithms.slice(0, MOBILE_LIMIT);
			const isSelectedVisible = visibleAlgorithms.some((alg) => alg.id === selectedAlgorithm.id);

			// If current selection is not in visible range, select the first visible one
			if (!isSelectedVisible && emblaApi) {
				selectedAlgorithm = visibleAlgorithms[0];
				emblaApi.scrollTo(0);
			}
		}
	}

	// Smart image preloading for mobile performance
	function preloadAlgorithmImages(algorithm: ShowcaseAlgorithm) {
		if (preloadedImages.has(algorithm.id)) return;

		// Preload both before and after images
		const beforeImg = new Image();
		const afterImg = new Image();

		beforeImg.src = algorithm.beforeImage;
		afterImg.src = algorithm.afterImage;

		// Mark as preloaded once both images start loading
		preloadedImages.add(algorithm.id);
	}

	// Preload adjacent algorithms for smooth carousel navigation
	function preloadAdjacentImages(currentIndex: number) {
		const currentAlgorithms = carouselAlgorithms();
		const totalLength = currentAlgorithms.length;

		// Preload previous and next algorithms (with wrapping)
		const prevIndex = (currentIndex - 1 + totalLength) % totalLength;
		const nextIndex = (currentIndex + 1) % totalLength;

		preloadAlgorithmImages(currentAlgorithms[prevIndex]);
		preloadAlgorithmImages(currentAlgorithms[nextIndex]);
	}

	// Intelligent loading strategy for mobile optimization
	function getImageLoadingStrategy(algorithm: ShowcaseAlgorithm): 'eager' | 'lazy' {
		// Eager load first algorithm when initialized for immediate visibility
		if (isInitialized && algorithm === algorithms[0]) {
			return 'eager';
		}

		// Eager load if images are already preloaded (cached)
		if (preloadedImages.has(algorithm.id)) {
			return 'eager';
		}

		// Otherwise, use lazy loading for performance
		return 'lazy';
	}

	function onEmblaInit(event: CustomEvent<EmblaCarouselType>) {
		emblaApi = event.detail;

		// Listen for slide changes to update selected algorithm
		emblaApi.on('select', () => {
			const selectedIndex = emblaApi.selectedScrollSnap();
			const currentAlgorithms = carouselAlgorithms();
			// FIXED: Use bounds checking to prevent array access errors
			if (selectedIndex >= 0 && selectedIndex < currentAlgorithms.length) {
				selectedAlgorithm = currentAlgorithms[selectedIndex];
				// Preload adjacent images for smooth navigation
				preloadAdjacentImages(selectedIndex);
			}
		});

		// Set initial selected algorithm with bounds checking
		const initialIndex = emblaApi.selectedScrollSnap();
		const currentAlgorithms = carouselAlgorithms();
		if (initialIndex >= 0 && initialIndex < currentAlgorithms.length) {
			selectedAlgorithm = currentAlgorithms[initialIndex];
			// Preload initial adjacent images
			preloadAdjacentImages(initialIndex);
		}

		isInitialized = true;
	}

	function handleTabClick(algorithm: ShowcaseAlgorithm) {
		if (!emblaApi || !isInitialized) return;

		const currentAlgorithms = carouselAlgorithms();
		// FIXED: Find algorithm index in correct array with validation
		const algorithmIndex = currentAlgorithms.findIndex((alg) => alg.id === algorithm.id);
		if (algorithmIndex !== -1 && algorithmIndex < currentAlgorithms.length) {
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
			// Build query parameters manually for Svelte reactivity compatibility
			let queryParams = `backend=${encodeURIComponent(selectedAlgorithm.backend)}`;

			if (selectedAlgorithm.preset) {
				queryParams += `&preset=${encodeURIComponent(selectedAlgorithm.preset)}`;
			}

			// Store the algorithm selection in sessionStorage for the converter to pick up
			if (browser) {
				sessionStorage.setItem(
					'selectedAlgorithm',
					JSON.stringify({
						backend: selectedAlgorithm.backend,
						preset: selectedAlgorithm.preset,
						name: selectedAlgorithm.name
					})
				);
			}

			goto(`/converter?${queryParams}`);
		} catch (error) {
			console.error('Failed to navigate to converter:', error);
		}
	}

	// Mobile performance optimization: Strategic image preloading
	$effect(() => {
		if (isInitialized && selectedAlgorithm) {
			// Immediately preload the currently selected algorithm
			preloadAlgorithmImages(selectedAlgorithm);
		}
	});

	// Validate selectedAlgorithm state consistency
	$effect(() => {
		if (selectedAlgorithm && emblaApi && isInitialized) {
			const currentIndex = emblaApi.selectedScrollSnap();
			const currentAlgorithms = carouselAlgorithms();
			const expectedAlgorithm = currentAlgorithms[currentIndex];

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
		if (intersectionObserver) {
			intersectionObserver.disconnect();
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
			{#each carouselAlgorithms() as algorithm (algorithm.id)}
				<div class="embla__slide flex-shrink-0" style="flex: 0 0 auto;">
					<button
						class="algorithm-tab group relative flex w-44 touch-manipulation items-center gap-2 overflow-hidden rounded-xl border-2 px-4 py-3 transition-all duration-300 sm:w-52 sm:px-6 sm:py-4 {selectedAlgorithm.id ===
						algorithm.id
							? 'border-ferrari-500 bg-ferrari-50 scale-105 shadow-lg'
							: 'hover:border-ferrari-500 hover:bg-ferrari-25 border-gray-200 bg-white hover:scale-102 hover:shadow-md active:scale-100'}"
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
						<!-- Mobile touch ripple effect -->
						<div
							class="bg-ferrari-100 pointer-events-none absolute inset-0 scale-0 rounded-xl opacity-0 transition-all duration-300 group-active:scale-100 group-active:opacity-20 md:hidden"
						></div>

						{#if selectedAlgorithm.id === algorithm.id}
							<div
								class="bg-ferrari-500 absolute -bottom-2 left-1/2 z-20 h-1 w-12 -translate-x-1/2 animate-pulse rounded-full"
							></div>
						{/if}
					</button>
				</div>
			{/each}
		</div>
	</div>
</div>

<!-- Show More/Less Button for Mobile -->
<div class="mb-8 flex justify-center md:hidden">
	<button
		onclick={toggleShowMore}
		class="group hover:border-ferrari-300 hover:bg-ferrari-25 hover:text-ferrari-600 focus:ring-ferrari-500 relative inline-flex min-h-[44px] touch-manipulation items-center gap-2 overflow-hidden rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all duration-300 hover:shadow-lg focus:ring-2 focus:ring-offset-2 focus:outline-none active:scale-95 active:shadow-sm"
		aria-expanded={showAllAlgorithms}
		aria-label={showAllAlgorithms ? 'Show less algorithms' : 'Show more algorithms'}
	>
		<span class="relative z-10 transition-colors duration-300"
			>{showAllAlgorithms ? 'Show Less' : `Show More (${algorithms.length - MOBILE_LIMIT})`}</span
		>
		<svg
			class="group-hover:text-ferrari-600 relative z-10 h-4 w-4 transition-all duration-300 {showAllAlgorithms
				? 'rotate-180'
				: ''}"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>

		<!-- Mobile ripple effect indicator -->
		<div
			class="bg-ferrari-200 pointer-events-none absolute inset-0 scale-0 rounded-full opacity-0 transition-all duration-300 group-active:scale-100 group-active:opacity-30 md:hidden"
		></div>
	</button>
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
						loading={getImageLoadingStrategy(selectedAlgorithm)}
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
						class="group relative inline-flex w-56 touch-manipulation items-center justify-center gap-2 overflow-hidden rounded-xl px-4 py-2.5 font-semibold text-white shadow-lg transition-all duration-300 {selectedAlgorithm.isAvailable
							? 'bg-ferrari-600 hover:bg-ferrari-700 cursor-pointer hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 active:shadow-lg'
							: 'cursor-not-allowed bg-gray-400 opacity-75'}"
					>
						<span class="relative z-10"
							>{selectedAlgorithm.isAvailable
								? 'Try This Style'
								: `Coming Soon: ${selectedAlgorithm.name}`}</span
						>
						<ArrowRight
							class="relative z-10 h-5 w-5 transition-transform {selectedAlgorithm.isAvailable
								? 'group-hover:translate-x-1'
								: ''}"
						/>

						<!-- Mobile touch ripple effect for available buttons -->
						{#if selectedAlgorithm.isAvailable}
							<div
								class="pointer-events-none absolute inset-0 scale-0 rounded-xl bg-white opacity-0 transition-all duration-300 group-active:scale-100 group-active:opacity-20 md:hidden"
							></div>
						{/if}
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
