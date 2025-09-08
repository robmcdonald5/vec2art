/**
 * WASM Lifecycle Management Store - Enhanced with Phase 3.3 Optimizations
 * 
 * Handles WebAssembly module initialization, threading, capabilities,
 * emergency recovery, and panic detection. Enhanced with SharedArrayBuffer
 * optimization, thread affinity, and zero-copy operations.
 */

import { browser } from '$app/environment';
import { vectorizerService } from '$lib/services/vectorizer-service';
import { globalWasmOptimizer, type WasmMetrics } from '$lib/utils/wasm-optimizer';
import type {
	VectorizerError,
	WasmCapabilityReport
} from '$lib/types/vectorizer';

interface InitializationOptions {
	threadCount?: number;
	autoInitThreads?: boolean;
}

interface WasmState {
	is_initialized: boolean;
	has_error: boolean;
	error: VectorizerError | undefined;
	capabilities: WasmCapabilityReport | undefined;
}

interface InitState {
	wasmLoaded: boolean;
	threadsInitialized: boolean;
	requestedThreadCount: number;
}

interface RecoveryState {
	isRecovering: boolean;
	recoveryAttempts: number;
	lastRecoveryTime: number;
}

// Circuit breaker states for robust failure handling
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerState {
	state: CircuitState;
	failures: number;
	lastFailureTime: number;
	lastSuccessTime: number;
	openUntil: number;
	failureThreshold: number;
	resetTimeout: number;
	halfOpenMaxCalls: number;
	halfOpenCalls: number;
}

export class ConverterWasmStore {
	// Core WASM state
	private _state = $state<WasmState>({
		is_initialized: false,
		has_error: false,
		error: undefined,
		capabilities: undefined
	});

	// Initialization tracking
	private _initState = $state<InitState>({
		wasmLoaded: false,
		threadsInitialized: false,
		requestedThreadCount: 0
	});

	// Recovery state management
	private _recoveryState = $state<RecoveryState>({
		isRecovering: false,
		recoveryAttempts: 0,
		lastRecoveryTime: 0
	});

	// Circuit breaker for WASM failure management
	private _circuitBreakerState = $state<CircuitBreakerState>({
		state: 'CLOSED',
		failures: 0,
		lastFailureTime: 0,
		lastSuccessTime: 0,
		openUntil: 0,
		failureThreshold: 3, // Open after 3 consecutive failures
		resetTimeout: 30000, // 30 seconds before trying again
		halfOpenMaxCalls: 1, // Only 1 call allowed in HALF_OPEN state
		halfOpenCalls: 0
	});

	// Public getters
	get isInitialized(): boolean {
		return this._state.is_initialized;
	}

	get hasError(): boolean {
		return this._state.has_error;
	}

	get error(): VectorizerError | undefined {
		return this._state.error;
	}

	get isPanicked(): boolean {
		return this._state.has_error && this.isPanicCondition(this._state.error!);
	}

	get isRecovering(): boolean {
		return this._recoveryState.isRecovering;
	}

	get recoveryAttempts(): number {
		return this._recoveryState.recoveryAttempts;
	}

	get capabilities(): WasmCapabilityReport | undefined {
		return this._state.capabilities;
	}

	get wasmLoaded(): boolean {
		return this._initState.wasmLoaded;
	}

	get threadsInitialized(): boolean {
		return this._initState.threadsInitialized;
	}

	get requestedThreadCount(): number {
		return this._initState.requestedThreadCount;
	}

	get vectorizerService() {
		return vectorizerService;
	}

	// Circuit breaker state getters
	get circuitState(): CircuitState {
		return this._circuitBreakerState.state;
	}

	get isCircuitOpen(): boolean {
		return this._circuitBreakerState.state === 'OPEN';
	}

	get circuitFailureCount(): number {
		return this._circuitBreakerState.failures;
	}

	// Phase 3.3: WASM optimization getters
	get wasmMetrics(): WasmMetrics {
		return globalWasmOptimizer.getMetrics();
	}

	get bufferPoolStats() {
		return globalWasmOptimizer.getBufferPoolStats();
	}

