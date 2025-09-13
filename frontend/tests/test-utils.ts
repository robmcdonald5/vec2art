/**
 * Comprehensive test utilities for vec2art frontend testing
 * Provides reusable mocks, setup functions, and testing helpers
 */

import { vi } from 'vitest';
import { render } from '@testing-library/svelte';
import type { CPUCapabilities, PerformanceRecommendation } from '$lib/utils/cpu-detection';
import type { ComponentType, SvelteComponent } from 'svelte';

// Type definitions for enhanced testing
export interface MockFile extends File {
	arrayBuffer(): Promise<ArrayBuffer>;
	stream(): ReadableStream<Uint8Array>;
}

export interface MockFileList extends FileList {
	[index: number]: MockFile;
	length: number;
	item(index: number): MockFile | null;
}

export interface TestRenderOptions {
	props?: Record<string, any>;
	context?: Map<any, any>;
	target?: HTMLElement;
}

/**
 * Mock browser APIs consistently across tests
 */
export function setupBrowserMocks() {
	// Mock document.createElement for WebGL detection
	const originalCreateElement = document.createElement;
	vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
		if (tagName === 'canvas') {
			return {
				getContext: vi.fn().mockReturnValue({}),
				// Add other canvas methods as needed
				width: 0,
				height: 0,
				toDataURL: vi.fn(),
				getImageData: vi.fn()
			} as any;
		}
		return originalCreateElement.call(document, tagName);
	});

	// Mock navigator
	const mockNavigator = {
		hardwareConcurrency: 8,
		userAgent:
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
		platform: 'Win32',
		getBattery: vi.fn().mockResolvedValue({
			charging: false,
			level: 0.8
		}),
		battery: undefined,
		memory: {
			jsHeapSizeLimit: 4294967296 // 4GB
		}
	};

	Object.defineProperty(window, 'navigator', {
		value: mockNavigator,
		writable: true,
		configurable: true
	});

	// Mock WebAssembly for SIMD detection
	Object.defineProperty(window, 'WebAssembly', {
		value: {
			SIMD: true,
			instantiate: vi.fn(),
			compile: vi.fn()
		},
		writable: true,
		configurable: true
	});

	// Mock SharedArrayBuffer
	Object.defineProperty(window, 'SharedArrayBuffer', {
		value: class MockSharedArrayBuffer {
			constructor(public length: number) {}
		},
		writable: true,
		configurable: true
	});

	// Mock crossOriginIsolated
	Object.defineProperty(window, 'crossOriginIsolated', {
		value: true,
		writable: true,
		configurable: true
	});

	// Mock fetch to prevent real network requests (critical for WASM tests)
	Object.defineProperty(globalThis, 'fetch', {
		value: vi.fn().mockImplementation((url: string | URL) => {
			// Mock WASM binary fetch
			if (url.toString().includes('.wasm')) {
				console.log(`[Test Mock] Mocked WASM fetch: ${url.toString()}`);
				return Promise.resolve({
					ok: true,
					status: 200,
					arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
					blob: () => Promise.resolve(new Blob([new ArrayBuffer(1024)])),
					json: () => Promise.resolve({}),
					text: () => Promise.resolve(''),
					headers: new Map(),
					url: url.toString()
				} as Response);
			}
			// Mock other network requests
			console.log(`[Test Mock] Mocked fetch: ${url.toString()}`);
			return Promise.resolve({
				ok: true,
				status: 200,
				json: () => Promise.resolve({}),
				text: () => Promise.resolve(''),
				arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
				blob: () => Promise.resolve(new Blob()),
				headers: new Map(),
				url: url.toString()
			} as Response);
		}),
		writable: true,
		configurable: true
	});

	// Mock performance for timing
	if (!window.performance) {
		Object.defineProperty(window, 'performance', {
			value: {
				now: vi.fn(() => Date.now())
			},
			writable: true,
			configurable: true
		});
	}

	// Mock File constructor (critical for tests)
	if (!globalThis.File) {
		globalThis.File = class MockFile {
			public name: string;
			public size: number;
			public type: string;
			public lastModified: number;

			constructor(fileBits: BlobPart[], fileName: string, options?: FilePropertyBag) {
				this.name = fileName;
				this.type = options?.type || '';
				this.lastModified = options?.lastModified || Date.now();

				// Calculate size from file bits
				this.size = fileBits.reduce((total, part) => {
					if (typeof part === 'string') return total + new TextEncoder().encode(part).length;
					if (part instanceof ArrayBuffer) return total + part.byteLength;
					if (part instanceof Uint8Array) return total + part.byteLength;
					return total;
				}, 0);
			}

			async arrayBuffer(): Promise<ArrayBuffer> {
				return new ArrayBuffer(this.size);
			}

			async text(): Promise<string> {
				return '';
			}

			stream(): ReadableStream<Uint8Array> {
				return new ReadableStream({
					start(controller) {
						controller.enqueue(new Uint8Array(this.size));
						controller.close();
					}
				});
			}
		} as any;
	}

	// Mock FileList constructor
	if (!globalThis.FileList) {
		globalThis.FileList = class MockFileList extends Array<File> {
			item(index: number): File | null {
				return this[index] || null;
			}
		} as any;
	}

	// Mock DataTransfer for drag/drop tests
	if (!globalThis.DataTransfer) {
		globalThis.DataTransfer = class MockDataTransfer {
			public files: FileList = new FileList();
			public items = {
				add: vi.fn((file: File) => {
					(this.files as any).push(file);
				})
			};
		} as any;
	}

	// Mock DragEvent for file drop tests
	if (!globalThis.DragEvent) {
		globalThis.DragEvent = class MockDragEvent extends Event {
			public dataTransfer: DataTransfer | null;

			constructor(type: string, eventInit?: DragEventInit) {
				super(type, eventInit);
				this.dataTransfer = eventInit?.dataTransfer || null;
			}
		} as any;
	}

	return mockNavigator;
}

