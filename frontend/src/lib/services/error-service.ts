/**
 * ErrorService - Centralized error handling and reporting
 *
 * Provides comprehensive error tracking, categorization, and recovery
 * suggestions with detailed context for debugging and monitoring.
 */

import type { ValidationError } from './validation-service';
import type { WorkerError } from '../types/worker-protocol';

/**
 * Error categories for better organization
 */
export enum ErrorCategory {
	VALIDATION = 'validation',
	WORKER = 'worker',
	NETWORK = 'network',
	STORAGE = 'storage',
	RENDER = 'render',
	SECURITY = 'security',
	PERFORMANCE = 'performance',
	USER_INPUT = 'user_input',
	SYSTEM = 'system'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
	LOW = 'low',
	MEDIUM = 'medium',
	HIGH = 'high',
	CRITICAL = 'critical'
}

/**
 * Enhanced error entry
 */
export interface ErrorEntry {
	id: string;
	timestamp: number;
	category: ErrorCategory;
	severity: ErrorSeverity;
	message: string;
	code?: string;
	context?: string;
	stack?: string;
	userAgent?: string;
	url?: string;
	userId?: string;
	sessionId?: string;
	metadata?: Record<string, unknown>;
	resolved?: boolean;
	retryCount?: number;
	recoveryAction?: string;
}

/**
 * Error pattern for detection
 */
interface ErrorPattern {
	pattern: RegExp | string;
	category: ErrorCategory;
	severity: ErrorSeverity;
	recoveryAction?: string;
	preventable?: boolean;
}

/**
 * Error recovery strategy
 */
export interface RecoveryStrategy {
	action: 'retry' | 'fallback' | 'reload' | 'reset' | 'ignore';
	delay?: number;
	maxAttempts?: number;
	fallbackValue?: unknown;
	userMessage?: string;
	reportToUser?: boolean;
}

/**
 * Error service configuration
 */
export interface ErrorServiceConfig {
	maxHistorySize: number;
	enableAutoRecovery: boolean;
	enableUserReporting: boolean;
	enableAnalytics: boolean;
	reportCriticalErrors: boolean;
	consoleLogLevel: ErrorSeverity;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: ErrorServiceConfig = {
	maxHistorySize: 1000,
	enableAutoRecovery: true,
	enableUserReporting: false,
	enableAnalytics: false,
	reportCriticalErrors: true,
	consoleLogLevel: ErrorSeverity.MEDIUM
};

/**
 * Error patterns for automatic categorization
 */
const ERROR_PATTERNS: ErrorPattern[] = [
	{
		pattern: /network|fetch|request|connection|timeout/i,
		category: ErrorCategory.NETWORK,
		severity: ErrorSeverity.MEDIUM,
		recoveryAction: 'retry with exponential backoff'
	},
	{
		pattern: /worker|wasm|module/i,
		category: ErrorCategory.WORKER,
		severity: ErrorSeverity.HIGH,
		recoveryAction: 'restart worker'
	},
	{
		pattern: /validation|invalid|type|schema/i,
		category: ErrorCategory.VALIDATION,
		severity: ErrorSeverity.MEDIUM,
		recoveryAction: 'sanitize and retry'
	},
	{
		pattern: /security|xss|script|malicious/i,
		category: ErrorCategory.SECURITY,
		severity: ErrorSeverity.CRITICAL,
		recoveryAction: 'reject and report'
	},
	{
		pattern: /memory|performance|slow|timeout/i,
		category: ErrorCategory.PERFORMANCE,
		severity: ErrorSeverity.HIGH,
		recoveryAction: 'optimize or reduce load'
	},
	{
		pattern: /storage|quota|indexeddb|localstorage/i,
		category: ErrorCategory.STORAGE,
		severity: ErrorSeverity.MEDIUM,
		recoveryAction: 'clear cache and retry'
	},
	{
		pattern: /render|display|canvas|svg/i,
		category: ErrorCategory.RENDER,
		severity: ErrorSeverity.MEDIUM,
		recoveryAction: 'fallback rendering'
	},
	{
		pattern: /user|input|file|upload/i,
		category: ErrorCategory.USER_INPUT,
		severity: ErrorSeverity.LOW,
		recoveryAction: 'provide user guidance'
	}
];

/**
 * ErrorService class
 */
export class ErrorService {
	private config: ErrorServiceConfig;
	private errorHistory: ErrorEntry[] = [];
	private errorCounts: Record<string, number> = {};
	private sessionId: string;
	private listeners: Map<string, (error: ErrorEntry) => void> = new Map();
	private recoveryStrategies: Map<string, RecoveryStrategy> = new Map();

