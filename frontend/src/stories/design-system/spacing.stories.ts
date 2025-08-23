import type { Meta, StoryObj } from '@storybook/sveltekit';

const meta: Meta = {
	title: 'Design System/Spacing',
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component: `
# Spacing System

The vec2art design system uses a consistent spacing scale based on 4px increments for harmonious layouts and predictable spacing relationships.

## Spacing Scale

The spacing system follows a geometric progression that provides sufficient variety while maintaining visual consistency:

- **Base unit:** 4px (0.25rem)
- **Scale:** 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 64

## Usage

Spacing can be applied through Tailwind CSS utility classes:

\`\`\`html
<!-- Padding -->
<div class="p-4">Padding all sides</div>
<div class="px-6 py-4">Horizontal and vertical padding</div>

<!-- Margins -->
<div class="mb-8">Margin bottom</div>
<div class="mx-auto">Horizontal center margin</div>

<!-- Gaps in flexbox/grid -->
<div class="flex gap-4">Gap between flex items</div>
<div class="grid grid-cols-2 gap-6">Gap in grid</div>
\`\`\`

## Principles

1. **Consistency:** Use the same spacing values throughout the interface
2. **Hierarchy:** Larger spaces for major sections, smaller for related content
3. **Breathing Room:** Adequate spacing prevents cramped layouts
4. **Rhythm:** Consistent spacing creates visual rhythm and flow
				`
			}
		}
	},
	tags: ['autodocs']
};

export default meta;
type Story = StoryObj<meta>;

export const SpacingScale: Story = {
	parameters: {
		docs: {
			description: {
				story: 'Complete spacing scale with pixel values and common use cases.'
			}
		}
	},
	render: () => ({
		Component: (() => {
			return {
				render: () => `
					<div class="p-6 space-y-8">
						<div>
							<h2 class="text-2xl font-bold mb-4">Spacing Scale</h2>
							<p class="text-muted-foreground mb-6">
								Our spacing system based on 4px increments for consistent layouts.
							</p>
						</div>
						
						<div class="space-y-4">
							${[
								{ class: '0', px: '0px', rem: '0rem', usage: 'Reset margins/padding' },
								{ class: '1', px: '4px', rem: '0.25rem', usage: 'Minimal spacing, borders' },
								{ class: '2', px: '8px', rem: '0.5rem', usage: 'Small gaps, icon spacing' },
								{ class: '3', px: '12px', rem: '0.75rem', usage: 'Form field spacing' },
								{ class: '4', px: '16px', rem: '1rem', usage: 'Default spacing, button padding' },
								{ class: '5', px: '20px', rem: '1.25rem', usage: 'Card padding, list spacing' },
								{ class: '6', px: '24px', rem: '1.5rem', usage: 'Section spacing' },
								{ class: '8', px: '32px', rem: '2rem', usage: 'Large component spacing' },
								{ class: '10', px: '40px', rem: '2.5rem', usage: 'Page section spacing' },
								{ class: '12', px: '48px', rem: '3rem', usage: 'Major section spacing' },
								{ class: '16', px: '64px', rem: '4rem', usage: 'Large section gaps' },
								{ class: '20', px: '80px', rem: '5rem', usage: 'Page-level spacing' },
								{ class: '24', px: '96px', rem: '6rem', usage: 'Hero section spacing' },
								{ class: '32', px: '128px', rem: '8rem', usage: 'Major layout spacing' }
							]
								.map(
									(space) => `
								<div class="flex items-center gap-4 p-3 bg-gray-50 rounded">
									<div class="w-16 text-sm font-mono">${space.class}</div>
									<div class="w-20 text-sm font-mono text-blue-600">${space.px}</div>
									<div class="w-24 text-sm font-mono text-green-600">${space.rem}</div>
									<div class="h-6 bg-blue-500 rounded" style="width: ${space.px}"></div>
									<div class="flex-1 text-sm text-gray-600">${space.usage}</div>
								</div>
							`
								)
								.join('')}
						</div>
						
						<div class="bg-blue-50 p-4 rounded-lg">
							<h3 class="font-semibold mb-2 text-blue-900">Scale Reference</h3>
							<div class="grid grid-cols-4 gap-4 text-sm">
								<div>
									<strong>Class:</strong> Tailwind utility
								</div>
								<div>
									<strong class="text-blue-600">Pixels:</strong> Absolute size
								</div>
								<div>
									<strong class="text-green-600">Rem:</strong> Relative size
								</div>
								<div>
									<strong>Usage:</strong> Common applications
								</div>
							</div>
						</div>
					</div>
				`
			};
		})()
	})
};

