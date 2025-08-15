/**
 * WASM Vectorizer Service Layer
 * Provides browser-safe initialization and interaction with the vectorize-wasm module
 */

import { browser } from '$app/environment';
import type {
	VectorizerConfig,
	VectorizerError,
	WasmCapabilityReport,
	ProcessingResult,
	ProcessingProgress
} from '$lib/types/vectorizer';

// Import WASM initialization utilities
import {
	loadVectorizer,
	createVectorizer,
	getCapabilities,
	getAvailableBackends,
	getAvailablePresets,
	initializeThreadPool as initThreads,
	isThreadPoolInitialized,
	getCurrentThreadCount,
	getMaxThreads,
	getRecommendedThreadCount
} from '$lib/wasm/loader';

// Dynamic import type for WASM module
type WasmModule = any; // We'll type this properly after loading
type WasmVectorizer = any;

export class VectorizerService {
	private static instance: VectorizerService | null = null;
	private wasmModule: WasmModule | null = null;
	private vectorizer: WasmVectorizer | null = null;
	private isInitialized = false;
	private initializationPromise: Promise<void> | null = null;

	private constructor() {}

	static getInstance(): VectorizerService {
		if (!VectorizerService.instance) {
			VectorizerService.instance = new VectorizerService();
		}
		return VectorizerService.instance;
	}

	/**
	 * Initialize the WASM module (browser-only) with optional threading
	 * Safe to call multiple times - will return the same promise
	 */
	async initialize(options?: { threadCount?: number; autoInitThreads?: boolean }): Promise<void> {
		if (!browser) {
			throw new Error('VectorizerService can only be initialized in the browser');
		}

		if (this.isInitialized) {
			return;
		}

		if (this.initializationPromise) {
			return this.initializationPromise;
		}

		this.initializationPromise = this._doInitialize(options);
		return this.initializationPromise;
	}

	private async _doInitialize(options?: {
		threadCount?: number;
		autoInitThreads?: boolean;
	}): Promise<void> {
		try {
			// Initialize WASM module with lazy loading by default
			this.wasmModule = await loadVectorizer({
				initializeThreads: options?.autoInitThreads ?? false,
				threadCount: options?.threadCount
			});

			// Create a vectorizer instance using the properly exported WasmVectorizer
			this.vectorizer = await createVectorizer();

			this.isInitialized = true;
			console.log('✅ VectorizerService initialized successfully (lazy mode by default)');
		} catch (error) {
			const wasmError: VectorizerError = {
				type: 'unknown',
				message: 'Failed to initialize WASM module',
				details: error instanceof Error ? error.message : String(error)
			};
			throw wasmError;
		}
	}

	/**
	 * Check if the service is initialized
	 */
	getInitializationStatus(): boolean {
		return this.isInitialized;
	}

	/**
	 * Get the underlying WASM vectorizer instance for introspection (dev only)
	 * This is exposed for development and testing purposes
	 */
	getVectorizerInstance(): WasmVectorizer | null {
		return this.vectorizer;
	}

	/**
	 * Helper function to safely call WASM functions that may not exist
	 */
	private safeCall(functionName: string, ...args: any[]): boolean {
		if (!this.vectorizer) {
			console.warn(`[VectorizerService] Cannot call ${functionName}: vectorizer not initialized`);
			return false;
		}
		
		if (typeof this.vectorizer[functionName] !== 'function') {
			console.warn(`[VectorizerService] Function ${functionName} not available in WASM module - skipping`);
			return false;
		}
		
		try {
			this.vectorizer[functionName](...args);
			console.log(`[VectorizerService] Successfully called ${functionName} with args:`, args);
			return true;
		} catch (error) {
			console.error(`[VectorizerService] Error calling ${functionName}:`, error);
			return false;
		}
	}

