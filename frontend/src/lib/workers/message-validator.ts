/**
 * Message Validation Layer
 *
 * Provides runtime validation for worker messages using Zod,
 * ensuring type safety and data integrity across the worker boundary.
 */

import { z } from 'zod';
import {
	VectorizerBackend,
	ProcessingStage,
	WorkerState,
	ErrorCode,
	type MainToWorkerMessage,
	type WorkerToMainMessage
} from '../types/worker-protocol';

// ============================================================================
// Base Schemas
// ============================================================================

const MessageIdSchema = z.string().min(1);

const SerializedImageDataSchema = z.object({
	data: z.union([z.array(z.number()), z.instanceof(Uint8Array), z.instanceof(Uint8ClampedArray)]),
	width: z.number().int().positive(),
	height: z.number().int().positive(),
	colorSpace: z.enum(['srgb', 'display-p3']).optional()
});

const VectorizerBackendSchema = z.nativeEnum(VectorizerBackend);
const ProcessingStageSchema = z.nativeEnum(ProcessingStage);
const WorkerStateSchema = z.nativeEnum(WorkerState);
const ErrorCodeSchema = z.nativeEnum(ErrorCode);

// ============================================================================
// Configuration Schemas
// ============================================================================

const EdgeBackendSettingsSchema = z.object({
	etfFdog: z.boolean().optional(),
	flowTracing: z.boolean().optional(),
	bezierFitting: z.boolean().optional()
});

const CenterlineBackendSettingsSchema = z.object({
	adaptiveThreshold: z.boolean().optional(),
	windowSize: z.number().int().min(15).max(50).optional(),
	sensitivityK: z.number().min(0.1).max(1.0).optional(),
	widthModulation: z.boolean().optional(),
	minBranchLength: z.number().min(4).max(24).optional(),
	douglasPeuckerEpsilon: z.number().min(0.5).max(3.0).optional()
});

const DotsBackendSettingsSchema = z.object({
	density: z.number().min(0).max(1).optional(),
	minRadius: z.number().positive().optional(),
	maxRadius: z.number().positive().optional(),
	adaptiveSizing: z.boolean().optional(),
	preserveColors: z.boolean().optional(),
	poissonDisk: z.boolean().optional(),
	gradientSizing: z.boolean().optional()
});

const SuperpixelBackendSettingsSchema = z.object({
	numSuperpixels: z.number().int().min(20).max(1000).optional(),
	compactness: z.number().min(1).max(50).optional(),
	slicIterations: z.number().int().min(5).max(15).optional(),
	fillRegions: z.boolean().optional(),
	strokeRegions: z.boolean().optional(),
	simplifyBoundaries: z.boolean().optional(),
	boundaryEpsilon: z.number().min(0.5).max(3.0).optional(),
	preserveColors: z.boolean().optional()
});

const VectorizerConfigurationSchema = z.object({
	// Core settings
	backend: VectorizerBackendSchema,
	detail: z.number().min(0).max(1),
	strokeWidth: z.number().positive().max(50),

	// Multipass settings
	multipass: z.boolean(),
	passCount: z.number().int().min(1).max(10).optional(),
	reversePass: z.boolean().optional(),
	diagonalPass: z.boolean().optional(),

	// Processing settings
	noiseFiltering: z.boolean(),
	svgPrecision: z.number().int().min(0).max(4),
	maxProcessingTime: z.number().positive().optional(),

	// Hand-drawn aesthetics
	handDrawnPreset: z.enum(['none', 'subtle', 'medium', 'strong', 'sketchy']).optional(),
	customTremor: z.number().min(0).max(0.5).optional(),
	customVariableWeights: z.number().min(0).max(1).optional(),
	customTapering: z.number().min(0).max(1).optional(),

	// Background removal
	backgroundRemoval: z.boolean().optional(),
	backgroundRemovalStrength: z.number().min(0).max(1).optional(),
	backgroundRemovalAlgorithm: z.enum(['otsu', 'adaptive', 'auto']).optional(),

	// Backend-specific settings
	edgeSettings: EdgeBackendSettingsSchema.optional(),
	centerlineSettings: CenterlineBackendSettingsSchema.optional(),
	dotsSettings: DotsBackendSettingsSchema.optional(),
	superpixelSettings: SuperpixelBackendSettingsSchema.optional()
});

// ============================================================================
// Main to Worker Message Schemas
// ============================================================================

const InitializeMessageSchema = z.object({
	type: z.literal('initialize'),
	id: MessageIdSchema,
	payload: z.object({
		wasmPath: z.string().optional(),
		preferGpu: z.boolean().optional(),
		threadCount: z.number().int().positive().optional()
	})
});

const ProcessImageMessageSchema = z.object({
	type: z.literal('process'),
	id: MessageIdSchema,
	payload: z.object({
		imageData: SerializedImageDataSchema,
		config: VectorizerConfigurationSchema
	})
});

