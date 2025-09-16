/**
 * Smart Batching System
 *
 * Optimizes processing queue throughput by intelligently grouping compatible jobs
 * for batch processing, reducing WASM call overhead and improving performance.
 */

import type { ProcessingJob } from '$lib/types/processing';
import type { AlgorithmConfig } from '$lib/types/algorithm-configs';

export interface ProcessingBatch {
	id: string;
	jobs: ProcessingJob[];
	estimatedProcessingTime: number;
	priority: 'low' | 'normal' | 'high';
	compatibility: BatchCompatibility;
	batchSize: number;
	created: number;
}

export interface BatchCompatibility {
	backend: string;
	similarImageSizes: boolean;
	compatibleParameters: boolean;
	samePriority: boolean;
	score: number; // 0-1, higher is more compatible
}

export interface BatchOptimizerConfig {
	maxBatchSize: number;
	minBatchSize: number;
	compatibilityThreshold: number;
	batchTimeout: number; // ms to wait for more jobs
	maxWaitTime: number; // maximum time to hold a job
}

/**
 * Intelligent batch processor for optimizing job throughput
 */
export class BatchOptimizer {
	private config: BatchOptimizerConfig;
	private pendingBatches = new Map<string, ProcessingBatch>();
	private batchCounter = 0;

	constructor(config?: Partial<BatchOptimizerConfig>) {
		this.config = {
			maxBatchSize: 8,
			minBatchSize: 2,
			compatibilityThreshold: 0.7,
			batchTimeout: 200, // 200ms
			maxWaitTime: 2000, // 2s max wait
			...config
		};
	}

	/**
	 * Add job to batch optimization queue
	 */
	addJob(job: ProcessingJob): ProcessingBatch | null {
		// Find compatible existing batch
		const compatibleBatch = this.findCompatibleBatch(job);

		if (compatibleBatch && compatibleBatch.jobs.length < this.config.maxBatchSize) {
			// Add to existing batch
			compatibleBatch.jobs.push(job);
			compatibleBatch.batchSize = compatibleBatch.jobs.length;
			compatibleBatch.estimatedProcessingTime = this.calculateBatchProcessingTime(compatibleBatch);

			// Check if batch is ready for processing
			if (this.isBatchReady(compatibleBatch)) {
				this.pendingBatches.delete(compatibleBatch.id);
				return compatibleBatch;
			}

			return null; // Batch not ready yet
		}

		// Create new batch
		const newBatch = this.createBatch([job]);

		// Check if job should be processed immediately (high priority or large image)
		if (this.shouldProcessImmediately(job)) {
			return newBatch;
		}

		// Add to pending batches
		this.pendingBatches.set(newBatch.id, newBatch);

		// Set timeout to process batch if no more compatible jobs arrive
		setTimeout(() => {
			const batch = this.pendingBatches.get(newBatch.id);
			if (batch) {
				this.pendingBatches.delete(newBatch.id);
				// Process batch even if not full
			}
		}, this.config.batchTimeout);

		return null;
	}

	/**
	 * Get ready batches that have been waiting too long
	 */
	getTimedOutBatches(): ProcessingBatch[] {
		const now = Date.now();
		const timedOut: ProcessingBatch[] = [];

		for (const [batchId, batch] of this.pendingBatches.entries()) {
			if (now - batch.created > this.config.maxWaitTime) {
				timedOut.push(batch);
				this.pendingBatches.delete(batchId);
			}
		}

		return timedOut;
	}

	/**
	 * Force process all pending batches
	 */
	flushPendingBatches(): ProcessingBatch[] {
		const batches = Array.from(this.pendingBatches.values());
		this.pendingBatches.clear();
		return batches;
	}

	/**
	 * Find compatible existing batch for a job
	 */
	private findCompatibleBatch(job: ProcessingJob): ProcessingBatch | null {
		let bestBatch: ProcessingBatch | null = null;
		let bestCompatibility = 0;

		for (const batch of this.pendingBatches.values()) {
			const compatibility = this.calculateCompatibility(job, batch.jobs[0]);

			if (
				compatibility.score > bestCompatibility &&
				compatibility.score >= this.config.compatibilityThreshold
			) {
				bestCompatibility = compatibility.score;
				bestBatch = batch;
			}
		}

		return bestBatch;
	}

