<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { BeforeAfterSlider } from '$lib/components/ui/before-after-slider';
	import { Modal } from '$lib/components/ui/modal';
	import { Filter, Grid, List, Search, Download, Maximize2 } from 'lucide-svelte';

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
	let viewMode = $state<'grid' | 'list'>('grid');
	let displayedItems = $state<GalleryItem[]>([]);
	let isLoading = $state(false);
	let hasMore = $state(true);

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

	function setViewMode(mode: 'grid' | 'list') {
		viewMode = mode;
	}

	// Generate more sample items by duplicating and incrementing IDs
	function generateMoreItems(startId: number, count: number): GalleryItem[] {
		const baseItems = [...galleryItems];
		const newItems: GalleryItem[] = [];

		for (let i = 0; i < count; i++) {
			const baseItem = baseItems[i % baseItems.length];
			newItems.push({
				...baseItem,
				id: startId + i,
				title: `${baseItem.title} ${Math.floor((startId + i - 1) / baseItems.length) + 1}`
			});
		}

		return newItems;
	}

	// Load initial items (2 rows of 4 = 8 items)
	function loadInitialItems() {
		displayedItems = [...galleryItems];
	}

	// Load more items when scrolling
	function loadMoreItems() {
		if (isLoading || !hasMore) return;

		isLoading = true;

		// Simulate loading delay
		setTimeout(() => {
			const currentCount = displayedItems.length;
			const newItems = generateMoreItems(currentCount + 1, 8); // Load 8 more items
			displayedItems = [...displayedItems, ...newItems];

			// For demo purposes, stop loading after 5 batches (40 items total)
			if (displayedItems.length >= 40) {
				hasMore = false;
			}

			isLoading = false;
		}, 500);
	}

	// Infinite scroll handler
	function handleScroll() {
		if (!browser || isLoading || !hasMore) return;

		const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
		const windowHeight = window.innerHeight;
		const documentHeight = document.documentElement.scrollHeight;

		// Load more when user is 300px from bottom
		if (scrollTop + windowHeight >= documentHeight - 300) {
			loadMoreItems();
		}
	}

	// Setup infinite scroll on mount
	onMount(() => {
		loadInitialItems();
		if (browser) {
			window.addEventListener('scroll', handleScroll);
		}
	});

	// Cleanup on destroy
	onDestroy(() => {
		if (browser) {
			window.removeEventListener('scroll', handleScroll);
		}
	});
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
						class="focus:border-ferrari-500 focus:ring-ferrari-500/30 text-speed-gray-900 placeholder:text-speed-gray-400 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pl-12 transition-all duration-200 focus:ring-1 focus:outline-none"
					/>
				</div>

				<!-- Categories -->
				<select
					class="focus:border-ferrari-500 focus:ring-ferrari-500/30 text-speed-gray-900 rounded-xl border border-gray-200 bg-white px-4 py-3 transition-all duration-200 focus:ring-1 focus:outline-none"
				>
					<option value="">All Categories</option>
					<option value="logos">Logos & Icons</option>
					<option value="artwork">Artwork</option>
					<option value="photography">Photography</option>
					<option value="technical">Technical</option>
				</select>

				<!-- Filter -->
				<button class="btn-ferrari-secondary flex items-center gap-2 px-6 py-3">
					<Filter class="h-4 w-4" />
					Filter
				</button>
			</div>

			<div class="flex items-center gap-2">
				<!-- View Toggle -->
				<div class="flex overflow-hidden rounded-xl border border-gray-200">
					<button
						class="flex items-center px-4 py-3 transition-all duration-200 {viewMode === 'grid'
							? 'icon-ferrari-bg text-white'
							: 'text-speed-gray-600 bg-white hover:bg-gray-50'}"
						onclick={() => setViewMode('grid')}
						aria-label="Grid view"
					>
						<Grid class="h-4 w-4" />
					</button>
					<button
						class="flex items-center px-4 py-3 transition-all duration-200 {viewMode === 'list'
							? 'icon-ferrari-bg text-white'
							: 'text-speed-gray-600 bg-white hover:bg-gray-50'}"
						onclick={() => setViewMode('list')}
						aria-label="List view"
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
		<div
			class={viewMode === 'grid'
				? 'grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
				: 'space-y-6'}
		>
			{#each displayedItems || [] as item (item.id)}
				<div
					class="group hover:border-ferrari-300 animate-fadeInUp overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-300 hover:shadow-lg {viewMode ===
					'list'
						? 'flex flex-row'
						: ''}"
					style="animation-delay: {Math.max(0, (item.id - 1) * 0.1)}s"
				>
					<!-- Before/After Slider -->
					<div
						class="relative bg-gray-50 {viewMode === 'grid'
							? 'aspect-square'
							: 'h-48 w-72 flex-shrink-0'}"
					>
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
					<div
						class="space-y-3 p-6 {viewMode === 'list' ? 'flex flex-1 flex-col justify-center' : ''}"
					>
						<h3
							class="group-hover:text-ferrari-600 text-lg font-semibold text-gray-900 transition-colors duration-300"
						>
							{item.title}
						</h3>
						<div class="flex items-center gap-2">
							<span
								class="rounded-full px-4 py-1.5 text-sm font-semibold text-white shadow-md"
								style="background: linear-gradient(135deg, #ff6b6b 0%, #dc143c 50%, #b91c2e 100%); box-shadow: 0 4px 15px -3px rgba(220, 20, 60, 0.3);"
							>
								{item.algorithm}
							</span>
						</div>
						<div
							class="flex {viewMode === 'list'
								? 'flex-col gap-1'
								: 'justify-between'} text-sm text-gray-600"
						>
							<span class="font-medium">{item.dimensions}</span>
							<span class="font-medium">{item.fileSize}</span>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Loading Indicator -->
		{#if isLoading && displayedItems.length > 0}
			<div class="mt-12 flex justify-center">
				<div class="flex items-center gap-3">
					<div class="spinner-gradient h-8 w-8"></div>
					<span class="text-lg text-gray-600">Loading more examples...</span>
				</div>
			</div>
		{/if}

		<!-- End of Results Message -->
		{#if !hasMore && displayedItems.length > 0}
			<div class="mt-12 text-center">
				<p class="text-lg text-gray-600">You've reached the end of the gallery!</p>
				<p class="mt-2 text-sm text-gray-500">Showing {displayedItems.length} examples</p>
			</div>
		{/if}
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
						class="rounded-full px-4 py-2 text-sm font-semibold text-white shadow-md"
						style="background: linear-gradient(135deg, #ff6b6b 0%, #dc143c 50%, #b91c2e 100%); box-shadow: 0 4px 15px -3px rgba(220, 20, 60, 0.3);"
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
