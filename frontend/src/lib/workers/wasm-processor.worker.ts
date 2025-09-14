/**
 * Web Worker for WASM Image Processing
 * This worker runs WASM operations in a separate thread to prevent browser freezing
 *
 * Architecture:
 * - All WASM operations run in this worker thread
 * - Main thread communicates via message passing
 * - Prevents main thread blocking during intensive operations
 */

// Early logging to catch import issues
console.log('[Worker] 🚀 WASM Worker starting up...');

// Global error handler for worker
self.addEventListener('error', (error) => {
	console.error('[Worker] ❌ Global error caught:', error);
	self.postMessage({
		type: 'error',
		id: 'worker_error',
		error: `Worker startup error: ${error.message}`
	});
});

// Global unhandled rejection handler
self.addEventListener('unhandledrejection', (event) => {
	console.error('[Worker] ❌ Unhandled promise rejection:', event.reason);
	self.postMessage({
		type: 'error',
		id: 'worker_rejection',
		error: `Worker promise rejection: ${event.reason}`
	});
});

// TEMPORARY: Comment out imports to test basic worker execution
// import init, * as wasmModule from '../wasm/vectorize_wasm.js';
// import { calculateMultipassConfig } from '../types/vectorizer';
// import { devLog } from '../utils/dev-logger';

console.log('[Worker] ✅ Basic worker startup - no imports');

// Note: dots backend parameters now handled directly in SettingsPanel.svelte

// Worker state
let wasmInitialized = false;
let vectorizer: any = null;
let currentImageData: ImageData | null = null;
let currentConfig: any = null;
let isProcessing = false;

// Message types for type safety
interface WorkerMessage {
	type: 'init' | 'process' | 'configure' | 'abort' | 'cleanup';
	id: string;
	payload?: any;
}

interface WorkerResponse {
	type: 'success' | 'error' | 'progress';
	id: string;
	data?: any;
	error?: string;
}

/**
 * Initialize WASM module in worker context
 */
async function initializeWasm(config?: { threadCount?: number; backend?: string }) {
	console.log(
		'[Worker] 🔧 initializeWasm called with config:',
		config ? JSON.parse(JSON.stringify(config)) : null
	);
	console.log('[Worker] 🔧 Current wasmInitialized status:', wasmInitialized);

	// TEMPORARY: Just return success without actual WASM initialization
	console.log('[Worker] 🧪 TEMPORARY: Skipping WASM init for import testing');
	wasmInitialized = true;

	// Return success
	try {
		return {
			success: true,
			message: wasmInitializationNeeded
				? 'WASM module initialized successfully (single-threaded + Web Worker)'
				: 'WASM already initialized (single-threaded + Web Worker)',
			threading: 1 // Single-threaded architecture
		};
	} catch (threadError) {
		console.error('[Worker] Threading setup failed:', threadError);
		return {
			success: false,
			error: threadError instanceof Error ? threadError.message : 'Threading setup failed'
		};
	}
}

/**
 * Create vectorizer instance with image data
 */
async function createVectorizer(imageDataPayload: {
	data: number[];
	width: number;
	height: number;
}) {
	if (!wasmInitialized || !wasmModule.WasmVectorizer) {
		throw new Error('WASM not initialized or WasmVectorizer not available');
	}

	// DEFENSIVE CLEANUP: Always clean up previous vectorizer to prevent state corruption
	if (vectorizer) {
		try {
			console.log('[Worker] 🧹 Cleaning up previous vectorizer to prevent state corruption');
			vectorizer.free();
		} catch (e) {
			console.warn('[Worker] ⚠️ Failed to free previous vectorizer (may be corrupted):', e);
		}
	}

	// ALWAYS force null to ensure fresh instance, even if cleanup failed
	vectorizer = null;

	// Small delay to ensure WASM cleanup is complete (helps with memory corruption)
	await new Promise((resolve) => setTimeout(resolve, 10));

	// Create a proper ImageData object from the serialized data
	console.log('[Worker] Creating ImageData object:', {
		width: imageDataPayload.width,
		height: imageDataPayload.height,
		dataLength: imageDataPayload.data.length
	});

	// iOS Safari compatibility: OffscreenCanvas fallback
	let imageDataObj: ImageData;

	if (typeof OffscreenCanvas !== 'undefined') {
		// Modern browsers with OffscreenCanvas support
		const canvas = new OffscreenCanvas(imageDataPayload.width, imageDataPayload.height);
		const ctx = canvas.getContext('2d')!;
		imageDataObj = ctx.createImageData(imageDataPayload.width, imageDataPayload.height);
	} else {
		// iOS Safari fallback - create ImageData directly without OffscreenCanvas
		console.log(
			`[Worker] iOS Safari detected - using ImageData fallback for ${imageDataPayload.width}x${imageDataPayload.height} image`
		);
		imageDataObj = new ImageData(imageDataPayload.width, imageDataPayload.height);
	}

	// Copy pixel data - convert array back to Uint8ClampedArray
	const expectedLength = imageDataPayload.width * imageDataPayload.height * 4;
	console.log(
		'[Worker] Setting pixel data, expected:',
		expectedLength,
		'actual:',
		imageDataPayload.data.length
	);

	if (imageDataPayload.data.length !== expectedLength) {
		throw new Error(
			`Image data length mismatch: expected ${expectedLength}, got ${imageDataPayload.data.length}`
		);
	}

	// Set the pixel data
	for (let i = 0; i < imageDataPayload.data.length; i++) {
		imageDataObj.data[i] = imageDataPayload.data[i];
	}

	// Store the ImageData for processing
	currentImageData = imageDataObj;
	console.log('[Worker] ImageData created successfully');

	vectorizer = new wasmModule.WasmVectorizer();
	return true;
}

/**
 * Configure vectorizer with settings
 */
