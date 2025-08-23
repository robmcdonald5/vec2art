import '@testing-library/jest-dom/vitest';
import { setupBrowserMocks } from './test-utils';

// Force browser mode
Object.defineProperty(globalThis, 'import', {
	value: {
		meta: {
			env: {
				SSR: false,
				MODE: 'test'
			}
		}
	}
});

// Setup global browser mocks
setupBrowserMocks();
