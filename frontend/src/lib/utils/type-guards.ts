/**
 * Comprehensive Type Guards for Runtime Type Safety
 *
 * Provides runtime type validation to catch type mismatches early
 * and ensure data integrity across the application boundary.
 */

import type {
	SerializedImageData,
	VectorizerConfiguration,
	ProcessingStats,
	WorkerCapabilities
} from '../types/worker-protocol';

// Import enums as values for runtime use
import {
	VectorizerBackend,
	ProcessingStage,
	WorkerState,
	ErrorCode
} from '../types/worker-protocol';

import type {
	ProcessingResult,
	ProcessingOptions,
	QueueItem,
	WorkerInstance
} from '../types/service-types';

/**
 * Type guard for ImageData or SerializedImageData
 */
export function isValidImageData(value: unknown): value is ImageData | SerializedImageData {
	if (!value || typeof value !== 'object') {
		return false;
	}

	// Check for ImageData properties
	if ('data' in value && 'width' in value && 'height' in value) {
		const obj = value as any;

		// Check dimensions are positive integers
		if (!Number.isInteger(obj.width) || obj.width <= 0) return false;
		if (!Number.isInteger(obj.height) || obj.height <= 0) return false;

		// Check data is array-like with correct length
		const expectedLength = obj.width * obj.height * 4; // RGBA
		if (!obj.data || typeof obj.data.length !== 'number') return false;
		if (obj.data.length !== expectedLength) return false;

		return true;
	}

	return false;
}

/**
 * Type guard for SerializedImageData specifically
 */
export function isSerializedImageData(value: unknown): value is SerializedImageData {
	if (!isValidImageData(value)) return false;

	const obj = value as any;

	// SerializedImageData has data as array, not Uint8ClampedArray
	return (
		Array.isArray(obj.data) ||
		obj.data instanceof Uint8Array ||
		obj.data instanceof Uint8ClampedArray
	);
}

/**
 * Type guard for VectorizerConfiguration
 */
export function isValidVectorizerConfig(value: unknown): value is VectorizerConfiguration {
	if (!value || typeof value !== 'object') return false;

	const config = value as any;

	// Check required fields
	if (!isValidVectorizerBackend(config.backend)) return false;
	if (typeof config.detail !== 'number' || config.detail < 0 || config.detail > 1) return false;
	if (typeof config.strokeWidth !== 'number' || config.strokeWidth <= 0 || config.strokeWidth > 50)
		return false;
	if (typeof config.multipass !== 'boolean') return false;
	if (typeof config.noiseFiltering !== 'boolean') return false;
	if (typeof config.svgPrecision !== 'number' || config.svgPrecision < 0 || config.svgPrecision > 4)
		return false;

	// Check optional fields if present
	if (config.passCount !== undefined) {
		if (!Number.isInteger(config.passCount) || config.passCount < 1 || config.passCount > 10)
			return false;
	}

	if (config.maxProcessingTime !== undefined) {
		if (typeof config.maxProcessingTime !== 'number' || config.maxProcessingTime <= 0) return false;
	}

	if (config.handDrawnPreset !== undefined) {
		const validPresets = ['none', 'subtle', 'medium', 'strong', 'sketchy'];
		if (!validPresets.includes(config.handDrawnPreset)) return false;
	}

	if (config.customTremor !== undefined) {
		if (
			typeof config.customTremor !== 'number' ||
			config.customTremor < 0 ||
			config.customTremor > 0.5
		)
			return false;
	}

	if (config.backgroundRemovalStrength !== undefined) {
		if (
			typeof config.backgroundRemovalStrength !== 'number' ||
			config.backgroundRemovalStrength < 0 ||
			config.backgroundRemovalStrength > 1
		)
			return false;
	}

	return true;
}

/**
 * Type guard for VectorizerBackend
 */
export function isValidVectorizerBackend(value: unknown): value is VectorizerBackend {
	const validBackends: VectorizerBackend[] = [
		VectorizerBackend.EDGE,
		VectorizerBackend.CENTERLINE,
		VectorizerBackend.SUPERPIXEL,
		VectorizerBackend.DOTS
	];
	return typeof value === 'string' && validBackends.includes(value as VectorizerBackend);
}

/**
 * Type guard for ProcessingStage
 */
export function isValidProcessingStage(value: unknown): value is ProcessingStage {
	const validStages: ProcessingStage[] = [
		ProcessingStage.INITIALIZING,
		ProcessingStage.PREPROCESSING,
		ProcessingStage.EDGE_DETECTION,
		ProcessingStage.PATH_TRACING,
		ProcessingStage.PATH_OPTIMIZATION,
		ProcessingStage.ARTISTIC_ENHANCEMENT,
		ProcessingStage.SVG_GENERATION,
		ProcessingStage.FINALIZING
	];
	return typeof value === 'string' && validStages.includes(value as ProcessingStage);
}

/**
 * Type guard for WorkerState
 */
