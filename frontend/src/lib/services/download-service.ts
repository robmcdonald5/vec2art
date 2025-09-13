/**
 * Download Service
 *
 * Handles downloading converted images in multiple formats (SVG, WebP)
 * with proper filename handling and error management.
 */

import { browser } from '$app/environment';
import { SvgToWebPConverter } from './svg-to-webp-converter';
import type { WebPConversionOptions } from './svg-to-webp-converter';

export type DownloadFormat = 'svg' | 'webp';

export interface DownloadOptions {
	format: DownloadFormat;
	filename: string;
	webpOptions?: WebPConversionOptions;
}

export interface DownloadResult {
	success: boolean;
	filename: string;
	format: DownloadFormat;
	fileSizeKB: number;
	error?: string;
}

export class DownloadService {
	private webpConverter: SvgToWebPConverter | null = null;

	constructor() {
		// Don't initialize WebP converter on server-side
		if (browser) {
			this.webpConverter = new SvgToWebPConverter();
		}
	}

	private ensureWebPConverter(): SvgToWebPConverter {
		if (!this.webpConverter) {
			if (!browser) {
				throw new Error('WebP conversion is only available in browser environment');
			}
			this.webpConverter = new SvgToWebPConverter();
		}
		return this.webpConverter;
	}

	/**
	 * Download SVG content in the specified format
	 */
	async downloadSvg(svgContent: string, options: DownloadOptions): Promise<DownloadResult> {
		try {
			const { format, filename, webpOptions } = options;

			if (format === 'svg') {
				return this.downloadAsSvg(svgContent, filename);
			} else if (format === 'webp') {
				return this.downloadAsWebP(svgContent, filename, webpOptions);
			} else {
				throw new Error(`Unsupported format: ${format}`);
			}
		} catch (error) {
			console.error('Download failed:', error);
			return {
				success: false,
				filename: options.filename,
				format: options.format,
				fileSizeKB: 0,
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}
	}

	/**
	 * Download as SVG file
	 */
	private downloadAsSvg(svgContent: string, baseFilename: string): DownloadResult {
		const filename = this.ensureExtension(baseFilename, 'svg');
		const blob = new Blob([svgContent], { type: 'image/svg+xml' });
		const fileSizeKB = Math.round(blob.size / 1024);

		this.triggerDownload(blob, filename);

		return {
			success: true,
			filename,
			format: 'svg',
			fileSizeKB
		};
	}

	/**
	 * Download as WebP file
	 */
	private async downloadAsWebP(
		svgContent: string,
		baseFilename: string,
		webpOptions?: WebPConversionOptions
	): Promise<DownloadResult> {
		const filename = this.ensureExtension(baseFilename, 'webp');

		// Default options optimized for download (higher quality than preview)
		const options: WebPConversionOptions = {
			quality: 0.9, // Higher quality for download
			maxWidth: 4096, // Higher resolution for download
			maxHeight: 4096,
			scaleFactor: 1,
			...webpOptions
		};

		const webpConverter = this.ensureWebPConverter();
		const result = await webpConverter.convertSvgToWebP(svgContent, options);

		// Convert data URL to blob
		const response = await fetch(result.webpDataUrl);
		const blob = await response.blob();
		const fileSizeKB = Math.round(blob.size / 1024);

		this.triggerDownload(blob, filename);

		return {
			success: true,
			filename,
			format: 'webp',
			fileSizeKB
		};
	}

	/**
	 * Trigger browser download
	 */
	private triggerDownload(blob: Blob, filename: string): void {
		if (!browser) {
			throw new Error('Download is only available in browser environment');
		}

		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');

		link.href = url;
		link.download = filename;

		// Temporarily add to DOM to trigger download
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		// Clean up object URL
		URL.revokeObjectURL(url);
	}

	/**
	 * Ensure filename has the correct extension
	 */
	private ensureExtension(filename: string, extension: string): string {
		// Remove any existing extension
		const baseFilename = filename.replace(/\.[^/.]+$/, '');
		return `${baseFilename}.${extension}`;
	}

	/**
	 * Get estimated file sizes for both formats
	 */
	getFileSizeEstimates(svgContent: string): { svgKB: number; estimatedWebPKB: number } {
		const svgKB = Math.round(new Blob([svgContent]).size / 1024);

		// WebP is typically 60-80% smaller than SVG for typical line art
		// But can vary greatly depending on SVG complexity
		const estimatedWebPKB = Math.max(1, Math.round(svgKB * 0.25));

		return { svgKB, estimatedWebPKB };
	}

	/**
	 * Check if WebP is supported in current browser
	 */
	static isWebPSupported(): boolean {
		if (!browser) return false;

		const canvas = document.createElement('canvas');
		canvas.width = 1;
		canvas.height = 1;
		return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
	}
}

// Export singleton instance
export const downloadService = new DownloadService();
