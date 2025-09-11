<script lang="ts">
	import { ChevronDown } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import type { SettingsSyncMode } from '$lib/types/settings-sync';
	import { SETTINGS_SYNC_MODES } from '$lib/types/settings-sync';

	interface SettingsModeSelectorProps {
		currentMode: SettingsSyncMode;
		totalImages: number;
		onModeChange: (_selectedMode: SettingsSyncMode) => void;
		disabled?: boolean;
	}

	let {
		currentMode,
		totalImages,
		onModeChange,
		disabled = false
	}: SettingsModeSelectorProps = $props();

	let isOpen = $state(false);
	let showTooltip = $state(false);
	let hoveredMode: SettingsSyncMode | null = $state(null);
	let dropdownElement: HTMLDivElement = $state()!;
	let triggerElement: HTMLButtonElement = $state()!;
	let tooltipElement: HTMLDivElement = $state()!;

	// Get the selected mode info
	const selectedMode = $derived(SETTINGS_SYNC_MODES[currentMode]);

	// Find the longest mode name to ensure consistent dropdown width
	const longestModeName = $derived(() => {
		return Object.values(SETTINGS_SYNC_MODES)
			.map((mode) => mode.name)
			.reduce((longest, current) => (current.length > longest.length ? current : longest), '');
	});

	function toggleDropdown() {
		if (disabled) return;
		isOpen = !isOpen;
		if (!isOpen) {
			showTooltip = false;
			hoveredMode = null;
		}
	}

	function selectMode(mode: SettingsSyncMode) {
		if (mode === currentMode || disabled) return;
		onModeChange(mode);
		isOpen = false;
		showTooltip = false;
		hoveredMode = null;
	}

	function handleMouseEnter(mode: SettingsSyncMode) {
		if (!disabled && isOpen) {
			hoveredMode = mode;
			showTooltip = true;
		}
	}

	function handleMouseLeave() {
		showTooltip = false;
		hoveredMode = null;
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
		}
	}

	function handleClickOutside(event: Event) {
		if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
			isOpen = false;
			showTooltip = false;
			hoveredMode = null;
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
			'h-8 px-3 text-xs font-medium text-left',
			'bg-background border border-ferrari-300',
			'shadow-sm hover:shadow-md',
			'hover:bg-ferrari-50 hover:border-ferrari-400',
			'focus:outline-none',
			'disabled:cursor-not-allowed disabled:opacity-50',
			'transition-all duration-200',
			'dark:border-ferrari-600 dark:hover:bg-ferrari-900 dark:hover:border-ferrari-500',
			// Dynamic rounding: top corners when open, all corners when closed
			isOpen ? 'rounded-t-md border-b-ferrari-200/30' : 'rounded-md'
		]
			.filter(Boolean)
			.join(' ')
	);

	// Calculate fixed width based on longest option to prevent size changes
	const fixedWidth = $derived(() => {
		// More precise character width calculation for text-xs font-medium
		const charWidth = 7; // Slightly wider for medium weight
		const padding = 24; // px-3 = 12px each side
		const chevronSpace = 24; // Space for chevron icon + margin
		const calculatedWidth = longestModeName.length * charWidth + padding + chevronSpace;
		// Ensure minimum width and round up to prevent text overflow
		return Math.max(140, Math.ceil(calculatedWidth / 10) * 10);
	});
</script>

<!-- Custom dropdown - only show when multiple images -->
{#if totalImages > 1}
	<div bind:this={dropdownElement} class="relative">
		<!-- Trigger Button -->
		<button
			bind:this={triggerElement}
			type="button"
			class={triggerClasses}
			style="width: {fixedWidth}px;"
			onclick={toggleDropdown}
			onkeydown={handleKeydown}
			{disabled}
			aria-expanded={isOpen}
			aria-haspopup="listbox"
			aria-controls="settings-mode-listbox"
			role="combobox"
		>
			<div class="flex items-center justify-between">
				<span class="text-converter-primary block truncate">
					{selectedMode.name}
				</span>
				<ChevronDown
					class="text-ferrari-600 ml-2 h-3 w-3 flex-shrink-0 transition-transform duration-300 {isOpen
						? 'rotate-180'
						: 'rotate-0'}"
				/>
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
				<div role="listbox" id="settings-mode-listbox">
					{#each Object.values(SETTINGS_SYNC_MODES) as mode (mode.id)}
						{@const isSelected = mode.id === currentMode}
						{@const optionClasses = [
							'w-full px-3 py-2 text-xs text-left',
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
							onclick={() => selectMode(mode.id)}
							onmouseenter={() => handleMouseEnter(mode.id)}
							onmouseleave={handleMouseLeave}
							{disabled}
							role="option"
							aria-selected={isSelected}
						>
							<div class="flex items-center justify-between">
								<span class="block truncate">{mode.name}</span>
								{#if isSelected}
									<svg
										class="text-ferrari-600 h-3 w-3 flex-shrink-0"
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

		<!-- Hover Tooltip - positioned to the right -->
		{#if showTooltip && hoveredMode}
			{@const tooltipMode = SETTINGS_SYNC_MODES[hoveredMode]}
			<div
				bind:this={tooltipElement}
				class="border-ferrari-200/50 dark:bg-ferrari-900 dark:border-ferrari-700 absolute top-0 left-full z-60 ml-2 w-80 max-w-sm rounded-lg border bg-white shadow-lg"
				role="tooltip"
				aria-describedby="mode-tooltip"
			>
				<div class="p-3">
					<div class="mb-2 flex items-center gap-2">
						<h4 class="text-converter-primary text-sm font-semibold">
							{tooltipMode.name}
						</h4>
					</div>
					<p class="text-ferrari-600 dark:text-ferrari-300 text-xs leading-relaxed">
						{tooltipMode.description}
					</p>
				</div>
			</div>
		{/if}
	</div>
{/if}

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
		width: 4px;
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
