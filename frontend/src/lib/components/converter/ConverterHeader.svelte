<script lang="ts">
import { ChevronLeft, ChevronRight, ArrowLeftRight, Grid2x2, Plus, RotateCcw, Play, Square, ChevronDown, X } from 'lucide-svelte';
import { Button } from '$lib/components/ui/button';
import type { ProcessingProgress } from '$lib/types/vectorizer';

interface Props {
	files: File[];
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

// Derived states
const hasMultipleFiles = $derived(files.length > 1);
const currentFile = $derived(files[currentImageIndex]);
const currentFilename = $derived(currentFile?.name || '');

// File navigation dropdown state
let showFileDropdown = $state(false);

function navigateImage(direction: 'prev' | 'next') {
	if (!hasMultipleFiles) return;

	let newIndex;
	if (direction === 'prev') {
		newIndex = currentImageIndex === 0 ? files.length - 1 : currentImageIndex - 1;
	} else {
		newIndex = currentImageIndex === files.length - 1 ? 0 : currentImageIndex + 1;
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
<div class="border-b border-ferrari-200 dark:border-ferrari-800 bg-gradient-to-r from-white to-ferrari-50/50 dark:from-ferrari-950 dark:to-ferrari-900/50">
	<!-- Main Header Row - Fixed height to prevent jumping -->
	<div class="px-6 py-4 min-h-[72px] flex items-center justify-between">
		<!-- Left: File Navigation (for multiple files only) -->
		<div class="flex items-center gap-4 min-w-0 flex-1">
			{#if hasMultipleFiles}
				<!-- Multiple Files: Navigation only -->
				<div class="flex items-center gap-3">
					<div class="relative">
						<button
							onclick={() => showFileDropdown = !showFileDropdown}
							class="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-ferrari-300 dark:border-ferrari-600 hover:bg-ferrari-50 dark:hover:bg-ferrari-900 hover:border-ferrari-400 dark:hover:border-ferrari-500 hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
						>
							<span class="text-converter-primary font-semibold text-center">
								{currentImageIndex + 1} of {files.length}
							</span>
							<ChevronDown class="h-4 w-4 transition-transform duration-200 {showFileDropdown ? 'rotate-180' : ''}" />
						</button>
						
						{#if showFileDropdown}
							<div class="absolute top-full left-0 mt-1 w-80 max-h-60 overflow-y-auto bg-white dark:bg-ferrari-900 border border-ferrari-200 dark:border-ferrari-800 rounded-lg shadow-lg z-50">
								{#each files as file, index}
									<div class="group relative flex items-center">
										<button
											onclick={() => selectFile(index)}
											class="flex-1 px-3 py-2 text-left hover:bg-ferrari-50 dark:hover:bg-ferrari-800 flex items-center justify-between transition-all duration-150 hover:scale-[1.02] hover:shadow-sm {index === currentImageIndex ? 'bg-ferrari-100 dark:bg-ferrari-800' : ''}"
										>
											<span class="truncate text-sm pr-8">{file.name}</span>
											{#if index === currentImageIndex}
												<span class="text-ferrari-600 text-xs font-medium">Current</span>
											{/if}
										</button>
										
										<!-- Remove button -->
										{#if files.length > 1}
											<button
												onclick={(e) => removeFile(index, e)}
												disabled={isProcessing}
												class="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center transition-all duration-150 opacity-0 group-hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed"
												title="Remove {file.name}"
												aria-label="Remove {file.name}"
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
							class="h-8 border-ferrari-300 dark:border-ferrari-600 hover:bg-ferrari-50 dark:hover:bg-ferrari-900 hover:border-ferrari-400 dark:hover:border-ferrari-500 transition-all duration-200 hover:scale-110 active:scale-95"
							onclick={() => navigateImage('prev')}
							disabled={files.length <= 1}
						>
							<ChevronLeft class="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
						</Button>
						<Button
							variant="outline"
							size="sm"
							class="h-8 border-ferrari-300 dark:border-ferrari-600 hover:bg-ferrari-50 dark:hover:bg-ferrari-900 hover:border-ferrari-400 dark:hover:border-ferrari-500 transition-all duration-200 hover:scale-110 active:scale-95"
							onclick={() => navigateImage('next')}
							disabled={files.length <= 1}
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
		<div class="flex items-center mx-6">
			<Button
				variant="outline"
				size="sm"
				class="border-ferrari-300 dark:border-ferrari-600 hover:bg-ferrari-50 dark:hover:bg-ferrari-900 hover:border-ferrari-400 dark:hover:border-ferrari-500 hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
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
					class="border-ferrari-300 dark:border-ferrari-600 hover:bg-ferrari-50 dark:hover:bg-ferrari-900 hover:border-ferrari-400 dark:hover:border-ferrari-500 hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
					onclick={onAddMore}
					disabled={isProcessing}
				>
					<Plus class="h-4 w-4 transition-transform group-hover:scale-110" />
					Add More
				</Button>
				<Button
					variant="outline"
					size="sm"
					class="border-ferrari-300 dark:border-ferrari-600 hover:bg-ferrari-50 dark:hover:bg-ferrari-900 hover:border-ferrari-400 dark:hover:border-ferrari-500 hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
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
					class="hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
					onclick={onAbort}
				>
					<Square class="h-4 w-4 animate-pulse" />
					Stop
				</Button>
			{:else if canConvert}
				<Button
					variant="default"
					size="sm"
					style="background-color: #FF2800 !important; color: white !important; border-color: #FF2800 !important;"
					class="hover:shadow-lg transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 active:scale-95 active:translate-y-0"
					onclick={onConvert}
					disabled={!canConvert}
				>
					<Play class="h-4 w-4 transition-transform group-hover:scale-110 group-hover:translate-x-0.5" />
					Convert
				</Button>
			{/if}
		</div>
	</div>

	<!-- Progress Bar -->
	{#if currentProgress}
		<div class="border-t border-ferrari-200 dark:border-ferrari-800 px-6 py-3">
			<div class="flex justify-between text-sm mb-2">
				<span class="text-converter-primary">{currentProgress.stage}</span>
				<span class="text-converter-secondary">{Math.round(currentProgress.progress)}%</span>
			</div>
			<div class="w-full bg-ferrari-100 dark:bg-ferrari-900 rounded-full h-2">
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
	<div class="fixed inset-0 z-40" onclick={() => showFileDropdown = false}></div>
{/if}