	/**
	 * Initialize the vectorizer system with optional thread configuration
	 * Supports lazy loading - loads WASM without initializing threads by default
	 */
	async initialize(options?: InitializationOptions): Promise<void> {
		if (!browser) {
			return; // No-op in SSR
		}

		if (this._state.is_initialized && this._initState.threadsInitialized) {
			return; // Fully initialized
		}

		try {
			this.clearError();

			// Initialize the service with lazy loading by default
			await vectorizerService.initialize(options);
			this._initState.wasmLoaded = true;

			// Get capabilities using the simple check
			const caps = await vectorizerService.checkCapabilities();
			this._state.capabilities = caps;
			this._state.is_initialized = true;

			// Track thread initialization state
			if (options?.autoInitThreads) {
				this._initState.threadsInitialized = caps.threading_supported;
				this._initState.requestedThreadCount = options.threadCount || 0;
			}

			console.log('[ConverterWasmStore] ✅ WASM initialization complete:', {
				wasmLoaded: this._initState.wasmLoaded,
				threadsInitialized: this._initState.threadsInitialized,
				capabilities: caps
			});
		} catch (error) {
			const initError = {
				type: 'unknown' as const,
				message: 'Failed to initialize vectorizer',
				details: error instanceof Error ? error.message : String(error)
			};
			this.setError(initError);
			throw error;
		}
	}

	/**
	 * Initialize thread pool separately (for lazy loading)
	 */
	async initializeThreads(threadCount?: number): Promise<boolean> {
		if (!browser || !this._state.is_initialized) {
			throw new Error('WASM must be initialized first');
		}

		try {
			this.clearError();
			let success: boolean;

			if (this._initState.threadsInitialized) {
				// Try to resize if thread count is different
				if (threadCount && threadCount !== this._initState.requestedThreadCount) {
					console.log(
						`[ConverterWasmStore] Resizing thread pool from ${this._initState.requestedThreadCount} to ${threadCount} threads`
					);
					success = await vectorizerService.resizeThreadPool(threadCount);
				} else {
					console.log('[ConverterWasmStore] Threads already initialized with correct count');
					return true;
				}
			} else {
				// Initialize for the first time
				success = await vectorizerService.initializeThreadPool(threadCount);
			}

			if (success) {
				this._initState.threadsInitialized = true;
				this._initState.requestedThreadCount = threadCount || 0;

				// Update capabilities
				const caps = await vectorizerService.checkCapabilities();
				this._state.capabilities = caps;

				console.log('[ConverterWasmStore] ✅ Thread pool initialized:', {
					threadCount: threadCount || 'auto',
					hardwareConcurrency: caps.hardware_concurrency,
					success
				});
			}

			return success;
		} catch (error) {
			const threadError = {
				type: 'threading' as const,
				message: 'Failed to initialize thread pool',
				details: error instanceof Error ? error.message : String(error)
			};
			this.setError(threadError);
			return false;
		}
	}

	/**
	 * Set performance mode for vectorizer service
	 */
	setPerformanceMode(mode: 'economy' | 'balanced' | 'performance' | 'custom'): void {
		vectorizerService.setPerformanceMode(mode);
		console.log(`[ConverterWasmStore] Performance mode set to: ${mode}`);
	}

