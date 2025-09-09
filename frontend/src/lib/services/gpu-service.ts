/**
 * GPU Service for WebAssembly GPU Acceleration
 *
 * This service provides high-level GPU acceleration capabilities
 * for image vectorization using the WASM GPU module.
 */

import type { WasmVectorizer, WasmGpuSelector } from '$lib/wasm/vectorize_wasm';
import { loadVectorizer, getGpuStatus } from '$lib/wasm/loader';
import { browser } from '$app/environment';

export interface GpuCapabilities {
	available: boolean;
	backend: string;
	device_info: string | null;
	supports_image_processing: boolean;
	message: string;
}

export interface ImageCharacteristics {
	width: number;
	height: number;
	pixel_count: number;
	aspect_ratio: number;
	estimated_complexity: number;
	has_high_detail: boolean;
	has_smooth_regions: boolean;
}

export class GpuService {
	private wasmModule: any = null;
	private gpuSelector: WasmGpuSelector | null = null;
	private initialized = false;
	private capabilities: GpuCapabilities | null = null;

	async initialize(): Promise<boolean> {
		if (!browser) {
			// Not in browser environment
			return false;
		}

		if (this.initialized) {
			return this.capabilities?.available ?? false;
		}

		try {
			// Load WASM module
			this.wasmModule = await loadVectorizer();

			if (!this.wasmModule) {
				console.warn('[GPU Service] WASM module not available');
				return false;
			}

			// Get GPU capabilities from enhanced backend status
			const gpuStatus = await getGpuStatus();
			const gpuBackendStatusJson = this.wasmModule.get_gpu_backend_status();
			const gpuBackendStatus = JSON.parse(gpuBackendStatusJson);

			this.capabilities = {
				available: gpuBackendStatus.available,
				backend: gpuBackendStatus.backend,
				device_info: gpuBackendStatus.status_message,
				supports_image_processing: gpuBackendStatus.available,
				message: gpuBackendStatus.status_message || `Status: ${gpuStatus.status}`
			};

			// Enhanced GPU capabilities detected

			// Initialize GPU processing if available
			if (this.capabilities.available) {
				try {
					// Initialize GPU processing pipeline
					const _gpuInitResult = await this.wasmModule.initialize_gpu_processing();
					// GPU processing pipeline initialized successfully

					// Initialize GPU selector with GPU support
					this.gpuSelector = await this.wasmModule.WasmGpuSelector.init_with_gpu();
					// GPU selector initialized with hardware acceleration support
				} catch (error) {
					console.warn(
						'[GPU Service] ⚠️ GPU processing initialization failed, falling back to CPU:',
						error
					);
					// Create CPU-only selector as fallback
					this.gpuSelector = new this.wasmModule.WasmGpuSelector();
					// Update capabilities to reflect actual state
					this.capabilities.available = false;
					this.capabilities.message = `GPU initialization failed: ${error}`;
					console.log('[GPU Service] 💻 CPU-only fallback mode activated');
				}
			} else {
				// Create CPU-only selector
				this.gpuSelector = new this.wasmModule.WasmGpuSelector();
				console.log('[GPU Service] 💻 GPU not available - using CPU-only processing');
			}

			this.initialized = true;
			return this.capabilities.available;
		} catch (error) {
			console.error('[GPU Service] Initialization failed:', error);
			this.initialized = true;
			return false;
		}
	}

	async getCapabilities(): Promise<GpuCapabilities | null> {
		if (!this.initialized) {
			await this.initialize();
		}
		return this.capabilities;
	}

	isGpuAvailable(): boolean {
		return this.capabilities?.available ?? false;
	}

	async analyzeImage(imageData: ImageData): Promise<ImageCharacteristics | null> {
		if (!this.gpuSelector || !browser) {
			return null;
		}

		try {
			const result = this.gpuSelector.analyze_image_characteristics(imageData);

			// Handle both direct object and JSON string returns
			if (typeof result === 'string') {
				return JSON.parse(result);
			} else if (result && typeof result === 'object') {
				return result as ImageCharacteristics;
			}

			return null;
		} catch (error) {
			console.error('[GPU Service] Image analysis failed:', error);
			return null;
		}
	}

