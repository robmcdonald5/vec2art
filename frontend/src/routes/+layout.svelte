<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/button.svelte';
	import { inject } from '@vercel/analytics';

	let { children } = $props();

	onMount(() => {
		if (browser) {
			// Initialize Vercel Analytics
			inject();
			
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
		class="sticky top-0 z-50 border-b border-gray-800/50 bg-black/95 shadow-lg backdrop-blur-md transition-all duration-200 supports-[backdrop-filter]:bg-black/90"
	>
		<div
			class="mx-auto flex h-14 w-full max-w-screen-xl items-center justify-between px-4 md:h-16 md:px-6 lg:px-8"
		>
			<a href="/" class="flex items-center font-semibold transition-opacity hover:opacity-80">
				<span
					class="bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-300 bg-clip-text text-xl font-bold text-transparent md:text-2xl"
				>
					vec2art
				</span>
			</a>
			<nav class="flex items-center gap-2 md:gap-3">
				<div class="hidden items-center gap-2 md:flex">
					<a
						href="/converter"
						class="relative rounded-md px-4 py-2 text-sm font-medium transition-all duration-300 focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-black focus:outline-none md:text-base {$page
							.url.pathname === '/converter'
							? 'border border-orange-400/30 bg-orange-400/10 text-orange-400'
							: 'border border-transparent text-gray-400 hover:bg-white/5 hover:text-white'}"
						aria-current={$page.url.pathname === '/converter' ? 'page' : undefined}
					>
						Converter
						{#if $page.url.pathname === '/converter'}
							<span
								class="absolute -bottom-3 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-orange-400"
							></span>
						{/if}
					</a>
					<a
						href="/gallery"
						class="relative rounded-md px-4 py-2 text-sm font-medium transition-all duration-300 focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-black focus:outline-none md:text-base {$page
							.url.pathname === '/gallery'
							? 'border border-orange-400/30 bg-orange-400/10 text-orange-400'
							: 'border border-transparent text-gray-400 hover:bg-white/5 hover:text-white'}"
						aria-current={$page.url.pathname === '/gallery' ? 'page' : undefined}
					>
						Gallery
						{#if $page.url.pathname === '/gallery'}
							<span
								class="absolute -bottom-3 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-orange-400"
							></span>
						{/if}
					</a>
					<a
						href="/about"
						class="relative rounded-md px-4 py-2 text-sm font-medium transition-all duration-300 focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-black focus:outline-none md:text-base {$page
							.url.pathname === '/about'
							? 'border border-orange-400/30 bg-orange-400/10 text-orange-400'
							: 'border border-transparent text-gray-400 hover:bg-white/5 hover:text-white'}"
						aria-current={$page.url.pathname === '/about' ? 'page' : undefined}
					>
						About
						{#if $page.url.pathname === '/about'}
							<span
								class="absolute -bottom-3 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-orange-400"
							></span>
						{/if}
					</a>
				</div>
				<Button
					href="/converter"
					variant="default"
					size="sm"
					class="h-10 border-0 bg-gradient-to-r from-orange-500 to-yellow-500 px-6 font-semibold text-white shadow-lg shadow-orange-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:from-orange-600 hover:to-yellow-600 hover:shadow-xl hover:shadow-orange-500/30"
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
