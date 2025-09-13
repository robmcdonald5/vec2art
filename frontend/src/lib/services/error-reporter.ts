/**
 * Enhanced Error Reporting Service
 * Captures and reports detailed error information for debugging iOS/Safari issues
 */

import { browser } from '$app/environment';

export interface ErrorReport {
	id: string;
	timestamp: string;
	url: string;
	userAgent: string;
	platform: string;
	// Device info
	device: {
		type: 'mobile' | 'tablet' | 'desktop';
		isIOS: boolean;
		isSafari: boolean;
		isChrome: boolean;
		isFirefox: boolean;
		screenSize: { width: number; height: number };
		pixelRatio: number;
		touchSupport: boolean;
		memoryInfo?: {
			jsHeapSizeLimit?: number;
			totalJSHeapSize?: number;
			usedJSHeapSize?: number;
		};
	};
	// Browser capabilities
	capabilities: {
		webAssembly: boolean;
		sharedArrayBuffer: boolean;
		atomics: boolean;
		crossOriginIsolated: boolean;
		serviceWorker: boolean;
		webWorker: boolean;
		offscreenCanvas: boolean;
		hardwareConcurrency: number;
	};
	// Error details
	error: {
		type: 'wasm-init' | 'conversion' | 'memory' | 'worker' | 'network' | 'unknown';
		message: string;
		stack?: string;
		componentStack?: string;
		additionalInfo?: any;
	};
	// WASM specific info
	wasmInfo?: {
		moduleLoaded: boolean;
		initialized: boolean;
		threadingSupported: boolean;
		threadCount: number;
		memoryPages?: number;
		lastOperation?: string;
		initErrors?: string[];
	};
	// Console logs around the error
	consoleLogs: Array<{
		type: string;
		message: string;
		timestamp: string;
	}>;
	// Network requests that failed
	failedRequests: Array<{
		url: string;
		method: string;
		status?: number;
		error?: string;
	}>;
}

class ErrorReporter {
	private static instance: ErrorReporter;
	private reports: ErrorReport[] = [];
	private consoleLogs: Array<{ type: string; message: string; timestamp: string }> = [];
	private maxConsoleLogSize = 50;
	private failedRequests: Array<{ url: string; method: string; status?: number; error?: string }> =
		[];
	private isSetup = false;
	private errorListeners: Array<(report: ErrorReport) => void> = [];

	private constructor() {}

	public static getInstance(): ErrorReporter {
		if (!ErrorReporter.instance) {
			ErrorReporter.instance = new ErrorReporter();
		}
		return ErrorReporter.instance;
	}

