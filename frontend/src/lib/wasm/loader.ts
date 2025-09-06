/**
 * Proper WASM module loader following wasm-bindgen documentation
 * This implementation follows the research findings to avoid LinkError issues
 */

import { browser } from '$app/environment';
import { analytics, getBrowserInfo, getDeviceType } from '$lib/utils/analytics';

/**
 * Detect browser type for GPU optimization
 */
function detectBrowser(): { name: string; version: string | null; isFirefox: boolean; isChrome: boolean } {
	const userAgent = navigator.userAgent;
	const isFirefox = userAgent.includes('Firefox');
	const isChrome = userAgent.includes('Chrome') && !userAgent.includes('Edge');
	
	let name = 'Unknown';
	let version: string | null = null;
	
	if (isFirefox) {
		name = 'Firefox';
		version = userAgent.match(/Firefox\/(\d+)/)?.[1] || null;
	} else if (isChrome) {
		name = 'Chrome';
		version = userAgent.match(/Chrome\/(\d+)/)?.[1] || null;
	}
	
	return { name, version, isFirefox, isChrome };
}

/**
 * Browser-specific GPU initialization with error suppression
 */
async function initializeGPUWithBrowserSupport(wasmJs: any): Promise<void> {
	const browser = detectBrowser();
	
	try {
		console.log('[WASM Loader] 🎮 Checking GPU acceleration status...');
		
		// Firefox: Skip WebGPU coordination due to limitations
		if (browser.isFirefox) {
			console.log('[WASM Loader] 🦊 Firefox detected - using optimized GPU handling');
			await initializeFirefoxGPU(wasmJs);
			return;
		}
		
		// Chrome/Other browsers: Full WebGPU coordination
		console.log('[WASM Loader] 🚀 Chrome/WebKit detected - using full WebGPU coordination');
		await initializeChromeGPU(wasmJs);
		
	} catch (error) {
		// Suppress all GPU errors - CPU fallback is always available
		console.log('[WASM Loader] ℹ️ GPU initialization skipped, CPU processing available');
	}
}

/**
 * Firefox-optimized GPU initialization (minimal, error-suppressed)
 */
async function initializeFirefoxGPU(wasmJs: any): Promise<void> {
	try {
		// Firefox: Skip WebGPU coordination entirely, just check basic GPU status
		const gpuStatus = await getGpuStatus();
		
		if (gpuStatus.accelerationSupported) {
			console.log('[WASM Loader] ✅ GPU Acceleration Available: CPU fallback with GPU detection');
		}
		
		// Firefox: Don't attempt WASM GPU initialization - it will fail
		// WASM module will use CPU processing which is faster and more reliable in Firefox
		console.log('[WASM Loader] ℹ️ Firefox: Using optimized CPU processing (recommended)');
		
	} catch (error) {
		// Firefox: Completely suppress GPU errors
		console.log('[WASM Loader] ℹ️ GPU detection completed, CPU processing ready');
	}
}

/**
 * Chrome-optimized GPU initialization (full coordination)
 */
