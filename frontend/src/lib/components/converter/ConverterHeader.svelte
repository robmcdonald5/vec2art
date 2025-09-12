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
		X,
		RefreshCw
	} from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import SettingsModeSelector from './SettingsModeSelector.svelte';
	import type {
		FileDataProps,
		ProcessingControlProps,
		ActionHandlerProps,
		SettingsSyncProps
	} from '$lib/types/shared-props';

	interface Props
		extends FileDataProps,
			ProcessingControlProps,
			ActionHandlerProps,
			SettingsSyncProps {
		// Required callbacks for this component
		onImageIndexChange: (_index: number) => void;
		onRemoveFile: (_index: number) => void;
		// Component-specific props
		viewMode: 'side-by-side' | 'slider';
		hasResult: boolean;
		onViewModeToggle: () => void;
		isPanicked?: boolean;
		onEmergencyRecovery?: () => void;
	}

	let {
		files,
		originalImageUrls,
		filesMetadata,
		currentImageIndex,
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
		onRemoveFile,
		isPanicked = false,
		onEmergencyRecovery,
		settingsSyncMode = 'global',
		onSettingsModeChange
	}: Props = $props();

	// Derived states - account for files, restored originalImageUrls, and filesMetadata
	const hasMultipleFiles = $derived(
		Math.max(files.length, originalImageUrls.length, filesMetadata.length) > 1
	);
	const totalFiles = $derived(
		Math.max(files.length, originalImageUrls.length, filesMetadata.length)
	);
	// const currentFile = $derived(files[currentImageIndex]); // TODO: may be needed later

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
	// Mobile file management dropdown state
	let showMobileManageDropdown = $state(false);

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
</script>

<!-- Unified Header with consistent height -->
<div
	class="border-ferrari-200 dark:border-ferrari-800 to-ferrari-50/50 dark:from-ferrari-950 dark:to-ferrari-900/50 border-b bg-gradient-to-r from-white"
