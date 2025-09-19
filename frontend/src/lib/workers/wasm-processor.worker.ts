/**
 * Web Worker for WASM Image Processing
 * This worker runs WASM operations in a separate thread to prevent browser freezing
 *
 * Architecture:
 * - All WASM operations run in this worker thread
 * - Main thread communicates via message passing
 * - Prevents main thread blocking during intensive operations
 */

// CRITICAL FIX: Use static imports for production compatibility
// Dynamic imports cause workers to load 404 HTML pages in Vercel production builds
// This addresses GPT's analysis of "dev OK, Vercel broken" worker pattern
import init, * as wasmModule from '../wasm/vectorize_wasm.js';

// Import vectorizer configuration types
import type { AlgorithmConfig } from '../types/algorithm-configs';
import { toWasmConfig } from '../types/config-transformer';

// Early logging to confirm worker execution
console.log('[Worker] WASM Worker starting up with STATIC imports...');
console.log('[Worker] All imports loaded successfully');

// Global error handler for worker
self.addEventListener('error', (error) => {
	console.error('[Worker] Global error caught:', error);
	self.postMessage({
		type: 'error',
		id: 'worker_error',
		error: `Worker startup error: ${error.message}`
	});
});

// Global unhandled rejection handler
self.addEventListener('unhandledrejection', (event) => {
	console.error('[Worker]  Unhandled promise rejection:', event.reason);
	self.postMessage({
		type: 'error',
		id: 'worker_rejection',
		error: `Worker promise rejection: ${event.reason}`
	});
});

/**
 * Message interface for communication with main thread
 */
interface WorkerMessage {
	id: string;
	type: 'init' | 'process' | 'capabilities' | 'cleanup' | 'abort';
	payload?: {
		imageData?: {
			data: number[];
			width: number;
			height: number;
		};
		config?: AlgorithmConfig;
		preferGpu?: boolean;
	};
	// Legacy direct properties for backward compatibility
	imageData?: {
		data: number[];
		width: number;
		height: number;
	};
	config?: AlgorithmConfig;
}

interface WorkerResponse {
	id: string;
	type: 'ready' | 'result' | 'error' | 'progress';
	data?: any;
	error?: string;
	progress?: number;
}

// WASM module state
let wasmInitialized = false;
let _wasmInstance: any = null;

/**
 * Initialize WASM module
 */
async function initializeWasm(): Promise<void> {
	if (wasmInitialized) {
		console.log('[Worker]  WASM already initialized');
		return;
	}

	try {
		console.log('[Worker] 🔧 Initializing WASM module...');

		// Initialize WASM
		_wasmInstance = await init();

		console.log('[Worker]  WASM module initialized successfully');
		console.log('[Worker] 📋 Available WASM exports:', Object.keys(wasmModule));

		wasmInitialized = true;
	} catch (error) {
		console.error('[Worker]  WASM initialization failed:', error);
		throw new Error(`WASM initialization failed: ${error}`);
	}
}

/**
 * Process image using WASM
 */