	/**
	 * Calculate compatibility between two jobs
	 */
	private calculateCompatibility(job1: ProcessingJob, job2: ProcessingJob): BatchCompatibility {
		const config1 = job1.config;
		const config2 = job2.config;

		// Backend compatibility (required)
		const sameBackend = config1.algorithm === config2.algorithm;
		if (!sameBackend) {
			return {
				backend: 'incompatible',
				similarImageSizes: false,
				compatibleParameters: false,
				samePriority: false,
				score: 0
			};
		}

		// Image size similarity
		const size1 = this.getImageSize(job1.imageData);
		const size2 = this.getImageSize(job2.imageData);
		const sizeRatio = Math.min(size1, size2) / Math.max(size1, size2);
		const similarImageSizes = sizeRatio > 0.5; // Within 2x size difference

		// Parameter compatibility
		const parameterCompatibility = this.calculateParameterCompatibility(config1, config2);

		// Priority matching
		const samePriority = job1.priority === job2.priority;

		// Calculate overall compatibility score
		let score = 0;
		score += sameBackend ? 0.4 : 0; // Backend match is critical
		score += similarImageSizes ? 0.3 : 0;
		score += parameterCompatibility * 0.2;
		score += samePriority ? 0.1 : 0;

		return {
			backend: config1.algorithm,
			similarImageSizes,
			compatibleParameters: parameterCompatibility > 0.7,
			samePriority,
			score
		};
	}

	/**
	 * Calculate parameter compatibility score
	 */
	private calculateParameterCompatibility(
		config1: AlgorithmConfig,
		config2: AlgorithmConfig
	): number {
		const criticalParams = [
			'detail',
			'strokeWidth',
			'preserveColors',
			'handDrawnPreset',
			'variableWeights',
			'tremorStrength',
			'tapering'
		];

		let matchCount = 0;
		let totalParams = 0;

		for (const param of criticalParams) {
			const value1 = (config1 as any)[param];
			const value2 = (config2 as any)[param];

			if (value1 !== undefined && value2 !== undefined) {
				totalParams++;

				if (typeof value1 === 'number' && typeof value2 === 'number') {
					// For numeric parameters, allow small differences
					const diff = Math.abs(value1 - value2);
					const avg = (value1 + value2) / 2;
					const percentDiff = avg > 0 ? diff / avg : 0;

					if (percentDiff < 0.1) {
						// Within 10%
						matchCount++;
					}
				} else if (value1 === value2) {
					matchCount++;
				}
			}
		}

		return totalParams > 0 ? matchCount / totalParams : 1;
	}

	/**
	 * Create new batch from jobs
	 */
	private createBatch(jobs: ProcessingJob[]): ProcessingBatch {
		const batchId = `batch_${++this.batchCounter}_${Date.now()}`;
		const compatibility =
			jobs.length > 1
				? this.calculateCompatibility(jobs[0], jobs[1])
				: {
						backend: jobs[0].config.algorithm,
						similarImageSizes: true,
						compatibleParameters: true,
						samePriority: true,
						score: 1.0
					};

		const batch: ProcessingBatch = {
			id: batchId,
			jobs: [...jobs],
			estimatedProcessingTime: this.calculateBatchProcessingTime({ jobs } as ProcessingBatch),
			priority: this.calculateBatchPriority(jobs),
			compatibility,
			batchSize: jobs.length,
			created: Date.now()
		};

		return batch;
	}

	/**
	 * Calculate estimated processing time for batch
	 */
	private calculateBatchProcessingTime(batch: ProcessingBatch): number {
		// Base processing time per job
		let totalTime = 0;

		for (const job of batch.jobs) {
			const imageSize = this.getImageSize(job.imageData);
			const baseTime = this.estimateJobProcessingTime(job, imageSize);
			totalTime += baseTime;
		}

		// Batch processing efficiency bonus
		const batchEfficiency = Math.min(0.3, 0.05 * batch.jobs.length); // Up to 30% improvement
		const optimizedTime = totalTime * (1 - batchEfficiency);

		return Math.max(optimizedTime, totalTime * 0.5); // At least 50% of original time
	}

