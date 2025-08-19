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
<section class="bg-section-elevated relative py-12 pb-4">
	<div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="mb-8 text-center">
			<h1 class="text-gradient-modern mb-4 text-4xl font-bold">Gallery</h1>
			<p class="text-premium">Browse example conversions and see what's possible with vec2art</p>
		</div>

		<!-- Controls -->
		<div class="mb-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div class="flex items-center gap-4">
				<!-- Search -->
				<div class="relative">
					<Search class="text-speed-gray-400 absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2" />
					<input
						type="text"
						placeholder="Search examples..."
						class="focus:border-ferrari-500 focus:ring-ferrari-500/20 text-speed-gray-900 placeholder:text-speed-gray-400 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pl-12 transition-all duration-300 focus:ring-4"
					/>
				</div>

				<!-- Categories -->
				<select
					class="focus:border-ferrari-500 focus:ring-ferrari-500/20 text-speed-gray-900 rounded-xl border border-gray-200 bg-white px-4 py-3 transition-all duration-300 focus:ring-4"
				>
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
				<div class="flex overflow-hidden rounded-xl border border-gray-200">
					<button class="icon-ferrari-bg flex items-center px-4 py-3 text-white">
						<Grid class="h-4 w-4" />
					</button>
					<button
						class="text-speed-gray-600 flex items-center bg-white px-4 py-3 transition-colors duration-300 hover:bg-gray-50"
					>
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
				<div
					class="group hover:border-ferrari-300 animate-fadeInUp overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-300 hover:shadow-lg"
					style="animation-delay: {(item.id - 1) * 0.1}s"
				>
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
						<div
							class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
						></div>

						<!-- Action Buttons -->
						<div
							class="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 transform gap-2 opacity-0 transition-all duration-300 group-hover:opacity-100"
						>
							<div class="pointer-events-auto flex gap-2">
								<button
									onclick={() => openModal(item)}
									class="text-ferrari-600 flex items-center gap-1 rounded-lg bg-white/90 px-3 py-2 text-sm font-medium shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-white"
								>
									<Maximize2 class="h-4 w-4" />
									Expand
								</button>
								<button
									onclick={() => downloadSVG(item)}
									class="bg-ferrari-600 hover:bg-ferrari-700 flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:scale-105"
								>
									<Download class="h-4 w-4" />
									Download
								</button>
							</div>
						</div>
					</div>

					<!-- Card Details -->
					<div class="space-y-3 p-6">
						<h3
							class="group-hover:text-ferrari-600 text-lg font-semibold text-gray-900 transition-colors duration-300"
						>
							{item.title}
						</h3>
						<div class="flex items-center gap-2">
							<span
								class="text-ferrari-600 bg-ferrari-50 border-ferrari-100 rounded-full border px-3 py-1 text-sm font-medium"
							>
								{item.algorithm}
							</span>
						</div>
						<div class="flex justify-between text-sm text-gray-600">
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
			<button class="btn-ferrari-primary mx-auto px-8 py-4 text-lg"> Load More Examples </button>
		</div>
	</div>
</section>

<!-- Modal for expanded view -->
<Modal open={modalOpen} onClose={closeModal}>
	{#if selectedItem}
		<div class="rounded-xl bg-white p-8">
			<div class="mb-8">
				<h2 class="text-speed-gray-900 mb-3 text-3xl font-bold">{selectedItem.title}</h2>
				<div class="flex items-center gap-4">
					<span
						class="text-ferrari-600 bg-ferrari-50 border-ferrari-100 rounded-full border px-4 py-2 text-sm font-semibold"
					>
						{selectedItem.algorithm}
					</span>
					<span class="text-speed-gray-600 text-sm font-medium">
						{selectedItem.dimensions} • {selectedItem.fileSize}
					</span>
				</div>
			</div>

			<div
				class="mb-6 aspect-video overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg"
			>
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
					onclick={() => selectedItem && downloadSVG(selectedItem)}
					class="btn-ferrari-primary flex items-center gap-2 px-6 py-3 text-lg"
				>
					<Download class="h-5 w-5" />
					Download SVG
				</button>
				<button class="btn-ferrari-secondary px-6 py-3 text-lg">View Details</button>
			</div>
		</div>
	{/if}
</Modal>
