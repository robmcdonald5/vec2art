import type { StorybookConfig } from '@storybook/sveltekit';

const config: StorybookConfig = {
	stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|ts|svelte)'],
	addons: [
		'@storybook/addon-svelte-csf',
		'@chromatic-com/storybook',
		'@storybook/addon-docs',
		'@storybook/addon-a11y',
		'@storybook/addon-vitest'
	],
	framework: {
		name: '@storybook/sveltekit',
		options: {}
	},
	core: {
		disableTelemetry: true
	},
	typescript: {
		check: false,
		reactDocgen: 'react-docgen-typescript',
		reactDocgenTypescriptOptions: {
			shouldExtractLiteralValuesFromEnum: true,
			propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true)
		}
	},
	viteFinal: async (config, { configType }) => {
		// Ensure proper handling of Tailwind CSS
		const { mergeConfig } = await import('vite');

		return mergeConfig(config, {
			css: {
				postcss: {
					plugins: [require('@tailwindcss/postcss'), require('autoprefixer')]
				}
			}
		});
	}
};

export default config;
