/**
 * ProgressAggregator - Aggregates and manages progress updates from workers
 *
 * Provides smooth progress reporting with interpolation and
 * intelligent progress estimation for better UX.
 */

import type { ProcessingProgress } from '../types/service-types';
import { ProcessingStage } from '../types/worker-protocol';

/**
 * Progress tracking entry
 */
interface ProgressEntry {
	requestId: string;
	stage: ProcessingStage;
	percent: number;
	message: string;
	startTime: number;
	lastUpdate: number;
	estimatedTotal: number;
	callback?: (progress: ProcessingProgress) => void;
}

/**
 * Stage weights for progress calculation
 */
const STAGE_WEIGHTS: Record<ProcessingStage, number> = {
	[ProcessingStage.INITIALIZING]: 5,
	[ProcessingStage.PREPROCESSING]: 10,
	[ProcessingStage.EDGE_DETECTION]: 25,
	[ProcessingStage.PATH_TRACING]: 30,
	[ProcessingStage.PATH_OPTIMIZATION]: 15,
	[ProcessingStage.ARTISTIC_ENHANCEMENT]: 10,
	[ProcessingStage.SVG_GENERATION]: 4,
	[ProcessingStage.FINALIZING]: 1
};

/**
 * ProgressAggregator class
 */
export class ProgressAggregator {
	private trackedRequests: Map<string, ProgressEntry> = new Map();
	private updateInterval: NodeJS.Timeout | null = null;
	private historicalDurations: Map<ProcessingStage, number[]> = new Map();

	constructor() {
		// Initialize historical durations map
		for (const stage of Object.values(ProcessingStage)) {
			this.historicalDurations.set(stage, []);
		}

		// Start update interval for smooth progress
		this.startUpdateInterval();
	}

	/**
	 * Start tracking a request
	 */
	trackRequest(requestId: string, callback?: (progress: ProcessingProgress) => void): void {
		const entry: ProgressEntry = {
			requestId,
			stage: ProcessingStage.INITIALIZING,
			percent: 0,
			message: 'Starting...',
			startTime: Date.now(),
			lastUpdate: Date.now(),
			estimatedTotal: this.estimateTotalTime(),
			callback
		};

		this.trackedRequests.set(requestId, entry);

		// Send initial progress
		if (callback) {
			callback({
				stage: entry.stage,
				percent: 0,
				message: entry.message,
				estimatedTimeRemaining: entry.estimatedTotal
			});
		}
	}

	/**
	 * Update progress for a request
	 */
	updateProgress(
		requestId: string,
		stage: ProcessingStage,
		percent: number,
		message: string
	): void {
		const entry = this.trackedRequests.get(requestId);
		if (!entry) {
			return;
		}

		// Record stage transition
		if (entry.stage !== stage) {
			this.recordStageDuration(entry.stage, Date.now() - entry.lastUpdate);
			entry.lastUpdate = Date.now();
		}

		// Update entry
		entry.stage = stage;
		entry.percent = Math.min(100, Math.max(0, percent));
		entry.message = message;

		// Calculate overall progress
		const overallProgress = this.calculateOverallProgress(stage, percent);

		// Estimate remaining time
		const elapsed = Date.now() - entry.startTime;
		const estimatedRemaining = this.estimateRemainingTime(overallProgress, elapsed);

		// Send progress update
		if (entry.callback) {
			entry.callback({
				stage,
				percent: overallProgress,
				message,
				estimatedTimeRemaining: estimatedRemaining
			});
		}
	}

	/**
	 * Stop tracking a request
	 */
	stopTracking(requestId: string): void {
		const entry = this.trackedRequests.get(requestId);
		if (entry) {
			// Record final duration
			const totalDuration = Date.now() - entry.startTime;
			this.recordTotalDuration(totalDuration);

			// Send final progress
			if (entry.callback) {
				entry.callback({
					stage: ProcessingStage.FINALIZING,
					percent: 100,
					message: 'Complete',
					estimatedTimeRemaining: 0
				});
			}

			this.trackedRequests.delete(requestId);
		}
	}

	/**
	 * Get aggregated progress for all tracked requests
	 */
	getAggregatedProgress(): ProcessingProgress {
		if (this.trackedRequests.size === 0) {
			return {
				stage: ProcessingStage.INITIALIZING,
				percent: 0,
				message: 'No active processing'
			};
		}

		// Calculate average progress
		let totalProgress = 0;
		let latestStage = ProcessingStage.INITIALIZING;
		let combinedMessage = '';

		for (const entry of this.trackedRequests.values()) {
			const overallProgress = this.calculateOverallProgress(entry.stage, entry.percent);
			totalProgress += overallProgress;

			// Track the most advanced stage
			if (this.getStageOrder(entry.stage) > this.getStageOrder(latestStage)) {
				latestStage = entry.stage;
				combinedMessage = entry.message;
			}
		}

		const averageProgress = totalProgress / this.trackedRequests.size;

		return {
			stage: latestStage,
			percent: averageProgress,
			message: `Processing ${this.trackedRequests.size} item(s): ${combinedMessage}`
		};
	}

