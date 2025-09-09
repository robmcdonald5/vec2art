<script lang="ts">
	import PreviewComparison from './SimplifiedPreviewComparison.svelte';
	import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
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

	// Error boundary handler for preview comparison
	function handlePreviewError(error: Error, errorInfo: any) {
		console.error('❌ [ErrorBoundary] Preview comparison error:', error, errorInfo);
		toastStore.error(
			`Image display error: ${error.message}. Try refreshing or re-uploading the image.`
		);

		// Try to recover by resetting to the first image
		if (onImageIndexChange) {
			onImageIndexChange(0);
		}
	}
</script>

<!-- Preview Comparison with error boundary -->
<ErrorBoundary onError={handlePreviewError}>
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
</ErrorBoundary>
