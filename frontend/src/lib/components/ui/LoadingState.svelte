<script lang="ts">
	import { Loader2 } from 'lucide-svelte';

	interface Props {
		message?: string;
		size?: 'sm' | 'md' | 'lg';
		inline?: boolean;
		center?: boolean;
	}

	let {
		message = 'Loading...',
		size = 'md',
		inline = false,
		center = true
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
		
		return `${baseClasses} ${alignClasses} ${spacingClasses}`;
	});
</script>

<div 
	class={containerClasses}
	role="status" 
	aria-label={message}
>
	<Loader2 
		class="text-ferrari-600 animate-spin {iconSizes[size]}" 
		aria-hidden="true" 
	/>
	{#if size === 'lg'}
		<div class="text-center">
			<h2 class="mb-2 font-bold text-gray-800 {textSizes[size]}">{message}</h2>
			<p class="text-gray-600">
				<slot name="subtitle">
					Please wait while we process your request
				</slot>
			</p>
		</div>
	{:else}
		<span class="font-medium text-gray-700 {textSizes[size]}">
			{message}
		</span>
	{/if}
</div>