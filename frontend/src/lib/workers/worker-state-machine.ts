/**
 * Worker State Machine
 *
 * Manages the lifecycle and state transitions of the WASM worker,
 * ensuring proper state management and error recovery.
 */

import { WorkerState, ErrorCode, ProcessingStage } from '../types/worker-protocol';
import type { WorkerToMainMessage, WorkerError } from '../types/worker-protocol';

/**
 * State transition rules
 */
const STATE_TRANSITIONS: Record<WorkerState, WorkerState[]> = {
	[WorkerState.INITIALIZING]: [WorkerState.READY, WorkerState.ERROR],
	[WorkerState.READY]: [WorkerState.PROCESSING, WorkerState.ERROR, WorkerState.TERMINATING],
	[WorkerState.PROCESSING]: [WorkerState.IDLE, WorkerState.ERROR],
	[WorkerState.IDLE]: [WorkerState.READY, WorkerState.PROCESSING, WorkerState.TERMINATING],
	[WorkerState.ERROR]: [WorkerState.INITIALIZING, WorkerState.TERMINATING],
	[WorkerState.TERMINATING]: []
};

/**
 * State machine for managing worker lifecycle
 */
export class WorkerStateMachine {
	private currentState: WorkerState = WorkerState.INITIALIZING;
	private stateHistory: Array<{ state: WorkerState; timestamp: number }> = [];
	private errorCount = 0;
	private readonly maxErrors = 3;
	private listeners = new Map<string, Set<(state: WorkerState) => void>>();

	constructor() {
		this.recordStateChange(WorkerState.INITIALIZING);
	}

	/**
	 * Get current state
	 */
	getState(): WorkerState {
		return this.currentState;
	}

	/**
	 * Check if a state transition is valid
	 */
	canTransitionTo(newState: WorkerState): boolean {
		const allowedTransitions = STATE_TRANSITIONS[this.currentState] || [];
		return allowedTransitions.includes(newState);
	}

	/**
	 * Transition to a new state
	 */
	transitionTo(newState: WorkerState): boolean {
		if (!this.canTransitionTo(newState)) {
			console.warn(
				`[WorkerStateMachine] Invalid transition from ${this.currentState} to ${newState}`
			);
			return false;
		}

		const previousState = this.currentState;
		this.currentState = newState;
		this.recordStateChange(newState);

		// Reset error count when successfully transitioning to READY
		if (newState === WorkerState.READY) {
			this.errorCount = 0;
		}

		// Increment error count when transitioning to ERROR
		if (newState === WorkerState.ERROR) {
			this.errorCount++;
		}

		console.log(`[WorkerStateMachine] Transitioned from ${previousState} to ${newState}`);

		// Notify listeners
		this.notifyListeners(newState);

		return true;
	}

	/**
	 * Handle incoming message and update state accordingly
	 */
	handleMessage(message: WorkerToMainMessage): void {
		switch (message.type) {
			case 'initialized':
				if (message.payload.success) {
					this.transitionTo(WorkerState.READY);
				} else {
					this.transitionTo(WorkerState.ERROR);
				}
				break;

			case 'ready':
				this.transitionTo(WorkerState.READY);
				break;

			case 'processing-started':
				this.transitionTo(WorkerState.PROCESSING);
				break;

			case 'processing-complete':
				this.transitionTo(WorkerState.IDLE);
				// Auto-transition to READY after a short delay
				setTimeout(() => {
					if (this.currentState === WorkerState.IDLE) {
						this.transitionTo(WorkerState.READY);
					}
				}, 100);
				break;

			case 'processing-error':
			case 'worker-error':
				this.transitionTo(WorkerState.ERROR);
				break;

			case 'terminated':
				this.transitionTo(WorkerState.TERMINATING);
				break;
		}
	}

	/**
	 * Check if worker needs restart due to errors
	 */
	shouldRestart(): boolean {
		return this.currentState === WorkerState.ERROR && this.errorCount >= this.maxErrors;
	}

	/**
	 * Reset the state machine
	 */
	reset(): void {
		this.currentState = WorkerState.INITIALIZING;
		this.errorCount = 0;
		this.stateHistory = [];
		this.recordStateChange(WorkerState.INITIALIZING);
	}

	/**
	 * Add state change listener
	 */
	onStateChange(id: string, callback: (state: WorkerState) => void): void {
		if (!this.listeners.has(id)) {
			this.listeners.set(id, new Set());
		}
		this.listeners.get(id)!.add(callback);
	}

