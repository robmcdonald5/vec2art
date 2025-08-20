<script lang="ts">
	import {
		ChevronLeft,
		ChevronRight,
		ArrowLeftRight,
		Grid2x2,
		Plus,
		RotateCcw,
		Play,
		Square,
		ChevronDown,
		X
	} from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import type { ProcessingProgress } from '$lib/types/vectorizer';
	import type { FileMetadata } from '$lib/stores/converter-persistence';

	interface Props {
		files: File[];
		originalImageUrls: (string | null)[];
		filesMetadata: FileMetadata[];
		currentImageIndex: number;
		currentProgress?: ProcessingProgress;
		viewMode: 'side-by-side' | 'slider';
		hasResult: boolean;
		canConvert: boolean;
		isProcessing: boolean;
		onImageIndexChange: (index: number) => void;
		onViewModeToggle: () => void;
		onConvert: () => void;
		onAbort: () => void;
		onReset: () => void;
		onAddMore: () => void;
		onRemoveFile: (index: number) => void;
	}

	let {
		files,
		originalImageUrls,
		filesMetadata,
		currentImageIndex,
		currentProgress,
		viewMode,
		hasResult,
		canConvert,
		isProcessing,
		onImageIndexChange,
		onViewModeToggle,
		onConvert,
		onAbort,
		onReset,
		onAddMore,
		onRemoveFile
	}: Props = $props();

	// Derived states - account for files, restored originalImageUrls, and filesMetadata
	const hasMultipleFiles = $derived(Math.max(files.length, originalImageUrls.length, filesMetadata.length) > 1);
	const totalFiles = $derived(Math.max(files.length, originalImageUrls.length, filesMetadata.length));
	const currentFile = $derived(files[currentImageIndex]);
	const currentFilename = $derived(currentFile?.name || '');
	
	// Create unified file info for dropdown display
	const fileDisplayInfo = $derived.by(() => {
		const result = [];
		const maxLength = Math.max(files.length, originalImageUrls.length, filesMetadata.length);
		
		for (let i = 0; i < maxLength; i++) {
			const file = files[i];
			const url = originalImageUrls[i];
			const metadata = filesMetadata[i];
			
			if (file) {
				// Current file - use actual file name
				result.push({ name: file.name, type: 'file' });
			} else if (metadata) {
				// Restored file - use original file name from metadata
				result.push({ name: metadata.name, type: 'restored' });
			} else if (url) {
				// Fallback - restored image without metadata
				result.push({ name: `Restored Image ${i + 1}`, type: 'restored' });
			} else {
				// Unknown case
				result.push({ name: `Image ${i + 1}`, type: 'unknown' });
			}
		}
		
		return result;
	});

	// File navigation dropdown state
	let showFileDropdown = $state(false);

	function navigateImage(direction: 'prev' | 'next') {
		if (!hasMultipleFiles) return;

		let newIndex;
		if (direction === 'prev') {
			newIndex = currentImageIndex === 0 ? totalFiles - 1 : currentImageIndex - 1;
		} else {
			newIndex = currentImageIndex === totalFiles - 1 ? 0 : currentImageIndex + 1;
		}

		onImageIndexChange(newIndex);
	}

	function selectFile(index: number) {
		onImageIndexChange(index);
		showFileDropdown = false;
	}

	function removeFile(index: number, event: MouseEvent) {
		event.stopPropagation(); // Prevent dropdown selection
		if (!isProcessing) {
			onRemoveFile(index);
			// Keep dropdown open to allow removing more files
		}
	}

	function truncateFilename(filename: string, maxLength = 25): string {
		if (filename.length <= maxLength) return filename;
		const extension = filename.split('.').pop() || '';
		const nameWithoutExt = filename.slice(0, filename.lastIndexOf('.'));
		const truncatedName = nameWithoutExt.slice(0, maxLength - extension.length - 4);
		return `${truncatedName}...${extension}`;
	}
</script>

<!-- Unified Header with consistent height -->
<div
	class="border-ferrari-200 dark:border-ferrari-800 to-ferrari-50/50 dark:from-ferrari-950 dark:to-ferrari-900/50 border-b bg-gradient-to-r from-white"
