/**
 * GPU Detection Utilities
 * Provides GPU acceleration status checking for the Performance tab
 */

import { browser } from '$app/environment';
import { getGpuStatus as getWasmGpuStatus } from '$lib/wasm/loader';

export interface GpuStatus {
	webgpuAvailable: boolean;
	gpuBackend: string;
	accelerationSupported: boolean;
	status: 'enabled' | 'disabled' | 'not-available' | 'loading' | 'error';
	message?: string;
}

// Cache for GPU status to avoid repeated checks
let cachedGpuStatus: GpuStatus | null = null;

/**
 * Check GPU acceleration status using the WASM module
 */
export async function checkGpuStatus(forceRefresh = false): Promise<GpuStatus> {
	if (!browser) {
		return {
			webgpuAvailable: false,
			gpuBackend: 'none',
			accelerationSupported: false,
			status: 'not-available',
			message: 'GPU detection only works in browser'
		};
	}

	// Return cached result if available and not forcing refresh
	if (cachedGpuStatus && !forceRefresh) {
		return cachedGpuStatus;
	}

	try {
		// Use the WASM loader's GPU status function
		const gpuStatus = await getWasmGpuStatus();

		const result: GpuStatus = {
			webgpuAvailable: gpuStatus.webgpuAvailable,
			gpuBackend: gpuStatus.gpuBackend,
			accelerationSupported: gpuStatus.accelerationSupported,
			status: gpuStatus.status,
			message: gpuStatus.message
		};

		// Cache the result
		cachedGpuStatus = result;

		return result;
	} catch (error) {
		console.error('GPU status check failed:', error);

		const errorResult: GpuStatus = {
			webgpuAvailable: false,
			gpuBackend: 'none',
			accelerationSupported: false,
			status: 'error',
			message: 'Failed to check GPU status: ' + (error as Error).message
		};

		return errorResult;
	}
}

/**
 * Clear the cached GPU status (useful when WASM module is reinitialized)
 */
export function clearGpuStatusCache(): void {
	cachedGpuStatus = null;
}

/**
 * Get a user-friendly status message for the GPU acceleration
 */
export function getGpuStatusMessage(status: GpuStatus): string {
	switch (status.status) {
		case 'enabled':
			return status.message || 'GPU acceleration is active';
		case 'disabled':
			return status.message || 'GPU acceleration is disabled';
		case 'not-available':
			return status.message || 'GPU acceleration not supported';
		case 'loading':
			return 'Checking GPU capabilities...';
		case 'error':
			return status.message || 'GPU status check failed';
		default:
			return 'Unknown GPU status';
	}
}

/**
 * Get appropriate icon name based on GPU status
 */
export function getGpuStatusIcon(status: GpuStatus): string {
	switch (status.status) {
		case 'enabled':
			return 'zap'; // Lightning icon for enabled
		case 'disabled':
			return 'zap-off'; // Lightning off icon for disabled
		case 'not-available':
			return 'x-circle'; // X circle for not available
		case 'loading':
			return 'loader-2'; // Loading spinner
		case 'error':
			return 'alert-triangle'; // Warning triangle for errors
		default:
			return 'help-circle'; // Question mark for unknown
	}
}

/**
 * Get appropriate color class based on GPU status
 */
export function getGpuStatusColor(status: GpuStatus): {
	text: string;
	bg: string;
	border: string;
} {
	switch (status.status) {
		case 'enabled':
			return {
				text: 'text-green-600 dark:text-green-400',
				bg: 'bg-green-50 dark:bg-green-950',
				border: 'border-green-200 dark:border-green-800'
			};
		case 'disabled':
			return {
				text: 'text-yellow-600 dark:text-yellow-400',
				bg: 'bg-yellow-50 dark:bg-yellow-950',
				border: 'border-yellow-200 dark:border-yellow-800'
			};
		case 'not-available':
			return {
				text: 'text-gray-600 dark:text-gray-400',
				bg: 'bg-gray-50 dark:bg-gray-950',
				border: 'border-gray-200 dark:border-gray-800'
			};
		case 'loading':
			return {
				text: 'text-blue-600 dark:text-blue-400',
				bg: 'bg-blue-50 dark:bg-blue-950',
				border: 'border-blue-200 dark:border-blue-800'
			};
		case 'error':
			return {
				text: 'text-red-600 dark:text-red-400',
				bg: 'bg-red-50 dark:bg-red-950',
				border: 'border-red-200 dark:border-red-800'
			};
		default:
			return {
				text: 'text-gray-600 dark:text-gray-400',
				bg: 'bg-gray-50 dark:bg-gray-950',
				border: 'border-gray-200 dark:border-gray-800'
			};
	}
}
