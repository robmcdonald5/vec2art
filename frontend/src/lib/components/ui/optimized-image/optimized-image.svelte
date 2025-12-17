<script lang="ts">
	interface Props {
		src: string;
		alt: string;
		width?: number;
		height?: number;
		sizes?: string;
		loading?: 'lazy' | 'eager';
		class?: string;
		placeholder?: string;
		formats?: Array<'avif' | 'webp' | 'jpg' | 'png'>;
	}

	let {
		src,
		alt,
		width,
		height,
		sizes = '100vw',
		loading = 'lazy',
		class: className = '',
		placeholder = '',
		formats = []
	}: Props = $props();

	// Derive format variations from the source path - using $derived for reactivity
	const getFormatSource = $derived((format: string): string => {
		const lastDot = src.lastIndexOf('.');
		if (lastDot === -1) return src;

		const basePath = src.substring(0, lastDot);
		const currentExt = src.substring(lastDot + 1);

		// If the source already has this format, return it
		if (currentExt === format) return src;

		// For WebP conversions, check if there's an after-webp version
		if (format === 'webp' && src.includes('/before/')) {
			// Convert before path to after-webp path
			return src.replace('/before/', '/after-webp/').replace(/\.[^.]+$/, '.webp');
		}

		// Otherwise, assume format variations exist with same base name
		return `${basePath}.${format}`;
	});

	// Get the original format from the source - reactive to src changes
	const originalFormat = $derived(src.split('.').pop()?.toLowerCase() || 'jpg');

	// Determine which formats to use - reactive to formats and src changes
	const useFormats = $derived(
		formats.length > 0
			? formats
			: originalFormat === 'avif'
				? (['avif', 'webp', 'jpg'] as const)
				: originalFormat === 'webp'
					? (['webp', 'jpg'] as const)
					: (['avif', 'webp', originalFormat] as Array<'avif' | 'webp' | 'jpg' | 'png'>)
	);
</script>

{#if placeholder}
	<!-- Low-quality placeholder for blur-up effect -->
	<div class="relative {className}">
		<img
			src={placeholder}
			alt=""
			aria-hidden="true"
			class="absolute inset-0 h-full w-full object-contain blur-xl"
		/>
		<picture class="relative">
			{#each useFormats.filter((f) => f !== originalFormat) as format (format)}
				<source type="image/{format}" srcset={getFormatSource(format)} {sizes} />
			{/each}
			<img
				{src}
				{alt}
				{width}
				{height}
				{loading}
				{sizes}
				class="relative h-full w-full object-contain {className}"
			/>
		</picture>
	</div>
{:else}
	<picture>
		{#each useFormats.filter((f) => f !== originalFormat) as format (format)}
			<source type="image/{format}" srcset={getFormatSource(format)} {sizes} />
		{/each}
		<img {src} {alt} {width} {height} {loading} {sizes} class={className} />
	</picture>
{/if}
