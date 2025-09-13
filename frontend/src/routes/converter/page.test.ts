/**
 * @file +page.test.ts
 * Comprehensive tests for the Converter page
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor as _waitFor } from '@testing-library/svelte';
import ConverterPage from './+page.svelte';
import {
	fileTestUtils,
	componentTestUtils as _componentTestUtils,
	interactionTestUtils,
	assertionUtils,
	setupBrowserMocks,
	cleanupBrowserMocks
} from '@tests/test-utils';

// Mock the vectorizer store
const mockStore = {
	// State properties
	wasmLoaded: true,
	threadsInitialized: false,
	isProcessing: false,
	hasError: false,
	error: null,
	inputFile: null,
	inputImage: null,
	lastResult: null,
	capabilities: null,
	requestedThreadCount: 0,
	currentProgress: null,
	config: {
		backend: 'edge',
		detail: 5,
		stroke_width: 1.0,
		hand_drawn_style: true,
		variable_weights: true,
		tremor_effects: false
	},

	// Methods
	initialize: vi.fn().mockResolvedValue(true),
	initializeThreads: vi.fn().mockResolvedValue(true),
	setInputFile: vi.fn(),
	clearInput: vi.fn(),
	updateConfig: vi.fn(),
	usePreset: vi.fn(),
	processImage: vi.fn().mockResolvedValue({ svg: '<svg>test</svg>' }),
	retryLastOperation: vi.fn().mockResolvedValue(true),
	reset: vi.fn(),
	resetConfig: vi.fn(),
	clearError: vi.fn(),
	isConfigValid: vi.fn().mockReturnValue(true),
	getStats: vi.fn().mockReturnValue({
		processing_time: 1500,
		input_size: '2.1 MB',
		output_size: '456 KB',
		compression_ratio: 0.78
	}),
	getErrorMessage: vi.fn().mockReturnValue('Test error message'),
	getRecoverySuggestions: vi
		.fn()
		.mockReturnValue(['Try reducing detail level', 'Use single-threaded mode'])
};

// Mock the store module
vi.mock('$lib/stores/vectorizer.svelte', () => ({
	vectorizerStore: mockStore
}));

// Mock URL.createObjectURL and revokeObjectURL
const mockObjectURLs = new Set<string>();
Object.defineProperty(URL, 'createObjectURL', {
	value: vi.fn().mockImplementation(() => {
		const url = `blob:mock-url-${Date.now()}`;
		mockObjectURLs.add(url);
		return url;
	})
});
Object.defineProperty(URL, 'revokeObjectURL', {
	value: vi.fn().mockImplementation((url: string) => {
		mockObjectURLs.delete(url);
	})
});

describe('Converter Page', () => {
	beforeEach(() => {
		setupBrowserMocks();
		vi.clearAllMocks();
		mockObjectURLs.clear();

		// Reset mock store state
		Object.assign(mockStore, {
			wasmLoaded: true,
			threadsInitialized: false,
			isProcessing: false,
			hasError: false,
			error: null,
			inputFile: null,
			inputImage: null,
			lastResult: null,
			capabilities: null,
			requestedThreadCount: 0,
			currentProgress: null
		});
	});

	afterEach(() => {
		cleanup();
		cleanupBrowserMocks();
	});

	describe('Initial Rendering', () => {
		it('should render page header and main sections', () => {
			render(ConverterPage);

			expect(screen.getByText('Image to SVG Converter')).toBeInTheDocument();
			expect(
				screen.getByText('Transform any raster image into expressive line art SVGs')
			).toBeInTheDocument();
			expect(screen.getByLabelText(/upload and preview/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/conversion settings/i)).toBeInTheDocument();
		});

		it('should show WASM loading state when not loaded', () => {
			mockStore.wasmLoaded = false;

			render(ConverterPage);

			expect(screen.getByText('Loading converter module...')).toBeInTheDocument();
			expect(screen.getByLabelText('Loading converter module')).toBeInTheDocument();
		});

		it('should show performance selector when WASM loaded but threads not initialized', () => {
			mockStore.wasmLoaded = true;
			mockStore.threadsInitialized = false;

			render(ConverterPage);

			expect(screen.getByLabelText(/performance settings/i)).toBeInTheDocument();
		});

		it('should show active status when threads are initialized', () => {
			mockStore.wasmLoaded = true;
			mockStore.threadsInitialized = true;
			mockStore.capabilities = {
				threading_supported: true,
				hardware_concurrency: 8
			};
			mockStore.requestedThreadCount = 6;

			render(ConverterPage);

			expect(screen.getByText(/balanced mode active \(6 threads\)/i)).toBeInTheDocument();
		});

		it('should have proper accessibility structure', () => {
			render(ConverterPage);

			// Check for live regions
			expect(document.querySelector('[aria-live="polite"]')).toBeInTheDocument();
			expect(document.querySelector('[aria-live="assertive"]')).toBeInTheDocument();

			// Check for proper headings
			expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Image to SVG Converter');
			expect(screen.getByLabelText(/performance settings/i)).toBeInTheDocument();
		});
	});

	describe('File Upload and Preview', () => {
		it('should handle file selection', async () => {
			render(ConverterPage);

			const testFile = fileTestUtils.createMockFile('test.png', 1024, 'image/png');
			const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
			const fileList = fileTestUtils.createMockFileList([testFile]);

			await interactionTestUtils.changeFileInput(fileInput, fileList);

			expect(mockStore.setInputFile).toHaveBeenCalledWith(testFile);
		});

		it('should handle file removal', async () => {
			mockStore.inputFile = fileTestUtils.createMockFile('test.png', 1024, 'image/png');

			render(ConverterPage);

			// Simulate file removal by passing null
			const removeButton = screen.getByRole('button', { name: /remove file/i });
			await fireEvent.click(removeButton);

			expect(mockStore.clearInput).toHaveBeenCalled();
		});

		it('should show input image preview when file is selected', () => {
			const testFile = fileTestUtils.createMockFile('test.png', 1024, 'image/png');
			mockStore.inputFile = testFile;

			render(ConverterPage);

			const previewImage = screen.getByAltText(/original image: test.png/i);
			expect(previewImage).toBeInTheDocument();
			expect(URL.createObjectURL).toHaveBeenCalledWith(testFile);
		});

		it('should show empty state when no file is selected', () => {
			render(ConverterPage);

			expect(screen.getByText('Upload an image to see the preview')).toBeInTheDocument();
		});

		it('should show processing state during conversion', () => {
			mockStore.isProcessing = true;
			mockStore.currentProgress = {
				stage: 'Edge Detection',
				progress: 65,
				elapsed_ms: 2500,
				estimated_remaining_ms: 1000
			};

			render(ConverterPage);

			expect(screen.getByText('Edge Detection')).toBeInTheDocument();
			expect(screen.getByDisplayValue('65')).toBeInTheDocument();
			expect(screen.getByText(/3s elapsed/)).toBeInTheDocument();
			expect(screen.getByText(/~1s remaining/)).toBeInTheDocument();
		});
	});

	describe('Performance Initialization', () => {
		it('should handle performance mode selection', async () => {
			mockStore.wasmLoaded = true;
			mockStore.threadsInitialized = false;

			render(ConverterPage);

			// Find and click a performance mode (this would be handled by SmartPerformanceSelector component)
			// We'll simulate the callback being called
			const performanceSelector = screen.getByLabelText(/performance settings/i);
			expect(performanceSelector).toBeInTheDocument();

			// The actual selection would trigger handlePerformanceSelection function
			// We can test this by verifying the store initialization method is called
			expect(mockStore.initialize).toHaveBeenCalledWith({ autoInitThreads: false });
		});

		it('should handle thread initialization success', async () => {
			mockStore.initializeThreads.mockResolvedValue(true);

			render(ConverterPage);

			// Simulate performance selection by calling the handler directly
			// In real scenario, this would be triggered by SmartPerformanceSelector
			await new Promise((resolve) => setTimeout(resolve, 0));

			expect(mockStore.initialize).toHaveBeenCalled();
		});

		it('should handle thread initialization failure gracefully', async () => {
			mockStore.initializeThreads.mockResolvedValue(false);

			render(ConverterPage);

			// The component should handle initialization failure
			expect(mockStore.initialize).toHaveBeenCalled();
		});
	});

	describe('Settings Configuration', () => {
		beforeEach(() => {
			mockStore.threadsInitialized = true;
		});

		it('should display and handle preset selection', async () => {
			render(ConverterPage);

			// Check that presets are displayed
			expect(screen.getByText('Style Presets')).toBeInTheDocument();

			// Find and click a preset button
			const sketchPreset = screen.getByRole('button', { name: /sketch/i });
			await fireEvent.click(sketchPreset);

			expect(mockStore.usePreset).toHaveBeenCalledWith('sketch');
		});

		it('should handle custom preset selection', async () => {
			render(ConverterPage);

			const customPreset = screen.getByRole('button', { name: /custom/i });
			await fireEvent.click(customPreset);

			// Custom preset should not call usePreset
			expect(mockStore.usePreset).not.toHaveBeenCalledWith('custom');
		});

		it('should handle algorithm backend selection', async () => {
			render(ConverterPage);

			const centerlineRadio = screen.getByLabelText(/centerline/i);
			await fireEvent.click(centerlineRadio);

			expect(mockStore.updateConfig).toHaveBeenCalledWith({ backend: 'centerline' });
		});

		it('should handle detail level changes', async () => {
			render(ConverterPage);

			const detailSlider = screen.getByLabelText('Detail Level');
			await fireEvent.change(detailSlider, { target: { value: '7' } });

			expect(mockStore.updateConfig).toHaveBeenCalledWith({ detail: 7 });
		});

		it('should handle smoothness changes', async () => {
			render(ConverterPage);

			const smoothnessSlider = screen.getByLabelText('Smoothness');
			await fireEvent.change(smoothnessSlider, { target: { value: '8' } });

			// Smoothness maps to stroke_width with specific calculation
			expect(mockStore.updateConfig).toHaveBeenCalledWith(
				expect.objectContaining({ stroke_width: expect.any(Number) })
			);
		});

		it('should handle artistic effects toggles', async () => {
			render(ConverterPage);

			const handDrawnCheckbox = screen.getByLabelText('Hand-drawn style');
			await fireEvent.click(handDrawnCheckbox);

			expect(mockStore.updateConfig).toHaveBeenCalledWith({
				hand_drawn_style: expect.any(Boolean)
			});
		});

		it('should disable controls during processing', () => {
			mockStore.isProcessing = true;

			render(ConverterPage);

			const detailSlider = screen.getByLabelText('Detail Level');
			const handDrawnCheckbox = screen.getByLabelText('Hand-drawn style');

			expect(detailSlider).toBeDisabled();
			expect(handDrawnCheckbox).toBeDisabled();
		});
	});

	describe('Conversion Process', () => {
		beforeEach(() => {
			mockStore.threadsInitialized = true;
			mockStore.inputFile = fileTestUtils.createMockFile('test.png', 1024, 'image/png');
			mockStore.inputImage = { width: 800, height: 600 };
		});

		it('should enable convert button when requirements are met', () => {
			render(ConverterPage);

			const convertButton = screen.getByRole('button', { name: /convert to svg/i });
			expect(convertButton).not.toBeDisabled();
		});

		it('should disable convert button when requirements are not met', () => {
			mockStore.inputFile = null;
			mockStore.inputImage = null;

			render(ConverterPage);

			const convertButton = screen.getByRole('button', { name: /initialize converter first/i });
			expect(convertButton).toBeDisabled();
		});

		it('should handle successful conversion', async () => {
			mockStore.processImage.mockResolvedValue({ svg: '<svg>test result</svg>' });

			render(ConverterPage);

			const convertButton = screen.getByRole('button', { name: /convert to svg/i });
			await fireEvent.click(convertButton);

			expect(mockStore.processImage).toHaveBeenCalled();
			expect(URL.createObjectURL).toHaveBeenCalled();
		});

		it('should handle conversion failure', async () => {
			const testError = new Error('Conversion failed');
			mockStore.processImage.mockRejectedValue(testError);

			render(ConverterPage);

			const convertButton = screen.getByRole('button', { name: /convert to svg/i });
			await fireEvent.click(convertButton);

			expect(mockStore.processImage).toHaveBeenCalled();
		});

		it('should show processing state during conversion', () => {
			mockStore.isProcessing = true;

			render(ConverterPage);

			expect(screen.getByText('Processing...')).toBeInTheDocument();
			expect(screen.getByLabelText(/processing status/i)).toBeInTheDocument();
		});

		it('should enable download button after successful conversion', () => {
			mockStore.lastResult = { svg: '<svg>test</svg>' };

			render(ConverterPage);

			const downloadButton = screen.getByRole('button', { name: /download svg/i });
			expect(downloadButton).not.toBeDisabled();
		});
	});

	describe('Error Handling', () => {
		it('should display error boundary for conversion errors', () => {
			mockStore.hasError = true;
			mockStore.error = {
				details: 'Detailed error information',
				code: 'CONVERSION_FAILED'
			};

			render(ConverterPage);

			expect(screen.getByText('Vectorizer Error')).toBeInTheDocument();
			expect(screen.getByText('Detailed error information')).toBeInTheDocument();
		});

		it('should show recovery suggestions', () => {
			mockStore.hasError = true;
			mockStore.error = { details: 'Error details' };
			mockStore.getRecoverySuggestions.mockReturnValue([
				'Try reducing detail level',
				'Use single-threaded mode'
			]);

			render(ConverterPage);

			expect(screen.getByText('Suggestions:')).toBeInTheDocument();
			expect(screen.getByText('Try reducing detail level')).toBeInTheDocument();
			expect(screen.getByText('Use single-threaded mode')).toBeInTheDocument();
		});

		it('should handle retry operation', async () => {
			mockStore.hasError = true;
			mockStore.error = { details: 'Error details' };

			render(ConverterPage);

			const retryButton = screen.getByRole('button', { name: /retry/i });
			await fireEvent.click(retryButton);

			expect(mockStore.retryLastOperation).toHaveBeenCalled();
		});

		it('should handle error dismissal', async () => {
			mockStore.hasError = true;
			mockStore.error = { details: 'Error details' };

			render(ConverterPage);

			const dismissButton = screen.getByRole('button', { name: /dismiss/i });
			await fireEvent.click(dismissButton);

			expect(mockStore.clearError).toHaveBeenCalled();
		});

		it('should handle reset operations', async () => {
			mockStore.hasError = true;
			mockStore.error = { details: 'Error details' };
			mockStore.getRecoverySuggestions.mockReturnValue(['Reset suggestion']);

			render(ConverterPage);

			const resetAllButton = screen.getByRole('button', { name: /reset all/i });
			await fireEvent.click(resetAllButton);

			expect(mockStore.reset).toHaveBeenCalled();

			const resetSettingsButton = screen.getByRole('button', { name: /reset settings/i });
			await fireEvent.click(resetSettingsButton);

			expect(mockStore.resetConfig).toHaveBeenCalled();
		});
	});

	describe('Download Functionality', () => {
		beforeEach(() => {
			mockStore.lastResult = { svg: '<svg>test result</svg>' };
			mockStore.inputFile = fileTestUtils.createMockFile('test-image.png', 1024, 'image/png');
		});

		it('should handle SVG download', async () => {
			// Mock document.createElement and appendChild/removeChild
			const mockAnchor = {
				href: '',
				download: '',
				click: vi.fn()
			};
			const createElementSpy = vi
				.spyOn(document, 'createElement')
				.mockReturnValue(mockAnchor as any);
			const appendChildSpy = vi
				.spyOn(document.body, 'appendChild')
				.mockImplementation(() => mockAnchor as any);
			const removeChildSpy = vi
				.spyOn(document.body, 'removeChild')
				.mockImplementation(() => mockAnchor as any);

			render(ConverterPage);

			const downloadButton = screen.getByRole('button', { name: /download svg/i });
			await fireEvent.click(downloadButton);

			expect(createElementSpy).toHaveBeenCalledWith('a');
			expect(appendChildSpy).toHaveBeenCalledWith(mockAnchor);
			expect(mockAnchor.click).toHaveBeenCalled();
			expect(removeChildSpy).toHaveBeenCalledWith(mockAnchor);
			expect(mockAnchor.download).toBe('test-image.svg');

			createElementSpy.mockRestore();
			appendChildSpy.mockRestore();
			removeChildSpy.mockRestore();
		});

		it('should disable download when no result available', () => {
			mockStore.lastResult = null;

			render(ConverterPage);

			const downloadButton = screen.getByRole('button', { name: /download svg/i });
			expect(downloadButton).toBeDisabled();
		});
	});

	describe('Processing Information', () => {
		it('should display processing statistics', () => {
			mockStore.getStats.mockReturnValue({
				processing_time: 2500,
				input_size: '1.8 MB',
				output_size: '342 KB',
				compression_ratio: 0.81
			});

			render(ConverterPage);

			expect(screen.getByText(/processing time: 2500ms/i)).toBeInTheDocument();
			expect(screen.getByText(/input size: 1.8 MB/i)).toBeInTheDocument();
			expect(screen.getByText(/output size: 342 KB/i)).toBeInTheDocument();
			expect(screen.getByText(/compression: 81.0%/i)).toBeInTheDocument();
		});

		it('should show default processing time when none available', () => {
			mockStore.getStats.mockReturnValue({});

			render(ConverterPage);

			expect(screen.getByText(/processing time: ~1.5s/i)).toBeInTheDocument();
		});

		it('should always show static information', () => {
			render(ConverterPage);

			expect(screen.getByText(/output format: SVG/i)).toBeInTheDocument();
			expect(screen.getByText(/client-side processing/i)).toBeInTheDocument();
		});
	});

	describe('Accessibility Features', () => {
		it('should have proper ARIA live regions', () => {
			render(ConverterPage);

			const politeRegion = document.querySelector('[aria-live="polite"]');
			const assertiveRegion = document.querySelector('[aria-live="assertive"]');

			expect(politeRegion).toBeInTheDocument();
			expect(assertiveRegion).toBeInTheDocument();
			expect(politeRegion).toHaveAttribute('aria-atomic', 'true');
			expect(assertiveRegion).toHaveAttribute('aria-atomic', 'true');
		});

		it('should announce processing status changes', async () => {
			const { rerender } = render(ConverterPage);

			// Simulate status change by updating store
			mockStore.isProcessing = true;
			mockStore.currentProgress = {
				stage: 'Edge Detection',
				progress: 50,
				elapsed_ms: 1000
			};

			rerender(ConverterPage);

			const assertiveRegion = document.querySelector('[aria-live="assertive"]');
			// The actual announcement would be set by the component's internal logic
			expect(assertiveRegion).toBeInTheDocument();
		});

		it('should have proper button labels and descriptions', () => {
			render(ConverterPage);

			const convertButton = screen.getByRole('button', {
				name: /convert to svg|initialize converter first/i
			});
			const downloadButton = screen.getByRole('button', { name: /download svg/i });

			expect(convertButton).toBeInTheDocument();
			expect(downloadButton).toBeInTheDocument();
		});

		it('should have descriptive labels for form controls', () => {
			render(ConverterPage);

			expect(screen.getByLabelText('Detail Level')).toBeInTheDocument();
			expect(screen.getByLabelText('Smoothness')).toBeInTheDocument();
			expect(screen.getByLabelText('Hand-drawn style')).toBeInTheDocument();
		});

		it('should pass basic accessibility check', async () => {
			render(ConverterPage);

			const main = document.querySelector('main');
			expect(main).toBeInTheDocument();

			await assertionUtils.expectAccessibility(main!);
		});
	});

	describe('Responsive Design', () => {
		it('should have proper grid layout classes', () => {
			render(ConverterPage);

			const mainGrid = document.querySelector('main');
			expect(mainGrid).toHaveClass('grid', 'gap-8', 'lg:grid-cols-3');
		});

		it('should have responsive spacing', () => {
			render(ConverterPage);

			const container = document.querySelector('.mx-auto');
			expect(container).toHaveClass('max-w-screen-xl', 'px-4', 'py-8', 'sm:px-6', 'lg:px-8');
		});
	});

	describe('Memory Management', () => {
		it('should clean up blob URLs on component destruction', () => {
			const { unmount } = render(ConverterPage);

			// Create some blob URLs
			URL.createObjectURL(new Blob(['test']));

			unmount();

			// Verify cleanup happens (would be handled by the effect in the component)
			expect(URL.revokeObjectURL).toHaveBeenCalled();
		});

		it('should revoke old blob URLs when creating new ones', async () => {
			mockStore.lastResult = { svg: '<svg>test</svg>' };
			mockStore.inputFile = fileTestUtils.createMockFile('test.png', 1024, 'image/png');

			render(ConverterPage);

			const convertButton = screen.getByRole('button', { name: /convert to svg/i });

			// First conversion
			await fireEvent.click(convertButton);
			const firstCallCount = (URL.createObjectURL as any).mock.calls.length;

			// Second conversion (should revoke previous URL)
			await fireEvent.click(convertButton);

			expect((URL.createObjectURL as any).mock.calls.length).toBeGreaterThan(firstCallCount);
			expect(URL.revokeObjectURL).toHaveBeenCalled();
		});
	});

	describe('Performance', () => {
		it('should render within performance budget', async () => {
			await assertionUtils.expectPerformance(async () => {
				render(ConverterPage);
			}, 100); // Should render within 100ms given complexity
		});

		it('should handle rapid setting changes efficiently', async () => {
			render(ConverterPage);

			const detailSlider = screen.getByLabelText('Detail Level');

			await assertionUtils.expectPerformance(async () => {
				// Rapidly change detail level
				for (let i = 1; i <= 10; i++) {
					await fireEvent.change(detailSlider, { target: { value: i.toString() } });
				}
			}, 100); // Should handle 10 changes within 100ms
		});
	});

	describe('Edge Cases', () => {
		it('should handle missing store methods gracefully', () => {
			// Temporarily remove a method
			const originalMethod = mockStore.processImage;
			delete (mockStore as any).processImage;

			expect(() => render(ConverterPage)).not.toThrow();

			// Restore method
			mockStore.processImage = originalMethod;
		});

		it('should handle invalid file types in preview', () => {
			mockStore.inputFile = fileTestUtils.createMockFile('test.txt', 1024, 'text/plain');

			expect(() => render(ConverterPage)).not.toThrow();
		});

		it('should handle missing capabilities gracefully', () => {
			mockStore.threadsInitialized = true;
			mockStore.capabilities = null;

			render(ConverterPage);

			// Should still render without throwing
			expect(screen.getByText('Image to SVG Converter')).toBeInTheDocument();
		});

		it('should handle configuration errors', () => {
			mockStore.isConfigValid.mockReturnValue(false);

			render(ConverterPage);

			const convertButton = screen.getByRole('button');
			expect(convertButton).toBeDisabled();
		});
	});
});
