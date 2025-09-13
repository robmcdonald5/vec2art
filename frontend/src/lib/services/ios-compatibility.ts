/**
 * iOS Compatibility Service
 * Detects iOS/Safari and applies necessary workarounds for WASM issues
 */

import { browser } from '$app/environment';
import { errorReporter } from './error-reporter';

export interface IOSCompatibilityInfo {
	isIOS: boolean;
	isSafari: boolean;
	isIOSSafari: boolean;
	iOSVersion: string | null;
	safariVersion: string | null;
	isIPad: boolean;
	isIPhone: boolean;
	isPWA: boolean;
	hasSharedArrayBuffer: boolean;
	hasCrossOriginIsolation: boolean;
	recommendedConfig: WasmIOSConfig;
}

export interface WasmIOSConfig {
	disableThreading: boolean;
	useSmallMemory: boolean;
	memoryPagesLimit: number;
	memoryLimitMB: number;
	disableMemoryGrowth: boolean;
	useFallbackMode: boolean;
	showWarning: boolean;
	warningMessage?: string;
	enableMemoryMonitoring: boolean;
	maxMemoryUsagePercent: number;
	forceSingleThreaded: boolean;
}

class IOSCompatibilityService {
	private static instance: IOSCompatibilityService;
	private compatInfo: IOSCompatibilityInfo | null = null;
	private hasAppliedWorkarounds = false;

	private constructor() {}

	public static getInstance(): IOSCompatibilityService {
		if (!IOSCompatibilityService.instance) {
			IOSCompatibilityService.instance = new IOSCompatibilityService();
		}
		return IOSCompatibilityService.instance;
	}

	/**
	 * Detect iOS and Safari versions
	 */
	private detectIOSAndSafari(): {
		isIOS: boolean;
		isSafari: boolean;
		isIOSSafari: boolean;
		iOSVersion: string | null;
		safariVersion: string | null;
		isIPad: boolean;
		isIPhone: boolean;
		isPWA: boolean;
	} {
		if (!browser) {
			return {
				isIOS: false,
				isSafari: false,
				isIOSSafari: false,
				iOSVersion: null,
				safariVersion: null,
				isIPad: false,
				isIPhone: false,
				isPWA: false
			};
		}

		const ua = navigator.userAgent;
		const platform = navigator.platform;

		// Detect iOS
		const isIOS =
			/iPad|iPhone|iPod/.test(ua) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPad Pro detection

		const isIPad = /iPad/.test(ua) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1);
		const isIPhone = /iPhone/.test(ua);

		// Detect Safari
		const isSafari = /^((?!chrome|android).)*safari/i.test(ua);

		// Detect iOS version
		let iOSVersion: string | null = null;
		if (isIOS) {
			const match = ua.match(/OS (\d+)_(\d+)_?(\d+)?/);
			if (match) {
				iOSVersion = `${match[1]}.${match[2]}${match[3] ? '.' + match[3] : ''}`;
			}
		}

		// Detect Safari version
		let safariVersion: string | null = null;
		if (isSafari) {
			const match = ua.match(/Version\/(\d+)\.(\d+)/);
			if (match) {
				safariVersion = `${match[1]}.${match[2]}`;
			}
		}

		// Detect if running as PWA
		const isPWA =
			(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
			(window.navigator as any).standalone ||
			document.referrer.includes('android-app://');

		return {
			isIOS,
			isSafari,
			isIOSSafari: isIOS && isSafari,
			iOSVersion,
			safariVersion,
			isIPad,
			isIPhone,
			isPWA
		};
	}

	/**
	 * Check WebAssembly capabilities
	 */
	private checkWasmCapabilities(): {
		hasSharedArrayBuffer: boolean;
		hasCrossOriginIsolation: boolean;
	} {
		return {
			hasSharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
			hasCrossOriginIsolation: !!(window as any).crossOriginIsolated
		};
	}

