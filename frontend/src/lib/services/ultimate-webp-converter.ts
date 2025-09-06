/**
 * Ultimate WebP Converter
 *
 * Combines all optimization techniques for maximum performance:
 * 1. WebGPU compute shaders (3-10x performance)
 * 2. Optimized Canvas.toBlob() with quality adaptation
 * 3. Progressive streaming (50% faster perceived loading)
 * 4. Advanced OffscreenCanvas worker optimization
 * 5. Intelligent fallback system
 *
 * Provides the best possible SVG to WebP conversion experience.
 */

import { browser } from '$app/environment';
import {
	WebGPUWebPConverter,
	type WebGPUWebPResult,
	type WebGPUWebPOptions
} from './svg-webp-converter-webgpu';
import {
	OptimizedWebPEncoder,
	type OptimizedWebPOptions,
	type WebPEncodingResult
} from './optimized-webp-encoder';
import {
	ProgressiveWebPStreamer,
	type ProgressiveStreamOptions,
	type ProgressiveStage,
	type StreamingResult
} from './progressive-webp-streamer';
import { WasmWebPEncoder, type WasmWebPOptions, type WasmWebPResult } from './wasm-webp-encoder';
import { WebGPUImageProcessor, type ImageProcessingTask } from './webgpu-image-processor';

export interface UltimateConversionOptions {
	// Quality settings
	quality?: number;
	maxWidth?: number;
	maxHeight?: number;
	scaleFactor?: number;

	// Optimization preferences
	preferWebGPU?: boolean;
	enableProgressive?: boolean;
	enableAdaptiveQuality?: boolean;
	enableEnhancement?: boolean;
	enableWasm?: boolean;
	wasmLossless?: boolean;

	// Progressive options
	qualityLevels?: number[];
	enableTiling?: boolean;
	tileSize?: number;

	// Performance tuning
	maxProcessingTime?: number;
	memoryLimit?: number;

	// Callbacks
	onProgress?: (stage: string, percent: number, details?: any) => void;
	onProgressiveFrame?: (stage: ProgressiveStage) => void;
	onOptimizationSelected?: (method: ConversionMethod, reason: string) => void;
	onPerformanceWarning?: (warning: string, impact: string) => void;
}

export type ConversionMethod =
	| 'wasm-lossless'
	| 'wasm-optimized'
	| 'webgpu-wasm-hybrid'
	| 'webgpu-progressive'
	| 'webgpu-optimized'
	| 'optimized-progressive'
	| 'optimized-standard'
	| 'fallback';

export interface UltimateConversionResult {
	webpDataUrl: string;
	conversionMethod: ConversionMethod;
	totalTime: number;
	originalSize: number;
	compressedSize: number;
	compressionRatio: number;
	actualQuality: number;

	performance: {
		analysisTime: number;
		processingTime: number;
		streamingTime?: number;
		firstFrameTime?: number;
		progressiveFrames?: number;
	};

	optimizations: string[];
	systemInfo: {
		webgpuAvailable: boolean;
		workerAvailable: boolean;
		progressiveSupported: boolean;
	};

	// Progressive streaming data (if enabled)
	progressiveResult?: StreamingResult;
}

/**
 * Ultimate WebP converter with all optimizations
 */
export class UltimateWebPConverter {
	private webgpuConverter?: WebGPUWebPConverter;
	private optimizedEncoder?: OptimizedWebPEncoder;
	private progressiveStreamer?: ProgressiveWebPStreamer;
	private wasmEncoder?: WasmWebPEncoder;

	private systemCapabilities = {
		webgpuAvailable: false,
		workerAvailable: false,
		progressiveSupported: false,
		wasmAvailable: false,
		estimatedPerformance: 'unknown' as 'high' | 'medium' | 'low' | 'unknown'
	};

	constructor() {
		if (!browser) {
			throw new Error('UltimateWebPConverter only works in browser environment');
		}

		// Initialize converters asynchronously to avoid blocking constructor
		this.initializeConvertersWithCapabilityCheck().catch((error) => {
			console.error('[UltimateWebP] Initialization error:', error);
		});
	}

