<script lang="ts">
	import {
		Upload,
		X,
		AlertCircle,
		ChevronLeft,
		ChevronRight,
		FileImage,
		Play,
		Download,
		RotateCcw,
		ZoomIn,
		ZoomOut,
		Maximize2
	} from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { ProgressBar } from '$lib/components/ui/progress-bar';
	import type { ProcessingProgress, ProcessingResult } from '$lib/types/vectorizer';

	interface Props {
		// Upload props
		accept?: string;
		maxSize?: number;
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
		// Preview props
		inputImages: ImageData[];
		currentImageIndex: number;
		currentProgress?: ProcessingProgress;
		results: ProcessingResult[];
		previewSvgUrls: (string | null)[];
		onImageIndexChange: (index: number) => void;
	}

	let {
		accept = 'image/*',
		maxSize = 10 * 1024 * 1024,
		onFilesSelect,
		disabled = false,
		currentFiles = [],
		canConvert = false,
		canDownload = false,
		isProcessing = false,
		onConvert,
		onDownload,
		onReset,
		onAbort,
		inputImages,
		currentImageIndex = 0,
		currentProgress,
		results = [],
		previewSvgUrls = [],
		onImageIndexChange
	}: Props = $props();

	// Upload state
	let fileInput: HTMLInputElement;
	let dragOver = $state(false);
	let errorMessage = $state('');
	let announceText = $state('');

	// Preview state - separate for original and converted
	let originalZoomLevel = $state(1);
	let originalPanOffset = $state({ x: 0, y: 0 });
	let originalAutoFitZoom = $state(1);
	let convertedZoomLevel = $state(1);
	let convertedPanOffset = $state({ x: 0, y: 0 });
	let convertedAutoFitZoom = $state(1);

	let isDragging = $state(false);
	let dragStart = $state({ x: 0, y: 0 });
	let imageElement = $state<HTMLImageElement>();
	let imageContainer = $state<HTMLDivElement>();

	// Derived states
	const hasFiles = $derived(currentFiles.length > 0);
	const hasMultipleFiles = $derived(currentFiles.length > 1);
	const currentFile = $derived(currentFiles[currentImageIndex]);
	const currentImageUrl = $derived(currentFile ? URL.createObjectURL(currentFile) : null);
	const currentSvgUrl = $derived(previewSvgUrls[currentImageIndex]);
	const hasResult = $derived(Boolean(currentSvgUrl));

	// Upload functions
	function announceToScreenReader(message: string) {
		announceText = message;
		setTimeout(() => (announceText = ''), 1000);
	}

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
			announceToScreenReader(`${files.length} file(s) dropped`);
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

	function handleFiles(newFiles: File[]) {
		if (disabled) return;

		errorMessage = '';
		const validFiles: File[] = [];
		const errors: string[] = [];

		for (const file of newFiles) {
			if (!file.type.startsWith('image/')) {
				errors.push(`${file.name}: Not an image file`);
				continue;
			}

			if (file.size > maxSize) {
				const maxSizeMB = Math.round(maxSize / (1024 * 1024));
				errors.push(`${file.name}: File too large (${formatFileSize(file.size)} > ${maxSizeMB}MB)`);
				continue;
			}

			validFiles.push(file);
		}

		if (errors.length > 0) {
			errorMessage = errors.join('; ');
			announceToScreenReader(`Upload failed: ${errorMessage}`);
		}

		if (validFiles.length > 0) {
			const allFiles = [...currentFiles, ...validFiles];
			onFilesSelect?.(allFiles);
			announceToScreenReader(`${validFiles.length} file(s) added successfully`);
		}
	}

	function openFileDialog() {
		if (!disabled && fileInput) {
			fileInput.click();
		}
	}

	function removeFile(index: number) {
		const newFiles = currentFiles.filter((_, i) => i !== index);
		onFilesSelect?.(newFiles);
		announceToScreenReader(`File removed. ${newFiles.length} files remaining`);
	}

	function clearAllFiles() {
		onFilesSelect?.([]);
		onReset?.();
		announceToScreenReader('All files cleared');
	}

	function navigateImage(direction: 'prev' | 'next') {
		if (!hasMultipleFiles) return;

		let newIndex;
		if (direction === 'prev') {
			newIndex = currentImageIndex === 0 ? currentFiles.length - 1 : currentImageIndex - 1;
		} else {
			newIndex = currentImageIndex === currentFiles.length - 1 ? 0 : currentImageIndex + 1;
		}

		onImageIndexChange(newIndex);
		originalResetView();
		convertedResetView();
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}

	// Preview functions
	const zoomLevels = [0.1, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0];

	function findClosestZoomIndex(currentZoom: number): number {
		return zoomLevels.reduce((closest, level, index) => {
			return Math.abs(level - currentZoom) < Math.abs(zoomLevels[closest] - currentZoom)
				? index
				: closest;
		}, 0);
	}

	// Original image zoom functions
	function originalZoomIn() {
		const currentIndex = findClosestZoomIndex(originalZoomLevel);
		const nextIndex = Math.min(currentIndex + 1, zoomLevels.length - 1);
		originalZoomLevel = zoomLevels[nextIndex];
	}

	function originalZoomOut() {
		const currentIndex = findClosestZoomIndex(originalZoomLevel);
		const prevIndex = Math.max(currentIndex - 1, 0);
		originalZoomLevel = zoomLevels[prevIndex];
	}

	function originalResetView() {
		originalZoomLevel = originalAutoFitZoom;
		originalPanOffset = { x: 0, y: 0 };
	}

	// Converted image zoom functions
	function convertedZoomIn() {
		const currentIndex = findClosestZoomIndex(convertedZoomLevel);
		const nextIndex = Math.min(currentIndex + 1, zoomLevels.length - 1);
		convertedZoomLevel = zoomLevels[nextIndex];
	}

	function convertedZoomOut() {
		const currentIndex = findClosestZoomIndex(convertedZoomLevel);
		const prevIndex = Math.max(currentIndex - 1, 0);
		convertedZoomLevel = zoomLevels[prevIndex];
	}

	function convertedResetView() {
		convertedZoomLevel = convertedAutoFitZoom;
		convertedPanOffset = { x: 0, y: 0 };
	}

	function fitToContainer() {
		if (!imageElement || !imageContainer) return;

		const containerRect = imageContainer.getBoundingClientRect();
		const scaleX = (containerRect.width * 0.9) / imageElement.naturalWidth;
		const scaleY = (containerRect.height * 0.9) / imageElement.naturalHeight;
		const optimalScale = Math.min(scaleX, scaleY, 1);

		const closestIndex = findClosestZoomIndex(optimalScale);
		originalAutoFitZoom = zoomLevels[closestIndex];
		originalZoomLevel = originalAutoFitZoom;
		originalPanOffset = { x: 0, y: 0 };

		// Also set converted image to same initial zoom
		convertedAutoFitZoom = zoomLevels[closestIndex];
		convertedZoomLevel = convertedAutoFitZoom;
		convertedPanOffset = { x: 0, y: 0 };
	}

	function withEventPrevention(fn: () => void) {
		return (event: Event) => {
			event.preventDefault();
			event.stopPropagation();
			fn();
		};
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
	multiple
/>

<div>
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

	{#if !hasFiles}
		<!-- Upload Dropzone -->
		<div
			class="border-muted-foreground/25 hover:border-primary/50 min-h-[480px] cursor-pointer rounded-lg border-2 border-dashed p-8 transition-colors
			{dragOver ? 'border-primary bg-primary/5' : ''}
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
			<div class="flex h-full flex-col items-center justify-center space-y-4 text-center">
				<div class="bg-muted rounded-full p-4">
					<Upload class="text-muted-foreground h-8 w-8" aria-hidden="true" />
				</div>
				<div class="space-y-2">
					<h3 class="text-lg font-semibold">Upload Images</h3>
					<p class="text-muted-foreground text-sm">
						Drag and drop your images here, or click to browse
					</p>
					<p class="text-muted-foreground text-xs">
						Supports JPG, PNG, WebP • Max {Math.round(maxSize / (1024 * 1024))}MB per file
					</p>
				</div>
			</div>
		</div>
	{:else}
		<!-- Files Selected State with Side-by-Side Preview -->
		<div class="space-y-4">
			<!-- Progress Bar -->
			{#if isProcessing && currentProgress}
				<div class="space-y-2">
					<div class="flex justify-between text-sm">
						<span>{currentProgress.stage}</span>
						<span>{Math.round(currentProgress.progress)}%</span>
					</div>
					<ProgressBar value={currentProgress.progress} size="sm" />
				</div>
			{/if}

			<!-- Side-by-Side Preview -->
			<div class="bg-background overflow-hidden rounded-lg border">
				<!-- Card header with file chips -->
				<div class="flex items-center justify-between gap-3 border-b px-4 py-3">
					<div class="flex items-center gap-3">
						<h3 class="text-muted-foreground text-sm font-medium">
							Images ({currentFiles.length})
						</h3>
						{#if hasMultipleFiles}
							<div class="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onclick={() => navigateImage('prev')}
									disabled={currentFiles.length <= 1}
									class="h-6 w-6 p-1"
								>
									<ChevronLeft class="h-3 w-3" />
								</Button>
								<span class="text-muted-foreground min-w-[3rem] text-center text-xs">
									{currentImageIndex + 1} / {currentFiles.length}
								</span>
								<Button
									variant="outline"
									size="sm"
									onclick={() => navigateImage('next')}
									disabled={currentFiles.length <= 1}
									class="h-6 w-6 p-1"
								>
									<ChevronRight class="h-3 w-3" />
								</Button>
							</div>
						{/if}
					</div>
					<div class="flex max-w-md flex-wrap gap-2 overflow-x-auto">
						{#each currentFiles as file, index (file.name + index)}
							<span
								class="hover:bg-primary/5 inline-flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors
								{index === currentImageIndex ? 'border-primary bg-primary/10' : 'border-border'}"
								onclick={() => onImageIndexChange(index)}
								onkeydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										onImageIndexChange(index);
									}
								}}
								role="button"
								tabindex="0"
								aria-label="Select {file.name}"
							>
								<FileImage class="h-3 w-3 flex-shrink-0" aria-hidden="true" />
								<span class="max-w-20 truncate">{file.name}</span>
								<button
									type="button"
									onclick={(e) => {
										e.stopPropagation();
										removeFile(index);
									}}
									class="text-muted-foreground hover:text-destructive flex-shrink-0 p-0.5"
									aria-label="Remove {file.name}"
								>
									<X class="h-2.5 w-2.5" />
								</button>
							</span>
						{/each}
					</div>
				</div>

				<!-- Card body -->
				<div class="border-b p-4">
					<div class="flex items-center justify-between">
						<h3 class="font-semibold">Before & After</h3>
						<div class="flex gap-2">
							<!-- File Management Actions -->
							<div class="flex gap-2">
								<Button variant="outline" size="sm" onclick={openFileDialog} {disabled}>
									<Upload class="h-3 w-3" aria-hidden="true" />
									Add More
								</Button>
								<Button variant="outline" size="sm" onclick={clearAllFiles}>
									<RotateCcw class="h-3 w-3" aria-hidden="true" />
									Clear All
								</Button>
							</div>

							<!-- Download Action -->
							{#if canDownload && onDownload}
								<Button
									variant="outline"
									size="sm"
									onclick={withEventPrevention(() => onDownload?.())}
								>
									<Download class="h-3 w-3" aria-hidden="true" />
									Download
								</Button>
							{/if}

							<!-- Primary Actions (rightmost) -->
							{#if isProcessing}
								<Button
									variant="destructive"
									size="sm"
									onclick={withEventPrevention(() => onAbort?.())}
								>
									<div
										class="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent"
									></div>
									Stop
								</Button>
							{:else if canConvert && onConvert}
								<Button
									variant="default"
									size="sm"
									onclick={withEventPrevention(() => onConvert?.())}
									disabled={!canConvert}
									class="bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700"
								>
									<Play class="h-3 w-3" aria-hidden="true" />
									Convert
								</Button>
							{/if}
						</div>
					</div>
				</div>

				<div class="grid grid-cols-1 divide-y md:grid-cols-2 md:divide-x md:divide-y-0">
					<!-- Original Image -->
					<div class="bg-muted/30 relative aspect-square">
						<div class="absolute inset-2 flex flex-col">
							<div class="mb-2 flex items-center justify-between px-2">
								<div class="text-muted-foreground text-xs font-medium">Original</div>
								<!-- Zoom Controls for Original -->
								<div class="flex gap-1">
									<Button variant="outline" size="sm" onclick={originalZoomOut} class="h-6 w-6 p-0">
										<ZoomOut class="h-3 w-3" />
									</Button>
									<Button
										variant="outline"
										size="sm"
										onclick={originalResetView}
										class="h-6 w-6 p-0"
									>
										<Maximize2 class="h-3 w-3" />
									</Button>
									<Button variant="outline" size="sm" onclick={originalZoomIn} class="h-6 w-6 p-0">
										<ZoomIn class="h-3 w-3" />
									</Button>
								</div>
							</div>
							<div bind:this={imageContainer} class="flex-1 overflow-hidden rounded">
								{#if currentImageUrl}
									<img
										bind:this={imageElement}
										src={currentImageUrl}
										alt={currentFile?.name}
										class="h-full w-full cursor-move object-contain transition-transform"
										style="transform: scale({originalZoomLevel}) translate({originalPanOffset.x}px, {originalPanOffset.y}px)"
										onload={fitToContainer}
										draggable="false"
									/>
								{:else}
									<div class="flex h-full items-center justify-center">
										<FileImage class="text-muted-foreground h-16 w-16" />
									</div>
								{/if}
							</div>
						</div>
					</div>

					<!-- Converted SVG -->
					<div class="bg-muted/30 relative aspect-square">
						<div class="absolute inset-2 flex flex-col">
							<div class="mb-2 flex items-center justify-between px-2">
								<div class="text-muted-foreground text-xs font-medium">Converted SVG</div>
								<!-- Zoom Controls for Converted SVG -->
								<div class="flex gap-1">
									<Button
										variant="outline"
										size="sm"
										onclick={convertedZoomOut}
										class="h-6 w-6 p-0"
									>
										<ZoomOut class="h-3 w-3" />
									</Button>
									<Button
										variant="outline"
										size="sm"
										onclick={convertedResetView}
										class="h-6 w-6 p-0"
									>
										<Maximize2 class="h-3 w-3" />
									</Button>
									<Button variant="outline" size="sm" onclick={convertedZoomIn} class="h-6 w-6 p-0">
										<ZoomIn class="h-3 w-3" />
									</Button>
								</div>
							</div>
							<div class="flex-1 overflow-hidden rounded">
								{#if hasResult && currentSvgUrl}
									<img
										src={currentSvgUrl}
										alt="Converted SVG"
										class="h-full w-full object-contain transition-transform"
										style="transform: scale({convertedZoomLevel}) translate({convertedPanOffset.x}px, {convertedPanOffset.y}px)"
										draggable="false"
									/>
								{:else if isProcessing}
									<div class="flex h-full items-center justify-center">
										<div class="space-y-2 text-center">
											<div
												class="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
											></div>
											<p class="text-muted-foreground text-sm">Converting...</p>
										</div>
									</div>
								{:else}
									<div class="flex h-full items-center justify-center">
										<div class="space-y-2 text-center">
											<FileImage class="text-muted-foreground mx-auto h-16 w-16" />
											<p class="text-muted-foreground text-sm">Click Convert to see result</p>
										</div>
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
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
