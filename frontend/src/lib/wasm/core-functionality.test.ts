/**
 * Core Functionality Tests for WASM Loaders
 * Focused on critical CPU overload prevention and threading management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock browser environment
vi.mock('$app/environment', () => ({
	browser: true
}));

// Hoisted mock module factory for proper vitest mocking
const mockWasmModule = vi.hoisted(() => ({
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
	// Single-threaded: no thread pool functions
	initThreadPool: undefined,
	confirm_threading_success: vi.fn(),
	mark_threading_failed: vi.fn(),
	is_threading_supported: vi.fn().mockReturnValue(false),
	get_thread_count: vi.fn().mockReturnValue(1),
	check_threading_requirements: vi.fn().mockReturnValue({
		crossOriginIsolated: true,
		sharedArrayBuffer: true,
		threading: false
	}),
	get_available_backends: vi.fn().mockReturnValue(['edge', 'centerline', 'superpixel', 'dots']),
	get_available_presets: vi.fn().mockReturnValue(['default', 'detailed', 'fast', 'artistic'])
}));

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
	vi.clearAllMocks();

	// Reset mock functions to default behavior after clearing
	mockWasmModule.default.mockResolvedValue(undefined);
	mockWasmModule.WasmVectorizer = vi.fn(); // Reset to a function
	mockWasmModule.is_threading_supported.mockReturnValue(false);
	mockWasmModule.get_thread_count.mockReturnValue(1);
	mockWasmModule.get_available_backends.mockReturnValue(['edge', 'centerline', 'superpixel', 'dots']);
	mockWasmModule.get_available_presets.mockReturnValue(['default', 'detailed', 'fast', 'artistic']);

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

describe('WASM Loader - Single-Threaded Loading', () => {
	it('should load WASM module successfully in single-threaded mode', async () => {
		const { loadVectorizer } = await import('./loader');

		// Load module - no threading initialization needed
		const module = await loadVectorizer();

		expect(module).toBeDefined();
		expect(mockWasmModule.default).toHaveBeenCalled();
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

		const { getCapabilities } = await import('./loader');

		const capabilities = await getCapabilities();

		expect(capabilities.crossOriginIsolated).toBe(false);
		expect(capabilities.sharedArrayBuffer).toBe(true); // Still available in non-isolated mode
	});

	it('should handle missing SharedArrayBuffer', async () => {
		vi.stubGlobal('SharedArrayBuffer', undefined);

		const { getCapabilities } = await import('./loader');

		const capabilities = await getCapabilities();

		expect(capabilities.sharedArrayBuffer).toBe(false);
	});
});

describe('WASM Loader - State Management', () => {
	it('should track module initialization state correctly', async () => {
		const { loadVectorizer } = await import('./loader');

		const module = await loadVectorizer();

		expect(module).toBeDefined();
		expect(mockWasmModule.default).toHaveBeenCalled();
	});

	it('should provide single-threaded thread count reporting', async () => {
		mockWasmModule.get_thread_count.mockReturnValue(1);

		const { loadVectorizer, getCurrentThreadCount } = await import('./loader');

		await loadVectorizer();

		expect(getCurrentThreadCount()).toBe(1);
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

	it('should load module and provide capabilities during typical page load', async () => {
		const { loadVectorizer, getCapabilities, getAvailableBackends } = await import('./loader');

		// Simulate typical page load sequence
		await loadVectorizer(); // Module loads
		await getCapabilities(); // Check what's available
		await getAvailableBackends(); // Get backend options

		// Module should be properly initialized
		expect(mockWasmModule.default).toHaveBeenCalled();
		expect(mockWasmModule.get_available_backends).toHaveBeenCalled();
	});
});