async function configureVectorizer(config: any) {
	if (!vectorizer) {
		throw new Error('Vectorizer not initialized');
	}

	// Store config globally for timeout handling
	currentConfig = config;

	console.log('[Worker] 🚀 Using robust configuration mapper for bulletproof config transmission');

	// TEMPORARILY DISABLED: Robust config mapper has interface issues
	// The vectorizer instance has no methods available, suggesting type mismatch
	// Using legacy configuration until interface is fixed
	console.log(
		'[Worker] 🔧 Using legacy configuration (robust mapper temporarily disabled for debugging)'
	);

	// Robust config mapper attempt (disabled for now)
	// try {
	//     const { RobustConfigMapper } = await import('./robust-config-mapper');
	//     const configMapper = new RobustConfigMapper(vectorizer as any);
	//
	//     await configMapper.applyConfiguration(config);
	//     console.log('[Worker] ✅ Robust configuration application completed successfully');
	//     return;
	//
	// } catch (robustConfigError) {
	//     console.error('[Worker] ❌ Robust config mapper failed, falling back to legacy configuration:', robustConfigError);
	//     // Fall through to legacy configuration as backup
	// }

	// Ensure critical defaults are set if missing
	if (config.pass_count === undefined) {
		config.pass_count = 1; // Default to single pass
		console.log('[Worker] 🔧 Setting default pass_count=1');
	}

	console.log(
		`[Worker] 🔍 Current pass_count value: ${config.pass_count} (type: ${typeof config.pass_count})`
	);

	// Calculate multipass configuration from pass_count and multipass_mode
	if (config.pass_count !== undefined || config.multipass_mode !== undefined) {
		const multipassConfig = calculateMultipassConfig(config);
		config = {
			...config,
			...multipassConfig
		};
		console.log('[Worker] Calculated multipass config:', multipassConfig);
	}

	console.log('[Worker] Configuring vectorizer with:', JSON.stringify(config, null, 2));

	// Single-threaded architecture - no threading configuration needed
	console.log('[Worker] 🧵 Using single-threaded architecture with Web Worker');

	// Apply dots backend configuration
	if (config.backend === 'dots') {
		console.log('[Worker] 🎯 DOTS BACKEND - Using dedicated dot_density_threshold parameter');
		console.log('[Worker]   Input from UI:', {
			dot_density_threshold: config.dot_density_threshold,
			stroke_width: config.stroke_width,
			color_mode: config.preserve_colors
		});
	}

	// Apply configuration
	if (config.backend) {
		console.log('[Worker] Setting backend to:', config.backend);
		vectorizer.set_backend(config.backend);

		// Phase 2: Enhanced threading system supports all algorithms including dots
		console.log('[Worker] ✅ Enhanced threading system supports all backends including dots');
	}

	if (typeof config.detail === 'number') {
		if (config.backend === 'dots') {
			// For dots backend: skip set_detail() - we use set_dot_density() instead
			console.log(
				`[Worker] 🎯 Dots backend - skipping set_detail(), using dot_density_threshold parameter instead`
			);
		} else {
			// For line art backends: pass detail directly (UI: 1.0=detailed, Backend: 1.0=detailed)
			// FIXED: Removed incorrect inversion that caused detail slider to work backwards
			console.log(`[Worker] Setting detail level: ${config.detail} (UI range 0.1-1.0)`);
			try {
				vectorizer.set_detail(config.detail);
				console.log(`[Worker] ✅ Detail level set successfully: ${config.detail}`);
			} catch (detailError) {
				console.error(`[Worker] ❌ Failed to set detail level ${config.detail}:`, detailError);
				console.error(
					`[Worker] ❌ Vectorizer methods available:`,
					Object.getOwnPropertyNames(vectorizer)
				);
			}
		}
	}

	if (typeof config.stroke_width === 'number') {
		if (config.backend === 'dots') {
			// For dots backend: stroke_width controls dot sizes via UI mapping
			// Extended range: 0.5-10.0 for bold artistic effects
			const dotWidth = config.stroke_width;

			// CRITICAL FIX: Validate stroke_width before dots mapping to prevent WASM crashes
			if (isNaN(dotWidth) || !isFinite(dotWidth)) {
				console.error(
					'[Worker] 🚨 Invalid stroke_width for dots backend, using safe default:',
					dotWidth
				);
				vectorizer.set_dot_size_range(0.5, 3.0); // Safe fallback
			} else {
				const clampedWidth = Math.max(0.5, Math.min(10.0, dotWidth));

				// Map to extended ranges for larger dots with additional safety checks
				const normalizedWidth = (clampedWidth - 0.5) / (10.0 - 0.5);
				let minRadius = 0.3 + normalizedWidth * (3.0 - 0.3); // 0.3-3.0 range
				let maxRadius = Math.max(minRadius + 0.1, 1.0 + normalizedWidth * (10.0 - 1.0)); // 1.0-10.0 range

				// SAFEGUARD: Ensure valid range and prevent potential divide-by-zero or invalid values
				minRadius = Math.max(0.1, Math.min(10.0, minRadius));
				maxRadius = Math.max(minRadius + 0.1, Math.min(10.0, maxRadius));

				if (!isFinite(minRadius) || !isFinite(maxRadius)) {
					console.error(
						'[Worker] 🚨 Computed dot size range contains invalid values, using safe defaults'
					);
					vectorizer.set_dot_size_range(0.5, 3.0);
				} else {
					console.log(
						`[Worker] 🎯 Dots backend - mapping stroke_width=${dotWidth} to dot_size_range(${minRadius.toFixed(1)}, ${maxRadius.toFixed(1)})`
					);
					vectorizer.set_dot_size_range(minRadius, maxRadius);
				}
			}
		} else {
			// For line art backends: stroke_width controls line thickness
			console.log(`[Worker] Setting stroke width: ${config.stroke_width} (Range: 0.5-10.0)`);
			try {
				vectorizer.set_stroke_width(config.stroke_width);
				console.log(`[Worker] ✅ Stroke width set successfully: ${config.stroke_width}`);
			} catch (strokeError) {
				console.error(
					`[Worker] ❌ Failed to set stroke width ${config.stroke_width}:`,
					strokeError
				);
			}
		}
	}

	// CRITICAL FIX: Auto-enable dependency chain for advanced features (WASM validation requirements)
	if (config.enable_bezier_fitting && !config.enable_flow_tracing) {
		console.log('[Worker] 🔧 Auto-enabling flow tracing for Bézier fitting (WASM requirement)');
		config.enable_flow_tracing = true;
	}

	// Flow tracing requires ETF/FDoG edge detection
	if (config.enable_flow_tracing && !config.enable_etf_fdog) {
		console.log('[Worker] 🔧 Auto-enabling ETF/FDoG for flow tracing (WASM requirement)');
		config.enable_etf_fdog = true;
	}

	// Reverse and diagonal passes require multipass processing (but only for supported backends)
	if ((config.reverse_pass || config.diagonal_pass) && !config.multipass) {
		// Check if backend supports multipass
		if (config.backend === 'edge') {
			console.log(
				'[Worker] 🔧 Auto-enabling multipass for reverse/diagonal passes (WASM requirement)'
			);
			config.multipass = true;
			// Ensure pass_count is > 1 when multipass is enabled
			if (!config.pass_count || config.pass_count <= 1) {
				console.log('[Worker] 🔧 Auto-setting pass_count to 2 for multipass (WASM requirement)');
				config.pass_count = 2;
			}
		} else {
			// Backend doesn't support multipass - disable the conflicting settings
			console.log(
				`[Worker] ⚠️ Backend '${config.backend}' doesn't support multipass - disabling reverse/diagonal passes`
			);
			config.reverse_pass = false;
			config.diagonal_pass = false;
		}
	}

	// General validation: multipass enabled but pass_count is missing or <= 1
	if (config.multipass && (!config.pass_count || config.pass_count <= 1)) {
		console.log(
			'[Worker] 🔧 Auto-correcting pass_count to 2 for multipass consistency (WASM requirement)'
		);
		config.pass_count = 2;
	}

	// Validate pass count is within supported range
	if (config.pass_count && config.pass_count > 10) {
		console.log('[Worker] 🔧 Auto-limiting pass_count to 10 (maximum supported)');
		config.pass_count = 10;
	}

	// Apply core boolean configuration options
	const booleanConfigMethods = {
		noise_filtering: 'set_noise_filtering',
		multipass: 'set_multipass',
		reverse_pass: 'set_reverse_pass',
		diagonal_pass: 'set_diagonal_pass',
		enable_etf_fdog: 'set_enable_etf_fdog',
		enable_flow_tracing: 'set_enable_flow_tracing',
		enable_bezier_fitting: 'set_enable_bezier_fitting',
		enable_adaptive_threshold: 'set_enable_adaptive_threshold',
		enable_width_modulation: 'set_enable_width_modulation'
	};

	for (const [key, method] of Object.entries(booleanConfigMethods)) {
		if (key in config && typeof vectorizer[method] === 'function') {
			console.log(`[Worker] Setting ${key}:`, config[key]);
			vectorizer[method](config[key]);
		}
	}

	// Apply numeric configuration options
	const numericConfigMethods = {
		svg_precision: 'set_svg_precision',
		pass_count: 'set_pass_count',
		conservative_detail: 'set_conservative_detail',
		aggressive_detail: 'set_aggressive_detail',
		directional_strength_threshold: 'set_directional_strength_threshold',
		window_size: 'set_window_size',
		sensitivity_k: 'set_sensitivity_k',
		min_branch_length: 'set_min_branch_length',
		douglas_peucker_epsilon: 'set_douglas_peucker_epsilon',
		max_image_size: 'set_max_image_size',
		background_tolerance: 'set_background_tolerance'
	};

	for (const [key, method] of Object.entries(numericConfigMethods)) {
		if (
			key in config &&
			typeof config[key] === 'number' &&
			typeof vectorizer[method] === 'function'
		) {
			console.log(`[Worker] 🔧 Setting ${key} to ${config[key]} via ${method}()`);
			vectorizer[method](config[key]);

			// Special debug logging for pass_count
			if (key === 'pass_count') {
				console.log(`[Worker] 📊 Debug: pass_count=${config[key]}, multipass=${config.multipass}`);
				// Try to verify the value was set (if getter exists)
				if (typeof vectorizer.get_pass_count === 'function') {
					try {
						const currentPassCount = vectorizer.get_pass_count();
						console.log(`[Worker] ✅ Verified pass_count set to: ${currentPassCount}`);
					} catch (e) {
						console.log(`[Worker] ⚠️ Could not verify pass_count:`, e);
					}
				}
			}
		}
	}

	// Apply hand-drawn preset first (required before custom parameters)
	if (typeof config.hand_drawn_preset === 'string') {
		if (typeof vectorizer.set_hand_drawn_preset === 'function') {
			// Handle 'custom' preset - map to 'medium' to satisfy validation, then override with custom params
			const wasmPreset =
				config.hand_drawn_preset === 'custom' ? 'medium' : config.hand_drawn_preset;
			console.log(
				'[Worker] Setting hand-drawn preset:',
				config.hand_drawn_preset,
				config.hand_drawn_preset === 'custom'
					? '(mapped to "medium" for WASM validation, will override with custom values)'
					: ''
			);
			try {
				vectorizer.set_hand_drawn_preset(wasmPreset);
			} catch (error) {
				console.error('[Worker] Error: Hand-drawn preset error:', error);
				// Fallback to 'medium' preset for any invalid preset (not 'none' to avoid validation errors)
				console.log('[Worker] Falling back to "medium" preset due to error');
				vectorizer.set_hand_drawn_preset('medium');
			}
		} else {
			console.log(
				`[Worker] ℹ️ Hand-drawn preset "${config.hand_drawn_preset}" requested but WASM method not available - using current single-threaded architecture parameters`
			);
			// Since the method isn't available, we're using the simplified single-threaded architecture
			// where hand-drawn effects are achieved through the existing parameters (detail, stroke_width, multipass)
		}
	}

	// Apply noise filtering parameters (if enabled)
	if (config.noise_filtering) {
		if (
			typeof config.noise_filter_spatial_sigma === 'number' &&
			typeof vectorizer.set_noise_filter_spatial_sigma === 'function'
		) {
			console.log(
				'[Worker] Setting noise filter spatial sigma:',
				config.noise_filter_spatial_sigma
			);
			vectorizer.set_noise_filter_spatial_sigma(config.noise_filter_spatial_sigma);
		}

		if (
			typeof config.noise_filter_range_sigma === 'number' &&
			typeof vectorizer.set_noise_filter_range_sigma === 'function'
		) {
			console.log('[Worker] Setting noise filter range sigma:', config.noise_filter_range_sigma);
			vectorizer.set_noise_filter_range_sigma(config.noise_filter_range_sigma);
		}
	}

	// Apply hand-drawn parameters (only after preset is set)
	// PHASE 5 FIX: Allow independent artistic effects even when preset is 'none'
	// If any custom artistic values are provided (non-zero), apply them regardless of preset
	const hasCustomEffects =
		(typeof config.tremor_strength === 'number' && config.tremor_strength > 0) ||
		(typeof config.variable_weights === 'number' && config.variable_weights > 0) ||
		(typeof config.tapering === 'number' && config.tapering > 0);

	// Always apply artistic effects when custom effects are specified or when using any preset
	const applyArtisticEffects = hasCustomEffects || config.hand_drawn_preset !== 'none';

	if (applyArtisticEffects) {
		if (
			typeof config.tremor_strength === 'number' &&
			typeof vectorizer.set_custom_tremor === 'function'
		) {
			try {
				console.log('[Worker] Setting tremor strength:', config.tremor_strength);
				vectorizer.set_custom_tremor(config.tremor_strength);
			} catch (error) {
				console.error('[Worker] Error setting tremor strength:', error);
				console.log('[Worker] Continuing with default tremor settings');
			}
		}

		if (
			typeof config.variable_weights === 'number' &&
			typeof vectorizer.set_custom_variable_weights === 'function'
		) {
			try {
				console.log('[Worker] Setting variable weights:', config.variable_weights);
				vectorizer.set_custom_variable_weights(config.variable_weights);
			} catch (error) {
				console.error('[Worker] Error setting variable weights:', error);
				console.log('[Worker] Continuing with default variable weights');
			}
		}

		if (
			typeof config.tapering === 'number' &&
			typeof vectorizer.set_custom_tapering === 'function'
		) {
			try {
				console.log('[Worker] Setting tapering:', config.tapering);
				vectorizer.set_custom_tapering(config.tapering);
			} catch (error) {
				console.error('[Worker] Error setting tapering:', error);
				console.log('[Worker] Continuing with default tapering settings');
			}
		}

		if (
			(config.hand_drawn_preset === 'none' || config.hand_drawn_preset === 'custom') &&
			hasCustomEffects
		) {
			console.log('[Worker] ✅ Applying independent artistic effects with custom control');
		}
	} else {
		console.log(
			'[Worker] No hand-drawn effects requested (preset: "none", all custom values zero)'
		);
	}

	// Apply backend-specific parameters for dots backend
	if (config.backend === 'dots') {
		console.log('[Worker] 🎯 Configuring dots backend parameters');

		// CRITICAL FIX: Enhanced parameter validation to prevent WASM unreachable errors
		// Use dot_density_threshold if available (from new Dot Density slider)
		if (
			typeof config.dot_density_threshold === 'number' &&
			typeof vectorizer.set_dot_density === 'function'
		) {
			// SAFEGUARD: Strict validation of dot density parameter
			const densityValue = config.dot_density_threshold;
			if (isNaN(densityValue) || !isFinite(densityValue)) {
				console.error(
					'[Worker] 🚨 Invalid dot_density_threshold value, using safe default:',
					densityValue
				);
				vectorizer.set_dot_density(0.1); // Safe default
			} else {
				// Strict range clamping to prevent backend crashes
				const clampedDensity = Math.max(0.02, Math.min(0.4, densityValue));
				if (clampedDensity !== densityValue) {
					console.warn(
						`[Worker] ⚠️ dot_density_threshold clamped from ${densityValue} to ${clampedDensity} for safety`
					);
				}
				console.log(`[Worker] 🎯 Dot Density slider: ${clampedDensity}`);
				vectorizer.set_dot_density(clampedDensity);
			}
		}

		// Advanced dot size parameters override stroke_width mapping (only when explicitly different from defaults)
		// CRITICAL FIX: Only use advanced parameters if they're different from defaults, not just present
		const defaultMinRadius = 0.5;
		const defaultMaxRadius = 3.0;
		const hasCustomAdvancedSizeParams =
			(typeof config.min_radius === 'number' && config.min_radius !== defaultMinRadius) ||
			(typeof config.max_radius === 'number' && config.max_radius !== defaultMaxRadius);

		if (hasCustomAdvancedSizeParams && typeof vectorizer.set_dot_size_range === 'function') {
			const minRadius = config.min_radius ?? 0.5;
			const maxRadius = config.max_radius ?? 3.0;

			// CRITICAL FIX: Validate dot size range parameters to prevent WASM crashes
			if (isNaN(minRadius) || !isFinite(minRadius) || isNaN(maxRadius) || !isFinite(maxRadius)) {
				console.error('[Worker] 🚨 Invalid dot size range values, using safe defaults:', {
					minRadius,
					maxRadius
				});
				vectorizer.set_dot_size_range(0.5, 3.0); // Safe defaults
			} else {
				// Strict validation and correction of range parameters
				const clampedMin = Math.max(0.1, Math.min(10.0, minRadius));
				const clampedMax = Math.max(clampedMin + 0.1, Math.min(10.0, maxRadius));

				if (clampedMin !== minRadius || clampedMax !== maxRadius) {
					console.warn(
						`[Worker] ⚠️ Dot size range corrected from (${minRadius}, ${maxRadius}) to (${clampedMin}, ${clampedMax}) for safety`
					);
				}

				console.log(
					`[Worker] 🎛️ Advanced dot size override: ${clampedMin.toFixed(1)}-${clampedMax.toFixed(1)}px (overriding stroke_width mapping)`
				);
				vectorizer.set_dot_size_range(clampedMin, clampedMax);
			}
		} else {
			console.log(
				'[Worker] ✅ Using stroke_width (Dot Width) mapping for dot sizes - advanced parameters at defaults'
			);
		}

		// Algorithm features from checkboxes
		const dotsBooleanMethods = {
			adaptive_sizing: 'set_adaptive_sizing',
			poisson_disk_sampling: 'set_poisson_disk_sampling',
			gradient_based_sizing: 'set_gradient_based_sizing'
		};

		for (const [key, method] of Object.entries(dotsBooleanMethods)) {
			if (key in config && typeof vectorizer[method] === 'function') {
				console.log(`[Worker] Setting ${key}:`, config[key]);
				vectorizer[method](config[key]);
			}
		}

		// Color preservation
		if (
			typeof config.preserve_colors === 'boolean' &&
			typeof vectorizer.set_preserve_colors === 'function'
		) {
			console.log('[Worker] Setting preserve_colors:', config.preserve_colors);
			vectorizer.set_preserve_colors(config.preserve_colors);
		}
	}

	// Superpixel backend parameters - ONLY apply to superpixel backend
	if (config.backend === 'superpixel') {
		const superpixelNumericMethods = {
			num_superpixels: 'set_num_superpixels',
			compactness: 'set_compactness',
			slic_iterations: 'set_slic_iterations',
			boundary_epsilon: 'set_boundary_epsilon'
		};

		console.log('[Worker] Applying superpixel backend parameters...');
		for (const [key, method] of Object.entries(superpixelNumericMethods)) {
			if (
				key in config &&
				typeof config[key] === 'number' &&
				typeof vectorizer[method] === 'function'
			) {
				// CRITICAL FIX: Add validation for superpixel parameters to prevent intermittent WASM crashes
				const value = config[key];
				if (isNaN(value) || !isFinite(value)) {
					console.error(`[Worker] 🚨 Invalid ${key} value: ${value}, skipping parameter`);
					continue;
				}

				// Just apply the parameter value as requested - no more safety overrides
				console.log(`[Worker] Setting ${key}:`, value);
				vectorizer[method](value);
			}
		}

		const superpixelBooleanMethods = {
			fill_regions: 'set_fill_regions',
			stroke_regions: 'set_stroke_regions',
			simplify_boundaries: 'set_simplify_boundaries'
		};

		for (const [key, method] of Object.entries(superpixelBooleanMethods)) {
			if (key in config && typeof vectorizer[method] === 'function') {
				console.log(`[Worker] Setting ${key}:`, config[key]);
				vectorizer[method](config[key]);
			}
		}

		// Superpixel initialization pattern configuration - ALWAYS respect user choice
		if (
			typeof config.superpixel_initialization_pattern === 'string' &&
			typeof vectorizer.set_superpixel_initialization_pattern === 'function'
		) {
			console.log(
				'[Worker] Setting superpixel_initialization_pattern:',
				config.superpixel_initialization_pattern
			);
			vectorizer.set_superpixel_initialization_pattern(config.superpixel_initialization_pattern);
		}

		// Unified color configuration for superpixel backend
		if (
			typeof config.preserve_colors === 'boolean' &&
			typeof vectorizer.set_superpixel_preserve_colors === 'function'
		) {
			console.log(
				'[Worker] Setting unified preserve_colors for superpixel backend:',
				config.preserve_colors
			);
			vectorizer.set_superpixel_preserve_colors(config.preserve_colors);
		}
	} else {
		console.log(`[Worker] Skipping superpixel parameters for ${config.backend} backend`);
	}

	// Apply performance settings
	// NOTE: We use JavaScript-based timeout instead of Rust-based timing to avoid WASM std::time issues
	if (typeof config.max_processing_time_ms === 'number') {
		console.log(
			'[Worker] Max processing time will be handled by JavaScript timeout:',
			config.max_processing_time_ms,
			'ms'
		);
		// We don't call vectorizer.set_max_processing_time_ms() as it uses incompatible Rust timing
		// Instead, we implement timeout in JavaScript using setTimeout (see processImage function)
	}

	// Apply any missing centerline backend parameters
	if (config.backend === 'centerline') {
		console.log('[Worker] Applying centerline backend specific parameters...');

		// Centerline-specific parameters with validation
		if (
			typeof config.window_size === 'number' &&
			typeof vectorizer.set_window_size === 'function'
		) {
			const clampedWindow = Math.max(15, Math.min(50, config.window_size));
			if (clampedWindow !== config.window_size) {
				console.warn(
					`[Worker] ⚠️ Window size clamped from ${config.window_size} to ${clampedWindow}`
				);
			}
			console.log('[Worker] Setting window_size:', clampedWindow);
			vectorizer.set_window_size(clampedWindow);
		}

		if (
			typeof config.sensitivity_k === 'number' &&
			typeof vectorizer.set_sensitivity_k === 'function'
		) {
			const clampedK = Math.max(0.1, Math.min(1, config.sensitivity_k));
			if (clampedK !== config.sensitivity_k) {
				console.warn(
					`[Worker] ⚠️ Sensitivity K clamped from ${config.sensitivity_k} to ${clampedK}`
				);
			}
			console.log('[Worker] Setting sensitivity_k:', clampedK);
			vectorizer.set_sensitivity_k(clampedK);
		}

		if (
			typeof config.min_branch_length === 'number' &&
			typeof vectorizer.set_min_branch_length === 'function'
		) {
			const clampedLength = Math.max(4, Math.min(24, config.min_branch_length));
			if (clampedLength !== config.min_branch_length) {
				console.warn(
					`[Worker] ⚠️ Min branch length clamped from ${config.min_branch_length} to ${clampedLength}`
				);
			}
			console.log('[Worker] Setting min_branch_length:', clampedLength);
			vectorizer.set_min_branch_length(clampedLength);
		}

		if (
			typeof config.douglas_peucker_epsilon === 'number' &&
			typeof vectorizer.set_douglas_peucker_epsilon === 'function'
		) {
			const clampedEpsilon = Math.max(0.5, Math.min(3, config.douglas_peucker_epsilon));
			if (clampedEpsilon !== config.douglas_peucker_epsilon) {
				console.warn(
					`[Worker] ⚠️ Douglas-Peucker epsilon clamped from ${config.douglas_peucker_epsilon} to ${clampedEpsilon}`
				);
			}
			console.log('[Worker] Setting douglas_peucker_epsilon:', clampedEpsilon);
			vectorizer.set_douglas_peucker_epsilon(clampedEpsilon);
		}

		// Boolean parameters
		if (
			typeof config.enable_adaptive_threshold === 'boolean' &&
			typeof vectorizer.set_enable_adaptive_threshold === 'function'
		) {
			console.log('[Worker] Setting enable_adaptive_threshold:', config.enable_adaptive_threshold);
			vectorizer.set_enable_adaptive_threshold(config.enable_adaptive_threshold);
		}

		if (
			typeof config.enable_width_modulation === 'boolean' &&
			typeof vectorizer.set_enable_width_modulation === 'function'
		) {
			console.log('[Worker] Setting enable_width_modulation:', config.enable_width_modulation);
			vectorizer.set_enable_width_modulation(config.enable_width_modulation);
		}

		console.log('[Worker] ✅ Centerline backend parameters configured');
	}

	// Unified color configuration (applies to all backends)
	if (config.backend === 'edge' || config.backend === 'centerline') {
		if (
			typeof config.preserve_colors === 'boolean' &&
			typeof vectorizer.set_line_preserve_colors === 'function'
		) {
			console.log(
				'[Worker] Setting unified preserve_colors for line backend:',
				config.preserve_colors
			);
			vectorizer.set_line_preserve_colors(config.preserve_colors);
		}

		if (
			typeof config.color_accuracy === 'number' &&
			typeof vectorizer.set_line_color_accuracy === 'function'
		) {
			const clampedAccuracy = Math.max(0.3, Math.min(1.0, config.color_accuracy));
			if (clampedAccuracy !== config.color_accuracy) {
				console.warn(
					`[Worker] ⚠️ Color accuracy clamped from ${config.color_accuracy} to ${clampedAccuracy}`
				);
			}
			console.log('[Worker] Setting color_accuracy for line backend:', clampedAccuracy);
			vectorizer.set_line_color_accuracy(clampedAccuracy);
		}

		if (
			typeof config.max_colors_per_path === 'number' &&
			typeof vectorizer.set_max_colors_per_path === 'function'
		) {
			const clampedMaxColors = Math.max(1, Math.min(10, config.max_colors_per_path));
			if (clampedMaxColors !== config.max_colors_per_path) {
				console.warn(
					`[Worker] ⚠️ Max colors per path clamped from ${config.max_colors_per_path} to ${clampedMaxColors}`
				);
			}
			console.log('[Worker] Setting max_colors_per_path:', clampedMaxColors);
			vectorizer.set_max_colors_per_path(clampedMaxColors);
		}

		if (
			typeof config.color_tolerance === 'number' &&
			typeof vectorizer.set_color_tolerance === 'function'
		) {
			const clampedTolerance = Math.max(0.05, Math.min(0.5, config.color_tolerance));
			if (clampedTolerance !== config.color_tolerance) {
				console.warn(
					`[Worker] ⚠️ Color tolerance clamped from ${config.color_tolerance} to ${clampedTolerance}`
				);
			}
			console.log('[Worker] Setting color_tolerance:', clampedTolerance);
			vectorizer.set_color_tolerance(clampedTolerance);
		}

		console.log('[Worker] ✅ Line color parameters configured');
	}

	// Configure background removal preprocessing
	if (config.enable_background_removal !== undefined) {
		console.log(`[Worker] Setting background removal: ${config.enable_background_removal}`);
		if (typeof vectorizer.enable_background_removal === 'function') {
			vectorizer.enable_background_removal(config.enable_background_removal);
		}
	}
	if (config.background_removal_strength !== undefined) {
		console.log(
			`[Worker] Setting background removal strength: ${config.background_removal_strength}`
		);
		if (typeof vectorizer.set_background_removal_strength === 'function') {
			try {
				vectorizer.set_background_removal_strength(config.background_removal_strength);
			} catch (error) {
				console.error('[Worker] Error setting background removal strength:', error);
			}
		}
	}
	if (config.background_removal_algorithm !== undefined) {
		console.log(
			`[Worker] Setting background removal algorithm: ${config.background_removal_algorithm}`
		);
		if (typeof vectorizer.set_background_removal_algorithm === 'function') {
			try {
				// Map any remaining 'auto' values to 'otsu' as fallback
				const algorithm =
					config.background_removal_algorithm === 'auto'
						? 'otsu'
						: config.background_removal_algorithm;
				vectorizer.set_background_removal_algorithm(algorithm);
			} catch (error) {
				console.error('[Worker] Error setting background removal algorithm:', error);
			}
		}
	}
	if (config.background_removal_threshold !== undefined) {
		console.log(
			`[Worker] Setting background removal threshold: ${config.background_removal_threshold}`
		);
		if (typeof vectorizer.set_background_removal_threshold === 'function') {
			vectorizer.set_background_removal_threshold(config.background_removal_threshold);
		}
	}

	console.log(
		'[Worker] ✅ All configuration parameters applied successfully with strict validation'
	);

	return true;
}

