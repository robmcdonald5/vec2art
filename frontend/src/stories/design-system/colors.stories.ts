import type { Meta, StoryObj } from '@storybook/sveltekit';

const meta: Meta = {
	title: 'Design System/Colors',
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component: `
# Color System

The vec2art design system uses a comprehensive color palette built on CSS custom properties and HSL color space for consistent theming across light and dark modes.

## Design Tokens

All colors are defined as CSS custom properties (CSS variables) using HSL values for better color manipulation and theming support.

## Usage

Colors can be accessed through Tailwind CSS utility classes or directly via CSS custom properties:

\`\`\`css
/* Tailwind utilities */
.bg-primary
.text-primary-foreground
.border-border

/* CSS custom properties */
background-color: hsl(var(--primary));
color: hsl(var(--primary-foreground));
\`\`\`

## Accessibility

All color combinations meet WCAG 2.1 AA contrast requirements (4.5:1 for normal text, 3:1 for large text).
				`
			}
		}
	},
	tags: ['autodocs']
};

export default meta;
type Story = StoryObj<meta>;

export const SemanticColors: Story = {
	parameters: {
		docs: {
			description: {
				story: 'Semantic color tokens used throughout the application for consistent theming.'
			}
		}
	},
	render: () => ({
		Component: (() => {
			return {
				render: () => `
					<div class="p-6 space-y-8">
						<div>
							<h2 class="text-2xl font-bold mb-4">Semantic Colors</h2>
							<p class="text-gray-600 mb-6">These colors adapt automatically to light and dark themes.</p>
							
							<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								<!-- Primary Colors -->
								<div class="space-y-2">
									<h3 class="font-semibold text-sm">Primary</h3>
									<div class="bg-primary text-primary-foreground p-4 rounded flex justify-between items-center">
										<span class="font-medium">Primary</span>
										<code class="text-xs opacity-80">--primary</code>
									</div>
									<div class="bg-primary-foreground text-primary p-2 rounded text-sm">
										Primary Foreground
									</div>
								</div>
								
								<!-- Secondary Colors -->
								<div class="space-y-2">
									<h3 class="font-semibold text-sm">Secondary</h3>
									<div class="bg-secondary text-secondary-foreground p-4 rounded flex justify-between items-center">
										<span class="font-medium">Secondary</span>
										<code class="text-xs opacity-80">--secondary</code>
									</div>
									<div class="bg-secondary-foreground text-secondary p-2 rounded text-sm">
										Secondary Foreground
									</div>
								</div>
								
								<!-- Muted Colors -->
								<div class="space-y-2">
									<h3 class="font-semibold text-sm">Muted</h3>
									<div class="bg-muted text-muted-foreground p-4 rounded flex justify-between items-center">
										<span class="font-medium">Muted</span>
										<code class="text-xs opacity-80">--muted</code>
									</div>
									<div class="bg-muted-foreground text-muted p-2 rounded text-sm">
										Muted Foreground
									</div>
								</div>
								
								<!-- Accent Colors -->
								<div class="space-y-2">
									<h3 class="font-semibold text-sm">Accent</h3>
									<div class="bg-accent text-accent-foreground p-4 rounded flex justify-between items-center">
										<span class="font-medium">Accent</span>
										<code class="text-xs opacity-80">--accent</code>
									</div>
									<div class="bg-accent-foreground text-accent p-2 rounded text-sm">
										Accent Foreground
									</div>
								</div>
								
								<!-- Card Colors -->
								<div class="space-y-2">
									<h3 class="font-semibold text-sm">Card</h3>
									<div class="bg-card text-card-foreground p-4 rounded border flex justify-between items-center">
										<span class="font-medium">Card</span>
										<code class="text-xs opacity-80">--card</code>
									</div>
									<div class="bg-card-foreground text-card p-2 rounded text-sm">
										Card Foreground
									</div>
								</div>
								
								<!-- Popover Colors -->
								<div class="space-y-2">
									<h3 class="font-semibold text-sm">Popover</h3>
									<div class="bg-popover text-popover-foreground p-4 rounded border flex justify-between items-center">
										<span class="font-medium">Popover</span>
										<code class="text-xs opacity-80">--popover</code>
									</div>
									<div class="bg-popover-foreground text-popover p-2 rounded text-sm">
										Popover Foreground
									</div>
								</div>
							</div>
						</div>
						
						<div>
							<h3 class="text-lg font-semibold mb-4">Utility Colors</h3>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div class="space-y-2">
									<h4 class="font-medium text-sm">Background & Foreground</h4>
									<div class="bg-background text-foreground p-4 rounded border flex justify-between items-center">
										<span>Background</span>
										<code class="text-xs opacity-60">--background</code>
									</div>
									<div class="bg-foreground text-background p-2 rounded text-sm">
										Foreground
									</div>
								</div>
								
								<div class="space-y-2">
									<h4 class="font-medium text-sm">Borders & Inputs</h4>
									<div class="bg-white border-2 border-border p-4 rounded flex justify-between items-center">
										<span>Border</span>
										<code class="text-xs opacity-60">--border</code>
									</div>
									<div class="bg-input border border-border p-2 rounded text-sm">
										Input Background
									</div>
								</div>
							</div>
						</div>
						
						<div>
							<h3 class="text-lg font-semibold mb-4">State Colors</h3>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div class="space-y-2">
									<h4 class="font-medium text-sm">Destructive</h4>
									<div class="bg-destructive text-destructive-foreground p-4 rounded flex justify-between items-center">
										<span class="font-medium">Destructive</span>
										<code class="text-xs opacity-80">--destructive</code>
									</div>
									<div class="bg-destructive-foreground text-destructive p-2 rounded text-sm">
										Destructive Foreground
									</div>
								</div>
								
								<div class="space-y-2">
									<h4 class="font-medium text-sm">Focus Ring</h4>
									<div class="bg-white border-2 border-ring p-4 rounded flex justify-between items-center">
										<span>Ring/Focus</span>
										<code class="text-xs opacity-60">--ring</code>
									</div>
								</div>
							</div>
						</div>
					</div>
				`
			};
		})()
	})
};

