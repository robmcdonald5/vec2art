<script lang="ts">
	import { onMount } from 'svelte';
	import { spring } from 'svelte/motion';
	import AutoAnimatedBeforeAfterSlider from '$lib/components/ui/before-after-slider/auto-animated-before-after-slider.svelte';
	import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-svelte';
	import { preload } from '$lib/utils/preload';

	interface ShowcaseItem {
		id: number;
		title: string;
		algorithm: string;
		beforeImage: string;
		afterImage: string;
	}

	// Props
	interface Props {
		children: any;
		showcaseItems?: ShowcaseItem[];
		autoPlay?: boolean;
		autoPlayDelay?: number;
	}

	let {
		children,
		showcaseItems = [
			{
				id: 1,
				title: 'Portrait Sketching',
				algorithm: 'Edge Detection',
				beforeImage: '/gallery/before/portraits-real/girl-beach.webp',
				afterImage: '/gallery/after-webp/portraits-real/girl-beach(edgetracing).webp'
			},
			{
				id: 2,
				title: 'Modern Portraits',
				algorithm: 'Superpixel',
				beforeImage: '/gallery/before/portraits-real/pool-hall.avif',
				afterImage: '/gallery/after-webp/portraits-real/pool-hall(superpixel).webp'
			},
			{
				id: 3,
				title: 'Anime Stippling',
				algorithm: 'Dot Pattern Art',
				beforeImage: '/gallery/before/anime/anime-girl-portrait.png',
				afterImage: '/gallery/after-webp/anime/anime-girl-portrait(stippling).webp'
			},
			{
				id: 4,
				title: 'Character Art',
				algorithm: 'Edge Detection',
				beforeImage: '/gallery/before/portraits-real/robert-knox.avif',
				afterImage: '/gallery/after-webp/portraits-real/robert-knox(edgetracing).webp'
			}
		],
		autoPlay = false,
		autoPlayDelay = 7500
	}: Props = $props();

	// State
	let currentPanel = $state(0); // 0 = hero, 1 = showcase
	let isDragging = $state(false);
	let startX = $state(0);
	let currentX = $state(0);
	let containerEl: HTMLDivElement;
	let showcaseIndex = $state(0);
	let autoPlayInterval: ReturnType<typeof setInterval> | undefined;

	// Spring for smooth panel transitions
	const panelOffset = spring(0, {
		stiffness: 0.075,
		damping: 0.25
	});

	// Calculate drag offset with edge resistance
	let dragOffset = $derived(() => {
		if (!isDragging) return 0;
		const raw = currentX - startX;

		// Add resistance at edges (can't swipe right from first panel or left from last panel)
		if ((currentPanel === 0 && raw > 0) || (currentPanel === 1 && raw < 0)) {
			// Apply resistance factor (like pulling a rubber band)
			return raw * 0.3;
		}

		return raw;
	});

	// Touch/Mouse handlers
	function handleStart(e: MouseEvent | TouchEvent) {
		// Don't capture events from interactive elements
		const target = e.target as HTMLElement;
		if (
			target.closest('.before-after-slider') ||
			target.closest('button') ||
			target.closest('a') ||
			target.closest('[data-no-hero-drag]')
		) {
			return;
		}

		isDragging = true;
		startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
		currentX = startX;

		// Pause autoplay during interaction
		if (autoPlayInterval) {
			clearInterval(autoPlayInterval);
		}
	}

	function handleMove(e: MouseEvent | TouchEvent) {
		if (!isDragging) return;

		// Don't prevent default on interactive elements or touch events (passive listeners)
		const target = e.target as HTMLElement;
		const isTouchEvent = 'touches' in e;
		if (
			!isTouchEvent && // Don't preventDefault on touch events (passive listeners)
			!target.closest('.before-after-slider') &&
			!target.closest('button') &&
			!target.closest('a') &&
			!target.closest('[data-no-hero-drag]')
		) {
			e.preventDefault();
		}

		currentX = 'touches' in e ? e.touches[0].clientX : e.clientX;
	}

	function handleEnd() {
		if (!isDragging) return;
		isDragging = false;

		const threshold = containerEl?.offsetWidth * 0.25 || 100;
		const swipeDistance = currentX - startX;

		// Determine swipe direction and change panel
		if (Math.abs(swipeDistance) > threshold) {
			if (swipeDistance > 0 && currentPanel > 0) {
				// Swipe right - go to previous panel
				goToPanel(currentPanel - 1);
			} else if (swipeDistance < 0 && currentPanel === 0) {
				// Swipe left - go to showcase
				goToPanel(1);
			} else {
				// Not enough movement or wrong direction - snap back
				goToPanel(currentPanel);
			}
		} else {
			// Below threshold - always snap back to current panel
			goToPanel(currentPanel);
		}

		// Reset drag state
		currentX = startX;
		startX = 0;

		// Resume autoplay
		if (autoPlay && currentPanel === 1) {
			startAutoPlay();
		}
	}

	function goToPanel(index: number) {
		currentPanel = Math.max(0, Math.min(1, index));
		panelOffset.set(-currentPanel * 100);
	}

	function nextShowcase() {
		showcaseIndex = (showcaseIndex + 1) % showcaseItems.length;
	}

	function _prevShowcase() {
		showcaseIndex = (showcaseIndex - 1 + showcaseItems.length) % showcaseItems.length;
	}

	function startAutoPlay() {
		if (!autoPlay) return;
		autoPlayInterval = setInterval(() => {
			if (currentPanel === 1) {
				nextShowcase();
			}
		}, autoPlayDelay);
	}

	// Lifecycle
	onMount(() => {
		// Add global mouse/touch listeners
		document.addEventListener('mousemove', handleMove as any);
		document.addEventListener('mouseup', handleEnd);
		document.addEventListener('touchmove', handleMove as any, { passive: true });
		document.addEventListener('touchend', handleEnd);

		// Start autoplay if on showcase panel
		if (autoPlay && currentPanel === 1) {
			startAutoPlay();
		}

		return () => {
			document.removeEventListener('mousemove', handleMove as any);
			document.removeEventListener('mouseup', handleEnd);
			document.removeEventListener('touchmove', handleMove as any);
			document.removeEventListener('touchend', handleEnd);

			if (autoPlayInterval) {
				clearInterval(autoPlayInterval);
			}
		};
	});

	// Update panel offset when dragging or snapping back
	$effect(() => {
		if (isDragging && containerEl) {
			// While dragging, update position immediately without spring
			const offset = -currentPanel * 100 + (dragOffset() / containerEl.offsetWidth) * 100;
			panelOffset.set(offset);
		} else if (!isDragging) {
			// When not dragging, ensure we're snapped to a panel
			panelOffset.set(-currentPanel * 100);
		}
	});
