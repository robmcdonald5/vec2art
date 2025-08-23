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
import { DEFAULT_CONFIG } from '$lib/types/vectorizer';

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
	getRecommendedThreadCount,
	resizeThreadPool,
	cleanupThreadPool,
	optimizeThreadCount
} from '$lib/wasm/loader';

// Import performance monitoring
import {
	performanceMonitor,
	type PerformanceMode,
	shouldUseProgressiveProcessing
} from '$lib/utils/performance-monitor';

// Import Web Worker service for safe WASM execution
import { wasmWorkerService } from './wasm-worker-service';

// Dynamic import type for WASM module
type WasmModule = any; // We'll type this properly after loading
type WasmVectorizer = any;

export class VectorizerService {
	private static instance: VectorizerService | null = null;
	private wasmModule: WasmModule | null = null;
	private vectorizer: WasmVectorizer | null = null;
	private isInitialized = false;
	private initializationPromise: Promise<void> | null = null;
	private isProcessing = false;
	private abortController: AbortController | null = null;
	private currentPerformanceMode: PerformanceMode = 'balanced';
	
	// Failure detection and recovery
	private failureCount = 0;
	private lastFailureTime = 0;
	private maxFailureCount = 3;
	private failureResetTime = 60000; // Reset failure count after 1 minute

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
			console.warn(
				`[VectorizerService] Function ${functionName} not available in WASM module - skipping`
			);
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
	 * Check if an error is critical and requires WASM reinitialization
	 */
	private isCriticalError(error: any): boolean {
		const errorMessage = error instanceof Error ? error.message : String(error);
		const criticalErrors = [
			'unreachable executed',
			'RuntimeError',
			'wasm is not instantiated',
			'WebAssembly.instantiate',
			'memory out of bounds',
			'recursive use of an object',
			'already borrowed',
			'index out of bounds'
		];
		
		return criticalErrors.some(criticalError => 
			errorMessage.toLowerCase().includes(criticalError.toLowerCase())
		);
	}

	/**
	 * Handle failure and attempt recovery if needed
	 */
	private async handleFailure(error: any): Promise<void> {
		const now = Date.now();
		
		// Reset failure count if enough time has passed
		if (now - this.lastFailureTime > this.failureResetTime) {
			this.failureCount = 0;
		}
		
		this.failureCount++;
		this.lastFailureTime = now;
		
		console.warn(`[VectorizerService] Failure ${this.failureCount}/${this.maxFailureCount}:`, error);
		
		// If this is a critical error and we haven't exceeded max failures, try to recover
		if (this.isCriticalError(error) && this.failureCount <= this.maxFailureCount) {
			console.log('[VectorizerService] Attempting automatic recovery...');
			
			try {
				// Mark as uninitialized
				this.isInitialized = false;
				this.initializationPromise = null;
				this.vectorizer = null;
				this.wasmModule = null;
				
				// Wait a bit before reinitializing
				await new Promise(resolve => setTimeout(resolve, 1000));
				
				// Reinitialize WASM module
				await this.initialize();
				
				console.log('[VectorizerService] ✅ Automatic recovery successful');
				
				// Reset failure count on successful recovery
				this.failureCount = 0;
				
			} catch (recoveryError) {
				console.error('[VectorizerService] ❌ Automatic recovery failed:', recoveryError);
				// Don't throw here, let the original error be handled normally
			}
		}
	}

