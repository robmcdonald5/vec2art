/**
 * Svelte stores for vectorizer state management
 * Using SvelteKit 5 runes for reactive state management
 */

import { browser } from '$app/environment';
import { vectorizerService } from '$lib/services/vectorizer-service';
import type {
	VectorizerState,
	VectorizerConfig,
	VectorizerError,
	ProcessingResult,
	ProcessingProgress,
	WasmCapabilityReport,
	VectorizerPreset
} from '$lib/types/vectorizer';
import { DEFAULT_CONFIG as defaultConfig, PRESET_CONFIGS } from '$lib/types/vectorizer';

interface InitializationOptions {
	threadCount?: number;
	autoInitThreads?: boolean;
}

class VectorizerStore {
	// Core state using SvelteKit 5 runes
	private _state = $state<VectorizerState>({
		is_processing: false,
		is_initialized: false,
		has_error: false,
		error: undefined,
		current_progress: undefined,
		last_result: undefined,
		batch_results: [],
		config: { ...defaultConfig },
		capabilities: undefined,
		input_image: undefined,
		input_file: undefined,
		input_images: [],
		input_files: [],
		current_image_index: 0
	});

	// Track initialization state separately
	private _initState = $state<{
		wasmLoaded: boolean;
		threadsInitialized: boolean;
		requestedThreadCount: number;
	}>({
		wasmLoaded: false,
		threadsInitialized: false,
		requestedThreadCount: 0
	});

	// Getters for reactive access
	get state(): VectorizerState {
		return this._state;
	}

	get isProcessing(): boolean {
		return this._state.is_processing;
	}

	get isInitialized(): boolean {
		return this._state.is_initialized;
	}

	get hasError(): boolean {
		return this._state.has_error;
	}

	get error(): VectorizerError | undefined {
		return this._state.error;
	}

	get config(): VectorizerConfig {
		return this._state.config;
	}

	get capabilities(): WasmCapabilityReport | undefined {
		return this._state.capabilities;
	}

	get currentProgress(): ProcessingProgress | undefined {
		return this._state.current_progress;
	}

	get lastResult(): ProcessingResult | undefined {
		return this._state.last_result;
	}

	get inputImage(): ImageData | undefined {
		return this._state.input_image;
	}

	get inputFile(): File | undefined {
		return this._state.input_file;
	}

	get inputImages(): ImageData[] {
		return this._state.input_images || [];
	}

	get inputFiles(): File[] {
		return this._state.input_files || [];
	}

	get currentImageIndex(): number {
		return this._state.current_image_index || 0;
	}

	get currentInputImage(): ImageData | undefined {
		if (this._state.input_images?.length && this._state.current_image_index !== undefined) {
			return this._state.input_images[this._state.current_image_index];
		}
		return this._state.input_image;
	}

	get currentInputFile(): File | undefined {
		if (this._state.input_files?.length && this._state.current_image_index !== undefined) {
			return this._state.input_files[this._state.current_image_index];
		}
		return this._state.input_file;
	}

	get batchResults(): ProcessingResult[] {
		return this._state.batch_results || [];
	}

	get hasMultipleImages(): boolean {
		return (this._state.input_files?.length || 0) > 1;
	}

	get wasmLoaded(): boolean {
		return this._initState.wasmLoaded;
	}

	get threadsInitialized(): boolean {
		return this._initState.threadsInitialized;
	}

	get requestedThreadCount(): number {
		return this._initState.requestedThreadCount;
	}

	/**
	 * Get the vectorizer service instance for development/debugging
	 */
	get vectorizerService() {
		return vectorizerService;
	}

	/**
	 * Initialize the vectorizer system with optional thread configuration
	 * Now supports lazy loading - loads WASM without initializing threads by default
	 */
	async initialize(options?: InitializationOptions): Promise<void> {
		if (!browser) {
			return; // No-op in SSR
		}

		if (this._state.is_initialized && this._initState.threadsInitialized) {
			return; // Fully initialized
		}

		try {
			this.clearError();

			// Initialize the service with lazy loading by default
			await vectorizerService.initialize(options);
			this._initState.wasmLoaded = true;

			// Get capabilities using the simple check
			const caps = await vectorizerService.checkCapabilities();
			this._state.capabilities = caps;
			this._state.is_initialized = true;

			// Track thread initialization state
			if (options?.autoInitThreads) {
				this._initState.threadsInitialized = caps.threading_supported;
				this._initState.requestedThreadCount = options.threadCount || 0;
			}
		} catch (error) {
			this.setError({
				type: 'unknown',
				message: 'Failed to initialize vectorizer',
				details: error instanceof Error ? error.message : String(error)
			});
			throw error;
		}
	}