const UpdateConfigMessageSchema = z.object({
	type: z.literal('update-config'),
	id: MessageIdSchema,
	payload: z.object({
		config: VectorizerConfigurationSchema.partial()
	})
});

const GetCapabilitiesMessageSchema = z.object({
	type: z.literal('get-capabilities'),
	id: MessageIdSchema
});

const GetStatusMessageSchema = z.object({
	type: z.literal('get-status'),
	id: MessageIdSchema
});

const CleanupMessageSchema = z.object({
	type: z.literal('cleanup'),
	id: MessageIdSchema
});

const TerminateMessageSchema = z.object({
	type: z.literal('terminate'),
	id: MessageIdSchema
});

// Combined schema for main to worker messages
const MainToWorkerMessageSchema = z.discriminatedUnion('type', [
	InitializeMessageSchema,
	ProcessImageMessageSchema,
	UpdateConfigMessageSchema,
	GetCapabilitiesMessageSchema,
	GetStatusMessageSchema,
	CleanupMessageSchema,
	TerminateMessageSchema
]);

// ============================================================================
// Worker to Main Message Schemas
// ============================================================================

const WorkerErrorSchema = z.object({
	code: ErrorCodeSchema,
	message: z.string(),
	details: z.unknown().optional(),
	stack: z.string().optional()
});

const WorkerCapabilitiesSchema = z.object({
	wasmAvailable: z.boolean(),
	gpuAvailable: z.boolean(),
	threadingSupported: z.boolean(),
	threadCount: z.number().int().optional(),
	backends: z.array(VectorizerBackendSchema),
	maxImageSize: z.number().positive(),
	supportedFormats: z.array(z.string()),
	features: z.object({
		multipass: z.boolean(),
		handDrawn: z.boolean(),
		backgroundRemoval: z.boolean(),
		colorPreservation: z.boolean()
	})
});

const ProcessingStatsSchema = z.object({
	pathsGenerated: z.number().int().nonnegative(),
	processingBackend: VectorizerBackendSchema,
	edgesDetected: z.number().int().nonnegative().optional(),
	optimizationRatio: z.number().optional(),
	colorPaletteSize: z.number().int().nonnegative().optional(),
	svgSize: z.number().int().nonnegative(),
	compressionRatio: z.number().optional()
});

const InitializedMessageSchema = z.object({
	type: z.literal('initialized'),
	id: MessageIdSchema,
	payload: z.object({
		success: z.boolean(),
		capabilities: WorkerCapabilitiesSchema.optional(),
		error: z.string().optional()
	})
});

const ReadyMessageSchema = z.object({
	type: z.literal('ready'),
	id: MessageIdSchema,
	payload: z.object({
		state: z.literal(WorkerState.READY)
	})
});

const ProcessingStartedMessageSchema = z.object({
	type: z.literal('processing-started'),
	id: MessageIdSchema,
	payload: z.object({
		estimatedTime: z.number().optional(),
		backend: VectorizerBackendSchema
	})
});

const ProcessingProgressMessageSchema = z.object({
	type: z.literal('processing-progress'),
	id: MessageIdSchema,
	payload: z.object({
		stage: ProcessingStageSchema,
		percent: z.number().min(0).max(100),
		message: z.string(),
		currentStep: z.number().int().optional(),
		totalSteps: z.number().int().optional()
	})
});

const ProcessingCompleteMessageSchema = z.object({
	type: z.literal('processing-complete'),
	id: MessageIdSchema,
	payload: z.object({
		svg: z.string(),
		stats: ProcessingStatsSchema,
		processingTime: z.number().nonnegative()
	})
});

const ProcessingErrorMessageSchema = z.object({
	type: z.literal('processing-error'),
	id: MessageIdSchema,
	payload: z.object({
		error: WorkerErrorSchema,
		canRetry: z.boolean(),
		suggestion: z.string().optional()
	})
});

const CapabilitiesMessageSchema = z.object({
	type: z.literal('capabilities'),
	id: MessageIdSchema,
	payload: WorkerCapabilitiesSchema
});

const MemoryInfoSchema = z.object({
	used: z.number().nonnegative(),
	limit: z.number().positive(),
	available: z.number().nonnegative()
});

const PerformanceInfoSchema = z.object({
	averageProcessingTime: z.number().nonnegative(),
	lastProcessingTime: z.number().nonnegative(),
	successRate: z.number().min(0).max(1),
	processedCount: z.number().int().nonnegative()
});

const StatusMessageSchema = z.object({
	type: z.literal('status'),
	id: MessageIdSchema,
	payload: z.object({
		state: WorkerStateSchema,
		currentTask: z.string().optional(),
		memoryUsage: MemoryInfoSchema.optional(),
		performance: PerformanceInfoSchema.optional()
	})
});

const ValidationResultSchema = z.object({
	field: z.string(),
	valid: z.boolean(),
	message: z.string().optional(),
	suggestion: z.string().optional()
});

