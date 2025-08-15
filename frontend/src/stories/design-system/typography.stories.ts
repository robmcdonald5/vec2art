import type { Meta, StoryObj } from '@storybook/sveltekit';

const meta: Meta = {
	title: 'Design System/Typography',
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component: `
# Typography System

The vec2art design system uses a carefully curated typography scale based on Inter font family with system fallbacks for optimal readability and performance.

## Font Stack

**Primary Font:** Inter - A modern, highly legible typeface designed for user interfaces
**System Fallbacks:** system-ui, sans-serif

## Type Scale

The typography system follows a modular scale with consistent line heights and spacing for optimal readability across all devices.

## Usage

Typography can be applied through Tailwind CSS utility classes:

\`\`\`html
<h1 class="text-4xl font-bold">Heading 1</h1>
<p class="text-base leading-7">Body text paragraph</p>
<span class="text-sm text-muted-foreground">Supporting text</span>
\`\`\`

## Accessibility

- Minimum 16px base font size for readability
- Sufficient line height for comfortable reading
- High contrast color combinations
- Responsive scaling for different screen sizes
				`
			}
		}
	},
	tags: ['autodocs']
};

export default meta;
type Story = StoryObj<meta>;

export const HeadingScale: Story = {
	parameters: {
		docs: {
			description: {
				story: 'Complete heading hierarchy from H1 to H6 with recommended usage.'
			}
		}
	},
	render: () => ({
		Component: (() => {
			return {
				render: () => `
					<div class="p-6 space-y-8">
						<div class="space-y-6">
							<div>
								<h2 class="text-2xl font-bold mb-4 text-foreground">Heading Scale</h2>
								<p class="text-muted-foreground mb-6">
									Semantic heading hierarchy with consistent sizing and spacing.
								</p>
							</div>
							
							<div class="space-y-4">
								<div class="flex items-baseline gap-4 pb-3 border-b border-border">
									<h1 class="text-4xl font-bold text-foreground">Heading 1</h1>
									<div class="text-sm text-muted-foreground">
										<code>text-4xl font-bold</code> - Page titles, hero headings
									</div>
								</div>
								
								<div class="flex items-baseline gap-4 pb-3 border-b border-border">
									<h2 class="text-3xl font-bold text-foreground">Heading 2</h2>
									<div class="text-sm text-muted-foreground">
										<code>text-3xl font-bold</code> - Section headings, major divisions
									</div>
								</div>
								
								<div class="flex items-baseline gap-4 pb-3 border-b border-border">
									<h3 class="text-2xl font-semibold text-foreground">Heading 3</h3>
									<div class="text-sm text-muted-foreground">
										<code>text-2xl font-semibold</code> - Subsection headings
									</div>
								</div>
								
								<div class="flex items-baseline gap-4 pb-3 border-b border-border">
									<h4 class="text-xl font-semibold text-foreground">Heading 4</h4>
									<div class="text-sm text-muted-foreground">
										<code>text-xl font-semibold</code> - Component titles
									</div>
								</div>
								
								<div class="flex items-baseline gap-4 pb-3 border-b border-border">
									<h5 class="text-lg font-medium text-foreground">Heading 5</h5>
									<div class="text-sm text-muted-foreground">
										<code>text-lg font-medium</code> - Card headings, smaller sections
									</div>
								</div>
								
								<div class="flex items-baseline gap-4">
									<h6 class="text-base font-medium text-foreground">Heading 6</h6>
									<div class="text-sm text-muted-foreground">
										<code>text-base font-medium</code> - Minor headings, labels
									</div>
								</div>
							</div>
						</div>
						
						<div class="bg-muted p-6 rounded-lg">
							<h3 class="text-lg font-semibold mb-3 text-foreground">Hierarchy Example</h3>
							<div class="space-y-3">
								<h1 class="text-3xl font-bold text-foreground">Page Title</h1>
								<h2 class="text-2xl font-semibold text-foreground">Section Heading</h2>
								<p class="text-base text-foreground leading-7">
									This is a paragraph of body text that demonstrates the relationship between headings and content.
								</p>
								<h3 class="text-xl font-semibold text-foreground">Subsection Heading</h3>
								<p class="text-base text-foreground leading-7">
									Another paragraph showing the visual hierarchy in action.
								</p>
								<h4 class="text-lg font-medium text-foreground">Component Heading</h4>
								<p class="text-sm text-muted-foreground">
									Supporting text with muted color for less emphasis.
								</p>
							</div>
						</div>
					</div>
				`
			};
		})()
	})
};

