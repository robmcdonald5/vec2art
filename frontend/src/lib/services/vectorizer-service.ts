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

			// Configure artistic effects
			if (config.hand_drawn_style) {
				this.vectorizer.set_hand_drawn_preset('subtle');
			}
			if (config.variable_weights) {
				this.vectorizer.set_custom_variable_weights(0.5);
			}
			if (config.tremor_effects) {
				this.vectorizer.set_custom_tremor(0.2);
			}

			this.vectorizer.set_enable_etf_fdog(config.enable_etf_fdog);
			this.vectorizer.set_enable_flow_tracing(config.enable_flow_tracing);
			this.vectorizer.set_enable_bezier_fitting(config.enable_bezier_fitting);

			// Configure dots-specific settings
			if (config.backend === 'dots') {
				if (config.dot_density !== undefined) {
					this.vectorizer.set_dot_density(config.dot_density);
				}
				if (config.dot_size_range) {
					this.vectorizer.set_dot_size_range(config.dot_size_range[0], config.dot_size_range[1]);
				}
				if (config.preserve_colors !== undefined) {
					this.vectorizer.set_preserve_colors(config.preserve_colors);
				}
				if (config.adaptive_sizing !== undefined) {
					this.vectorizer.set_adaptive_sizing(config.adaptive_sizing);
				}
				if (config.background_tolerance !== undefined) {
					this.vectorizer.set_background_tolerance(config.background_tolerance);
				}
			}

			// Configure performance settings
			if (config.max_processing_time_ms !== undefined) {
				this.vectorizer.set_max_processing_time_ms(BigInt(config.max_processing_time_ms));
			}
			if (config.thread_count !== undefined) {
				this.vectorizer.set_thread_count(config.thread_count);
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
	 * Cleanup resources
	 */
	cleanup(): void {
		if (this.vectorizer) {
			// Note: WASM objects are garbage collected automatically
			this.vectorizer = null;
		}
		this.isInitialized = false;
		this.initializationPromise = null;
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