/**
 * Create mock CPU capabilities for testing
 */
export function createMockCapabilities(overrides?: Partial<CPUCapabilities>): CPUCapabilities {
	return {
		cores: 8,
		estimatedPerformance: 'high',
		deviceType: 'desktop',
		recommendedThreads: 6,
		maxSafeThreads: 8,
		batteryStatus: 'unknown',
		thermalState: 'nominal',
		memoryGB: 16,
		isLowEndDevice: false,
		features: {
			webgl: true,
			webgl2: true,
			simd: true,
			threading: true,
			sharedArrayBuffer: true
		},
		...overrides
	};
}

/**
 * Create mock performance recommendations for testing
 */
export function createMockRecommendations(): PerformanceRecommendation[] {
	return [
		{
			mode: 'battery',
			threadCount: 1,
			reasoning: ['Minimal CPU usage', 'Extends battery life'],
			warnings: [],
			estimatedProcessingTime: '3-5 seconds',
			cpuUsageEstimate: 25
		},
		{
			mode: 'balanced',
			threadCount: 6,
			reasoning: ['Uses 6/8 cores', 'Good balance of speed and efficiency'],
			warnings: [],
			estimatedProcessingTime: '1-2 seconds',
			cpuUsageEstimate: 60
		},
		{
			mode: 'performance',
			threadCount: 8,
			reasoning: ['Uses 8/8 cores', 'Maximum processing speed'],
			warnings: ['High CPU usage'],
			estimatedProcessingTime: '0.8-1.5 seconds',
			cpuUsageEstimate: 85
		}
	];
}

/**
 * File testing utilities
 */