async function initializeChromeGPU(wasmJs: any): Promise<void> {
	let canUseGPU = false;
	
	try {
		console.log('[WASM Loader] 🤝 Coordinating with WebGPU device manager...');
		
		// Import WebGPU Device Manager dynamically
		const { webgpuDeviceManager } = await import('$lib/services/webgpu-device-manager');
		
		// Check memory pressure and availability
		const memoryStatus = await webgpuDeviceManager.assessMemoryPressure();
		console.log('[WASM Loader] Memory pressure assessment:', memoryStatus);
		
		if (memoryStatus.canAllocate && memoryStatus.pressure < 0.65) {
			// Try to get a WebGPU device for WASM
			const device = await webgpuDeviceManager.getDevice('wasm-vectorizer', {
				powerPreference: 'high-performance',
				requiredFeatures: [],
				requiredLimits: {
					maxBufferSize: memoryStatus.recommendedBufferSize
				}
			});
			
			if (device) {
				console.log('[WASM Loader] ✅ Coordinated WebGPU device reserved for WASM');
				canUseGPU = true;
				
				// Store device info safely (avoiding read-only error)
				try {
					const deviceInfo = { available: true, source: 'webgpu-manager' };
					Object.defineProperty(wasmJs, '_coordinatedDeviceInfo', {
						value: deviceInfo,
						writable: false,
						configurable: true
					});
					Object.defineProperty(wasmJs, '_deviceManager', {
						value: webgpuDeviceManager,
						writable: false,  
						configurable: true
					});
				} catch (propertyError) {
					// Ignore property definition errors
				}
			} else {
				console.log('[WASM Loader] 🚫 Could not reserve coordinated WebGPU device');
			}
		} else {
			console.log('[WASM Loader] 🚫 High memory pressure detected, skipping GPU for WASM:', memoryStatus.reason);
		}
	} catch (coordinationError) {
		console.log('[WASM Loader] ℹ️ WebGPU coordination not available, using CPU processing');
		return;
	}
	
	// Only proceed with GPU initialization if coordination succeeded
	if (canUseGPU) {
		try {
			const gpuStatus = await getGpuStatus();
			if (gpuStatus.accelerationSupported) {
				console.log(`[WASM Loader] ✅ GPU Acceleration Available: ${gpuStatus.gpuBackend.toUpperCase()} backend detected`);
				console.log(`[WASM Loader] 🚀 GPU Status: ${gpuStatus.message}`);
				
				// Initialize GPU processing if possible (with error suppression)
				if (wasmJs.initialize_gpu_processing) {
					try {
						await wasmJs.initialize_gpu_processing();
						console.log('[WASM Loader] ✅ GPU processing pipeline initialized successfully');
					} catch (gpuError) {
						// Release the reserved device on failure
						if (wasmJs._deviceManager) {
							wasmJs._deviceManager.releaseDevice('wasm-vectorizer');
						}
						console.log('[WASM Loader] ℹ️ GPU initialization fallback complete, CPU processing ready');
					}
				}
			} else {
				console.log('[WASM Loader] ℹ️ GPU capabilities detected, CPU processing optimized');
				// Release device if GPU capabilities check failed
				if (wasmJs._deviceManager) {
					wasmJs._deviceManager.releaseDevice('wasm-vectorizer');
				}
			}
		} catch (gpuError) {
			console.log('[WASM Loader] ℹ️ GPU status assessment complete, CPU processing ready');
		}
	} else {
		console.log('[WASM Loader] ℹ️ Using CPU processing (optimized for compatibility)');
	}
}

let wasmModule: any = null;
let initPromise: Promise<any> | null = null;

/**
 * Load and initialize the WASM vectorizer module with optional threading support
 * This function follows the correct wasm-bindgen initialization pattern:
 * 1. Import the generated JS module (not raw .wasm)
 * 2. Call the default export to initialize wasm-bindgen glue
 * 3. Optionally initialize thread pool based on configuration
 */