	/**
	 * Phase 3.3: Process image with WASM optimizations
	 */
	async processImageOptimized(
		imageData: ImageData,
		config: any,
		progressCallback?: (progress: number) => void,
		jobType: string = 'edge'
	): Promise<any> {
		// Create zero-copy image transfer
		const { buffer, metadata } = globalWasmOptimizer.createZeroCopyImageData(imageData);
		
		// Compress configuration for efficient transfer
		const compressedConfig = globalWasmOptimizer.compressConfig(config);
		
		// Assign optimal thread for this job
		const optimalThread = globalWasmOptimizer.assignOptimalThread(
			jobType, 
			imageData.width * imageData.height
		);
		
		const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		
		try {
			// Track job start for load balancing
			globalWasmOptimizer.trackJobStart(jobId, optimalThread, jobType);
			
			// Execute with circuit breaker and optimization
			const result = await this.executeWithCircuitBreaker(async () => {
				if (!this.vectorizerService) {
					throw new Error('Vectorizer service not initialized');
				}

				// Create optimized ImageData from shared buffer
				// Handle SharedArrayBuffer compatibility - create a regular Uint8ClampedArray for ImageData
				let imageDataArray: Uint8ClampedArray;
				if (buffer instanceof SharedArrayBuffer) {
					// Copy SharedArrayBuffer data to regular ArrayBuffer for ImageData compatibility
					const regularBuffer = new ArrayBuffer(imageData.width * imageData.height * 4);
					const sourceView = new Uint8ClampedArray(buffer, 0, imageData.width * imageData.height * 4);
					imageDataArray = new Uint8ClampedArray(regularBuffer);
					imageDataArray.set(sourceView);
				} else {
					// Create Uint8ClampedArray from regular ArrayBuffer
					imageDataArray = new Uint8ClampedArray(buffer, 0, imageData.width * imageData.height * 4);
				}
				
				const optimizedImageData = new ImageData(
					imageDataArray,
					imageData.width,
					imageData.height
				);

				// Decompress config if needed
				const finalConfig = buffer instanceof SharedArrayBuffer && compressedConfig instanceof Uint8Array
					? globalWasmOptimizer.decompressConfig(compressedConfig)
					: compressedConfig;

				// Process with regular service (enhanced with zero-copy buffers)
				// Adapt progress callback to handle ProcessingProgress type
				const adaptedProgressCallback = progressCallback ? (progress: any) => {
					// Extract numeric progress from ProcessingProgress object
					const numericProgress = typeof progress === 'object' && progress.progress ? progress.progress : progress;
					progressCallback(numericProgress);
				} : undefined;
				
				const processingResult = await this.vectorizerService.processImage(
					optimizedImageData,
					finalConfig,
					adaptedProgressCallback
				);
				
				if (!processingResult) {
					throw new Error('WASM processing failed');
				}
				
				return {
					svg: processingResult.svg,
					metadata: {
						...processingResult.statistics || {},
						optimizations: {
							sharedArrayBuffer: buffer instanceof SharedArrayBuffer,
							threadId: optimalThread,
							compressionUsed: compressedConfig instanceof Uint8Array
						}
					},
					processing_time_ms: processingResult.processing_time_ms || 0
				};
			}, `Processing optimized image job ${jobId} on thread ${optimalThread}`);

			return result;

		} finally {
			// Track job completion for metrics
			globalWasmOptimizer.trackJobCompletion(jobId);
			
			// Release shared buffer
			if (metadata.isShared) {
				const bufferKey = `image_${imageData.width}x${imageData.height}`;
				globalWasmOptimizer.releaseSharedBuffer(bufferKey);
			}
		}
	}

	/**
	 * Phase 3.3: Batch process images with advanced optimizations
	 */
	async processBatchOptimized(
		batch: Array<{ imageData: ImageData; config: any; jobType?: string }>,
		progressCallback?: (overall: number, individual: number[]) => void
	): Promise<any[]> {
		const results: any[] = new Array(batch.length);
		const individualProgress: number[] = new Array(batch.length).fill(0);

		// Process batch with optimal thread distribution
		const promises = batch.map(async (item, index) => {
			const jobType = item.jobType || 'edge';
			
			try {
				const result = await this.processImageOptimized(
					item.imageData,
					item.config,
					(progress) => {
						individualProgress[index] = progress;
						const overallProgress = individualProgress.reduce((sum, p) => sum + p, 0) / batch.length;
						progressCallback?.(overallProgress, [...individualProgress]);
					},
					jobType
				);
				
				results[index] = result;
			} catch (error) {
				results[index] = { error };
			}
		});

		await Promise.allSettled(promises);
		return results;
	}

	/**
	 * Enhanced panic condition detection
	 */
	private isPanicCondition(error: VectorizerError): boolean {
		const errorText = (error.message + ' ' + (error.details || '')).toLowerCase();

		// Critical WASM runtime errors that indicate system corruption
		const panicPatterns = [
			'unreachable executed',
			'panic',
			'memory access out of bounds',
			'call stack exhausted',
			'invalid memory access',
			'segmentation fault',
			'abort called',
			'assertion failed',
			'stack overflow',
			'called option::unwrap() on a none value',
			'index out of bounds',
			'attempted to divide by zero',
			'crossbeam-epoch',
			'wasm execution failed',
			'worker thread panicked'
		];

		return (
			error.type === 'unknown' ||
			panicPatterns.some((pattern) => errorText.includes(pattern)) ||
			// Threading-related failures that often indicate WASM state corruption
			(error.type === 'threading' && errorText.includes('failed'))
		);
	}

	/**
	 * Set error state with enhanced panic detection and recovery
	 */
	private setError(error: VectorizerError): void {
		this._state.error = error;
		this._state.has_error = true;

		// Log error for debugging
		console.error('[ConverterWasmStore] Error:', error);

		// Enhanced panic detection for more error patterns
		const isPanicError = this.isPanicCondition(error);

		if (isPanicError && !this._recoveryState.isRecovering) {
			console.log(
				`[ConverterWasmStore] 🚨 Panic condition detected: ${error.type} - ${error.message}`
			);
			this.attemptAutoRecovery(error);
		}
	}