export const fileTestUtils = {
	/**
	 * Create a mock File object for testing
	 */
	createMockFile(
		name: string,
		size: number,
		type: string,
		content?: string | ArrayBuffer
	): MockFile {
		const buffer =
			content instanceof ArrayBuffer
				? content
				: new TextEncoder().encode(content || `Mock content for ${name}`).buffer;

		const file = new File([buffer], name, { type }) as MockFile;

		// Add additional methods
		file.arrayBuffer = vi.fn().mockResolvedValue(buffer);
		file.stream = vi.fn().mockReturnValue(
			new ReadableStream({
				start(controller) {
					controller.enqueue(new Uint8Array(buffer));
					controller.close();
				}
			})
		);

		return file;
	},

	/**
	 * Create a mock FileList object
	 */
	createMockFileList(files: MockFile[]): MockFileList {
		const fileList = files as any as MockFileList;
		fileList.length = files.length;
		fileList.item = (index: number) => files[index] || null;
		return fileList;
	},

	/**
	 * Create common test image files
	 */
	createTestImageFiles() {
		return {
			png: this.createMockFile('test-image.png', 1024 * 50, 'image/png'),
			jpg: this.createMockFile('test-image.jpg', 1024 * 30, 'image/jpeg'),
			webp: this.createMockFile('test-image.webp', 1024 * 25, 'image/webp'),
			avif: this.createMockFile('test-image.avif', 1024 * 20, 'image/avif'),
			large: this.createMockFile('large-image.png', 1024 * 1024 * 10, 'image/png'), // 10MB
			invalid: this.createMockFile('invalid.txt', 1024, 'text/plain')
		};
	}
};

/**
 * Component testing utilities
 */
export const componentTestUtils = {
	/**
	 * Render a Svelte component with enhanced options
	 */
	renderWithProviders<T extends SvelteComponent>(
		component: ComponentType<T>,
		options: TestRenderOptions = {}
	) {
		// Force browser mode for components
		Object.defineProperty(globalThis, 'import', {
			value: {
				meta: {
					env: {
						SSR: false,
						MODE: 'test'
					}
				}
			},
			configurable: true
		});

		return render(component, options);
	},

	/**
	 * Mock WASM module for component testing
	 */
	mockWasmLoader() {
		return {
			initializeWasm: vi.fn().mockResolvedValue(true),
			initThreadPool: vi.fn().mockResolvedValue(true),
			processImage: vi.fn().mockResolvedValue('<svg>mock result</svg>'),
			isThreadingAvailable: vi.fn().mockReturnValue(true),
			getThreadCount: vi.fn().mockReturnValue(8),
			cleanup: vi.fn()
		};
	}
};

/**
 * User interaction testing utilities
 */
export const interactionTestUtils = {
	/**
	 * Simulate drag and drop file interaction
	 */
	async dragAndDropFile(element: HTMLElement, file: MockFile): Promise<void> {
		const dataTransfer = new DataTransfer();
		dataTransfer.items.add(file);

		// Simulate drag enter
		const dragEnterEvent = new DragEvent('dragenter', {
			bubbles: true,
			dataTransfer
		});
		element.dispatchEvent(dragEnterEvent);

		// Simulate drag over
		const dragOverEvent = new DragEvent('dragover', {
			bubbles: true,
			dataTransfer
		});
		element.dispatchEvent(dragOverEvent);

		// Simulate drop
		const dropEvent = new DragEvent('drop', {
			bubbles: true,
			dataTransfer
		});
		element.dispatchEvent(dropEvent);

		// Wait for async operations
		await new Promise((resolve) => setTimeout(resolve, 0));
	},

	/**
	 * Simulate button click with proper event handling
	 */
	async clickButton(element: HTMLElement): Promise<void> {
		const clickEvent = new MouseEvent('click', {
			bubbles: true,
			cancelable: true
		});
		element.dispatchEvent(clickEvent);
		await new Promise((resolve) => setTimeout(resolve, 0));
	},

	/**
	 * Simulate keyboard interaction
	 */
	async pressKey(
		element: HTMLElement,
		key: string,
		options: KeyboardEventInit = {}
	): Promise<void> {
		const keyEvent = new KeyboardEvent('keydown', {
			key,
			bubbles: true,
			cancelable: true,
			...options
		});
		element.dispatchEvent(keyEvent);
		await new Promise((resolve) => setTimeout(resolve, 0));
	},

	/**
	 * Simulate file input change
	 */
	async changeFileInput(input: HTMLInputElement, files: MockFileList): Promise<void> {
		Object.defineProperty(input, 'files', {
			value: files,
			writable: false
		});

		const changeEvent = new Event('change', { bubbles: true });
		input.dispatchEvent(changeEvent);
		await new Promise((resolve) => setTimeout(resolve, 0));
	}
};

