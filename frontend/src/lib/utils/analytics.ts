/**
 * Analytics utilities for tracking WASM and application events
 */

import { track } from '@vercel/analytics';
import { browser } from '$app/environment';

/**
 * Track WASM-related events with structured data
 */
export const analytics = {
	/**
	 * Track successful WASM module initialization
	 */
	wasmInitSuccess(data: {
		threadCount: number;
		initTimeMs: number;
		supportedFeatures: string[];
		browserInfo?: string;
	}) {
		if (!browser) return;

		track('wasm_init_success', {
			thread_count: data.threadCount,
			init_time_ms: data.initTimeMs,
			features: data.supportedFeatures.join(','),
			browser: data.browserInfo || 'unknown'
		});
	},

	/**
	 * Track WASM initialization failure with fallback info
	 */
	wasmInitFailure(data: {
		reason: string;
		missingFeatures: string[];
		fallbackMode: 'single-threaded' | 'disabled';
		browserInfo?: string;
	}) {
		if (!browser) return;

		track('wasm_init_failure', {
			reason: data.reason,
			missing_features: data.missingFeatures.join(','),
			fallback_mode: data.fallbackMode,
			browser: data.browserInfo || 'unknown'
		});
	},

	/**
	 * Track successful image vectorization
	 */
	vectorizationComplete(data: {
		backend: 'edge' | 'centerline' | 'superpixel' | 'dots';
		processingTimeMs: number;
		imageSize: string; // e.g., "1920x1080"
		outputSizeKb: number;
		threadCount: number;
		preset?: string;
	}) {
		if (!browser) return;

		track('vectorization_complete', {
			backend: data.backend,
			processing_time_ms: data.processingTimeMs,
			image_size: data.imageSize,
			output_size_kb: data.outputSizeKb,
			thread_count: data.threadCount,
			preset: data.preset || 'custom'
		});
	},

	/**
	 * Track vectorization errors
	 */
	vectorizationError(data: {
		backend: string;
		error: string;
		imageSize?: string;
		threadCount: number;
	}) {
		if (!browser) return;

		track('vectorization_error', {
			backend: data.backend,
			error: data.error,
			image_size: data.imageSize || 'unknown',
			thread_count: data.threadCount
		});
	},

	/**
	 * Track performance mode selection
	 */
	performanceModeSelected(data: {
		mode: 'battery' | 'balanced' | 'performance' | 'extreme' | 'custom';
		threadCount: number;
		cpuCores: number;
		deviceType: string;
	}) {
		if (!browser) return;

		track('performance_mode_selected', {
			mode: data.mode,
			thread_count: data.threadCount,
			cpu_cores: data.cpuCores,
			device_type: data.deviceType
		});
	},

	/**
	 * Track file upload events
	 */
	fileUploaded(data: {
		fileType: string;
		fileSizeMb: number;
		imageResolution: string;
		uploadMethod: 'drag-drop' | 'file-picker';
	}) {
		if (!browser) return;

		track('file_uploaded', {
			file_type: data.fileType,
			file_size_mb: data.fileSizeMb,
			image_resolution: data.imageResolution,
			upload_method: data.uploadMethod
		});
	},

	/**
	 * Track SVG export events
	 */
	svgExported(data: {
		format: 'svg' | 'optimized-svg';
		fileSizeKb: number;
		compressionRatio: number;
		backend: string;
	}) {
		if (!browser) return;

		track('svg_exported', {
			format: data.format,
			file_size_kb: data.fileSizeKb,
			compression_ratio: data.compressionRatio,
			backend: data.backend
		});
	},

	/**
	 * Track general page/feature usage
	 */
	pageView(pageName: string, additionalData?: Record<string, string | number>) {
		if (!browser) return;

		track('page_view', {
			page: pageName,
			...additionalData
		});
	}
};

/**
 * Get basic browser/device info for analytics
 */
export function getBrowserInfo(): string {
	if (!browser) return 'unknown';

	const ua = navigator.userAgent;
	if (ua.includes('Chrome')) return 'chrome';
	if (ua.includes('Firefox')) return 'firefox';
	if (ua.includes('Safari')) return 'safari';
	if (ua.includes('Edge')) return 'edge';
	return 'other';
}

/**
 * Get device type for analytics
 */
export function getDeviceType(): string {
	if (!browser) return 'unknown';

	if (navigator.userAgent.includes('Mobile')) return 'mobile';
	if (navigator.userAgent.includes('Tablet')) return 'tablet';
	return 'desktop';
}