</script>

<div class="relative w-full overflow-hidden">
	<!-- Slider Container -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		bind:this={containerEl}
		class="relative h-full w-full cursor-grab active:cursor-grabbing"
		onmousedown={handleStart}
		ontouchstart={handleStart}
		role="region"
		aria-label="Hero content slider"
	>
		<!-- Panels Wrapper -->
		<div
			class="flex h-full transition-none"
			style="transform: translateX({$panelOffset}%); will-change: transform;"
		>
			<!-- Panel 1: Original Hero Content -->
			<div class="w-full flex-shrink-0">
				{@render children()}
			</div>

			<!-- Panel 2: Showcase -->
			<div class="w-full flex-shrink-0">
				<div class="relative min-h-[90vh] overflow-hidden">
					<!-- Matching gradient background -->
					<div
						class="absolute inset-0 bg-gradient-to-br from-indigo-100 via-white to-cyan-100"
					></div>
					<div
						class="absolute inset-0 bg-gradient-to-tr from-rose-100/50 via-transparent to-blue-100/50"
					></div>

					<!-- Showcase Content -->
					<div
						class="relative z-10 flex min-h-[90vh] items-center justify-center px-4 sm:px-6 lg:px-8"
					>
						<div class="mx-auto max-w-screen-xl">
							<div class="text-center">
								<!-- Showcase Header -->
								<div class="mb-8 flex items-center justify-center gap-3">
									<Sparkles class="text-ferrari-600 h-8 w-8" />
									<h2 class="text-4xl font-bold text-gray-900">See vec2art in Action</h2>
									<Sparkles class="text-ferrari-600 h-8 w-8" />
								</div>

								<!-- Showcase Card -->
								<div class="relative mx-auto max-w-4xl">
									<div
										class="relative overflow-hidden rounded-3xl border border-white/50 bg-white/80 p-8 shadow-2xl backdrop-blur-md"
									>
										<!-- Try It Button - Top Right of Card -->
										<a
											href="/converter"
											use:preload
											class="btn-ferrari-primary absolute top-4 right-4 z-10 inline-flex min-h-[44px] items-center gap-2 px-4 py-3 text-sm"
										>
											Try It Yourself
											<ChevronRight class="h-3 w-3" />
										</a>
										<!-- Current Showcase Item -->
										<div class="mb-6">
											<h3 class="mb-2 text-2xl font-semibold text-gray-900">
												{showcaseItems[showcaseIndex].title}
											</h3>
											<span
												class="inline-block rounded-full bg-gray-900 px-4 py-1 text-sm font-medium text-white shadow-md"
											>
												{showcaseItems[showcaseIndex].algorithm}
											</span>
										</div>

										<!-- Before/After Display - Auto-Animated -->
										<div
											class="relative aspect-video overflow-hidden rounded-xl bg-gray-50"
											data-no-hero-drag
										>
											<AutoAnimatedBeforeAfterSlider
												beforeImage={showcaseItems[showcaseIndex].beforeImage}
												afterImage={showcaseItems[showcaseIndex].afterImage}
												class="h-full w-full"
												animationDuration={6000}
												resetTrigger={currentPanel === 1 ? showcaseIndex : -1}
												loading={currentPanel === 1 && showcaseIndex === 0 ? 'eager' : 'lazy'}
											/>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Panel Indicators/Navigation -->
	<div class="absolute bottom-8 left-1/2 z-20 -translate-x-1/2">
		<div
			class="flex items-center gap-4 rounded-full bg-white/90 px-6 py-3 shadow-lg backdrop-blur-sm"
		>
			<button
				onclick={() => goToPanel(0)}
				class="relative flex min-h-[44px] touch-manipulation items-center gap-2 overflow-hidden px-2 transition-all {currentPanel ===
				0
					? 'text-ferrari-600 font-medium'
					: 'text-gray-500 hover:text-gray-700 active:scale-95'}"
			>
				<span
					class="relative z-10 h-2 w-2 rounded-full {currentPanel === 0
						? 'bg-ferrari-600'
						: 'bg-gray-300'}"
				></span>
				<span class="relative z-10">Overview</span>
				<!-- Mobile touch ripple -->
				<div
					class="bg-ferrari-100 pointer-events-none absolute inset-0 scale-0 rounded-full opacity-0 transition-all duration-300 group-active:scale-100 group-active:opacity-20 md:hidden"
				></div>
			</button>
			<div class="h-4 w-px bg-gray-300"></div>
			<button
				onclick={() => goToPanel(1)}
				class="relative flex min-h-[44px] touch-manipulation items-center gap-2 overflow-hidden px-2 transition-all {currentPanel ===
				1
					? 'text-ferrari-600 font-medium'
					: 'text-gray-500 hover:text-gray-700 active:scale-95'}"
			>
				<span
					class="relative z-10 h-2 w-2 rounded-full {currentPanel === 1
						? 'bg-ferrari-600'
						: 'bg-gray-300'}"
				></span>
				<span class="relative z-10">Examples</span>
				<!-- Mobile touch ripple -->
				<div
					class="bg-ferrari-100 pointer-events-none absolute inset-0 scale-0 rounded-full opacity-0 transition-all duration-300 group-active:scale-100 group-active:opacity-20 md:hidden"
				></div>
			</button>
		</div>
	</div>

	<!-- Edge Navigation Arrows -->
	{#if currentPanel === 0}
		<!-- Right arrow to go to showcase -->
		<button
			onclick={() => goToPanel(1)}
			class="absolute top-1/2 right-4 z-20 flex min-h-[44px] min-w-[44px] -translate-y-1/2 touch-manipulation items-center justify-center rounded-full focus:outline-none"
			aria-label="View examples"
		>
			<ChevronLeft
				class="text-ferrari-600 h-8 w-8 animate-pulse transition-all duration-300 hover:scale-125 hover:animate-none hover:drop-shadow-lg active:scale-110"
			/>
		</button>
	{:else if currentPanel === 1}
		<!-- Left arrow to go back to hero -->
		<button
			onclick={() => goToPanel(0)}
			class="absolute top-1/2 left-4 z-20 flex min-h-[44px] min-w-[44px] -translate-y-1/2 touch-manipulation items-center justify-center rounded-full focus:outline-none"
			aria-label="Back to overview"
		>
			<ChevronRight
				class="text-ferrari-600 h-8 w-8 animate-pulse transition-all duration-300 hover:scale-125 hover:animate-none hover:drop-shadow-lg active:scale-110"
			/>
		</button>
	{/if}
</div>

<style>
	/* Ensure smooth hardware-accelerated animations */
	:global(.hw-accelerate) {
		transform: translateZ(0);
		backface-visibility: hidden;
		perspective: 1000px;
	}
</style>
