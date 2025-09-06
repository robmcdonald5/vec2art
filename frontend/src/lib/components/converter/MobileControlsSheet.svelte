<script lang="ts">
	import { onDestroy } from 'svelte';
	import { X, Settings, ChevronUp, ChevronDown } from 'lucide-svelte';
	import { lockBodyScroll } from '$lib/utils/scroll-lock';
	import type {
		VectorizerConfig,
		VectorizerPreset,
		VectorizerBackend
	} from '$lib/types/vectorizer';
	import BackendSelector from './BackendSelector.svelte';
	import PresetSelector from './PresetSelector.svelte';
	import ParameterPanel from './ParameterPanel.svelte';
	import AdvancedControls from './AdvancedControls.svelte';

	interface MobileControlsSheetProps {
		isOpen: boolean;
		onClose: () => void;
		config: VectorizerConfig;
		onConfigChange: (configUpdates: Partial<VectorizerConfig>) => void;
		selectedPreset: VectorizerPreset | 'custom';
		onPresetChange: (presetValue: VectorizerPreset | 'custom') => void;
		onBackendChange: (backendValue: VectorizerBackend) => void;
		disabled?: boolean;
		onParameterChange?: () => void;
	}

	let {
		isOpen,
		onClose,
		config,
		onConfigChange,
		selectedPreset,
		onPresetChange,
		onBackendChange,
		disabled = false,
		onParameterChange
	}: MobileControlsSheetProps = $props();

	// Sheet height control
	let sheetHeight = $state<'collapsed' | 'partial' | 'full'>('partial');
	let sheetElement: HTMLElement;
	let startY = 0;
	let currentY = 0;
	let isDragging = false;

	function handleTouchStart(event: TouchEvent) {
		startY = event.touches[0].clientY;
		currentY = startY;
		isDragging = true;
	}

	function handleTouchMove(event: TouchEvent) {
		if (!isDragging) return;

		currentY = event.touches[0].clientY;
		const deltaY = currentY - startY;

		// Prevent scrolling when dragging sheet
		if (Math.abs(deltaY) > 10) {
			event.preventDefault();
		}
	}

	function handleTouchEnd() {
		if (!isDragging) return;

		const deltaY = currentY - startY;
		const threshold = 50;

		if (deltaY > threshold) {
			// Swiping down
			if (sheetHeight === 'full') {
				sheetHeight = 'partial';
			} else if (sheetHeight === 'partial') {
				sheetHeight = 'collapsed';
			} else {
				onClose();
			}
		} else if (deltaY < -threshold) {
			// Swiping up
			if (sheetHeight === 'collapsed') {
				sheetHeight = 'partial';
			} else if (sheetHeight === 'partial') {
				sheetHeight = 'full';
			}
		}

		isDragging = false;
		startY = 0;
		currentY = 0;
	}

	function toggleSheetHeight() {
		if (sheetHeight === 'collapsed') {
			sheetHeight = 'partial';
		} else if (sheetHeight === 'partial') {
			sheetHeight = 'full';
		} else {
			sheetHeight = 'partial';
		}
	}

	// Close sheet when clicking backdrop
	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	// Prevent body scroll when sheet is open using robust scroll lock utility
	let unlockScroll: (() => void) | null = null;

	$effect(() => {
		if (isOpen && !unlockScroll) {
			// Lock body scroll and store unlock function
			unlockScroll = lockBodyScroll();
		} else if (!isOpen && unlockScroll) {
			// Unlock body scroll when sheet closes
			unlockScroll();
			unlockScroll = null;
		}
	});

	// Safety cleanup: ensure body scroll is restored when component unmounts
	onDestroy(() => {
		if (unlockScroll) {
			unlockScroll();
			unlockScroll = null;
		}
	});
</script>