export const PaddingExamples: Story = {
	parameters: {
		docs: {
			description: {
				story: 'Practical examples of padding usage in components and layouts.'
			}
		}
	},
	render: () => ({
		Component: (() => {
			return {
				render: () => `
					<div class="p-6 space-y-8">
						<div>
							<h2 class="text-2xl font-bold mb-4">Padding Examples</h2>
							<p class="text-muted-foreground mb-6">
								How padding is used in real components and layouts.
							</p>
						</div>
						
						<div class="space-y-6">
							<!-- Button Padding -->
							<div class="space-y-3">
								<h3 class="text-lg font-semibold">Button Padding</h3>
								<div class="flex gap-4 items-center">
									<button class="bg-primary text-primary-foreground px-3 py-1 rounded text-sm">
										Small: px-3 py-1
									</button>
									<button class="bg-primary text-primary-foreground px-4 py-2 rounded">
										Default: px-4 py-2
									</button>
									<button class="bg-primary text-primary-foreground px-6 py-3 rounded text-lg">
										Large: px-6 py-3
									</button>
								</div>
							</div>
							
							<!-- Card Padding -->
							<div class="space-y-3">
								<h3 class="text-lg font-semibold">Card Padding</h3>
								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div class="bg-card border rounded-lg p-4">
										<h4 class="font-semibold mb-2">Small Card (p-4)</h4>
										<p class="text-sm text-muted-foreground">
											Compact card with minimal padding for lists and small content.
										</p>
									</div>
									<div class="bg-card border rounded-lg p-6">
										<h4 class="font-semibold mb-2">Large Card (p-6)</h4>
										<p class="text-sm text-muted-foreground">
											Spacious card with generous padding for important content.
										</p>
									</div>
								</div>
							</div>
							
							<!-- Form Padding -->
							<div class="space-y-3">
								<h3 class="text-lg font-semibold">Form Element Padding</h3>
								<div class="max-w-md space-y-4">
									<input 
										class="w-full px-3 py-2 border rounded" 
										placeholder="Standard input (px-3 py-2)"
									/>
									<textarea 
										class="w-full px-3 py-2 border rounded" 
										rows="3" 
										placeholder="Textarea with same padding"
									></textarea>
									<select class="w-full px-3 py-2 border rounded">
										<option>Select with consistent padding</option>
									</select>
								</div>
							</div>
							
							<!-- Container Padding -->
							<div class="space-y-3">
								<h3 class="text-lg font-semibold">Container Padding</h3>
								<div class="space-y-4">
									<div class="bg-gray-100 p-4 rounded">
										<strong>Section Container (p-4)</strong>
										<p class="text-sm text-gray-600 mt-1">Moderate padding for content sections</p>
									</div>
									<div class="bg-gray-100 p-6 rounded">
										<strong>Page Container (p-6)</strong>
										<p class="text-sm text-gray-600 mt-1">Generous padding for main page content</p>
									</div>
									<div class="bg-gray-100 p-8 rounded">
										<strong>Hero Container (p-8)</strong>
										<p class="text-sm text-gray-600 mt-1">Large padding for hero sections and featured content</p>
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

export const MarginExamples: Story = {
	parameters: {
		docs: {
			description: {
				story: 'Margin usage for creating space between elements and sections.'
			}
		}
	},
	render: () => ({
		Component: (() => {
			return {
				render: () => `
					<div class="p-6 space-y-8">
						<div>
							<h2 class="text-2xl font-bold mb-4">Margin Examples</h2>
							<p class="text-muted-foreground mb-6">
								How margins create space between elements and establish hierarchy.
							</p>
						</div>
						
						<div class="space-y-8">
							<!-- Text Spacing -->
							<div class="space-y-3">
								<h3 class="text-lg font-semibold">Text Element Spacing</h3>
								<div class="bg-gray-50 p-6 rounded">
									<h1 class="text-2xl font-bold mb-4">Page Title (mb-4)</h1>
									<h2 class="text-xl font-semibold mb-3">Section Heading (mb-3)</h2>
									<p class="mb-4">
										This paragraph has bottom margin (mb-4) to separate it from the next element.
									</p>
									<p class="mb-2">
										This paragraph has smaller margin (mb-2) as it's closely related to the next one.
									</p>
									<p class="text-sm text-gray-600">
										Final paragraph with no bottom margin.
									</p>
								</div>
							</div>
							
							<!-- Component Spacing -->
							<div class="space-y-3">
								<h3 class="text-lg font-semibold">Component Spacing</h3>
								<div class="space-y-4">
									<div class="bg-card border p-4 rounded">Component 1</div>
									<div class="bg-card border p-4 rounded">Component 2 (space-y-4)</div>
									<div class="bg-card border p-4 rounded">Component 3</div>
								</div>
								<div class="space-y-6 mt-8">
									<div class="bg-card border p-4 rounded">Section A</div>
									<div class="bg-card border p-4 rounded">Section B (space-y-6)</div>
									<div class="bg-card border p-4 rounded">Section C</div>
								</div>
							</div>
							
							<!-- Layout Margins -->
							<div class="space-y-3">
								<h3 class="text-lg font-semibold">Layout Margins</h3>
								<div class="space-y-8">
									<section class="bg-blue-50 p-6 rounded">
										<h4 class="font-semibold mb-4">Section 1</h4>
										<p class="text-sm text-gray-600">Section with space-y-8 creates large gaps</p>
									</section>
									<section class="bg-green-50 p-6 rounded">
										<h4 class="font-semibold mb-4">Section 2</h4>
										<p class="text-sm text-gray-600">Perfect for major page sections</p>
									</section>
								</div>
							</div>
							
							<!-- Auto Margins -->
							<div class="space-y-3">
								<h3 class="text-lg font-semibold">Auto Margins for Centering</h3>
								<div class="bg-gray-50 p-6 rounded">
									<div class="max-w-md mx-auto bg-white p-4 rounded border text-center">
										<strong>Centered Content (mx-auto)</strong>
										<p class="text-sm text-gray-600 mt-2">
											Uses mx-auto with max-width to center content
										</p>
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

export const GapExamples: Story = {
	parameters: {
		docs: {
			description: {
				story: 'Gap usage in flexbox and grid layouts for consistent spacing between children.'
			}
		}
	},
	render: () => ({
		Component: (() => {
			return {
				render: () => `
					<div class="p-6 space-y-8">
						<div>
							<h2 class="text-2xl font-bold mb-4">Gap Examples</h2>
							<p class="text-muted-foreground mb-6">
								Using gap property for consistent spacing in flex and grid layouts.
							</p>
						</div>
						
						<div class="space-y-8">
							<!-- Flex Gap -->
							<div class="space-y-4">
								<h3 class="text-lg font-semibold">Flexbox Gap</h3>
								
								<div class="space-y-4">
									<div>
										<p class="text-sm text-gray-600 mb-2">Small gap (gap-2)</p>
										<div class="flex gap-2">
											<div class="bg-blue-100 px-3 py-2 rounded">Item 1</div>
											<div class="bg-blue-100 px-3 py-2 rounded">Item 2</div>
											<div class="bg-blue-100 px-3 py-2 rounded">Item 3</div>
										</div>
									</div>
									
									<div>
										<p class="text-sm text-gray-600 mb-2">Medium gap (gap-4)</p>
										<div class="flex gap-4">
											<div class="bg-green-100 px-3 py-2 rounded">Item 1</div>
											<div class="bg-green-100 px-3 py-2 rounded">Item 2</div>
											<div class="bg-green-100 px-3 py-2 rounded">Item 3</div>
										</div>
									</div>
									
									<div>
										<p class="text-sm text-gray-600 mb-2">Large gap (gap-6)</p>
										<div class="flex gap-6">
											<div class="bg-purple-100 px-3 py-2 rounded">Item 1</div>
											<div class="bg-purple-100 px-3 py-2 rounded">Item 2</div>
											<div class="bg-purple-100 px-3 py-2 rounded">Item 3</div>
										</div>
									</div>
								</div>
							</div>
							
							<!-- Grid Gap -->
							<div class="space-y-4">
								<h3 class="text-lg font-semibold">Grid Gap</h3>
								
								<div class="space-y-6">
									<div>
										<p class="text-sm text-gray-600 mb-2">Grid with gap-4</p>
										<div class="grid grid-cols-3 gap-4">
											<div class="bg-red-100 p-4 rounded text-center">1</div>
											<div class="bg-red-100 p-4 rounded text-center">2</div>
											<div class="bg-red-100 p-4 rounded text-center">3</div>
											<div class="bg-red-100 p-4 rounded text-center">4</div>
											<div class="bg-red-100 p-4 rounded text-center">5</div>
											<div class="bg-red-100 p-4 rounded text-center">6</div>
										</div>
									</div>
									
									<div>
										<p class="text-sm text-gray-600 mb-2">Grid with gap-6</p>
										<div class="grid grid-cols-2 gap-6">
											<div class="bg-yellow-100 p-4 rounded text-center">Card 1</div>
											<div class="bg-yellow-100 p-4 rounded text-center">Card 2</div>
											<div class="bg-yellow-100 p-4 rounded text-center">Card 3</div>
											<div class="bg-yellow-100 p-4 rounded text-center">Card 4</div>
										</div>
									</div>
								</div>
							</div>
							
							<!-- Mixed Directional Gaps -->
							<div class="space-y-4">
								<h3 class="text-lg font-semibold">Directional Gaps</h3>
								
								<div class="space-y-6">
									<div>
										<p class="text-sm text-gray-600 mb-2">Horizontal gap only (gap-x-4)</p>
										<div class="flex gap-x-4">
											<div class="bg-indigo-100 px-3 py-2 rounded">Item 1</div>
											<div class="bg-indigo-100 px-3 py-2 rounded">Item 2</div>
											<div class="bg-indigo-100 px-3 py-2 rounded">Item 3</div>
										</div>
									</div>
									
									<div>
										<p class="text-sm text-gray-600 mb-2">Vertical gap only (gap-y-3)</p>
										<div class="flex flex-col gap-y-3 max-w-xs">
											<div class="bg-pink-100 px-3 py-2 rounded">Item 1</div>
											<div class="bg-pink-100 px-3 py-2 rounded">Item 2</div>
											<div class="bg-pink-100 px-3 py-2 rounded">Item 3</div>
										</div>
									</div>
									
									<div>
										<p class="text-sm text-gray-600 mb-2">Different gaps (gap-x-6 gap-y-3)</p>
										<div class="grid grid-cols-2 gap-x-6 gap-y-3">
											<div class="bg-teal-100 p-3 rounded text-center">Item 1</div>
											<div class="bg-teal-100 p-3 rounded text-center">Item 2</div>
											<div class="bg-teal-100 p-3 rounded text-center">Item 3</div>
											<div class="bg-teal-100 p-3 rounded text-center">Item 4</div>
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

export const SpacingGuidelines: Story = {
	parameters: {
		docs: {
			description: {
				story: 'Best practices and guidelines for using spacing effectively in your designs.'
			}
		}
	},
	render: () => ({
		Component: (() => {
			return {
				render: () => `
					<div class="p-6 space-y-8">
						<div>
							<h2 class="text-2xl font-bold mb-4">Spacing Guidelines</h2>
							<p class="text-muted-foreground mb-6">
								Best practices for creating harmonious and functional layouts.
							</p>
						</div>
						
						<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
							<!-- Do's -->
							<div class="space-y-4">
								<h3 class="text-lg font-semibold text-green-700">✓ Do</h3>
								
								<div class="space-y-4">
									<div class="bg-green-50 border border-green-200 p-4 rounded">
										<h4 class="font-medium text-green-800 mb-2">Use Consistent Spacing</h4>
										<div class="space-y-2">
											<div class="bg-white p-3 rounded shadow-sm">Component 1</div>
											<div class="bg-white p-3 rounded shadow-sm">Component 2</div>
											<div class="bg-white p-3 rounded shadow-sm">Component 3</div>
										</div>
										<p class="text-sm text-green-700 mt-2">
											Same spacing (space-y-2) between related components
										</p>
									</div>
									
									<div class="bg-green-50 border border-green-200 p-4 rounded">
										<h4 class="font-medium text-green-800 mb-2">Create Visual Hierarchy</h4>
										<div class="space-y-6">
											<div class="space-y-2">
												<div class="bg-white p-3 rounded shadow-sm">Related Item 1</div>
												<div class="bg-white p-3 rounded shadow-sm">Related Item 2</div>
											</div>
											<div class="space-y-2">
												<div class="bg-white p-3 rounded shadow-sm">Related Item 3</div>
												<div class="bg-white p-3 rounded shadow-sm">Related Item 4</div>
											</div>
										</div>
										<p class="text-sm text-green-700 mt-2">
											Larger gaps between groups, smaller gaps within groups
										</p>
									</div>
									
									<div class="bg-green-50 border border-green-200 p-4 rounded">
										<h4 class="font-medium text-green-800 mb-2">Use Scale Consistently</h4>
										<div class="flex gap-4">
											<button class="bg-blue-500 text-white px-4 py-2 rounded">Action</button>
											<button class="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
										</div>
										<p class="text-sm text-green-700 mt-2">
											Same gap (gap-4) between all buttons
										</p>
									</div>
								</div>
							</div>
							
							<!-- Don'ts -->
							<div class="space-y-4">
								<h3 class="text-lg font-semibold text-red-700">✗ Don't</h3>
								
								<div class="space-y-4">
									<div class="bg-red-50 border border-red-200 p-4 rounded">
										<h4 class="font-medium text-red-800 mb-2">Use Arbitrary Values</h4>
										<div class="space-y-1">
											<div class="bg-white p-3 rounded shadow-sm">Component 1</div>
											<div class="bg-white p-3 rounded shadow-sm mt-3">Component 2</div>
											<div class="bg-white p-3 rounded shadow-sm mt-5">Component 3</div>
										</div>
										<p class="text-sm text-red-700 mt-2">
											Inconsistent spacing breaks visual rhythm
										</p>
									</div>
									
									<div class="bg-red-50 border border-red-200 p-4 rounded">
										<h4 class="font-medium text-red-800 mb-2">Overcrowd Elements</h4>
										<div class="space-y-1">
											<div class="bg-white p-1 rounded shadow-sm text-sm">Too close</div>
											<div class="bg-white p-1 rounded shadow-sm text-sm">Hard to read</div>
											<div class="bg-white p-1 rounded shadow-sm text-sm">Feels cramped</div>
										</div>
										<p class="text-sm text-red-700 mt-2">
											Insufficient spacing reduces readability
										</p>
									</div>
									
									<div class="bg-red-50 border border-red-200 p-4 rounded">
										<h4 class="font-medium text-red-800 mb-2">Mix Spacing Methods</h4>
										<div class="flex" style="gap: 8px; margin-left: 12px;">
											<div class="bg-white p-2 rounded shadow-sm text-sm">Mixed</div>
											<div class="bg-white p-2 rounded shadow-sm text-sm">Spacing</div>
										</div>
										<p class="text-sm text-red-700 mt-2">
											Mixing margins, gaps, and arbitrary values
										</p>
									</div>
								</div>
							</div>
						</div>
						
						<!-- Quick Reference -->
						<div class="bg-blue-50 p-6 rounded-lg">
							<h3 class="text-lg font-semibold text-blue-900 mb-4">Quick Reference</h3>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
								<div>
									<h4 class="font-medium text-blue-800 mb-2">Common Patterns</h4>
									<ul class="space-y-1 text-blue-700">
										<li>• Button groups: <code>gap-2</code> or <code>gap-3</code></li>
										<li>• Form fields: <code>space-y-4</code> or <code>space-y-6</code></li>
										<li>• Card grids: <code>gap-4</code> or <code>gap-6</code></li>
										<li>• Page sections: <code>space-y-8</code> or <code>space-y-12</code></li>
									</ul>
								</div>
								<div>
									<h4 class="font-medium text-blue-800 mb-2">Responsive Considerations</h4>
									<ul class="space-y-1 text-blue-700">
										<li>• Reduce spacing on mobile: <code>space-y-4 md:space-y-8</code></li>
										<li>• Increase padding on larger screens: <code>p-4 md:p-6</code></li>
										<li>• Use smaller gaps on mobile: <code>gap-2 md:gap-4</code></li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				`
			};
		})()
	})
};
