<script lang="ts">
	import { Image, Package, Info } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { slide } from 'svelte/transition';
	import { preload } from '$lib/utils/preload';

	interface Props {
		isOpen: boolean;
		onToggle: () => void;
	}

	let { isOpen, onToggle }: Props = $props();

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
		if (onToggle && isOpen) {
			onToggle();
		}
	}
</script>

<!-- Mobile Menu Wrapper with Relative Positioning -->
<div class="relative md:hidden">
	<!-- Hamburger Button -->
	<button
		onclick={onToggle}
		class="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:bg-gray-50 active:scale-95"
		aria-label={isOpen ? 'Close menu' : 'Open menu'}
		aria-expanded={isOpen}
		type="button"
	>
		<!-- Hamburger Icon with Animation -->
		<div class="flex flex-col items-center justify-center space-y-1">
			<span
				class="block h-0.5 w-5 rounded-full bg-gray-600 transition-all duration-300 {isOpen
					? 'translate-y-1.5 rotate-45'
					: ''}"
			></span>
			<span
				class="block h-0.5 w-5 rounded-full bg-gray-600 transition-all duration-300 {isOpen
					? 'opacity-0'
					: ''}"
			></span>
			<span
				class="block h-0.5 w-5 rounded-full bg-gray-600 transition-all duration-300 {isOpen
					? '-translate-y-1.5 -rotate-45'
					: ''}"
			></span>
		</div>
	</button>

	<!-- Mobile Dropdown Menu -->
	{#if isOpen}
		<div
			class="absolute top-full right-0 z-50 w-80 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
			transition:slide={{ duration: 250 }}
		>
			<!-- Navigation Links -->
			<nav class="py-2">
				<ul class="space-y-1">
					{#each navItems as item (item.href)}
						{@const IconComponent = item.icon}
						<li>
							<a
								href={item.href}
								use:preload
								onclick={handleNavClick}
								class="flex items-center gap-3 px-4 py-3 text-base font-medium transition-colors hover:bg-gray-50 {isActive(
									item.href
								)
									? 'bg-ferrari-50 text-ferrari-700 border-ferrari-500 border-l-4'
									: 'text-gray-700'}"
								aria-current={isActive(item.href) ? 'page' : undefined}
							>
								<IconComponent class="h-5 w-5" />
								<span>{item.label}</span>
							</a>
						</li>
					{/each}
				</ul>

				<!-- CTA Section -->
				<div class="mt-4 border-t border-gray-200 px-4 pt-4">
					<a
						href="/converter"
						use:preload
						onclick={handleNavClick}
						class="from-ferrari-500 to-ferrari-600 hover:from-ferrari-600 hover:to-ferrari-700 block w-full rounded-lg bg-gradient-to-r px-4 py-3 text-center font-medium text-white shadow-lg transition-all duration-200 hover:shadow-xl active:scale-95"
					>
						Start Converting
					</a>
				</div>
			</nav>
		</div>
	{/if}
</div>
