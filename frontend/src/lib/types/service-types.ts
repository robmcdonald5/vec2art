/**
 * Service Layer Type Definitions
 *
 * Types specific to the service layer abstraction,
 * providing clean interfaces for service components.
 */

import type { ProcessingStats } from './worker-protocol';

/**
 * Processing result from vectorization
 */
export interface ProcessingResult {
	svg: string;
	stats: ProcessingStats;
	processingTime: number;
}

/**
 * Options for processing requests
 */
export interface ProcessingOptions {
	priority?: number;
	timeout?: number;
	retryAttempts?: number;
	retryDelay?: number;
	onProgress?: (progress: ProcessingProgress) => void;
}

/**
 * Processing progress information
 */
export interface ProcessingProgress {
	stage: string;
	percent: number;
	message: string;
	estimatedTimeRemaining?: number;
}

/**
 * Queue item for processing
 */
export interface QueueItem {
	id: string;
	imageData: any;
	config: any;
	options: ProcessingOptions;
	priority: number;
	timestamp?: number;
}

/**
 * Worker pool configuration
 */
export interface WorkerPoolConfig {
	maxWorkers: number;
	workerPath: string;
	initTimeout?: number;
	healthCheckInterval?: number;
}

/**
 * Worker instance wrapper
 */
export interface WorkerInstance {
	id: string;
	worker: Worker;
	state: 'idle' | 'busy' | 'error';
	lastUsed: number;
	processedCount: number;
}

/**
 * Processing queue configuration
 */
export interface ProcessingQueueConfig {
	maxConcurrent: number;
	maxSize?: number;
	timeout?: number;
	retryAttempts?: number;
	retryDelay?: number;
	enablePriority?: boolean;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
	enabled?: boolean;
	maxSize: number;
	maxAge?: number;
	ttl?: number;
	storage?: 'memory' | 'indexeddb';
}

/**
 * Cache entry
 */
export interface CacheEntry {
	key: string;
	result: ProcessingResult;
	timestamp: number;
	size: number;
	hits: number;
}

/**
 * Re-export VectorizerCapabilities for convenience
 */
export type { WorkerCapabilities as VectorizerCapabilities } from './worker-protocol';
