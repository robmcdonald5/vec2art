import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
	plugins: [wasm(), topLevelAwait(), tailwindcss(), sveltekit()],
	optimizeDeps: {
		include: ['class-variance-authority', 'tailwind-merge', 'clsx'],
		exclude: ['vectorize-wasm'] // Let vite-plugin-wasm handle this
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
		format: 'es'
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
