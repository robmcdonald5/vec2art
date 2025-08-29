<script lang="ts">
	import { Upload, X, AlertCircle } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		accept?: string;
		maxSize?: number; // in bytes
		onFileSelect?: (file: File) => void;
		disabled?: boolean;
		currentFile?: File | null;
	}

	let {
		accept = 'image/*',
		maxSize = 1 * 1024 * 1024 * 1024, // 1GB
		onFileSelect,
		disabled = false,
		currentFile = null
	}: Props = $props();

	let dragOver = $state(false);
	let fileInput: HTMLInputElement;
	let announceText = $state<string>('');
	let errorMessage = $state<string>('');

	// Accessibility functions
	function announceToScreenReader(message: string) {
		announceText = message;
		setTimeout(() => {
			announceText = '';
		}, 1000);
	}

	function showError(message: string) {
		errorMessage = message;
		announceToScreenReader(`Error: ${message}`);
		setTimeout(() => {
			errorMessage = '';
		}, 5000);
	}

	function handleDragOver(event: DragEvent) {
		if (disabled) return;
		event.preventDefault();
		if (!dragOver) {
			dragOver = true;
			announceToScreenReader('File dragged over upload area');
		}
	}

	function handleDragLeave() {
		dragOver = false;
	}

	function handleDrop(event: DragEvent) {
		if (disabled) return;
		event.preventDefault();
		dragOver = false;

		const files = event.dataTransfer?.files;
		if (files && files.length > 0) {
			announceToScreenReader('File dropped');
			handleFile(files[0]);
		} else {
			announceToScreenReader('No valid file dropped');
		}
	}

	function handleFileInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target.files;
		if (files && files.length > 0) {
			handleFile(files[0]);
		}
	}

	function handleFile(file: File) {
		if (disabled) return;

		// Clear previous errors
		errorMessage = '';

		// Validate file type
		if (!file.type.startsWith('image/')) {
			showError('Please select an image file. Supported formats: PNG, JPG, WebP');
			return;
		}

		// Validate file size
		if (file.size > maxSize) {
			const maxSizeMB = Math.round(maxSize / (1024 * 1024));
			showError(
				`File size must be less than ${maxSizeMB}MB. Current file is ${formatFileSize(file.size)}`
			);
			return;
		}

		announceToScreenReader(`File selected: ${file.name}, ${formatFileSize(file.size)}`);
		onFileSelect?.(file);
	}

	function clearFile() {
		announceToScreenReader('File removed');
		onFileSelect?.(null as any);
		if (fileInput) {
			fileInput.value = '';
		}
		errorMessage = '';
	}

	function openFileDialog() {
		if (disabled) return;
		fileInput?.click();
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (disabled) return;

		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			if (currentFile) {
				// If file is selected, clear it
				clearFile();
			} else {
				// If no file, open dialog
				openFileDialog();
			}
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

<!-- Live region for screen reader announcements -->
<div aria-live="polite" aria-atomic="true" class="sr-only">
	{announceText}
</div>

<input
	bind:this={fileInput}
	type="file"
	{accept}
	class="hidden"
	onchange={handleFileInput}
	{disabled}
	aria-describedby="file-upload-instructions"
/>

<!-- Error display -->
{#if errorMessage}
	<div
		class="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950"
		role="alert"
	>
		<div class="flex items-center gap-2">
			<AlertCircle class="h-4 w-4 text-red-600" aria-hidden="true" />
			<span class="text-sm text-red-700 dark:text-red-300">{errorMessage}</span>
		</div>
	</div>
{/if}

<div
	class="rounded-lg border-2 border-dashed transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none
    {dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
    {disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-primary/50 cursor-pointer'}
    {currentFile ? 'p-4' : 'p-8'}"
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	onclick={currentFile ? undefined : openFileDialog}
	onkeydown={handleKeyDown}
	role="button"
	tabindex={disabled ? -1 : 0}
	aria-label={currentFile
		? `Current file: ${currentFile.name}. Press Enter or Space to remove.`
		: 'Upload image file. Drag and drop or press Enter to browse.'}
	aria-describedby="file-upload-instructions"
	aria-disabled={disabled}
>
	{#if currentFile}
		<!-- File Selected State -->
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div
					class="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg"
					aria-hidden="true"
				>
					<Upload class="text-primary h-6 w-6" />
				</div>
				<div>
					<p class="font-medium" id="current-file-name">{currentFile.name}</p>
					<p class="text-muted-foreground text-sm" id="current-file-size">
						{formatFileSize(currentFile.size)}
					</p>
				</div>
			</div>
			<Button
				variant="ghost"
				size="sm"
				onclick={(e) => {
					e.stopPropagation();
					clearFile();
				}}
				{disabled}
				aria-label="Remove file {currentFile.name}"
				aria-describedby="current-file-name"
			>
				<X class="h-4 w-4" aria-hidden="true" />
			</Button>
		</div>
	{:else}
		<!-- Upload State -->
		<div class="text-center">
			<div
				class="bg-primary/10 mx-auto flex h-16 w-16 items-center justify-center rounded-lg"
				aria-hidden="true"
			>
				<Upload class="text-primary h-8 w-8" />
			</div>
			<h3 class="mt-4 text-lg font-semibold" id="upload-title">Upload your image</h3>
			<p class="text-muted-foreground mt-2 text-sm" id="upload-description">
				Drag and drop your image here, or click to browse
			</p>
			<p class="text-muted-foreground mt-1 text-xs" id="file-upload-instructions">
				Supports PNG, JPG, WebP, TIFF, BMP, GIF, AVIF up to {maxSize >= 1024 * 1024 * 1024 ? Math.round(maxSize / (1024 * 1024 * 1024)) + 'GB' : Math.round(maxSize / (1024 * 1024)) + 'MB'}
			</p>
			<Button
				class="mt-4"
				variant="outline"
				{disabled}
				onclick={openFileDialog}
				aria-describedby="file-upload-instructions"
			>
				Choose File
			</Button>
		</div>
	{/if}
</div>

<style>
	/* Screen reader only text */
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
