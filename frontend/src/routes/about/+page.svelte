<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Github, ExternalLink, Zap, Code, Cpu, Layers } from 'lucide-svelte';
</script>

<div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
	<!-- Header -->
	<div class="mb-12 text-center">
		<h1
			class="bg-gradient-to-r from-orange-800 to-red-700 bg-clip-text text-4xl font-bold text-transparent dark:from-purple-400 dark:to-blue-400"
		>
			About vec2art
		</h1>
		<p class="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
			A high-performance, browser-based tool that transforms raster images into expressive line art
			SVGs using advanced algorithms powered by Rust and WASM.
		</p>
	</div>

	<!-- Algorithms -->
	<section class="mb-16">
		<div class="space-y-6">
			<div class="rounded-lg border p-6">
				<h3 class="mb-2 text-lg font-semibold">Edge Detection</h3>
				<p class="text-muted-foreground mb-3">
					Uses Canny edge detection with adaptive thresholds for detailed line art. Perfect for
					drawings, sketches, and complex imagery requiring precise edge capture.
				</p>
				<div class="flex flex-wrap gap-2">
					<span class="bg-primary/10 rounded py-1 pr-2 pl-0 text-xs text-orange-600"
						>Multi-pass processing</span
					>
					<span class="bg-primary/10 rounded px-2 py-1 text-xs text-orange-600"
						>Hand-drawn aesthetics</span
					>
					<span class="bg-primary/10 rounded px-2 py-1 text-xs text-orange-600"
						>Variable weights</span
					>
				</div>
			</div>

			<div class="rounded-lg border p-6">
				<h3 class="mb-2 text-lg font-semibold">Centerline Tracing</h3>
				<p class="text-muted-foreground mb-3">
					Zhang-Suen thinning algorithm for skeleton extraction. Ideal for bold shapes, logos, text,
					and geometric designs requiring precise centerline representation.
				</p>
				<div class="flex flex-wrap gap-2">
					<span class="bg-primary/10 rounded py-1 pr-2 pl-0 text-xs text-orange-600"
						>Morphological processing</span
					>
					<span class="bg-primary/10 rounded px-2 py-1 text-xs text-orange-600">Contour-based</span>
					<span class="bg-primary/10 rounded px-2 py-1 text-xs text-orange-600"
						>Geometric precision</span
					>
				</div>
			</div>

			<div class="rounded-lg border p-6">
				<h3 class="mb-2 text-lg font-semibold">Superpixel Regions</h3>
				<p class="text-muted-foreground mb-3">
					SLIC segmentation for stylized art and abstract representations. Creates polygonal line
					art based on color and texture regions.
				</p>
				<div class="flex flex-wrap gap-2">
					<span class="bg-primary/10 rounded py-1 pr-2 pl-0 text-xs text-orange-600"
						>Region-based</span
					>
					<span class="bg-primary/10 rounded px-2 py-1 text-xs text-orange-600"
						>Adaptive clustering</span
					>
					<span class="bg-primary/10 rounded px-2 py-1 text-xs text-orange-600"
						>Modern art styles</span
					>
				</div>
			</div>

			<div class="rounded-lg border p-6">
				<h3 class="mb-2 text-lg font-semibold">Stippling Effects</h3>
				<p class="text-muted-foreground mb-3">
					Adaptive dot placement for artistic textures and vintage styles. Creates stippling
					patterns with variable dot sizes and intelligent spacing.
				</p>
				<div class="flex flex-wrap gap-2">
					<span class="bg-primary/10 rounded py-1 pr-2 pl-0 text-xs text-orange-600"
						>Content-aware</span
					>
					<span class="bg-primary/10 rounded px-2 py-1 text-xs text-orange-600"
						>Color preservation</span
					>
					<span class="bg-primary/10 rounded px-2 py-1 text-xs text-orange-600"
						>Artistic effects</span
					>
				</div>
			</div>
		</div>
	</section>

	<!-- Performance -->
	<section class="mb-16">
		<h2
			class="mb-6 bg-gradient-to-r from-orange-800 to-red-700 bg-clip-text text-2xl font-bold text-transparent dark:from-purple-400 dark:to-blue-400"
		>
			Performance Metrics
		</h2>
		<div class="grid gap-6 sm:grid-cols-3">
			<div class="text-center">
				<div class="text-primary text-3xl font-bold">&lt; 1.5s</div>
				<p class="text-muted-foreground mt-1 text-sm">Processing Time</p>
			</div>
			<div class="text-center">
				<div class="text-primary text-3xl font-bold">100%</div>
				<p class="text-muted-foreground mt-1 text-sm">Client-Side</p>
			</div>
			<div class="text-center">
				<div class="text-primary text-3xl font-bold">4</div>
				<p class="text-muted-foreground mt-1 text-sm">Algorithms</p>
			</div>
		</div>
	</section>

	<!-- Contact -->
	<section>
		<h2
			class="mb-6 bg-gradient-to-r from-orange-800 to-red-700 bg-clip-text text-2xl font-bold text-transparent dark:from-purple-400 dark:to-blue-400"
		>
			Get in Touch
		</h2>
		<div class="rounded-lg border p-6">
			<p class="text-muted-foreground mb-4">
				Have a question, suggestion, or problem with the site?
			</p>
			<div class="flex flex-col gap-4 sm:flex-row">
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
