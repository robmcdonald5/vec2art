/**
 * Error Tracking and Recovery Monitoring System
 * Comprehensive error handling, tracking, and recovery monitoring
 */

import type {
	ErrorTracking,
	UserInteraction as _UserInteraction,
	PerformanceSnapshot,
	Alert as _Alert
} from '../types/performance.js';
import { performanceMonitor, trackError, trackCustomMetric } from './performance-monitor.js';

/**
 * Error Recovery Status
 */
export interface ErrorRecovery {
	errorId: string;
	recoveryAttempted: boolean;
	recoverySuccessful: boolean;
	recoveryTime: number;
	recoveryMethod: string;
	userActionRequired: boolean;
}

/**
 * Error Context for enhanced debugging
 */
export interface EnhancedErrorContext {
	component?: string;
	action?: string;
	userState?: Record<string, any>;
	systemState?: PerformanceSnapshot;
	breadcrumbs?: string[];
	userAgent?: string;
	url?: string;
	timestamp?: Date;
	sessionId?: string;
}

/**
 * Error Classification
 */
export type ErrorCategory =
	| 'wasm-loading'
	| 'wasm-runtime'
	| 'threading'
	| 'memory'
	| 'processing'
	| 'ui-component'
	| 'file-handling'
	| 'network'
	| 'validation'
	| 'unknown';

/**
 * Error Severity Levels
 */
export type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Error Pattern Detection
 */
export interface ErrorPattern {
	pattern: string;
	occurrences: number;
	firstSeen: Date;
	lastSeen: Date;
	affectedUsers: Set<string>;
	severity: ErrorSeverity;
	isRecurring: boolean;
}

/**
 * Recovery Strategy
 */
export interface RecoveryStrategy {
	name: string;
	description: string;
	canRecover: (error: ErrorTracking) => boolean;
	recover: (error: ErrorTracking, context: EnhancedErrorContext) => Promise<boolean>;
	preventionTips?: string[];
}

/**
 * Error Tracker Class
 */
export class ErrorTracker {
	private errorHistory: ErrorTracking[] = [];
	private recoveryHistory: ErrorRecovery[] = [];
	private errorPatterns = new Map<string, ErrorPattern>();
	private recoveryStrategies: RecoveryStrategy[] = [];
	private breadcrumbs: string[] = [];
	private maxBreadcrumbs = 50;
	private maxErrorHistory = 1000;

	constructor() {
		this.initializeRecoveryStrategies();
		this.setupGlobalErrorHandlers();
	}

	/**
	 * Track an error with enhanced context
	 */
	trackError(error: Error, context: EnhancedErrorContext = {}, _userAction?: string): string {
		const errorId = this.generateErrorId();
		const category = this.categorizeError(error, context);
		const severity = this.assessSeverity(error, context);

		const enhancedError: ErrorTracking = {
			errorType: this.mapCategoryToType(category),
			errorMessage: error.message,
			stackTrace: error.stack || '',
			userAgent: context.userAgent || navigator.userAgent,
			url: context.url || window.location.href,
			timestamp: context.timestamp || new Date(),
			sessionId: context.sessionId || this.getCurrentSessionId(),
			performanceImpact: this.calculatePerformanceImpact(error, context),
			recoveryTime: 0,
			userImpact: this.assessUserImpact(error, context)
		};

		// Add to error history
		this.errorHistory.push(enhancedError);
		this.trimErrorHistory();

		// Add breadcrumb
		this.addBreadcrumb(`Error: ${error.message} in ${context.component || 'unknown'}`);

		// Detect patterns
		this.detectErrorPattern(error, category);

		// Track metrics
		this.trackErrorMetrics(error, category, severity);

		// Attempt recovery
		this.attemptRecovery(errorId, enhancedError, context);

		// Generate alerts if necessary
		this.checkForAlerts(category, severity);

		// Send to performance monitor
		trackError(error, {
			...context,
			errorId,
			category,
			severity,
			breadcrumbs: this.breadcrumbs.slice(-10)
		});

		return errorId;
	}

