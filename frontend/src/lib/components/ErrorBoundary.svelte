<!--
  Error Boundary Component
  
  Catches JavaScript errors in child components and displays a fallback UI
  instead of crashing the entire application. This is a critical production
  safety mechanism for the converter system.
-->

<script lang="ts">
	interface Props {
		fallback?: boolean;
		onError?: (error: Error, errorInfo: any) => void;
		children?: any;
	}

	let { fallback = true, onError, children }: Props = $props();

	let hasError = $state(false);
	let error = $state<Error | null>(null);
	let errorInfo = $state<any>(null);
	let retryCount = $state(0);

	// Maximum retry attempts before giving up
	const MAX_RETRIES = 3;

	// Error recovery function
	function handleRetry() {
		if (retryCount < MAX_RETRIES) {
			hasError = false;
			error = null;
			errorInfo = null;
			retryCount++;
			console.log(`[ErrorBoundary] Retry attempt ${retryCount}/${MAX_RETRIES}`);
		}
	}

	// Reset error state completely
	function handleReset() {
		hasError = false;
		error = null;
		errorInfo = null;
		retryCount = 0;
		console.log('[ErrorBoundary] Error boundary reset');
	}

	// Global error handler for catching JavaScript errors
	function captureError(err: Error | string, componentInfo?: any) {
		hasError = true;
		error = err instanceof Error ? err : new Error(String(err));
		errorInfo = {
			componentStack: componentInfo?.constructor?.name || 'Unknown component',
			timestamp: new Date().toISOString(),
			retryCount,
			userAgent: navigator.userAgent
		};

		console.error('[ErrorBoundary] Caught error:', error);
		console.error('[ErrorBoundary] Error info:', errorInfo);

		// Call custom error handler if provided
		onError?.(error, errorInfo);
	}

	// Set up global error handlers
	if (typeof window !== 'undefined') {
		window.addEventListener('error', (event) => {
			captureError(event.error || new Error(event.message));
		});

		window.addEventListener('unhandledrejection', (event) => {
			captureError(new Error(`Unhandled promise rejection: ${event.reason}`));
		});
	}

	// Determine error category for better user guidance
	const errorCategory = $derived(error ? categorizeError(error) : null);

	function categorizeError(err: Error): {
		type: 'network' | 'memory' | 'wasm' | 'validation' | 'unknown';
		userFriendlyMessage: string;
		recoverable: boolean;
	} {
		const message = err.message.toLowerCase();

		if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
			return {
				type: 'network',
				userFriendlyMessage:
					'Network connection issue. Please check your internet connection and try again.',
				recoverable: true
			};
		}

		if (
			message.includes('memory') ||
			message.includes('allocation') ||
			message.includes('out of memory')
		) {
			return {
				type: 'memory',
				userFriendlyMessage:
					'Not enough memory available. Try closing other browser tabs or using a smaller image.',
				recoverable: true
			};
		}

		if (message.includes('wasm') || message.includes('webassembly') || message.includes('panic')) {
			return {
				type: 'wasm',
				userFriendlyMessage:
					'Processing engine encountered an error. The system will attempt to recover automatically.',
				recoverable: true
			};
		}

		if (
			message.includes('validation') ||
			message.includes('invalid') ||
			message.includes('parameter')
		) {
			return {
				type: 'validation',
				userFriendlyMessage:
					'Invalid settings detected. Please check your parameter values and try again.',
				recoverable: true
			};
		}

		return {
			type: 'unknown',
			userFriendlyMessage:
				'An unexpected error occurred. Please try refreshing the page if the problem persists.',
			recoverable: retryCount < MAX_RETRIES
		};
	}
</script>

