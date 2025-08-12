<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/button.svelte';

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

<div class="flex min-h-dvh flex-col">
	<header
		class="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 border-b backdrop-blur"
	>
		<div
			class="mx-auto flex h-14 w-full max-w-screen-xl items-center justify-between px-4 sm:px-6 lg:px-8"
		>
			<a href="/" class="flex items-center gap-2 font-semibold">
				<img src="/logo.svg" alt="vec2art logo" class="h-8 w-8" />
				<span>vec2art</span>
			</a>
			<nav class="flex items-center gap-4 sm:gap-6">
				<div class="hidden sm:flex items-center gap-6">
					<a 
						href="/converter" 
						class="text-muted-foreground hover:text-foreground text-sm transition-colors"
						class:text-foreground={$page.url.pathname === '/converter'}
						class:text-primary={$page.url.pathname === '/converter'}
					>
						Converter
					</a>
					<a 
						href="/gallery" 
						class="text-muted-foreground hover:text-foreground text-sm transition-colors"
						class:text-foreground={$page.url.pathname === '/gallery'}
						class:text-primary={$page.url.pathname === '/gallery'}
					>
						Gallery
					</a>
					<a 
						href="/about" 
						class="text-muted-foreground hover:text-foreground text-sm transition-colors"
						class:text-foreground={$page.url.pathname === '/about'}
						class:text-primary={$page.url.pathname === '/about'}
					>
						About
					</a>
				</div>
				<Button href="/converter" variant="default" size="sm">Get Started</Button>
			</nav>
		</div>
	</header>

	<main class="flex-1">
		{@render children?.()}
	</main>
</div>
