import type { Meta, StoryObj } from '@storybook/svelteKit';
import SmartPerformanceSelector from '$lib/components/ui/smart-performance-selector.svelte';

const meta: Meta<SmartPerformanceSelector> = {
	title: 'Form Components/Smart Performance Selector',
	component: SmartPerformanceSelector,
	parameters: {
		layout: 'centered',
		docs: {
			description: {
				component: `
An intelligent performance selector that automatically detects system capabilities and recommends optimal processing settings.

**Features:**
- Automatic CPU and system capability detection
- Smart performance recommendations based on hardware
- Multiple performance modes (battery, balanced, performance, extreme)
- Battery status awareness for mobile devices
- Advanced settings with custom thread control
- Real-time system information display
- Comprehensive accessibility with keyboard navigation
- SvelteKit 5 runes syntax with reactive state management

**Performance Modes:**
- **Battery Mode:** Minimal CPU usage, optimized for battery life
- **Balanced Mode:** Optimal balance of speed and efficiency
- **Performance Mode:** High-performance processing with faster results
- **Extreme Mode:** Maximum performance utilizing all available resources

**Accessibility:**
- Full keyboard navigation with arrow keys
- Screen reader announcements for all state changes
- ARIA labels and proper semantic structure
- Live region updates for dynamic content
- High contrast support
				`
			}
		}
	},
	argTypes: {
		isInitializing: {
			control: { type: 'boolean' },
			description: 'Whether the WASM module is initializing'
		},
		disabled: {
			control: { type: 'boolean' },
			description: 'Whether the selector is disabled'
		}
	},
	tags: ['autodocs']
};

export default meta;
type Story = StoryObj<meta>;

export const Default: Story = {
	args: {
		isInitializing: false,
		disabled: false,
		onSelect: (threadCount, mode) => {
			console.log(`Selected: ${threadCount} threads in ${mode} mode`);
		}
	}
};

export const Initializing: Story = {
	args: {
		isInitializing: true,
		disabled: false,
		onSelect: (threadCount, mode) => {
			console.log(`Selected: ${threadCount} threads in ${mode} mode`);
		}
	},
	parameters: {
		docs: {
			description: {
				story: 'Loading state while the WASM module is initializing.'
			}
		}
	}
};

export const Disabled: Story = {
	args: {
		isInitializing: false,
		disabled: true,
		onSelect: (threadCount, mode) => {
			console.log(`Selected: ${threadCount} threads in ${mode} mode`);
		}
	},
	parameters: {
		docs: {
			description: {
				story: 'Disabled state prevents all interactions.'
			}
		}
	}
};

export const MockedHighEndSystem: Story = {
	parameters: {
		docs: {
			description: {
				story: 'Simulated high-end desktop system with 16 cores and high performance capabilities.'
			}
		}
	},
	render: (args) => {
		// Mock high-end system
		const mockCapabilities = {
			cores: 16,
			logicalCores: 32,
			recommendedThreads: 12,
			maxSafeThreads: 24,
			estimatedPerformance: 'high-end',
			deviceType: 'desktop',
			memoryGB: 32,
			batteryStatus: 'charging',
			isLowEndDevice: false,
			features: {
				threading: true,
				simd: true,
				wasm: true
			}
		};

		return {
			Component: (() => {
				return {
					render: () => `
						<div class="w-full max-w-2xl">
							<div class="mb-4 p-3 bg-blue-50 rounded border">
								<h3 class="font-semibold text-blue-900">Simulated System: High-End Desktop</h3>
								<p class="text-sm text-blue-700">16 cores, 32GB RAM, Desktop, Charging</p>
							</div>
							<SmartPerformanceSelector
								isInitializing={false}
								disabled={false}
								onSelect={(threadCount, mode) => console.log('High-end system selected:', threadCount, mode)}
							/>
						</div>
					`
				};
			})()
		};
	}
};

