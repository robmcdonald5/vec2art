<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		class?: string;
		children?: any;
	}

	let { class: className = '', children }: Props = $props();
</script>

<div class={cn('flex flex-col space-y-1.5 p-6', className)}>
	{@render children?.()}
</div>
