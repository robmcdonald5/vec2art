<script lang="ts">
	import { ArrowRight, Image, Zap, Download } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { preload } from '$lib/utils/preload';
	import HeroSlider from '$lib/components/hero/HeroSlider.svelte';
	import AlgorithmShowcase from '$lib/components/landing/AlgorithmShowcase.svelte';

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

<div>
	<!-- Hero Slider Container -->
	<HeroSlider autoPlay={true} autoPlayDelay={6000}>
		<!-- Enhanced Hero Section with Modern Gradients -->
		<section class="relative min-h-[90vh] overflow-hidden">
			<!-- Modern gradient background -->
			<div class="absolute inset-0 bg-gradient-to-br from-indigo-100 via-white to-cyan-100"></div>
			<div
				class="absolute inset-0 bg-gradient-to-tr from-rose-100/50 via-transparent to-blue-100/50"
			></div>

			<!-- Animated gradient orbs -->
			<div
				class="absolute top-1/4 left-1/4 h-96 w-96 animate-pulse rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-3xl"
			></div>
			<div
				class="absolute right-1/3 bottom-1/3 h-80 w-80 animate-pulse rounded-full bg-gradient-to-r from-pink-400/20 to-red-400/20 blur-3xl delay-75"
			></div>
			<div
				class="absolute top-1/2 right-1/4 h-64 w-64 animate-pulse rounded-full bg-gradient-to-r from-cyan-400/20 to-teal-400/20 blur-3xl delay-150"
			></div>

			<!-- Content -->
			<div class="relative z-10 flex min-h-[90vh] items-center justify-center px-4 sm:px-6 lg:px-8">
				<div class="mx-auto max-w-screen-xl">
					<div class="text-center">
						<h1 class="heading-hero animate-fade-in">
							Transform Images into
							<span class="heading-hero-accent animate-gradient-shift">SVG Art</span>
						</h1>
						<p class="text-premium animate-slide-up mx-auto mt-8 max-w-3xl sm:text-2xl">
							High-performance browser-based tool that converts images into expressive, hand-drawn
							style graphics.
						</p>
						<div
							class="animate-slide-up mt-12 flex flex-col gap-6 delay-200 sm:flex-row sm:justify-center"
						>
							<a
								href="/converter"
								use:preload
								class="btn-ferrari-primary group inline-flex transform items-center justify-center gap-2 rounded-md px-10 py-3 text-xl font-semibold whitespace-nowrap text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-2xl focus:outline-none"
							>
								Start Converting
								<ArrowRight
									class="h-6 w-6 text-white transition-transform group-hover:translate-x-2 group-hover:scale-110"
								/>
							</a>
							<a
								href="/gallery"
								use:preload
								class="border-ferrari-500 text-ferrari-600 hover:bg-ferrari-50 hover:text-ferrari-700 inline-flex transform items-center justify-center gap-2 rounded-md border-2 bg-white px-10 py-3 text-xl font-medium whitespace-nowrap shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus:outline-none"
							>
								View Gallery
							</a>
						</div>
					</div>
				</div>
			</div>
		</section>
	</HeroSlider>

	<!-- Interactive Algorithm Showcase -->
	<section class="bg-section-elevated animate-on-scroll relative py-24 sm:py-32">
		<AlgorithmShowcase />
	</section>

	<!-- Enhanced Features Section -->
	<section class="bg-section-premium animate-on-scroll relative py-24 sm:py-32">
		<div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
			<div class="animate-on-scroll mb-20 text-center">
				<h2 class="heading-section">
					Why <span class="text-gradient-modern">vec2art?</span>
				</h2>
				<p class="text-premium mx-auto mt-6 max-w-3xl">
					Modern image processing with cutting-edge speed in your browser
				</p>
			</div>

			<div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
				<div class="card-ferrari-interactive animate-on-scroll group rounded-3xl p-10">
					<div class="relative">
						<div
							class="icon-ferrari-bg mx-auto flex h-20 w-20 transform items-center justify-center rounded-3xl transition-transform duration-300 group-hover:scale-110"
						>
							<Zap class="h-10 w-10 text-white" />
						</div>
						<h3 class="text-speed-gray-900 mt-6 text-2xl font-bold">Ultra-Fast Processing</h3>
						<p class="text-speed-gray-600 mt-4 leading-relaxed">
							Process images quickly using your system's local computation with WASM technology for
							blazing-fast results
						</p>
					</div>
					<!-- Dynamic hover overlay -->
					<div
						class="from-ferrari-25/0 to-ferrari-50/0 group-hover:from-ferrari-25/30 group-hover:to-ferrari-50/10 absolute inset-0 rounded-3xl bg-gradient-to-br transition-all duration-500"
					></div>
				</div>

				<div class="card-ferrari-interactive animate-on-scroll group rounded-3xl p-10 delay-100">
					<div class="relative">
						<div
							class="icon-ferrari-bg mx-auto flex h-20 w-20 transform items-center justify-center rounded-3xl transition-transform duration-300 group-hover:scale-110"
						>
							<Image class="h-10 w-10 text-white" />
						</div>
						<h3 class="text-speed-gray-900 mt-6 text-2xl font-bold">Artistic Outputs</h3>
						<p class="text-speed-gray-600 mt-4 leading-relaxed">
							Advanced algorithms with hand-drawn aesthetics, variable weights, and artistic tremor
							for beautiful results
						</p>
					</div>
					<!-- Dynamic hover overlay -->
					<div
						class="from-ferrari-25/0 to-ferrari-50/0 group-hover:from-ferrari-25/30 group-hover:to-ferrari-50/10 absolute inset-0 rounded-3xl bg-gradient-to-br transition-all duration-500"
					></div>
				</div>

				<div
					class="card-ferrari-interactive animate-on-scroll group rounded-3xl p-10 delay-200 sm:col-span-2 lg:col-span-1"
				>
					<div class="relative">
						<div
							class="icon-ferrari-bg mx-auto flex h-20 w-20 transform items-center justify-center rounded-3xl transition-transform duration-300 group-hover:scale-110"
						>
							<Download class="h-10 w-10 text-white" />
						</div>
						<h3 class="text-speed-gray-900 mt-6 text-2xl font-bold">Multiple Export Options</h3>
						<p class="text-speed-gray-600 mt-4 leading-relaxed">
							Convert multiple images in parallel with support for PNG, JPEG, and WebP formats
						</p>
					</div>
					<!-- Dynamic hover overlay -->
					<div
						class="from-ferrari-25/0 to-ferrari-50/0 group-hover:from-ferrari-25/30 group-hover:to-ferrari-50/10 absolute inset-0 rounded-3xl bg-gradient-to-br transition-all duration-500"
					></div>
				</div>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="relative bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white">
		<!-- Clean premium overlay -->
		<div
			class="from-speed-gray-800/20 via-speed-gray-900/10 to-speed-gray-800/20 pointer-events-none absolute inset-0 bg-gradient-to-r"
		></div>

		<!-- Main Footer Content -->
		<div class="relative py-12 md:py-16">
			<div class="mx-auto max-w-screen-xl px-4 md:px-6 lg:px-8">
				<div class="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12 lg:grid-cols-4">
					<!-- Brand Section -->
					<div class="lg:col-span-1">
						<div class="mb-6 flex items-center">
							<a href="/" class="hover:animate-ferrari-glow transition-all duration-300">
								<h3 class="footer-gradient-text text-3xl font-bold">vec2art</h3>
							</a>
						</div>
						<p class="mb-6 max-w-sm text-sm leading-relaxed text-gray-300">
							Transform any image into beautiful SVG art using advanced vectorization algorithms
							with hand-drawn aesthetics.
						</p>
						<!-- Social Links -->
						<div class="flex gap-4">
							<a
								href="https://x.com/vec2art"
								aria-label="Follow vec2art on X"
								class="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white transition-all duration-200 hover:scale-105"
							>
								<svg class="h-5 w-5" fill="white" viewBox="0 0 24 24"
									><path
										d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
									/></svg
								>
							</a>
							<a
								href="https://instagram.com/vec2art"
								aria-label="Follow vec2art on Instagram"
								class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white transition-all duration-200 hover:scale-105 hover:shadow-lg"
							>
								<svg class="h-5 w-5" fill="white" viewBox="0 0 24 24"
									><path
										d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
									/></svg
								>
							</a>
						</div>
					</div>

					<!-- Product Links -->
					<div>
						<h4 class="mb-4 text-sm font-semibold tracking-wider text-white uppercase">Product</h4>
						<ul class="space-y-3">
							<li>
								<a
									href="/converter"
									class="text-sm text-gray-300 transition-colors duration-200 hover:text-white"
									>Converter</a
								>
							</li>
							<li>
								<a
									href="/gallery"
									class="text-sm text-gray-300 transition-colors duration-200 hover:text-white"
									>Gallery</a
								>
							</li>
							<li>
								<span class="cursor-not-allowed text-sm text-gray-500"
									>In Browser Editor (Coming Soon)</span
								>
							</li>
							<li>
								<span class="cursor-not-allowed text-sm text-gray-500"
									>Account persistance with preset saving (Coming Soon)</span
								>
							</li>
						</ul>
					</div>

					<!-- Company Links -->
					<div>
						<h4 class="mb-4 text-sm font-semibold tracking-wider text-white uppercase">vec2art</h4>
						<ul class="space-y-3">
							<li>
								<a
									href="/about"
									class="text-sm text-gray-300 transition-colors duration-200 hover:text-white"
									>About</a
								>
							</li>
							<li>
								<span class="cursor-not-allowed text-sm text-gray-500">Tutorial (Coming Soon)</span>
							</li>
							<li>
								<span class="cursor-not-allowed text-sm text-gray-500"
									>Best Practices (Coming Soon)</span
								>
							</li>
						</ul>
					</div>

					<!-- Support Links -->
					<div>
						<h4 class="mb-4 text-sm font-semibold tracking-wider text-white uppercase">Support</h4>
						<ul class="space-y-3">
							<li>
								<a
									href="/contact"
									class="text-sm text-gray-300 transition-colors duration-200 hover:text-white"
									>Contact</a
								>
							</li>
							<li>
								<a
									href="/contact#bug-reports"
									class="text-sm text-gray-300 transition-colors duration-200 hover:text-white"
									>Issues Page</a
								>
							</li>
							<li>
								<span class="cursor-not-allowed text-sm text-gray-500">Community (Coming Soon)</span
								>
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>

		<!-- Footer Divider -->
		<div class="w-full border-t border-gray-600/50"></div>

		<!-- Copyright Section -->
		<div class="relative py-6">
			<div class="mx-auto max-w-screen-xl px-4 md:px-6 lg:px-8">
				<div class="flex flex-col items-center justify-between gap-4 md:flex-row">
					<p class="text-sm text-gray-400">© 2025 vec2art. Powered by Rust + WebAssembly.</p>
					<div class="flex gap-6">
						<a href="/info#privacy-policy" class="text-sm text-gray-400 hover:text-gray-300 transition-colors">
							Privacy Policy
						</a>
						<a href="/info#terms-of-service" class="text-sm text-gray-400 hover:text-gray-300 transition-colors">
							Terms of Service
						</a>
					</div>
				</div>
			</div>
		</div>
	</footer>
</div>
