/**
 * Performance monitoring utility for detecting browser stress and system capabilities
 * Helps optimize thread allocation and prevent browser freezing
 */

export interface PerformanceMetrics {
	frameRate: number;
	processingTimePerChunk: number;
	memoryUsage?: number;
	isStressed: boolean;
	timestamp: number;
}

export interface SystemCapabilities {
	cores: number;
	deviceType: 'mobile' | 'tablet' | 'desktop';
	memoryEstimate: 'low' | 'medium' | 'high';
	supportsHighPerformance: boolean;
}

export type PerformanceMode = 'economy' | 'balanced' | 'performance' | 'custom';

export interface PerformanceModeConfig {
	mode: PerformanceMode;
	threadCountMultiplier: number;
	maxThreads: number;
	enableYielding: boolean;
	chunkSize?: number;
}

class PerformanceMonitor {
	private frameRateHistory: number[] = [];
	private processingTimes: number[] = [];
	private lastFrameTime = 0;
	private frameCount = 0;
	private isMonitoring = false;
	private rafId?: number;
	private stressThreshold = 30; // FPS below this is considered stressed
	private historySize = 10;

	private performanceModeConfigs: Record<PerformanceMode, PerformanceModeConfig> = {
		economy: {
			mode: 'economy',
			threadCountMultiplier: 0.25,
			maxThreads: 2,
			enableYielding: true,
			chunkSize: 64
		},
		balanced: {
			mode: 'balanced',
			threadCountMultiplier: 0.5,
			maxThreads: 4,
			enableYielding: true,
			chunkSize: 128
		},
		performance: {
			mode: 'performance',
			threadCountMultiplier: 0.75,
			maxThreads: 8,
			enableYielding: false,
			chunkSize: 256
		},
		custom: {
			mode: 'custom',
			threadCountMultiplier: 0.5,
			maxThreads: 4,
			enableYielding: true,
			chunkSize: 128
		}
	};

	/**
	 * Start monitoring frame rate and performance metrics
	 */
	startMonitoring(): void {
		if (this.isMonitoring) return;

		this.isMonitoring = true;
		this.lastFrameTime = performance.now();
		this.frameCount = 0;
		this.frameRateHistory = [];
		this.measureFrameRate();
	}

	/**
	 * Stop monitoring performance
	 */
	stopMonitoring(): void {
		this.isMonitoring = false;
		if (this.rafId) {
			cancelAnimationFrame(this.rafId);
			this.rafId = undefined;
		}
	}

	/**
	 * Get current performance metrics
	 */
	getCurrentMetrics(): PerformanceMetrics {
		const currentFps = this.getCurrentFrameRate();
		const avgProcessingTime = this.getAverageProcessingTime();
		
		return {
			frameRate: currentFps,
			processingTimePerChunk: avgProcessingTime,
			memoryUsage: this.getMemoryUsageEstimate(),
			isStressed: currentFps < this.stressThreshold,
			timestamp: performance.now()
		};
	}

	/**
	 * Detect system capabilities
	 */
	getSystemCapabilities(): SystemCapabilities {
		const cores = navigator.hardwareConcurrency || 4;
		const deviceType = this.detectDeviceType();
		const memoryEstimate = this.estimateMemoryCapability();
		
		return {
			cores,
			deviceType,
			memoryEstimate,
			supportsHighPerformance: cores >= 4 && deviceType === 'desktop' && memoryEstimate !== 'low'
		};
	}

	/**
	 * Calculate optimal thread count based on system and performance mode
	 */
	calculateOptimalThreadCount(mode: PerformanceMode, customThreads?: number): number {
		const capabilities = this.getSystemCapabilities();
		const config = this.performanceModeConfigs[mode];
		
		if (mode === 'custom' && customThreads !== undefined) {
			return Math.max(1, Math.min(customThreads, capabilities.cores));
		}
		
		let baseThreads = Math.floor(capabilities.cores * config.threadCountMultiplier);
		
		// Apply device-specific adjustments
		if (capabilities.deviceType === 'mobile') {
			baseThreads = Math.min(baseThreads, 2);
		} else if (capabilities.deviceType === 'tablet') {
			baseThreads = Math.min(baseThreads, 4);
		}
		
		// Apply memory limitations
		if (capabilities.memoryEstimate === 'low') {
			baseThreads = Math.min(baseThreads, 2);
		}
		
		// Ensure minimum and maximum bounds
		const optimalThreads = Math.max(1, Math.min(baseThreads, config.maxThreads));
		
		// Always leave at least 1-2 cores free for browser UI
		const reservedCores = capabilities.cores > 4 ? 2 : 1;
		return Math.min(optimalThreads, Math.max(1, capabilities.cores - reservedCores));
	}

	/**
	 * Get performance mode configuration
	 */
	getPerformanceModeConfig(mode: PerformanceMode): PerformanceModeConfig {
		return { ...this.performanceModeConfigs[mode] };
	}

	/**
	 * Update custom performance mode configuration
	 */
	updateCustomModeConfig(config: Partial<PerformanceModeConfig>): void {
		this.performanceModeConfigs.custom = {
			...this.performanceModeConfigs.custom,
			...config
		};
	}

