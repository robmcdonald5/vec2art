/**
 * @file button.test.ts
 * Comprehensive tests for Button component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte';
import Button from './button.svelte'; // Test file - keep direct import
import {
	interactionTestUtils,
	assertionUtils,
	setupBrowserMocks,
	cleanupBrowserMocks
} from '@tests/test-utils';

describe('Button Component', () => {
	beforeEach(() => {
		setupBrowserMocks();
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
		cleanupBrowserMocks();
	});

	describe('Basic Rendering', () => {
		it('should render as button by default', () => {
			const TestButton = () => {
				return Button({
					children: () => 'Click me'
				});
			};

			render(TestButton);

			const button = screen.getByRole('button');
			expect(button).toBeInTheDocument();
			expect(button).toHaveTextContent('Click me');
		});

		it('should render as link when href is provided', () => {
			const TestButton = () => {
				return Button({
					href: '/test-link',
					children: () => 'Link text'
				});
			};

			render(TestButton);

			const link = screen.getByRole('link');
			expect(link).toBeInTheDocument();
			expect(link).toHaveAttribute('href', '/test-link');
			expect(link).toHaveTextContent('Link text');
		});

		it('should render without children', () => {
			const TestButton = () => {
				return Button({});
			};

			expect(() => render(TestButton)).not.toThrow();

			const button = screen.getByRole('button');
			expect(button).toBeInTheDocument();
		});

		it('should apply default variant and size classes', () => {
			const TestButton = () => {
				return Button({
					children: () => 'Default button'
				});
			};

			render(TestButton);

			const button = screen.getByRole('button');
			expect(button).toHaveClass('bg-primary', 'text-primary-foreground', 'h-10', 'px-4', 'py-2');
		});
	});

	describe('Variant Styling', () => {
		const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const;

		variants.forEach((variant) => {
			it(`should apply ${variant} variant classes`, () => {
				const TestButton = () => {
					return Button({
						variant,
						children: () => `${variant} button`
					});
				};

				render(TestButton);

				const button = screen.getByRole(variant === 'link' ? 'link' : 'button');
				expect(button).toBeInTheDocument();

				// Check for variant-specific classes
				switch (variant) {
					case 'default':
						expect(button).toHaveClass('bg-primary', 'text-primary-foreground');
						break;
					case 'destructive':
						expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground');
						break;
					case 'outline':
						expect(button).toHaveClass('border', 'border-input', 'bg-background');
						break;
					case 'secondary':
						expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground');
						break;
					case 'ghost':
						expect(button).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground');
						break;
					case 'link':
						expect(button).toHaveClass('text-primary', 'underline-offset-4');
						break;
				}
			});
		});
	});

	describe('Size Variants', () => {
		const sizes = ['default', 'sm', 'lg', 'icon'] as const;

		sizes.forEach((size) => {
			it(`should apply ${size} size classes`, () => {
				const TestButton = () => {
					return Button({
						size,
						children: () => `${size} button`
					});
				};

				render(TestButton);

				const button = screen.getByRole('button');
				expect(button).toBeInTheDocument();

				// Check for size-specific classes
				switch (size) {
					case 'default':
						expect(button).toHaveClass('h-10', 'px-4', 'py-2');
						break;
					case 'sm':
						expect(button).toHaveClass('h-9', 'px-3');
						break;
					case 'lg':
						expect(button).toHaveClass('h-11', 'px-8');
						break;
					case 'icon':
						expect(button).toHaveClass('h-10', 'w-10');
						break;
				}
			});
		});
	});

	describe('Button Types', () => {
		it('should default to type="button"', () => {
			const TestButton = () => {
				return Button({
					children: () => 'Default type'
				});
			};

			render(TestButton);

			const button = screen.getByRole('button');
			expect(button).toHaveAttribute('type', 'button');
		});

		it('should apply custom type', () => {
			const TestButton = () => {
				return Button({
					type: 'submit',
					children: () => 'Submit button'
				});
			};

			render(TestButton);

			const button = screen.getByRole('button');
			expect(button).toHaveAttribute('type', 'submit');
		});

		it('should support reset type', () => {
			const TestButton = () => {
				return Button({
					type: 'reset',
					children: () => 'Reset button'
				});
			};

			render(TestButton);

			const button = screen.getByRole('button');
			expect(button).toHaveAttribute('type', 'reset');
		});
	});

	describe('Disabled State', () => {
		it('should apply disabled attribute and styling', () => {
			const TestButton = () => {
				return Button({
					disabled: true,
					children: () => 'Disabled button'
				});
			};

			render(TestButton);

			const button = screen.getByRole('button');
			expect(button).toBeDisabled();
			expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
		});

		it('should not call onclick when disabled', async () => {
			const onclick = vi.fn();
			const TestButton = () => {
				return Button({
					disabled: true,
					onclick,
					children: () => 'Disabled button'
				});
			};

			render(TestButton);

			const button = screen.getByRole('button');
			await fireEvent.click(button);

			expect(onclick).not.toHaveBeenCalled();
		});

		it('should not disable links (href provided)', () => {
			const TestButton = () => {
				return Button({
					href: '/test',
					disabled: true,
					children: () => 'Link button'
				});
			};

			render(TestButton);

			const link = screen.getByRole('link');
			expect(link).not.toHaveAttribute('disabled');
		});
	});

	describe('Event Handling', () => {
		it('should call onclick when clicked', async () => {
			const onclick = vi.fn();
			const TestButton = () => {
				return Button({
					onclick,
					children: () => 'Clickable button'
				});
			};

			render(TestButton);

			const button = screen.getByRole('button');
			await fireEvent.click(button);

			expect(onclick).toHaveBeenCalledTimes(1);
			expect(onclick).toHaveBeenCalledWith(expect.any(MouseEvent));
		});

		it('should call onmouseenter and onmouseleave', async () => {
			const onmouseenter = vi.fn();
			const onmouseleave = vi.fn();

			const TestButton = () => {
				return Button({
					onmouseenter,
					onmouseleave,
					children: () => 'Hover button'
				});
			};

			render(TestButton);

			const button = screen.getByRole('button');

			await fireEvent.mouseEnter(button);
			expect(onmouseenter).toHaveBeenCalledTimes(1);

			await fireEvent.mouseLeave(button);
			expect(onmouseleave).toHaveBeenCalledTimes(1);
		});

		it('should work with keyboard navigation', async () => {
			const onclick = vi.fn();
			const TestButton = () => {
				return Button({
					onclick,
					children: () => 'Keyboard button'
				});
			};

			render(TestButton);

			const button = screen.getByRole('button');
			button.focus();

			await interactionTestUtils.pressKey(button, 'Enter');
			expect(onclick).toHaveBeenCalledTimes(1);

			await interactionTestUtils.pressKey(button, ' ');
			expect(onclick).toHaveBeenCalledTimes(2);
		});

		it('should handle multiple rapid clicks', async () => {
			const onclick = vi.fn();
			const TestButton = () => {
				return Button({
					onclick,
					children: () => 'Rapid click button'
				});
			};

			render(TestButton);

			const button = screen.getByRole('button');

			// Rapidly click 5 times
			for (let i = 0; i < 5; i++) {
				await fireEvent.click(button);
			}

			expect(onclick).toHaveBeenCalledTimes(5);
		});
	});

	describe('Custom Styling', () => {
		it('should apply custom class names', () => {
			const TestButton = () => {
				return Button({
					class: 'custom-class-1 custom-class-2',
					children: () => 'Custom styled button'
				});
			};

			render(TestButton);

			const button = screen.getByRole('button');
			expect(button).toHaveClass('custom-class-1', 'custom-class-2');
		});

		it('should merge custom classes with variant classes', () => {
			const TestButton = () => {
				return Button({
					variant: 'secondary',
					size: 'lg',
					class: 'custom-override',
					children: () => 'Merged classes button'
				});
			};

			render(TestButton);

			const button = screen.getByRole('button');
			expect(button).toHaveClass(
				'bg-secondary',
				'text-secondary-foreground',
				'h-11',
				'px-8',
				'custom-override'
			);
		});
	});

	describe('Additional Props', () => {
		it('should pass through additional props to button element', () => {
			const TestButton = () => {
				return Button({
					'data-testid': 'custom-button',
					'aria-label': 'Custom aria label',
					id: 'button-id',
					children: () => 'Props button'
				});
			};

			render(TestButton);

			const button = screen.getByRole('button');
			expect(button).toHaveAttribute('data-testid', 'custom-button');
			expect(button).toHaveAttribute('aria-label', 'Custom aria label');
			expect(button).toHaveAttribute('id', 'button-id');
		});

		it('should pass through additional props to link element', () => {
			const TestButton = () => {
				return Button({
					href: '/test',
					'data-testid': 'custom-link',
					target: '_blank',
					rel: 'noopener',
					children: () => 'Link with props'
				});
			};

			render(TestButton);

			const link = screen.getByRole('link');
			expect(link).toHaveAttribute('data-testid', 'custom-link');
			expect(link).toHaveAttribute('target', '_blank');
			expect(link).toHaveAttribute('rel', 'noopener');
		});
	});

	describe('Accessibility Features', () => {
		it('should be focusable by default', () => {
			const TestButton = () => {
				return Button({
					children: () => 'Focusable button'
				});
			};

			render(TestButton);

			const button = screen.getByRole('button');
			button.focus();
			expect(button).toHaveFocus();
		});

		it('should have focus-visible styles', () => {
			const TestButton = () => {
				return Button({
					children: () => 'Focus visible button'
				});
			};

			render(TestButton);

			const button = screen.getByRole('button');
			expect(button).toHaveClass(
				'focus-visible:outline-none',
				'focus-visible:ring-2',
				'focus-visible:ring-ring'
			);
		});

		it('should pass basic accessibility check', async () => {
			const TestButton = () => {
				return Button({
					children: () => 'Accessible button'
				});
			};

			render(TestButton);

			const button = screen.getByRole('button');
			await assertionUtils.expectAccessibility(button);
		});

		it('should support aria attributes', () => {
			const TestButton = () => {
				return Button({
					'aria-expanded': 'false',
					'aria-haspopup': 'true',
					children: () => 'Dropdown button'
				});
			};

			render(TestButton);

			const button = screen.getByRole('button');
			expect(button).toHaveAttribute('aria-expanded', 'false');
			expect(button).toHaveAttribute('aria-haspopup', 'true');
		});
	});

	describe('Link-specific Features', () => {
		it('should handle external links properly', () => {
			const TestButton = () => {
				return Button({
					href: 'https://example.com',
					target: '_blank',
					rel: 'noopener noreferrer',
					children: () => 'External link'
				});
			};

			render(TestButton);

			const link = screen.getByRole('link');
			expect(link).toHaveAttribute('href', 'https://example.com');
			expect(link).toHaveAttribute('target', '_blank');
			expect(link).toHaveAttribute('rel', 'noopener noreferrer');
		});

		it('should handle internal navigation links', () => {
			const TestButton = () => {
				return Button({
					href: '/internal-page',
					children: () => 'Internal link'
				});
			};

			render(TestButton);

			const link = screen.getByRole('link');
			expect(link).toHaveAttribute('href', '/internal-page');
			expect(link).not.toHaveAttribute('target');
		});

		it('should call onclick for links', async () => {
			const onclick = vi.fn();
			const TestButton = () => {
				return Button({
					href: '/test',
					onclick,
					children: () => 'Clickable link'
				});
			};

			render(TestButton);

			const link = screen.getByRole('link');
			await fireEvent.click(link);

			expect(onclick).toHaveBeenCalledTimes(1);
		});
	});

	describe('Performance', () => {
		it('should render within performance budget', async () => {
			await assertionUtils.expectPerformance(async () => {
				const TestButton = () => {
					return Button({
						children: () => 'Performance test button'
					});
				};
				render(TestButton);
			}, 16); // Should render within 16ms
		});

		it('should handle rapid re-renders efficiently', async () => {
			await assertionUtils.expectPerformance(async () => {
				const TestButton = () => {
					return Button({
						children: () => 'Re-render test'
					});
				};

				const { rerender } = render(TestButton);

				// Rapidly re-render with different props
				for (let i = 0; i < 50; i++) {
					const TestButtonUpdated = () => {
						return Button({
							variant: i % 2 === 0 ? 'default' : 'secondary',
							children: () => `Re-render ${i}`
						});
					};
					rerender(TestButtonUpdated);
				}
			}, 100); // Should complete 50 re-renders within 100ms
		});
	});

	describe('Edge Cases', () => {
		it('should handle undefined onclick gracefully', () => {
			const TestButton = () => {
				return Button({
					onclick: undefined,
					children: () => 'No onclick button'
				});
			};

			expect(() => render(TestButton)).not.toThrow();

			const button = screen.getByRole('button');
			expect(() => fireEvent.click(button)).not.toThrow();
		});

		it('should handle empty href', () => {
			const TestButton = () => {
				return Button({
					href: '',
					children: () => 'Empty href'
				});
			};

			render(TestButton);

			const link = screen.getByRole('link');
			expect(link).toHaveAttribute('href', '');
		});

		it('should handle null children', () => {
			const TestButton = () => {
				return Button({
					children: null
				});
			};

			expect(() => render(TestButton)).not.toThrow();
		});

		it('should handle invalid variant gracefully', () => {
			const TestButton = () => {
				return Button({
					variant: 'invalid' as any,
					children: () => 'Invalid variant'
				});
			};

			// Should fall back to default variant
			expect(() => render(TestButton)).not.toThrow();
		});

		it('should handle very long text content', () => {
			const longText = 'Very long button text that might cause layout issues. '.repeat(50);

			const TestButton = () => {
				return Button({
					children: () => longText
				});
			};

			render(TestButton);

			const button = screen.getByRole('button');
			expect(button).toHaveClass('whitespace-nowrap');
			expect(button).toHaveTextContent(longText);
		});
	});

	describe('Integration with Forms', () => {
		it('should work as submit button in forms', async () => {
			const onSubmit = vi.fn();

			const TestForm = () => {
				return `
					<form onsubmit="${onSubmit}">
						${Button({
							type: 'submit',
							children: () => 'Submit'
						})}
					</form>
				`;
			};

			render(TestForm);

			const submitButton = screen.getByRole('button');
			expect(submitButton).toHaveAttribute('type', 'submit');
		});

		it('should work as reset button in forms', () => {
			const TestForm = () => {
				return `
					<form>
						<input type="text" value="test" />
						${Button({
							type: 'reset',
							children: () => 'Reset'
						})}
					</form>
				`;
			};

			render(TestForm);

			const resetButton = screen.getByRole('button');
			expect(resetButton).toHaveAttribute('type', 'reset');
		});
	});
});
