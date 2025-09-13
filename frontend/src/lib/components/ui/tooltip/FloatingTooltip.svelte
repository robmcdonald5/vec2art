<script lang="ts">
	import { HelpCircle } from 'lucide-svelte';
	import { computePosition, flip, shift, offset, arrow } from '@floating-ui/dom';
	import { fade } from 'svelte/transition';

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
	let arrowElement = $state<HTMLDivElement>();

	const sizeClasses = {
		sm: 'text-xs px-3 py-2 max-w-56 min-w-32',
		md: 'text-sm px-3 py-2 max-w-72 min-w-40',
		lg: 'text-base px-3 py-2 max-w-80 min-w-48'
	};

	// Position tooltip using Floating UI
	async function positionTooltip() {
		if (!triggerElement || !tooltipElement) return;

		const { x, y, placement, middlewareData } = await computePosition(
			triggerElement,
			tooltipElement,
			{
				placement: position,
				middleware: [
					offset(8), // 8px gap
					flip(), // Flip when there's no space
					shift({ padding: 8 }), // Shift to stay in viewport
					arrow({ element: arrowElement! }) // Arrow pointing to trigger
				]
			}
		);

		// Apply position to tooltip
		Object.assign(tooltipElement.style, {
			left: `${x}px`,
			top: `${y}px`
		});

		// Position arrow
		if (arrowElement && middlewareData.arrow) {
			const { x: arrowX, y: arrowY } = middlewareData.arrow;
			const side = placement.split('-')[0];

			const staticSide = {
				top: 'bottom',
				right: 'left',
				bottom: 'top',
				left: 'right'
			}[side];

			Object.assign(arrowElement.style, {
				left: arrowX != null ? `${arrowX}px` : '',
				top: arrowY != null ? `${arrowY}px` : '',
				right: '',
				bottom: '',
				[staticSide!]: '-4px'
			});

			// Set arrow colors based on side
			const arrowClasses = {
				top: 'border-l-transparent border-r-transparent border-t-gray-900 border-b-0',
				bottom: 'border-l-transparent border-r-transparent border-b-gray-900 border-t-0',
				left: 'border-t-transparent border-b-transparent border-l-gray-900 border-r-0',
				right: 'border-t-transparent border-b-transparent border-r-gray-900 border-l-0'
			};

			arrowElement.className = `absolute w-0 h-0 border-4 ${arrowClasses[side as keyof typeof arrowClasses]}`;
		}
	}

	async function showTooltip() {
		if (disabled) return;
		isVisible = true;
		// Wait for DOM update, then position
		await new Promise((resolve) => setTimeout(resolve, 1));
		await positionTooltip();
	}

	function hideTooltip() {
		isVisible = false;
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

	// Reposition on window resize
	$effect(() => {
		if (isVisible) {
			const handleResize = () => positionTooltip();
			window.addEventListener('resize', handleResize);
			return () => window.removeEventListener('resize', handleResize);
		}
	});
</script>

<!-- Trigger Button -->
<button
	bind:this={triggerElement}
	type="button"
	class="hover:text-ferrari-600 inline-flex h-4 w-4 items-center justify-center text-gray-400 transition-all duration-200 hover:scale-110 {disabled
		? 'cursor-not-allowed opacity-50'
		: 'cursor-help'}"
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	onclick={handleClick}
	onkeydown={handleKeydown}
	aria-label="Help information"
	aria-describedby={isVisible ? 'floating-tooltip-content' : undefined}
	{disabled}
>
	<HelpCircle class="h-4 w-4" />
</button>

<!-- Portal Tooltip (rendered at document body level) -->
{#if isVisible}
	<div
		bind:this={tooltipElement}
		id="floating-tooltip-content"
		class="fixed z-[9999] {sizeClasses[
			size
		]} rounded-lg border border-gray-700 bg-gray-900 text-white shadow-2xl"
		style="top: 0; left: 0; width: max-content;"
		role="tooltip"
		transition:fade={{ duration: 200 }}
	>
		<!-- Arrow -->
		<div bind:this={arrowElement} class="absolute h-0 w-0 border-4"></div>

		<!-- Content -->
		<div class="relative z-10">
			{#if title}
				<div class="mb-2 border-b border-gray-600 pb-2">
					<h4 class="text-sm font-semibold text-white">{title}</h4>
				</div>
			{/if}

			<p
				class="m-0 text-sm text-white"
				style="line-height: 1.5; white-space: pre-wrap; text-wrap: balance; word-wrap: break-word;"
			>
				{content || ''}
			</p>
		</div>
	</div>
{/if}
