<script lang="ts">
	import { onMount } from 'svelte';
	import { Keyboard, X } from 'lucide-svelte';

	interface Props {
		onConvert?: () => void;
		onDownload?: () => void;
		onReset?: () => void;
		onAbort?: () => void;
		onAddMore?: () => void;
		onToggleHelp?: () => void;
		canConvert?: boolean;
		canDownload?: boolean;
		isProcessing?: boolean;
	}

	interface Shortcut {
		id: string;
		key: string;
		description: string;
		action: () => void;
		enabled: boolean;
		displayKey?: string;
	}

	let {
		onConvert,
		onDownload,
		onReset,
		onAbort,
		onAddMore,
		onToggleHelp,
		canConvert = false,
		canDownload = false,
		isProcessing = false
	}: Props = $props();

	let showHelp = $state(false);
	// No scroll lock needed - modal uses fixed positioning

	// Define keyboard shortcuts
	const shortcuts = $derived<Shortcut[]>([
		{
			id: 'convert',
			key: 'c',
			displayKey: 'C',
			description: 'Convert images',
			action: () => onConvert?.(),
			enabled: canConvert && !isProcessing
		},
		{
			id: 'download',
			key: 'd',
			displayKey: 'D',
			description: 'Download current SVG',
			action: () => onDownload?.(),
			enabled: canDownload && !isProcessing
		},
		{
			id: 'reset',
			key: 'r',
			displayKey: 'R',
			description: 'Reset converter',
			action: () => onReset?.(),
			enabled: !isProcessing
		},
		{
			id: 'abort',
			key: 'escape',
			displayKey: 'Esc',
			description: 'Abort processing',
			action: () => onAbort?.(),
			enabled: isProcessing
		},
		{
			id: 'add-more',
			key: 'a',
			displayKey: 'A',
			description: 'Add more images',
			action: () => onAddMore?.(),
			enabled: !isProcessing
		},
		{
			id: 'help',
			key: 'h',
			displayKey: 'H',
			description: 'Show/hide keyboard shortcuts',
			action: () => (showHelp = !showHelp),
			enabled: true
		}
	]);

	function handleKeydown(event: KeyboardEvent) {
		// Don't interfere with typing in input fields
		if (
			event.target instanceof HTMLInputElement ||
			event.target instanceof HTMLTextAreaElement ||
			event.target instanceof HTMLSelectElement ||
			(event.target as HTMLElement)?.contentEditable === 'true'
		) {
			return;
		}

		// Handle shortcuts
		const pressedKey = event.key.toLowerCase();
		const shortcut = shortcuts.find((s) => s.key === pressedKey);

		if (shortcut && shortcut.enabled) {
			event.preventDefault();
			shortcut.action();
		}

		// Toggle help with H key
		if (event.key === 'h' && !event.shiftKey) {
			event.preventDefault();
			showHelp = !showHelp;
		}
	}

	// Mount keyboard event listeners
	onMount(() => {
		document.addEventListener('keydown', handleKeydown);

		return () => {
			document.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

<!-- Keyboard shortcuts help overlay -->
{#if showHelp}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
		onclick={() => (showHelp = false)}
		role="dialog"
		aria-labelledby="shortcuts-title"
		aria-modal="true"
	>
		<div
			class="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-900"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="mb-4 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<Keyboard class="h-5 w-5 text-red-600" />
					<h2 id="shortcuts-title" class="text-lg font-semibold text-gray-900 dark:text-gray-100">
						Keyboard Shortcuts
					</h2>
				</div>
				<button
					onclick={() => (showHelp = false)}
					class="rounded-lg p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
					aria-label="Close shortcuts help"
				>
					<X class="h-4 w-4 text-gray-500" />
				</button>
			</div>

			<!-- Shortcuts list -->
			<div class="space-y-3">
				{#each shortcuts as shortcut (shortcut.id)}
					<div
						class="flex items-center justify-between rounded-lg px-3 py-2 {shortcut.enabled
							? 'bg-gray-50 dark:bg-gray-800'
							: 'bg-gray-100 opacity-50 dark:bg-gray-800/50'}"
					>
						<span class="text-sm text-gray-700 dark:text-gray-300">
							{shortcut.description}
						</span>
						<kbd
							class="rounded border bg-gray-200 px-2 py-1 font-mono text-xs text-gray-800 dark:bg-gray-700 dark:text-gray-200 {shortcut.enabled
								? ''
								: 'opacity-50'}"
						>
							{shortcut.displayKey || shortcut.key.toUpperCase()}
						</kbd>
					</div>
				{/each}
			</div>

			<!-- Footer -->
			<div class="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
				<p class="text-center text-xs text-gray-500 dark:text-gray-400">
					Press <kbd class="rounded bg-gray-200 px-1 py-0.5 text-xs dark:bg-gray-700">H</kbd>
					to toggle this help
				</p>
			</div>
		</div>
	</div>
{/if}

<!-- Floating shortcut hint -->
<div class="fixed bottom-4 left-4 z-20">
	<button
		onclick={() => (showHelp = !showHelp)}
		class="flex items-center gap-2 rounded-lg border border-gray-200 bg-white/90 px-3 py-2 text-sm text-gray-600 shadow-lg backdrop-blur-sm transition-colors hover:bg-white hover:text-gray-900 dark:border-gray-700 dark:bg-gray-900/90 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-gray-100"
		aria-label="Show keyboard shortcuts"
	>
		<Keyboard class="h-4 w-4" />
		<span class="hidden sm:inline">Shortcuts</span>
		<kbd class="rounded bg-gray-200 px-1.5 py-0.5 text-xs dark:bg-gray-700">H</kbd>
	</button>
</div>
