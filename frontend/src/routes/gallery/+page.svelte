<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { BeforeAfterSlider } from '$lib/components/ui/before-after-slider';
	import { Modal } from '$lib/components/ui/modal';
	import { Filter, Grid, List, Search, Download, Eye, Maximize2 } from 'lucide-svelte';

	interface GalleryItem {
		id: number;
		title: string;
		algorithm: string;
		beforeImage: string;
		afterImage: string;
		dimensions: string;
		fileSize: string;
		category: string;
	}

	let selectedItem = $state<GalleryItem | null>(null);
	let modalOpen = $state(false);

	// Sample gallery data with the stock images
	const galleryItems: GalleryItem[] = [
		{
			id: 1,
			title: 'Sample Logo Conversion',
			algorithm: 'Edge Detection',
			beforeImage: '/gallery-stock-before.png',
			afterImage: '/gallery-stock-after.svg',
			dimensions: '800x600',
			fileSize: '45KB',
			category: 'logos'
		},
		{
			id: 2,
			title: 'Artistic Portrait',
			algorithm: 'Centerline',
			beforeImage: '/gallery-stock-before.png',
			afterImage: '/gallery-stock-after.svg',
			dimensions: '1024x768',
			fileSize: '38KB',
			category: 'artwork'
		},
		{
			id: 3,
			title: 'Technical Diagram',
			algorithm: 'Superpixel',
			beforeImage: '/gallery-stock-before.png',
			afterImage: '/gallery-stock-after.svg',
			dimensions: '1200x900',
			fileSize: '52KB',
			category: 'technical'
		},
		{
			id: 4,
			title: 'Nature Scene',
			algorithm: 'Dots',
			beforeImage: '/gallery-stock-before.png',
			afterImage: '/gallery-stock-after.svg',
			dimensions: '1920x1080',
			fileSize: '67KB',
			category: 'photography'
		},
		{
			id: 5,
			title: 'Brand Icon',
			algorithm: 'Edge Detection',
			beforeImage: '/gallery-stock-before.png',
			afterImage: '/gallery-stock-after.svg',
			dimensions: '512x512',
			fileSize: '28KB',
			category: 'logos'
		},
		{
			id: 6,
			title: 'Abstract Art',
			algorithm: 'Centerline',
			beforeImage: '/gallery-stock-before.png',
			afterImage: '/gallery-stock-after.svg',
			dimensions: '800x800',
			fileSize: '41KB',
			category: 'artwork'
		},
		{
			id: 7,
			title: 'Architecture',
			algorithm: 'Superpixel',
			beforeImage: '/gallery-stock-before.png',
			afterImage: '/gallery-stock-after.svg',
			dimensions: '1600x1200',
			fileSize: '59KB',
			category: 'photography'
		},
		{
			id: 8,
			title: 'Circuit Board',
			algorithm: 'Edge Detection',
			beforeImage: '/gallery-stock-before.png',
			afterImage: '/gallery-stock-after.svg',
			dimensions: '2048x1536',
			fileSize: '73KB',
			category: 'technical'
		}
	];

	function openModal(item: GalleryItem) {
		selectedItem = item;
		modalOpen = true;
	}

	function closeModal() {
		modalOpen = false;
		selectedItem = null;
	}
</script>

