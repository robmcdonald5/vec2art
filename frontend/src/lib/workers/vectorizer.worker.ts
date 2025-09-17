/**
 * Web Worker for off-main-thread WASM vectorization
 * Handles image processing without blocking the UI
 */

import type { AlgorithmConfig } from '../types/algorithm-configs';

// Worker message types (simplified for new system)
export interface WorkerInitMessage {
	id: string;
	type: 'init';
}

export interface WorkerProcessMessage {
	id: string;
	type: 'process';
	config: AlgorithmConfig;
	image_data: ImageData;
}

export interface WorkerProgressMessage {
	id: string;
	type: 'progress';
	progress: ProcessingProgress;
}

export interface WorkerResultMessage {
	id: string;
	type: 'result';
	result: ProcessingResult;
}

export interface WorkerErrorMessage {
	id: string;
	type: 'error';
	error: VectorizerError;
}

export interface WorkerCapabilitiesMessage {
	id: string;
	type: 'capabilities';
	capabilities: WasmCapabilityReport;
}

export type WorkerMessageType =
	| WorkerInitMessage
	| WorkerProcessMessage
	| WorkerProgressMessage
	| WorkerResultMessage
	| WorkerErrorMessage
	| WorkerCapabilitiesMessage;

export interface ProcessingProgress {
	stage: string;
	progress: number; // 0-100
	elapsed_ms: number;
	estimated_remaining_ms?: number;
}

export interface ProcessingResult {
	svg: string;
	processing_time_ms: number;
	config_used: AlgorithmConfig;
	statistics?: {
		input_dimensions: [number, number];
		paths_generated: number;
		dots_generated?: number;
		compression_ratio: number;
	};
}

export interface VectorizerError {
	type: 'unknown' | 'processing' | 'validation';
	message: string;
	details?: string;
}

export interface WasmCapabilityReport {
	threading_supported: boolean;
	shared_array_buffer: boolean;
	cross_origin_isolated: boolean;
	web_workers: boolean;
	proper_headers: boolean;
	environment_type: string;
	is_node_js: boolean;
	atomics_supported: boolean;
	webgpu_supported: boolean;
	webgl2_supported: boolean;
	gpu_backend: string;
	missing_requirements: string[];
	diagnostics: any[];
	shared_array_buffer_available: boolean;
	hardware_concurrency: number;
	recommendations: string[];
}

// Dynamic import type for WASM module - will be imported at runtime
// @ts-ignore - WASM module types
type WasmModule = any;
type WasmVectorizer = any;

class VectorizerWorker {
	private wasmModule: WasmModule | null = null;
	private vectorizer: WasmVectorizer | null = null;
	private isInitialized = false;

	constructor() {
		this.setupMessageHandlers();
	}

	private setupMessageHandlers(): void {
		self.onmessage = async (event: MessageEvent<WorkerMessageType>) => {
			const message = event.data;

			try {
				switch (message.type) {
					case 'init':
						await this.handleInit(message as WorkerInitMessage);
						break;

					case 'process':
						await this.handleProcess(message as WorkerProcessMessage);
						break;

					case 'capabilities':
						await this.handleCapabilities(message);
						break;

					default:
						this.sendError(message.id, {
							type: 'unknown',
							message: `Unknown message type: ${(message as any).type}`
						});
				}
			} catch (error) {
				this.sendError(message.id, {
					type: 'unknown',
					message: 'Worker error',
					details: error instanceof Error ? error.message : String(error)
				});
			}
		};
	}

	private async handleInit(message: WorkerInitMessage): Promise<void> {
		try {
			// Dynamic import of worker-safe WASM module
			const { initializeWasm } = await import('../wasm/worker-load.js');

			// Initialize and get the WASM module
			this.wasmModule = await initializeWasm();

			// Create vectorizer instance
			this.vectorizer = new this.wasmModule.WasmVectorizer();

			// Check capabilities
			const capabilities = this.checkCapabilities();

			this.isInitialized = true;

			// Send success response with capabilities
			self.postMessage({
				id: message.id,
				type: 'result',
				result: {
					initialized: true,
					capabilities: capabilities
				}
			});
		} catch (error) {
			this.sendError(message.id, {
				type: 'unknown',
				message: 'Failed to initialize worker',
				details: error instanceof Error ? error.message : String(error)
			});
		}
	}

