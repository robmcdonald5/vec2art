<script lang="ts">
	import { Upload, X, AlertCircle, ChevronLeft, ChevronRight, FileImage, Play, Download, RotateCcw } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		accept?: string;
		maxSize?: number; // in bytes
		maxFiles?: number; // maximum number of files
		onFilesSelect?: (files: File[]) => void;
		disabled?: boolean;
		currentFiles?: File[];
		// Converter actions
		canConvert?: boolean;
		canDownload?: boolean;
		isProcessing?: boolean;
		onConvert?: () => void;
		onDownload?: () => void;
		onReset?: () => void;
		onAbort?: () => void;
	}

	let {
		accept = 'image/*',
		maxSize = 10 * 1024 * 1024, // 10MB
		maxFiles = 5,
		onFilesSelect,
		disabled = false,
		currentFiles = [],
		// Converter actions
		canConvert = false,
		canDownload = false,
		isProcessing = false,
		onConvert,
		onDownload,
		onReset,
		onAbort
	}: Props = $props();

	let dragOver = $state(false);
	let fileInput: HTMLInputElement;
	let announceText = $state<string>('');
	let errorMessage = $state<string>('');
	let currentPreviewIndex = $state(0);

	// Accessibility functions
	function announceToScreenReader(message: string) {
		announceText = message;
		setTimeout(() => {
			announceText = '';
		}, 1000);
	}

	// Prevent event bubbling helper
	function withEventPrevention<T extends any[]>(fn: (...args: T) => void) {
		return (event: Event, ...args: T) => {
			event.stopPropagation();
			fn(...args);
		};
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
			announceToScreenReader('Files dragged over upload area');
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
			announceToScreenReader(`${files.length} file(s) dropped`);
			handleFiles(Array.from(files));
		} else {
			announceToScreenReader('No valid files dropped');
		}
	}

	function handleFileInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target.files;
		if (files && files.length > 0) {
			handleFiles(Array.from(files));
		}
	}

	function handleFiles(newFiles: File[]) {
		if (disabled) return;

		// Clear previous errors
		errorMessage = '';

		const validFiles: File[] = [];
		const errors: string[] = [];

		for (const file of newFiles) {
			// Check if we're at max capacity
			if (currentFiles.length + validFiles.length >= maxFiles) {
				errors.push(`Maximum of ${maxFiles} files allowed`);
				break;
			}

			// Validate file type
			if (!file.type.startsWith('image/')) {
				errors.push(`${file.name}: Not an image file`);
				continue;
			}

			// Validate file size
			if (file.size > maxSize) {
				const maxSizeMB = Math.round(maxSize / (1024 * 1024));
				errors.push(`${file.name}: File too large (${formatFileSize(file.size)} > ${maxSizeMB}MB)`);
				continue;
			}

			// Check for duplicates
			if (currentFiles.some(existing => existing.name === file.name && existing.size === file.size)) {
				errors.push(`${file.name}: File already uploaded`);
				continue;
			}

			validFiles.push(file);
		}

		if (errors.length > 0) {
			showError(errors.join('. '));
		}

		if (validFiles.length > 0) {
			const allFiles = [...currentFiles, ...validFiles];
			announceToScreenReader(`${validFiles.length} file(s) added. Total: ${allFiles.length} files`);
			onFilesSelect?.(allFiles);
		}
	}

	function removeFile(index: number, event?: Event) {
		// Prevent event bubbling to container's click handler
		event?.stopPropagation();
		const newFiles = currentFiles.filter((_, i) => i !== index);
		// Adjust preview index if necessary
		if (currentPreviewIndex >= newFiles.length && newFiles.length > 0) {
			currentPreviewIndex = newFiles.length - 1;
		} else if (newFiles.length === 0) {
			currentPreviewIndex = 0;
		}
		announceToScreenReader(`File removed. ${newFiles.length} files remaining`);
		onFilesSelect?.(newFiles);
		
		if (fileInput) {
			fileInput.value = '';
		}
		errorMessage = '';
	}

	function clearAllFiles(event?: Event) {
		// Prevent event bubbling to container's click handler
		event?.stopPropagation();
		announceToScreenReader('All files removed');
		currentPreviewIndex = 0;
		onFilesSelect?.([]);
		if (fileInput) {
			fileInput.value = '';
		}
		errorMessage = '';
	}

	function openFileDialog(event?: Event) {
		// Only prevent bubbling if we're in the file list area
		if (event && currentFiles.length > 0) {
			event.stopPropagation();
		}
		if (disabled) return;
		fileInput?.click();
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (disabled) return;

		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			if (currentFiles.length > 0) {
				// If files are selected, clear them
				clearAllFiles();
			} else {
				// If no files, open dialog
				openFileDialog();
			}
		}
	}

	function navigatePreview(direction: 'prev' | 'next') {
		if (currentFiles.length <= 1) return;
		
		if (direction === 'prev') {
			currentPreviewIndex = currentPreviewIndex === 0 ? currentFiles.length - 1 : currentPreviewIndex - 1;
		} else {
			currentPreviewIndex = currentPreviewIndex === currentFiles.length - 1 ? 0 : currentPreviewIndex + 1;
		}
		
		announceToScreenReader(`Viewing image ${currentPreviewIndex + 1} of ${currentFiles.length}: ${currentFiles[currentPreviewIndex].name}`);
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}

	// Auto-update file input multiple attribute
	$effect(() => {
		if (fileInput) {
			fileInput.multiple = maxFiles > 1;
		}
	});
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
	multiple={maxFiles > 1}
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
    {currentFiles.length > 0 ? 'p-4' : 'p-8'}"
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	onclick={currentFiles.length === 0 ? openFileDialog : undefined}
	onkeydown={handleKeyDown}
	role="button"
	tabindex={disabled ? -1 : 0}
	aria-label={currentFiles.length > 0
		? `${currentFiles.length} file(s) selected. Press Enter or Space to clear all.`
		: `Upload image files. Drag and drop or press Enter to browse. Maximum ${maxFiles} files.`}
	aria-describedby="file-upload-instructions"
	aria-disabled={disabled}
