/**
 * Performance-Aware Configuration Optimizer
 * Automatically adjusts vectorization settings based on device capabilities and image characteristics
 */

import type { VectorizerConfig, VectorizerBackend } from '$lib/types/vectorizer';
import { DEFAULT_CONFIG } from '$lib/types/vectorizer';

export interface DeviceCapabilities {
	// Hardware info
	hardwareConcurrency: number;
	totalMemory?: number; // in bytes, may not be available
	isLowEndDevice: boolean;
	
	// Browser capabilities
	supportsSharedArrayBuffer: boolean;
	supportsWasmThreads: boolean;
	maxWorkers: number;
	
	// Performance characteristics
	estimatedProcessingPower: 'low' | 'medium' | 'high';
	networkSpeed: 'slow' | 'fast' | 'unknown';
}

export interface ImageCharacteristics {
	width: number;
	height: number;
	pixelCount: number;
	format: string;
	estimatedComplexity: 'low' | 'medium' | 'high';
	hasTransparency?: boolean;
}

export interface ProcessingEstimate {
	estimatedTimeMs: number;
	memoryUsageMB: number;
	cpuIntensity: 'low' | 'medium' | 'high';
	recommendedThreads: number;
	warnings: string[];
}

export class PerformanceOptimizer {
	private deviceCapabilities: DeviceCapabilities | null = null;
	
	/**
	 * Initialize with device capability detection
	 */
	async initialize(): Promise<DeviceCapabilities> {
		const capabilities: DeviceCapabilities = {
			hardwareConcurrency: navigator.hardwareConcurrency || 4,
			supportsSharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
			supportsWasmThreads: this.checkWasmThreadSupport(),
			maxWorkers: Math.min(navigator.hardwareConcurrency || 4, 12),
			estimatedProcessingPower: this.estimateProcessingPower(),
			networkSpeed: this.estimateNetworkSpeed(),
			isLowEndDevice: this.detectLowEndDevice()
		};
		
		// Try to get memory info (Chrome only)
		if ('memory' in performance && (performance as any).memory) {
			const memInfo = (performance as any).memory;
			capabilities.totalMemory = memInfo.totalJSHeapSize || memInfo.usedJSHeapSize * 4;
		}
		
		this.deviceCapabilities = capabilities;
		return capabilities;
	}
	
	/**
	 * Optimize configuration for device and image
	 */
	async optimizeConfig(
		baseConfig: VectorizerConfig,
		imageCharacteristics: ImageCharacteristics,
		priority: 'speed' | 'quality' | 'balanced' = 'balanced'
	): Promise<VectorizerConfig> {
		if (!this.deviceCapabilities) {
			await this.initialize();
		}
		
		const optimizedConfig = { ...baseConfig };
		const { pixelCount, estimatedComplexity } = imageCharacteristics;
		
		// Apply device-specific optimizations
		this.applyDeviceOptimizations(optimizedConfig);
		
		// Apply image-specific optimizations
		this.applyImageOptimizations(optimizedConfig, imageCharacteristics);
		
		// Apply priority-based optimizations
		this.applyPriorityOptimizations(optimizedConfig, priority);
		
		// Thread count optimization
		optimizedConfig.thread_count = this.getOptimalThreadCount(pixelCount);
		
		// Memory management
		this.applyMemoryOptimizations(optimizedConfig, imageCharacteristics);
		
		// Processing time limits
		optimizedConfig.max_processing_time_ms = this.getMaxProcessingTime(priority);
		
		return optimizedConfig;
	}
	
	/**
	 * Estimate processing metrics for a configuration
	 */
	estimateProcessing(
		config: VectorizerConfig, 
		imageCharacteristics: ImageCharacteristics
	): ProcessingEstimate {
		const { pixelCount, estimatedComplexity } = imageCharacteristics;
		const warnings: string[] = [];
		
		// Base processing time estimation
		let baseTimeMs = this.calculateBaseProcessingTime(pixelCount, config.backend);
		
		// Apply complexity multiplier
		const complexityMultiplier = {
			'low': 0.7,
			'medium': 1.0,
			'high': 1.4
		}[estimatedComplexity];
		baseTimeMs *= complexityMultiplier;
		
		// Multi-pass impact
		if (config.multipass && config.pass_count > 1) {
			baseTimeMs *= config.pass_count * 0.8; // Diminishing returns
			if (config.pass_count > 2) {
				warnings.push('Multi-pass processing will significantly increase processing time');
			}
		}
		
		// Advanced features impact
		let featureMultiplier = 1.0;
		if (config.enable_etf_fdog) featureMultiplier *= 1.3;
		if (config.enable_flow_tracing) featureMultiplier *= 1.4;
		if (config.enable_bezier_fitting) featureMultiplier *= 1.2;
		baseTimeMs *= featureMultiplier;
		
		// Threading speedup
		const threadSpeedup = this.calculateThreadSpeedup(config.thread_count || 1);
		const estimatedTimeMs = baseTimeMs / threadSpeedup;
		
		// Memory estimation
		const memoryUsageMB = this.estimateMemoryUsage(pixelCount, config);
		
		// CPU intensity
		const cpuIntensity = this.calculateCpuIntensity(config, estimatedComplexity);
		
		// Performance warnings
		if (estimatedTimeMs > 10000) {
			warnings.push('Processing time may exceed 10 seconds');
		}
		if (memoryUsageMB > 512 && this.deviceCapabilities?.isLowEndDevice) {
			warnings.push('High memory usage detected - consider reducing image size');
		}
		
		return {
			estimatedTimeMs: Math.round(estimatedTimeMs),
			memoryUsageMB: Math.round(memoryUsageMB),
			cpuIntensity,
			recommendedThreads: config.thread_count || 1,
			warnings
		};
	}
	