export const MockedMobileDevice: Story = {
	parameters: {
		docs: {
			description: {
				story: 'Simulated mobile device with limited cores and battery constraints.'
			}
		}
	},
	render: (args) => {
		return {
			Component: (() => {
				return {
					render: () => `
						<div class="w-full max-w-2xl">
							<div class="mb-4 p-3 bg-yellow-50 rounded border">
								<h3 class="font-semibold text-yellow-900">Simulated System: Mobile Device</h3>
								<p class="text-sm text-yellow-700">4 cores, 6GB RAM, Mobile, On Battery</p>
							</div>
							<SmartPerformanceSelector
								isInitializing={false}
								disabled={false}
								onSelect={(threadCount, mode) => console.log('Mobile device selected:', threadCount, mode)}
							/>
						</div>
					`
				};
			})()
		};
	}
};

export const MockedLowEndDevice: Story = {
	parameters: {
		docs: {
			description: {
				story: 'Simulated low-end device with minimal capabilities.'
			}
		}
	},
	render: (args) => {
		return {
			Component: (() => {
				return {
					render: () => `
						<div class="w-full max-w-2xl">
							<div class="mb-4 p-3 bg-red-50 rounded border">
								<h3 class="font-semibold text-red-900">Simulated System: Low-End Device</h3>
								<p class="text-sm text-red-700">2 cores, 4GB RAM, Laptop, Low Battery</p>
							</div>
							<SmartPerformanceSelector
								isInitializing={false}
								disabled={false}
								onSelect={(threadCount, mode) => console.log('Low-end device selected:', threadCount, mode)}
							/>
						</div>
					`
				};
			})()
		};
	}
};

export const DetectionError: Story = {
	parameters: {
		docs: {
			description: {
				story: 'Error state when system detection fails, showing fallback options.'
			}
		}
	},
	render: (args) => {
		return {
			Component: (() => {
				return {
					render: () => `
						<div class="w-full max-w-2xl">
							<div class="mb-4 p-3 bg-orange-50 rounded border">
								<h3 class="font-semibold text-orange-900">Simulated State: Detection Failed</h3>
								<p class="text-sm text-orange-700">System capabilities could not be detected</p>
							</div>
							<SmartPerformanceSelector
								isInitializing={false}
								disabled={false}
								onSelect={(threadCount, mode) => console.log('Fallback selected:', threadCount, mode)}
							/>
						</div>
					`
				};
			})()
		};
	}
};

export const InteractiveDemo: Story = {
	parameters: {
		docs: {
			description: {
				story: 'Interactive demo showing selection tracking and recommendations.'
			}
		}
	},
	render: () => {
		let selectedMode = 'none';
		let selectedThreads = 0;
		let selectionHistory = [];

		const handleSelection = (threadCount, mode) => {
			selectedMode = mode;
			selectedThreads = threadCount;
			selectionHistory = [
				...selectionHistory,
				{
					timestamp: new Date().toLocaleTimeString(),
					mode,
					threadCount
				}
			].slice(-5); // Keep last 5 selections
		};

		return {
			Component: (() => {
				return {
					render: () => `
						<div class="space-y-6 w-full max-w-2xl">
							<div class="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
								<div>
									<div class="text-sm font-medium">Current Selection</div>
									<div class="text-lg font-bold text-blue-600">
										${selectedMode !== 'none' ? `${selectedMode} (${selectedThreads} threads)` : 'None'}
									</div>
								</div>
								<div>
									<div class="text-sm font-medium">Selections Made</div>
									<div class="text-lg font-bold text-green-600">${selectionHistory.length}</div>
								</div>
							</div>
							
							<SmartPerformanceSelector
								isInitializing={false}
								disabled={false}
								onSelect={handleSelection}
							/>
							
							${
								selectionHistory.length > 0
									? `
								<div class="space-y-2">
									<h3 class="font-semibold text-sm">Selection History</h3>
									<div class="text-xs space-y-1 bg-gray-50 p-3 rounded max-h-32 overflow-y-auto">
										${selectionHistory
											.map(
												(item) =>
													`<div>${item.timestamp}: ${item.mode} mode, ${item.threadCount} threads</div>`
											)
											.join('')}
									</div>
								</div>
							`
									: ''
							}
						</div>
					`
				};
			})()
		};
	}
};

