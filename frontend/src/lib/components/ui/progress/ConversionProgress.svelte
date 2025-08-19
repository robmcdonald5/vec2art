<script lang="ts">
import { Loader2, Zap, Check } from 'lucide-svelte';
import type { ProcessingProgress } from '$lib/types/vectorizer';

interface Props {
	progress: ProcessingProgress | null;
	isProcessing: boolean;
}

let { progress = null, isProcessing = false }: Props = $props();

// Calculate overall progress percentage
const progressPercent = $derived.by(() => {
	if (!progress) return 0;
	
	switch (progress.stage) {
		case 'preprocessing':
			return progress.progress * 0.2; // 0-20%
		case 'processing':
			return 20 + (progress.progress * 0.6); // 20-80%
		case 'postprocessing':
			return 80 + (progress.progress * 0.2); // 80-100%
		default:
			return 0;
	}
});

// Stage labels
const stageLabel = $derived.by(() => {
	if (!progress) return 'Preparing...';
	
	switch (progress.stage) {
		case 'preprocessing':
			return 'Loading image...';
		case 'processing':
			return 'Converting to SVG...';
		case 'postprocessing':
			return 'Optimizing output...';
		default:
			return 'Processing...';
	}
});

// Format time
function formatTime(ms: number): string {
	if (ms < 1000) return `${Math.round(ms)}ms`;
	return `${(ms / 1000).toFixed(1)}s`;
}
</script>

{#if isProcessing && progress}
	<div class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
		<div class="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
			<!-- Header -->
			<div class="flex items-center justify-between mb-6">
				<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
					Converting Image
				</h3>
				<div class="flex items-center gap-2">
					<Zap class="h-5 w-5 text-ferrari-500 animate-pulse" />
					<span class="text-sm text-gray-600 dark:text-gray-400">
						{Math.round(progressPercent)}%
					</span>
				</div>
			</div>

			<!-- Progress Bar -->
			<div class="mb-4">
				<div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
					<div 
						class="h-full bg-gradient-to-r from-ferrari-500 to-red-600 transition-all duration-300 ease-out"
						style="width: {progressPercent}%"
					></div>
				</div>
			</div>

			<!-- Stage Info -->
			<div class="flex items-center justify-between mb-4">
				<div class="flex items-center gap-2">
					<Loader2 class="h-4 w-4 animate-spin text-ferrari-500" />
					<span class="text-sm font-medium text-gray-700 dark:text-gray-300">
						{stageLabel}
					</span>
				</div>
				{#if progress.elapsed_ms}
					<span class="text-xs text-gray-500 dark:text-gray-400">
						{formatTime(progress.elapsed_ms)}
					</span>
				{/if}
			</div>

			<!-- Details -->
			{#if progress.message}
				<div class="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
					{progress.message}
				</div>
			{/if}

			<!-- Stage Indicators -->
			<div class="flex items-center justify-between mt-6">
				<div class="flex items-center gap-1">
					<div class="flex items-center gap-1">
						<div class="w-2 h-2 rounded-full {progress.stage === 'preprocessing' || progress.stage === 'processing' || progress.stage === 'postprocessing' ? 'bg-green-500' : 'bg-gray-300'}"></div>
						<span class="text-xs text-gray-600 dark:text-gray-400">Load</span>
					</div>
				</div>
				<div class="flex items-center gap-1">
					<div class="w-2 h-2 rounded-full {progress.stage === 'processing' || progress.stage === 'postprocessing' ? 'bg-green-500' : 'bg-gray-300'}"></div>
					<span class="text-xs text-gray-600 dark:text-gray-400">Process</span>
				</div>
				<div class="flex items-center gap-1">
					<div class="w-2 h-2 rounded-full {progress.stage === 'postprocessing' ? 'bg-green-500' : 'bg-gray-300'}"></div>
					<span class="text-xs text-gray-600 dark:text-gray-400">Optimize</span>
				</div>
			</div>
		</div>
	</div>
{/if}