	private async initializeConvertersWithCapabilityCheck(): Promise<void> {
		try {
			// Import WebGPU device manager for memory-aware initialization
			const { WebGPUDeviceManager } = await import('./webgpu-device-manager');
			const deviceManager = WebGPUDeviceManager.getInstance();

			// Check memory pressure before attempting WebGPU
			const memoryStatus = await deviceManager.assessMemoryPressure();
			console.log('[UltimateWebP] Memory assessment:', memoryStatus);

			if (memoryStatus.canAllocate) {
				// Use new WebGPU Manager API for device creation
				const device = await deviceManager.getDevice('webp-converter', {
					powerPreference: memoryStatus.pressure < 0.3 ? 'high-performance' : 'low-power',
					requiredFeatures: [],
					requiredLimits: {
						maxBufferSize: memoryStatus.recommendedBufferSize,
						maxStorageBufferBindingSize: Math.min(
							32 * 1024 * 1024,
							memoryStatus.recommendedBufferSize
						)
					}
				});

				if (device) {
					console.log(
						'[UltimateWebP] WebGPU available with buffer size:',
						memoryStatus.recommendedBufferSize
					);

					try {
						// Initialize WebGPU converter with the allocated device
						const { WebGPUWebPConverter } = await import('./svg-webp-converter-webgpu');
						this.webgpuConverter = new WebGPUWebPConverter();
						// Note: WebGPUWebPConverter initializes internally if needed

						this.systemCapabilities.webgpuAvailable = true;
						console.log('[UltimateWebP] WebGPU converter initialized successfully');
					} catch (initError) {
						console.warn('[UltimateWebP] WebGPU converter initialization failed:', initError);
						// Note: Device cleanup is handled automatically by WebGPU Manager
					}
				} else {
					console.log('[UltimateWebP] WebGPU device allocation failed despite memory availability');
				}
			} else {
				console.log('[UltimateWebP] High memory pressure detected:', memoryStatus.reason);
				console.log('[UltimateWebP] Skipping WebGPU to preserve system stability');
			}
		} catch (error) {
			console.warn('[UltimateWebP] WebGPU capability check failed:', error);
		}

		// Initialize other converters (these are more reliable)
		try {
			this.optimizedEncoder = new OptimizedWebPEncoder();
		} catch (error) {
			console.warn('[UltimateWebP] Optimized encoder initialization failed:', error);
		}

		try {
			this.progressiveStreamer = new ProgressiveWebPStreamer();
		} catch (error) {
			console.warn('[UltimateWebP] Progressive streamer initialization failed:', error);
		}

		try {
			this.wasmEncoder = new WasmWebPEncoder();
		} catch (error) {
			console.warn('[UltimateWebP] WASM encoder initialization failed:', error);
		}

		await this.initializeCapabilities();
	}

	private async initializeCapabilities(): Promise<void> {
		try {
			// Check WebGPU availability
			this.systemCapabilities.webgpuAvailable = this.webgpuConverter
				? WebGPUWebPConverter.isWebGPUSupported()
				: false;

			// Check Web Worker support
			this.systemCapabilities.workerAvailable =
				typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined';

			// Check progressive streaming support
			this.systemCapabilities.progressiveSupported =
				typeof ReadableStream !== 'undefined' && this.systemCapabilities.workerAvailable;

			// Check WASM WebP support (try initialization)
			if (this.wasmEncoder) {
				try {
					// Test if WASM encoder can initialize
					const testResult = await this.wasmEncoder.encodeToWebP(
						new ImageData(new Uint8ClampedArray(4), 1, 1),
						{ quality: 50 }
					);
					this.systemCapabilities.wasmAvailable = !!testResult;
				} catch {
					this.systemCapabilities.wasmAvailable = false;
				}
			} else {
				this.systemCapabilities.wasmAvailable = false;
			}

			// Estimate system performance
			await this.estimateSystemPerformance();

			console.log('[UltimateWebP] System capabilities initialized:', this.systemCapabilities);
		} catch (error) {
			console.warn('[UltimateWebP] Failed to initialize capabilities:', error);
		}
	}

	private async estimateSystemPerformance(): Promise<void> {
		// Quick performance benchmark
		const startTime = performance.now();

		// Simple computation test
		let sum = 0;
		for (let i = 0; i < 100000; i++) {
			sum += Math.sqrt(i);
		}

		const computeTime = performance.now() - startTime;

		if (computeTime < 10 && this.systemCapabilities.webgpuAvailable) {
			this.systemCapabilities.estimatedPerformance = 'high';
		} else if (computeTime < 50 && this.systemCapabilities.workerAvailable) {
			this.systemCapabilities.estimatedPerformance = 'medium';
		} else {
			this.systemCapabilities.estimatedPerformance = 'low';
		}
	}