>
	<!-- Mobile Layout: Stacked for better hierarchy -->
	<div class="block md:hidden">
		<!-- Mobile Top Row: File Info & Primary Action -->
		<div class="flex min-h-[60px] items-center justify-between px-4 py-3">
			<!-- File Navigation (Mobile) -->
			<div class="flex min-w-0 flex-1 items-center">
				{#if hasMultipleFiles}
					<div class="relative">
						<button
							onclick={() => (showFileDropdown = !showFileDropdown)}
							class="mobile-touch-target border-ferrari-300 dark:border-ferrari-600 hover:bg-ferrari-50 dark:hover:bg-ferrari-900 hover:border-ferrari-400 dark:hover:border-ferrari-500 flex items-center justify-center gap-3 rounded-lg border px-4 py-3 transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
						>
							<span class="text-ferrari-700 text-sm font-bold">
								{currentImageIndex + 1} of {totalFiles}
							</span>
							<ChevronDown
								class="text-ferrari-600 h-4 w-4 transition-transform duration-200 {showFileDropdown
									? 'rotate-180'
									: ''}"
							/>
						</button>

						{#if showFileDropdown}
							<div
								class="dark:bg-ferrari-900 border-ferrari-200 dark:border-ferrari-800 absolute top-full left-0 z-50 mt-2 max-h-60 w-80 overflow-y-auto rounded-xl border bg-white shadow-2xl"
							>
								{#each fileDisplayInfo as fileInfo, index (index)}
									<div class="group relative flex items-center">
										<button
											onclick={() => selectFile(index)}
											class="mobile-touch-target hover:bg-ferrari-50 dark:hover:bg-ferrari-800 flex flex-1 items-center justify-between px-4 py-4 text-left transition-all duration-150 hover:scale-[1.01] hover:shadow-sm {index ===
											currentImageIndex
												? 'bg-ferrari-100 dark:bg-ferrari-800'
												: ''}"
										>
											<span class="truncate pr-8 text-sm font-medium">{fileInfo.name}</span>
											{#if index === currentImageIndex}
												<span class="text-ferrari-600 text-xs font-bold">Current</span>
											{/if}
										</button>

										<!-- Remove button -->
										{#if totalFiles > 1}
											<button
												onclick={(e) => removeFile(index, e)}
												disabled={isProcessing}
												class="mobile-touch-target absolute top-1/2 right-3 flex -translate-y-1/2 items-center justify-center rounded-full bg-red-50 opacity-0 transition-all duration-150 group-hover:opacity-100 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-30 dark:bg-red-900/30 dark:hover:bg-red-900/50"
												title="Remove {fileInfo.name}"
												aria-label="Remove {fileInfo.name}"
											>
												<X class="h-4 w-4 text-red-600 dark:text-red-400" />
											</button>
										{/if}
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{:else}
					<h3 class="text-ferrari-700 text-base font-bold">Before & After</h3>
				{/if}
			</div>

			<!-- Primary Action (Mobile) -->
			<div class="flex items-center gap-3">
				{#if isProcessing}
					<Button
						variant="destructive"
						size="default"
						class="mobile-touch-target transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
						onclick={onAbort}
					>
						<Square class="h-5 w-5 animate-pulse" />
						<span class="ml-2 font-medium">Stop</span>
					</Button>
				{:else if canConvert}
					<Button
						variant="ferrari"
						size="default"
						class="mobile-touch-target transition-all duration-200 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg active:translate-y-0 active:scale-95"
						onclick={onConvert}
						disabled={!canConvert}
					>
						<Play class="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:scale-110" />
						<span class="ml-2 font-medium">Convert</span>
					</Button>
				{/if}

				<!-- Emergency Recovery (Mobile) -->
				{#if isPanicked && onEmergencyRecovery}
					<Button
						variant="destructive"
						size="default"
						class="mobile-touch-target animate-pulse bg-red-600 text-white transition-all duration-200 hover:scale-105 hover:bg-red-700 hover:shadow-lg active:scale-95"
						onclick={onEmergencyRecovery}
						title="Emergency Recovery: Reset WASM module to fix panic state"
					>
						<RefreshCw class="h-5 w-5" />
						<span class="ml-2 font-medium">Fix Panic</span>
					</Button>
				{/if}
			</div>
		</div>

		<!-- Mobile Bottom Row: Secondary Controls -->
		<div class="border-ferrari-100 dark:border-ferrari-800 border-t bg-ferrari-25/50 px-4 py-3 dark:bg-ferrari-950/30">
			<div class="flex items-center justify-between">
				<!-- File Navigation Arrows (Mobile) -->
				{#if hasMultipleFiles}
					<div class="flex gap-2">
						<Button
							variant="outline"
							size="default"
							class="mobile-touch-target border-ferrari-300 dark:border-ferrari-600 hover:bg-ferrari-50 dark:hover:bg-ferrari-900 hover:border-ferrari-400 dark:hover:border-ferrari-500 transition-all duration-200 hover:scale-105 active:scale-95"
							onclick={() => navigateImage('prev')}
							disabled={totalFiles <= 1}
						>
							<ChevronLeft class="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
							<span class="ml-1 text-sm">Prev</span>
						</Button>
						<Button
							variant="outline"
							size="default"
							class="mobile-touch-target border-ferrari-300 dark:border-ferrari-600 hover:bg-ferrari-50 dark:hover:bg-ferrari-900 hover:border-ferrari-400 dark:hover:border-ferrari-500 transition-all duration-200 hover:scale-105 active:scale-95"
							onclick={() => navigateImage('next')}
							disabled={totalFiles <= 1}
						>
							<span class="mr-1 text-sm">Next</span>
							<ChevronRight class="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
						</Button>
					</div>
				{/if}

				<!-- View Mode & Settings (Mobile) -->
				<div class="flex items-center gap-3">
					<!-- View Mode Toggle (Mobile) -->
					<Button
						variant="outline"
						size="default"
						class="mobile-touch-target border-ferrari-300 dark:border-ferrari-600 hover:bg-ferrari-50 dark:hover:bg-ferrari-900 hover:border-ferrari-400 dark:hover:border-ferrari-500 transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
						onclick={onViewModeToggle}
						disabled={!hasResult}
					>
						{#if viewMode === 'side-by-side'}
							<ArrowLeftRight class="h-5 w-5 transition-transform group-hover:scale-110" />
							<span class="ml-2 text-sm">Slider</span>
						{:else}
							<Grid2x2 class="h-5 w-5 transition-transform group-hover:scale-110" />
							<span class="ml-2 text-sm">Split</span>
						{/if}
					</Button>

					<!-- File Management Dropdown (Mobile) -->
					<div class="relative">
						<Button
							variant="outline"
							size="default"
							class="mobile-touch-target border-ferrari-300 dark:border-ferrari-600 hover:bg-ferrari-50 dark:hover:bg-ferrari-900 hover:border-ferrari-400 dark:hover:border-ferrari-500 transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
							onclick={() => (showMobileManageDropdown = !showMobileManageDropdown)}
							disabled={isProcessing}
						>
							<span class="text-sm">Manage</span>
							<ChevronDown class="ml-2 h-4 w-4 transition-transform duration-200 {showMobileManageDropdown ? 'rotate-180' : ''}" />
						</Button>

						{#if showMobileManageDropdown}
							<div
								class="dark:bg-ferrari-900 border-ferrari-200 dark:border-ferrari-800 absolute top-full right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border bg-white shadow-2xl"
							>
								<div class="p-2">
									<button
										onclick={() => { onReset(); showMobileManageDropdown = false; }}
										disabled={isProcessing}
										class="mobile-touch-target hover:bg-ferrari-50 dark:hover:bg-ferrari-800 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition-all duration-150 hover:scale-[1.01] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
									>
										<RotateCcw class="h-5 w-5 text-ferrari-600" />
										<span>Clear All</span>
									</button>
									<button
										onclick={() => { onAddMore(); showMobileManageDropdown = false; }}
										disabled={isProcessing}
										class="mobile-touch-target hover:bg-ferrari-50 dark:hover:bg-ferrari-800 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition-all duration-150 hover:scale-[1.01] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
									>
										<Plus class="h-5 w-5 text-ferrari-600" />
										<span>Add More</span>
									</button>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Settings Mode Selector (Mobile) -->
			{#if hasMultipleFiles && onSettingsModeChange}
				<div class="mt-3">
					<SettingsModeSelector
						currentMode={settingsSyncMode}
						totalImages={totalFiles}
						onModeChange={onSettingsModeChange}
						disabled={isProcessing}
					/>
				</div>
			{/if}
		</div>
	</div>

	<!-- Desktop Layout: Original horizontal layout -->
	<div class="hidden min-h-[72px] items-center justify-between px-6 py-4 md:flex">
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
								{#each fileDisplayInfo as fileInfo, index (index)}
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

					<!-- Settings Mode Selector (positioned right after navigation arrows) -->
					{#if onSettingsModeChange}
						<SettingsModeSelector
							currentMode={settingsSyncMode}
							totalImages={totalFiles}
							onModeChange={onSettingsModeChange}
							disabled={isProcessing}
						/>
					{/if}
				</div>
			{:else}
				<!-- Single File: Clean header -->
				<div>
					<h3 class="text-converter-primary text-lg font-semibold">Before & After</h3>
				</div>
			{/if}
		</div>

		<!-- Center: View Controls -->
		<div class="mx-6 flex items-center gap-4">
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
					onclick={onReset}
					disabled={isProcessing}
				>
					<RotateCcw class="h-4 w-4 transition-transform group-hover:rotate-12" />
					Clear All
				</Button>
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

			<!-- Emergency Recovery Button (only show when panicked) -->
			{#if isPanicked && onEmergencyRecovery}
				<Button
					variant="destructive"
					size="sm"
					class="animate-pulse bg-red-600 text-white transition-all duration-200 hover:scale-105 hover:bg-red-700 hover:shadow-lg active:scale-95"
					onclick={onEmergencyRecovery}
					title="Emergency Recovery: Reset WASM module to fix panic state"
				>
					<RefreshCw class="h-4 w-4" />
					Fix Panic
				</Button>
			{/if}
		</div>
	</div>
</div>

<!-- Click outside to close dropdowns -->
{#if showFileDropdown || showMobileManageDropdown}
	<div
		class="fixed inset-0 z-40"
		onclick={() => {
			showFileDropdown = false;
			showMobileManageDropdown = false;
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				showFileDropdown = false;
				showMobileManageDropdown = false;
			}
		}}
		role="button"
		tabindex="-1"
		aria-label="Close dropdown"
	></div>
{/if}