export const GradientColors: Story = {
	parameters: {
		docs: {
			description: {
				story: 'Gradient colors and background images used for hero sections and visual elements.'
			}
		}
	},
	render: () => ({
		Component: (() => {
			return {
				render: () => `
					<div class="p-6 space-y-8">
						<div>
							<h2 class="text-2xl font-bold mb-4">Gradient System</h2>
							<p class="text-gray-600 mb-6">Carefully crafted gradients for different sections and moods.</p>
							
							<div class="space-y-6">
								<!-- Hero Gradients -->
								<div>
									<h3 class="text-lg font-semibold mb-3">Hero Gradients</h3>
									<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div class="bg-tech-primary text-white p-6 rounded-lg">
											<h4 class="font-semibold mb-2">Tech Primary</h4>
											<code class="text-xs opacity-80">bg-tech-primary</code>
											<p class="text-sm mt-2 opacity-90">135° gradient from #667eea to #764ba2</p>
										</div>
										
										<div class="bg-tech-secondary text-white p-6 rounded-lg">
											<h4 class="font-semibold mb-2">Tech Secondary</h4>
											<code class="text-xs opacity-80">bg-tech-secondary</code>
											<p class="text-sm mt-2 opacity-90">45° gradient from #844fc1 to #3b86d1</p>
										</div>
										
										<div class="bg-hero-gradient text-white p-6 rounded-lg">
											<h4 class="font-semibold mb-2">Hero Gradient</h4>
											<code class="text-xs opacity-80">bg-hero-gradient</code>
											<p class="text-sm mt-2 opacity-90">Multi-stop dark cool diagonal</p>
										</div>
										
										<div class="bg-processing-gradient text-white p-6 rounded-lg">
											<h4 class="font-semibold mb-2">Processing</h4>
											<code class="text-xs opacity-80">bg-processing-gradient</code>
											<p class="text-sm mt-2 opacity-90">90° gradient from #6366f1 to #8b5cf6</p>
										</div>
									</div>
								</div>
								
								<!-- Section Gradients -->
								<div>
									<h3 class="text-lg font-semibold mb-3">Section Gradients</h3>
									<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div class="bg-features-gradient text-gray-800 p-6 rounded-lg border">
											<h4 class="font-semibold mb-2">Features (Light)</h4>
											<code class="text-xs opacity-60">bg-features-gradient</code>
											<p class="text-sm mt-2 opacity-80">Light neutral vertical gradient</p>
										</div>
										
										<div class="bg-features-gradient-dark text-white p-6 rounded-lg">
											<h4 class="font-semibold mb-2">Features (Dark)</h4>
											<code class="text-xs opacity-80">bg-features-gradient-dark</code>
											<p class="text-sm mt-2 opacity-90">Dark neutral vertical gradient</p>
										</div>
										
										<div class="bg-algorithm-gradient text-gray-800 p-6 rounded-lg">
											<h4 class="font-semibold mb-2">Algorithm (Light)</h4>
											<code class="text-xs opacity-60">bg-algorithm-gradient</code>
											<p class="text-sm mt-2 opacity-80">Medium warm diagonal gradient</p>
										</div>
										
										<div class="bg-algorithm-gradient-dark text-white p-6 rounded-lg">
											<h4 class="font-semibold mb-2">Algorithm (Dark)</h4>
											<code class="text-xs opacity-80">bg-algorithm-gradient-dark</code>
											<p class="text-sm mt-2 opacity-90">Dark warm diagonal gradient</p>
										</div>
									</div>
								</div>
								
								<!-- Special Gradients -->
								<div>
									<h3 class="text-lg font-semibold mb-3">Special Effects</h3>
									<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div class="bg-footer-gradient text-white p-6 rounded-lg">
											<h4 class="font-semibold mb-2">Footer Gradient</h4>
											<code class="text-xs opacity-80">bg-footer-gradient</code>
											<p class="text-sm mt-2 opacity-90">OKLCH perceptual gradient</p>
										</div>
										
										<div class="bg-card-gradient text-white p-6 rounded-lg">
											<h4 class="font-semibold mb-2">Card Gradient</h4>
											<code class="text-xs opacity-80">bg-card-gradient</code>
											<p class="text-sm mt-2 opacity-90">Subtle card background</p>
										</div>
										
										<div class="bg-aurora-tech text-white p-6 rounded-lg">
											<h4 class="font-semibold mb-2">Aurora Tech</h4>
											<code class="text-xs opacity-80">bg-aurora-tech</code>
											<p class="text-sm mt-2 opacity-90">Animated aurora effect</p>
										</div>
										
										<div class="bg-noise-overlay bg-gray-100 text-gray-800 p-6 rounded-lg border">
											<h4 class="font-semibold mb-2">Noise Overlay</h4>
											<code class="text-xs opacity-60">bg-noise-overlay</code>
											<p class="text-sm mt-2 opacity-80">Subtle dithering effect</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				`
			};
		})()
	})
};

