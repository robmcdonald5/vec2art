<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Github, ExternalLink, Zap, Cpu, Layers } from 'lucide-svelte';
	import { onMount } from 'svelte';

	// Intersection Observer for scroll animations
	let observer: IntersectionObserver;

	onMount(() => {
		if (typeof window !== 'undefined') {
			observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting) {
							entry.target.classList.add('animate-fadeInUp');
						}
					});
				},
				{ threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
			);

			// Observe all animation targets
			const animationTargets = document.querySelectorAll('.animate-on-scroll');
			animationTargets.forEach((target) => observer.observe(target));
		}

		return () => {
			if (observer) {
				observer.disconnect();
			}
		};
	});
</script>

<!-- About Hero Section -->
<section
	class="bg-section-elevated relative py-16 sm:py-20"
	role="banner"
	aria-labelledby="about-heading"
>
	<div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="mb-8 text-center">
			<h1 id="about-heading" class="text-gradient-modern mb-4 text-4xl font-bold">About vec2art</h1>
			<p class="text-premium mx-auto mt-6 max-w-3xl">
				A high-performance, browser-based tool that transforms raster images into expressive line
				art SVGs using advanced algorithms powered by Rust and WASM.
			</p>
		</div>
	</div>
</section>

<!-- Algorithm Pipeline Section -->
<section class="bg-section-premium relative py-16 sm:py-20" aria-labelledby="algorithms-heading">
	<div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
		<div class="animate-on-scroll mb-16 text-center">
			<h2 id="algorithms-heading" class="heading-section">
				Algorithm <span class="text-gradient-modern">Pipeline</span>
			</h2>
			<p class="text-premium mx-auto mt-6 max-w-3xl">
				Choose the perfect algorithm for your image type and artistic vision
			</p>
		</div>

		<div
			class="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
			role="group"
			aria-label="Algorithm options"
		>
			<!-- Edge Detection -->
			<article
				class="card-ferrari-interactive animate-on-scroll group flex flex-col rounded-3xl p-8"
				aria-labelledby="edge-detection-heading"
			>
				<div class="relative flex h-full flex-col">
					<div
						class="icon-ferrari-bg mx-auto mb-6 flex h-18 w-18 transform items-center justify-center rounded-3xl transition-transform duration-300 group-hover:scale-110"
					>
						<svg class="h-9 w-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
							></path>
						</svg>
					</div>
					<h3 id="edge-detection-heading" class="text-speed-gray-900 mb-4 text-2xl font-bold">
						Edge Detection
					</h3>
					<p class="text-speed-gray-600 mb-6 flex-grow leading-relaxed">
						Uses Canny edge detection with adaptive thresholds for detailed line art. Perfect for
						drawings, sketches, and complex imagery requiring precise edge capture.
					</p>
					<div class="mt-auto flex flex-wrap gap-2">
						<span
							class="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm font-medium text-red-700"
							>Multi-pass processing</span
						>
						<span
							class="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm font-medium text-red-700"
							>Hand-drawn aesthetics</span
						>
						<span
							class="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm font-medium text-red-700"
							>Variable weights</span
						>
					</div>
				</div>
				<!-- Dynamic hover overlay -->
				<div
					class="from-ferrari-500/0 to-ferrari-600/0 group-hover:from-ferrari-500/5 group-hover:to-ferrari-600/10 absolute inset-0 rounded-3xl bg-gradient-to-br transition-all duration-500"
				></div>
				<div class="text-ferrari-600 mt-4 flex items-center pt-6 text-sm font-medium">
					<svg class="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						></path>
					</svg>
					Best for detailed art
				</div>
			</article>

			<!-- Centerline Tracing -->
			<article
				class="card-ferrari-interactive animate-on-scroll group flex flex-col rounded-3xl p-8 delay-100"
				aria-labelledby="centerline-heading"
			>
				<div class="relative flex h-full flex-col">
					<div
						class="icon-ferrari-bg mx-auto mb-6 flex h-18 w-18 transform items-center justify-center rounded-3xl transition-transform duration-300 group-hover:scale-110"
					>
						<svg class="h-9 w-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
							></path>
						</svg>
					</div>
					<h3 id="centerline-heading" class="text-speed-gray-900 mb-4 text-2xl font-bold">
						Centerline Tracing
					</h3>
					<p class="text-speed-gray-600 mb-6 flex-grow leading-relaxed">
						Zhang-Suen thinning algorithm for skeleton extraction. Ideal for bold shapes, logos,
						text, and geometric designs requiring precise centerline representation.
					</p>
					<div class="mt-auto flex flex-wrap gap-2">
						<span
							class="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm font-medium text-red-700"
							>Morphological processing</span
						>
						<span
							class="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm font-medium text-red-700"
							>Contour-based</span
						>
						<span
							class="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm font-medium text-red-700"
							>Geometric precision</span
						>
					</div>
				</div>
				<!-- Dynamic hover overlay -->
				<div
					class="from-ferrari-500/0 to-ferrari-600/0 group-hover:from-ferrari-500/5 group-hover:to-ferrari-600/10 absolute inset-0 rounded-3xl bg-gradient-to-br transition-all duration-500"
				></div>
				<div class="text-ferrari-600 mt-4 flex items-center pt-6 text-sm font-medium">
					<svg class="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						></path>
					</svg>
					Best for logos
				</div>
			</article>

			<!-- Superpixel Regions -->
			<article
				class="card-ferrari-interactive animate-on-scroll group flex flex-col rounded-3xl p-8 delay-200"
				aria-labelledby="superpixel-heading"
			>
				<div class="relative flex h-full flex-col">
					<div
						class="icon-ferrari-bg mx-auto mb-6 flex h-18 w-18 transform items-center justify-center rounded-3xl transition-transform duration-300 group-hover:scale-110"
					>
						<svg class="h-9 w-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
							></path>
						</svg>
					</div>
					<h3 id="superpixel-heading" class="text-speed-gray-900 mb-4 text-2xl font-bold">
						Superpixel Regions
					</h3>
					<p class="text-speed-gray-600 mb-6 flex-grow leading-relaxed">
						SLIC segmentation for stylized art and abstract representations. Creates polygonal line
						art based on color and texture regions.
					</p>
					<div class="mt-auto flex flex-wrap gap-2">
						<span
							class="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm font-medium text-red-700"
							>Region-based</span
						>
						<span
							class="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm font-medium text-red-700"
							>Adaptive clustering</span
						>
						<span
							class="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm font-medium text-red-700"
							>Modern art styles</span
						>
					</div>
				</div>
				<!-- Dynamic hover overlay -->
				<div
					class="from-ferrari-500/0 to-ferrari-600/0 group-hover:from-ferrari-500/5 group-hover:to-ferrari-600/10 absolute inset-0 rounded-3xl bg-gradient-to-br transition-all duration-500"
				></div>
				<div class="text-ferrari-600 mt-4 flex items-center pt-6 text-sm font-medium">
					<svg class="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						></path>
					</svg>
					Best for abstract art
				</div>
			</article>

			<!-- Stippling Effects -->
			<article
				class="card-ferrari-interactive animate-on-scroll group flex flex-col rounded-3xl p-8 delay-300"
				aria-labelledby="stippling-heading"
			>
				<div class="relative flex h-full flex-col">
					<div
						class="icon-ferrari-bg mx-auto mb-6 flex h-18 w-18 transform items-center justify-center rounded-3xl transition-transform duration-300 group-hover:scale-110"
					>
						<svg class="h-9 w-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
							></path>
						</svg>
					</div>
					<h3 id="stippling-heading" class="text-speed-gray-900 mb-4 text-2xl font-bold">
						Stippling Effects
					</h3>
					<p class="text-speed-gray-600 mb-6 flex-grow leading-relaxed">
						Adaptive dot placement for artistic textures and vintage styles. Creates stippling
						patterns with variable dot sizes and intelligent spacing.
					</p>
					<div class="mt-auto flex flex-wrap gap-2">
						<span
							class="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm font-medium text-red-700"
							>Content-aware</span
						>
						<span
							class="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm font-medium text-red-700"
							>Color preservation</span
						>
						<span
							class="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm font-medium text-red-700"
							>Artistic effects</span
						>
					</div>
				</div>
				<!-- Dynamic hover overlay -->
				<div
					class="from-ferrari-500/0 to-ferrari-600/0 group-hover:from-ferrari-500/5 group-hover:to-ferrari-600/10 absolute inset-0 rounded-3xl bg-gradient-to-br transition-all duration-500"
				></div>
				<div class="text-ferrari-600 mt-4 flex items-center pt-6 text-sm font-medium">
					<svg class="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						></path>
					</svg>
					Best for vintage style
				</div>
			</article>
		</div>
	</div>