	/**
	 * Get compatibility information
	 */
	public getCompatibilityInfo(): IOSCompatibilityInfo {
		if (!this.compatInfo) {
			const iosInfo = this.detectIOSAndSafari();
			const wasmCaps = this.checkWasmCapabilities();

			// Determine recommended configuration based on detection
			const recommendedConfig = this.determineRecommendedConfig({
				...iosInfo,
				...wasmCaps
			});

			this.compatInfo = {
				...iosInfo,
				...wasmCaps,
				recommendedConfig
			};
		}

		return this.compatInfo;
	}

	/**
	 * Determine recommended WASM configuration for iOS
	 */
	private determineRecommendedConfig(info: {
		isIOS: boolean;
		isSafari: boolean;
		isIOSSafari: boolean;
		iOSVersion: string | null;
		safariVersion: string | null;
		isIPad: boolean;
		isIPhone: boolean;
		isPWA: boolean;
		hasSharedArrayBuffer: boolean;
		hasCrossOriginIsolation: boolean;
	}): WasmIOSConfig {
		const config: WasmIOSConfig = {
			disableThreading: false,
			useSmallMemory: false,
			memoryPagesLimit: 256, // Default: 256 pages = 16MB
			memoryLimitMB: 256, // Default: 256MB
			disableMemoryGrowth: false,
			useFallbackMode: false,
			showWarning: false,
			enableMemoryMonitoring: false,
			maxMemoryUsagePercent: 80,
			forceSingleThreaded: false
		};

		// iOS Safari specific workarounds - Based on crash testing findings
		if (info.isIOSSafari) {
			// CRITICAL: Force single-threaded to prevent crashes
			config.disableThreading = true;
			config.forceSingleThreaded = true;

			// Enable aggressive memory monitoring to prevent crashes
			config.enableMemoryMonitoring = true;
			config.maxMemoryUsagePercent = 70; // Much stricter than default 80%

			// Check iOS version for specific memory restrictions
			const iOSMajorVersion = info.iOSVersion ? parseInt(info.iOSVersion.split('.')[0]) : 0;

			if (iOSMajorVersion < 15) {
				// Older iOS versions: Extremely restrictive to prevent crashes
				config.useSmallMemory = true;
				config.memoryPagesLimit = 64; // 4MB limit - very conservative
				config.memoryLimitMB = 32; // 32MB total limit
				config.disableMemoryGrowth = true;
				config.useFallbackMode = true;
				config.maxMemoryUsagePercent = 60; // Even stricter
			} else if (iOSMajorVersion === 15) {
				// iOS 15: Restrictive memory limits based on testing
				config.useSmallMemory = true;
				config.memoryPagesLimit = 128; // 8MB limit
				config.memoryLimitMB = 48; // 48MB total limit
				config.disableMemoryGrowth = true;
				config.maxMemoryUsagePercent = 65;
			} else if (iOSMajorVersion >= 16) {
				// iOS 16+: Still restrictive but more generous
				config.useSmallMemory = true;
				config.memoryPagesLimit = 192; // 12MB limit
				config.memoryLimitMB = 64; // 64MB total limit - key finding from tests
				config.disableThreading = true;
				config.maxMemoryUsagePercent = 70;
			}

			// iPhone vs iPad memory differentiation
			if (info.isIPhone) {
				// iPhones have less RAM - even stricter limits
				config.memoryPagesLimit = Math.min(config.memoryPagesLimit, 128); // Max 8MB
				config.memoryLimitMB = Math.min(config.memoryLimitMB, 48); // Max 48MB
				config.maxMemoryUsagePercent = Math.min(config.maxMemoryUsagePercent, 65);
			} else if (info.isIPad) {
				// iPads can handle slightly more but still conservative
				config.memoryLimitMB = Math.min(config.memoryLimitMB, 80); // Max 80MB for iPad
			}

			// PWA mode: Additional restrictions due to app container limits
			if (info.isPWA) {
				config.memoryPagesLimit = Math.min(config.memoryPagesLimit, 96); // Further limit in PWA
				config.memoryLimitMB = Math.min(config.memoryLimitMB, 40);
				config.maxMemoryUsagePercent = 60;
			}
		}

		// Non-iOS Safari (macOS Safari)
		else if (info.isSafari && !info.isIOS) {
			// macOS Safari generally works better but may still need threading disabled
			if (!info.hasSharedArrayBuffer || !info.hasCrossOriginIsolation) {
				config.disableThreading = true;
				config.showWarning = true;
				config.warningMessage =
					'Threading disabled. Enable Cross-Origin Isolation for better performance.';
			}
		}

		return config;
	}

