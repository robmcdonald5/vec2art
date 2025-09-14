/**
 * Proper WASM module loader following wasm-bindgen documentation
 * This implementation follows the research findings to avoid LinkError issues
 */

import { browser } from '$app/environment';
import { analytics, getBrowserInfo, getDeviceType as _getDeviceType } from '$lib/utils/analytics';
import { iosCompatibility, applyIOSWorkarounds } from '$lib/services/ios-compatibility';

/**
 * Detect browser type for GPU optimization
 */
function detectBrowser(): {
	name: string;
	version: string | null;
	isFirefox: boolean;
	isChrome: boolean;
} {
	// Handle Node.js test environment where navigator is undefined
	if (typeof navigator === 'undefined' || !navigator.userAgent) {
		return { name: 'Unknown', version: null, isFirefox: false, isChrome: false };
	}

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
	} catch (_error) {
		// Suppress all GPU errors - CPU fallback is always available
		console.log('[WASM Loader] ℹ️ GPU initialization skipped, CPU processing available');
	}
}

/**
 * Firefox-optimized GPU initialization (minimal, error-suppressed)
 */
async function initializeFirefoxGPU(_wasmJs: any): Promise<void> {
	try {
		// Firefox: Skip WebGPU coordination entirely, just check basic GPU status
		const gpuStatus = await getGpuStatus();

		if (gpuStatus.accelerationSupported) {
			console.log('[WASM Loader] ✅ GPU Acceleration Available: CPU fallback with GPU detection');
		}

		// Firefox: Don't attempt WASM GPU initialization - it will fail
		// WASM module will use CPU processing which is faster and more reliable in Firefox
		console.log('[WASM Loader] ℹ️ Firefox: Using optimized CPU processing (recommended)');
	} catch (_error) {
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
				} catch (_propertyError) {
					// Ignore property definition errors
				}
			} else {
				console.log('[WASM Loader] 🚫 Could not reserve coordinated WebGPU device');
			}
		} else {
			console.log(
				'[WASM Loader] 🚫 High memory pressure detected, skipping GPU for WASM:',
				memoryStatus.reason
			);
		}
	} catch (_coordinationError) {
		console.log('[WASM Loader] ℹ️ WebGPU coordination not available, using CPU processing');
		canUseGPU = false; // Set flag instead of returning
	}

	// Only proceed with GPU initialization if coordination succeeded
	if (canUseGPU) {
		try {
			const gpuStatus = await getGpuStatus();
			if (gpuStatus.accelerationSupported) {
				console.log(
					`[WASM Loader] ✅ GPU Acceleration Available: ${gpuStatus.gpuBackend.toUpperCase()} backend detected`
				);
				console.log(`[WASM Loader] 🚀 GPU Status: ${gpuStatus.message}`);

				// Initialize GPU processing if possible (with error suppression)
				if (wasmJs.initialize_gpu_processing) {
					try {
						await wasmJs.initialize_gpu_processing();
						console.log('[WASM Loader] ✅ GPU processing pipeline initialized successfully');
					} catch (_gpuError) {
						// Release the reserved device on failure
						if (wasmJs._deviceManager) {
							wasmJs._deviceManager.releaseDevice('wasm-vectorizer');
						}
						console.log(
							'[WASM Loader] ℹ️ GPU initialization fallback complete, CPU processing ready'
						);
					}
				}
			} else {
				console.log('[WASM Loader] ℹ️ GPU capabilities detected, CPU processing optimized');
				// Release device if GPU capabilities check failed
				if (wasmJs._deviceManager) {
					wasmJs._deviceManager.releaseDevice('wasm-vectorizer');
				}
			}
		} catch (_gpuError) {
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

	// iOS detection and compatibility configuration
	const compatibilityInfo = iosCompatibility.getCompatibilityInfo();
	if (compatibilityInfo.isIOSSafari) {
		console.log(
			'[WASM Loader] 📱 iOS Safari detected - applying comprehensive compatibility settings'
		);
		iosCompatibility.logCompatibilityInfo();

		// Apply iOS-specific configuration based on device capabilities and version
		options = {
			...options,
			initializeThreads: false, // Always disable native threading on iOS
			threadCount: 1 // Single-threaded architecture
		};

		console.log('[WASM Loader] iOS Configuration Applied:', {
			device: compatibilityInfo.isIPad ? 'iPad' : compatibilityInfo.isIPhone ? 'iPhone' : 'iOS',
			version: compatibilityInfo.iOSVersion,
			safari: compatibilityInfo.safariVersion,
			memoryLimit: `${compatibilityInfo.recommendedConfig.memoryPagesLimit * 64}KB`,
			fallbackMode: compatibilityInfo.recommendedConfig.useFallbackMode
		});
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

			// Use robust WASM loading with Safari fallback
			const { loadWasm } = await import('./loadWasm');
			const wasmUrl = new URL('./vectorize_wasm_bg.wasm', import.meta.url).href;

			console.log('[WASM Loader] Using robust WASM loader with streaming fallback');
			const wasmResult = await loadWasm(wasmUrl, {});

			// Apply iOS workarounds if needed
			let wasmConfig: any;
			if (compatibilityInfo.isIOSSafari) {
				console.log('[WASM Loader] 🔧 Applying iOS-specific WASM configuration...');
				wasmConfig = applyIOSWorkarounds({ module: wasmResult.module });
			} else {
				wasmConfig = { module: wasmResult.module };
			}

			await wasmJs.default(wasmConfig);
			console.log('[WASM Loader] WASM module initialized with platform-specific configuration');

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
			console.log(
				'[WASM Loader] Using Web Worker-based parallelization (native threading disabled)'
			);

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
			if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
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
	return !!(
		wasmModule &&
		(wasmModule as any)._coordinatedDeviceInfo &&
		(wasmModule as any)._deviceManager
	);
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
 * Initialize thread pool separately (for lazy loading) - Single-threaded mode
 */
export async function initializeThreadPool(_threadCount?: number): Promise<boolean> {
	if (!wasmModule) {
		throw new Error('WASM module not loaded. Call loadVectorizer() first.');
	}

	// Single-threaded mode: no thread pool initialization needed
	console.log('[WASM Loader] Using single-threaded mode (no threading support)');
	console.log('[WASM Loader] Thread pool initialization skipped - single-threaded architecture');

	// Always return false for single-threaded architecture
	return false;
}

/**
 * Check if thread pool is initialized - Single-threaded mode
 */
export function isThreadPoolInitialized(): boolean {
	// Single-threaded architecture - thread pool never initialized
	return false;
}

/**
 * Get current thread count - Single-threaded mode
 */
export function getCurrentThreadCount(): number {
	// Single-threaded architecture - always 1 thread
	return 1;
}

/**
 * Get maximum available threads - Single-threaded mode
 */
export function getMaxThreads(): number {
	// Single-threaded architecture - always 1 thread maximum
	return 1;
}

/**
 * Get recommended thread count based on system - Single-threaded mode
 */
export function getRecommendedThreadCount(): number {
	// Single-threaded architecture - always recommend 1 thread
	return 1;
}

/**
 * Resize thread pool to a new thread count - Single-threaded mode
 */
export async function resizeThreadPool(_newThreadCount: number): Promise<boolean> {
	// Single-threaded architecture - resizing not supported
	console.log('[WASM Loader] Thread pool resizing skipped - single-threaded architecture');
	return false;
}

/**
 * Cleanup thread pool and resources - Single-threaded mode
 */
export async function cleanupThreadPool(): Promise<void> {
	// Single-threaded architecture - no thread pool to cleanup
	console.log('[WASM Loader] Cleanup skipped - single-threaded architecture');
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
			webgpuManagerStatus = await webgpuDeviceManager.getSystemStatus();
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
			const hasSoftwareFallback =
				webgpuManagerStatus?.hasSoftwareFallback && webgpuManagerStatus?.canAllocate;

			// Override WASM module response if we have WebGPU Manager coordination
			if (!hasHardwareGPU && hasSoftwareFallback) {
				console.log(
					'[WASM Loader] 🔧 Overriding WASM GPU detection with WebGPU Manager software fallback'
				);
			}

			if (hasHardwareGPU || hasSoftwareFallback) {
				status = 'enabled'; // GPU is available for use (hardware or software fallback)
			} else {
				status = 'not-available'; // No GPU support at all
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
