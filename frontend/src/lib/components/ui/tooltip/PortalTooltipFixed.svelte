<script lang="ts">
	import { HelpCircle } from 'lucide-svelte';
	// import { fade } from "svelte/transition";
	import { onMount, onDestroy } from 'svelte';

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
		position: _position = 'top',
		size = 'md',
		trigger = 'hover',
		disabled = false
	}: Props = $props();

	let isVisible = $state(false);
	let triggerElement = $state<HTMLButtonElement>();
	let tooltipElement = $state<HTMLDivElement>();
	let portalContainer = $state<HTMLDivElement>();
	let mouseInside = $state(false);

	const sizeClasses = {
		sm: 'text-xs px-3 py-2 max-w-56 min-w-32',
		md: 'text-sm px-3 py-2 max-w-72 min-w-40',
		lg: 'text-base px-3 py-2 max-w-80 min-w-48'
	};

	// Module-level global state for single tooltip instance
	let globalPortalContainer: HTMLDivElement | null = null;
	let globalCurrentTooltip: (() => void) | null = null;

	function ensureGlobalContainer() {
		if (!globalPortalContainer) {
			globalPortalContainer = document.createElement('div');
			globalPortalContainer.style.cssText = `
				position: absolute;
				top: 0;
				left: 0;
				z-index: 999999;
				pointer-events: none;
			`;
			globalPortalContainer.id = 'tooltip-portal';
			document.body.appendChild(globalPortalContainer);
		}
		return globalPortalContainer;
	}

	onMount(() => {
		portalContainer = ensureGlobalContainer();
	});

	onDestroy(() => {
		hideTooltip();
	});

	function updatePosition() {
		if (!triggerElement || !tooltipElement) return;

		const rect = triggerElement.getBoundingClientRect();
		const x = rect.right + 8;
		const y = rect.bottom + 8;

		// Ensure tooltip stays in viewport
		const maxX = window.innerWidth - tooltipElement.offsetWidth - 16;
		const maxY = window.innerHeight - tooltipElement.offsetHeight - 16;

		Object.assign(tooltipElement.style, {
			left: `${Math.min(x, maxX)}px`,
			top: `${Math.min(y, maxY)}px`
		});
	}

	function showTooltip() {
		if (disabled || !portalContainer) return;

		// Hide any existing tooltip
		if (globalCurrentTooltip) {
			globalCurrentTooltip();
		}

		globalCurrentTooltip = hideTooltip;
		isVisible = true;
		mouseInside = true;

		tooltipElement = document.createElement('div');
		tooltipElement.className = `fixed ${sizeClasses[size]} rounded-lg bg-gray-900 text-white shadow-2xl border border-gray-700/50 backdrop-blur-sm`;
		tooltipElement.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: max-content;
			max-width: 300px;
			pointer-events: auto;
			z-index: 999999;
		`;
		tooltipElement.role = 'tooltip';

		const contentHtml = `
			<div class="relative">
				${
					title
						? `
					<div class="mb-2 border-b border-gray-600 pb-2">
						<h4 class="text-sm font-semibold text-white">${title}</h4>
					</div>
				`
						: ''
				}
				<p class="m-0 text-sm text-white leading-relaxed" style="white-space: normal; text-align: left; word-wrap: break-word; line-height: 1.4;">
					${(content || '').replace(/\t/g, '').trim()}
				</p>
			</div>
		`;

		tooltipElement.innerHTML = contentHtml;
		portalContainer.appendChild(tooltipElement);

		// Add mouse events to tooltip itself
		tooltipElement.addEventListener('mouseenter', () => {
			mouseInside = true;
		});

		tooltipElement.addEventListener('mouseleave', () => {
			mouseInside = false;
			setTimeout(() => {
				if (!mouseInside) {
					hideTooltip();
				}
			}, 50);
		});

		// Position and set up listeners
		updatePosition();
		window.addEventListener('scroll', updatePosition, true);
		window.addEventListener('resize', updatePosition);
	}

	function hideTooltip() {
		if (!isVisible) return;

		isVisible = false;
		mouseInside = false;

		// Clear global state if this is the current tooltip
		if (globalCurrentTooltip === hideTooltip) {
			globalCurrentTooltip = null;
		}

		// Remove listeners
		window.removeEventListener('scroll', updatePosition, true);
		window.removeEventListener('resize', updatePosition);

		// Remove tooltip element
		if (tooltipElement && portalContainer?.contains(tooltipElement)) {
			portalContainer.removeChild(tooltipElement);
		}
		tooltipElement = undefined;
	}

	function handleMouseEnter() {
		if (trigger === 'hover' && !disabled) {
			mouseInside = true;
			showTooltip();
		}
	}

	function handleMouseLeave() {
		if (trigger === 'hover') {
			mouseInside = false;
			setTimeout(() => {
				if (!mouseInside) {
					hideTooltip();
				}
			}, 100);
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
	aria-describedby={isVisible ? 'portal-tooltip-content' : undefined}
	{disabled}
>
	<HelpCircle class="h-4 w-4" />
</button>
