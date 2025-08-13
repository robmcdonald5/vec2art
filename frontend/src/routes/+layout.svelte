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
		class="bg-black/95 supports-[backdrop-filter]:bg-black/90 sticky top-0 z-50 border-b border-gray-800/50 backdrop-blur-md shadow-lg transition-all duration-200"
	>
		<div
			class="mx-auto flex h-14 md:h-16 w-full max-w-screen-xl items-center justify-between px-4 md:px-6 lg:px-8"
		>
			<a href="/" class="flex items-center font-semibold transition-opacity hover:opacity-80">
				<span class="text-xl md:text-2xl font-bold bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-300 bg-clip-text text-transparent">
					vec2art
				</span>
			</a>
			<nav class="flex items-center gap-2 md:gap-3">
				<div class="hidden md:flex items-center gap-2">
					<a 
						href="/converter" 
						class="relative px-4 py-2 text-sm md:text-base font-medium rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-black {$page.url.pathname === '/converter' ? 'text-orange-400 bg-orange-400/10 border border-orange-400/30' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}"
						aria-current={$page.url.pathname === '/converter' ? 'page' : undefined}
					>
						Converter
						{#if $page.url.pathname === '/converter'}
							<span class="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-400 rounded-full"></span>
						{/if}
					</a>
					<a 
						href="/gallery" 
						class="relative px-4 py-2 text-sm md:text-base font-medium rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-black {$page.url.pathname === '/gallery' ? 'text-orange-400 bg-orange-400/10 border border-orange-400/30' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}"
						aria-current={$page.url.pathname === '/gallery' ? 'page' : undefined}
					>
						Gallery
						{#if $page.url.pathname === '/gallery'}
							<span class="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-400 rounded-full"></span>
						{/if}
					</a>
					<a 
						href="/about" 
						class="relative px-4 py-2 text-sm md:text-base font-medium rounded-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-black {$page.url.pathname === '/about' ? 'text-orange-400 bg-orange-400/10 border border-orange-400/30' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}"
						aria-current={$page.url.pathname === '/about' ? 'page' : undefined}
					>
						About
						{#if $page.url.pathname === '/about'}
							<span class="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-400 rounded-full"></span>
						{/if}
					</a>
				</div>
				<Button 
					href="/converter" 
					variant="default" 
					size="sm" 
					class="h-10 px-6 font-semibold bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 border-0 text-white shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5 transition-all duration-300"
				>
					Get Started
				</Button>
			</nav>
		</div>
	</header>

	<main class="flex-1">
		{@render children?.()}
	</main>
</div>
