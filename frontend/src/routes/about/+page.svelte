<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Github, ExternalLink, Zap, Cpu, Layers, Shield, Gauge, Sparkles, User, Palette, Edit3, Users } from 'lucide-svelte';
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
			<p class="text-premium mx-auto mt-6 max-w-3xl text-lg">
				The most advanced browser-based image vectorizer. Transform any raster image into 
				expressive line art SVGs in seconds — entirely on your device with blazing-fast 
				Rust-powered algorithms and modern WebAssembly technology.
			</p>
			<div class="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-600">
				<div class="flex items-center gap-2">
					<Shield class="h-4 w-4 text-ferrari-600" aria-hidden="true" />
					<span>100% Local Processing</span>
				</div>
				<div class="flex items-center gap-2">
					<Gauge class="h-4 w-4 text-ferrari-600" aria-hidden="true" />
					<span>Sub-second Performance</span>
				</div>
				<div class="flex items-center gap-2">
					<Sparkles class="h-4 w-4 text-ferrari-600" aria-hidden="true" />
					<span>Professional Quality</span>
				</div>
			</div>
		</div>
	</div>
</section>


<!-- Algorithm Pipeline Section -->
<section class="bg-section-elevated relative py-16 sm:py-20" aria-labelledby="algorithms-heading">
	<div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
		<div class="animate-on-scroll mb-16 text-center">
			<h2 id="algorithms-heading" class="heading-section">
				Algorithm <span class="text-gradient-modern">Pipeline</span>
			</h2>
			<p class="text-premium mx-auto mt-6 max-w-3xl">
				Four specialized algorithms, each engineered for specific image types and artistic styles
			</p>
		</div>

		<div
			class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
			role="group"
			aria-label="Algorithm options"
		>
			<!-- Edge Detection -->
			<article
				class="card-ferrari-interactive animate-on-scroll group flex flex-col rounded-3xl p-6"
				aria-labelledby="edge-detection-heading"
			>
				<div class="relative flex h-full flex-col">
					<!-- Header -->
					<div class="text-center mb-4">
						<div
							class="icon-ferrari-bg mx-auto mb-3 flex h-16 w-16 transform items-center justify-center rounded-3xl transition-transform duration-300 group-hover:scale-110"
						>
							<svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
								></path>
							</svg>
						</div>
						<h3 id="edge-detection-heading" class="text-speed-gray-900 text-xl font-bold mb-2">
							Edge Detection
						</h3>
					</div>
					
					<!-- Description -->
					<p class="text-speed-gray-600 text-sm leading-relaxed flex-grow mb-4">
						Advanced Canny edge detection with multi-pass directional processing. 
						Ideal for photographs and complex imagery requiring precise line extraction.
					</p>
					
					<!-- Best For -->
					<div class="text-ferrari-600 flex items-center text-sm font-medium pt-4">
						<svg class="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							></path>
						</svg>
						Best for portraits
					</div>
					
				</div>
				<!-- Dynamic hover overlay -->
				<div
					class="from-ferrari-500/0 to-ferrari-600/0 group-hover:from-ferrari-500/5 group-hover:to-ferrari-600/10 absolute inset-0 rounded-3xl bg-gradient-to-br transition-all duration-500"
				></div>
			</article>

			<!-- Centerline Tracing -->
			<article
				class="card-ferrari-interactive animate-on-scroll group flex flex-col rounded-3xl p-6 delay-100"
				aria-labelledby="centerline-heading"
			>
				<div class="relative flex h-full flex-col">
					<!-- Header -->
					<div class="text-center mb-4">
						<div
							class="icon-ferrari-bg mx-auto mb-3 flex h-16 w-16 transform items-center justify-center rounded-3xl transition-transform duration-300 group-hover:scale-110"
						>
							<svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
								></path>
							</svg>
						</div>
						<h3 id="centerline-heading" class="text-speed-gray-900 text-xl font-bold mb-2">
							Centerline Tracing
						</h3>
					</div>
					
					<!-- Description -->
					<p class="text-speed-gray-600 text-sm leading-relaxed flex-grow mb-4">
						Zhang-Suen skeleton extraction creates precise centerlines. 
						Perfect for logos, typography, and geometric designs requiring clean lines.
					</p>
					
					<!-- Best For -->
					<div class="text-ferrari-600 flex items-center text-sm font-medium pt-4">
						<svg class="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							></path>
						</svg>
						Best for abstract art
					</div>
					
				</div>
				<!-- Dynamic hover overlay -->
				<div
					class="from-ferrari-500/0 to-ferrari-600/0 group-hover:from-ferrari-500/5 group-hover:to-ferrari-600/10 absolute inset-0 rounded-3xl bg-gradient-to-br transition-all duration-500"
				></div>
			</article>

			<!-- Superpixel Regions -->
			<article
				class="card-ferrari-interactive animate-on-scroll group flex flex-col rounded-3xl p-6 delay-200"
				aria-labelledby="superpixel-heading"
			>
				<div class="relative flex h-full flex-col">
					<!-- Header -->
					<div class="text-center mb-4">
						<div
							class="icon-ferrari-bg mx-auto mb-3 flex h-16 w-16 transform items-center justify-center rounded-3xl transition-transform duration-300 group-hover:scale-110"
						>
							<svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
								></path>
							</svg>
						</div>
						<h3 id="superpixel-heading" class="text-speed-gray-900 text-xl font-bold mb-2">
							Superpixel Regions
						</h3>
					</div>
					
					<!-- Description -->
					<p class="text-speed-gray-600 text-sm leading-relaxed flex-grow mb-4">
						SLIC clustering creates striking polygonal line art from color regions. 
						Transforms photos into modern, abstract representations.
					</p>
					
					<!-- Best For -->
					<div class="text-ferrari-600 flex items-center text-sm font-medium pt-4">
						<svg class="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							></path>
						</svg>
						Best for large photos
					</div>
					
				</div>
				<!-- Dynamic hover overlay -->
				<div
					class="from-ferrari-500/0 to-ferrari-600/0 group-hover:from-ferrari-500/5 group-hover:to-ferrari-600/10 absolute inset-0 rounded-3xl bg-gradient-to-br transition-all duration-500"
				></div>
			</article>

			<!-- Stippling Effects -->
			<article
				class="card-ferrari-interactive animate-on-scroll group flex flex-col rounded-3xl p-6 delay-300"
				aria-labelledby="stippling-heading"
			>
				<div class="relative flex h-full flex-col">
					<!-- Header -->
					<div class="text-center mb-4">
						<div
							class="icon-ferrari-bg mx-auto mb-3 flex h-16 w-16 transform items-center justify-center rounded-3xl transition-transform duration-300 group-hover:scale-110"
						>
							<svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
								></path>
							</svg>
						</div>
						<h3 id="stippling-heading" class="text-speed-gray-900 text-xl font-bold mb-2">
							Stippling Effects
						</h3>
					</div>
					
					<!-- Description -->
					<p class="text-speed-gray-600 text-sm leading-relaxed flex-grow mb-4">
						Intelligent dot placement with adaptive sizing creates vintage pointillism. 
						Preserves colors while adding hand-crafted texture effects.
					</p>
					
					<!-- Best For -->
					<div class="text-ferrari-600 flex items-center text-sm font-medium pt-4">
						<svg class="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							></path>
						</svg>
						Best for high detail
					</div>
					
				</div>
				<!-- Dynamic hover overlay -->
				<div
					class="from-ferrari-500/0 to-ferrari-600/0 group-hover:from-ferrari-500/5 group-hover:to-ferrari-600/10 absolute inset-0 rounded-3xl bg-gradient-to-br transition-all duration-500"
				></div>
			</article>
		</div>
	</div>
