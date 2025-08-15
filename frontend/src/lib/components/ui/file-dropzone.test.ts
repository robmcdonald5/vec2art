/**
 * @file file-dropzone.test.ts
 * Comprehensive tests for FileDropzone component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte';
import FileDropzone from './file-dropzone.svelte';
import {
	fileTestUtils,
	interactionTestUtils,
	assertionUtils,
	setupBrowserMocks,
	cleanupBrowserMocks
} from '@tests/test-utils';

describe('FileDropzone Component', () => {
	let mockNavigator: any;

	beforeEach(() => {
		mockNavigator = setupBrowserMocks();
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
		cleanupBrowserMocks();
	});

	describe('Initial Render and States', () => {
		it('should render upload state when no file is selected', () => {
			render(FileDropzone, {
				props: {}
			});

			expect(screen.getByText('Upload your image')).toBeInTheDocument();
			expect(
				screen.getByText('Drag and drop your image here, or click to browse')
			).toBeInTheDocument();
			expect(screen.getByText('Supports PNG, JPG, WebP up to 10MB')).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /upload image file/i })).toBeInTheDocument();
		});

		it('should render file selected state when currentFile is provided', () => {
			const testFile = fileTestUtils.createMockFile('test.png', 1024, 'image/png');

			render(FileDropzone, {
				props: {
					currentFile: testFile
				}
			});

			expect(screen.getByText('test.png')).toBeInTheDocument();
			expect(screen.getByText('1.0 KB')).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /remove file test.png/i })).toBeInTheDocument();
		});

		it('should apply disabled styles when disabled prop is true', () => {
			render(FileDropzone, {
				props: {
					disabled: true
				}
			});

			const dropzone = screen.getByRole('button');
			expect(dropzone).toHaveAttribute('aria-disabled', 'true');
			expect(dropzone).toHaveAttribute('tabindex', '-1');
		});

		it('should use custom accept and maxSize props', () => {
			render(FileDropzone, {
				props: {
					accept: '.png,.jpg',
					maxSize: 5 * 1024 * 1024 // 5MB
				}
			});

			expect(screen.getByText('Supports PNG, JPG, WebP up to 5MB')).toBeInTheDocument();
		});
	});

	describe('File Upload via Click', () => {
		it('should trigger file input when dropzone is clicked', async () => {
			const onFileSelect = vi.fn();
			render(FileDropzone, {
				props: { onFileSelect }
			});

			const dropzone = screen.getByRole('button');
			const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
			const clickSpy = vi.spyOn(fileInput, 'click');

			await fireEvent.click(dropzone);

			expect(clickSpy).toHaveBeenCalled();
		});

		it('should handle valid file selection through input', async () => {
			const onFileSelect = vi.fn();
			render(FileDropzone, {
				props: { onFileSelect }
			});

			const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
			const testFile = fileTestUtils.createMockFile('test.png', 1024, 'image/png');
			const fileList = fileTestUtils.createMockFileList([testFile]);

			await interactionTestUtils.changeFileInput(fileInput, fileList);

			expect(onFileSelect).toHaveBeenCalledWith(testFile);
		});

		it('should not trigger click when disabled', async () => {
			render(FileDropzone, {
				props: { disabled: true }
			});

			const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
			const clickSpy = vi.spyOn(fileInput, 'click');
			const dropzone = screen.getByRole('button');

			await fireEvent.click(dropzone);

			expect(clickSpy).not.toHaveBeenCalled();
		});
	});

	describe('Drag and Drop Functionality', () => {
		it('should handle drag events correctly', async () => {
			const onFileSelect = vi.fn();
			render(FileDropzone, {
				props: { onFileSelect }
			});

			const dropzone = screen.getByRole('button');
			const testFile = fileTestUtils.createMockFile('test.png', 1024, 'image/png');

			await interactionTestUtils.dragAndDropFile(dropzone, testFile);

			expect(onFileSelect).toHaveBeenCalledWith(testFile);
		});

		it('should update visual state during drag over', async () => {
			render(FileDropzone, {
				props: {}
			});

			const dropzone = screen.getByRole('button');

			// Simulate drag enter
			await fireEvent.dragEnter(dropzone, {
				dataTransfer: new DataTransfer()
			});

			// Should have drag over styling
			expect(dropzone).toHaveClass('border-primary', 'bg-primary/5');
		});

		it('should reset drag state on drag leave', async () => {
			render(FileDropzone, {
				props: {}
			});

			const dropzone = screen.getByRole('button');

			// Enter drag state
			await fireEvent.dragEnter(dropzone, {
				dataTransfer: new DataTransfer()
			});

			// Leave drag state
			await fireEvent.dragLeave(dropzone);

			// Should not have drag over styling
			expect(dropzone).not.toHaveClass('border-primary', 'bg-primary/5');
		});

		it('should not handle drag events when disabled', async () => {
			const onFileSelect = vi.fn();
			render(FileDropzone, {
				props: {
					onFileSelect,
					disabled: true
				}
			});

			const dropzone = screen.getByRole('button');
			const testFile = fileTestUtils.createMockFile('test.png', 1024, 'image/png');

			await interactionTestUtils.dragAndDropFile(dropzone, testFile);

			expect(onFileSelect).not.toHaveBeenCalled();
		});
	});

	describe('File Validation', () => {
		it('should reject non-image files', async () => {
			const onFileSelect = vi.fn();
			render(FileDropzone, {
				props: { onFileSelect }
			});

			const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
			const invalidFile = fileTestUtils.createMockFile('document.pdf', 1024, 'application/pdf');
			const fileList = fileTestUtils.createMockFileList([invalidFile]);

			await interactionTestUtils.changeFileInput(fileInput, fileList);

			expect(onFileSelect).not.toHaveBeenCalled();
			expect(screen.getByText(/please select an image file/i)).toBeInTheDocument();
		});

		it('should reject files that exceed maxSize', async () => {
			const onFileSelect = vi.fn();
			const maxSize = 1024; // 1KB limit

			render(FileDropzone, {
				props: {
					onFileSelect,
					maxSize
				}
			});

			const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
			const largeFile = fileTestUtils.createMockFile('large.png', 2048, 'image/png'); // 2KB
			const fileList = fileTestUtils.createMockFileList([largeFile]);

			await interactionTestUtils.changeFileInput(fileInput, fileList);

			expect(onFileSelect).not.toHaveBeenCalled();
			expect(screen.getByText(/file size must be less than/i)).toBeInTheDocument();
		});

		it('should accept valid image files within size limit', async () => {
			const onFileSelect = vi.fn();
			render(FileDropzone, {
				props: { onFileSelect }
			});

			const testImages = fileTestUtils.createTestImageFiles();
			const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

			// Test PNG
			let fileList = fileTestUtils.createMockFileList([testImages.png]);
			await interactionTestUtils.changeFileInput(fileInput, fileList);
			expect(onFileSelect).toHaveBeenCalledWith(testImages.png);

			// Test JPG
			fileList = fileTestUtils.createMockFileList([testImages.jpg]);
			await interactionTestUtils.changeFileInput(fileInput, fileList);
			expect(onFileSelect).toHaveBeenCalledWith(testImages.jpg);

			// Test WebP
			fileList = fileTestUtils.createMockFileList([testImages.webp]);
			await interactionTestUtils.changeFileInput(fileInput, fileList);
			expect(onFileSelect).toHaveBeenCalledWith(testImages.webp);
		});
	});

	describe('File Removal', () => {
		it('should remove current file when remove button is clicked', async () => {
			const onFileSelect = vi.fn();
			const testFile = fileTestUtils.createMockFile('test.png', 1024, 'image/png');

			render(FileDropzone, {
				props: {
					currentFile: testFile,
					onFileSelect
				}
			});

			const removeButton = screen.getByRole('button', { name: /remove file test.png/i });
			await fireEvent.click(removeButton);

			expect(onFileSelect).toHaveBeenCalledWith(null);
		});

		it('should clear file input value when file is removed', async () => {
			const onFileSelect = vi.fn();
			const testFile = fileTestUtils.createMockFile('test.png', 1024, 'image/png');

			render(FileDropzone, {
				props: {
					currentFile: testFile,
					onFileSelect
				}
			});

			const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
			fileInput.value = 'fake-value'; // Simulate file input having a value

			const removeButton = screen.getByRole('button', { name: /remove file test.png/i });
			await fireEvent.click(removeButton);

			expect(fileInput.value).toBe('');
		});
	});

	describe('Keyboard Accessibility', () => {
		it('should open file dialog on Enter key when no file selected', async () => {
			render(FileDropzone, {
				props: {}
			});

			const dropzone = screen.getByRole('button');
			const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
			const clickSpy = vi.spyOn(fileInput, 'click');

			await interactionTestUtils.pressKey(dropzone, 'Enter');

			expect(clickSpy).toHaveBeenCalled();
		});

		it('should open file dialog on Space key when no file selected', async () => {
			render(FileDropzone, {
				props: {}
			});

			const dropzone = screen.getByRole('button');
			const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
			const clickSpy = vi.spyOn(fileInput, 'click');

			await interactionTestUtils.pressKey(dropzone, ' ');

			expect(clickSpy).toHaveBeenCalled();
		});

		it('should remove file on Enter key when file is selected', async () => {
			const onFileSelect = vi.fn();
			const testFile = fileTestUtils.createMockFile('test.png', 1024, 'image/png');

			render(FileDropzone, {
				props: {
					currentFile: testFile,
					onFileSelect
				}
			});

			const dropzone = screen.getByRole('button');
			await interactionTestUtils.pressKey(dropzone, 'Enter');

			expect(onFileSelect).toHaveBeenCalledWith(null);
		});

		it('should not respond to keyboard events when disabled', async () => {
			const onFileSelect = vi.fn();
			render(FileDropzone, {
				props: {
					disabled: true,
					onFileSelect
				}
			});

			const dropzone = screen.getByRole('button');
			const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
			const clickSpy = vi.spyOn(fileInput, 'click');

			await interactionTestUtils.pressKey(dropzone, 'Enter');

			expect(clickSpy).not.toHaveBeenCalled();
		});
	});

	describe('Accessibility Features', () => {
		it('should have proper ARIA attributes', () => {
			render(FileDropzone, {
				props: {}
			});

			const dropzone = screen.getByRole('button');

			expect(dropzone).toHaveAttribute('aria-label');
			expect(dropzone).toHaveAttribute('aria-describedby', 'file-upload-instructions');
			expect(dropzone).toHaveAttribute('tabindex', '0');

			// Check for live region
			expect(document.querySelector('[aria-live="polite"]')).toBeInTheDocument();
		});

		it('should update ARIA label when file is selected', () => {
			const testFile = fileTestUtils.createMockFile('test.png', 1024, 'image/png');

			render(FileDropzone, {
				props: {
					currentFile: testFile
				}
			});

			const dropzone = screen.getByRole('button');
			expect(dropzone).toHaveAttribute(
				'aria-label',
				expect.stringContaining('Current file: test.png')
			);
		});

		it('should pass basic accessibility check', async () => {
			render(FileDropzone, {
				props: {}
			});

			const dropzone = screen.getByRole('button');
			await assertionUtils.expectAccessibility(dropzone);
		});

		it('should display error messages with proper ARIA attributes', async () => {
			const onFileSelect = vi.fn();
			render(FileDropzone, {
				props: { onFileSelect }
			});

			const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
			const invalidFile = fileTestUtils.createMockFile('document.pdf', 1024, 'application/pdf');
			const fileList = fileTestUtils.createMockFileList([invalidFile]);

			await interactionTestUtils.changeFileInput(fileInput, fileList);

			const errorAlert = screen.getByRole('alert');
			expect(errorAlert).toBeInTheDocument();
			expect(errorAlert).toHaveTextContent(/please select an image file/i);
		});
	});

	describe('File Size Formatting', () => {
		it('should format file sizes correctly', () => {
			const testCases = [
				{ file: fileTestUtils.createMockFile('test1.png', 0, 'image/png'), expected: '0 B' },
				{ file: fileTestUtils.createMockFile('test2.png', 1024, 'image/png'), expected: '1.0 KB' },
				{
					file: fileTestUtils.createMockFile('test3.png', 1024 * 1024, 'image/png'),
					expected: '1.0 MB'
				},
				{ file: fileTestUtils.createMockFile('test4.png', 1536, 'image/png'), expected: '1.5 KB' }
			];

			testCases.forEach(({ file, expected }) => {
				render(FileDropzone, {
					props: {
						currentFile: file
					}
				});

				expect(screen.getByText(expected)).toBeInTheDocument();
				cleanup();
			});
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty drag and drop', async () => {
			const onFileSelect = vi.fn();
			render(FileDropzone, {
				props: { onFileSelect }
			});

			const dropzone = screen.getByRole('button');

			// Create empty drop event
			const dropEvent = new DragEvent('drop', {
				bubbles: true,
				dataTransfer: new DataTransfer()
			});

			await fireEvent(dropzone, dropEvent);

			expect(onFileSelect).not.toHaveBeenCalled();
		});

		it('should handle missing onFileSelect callback gracefully', async () => {
			render(FileDropzone, {
				props: {}
			});

			const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
			const testFile = fileTestUtils.createMockFile('test.png', 1024, 'image/png');
			const fileList = fileTestUtils.createMockFileList([testFile]);

			// Should not throw error when onFileSelect is undefined
			expect(async () => {
				await interactionTestUtils.changeFileInput(fileInput, fileList);
			}).not.toThrow();
		});

		it('should handle rapid file selection changes', async () => {
			const onFileSelect = vi.fn();
			render(FileDropzone, {
				props: { onFileSelect }
			});

			const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
			const testFiles = [
				fileTestUtils.createMockFile('test1.png', 1024, 'image/png'),
				fileTestUtils.createMockFile('test2.jpg', 2048, 'image/jpeg'),
				fileTestUtils.createMockFile('test3.webp', 3072, 'image/webp')
			];

			// Rapidly select multiple files
			for (const file of testFiles) {
				const fileList = fileTestUtils.createMockFileList([file]);
				await interactionTestUtils.changeFileInput(fileInput, fileList);
			}

			expect(onFileSelect).toHaveBeenCalledTimes(testFiles.length);
			expect(onFileSelect).toHaveBeenLastCalledWith(testFiles[testFiles.length - 1]);
		});
	});

	describe('Performance', () => {
		it('should render within performance budget', async () => {
			await assertionUtils.expectPerformance(async () => {
				render(FileDropzone, {
					props: {}
				});
			}, 16); // Should render within 16ms
		});

		it('should handle file operations efficiently', async () => {
			const onFileSelect = vi.fn();
			render(FileDropzone, {
				props: { onFileSelect }
			});

			const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
			const testFile = fileTestUtils.createMockFile('test.png', 1024, 'image/png');
			const fileList = fileTestUtils.createMockFileList([testFile]);

			await assertionUtils.expectPerformance(async () => {
				await interactionTestUtils.changeFileInput(fileInput, fileList);
			}, 50); // File handling should complete within 50ms
		});
	});
});
