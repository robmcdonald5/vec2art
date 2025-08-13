<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import { Github, ExternalLink, Zap, Code, Cpu, Layers } from 'lucide-svelte';
</script>

<div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
	<!-- Header -->
	<div class="mb-12 text-center">
		<h1 class="text-4xl font-bold bg-gradient-to-r from-orange-800 to-red-700 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">About vec2art</h1>
		<p class="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
			A high-performance, browser-based tool that transforms raster images into expressive line art SVGs using advanced algorithms powered by Rust and WASM.
		</p>
	</div>

	<!-- Algorithms -->
	<section class="mb-16">
		<div class="space-y-6">
			<div class="rounded-lg border p-6">
				<h3 class="font-semibold text-lg mb-2">Edge Detection</h3>
				<p class="text-muted-foreground mb-3">
					Uses Canny edge detection with adaptive thresholds for detailed line art. 
					Perfect for drawings, sketches, and complex imagery requiring precise edge capture.
				</p>
				<div class="flex flex-wrap gap-2">
					<span class="bg-primary/10 text-orange-600 pl-0 pr-2 py-1 rounded text-xs">Multi-pass processing</span>
					<span class="bg-primary/10 text-orange-600 px-2 py-1 rounded text-xs">Hand-drawn aesthetics</span>
					<span class="bg-primary/10 text-orange-600 px-2 py-1 rounded text-xs">Variable weights</span>
				</div>
			</div>

			<div class="rounded-lg border p-6">
				<h3 class="font-semibold text-lg mb-2">Centerline Tracing</h3>
				<p class="text-muted-foreground mb-3">
					Zhang-Suen thinning algorithm for skeleton extraction. Ideal for bold shapes, 
					logos, text, and geometric designs requiring precise centerline representation.
				</p>
				<div class="flex flex-wrap gap-2">
					<span class="bg-primary/10 text-orange-600 pl-0 pr-2 py-1 rounded text-xs">Morphological processing</span>
					<span class="bg-primary/10 text-orange-600 px-2 py-1 rounded text-xs">Contour-based</span>
					<span class="bg-primary/10 text-orange-600 px-2 py-1 rounded text-xs">Geometric precision</span>
				</div>
			</div>

			<div class="rounded-lg border p-6">
				<h3 class="font-semibold text-lg mb-2">Superpixel Regions</h3>
				<p class="text-muted-foreground mb-3">
					SLIC segmentation for stylized art and abstract representations. Creates 
					polygonal line art based on color and texture regions.
				</p>
				<div class="flex flex-wrap gap-2">
					<span class="bg-primary/10 text-orange-600 pl-0 pr-2 py-1 rounded text-xs">Region-based</span>
					<span class="bg-primary/10 text-orange-600 px-2 py-1 rounded text-xs">Adaptive clustering</span>
					<span class="bg-primary/10 text-orange-600 px-2 py-1 rounded text-xs">Modern art styles</span>
				</div>
			</div>

			<div class="rounded-lg border p-6">
				<h3 class="font-semibold text-lg mb-2">Stippling Effects</h3>
				<p class="text-muted-foreground mb-3">
					Adaptive dot placement for artistic textures and vintage styles. Creates 
					stippling patterns with variable dot sizes and intelligent spacing.
				</p>
				<div class="flex flex-wrap gap-2">
					<span class="bg-primary/10 text-orange-600 pl-0 pr-2 py-1 rounded text-xs">Content-aware</span>
					<span class="bg-primary/10 text-orange-600 px-2 py-1 rounded text-xs">Color preservation</span>
					<span class="bg-primary/10 text-orange-600 px-2 py-1 rounded text-xs">Artistic effects</span>
				</div>
			</div>
		</div>
	</section>

	<!-- Performance -->
	<section class="mb-16">
		<h2 class="text-2xl font-bold mb-6 bg-gradient-to-r from-orange-800 to-red-700 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">Performance Metrics</h2>
		<div class="grid gap-6 sm:grid-cols-3">
			<div class="text-center">
				<div class="text-3xl font-bold text-primary">&lt; 1.5s</div>
				<p class="text-muted-foreground text-sm mt-1">Processing Time</p>
			</div>
			<div class="text-center">
				<div class="text-3xl font-bold text-primary">100%</div>
				<p class="text-muted-foreground text-sm mt-1">Client-Side</p>
			</div>
			<div class="text-center">
				<div class="text-3xl font-bold text-primary">4</div>
				<p class="text-muted-foreground text-sm mt-1">Algorithms</p>
			</div>
		</div>
	</section>

	<!-- Contact -->
	<section>
		<h2 class="text-2xl font-bold mb-6 bg-gradient-to-r from-orange-800 to-red-700 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">Get in Touch</h2>
		<div class="rounded-lg border p-6">
			<p class="text-muted-foreground mb-4">
				Have a question, suggestion, or problem with the site?
			</p>
			<div class="flex flex-col sm:flex-row gap-4">
				<Button variant="outline" class="gap-2">
					<Github class="h-4 w-4" />
					Report an Issue
				</Button>
				<Button variant="outline" class="gap-2">
					<ExternalLink class="h-4 w-4" />
					Join Discussions
				</Button>
			</div>
		</div>
	</section>
</div>