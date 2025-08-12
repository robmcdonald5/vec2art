<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		if (browser) {
			// Set initial theme based on system preference
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			const savedTheme = localStorage.getItem('theme');
			const theme = savedTheme || (prefersDark ? 'dark' : 'light');

			if (theme === 'dark') {
				document.documentElement.classList.add('dark');
			} else {
				document.documentElement.classList.remove('dark');
			}
		}
	});
</script>

{@render children?.()}
