<script lang="ts">
	import PreviewComparison from './PreviewComparison.svelte';
	import type { ProcessingProgress, ProcessingResult } from '$lib/types/vectorizer';
	import type { FileMetadata } from '$lib/stores/converter-persistence';
	import type { SettingsSyncMode } from '$lib/types/settings-sync';

	interface Props {
		files: File[];
		originalImageUrls: (string | null)[];
		filesMetadata: FileMetadata[];
		currentImageIndex: number;
		currentProgress?: ProcessingProgress;
		results: (ProcessingResult | null)[];
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
		isPanicked?: boolean;
		onEmergencyRecovery?: () => void;
		// Settings sync mode props
		settingsSyncMode?: SettingsSyncMode;
		onSettingsModeChange?: (mode: SettingsSyncMode) => void;
	}

	let {
		files,
		originalImageUrls,
		filesMetadata,
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
		onRemoveFile,
		isPanicked = false,
		onEmergencyRecovery,
		settingsSyncMode,
		onSettingsModeChange
	}: Props = $props();
</script>

<!-- Preview Comparison -->
<PreviewComparison
	{files}
	{originalImageUrls}
	{filesMetadata}
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
	{isPanicked}
	{onEmergencyRecovery}
	{settingsSyncMode}
	{onSettingsModeChange}
/>