	/**
	 * Estimate processing time for individual job
	 */
	private estimateJobProcessingTime(job: ProcessingJob, imageSize: number): number {
		const baseTime = 1000; // Base 1 second
		const sizeMultiplier = Math.sqrt(imageSize / 1000000); // Scale with image size
		const complexityMultiplier = this.getComplexityMultiplier(job.config);

		return baseTime * sizeMultiplier * complexityMultiplier;
	}

	/**
	 * Get complexity multiplier based on configuration
	 */
	private getComplexityMultiplier(config: AlgorithmConfig): number {
		let multiplier = 1.0;

		// Detail level affects processing time
		if (config.detail !== undefined) {
			multiplier *= 0.5 + config.detail * 1.5; // 0.5x to 2x
		}

		// Hand-drawn effects add complexity (edge-specific)
		if (config.algorithm === 'edge') {
			const edgeConfig = config as any;
			if (edgeConfig.variableWeights && edgeConfig.variableWeights > 0) {
				multiplier *= 1 + edgeConfig.variableWeights * 0.3;
			}
			if (edgeConfig.tremorStrength && edgeConfig.tremorStrength > 0) {
				multiplier *= 1 + edgeConfig.tremorStrength * 0.2;
			}
			// Noise filtering adds time
			if (edgeConfig.noiseFiltering) {
				multiplier *= 1.2;
			}
		}

		// Backend-specific multipliers
		switch (config.algorithm) {
			case 'edge':
				multiplier *= 1.0; // Base
				break;
			case 'centerline':
				multiplier *= 1.2;
				break;
			case 'superpixel':
				multiplier *= 1.4;
				break;
			case 'dots':
				multiplier *= 0.8;
				break;
		}

		return multiplier;
	}

	/**
	 * Calculate batch priority based on job priorities
	 */
	private calculateBatchPriority(jobs: ProcessingJob[]): 'low' | 'normal' | 'high' {
		const priorities = jobs.map((job) => job.priority);

		// If any job is high priority, batch is high priority
		if (priorities.includes('high')) return 'high';

		// If majority are normal priority, batch is normal
		const normalCount = priorities.filter((p) => p === 'normal').length;
		if (normalCount > jobs.length / 2) return 'normal';

		return 'low';
	}

	/**
	 * Check if batch is ready for processing
	 */
	private isBatchReady(batch: ProcessingBatch): boolean {
		// Process immediately if:
		// 1. Batch is at max size
		// 2. High priority batch with 2+ jobs
		// 3. Batch has been waiting too long

		if (batch.jobs.length >= this.config.maxBatchSize) return true;

		if (batch.priority === 'high' && batch.jobs.length >= 2) return true;

		const age = Date.now() - batch.created;
		if (age > this.config.maxWaitTime) return true;

		return false;
	}

	/**
	 * Check if job should be processed immediately (no batching)
	 */
	private shouldProcessImmediately(job: ProcessingJob): boolean {
		// Process immediately for:
		// 1. Very large images (>4MP)
		// 2. High priority with complex parameters
		// 3. Jobs that don't benefit from batching

		const imageSize = this.getImageSize(job.imageData);
		if (imageSize > 4000000) return true; // >4MP

		if (job.priority === 'high' && this.getComplexityMultiplier(job.config) > 1.5) {
			return true;
		}

		return false;
	}

	/**
	 * Get image size (width * height)
	 */
	private getImageSize(imageData: ImageData | ArrayBuffer): number {
		if (imageData instanceof ImageData) {
			return imageData.width * imageData.height;
		}

		// For ArrayBuffer, estimate based on byte size (assuming RGBA)
		return imageData.byteLength / 4;
	}

	/**
	 * Get optimizer statistics
	 */
	getStats() {
		return {
			pendingBatches: this.pendingBatches.size,
			totalBatchesCreated: this.batchCounter,
			config: this.config,
			averageBatchSize:
				this.pendingBatches.size > 0
					? Array.from(this.pendingBatches.values()).reduce(
							(sum, batch) => sum + batch.jobs.length,
							0
						) / this.pendingBatches.size
					: 0
		};
	}
}
