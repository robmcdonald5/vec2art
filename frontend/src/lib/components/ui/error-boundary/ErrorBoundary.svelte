<script lang="ts">
	/**
	 * Error Boundary Component
	 * SvelteKit 5 Error Handling
	 */

	// import { AlertCircle } from 'lucide-svelte';
	// import { Button } from '../button';

	// Component props
	interface Props {
		handleError?: (_error: Error) => void;
		class?: string;
		children?: import('svelte').Snippet;
	}

	let { handleError = () => {}, class: className = '', children, ...restProps }: Props = $props();

	// Error handling function
	function onError(_error: unknown, _reset: () => void) {
		console.error('ErrorBoundary caught error:', _error);
		// Convert unknown error to Error type for handleError
		const errorObj = _error instanceof Error ? _error : new Error(String(_error));
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
