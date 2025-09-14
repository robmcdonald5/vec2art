<script lang="ts">
	import '../app.css';
	import { browser, dev } from '$app/environment';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { afterNavigate } from '$app/navigation';
	import MobileMenu from '$lib/components/navigation/MobileMenu.svelte';
	import ToastContainer from '$lib/components/ui/toast/ToastContainer.svelte';
	import { inject } from '@vercel/analytics';
	import { preload } from '$lib/utils/preload';
	import { detectAndFixiPhoneCacheIssues } from '$lib/services/service-worker-client';
	// Removed scroll-lock - mobile menu uses proper CSS

	let { children } = $props();
	let mobileMenuOpen = $state(false);

	// No scroll lock tracking needed

	// Toggle mobile menu
	function toggleMobileMenu() {
		console.log('Toggle called, current state:', mobileMenuOpen);
		mobileMenuOpen = !mobileMenuOpen;
		console.log('New state:', mobileMenuOpen);
	}

	// Mobile menu scroll is handled by CSS (fixed positioning)

	// Close menu on navigation
	let previousPathname = $state($page.url.pathname);
	$effect(() => {
		const currentPathname = $page.url.pathname;
		// Only close menu if pathname actually changed (not initial load)
		if (previousPathname !== currentPathname && mobileMenuOpen) {
			console.log('Pathname changed, closing menu:', previousPathname, '->', currentPathname);
			mobileMenuOpen = false;
		}
		previousPathname = currentPathname;
	});

	// Scroll to top on navigation
	afterNavigate(() => {
		// Scroll to top of the page on navigation
		if (browser) {
			window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
		}
	});

	// No cleanup needed

	onMount(async () => {
		if (browser) {
			// Initialize Vercel Analytics
			inject();

			// CRITICAL: Detect and fix iPhone cache issues (SvelteKit handles service worker registration)
			// This ensures iPhone users get the latest fixes for threading crashes
			if (!dev) {
				try {
					await detectAndFixiPhoneCacheIssues();
				} catch (error) {
					console.warn('[Layout] Failed to detect/fix iPhone cache issues:', error);
				}

				// Initialize iPhone debug logging for production error tracking
				try {
					const { default: _iPhoneDebugLogger } = await import('$lib/services/iphone-debug-logger');
					console.log('[Layout] iPhone debug logger initialized');
				} catch (error) {
					console.warn('[Layout] Failed to initialize iPhone debug logger:', error);
				}
			}

			// Force light mode for now since mobile components don't have dark mode styles
			// TODO: Implement proper dark mode support for mobile components
			const savedTheme = localStorage.getItem('theme');
			const _theme = savedTheme === 'dark' ? 'dark' : 'light'; // Only use saved theme, ignore system preference

			// Always ensure light mode for better mobile compatibility
			document.documentElement.classList.remove('dark');

			// For future dark mode support, uncomment and design dark mode mobile styles:
			// if (theme === 'dark') {
			// 	document.documentElement.classList.add('dark');
			// } else {
			// 	document.documentElement.classList.remove('dark');
			// }
		}
	});
</script>

<!-- Skip Navigation Link for Accessibility -->
<a
	href="#main-content"
	class="focus:bg-ferrari-600 focus:ring-ferrari-400 sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg focus:ring-2 focus:ring-offset-2 focus:outline-none"
>
	Skip to main content
</a>

<div class="flex min-h-dvh flex-col">
	<header
		class="border-speed-gray-200/50 bg-nav-clean sticky top-0 z-50 border-b shadow-sm backdrop-blur-xl transition-all duration-200 supports-[backdrop-filter]:bg-white/95"
	>
		<!-- Remove Ferrari accent line - no longer needed -->

		<div
			class="mx-auto flex h-14 w-full max-w-screen-xl items-center justify-between px-4 md:h-16 md:px-6 lg:px-8"
		>
			<a
				href="/"
				class="flex min-h-[44px] items-center py-2 font-semibold transition-all duration-300 hover:opacity-80"
			>
				<span class="text-ferrari-600 text-3xl font-bold md:text-3xl"> vec2art </span>
			</a>
			<nav class="flex items-center gap-2 md:gap-3">
				<!-- Desktop Navigation (hidden on mobile) -->
				<div class="hidden items-center gap-2 md:flex">
					<a
						href="/converter"
						use:preload
						class="focus:ring-ferrari-500 relative rounded-md px-4 py-2 text-sm font-medium transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:outline-none md:text-base {$page
							.url.pathname === '/converter'
							? 'border-ferrari-500/30 bg-ferrari-100 border font-medium text-gray-900 shadow-sm'
							: 'text-speed-gray-600 hover:bg-speed-gray-50 hover:text-speed-gray-900 border border-transparent hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]'}"
						aria-current={$page.url.pathname === '/converter' ? 'page' : undefined}
					>
						Converter
					</a>
					<a
						href="/gallery"
						use:preload
						class="focus:ring-ferrari-500 relative rounded-md px-4 py-2 text-sm font-medium transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:outline-none md:text-base {$page
							.url.pathname === '/gallery'
							? 'border-ferrari-500/30 bg-ferrari-100 border font-medium text-gray-900 shadow-sm'
							: 'text-speed-gray-600 hover:bg-speed-gray-50 hover:text-speed-gray-900 border border-transparent hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]'}"
						aria-current={$page.url.pathname === '/gallery' ? 'page' : undefined}
					>
						Gallery
					</a>
					<a
						href="/about"
						class="focus:ring-ferrari-500 relative rounded-md px-4 py-2 text-sm font-medium transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:outline-none md:text-base {$page
							.url.pathname === '/about'
							? 'border-ferrari-500/30 bg-ferrari-100 border font-medium text-gray-900 shadow-sm'
							: 'text-speed-gray-600 hover:bg-speed-gray-50 hover:text-speed-gray-900 border border-transparent hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]'}"
						aria-current={$page.url.pathname === '/about' ? 'page' : undefined}
					>
						About
					</a>
				</div>
				<!-- Desktop CTA Button -->
				<a
					href="/converter"
					use:preload
					class="btn-ferrari-primary shadow-ferrari-500/25 hover:animate-quick-lift hidden h-10 items-center justify-center gap-2 rounded-md px-6 text-sm font-semibold whitespace-nowrap text-white shadow-lg transition-colors focus:outline-none md:inline-flex"
				>
					Get Started
				</a>

				<!-- Mobile Menu Component -->
				<MobileMenu isOpen={mobileMenuOpen} onToggle={toggleMobileMenu} />
			</nav>
		</div>
	</header>

	<main id="main-content" class="flex-1">
		{@render children?.()}
	</main>
</div>

<!-- Toast Notifications -->
<ToastContainer />