	/**
	 * Get optimal backend for image characteristics
	 */
	getOptimalBackend(
		imageCharacteristics: ImageCharacteristics,
		priority: 'speed' | 'quality' | 'balanced' = 'balanced'
	): VectorizerBackend {
		const { pixelCount, estimatedComplexity } = imageCharacteristics;
		
		// Speed priority - choose fastest backends
		if (priority === 'speed') {
			if (pixelCount > 4_000_000) return 'superpixel'; // Fastest for large images
			return 'centerline'; // Fast for general use
		}
		
		// Quality priority - choose best quality backends
		if (priority === 'quality') {
			return 'edge'; // Best quality overall
		}
		
		// Balanced priority - optimize based on image characteristics
		if (estimatedComplexity === 'low') {
			return 'centerline'; // Efficient for simple images
		} else if (pixelCount > 6_000_000) {
			return 'superpixel'; // Better performance for very large images
		} else {
			return 'edge'; // Good balance for most cases
		}
	}
	
	// Private helper methods
	
	private checkWasmThreadSupport(): boolean {
		// Feature detection for WASM threads
		try {
			return typeof SharedArrayBuffer !== 'undefined' && 
				   typeof Atomics !== 'undefined' &&
				   typeof WebAssembly !== 'undefined';
		} catch {
			return false;
		}
	}
	
	private estimateProcessingPower(): 'low' | 'medium' | 'high' {
		const cores = navigator.hardwareConcurrency || 4;
		
		// Use device memory hint if available (Chrome)
		if ('deviceMemory' in navigator) {
			const memory = (navigator as any).deviceMemory;
			if (memory <= 2) return 'low';
			if (memory >= 8) return 'high';
		}
		
		// Fallback to core count estimation
		if (cores <= 2) return 'low';
		if (cores >= 8) return 'high';
		return 'medium';
	}
	
	private estimateNetworkSpeed(): 'slow' | 'fast' | 'unknown' {
		// Use Network Information API if available
		if ('connection' in navigator) {
			const connection = (navigator as any).connection;
			const effectiveType = connection.effectiveType;
			
			if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'slow';
			if (effectiveType === '4g') return 'fast';
		}
		
		return 'unknown';
	}
	
	private detectLowEndDevice(): boolean {
		const cores = navigator.hardwareConcurrency || 4;
		
		// Check device memory (Chrome)
		if ('deviceMemory' in navigator) {
			const memory = (navigator as any).deviceMemory;
			if (memory <= 2) return true;
		}
		
		// Fallback detection
		return cores <= 2;
	}
	
	private applyDeviceOptimizations(config: VectorizerConfig) {
		if (!this.deviceCapabilities) return;
		
		const { isLowEndDevice, estimatedProcessingPower, supportsWasmThreads } = this.deviceCapabilities;
		
		if (isLowEndDevice || estimatedProcessingPower === 'low') {
			// Reduce quality for performance
			config.detail = Math.min(config.detail, 0.6);
			config.multipass = false;
			config.pass_count = 1;
			
			// Disable expensive features
			config.enable_etf_fdog = false;
			config.enable_flow_tracing = false;
			config.enable_bezier_fitting = false;
			
			// Reduce noise filtering
			config.noise_filtering = false;
		}
		
		// Threading optimization
		if (!supportsWasmThreads) {
			config.thread_count = 1;
		}
	}
	
	private applyImageOptimizations(config: VectorizerConfig, imageCharacteristics: ImageCharacteristics) {
		const { pixelCount, estimatedComplexity } = imageCharacteristics;
		
		// Large image optimizations
		if (pixelCount > 4_000_000) { // > 4MP
			config.detail = Math.max(0.3, config.detail - 0.2);
			config.pass_count = Math.min(config.pass_count, 2);
			
			// Simplify for large images
			if (config.backend === 'dots') {
				config.dot_density_threshold = Math.max(0.3, (config.dot_density_threshold || 0.5) - 0.2);
			}
		}
		
		// Complexity-based adjustments
		if (estimatedComplexity === 'high') {
			config.noise_filtering = true;
			config.detail = Math.min(config.detail, 0.8);
		} else if (estimatedComplexity === 'low') {
			config.detail = Math.max(config.detail, 0.4);
		}
	}
	