	/**
	 * Validate configuration before applying to WASM
	 */
	private validateConfigurationForBackend(config: VectorizerConfig): { isValid: boolean; errors: string[] } {
		const errors: string[] = [];

		// Check hand-drawn preset logic
		if (config.hand_drawn_preset === 'none') {
			if (config.variable_weights !== undefined && config.variable_weights > 0) {
				errors.push('Cannot use custom variable weights when hand_drawn_preset is "none"');
			}
			if (config.tremor_strength !== undefined && config.tremor_strength > 0) {
				errors.push('Cannot use custom tremor strength when hand_drawn_preset is "none"');
			}
			if (config.tapering !== undefined && config.tapering > 0) {
				errors.push('Cannot use tapering when hand_drawn_preset is "none"');
			}
		}

		// Backend-specific validation based on available functions
		if (config.backend === 'centerline') {
			// Warn about edge-specific features being used
			if (config.enable_flow_tracing || config.enable_bezier_fitting || config.enable_etf_fdog) {
				errors.push('Flow tracing, Bézier fitting, and ETF/FDoG are not applicable to centerline backend');
			}
		}

		if (config.backend === 'superpixel') {
			// Warn about edge-specific features being used
			if (config.enable_flow_tracing || config.enable_bezier_fitting || config.enable_etf_fdog) {
				errors.push('Flow tracing, Bézier fitting, and ETF/FDoG are not applicable to superpixel backend');
			}
		}

		if (config.backend === 'dots') {
			// Dots backend doesn't really benefit from hand-drawn effects
			if (config.hand_drawn_preset !== 'none') {
				console.warn('[VectorizerService] Hand-drawn effects are not recommended for dots backend');
			}
		}

		return { isValid: errors.length === 0, errors };
	}

	/**
	 * Reset vectorizer configuration to clean state (useful for testing)
	 */
	async resetConfiguration(): Promise<void> {
		if (!this.vectorizer) {
			return;
		}

		try {
			// Reset to basic clean configuration
			this.vectorizer.set_backend('edge');
			this.vectorizer.set_detail(0.4);
			this.vectorizer.set_stroke_width(1.0);
			this.vectorizer.set_noise_filtering(true);
			this.vectorizer.set_multipass(true);
			this.vectorizer.set_hand_drawn_preset('none');
			// Don't set any custom hand-drawn parameters when preset is 'none'
			console.log('[VectorizerService] Configuration reset to clean state');
		} catch (error) {
			console.warn('[VectorizerService] Error resetting configuration:', error);
		}
	}

	/**
	 * Generate smart configuration based on available WASM functions
	 */
	async generateSmartConfiguration(backend: string, preset: 'minimal' | 'enhanced' = 'minimal'): Promise<VectorizerConfig> {
		if (!this.vectorizer) {
			throw new Error('Vectorizer not initialized');
		}

		// Base configuration that should always work
		const config: VectorizerConfig = {
			backend: backend as any,
			detail: preset === 'minimal' ? 0.4 : 0.5,
			stroke_width: preset === 'minimal' ? 1.0 : 1.5,
			noise_filtering: true,
			multipass: backend === 'edge', // Only edge backend uses multipass
			hand_drawn_preset: preset === 'minimal' ? 'none' : 'medium'
		};

		// Add backend-specific features only if available
		if (backend === 'edge') {
			// Edge backend - most functions available
			if (preset === 'enhanced') {
				if (typeof this.vectorizer.set_reverse_pass === 'function') {
					config.reverse_pass = true;
				}
				if (typeof this.vectorizer.set_diagonal_pass === 'function') {
					config.diagonal_pass = true;
				}
				if (typeof this.vectorizer.set_enable_flow_tracing === 'function') {
					config.enable_flow_tracing = true;
				}
				if (typeof this.vectorizer.set_enable_bezier_fitting === 'function') {
					config.enable_bezier_fitting = true;
				}
			}
		} else if (backend === 'dots') {
			// Dots backend - some functions available
			config.hand_drawn_preset = 'none'; // Dots don't benefit from hand-drawn
			if (preset === 'enhanced') {
				if (typeof this.vectorizer.set_dot_density === 'function') {
					config.dot_density = 0.15;
				}
				if (typeof this.vectorizer.set_preserve_colors === 'function') {
					config.preserve_colors = true;
				}
				if (typeof this.vectorizer.set_adaptive_sizing === 'function') {
					config.adaptive_sizing = true;
				}
				if (typeof this.vectorizer.set_background_tolerance === 'function') {
					config.background_tolerance = 0.1;
				}
			}
		} else if (backend === 'centerline') {
			// Centerline backend - most functions missing, use minimal config
			config.hand_drawn_preset = 'none'; // Keep it simple
			if (preset === 'enhanced') {
				// Try to add centerline-specific features if available (currently missing)
				if (typeof this.vectorizer.set_enable_adaptive_threshold === 'function') {
					config.enable_adaptive_threshold = true;
				}
			}
		} else if (backend === 'superpixel') {
			// Superpixel backend - most functions missing, use minimal config
			config.hand_drawn_preset = 'none'; // Keep it simple
			if (preset === 'enhanced') {
				// Try to add superpixel-specific features if available (currently missing)
				if (typeof this.vectorizer.set_num_superpixels === 'function') {
					config.num_superpixels = 100;
				}
			}
		}

		console.log(`[VectorizerService] Generated smart ${preset} configuration for ${backend} backend`, config);
		return config;
	}

