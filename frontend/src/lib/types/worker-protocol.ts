/**
 * Comprehensive Worker Message Protocol
 *
 * This module defines a type-safe, exhaustive message protocol for
 * communication between the main thread and Web Workers, eliminating
 * the inconsistencies and weak typing of the previous implementation.
 */

// ============================================================================
// Worker State Machine
// ============================================================================

/**
 * Worker lifecycle states
 */
export enum WorkerState {
	/** Worker is being initialized */
	INITIALIZING = 'initializing',
	/** Worker is ready to accept commands */
	READY = 'ready',
	/** Worker is processing a request */
	PROCESSING = 'processing',
	/** Worker is idle and waiting for commands */
	IDLE = 'idle',
	/** Worker encountered an error */
	ERROR = 'error',
	/** Worker is shutting down */
	TERMINATING = 'terminating'
}

// ============================================================================
// Message Types (Discriminated Unions)
// ============================================================================

/**
 * All possible message types from main thread to worker
 */
export type MainToWorkerMessage =
	| InitializeMessage
	| ProcessImageMessage
	| UpdateConfigMessage
	| GetCapabilitiesMessage
	| GetStatusMessage
	| CleanupMessage
	| TerminateMessage;

/**
 * All possible message types from worker to main thread
 */
export type WorkerToMainMessage =
	| InitializedMessage
	| ReadyMessage
	| ProcessingStartedMessage
	| ProcessingProgressMessage
	| ProcessingCompleteMessage
	| ProcessingErrorMessage
	| CapabilitiesMessage
	| StatusMessage
	| ConfigUpdatedMessage
	| WorkerErrorMessage
	| TerminatedMessage;

// ============================================================================
// Main to Worker Messages
// ============================================================================

export interface InitializeMessage {
	type: 'initialize';
	id: string;
	payload: {
		wasmPath?: string;
		preferGpu?: boolean;
		threadCount?: number;
	};
}

export interface ProcessImageMessage {
	type: 'process';
	id: string;
	payload: {
		imageData: SerializedImageData;
		config: VectorizerConfiguration;
	};
}

export interface UpdateConfigMessage {
	type: 'update-config';
	id: string;
	payload: {
		config: Partial<VectorizerConfiguration>;
	};
}

export interface GetCapabilitiesMessage {
	type: 'get-capabilities';
	id: string;
}

export interface GetStatusMessage {
	type: 'get-status';
	id: string;
}

export interface CleanupMessage {
	type: 'cleanup';
	id: string;
}

export interface TerminateMessage {
	type: 'terminate';
	id: string;
}

// ============================================================================
// Worker to Main Messages
// ============================================================================

export interface InitializedMessage {
	type: 'initialized';
	id: string;
	payload: {
		success: boolean;
		capabilities?: WorkerCapabilities;
		error?: string;
	};
}

export interface ReadyMessage {
	type: 'ready';
	id: string;
	payload: {
		state: WorkerState.READY;
	};
}

export interface ProcessingStartedMessage {
	type: 'processing-started';
	id: string;
	payload: {
		estimatedTime?: number;
		backend: VectorizerBackend;
	};
}

export interface ProcessingProgressMessage {
	type: 'processing-progress';
	id: string;
	payload: {
		stage: ProcessingStage;
		percent: number;
		message: string;
		currentStep?: number;
		totalSteps?: number;
	};
}

export interface ProcessingCompleteMessage {
	type: 'processing-complete';
	id: string;
	payload: {
		svg: string;
		stats: ProcessingStats;
		processingTime: number;
	};
}

export interface ProcessingErrorMessage {
	type: 'processing-error';
	id: string;
	payload: {
		error: WorkerError;
		canRetry: boolean;
		suggestion?: string;
	};
}

export interface CapabilitiesMessage {
	type: 'capabilities';
	id: string;
	payload: WorkerCapabilities;
}

export interface StatusMessage {
	type: 'status';
	id: string;
	payload: {
		state: WorkerState;
		currentTask?: string;
		memoryUsage?: MemoryInfo;
		performance?: PerformanceInfo;
	};
}

export interface ConfigUpdatedMessage {
	type: 'config-updated';
	id: string;
	payload: {
		success: boolean;
		config?: VectorizerConfiguration;
		validation?: ValidationResult[];
	};
}