export const BodyText: Story = {
	parameters: {
		docs: {
			description: {
				story: 'Body text styles for different content types and contexts.'
			}
		}
	},
	render: () => ({
		Component: (() => {
			return {
				render: () => `
					<div class="p-6 space-y-8">
						<div>
							<h2 class="text-2xl font-bold mb-4 text-foreground">Body Text Styles</h2>
							<p class="text-muted-foreground mb-6">
								Text styles for content, descriptions, and user interface elements.
							</p>
						</div>
						
						<div class="space-y-6">
							<!-- Large Text -->
							<div class="space-y-2">
								<h3 class="text-lg font-semibold text-foreground">Large Text</h3>
								<p class="text-lg text-foreground leading-8">
									Large body text for emphasized content and introductory paragraphs. 
									This size is perfect for hero descriptions and important messaging.
								</p>
								<code class="text-sm text-muted-foreground">text-lg leading-8</code>
							</div>
							
							<!-- Default Body -->
							<div class="space-y-2">
								<h3 class="text-lg font-semibold text-foreground">Default Body Text</h3>
								<p class="text-base text-foreground leading-7">
									Standard body text for most content. This is the default reading size that provides 
									optimal readability for paragraphs, descriptions, and general content. The line height 
									is carefully chosen for comfortable reading across different screen sizes.
								</p>
								<code class="text-sm text-muted-foreground">text-base leading-7</code>
							</div>
							
							<!-- Small Text -->
							<div class="space-y-2">
								<h3 class="text-lg font-semibold text-foreground">Small Text</h3>
								<p class="text-sm text-foreground leading-6">
									Smaller text for supporting information, captions, and secondary content. 
									Still maintains readability while providing visual hierarchy.
								</p>
								<code class="text-sm text-muted-foreground">text-sm leading-6</code>
							</div>
							
							<!-- Extra Small Text -->
							<div class="space-y-2">
								<h3 class="text-lg font-semibold text-foreground">Extra Small Text</h3>
								<p class="text-xs text-muted-foreground leading-5">
									Very small text for metadata, timestamps, and fine print. Use sparingly and ensure accessibility.
								</p>
								<code class="text-sm text-muted-foreground">text-xs leading-5</code>
							</div>
						</div>
						
						<!-- Semantic Text Colors -->
						<div class="space-y-4">
							<h3 class="text-lg font-semibold text-foreground">Text Colors</h3>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div class="space-y-3">
									<p class="text-foreground">Primary text color for main content</p>
									<p class="text-muted-foreground">Muted text for supporting information</p>
									<p class="text-primary">Primary brand color for links and emphasis</p>
									<p class="text-destructive">Destructive color for errors and warnings</p>
								</div>
								<div class="space-y-3 text-sm">
									<code>text-foreground</code>
									<code>text-muted-foreground</code>
									<code>text-primary</code>
									<code>text-destructive</code>
								</div>
							</div>
						</div>
					</div>
				`
			};
		})()
	})
};

