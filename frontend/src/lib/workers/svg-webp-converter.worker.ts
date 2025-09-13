/**
 * SVG to WebP Conversion Web Worker
 *
 * Handles large SVG to WebP conversion using OffscreenCanvas
 * to prevent main thread blocking and improve performance.
 *
 * Based on 2024-2025 browser optimization research.
 */

interface WebPConversionRequest {
	id: string;
	svgContent: string;
	imageData?: ImageData; // Pre-rendered image data from main thread
	dimensions: { width: number; height: number };
	options: {
		quality?: number;
		maxWidth?: number;
		maxHeight?: number;
		scaleFactor?: number;
		progressive?: boolean;
	};
}

interface WebPConversionResponse {
	id: string;
	success: boolean;
	result?: {
		webpDataUrl: string;
		originalWidth: number;
		originalHeight: number;
		compressionRatio: number;
		conversionTimeMs: number;
	};
	error?: string;
	progress?: {
		stage: string;
		percent: number;
	};
}

class OffscreenSvgToWebPConverter {
	private canvas: OffscreenCanvas | null = null;
	private ctx: OffscreenCanvasRenderingContext2D | null = null;
	private isIOSFallback = false;

	constructor() {
		// Initialize OffscreenCanvas if supported
		if (typeof OffscreenCanvas !== 'undefined') {
			this.canvas = new OffscreenCanvas(1, 1);
			this.ctx = this.canvas.getContext('2d');
		} else {
			// iOS Safari fallback mode
			this.isIOSFallback = true;
			console.log(
				'[SVGWebPConverter] iOS Safari detected - OffscreenCanvas not available, WebP conversion will be disabled'
			);
		}
	}

	async convertSvgToWebP(request: WebPConversionRequest): Promise<WebPConversionResponse> {
		const startTime = performance.now();

		try {
			// Check OffscreenCanvas support
			if (!this.canvas || !this.ctx) {
				if (this.isIOSFallback) {
					// iOS Safari fallback: Return graceful error instead of throwing
					return {
						id: request.id,
						success: false,
						error: 'WebP conversion is not supported on iOS Safari. Please use SVG export instead.'
					};
				}
				throw new Error('OffscreenCanvas not supported in this environment');
			}

			const {
				quality = 0.8,
				maxWidth = 2048,
				maxHeight = 2048,
				scaleFactor = 1,
				progressive = true
			} = request.options;

			// Send progress update
			this.sendProgress(request.id, 'Parsing SVG dimensions', 10);

			// Get SVG dimensions using optimized parsing
			const dimensions = await this.getSvgDimensions(request.svgContent);

			this.sendProgress(request.id, 'Calculating optimal size', 20);

			// Calculate optimal canvas size
			const canvasSize = this.calculateOptimalSize(
				dimensions.width,
				dimensions.height,
				maxWidth,
				maxHeight,
				scaleFactor
			);

			// Resize OffscreenCanvas
			this.canvas.width = canvasSize.width;
			this.canvas.height = canvasSize.height;

			this.sendProgress(request.id, 'Preparing canvas', 30);

			// Set high-quality rendering
			this.ctx.imageSmoothingEnabled = true;
			this.ctx.imageSmoothingQuality = 'high';

			// Clear canvas with white background
			this.ctx.fillStyle = '#ffffff';
			this.ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

			this.sendProgress(request.id, 'Loading SVG image', 40);

			// Load SVG as Image element (reliable cross-browser support)
			const svgImage = await this.loadSvgAsImage(request.svgContent);

			this.sendProgress(request.id, 'Rendering to canvas', 60);

			// Render using optimized method
			if (progressive && request.svgContent.length > 500000) {
				await this.renderProgressively(svgImage, canvasSize, dimensions, request.id);
			} else {
				this.renderDirectly(svgImage, canvasSize, dimensions);
			}

			this.sendProgress(request.id, 'Converting to WebP', 90);

			// Convert to WebP using OffscreenCanvas
			const webpBlob = await this.canvas.convertToBlob({
				type: 'image/webp',
				quality: quality
			});

			// Convert blob to data URL
			const webpDataUrl = await this.blobToDataUrl(webpBlob);
			const conversionTime = performance.now() - startTime;

			// Calculate compression ratio
			const originalSizeBytes = request.svgContent.length * 2;
			const webpSizeBytes = webpBlob.size;
			const compressionRatio = originalSizeBytes / webpSizeBytes;

			// Image cleanup is handled automatically by GC

			this.sendProgress(request.id, 'Complete', 100);

			return {
				id: request.id,
				success: true,
				result: {
					webpDataUrl,
					originalWidth: dimensions.width,
					originalHeight: dimensions.height,
					compressionRatio: Number(compressionRatio.toFixed(2)),
					conversionTimeMs: Math.round(conversionTime)
				}
			};
		} catch (error) {
			const conversionTime = performance.now() - startTime;
			console.error('[WebPWorker] Conversion failed:', error);

			return {
				id: request.id,
				success: false,
				error: `WebP conversion failed after ${Math.round(conversionTime)}ms: ${error}`
			};
		}
	}

	private sendProgress(id: string, stage: string, percent: number) {
		self.postMessage({
			id,
			success: true,
			progress: { stage, percent }
		} as WebPConversionResponse);
	}

	private async getSvgDimensions(svgContent: string): Promise<{ width: number; height: number }> {
		// Optimized dimension parsing using regex first (fastest)
		const viewBoxMatch = svgContent.match(/viewBox\s*=\s*['"]([^'"]+)['"]/i);
		const widthMatch = svgContent.match(/width\s*=\s*['"]([^'"]+)['"]/i);
		const heightMatch = svgContent.match(/height\s*=\s*['"]([^'"]+)['"]/i);

		if (viewBoxMatch) {
			const viewBoxValues = viewBoxMatch[1].split(/[\s,]+/).map(Number);
			if (viewBoxValues.length >= 4) {
				const [_x, _y, width, height] = viewBoxValues;
				if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
					return { width, height };
				}
			}
		}

