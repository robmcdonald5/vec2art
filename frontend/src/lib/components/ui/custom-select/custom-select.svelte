<script lang="ts">
	import { ChevronDown, ChevronUp } from 'lucide-svelte';
	import { onMount } from 'svelte';

	interface SelectOption {
		value: string;
		label: string;
		disabled?: boolean;
	}

	interface Props {
		value: string;
		options: SelectOption[];
		placeholder?: string;
		disabled?: boolean;
		onchange?: (value: string) => void;
	}

	let {
		value = '',
		options = [],
		placeholder = 'Select an option',
		disabled = false,
		onchange
	}: Props = $props();

	let isOpen = $state(false);
	let selectedOption = $derived(options.find((opt) => opt.value === value));
	let dropdownElement: HTMLDivElement;
	let triggerElement: HTMLButtonElement;

	function toggleDropdown() {
		if (disabled) return;
		isOpen = !isOpen;
	}

	function selectOption(option: SelectOption) {
		if (option.disabled) return;

		value = option.value;
		isOpen = false;
		onchange?.(option.value);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (disabled) return;

		switch (event.key) {
			case 'Enter':
			case ' ':
				event.preventDefault();
				toggleDropdown();
				break;
			case 'Escape':
				isOpen = false;
				triggerElement?.focus();
				break;
			case 'ArrowDown':
				event.preventDefault();
				if (!isOpen) {
					toggleDropdown();
				} else {
					const currentIndex = options.findIndex((opt) => opt.value === value);
					const nextIndex = Math.min(currentIndex + 1, options.length - 1);
					if (options[nextIndex] && !options[nextIndex].disabled) {
						selectOption(options[nextIndex]);
					}
				}
				break;
			case 'ArrowUp':
				event.preventDefault();
				if (isOpen) {
					const currentIndex = options.findIndex((opt) => opt.value === value);
					const prevIndex = Math.max(currentIndex - 1, 0);
					if (options[prevIndex] && !options[prevIndex].disabled) {
						selectOption(options[prevIndex]);
					}
				}
				break;
		}
	}

	function handleClickOutside(event: Event) {
		if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
			isOpen = false;
		}
	}

	onMount(() => {
		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});

	// Dynamic classes for trigger button
	const triggerClasses = $derived(
		[
			'w-full px-3 py-2.5 text-sm font-medium text-left',
			'bg-gradient-to-r from-orange-50/80 to-red-50/80',
			'dark:from-orange-950/40 dark:to-red-950/40',
			'border border-orange-200/60 dark:border-orange-700/40',
			'shadow-sm',
			'hover:from-orange-100/90 hover:to-red-100/90',
			'dark:hover:from-orange-900/50 dark:hover:to-red-900/50',
			'hover:border-orange-300 dark:hover:border-orange-600',
			'focus:outline-none',
			'disabled:cursor-not-allowed disabled:opacity-50',
			'transition-all duration-200 backdrop-blur-sm',
			// Dynamic border radius and border states
			isOpen
				? 'rounded-t-md border-orange-400 dark:border-orange-500 border-b-transparent'
				: 'rounded-md',
			isOpen ? 'from-orange-100/90 to-red-100/90 dark:from-orange-900/50 dark:to-red-900/50' : ''
		]
			.filter(Boolean)
			.join(' ')
	);
</script>

<div bind:this={dropdownElement} class="relative w-full">
	<!-- Trigger Button -->
	<button
		bind:this={triggerElement}
		type="button"
		class={triggerClasses}
		onclick={toggleDropdown}
		onkeydown={handleKeydown}
		{disabled}
		aria-expanded={isOpen}
		aria-haspopup="listbox"
		aria-controls="dropdown-listbox"
		role="combobox"
	>
		<div class="flex items-center justify-between">
			<span class="block truncate" style="color: #1f2937 !important;">
				{selectedOption?.label || placeholder}
			</span>
			<span class="ml-2 flex items-center text-orange-600 dark:text-orange-400">
				{#if isOpen}
					<ChevronUp class="h-4 w-4 transition-transform duration-200" />
				{:else}
					<ChevronDown class="h-4 w-4 transition-transform duration-200" />
				{/if}
			</span>
		</div>
	</button>

	<!-- Dropdown Menu -->
	{#if isOpen}
		<div
			class="
			dropdown-animate-in absolute top-full right-0 left-0
			z-50 max-h-60 overflow-y-auto
			rounded-b-md border-r
			border-b border-l
			border-orange-200/60 bg-gradient-to-b from-white/95 to-orange-50/95 shadow-2xl
			backdrop-blur-xl backdrop-saturate-150
			dark:border-orange-700/40 dark:from-gray-900/95
			dark:to-orange-950/95
		"
		>
			<div role="listbox" id="dropdown-listbox">
				{#each options as option (option.value)}
					{@const isSelected = option.value === value}
					{@const optionClasses = [
						'w-full px-4 py-3 text-sm text-left',
						'hover:bg-gradient-to-r hover:from-orange-500/20 hover:to-red-500/20',
						'dark:hover:from-orange-600/25 dark:hover:to-red-600/25',
						'hover:text-orange-900 dark:hover:text-orange-100',
						'focus:bg-gradient-to-r focus:from-orange-500/30 focus:to-red-500/30',
						'dark:focus:from-orange-600/35 dark:focus:to-red-600/35',
						'focus:outline-none focus:text-orange-900 dark:focus:text-orange-100',
						'border-b border-orange-100/30 dark:border-orange-800/30 last:border-b-0',
						'disabled:opacity-50 disabled:cursor-not-allowed',
						'transition-all duration-150',
						isSelected
							? 'bg-gradient-to-r from-orange-500/25 to-red-500/25 dark:from-orange-600/30 dark:to-red-600/30'
							: '',
						isSelected ? 'font-medium' : ''
					]
						.filter(Boolean)
						.join(' ')}

					<button
						type="button"
						class={optionClasses}
						onclick={() => selectOption(option)}
						disabled={option.disabled}
						role="option"
						aria-selected={isSelected}
						style="color: #1f2937 !important;"
					>
						<div class="flex items-center justify-between">
							<span class="block truncate" style="color: #1f2937 !important;">{option.label}</span>
							{#if isSelected}
								<span
									class="h-2 w-2 flex-shrink-0 rounded-full bg-orange-600 dark:bg-orange-400"
									aria-label="Selected"
								></span>
							{/if}
						</div>
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.dropdown-animate-in {
		animation: dropdownIn 200ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes dropdownIn {
		from {
			opacity: 0;
			transform: scaleY(0.95);
			transform-origin: top;
		}
		to {
			opacity: 1;
			transform: scaleY(1);
			transform-origin: top;
		}
	}

	/* CRITICAL FIX: Force visible text for browser compatibility */
	span {
		color: #1f2937 !important;
		opacity: 1 !important;
		-webkit-text-fill-color: #1f2937 !important;
	}

	/* Custom scrollbar */
	div[role='listbox']::-webkit-scrollbar {
		width: 6px;
	}

	div[role='listbox']::-webkit-scrollbar-track {
		background: transparent;
	}

	div[role='listbox']::-webkit-scrollbar-thumb {
		background: rgba(251, 146, 60, 0.3);
		border-radius: 3px;
	}

	div[role='listbox']::-webkit-scrollbar-thumb:hover {
		background: rgba(251, 146, 60, 0.5);
	}
</style>