	getProcessingStrategy(width: number, height: number, algorithm: string): string {
		if (!this.gpuSelector) {
			return `cpu-only (service not initialized)`;
		}

		try {
			return this.gpuSelector.select_strategy(width, height, algorithm);
		} catch (error) {
			console.error('[GPU Service] Strategy selection failed:', error);
			return `cpu-only (error: ${error})`;
		}
	}

	shouldUseGpu(width: number, height: number): boolean {
		if (!this.wasmModule || !this.isGpuAvailable()) {
			return false;
		}

		try {
			return this.wasmModule.should_use_gpu_for_size(width, height);
		} catch (error) {
			console.error('[GPU Service] GPU size check failed:', error);
			return false;
		}
	}

	recordPerformance(
		algorithm: string,
		width: number,
		height: number,
		gpuTimeMs: number,
		cpuTimeMs?: number
	): void {
		if (!this.gpuSelector) {
			return;
		}

		try {
			this.gpuSelector.record_performance(algorithm, width, height, gpuTimeMs, cpuTimeMs ?? null);
		} catch (error) {
			console.error('[GPU Service] Performance recording failed:', error);
		}
	}

	getPerformanceSummary(): string {
		if (!this.gpuSelector) {
			return 'GPU service not initialized';
		}

		try {
			return this.gpuSelector.get_performance_summary();
		} catch (error) {
			console.error('[GPU Service] Performance summary failed:', error);
			return `Error getting performance summary: ${error}`;
		}
	}

	getHistoricalSpeedup(algorithm: string, width: number, height: number): number | null {
		if (!this.gpuSelector) {
			return null;
		}

		try {
			const speedup = this.gpuSelector.get_historical_speedup(algorithm, width, height);
			return speedup ?? null;
		} catch (error) {
			console.error('[GPU Service] Historical speedup lookup failed:', error);
			return null;
		}
	}

	async vectorizeWithGpuAcceleration(
		vectorizer: WasmVectorizer,
		imageData: ImageData,
		preferGpu = true
	): Promise<string> {
		if (!this.wasmModule) {
			throw new Error('WASM module not loaded');
		}

		try {
			return await this.wasmModule.vectorize_with_gpu_acceleration(
				vectorizer,
				imageData,
				preferGpu
			);
		} catch (error) {
			console.error('[GPU Service] GPU-accelerated vectorization failed:', error);
			// Fallback to CPU-only vectorization
			console.log('[GPU Service] Falling back to CPU vectorization');
			return vectorizer.vectorize(imageData);
		}
	}

	async vectorizeWithGpuAndProgress(
		vectorizer: WasmVectorizer,
		imageData: ImageData,
		progressCallback?: (progress: any) => void
	): Promise<string> {
		if (!this.wasmModule) {
			throw new Error('WASM module not loaded');
		}

		try {
			// Use the new GPU vectorization method with progress callback
			return await vectorizer.vectorize_with_gpu(imageData, progressCallback);
		} catch (error) {
			console.error('[GPU Service] GPU vectorization with progress failed:', error);
			// Fallback to standard CPU vectorization with progress
			console.log('[GPU Service] Falling back to CPU vectorization with progress');
			return vectorizer.vectorize_with_progress(imageData, progressCallback);
		}
	}

	getProcessingBackendReport(): string {
		if (!this.wasmModule) {
			return 'WASM module not loaded';
		}

		try {
			return this.wasmModule.get_processing_backend_report();
		} catch (error) {
			console.error('[GPU Service] Failed to get backend report:', error);
			return `Error getting backend report: ${error}`;
		}
	}

