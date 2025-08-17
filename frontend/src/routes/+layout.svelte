<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
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
		class="border-speed-gray-200/50 bg-nav-clean sticky top-0 z-50 border-b shadow-sm backdrop-blur-xl transition-all duration-200 supports-[backdrop-filter]:bg-white/95"
	>
		<!-- Ferrari accent line -->
		<div
			class="via-ferrari-500/30 absolute right-0 bottom-0 left-0 h-0.5 bg-gradient-to-r from-transparent to-transparent"
		></div>

		<div
			class="mx-auto flex h-14 w-full max-w-screen-xl items-center justify-between px-4 md:h-16 md:px-6 lg:px-8"
		>
			<a
				href="/"
				class="hover:animate-ferrari-glow flex items-center font-semibold transition-all duration-300"
			>
				<span
					class="footer-gradient-text text-3xl font-bold md:text-3xl"
				>
					vec2art
				</span>
			</a>
			<nav class="flex items-center gap-2 md:gap-3">
				<div class="hidden items-center gap-2 md:flex">
					<a
						href="/converter"
						class="focus:ring-ferrari-500 relative rounded-md px-4 py-2 text-sm font-medium transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:outline-none md:text-base {$page
							.url.pathname === '/converter'
							? 'border-ferrari-500/30 bg-ferrari-50 text-ferrari-600 border'
							: 'text-speed-gray-600 hover:bg-speed-gray-50 hover:text-speed-gray-900 border border-transparent'}"
						aria-current={$page.url.pathname === '/converter' ? 'page' : undefined}
					>
						Converter
						{#if $page.url.pathname === '/converter'}
							<span
								class="bg-ferrari-500 animate-speed-pulse absolute -bottom-3 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
							></span>
						{/if}
					</a>
					<a
						href="/gallery"
						class="focus:ring-ferrari-500 relative rounded-md px-4 py-2 text-sm font-medium transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:outline-none md:text-base {$page
							.url.pathname === '/gallery'
							? 'border-ferrari-500/30 bg-ferrari-50 text-ferrari-600 border'
							: 'text-speed-gray-600 hover:bg-speed-gray-50 hover:text-speed-gray-900 border border-transparent'}"
						aria-current={$page.url.pathname === '/gallery' ? 'page' : undefined}
					>
						Gallery
						{#if $page.url.pathname === '/gallery'}
							<span
								class="bg-ferrari-500 animate-speed-pulse absolute -bottom-3 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
							></span>
						{/if}
					</a>
					<a
						href="/about"
						class="focus:ring-ferrari-500 relative rounded-md px-4 py-2 text-sm font-medium transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:outline-none md:text-base {$page
							.url.pathname === '/about'
							? 'border-ferrari-500/30 bg-ferrari-50 text-ferrari-600 border'
							: 'text-speed-gray-600 hover:bg-speed-gray-50 hover:text-speed-gray-900 border border-transparent'}"
						aria-current={$page.url.pathname === '/about' ? 'page' : undefined}
					>
						About
						{#if $page.url.pathname === '/about'}
							<span
								class="bg-ferrari-500 animate-speed-pulse absolute -bottom-3 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
							></span>
						{/if}
					</a>
				</div>
				<Button
					href="/converter"
					variant="default"
					size="sm"
					class="btn-ferrari-primary shadow-ferrari-500/25 hover:animate-quick-lift h-10 px-6 shadow-lg"
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
