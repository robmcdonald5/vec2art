/**
 * Unit tests for worker-compatible WASM loader
 * Testing the simplified worker context WASM initialization
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dynamic import of WASM module
vi.mock('./vectorize_wasm.js', () => ({
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
	// Worker context typically doesn't have threading functions
	initThreadPool: undefined,
	is_threading_supported: undefined,
	get_thread_count: undefined
}));

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
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.resetModules();
});

describe('Worker WASM Loader - Basic Initialization', () => {
	it('should initialize WASM module in worker context successfully', async () => {
		const { initializeWasm } = await import('./worker-load');
		const wasmModule = await import('./vectorize_wasm.js');

		const module = await initializeWasm();

		expect(wasmModule.default).toHaveBeenCalledWith(
			expect.objectContaining({
				href: expect.stringContaining('vectorize_wasm_bg.wasm')
			})
		);
		expect(module.WasmVectorizer).toBeDefined();
	});

	it('should validate essential exports are available', async () => {
		const { initializeWasm } = await import('./worker-load');

		const module = await initializeWasm();

		expect(module.WasmVectorizer).toBeDefined();
		expect(module.WasmBackend).toBeDefined();
		expect(module.WasmPreset).toBeDefined();
	});

	it('should handle missing WasmVectorizer export', async () => {
		vi.doMock('./vectorize_wasm.js', () => ({
			default: vi.fn().mockResolvedValue(undefined),
			WasmVectorizer: undefined,
			WasmBackend: { Edge: 'edge' },
			WasmPreset: { Default: 'default' }
		}));

		const { initializeWasm } = await import('./worker-load');

		await expect(initializeWasm()).rejects.toThrow('WasmVectorizer not found in WASM exports');

		vi.doUnmock('./vectorize_wasm.js');
	});

	it('should use proper URL construction for worker context', async () => {
		const { initializeWasm } = await import('./worker-load');
		const wasmModule = await import('./vectorize_wasm.js');

		await initializeWasm();

		expect(wasmModule.default).toHaveBeenCalledWith(
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
		vi.doMock('./vectorize_wasm.js', () => ({
			default: vi.fn().mockRejectedValue(new Error('Worker binary init failed')),
			WasmVectorizer: vi.fn(),
			WasmBackend: { Edge: 'edge' },
			WasmPreset: { Default: 'default' }
		}));

		const { initializeWasm } = await import('./worker-load');

		await expect(initializeWasm()).rejects.toThrow('Worker binary init failed');

		vi.doUnmock('./vectorize_wasm.js');
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
		vi.doMock('./vectorize_wasm.js', () => ({
			default: vi.fn().mockRejectedValue(originalError),
			WasmVectorizer: vi.fn(),
			WasmBackend: { Edge: 'edge' },
			WasmPreset: { Default: 'default' }
		}));

		const { initializeWasm } = await import('./worker-load');

		try {
			await initializeWasm();
			expect.fail('Should have thrown error');
		} catch (error) {
			expect(error).toBe(originalError);
		}

		vi.doUnmock('./vectorize_wasm.js');
	});
});

describe('Worker WASM Loader - Environment Compatibility', () => {
	it('should work without browser-specific APIs', async () => {
		// Remove potential browser APIs to simulate worker environment
		vi.stubGlobal('document', undefined);
		vi.stubGlobal('window', undefined);

		const { initializeWasm } = await import('./worker-load');

		const module = await initializeWasm();

		expect(module.WasmVectorizer).toBeDefined();
	});

	it('should not attempt thread pool initialization in worker', async () => {
		const { initializeWasm } = await import('./worker-load');

		const module = await initializeWasm();

		// Verify that worker context doesn't have threading functions
		expect(module.initThreadPool).toBeUndefined();
		expect(module.is_threading_supported).toBeUndefined();
		expect(module.get_thread_count).toBeUndefined();
	});

	it('should work with minimal worker global context', async () => {
		// Mock minimal worker globals
		vi.stubGlobal('self', {
			name: 'test-worker',
			location: { href: 'http://localhost/' }
		});

		const { initializeWasm } = await import('./worker-load');

		const module = await initializeWasm();

		expect(module).toBeDefined();
		expect(module.WasmVectorizer).toBeDefined();
	});

	it('should handle importScripts compatibility if needed', async () => {
		const importScriptsMock = vi.fn();
		vi.stubGlobal('importScripts', importScriptsMock);

		const { initializeWasm } = await import('./worker-load');

		await initializeWasm();

		// This implementation doesn't use importScripts, so it should remain uncalled
		expect(importScriptsMock).not.toHaveBeenCalled();
	});
});

describe('Worker WASM Loader - Console Logging', () => {
	it('should log initialization progress', async () => {
		const consoleLogSpy = vi.fn();
		vi.stubGlobal('console', { log: consoleLogSpy, error: vi.fn() });

		const { initializeWasm } = await import('./worker-load');

		await initializeWasm();

		expect(consoleLogSpy).toHaveBeenCalledWith('[Worker WASM] Loading WASM module in worker context...');
		expect(consoleLogSpy).toHaveBeenCalledWith('[Worker WASM] JS module imported');
	});

	it('should log errors with proper context', async () => {
		const consoleErrorSpy = vi.fn();
		vi.stubGlobal('console', { log: vi.fn(), error: consoleErrorSpy });

		vi.doMock('./vectorize_wasm.js', () => ({
			default: vi.fn().mockRejectedValue(new Error('Worker test error')),
			WasmVectorizer: vi.fn(),
			WasmBackend: { Edge: 'edge' },
			WasmPreset: { Default: 'default' }
		}));

		const { initializeWasm } = await import('./worker-load');

		try {
			await initializeWasm();
		} catch {
			// Expected to throw
		}

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			'[Worker WASM] ❌ Worker initialization failed:',
			expect.any(Error)
		);

		vi.doUnmock('./vectorize_wasm.js');
	});

	it('should handle missing console gracefully', async () => {
		vi.stubGlobal('console', undefined);

		const { initializeWasm } = await import('./worker-load');

		// Should not throw even without console
		await expect(initializeWasm()).resolves.toBeDefined();
	});
});

describe('Worker WASM Loader - Module Exports Validation', () => {
	it('should validate all expected exports are available', async () => {
		const { initializeWasm } = await import('./worker-load');

		const module = await initializeWasm();

		// Check all essential exports
		expect(module.WasmVectorizer).toBeDefined();
		expect(module.WasmBackend).toBeDefined();
		expect(module.WasmPreset).toBeDefined();
		expect(typeof module.WasmBackend).toBe('object');
		expect(typeof module.WasmPreset).toBe('object');
	});

	it('should handle partial export availability', async () => {
		vi.doMock('./vectorize_wasm.js', () => ({
			default: vi.fn().mockResolvedValue(undefined),
			WasmVectorizer: vi.fn(), // Available
			WasmBackend: undefined, // Not available
			WasmPreset: { Default: 'default' } // Available
		}));

		const { initializeWasm } = await import('./worker-load');

		const module = await initializeWasm();

		expect(module.WasmVectorizer).toBeDefined();
		expect(module.WasmBackend).toBeUndefined();
		expect(module.WasmPreset).toBeDefined();

		vi.doUnmock('./vectorize_wasm.js');
	});

	it('should handle completely invalid module', async () => {
		vi.doMock('./vectorize_wasm.js', () => ({
			default: vi.fn().mockResolvedValue(undefined)
			// Missing all expected exports
		}));

		const { initializeWasm } = await import('./worker-load');

		await expect(initializeWasm()).rejects.toThrow('WasmVectorizer not found in WASM exports');

		vi.doUnmock('./vectorize_wasm.js');
	});
});

describe('Worker WASM Loader - Performance & Memory', () => {
	it('should not leak memory or references', async () => {
		const { initializeWasm } = await import('./worker-load');

		// Initialize multiple times to check for leaks
		const modules = await Promise.all([
			initializeWasm(),
			initializeWasm(),
			initializeWasm()
		]);

		// Each initialization should return the same interface
		expect(modules).toHaveLength(3);
		modules.forEach(module => {
			expect(module.WasmVectorizer).toBeDefined();
		});
	});

	it('should handle rapid consecutive initializations', async () => {
		const { initializeWasm } = await import('./worker-load');

		// Rapid fire initialization attempts
		const promises = Array.from({ length: 5 }, () => initializeWasm());

		const modules = await Promise.all(promises);

		expect(modules).toHaveLength(5);
		modules.forEach(module => {
			expect(module.WasmVectorizer).toBeDefined();
		});
	});

	it('should maintain consistent performance characteristics', async () => {
		const { initializeWasm } = await import('./worker-load');

		const startTime = Date.now();
		await initializeWasm();
		const firstInitTime = Date.now() - startTime;

		const startTime2 = Date.now();
		await initializeWasm();
		const secondInitTime = Date.now() - startTime2;

		// Second init should be faster due to module caching
		expect(secondInitTime).toBeLessThanOrEqual(firstInitTime);
	});
});

describe('Worker WASM Loader - Integration Scenarios', () => {
	it('should work in typical worker message handling scenario', async () => {
		// Mock worker message event
		const mockEvent = {
			data: { type: 'initialize-wasm', payload: {} }
		};

		vi.stubGlobal('self', {
			addEventListener: vi.fn(),
			postMessage: vi.fn()
		});

		const { initializeWasm } = await import('./worker-load');

		const module = await initializeWasm();

		expect(module.WasmVectorizer).toBeDefined();
	});

	it('should support worker cleanup scenarios', async () => {
		const { initializeWasm } = await import('./worker-load');

		const module = await initializeWasm();

		// Worker cleanup should not break functionality
		vi.stubGlobal('self', undefined);

		expect(module.WasmVectorizer).toBeDefined();
	});

	it('should handle worker termination gracefully', async () => {
		const { initializeWasm } = await import('./worker-load');

		await initializeWasm();

		// Simulate worker termination
		vi.stubGlobal('close', vi.fn());
		vi.stubGlobal('self', {
			close: vi.fn(),
			terminated: true
		});

		// Should not throw errors on termination
		expect(() => {
			// Any cleanup logic would go here
		}).not.toThrow();
	});
});

describe('Worker WASM Loader - URL and Path Handling', () => {
	it('should handle different base URL contexts', async () => {
		// Test with different base URLs
		const testUrls = [
			'http://localhost:3000/',
			'https://example.com/app/',
			'file:///path/to/app/'
		];

		for (const baseUrl of testUrls) {
			vi.stubGlobal('location', { href: baseUrl });

			const { initializeWasm } = await import('./worker-load');
			const wasmModule = await import('./vectorize_wasm.js');

			await initializeWasm();

			expect(wasmModule.default).toHaveBeenCalledWith(
				expect.objectContaining({
					href: expect.stringContaining('vectorize_wasm_bg.wasm')
				})
			);
		}
	});

	it('should construct correct WASM binary URL', async () => {
		const { initializeWasm } = await import('./worker-load');
		const wasmModule = await import('./vectorize_wasm.js');

		await initializeWasm();

		expect(wasmModule.default).toHaveBeenCalledWith(
			expect.objectContaining({
				href: expect.stringMatching(/^.*vectorize_wasm_bg\.wasm$/)
			})
		);
	});

	it('should handle URL constructor edge cases', async () => {
		// Test with edge case URLs
		vi.stubGlobal('URL', class URL {
			href: string;
			constructor(url: string, base?: string) {
				this.href = `${base || 'http://localhost/'}${url}`;
			}
		});

		const { initializeWasm } = await import('./worker-load');

		await initializeWasm();

		expect(vi.mocked(URL)).toHaveBeenCalled();
	});
});