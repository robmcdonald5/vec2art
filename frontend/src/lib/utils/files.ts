/**
 * File handling utilities for the vec2art frontend application
 */

export interface FileValidationResult {
	isValid: boolean;
	error?: string;
	warnings?: string[];
}

export interface FileInfo {
	name: string;
	size: number;
	type: string;
	lastModified: number;
	extension: string;
	isImage: boolean;
}

/**
 * Validate file for image processing
 */
export function validateImageFile(
	file: File,
	options: {
		maxSize?: number;
		allowedTypes?: string[];
		allowedExtensions?: string[];
	} = {}
): FileValidationResult {
	const {
		maxSize = 1 * 1024 * 1024 * 1024, // 1GB default
		allowedTypes = [
			'image/png',
			'image/jpeg',
			'image/jpg',
			'image/webp',
			'image/tiff',
			'image/bmp',
			'image/gif',
			'image/avif'
		],
		allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.tiff', '.tif', '.bmp', '.gif', '.avif']
	} = options;

	const warnings: string[] = [];

	// Check file type
	if (!allowedTypes.includes(file.type)) {
		return {
			isValid: false,
			error: `Unsupported file type: ${file.type}. Supported types: ${allowedTypes.join(', ')}`
		};
	}

	// Check file extension
	const extension = getFileExtension(file.name).toLowerCase();
	if (!allowedExtensions.includes(extension)) {
		return {
			isValid: false,
			error: `Unsupported file extension: ${extension}. Supported extensions: ${allowedExtensions.join(', ')}`
		};
	}

	// Check file size
	if (file.size > maxSize) {
		return {
			isValid: false,
			error: `File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(maxSize)})`
		};
	}

	// Add warnings for edge cases
	if (file.size < 1024) {
		warnings.push('File is very small and may not contain enough detail for processing');
	}

	if (file.size > 10 * 1024 * 1024) {
		const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
		warnings.push(
			`Large file detected (${sizeMB}MB). Processing time may be significantly longer than usual.`
		);
	}

	return {
		isValid: true,
		warnings: warnings.length > 0 ? warnings : undefined
	};
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
	const lastDotIndex = filename.lastIndexOf('.');
	return lastDotIndex === -1 ? '' : filename.substring(lastDotIndex);
}

/**
 * Get filename without extension
 */
export function getFileNameWithoutExtension(filename: string): string {
	const lastDotIndex = filename.lastIndexOf('.');
	return lastDotIndex === -1 ? filename : filename.substring(0, lastDotIndex);
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 B';

	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Get comprehensive file information
 */
export function getFileInfo(file: File): FileInfo {
	const extension = getFileExtension(file.name);
	const isImage = file.type.startsWith('image/');

	return {
		name: file.name,
		size: file.size,
		type: file.type,
		lastModified: file.lastModified,
		extension,
		isImage
	};
}

/**
 * Read file as data URL
 */
export function readFileAsDataURL(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = () => {
			if (typeof reader.result === 'string') {
				resolve(reader.result);
			} else {
				reject(new Error('Failed to read file as data URL'));
			}
		};

		reader.onerror = () => {
			reject(new Error('Error reading file'));
		};

		reader.readAsDataURL(file);
	});
}

/**
 * Read file as array buffer
 */
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = () => {
			if (reader.result instanceof ArrayBuffer) {
				resolve(reader.result);
			} else {
				reject(new Error('Failed to read file as array buffer'));
			}
		};

		reader.onerror = () => {
			reject(new Error('Error reading file'));
		};

		reader.readAsArrayBuffer(file);
	});
}

/**
 * Read file as text
 */
export function readFileAsText(file: File, encoding: string = 'UTF-8'): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = () => {
			if (typeof reader.result === 'string') {
				resolve(reader.result);
			} else {
				reject(new Error('Failed to read file as text'));
			}
		};

		reader.onerror = () => {
			reject(new Error('Error reading file'));
		};

		reader.readAsText(file, encoding);
	});
}

/**
 * Check if browser supports File API
 */
export function supportsFileAPI(): boolean {
	return !!(window.File && window.FileReader && window.FileList && window.Blob);
}

/**
 * Check if file is likely to be processable
 */
export function isProcessableImage(file: File): boolean {
	const validation = validateImageFile(file);
	return validation.isValid;
}

/**
 * Create a File object from blob data
 */
export function createFileFromBlob(
	blob: Blob,
	filename: string,
	options: FilePropertyBag = {}
): File {
	return new File([blob], filename, {
		type: blob.type,
		lastModified: Date.now(),
		...options
	});
}

/**
 * Download file from blob
 */
export function downloadBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.style.display = 'none';

	document.body.appendChild(a as Node);
	a.click();
	document.body.removeChild(a as Node);

	// Clean up the URL object
	setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Download text content as file
 */
