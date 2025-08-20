import { preloadData, preloadCode } from '$app/navigation';

/**
 * Preload a SvelteKit route's data and code when hovering over a link
 * This improves perceived performance by starting the loading process early
 */
export function createPreloader(url: string) {
	let hasPreloaded = false;

	const handleMouseEnter = () => {
		if (hasPreloaded) return;

		console.log(`🚀 Preloading route: ${url}`);

		try {
			// Preload both the page data and the code chunks
			preloadData(url);
			preloadCode(url);
			hasPreloaded = true;
		} catch (error) {
			console.warn(`⚠️ Failed to preload ${url}:`, error);
		}
	};

	return { handleMouseEnter };
}

/**
 * Svelte action to add preloading behavior to any element
 * Usage: <a href="/converter" use:preload>Link</a>
 */
export function preload(node: HTMLElement, url?: string) {
	const targetUrl = url || node.getAttribute('href');
	if (!targetUrl) {
		console.warn('No URL found for preloading');
		return;
	}

	const { handleMouseEnter } = createPreloader(targetUrl);

	node.addEventListener('mouseenter', handleMouseEnter);
	node.addEventListener('focus', handleMouseEnter); // Also preload on keyboard focus

	return {
		destroy() {
			node.removeEventListener('mouseenter', handleMouseEnter);
			node.removeEventListener('focus', handleMouseEnter);
		}
	};
}