	/**
	 * Initialize thread pool separately (for lazy loading)
	 */
	async initializeThreads(threadCount?: number): Promise<boolean> {
		if (!browser || !this._state.is_initialized) {
			throw new Error('WASM must be initialized first');
		}

		try {
			this.clearError();
			let success: boolean;

			if (this._initState.threadsInitialized) {
				// Try to resize if thread count is different
				if (threadCount && threadCount !== this._initState.requestedThreadCount) {
					console.log(
						`Resizing thread pool from ${this._initState.requestedThreadCount} to ${threadCount} threads`
					);
					success = await vectorizerService.resizeThreadPool(threadCount);
				} else {
					console.log('Threads already initialized with correct count');
					return true;
				}
			} else {
				// Initialize for the first time
				success = await vectorizerService.initializeThreadPool(threadCount);
			}

			if (success) {
				this._initState.threadsInitialized = true;
				this._initState.requestedThreadCount = threadCount || 0;

				// Update capabilities
				const caps = await vectorizerService.checkCapabilities();
				this._state.capabilities = caps;
			}

			return success;
		} catch (error) {
			this.setError({
				type: 'threading',
				message: 'Failed to initialize thread pool',
				details: error instanceof Error ? error.message : String(error)
			});
			return false;
		}
	}

	/**
	 * Set performance mode for vectorizer service
	 */
	setPerformanceMode(mode: 'economy' | 'balanced' | 'performance' | 'custom'): void {
		vectorizerService.setPerformanceMode(mode);
	}

	/**
	 * Update configuration
	 */
	updateConfig(updates: Partial<VectorizerConfig>): void {
		this._state.config = { ...this._state.config, ...updates };
		this.clearError(); // Clear any previous config errors
	}

	/**
	 * Reset configuration to defaults
	 */
	resetConfig(): void {
		this._state.config = { ...defaultConfig };
		this.clearError();
	}

	/**
	 * Use a preset configuration
	 */
	usePreset(preset: VectorizerPreset): void {
		if (preset && PRESET_CONFIGS[preset]) {
			this.updateConfig({ preset, ...PRESET_CONFIGS[preset] });
		}
	}

	/**
	 * Set input image from File
	 */
	async setInputFile(file: File): Promise<void> {
		try {
			this.clearError();
			this._state.input_file = file;

			// Convert file to ImageData
			const imageData = await this.fileToImageData(file);
			this._state.input_image = imageData;
		} catch (error) {
			this.setError({
				type: 'unknown',
				message: 'Failed to load image file',
				details: error instanceof Error ? error.message : String(error)
			});
			throw error;
		}
	}

	/**
	 * Set input image directly from ImageData
	 */
	setInputImage(imageData: ImageData): void {
		this._state.input_image = imageData;
		this._state.input_file = undefined; // Clear file if setting raw ImageData
		// Clear multi-image state when setting single image
		this._state.input_images = [];
		this._state.input_files = [];
		this._state.current_image_index = 0;
		this.clearError();
	}

	/**
	 * Set multiple input files
	 */
	async setInputFiles(files: File[]): Promise<void> {
		try {
			this.clearError();
			this._state.input_files = files;
			this._state.current_image_index = 0;

			// Convert all files to ImageData
			const imageDataArray: ImageData[] = [];
			for (const file of files) {
				const imageData = await this.fileToImageData(file);
				imageDataArray.push(imageData);
			}

			this._state.input_images = imageDataArray;

			// Set current single-image state to first image for backward compatibility
			if (files.length > 0) {
				this._state.input_file = files[0];
				this._state.input_image = imageDataArray[0];
			}

			// Clear batch results when new files are set
			this._state.batch_results = [];
		} catch (error) {
			this.setError({
				type: 'unknown',
				message: 'Failed to load image files',
				details: error instanceof Error ? error.message : String(error)
			});
			throw error;
		}
	}

	/**
	 * Set the current image index for preview/processing
	 */
	setCurrentImageIndex(index: number): void {
		if (index >= 0 && index < (this._state.input_files?.length || 0)) {
			this._state.current_image_index = index;
			// Update single-image state for backward compatibility
			if (this._state.input_files && this._state.input_images) {
				this._state.input_file = this._state.input_files[index];
				this._state.input_image = this._state.input_images[index];
			}
		}
	}

