/**
 * CPU Detection and Performance Optimization Utilities
 * Automatically detects user's hardware capabilities and provides intelligent recommendations
 */

export interface CPUCapabilities {
	cores: number;
	estimatedPerformance: 'low' | 'medium' | 'high' | 'extreme';
	deviceType: 'mobile' | 'tablet' | 'laptop' | 'desktop' | 'unknown';
	recommendedThreads: number;
	maxSafeThreads: number;
	batteryStatus?: 'charging' | 'discharging' | 'unknown';
	thermalState?: 'nominal' | 'fair' | 'serious' | 'critical' | 'unknown';
	memoryGB: number;
	isLowEndDevice: boolean;
	features: {
		webgl: boolean;
		webgl2: boolean;
		simd: boolean;
		threading: boolean;
		sharedArrayBuffer: boolean;
	};
}

export interface PerformanceRecommendation {
	mode: 'battery' | 'balanced' | 'performance' | 'extreme';
	threadCount: number;
	reasoning: string[];
	warnings: string[];
	estimatedProcessingTime: string;
	cpuUsageEstimate: number; // 0-100%
}

/**
 * Comprehensive CPU and device capability detection
 */
export async function detectCPUCapabilities(): Promise<CPUCapabilities> {
	const cores = navigator.hardwareConcurrency || 4;

	// Detect device type
	const deviceType = detectDeviceType();

	// Estimate performance based on cores and device type
	const estimatedPerformance = estimatePerformanceClass(cores, deviceType);

	// Get memory information
	const memoryGB = getMemoryEstimate();

	// Check if this is a low-end device
	const isLowEndDevice = cores <= 2 || memoryGB <= 2 || deviceType === 'mobile';

	// Calculate safe thread recommendations
	const { recommendedThreads, maxSafeThreads } = calculateThreadRecommendations(
		cores,
		deviceType,
		estimatedPerformance,
		isLowEndDevice
	);

	// Get battery status if available
	const batteryStatus = await getBatteryStatus();

	// Get thermal state if available
	const thermalState = getThermalState();

	// Check feature support
	const features = await checkFeatureSupport();

	return {
		cores,
		estimatedPerformance,
		deviceType,
		recommendedThreads,
		maxSafeThreads,
		batteryStatus,
		thermalState,
		memoryGB,
		isLowEndDevice,
		features
	};
}

/**
 * Generate intelligent performance recommendations based on hardware
 */
export function generatePerformanceRecommendations(
	capabilities: CPUCapabilities
): PerformanceRecommendation[] {
	const recommendations: PerformanceRecommendation[] = [];

	// Battery Saver Mode
	recommendations.push({
		mode: 'battery',
		threadCount: 1,
		reasoning: ['Minimal CPU usage', 'Extends battery life', 'Keeps system responsive'],
		warnings: capabilities.cores > 4 ? ['Processing will be slower than optimal'] : [],
		estimatedProcessingTime: '3-5 seconds',
		cpuUsageEstimate: 25
	});

	// Balanced Mode (Recommended)
	const balancedThreads = capabilities.recommendedThreads;
	const balancedReasons = [
		`Uses ${balancedThreads}/${capabilities.cores} cores`,
		'Leaves headroom for other applications',
		'Good balance of speed and efficiency'
	];

	if (capabilities.batteryStatus === 'discharging') {
		balancedReasons.push('Respects battery conservation');
	}

	if (capabilities.isLowEndDevice) {
		balancedReasons.push('Optimized for your device class');
	}

	recommendations.push({
		mode: 'balanced',
		threadCount: balancedThreads,
		reasoning: balancedReasons,
		warnings: [],
		estimatedProcessingTime:
			capabilities.estimatedPerformance === 'high' ? '1-2 seconds' : '2-3 seconds',
		cpuUsageEstimate: Math.round((balancedThreads / capabilities.cores) * 70)
	});

	// Performance Mode
	const perfThreads = Math.min(capabilities.cores, capabilities.maxSafeThreads);
	const perfReasons = [
		`Uses ${perfThreads}/${capabilities.cores} cores`,
		'Maximum processing speed',
		'Best for batch processing'
	];

	const perfWarnings = [];
	if (capabilities.batteryStatus === 'discharging') {
		perfWarnings.push('High battery usage');
	}
	if (capabilities.thermalState === 'fair' || capabilities.thermalState === 'serious') {
		perfWarnings.push('May increase device temperature');
	}
	if (capabilities.isLowEndDevice) {
		perfWarnings.push('May affect system responsiveness');
	}

	recommendations.push({
		mode: 'performance',
		threadCount: perfThreads,
		reasoning: perfReasons,
		warnings: perfWarnings,
		estimatedProcessingTime:
			capabilities.estimatedPerformance === 'high' ? '0.8-1.5 seconds' : '1.5-2.5 seconds',
		cpuUsageEstimate: Math.round((perfThreads / capabilities.cores) * 85)
	});

	// Extreme Mode (only for high-end systems)
	if (capabilities.estimatedPerformance === 'extreme' && capabilities.cores >= 8) {
		recommendations.push({
			mode: 'extreme',
			threadCount: capabilities.cores,
			reasoning: [
				'Uses all available cores',
				'Absolute maximum speed',
				'For professional workflows'
			],
			warnings: [
				'Very high CPU usage',
				'System may become less responsive',
				'High power consumption'
			],
			estimatedProcessingTime: '0.5-1 second',
			cpuUsageEstimate: 95
		});
	}

	return recommendations;
}

