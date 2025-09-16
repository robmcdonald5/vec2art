/**
 * Processing System Types
 *
 * Shared type definitions for the processing queue system to avoid circular dependencies.
 */

import type { AlgorithmConfig } from './algorithm-configs';

export interface ProcessingJob {
	id: string;
	imageData: ImageData | ArrayBuffer;
	config: AlgorithmConfig;
	priority: 'low' | 'normal' | 'high';
	status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
	progress?: number;
	result?: {
		svg: string;
		metadata?: any;
		processingTime?: number;
	};
	error?: Error;
	createdAt: number;
	startedAt?: number;
	completedAt?: number;
	retryCount?: number;
}

export interface ProcessingQueueState {
	queuedJobs: ProcessingJob[];
	activeJobs: Map<string, ProcessingJob>;
	completedJobs: Map<string, ProcessingJob>;
	failedJobs: Map<string, ProcessingJob>;
	isProcessing: boolean;
}

export interface ProcessingStats {
	queueLength: number;
	activeJobs: number;
	completedJobs: number;
	failedJobs: number;
	totalProcessed: number;
	averageProcessingTime: number;
}
