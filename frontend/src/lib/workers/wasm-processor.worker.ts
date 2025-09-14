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
import { calculateMultipassConfig } from '../types/vectorizer';
import { devLog } from '../utils/dev-logger';

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
	type: 'init' | 'process' | 'capabilities';
	image_data?: ImageData;
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
let wasmInstance: any = null;

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
		wasmInstance = await init();

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

			case 'process':
				const { image_data, config } = event.data;
				if (!image_data || !config) {
					throw new Error('Missing image data or config');
				}

				const result = await processImage(image_data, config);
				self.postMessage({
					id,
					type: 'result',
					data: result
				} as WorkerResponse);
				break;

			case 'capabilities':
				self.postMessage({
					id,
					type: 'result',
					data: getCapabilities()
				} as WorkerResponse);
				break;

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