	/**
	 * Get list of available backends based on WASM function availability
	 */
	getAvailableBackendsWithStatus(): Array<{ backend: string; status: 'ready' | 'partial' | 'minimal'; description: string }> {
		if (!this.vectorizer) {
			return [
				{ backend: 'edge', status: 'minimal', description: 'Service not initialized' },
				{ backend: 'dots', status: 'minimal', description: 'Service not initialized' },
				{ backend: 'centerline', status: 'minimal', description: 'Service not initialized' },
				{ backend: 'superpixel', status: 'minimal', description: 'Service not initialized' }
			];
		}

		const backends = [];

		// Edge backend analysis
		const edgeFeatures = [
			'set_reverse_pass', 'set_diagonal_pass', 'set_enable_flow_tracing', 
			'set_enable_bezier_fitting', 'set_enable_etf_fdog'
		];
		const edgeAvailable = edgeFeatures.filter(fn => typeof this.vectorizer[fn] === 'function').length;
		backends.push({
			backend: 'edge',
			status: edgeAvailable >= 4 ? 'ready' : edgeAvailable >= 2 ? 'partial' : 'minimal',
			description: `${edgeAvailable}/${edgeFeatures.length} advanced features available`
		});

		// Dots backend analysis
		const dotsFeatures = [
			'set_dot_density', 'set_preserve_colors', 'set_adaptive_sizing', 
			'set_background_tolerance', 'set_dot_size_range'
		];
		const dotsAvailable = dotsFeatures.filter(fn => typeof this.vectorizer[fn] === 'function').length;
		backends.push({
			backend: 'dots',
			status: dotsAvailable >= 4 ? 'ready' : dotsAvailable >= 2 ? 'partial' : 'minimal',
			description: `${dotsAvailable}/${dotsFeatures.length} dot features available`
		});

		// Centerline backend analysis
		const centerlineFeatures = [
			'set_enable_adaptive_threshold', 'set_window_size', 'set_sensitivity_k',
			'set_min_branch_length', 'set_enable_width_modulation', 'set_douglas_peucker_epsilon'
		];
		const centerlineAvailable = centerlineFeatures.filter(fn => typeof this.vectorizer[fn] === 'function').length;
		backends.push({
			backend: 'centerline',
			status: centerlineAvailable >= 3 ? 'ready' : centerlineAvailable >= 1 ? 'partial' : 'minimal',
			description: `${centerlineAvailable}/${centerlineFeatures.length} centerline features available`
		});

		// Superpixel backend analysis
		const superpixelFeatures = [
			'set_num_superpixels', 'set_compactness', 'set_slic_iterations',
			'set_fill_regions', 'set_stroke_regions', 'set_simplify_boundaries', 'set_boundary_epsilon'
		];
		const superpixelAvailable = superpixelFeatures.filter(fn => typeof this.vectorizer[fn] === 'function').length;
		backends.push({
			backend: 'superpixel',
			status: superpixelAvailable >= 4 ? 'ready' : superpixelAvailable >= 2 ? 'partial' : 'minimal',
			description: `${superpixelAvailable}/${superpixelFeatures.length} superpixel features available`
		});

		return backends;
	}