>
	<!-- Main Header Row - Fixed height to prevent jumping -->
	<div class="flex min-h-[72px] items-center justify-between px-6 py-4">
		<!-- Left: File Navigation (for multiple files only) -->
		<div class="flex min-w-0 flex-1 items-center gap-4">
			{#if hasMultipleFiles}
				<!-- Multiple Files: Navigation only -->
				<div class="flex items-center gap-3">
					<div class="relative">
						<button
							onclick={() => (showFileDropdown = !showFileDropdown)}
							class="border-ferrari-300 dark:border-ferrari-600 hover:bg-ferrari-50 dark:hover:bg-ferrari-900 hover:border-ferrari-400 dark:hover:border-ferrari-500 flex items-center justify-center gap-2 rounded-lg border px-3 py-2 transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
						>
							<span class="text-converter-primary text-center font-semibold">
								{currentImageIndex + 1} of {totalFiles}
							</span>
							<ChevronDown
								class="h-4 w-4 transition-transform duration-200 {showFileDropdown
									? 'rotate-180'
									: ''}"
							/>
						</button>

						{#if showFileDropdown}
							<div
								class="dark:bg-ferrari-900 border-ferrari-200 dark:border-ferrari-800 absolute top-full left-0 z-50 mt-1 max-h-60 w-80 overflow-y-auto rounded-lg border bg-white shadow-lg"
							>
								{#each fileDisplayInfo as fileInfo, index}
									<div class="group relative flex items-center">
										<button
											onclick={() => selectFile(index)}
											class="hover:bg-ferrari-50 dark:hover:bg-ferrari-800 flex flex-1 items-center justify-between px-3 py-2 text-left transition-all duration-150 hover:scale-[1.02] hover:shadow-sm {index ===
											currentImageIndex
												? 'bg-ferrari-100 dark:bg-ferrari-800'
												: ''}"
										>
											<span class="truncate pr-8 text-sm">{fileInfo.name}</span>
											{#if index === currentImageIndex}
												<span class="text-ferrari-600 text-xs font-medium">Current</span>
											{/if}
										</button>

										<!-- Remove button -->
										{#if totalFiles > 1}
											<button
												onclick={(e) => removeFile(index, e)}
												disabled={isProcessing}
												class="absolute top-1/2 right-2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full opacity-0 transition-all duration-150 group-hover:opacity-100 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-red-900/30"
												title="Remove {fileInfo.name}"
												aria-label="Remove {fileInfo.name}"
											>
												<X class="h-3 w-3 text-red-600 dark:text-red-400" />
											</button>
										{/if}
									</div>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Navigation arrows -->
					<div class="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							class="border-ferrari-300 dark:border-ferrari-600 hover:bg-ferrari-50 dark:hover:bg-ferrari-900 hover:border-ferrari-400 dark:hover:border-ferrari-500 h-8 transition-all duration-200 hover:scale-110 active:scale-95"
							onclick={() => navigateImage('prev')}
							disabled={totalFiles <= 1}
						>
							<ChevronLeft class="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
						</Button>
						<Button
							variant="outline"
							size="sm"
							class="border-ferrari-300 dark:border-ferrari-600 hover:bg-ferrari-50 dark:hover:bg-ferrari-900 hover:border-ferrari-400 dark:hover:border-ferrari-500 h-8 transition-all duration-200 hover:scale-110 active:scale-95"
							onclick={() => navigateImage('next')}
							disabled={totalFiles <= 1}
						>
							<ChevronRight class="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
						</Button>
					</div>
				</div>
			{:else}
				<!-- Single File: Clean header -->
				<div>
					<h3 class="text-converter-primary text-lg font-semibold">Before & After</h3>
				</div>
			{/if}
		</div>

		<!-- Center: View Controls -->
		<div class="mx-6 flex items-center">
			<Button
				variant="outline"
				size="sm"
				class="border-ferrari-300 dark:border-ferrari-600 hover:bg-ferrari-50 dark:hover:bg-ferrari-900 hover:border-ferrari-400 dark:hover:border-ferrari-500 transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
				onclick={onViewModeToggle}
				disabled={!hasResult}
			>
				{#if viewMode === 'side-by-side'}
					<ArrowLeftRight class="h-4 w-4 transition-transform group-hover:scale-110" />
					Slider
				{:else}
					<Grid2x2 class="h-4 w-4 transition-transform group-hover:scale-110" />
					Split
				{/if}
			</Button>
		</div>

		<!-- Right: Action Buttons -->
		<div class="flex items-center gap-6">
			<!-- File Management -->
			<div class="flex gap-4">
				<Button
					variant="outline"
					size="sm"
					class="border-ferrari-300 dark:border-ferrari-600 hover:bg-ferrari-50 dark:hover:bg-ferrari-900 hover:border-ferrari-400 dark:hover:border-ferrari-500 transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
					onclick={onAddMore}
					disabled={isProcessing}
				>
					<Plus class="h-4 w-4 transition-transform group-hover:scale-110" />
					Add More
				</Button>
				<Button
					variant="outline"
					size="sm"
					class="border-ferrari-300 dark:border-ferrari-600 hover:bg-ferrari-50 dark:hover:bg-ferrari-900 hover:border-ferrari-400 dark:hover:border-ferrari-500 transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
					onclick={onReset}
					disabled={isProcessing}
				>
					<RotateCcw class="h-4 w-4 transition-transform group-hover:rotate-12" />
					Clear All
				</Button>
			</div>

			<!-- Primary Action -->
			{#if isProcessing}
				<Button
					variant="destructive"
					size="sm"
					class="transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
					onclick={onAbort}
				>
					<Square class="h-4 w-4 animate-pulse" />
					Stop
				</Button>
			{:else if canConvert}
				<Button
					variant="ferrari"
					size="sm"
					class="transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg active:translate-y-0 active:scale-95"
					onclick={onConvert}
					disabled={!canConvert}
				>
					<Play
						class="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:scale-110"
					/>
					Convert
				</Button>
			{/if}
		</div>
	</div>

	<!-- Progress Bar -->
	{#if currentProgress}
		<div class="border-ferrari-200 dark:border-ferrari-800 border-t px-6 py-3">
			<div class="mb-2 flex justify-between text-sm">
				<span class="text-converter-primary">{currentProgress.stage}</span>
				<span class="text-converter-secondary">{Math.round(currentProgress.progress)}%</span>
			</div>
			<div class="bg-ferrari-100 dark:bg-ferrari-900 h-2 w-full rounded-full">
				<div
					class="bg-ferrari-600 h-2 rounded-full transition-all duration-300"
					style="width: {currentProgress.progress}%"
				></div>
			</div>
		</div>
	{/if}
</div>

<!-- Click outside to close dropdown -->
{#if showFileDropdown}
	<div class="fixed inset-0 z-40" onclick={() => (showFileDropdown = false)}></div>
{/if}
