<script lang="ts">
	import { Undo2, Redo2, History, RotateCcw } from 'lucide-svelte';
	import { parameterHistory } from '$lib/stores/parameter-history.svelte';

	interface Props {
		onConfigChange: (_config: any) => void;
		disabled?: boolean;
	}

	let { onConfigChange, disabled = false }: Props = $props();

	function handleUndo() {
		if (disabled || !parameterHistory.canUndo) return;

		const previousConfig = parameterHistory.undo();
		if (previousConfig) {
			onConfigChange(previousConfig);
		}
	}

	function handleRedo() {
		if (disabled || !parameterHistory.canRedo) return;

		const nextConfig = parameterHistory.redo();
		if (nextConfig) {
			onConfigChange(nextConfig);
		}
	}

	function handleReset() {
		if (disabled) return;

		const history = parameterHistory.getHistory();
		if (history.length > 0) {
			const initialConfig = history[0].config;
			onConfigChange(structuredClone(initialConfig));
			// Push reset action to history
			parameterHistory.push(initialConfig, 'Reset to initial');
		}
	}

	// Keyboard shortcuts
	function handleKeydown(event: KeyboardEvent) {
		if (disabled) return;

		// Check for Ctrl/Cmd + Z (undo) and Ctrl/Cmd + Y (redo)
		if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === 'z') {
			event.preventDefault();
			handleUndo();
		} else if (
			(event.ctrlKey || event.metaKey) &&
			((event.shiftKey && event.key.toLowerCase() === 'z') || event.key.toLowerCase() === 'y')
		) {
			event.preventDefault();
			handleRedo();
		}
	}

	// Mount keyboard listeners
	import { onMount } from 'svelte';
	onMount(() => {
		document.addEventListener('keydown', handleKeydown);
		return () => document.removeEventListener('keydown', handleKeydown);
	});
</script>

<div
	class="flex items-center gap-1 rounded-lg border border-gray-200 bg-white/90 p-1 backdrop-blur-sm"
>
	<!-- Undo Button -->
	<button
		onclick={handleUndo}
		disabled={disabled || !parameterHistory.canUndo}
		class="rounded-md p-2 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
		title={parameterHistory.getUndoPreview() || 'Undo (Ctrl+Z)'}
		aria-label="Undo parameter change"
	>
		<Undo2 class="h-4 w-4 text-gray-600" />
	</button>

	<!-- Redo Button -->
	<button
		onclick={handleRedo}
		disabled={disabled || !parameterHistory.canRedo}
		class="rounded-md p-2 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
		title={parameterHistory.getRedoPreview() || 'Redo (Ctrl+Y)'}
		aria-label="Redo parameter change"
	>
		<Redo2 class="h-4 w-4 text-gray-600" />
	</button>

	<!-- Divider -->
	<div class="h-6 w-px bg-gray-300"></div>

	<!-- Reset Button -->
	<button
		onclick={handleReset}
		{disabled}
		class="rounded-md p-2 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
		title="Reset to initial parameters"
		aria-label="Reset parameters"
	>
		<RotateCcw class="h-4 w-4 text-gray-600" />
	</button>

	<!-- History Indicator -->
	<div class="flex items-center gap-1 px-2 text-xs text-gray-500">
		<History class="h-3 w-3" />
		<span title={parameterHistory.getCurrentDescription()}>
			{parameterHistory.getHistory().length}
		</span>
	</div>
</div>