<!-- Mobile Bottom Sheet -->
{#if isOpen}
	<div
		class="fixed inset-0 z-50 lg:hidden"
		onclick={handleBackdropClick}
		role="dialog"
		aria-modal="true"
		aria-labelledby="mobile-controls-title"
	>
		<!-- Backdrop -->
		<div class="absolute inset-0 bg-black/50 transition-opacity duration-300"></div>

		<!-- Sheet -->
		<div
			bind:this={sheetElement}
			class="bg-background absolute right-0 bottom-0 left-0 transform rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out
				{sheetHeight === 'collapsed' ? 'translate-y-[calc(100%-120px)]' : ''}
				{sheetHeight === 'partial' ? 'translate-y-[calc(100%-60vh)]' : ''}
				{sheetHeight === 'full' ? 'translate-y-[calc(100%-90vh)]' : ''}"
			ontouchstart={handleTouchStart}
			ontouchmove={handleTouchMove}
			ontouchend={handleTouchEnd}
		>
			<!-- Handle Bar -->
			<div class="flex cursor-pointer touch-none justify-center py-3" onclick={toggleSheetHeight}>
				<div class="bg-muted-foreground/30 h-1 w-12 rounded-full"></div>
			</div>

			<!-- Header -->
			<div class="flex items-center justify-between border-b px-4 pb-4">
				<div class="flex items-center gap-2">
					<Settings class="text-primary h-5 w-5" aria-hidden="true" />
					<h2 id="mobile-controls-title" class="text-lg font-semibold">Conversion Settings</h2>
				</div>
				<div class="flex items-center gap-2">
					<button
						onclick={toggleSheetHeight}
						class="hover:bg-accent rounded-lg p-2 transition-colors"
						aria-label={sheetHeight === 'full' ? 'Collapse controls' : 'Expand controls'}
					>
						{#if sheetHeight === 'full'}
							<ChevronDown class="h-4 w-4" aria-hidden="true" />
						{:else}
							<ChevronUp class="h-4 w-4" aria-hidden="true" />
						{/if}
					</button>
					<button
						onclick={onClose}
						class="hover:bg-accent rounded-lg p-2 transition-colors"
						aria-label="Close settings"
					>
						<X class="h-4 w-4" aria-hidden="true" />
					</button>
				</div>
			</div>

			<!-- Content -->
			<div
				class="overflow-y-auto overscroll-contain"
				style="height: {sheetHeight === 'collapsed'
					? '60px'
					: sheetHeight === 'partial'
						? 'calc(60vh - 120px)'
						: 'calc(90vh - 120px)'}"
			>
				<div class="pb-safe space-y-6 p-4">
					<!-- Quick Summary (always visible) -->
					{#if sheetHeight === 'collapsed'}
						<div class="text-muted-foreground text-center text-sm">
							{config.backend.charAt(0).toUpperCase() + config.backend.slice(1)} •
							{selectedPreset === 'custom'
								? 'Custom'
								: selectedPreset.charAt(0).toUpperCase() + selectedPreset.slice(1)} • Detail {Math.round(
								config.detail * 9 + 1
							)}/10
						</div>
					{:else}
						<!-- Algorithm Selection -->
						<BackendSelector selectedBackend={config.backend} {onBackendChange} {disabled} />

						<!-- Style Preset Selection -->
						<PresetSelector
							{selectedPreset}
							{onPresetChange}
							{disabled}
							isCustom={selectedPreset === 'custom'}
						/>

						<!-- Essential Parameters -->
						<ParameterPanel {config} {onConfigChange} {disabled} {onParameterChange} />

						<!-- Advanced Controls (only in full height) -->
						{#if sheetHeight === 'full'}
							<AdvancedControls {config} {onConfigChange} {disabled} {onParameterChange} />
						{/if}
					{/if}
				</div>
			</div>

			<!-- Sheet Height Indicator -->
			<div class="absolute top-4 right-4 flex gap-1">
				<div
					class="h-2 w-2 rounded-full {sheetHeight === 'collapsed' ? 'bg-primary' : 'bg-muted'}"
				></div>
				<div
					class="h-2 w-2 rounded-full {sheetHeight === 'partial' ? 'bg-primary' : 'bg-muted'}"
				></div>
				<div
					class="h-2 w-2 rounded-full {sheetHeight === 'full' ? 'bg-primary' : 'bg-muted'}"
				></div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Safe area padding for mobile devices */
	.pb-safe {
		padding-bottom: env(safe-area-inset-bottom, 1rem);
	}

	/* Enhance touch targets for mobile */
	@media (max-width: 1024px) {
		button {
			min-height: 44px;
			min-width: 44px;
		}

		input[type='range'] {
			height: 44px;
		}

		input[type='checkbox'] {
			width: 20px;
			height: 20px;
		}
	}

	/* Improve scrolling on mobile */
	.overscroll-contain {
		overscroll-behavior: contain;
		-webkit-overflow-scrolling: touch;
	}

	/* Custom scrollbar for mobile */
	@media (max-width: 1024px) {
		.overflow-y-auto::-webkit-scrollbar {
			width: 4px;
		}

		.overflow-y-auto::-webkit-scrollbar-track {
			background: transparent;
		}

		.overflow-y-auto::-webkit-scrollbar-thumb {
			background: hsl(var(--muted-foreground) / 0.3);
			border-radius: 2px;
		}
	}
</style>