export const DarkModeComparison: Story = {
	parameters: {
		docs: {
			description: {
				story: 'Side-by-side comparison of light and dark theme color applications.'
			}
		}
	},
	render: () => ({
		Component: (() => {
			return {
				render: () => `
					<div class="p-6">
						<h2 class="text-2xl font-bold mb-6">Light vs Dark Mode</h2>
						
						<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
							<!-- Light Mode -->
							<div class="space-y-4">
								<h3 class="text-lg font-semibold">Light Mode</h3>
								<div class="bg-white p-6 rounded-lg border space-y-4">
									<div class="bg-primary text-primary-foreground px-4 py-2 rounded">
										Primary Button
									</div>
									<div class="bg-secondary text-secondary-foreground px-4 py-2 rounded">
										Secondary Button
									</div>
									<div class="bg-muted text-muted-foreground p-4 rounded">
										Muted content area with text
									</div>
									<div class="bg-card text-card-foreground p-4 rounded border">
										Card component
									</div>
									<div class="bg-destructive text-destructive-foreground px-4 py-2 rounded">
										Destructive Action
									</div>
								</div>
							</div>
							
							<!-- Dark Mode -->
							<div class="space-y-4">
								<h3 class="text-lg font-semibold">Dark Mode</h3>
								<div class="dark bg-background p-6 rounded-lg border space-y-4">
									<div class="bg-primary text-primary-foreground px-4 py-2 rounded">
										Primary Button
									</div>
									<div class="bg-secondary text-secondary-foreground px-4 py-2 rounded">
										Secondary Button
									</div>
									<div class="bg-muted text-muted-foreground p-4 rounded">
										Muted content area with text
									</div>
									<div class="bg-card text-card-foreground p-4 rounded border border-border">
										Card component
									</div>
									<div class="bg-destructive text-destructive-foreground px-4 py-2 rounded">
										Destructive Action
									</div>
								</div>
							</div>
						</div>
						
						<div class="mt-8">
							<h3 class="text-lg font-semibold mb-4">Color Values Comparison</h3>
							<div class="overflow-x-auto">
								<table class="w-full text-sm border-collapse border border-gray-300">
									<thead>
										<tr class="bg-gray-50">
											<th class="border border-gray-300 p-2 text-left">Token</th>
											<th class="border border-gray-300 p-2 text-left">Light Mode (HSL)</th>
											<th class="border border-gray-300 p-2 text-left">Dark Mode (HSL)</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td class="border border-gray-300 p-2 font-medium">--background</td>
											<td class="border border-gray-300 p-2">0 0% 100%</td>
											<td class="border border-gray-300 p-2">222.2 84% 4.9%</td>
										</tr>
										<tr>
											<td class="border border-gray-300 p-2 font-medium">--foreground</td>
											<td class="border border-gray-300 p-2">222.2 84% 4.9%</td>
											<td class="border border-gray-300 p-2">210 40% 98%</td>
										</tr>
										<tr>
											<td class="border border-gray-300 p-2 font-medium">--primary</td>
											<td class="border border-gray-300 p-2">222.2 47.4% 11.2%</td>
											<td class="border border-gray-300 p-2">210 40% 98%</td>
										</tr>
										<tr>
											<td class="border border-gray-300 p-2 font-medium">--primary-foreground</td>
											<td class="border border-gray-300 p-2">210 40% 98%</td>
											<td class="border border-gray-300 p-2">222.2 47.4% 11.2%</td>
										</tr>
										<tr>
											<td class="border border-gray-300 p-2 font-medium">--border</td>
											<td class="border border-gray-300 p-2">214.3 31.8% 91.4%</td>
											<td class="border border-gray-300 p-2">217.2 32.6% 17.5%</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
					</div>
				`
			};
		})()
	})
};

