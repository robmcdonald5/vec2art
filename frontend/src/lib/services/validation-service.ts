/**
 * ValidationService - Centralized validation and sanitization
 *
 * Provides application-wide validation, error reporting, and data sanitization
 * to ensure type safety and data integrity across all boundaries.
 */

import { sanitizeVectorizerConfig } from '../utils/type-guards';

import type {
	SerializedImageData,
	VectorizerConfiguration,
	ProcessingStats
} from '../types/worker-protocol';

import type { ProcessingResult } from '../types/service-types';

/**
 * Validation error types
 */
export interface ValidationError {
	field: string;
	message: string;
	code: ValidationErrorCode;
	severity: 'error' | 'warning' | 'info';
	value?: unknown;
}

export enum ValidationErrorCode {
	INVALID_TYPE = 'INVALID_TYPE',
	OUT_OF_RANGE = 'OUT_OF_RANGE',
	MISSING_REQUIRED = 'MISSING_REQUIRED',
	INVALID_FORMAT = 'INVALID_FORMAT',
	CORRUPTED_DATA = 'CORRUPTED_DATA',
	SECURITY_VIOLATION = 'SECURITY_VIOLATION'
}

/**
 * Validation result
 */
export interface ValidationResult<T = unknown> {
	valid: boolean;
	data?: T;
	errors: ValidationError[];
	warnings: ValidationError[];
	sanitized?: T;
}

/**
 * Validation configuration
 */
export interface ValidationConfig {
	strictMode: boolean;
	sanitizeData: boolean;
	logErrors: boolean;
	maxErrorHistory: number;
	enableSecurityChecks: boolean;
}

/**
 * Default validation configuration
 */
const DEFAULT_CONFIG: ValidationConfig = {
	strictMode: true,
	sanitizeData: true,
	logErrors: true,
	maxErrorHistory: 100,
	enableSecurityChecks: true
};

/**
 * ValidationService class
 */
export class ValidationService {
	private config: ValidationConfig;
	private errorHistory: Array<{ timestamp: number; error: ValidationError; context: string }> = [];
	private validationCount = 0;
	private errorCount = 0;

	constructor(config: Partial<ValidationConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
	}

	/**
	 * Validate image data
	 */
	validateImageData(
		data: unknown,
		_context = 'ImageData'
	): ValidationResult<SerializedImageData | undefined> {
		const errors: ValidationError[] = [];
		const warnings: ValidationError[] = [];

		if (!data || typeof data !== 'object') {
			errors.push({
				field: 'data',
				message: 'Image data must be an object',
				code: ValidationErrorCode.INVALID_TYPE,
				severity: 'error',
				value: data
			});

			return this.createResult(false, undefined, errors, warnings);
		}

		const imageData = data as any;

		// Check required properties
		if (!('data' in imageData)) {
			errors.push({
				field: 'data.data',
				message: 'Missing image data array',
				code: ValidationErrorCode.MISSING_REQUIRED,
				severity: 'error'
			});
		}

		if (!('width' in imageData) || !Number.isInteger(imageData.width) || imageData.width <= 0) {
			errors.push({
				field: 'data.width',
				message: 'Width must be a positive integer',
				code: ValidationErrorCode.INVALID_TYPE,
				severity: 'error',
				value: imageData.width
			});
		}

		if (!('height' in imageData) || !Number.isInteger(imageData.height) || imageData.height <= 0) {
			errors.push({
				field: 'data.height',
				message: 'Height must be a positive integer',
				code: ValidationErrorCode.INVALID_TYPE,
				severity: 'error',
				value: imageData.height
			});
		}

		if (errors.length > 0) {
			return this.createResult(false, undefined, errors, warnings);
		}

		// Validate data array
		const expectedLength = imageData.width * imageData.height * 4;
		if (!imageData.data || imageData.data.length !== expectedLength) {
			errors.push({
				field: 'data.data',
				message: `Image data array length mismatch. Expected ${expectedLength}, got ${imageData.data?.length || 0}`,
				code: ValidationErrorCode.CORRUPTED_DATA,
				severity: 'error'
			});
		}

		// Security checks
		if (this.config.enableSecurityChecks) {
			// Check for reasonable image dimensions
			const maxDimension = 8192; // 8K max
			if (imageData.width > maxDimension || imageData.height > maxDimension) {
				errors.push({
					field: 'data.dimensions',
					message: `Image dimensions too large (max ${maxDimension}x${maxDimension})`,
					code: ValidationErrorCode.SECURITY_VIOLATION,
					severity: 'error'
				});
			}

			// Check for suspicious data patterns
			if (this.detectSuspiciousImageData(imageData)) {
				warnings.push({
					field: 'data.content',
					message: 'Suspicious image data detected',
					code: ValidationErrorCode.SECURITY_VIOLATION,
					severity: 'warning'
				});
			}
		}

		if (errors.length > 0) {
			return this.createResult(false, undefined, errors, warnings);
		}

		// Create sanitized version
		let sanitized: SerializedImageData | undefined;
		if (this.config.sanitizeData) {
			sanitized = {
				data: Array.isArray(imageData.data) ? imageData.data : Array.from(imageData.data),
				width: Math.floor(Math.abs(imageData.width)),
				height: Math.floor(Math.abs(imageData.height)),
				colorSpace: imageData.colorSpace === 'display-p3' ? 'display-p3' : 'srgb'
			};
		}

		return this.createResult(true, imageData as SerializedImageData, errors, warnings, sanitized);
	}

