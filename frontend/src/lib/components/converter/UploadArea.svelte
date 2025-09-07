<script lang="ts">
	import { Upload, FileImage, AlertCircle } from 'lucide-svelte';
	import { validateImageFiles } from '$lib/utils/file-validation';
	import type { FileUploadProps } from '$lib/types/shared-props';

	interface Props extends FileUploadProps {}

	let {
		onFilesSelect,
		disabled = false,
		maxSize = 1 * 1024 * 1024 * 1024, // 1GB
		accept = 'image/jpeg,image/png,image/webp,image/tiff,image/bmp,image/gif,image/avif'
	}: Props = $props();

	// Local state for drag and drop
	let fileInput: HTMLInputElement;
	let dragOver = $state(false);
	let errorMessage = $state('');
	let warningMessage = $state('');
	let successMessage = $state('');

	// Handle file validation and upload
	function handleFiles(newFiles: File[]) {
		if (disabled) return;

		errorMessage = '';
		warningMessage = '';
		successMessage = '';

		// Use the validation utility
		const { validFiles, errors, warnings } = validateImageFiles(newFiles);

		if (errors.length > 0) {
			errorMessage = errors.map((e) => `${e.file}: ${e.error}`).join('\n');
		}

		if (warnings.length > 0) {
			warningMessage = warnings.map((w) => `${w.file}: ${w.warning}`).join('\n');
		}

		if (validFiles.length > 0) {
			successMessage = `${validFiles.length} file(s) ready for conversion`;
			onFilesSelect?.(validFiles);
		}
	}

	// Event handlers
	function handleDragOver(event: DragEvent) {
		if (disabled) return;
		event.preventDefault();
		dragOver = true;
	}

	function handleDragLeave(event: DragEvent) {
		if (disabled) return;
		event.preventDefault();
		dragOver = false;
	}

	function handleDrop(event: DragEvent) {
		if (disabled) return;
		event.preventDefault();
		dragOver = false;

		const files = event.dataTransfer?.files;
		if (files && files.length > 0) {
			handleFiles(Array.from(files));
		}
	}

	function handleFileInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target.files;
		if (files && files.length > 0) {
			handleFiles(Array.from(files));
		}
	}

	function openFileDialog() {
		if (!disabled && fileInput) {
			fileInput.click();
		}
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}
</script>

<!-- Hidden file input -->
<input
	bind:this={fileInput}
	type="file"
	{accept}
	class="hidden"
	onchange={handleFileInput}
	{disabled}
	multiple
	data-testid="file-input"
/>

<div class="space-y-4">
	<!-- Error display -->
	{#if errorMessage}
		<div
			class="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950"
			role="alert"
		>
			<div class="flex items-center gap-2">
				<FileImage class="h-4 w-4 text-red-600" aria-hidden="true" />
				<span class="text-sm text-red-700 dark:text-red-300">{errorMessage}</span>
			</div>
		</div>
	{/if}

	{#if warningMessage}
		<div
			class="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950"
			role="alert"
		>
			<div class="flex items-center gap-2">
				<AlertCircle class="h-4 w-4 text-yellow-600" aria-hidden="true" />
				<span class="text-sm text-yellow-700 dark:text-yellow-300">{warningMessage}</span>
			</div>
		</div>
	{/if}

	<!-- Upload Dropzone -->
	<div
		class="card-ferrari-static flex min-h-[600px] cursor-pointer rounded-3xl border-2 border-dashed p-12 transition-all duration-300 hover:shadow-2xl
		{dragOver
			? 'border-ferrari-500 bg-ferrari-50/20 dark:bg-ferrari-950/20'
			: 'border-ferrari-200 dark:border-ferrari-800'}
		{disabled ? 'cursor-not-allowed opacity-50' : ''}"
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		ondrop={handleDrop}
		onclick={openFileDialog}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				openFileDialog();
			}
		}}
		role="button"
		tabindex={disabled ? -1 : 0}
		aria-label="Upload image files. Drag and drop or press Enter to browse."
	>
		<div class="flex w-full flex-col items-center justify-center space-y-6 text-center">
			<!-- Icon -->
			<div class="icon-ferrari-bg rounded-full p-6">
				<Upload class="h-12 w-12 text-white" aria-hidden="true" />
			</div>

			<!-- Content -->
			<div class="space-y-4">
				<h2 class="text-gradient-modern text-3xl font-bold">Upload Images</h2>
				<p class="text-converter-secondary max-w-md text-lg">
					Drag and drop your images here, or click to browse
				</p>
				<div class="space-y-2">
					<p class="text-ferrari-600 text-sm">Supports JPG, PNG, WebP, TIFF, BMP, GIF, AVIF</p>
				</div>
			</div>

			<!-- Visual hint and messages -->
			{#if dragOver}
				<div class="text-ferrari-600 animate-pulse text-sm font-medium">
					Drop files here to upload
				</div>
			{:else if errorMessage}
				<div class="mt-2 flex items-center gap-2 text-sm text-red-600">
					<AlertCircle class="h-4 w-4" />
					<span class="whitespace-pre-line">{errorMessage}</span>
				</div>
			{:else if warningMessage}
				<div class="mt-2 flex items-center gap-2 text-sm text-yellow-600">
					<AlertCircle class="h-4 w-4" />
					<span class="whitespace-pre-line">{warningMessage}</span>
				</div>
			{:else if successMessage}
				<div class="mt-2 text-sm text-green-600">
					{successMessage}
				</div>
			{/if}
		</div>
	</div>
</div>
