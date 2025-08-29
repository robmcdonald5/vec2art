/**
 * File validation utilities for image uploads
 */

export const ALLOWED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/bmp', 'image/gif', 'image/avif'];
export const BLOCKED_FORMATS = ['image/svg+xml'];
export const MAX_FILE_SIZE = 1 * 1024 * 1024 * 1024; // 1GB
export const LARGE_FILE_WARNING_SIZE = 10 * 1024 * 1024; // 10MB

export interface ValidationResult {
	isValid: boolean;
	error?: string;
	warning?: string;
}

/**
 * Validate a single image file
 */
export function validateImageFile(file: File): ValidationResult {
	// Check if it's an SVG (blocked format)
	if (BLOCKED_FORMATS.includes(file.type)) {
		return {
			isValid: false,
			error: `SVG files cannot be used as source images. Please upload JPG, PNG, WebP, TIFF, BMP, GIF, or AVIF files.`
		};
	}

	// Check if it's an allowed format
	if (!ALLOWED_IMAGE_FORMATS.includes(file.type)) {
		// Also check file extension as fallback
		const extension = file.name.split('.').pop()?.toLowerCase();
		const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'tiff', 'tif', 'bmp', 'gif', 'avif'];

		if (!extension || !validExtensions.includes(extension)) {
			return {
				isValid: false,
				error: `Unsupported file format. Please use: JPG, PNG, WebP, TIFF, BMP, GIF, or AVIF`
			};
		}
	}

	// Check file size
	if (file.size > MAX_FILE_SIZE) {
		const sizeGB = (file.size / (1024 * 1024 * 1024)).toFixed(1);
		return {
			isValid: false,
			error: `File too large (${sizeGB}GB). Maximum size is 1GB.`
		};
	}

	// Check for large file warning
	if (file.size > LARGE_FILE_WARNING_SIZE) {
		const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
		return {
			isValid: true,
			warning: `Large file detected (${sizeMB}MB). Processing time may be significantly longer than usual.`
		};
	}

	return { isValid: true };
}

/**
 * Validate multiple image files
 */
export function validateImageFiles(files: File[]): {
	validFiles: File[];
	errors: Array<{ file: string; error: string }>;
	warnings: Array<{ file: string; warning: string }>;
} {
	const validFiles: File[] = [];
	const errors: Array<{ file: string; error: string }> = [];
	const warnings: Array<{ file: string; warning: string }> = [];

	for (const file of files) {
		const result = validateImageFile(file);
		if (result.isValid) {
			validFiles.push(file);
			if (result.warning) {
				warnings.push({
					file: file.name,
					warning: result.warning
				});
			}
		} else {
			errors.push({
				file: file.name,
				error: result.error || 'Unknown error'
			});
		}
	}

	return { validFiles, errors, warnings };
}

/**
 * Get human-readable file format from MIME type
 */
export function getFileFormat(mimeType: string): string {
	switch (mimeType) {
		case 'image/jpeg':
			return 'JPEG';
		case 'image/png':
			return 'PNG';
		case 'image/webp':
			return 'WebP';
		case 'image/tiff':
			return 'TIFF';
		case 'image/bmp':
			return 'BMP';
		case 'image/gif':
			return 'GIF';
		case 'image/avif':
			return 'AVIF';
		case 'image/svg+xml':
			return 'SVG';
		default:
			return 'Unknown';
	}
}