export const UsageExamples: Story = {
	parameters: {
		docs: {
			description: {
				story: 'Practical examples of how to use colors in components and layouts.'
			}
		}
	},
	render: () => ({
		Component: (() => {
			return {
				render: () => `
					<div class="p-6 space-y-8">
						<div>
							<h2 class="text-2xl font-bold mb-4">Usage Examples</h2>
							<p class="text-gray-600 mb-6">Real-world examples of color usage in UI components.</p>
						</div>
						
						<!-- Buttons -->
						<div class="space-y-3">
							<h3 class="text-lg font-semibold">Button Variants</h3>
							<div class="flex flex-wrap gap-3">
								<button class="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90">
									Primary
								</button>
								<button class="bg-secondary text-secondary-foreground px-4 py-2 rounded hover:bg-secondary/80">
									Secondary
								</button>
								<button class="border border-input bg-background px-4 py-2 rounded hover:bg-accent hover:text-accent-foreground">
									Outline
								</button>
								<button class="hover:bg-accent hover:text-accent-foreground px-4 py-2 rounded">
									Ghost
								</button>
								<button class="bg-destructive text-destructive-foreground px-4 py-2 rounded hover:bg-destructive/90">
									Destructive
								</button>
							</div>
						</div>
						
						<!-- Cards -->
						<div class="space-y-3">
							<h3 class="text-lg font-semibold">Card Components</h3>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div class="bg-card text-card-foreground p-4 rounded-lg border border-border">
									<h4 class="font-semibold mb-2">Default Card</h4>
									<p class="text-muted-foreground text-sm">
										This card uses semantic color tokens for consistent theming.
									</p>
								</div>
								
								<div class="bg-muted p-4 rounded-lg">
									<h4 class="font-semibold mb-2 text-foreground">Muted Card</h4>
									<p class="text-muted-foreground text-sm">
										Subtle background for secondary content.
									</p>
								</div>
							</div>
						</div>
						
						<!-- Forms -->
						<div class="space-y-3">
							<h3 class="text-lg font-semibold">Form Elements</h3>
							<div class="space-y-4 max-w-md">
								<div>
									<label class="block text-sm font-medium mb-1">Input Field</label>
									<input 
										class="w-full px-3 py-2 bg-background border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
										placeholder="Enter text..."
									/>
								</div>
								
								<div>
									<label class="block text-sm font-medium mb-1">Select</label>
									<select class="w-full px-3 py-2 bg-background border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
										<option>Choose option</option>
										<option>Option 1</option>
										<option>Option 2</option>
									</select>
								</div>
								
								<div>
									<label class="block text-sm font-medium mb-1">Textarea</label>
									<textarea 
										class="w-full px-3 py-2 bg-background border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
										rows="3"
										placeholder="Enter message..."
									></textarea>
								</div>
							</div>
						</div>
						
						<!-- Alerts -->
						<div class="space-y-3">
							<h3 class="text-lg font-semibold">Alert States</h3>
							<div class="space-y-3">
								<div class="bg-green-50 border border-green-200 text-green-800 p-3 rounded">
									<strong>Success:</strong> Action completed successfully.
								</div>
								<div class="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded">
									<strong>Warning:</strong> Please review before proceeding.
								</div>
								<div class="bg-red-50 border border-red-200 text-red-800 p-3 rounded">
									<strong>Error:</strong> Something went wrong.
								</div>
								<div class="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded">
									<strong>Info:</strong> Here's some helpful information.
								</div>
							</div>
						</div>
					</div>
				`
			};
		})()
	})
};