	/**
	 * Track recovery attempt
	 */
	trackRecovery(
		errorId: string,
		method: string,
		successful: boolean,
		duration: number,
		userActionRequired = false
	): void {
		const recovery: ErrorRecovery = {
			errorId,
			recoveryAttempted: true,
			recoverySuccessful: successful,
			recoveryTime: duration,
			recoveryMethod: method,
			userActionRequired
		};

		this.recoveryHistory.push(recovery);

		// Track recovery metrics
		trackCustomMetric('error_recovery_attempted', 1, {
			method,
			successful: successful.toString(),
			errorId
		});

		trackCustomMetric('error_recovery_time', duration, {
			method,
			successful: successful.toString()
		});

		if (successful) {
			this.addBreadcrumb(`Recovery successful: ${method}`);
		} else {
			this.addBreadcrumb(`Recovery failed: ${method}`);
		}
	}

	/**
	 * Add breadcrumb for debugging context
	 */
	addBreadcrumb(message: string, data?: Record<string, any>): void {
		const timestamp = new Date().toISOString();
		const breadcrumb = data
			? `[${timestamp}] ${message} - ${JSON.stringify(data)}`
			: `[${timestamp}] ${message}`;

		this.breadcrumbs.push(breadcrumb);

		if (this.breadcrumbs.length > this.maxBreadcrumbs) {
			this.breadcrumbs.shift();
		}
	}

	/**
	 * Track user action that might lead to errors
	 */
	trackUserAction(action: string, component: string, data?: Record<string, any>): void {
		this.addBreadcrumb(`User action: ${action} in ${component}`, data);
	}

	/**
	 * Get error statistics
	 */
	getErrorStatistics(): {
		totalErrors: number;
		errorsByCategory: Record<ErrorCategory, number>;
		errorsByseverity: Record<ErrorSeverity, number>;
		recoveryRate: number;
		averageRecoveryTime: number;
		topErrorPatterns: ErrorPattern[];
	} {
		const errorsByCategory = this.errorHistory.reduce(
			(acc, error) => {
				const category = this.getCategoryFromType(error.errorType);
				acc[category] = (acc[category] || 0) + 1;
				return acc;
			},
			{} as Record<ErrorCategory, number>
		);

		const errorsByseverity = this.errorHistory.reduce(
			(acc, error) => {
				const severity = this.getSeverityFromError(error);
				acc[severity] = (acc[severity] || 0) + 1;
				return acc;
			},
			{} as Record<ErrorSeverity, number>
		);

		const recoveredErrors = this.recoveryHistory.filter((r) => r.recoverySuccessful).length;
		const totalRecoveryAttempts = this.recoveryHistory.length;
		const recoveryRate =
			totalRecoveryAttempts > 0 ? (recoveredErrors / totalRecoveryAttempts) * 100 : 0;

		const averageRecoveryTime =
			this.recoveryHistory.length > 0
				? this.recoveryHistory.reduce((sum, r) => sum + r.recoveryTime, 0) /
					this.recoveryHistory.length
				: 0;

		const topErrorPatterns = Array.from(this.errorPatterns.values())
			.sort((a, b) => b.occurrences - a.occurrences)
			.slice(0, 10);

		return {
			totalErrors: this.errorHistory.length,
			errorsByCategory,
			errorsByseverity,
			recoveryRate,
			averageRecoveryTime,
			topErrorPatterns
		};
	}

	/**
	 * Get recent errors
	 */
	getRecentErrors(limit = 10): ErrorTracking[] {
		return this.errorHistory
			.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
			.slice(0, limit);
	}

	/**
	 * Get breadcrumbs for debugging
	 */
	getBreadcrumbs(): string[] {
		return [...this.breadcrumbs];
	}

	/**
	 * Clear error history (for privacy compliance)
	 */
	clearErrorHistory(): void {
		this.errorHistory = [];
		this.recoveryHistory = [];
		this.breadcrumbs = [];
		this.errorPatterns.clear();
	}

	/**
	 * Export error data for analysis
	 */
	exportErrorData(): {
		errors: ErrorTracking[];
		recoveries: ErrorRecovery[];
		patterns: ErrorPattern[];
		breadcrumbs: string[];
		statistics: ReturnType<ErrorTracker['getErrorStatistics']>;
	} {
		return {
			errors: this.errorHistory,
			recoveries: this.recoveryHistory,
			patterns: Array.from(this.errorPatterns.values()),
			breadcrumbs: this.breadcrumbs,
			statistics: this.getErrorStatistics()
		};
	}

