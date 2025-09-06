<script lang="ts">
	import { AlertCircle, RefreshCw } from 'lucide-svelte';

	interface Props {
		title?: string;
		message: string;
		size?: 'sm' | 'md' | 'lg';
		inline?: boolean;
		center?: boolean;
		showRetry?: boolean;
		showReload?: boolean;
		onRetry?: () => void;
		onReload?: () => void;
	}

	let {
		title = 'Error',
		message,
		size = 'md',
		inline = false,
		center = true,
		showRetry = false,
		showReload = false,
		onRetry,
		onReload
	}: Props = $props();

	const iconSizes = {
		sm: 'h-4 w-4',
		md: 'h-6 w-6',
		lg: 'h-16 w-16'
	};

	const titleSizes = {
		sm: 'text-sm',
		md: 'text-lg',
		lg: 'text-xl'
	};

	const messageSizes = {
		sm: 'text-xs',
		md: 'text-sm',
		lg: 'text-base'
	};

	const containerClasses = $derived(() => {
		const baseClasses = inline ? 'inline-flex' : 'flex';
		const alignClasses = center ? 'items-center justify-center' : 'items-center';
		const spacingClasses = size === 'lg' ? 'gap-4' : 'gap-2';
		
		if (size === 'lg') {
			return `${baseClasses} ${alignClasses} flex-col text-center`;
		}
		
		return `${baseClasses} ${alignClasses} ${spacingClasses}`;
	});

	function handleRetry() {
		onRetry?.();
	}

	function handleReload() {
		if (onReload) {
			onReload();
		} else {
			location.reload();
		}
	}
</script>

<div 
	class={containerClasses}
	role="alert" 
	aria-label="Error: {message}"
>
	{#if size === 'lg'}
		<div class="mb-4">
			<AlertCircle class="mx-auto text-red-500 {iconSizes[size]}" />
		</div>
		<h2 class="mb-4 font-bold text-red-700 dark:text-red-400 {titleSizes[size]}">
			{title}
		</h2>
		<p class="mb-6 text-gray-600 dark:text-gray-300 {messageSizes[size]}">
			{message}
		</p>
		
		{#if showRetry || showReload}
			<div class="flex justify-center gap-4">
				{#if showReload}
					<button 
						class="btn-ferrari-secondary px-6 py-2 text-sm"
						onclick={handleReload}
					>
						<RefreshCw class="mr-2 h-4 w-4" />
						Reload Page
					</button>
				{/if}
				{#if showRetry}
					<button 
						class="btn-ferrari-primary px-6 py-2 text-sm"
						onclick={handleRetry}
					>
						Try Again
					</button>
				{/if}
			</div>
		{/if}
	{:else}
		<AlertCircle class="text-red-500 {iconSizes[size]}" aria-hidden="true" />
		<div class="flex-1">
			{#if size === 'md'}
				<div class="font-medium text-red-700 dark:text-red-400 {titleSizes[size]}">
					{title}
				</div>
			{/if}
			<span class="text-red-600 {messageSizes[size]}">
				{message}
			</span>
		</div>
		
		{#if showRetry || showReload}
			<div class="flex gap-2 ml-auto">
				{#if showRetry}
					<button 
						class="text-sm text-red-600 hover:text-red-800 underline"
						onclick={handleRetry}
					>
						Retry
					</button>
				{/if}
				{#if showReload}
					<button 
						class="text-sm text-red-600 hover:text-red-800 underline"
						onclick={handleReload}
					>
						Reload
					</button>
				{/if}
			</div>
		{/if}
	{/if}
</div>