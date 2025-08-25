// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook';

import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
	js.configs.recommended,
	...svelte.configs['flat/recommended'],
	prettier,
	...svelte.configs['flat/prettier'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: '@typescript-eslint/parser'
			}
		}
	},
	{
		ignores: [
			'build/',
			'.svelte-kit/',
			'dist/',
			'src/lib/wasm/**/*.js',
			'src/lib/wasm/**/*.d.ts',
			'static/wasm/**/*.js',
			'static/wasm/**/*.d.ts',
			'public/wasm-loader.js',
			'node_modules/',
			'storybook-static/',
			'coverage/',
			'.storybook/**/*',
			'src/stories/**/*',
			'tests/algorithm-validation/**/*.js',
			'src/lib/stores/*.svelte.ts',
			// Additional generated/build artifacts to ignore
			'playwright-report/**/*',
			'test-results/**/*',
			'tests/e2e/test-results/**/*',
			'*.tsbuildinfo',
			'**/*.generated.*',
			'**/*.config.js.timestamp-*',
			'.env*'
		]
	},
	...storybook.configs['flat/recommended']
];
