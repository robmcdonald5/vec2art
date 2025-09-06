/**
 * Comprehensive unit tests for WASM loader and threading initialization system
 * Testing critical infrastructure that manages lazy loading framework preventing CPU overload
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { MockedFunction } from 'vitest';

// Mock browser environment before importing
vi.mock('$app/environment', () => ({
	browser: true
}));

// Mock analytics to prevent Vercel server environment issues
vi.mock('$lib/utils/analytics', () => ({
	analytics: {
		wasmInitSuccess: vi.fn(),
		wasmInitFailure: vi.fn(),
		vectorizationStart: vi.fn(),
		vectorizationComplete: vi.fn(),
		vectorizationError: vi.fn(),
		performanceMetrics: vi.fn(),
		featureUsage: vi.fn(),
		errorOccurred: vi.fn(),
		userBehavior: vi.fn()
	},
	getBrowserInfo: vi.fn().mockReturnValue('chrome'),
	getDeviceType: vi.fn().mockReturnValue('desktop')
}));

// Mock WASM module
const mockWasmModule = {
	default: vi.fn(),
	WasmVectorizer: vi.fn(),
	WasmBackend: {
		Edge: 'edge',
		Centerline: 'centerline',
		Superpixel: 'superpixel',
		Dots: 'dots'
	},
	WasmPreset: {
		Default: 'default',
		Detailed: 'detailed',
		Fast: 'fast',
		Artistic: 'artistic'
	},
	initThreadPool: vi.fn(),
	destroy_thread_pool: vi.fn(),
	confirm_threading_success: vi.fn(),
	mark_threading_failed: vi.fn(),
	is_threading_supported: vi.fn(),
	get_thread_count: vi.fn(),
	check_threading_requirements: vi.fn(),
	get_available_backends: vi.fn(),
	get_available_presets: vi.fn()
};

// Mock dynamic import of WASM module
vi.mock('./vectorize_wasm.js', () => mockWasmModule);

// Mock browser APIs
const mockWindow = {
	crossOriginIsolated: true,
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
	location: {
		href: 'http://localhost:3000',
		origin: 'http://localhost:3000'
	}
};

const mockNavigator = {
	hardwareConcurrency: 8,
	userAgent:
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

// Mock WebAssembly API
const mockWebAssembly = {
	Memory: vi.fn().mockImplementation(() => ({
		buffer: new ArrayBuffer(1024)
	})),
	validate: vi.fn().mockReturnValue(true),
	instantiate: vi.fn().mockResolvedValue({
		module: {},
		instance: { exports: {} }
	})
};

// Setup global mocks
beforeEach(() => {
	// Reset window and navigator with fresh objects
	mockWindow.crossOriginIsolated = true;
	mockNavigator.hardwareConcurrency = 8;

	// Reset WebAssembly mocks
	mockWebAssembly.Memory = vi.fn().mockImplementation(() => ({
		buffer: new ArrayBuffer(1024)
	}));
	mockWebAssembly.validate = vi.fn().mockReturnValue(true);

	vi.stubGlobal('window', mockWindow);
	vi.stubGlobal('navigator', mockNavigator);
	vi.stubGlobal('SharedArrayBuffer', SharedArrayBuffer);
	vi.stubGlobal('URL', URL);
	vi.stubGlobal('WebAssembly', mockWebAssembly);

	// Reset all mocks
	vi.clearAllMocks();

	// Ensure all mock functions exist and are properly reset
	mockWasmModule.default = vi.fn().mockResolvedValue(undefined);
	mockWasmModule.initThreadPool = vi.fn().mockResolvedValue(undefined);
	mockWasmModule.destroy_thread_pool = vi.fn();
	mockWasmModule.confirm_threading_success = vi.fn();
	mockWasmModule.mark_threading_failed = vi.fn();
	mockWasmModule.is_threading_supported = vi.fn().mockReturnValue(false);
	mockWasmModule.get_thread_count = vi.fn().mockReturnValue(1);
	mockWasmModule.check_threading_requirements = vi.fn().mockReturnValue({
		crossOriginIsolated: true,
		sharedArrayBuffer: true,
		threading: true
	});
	mockWasmModule.get_available_backends = vi
		.fn()
		.mockReturnValue(['edge', 'centerline', 'superpixel', 'dots']);
	mockWasmModule.get_available_presets = vi
		.fn()
		.mockReturnValue(['default', 'detailed', 'fast', 'artistic']);
});

afterEach(async () => {
	vi.unstubAllGlobals();

	// Reset module state by calling resetWasm if available
	try {
		const { resetWasm } = await import('./loader');
		resetWasm();
	} catch (e) {
		// Module might not be loaded yet, that's fine
	}

	// Reset module state by reimporting
	vi.resetModules();
});

describe('WASM Loader - Core Module Loading', () => {
	it('should load WASM module successfully with default options', async () => {
		const { loadVectorizer, resetWasm } = await import('./loader');

		const module = await loadVectorizer();

		expect(mockWasmModule.default).toHaveBeenCalledWith(
			expect.objectContaining({
				href: expect.stringContaining('vectorize_wasm_bg.wasm')
			})
		);
		expect(module).toBe(mockWasmModule);
		expect(module.WasmVectorizer).toBeDefined();

		resetWasm();
	});

	it('should implement singleton pattern for module loading', async () => {
		const { loadVectorizer, resetWasm } = await import('./loader');

		const module1 = await loadVectorizer();
		const module2 = await loadVectorizer();

		expect(module1).toBe(module2);
		expect(mockWasmModule.default).toHaveBeenCalledTimes(1);

		resetWasm();
	});

	it('should handle concurrent initialization requests correctly', async () => {
		const { loadVectorizer, resetWasm } = await import('./loader');

		const [module1, module2, module3] = await Promise.all([
			loadVectorizer(),
			loadVectorizer(),
			loadVectorizer()
		]);

		expect(module1).toBe(module2);
		expect(module2).toBe(module3);
		expect(mockWasmModule.default).toHaveBeenCalledTimes(1);

		resetWasm();
	});

	it('should throw error when not in browser environment', async () => {
		vi.doMock('$app/environment', () => ({ browser: false }));

		const { loadVectorizer } = await import('./loader');

		await expect(loadVectorizer()).rejects.toThrow('WASM must load in the browser');

		vi.doUnmock('$app/environment');
	});

	it('should handle WASM module import failure', async () => {
		mockWasmModule.default.mockRejectedValue(new Error('Import failed'));

		const { loadVectorizer, resetWasm } = await import('./loader');

		await expect(loadVectorizer()).rejects.toThrow('Import failed');
		expect(mockWasmModule.default).toHaveBeenCalled();

		resetWasm();
	});

	it('should reset initialization promise on failure to allow retry', async () => {
		mockWasmModule.default
			.mockRejectedValueOnce(new Error('First attempt failed'))
			.mockResolvedValueOnce(undefined);

		const { loadVectorizer, resetWasm } = await import('./loader');

		// First attempt should fail
		await expect(loadVectorizer()).rejects.toThrow('First attempt failed');

		// Second attempt should succeed
		const module = await loadVectorizer();
		expect(module).toBe(mockWasmModule);
		expect(mockWasmModule.default).toHaveBeenCalledTimes(2);

		resetWasm();
	});

	it('should validate essential WASM exports are available', async () => {
		const moduleWithoutVectorizer = { ...mockWasmModule, WasmVectorizer: undefined };
		vi.doMock('./vectorize_wasm.js', () => moduleWithoutVectorizer);

		const { loadVectorizer, resetWasm } = await import('./loader');

		await expect(loadVectorizer()).rejects.toThrow('WasmVectorizer not found in WASM exports');

		resetWasm();
		vi.doUnmock('./vectorize_wasm.js');
	});
});

describe('WASM Loader - Threading System (Critical)', () => {
	it('should NOT auto-initialize threads by default (prevents CPU overload)', async () => {
		const { loadVectorizer, resetWasm } = await import('./loader');

		await loadVectorizer();

		expect(mockWasmModule.initThreadPool).not.toHaveBeenCalled();
		expect(mockWasmModule.confirm_threading_success).not.toHaveBeenCalled();

		resetWasm();
	});

	it('should initialize threads when explicitly requested', async () => {
		mockWasmModule.is_threading_supported.mockReturnValue(true);
		mockWasmModule.get_thread_count.mockReturnValue(7);

		const { loadVectorizer, resetWasm } = await import('./loader');

		await loadVectorizer({ initializeThreads: true });

		expect(mockWasmModule.initThreadPool).toHaveBeenCalledWith(7); // hardwareConcurrency - 1
		expect(mockWasmModule.confirm_threading_success).toHaveBeenCalled();

		resetWasm();
	});

	it('should respect custom thread count when provided', async () => {
		mockWasmModule.is_threading_supported.mockReturnValue(true);

		const { loadVectorizer, resetWasm } = await import('./loader');

		await loadVectorizer({ initializeThreads: true, threadCount: 4 });

		expect(mockWasmModule.initThreadPool).toHaveBeenCalledWith(4);
		expect(mockWasmModule.confirm_threading_success).toHaveBeenCalled();

		resetWasm();
	});

	it('should support legacy autoStart option for backward compatibility', async () => {
		mockWasmModule.is_threading_supported.mockReturnValue(true);

		const { loadVectorizer, resetWasm } = await import('./loader');

		await loadVectorizer({ autoStart: true });

		expect(mockWasmModule.initThreadPool).toHaveBeenCalled();
		expect(mockWasmModule.confirm_threading_success).toHaveBeenCalled();

		resetWasm();
	});

	it('should handle thread pool initialization failure gracefully', async () => {
		mockWasmModule.initThreadPool.mockRejectedValue(new Error('Thread init failed'));

		const { loadVectorizer, resetWasm } = await import('./loader');

		// Should not throw, just log warning
		const module = await loadVectorizer({ initializeThreads: true });

		expect(module).toBe(mockWasmModule);
		expect(mockWasmModule.mark_threading_failed).toHaveBeenCalled();
		expect(mockWasmModule.confirm_threading_success).not.toHaveBeenCalled();

		resetWasm();
	});

	it('should skip threading when not cross-origin isolated', async () => {
		mockWindow.crossOriginIsolated = false;

		const { loadVectorizer, resetWasm } = await import('./loader');

		await loadVectorizer({ initializeThreads: true });

		expect(mockWasmModule.initThreadPool).not.toHaveBeenCalled();
		expect(mockWasmModule.confirm_threading_success).not.toHaveBeenCalled();

		resetWasm();
	});

	it('should skip threading when SharedArrayBuffer unavailable', async () => {
		vi.stubGlobal('SharedArrayBuffer', undefined);

		const { loadVectorizer, resetWasm } = await import('./loader');

		await loadVectorizer({ initializeThreads: true });

		expect(mockWasmModule.initThreadPool).not.toHaveBeenCalled();
		expect(mockWasmModule.confirm_threading_success).not.toHaveBeenCalled();

		resetWasm();
	});

	it('should calculate appropriate default thread count', async () => {
		mockNavigator.hardwareConcurrency = 12;
		mockWasmModule.is_threading_supported.mockReturnValue(true);

		const { loadVectorizer, resetWasm } = await import('./loader');

		await loadVectorizer({ initializeThreads: true });

		// Should use max 8 threads (capped), hardwareConcurrency - 1 = 11, but max is 8
		expect(mockWasmModule.initThreadPool).toHaveBeenCalledWith(8);

		resetWasm();
	});

	it('should handle systems with low core counts', async () => {
		mockNavigator.hardwareConcurrency = 2;
		mockWasmModule.is_threading_supported.mockReturnValue(true);

		const { loadVectorizer, resetWasm } = await import('./loader');

		await loadVectorizer({ initializeThreads: true });

		// Should use 1 thread (2 - 1 = 1)
		expect(mockWasmModule.initThreadPool).toHaveBeenCalledWith(1);

		resetWasm();
	});
});

describe('WASM Loader - Lazy Threading Initialization', () => {
	it('should allow separate thread pool initialization after module load', async () => {
		mockWasmModule.is_threading_supported
			.mockReturnValueOnce(false) // Not initialized during load
			.mockReturnValueOnce(true); // Initialized after separate call

		const { loadVectorizer, initializeThreadPool, resetWasm } = await import('./loader');

		// Load module without threading
		await loadVectorizer();
		expect(mockWasmModule.initThreadPool).not.toHaveBeenCalled();

		// Initialize threading separately
		const success = await initializeThreadPool(4);

		expect(success).toBe(true);
		expect(mockWasmModule.initThreadPool).toHaveBeenCalledWith(4);
		expect(mockWasmModule.confirm_threading_success).toHaveBeenCalled();

		resetWasm();
	});

	it('should handle lazy initialization when module already has threads', async () => {
		mockWasmModule.is_threading_supported.mockReturnValue(true);

		const { loadVectorizer, initializeThreadPool, resetWasm } = await import('./loader');

		// Load with threads
		await loadVectorizer({ initializeThreads: true });

		// Try to initialize again - should recognize already initialized
		const success = await initializeThreadPool(6);

		expect(success).toBe(true);
		expect(mockWasmModule.initThreadPool).toHaveBeenCalledTimes(1); // Only called once

		resetWasm();
	});

	it('should throw error when trying to initialize threads before module load', async () => {
		const { initializeThreadPool } = await import('./loader');

		await expect(initializeThreadPool()).rejects.toThrow(
			'WASM module not loaded. Call loadVectorizer() first.'
		);
	});

	it('should return false when threading requirements not met', async () => {
		mockWindow.crossOriginIsolated = false;

		const { loadVectorizer, initializeThreadPool, resetWasm } = await import('./loader');

		await loadVectorizer();
		const success = await initializeThreadPool();

		expect(success).toBe(false);
		expect(mockWasmModule.initThreadPool).not.toHaveBeenCalled();

		resetWasm();
	});

	it('should handle thread initialization failure in lazy mode', async () => {
		mockWasmModule.initThreadPool.mockRejectedValue(new Error('Lazy init failed'));

		const { loadVectorizer, initializeThreadPool, resetWasm } = await import('./loader');

		await loadVectorizer();
		const success = await initializeThreadPool(4);

		expect(success).toBe(false);
		expect(mockWasmModule.mark_threading_failed).toHaveBeenCalled();

		resetWasm();
	});
});

describe('WASM Loader - Environment Detection & Capabilities', () => {
	it('should detect full threading capabilities correctly', async () => {
		// Ensure cross-origin isolation is properly mocked
		mockWindow.crossOriginIsolated = true;
		vi.stubGlobal('window', mockWindow);

		mockWasmModule.is_threading_supported.mockReturnValue(true);
		mockWasmModule.get_thread_count.mockReturnValue(8);
		mockWasmModule.check_threading_requirements.mockReturnValue({
			crossOriginIsolated: true,
			sharedArrayBuffer: true,
			threading: true
		});

		const { getCapabilities, resetWasm } = await import('./loader');

		const capabilities = await getCapabilities();

		expect(capabilities).toEqual({
			crossOriginIsolated: true,
			sharedArrayBuffer: true,
			threading: true,
			threadCount: 8,
			wasmAvailable: true,
			threadingRequirements: {
				crossOriginIsolated: true,
				sharedArrayBuffer: true,
				threading: true
			}
		});

		resetWasm();
	});

	it('should handle limited environment correctly', async () => {
		mockWindow.crossOriginIsolated = false;
		vi.stubGlobal('SharedArrayBuffer', undefined);
		mockWasmModule.is_threading_supported.mockReturnValue(false);

		const { getCapabilities, resetWasm } = await import('./loader');

		const capabilities = await getCapabilities();

		expect(capabilities).toEqual({
			crossOriginIsolated: false,
			sharedArrayBuffer: false,
			threading: false,
			threadCount: 1,
			wasmAvailable: true,
			threadingRequirements: expect.any(Object)
		});

		resetWasm();
	});

	it('should handle missing window object gracefully', async () => {
		vi.stubGlobal('window', undefined);

		const { getCapabilities, resetWasm } = await import('./loader');

		const capabilities = await getCapabilities();

		expect(capabilities.crossOriginIsolated).toBe(false);
		expect(capabilities.wasmAvailable).toBe(true);

		resetWasm();
	});

	it('should handle WASM module errors during capability check', async () => {
		mockWasmModule.is_threading_supported.mockImplementation(() => {
			throw new Error('Threading check failed');
		});
		mockWasmModule.get_thread_count.mockImplementation(() => {
			throw new Error('Thread count failed');
		});

		const { getCapabilities, resetWasm } = await import('./loader');

		const capabilities = await getCapabilities();

		expect(capabilities.threading).toBe(false);
		expect(capabilities.threadCount).toBe(1);
		expect(capabilities.wasmAvailable).toBe(true);

		resetWasm();
	});
});

describe('WASM Loader - State Management', () => {
	it('should track thread pool initialization status correctly', async () => {
		mockWasmModule.is_threading_supported
			.mockReturnValueOnce(false) // Before thread init
			.mockReturnValueOnce(true); // After thread init

		const { loadVectorizer, isThreadPoolInitialized, initializeThreadPool, resetWasm } =
			await import('./loader');

		await loadVectorizer();
		expect(isThreadPoolInitialized()).toBe(false);

		await initializeThreadPool(4);
		expect(isThreadPoolInitialized()).toBe(true);

		resetWasm();
	});

	it('should return accurate current thread count', async () => {
		mockWasmModule.get_thread_count.mockReturnValueOnce(1).mockReturnValueOnce(6);

		const { loadVectorizer, getCurrentThreadCount, initializeThreadPool, resetWasm } = await import(
			'./loader'
		);

		await loadVectorizer();
		expect(getCurrentThreadCount()).toBe(1);

		await initializeThreadPool(6);
		expect(getCurrentThreadCount()).toBe(6);

		resetWasm();
	});

	it('should handle state check errors gracefully', async () => {
		mockWasmModule.is_threading_supported.mockImplementation(() => {
			throw new Error('State check failed');
		});
		mockWasmModule.get_thread_count.mockImplementation(() => {
			throw new Error('Count check failed');
		});

		const { loadVectorizer, isThreadPoolInitialized, getCurrentThreadCount, resetWasm } =
			await import('./loader');

		await loadVectorizer();

		expect(isThreadPoolInitialized()).toBe(false);
		expect(getCurrentThreadCount()).toBe(0);

		resetWasm();
	});

	it('should return zero counts when module not loaded', async () => {
		const { isThreadPoolInitialized, getCurrentThreadCount } = await import('./loader');

		expect(isThreadPoolInitialized()).toBe(false);
		expect(getCurrentThreadCount()).toBe(0);
	});

	it('should calculate max and recommended thread counts correctly', async () => {
		mockNavigator.hardwareConcurrency = 16;

		const { getMaxThreads, getRecommendedThreadCount } = await import('./loader');

		expect(getMaxThreads()).toBe(12); // Capped at 12
		expect(getRecommendedThreadCount()).toBe(8); // 16 - 2 cores, max 8
	});

	it('should handle missing hardware concurrency', async () => {
		mockNavigator.hardwareConcurrency = undefined;

		const { getMaxThreads, getRecommendedThreadCount } = await import('./loader');

		expect(getMaxThreads()).toBe(4); // Fallback to 4
		expect(getRecommendedThreadCount()).toBe(2); // 4 - 2 = 2
	});

	it('should reset module state completely', async () => {
		const { loadVectorizer, resetWasm, isThreadPoolInitialized } = await import('./loader');

		await loadVectorizer({ initializeThreads: true });
		expect(isThreadPoolInitialized()).toBe(false); // Mock returns false initially

		resetWasm();

		// After reset, should be able to load again
		const module = await loadVectorizer();
		expect(module).toBe(mockWasmModule);
		expect(mockWasmModule.default).toHaveBeenCalledTimes(2); // Called again after reset
	});
});

describe('WASM Loader - API Functions', () => {
	beforeEach(() => {
		// Reset module state in mocks
		mockWasmModule.WasmVectorizer = vi.fn();
		mockWasmModule.get_available_backends = vi
			.fn()
			.mockReturnValue(['edge', 'centerline', 'superpixel', 'dots']);
		mockWasmModule.get_available_presets = vi
			.fn()
			.mockReturnValue(['default', 'detailed', 'fast', 'artistic']);
	});

	it('should create vectorizer instance successfully', async () => {
		const mockVectorizer = { process: vi.fn() };
		mockWasmModule.WasmVectorizer.mockReturnValue(mockVectorizer);

		const { createVectorizer, resetWasm } = await import('./loader');

		const vectorizer = await createVectorizer();

		expect(vectorizer).toBe(mockVectorizer);
		expect(mockWasmModule.WasmVectorizer).toHaveBeenCalled();

		resetWasm();
	});

	it('should throw error when WasmVectorizer not available', async () => {
		mockWasmModule.WasmVectorizer = undefined;

		const { createVectorizer, resetWasm } = await import('./loader');

		await expect(createVectorizer()).rejects.toThrow('WasmVectorizer not found in WASM exports');

		resetWasm();
	});

	it('should get available backends from WASM module', async () => {
		const { getAvailableBackends, resetWasm } = await import('./loader');

		const backends = await getAvailableBackends();

		expect(backends).toEqual(['edge', 'centerline', 'superpixel', 'dots']);
		expect(mockWasmModule.get_available_backends).toHaveBeenCalled();

		resetWasm();
	});

	it('should fallback to known backends when function unavailable', async () => {
		mockWasmModule.get_available_backends = undefined;

		const { getAvailableBackends, resetWasm } = await import('./loader');

		const backends = await getAvailableBackends();

		expect(backends).toEqual(['edge', 'centerline', 'superpixel', 'dots']);

		resetWasm();
	});

	it('should get available presets from WASM module', async () => {
		const { getAvailablePresets, resetWasm } = await import('./loader');

		const presets = await getAvailablePresets();

		expect(presets).toEqual(['default', 'detailed', 'fast', 'artistic']);
		expect(mockWasmModule.get_available_presets).toHaveBeenCalled();

		resetWasm();
	});

	it('should fallback to known presets when function unavailable', async () => {
		mockWasmModule.get_available_presets = undefined;

		const { getAvailablePresets, resetWasm } = await import('./loader');

		const presets = await getAvailablePresets();

		expect(presets).toEqual(['default', 'detailed', 'fast', 'artistic']);

		resetWasm();
	});
});

describe('WASM Loader - Performance & CPU Overload Prevention', () => {
	beforeEach(() => {
		// Ensure fresh mock state for performance tests
		mockWasmModule.initThreadPool = vi.fn().mockResolvedValue(undefined);
		mockWasmModule.confirm_threading_success = vi.fn();
	});

	it('should not spawn threads automatically on page load', async () => {
		const { loadVectorizer, resetWasm } = await import('./loader');

		// Simulate page load - just loading the module
		await loadVectorizer();

		// Should NOT have initialized threads
		expect(mockWasmModule.initThreadPool).not.toHaveBeenCalled();
		expect(mockWasmModule.confirm_threading_success).not.toHaveBeenCalled();

		resetWasm();
	});

	it('should require explicit user action to initialize threads', async () => {
		const { loadVectorizer, initializeThreadPool, resetWasm } = await import('./loader');

		// Load module (page load simulation)
		await loadVectorizer();
		expect(mockWasmModule.initThreadPool).not.toHaveBeenCalled();

		// User explicitly requests threading
		await initializeThreadPool();
		expect(mockWasmModule.initThreadPool).toHaveBeenCalled();

		resetWasm();
	});

	it('should cache module instance to prevent multiple initializations', async () => {
		const { loadVectorizer, resetWasm } = await import('./loader');

		// Multiple calls should only initialize once
		await Promise.all([
			loadVectorizer(),
			loadVectorizer(),
			loadVectorizer(),
			loadVectorizer(),
			loadVectorizer()
		]);

		expect(mockWasmModule.default).toHaveBeenCalledTimes(1);

		resetWasm();
	});

	it('should respect thread count limits to prevent CPU overload', async () => {
		// Simulate high-core system
		mockNavigator.hardwareConcurrency = 32;
		vi.stubGlobal('navigator', mockNavigator);

		const { loadVectorizer, resetWasm } = await import('./loader');

		await loadVectorizer({ initializeThreads: true });

		// Should be capped at 8 threads max, even with 32 cores
		expect(mockWasmModule.initThreadPool).toHaveBeenCalledWith(8);

		resetWasm();
	});

	it('should leave cores available for system by default', async () => {
		mockNavigator.hardwareConcurrency = 8;
		vi.stubGlobal('navigator', mockNavigator);

		const { loadVectorizer, resetWasm } = await import('./loader');

		await loadVectorizer({ initializeThreads: true });

		// Should use 7 threads (8 - 1 = 7), leaving 1 core for system
		expect(mockWasmModule.initThreadPool).toHaveBeenCalledWith(7);

		resetWasm();
	});
});