</section>

<!-- Technical Innovation Section -->
<section class="bg-section-premium relative py-16 sm:py-20" aria-labelledby="innovation-heading">
	<div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
		<div class="animate-on-scroll mb-16 text-center">
			<h2 id="innovation-heading" class="heading-section">
				Converter <span class="text-gradient-modern">Process</span>
			</h2>
			<p class="text-premium mx-auto mt-6 max-w-3xl">
				WASM rendering delivering desktop-class performance in your browser
			</p>
		</div>

		<!-- Balanced Three-Column Grid -->
		<div class="grid gap-8 lg:grid-cols-3 lg:gap-12">
			<!-- Column 1: WebAssembly Multithreading -->
			<div class="animate-on-scroll">
				<div class="card-ferrari-interactive group h-full rounded-3xl p-8">
					<div class="flex h-full flex-col">
						<div class="mb-6">
							<div class="icon-ferrari-bg mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl">
								<!-- WebAssembly Logo -->
								<svg class="h-8 w-8" viewBox="0 0 512 512" aria-hidden="true">
									<rect width="512" height="512" rx="15%" fill="none" stroke="white" stroke-width="8"/>
									<path fill="white" d="m159.1 270.1h24l16.5 87.2 19.8-87.2h22.5l17.9 88.3 18.9-88.3h23.5l-30.6 128.2h-23.8L230 311l-19.1 87.3h-24.3zm170.2 0h37.8l37.5 128.2h-24.7l-8.2-28.6h-43.1l-6.3 28.6h-24.1zm14.4 31.6-10.5 47h32.6l-12.1-47zM297.4 75c0 .6 0 1.3 0 2c0 22.9-18.6 41.5-41.5 41.5c-22.9 0-41.5-18.6-41.5-41.5c0-.7 0-1.4 0-2H75V437H437V75z"/>
								</svg>
							</div>
							<h3 class="text-speed-gray-900 text-2xl font-bold">WebAssembly Multithreading</h3>
						</div>
						
						<div class="flex-grow">
							<p class="text-speed-gray-600 mb-6 leading-relaxed">
								Harness your CPU's full potential with true parallel processing in the browser. 
								Our WebAssembly implementation automatically adapts to your system's capabilities, 
								utilizing multiple cores for lightning-fast image processing.
							</p>
							
							<!-- Visual Connection to Pipeline -->
							<div class="mb-6">
								<div class="flex items-center gap-2 text-sm text-ferrari-600 font-medium">
									<div class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">2</div>
									<span>Powers WASM Engine step</span>
								</div>
							</div>
						</div>
						
						<div class="flex flex-wrap gap-2 mt-auto">
							<span class="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
								SharedArrayBuffer
							</span>
							<span class="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
								Worker Threads
							</span>
							<span class="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
								Parallel Processing
							</span>
						</div>
					</div>
					<!-- Dynamic hover overlay -->
					<div class="from-ferrari-500/0 to-ferrari-600/0 group-hover:from-ferrari-500/5 group-hover:to-ferrari-600/10 absolute inset-0 rounded-3xl bg-gradient-to-br transition-all duration-500"></div>
				</div>
			</div>

			<!-- Column 2: Processing Pipeline -->
			<div class="animate-on-scroll">
				<div class="card-ferrari-interactive group h-full rounded-3xl p-8">
					<div class="flex h-full flex-col justify-center">
						<h3 class="text-speed-gray-900 mb-8 text-center text-2xl font-bold">
							Processing Pipeline
						</h3>
						
						<!-- Compact Flow Diagram -->
						<div class="space-y-3">
							<!-- Step 1 -->
							<div class="flex items-center justify-between rounded-xl border-2 border-gray-200 bg-gray-50 p-3">
								<div class="flex items-center gap-3">
									<div class="flex h-7 w-7 items-center justify-center rounded-full bg-ferrari-600 text-white text-xs font-bold">1</div>
									<span class="text-speed-gray-700 font-medium text-sm">Your Browser</span>
								</div>
								<span class="text-speed-gray-500 text-xs">Upload</span>
							</div>
							
							<!-- Compact Arrow -->
							<div class="flex justify-center">
								<svg class="h-4 w-4 text-ferrari-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
									<path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
								</svg>
							</div>

							<!-- Step 2 -->
							<div class="flex items-center justify-between rounded-xl border-2 border-blue-200 bg-blue-50 p-3">
								<div class="flex items-center gap-3">
									<div class="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">2</div>
									<span class="text-speed-gray-700 font-medium text-sm">WASM Engine</span>
								</div>
								<span class="text-speed-gray-500 text-xs">Multi-threaded</span>
							</div>
							
							<!-- Compact Arrow -->
							<div class="flex justify-center">
								<svg class="h-4 w-4 text-ferrari-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
									<path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
								</svg>
							</div>

							<!-- Step 3 -->
							<div class="flex items-center justify-between rounded-xl border-2 border-orange-200 bg-orange-50 p-3">
								<div class="flex items-center gap-3">
									<div class="flex h-7 w-7 items-center justify-center rounded-full bg-orange-600 text-white text-xs font-bold">3</div>
									<span class="text-speed-gray-700 font-medium text-sm">Rust Algorithms</span>
								</div>
								<span class="text-speed-gray-500 text-xs">SIMD</span>
							</div>
							
							<!-- Compact Arrow -->
							<div class="flex justify-center">
								<svg class="h-4 w-4 text-ferrari-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
									<path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
								</svg>
							</div>

							<!-- Step 4 -->
							<div class="flex items-center justify-between rounded-xl border-2 border-green-200 bg-green-50 p-3">
								<div class="flex items-center gap-3">
									<div class="flex h-7 w-7 items-center justify-center rounded-full bg-green-600 text-white text-xs font-bold">4</div>
									<span class="text-speed-gray-700 font-medium text-sm">SVG Output</span>
								</div>
								<span class="text-speed-gray-500 text-xs">Quality</span>
							</div>
						</div>
					</div>
					<!-- Dynamic hover overlay -->
					<div class="from-ferrari-500/0 to-ferrari-600/0 group-hover:from-ferrari-500/5 group-hover:to-ferrari-600/10 absolute inset-0 rounded-3xl bg-gradient-to-br transition-all duration-500"></div>
				</div>
			</div>

			<!-- Column 3: Rust-Powered Algorithms -->
			<div class="animate-on-scroll">
				<div class="card-ferrari-interactive group h-full rounded-3xl p-8">
					<div class="flex h-full flex-col">
						<div class="mb-6">
							<div class="icon-ferrari-bg mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl">
								<!-- Rust Logo -->
								<svg class="h-8 w-8" fill="white" viewBox="0 0 32 32" aria-hidden="true">
									<path fill="white" d="M25.763 12.291c0.099-0.098 0.235-0.159 0.385-0.159 0.301 0 0.545 0.244 0.545 0.545s-0.244 0.545-0.545 0.545c-0.301 0-0.545-0.244-0.545-0.545 0-0.15 0.061-0.286 0.159-0.385v0zM15.342 3.906c0.163-0.171 0.392-0.278 0.647-0.278 0.493 0 0.892 0.399 0.892 0.892s-0.399 0.892-0.892 0.892c-0.413 0-0.76-0.28-0.862-0.661l-0.001-0.006c-0.018-0.068-0.029-0.145-0.029-0.225 0-0.238 0.093-0.454 0.245-0.614l-0 0zM26.965 15.901c0 0.273-0.010 0.545-0.030 0.814h-1.125c-0.112 0-0.158 0.073-0.158 0.185v0.516c0 1.216-0.686 1.48-1.287 1.547-0.572 0.065-1.206-0.239-1.284-0.589-0.089-1.265-0.773-2.353-1.772-2.994l-0.015-0.009c1.206-0.593 2.062-1.736 2.246-3.093l0.002-0.021c-0.049-1.229-0.72-2.29-1.705-2.884l-0.016-0.009c-0.667-0.438-1.472-0.719-2.339-0.773l-0.014-0.001h-11.63c1.569-1.749 3.678-2.987 6.063-3.45l0.069-0.011 1.371 1.438c0.148 0.155 0.356 0.252 0.587 0.252 0.218 0 0.415-0.086 0.561-0.226l-0 0 1.533-1.467c3.233 0.622 5.913 2.593 7.475 5.291l0.028 0.053-1.050 2.372c-0.044 0.097-0.069 0.21-0.069 0.329 0 0.329 0.195 0.613 0.477 0.742l0.005 0.002 2.022 0.898c0.035 0.359 0.053 0.721 0.053 1.089zM13.522 14.044v-2.063h3.699c0.191 0 1.349 0.221 1.349 1.087 0 0.719-0.888 0.977-1.618 0.977zM5.106 14.723l1.918-0.853c0.287-0.13 0.483-0.413 0.483-0.742 0-0.12-0.026-0.233-0.072-0.335l0.002 0.005-0.395-0.893h1.554v7.001h-3.134c-0.266-0.899-0.418-1.931-0.418-3 0-0.417 0.023-0.829 0.069-1.234l-0.005 0.050zM6.15 12.247c-0-0.295-0.239-0.534-0.534-0.534s-0.534 0.239-0.534 0.534c0 0.295 0.239 0.534 0.534 0.534s0.534-0.239 0.534-0.534v0zM9.548 26.027c-0.061 0.015-0.13 0.023-0.202 0.023-0.493 0-0.892-0.399-0.892-0.892s0.399-0.892 0.892-0.892c0.493 0 0.892 0.399 0.892 0.892 0 0.096-0.015 0.189-0.043 0.276l0.002-0.006c-0.097 0.3-0.34 0.526-0.643 0.599l-0.006 0.001zM21.937 23.178c-0.051-0.012-0.11-0.018-0.171-0.018-0.388 0-0.713 0.273-0.792 0.638l-0.001 0.005-0.447 2.085c-1.329 0.615-2.884 0.974-4.523 0.974-1.675 0-3.263-0.375-4.684-1.046l0.067 0.028-0.447-2.085c-0.080-0.369-0.404-0.642-0.792-0.642-0.061 0-0.12 0.007-0.177 0.019l0.005-0.001-1.841 0.395c-0.332-0.341-0.644-0.707-0.931-1.093l-0.021-0.029h8.957c0.101 0 0.169-0.018 0.169-0.11v-3.169c0-0.092-0.067-0.11-0.169-0.11h-2.62v-2.009h2.834c0.881 0.009 1.607 0.656 1.741 1.5l0.001 0.010c0.113 0.441 0.359 1.88 0.529 2.34 0.168 0.516 0.854 1.547 1.585 1.547h4.463c0.058-0.001 0.114-0.007 0.168-0.017l-0.006 0.001c-0.326 0.44-0.658 0.828-1.016 1.192l0.001-0.001zM22.365 26.070c1.13-0 2.046-0.917 2.046-2.047s-0.916-2.047-2.047-2.047-2.047 0.916-2.047 2.047c0 1.13 0.916 2.046 2.046 2.047h0zM30.789 15.629l-1.259-0.779q-0.016-0.184-0.035-0.367l1.082-1.008c0.084-0.079 0.136-0.192 0.136-0.316 0-0.184-0.115-0.342-0.277-0.406l-0.003-0.001-1.383-0.517q-0.051-0.179-0.109-0.357l0.863-1.198c0.051-0.070 0.082-0.158 0.082-0.253 0-0.215-0.156-0.393-0.361-0.427l-0.003-0-1.458-0.237q-0.085-0.165-0.176-0.328l0.612-1.345c0.025-0.053 0.039-0.114 0.039-0.18 0-0.090-0.027-0.173-0.075-0.242l0.001 0.001c-0.079-0.117-0.212-0.193-0.362-0.193-0.005 0-0.010 0-0.015 0l0.001-0-1.48 0.052q-0.114-0.144-0.234-0.283l0.34-1.441c0.007-0.030 0.011-0.064 0.011-0.099 0-0.240-0.194-0.434-0.434-0.434-0.035 0-0.069 0.004-0.102 0.012l0.003-0.001-1.441 0.34q-0.141-0.119-0.285-0.234l0.052-1.48c0-0.006 0-0.013 0-0.021 0-0.238-0.193-0.43-0.43-0.43-0.066 0-0.129 0.015-0.185 0.042l0.003-0.001-1.345 0.614c-0.109-0.059-0.218-0.119-0.328-0.176l-0.238-1.459c-0.036-0.207-0.215-0.362-0.429-0.362-0.094 0-0.182 0.030-0.253 0.081l0.001-0.001-1.199 0.863q-0.177-0.057-0.357-0.107l-0.517-1.383c-0.064-0.165-0.222-0.28-0.407-0.28-0.124 0-0.236 0.052-0.316 0.136l-0 0-1.008 1.083q-0.183-0.021-0.367-0.035l-0.779-1.259c-0.078-0.124-0.213-0.205-0.368-0.205s-0.291 0.081-0.367 0.204l-0.001 0.002-0.779 1.259q-0.184 0.016-0.367 0.035l-1.010-1.083c-0.079-0.085-0.192-0.138-0.317-0.138-0.185 0-0.343 0.116-0.405 0.279l-0.001 0.003-0.517 1.383c-0.120 0.034-0.238 0.071-0.357 0.107l-1.198-0.863c-0.070-0.050-0.157-0.080-0.252-0.080-0.215 0-0.393 0.155-0.429 0.36l-0 0.003-0.238 1.459q-0.165 0.085-0.328 0.176l-1.345-0.614c-0.053-0.025-0.115-0.039-0.18-0.039-0.239 0-0.433 0.194-0.433 0.433 0 0.006 0 0.012 0 0.017l-0-0.001 0.052 1.48q-0.144 0.114-0.285 0.234l-1.441-0.341c-0.030-0.007-0.064-0.011-0.099-0.011-0.24 0-0.434 0.194-0.434 0.434 0 0.035 0.004 0.069 0.012 0.102l-0.001-0.003 0.339 1.441c-0.078 0.094-0.157 0.189-0.233 0.283l-1.48-0.052c-0.005-0-0.011-0-0.017-0-0.239 0-0.433 0.194-0.433 0.433 0 0.065 0.014 0.127 0.040 0.183l-0.001-0.003 0.614 1.345q-0.091 0.162-0.176 0.328l-1.457 0.237c-0.207 0.036-0.362 0.214-0.362 0.429 0 0.094 0.030 0.182 0.081 0.253l-0.001-0.001 0.863 1.198q-0.056 0.178-0.109 0.357l-1.383 0.517c-0.165 0.064-0.28 0.222-0.28 0.407 0 0.124 0.052 0.236 0.135 0.316l0 0 1.082 1.008q-0.021 0.183-0.035 0.367l-1.259 0.779c-0.125 0.077-0.208 0.213-0.208 0.368s0.082 0.292 0.206 0.367l0.002 0.001 1.259 0.779c0.010 0.123 0.023 0.245 0.035 0.367l-1.082 1.010c-0.085 0.079-0.138 0.192-0.138 0.317 0 0.185 0.116 0.343 0.279 0.405l0.003 0.001 1.383 0.517c0.034 0.120 0.071 0.239 0.109 0.357l-0.863 1.198c-0.052 0.070-0.083 0.159-0.083 0.254 0 0.215 0.158 0.394 0.364 0.426l0.002 0 1.457 0.237c0.057 0.110 0.115 0.219 0.176 0.328l-0.614 1.345c-0.025 0.053-0.039 0.115-0.039 0.18 0 0.239 0.194 0.433 0.433 0.433 0.006 0 0.012-0 0.017-0l-0.001 0 1.479-0.052c0.077 0.096 0.154 0.191 0.234 0.285l-0.339 1.442c-0.007 0.030-0.011 0.064-0.011 0.099 0 0.239 0.194 0.433 0.433 0.433 0.036 0 0.070-0.004 0.103-0.012l-0.003 0.001 1.441-0.339c0.094 0.080 0.189 0.157 0.285 0.233l-0.052 1.48c-0 0.006-0 0.012-0 0.019 0 0.238 0.193 0.43 0.43 0.43 0.066 0 0.129-0.015 0.185-0.042l-0.003 0.001 1.345-0.612c0.109 0.061 0.218 0.119 0.328 0.176l0.238 1.457c0.036 0.207 0.214 0.363 0.429 0.363 0.094 0 0.181-0.030 0.253-0.081l-0.001 0.001 1.198-0.863q0.178 0.057 0.357 0.109l0.517 1.383c0.062 0.167 0.22 0.283 0.405 0.283 0.125 0 0.238-0.053 0.317-0.139l0-0 1.010-1.082c0.121 0.014 0.244 0.025 0.367 0.037l0.779 1.259c0.078 0.123 0.214 0.204 0.368 0.204s0.29-0.081 0.367-0.203l0.001-0.002 0.779-1.259c0.123-0.011 0.245-0.023 0.367-0.037l1.008 1.082c0.079 0.084 0.192 0.136 0.316 0.136 0.184 0 0.342-0.115 0.406-0.277l0.001-0.003 0.517-1.383q0.179-0.051 0.357-0.109l1.198 0.863c0.070 0.052 0.159 0.083 0.254 0.083 0.215 0 0.394-0.158 0.426-0.364l0-0.002 0.238-1.457c0.110-0.057 0.219-0.116 0.328-0.176l1.345 0.612c0.052 0.024 0.114 0.038 0.179 0.038 0.24 0 0.434-0.194 0.434-0.434 0-0.005-0-0.009-0-0.014l0 0.001-0.052-1.48q0.144-0.113 0.283-0.233l1.441 0.339c0.030 0.007 0.064 0.011 0.098 0.011 0.24 0 0.434-0.194 0.434-0.434 0-0.035-0.004-0.068-0.012-0.1l0.001 0.003-0.339-1.442c0.078-0.094 0.157-0.188 0.233-0.285l1.48 0.052c0.006 0 0.013 0 0.020 0 0.238 0 0.43-0.193 0.43-0.43 0-0.066-0.015-0.129-0.042-0.185l0.001 0.003-0.612-1.345c0.059-0.109 0.119-0.218 0.176-0.328l1.457-0.237c0.207-0.036 0.362-0.215 0.362-0.429 0-0.094-0.030-0.182-0.081-0.253l0.001 0.001-0.863-1.198 0.109-0.357 1.383-0.517c0.166-0.063 0.282-0.221 0.282-0.406 0-0.125-0.053-0.238-0.138-0.317l-0-0-1.082-1.010c0.013-0.121 0.025-0.244 0.035-0.367l1.259-0.779c0.125-0.077 0.208-0.213 0.208-0.368s-0.082-0.291-0.206-0.367l-0.002-0.001z"/>
								</svg>
							</div>
							<h3 class="text-speed-gray-900 text-2xl font-bold">Rust-Powered Algorithms</h3>
						</div>
						
						<div class="flex-grow">
							<p class="text-speed-gray-600 mb-6 leading-relaxed">
								Memory-safe, zero-cost abstractions with SIMD acceleration. Our Rust-based 
								core delivers the performance of native desktop applications while maintaining 
								the security and accessibility of modern web technology.
							</p>
							
							<!-- Visual Connection to Pipeline -->
							<div class="mb-6">
								<div class="flex items-center gap-2 text-sm text-ferrari-600 font-medium">
									<div class="flex h-6 w-6 items-center justify-center rounded-full bg-orange-600 text-white text-xs font-bold">3</div>
									<span>Powers Algorithm processing</span>
								</div>
							</div>
						</div>
						
						<div class="flex flex-wrap gap-2 mt-auto">
							<span class="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-medium text-orange-700">
								Memory Safe
							</span>
							<span class="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-medium text-orange-700">
								SIMD Optimized
							</span>
							<span class="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-medium text-orange-700">
								Zero-cost
							</span>
						</div>
					</div>
					<!-- Dynamic hover overlay -->
					<div class="from-ferrari-500/0 to-ferrari-600/0 group-hover:from-ferrari-500/5 group-hover:to-ferrari-600/10 absolute inset-0 rounded-3xl bg-gradient-to-br transition-all duration-500"></div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Performance Metrics Section - Data-Focused Design -->