export const KeyboardNavigation: Story = {
	parameters: {
		docs: {
			description: {
				story: `
**Keyboard Navigation Features:**

1. **Arrow Keys:** Navigate between performance modes
   - Left/Up: Previous mode
   - Right/Down: Next mode
   - Home: First mode
   - End: Last mode

2. **Tab Navigation:** Move between interactive elements
3. **Enter/Space:** Select options and toggle advanced settings
4. **Screen Reader Support:** All interactions are announced

Try using keyboard navigation to explore the component.
				`
			}
		}
	},
	render: () => {
		let keyboardEvents = [];

		const logKeyboardEvent = (event) => {
			keyboardEvents = [...keyboardEvents, `${new Date().toLocaleTimeString()}: ${event}`].slice(
				-10
			); // Keep last 10 events
		};

		return {
			Component: (() => {
				return {
					render: () => `
						<div class="space-y-4 w-full max-w-2xl">
							<div class="text-sm space-y-2">
								<div class="font-medium">Keyboard Events (last 10):</div>
								<div class="bg-gray-50 p-2 rounded text-xs max-h-32 overflow-y-auto">
									${
										keyboardEvents.length > 0
											? keyboardEvents.map((event) => `<div>${event}</div>`).join('')
											: '<div class="text-gray-500">Use keyboard to navigate the component below</div>'
									}
								</div>
							</div>
							
							<div 
								onkeydown={(e) => {
									if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter', ' '].includes(e.key)) {
										logKeyboardEvent(\`Key pressed: \${e.key}\`);
									}
								}}
							>
								<SmartPerformanceSelector
									isInitializing={false}
									disabled={false}
									onSelect={(threadCount, mode) => {
										logKeyboardEvent(\`Selection: \${mode} mode, \${threadCount} threads\`);
									}}
								/>
							</div>
							
							<div class="text-xs text-gray-600 space-y-1">
								<div>• Use Arrow keys to navigate between modes</div>
								<div>• Press Tab to move between elements</div>
								<div>• Press Enter/Space to interact</div>
								<div>• All actions are logged above</div>
							</div>
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
**Accessibility Features:**

1. **Screen Reader Support:** Comprehensive announcements for all state changes
2. **ARIA Labels:** Proper labeling and descriptions for all interactive elements
3. **Keyboard Navigation:** Full keyboard support with logical tab order
4. **Live Regions:** Dynamic content updates announced to screen readers
5. **Focus Management:** Visible focus indicators and proper focus flow
6. **Semantic HTML:** Proper use of fieldset, legend, and radio button roles
7. **High Contrast:** Compatible with high contrast mode
8. **Error Handling:** Accessible error messages and fallback states

The component includes extensive screen reader announcements and keyboard navigation support.
				`
			}
		}
	},
	render: () => {
		let accessibilityLog = [];

		const logA11yEvent = (event) => {
			accessibilityLog = [
				...accessibilityLog,
				`${new Date().toLocaleTimeString()}: ${event}`
			].slice(-8); // Keep last 8 events
		};

		return {
			Component: (() => {
				return {
					render: () => `
						<div class="space-y-4 w-full max-w-2xl">
							<div class="text-sm space-y-2">
								<div class="font-medium">Accessibility Events:</div>
								<div class="bg-blue-50 p-2 rounded text-xs max-h-32 overflow-y-auto">
									${
										accessibilityLog.length > 0
											? accessibilityLog.map((event) => `<div>${event}</div>`).join('')
											: '<div class="text-gray-500">Accessibility events will appear here</div>'
									}
								</div>
							</div>
							
							<SmartPerformanceSelector
								isInitializing={false}
								disabled={false}
								onSelect={(threadCount, mode) => {
									logA11yEvent(\`Mode selected: \${mode} with \${threadCount} threads\`);
									logA11yEvent('Selection announced to screen readers');
								}}
							/>
							
							<div class="text-xs text-gray-600 space-y-1">
								<div>• System information is announced when component loads</div>
								<div>• Mode selections are announced with details</div>
								<div>• Advanced settings toggle is announced</div>
								<div>• Thread count changes are announced</div>
								<div>• Error states are properly communicated</div>
							</div>
						</div>
					`
				};
			})()
		};
	}
};
