<script lang="ts">
	import { Menu, X, Image, Package, Info, ChevronRight } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { fly, fade } from 'svelte/transition';
	import { preload } from '$lib/utils/preload';

	interface Props {
		isOpen?: boolean;
		onToggle?: () => void;
	}

	let { isOpen = false, onToggle }: Props = $props();

	// Navigation items
	const navItems = [
		{ href: '/converter', label: 'Converter', icon: Image },
		{ href: '/gallery', label: 'Gallery', icon: Package },
		{ href: '/about', label: 'About', icon: Info }
	];

	// Determine if a link is active
	function isActive(href: string): boolean {
		return $page.url.pathname === href;
	}

	// Handle navigation click
	function handleNavClick() {
		// Close menu after navigation on mobile
		if (onToggle && isOpen) {
			onToggle();
		}
	}
</script>

<!-- Mobile Menu Button (visible on small screens) -->
<button
	onclick={onToggle}
	class="relative z-50 rounded-lg border border-gray-200 bg-white/80 p-2 backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-gray-50 hover:shadow-sm active:scale-95 md:hidden dark:border-gray-700 dark:bg-gray-900/80 dark:hover:bg-gray-800"
	aria-label={isOpen ? 'Close menu' : 'Open menu'}
	aria-expanded={isOpen}
>
	{#if isOpen}
		<X class="h-6 w-6 text-gray-700 dark:text-gray-300" />
	{:else}
		<Menu class="h-6 w-6 text-gray-700 dark:text-gray-300" />
	{/if}
</button>

<!-- Mobile Menu Overlay -->
{#if isOpen}
	<button
		class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
		onclick={onToggle}
		aria-label="Close menu"
		transition:fade={{ duration: 200 }}
	></button>
{/if}

<!-- Mobile Menu Panel -->
{#if isOpen}
	<nav
		class="fixed top-0 right-0 z-40 h-full w-72 overflow-y-auto bg-white shadow-2xl md:hidden dark:bg-gray-900"
		transition:fly={{ x: 300, duration: 300 }}
		aria-label="Mobile navigation"
	>
		<div class="p-6 pt-20">
			<!-- Logo/Title -->
			<div class="mb-8">
				<h2
					class="from-ferrari-500 bg-gradient-to-r to-red-600 bg-clip-text text-2xl font-bold text-transparent"
				>
					vec2art
				</h2>
				<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Image to SVG Converter</p>
			</div>

			<!-- Navigation Links -->
			<ul class="space-y-2">
				{#each navItems as item}
					{@const IconComponent = item.icon}
					<li>
						<a
							href={item.href}
							use:preload
							onclick={handleNavClick}
							class="flex items-center justify-between rounded-lg px-4 py-3 transition-all duration-200
								{isActive(item.href)
								? 'from-ferrari-600 dark:from-ferrari-600 to-ferrari-700 dark:to-ferrari-700 bg-gradient-to-r font-medium text-white shadow-sm dark:text-white'
								: 'text-gray-700 hover:scale-[1.01] hover:bg-gray-100 hover:shadow-sm active:scale-[0.99] dark:text-gray-300 dark:hover:bg-gray-800'}"
							aria-current={isActive(item.href) ? 'page' : undefined}
						>
							<div class="flex items-center gap-3">
								<IconComponent class="h-5 w-5" />
								<span>{item.label}</span>
							</div>
							{#if isActive(item.href)}
								<ChevronRight class="h-4 w-4" />
							{/if}
						</a>
					</li>
				{/each}
			</ul>

			<!-- Divider -->
			<div class="my-6 border-t border-gray-200 dark:border-gray-700"></div>

			<!-- CTA Button -->
			<a
				href="/converter"
				use:preload
				onclick={handleNavClick}
				class="from-ferrari-500 hover:from-ferrari-600 block w-full rounded-lg bg-gradient-to-r to-red-600 px-4 py-3 text-center font-medium text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:to-red-700 hover:shadow-xl active:scale-[0.98]"
			>
				Start Converting
			</a>

			<!-- Footer Info -->
			<div class="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
				<p class="text-center text-xs text-gray-500 dark:text-gray-400">© 2025 vec2art</p>
				<p class="mt-1 text-center text-xs text-gray-500 dark:text-gray-400">
					Powered by Rust WASM
				</p>
			</div>
		</div>
	</nav>
{/if}

<style>
	/* Prevent body scroll when menu is open */
	:global(body.menu-open) {
		overflow: hidden;
	}
</style>
