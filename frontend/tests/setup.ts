import '@testing-library/jest-dom/vitest';
import { setupBrowserMocks } from './test-utils';

// Force browser mode for Svelte 5 - CRITICAL for component mounting
Object.defineProperty(globalThis, 'import', {
	value: {
		meta: {
			env: {
				SSR: false,
				MODE: 'test',
				PROD: false,
				DEV: true
			}
		}
	},
	configurable: true,
	writable: true
});

// Setup browser mocks FIRST to ensure DOM globals are available
setupBrowserMocks();

// AFTER mocks are set up, ensure Svelte 5 can detect browser environment
// This must come after setupBrowserMocks() to ensure document/window exist
if (typeof globalThis.document === 'undefined' && typeof document !== 'undefined') {
	globalThis.document = document;
}

if (typeof globalThis.window === 'undefined' && typeof window !== 'undefined') {
	globalThis.window = window;
}

// Additional check to force browser detection for Svelte 5
Object.defineProperty(globalThis, 'SVELTE_TEST_ENV', {
	value: 'browser',
	writable: true,
	configurable: true
});