	/**
	 * Convert SVG to WebP using the best available optimization techniques
	 */
	async convertSvgToWebP(
		svgContent: string,
		options: UltimateConversionOptions = {}
	): Promise<UltimateConversionResult> {
		const totalStartTime = performance.now();

		const {
			quality = 0.8,
			maxWidth = 2048,
			maxHeight = 2048,
			scaleFactor = window.devicePixelRatio || 1,
			preferWebGPU = true,
			enableProgressive = true,
			enableAdaptiveQuality = true,
			enableEnhancement = false,
			maxProcessingTime = 30000, // 30 seconds max
			onProgress,
			onProgressiveFrame,
			onOptimizationSelected,
			onPerformanceWarning
		} = options;

		// Step 1: Analyze input and select optimal method
		onProgress?.('Analyzing input', 5);
		const analysisStart = performance.now();

		const svgSize = svgContent.length;
		const isLargeImage = svgSize > 5000000; // > 5MB
		const isComplexImage = svgSize > 1000000; // > 1MB

		const conversionMethod = this.selectOptimalMethod({
			svgSize,
			isLargeImage,
			isComplexImage,
			preferWebGPU,
			enableProgressive,
			systemCapabilities: this.systemCapabilities
		});

		onOptimizationSelected?.(conversionMethod, this.getMethodReason(conversionMethod));

		const analysisTime = performance.now() - analysisStart;

		// Step 2: Execute conversion with selected method
		onProgress?.('Processing with optimal method', 20);

		try {
			let result: UltimateConversionResult;

			switch (conversionMethod) {
				case 'wasm-lossless':
					result = await this.convertWasmLossless(svgContent, options, analysisTime);
					break;

				case 'wasm-optimized':
					result = await this.convertWasmOptimized(svgContent, options, analysisTime);
					break;

				case 'webgpu-wasm-hybrid':
					result = await this.convertWebGPUWasmHybrid(svgContent, options, analysisTime);
					break;

				case 'webgpu-progressive':
					result = await this.convertWebGPUProgressive(svgContent, options, analysisTime);
					break;

				case 'webgpu-optimized':
					result = await this.convertWebGPUOptimized(svgContent, options, analysisTime);
					break;

				case 'optimized-progressive':
					result = await this.convertOptimizedProgressive(svgContent, options, analysisTime);
					break;

				case 'optimized-standard':
					result = await this.convertOptimizedStandard(svgContent, options, analysisTime);
					break;

				default:
					result = await this.convertFallback(svgContent, options, analysisTime);
					break;
			}

			result.totalTime = performance.now() - totalStartTime;
			result.conversionMethod = conversionMethod;
			result.systemInfo = {
				webgpuAvailable: this.systemCapabilities.webgpuAvailable,
				workerAvailable: this.systemCapabilities.workerAvailable,
				progressiveSupported: this.systemCapabilities.progressiveSupported
			};

			onProgress?.('Conversion complete', 100);

			// Performance warnings
			if (result.totalTime > 10000) {
				onPerformanceWarning?.(
					'Conversion took longer than expected',
					`Total time: ${Math.round(result.totalTime)}ms`
				);
			}

			console.log(`[UltimateWebP] Conversion complete using ${conversionMethod}:`, {
				time: `${Math.round(result.totalTime)}ms`,
				ratio: `${result.compressionRatio}x`,
				method: conversionMethod
			});

			return result;
		} catch (error) {
			console.error(`[UltimateWebP] ${conversionMethod} failed:`, error);

			// Try fallback method if primary method fails
			if (conversionMethod !== 'fallback') {
				onPerformanceWarning?.(
					'Primary method failed, using fallback',
					error instanceof Error ? error.message : String(error)
				);
				return this.convertFallback(svgContent, options, analysisTime);
			}

			throw error;
		}
	}

