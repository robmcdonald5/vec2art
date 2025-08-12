<script lang="ts">
	import { Home, Image, Settings, HelpCircle } from 'lucide-svelte';

	let { children } = $props();
</script>

<div class="flex min-h-dvh">
	<!-- Sidebar -->
	<aside class="bg-background hidden w-64 border-r md:block">
		<div class="flex h-14 items-center border-b px-4">
			<a href="/" class="flex items-center gap-2 font-semibold">
				<div class="bg-primary flex h-8 w-8 items-center justify-center rounded">
					<span class="text-primary-foreground text-sm">V2A</span>
				</div>
				<span>vec2art</span>
			</a>
		</div>
		<nav class="space-y-1 p-4">
			<a href="/app" class="hover:bg-accent flex items-center gap-3 rounded-md px-3 py-2 text-sm">
				<Home class="h-4 w-4" />
				Dashboard
			</a>
			<a
				href="/app/converter"
				class="hover:bg-accent flex items-center gap-3 rounded-md px-3 py-2 text-sm"
			>
				<Image class="h-4 w-4" />
				Converter
			</a>
			<a
				href="/app/settings"
				class="hover:bg-accent flex items-center gap-3 rounded-md px-3 py-2 text-sm"
			>
				<Settings class="h-4 w-4" />
				Settings
			</a>
			<a
				href="/app/help"
				class="hover:bg-accent flex items-center gap-3 rounded-md px-3 py-2 text-sm"
			>
				<HelpCircle class="h-4 w-4" />
				Help
			</a>
		</nav>
	</aside>

	<!-- Main Content -->
	<div class="flex-1">
		<!-- Mobile Header -->
		<header class="bg-background/80 sticky top-0 z-40 border-b backdrop-blur md:hidden">
			<div class="flex h-14 items-center px-4">
				<a href="/" class="flex items-center gap-2 font-semibold">
					<div class="bg-primary flex h-8 w-8 items-center justify-center rounded">
						<span class="text-primary-foreground text-sm">V2A</span>
					</div>
					<span>vec2art</span>
				</a>
			</div>
		</header>

		<main class="p-4 sm:p-6 lg:p-8">
			{@render children?.()}
		</main>
	</div>
</div>
