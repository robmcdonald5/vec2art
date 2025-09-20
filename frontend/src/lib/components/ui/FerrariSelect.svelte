<script lang="ts">
	import { ChevronDown } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { computePosition, flip, shift } from '@floating-ui/dom';

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
		id?: string;
		label?: string;
		description?: string;
		onchange?: (_value: string) => void;
		class?: string;
	}

	let {
		value = '',
		options = [],
		placeholder = 'Select an option',
		disabled = false,
		id,
		label,
		description,
		onchange,
		class: className = ''
	}: Props = $props();

	let isOpen = $state(false);
	let selectedOption = $derived(options.find((opt) => opt.value === value));
	let dropdownElement = $state<HTMLDivElement>();
	let triggerElement = $state<HTMLButtonElement>();

	// Keep track of elements we've modified overflow on
	let modifiedElements: Element[] = [];

	async function _updatePosition() {
		if (!triggerElement || !dropdownElement) return;

		const { x, y } = await computePosition(triggerElement, dropdownElement, {
			middleware: [flip(), shift({ padding: 8 })]
		});

		Object.assign(dropdownElement.style, {
			left: `${x}px`,
			top: `${y}px`
		});
	}

	// Manage overflow on parent containers
	function manageParentOverflow(enable: boolean) {
		if (!triggerElement) return;

		// Reset any previously modified elements
		modifiedElements.forEach((el) => {
			(el as HTMLElement).style.overflow = '';
		});
		modifiedElements = [];

		if (enable) {
			// Find and modify parent containers with overflow hidden
			let current = triggerElement.parentElement;
			while (current && current !== document.body) {
				const computedStyle = window.getComputedStyle(current);
				if (
					computedStyle.overflow === 'hidden' ||
					computedStyle.overflowY === 'hidden' ||
					computedStyle.overflowX === 'hidden'
				) {
					modifiedElements.push(current);
					(current as HTMLElement).style.overflow = 'visible';
				}
				current = current.parentElement;
			}
		}
	}

	function toggleDropdown() {
		if (disabled) return;
		console.log('toggleDropdown called, isOpen:', isOpen);

		if (!isOpen) {
			// Opening dropdown
			manageParentOverflow(true);
			isOpen = true;
		} else {
			// Closing dropdown
			manageParentOverflow(false);
			isOpen = false;
		}
	}

	function selectOption(option: SelectOption) {
		if (option.disabled) return;
		// Closing dropdown - restore overflow
		manageParentOverflow(false);
		isOpen = false;
		onchange?.(option.value);
	}

	// Simple debugging effect
	$effect(() => {
		console.log('isOpen changed to:', isOpen);
	});

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
				break;
			case 'ArrowDown':
			case 'ArrowUp':
				if (!isOpen) {
					event.preventDefault();
					toggleDropdown();
				}
				break;
		}
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as Node;
		// Check if click is outside both trigger and dropdown
		if (
			triggerElement &&
			!triggerElement.contains(target) &&
			dropdownElement &&
			!dropdownElement.contains(target)
		) {
			// Closing dropdown - restore overflow
			manageParentOverflow(false);
			isOpen = false;
		}
	}

	onMount(() => {
		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
			// Cleanup overflow modifications when component unmounts
			manageParentOverflow(false);
		};
	});
</script>

<div class="ferrari-select {className}">
	{#if label}
		<label for={id} class="text-converter-primary mb-2 block text-sm font-medium">
			{label}
		</label>
	{/if}

	<div class="relative">
		<button
			bind:this={triggerElement}
			type="button"
			{id}
			class="ferrari-select-trigger border-ferrari-300 focus:border-ferrari-500 relative w-full cursor-pointer border bg-white py-2 pr-10 pl-3 text-left shadow-sm transition-colors duration-200 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-50 {isOpen
				? 'border-ferrari-500 rounded-t-lg rounded-b-none border-b-0'
				: 'rounded-lg'}"
			{disabled}
			aria-haspopup="listbox"
			aria-expanded={isOpen}
			onclick={toggleDropdown}
			onkeydown={handleKeydown}
		>
			<span class="text-converter-primary block truncate text-sm">
				{selectedOption?.label || placeholder}
			</span>
			<span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
				<ChevronDown
					class="text-converter-secondary h-4 w-4 transition-transform duration-200 {isOpen
						? 'rotate-180'
						: ''}"
				/>
			</span>
		</button>

		<!-- Simplified dropdown for debugging -->
		{#if isOpen}
			<div
				bind:this={dropdownElement}
				class="ferrari-select-dropdown border-ferrari-500 absolute z-[9999] mt-0 max-h-60 w-full overflow-auto rounded-t-none rounded-b-lg border border-t bg-white py-1 shadow-lg focus:outline-none"
			>
				{#each options as option (option.value)}
					<button
						type="button"
						class="ferrari-select-option hover:bg-ferrari-50 focus:bg-ferrari-50 relative w-full cursor-pointer py-2 pr-9 pl-3 text-left text-sm transition-colors duration-150 select-none focus:outline-none {option.disabled
							? 'cursor-not-allowed opacity-50'
							: ''} {option.value === value
							? 'bg-ferrari-100 text-ferrari-700 font-medium'
							: 'text-converter-primary'}"
						disabled={option.disabled}
						onclick={() => selectOption(option)}
					>
						<span class="block truncate">{option.label}</span>
						{#if option.value === value}
							<span class="text-ferrari-600 absolute inset-y-0 right-0 flex items-center pr-3">
								<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
							</span>
						{/if}
					</button>
				{/each}
			</div>
		{/if}
	</div>

	{#if description}
		<p class="text-converter-secondary mt-1 text-xs">
			{description}
		</p>
	{/if}
</div>

<style>
	.ferrari-select-trigger:hover:not(:disabled) {
		border-color: #b91c2e;
	}

	.ferrari-select-option:hover:not(:disabled) {
		background-color: rgba(220, 20, 60, 0.05);
	}

	.ferrari-select-dropdown {
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.1),
			0 4px 6px -2px rgba(0, 0, 0, 0.05);
	}
</style>