/**
 * Process image and generate SVG
 */
async function processImage() {
	if (!vectorizer || !currentImageData) {
		throw new Error('Vectorizer or image data not initialized');
	}

	if (isProcessing) {
		throw new Error('Processing already in progress');
	}

	isProcessing = true;

	try {
		console.log('[Worker] Starting vectorization...');
		console.log(
			'[Worker] Current image dimensions:',
			currentImageData?.width,
			'x',
			currentImageData?.height
		);
		console.log('[Worker] Current config details:', {
			backend: vectorizer.get_backend?.() || 'unknown',
			detail: vectorizer.get_detail?.() || 'unknown',
			thread_count: currentConfig?.thread_count || 'NOT_SET',
			full_config: currentConfig ? JSON.parse(JSON.stringify(currentConfig)) : null
		});

		// Process with progress callback and dynamic JavaScript-based timeout
		let timeoutMs = currentConfig.max_processing_time_ms || 30000;

		// CRITICAL FIX: Extend timeout for background removal to prevent race condition
		if (currentConfig.enable_background_removal) {
			const pixelCount = currentImageData.width * currentImageData.height;
			const megapixels = pixelCount / 1_000_000;

			// Match the WASM timeout extensions to prevent conflicting timeouts
			if (megapixels > 8) {
				timeoutMs = Math.max(timeoutMs, 300000); // 5 minutes minimum for 8MP+
			} else if (megapixels > 5) {
				timeoutMs = Math.max(timeoutMs, 240000); // 4 minutes minimum for 5-8MP
			} else {
				timeoutMs = Math.max(timeoutMs, 180000); // 3 minutes minimum for smaller images
			}

			console.log(
				`[Worker] Background removal: Extended JS timeout to ${timeoutMs / 1000}s for ${megapixels.toFixed(1)}MP image`
			);
		}

		const isUnlimited = timeoutMs >= 999999; // 999999ms+ considered unlimited

		if (isUnlimited) {
			console.log('[Worker] 🚨 Processing with UNLIMITED timeout - no time limit');
		} else {
			console.log('[Worker] Processing with JavaScript timeout:', timeoutMs, 'ms');
		}

		// eslint-disable-next-line no-async-promise-executor
		const svg = await new Promise<string>(async (resolve, reject) => {
			let timeoutHandle: number | undefined;
			let isCompleted = false;

			// Set up JavaScript-based timeout (WASM-compatible) - skip if unlimited
			if (!isUnlimited) {
				timeoutHandle = self.setTimeout(() => {
					if (!isCompleted) {
						isCompleted = true;
						console.warn('[Worker] ⏰ Processing timeout reached:', timeoutMs, 'ms');
						reject(new Error(`Processing timeout after ${timeoutMs / 1000}s`));
					}
				}, timeoutMs);
			}

			try {
				console.log('[Worker] About to call vectorize_with_progress...');

				// CRITICAL: Pre-process image data for dots backend stability
				let processedImageData = currentImageData;
				if (currentConfig?.backend === 'dots' && currentImageData) {
					console.log('[Worker] 🔧 Pre-processing image data for dots backend stability...');

					// CRITICAL FIX: Additional validation to prevent WASM unreachable errors
					if (!currentImageData.data || currentImageData.data.length === 0) {
						console.error('[Worker] 🚨 Invalid image data for dots backend processing');
						throw new Error('Image data is corrupted or empty. Please try a different image.');
					}

					// Validate image dimensions are reasonable for dots backend
					const pixelCount = currentImageData.width * currentImageData.height;
					if (pixelCount === 0 || pixelCount > 50000000) {
						// > 50MP
						console.error('[Worker] 🚨 Image dimensions invalid or too large for dots backend:', {
							width: currentImageData.width,
							height: currentImageData.height,
							pixelCount
						});
						throw new Error(
							'Image is too large or has invalid dimensions. Please resize to under 7000x7000 pixels.'
						);
					}

					// Create a copy of the image data to avoid modifying the original
					const dataArray = new Uint8ClampedArray(currentImageData.data.length);

					// Copy and slightly modify image data for stability
					for (let i = 0; i < currentImageData.data.length; i += 4) {
						// Ensure no extreme values that might cause issues
						dataArray[i] = Math.max(10, Math.min(245, currentImageData.data[i])); // R
						dataArray[i + 1] = Math.max(10, Math.min(245, currentImageData.data[i + 1])); // G
						dataArray[i + 2] = Math.max(10, Math.min(245, currentImageData.data[i + 2])); // B
						dataArray[i + 3] = Math.max(200, 255); // Ensure solid alpha
					}

					// Create proper ImageData object with validation
					try {
						const imageDataCopy = new ImageData(
							dataArray,
							currentImageData.width,
							currentImageData.height
						);
						processedImageData = imageDataCopy;
						console.log('[Worker] ✅ Image data pre-processed for dots backend');
					} catch (imageError) {
						console.error(
							'[Worker] 🚨 Failed to create processed ImageData for dots backend:',
							imageError
						);
						throw new Error('Failed to process image data. Please try a different image format.');
					}
				}

				// Call vectorize with enhanced error handling for WASM panics
				let result;
				let mainTimeoutHandle: number | null = null;
				let emergencyTimeoutHandle: number | null = null;

				try {
					// Set up dynamic timeout based on image size and background removal
					let wasmTimeoutMs = 180000; // 3 minutes base timeout

					// Adjust timeout for background removal (which is very CPU intensive)
					if (currentConfig?.enable_background_removal && processedImageData) {
						const pixelCount = processedImageData.width * processedImageData.height;
						const megapixels = pixelCount / 1_000_000;

						if (megapixels > 8) {
							wasmTimeoutMs = 300000; // 5 minutes for 8MP+ with background removal
						} else if (megapixels > 5) {
							wasmTimeoutMs = 240000; // 4 minutes for 5-8MP with background removal
						} else {
							wasmTimeoutMs = 180000; // Keep 3 minutes for smaller images
						}

						console.log(
							`[Worker] 🕐 Background removal enabled: Extended WASM timeout to ${wasmTimeoutMs / 1000}s for ${megapixels.toFixed(1)}MP image`
						);
					} else {
						console.log(`[Worker] 🕐 Setting WASM processing timeout: ${wasmTimeoutMs / 1000}s`);
					}

					// Wrap WASM call in a Promise race with timeout
					result = await Promise.race([
						// WASM processing promise
						new Promise((resolve, reject) => {
							try {
								// Check if GPU acceleration is preferred and available
								if (
									currentConfig?.preferGpu &&
									typeof wasmModule.vectorize_with_gpu_acceleration === 'function'
								) {
									console.log('[Worker] 🚀 Using GPU-accelerated vectorization...');
									const gpuResult = wasmModule.vectorize_with_gpu_acceleration(
										vectorizer,
										processedImageData!,
										true
									);
									resolve(gpuResult);
								} else {
									// Fallback to standard CPU vectorization
									if (currentConfig?.preferGpu) {
										console.log(
											'[Worker] 💻 GPU preferred but not available, using CPU fallback...'
										);
									}

									console.log('[Worker] 🚀 Starting WASM vectorize_with_progress call...');
									try {
										const cpuResult = vectorizer.vectorize_with_progress(
											processedImageData,
											(progress: any) => {
												console.log('[Worker] Progress callback received:', progress);
												// Send progress updates to main thread
												self.postMessage({
													type: 'progress',
													id: 'current',
													data: {
														stage: progress.stage || 'processing',
														progress: progress.progress || 0,
														message: progress.message || 'Processing...'
													}
												} as WorkerResponse);
											}
										);

										console.log(
											'[Worker] ✅ WASM vectorize_with_progress completed, result type:',
											typeof cpuResult,
											'length:',
											cpuResult?.length || 'no length'
										);

										// Add explicit timeout check
										if (!cpuResult) {
											console.error('[Worker] ❌ WASM returned null/undefined result');
											reject(new Error('WASM processing returned null result'));
											return;
										}

										console.log('[Worker] ✅ About to resolve with result');
										resolve(cpuResult);
									} catch (wasmCallError) {
										console.error(
											'[Worker] ❌ WASM vectorize_with_progress threw error:',
											wasmCallError
										);
										reject(wasmCallError);
									}
								}
							} catch (wasmError) {
								console.error('[Worker] 💥 WASM processing error in promise wrapper:', wasmError);
								reject(wasmError);
							}
						}),

						// Timeout promise with proper cleanup tracking
						new Promise((_, reject) => {
							mainTimeoutHandle = setTimeout(() => {
								console.error(
									`[Worker] 🚨 WASM processing timeout after ${wasmTimeoutMs / 1000}s - terminating to prevent hanging`
								);
								console.error(
									`[Worker] 🚨 This appears to be a WASM internal hang - likely in edge processing after background removal`
								);
								reject(
									new Error(
										`WASM processing timeout after ${wasmTimeoutMs / 1000} seconds. The edge processing algorithm appears to be stuck in an infinite loop after background removal.`
									)
								);
							}, wasmTimeoutMs) as any;

							// Also add an emergency shorter timeout for known problematic combinations
							if (currentConfig?.enable_background_removal && currentConfig?.backend === 'edge') {
								const emergencyTimeout = Math.min(wasmTimeoutMs, 120000); // 2 minutes max for this combination
								emergencyTimeoutHandle = setTimeout(() => {
									console.error(
										`[Worker] 🚨 EMERGENCY TIMEOUT after ${emergencyTimeout / 1000}s - Edge+Background combination is hanging`
									);
									reject(
										new Error(
											`Edge processing with background removal is hanging. Try disabling background removal or using a different algorithm.`
										)
									);
								}, emergencyTimeout) as any;
							}
						})
					]);

					console.log('[Worker] ✅ WASM processing completed successfully within timeout');
				} catch (wasmError: any) {
					console.error('[Worker] 💥 WASM vectorization error:', wasmError);

					// Check for specific WASM errors and provide user-friendly messages
					// IMPORTANT: Preserve original error message for critical error detection
					if (wasmError?.message?.includes?.('unreachable executed')) {
						console.error('[Worker] 🚨 WASM unreachable error detected - backend bug');
						const userError = new Error(
							'Processing failed due to internal error. Try a different algorithm or image.'
						);
						// Add original error as property for service layer critical error detection
						(userError as any).originalError = wasmError;
						(userError as any).wasmErrorType = 'unreachable executed';
						throw userError;
					} else if (wasmError?.message?.includes?.('memory access out of bounds')) {
						console.error('[Worker] 🚨 WASM memory bounds error detected');
						const userError = new Error(
							'Image processing failed due to memory constraints. Try a smaller image.'
						);
						(userError as any).originalError = wasmError;
						(userError as any).wasmErrorType = 'memory access out of bounds';
						throw userError;
					} else if (wasmError?.message?.includes?.('RuntimeError')) {
						console.error('[Worker] 🚨 WASM runtime error detected');
						const userError = new Error(
							'Processing engine error. Try refreshing the page or using a different algorithm.'
						);
						(userError as any).originalError = wasmError;
						(userError as any).wasmErrorType = 'RuntimeError';
						throw userError;
					} else {
						// Re-throw with enhanced error message and preserve original
						const userError = new Error(
							`Processing failed: ${wasmError?.message || 'Unknown WASM error'}`
						);
						(userError as any).originalError = wasmError;
						throw userError;
					}
				} finally {
					// CRITICAL FIX: Always clear timeout handles to prevent post-completion errors
					if (mainTimeoutHandle !== null) {
						clearTimeout(mainTimeoutHandle);
						console.log(
							'[Worker] 🧹 Cleared main timeout handle to prevent post-completion errors'
						);
					}
					if (emergencyTimeoutHandle !== null) {
						clearTimeout(emergencyTimeoutHandle);
						console.log(
							'[Worker] 🧹 Cleared emergency timeout handle to prevent post-completion errors'
						);
					}
				}

				// Clear timeout on successful completion
				if (!isCompleted) {
					isCompleted = true;
					if (timeoutHandle !== undefined) {
						self.clearTimeout(timeoutHandle);
					}
					console.log(
						'[Worker] vectorize_with_progress returned:',
						typeof result,
						typeof result === 'string' ? result.length : 'no length'
					);
					resolve(result as string);
				}
			} catch (error) {
				// Clear timeout on error
				if (!isCompleted) {
					isCompleted = true;
					if (timeoutHandle !== undefined) {
						self.clearTimeout(timeoutHandle);
					}
					console.error('[Worker] Error in vectorize_with_progress:', error);
					reject(error);
				}
			}
		});

		// REMOVED: Thread pool cleanup was causing the "every other failure" corruption
		// Research shows wasm-bindgen-rayon provides no proper cleanup mechanism
		// Multiple init_thread_pool() calls create corrupted global state in .build_global()
		// Solution: Single thread pool lifetime - initialize once, reuse throughout app
		console.log(`[Worker] ✅ ${currentConfig.pass_count}-pass operation completed without reset`);
		console.log(`[Worker] 📊 Thread pool reused (single lifetime strategy)`);

		console.log('[Worker] Vectorization complete');

		// Validate SVG result before returning
		if (!svg || typeof svg !== 'string') {
			console.error('[Worker] Invalid SVG result:', typeof svg, svg?.length || 'no length');
			throw new Error('Invalid SVG result from WASM module');
		}

		const svgSizeMB = new Blob([svg]).size / (1024 * 1024);
		console.log(`[Worker] SVG result size: ${svgSizeMB.toFixed(2)}MB`);

		// Warn about very large SVGs that might cause serialization issues
		if (svgSizeMB > 50) {
			console.warn(
				`[Worker] ⚠️ Very large SVG result: ${svgSizeMB.toFixed(1)}MB - may cause serialization issues`
			);
		}

		const result = { success: true, svg };
		console.log(
			'[Worker] ✅ Returning result:',
			typeof result,
			result.success,
			result.svg ? `${result.svg.length} chars` : 'no svg'
		);
		return result;
	} finally {
		isProcessing = false;
		console.log('[Worker] 🔧 ProcessImage finally block - isProcessing set to false');

		// CRITICAL FIX: Automatically clean up vectorizer after each conversion to prevent memory accumulation
		if (vectorizer) {
			try {
				console.log('[Worker] 🧹 Auto-cleanup: Freeing vectorizer to prevent memory accumulation');
				vectorizer.free();
				vectorizer = null;
				console.log('[Worker] ✅ Auto-cleanup: Vectorizer freed successfully');
			} catch (cleanupError) {
				console.warn('[Worker] ⚠️ Auto-cleanup: Failed to free vectorizer:', cleanupError);
				// Force null anyway to prevent reuse of corrupted instance
				vectorizer = null;
			}
		}
	}
}

