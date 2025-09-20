/**
 * Converter Core State Store
 *
 * Handles image processing, file management, progress tracking, and results.
 * Extracted from vectorizer.svelte.ts to separate processing concerns from
 * configuration and WASM management.
 */

import { browser } from '$app/environment';
import type {
	VectorizerError,
	ProcessingResult,
	ProcessingProgress
} from '$lib/workers/vectorizer.worker';
import type { AlgorithmConfig } from '$lib/types/algorithm-configs';

// Import the algorithm config store
import { algorithmConfigStore } from './algorithm-config-store.svelte';
import { WasmWorkerService } from '$lib/services/wasm-worker-service';
import { imagePersistence } from '$lib/services/image-persistence.service';

interface ProcessingState {
	is_processing: boolean;
	current_progress: ProcessingProgress | undefined;
	last_result: ProcessingResult | undefined;
	batch_results: ProcessingResult[];
}

interface ImageState {
	input_image: ImageData | undefined;
	input_file: File | undefined;
	input_images: ImageData[];
	input_files: File[];
	current_image_index: number;
}

interface ErrorState {
	has_error: boolean;
	error: VectorizerError | undefined;
}

export class ConverterStateStore {
	// WASM worker service
	private wasmWorkerService = WasmWorkerService.getInstance();

	// Track current session ID for persistence updates
	private currentSessionId: number | null = null;

	constructor() {
		// Don't load saved state in constructor - let the page handle it after WASM init
		// This ensures proper initialization order
	}

	// Core processing state
	private _processingState = $state<ProcessingState>({
		is_processing: false,
		current_progress: undefined,
		last_result: undefined,
		batch_results: []
	});

	// Image management state
	private _imageState = $state<ImageState>({
		input_image: undefined,
		input_file: undefined,
		input_images: [],
		input_files: [],
		current_image_index: 0
	});

	// Error state (processing-specific errors)
	private _errorState = $state<ErrorState>({
		has_error: false,
		error: undefined
	});

	// Public getters for processing state
	get isProcessing(): boolean {
		return this._processingState.is_processing;
	}

	get currentProgress(): ProcessingProgress | undefined {
		return this._processingState.current_progress;
	}

	get lastResult(): ProcessingResult | undefined {
		return this._processingState.last_result;
	}

	get batchResults(): ProcessingResult[] {
		return this._processingState.batch_results || [];
	}

	// Public getters for image state
	get inputImage(): ImageData | undefined {
		return this._imageState.input_image;
	}

	get inputFile(): File | undefined {
		return this._imageState.input_file;
	}

	get inputImages(): ImageData[] {
		return this._imageState.input_images || [];
	}

	get inputFiles(): File[] {
		return this._imageState.input_files || [];
	}

	get currentImageIndex(): number {
		return this._imageState.current_image_index || 0;
	}

	get currentInputImage(): ImageData | undefined {
		if (
			this._imageState.input_images?.length &&
			this._imageState.current_image_index !== undefined
		) {
			return this._imageState.input_images[this._imageState.current_image_index];
		}
		return this._imageState.input_image;
	}

	get currentInputFile(): File | undefined {
		if (
			this._imageState.input_files?.length &&
			this._imageState.current_image_index !== undefined
		) {
			return this._imageState.input_files[this._imageState.current_image_index];
		}
		return this._imageState.input_file;
	}

	get hasMultipleImages(): boolean {
		return (this._imageState.input_files?.length || 0) > 1;
	}

	// Public getters for error state
	get hasError(): boolean {
		return this._errorState.has_error;
	}

	get error(): VectorizerError | undefined {
		return this._errorState.error;
	}

	/**
	 * FILE MANAGEMENT (extracted from vectorizer.svelte.ts)
	 */

	/**
	 * Set input image from File
	 */
	async setInputFile(file: File): Promise<void> {
		try {
			this.clearError();
			this._imageState.input_file = file;

			// Convert file to ImageData
			const imageData = await this.fileToImageData(file);
			this._imageState.input_image = imageData;

			// Save to IndexedDB for persistence
			const result = await imagePersistence.saveImageSession([file]);
			if (result.success && result.sessionId) {
				this.currentSessionId = result.sessionId;
			}

			console.log(
				`[ConverterStateStore] Set input file: ${file.name} (${imageData.width}x${imageData.height})`
			);
		} catch (error) {
			const fileError = {
				type: 'processing' as const,
				message: 'Failed to load image file',
				details: error instanceof Error ? error.message : String(error)
			};
			this.setError(fileError);
			throw error;
		}
	}