	/**
	 * Validate vectorizer configuration
	 */
	validateConfiguration(
		config: unknown,
		_context = 'VectorizerConfiguration'
	): ValidationResult<VectorizerConfiguration | undefined> {
		const errors: ValidationError[] = [];
		const warnings: ValidationError[] = [];

		if (!config || typeof config !== 'object') {
			errors.push({
				field: 'config',
				message: 'Configuration must be an object',
				code: ValidationErrorCode.INVALID_TYPE,
				severity: 'error',
				value: config
			});

			return this.createResult(false, undefined, errors, warnings);
		}

		const cfg = config as any;

		// Validate required fields
		if (!cfg.backend || !['edge', 'centerline', 'superpixel', 'dots'].includes(cfg.backend)) {
			errors.push({
				field: 'config.backend',
				message: 'Invalid or missing backend',
				code: ValidationErrorCode.INVALID_TYPE,
				severity: 'error',
				value: cfg.backend
			});
		}

		if (typeof cfg.detail !== 'number' || cfg.detail < 0 || cfg.detail > 1) {
			errors.push({
				field: 'config.detail',
				message: 'Detail must be a number between 0 and 1',
				code: ValidationErrorCode.OUT_OF_RANGE,
				severity: 'error',
				value: cfg.detail
			});
		}

		if (typeof cfg.strokeWidth !== 'number' || cfg.strokeWidth <= 0 || cfg.strokeWidth > 50) {
			errors.push({
				field: 'config.strokeWidth',
				message: 'Stroke width must be a positive number ≤ 50',
				code: ValidationErrorCode.OUT_OF_RANGE,
				severity: 'error',
				value: cfg.strokeWidth
			});
		}

		if (typeof cfg.multipass !== 'boolean') {
			errors.push({
				field: 'config.multipass',
				message: 'Multipass must be a boolean',
				code: ValidationErrorCode.INVALID_TYPE,
				severity: 'error',
				value: cfg.multipass
			});
		}

		if (typeof cfg.noiseFiltering !== 'boolean') {
			errors.push({
				field: 'config.noiseFiltering',
				message: 'Noise filtering must be a boolean',
				code: ValidationErrorCode.INVALID_TYPE,
				severity: 'error',
				value: cfg.noiseFiltering
			});
		}

		if (typeof cfg.svgPrecision !== 'number' || cfg.svgPrecision < 0 || cfg.svgPrecision > 4) {
			errors.push({
				field: 'config.svgPrecision',
				message: 'SVG precision must be an integer between 0 and 4',
				code: ValidationErrorCode.OUT_OF_RANGE,
				severity: 'error',
				value: cfg.svgPrecision
			});
		}

		// Validate optional fields
		if (cfg.passCount !== undefined) {
			if (!Number.isInteger(cfg.passCount) || cfg.passCount < 1 || cfg.passCount > 10) {
				warnings.push({
					field: 'config.passCount',
					message: 'Pass count should be an integer between 1 and 10',
					code: ValidationErrorCode.OUT_OF_RANGE,
					severity: 'warning',
					value: cfg.passCount
				});
			}
		}

		if (cfg.customTremor !== undefined) {
			if (typeof cfg.customTremor !== 'number' || cfg.customTremor < 0 || cfg.customTremor > 0.5) {
				warnings.push({
					field: 'config.customTremor',
					message: 'Custom tremor should be between 0 and 0.5',
					code: ValidationErrorCode.OUT_OF_RANGE,
					severity: 'warning',
					value: cfg.customTremor
				});
			}
		}

		if (errors.length > 0) {
			return this.createResult(false, undefined, errors, warnings);
		}

		// Create sanitized version
		let sanitized: VectorizerConfiguration | undefined;
		if (this.config.sanitizeData) {
			sanitized = sanitizeVectorizerConfig(config);
		}

		return this.createResult(true, config as VectorizerConfiguration, errors, warnings, sanitized);
	}