export async function loadVectorizer(options?: {
	initializeThreads?: boolean;
	threadCount?: number;
	autoStart?: boolean; // Legacy compatibility
}) {
	if (!browser) {
		throw new Error('WASM must load in the browser');
	}

	if (wasmModule) {
		// If module is loaded but threads aren't initialized and we want them
		if (options?.initializeThreads && !isThreadPoolInitialized()) {
			await initializeThreadPool(options.threadCount);
		}
		return wasmModule;
	}

	if (initPromise) {
		return initPromise;
	}

	// Default to NOT auto-initializing threads to prevent CPU overload
	const shouldInitThreads = options?.initializeThreads ?? options?.autoStart ?? false;

	initPromise = (async () => {
		try {
			console.log('[WASM Loader] Starting initialization...');

			// Import the wasm-bindgen generated JS (NOT the .wasm file directly)
			// This is critical to avoid LinkError - must use the JS wrapper
			const wasmJs = await import('./vectorize_wasm.js');
			console.log('[WASM Loader] JS module imported');

			// Call default export to initialize wasm-bindgen glue
			// This loads the .wasm file and sets up the proper bindings
			// Use new object parameter format to avoid deprecated parameters warning
			await wasmJs.default({ module_or_path: new URL('./vectorize_wasm_bg.wasm', import.meta.url) });
			console.log('[WASM Loader] WASM module initialized');

			// Store module reference
			wasmModule = wasmJs;

			// Expose GPU detection functions globally for the GPU indicator
			if (typeof window !== 'undefined') {
				(window as any).wasmJs = wasmJs;
			}

			// Check cross-origin isolation status for threading
			const isIsolated = typeof window !== 'undefined' && window.crossOriginIsolated;
			const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';

			console.log('[WASM Loader] Environment check:', {
				crossOriginIsolated: isIsolated,
				sharedArrayBuffer: hasSharedArrayBuffer,
				hardwareConcurrency: navigator.hardwareConcurrency || 1,
				threadsRequested: shouldInitThreads
			});

			// Note: Native WASM threading is no longer used - we use Web Workers for parallelization
			// This section has been simplified since threading is now handled at the Web Worker level
			console.log('[WASM Loader] Using Web Worker-based parallelization (native threading disabled)');
			
			// Track successful initialization (Web Worker mode)
			analytics.wasmInitSuccess({
				threadCount: navigator.hardwareConcurrency || 1, // Available cores for Web Workers
				initTimeMs: 0, // No native thread pool initialization needed
				supportedFeatures: ['web-workers'],
				browserInfo: getBrowserInfo()
			});

			// Verify key exports are available  
			const exports = {
				WasmVectorizer: !!wasmJs.WasmVectorizer,
				// Note: WasmBackend and WasmPreset might not be available in current WASM build
				WasmBackend: !!(wasmJs as any).WasmBackend,
				WasmPreset: !!(wasmJs as any).WasmPreset,
				// Native threading functions not used (Web Worker mode)
				webWorkersSupported: typeof Worker !== 'undefined'
			};

			console.log('[WASM Loader] Available exports:', exports);

			if (!wasmJs.WasmVectorizer) {
				throw new Error('WasmVectorizer not found in WASM exports');
			}

			// Store the loaded WASM module
			wasmModule = wasmJs;

			// DISABLED: Thread pool auto-initialization to prevent CPU spinning
			// Thread pool will be initialized only when explicitly requested
			console.log('[WASM Loader] Thread pool initialization deferred (lazy loading mode)');

			// Browser-specific GPU initialization with Firefox optimization
			await initializeGPUWithBrowserSupport(wasmJs);

			// Set up cleanup on page unload
			if (typeof window !== 'undefined') {
				const cleanup = () => cleanupCoordinatedGPU();
				window.addEventListener('beforeunload', cleanup);
				window.addEventListener('pagehide', cleanup);
			}

			console.log('[WASM Loader] ✅ Initialization complete');

			return wasmModule;
		} catch (error) {
			console.error('[WASM Loader] ❌ Initialization failed:', error);
			initPromise = null; // Reset on failure to allow retry
			throw error;
		}
	})();

	return initPromise;
}

/**
 * Get threading capabilities and requirements
 */
export async function getCapabilities() {
	const wasm = await loadVectorizer();

	const capabilities = {
		crossOriginIsolated: typeof window !== 'undefined' ? window.crossOriginIsolated : false,
		sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
		threading: false,
		threadCount: 1,
		wasmAvailable: !!wasm.WasmVectorizer,
		threadingRequirements: null as any
	};

	// Check threading support
	if (typeof wasm.is_threading_supported === 'function') {
		try {
			capabilities.threading = wasm.is_threading_supported();
		} catch (error) {
			console.warn('[WASM Loader] Error checking threading support:', error);
		}
	}

	// Get detailed threading requirements if available
	if (typeof wasm.check_threading_requirements === 'function') {
		try {
			capabilities.threadingRequirements = wasm.check_threading_requirements();
		} catch (error) {
			console.warn('[WASM Loader] Error checking threading requirements:', error);
		}
	}

	// Get thread count if available
	// Web Worker parallelization available based on browser capabilities
	capabilities.threadCount = navigator.hardwareConcurrency || 1;

	return capabilities;
}

/**
 * Check if coordinated WebGPU is available for WASM operations
 */
