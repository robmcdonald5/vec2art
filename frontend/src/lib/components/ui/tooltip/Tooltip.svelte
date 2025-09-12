<script lang="ts">
	import { HelpCircle } from 'lucide-svelte';
	import { fade /*, scale */ } from 'svelte/transition';

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
	let tooltipElement = $state<HTMLDivElement>();
	let triggerElement = $state<HTMLButtonElement>();
	let _tooltipPosition = $state({ top: 0, left: 0 });

	// Calculate dynamic position for fixed positioning
	function _calculatePosition() {
		if (!triggerElement) return;

		const triggerRect = triggerElement.getBoundingClientRect();
		const offset = 8; // Gap between trigger and tooltip

		let top = 0;
		let left = 0;

		switch (position) {
			case 'top':
				top = triggerRect.top - offset;
				left = triggerRect.left + triggerRect.width / 2;
				break;
			case 'bottom':
				top = triggerRect.bottom + offset;
				left = triggerRect.left + triggerRect.width / 2;
				break;
			case 'left':
				top = triggerRect.top + triggerRect.height / 2;
				left = triggerRect.left - offset;
				break;
			case 'right':
				top = triggerRect.top + triggerRect.height / 2;
				left = triggerRect.right + offset;
				break;
		}

		console.log('Calculated position:', { top, left, triggerRect, position });
		_tooltipPosition = { top, left };
	}

	// Position calculations for transform classes
	const positionClasses = {
		top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
		bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
		left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
		right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
	};

	const arrowClasses = {
		top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-gray-900 border-b-0',
		bottom:
			'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-gray-900 border-t-0',
		left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-gray-900 border-r-0',
		right:
			'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-gray-900 border-l-0'
	};

	const sizeClasses = {
		sm: 'text-xs px-3 py-2 max-w-56 min-w-32',
		md: 'text-sm px-3 py-2 max-w-72 min-w-40',
		lg: 'text-base px-3 py-2 max-w-80 min-w-48'
	};

	function handleMouseEnter() {
		if (trigger === 'hover' && !disabled) {
			console.log('Mouse enter - showing tooltip');
			isVisible = true;
		}
	}

	function handleMouseLeave() {
		if (trigger === 'hover' && !disabled) {
			isVisible = false;
		}
	}

	function handleClick() {
		if (trigger === 'click' && !disabled) {
			isVisible = !isVisible;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			isVisible = false;
		}
	}

	// Close on outside click for click trigger
	$effect(() => {
		if (trigger === 'click' && isVisible) {
			const handleOutsideClick = (event: MouseEvent) => {
				if (
					tooltipElement &&
					triggerElement &&
					!tooltipElement.contains(event.target as Node) &&
					!triggerElement.contains(event.target as Node)
				) {
					isVisible = false;
				}
			};

			document.addEventListener('click', handleOutsideClick);
			return () => document.removeEventListener('click', handleOutsideClick);
		}
	});
</script>

<div class="relative inline-block">
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
		aria-describedby={isVisible ? 'tooltip-content' : undefined}
		{disabled}
	>
		<HelpCircle class="h-4 w-4" />
	</button>

	<!-- Tooltip Content -->
	{#if isVisible}
		<div
			bind:this={tooltipElement}
			id="tooltip-content"
			class="absolute z-[9999999] {positionClasses[position]} {sizeClasses[
				size
			]} rounded-lg bg-gray-900 text-white shadow-2xl"
			style="pointer-events: auto; isolation: isolate; will-change: auto; position: absolute !important;"
			role="tooltip"
			transition:fade={{ duration: 200 }}
		>
			<!-- Arrow -->
			<div class="absolute z-[9999999] h-0 w-0 border-4 {arrowClasses[position]}"></div>

			<!-- Content -->
			<div class="relative">
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
</div>
