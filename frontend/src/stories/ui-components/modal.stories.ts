import type { Meta, StoryObj } from '@storybook/sveltekit';
import Modal from '$lib/components/ui/modal.svelte'; // Storybook - keep direct import
import Button from '$lib/components/ui/button.svelte'; // Storybook - keep direct import

const meta: Meta<Modal> = {
	title: 'UI Components/Modal',
	component: Modal,
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component: `
A fully accessible modal dialog component with comprehensive keyboard and focus management.

**Features:**
- Proper focus management and keyboard trapping
- ESC key and backdrop click to close
- ARIA labels and proper semantic structure
- Transition animations with svelte/transition
- Automatic focus restoration when closed
- SvelteKit 5 runes syntax with reactive state management

**Accessibility:**
- Focus is trapped within the modal when open
- First focusable element is automatically focused
- Focus returns to the triggering element when closed
- Screen reader friendly with proper ARIA attributes
- High contrast support
				`
			}
		}
	},
	argTypes: {
		open: {
			control: { type: 'boolean' },
			description: 'Whether the modal is open'
		},
		title: {
			control: { type: 'text' },
			description: 'Optional title for the modal header'
		},
		description: {
			control: { type: 'text' },
			description: 'Optional description shown under the title'
		},
		class: {
			control: { type: 'text' },
			description: 'Additional CSS classes for the modal content'
		}
	},
	tags: ['autodocs']
};

export default meta;
type Story = StoryObj<meta>;

export const Default: Story = {
	args: {
		open: false,
		title: 'Default Modal',
		description: 'This is a basic modal example.'
	},
	render: (args) => {
		let open = args.open;

		return {
			Component: (() => {
				return {
					render: () => `
						<div>
							<Button onclick={() => open = true}>Open Modal</Button>
							<Modal 
								{open} 
								onClose={() => open = false}
								title="${args.title || ''}"
								description="${args.description || ''}"
								class="${args.class || ''}"
							>
								<div class="p-6">
									<p class="mb-4">This is the modal content. You can put any content here.</p>
									<div class="flex gap-2">
										<Button onclick={() => open = false}>Close</Button>
										<Button variant="outline" onclick={() => open = false}>Cancel</Button>
									</div>
								</div>
							</Modal>
						</div>
					`
				};
			})()
		};
	}
};

export const WithTitle: Story = {
	args: {
		open: false,
		title: 'Confirm Action',
		description: 'Are you sure you want to proceed with this action?'
	},
	render: (args) => {
		let open = args.open;

		return {
			Component: (() => {
				return {
					render: () => `
						<div>
							<Button onclick={() => open = true}>Open Modal with Title</Button>
							<Modal 
								{open} 
								onClose={() => open = false}
								title="${args.title}"
								description="${args.description}"
							>
								<div class="p-6">
									<p class="mb-6 text-gray-600">This action cannot be undone. Please confirm that you want to continue.</p>
									<div class="flex gap-2 justify-end">
										<Button variant="outline" onclick={() => open = false}>Cancel</Button>
										<Button variant="destructive" onclick={() => open = false}>Confirm</Button>
									</div>
								</div>
							</Modal>
						</div>
					`
				};
			})()
		};
	}
};

export const LargeContent: Story = {
	args: {
		open: false,
		title: 'Large Content Modal',
		description: 'This modal contains a lot of content to demonstrate scrolling.'
	},
	render: (args) => {
		let open = args.open;

		return {
			Component: (() => {
				return {
					render: () => `
						<div>
							<Button onclick={() => open = true}>Open Large Modal</Button>
							<Modal 
								{open} 
								onClose={() => open = false}
								title="${args.title}"
								description="${args.description}"
							>
								<div class="p-6 space-y-4">
									<p>This is a modal with a lot of content to demonstrate scrolling behavior.</p>
									${Array.from(
										{ length: 20 },
										(_, i) => `
										<div class="p-4 bg-gray-50 rounded">
											<h3 class="font-semibold">Section ${i + 1}</h3>
											<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
										</div>
									`
									).join('')}
									<div class="flex gap-2 justify-end pt-4">
										<Button variant="outline" onclick={() => open = false}>Cancel</Button>
										<Button onclick={() => open = false}>Save</Button>
									</div>
								</div>
							</Modal>
						</div>
					`
				};
			})()
		};
	}
};