	/**
	 * Clear error state
	 */
	clearError(): void {
		this._state.error = undefined;
		this._state.has_error = false;
		// Record success when clearing errors (indicates recovery)
		this.recordSuccess();
	}

	/**
	 * Get user-friendly error message
	 */
	getErrorMessage(error?: VectorizerError): string {
		const err = error || this._state.error;
		if (!err) return '';

		const baseMessages: Record<VectorizerError['type'], string> = {
			config: 'Configuration error. Please check your settings and try again.',
			processing: 'Processing failed. The image might be too complex or corrupted.',
			memory:
				'Not enough memory to process this image. Try a smaller image or reduce quality settings.',
			threading: 'Multi-threading setup failed. Processing will continue in single-threaded mode.',
			unknown: 'An unexpected error occurred. Please try again.'
		};

		let message = baseMessages[err.type] || baseMessages.unknown;

		// Add specific guidance based on error details
		if (err.details) {
			if (err.details.includes('SharedArrayBuffer')) {
				message += ' Note: Multi-threading requires HTTPS and specific CORS headers.';
			} else if (err.details.includes('memory') || err.details.includes('allocation')) {
				message += ' Try reducing the image size or detail level.';
			} else if (err.details.includes('timeout')) {
				message +=
					' The operation took too long. Try reducing complexity or increasing the timeout.';
			}
		}

		return message;
	}

	/**
	 * Get recovery suggestions for current error
	 */
	getRecoverySuggestions(): string[] {
		if (!this._state.error) return [];

		const suggestions: string[] = [];

		switch (this._state.error.type) {
			case 'threading':
				suggestions.push('Processing will continue in single-threaded mode');
				suggestions.push('For faster processing, serve over HTTPS with proper CORS headers');
				break;

			case 'unknown':
				suggestions.push('Refresh the page and try again');
				suggestions.push('Check browser console for more details');
				suggestions.push('Try a different image or settings');
				break;

			case 'config':
			case 'processing':
			case 'memory':
				// These are handled by other stores
				break;
		}

		return suggestions;
	}

	/**
	 * Attempt automatic recovery from panic conditions with improved logic
	 */
	private async attemptAutoRecovery(originalError: VectorizerError): Promise<void> {
		const now = Date.now();
		const timeSinceLastRecovery = now - this._recoveryState.lastRecoveryTime;
		const maxConsecutiveAttempts = 2; // Reduced for faster user feedback
		const recoveryThrottleMs = 5000; // 5 seconds between attempts

		// More lenient throttling - allow immediate recovery if enough time has passed
		if (
			this._recoveryState.recoveryAttempts >= maxConsecutiveAttempts &&
			timeSinceLastRecovery < recoveryThrottleMs
		) {
			console.warn(
				`[ConverterWasmStore] Auto-recovery throttled (${this._recoveryState.recoveryAttempts}/${maxConsecutiveAttempts}), waiting ${Math.ceil((recoveryThrottleMs - timeSinceLastRecovery) / 1000)}s`
			);
			return;
		}

		// Reset attempts if enough time has passed since last recovery
		if (timeSinceLastRecovery > 60000) {
			// 1 minute timeout resets the counter
			this._recoveryState.recoveryAttempts = 0;
		}

		console.log(
			`[ConverterWasmStore] 🚨 Panic detected: "${originalError.details}", attempting auto-recovery (attempt ${this._recoveryState.recoveryAttempts + 1}/${maxConsecutiveAttempts})`
		);

		this._recoveryState.isRecovering = true;
		this._recoveryState.recoveryAttempts++;
		this._recoveryState.lastRecoveryTime = now;

		// Show user feedback during recovery
		this._state.error = {
			type: 'unknown',
			message: 'System recovering...',
			details: 'Automatically fixing the issue, please wait...'
		};

		try {
			// Enhanced recovery with configuration reset
			await this.enhancedEmergencyRecovery(originalError);

			// Reset recovery counter on successful recovery
			this._recoveryState.recoveryAttempts = 0;
			console.log('[ConverterWasmStore] ✅ Auto-recovery completed successfully');

			// Clear the recovery message
			this.clearError();
		} catch (error) {
			console.error('[ConverterWasmStore] ❌ Auto-recovery failed:', error);

			// If we've reached max attempts, provide clearer guidance
			if (this._recoveryState.recoveryAttempts >= maxConsecutiveAttempts) {
				this._state.error = {
					type: 'unknown',
					message: 'System requires page refresh',
					details: `Auto-recovery failed after ${maxConsecutiveAttempts} attempts. The WASM module may be corrupted. Please refresh the page (Ctrl+R or Cmd+R) to fully reset the converter.`
				};
				this._state.has_error = true; // Ensure error state is set
			} else {
				// Still have attempts left, keep the original error
				this._state.error = originalError;
				this._state.has_error = true;
			}
		} finally {
			this._recoveryState.isRecovering = false;
		}
	}