/**
 * Get the best default recommendation based on current conditions
 */
export function getDefaultRecommendation(capabilities: CPUCapabilities): PerformanceRecommendation {
	const recommendations = generatePerformanceRecommendations(capabilities);

	// Smart default selection
	if (capabilities.batteryStatus === 'discharging' && capabilities.deviceType !== 'desktop') {
		return recommendations.find((r) => r.mode === 'battery') || recommendations[0];
	}

	if (capabilities.isLowEndDevice || capabilities.thermalState === 'serious') {
		return recommendations.find((r) => r.mode === 'battery') || recommendations[0];
	}

	// Default to balanced for most users
	return recommendations.find((r) => r.mode === 'balanced') || recommendations[1];
}

// Helper functions

function detectDeviceType(): CPUCapabilities['deviceType'] {
	// Check for mobile indicators
	if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
		return /iPad|Android(?=.*Mobile)/i.test(navigator.userAgent) ? 'tablet' : 'mobile';
	}

	// Check for desktop indicators
	if (
		navigator.platform.includes('Win') ||
		navigator.platform.includes('Mac') ||
		navigator.platform.includes('Linux')
	) {
		// Distinguish between laptop and desktop
		if ('getBattery' in navigator || 'battery' in navigator) {
			return 'laptop';
		}
		return 'desktop';
	}

	return 'unknown';
}

function estimatePerformanceClass(
	cores: number,
	deviceType: CPUCapabilities['deviceType']
): CPUCapabilities['estimatedPerformance'] {
	if (deviceType === 'mobile') {
		return cores >= 8 ? 'high' : cores >= 6 ? 'medium' : 'low';
	}

	if (deviceType === 'tablet') {
		return cores >= 6 ? 'high' : cores >= 4 ? 'medium' : 'low';
	}

	// Desktop/laptop
	if (cores >= 16) return 'extreme';
	if (cores >= 8) return 'high';
	if (cores >= 4) return 'medium';
	return 'low';
}

function getMemoryEstimate(): number {
	// Try to get actual memory if available
	if ('memory' in navigator && (navigator as any).memory) {
		return Math.round((navigator as any).memory.jsHeapSizeLimit / (1024 * 1024 * 1024));
	}

	// Estimate based on device type and cores
	const cores = navigator.hardwareConcurrency || 4;
	const deviceType = detectDeviceType();

	if (deviceType === 'mobile') return cores >= 8 ? 8 : cores >= 6 ? 6 : 4;
	if (deviceType === 'tablet') return cores >= 6 ? 8 : 6;

	// Desktop/laptop estimates
	if (cores >= 16) return 32;
	if (cores >= 8) return 16;
	if (cores >= 4) return 8;
	return 4;
}

