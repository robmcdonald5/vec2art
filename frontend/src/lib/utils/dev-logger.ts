/**
 * Development logging utility for vec2art frontend
 * Provides conditional logging that can be disabled in production builds
 */

// Environment check for development mode
const isDevelopment =
	typeof window !== 'undefined'
		? window.location.hostname === 'localhost' || window.location.hostname.includes('dev')
		: import.meta.env?.DEV === true;

// Feature flags for different types of logging
const LOG_FEATURES = {
	file_operations: isDevelopment && true, // File upload/processing
	wasm_operations: isDevelopment && true, // WASM worker operations
	state_management: isDevelopment && false, // State recovery/persistence (too verbose)
	performance: isDevelopment && true, // Performance monitoring
	user_interactions: isDevelopment && false, // UI interactions (too verbose)
	debugging: isDevelopment && true // General debugging
} as const;

export type LogCategory = keyof typeof LOG_FEATURES;

/**
 * Conditional console.log wrapper
 * Only logs in development mode and if the category is enabled
 */
export function devLog(category: LogCategory, message: string, ...args: any[]): void {
	if (LOG_FEATURES[category]) {
		console.log(`[${category.toUpperCase()}] ${message}`, ...args);
	}
}

/**
 * Conditional console.warn wrapper
 * Always logs warnings but formats them consistently
 */
export function devWarn(category: LogCategory, message: string, ...args: any[]): void {
	if (LOG_FEATURES[category]) {
		console.warn(`[${category.toUpperCase()}] ⚠️ ${message}`, ...args);
	}
}

/**
 * Conditional console.error wrapper
 * Always logs errors but formats them consistently
 */
export function devError(category: LogCategory, message: string, ...args: any[]): void {
	// Always log errors even in production, but with cleaner formatting
	console.error(`[${category.toUpperCase()}] ❌ ${message}`, ...args);
}

/**
 * Conditional debug info logging
 * Only in development with debugging enabled
 */
export function devDebug(message: string, data?: any): void {
	if (LOG_FEATURES.debugging) {
		if (data) {
			console.log(`🔍 [DEBUG] ${message}:`, data);
		} else {
			console.log(`🔍 [DEBUG] ${message}`);
		}
	}
}

/**
 * Success/completion logging
 */
export function devSuccess(category: LogCategory, message: string, ...args: any[]): void {
	if (LOG_FEATURES[category]) {
		console.log(`[${category.toUpperCase()}] ✅ ${message}`, ...args);
	}
}

/**
 * Performance timing utility
 */
export function createPerfTimer(label: string): { end: () => void } {
	if (!LOG_FEATURES.performance) {
		return { end: () => {} };
	}

	const start = performance.now();
	return {
		end: () => {
			const duration = performance.now() - start;
			console.log(`⏱️ [PERF] ${label}: ${duration.toFixed(2)}ms`);
		}
	};
}

/**
 * Group logging for related operations
 */
export function createLogGroup(
	category: LogCategory,
	groupName: string
): {
	log: (message: string, ...args: any[]) => void;
	warn: (message: string, ...args: any[]) => void;
	end: () => void;
} {
	if (!LOG_FEATURES[category]) {
		return {
			log: () => {},
			warn: () => {},
			end: () => {}
		};
	}

	console.group(`[${category.toUpperCase()}] ${groupName}`);

	return {
		log: (message: string, ...args: any[]) => console.log(message, ...args),
		warn: (message: string, ...args: any[]) => console.warn(`⚠️ ${message}`, ...args),
		end: () => console.groupEnd()
	};
}

/**
 * Only log in production for critical issues
 */
export function prodLog(message: string, ...args: any[]): void {
	if (!isDevelopment) {
		console.log(`[PROD] ${message}`, ...args);
	}
}