	/**
	 * Process the current input image with comprehensive validation and cleanup
	 */
	async processImage(): Promise<ProcessingResult> {
		if (!this._state.is_initialized) {
			throw new Error('Vectorizer not initialized');
		}

		if (!this._state.input_image) {
			throw new Error('No input image set');
		}

		// Comprehensive configuration validation
		const validation = this.validateConfig();
		if (!validation.isValid) {
			const configError: VectorizerError = {
				type: 'config',
				message: 'Configuration validation failed',
				details: validation.errors.join('. ')
			};
			this.setError(configError);
			throw configError;
		}

		let processingTimeoutId: NodeJS.Timeout | null = null;
		let isAborted = false;

		try {
			this._state.is_processing = true;
			this._state.current_progress = undefined;
			this.clearError();

			// Set up processing timeout with cleanup
			const timeoutMs = this._state.config.max_processing_time_ms || 30000;
			processingTimeoutId = setTimeout(() => {
				isAborted = true;
				console.log(`[VectorizerStore] Processing timeout after ${timeoutMs}ms, aborting...`);
				this.abortProcessing();
			}, timeoutMs);

			const result = await vectorizerService.processImage(
				this._state.input_image,
				this._state.config,
				(progress) => {
					if (!isAborted) {
						this._state.current_progress = progress;
					}
				}
			);

			if (isAborted) {
				throw new Error('Processing was aborted due to timeout');
			}

			// Clear any previous errors on successful processing
			this.clearError();

			this._state.last_result = result;

			// Log if result has very few paths (might indicate user needs different settings)
			if (result.statistics?.paths_generated === 0) {
				console.warn(
					'[VectorizerStore] Conversion produced no paths - user may want to try different settings'
				);
			}

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
			this._state.is_processing = false;
			this._state.current_progress = undefined;

			// Force cleanup of any WASM resources
			try {
				// Note: This will be handled by the service cleanup method
				console.log('[VectorizerStore] Processing completed, cleaning up resources');
			} catch (cleanupError) {
				console.warn('[VectorizerStore] Cleanup warning:', cleanupError);
			}
		}
	}