	/**
	 * Clear all tracked requests
	 */
	clear(): void {
		this.trackedRequests.clear();
	}

	/**
	 * Cleanup when shutting down
	 */
	cleanup(): void {
		if (this.updateInterval) {
			clearInterval(this.updateInterval);
			this.updateInterval = null;
		}
		this.clear();
	}

	// Private helper methods

	private startUpdateInterval(): void {
		// Update progress smoothly every 100ms
		this.updateInterval = setInterval(() => {
			this.interpolateProgress();
		}, 100);
	}

	private interpolateProgress(): void {
		// Smooth progress updates for better UX
		for (const entry of this.trackedRequests.values()) {
			if (entry.percent < 100) {
				// Increment progress slightly for smooth animation
				const increment = 0.5; // 0.5% per 100ms
				const newPercent = Math.min(entry.percent + increment, 99);

				if (entry.callback) {
					const overallProgress = this.calculateOverallProgress(entry.stage, newPercent);
					const elapsed = Date.now() - entry.startTime;
					const estimatedRemaining = this.estimateRemainingTime(overallProgress, elapsed);

					entry.callback({
						stage: entry.stage,
						percent: overallProgress,
						message: entry.message,
						estimatedTimeRemaining: estimatedRemaining
					});
				}
			}
		}
	}

	private calculateOverallProgress(stage: ProcessingStage, stagePercent: number): number {
		const stages = Object.values(ProcessingStage);
		const currentStageIndex = stages.indexOf(stage);

		if (currentStageIndex === -1) {
			return 0;
		}

		// Calculate cumulative weight up to current stage
		let completedWeight = 0;
		for (let i = 0; i < currentStageIndex; i++) {
			completedWeight += STAGE_WEIGHTS[stages[i]] || 0;
		}

		// Add current stage progress
		const currentStageWeight = STAGE_WEIGHTS[stage] || 0;
		const currentProgress = (stagePercent / 100) * currentStageWeight;

		// Calculate total weight
		const totalWeight = Object.values(STAGE_WEIGHTS).reduce((sum, w) => sum + w, 0);

		// Return overall percentage
		return ((completedWeight + currentProgress) / totalWeight) * 100;
	}

	private getStageOrder(stage: ProcessingStage): number {
		const stages = Object.values(ProcessingStage);
		return stages.indexOf(stage);
	}

	private estimateRemainingTime(progressPercent: number, elapsedTime: number): number {
		if (progressPercent <= 0) {
			return this.estimateTotalTime();
		}

		if (progressPercent >= 100) {
			return 0;
		}

		// Estimate based on current progress
		const estimatedTotal = (elapsedTime / progressPercent) * 100;
		const remaining = estimatedTotal - elapsedTime;

		// Apply smoothing based on historical data
		const historicalEstimate = this.estimateTotalTime();
		const weight = Math.min(progressPercent / 50, 1); // Trust current estimate more as progress increases

		return Math.max(0, remaining * weight + historicalEstimate * (1 - weight));
	}

	private estimateTotalTime(): number {
		// Use historical data to estimate total processing time
		const recentDurations = this.getRecentTotalDurations();

		if (recentDurations.length === 0) {
			return 30000; // Default 30 seconds
		}

		// Calculate average of recent durations
		const average = recentDurations.reduce((sum, d) => sum + d, 0) / recentDurations.length;

		// Add 10% buffer
		return average * 1.1;
	}

	private recordStageDuration(stage: ProcessingStage, duration: number): void {
		const durations = this.historicalDurations.get(stage) || [];
		durations.push(duration);

		// Keep only last 20 durations
		if (durations.length > 20) {
			durations.shift();
		}

		this.historicalDurations.set(stage, durations);
	}

	private recordTotalDuration(duration: number): void {
		// Store in a special "total" entry
		const totals = this.historicalDurations.get('total' as ProcessingStage) || [];
		totals.push(duration);

		if (totals.length > 20) {
			totals.shift();
		}

		this.historicalDurations.set('total' as ProcessingStage, totals);
	}

	private getRecentTotalDurations(): number[] {
		return this.historicalDurations.get('total' as ProcessingStage) || [];
	}
}