	// Private methods

	private initializeRecoveryStrategies(): void {
		// WASM Module Loading Recovery
		this.recoveryStrategies.push({
			name: 'wasm-module-reload',
			description: 'Reload WASM module after failure',
			canRecover: (error) => error.errorType === 'wasm' && error.errorMessage.includes('module'),
			recover: async (_error, _context) => {
				try {
					// Attempt to reload the WASM module
					this.addBreadcrumb('Attempting WASM module reload');

					// Clear any cached module references
					if ('vectorize-wasm' in window) {
						delete (window as any)['vectorize-wasm'];
					}

					// Force reload (implementation would depend on actual WASM loader)
					await this.reloadWASMModule();

					return true;
				} catch (recoveryError) {
					this.addBreadcrumb(`WASM reload failed: ${recoveryError}`);
					return false;
				}
			},
			preventionTips: [
				'Ensure stable network connection',
				'Check browser WASM support',
				'Verify CORS headers for WASM files'
			]
		});

		// Threading Recovery
		this.recoveryStrategies.push({
			name: 'thread-fallback',
			description: 'Fall back to single-threaded mode',
			canRecover: (error) =>
				error.errorMessage.includes('thread') || error.errorMessage.includes('SharedArrayBuffer'),
			recover: async (_error, _context) => {
				try {
					this.addBreadcrumb('Falling back to single-threaded mode');

					// Disable threading and retry
					await this.fallbackToSingleThread();

					return true;
				} catch (recoveryError) {
					this.addBreadcrumb(`Thread fallback failed: ${recoveryError}`);
					return false;
				}
			},
			preventionTips: [
				'Check browser threading support',
				'Verify COEP/COOP headers',
				'Test with threading disabled'
			]
		});

		// Memory Recovery
		this.recoveryStrategies.push({
			name: 'memory-cleanup',
			description: 'Clean up memory and retry',
			canRecover: (error) =>
				error.errorMessage.includes('memory') || error.errorMessage.includes('allocation'),
			recover: async (_error, _context) => {
				try {
					this.addBreadcrumb('Attempting memory cleanup');

					// Force garbage collection if available
					if ('gc' in window) {
						(window as any).gc();
					}

					// Clear any large data structures
					await this.clearMemoryCache();

					return true;
				} catch (recoveryError) {
					this.addBreadcrumb(`Memory cleanup failed: ${recoveryError}`);
					return false;
				}
			},
			preventionTips: [
				'Reduce image sizes before processing',
				'Process images sequentially',
				'Clear previous results before new processing'
			]
		});

		// File Handling Recovery
		this.recoveryStrategies.push({
			name: 'file-retry',
			description: 'Retry file operation',
			canRecover: (error) =>
				error.errorType === 'processing' && error.errorMessage.includes('file'),
			recover: async (error, context) => {
				try {
					this.addBreadcrumb('Retrying file operation');

					// Retry the file operation with exponential backoff
					await this.retryFileOperation(context);

					return true;
				} catch (recoveryError) {
					this.addBreadcrumb(`File retry failed: ${recoveryError}`);
					return false;
				}
			},
			preventionTips: [
				'Check file format compatibility',
				'Verify file size limits',
				'Ensure stable file access'
			]
		});
	}

