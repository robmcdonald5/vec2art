import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter(),
		
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