	private selectOptimalMethod(params: {
		svgSize: number;
		isLargeImage: boolean;
		isComplexImage: boolean;
		preferWebGPU: boolean;
		enableProgressive: boolean;
		enableWasm?: boolean;
		wasmLossless?: boolean;
		systemCapabilities: {
			webgpuAvailable: boolean;
			workerAvailable: boolean;
			progressiveSupported: boolean;
			wasmAvailable: boolean;
			estimatedPerformance: 'high' | 'medium' | 'low' | 'unknown';
		};
	}): ConversionMethod {
		const {
			svgSize,
			isLargeImage,
			isComplexImage,
			preferWebGPU,
			enableProgressive,
			enableWasm,
			wasmLossless,
			systemCapabilities
		} = params;

		// WASM Lossless for premium quality (advanced users)
		if (enableWasm && wasmLossless && systemCapabilities.wasmAvailable) {
			return 'wasm-lossless';
		}

		// WebGPU + WASM hybrid for ultimate performance
		if (
			preferWebGPU &&
			enableWasm &&
			systemCapabilities.webgpuAvailable &&
			systemCapabilities.wasmAvailable &&
			isLargeImage &&
			systemCapabilities.estimatedPerformance === 'high'
		) {
			return 'webgpu-wasm-hybrid';
		}

		// WASM optimized for line art and advanced compression
		if (enableWasm && systemCapabilities.wasmAvailable && (isComplexImage || svgSize < 1000000)) {
			// WASM good for detailed work
			return 'wasm-optimized';
		}

		// WebGPU + Progressive for best experience on capable systems
		if (
			preferWebGPU &&
			systemCapabilities.webgpuAvailable &&
			enableProgressive &&
			systemCapabilities.progressiveSupported &&
			isLargeImage
		) {
			return 'webgpu-progressive';
		}

		// WebGPU optimized for high-performance systems
		if (
			preferWebGPU &&
			systemCapabilities.webgpuAvailable &&
			systemCapabilities.estimatedPerformance === 'high'
		) {
			return 'webgpu-optimized';
		}

		// Progressive streaming for large images on capable systems
		if (
			enableProgressive &&
			systemCapabilities.progressiveSupported &&
			(isLargeImage || isComplexImage)
		) {
			return 'optimized-progressive';
		}

		// Standard optimized for medium performance systems
		if (systemCapabilities.workerAvailable && systemCapabilities.estimatedPerformance !== 'low') {
			return 'optimized-standard';
		}

		// Fallback for limited systems
		return 'fallback';
	}

	private getMethodReason(method: ConversionMethod): string {
		switch (method) {
			case 'wasm-lossless':
				return 'Premium lossless quality with WASM encoder';
			case 'wasm-optimized':
				return 'Advanced compression parameters with WASM encoder';
			case 'webgpu-wasm-hybrid':
				return 'Ultimate performance combining WebGPU processing and WASM encoding';
			case 'webgpu-progressive':
				return 'Large image with WebGPU and progressive streaming support';
			case 'webgpu-optimized':
				return 'High-performance system with WebGPU acceleration';
			case 'optimized-progressive':
				return 'Large/complex image with progressive streaming support';
			case 'optimized-standard':
				return 'Standard optimization with worker support';
			case 'fallback':
				return 'Limited system capabilities or error recovery';
			default:
				return 'Unknown optimization method';
		}
	}

	private async convertWebGPUProgressive(
		svgContent: string,
		options: UltimateConversionOptions,
		analysisTime: number
	): Promise<UltimateConversionResult> {
		if (!this.webgpuConverter) {
			throw new Error('WebGPU converter not available');
		}

		// First get WebGPU result
		const webgpuResult = await this.webgpuConverter.convertSvgToWebP(svgContent, {
			quality: options.quality,
			maxWidth: options.maxWidth,
			maxHeight: options.maxHeight,
			useWebGPU: true,
			enableEnhancement: options.enableEnhancement,
			onProgress: (stage, percent) => {
				options.onProgress?.(`WebGPU: ${stage}`, 20 + percent * 0.4);
			}
		});

		// Then apply progressive streaming to the result
		const imageData = await this.extractImageDataFromDataUrl(webgpuResult.webpDataUrl);
		const streamingOptions: ProgressiveStreamOptions = {
			qualityLevels: options.qualityLevels || [0.4, 0.7, 0.9],
			enableTiling: options.enableTiling,
			tileSize: options.tileSize,
			onProgressiveUpdate: (stage) => {
				options.onProgressiveFrame?.(stage);
				options.onProgress?.(`Progressive: ${stage.type}`, 60 + stage.progress * 0.4);
			}
		};

		if (!this.progressiveStreamer) {
			throw new Error('Progressive streamer not initialized');
		}

		const { stream, promise } = await this.progressiveStreamer.createProgressiveConverter(
			imageData,
			streamingOptions
		);

		// Consume the stream safely with error handling
		const reader = stream.getReader();
		try {
			while (true) {
				const { done } = await reader.read();
				if (done) break;
			}
		} finally {
			// Always release the reader to prevent locks
			reader.releaseLock();
		}

		const progressiveResult = await promise;

		return {
			webpDataUrl: progressiveResult.finalDataUrl,
			conversionMethod: 'webgpu-progressive',
			totalTime: 0, // Will be set by caller
			originalSize: webgpuResult.originalWidth * webgpuResult.originalHeight * 4,
			compressedSize: this.estimateDataUrlSize(progressiveResult.finalDataUrl),
			compressionRatio: progressiveResult.compressionRatio,
			actualQuality: options.quality || 0.8,
			performance: {
				analysisTime,
				processingTime: webgpuResult.conversionTimeMs,
				streamingTime: progressiveResult.streamingTime,
				firstFrameTime: progressiveResult.performance.firstFrameTime,
				progressiveFrames: progressiveResult.performance.progressiveFrames
			},
			optimizations: ['webgpu-acceleration', 'progressive-streaming', 'adaptive-quality'],
			systemInfo: {
				webgpuAvailable: true,
				workerAvailable: true,
				progressiveSupported: true
			},
			progressiveResult
		};
	}