	/**
	 * Validate configuration before applying to WASM
	 */
	private validateConfigurationForBackend(config: VectorizerConfig): {
		isValid: boolean;
		errors: string[];
	} {
		const errors: string[] = [];

		// Check hand-drawn preset logic - WASM requires preset to be set if using custom effects
		const hasHandDrawnEffects =
			(config.variable_weights !== undefined && config.variable_weights > 0) ||
			(config.tremor_strength !== undefined && config.tremor_strength > 0) ||
			(config.tapering !== undefined && config.tapering > 0);

		if (hasHandDrawnEffects && config.hand_drawn_preset === 'none') {
			// Auto-fix: Set a default hand-drawn preset when custom effects are used
			console.warn(
				'[VectorizerService] Auto-setting hand-drawn preset to "subtle" due to custom hand-drawn effects'
			);
			// We'll fix this in the applyConfiguration method instead of erroring
		}

		// Flow tracing validation - ETF/FDoG requires flow tracing to be enabled
		if (
			config.enable_flow_tracing &&
			(config.enable_bezier_fitting || config.enable_etf_fdog) &&
			config.backend === 'edge'
		) {
			// Flow tracing is enabled, this is valid
		} else if (
			(config.enable_bezier_fitting || config.enable_etf_fdog) &&
			config.backend === 'edge' &&
			!config.enable_flow_tracing
		) {
			// Auto-fix: Enable flow tracing when ETF/FDoG or Bezier fitting is requested
			console.warn(
				'[VectorizerService] Auto-enabling flow tracing due to ETF/FDoG or Bezier fitting being enabled'
			);
			// We'll fix this in the applyConfiguration method instead of erroring
		}

		// Backend-specific validation
		if (config.backend === 'centerline') {
			// Warn about edge-specific features being used (but don't error)
			if (config.enable_flow_tracing || config.enable_bezier_fitting || config.enable_etf_fdog) {
				console.warn(
					'[VectorizerService] Flow tracing, Bézier fitting, and ETF/FDoG are not applicable to centerline backend'
				);
			}
		}

		if (config.backend === 'superpixel') {
			// Warn about edge-specific features being used (but don't error)
			if (config.enable_flow_tracing || config.enable_bezier_fitting || config.enable_etf_fdog) {
				console.warn(
					'[VectorizerService] Flow tracing, Bézier fitting, and ETF/FDoG are not applicable to superpixel backend'
				);
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
			// Reset to proper default configuration
			this.vectorizer.set_backend(DEFAULT_CONFIG.backend);
			this.vectorizer.set_detail(DEFAULT_CONFIG.detail);
			this.vectorizer.set_stroke_width(DEFAULT_CONFIG.stroke_width);
			this.vectorizer.set_noise_filtering(DEFAULT_CONFIG.noise_filtering);
			this.vectorizer.set_multipass(DEFAULT_CONFIG.multipass);
			this.vectorizer.set_hand_drawn_preset(DEFAULT_CONFIG.hand_drawn_preset);
			// Don't set any custom hand-drawn parameters when preset is 'none'
			console.log('[VectorizerService] Configuration reset to clean state');
		} catch (error) {
			console.warn('[VectorizerService] Error resetting configuration:', error);
		}
	}

	/**
	 * Generate smart configuration based on available WASM functions
	 */
	async generateSmartConfiguration(
		backend: string,
		preset: 'minimal' | 'enhanced' = 'minimal'
	): Promise<VectorizerConfig> {
		if (!this.vectorizer) {
			throw new Error('Vectorizer not initialized');
		}

		// Base configuration that should always work
		const config: VectorizerConfig = {
			...DEFAULT_CONFIG,
			backend: backend as any,
			detail: preset === 'minimal' ? DEFAULT_CONFIG.detail * 0.5 : DEFAULT_CONFIG.detail,
			stroke_width: preset === 'minimal' ? DEFAULT_CONFIG.stroke_width * 0.67 : DEFAULT_CONFIG.stroke_width,
			multipass: backend === 'edge', // Only edge backend uses multipass
			pass_count: 1,
			multipass_mode: 'auto',
			hand_drawn_preset: preset === 'minimal' ? 'none' : DEFAULT_CONFIG.hand_drawn_preset,
			// Required boolean fields
			reverse_pass: false,
			diagonal_pass: false,
			enable_etf_fdog: false,
			enable_flow_tracing: false,
			enable_bezier_fitting: false,
			// Required numeric fields
			variable_weights: 0.0,
			tremor_strength: 0.0,
			tapering: 0.0
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

		console.log(
			`[VectorizerService] Generated smart ${preset} configuration for ${backend} backend`,
			config
		);
		return config;
	}

	/**
	 * Get list of available backends based on WASM function availability
	 */
	getAvailableBackendsWithStatus(): Array<{
		backend: string;
		status: 'ready' | 'partial' | 'minimal';
		description: string;
	}> {
		if (!this.vectorizer) {
			return [
				{ backend: 'edge', status: 'minimal', description: 'Service not initialized' },
				{ backend: 'dots', status: 'minimal', description: 'Service not initialized' },
				{ backend: 'centerline', status: 'minimal', description: 'Service not initialized' },
				{ backend: 'superpixel', status: 'minimal', description: 'Service not initialized' }
			];
		}

		const backends: Array<{
			backend: string;
			status: 'ready' | 'partial' | 'minimal';
			description: string;
		}> = [];

		// Edge backend analysis
		const edgeFeatures = [
			'set_reverse_pass',
			'set_diagonal_pass',
			'set_enable_flow_tracing',
			'set_enable_bezier_fitting',
			'set_enable_etf_fdog'
		];
		const edgeAvailable = edgeFeatures.filter(
			(fn) => typeof this.vectorizer[fn] === 'function'
		).length;
		backends.push({
			backend: 'edge',
			status: edgeAvailable >= 4 ? 'ready' : edgeAvailable >= 2 ? 'partial' : 'minimal',
			description: `${edgeAvailable}/${edgeFeatures.length} advanced features available`
		});

		// Dots backend analysis
		const dotsFeatures = [
			'set_dot_density',
			'set_preserve_colors',
			'set_adaptive_sizing',
			'set_background_tolerance',
			'set_dot_size_range'
		];
		const dotsAvailable = dotsFeatures.filter(
			(fn) => typeof this.vectorizer[fn] === 'function'
		).length;
		backends.push({
			backend: 'dots',
			status: dotsAvailable >= 4 ? 'ready' : dotsAvailable >= 2 ? 'partial' : 'minimal',
			description: `${dotsAvailable}/${dotsFeatures.length} dot features available`
		});

		// Centerline backend analysis
		const centerlineFeatures = [
			'set_enable_adaptive_threshold',
			'set_window_size',
			'set_sensitivity_k',
			'set_min_branch_length',
			'set_enable_width_modulation',
			'set_douglas_peucker_epsilon'
		];
		const centerlineAvailable = centerlineFeatures.filter(
			(fn) => typeof this.vectorizer[fn] === 'function'
		).length;
		backends.push({
			backend: 'centerline',
			status: centerlineAvailable >= 3 ? 'ready' : centerlineAvailable >= 1 ? 'partial' : 'minimal',
			description: `${centerlineAvailable}/${centerlineFeatures.length} centerline features available`
		});

		// Superpixel backend analysis
		const superpixelFeatures = [
			'set_num_superpixels',
			'set_compactness',
			'set_slic_iterations',
			'set_fill_regions',
			'set_stroke_regions',
			'set_simplify_boundaries',
			'set_boundary_epsilon'
		];
		const superpixelAvailable = superpixelFeatures.filter(
			(fn) => typeof this.vectorizer[fn] === 'function'
		).length;
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

		// Force cleanup of any previous state to prevent object aliasing
		try {
			if (typeof this.vectorizer.cleanup_state === 'function') {
				this.vectorizer.cleanup_state();
			}
		} catch (e) {
			// Ignore cleanup errors as function may not exist
		}

		// Create a deep copy of the config to prevent object reuse issues
		const workingConfig = JSON.parse(JSON.stringify(config));

		// Auto-fix: Set hand-drawn preset if custom effects are used
		const hasHandDrawnEffects =
			(workingConfig.variable_weights !== undefined && workingConfig.variable_weights > 0) ||
			(workingConfig.tremor_strength !== undefined && workingConfig.tremor_strength > 0) ||
			(workingConfig.tapering !== undefined && workingConfig.tapering > 0);

		if (hasHandDrawnEffects && workingConfig.hand_drawn_preset === 'none') {
			console.warn(
				'[VectorizerService] Auto-setting hand-drawn preset to "subtle" due to custom hand-drawn effects'
			);
			workingConfig.hand_drawn_preset = 'subtle';
		}

		// Auto-fix: Enable flow tracing if ETF/FDoG or Bezier fitting is requested
		if (
			(workingConfig.enable_bezier_fitting || workingConfig.enable_etf_fdog) &&
			workingConfig.backend === 'edge' &&
			!workingConfig.enable_flow_tracing
		) {
			console.warn(
				'[VectorizerService] Auto-enabling flow tracing due to ETF/FDoG or Bezier fitting being enabled'
			);
			workingConfig.enable_flow_tracing = true;
		}

		// Validate configuration after auto-fixes
		const validation = this.validateConfigurationForBackend(workingConfig);
		if (!validation.isValid) {
			const configError: VectorizerError = {
				type: 'config',
				message: 'Configuration validation failed',
				details: `Validation failed: ${validation.errors.join('. ')}`
			};
			throw configError;
		}

		try {
			// CRITICAL: Set backend FIRST before any other configuration
			// This ensures backend-specific validation happens correctly
			this.vectorizer.set_backend(workingConfig.backend);

			// Apply preset if specified
			if (workingConfig.preset) {
				this.vectorizer.use_preset(workingConfig.preset);
			}

			// Configure core settings
			// Invert detail level: UI shows 0.1=Simple, 1.0=Detailed, but backend expects inverse
			// (higher backend values = more blur = less detail, so we invert for intuitive UI)
			const invertedDetail = 1.0 - workingConfig.detail;
			this.vectorizer.set_detail(invertedDetail);
			this.vectorizer.set_stroke_width(workingConfig.stroke_width);

			// Configure multi-pass processing
			this.vectorizer.set_multipass(workingConfig.multipass);
			this.vectorizer.set_noise_filtering(workingConfig.noise_filtering);
			this.vectorizer.set_reverse_pass(workingConfig.reverse_pass);
			this.vectorizer.set_diagonal_pass(workingConfig.diagonal_pass);

			// Configure multipass detail levels if specified (also invert these)
			if (workingConfig.conservative_detail !== undefined) {
				this.safeCall('set_conservative_detail', 1.0 - workingConfig.conservative_detail);
			}
			if (workingConfig.aggressive_detail !== undefined) {
				this.safeCall('set_aggressive_detail', 1.0 - workingConfig.aggressive_detail);
			}

			// Configure directional strength threshold
			if (workingConfig.directional_strength_threshold !== undefined) {
				this.safeCall('set_directional_strength_threshold', workingConfig.directional_strength_threshold);
			}

			// Configure artistic effects (hand-drawn aesthetics)
			// Always set hand-drawn preset (required by WASM)
			this.vectorizer.set_hand_drawn_preset(workingConfig.hand_drawn_preset);

			// CRITICAL: Only set custom hand-drawn parameters if preset is NOT 'none'
			// This prevents the "Hand-drawn preset must be specified" validation error
			if (workingConfig.hand_drawn_preset !== 'none') {
				// Set variable weights using actual config value (if function exists and config specifies it)
				if (workingConfig.variable_weights !== undefined) {
					this.safeCall('set_custom_variable_weights', workingConfig.variable_weights);
				}

				// Set tremor using actual config value (if function exists and config specifies it)
				if (workingConfig.tremor_strength !== undefined) {
					this.safeCall('set_custom_tremor', workingConfig.tremor_strength);
				}

				// Set tapering using actual config value (if function exists and config specifies it)
				if (workingConfig.tapering !== undefined) {
					this.safeCall('set_custom_tapering', workingConfig.tapering);
				}
			}

			// Configure advanced features (only for edge backend)
			if (workingConfig.backend === 'edge') {
				// Handle dependency chain: Bezier -> Flow -> ETF/FDoG
				// If Bezier is enabled, it requires flow tracing
				// If flow tracing is enabled, it requires ETF/FDoG
				let etfFdog = workingConfig.enable_etf_fdog;
				let flowTracing = workingConfig.enable_flow_tracing;
				let bezierFitting = workingConfig.enable_bezier_fitting;
				
				// Auto-enable dependencies
				if (bezierFitting && !flowTracing) {
					console.log('[VectorizerService] Auto-enabling flow tracing for Bezier fitting');
					flowTracing = true;
				}
				if (flowTracing && !etfFdog) {
					console.log('[VectorizerService] Auto-enabling ETF/FDoG for flow tracing');
					etfFdog = true;
				}
				
				// Apply in correct order
				this.vectorizer.set_enable_etf_fdog(etfFdog);
				this.vectorizer.set_enable_flow_tracing(flowTracing);
				this.vectorizer.set_enable_bezier_fitting(bezierFitting);
			} else {
				// Explicitly disable edge-only features for other backends
				this.vectorizer.set_enable_etf_fdog(false);
				this.vectorizer.set_enable_flow_tracing(false);
				this.vectorizer.set_enable_bezier_fitting(false);
			}

			// Configure backend-specific settings
			if (workingConfig.backend === 'dots') {
				// Dots backend configuration (using safeCall for potentially missing functions)
				if (workingConfig.dot_density !== undefined) {
					this.safeCall('set_dot_density', workingConfig.dot_density);
				}
				if (workingConfig.dot_density_threshold !== undefined) {
					this.safeCall('set_dot_density', workingConfig.dot_density_threshold);
				}
				if (workingConfig.dot_size_range) {
					this.safeCall(
						'set_dot_size_range',
						workingConfig.dot_size_range[0],
						workingConfig.dot_size_range[1]
					);
				}
				if (workingConfig.min_radius !== undefined && workingConfig.max_radius !== undefined) {
					this.safeCall('set_dot_size_range', workingConfig.min_radius, workingConfig.max_radius);
				}
				if (workingConfig.preserve_colors !== undefined) {
					this.safeCall('set_preserve_colors', workingConfig.preserve_colors);
				}
				if (workingConfig.adaptive_sizing !== undefined) {
					this.safeCall('set_adaptive_sizing', workingConfig.adaptive_sizing);
				}
				if (workingConfig.background_tolerance !== undefined) {
					this.safeCall('set_background_tolerance', workingConfig.background_tolerance);
				}
				if (workingConfig.poisson_disk_sampling !== undefined) {
					this.safeCall('set_poisson_disk_sampling', workingConfig.poisson_disk_sampling);
				}
				if (workingConfig.gradient_based_sizing !== undefined) {
					this.safeCall('set_gradient_based_sizing', workingConfig.gradient_based_sizing);
				}
			} else if (workingConfig.backend === 'centerline') {
				// Centerline backend configuration (using safeCall for missing functions)
				if (workingConfig.enable_adaptive_threshold !== undefined) {
					this.safeCall('set_enable_adaptive_threshold', workingConfig.enable_adaptive_threshold);
				}
				if (workingConfig.window_size !== undefined) {
					this.safeCall('set_window_size', workingConfig.window_size);
				}
				if (workingConfig.sensitivity_k !== undefined) {
					this.safeCall('set_sensitivity_k', workingConfig.sensitivity_k);
				}
				if (workingConfig.min_branch_length !== undefined) {
					this.safeCall('set_min_branch_length', workingConfig.min_branch_length);
				}
				if (workingConfig.enable_width_modulation !== undefined) {
					this.safeCall('set_enable_width_modulation', workingConfig.enable_width_modulation);
				}
				if (workingConfig.douglas_peucker_epsilon !== undefined) {
					this.safeCall('set_douglas_peucker_epsilon', workingConfig.douglas_peucker_epsilon);
				}
			} else if (workingConfig.backend === 'superpixel') {
				// Superpixel backend configuration (using safeCall for potentially missing functions)
				if (workingConfig.num_superpixels !== undefined) {
					this.safeCall('set_num_superpixels', workingConfig.num_superpixels);
				}
				if (workingConfig.compactness !== undefined) {
					this.safeCall('set_compactness', workingConfig.compactness);
				}
				if (workingConfig.slic_iterations !== undefined) {
					this.safeCall('set_slic_iterations', workingConfig.slic_iterations);
				}
				if (workingConfig.fill_regions !== undefined) {
					this.safeCall('set_fill_regions', workingConfig.fill_regions);
				}
				if (workingConfig.stroke_regions !== undefined) {
					this.safeCall('set_stroke_regions', workingConfig.stroke_regions);
				}
				if (workingConfig.simplify_boundaries !== undefined) {
					this.safeCall('set_simplify_boundaries', workingConfig.simplify_boundaries);
				}
				if (workingConfig.boundary_epsilon !== undefined) {
					this.safeCall('set_boundary_epsilon', workingConfig.boundary_epsilon);
				}
			}

			// Configure global output settings (using safeCall for potentially missing functions)
			if (workingConfig.svg_precision !== undefined) {
				this.safeCall('set_svg_precision', workingConfig.svg_precision);
			}
			if (workingConfig.optimize_svg !== undefined) {
				// Use safeCall since this function might not exist in WASM
				this.safeCall('set_optimize_svg', workingConfig.optimize_svg);
			}
			if (workingConfig.include_metadata !== undefined) {
				// Use safeCall since this function might not exist in WASM
				this.safeCall('set_include_metadata', workingConfig.include_metadata);
			}

			// Configure performance settings (using safeCall for potentially missing functions)
			if (workingConfig.max_processing_time_ms !== undefined) {
				this.safeCall('set_max_processing_time_ms', BigInt(workingConfig.max_processing_time_ms));
			}
			if (workingConfig.thread_count !== undefined) {
				this.safeCall('set_thread_count', workingConfig.thread_count);
			}
			if (workingConfig.max_image_size !== undefined) {
				this.safeCall('set_max_image_size', workingConfig.max_image_size);
			}

			// Validate configuration
			this.vectorizer.validate_config();
		} catch (error) {
			// Handle critical configuration errors with recovery
			if (this.isCriticalError(error)) {
				await this.handleFailure(error);
			}

			const configError: VectorizerError = {
				type: 'config',
				message: 'Failed to configure vectorizer',
				details: error instanceof Error ? error.message : String(error)
			};
			throw configError;
		}
	}

	/**
	 * Process an image with progressive processing and performance monitoring
	 */
	async processImage(
		imageData: ImageData,
		config: VectorizerConfig,
		onProgress?: (progress: ProcessingProgress) => void
	): Promise<ProcessingResult> {
		// Use Web Worker service for processing to prevent main thread blocking
		// This runs WASM in a separate thread, preventing browser freezing
		console.log('[VectorizerService] Processing via Web Worker for thread safety');
		
		if (this.isProcessing) {
			throw new Error('Another processing operation is already in progress');
		}

		this.isProcessing = true;
		this.abortController = new AbortController();

		try {
			const startTime = performance.now();

			// Record processing start for performance monitoring
			performanceMonitor.recordProcessingTime(0);

			// Process via Web Worker (runs WASM off main thread)
			// Pass the complete ImageData object to maintain structure
			const result = await wasmWorkerService.processImage(
				imageData,
				config,
				onProgress
			);

			const endTime = performance.now();
			const processingTime = endTime - startTime;

			// Record processing time for performance monitoring
			performanceMonitor.recordProcessingTime(processingTime);

			// Enhance result with additional statistics
			result.processing_time_ms = processingTime;
			result.config_used = config;
			
			if (!result.statistics) {
				result.statistics = {
					input_dimensions: [imageData.width, imageData.height] as [number, number],
					paths_generated: this._countSvgPaths(result.svg),
					compression_ratio: this._calculateCompressionRatio(imageData, result.svg)
				};
			}

			// Add dots count for dots backend
			if (config.backend === 'dots') {
				result.statistics.dots_generated = this._countSvgDots(result.svg);
			}

			return result;
		} catch (error) {
			if (this.abortController?.signal.aborted) {
				const abortError: VectorizerError = {
					type: 'processing',
					message: 'Processing was aborted',
					details: 'User requested abort or system performance optimization'
				};
				throw abortError;
			}

			// Handle failure and attempt recovery if critical error
			await this.handleFailure(error);

			const processingError: VectorizerError = {
				type: 'processing',
				message: 'Failed to process image',
				details: error instanceof Error ? error.message : String(error)
			};
			throw processingError;
		} finally {
			this.isProcessing = false;
			this.abortController = null;
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
	 * Set performance mode for processing optimization
	 */
	setPerformanceMode(mode: PerformanceMode): void {
		this.currentPerformanceMode = mode;
		console.log(`[VectorizerService] Performance mode set to: ${mode}`);
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
	 * Resize thread pool dynamically
	 */
	async resizeThreadPool(newThreadCount: number): Promise<boolean> {
		if (!browser || !this.isInitialized) {
			return false;
		}

		try {
			const success = await resizeThreadPool(newThreadCount);
			console.log(
				`[VectorizerService] Thread pool resize ${success ? 'succeeded' : 'failed'} (${newThreadCount} threads)`
			);
			return success;
		} catch (error) {
			console.error('[VectorizerService] Thread pool resize error:', error);
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
		// Signal abort to current operation
		if (this.abortController) {
			this.abortController.abort();
		}

		if (this.vectorizer) {
			try {
				// If the WASM module has an abort method, call it
				if (typeof this.vectorizer.abort_processing === 'function') {
					this.vectorizer.abort_processing();
					console.log('[VectorizerService] Processing aborted via WASM');
				} else {
					console.log(
						'[VectorizerService] WASM abort method not available, using signal-based abort'
					);
				}
			} catch (error) {
				console.warn('[VectorizerService] Error during abort:', error);
			}
		}

		this.isProcessing = false;
	}

	/**
	 * Process with progressive callback (for WASM with progress support)
	 */
	private async _processWithProgressiveCallback(
		imageData: ImageData,
		progressCallback: (stage: string, progress: number, elapsed: number) => Promise<void>,
		useProgressive: boolean
	): Promise<string> {
		return new Promise((resolve, reject) => {
			try {
				// Wrap the progress callback to handle async operations
				const syncProgressCallback = (stage: string, progress: number, elapsed: number) => {
					progressCallback(stage, progress, elapsed).catch((error) => {
						if (error.message === 'Processing aborted') {
							reject(error);
						} else {
							console.warn('[VectorizerService] Progress callback error:', error);
						}
					});
				};

				const svg = this.vectorizer!.vectorize_with_progress(imageData, syncProgressCallback);
				resolve(svg);
			} catch (error) {
				reject(error);
			}
		});
	}

	/**
	 * Process with simulated progress (for WASM without progress support)
	 */
	private async _processWithSimulatedProgress(
		imageData: ImageData,
		progressCallback: (stage: string, progress: number, elapsed: number) => Promise<void>,
		useProgressive: boolean
	): Promise<string> {
		const startTime = performance.now();

		// Simulate progress stages
		const stages = [
			{ stage: 'preprocessing', duration: 0.1 },
			{ stage: 'edge_detection', duration: 0.3 },
			{ stage: 'path_generation', duration: 0.4 },
			{ stage: 'optimization', duration: 0.2 }
		];

		let totalProgress = 0;

		for (const stageInfo of stages) {
			const stageStart = performance.now();
			const stageDuration = 100; // Simulated stage duration

			for (let i = 0; i <= 10; i++) {
				const stageProgress = i / 10;
				const currentStageProgress = stageProgress * stageInfo.duration;
				const overallProgress = totalProgress + currentStageProgress;
				const elapsed = performance.now() - startTime;

				await progressCallback(stageInfo.stage, overallProgress, elapsed);

				if (useProgressive) {
					await new Promise((resolve) => setTimeout(resolve, stageDuration / 10));
				}
			}

			totalProgress += stageInfo.duration;
		}

		// Actually process the image
		const svg = this.vectorizer!.vectorize(imageData);

		// Final progress
		const elapsed = performance.now() - startTime;
		await progressCallback('complete', 1.0, elapsed);

		return svg;
	}

	/**
	 * Process with yielding (no progress callback)
	 */
	private async _processWithYielding(
		imageData: ImageData,
		yieldFunction: () => Promise<void>
	): Promise<string> {
		// For now, we just yield before processing
		// Future WASM versions could support incremental processing
		await yieldFunction();

		const svg = this.vectorizer!.vectorize(imageData);

		await yieldFunction();

		return svg;
	}

	/**
	 * Cleanup resources with forced stop
	 */
	cleanup(): void {
		// First try to abort any ongoing processing
		this.abortProcessing();

		// Stop performance monitoring
		performanceMonitor.stopMonitoring();

		// Cleanup thread pool
		if (isThreadPoolInitialized()) {
			cleanupThreadPool().catch(console.warn);
		}

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
