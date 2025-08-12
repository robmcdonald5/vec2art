<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import { ArrowRight, Image, Zap, Download } from 'lucide-svelte';
</script>

<div class="flex min-h-dvh flex-col">
	<header
		class="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 border-b backdrop-blur"
	>
		<div
			class="mx-auto flex h-14 w-full max-w-screen-xl items-center justify-between px-4 sm:px-6 lg:px-8"
		>
			<a href="/" class="flex items-center gap-2 font-semibold">
				<div class="bg-primary flex h-8 w-8 items-center justify-center rounded">
					<span class="text-primary-foreground text-sm">V2A</span>
				</div>
				<span>vec2art</span>
			</a>
			<nav class="flex items-center gap-4">
				<a href="/app" class="text-muted-foreground hover:text-foreground text-sm">App</a>
				<a href="/examples" class="text-muted-foreground hover:text-foreground text-sm">Examples</a>
				<Button href="/app" variant="default" size="sm">Get Started</Button>
			</nav>
		</div>
	</header>

	<main class="flex-1">
		<!-- Hero Section -->
		<section class="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
			<div class="mx-auto max-w-screen-xl">
				<div class="text-center">
					<h1 class="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
						Transform Images into
						<span class="text-primary"> Line Art SVGs</span>
					</h1>
					<p class="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg">
						High-performance browser-based tool that converts raster images into expressive,
						hand-drawn style vector graphics using advanced line tracing algorithms.
					</p>
					<div class="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
						<Button href="/app" size="lg" class="gap-2">
							Start Converting
							<ArrowRight class="h-4 w-4" />
						</Button>
						<Button href="/examples" variant="outline" size="lg">View Examples</Button>
					</div>
				</div>
			</div>
		</section>

		<!-- Features Section -->
		<section class="border-t px-4 py-16 sm:px-6 lg:px-8">
			<div class="mx-auto max-w-screen-xl">
				<h2 class="text-center text-3xl font-bold">Why vec2art?</h2>
				<div class="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
					<div class="text-center">
						<div
							class="bg-primary/10 mx-auto flex h-12 w-12 items-center justify-center rounded-lg"
						>
							<Zap class="text-primary h-6 w-6" />
						</div>
						<h3 class="mt-4 text-xl font-semibold">Ultra-Fast Processing</h3>
						<p class="text-muted-foreground mt-2">
							Process images in under 1.5 seconds with our optimized Rust/WASM engine
						</p>
					</div>
					<div class="text-center">
						<div
							class="bg-primary/10 mx-auto flex h-12 w-12 items-center justify-center rounded-lg"
						>
							<Image class="text-primary h-6 w-6" />
						</div>
						<h3 class="mt-4 text-xl font-semibold">Artistic Line Tracing</h3>
						<p class="text-muted-foreground mt-2">
							Advanced algorithms with hand-drawn aesthetics, variable weights, and artistic tremor
						</p>
					</div>
					<div class="text-center">
						<div
							class="bg-primary/10 mx-auto flex h-12 w-12 items-center justify-center rounded-lg"
						>
							<Download class="text-primary h-6 w-6" />
						</div>
						<h3 class="mt-4 text-xl font-semibold">Multiple Export Options</h3>
						<p class="text-muted-foreground mt-2">
							Export as optimized SVG with customizable quality and artistic parameters
						</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Algorithm Backends -->
		<section class="border-t px-4 py-16 sm:px-6 lg:px-8">
			<div class="mx-auto max-w-screen-xl">
				<h2 class="text-center text-3xl font-bold">Multiple Tracing Backends</h2>
				<p class="text-muted-foreground mx-auto mt-4 max-w-2xl text-center">
					Choose the perfect algorithm for your image type and artistic vision
				</p>
				<div class="mt-12 grid gap-6 sm:grid-cols-2">
					<div class="rounded-lg border p-6">
						<h3 class="text-xl font-semibold">Edge Detection</h3>
						<p class="text-muted-foreground mt-2 text-sm">
							Canny edge detection for detailed line art, drawings, and sketches
						</p>
					</div>
					<div class="rounded-lg border p-6">
						<h3 class="text-xl font-semibold">Centerline Tracing</h3>
						<p class="text-muted-foreground mt-2 text-sm">
							Zhang-Suen thinning for bold shapes, logos, and text
						</p>
					</div>
					<div class="rounded-lg border p-6">
						<h3 class="text-xl font-semibold">Superpixel Regions</h3>
						<p class="text-muted-foreground mt-2 text-sm">
							SLIC segmentation for stylized art and abstract representations
						</p>
					</div>
					<div class="rounded-lg border p-6">
						<h3 class="text-xl font-semibold">Stippling Effects</h3>
						<p class="text-muted-foreground mt-2 text-sm">
							Adaptive dot placement for artistic textures and vintage styles
						</p>
					</div>
				</div>
			</div>
		</section>
	</main>

	<footer class="border-t px-4 py-8 sm:px-6 lg:px-8">
		<div class="text-muted-foreground mx-auto max-w-screen-xl text-center text-sm">
			<p>© 2024 vec2art. Open source and powered by Rust + WebAssembly.</p>
		</div>
	</footer>
</div>
