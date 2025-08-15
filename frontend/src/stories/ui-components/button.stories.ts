import type { Meta, StoryObj } from '@storybook/sveltekit';
import Button from '$lib/components/ui/button.svelte';

const meta: Meta<Button> = {
	title: 'UI Components/Button',
	component: Button,
	parameters: {
		layout: 'centered',
		docs: {
			description: {
				component: `
A versatile button component built with class-variance-authority for consistent styling.
Supports multiple variants, sizes, and can be rendered as either a button or link.

**Features:**
- Multiple variants (default, destructive, outline, secondary, ghost, link)
- Various sizes (sm, default, lg, icon)
- Accessibility compliant with proper ARIA attributes
- Support for both button and link rendering
- SvelteKit 5 runes syntax with proper TypeScript support
				`
			}
		}
	},
	argTypes: {
		variant: {
			control: { type: 'select' },
			options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
			description: 'Visual variant of the button'
		},
		size: {
			control: { type: 'select' },
			options: ['sm', 'default', 'lg', 'icon'],
			description: 'Size of the button'
		},
		disabled: {
			control: { type: 'boolean' },
			description: 'Whether the button is disabled'
		},
		href: {
			control: { type: 'text' },
			description: 'If provided, renders as a link instead of button'
		},
		type: {
			control: { type: 'select' },
			options: ['button', 'submit', 'reset'],
			description: 'HTML button type attribute'
		},
		class: {
			control: { type: 'text' },
			description: 'Additional CSS classes'
		}
	},
	tags: ['autodocs']
};

export default meta;
type Story = StoryObj<meta>;

export const Default: Story = {
	args: {
		variant: 'default',
		size: 'default',
		disabled: false,
		type: 'button'
	},
	render: (args) => ({
		Component: Button,
		props: args,
		children: () => 'Click me'
	})
};

export const AllVariants: Story = {
	parameters: {
		docs: {
			description: {
				story: 'All available button variants shown together for comparison.'
			}
		}
	},
	render: () => ({
		Component: (() => {
			return {
				// Use a wrapper component to render multiple buttons
				render: () => `
					<div class="flex flex-wrap gap-4">
						<Button variant="default">Default</Button>
						<Button variant="destructive">Destructive</Button>
						<Button variant="outline">Outline</Button>
						<Button variant="secondary">Secondary</Button>
						<Button variant="ghost">Ghost</Button>
						<Button variant="link">Link</Button>
					</div>
				`
			};
		})()
	})
};

export const AllSizes: Story = {
	parameters: {
		docs: {
			description: {
				story: 'All available button sizes shown for comparison.'
			}
		}
	},
	render: () => ({
		Component: (() => {
			return {
				render: () => `
					<div class="flex items-center gap-4">
						<Button size="sm">Small</Button>
						<Button size="default">Default</Button>
						<Button size="lg">Large</Button>
						<Button size="icon">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
							</svg>
						</Button>
					</div>
				`
			};
		})()
	})
};

export const Disabled: Story = {
	args: {
		variant: 'default',
		size: 'default',
		disabled: true
	},
	render: (args) => ({
		Component: Button,
		props: args,
		children: () => 'Disabled Button'
	}),
	parameters: {
		docs: {
			description: {
				story: 'Disabled state shows reduced opacity and prevents interaction.'
			}
		}
	}
};

export const AsLink: Story = {
	args: {
		variant: 'default',
		size: 'default',
		href: '#'
	},
	render: (args) => ({
		Component: Button,
		props: args,
		children: () => 'Button as Link'
	}),
	parameters: {
		docs: {
			description: {
				story: 'When href is provided, the button renders as an anchor tag with button styling.'
			}
		}
	}
};

export const WithIcon: Story = {
	render: () => ({
		Component: (() => {
			return {
				render: () => `
					<div class="flex gap-4">
						<Button variant="default">
							<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
							</svg>
							Add Item
						</Button>
						<Button variant="outline">
							Download
							<svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
							</svg>
						</Button>
					</div>
				`
			};
		})()
	}),
	parameters: {
		docs: {
			description: {
				story: 'Buttons can include icons to enhance meaning and visual appeal.'
			}
		}
	}
};

export const LoadingState: Story = {
	render: () => ({
		Component: (() => {
			return {
				render: () => `
					<div class="flex gap-4">
						<Button disabled variant="default">
							<svg class="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Processing...
						</Button>
					</div>
				`
			};
		})()
	}),
	parameters: {
		docs: {
			description: {
				story: 'Loading state with spinner icon and disabled interaction.'
			}
		}
	}
};

export const Interactive: Story = {
	args: {
		variant: 'default',
		size: 'default',
		onclick: () => alert('Button clicked!')
	},
	render: (args) => ({
		Component: Button,
		props: args,
		children: () => 'Click for Alert'
	}),
	parameters: {
		docs: {
			description: {
				story: 'Interactive button with click handler. Click to see the alert.'
			}
		}
	}
};

export const Accessibility: Story = {
	parameters: {
		docs: {
			description: {
				story: `
**Accessibility Features:**
- Proper focus management with visible focus rings
- Keyboard navigation support (Enter/Space)
- Screen reader compatible with semantic HTML
- Disabled state properly communicated to assistive technologies
- High contrast support in design tokens
				`
			}
		}
	},
	render: () => ({
		Component: (() => {
			return {
				render: () => `
					<div class="space-y-4">
						<p class="text-sm text-gray-600">Try tabbing through these buttons:</p>
						<div class="flex gap-4">
							<Button>First Button</Button>
							<Button variant="outline">Second Button</Button>
							<Button disabled>Disabled Button</Button>
							<Button variant="ghost">Ghost Button</Button>
						</div>
					</div>
				`
			};
		})()
	})
};
