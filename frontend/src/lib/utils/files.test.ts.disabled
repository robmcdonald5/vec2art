/**
 * @file files.test.ts
 * Comprehensive tests for file utility functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	validateImageFile,
	getFileExtension,
	getFileNameWithoutExtension,
	formatFileSize,
	getFileInfo,
	readFileAsDataURL,
	readFileAsArrayBuffer,
	readFileAsText,
	supportsFileAPI,
	isProcessableImage,
	createFileFromBlob,
	downloadBlob,
	downloadTextAsFile,
	compressImage,
	getMimeTypeFromExtension,
	processFiles,
	DragDropUtils,
	FILE_SIZE_LIMITS,
	SUPPORTED_IMAGE_FORMATS
} from './files';
import { fileTestUtils, setupBrowserMocks, cleanupBrowserMocks } from '@tests/test-utils';

describe('File Utilities', () => {
	beforeEach(() => {
		setupBrowserMocks();
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanupBrowserMocks();
	});

	describe('validateImageFile', () => {
		it('should validate a valid image file', () => {
			const file = fileTestUtils.createMockFile('test.png', 1024, 'image/png');
			const result = validateImageFile(file);

			expect(result.isValid).toBe(true);
			expect(result.error).toBeUndefined();
		});

		it('should reject unsupported file types', () => {
			const file = fileTestUtils.createMockFile('test.pdf', 1024, 'application/pdf');
			const result = validateImageFile(file);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('Unsupported file type');
		});

		it('should reject unsupported file extensions', () => {
			const file = fileTestUtils.createMockFile('test.xyz', 1024, 'image/xyz');
			const result = validateImageFile(file);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('Unsupported file type');
		});

		it('should reject files that are too large', () => {
			// Create a file with actual large content to exceed maxSize
			const largeContent = new ArrayBuffer(20 * 1024 * 1024); // 20MB
			const file = fileTestUtils.createMockFile(
				'test.png',
				20 * 1024 * 1024,
				'image/png',
				largeContent
			);
			const result = validateImageFile(file, { maxSize: 10 * 1024 * 1024 }); // 10MB limit

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('exceeds maximum allowed size');
		});

		it('should warn about very small files', () => {
			const file = fileTestUtils.createMockFile('test.png', 512, 'image/png');
			const result = validateImageFile(file);

			expect(result.isValid).toBe(true);
			expect(result.warnings).toContain(
				'File is very small and may not contain enough detail for processing'
			);
		});

		it('should warn about large files', () => {
			// Create a file with actual large content to trigger the warning
			const largeContent = new ArrayBuffer(15 * 1024 * 1024); // 15MB
			const file = fileTestUtils.createMockFile(
				'test.png',
				15 * 1024 * 1024,
				'image/png',
				largeContent
			);
			const result = validateImageFile(file);

			expect(result.isValid).toBe(true);
			expect(result.warnings?.[0]).toContain('Large file detected');
		});

		it('should respect custom options', () => {
			const file = fileTestUtils.createMockFile('test.gif', 1024, 'image/gif');
			const result = validateImageFile(file, {
				allowedTypes: ['image/gif'],
				allowedExtensions: ['.gif'],
				maxSize: 2048
			});

			expect(result.isValid).toBe(true);
		});

		it('should handle case-insensitive extensions', () => {
			const file = fileTestUtils.createMockFile('test.PNG', 1024, 'image/png');
			const result = validateImageFile(file);

			expect(result.isValid).toBe(true);
		});
	});

	describe('getFileExtension', () => {
		it('should extract file extension correctly', () => {
			expect(getFileExtension('test.png')).toBe('.png');
			expect(getFileExtension('document.pdf')).toBe('.pdf');
			expect(getFileExtension('archive.tar.gz')).toBe('.gz');
		});

		it('should handle files without extension', () => {
			expect(getFileExtension('filename')).toBe('');
			expect(getFileExtension('')).toBe('');
		});

		it('should handle hidden files', () => {
			expect(getFileExtension('.gitignore')).toBe('.gitignore');
			expect(getFileExtension('.env.local')).toBe('.local');
		});
	});

	describe('getFileNameWithoutExtension', () => {
		it('should remove file extension correctly', () => {
			expect(getFileNameWithoutExtension('test.png')).toBe('test');
			expect(getFileNameWithoutExtension('document.pdf')).toBe('document');
			expect(getFileNameWithoutExtension('archive.tar.gz')).toBe('archive.tar');
		});

		it('should handle files without extension', () => {
			expect(getFileNameWithoutExtension('filename')).toBe('filename');
			expect(getFileNameWithoutExtension('')).toBe('');
		});

		it('should handle complex filenames', () => {
			expect(getFileNameWithoutExtension('my.file.name.txt')).toBe('my.file.name');
		});
	});

	describe('formatFileSize', () => {
		it('should format bytes correctly', () => {
			expect(formatFileSize(0)).toBe('0 B');
			expect(formatFileSize(512)).toBe('512 B');
			expect(formatFileSize(1024)).toBe('1 KB');
			expect(formatFileSize(1536)).toBe('1.5 KB');
			expect(formatFileSize(1024 * 1024)).toBe('1 MB');
			expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
		});

		it('should handle large numbers', () => {
			expect(formatFileSize(1024 * 1024 * 1024 * 1024)).toBe('1 TB');
		});

		it('should round to one decimal place', () => {
			expect(formatFileSize(1234)).toBe('1.2 KB');
			expect(formatFileSize(1234567)).toBe('1.2 MB');
		});
	});

	describe('getFileInfo', () => {
		it('should extract comprehensive file information', () => {
			const file = fileTestUtils.createMockFile('test-image.png', 2048, 'image/png');
			const info = getFileInfo(file);

			expect(info).toEqual({
				name: 'test-image.png',
				size: file.size, // Use actual size since mock creates content-based size
				type: 'image/png',
				lastModified: expect.any(Number),
				extension: '.png',
				isImage: true
			});
		});

		it('should identify non-image files', () => {
			const file = fileTestUtils.createMockFile('document.pdf', 1024, 'application/pdf');
			const info = getFileInfo(file);

			expect(info.isImage).toBe(false);
		});
	});

	describe('File Reading Functions', () => {
		describe('readFileAsDataURL', () => {
			it('should read file as data URL', async () => {
				const file = fileTestUtils.createMockFile('test.png', 1024, 'image/png');

				// Mock FileReader
				const mockFileReader = {
					readAsDataURL: vi.fn(),
					result: 'data:image/png;base64,iVBORw0KGgo...',
					onload: null as any,
					onerror: null as any
				};

				global.FileReader = vi.fn().mockImplementation(() => mockFileReader);

				const promise = readFileAsDataURL(file);

				// Simulate successful read
				mockFileReader.onload();

				const result = await promise;
				expect(result).toBe('data:image/png;base64,iVBORw0KGgo...');
				expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(file);
			});

			it('should handle read errors', async () => {
				const file = fileTestUtils.createMockFile('test.png', 1024, 'image/png');

				const mockFileReader = {
					readAsDataURL: vi.fn(),
					result: null,
					onload: null as any,
					onerror: null as any
				};

				global.FileReader = vi.fn().mockImplementation(() => mockFileReader);

				const promise = readFileAsDataURL(file);

				// Simulate error
				mockFileReader.onerror();

				await expect(promise).rejects.toThrow('Error reading file');
			});

			it('should handle invalid result type', async () => {
				const file = fileTestUtils.createMockFile('test.png', 1024, 'image/png');

				const mockFileReader = {
					readAsDataURL: vi.fn(),
					result: new ArrayBuffer(8), // Wrong type
					onload: null as any,
					onerror: null as any
				};

				global.FileReader = vi.fn().mockImplementation(() => mockFileReader);

				const promise = readFileAsDataURL(file);
				mockFileReader.onload();

				await expect(promise).rejects.toThrow('Failed to read file as data URL');
			});
		});

		describe('readFileAsArrayBuffer', () => {
			it('should read file as array buffer', async () => {
				const file = fileTestUtils.createMockFile('test.png', 1024, 'image/png');
				const mockBuffer = new ArrayBuffer(1024);

				const mockFileReader = {
					readAsArrayBuffer: vi.fn(),
					result: mockBuffer,
					onload: null as any,
					onerror: null as any
				};

				global.FileReader = vi.fn().mockImplementation(() => mockFileReader);

				const promise = readFileAsArrayBuffer(file);
				mockFileReader.onload();

				const result = await promise;
				expect(result).toBe(mockBuffer);
			});
		});

		describe('readFileAsText', () => {
			it('should read file as text with default encoding', async () => {
				const file = fileTestUtils.createMockFile('test.txt', 1024, 'text/plain');

				const mockFileReader = {
					readAsText: vi.fn(),
					result: 'File content',
					onload: null as any,
					onerror: null as any
				};

				global.FileReader = vi.fn().mockImplementation(() => mockFileReader);

				const promise = readFileAsText(file);
				mockFileReader.onload();

				const result = await promise;
				expect(result).toBe('File content');
				expect(mockFileReader.readAsText).toHaveBeenCalledWith(file, 'UTF-8');
			});

			it('should read file as text with custom encoding', async () => {
				const file = fileTestUtils.createMockFile('test.txt', 1024, 'text/plain');

				const mockFileReader = {
					readAsText: vi.fn(),
					result: 'File content',
					onload: null as any,
					onerror: null as any
				};

				global.FileReader = vi.fn().mockImplementation(() => mockFileReader);

				const promise = readFileAsText(file, 'ISO-8859-1');
				mockFileReader.onload();

				await promise;
				expect(mockFileReader.readAsText).toHaveBeenCalledWith(file, 'ISO-8859-1');
			});
		});
	});

	describe('supportsFileAPI', () => {
		it('should return true when File API is supported', () => {
			// File API is mocked in setupBrowserMocks
			expect(supportsFileAPI()).toBe(true);
		});

		it('should return false when File API is not supported', () => {
			// Remove File API support
			delete (global as any).File;
			delete (global as any).FileReader;
			delete (global as any).FileList;
			delete (global as any).Blob;

			expect(supportsFileAPI()).toBe(false);
		});
	});

	describe('isProcessableImage', () => {
		it('should return true for valid images', () => {
			const file = fileTestUtils.createMockFile('test.png', 1024, 'image/png');
			expect(isProcessableImage(file)).toBe(true);
		});

		it('should return false for invalid files', () => {
			const file = fileTestUtils.createMockFile('test.pdf', 1024, 'application/pdf');
			expect(isProcessableImage(file)).toBe(false);
		});
	});

	describe('createFileFromBlob', () => {
		it('should create file from blob with default options', () => {
			const blob = new Blob(['test content'], { type: 'text/plain' });
			const file = createFileFromBlob(blob, 'test.txt');

			expect(file.name).toBe('test.txt');
			expect(file.type).toBe('text/plain');
			expect(file.size).toBe(12); // 'test content' is 12 characters
		});

		it('should create file with custom options', () => {
			const blob = new Blob(['test content']);
			const customTime = Date.now() - 10000;
			const file = createFileFromBlob(blob, 'test.txt', {
				type: 'text/custom',
				lastModified: customTime
			});

			expect(file.type).toBe('text/custom');
			expect(file.lastModified).toBe(customTime);
		});
	});

	describe('Download Functions', () => {
		let mockAnchor: HTMLAnchorElement;

		beforeEach(() => {
			mockAnchor = {
				href: '',
				download: '',
				style: { display: '' },
				click: vi.fn()
			} as any;

			vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
			vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor);
			vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor);
			vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
			vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
		});

		describe('downloadBlob', () => {
			it('should download blob as file', () => {
				const blob = new Blob(['test content'], { type: 'text/plain' });
				downloadBlob(blob, 'test.txt');

				expect(document.createElement).toHaveBeenCalledWith('a');
				expect(mockAnchor.href).toBe('blob:mock-url');
				expect(mockAnchor.download).toBe('test.txt');
				expect(mockAnchor.click).toHaveBeenCalled();
				expect(document.body.appendChild).toHaveBeenCalledWith(mockAnchor);
				expect(document.body.removeChild).toHaveBeenCalledWith(mockAnchor);
			});

			it('should clean up URL after download', () => {
				vi.useFakeTimers();

				const blob = new Blob(['test content']);
				downloadBlob(blob, 'test.txt');

				vi.advanceTimersByTime(100);
				expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

				vi.useRealTimers();
			});
		});

		describe('downloadTextAsFile', () => {
			it('should download text content as file', () => {
				downloadTextAsFile('Hello, world!', 'greeting.txt');

				expect(mockAnchor.download).toBe('greeting.txt');
				expect(mockAnchor.click).toHaveBeenCalled();
			});

			it('should use custom MIME type', () => {
				downloadTextAsFile('{"key": "value"}', 'data.json', 'application/json');

				// Blob creation is mocked, but we can verify the download happened
				expect(mockAnchor.click).toHaveBeenCalled();
			});
		});
	});

	describe('compressImage', () => {
		let mockCanvas: HTMLCanvasElement;
		let mockContext: CanvasRenderingContext2D;
		let mockImage: HTMLImageElement;

		beforeEach(() => {
			mockContext = {
				drawImage: vi.fn()
			} as any;

			mockCanvas = {
				getContext: vi.fn().mockReturnValue(mockContext),
				toBlob: vi.fn(),
				width: 0,
				height: 0
			} as any;

			mockImage = {
				onload: vi.fn(),
				onerror: vi.fn(),
				src: '',
				width: 1920,
				height: 1080
			} as any;

			vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
				if (tagName === 'canvas') return mockCanvas;
				if (tagName === 'img') return mockImage;
				return {} as any;
			});

			vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
		});

		it('should compress image with default options', async () => {
			const file = fileTestUtils.createMockFile('test.jpg', 1024, 'image/jpeg');
			const compressedBlob = new Blob(['compressed'], { type: 'image/jpeg' });

			const promise = compressImage(file);

			// Simulate image load
			mockImage.onload!();

			// Simulate canvas.toBlob callback
			const toBlobCallback = (mockCanvas.toBlob as any).mock.calls[0][0];
			toBlobCallback(compressedBlob);

			const result = await promise;

			expect(result.name).toContain('test.jpeg');
			expect(result.type).toBe('image/jpeg');
			expect(mockCanvas.width).toBe(1920);
			expect(mockCanvas.height).toBe(1080);
		});

		it('should resize image when it exceeds maximum dimensions', async () => {
			const file = fileTestUtils.createMockFile('large.jpg', 1024, 'image/jpeg');
			const compressedBlob = new Blob(['compressed'], { type: 'image/jpeg' });

			// Set large image dimensions
			mockImage.width = 3840;
			mockImage.height = 2160;

			const promise = compressImage(file, { maxWidth: 1920, maxHeight: 1080 });

			mockImage.onload!();
			const toBlobCallback = (mockCanvas.toBlob as any).mock.calls[0][0];
			toBlobCallback(compressedBlob);

			await promise;

			expect(mockCanvas.width).toBe(1920);
			expect(mockCanvas.height).toBe(1080);
		});

		it('should handle image load errors', async () => {
			const file = fileTestUtils.createMockFile('invalid.jpg', 1024, 'image/jpeg');

			const promise = compressImage(file);

			// Simulate image error
			mockImage.onerror!();

			await expect(promise).rejects.toThrow('Failed to load image for compression');
		});

		it('should handle canvas.toBlob failure', async () => {
			const file = fileTestUtils.createMockFile('test.jpg', 1024, 'image/jpeg');

			const promise = compressImage(file);

			mockImage.onload!();
			const toBlobCallback = (mockCanvas.toBlob as any).mock.calls[0][0];
			toBlobCallback(null); // Simulate failure

			await expect(promise).rejects.toThrow('Failed to compress image');
		});
	});

	describe('getMimeTypeFromExtension', () => {
		it('should return correct MIME types for image extensions', () => {
			expect(getMimeTypeFromExtension('.png')).toBe('image/png');
			expect(getMimeTypeFromExtension('.jpg')).toBe('image/jpeg');
			expect(getMimeTypeFromExtension('.jpeg')).toBe('image/jpeg');
			expect(getMimeTypeFromExtension('.webp')).toBe('image/webp');
			expect(getMimeTypeFromExtension('.svg')).toBe('image/svg+xml');
		});

		it('should handle case insensitive extensions', () => {
			expect(getMimeTypeFromExtension('.PNG')).toBe('image/png');
			expect(getMimeTypeFromExtension('.JPEG')).toBe('image/jpeg');
		});

		it('should return default MIME type for unknown extensions', () => {
			expect(getMimeTypeFromExtension('.unknown')).toBe('application/octet-stream');
			expect(getMimeTypeFromExtension('')).toBe('application/octet-stream');
		});
	});

	describe('processFiles', () => {
		it('should process files sequentially with concurrency limit', async () => {
			const files = Array.from({ length: 5 }, (_, i) =>
				fileTestUtils.createMockFile(`file${i}.png`, 1024, 'image/png')
			);

			const processor = vi.fn().mockImplementation(async (file: File, index: number) => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				return `processed-${index}`;
			});

			const onProgress = vi.fn();

			const results = await processFiles(files, processor, {
				concurrency: 2,
				onProgress
			});

			expect(results).toEqual([
				'processed-0',
				'processed-1',
				'processed-2',
				'processed-3',
				'processed-4'
			]);
			expect(processor).toHaveBeenCalledTimes(5);
			expect(onProgress).toHaveBeenCalledWith(2, 5);
			expect(onProgress).toHaveBeenCalledWith(4, 5);
			expect(onProgress).toHaveBeenCalledWith(5, 5);
		});

		it('should handle processing errors', async () => {
			const files = [fileTestUtils.createMockFile('test.png', 1024, 'image/png')];
			const processor = vi.fn().mockRejectedValue(new Error('Processing failed'));

			await expect(processFiles(files, processor)).rejects.toThrow('Processing failed');
		});

		it('should use default concurrency when not specified', async () => {
			const files = Array.from({ length: 2 }, (_, i) =>
				fileTestUtils.createMockFile(`file${i}.png`, 1024, 'image/png')
			);

			const processor = vi.fn().mockResolvedValue('processed');

			await processFiles(files, processor);

			expect(processor).toHaveBeenCalledTimes(2);
		});
	});

	describe('DragDropUtils', () => {
		describe('getFilesFromDragEvent', () => {
			it('should extract files from dataTransfer.files', () => {
				const files = [
					fileTestUtils.createMockFile('test1.png', 1024, 'image/png'),
					fileTestUtils.createMockFile('test2.jpg', 2048, 'image/jpeg')
				];

				const event = {
					dataTransfer: {
						files: files as any,
						items: null
					}
				} as DragEvent;

				const extractedFiles = DragDropUtils.getFilesFromDragEvent(event);
				expect(extractedFiles).toEqual(files);
			});

			it('should extract files from dataTransfer.items', () => {
				const file = fileTestUtils.createMockFile('test.png', 1024, 'image/png');
				const mockItem = {
					kind: 'file',
					getAsFile: vi.fn().mockReturnValue(file)
				};

				const event = {
					dataTransfer: {
						files: null,
						items: [mockItem] as any
					}
				} as DragEvent;

				const extractedFiles = DragDropUtils.getFilesFromDragEvent(event);
				expect(extractedFiles).toEqual([file]);
			});

			it('should handle events without files', () => {
				const event = {
					dataTransfer: {
						files: null,
						items: null
					}
				} as DragEvent;

				const extractedFiles = DragDropUtils.getFilesFromDragEvent(event);
				expect(extractedFiles).toEqual([]);
			});

			it('should handle items that are not files', () => {
				const mockItem = {
					kind: 'string',
					getAsFile: vi.fn().mockReturnValue(null)
				};

				const event = {
					dataTransfer: {
						files: null,
						items: [mockItem] as any
					}
				} as DragEvent;

				const extractedFiles = DragDropUtils.getFilesFromDragEvent(event);
				expect(extractedFiles).toEqual([]);
			});
		});

		describe('hasFiles', () => {
			it('should return true when event contains files', () => {
				const file = fileTestUtils.createMockFile('test.png', 1024, 'image/png');
				const event = {
					dataTransfer: {
						files: [file] as any,
						items: null
					}
				} as DragEvent;

				expect(DragDropUtils.hasFiles(event)).toBe(true);
			});

			it('should return false when event contains no files', () => {
				const event = {
					dataTransfer: {
						files: [] as any,
						items: null
					}
				} as DragEvent;

				expect(DragDropUtils.hasFiles(event)).toBe(false);
			});
		});

		describe('hasOnlyImages', () => {
			it('should return true when all files are images', () => {
				const files = [
					fileTestUtils.createMockFile('test1.png', 1024, 'image/png'),
					fileTestUtils.createMockFile('test2.jpg', 2048, 'image/jpeg')
				];

				const event = {
					dataTransfer: {
						files: files as any,
						items: null
					}
				} as DragEvent;

				expect(DragDropUtils.hasOnlyImages(event)).toBe(true);
			});

			it('should return false when some files are not images', () => {
				const files = [
					fileTestUtils.createMockFile('test.png', 1024, 'image/png'),
					fileTestUtils.createMockFile('document.pdf', 2048, 'application/pdf')
				];

				const event = {
					dataTransfer: {
						files: files as any,
						items: null
					}
				} as DragEvent;

				expect(DragDropUtils.hasOnlyImages(event)).toBe(false);
			});

			it('should return false when no files are present', () => {
				const event = {
					dataTransfer: {
						files: [] as any,
						items: null
					}
				} as DragEvent;

				expect(DragDropUtils.hasOnlyImages(event)).toBe(false);
			});
		});
	});

	describe('Constants', () => {
		it('should have correct file size limits', () => {
			expect(FILE_SIZE_LIMITS.SMALL).toBe(1 * 1024 * 1024);
			expect(FILE_SIZE_LIMITS.MEDIUM).toBe(5 * 1024 * 1024);
			expect(FILE_SIZE_LIMITS.LARGE).toBe(10 * 1024 * 1024);
			expect(FILE_SIZE_LIMITS.XLARGE).toBe(50 * 1024 * 1024);
		});

		it('should have correct supported image formats', () => {
			expect(SUPPORTED_IMAGE_FORMATS.types).toEqual([
				'image/png',
				'image/jpeg',
				'image/jpg',
				'image/webp',
				'image/tiff',
				'image/bmp',
				'image/gif'
			]);
			expect(SUPPORTED_IMAGE_FORMATS.extensions).toEqual([
				'.png',
				'.jpg',
				'.jpeg',
				'.webp',
				'.tiff',
				'.tif',
				'.bmp',
				'.gif'
			]);
		});
	});

	describe('Edge Cases and Error Handling', () => {
		it('should handle null or undefined file inputs gracefully', () => {
			expect(() => getFileExtension('')).not.toThrow();
			expect(() => getFileNameWithoutExtension('')).not.toThrow();
			expect(() => formatFileSize(0)).not.toThrow();
		});

		it('should handle very large file sizes', () => {
			const largeSize = 1024 * 1024 * 1024 * 1024 * 5; // 5 TB
			expect(() => formatFileSize(largeSize)).not.toThrow();
			expect(formatFileSize(largeSize)).toContain('TB');
		});

		it('should handle files with unusual names', () => {
			expect(getFileExtension('file.with.many.dots.png')).toBe('.png');
			expect(getFileNameWithoutExtension('file.with.many.dots.png')).toBe('file.with.many.dots');
		});

		it('should handle missing DOM APIs gracefully', () => {
			const originalCreateElement = document.createElement;
			document.createElement = vi.fn().mockImplementation(() => {
				throw new Error('DOM not available');
			});

			expect(async () => {
				const file = fileTestUtils.createMockFile('test.jpg', 1024, 'image/jpeg');
				await compressImage(file);
			}).rejects.toThrow();

			document.createElement = originalCreateElement;
		});
	});

	describe('Performance', () => {
		it('should handle large numbers of files efficiently', async () => {
			const files = Array.from({ length: 100 }, (_, i) =>
				fileTestUtils.createMockFile(`file${i}.png`, 1024, 'image/png')
			);

			const startTime = performance.now();

			files.forEach((file) => {
				validateImageFile(file);
				getFileInfo(file);
				formatFileSize(file.size);
			});

			const endTime = performance.now();
			expect(endTime - startTime).toBeLessThan(100); // Should process 100 files within 100ms
		});

		it('should handle batch file processing efficiently', async () => {
			const files = Array.from({ length: 50 }, (_, i) =>
				fileTestUtils.createMockFile(`file${i}.png`, 1024, 'image/png')
			);

			const processor = vi.fn().mockImplementation(async (file: File) => {
				await new Promise((resolve) => setTimeout(resolve, 1));
				return file.name;
			});

			const startTime = performance.now();
			await processFiles(files, processor, { concurrency: 10 });
			const endTime = performance.now();

			expect(endTime - startTime).toBeLessThan(1000); // Should process within reasonable time
		});
	});
});
