/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import path from 'path';
import { fileURLToPath } from 'node:url';
// TODO: Re-enable Storybook testing in the future
// import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
const dirname =
	typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// Storybook integration disabled for now due to complexity
// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig(({ mode }) => ({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		exclude: ['src/stories/**'], // Exclude Storybook stories
		environment: 'happy-dom',
		globals: true,
		setupFiles: ['./tests/setup.ts'],
		// Force browser mode for Svelte 5 components
		browser: {
			enabled: false, // We use happy-dom instead of real browser
			provider: 'playwright',
			name: 'chromium'
		},
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html', 'lcov'],
			reportsDirectory: './coverage',
			exclude: [
				'node_modules/**',
				'tests/**',
				'**/*.d.ts',
				'**/*.config.*',
				'src/lib/wasm/vectorize_wasm.d.ts',
				'src/lib/wasm/vectorize_wasm_bg.wasm.d.ts',
				'src/app.d.ts',
				'build/**',
				'.svelte-kit/**',
				'src/stories/**' // Exclude Storybook stories from coverage
			],
			thresholds: {
				global: {
					statements: 80,
					branches: 75,
					functions: 80,
					lines: 80
				},
				// Higher thresholds for critical files
				'src/lib/utils/**': {
					statements: 95,
					branches: 90,
					functions: 95,
					lines: 95
				},
				'src/lib/components/ui/**': {
					statements: 90,
					branches: 85,
					functions: 90,
					lines: 90
				}
			},
			all: true,
			skipFull: false
		},
		// Performance testing configuration
		benchmark: {
			include: ['src/**/*.{bench,benchmark}.{js,ts}'],
			reporters: ['verbose']
		}
		// TODO: Re-enable Storybook testing project in the future
		// projects: [
		// 	{
		// 		extends: true,
		// 		plugins: [
		// 			storybookTest({
		// 				configDir: path.join(dirname, '.storybook')
		// 			})
		// 		],
		// 		test: {
		// 			name: 'storybook',
		// 			browser: {
		// 				enabled: true,
		// 				headless: true,
		// 				provider: 'playwright',
		// 				instances: [
		// 					{
		// 						browser: 'chromium'
		// 					}
		// 				]
		// 			},
		// 			setupFiles: ['.storybook/vitest.setup.ts']
		// 		}
		// 	}
		// ]
	},
	define: {
		// Force browser mode for Svelte components
		'import.meta.env.SSR': false,
		'process.env.NODE_ENV': '"test"'
	},
	resolve: {
		alias: {
			$lib: path.resolve('./src/lib'),
			'@tests': path.resolve('./tests')
		},
		// CRITICAL: Tell Vite to use browser conditions in test mode for Svelte 5
		conditions: mode === 'test' ? ['browser'] : []
	}
}));