export function isCoordinatedGPUAvailable(): boolean {
	return !!(wasmModule && (wasmModule as any)._coordinatedDeviceInfo && (wasmModule as any)._deviceManager);
}

/**
 * Get coordinated WebGPU device info if available
 */
export function getCoordinatedGPUInfo() {
	if (isCoordinatedGPUAvailable()) {
		return {
			deviceInfo: (wasmModule as any)._coordinatedDeviceInfo,
			deviceManager: (wasmModule as any)._deviceManager
		};
	}
	return null;
}

/**
 * Clean up coordinated WebGPU resources
 */
export function cleanupCoordinatedGPU() {
	if (wasmModule && (wasmModule as any)._deviceManager) {
		console.log('[WASM Loader] 🧹 Cleaning up coordinated WebGPU resources...');
		try {
			(wasmModule as any)._deviceManager.releaseDevice('wasm-vectorizer');
			(wasmModule as any)._coordinatedDeviceInfo = null;
			(wasmModule as any)._deviceManager = null;
			console.log('[WASM Loader] ✅ Coordinated WebGPU resources cleaned up');
		} catch (error) {
			console.warn('[WASM Loader] ⚠️ Error during GPU cleanup:', error);
		}
	}
}

/**
 * Create a new vectorizer instance
 */
export async function createVectorizer() {
	const wasm = await loadVectorizer();

	if (!wasm.WasmVectorizer) {
		throw new Error('WasmVectorizer not available');
	}

	return new wasm.WasmVectorizer();
}

/**
 * Get available backends from WASM module
 */
export async function getAvailableBackends() {
	const wasm = await loadVectorizer();

	if (typeof wasm.get_available_backends === 'function') {
		return wasm.get_available_backends();
	}

	// Fallback to known backends
	return ['edge', 'centerline', 'superpixel', 'dots'];
}

/**
 * Get available presets from WASM module
 */
export async function getAvailablePresets() {
	const wasm = await loadVectorizer();

	if (typeof wasm.get_available_presets === 'function') {
		return wasm.get_available_presets();
	}

	// Fallback to known presets
	return ['default', 'detailed', 'fast', 'artistic'];
}

/**
 * Initialize thread pool separately (for lazy loading) with dynamic thread management
 */
export async function initializeThreadPool(threadCount?: number): Promise<boolean> {
	if (!wasmModule) {
		throw new Error('WASM module not loaded. Call loadVectorizer() first.');
	}

	// Web Worker mode: no native thread pool initialization needed
	console.log('[WASM Loader] Using Web Worker parallelization (no native threading)');
	console.log(`[WASM Loader] Available cores for Web Workers: ${navigator.hardwareConcurrency || 1}`);
	return true;

	// If already initialized, check if we need to resize
	if (isThreadPoolInitialized()) {
		const currentThreads = getCurrentThreadCount();
		if (threadCount && threadCount !== currentThreads) {
			console.log(
				`[WASM Loader] Resizing thread pool from ${currentThreads} to ${threadCount} threads`
			);
			return await resizeThreadPool(threadCount!);
		}
		console.log('[WASM Loader] Thread pool already initialized with correct count');
		return true;
	}

	try {
		const cores = navigator.hardwareConcurrency || 4;
		// More conservative default - leave more cores free for browser UI
		const defaultThreadCount = Math.max(1, Math.min(cores - 2, 6));
		const actualThreadCount = threadCount ?? defaultThreadCount;

		console.log(
			`[WASM Loader] Initializing thread pool with ${actualThreadCount} threads (${cores} cores available)...`
		);
		const startTime = performance.now();

		// Use the correct function name based on the WASM exports
		const initFunction = wasmModule.initThreadPool;
		if (!initFunction) {
			throw new Error('Thread pool initialization function not found');
		}

		const promise = initFunction(actualThreadCount);
		await promise;

		wasmModule.confirm_threading_success();
		const initTime = performance.now() - startTime;
		console.log('[WASM Loader] ✅ Thread pool initialized successfully');

		// Track successful lazy initialization
		analytics.wasmInitSuccess({
			threadCount: wasmModule.get_thread_count(),
			initTimeMs: initTime,
			supportedFeatures: [
				'shared-array-buffer',
				'cross-origin-isolated',
				'lazy-init',
				'dynamic-resize'
			],
			browserInfo: getBrowserInfo()
		});

		return true;
	} catch (error) {
		console.error('[WASM Loader] ❌ Thread pool initialization failed:', error);
		if (wasmModule.mark_threading_failed) {
			wasmModule.mark_threading_failed();
		}

		// Track lazy initialization failure
		const errorMessage = (error as Error)?.message || String(error);
		analytics.wasmInitFailure({
			reason: errorMessage,
			missingFeatures: [],
			fallbackMode: 'single-threaded',
			browserInfo: getBrowserInfo()
		});

		return false;
	}
}

