import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Vercel adapter with explicit configuration for WASM + SvelteKit
		adapter: adapter({
			runtime: 'nodejs20.x',
			regions: ['iad1'], // US East for optimal performance
			memory: 1024, // Increased memory for WASM processing
			maxDuration: 30 // Max function duration for WASM operations
		}),

		// Prerender specific routes
		prerender: {
			entries: ['/sitemap.xml'],
			handleUnseenRoutes: 'ignore'
		},

		// Service Worker configuration
		serviceWorker: {
			register: process.env.NODE_ENV === 'production'
		},

		// Simplified CSP for WASM compatibility
		csp: {
			mode: 'hash',
			directives: {
				'script-src': [
					'self',
					'unsafe-eval',
					'https://va.vercel-scripts.com',
					'https://challenges.cloudflare.com'
				],
				'style-src': ['self', 'unsafe-inline'],
				'connect-src': ['self', 'https://challenges.cloudflare.com', 'https://submit-form.com'],
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
