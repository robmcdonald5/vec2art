<script lang="ts">
	import { onMount, tick } from 'svelte';

	interface Props {
		target?: Element | string;
		children?: import('svelte').Snippet;
	}

	let { target = 'body', children }: Props = $props();

	let portal = $state<Element>();
	let mounted = $state(false);

	onMount(async () => {
		await tick();

		if (typeof target === 'string') {
			portal = document.querySelector(target) ?? document.body;
		} else {
			portal = target;
		}

		mounted = true;
	});
</script>

{#if mounted && portal}
	{@render children?.()}
{/if}