export interface WorkerErrorMessage {
	type: 'worker-error';
	id: string;
	payload: {
		error: WorkerError;
		fatal: boolean;
	};
}

export interface TerminatedMessage {
	type: 'terminated';
	id: string;
}

// ============================================================================
// Data Types
// ============================================================================

/**
 * Serialized image data for transfer between threads
 */
export interface SerializedImageData {
	data: number[] | Uint8Array | Uint8ClampedArray;
	width: number;
	height: number;
	colorSpace?: 'srgb' | 'display-p3';
}

/**
 * Vectorizer backend options
 */
export enum VectorizerBackend {
	EDGE = 'edge',
	CENTERLINE = 'centerline',
	SUPERPIXEL = 'superpixel',
	DOTS = 'dots'
}

/**
 * Processing stages for progress reporting
 */
export enum ProcessingStage {
	INITIALIZING = 'initializing',
	PREPROCESSING = 'preprocessing',
	EDGE_DETECTION = 'edge-detection',
	PATH_TRACING = 'path-tracing',
	PATH_OPTIMIZATION = 'path-optimization',
	ARTISTIC_ENHANCEMENT = 'artistic-enhancement',
	SVG_GENERATION = 'svg-generation',
	FINALIZING = 'finalizing'
}

/**
 * Complete vectorizer configuration
 */
export interface VectorizerConfiguration {
	// Core settings
	backend: VectorizerBackend;
	detail: number; // 0.0 - 1.0
	strokeWidth: number; // pixels

	// Multipass settings
	multipass: boolean;
	passCount?: number;
	reversePass?: boolean;
	diagonalPass?: boolean;

	// Processing settings
	noiseFiltering: boolean;
	svgPrecision: number;
	maxProcessingTime?: number;

	// Hand-drawn aesthetics
	handDrawnPreset?: 'none' | 'subtle' | 'medium' | 'strong' | 'sketchy';
	customTremor?: number;
	customVariableWeights?: number;
	customTapering?: number;

	// Background removal
	backgroundRemoval?: boolean;
	backgroundRemovalStrength?: number;
	backgroundRemovalAlgorithm?: 'otsu' | 'adaptive' | 'auto';

	// Backend-specific settings
	edgeSettings?: EdgeBackendSettings;
	centerlineSettings?: CenterlineBackendSettings;
	dotsSettings?: DotsBackendSettings;
	superpixelSettings?: SuperpixelBackendSettings;
}

export interface EdgeBackendSettings {
	etfFdog?: boolean;
	flowTracing?: boolean;
	bezierFitting?: boolean;
}

export interface CenterlineBackendSettings {
	adaptiveThreshold?: boolean;
	windowSize?: number;
	sensitivityK?: number;
	widthModulation?: boolean;
	minBranchLength?: number;
	douglasPeuckerEpsilon?: number;
}

export interface DotsBackendSettings {
	density?: number;
	minRadius?: number;
	maxRadius?: number;
	adaptiveSizing?: boolean;
	preserveColors?: boolean;
	poissonDisk?: boolean;
	gradientSizing?: boolean;
}

export interface SuperpixelBackendSettings {
	numSuperpixels?: number;
	compactness?: number;
	slicIterations?: number;
	fillRegions?: boolean;
	strokeRegions?: boolean;
	simplifyBoundaries?: boolean;
	boundaryEpsilon?: number;
	preserveColors?: boolean;
}

/**
 * Worker capabilities
 */
export interface WorkerCapabilities {
	wasmAvailable: boolean;
	gpuAvailable: boolean;
	threadingSupported: boolean;
	threadCount?: number;
	backends: VectorizerBackend[];
	maxImageSize: number;
	supportedFormats: string[];
	features: {
		multipass: boolean;
		handDrawn: boolean;
		backgroundRemoval: boolean;
		colorPreservation: boolean;
	};
}

/**
 * Processing statistics
 */
export interface ProcessingStats {
	pathsGenerated: number;
	processingBackend: VectorizerBackend;
	edgesDetected?: number;
	optimizationRatio?: number;
	colorPaletteSize?: number;
	svgSize: number;
	compressionRatio?: number;
}

/**
 * Worker error types
 */
export interface WorkerError {
	code: ErrorCode;
	message: string;
	details?: unknown;
	stack?: string;
}

