<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		src: string;
		alt: string;
		width?: number;
		height?: number;
		loading?: 'lazy' | 'eager';
		class?: string;
		sizes?: string;
		srcset?: string;
	}

	let {
		src,
		alt,
		width,
		height,
		loading = 'lazy',
		class: className = '',
		sizes,
		srcset
	}: Props = $props();

	let imgElement: HTMLImageElement;
	let isIntersecting = $state(false);
	let hasLoaded = $state(false);

	onMount(() => {
		// Skip lazy loading if loading="eager"
		if (loading === 'eager') {
			isIntersecting = true;
			return;
		}

		// Use Intersection Observer for lazy loading
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						isIntersecting = true;
						observer.unobserve(entry.target);
					}
				});
			},
			{
				// Start loading when image is 100px away from viewport
				rootMargin: '100px'
			}
		);

		if (imgElement) {
			observer.observe(imgElement);
		}

		return () => {
			if (imgElement) {
				observer.unobserve(imgElement);
			}
		};
	});

	function handleLoad() {
		hasLoaded = true;
	}

	// Generate WebP version of the image path
	function getWebPSrc(originalSrc: string): string {
		// If it's already a WebP, return as is
		if (originalSrc.endsWith('.webp')) return originalSrc;

		// Replace extension with .webp
		return originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
	}

	// Check if WebP version exists - reactive to src changes
	const webpSrc = $derived(getWebPSrc(src));
	const shouldUseWebP = $derived(!src.endsWith('.svg') && !src.endsWith('.gif'));
</script>

<picture class={className}>
	{#if shouldUseWebP && isIntersecting}
		<!-- WebP version for modern browsers -->
		<source type="image/webp" srcset={webpSrc} {sizes} />
	{/if}

	<!-- Fallback to original format -->
	<img
		bind:this={imgElement}
		src={isIntersecting ? src : undefined}
		data-src={src}
		{alt}
		{width}
		{height}
		{loading}
		{sizes}
		{srcset}
		class="{className} {!hasLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300"
		onload={handleLoad}
	/>
</picture>

<style>
	/* Placeholder style while loading */
	img:not([src]) {
		background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
		background-size: 200% 100%;
		animation: loading 1.5s infinite;
	}

	@keyframes loading {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}
</style>