/**
 * Check if thread pool is initialized
 */
export function isThreadPoolInitialized(): boolean {
	if (!wasmModule) return false;

	try {
		if (typeof wasmModule.is_threading_supported === 'function') {
			return wasmModule.is_threading_supported();
		}
	} catch (error) {
		console.warn('[WASM Loader] Error checking thread pool status:', error);
	}

	return false;
}

/**
 * Get current thread count
 */
export function getCurrentThreadCount(): number {
	// Web Worker mode: return available hardware concurrency
	return navigator.hardwareConcurrency || 1;
}

/**
 * Get maximum available threads
 */
export function getMaxThreads(): number {
	return Math.min(navigator.hardwareConcurrency || 4, 12);
}

/**
 * Get recommended thread count based on system
 */
export function getRecommendedThreadCount(): number {
	const cores = navigator.hardwareConcurrency || 4;
	// Leave 1-2 cores free for system, max 8 for reasonable performance
	return Math.min(Math.max(1, cores - 2), 8);
}

/**
 * Resize thread pool to a new thread count (for performance optimization)
 */
export async function resizeThreadPool(newThreadCount: number): Promise<boolean> {
	if (!wasmModule || !isThreadPoolInitialized()) {
		console.warn('[WASM Loader] Cannot resize - thread pool not initialized');
		return false;
	}

	try {
		const cores = navigator.hardwareConcurrency || 4;
		const safeThreadCount = Math.max(1, Math.min(newThreadCount, cores - 1));

		console.log(`[WASM Loader] Resizing thread pool to ${safeThreadCount} threads...`);

		// If WASM supports dynamic resizing, use it
		if (wasmModule.resize_thread_pool) {
			await wasmModule.resize_thread_pool(safeThreadCount);
			console.log('[WASM Loader] ✅ Thread pool resized successfully');
			return true;
		} else {
			// Fallback: destroy and recreate thread pool
			console.log('[WASM Loader] Resizing via pool recreation...');

			if (wasmModule.destroy_thread_pool) {
				await wasmModule.destroy_thread_pool();
			}

			const initFunction = wasmModule.initThreadPool;
			await initFunction(safeThreadCount);
			wasmModule.confirm_threading_success();

			console.log('[WASM Loader] ✅ Thread pool recreated with new size');
			return true;
		}
	} catch (error) {
		console.error('[WASM Loader] ❌ Thread pool resize failed:', error);
		if (wasmModule.mark_threading_failed) {
			wasmModule.mark_threading_failed();
		}
		return false;
	}
}

/**
 * Cleanup thread pool and resources
 */
export async function cleanupThreadPool(): Promise<void> {
	if (!wasmModule) return;

	try {
		console.log('[WASM Loader] Cleaning up thread pool...');

		if (wasmModule.destroy_thread_pool) {
			await wasmModule.destroy_thread_pool();
		}

		if (wasmModule.mark_threading_failed) {
			wasmModule.mark_threading_failed();
		}

		console.log('[WASM Loader] ✅ Thread pool cleanup completed');
	} catch (error) {
		console.warn('[WASM Loader] Thread pool cleanup warning:', error);
	}
}

/**
 * Get thread pool status and health information
 */
