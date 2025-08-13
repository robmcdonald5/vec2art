<script lang="ts">
	import Button from '$lib/components/ui/button.svelte';
	import BeforeAfterSlider from '$lib/components/ui/before-after-slider.svelte';
	import Modal from '$lib/components/ui/modal.svelte';
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
		<h1 class="text-3xl font-bold bg-gradient-to-r from-orange-800 to-red-700 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
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
				<Search class="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
				<input
					type="text"
					placeholder="Search examples..."
					class="border-input bg-background placeholder:text-muted-foreground h-9 w-64 rounded-md border px-3 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
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
				<button class="bg-orange-600 text-white flex items-center px-3 py-1.5 rounded-l-md">
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
		{#each galleryItems as item}
			<div class="group relative rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900 hover:shadow-xl transition-all duration-300">
				<!-- Before/After Slider -->
				<div class="aspect-square relative">
					<BeforeAfterSlider
						beforeImage={item.beforeImage}
						afterImage={item.afterImage}
						beforeAlt={`${item.title} - Original`}
						afterAlt={`${item.title} - Converted`}
						class="w-full h-full"
					/>
					
					<!-- Hover Overlay -->
					<div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
					
					<!-- Action Buttons -->
					<div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
						<button
							onclick={() => openModal(item)}
							class="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-white transition-colors"
						>
							<Maximize2 class="h-4 w-4" />
							Expand
						</button>
						<button
							class="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-white transition-colors"
						>
							<Download class="h-4 w-4" />
							Download
						</button>
					</div>
				</div>

				<!-- Details -->
				<div class="p-4">
					<h3 class="font-semibold text-sm">{item.title}</h3>
					<div class="flex items-center justify-between mt-2">
						<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
							{item.algorithm}
						</span>
						<span class="text-muted-foreground text-xs">
							{item.fileSize}
						</span>
					</div>
					<div class="text-muted-foreground text-xs mt-2">
						{item.dimensions}
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
		<h2 class="text-2xl font-bold mb-6 bg-gradient-to-r from-orange-800 to-red-700 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
			Browse by Category
		</h2>
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<div class="rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
				<h3 class="font-semibold">Logos & Icons</h3>
				<p class="text-muted-foreground text-sm mt-2">Clean vector conversions</p>
			</div>
			<div class="rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
				<h3 class="font-semibold">Artwork</h3>
				<p class="text-muted-foreground text-sm mt-2">Artistic line drawings</p>
			</div>
			<div class="rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
				<h3 class="font-semibold">Photography</h3>
				<p class="text-muted-foreground text-sm mt-2">Photo to line art</p>
			</div>
			<div class="rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
				<h3 class="font-semibold">Technical</h3>
				<p class="text-muted-foreground text-sm mt-2">Diagrams & schematics</p>
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
				<div class="flex items-center gap-4 mt-2">
					<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
						{selectedItem.algorithm}
					</span>
					<span class="text-muted-foreground text-sm">
						{selectedItem.dimensions} • {selectedItem.fileSize}
					</span>
				</div>
			</div>
			
			<div class="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
				<BeforeAfterSlider
					beforeImage={selectedItem.beforeImage}
					afterImage={selectedItem.afterImage}
					beforeAlt={`${selectedItem.title} - Original`}
					afterAlt={`${selectedItem.title} - Converted`}
					class="w-full h-full"
				/>
			</div>
			
			<div class="mt-6 flex gap-4 justify-center">
				<Button size="lg" class="gap-2">
					<Download class="h-5 w-5" />
					Download SVG
				</Button>
				<Button variant="outline" size="lg">
					View Details
				</Button>
			</div>
		</div>
	{/if}
</Modal>