	/**
	 * Set input image directly from ImageData
	 */
	setInputImage(imageData: ImageData): void {
		this._imageState.input_image = imageData;
		this._imageState.input_file = undefined; // Clear file if setting raw ImageData
		// Clear multi-image state when setting single image
		this._imageState.input_images = [];
		this._imageState.input_files = [];
		this._imageState.current_image_index = 0;
		this.clearError();

		// Note: Raw ImageData without File cannot be persisted to IndexedDB
		this.currentSessionId = null;

		console.log(`[ConverterStateStore] Set input image: ${imageData.width}x${imageData.height}`);
	}

	/**
	 * Set multiple input files
	 */
	async setInputFiles(files: File[]): Promise<void> {
		try {
			this.clearError();
			this._imageState.input_files = files;
			this._imageState.current_image_index = 0;

			// Convert all files to ImageData
			const imageDataArray: ImageData[] = [];
			const successfulFiles: File[] = [];
			const failedFiles: string[] = [];

			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				try {
					const imageData = await this.fileToImageData(file);
					imageDataArray.push(imageData);
					successfulFiles.push(file);
				} catch (error) {
					console.error(`Failed to load file ${file.name}:`, error);
					failedFiles.push(file.name);
					console.warn(`Skipping failed file ${file.name} - continuing with remaining files`);
				}
			}

			// If ALL files failed, throw error
			if (imageDataArray.length === 0 && files.length > 0) {
				const fileList = failedFiles.join(', ');
				throw new Error(
					`Failed to load any image files. Failed files: ${fileList}. Please re-upload your images.`
				);
			}

			// Update state with successful files only
			this._imageState.input_files = successfulFiles;
			this._imageState.input_images = imageDataArray;

			// Set current single-image state to first image for backward compatibility
			if (successfulFiles.length > 0) {
				this._imageState.input_file = successfulFiles[0];
				this._imageState.input_image = imageDataArray[0];
			}

			// Clear batch results when new files are set
			this._processingState.batch_results = [];

			// Save to IndexedDB for persistence
			const result = await imagePersistence.saveImageSession(successfulFiles);
			if (result.success && result.sessionId) {
				this.currentSessionId = result.sessionId;
			}

			// Log results
			if (failedFiles.length > 0) {
				console.warn(
					`[ConverterStateStore] ${failedFiles.length} file(s) failed to load and were skipped: ${failedFiles.join(', ')}`
				);
			}
			console.log(
				`[ConverterStateStore] Set ${successfulFiles.length} input files for batch processing (${failedFiles.length} skipped)`
			);
		} catch (error) {
			const filesError = {
				type: 'processing' as const,
				message: 'Failed to load image files',
				details: error instanceof Error ? error.message : String(error)
			};
			this.setError(filesError);
			throw error;
		}
	}

	/**
	 * Set the current image index for preview/processing
	 */
	async setCurrentImageIndex(index: number): Promise<void> {
		if (index >= 0 && index < (this._imageState.input_files?.length || 0)) {
			this._imageState.current_image_index = index;
			// Update single-image state for backward compatibility
			if (this._imageState.input_files && this._imageState.input_images) {
				this._imageState.input_file = this._imageState.input_files[index];
				this._imageState.input_image = this._imageState.input_images[index];
			}

			// Update session in IndexedDB
			if (this.currentSessionId) {
				await imagePersistence.updateSessionIndex(this.currentSessionId, index);
			}

			console.log(`[ConverterStateStore] Set current image index: ${index}`);
		}
	}

	/**
	 * Clear the current input
	 */
	async clearInput(): Promise<void> {
		this._imageState.input_image = undefined;
		this._imageState.input_file = undefined;
		this._imageState.input_images = [];
		this._imageState.input_files = [];
		this._imageState.current_image_index = 0;
		this._processingState.last_result = undefined;
		this._processingState.batch_results = [];
		this.clearError();

		// Clear session ID
		this.currentSessionId = null;

		// Clear saved state from IndexedDB
		await imagePersistence.clearAll();

		console.log('[ConverterStateStore] Cleared all input images');
	}

	/**
	 * Clear the last result
	 */
	clearResult(): void {
		this._processingState.last_result = undefined;
		this._processingState.batch_results = [];

		console.log('[ConverterStateStore] Cleared processing results');
	}

	/**
	 * IMAGE PROCESSING (extracted from vectorizer.svelte.ts)
	 */

	/**
	 * Process the current input image with comprehensive validation and cleanup
	 * CRITICAL: Coordinates with WASM and Settings stores
	 */
	async processImage(): Promise<ProcessingResult> {
		// Check input image
		if (!this._imageState.input_image) {
			throw new Error('No input image set');
		}

		// Get configuration from algorithm config store
		const config = algorithmConfigStore.getConfig(algorithmConfigStore.currentAlgorithm);
		// Note: Algorithm config store provides validated configuration

		let processingTimeoutId: NodeJS.Timeout | null = null;
		let isAborted = false;

		try {
			this._processingState.is_processing = true;
			this._processingState.current_progress = undefined;
			this.clearError();

			console.log('[ConverterStateStore] Starting image processing...', {
				dimensions: `${this._imageState.input_image.width}x${this._imageState.input_image.height}`,
				algorithm: config.algorithm,
				detail: config.detail
			});

			// Set up processing timeout with cleanup (separate from algorithm config)
			const timeoutMs = 60000; // Default 60 seconds timeout
			processingTimeoutId = setTimeout(() => {
				isAborted = true;
				console.log(`[ConverterStateStore] Processing timeout after ${timeoutMs}ms, aborting...`);
				this.abortProcessing();
			}, timeoutMs);

			// Use the WASM service through the WASM store
			const result = await this.wasmWorkerService.processImage(
				this._imageState.input_image,
				config,
				(progress) => {
					if (!isAborted) {
						this._processingState.current_progress = progress;
					}
				}
			);

			if (isAborted) {
				throw new Error('Processing was aborted due to timeout');
			}

			// Clear any previous errors on successful processing
			this.clearError();

			this._processingState.last_result = result;

			// Log if result has very few paths (might indicate user needs different settings)
			if (result.statistics?.paths_generated === 0) {
				console.warn(
					'[ConverterStateStore] Conversion produced no paths - user may want to try different settings'
				);
			}

			console.log(`[ConverterStateStore]  Processing completed in ${result.processing_time_ms}ms`);
			return result;
		} catch (error) {
			const processingError = error as VectorizerError;
			this.setError(processingError);
			throw error;
		} finally {
			// Always cleanup regardless of success or failure
			if (processingTimeoutId) {
				clearTimeout(processingTimeoutId);
			}
			this._processingState.is_processing = false;
			this._processingState.current_progress = undefined;

			// Force cleanup of any WASM resources
			try {
				console.log('[ConverterStateStore] Processing completed, cleaning up resources');
			} catch (cleanupError) {
				console.warn('[ConverterStateStore] Cleanup warning:', cleanupError);
			}
		}
	}

	/**
	 * Process all images in batch with comprehensive validation and cleanup
	 */
	async processBatch(
		onProgress?: (imageIndex: number, totalImages: number, progress: ProcessingProgress) => void
	): Promise<ProcessingResult[]> {
		// Check WASM initialization
		// WASM worker service handles initialization internally

		const images = this._imageState.input_images;
		if (!images || images.length === 0) {
			throw new Error('No input images set');
		}

		// Get configuration from unified config store
		const config = algorithmConfigStore.getConfig(algorithmConfigStore.currentAlgorithm);
		// Note: Unified config uses Zod validation internally, no separate validation needed

		let batchTimeoutId: NodeJS.Timeout | null = null;
		let isAborted = false;
		const results: ProcessingResult[] = [];

		try {
			this._processingState.is_processing = true;
			this._processingState.current_progress = undefined;
			this.clearError();

			console.log(`[ConverterStateStore] Starting batch processing of ${images.length} images...`);

			// Set up batch processing timeout (longer than single image)
			const singleImageTimeoutMs = 60000; // Default 60 seconds per image
			// Use much longer timeout for complex algorithms (dots, superpixel) that may need more time
			const backendMultiplier =
				config.algorithm === 'dots' || config.algorithm === 'superpixel' ? 10 : 3;
			const batchTimeoutMs = Math.max(
				singleImageTimeoutMs * images.length * backendMultiplier,
				300000
			); // At least 5 minutes
			batchTimeoutId = setTimeout(() => {
				isAborted = true;
				console.log(
					`[ConverterStateStore] Batch processing timeout after ${batchTimeoutMs}ms, aborting...`
				);
				this.abortProcessing();
			}, batchTimeoutMs);

			for (let i = 0; i < images.length; i++) {
				if (isAborted) {
					console.log(
						`[ConverterStateStore] Batch processing aborted at image ${i + 1}/${images.length}`
					);
					break;
				}

				const imageData = images[i];

				// Don't update current_image_index during batch processing
				// The UI should manage its own display index separately from processing index

				// Check for large image and provide user feedback
				const pixelCount = imageData.width * imageData.height;
				const megapixels = pixelCount / 1_000_000;
				const isLargeImage = megapixels > 10;

				if (isLargeImage) {
					console.log(
						`[ConverterStateStore] 📊 Processing large image: ${megapixels.toFixed(1)}MP (${imageData.width}x${imageData.height})`
					);

					// Update progress to show optimization notice
					this._processingState.current_progress = {
						progress: 0,
						stage: `Optimizing ${megapixels.toFixed(1)}MP image for processing...`,
						elapsed_ms: 0
					};
					onProgress?.(i, images.length, this._processingState.current_progress!);
				}

				try {
					const result = await this.wasmWorkerService.processImage(
						imageData,
						config,
						(progress) => {
							if (!isAborted) {
								this._processingState.current_progress = progress;
								onProgress?.(i, images.length, progress);
							}
						}
					);

					results.push(result);
					console.log(
						`[ConverterStateStore] Completed image ${i + 1}/${images.length} in ${result.processing_time_ms}ms`
					);
				} catch (imageError) {
					console.error(`[ConverterStateStore] Failed to process image ${i + 1}:`, imageError);
					// Continue with remaining images but log the error
					const errorResult: ProcessingResult = {
						svg: '<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#fef2f2" stroke="#fca5a5" stroke-width="2" rx="8"/><text x="200" y="100" text-anchor="middle" dominant-baseline="central" fill="#dc2626" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600">Failed to convert</text></svg>',
						processing_time_ms: 0,
						config_used: config,
						statistics: {
							input_dimensions: [imageData.width, imageData.height],
							paths_generated: 0,
							compression_ratio: 0
						}
					};
					results.push(errorResult);
				}
			}

			if (isAborted) {
				throw new Error(
					`Batch processing was aborted. Processed ${results.length}/${images.length} images.`
				);
			}

			// Clear any previous errors on successful batch processing
			this.clearError();

			this._processingState.batch_results = results;
			// Set last result to the final processed image
			if (results.length > 0) {
				this._processingState.last_result = results[results.length - 1];
			}

			console.log(
				`[ConverterStateStore]  Batch processing completed: ${results.length}/${images.length} images`
			);
			return results;
		} catch (error) {
			const processingError = error as VectorizerError;
			this.setError(processingError);
			throw error;
		} finally {
			// Always cleanup regardless of success or failure
			if (batchTimeoutId) {
				clearTimeout(batchTimeoutId);
			}
			this._processingState.is_processing = false;
			this._processingState.current_progress = undefined;

			// Force cleanup of any WASM resources
			try {
				console.log(
					`[ConverterStateStore] Batch processing completed, processed ${results.length}/${images.length} images`
				);
			} catch (cleanupError) {
				console.warn('[ConverterStateStore] Batch cleanup warning:', cleanupError);
			}
		}
	}

	/**
	 * ERROR MANAGEMENT (extracted from vectorizer.svelte.ts)
	 */

	/**
	 * Set error state
	 */
	private setError(error: VectorizerError): void {
		this._errorState.error = error;
		this._errorState.has_error = true;

		// Log error for debugging
		console.error('[ConverterStateStore] Error:', error);

		// Auto-clear certain types of errors after a delay
		if (error.type === 'validation') {
			setTimeout(() => {
				if (this._errorState.error === error) {
					this.clearError();
				}
			}, 3000); // Clear validation errors after 3 seconds
		}
	}

	/**
	 * Clear error state
	 */
	clearError(): void {
		this._errorState.error = undefined;
		this._errorState.has_error = false;
	}

	/**
	 * Get user-friendly error message
	 */
	getErrorMessage(error?: VectorizerError): string {
		const err = error || this._errorState.error;
		if (!err) return '';

		const baseMessages: Record<VectorizerError['type'], string> = {
			validation: 'Configuration error. Please check your settings and try again.',
			processing: 'Processing failed. The image might be too complex or corrupted.',
			unknown: 'An unexpected error occurred. Please try again.'
		};

		let message = baseMessages[err.type] || baseMessages.unknown;

		// Add specific guidance based on error details
		if (err.details) {
			if (err.details.includes('timeout')) {
				message +=
					' The operation took too long. Try reducing complexity or increasing the timeout.';
			}
		}

		return message;
	}

	/**
	 * Get recovery suggestions for current error
	 */
	getRecoverySuggestions(): string[] {
		if (!this._errorState.error) return [];

		const suggestions: string[] = [];

		switch (this._errorState.error.type) {
			case 'processing':
				suggestions.push('Try a smaller image (reduce resolution)');
				suggestions.push('Lower the detail level');
				suggestions.push('Use a simpler algorithm like "centerline"');
				break;

			case 'validation':
				suggestions.push('Check your parameter settings');
				suggestions.push('Try using a preset configuration');
				suggestions.push('Reset to default settings');
				break;

			case 'unknown':
				suggestions.push('Try refreshing the page');
				suggestions.push('Check your internet connection');
				suggestions.push('Clear browser cache if the problem persists');
				break;
		}

		return suggestions;
	}

	/**
	 * STATISTICS AND UTILITIES (extracted from vectorizer.svelte.ts)
	 */

	/**
	 * Get processing statistics
	 */
	getStats(): {
		processing_time?: number;
		input_size?: string;
		output_size?: string;
		compression_ratio?: number;
	} {
		if (!this._processingState.last_result) {
			return {};
		}

		const result = this._processingState.last_result;
		const stats: any = {
			processing_time: result.processing_time_ms
		};

		if (result.statistics) {
			const [width, height] = result.statistics.input_dimensions;
			stats.input_size = `${width}×${height}`;
			stats.compression_ratio = result.statistics.compression_ratio;

			// Estimate output size
			const svgSize = new TextEncoder().encode(result.svg).length;
			stats.output_size = this.formatFileSize(svgSize);
		}

		return stats;
	}

	/**
	 * Abort current processing operation
	 */
	abortProcessing(): void {
		console.log('[ConverterStateStore] Aborting processing...');

		// Stop the processing flag
		this._processingState.is_processing = false;
		this._processingState.current_progress = undefined;

		// Call WASM service abort through the WASM store
		this.wasmWorkerService.abort();

		// Set error state
		this.setError({
			type: 'processing',
			message: 'Processing aborted',
			details: 'Processing was manually stopped or timed out'
		});
	}

	/**
	 * Reset the entire state to initial values
	 */
	reset(): void {
		this._processingState.is_processing = false;
		this._processingState.current_progress = undefined;
		this._processingState.last_result = undefined;
		this._processingState.batch_results = [];
		this._imageState.input_image = undefined;
		this._imageState.input_file = undefined;
		this._imageState.input_images = [];
		this._imageState.input_files = [];
		this._imageState.current_image_index = 0;
		this.clearError();

		console.log('[ConverterStateStore] State reset complete');
	}

	/**
	 * Force reset all processing including worker operations
	 * Use this when user performs full reset (Clear All)
	 */
	async forceReset(): Promise<void> {
		try {
			// First reset store state
			this.reset();

			// Abort vectorizer service processing (this handles the Web Worker internally)
			this.wasmWorkerService.abort();

			// Also force reset the worker service queue for thorough cleanup
			const { wasmWorkerService } = await import('$lib/services/wasm-worker-service');
			await wasmWorkerService.forceReset();

			console.log('[ConverterStateStore]  Force reset complete - all operations cancelled');
		} catch (error) {
			console.error('[ConverterStateStore] Error during force reset:', error);
			// Still reset store state even if worker reset fails
			this.reset();
		}
	}

	/**
	 * Retry the last failed operation
	 */
	async retryLastOperation(): Promise<void> {
		if (!this._errorState.has_error) {
			return;
		}

		this.clearError();

		// Determine what to retry based on current state
		if (this._imageState.input_image) {
			// Retry processing
			await this.processImage();
		}
	}

	/**
	 * HELPER METHODS (extracted from vectorizer.svelte.ts)
	 */

	private async fileToImageData(file: File): Promise<ImageData> {
		// Validate file type first
		if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
			throw new Error(
				`SVG files cannot be used as source images. Please use JPG, PNG, WebP, TIFF, BMP, or GIF files.`
			);
		}

		return new Promise((resolve, reject) => {
			const img = new Image();
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');

			if (!ctx) {
				reject(new Error('Failed to get canvas context'));
				return;
			}

			// Create object URL from file
			const objectUrl = URL.createObjectURL(file);

			// Add debug logging to help diagnose issues
			console.log('[fileToImageData] Processing file:', {
				name: file.name,
				type: file.type,
				size: file.size,
				objectUrl: objectUrl
			});

			img.onload = () => {
				console.log('[fileToImageData] Image loaded successfully:', {
					width: img.width,
					height: img.height,
					name: file.name
				});

				canvas.width = img.width;
				canvas.height = img.height;
				ctx.drawImage(img, 0, 0);

				try {
					const imageData = ctx.getImageData(0, 0, img.width, img.height);
					URL.revokeObjectURL(objectUrl); // Clean up
					console.log('[fileToImageData] ImageData created successfully');
					resolve(imageData);
				} catch (error) {
					URL.revokeObjectURL(objectUrl); // Clean up
					console.error('[fileToImageData] Failed to get image data:', error);
					reject(error);
				}
			};

			img.onerror = (event) => {
				URL.revokeObjectURL(objectUrl); // Clean up
				console.error('[fileToImageData] Image load error:', {
					file: file.name,
					type: file.type,
					size: file.size,
					event: event
				});

				// Try alternative approach for restored files
				console.log('[fileToImageData] Attempting fallback with FileReader...');
				const reader = new FileReader();

				reader.onload = (e) => {
					const dataUrl = e.target?.result as string;
					if (!dataUrl) {
						reject(new Error(`Failed to read file: ${file.name}`));
						return;
					}

					// Try loading from data URL
					const img2 = new Image();
					img2.onload = () => {
						console.log('[fileToImageData] Fallback successful, image loaded from FileReader');
						canvas.width = img2.width;
						canvas.height = img2.height;
						ctx.drawImage(img2, 0, 0);

						try {
							const imageData = ctx.getImageData(0, 0, img2.width, img2.height);
							console.log('[fileToImageData] ImageData created successfully via fallback');
							resolve(imageData);
						} catch (error) {
							console.error('[fileToImageData] Fallback failed to get image data:', error);
							reject(error);
						}
					};

					img2.onerror = () => {
						console.error('[fileToImageData] Fallback also failed');
						reject(
							new Error(
								`Failed to load image: ${file.name}. Please ensure it's a valid JPG, PNG, WebP, TIFF, BMP, or GIF file.`
							)
						);
					};

					img2.src = dataUrl;
				};

				reader.onerror = () => {
					reject(new Error(`Failed to read file: ${file.name}`));
				};

				// Read file as data URL for fallback
				reader.readAsDataURL(file);
			};

			// Enable CORS to handle cross-origin issues with restored files
			img.crossOrigin = 'anonymous';
			img.src = objectUrl;
		});
	}

	private formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}

	/**
	 * IMAGE PERSISTENCE METHODS
	 */

	/**
	 * Load saved image state from IndexedDB
	 */
	async loadSavedImageState(): Promise<boolean> {
		console.log('[ConverterStateStore] Loading saved image state from IndexedDB...');
		if (!browser) return false;

		try {
			const sessionData = await imagePersistence.loadLatestSession();

			if (!sessionData) {
				console.log('[ConverterStateStore] No saved session found');
				return false;
			}

			const { files, currentIndex, sessionId } = sessionData;

			// Convert files to ImageData array
			const imageDataArray: ImageData[] = [];
			for (const file of files) {
				try {
					const imageData = await this.fileToImageData(file);
					imageDataArray.push(imageData);
				} catch (error) {
					console.warn(
						`[ConverterStateStore] Failed to load image from session: ${file.name}`,
						error
					);
				}
			}

			if (imageDataArray.length === 0) {
				console.log('[ConverterStateStore] No images could be loaded from session');
				return false;
			}

			// Update state with restored data
			this._imageState.input_files = files;
			this._imageState.input_images = imageDataArray;
			this._imageState.current_image_index = Math.min(currentIndex, files.length - 1);

			// Set current single-image state for backward compatibility
			this._imageState.input_file = files[this._imageState.current_image_index];
			this._imageState.input_image = imageDataArray[this._imageState.current_image_index];

			// Store session ID for future updates
			this.currentSessionId = sessionId;

			console.log(
				`[ConverterStateStore] Restored session ${sessionId} with ${files.length} images`
			);
			return true;
		} catch (error) {
			console.error('[ConverterStateStore] Failed to load saved image state:', error);
			return false;
		}
	}
}

// Export singleton instance
export const converterState = new ConverterStateStore();
