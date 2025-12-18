// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook';

import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
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
			'no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
					ignoreRestSiblings: true
				}
			],
			'svelte/require-each-key': 'error',
			'svelte/no-useless-children-snippet': 'warn',
			'svelte/prefer-writable-derived': 'warn',
			'svelte/prefer-svelte-reactivity': 'warn'
		}
	},
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
				NodeJS: 'readonly',
				EventListener: 'readonly'
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
		files: ['src/**/*.ts', 'src/**/*.tsx'],
		ignores: [
			'src/**/*.test.ts',
			'src/**/*.spec.ts',
			'src/lib/services/performance-*.ts',
			'src/lib/services/analytics-*.ts',
			'src/lib/services/dev-tools.ts',
			'src/lib/services/error-tracker.ts',
			'src/lib/services/resource-monitor.ts',
			'src/lib/services/ux-analytics.ts',
			'src/lib/services/index.ts'
		],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
				project: './tsconfig.json',
				tsconfigRootDir: process.cwd()
			},
			globals: {
				...globals.browser,
				...globals.node,
				NodeJS: 'readonly',
				EventListener: 'readonly',
				HTMLElementTagNameMap: 'readonly'
			}
		},
		plugins: {
			'@typescript-eslint': ts
		},
		rules: {
			'no-unused-vars': 'off',
			'no-undef': 'off', // TypeScript handles this
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_'
				}
			]
		}
	},
	// Handle test and config files that are not in the TypeScript project
	{
		files: [
			'tests/**/*.ts',
			'tests/**/*.tsx',
			'*.config.ts',
			'static/**/*.ts',
			'src/**/*.test.ts',
			'src/**/*.spec.ts',
			'src/lib/services/performance-*.ts',
			'src/lib/services/analytics-*.ts',
			'src/lib/services/dev-tools.ts',
			'src/lib/services/error-tracker.ts',
			'src/lib/services/resource-monitor.ts',
			'src/lib/services/ux-analytics.ts',
			'src/lib/services/index.ts'
		],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module'
				// No project for these files
			},
			globals: {
				...globals.browser,
				...globals.node,
				NodeJS: 'readonly',
				EventListener: 'readonly',
				HTMLElementTagNameMap: 'readonly'
			}
		},
		plugins: {
			'@typescript-eslint': ts
		},
		rules: {
			'no-unused-vars': 'off',
			'no-undef': 'off',
			'@typescript-eslint/no-unused-vars': [
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
				parser: tsParser,
				extraFileExtensions: ['.svelte']
			}
		},
		rules: {
			'no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
					ignoreRestSiblings: true
				}
			],
			// Disable new rule requiring resolve() for navigation - not needed for simple internal links
			'svelte/no-navigation-without-resolve': 'off'
		}
	},
	{
		ignores: [
			'build/',
			'.svelte-kit/',
			'.vercel/',
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
