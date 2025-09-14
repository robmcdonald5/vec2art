/**
 * iPhone Debug Logger
 * Captures and reports iPhone-specific errors to help diagnose production issues
 */

import { browser } from '$app/environment';

interface iPhoneErrorReport {
	timestamp: string;
	userAgent: string;
	url: string;
	error: string;
	errorType: string;
	stackTrace?: string;
	deviceInfo: any;
	wasmStatus: any;
}

class IPhoneDebugLogger {
	private isIOSSafari: boolean = false;
	private errorReports: iPhoneErrorReport[] = [];

	constructor() {
		if (browser) {
			this.isIOSSafari =
				/iPad|iPhone|iPod/.test(navigator.userAgent) &&
				/^((?!chrome|android).)*safari/i.test(navigator.userAgent);

			if (this.isIOSSafari) {
				this.setupErrorHandlers();
				console.log('[iPhone Debug] iPhone Safari detected - error logging enabled');
			}
		}
	}

	private setupErrorHandlers() {
		// Capture JavaScript errors
		window.addEventListener('error', (event) => {
			this.logError({
				error: event.message,
				errorType: 'JavaScript Error',
				stackTrace: event.error?.stack,
				source: event.filename,
				line: event.lineno,
				column: event.colno
			});
		});

		// Capture unhandled promise rejections
		window.addEventListener('unhandledrejection', (event) => {
			this.logError({
				error: event.reason?.message || `${event.reason}`,
				errorType: 'Unhandled Promise Rejection',
				stackTrace: event.reason?.stack,
				promise: true
			});
		});

		// Capture CSP violations
		document.addEventListener('securitypolicyviolation', (event) => {
			this.logError({
				error: `CSP Violation: ${event.violatedDirective}`,
				errorType: 'CSP Violation',
				blockedURI: event.blockedURI,
				violatedDirective: event.violatedDirective,
				originalPolicy: event.originalPolicy
			});
		});
	}

	private logError(errorDetails: any) {
		if (!this.isIOSSafari) return;

		const report: iPhoneErrorReport = {
			timestamp: new Date().toISOString(),
			userAgent: navigator.userAgent,
			url: window.location.href,
			error: errorDetails.error,
			errorType: errorDetails.errorType,
			stackTrace: errorDetails.stackTrace,
			deviceInfo: this.getDeviceInfo(),
			wasmStatus: this.getWasmStatus()
		};

		this.errorReports.push(report);

		// Log to console for immediate visibility
		console.error('[iPhone Debug] Error captured:', report);

		// Also log to localStorage for persistence
		try {
			const existingReports = JSON.parse(localStorage.getItem('iphone-error-reports') || '[]');
			existingReports.push(report);

			// Keep only last 10 reports to avoid storage bloat
			if (existingReports.length > 10) {
				existingReports.splice(0, existingReports.length - 10);
			}

			localStorage.setItem('iphone-error-reports', JSON.stringify(existingReports));
		} catch (storageError) {
			console.warn('[iPhone Debug] Could not save error report to localStorage:', storageError);
		}

		// If this is a critical WASM error, try to help user
		if (errorDetails.error.includes('WASM') || errorDetails.error.includes('WebAssembly')) {
			this.handleWasmError(report);
		}

		// If this is a CSP error, provide specific guidance
		if (errorDetails.errorType === 'CSP Violation') {
			this.handleCSPError(report);
		}
	}

