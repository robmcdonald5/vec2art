/**
 * Converter Core State Store
 *
 * Handles image processing, file management, progress tracking, and results.
 * Extracted from vectorizer.svelte.ts to separate processing concerns from
 * configuration and WASM management.
 */

import { browser } from '$app/environment';
import type { VectorizerError, ProcessingResult, ProcessingProgress } from '$lib/workers/vectorizer.worker';
import type { AlgorithmConfig } from '$lib/types/algorithm-configs';

// Import the algorithm config store
import { algorithmConfigStore } from './algorithm-config-store.svelte';
import { WasmWorkerService } from '$lib/services/wasm-worker-service';

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

	constructor() {
		// Load saved image state on initialization (browser only)
		if (browser) {
			this.loadSavedImageState().catch(error => {
				console.warn('[ConverterStateStore] Failed to load saved image state during initialization:', error);
			});
		}
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

			// Save to localStorage for persistence
			await this.saveImageState();

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

		// Save to localStorage for persistence
		this.saveImageState();

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

			// Convert all files to ImageData - continue on individual failures for restored files
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

					// For restored files that fail, skip them instead of failing entire batch
					console.warn(`Skipping failed file ${file.name} - continuing with remaining files`);
				}
			}

			// If ALL files failed, throw error
			if (imageDataArray.length === 0 && files.length > 0) {
				const fileList = failedFiles.join(', ');
				throw new Error(`Failed to load any image files. Failed files: ${fileList}. Please re-upload your images.`);
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

			// Save to localStorage for persistence
			await this.saveImageState();

			// Log results
			if (failedFiles.length > 0) {
				console.warn(`[ConverterStateStore] ${failedFiles.length} file(s) failed to load and were skipped: ${failedFiles.join(', ')}`);
			}
			console.log(`[ConverterStateStore] Set ${successfulFiles.length} input files for batch processing (${failedFiles.length} skipped)`);
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
	setCurrentImageIndex(index: number): void {
		if (index >= 0 && index < (this._imageState.input_files?.length || 0)) {
			this._imageState.current_image_index = index;
			// Update single-image state for backward compatibility
			if (this._imageState.input_files && this._imageState.input_images) {
				this._imageState.input_file = this._imageState.input_files[index];
				this._imageState.input_image = this._imageState.input_images[index];
			}
			console.log(`[ConverterStateStore] Set current image index: ${index}`);
		}
	}

	/**
	 * Clear the current input
	 */
	clearInput(): void {
		this._imageState.input_image = undefined;
		this._imageState.input_file = undefined;
		this._imageState.input_images = [];
		this._imageState.input_files = [];
		this._imageState.current_image_index = 0;
		this._processingState.last_result = undefined;
		this._processingState.batch_results = [];
		this.clearError();

		// Clear saved state from localStorage
		this.clearSavedImageState();

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

			console.log(
				`[ConverterStateStore] ✅ Processing completed in ${result.processing_time_ms}ms`
			);
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
				`[ConverterStateStore] ✅ Batch processing completed: ${results.length}/${images.length} images`
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

			console.log('[ConverterStateStore] ✅ Force reset complete - all operations cancelled');
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
	 * Save current image state to localStorage
	 */
	private async saveImageState(): Promise<void> {
		console.log('[ConverterStateStore] saveImageState called - browser:', browser);
		if (!browser) return;

		try {
			console.log('[ConverterStateStore] saveImageState - input_image:', !!this._imageState.input_image, 'input_file:', !!this._imageState.input_file);
			const imageState: any = {
				hasImages: false,
				currentImageIndex: this._imageState.current_image_index,
				timestamp: Date.now()
			};

			// Save single image if exists - now with better compression
			if (this._imageState.input_image && this._imageState.input_file) {
				console.log('[ConverterStateStore] saveImageState - converting to dataURL...');
				try {
					const dataUrl = await this.imageDataToDataUrl(this._imageState.input_image);

					// Check if the compressed data URL fits in localStorage
					const dataUrlSize = new TextEncoder().encode(dataUrl).length;
					const maxDataUrlSize = 3 * 1024 * 1024; // 3MB limit for data URL

					console.log('[ConverterStateStore] saveImageState - data URL size:', dataUrlSize, 'limit:', maxDataUrlSize);

					if (dataUrlSize <= maxDataUrlSize) {
						imageState.singleImage = {
							dataUrl,
							fileName: this._imageState.input_file.name,
							fileSize: this._imageState.input_file.size,
							fileType: this._imageState.input_file.type,
							width: this._imageState.input_image.width,
							height: this._imageState.input_image.height
						};
						imageState.hasImages = true;
						console.log('[ConverterStateStore] saveImageState - image saved successfully');
					} else {
						console.warn('[ConverterStateStore] saveImageState - compressed image still too large for storage');
						// Store metadata only for very large files
						imageState.singleImageMeta = {
							fileName: this._imageState.input_file.name,
							fileSize: this._imageState.input_file.size,
							fileType: this._imageState.input_file.type,
							width: this._imageState.input_image.width,
							height: this._imageState.input_image.height,
							tooLarge: true
						};
					}
				} catch (compressionError) {
					console.warn('[ConverterStateStore] saveImageState - compression failed:', compressionError);
					// Store metadata as fallback
					imageState.singleImageMeta = {
						fileName: this._imageState.input_file.name,
						fileSize: this._imageState.input_file.size,
						fileType: this._imageState.input_file.type,
						width: this._imageState.input_image.width,
						height: this._imageState.input_image.height,
						compressionFailed: true
					};
				}
			}

			// Save multiple images with compression
			if (this._imageState.input_files && this._imageState.input_files.length > 1) {
				console.log(`[ConverterStateStore] saveImageState - saving ${this._imageState.input_files.length} batch images...`);

				const batchImages = [];
				const maxImagesWithData = 5; // Limit to prevent localStorage overflow

				for (let i = 0; i < this._imageState.input_files.length; i++) {
					const file = this._imageState.input_files[i];
					const imageData = this._imageState.input_images[i];

					const imageInfo: any = {
						fileName: file.name,
						fileSize: file.size,
						fileType: file.type,
						width: imageData?.width || 0,
						height: imageData?.height || 0,
						index: i
					};

					// For first few images, try to save full data
					if (i < maxImagesWithData && imageData) {
						try {
							const dataUrl = await this.imageDataToDataUrl(imageData);
							const dataUrlSize = new TextEncoder().encode(dataUrl).length;

							// Only include data URL if it's reasonably sized
							if (dataUrlSize <= 500 * 1024) { // 500KB limit per image in batch
								imageInfo.dataUrl = dataUrl;
								console.log(`[ConverterStateStore] saveImageState - batch image ${i} data saved (${dataUrlSize} bytes)`);
							} else {
								console.log(`[ConverterStateStore] saveImageState - batch image ${i} too large for data storage`);
							}
						} catch (error) {
							console.warn(`[ConverterStateStore] saveImageState - failed to compress batch image ${i}:`, error);
						}
					}

					batchImages.push(imageInfo);
				}

				imageState.batchImages = batchImages;
				imageState.hasImages = true;
				console.log(`[ConverterStateStore] saveImageState - saved ${batchImages.length} batch image entries`);
			}

			localStorage.setItem('vec2art-image-state', JSON.stringify(imageState));
			console.log('[ConverterStateStore] Image state saved to localStorage');
		} catch (error) {
			console.warn('[ConverterStateStore] Failed to save image state:', error);
			// If localStorage is full, try clearing old data
			try {
				this.clearSavedImageState();
				console.log('[ConverterStateStore] Cleared old image state due to storage error');
			} catch (clearError) {
				console.warn('[ConverterStateStore] Failed to clear image state:', clearError);
			}
		}
	}

	/**
	 * Load saved image state from localStorage
	 */
	async loadSavedImageState(): Promise<boolean> {
		console.log('[ConverterStateStore] loadSavedImageState called - browser:', browser);
		if (!browser) return false;

		try {
			const saved = localStorage.getItem('vec2art-image-state');
			console.log('[ConverterStateStore] loadSavedImageState - found saved data:', !!saved);
			if (!saved) return false;

			const imageState = JSON.parse(saved);
			console.log('[ConverterStateStore] loadSavedImageState - hasImages:', imageState.hasImages);
			if (!imageState.hasImages) return false;

			// Check if saved state is recent (within 24 hours)
			const maxAge = 24 * 60 * 60 * 1000; // 24 hours
			if (Date.now() - imageState.timestamp > maxAge) {
				console.log('[ConverterStateStore] Saved image state expired, clearing');
				this.clearSavedImageState();
				return false;
			}

			// Prioritize batch images over single image to restore full context
			// Restore batch images if available
			if (imageState.batchImages && Array.isArray(imageState.batchImages)) {
				try {
					console.log(`[ConverterStateStore] Restoring ${imageState.batchImages.length} batch images...`);

					const restoredFiles: File[] = [];
					const restoredImages: ImageData[] = [];
					let restoredCount = 0;

					for (const imageInfo of imageState.batchImages) {
						try {
							// Create mock File object
							const mockFile = new File([], imageInfo.fileName, {
								type: imageInfo.fileType || 'image/png'
							});

							if (imageInfo.dataUrl) {
								// Restore full image data
								const imageData = await this.dataUrlToImageData(imageInfo.dataUrl);
								restoredFiles.push(mockFile);
								restoredImages.push(imageData);
								restoredCount++;
								console.log(`[ConverterStateStore] Restored batch image: ${imageInfo.fileName}`);
							} else {
								// Only metadata available - still add to list but will need re-upload
								restoredFiles.push(mockFile);
								// Create placeholder ImageData
								const placeholderCanvas = document.createElement('canvas');
								placeholderCanvas.width = imageInfo.width || 200;
								placeholderCanvas.height = imageInfo.height || 200;
								const placeholderCtx = placeholderCanvas.getContext('2d');
								if (placeholderCtx) {
									const placeholderImageData = placeholderCtx.getImageData(0, 0, placeholderCanvas.width, placeholderCanvas.height);
									restoredImages.push(placeholderImageData);
								}
								console.log(`[ConverterStateStore] Restored metadata for: ${imageInfo.fileName} (data needs re-upload)`);
							}
						} catch (error) {
							console.warn(`[ConverterStateStore] Failed to restore batch image ${imageInfo.fileName}:`, error);
						}
					}

					if (restoredFiles.length > 0) {
						this._imageState.input_files = restoredFiles;
						this._imageState.input_images = restoredImages;
						this._imageState.current_image_index = imageState.currentImageIndex || 0;

						// Set current single-image state to first image for backward compatibility
						this._imageState.input_file = restoredFiles[0];
						this._imageState.input_image = restoredImages[0];

						console.log(`[ConverterStateStore] Successfully restored ${restoredCount}/${restoredFiles.length} batch images with data`);
						return true;
					}
				} catch (error) {
					console.warn('[ConverterStateStore] Failed to restore batch images:', error);
				}
			}

			// Fallback: Restore single image if no batch images available
			if (imageState.singleImage) {
				try {
					const imageData = await this.dataUrlToImageData(imageState.singleImage.dataUrl);
					this._imageState.input_image = imageData;
					// Create a mock File object for compatibility
					const mockFile = new File([], imageState.singleImage.fileName, {
						type: imageState.singleImage.fileType
					});
					this._imageState.input_file = mockFile;
					console.log(`[ConverterStateStore] Restored single image: ${imageState.singleImage.fileName}`);
					return true;
				} catch (error) {
					console.warn('[ConverterStateStore] Failed to restore single image:', error);
				}
			}

			// Handle large single image metadata or other metadata-only cases
			if (imageState.singleImageMeta) {
				console.log('[ConverterStateStore] Found single image metadata but file needs re-upload');
				return false;
			}

			return false;
		} catch (error) {
			console.warn('[ConverterStateStore] Failed to load saved image state:', error);
			return false;
		}
	}

	/**
	 * Clear saved image state from localStorage
	 */
	private clearSavedImageState(): void {
		if (!browser) return;
		try {
			localStorage.removeItem('vec2art-image-state');
			console.log('[ConverterStateStore] Cleared saved image state');
		} catch (error) {
			console.warn('[ConverterStateStore] Failed to clear saved image state:', error);
		}
	}

	/**
	 * Convert ImageData to data URL for storage with aggressive compression
	 */
	private async imageDataToDataUrl(imageData: ImageData): Promise<string> {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('Failed to get canvas context');

		// For large images, scale down for storage to reduce size
		const maxDimension = 800; // Maximum width or height for storage
		let targetWidth = imageData.width;
		let targetHeight = imageData.height;

		if (imageData.width > maxDimension || imageData.height > maxDimension) {
			const scale = Math.min(maxDimension / imageData.width, maxDimension / imageData.height);
			targetWidth = Math.round(imageData.width * scale);
			targetHeight = Math.round(imageData.height * scale);
			console.log(`[ConverterStateStore] Scaling image for storage: ${imageData.width}x${imageData.height} -> ${targetWidth}x${targetHeight}`);
		}

		canvas.width = targetWidth;
		canvas.height = targetHeight;

		// If scaling, use image smoothing for better quality
		if (targetWidth !== imageData.width || targetHeight !== imageData.height) {
			// Create temporary canvas with original size
			const tempCanvas = document.createElement('canvas');
			const tempCtx = tempCanvas.getContext('2d');
			if (!tempCtx) throw new Error('Failed to get temp canvas context');

			tempCanvas.width = imageData.width;
			tempCanvas.height = imageData.height;
			tempCtx.putImageData(imageData, 0, 0);

			// Scale down to target canvas with smoothing
			ctx.imageSmoothingEnabled = true;
			ctx.imageSmoothingQuality = 'medium';
			ctx.drawImage(tempCanvas, 0, 0, targetWidth, targetHeight);
		} else {
			// Use original size
			ctx.putImageData(imageData, 0, 0);
		}

		// Use JPEG with aggressive compression for smaller size
		return canvas.toDataURL('image/jpeg', 0.6); // Lower quality for smaller size
	}

	/**
	 * Convert data URL back to ImageData
	 */
	private async dataUrlToImageData(dataUrl: string): Promise<ImageData> {
		const img = new Image();
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('Failed to get canvas context');

		return new Promise((resolve, reject) => {
			img.onload = () => {
				canvas.width = img.width;
				canvas.height = img.height;
				ctx.drawImage(img, 0, 0);
				const imageData = ctx.getImageData(0, 0, img.width, img.height);
				resolve(imageData);
			};
			img.onerror = reject;
			img.src = dataUrl;
		});
	}
}

// Export singleton instance
export const converterState = new ConverterStateStore();