	private checkCapabilities(): WasmCapabilityReport {
		if (!this.wasmModule) {
			return {
				threading_supported: false,
				shared_array_buffer: false,
				cross_origin_isolated: false,
				web_workers: typeof Worker !== 'undefined',
				proper_headers: false,
				environment_type: 'unknown',
				is_node_js: false,
				atomics_supported: typeof Atomics !== 'undefined',
				webgpu_supported: false,
				webgl2_supported: false,
				gpu_backend: 'none',
				missing_requirements: ['WASM module not initialized'],
				diagnostics: [],
				// Legacy compatibility
				shared_array_buffer_available: false,
				hardware_concurrency: 1,
				recommendations: ['Initialize WASM module first']
			};
		}

		try {
			// Use WASM module's capability detection if available
			if (typeof this.wasmModule.check_threading_requirements === 'function') {
				return this.wasmModule.check_threading_requirements();
			}

			// Fallback to basic capability detection
			const threading_supported =
				typeof this.wasmModule.is_threading_supported === 'function'
					? this.wasmModule.is_threading_supported()
					: false;

			const shared_array_buffer = typeof SharedArrayBuffer !== 'undefined';
			const cross_origin_isolated =
				typeof self !== 'undefined' && 'crossOriginIsolated' in self
					? self.crossOriginIsolated
					: false;

			return {
				threading_supported,
				shared_array_buffer,
				cross_origin_isolated,
				web_workers: typeof Worker !== 'undefined',
				proper_headers: cross_origin_isolated,
				environment_type: 'web-worker',
				is_node_js: false,
				atomics_supported: typeof Atomics !== 'undefined',
				webgpu_supported: false, // Will be detected later
				webgl2_supported: false, // Will be detected later
				gpu_backend: 'none',
				missing_requirements: [],
				diagnostics: [],
				// Legacy compatibility
				shared_array_buffer_available: shared_array_buffer,
				hardware_concurrency:
					typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 1 : 1,
				recommendations: threading_supported ? [] : ['Single-threaded mode']
			};
		} catch (error) {
			const shared_array_buffer = typeof SharedArrayBuffer !== 'undefined';
			const cross_origin_isolated =
				typeof self !== 'undefined' && 'crossOriginIsolated' in self
					? self.crossOriginIsolated
					: false;

			return {
				threading_supported: false,
				shared_array_buffer,
				cross_origin_isolated,
				web_workers: typeof Worker !== 'undefined',
				proper_headers: cross_origin_isolated,
				environment_type: 'web-worker-error',
				is_node_js: false,
				atomics_supported: typeof Atomics !== 'undefined',
				webgpu_supported: false,
				webgl2_supported: false,
				gpu_backend: 'none',
				missing_requirements: ['WASM capability check failed'],
				diagnostics: [{ error: String(error) }],
				// Legacy compatibility
				shared_array_buffer_available: shared_array_buffer,
				hardware_concurrency:
					typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 1 : 1,
				recommendations: ['Check browser support and CORS headers']
			};
		}
	}

	private configureVectorizer(config: AlgorithmConfig): void {
		if (!this.vectorizer) {
			throw new Error('Vectorizer not initialized');
		}

		// Debug: Log the configuration being sent
		console.log('[VectorizerWorker] Configuration being sent to WASM:', {
			algorithm: config.algorithm,
			noiseFiltering: config.noiseFiltering,
			noiseFilterSpatialSigma: config.noiseFilterSpatialSigma,
			noiseFilterRangeSigma: config.noiseFilterRangeSigma,
			enableBackgroundRemoval: config.enableBackgroundRemoval,
			backgroundRemovalStrength: config.backgroundRemovalStrength,
			backgroundRemovalAlgorithm: config.backgroundRemovalAlgorithm
		});

		// Try to use the batch API first (now supports noiseFiltering)
		const hasBatchAPI = typeof this.vectorizer.apply_config_json === 'function';

		if (hasBatchAPI) {
			try {
				const configJson = JSON.stringify(config);
				console.log('[VectorizerWorker] Using batch configuration API');
				const startTime = performance.now();
				this.vectorizer.apply_config_json(configJson);
				const endTime = performance.now();
				console.log(
					`[VectorizerWorker] Batch config applied in ${(endTime - startTime).toFixed(2)}ms`
				);

				// Note: backgroundRemovalAlgorithm still needs individual setter
				if (
					'backgroundRemovalAlgorithm' in config &&
					config.backgroundRemovalAlgorithm !== undefined
				) {
					console.log(`[VectorizerWorker] Setting background removal algorithm to: ${config.backgroundRemovalAlgorithm}`);
					if (typeof this.vectorizer.set_background_removal_algorithm === 'function') {
						this.vectorizer.set_background_removal_algorithm(config.backgroundRemovalAlgorithm);
					}
				}
				return;
			} catch (error) {
				console.error('[VectorizerWorker] Batch configuration failed:', error);
			}
		}

		// Fallback to detailed individual setter approach
		console.log(
			'[VectorizerWorker] Using individual setter methods (batch API unavailable or failed)'
		);
		this.configureVectorizerDetailed(config);
	}