	private setupGlobalErrorHandlers(): void {
		// JavaScript errors
		window.addEventListener('error', (event: ErrorEvent) => {
			this.trackError(event.error, {
				component: 'global',
				action: 'script-error',
				url: event.filename,
				userState: { line: event.lineno, column: event.colno }
			});
		});

		// Promise rejections
		window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
			const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
			this.trackError(error, {
				component: 'global',
				action: 'promise-rejection'
			});
		});

		// Resource loading errors
		window.addEventListener(
			'error',
			(event) => {
				if (event.target && event.target !== window) {
					const target = event.target as unknown as HTMLElement;
					this.trackError(new Error(`Resource loading failed: ${target.tagName}`), {
						component: 'resource-loader',
						action: 'resource-error',
						userState: { src: (target as any).src || (target as any).href }
					});
				}
			},
			true
		);
	}

	private generateErrorId(): string {
		return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	private categorizeError(error: Error, context: EnhancedErrorContext): ErrorCategory {
		const message = error.message.toLowerCase();
		const stack = error.stack?.toLowerCase() || '';
		const component = context.component?.toLowerCase() || '';

		if (message.includes('wasm') && (message.includes('load') || message.includes('fetch'))) {
			return 'wasm-loading';
		}
		if (message.includes('wasm') || stack.includes('wasm')) {
			return 'wasm-runtime';
		}
		if (message.includes('thread') || message.includes('sharedarraybuffer')) {
			return 'threading';
		}
		if (message.includes('memory') || message.includes('allocation')) {
			return 'memory';
		}
		if (message.includes('process') || component.includes('process')) {
			return 'processing';
		}
		if (component.includes('component') || message.includes('component')) {
			return 'ui-component';
		}
		if (message.includes('file') || message.includes('upload')) {
			return 'file-handling';
		}
		if (message.includes('network') || message.includes('fetch') || message.includes('http')) {
			return 'network';
		}
		if (message.includes('validation') || message.includes('invalid')) {
			return 'validation';
		}

		return 'unknown';
	}

	private assessSeverity(error: Error, context: EnhancedErrorContext): ErrorSeverity {
		const category = this.categorizeError(error, context);

		switch (category) {
			case 'wasm-loading':
			case 'wasm-runtime':
				return 'critical';
			case 'threading':
			case 'memory':
				return 'high';
			case 'processing':
			case 'file-handling':
				return 'medium';
			case 'ui-component':
			case 'validation':
				return 'low';
			default:
				return 'medium';
		}
	}

	private mapCategoryToType(category: ErrorCategory): ErrorTracking['errorType'] {
		switch (category) {
			case 'wasm-loading':
			case 'wasm-runtime':
			case 'threading':
			case 'memory':
				return 'wasm';
			case 'processing':
				return 'processing';
			case 'file-handling':
			case 'network':
				return 'network';
			case 'ui-component':
			case 'validation':
				return 'ui';
			default:
				return 'unknown';
		}
	}

	private getCategoryFromType(type: ErrorTracking['errorType']): ErrorCategory {
		switch (type) {
			case 'wasm':
				return 'wasm-runtime';
			case 'processing':
				return 'processing';
			case 'network':
				return 'network';
			case 'ui':
				return 'ui-component';
			default:
				return 'unknown';
		}
	}

	private getSeverityFromError(error: ErrorTracking): ErrorSeverity {
		if (error.userImpact === 'critical') return 'critical';
		if (error.userImpact === 'major') return 'high';
		if (error.userImpact === 'minor') return 'medium';
		return 'low';
	}

	private calculatePerformanceImpact(error: Error, context: EnhancedErrorContext): number {
		const category = this.categorizeError(error, context);
		const severity = this.assessSeverity(error, context);

		let impact = 0;

		// Base impact by category
		switch (category) {
			case 'wasm-loading':
			case 'wasm-runtime':
				impact = 90;
				break;
			case 'threading':
				impact = 75;
				break;
			case 'memory':
				impact = 60;
				break;
			case 'processing':
				impact = 50;
				break;
			case 'file-handling':
				impact = 40;
				break;
			case 'network':
				impact = 30;
				break;
			case 'ui-component':
				impact = 20;
				break;
			case 'validation':
				impact = 10;
				break;
			default:
				impact = 25;
		}

		// Adjust by severity
		switch (severity) {
			case 'critical':
				impact *= 1.2;
				break;
			case 'high':
				impact *= 1.1;
				break;
			case 'low':
				impact *= 0.8;
				break;
		}

		return Math.min(100, Math.max(0, impact));
	}

	private assessUserImpact(
		error: Error,
		context: EnhancedErrorContext
	): ErrorTracking['userImpact'] {
		const category = this.categorizeError(error, context);

		switch (category) {
			case 'wasm-loading':
			case 'wasm-runtime':
				return 'critical';
			case 'threading':
			case 'processing':
				return 'major';
			case 'memory':
			case 'file-handling':
				return 'minor';
			case 'ui-component':
			case 'validation':
			case 'network':
				return 'minor';
			default:
				return 'none';
		}
	}

	private detectErrorPattern(error: Error, category: ErrorCategory): void {
		const pattern = `${category}:${error.name}:${error.message.substring(0, 50)}`;

		if (this.errorPatterns.has(pattern)) {
			const existing = this.errorPatterns.get(pattern)!;
			existing.occurrences++;
			existing.lastSeen = new Date();
			existing.isRecurring = existing.occurrences > 3;
		} else {
			this.errorPatterns.set(pattern, {
				pattern,
				occurrences: 1,
				firstSeen: new Date(),
				lastSeen: new Date(),
				affectedUsers: new Set([this.getCurrentSessionId()]),
				severity: this.assessSeverity(error, {}),
				isRecurring: false
			});
		}
	}

	private trackErrorMetrics(error: Error, category: ErrorCategory, severity: ErrorSeverity): void {
		trackCustomMetric('error_count', 1, {
			category,
			severity,
			errorName: error.name
		});

		trackCustomMetric('error_by_category', 1, { category });
		trackCustomMetric('error_by_severity', 1, { severity });
	}

	private async attemptRecovery(
		errorId: string,
		error: ErrorTracking,
		context: EnhancedErrorContext
	): Promise<void> {
		const startTime = performance.now();

		for (const strategy of this.recoveryStrategies) {
			if (strategy.canRecover(error)) {
				this.addBreadcrumb(`Attempting recovery with strategy: ${strategy.name}`);

				try {
					const success = await strategy.recover(error, context);
					const duration = performance.now() - startTime;

					this.trackRecovery(errorId, strategy.name, success, duration);

					if (success) {
						break; // Stop after first successful recovery
					}
				} catch (recoveryError) {
					this.addBreadcrumb(`Recovery strategy ${strategy.name} threw error: ${recoveryError}`);
				}
			}
		}
	}

	private checkForAlerts(category: ErrorCategory, severity: ErrorSeverity): void {
		const recentErrors = this.errorHistory.filter(
			(error) => Date.now() - error.timestamp.getTime() < 60000 // Last minute
		);

		// Check for error spike
		if (recentErrors.length > 5) {
			// Would generate alert through performance monitor
			this.addBreadcrumb(`Error spike detected: ${recentErrors.length} errors in last minute`);
		}

		// Check for critical errors
		if (severity === 'critical') {
			this.addBreadcrumb(`Critical error detected: ${category}`);
		}
	}

	private trimErrorHistory(): void {
		if (this.errorHistory.length > this.maxErrorHistory) {
			this.errorHistory = this.errorHistory.slice(-this.maxErrorHistory);
		}
	}

	private getCurrentSessionId(): string {
		return performanceMonitor.getCurrentSession().sessionId;
	}

	// Recovery method implementations (would be implemented based on actual system)
	private async reloadWASMModule(): Promise<void> {
		// Implementation would reload the WASM module
		throw new Error('WASM reload not implemented');
	}

	private async fallbackToSingleThread(): Promise<void> {
		// Implementation would disable threading
		throw new Error('Thread fallback not implemented');
	}

	private async clearMemoryCache(): Promise<void> {
		// Implementation would clear memory caches
		throw new Error('Memory cleanup not implemented');
	}

	private async retryFileOperation(_context: EnhancedErrorContext): Promise<void> {
		// Implementation would retry file operations
		throw new Error('File retry not implemented');
	}
}

// Create singleton instance
export const errorTracker = new ErrorTracker();

// Export helper functions
export function trackApplicationError(
	error: Error,
	context?: EnhancedErrorContext,
	userAction?: string
): string {
	return errorTracker.trackError(error, context, userAction);
}

export function trackRecovery(
	errorId: string,
	method: string,
	successful: boolean,
	duration: number,
	userActionRequired = false
): void {
	errorTracker.trackRecovery(errorId, method, successful, duration, userActionRequired);
}

export function addErrorBreadcrumb(message: string, data?: Record<string, any>): void {
	errorTracker.addBreadcrumb(message, data);
}

export function trackUserAction(
	action: string,
	component: string,
	data?: Record<string, any>
): void {
	errorTracker.trackUserAction(action, component, data);
}

export function getErrorStatistics() {
	return errorTracker.getErrorStatistics();
}

export function getRecentErrors(limit?: number) {
	return errorTracker.getRecentErrors(limit);
}

export function getBreadcrumbs() {
	return errorTracker.getBreadcrumbs();
}

export function exportErrorData() {
	return errorTracker.exportErrorData();
}

export function clearErrorHistory() {
	errorTracker.clearErrorHistory();
}
