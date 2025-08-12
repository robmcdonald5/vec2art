<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import { Filter, Grid, List, Search, Download, Eye } from 'lucide-svelte';
</script>

<div class="mx-auto max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold">Gallery</h1>
		<p class="text-muted-foreground mt-2">
			Browse example conversions and see what's possible with vec2art
		</p>
	</div>

	<!-- Controls -->
	<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex items-center gap-4">
			<!-- Search -->
			<div class="relative">
				<Search class="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
				<input
					type="text"
					placeholder="Search examples..."
					class="border-input bg-background placeholder:text-muted-foreground h-9 w-64 rounded-md border px-3 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
				/>
			</div>

			<!-- Filter -->
			<Button variant="outline" size="sm" class="gap-2">
				<Filter class="h-4 w-4" />
				Filter
			</Button>
		</div>

		<div class="flex items-center gap-2">
			<!-- View Toggle -->
			<div class="flex rounded-md border">
				<button class="bg-primary text-primary-foreground flex items-center px-3 py-1.5 rounded-l-md">
					<Grid class="h-4 w-4" />
				</button>
				<button class="hover:bg-muted flex items-center px-3 py-1.5 rounded-r-md">
					<List class="h-4 w-4" />
				</button>
			</div>
		</div>
	</div>

	<!-- Gallery Grid -->
	<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
		<!-- Example Items -->
		{#each Array(12) as _, i}
			<div class="group rounded-lg border overflow-hidden">
				<!-- Image Preview -->
				<div class="aspect-square bg-muted/30 relative overflow-hidden">
					<div class="absolute inset-0 flex items-center justify-center">
						<span class="text-muted-foreground text-sm">Example {i + 1}</span>
					</div>
					
					<!-- Hover Overlay -->
					<div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
						<Button size="sm" variant="secondary" class="gap-2">
							<Eye class="h-4 w-4" />
							View
						</Button>
						<Button size="sm" variant="secondary" class="gap-2">
							<Download class="h-4 w-4" />
							Download
						</Button>
					</div>
				</div>

				<!-- Details -->
				<div class="p-4">
					<h3 class="font-semibold text-sm">Example Image {i + 1}</h3>
					<p class="text-muted-foreground text-xs mt-1">
						{i % 4 === 0 ? 'Edge Detection' : i % 4 === 1 ? 'Centerline' : i % 4 === 2 ? 'Superpixel' : 'Dots'}
					</p>
					<div class="flex items-center justify-between mt-3">
						<span class="text-muted-foreground text-xs">
							{Math.floor(Math.random() * 500 + 100)}x{Math.floor(Math.random() * 500 + 100)}
						</span>
						<span class="text-muted-foreground text-xs">
							{Math.floor(Math.random() * 50 + 10)}KB
						</span>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Load More -->
	<div class="mt-12 text-center">
		<Button variant="outline" size="lg">Load More Examples</Button>
	</div>

	<!-- Categories Section -->
	<div class="mt-16 border-t pt-16">
		<h2 class="text-2xl font-bold mb-6">Browse by Category</h2>
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<div class="rounded-lg border p-6 text-center">
				<h3 class="font-semibold">Logos & Icons</h3>
				<p class="text-muted-foreground text-sm mt-2">Clean vector conversions</p>
			</div>
			<div class="rounded-lg border p-6 text-center">
				<h3 class="font-semibold">Artwork</h3>
				<p class="text-muted-foreground text-sm mt-2">Artistic line drawings</p>
			</div>
			<div class="rounded-lg border p-6 text-center">
				<h3 class="font-semibold">Photography</h3>
				<p class="text-muted-foreground text-sm mt-2">Photo to line art</p>
			</div>
			<div class="rounded-lg border p-6 text-center">
				<h3 class="font-semibold">Technical</h3>
				<p class="text-muted-foreground text-sm mt-2">Diagrams & schematics</p>
			</div>
		</div>
	</div>
</div>