function calculateThreadRecommendations(
	cores: number,
	deviceType: CPUCapabilities['deviceType'],
	performance: CPUCapabilities['estimatedPerformance'],
	isLowEnd: boolean
): { recommendedThreads: number; maxSafeThreads: number } {
	if (isLowEnd || deviceType === 'mobile') {
		return {
			recommendedThreads: Math.min(2, cores - 1),
			maxSafeThreads: Math.min(4, cores)
		};
	}

	if (deviceType === 'tablet') {
		return {
			recommendedThreads: Math.min(cores - 1, 4),
			maxSafeThreads: Math.min(cores, 6)
		};
	}

	// Desktop/laptop
	const recommended = performance === 'extreme' ? Math.min(cores - 2, 12) : Math.min(cores - 2, 8);

	return {
		recommendedThreads: Math.max(1, recommended),
		maxSafeThreads: Math.min(cores, 12)
	};
}

async function getBatteryStatus(): Promise<CPUCapabilities['batteryStatus']> {
	try {
		if ('getBattery' in navigator) {
			const battery = await (navigator as any).getBattery();
			return battery.charging ? 'charging' : 'discharging';
		}

		if ('battery' in navigator) {
			const battery = (navigator as any).battery;
			return battery.charging ? 'charging' : 'discharging';
		}
	} catch (error) {
		// Battery API not available or blocked
	}

	return 'unknown';
}

function getThermalState(): CPUCapabilities['thermalState'] {
	try {
		if ('deviceMemory' in navigator) {
			// Very rough estimation based on device memory
			const memory = (navigator as any).deviceMemory;
			if (memory <= 2) return 'fair';
		}
	} catch (error) {
		// Not available
	}

	return 'unknown';
}

async function checkFeatureSupport(): Promise<CPUCapabilities['features']> {
	const features = {
		webgl: false,
		webgl2: false,
		simd: false,
		threading: false,
		sharedArrayBuffer: false
	};

	// WebGL support
	try {
		const canvas = document.createElement('canvas');
		features.webgl = !!canvas.getContext('webgl');
		features.webgl2 = !!canvas.getContext('webgl2');
	} catch (error) {
		// WebGL not supported
	}

	// SIMD support
	features.simd = 'WebAssembly' in window && 'SIMD' in WebAssembly;

	// Threading support
	features.sharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
	features.threading = features.sharedArrayBuffer && window.crossOriginIsolated;

	return features;
}

/**
 * Monitor CPU usage during processing (basic estimation)
 */
export class CPUMonitor {
	private measurements: number[] = [];
	private startTime: number = 0;
	private rafId: number = 0;

	start() {
		this.measurements = [];
		this.startTime = performance.now();
		this.measure();
	}

	stop(): number {
		if (this.rafId) {
			cancelAnimationFrame(this.rafId);
			this.rafId = 0;
		}

		if (this.measurements.length === 0) return 0;

		// Calculate average frame time to estimate CPU load
		const avgFrameTime = this.measurements.reduce((a, b) => a + b, 0) / this.measurements.length;
		const expectedFrameTime = 16.67; // 60fps

		// Rough estimation of CPU usage based on frame timing
		return Math.min(100, Math.max(0, (avgFrameTime / expectedFrameTime - 1) * 100));
	}

	private measure = () => {
		const now = performance.now();
		if (this.measurements.length > 0) {
			const frameTime = now - this.measurements[this.measurements.length - 1];
			this.measurements.push(frameTime);

			// Keep only recent measurements
			if (this.measurements.length > 60) {
				this.measurements.shift();
			}
		} else {
			this.measurements.push(now);
		}

		this.rafId = requestAnimationFrame(this.measure);
	};
}