	constructor(config: Partial<ErrorServiceConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
		this.sessionId = this.generateSessionId();
		this.setupGlobalErrorHandling();
		this.setupRecoveryStrategies();
	}

	/**
	 * Report an error
	 */
	reportError(
		error: Error | string | ValidationError | WorkerError,
		context?: string,
		metadata?: Record<string, unknown>
	): string {
		const errorId = this.generateErrorId();
		let entry: ErrorEntry;

		if (error instanceof Error) {
			entry = this.createErrorEntry(errorId, error.message, context, {
				stack: error.stack,
				name: error.name,
				...metadata
			});
		} else if (typeof error === 'string') {
			entry = this.createErrorEntry(errorId, error, context, metadata);
		} else if ('code' in error && 'message' in error) {
			// Worker error or validation error
			entry = this.createErrorEntry(errorId, error.message, context, {
				code: error.code,
				...metadata
			});
		} else {
			entry = this.createErrorEntry(errorId, 'Unknown error occurred', context, {
				originalError: error,
				...metadata
			});
		}

		// Add to history
		this.addToHistory(entry);

		// Update counts
		const key = `${entry.category}:${entry.code || 'unknown'}`;
		this.errorCounts[key] = (this.errorCounts[key] || 0) + 1;

		// Log to console if appropriate
		if (this.shouldLogToConsole(entry.severity)) {
			this.logToConsole(entry);
		}

		// Notify listeners
		this.notifyListeners(entry);

		// Attempt auto-recovery if enabled
		if (this.config.enableAutoRecovery) {
			this.attemptAutoRecovery(entry);
		}

		// Report critical errors
		if (entry.severity === ErrorSeverity.CRITICAL && this.config.reportCriticalErrors) {
			this.reportCriticalError(entry);
		}

		return errorId;
	}

	/**
	 * Get error by ID
	 */
	getError(id: string): ErrorEntry | null {
		return this.errorHistory.find((error) => error.id === id) || null;
	}

	/**
	 * Get errors by category
	 */
	getErrorsByCategory(category: ErrorCategory): ErrorEntry[] {
		return this.errorHistory.filter((error) => error.category === category);
	}

	/**
	 * Get errors by severity
	 */
	getErrorsBySeverity(severity: ErrorSeverity): ErrorEntry[] {
		return this.errorHistory.filter((error) => error.severity === severity);
	}

	/**
	 * Get recent errors
	 */
	getRecentErrors(minutes = 60): ErrorEntry[] {
		const cutoff = Date.now() - minutes * 60 * 1000;
		return this.errorHistory.filter((error) => error.timestamp >= cutoff);
	}

	/**
	 * Get error statistics
	 */
	getStats(): {
		total: number;
		bySeverity: Record<ErrorSeverity, number>;
		byCategory: Record<ErrorCategory, number>;
		recentCount: number;
		topErrors: Array<{ key: string; count: number }>;
		recoverySuccessRate: number;
	} {
		const bySeverity = {
			[ErrorSeverity.LOW]: 0,
			[ErrorSeverity.MEDIUM]: 0,
			[ErrorSeverity.HIGH]: 0,
			[ErrorSeverity.CRITICAL]: 0
		};

		const byCategory = {
			[ErrorCategory.VALIDATION]: 0,
			[ErrorCategory.WORKER]: 0,
			[ErrorCategory.NETWORK]: 0,
			[ErrorCategory.STORAGE]: 0,
			[ErrorCategory.RENDER]: 0,
			[ErrorCategory.SECURITY]: 0,
			[ErrorCategory.PERFORMANCE]: 0,
			[ErrorCategory.USER_INPUT]: 0,
			[ErrorCategory.SYSTEM]: 0
		};

		let resolvedCount = 0;

		for (const error of this.errorHistory) {
			bySeverity[error.severity]++;
			byCategory[error.category]++;
			if (error.resolved) resolvedCount++;
		}

		const recentCount = this.getRecentErrors(60).length;
		const topErrors = Object.entries(this.errorCounts)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 10)
			.map(([key, count]) => ({ key, count }));

		const recoverySuccessRate =
			this.errorHistory.length > 0 ? resolvedCount / this.errorHistory.length : 0;

		return {
			total: this.errorHistory.length,
			bySeverity,
			byCategory,
			recentCount,
			topErrors,
			recoverySuccessRate
		};
	}

