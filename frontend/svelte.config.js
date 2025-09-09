import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Vercel adapter configuration for optimal deployment
		adapter: adapter({
			// Use Edge Functions for better performance
			runtime: 'nodejs20.x',
			
			// Split functions for better cold start performance
			split: true,
			
			// Configure ISR for specific routes
			isr: {
				// Gallery pages can be cached and regenerated
				expiration: 60 * 60 * 24, // 24 hours
				bypassToken: process.env.VERCEL_REVALIDATION_TOKEN,
				allowQuery: ['category', 'backend']
			},
			
			// Memory configuration for functions
			memory: 1024
		}),
		
		// CSP configuration for Cloudflare Turnstile compatibility
		csp: {
			mode: 'hash', // Use hash mode instead of nonce for better third-party compatibility
			directives: {
				'script-src': ['self', 'unsafe-eval', 'https://challenges.cloudflare.com'],
				'style-src': ['self', 'unsafe-inline'], // Required for Svelte transitions
				'frame-src': ['https://challenges.cloudflare.com'],
				'connect-src': ['self', 'https://challenges.cloudflare.com', 'https://submit-form.com', 'https://vercel.com'],
				'img-src': ['self', 'data:', 'https:', 'blob:'],
				'font-src': ['self', 'data:'],
				'worker-src': ['self', 'blob:'],
				'object-src': ['none'],
				'base-uri': ['self'],
				'form-action': ['self']
			}
		}
	}
};

export default config;