	/**
	 * Enhanced emergency recovery with configuration reset and validation
	 */
	async enhancedEmergencyRecovery(originalError: VectorizerError): Promise<void> {
		console.log('[ConverterWasmStore] Starting enhanced emergency recovery...');

		// Prevent setError from triggering auto-recovery during recovery
		const wasRecovering = this._recoveryState.isRecovering;
		this._recoveryState.isRecovering = true;

		try {
			// Step 1: Force cleanup of current service
			console.log('[ConverterWasmStore] 🧹 Cleaning up corrupted WASM state...');
			vectorizerService.cleanup();

			// Step 2: Reset all state completely
			this._state.is_initialized = false;
			this._initState.wasmLoaded = false;
			this._initState.threadsInitialized = false;
			this.clearError();

			// Step 3: Wait longer for complete cleanup (WASM needs time)
			console.log('[ConverterWasmStore] ⏳ Waiting for WASM cleanup to complete...');
			await new Promise((resolve) => setTimeout(resolve, 1500)); // Longer wait

			// Step 4: Force garbage collection if available
			if ('gc' in window && typeof window.gc === 'function') {
				try {
					window.gc();
					console.log('[ConverterWasmStore] 🗑️ Forced garbage collection');
				} catch (e) {
					// Ignore GC errors
				}
			}

			// Step 5: Reinitialize with conservative thread count
			console.log('[ConverterWasmStore] 🔄 Reinitializing WASM module...');
			const threadCount = Math.min(this._initState.requestedThreadCount || 4, 4); // Max 4 threads for stability
			await this.initialize({
				threadCount,
				autoInitThreads: true
			});

			console.log(
				'[ConverterWasmStore] ✅ Enhanced recovery completed successfully'
			);
		} catch (error) {
			console.error('[ConverterWasmStore] ❌ Enhanced recovery failed:', error);

			// Don't recurse - just fail cleanly
			this._state.error = {
				type: 'unknown',
				message: 'Critical system failure',
				details: `Recovery completely failed: ${error instanceof Error ? error.message : 'Unknown error'}. Page refresh required.`
			};
			this._state.has_error = true;
			throw error;
		} finally {
			this._recoveryState.isRecovering = wasRecovering;
		}
	}

	/**
	 * Manual emergency recovery (called by user action) - wrapper for enhanced recovery
	 */
	async emergencyRecovery(): Promise<void> {
		console.log('[ConverterWasmStore] Manual emergency recovery requested...');

		// Create a synthetic error for the enhanced recovery
		const manualError: VectorizerError = {
			type: 'unknown',
			message: 'Manual recovery initiated',
			details: 'User requested emergency recovery'
		};

		await this.enhancedEmergencyRecovery(manualError);
	}

	/**
	 * Cleanup resources with forced abort
	 */
	cleanup(): void {
		// WASM cleanup is handled by the service
		vectorizerService.cleanup();
		
		// Phase 3.3: Cleanup WASM optimizer
		globalWasmOptimizer.cleanup();
		
		this._state.is_initialized = false;
		this._initState.wasmLoaded = false;
		this._initState.threadsInitialized = false;
		this.clearError();

		console.log('[ConverterWasmStore] WASM cleanup completed');
	}

	/**
	 * Reset recovery state (for testing/debugging)
	 */
	resetRecoveryState(): void {
		this._recoveryState.isRecovering = false;
		this._recoveryState.recoveryAttempts = 0;
		this._recoveryState.lastRecoveryTime = 0;
	}

	/**
	 * Circuit breaker implementation for robust failure handling
	 */
	