	/**
	 * Record processing time for a chunk/operation
	 */
	recordProcessingTime(timeMs: number): void {
		this.processingTimes.push(timeMs);
		if (this.processingTimes.length > this.historySize) {
			this.processingTimes.shift();
		}
	}

	/**
	 * Check if system is currently under stress
	 */
	isSystemStressed(): boolean {
		const metrics = this.getCurrentMetrics();
		return metrics.isStressed || metrics.processingTimePerChunk > 1000;
	}

	/**
	 * Get recommended performance mode based on current system state
	 */
	getRecommendedPerformanceMode(): PerformanceMode {
		const capabilities = this.getSystemCapabilities();
		const isStressed = this.isSystemStressed();
		
		if (isStressed) {
			return 'economy';
		}
		
		if (!capabilities.supportsHighPerformance) {
			return 'balanced';
		}
		
		return 'performance';
	}

	/**
	 * Create yielding function for progressive processing
	 */
	createYieldingFunction(mode: PerformanceMode): () => Promise<void> {
		const config = this.performanceModeConfigs[mode];
		
		if (!config.enableYielding) {
			return async () => {}; // No-op for performance mode
		}
		
		return async () => {
			if (this.isSystemStressed()) {
				// Yield more frequently when stressed
				await new Promise(resolve => setTimeout(resolve, 16)); // ~1 frame
			} else {
				// Normal yielding
				await new Promise(resolve => setTimeout(resolve, 4));
			}
		};
	}

	/**
	 * Create progress callback with yielding
	 */
	createProgressiveCallback<T>(
		originalCallback: (progress: T) => void,
		yieldEvery: number = 10
	): (progress: T) => Promise<void> {
		let callCount = 0;
		
		return async (progress: T) => {
			originalCallback(progress);
			
			callCount++;
			if (callCount % yieldEvery === 0) {
				await new Promise(resolve => requestIdleCallback(resolve));
			}
		};
	}

	private measureFrameRate(): void {
		if (!this.isMonitoring) return;
		
		const currentTime = performance.now();
		const delta = currentTime - this.lastFrameTime;
		
		if (delta >= 1000) { // Calculate FPS every second
			const fps = Math.round((this.frameCount * 1000) / delta);
			this.frameRateHistory.push(fps);
			
			if (this.frameRateHistory.length > this.historySize) {
				this.frameRateHistory.shift();
			}
			
			this.frameCount = 0;
			this.lastFrameTime = currentTime;
		}
		
		this.frameCount++;
		this.rafId = requestAnimationFrame(() => this.measureFrameRate());
	}

	private getCurrentFrameRate(): number {
		if (this.frameRateHistory.length === 0) return 60; // Assume 60fps if no data
		
		const recent = this.frameRateHistory.slice(-3); // Last 3 measurements
		return recent.reduce((sum, fps) => sum + fps, 0) / recent.length;
	}

	private getAverageProcessingTime(): number {
		if (this.processingTimes.length === 0) return 0;
		
		return this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length;
	}

	private detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
		const userAgent = navigator.userAgent.toLowerCase();
		const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
		
		if (isMobile) {
			const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent) || 
							(screen.width >= 768 && screen.height >= 1024);
			return isTablet ? 'tablet' : 'mobile';
		}
		
		return 'desktop';
	}

	private estimateMemoryCapability(): 'low' | 'medium' | 'high' {
		// Use navigator.deviceMemory if available (Chrome)
		const deviceMemory = (navigator as any).deviceMemory;
		if (deviceMemory) {
			if (deviceMemory <= 2) return 'low';
			if (deviceMemory <= 4) return 'medium';
			return 'high';
		}
		
		// Fallback estimation based on other indicators
		const cores = navigator.hardwareConcurrency || 4;
		const deviceType = this.detectDeviceType();
		
		if (deviceType === 'mobile') {
			return cores <= 4 ? 'low' : 'medium';
		} else if (deviceType === 'tablet') {
			return cores <= 4 ? 'medium' : 'high';
		} else {
			return cores <= 4 ? 'medium' : 'high';
		}
	}

	private getMemoryUsageEstimate(): number | undefined {
		// Use performance.memory if available (Chrome)
		const memory = (performance as any).memory;
		if (memory) {
			const usedPercent = (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;
			return Math.round(usedPercent);
		}
		
		return undefined;
	}
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export utility functions
export function getOptimalThreadCount(mode: PerformanceMode, customThreads?: number): number {
	return performanceMonitor.calculateOptimalThreadCount(mode, customThreads);
}

export function isLowEndDevice(): boolean {
	const capabilities = performanceMonitor.getSystemCapabilities();
	return capabilities.deviceType === 'mobile' || 
		   capabilities.memoryEstimate === 'low' || 
		   capabilities.cores <= 2;
}

export function shouldUseProgressiveProcessing(): boolean {
	const capabilities = performanceMonitor.getSystemCapabilities();
	return capabilities.deviceType !== 'desktop' || 
		   capabilities.memoryEstimate === 'low' ||
		   performanceMonitor.isSystemStressed();
}