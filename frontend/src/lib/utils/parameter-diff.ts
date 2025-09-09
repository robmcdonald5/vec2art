/**
 * Parameter Diff System
 *
 * Efficient parameter change detection and incremental validation.
 * Tracks only modified parameters to minimize validation overhead.
 */

import type { VectorizerConfig } from '$lib/types/vectorizer';

export interface ParameterDelta {
	changed: Set<string>;
	previous: Partial<VectorizerConfig>;
	current: Partial<VectorizerConfig>;
	timestamp: number;
	changeCount: number;
}

export interface ParameterChangeEntry {
	field: string;
	previousValue: any;
	currentValue: any;
	timestamp: number;
}

/**
 * High-performance parameter diff calculator
 */
export class ParameterDiffer {
	private lastConfig: Partial<VectorizerConfig> = {};
	private lastHash: string = '';
	private changeHistory: ParameterChangeEntry[] = [];
	private readonly maxHistorySize: number;

	constructor(maxHistorySize = 100) {
		this.maxHistorySize = maxHistorySize;
	}

	/**
	 * Calculate parameter delta between current and previous state
	 */
	calculateDelta(current: Partial<VectorizerConfig>): ParameterDelta {
		const changed = new Set<string>();
		const timestamp = Date.now();

		// Compare each parameter
		for (const [key, currentValue] of Object.entries(current)) {
			const previousValue = this.lastConfig[key as keyof VectorizerConfig];

			if (!this.deepEqual(currentValue, previousValue)) {
				changed.add(key);

				// Track change history
				this.addToHistory({
					field: key,
					previousValue,
					currentValue,
					timestamp
				});
			}
		}

		// Check for removed parameters
		for (const key of Object.keys(this.lastConfig)) {
			if (!(key in current)) {
				changed.add(key);

				this.addToHistory({
					field: key,
					previousValue: this.lastConfig[key as keyof VectorizerConfig],
					currentValue: undefined,
					timestamp
				});
			}
		}

		const delta: ParameterDelta = {
			changed,
			previous: { ...this.lastConfig },
			current: { ...current },
			timestamp,
			changeCount: changed.size
		};

		// Update internal state
		this.lastConfig = { ...current };

		return delta;
	}

	/**
	 * Get only the changed parameters from a delta
	 */
	getChangedParameters(delta: ParameterDelta): Partial<VectorizerConfig> {
		const changed: Partial<VectorizerConfig> = {};

		for (const field of delta.changed) {
			if (field in delta.current) {
				(changed as any)[field] = (delta.current as any)[field];
			}
		}

		return changed;
	}

	/**
	 * Check if any critical parameters have changed
	 */
	hasCriticalChanges(delta: ParameterDelta, criticalFields: string[]): boolean {
		return criticalFields.some((field) => delta.changed.has(field));
	}

	/**
	 * Get parameters that need revalidation
	 */
	getParametersNeedingValidation(delta: ParameterDelta): string[] {
		// Parameters that affect validation logic
		const validationAffecting = new Set([
			'backend',
			'detail',
			'stroke_width',
			'variable_weights',
			'tremor_strength',
			'tapering',
			'noise_filtering',
			'noise_filter_spatial_sigma',
			'noise_filter_range_sigma'
		]);

		return Array.from(delta.changed).filter((field) => validationAffecting.has(field));
	}

	/**
	 * Create parameter patch for efficient updates
	 */
	createParameterPatch(delta: ParameterDelta): ParameterPatch {
		const patch: ParameterPatch = {
			version: delta.timestamp,
			changes: [],
			removals: []
		};

		for (const field of delta.changed) {
			const currentValue = (delta.current as any)[field];
			const previousValue = (delta.previous as any)[field];

			if (currentValue !== undefined) {
				patch.changes.push({
					field,
					value: currentValue,
					previousValue
				});
			} else {
				patch.removals.push({
					field,
					previousValue
				});
			}
		}

		return patch;
	}