<section class="bg-section-elevated relative py-16 sm:py-20" aria-labelledby="performance-heading">
	<div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
		<div class="animate-on-scroll mb-16 text-center">
			<h2 id="performance-heading" class="heading-section">
				Performance <span class="text-gradient-modern">Metrics</span>
			</h2>
			<p class="text-premium mx-auto mt-6 max-w-3xl">
				Professional-grade performance that outpaces traditional cloud-based solutions
			</p>
		</div>

		<div class="grid gap-8 sm:grid-cols-3">
			<!-- Performance Card 1 - Data-focused styling -->
			<div class="card-ferrari-interactive animate-on-scroll group rounded-2xl p-8 text-center bg-white border-2 border-gray-300 shadow-lg hover:border-ferrari-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative">
				<div class="relative">
					<div
						class="icon-ferrari-bg mx-auto mb-6 flex h-20 w-20 transform items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 shadow-lg"
					>
						<Zap class="h-10 w-10 text-white" aria-hidden="true" />
					</div>
					<!-- Technical monospace metric -->
					<div class="text-ferrari-600 mb-2 text-4xl font-black font-mono tracking-tight">&lt; 1.5s</div>
					<p class="text-speed-gray-900 mb-1 font-bold text-lg tracking-tight">Processing Time</p>
					<p class="text-speed-gray-600 text-sm font-medium">Parallel processing on your hardware</p>
					<!-- Mini progress indicator -->
					<div class="mt-4 w-full bg-gray-200 rounded-full h-2">
						<div class="bg-ferrari-600 h-2 rounded-full w-4/5 transition-all duration-1000 group-hover:w-full"></div>
					</div>
				</div>
				<!-- Dynamic hover overlay -->
				<div
					class="from-ferrari-500/0 to-ferrari-600/0 group-hover:from-ferrari-500/5 group-hover:to-ferrari-600/10 absolute inset-0 rounded-2xl bg-gradient-to-br transition-all duration-500"
				></div>
			</div>

			<!-- Performance Card 2 -->
			<div class="card-ferrari-interactive animate-on-scroll group rounded-2xl p-8 text-center bg-white border-2 border-gray-300 shadow-lg hover:border-ferrari-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 delay-100 relative">
				<div class="relative">
					<div
						class="icon-ferrari-bg mx-auto mb-6 flex h-20 w-20 transform items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 shadow-lg"
					>
						<Cpu class="h-10 w-10 text-white" aria-hidden="true" />
					</div>
					<!-- Technical monospace metric -->
					<div class="text-ferrari-600 mb-2 text-4xl font-black font-mono tracking-tight">100%</div>
					<p class="text-speed-gray-900 mb-1 font-bold text-lg tracking-tight">Client-Side</p>
					<p class="text-speed-gray-600 text-sm font-medium">Complete privacy & instant processing</p>
					<!-- Security indicator -->
					<div class="mt-4 flex items-center justify-center gap-1">
						<Shield class="h-4 w-4 text-green-600" />
						<span class="text-xs text-green-700 font-semibold">SECURE</span>
					</div>
				</div>
				<!-- Dynamic hover overlay -->
				<div
					class="from-ferrari-500/0 to-ferrari-600/0 group-hover:from-ferrari-500/5 group-hover:to-ferrari-600/10 absolute inset-0 rounded-2xl bg-gradient-to-br transition-all duration-500"
				></div>
			</div>

			<!-- Performance Card 3 -->
			<div class="card-ferrari-interactive animate-on-scroll group rounded-2xl p-8 text-center bg-white border-2 border-gray-300 shadow-lg hover:border-ferrari-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 delay-200 relative">
				<div class="relative">
					<div
						class="icon-ferrari-bg mx-auto mb-6 flex h-20 w-20 transform items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 shadow-lg"
					>
						<Layers class="h-10 w-10 text-white" aria-hidden="true" />
					</div>
					<!-- Technical monospace metric -->
					<div class="text-ferrari-600 mb-2 text-4xl font-black font-mono tracking-tight">4</div>
					<p class="text-speed-gray-900 mb-1 font-bold text-lg tracking-tight">Algorithms</p>
					<p class="text-speed-gray-600 text-sm font-medium">Specialized conversion engines</p>
					<!-- Algorithm indicators -->
					<div class="mt-4 flex justify-center gap-1">
						<div class="w-2 h-2 bg-ferrari-600 rounded-full"></div>
						<div class="w-2 h-2 bg-ferrari-600 rounded-full"></div>
						<div class="w-2 h-2 bg-ferrari-600 rounded-full"></div>
						<div class="w-2 h-2 bg-ferrari-600 rounded-full"></div>
					</div>
				</div>
				<!-- Dynamic hover overlay -->
				<div
					class="from-ferrari-500/0 to-ferrari-600/0 group-hover:from-ferrari-500/5 group-hover:to-ferrari-600/10 absolute inset-0 rounded-2xl bg-gradient-to-br transition-all duration-500"
				></div>
			</div>
		</div>
	</div>
