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
	import KeyboardShortcuts from '$lib/components/ui/keyboard/KeyboardShortcuts.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import { parameterHistory } from '$lib/stores/parameter-history.svelte';
	import { converterPersistence } from '$lib/stores/converter-persistence';
	import type { FileMetadata } from '$lib/stores/converter-persistence';

	// Types and stores
	import type {
		ProcessingProgress,
		ProcessingResult,
		VectorizerConfig,
		VectorizerBackend,
		VectorizerPreset
	} from '$lib/types/vectorizer';
	import type { PerformanceMode } from '$lib/utils/performance-monitor';
	import { getOptimalThreadCount } from '$lib/utils/performance-monitor';
	import { vectorizerStore } from '$lib/stores/vectorizer.svelte.js';
	import { wasmWorkerService } from '$lib/services/wasm-worker-service';

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

	// Batch processing state
	let completedImages = $state(0);
	let batchStartTime = $state<Date | null>(null);

	// Page initialization state
	let pageLoaded = $state(false);
	let initError = $state<string | null>(null);
	let hasRecoveredState = $state(false);
	let isRecoveringState = $state(false);

	// Converter configuration state
	let config = $state<VectorizerConfig>({
		backend: 'edge',
		detail: 0.5,
		stroke_width: 1.5,
		noise_filtering: true,
		multipass: false,
		pass_count: 1,
		multipass_mode: 'auto',
		reverse_pass: false,
		diagonal_pass: false,
		enable_etf_fdog: false,
		enable_flow_tracing: false,
		enable_bezier_fitting: false,
		hand_drawn_preset: 'medium',
		variable_weights: 0.3,
		tremor_strength: 0.3,
		tapering: 0.7,
		optimize_svg: true,
		svg_precision: 2
	});

	let selectedPreset = $state<VectorizerPreset | 'custom'>('artistic');
	let performanceMode = $state<PerformanceMode>('balanced');
	let threadCount = $state(4); // Default to balanced mode thread count, will be updated by performance mode calculation
	let threadsInitialized = $state(false);

	// Derived states for UI logic - account for restored results
	// UI state - files, original image URLs, AND results control the state
	const uiState = $derived(
		files.length === 0 && originalImageUrls.length === 0 && results.length === 0
			? 'EMPTY'
			: 'LOADED'
	);
	const hasFiles = $derived(files.length > 0 || originalImageUrls.length > 0);
	const canConvert = $derived(hasFiles && !isProcessing);
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
	async function handleFilesSelect(selectedFiles: File[], preserveCurrentIndex: boolean = false, retryCount: number = 0) {
		console.log('🔍 [DEBUG] handleFilesSelect called:', {
			selectedFilesCount: selectedFiles.length,
			selectedFileNames: selectedFiles.map(f => f.name),
			currentFilesCount: files.length,
			currentOriginalUrlsCount: originalImageUrls.length,
			preserveCurrentIndex,
			isRecoveringState,
			pageLoaded
		});

		// CRITICAL: Don't process uploads during state recovery to prevent race conditions
		if (isRecoveringState) {
			console.log('⚠️ [DEBUG] Blocking file upload during state recovery, retry count:', retryCount);
			
			// Prevent infinite retry loops
			if (retryCount >= 50) { // Max 5 seconds of retries (50 * 100ms)
				console.error('❌ [DEBUG] Max retry attempts reached, forcing state recovery to complete');
				isRecoveringState = false; // Force recovery to complete
			} else {
				// Queue the upload to retry after state recovery completes
				setTimeout(() => handleFilesSelect(selectedFiles, preserveCurrentIndex, retryCount + 1), 100);
				return;
			}
		}

		const previousFileCount = files.length;
		const previousRestoredCount = Math.max(originalImageUrls.length, filesMetadata.length);
		
		// FIXED: Don't consider restored state as "existing data" for fresh uploads
		// Only consider actual File objects as existing data
		const hasExistingFiles = previousFileCount > 0;

		console.log('🔍 [DEBUG] File selection state:', {
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
		if (!preserveCurrentIndex || (!hasExistingFiles)) {
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

		console.log('🔍 [DEBUG] handleFilesSelect completed:', {
			finalFilesCount: files.length,
			finalFileNames: files.map(f => f.name),
			finalOriginalUrlsCount: originalImageUrls.length,
			finalCurrentIndex: currentImageIndex
		});
	}

	function handleImageIndexChange(index: number) {
		const maxLength = Math.max(files.length, originalImageUrls.length, filesMetadata.length, results.length);
		if (index >= 0 && index < maxLength) {
			currentImageIndex = index;
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
		const maxLength = Math.max(files.length, originalImageUrls.length, filesMetadata.length, results.length, previewSvgUrls.length);
		if (index < 0 || index >= maxLength || isProcessing) {
			console.warn('Cannot remove file - invalid index or processing:', { index, maxLength, isProcessing });
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
			console.warn('Cannot convert - no files or already processing');
			return;
		}

		try {
			isProcessing = true;
			completedImages = 0;
			batchStartTime = new Date();
			announceToScreenReader('Starting image conversion');

			// Initialize WASM using Web Worker (prevents main thread blocking)
			try {
				if (!wasmWorkerService.initialized) {
					console.log('🔧 Initializing WASM in Web Worker...');
					
					// Initialize with requested thread count (safe in Worker context)
					await wasmWorkerService.initialize({ 
						threadCount: threadCount || 1 
					});
					
					console.log('✅ WASM Web Worker initialized successfully');
					
					if (threadCount > 1) {
						toastStore.success(`Multi-threading enabled with ${threadCount} threads`, 3000);
					}
				}
			} catch (error) {
				console.error('❌ Web Worker initialization failed:', error);
				toastStore.error('Failed to initialize image processor - please refresh', 5000);
				throw error;
			}

			// Check if we have any actual files to process
			if (files.length === 0) {
				console.log('🔍 [DEBUG] No files available for conversion');
				if (originalImageUrls.length > 0) {
					toastStore.error('Files from previous session could not be restored. Please upload your images again.');
				} else {
					toastStore.error('No files available for conversion. Please upload some images first.');
				}
				return;
			}

			// Smart conversion logic:
			// 1. Always convert current image (even if already converted)
			// 2. Convert any images that don't have results yet
			// 3. Skip already converted images (except current)

			const filesToProcess: File[] = [];
			const indexMapping: number[] = []; // Maps processed file index to original file index

			// Always include current image first (gets re-converted)
			if (files[currentImageIndex]) {
				filesToProcess.push(files[currentImageIndex]);
				indexMapping.push(currentImageIndex);
			}

			// Add any files that haven't been converted yet
			for (let i = 0; i < files.length; i++) {
				if (i !== currentImageIndex && (!results[i] || !results[i]?.svg)) {
					filesToProcess.push(files[i]);
					indexMapping.push(i);
				}
			}

			if (filesToProcess.length === 0) {
				toastStore.info('No files available for conversion');
				return;
			}

			console.log(
				`🎯 Smart conversion: Processing ${filesToProcess.length} files (current: ${currentImageIndex}, total: ${files.length})`
			);

			// Set up vectorizer with files to process
			await vectorizerStore.setInputFiles(filesToProcess);
			
			// Sync current config to vectorizer store before processing
			vectorizerStore.updateConfig(config);

			// Process files
			const processedResults = await vectorizerStore.processBatch(
				(imageIndex, totalImages, progress) => {
					const originalIndex = indexMapping[imageIndex];
					currentImageIndex = originalIndex; // Show progress on the actual file being processed
					currentProgress = progress;

					// Update completed count when a new image starts processing
					if (progress.stage === 'preprocessing' && progress.progress === 0) {
						completedImages = imageIndex;
					}

					announceToScreenReader(`Processing image ${originalIndex + 1}: ${progress.stage}`);
				}
			);

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
		const maxLength = Math.max(files.length, originalImageUrls.length, filesMetadata.length, results.length);
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
		announceToScreenReader('Converter reset');
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
		const newConfig = { ...config, ...updates };
		config = newConfig;

		// Add to parameter history with description
		const description = Object.keys(updates).join(', ') + ' changed';
		parameterHistory.push(newConfig, description);
	}

	function handleConfigReplace(newConfig: VectorizerConfig) {
		config = newConfig;
	}

	function handlePresetChange(preset: VectorizerPreset | 'custom') {
		selectedPreset = preset;
	}

	function handleBackendChange(backend: VectorizerBackend) {
		// Clean up backend-specific settings when switching
		let cleanedConfig = { ...config, backend };
		
		// If switching away from edge backend, disable edge-specific features
		if (backend !== 'edge') {
			cleanedConfig.enable_flow_tracing = false;
			cleanedConfig.enable_bezier_fitting = false;
			cleanedConfig.enable_etf_fdog = false;
		}
		
		// If switching away from dots backend, reset dots-specific settings
		if (backend !== 'dots') {
			cleanedConfig.preserve_colors = false;
			cleanedConfig.adaptive_sizing = true;
			cleanedConfig.poisson_disk_sampling = false;
			cleanedConfig.gradient_based_sizing = false;
		}
		
		// If switching away from centerline backend, reset centerline-specific settings
		if (backend !== 'centerline') {
			cleanedConfig.enable_adaptive_threshold = false;
		}
		
		config = cleanedConfig;
	}

	function handleParameterChange() {
		// Parameter change handled by config updates
	}

	function handlePerformanceModeChange(mode: PerformanceMode, threads: number) {
		performanceMode = mode;
		threadCount = threads;
	}

	async function handleRetryInitialization() {
		try {
			console.log('🔄 Retrying WASM initialization...');
			toastStore.info('🔄 Retrying WASM initialization...', 3000);
			
			// Reset the vectorizer store and reinitialize
			await vectorizerStore.reset();
			await vectorizerStore.initialize({ autoInitThreads: false });
			
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
			await vectorizerStore.initialize({ autoInitThreads: false });

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
			throw new Error(`Failed to recreate file ${metadata.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
					config = savedConfig;
					// console.log('✅ [DEBUG] Config restored');
				}
				const savedPreset = converterPersistence.loadPreset();
				// console.log('🎨 [DEBUG] savedPreset:', savedPreset);
				if (savedPreset) {
					selectedPreset = savedPreset as VectorizerPreset | 'custom';
					// console.log('✅ [DEBUG] Preset restored');
				}
				const perfSettings = converterPersistence.loadPerformanceSettings();
				// console.log('⚡ [DEBUG] perfSettings:', perfSettings);
				if (perfSettings.mode) {
					performanceMode = perfSettings.mode as PerformanceMode;
					// Use proper performance mode thread calculation
					if (perfSettings.threadCount) {
						threadCount = perfSettings.threadCount;
					} else {
						// Calculate proper thread count based on performance mode
						threadCount = getOptimalThreadCount(perfSettings.mode as PerformanceMode);
					}
					// console.log('✅ [DEBUG] Performance settings restored');
				} else {
					// No saved performance settings - use optimal default for balanced mode
					threadCount = getOptimalThreadCount('balanced');
					// console.log('🎯 [DEBUG] Set default optimal thread count for balanced mode:', threadCount);
				}
				// CRITICAL: Set recovery as complete even when no state found
				isRecoveringState = false;
				// console.log('✅ [DEBUG] State recovery completed (no state found)');
				return;
			}

		// console.log('✨ [DEBUG] Complete state found, restoring...');
		// Restore configuration seamlessly
		if (state.config) {
			config = state.config;
			// console.log('✅ [DEBUG] Config restored from complete state');
		}
		if (state.preset) {
			selectedPreset = state.preset as VectorizerPreset | 'custom';
			// console.log('✅ [DEBUG] Preset restored from complete state');
		}
		if (state.performanceMode) {
			performanceMode = state.performanceMode as PerformanceMode;
			// console.log('✅ [DEBUG] Performance mode restored from complete state');
		}
		if (state.threadCount) {
			// Use saved thread count as-is, respecting user's choice
			threadCount = state.threadCount;
			// console.log('✅ [DEBUG] Thread count restored from complete state');
		}
		if (state.currentIndex !== undefined) {
			currentImageIndex = state.currentIndex;
			// console.log('✅ [DEBUG] Current index restored from complete state');
		}

		// Restore original image URLs and recreate File objects
		if (state.imageUrls && state.imageUrls.length > 0 && state.filesMetadata && state.filesMetadata.length > 0) {
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
			// console.log(`✅ [DEBUG] Recreated ${restoredFiles.length} files from stored state`);
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

		// Get filesMetadata from state first
		const filesMetadata = state.filesMetadata;

		// Validate and adjust currentIndex after restoration
		const maxLength = Math.max(files.length, originalImageUrls.length, filesMetadata?.length || 0, results.length);
		if (currentImageIndex >= maxLength) {
			currentImageIndex = Math.max(0, maxLength - 1);
			// console.log('⚠️ [DEBUG] Adjusted currentIndex to fit restored arrays:', currentImageIndex);
		}

		// Only show a subtle notification if we recovered actual results
		if (filesMetadata && filesMetadata.length > 0 && state.results && state.results.length > 0) {
			// Subtle notification - not intrusive
			console.log(`Restored ${filesMetadata.length} previous results`);
			hasRecoveredState = true;
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
		if (!pageLoaded) return;
		// console.log('💾 [DEBUG] Saving config:', config);
		const saved = converterPersistence.saveConfig(config);
		// console.log('💾 [DEBUG] Config save result:', saved);
	});

	$effect(() => {
		if (!pageLoaded) return;
		// console.log('💾 [DEBUG] Saving preset:', selectedPreset);
		converterPersistence.savePreset(selectedPreset);
	});

	$effect(() => {
		if (!pageLoaded) return;
		// console.log('💾 [DEBUG] Saving performance settings:', performanceMode, threadCount);
		converterPersistence.savePerformanceSettings(performanceMode, threadCount);
	});

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
	<div class="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
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
						converterPersistence.clearAll();
						handleReset();
						toastStore.info('🧹 Cleared all cached data and persistence');
						location.reload();
					}}
					title="Clear all cached data and reload page"
				>
					<RefreshCw class="h-4 w-4" />
					Clear Cache
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
							onReset={handleReset}
							onAddMore={handleAddMore}
							onRemoveFile={handleRemoveFile}
							isPanicked={vectorizerStore.isPanicked}
							onEmergencyRecovery={handleEmergencyRecovery}
						/>
					</div>

					<!-- Settings panel -->
					<div class="space-y-4 xl:w-80">
						<SettingsPanel
							{config}
							{selectedPreset}
							{performanceMode}
							{threadCount}
							{threadsInitialized}
							hasError={vectorizerStore.hasError}
							disabled={isProcessing}
							onConfigChange={handleConfigChange}
							onPresetChange={handlePresetChange}
							onBackendChange={handleBackendChange}
							onParameterChange={handleParameterChange}
							onPerformanceModeChange={handlePerformanceModeChange}
							onRetryInitialization={handleRetryInitialization}
						/>
					</div>
				</main>
			{/if}

			<!-- Keyboard Shortcuts -->
			<KeyboardShortcuts
				onConvert={handleConvert}
				onDownload={handleDownload}
				onReset={handleReset}
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