	getOptimalProcessingConfig(): any {
		if (!this.wasmModule) {
			return null;
		}

		try {
			const configJson = this.wasmModule.create_optimal_processing_config();
			return JSON.parse(configJson);
		} catch (error) {
			console.error('[GPU Service] Failed to get optimal config:', error);
			return null;
		}
	}

	/**
	 * Determine if GPU acceleration should be used for SVG preview rendering
	 */
	shouldUseGpuForSvgPreview(elementCount: number, complexity: number): boolean {
		if (!this.isGpuAvailable()) {
			return false;
		}

		// Use GPU for very large datasets
		if (elementCount > 10000) {
			return true;
		}

		// Use GPU for complex graphics with moderate element counts
		if (elementCount > 5000 && complexity > 2000) {
			return true;
		}

		return false;
	}

	/**
	 * Get estimated performance improvement from GPU acceleration
	 */
	getEstimatedSpeedup(elementCount: number): number {
		if (!this.isGpuAvailable() || elementCount < 1000) {
			return 1.0; // No improvement
		}

		// Empirical speedup estimates based on research
		if (elementCount > 50000) return 60.0; // Maximum theoretical speedup
		if (elementCount > 20000) return 25.0;
		if (elementCount > 10000) return 10.0;
		if (elementCount > 5000) return 5.0;
		if (elementCount > 2000) return 2.5;

		return 1.5; // Minimal improvement for smaller datasets
	}

	/**
	 * Create optimized rendering strategy for SVG previews
	 */
	createSvgRenderingStrategy(
		elementCount: number,
		complexity: number
	): {
		useGpu: boolean;
		expectedSpeedup: number;
		strategy: 'webgl' | 'canvas' | 'dom';
		reason: string;
	} {
		const useGpu = this.shouldUseGpuForSvgPreview(elementCount, complexity);
		const expectedSpeedup = this.getEstimatedSpeedup(elementCount);

		if (useGpu) {
			return {
				useGpu: true,
				expectedSpeedup,
				strategy: 'webgl',
				reason: `GPU acceleration for ${elementCount} elements (${expectedSpeedup}x speedup expected)`
			};
		} else if (elementCount > 2500) {
			return {
				useGpu: false,
				expectedSpeedup: 2.0,
				strategy: 'canvas',
				reason: `Canvas rendering for ${elementCount} elements (GPU not beneficial)`
			};
		} else {
			return {
				useGpu: false,
				expectedSpeedup: 1.0,
				strategy: 'dom',
				reason: `DOM rendering for ${elementCount} elements (optimal for interaction)`
			};
		}
	}

	getGpuInfo(): {
		backend: string;
		available: boolean;
		webgpu: boolean;
		webgl2: boolean;
		message: string;
	} {
		const capabilities = this.capabilities;

		if (!this.wasmModule) {
			return {
				backend: 'none',
				available: false,
				webgpu: false,
				webgl2: false,
				message: 'WASM module not loaded'
			};
		}

		try {
			const webgpu = this.wasmModule.is_webgpu_available?.() ?? false;
			const webgl2 = this.wasmModule.is_webgl2_available?.() ?? false;
			const backend = this.wasmModule.get_gpu_backend?.() ?? 'unknown';

			return {
				backend,
				available: capabilities?.available ?? false,
				webgpu,
				webgl2,
				message: capabilities?.message ?? 'No GPU information available'
			};
		} catch (error) {
			console.error('[GPU Service] GPU info retrieval failed:', error);
			return {
				backend: 'unknown',
				available: false,
				webgpu: false,
				webgl2: false,
				message: `Error: ${error}`
			};
		}
	}
}

// Lazy getter to avoid SSR instantiation - simple proxy approach
let _gpuServiceInstance: GpuService | null = null;
export const gpuService = new Proxy({} as GpuService, {
	get(target, prop) {
		if (!_gpuServiceInstance) {
			_gpuServiceInstance = new GpuService();
		}
		const value = (_gpuServiceInstance as any)[prop];
		if (typeof value === 'function') {
			return value.bind(_gpuServiceInstance);
		}
		return value;
	}
});
