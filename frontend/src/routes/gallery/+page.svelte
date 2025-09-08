<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { BeforeAfterSlider } from '$lib/components/ui/before-after-slider';
	import { Modal } from '$lib/components/ui/modal';
	import { Filter, Grid, List, Search, Download, Maximize2, X } from 'lucide-svelte';
	import { loadGalleryData, filterGalleryItems, getCategories, getAlgorithmStats } from '$lib/data/gallery';
	import type { GalleryItem, GalleryFilters, AlgorithmFilter, ViewMode } from '$lib/types/gallery';

	let selectedItem = $state<GalleryItem | null>(null);
	let modalOpen = $state(false);
	let viewMode = $state<ViewMode>('grid');
	let displayedItems = $state<GalleryItem[]>([]);
	let isLoading = $state(true);
	let hasMore = $state(false);
	let showFilters = $state(false);
	
	// Gallery data
	let allItems = $state<GalleryItem[]>([]);
	let filteredItems = $state<GalleryItem[]>([]);
	let categories = $state<Array<{ value: string; label: string; count: number }>>([]);
	let algorithmStats = $state<Map<string, number>>(new Map());
	
	// Filters
	let filters = $state<GalleryFilters>({
		search: '',
		category: 'all',
		algorithm: 'all'
	});
	
	// Pagination
	const ITEMS_PER_PAGE = 12;
	let currentPage = $state(0);
	
	// Debounce timer for search
	let searchTimer: NodeJS.Timeout;

	// Apply filters with debouncing for search
	$effect(() => {
		if (filters.search !== undefined) {
			clearTimeout(searchTimer);
			searchTimer = setTimeout(() => {
				applyFilters();
			}, 300);
		} else {
			applyFilters();
		}
	});
	
	function applyFilters() {
		filteredItems = filterGalleryItems(allItems, filters);
		currentPage = 0;
		loadMoreItems();
	}
	
	function handleSearchInput(event: Event) {
		const target = event.target as HTMLInputElement;
		filters.search = target.value;
	}
	
	function handleCategoryChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		filters.category = target.value;
	}
	
	function handleAlgorithmFilter(algorithm: AlgorithmFilter) {
		filters.algorithm = algorithm;
		showFilters = false;
	}
	
	function clearFilters() {
		filters = {
			search: '',
			category: 'all',
			algorithm: 'all'
		};
	}

	function openModal(item: GalleryItem) {
		selectedItem = item;
		modalOpen = true;
	}

	function closeModal() {
		modalOpen = false;
		selectedItem = null;
	}

	function downloadSVG(item: GalleryItem) {
		// Download the original SVG file
		const link = document.createElement('a');
		link.href = item.afterSvg || item.afterImage;
		link.download = `${item.title.replace(/\s+/g, '_').toLowerCase()}.svg`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	function setViewMode(mode: ViewMode) {
		viewMode = mode;
	}

	// Load more items for pagination
	function loadMoreItems() {
		const start = currentPage * ITEMS_PER_PAGE;
		const end = start + ITEMS_PER_PAGE;
		
		if (currentPage === 0) {
			displayedItems = filteredItems.slice(0, end);
		} else {
			const newItems = filteredItems.slice(start, end);
			displayedItems = [...displayedItems, ...newItems];
		}
		
		hasMore = displayedItems.length < filteredItems.length;
		isLoading = false;
		currentPage++;
	}

	// Infinite scroll handler
	function handleScroll() {
		if (!browser || isLoading || !hasMore) return;

		const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
		const windowHeight = window.innerHeight;
		const documentHeight = document.documentElement.scrollHeight;

		// Load more when user is 300px from bottom
		if (scrollTop + windowHeight >= documentHeight - 300) {
			isLoading = true;
			setTimeout(() => loadMoreItems(), 200);
		}
	}

	// Load gallery data on mount
	onMount(async () => {
		isLoading = true;
		try {
			const manifest = await loadGalleryData();
			allItems = manifest.items;
			categories = getCategories(allItems);
			algorithmStats = getAlgorithmStats(allItems);
			applyFilters();
		} catch (error) {
			console.error('Failed to load gallery:', error);
			isLoading = false;
		}
		
		if (browser) {
			window.addEventListener('scroll', handleScroll);
		}
	});

	// Cleanup on destroy
	onDestroy(() => {
		if (browser) {
			window.removeEventListener('scroll', handleScroll);
		}
		clearTimeout(searchTimer);
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
		
		{#if filters.search || filters.category !== 'all' || filters.algorithm !== 'all'}
			<button
				onclick={clearFilters}
				class="text-ferrari-600 hover:text-ferrari-700 flex items-center gap-1 text-sm font-medium"
			>
				<X class="h-4 w-4" />
				Clear filters
			</button>
		{/if}
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
							<span class="algorithm-badge">
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
					<span class="algorithm-badge py-2">
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