	/**
	 * Remove state change listener
	 */
	removeListener(id: string, callback?: (state: WorkerState) => void): void {
		if (!callback) {
			this.listeners.delete(id);
		} else {
			this.listeners.get(id)?.delete(callback);
		}
	}

	/**
	 * Get state history
	 */
	getHistory(): Array<{ state: WorkerState; timestamp: number }> {
		return [...this.stateHistory];
	}

	/**
	 * Get error count
	 */
	getErrorCount(): number {
		return this.errorCount;
	}

	/**
	 * Check if worker is in a healthy state
	 */
	isHealthy(): boolean {
		return (
			this.currentState === WorkerState.READY ||
			this.currentState === WorkerState.PROCESSING ||
			this.currentState === WorkerState.IDLE
		);
	}

	/**
	 * Check if worker is busy
	 */
	isBusy(): boolean {
		return this.currentState === WorkerState.PROCESSING;
	}

	/**
	 * Check if worker is ready to process
	 */
	isReady(): boolean {
		return this.currentState === WorkerState.READY;
	}

	private recordStateChange(state: WorkerState): void {
		this.stateHistory.push({
			state,
			timestamp: Date.now()
		});

		// Keep only last 50 state changes
		if (this.stateHistory.length > 50) {
			this.stateHistory = this.stateHistory.slice(-50);
		}
	}

	private notifyListeners(state: WorkerState): void {
		this.listeners.forEach((callbacks) => {
			callbacks.forEach((callback) => {
				try {
					callback(state);
				} catch (error) {
					console.error('[WorkerStateMachine] Listener error:', error);
				}
			});
		});
	}
}

/**
 * Processing progress tracker
 */
export class ProcessingProgressTracker {
	private stages: Map<ProcessingStage, { start: number; end?: number }> = new Map();
	private currentStage: ProcessingStage | null = null;
	private startTime: number = 0;

	/**
	 * Start tracking a new processing session
	 */
	start(): void {
		this.stages.clear();
		this.currentStage = null;
		this.startTime = Date.now();
	}

	/**
	 * Enter a new processing stage
	 */
	enterStage(stage: ProcessingStage): void {
		// End previous stage if exists
		if (this.currentStage && this.stages.has(this.currentStage)) {
			const stageData = this.stages.get(this.currentStage)!;
			if (!stageData.end) {
				stageData.end = Date.now();
			}
		}

		// Start new stage
		this.currentStage = stage;
		this.stages.set(stage, { start: Date.now() });
	}

	/**
	 * Complete current stage
	 */
	completeStage(): void {
		if (this.currentStage && this.stages.has(this.currentStage)) {
			const stageData = this.stages.get(this.currentStage)!;
			stageData.end = Date.now();
		}
	}

	/**
	 * Get progress percentage based on typical stage durations
	 */
	getProgress(): number {
		if (!this.currentStage) return 0;

		// Typical stage weights (percentages)
		const stageWeights: Record<ProcessingStage, number> = {
			[ProcessingStage.INITIALIZING]: 5,
			[ProcessingStage.PREPROCESSING]: 10,
			[ProcessingStage.EDGE_DETECTION]: 25,
			[ProcessingStage.PATH_TRACING]: 30,
			[ProcessingStage.PATH_OPTIMIZATION]: 15,
			[ProcessingStage.ARTISTIC_ENHANCEMENT]: 10,
			[ProcessingStage.SVG_GENERATION]: 4,
			[ProcessingStage.FINALIZING]: 1
		};

		const stageOrder = [
			ProcessingStage.INITIALIZING,
			ProcessingStage.PREPROCESSING,
			ProcessingStage.EDGE_DETECTION,
			ProcessingStage.PATH_TRACING,
			ProcessingStage.PATH_OPTIMIZATION,
			ProcessingStage.ARTISTIC_ENHANCEMENT,
			ProcessingStage.SVG_GENERATION,
			ProcessingStage.FINALIZING
		];

		let totalProgress = 0;
		let _foundCurrent = false;

		for (const stage of stageOrder) {
			if (stage === this.currentStage) {
				// Add half of current stage weight (assuming it's in progress)
				totalProgress += stageWeights[stage] / 2;
				_foundCurrent = true;
				break;
			}
			if (this.stages.has(stage) && this.stages.get(stage)!.end) {
				// Stage is complete
				totalProgress += stageWeights[stage];
			}
		}

		return Math.min(Math.max(totalProgress, 0), 100);
	}

