/**
 * Comprehensive unit tests for SmartPerformanceSelector component
 * Tests CPU detection, performance recommendations, UI interactions, and edge cases
 */

import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import SmartPerformanceSelector from './smart-performance-selector.svelte';
import * as cpuDetection from '$lib/utils/cpu-detection';
import type {
	CPUCapabilities as _CPUCapabilities,
	PerformanceRecommendation as _PerformanceRecommendation
} from '$lib/utils/cpu-detection';
import {
	createMockCapabilities,
	createMockRecommendations,
	cleanupBrowserMocks
} from '@tests/test-utils';

// Mock the CPU detection module
vi.mock('$lib/utils/cpu-detection', () => ({
	detectCPUCapabilities: vi.fn(),
	generatePerformanceRecommendations: vi.fn(),
	getDefaultRecommendation: vi.fn()
}));

// Mock Lucide icons to prevent import issues
vi.mock('lucide-svelte', () => ({
	Loader2: ({ class: className, ..._props }: any) =>
		`<div class="${className || ''}" data-testid="loader2-icon" {..._props}></div>`,
	Cpu: ({ class: className, ..._props }: any) =>
		`<div class="${className || ''}" data-testid="cpu-icon" {..._props}></div>`,
	Battery: ({ class: className, ..._props }: any) =>
		`<div class="${className || ''}" data-testid="battery-icon" {..._props}></div>`,
	Zap: ({ class: className, ..._props }: any) =>
		`<div class="${className || ''}" data-testid="zap-icon" {..._props}></div>`,
	Rocket: ({ class: className, ..._props }: any) =>
		`<div class="${className || ''}" data-testid="rocket-icon" {..._props}></div>`,
	AlertTriangle: ({ class: className, ..._props }: any) =>
		`<div class="${className || ''}" data-testid="alert-triangle-icon" {..._props}></div>`,
	CheckCircle: ({ class: className, ..._props }: any) =>
		`<div class="${className || ''}" data-testid="check-circle-icon" {..._props}></div>`,
	Info: ({ class: className, ..._props }: any) =>
		`<div class="${className || ''}" data-testid="info-icon" {..._props}></div>`
}));

