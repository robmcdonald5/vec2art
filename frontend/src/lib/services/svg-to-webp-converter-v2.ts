/**
 * SVG to WebP Converter V2 - Hybrid Architecture
 *
 * Uses a hybrid approach to work around Web Worker limitations:
 * 1. Main thread: SVG loading and rendering to ImageData
 * 2. Web Worker: ImageData to WebP conversion using OffscreenCanvas
 *
 * This provides performance benefits while avoiding DOM API limitations in workers.
 */

import { browser } from '$app/environment';

export interface WebPProgressCallback {
	(stage: string, percent: number): void;
}

export interface WebPConversionOptions {
	quality?: number;
	maxWidth?: number;
	maxHeight?: number;
	scaleFactor?: number;
	progressive?: boolean;
	useWorker?: boolean;
	onProgress?: WebPProgressCallback;
}

export interface WebPResult {
	webpDataUrl: string;
	originalWidth: number;
	originalHeight: number;
	compressionRatio: number;
	conversionTimeMs: number;
}

// Worker message interfaces
interface ImageDataRequest {
	id: string;
	imageData: ImageData;
	quality: number;
}

interface ImageDataResponse {
	id: string;
	success: boolean;
	webpDataUrl?: string;
	error?: string;
}

export class SvgToWebPConverterV2 {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private worker: Worker | null = null;
	private workerSupported: boolean;
	private workerPromises = new Map<string, { resolve: Function; reject: Function }>();

	constructor() {
		if (!browser) {
			throw new Error('SvgToWebPConverter is only available in browser environment');
		}

		this.canvas = document.createElement('canvas');
		const ctx = this.canvas.getContext('2d');
		if (!ctx) {
			throw new Error('Canvas 2D context not available');
		}
		this.ctx = ctx;

		// Check OffscreenCanvas and Web Worker support
		this.workerSupported = this.checkWorkerSupport();

		if (this.workerSupported) {
			this.initializeWorker();
		}

		console.log('[WebPConverterV2] Initialized with worker support:', this.workerSupported);
	}

	private checkWorkerSupport(): boolean {
		try {
			return (
				typeof OffscreenCanvas !== 'undefined' &&
				typeof Worker !== 'undefined' &&
				'convertToBlob' in OffscreenCanvas.prototype
			);
		} catch {
			return false;
		}
	}

	private async initializeWorker(): Promise<void> {
		try {
			// Create a simple worker for ImageData to WebP conversion
			const workerCode = `
        class ImageDataToWebPConverter {
          private canvas: OffscreenCanvas | null = null;
          private ctx: OffscreenCanvasRenderingContext2D | null = null;

          constructor() {
            this.canvas = new OffscreenCanvas(1, 1);
            this.ctx = this.canvas.getContext('2d');
          }

          async convertImageDataToWebP(imageData, quality) {
            if (!this.canvas || !this.ctx) {
              throw new Error('OffscreenCanvas not available');
            }

            // Set canvas size to match ImageData
            this.canvas.width = imageData.width;
            this.canvas.height = imageData.height;

            // Put ImageData onto canvas
            this.ctx.putImageData(imageData, 0, 0);

            // Convert to WebP blob
            const blob = await this.canvas.convertToBlob({
              type: 'image/webp',
              quality: quality
            });

            // Convert blob to data URL
            const reader = new FileReader();
            return new Promise((resolve, reject) => {
              reader.onload = () => resolve(reader.result);
              reader.onerror = () => reject(new Error('Failed to convert blob to data URL'));
              reader.readAsDataURL(blob);
            });
          }
        }

        const converter = new ImageDataToWebPConverter();

        self.onmessage = async (event) => {
          const { id, imageData, quality } = event.data;
          
          try {
            const webpDataUrl = await converter.convertImageDataToWebP(imageData, quality);
            self.postMessage({ id, success: true, webpDataUrl });
          } catch (error) {
            self.postMessage({ id, success: false, error: error.message });
          }
        };
      `;

			const blob = new Blob([workerCode], { type: 'application/javascript' });
			this.worker = new Worker(URL.createObjectURL(blob));

			this.worker.onmessage = (event: MessageEvent<ImageDataResponse>) => {
				this.handleWorkerMessage(event.data);
			};

			this.worker.onerror = (error) => {
				console.error('[WebPConverterV2] Worker error:', error);
				this.workerSupported = false;
				this.worker = null;
			};
		} catch (error) {
			console.warn('[WebPConverterV2] Failed to initialize worker:', error);
			this.workerSupported = false;
			this.worker = null;
		}
	}

