import adapterVercel from '@sveltejs/adapter-vercel';
import adapterAuto from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// Use different adapters for CI vs production
const isCI = process.env.CI === 'true' || process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';

// Adapter selection logic
const adapter = isVercel
	? adapterVercel({
			runtime: 'nodejs20.x',
			regions: ['iad1'],
			memory: 1024,
			maxDuration: 30
		})
	: isCI
		? adapterAuto() // Use auto adapter for CI builds
		: adapterVercel(); // Default Vercel adapter for local dev

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Adapter selection based on environment
		adapter,

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
