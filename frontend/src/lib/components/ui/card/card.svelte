<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		class?: string;
		children?: any;
	}

	let { class: className = '', children }: Props = $props();
</script>

<div class={cn('bg-card text-card-foreground rounded-lg border shadow-sm', className)}>
	{@render children?.()}
</div>