	/**
	 * Initialize error reporting - should be called once on app start
	 */
	public setup(): void {
		if (!browser || this.isSetup) return;
		this.isSetup = true;

		// Intercept console methods
		this.interceptConsole();

		// Listen for global errors
		window.addEventListener('error', this.handleGlobalError.bind(this));
		window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));

		// Monitor network failures
		this.monitorNetwork();

		console.log('[ErrorReporter] Initialized');
	}

	/**
	 * Intercept console methods to capture logs
	 */
	private interceptConsole(): void {
		const originalLog = console.log;
		const originalWarn = console.warn;
		const originalError = console.error;

		console.log = (...args: any[]) => {
			this.addConsoleLog('log', args.join(' '));
			originalLog.apply(console, args);
		};

		console.warn = (...args: any[]) => {
			this.addConsoleLog('warn', args.join(' '));
			originalWarn.apply(console, args);
		};

		console.error = (...args: any[]) => {
			this.addConsoleLog('error', args.join(' '));
			originalError.apply(console, args);
		};
	}

	/**
	 * Add console log to buffer
	 */
	private addConsoleLog(type: string, message: string): void {
		this.consoleLogs.push({
			type,
			message: message.substring(0, 500), // Limit message size
			timestamp: new Date().toISOString()
		});

		// Keep only recent logs
		if (this.consoleLogs.length > this.maxConsoleLogSize) {
			this.consoleLogs.shift();
		}
	}

	/**
	 * Monitor network requests for failures
	 */
	private monitorNetwork(): void {
		// Intercept fetch
		const originalFetch = window.fetch;
		window.fetch = async (...args: Parameters<typeof fetch>) => {
			const [input, init] = args;
			const url =
				typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
			const method = init?.method || 'GET';

			try {
				const response = await originalFetch(...args);
				if (!response.ok) {
					this.failedRequests.push({
						url,
						method,
						status: response.status
					});
				}
				return response;
			} catch (error: any) {
				this.failedRequests.push({
					url,
					method,
					error: error.message
				});
				throw error;
			}
		};
	}

	/**
	 * Handle global errors
	 */
	private handleGlobalError(event: ErrorEvent): void {
		this.captureError({
			type: 'unknown',
			message: event.message,
			stack: event.error?.stack,
			additionalInfo: {
				filename: event.filename,
				lineno: event.lineno,
				colno: event.colno
			}
		});
	}

	/**
	 * Handle unhandled promise rejections
	 */
	private handleUnhandledRejection(event: PromiseRejectionEvent): void {
		this.captureError({
			type: 'unknown',
			message: event.reason?.message || String(event.reason),
			stack: event.reason?.stack,
			additionalInfo: {
				promise: true
			}
		});
	}

	/**
	 * Get device information
	 */
	private getDeviceInfo(): ErrorReport['device'] {
		const ua = navigator.userAgent;
		const _platform = navigator.platform;

		// Detect device type
		const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
		const isTablet = /iPad|Android/i.test(ua) && !/Mobile/i.test(ua);
		const type = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

		// Detect browser
		const isIOS = /iPad|iPhone|iPod/.test(ua);
		const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
		const isChrome = /Chrome/.test(ua) && !/Edge/.test(ua);
		const isFirefox = /Firefox/.test(ua);

		// Memory info (Chrome only)
		const memoryInfo = (performance as any).memory
			? {
					jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
					totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
					usedJSHeapSize: (performance as any).memory.usedJSHeapSize
				}
			: undefined;

		return {
			type,
			isIOS,
			isSafari,
			isChrome,
			isFirefox,
			screenSize: {
				width: window.screen.width,
				height: window.screen.height
			},
			pixelRatio: window.devicePixelRatio || 1,
			touchSupport: 'ontouchstart' in window,
			memoryInfo
		};
	}

	/**
	 * Get browser capabilities
	 */
	private getCapabilities(): ErrorReport['capabilities'] {
		return {
			webAssembly: typeof WebAssembly !== 'undefined',
			sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
			atomics: typeof Atomics !== 'undefined',
			crossOriginIsolated: (window as any).crossOriginIsolated || false,
			serviceWorker: 'serviceWorker' in navigator,
			webWorker: typeof Worker !== 'undefined',
			offscreenCanvas: typeof OffscreenCanvas !== 'undefined',
			hardwareConcurrency: navigator.hardwareConcurrency || 1
		};
	}

	/**
	 * Get WASM-specific information
	 */
	private async getWasmInfo(): Promise<ErrorReport['wasmInfo']> {
		try {
			// Try to get WASM module info if available
			const wasmModule = (window as any).wasmJs;
			if (!wasmModule) {
				return {
					moduleLoaded: false,
					initialized: false,
					threadingSupported: false,
					threadCount: 0
				};
			}

			return {
				moduleLoaded: true,
				initialized: !!wasmModule.WasmVectorizer,
				threadingSupported:
					typeof wasmModule.is_threading_supported === 'function'
						? wasmModule.is_threading_supported()
						: false,
				threadCount:
					typeof wasmModule.get_thread_count === 'function' ? wasmModule.get_thread_count() : 0,
				memoryPages:
					typeof wasmModule.memory !== 'undefined'
						? wasmModule.memory.buffer.byteLength / 65536
						: undefined
			};
		} catch (error) {
			return {
				moduleLoaded: false,
				initialized: false,
				threadingSupported: false,
				threadCount: 0,
				initErrors: [(error as Error).message]
			};
		}
	}

	/**
	 * Capture and report an error
	 */
	public async captureError(error: {
		type: ErrorReport['error']['type'];
		message: string;
		stack?: string;
		componentStack?: string;
		additionalInfo?: any;
	}): Promise<ErrorReport> {
		const report: ErrorReport = {
			id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			timestamp: new Date().toISOString(),
			url: window.location.href,
			userAgent: navigator.userAgent,
			platform: navigator.platform,
			device: this.getDeviceInfo(),
			capabilities: this.getCapabilities(),
			error,
			wasmInfo: await this.getWasmInfo(),
			consoleLogs: [...this.consoleLogs], // Copy current logs
			failedRequests: [...this.failedRequests]
		};

		this.reports.push(report);

		// Notify listeners
		this.errorListeners.forEach((listener) => listener(report));

		// Log to console for debugging
		console.group(`🔴 Error Report ${report.id}`);
		console.log('Error:', error.message);
		console.log('Device:', report.device);
		console.log('Capabilities:', report.capabilities);
		console.log('WASM Info:', report.wasmInfo);
		if (error.stack) console.log('Stack:', error.stack);
		console.groupEnd();

		// Store in session storage for persistence
		this.storeReport(report);

		return report;
	}

	/**
	 * Store report in session storage
	 */
	private storeReport(report: ErrorReport): void {
		try {
			const storedReports = sessionStorage.getItem('error_reports');
			const reports = storedReports ? JSON.parse(storedReports) : [];
			reports.push(report);
			// Keep only last 10 reports
			if (reports.length > 10) reports.shift();
			sessionStorage.setItem('error_reports', JSON.stringify(reports));
		} catch (_e) {
			// Ignore storage errors
		}
	}

	/**
	 * Get all error reports
	 */
	public getReports(): ErrorReport[] {
		return [...this.reports];
	}

	/**
	 * Get stored reports from session storage
	 */
	public getStoredReports(): ErrorReport[] {
		try {
			const storedReports = sessionStorage.getItem('error_reports');
			return storedReports ? JSON.parse(storedReports) : [];
		} catch {
			return [];
		}
	}

	/**
	 * Clear all reports
	 */
	public clearReports(): void {
		this.reports = [];
		this.consoleLogs = [];
		this.failedRequests = [];
		try {
			sessionStorage.removeItem('error_reports');
		} catch {
			// Ignore
		}
	}

	/**
	 * Export reports as JSON
	 */
	public exportReports(): string {
		const allReports = [...this.getStoredReports(), ...this.reports];
		return JSON.stringify(allReports, null, 2);
	}

	/**
	 * Download reports as file
	 */
	public downloadReports(): void {
		const data = this.exportReports();
		const blob = new Blob([data], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `error-reports-${Date.now()}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	/**
	 * Add error listener
	 */
	public addListener(listener: (report: ErrorReport) => void): void {
		this.errorListeners.push(listener);
	}

	/**
	 * Remove error listener
	 */
	public removeListener(listener: (report: ErrorReport) => void): void {
		const index = this.errorListeners.indexOf(listener);
		if (index > -1) {
			this.errorListeners.splice(index, 1);
		}
	}

	/**
	 * Check if running on iOS Safari
	 */
	public isIOSSafari(): boolean {
		const device = this.getDeviceInfo();
		return device.isIOS && device.isSafari;
	}

	/**
	 * Get a summary of current system state
	 */
	public getSystemSummary(): string {
		const device = this.getDeviceInfo();
		const caps = this.getCapabilities();

		const lines = [
			`Platform: ${device.type} (${device.isIOS ? 'iOS' : 'Other'})`,
			`Browser: ${device.isSafari ? 'Safari' : device.isChrome ? 'Chrome' : device.isFirefox ? 'Firefox' : 'Other'}`,
			`Screen: ${device.screenSize.width}x${device.screenSize.height} @${device.pixelRatio}x`,
			`WebAssembly: ${caps.webAssembly ? '✓' : '✗'}`,
			`SharedArrayBuffer: ${caps.sharedArrayBuffer ? '✓' : '✗'}`,
			`Cross-Origin Isolated: ${caps.crossOriginIsolated ? '✓' : '✗'}`,
			`Hardware Threads: ${caps.hardwareConcurrency}`,
			`Touch Support: ${device.touchSupport ? '✓' : '✗'}`
		];

		if (device.memoryInfo) {
			lines.push(
				`Memory: ${Math.round(device.memoryInfo.usedJSHeapSize! / 1048576)}MB / ${Math.round(
					device.memoryInfo.jsHeapSizeLimit! / 1048576
				)}MB`
			);
		}

		return lines.join('\n');
	}
}

// Export singleton instance
export const errorReporter = ErrorReporter.getInstance();

// Export convenience functions
export function captureWasmError(message: string, additionalInfo?: any): Promise<ErrorReport> {
	return errorReporter.captureError({
		type: 'wasm-init',
		message,
		additionalInfo
	});
}

export function captureConversionError(
	message: string,
	stack?: string,
	additionalInfo?: any
): Promise<ErrorReport> {
	return errorReporter.captureError({
		type: 'conversion',
		message,
		stack,
		additionalInfo
	});
}

export function captureMemoryError(message: string, additionalInfo?: any): Promise<ErrorReport> {
	return errorReporter.captureError({
		type: 'memory',
		message,
		additionalInfo
	});
}

export function captureWorkerError(
	message: string,
	stack?: string,
	additionalInfo?: any
): Promise<ErrorReport> {
	return errorReporter.captureError({
		type: 'worker',
		message,
		stack,
		additionalInfo
	});
}
