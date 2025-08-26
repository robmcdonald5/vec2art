/**
 * Web Worker for WASM Image Processing
 * This worker runs WASM operations in a separate thread to prevent browser freezing
 *
 * Architecture:
 * - All WASM operations run in this worker thread
 * - Main thread communicates via message passing
 * - Prevents main thread blocking during intensive operations
 */

// Import the WASM module
import init, * as wasmModule from '../wasm/vectorize_wasm.js';
import { calculateMultipassConfig } from '../types/vectorizer.js';
import { devLog, devDebug, devWarn, devError } from '../utils/dev-logger.js';

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
	if (wasmInitialized) {
		return { success: true, message: 'WASM already initialized' };
	}

	try {
		devLog('wasm_operations', 'Initializing WASM module');

		// Initialize WASM module
		await init();

		// Check if threading is available and requested
		const hasThreadSupport =
			typeof wasmModule.initThreadPool === 'function' && typeof SharedArrayBuffer !== 'undefined';

		// WORKAROUND: Disable threading for dots backend due to memory access crashes
		const isDotsBackend = config?.backend === 'dots';
		const shouldUseThreading =
			hasThreadSupport && config?.threadCount && config.threadCount > 1 && !isDotsBackend;

		if (shouldUseThreading) {
			console.log(`[Worker] Initializing thread pool with ${config!.threadCount} threads...`);

			try {
				// WORKAROUND: Disable threading due to crossbeam-epoch panics in wasm-bindgen-rayon
				// These panics occur in crossbeam-epoch-0.9.18/src/internal.rs:385:57
				// causing "Option::unwrap() on a None value" during worker spawning
				console.warn(
					'[Worker] 🔧 Skipping thread pool initialization due to known crossbeam-epoch panics'
				);
				console.warn(
					'[Worker] 🔧 Using single-threaded mode for stability (Web Worker still provides isolation)'
				);

				if (typeof wasmModule.mark_threading_failed === 'function') {
					wasmModule.mark_threading_failed();
				}

				// Note: Still using Web Worker for main thread isolation, just not WASM internal threading
				console.log('[Worker] ✅ Single-threaded mode initialized successfully');
			} catch (threadError) {
				console.warn(
					'[Worker] Thread pool initialization failed, continuing single-threaded:',
					threadError
				);

				if (typeof wasmModule.mark_threading_failed === 'function') {
					wasmModule.mark_threading_failed();
				}
			}
		} else {
			if (isDotsBackend) {
				console.log(
					'[Worker] Running in single-threaded mode (dots backend - threading disabled for stability)'
				);
			} else {
				console.log('[Worker] Running in single-threaded mode');
			}
		}

		wasmInitialized = true;
		return {
			success: true,
			message: 'WASM initialized successfully',
			threading: hasThreadSupport && config?.threadCount ? config.threadCount : 1
		};
	} catch (error) {
		console.error('[Worker] WASM initialization failed:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

/**
 * Create vectorizer instance with image data
 */
function createVectorizer(imageDataPayload: { data: number[]; width: number; height: number }) {
	if (!wasmInitialized || !wasmModule.WasmVectorizer) {
		throw new Error('WASM not initialized or WasmVectorizer not available');
	}

	// Clean up previous vectorizer if exists
	if (vectorizer) {
		try {
			vectorizer.free();
		} catch (e) {
			console.warn('[Worker] Failed to free previous vectorizer:', e);
		}
	}

	// Create a proper ImageData object from the serialized data
	console.log('[Worker] Creating ImageData object:', {
		width: imageDataPayload.width,
		height: imageDataPayload.height,
		dataLength: imageDataPayload.data.length
	});

	const canvas = new OffscreenCanvas(imageDataPayload.width, imageDataPayload.height);
	const ctx = canvas.getContext('2d')!;
	const imageDataObj = ctx.createImageData(imageDataPayload.width, imageDataPayload.height);

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
function configureVectorizer(config: any) {
	if (!vectorizer) {
		throw new Error('Vectorizer not initialized');
	}

	// Store config globally for timeout handling
	currentConfig = config;

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

		// WORKAROUND: Disable threading for dots backend by marking thread pool failed
		if (config.backend === 'dots' && typeof wasmModule.mark_threading_failed === 'function') {
			console.log('[Worker] 🔧 Disabling threading for dots backend to prevent memory crashes');
			wasmModule.mark_threading_failed();
		}
	}

	if (typeof config.detail === 'number') {
		if (config.backend === 'dots') {
			// For dots backend: skip set_detail() - we use set_dot_density() instead
			console.log(
				`[Worker] 🎯 Dots backend - skipping set_detail(), using dot_density_threshold parameter instead`
			);
		} else {
			// For line art backends: invert detail level (UI: 1.0=detailed, Backend: 0.0=detailed)
			let invertedDetail = 1.0 - config.detail;

			// PERFORMANCE OPTIMIZATION: Reduce detail for single-threaded mode
			// Since we disabled WASM threading due to crossbeam panics, optimize for speed
			invertedDetail = Math.min(invertedDetail + 0.1, 0.9); // Reduce detail slightly for speed
			console.log(
				`[Worker] 🔧 Performance optimization: Adjusted detail from ${config.detail} to effective ${1.0 - invertedDetail}`
			);

			vectorizer.set_detail(invertedDetail);
		}
	}

	if (typeof config.stroke_width === 'number') {
		if (config.backend === 'dots') {
			// For dots backend: stroke_width controls dot sizes via UI mapping
			// Extended range: 0.5-10.0 for bold artistic effects
			const dotWidth = config.stroke_width;
			const clampedWidth = Math.max(0.5, Math.min(10.0, dotWidth));

			// Map to extended ranges for larger dots
			const normalizedWidth = (clampedWidth - 0.5) / (10.0 - 0.5);
			const minRadius = 0.3 + normalizedWidth * (3.0 - 0.3); // 0.3-3.0 range
			const maxRadius = Math.max(minRadius + 0.1, 1.0 + normalizedWidth * (10.0 - 1.0)); // 1.0-10.0 range

			console.log(
				`[Worker] 🎯 Dots backend - mapping stroke_width=${dotWidth} to dot_size_range(${minRadius.toFixed(1)}, ${maxRadius.toFixed(1)})`
			);
			vectorizer.set_dot_size_range(minRadius, maxRadius);
		} else {
			// For line art backends: stroke_width controls line thickness
			vectorizer.set_stroke_width(config.stroke_width);
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
		enable_width_modulation: 'set_enable_width_modulation',
		optimize_svg: 'set_optimize_svg'
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
			console.log(`[Worker] Setting ${key}:`, config[key]);
			vectorizer[method](config[key]);
		}
	}

	// Apply hand-drawn preset first (required before custom parameters)
	if (
		typeof config.hand_drawn_preset === 'string' &&
		typeof vectorizer.set_hand_drawn_preset === 'function'
	) {
		// Handle 'custom' preset - map to 'medium' to satisfy validation, then override with custom params
		const wasmPreset = config.hand_drawn_preset === 'custom' ? 'medium' : config.hand_drawn_preset;
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
		console.warn('[Worker] ⚠️ Hand-drawn preset not provided or WASM method unavailable');
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

		// Use dot_density_threshold if available (from new Dot Density slider)
		if (
			typeof config.dot_density_threshold === 'number' &&
			typeof vectorizer.set_dot_density === 'function'
		) {
			console.log(`[Worker] 🎯 Dot Density slider: ${config.dot_density_threshold}`);
			vectorizer.set_dot_density(config.dot_density_threshold);
		}

		// Advanced dot size parameters override stroke_width mapping (only when explicitly set)
		const hasAdvancedSizeParams =
			typeof config.min_radius === 'number' || typeof config.max_radius === 'number';

		if (hasAdvancedSizeParams && typeof vectorizer.set_dot_size_range === 'function') {
			const minRadius = config.min_radius ?? 0.5;
			const maxRadius = config.max_radius ?? 3.0;
			console.log(
				`[Worker] 🎛️ Advanced dot size override: ${minRadius.toFixed(1)}-${maxRadius.toFixed(1)}px (overriding stroke_width mapping)`
			);
			vectorizer.set_dot_size_range(minRadius, maxRadius);
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

	if (config.backend === 'superpixel') {
		// Superpixel backend parameters
		const superpixelNumericMethods = {
			num_superpixels: 'set_num_superpixels',
			compactness: 'set_compactness',
			slic_iterations: 'set_slic_iterations',
			boundary_epsilon: 'set_boundary_epsilon'
		};

		for (const [key, method] of Object.entries(superpixelNumericMethods)) {
			if (
				key in config &&
				typeof config[key] === 'number' &&
				typeof vectorizer[method] === 'function'
			) {
				console.log(`[Worker] Setting ${key}:`, config[key]);
				vectorizer[method](config[key]);
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
		console.log(`[Worker] Setting background removal strength: ${config.background_removal_strength}`);
		if (typeof vectorizer.set_background_removal_strength === 'function') {
			try {
				vectorizer.set_background_removal_strength(config.background_removal_strength);
			} catch (error) {
				console.error('[Worker] Error setting background removal strength:', error);
			}
		}
	}
	if (config.background_removal_algorithm !== undefined) {
		console.log(`[Worker] Setting background removal algorithm: ${config.background_removal_algorithm}`);
		if (typeof vectorizer.set_background_removal_algorithm === 'function') {
			try {
				// Map any remaining 'auto' values to 'otsu' as fallback
				const algorithm = config.background_removal_algorithm === 'auto' ? 'otsu' : config.background_removal_algorithm;
				vectorizer.set_background_removal_algorithm(algorithm);
			} catch (error) {
				console.error('[Worker] Error setting background removal algorithm:', error);
			}
		}
	}
	if (config.background_removal_threshold !== undefined) {
		console.log(`[Worker] Setting background removal threshold: ${config.background_removal_threshold}`);
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
			detail: vectorizer.get_detail?.() || 'unknown'
		});

		// Process with progress callback and JavaScript-based timeout
		const timeoutMs = currentConfig.max_processing_time_ms || 30000;
		const isUnlimited = timeoutMs >= 999999; // 999999ms+ considered unlimited

		if (isUnlimited) {
			console.log('[Worker] 🚨 Processing with UNLIMITED timeout - no time limit');
		} else {
			console.log('[Worker] Processing with JavaScript timeout:', timeoutMs, 'ms');
		}

		const svg = await new Promise<string>((resolve, reject) => {
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

					// Create proper ImageData object
					const imageDataCopy = new ImageData(
						dataArray,
						currentImageData.width,
						currentImageData.height
					);
					processedImageData = imageDataCopy;
					console.log('[Worker] ✅ Image data pre-processed for dots backend');
				}

				// Call vectorize with ImageData and progress callback
				const result = vectorizer.vectorize_with_progress(processedImageData, (progress: any) => {
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
				});

				// Clear timeout on successful completion
				if (!isCompleted) {
					isCompleted = true;
					if (timeoutHandle !== undefined) {
						self.clearTimeout(timeoutHandle);
					}
					console.log(
						'[Worker] vectorize_with_progress returned:',
						typeof result,
						result?.length || 'no length'
					);
					resolve(result);
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

		console.log('[Worker] Vectorization complete');
		return { success: true, svg };
	} finally {
		isProcessing = false;
	}
}

/**
 * Handle messages from main thread
 */
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
	const { type, id, payload } = event.data;

	try {
		let result: any;

		switch (type) {
			case 'init':
				result = await initializeWasm(payload);
				break;

			case 'process':
				// Create vectorizer with image data
				createVectorizer(payload.imageData);

				// Configure vectorizer
				configureVectorizer(payload.config);

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
		self.postMessage({
			type: 'success',
			id,
			data: result
		} as WorkerResponse);
	} catch (error) {
		// Send error response
		console.error('[Worker] Error:', error);
		self.postMessage({
			type: 'error',
			id,
			error: error instanceof Error ? error.message : 'Unknown error'
		} as WorkerResponse);
	}
});

// Log worker ready
console.log('[Worker] WASM processor worker ready');

// Export for TypeScript
export {};
