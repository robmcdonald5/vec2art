<script lang="ts">
	import { cn } from '$lib/utils';
	
	interface Props {
		class?: string;
		children?: any;
	}
	
	let { class: className = '', children }: Props = $props();
</script>

<p class={cn("text-sm text-muted-foreground", className)}>
	{@render children?.()}
</p>