export enum ErrorCode {
	// Initialization errors
	WASM_INIT_FAILED = 'WASM_INIT_FAILED',
	WORKER_INIT_FAILED = 'WORKER_INIT_FAILED',

	// Processing errors
	INVALID_IMAGE_DATA = 'INVALID_IMAGE_DATA',
	IMAGE_TOO_LARGE = 'IMAGE_TOO_LARGE',
	PROCESSING_TIMEOUT = 'PROCESSING_TIMEOUT',
	OUT_OF_MEMORY = 'OUT_OF_MEMORY',

	// Configuration errors
	INVALID_CONFIG = 'INVALID_CONFIG',
	UNSUPPORTED_BACKEND = 'UNSUPPORTED_BACKEND',
	INVALID_PARAMETER = 'INVALID_PARAMETER',

	// Runtime errors
	WORKER_CRASHED = 'WORKER_CRASHED',
	UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Validation result for configuration
 */
export interface ValidationResult {
	field: string;
	valid: boolean;
	message?: string;
	suggestion?: string;
}

/**
 * Memory information
 */
export interface MemoryInfo {
	used: number;
	limit: number;
	available: number;
}

/**
 * Performance information
 */
export interface PerformanceInfo {
	averageProcessingTime: number;
	lastProcessingTime: number;
	successRate: number;
	processedCount: number;
}

// ============================================================================
// Type Guards
// ============================================================================

export function isMainToWorkerMessage(msg: unknown): msg is MainToWorkerMessage {
	return (
		typeof msg === 'object' &&
		msg !== null &&
		'type' in msg &&
		'id' in msg &&
		typeof (msg as any).type === 'string' &&
		typeof (msg as any).id === 'string'
	);
}

export function isWorkerToMainMessage(msg: unknown): msg is WorkerToMainMessage {
	return (
		typeof msg === 'object' &&
		msg !== null &&
		'type' in msg &&
		'id' in msg &&
		typeof (msg as any).type === 'string' &&
		typeof (msg as any).id === 'string'
	);
}

export function isProcessingCompleteMessage(
	msg: WorkerToMainMessage
): msg is ProcessingCompleteMessage {
	return msg.type === 'processing-complete';
}

export function isProcessingErrorMessage(msg: WorkerToMainMessage): msg is ProcessingErrorMessage {
	return msg.type === 'processing-error';
}

export function isProcessingProgressMessage(
	msg: WorkerToMainMessage
): msg is ProcessingProgressMessage {
	return msg.type === 'processing-progress';
}

// ============================================================================
// Message Factory Functions
// ============================================================================

export class MessageFactory {
	private static generateId(): string {
		return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	// Main to Worker messages
	static createInitializeMessage(
		options?: Partial<InitializeMessage['payload']>
	): InitializeMessage {
		return {
			type: 'initialize',
			id: this.generateId(),
			payload: {
				preferGpu: false,
				...options
			}
		};
	}

	static createProcessImageMessage(
		imageData: SerializedImageData,
		config: VectorizerConfiguration
	): ProcessImageMessage {
		return {
			type: 'process',
			id: this.generateId(),
			payload: { imageData, config }
		};
	}

	static createUpdateConfigMessage(config: Partial<VectorizerConfiguration>): UpdateConfigMessage {
		return {
			type: 'update-config',
			id: this.generateId(),
			payload: { config }
		};
	}

	// Worker to Main messages
	static createReadyMessage(id: string): ReadyMessage {
		return {
			type: 'ready',
			id,
			payload: { state: WorkerState.READY }
		};
	}

	static createProcessingProgressMessage(
		id: string,
		stage: ProcessingStage,
		percent: number,
		message: string
	): ProcessingProgressMessage {
		return {
			type: 'processing-progress',
			id,
			payload: { stage, percent, message }
		};
	}

	static createProcessingCompleteMessage(
		id: string,
		svg: string,
		stats: ProcessingStats,
		processingTime: number
	): ProcessingCompleteMessage {
		return {
			type: 'processing-complete',
			id,
			payload: { svg, stats, processingTime }
		};
	}

	static createProcessingErrorMessage(
		id: string,
		error: WorkerError,
		canRetry: boolean = false
	): ProcessingErrorMessage {
		return {
			type: 'processing-error',
			id,
			payload: { error, canRetry }
		};
	}
}
