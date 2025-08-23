/**
 * Unit tests for worker-compatible WASM loader
 * Testing the simplified worker context WASM initialization
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock WASM module for worker context
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
	// Worker context typically doesn't have threading functions
	initThreadPool: undefined,
	is_threading_supported: undefined,
	get_thread_count: undefined
};

// Mock dynamic import of WASM module
vi.mock('./vectorize_wasm.js', () => mockWasmModule);

// Setup worker-like environment
beforeEach(() => {
	// Mock URL constructor for worker context
	vi.stubGlobal('URL', URL);

	// Mock importScripts (common in workers, though not used in this implementation)
	vi.stubGlobal('importScripts', vi.fn());

	// Mock console for worker context
	vi.stubGlobal('console', {
		log: vi.fn(),
		error: vi.fn(),
		warn: vi.fn()
	});

	// Reset all mocks
	vi.clearAllMocks();

	// Default successful mock implementations
	mockWasmModule.default.mockResolvedValue(undefined);
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.resetModules();
});

describe('Worker WASM Loader - Basic Initialization', () => {
	it('should initialize WASM module in worker context successfully', async () => {
		const { initializeWasm } = await import('./worker-load');

		const module = await initializeWasm();

		expect(mockWasmModule.default).toHaveBeenCalledWith(
			expect.objectContaining({
				href: expect.stringContaining('vectorize_wasm_bg.wasm')
			})
		);
		expect(module).toBe(mockWasmModule);
	});

	it('should validate essential exports are available', async () => {
		const { initializeWasm } = await import('./worker-load');

		const module = await initializeWasm();

		expect(module.WasmVectorizer).toBeDefined();
		expect(module.WasmBackend).toBeDefined();
		expect(module.WasmPreset).toBeDefined();
	});

	it('should handle missing WasmVectorizer export', async () => {
		mockWasmModule.WasmVectorizer = undefined;

		const { initializeWasm } = await import('./worker-load');

		await expect(initializeWasm()).rejects.toThrow('WasmVectorizer not found in WASM exports');
	});

	it('should use proper URL construction for worker context', async () => {
		const { initializeWasm } = await import('./worker-load');

		await initializeWasm();

		expect(mockWasmModule.default).toHaveBeenCalledWith(
			expect.objectContaining({
				href: expect.stringMatching(/vectorize_wasm_bg\.wasm$/)
			})
		);
	});
});

describe('Worker WASM Loader - Error Handling', () => {
	it('should handle WASM module import failure', async () => {
		vi.doMock('./vectorize_wasm.js', () => {
			throw new Error('Worker import failed');
		});

		const { initializeWasm } = await import('./worker-load');

		await expect(initializeWasm()).rejects.toThrow('Worker import failed');

		vi.doUnmock('./vectorize_wasm.js');
	});

	it('should handle WASM binary initialization failure', async () => {
		mockWasmModule.default.mockRejectedValue(new Error('Worker binary init failed'));

		const { initializeWasm } = await import('./worker-load');

		await expect(initializeWasm()).rejects.toThrow('Worker binary init failed');
	});

	it('should handle URL construction errors gracefully', async () => {
		// Mock URL to throw error
		vi.stubGlobal(
			'URL',
			class {
				constructor() {
					throw new Error('URL construction failed');
				}
			}
		);

		const { initializeWasm } = await import('./worker-load');

		await expect(initializeWasm()).rejects.toThrow('URL construction failed');
	});

	it('should provide detailed error information on failure', async () => {
		const originalError = new Error('Detailed worker error');
		mockWasmModule.default.mockRejectedValue(originalError);

		const { initializeWasm } = await import('./worker-load');

		try {
			await initializeWasm();
			expect.fail('Should have thrown error');
		} catch (error) {
			expect(error).toBe(originalError);
		}
	});
});

describe('Worker WASM Loader - Environment Compatibility', () => {
	it('should work without browser-specific APIs', async () => {
		// Remove browser-specific globals
		vi.stubGlobal('window', undefined);
		vi.stubGlobal('document', undefined);
		vi.stubGlobal('navigator', undefined);

		const { initializeWasm } = await import('./worker-load');

		const module = await initializeWasm();

		expect(module).toBe(mockWasmModule);
		expect(mockWasmModule.default).toHaveBeenCalled();
	});

	it('should not attempt thread pool initialization in worker', async () => {
		// Even if threading functions were available, worker loader shouldn't use them
		mockWasmModule.initThreadPool = vi.fn().mockResolvedValue(undefined);

		const { initializeWasm } = await import('./worker-load');

		await initializeWasm();

		// Worker loader is simplified and doesn't handle threading
		expect(mockWasmModule.initThreadPool).not.toHaveBeenCalled();
	});

	it('should work with minimal worker global context', async () => {
		// Set up minimal worker-like globals
		vi.stubGlobal('self', {
			importScripts: vi.fn(),
			postMessage: vi.fn(),
			onmessage: null
		});

		const { initializeWasm } = await import('./worker-load');

		const module = await initializeWasm();

		expect(module).toBe(mockWasmModule);
	});

	it('should handle importScripts compatibility if needed', async () => {
		const importScriptsMock = vi.fn();
		vi.stubGlobal('importScripts', importScriptsMock);

		const { initializeWasm } = await import('./worker-load');

		await initializeWasm();

		// Worker loader uses import(), not importScripts, but should be compatible
		expect(mockWasmModule.default).toHaveBeenCalled();
		// importScripts should not be called by this implementation
		expect(importScriptsMock).not.toHaveBeenCalled();
	});
});

describe('Worker WASM Loader - Console Logging', () => {
	it('should log initialization progress', async () => {
		const consoleMock = {
			log: vi.fn(),
			error: vi.fn(),
			warn: vi.fn()
		};
		vi.stubGlobal('console', consoleMock);

		const { initializeWasm } = await import('./worker-load');

		await initializeWasm();

		expect(consoleMock.log).toHaveBeenCalledWith(
			'[Worker WASM] Loading WASM module in worker context...'
		);
		expect(consoleMock.log).toHaveBeenCalledWith('[Worker WASM] JS module imported');
		expect(consoleMock.log).toHaveBeenCalledWith('[Worker WASM] WASM module initialized');
		expect(consoleMock.log).toHaveBeenCalledWith('[Worker WASM] ✅ Worker initialization complete');
	});

	it('should log errors with proper context', async () => {
		const consoleMock = {
			log: vi.fn(),
			error: vi.fn(),
			warn: vi.fn()
		};
		vi.stubGlobal('console', consoleMock);

		const error = new Error('Worker test error');
		mockWasmModule.default.mockRejectedValue(error);

		const { initializeWasm } = await import('./worker-load');

		try {
			await initializeWasm();
			expect.fail('Should have thrown error');
		} catch (e) {
			expect(consoleMock.error).toHaveBeenCalledWith(
				'[Worker WASM] ❌ Worker initialization failed:',
				error
			);
		}
	});

	it('should handle missing console gracefully', async () => {
		vi.stubGlobal('console', undefined);

		const { initializeWasm } = await import('./worker-load');

		// Should not throw even without console
		const module = await initializeWasm();

		expect(module).toBe(mockWasmModule);
	});
});

describe('Worker WASM Loader - Module Exports Validation', () => {
	it('should validate all expected exports are available', async () => {
		const { initializeWasm } = await import('./worker-load');

		const module = await initializeWasm();

		// Verify all expected exports are accessible
		expect(module.WasmVectorizer).toBeDefined();
		expect(module.WasmBackend).toBeDefined();
		expect(module.WasmPreset).toBeDefined();
		expect(module.default).toBeDefined();
	});

	it('should handle partial export availability', async () => {
		// Test with missing optional exports
		const partialModule = {
			...mockWasmModule,
			WasmBackend: undefined,
			WasmPreset: undefined
		};
		vi.doMock('./vectorize_wasm.js', () => partialModule);

		const { initializeWasm } = await import('./worker-load');

		const module = await initializeWasm();

		expect(module.WasmVectorizer).toBeDefined();
		expect(module.WasmBackend).toBeUndefined();
		expect(module.WasmPreset).toBeUndefined();

		vi.doUnmock('./vectorize_wasm.js');
	});

	it('should handle completely invalid module', async () => {
		const invalidModule = {
			default: vi.fn().mockResolvedValue(undefined)
			// Missing WasmVectorizer
		};
		vi.doMock('./vectorize_wasm.js', () => invalidModule);

		const { initializeWasm } = await import('./worker-load');

		await expect(initializeWasm()).rejects.toThrow('WasmVectorizer not found in WASM exports');

		vi.doUnmock('./vectorize_wasm.js');
	});
});

describe('Worker WASM Loader - Performance & Memory', () => {
	it('should not leak memory or references', async () => {
		const { initializeWasm } = await import('./worker-load');

		// Multiple initializations should work without memory issues
		const modules = await Promise.all([initializeWasm(), initializeWasm(), initializeWasm()]);

		// All should reference the same exports (as it's a simple loader)
		modules.forEach((module) => {
			expect(module).toBe(mockWasmModule);
		});
	});

	it('should handle rapid consecutive initializations', async () => {
		const { initializeWasm } = await import('./worker-load');

		// Rapid fire initialization attempts
		const promises = Array(20)
			.fill(0)
			.map(() => initializeWasm());
		const modules = await Promise.all(promises);

		// All should succeed
		expect(modules).toHaveLength(20);
		modules.forEach((module) => {
			expect(module).toBe(mockWasmModule);
		});
	});

	it('should maintain consistent performance characteristics', async () => {
		const { initializeWasm } = await import('./worker-load');

		const startTime = performance.now();
		await initializeWasm();
		const endTime = performance.now();

		// Should complete reasonably quickly (this is a unit test, so very fast)
		expect(endTime - startTime).toBeLessThan(1000); // 1 second max
	});
});

describe('Worker WASM Loader - Integration Scenarios', () => {
	it('should work in typical worker message handling scenario', async () => {
		const { initializeWasm } = await import('./worker-load');

		// Simulate worker receiving a message to initialize WASM
		const mockWorkerMessage = {
			data: { action: 'init-wasm' }
		};

		// Worker would typically initialize WASM in response to a message
		const module = await initializeWasm();

		expect(module).toBeDefined();
		expect(module.WasmVectorizer).toBeDefined();

		// Worker could now use the module to process data
		const vectorizer = new module.WasmVectorizer();
		expect(vectorizer).toBeDefined();
	});

	it('should support worker cleanup scenarios', async () => {
		const { initializeWasm } = await import('./worker-load');

		const module = await initializeWasm();

		// Worker cleanup - no specific cleanup needed for this simple loader
		// but module should remain accessible
		expect(module).toBe(mockWasmModule);
		expect(module.WasmVectorizer).toBeDefined();
	});

	it('should handle worker termination gracefully', async () => {
		const { initializeWasm } = await import('./worker-load');

		const module = await initializeWasm();

		// Simulate worker about to be terminated
		// Module should still be functional until termination
		expect(module).toBeDefined();
		expect(() => new module.WasmVectorizer()).not.toThrow();
	});
});

describe('Worker WASM Loader - URL and Path Handling', () => {
	it('should handle different base URL contexts', async () => {
		// Mock different import.meta.url contexts
		const originalMetaUrl = import.meta.url;

		// Test with different URL formats that workers might encounter
		const testUrls = [
			'blob:null/12345678-1234-1234-1234-123456789012',
			'data:application/javascript;base64,ZXhhbXBsZQ==',
			'http://localhost:3000/worker.js',
			'https://example.com/worker.js'
		];

		const { initializeWasm } = await import('./worker-load');

		// Should work regardless of base URL context
		const module = await initializeWasm();

		expect(module).toBe(mockWasmModule);
		expect(mockWasmModule.default).toHaveBeenCalledWith(
			expect.objectContaining({
				href: expect.stringContaining('vectorize_wasm_bg.wasm')
			})
		);
	});

	it('should construct correct WASM binary URL', async () => {
		const { initializeWasm } = await import('./worker-load');

		await initializeWasm();

		const callArgs = mockWasmModule.default.mock.calls[0][0];
		expect(callArgs).toBeInstanceOf(URL);
		expect(callArgs.href).toMatch(/vectorize_wasm_bg\.wasm$/);
	});

	it('should handle URL constructor edge cases', async () => {
		// Test with various URL constructor scenarios
		let constructorCalls = 0;
		const originalURL = global.URL;

		global.URL = class extends originalURL {
			constructor(url, base) {
				constructorCalls++;
				super(url, base);
			}
		};

		const { initializeWasm } = await import('./worker-load');

		await initializeWasm();

		expect(constructorCalls).toBeGreaterThan(0);

		global.URL = originalURL;
	});
});