/**
 * Assertion utilities for testing
 */
export const assertionUtils = {
	/**
	 * Check accessibility compliance (mocked until real implementation)
	 */
	async expectAccessibility(element: HTMLElement): Promise<void> {
		// Mock implementation - would use axe-core in real scenario
		const hasAriaLabel =
			element.hasAttribute('aria-label') || element.hasAttribute('aria-labelledby');
		const hasProperRole =
			element.hasAttribute('role') ||
			element.tagName.toLowerCase() in ['button', 'input', 'select', 'textarea'];

		if (!hasAriaLabel && !hasProperRole) {
			throw new Error('Element lacks proper accessibility attributes');
		}
	},

	/**
	 * Check for reactivity warnings (Svelte specific)
	 */
	expectNoReactivityWarnings(): void {
		// Mock implementation - would check console warnings in real scenario
		const warnings = vi
			.mocked(console.warn)
			.mock.calls.filter((call) =>
				call.some((arg) => typeof arg === 'string' && arg.includes('reactive'))
			);

		if (warnings.length > 0) {
			throw new Error(`Found ${warnings.length} reactivity warnings`);
		}
	},

	/**
	 * Check performance metrics
	 */
	async expectPerformance(fn: () => Promise<void> | void, maxTime: number): Promise<void> {
		const start = performance.now();
		await fn();
		const end = performance.now();

		if (end - start > maxTime) {
			throw new Error(`Operation took ${end - start}ms, expected less than ${maxTime}ms`);
		}
	}
};

/**
 * Advanced DOM utilities
 */
export const domUtils = {
	/**
	 * Wait for element to appear in DOM
	 */
	async waitForElement(selector: string, timeout = 1000): Promise<HTMLElement> {
		return new Promise((resolve, reject) => {
			const startTime = Date.now();

			const check = () => {
				const element = document.querySelector(selector) as HTMLElement;
				if (element) {
					resolve(element);
				} else if (Date.now() - startTime > timeout) {
					reject(new Error(`Element ${selector} not found within ${timeout}ms`));
				} else {
					setTimeout(check, 10);
				}
			};

			check();
		});
	},

	/**
	 * Create a temporary DOM container for testing
	 */
	createTestContainer(): HTMLElement {
		const container = document.createElement('div');
		container.id = `test-container-${Date.now()}`;
		document.body.appendChild(container);
		return container;
	},

	/**
	 * Clean up test containers
	 */
	cleanupTestContainers(): void {
		const containers = document.querySelectorAll('[id^="test-container-"]');
		containers.forEach((container) => container.remove());
	}
};

/**
 * Storage mocking utilities
 */
export const storageUtils = {
	/**
	 * Mock localStorage
	 */
	mockLocalStorage(): Storage {
		const store: Record<string, string> = {};

		return {
			getItem: vi.fn((key: string) => store[key] || null),
			setItem: vi.fn((key: string, value: string) => {
				store[key] = value;
			}),
			removeItem: vi.fn((key: string) => {
				delete store[key];
			}),
			clear: vi.fn(() => {
				Object.keys(store).forEach((key) => delete store[key]);
			}),
			key: vi.fn((index: number) => Object.keys(store)[index] || null),
			get length() {
				return Object.keys(store).length;
			}
		};
	},

	/**
	 * Mock sessionStorage
	 */
	mockSessionStorage(): Storage {
		return this.mockLocalStorage(); // Same interface
	}
};

/**
 * Clean up after tests
 */
export function cleanupBrowserMocks() {
	vi.restoreAllMocks();
	domUtils.cleanupTestContainers();
}
