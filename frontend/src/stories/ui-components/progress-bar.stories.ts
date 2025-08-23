import type { Meta, StoryObj } from '@storybook/sveltekit';
import ProgressBar from '$lib/components/ui/progress-bar.svelte';

const meta: Meta<ProgressBar> = {
	title: 'UI Components/Progress Bar',
	component: ProgressBar,
	parameters: {
		layout: 'centered',
		docs: {
			description: {
				component: `
A fully accessible progress bar component for indicating task completion status.

**Features:**
- Multiple sizes (sm, md, lg) for different use cases
- Color variants (default, success, warning, error) for different states
- Optional value display with percentage
- Screen reader support with live announcements
- Smooth animations for progress updates
- SvelteKit 5 runes syntax with reactive derived values

**Accessibility:**
- Proper ARIA progressbar role and attributes
- Screen reader announcements of progress changes
- Semantic labeling for assistive technologies
- High contrast support
				`
			}
		}
	},
	argTypes: {
		value: {
			control: { type: 'range', min: 0, max: 100, step: 1 },
			description: 'Progress value (0-100)'
		},
		label: {
			control: { type: 'text' },
			description: 'Optional label for the progress bar'
		},
		size: {
			control: { type: 'select' },
			options: ['sm', 'md', 'lg'],
			description: 'Size of the progress bar'
		},
		variant: {
			control: { type: 'select' },
			options: ['default', 'success', 'warning', 'error'],
			description: 'Color variant of the progress bar'
		},
		showValue: {
			control: { type: 'boolean' },
			description: 'Whether to show the percentage value'
		},
		id: {
			control: { type: 'text' },
			description: 'Custom ID for the progress bar'
		}
	},
	tags: ['autodocs']
};

export default meta;
type Story = StoryObj<meta>;

export const Default: Story = {
	args: {
		value: 50,
		label: 'Progress',
		size: 'md',
		variant: 'default',
		showValue: true
	}
};

export const AllSizes: Story = {
	parameters: {
		docs: {
			description: {
				story: 'Different progress bar sizes for various use cases.'
			}
		}
	},
	render: () => ({
		Component: (() => {
			return {
				render: () => `
					<div class="space-y-6 w-80">
						<ProgressBar value={30} label="Small Progress" size="sm" />
						<ProgressBar value={60} label="Medium Progress" size="md" />
						<ProgressBar value={80} label="Large Progress" size="lg" />
					</div>
				`
			};
		})()
	})
};

export const AllVariants: Story = {
	parameters: {
		docs: {
			description: {
				story: 'Different color variants for various states and contexts.'
			}
		}
	},
	render: () => ({
		Component: (() => {
			return {
				render: () => `
					<div class="space-y-6 w-80">
						<ProgressBar value={70} label="Default Progress" variant="default" />
						<ProgressBar value={85} label="Success Progress" variant="success" />
						<ProgressBar value={40} label="Warning Progress" variant="warning" />
						<ProgressBar value={20} label="Error Progress" variant="error" />
					</div>
				`
			};
		})()
	})
};

export const WithoutLabel: Story = {
	args: {
		value: 65,
		size: 'md',
		variant: 'default',
		showValue: true
	},
	parameters: {
		docs: {
			description: {
				story: 'Progress bar without a label, using just the value display.'
			}
		}
	}
};

export const WithoutValue: Story = {
	args: {
		value: 75,
		label: 'Loading data...',
		size: 'md',
		variant: 'default',
		showValue: false
	},
	parameters: {
		docs: {
			description: {
				story: 'Progress bar without percentage display, showing only the visual progress.'
			}
		}
	}
};

