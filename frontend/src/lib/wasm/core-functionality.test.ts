/**
 * Core Functionality Tests for WASM Loaders
 * Focused on critical CPU overload prevention and threading management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock browser environment
vi.mock('$app/environment', () => ({
	browser: true
}));

// Mock WASM module with comprehensive interface
const createMockWasmModule = () => ({
	default: vi.fn().mockResolvedValue(undefined),
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
	initThreadPool: vi.fn().mockResolvedValue(undefined),
	confirm_threading_success: vi.fn(),
	mark_threading_failed: vi.fn(),
	is_threading_supported: vi.fn().mockReturnValue(false),
	get_thread_count: vi.fn().mockReturnValue(1),
	check_threading_requirements: vi.fn().mockReturnValue({
		crossOriginIsolated: true,
		sharedArrayBuffer: true,
		threading: true
	}),
	get_available_backends: vi.fn().mockReturnValue(['edge', 'centerline', 'superpixel', 'dots']),
	get_available_presets: vi.fn().mockReturnValue(['default', 'detailed', 'fast', 'artistic'])
});

let mockWasmModule = createMockWasmModule();

// Mock dynamic imports
vi.mock('./vectorize_wasm.js', () => mockWasmModule);

// Browser environment mocks
const mockWindow = {
	crossOriginIsolated: true
};

const mockNavigator = {
	hardwareConcurrency: 8
};

beforeEach(() => {
	// Reset all mocks to fresh state
	mockWasmModule = createMockWasmModule();
	vi.doMock('./vectorize_wasm.js', () => mockWasmModule);

	// Reset browser environment
	mockWindow.crossOriginIsolated = true;
	mockNavigator.hardwareConcurrency = 8;

	vi.stubGlobal('window', mockWindow);
	vi.stubGlobal('navigator', mockNavigator);
	vi.stubGlobal('SharedArrayBuffer', SharedArrayBuffer);
	vi.stubGlobal('URL', URL);
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.resetModules();
});

describe('WASM Loader - Critical CPU Overload Prevention', () => {
	it('should NOT automatically spawn threads on module load (prevents CPU overload)', async () => {
		const { loadVectorizer } = await import('./loader');

		// Simulate page load - module loading without explicit threading request
		await loadVectorizer();

		// CRITICAL: Should NOT initialize threads automatically
		expect(mockWasmModule.initThreadPool).not.toHaveBeenCalled();
		expect(mockWasmModule.confirm_threading_success).not.toHaveBeenCalled();
	});

	it('should require explicit user action to initialize threads', async () => {
		const { loadVectorizer, initializeThreadPool } = await import('./loader');

		// 1. Load module (page load simulation) - no threads
		await loadVectorizer();
		expect(mockWasmModule.initThreadPool).not.toHaveBeenCalled();

		// 2. User explicitly requests threading
		await initializeThreadPool(4);
		expect(mockWasmModule.initThreadPool).toHaveBeenCalledWith(4);
	});

	it('should implement lazy loading pattern successfully', async () => {
		const { loadVectorizer, isThreadPoolInitialized } = await import('./loader');

		// Module loads without threads
		await loadVectorizer();
		expect(isThreadPoolInitialized()).toBe(false);

		// Threading is available but not active until requested
		expect(mockWasmModule.initThreadPool).not.toHaveBeenCalled();
	});

	it('should cache module to prevent multiple initializations', async () => {
		const { loadVectorizer } = await import('./loader');

		// Multiple concurrent calls should only initialize once
		await Promise.all([
			loadVectorizer(),
			loadVectorizer(),
			loadVectorizer(),
			loadVectorizer(),
			loadVectorizer()
		]);

		expect(mockWasmModule.default).toHaveBeenCalledTimes(1);
	});
});

describe('WASM Loader - Threading Controls', () => {
	it('should initialize threads when explicitly requested', async () => {
		mockWasmModule.is_threading_supported.mockReturnValue(true);

		const { loadVectorizer } = await import('./loader');

		await loadVectorizer({ initializeThreads: true });

		expect(mockWasmModule.initThreadPool).toHaveBeenCalled();
		expect(mockWasmModule.confirm_threading_success).toHaveBeenCalled();
	});

	it('should respect thread count limits to prevent CPU overload', async () => {
		mockNavigator.hardwareConcurrency = 32; // High-end system
		vi.stubGlobal('navigator', mockNavigator);

		const { loadVectorizer } = await import('./loader');

		await loadVectorizer({ initializeThreads: true });

		// Should be capped at 8 threads maximum
		expect(mockWasmModule.initThreadPool).toHaveBeenCalledWith(8);
	});

	it('should leave cores available for system', async () => {
		mockNavigator.hardwareConcurrency = 8;
		vi.stubGlobal('navigator', mockNavigator);

		const { loadVectorizer } = await import('./loader');

		await loadVectorizer({ initializeThreads: true });

		// Should use 7 threads (leave 1 core for system)
		expect(mockWasmModule.initThreadPool).toHaveBeenCalledWith(7);
	});

	it('should handle thread initialization failure gracefully', async () => {
		mockWasmModule.initThreadPool.mockRejectedValue(new Error('Threading failed'));

		const { loadVectorizer } = await import('./loader');

		// Should not throw, just log warning and continue
		const module = await loadVectorizer({ initializeThreads: true });

		expect(module).toBe(mockWasmModule);
		expect(mockWasmModule.mark_threading_failed).toHaveBeenCalled();
	});
});

describe('WASM Loader - Environment Detection', () => {
	it('should detect cross-origin isolation requirements', async () => {
		const { getCapabilities } = await import('./loader');

		const capabilities = await getCapabilities();

		expect(capabilities.crossOriginIsolated).toBe(true);
		expect(capabilities.sharedArrayBuffer).toBe(true);
	});

	it('should handle non-isolated environments', async () => {
		mockWindow.crossOriginIsolated = false;
		vi.stubGlobal('window', mockWindow);

		const { loadVectorizer } = await import('./loader');

		// Should not attempt threading without isolation
		await loadVectorizer({ initializeThreads: true });

		expect(mockWasmModule.initThreadPool).not.toHaveBeenCalled();
	});

	it('should handle missing SharedArrayBuffer', async () => {
		vi.stubGlobal('SharedArrayBuffer', undefined);

		const { getCapabilities } = await import('./loader');

		const capabilities = await getCapabilities();

		expect(capabilities.sharedArrayBuffer).toBe(false);
	});
});

describe('WASM Loader - State Management', () => {
	it('should track initialization state correctly', async () => {
		mockWasmModule.is_threading_supported
			.mockReturnValueOnce(false) // Before init
			.mockReturnValueOnce(true); // After init

		const { loadVectorizer, isThreadPoolInitialized, initializeThreadPool } = await import(
			'./loader'
		);

		await loadVectorizer();
		expect(isThreadPoolInitialized()).toBe(false);

		await initializeThreadPool();
		expect(isThreadPoolInitialized()).toBe(true);
	});

	it('should provide accurate thread count reporting', async () => {
		mockWasmModule.get_thread_count.mockReturnValue(6);

		const { loadVectorizer, getCurrentThreadCount } = await import('./loader');

		await loadVectorizer();

		expect(getCurrentThreadCount()).toBe(6);
	});

	it('should calculate recommended thread counts safely', async () => {
		const { getRecommendedThreadCount, getMaxThreads } = await import('./loader');

		expect(getMaxThreads()).toBeLessThanOrEqual(12); // Never exceed safe maximum
		expect(getRecommendedThreadCount()).toBeLessThanOrEqual(8); // Conservative recommendation
	});
});

describe('WASM Loader - API Functions', () => {
	it('should create vectorizer instances', async () => {
		const mockVectorizer = { process: vi.fn() };
		mockWasmModule.WasmVectorizer.mockReturnValue(mockVectorizer);

		const { createVectorizer } = await import('./loader');

		const vectorizer = await createVectorizer();

		expect(vectorizer).toBe(mockVectorizer);
	});

	it('should handle missing exports gracefully', async () => {
		mockWasmModule.WasmVectorizer = undefined;

		const { createVectorizer } = await import('./loader');

		await expect(createVectorizer()).rejects.toThrow('WasmVectorizer not found');
	});

	it('should provide backend information', async () => {
		const { getAvailableBackends } = await import('./loader');

		const backends = await getAvailableBackends();

		expect(backends).toContain('edge');
		expect(backends).toContain('centerline');
		expect(backends).toContain('superpixel');
		expect(backends).toContain('dots');
	});
});

describe('WASM Index Alternative - Auto-Threading Behavior', () => {
	it('should automatically attempt threading in index.ts implementation', async () => {
		vi.resetModules();

		const { initWasm } = await import('./index');

		await initWasm();

		// Index implementation auto-initializes threads when available
		expect(mockWasmModule.initThreadPool).toHaveBeenCalledWith(8);
	});

	it('should skip auto-threading when not cross-origin isolated', async () => {
		mockWindow.crossOriginIsolated = false;
		vi.stubGlobal('window', mockWindow);
		vi.resetModules();

		const { initWasm } = await import('./index');

		await initWasm();

		expect(mockWasmModule.initThreadPool).not.toHaveBeenCalled();
	});
});

describe('Worker WASM Loader - Simplified Loading', () => {
	beforeEach(() => {
		// Worker context - no browser APIs
		vi.stubGlobal('window', undefined);
		vi.stubGlobal('navigator', undefined);
	});

	it('should load WASM in worker context without threading', async () => {
		vi.resetModules();

		const { initializeWasm } = await import('./worker-load');

		const module = await initializeWasm();

		expect(module).toBe(mockWasmModule);
		expect(mockWasmModule.default).toHaveBeenCalled();
		// Worker loader doesn't attempt threading
		expect(mockWasmModule.initThreadPool).not.toHaveBeenCalled();
	});

	it('should validate essential exports in worker context', async () => {
		vi.resetModules();

		const { initializeWasm } = await import('./worker-load');

		const module = await initializeWasm();

		expect(module.WasmVectorizer).toBeDefined();
	});

	it('should handle worker loading errors', async () => {
		mockWasmModule.default.mockRejectedValue(new Error('Worker load failed'));
		vi.resetModules();

		const { initializeWasm } = await import('./worker-load');

		await expect(initializeWasm()).rejects.toThrow('Worker load failed');
	});
});

describe('Integration - Performance Critical Scenarios', () => {
	it('should maintain performance characteristics under load', async () => {
		const { loadVectorizer } = await import('./loader');

		const startTime = performance.now();

		// Simulate multiple rapid requests (common in real usage)
		await Promise.all(
			Array(20)
				.fill(0)
				.map(() => loadVectorizer())
		);

		const endTime = performance.now();

		// Should complete quickly and only initialize once
		expect(endTime - startTime).toBeLessThan(100); // Fast completion
		expect(mockWasmModule.default).toHaveBeenCalledTimes(1); // Singleton
	});

	it('should prevent thread pool initialization during page load simulation', async () => {
		const { loadVectorizer, getCapabilities, getAvailableBackends } = await import('./loader');

		// Simulate typical page load sequence
		await loadVectorizer(); // Module loads
		await getCapabilities(); // Check what's available
		await getAvailableBackends(); // Get backend options

		// No threads should be initialized during this typical sequence
		expect(mockWasmModule.initThreadPool).not.toHaveBeenCalled();
	});

	it('should support user-initiated threading after page load', async () => {
		const { loadVectorizer, initializeThreadPool, isThreadPoolInitialized } = await import(
			'./loader'
		);

		// Page load sequence
		await loadVectorizer();
		expect(isThreadPoolInitialized()).toBe(false);

		// User action triggers threading
		mockWasmModule.is_threading_supported.mockReturnValue(true);
		const success = await initializeThreadPool(4);

		expect(success).toBe(true);
		expect(mockWasmModule.initThreadPool).toHaveBeenCalledWith(4);
	});
});