	/**
	 * Get WASM threading and capability information
	 */
	async checkCapabilities(): Promise<WasmCapabilityReport> {
		if (!browser) {
			return {
				threading_supported: false,
				shared_array_buffer_available: false,
				cross_origin_isolated: false,
				hardware_concurrency: 1,
				missing_requirements: ['Browser environment required'],
				recommendations: ['Run in browser environment']
			};
		}

		try {
			// Use the new capabilities function from loader
			const capabilities = await getCapabilities();

			const missingRequirements: string[] = [];
			const recommendations: string[] = [];

			if (!capabilities.crossOriginIsolated) {
				missingRequirements.push('Cross-origin isolation required');
				recommendations.push('Enable COOP/COEP headers');
			}

			if (!capabilities.sharedArrayBuffer) {
				missingRequirements.push('SharedArrayBuffer not available');
				recommendations.push('Ensure secure context and proper headers');
			}

			return {
				threading_supported: capabilities.threading,
				shared_array_buffer_available: capabilities.sharedArrayBuffer,
				cross_origin_isolated: capabilities.crossOriginIsolated,
				hardware_concurrency: navigator.hardwareConcurrency || 1,
				missing_requirements: missingRequirements,
				recommendations: recommendations
			};
		} catch (error) {
			// Fallback to basic check if loader fails
			const crossOriginIsolated =
				typeof window !== 'undefined' ? window.crossOriginIsolated : false;
			const sharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';

			return {
				threading_supported: false,
				shared_array_buffer_available: sharedArrayBuffer,
				cross_origin_isolated: crossOriginIsolated,
				hardware_concurrency: navigator.hardwareConcurrency || 1,
				missing_requirements: ['WASM initialization failed'],
				recommendations: ['Check console for errors']
			};
		}
	}

	/**
	 * Get available backends
	 */
	async getAvailableBackends(): Promise<string[]> {
		return getAvailableBackends();
	}

	/**
	 * Get available presets
	 */
	async getAvailablePresets(): Promise<string[]> {
		return getAvailablePresets();
	}

	/**
	 * Get description for a preset
	 */
	async getPresetDescription(preset: string): Promise<string> {
		await this.initialize();

		if (!this.wasmModule) {
			throw new Error('WASM module not initialized');
		}

		return this.wasmModule.get_preset_description(preset);
	}

