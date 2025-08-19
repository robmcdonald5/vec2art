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

let { 
	handleError = () => {},
	class: className = '',
	children,
	...restProps 
}: Props = $props();

// Error handling function
function onError(error: Error) {
	console.error('ErrorBoundary caught error:', error);
	handleError(error);
}
</script>

<div class="error-boundary {className}" {...restProps}>
	<svelte:boundary {onError}>
		{#if children}
			{@render children()}
		{/if}
	</svelte:boundary>
</div>