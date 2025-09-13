<script lang="ts">
	import { page } from '$app/stores';

	interface Props {
		title?: string;
		description?: string;
		keywords?: string;
		image?: string;
		noindex?: boolean;
		article?: boolean;
		publishedTime?: string;
		modifiedTime?: string;
		author?: string;
	}

	let {
		title = 'vec2art - Transform Images into SVG Art',
		description = 'High-performance browser-based tool that converts images into expressive, hand-drawn style SVG graphics powered by WebAssembly',
		keywords = 'SVG converter, image vectorization, line art, WebAssembly, image to SVG, vector graphics, raster to vector, svg art generator',
		image = '/og-image.png',
		noindex = false,
		article = false,
		publishedTime,
		modifiedTime,
		author = 'vec2art'
	}: Props = $props();

	// Get the current URL for canonical
	const siteUrl = 'https://vec2art.com';

	// Create reactive canonical URL
	const canonicalUrl = $derived(`${siteUrl}${$page.url.pathname}`);
	const fullImageUrl = $derived(image.startsWith('http') ? image : `${siteUrl}${image}`);

	// Page-specific title formatting
	const pageTitle = $derived($page.url.pathname === '/' ? title : `${title} | vec2art`);
</script>

<svelte:head>
	<!-- Primary Meta Tags -->
	<title>{pageTitle}</title>
	<meta name="title" content={pageTitle} />
	<meta name="description" content={description} />
	<meta name="keywords" content={keywords} />
	<meta name="author" content={author} />

	<!-- Canonical URL -->
	<link rel="canonical" href={canonicalUrl} />

	<!-- Robots -->
	{#if noindex}
		<meta name="robots" content="noindex, nofollow" />
	{:else}
		<meta name="robots" content="index, follow, max-image-preview:large" />
	{/if}

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content={article ? 'article' : 'website'} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={fullImageUrl} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:site_name" content="vec2art" />
	<meta property="og:locale" content="en_US" />

	{#if article && publishedTime}
		<meta property="article:published_time" content={publishedTime} />
	{/if}
	{#if article && modifiedTime}
		<meta property="article:modified_time" content={modifiedTime} />
	{/if}
	{#if article && author}
		<meta property="article:author" content={author} />
	{/if}

	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content={canonicalUrl} />
	<meta property="twitter:title" content={pageTitle} />
	<meta property="twitter:description" content={description} />
	<meta property="twitter:image" content={fullImageUrl} />
	<meta property="twitter:site" content="@vec2art" />
	<meta property="twitter:creator" content="@vec2art" />

	<!-- LinkedIn -->
	<meta property="linkedin:card" content="summary_large_image" />
	<meta property="linkedin:title" content={pageTitle} />
	<meta property="linkedin:description" content={description} />
	<meta property="linkedin:image" content={fullImageUrl} />

	<!-- Additional SEO Tags -->
	<meta name="generator" content="SvelteKit" />
	<meta name="format-detection" content="telephone=no" />
	<meta name="apple-mobile-web-app-title" content="vec2art" />
	<meta name="application-name" content="vec2art" />
	<meta name="msapplication-TileColor" content="#DC143C" />
	<meta name="theme-color" content="#DC143C" />
</svelte:head>