	/**
	 * Configure the vectorizer with given settings
	 */
	async configure(config: VectorizerConfig): Promise<void> {
		await this.initialize();

		if (!this.vectorizer) {
			throw new Error('Vectorizer not initialized');
		}

		// Validate configuration before applying
		const validation = this.validateConfigurationForBackend(config);
		if (!validation.isValid) {
			const configError: VectorizerError = {
				type: 'config',
				message: 'Configuration validation failed',
				details: `Validation failed: ${validation.errors.join('. ')}`
			};
			throw configError;
		}

		try {
			// Apply preset if specified
			if (config.preset) {
				this.vectorizer.use_preset(config.preset);
			}

			// Configure backend
			this.vectorizer.set_backend(config.backend);

			// Configure core settings
			this.vectorizer.set_detail(config.detail);
			this.vectorizer.set_stroke_width(config.stroke_width);

			// Configure multi-pass processing
			this.vectorizer.set_multipass(config.multipass);
			this.vectorizer.set_noise_filtering(config.noise_filtering);
			this.vectorizer.set_reverse_pass(config.reverse_pass);
			this.vectorizer.set_diagonal_pass(config.diagonal_pass);

			// Configure artistic effects (hand-drawn aesthetics)
			// Always set hand-drawn preset (required by WASM)
			this.vectorizer.set_hand_drawn_preset(config.hand_drawn_preset);
			
			// CRITICAL: Only set custom hand-drawn parameters if preset is NOT 'none'
			// This prevents the "Hand-drawn preset must be specified" validation error
			if (config.hand_drawn_preset !== 'none') {
				// Set variable weights using actual config value (if function exists and config specifies it)
				if (config.variable_weights !== undefined) {
					this.safeCall('set_custom_variable_weights', config.variable_weights);
				}
				
				// Set tremor using actual config value (if function exists and config specifies it)
				if (config.tremor_strength !== undefined) {
					this.safeCall('set_custom_tremor', config.tremor_strength);
				}
				
				// Set tapering using actual config value (if function exists and config specifies it)
				if (config.tapering !== undefined) {
					this.safeCall('set_tapering', config.tapering);
				}
			}

			// Configure advanced features (only for edge backend)
			if (config.backend === 'edge') {
				this.vectorizer.set_enable_etf_fdog(config.enable_etf_fdog);
				this.vectorizer.set_enable_flow_tracing(config.enable_flow_tracing);
				this.vectorizer.set_enable_bezier_fitting(config.enable_bezier_fitting);
			}

			// Configure backend-specific settings
			if (config.backend === 'dots') {
				// Dots backend configuration (using safeCall for potentially missing functions)
				if (config.dot_density !== undefined) {
					this.safeCall('set_dot_density', config.dot_density);
				}
				if (config.dot_density_threshold !== undefined) {
					this.safeCall('set_dot_density', config.dot_density_threshold);
				}
				if (config.dot_size_range) {
					this.safeCall('set_dot_size_range', config.dot_size_range[0], config.dot_size_range[1]);
				}
				if (config.min_radius !== undefined && config.max_radius !== undefined) {
					this.safeCall('set_dot_size_range', config.min_radius, config.max_radius);
				}
				if (config.preserve_colors !== undefined) {
					this.safeCall('set_preserve_colors', config.preserve_colors);
				}
				if (config.adaptive_sizing !== undefined) {
					this.safeCall('set_adaptive_sizing', config.adaptive_sizing);
				}
				if (config.background_tolerance !== undefined) {
					this.safeCall('set_background_tolerance', config.background_tolerance);
				}
				if (config.poisson_disk_sampling !== undefined) {
					this.safeCall('set_poisson_disk_sampling', config.poisson_disk_sampling);
				}
				if (config.gradient_based_sizing !== undefined) {
					this.safeCall('set_gradient_based_sizing', config.gradient_based_sizing);
				}
			} else if (config.backend === 'centerline') {
				// Centerline backend configuration (using safeCall for missing functions)
				if (config.enable_adaptive_threshold !== undefined) {
					this.safeCall('set_enable_adaptive_threshold', config.enable_adaptive_threshold);
				}
				if (config.window_size !== undefined) {
					this.safeCall('set_window_size', config.window_size);
				}
				if (config.sensitivity_k !== undefined) {
					this.safeCall('set_sensitivity_k', config.sensitivity_k);
				}
				if (config.min_branch_length !== undefined) {
					this.safeCall('set_min_branch_length', config.min_branch_length);
				}
				if (config.enable_width_modulation !== undefined) {
					this.safeCall('set_enable_width_modulation', config.enable_width_modulation);
				}
				if (config.douglas_peucker_epsilon !== undefined) {
					this.safeCall('set_douglas_peucker_epsilon', config.douglas_peucker_epsilon);
				}
			} else if (config.backend === 'superpixel') {
				// Superpixel backend configuration (using safeCall for potentially missing functions)
				if (config.num_superpixels !== undefined) {
					this.safeCall('set_num_superpixels', config.num_superpixels);
				}
				if (config.compactness !== undefined) {
					this.safeCall('set_compactness', config.compactness);
				}
				if (config.slic_iterations !== undefined) {
					this.safeCall('set_slic_iterations', config.slic_iterations);
				}
				if (config.fill_regions !== undefined) {
					this.safeCall('set_fill_regions', config.fill_regions);
				}
				if (config.stroke_regions !== undefined) {
					this.safeCall('set_stroke_regions', config.stroke_regions);
				}
				if (config.simplify_boundaries !== undefined) {
					this.safeCall('set_simplify_boundaries', config.simplify_boundaries);
				}
				if (config.boundary_epsilon !== undefined) {
					this.safeCall('set_boundary_epsilon', config.boundary_epsilon);
				}
			}

			// Configure global output settings (using safeCall for potentially missing functions)
			if (config.svg_precision !== undefined) {
				this.safeCall('set_svg_precision', config.svg_precision);
			}
			if (config.optimize_svg !== undefined) {
				this.safeCall('set_optimize_svg', config.optimize_svg);
			}
			if (config.include_metadata !== undefined) {
				this.safeCall('set_include_metadata', config.include_metadata);
			}

			// Configure performance settings (using safeCall for potentially missing functions)
			if (config.max_processing_time_ms !== undefined) {
				this.safeCall('set_max_processing_time_ms', BigInt(config.max_processing_time_ms));
			}
			if (config.thread_count !== undefined) {
				this.safeCall('set_thread_count', config.thread_count);
			}
			if (config.max_image_size !== undefined) {
				this.safeCall('set_max_image_size', config.max_image_size);
			}

			// Validate configuration
			this.vectorizer.validate_config();
		} catch (error) {
			const configError: VectorizerError = {
				type: 'config',
				message: 'Failed to configure vectorizer',
				details: error instanceof Error ? error.message : String(error)
			};
			throw configError;
		}
	}

