<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import { Github, ExternalLink, Zap, Code, Cpu, Layers } from 'lucide-svelte';
</script>

<div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
	<!-- Header -->
	<div class="mb-12 text-center">
		<h1 class="text-4xl font-bold">About vec2art</h1>
		<p class="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg">
			A high-performance, browser-based tool that transforms raster images into expressive line art SVGs using advanced algorithms powered by Rust and WebAssembly.
		</p>
	</div>

	<!-- Mission -->
	<section class="mb-16">
		<h2 class="text-2xl font-bold mb-6">Our Mission</h2>
		<div class="prose prose-neutral dark:prose-invert max-w-none">
			<p class="text-muted-foreground">
				vec2art bridges the gap between raster images and vector graphics by providing an intuitive, 
				fast, and powerful conversion tool that runs entirely in your browser. Our goal is to make 
				professional-quality vectorization accessible to everyone, from designers and artists to 
				developers and hobbyists.
			</p>
		</div>
	</section>

	<!-- Technology -->
	<section class="mb-16">
		<h2 class="text-2xl font-bold mb-6">Technology Stack</h2>
		<div class="grid gap-6 md:grid-cols-2">
			<div class="rounded-lg border p-6">
				<div class="flex items-center gap-3 mb-4">
					<div class="bg-orange-500/10 flex h-10 w-10 items-center justify-center rounded-lg">
						<Code class="h-6 w-6 text-orange-500" />
					</div>
					<div>
						<h3 class="font-semibold">Rust Core</h3>
						<p class="text-muted-foreground text-sm">High-performance algorithms</p>
					</div>
				</div>
				<p class="text-muted-foreground text-sm">
					Our core line tracing algorithms are written in Rust, providing memory safety, 
					zero-cost abstractions, and blazing-fast performance with SIMD optimization.
				</p>
			</div>

			<div class="rounded-lg border p-6">
				<div class="flex items-center gap-3 mb-4">
					<div class="bg-blue-500/10 flex h-10 w-10 items-center justify-center rounded-lg">
						<Cpu class="h-6 w-6 text-blue-500" />
					</div>
					<div>
						<h3 class="font-semibold">WebAssembly</h3>
						<p class="text-muted-foreground text-sm">Near-native performance</p>
					</div>
				</div>
				<p class="text-muted-foreground text-sm">
					WebAssembly compilation enables our Rust code to run at near-native speeds 
					in your browser, with processing times under 1.5 seconds for typical images.
				</p>
			</div>

			<div class="rounded-lg border p-6">
				<div class="flex items-center gap-3 mb-4">
					<div class="bg-green-500/10 flex h-10 w-10 items-center justify-center rounded-lg">
						<Zap class="h-6 w-6 text-green-500" />
					</div>
					<div>
						<h3 class="font-semibold">SvelteKit</h3>
						<p class="text-muted-foreground text-sm">Modern web framework</p>
					</div>
				</div>
				<p class="text-muted-foreground text-sm">
					Our user interface is built with SvelteKit 5, providing a reactive, 
					performant, and accessible frontend with TypeScript and Tailwind CSS.
				</p>
			</div>

			<div class="rounded-lg border p-6">
				<div class="flex items-center gap-3 mb-4">
					<div class="bg-purple-500/10 flex h-10 w-10 items-center justify-center rounded-lg">
						<Layers class="h-6 w-6 text-purple-500" />
					</div>
					<div>
						<h3 class="font-semibold">Multiple Algorithms</h3>
						<p class="text-muted-foreground text-sm">Diverse tracing approaches</p>
					</div>
				</div>
				<p class="text-muted-foreground text-sm">
					Four specialized algorithms (Edge, Centerline, Superpixel, Dots) provide 
					optimal results for different image types and artistic styles.
				</p>
			</div>
		</div>
	</section>

	<!-- Algorithms -->
	<section class="mb-16">
		<h2 class="text-2xl font-bold mb-6">Vectorization Algorithms</h2>
		<div class="space-y-6">
			<div class="rounded-lg border p-6">
				<h3 class="font-semibold text-lg mb-2">Edge Detection</h3>
				<p class="text-muted-foreground mb-3">
					Uses Canny edge detection with adaptive thresholds for detailed line art. 
					Perfect for drawings, sketches, and complex imagery requiring precise edge capture.
				</p>
				<div class="flex flex-wrap gap-2">
					<span class="bg-primary/10 text-primary px-2 py-1 rounded text-xs">Multi-pass processing</span>
					<span class="bg-primary/10 text-primary px-2 py-1 rounded text-xs">Hand-drawn aesthetics</span>
					<span class="bg-primary/10 text-primary px-2 py-1 rounded text-xs">Variable weights</span>
				</div>
			</div>

			<div class="rounded-lg border p-6">
				<h3 class="font-semibold text-lg mb-2">Centerline Tracing</h3>
				<p class="text-muted-foreground mb-3">
					Zhang-Suen thinning algorithm for skeleton extraction. Ideal for bold shapes, 
					logos, text, and geometric designs requiring precise centerline representation.
				</p>
				<div class="flex flex-wrap gap-2">
					<span class="bg-primary/10 text-primary px-2 py-1 rounded text-xs">Morphological processing</span>
					<span class="bg-primary/10 text-primary px-2 py-1 rounded text-xs">Contour-based</span>
					<span class="bg-primary/10 text-primary px-2 py-1 rounded text-xs">Geometric precision</span>
				</div>
			</div>

			<div class="rounded-lg border p-6">
				<h3 class="font-semibold text-lg mb-2">Superpixel Regions</h3>
				<p class="text-muted-foreground mb-3">
					SLIC segmentation for stylized art and abstract representations. Creates 
					polygonal line art based on color and texture regions.
				</p>
				<div class="flex flex-wrap gap-2">
					<span class="bg-primary/10 text-primary px-2 py-1 rounded text-xs">Region-based</span>
					<span class="bg-primary/10 text-primary px-2 py-1 rounded text-xs">Adaptive clustering</span>
					<span class="bg-primary/10 text-primary px-2 py-1 rounded text-xs">Modern art styles</span>
				</div>
			</div>

			<div class="rounded-lg border p-6">
				<h3 class="font-semibold text-lg mb-2">Stippling Effects</h3>
				<p class="text-muted-foreground mb-3">
					Adaptive dot placement for artistic textures and vintage styles. Creates 
					stippling patterns with variable dot sizes and intelligent spacing.
				</p>
				<div class="flex flex-wrap gap-2">
					<span class="bg-primary/10 text-primary px-2 py-1 rounded text-xs">Content-aware</span>
					<span class="bg-primary/10 text-primary px-2 py-1 rounded text-xs">Color preservation</span>
					<span class="bg-primary/10 text-primary px-2 py-1 rounded text-xs">Artistic effects</span>
				</div>
			</div>
		</div>
	</section>

	<!-- Open Source -->
	<section class="mb-16">
		<h2 class="text-2xl font-bold mb-6">Open Source</h2>
		<div class="rounded-lg border p-8 text-center">
			<Github class="mx-auto h-12 w-12 mb-4" />
			<h3 class="text-xl font-semibold mb-2">Built in the Open</h3>
			<p class="text-muted-foreground mb-6 max-w-2xl mx-auto">
				vec2art is completely open source and available on GitHub. We believe in 
				transparent development and welcome contributions from the community.
			</p>
			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<Button class="gap-2">
					<Github class="h-4 w-4" />
					View Source Code
				</Button>
				<Button variant="outline" class="gap-2">
					<ExternalLink class="h-4 w-4" />
					Documentation
				</Button>
			</div>
		</div>
	</section>

	<!-- Performance -->
	<section class="mb-16">
		<h2 class="text-2xl font-bold mb-6">Performance Metrics</h2>
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
		<h2 class="text-2xl font-bold mb-6">Get in Touch</h2>
		<div class="rounded-lg border p-6">
			<p class="text-muted-foreground mb-4">
				Have questions, suggestions, or want to contribute? We'd love to hear from you!
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