	private handleWorkerMessage(response: ImageDataResponse): void {
		const promise = this.workerPromises.get(response.id);

		if (!promise) {
			console.warn('[WebPConverterV2] Received response for unknown request:', response.id);
			return;
		}

		this.workerPromises.delete(response.id);

		if (response.success && response.webpDataUrl) {
			promise.resolve(response.webpDataUrl);
		} else {
			promise.reject(new Error(response.error || 'Unknown worker error'));
		}
	}

	private generateRequestId(): string {
		return `webp-v2-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	async convertSvgToWebP(
		svgContent: string,
		options: WebPConversionOptions = {}
	): Promise<WebPResult> {
		const startTime = performance.now();

		const {
			quality = 0.8,
			maxWidth = 2048,
			maxHeight = 2048,
			scaleFactor = window.devicePixelRatio || 1,
			progressive: _progressive = true,
			useWorker = true,
			onProgress
		} = options;

		// Always do SVG loading and rendering on main thread
		onProgress?.('Parsing SVG dimensions', 10);

		try {
			// Get SVG dimensions
			const dimensions = await this.getSvgDimensions(svgContent);

			onProgress?.('Calculating optimal size', 20);

			// Calculate optimal canvas size
			const canvasSize = this.calculateOptimalSize(
				dimensions.width,
				dimensions.height,
				maxWidth,
				maxHeight,
				scaleFactor
			);

			onProgress?.('Preparing canvas', 30);

			// Set up main thread canvas
			this.canvas.width = canvasSize.width;
			this.canvas.height = canvasSize.height;
			this.ctx.imageSmoothingEnabled = true;
			this.ctx.imageSmoothingQuality = 'high';
			this.ctx.fillStyle = '#ffffff';
			this.ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

			onProgress?.('Loading SVG image', 40);

			// Load SVG on main thread (where Image is available)
			const svgImage = await this.loadSvgAsImage(svgContent);

			onProgress?.('Rendering to canvas', 60);

			// Render SVG to canvas on main thread
			this.ctx.drawImage(
				svgImage,
				0,
				0,
				dimensions.width,
				dimensions.height,
				0,
				0,
				canvasSize.width,
				canvasSize.height
			);

			// Get ImageData from rendered canvas
			const imageData = this.ctx.getImageData(0, 0, canvasSize.width, canvasSize.height);

			onProgress?.('Converting to WebP', 80);

			// Convert ImageData to WebP (worker or main thread)
			let webpDataUrl: string;

			if (useWorker && this.workerSupported && this.worker) {
				webpDataUrl = await this.convertImageDataWithWorker(imageData, quality);
			} else {
				webpDataUrl = await this.convertImageDataOnMainThread(imageData, quality);
			}

			const conversionTime = performance.now() - startTime;

			// Calculate compression ratio
			const originalSizeBytes = svgContent.length * 2;
			const webpSizeBytes = (webpDataUrl.length - 'data:image/webp;base64,'.length) * 0.75;
			const compressionRatio = originalSizeBytes / webpSizeBytes;

			onProgress?.('Complete', 100);

			console.log('[WebPConverterV2] Conversion complete:', {
				method: useWorker && this.workerSupported ? 'worker' : 'main-thread',
				conversionTimeMs: Math.round(conversionTime),
				compressionRatio: compressionRatio.toFixed(2) + 'x',
				webpSize: `${Math.round(webpSizeBytes / 1024)}KB`
			});

			return {
				webpDataUrl,
				originalWidth: dimensions.width,
				originalHeight: dimensions.height,
				compressionRatio: Number(compressionRatio.toFixed(2)),
				conversionTimeMs: Math.round(conversionTime)
			};
		} catch (error) {
			const conversionTime = performance.now() - startTime;
			console.error('[WebPConverterV2] Conversion failed:', error);
			throw new Error(`WebP conversion failed after ${Math.round(conversionTime)}ms: ${error}`);
		}
	}

	private async convertImageDataWithWorker(imageData: ImageData, quality: number): Promise<string> {
		if (!this.worker) {
			throw new Error('Worker not available');
		}

		const requestId = this.generateRequestId();

		const resultPromise = new Promise<string>((resolve, reject) => {
			this.workerPromises.set(requestId, { resolve, reject });
		});

		// Send ImageData to worker
		const request: ImageDataRequest = {
			id: requestId,
			imageData,
			quality
		};

		this.worker.postMessage(request);

		try {
			return await resultPromise;
		} catch (error) {
			this.workerPromises.delete(requestId);
			throw error;
		}
	}

	private async convertImageDataOnMainThread(
		imageData: ImageData,
		quality: number
	): Promise<string> {
		// Create a temporary canvas for WebP conversion
		const tempCanvas = document.createElement('canvas');
		tempCanvas.width = imageData.width;
		tempCanvas.height = imageData.height;

		const tempCtx = tempCanvas.getContext('2d');
		if (!tempCtx) {
			throw new Error('Failed to get canvas context');
		}

		// Put ImageData onto canvas
		tempCtx.putImageData(imageData, 0, 0);

		// Convert to WebP
		return tempCanvas.toDataURL('image/webp', quality);
	}

	// Reuse existing helper methods from the original converter
	private async getSvgDimensions(svgContent: string): Promise<{ width: number; height: number }> {
		// Same implementation as original
		const viewBoxMatch = svgContent.match(/viewBox\\s*=\\s*['"]([^'"]+)['"]/i);
		const widthMatch = svgContent.match(/width\\s*=\\s*['"]([^'"]+)['"]/i);
		const heightMatch = svgContent.match(/height\\s*=\\s*['"]([^'"]+)['"]/i);

		if (viewBoxMatch) {
			const viewBoxValues = viewBoxMatch[1].split(/[\\s,]+/).map(Number);
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
				let processedSvg = svgContent;
				if (!processedSvg.includes('xmlns="http://www.w3.org/2000/svg"')) {
					processedSvg = processedSvg.replace(
						/<svg([^>]*?)>/i,
						'<svg xmlns="http://www.w3.org/2000/svg"$1>'
					);
				}

				const blob = new Blob([processedSvg], { type: 'image/svg+xml;charset=utf-8' });
				const url = URL.createObjectURL(blob);

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

				img.crossOrigin = 'anonymous';
				img.src = url;
			} catch (error) {
				reject(error);
			}
		});
	}

	static isWorkerSupported(): boolean {
		try {
			return (
				typeof OffscreenCanvas !== 'undefined' &&
				typeof Worker !== 'undefined' &&
				'convertToBlob' in OffscreenCanvas.prototype
			);
		} catch {
			return false;
		}
	}

	static getOptimalSettings(svgContent: string): WebPConversionOptions {
		const size = svgContent.length;

		if (size > 1000000) {
			return {
				quality: 0.75,
				maxWidth: 1920,
				maxHeight: 1920,
				progressive: true,
				useWorker: true // Now works with hybrid approach
			};
		} else if (size > 500000) {
			return {
				quality: 0.8,
				maxWidth: 2048,
				maxHeight: 2048,
				progressive: true,
				useWorker: true
			};
		} else {
			return {
				quality: 0.85,
				maxWidth: 2560,
				maxHeight: 2560,
				progressive: false,
				useWorker: false
			};
		}
	}

	dispose(): void {
		if (this.worker) {
			console.log('[WebPConverterV2] Terminating worker');
			this.worker.terminate();
			this.worker = null;
		}

		for (const [_id, promise] of this.workerPromises.entries()) {
			promise.reject(new Error('Converter disposed'));
		}
		this.workerPromises.clear();
	}
}