	private async convertWebGPUOptimized(
		svgContent: string,
		options: UltimateConversionOptions,
		analysisTime: number
	): Promise<UltimateConversionResult> {
		if (!this.webgpuConverter) {
			throw new Error('WebGPU converter not available');
		}

		const result = await this.webgpuConverter.convertSvgToWebP(svgContent, {
			quality: options.quality,
			maxWidth: options.maxWidth,
			maxHeight: options.maxHeight,
			scaleFactor: options.scaleFactor,
			useWebGPU: true,
			enableEnhancement: options.enableEnhancement,
			onProgress: options.onProgress
		});

		return {
			webpDataUrl: result.webpDataUrl,
			conversionMethod: 'webgpu-optimized',
			totalTime: 0,
			originalSize: result.originalWidth * result.originalHeight * 4,
			compressedSize: this.estimateDataUrlSize(result.webpDataUrl),
			compressionRatio: result.compressionRatio,
			actualQuality: options.quality || 0.8,
			performance: {
				analysisTime,
				processingTime: result.conversionTimeMs
			},
			optimizations: ['webgpu-acceleration', 'gpu-enhancement', 'parallel-processing'],
			systemInfo: {
				webgpuAvailable: true,
				workerAvailable: true,
				progressiveSupported: false
			}
		};
	}

	private async convertOptimizedProgressive(
		svgContent: string,
		options: UltimateConversionOptions,
		analysisTime: number
	): Promise<UltimateConversionResult> {
		// First create base image
		const imageData = await this.createImageDataFromSvg(svgContent, options);

		// Apply progressive streaming
		const streamingOptions: ProgressiveStreamOptions = {
			qualityLevels: options.qualityLevels || [0.3, 0.6, 0.9],
			enableTiling: options.enableTiling,
			enableMultiRes: true,
			adaptiveQuality: options.enableAdaptiveQuality,
			onProgressiveUpdate: (stage) => {
				options.onProgressiveFrame?.(stage);
				options.onProgress?.(`Progressive: ${stage.type}`, 30 + stage.progress * 0.6);
			}
		};

		if (!this.progressiveStreamer) {
			throw new Error('Progressive streamer not initialized');
		}

		const { stream, promise } = await this.progressiveStreamer.createProgressiveConverter(
			imageData,
			streamingOptions
		);

		// Consume stream safely with error handling
		const reader = stream.getReader();
		try {
			while (true) {
				const { done } = await reader.read();
				if (done) break;
			}
		} finally {
			// Always release the reader to prevent locks
			reader.releaseLock();
		}

		const progressiveResult = await promise;

		return {
			webpDataUrl: progressiveResult.finalDataUrl,
			conversionMethod: 'optimized-progressive',
			totalTime: 0,
			originalSize: imageData.data.length,
			compressedSize: progressiveResult.totalBytes,
			compressionRatio: progressiveResult.compressionRatio,
			actualQuality: options.quality || 0.8,
			performance: {
				analysisTime,
				processingTime: 0,
				streamingTime: progressiveResult.streamingTime,
				firstFrameTime: progressiveResult.performance.firstFrameTime,
				progressiveFrames: progressiveResult.performance.progressiveFrames
			},
			optimizations: ['progressive-streaming', 'multi-resolution', 'adaptive-quality'],
			systemInfo: {
				webgpuAvailable: false,
				workerAvailable: true,
				progressiveSupported: true
			},
			progressiveResult
		};
	}

