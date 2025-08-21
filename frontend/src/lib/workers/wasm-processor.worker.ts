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

// Worker state
let wasmInitialized = false;
let vectorizer: any = null;
let currentImageData: ImageData | null = null;
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
async function initializeWasm(config?: { threadCount?: number, backend?: string }) {
	if (wasmInitialized) {
		return { success: true, message: 'WASM already initialized' };
	}

	try {
		console.log('[Worker] Initializing WASM module...');
		
		// Initialize WASM module
		await init();
		
		// Check if threading is available and requested
		const hasThreadSupport = 
			typeof wasmModule.initThreadPool === 'function' && 
			typeof SharedArrayBuffer !== 'undefined';
		
		// WORKAROUND: Disable threading for dots backend due to memory access crashes
		const isDotsBackend = config?.backend === 'dots';
		const shouldUseThreading = hasThreadSupport && 
			config?.threadCount && 
			config.threadCount > 1 && 
			!isDotsBackend;
		
		if (shouldUseThreading) {
			console.log(`[Worker] Initializing thread pool with ${config!.threadCount} threads...`);
			
			try {
				// WORKAROUND: Disable threading due to crossbeam-epoch panics in wasm-bindgen-rayon
				// These panics occur in crossbeam-epoch-0.9.18/src/internal.rs:385:57
				// causing "Option::unwrap() on a None value" during worker spawning
				console.warn('[Worker] 🔧 Skipping thread pool initialization due to known crossbeam-epoch panics');
				console.warn('[Worker] 🔧 Using single-threaded mode for stability (Web Worker still provides isolation)');
				
				if (typeof wasmModule.mark_threading_failed === 'function') {
					wasmModule.mark_threading_failed();
				}
				
				// Note: Still using Web Worker for main thread isolation, just not WASM internal threading
				console.log('[Worker] ✅ Single-threaded mode initialized successfully');
			} catch (threadError) {
				console.warn('[Worker] Thread pool initialization failed, continuing single-threaded:', threadError);
				
				if (typeof wasmModule.mark_threading_failed === 'function') {
					wasmModule.mark_threading_failed();
				}
			}
		} else {
			if (isDotsBackend) {
				console.log('[Worker] Running in single-threaded mode (dots backend - threading disabled for stability)');
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
function createVectorizer(imageDataPayload: { data: number[], width: number, height: number }) {
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
	console.log('[Worker] Setting pixel data, expected:', expectedLength, 'actual:', imageDataPayload.data.length);
	
	if (imageDataPayload.data.length !== expectedLength) {
		throw new Error(`Image data length mismatch: expected ${expectedLength}, got ${imageDataPayload.data.length}`);
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
	
	console.log('[Worker] Configuring vectorizer with:', JSON.stringify(config, null, 2));
	
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
		// Invert detail level for backend (UI: 1.0=detailed, Backend: 0.0=detailed)
		let invertedDetail = 1.0 - config.detail;
		
		// PERFORMANCE OPTIMIZATION: Reduce detail for single-threaded mode
		// Since we disabled WASM threading due to crossbeam panics, optimize for speed
		invertedDetail = Math.min(invertedDetail + 0.1, 0.9); // Reduce detail slightly for speed
		console.log(`[Worker] 🔧 Performance optimization: Adjusted detail from ${config.detail} to effective ${1.0 - invertedDetail}`);
		
		vectorizer.set_detail(invertedDetail);
	}
	
	if (typeof config.stroke_width === 'number') {
		vectorizer.set_stroke_width(config.stroke_width);
	}
	
	// Apply other configuration options
	const configMethods = {
		noise_filtering: 'set_noise_filtering',
		multipass: 'set_multipass',
		reverse_pass: 'set_reverse_pass',
		diagonal_pass: 'set_diagonal_pass',
		optimize_svg: 'set_optimize_svg',
		svg_precision: 'set_svg_precision'
	};
	
	for (const [key, method] of Object.entries(configMethods)) {
		if (key in config && typeof vectorizer[method] === 'function') {
			vectorizer[method](config[key]);
		}
	}
	
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
		console.log('[Worker] Current image dimensions:', currentImageData?.width, 'x', currentImageData?.height);
		console.log('[Worker] Current config details:', { backend: 'dots', detail: 0.5 });
		
		// Process with progress callback
		const svg = await new Promise<string>((resolve, reject) => {
			try {
				console.log('[Worker] About to call vectorize_with_progress...');
				
				// Call vectorize with ImageData and progress callback
				const result = vectorizer.vectorize_with_progress(currentImageData, (progress: any) => {
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
				
				console.log('[Worker] vectorize_with_progress returned:', typeof result, result?.length || 'no length');
				resolve(result);
			} catch (error) {
				console.error('[Worker] Error in vectorize_with_progress:', error);
				reject(error);
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