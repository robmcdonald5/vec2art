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
		// Note: Cross-Origin Isolation headers removed to match production configuration
		// The WASM module uses single-threaded architecture and doesn't require SharedArrayBuffer
		// These headers were causing conflicts with Safari and third-party resources
		sveltekit()
	],
	resolve: {
		alias: {
			'./__wbindgen_placeholder__.js': resolve('./src/lib/wasm/__wbindgen_placeholder__.js'),
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
				// Let Vite handle automatic code splitting
				manualChunks: undefined
			}
		},
		// Use default minification (esbuild)
		minify: true
	},
	// Ensure build process exits properly
	esbuild: {
		// Prevent esbuild from hanging
		keepNames: false
	}
});