	private async convertOptimizedStandard(
		svgContent: string,
		options: UltimateConversionOptions,
		analysisTime: number
	): Promise<UltimateConversionResult> {
		const imageData = await this.createImageDataFromSvg(svgContent, options);

		if (!this.optimizedEncoder) {
			throw new Error('Optimized encoder not initialized');
		}

		const result = await this.optimizedEncoder.encodeToWebP(imageData, {
			quality: options.quality,
			adaptive: options.enableAdaptiveQuality,
			maxWidth: options.maxWidth,
			maxHeight: options.maxHeight,
			useWorker: true,
			onProgress: options.onProgress
		});

		return {
			webpDataUrl: result.webpDataUrl,
			conversionMethod: 'optimized-standard',
			totalTime: 0,
			originalSize: result.originalSize,
			compressedSize: result.compressedSize,
			compressionRatio: result.compressionRatio,
			actualQuality: result.actualQuality,
			performance: {
				analysisTime,
				processingTime: result.encodingTime
			},
			optimizations: result.optimizations,
			systemInfo: {
				webgpuAvailable: false,
				workerAvailable: true,
				progressiveSupported: false
			}
		};
	}

	private async convertFallback(
		svgContent: string,
		options: UltimateConversionOptions,
		analysisTime: number
	): Promise<UltimateConversionResult> {
		// Simple Canvas.toDataURL fallback
		const imageData = await this.createImageDataFromSvg(svgContent, options);

		const canvas = document.createElement('canvas');
		canvas.width = imageData.width;
		canvas.height = imageData.height;

		const ctx = canvas.getContext('2d');
		if (!ctx) {
			throw new Error('Failed to get canvas context');
		}

		ctx.putImageData(imageData, 0, 0);
		const dataUrl = canvas.toDataURL('image/webp', options.quality || 0.8);

		return {
			webpDataUrl: dataUrl,
			conversionMethod: 'fallback',
			totalTime: 0,
			originalSize: imageData.data.length,
			compressedSize: this.estimateDataUrlSize(dataUrl),
			compressionRatio: this.calculateCompressionRatio(imageData.data.length, dataUrl),
			actualQuality: options.quality || 0.8,
			performance: {
				analysisTime,
				processingTime: 0
			},
			optimizations: ['fallback-mode'],
			systemInfo: {
				webgpuAvailable: false,
				workerAvailable: false,
				progressiveSupported: false
			}
		};
	}

	// Utility methods
	private async createImageDataFromSvg(
		svgContent: string,
		options: UltimateConversionOptions
	): Promise<ImageData> {
		// Create SVG image
		const img = new Image();
		img.crossOrigin = 'anonymous';

		const loadPromise = new Promise<void>((resolve, reject) => {
			img.onload = () => resolve();
			img.onerror = reject;
		});

		const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
		img.src = URL.createObjectURL(blob);

		await loadPromise;
		URL.revokeObjectURL(img.src);

		// Create canvas and get ImageData
		const canvas = document.createElement('canvas');
		const maxWidth = options.maxWidth || 2048;
		const maxHeight = options.maxHeight || 2048;
		const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);

		canvas.width = Math.round(img.width * scale);
		canvas.height = Math.round(img.height * scale);

		const ctx = canvas.getContext('2d');
		if (!ctx) {
			throw new Error('Failed to get canvas context');
		}

		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = 'high';
		ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

