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

	function downloadSVG(item: GalleryItem) {
		// Create a temporary link element to trigger download
		const link = document.createElement('a');
		link.href = item.afterImage;
		link.download = `${item.title.replace(/\s+/g, '_').toLowerCase()}.svg`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
</script>

<!-- Gallery Hero Section -->
<section class="bg-section-elevated py-12 pb-4 relative">
	<div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="mb-8 text-center">
			<h1 class="text-gradient-modern text-4xl font-bold mb-4">Gallery</h1>
			<p class="text-premium">
				Browse example conversions and see what's possible with vec2art
			</p>
		</div>

		<!-- Controls -->
		<div class="mb-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex items-center gap-4">
				<!-- Search -->
				<div class="relative">
					<Search class="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-speed-gray-400" />
					<input
						type="text"
						placeholder="Search examples..."
						class="w-full px-4 py-3 pl-12 rounded-xl border border-gray-200 focus:border-ferrari-500 focus:ring-4 focus:ring-ferrari-500/20 bg-white transition-all duration-300 text-speed-gray-900 placeholder:text-speed-gray-400"
					/>
				</div>

				<!-- Categories -->
				<select class="px-4 py-3 rounded-xl border border-gray-200 focus:border-ferrari-500 focus:ring-4 focus:ring-ferrari-500/20 bg-white transition-all duration-300 text-speed-gray-900">
					<option value="">All Categories</option>
					<option value="logos">Logos & Icons</option>
					<option value="artwork">Artwork</option>
					<option value="photography">Photography</option>
					<option value="technical">Technical</option>
				</select>

				<!-- Filter -->
				<button class="btn-ferrari-secondary flex items-center gap-2">
					<Filter class="h-4 w-4" />
					Filter
				</button>
			</div>

			<div class="flex items-center gap-2">
				<!-- View Toggle -->
				<div class="flex rounded-xl border border-gray-200 overflow-hidden">
					<button class="icon-ferrari-bg flex items-center px-4 py-3 text-white">
						<Grid class="h-4 w-4" />
					</button>
					<button class="flex items-center px-4 py-3 bg-white hover:bg-gray-50 text-speed-gray-600 transition-colors duration-300">
						<List class="h-4 w-4" />
					</button>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Main Gallery Section -->
<section class="bg-section-premium py-8">
	<div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">

		<!-- Gallery Grid -->
		<div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each galleryItems as item}
				<div class="bg-white rounded-xl border border-gray-200 overflow-hidden group transition-all duration-300 hover:shadow-lg hover:border-ferrari-300 animate-fadeInUp" style="animation-delay: {(item.id - 1) * 0.1}s">
					<!-- Before/After Slider -->
					<div class="relative aspect-square bg-gray-50">
						<BeforeAfterSlider
							beforeImage={item.beforeImage}
							afterImage={item.afterImage}
							beforeAlt={`${item.title} - Original`}
							afterAlt={`${item.title} - Converted`}
							class="h-full w-full"
						/>

						<!-- Subtle Hover Overlay (pointer-events-none to allow slider interaction) -->
						<div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

						<!-- Action Buttons -->
						<div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
							<div class="pointer-events-auto flex gap-2">
							<button
								onclick={() => openModal(item)}
								class="bg-white/90 hover:bg-white text-ferrari-600 font-medium px-3 py-2 rounded-lg text-sm flex items-center gap-1 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-105"
							>
								<Maximize2 class="h-4 w-4" />
								Expand
							</button>
							<button 
								onclick={() => downloadSVG(item)}
								class="bg-ferrari-600 hover:bg-ferrari-700 text-white font-medium px-3 py-2 rounded-lg text-sm flex items-center gap-1 shadow-lg transition-all duration-200 hover:scale-105"
							>
								<Download class="h-4 w-4" />
								Download
							</button>
							</div>
						</div>
					</div>

					<!-- Card Details -->
					<div class="p-6 space-y-3">
						<h3 class="text-gray-900 text-lg font-semibold group-hover:text-ferrari-600 transition-colors duration-300">{item.title}</h3>
						<div class="flex items-center gap-2">
							<span class="text-ferrari-600 font-medium bg-ferrari-50 px-3 py-1 rounded-full text-sm border border-ferrari-100">
								{item.algorithm}
							</span>
						</div>
						<div class="flex justify-between text-gray-600 text-sm">
							<span class="font-medium">{item.dimensions}</span>
							<span class="font-medium">{item.fileSize}</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>


<!-- Load More Section -->
<section class="bg-section-premium py-16">
	<div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
		<div class="text-center">
			<button class="btn-ferrari-primary px-8 py-4 text-lg mx-auto">
				Load More Examples
			</button>
		</div>
	</div>
</section>


<!-- Modal for expanded view -->
<Modal open={modalOpen} onClose={closeModal}>
	{#if selectedItem}
		<div class="p-8 bg-white rounded-xl">
			<div class="mb-8">
				<h2 class="text-speed-gray-900 text-3xl font-bold mb-3">{selectedItem.title}</h2>
				<div class="flex items-center gap-4">
					<span class="text-ferrari-600 font-semibold bg-ferrari-50 px-4 py-2 rounded-full text-sm border border-ferrari-100">
						{selectedItem.algorithm}
					</span>
					<span class="text-speed-gray-600 text-sm font-medium">
						{selectedItem.dimensions} • {selectedItem.fileSize}
					</span>
				</div>
			</div>

			<div class="aspect-video overflow-hidden rounded-xl bg-white shadow-lg border border-gray-100 mb-6">
				<BeforeAfterSlider
					beforeImage={selectedItem.beforeImage}
					afterImage={selectedItem.afterImage}
					beforeAlt={`${selectedItem.title} - Original`}
					afterAlt={`${selectedItem.title} - Converted`}
					class="h-full w-full"
				/>
			</div>

			<div class="flex justify-center gap-4 pb-8">
				<button 
					onclick={() => downloadSVG(selectedItem)}
					class="btn-ferrari-primary px-6 py-3 text-lg flex items-center gap-2"
				>
					<Download class="h-5 w-5" />
					Download SVG
				</button>
				<button class="btn-ferrari-secondary px-6 py-3 text-lg">View Details</button>
			</div>
		</div>
	{/if}
</Modal>