async function processImage(imageData: ImageData, config: AlgorithmConfig): Promise<any> {
	if (!wasmInitialized) {
		await initializeWasm();
	}

	try {
		console.log('[Worker] 🖼️ Processing image...', {
			width: imageData.width,
			height: imageData.height,
			config
		});

		// Create WASM vectorizer
		const vectorizer = new wasmModule.WasmVectorizer();

		// ===== NEW UNIFIED CONFIG SYSTEM =====

		// Transform frontend config to WASM format
		const wasmConfig = toWasmConfig(config);


		// Additional debug logging for dots parameters
		if (config.algorithm === 'dots') {
			// First, check if dotShape exists anywhere in the config
			console.log('[Worker] 🔍 Searching for dotShape in config:', {
				directDotShape: (config as any).dotShape,
				configKeys: Object.keys(config),
				configValues: config
			});

			console.log('[Worker] 🔵 Dots config values:', {
				frontend: {
					dotDensity: (config as any).dotDensity,
					dotDensityThreshold: (config as any).dotDensityThreshold,
					minRadius: (config as any).minRadius,
					dotMinRadius: (config as any).dotMinRadius,
					maxRadius: (config as any).maxRadius,
					dotMaxRadius: (config as any).dotMaxRadius,
					strokeWidth: config.strokeWidth,
					adaptiveSizing: (config as any).adaptiveSizing,
					dotAdaptiveSizing: (config as any).dotAdaptiveSizing,
					sizeVariation: (config as any).sizeVariation,
					dotSizeVariation: (config as any).dotSizeVariation,
					dotShape: (config as any).dotShape
				},
				wasm: {
					dot_density_threshold: wasmConfig.dot_density_threshold,
					dot_min_radius: wasmConfig.dot_min_radius,
					dot_max_radius: wasmConfig.dot_max_radius,
					dot_adaptive_sizing: wasmConfig.dot_adaptive_sizing,
					dot_gradient_based_sizing: wasmConfig.dot_gradient_based_sizing,
					dot_size_variation: wasmConfig.dot_size_variation,
					dot_shape: wasmConfig.dot_shape
				}
			});
		}

		const configJson = JSON.stringify(wasmConfig);

		console.log('[Worker] 🔧 Applying unified config to WASM');
		console.log('[Worker] 📋 Config summary:', {
			backend: wasmConfig.backend,
			detail: wasmConfig.detail,
			stroke_width: wasmConfig.stroke_px_at_1080p,
			noise_filtering: wasmConfig.noise_filtering,
			background_removal: wasmConfig.enable_background_removal
		});

		// Apply entire configuration with single call
		try {
			if (typeof vectorizer.apply_config_json === 'function') {
				vectorizer.apply_config_json(configJson);
				console.log('[Worker]  Unified config applied successfully');
			} else {
				// Fallback to old method if new method doesn't exist yet
				console.log(
					'[Worker]  Falling back to individual setters (apply_config_json not available)'
				);

				// Apply backend using vectorizer config
				vectorizer.set_backend(config.algorithm);

				// Apply core settings using vectorizer config
				vectorizer.set_detail(config.detail);
				vectorizer.set_stroke_width(config.strokeWidth);

				// Apply color settings
				try {
					if (typeof vectorizer.set_preserve_colors === 'function') {
						vectorizer.set_preserve_colors(config.preserveColors || false);
					} else {
						console.error('[Worker]  set_preserve_colors method does not exist on vectorizer');
					}
				} catch (error) {
					console.error('[Worker]  Error calling set_preserve_colors:', error);
				}

				// Apply backend-specific settings based on backend type
				if (config.algorithm === 'edge') {
					// Edge-specific settings
					if (config.passCount !== undefined) {
						vectorizer.set_multipass(config.passCount > 1);
					}
					if (config.passCount !== undefined && config.passCount > 0) {
						vectorizer.set_pass_count(config.passCount);
					}
					if (config.enableReversePass !== undefined) {
						vectorizer.set_reverse_pass(config.enableReversePass);
					}
					if (config.enableDiagonalPass !== undefined) {
						vectorizer.set_diagonal_pass(config.enableDiagonalPass);
					}

					// Apply hand-drawn settings (Edge-specific)
					if (config.handDrawnPreset !== undefined) {
						try {
							// When custom values are set, the preset should be "custom"
							// but the WASM doesn't have individual setters for tremor/weights/tapering
							if (
								(config.handDrawnVariableWeights !== undefined &&
									config.handDrawnVariableWeights > 0) ||
								(config.handDrawnTremorStrength !== undefined &&
									config.handDrawnTremorStrength > 0) ||
								(config.handDrawnTapering !== undefined && config.handDrawnTapering > 0)
							) {
								console.log('[Worker]  Setting hand_drawn_preset: custom (with custom values)');
								if (typeof vectorizer.set_hand_drawn_preset === 'function') {
									vectorizer.set_hand_drawn_preset('custom');
								} else {
									console.error('[Worker]  set_hand_drawn_preset method does not exist');
								}
							} else {
								console.log('[Worker]  Setting hand_drawn_preset:', config.handDrawnPreset);
								if (typeof vectorizer.set_hand_drawn_preset === 'function') {
									vectorizer.set_hand_drawn_preset(config.handDrawnPreset);
								} else {
									console.error('[Worker]  set_hand_drawn_preset method does not exist');
								}
							}
						} catch (error) {
							console.error('[Worker]  Error setting hand_drawn_preset:', error);
						}
					}

					// Apply preprocessing parameters
					if (config.noiseFiltering !== undefined) {
						console.log('[Worker] 🔧 Setting noise_filtering:', config.noiseFiltering);
						try {
							if (typeof vectorizer.set_noise_filtering === 'function') {
								vectorizer.set_noise_filtering(config.noiseFiltering);
							} else {
								console.error('[Worker]  set_noise_filtering method does not exist');
							}
						} catch (error) {
							console.error('[Worker]  Error calling set_noise_filtering:', error);
						}
					}

					if (config.enableBackgroundRemoval !== undefined) {
						console.log(
							'[Worker] 🗑️ Setting enable_background_removal:',
							config.enableBackgroundRemoval
						);
						try {
							if (typeof vectorizer.enable_background_removal === 'function') {
								vectorizer.enable_background_removal(config.enableBackgroundRemoval);
							} else {
								console.error('[Worker]  enable_background_removal method does not exist');
							}
						} catch (error) {
							console.error('[Worker]  Error calling enable_background_removal:', error);
						}
					}

					// Apply Background removal settings (Edge config only)
					if (config.backgroundRemovalStrength !== undefined) {
						console.log(
							'[Worker] 🗑️ Setting background_removal_strength:',
							config.backgroundRemovalStrength
						);
						try {
							if (typeof vectorizer.set_background_removal_strength === 'function') {
								vectorizer.set_background_removal_strength(config.backgroundRemovalStrength);
							} else {
								console.error('[Worker]  set_background_removal_strength method does not exist');
							}
						} catch (error) {
							console.error('[Worker]  Error calling set_background_removal_strength:', error);
						}
					}
				}


				// Apply Superpixel backend specific settings
				if (config.algorithm === 'superpixel') {
					if (config.numSuperpixels !== undefined) {
						console.log('[Worker] 🎨 Setting num_superpixels:', config.numSuperpixels);
						vectorizer.set_num_superpixels(config.numSuperpixels);
					}
					if (config.compactness !== undefined) {
						console.log('[Worker] 🎨 Setting compactness:', config.compactness);
						vectorizer.set_compactness(config.compactness);
					}
					if (config.iterations !== undefined) {
						console.log('[Worker] 🎨 Setting slic_iterations:', config.iterations);
						vectorizer.set_slic_iterations(config.iterations);
					}
				}

				// Apply Dots backend specific settings
				if (config.algorithm === 'dots') {
					// Dot density (most important parameter)
					if (config.dotDensity !== undefined || config.dotDensityThreshold !== undefined) {
						// Map UI dotDensity (1-10) to threshold (0.02-0.4)
						// Higher UI value = lower threshold = more dots
						let threshold;
						if (config.dotDensityThreshold !== undefined) {
							threshold = config.dotDensityThreshold;
						} else if (config.dotDensity !== undefined) {
							threshold = 0.4 - ((config.dotDensity - 1) / 9) * (0.4 - 0.02);
						}
						if (threshold !== undefined) {
							console.log('[Worker] 🔵 Setting dot_density:', threshold);
							try {
								if (typeof vectorizer.set_dot_density === 'function') {
									vectorizer.set_dot_density(threshold);
								} else {
									console.error('[Worker]  set_dot_density method does not exist');
								}
							} catch (error) {
								console.error('[Worker]  Error calling set_dot_density:', error);
							}
						}
					}

					// Dot size range
					if (
						config.minRadius !== undefined ||
						config.maxRadius !== undefined ||
						config.dotMinRadius !== undefined ||
						config.dotMaxRadius !== undefined ||
						config.strokeWidth !== undefined
					) {
						// Priority: explicit radius values > strokeWidth-derived values
						let minRadius = config.minRadius ?? config.dotMinRadius;
						let maxRadius = config.maxRadius ?? config.dotMaxRadius;

						// If not explicitly set, derive from strokeWidth (Dot Width slider)
						if (minRadius === undefined && config.strokeWidth !== undefined) {
							minRadius = Math.max(0.1, config.strokeWidth * 0.3);
						}
						if (maxRadius === undefined && config.strokeWidth !== undefined) {
							maxRadius = Math.min(20.0, config.strokeWidth * 1.5);
						}

						// Apply defaults if still undefined
						minRadius = minRadius ?? 0.5;
						maxRadius = maxRadius ?? 3.0;

						console.log('[Worker] 🔵 Setting dot_size_range:', minRadius, maxRadius);
						try {
							if (typeof vectorizer.set_dot_size_range === 'function') {
								vectorizer.set_dot_size_range(minRadius, maxRadius);
							} else {
								console.error('[Worker]  set_dot_size_range method does not exist');
							}
						} catch (error) {
							console.error('[Worker]  Error calling set_dot_size_range:', error);
						}
					}

					// Adaptive sizing
					if (config.adaptiveSizing !== undefined || config.dotAdaptiveSizing !== undefined) {
						const adaptiveSizing = config.adaptiveSizing ?? config.dotAdaptiveSizing ?? true;
						console.log('[Worker] 🔵 Setting adaptive_sizing:', adaptiveSizing);
						try {
							if (typeof vectorizer.set_adaptive_sizing === 'function') {
								vectorizer.set_adaptive_sizing(adaptiveSizing);
							} else {
								console.error('[Worker]  set_adaptive_sizing method does not exist');
							}
						} catch (error) {
							console.error('[Worker]  Error calling set_adaptive_sizing:', error);
						}
					}

					// Size Variation
					console.log('[Worker] 🔍 DEBUG Size Variation check:', {
						'config.sizeVariation': config.sizeVariation,
						'config.dotSizeVariation': (config as any).dotSizeVariation,
						'fullConfig?.sizeVariation': (config as any).fullConfig?.sizeVariation,
						'fullConfig?.dotSizeVariation': (config as any).fullConfig?.dotSizeVariation,
						configKeys: Object.keys(config || {}),
						fullConfigKeys: (config as any).fullConfig
							? Object.keys((config as any).fullConfig)
							: null
					});
					if (
						config.sizeVariation !== undefined ||
						(config as any).dotSizeVariation !== undefined ||
						(config as any).fullConfig?.sizeVariation !== undefined ||
						(config as any).fullConfig?.dotSizeVariation !== undefined
					) {
						const sizeVariation =
							config.sizeVariation ??
							(config as any).dotSizeVariation ??
							(config as any).fullConfig?.sizeVariation ??
							(config as any).fullConfig?.dotSizeVariation ??
							0.3;
						console.log('[Worker] 🔵 Setting dot_size_variation:', sizeVariation);
						console.log('[Worker] 🔍 Method check:', typeof vectorizer.set_dot_size_variation);
						try {
							if (typeof vectorizer.set_dot_size_variation === 'function') {
								vectorizer.set_dot_size_variation(sizeVariation);
								console.log(
									'[Worker]  Successfully called set_dot_size_variation with:',
									sizeVariation
								);
							} else {
								console.error('[Worker]  set_dot_size_variation method does not exist');
							}
						} catch (error) {
							console.error('[Worker]  Error calling set_dot_size_variation:', error);
						}
					} else {
						console.log('[Worker]  No size variation parameter found in config');
					}

					// Background tolerance
					if (config.dotBackgroundTolerance !== undefined) {
						console.log('[Worker] 🔵 Setting background_tolerance:', config.dotBackgroundTolerance);
						try {
							if (typeof vectorizer.set_background_tolerance === 'function') {
								vectorizer.set_background_tolerance(config.dotBackgroundTolerance);
							} else {
								console.error('[Worker]  set_background_tolerance method does not exist');
							}
						} catch (error) {
							console.error('[Worker]  Error calling set_background_tolerance:', error);
						}
					}

					// Gradient-based sizing
					if (config.dotGradientBasedSizing !== undefined) {
						console.log(
							'[Worker] 🔵 Setting gradient_based_sizing:',
							config.dotGradientBasedSizing
						);
						try {
							if (typeof vectorizer.set_gradient_based_sizing === 'function') {
								vectorizer.set_gradient_based_sizing(config.dotGradientBasedSizing);
							} else {
								console.error('[Worker]  set_gradient_based_sizing method does not exist');
							}
						} catch (error) {
							console.error('[Worker]  Error calling set_gradient_based_sizing:', error);
						}
					}

					// Color preservation for dots
					if (config.dotPreserveColors !== undefined || config.preserveColors !== undefined) {
						const preserveColors = config.dotPreserveColors ?? config.preserveColors ?? false;
						console.log('[Worker] 🔵 Setting dot_preserve_colors:', preserveColors);
						// This might be handled by the unified config, but include it here for completeness
					}
				}
			}
		} catch (error) {
			console.error('[Worker]  Error applying config:', error);
			// Continue with processing even if unified config fails
		}

		// Apply Centerline backend specific settings (outside unified config)
		if (config.algorithm === 'centerline') {
			// Centerline-specific multipass settings
			if (config.passCount !== undefined) {
				vectorizer.set_multipass(config.passCount > 1);
			}
			if (config.passCount !== undefined && config.passCount > 0) {
				vectorizer.set_pass_count(config.passCount);
			}

			// Main centerline parameters
			if (wasmConfig.min_branch_length !== undefined) {
				vectorizer.set_min_branch_length(wasmConfig.min_branch_length);
			}
			if (wasmConfig.douglas_peucker_epsilon !== undefined) {
				vectorizer.set_douglas_peucker_epsilon(wasmConfig.douglas_peucker_epsilon);
			}

			// Adaptive threshold settings
			if (config.enableAdaptiveThreshold !== undefined) {
				vectorizer.set_enable_adaptive_threshold(config.enableAdaptiveThreshold);
			}
			if (config.adaptiveThresholdWindowSize !== undefined) {
				vectorizer.set_window_size(config.adaptiveThresholdWindowSize);
			}
			if (config.adaptiveThresholdK !== undefined) {
				vectorizer.set_sensitivity_k(config.adaptiveThresholdK);
			}

			// Width modulation settings
			if (config.enableWidthModulation !== undefined) {
				vectorizer.set_enable_width_modulation(config.enableWidthModulation);
			}
			if (config.widthMultiplier !== undefined) {
				vectorizer.set_width_multiplier(config.widthMultiplier);
			}
		}

		console.log('[Worker]  Config applied to vectorizer, starting processing...');

		// Process the image
		const svg = vectorizer.vectorize(imageData);

		const result = {
			svg,
			stats: {
				paths_generated: 1,
				processing_backend: vectorizer.get_backend()
			},
			processing_time: 0 // TODO: Add timing
		};

		console.log('[Worker]  Image processing completed');

		return {
			svg: result.svg,
			stats: result.stats,
			processing_time: result.processing_time
		};
	} catch (error) {
		console.error('[Worker]  Image processing failed:', error);
		throw error;
	}
}

