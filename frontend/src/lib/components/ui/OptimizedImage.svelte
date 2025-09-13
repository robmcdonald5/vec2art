<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		src: string;
		alt: string;
		width?: number;
		height?: number;
		loading?: 'lazy' | 'eager';
		priority?: boolean;
		class?: string;
		sizes?: string;
		srcset?: string;
		placeholder?: 'blur' | 'empty';
		blurDataURL?: string;
	}

	let {
		src,
		alt,
		width,
		height,
		loading = 'lazy',
		priority = false,
		class: className = '',
		sizes,
		srcset,
		placeholder = 'empty',
		blurDataURL
	}: Props = $props();

	let imgElement = $state<HTMLImageElement>();
	let isLoaded = $state(false);
	let isInView = $state(false);

	// For priority images (LCP), use eager loading
	const actualLoading = $derived(priority ? 'eager' : loading);

	// Calculate aspect ratio for CLS prevention
	const aspectRatio = $derived(width && height ? `${(height / width) * 100}%` : undefined);

	onMount(() => {
		if (!imgElement) return;

		// Mark as loaded if image is already cached
		if (imgElement.complete) {
			isLoaded = true;
			return;
		}

		// Set up intersection observer for lazy images
		if (actualLoading === 'lazy' && 'IntersectionObserver' in window) {
			const observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting) {
							isInView = true;
							observer.disconnect();
						}
					});
				},
				{
					rootMargin: '50px' // Start loading 50px before entering viewport
				}
			);

			observer.observe(imgElement);

			return () => {
				observer.disconnect();
			};
		} else {
			// Fallback for browsers without IntersectionObserver
			isInView = true;
		}
	});

	function handleLoad() {
		isLoaded = true;
	}
</script>

<div
	class="image-container relative overflow-hidden {className}"
	style:padding-bottom={aspectRatio}
	style:background={placeholder === 'blur' && blurDataURL ? `url(${blurDataURL})` : undefined}
	class:bg-gray-100={placeholder === 'empty' && !isLoaded}
>
	{#if priority || isInView || actualLoading === 'eager'}
		<img
			bind:this={imgElement}
			{src}
			{alt}
			{width}
			{height}
			{sizes}
			{srcset}
			loading={actualLoading}
			decoding={priority ? 'sync' : 'async'}
			fetchpriority={priority ? 'high' : undefined}
			onload={handleLoad}
			class="absolute inset-0 h-full w-full object-cover transition-opacity duration-300 {isLoaded
				? 'opacity-100'
				: 'opacity-0'}"
		/>
	{/if}

	{#if !isLoaded && placeholder === 'empty'}
		<div class="absolute inset-0 animate-pulse bg-gray-200"></div>
	{/if}
</div>

<style>
	.image-container {
		position: relative;
		background-size: cover;
		background-position: center;
	}
</style>