export function isValidWorkerState(value: unknown): value is WorkerState {
	const validStates: WorkerState[] = [
		WorkerState.INITIALIZING,
		WorkerState.READY,
		WorkerState.PROCESSING,
		WorkerState.IDLE,
		WorkerState.ERROR,
		WorkerState.TERMINATING
	];
	return typeof value === 'string' && validStates.includes(value as WorkerState);
}

/**
 * Type guard for ErrorCode
 */
export function isValidErrorCode(value: unknown): value is ErrorCode {
	const validCodes: ErrorCode[] = [
		ErrorCode.WASM_INIT_FAILED,
		ErrorCode.WORKER_INIT_FAILED,
		ErrorCode.INVALID_IMAGE_DATA,
		ErrorCode.IMAGE_TOO_LARGE,
		ErrorCode.PROCESSING_TIMEOUT,
		ErrorCode.OUT_OF_MEMORY,
		ErrorCode.INVALID_CONFIG,
		ErrorCode.UNSUPPORTED_BACKEND,
		ErrorCode.INVALID_PARAMETER,
		ErrorCode.WORKER_CRASHED,
		ErrorCode.UNKNOWN_ERROR
	];
	return typeof value === 'string' && validCodes.includes(value as ErrorCode);
}

/**
 * Type guard for ProcessingStats
 */
export function isValidProcessingStats(value: unknown): value is ProcessingStats {
	if (!value || typeof value !== 'object') return false;

	const stats = value as any;

	// Check required fields
	if (!Number.isInteger(stats.pathsGenerated) || stats.pathsGenerated < 0) return false;
	if (!isValidVectorizerBackend(stats.processingBackend)) return false;
	if (!Number.isInteger(stats.svgSize) || stats.svgSize < 0) return false;

	// Check optional fields if present
	if (stats.edgesDetected !== undefined) {
		if (!Number.isInteger(stats.edgesDetected) || stats.edgesDetected < 0) return false;
	}

	if (stats.optimizationRatio !== undefined) {
		if (typeof stats.optimizationRatio !== 'number' || stats.optimizationRatio < 0) return false;
	}

	if (stats.colorPaletteSize !== undefined) {
		if (!Number.isInteger(stats.colorPaletteSize) || stats.colorPaletteSize < 0) return false;
	}

	if (stats.compressionRatio !== undefined) {
		if (typeof stats.compressionRatio !== 'number' || stats.compressionRatio < 0) return false;
	}

	return true;
}

/**
 * Type guard for ProcessingResult
 */
export function isValidProcessingResult(value: unknown): value is ProcessingResult {
	if (!value || typeof value !== 'object') return false;

	const result = value as any;

	// Check required fields
	if (typeof result.svg !== 'string' || result.svg.length === 0) return false;
	if (!isValidProcessingStats(result.stats)) return false;
	if (typeof result.processingTime !== 'number' || result.processingTime < 0) return false;

	return true;
}

/**
 * Type guard for WorkerCapabilities
 */
export function isValidWorkerCapabilities(value: unknown): value is WorkerCapabilities {
	if (!value || typeof value !== 'object') return false;

	const caps = value as any;

	// Check required fields
	if (typeof caps.wasmAvailable !== 'boolean') return false;
	if (typeof caps.gpuAvailable !== 'boolean') return false;
	if (typeof caps.threadingSupported !== 'boolean') return false;
	if (!Array.isArray(caps.backends)) return false;
	if (typeof caps.maxImageSize !== 'number' || caps.maxImageSize <= 0) return false;
	if (!Array.isArray(caps.supportedFormats)) return false;

	// Validate backends array
	for (const backend of caps.backends) {
		if (!isValidVectorizerBackend(backend)) return false;
	}

	// Validate supported formats
	for (const format of caps.supportedFormats) {
		if (typeof format !== 'string') return false;
	}

	// Check features object
	if (!caps.features || typeof caps.features !== 'object') return false;
	if (typeof caps.features.multipass !== 'boolean') return false;
	if (typeof caps.features.handDrawn !== 'boolean') return false;
	if (typeof caps.features.backgroundRemoval !== 'boolean') return false;
	if (typeof caps.features.colorPreservation !== 'boolean') return false;

	// Check optional fields
	if (caps.threadCount !== undefined) {
		if (!Number.isInteger(caps.threadCount) || caps.threadCount <= 0) return false;
	}

	return true;
}

/**
 * Type guard for ProcessingOptions
 */
export function isValidProcessingOptions(value: unknown): value is ProcessingOptions {
	if (!value || typeof value !== 'object') return false;

	const options = value as any;

	// All fields are optional, but check types if present
	if (options.priority !== undefined) {
		if (typeof options.priority !== 'number') return false;
	}

	if (options.timeout !== undefined) {
		if (typeof options.timeout !== 'number' || options.timeout <= 0) return false;
	}

	if (options.retryAttempts !== undefined) {
		if (!Number.isInteger(options.retryAttempts) || options.retryAttempts < 0) return false;
	}

	if (options.retryDelay !== undefined) {
		if (typeof options.retryDelay !== 'number' || options.retryDelay < 0) return false;
	}

	if (options.onProgress !== undefined) {
		if (typeof options.onProgress !== 'function') return false;
	}

	return true;
}

