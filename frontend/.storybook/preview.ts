import type { Preview } from '@storybook/sveltekit';
import '../src/app.css';

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i
			}
		},
		layout: 'centered',
		backgrounds: {
			default: 'light',
			values: [
				{
					name: 'light',
					value: '#ffffff'
				},
				{
					name: 'dark',
					value: '#0f172a'
				},
				{
					name: 'gray',
					value: '#f1f5f9'
				}
			]
		},
		docs: {
			toc: true,
			source: {
				type: 'dynamic'
			}
		},
		a11y: {
			config: {
				rules: [
					{
						id: 'color-contrast',
						enabled: true
					},
					{
						id: 'focus-order-semantics',
						enabled: true
					},
					{
						id: 'keyboard-navigation',
						enabled: true
					}
				]
			},
			// 'todo' - show a11y violations in the test UI only
			// 'error' - fail CI on a11y violations
			// 'off' - skip a11y checks entirely
			test: 'todo'
		}
	},
	globalTypes: {
		theme: {
			description: 'Global theme for components',
			defaultValue: 'light',
			toolbar: {
				title: 'Theme',
				icon: 'paintbrush',
				items: [
					{ value: 'light', title: 'Light', left: '☀️' },
					{ value: 'dark', title: 'Dark', left: '🌙' }
				],
				dynamicTitle: true
			}
		}
	},
	decorators: [
		(story, context) => {
			const theme = context.globals.theme;

			// Apply theme to the document
			if (typeof document !== 'undefined') {
				document.documentElement.classList.toggle('dark', theme === 'dark');
			}

			return story();
		}
	]
};

export default preview;