	/**
	 * Apply parameter patch to configuration
	 */
	applyPatch(config: Partial<VectorizerConfig>, patch: ParameterPatch): Partial<VectorizerConfig> {
		const result = { ...config };

		// Apply changes
		for (const change of patch.changes) {
			(result as any)[change.field] = change.value;
		}

		// Apply removals
		for (const removal of patch.removals) {
			delete (result as any)[removal.field];
		}

		return result;
	}

	/**
	 * Get recent parameter change history
	 */
	getChangeHistory(limit = 10): ParameterChangeEntry[] {
		return this.changeHistory.slice(-limit);
	}

	/**
	 * Get change frequency for a parameter
	 */
	getChangeFrequency(field: string, timeWindowMs = 60000): number {
		const now = Date.now();
		const windowStart = now - timeWindowMs;

		return this.changeHistory.filter(
			(entry) => entry.field === field && entry.timestamp >= windowStart
		).length;
	}

	/**
	 * Check if parameter changes are stabilizing (good time to validate)
	 */
	areChangesStabilizing(stabilityWindowMs = 1000): boolean {
		const now = Date.now();
		const recentChanges = this.changeHistory.filter(
			(entry) => now - entry.timestamp <= stabilityWindowMs
		);

		return recentChanges.length === 0;
	}

	/**
	 * Reset differ state
	 */
	reset(): void {
		this.lastConfig = {};
		this.lastHash = '';
		this.changeHistory = [];
	}

	/**
	 * Deep equality check for parameter values
	 */
	private deepEqual(a: any, b: any): boolean {
		if (a === b) return true;

		if (a == null || b == null) return a === b;

		if (typeof a !== typeof b) return false;

		if (typeof a === 'object') {
			const keysA = Object.keys(a);
			const keysB = Object.keys(b);

			if (keysA.length !== keysB.length) return false;

			return keysA.every((key) => this.deepEqual(a[key], b[key]));
		}

		return false;
	}

	/**
	 * Add entry to change history with size management
	 */
	private addToHistory(entry: ParameterChangeEntry): void {
		this.changeHistory.push(entry);

		if (this.changeHistory.length > this.maxHistorySize) {
			this.changeHistory.shift();
		}
	}
}

export interface ParameterPatch {
	version: number;
	changes: Array<{
		field: string;
		value: any;
		previousValue?: any;
	}>;
	removals: Array<{
		field: string;
		previousValue?: any;
	}>;
}

/**
 * Optimized parameter update manager
 */
export class ParameterUpdateManager {
	private differ = new ParameterDiffer();
	private updateQueue: Array<() => void> = [];
	private isProcessingQueue = false;
	private batchTimeoutId: number | null = null;

	/**
	 * Queue parameter update with batching
	 */
	queueUpdate(
		config: Partial<VectorizerConfig>,
		callback: (delta: ParameterDelta) => void,
		priority: 'immediate' | 'batched' = 'batched'
	): void {
		const updateFn = () => {
			const delta = this.differ.calculateDelta(config);
			if (delta.changeCount > 0) {
				callback(delta);
			}
		};

		if (priority === 'immediate') {
			updateFn();
			return;
		}

		// Batch updates
		this.updateQueue.push(updateFn);

		if (this.batchTimeoutId !== null) {
			clearTimeout(this.batchTimeoutId);
		}

		this.batchTimeoutId = window.setTimeout(() => {
			this.processUpdateQueue();
		}, 50); // 50ms batch window
	}

	/**
	 * Process queued updates
	 */
	private async processUpdateQueue(): Promise<void> {
		if (this.isProcessingQueue || this.updateQueue.length === 0) {
			return;
		}

		this.isProcessingQueue = true;

		try {
			// Process all queued updates
			while (this.updateQueue.length > 0) {
				const update = this.updateQueue.shift();
				if (update) {
					update();
				}
			}
		} finally {
			this.isProcessingQueue = false;
			this.batchTimeoutId = null;
		}
	}

	/**
	 * Get parameter update statistics
	 */
	getStats() {
		return {
			queueLength: this.updateQueue.length,
			isProcessing: this.isProcessingQueue,
			changeHistory: this.differ.getChangeHistory(),
			recentChangeCount: this.differ.getChangeHistory(5).length
		};
	}
}

// Global parameter update manager instance
export const globalParameterUpdateManager = new ParameterUpdateManager();