	private applyPriorityOptimizations(config: VectorizerConfig, priority: 'speed' | 'quality' | 'balanced') {
		switch (priority) {
			case 'speed':
				config.detail = Math.min(config.detail, 0.5);
				config.multipass = false;
				config.pass_count = 1;
				config.noise_filtering = false;
				config.enable_etf_fdog = false;
				config.enable_flow_tracing = false;
				config.enable_bezier_fitting = false;
				break;
				
			case 'quality':
				config.detail = Math.max(config.detail, 0.7);
				config.noise_filtering = true;
				if (config.backend === 'edge') {
					config.multipass = true;
					config.pass_count = Math.max(config.pass_count, 2);
				}
				break;
				
			case 'balanced':
				// Keep current settings but ensure reasonable bounds
				config.detail = Math.max(0.4, Math.min(0.8, config.detail));
				config.pass_count = Math.min(config.pass_count, 3);
				break;
		}
	}
	
	private getOptimalThreadCount(pixelCount: number): number {
		if (!this.deviceCapabilities?.supportsWasmThreads) return 1;
		
		const maxThreads = this.deviceCapabilities.maxWorkers;
		const isLargeImage = pixelCount > 2_000_000;
		
		// Scale thread count based on image size and device capabilities
		if (pixelCount < 1_000_000) return Math.min(4, maxThreads);
		if (isLargeImage) return maxThreads;
		return Math.min(6, maxThreads);
	}
	
	private applyMemoryOptimizations(config: VectorizerConfig, imageCharacteristics: ImageCharacteristics) {
		const { pixelCount } = imageCharacteristics;
		const estimatedMemoryMB = this.estimateMemoryUsage(pixelCount, config);
		
		// Memory pressure detection
		const hasMemoryPressure = this.deviceCapabilities?.isLowEndDevice || 
			(this.deviceCapabilities?.totalMemory && this.deviceCapabilities.totalMemory < 2_000_000_000);
		
		if (hasMemoryPressure && estimatedMemoryMB > 256) {
			// Reduce memory usage
			config.thread_count = Math.min(config.thread_count || 4, 2);
			
			if (config.backend === 'superpixel') {
				config.num_superpixels = Math.min(config.num_superpixels || 100, 50);
			}
		}
		
		// Set memory budget
		config.memory_budget = hasMemoryPressure ? 512 : 1024; // MB
	}
	
	private getMaxProcessingTime(priority: 'speed' | 'quality' | 'balanced'): number {
		switch (priority) {
			case 'speed': return 15_000; // 15 seconds max
			case 'quality': return 120_000; // 2 minutes max
			case 'balanced': return 60_000; // 1 minute max
		}
	}
	
	private calculateBaseProcessingTime(pixelCount: number, backend: VectorizerBackend): number {
		const baseTimePerMegapixel = {
			'edge': 1500,      // 1.5s per MP
			'centerline': 800, // 0.8s per MP
			'dots': 600,       // 0.6s per MP
			'superpixel': 400  // 0.4s per MP
		}[backend];
		
		const megapixels = pixelCount / 1_000_000;
		return baseTimePerMegapixel * megapixels;
	}
	
	private calculateThreadSpeedup(threadCount: number): number {
		// Realistic threading speedup with diminishing returns
		if (threadCount <= 1) return 1.0;
		if (threadCount <= 2) return 1.8;
		if (threadCount <= 4) return 3.2;
		if (threadCount <= 8) return 5.5;
		return 7.0; // Maximum practical speedup
	}
	
	private estimateMemoryUsage(pixelCount: number, config: VectorizerConfig): number {
		// Base memory usage per pixel
		const baseMemoryPerPixel = 4; // bytes (RGBA)
		let memoryUsage = pixelCount * baseMemoryPerPixel;
		
		// Add processing buffers
		memoryUsage *= 2.5; // Processing overhead
		
		// Threading overhead
		const threadMultiplier = Math.min(2.0, 1.0 + (config.thread_count || 1) * 0.2);
		memoryUsage *= threadMultiplier;
		
		// Backend-specific overhead
		switch (config.backend) {
			case 'edge':
				if (config.enable_etf_fdog) memoryUsage *= 1.5;
				if (config.multipass) memoryUsage *= 1.3;
				break;
			case 'superpixel':
				memoryUsage *= 1.2;
				break;
		}
		
		return memoryUsage / (1024 * 1024); // Convert to MB
	}
	
	private calculateCpuIntensity(config: VectorizerConfig, complexity: 'low' | 'medium' | 'high'): 'low' | 'medium' | 'high' {
		let intensity = 0;
		
		// Backend base intensity
		const backendIntensity = {
			'centerline': 1,
			'superpixel': 1,
			'dots': 2,
			'edge': 3
		}[config.backend];
		intensity += backendIntensity;
		
		// Feature additions
		if (config.multipass) intensity += 1;
		if (config.enable_etf_fdog) intensity += 2;
		if (config.enable_flow_tracing) intensity += 1;
		if (config.noise_filtering) intensity += 1;
		
		// Complexity factor
		const complexityBonus = { 'low': 0, 'medium': 1, 'high': 2 }[complexity];
		intensity += complexityBonus;
		
		// Map to categories
		if (intensity <= 3) return 'low';
		if (intensity <= 6) return 'medium';
		return 'high';
	}
}

// Global instance
export const performanceOptimizer = new PerformanceOptimizer();