export const FontWeights: Story = {
	parameters: {
		docs: {
			description: {
				story: 'Font weight variations for creating visual hierarchy and emphasis.'
			}
		}
	},
	render: () => ({
		Component: (() => {
			return {
				render: () => `
					<div class="p-6 space-y-8">
						<div>
							<h2 class="text-2xl font-bold mb-4 text-foreground">Font Weights</h2>
							<p class="text-muted-foreground mb-6">
								Different font weights for emphasis and hierarchy.
							</p>
						</div>
						
						<div class="space-y-4">
							<div class="flex items-baseline gap-6">
								<span class="text-xl font-normal text-foreground w-32">Normal</span>
								<code class="text-sm text-muted-foreground">font-normal (400)</code>
								<span class="text-sm text-muted-foreground">Body text, paragraphs</span>
							</div>
							
							<div class="flex items-baseline gap-6">
								<span class="text-xl font-medium text-foreground w-32">Medium</span>
								<code class="text-sm text-muted-foreground">font-medium (500)</code>
								<span class="text-sm text-muted-foreground">Emphasis, labels, small headings</span>
							</div>
							
							<div class="flex items-baseline gap-6">
								<span class="text-xl font-semibold text-foreground w-32">Semibold</span>
								<code class="text-sm text-muted-foreground">font-semibold (600)</code>
								<span class="text-sm text-muted-foreground">Headings, important text</span>
							</div>
							
							<div class="flex items-baseline gap-6">
								<span class="text-xl font-bold text-foreground w-32">Bold</span>
								<code class="text-sm text-muted-foreground">font-bold (700)</code>
								<span class="text-sm text-muted-foreground">Page titles, strong emphasis</span>
							</div>
						</div>
						
						<div class="bg-muted p-6 rounded-lg space-y-4">
							<h3 class="text-lg font-semibold text-foreground">Usage Guidelines</h3>
							<div class="space-y-3 text-sm">
								<div>
									<strong class="font-semibold">Normal (400):</strong> 
									<span class="text-muted-foreground">Default weight for body text and paragraphs</span>
								</div>
								<div>
									<strong class="font-semibold">Medium (500):</strong> 
									<span class="text-muted-foreground">Form labels, navigation items, subtle emphasis</span>
								</div>
								<div>
									<strong class="font-semibold">Semibold (600):</strong> 
									<span class="text-muted-foreground">Headings H3-H6, card titles, button text</span>
								</div>
								<div>
									<strong class="font-semibold">Bold (700):</strong> 
									<span class="text-muted-foreground">Page titles H1-H2, strong calls-to-action</span>
								</div>
							</div>
						</div>
					</div>
				`
			};
		})()
	})
};