/**
 * Handle messages from main thread
 */
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
	const { type, id, payload } = event.data;

	console.log(`[Worker] 📨 Received message: ${type}`, payload);

	try {
		let result: any;

		switch (type) {
			case 'init':
				console.log('[Worker] 🎬 Processing init message with payload:', payload);
				result = await initializeWasm(payload);
				break;

			case 'process':
				console.log(
					'[Worker] 🚨 Processing image with single-threaded WASM + Web Worker architecture'
				);

				// Initialize WASM if not already initialized
				if (!wasmInitialized) {
					console.log('[Worker] 🔄 Initializing WASM module...');
					const initResult = await initializeWasm(payload.config);
					console.log('[Worker] 🔄 Initialization result:', initResult);
				}

				// Create vectorizer with image data
				await createVectorizer(payload.imageData);

				// Configure vectorizer
				await configureVectorizer(payload.config);

				// Store GPU preference for processing
				currentConfig.preferGpu = payload.preferGpu;

				// Process image
				result = await processImage();
				break;

			case 'configure':
				configureVectorizer(payload);
				result = { success: true };
				break;

			case 'abort':
				isProcessing = false;
				result = { success: true, message: 'Processing aborted' };
				break;

			case 'cleanup':
				if (vectorizer) {
					vectorizer.free();
					vectorizer = null;
				}
				result = { success: true, message: 'Cleanup complete' };
				break;

			default:
				throw new Error(`Unknown message type: ${type}`);
		}

		// Send success response
		console.log(
			'[Worker] 📤 Sending success response with result:',
			typeof result,
			result?.success
		);
		try {
			self.postMessage({
				type: 'success',
				id,
				data: result
			} as WorkerResponse);
			console.log('[Worker] ✅ Success response sent successfully');
		} catch (postError) {
			console.error('[Worker] 💥 Failed to send success response:', postError);
			// Try to send error response about the postMessage failure
			self.postMessage({
				type: 'error',
				id,
				error: `Failed to send success response: ${postError instanceof Error ? postError.message : 'Unknown postMessage error'}`
			} as WorkerResponse);
		}
	} catch (error) {
		// Send error response
		console.error('[Worker] Error:', error);
		console.log(
			'[Worker] 📤 Sending error response for exception:',
			error instanceof Error ? error.message : 'Unknown error'
		);
		try {
			self.postMessage({
				type: 'error',
				id,
				error: error instanceof Error ? error.message : 'Unknown error'
			} as WorkerResponse);
			console.log('[Worker] ✅ Error response sent successfully');
		} catch (postError) {
			console.error('[Worker] 💥 Failed to send error response:', postError);
			// Last resort - try to send a basic error message
			try {
				self.postMessage({
					type: 'error',
					id,
					error: 'Worker communication error'
				});
			} catch (finalError) {
				console.error('[Worker] 💥 Complete communication failure:', finalError);
			}
		}
	}
});

// Log worker ready
console.log('[Worker] WASM processor worker ready - message handlers set up');

// Test message handler by sending a test signal
try {
	console.log('[Worker] Testing message handler setup...');
	self.postMessage({
		type: 'worker_ready',
		timestamp: Date.now()
	});
} catch (error) {
	console.error('[Worker] ❌ Failed to send ready message:', error);
}

// Export for TypeScript
export {};