	/**
	 * Apply iOS workarounds to WASM configuration
	 */
	public applyWorkarounds(wasmConfig: any): any {
		const info = this.getCompatibilityInfo();

		if (!info.isIOSSafari && !info.isSafari) {
			// No workarounds needed
			return wasmConfig;
		}

		console.log('[iOS Compatibility] Applying workarounds:', info.recommendedConfig);

		// Log to error reporter for debugging
		errorReporter.captureError({
			type: 'wasm-init',
			message: 'iOS Compatibility Mode Activated',
			additionalInfo: {
				compatibilityInfo: info,
				originalConfig: wasmConfig
			}
		});

		// Apply workarounds
		const modifiedConfig = { ...wasmConfig };

		if (info.recommendedConfig.disableThreading) {
			modifiedConfig.threadCount = 1;
			modifiedConfig.initializeThreads = false;
			modifiedConfig.threading = false;
		}

		if (info.recommendedConfig.useSmallMemory) {
			modifiedConfig.memoryPages = info.recommendedConfig.memoryPagesLimit;
			modifiedConfig.maximumMemory = info.recommendedConfig.memoryPagesLimit * 65536; // Convert to bytes
		}

		if (info.recommendedConfig.disableMemoryGrowth) {
			modifiedConfig.allowMemoryGrowth = false;
		}

		if (info.recommendedConfig.useFallbackMode) {
			modifiedConfig.fallbackMode = true;
			modifiedConfig.useSimpleAlgorithms = true;
		}

		this.hasAppliedWorkarounds = true;

		return modifiedConfig;
	}

	/**
	 * Check if we should show iOS warning
	 */
	public shouldShowWarning(): boolean {
		const info = this.getCompatibilityInfo();
		return info.recommendedConfig.showWarning;
	}

	/**
	 * Get warning message for iOS users
	 */
	public getWarningMessage(): string | null {
		const info = this.getCompatibilityInfo();
		return info.recommendedConfig.warningMessage || null;
	}

	/**
	 * Check if fallback mode should be used
	 */
	public shouldUseFallbackMode(): boolean {
		const info = this.getCompatibilityInfo();
		return info.recommendedConfig.useFallbackMode;
	}

	/**
	 * Get memory limit in bytes
	 */
	public getMemoryLimit(): number {
		const info = this.getCompatibilityInfo();
		return info.recommendedConfig.memoryPagesLimit * 65536; // Convert pages to bytes
	}

	/**
	 * Log compatibility information
	 */
	public logCompatibilityInfo(): void {
		const info = this.getCompatibilityInfo();

		console.group('📱 iOS Compatibility Check');
		console.log('Platform:', {
			isIOS: info.isIOS,
			isSafari: info.isSafari,
			isIOSSafari: info.isIOSSafari,
			iOSVersion: info.iOSVersion,
			safariVersion: info.safariVersion,
			device: info.isIPad ? 'iPad' : info.isIPhone ? 'iPhone' : 'Other'
		});
		console.log('Capabilities:', {
			hasSharedArrayBuffer: info.hasSharedArrayBuffer,
			hasCrossOriginIsolation: info.hasCrossOriginIsolation
		});
		console.log('Recommended Config:', info.recommendedConfig);
		console.groupEnd();
	}

