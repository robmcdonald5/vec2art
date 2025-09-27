<script lang="ts">
	import { ChevronDown, type Icon } from 'lucide-svelte';
	import type { ComponentType } from 'svelte';

	interface Props {
		title: string;
		icon: ComponentType<Icon>;
		iconColorClass: string;
		backgroundGradient: string;
		expanded: boolean;
		onToggle: () => void;
		disabled?: boolean;
		children?: any;
	}

	let {
		title,
		icon: IconComponent,
		iconColorClass,
		backgroundGradient,
		expanded = false,
		onToggle,
		disabled = false,
		children
	}: Props = $props();
</script>

<div
	class="border-speed-gray-200 bg-speed-white dark:border-speed-gray-700 dark:bg-speed-gray-800 overflow-hidden rounded-lg border"
>
	<button
		type="button"
		onclick={onToggle}
		class="hover:bg-speed-gray-50 dark:hover:bg-speed-gray-700 flex w-full items-center justify-between px-4 py-3 text-left transition-colors"
		{disabled}
	>
		<div class="flex items-center gap-3">
			<div class="flex h-8 w-8 items-center justify-center rounded-lg {backgroundGradient}">
				<IconComponent class="h-4 w-4 {iconColorClass}" />
			</div>
			<span class="text-speed-gray-900 dark:text-speed-gray-100 text-sm font-medium">
				{title}
			</span>
		</div>
		<ChevronDown
			class="text-speed-gray-400 h-4 w-4 transition-transform duration-200 {expanded
				? 'rotate-180'
				: ''}"
		/>
	</button>

	{#if expanded}
		<div class="border-speed-gray-200 dark:border-speed-gray-700 border-t px-4 py-4">
			<div class="space-y-4">
				{@render children?.()}
			</div>
		</div>
	{/if}
</div>
