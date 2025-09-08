<script lang="ts">
	import PreviewComparison from './SimplifiedPreviewComparison.svelte';
	import type { ConverterComponentProps } from '$lib/types/shared-props';

	interface Props extends ConverterComponentProps {}

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
	{results}
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
