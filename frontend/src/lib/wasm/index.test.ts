/**
 * Unit tests for alternative WASM initialization system
 * Testing the index.ts WASM loader implementation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock browser environment before importing
vi.mock('$app/environment', () => ({
	browser: true
}));

// Mock WASM module with better simulation
const mockWasmModule = {
	default: vi.fn().mockResolvedValue({}),
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
	initThreadPool: vi.fn().mockResolvedValue({}),
	is_threading_supported: vi.fn().mockReturnValue(true),
	get_thread_count: vi.fn().mockReturnValue(8),
	confirm_threading_success: vi.fn(),
	mark_threading_failed: vi.fn()
};

// Mock dynamic import of WASM module
vi.mock('./vectorize_wasm.js', () => mockWasmModule);

// Mock browser APIs
const mockWindow = {
	crossOriginIsolated: true
};

const mockNavigator = {
	hardwareConcurrency: 8
};

// Setup global mocks
beforeEach(() => {
	// Reset mocks
	vi.clearAllMocks();
	
	// Reset window and navigator properties
	mockWindow.crossOriginIsolated = true;
	mockNavigator.hardwareConcurrency = 8;

	vi.stubGlobal('window', mockWindow);
	vi.stubGlobal('navigator', mockNavigator);
	vi.stubGlobal('SharedArrayBuffer', SharedArrayBuffer);
	vi.stubGlobal('URL', URL);

	// Reset all mocks
	vi.clearAllMocks();

	// Ensure all mock functions exist and are properly reset
	mockWasmModule.default = vi.fn().mockResolvedValue(undefined);
	mockWasmModule.initThreadPool = vi.fn().mockResolvedValue(undefined);
	mockWasmModule.is_threading_supported = vi.fn().mockReturnValue(false);
	mockWasmModule.get_thread_count = vi.fn().mockReturnValue(1);
});

afterEach(() => {
	vi.unstubAllGlobals();
	// Reset module state by reimporting
	vi.resetModules();
});

describe('WASM Index - Core Initialization', () => {
	it('should initialize WASM module successfully', async () => {
		const { initWasm } = await import('./index');

		const module = await initWasm();

		expect(mockWasmModule.default).toHaveBeenCalledWith(
			expect.objectContaining({
				href: expect.stringContaining('vectorize_wasm_bg.wasm')
			})
		);
		expect(module).toBe(mockWasmModule);
	});

	it('should implement singleton pattern', async () => {
		const { initWasm } = await import('./index');

		const module1 = await initWasm();
		const module2 = await initWasm();

		expect(module1).toBe(module2);
		expect(mockWasmModule.default).toHaveBeenCalledTimes(1);
	});

	it('should handle concurrent initialization requests', async () => {
		const { initWasm } = await import('./index');

		const [module1, module2, module3] = await Promise.all([initWasm(), initWasm(), initWasm()]);

		expect(module1).toBe(module2);
		expect(module2).toBe(module3);
		expect(mockWasmModule.default).toHaveBeenCalledTimes(1);
	});

	it('should throw error when not in browser', async () => {
		vi.doMock('$app/environment', () => ({ browser: false }));

		const { initWasm } = await import('./index');

		await expect(initWasm()).rejects.toThrow('WASM can only be initialized in the browser');

		vi.doUnmock('$app/environment');
	});

	it('should handle WASM loading failure', async () => {
		mockWasmModule.default.mockRejectedValue(new Error('Loading failed'));

		const { initWasm } = await import('./index');

		await expect(initWasm()).rejects.toThrow('Loading failed');
	});
});

describe('WASM Index - Threading Behavior', () => {
	it('should automatically attempt thread pool initialization when cross-origin isolated', async () => {
		const { initWasm } = await import('./index');

		await initWasm();

		expect(mockWasmModule.initThreadPool).toHaveBeenCalledWith(8);
	});

	it('should skip threading when not cross-origin isolated', async () => {
		mockWindow.crossOriginIsolated = false;

		const { initWasm } = await import('./index');

		await initWasm();

		expect(mockWasmModule.initThreadPool).not.toHaveBeenCalled();
	});

	it('should handle thread pool initialization failure gracefully', async () => {
		mockWasmModule.initThreadPool.mockRejectedValue(new Error('Thread init failed'));

		const { initWasm } = await import('./index');

		// Should not throw, just log warning
		const module = await initWasm();

		expect(module).toBe(mockWasmModule);
		expect(mockWasmModule.initThreadPool).toHaveBeenCalled();
	});

	it('should skip threading when initThreadPool not available', async () => {
		mockWasmModule.initThreadPool = undefined;

		const { initWasm } = await import('./index');

		const module = await initWasm();

		expect(module).toBe(mockWasmModule);
		// No error should be thrown
	});

	it('should use hardware concurrency for thread count', async () => {
		mockNavigator.hardwareConcurrency = 12;

		const { initWasm } = await import('./index');

		await initWasm();

		expect(mockWasmModule.initThreadPool).toHaveBeenCalledWith(12);
	});

	it('should fallback to 4 threads when hardware concurrency unavailable', async () => {
		mockNavigator.hardwareConcurrency = undefined;

		const { initWasm } = await import('./index');

		await initWasm();

		expect(mockWasmModule.initThreadPool).toHaveBeenCalledWith(4);
	});

	it('should handle missing window object gracefully', async () => {
		vi.stubGlobal('window', undefined);

		const { initWasm } = await import('./index');

		const module = await initWasm();

		expect(module).toBe(mockWasmModule);
		expect(mockWasmModule.initThreadPool).not.toHaveBeenCalled();
	});
});

describe('WASM Index - API Functions', () => {
	beforeEach(async () => {
		// Ensure clean state for each test
		vi.resetModules();
	});

	it('should create vectorizer with image data', async () => {
		const mockVectorizer = { process: vi.fn() };
		mockWasmModule.WasmVectorizer.mockReturnValue(mockVectorizer);

		const { createVectorizer } = await import('./index');

		const imageData = new Uint8Array([255, 0, 0, 255]);
		const vectorizer = await createVectorizer(imageData, 2, 2);

		expect(mockWasmModule.WasmVectorizer).toHaveBeenCalledWith(imageData, 2, 2);
		expect(vectorizer).toBe(mockVectorizer);
	});

	it('should throw error when WasmVectorizer not available', async () => {
		mockWasmModule.WasmVectorizer = undefined;

		const { createVectorizer } = await import('./index');

		const imageData = new Uint8Array([255, 0, 0, 255]);

		await expect(createVectorizer(imageData, 2, 2)).rejects.toThrow('WasmVectorizer not available');
	});

	it('should get WASM backends', async () => {
		const { getWasmBackends } = await import('./index');

		const backends = await getWasmBackends();

		expect(backends).toBe(mockWasmModule.WasmBackend);
	});

	it('should return empty object when WasmBackend unavailable', async () => {
		mockWasmModule.WasmBackend = undefined;

		const { getWasmBackends } = await import('./index');

		const backends = await getWasmBackends();

		expect(backends).toEqual({});
	});

	it('should get WASM presets', async () => {
		const { getWasmPresets } = await import('./index');

		const presets = await getWasmPresets();

		expect(presets).toBe(mockWasmModule.WasmPreset);
	});

	it('should return empty object when WasmPreset unavailable', async () => {
		mockWasmModule.WasmPreset = undefined;

		const { getWasmPresets } = await import('./index');

		const presets = await getWasmPresets();

		expect(presets).toEqual({});
	});
});

describe('WASM Index - Capabilities Check', () => {
	it('should check capabilities with full threading support', async () => {
		mockWasmModule.is_threading_supported.mockReturnValue(true);
		mockWasmModule.get_thread_count.mockReturnValue(8);

		const { checkCapabilities } = await import('./index');

		const capabilities = await checkCapabilities();

		expect(capabilities).toEqual({
			threading: true,
			threadCount: 8,
			crossOriginIsolated: true,
			sharedArrayBuffer: true,
			wasmAvailable: true
		});
	});

	it('should check capabilities with limited support', async () => {
		mockWindow.crossOriginIsolated = false;
		vi.stubGlobal('SharedArrayBuffer', undefined);
		mockWasmModule.is_threading_supported.mockReturnValue(false);
		mockWasmModule.get_thread_count.mockReturnValue(1);

		const { checkCapabilities } = await import('./index');

		const capabilities = await checkCapabilities();

		expect(capabilities).toEqual({
			threading: false,
			threadCount: 1,
			crossOriginIsolated: false,
			sharedArrayBuffer: false,
			wasmAvailable: true
		});
	});

	it('should handle missing window object in capabilities check', async () => {
		vi.stubGlobal('window', undefined);

		const { checkCapabilities } = await import('./index');

		const capabilities = await checkCapabilities();

		expect(capabilities.crossOriginIsolated).toBe(false);
		expect(capabilities.wasmAvailable).toBe(true);
	});

	it('should handle missing threading functions gracefully', async () => {
		mockWasmModule.is_threading_supported = undefined;
		mockWasmModule.get_thread_count = undefined;

		const { checkCapabilities } = await import('./index');

		const capabilities = await checkCapabilities();

		expect(capabilities.threading).toBe(false);
		expect(capabilities.threadCount).toBe(1);
	});

	it('should handle WASM module unavailable', async () => {
		mockWasmModule.WasmVectorizer = undefined;

		const { checkCapabilities } = await import('./index');

		const capabilities = await checkCapabilities();

		expect(capabilities.wasmAvailable).toBe(false);
	});
});

describe('WASM Index - Default Export', () => {
	it('should export initWasm as default', async () => {
		const { default: defaultExport, initWasm } = await import('./index');

		expect(defaultExport).toBe(initWasm);
	});

	it('should work when called as default export', async () => {
		const { default: initWasmDefault } = await import('./index');

		const module = await initWasmDefault();

		expect(module).toBe(mockWasmModule);
		expect(mockWasmModule.default).toHaveBeenCalled();
	});
});

describe('WASM Index - Error Handling', () => {
	it('should handle import failure gracefully', async () => {
		vi.doMock('./vectorize_wasm.js', () => {
			throw new Error('Import failed');
		});

		const { initWasm } = await import('./index');

		await expect(initWasm()).rejects.toThrow('Import failed');

		vi.doUnmock('./vectorize_wasm.js');
	});

	it('should handle WASM binary initialization failure', async () => {
		mockWasmModule.default.mockRejectedValue(new Error('Binary init failed'));

		const { initWasm } = await import('./index');

		await expect(initWasm()).rejects.toThrow('Binary init failed');
	});

	it('should continue after thread pool initialization failure', async () => {
		mockWasmModule.initThreadPool.mockRejectedValue(new Error('Thread pool failed'));

		const { initWasm } = await import('./index');

		// Should complete successfully despite thread pool failure
		const module = await initWasm();

		expect(module).toBe(mockWasmModule);
	});
});

describe('WASM Index - Integration Scenarios', () => {
	it('should handle typical usage pattern', async () => {
		const { initWasm, createVectorizer, checkCapabilities } = await import('./index');

		// Initialize WASM
		await initWasm();

		// Check capabilities
		const capabilities = await checkCapabilities();
		expect(capabilities.wasmAvailable).toBe(true);

		// Create vectorizer
		const imageData = new Uint8Array([255, 0, 0, 255]);
		const vectorizer = await createVectorizer(imageData, 2, 2);
		expect(vectorizer).toBeDefined();
	});

	it('should handle rapid consecutive calls', async () => {
		const { initWasm, createVectorizer } = await import('./index');

		// Multiple rapid calls should work correctly
		const promises = Array(10)
			.fill(0)
			.map(async (_, i) => {
				await initWasm();
				const imageData = new Uint8Array([i, i, i, 255]);
				return createVectorizer(imageData, 1, 1);
			});

		const vectorizers = await Promise.all(promises);

		expect(vectorizers).toHaveLength(10);
		expect(mockWasmModule.default).toHaveBeenCalledTimes(1); // Singleton behavior
	});

	it('should maintain state across different API calls', async () => {
		const { initWasm, getWasmBackends, getWasmPresets, checkCapabilities } = await import(
			'./index'
		);

		await initWasm();

		// All subsequent calls should use the same initialized module
		const [backends, presets, capabilities] = await Promise.all([
			getWasmBackends(),
			getWasmPresets(),
			checkCapabilities()
		]);

		expect(backends).toBeDefined();
		expect(presets).toBeDefined();
		expect(capabilities).toBeDefined();
		expect(mockWasmModule.default).toHaveBeenCalledTimes(1);
	});
});
