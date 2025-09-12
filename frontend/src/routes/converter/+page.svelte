<script lang="ts">
	/**
	 * Converter Page - Layered State Architecture
	 * State: EMPTY -> Shows only upload area
	 * State: LOADED -> Shows converter interface with settings
	 */

	import { onMount } from 'svelte';
	import { RefreshCw } from 'lucide-svelte';

	// Import new layered components
	import UploadArea from '$lib/components/converter/UploadArea.svelte';
	import ConverterInterface from '$lib/components/converter/ConverterInterface.svelte';
	import SettingsPanel from '$lib/components/converter/SettingsPanel.svelte';
	import KeyboardShortcuts from '$lib/components/ui/keyboard/KeyboardShortcuts.svelte';
	import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import { parameterHistory } from '$lib/stores/parameter-history.svelte';
	import { converterPersistence } from '$lib/stores/converter-persistence';
	import type { FileMetadata } from '$lib/stores/converter-persistence';
	import { devDebug, devWarn, devError } from '$lib/utils/dev-logger';
	import DownloadFormatSelector from '$lib/components/ui/DownloadFormatSelector.svelte';
	import { downloadService } from '$lib/services/download-service';
	import LoadingState from '$lib/components/ui/LoadingState.svelte';
	import ErrorState from '$lib/components/ui/ErrorState.svelte';

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
	// Removed panZoomStore - now handled internally by SimplifiedPreviewComparison
	import { getPresetById } from '$lib/presets/presets';
	import { presetToVectorizerConfig } from '$lib/presets/converter';

	// Page data with algorithm params from URL
	let { data } = $props();

	// UI State Management - Using Svelte 5 runes
	let files = $state<File[]>([]);
	let originalImageUrls = $state<(string | null)[]>([]); // URLs for original images (for persistence)
	let filesMetadata = $state<FileMetadata[]>([]); // Metadata for original files (for persistence)
	let pendingFilesMetadata = $state<FileMetadata[] | null>(null); // Temporary storage for metadata restoration
	let currentImageIndex = $state(0);
	let currentProgress = $state<ProcessingProgress | null>(null);
	let results = $state<(ProcessingResult | null)[]>([]);
	let previewSvgUrls = $state<(string | null)[]>([]);
	let isProcessing = $state(false);
	let _processingImageIndex = $state(0);
	let _completedImages = $state(0);
	let _batchStartTime = $state<Date | null>(null);

	// Page initialization state
	let pageLoaded = $state(false);
	let initError = $state<string | null>(null);
	let isRecoveringState = $state(false);
	let isClearingAll = $state(false); // Flag to prevent auto-save during Clear All
	let _hasRecoveredState = $state(false);

	// Download format selector state
	let showDownloadSelector = $state(false);
	let pendingDownloadData = $state<{ filename: string; svgContent: string } | null>(null);

	// Component reset key to force remounting
	let componentResetKey = $state(0);

	// Converter configuration state - use settings sync store
	// Initialize settings sync store with enhanced defaults
	settingsSyncStore.updateConfig({
		...DEFAULT_CONFIG,
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
		hasFiles && !isProcessing && vectorizerStore.isInitialized && !vectorizerStore.hasError
	);
	const canDownload = $derived(results.length > 0 && !isProcessing);

	// Accessibility announcements
	let announceText = $state('');

	function announceToScreenReader(message: string, _priority?: 'polite' | 'assertive') {
		announceText = message;
		setTimeout(() => {
			announceText = '';
		}, 1000);
	}

	// Error boundary handlers
	function handleConverterError(error: Error, errorInfo: any) {
		console.error('❌ [ErrorBoundary] Converter component error:', error, errorInfo);
		toastStore.error(`Converter error: ${error.message}. The system will attempt to recover.`);

		// Try to recover by resetting problematic state
		if (error.message.includes('WASM') || error.message.includes('panic')) {
			handleEmergencyRecovery();
		} else if (error.message.includes('validation') || error.message.includes('parameter')) {
			// Reset to default config on validation errors
			settingsSyncStore.updateConfig({ ...DEFAULT_CONFIG });
		}
	}

	function handleSettingsError(error: Error, errorInfo: any) {
		console.error('❌ [ErrorBoundary] Settings panel error:', error, errorInfo);
		toastStore.error(`Settings error: ${error.message}. Settings have been reset to defaults.`);

		// Reset settings to defaults on errors
		settingsSyncStore.updateConfig({ ...DEFAULT_CONFIG });
		selectedPreset = 'custom';
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
			// const startIndex = currentImageIndex;

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
		const conversionStartTime = performance.now();
		console.log('🔍 [DEBUG] handleConvert called with state:', {
			canConvert,
			filesCount: $state.snapshot(files).length,
			originalImageUrlsCount: $state.snapshot(originalImageUrls).length,
			resultsCount: $state.snapshot(results).length,
			currentImageIndex,
			isProcessing,
			hasFiles
		});

		// Pan/zoom state is now handled internally by SimplifiedPreviewComparison

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
			_completedImages = 0;
			_batchStartTime = new Date();
			announceToScreenReader('Starting image conversion');

			emergencyTimeout = setTimeout(() => {
				if (isProcessing) {
					const timeoutMinutes = emergencyTimeoutDuration / 60000;
					console.warn(
						`🚨 Emergency timeout: Forcing UI state reset after ${timeoutMinutes} minutes`
					);
					isProcessing = false;
					currentProgress = null;
					toastStore.error(
						`Processing timeout after ${timeoutMinutes} minutes - UI state reset. Background removal on large images can be very slow. Try reducing image size or disabling background removal.`
					);
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
			// CRITICAL FIX: Use the current reactive config to ensure we have the latest settings
			// that the user sees in the UI, preventing stale settings bug
			console.log(
				'🔍 [DEBUG] Current reactive config being used for conversion:',
				$state.snapshot(config)
			);

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
				filesCount: $state.snapshot(files).length,
				originalImageUrlsCount: $state.snapshot(originalImageUrls).length,
				filesMetadataCount: $state.snapshot(filesMetadata).length,
				resultsCount: $state.snapshot(results).length,
				currentImageIndex
			});

			if (imagesToProcess.length === 0) {
				console.error('❌ [DEBUG] No images to process - settings sync store issue detected');

				// DEFENSIVE FALLBACK: If settings sync is broken, try to process available files directly
				if (files.length > 0) {
					console.log('🔧 [DEBUG] Attempting fallback processing with available files');

					// Process all available files with current config
					await vectorizerStore.setInputFiles(files);
					vectorizerStore.updateConfig(config);

					const fallbackResults = await vectorizerStore.processBatch(
						(imageIndex, totalImages, progress) => {
							_processingImageIndex = imageIndex;
							currentProgress = progress;
							_completedImages = imageIndex;
							announceToScreenReader(`Processing image ${imageIndex + 1}: ${progress.stage}`);
						}
					);

					// Update results (CONSISTENT FIX: Apply same async blob creation pattern)
					results = fallbackResults;

					// Create preview URLs asynchronously to prevent blocking
					const fallbackBlobPromises = fallbackResults.map(async (result, index) => {
						if (result && result.svg) {
							return new Promise<string | null>((resolve) => {
								const createBlob = () => {
									try {
										const blob = new Blob([result.svg], { type: 'image/svg+xml' });
										resolve(URL.createObjectURL(blob));
									} catch (error) {
										console.error(`Failed to create fallback blob URL for image ${index}:`, error);
										resolve(null);
									}
								};

								// Use requestIdleCallback if available, otherwise setTimeout
								if (typeof requestIdleCallback !== 'undefined') {
									requestIdleCallback(createBlob);
								} else {
									setTimeout(createBlob, 0);
								}
							});
						}
						return Promise.resolve(null);
					});

					previewSvgUrls = await Promise.all(fallbackBlobPromises);

					toastStore.success(
						`Fallback processing completed: ${fallbackResults.length} image(s) converted`
					);

					// CRITICAL: Wait for SVG URLs to be fully ready before unlocking UI (fallback path)
					await new Promise((resolve) => setTimeout(resolve, 100));
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
					// CRITICAL FIX: Use getCurrentConfig() to get the most up-to-date config
					// instead of the potentially stale config from getConvertConfig()
					const currentConfig = settingsSyncStore.getCurrentConfig(imageIndex);
					configsToProcess.push(currentConfig);

					// Debug: Compare with potentially stale config
					const staleConfig = convertConfig.configMap.get(imageIndex);
					if (JSON.stringify(currentConfig) !== JSON.stringify(staleConfig)) {
						// FIX: Use $state.snapshot() to avoid proxy warnings
						const currentSnapshot = $state.snapshot(currentConfig);
						console.warn(`⚠️ [STALE SETTINGS DETECTED] Image ${imageIndex}:`, {
							currentConfig: {
								backend: currentSnapshot.backend,
								detail: currentSnapshot.detail,
								stroke_width: currentSnapshot.stroke_width
							},
							staleConfig: {
								backend: staleConfig?.backend,
								detail: staleConfig?.detail,
								stroke_width: staleConfig?.stroke_width
							}
						});
					}
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
						_processingImageIndex = originalIndex;
						currentProgress = progress;

						if (progress.stage === 'preprocessing' && progress.progress === 0) {
							_completedImages = imageIndex;
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
							_processingImageIndex = originalIndex;
							currentProgress = progress;

							if (progress.stage === 'preprocessing' && progress.progress === 0) {
								_completedImages = i;
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

			// CRITICAL FIX: Hybrid blob creation to prevent both main thread blocking AND delayed updates
			// Strategy: Immediate creation for small SVGs, chunked async for large SVGs
			console.log('🔄 [DEBUG] Starting blob creation for', processedResults.length, 'results');
			const startBlobTime = performance.now();
			const blobCreationPromises: Promise<void>[] = [];

			for (let i = 0; i < processedResults.length; i++) {
				const originalIndex = indexMapping[i];
				const result = processedResults[i];

				// Clean up old preview URL if it exists
				if (newPreviewUrls[originalIndex]) {
					URL.revokeObjectURL(newPreviewUrls[originalIndex]!);
				}

				// Update result immediately
				newResults[originalIndex] = result;

				// Create blob URL with hybrid strategy
				if (result && result.svg) {
					const svgSize = result.svg.length;
					const isLargeSvg = svgSize > 500000; // > 500KB threshold

					console.log(
						`🔄 [DEBUG] Creating blob for image ${originalIndex}, size: ${Math.round(svgSize / 1024)}KB, strategy: ${isLargeSvg ? 'chunked-async' : 'immediate'}`
					);

					if (isLargeSvg) {
						// Large SVG: Use chunked async approach with shorter timeout
						const blobPromise = new Promise<void>((resolve) => {
							const createBlob = () => {
								try {
									const blob = new Blob([result.svg], { type: 'image/svg+xml' });
									newPreviewUrls[originalIndex] = URL.createObjectURL(blob);
									console.log(`✅ [DEBUG] Large blob created for image ${originalIndex}`);
								} catch (error) {
									console.error(
										`Failed to create large blob URL for image ${originalIndex}:`,
										error
									);
									newPreviewUrls[originalIndex] = null;
								}
								resolve();
							};

							// CRITICAL FIX: Use shorter timeout for more responsive updates
							// requestIdleCallback can be delayed too long under load
							setTimeout(createBlob, 50); // 50ms max delay instead of waiting for idle
						});
						blobCreationPromises.push(blobPromise);
					} else {
						// Small SVG: Create immediately for instant preview update
						try {
							const blob = new Blob([result.svg], { type: 'image/svg+xml' });
							newPreviewUrls[originalIndex] = URL.createObjectURL(blob);
							console.log(`✅ [DEBUG] Small blob created immediately for image ${originalIndex}`);
						} catch (error) {
							console.error(
								`Failed to create immediate blob URL for image ${originalIndex}:`,
								error
							);
							newPreviewUrls[originalIndex] = null;
						}
					}
				} else {
					newPreviewUrls[originalIndex] = null;
				}
			}

			// CRITICAL FIX: Update results and URLs atomically after all blobs are ready
			// For small SVGs: this completes immediately, for large SVGs: max 50ms delay
			await Promise.all(blobCreationPromises);
			const blobTime = performance.now() - startBlobTime;
			console.log(`✅ [DEBUG] All blob creation completed in ${Math.round(blobTime)}ms`);

			// Atomic update - both arrays updated simultaneously
			results = newResults;
			previewSvgUrls = newPreviewUrls;
			_completedImages = results.filter((r) => r && r.svg).length;

			console.log(
				`🎯 [DEBUG] Preview state updated - results: ${results.length}, preview URLs: ${previewSvgUrls.length}`
			);

			const message =
				filesToProcess.length === 1
					? `Successfully converted current image to SVG`
					: `Successfully converted ${filesToProcess.length} image(s) to SVG`;

			toastStore.success(message);
			announceToScreenReader(`Conversion completed: ${filesToProcess.length} images processed`);

			// CRITICAL: Brief pause to ensure DOM updates with new blob URLs
			// This ensures preview components can access the new URLs immediately
			await new Promise((resolve) => setTimeout(resolve, 100));
			console.log(`🔓 [DEBUG] UI will unlock - blob URLs should be ready for preview components`);

			// Pan/zoom state restoration is now handled internally by SimplifiedPreviewComparison
		} catch (error) {
			console.error('Conversion failed:', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			toastStore.error(`Conversion failed: ${errorMessage}`);
			announceToScreenReader('Conversion failed', 'assertive');
		} finally {
			const totalTime = performance.now() - conversionStartTime;
			console.log(
				`🏁 [DEBUG] Conversion pipeline completed in ${Math.round(totalTime)}ms, unlocking UI`
			);

			isProcessing = false;
			currentProgress = null;
			_processingImageIndex = currentImageIndex; // Reset to current index when done

			// Clear emergency timeout if processing completed normally
			if (emergencyTimeout) {
				clearTimeout(emergencyTimeout);
			}

			console.log(`🔓 [DEBUG] isProcessing set to false - UI should be unlocked now`);
		}
	}

	function handleDownload() {
		console.log('🔍 [DEBUG] handleDownload called:', {
			canDownload,
			currentImageIndex,
			resultsLength: $state.snapshot(results).length,
			filesLength: $state.snapshot(files).length,
			filesMetadataLength: $state.snapshot(filesMetadata).length
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
				// Show format selector instead of immediate download
				pendingDownloadData = {
					filename,
					svgContent: result.svg
				};
				showDownloadSelector = true;
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

	// Download handler functions for format selector
	function handleDownloadSvg() {
		if (!pendingDownloadData) return;

		try {
			downloadService
				.downloadSvg(pendingDownloadData.svgContent, {
					format: 'svg',
					filename: pendingDownloadData.filename
				})
				.then((result) => {
					if (result.success) {
						announceToScreenReader(`Downloaded ${result.filename}`);
						console.log('✅ [DEBUG] Successfully downloaded:', result.filename);
						toastStore.success(`Downloaded ${result.filename} (${result.fileSizeKB}KB)`);
					} else {
						throw new Error(result.error || 'Download failed');
					}
				});
		} catch (error) {
			console.error('SVG download failed:', error);
			toastStore.error('SVG download failed');
			announceToScreenReader('SVG download failed', 'assertive');
		} finally {
			showDownloadSelector = false;
			pendingDownloadData = null;
		}
	}

	async function handleDownloadWebP() {
		if (!pendingDownloadData) return;

		try {
			const result = await downloadService.downloadSvg(pendingDownloadData.svgContent, {
				format: 'webp',
				filename: pendingDownloadData.filename,
				webpOptions: {
					quality: 0.9,
					maxWidth: 4096,
					maxHeight: 4096
				}
			});

			if (result.success) {
				announceToScreenReader(`Downloaded ${result.filename}`);
				console.log('✅ [DEBUG] Successfully downloaded:', result.filename);
				toastStore.success(`Downloaded ${result.filename} (${result.fileSizeKB}KB)`);
			} else {
				throw new Error(result.error || 'WebP download failed');
			}
		} catch (error) {
			console.error('WebP download failed:', error);
			toastStore.error('WebP download failed');
			announceToScreenReader('WebP download failed', 'assertive');
		} finally {
			showDownloadSelector = false;
			pendingDownloadData = null;
		}
	}

	function handleDownloadCancel() {
		showDownloadSelector = false;
		pendingDownloadData = null;
	}

	function handleAbort() {
		vectorizerStore.abortProcessing();
		isProcessing = false;
		currentProgress = null;
		_processingImageIndex = currentImageIndex; // Reset to current index when aborted
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
		_completedImages = 0;
		_batchStartTime = null;

		// Pan/zoom reset is now handled internally by SimplifiedPreviewComparison

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

	function handlePresetChange(preset: VectorizerPreset | 'custom') {
		selectedPreset = preset;

		// Convert preset to actual configuration and apply it
		if (preset !== 'custom') {
			// Try to map legacy preset to new StylePreset system
			const legacyToStylePresetMapping: Record<VectorizerPreset, string> = {
				sketch: 'photo-to-sketch', // Edge backend - photos to sketches
				technical: 'technical-drawing', // Centerline backend - technical drawings
				artistic: 'artistic-stippling', // Dots backend - artistic effects
				poster: 'modern-abstract', // Superpixel backend - poster-style
				comic: 'hand-drawn-illustration' // Edge backend - hand-drawn style
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
					console.log(
						`🎯 Config already matches ${stylePreset.metadata.name}, skipping re-application`
					);
				} else {
					console.log(`🎨 Applying preset: ${stylePreset.metadata.name} (${stylePreset.backend})`);

					// Apply the preset configuration to the settings store
					settingsSyncStore.updateConfig(presetConfig, currentImageIndex);

					console.log(
						`✅ Preset config applied:`,
						$state.snapshot({
							backend: presetConfig.backend,
							detail: presetConfig.detail,
							stroke_width: presetConfig.stroke_width,
							multipass: presetConfig.multipass,
							hand_drawn_preset: presetConfig.hand_drawn_preset
						})
					);
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

		// SIMPLIFIED: Let the vectorizer store handle backend switching with proper defaults
		// The vectorizer store has per-algorithm configurations that handle all the complexity
		vectorizerStore.updateConfig({ backend });

		// Sync the vectorizer store config to the settings sync store
		const updatedConfig = vectorizerStore.config;
		settingsSyncStore.updateConfig(updatedConfig, currentImageIndex);

		console.log(
			`✅ Backend switched to ${backend} using store defaults:`,
			$state.snapshot({
				backend: updatedConfig.backend,
				detail: updatedConfig.detail,
				stroke_width: updatedConfig.stroke_width,
				enable_adaptive_threshold: updatedConfig.enable_adaptive_threshold,
				preserve_colors: updatedConfig.preserve_colors
			})
		);
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

	// Initialize page
	onMount(async () => {
		try {
			// Initialize WASM module
			await vectorizerStore.initialize({
				autoInitThreads: true
			});

			// Check for algorithm selection from URL params or sessionStorage
			const urlBackend = data?.algorithmParams?.backend;
			const urlPreset = data?.algorithmParams?.preset;
			const sessionData =
				typeof window !== 'undefined'
					? JSON.parse(sessionStorage.getItem('selectedAlgorithm') || '{}')
					: {};

			// Apply algorithm selection if available
			if (urlBackend || sessionData.backend) {
				const backend = urlBackend || sessionData.backend;
				const preset = urlPreset || sessionData.preset;
				const name = sessionData.name;

				// Update config with selected algorithm
				config.backend = backend;

				// Apply preset if provided
				if (preset) {
					const presetConfig = getPresetById(preset);
					if (presetConfig) {
						const vectorizerConfig = presetToVectorizerConfig(presetConfig);
						Object.assign(config, vectorizerConfig);
					}
				}

				// Update vectorizer store
				vectorizerStore.updateConfig(config);

				// Show notification about selected algorithm
				if (name) {
					toastStore.success(`🎨 ${name} algorithm selected! Upload images to start.`, 4000);
				} else {
					toastStore.success('🚀 Converter ready! Upload images to get started.', 4000);
				}

				// Clear sessionStorage after use
				if (typeof window !== 'undefined') {
					sessionStorage.removeItem('selectedAlgorithm');
				}
			} else {
				// Show default success toast notification
				toastStore.success('🚀 Converter ready! Upload images to get started.', 4000);
			}

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

				// CRITICAL FIX: Show loading state for large SVG blob creation during restoration
				const hasLargeSvgs = loadedResults.some(
					(result) => result && result.svg && result.svg.length > 1000000 // > 1MB
				);

				if (hasLargeSvgs) {
					console.log('🔄 [DEBUG] Detected large SVGs during restoration - showing loading state');
					// Temporarily show loading state for large restorations
					isProcessing = true;
				}

				// Create preview URLs for loaded results (CONSISTENT FIX: Apply same async pattern)
				const restoredBlobPromises = loadedResults.map(async (result, index) => {
					if (result && result.svg) {
						return new Promise<string | null>((resolve) => {
							const createBlob = () => {
								try {
									const blob = new Blob([result.svg], { type: 'image/svg+xml' });
									resolve(URL.createObjectURL(blob));
								} catch (error) {
									console.error(`Failed to create restored blob URL for result ${index}:`, error);
									resolve(null);
								}
							};

							// Use requestIdleCallback if available, otherwise setTimeout
							if (typeof requestIdleCallback !== 'undefined') {
								requestIdleCallback(createBlob);
							} else {
								setTimeout(createBlob, 0);
							}
						});
					}
					return Promise.resolve(null);
				});

				previewSvgUrls = await Promise.all(restoredBlobPromises);

				// CRITICAL FIX: Clear loading state after blob restoration completes
				if (hasLargeSvgs) {
					isProcessing = false;
					console.log('✅ [DEBUG] Large SVG blob restoration completed - cleared loading state');
				}
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
					_hasRecoveredState = true;
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
					_hasRecoveredState = true;
				}
			}

			// Pan/zoom state restoration is now handled internally by SimplifiedPreviewComparison

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
		converterPersistence.saveConfig(config);
		// console.log('💾 [DEBUG] Config saved');
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

	// Pan/zoom state persistence is now handled internally by SimplifiedPreviewComparison

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
			.then(() => {
				// console.log('💾 [DEBUG] Image URLs saved');
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
				_hasRecoveredState
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
		</header>


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
				<main class="grid grid-cols-1 gap-6 md:gap-8 xl:grid-cols-[1fr_auto]">
					<!-- Main converter area with error boundary -->
					<div class="space-y-4 md:space-y-6">
						{#key componentResetKey}
							<ErrorBoundary onError={handleConverterError}>
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
							</ErrorBoundary>
						{/key}
					</div>

					<!-- Settings panel with error boundary -->
					<div class="space-y-4 xl:w-80">
						<ErrorBoundary onError={handleSettingsError}>
							<SettingsPanel
								{config}
								{selectedPreset}
								disabled={isProcessing}
								onConfigChange={handleConfigChange}
								onPresetChange={handlePresetChange}
								onBackendChange={handleBackendChange}
								onParameterChange={handleParameterChange}
							/>
						</ErrorBoundary>
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
			<div class="card-ferrari-static rounded-3xl p-8">
				<ErrorState
					title="Failed to Load Converter"
					message={initError}
					size="lg"
					showRetry={true}
					showReload={true}
					onRetry={() => {
						initError = null;
						handleReset();
						pageLoaded = true;
					}}
					onReload={() => location.reload()}
				/>
			</div>
		{:else}
			<!-- Loading State -->
			<div class="card-ferrari-static rounded-3xl p-8">
				<LoadingState message="Loading Converter..." size="lg" center={true}>
					{#snippet subtitle()}
						Initializing high-performance image processing engine
					{/snippet}
				</LoadingState>
			</div>
		{/if}
	</div>
</div>

<!-- Download Format Selector Modal -->
{#if pendingDownloadData}
	<DownloadFormatSelector
		filename={pendingDownloadData.filename}
		svgContent={pendingDownloadData.svgContent}
		onDownloadSvg={handleDownloadSvg}
		onDownloadWebP={handleDownloadWebP}
		onCancel={handleDownloadCancel}
		show={showDownloadSelector}
		{isProcessing}
	/>
{/if}

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
