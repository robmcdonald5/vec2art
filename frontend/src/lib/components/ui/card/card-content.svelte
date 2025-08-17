<script lang="ts">
	import { cn } from '$lib/utils';
	
	interface Props {
		class?: string;
		children?: any;
	}
	
	let { class: className = '', children }: Props = $props();
</script>

<div class={cn("p-6 pt-0", className)}>
	{@render children?.()}
</div>