	private updateCircuitState(): void {
		const now = Date.now();
		const breaker = this._circuitBreakerState;
		
		switch (breaker.state) {
			case 'CLOSED':
				if (breaker.failures >= breaker.failureThreshold) {
					breaker.state = 'OPEN';
					breaker.openUntil = now + breaker.resetTimeout;
					console.warn(
						`[Circuit Breaker] Opening circuit after ${breaker.failures} failures. Will retry at ${new Date(breaker.openUntil).toISOString()}`
					);
				}
				break;
				
			case 'OPEN':
				if (now >= breaker.openUntil) {
					breaker.state = 'HALF_OPEN';
					breaker.halfOpenCalls = 0;
					console.log('[Circuit Breaker] Transitioning to HALF_OPEN state');
				}
				break;
				
			case 'HALF_OPEN':
				// State changes are handled in recordSuccess/recordFailure
				break;
		}
	}

	private recordSuccess(): void {
		const breaker = this._circuitBreakerState;
		const now = Date.now();
		
		breaker.lastSuccessTime = now;
		
		if (breaker.state === 'HALF_OPEN') {
			breaker.halfOpenCalls++;
			if (breaker.halfOpenCalls >= breaker.halfOpenMaxCalls) {
				breaker.state = 'CLOSED';
				breaker.failures = 0;
				console.log('[Circuit Breaker] Success in HALF_OPEN, closing circuit');
			}
		} else if (breaker.state === 'CLOSED') {
			// Reset failure count on success in CLOSED state
			breaker.failures = 0;
		}
		
		this.updateCircuitState();
	}

	private recordFailure(): void {
		const breaker = this._circuitBreakerState;
		const now = Date.now();
		
		breaker.lastFailureTime = now;
		breaker.failures++;
		
		if (breaker.state === 'HALF_OPEN') {
			// Immediately open on failure in HALF_OPEN state
			breaker.state = 'OPEN';
			breaker.openUntil = now + breaker.resetTimeout;
			console.warn('[Circuit Breaker] Failure in HALF_OPEN, opening circuit');
		}
		
		this.updateCircuitState();
	}

	private shouldAllowCall(): boolean {
		this.updateCircuitState();
		
		const breaker = this._circuitBreakerState;
		
		switch (breaker.state) {
			case 'CLOSED':
				return true;
				
			case 'OPEN':
				return false;
				
			case 'HALF_OPEN':
				return breaker.halfOpenCalls < breaker.halfOpenMaxCalls;
				
			default:
				return true;
		}
	}

	/**
	 * Wrap WASM calls with circuit breaker protection
	 */
	async executeWithCircuitBreaker<T>(
		operation: () => Promise<T>,
		operationName: string = 'WASM operation'
	): Promise<T> {
		if (!this.shouldAllowCall()) {
			const error = new Error(
				`${operationName} blocked by circuit breaker. System is temporarily unavailable due to repeated failures. Please wait and try again.`
			);
			console.warn(`[Circuit Breaker] Blocking ${operationName} - circuit is ${this.circuitState}`);
			throw error;
		}

		try {
			const result = await operation();
			this.recordSuccess();
			return result;
		} catch (error) {
			// Only record failure for circuit breaker if it's a significant error
			// Don't record validation or user input errors
			if (error instanceof Error) {
				const errorText = error.message.toLowerCase();
				const isSystemFailure = 
					errorText.includes('wasm') ||
					errorText.includes('memory') ||
					errorText.includes('panic') ||
					errorText.includes('abort') ||
					errorText.includes('unreachable') ||
					this.isPanicCondition({
						type: 'unknown',
						message: error.message,
						details: error.stack
					});
				
				if (isSystemFailure) {
					console.warn(`[Circuit Breaker] Recording failure for ${operationName}: ${error.message}`);
				} else {
					console.log(`[Circuit Breaker] Ignoring user/validation error for circuit breaker: ${error.message}`);
				}
			}
			throw error;
		}
	}

	/**
	 * Reset circuit breaker (for testing/debugging)
	 */
	resetCircuitBreaker(): void {
		this._circuitBreakerState = {
			state: 'CLOSED',
			failures: 0,
			lastFailureTime: 0,
			lastSuccessTime: 0,
			openUntil: 0,
			failureThreshold: 3,
			resetTimeout: 30000,
			halfOpenMaxCalls: 1,
			halfOpenCalls: 0
		};
		console.log('[Circuit Breaker] Reset to initial state');
	}
}

// Export singleton instance
export const converterWasm = new ConverterWasmStore();