const ConfigUpdatedMessageSchema = z.object({
	type: z.literal('config-updated'),
	id: MessageIdSchema,
	payload: z.object({
		success: z.boolean(),
		config: VectorizerConfigurationSchema.optional(),
		validation: z.array(ValidationResultSchema).optional()
	})
});

const WorkerErrorMessageSchema = z.object({
	type: z.literal('worker-error'),
	id: MessageIdSchema,
	payload: z.object({
		error: WorkerErrorSchema,
		fatal: z.boolean()
	})
});

const TerminatedMessageSchema = z.object({
	type: z.literal('terminated'),
	id: MessageIdSchema
});

// Combined schema for worker to main messages
const WorkerToMainMessageSchema = z.discriminatedUnion('type', [
	InitializedMessageSchema,
	ReadyMessageSchema,
	ProcessingStartedMessageSchema,
	ProcessingProgressMessageSchema,
	ProcessingCompleteMessageSchema,
	ProcessingErrorMessageSchema,
	CapabilitiesMessageSchema,
	StatusMessageSchema,
	ConfigUpdatedMessageSchema,
	WorkerErrorMessageSchema,
	TerminatedMessageSchema
]);

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Message validator class
 */
export class MessageValidator {
	/**
	 * Validate a main to worker message
	 */
	static validateMainToWorker(message: unknown): {
		valid: boolean;
		data?: MainToWorkerMessage;
		errors?: z.ZodError;
	} {
		try {
			const data = MainToWorkerMessageSchema.parse(message);
			return { valid: true, data: data as MainToWorkerMessage };
		} catch (error) {
			if (error instanceof z.ZodError) {
				return { valid: false, errors: error };
			}
			throw error;
		}
	}

	/**
	 * Validate a worker to main message
	 */
	static validateWorkerToMain(message: unknown): {
		valid: boolean;
		data?: WorkerToMainMessage;
		errors?: z.ZodError;
	} {
		try {
			const data = WorkerToMainMessageSchema.parse(message);
			return { valid: true, data: data as WorkerToMainMessage };
		} catch (error) {
			if (error instanceof z.ZodError) {
				return { valid: false, errors: error };
			}
			throw error;
		}
	}

	/**
	 * Validate configuration
	 */
	static validateConfiguration(config: unknown): {
		valid: boolean;
		data?: z.infer<typeof VectorizerConfigurationSchema>;
		errors?: z.ZodError;
	} {
		try {
			const data = VectorizerConfigurationSchema.parse(config);
			return { valid: true, data };
		} catch (error) {
			if (error instanceof z.ZodError) {
				return { valid: false, errors: error };
			}
			throw error;
		}
	}

	/**
	 * Validate partial configuration for updates
	 */
	static validatePartialConfiguration(config: unknown): {
		valid: boolean;
		data?: z.infer<typeof VectorizerConfigurationSchema>;
		errors?: z.ZodError;
	} {
		try {
			const data = VectorizerConfigurationSchema.partial().parse(config);
			return { valid: true, data: data as z.infer<typeof VectorizerConfigurationSchema> };
		} catch (error) {
			if (error instanceof z.ZodError) {
				return { valid: false, errors: error };
			}
			throw error;
		}
	}

	/**
	 * Get human-readable error messages from validation errors
	 */
	static formatValidationErrors(errors: z.ZodError<any>): string[] {
		return errors.issues.map((error: z.ZodIssue) => {
			const path = error.path.join('.');
			return `${path}: ${error.message}`;
		});
	}

	/**
	 * Sanitize configuration to ensure valid values
	 */
	static sanitizeConfiguration(config: any): z.infer<typeof VectorizerConfigurationSchema> {
		// Apply defaults and coerce values
		const sanitized = { ...config };

		// Ensure detail is in range
		if (typeof sanitized.detail === 'number') {
			sanitized.detail = Math.max(0, Math.min(1, sanitized.detail));
		}

		// Ensure stroke width is positive
		if (typeof sanitized.strokeWidth === 'number') {
			sanitized.strokeWidth = Math.max(0.1, Math.min(50, sanitized.strokeWidth));
		}

		// Ensure pass count is valid when multipass is enabled
		if (sanitized.multipass && !sanitized.passCount) {
			sanitized.passCount = 2;
		}

		// Validate and return
		const validation = this.validateConfiguration(sanitized);
		if (validation.valid && validation.data) {
			return validation.data;
		}

		// If still invalid, return minimal valid config
		return {
			backend: VectorizerBackend.EDGE,
			detail: 0.4,
			strokeWidth: 1.5,
			multipass: false,
			noiseFiltering: false,
			svgPrecision: 2
		};
	}
}

// Export schemas for use in other modules
export {
	VectorizerConfigurationSchema,
	WorkerErrorSchema,
	WorkerCapabilitiesSchema,
	ProcessingStatsSchema,
	SerializedImageDataSchema
};
