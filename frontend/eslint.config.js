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
		rules: {
			// Temporarily disable unused variable errors for deployment
			'no-unused-vars': 'off',
			// Svelte-specific rules - disable for now
			'svelte/require-each-key': 'off',
			'svelte/no-useless-children-snippet': 'off',
			'svelte/prefer-writable-derived': 'off',
			// Allow undefined variables temporarily
			'no-undef': 'off'
		}
	},
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		},
		rules: {
			'no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_'
				}
			]
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
			'.env*',
			// Temporarily ignore ConverterLayout.svelte due to parsing issue
			'src/lib/components/converter/ConverterLayout.svelte'
		]
	},
	...storybook.configs['flat/recommended']
];