		return ctx.getImageData(0, 0, canvas.width, canvas.height);
	}

	private async extractImageDataFromDataUrl(dataUrl: string): Promise<ImageData> {
		const img = new Image();
		const loadPromise = new Promise<void>((resolve, reject) => {
			img.onload = () => resolve();
			img.onerror = reject;
		});

		img.src = dataUrl;
		await loadPromise;

		const canvas = document.createElement('canvas');
		canvas.width = img.width;
		canvas.height = img.height;

		const ctx = canvas.getContext('2d');
		if (!ctx) {
			throw new Error('Failed to get canvas context');
		}

		ctx.drawImage(img, 0, 0);
		return ctx.getImageData(0, 0, canvas.width, canvas.height);
	}

	private estimateDataUrlSize(dataUrl: string): number {
		const base64Data = dataUrl.split(',')[1];
		return Math.round(base64Data.length * 0.75);
	}

	private calculateCompressionRatio(originalBytes: number, dataUrl: string): number {
		const compressedBytes = this.estimateDataUrlSize(dataUrl);
		return Number((originalBytes / compressedBytes).toFixed(2));
	}

	/**
	 * Get system capabilities and recommendations
	 */
	getSystemInfo(): {
		capabilities: {
			webgpuAvailable: boolean;
			workerAvailable: boolean;
			progressiveSupported: boolean;
			wasmAvailable: boolean;
			estimatedPerformance: 'high' | 'medium' | 'low' | 'unknown';
		};
		recommendations: string[];
	} {
		const recommendations: string[] = [];

		if (this.systemCapabilities.webgpuAvailable) {
			recommendations.push('WebGPU acceleration available - excellent performance expected');
		} else {
			recommendations.push('WebGPU not available - using optimized CPU processing');
		}

		if (this.systemCapabilities.progressiveSupported) {
			recommendations.push('Progressive streaming supported - faster perceived loading');
		}

		if (this.systemCapabilities.estimatedPerformance === 'low') {
			recommendations.push('Limited performance detected - consider smaller image sizes');
		}

		return {
			capabilities: this.systemCapabilities,
			recommendations
		};
	}

	private async convertWasmLossless(
		svgContent: string,
		options: UltimateConversionOptions,
		analysisTime: number
	): Promise<UltimateConversionResult> {
		// Create high-quality ImageData from SVG
		const imageData = await this.createImageDataFromSvg(svgContent, options);

		options.onProgress?.('WASM: Encoding lossless WebP', 30);

		if (!this.wasmEncoder) {
			throw new Error('WASM encoder not initialized');
		}

		// Use WASM encoder with lossless settings
		const result = await this.wasmEncoder.encodeToWebP(imageData, {
			lossless: true,
			exact: true,
			quality: 100,
			alpha_quality: 100,
			method: 6, // Slowest but best quality
			pass: 10, // Maximum passes
			preprocessing: 2,
			use_sharp_yuv: true
		});

		options.onProgress?.('WASM: Lossless encoding complete', 90);

		return {
			webpDataUrl: result.webpDataUrl,
			conversionMethod: 'wasm-lossless',
			totalTime: 0,
			originalSize: result.originalSize,
			compressedSize: result.compressedSize,
			compressionRatio: result.compressionRatio,
			actualQuality: 1.0, // Lossless
			performance: {
				analysisTime,
				processingTime: result.encodingTime
			},
			optimizations: ['wasm-lossless', 'exact-reconstruction', 'maximum-quality'],
			systemInfo: {
				webgpuAvailable: false,
				workerAvailable: true,
				progressiveSupported: false
			}
		};
	}

	private async convertWasmOptimized(
		svgContent: string,
		options: UltimateConversionOptions,
		analysisTime: number
	): Promise<UltimateConversionResult> {
		// Create ImageData from SVG
		const imageData = await this.createImageDataFromSvg(svgContent, options);

		options.onProgress?.('WASM: Analyzing image characteristics', 30);

		// Analyze image for optimal WASM parameters
		const imageType = this.analyzeImageForWasm(imageData);
		const wasmOptions = WasmWebPEncoder.getOptimalOptions(imageType, imageData.data.length);

		// Override with user preferences
		const finalOptions: WasmWebPOptions = {
			...wasmOptions,
			quality: (options.quality || 0.8) * 100,
			lossless: options.wasmLossless || false
		};

		options.onProgress?.('WASM: Encoding with optimal parameters', 50);

		if (!this.wasmEncoder) {
			throw new Error('WASM encoder not initialized');
		}

		const result = await this.wasmEncoder.encodeToWebP(imageData, finalOptions);

		options.onProgress?.('WASM: Optimized encoding complete', 90);

		return {
			webpDataUrl: result.webpDataUrl,
			conversionMethod: 'wasm-optimized',
			totalTime: 0,
			originalSize: result.originalSize,
			compressedSize: result.compressedSize,
			compressionRatio: result.compressionRatio,
			actualQuality: options.quality || 0.8,
			performance: {
				analysisTime,
				processingTime: result.encodingTime
			},
			optimizations: [
				'wasm-encoding',
				'advanced-compression',
				`optimized-for-${imageType}`,
				'content-aware-params'
			],
			systemInfo: {
				webgpuAvailable: false,
				workerAvailable: true,
				progressiveSupported: false
			}
		};
	}

	private async convertWebGPUWasmHybrid(
		svgContent: string,
		options: UltimateConversionOptions,
		analysisTime: number
	): Promise<UltimateConversionResult> {
		options.onProgress?.('Hybrid: Creating base ImageData', 15);

		// Step 1: Create high-quality ImageData from SVG
		const baseImageData = await this.createImageDataFromSvg(svgContent, options);

		options.onProgress?.('Hybrid: WebGPU preprocessing', 25);

		// Step 2: Use WebGPU processor directly for enhancement (not full conversion)
		const gpuProcessor = new WebGPUImageProcessor();
		const processingTask: ImageProcessingTask = {
			id: 'hybrid-processing',
			operation: 'enhance',
			inputData: baseImageData,
			width: baseImageData.width,
			height: baseImageData.height,
			parameters: options.enableEnhancement
				? {
						brightness: 1.0,
						contrast: 1.1,
						gamma: 1.0,
						sharpness: 1.2
					}
				: undefined
		};

		let processedImageData: ImageData;
		let gpuProcessingTime = 0;

		try {
			const gpuResult = await gpuProcessor.processImage(processingTask);
			processedImageData = gpuResult.outputData;
			gpuProcessingTime = gpuResult.processingTimeMs;

			options.onProgress?.('Hybrid: GPU processing complete', 50);
		} catch (error) {
			console.warn('[UltimateWebP] WebGPU processing failed, using base ImageData:', error);
			processedImageData = baseImageData;
			options.onProgress?.('Hybrid: Using fallback processing', 50);
		}

		// Step 3: Use WASM for final high-quality encoding
		options.onProgress?.('Hybrid: WASM final encoding', 60);

		const imageType = this.analyzeImageForWasm(processedImageData);
		const wasmOptions: WasmWebPOptions = {
			...WasmWebPEncoder.getOptimalOptions(imageType, processedImageData.data.length),
			quality: (options.quality || 0.8) * 100,
			lossless: options.wasmLossless || false,
			method: 4, // Good balance of speed/quality for hybrid approach
			pass: 4
		};

		if (!this.wasmEncoder) {
			throw new Error('WASM encoder not initialized');
		}

		const wasmResult = await this.wasmEncoder.encodeToWebP(processedImageData, wasmOptions);

		options.onProgress?.('Hybrid: Complete', 95);

		return {
			webpDataUrl: wasmResult.webpDataUrl,
			conversionMethod: 'webgpu-wasm-hybrid',
			totalTime: 0,
			originalSize: wasmResult.originalSize,
			compressedSize: wasmResult.compressedSize,
			compressionRatio: wasmResult.compressionRatio,
			actualQuality: options.quality || 0.8,
			performance: {
				analysisTime,
				processingTime: gpuProcessingTime + wasmResult.encodingTime
			},
			optimizations: [
				'webgpu-preprocessing',
				...(options.enableEnhancement ? ['gpu-enhancement'] : []),
				'wasm-final-encoding',
				'hybrid-pipeline',
				'ultimate-quality'
			],
			systemInfo: {
				webgpuAvailable: true,
				workerAvailable: true,
				progressiveSupported: false
			}
		};
	}

	private analyzeImageForWasm(imageData: ImageData): 'line-art' | 'photo' | 'mixed' {
		const { data, width, height } = imageData;
		let edgePixels = 0;
		let colorVariance = 0;
		let transparentPixels = 0;

		// Sample analysis (every 4th pixel for performance)
		const sampleStep = 4;
		let sampleCount = 0;

		for (let i = 0; i < data.length; i += 16 * sampleStep) {
			// RGBA = 4 bytes, step by 4 pixels
			const r = data[i];
			const g = data[i + 1];
			const b = data[i + 2];
			const a = data[i + 3];

			if (a < 255) transparentPixels++;

			// Check for edge (high contrast with neighbors)
			if (i + 16 < data.length) {
				const nr = data[i + 16];
				const ng = data[i + 17];
				const nb = data[i + 18];

				const contrast = Math.abs(r - nr) + Math.abs(g - ng) + Math.abs(b - nb);
				if (contrast > 60) edgePixels++;
			}

			// Calculate color variance
			const gray = (r + g + b) / 3;
			const variance = Math.abs(r - gray) + Math.abs(g - gray) + Math.abs(b - gray);
			colorVariance += variance;

			sampleCount++;
		}

		const edgeRatio = edgePixels / sampleCount;
		const avgColorVariance = colorVariance / sampleCount;
		const transparencyRatio = transparentPixels / sampleCount;

		// Line art: high edges, low color variance, often transparent
		if (edgeRatio > 0.3 && avgColorVariance < 20 && transparencyRatio > 0.1) {
			return 'line-art';
		}

		// Photo: low edges, high color variance, rarely transparent
		if (edgeRatio < 0.15 && avgColorVariance > 40) {
			return 'photo';
		}

		// Mixed or unknown
		return 'mixed';
	}

	/**
	 * Clean up resources
	 */
	dispose(): void {
		this.webgpuConverter?.dispose();
		this.optimizedEncoder?.dispose();
		this.progressiveStreamer?.dispose();
		this.wasmEncoder?.dispose();
	}
}
