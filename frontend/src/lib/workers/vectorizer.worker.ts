/**
 * Web Worker for off-main-thread WASM vectorization
 * Handles image processing without blocking the UI
 */

import type {
	WorkerMessageType,
	WorkerInitMessage,
	WorkerProcessMessage,
	WorkerProgressMessage,
	WorkerResultMessage,
	WorkerErrorMessage,
	WorkerCapabilitiesMessage,
	VectorizerError,
	ProcessingProgress,
	VectorizerConfig,
	ProcessingResult,
	WasmCapabilityReport
} from '../types/vectorizer';

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
				shared_array_buffer_available: false,
				cross_origin_isolated: false,
				hardware_concurrency: 1,
				missing_requirements: ['WASM module not initialized'],
				recommendations: ['Initialize WASM module first']
			};
		}

		try {
			// Use basic capability detection since many methods don't exist
			const threading_supported =
				typeof this.wasmModule.is_threading_supported === 'function'
					? this.wasmModule.is_threading_supported()
					: false;

			return {
				threading_supported,
				shared_array_buffer_available: typeof SharedArrayBuffer !== 'undefined',
				cross_origin_isolated:
					typeof self !== 'undefined' && 'crossOriginIsolated' in self
						? self.crossOriginIsolated
						: false,
				hardware_concurrency:
					typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 1 : 1,
				missing_requirements: [],
				recommendations: threading_supported ? [] : ['Single-threaded mode']
			};
		} catch (error) {
			return {
				threading_supported: false,
				shared_array_buffer_available: typeof SharedArrayBuffer !== 'undefined',
				cross_origin_isolated:
					typeof crossOriginIsolated !== 'undefined' ? crossOriginIsolated : false,
				hardware_concurrency:
					typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 1 : 1,
				missing_requirements: ['WASM capability check failed'],
				recommendations: ['Check browser support and CORS headers']
			};
		}
	}

	private configureVectorizer(config: VectorizerConfig): void {
		if (!this.vectorizer) {
			throw new Error('Vectorizer not initialized');
		}

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
		if (config.hand_drawn_preset) {
			this.vectorizer.set_hand_drawn_preset(config.hand_drawn_preset);
		}
		if (config.variable_weights) {
			this.vectorizer.set_custom_variable_weights(config.variable_weights);
		}
		if (config.tremor_strength) {
			this.vectorizer.set_custom_tremor(config.tremor_strength);
		}
		if (config.tapering) {
			this.vectorizer.set_custom_tapering(config.tapering);
		}

		this.vectorizer.set_enable_etf_fdog(config.enable_etf_fdog);
		this.vectorizer.set_enable_flow_tracing(config.enable_flow_tracing);
		this.vectorizer.set_enable_bezier_fitting(config.enable_bezier_fitting);

		// Configure background removal preprocessing
		if (config.enable_background_removal !== undefined) {
			console.log(`[VectorizerWorker] Setting background removal: ${config.enable_background_removal}`);
			this.vectorizer.enable_background_removal(config.enable_background_removal);
		}
		if (config.background_removal_strength !== undefined) {
			console.log(`[VectorizerWorker] Setting background removal strength: ${config.background_removal_strength}`);
			this.vectorizer.set_background_removal_strength(config.background_removal_strength);
		}
		if (config.background_removal_algorithm !== undefined) {
			console.log(`[VectorizerWorker] Setting background removal algorithm: ${config.background_removal_algorithm}`);
			this.vectorizer.set_background_removal_algorithm(config.background_removal_algorithm);
		}
		if (config.background_removal_threshold !== undefined) {
			console.log(`[VectorizerWorker] Setting background removal threshold: ${config.background_removal_threshold}`);
			this.vectorizer.set_background_removal_threshold(config.background_removal_threshold);
		}

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
			if (message.config.backend === 'dots') {
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
