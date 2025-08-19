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

// Define keyboard shortcuts
const shortcuts = $derived<Shortcut[]>([
	{
		key: 'c',
		displayKey: 'C',
		description: 'Convert images',
		action: () => onConvert?.(),
		enabled: canConvert && !isProcessing
	},
	{
		key: 'd',
		displayKey: 'D',
		description: 'Download current SVG',
		action: () => onDownload?.(),
		enabled: canDownload && !isProcessing
	},
	{
		key: 'r',
		displayKey: 'R',
		description: 'Reset converter',
		action: () => onReset?.(),
		enabled: !isProcessing
	},
	{
		key: 'escape',
		displayKey: 'Esc',
		description: 'Abort processing',
		action: () => onAbort?.(),
		enabled: isProcessing
	},
	{
		key: 'a',
		displayKey: 'A',
		description: 'Add more images',
		action: () => onAddMore?.(),
		enabled: !isProcessing
	},
	{
		key: '?',
		displayKey: '?',
		description: 'Show/hide keyboard shortcuts',
		action: () => showHelp = !showHelp,
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
	const shortcut = shortcuts.find(s => s.key === pressedKey);
	
	if (shortcut && shortcut.enabled) {
		event.preventDefault();
		shortcut.action();
	}

	// Toggle help with ? key
	if (event.key === '?' && !event.shiftKey) {
		event.preventDefault();
		onToggleHelp?.();
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
		onclick={() => showHelp = false}
		role="dialog"
		aria-labelledby="shortcuts-title"
		aria-modal="true"
	>
		<div 
			class="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="flex items-center justify-between mb-4">
				<div class="flex items-center gap-2">
					<Keyboard class="h-5 w-5 text-red-600" />
					<h2 id="shortcuts-title" class="text-lg font-semibold text-gray-900 dark:text-gray-100">
						Keyboard Shortcuts
					</h2>
				</div>
				<button
					onclick={() => showHelp = false}
					class="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
					aria-label="Close shortcuts help"
				>
					<X class="h-4 w-4 text-gray-500" />
				</button>
			</div>

			<!-- Shortcuts list -->
			<div class="space-y-3">
				{#each shortcuts as shortcut}
					<div 
						class="flex items-center justify-between py-2 px-3 rounded-lg {
							shortcut.enabled 
								? 'bg-gray-50 dark:bg-gray-800' 
								: 'bg-gray-100 dark:bg-gray-800/50 opacity-50'
						}"
					>
						<span class="text-sm text-gray-700 dark:text-gray-300">
							{shortcut.description}
						</span>
						<kbd 
							class="px-2 py-1 text-xs font-mono bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded border {
								shortcut.enabled ? '' : 'opacity-50'
							}"
						>
							{shortcut.displayKey || shortcut.key.toUpperCase()}
						</kbd>
					</div>
				{/each}
			</div>

			<!-- Footer -->
			<div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
				<p class="text-xs text-gray-500 dark:text-gray-400 text-center">
					Press <kbd class="px-1 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">?</kbd> 
					to toggle this help
				</p>
			</div>
		</div>
	</div>
{/if}

<!-- Floating shortcut hint -->
<div class="fixed bottom-4 left-4 z-20">
	<button
		onclick={() => showHelp = !showHelp}
		class="flex items-center gap-2 px-3 py-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-900 transition-colors text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
		aria-label="Show keyboard shortcuts"
	>
		<Keyboard class="h-4 w-4" />
		<span class="hidden sm:inline">Shortcuts</span>
		<kbd class="px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">?</kbd>
	</button>
</div>