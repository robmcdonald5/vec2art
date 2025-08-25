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

	// Dynamic classes for trigger button with seamless dropdown connection
	const triggerClasses = $derived(
		[
			'w-full px-3 py-2.5 text-sm font-medium text-left',
			'bg-white border border-ferrari-200/30',
			'shadow-sm hover:shadow-md',
			'hover:bg-ferrari-50/10 hover:border-ferrari-300/40',
			'focus:outline-none',
			'disabled:cursor-not-allowed disabled:opacity-50',
			'transition-all duration-200',
			// Dynamic rounding and border: top corners when open, all corners when closed
			isOpen ? 'rounded-t-md border-b-ferrari-200/30' : 'rounded-md'
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
		style="z-index: 10; position: relative;"
		onclick={toggleDropdown}
		onkeydown={handleKeydown}
		{disabled}
		aria-expanded={isOpen}
		aria-haspopup="listbox"
		aria-controls="dropdown-listbox"
		role="combobox"
	>
		<div class="flex items-center justify-between">
			<span class="text-converter-primary block truncate">
				{selectedOption?.label || placeholder}
			</span>
			<span class="text-ferrari-600 ml-2 flex items-center">
				<ChevronDown
					class="h-4 w-4 transition-transform duration-300 {isOpen ? 'rotate-180' : 'rotate-0'}"
				/>
			</span>
		</div>
	</button>

	<!-- Dropdown Menu -->
	{#if isOpen}
		<div
			class="
			dropdown-animate-in border-ferrari-200/30 absolute top-full right-0
			left-0 z-50 max-h-60
			overflow-x-hidden overflow-y-auto rounded-b-md border-t-0 border-r
			border-b border-l bg-white shadow-lg
		"
		>
			<div role="listbox" id="dropdown-listbox">
				{#each options as option (option.value)}
					{@const isSelected = option.value === value}
					{@const optionClasses = [
						'w-full px-4 py-3 text-sm text-left',
						'focus:outline-none',
						'border-b border-ferrari-100/20 last:border-b-0',
						'disabled:opacity-50 disabled:cursor-not-allowed',
						'transition-all duration-200',
						'transform',
						isSelected
							? 'bg-ferrari-50/60 text-ferrari-900 font-semibold border-l-4 border-l-ferrari-500 shadow-sm'
							: 'text-converter-primary hover:bg-ferrari-50/40 hover:text-ferrari-700 hover:shadow-sm hover:scale-[1.02] focus:bg-ferrari-50/50 focus:text-ferrari-700 focus:shadow-md active:scale-[0.98]'
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
					>
						<div class="flex items-center justify-between">
							<span class="block truncate">{option.label}</span>
							{#if isSelected}
								<svg
									class="text-ferrari-600 h-4 w-4 flex-shrink-0"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-label="Selected"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="3"
										d="M5 13l4 4L19 7"
									/>
								</svg>
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
		animation: dropdownIn 250ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes dropdownIn {
		from {
			opacity: 0;
			transform: scaleY(0.95) translateY(-4px);
			transform-origin: top;
		}
		to {
			opacity: 1;
			transform: scaleY(1) translateY(0px);
			transform-origin: top;
		}
	}

	/* Custom scrollbar */
	div[role='listbox']::-webkit-scrollbar {
		width: 6px;
	}

	div[role='listbox']::-webkit-scrollbar-track {
		background: transparent;
	}

	div[role='listbox']::-webkit-scrollbar-thumb {
		background: rgba(255, 40, 0, 0.3);
		border-radius: 3px;
	}

	div[role='listbox']::-webkit-scrollbar-thumb:hover {
		background: rgba(255, 40, 0, 0.5);
	}
</style>
