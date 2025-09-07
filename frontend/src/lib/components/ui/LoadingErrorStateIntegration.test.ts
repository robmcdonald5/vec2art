/**
 * Unit tests for LoadingState and ErrorState component integration
 * Tests the basic rendering and functionality of these components
 */

import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import LoadingState from '$lib/components/ui/LoadingState.svelte';
import ErrorState from '$lib/components/ui/ErrorState.svelte';

describe('LoadingState Component', () => {
	it('renders loading state with default message', () => {
		render(LoadingState);
		
		expect(screen.getByText('Loading...')).toBeInTheDocument();
		expect(screen.getByRole('status')).toBeInTheDocument();
	});

	it('renders with custom message', () => {
		const customMessage = 'Converting image to vector format...';
		render(LoadingState, {
			props: {
				message: customMessage
			}
		});
		
		expect(screen.getByText(customMessage)).toBeInTheDocument();
	});

	it('renders in different sizes', () => {
		render(LoadingState, {
			props: {
				message: 'Processing...',
				size: 'lg'
			}
		});
		
		expect(screen.getByText('Processing...')).toBeInTheDocument();
		expect(screen.getByText('Please wait while we process your request')).toBeInTheDocument();
	});

	it('renders inline when specified', () => {
		render(LoadingState, {
			props: {
				message: 'Loading...',
				inline: true
			}
		});
		
		const statusElement = screen.getByRole('status');
		// Check that the element has inline styling (either inline-flex class or style attribute)
		const hasInlineClass = statusElement.className.includes('inline-flex') || 
							   statusElement.className.includes('inline');
		expect(hasInlineClass).toBe(true);
	});
});

describe('ErrorState Component', () => {
	it('renders error state with message', () => {
		const errorMessage = 'Failed to process image';
		render(ErrorState, {
			props: {
				message: errorMessage,
				title: 'Processing Error'
			}
		});
		
		expect(screen.getByText('Processing Error')).toBeInTheDocument();
		expect(screen.getByText(errorMessage)).toBeInTheDocument();
	});

	it('renders with default title', () => {
		const errorMessage = 'Something went wrong';
		render(ErrorState, {
			props: {
				message: errorMessage
			}
		});
		
		expect(screen.getByText('Error')).toBeInTheDocument();
		expect(screen.getByText(errorMessage)).toBeInTheDocument();
	});

	it('renders with retry button when showRetry is true', () => {
		const mockRetry = vi.fn();
		render(ErrorState, {
			props: {
				message: 'Test error',
				showRetry: true,
				onRetry: mockRetry
			}
		});
		
		const retryButton = screen.getByRole('button', { name: /retry|try again/i });
		expect(retryButton).toBeInTheDocument();
	});

	it('renders with reload button when showReload is true', () => {
		const mockReload = vi.fn();
		render(ErrorState, {
			props: {
				message: 'Test error',
				showReload: true,
				onReload: mockReload
			}
		});
		
		const reloadButton = screen.getByRole('button', { name: /reload/i });
		expect(reloadButton).toBeInTheDocument();
	});

	it('renders in large size with centered layout', () => {
		render(ErrorState, {
			props: {
				message: 'Test error',
				title: 'Error',
				size: 'lg'
			}
		});
		
		const alertElement = screen.getByRole('alert');
		// Check for centered layout (text-center class or flex-col layout)
		const hasCenteredClass = alertElement.className.includes('text-center') || 
								 alertElement.className.includes('flex-col');
		expect(hasCenteredClass).toBe(true);
	});

	it('has proper accessibility attributes', () => {
		const errorMessage = 'Test error message';
		render(ErrorState, {
			props: {
				message: errorMessage
			}
		});
		
		const alertElement = screen.getByRole('alert');
		expect(alertElement).toHaveAttribute('aria-label', `Error: ${errorMessage}`);
	});
});

describe('LoadingState and ErrorState Integration', () => {
	it('both components have proper ARIA roles', () => {
		const { unmount } = render(LoadingState, {
			props: {
				message: 'Processing...'
			}
		});
		
		expect(screen.getByRole('status')).toBeInTheDocument();
		
		unmount();
		
		render(ErrorState, {
			props: {
				message: 'Processing failed'
			}
		});
		
		expect(screen.getByRole('alert')).toBeInTheDocument();
	});

	it('components can be styled consistently with size props', () => {
		const { unmount } = render(LoadingState, {
			props: {
				message: 'Loading...',
				size: 'sm'
			}
		});
		
		let statusElement = screen.getByRole('status');
		expect(statusElement.querySelector('.h-4')).toBeInTheDocument(); // Small icon
		
		unmount();
		
		render(ErrorState, {
			props: {
				message: 'Error occurred',
				size: 'sm'
			}
		});
		
		let alertElement = screen.getByRole('alert');
		expect(alertElement.querySelector('.h-4')).toBeInTheDocument(); // Small icon
	});
});