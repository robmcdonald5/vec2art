/**
 * Proper WASM module loader following wasm-bindgen documentation
 * This implementation follows the research findings to avoid LinkError issues
 */

import { browser } from '$app/environment';
import { analytics, getBrowserInfo, getDeviceType } from '$lib/utils/analytics';

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
			await wasmJs.default(new URL('./vectorize_wasm_bg.wasm', import.meta.url));
			console.log('[WASM Loader] WASM module initialized');

			// Store module reference
			wasmModule = wasmJs;

			// Check cross-origin isolation status for threading
			const isIsolated = typeof window !== 'undefined' && window.crossOriginIsolated;
			const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';

			console.log('[WASM Loader] Environment check:', {
				crossOriginIsolated: isIsolated,
				sharedArrayBuffer: hasSharedArrayBuffer,
				hardwareConcurrency: navigator.hardwareConcurrency || 1,
				threadsRequested: shouldInitThreads
			});

			// Only initialize thread pool if explicitly requested
			if (shouldInitThreads && isIsolated && hasSharedArrayBuffer && wasmJs.initThreadPool) {
				try {
					console.log('[WASM Loader] Initializing thread pool (explicitly requested)...');
					const threadCount =
						options?.threadCount ?? Math.min(navigator.hardwareConcurrency - 1 || 4, 8); // Default: leave 1 core free, max 8

					const startTime = performance.now();
					const promise = wasmJs.initThreadPool(threadCount);
					await promise;

					// Use our fixed state management functions
					wasmJs.confirm_threading_success();
					const initTime = performance.now() - startTime;

					console.log(
						'[WASM Loader] ✅ Thread pool initialized successfully with',
						wasmJs.get_thread_count(),
						'threads'
					);

					// Track successful initialization
					analytics.wasmInitSuccess({
						threadCount: wasmJs.get_thread_count(),
						initTimeMs: initTime,
						supportedFeatures: ['shared-array-buffer', 'cross-origin-isolated', 'atomics'],
						browserInfo: getBrowserInfo()
					});
				} catch (error) {
					console.warn('[WASM Loader] ⚠️ Thread pool initialization failed:', error);
					// Mark failure using our fixed state management
					if (wasmJs.mark_threading_failed) {
						wasmJs.mark_threading_failed();
					}
					console.warn('[WASM Loader] Continuing in single-threaded mode');

					// Track initialization failure
					analytics.wasmInitFailure({
						reason: error instanceof Error ? error.message : 'Unknown error',
						missingFeatures: [],
						fallbackMode: 'single-threaded',
						browserInfo: getBrowserInfo()
					});
				}
			} else if (shouldInitThreads && !isIsolated) {
				console.log(
					'[WASM Loader] ℹ️ Threading requested but not cross-origin isolated, running in single-threaded mode'
				);

				// Track environment limitation
				analytics.wasmInitFailure({
					reason: 'Cross-origin isolation not enabled',
					missingFeatures: ['cross-origin-isolated'],
					fallbackMode: 'single-threaded',
					browserInfo: getBrowserInfo()
				});
			} else if (!shouldInitThreads) {
				console.log('[WASM Loader] ℹ️ Thread pool initialization deferred (lazy loading mode)');
			}

			// Verify key exports are available
			const exports = {
				WasmVectorizer: !!wasmJs.WasmVectorizer,
				WasmBackend: !!wasmJs.WasmBackend,
				WasmPreset: !!wasmJs.WasmPreset,
				initThreadPool: typeof wasmJs.initThreadPool === 'function',
				is_threading_supported: typeof wasmJs.is_threading_supported === 'function',
				check_threading_requirements: typeof wasmJs.check_threading_requirements === 'function',
				confirm_threading_success: typeof wasmJs.confirm_threading_success === 'function',
				mark_threading_failed: typeof wasmJs.mark_threading_failed === 'function',
				get_thread_count: typeof wasmJs.get_thread_count === 'function'
			};

			console.log('[WASM Loader] Available exports:', exports);

			if (!wasmJs.WasmVectorizer) {
				throw new Error('WasmVectorizer not found in WASM exports');
			}

			wasmModule = wasmJs;

			// DISABLED: Thread pool auto-initialization to prevent CPU spinning
			// Thread pool will be initialized only when explicitly requested
			console.log('[WASM Loader] Thread pool initialization deferred (lazy loading mode)');

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
	if (typeof wasm.get_thread_count === 'function') {
		try {
			capabilities.threadCount = wasm.get_thread_count();
		} catch (error) {
			console.warn('[WASM Loader] Error getting thread count:', error);
		}
	}

	return capabilities;
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

	const isIsolated = typeof window !== 'undefined' && window.crossOriginIsolated;
	const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';

	if (!isIsolated || !hasSharedArrayBuffer || !wasmModule.initThreadPool) {
		console.warn('[WASM Loader] Threading not available in current environment');
		return false;
	}

	// If already initialized, check if we need to resize
	if (isThreadPoolInitialized()) {
		const currentThreads = getCurrentThreadCount();
		if (threadCount && threadCount !== currentThreads) {
			console.log(
				`[WASM Loader] Resizing thread pool from ${currentThreads} to ${threadCount} threads`
			);
			return await resizeThreadPool(threadCount);
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
		analytics.wasmInitFailure({
			reason: error instanceof Error ? error.message : 'Unknown error',
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
	if (!wasmModule) return 0;

	try {
		if (typeof wasmModule.get_thread_count === 'function') {
			return wasmModule.get_thread_count();
		}
	} catch (error) {
		console.warn('[WASM Loader] Error getting thread count:', error);
	}

	return 0;
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
