<script lang="ts">
	/**
	 * Error Boundary Component
	 * SvelteKit 5 Error Handling
	 */

	import { AlertCircle } from 'lucide-svelte';
	import { Button } from '../button';

	// Component props
	interface Props {
		handleError?: (error: Error) => void;
		class?: string;
		children?: import('svelte').Snippet;
	}

	let { handleError = () => {}, class: className = '', children, ...restProps }: Props = $props();

	// Error handling function
	function onError(error: unknown, reset: () => void) {
		console.error('ErrorBoundary caught error:', error);
		// Convert unknown error to Error type for handleError
		const errorObj = error instanceof Error ? error : new Error(String(error));
		handleError(errorObj);
	}
</script>

<div class="error-boundary {className}" {...restProps}>
	<svelte:boundary onerror={onError}>
		{#if children}
			{@render children()}
		{/if}
	</svelte:boundary>
</div>