describe('SmartPerformanceSelector', () => {
	let mockOnSelect: MockedFunction<(threadCount: number, mode: string) => void>;
	let mockDetectCPUCapabilities: MockedFunction<typeof cpuDetection.detectCPUCapabilities>;
	let mockGeneratePerformanceRecommendations: MockedFunction<
		typeof cpuDetection.generatePerformanceRecommendations
	>;
	let mockGetDefaultRecommendation: MockedFunction<typeof cpuDetection.getDefaultRecommendation>;

	beforeEach(() => {
		// Reset mocks
		vi.clearAllMocks();

		// Setup mocked functions
		mockOnSelect = vi.fn();
		mockDetectCPUCapabilities = vi.mocked(cpuDetection.detectCPUCapabilities);
		mockGeneratePerformanceRecommendations = vi.mocked(
			cpuDetection.generatePerformanceRecommendations
		);
		mockGetDefaultRecommendation = vi.mocked(cpuDetection.getDefaultRecommendation);

		// Default mock implementations
		const capabilities = createMockCapabilities();
		const recommendations = createMockRecommendations();
		const defaultRecommendation = recommendations[1]; // balanced mode

		mockDetectCPUCapabilities.mockResolvedValue(capabilities);
		mockGeneratePerformanceRecommendations.mockReturnValue(recommendations);
		mockGetDefaultRecommendation.mockReturnValue(defaultRecommendation);
	});

	afterEach(() => {
		cleanupBrowserMocks();
	});

	describe('CPU Detection & Hardware Analysis', () => {
		it('should detect CPU capabilities on mount', async () => {
			render(SmartPerformanceSelector, { onSelect: mockOnSelect });

			expect(screen.getByText('Analyzing Your System')).toBeInTheDocument();
			expect(
				screen.getByText('Detecting CPU capabilities and optimizing settings...')
			).toBeInTheDocument();

			await waitFor(() => {
				expect(mockDetectCPUCapabilities).toHaveBeenCalledOnce();
			});
		});

		it('should display detected hardware information correctly', async () => {
			const capabilities = createMockCapabilities({
				cores: 12,
				estimatedPerformance: 'extreme',
				deviceType: 'desktop',
				memoryGB: 32
			});
			mockDetectCPUCapabilities.mockResolvedValue(capabilities);

			render(SmartPerformanceSelector, { onSelect: mockOnSelect });

			await waitFor(() => {
				expect(screen.getByText('12')).toBeInTheDocument();
				expect(screen.getByText('Extreme')).toBeInTheDocument();
				expect(screen.getByText('Desktop')).toBeInTheDocument();
				expect(screen.getByText('32GB')).toBeInTheDocument();
			});
		});

		it('should classify device types correctly', async () => {
			const testCases = [
				{ deviceType: 'mobile' as const, expected: 'Mobile' },
				{ deviceType: 'tablet' as const, expected: 'Tablet' },
				{ deviceType: 'laptop' as const, expected: 'Laptop' },
				{ deviceType: 'desktop' as const, expected: 'Desktop' }
			];

			for (const testCase of testCases) {
				const capabilities = createMockCapabilities({ deviceType: testCase.deviceType });
				mockDetectCPUCapabilities.mockResolvedValue(capabilities);

				const { unmount } = render(SmartPerformanceSelector, { onSelect: mockOnSelect });

				await waitFor(() => {
					expect(screen.getByText(testCase.expected)).toBeInTheDocument();
				});

				unmount();
			}
		});

		it('should estimate performance class correctly', async () => {
			const testCases = [
				{ estimatedPerformance: 'low' as const, expected: 'Low' },
				{ estimatedPerformance: 'medium' as const, expected: 'Medium' },
				{ estimatedPerformance: 'high' as const, expected: 'High' },
				{ estimatedPerformance: 'extreme' as const, expected: 'Extreme' }
			];

			for (const testCase of testCases) {
				const capabilities = createMockCapabilities({
					estimatedPerformance: testCase.estimatedPerformance
				});
				mockDetectCPUCapabilities.mockResolvedValue(capabilities);

				const { unmount } = render(SmartPerformanceSelector, { onSelect: mockOnSelect });

				await waitFor(() => {
					expect(screen.getByText(testCase.expected)).toBeInTheDocument();
				});

				unmount();
			}
		});

		it('should handle CPU detection failure gracefully', async () => {
			mockDetectCPUCapabilities.mockRejectedValue(new Error('Detection failed'));

			render(SmartPerformanceSelector, { onSelect: mockOnSelect });

			await waitFor(() => {
				expect(screen.getByText('Detection Failed')).toBeInTheDocument();
				expect(
					screen.getByText('Using fallback settings. Advanced features may not be available.')
				).toBeInTheDocument();
			});

			// Should still show fallback recommendations
			expect(screen.getByText('Battery')).toBeInTheDocument();
			expect(screen.getByText('Balanced')).toBeInTheDocument();
			expect(screen.getByText('Performance')).toBeInTheDocument();
		});
	});

	describe('Performance Mode Selection', () => {
		it('should display all performance recommendations', async () => {
			render(SmartPerformanceSelector, { onSelect: mockOnSelect });

			await waitFor(() => {
				expect(screen.getByText('Battery')).toBeInTheDocument();
				expect(screen.getByText('Balanced')).toBeInTheDocument();
				expect(screen.getByText('Performance')).toBeInTheDocument();
			});

			// Check thread counts
			expect(screen.getByText('1 threads')).toBeInTheDocument();
			expect(screen.getByText('6 threads')).toBeInTheDocument();
			expect(screen.getByText('8 threads')).toBeInTheDocument();
		});

		it('should select default recommendation initially', async () => {
			const defaultRecommendation = createMockRecommendations()[1]; // balanced
			mockGetDefaultRecommendation.mockReturnValue(defaultRecommendation);

			render(SmartPerformanceSelector, { onSelect: mockOnSelect });

			await waitFor(() => {
				const balancedButton = screen.getByRole('button', { name: /balanced/i });
				expect(balancedButton).toHaveClass('text-blue-600');
			});
		});

		it('should allow mode selection changes', async () => {
			render(SmartPerformanceSelector, { onSelect: mockOnSelect });

			await waitFor(() => {
				const performanceButton = screen.getByRole('button', { name: /performance/i });
				fireEvent.click(performanceButton);
			});

			// Should update selection visual state
			await waitFor(() => {
				const performanceButton = screen.getByRole('button', { name: /performance/i });
				expect(performanceButton).toHaveClass('text-orange-600');
			});
		});

		it('should show recommended mode indicator', async () => {
			const defaultRecommendation = createMockRecommendations()[1]; // balanced
			mockGetDefaultRecommendation.mockReturnValue(defaultRecommendation);

			render(SmartPerformanceSelector, { onSelect: mockOnSelect });

			await waitFor(() => {
				expect(screen.getByText('Recommended for Your System')).toBeInTheDocument();
				expect(screen.getByText(/Balanced mode/)).toBeInTheDocument();
			});
		});

		it('should display warnings for high-usage modes', async () => {
			render(SmartPerformanceSelector, { onSelect: mockOnSelect });

			await waitFor(() => {
				expect(screen.getByText('High CPU usage')).toBeInTheDocument();
			});
		});

		it('should show battery-optimized recommendation for discharging devices', async () => {
			const capabilities = createMockCapabilities({
				batteryStatus: 'discharging',
				deviceType: 'laptop'
			});
			const batteryRecommendation = createMockRecommendations()[0]; // battery mode

			mockDetectCPUCapabilities.mockResolvedValue(capabilities);
			mockGetDefaultRecommendation.mockReturnValue(batteryRecommendation);

			render(SmartPerformanceSelector, { onSelect: mockOnSelect });

			await waitFor(() => {
				expect(screen.getByText(/optimized for battery life/)).toBeInTheDocument();
			});
		});
	});

	describe('User Interactions', () => {
		it('should call onSelect when Initialize button is clicked', async () => {
			render(SmartPerformanceSelector, { onSelect: mockOnSelect });

			await waitFor(() => {
				const initButton = screen.getByRole('button', { name: /initialize converter/i });
				fireEvent.click(initButton);
			});

			expect(mockOnSelect).toHaveBeenCalledWith(6, 'balanced'); // default balanced mode
		});

		it('should show advanced settings when Advanced button is clicked', async () => {
			render(SmartPerformanceSelector, { onSelect: mockOnSelect });

			await waitFor(() => {
				const advancedButton = screen.getByRole('button', { name: /advanced/i });
				fireEvent.click(advancedButton);
			});

			expect(screen.getByText(/Custom thread count:/)).toBeInTheDocument();
			expect(screen.getByRole('slider')).toBeInTheDocument();
		});

		it('should handle custom thread count selection', async () => {
			render(SmartPerformanceSelector, { onSelect: mockOnSelect });

			// Open advanced settings
			await waitFor(() => {
				const advancedButton = screen.getByRole('button', { name: /advanced/i });
				fireEvent.click(advancedButton);
			});

			// Change slider value
			const slider = screen.getByRole('slider');
			fireEvent.change(slider, { target: { value: '4' } });

			// Initialize with custom value
			const initButton = screen.getByRole('button', { name: /initialize converter/i });
			fireEvent.click(initButton);

			expect(mockOnSelect).toHaveBeenCalledWith(4, 'custom');
		});

		it('should disable controls when disabled prop is true', async () => {
			render(SmartPerformanceSelector, { onSelect: mockOnSelect, disabled: true });

			await waitFor(() => {
				const buttons = screen.getAllByRole('button');
				buttons.forEach((button) => {
					expect(button).toBeDisabled();
				});
			});
		});

		it('should show loading state when isInitializing is true', async () => {
			render(SmartPerformanceSelector, { onSelect: mockOnSelect, isInitializing: true });

			await waitFor(() => {
				expect(screen.getByText('Initializing...')).toBeInTheDocument();

				const initButton = screen.getByRole('button', { name: /initializing/i });
				expect(initButton).toBeDisabled();
			});
		});
	});

	describe('Accessibility', () => {
		it('should have proper ARIA labels and roles', async () => {
			render(SmartPerformanceSelector, { onSelect: mockOnSelect });

			await waitFor(() => {
				// Check for proper button roles
				const buttons = screen.getAllByRole('button');
				expect(buttons.length).toBeGreaterThan(0);

				// Check for slider in advanced mode
				const advancedButton = screen.getByRole('button', { name: /advanced/i });
				fireEvent.click(advancedButton);
			});

			const slider = screen.getByRole('slider');
			expect(slider).toHaveAttribute('id', 'custom-thread-count');

			const label = screen.getByLabelText(/custom thread count/i);
			expect(label).toBeInTheDocument();
		});

		it('should have keyboard navigation support', async () => {
			render(SmartPerformanceSelector, { onSelect: mockOnSelect });

			await waitFor(() => {
				const buttons = screen.getAllByRole('button');
				buttons.forEach((button) => {
					expect(button).not.toHaveAttribute('tabindex', '-1');
				});
			});
		});

		it('should provide meaningful alt text and descriptions', async () => {
			render(SmartPerformanceSelector, { onSelect: mockOnSelect });

			await waitFor(() => {
				// Check for descriptive text content
				expect(screen.getByText(/Analyzing Your System/)).toBeInTheDocument();
				expect(screen.getByText(/CPU Cores/)).toBeInTheDocument();
				expect(screen.getByText(/Performance/)).toBeInTheDocument();
			});
		});
	});

	describe('Edge Cases', () => {
		it('should handle no hardware concurrency detected', async () => {
			Object.defineProperty(window.navigator, 'hardwareConcurrency', {
				value: undefined,
				writable: true
			});

			const capabilities = createMockCapabilities({ cores: 4 }); // fallback value
			mockDetectCPUCapabilities.mockResolvedValue(capabilities);

			render(SmartPerformanceSelector, { onSelect: mockOnSelect });

			await waitFor(() => {
				expect(screen.getByText('4')).toBeInTheDocument(); // Should show fallback cores
			});
		});

		it('should handle single-core scenarios', async () => {
			const capabilities = createMockCapabilities({
				cores: 1,
				estimatedPerformance: 'low',
				isLowEndDevice: true,
				recommendedThreads: 1,
				maxSafeThreads: 1
			});
			const recommendations = [
				{
					mode: 'battery' as const,
					threadCount: 1,
					reasoning: ['Single core optimization'],
					warnings: [],
					estimatedProcessingTime: '5-8 seconds',
					cpuUsageEstimate: 80
				}
			];

			mockDetectCPUCapabilities.mockResolvedValue(capabilities);
			mockGeneratePerformanceRecommendations.mockReturnValue(recommendations);
			mockGetDefaultRecommendation.mockReturnValue(recommendations[0]);

			render(SmartPerformanceSelector, { onSelect: mockOnSelect });

			await waitFor(() => {
				expect(screen.getByText('1')).toBeInTheDocument(); // cores
				expect(screen.getByText('1 threads')).toBeInTheDocument();
			});
		});

		it('should handle very high core count scenarios', async () => {
			const capabilities = createMockCapabilities({
				cores: 32,
				estimatedPerformance: 'extreme',
				recommendedThreads: 12,
				maxSafeThreads: 12
			});

			mockDetectCPUCapabilities.mockResolvedValue(capabilities);

			render(SmartPerformanceSelector, { onSelect: mockOnSelect });

			await waitFor(() => {
				expect(screen.getByText('32')).toBeInTheDocument(); // cores
				expect(screen.getByText('Extreme')).toBeInTheDocument(); // performance
			});
		});

		it('should handle mobile device detection accurately', async () => {
			Object.defineProperty(window.navigator, 'userAgent', {
				value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
				writable: true
			});

			const capabilities = createMockCapabilities({
				deviceType: 'mobile',
				cores: 6,
				estimatedPerformance: 'medium',
				isLowEndDevice: true,
				recommendedThreads: 2,
				maxSafeThreads: 4
			});

			mockDetectCPUCapabilities.mockResolvedValue(capabilities);

			render(SmartPerformanceSelector, { onSelect: mockOnSelect });

			await waitFor(() => {
				expect(screen.getByText('Mobile')).toBeInTheDocument();
				expect(screen.getByText('Medium')).toBeInTheDocument();
			});
		});

		it('should handle missing feature support gracefully', async () => {
			const capabilities = createMockCapabilities({
				features: {
					webgl: false,
					webgl2: false,
					simd: false,
					threading: false,
					sharedArrayBuffer: false
				}
			});

			mockDetectCPUCapabilities.mockResolvedValue(capabilities);

			render(SmartPerformanceSelector, { onSelect: mockOnSelect });

			// Open advanced settings to see feature support
			await waitFor(() => {
				const advancedButton = screen.getByRole('button', { name: /advanced/i });
				fireEvent.click(advancedButton);
			});

			expect(screen.getByText('Single-threaded only')).toBeInTheDocument();
			expect(screen.getByText('Basic processing')).toBeInTheDocument();
		});

		it('should handle battery API unavailability', async () => {
			const capabilities = createMockCapabilities({
				batteryStatus: 'unknown'
			});

			mockDetectCPUCapabilities.mockResolvedValue(capabilities);

			render(SmartPerformanceSelector, { onSelect: mockOnSelect });

			await waitFor(() => {
				// Should not crash and should still show recommendations
				expect(screen.getByText('Battery')).toBeInTheDocument();
				expect(screen.getByText('Balanced')).toBeInTheDocument();
			});
		});

		it('should recover from async errors during detection', async () => {
			mockDetectCPUCapabilities.mockRejectedValue(new Error('Network timeout'));

			render(SmartPerformanceSelector, { onSelect: mockOnSelect });

			await waitFor(() => {
				expect(screen.getByText('Detection Failed')).toBeInTheDocument();
			});

			// Should still be functional with fallback
			const initButton = screen.getByRole('button', { name: /initialize converter/i });
			fireEvent.click(initButton);

			expect(mockOnSelect).toHaveBeenCalled();
		});
	});

	describe('SvelteKit 5 Specific Features', () => {
		it('should handle reactive state updates correctly', async () => {
			render(SmartPerformanceSelector, { onSelect: mockOnSelect });

			await waitFor(() => {
				// Test mode selection reactivity
				const performanceButton = screen.getByRole('button', { name: /performance/i });
				fireEvent.click(performanceButton);
			});

			// Should update current selection summary
			await waitFor(() => {
				expect(screen.getByText(/Selected: Performance mode/)).toBeInTheDocument();
			});
		});

		it('should handle derived state computations', async () => {
			render(SmartPerformanceSelector, { onSelect: mockOnSelect });

			await waitFor(() => {
				// Should show computed selection summary
				expect(screen.getByText(/Selected: Balanced mode with 6 threads/)).toBeInTheDocument();
				expect(screen.getByText(/Expected: 1-2 seconds processing time/)).toBeInTheDocument();
			});
		});

		it('should handle effects and lifecycle correctly', async () => {
			const { unmount } = render(SmartPerformanceSelector, { onSelect: mockOnSelect });

			// Should call detection on mount
			await waitFor(() => {
				expect(mockDetectCPUCapabilities).toHaveBeenCalledOnce();
			});

			// Cleanup should not cause errors
			unmount();
		});
	});

	describe('Performance and Integration', () => {
		it('should not cause memory leaks during rapid re-renders', async () => {
			vi.useFakeTimers();

			for (let i = 0; i < 10; i++) {
				const { unmount } = render(SmartPerformanceSelector, { onSelect: mockOnSelect });
				await waitFor(() => {
					expect(mockDetectCPUCapabilities).toHaveBeenCalled();
				});
				unmount();
			}

			// Should not accumulate event listeners or timers
			expect(vi.getTimerCount()).toBe(0);

			vi.useRealTimers();
		});

		it('should handle rapid user interactions without errors', async () => {
			render(SmartPerformanceSelector, { onSelect: mockOnSelect });

			await waitFor(() => {
				const buttons = screen
					.getAllByRole('button')
					.filter(
						(btn) =>
							btn.textContent?.includes('Battery') ||
							btn.textContent?.includes('Balanced') ||
							btn.textContent?.includes('Performance')
					);

				// Rapidly click between modes
				buttons.forEach((button) => {
					fireEvent.click(button);
				});
			});

			// Should not crash or produce errors
			expect(mockOnSelect).not.toHaveBeenCalled(); // Only called on Initialize
		});

		it('should have fast initialization times', async () => {
			const startTime = performance.now();

			render(SmartPerformanceSelector, { onSelect: mockOnSelect });

			await waitFor(() => {
				expect(mockDetectCPUCapabilities).toHaveBeenCalled();
			});

			const endTime = performance.now();
			const initTime = endTime - startTime;

			// Should initialize quickly (allowing for test overhead)
			expect(initTime).toBeLessThan(100);
		});
	});
});
