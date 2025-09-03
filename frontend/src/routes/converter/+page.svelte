<script lang="ts">
	/**
	 * Converter Page - Layered State Architecture
	 * State: EMPTY -> Shows only upload area
	 * State: LOADED -> Shows converter interface with settings
	 */

	import { onMount } from 'svelte';
	import { Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-svelte';

	// Import new layered components
	import UploadArea from '$lib/components/converter/UploadArea.svelte';
	import ConverterInterface from '$lib/components/converter/ConverterInterface.svelte';
	import SettingsPanel from '$lib/components/converter/SettingsPanel.svelte';
	import SettingsModeSelector from '$lib/components/converter/SettingsModeSelector.svelte';
	import KeyboardShortcuts from '$lib/components/ui/keyboard/KeyboardShortcuts.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import { parameterHistory } from '$lib/stores/parameter-history.svelte';
	import { converterPersistence } from '$lib/stores/converter-persistence';
	import type { FileMetadata } from '$lib/stores/converter-persistence';
	import { devLog, devDebug, devWarn, devError, devSuccess } from '$lib/utils/dev-logger';

	// Types and stores
	import type {
		ProcessingProgress,
		ProcessingResult,
		VectorizerConfig,
		VectorizerBackend,
		VectorizerPreset
	} from '$lib/types/vectorizer';
	import { DEFAULT_CONFIG } from '$lib/types/vectorizer';
	import { vectorizerStore } from '$lib/stores/vectorizer.svelte.js';
	import { wasmWorkerService } from '$lib/services/wasm-worker-service';
	import { settingsSyncStore } from '$lib/stores/settings-sync.svelte';
	import type { SettingsSyncMode } from '$lib/types/settings-sync';
	import { panZoomStore } from '$lib/stores/pan-zoom-sync.svelte';
	import { getPresetById } from '$lib/presets/presets';
	import { presetToVectorizerConfig, getAlgorithmDefaults } from '$lib/presets/converter';
	import type { StylePreset } from '$lib/presets/types';

	// UI State Management - Using Svelte 5 runes
	let files = $state<File[]>([]);
	let originalImageUrls = $state<(string | null)[]>([]); // URLs for original images (for persistence)
	let filesMetadata = $state<FileMetadata[]>([]); // Metadata for original files (for persistence)
	let pendingFilesMetadata = $state<FileMetadata[] | null>(null); // Temporary storage for metadata restoration
	let currentImageIndex = $state(0);
	let processingImageIndex = $state(0); // Separate state for processing that doesn't trigger zoom reset
	let currentProgress = $state<ProcessingProgress | null>(null);
	let results = $state<(ProcessingResult | null)[]>([]);
	let previewSvgUrls = $state<(string | null)[]>([]);
	let isProcessing = $state(false);

	// Batch processing state
	let completedImages = $state(0);
	let batchStartTime = $state<Date | null>(null);

	// Page initialization state
	let pageLoaded = $state(false);
	let initError = $state<string | null>(null);
	let hasRecoveredState = $state(false);
	let isRecoveringState = $state(false);
	let isClearingAll = $state(false); // Flag to prevent auto-save during Clear All

	// Component reset key to force remounting
	let componentResetKey = $state(0);

	// Converter configuration state - use settings sync store
	// Initialize settings sync store with enhanced defaults
	settingsSyncStore.updateConfig({
		...DEFAULT_CONFIG,
		optimize_svg: true,
		svg_precision: 2
	});

	// Derived config from settings sync store based on current mode and image
	const config = $derived(settingsSyncStore.getCurrentConfig(currentImageIndex));

	let selectedPreset = $state<VectorizerPreset | 'custom'>('custom');

	// Derived states for UI logic - account for restored results
	// UI state - files, original image URLs, AND results control the state
	const uiState = $derived(
		files.length === 0 && originalImageUrls.length === 0 && results.length === 0
			? 'EMPTY'
			: 'LOADED'
	);
	const hasFiles = $derived(files.length > 0 || originalImageUrls.length > 0);
	// Enhanced conversion readiness check - prevents race conditions
	const canConvert = $derived(
		hasFiles && 
		!isProcessing && 
		vectorizerStore.isInitialized &&
		!vectorizerStore.hasError
	);
	const canDownload = $derived(results.length > 0 && !isProcessing);

	// Accessibility announcements
	let announceText = $state('');

	function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
		announceText = message;
		setTimeout(() => {
			announceText = '';
		}, 1000);
	}

	// File management functions
	async function handleFilesSelect(
		selectedFiles: File[],
		preserveCurrentIndex: boolean = false,
		retryCount: number = 0
	) {
		devDebug('handleFilesSelect called', {
			selectedFilesCount: selectedFiles.length,
			selectedFileNames: selectedFiles.map((f) => f.name),
			currentFilesCount: files.length,
			preserveCurrentIndex,
			isRecoveringState
		});

		// CRITICAL: Don't process uploads during state recovery to prevent race conditions
		if (isRecoveringState) {
			devWarn('file_operations', 'Blocking file upload during state recovery', { retryCount });

			// Prevent infinite retry loops
			if (retryCount >= 50) {
				// Max 5 seconds of retries (50 * 100ms)
				devError(
					'file_operations',
					'Max retry attempts reached, forcing state recovery to complete'
				);
				isRecoveringState = false; // Force recovery to complete
			} else {
				// Queue the upload to retry after state recovery completes
				setTimeout(
					() => handleFilesSelect(selectedFiles, preserveCurrentIndex, retryCount + 1),
					100
				);
				return;
			}
		}

		const previousFileCount = files.length;
		const previousRestoredCount = Math.max(originalImageUrls.length, filesMetadata.length);

		// FIXED: Don't consider restored state as "existing data" for fresh uploads
		// Only consider actual File objects as existing data
		const hasExistingFiles = previousFileCount > 0;

		devDebug('File selection state', {
			previousFileCount,
			previousRestoredCount,
			hasExistingFiles,
			preserveCurrentIndex
		});

		if (preserveCurrentIndex && hasExistingFiles) {
			// Adding files - append to existing arrays
			files = selectedFiles; // selectedFiles already contains existing + new files from handleAddMore

			// Create URLs for the new files and append to existing URLs
			const newImageUrls = [...originalImageUrls]; // Keep existing URLs (restored or active)
			const startIndex = Math.max(previousFileCount, previousRestoredCount); // Start after existing data

			// Handle both URLs and metadata for new files
			if (previousFileCount === 0 && previousRestoredCount > 0) {
				// Restored state case: append all selectedFiles as new
				for (const file of selectedFiles) {
					if (file.type.startsWith('image/')) {
						newImageUrls.push(URL.createObjectURL(file));
					} else {
						newImageUrls.push(null);
					}
					// Add metadata for new files
					filesMetadata.push({
						name: file.name,
						size: file.size,
						type: file.type,
						lastModified: file.lastModified
					});
				}
			} else {
				// Normal case: append only the new files (from previousFileCount onward)
				for (let i = previousFileCount; i < selectedFiles.length; i++) {
					const file = selectedFiles[i];
					if (file.type.startsWith('image/')) {
						newImageUrls.push(URL.createObjectURL(file));
					} else {
						newImageUrls.push(null);
					}
					// Add metadata for new files
					filesMetadata.push({
						name: file.name,
						size: file.size,
						type: file.type,
						lastModified: file.lastModified
					});
				}
			}
			originalImageUrls = newImageUrls;
		} else {
			// Replacing files - create new arrays
			files = selectedFiles;

			// Clean up old URLs before creating new ones
			originalImageUrls.forEach((url) => {
				if (url) URL.revokeObjectURL(url);
			});

			// Create original image URLs and metadata for display
			const newImageUrls: (string | null)[] = [];
			const newFilesMetadata: FileMetadata[] = [];
			for (const file of selectedFiles) {
				if (file.type.startsWith('image/')) {
					newImageUrls.push(URL.createObjectURL(file));
				} else {
					newImageUrls.push(null);
				}
				newFilesMetadata.push({
					name: file.name,
					size: file.size,
					type: file.type,
					lastModified: file.lastModified
				});
			}
			originalImageUrls = newImageUrls;
			filesMetadata = newFilesMetadata;
		}

		// Only reset index if we're replacing all files, not adding to existing ones
		if (!preserveCurrentIndex || !hasExistingFiles) {
			currentImageIndex = 0;
			// Clear previous results when replacing
			results = [];
			previewSvgUrls = [];
		} else {
			// When adding files, switch to the first newly added file
			currentImageIndex = previousFileCount;
		}

		if (selectedFiles.length > 0) {
			const addedCount = selectedFiles.length - previousFileCount;
			if (addedCount > 0 && previousFileCount > 0) {
				toastStore.info(`Added ${addedCount} more file(s)`);
			} else {
				toastStore.info(`${selectedFiles.length} file(s) ready for conversion`);
			}
		}
		announceToScreenReader(`${selectedFiles.length} file(s) selected`);

		// Initialize/update settings sync store with new image count and current index
		settingsSyncStore.initialize(selectedFiles.length, currentImageIndex);

		// Notify about image additions if files were added
		if (preserveCurrentIndex && hasExistingFiles) {
			// Images were added - notify for each new image
			for (let i = previousFileCount; i < selectedFiles.length; i++) {
				settingsSyncStore.handleImageAdded(i, selectedFiles.length);
			}
		}

		devDebug('handleFilesSelect completed', {
			finalFilesCount: files.length,
			finalOriginalUrlsCount: originalImageUrls.length,
			finalCurrentIndex: currentImageIndex
		});
	}

	function handleImageIndexChange(index: number) {
		const maxLength = Math.max(
			files.length,
			originalImageUrls.length,
			filesMetadata.length,
			results.length
		);
		if (index >= 0 && index < maxLength) {
			handleImageIndexChangeWithSync(index);
		}
	}

	function handleAddMore() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'image/*';
		input.multiple = true;
		input.onchange = (e) => {
			const newFiles = Array.from((e.target as HTMLInputElement).files || []);
			if (newFiles.length > 0) {
				// For restored state: files array might be empty while originalImageUrls/filesMetadata contain restored data
				// Only merge if we actually have active File objects, otherwise just add the new files
				if (files.length > 0) {
					// Normal case: merge existing files with new files
					const allFiles = [...files, ...newFiles];
					handleFilesSelect(allFiles, true); // preserveCurrentIndex = true for adding files
				} else {
					// Restored state case: no active File objects, just add new files
					handleFilesSelect(newFiles, true); // preserveCurrentIndex = true to preserve restored state
				}
			}
		};
		input.click();
	}

	function handleRemoveFile(index: number) {
		// Bounds checking - ensure index is valid for all arrays that will be accessed
		const maxLength = Math.max(
			files.length,
			originalImageUrls.length,
			filesMetadata.length,
			results.length,
			previewSvgUrls.length
		);
		if (index < 0 || index >= maxLength || isProcessing) {
			console.warn('Cannot remove file - invalid index or processing:', {
				index,
				maxLength,
				isProcessing
			});
			return;
		}

		// Get the file name before removing it
		const removedFileName = files[index]?.name || 'Unknown';

		// Create new arrays without the removed file
		const newFiles = files.filter((_, i) => i !== index);
		const newResults = results.filter((_, i) => i !== index);
		const newPreviewUrls = previewSvgUrls.filter((_, i) => i !== index);
		const newOriginalUrls = originalImageUrls.filter((_, i) => i !== index);
		const newFilesMetadata = filesMetadata.filter((_, i) => i !== index);

		// Clean up the removed preview URL
		const removedUrl = previewSvgUrls[index];
		if (removedUrl) {
			URL.revokeObjectURL(removedUrl);
		}

		// Clean up the removed original image URL
		const removedOriginalUrl = originalImageUrls[index];
		if (removedOriginalUrl) {
			URL.revokeObjectURL(removedOriginalUrl);
		}

		// Update current index if necessary
		let newCurrentIndex = currentImageIndex;
		if (index === currentImageIndex) {
			// If we removed the current image, select the previous one or stay at 0
			newCurrentIndex = Math.max(0, currentImageIndex - 1);
		} else if (index < currentImageIndex) {
			// If we removed an image before the current one, adjust the index
			newCurrentIndex = currentImageIndex - 1;
		}

		// Apply changes
		files = newFiles;
		results = newResults;
		previewSvgUrls = newPreviewUrls;
		originalImageUrls = newOriginalUrls;
		filesMetadata = newFilesMetadata;
		currentImageIndex = Math.min(newCurrentIndex, newFiles.length - 1);

		// Notify settings sync store about image removal
		settingsSyncStore.handleImageRemoved(index, newFiles.length);
		settingsSyncStore.setCurrentImageIndex(currentImageIndex);

		// If no files left, reset everything
		if (newFiles.length === 0) {
			handleReset();
			return;
		}

		toastStore.info(`Removed ${removedFileName}`);
		announceToScreenReader(`Removed ${removedFileName}. ${newFiles.length} files remaining`);
	}

	// Conversion functions
	async function handleConvert() {
		console.log('🔍 [DEBUG] handleConvert called with state:', {
			canConvert,
			filesCount: files.length,
			originalImageUrlsCount: originalImageUrls.length,
			resultsCount: results.length,
			currentImageIndex,
			isProcessing,
			hasFiles
		});

		if (!canConvert) {
			// Enhanced validation with specific error messages
			if (!hasFiles) {
				console.warn('Cannot convert - no files loaded');
				toastStore.error('Please upload an image first');
			} else if (isProcessing) {
				console.warn('Cannot convert - already processing');
				toastStore.warning('Conversion already in progress');
			} else if (!vectorizerStore.isInitialized) {
				console.warn('Cannot convert - WASM not initialized');
				toastStore.error('System not ready - please wait for initialization');
			} else if (vectorizerStore.hasError) {
				console.warn('Cannot convert - vectorizer has errors');
				toastStore.error('System error detected - please refresh the page');
			}
			return;
		}

		// Emergency fallback: Reset isProcessing after timeout to prevent permanent UI lock
		// Use shorter timeout for background removal since it can hang longer
		let emergencyTimeout: ReturnType<typeof setTimeout> | null = null;
		const emergencyTimeoutDuration = config.enable_background_removal ? 360000 : 300000; // 6min vs 5min
		
		try {
			isProcessing = true;
			completedImages = 0;
			batchStartTime = new Date();
			announceToScreenReader('Starting image conversion');
			
			emergencyTimeout = setTimeout(() => {
				if (isProcessing) {
					const timeoutMinutes = emergencyTimeoutDuration / 60000;
					console.warn(`🚨 Emergency timeout: Forcing UI state reset after ${timeoutMinutes} minutes`);
					isProcessing = false;
					currentProgress = null;
					toastStore.error(`Processing timeout after ${timeoutMinutes} minutes - UI state reset. Background removal on large images can be very slow. Try reducing image size or disabling background removal.`);
				}
			}, emergencyTimeoutDuration);

			// Initialize WASM using Web Worker (prevents main thread blocking)
			try {
				console.log('🔧 Initializing WASM in Web Worker...', {
					initialized: wasmWorkerService.initialized
				});

				// Initialize WASM worker
				await wasmWorkerService.initialize({});

				console.log('✅ WASM Web Worker initialized successfully');
			} catch (error) {
				console.error('❌ Web Worker initialization failed:', error);
				toastStore.error('Failed to initialize image processor - please refresh', 5000);
				throw error;
			}

			// Check if we have any actual files to process
			if (files.length === 0) {
				console.log('🔍 [DEBUG] No files available for conversion');
				if (originalImageUrls.length > 0 || filesMetadata.length > 0) {
					// We have restored state but no File objects - this is the bug!
					console.log(
						'⚠️ [DEBUG] Restored state detected but File objects missing. Attempting recovery...'
					);
					toastStore.error(
						'Files from previous session need to be re-uploaded. Your settings and results are preserved, but please upload your images again to continue.',
						8000
					);
				} else {
					toastStore.error('No files available for conversion. Please upload some images first.');
				}
				return;
			}

			// Settings sync-aware conversion logic:
			// Get convert configuration based on current settings sync mode
			const convertConfig = settingsSyncStore.getConvertConfig();
			const imagesToProcess = convertConfig.imageIndices;

			console.log(
				`🎯 Settings Sync Conversion (${convertConfig.mode}): Processing ${imagesToProcess.length} images`,
				{ mode: convertConfig.mode, imageIndices: imagesToProcess }
			);

			// Debug settings sync store state
			const syncStats = settingsSyncStore.getStatistics();
			console.log('🔍 [DEBUG] Settings sync store statistics:', syncStats);
			console.log('🔍 [DEBUG] Current UI state:', {
				filesCount: files.length,
				originalImageUrlsCount: originalImageUrls.length,
				filesMetadataCount: filesMetadata.length,
				resultsCount: results.length,
				currentImageIndex
			});

			if (imagesToProcess.length === 0) {
				console.error('❌ [DEBUG] No images to process - settings sync store issue detected');

				// DEFENSIVE FALLBACK: If settings sync is broken, try to process available files directly
				if (files.length > 0) {
					console.log('🔧 [DEBUG] Attempting fallback processing with available files');
					const fallbackIndices = Array.from({ length: files.length }, (_, i) => i);

					// Process all available files with current config
					await vectorizerStore.setInputFiles(files);
					vectorizerStore.updateConfig(config);

					const fallbackResults = await vectorizerStore.processBatch(
						(imageIndex, totalImages, progress) => {
							processingImageIndex = imageIndex;
							currentProgress = progress;
							completedImages = imageIndex;
							announceToScreenReader(`Processing image ${imageIndex + 1}: ${progress.stage}`);
						}
					);

					// Update results
					results = fallbackResults;
					previewSvgUrls = fallbackResults.map((result) => {
						if (result && result.svg) {
							const blob = new Blob([result.svg], { type: 'image/svg+xml' });
							return URL.createObjectURL(blob);
						}
						return null;
					});

					toastStore.success(
						`Fallback processing completed: ${fallbackResults.length} image(s) converted`
					);
					return;
				} else {
					toastStore.error(
						'No files available for conversion. Settings sync store may not be properly initialized.'
					);
					return;
				}
			}

			// Prepare files to process based on settings sync mode
			const filesToProcess: File[] = [];
			const indexMapping: number[] = [];
			const configsToProcess: VectorizerConfig[] = [];

			for (const imageIndex of imagesToProcess) {
				if (files[imageIndex]) {
					filesToProcess.push(files[imageIndex]);
					indexMapping.push(imageIndex);
					configsToProcess.push(convertConfig.configMap.get(imageIndex)!);
				}
			}

			// Set up vectorizer with files to process
			await vectorizerStore.setInputFiles(filesToProcess);

			// For per-image modes, we'll need to process files individually with their configs
			// For global mode, all files use the same config
			const processedResults: ProcessingResult[] = [];

			if (convertConfig.mode === 'global') {
				// Global mode: use single config for all files
				const globalConfig = {
					...configsToProcess[0]
				};
				vectorizerStore.updateConfig(globalConfig);
				const batchResults = await vectorizerStore.processBatch(
					(imageIndex, totalImages, progress) => {
						const originalIndex = indexMapping[imageIndex];
						processingImageIndex = originalIndex;
						currentProgress = progress;

						if (progress.stage === 'preprocessing' && progress.progress === 0) {
							completedImages = imageIndex;
						}

						announceToScreenReader(`Processing image ${originalIndex + 1}: ${progress.stage}`);
					}
				);
				processedResults.push(...batchResults);
			} else {
				// Per-image modes: process each image with its own config
				for (let i = 0; i < filesToProcess.length; i++) {
					const imageConfig = {
						...configsToProcess[i]
					};
					const originalIndex = indexMapping[i];

					// Update config for this specific image
					vectorizerStore.updateConfig(imageConfig);

					// Process single image
					await vectorizerStore.setInputFiles([filesToProcess[i]]);
					const singleResult = await vectorizerStore.processBatch(
						(imageIndex, totalImages, progress) => {
							processingImageIndex = originalIndex;
							currentProgress = progress;

							if (progress.stage === 'preprocessing' && progress.progress === 0) {
								completedImages = i;
							}

							announceToScreenReader(`Processing image ${originalIndex + 1}: ${progress.stage}`);
						}
					);

					if (singleResult.length > 0) {
						processedResults.push(singleResult[0]);
					}
				}
			}

			// Update results and preview URLs for the processed files
			let newResults = [...results];
			let newPreviewUrls = [...previewSvgUrls];

			for (let i = 0; i < processedResults.length; i++) {
				const originalIndex = indexMapping[i];
				const result = processedResults[i];

				// Clean up old preview URL if it exists
				if (newPreviewUrls[originalIndex]) {
					URL.revokeObjectURL(newPreviewUrls[originalIndex]!);
				}

				// Update result
				newResults[originalIndex] = result;

				// Create new preview URL
				if (result && result.svg) {
					const blob = new Blob([result.svg], { type: 'image/svg+xml' });
					newPreviewUrls[originalIndex] = URL.createObjectURL(blob);
				} else {
					newPreviewUrls[originalIndex] = null;
				}
			}

			results = newResults;
			previewSvgUrls = newPreviewUrls;
			completedImages = results.filter((r) => r && r.svg).length;

			const message =
				filesToProcess.length === 1
					? `Successfully converted current image to SVG`
					: `Successfully converted ${filesToProcess.length} image(s) to SVG`;

			toastStore.success(message);
			announceToScreenReader(`Conversion completed: ${filesToProcess.length} images processed`);
		} catch (error) {
			console.error('Conversion failed:', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			toastStore.error(`Conversion failed: ${errorMessage}`);
			announceToScreenReader('Conversion failed', 'assertive');
		} finally {
			isProcessing = false;
			currentProgress = null;
			processingImageIndex = currentImageIndex; // Reset to current index when done
			
			// Clear emergency timeout if processing completed normally
			if (emergencyTimeout) {
				clearTimeout(emergencyTimeout);
			}
		}
	}

	function handleDownload() {
		console.log('🔍 [DEBUG] handleDownload called:', {
			canDownload,
			currentImageIndex,
			resultsLength: results.length,
			filesLength: files.length,
			filesMetadataLength: filesMetadata.length
		});

		if (!canDownload) {
			console.warn('Cannot download - no results available');
			return;
		}

		// Bounds checking for array access
		const maxLength = Math.max(
			files.length,
			originalImageUrls.length,
			filesMetadata.length,
			results.length
		);
		if (currentImageIndex < 0 || currentImageIndex >= maxLength) {
			console.error('Current image index out of bounds:', currentImageIndex, 'max:', maxLength);
			toastStore.error('Cannot download - invalid image selection');
			return;
		}

		try {
			const result = results[currentImageIndex];

			// Get filename from either file object or metadata
			let filename = 'converted_image';
			if (currentImageIndex < files.length && files[currentImageIndex]) {
				filename = files[currentImageIndex].name.replace(/\.[^/.]+$/, '');
			} else if (currentImageIndex < filesMetadata.length && filesMetadata[currentImageIndex]) {
				filename = filesMetadata[currentImageIndex].name.replace(/\.[^/.]+$/, '');
			}

			if (result && result.svg) {
				const blob = new Blob([result.svg], { type: 'image/svg+xml' });
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');

				a.href = url;
				a.download = `${filename}.svg`;

				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);

				announceToScreenReader(`Downloaded ${filename}.svg`);
				console.log('✅ [DEBUG] Successfully downloaded:', `${filename}.svg`);
			} else {
				console.warn('🔍 [DEBUG] No result available for download:', { result });
				toastStore.error('No conversion result available for download');
			}
		} catch (error) {
			console.error('Download failed:', error);
			toastStore.error('Download failed');
			announceToScreenReader('Download failed', 'assertive');
		}
	}

	function handleAbort() {
		vectorizerStore.abortProcessing();
		isProcessing = false;
		currentProgress = null;
		processingImageIndex = currentImageIndex; // Reset to current index when aborted
		announceToScreenReader('Conversion stopped');
	}

	function handleReset() {
		// Clean up blob URLs
		previewSvgUrls.forEach((url) => {
			if (url) URL.revokeObjectURL(url);
		});
		// Clean up original image URLs
		originalImageUrls.forEach((url) => {
			if (url) URL.revokeObjectURL(url);
		});

		files = [];
		originalImageUrls = [];
		filesMetadata = [];
		currentImageIndex = 0;
		results = [];
		previewSvgUrls = [];
		currentProgress = null;
		isProcessing = false;
		completedImages = 0;
		batchStartTime = null;

		// Reset pan/zoom state
		panZoomStore.resetStates();

		// Force component remounting by changing key
		componentResetKey++;

		announceToScreenReader('Converter reset');
	}

	async function handleClearAll() {
		// Step 1: Set flag to prevent auto-save during clear operation
		isClearingAll = true;

		try {
			// Step 2: Reset all UI state first (clears arrays, resets indices)
			handleReset();

			// Step 3: Reset all settings to defaults using proper reset method
			settingsSyncStore.resetConfigs();

			// Step 4: Reset settings sync mode to global
			settingsSyncStore.switchMode('global', {
				preserveCurrentConfig: false,
				initializeFromGlobal: false,
				confirmDataLoss: false
			});

			// Step 5: Reset preset selection
			selectedPreset = 'artistic';

			// Step 6: Force reset vectorizer store AND cancel worker operations
			await vectorizerStore.forceReset();

			// Step 7: Clear parameter history
			parameterHistory.clear();

			// Step 8: Reset pan/zoom state (already done in handleReset)

			// Step 9: Clear all persistence data AFTER state is reset
			converterPersistence.clearAll();

			// Step 10: Validate and clean any backend cross-contamination
			const validation = settingsSyncStore.validateAndCleanConfigs();
			if (validation.issues.length > 0) {
				console.log(
					'🛡️ Clear All found and cleaned cross-contamination issues:',
					validation.issues
				);
			}

			// Step 11: Force component remounting by changing key (already done in handleReset)

			toastStore.info('🧹 Cleared all data and reset all settings to defaults');
		} finally {
			// Step 12: Always re-enable auto-save, even if something went wrong
			setTimeout(() => {
				isClearingAll = false;
			}, 100);
		}
	}

	async function handleEmergencyRecovery() {
		try {
			isProcessing = true;
			toastStore.info('🚨 Starting emergency recovery...');

			// Perform emergency recovery
			await vectorizerStore.emergencyRecovery();

			// Reset UI state but keep files
			currentProgress = null;
			isProcessing = false;

			toastStore.success('✅ Emergency recovery completed successfully');
			announceToScreenReader('Emergency recovery completed. Converter is ready to use again');
		} catch (error) {
			console.error('Emergency recovery failed:', error);
			isProcessing = false;
			toastStore.error('❌ Emergency recovery failed. Try refreshing the page');
			announceToScreenReader('Emergency recovery failed', 'assertive');
		}
	}

	// Configuration functions
	function handleConfigChange(updates: Partial<VectorizerConfig>) {
		const currentConfig = settingsSyncStore.getCurrentConfig(currentImageIndex);
		const newConfig = { ...currentConfig, ...updates };
		settingsSyncStore.updateConfig(newConfig, currentImageIndex);

		// Add to parameter history with description
		const description = Object.keys(updates).join(', ') + ' changed';
		parameterHistory.push(newConfig, description);
	}

	function handleConfigReplace(newConfig: VectorizerConfig) {
		settingsSyncStore.updateConfig(newConfig, currentImageIndex);
	}

	function handlePresetChange(preset: VectorizerPreset | 'custom') {
		selectedPreset = preset;
		
		// Convert preset to actual configuration and apply it
		if (preset !== 'custom') {
			// Try to map legacy preset to new StylePreset system
			const legacyToStylePresetMapping: Record<VectorizerPreset, string> = {
				'sketch': 'photo-to-sketch',           // Edge backend - photos to sketches
				'technical': 'technical-drawing',     // Centerline backend - technical drawings  
				'artistic': 'artistic-stippling',     // Dots backend - artistic effects
				'poster': 'modern-abstract',          // Superpixel backend - poster-style
				'comic': 'hand-drawn-illustration'    // Edge backend - hand-drawn style
			};
			
			const stylePresetId = legacyToStylePresetMapping[preset];
			const stylePreset = getPresetById(stylePresetId);
			
			if (stylePreset) {
				// Convert StylePreset to VectorizerConfig to check against current config
				const presetConfig = presetToVectorizerConfig(stylePreset);
				
				// Check if current config already matches this preset (to avoid double-application)
				const configMatches = 
					config.backend === presetConfig.backend &&
					config.detail === presetConfig.detail &&
					config.stroke_width === presetConfig.stroke_width;
				
				if (configMatches) {
					console.log(`🎯 Config already matches ${stylePreset.metadata.name}, skipping re-application`);
				} else {
					console.log(`🎨 Applying preset: ${stylePreset.metadata.name} (${stylePreset.backend})`);
					
					// Apply the preset configuration to the settings store
					settingsSyncStore.updateConfig(presetConfig, currentImageIndex);
					
					console.log(`✅ Preset config applied:`, {
						backend: presetConfig.backend,
						detail: presetConfig.detail,
						stroke_width: presetConfig.stroke_width,
						multipass: presetConfig.multipass,
						hand_drawn_preset: presetConfig.hand_drawn_preset
					});
				}
			} else {
				console.warn(`⚠️ Could not find StylePreset for legacy preset: ${preset}`);
			}
		} else {
			console.log(`🔧 Switching to custom settings - preserving current parameters`);
			
			// Custom mode - no reset, just switch the preset state
			// The current parameters remain as they were
		}
	}


	function handleBackendChange(backend: VectorizerBackend) {
		console.log(`🔧 Backend change: switching to ${backend}`);

		// Get current config from settings sync store
		const currentConfig = settingsSyncStore.getCurrentConfig(currentImageIndex);
		let cleanedConfig = { ...currentConfig, backend };

		// COMPREHENSIVE BACKEND CLEANUP: Reset ALL backend-specific settings to defaults first

		// Reset ALL edge backend specific settings
		cleanedConfig.enable_flow_tracing = false;
		cleanedConfig.enable_bezier_fitting = false;
		cleanedConfig.enable_etf_fdog = false;
		
		// Reset multipass settings (edge-backend specific)
		cleanedConfig.multipass = false;
		cleanedConfig.reverse_pass = false;
		cleanedConfig.diagonal_pass = false;
		cleanedConfig.pass_count = undefined;
		cleanedConfig.multipass_mode = undefined;
		cleanedConfig.trace_min_gradient = undefined;
		cleanedConfig.trace_min_coherency = undefined;
		cleanedConfig.trace_max_gap = undefined;
		cleanedConfig.trace_max_length = undefined;
		cleanedConfig.fit_lambda_curvature = undefined;
		cleanedConfig.fit_max_error = undefined;
		cleanedConfig.fit_split_angle = undefined;
		cleanedConfig.etf_radius = undefined;
		cleanedConfig.etf_iterations = undefined;
		cleanedConfig.etf_coherency_tau = undefined;
		cleanedConfig.fdog_sigma_s = undefined;
		cleanedConfig.fdog_sigma_c = undefined;
		cleanedConfig.fdog_tau = undefined;
		cleanedConfig.nms_low = undefined;
		cleanedConfig.nms_high = undefined;

		// Reset ALL centerline backend specific settings
		cleanedConfig.enable_adaptive_threshold = false;
		cleanedConfig.window_size = undefined;
		cleanedConfig.sensitivity_k = undefined;
		cleanedConfig.use_optimized = undefined;
		cleanedConfig.thinning_algorithm = undefined;
		cleanedConfig.min_branch_length = undefined;
		cleanedConfig.micro_loop_removal = undefined;
		cleanedConfig.enable_width_modulation = undefined;
		cleanedConfig.edt_radius_ratio = undefined;
		cleanedConfig.width_modulation_range = undefined;
		cleanedConfig.max_join_distance = undefined;
		cleanedConfig.max_join_angle = undefined;
		cleanedConfig.edt_bridge_check = undefined;
		cleanedConfig.douglas_peucker_epsilon = undefined;
		cleanedConfig.adaptive_simplification = undefined;

		// Reset ALL dots backend specific settings
		cleanedConfig.dot_density_threshold = undefined;
		cleanedConfig.dot_density = undefined;
		cleanedConfig.dot_size_range = undefined;
		cleanedConfig.min_radius = undefined;
		cleanedConfig.max_radius = undefined;
		cleanedConfig.adaptive_sizing = undefined;
		cleanedConfig.background_tolerance = undefined;
		cleanedConfig.poisson_disk_sampling = undefined;
		cleanedConfig.min_distance_factor = undefined;
		cleanedConfig.grid_resolution = undefined;
		cleanedConfig.gradient_based_sizing = undefined;
		cleanedConfig.local_variance_scaling = undefined;
		cleanedConfig.color_clustering = undefined;
		cleanedConfig.opacity_variation = undefined;

		// Reset ALL superpixel backend specific settings
		cleanedConfig.num_superpixels = undefined;
		cleanedConfig.compactness = undefined;
		cleanedConfig.slic_iterations = undefined;
		cleanedConfig.min_region_size = undefined;
		cleanedConfig.color_distance = undefined;
		cleanedConfig.spatial_distance_weight = undefined;
		cleanedConfig.fill_regions = undefined;
		cleanedConfig.stroke_regions = undefined;
		cleanedConfig.simplify_boundaries = undefined;
		cleanedConfig.boundary_epsilon = undefined;

		// Reset color preservation to default (false) for all backends initially
		cleanedConfig.preserve_colors = false;

		// NOW apply backend-specific defaults for the SELECTED backend
		if (backend === 'dots') {
			cleanedConfig.preserve_colors = true; // Enable Color by default for dots
			cleanedConfig.stroke_width = 1.0; // Dot Width 1.0px by default
			cleanedConfig.adaptive_sizing = true; // Enable adaptive sizing
			cleanedConfig.poisson_disk_sampling = false;
			cleanedConfig.gradient_based_sizing = false;
			console.log(
				'🎯 Applied dots backend defaults: preserve_colors=true, stroke_width=1.0, adaptive_sizing=true'
			);
		}

		if (backend === 'superpixel') {
			cleanedConfig.preserve_colors = true; // Enable Color by default for superpixel
			cleanedConfig.fill_regions = true; // Enable region filling
			cleanedConfig.stroke_regions = false; // Disable region stroking by default
			console.log(
				'🎯 Applied superpixel backend defaults: preserve_colors=true, fill_regions=true'
			);
		}

		if (backend === 'centerline') {
			cleanedConfig.preserve_colors = false; // Centerline typically monochrome
			cleanedConfig.enable_adaptive_threshold = false; // Start with defaults
			console.log('🎯 Applied centerline backend defaults: preserve_colors=false');
		}

		if (backend === 'edge') {
			cleanedConfig.preserve_colors = false; // Edge typically monochrome
			cleanedConfig.enable_flow_tracing = false; // Start with basic edge detection
			cleanedConfig.enable_bezier_fitting = false;
			cleanedConfig.enable_etf_fdog = false;
			
			// Enable multipass settings for edge backend (with sensible defaults)
			cleanedConfig.multipass = false; // Start with simple mode
			cleanedConfig.reverse_pass = false; 
			cleanedConfig.diagonal_pass = false;
			console.log(
				'🎯 Applied edge backend defaults: preserve_colors=false, advanced features disabled, multipass=false'
			);
		}

		console.log(`✅ Backend cleanup complete for ${backend}. Updated config:`, {
			backend: cleanedConfig.backend,
			preserve_colors: cleanedConfig.preserve_colors,
			stroke_width: cleanedConfig.stroke_width,
			adaptive_sizing: cleanedConfig.adaptive_sizing
		});

		// Update the config through the settings sync store
		settingsSyncStore.updateConfig(cleanedConfig, currentImageIndex);

		// Validate that no cross-contamination occurred
		const validation = settingsSyncStore.validateAndCleanConfigs();
		if (validation.issues.length > 0) {
			console.warn(
				`⚠️ Backend change to ${backend} triggered validation cleanup:`,
				validation.issues
			);
		}
	}

	function handleParameterChange() {
		// When user manually changes a parameter, switch to custom preset
		if (selectedPreset !== 'custom') {
			selectedPreset = 'custom';
		}
	}

	// Settings sync mode handlers
	function handleSettingsModeChange(mode: SettingsSyncMode) {
		const success = settingsSyncStore.switchMode(mode, {
			preserveCurrentConfig: true,
			initializeFromGlobal: true,
			confirmDataLoss: false // Confirmation is handled in the UI component
		});

		if (success) {
			console.log(`🔄 Switched to settings sync mode: ${mode}`);
		}
	}

	// Image navigation with settings sync integration
	function handleImageIndexChangeWithSync(index: number) {
		const prevIndex = currentImageIndex;
		currentImageIndex = index;

		// Update settings sync store current index
		settingsSyncStore.setCurrentImageIndex(index);

		console.log(
			`🖼️ Image index changed from ${prevIndex} to ${index} (Mode: ${settingsSyncStore.syncMode})`
		);
	}


	async function handleRetryInitialization() {
		try {
			console.log('🔄 Retrying WASM initialization...');
			toastStore.info('🔄 Retrying WASM initialization...', 3000);

			// Reset the vectorizer store and reinitialize
			await vectorizerStore.reset();
			await vectorizerStore.initialize({ 
				autoInitThreads: true
			});

			toastStore.success('✅ WASM initialization successful!', 3000);
		} catch (error) {
			console.error('❌ Retry initialization failed:', error);
			toastStore.error('❌ Retry failed. Please refresh the page.', 5000);
		}
	}

	// Initialize page
	onMount(async () => {
		try {
			// Initialize WASM module
			await vectorizerStore.initialize({ 
				autoInitThreads: true
			});

			// Show success toast notification
			toastStore.success('🚀 Converter ready! Upload images to get started.', 4000);

			// Always auto-recover state seamlessly
			await recoverSavedState();

			// Initialize parameter history with config
			parameterHistory.initialize(config);

			pageLoaded = true;
			announceToScreenReader('Converter page loaded');
		} catch (error) {
			console.error('❌ Failed to initialize converter page:', error);
			initError = error instanceof Error ? error.message : 'Failed to load converter';
			announceToScreenReader('Failed to load converter page', 'assertive');
		}
	});

	// Helper function to convert data URL to File object
	function dataUrlToFile(dataUrl: string, metadata: FileMetadata): File {
		try {
			// Parse the data URL
			const parts = dataUrl.split(',');
			if (parts.length !== 2) {
				throw new Error('Invalid data URL format');
			}

			const header = parts[0];
			const data = parts[1];

			// Extract MIME type
			const mimeMatch = header.match(/data:([^;]+)/);
			const mimeType = mimeMatch ? mimeMatch[1] : metadata.type;

			// Decode base64 data
			const byteString = atob(data);
			const arrayBuffer = new ArrayBuffer(byteString.length);
			const uint8Array = new Uint8Array(arrayBuffer);

			for (let i = 0; i < byteString.length; i++) {
				uint8Array[i] = byteString.charCodeAt(i);
			}

			return new File([arrayBuffer], metadata.name, {
				type: mimeType,
				lastModified: metadata.lastModified
			});
		} catch (error) {
			console.error('Error converting data URL to File:', error);
			throw new Error(
				`Failed to recreate file ${metadata.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	// Recover saved state function - completely seamless
	async function recoverSavedState() {
		try {
			isRecoveringState = true;
			// console.log('🔄 [DEBUG] Starting state recovery...');

			// Debug localStorage contents
			// const allVec2artKeys = Object.keys(localStorage).filter((k) => k.startsWith('vec2art_'));
			// console.log('🔍 [DEBUG] localStorage vec2art keys found:', allVec2artKeys);
			// allVec2artKeys.forEach((key) => {
			// 	console.log(`📄 [DEBUG] ${key}:`, localStorage.getItem(key));
			// });

			const state = converterPersistence.loadCompleteState();
			// console.log('📋 [DEBUG] loadCompleteState result:', state);

			if (!state) {
				// console.log('⚠️ [DEBUG] No complete state found, trying individual preferences...');
				// Even if no complete state, try to load individual preferences
				const savedConfig = converterPersistence.loadConfig();
				// console.log('⚙️ [DEBUG] savedConfig:', savedConfig);
				if (savedConfig) {
					settingsSyncStore.updateConfig(savedConfig);
					// console.log('✅ [DEBUG] Config restored');
				}
				const savedPreset = converterPersistence.loadPreset();
				// console.log('🎨 [DEBUG] savedPreset:', savedPreset);
				if (savedPreset) {
					selectedPreset = savedPreset as VectorizerPreset | 'custom';
					// console.log('✅ [DEBUG] Preset restored');
				}
				// No performance settings to restore in single-threaded architecture
				// CRITICAL: Set recovery as complete even when no state found
				isRecoveringState = false;
				// console.log('✅ [DEBUG] State recovery completed (no state found)');
				return;
			}

			// console.log('✨ [DEBUG] Complete state found, restoring...');
			// Restore configuration seamlessly
			if (state.config) {
				settingsSyncStore.updateConfig(state.config);
				// console.log('✅ [DEBUG] Config restored from complete state');
			}
			if (state.preset) {
				selectedPreset = state.preset as VectorizerPreset | 'custom';
				// console.log('✅ [DEBUG] Preset restored from complete state');
			}
			// No performance settings to restore in single-threaded architecture
			if (state.currentIndex !== undefined) {
				currentImageIndex = state.currentIndex;
				// console.log('✅ [DEBUG] Current index restored from complete state');
			}

			// Restore original image URLs and recreate File objects
			if (
				state.imageUrls &&
				state.imageUrls.length > 0 &&
				state.filesMetadata &&
				state.filesMetadata.length > 0
			) {
				// console.log('🔄 [DEBUG] Recreating File objects from stored data URLs...');

				const restoredFiles: File[] = [];
				const restoredImageUrls: (string | null)[] = [];

				for (let i = 0; i < state.imageUrls.length; i++) {
					const dataUrl = state.imageUrls[i];
					const metadata = state.filesMetadata[i];

					if (dataUrl && metadata) {
						try {
							// Convert data URL back to File object
							const file = dataUrlToFile(dataUrl, metadata);
							restoredFiles.push(file);

							// Create new blob URL for display
							const displayUrl = URL.createObjectURL(file);
							restoredImageUrls.push(displayUrl);

							// console.log(`✅ [DEBUG] Recreated file: ${metadata.name}`);
						} catch (error) {
							console.error(`❌ [DEBUG] Failed to recreate file ${metadata.name}:`, error);
							// Keep the data URL as fallback for display
							restoredImageUrls.push(dataUrl);
						}
					} else {
						restoredImageUrls.push(null);
					}
				}

				// Set the recreated files and URLs
				files = restoredFiles;
				originalImageUrls = restoredImageUrls;

				// Store metadata for restoration after function completes
				pendingFilesMetadata = [...state.filesMetadata];

				// Log restoration success rate for debugging
				const totalExpected = state.filesMetadata.length;
				const actuallyRestored = restoredFiles.length;
				console.log(
					`📁 [DEBUG] File restoration: ${actuallyRestored}/${totalExpected} files successfully recreated`
				);

				if (actuallyRestored === 0 && totalExpected > 0) {
					console.warn('⚠️ [DEBUG] No files were restored - this will cause the conversion bug!');
				}
			} else if (state.filesMetadata && state.filesMetadata.length > 0) {
				// Fallback: just metadata without data URLs (older format)
				pendingFilesMetadata = [...state.filesMetadata];
				// console.log('✅ [DEBUG] Files metadata scheduled for restoration (no data URLs)');
			}

			// Restore results (but not files - user needs to re-upload)
			if (state.results && state.results.length > 0) {
				const loadedResults = converterPersistence.loadResults();
				results = loadedResults;
				// Create preview URLs for loaded results
				previewSvgUrls = loadedResults.map((result) => {
					if (result && result.svg) {
						const blob = new Blob([result.svg], { type: 'image/svg+xml' });
						return URL.createObjectURL(blob);
					}
					return null;
				});
			}

			// Validate and adjust currentIndex after restoration
			const maxLength = Math.max(
				files.length,
				originalImageUrls.length,
				state.filesMetadata?.length || 0,
				results.length
			);
			if (currentImageIndex >= maxLength) {
				currentImageIndex = Math.max(0, maxLength - 1);
				// console.log('⚠️ [DEBUG] Adjusted currentIndex to fit restored arrays:', currentImageIndex);
			}

			// Show notification about state recovery
			if (state.filesMetadata && state.filesMetadata.length > 0) {
				// CRITICAL: Initialize settings sync store with restored file count
				// This is essential for conversion to work after page reload
				const restoredFileCount = Math.max(
					files.length,
					originalImageUrls.length,
					state.filesMetadata.length
				);
				console.log(
					`🔧 [DEBUG] Initializing settings sync store with ${restoredFileCount} restored files`
				);
				settingsSyncStore.initialize(restoredFileCount, currentImageIndex);

				if (files.length === 0) {
					// Files metadata was restored but actual File objects failed to recreate
					console.log(
						`⚠️ State partially restored: settings and metadata recovered, but files need re-upload`
					);
					hasRecoveredState = true;
					// Show a user-friendly notification about needing to re-upload
					setTimeout(() => {
						toastStore.info(
							'Your previous session was restored with settings preserved. Please re-upload your images to continue where you left off.',
							6000
						);
					}, 1000); // Delay to avoid overlapping with other initialization toasts
				} else {
					// Full successful restoration
					console.log(`✅ Full state restored: ${files.length} files and settings recovered`);
					hasRecoveredState = true;
				}
			}

			// CRITICAL: Mark state recovery as complete
			isRecoveringState = false;
			// console.log('✅ [DEBUG] State recovery completed');
		} catch (error) {
			console.error('❌ [DEBUG] Error during state recovery:', error);
			// CRITICAL: Always clear the recovery flag, even on error
			isRecoveringState = false;
		}
	}

	// Auto-save individual settings when they change
	$effect(() => {
		if (!pageLoaded || isClearingAll) return;
		// console.log('💾 [DEBUG] Saving config:', config);
		const saved = converterPersistence.saveConfig(config);
		// console.log('💾 [DEBUG] Config save result:', saved);
	});

	$effect(() => {
		if (!pageLoaded || isClearingAll) return;
		// console.log('💾 [DEBUG] Saving preset:', selectedPreset);
		converterPersistence.savePreset(selectedPreset);
	});

	// No performance settings to save in single-threaded architecture

	$effect(() => {
		if (!pageLoaded) return;
		// console.log('💾 [DEBUG] Saving current index:', currentImageIndex);
		converterPersistence.saveCurrentIndex(currentImageIndex);
	});

	// Save files metadata when files change
	$effect(() => {
		if (!pageLoaded || files.length === 0 || isRecoveringState) return;
		// console.log('💾 [DEBUG] Saving files metadata:', files.length, 'files');
		converterPersistence.saveFilesMetadata(files);
	});

	// Save image URLs when files change (async) - only save when we have actual files
	$effect(() => {
		if (!pageLoaded || files.length === 0 || isRecoveringState) return;
		// console.log('💾 [DEBUG] Saving image URLs:', files.length, 'files');
		converterPersistence
			.saveImageUrls(files)
			.then((success) => {
				// console.log('💾 [DEBUG] Image URLs save result:', success);
			})
			.catch((error) => {
				console.error('❌ [DEBUG] Failed to save image URLs:', error);
			});
	});

	// Save results when they change
	$effect(() => {
		if (!pageLoaded || results.length === 0 || isRecoveringState) return;
		// console.log('💾 [DEBUG] Saving results:', results.length, 'results');
		converterPersistence.saveResults(results);
	});

	// Handle pending files metadata restoration
	$effect(() => {
		if (pendingFilesMetadata !== null) {
			filesMetadata.splice(0);
			filesMetadata.push(...pendingFilesMetadata);
			pendingFilesMetadata = null;
			console.log('✅ [DEBUG] Files metadata restored from pending state');
		}
	});

	// Cleanup on page unload
	$effect(() => {
		return () => {
			// Update last visited timestamp
			if (converterPersistence.isAutoSaveEnabled()) {
				localStorage.setItem('vec2art_last_visited', Date.now().toString());
			}
			// Cleanup preview URLs
			previewSvgUrls.forEach((url) => {
				if (url) URL.revokeObjectURL(url);
			});
			// Cleanup original image URLs
			originalImageUrls.forEach((url) => {
				if (url) URL.revokeObjectURL(url);
			});
		};
	});

	// Debug logging in development - DISABLED due to performance issues
	// Uncomment only when specifically debugging state issues
	/*
	if (import.meta.env.DEV) {
		$effect(() => {
			console.log('🔍 Converter Page State:', {
				uiState,
				pageLoaded,
				filesCount: files.length,
				originalImageUrlsCount: originalImageUrls.length,
				resultsCount: results.length,
				currentImageIndex,
				hasFiles,
				canConvert,
				canDownload,
				isProcessing,
				hasRecoveredState
			});
		});
	}
	*/
</script>

<svelte:head>
	<title>Image to SVG Converter - vec2art</title>
	<meta
		name="description"
		content="Convert images to SVG line art using advanced algorithms powered by Rust and WebAssembly"
	/>
</svelte:head>

<!-- Screen reader live region -->
<div aria-live="polite" aria-atomic="true" class="sr-only">
	{announceText}
</div>

<!-- Full viewport background wrapper -->
<div class="bg-section-elevated min-h-screen">
	<div class="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8" data-testid="converter-page">
		<!-- Page Header -->
		<header class="mb-8 text-center">
			<h1 class="text-gradient-modern mb-4 text-4xl font-bold">Image to SVG Converter</h1>
			<p class="text-premium mx-auto mt-6 max-w-3xl">
				Transform any raster image into expressive line art SVGs using advanced algorithms
			</p>

			<!-- Status Display -->
			{#if !pageLoaded}
				<div
					class="text-ferrari-600 mt-4 flex items-center justify-center gap-2 text-sm"
					role="status"
					aria-label="Loading converter"
				>
					<Loader2 class="h-4 w-4 animate-spin" aria-hidden="true" />
					Loading converter...
				</div>
			{:else if initError}
				<div
					class="mt-4 flex items-center justify-center gap-2 text-sm text-red-600"
					role="alert"
					aria-label="Converter error"
				>
					<AlertCircle class="h-4 w-4" aria-hidden="true" />
					<span>{initError}</span>
				</div>
			{/if}
		</header>

		<!-- Dev Tools - Clear Persistence Button (TOP RIGHT) -->
		{#if import.meta.env.DEV}
			<div class="fixed top-20 right-4 z-50">
				<button
					class="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white shadow-lg transition-all hover:bg-red-700 hover:shadow-xl"
					onclick={() => {
						// Step 1: Disable auto-save to prevent reactive re-saving
						converterPersistence.setAutoSave(false);

						// Step 2: Reset all UI state first (clears arrays, resets indices)
						handleReset();

						// Step 3: Reset all settings to defaults using proper reset method
						settingsSyncStore.resetConfigs();

						// Step 4: Reset settings sync mode to global
						settingsSyncStore.switchMode('global', {
							preserveCurrentConfig: false,
							initializeFromGlobal: false,
							confirmDataLoss: false
						});

						// Step 5: Reset preset selection
						selectedPreset = 'artistic';

						// Step 6: Reset vectorizer store to clean state
						vectorizerStore.reset();

						// Step 7: Clear parameter history
						parameterHistory.clear();

						// Step 8: Reset pan/zoom state
						panZoomStore.resetStates();

						// Step 9: Clear all persistence data AFTER state is reset
						converterPersistence.clearAll();

						// Step 10: Validate and clean any backend cross-contamination
						const validation = settingsSyncStore.validateAndCleanConfigs();
						if (validation.issues.length > 0) {
							console.log(
								'🛡️ Clear All found and cleaned cross-contamination issues:',
								validation.issues
							);
						}

						// Step 11: Force component remounting by changing key
						componentResetKey++;

						// Step 12: Re-enable auto-save after a delay to allow state to settle
						setTimeout(() => {
							converterPersistence.setAutoSave(true);
						}, 500);

						toastStore.info('🧹 Cleared all data and reset all settings to defaults');
					}}
					title="Clear all data and reset all settings to defaults"
				>
					<RefreshCw class="h-4 w-4" />
					Clear All
				</button>
			</div>
		{/if}

		<!-- Main Content - Layered State UI -->
		{#if pageLoaded && !initError}
			{#if uiState === 'EMPTY'}
				<!-- EMPTY State: Just upload area -->
				<main class="flex justify-center">
					<div class="w-full max-w-4xl">
						<UploadArea onFilesSelect={handleFilesSelect} disabled={isProcessing} />
					</div>
				</main>
			{:else if uiState === 'LOADED'}
				<!-- LOADED State: Converter interface with settings -->
				<main class="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_auto]">
					<!-- Main converter area -->
					<div class="space-y-6">
						{#key componentResetKey}
							<ConverterInterface
								{files}
								{originalImageUrls}
								{filesMetadata}
								{currentImageIndex}
								currentProgress={currentProgress ?? undefined}
								{results}
								{previewSvgUrls}
								{canConvert}
								{canDownload}
								{isProcessing}
								onImageIndexChange={handleImageIndexChange}
								onConvert={handleConvert}
								onDownload={handleDownload}
								onAbort={handleAbort}
								onReset={handleClearAll}
								onAddMore={handleAddMore}
								onRemoveFile={handleRemoveFile}
								isPanicked={vectorizerStore.isPanicked}
								onEmergencyRecovery={handleEmergencyRecovery}
								settingsSyncMode={settingsSyncStore.syncMode}
								onSettingsModeChange={handleSettingsModeChange}
							/>
						{/key}
					</div>

					<!-- Settings panel -->
					<div class="space-y-4 xl:w-80">
						<SettingsPanel
							{config}
							{selectedPreset}
							disabled={isProcessing}
							onConfigChange={handleConfigChange}
							onPresetChange={handlePresetChange}
							onBackendChange={handleBackendChange}
							onParameterChange={handleParameterChange}
						/>
					</div>
				</main>
			{/if}

			<!-- Keyboard Shortcuts -->
			<KeyboardShortcuts
				onConvert={handleConvert}
				onDownload={handleDownload}
				onReset={handleClearAll}
				onAbort={handleAbort}
				onAddMore={handleAddMore}
				{canConvert}
				{canDownload}
				{isProcessing}
			/>
		{:else if initError}
			<!-- Error State -->
			<div class="card-ferrari-static rounded-3xl p-8 text-center" role="alert">
				<div class="mb-4">
					<AlertCircle class="mx-auto h-16 w-16 text-red-500" />
				</div>
				<h2 class="mb-4 text-xl font-bold text-red-700 dark:text-red-400">
					Failed to Load Converter
				</h2>
				<p class="mb-6 text-gray-600 dark:text-gray-300">
					{initError}
				</p>
				<div class="flex justify-center gap-4">
					<button class="btn-ferrari-secondary px-6 py-2 text-sm" onclick={() => location.reload()}>
						Reload Page
					</button>
					<button
						class="btn-ferrari-primary px-6 py-2 text-sm"
						onclick={() => {
							initError = null;
							handleReset();
							pageLoaded = true;
						}}
					>
						Try Again
					</button>
				</div>
			</div>
		{:else}
			<!-- Loading State -->
			<div class="card-ferrari-static rounded-3xl p-8 text-center" role="status">
				<div class="mb-4">
					<Loader2 class="text-ferrari-600 mx-auto h-16 w-16 animate-spin" />
				</div>
				<h2 class="mb-2 text-xl font-bold">Loading Converter...</h2>
				<p class="text-gray-600 dark:text-gray-300">
					Initializing high-performance image processing engine
				</p>
			</div>
		{/if}
	</div>
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