	/**
	 * Get diagnostic information for debugging
	 */
	public getDiagnostics(): string {
		const info = this.getCompatibilityInfo();
		const lines = [
			'=== iOS Compatibility Diagnostics ===',
			`Platform: ${info.isIOS ? 'iOS' : 'Non-iOS'}`,
			`Browser: ${info.isSafari ? 'Safari' : 'Other'}`,
			`iOS Version: ${info.iOSVersion || 'N/A'}`,
			`Safari Version: ${info.safariVersion || 'N/A'}`,
			`Device: ${info.isIPad ? 'iPad' : info.isIPhone ? 'iPhone' : 'Other'}`,
			`PWA Mode: ${info.isPWA ? 'Yes' : 'No'}`,
			'',
			'WebAssembly Capabilities:',
			`  SharedArrayBuffer: ${info.hasSharedArrayBuffer ? '✓' : '✗'}`,
			`  Cross-Origin Isolated: ${info.hasCrossOriginIsolation ? '✓' : '✗'}`,
			'',
			'Recommended Configuration:',
			`  Threading: ${info.recommendedConfig.disableThreading ? 'Disabled' : 'Enabled'}`,
			`  Memory Limit: ${info.recommendedConfig.memoryPagesLimit * 64}KB`,
			`  Memory Growth: ${info.recommendedConfig.disableMemoryGrowth ? 'Disabled' : 'Enabled'}`,
			`  Fallback Mode: ${info.recommendedConfig.useFallbackMode ? 'Yes' : 'No'}`,
			'',
			`Workarounds Applied: ${this.hasAppliedWorkarounds ? 'Yes' : 'No'}`,
			'========================='
		];

		return lines.join('\n');
	}

	/**
	 * Test WASM compatibility
	 */
	public async testWasmCompatibility(): Promise<{
		success: boolean;
		errors: string[];
		warnings: string[];
	}> {
		const errors: string[] = [];
		const warnings: string[] = [];
		let success = true;

		try {
			// Test basic WebAssembly support
			if (typeof WebAssembly === 'undefined') {
				errors.push('WebAssembly is not supported');
				success = false;
				return { success, errors, warnings };
			}

			// Test simple WASM instantiation
			const wasmCode = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]);
			await WebAssembly.instantiate(wasmCode);

			// Test memory allocation
			const info = this.getCompatibilityInfo();
			try {
				const memory = new WebAssembly.Memory({
					initial: Math.min(16, info.recommendedConfig.memoryPagesLimit),
					maximum: info.recommendedConfig.memoryPagesLimit
				});

				// Test memory growth if allowed
				if (!info.recommendedConfig.disableMemoryGrowth) {
					memory.grow(1);
				}
			} catch (e: any) {
				warnings.push(`Memory allocation test failed: ${e.message}`);
			}

			// Test SharedArrayBuffer if expected
			if (!info.recommendedConfig.disableThreading) {
				if (!info.hasSharedArrayBuffer) {
					warnings.push('SharedArrayBuffer not available - threading will be disabled');
				}
				if (!info.hasCrossOriginIsolation) {
					warnings.push('Cross-Origin Isolation not enabled - threading will be disabled');
				}
			}

			// iOS specific warnings
			if (info.isIOSSafari) {
				warnings.push('iOS Safari detected - some WebAssembly features may be limited');
				if (info.recommendedConfig.useFallbackMode) {
					warnings.push('Fallback mode enabled for compatibility');
				}
			}
		} catch (error: any) {
			errors.push(`WebAssembly test failed: ${error.message}`);
			success = false;
		}

		return { success, errors, warnings };
	}
}

// Export singleton instance
export const iosCompatibility = IOSCompatibilityService.getInstance();

// Export convenience functions
export function isIOSSafari(): boolean {
	return iosCompatibility.getCompatibilityInfo().isIOSSafari;
}

export function getIOSWasmConfig(): WasmIOSConfig {
	return iosCompatibility.getCompatibilityInfo().recommendedConfig;
}

export function applyIOSWorkarounds(config: any): any {
	return iosCompatibility.applyWorkarounds(config);
}