export function downloadTextAsFile(
	content: string,
	filename: string,
	mimeType: string = 'text/plain'
): void {
	const blob = new Blob([content], { type: mimeType });
	downloadBlob(blob, filename);
}

/**
 * Compress image file (basic implementation)
 */
export async function compressImage(
	file: File,
	options: {
		maxWidth?: number;
		maxHeight?: number;
		quality?: number;
		outputType?: string;
	} = {}
): Promise<File> {
	const { maxWidth = 1920, maxHeight = 1080, quality = 0.8, outputType = 'image/jpeg' } = options;

	return new Promise((resolve, reject) => {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		const img = new Image();

		img.onload = () => {
			// Calculate new dimensions
			let { width, height } = img;

			if (width > maxWidth) {
				height = (height * maxWidth) / width;
				width = maxWidth;
			}

			if (height > maxHeight) {
				width = (width * maxHeight) / height;
				height = maxHeight;
			}

			canvas.width = width;
			canvas.height = height;

			// Draw and compress
			ctx?.drawImage(img, 0, 0, width, height);

			canvas.toBlob(
				(blob) => {
					if (blob) {
						const compressedFile = createFileFromBlob(
							blob,
							getFileNameWithoutExtension(file.name) + '.' + outputType.split('/')[1],
							{ type: outputType }
						);
						resolve(compressedFile);
					} else {
						reject(new Error('Failed to compress image'));
					}
				},
				outputType,
				quality
			);
		};

		img.onerror = () => {
			reject(new Error('Failed to load image for compression'));
		};

		img.src = URL.createObjectURL(file);
	});
}

/**
 * Get MIME type from file extension
 */
export function getMimeTypeFromExtension(extension: string): string {
	const mimeTypes: Record<string, string> = {
		'.png': 'image/png',
		'.jpg': 'image/jpeg',
		'.jpeg': 'image/jpeg',
		'.webp': 'image/webp',
		'.gif': 'image/gif',
		'.bmp': 'image/bmp',
		'.svg': 'image/svg+xml',
		'.ico': 'image/x-icon',
		'.tiff': 'image/tiff',
		'.tif': 'image/tiff'
	};

	return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

/**
 * Batch process multiple files
 */
export async function processFiles<T>(
	files: File[],
	processor: (file: File, index: number) => Promise<T>,
	options: {
		concurrency?: number;
		onProgress?: (completed: number, total: number) => void;
	} = {}
): Promise<T[]> {
	const { concurrency = 3, onProgress } = options;
	const results: T[] = [];
	let completed = 0;

	// Process files in batches
	for (let i = 0; i < files.length; i += concurrency) {
		const batch = files.slice(i, i + concurrency);
		const batchPromises = batch.map((file, batchIndex) => processor(file, i + batchIndex));

		const batchResults = await Promise.all(batchPromises);
		results.push(...batchResults);

		completed += batch.length;
		onProgress?.(completed, files.length);
	}

	return results;
}

/**
 * File utilities for drag and drop
 */
export const DragDropUtils = {
	/**
	 * Extract files from drag event
	 */
	getFilesFromDragEvent(event: DragEvent): File[] {
		const files: File[] = [];

		if (event.dataTransfer?.files) {
			files.push(...Array.from(event.dataTransfer.files));
		}

		if (event.dataTransfer?.items) {
			for (const item of Array.from(event.dataTransfer.items)) {
				if (item.kind === 'file') {
					const file = item.getAsFile();
					if (file) files.push(file);
				}
			}
		}

		return files;
	},

	/**
	 * Check if drag event contains files
	 */
	hasFiles(event: DragEvent): boolean {
		return this.getFilesFromDragEvent(event).length > 0;
	},

	/**
	 * Check if drag event contains only images
	 */
	hasOnlyImages(event: DragEvent): boolean {
		const files = this.getFilesFromDragEvent(event);
		return files.length > 0 && files.every((file) => file.type.startsWith('image/'));
	}
};

/**
 * File size limits
 */
export const FILE_SIZE_LIMITS = {
	SMALL: 1 * 1024 * 1024, // 1MB
	MEDIUM: 5 * 1024 * 1024, // 5MB
	LARGE: 10 * 1024 * 1024, // 10MB
	XLARGE: 50 * 1024 * 1024, // 50MB
	MAXIMUM: 1 * 1024 * 1024 * 1024 // 1GB
} as const;

/**
 * Supported image formats
 */
export const SUPPORTED_IMAGE_FORMATS = {
	types: [
		'image/png',
		'image/jpeg',
		'image/jpg',
		'image/webp',
		'image/tiff',
		'image/bmp',
		'image/gif'
	],
	extensions: ['.png', '.jpg', '.jpeg', '.webp', '.tiff', '.tif', '.bmp', '.gif']
} as const;
