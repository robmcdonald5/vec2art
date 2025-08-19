<script lang="ts">
import { Menu, X, Image, Package, Info, ChevronRight } from 'lucide-svelte';
import { page } from '$app/stores';
import { fly, fade } from 'svelte/transition';

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
	class="md:hidden relative z-50 p-2 rounded-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
		class="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
		onclick={onToggle}
		aria-label="Close menu"
		transition:fade={{ duration: 200 }}
	></button>
{/if}

<!-- Mobile Menu Panel -->
{#if isOpen}
	<nav
		class="md:hidden fixed top-0 right-0 h-full w-72 bg-white dark:bg-gray-900 shadow-2xl z-40 overflow-y-auto"
		transition:fly={{ x: 300, duration: 300 }}
		aria-label="Mobile navigation"
	>
		<div class="p-6 pt-20">
			<!-- Logo/Title -->
			<div class="mb-8">
				<h2 class="text-2xl font-bold bg-gradient-to-r from-ferrari-500 to-red-600 bg-clip-text text-transparent">
					vec2art
				</h2>
				<p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
					Image to SVG Converter
				</p>
			</div>

			<!-- Navigation Links -->
			<ul class="space-y-2">
				{#each navItems as item}
					{@const IconComponent = item.icon}
					<li>
						<a
							href={item.href}
							onclick={handleNavClick}
							class="flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200
								{isActive(item.href)
									? 'bg-gradient-to-r from-ferrari-50 to-red-50 dark:from-ferrari-900/20 dark:to-red-900/20 text-ferrari-600 dark:text-ferrari-400 font-medium'
									: 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}"
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
				onclick={handleNavClick}
				class="block w-full px-4 py-3 text-center rounded-lg bg-gradient-to-r from-ferrari-500 to-red-600 text-white font-medium hover:from-ferrari-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
			>
				Start Converting
			</a>

			<!-- Footer Info -->
			<div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
				<p class="text-xs text-gray-500 dark:text-gray-400 text-center">
					© 2025 vec2art
				</p>
				<p class="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
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