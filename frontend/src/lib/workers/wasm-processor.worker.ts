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

// Early logging to confirm worker execution
console.log('[Worker] 🚀 WASM Worker starting up with STATIC imports...');
console.log('[Worker] ✅ All imports loaded successfully');

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

/**
 * Message interface for communication with main thread
 */
interface WorkerMessage {
	id: string;
	type: 'init' | 'process' | 'capabilities' | 'cleanup';
	payload?: {
		imageData?: {
			data: number[];
			width: number;
			height: number;
		};
		config?: any;
		preferGpu?: boolean;
	};
	// Legacy direct properties for backward compatibility
	imageData?: {
		data: number[];
		width: number;
		height: number;
	};
	config?: any;
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
		console.log('[Worker] ⚡ WASM already initialized');
		return;
	}

	try {
		console.log('[Worker] 🔧 Initializing WASM module...');

		// Initialize WASM
		_wasmInstance = await init();

		console.log('[Worker] ✅ WASM module initialized successfully');
		console.log('[Worker] 📋 Available WASM exports:', Object.keys(wasmModule));

		wasmInitialized = true;
	} catch (error) {
		console.error('[Worker] ❌ WASM initialization failed:', error);
		throw new Error(`WASM initialization failed: ${error}`);
	}
}

/**
 * Process image using WASM
 */
async function processImage(imageData: ImageData, config: any): Promise<any> {
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

		// CRITICAL FIX: Apply the config to the vectorizer before processing
		// This was the missing piece causing settings to be ignored
		console.log('[Worker] 🔧 Applying config to vectorizer:', config);

		// Apply backend
		if (config.backend) {
			vectorizer.set_backend(config.backend);
		}

		// Apply core settings
		if (config.detail !== undefined) {
			vectorizer.set_detail(config.detail);
		}
		if (config.stroke_width !== undefined) {
			vectorizer.set_stroke_width(config.stroke_width);
		}
		if (config.noise_filtering !== undefined) {
			vectorizer.set_noise_filtering(config.noise_filtering);
		}

		// Apply multipass settings
		if (config.multipass !== undefined) {
			vectorizer.set_multipass(config.multipass);
		}
		if (config.pass_count !== undefined && config.pass_count > 0) {
			vectorizer.set_pass_count(config.pass_count);
		}
		if (config.reverse_pass !== undefined) {
			vectorizer.set_reverse_pass(config.reverse_pass);
		}
		if (config.diagonal_pass !== undefined) {
			vectorizer.set_diagonal_pass(config.diagonal_pass);
		}

		// Apply hand-drawn settings
		if (config.hand_drawn_preset !== undefined) {
			vectorizer.set_hand_drawn_preset(config.hand_drawn_preset);
		}

		console.log('[Worker] ✅ Config applied to vectorizer, starting processing...');

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

		console.log('[Worker] ✅ Image processing completed');

		return {
			svg: result.svg,
			stats: result.stats,
			processing_time: result.processing_time
		};
	} catch (error) {
		console.error('[Worker] ❌ Image processing failed:', error);
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
				console.log('[Worker] 🔍 [SETTINGS DEBUG] Received config:', {
					hasConfig: !!config,
					backend: config?.backend,
					detail: config?.detail,
					stroke_width: config?.stroke_width,
					noise_filtering: config?.noise_filtering,
					multipass: config?.multipass,
					pass_count: config?.pass_count,
					hand_drawn_preset: config?.hand_drawn_preset
				});

				if (!imageData || !config) {
					throw new Error('Missing image data or config');
				}

				// Reconstruct ImageData from serialized data
				const reconstructedImageData = new ImageData(
					new Uint8ClampedArray(imageData.data),
					imageData.width,
					imageData.height
				);

				const result = await processImage(reconstructedImageData, config);
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

			default:
				throw new Error(`Unknown message type: ${type}`);
		}
	} catch (error) {
		console.error(`[Worker] ❌ Error handling ${type}:`, error);
		self.postMessage({
			id,
			type: 'error',
			error: error instanceof Error ? error.message : String(error)
		} as WorkerResponse);
	}
});

console.log('[Worker] 🎯 Worker ready for messages');