	/**
	 * Mark error as resolved
	 */
	markResolved(errorId: string, recoveryAction?: string): boolean {
		const error = this.errorHistory.find((e) => e.id === errorId);
		if (error) {
			error.resolved = true;
			error.recoveryAction = recoveryAction;
			return true;
		}
		return false;
	}

	/**
	 * Clear error history
	 */
	clearHistory(): void {
		this.errorHistory = [];
		this.errorCounts = {};
	}

	/**
	 * Add error listener
	 */
	addListener(id: string, callback: (error: ErrorEntry) => void): void {
		this.listeners.set(id, callback);
	}

	/**
	 * Remove error listener
	 */
	removeListener(id: string): void {
		this.listeners.delete(id);
	}

	/**
	 * Export errors for analysis
	 */
	exportErrors(format: 'json' | 'csv' = 'json'): string {
		if (format === 'csv') {
			const headers = [
				'id',
				'timestamp',
				'category',
				'severity',
				'message',
				'code',
				'context',
				'resolved',
				'retryCount'
			];

			const rows = this.errorHistory.map((error) => [
				error.id,
				new Date(error.timestamp).toISOString(),
				error.category,
				error.severity,
				error.message.replace(/"/g, '""'), // Escape quotes
				error.code || '',
				error.context || '',
				error.resolved ? 'true' : 'false',
				error.retryCount || '0'
			]);

			return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
		}

		return JSON.stringify(this.errorHistory, null, 2);
	}

	/**
	 * Log an error (alias for reportError for backwards compatibility)
	 */
	logError(context: string, error: Error, metadata?: Record<string, unknown>): string {
		return this.reportError(error, context, metadata);
	}

	/**
	 * Get error statistics
	 */
	getErrorStats() {
		return {
			totalErrors: this.errorHistory.length,
			recentErrors: this.getRecentErrors(5), // Last 5 minutes
			errorsByCategory: this.getErrorsByCategoryCount(),
			errorsBySeverity: this.getErrorsBySeverityCount(),
			resolvedCount: this.errorHistory.filter((e) => e.resolved).length,
			unresolvedCount: this.errorHistory.filter((e) => !e.resolved).length
		};
	}

	private getErrorsByCategoryCount() {
		const categoryCount: Record<string, number> = {};
		for (const error of this.errorHistory) {
			categoryCount[error.category] = (categoryCount[error.category] || 0) + 1;
		}
		return categoryCount;
	}

	private getErrorsBySeverityCount() {
		const severityCount: Record<string, number> = {};
		for (const error of this.errorHistory) {
			severityCount[error.severity] = (severityCount[error.severity] || 0) + 1;
		}
		return severityCount;
	}

	// Private helper methods

	private createErrorEntry(
		id: string,
		message: string,
		context?: string,
		metadata?: Record<string, unknown>
	): ErrorEntry {
		const { category, severity } = this.categorizeError(message);

		return {
			id,
			timestamp: Date.now(),
			category,
			severity,
			message,
			code: metadata?.code as string,
			context,
			stack: metadata?.stack as string,
			userAgent: navigator.userAgent,
			url: window.location.href,
			sessionId: this.sessionId,
			metadata,
			resolved: false,
			retryCount: 0
		};
	}

	private categorizeError(message: string): { category: ErrorCategory; severity: ErrorSeverity } {
		for (const pattern of ERROR_PATTERNS) {
			const regex =
				typeof pattern.pattern === 'string' ? new RegExp(pattern.pattern, 'i') : pattern.pattern;

			if (regex.test(message)) {
				return {
					category: pattern.category,
					severity: pattern.severity
				};
			}
		}

		// Default categorization
		return {
			category: ErrorCategory.SYSTEM,
			severity: ErrorSeverity.MEDIUM
		};
	}

	private addToHistory(entry: ErrorEntry): void {
		this.errorHistory.unshift(entry);

		// Maintain history size limit
		if (this.errorHistory.length > this.config.maxHistorySize) {
			this.errorHistory = this.errorHistory.slice(0, this.config.maxHistorySize);
		}
	}

	private shouldLogToConsole(severity: ErrorSeverity): boolean {
		const levels = {
			[ErrorSeverity.LOW]: 1,
			[ErrorSeverity.MEDIUM]: 2,
			[ErrorSeverity.HIGH]: 3,
			[ErrorSeverity.CRITICAL]: 4
		};

		return levels[severity] >= levels[this.config.consoleLogLevel];
	}

	private logToConsole(entry: ErrorEntry): void {
		const prefix = `[ErrorService][${entry.category}][${entry.severity}]`;

		switch (entry.severity) {
			case ErrorSeverity.CRITICAL:
				console.error(`${prefix} ${entry.message}`, entry);
				break;
			case ErrorSeverity.HIGH:
				console.error(`${prefix} ${entry.message}`, entry);
				break;
			case ErrorSeverity.MEDIUM:
				console.warn(`${prefix} ${entry.message}`, entry);
				break;
			case ErrorSeverity.LOW:
				console.info(`${prefix} ${entry.message}`, entry);
				break;
		}
	}

	private notifyListeners(entry: ErrorEntry): void {
		for (const callback of this.listeners.values()) {
			try {
				callback(entry);
			} catch (error) {
				console.error('[ErrorService] Listener error:', error);
			}
		}
	}

	private attemptAutoRecovery(entry: ErrorEntry): void {
		const strategy = this.getRecoveryStrategy(entry);
		if (!strategy) return;

		console.log(`[ErrorService] Attempting auto-recovery for ${entry.id}: ${strategy.action}`);

		switch (strategy.action) {
			case 'retry':
				if ((entry.retryCount || 0) < (strategy.maxAttempts || 3)) {
					entry.retryCount = (entry.retryCount || 0) + 1;
					// Implementation would trigger retry logic
				}
				break;

			case 'fallback':
				// Use fallback value or method
				break;

			case 'reset':
				// Reset component or service state
				break;

			case 'reload':
				if (strategy.reportToUser) {
					// Show user message before reload
				}
				// window.location.reload();
				break;
		}
	}

	private getRecoveryStrategy(entry: ErrorEntry): RecoveryStrategy | null {
		// Look for specific strategies first
		if (entry.code) {
			const strategy = this.recoveryStrategies.get(entry.code);
			if (strategy) return strategy;
		}

		// Use pattern-based strategies
		for (const pattern of ERROR_PATTERNS) {
			const regex =
				typeof pattern.pattern === 'string' ? new RegExp(pattern.pattern, 'i') : pattern.pattern;

			if (regex.test(entry.message) && pattern.recoveryAction) {
				return this.parseRecoveryAction(pattern.recoveryAction);
			}
		}

		return null;
	}

	private parseRecoveryAction(action: string): RecoveryStrategy {
		// Parse recovery action string into strategy object
		if (action.includes('retry')) {
			return { action: 'retry', maxAttempts: 3, delay: 1000 };
		}
		if (action.includes('fallback')) {
			return { action: 'fallback' };
		}
		if (action.includes('reset')) {
			return { action: 'reset' };
		}
		if (action.includes('reload')) {
			return { action: 'reload', reportToUser: true };
		}

		return { action: 'ignore' };
	}

	private setupGlobalErrorHandling(): void {
		// Handle unhandled promise rejections
		window.addEventListener('unhandledrejection', (event) => {
			this.reportError(event.reason || 'Unhandled promise rejection', 'global:unhandledrejection', {
				promise: event.promise
			});
		});

		// Handle global errors
		window.addEventListener('error', (event) => {
			this.reportError(event.error || event.message || 'Global error', 'global:error', {
				filename: event.filename,
				lineno: event.lineno,
				colno: event.colno
			});
		});
	}

	private setupRecoveryStrategies(): void {
		// Define specific recovery strategies for known error codes
		this.recoveryStrategies.set('WORKER_CRASHED', {
			action: 'retry',
			maxAttempts: 2,
			delay: 2000,
			userMessage: 'Processing failed. Retrying...'
		});

		this.recoveryStrategies.set('OUT_OF_MEMORY', {
			action: 'fallback',
			userMessage: 'Image too large. Try reducing the size.'
		});

		this.recoveryStrategies.set('PROCESSING_TIMEOUT', {
			action: 'retry',
			maxAttempts: 1,
			delay: 5000,
			userMessage: 'Processing is taking longer than expected. Retrying...'
		});
	}

	private reportCriticalError(entry: ErrorEntry): void {
		// In production, this would send to monitoring service
		console.error('[ErrorService] Critical error reported:', entry);

		// Could integrate with services like Sentry, LogRocket, etc.
		if (typeof window !== 'undefined' && (window as any).gtag) {
			(window as any).gtag('event', 'exception', {
				description: entry.message,
				fatal: true,
				custom_map: {
					error_id: entry.id,
					category: entry.category,
					context: entry.context
				}
			});
		}
	}

	private generateErrorId(): string {
		return `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	private generateSessionId(): string {
		return `sess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}
}

// Export singleton instance
export const errorService = new ErrorService();