	// Detailed configuration method that sets each parameter individually
	// This ensures ALL parameters are properly applied, including preprocessing
	private configureVectorizerDetailed(config: AlgorithmConfig): void {
		// Apply preset if specified through hand-drawn preset (only for edge and centerline)
		if (
			(config.algorithm === 'edge' || config.algorithm === 'centerline') &&
			'handDrawnPreset' in config &&
			config.handDrawnPreset !== 'none'
		) {
			this.vectorizer.use_preset(config.handDrawnPreset);
		}

		// Configure backend
		this.vectorizer.set_backend(config.algorithm);

		// Configure core settings
		this.vectorizer.set_detail(config.detail || 0.5);
		this.vectorizer.set_stroke_width(config.strokeWidth || 1.2);

		// Configure multi-pass processing (Edge/Centerline specific)
		if ('enableMultipass' in config) {
			this.vectorizer.set_multipass(config.enableMultipass || false);
		}
		if ('noiseFiltering' in config) {
			this.vectorizer.set_noise_filtering(config.noiseFiltering || false);
		}
		// Set noise filter parameters if noise filtering is enabled
		if (config.noiseFiltering) {
			if ('noiseFilterSpatialSigma' in config && config.noiseFilterSpatialSigma !== undefined) {
				if (typeof this.vectorizer.set_noise_filter_spatial_sigma === 'function') {
					this.vectorizer.set_noise_filter_spatial_sigma(config.noiseFilterSpatialSigma);
				}
			}
			if ('noiseFilterRangeSigma' in config && config.noiseFilterRangeSigma !== undefined) {
				if (typeof this.vectorizer.set_noise_filter_range_sigma === 'function') {
					this.vectorizer.set_noise_filter_range_sigma(config.noiseFilterRangeSigma);
				}
			}
		}
		if ('enableReversePass' in config) {
			this.vectorizer.set_reverse_pass(config.enableReversePass || false);
		}
		if ('enableDiagonalPass' in config) {
			this.vectorizer.set_diagonal_pass(config.enableDiagonalPass || false);
		}

		// Configure artistic effects (only for edge and centerline)
		if (
			(config.algorithm === 'edge' || config.algorithm === 'centerline') &&
			'handDrawnPreset' in config &&
			config.handDrawnPreset
		) {
			this.vectorizer.set_hand_drawn_preset(config.handDrawnPreset);
		}
		if ('handDrawnVariableWeights' in config) {
			this.vectorizer.set_custom_variable_weights(config.handDrawnVariableWeights || 0);
		}
		if ('handDrawnTremorStrength' in config) {
			this.vectorizer.set_custom_tremor(config.handDrawnTremorStrength || 0);
		}
		if ('handDrawnTapering' in config) {
			this.vectorizer.set_custom_tapering(config.handDrawnTapering || 0);
		}

		// Configure advanced features (Edge specific)
		if ('enableEtfFdog' in config) {
			this.vectorizer.set_enable_etf_fdog(config.enableEtfFdog || false);
		}
		if ('enableFlowTracing' in config) {
			this.vectorizer.set_enable_flow_tracing(config.enableFlowTracing || false);
		}
		if ('enableBezierFitting' in config) {
			this.vectorizer.set_enable_bezier_fitting(config.enableBezierFitting || false);
		}

		// Configure background removal preprocessing
		if ('enableBackgroundRemoval' in config && config.enableBackgroundRemoval !== undefined) {
			this.vectorizer.enable_background_removal(config.enableBackgroundRemoval);
		}
		if ('backgroundRemovalStrength' in config && config.backgroundRemovalStrength !== undefined) {
			this.vectorizer.set_background_removal_strength(config.backgroundRemovalStrength);
		}
		if ('backgroundRemovalAlgorithm' in config && config.backgroundRemovalAlgorithm !== undefined) {
			console.log(`[VectorizerWorker] Setting background removal algorithm (fallback) to: ${config.backgroundRemovalAlgorithm}`);
			this.vectorizer.set_background_removal_algorithm(config.backgroundRemovalAlgorithm);
		}

		// Configure dots-specific settings
		if (config.algorithm === 'dots') {
			const dotsConfig = config as any; // Type assertion for dots-specific properties
			if (dotsConfig.dotDensityThreshold !== undefined) {
				this.vectorizer.set_dot_density(dotsConfig.dotDensityThreshold);
			}
			if (dotsConfig.dotMinRadius !== undefined && dotsConfig.dotMaxRadius !== undefined) {
				this.vectorizer.set_dot_size_range(dotsConfig.dotMinRadius, dotsConfig.dotMaxRadius);
			}
			if (dotsConfig.dotPreserveColors !== undefined) {
				this.vectorizer.set_preserve_colors(dotsConfig.dotPreserveColors);
			}
			if (dotsConfig.dotAdaptiveSizing !== undefined) {
				this.vectorizer.set_adaptive_sizing(dotsConfig.dotAdaptiveSizing);
			}
			if (dotsConfig.dotBackgroundTolerance !== undefined) {
				this.vectorizer.set_background_tolerance(dotsConfig.dotBackgroundTolerance);
			}
		}

		// Validate configuration
		this.vectorizer.validate_config();
	}