	/**
	 * Process all images in batch with comprehensive validation and cleanup
	 */
	async processBatch(
		onProgress?: (imageIndex: number, totalImages: number, progress: ProcessingProgress) => void
	): Promise<ProcessingResult[]> {
		if (!this._state.is_initialized) {
			throw new Error('Vectorizer not initialized');
		}

		const images = this._state.input_images;
		if (!images || images.length === 0) {
			throw new Error('No input images set');
		}

		// Comprehensive configuration validation
		const validation = this.validateConfig();
		if (!validation.isValid) {
			const configError: VectorizerError = {
				type: 'config',
				message: 'Configuration validation failed',
				details: validation.errors.join('. ')
			};
			this.setError(configError);
			throw configError;
		}

		let batchTimeoutId: NodeJS.Timeout | null = null;
		let isAborted = false;
		const results: ProcessingResult[] = [];

		try {
			this._state.is_processing = true;
			this._state.current_progress = undefined;
			this.clearError();

			// Set up batch processing timeout (longer than single image)
			const singleImageTimeoutMs = this._state.config.max_processing_time_ms || 30000;
			const batchTimeoutMs = singleImageTimeoutMs * images.length + 10000; // Extra buffer
			batchTimeoutId = setTimeout(() => {
				isAborted = true;
				console.log(
					`[VectorizerStore] Batch processing timeout after ${batchTimeoutMs}ms, aborting...`
				);
				this.abortProcessing();
			}, batchTimeoutMs);

			for (let i = 0; i < images.length; i++) {
				if (isAborted) {
					console.log(
						`[VectorizerStore] Batch processing aborted at image ${i + 1}/${images.length}`
					);
					break;
				}

				const imageData = images[i];

				// Don't update current_image_index during batch processing
				// The UI should manage its own display index separately from processing index

				try {
					const result = await vectorizerService.processImage(
						imageData,
						this._state.config,
						(progress) => {
							if (!isAborted) {
								this._state.current_progress = progress;
								onProgress?.(i, images.length, progress);
							}
						}
					);

					results.push(result);
					console.log(`[VectorizerStore] Completed image ${i + 1}/${images.length}`);
				} catch (imageError) {
					console.error(`[VectorizerStore] Failed to process image ${i + 1}:`, imageError);
					// Continue with remaining images but log the error
					const errorResult: ProcessingResult = {
						svg: '<svg><text>Processing failed</text></svg>',
						processing_time_ms: 0,
						config_used: this._state.config,
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

			this._state.batch_results = results;
			// Set last result to the final processed image
			if (results.length > 0) {
				this._state.last_result = results[results.length - 1];
			}

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
			this._state.is_processing = false;
			this._state.current_progress = undefined;

			// Force cleanup of any WASM resources
			try {
				console.log(
					`[VectorizerStore] Batch processing completed, processed ${results.length}/${images.length} images`
				);
			} catch (cleanupError) {
				console.warn('[VectorizerStore] Batch cleanup warning:', cleanupError);
			}
		}
	}

	/**
	 * Clear the current input
	 */
	clearInput(): void {
		this._state.input_image = undefined;
		this._state.input_file = undefined;
		this._state.input_images = [];
		this._state.input_files = [];
		this._state.current_image_index = 0;
		this._state.last_result = undefined;
		this._state.batch_results = [];
		this.clearError();
	}

	/**
	 * Clear the last result
	 */
	clearResult(): void {
		this._state.last_result = undefined;
		this._state.batch_results = [];
	}

	/**
	 * Set error state
	 */
	private setError(error: VectorizerError): void {
		this._state.error = error;
		this._state.has_error = true;

		// Log error for debugging
		console.error('Vectorizer error:', error);

		// Auto-clear certain types of errors after a delay
		if (error.type === 'config') {
			setTimeout(() => {
				if (this._state.error === error) {
					this.clearError();
				}
			}, 3000); // Clear config errors after 3 seconds (shorter for better UX)
		}
	}

	/**
	 * Clear error state
	 */
	clearError(): void {
		this._state.error = undefined;
		this._state.has_error = false;
	}

	/**
	 * Retry the last failed operation
	 */
	async retryLastOperation(): Promise<void> {
		if (!this._state.has_error) {
			return;
		}

		this.clearError();

		// Determine what to retry based on current state
		if (this._state.input_image && !this._state.is_initialized) {
			// Retry initialization
			await this.initialize();
		} else if (this._state.input_image && this._state.is_initialized) {
			// Retry processing
			await this.processImage();
		}
	}

	/**
	 * Reset the entire state to initial values
	 */
	reset(): void {
		this._state.is_processing = false;
		this._state.current_progress = undefined;
		this._state.last_result = undefined;
		this._state.batch_results = [];
		this._state.input_image = undefined;
		this._state.input_file = undefined;
		this._state.input_images = [];
		this._state.input_files = [];
		this._state.current_image_index = 0;
		this.clearError();
		this.resetConfig();
	}

	/**
	 * Get user-friendly error message
	 */
	getErrorMessage(error?: VectorizerError): string {
		const err = error || this._state.error;
		if (!err) return '';

		const baseMessages: Record<VectorizerError['type'], string> = {
			config: 'Configuration error. Please check your settings and try again.',
			processing: 'Processing failed. The image might be too complex or corrupted.',
			memory:
				'Not enough memory to process this image. Try a smaller image or reduce quality settings.',
			threading: 'Multi-threading setup failed. Processing will continue in single-threaded mode.',
			unknown: 'An unexpected error occurred. Please try again.'
		};

		let message = baseMessages[err.type] || baseMessages.unknown;

		// Add specific guidance based on error details
		if (err.details) {
			if (err.details.includes('SharedArrayBuffer')) {
				message += ' Note: Multi-threading requires HTTPS and specific CORS headers.';
			} else if (err.details.includes('memory') || err.details.includes('allocation')) {
				message += ' Try reducing the image size or detail level.';
			} else if (err.details.includes('timeout')) {
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
		if (!this._state.error) return [];

		const suggestions: string[] = [];

		switch (this._state.error.type) {
			case 'config':
				suggestions.push('Reset to default settings');
				suggestions.push('Try a different algorithm or preset');
				break;

			case 'processing':
				suggestions.push('Try a smaller image (reduce resolution)');
				suggestions.push('Lower the detail level');
				suggestions.push('Use a simpler algorithm like "centerline"');
				break;

			case 'memory':
				suggestions.push('Reduce image size before uploading');
				suggestions.push('Lower quality settings');
				suggestions.push('Close other browser tabs to free memory');
				break;

			case 'threading':
				suggestions.push('Processing will continue in single-threaded mode');
				suggestions.push('For faster processing, serve over HTTPS with proper CORS headers');
				break;

			case 'unknown':
				suggestions.push('Refresh the page and try again');
				suggestions.push('Check browser console for more details');
				suggestions.push('Try a different image or settings');
				break;
		}

		return suggestions;
	}

	/**
	 * Get processing statistics
	 */
	getStats(): {
		processing_time?: number;
		input_size?: string;
		output_size?: string;
		compression_ratio?: number;
	} {
		if (!this._state.last_result) {
			return {};
		}

		const result = this._state.last_result;
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
	 * Comprehensive configuration validation with detailed error reporting
	 */
	validateConfig(): { isValid: boolean; errors: string[] } {
		const config = this._state.config;
		const errors: string[] = [];

		// Universal parameter validation (applies to all backends)
		if (config.detail < 0 || config.detail > 1) {
			errors.push('Detail level must be between 0.0 and 1.0');
		}
		if (config.stroke_width < 0.1 || config.stroke_width > 10) {
			errors.push('Stroke width must be between 0.1 and 10.0 pixels');
		}

		// Hand-drawn aesthetics validation (applies to all backends that support it)
		if (config.variable_weights < 0 || config.variable_weights > 1) {
			errors.push('Variable weights must be between 0.0 and 1.0');
		}
		if (config.tremor_strength < 0 || config.tremor_strength > 0.5) {
			errors.push('Tremor strength must be between 0.0 and 0.5');
		}
		if (config.tapering < 0 || config.tapering > 1) {
			errors.push('Tapering must be between 0.0 and 1.0');
		}

		// Backend-specific validation
		if (config.backend === 'edge') {
			// Note: Flow tracing dependencies are now auto-fixed by the service layer
			// So we don't need to error here, just warn
			if (config.enable_bezier_fitting && !config.enable_flow_tracing) {
				console.warn(
					'[VectorizerStore] Bézier curve fitting works best with flow-guided tracing (will be auto-enabled)'
				);
			}
			if (config.enable_etf_fdog && !config.enable_flow_tracing) {
				console.warn(
					'[VectorizerStore] ETF/FDoG edge detection works best with flow-guided tracing (will be auto-enabled)'
				);
			}
		}

		if (config.backend === 'dots') {
			// Dots backend validation
			const density = config.dot_density ?? config.dot_density_threshold;
			if (density !== undefined && (density < 0.0 || density > 1.0)) {
				errors.push('Dot density must be between 0.0 and 1.0');
			}
			if (
				config.background_tolerance !== undefined &&
				(config.background_tolerance < 0 || config.background_tolerance > 1)
			) {
				errors.push('Background tolerance must be between 0.0 and 1.0');
			}
			if (
				config.min_radius !== undefined &&
				config.max_radius !== undefined &&
				config.min_radius >= config.max_radius
			) {
				errors.push('Minimum dot radius must be smaller than maximum radius');
			}
			if (config.min_radius !== undefined && (config.min_radius < 0.2 || config.min_radius > 3.0)) {
				errors.push('Minimum dot radius must be between 0.2 and 3.0 pixels');
			}
			if (
				config.max_radius !== undefined &&
				(config.max_radius < 0.5 || config.max_radius > 10.0)
			) {
				errors.push('Maximum dot radius must be between 0.5 and 10.0 pixels');
			}
			// Hand-drawn effects don't really apply to dots (warn but don't error)
			if (
				config.hand_drawn_preset !== 'none' &&
				(config.variable_weights > 0 || config.tremor_strength > 0)
			) {
				console.warn('[VectorizerStore] Hand-drawn effects are not recommended for dots backend');
			}
		}

		if (config.backend === 'centerline') {
			// Centerline backend validation
			if (
				config.window_size !== undefined &&
				(config.window_size < 15 || config.window_size > 50)
			) {
				errors.push('Adaptive threshold window size must be between 15 and 50 pixels');
			}
			if (
				config.sensitivity_k !== undefined &&
				(config.sensitivity_k < 0.1 || config.sensitivity_k > 1.0)
			) {
				errors.push('Sensitivity parameter must be between 0.1 and 1.0');
			}
			if (
				config.min_branch_length !== undefined &&
				(config.min_branch_length < 4 || config.min_branch_length > 24)
			) {
				errors.push('Minimum branch length must be between 4 and 24 pixels');
			}
			if (
				config.douglas_peucker_epsilon !== undefined &&
				(config.douglas_peucker_epsilon < 0.5 || config.douglas_peucker_epsilon > 3.0)
			) {
				errors.push('Douglas-Peucker epsilon must be between 0.5 and 3.0 pixels');
			}
			// Warn about edge-specific features being used with centerline
			if (config.enable_flow_tracing || config.enable_bezier_fitting || config.enable_etf_fdog) {
				errors.push(
					'Flow tracing, Bézier fitting, and ETF/FDoG are not applicable to centerline backend'
				);
			}
		}

		if (config.backend === 'superpixel') {
			// Superpixel backend validation
			if (
				config.num_superpixels !== undefined &&
				(config.num_superpixels < 20 || config.num_superpixels > 1000)
			) {
				errors.push('Number of superpixels must be between 20 and 1000');
			}
			if (config.compactness !== undefined && (config.compactness < 1 || config.compactness > 50)) {
				errors.push('Superpixel compactness must be between 1 and 50');
			}
			if (
				config.slic_iterations !== undefined &&
				(config.slic_iterations < 5 || config.slic_iterations > 15)
			) {
				errors.push('SLIC iterations must be between 5 and 15');
			}
			if (
				config.boundary_epsilon !== undefined &&
				(config.boundary_epsilon < 0.5 || config.boundary_epsilon > 3.0)
			) {
				errors.push('Boundary epsilon must be between 0.5 and 3.0 pixels');
			}
			// Warn about edge-specific features being used with superpixel
			if (config.enable_flow_tracing || config.enable_bezier_fitting || config.enable_etf_fdog) {
				errors.push(
					'Flow tracing, Bézier fitting, and ETF/FDoG are not applicable to superpixel backend'
				);
			}
		}

		// Performance constraints validation
		if (config.max_processing_time_ms !== undefined && config.max_processing_time_ms < 1000) {
			errors.push('Maximum processing time must be at least 1000ms (1 second)');
		}

		// Global output settings validation
		if (
			config.svg_precision !== undefined &&
			(config.svg_precision < 0 || config.svg_precision > 4)
		) {
			errors.push('SVG precision must be between 0 and 4 decimal places');
		}

		return {
			isValid: errors.length === 0,
			errors
		};
	}

	/**
	 * Check if current configuration is valid for processing (legacy method)
	 */
	isConfigValid(): boolean {
		return this.validateConfig().isValid;
	}

	/**
	 * Abort current processing operation
	 */
	abortProcessing(): void {
		console.log('[VectorizerStore] Aborting processing...');

		// Stop the processing flag
		this._state.is_processing = false;
		this._state.current_progress = undefined;

		// Call service abort
		vectorizerService.abortProcessing();

		// Set error state
		this.setError({
			type: 'processing',
			message: 'Processing aborted',
			details: 'Processing was manually stopped or timed out'
		});
	}

	/**
	 * Cleanup resources with forced abort
	 */
	cleanup(): void {
		// First abort any ongoing processing
		if (this._state.is_processing) {
			this.abortProcessing();
		}

		// WASM cleanup is handled by the service
		vectorizerService.cleanup();
		this._state.is_initialized = false;
		this._initState.wasmLoaded = false;
		this._initState.threadsInitialized = false;
		this.clearInput();
		this.clearError();

		console.log('[VectorizerStore] Store cleanup completed');
	}

	// Helper methods
	private async fileToImageData(file: File): Promise<ImageData> {
		// Validate file type first
		if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
			throw new Error(`SVG files cannot be used as source images. Please use JPG, PNG, or WebP files.`);
		}
		
		return new Promise((resolve, reject) => {
			const img = new Image();
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');

			if (!ctx) {
				reject(new Error('Failed to get canvas context'));
				return;
			}
			
			const objectUrl = URL.createObjectURL(file);

			img.onload = () => {
				canvas.width = img.width;
				canvas.height = img.height;
				ctx.drawImage(img, 0, 0);

				try {
					const imageData = ctx.getImageData(0, 0, img.width, img.height);
					URL.revokeObjectURL(objectUrl); // Clean up
					resolve(imageData);
				} catch (error) {
					URL.revokeObjectURL(objectUrl); // Clean up
					reject(error);
				}
			};

			img.onerror = () => {
				URL.revokeObjectURL(objectUrl); // Clean up
				reject(new Error(`Failed to load image: ${file.name}. Please ensure it's a valid JPG, PNG, or WebP file.`));
			};

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
}

// Export singleton instance
export const vectorizerStore = new VectorizerStore();