export const FormModal: Story = {
	args: {
		open: false,
		title: 'Contact Form',
		description: 'Please fill out the form below.'
	},
	render: (args) => {
		let open = args.open;

		return {
			Component: (() => {
				return {
					render: () => `
						<div>
							<Button onclick={() => open = true}>Open Form Modal</Button>
							<Modal 
								{open} 
								onClose={() => open = false}
								title="${args.title}"
								description="${args.description}"
							>
								<form class="p-6 space-y-4">
									<div>
										<label for="name" class="block text-sm font-medium mb-1">Name</label>
										<input 
											id="name" 
											type="text" 
											class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
											placeholder="Enter your name"
										/>
									</div>
									<div>
										<label for="email" class="block text-sm font-medium mb-1">Email</label>
										<input 
											id="email" 
											type="email" 
											class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
											placeholder="Enter your email"
										/>
									</div>
									<div>
										<label for="message" class="block text-sm font-medium mb-1">Message</label>
										<textarea 
											id="message" 
											rows="4"
											class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
											placeholder="Enter your message"
										></textarea>
									</div>
									<div class="flex gap-2 justify-end pt-4">
										<Button type="button" variant="outline" onclick={() => open = false}>Cancel</Button>
										<Button type="submit" onclick={() => { alert('Form submitted!'); open = false; }}>Send Message</Button>
									</div>
								</form>
							</Modal>
						</div>
					`
				};
			})()
		};
	}
};

export const WithoutHeader: Story = {
	args: {
		open: false
	},
	render: (args) => {
		let open = args.open;

		return {
			Component: (() => {
				return {
					render: () => `
						<div>
							<Button onclick={() => open = true}>Open Modal without Header</Button>
							<Modal 
								{open} 
								onClose={() => open = false}
							>
								<div class="p-6 text-center">
									<div class="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
										<svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
										</svg>
									</div>
									<h2 class="text-xl font-semibold mb-2">Success!</h2>
									<p class="text-gray-600 mb-6">Your action has been completed successfully.</p>
									<Button onclick={() => open = false}>Continue</Button>
								</div>
							</Modal>
						</div>
					`
				};
			})()
		};
	}
};

export const Accessibility: Story = {
	parameters: {
		docs: {
			description: {
				story: `
**Accessibility Features Demonstrated:**

1. **Focus Management:** When opened, focus is automatically moved to the modal and trapped within it
2. **Keyboard Navigation:** 
   - Tab cycles through focusable elements
   - Shift+Tab cycles backwards
   - ESC key closes the modal
3. **ARIA Labels:** Proper aria-labelledby and aria-describedby attributes
4. **Focus Restoration:** Focus returns to the trigger button when closed
5. **Screen Reader Support:** Modal role and proper semantic structure

Try opening this modal and navigating with the keyboard.
				`
			}
		}
	},
	render: () => {
		let open = false;

		return {
			Component: (() => {
				return {
					render: () => `
						<div class="space-y-4">
							<p class="text-sm text-gray-600">
								This modal demonstrates accessibility features. 
								Try opening it and using Tab, Shift+Tab, and ESC keys.
							</p>
							<Button onclick={() => open = true}>Open Accessible Modal</Button>
							<Modal 
								{open} 
								onClose={() => open = false}
								title="Accessibility Demo"
								description="Navigate through the form fields using Tab and Shift+Tab"
							>
								<div class="p-6 space-y-4">
									<div>
										<label for="field1" class="block text-sm font-medium mb-1">First Field</label>
										<input 
											id="field1" 
											type="text" 
											class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
											placeholder="Tab to this field"
										/>
									</div>
									<div>
										<label for="field2" class="block text-sm font-medium mb-1">Second Field</label>
										<input 
											id="field2" 
											type="text" 
											class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
											placeholder="Then to this field"
										/>
									</div>
									<div>
										<label for="field3" class="block text-sm font-medium mb-1">Third Field</label>
										<select 
											id="field3"
											class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										>
											<option>Select an option</option>
											<option>Option 1</option>
											<option>Option 2</option>
										</select>
									</div>
									<p class="text-sm text-gray-600">
										Press ESC to close, or use the buttons below.
									</p>
									<div class="flex gap-2 justify-end">
										<Button variant="outline" onclick={() => open = false}>Cancel</Button>
										<Button onclick={() => open = false}>Save</Button>
									</div>
								</div>
							</Modal>
						</div>
					`
				};
			})()
		};
	}
};
