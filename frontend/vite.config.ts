import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
	plugins: [
		wasm(), // Re-enabled with proper exclusions
		topLevelAwait(),
		tailwindcss(),
		{
			name: 'configure-response-headers',
			configureServer: (server) => {
				server.middlewares.use((_req, res, next) => {
					res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
					res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
					next();
				});
			}
		},
		sveltekit()
	],
	resolve: {
		alias: {
			__wbindgen_placeholder__: '/wasm/__wbindgen_placeholder__.js'
		}
	},
	optimizeDeps: {
		include: ['class-variance-authority', 'tailwind-merge', 'clsx', 'svelte-image-viewer'],
		exclude: [
			'vectorize-wasm',
			'/wasm/vectorize_wasm.js', // Exclude our static WASM files
			'svelte/motion' // Exclude svelte/motion from optimization
		]
	},
	server: {
		headers: {
			// Required for SharedArrayBuffer and WASM threading
			'Cross-Origin-Embedder-Policy': 'require-corp',
			'Cross-Origin-Opener-Policy': 'same-origin'
		},
		fs: {
			// Allow serving files from the WASM package
			allow: ['..']
		}
	},
	preview: {
		headers: {
			// Required for SharedArrayBuffer and WASM threading
			'Cross-Origin-Embedder-Policy': 'require-corp',
			'Cross-Origin-Opener-Policy': 'same-origin'
		}
	},
	worker: {
		format: 'es',
		rollupOptions: {
			output: {
				// Ensure workers maintain proper module URLs
				entryFileNames: '[name].js'
			}
		}
	},
	build: {
		target: 'esnext',
		rollupOptions: {
			output: {
				// Ensure WASM files are handled correctly
				assetFileNames: (assetInfo) => {
					if (assetInfo.name?.endsWith('.wasm')) {
						return 'wasm/[name]-[hash][extname]';
					}
					return 'assets/[name]-[hash][extname]';
				}
			}
		}
	}
});