export const AnimatedProgress: Story = {
	parameters: {
		docs: {
			description: {
				story: 'Simulated animated progress to demonstrate smooth transitions.'
			}
		}
	},
	render: () => {
		let progress = 0;
		let isRunning = false;

		const startAnimation = () => {
			if (isRunning) return;
			isRunning = true;
			progress = 0;

			const interval = setInterval(() => {
				progress += 2;
				if (progress >= 100) {
					progress = 100;
					clearInterval(interval);
					isRunning = false;
				}
			}, 100);
		};

		const resetProgress = () => {
			progress = 0;
			isRunning = false;
		};

		return {
			Component: (() => {
				return {
					render: () => `
						<div class="space-y-4 w-80">
							<div class="flex gap-2">
								<button 
									onclick="startAnimation()"
									class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
									disabled={isRunning}
								>
									${isRunning ? 'Running...' : 'Start'}
								</button>
								<button 
									onclick="resetProgress()"
									class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
								>
									Reset
								</button>
							</div>
							<ProgressBar value={progress} label="Animated Progress" variant="default" />
						</div>
					`
				};
			})()
		};
	}
};

export const FileUploadExample: Story = {
	parameters: {
		docs: {
			description: {
				story: 'Example usage in a file upload context with realistic progress states.'
			}
		}
	},
	render: () => ({
		Component: (() => {
			return {
				render: () => `
					<div class="space-y-6 w-80">
						<div class="space-y-2">
							<h3 class="font-semibold">File Upload Progress</h3>
							<ProgressBar value={15} label="document.pdf" variant="default" size="sm" />
							<ProgressBar value={67} label="image.jpg" variant="default" size="sm" />
							<ProgressBar value={100} label="video.mp4" variant="success" size="sm" />
							<ProgressBar value={45} label="large-file.zip" variant="warning" size="sm" />
						</div>
					</div>
				`
			};
		})()
	})
};

export const ProcessingStates: Story = {
	parameters: {
		docs: {
			description: {
				story: 'Different processing states showing various completion levels and variants.'
			}
		}
	},
	render: () => ({
		Component: (() => {
			return {
				render: () => `
					<div class="space-y-6 w-80">
						<ProgressBar value={0} label="Queued" variant="default" />
						<ProgressBar value={25} label="Processing" variant="default" />
						<ProgressBar value={75} label="Nearly Complete" variant="default" />
						<ProgressBar value={100} label="Completed" variant="success" />
						<ProgressBar value={30} label="Failed" variant="error" />
						<ProgressBar value={50} label="Needs Attention" variant="warning" />
					</div>
				`
			};
		})()
	})
};

export const CustomStyling: Story = {
	args: {
		value: 60,
		label: 'Custom Styled Progress',
		size: 'lg',
		variant: 'default',
		class: 'custom-progress-bar'
	},
	parameters: {
		docs: {
			description: {
				story: 'Progress bar with custom CSS classes applied for additional styling.'
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

1. **ARIA Progressbar Role:** Proper semantic structure for screen readers
2. **Value Attributes:** aria-valuenow, aria-valuemin, aria-valuemax for current state
3. **Live Announcements:** Screen reader announcements when progress changes
4. **Labeling:** Proper labeling with aria-label and id associations
5. **Screen Reader Only Content:** Hidden content specifically for screen readers
6. **High Contrast:** Works well with high contrast mode

The progress bar includes a hidden live region that announces changes to screen readers.
				`
			}
		}
	},
	render: () => {
		let progress = 0;

		const incrementProgress = () => {
			progress = Math.min(100, progress + 10);
		};

		const decrementProgress = () => {
			progress = Math.max(0, progress - 10);
		};

		return {
			Component: (() => {
				return {
					render: () => `
						<div class="space-y-4 w-80">
							<p class="text-sm text-gray-600">
								Use the buttons to change progress and observe screen reader announcements.
							</p>
							<div class="flex gap-2">
								<button 
									onclick="decrementProgress()"
									class="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
									aria-label="Decrease progress by 10%"
								>
									-10%
								</button>
								<button 
									onclick="incrementProgress()"
									class="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
									aria-label="Increase progress by 10%"
								>
									+10%
								</button>
							</div>
							<ProgressBar 
								value={progress} 
								label="Accessibility Demo Progress" 
								variant="default"
								id="accessibility-progress"
							/>
							<p class="text-xs text-gray-500">
								Screen readers will announce: "${progress}% Accessibility Demo Progress"
							</p>
						</div>
					`
				};
			})()
		};
	}
};