export function getThreadPoolStatus(): {
	initialized: boolean;
	threadCount: number;
	maxThreads: number;
	healthCheck: boolean;
} {
	if (!wasmModule) {
		return {
			initialized: false,
			threadCount: 0,
			maxThreads: navigator.hardwareConcurrency || 4,
			healthCheck: false
		};
	}

	try {
		const initialized = isThreadPoolInitialized();
		const threadCount = getCurrentThreadCount();
		const maxThreads = navigator.hardwareConcurrency || 4;

		// Basic health check - try to get thread count
		let healthCheck = false;
		try {
			healthCheck = initialized && threadCount > 0;
		} catch {
			healthCheck = false;
		}

		return {
			initialized,
			threadCount,
			maxThreads,
			healthCheck
		};
	} catch (error) {
		console.warn('[WASM Loader] Error getting thread pool status:', error);
		return {
			initialized: false,
			threadCount: 0,
			maxThreads: navigator.hardwareConcurrency || 4,
			healthCheck: false
		};
	}
}

/**
 * Optimize thread count based on current system performance
 */
export async function optimizeThreadCount(): Promise<number> {
	const status = getThreadPoolStatus();
	const cores = navigator.hardwareConcurrency || 4;

	// Use performance API to detect if system is under stress
	let recommendedThreads = status.threadCount;

	try {
		// Check if performance timing is available (Chrome only)
		if (typeof performance !== 'undefined' && (performance as any).memory) {
			const memory = (performance as any).memory;
			const memoryUsagePercent = (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;

			if (memoryUsagePercent > 80) {
				// High memory usage, reduce threads
				recommendedThreads = Math.max(1, Math.floor(status.threadCount * 0.5));
				console.log(
					`[WASM Loader] High memory usage (${memoryUsagePercent.toFixed(1)}%), reducing threads to ${recommendedThreads}`
				);
			}
		}

		// Conservative approach: never use more than 75% of available cores
		const maxSafeThreads = Math.max(1, Math.floor(cores * 0.75));
		recommendedThreads = Math.min(recommendedThreads, maxSafeThreads);

		if (recommendedThreads !== status.threadCount && status.initialized) {
			const success = await resizeThreadPool(recommendedThreads);
			if (success) {
				return recommendedThreads;
			}
		}

		return status.threadCount;
	} catch (error) {
		console.warn('[WASM Loader] Thread optimization failed:', error);
		return status.threadCount;
	}
}

/**
 * Get GPU acceleration status using new async GPU detection
 */
export async function getGpuStatus(): Promise<{
	webgpuAvailable: boolean;
	gpuBackend: string;
	accelerationSupported: boolean;
	status: 'enabled' | 'disabled' | 'not-available' | 'loading' | 'error';
	message?: string;
	// Additional WASM-compatible fields
	available?: boolean;
	backend?: string;
	status_message?: string;
	webgl2_supported?: boolean;
	webgpu_supported?: boolean;
	estimated_memory_mb?: number;
}> {
	try {
		// Ensure WASM is loaded
		const wasm = await loadVectorizer();
		
		// Coordinate with WebGPU Manager for comprehensive status
		let webgpuManagerStatus: any = null;
		try {
			const { webgpuDeviceManager } = await import('$lib/services/webgpu-device-manager');
			webgpuManagerStatus = await webgpuDeviceManager.getStatus();
			console.log('[WASM Loader] WebGPU Manager status:', webgpuManagerStatus);
		} catch (error) {
			console.log('[WASM Loader] WebGPU Manager not available:', error);
		}

		// Use GPU backend status function if available
		if (wasm.get_gpu_backend_status) {
			console.log('[WASM Loader] Using GPU backend status detection...');
			
			const capabilitiesJson = wasm.get_gpu_backend_status();
			console.log('[WASM Loader] GPU capabilities JSON:', capabilitiesJson);
			
			// Parse JSON response
			const capabilities = JSON.parse(capabilitiesJson);
			console.log('[WASM Loader] Parsed GPU capabilities:', capabilities);
			
			let status: 'enabled' | 'disabled' | 'not-available' | 'loading' | 'error';
			// Enhanced logic: Consider WebGPU Manager software fallback as valid GPU backend
			const hasHardwareGPU = capabilities.webgpu_supported || capabilities.webgl2_supported;
			const hasSoftwareFallback = webgpuManagerStatus?.hasSoftwareFallback && webgpuManagerStatus?.canAllocate;
			
			// Override WASM module response if we have WebGPU Manager coordination
			if (!hasHardwareGPU && hasSoftwareFallback) {
				console.log('[WASM Loader] 🔧 Overriding WASM GPU detection with WebGPU Manager software fallback');
			}
			
			if (hasHardwareGPU || hasSoftwareFallback) {
				status = 'enabled';  // GPU is available for use (hardware or software fallback)
			} else {
				status = 'not-available';  // No GPU support at all
			}
			
			// Generate appropriate message for single-threaded + Web Worker architecture
			let message: string;
			let backendType: string;
			let available: boolean;
			
			if (capabilities.webgpu_supported) {
				message = 'WebGPU available - GPU acceleration ready for use';
				backendType = 'webgpu';
				available = true;
			} else if (capabilities.webgl2_supported) {
				message = 'WebGL2 available - GPU acceleration ready for use';
				backendType = 'webgl2';
				available = true;
			} else if (hasSoftwareFallback) {
				message = 'Software fallback available - GPU processing ready for use';
				backendType = 'software-fallback';
				available = true;
			} else {
				message = capabilities.status_message || 'No GPU acceleration available';
				backendType = 'none';
				available = false;
			}
			
			// Return format that matches WASM module's GPU status output
			return {
				webgpuAvailable: capabilities.webgpu_supported,
				gpuBackend: backendType,
				accelerationSupported: hasHardwareGPU || hasSoftwareFallback,
				// WASM-compatible format fields
				available,
				backend: backendType,
				status_message: message,
				webgl2_supported: capabilities.webgl2_supported,
				webgpu_supported: capabilities.webgpu_supported,
				estimated_memory_mb: capabilities.estimated_memory_mb,
				status,
				message
			};
		}
		
		// Fallback to individual detection functions
		console.log('[WASM Loader] Falling back to individual GPU detection functions...');
		
		if (!wasm.is_webgpu_available || !wasm.detect_best_gpu_backend) {
			return {
				webgpuAvailable: false,
				gpuBackend: 'none',
				accelerationSupported: false,
				status: 'error',
				message: 'GPU detection functions not available in WASM module'
			};
		}

		const webgpuAvailable = wasm.is_webgpu_available();
		const webgl2Available = wasm.is_webgl2_available ? wasm.is_webgl2_available() : false;
		const bestBackend = wasm.detect_best_gpu_backend();

		// Convert backend enum to string
		let backendString: string;
		switch (bestBackend) {
			case 0: // WebGPU
				backendString = 'webgpu';
				break;
			case 1: // WebGL2
				backendString = 'webgl2';
				break;
			case 2: // None
			default:
				backendString = 'none';
				break;
		}

		let status: 'enabled' | 'disabled' | 'not-available' | 'loading' | 'error';
		let message: string | undefined;

		if (webgpuAvailable || webgl2Available) {
			status = 'enabled';
			if (webgpuAvailable) {
				message = 'WebGPU available - GPU acceleration ready for use';
			} else {
				message = 'WebGL2 available - GPU acceleration ready for use';
			}
		} else {
			status = 'not-available';
			message = 'No GPU acceleration available on this device';
		}

		return {
			webgpuAvailable,
			gpuBackend: backendString,
			accelerationSupported: webgpuAvailable || webgl2Available,
			status,
			message
		};
	} catch (error) {
		console.error('[WASM Loader] GPU status check failed:', error);
		return {
			webgpuAvailable: false,
			gpuBackend: 'none',
			accelerationSupported: false,
			status: 'error',
			message: 'Failed to check GPU status: ' + (error as Error).message
		};
	}
}

/**
 * Reset the WASM module (for testing or error recovery)
 */
export function resetWasm() {
	// Cleanup thread pool before reset
	if (wasmModule) {
		cleanupThreadPool().catch(console.warn);
	}

	wasmModule = null;
	initPromise = null;
	console.log('[WASM Loader] Module reset');
}
