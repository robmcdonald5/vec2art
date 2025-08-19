<script lang="ts">
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
	onRemoveFile: (index: number) => void;
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
	onAddMore,
	onRemoveFile
}: Props = $props();
</script>

<!-- Preview Comparison -->
<PreviewComparison
	{files}
	{currentImageIndex}
	{currentProgress}
	{previewSvgUrls}
	{canConvert}
	{canDownload}
	{isProcessing}
	{onImageIndexChange}
	{onConvert}
	{onDownload}
	{onAbort}
	{onReset}
	{onAddMore}
	{onRemoveFile}
/>