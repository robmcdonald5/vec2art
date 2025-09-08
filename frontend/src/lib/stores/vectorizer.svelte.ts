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
	VectorizerPreset,
	VectorizerBackend
} from '$lib/types/vectorizer';
import { DEFAULT_CONFIG as defaultConfig, PRESET_CONFIGS, getDefaultConfigForBackend } from '$lib/types/vectorizer';

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

	// Per-algorithm configuration state to prevent slider overlap/sharing
	// Use centralized getDefaultConfigForBackend to ensure consistency
	private _algorithmConfigs = $state<Record<VectorizerBackend, VectorizerConfig>>({
		edge: getDefaultConfigForBackend('edge'),
		centerline: getDefaultConfigForBackend('centerline'),
		superpixel: getDefaultConfigForBackend('superpixel'),
		dots: getDefaultConfigForBackend('dots')
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

	// Track auto-recovery state to prevent infinite loops
	private _recoveryState = $state<{
		isRecovering: boolean;
		recoveryAttempts: number;
		lastRecoveryTime: number;
	}>({
		isRecovering: false,
		recoveryAttempts: 0,
		lastRecoveryTime: 0
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

	get isPanicked(): boolean {
		return this._state.has_error && this.isPanicCondition(this._state.error!);
	}

	get isRecovering(): boolean {
		return this._recoveryState.isRecovering;
	}

	get recoveryAttempts(): number {
		return this._recoveryState.recoveryAttempts;
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
	 * Get the per-algorithm configurations for debugging/inspection
	 */
	get algorithmConfigs(): Record<VectorizerBackend, VectorizerConfig> {
		return this._algorithmConfigs;
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
	 * Update configuration with normalization and per-algorithm state management
	 */
	updateConfig(updates: Partial<VectorizerConfig>): void {
		// Apply parameter normalization before updating config
		const normalizedUpdates = this.normalizeConfig(updates);

		// If backend is changing, switch to the appropriate per-algorithm config
		if (normalizedUpdates.backend && normalizedUpdates.backend !== this._state.config.backend) {
			// Save current config state to the current algorithm
			this._algorithmConfigs[this._state.config.backend] = { ...this._state.config };

			// Switch to the new algorithm's config
			const newAlgorithmConfig = { ...this._algorithmConfigs[normalizedUpdates.backend] };
			// Apply any additional updates from the current call
			const otherUpdates = { ...normalizedUpdates };
			delete otherUpdates.backend; // Remove backend from other updates

			this._state.config = { ...newAlgorithmConfig, ...otherUpdates };
			console.log(
				`[VectorizerStore] Switched to ${normalizedUpdates.backend} algorithm config:`,
				this._state.config
			);
		} else {
			// Same algorithm, just update the current config and save to algorithm state
			this._state.config = { ...this._state.config, ...normalizedUpdates };
			this._algorithmConfigs[this._state.config.backend] = { ...this._state.config };
		}

		this.clearError(); // Clear any previous config errors
	}

	/**
	 * Reset configuration to defaults - resets current algorithm config only
	 */
	resetConfig(): void {
		const currentBackend = this._state.config.backend;
		const defaultAlgorithmConfig = this._getDefaultConfigForBackend(currentBackend);
		this._state.config = { ...defaultAlgorithmConfig };
		this._algorithmConfigs[currentBackend] = { ...defaultAlgorithmConfig };
		this.clearError();
	}

	/**
	 * Reset all algorithm configurations to their defaults
	 */
	resetAllAlgorithmConfigs(): void {
		this._algorithmConfigs.edge = this._getDefaultConfigForBackend('edge');
		this._algorithmConfigs.centerline = this._getDefaultConfigForBackend('centerline');
		this._algorithmConfigs.superpixel = this._getDefaultConfigForBackend('superpixel');
		this._algorithmConfigs.dots = this._getDefaultConfigForBackend('dots');
		// Update current config to match current backend
		this._state.config = { ...this._algorithmConfigs[this._state.config.backend] };
		this.clearError();
	}

	/**
	 * Get default configuration for a specific backend
	 * Use the centralized getDefaultConfigForBackend from types/vectorizer.ts
	 */
	private _getDefaultConfigForBackend(backend: VectorizerBackend): VectorizerConfig {
		// Use the centralized function which properly applies BACKEND_DEFAULTS
		return getDefaultConfigForBackend(backend);
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

			// Reset recovery attempts on successful processing (system is stable)
			if (this._recoveryState.recoveryAttempts > 0) {
				console.log(
					'[VectorizerStore] ✅ Successful processing - resetting recovery attempt counter'
				);
				this._recoveryState.recoveryAttempts = 0;
				this._recoveryState.lastRecoveryTime = 0;
			}

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
			// Use much longer timeout for complex backends (dots, superpixel) that may need more time
			const backendMultiplier =
				this._state.config.backend === 'dots' || this._state.config.backend === 'superpixel'
					? 10
					: 3;
			const batchTimeoutMs = Math.max(
				singleImageTimeoutMs * images.length * backendMultiplier,
				300000
			); // At least 5 minutes
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

				// Check for large image and provide user feedback
				const pixelCount = imageData.width * imageData.height;
				const megapixels = pixelCount / 1_000_000;
				const isLargeImage = megapixels > 10;

				if (isLargeImage) {
					console.log(
						`[VectorizerStore] 📊 Processing large image: ${megapixels.toFixed(1)}MP (${imageData.width}x${imageData.height})`
					);

					// Update progress to show optimization notice
					this._state.current_progress = {
						progress: 0,
						stage: 'initialization' as const,
						elapsed_ms: 0,
						message: `Optimizing ${megapixels.toFixed(1)}MP image for processing...`
					};
					onProgress?.(i, images.length, this._state.current_progress!);
				}

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
						svg: '<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#fef2f2" stroke="#fca5a5" stroke-width="2" rx="8"/><text x="200" y="100" text-anchor="middle" dominant-baseline="central" fill="#dc2626" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600">Failed to convert</text></svg>',
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
	 * Set error state with enhanced panic detection and recovery
	 */
	private setError(error: VectorizerError): void {
		this._state.error = error;
		this._state.has_error = true;

		// Log error for debugging
		console.error('Vectorizer error:', error);

		// Enhanced panic detection for more error patterns
		const isPanicError = this.isPanicCondition(error);

		if (isPanicError && !this._recoveryState.isRecovering) {
			console.log(
				`[VectorizerStore] 🚨 Panic condition detected: ${error.type} - ${error.message}`
			);
			this.attemptAutoRecovery(error);
		}

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
	 * Enhanced panic condition detection
	 */
	private isPanicCondition(error: VectorizerError): boolean {
		const errorText = (error.message + ' ' + (error.details || '')).toLowerCase();

		// Critical WASM runtime errors that indicate system corruption
		const panicPatterns = [
			'unreachable executed',
			'panic',
			'memory access out of bounds',
			'call stack exhausted',
			'invalid memory access',
			'segmentation fault',
			'abort called',
			'assertion failed',
			'stack overflow',
			'called option::unwrap() on a none value',
			'index out of bounds',
			'attempted to divide by zero',
			'crossbeam-epoch',
			'wasm execution failed',
			'worker thread panicked'
		];

		return (
			error.type === 'unknown' ||
			panicPatterns.some((pattern) => errorText.includes(pattern)) ||
			// Threading-related failures that often indicate WASM state corruption
			(error.type === 'threading' && errorText.includes('failed'))
		);
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
		this.resetAllAlgorithmConfigs(); // Reset all algorithm configs, not just current
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
			vectorizerService.abortProcessing();

			// Also force reset the worker service queue for thorough cleanup
			const { wasmWorkerService } = await import('$lib/services/wasm-worker-service');
			await wasmWorkerService.forceReset();

			console.log('[VectorizerStore] ✅ Force reset complete - all operations cancelled');
		} catch (error) {
			console.error('[VectorizerStore] Error during force reset:', error);
			// Still reset store state even if worker reset fails
			this.reset();
		}
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
	 * Normalize configuration parameters to ensure they're within valid ranges
	 * This prevents WASM parameter validation failures
	 */
	normalizeConfig(config: Partial<VectorizerConfig>): Partial<VectorizerConfig> {
		const normalized = { ...config };

		// Universal parameter normalization
		if (typeof normalized.detail === 'number') {
			normalized.detail = Math.max(0, Math.min(1, normalized.detail));
		}
		if (typeof normalized.stroke_width === 'number') {
			// Apply intelligent scaling limit to prevent WASM crashes
			// Large images (>2x 1080p) can cause stroke scaling issues, so limit to 5.0 max
			const imageArea = (this._state.input_image?.width ?? 1920) * (this._state.input_image?.height ?? 1080);
			const reference1080pArea = 1920 * 1080;
			const areaRatio = imageArea / reference1080pArea;
			
			const dynamicMaxStroke = areaRatio > 4 ? 5.0 : areaRatio > 2 ? 7.0 : 10.0;
			normalized.stroke_width = Math.max(0.1, Math.min(dynamicMaxStroke, normalized.stroke_width));
		}
		if (typeof normalized.pass_count === 'number') {
			normalized.pass_count = Math.max(1, Math.min(10, Math.round(normalized.pass_count)));
		}

		// Hand-drawn aesthetics normalization
		if (typeof normalized.variable_weights === 'number') {
			normalized.variable_weights = Math.max(0, Math.min(1, normalized.variable_weights));
		}
		if (typeof normalized.tremor_strength === 'number') {
			// CRITICAL: WASM validation limits tremor_strength to 0.0-0.5
			normalized.tremor_strength = Math.max(0, Math.min(0.5, normalized.tremor_strength));
		}
		if (typeof normalized.tapering === 'number') {
			normalized.tapering = Math.max(0, Math.min(1, normalized.tapering));
		}

		// Dots backend normalization
		if (normalized.backend === 'dots' || this._state.config.backend === 'dots') {
			if (typeof normalized.dot_density_threshold === 'number') {
				normalized.dot_density_threshold = Math.max(
					0,
					Math.min(1, normalized.dot_density_threshold)
				);
			}
			if (typeof normalized.background_tolerance === 'number') {
				normalized.background_tolerance = Math.max(0, Math.min(1, normalized.background_tolerance));
			}
			if (typeof normalized.min_radius === 'number') {
				normalized.min_radius = Math.max(0.2, Math.min(3, normalized.min_radius));
			}
			if (typeof normalized.max_radius === 'number') {
				normalized.max_radius = Math.max(0.5, Math.min(10, normalized.max_radius));
			}
			// Ensure min_radius < max_radius
			if (
				normalized.min_radius &&
				normalized.max_radius &&
				normalized.min_radius >= normalized.max_radius
			) {
				normalized.max_radius = normalized.min_radius + 0.5;
			}
		}

		// Centerline backend normalization
		if (normalized.backend === 'centerline' || this._state.config.backend === 'centerline') {
			if (typeof normalized.window_size === 'number') {
				normalized.window_size = Math.max(15, Math.min(50, normalized.window_size));
			}
			if (typeof normalized.sensitivity_k === 'number') {
				normalized.sensitivity_k = Math.max(0.1, Math.min(1, normalized.sensitivity_k));
			}
			if (typeof normalized.min_branch_length === 'number') {
				normalized.min_branch_length = Math.max(4, Math.min(24, normalized.min_branch_length));
			}
			if (typeof normalized.douglas_peucker_epsilon === 'number') {
				normalized.douglas_peucker_epsilon = Math.max(
					0.5,
					Math.min(3, normalized.douglas_peucker_epsilon)
				);
			}
		}

		// Superpixel backend normalization
		if (normalized.backend === 'superpixel' || this._state.config.backend === 'superpixel') {
			if (typeof normalized.num_superpixels === 'number') {
				normalized.num_superpixels = Math.max(
					20,
					Math.min(1000, Math.round(normalized.num_superpixels))
				);
			}
			if (typeof normalized.compactness === 'number') {
				normalized.compactness = Math.max(1, Math.min(50, normalized.compactness));
			}
			if (typeof normalized.slic_iterations === 'number') {
				normalized.slic_iterations = Math.max(
					5,
					Math.min(15, Math.round(normalized.slic_iterations))
				);
			}
			if (typeof normalized.boundary_epsilon === 'number') {
				normalized.boundary_epsilon = Math.max(0.5, Math.min(3, normalized.boundary_epsilon));
			}
		}

		// Performance settings normalization
		if (typeof normalized.max_processing_time_ms === 'number') {
			normalized.max_processing_time_ms = Math.max(1000, normalized.max_processing_time_ms);
		}
		if (typeof normalized.svg_precision === 'number') {
			normalized.svg_precision = Math.max(0, Math.min(4, Math.round(normalized.svg_precision)));
		}

		console.log('[VectorizerStore] Parameter normalization applied:', {
			original: config,
			normalized: normalized
		});

		return normalized;
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
				reject(
					new Error(
						`Failed to load image: ${file.name}. Please ensure it's a valid JPG, PNG, WebP, TIFF, BMP, or GIF file.`
					)
				);
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

	/**
	 * Emergency recovery from WASM panic state
	 * Completely reinitializes the WASM module and thread pool
	 */
	/**
	 * Attempt automatic recovery from panic conditions with improved logic
	 */
	private async attemptAutoRecovery(originalError: VectorizerError): Promise<void> {
		const now = Date.now();
		const timeSinceLastRecovery = now - this._recoveryState.lastRecoveryTime;
		const maxConsecutiveAttempts = 2; // Reduced for faster user feedback
		const recoveryThrottleMs = 5000; // 5 seconds between attempts (much shorter)

		// More lenient throttling - allow immediate recovery if enough time has passed
		if (
			this._recoveryState.recoveryAttempts >= maxConsecutiveAttempts &&
			timeSinceLastRecovery < recoveryThrottleMs
		) {
			console.warn(
				`[VectorizerStore] Auto-recovery throttled (${this._recoveryState.recoveryAttempts}/${maxConsecutiveAttempts}), waiting ${Math.ceil((recoveryThrottleMs - timeSinceLastRecovery) / 1000)}s`
			);
			return;
		}

		// Reset attempts if enough time has passed since last recovery
		if (timeSinceLastRecovery > 60000) {
			// 1 minute timeout resets the counter
			this._recoveryState.recoveryAttempts = 0;
		}

		console.log(
			`[VectorizerStore] 🚨 Panic detected: "${originalError.details}", attempting auto-recovery (attempt ${this._recoveryState.recoveryAttempts + 1}/${maxConsecutiveAttempts})`
		);

		this._recoveryState.isRecovering = true;
		this._recoveryState.recoveryAttempts++;
		this._recoveryState.lastRecoveryTime = now;

		// Show user feedback during recovery
		this._state.error = {
			type: 'unknown',
			message: 'System recovering...',
			details: 'Automatically fixing the issue, please wait...'
		};

		try {
			// Enhanced recovery with configuration reset
			await this.enhancedEmergencyRecovery(originalError);

			// Reset recovery counter on successful recovery
			this._recoveryState.recoveryAttempts = 0;
			console.log('[VectorizerStore] ✅ Auto-recovery completed successfully');

			// Clear the recovery message
			this.clearError();
		} catch (error) {
			console.error('[VectorizerStore] ❌ Auto-recovery failed:', error);

			// If we've reached max attempts, provide clearer guidance
			if (this._recoveryState.recoveryAttempts >= maxConsecutiveAttempts) {
				this._state.error = {
					type: 'unknown',
					message: 'System requires page refresh',
					details: `Auto-recovery failed after ${maxConsecutiveAttempts} attempts. The WASM module may be corrupted. Please refresh the page (Ctrl+R or Cmd+R) to fully reset the converter.`
				};
				this._state.has_error = true; // Ensure error state is set
			} else {
				// Still have attempts left, keep the original error
				this._state.error = originalError;
				this._state.has_error = true;
			}
		} finally {
			this._recoveryState.isRecovering = false;
		}
	}

	/**
	 * Enhanced emergency recovery with configuration reset and validation
	 */
	async enhancedEmergencyRecovery(originalError: VectorizerError): Promise<void> {
		console.log('[VectorizerStore] Starting enhanced emergency recovery...');

		// Prevent setError from triggering auto-recovery during recovery
		const wasRecovering = this._recoveryState.isRecovering;
		this._recoveryState.isRecovering = true;

		try {
			// Step 1: Force cleanup of current service
			console.log('[VectorizerStore] 🧹 Cleaning up corrupted WASM state...');
			vectorizerService.cleanup();

			// Step 2: Reset all state completely
			this._state.is_initialized = false;
			this._state.is_processing = false;
			this._initState.wasmLoaded = false;
			this._initState.threadsInitialized = false;
			this.clearError();

			// Step 3: Reset configuration to safe defaults to prevent repeat panics
			console.log('[VectorizerStore] ⚙️ Resetting configuration to safe defaults...');
			const safeConfig = {
				...defaultConfig,
				// Force safe settings to prevent repeat panics
				backend: 'edge' as const,
				pass_count: 1, // Single pass only for safety
				multipass: false,
				reverse_pass: false, // Disable directional passes that caused panic
				diagonal_pass: false,
				enable_etf_fdog: false,
				enable_flow_tracing: false,
				enable_bezier_fitting: false,
				hand_drawn_preset: 'none' as const, // Safe default - no artistic effects
				variable_weights: 0.0,
				tremor_strength: 0.0,
				tapering: 0.0
			};
			this._state.config = safeConfig;

			// Step 4: Wait longer for complete cleanup (WASM needs time)
			console.log('[VectorizerStore] ⏳ Waiting for WASM cleanup to complete...');
			await new Promise((resolve) => setTimeout(resolve, 1500)); // Longer wait

			// Step 5: Force garbage collection if available
			if ('gc' in window && typeof window.gc === 'function') {
				try {
					window.gc();
					console.log('[VectorizerStore] 🗑️ Forced garbage collection');
				} catch (e) {
					// Ignore GC errors
				}
			}

			// Step 6: Reinitialize with conservative thread count
			console.log('[VectorizerStore] 🔄 Reinitializing WASM module...');
			const threadCount = Math.min(this._initState.requestedThreadCount || 4, 4); // Max 4 threads for stability
			await this.initialize({
				threadCount,
				autoInitThreads: true
			});

			console.log(
				'[VectorizerStore] ✅ Enhanced recovery completed successfully - safe configuration restored'
			);
		} catch (error) {
			console.error('[VectorizerStore] ❌ Enhanced recovery failed:', error);

			// Don't recurse - just fail cleanly
			this._state.error = {
				type: 'unknown',
				message: 'Critical system failure',
				details: `Recovery completely failed: ${error instanceof Error ? error.message : 'Unknown error'}. Page refresh required.`
			};
			this._state.has_error = true;
			throw error;
		} finally {
			this._recoveryState.isRecovering = wasRecovering;
		}
	}

	/**
	 * Manual emergency recovery (called by user action) - wrapper for enhanced recovery
	 */
	async emergencyRecovery(): Promise<void> {
		console.log('[VectorizerStore] Manual emergency recovery requested...');

		// Create a synthetic error for the enhanced recovery
		const manualError: VectorizerError = {
			type: 'unknown',
			message: 'Manual recovery initiated',
			details: 'User requested emergency recovery'
		};

		await this.enhancedEmergencyRecovery(manualError);
	}
}

// Export singleton instance
export const vectorizerStore = new VectorizerStore();