	/**
	 * Validate processing result
	 */
	validateProcessingResult(
		result: unknown,
		_context = 'ProcessingResult'
	): ValidationResult<ProcessingResult | undefined> {
		const errors: ValidationError[] = [];
		const warnings: ValidationError[] = [];

		if (!result || typeof result !== 'object') {
			errors.push({
				field: 'result',
				message: 'Processing result must be an object',
				code: ValidationErrorCode.INVALID_TYPE,
				severity: 'error',
				value: result
			});

			return this.createResult(false, undefined, errors, warnings);
		}

		const res = result as any;

		// Validate SVG
		if (typeof res.svg !== 'string') {
			errors.push({
				field: 'result.svg',
				message: 'SVG must be a string',
				code: ValidationErrorCode.INVALID_TYPE,
				severity: 'error',
				value: res.svg
			});
		} else {
			// Basic SVG validation
			if (!res.svg.includes('<svg') && !res.svg.includes('<?xml')) {
				warnings.push({
					field: 'result.svg',
					message: 'SVG does not contain expected SVG markup',
					code: ValidationErrorCode.INVALID_FORMAT,
					severity: 'warning'
				});
			}

			// Security check for SVG
			if (this.config.enableSecurityChecks && this.detectMaliciousSVG(res.svg)) {
				errors.push({
					field: 'result.svg',
					message: 'Potentially malicious SVG content detected',
					code: ValidationErrorCode.SECURITY_VIOLATION,
					severity: 'error'
				});
			}
		}

		// Validate processing time
		if (typeof res.processingTime !== 'number' || res.processingTime < 0) {
			errors.push({
				field: 'result.processingTime',
				message: 'Processing time must be a non-negative number',
				code: ValidationErrorCode.INVALID_TYPE,
				severity: 'error',
				value: res.processingTime
			});
		}

		// Validate stats
		if (!res.stats || typeof res.stats !== 'object') {
			errors.push({
				field: 'result.stats',
				message: 'Stats must be an object',
				code: ValidationErrorCode.MISSING_REQUIRED,
				severity: 'error'
			});
		} else {
			const statsValidation = this.validateProcessingStats(res.stats, `${_context}.stats`);
			errors.push(...statsValidation.errors);
			warnings.push(...statsValidation.warnings);
		}

		if (errors.length > 0) {
			return this.createResult(false, undefined, errors, warnings);
		}

		return this.createResult(true, result as ProcessingResult, errors, warnings);
	}

	/**
	 * Validate processing stats
	 */
	private validateProcessingStats(
		stats: unknown,
		_context = 'ProcessingStats'
	): ValidationResult<ProcessingStats> {
		const errors: ValidationError[] = [];
		const warnings: ValidationError[] = [];

		if (!stats || typeof stats !== 'object') {
			errors.push({
				field: 'stats',
				message: 'Processing stats must be an object',
				code: ValidationErrorCode.INVALID_TYPE,
				severity: 'error',
				value: stats
			});

			return this.createResult(false, null as any, errors, warnings);
		}

		const st = stats as any;

		// Validate required fields
		if (!Number.isInteger(st.pathsGenerated) || st.pathsGenerated < 0) {
			errors.push({
				field: 'stats.pathsGenerated',
				message: 'Paths generated must be a non-negative integer',
				code: ValidationErrorCode.INVALID_TYPE,
				severity: 'error',
				value: st.pathsGenerated
			});
		}

		if (!['edge', 'centerline', 'superpixel', 'dots'].includes(st.processingBackend)) {
			errors.push({
				field: 'stats.processingBackend',
				message: 'Invalid processing backend',
				code: ValidationErrorCode.INVALID_TYPE,
				severity: 'error',
				value: st.processingBackend
			});
		}

		if (!Number.isInteger(st.svgSize) || st.svgSize < 0) {
			errors.push({
				field: 'stats.svgSize',
				message: 'SVG size must be a non-negative integer',
				code: ValidationErrorCode.INVALID_TYPE,
				severity: 'error',
				value: st.svgSize
			});
		}

		return this.createResult(errors.length === 0, stats as ProcessingStats, errors, warnings);
	}

