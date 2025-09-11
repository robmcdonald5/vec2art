import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Vercel adapter with Node.js runtime for filesystem compatibility
		adapter: adapter({
			// Use Node.js runtime for compatibility with filesystem APIs
			runtime: 'nodejs22.x', // Match Vercel project settings
			regions: ['iad1']
		}),

		// Prerender most routes for better performance
		prerender: {
			entries: [
				'*', // Prerender all discoverable pages
				'/convert', // Ensure redirect pages are handled
				'/vec2art'
			],
			handleMissingId: 'warn',
			handleHttpError: 'warn'
		},

		// Service Worker configuration
		serviceWorker: {
			register: process.env.NODE_ENV === 'production'
		},

		// Simplified CSP for WASM compatibility
		csp: {
			mode: 'hash',
			directives: {
				'script-src': ['self', 'unsafe-eval', 'https://va.vercel-scripts.com'],
				'style-src': ['self', 'unsafe-inline'],
				'connect-src': ['self'],
				'img-src': ['self', 'data:', 'https:', 'blob:'],
				'font-src': ['self', 'data:'],
				'worker-src': ['self', 'blob:'],
				'object-src': ['none'],
				'base-uri': ['self']
			}
		}
	}
};

export default config;
