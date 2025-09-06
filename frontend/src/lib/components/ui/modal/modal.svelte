<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { tick, onDestroy } from 'svelte';
	import { X } from 'lucide-svelte';
	import { lockBodyScroll } from '$lib/utils/scroll-lock';

	interface Props {
		open: boolean;
		onClose: () => void;
		class?: string;
		children?: any;
		title?: string;
		description?: string;
	}

	let {
		open = false,
		onClose,
		class: className = '',
		children,
		title,
		description
	}: Props = $props();

	let dialogElement = $state<HTMLElement>();
	let lastFocusedElement = $state<HTMLElement | null>(null);
	let unlockScroll: (() => void) | null = null;

	// Manage scroll lock when modal state changes
	$effect(() => {
		if (open && !unlockScroll) {
			// Lock body scroll when modal opens
			unlockScroll = lockBodyScroll();
		} else if (!open && unlockScroll) {
			// Unlock body scroll when modal closes
			unlockScroll();
			unlockScroll = null;
		}
	});

	// Focus management
	$effect(() => {
		if (open) {
			// Store the currently focused element
			lastFocusedElement = document.activeElement as HTMLElement;

			// Focus the modal after it's rendered
			tick().then(() => {
				if (dialogElement) {
					dialogElement.focus();
					trapFocus();
				}
			});
		} else if (lastFocusedElement) {
			// Restore focus when modal closes
			lastFocusedElement.focus();
			lastFocusedElement = null;
		}
	});

	// Safety cleanup: ensure body scroll is restored when component unmounts
	onDestroy(() => {
		if (unlockScroll) {
			unlockScroll();
			unlockScroll = null;
		}
	});

	function trapFocus() {
		if (!dialogElement) return;

		const focusableElements = dialogElement.querySelectorAll(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		);
		const firstFocusable = focusableElements[0] as HTMLElement;
		const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

		function handleTabKey(e: KeyboardEvent) {
			if (e.key !== 'Tab') return;

			if (e.shiftKey) {
				// Shift + Tab
				if (document.activeElement === firstFocusable) {
					lastFocusable?.focus();
					e.preventDefault();
				}
			} else {
				// Tab
				if (document.activeElement === lastFocusable) {
					firstFocusable?.focus();
					e.preventDefault();
				}
			}
		}

		dialogElement.addEventListener('keydown', handleTabKey);

		// Focus first focusable element
		firstFocusable?.focus();

		return () => {
			dialogElement?.removeEventListener('keydown', handleTabKey);
		};
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		transition:fade={{ duration: 200 }}
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby={title ? 'modal-title' : undefined}
		aria-describedby={description ? 'modal-description' : undefined}
		bind:this={dialogElement}
		tabindex="-1"
	>
		<!-- Backdrop -->
		<div class="absolute inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true"></div>

		<!-- Modal Content -->
		<div
			class="relative max-h-[90vh] w-full max-w-6xl overflow-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-900 {className}"
			transition:scale={{ duration: 200, start: 0.95 }}
		>
			<!-- Header with title if provided -->
			{#if title}
				<header class="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
					<h2 id="modal-title" class="text-xl font-semibold text-gray-900 dark:text-gray-100">
						{title}
					</h2>
					{#if description}
						<p id="modal-description" class="mt-1 text-sm text-gray-600 dark:text-gray-400">
							{description}
						</p>
					{/if}
				</header>
			{/if}

			<!-- Close Button -->
			<button
				onclick={onClose}
				class="focus:ring-ferrari-500 absolute top-4 right-4 z-10 rounded-full bg-gray-100 p-2 shadow-lg transition-colors hover:bg-gray-200 focus:ring-2 focus:outline-none"
				aria-label="Close modal"
			>
				<X class="h-6 w-6 text-gray-700" aria-hidden="true" />
			</button>

			<!-- Content -->
			<div class="h-full w-full" role="document">
				{@render children?.()}
			</div>
		</div>
	</div>
{/if}
