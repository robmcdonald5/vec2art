import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import { resolve } from 'path';

export default defineConfig({
	plugins: [
		wasm(),
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
			__wbindgen_placeholder__: '/wasm/__wbindgen_placeholder__.js',
			'@tests': resolve('./tests')
		}
	},
	assetsInclude: ['**/*.wasm'],
	optimizeDeps: {
		include: ['class-variance-authority', 'tailwind-merge', 'clsx', 'svelte-image-viewer'],
		exclude: [
			'vectorize-wasm',
			'$lib/wasm/vectorize_wasm.js', // Exclude our WASM JS wrapper
			'svelte/motion' // Exclude svelte/motion from optimization
		]
	},
	server: {
		fs: {
			// Allow serving files from the WASM package
			allow: ['..']
		}
	},
	worker: {
		format: 'es',
		rollupOptions: {
			output: {
				// Ensure workers are properly versioned for cache busting
				entryFileNames: '[name]-[hash].js'
			}
		}
	},
	build: {
		target: 'esnext',
		// Optimize chunk size
		chunkSizeWarningLimit: 1000,
		rollupOptions: {
			output: {
				// Ensure WASM files are handled correctly
				assetFileNames: (assetInfo) => {
					if (assetInfo.name?.endsWith('.wasm')) {
						return 'wasm/[name]-[hash][extname]';
					}
					return 'assets/[name]-[hash][extname]';
				},
				// Improve code splitting
				manualChunks: {
					svelte: ['svelte', '@sveltejs/kit'],
					ui: ['lucide-svelte', 'class-variance-authority', 'tailwind-merge'],
					embla: ['embla-carousel', 'embla-carousel-svelte', 'embla-carousel-autoplay']
				}
			}
		},
		// Minify for production
		minify: 'terser'
	},
	// Ensure build process exits properly
	esbuild: {
		// Prevent esbuild from hanging
		keepNames: false
	}
});
