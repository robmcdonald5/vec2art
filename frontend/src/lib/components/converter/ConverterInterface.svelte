<script lang="ts">
import { Play, Download, Square, Upload, RotateCcw, Plus } from 'lucide-svelte';
import { Button } from '$lib/components/ui/button';
import PreviewComparison from './PreviewComparison.svelte';
import type { ProcessingProgress, ProcessingResult } from '$lib/types/vectorizer';

interface Props {
	files: File[];
	currentImageIndex: number;
	currentProgress?: ProcessingProgress;
	results: ProcessingResult[];
	previewSvgUrls: (string | null)[];
	canConvert: boolean;
	canDownload: boolean;
	isProcessing: boolean;
	onImageIndexChange: (index: number) => void;
	onConvert: () => void;
	onDownload: () => void;
	onAbort: () => void;
	onReset: () => void;
	onAddMore: () => void;
}

let {
	files,
	currentImageIndex,
	currentProgress,
	results,
	previewSvgUrls,
	canConvert,
	canDownload,
	isProcessing,
	onImageIndexChange,
	onConvert,
	onDownload,
	onAbort,
	onReset,
	onAddMore
}: Props = $props();
</script>

<div class="space-y-6">
	<!-- Preview Comparison -->
	<PreviewComparison
		{files}
		{currentImageIndex}
		{currentProgress}
		{previewSvgUrls}
		{onImageIndexChange}
	/>

	<!-- Action Buttons -->
	<div class="flex flex-wrap items-center justify-between gap-4 bg-ferrari-50/50 dark:bg-ferrari-950/50 rounded-2xl p-6">
		<!-- File Management Actions -->
		<div class="flex gap-3">
			<Button
				variant="outline"
				size="sm"
				class="border-ferrari-300 dark:border-ferrari-600 hover:bg-ferrari-50 dark:hover:bg-ferrari-900"
				onclick={onAddMore}
				disabled={isProcessing}
			>
				<Plus class="h-4 w-4" />
				Add More
			</Button>
			<Button
				variant="outline"
				size="sm"
				class="border-ferrari-300 dark:border-ferrari-600 hover:bg-ferrari-50 dark:hover:bg-ferrari-900"
				onclick={onReset}
				disabled={isProcessing}
			>
				<RotateCcw class="h-4 w-4" />
				Clear All
			</Button>
		</div>

		<!-- Primary Actions -->
		<div class="flex gap-3">
			{#if canDownload}
				<Button
					variant="default"
					size="sm"
					class="bg-ferrari-600 hover:bg-ferrari-700 text-white shadow-lg"
					onclick={onDownload}
					disabled={isProcessing}
				>
					<Download class="h-4 w-4" />
					Download SVG
				</Button>
			{/if}
			
			{#if isProcessing}
				<Button
					variant="destructive"
					size="sm"
					onclick={onAbort}
				>
					<Square class="h-4 w-4" />
					Stop
				</Button>
			{:else if canConvert}
				<Button
					variant="default"
					size="sm"
					class="bg-gradient-to-r from-ferrari-600 to-red-600 hover:from-ferrari-700 hover:to-red-700 text-white shadow-lg"
					onclick={onConvert}
					disabled={!canConvert}
				>
					<Play class="h-4 w-4" />
					Convert to SVG
				</Button>
			{/if}
		</div>
	</div>
</div>