	/**
	 * Get elapsed time for a specific stage
	 */
	getStageTime(stage: ProcessingStage): number | null {
		const stageData = this.stages.get(stage);
		if (!stageData) return null;

		const end = stageData.end || Date.now();
		return end - stageData.start;
	}

	/**
	 * Get total elapsed time
	 */
	getTotalTime(): number {
		return Date.now() - this.startTime;
	}

	/**
	 * Get detailed timing report
	 */
	getTimingReport(): Record<string, number> {
		const report: Record<string, number> = {
			total: this.getTotalTime()
		};

		this.stages.forEach((data, stage) => {
			const time = data.end ? data.end - data.start : Date.now() - data.start;
			report[stage] = time;
		});

		return report;
	}
}

/**
 * Error recovery manager
 */
export class ErrorRecoveryManager {
	private errorHistory: Array<{ error: WorkerError; timestamp: number }> = [];
	private recoveryAttempts = 0;
	private readonly maxRecoveryAttempts = 3;
	private readonly errorHistoryLimit = 20;

	/**
	 * Record an error
	 */
	recordError(error: WorkerError): void {
		this.errorHistory.push({
			error,
			timestamp: Date.now()
		});

		// Limit history size
		if (this.errorHistory.length > this.errorHistoryLimit) {
			this.errorHistory = this.errorHistory.slice(-this.errorHistoryLimit);
		}
	}

	/**
	 * Determine if recovery should be attempted
	 */
	shouldAttemptRecovery(error: WorkerError): boolean {
		// Don't attempt recovery for fatal errors
		const fatalErrors = [
			ErrorCode.WASM_INIT_FAILED,
			ErrorCode.WORKER_INIT_FAILED,
			ErrorCode.OUT_OF_MEMORY
		];

		if (fatalErrors.includes(error.code)) {
			return false;
		}

		// Check if we've exceeded recovery attempts
		if (this.recoveryAttempts >= this.maxRecoveryAttempts) {
			return false;
		}

		// Check for repeated errors (same error 3 times in last 5 errors)
		const recentErrors = this.errorHistory.slice(-5);
		const sameErrorCount = recentErrors.filter((e) => e.error.code === error.code).length;
		if (sameErrorCount >= 3) {
			return false;
		}

		return true;
	}

	/**
	 * Get recovery strategy for an error
	 */
	getRecoveryStrategy(error: WorkerError): RecoveryStrategy {
		switch (error.code) {
			case ErrorCode.PROCESSING_TIMEOUT:
				return {
					action: 'retry',
					delay: 1000,
					modifyConfig: { maxProcessingTime: 120000 } // Increase timeout
				};

			case ErrorCode.IMAGE_TOO_LARGE:
				return {
					action: 'retry',
					delay: 0,
					modifyConfig: { detail: 0.3 } // Reduce detail
				};

			case ErrorCode.INVALID_CONFIG:
				return {
					action: 'reset-config',
					delay: 0
				};

			case ErrorCode.WORKER_CRASHED:
				return {
					action: 'restart-worker',
					delay: 2000
				};

			default:
				return {
					action: 'retry',
					delay: 1000
				};
		}
	}

	/**
	 * Attempt recovery
	 */
	attemptRecovery(): void {
		this.recoveryAttempts++;
	}

	/**
	 * Reset recovery attempts
	 */
	resetRecoveryAttempts(): void {
		this.recoveryAttempts = 0;
	}

	/**
	 * Get error statistics
	 */
	getErrorStats(): {
		totalErrors: number;
		errorsByCode: Record<string, number>;
		recentErrors: WorkerError[];
	} {
		const errorsByCode: Record<string, number> = {};

		this.errorHistory.forEach(({ error }) => {
			errorsByCode[error.code] = (errorsByCode[error.code] || 0) + 1;
		});

		return {
			totalErrors: this.errorHistory.length,
			errorsByCode,
			recentErrors: this.errorHistory.slice(-5).map((e) => e.error)
		};
	}
}

interface RecoveryStrategy {
	action: 'retry' | 'reset-config' | 'restart-worker';
	delay: number;
	modifyConfig?: Record<string, any>;
}