	private getDeviceInfo() {
		return {
			userAgent: navigator.userAgent,
			cookieEnabled: navigator.cookieEnabled,
			onLine: navigator.onLine,
			hardwareConcurrency: navigator.hardwareConcurrency || 0,
			memory: (performance as any).memory
				? {
						used: (performance as any).memory.usedJSHeapSize,
						total: (performance as any).memory.totalJSHeapSize,
						limit: (performance as any).memory.jsHeapSizeLimit
					}
				: null,
			connection: (navigator as any).connection
				? {
						effectiveType: (navigator as any).connection.effectiveType,
						downlink: (navigator as any).connection.downlink,
						rtt: (navigator as any).connection.rtt
					}
				: null,
			webAssemblySupported: typeof WebAssembly !== 'undefined',
			sharedArrayBufferSupported: typeof SharedArrayBuffer !== 'undefined',
			workerSupported: typeof Worker !== 'undefined',
			crossOriginIsolated: window.crossOriginIsolated
		};
	}

	private getWasmStatus() {
		const wasmModule = (window as any).wasmJs;
		return {
			loaded: !!wasmModule,
			functions: wasmModule
				? Object.getOwnPropertyNames(wasmModule)
						.filter((name) => typeof wasmModule[name] === 'function')
						.slice(0, 5)
				: [],
			hasInit: wasmModule && typeof wasmModule.init === 'function',
			hasConvert:
				wasmModule &&
				Object.getOwnPropertyNames(wasmModule).some((name) =>
					name.toLowerCase().includes('convert')
				)
		};
	}

	private handleWasmError(report: iPhoneErrorReport) {
		console.error('[iPhone Debug] WASM Error detected on iPhone Safari:');
		console.error('This may indicate:');
		console.error('1. WASM file failed to load from CDN');
		console.error('2. Content Security Policy blocking WASM execution');
		console.error('3. iPhone Safari WASM compatibility issue');
		console.error('4. Memory pressure preventing WASM initialization');
		console.error('Report:', report);

		// Mark this as a critical issue
		localStorage.setItem('iphone-wasm-error-detected', 'true');
	}

	private handleCSPError(report: iPhoneErrorReport) {
		console.error('[iPhone Debug] CSP Violation detected on iPhone Safari:');
		console.error('This is likely the cause of converter failures!');
		console.error('The Content Security Policy is blocking script execution.');
		console.error('Report:', report);

		// This is very likely the root cause
		localStorage.setItem('iphone-csp-error-detected', 'true');
	}

	// Public methods for external use
	public getErrorReports(): iPhoneErrorReport[] {
		return [...this.errorReports];
	}

	public clearErrorReports(): void {
		this.errorReports = [];
		localStorage.removeItem('iphone-error-reports');
		localStorage.removeItem('iphone-wasm-error-detected');
		localStorage.removeItem('iphone-csp-error-detected');
	}

	public getSummary() {
		return {
			isIOSSafari: this.isIOSSafari,
			totalErrors: this.errorReports.length,
			wasmErrors: this.errorReports.filter(
				(r) => r.errorType.includes('WASM') || r.error.includes('WASM')
			).length,
			cspErrors: this.errorReports.filter((r) => r.errorType === 'CSP Violation').length,
			hasWasmErrorFlag: localStorage.getItem('iphone-wasm-error-detected') === 'true',
			hasCSPErrorFlag: localStorage.getItem('iphone-csp-error-detected') === 'true'
		};
	}

	// Method to export error reports for support
	public exportErrorReports(): string {
		const allReports = JSON.parse(localStorage.getItem('iphone-error-reports') || '[]');
		const summary = this.getSummary();

		return JSON.stringify(
			{
				summary,
				reports: allReports,
				deviceInfo: this.getDeviceInfo(),
				wasmStatus: this.getWasmStatus(),
				timestamp: new Date().toISOString()
			},
			null,
			2
		);
	}
}

// Create singleton instance
const iPhoneDebugLogger = new IPhoneDebugLogger();

export default iPhoneDebugLogger;

// Convenience functions
export function getiPhoneErrorSummary() {
	return iPhoneDebugLogger.getSummary();
}

export function exportiPhoneErrorReports() {
	return iPhoneDebugLogger.exportErrorReports();
}

export function cleariPhoneErrorReports() {
	iPhoneDebugLogger.clearErrorReports();
}