<div class="mx-auto max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8">
	<!-- Header -->
	<div class="mb-8">
		<h1
			class="bg-gradient-to-r from-orange-800 to-red-700 bg-clip-text text-3xl font-bold text-transparent dark:from-purple-400 dark:to-blue-400"
		>
			Gallery
		</h1>
		<p class="text-muted-foreground mt-2">
			Browse example conversions and see what's possible with vec2art
		</p>
	</div>

	<!-- Controls -->
	<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex items-center gap-4">
			<!-- Search -->
			<div class="relative">
				<Search class="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
				<input
					type="text"
					placeholder="Search examples..."
					class="border-input bg-background placeholder:text-muted-foreground h-9 w-64 rounded-md border px-3 pl-9 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
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
				<button class="flex items-center rounded-l-md bg-orange-600 px-3 py-1.5 text-white">
					<Grid class="h-4 w-4" />
				</button>
				<button class="hover:bg-muted flex items-center rounded-r-md px-3 py-1.5">
					<List class="h-4 w-4" />
				</button>
			</div>
		</div>
	</div>

	<!-- Gallery Grid -->
	<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
		{#each galleryItems as item}
			<div
				class="group relative overflow-hidden rounded-xl border-2 border-gray-300 bg-white transition-all duration-300 hover:shadow-xl dark:border-gray-600 dark:bg-gray-900"
			>
				<!-- Before/After Slider -->
				<div class="relative aspect-square bg-white">
					<BeforeAfterSlider
						beforeImage={item.beforeImage}
						afterImage={item.afterImage}
						beforeAlt={`${item.title} - Original`}
						afterAlt={`${item.title} - Converted`}
						class="h-full w-full"
					/>

					<!-- Hover Overlay -->
					<div
						class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100"
					></div>

					<!-- Action Buttons -->
					<div
						class="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 opacity-0 transition-opacity group-hover:opacity-100"
					>
						<button
							onclick={() => openModal(item)}
							class="flex items-center gap-2 rounded-lg bg-gray-900/90 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-gray-900"
						>
							<Maximize2 class="h-4 w-4" />
							Expand
						</button>
						<button
							class="flex items-center gap-2 rounded-lg bg-gray-900/90 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-gray-900"
						>
							<Download class="h-4 w-4" />
							Download
						</button>
					</div>
				</div>

				<!-- Details -->
				<div class="p-4">
					<h3 class="text-sm font-semibold">{item.title}</h3>
					<div class="mt-2">
						<span
							class="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
						>
							{item.algorithm}
						</span>
					</div>
					<div class="mt-2 flex items-center justify-between">
						<span class="text-muted-foreground text-xs">
							{item.dimensions}
						</span>
						<span class="text-muted-foreground text-xs">
							{item.fileSize}
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
		<h2
			class="mb-6 bg-gradient-to-r from-orange-800 to-red-700 bg-clip-text text-2xl font-bold text-transparent dark:from-purple-400 dark:to-blue-400"
		>
			Browse by Category
		</h2>
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<div
				class="cursor-pointer rounded-lg border border-gray-200 p-6 text-center transition-shadow hover:shadow-lg dark:border-gray-700"
			>
				<h3 class="font-semibold">Logos & Icons</h3>
				<p class="text-muted-foreground mt-2 text-sm">Clean vector conversions</p>
			</div>
			<div
				class="cursor-pointer rounded-lg border border-gray-200 p-6 text-center transition-shadow hover:shadow-lg dark:border-gray-700"
			>
				<h3 class="font-semibold">Artwork</h3>
				<p class="text-muted-foreground mt-2 text-sm">Artistic line drawings</p>
			</div>
			<div
				class="cursor-pointer rounded-lg border border-gray-200 p-6 text-center transition-shadow hover:shadow-lg dark:border-gray-700"
			>
				<h3 class="font-semibold">Photography</h3>
				<p class="text-muted-foreground mt-2 text-sm">Photo to line art</p>
			</div>
			<div
				class="cursor-pointer rounded-lg border border-gray-200 p-6 text-center transition-shadow hover:shadow-lg dark:border-gray-700"
			>
				<h3 class="font-semibold">Technical</h3>
				<p class="text-muted-foreground mt-2 text-sm">Diagrams & schematics</p>
			</div>
		</div>
	</div>
</div>

<!-- Modal for expanded view -->
<Modal open={modalOpen} onClose={closeModal}>
	{#if selectedItem}
		<div class="p-8">
			<div class="mb-6">
				<h2 class="text-2xl font-bold">{selectedItem.title}</h2>
				<div class="mt-2 flex items-center gap-4">
					<span
						class="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
					>
						{selectedItem.algorithm}
					</span>
					<span class="text-muted-foreground text-sm">
						{selectedItem.dimensions} • {selectedItem.fileSize}
					</span>
				</div>
			</div>

			<div class="aspect-video overflow-hidden rounded-lg bg-white shadow-inner">
				<BeforeAfterSlider
					beforeImage={selectedItem.beforeImage}
					afterImage={selectedItem.afterImage}
					beforeAlt={`${selectedItem.title} - Original`}
					afterAlt={`${selectedItem.title} - Converted`}
					class="h-full w-full"
				/>
			</div>

			<div class="mt-6 flex justify-center gap-4">
				<Button size="lg" class="gap-2">
					<Download class="h-5 w-5" />
					Download SVG
				</Button>
				<Button variant="outline" size="lg">View Details</Button>
			</div>
		</div>
	{/if}
</Modal>
