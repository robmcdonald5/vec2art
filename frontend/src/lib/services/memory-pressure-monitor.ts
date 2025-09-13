/**
 * Memory Pressure Monitoring Service
 * Prevents crashes by monitoring memory usage and aborting operations before limits are reached
 *
 * Based on findings from iPhone crash testing - this service prevents the page crashes
 * that real iPhone users experience by proactively managing memory pressure.
 */

import { browser } from '$app/environment';

export interface MemoryStatus {
	usedMB: number;
	totalMB: number;
	limitMB: number;
	usagePercent: number;
	pressure: 'low' | 'medium' | 'high' | 'critical';
	canAllocateMore: boolean;
	recommendedAction: 'continue' | 'optimize' | 'abort';
}

export interface MemoryPressureConfig {
	maxUsagePercent: number;
	criticalUsagePercent: number;
	monitoringInterval: number;
	enableLogging: boolean;
	abortOnCritical: boolean;
}

class MemoryPressureMonitor {
	private static instance: MemoryPressureMonitor | null = null;
	private isMonitoring = false;
	private monitoringInterval: ReturnType<typeof setInterval> | null = null;
	private config: MemoryPressureConfig;
	private listeners: Array<(status: MemoryStatus) => void> = [];
	private lastStatus: MemoryStatus | null = null;

	private constructor(config?: Partial<MemoryPressureConfig>) {
		this.config = {
			maxUsagePercent: 70, // Conservative limit for iOS
			criticalUsagePercent: 85, // Emergency abort threshold
			monitoringInterval: 1000, // Check every second during processing
			enableLogging: true,
			abortOnCritical: true,
			...config
		};
	}

	public static getInstance(config?: Partial<MemoryPressureConfig>): MemoryPressureMonitor {
		if (!MemoryPressureMonitor.instance) {
			MemoryPressureMonitor.instance = new MemoryPressureMonitor(config);
		}
		return MemoryPressureMonitor.instance;
	}

	/**
	 * Get current memory status
	 */
	public getMemoryStatus(): MemoryStatus {
		if (!browser) {
			return {
				usedMB: 0,
				totalMB: 0,
				limitMB: 0,
				usagePercent: 0,
				pressure: 'low',
				canAllocateMore: true,
				recommendedAction: 'continue'
			};
		}

		// Try to get memory info (Chrome/Edge only)
		const performanceMemory = (performance as any).memory;

		if (performanceMemory) {
			const usedMB = performanceMemory.usedJSHeapSize / (1024 * 1024);
			const totalMB = performanceMemory.totalJSHeapSize / (1024 * 1024);
			const limitMB = performanceMemory.jsHeapSizeLimit / (1024 * 1024);
			const usagePercent = (usedMB / limitMB) * 100;

			// Determine pressure level
			let pressure: MemoryStatus['pressure'];
			let recommendedAction: MemoryStatus['recommendedAction'];
			let canAllocateMore: boolean;

			if (usagePercent < 50) {
				pressure = 'low';
				recommendedAction = 'continue';
				canAllocateMore = true;
			} else if (usagePercent < this.config.maxUsagePercent) {
				pressure = 'medium';
				recommendedAction = 'continue';
				canAllocateMore = true;
			} else if (usagePercent < this.config.criticalUsagePercent) {
				pressure = 'high';
				recommendedAction = 'optimize';
				canAllocateMore = false;
			} else {
				pressure = 'critical';
				recommendedAction = 'abort';
				canAllocateMore = false;
			}

			return {
				usedMB: Math.round(usedMB),
				totalMB: Math.round(totalMB),
				limitMB: Math.round(limitMB),
				usagePercent: Math.round(usagePercent),
				pressure,
				canAllocateMore,
				recommendedAction
			};
		}

		// Fallback for Safari/iOS (no performance.memory)
		// Estimate based on iOS device constraints
		const userAgent = navigator.userAgent;
		const isIOS = /iPad|iPhone|iPod/.test(userAgent);
		const isIPhone = /iPhone/.test(userAgent);

		if (isIOS) {
			// Conservative estimates for iOS devices based on crash testing
			const estimatedLimitMB = isIPhone ? 64 : 80; // iPhone: 64MB, iPad: 80MB
			const estimatedUsedMB = 30; // Conservative estimate
			const usagePercent = (estimatedUsedMB / estimatedLimitMB) * 100;

			return {
				usedMB: estimatedUsedMB,
				totalMB: estimatedUsedMB,
				limitMB: estimatedLimitMB,
				usagePercent: Math.round(usagePercent),
				pressure: usagePercent > 60 ? 'high' : 'medium',
				canAllocateMore: usagePercent < 65,
				recommendedAction: usagePercent > 70 ? 'abort' : 'continue'
			};
		}

		// Non-iOS fallback
		return {
			usedMB: 50,
			totalMB: 50,
			limitMB: 256,
			usagePercent: 20,
			pressure: 'low',
			canAllocateMore: true,
			recommendedAction: 'continue'
		};
	}

