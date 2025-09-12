<script lang="ts">
	import { HelpCircle } from 'lucide-svelte';
	import { computePosition, flip, shift, offset, autoUpdate } from '@floating-ui/dom';
	import { fade } from 'svelte/transition';
	import { onDestroy } from 'svelte';

	interface Props {
		content: string;
		title?: string;
		position?: 'top' | 'bottom' | 'left' | 'right';
		size?: 'sm' | 'md' | 'lg';
		trigger?: 'hover' | 'click';
		disabled?: boolean;
	}

	let {
		content,
		title,
		position = 'top',
		size = 'md',
		trigger = 'hover',
		disabled = false
	}: Props = $props();

	let isVisible = $state(false);
	let triggerElement = $state<HTMLButtonElement>();
	let tooltipElement = $state<HTMLDivElement>();
	let cleanupAutoUpdate = $state<() => void>();

	const sizeClasses = {
		sm: 'text-xs px-3 py-2 max-w-56 min-w-32',
		md: 'text-sm px-3 py-2 max-w-72 min-w-40',
		lg: 'text-base px-3 py-2 max-w-80 min-w-48'
	};

	// Position tooltip using Floating UI with auto-update
	function startPositioning() {
		if (!triggerElement || !tooltipElement) return;

		cleanupAutoUpdate = autoUpdate(triggerElement, tooltipElement, async () => {
			const { x, y } = await computePosition(triggerElement!, tooltipElement!, {
				placement: position,
				middleware: [
					offset(8), // 8px gap
					flip(), // Flip when there's no space
					shift({ padding: 8 }) // Shift to stay in viewport
				]
			});

			// Apply position to tooltip
			Object.assign(tooltipElement!.style, {
				left: `${x}px`,
				top: `${y}px`
			});
		});
	}

	function stopPositioning() {
		if (cleanupAutoUpdate) {
			cleanupAutoUpdate();
			cleanupAutoUpdate = undefined;
		}
	}

	async function showTooltip() {
		if (disabled) return;
		isVisible = true;
		// Wait for DOM update, then start positioning
		await new Promise((resolve) => setTimeout(resolve, 1));
		startPositioning();
	}

	function hideTooltip() {
		isVisible = false;
		stopPositioning();
	}

	function handleMouseEnter() {
		if (trigger === 'hover') {
			showTooltip();
		}
	}

	function handleMouseLeave() {
		if (trigger === 'hover') {
			hideTooltip();
		}
	}

	function handleClick() {
		if (trigger === 'click') {
			isVisible ? hideTooltip() : showTooltip();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			hideTooltip();
		}
	}

	// Handle click outside for click triggers
	$effect(() => {
		if (trigger === 'click' && isVisible) {
			const handleOutsideClick = (event: MouseEvent) => {
				if (
					tooltipElement &&
					triggerElement &&
					!tooltipElement.contains(event.target as Node) &&
					!triggerElement.contains(event.target as Node)
				) {
					hideTooltip();
				}
			};

			document.addEventListener('click', handleOutsideClick);
			return () => document.removeEventListener('click', handleOutsideClick);
		}
	});

	// Cleanup on destroy
	onDestroy(() => {
		stopPositioning();
	});
</script>

<!-- Trigger Button -->
<button
	bind:this={triggerElement}
	type="button"
	class="hover:text-ferrari-600 inline-flex h-4 w-4 items-center justify-center text-gray-400 transition-all duration-200 hover:scale-110 mobile-touch-target {disabled
		? 'cursor-not-allowed opacity-50'
		: 'cursor-help'}"
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	onclick={handleClick}
	onkeydown={handleKeydown}
	aria-label="Help information"
	aria-describedby={isVisible ? 'modern-tooltip-content' : undefined}
	{disabled}
>
	<HelpCircle class="h-4 w-4" />
</button>

<!-- Fixed Position Tooltip (escapes container overflow) -->
{#if isVisible}
	<div
		bind:this={tooltipElement}
		id="modern-tooltip-content"
		class="fixed z-[99999] {sizeClasses[
			size
		]} rounded-lg border border-gray-700/50 bg-gray-900 text-white shadow-2xl backdrop-blur-sm"
		style="top: 0; left: 0; width: max-content; max-width: 300px; pointer-events: none;"
		role="tooltip"
		transition:fade={{ duration: 150 }}
	>
		<!-- Content -->
		<div class="relative">
			{#if title}
				<div class="mb-2 border-b border-gray-600 pb-2">
					<h4 class="text-sm font-semibold text-white">{title}</h4>
				</div>
			{/if}

			<p
				class="m-0 text-sm leading-relaxed text-white"
				style="white-space: pre-wrap; text-wrap: balance; word-wrap: break-word;"
			>
				{content || ''}
			</p>
		</div>

		<!-- Arrow indicator (simplified) -->
		<div
			class="absolute h-2 w-2 rotate-45 border border-gray-700/50 bg-gray-900"
			style="top: -1px; left: 50%; transform: translateX(-50%) rotate(45deg);"
		></div>
	</div>
{/if}