	/**
	 * Validate worker message with Zod fallback
	 */
	async validateWorkerMessage(
		message: unknown,
		direction: 'to-worker' | 'from-worker'
	): Promise<ValidationResult> {
		const errors: ValidationError[] = [];

		if (!message || typeof message !== 'object') {
			errors.push({
				field: 'message',
				message: 'Worker message must be an object',
				code: ValidationErrorCode.INVALID_TYPE,
				severity: 'error',
				value: message
			});

			return this.createResult(false, undefined, errors, []);
		}

		const msg = message as any;

		// Basic structure validation
		if (!msg.type || typeof msg.type !== 'string') {
			errors.push({
				field: 'message.type',
				message: 'Message type must be a string',
				code: ValidationErrorCode.MISSING_REQUIRED,
				severity: 'error'
			});
		}

		if (!msg.id || typeof msg.id !== 'string') {
			errors.push({
				field: 'message.id',
				message: 'Message ID must be a string',
				code: ValidationErrorCode.MISSING_REQUIRED,
				severity: 'error'
			});
		}

		if (errors.length > 0) {
			return this.createResult(false, undefined, errors, []);
		}

		// Delegate to Zod validator for detailed validation
		try {
			const { MessageValidator } = await import('../workers/message-validator');

			if (direction === 'to-worker') {
				const validation = MessageValidator.validateMainToWorker(message);
				if (!validation.valid) {
					errors.push({
						field: 'message',
						message: 'Message validation failed',
						code: ValidationErrorCode.INVALID_FORMAT,
						severity: 'error'
					});
				}
				return this.createResult(validation.valid, validation.data, errors, []);
			} else {
				const validation = MessageValidator.validateWorkerToMain(message);
				if (!validation.valid) {
					errors.push({
						field: 'message',
						message: 'Message validation failed',
						code: ValidationErrorCode.INVALID_FORMAT,
						severity: 'error'
					});
				}
				return this.createResult(validation.valid, validation.data, errors, []);
			}
		} catch (error) {
			errors.push({
				field: 'message',
				message: `Validation error: ${error}`,
				code: ValidationErrorCode.INVALID_FORMAT,
				severity: 'error'
			});
			return this.createResult(false, undefined, errors, []);
		}
	}

	/**
	 * Get validation statistics
	 */
	getStats(): {
		totalValidations: number;
		totalErrors: number;
		errorRate: number;
		recentErrors: number;
		errorHistory: Array<{ timestamp: number; error: ValidationError; context: string }>;
	} {
		const oneHourAgo = Date.now() - 3600000;
		const recentErrors = this.errorHistory.filter((e) => e.timestamp >= oneHourAgo).length;

		return {
			totalValidations: this.validationCount,
			totalErrors: this.errorCount,
			errorRate: this.validationCount > 0 ? this.errorCount / this.validationCount : 0,
			recentErrors,
			errorHistory: [...this.errorHistory]
		};
	}

	/**
	 * Clear error history
	 */
	clearErrorHistory(): void {
		this.errorHistory = [];
		this.validationCount = 0;
		this.errorCount = 0;
	}

	// Private helper methods

	private createResult<T>(
		valid: boolean,
		data: T | undefined,
		errors: ValidationError[],
		warnings: ValidationError[],
		sanitized?: T
	): ValidationResult<T> {
		this.validationCount++;

		if (!valid || errors.length > 0) {
			this.errorCount++;

			// Log errors to history
			for (const error of errors) {
				this.errorHistory.push({
					timestamp: Date.now(),
					error,
					context: 'ValidationService'
				});
			}

			// Limit history size
			if (this.errorHistory.length > this.config.maxErrorHistory) {
				this.errorHistory = this.errorHistory.slice(-this.config.maxErrorHistory);
			}

			// Log to console if enabled
			if (this.config.logErrors) {
				console.error('[ValidationService] Validation failed:', errors);
			}
		}

		return {
			valid,
			data,
			errors,
			warnings,
			sanitized
		};
	}

	private detectSuspiciousImageData(imageData: any): boolean {
		// Basic heuristics for suspicious image data
		if (!imageData.data || imageData.data.length === 0) return false;

		// Check for all zeros (suspicious for real images)
		const allZeros = imageData.data.every((byte: number) => byte === 0);
		if (allZeros) return true;

		// Check for all max values (suspicious)
		const allMax = imageData.data.every((byte: number) => byte === 255);
		if (allMax) return true;

		// Check for perfect patterns (suspicious)
		const firstByte = imageData.data[0];
		const allSame = imageData.data.every((byte: number) => byte === firstByte);
		if (allSame) return true;

		return false;
	}

	private detectMaliciousSVG(svg: string): boolean {
		// Basic SVG security checks
		const suspiciousPatterns = [
			/<script/i,
			/javascript:/i,
			/on\w+\s*=/i, // Event handlers
			/<iframe/i,
			/<object/i,
			/<embed/i,
			/data:\s*text\/html/i,
			/expression\s*\(/i // CSS expressions
		];

		return suspiciousPatterns.some((pattern) => pattern.test(svg));
	}
}

// Export singleton instance
export const validationService = new ValidationService();