	private async handleProcess(message: WorkerProcessMessage): Promise<void> {
		if (!this.isInitialized || !this.vectorizer) {
			this.sendError(message.id, {
				type: 'unknown',
				message: 'Worker not initialized. Call init first.'
			});
			return;
		}

		try {
			// Configure the vectorizer
			this.configureVectorizer(message.config);

			// Progress callback to send updates to main thread
			const onProgress = (stage: string, progress: number, elapsed: number) => {
				const progressData: ProcessingProgress = {
					stage,
					progress: Math.round(progress * 100),
					elapsed_ms: elapsed,
					estimated_remaining_ms: elapsed > 0 ? (elapsed / progress) * (1 - progress) : undefined
				};

				const progressMessage: WorkerProgressMessage = {
					id: message.id,
					type: 'progress',
					progress: progressData
				};
				self.postMessage(progressMessage);
			};

			const startTime = performance.now();

			// Process the image with progress callback
			const svg = this.vectorizer.vectorize_with_progress(message.image_data, onProgress);

			const endTime = performance.now();
			const processingTime = endTime - startTime;

			// Create result
			const result: ProcessingResult = {
				svg,
				processing_time_ms: processingTime,
				config_used: message.config,
				statistics: {
					input_dimensions: [message.image_data.width, message.image_data.height],
					paths_generated: this.countSvgPaths(svg),
					compression_ratio: this.calculateCompressionRatio(message.image_data, svg)
				}
			};

			// Add dots count for dots backend
			if (message.config.algorithm === 'dots') {
				result.statistics!.dots_generated = this.countSvgDots(svg);
			}

			// Send result back to main thread
			const resultMessage: WorkerResultMessage = {
				id: message.id,
				type: 'result',
				result
			};
			self.postMessage(resultMessage);
		} catch (error) {
			const vectorizerError: VectorizerError = {
				type: 'processing',
				message: 'Processing failed',
				details: error instanceof Error ? error.message : String(error)
			};
			this.sendError(message.id, vectorizerError);
		}
	}

	private async handleCapabilities(message: WorkerMessageType): Promise<void> {
		try {
			const capabilities = this.checkCapabilities();

			const capabilitiesMessage: WorkerCapabilitiesMessage = {
				id: message.id,
				type: 'capabilities',
				capabilities
			};
			self.postMessage(capabilitiesMessage);
		} catch (error) {
			this.sendError(message.id, {
				type: 'unknown',
				message: 'Failed to check capabilities',
				details: error instanceof Error ? error.message : String(error)
			});
		}
	}

	private sendError(messageId: string, error: VectorizerError): void {
		const errorMessage: WorkerErrorMessage = {
			id: messageId,
			type: 'error',
			error
		};
		self.postMessage(errorMessage);
	}

	// Helper methods
	private countSvgPaths(svg: string): number {
		const pathMatches = svg.match(/<path[^>]*>/g);
		return pathMatches ? pathMatches.length : 0;
	}

	private countSvgDots(svg: string): number {
		const circleMatches = svg.match(/<circle[^>]*>/g);
		const ellipseMatches = svg.match(/<ellipse[^>]*>/g);
		return (
			(circleMatches ? circleMatches.length : 0) + (ellipseMatches ? ellipseMatches.length : 0)
		);
	}

	private calculateCompressionRatio(imageData: ImageData, svg: string): number {
		const imageSize = imageData.width * imageData.height * 4; // 4 bytes per pixel (RGBA)
		const svgSize = new TextEncoder().encode(svg).length;
		return svgSize / imageSize;
	}
}

// Initialize the worker
new VectorizerWorker();