>
	{#if currentFiles.length > 0}
		<!-- Files Selected State -->
		<div class="space-y-4">
			<!-- File Grid/List -->
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<h4 class="font-medium">Uploaded Files ({currentFiles.length}/{maxFiles})</h4>
					<div class="flex gap-2">
						<!-- Primary Convert Action -->
						{#if isProcessing}
							<Button
								variant="destructive"
								size="sm"
								onclick={withEventPrevention(() => onAbort?.())}
								aria-label="Stop processing"
							>
								<div class="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
								Stop
							</Button>
						{:else if canConvert && onConvert}
							<Button
								variant="default"
								size="sm"
								onclick={withEventPrevention(() => onConvert?.())}
								disabled={!canConvert}
								aria-label="Convert to SVG"
								class="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
							>
								<Play class="h-3 w-3" aria-hidden="true" />
								Convert
							</Button>
						{/if}

						<!-- Download Action -->
						{#if canDownload && onDownload}
							<Button
								variant="outline"
								size="sm"
								onclick={withEventPrevention(() => onDownload?.())}
								aria-label="Download result"
							>
								<Download class="h-3 w-3" aria-hidden="true" />
								Download
							</Button>
						{/if}

						<!-- File Management Actions -->
						{#if currentFiles.length < maxFiles}
							<Button
								variant="outline"
								size="sm"
								onclick={openFileDialog}
								{disabled}
								aria-label="Add more files"
							>
								<Upload class="h-3 w-3" aria-hidden="true" />
								Add More
							</Button>
						{/if}
						<Button
							variant="outline"
							size="sm"
							onclick={clearAllFiles}
							{disabled}
							aria-label="Clear all files"
						>
							<X class="h-3 w-3" aria-hidden="true" />
							Clear All
						</Button>
					</div>
				</div>
				
				<!-- File List -->
				<div class="max-h-32 overflow-y-auto space-y-1 border rounded-md p-2 bg-muted/10">
					{#each currentFiles as file, index}
						<div class="flex items-center justify-between p-2 rounded {index === currentPreviewIndex ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/20'}">
							<div class="flex items-center gap-2 flex-1 min-w-0">
								<FileImage class="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
								<div class="min-w-0 flex-1">
									<p class="font-medium text-sm truncate" title={file.name}>{file.name}</p>
									<p class="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
								</div>
							</div>
							<div class="flex gap-1 ml-2">
								{#if currentFiles.length > 1}
									<Button
										variant="ghost"
										size="sm"
										onclick={withEventPrevention(() => currentPreviewIndex = index)}
										disabled={index === currentPreviewIndex}
										aria-label="Preview {file.name}"
										class="p-1 h-6 w-6"
									>
										<FileImage class="h-3 w-3" aria-hidden="true" />
									</Button>
								{/if}
								<Button
									variant="ghost"
									size="sm"
									onclick={(event) => removeFile(index, event)}
									{disabled}
									aria-label="Remove {file.name}"
									class="p-1 h-6 w-6"
								>
									<X class="h-3 w-3" aria-hidden="true" />
								</Button>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Image Preview with Navigation -->
			{#if currentFiles.length > 0}
				<div class="relative">
					<div class="flex items-center justify-between mb-2">
						<h4 class="text-sm font-medium">Preview</h4>
						{#if currentFiles.length > 1}
							<div class="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onclick={withEventPrevention(() => navigatePreview('prev'))}
									{disabled}
									aria-label="Previous image"
									class="p-1 h-7 w-7"
								>
									<ChevronLeft class="h-4 w-4" aria-hidden="true" />
								</Button>
								<span class="text-sm text-muted-foreground">
									{currentPreviewIndex + 1} / {currentFiles.length}
								</span>
								<Button
									variant="outline"
									size="sm"
									onclick={withEventPrevention(() => navigatePreview('next'))}
									{disabled}
									aria-label="Next image"
									class="p-1 h-7 w-7"
								>
									<ChevronRight class="h-4 w-4" aria-hidden="true" />
								</Button>
							</div>
						{/if}
					</div>
					
					<div class="bg-muted/30 rounded-lg p-4 flex items-center justify-center min-h-[200px]">
						{#if currentFiles[currentPreviewIndex]}
							<img
								src={URL.createObjectURL(currentFiles[currentPreviewIndex])}
								alt="Preview of {currentFiles[currentPreviewIndex].name}"
								class="max-h-48 max-w-full object-contain rounded"
							/>
						{/if}
					</div>
					
					{#if currentFiles.length > 0}
						<p class="text-center text-sm text-muted-foreground mt-2">
							{currentFiles[currentPreviewIndex].name}
						</p>
					{/if}
				</div>
			{/if}
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
			<h3 class="mt-4 text-lg font-semibold" id="upload-title">Upload your images</h3>
			<p class="text-muted-foreground mt-2 text-sm" id="upload-description">
				Drag and drop your images here, or click to browse
			</p>
			<p class="text-muted-foreground mt-1 text-xs" id="file-upload-instructions">
				Supports PNG, JPG, WebP up to {Math.round(maxSize / (1024 * 1024))}MB per file • Maximum {maxFiles} files
			</p>
			<Button
				class="mt-4"
				variant="outline"
				{disabled}
				onclick={openFileDialog}
				aria-describedby="file-upload-instructions"
			>
				Choose Files
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