	/**
	 * Process an image with the current configuration
	 */
	async processImage(
		imageData: ImageData,
		config: VectorizerConfig,
		onProgress?: (progress: ProcessingProgress) => void
	): Promise<ProcessingResult> {
		await this.initialize();
		await this.configure(config);

		if (!this.vectorizer) {
			throw new Error('Vectorizer not initialized');
		}

		try {
			const startTime = performance.now();
			let svg: string;

			if (onProgress) {
				// Use progress callback version
				const progressCallback = (stage: string, progress: number, elapsed: number) => {
					const progressData: ProcessingProgress = {
						stage,
						progress: Math.round(progress * 100),
						elapsed_ms: elapsed,
						estimated_remaining_ms: elapsed > 0 ? (elapsed / progress) * (1 - progress) : undefined
					};
					onProgress(progressData);
				};

				svg = this.vectorizer.vectorize_with_progress(imageData, progressCallback);
			} else {
				// Standard vectorization
				svg = this.vectorizer.vectorize(imageData);
			}

			const endTime = performance.now();
			const processingTime = endTime - startTime;

			const result: ProcessingResult = {
				svg,
				processing_time_ms: processingTime,
				config_used: config,
				statistics: {
					input_dimensions: [imageData.width, imageData.height],
					paths_generated: this._countSvgPaths(svg),
					compression_ratio: this._calculateCompressionRatio(imageData, svg)
				}
			};

			// Add dots count for dots backend
			if (config.backend === 'dots') {
				result.statistics!.dots_generated = this._countSvgDots(svg);
			}

			return result;
		} catch (error) {
			const processingError: VectorizerError = {
				type: 'processing',
				message: 'Failed to process image',
				details: error instanceof Error ? error.message : String(error)
			};
			throw processingError;
		}
	}

