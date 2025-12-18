import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Use adapter-auto for automatic platform detection (Vercel, Netlify, etc.)
		adapter: adapter(),

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
		// Note: script-src is handled by hooks.server.ts with Safari-specific 'wasm-unsafe-eval'
		// Removing it here prevents conflicts and ensures Safari compatibility
		csp: {
			mode: 'hash',
			directives: {
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
