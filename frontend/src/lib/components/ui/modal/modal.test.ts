/**
 * @file modal.test.ts
 * Comprehensive tests for Modal component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/svelte';
import Modal from './modal.svelte';
import {
	interactionTestUtils,
	assertionUtils,
	setupBrowserMocks,
	cleanupBrowserMocks
} from '@tests/test-utils';

describe('Modal Component', () => {
	beforeEach(() => {
		setupBrowserMocks();
		vi.clearAllMocks();
		// Mock scrollbar locking
		Object.defineProperty(document.body.style, 'overflow', {
			value: '',
			writable: true
		});
	});

	afterEach(() => {
		cleanup();
		cleanupBrowserMocks();
	});

	describe('Basic Rendering', () => {
		it('should not render when open is false', () => {
			const onClose = vi.fn();
			render(Modal, {
				props: {
					open: false,
					onClose
				}
			});

			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});

		it('should render when open is true', () => {
			const onClose = vi.fn();
			render(Modal, {
				props: {
					open: true,
					onClose
				}
			});

			expect(screen.getByRole('dialog')).toBeInTheDocument();
		});

		it('should render with title and description', () => {
			const onClose = vi.fn();
			render(Modal, {
				props: {
					open: true,
					onClose,
					title: 'Test Modal',
					description: 'This is a test modal description'
				}
			});

			expect(screen.getByText('Test Modal')).toBeInTheDocument();
			expect(screen.getByText('This is a test modal description')).toBeInTheDocument();
		});

		it('should render children content', () => {
			const onClose = vi.fn();
			const { container } = render(Modal, {
				props: {
					open: true,
					onClose,
					children: () => 'Test modal content'
				}
			});

			expect(screen.getByText('Test modal content')).toBeInTheDocument();
		});

		it('should apply custom CSS classes', () => {
			const onClose = vi.fn();
			render(Modal, {
				props: {
					open: true,
					onClose,
					class: 'custom-modal-class'
				}
			});

			const modalContent = document.querySelector('.custom-modal-class');
			expect(modalContent).toBeInTheDocument();
		});
	});

	describe('Close Functionality', () => {
		it('should call onClose when close button is clicked', async () => {
			const onClose = vi.fn();
			render(Modal, {
				props: {
					open: true,
					onClose
				}
			});

			const closeButton = screen.getByRole('button', { name: /close modal/i });
			await fireEvent.click(closeButton);

			expect(onClose).toHaveBeenCalledTimes(1);
		});

		it('should call onClose when Escape key is pressed', async () => {
			const onClose = vi.fn();
			render(Modal, {
				props: {
					open: true,
					onClose
				}
			});

			await interactionTestUtils.pressKey(document.body, 'Escape');

			expect(onClose).toHaveBeenCalledTimes(1);
		});

		it('should call onClose when backdrop is clicked', async () => {
			const onClose = vi.fn();
			render(Modal, {
				props: {
					open: true,
					onClose
				}
			});

			const backdrop = screen.getByRole('dialog');
			await fireEvent.click(backdrop);

			expect(onClose).toHaveBeenCalledTimes(1);
		});

		it('should not call onClose when modal content is clicked', async () => {
			const onClose = vi.fn();
			render(Modal, {
				props: {
					open: true,
					onClose,
					title: 'Test Modal'
				}
			});

			const modalContent = screen.getByText('Test Modal');
			await fireEvent.click(modalContent);

			expect(onClose).not.toHaveBeenCalled();
		});
	});

	describe('Focus Management', () => {
		it('should focus the modal when opened', async () => {
			const onClose = vi.fn();

			// Create a focusable element before the modal
			const button = document.createElement('button');
			button.textContent = 'Initial Focus';
			document.body.appendChild(button);
			button.focus();

			render(Modal, {
				props: {
					open: true,
					onClose
				}
			});

			await waitFor(() => {
				const dialog = screen.getByRole('dialog');
				expect(dialog).toHaveFocus();
			});

			document.body.removeChild(button);
		});

		it('should restore focus when modal is closed', async () => {
			const onClose = vi.fn();

			// Create a focusable element
			const button = document.createElement('button');
			button.textContent = 'Initial Focus';
			button.id = 'initial-focus';
			document.body.appendChild(button);
			button.focus();

			const { rerender } = render(Modal, {
				props: {
					open: false,
					onClose
				}
			});

			// Open modal
			rerender({
				open: true,
				onClose
			});

			await waitFor(() => {
				const dialog = screen.getByRole('dialog');
				expect(dialog).toBeInTheDocument();
			});

			// Close modal
			rerender({
				open: false,
				onClose
			});

			await waitFor(() => {
				expect(button).toHaveFocus();
			});

			document.body.removeChild(button);
		});

		it('should trap focus within modal', async () => {
			const onClose = vi.fn();

			render(Modal, {
				props: {
					open: true,
					onClose,
					children: () => `
						<input type="text" data-testid="first-input" />
						<button data-testid="middle-button">Middle</button>
						<input type="text" data-testid="last-input" />
					`
				}
			});

			const closeButton = screen.getByRole('button', { name: /close modal/i });
			const firstInput = screen.getByTestId('first-input');
			const lastInput = screen.getByTestId('last-input');

			// Focus should start at close button (first focusable)
			await waitFor(() => {
				expect(closeButton).toHaveFocus();
			});

			// Tab to last element, then tab again should cycle to first
			lastInput.focus();
			await interactionTestUtils.pressKey(lastInput, 'Tab');

			await waitFor(() => {
				expect(closeButton).toHaveFocus();
			});

			// Shift+Tab from first should go to last
			await interactionTestUtils.pressKey(closeButton, 'Tab', { shiftKey: true });

			await waitFor(() => {
				expect(lastInput).toHaveFocus();
			});
		});
	});

	describe('Accessibility Features', () => {
		it('should have proper ARIA attributes', () => {
			const onClose = vi.fn();
			render(Modal, {
				props: {
					open: true,
					onClose,
					title: 'Test Modal',
					description: 'Test description'
				}
			});

			const dialog = screen.getByRole('dialog');

			expect(dialog).toHaveAttribute('aria-modal', 'true');
			expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
			expect(dialog).toHaveAttribute('aria-describedby', 'modal-description');
			expect(dialog).toHaveAttribute('tabindex', '-1');
		});

		it('should not have aria-labelledby when no title provided', () => {
			const onClose = vi.fn();
			render(Modal, {
				props: {
					open: true,
					onClose
				}
			});

			const dialog = screen.getByRole('dialog');
			expect(dialog).not.toHaveAttribute('aria-labelledby');
		});

		it('should not have aria-describedby when no description provided', () => {
			const onClose = vi.fn();
			render(Modal, {
				props: {
					open: true,
					onClose,
					title: 'Test Modal'
				}
			});

			const dialog = screen.getByRole('dialog');
			expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
			expect(dialog).not.toHaveAttribute('aria-describedby');
		});

		it('should have proper heading hierarchy', () => {
			const onClose = vi.fn();
			render(Modal, {
				props: {
					open: true,
					onClose,
					title: 'Test Modal'
				}
			});

			const heading = screen.getByRole('heading', { level: 2 });
			expect(heading).toHaveTextContent('Test Modal');
			expect(heading).toHaveAttribute('id', 'modal-title');
		});

		it('should hide backdrop from assistive technology', () => {
			const onClose = vi.fn();
			render(Modal, {
				props: {
					open: true,
					onClose
				}
			});

			const backdrop = document.querySelector('.bg-black\\/80');
			expect(backdrop).toHaveAttribute('aria-hidden', 'true');
		});

		it('should have accessible close button', () => {
			const onClose = vi.fn();
			render(Modal, {
				props: {
					open: true,
					onClose
				}
			});

			const closeButton = screen.getByRole('button', { name: /close modal/i });
			expect(closeButton).toHaveAttribute('aria-label', 'Close modal');

			const icon = closeButton.querySelector('svg');
			expect(icon).toHaveAttribute('aria-hidden', 'true');
		});

		it('should pass basic accessibility check', async () => {
			const onClose = vi.fn();
			render(Modal, {
				props: {
					open: true,
					onClose,
					title: 'Accessible Modal'
				}
			});

			const dialog = screen.getByRole('dialog');
			await assertionUtils.expectAccessibility(dialog);
		});
	});

	describe('Keyboard Navigation', () => {
		it('should handle Tab navigation correctly', async () => {
			const onClose = vi.fn();

			render(Modal, {
				props: {
					open: true,
					onClose,
					children: () => `
						<button data-testid="button1">Button 1</button>
						<input data-testid="input1" type="text" />
						<button data-testid="button2">Button 2</button>
					`
				}
			});

			const closeButton = screen.getByRole('button', { name: /close modal/i });
			const button1 = screen.getByTestId('button1');
			const input1 = screen.getByTestId('input1');
			const button2 = screen.getByTestId('button2');

			// Start at close button
			await waitFor(() => {
				expect(closeButton).toHaveFocus();
			});

			// Tab through elements
			await interactionTestUtils.pressKey(closeButton, 'Tab');
			expect(button1).toHaveFocus();

			await interactionTestUtils.pressKey(button1, 'Tab');
			expect(input1).toHaveFocus();

			await interactionTestUtils.pressKey(input1, 'Tab');
			expect(button2).toHaveFocus();

			// Tab from last element should cycle to first
			await interactionTestUtils.pressKey(button2, 'Tab');
			expect(closeButton).toHaveFocus();
		});

		it('should handle Shift+Tab navigation correctly', async () => {
			const onClose = vi.fn();

			render(Modal, {
				props: {
					open: true,
					onClose,
					children: () => `
						<button data-testid="button1">Button 1</button>
						<button data-testid="button2">Button 2</button>
					`
				}
			});

			const closeButton = screen.getByRole('button', { name: /close modal/i });
			const button2 = screen.getByTestId('button2');

			// Start at close button (first element)
			await waitFor(() => {
				expect(closeButton).toHaveFocus();
			});

			// Shift+Tab should go to last element
			await interactionTestUtils.pressKey(closeButton, 'Tab', { shiftKey: true });
			expect(button2).toHaveFocus();
		});

		it('should not interfere with other key events', async () => {
			const onClose = vi.fn();
			render(Modal, {
				props: {
					open: true,
					onClose
				}
			});

			// Press a key that shouldn't trigger close
			await interactionTestUtils.pressKey(document.body, 'Enter');
			expect(onClose).not.toHaveBeenCalled();

			await interactionTestUtils.pressKey(document.body, 'Space');
			expect(onClose).not.toHaveBeenCalled();

			await interactionTestUtils.pressKey(document.body, 'ArrowDown');
			expect(onClose).not.toHaveBeenCalled();
		});
	});

	describe('Visual Effects and Styling', () => {
		it('should have proper CSS classes for modal structure', () => {
			const onClose = vi.fn();
			render(Modal, {
				props: {
					open: true,
					onClose
				}
			});

			const dialog = screen.getByRole('dialog');
			expect(dialog).toHaveClass(
				'fixed',
				'inset-0',
				'z-50',
				'flex',
				'items-center',
				'justify-center'
			);

			const content = dialog.querySelector('.relative');
			expect(content).toHaveClass('w-full', 'max-w-6xl', 'max-h-[90vh]', 'bg-white', 'rounded-2xl');
		});

		it('should position close button correctly', () => {
			const onClose = vi.fn();
			render(Modal, {
				props: {
					open: true,
					onClose
				}
			});

			const closeButton = screen.getByRole('button', { name: /close modal/i });
			expect(closeButton).toHaveClass('absolute', 'top-4', 'right-4', 'z-10');
		});

		it('should render header when title is provided', () => {
			const onClose = vi.fn();
			render(Modal, {
				props: {
					open: true,
					onClose,
					title: 'Modal Title'
				}
			});

			const header = document.querySelector('header');
			expect(header).toBeInTheDocument();
			expect(header).toHaveClass('px-6', 'py-4', 'border-b');
		});

		it('should not render header when title is not provided', () => {
			const onClose = vi.fn();
			render(Modal, {
				props: {
					open: true,
					onClose
				}
			});

			const header = document.querySelector('header');
			expect(header).not.toBeInTheDocument();
		});
	});

	describe('Event Handling', () => {
		it('should handle multiple rapid close attempts', async () => {
			const onClose = vi.fn();
			render(Modal, {
				props: {
					open: true,
					onClose
				}
			});

			const closeButton = screen.getByRole('button', { name: /close modal/i });

			// Rapidly click close button multiple times
			await fireEvent.click(closeButton);
			await fireEvent.click(closeButton);
			await fireEvent.click(closeButton);

			// Should still only be called once per click
			expect(onClose).toHaveBeenCalledTimes(3);
		});

		it('should handle simultaneous keyboard and click events', async () => {
			const onClose = vi.fn();
			render(Modal, {
				props: {
					open: true,
					onClose
				}
			});

			const closeButton = screen.getByRole('button', { name: /close modal/i });

			// Trigger both events simultaneously
			await Promise.all([
				interactionTestUtils.pressKey(document.body, 'Escape'),
				fireEvent.click(closeButton)
			]);

			expect(onClose).toHaveBeenCalledTimes(2);
		});

		it('should prevent event bubbling on content clicks', async () => {
			const onClose = vi.fn();

			render(Modal, {
				props: {
					open: true,
					onClose,
					children: () => `<button data-testid="inner-button">Inner Button</button>`
				}
			});

			const innerButton = screen.getByTestId('inner-button');
			await fireEvent.click(innerButton);

			// Should not close modal when clicking inside content
			expect(onClose).not.toHaveBeenCalled();
		});
	});

	describe('Performance', () => {
		it('should render within performance budget', async () => {
			const onClose = vi.fn();

			await assertionUtils.expectPerformance(async () => {
				render(Modal, {
					props: {
						open: true,
						onClose,
						title: 'Performance Test'
					}
				});
			}, 32); // Should render within 32ms (2 frames)
		});

		it('should handle rapid open/close cycles efficiently', async () => {
			const onClose = vi.fn();

			await assertionUtils.expectPerformance(async () => {
				const { rerender } = render(Modal, {
					props: {
						open: false,
						onClose
					}
				});

				// Rapidly toggle modal 20 times
				for (let i = 0; i < 20; i++) {
					rerender({ open: true, onClose });
					rerender({ open: false, onClose });
				}
			}, 100); // Should complete within 100ms
		});
	});

	describe('Edge Cases', () => {
		it('should handle missing onClose callback gracefully', () => {
			expect(() => {
				render(Modal, {
					props: {
						open: true,
						onClose: undefined as any
					}
				});
			}).not.toThrow();
		});

		it('should handle null children gracefully', () => {
			const onClose = vi.fn();

			expect(() => {
				render(Modal, {
					props: {
						open: true,
						onClose,
						children: null
					}
				});
			}).not.toThrow();
		});

		it('should handle modal opening with no focusable elements', async () => {
			const onClose = vi.fn();

			expect(() => {
				render(Modal, {
					props: {
						open: true,
						onClose,
						children: () => `<div>No focusable content</div>`
					}
				});
			}).not.toThrow();

			// Should still focus the dialog itself
			await waitFor(() => {
				const dialog = screen.getByRole('dialog');
				expect(dialog).toHaveFocus();
			});
		});

		it('should handle very long content with scrolling', () => {
			const onClose = vi.fn();
			const longContent = 'Very long content. '.repeat(1000);

			render(Modal, {
				props: {
					open: true,
					onClose,
					children: () => `<div>${longContent}</div>`
				}
			});

			const contentArea = document.querySelector('[role="document"]');
			expect(contentArea).toHaveClass('overflow-auto');
		});
	});
});
