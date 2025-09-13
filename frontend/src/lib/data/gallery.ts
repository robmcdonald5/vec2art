import type { GalleryItem, GalleryManifest, GalleryFilters } from '$lib/types/gallery';

let galleryData: GalleryManifest | null = null;

/**
 * Load gallery manifest data
 */
export async function loadGalleryData(): Promise<GalleryManifest> {
	if (galleryData) {
		return galleryData;
	}

	try {
		const response = await fetch('/gallery/manifest.json');
		if (!response.ok) {
			throw new Error(`Failed to load gallery manifest: ${response.status}`);
		}
		galleryData = await response.json();
		return galleryData!;
	} catch (error) {
		console.error('Error loading gallery data:', error);
		// Return empty manifest as fallback
		return {
			generated: new Date().toISOString(),
			totalImages: 0,
			categories: {},
			items: []
		};
	}
}

/**
 * Filter gallery items based on search criteria
 */
export function filterGalleryItems(items: GalleryItem[], filters: GalleryFilters): GalleryItem[] {
	return items.filter((item) => {
		// Search filter
		if (filters.search) {
			const searchTerm = filters.search.toLowerCase();
			const matchesSearch =
				item.title.toLowerCase().includes(searchTerm) ||
				item.category.toLowerCase().includes(searchTerm) ||
				item.algorithm.toLowerCase().includes(searchTerm);
			if (!matchesSearch) return false;
		}

		// Category filter
		if (filters.category && filters.category !== 'all') {
			if (item.category !== filters.category) return false;
		}

		// Algorithm filter
		if (filters.algorithm && filters.algorithm !== 'all') {
			if (item.algorithmKey !== filters.algorithm) return false;
		}

		return true;
	});
}

/**
 * Get unique categories from items
 */
export function getCategories(
	items: GalleryItem[]
): Array<{ value: string; label: string; count: number }> {
	const categoryMap = new Map<string, number>();

	items.forEach((item) => {
		const count = categoryMap.get(item.category) || 0;
		categoryMap.set(item.category, count + 1);
	});

	const categories = Array.from(categoryMap.entries()).map(([value, count]) => ({
		value,
		label: value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' '),
		count
	}));

	// Sort by count (descending) then by label (ascending)
	categories.sort((a, b) => {
		if (b.count !== a.count) return b.count - a.count;
		return a.label.localeCompare(b.label);
	});

	return categories;
}

/**
 * Get algorithm statistics
 */
export function getAlgorithmStats(items: GalleryItem[]): Map<string, number> {
	const stats = new Map<string, number>();

	items.forEach((item) => {
		const count = stats.get(item.algorithmKey) || 0;
		stats.set(item.algorithmKey, count + 1);
	});

	return stats;
}