	/**
	 * Export current configuration
	 */
	async exportConfig(): Promise<string> {
		await this.initialize();

		if (!this.vectorizer) {
			throw new Error('Vectorizer not initialized');
		}

		return this.vectorizer.export_config();
	}

	/**
	 * Import configuration from JSON string
	 */
	async importConfig(configJson: string): Promise<void> {
		await this.initialize();

		if (!this.vectorizer) {
			throw new Error('Vectorizer not initialized');
		}

		try {
			this.vectorizer.import_config(configJson);
		} catch (error) {
			const configError: VectorizerError = {
				type: 'config',
				message: 'Failed to import configuration',
				details: error instanceof Error ? error.message : String(error)
			};
			throw configError;
		}
	}

	/**
	 * Initialize thread pool separately (for lazy loading)
	 * Returns true if successful, false otherwise
	 */
	async initializeThreadPool(threadCount?: number): Promise<boolean> {
		if (!browser) {
			return false; // No-op in SSR
		}

		if (!this.isInitialized) {
			throw new Error('WASM module must be initialized first');
		}

		try {
			const success = await initThreads(threadCount);
			console.log(
				`[VectorizerService] Thread pool initialization ${success ? 'succeeded' : 'failed'}`
			);
			return success;
		} catch (error) {
			console.error('[VectorizerService] Thread pool initialization error:', error);
			return false;
		}
	}

	/**
	 * Get thread pool status
	 */
	getThreadPoolStatus(): {
		initialized: boolean;
		threadCount: number;
		maxThreads: number;
		recommendedThreads: number;
	} {
		return {
			initialized: isThreadPoolInitialized(),
			threadCount: getCurrentThreadCount(),
			maxThreads: getMaxThreads(),
			recommendedThreads: getRecommendedThreadCount()
		};
	}

	/**
	 * Abort current processing operation
	 */
	abortProcessing(): void {
		if (this.vectorizer) {
			try {
				// If the WASM module has an abort method, call it
				if (typeof this.vectorizer.abort_processing === 'function') {
					this.vectorizer.abort_processing();
					console.log('[VectorizerService] Processing aborted via WASM');
				} else {
					console.log('[VectorizerService] WASM abort method not available, relying on timeout');
				}
			} catch (error) {
				console.warn('[VectorizerService] Error during abort:', error);
			}
		}
	}

	/**
	 * Cleanup resources with forced stop
	 */
	cleanup(): void {
		// First try to abort any ongoing processing
		this.abortProcessing();

		if (this.vectorizer) {
			try {
				// Give the WASM module a chance to clean up
				if (typeof this.vectorizer.cleanup === 'function') {
					this.vectorizer.cleanup();
				}
			} catch (error) {
				console.warn('[VectorizerService] Error during WASM cleanup:', error);
			}
			// Note: WASM objects are garbage collected automatically
			this.vectorizer = null;
		}
		
		this.isInitialized = false;
		this.initializationPromise = null;
		console.log('[VectorizerService] Cleanup completed');
	}

	// Helper methods
	private _countSvgPaths(svg: string): number {
		const pathMatches = svg.match(/<path[^>]*>/g);
		return pathMatches ? pathMatches.length : 0;
	}

	private _countSvgDots(svg: string): number {
		const circleMatches = svg.match(/<circle[^>]*>/g);
		const ellipseMatches = svg.match(/<ellipse[^>]*>/g);
		return (
			(circleMatches ? circleMatches.length : 0) + (ellipseMatches ? ellipseMatches.length : 0)
		);
	}

	private _calculateCompressionRatio(imageData: ImageData, svg: string): number {
		const imageSize = imageData.width * imageData.height * 4; // 4 bytes per pixel (RGBA)
		const svgSize = new TextEncoder().encode(svg).length;
		return svgSize / imageSize;
	}
}

// Export singleton instance
export const vectorizerService = VectorizerService.getInstance();
