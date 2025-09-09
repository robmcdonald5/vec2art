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
		Maximize2,
		Square
	} from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { ProgressBar } from '$lib/components/ui/progress-bar';
	import ErrorState from '$lib/components/ui/ErrorState.svelte';
	import type { ProcessingProgress, ProcessingResult } from '$lib/types/vectorizer';
	import {
		createManagedObjectURL,
		releaseManagedObjectURL
	} from '$lib/utils/object-url-manager.js';

	interface Props {
		// Upload props
		accept?: string;
		maxSize?: number;
		onFilesSelect: (selectedFiles: File[]) => void;
		disabled?: boolean;
		currentFiles?: File[];
		// Preview props
		inputImages: ImageData[];
		currentImageIndex: number;
		currentProgress?: ProcessingProgress;
		results: ProcessingResult[];
		previewSvgUrls: (string | null)[];
		onImageIndexChange: (_newIndex: number) => void;
		// Action callbacks - required
		onConvert: () => void;
		onDownload: () => void;
		onAbort: () => void;
		onReset: () => void;
		// State props for buttons
		canConvert?: boolean;
		canDownload?: boolean;
		isProcessing?: boolean;
	}

	let {
		accept = 'image/*',
		maxSize = 1 * 1024 * 1024 * 1024,
		onFilesSelect,
		disabled = false,
		currentFiles = [],
		currentImageIndex = 0,
		currentProgress,
		results = [],
		previewSvgUrls = [],
		onImageIndexChange,
		onConvert,
		onDownload,
		onAbort,
		onReset,
		canConvert = false,
		canDownload = false,
		isProcessing = false
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

	let imageElement = $state<HTMLImageElement>();
	let imageContainer = $state<HTMLDivElement>();

	// Derived states
	const hasFiles = $derived(currentFiles.length > 0);
	const hasMultipleFiles = $derived(currentFiles.length > 1);
	const currentFile = $derived(currentFiles[currentImageIndex]);
	// Managed object URL state
	let previousFile: File | null = null;
	let managedObjectUrl: string | null = null;

	// Effect to manage object URL lifecycle
	$effect(() => {
		// If file changed, clean up previous URL and create new one
		if (currentFile !== previousFile) {
			// Clean up previous URL
			if (managedObjectUrl && previousFile) {
				releaseManagedObjectURL(managedObjectUrl);
			}

			// Create new URL for current file
			managedObjectUrl = currentFile ? createManagedObjectURL(currentFile) : null;
			previousFile = currentFile;
		}

		// Cleanup on component unmount
		return () => {
			if (managedObjectUrl) {
				releaseManagedObjectURL(managedObjectUrl);
				managedObjectUrl = null;
			}
		};
	});

	const currentImageUrl = $derived(managedObjectUrl);
	const currentSvgUrl = $derived(previewSvgUrls[currentImageIndex]);
	const hasResult = $derived(Boolean(currentSvgUrl));
	const currentResult = $derived(results[currentImageIndex]);
	const isError = $derived(currentResult?.svg?.includes('Failed to convert') ?? false);

	// Validate callback props
	$effect(() => {
		if (!onConvert || !onDownload || !onAbort || !onReset) {
			console.warn('UnifiedImageProcessor: Missing required callbacks');
		}
	});

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
			onFilesSelect(allFiles);
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
		onFilesSelect(newFiles);
		announceToScreenReader(`File removed. ${newFiles.length} files remaining`);
	}

	function clearAllFiles() {
		if (onFilesSelect) {
			onFilesSelect([]);
		}
		if (onReset) {
			onReset();
		}
		announceToScreenReader('All files cleared');
	}

	// Button handlers - check if callbacks exist before calling
	function clickConvert() {
		console.log('🟢 UnifiedImageProcessor clickConvert called');
		console.log('🔍 onConvert callback:', typeof onConvert, onConvert);
		if (onConvert) {
			console.log('🚀 Calling onConvert callback');
			onConvert();
		} else {
			console.error('❌ UnifiedImageProcessor: onConvert callback not provided');
		}
	}

	function clickDownload() {
		if (onDownload) {
			onDownload();
		} else {
			console.error('UnifiedImageProcessor: onDownload callback not provided');
		}
	}

	function clickAbort() {
		if (onAbort) {
			onAbort();
		} else {
			console.error('UnifiedImageProcessor: onAbort callback not provided');
		}
	}

	function clickAddMore() {
		console.log('🟢 UnifiedImageProcessor clickAddMore called');
		console.log('🔍 Creating file input dialog...');
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = accept;
		input.multiple = true;
		input.onchange = (e) => {
			const files = Array.from((e.target as HTMLInputElement).files || []);
			console.log('📁 Files selected:', files.length);
			if (files.length > 0) {
				handleFiles(files);
			}
		};
		console.log('👆 Triggering file input click...');
		input.click();
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
		>
			<ErrorState message={errorMessage} size="sm" inline={true} center={false} />
		</div>
	{/if}

	{#if !hasFiles}
		<!-- Upload Dropzone - Restored proper styling -->
		<div
			class="card-ferrari-static min-h-[480px] cursor-pointer rounded-3xl border-2 border-dashed p-8 transition-all duration-300 hover:shadow-2xl
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
			<div class="flex h-full flex-col items-center justify-center space-y-4 text-center">
				<div class="icon-ferrari-bg rounded-full p-4">
					<Upload class="h-8 w-8 text-white" aria-hidden="true" />
				</div>
				<div class="space-y-2">
					<h3 class="text-converter-primary text-xl font-bold">Upload Images</h3>
					<p class="text-converter-secondary text-sm">
						Drag and drop your images here, or click to browse
					</p>
					<p class="text-ferrari-600 text-xs">Supports JPG, PNG, WebP, TIFF, BMP, GIF</p>
				</div>
			</div>
		</div>
	{:else}
		<!-- Files Selected State with Side-by-Side Preview -->
		<div class="space-y-4">
			<!-- Progress Bar -->
			{#if currentProgress}
				<div class="space-y-2">
					<div class="flex justify-between text-sm">
						<span>{currentProgress.stage}</span>
						<span>{Math.round(currentProgress.progress)}%</span>
					</div>
					<ProgressBar value={currentProgress.progress} size="sm" />
				</div>
			{/if}

			<!-- Side-by-Side Preview - Restored proper styling -->
			<div class="card-ferrari-static overflow-hidden rounded-3xl">
				<!-- Card header with file chips -->
				<div
					class="border-ferrari-200 dark:border-ferrari-800 flex items-center justify-between gap-3 border-b px-4 py-3"
				>
					<div class="flex items-center gap-3">
						<h3 class="text-converter-primary text-sm font-medium">
							Images ({currentFiles.length})
						</h3>
						{#if hasMultipleFiles}
							<div class="flex items-center gap-2">
								<Button
									variant="outline"
									size="icon"
									class="border-ferrari-300 dark:border-ferrari-600 dark:bg-ferrari-900/90 dark:hover:bg-ferrari-800 h-6 w-6 rounded bg-white/90 hover:bg-white"
									onclick={() => navigateImage('prev')}
									disabled={currentFiles.length <= 1}
								>
									<ChevronLeft class="text-ferrari-700 dark:text-ferrari-300 h-3 w-3" />
								</Button>
								<span class="text-converter-primary min-w-[3rem] text-center text-xs font-medium">
									{currentImageIndex + 1} / {currentFiles.length}
								</span>
								<Button
									variant="outline"
									size="icon"
									class="border-ferrari-300 dark:border-ferrari-600 dark:bg-ferrari-900/90 dark:hover:bg-ferrari-800 h-6 w-6 rounded bg-white/90 hover:bg-white"
									onclick={() => navigateImage('next')}
									disabled={currentFiles.length <= 1}
								>
									<ChevronRight class="text-ferrari-700 dark:text-ferrari-300 h-3 w-3" />
								</Button>
							</div>
						{/if}
					</div>
					<div class="flex max-w-md flex-wrap gap-2 overflow-x-auto">
						{#each currentFiles as file, index (file.name + index)}
							<div
								class="inline-flex cursor-pointer items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all hover:shadow-sm
								{index === currentImageIndex
									? 'border-ferrari-500 bg-ferrari-100 text-ferrari-800 dark:border-ferrari-400 dark:bg-ferrari-900 dark:text-ferrari-200 shadow-sm'
									: 'border-ferrari-200 text-ferrari-600 hover:bg-ferrari-50 dark:border-ferrari-700 dark:bg-ferrari-950 dark:text-ferrari-300 dark:hover:bg-ferrari-900 bg-white'}"
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
								<FileImage class="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
								<span class="max-w-24 truncate">{file.name}</span>
								<Button
									variant="ghost"
									size="icon"
									class="h-4 w-4 flex-shrink-0 p-0 hover:bg-transparent hover:text-red-500"
									onclick={(e) => {
										e.stopPropagation();
										removeFile(index);
									}}
									aria-label="Remove {file.name}"
								>
									<X class="h-3 w-3" />
								</Button>
							</div>
						{/each}
					</div>
				</div>

				<!-- Card body -->
				<div class="border-ferrari-200 dark:border-ferrari-800 border-b p-4">
					<h3 class="text-converter-primary font-semibold">Before & After</h3>
				</div>

				<div
					class="divide-ferrari-200 dark:divide-ferrari-800 grid grid-cols-1 divide-y md:grid-cols-2 md:divide-x md:divide-y-0"
				>
					<!-- Original Image -->
					<div class="bg-ferrari-50/30 dark:bg-ferrari-950/30 relative aspect-square">
						<div class="absolute inset-2 flex flex-col">
							<div class="mb-2 flex items-center justify-between px-2">
								<div class="text-converter-secondary text-xs font-medium">Original</div>
								<!-- Zoom Controls for Original -->
								<div class="flex gap-1">
									<Button
										variant="outline"
										size="icon"
										class="border-ferrari-300 dark:border-ferrari-600 dark:bg-ferrari-900/90 dark:hover:bg-ferrari-800 h-6 w-6 rounded bg-white/90 hover:bg-white"
										onclick={originalZoomOut}
									>
										<ZoomOut class="text-ferrari-700 dark:text-ferrari-300 h-3 w-3" />
									</Button>
									<Button
										variant="outline"
										size="icon"
										class="border-ferrari-300 dark:border-ferrari-600 dark:bg-ferrari-900/90 dark:hover:bg-ferrari-800 h-6 w-6 rounded bg-white/90 hover:bg-white"
										onclick={originalResetView}
									>
										<Maximize2 class="text-ferrari-700 dark:text-ferrari-300 h-3 w-3" />
									</Button>
									<Button
										variant="outline"
										size="icon"
										class="border-ferrari-300 dark:border-ferrari-600 dark:bg-ferrari-900/90 dark:hover:bg-ferrari-800 h-6 w-6 rounded bg-white/90 hover:bg-white"
										onclick={originalZoomIn}
									>
										<ZoomIn class="text-ferrari-700 dark:text-ferrari-300 h-3 w-3" />
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
										<FileImage class="text-converter-muted h-16 w-16" />
									</div>
								{/if}
							</div>
						</div>
					</div>

					<!-- Converted SVG -->
					<div class="bg-ferrari-50/30 dark:bg-ferrari-950/30 relative aspect-square">
						<div class="absolute inset-2 flex flex-col">
							<div class="mb-2 flex items-center justify-between px-2">
								<div
									class="text-xs font-medium"
									class:text-red-600={isError}
									class:text-converter-secondary={!isError}
								>
									{isError ? 'Failed to convert' : 'Converted SVG'}
								</div>
								<!-- Zoom Controls for Converted SVG -->
								<div class="flex gap-1">
									<Button
										variant="outline"
										size="icon"
										class="border-ferrari-300 dark:border-ferrari-600 dark:bg-ferrari-900/90 dark:hover:bg-ferrari-800 h-6 w-6 rounded bg-white/90 hover:bg-white"
										onclick={convertedZoomOut}
									>
										<ZoomOut class="text-ferrari-700 dark:text-ferrari-300 h-3 w-3" />
									</Button>
									<Button
										variant="outline"
										size="icon"
										class="border-ferrari-300 dark:border-ferrari-600 dark:bg-ferrari-900/90 dark:hover:bg-ferrari-800 h-6 w-6 rounded bg-white/90 hover:bg-white"
										onclick={convertedResetView}
									>
										<Maximize2 class="text-ferrari-700 dark:text-ferrari-300 h-3 w-3" />
									</Button>
									<Button
										variant="outline"
										size="icon"
										class="border-ferrari-300 dark:border-ferrari-600 dark:bg-ferrari-900/90 dark:hover:bg-ferrari-800 h-6 w-6 rounded bg-white/90 hover:bg-white"
										onclick={convertedZoomIn}
									>
										<ZoomIn class="text-ferrari-700 dark:text-ferrari-300 h-3 w-3" />
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
								{:else if currentProgress}
									<div class="flex h-full items-center justify-center">
										<div class="space-y-2 text-center">
											<div
												class="border-ferrari-500 mx-auto h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
											></div>
											<p class="text-converter-secondary text-sm">Converting...</p>
										</div>
									</div>
								{:else}
									<div class="flex h-full items-center justify-center">
										<div class="space-y-2 text-center">
											<FileImage class="text-converter-muted mx-auto h-16 w-16" />
											<p class="text-converter-secondary text-sm">Click Convert to see result</p>
										</div>
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>

				<!-- Action Buttons -->
				{#if hasFiles}
					<div
						class="bg-ferrari-50/50 dark:bg-ferrari-950/50 flex flex-wrap items-center justify-between gap-4 p-4"
					>
						<!-- File Management Actions -->
						<div class="flex gap-3">
							<Button
								variant="outline"
								size="sm"
								class="border-ferrari-300 dark:border-ferrari-600 hover:bg-ferrari-50 dark:hover:bg-ferrari-900"
								onclick={clickAddMore}
								disabled={disabled || isProcessing}
							>
								<Upload class="h-3.5 w-3.5" />
								Add More
							</Button>
							<Button
								variant="outline"
								size="sm"
								class="border-ferrari-300 dark:border-ferrari-600 hover:bg-ferrari-50 dark:hover:bg-ferrari-900"
								onclick={clearAllFiles}
								disabled={disabled || isProcessing}
							>
								<RotateCcw class="h-3.5 w-3.5" />
								Clear All
							</Button>
						</div>

						<!-- Primary Actions -->
						<div class="flex gap-3">
							{#if canDownload && !isError}
								<Button
									variant="default"
									size="sm"
									class="bg-ferrari-600 hover:bg-ferrari-700 text-white shadow-lg"
									onclick={clickDownload}
									disabled={disabled || isProcessing}
								>
									<Download class="h-3.5 w-3.5" />
									Download
								</Button>
							{/if}

							{#if isProcessing}
								<Button variant="destructive" size="sm" onclick={clickAbort}>
									<Square class="h-3.5 w-3.5" />
									Stop
								</Button>
							{:else if canConvert}
								<Button
									variant="default"
									size="sm"
									class="btn-ferrari-primary from-ferrari-600 hover:from-ferrari-700 bg-gradient-to-r to-red-600 shadow-lg hover:to-red-700"
									onclick={clickConvert}
									disabled={!canConvert || disabled}
								>
									<Play class="h-3.5 w-3.5" />
									Convert
								</Button>
							{/if}
						</div>
					</div>
				{/if}
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