		if (widthMatch && heightMatch) {
			const width = this.parseNumericValue(widthMatch[1]);
			const height = this.parseNumericValue(heightMatch[1]);
			if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
				return { width, height };
			}
		}

		// Fallback dimensions
		return { width: 1024, height: 768 };
	}

	private parseNumericValue(value: string): number {
		if (!value) return NaN;
		const cleaned = value.toString().replace(/px|pt|em|rem|%|mm|cm|in/gi, '');
		return parseFloat(cleaned);
	}

	private calculateOptimalSize(
		svgWidth: number,
		svgHeight: number,
		maxWidth: number,
		maxHeight: number,
		scaleFactor: number
	): { width: number; height: number; scale: number } {
		const targetWidth = svgWidth * scaleFactor;
		const targetHeight = svgHeight * scaleFactor;

		let scale = 1;
		let width = targetWidth;
		let height = targetHeight;

		if (width > maxWidth || height > maxHeight) {
			const scaleX = maxWidth / width;
			const scaleY = maxHeight / height;
			scale = Math.min(scaleX, scaleY);
			width = width * scale;
			height = height * scale;
		}

		return {
			width: Math.round(width),
			height: Math.round(height),
			scale: scale * scaleFactor
		};
	}

	private async loadSvgAsImage(svgContent: string): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const img = new Image();

			try {
				// Ensure SVG has proper namespace
				let processedSvg = svgContent;
				if (!processedSvg.includes('xmlns="http://www.w3.org/2000/svg"')) {
					processedSvg = processedSvg.replace(
						/<svg([^>]*?)>/i,
						'<svg xmlns="http://www.w3.org/2000/svg"$1>'
					);
				}

				// Create blob with proper MIME type
				const blob = new Blob([processedSvg], { type: 'image/svg+xml;charset=utf-8' });
				const url = URL.createObjectURL(blob);

				// Set up image loading with timeout
				const timeout = setTimeout(() => {
					URL.revokeObjectURL(url);
					reject(new Error('SVG image loading timeout (5 minutes)'));
				}, 300000);

				img.onload = () => {
					clearTimeout(timeout);
					URL.revokeObjectURL(url);
					resolve(img);
				};

				img.onerror = (error) => {
					clearTimeout(timeout);
					URL.revokeObjectURL(url);
					reject(new Error(`Failed to load SVG as image: ${error}`));
				};

				// Set CORS mode for potential external resources
				img.crossOrigin = 'anonymous';
				img.src = url;
			} catch (error) {
				reject(error);
			}
		});
	}

	private renderDirectly(
		image: HTMLImageElement,
		canvasSize: { width: number; height: number; scale: number },
		originalSize: { width: number; height: number }
	): void {
		if (!this.ctx) throw new Error('Canvas context not available');

		this.ctx.drawImage(
			image,
			0,
			0,
			originalSize.width,
			originalSize.height,
			0,
			0,
			canvasSize.width,
			canvasSize.height
		);
	}

	private async renderProgressively(
		image: HTMLImageElement,
		canvasSize: { width: number; height: number; scale: number },
		originalSize: { width: number; height: number },
		requestId: string
	): Promise<void> {
		if (!this.ctx) throw new Error('Canvas context not available');

		const chunkSize = 512;
		const chunksX = Math.ceil(canvasSize.width / chunkSize);
		const chunksY = Math.ceil(canvasSize.height / chunkSize);
		const totalChunks = chunksX * chunksY;

		for (let y = 0; y < chunksY; y++) {
			for (let x = 0; x < chunksX; x++) {
				const chunkIndex = y * chunksX + x;
				const progress = 60 + Math.round((chunkIndex / totalChunks) * 25); // 60-85% range

				const chunkX = x * chunkSize;
				const chunkY = y * chunkSize;
				const chunkW = Math.min(chunkSize, canvasSize.width - chunkX);
				const chunkH = Math.min(chunkSize, canvasSize.height - chunkY);

				const srcX = (chunkX / canvasSize.width) * originalSize.width;
				const srcY = (chunkY / canvasSize.height) * originalSize.height;
				const srcW = (chunkW / canvasSize.width) * originalSize.width;
				const srcH = (chunkH / canvasSize.height) * originalSize.height;

				this.ctx.drawImage(image, srcX, srcY, srcW, srcH, chunkX, chunkY, chunkW, chunkH);

				// Send progress update and yield control
				if (chunkIndex % 4 === 0) {
					this.sendProgress(requestId, 'Rendering progressively', progress);
					await new Promise((resolve) => setTimeout(resolve, 0));
				}
			}
		}
	}

	private async blobToDataUrl(blob: Blob): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = () => reject(new Error('Failed to convert blob to data URL'));
			reader.readAsDataURL(blob);
		});
	}
}

// Worker message handling
const converter = new OffscreenSvgToWebPConverter();

self.onmessage = async (event: MessageEvent<WebPConversionRequest>) => {
	const request = event.data;
	console.log('[WebPWorker] Starting conversion for request:', request.id);

	try {
		const response = await converter.convertSvgToWebP(request);
		self.postMessage(response);
	} catch (error) {
		console.error('[WebPWorker] Unexpected error:', error);
		self.postMessage({
			id: request.id,
			success: false,
			error: `Unexpected worker error: ${error}`
		} as WebPConversionResponse);
	}
};

// Export types for main thread
export type { WebPConversionRequest, WebPConversionResponse };
