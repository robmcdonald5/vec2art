<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { BeforeAfterSlider } from '$lib/components/ui/before-after-slider';
	import { Modal } from '$lib/components/ui/modal';
	import { Filter, Grid, List, Search, Download, Maximize2, X } from 'lucide-svelte';
	import {
		loadGalleryData,
		filterGalleryItems,
		getCategories,
		getAlgorithmStats
	} from '$lib/data/gallery';
	import type { GalleryItem, GalleryFilters, AlgorithmFilter, ViewMode } from '$lib/types/gallery';

	let selectedItem = $state<GalleryItem | null>(null);
	let modalOpen = $state(false);
	let viewMode = $state<ViewMode>('grid');
	let displayedItems = $state<GalleryItem[]>([]);
	let isLoading = $state(true);
	let isLoadingMore = $state(false);
	let hasMore = $state(false);

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

	// Pagination - Reduced initial load for better performance
	const INITIAL_ITEMS = 6; // Load fewer items initially for faster perceived load
	const ITEMS_PER_PAGE = 12;
	let currentPage = $state(0);

	// Debounce timer for search
	let searchTimer: NodeJS.Timeout;

	// Progressive enhancement - preload tracking
	let preloadedImages = $state(new Set<string>());

	// Preload images for better UX
	function preloadImage(src: string) {
		if (preloadedImages.has(src)) return;

		const img = new Image();
		img.src = src;
		preloadedImages.add(src);
	}

	function handleItemHover(item: GalleryItem) {
		// Preload both before and after images on hover for instant modal viewing
		preloadImage(item.beforeImage);
		preloadImage(item.afterImage);
	}

	// Service worker caching for viewed items
	async function cacheViewedItems() {
		if (!browser || !navigator.serviceWorker.controller) return;

		try {
			const channel = new MessageChannel();
			navigator.serviceWorker.controller.postMessage(
				{ action: 'cacheGalleryItems', items: displayedItems },
				[channel.port2]
			);

			// Listen for response (optional)
			channel.port1.onmessage = (event) => {
				console.log('[Gallery] Service Worker:', event.data);
			};
		} catch (error) {
			console.log('[Gallery] Service Worker caching failed:', error);
		}
	}

	// Apply filters reactively - debounce search, immediate for others
	let previousSearch = '';
	let previousCategory = '';
	let previousAlgorithm = '';

	$effect(() => {
		const { search, category, algorithm } = filters;

		// Check what changed
		const searchChanged = search !== previousSearch;
		const categoryChanged = category !== previousCategory;
		const algorithmChanged = algorithm !== previousAlgorithm;

		// Update previous values
		previousSearch = search;
		previousCategory = category;
		previousAlgorithm = algorithm;

		clearTimeout(searchTimer);

		if (searchChanged) {
			// Debounce search changes
			searchTimer = setTimeout(() => {
				applyFilters();
			}, 300);
		} else if (categoryChanged || algorithmChanged) {
			// Apply category/algorithm changes immediately
			applyFilters();
		}
	});

	function applyFilters() {
		isLoading = true;
		filteredItems = filterGalleryItems(allItems, filters);
		currentPage = 0;
		// Add a small delay to show loading state
		setTimeout(() => {
			loadMoreItems();
		}, 150);
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

	async function downloadSVG(item: GalleryItem) {
		// Extract category and filename from the original path
		const pathParts = (item.afterSvg || '').split('/');
		const category = pathParts[pathParts.length - 2];
		const filename = pathParts[pathParts.length - 1];

		if (!category || !filename) {
			console.error('Invalid SVG path:', item.afterSvg);
			return;
		}

		try {
			// Fetch SVG from API endpoint
			const response = await fetch(`/api/svg/${category}/${filename}`);
			if (!response.ok) throw new Error('Failed to fetch SVG');

			const svgBlob = await response.blob();
			const url = URL.createObjectURL(svgBlob);

			// Create download link
			const link = document.createElement('a');
			link.href = url;
			link.download = `${item.title.replace(/\s+/g, '_').toLowerCase()}.svg`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			// Clean up
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Error downloading SVG:', error);
			alert('Failed to download SVG. Please try again.');
		}
	}

	function setViewMode(mode: ViewMode) {
		viewMode = mode;
	}

	// Load more items for pagination
	function loadMoreItems() {
		if (currentPage === 0) {
			// Initial load - load fewer items for faster perceived performance
			displayedItems = filteredItems.slice(0, INITIAL_ITEMS);
		} else {
			// Subsequent loads - use standard page size
			const start = displayedItems.length;
			const end = start + ITEMS_PER_PAGE;
			const newItems = filteredItems.slice(start, end);
			displayedItems = [...displayedItems, ...newItems];
		}

		hasMore = displayedItems.length < filteredItems.length;
		isLoading = false;
		isLoadingMore = false;
		currentPage++;

		// Cache newly loaded items for future visits
		if (displayedItems.length > 0) {
			// Delay caching to not impact initial render performance
			setTimeout(() => cacheViewedItems(), 1000);
		}
	}

	// Intersection observer for infinite scroll
	let loadMoreTrigger = $state<HTMLElement | undefined>();

	// Load more function for infinite scroll
	function triggerLoadMore() {
		if (isLoadingMore || !hasMore) return;

		isLoadingMore = true;

		setTimeout(() => {
			loadMoreItems();
		}, 800); // Brief delay to show loading UX
	}

	// Load gallery data on mount
	onMount(() => {
		isLoading = true;

		// Load data asynchronously
		loadGalleryData()
			.then((manifest) => {
				allItems = manifest.items;
				categories = getCategories(allItems);
				algorithmStats = getAlgorithmStats(allItems);
				applyFilters();
			})
			.catch((error) => {
				console.error('Failed to load gallery:', error);
				isLoading = false;
			});

		// Also add scroll listener as fallback
		if (browser) {
			const handleScroll = () => {
				const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
				const windowHeight = window.innerHeight;
				const documentHeight = document.documentElement.scrollHeight;

				// Load more when user is 200px from bottom
				if (scrollTop + windowHeight >= documentHeight - 200) {
					if (hasMore && !isLoadingMore) {
						triggerLoadMore();
					}
				}
			};

			window.addEventListener('scroll', handleScroll);

			// Cleanup
			return () => {
				window.removeEventListener('scroll', handleScroll);
			};
		}
	});

	// Set up intersection observer effect
	$effect(() => {
		if (!browser || !loadMoreTrigger) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
					triggerLoadMore();
				}
			},
			{ threshold: 0.1 }
		);

		observer.observe(loadMoreTrigger);

		return () => observer.disconnect();
	});

	// Cleanup on destroy
	onDestroy(() => {
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
					<Search class="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-700" />
					<input
						type="text"
						placeholder="Search examples..."
						bind:value={filters.search}
						class="focus:border-ferrari-500 focus:ring-ferrari-500/30 text-speed-gray-900 placeholder:text-speed-gray-400 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pl-12 transition-all duration-200 focus:ring-1 focus:outline-none"
					/>
				</div>

				<!-- Categories -->
				<select
					bind:value={filters.category}
					class="focus:border-ferrari-500 focus:ring-ferrari-500/30 text-speed-gray-900 rounded-xl border border-gray-200 bg-white px-4 py-3 transition-all duration-200 focus:ring-1 focus:outline-none"
				>
					<option value="all">All Categories</option>
					{#each categories as category}
						<option value={category.value}>{category.label} ({category.count})</option>
					{/each}
				</select>

				<!-- Algorithm Filter -->
				<select
					bind:value={filters.algorithm}
					class="focus:border-ferrari-500 focus:ring-ferrari-500/30 text-speed-gray-900 rounded-xl border border-gray-200 bg-white px-4 py-3 transition-all duration-200 focus:ring-1 focus:outline-none"
				>
					<option value="all">All Algorithms</option>
					<option value="edgetracing">Edge Tracing</option>
					<option value="stippling">Dots (Stippling)</option>
					<option value="superpixel">Superpixel</option>
					<option value="centerline">Centerline</option>
				</select>
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
					onmouseenter={() => handleItemHover(item)}
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
							loading="lazy"
							class="h-full w-full"
						/>

						<!-- Subtle Hover Overlay (pointer-events-none to allow slider interaction) -->
						<div
							class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
						></div>

						<!-- Action Buttons - Only show on grid mode -->
						{#if viewMode === 'grid'}
							<div
								class="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 transform opacity-0 transition-all duration-300 group-hover:opacity-100"
							>
								<div class="pointer-events-auto flex items-center">
									<button
										onclick={() => openModal(item)}
										class="text-ferrari-600 flex items-center justify-center rounded-lg bg-white/90 p-2.5 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-white"
										style="margin-right: 12px;"
										aria-label="Expand image"
									>
										<Maximize2 class="h-4 w-4" />
									</button>
									<button
										onclick={async () => await downloadSVG(item)}
										class="bg-ferrari-600 hover:bg-ferrari-700 flex items-center justify-center rounded-lg p-2.5 text-white shadow-lg transition-all duration-200 hover:scale-105"
										style="margin-left: 12px;"
										aria-label="Download SVG"
									>
										<Download class="h-4 w-4" />
									</button>
								</div>
							</div>
						{/if}
					</div>

					<!-- Card Details -->
					<div
						class="space-y-3 p-6 {viewMode === 'list'
							? 'flex flex-1 items-center justify-between'
							: ''}"
					>
						<div class={viewMode === 'list' ? 'flex flex-col space-y-3' : 'space-y-3'}>
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

						<!-- Action Buttons for List Mode - Stacked to the right -->
						{#if viewMode === 'list'}
							<div
								class="flex flex-shrink-0 flex-col gap-2 opacity-0 transition-all duration-300 group-hover:opacity-100"
							>
								<button
									onclick={() => openModal(item)}
									class="text-ferrari-600 hover:bg-ferrari-50 border-ferrari-200 flex items-center justify-center rounded-lg border bg-white p-2.5 shadow-sm transition-all duration-200 hover:scale-105"
									aria-label="Expand image"
								>
									<Maximize2 class="h-4 w-4" />
								</button>
								<button
									onclick={async () => await downloadSVG(item)}
									class="bg-ferrari-600 hover:bg-ferrari-700 flex items-center justify-center rounded-lg p-2.5 text-white shadow-sm transition-all duration-200 hover:scale-105"
									aria-label="Download SVG"
								>
									<Download class="h-4 w-4" />
								</button>
							</div>
						{/if}
					</div>
				</div>
			{/each}

			<!-- Skeleton Loading Cards for Pagination -->
			{#if isLoadingMore}
				{#each Array(4) as _, i}
					<div
						class="animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm {viewMode ===
						'list'
							? 'flex flex-row'
							: ''}"
					>
						<!-- Skeleton Image -->
						<div
							class="bg-gray-200 {viewMode === 'grid'
								? 'aspect-square'
								: 'h-48 w-72 flex-shrink-0'}"
						></div>

						<!-- Skeleton Content -->
						<div
							class="space-y-3 p-6 {viewMode === 'list'
								? 'flex flex-1 flex-col justify-center'
								: ''}"
						>
							<div class="h-5 w-3/4 rounded bg-gray-200"></div>
							<div class="h-4 w-1/2 rounded bg-gray-200"></div>
							<div class="flex {viewMode === 'list' ? 'flex-col gap-1' : 'justify-between'}">
								<div class="h-3 w-20 rounded bg-gray-200"></div>
								<div class="h-3 w-16 rounded bg-gray-200"></div>
							</div>
						</div>
					</div>
				{/each}
			{/if}
		</div>

		<!-- Initial Loading State -->
		{#if isLoading && displayedItems.length === 0}
			<div class="py-16 text-center">
				<div class="mx-auto max-w-md">
					<div class="mb-4">
						<div class="spinner-gradient mx-auto h-16 w-16"></div>
					</div>
					<h3 class="mb-2 text-xl font-semibold text-gray-900">Loading gallery...</h3>
					<p class="text-gray-600">Please wait while we load the examples</p>
				</div>
			</div>
		{/if}

		<!-- No Results State -->
		{#if !isLoading && displayedItems.length === 0}
			<div class="py-16 text-center">
				<div class="mx-auto max-w-md">
					<div class="mb-4">
						<svg
							class="mx-auto h-16 w-16 text-gray-800"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							/>
						</svg>
					</div>
					<h3 class="mb-2 text-xl font-semibold text-gray-900">No examples found</h3>
					<p class="mb-6 text-gray-600">
						{#if filters.search || filters.category !== 'all' || filters.algorithm !== 'all'}
							Try adjusting your search or filters to see more results.
						{:else}
							There are no examples available in the gallery yet.
						{/if}
					</p>
					{#if filters.search || filters.category !== 'all' || filters.algorithm !== 'all'}
						<button onclick={clearFilters} class="btn-ferrari-secondary px-6 py-3">
							Clear filters
						</button>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Loading More Indicator (for pagination/scrolling) -->
		{#if isLoadingMore}
			<div class="mt-8 flex justify-center">
				<div
					class="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-6 py-3 shadow-sm"
				>
					<div class="spinner-gradient h-5 w-5"></div>
					<span class="text-gray-600">Loading more examples...</span>
				</div>
			</div>
		{/if}

		<!-- Filter Loading Indicator -->
		{#if isLoading && displayedItems.length > 0}
			<div class="mt-8 flex justify-center">
				<div class="flex items-center gap-3">
					<div class="spinner-gradient h-6 w-6"></div>
					<span class="text-gray-600">Filtering examples...</span>
				</div>
			</div>
		{/if}

		<!-- Intersection Observer Trigger -->
		{#if hasMore && !isLoadingMore}
			<div bind:this={loadMoreTrigger} class="h-px w-full"></div>
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
		<div class="w-full rounded-xl bg-white p-6">
			<!-- Header Section -->
			<div class="mb-6">
				<h2 class="text-speed-gray-900 mb-3 text-2xl font-bold">{selectedItem.title}</h2>
				<div class="flex items-center gap-4">
					<span class="algorithm-badge py-2">
						{selectedItem.algorithm}
					</span>
					<span class="text-speed-gray-600 text-sm font-medium">
						{selectedItem.dimensions} • {selectedItem.fileSize}
					</span>
				</div>
			</div>

			<!-- Image Section - Fixed height container -->
			<div class="mb-6">
				<div
					class="h-96 w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg"
				>
					<BeforeAfterSlider
						beforeImage={selectedItem.beforeImage}
						afterImage={selectedItem.afterImage}
						beforeAlt={`${selectedItem.title} - Original`}
						afterAlt={`${selectedItem.title} - Converted`}
						loading="lazy"
						class="h-full w-full"
					/>
				</div>
			</div>

			<!-- Button Section -->
			<div class="flex justify-center gap-4">
				<button
					onclick={async () => selectedItem && (await downloadSVG(selectedItem))}
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