{#if hasError && fallback}
	<div class="error-boundary">
		<div class="error-boundary-content">
			<!-- Error Icon -->
			<div class="error-icon">
				<svg
					width="48"
					height="48"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<circle cx="12" cy="12" r="10" />
					<line x1="15" y1="9" x2="9" y2="15" />
					<line x1="9" y1="9" x2="15" y2="15" />
				</svg>
			</div>

			<!-- Error Message -->
			<h3 class="error-title">Something went wrong</h3>

			{#if errorCategory}
				<p class="error-message">{errorCategory.userFriendlyMessage}</p>

				<!-- Recovery Actions -->
				<div class="error-actions">
					{#if errorCategory.recoverable && retryCount < MAX_RETRIES}
						<button class="retry-button" onclick={handleRetry}>
							Try Again ({MAX_RETRIES - retryCount} attempts left)
						</button>
					{/if}

					<button class="reset-button" onclick={handleReset}> Reset Component </button>

					<button class="refresh-button" onclick={() => window.location.reload()}>
						Refresh Page
					</button>
				</div>

				<!-- Technical Details (collapsed by default) -->
				<details class="error-details">
					<summary>Technical Details</summary>
					<div class="error-technical">
						<p><strong>Error Type:</strong> {errorCategory.type}</p>
						<p><strong>Message:</strong> {error?.message}</p>
						<p><strong>Component:</strong> {errorInfo?.componentStack}</p>
						<p><strong>Time:</strong> {errorInfo?.timestamp}</p>
						<p><strong>Retry Count:</strong> {retryCount}</p>
						{#if error?.stack}
							<details>
								<summary>Stack Trace</summary>
								<pre class="error-stack">{error.stack}</pre>
							</details>
						{/if}
					</div>
				</details>
			{:else}
				<p class="error-message">Please try refreshing the page.</p>
				<button class="refresh-button" onclick={() => window.location.reload()}>
					Refresh Page
				</button>
			{/if}
		</div>
	</div>
{:else if !hasError}
	{@render children?.()}
{/if}

<style>
	.error-boundary {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 200px;
		padding: 2rem;
		background-color: #fef2f2;
		border: 1px solid #fca5a5;
		border-radius: 8px;
		margin: 1rem 0;
	}

	.error-boundary-content {
		text-align: center;
		max-width: 500px;
	}

	.error-icon {
		color: #dc2626;
		margin-bottom: 1rem;
		display: flex;
		justify-content: center;
	}

	.error-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #dc2626;
		margin-bottom: 0.5rem;
	}

	.error-message {
		color: #991b1b;
		margin-bottom: 1.5rem;
		line-height: 1.5;
	}

	.error-actions {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: center;
		margin-bottom: 1rem;
	}

	.retry-button {
		background-color: #3b82f6;
		color: white;
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.875rem;
		transition: background-color 0.2s;
	}

	.retry-button:hover {
		background-color: #2563eb;
	}

	.reset-button {
		background-color: #f59e0b;
		color: white;
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.875rem;
		transition: background-color 0.2s;
	}

	.reset-button:hover {
		background-color: #d97706;
	}

	.refresh-button {
		background-color: #6b7280;
		color: white;
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.875rem;
		transition: background-color 0.2s;
	}

	.refresh-button:hover {
		background-color: #4b5563;
	}

	.error-details {
		margin-top: 1rem;
		text-align: left;
		background-color: #f9fafb;
		border: 1px solid #d1d5db;
		border-radius: 4px;
		padding: 0.75rem;
	}

	.error-details summary {
		cursor: pointer;
		font-weight: 500;
		color: #374151;
	}

	.error-technical {
		margin-top: 0.5rem;
		font-size: 0.875rem;
		color: #6b7280;
	}

	.error-technical p {
		margin: 0.25rem 0;
	}

	.error-stack {
		background-color: #111827;
		color: #f9fafb;
		padding: 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		overflow-x: auto;
		margin-top: 0.5rem;
	}

	@media (min-width: 640px) {
		.error-actions {
			flex-direction: row;
			justify-content: center;
		}
	}
</style>