</section>

<!-- Performance Metrics Section -->
<section class="bg-section-elevated relative py-16 sm:py-20" aria-labelledby="performance-heading">
	<div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
		<div class="animate-on-scroll mb-16 text-center">
			<h2 id="performance-heading" class="heading-section">
				Performance <span class="text-gradient-modern">Metrics</span>
			</h2>
			<p class="text-premium mx-auto mt-6 max-w-3xl">
				Ultra-fast processing with cutting-edge technology
			</p>
		</div>

		<div class="grid gap-8 sm:grid-cols-3">
			<div class="card-ferrari-interactive animate-on-scroll group rounded-3xl p-8 text-center">
				<div class="relative">
					<div
						class="icon-ferrari-bg mx-auto mb-6 flex h-20 w-20 transform items-center justify-center rounded-3xl transition-transform duration-300 group-hover:scale-110"
					>
						<Zap class="h-10 w-10 text-white" />
					</div>
					<div class="text-ferrari-600 mb-2 text-4xl font-bold">&lt; 1.5s</div>
					<p class="text-speed-gray-900 mb-1 font-semibold">Processing Time</p>
					<p class="text-speed-gray-600 text-sm">Ultra-fast WASM performance</p>
				</div>
				<!-- Dynamic hover overlay -->
				<div
					class="from-ferrari-500/0 to-ferrari-600/0 group-hover:from-ferrari-500/5 group-hover:to-ferrari-600/10 absolute inset-0 rounded-3xl bg-gradient-to-br transition-all duration-500"
				></div>
			</div>

			<div
				class="card-ferrari-interactive animate-on-scroll group rounded-3xl p-8 text-center delay-100"
			>
				<div class="relative">
					<div
						class="icon-ferrari-bg mx-auto mb-6 flex h-20 w-20 transform items-center justify-center rounded-3xl transition-transform duration-300 group-hover:scale-110"
					>
						<Cpu class="h-10 w-10 text-white" />
					</div>
					<div class="text-ferrari-600 mb-2 text-4xl font-bold">100%</div>
					<p class="text-speed-gray-900 mb-1 font-semibold">Client-Side</p>
					<p class="text-speed-gray-600 text-sm">No server uploads required</p>
				</div>
				<!-- Dynamic hover overlay -->
				<div
					class="from-ferrari-500/0 to-ferrari-600/0 group-hover:from-ferrari-500/5 group-hover:to-ferrari-600/10 absolute inset-0 rounded-3xl bg-gradient-to-br transition-all duration-500"
				></div>
			</div>

			<div
				class="card-ferrari-interactive animate-on-scroll group rounded-3xl p-8 text-center delay-200"
			>
				<div class="relative">
					<div
						class="icon-ferrari-bg mx-auto mb-6 flex h-20 w-20 transform items-center justify-center rounded-3xl transition-transform duration-300 group-hover:scale-110"
					>
						<Layers class="h-10 w-10 text-white" />
					</div>
					<div class="text-ferrari-600 mb-2 text-4xl font-bold">4</div>
					<p class="text-speed-gray-900 mb-1 font-semibold">Algorithms</p>
					<p class="text-speed-gray-600 text-sm">Specialized conversion engines</p>
				</div>
				<!-- Dynamic hover overlay -->
				<div
					class="from-ferrari-500/0 to-ferrari-600/0 group-hover:from-ferrari-500/5 group-hover:to-ferrari-600/10 absolute inset-0 rounded-3xl bg-gradient-to-br transition-all duration-500"
				></div>
			</div>
		</div>
	</div>
</section>

<!-- Get in Touch Section -->
<section class="bg-section-premium relative py-16 sm:py-20" aria-labelledby="contact-heading">
	<div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
		<div class="animate-on-scroll mb-12 text-center">
			<h2 id="contact-heading" class="heading-section">
				Get in <span class="text-gradient-modern">Touch</span>
			</h2>
			<p class="text-premium mx-auto mt-6 max-w-3xl">
				Have a question, suggestion, or problem with the site?
			</p>
		</div>

		<div class="card-ferrari-contact animate-on-scroll rounded-3xl p-8 text-center">
			<div class="flex flex-col gap-6 sm:flex-row sm:justify-center">
				<Button class="btn-ferrari-primary flex items-center gap-2">
					<Github class="h-5 w-5" />
					Report an Issue
				</Button>
				<Button class="btn-ferrari-primary flex items-center gap-2">
					<ExternalLink class="h-5 w-5" />
					Join Discussions
				</Button>
			</div>
		</div>
	</div>
</section>
