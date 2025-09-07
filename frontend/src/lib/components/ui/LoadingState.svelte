<script lang="ts">
	import { Loader2 } from 'lucide-svelte';

	interface Props {
		message?: string;
		size?: 'sm' | 'md' | 'lg';
		inline?: boolean;
		center?: boolean;
		subtitle?: import('svelte').Snippet;
	}

	let {
		message = 'Loading...',
		size = 'md',
		inline = false,
		center = true,
		subtitle
	}: Props = $props();

	const iconSizes = {
		sm: 'h-4 w-4',
		md: 'h-6 w-6',
		lg: 'h-16 w-16'
	};

	const textSizes = {
		sm: 'text-sm',
		md: 'text-base',
		lg: 'text-xl'
	};

	const containerClasses = $derived(() => {
		const baseClasses = inline ? 'inline-flex' : 'flex';
		const alignClasses = center ? 'items-center justify-center' : 'items-center';
		const spacingClasses = size === 'lg' ? 'gap-4' : 'gap-2';
		const directionClasses = size === 'lg' ? 'flex-col text-center' : '';

		return `${baseClasses} ${alignClasses} ${spacingClasses} ${directionClasses}`;
	});
</script>

<div class={containerClasses} role="status" aria-label={message}>
	<Loader2
		class="text-ferrari-600 animate-spin {iconSizes[size]} {size === 'lg' ? 'mx-auto' : ''}"
		aria-hidden="true"
	/>
	{#if size === 'lg'}
		<h2 class="mb-2 text-center font-bold text-gray-800 {textSizes[size]}">{message}</h2>
		<p class="text-center text-gray-600">
			{#if subtitle}
				{@render subtitle()}
			{:else}
				Please wait while we process your request
			{/if}
		</p>
	{:else}
		<span class="font-medium text-gray-700 {textSizes[size]}">
			{message}
		</span>
	{/if}
</div>