export const SpecializedText: Story = {
	parameters: {
		docs: {
			description: {
				story:
					'Specialized text treatments for specific use cases like code, links, and UI elements.'
			}
		}
	},
	render: () => ({
		Component: (() => {
			return {
				render: () => `
					<div class="p-6 space-y-8">
						<div>
							<h2 class="text-2xl font-bold mb-4 text-foreground">Specialized Text</h2>
							<p class="text-muted-foreground mb-6">
								Special text treatments for code, links, and interface elements.
							</p>
						</div>
						
						<div class="space-y-6">
							<!-- Code Text -->
							<div class="space-y-3">
								<h3 class="text-lg font-semibold text-foreground">Code & Monospace</h3>
								<div class="space-y-2">
									<p class="text-foreground">
										Inline code: <code class="bg-muted px-1 py-0.5 rounded text-sm font-mono">npm install</code>
									</p>
									<div class="bg-muted p-4 rounded-lg">
										<pre class="text-sm font-mono text-foreground overflow-x-auto"><code>const message = "Hello, World!";
console.log(message);</code></pre>
									</div>
									<p class="text-xs text-muted-foreground">
										Uses system monospace fonts for code snippets and technical content
									</p>
								</div>
							</div>
							
							<!-- Links -->
							<div class="space-y-3">
								<h3 class="text-lg font-semibold text-foreground">Links & Interactive Text</h3>
								<div class="space-y-2">
									<p class="text-foreground">
										Regular link: <a href="#" class="text-primary underline hover:no-underline">Click here</a>
									</p>
									<p class="text-foreground">
										Subtle link: <a href="#" class="text-primary hover:underline">Learn more</a>
									</p>
									<p class="text-foreground">
										Button-style link: <a href="#" class="text-primary font-medium hover:text-primary/80">Get started →</a>
									</p>
								</div>
							</div>
							
							<!-- Status Text -->
							<div class="space-y-3">
								<h3 class="text-lg font-semibold text-foreground">Status & State Text</h3>
								<div class="space-y-2">
									<p class="text-green-600 font-medium">✓ Success message</p>
									<p class="text-yellow-600 font-medium">⚠ Warning message</p>
									<p class="text-red-600 font-medium">✗ Error message</p>
									<p class="text-blue-600 font-medium">ℹ Information message</p>
								</div>
							</div>
							
							<!-- UI Element Text -->
							<div class="space-y-3">
								<h3 class="text-lg font-semibold text-foreground">UI Element Text</h3>
								<div class="space-y-4">
									<!-- Button Text -->
									<div class="space-y-2">
										<h4 class="font-medium text-foreground">Button Text</h4>
										<div class="flex gap-2">
											<button class="bg-primary text-primary-foreground px-4 py-2 rounded font-medium">
												Primary Action
											</button>
											<button class="border border-input px-4 py-2 rounded font-medium hover:bg-accent">
												Secondary Action
											</button>
										</div>
									</div>
									
									<!-- Form Labels -->
									<div class="space-y-2">
										<h4 class="font-medium text-foreground">Form Labels</h4>
										<div class="space-y-3 max-w-xs">
											<div>
												<label class="block text-sm font-medium text-foreground mb-1">
													Input Label
												</label>
												<input class="w-full px-3 py-2 border border-input rounded text-sm" placeholder="Placeholder text" />
												<p class="text-xs text-muted-foreground mt-1">Helper text for additional context</p>
											</div>
										</div>
									</div>
									
									<!-- Badges & Tags -->
									<div class="space-y-2">
										<h4 class="font-medium text-foreground">Badges & Tags</h4>
										<div class="flex gap-2">
											<span class="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
												Primary
											</span>
											<span class="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs font-medium">
												Secondary
											</span>
											<span class="bg-muted text-muted-foreground px-2 py-1 rounded text-xs font-medium">
												Muted
											</span>
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

export const ResponsiveTypography: Story = {
	parameters: {
		docs: {
			description: {
				story: 'How typography scales across different screen sizes and devices.'
			}
		}
	},
	render: () => ({
		Component: (() => {
			return {
				render: () => `
					<div class="p-6 space-y-8">
						<div>
							<h2 class="text-2xl font-bold mb-4 text-foreground">Responsive Typography</h2>
							<p class="text-muted-foreground mb-6">
								Typography that adapts to different screen sizes for optimal readability.
							</p>
						</div>
						
						<div class="space-y-6">
							<!-- Responsive Headings -->
							<div class="space-y-4">
								<h3 class="text-lg font-semibold text-foreground">Responsive Headings</h3>
								<div class="bg-muted p-6 rounded-lg space-y-4">
									<h1 class="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
										Responsive Page Title
									</h1>
									<p class="text-sm text-muted-foreground">
										<code>text-2xl md:text-3xl lg:text-4xl</code>
									</p>
									
									<h2 class="text-xl md:text-2xl lg:text-3xl font-semibold text-foreground">
										Responsive Section Heading
									</h2>
									<p class="text-sm text-muted-foreground">
										<code>text-xl md:text-2xl lg:text-3xl</code>
									</p>
									
									<p class="text-sm md:text-base text-foreground leading-relaxed">
										Responsive body text that scales up on larger screens for better readability.
									</p>
									<p class="text-sm text-muted-foreground">
										<code>text-sm md:text-base</code>
									</p>
								</div>
							</div>
							
							<!-- Mobile-First Approach -->
							<div class="space-y-4">
								<h3 class="text-lg font-semibold text-foreground">Mobile-First Guidelines</h3>
								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div class="bg-blue-50 p-4 rounded border">
										<h4 class="font-semibold mb-2 text-blue-900">Mobile (320px+)</h4>
										<ul class="text-sm text-blue-800 space-y-1">
											<li>• H1: text-2xl (24px)</li>
											<li>• H2: text-xl (20px)</li>
											<li>• Body: text-sm (14px)</li>
											<li>• Small: text-xs (12px)</li>
										</ul>
									</div>
									
									<div class="bg-green-50 p-4 rounded border">
										<h4 class="font-semibold mb-2 text-green-900">Desktop (1024px+)</h4>
										<ul class="text-sm text-green-800 space-y-1">
											<li>• H1: text-4xl (36px)</li>
											<li>• H2: text-3xl (30px)</li>
											<li>• Body: text-base (16px)</li>
											<li>• Small: text-sm (14px)</li>
										</ul>
									</div>
								</div>
							</div>
							
							<!-- Reading Experience -->
							<div class="space-y-4">
								<h3 class="text-lg font-semibold text-foreground">Optimal Reading Experience</h3>
								<div class="max-w-2xl bg-background border rounded-lg p-6">
									<h2 class="text-xl md:text-2xl font-semibold mb-4 text-foreground">
										Long-form Content Example
									</h2>
									<div class="space-y-4 text-sm md:text-base text-foreground leading-relaxed">
										<p>
											This paragraph demonstrates optimal line length and spacing for comfortable reading. 
											The text scales appropriately on different screen sizes while maintaining readability.
										</p>
										<p>
											Notice how the line height and font size work together to create a pleasant reading 
											experience that doesn't strain the eyes, even during extended reading sessions.
										</p>
										<p class="text-muted-foreground">
											Supporting text uses muted colors to create visual hierarchy without overwhelming 
											the primary content.
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