/**
 * Type guard for QueueItem
 */
export function isValidQueueItem(value: unknown): value is QueueItem {
	if (!value || typeof value !== 'object') return false;

	const item = value as any;

	// Check required fields
	if (typeof item.id !== 'string' || item.id.length === 0) return false;
	if (!isValidImageData(item.imageData)) return false;
	if (!isValidVectorizerConfig(item.config)) return false;
	if (!isValidProcessingOptions(item.options)) return false;
	if (typeof item.priority !== 'number') return false;

	// Check optional timestamp
	if (item.timestamp !== undefined) {
		if (typeof item.timestamp !== 'number' || item.timestamp <= 0) return false;
	}

	return true;
}

/**
 * Type guard for WorkerInstance
 */
export function isValidWorkerInstance(value: unknown): value is WorkerInstance {
	if (!value || typeof value !== 'object') return false;

	const instance = value as any;

	// Check required fields
	if (typeof instance.id !== 'string' || instance.id.length === 0) return false;
	if (!(instance.worker instanceof Worker)) return false;

	const validStates = ['idle', 'busy', 'error'];
	if (!validStates.includes(instance.state)) return false;

	if (typeof instance.lastUsed !== 'number' || instance.lastUsed <= 0) return false;
	if (!Number.isInteger(instance.processedCount) || instance.processedCount < 0) return false;

	return true;
}

/**
 * Sanitize and validate configuration with defaults
 */
export function sanitizeVectorizerConfig(config: unknown): VectorizerConfiguration {
	if (!isValidVectorizerConfig(config)) {
		console.warn('[TypeGuards] Invalid configuration provided, using defaults');

		// Return minimal valid configuration
		return {
			backend: VectorizerBackend.EDGE,
			detail: 0.4,
			strokeWidth: 1.5,
			multipass: false,
			noiseFiltering: false,
			svgPrecision: 2
		};
	}

	// Configuration is valid, but ensure numeric bounds
	const validConfig = config as VectorizerConfiguration;

	return {
		...validConfig,
		detail: Math.max(0, Math.min(1, validConfig.detail)),
		strokeWidth: Math.max(0.1, Math.min(50, validConfig.strokeWidth)),
		svgPrecision: Math.max(0, Math.min(4, Math.floor(validConfig.svgPrecision))),
		passCount: validConfig.passCount
			? Math.max(1, Math.min(10, Math.floor(validConfig.passCount)))
			: undefined,
		customTremor: validConfig.customTremor
			? Math.max(0, Math.min(0.5, validConfig.customTremor))
			: undefined,
		customVariableWeights: validConfig.customVariableWeights
			? Math.max(0, Math.min(1, validConfig.customVariableWeights))
			: undefined,
		customTapering: validConfig.customTapering
			? Math.max(0, Math.min(1, validConfig.customTapering))
			: undefined,
		backgroundRemovalStrength: validConfig.backgroundRemovalStrength
			? Math.max(0, Math.min(1, validConfig.backgroundRemovalStrength))
			: undefined
	};
}

/**
 * Validate and throw on invalid data
 */
export function assertValidImageData(
	value: unknown
): asserts value is ImageData | SerializedImageData {
	if (!isValidImageData(value)) {
		throw new TypeError('Invalid image data: missing data, width, or height properties');
	}
}

export function assertValidConfig(value: unknown): asserts value is VectorizerConfiguration {
	if (!isValidVectorizerConfig(value)) {
		throw new TypeError('Invalid vectorizer configuration');
	}
}

export function assertValidResult(value: unknown): asserts value is ProcessingResult {
	if (!isValidProcessingResult(value)) {
		throw new TypeError('Invalid processing result');
	}
}

/**
 * Runtime type validation utility
 */
export class TypeValidator {
	private static errors: Array<{ timestamp: number; error: string; data: unknown }> = [];

	static validate<T>(
		value: unknown,
		guard: (value: unknown) => value is T,
		name: string
	): T | null {
		try {
			if (guard(value)) {
				return value;
			}

			const error = `Type validation failed for ${name}`;
			this.errors.push({
				timestamp: Date.now(),
				error,
				data: value
			});

			console.error(error, value);
			return null;
		} catch (err) {
			const error = `Type validation threw error for ${name}: ${err}`;
			this.errors.push({
				timestamp: Date.now(),
				error,
				data: value
			});

			console.error(error, value);
			return null;
		}
	}

	static getErrors(since?: number): Array<{ timestamp: number; error: string; data: unknown }> {
		if (since) {
			return this.errors.filter((e) => e.timestamp >= since);
		}
		return [...this.errors];
	}

	static clearErrors(): void {
		this.errors = [];
	}

	static getErrorCount(): number {
		return this.errors.length;
	}
}