/**
 * Get WASM capabilities
 */
function getCapabilities(): any {
	return {
		wasm_available: wasmInitialized,
		threading_supported: false, // Worker-based threading
		backends: ['edge', 'centerline', 'superpixel', 'dots'],
		max_image_size: 4096 * 4096,
		supported_formats: ['png', 'jpg', 'jpeg', 'webp']
	};
}

// Message handler
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
	const { id, type } = event.data;

	console.log(`[Worker] 📨 Received message: ${type} (${id})`);

	try {
		switch (type) {
			case 'init':
				await initializeWasm();
				self.postMessage({
					id,
					type: 'ready',
					data: {
						initialized: true,
						capabilities: getCapabilities()
					}
				} as WorkerResponse);
				break;

			case 'process': {
				// DEBUG: Log raw message data to check structure
				console.log('[Worker] 🔍 [SETTINGS DEBUG] Raw message data:', {
					hasPayload: !!event.data.payload,
					eventDataKeys: Object.keys(event.data),
					payloadKeys: event.data.payload ? Object.keys(event.data.payload) : null
				});

				const { imageData, config } = event.data.payload || event.data;

				// DEBUG: Log the config being received to check if settings are passed correctly
				console.log('[Worker] 🔍 [SETTINGS DEBUG] Received AlgorithmConfig:', {
					hasConfig: !!config,
					algorithm: config?.algorithm,
					detail: config?.detail,
					strokeWidth: config?.strokeWidth
				});

				if (!imageData || !config) {
					throw new Error('Missing image data or config');
				}

				// Use AlgorithmConfig directly (new unified system)
				const wasmConfig = config;

				// Reconstruct ImageData from serialized data
				const reconstructedImageData = new ImageData(
					new Uint8ClampedArray(imageData.data),
					imageData.width,
					imageData.height
				);

				const result = await processImage(reconstructedImageData, wasmConfig);
				self.postMessage({
					id,
					type: 'result',
					data: result
				} as WorkerResponse);
				break;
			}

			case 'capabilities': {
				self.postMessage({
					id,
					type: 'result',
					data: getCapabilities()
				} as WorkerResponse);
				break;
			}

			case 'cleanup': {
				console.log('[Worker] 🧹 Received cleanup request');
				// Reset worker state if needed
				wasmInitialized = false;
				_wasmInstance = null;
				self.postMessage({
					id,
					type: 'result',
					data: {
						cleaned: true
					}
				} as WorkerResponse);
				break;
			}

			case 'abort': {
				console.log('[Worker] 🛑 Received abort request');
				// Acknowledge abort request
				self.postMessage({
					id,
					type: 'result',
					data: {
						aborted: true
					}
				} as WorkerResponse);
				break;
			}

			default:
				throw new Error(`Unknown message type: ${type}`);
		}
	} catch (error) {
		console.error(`[Worker]  Error handling ${type}:`, error);
		self.postMessage({
			id,
			type: 'error',
			error: error instanceof Error ? error.message : String(error)
		} as WorkerResponse);
	}
});

console.log('[Worker] 🎯 Worker ready for messages');
