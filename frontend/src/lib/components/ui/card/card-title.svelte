<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		class?: string;
		children?: any;
	}

	let { class: className = '', children }: Props = $props();
</script>

<h3 class={cn('text-2xl leading-none font-semibold tracking-tight', className)}>
	{@render children?.()}
</h3>