</section>

<!-- Coming Soon Section - Future-Focused Design -->
<section class="bg-section-premium relative py-16 sm:py-20 overflow-hidden" aria-labelledby="coming-soon-heading">
	<!-- Subtle background pattern -->
	<div class="absolute inset-0 opacity-5">
		<div class="absolute inset-0" style="background-image: radial-gradient(circle at 2px 2px, #dc2626 1px, transparent 0); background-size: 20px 20px;"></div>
	</div>
	<div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
		<div class="animate-on-scroll mb-16 text-center relative z-10">
			<h2 id="coming-soon-heading" class="heading-section">
				Coming <span class="text-gradient-modern font-black tracking-tight">Soon..</span>
			</h2>
			<p class="text-premium mx-auto mt-6 max-w-3xl font-medium italic">
				Exciting new features planned to enhance your vectorization workflow
			</p>
		</div>

		<div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 relative z-10">
			<!-- Feature Card 1 - Future-focused styling -->
			<div class="card-ferrari-interactive animate-on-scroll group flex flex-col rounded-2xl p-6 bg-white/95 backdrop-blur-sm border-2 border-dashed border-gray-300 hover:border-ferrari-500 transition-all duration-500 hover:bg-white hover:-translate-y-1 relative">
				<div class="relative flex h-full flex-col">
					<!-- SOON Badge -->
					<div class="absolute -top-3 -right-3 bg-ferrari-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg transform rotate-12">
						SOON
					</div>
					
					<!-- Header -->
					<div class="text-center mb-4">
						<div class="icon-ferrari-bg mx-auto mb-3 flex h-16 w-16 transform items-center justify-center rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-lg">
							<User class="h-8 w-8 text-white" aria-hidden="true" />
						</div>
						<h3 class="text-speed-gray-900 text-xl font-bold mb-2 uppercase tracking-wide">
							Account Creation
						</h3>
					</div>
					
					<!-- Description with italic aspirational text -->
					<p class="text-speed-gray-600 text-sm leading-relaxed flex-grow mb-4 italic font-medium">
						Save your custom presets, processing history, and favorite settings. 
						Seamless sync across devices for consistent workflows.
					</p>
					
				</div>
				<!-- Dynamic hover overlay -->
				<div
					class="from-ferrari-500/0 to-ferrari-600/0 group-hover:from-ferrari-500/5 group-hover:to-ferrari-600/10 absolute inset-0 rounded-2xl bg-gradient-to-br transition-all duration-500"
				></div>
			</div>

			<!-- Feature Card 2 -->
			<div class="card-ferrari-interactive animate-on-scroll group flex flex-col rounded-2xl p-6 bg-white/95 backdrop-blur-sm border-2 border-dashed border-gray-300 hover:border-ferrari-500 transition-all duration-500 hover:bg-white hover:-translate-y-1 delay-100 relative">
				<div class="relative flex h-full flex-col">
					<!-- SOON Badge -->
					<div class="absolute -top-3 -right-3 bg-ferrari-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg transform rotate-12">
						SOON
					</div>
					
					<!-- Header -->
					<div class="text-center mb-4">
						<div class="icon-ferrari-bg mx-auto mb-3 flex h-16 w-16 transform items-center justify-center rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-lg">
							<Palette class="h-8 w-8 text-white" aria-hidden="true" />
						</div>
						<h3 class="text-speed-gray-900 text-xl font-bold mb-2 uppercase tracking-wide">
							More Algorithms
						</h3>
					</div>
					
					<!-- Description with italic aspirational text -->
					<p class="text-speed-gray-600 text-sm leading-relaxed flex-grow mb-4 italic font-medium">
						Expanded conversion options including watercolor effects, 
						sketch styles, and specialized artistic filters.
					</p>
					
				</div>
				<!-- Dynamic hover overlay -->
				<div
					class="from-ferrari-500/0 to-ferrari-600/0 group-hover:from-ferrari-500/5 group-hover:to-ferrari-600/10 absolute inset-0 rounded-2xl bg-gradient-to-br transition-all duration-500"
				></div>
			</div>

			<!-- Feature Card 3 -->
			<div class="card-ferrari-interactive animate-on-scroll group flex flex-col rounded-2xl p-6 bg-white/95 backdrop-blur-sm border-2 border-dashed border-gray-300 hover:border-ferrari-500 transition-all duration-500 hover:bg-white hover:-translate-y-1 delay-200 relative">
				<div class="relative flex h-full flex-col">
					<!-- SOON Badge -->
					<div class="absolute -top-3 -right-3 bg-ferrari-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg transform rotate-12">
						SOON
					</div>
					
					<!-- Header -->
					<div class="text-center mb-4">
						<div class="icon-ferrari-bg mx-auto mb-3 flex h-16 w-16 transform items-center justify-center rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-lg">
							<Edit3 class="h-8 w-8 text-white" aria-hidden="true" />
						</div>
						<h3 class="text-speed-gray-900 text-xl font-bold mb-2 uppercase tracking-wide">
							SVG Editor
						</h3>
					</div>
					
					<!-- Description with italic aspirational text -->
					<p class="text-speed-gray-600 text-sm leading-relaxed flex-grow mb-4 italic font-medium">
						Built-in vector editor for fine-tuning your converted images. 
						Adjust paths, colors, and styling without external tools.
					</p>
					
				</div>
				<!-- Dynamic hover overlay -->
				<div
					class="from-ferrari-500/0 to-ferrari-600/0 group-hover:from-ferrari-500/5 group-hover:to-ferrari-600/10 absolute inset-0 rounded-2xl bg-gradient-to-br transition-all duration-500"
				></div>
			</div>

			<!-- Feature Card 4 -->
			<div class="card-ferrari-interactive animate-on-scroll group flex flex-col rounded-2xl p-6 bg-white/95 backdrop-blur-sm border-2 border-dashed border-gray-300 hover:border-ferrari-500 transition-all duration-500 hover:bg-white hover:-translate-y-1 delay-300 relative">
				<div class="relative flex h-full flex-col">
					<!-- SOON Badge -->
					<div class="absolute -top-3 -right-3 bg-ferrari-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg transform rotate-12">
						SOON
					</div>
					
					<!-- Header -->
					<div class="text-center mb-4">
						<div class="icon-ferrari-bg mx-auto mb-3 flex h-16 w-16 transform items-center justify-center rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-lg">
							<Users class="h-8 w-8 text-white" aria-hidden="true" />
						</div>
						<h3 class="text-speed-gray-900 text-xl font-bold mb-2 uppercase tracking-wide">
							Community Showcase
						</h3>
					</div>
					
					<!-- Description with italic aspirational text -->
					<p class="text-speed-gray-600 text-sm leading-relaxed flex-grow mb-4 italic font-medium">
						Share your creations and discover amazing artwork from other users. 
						Inspiration gallery and technique sharing platform.
					</p>
					
				</div>
				<!-- Dynamic hover overlay -->
				<div
					class="from-ferrari-500/0 to-ferrari-600/0 group-hover:from-ferrari-500/5 group-hover:to-ferrari-600/10 absolute inset-0 rounded-2xl bg-gradient-to-br transition-all duration-500"
				></div>
			</div>
		</div>
	</div>
</section>

<!-- Get in Touch Section -->
<section class="bg-section-elevated relative py-16 sm:py-20" aria-labelledby="contact-heading">
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
				<a 
					href="/contact"
					aria-label="Report an issue on our contact page"
				>
					<Button variant="ferrari" class="flex items-center gap-2">
						<Github class="h-5 w-5" aria-hidden="true" />
						Report an Issue
					</Button>
				</a>
				<a 
					href="/contact"
					aria-label="Business inquiries on our contact page"
				>
					<Button variant="ferrari" class="flex items-center gap-2">
						<ExternalLink class="h-5 w-5" aria-hidden="true" />
						Business Inquiry
					</Button>
				</a>
			</div>
		</div>
	</div>
</section>