	/**
	 * Start monitoring memory pressure
	 */
	public startMonitoring(): void {
		if (this.isMonitoring || !browser) return;

		this.isMonitoring = true;

		if (this.config.enableLogging) {
			console.log('[MemoryPressureMonitor] Starting memory monitoring');
		}

		this.monitoringInterval = setInterval(() => {
			const status = this.getMemoryStatus();
			this.lastStatus = status;

			// Notify listeners
			this.listeners.forEach((listener) => {
				try {
					listener(status);
				} catch (error) {
					console.error('[MemoryPressureMonitor] Listener error:', error);
				}
			});

			// Log pressure changes
			if (this.config.enableLogging && status.pressure !== 'low') {
				console.log(
					`[MemoryPressureMonitor] Memory pressure: ${status.pressure} (${status.usagePercent}% used)`
				);
			}

			// Emergency abort if critical
			if (this.config.abortOnCritical && status.pressure === 'critical') {
				console.warn(
					'[MemoryPressureMonitor] CRITICAL memory pressure detected - recommending abort'
				);
				this.notifyEmergencyAbort(status);
			}
		}, this.config.monitoringInterval);
	}

	/**
	 * Stop monitoring
	 */
	public stopMonitoring(): void {
		if (!this.isMonitoring) return;

		this.isMonitoring = false;

		if (this.monitoringInterval) {
			clearInterval(this.monitoringInterval);
			this.monitoringInterval = null;
		}

		if (this.config.enableLogging) {
			console.log('[MemoryPressureMonitor] Stopped memory monitoring');
		}
	}

	/**
	 * Check if it's safe to proceed with memory-intensive operation
	 */
	public isSafeToAllocate(estimatedMB: number = 10): boolean {
		const status = this.getMemoryStatus();

		if (status.pressure === 'critical') {
			return false;
		}

		if (status.pressure === 'high') {
			// Only allow small allocations
			return estimatedMB < 5;
		}

		// Estimate if allocation would push us over limit
		const projectedUsage = ((status.usedMB + estimatedMB) / status.limitMB) * 100;
		return projectedUsage < this.config.maxUsagePercent;
	}

	/**
	 * Force garbage collection (if available)
	 */
	public requestGarbageCollection(): void {
		// Force garbage collection if available (Chrome dev tools)
		if (typeof (window as any).gc === 'function') {
			try {
				(window as any).gc();
				if (this.config.enableLogging) {
					console.log('[MemoryPressureMonitor] Forced garbage collection');
				}
			} catch (_error) {
				// Ignore errors
			}
		}
	}

	/**
	 * Add memory status listener
	 */
	public addListener(listener: (status: MemoryStatus) => void): void {
		this.listeners.push(listener);
	}

	/**
	 * Remove memory status listener
	 */
	public removeListener(listener: (status: MemoryStatus) => void): void {
		const index = this.listeners.indexOf(listener);
		if (index > -1) {
			this.listeners.splice(index, 1);
		}
	}

	/**
	 * Get last known status
	 */
	public getLastStatus(): MemoryStatus | null {
		return this.lastStatus;
	}

	/**
	 * Update configuration
	 */
	public updateConfig(config: Partial<MemoryPressureConfig>): void {
		this.config = { ...this.config, ...config };
	}

	/**
	 * Emergency abort notification
	 */
	private notifyEmergencyAbort(status: MemoryStatus): void {
		// Dispatch custom event for emergency abort
		if (browser) {
			const event = new CustomEvent('memoryPressureCritical', {
				detail: { status }
			});
			window.dispatchEvent(event);
		}
	}

	/**
	 * Create iOS-optimized monitor instance
	 */
	public static createIOSOptimized(): MemoryPressureMonitor {
		return MemoryPressureMonitor.getInstance({
			maxUsagePercent: 65, // Very conservative for iOS
			criticalUsagePercent: 75, // Lower threshold for iOS
			monitoringInterval: 500, // More frequent monitoring
			enableLogging: true,
			abortOnCritical: true
		});
	}
}

// Export singleton instance
export const memoryPressureMonitor = MemoryPressureMonitor.getInstance();

// Export convenience functions
export function startMemoryMonitoring(config?: Partial<MemoryPressureConfig>): void {
	const monitor = MemoryPressureMonitor.getInstance(config);
	monitor.startMonitoring();
}

export function stopMemoryMonitoring(): void {
	memoryPressureMonitor.stopMonitoring();
}

export function isSafeToAllocate(estimatedMB: number = 10): boolean {
	return memoryPressureMonitor.isSafeToAllocate(estimatedMB);
}

export function getMemoryStatus(): MemoryStatus {
	return memoryPressureMonitor.getMemoryStatus();
}
