<script lang="ts">
import { HelpCircle } from 'lucide-svelte';
import { fade, scale } from 'svelte/transition';

interface Props {
	content: string;
	position?: 'top' | 'bottom' | 'left' | 'right';
	size?: 'sm' | 'md' | 'lg';
	trigger?: 'hover' | 'click';
	disabled?: boolean;
}

let { 
	content, 
	position = 'top', 
	size = 'md', 
	trigger = 'hover',
	disabled = false 
}: Props = $props();

let isVisible = $state(false);
let tooltipElement = $state<HTMLDivElement>();
let triggerElement = $state<HTMLButtonElement>();

// Position calculations
const positionClasses = {
	top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
	bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
	left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
	right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
};

const arrowClasses = {
	top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-gray-900 border-b-0',
	bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-gray-900 border-t-0',
	left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-gray-900 border-r-0',
	right: 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-gray-900 border-l-0'
};

const sizeClasses = {
	sm: 'text-xs px-2 py-1 max-w-48',
	md: 'text-sm px-3 py-2 max-w-64',
	lg: 'text-base px-4 py-3 max-w-80'
};

function handleMouseEnter() {
	if (trigger === 'hover' && !disabled) {
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
		class="inline-flex items-center justify-center w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors {disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-help'}"
		onmouseenter={handleMouseEnter}
		onmouseleave={handleMouseLeave}
		onclick={handleClick}
		onkeydown={handleKeydown}
		aria-label="Help information"
		aria-describedby={isVisible ? 'tooltip-content' : undefined}
		disabled={disabled}
	>
		<HelpCircle class="w-4 h-4" />
	</button>

	<!-- Tooltip Content -->
	{#if isVisible}
		<div
			bind:this={tooltipElement}
			id="tooltip-content"
			class="absolute z-50 {positionClasses[position]} {sizeClasses[size]} bg-gray-900 text-white rounded-lg shadow-lg pointer-events-none"
			role="tooltip"
			transition:fade={{ duration: 150 }}
		>
			<!-- Arrow -->
			<div class="absolute w-0 h-0 border-4 {arrowClasses[position]}"></div>
			
			<!-- Content -->
			<div class="relative">
				{content}
			</div>
		</div>
	{/if}
</div>