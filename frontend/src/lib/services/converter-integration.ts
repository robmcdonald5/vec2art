/**
 * Converter Integration Layer
 *
 * Provides a clean, high-level API specifically designed for the converter page.
 * Uses the modern service architecture for reliable image processing.
 */

import { ServiceContainer } from './index';
import type { VectorizerConfiguration } from '../types/worker-protocol';
import { VectorizerBackend } from '../types/worker-protocol';
import type {
	ProcessingResult,
	ProcessingOptions,
	ProcessingProgress
} from '../types/service-types';

/**
 * High-level converter service interface
 */
export class ConverterService {
	private static instance: ConverterService;
	private container: ServiceContainer | null = null;
	private isInitialized = false;

	private constructor() {}

	static getInstance(): ConverterService {
		if (!ConverterService.instance) {
			ConverterService.instance = new ConverterService();
		}
		return ConverterService.instance;
	}

	/**
	 * Initialize the converter service
	 */
	async initialize(): Promise<void> {
		if (this.isInitialized) return;

		// Initialize the modern service architecture
		this.container = ServiceContainer.getInstance();
		await this.container.initialize();

		console.log('[Converter] Initialized with modern architecture');
		this.isInitialized = true;
	}

	/**
	 * Process an image using the modern architecture
	 */
	async processImage(
		imageData: ImageData,
		config: VectorizerConfiguration,
		options: ProcessingOptions = {}
	): Promise<ProcessingResult> {
		await this.initialize();

		if (!this.container) {
			throw new Error('Service container not initialized');
		}

		try {
			const vectorizer = this.container.getVectorizerService();
			const result = await vectorizer.processImage(imageData, config, options);

			console.log('[Converter] Processing completed successfully');
			return result;
		} catch (error) {
			console.error('[Converter] Processing failed:', error);

			// Log error to error service if available
			try {
				const errorService = this.container.getErrorService();
				errorService.logError('converter-processing', error as Error, {
					imageSize: `${imageData.width}x${imageData.height}`,
					backend: config.backend,
					timestamp: Date.now()
				});
			} catch {
				// Error service logging failed, continue with original error
			}

			// Re-throw the original error
			throw error;
		}
	}

	/**
	 * Get processing capabilities
	 */
	async getCapabilities() {
		await this.initialize();

		if (!this.container) {
			throw new Error('Service container not initialized');
		}

		const workerPool = this.container.getWorkerPool();
		return {
			...workerPool.getStats(),
			architecture: 'modern',
			features: {
				multiThreading: true,
				caching: true,
				priorityQueue: true,
				progressTracking: true,
				errorRecovery: true
			}
		};
	}

	/**
	 * Get processing statistics
	 */
	getStatistics() {
		if (!this.container) {
			throw new Error('Service container not initialized');
		}

		const health = this.container.getHealthStatus();
		return {
			...health,
			architecture: 'modern'
		};
	}

	/**
	 * Clear cache
	 */
	clearCache(): void {
		if (!this.container) {
			throw new Error('Service container not initialized');
		}

		const cache = this.container.getCache();
		cache.clear();
		console.log('[Converter] Cache cleared');
	}

	/**
	 * Shutdown the converter service
	 */
	async shutdown(): Promise<void> {
		if (!this.container) {
			return; // Already shut down
		}

		try {
			await this.container.shutdown();
			console.log('[Converter] Service shutdown complete');
		} catch (error) {
			console.error('[Converter] Shutdown error:', error);
			throw error;
		} finally {
			this.isInitialized = false;
			this.container = null;
		}
	}
}

/**
 * Reactive store integration for Svelte components
 */
export function createConverterStore() {
	const converter = ConverterService.getInstance();

	// Initialize converter on store creation
	converter.initialize().catch((error) => {
		console.error('[ConverterStore] Initialization failed:', error);
	});

	return {
		// Processing method
		processImage: (
			imageData: ImageData,
			config: VectorizerConfiguration,
			options: ProcessingOptions = {}
		) => {
			return converter.processImage(imageData, config, options);
		},

		// Capability queries
		getCapabilities: () => converter.getCapabilities(),
		getStatistics: () => converter.getStatistics(),
		clearCache: () => converter.clearCache(),

		// Lifecycle
		shutdown: () => converter.shutdown(),
		initialize: () => converter.initialize()
	};
}

/**
 * Svelte action for automatic lifecycle management
 */
export function converterLifecycle(_node: HTMLElement) {
	const converter = ConverterService.getInstance();

	// Initialize on mount
	converter.initialize().catch((error) => {
		console.error('[ConverterLifecycle] Initialization failed:', error);
	});

	return {
		destroy() {
			// Shutdown on destroy
			converter.shutdown().catch((error) => {
				console.error('[ConverterLifecycle] Shutdown failed:', error);
			});
		}
	};
}

/**
 * Utility functions for common converter operations
 */
export const converterUtils = {
	/**
	 * Create a processing configuration with safe defaults
	 */
	createSafeConfig(overrides: Partial<VectorizerConfiguration> = {}): VectorizerConfiguration {
		return {
			backend: VectorizerBackend.EDGE,
			detail: 0.4,
			strokeWidth: 1.5,
			multipass: false,
			noiseFiltering: true,
			svgPrecision: 2,
			...overrides
		};
	},

	/**
	 * Create processing options with progress tracking
	 */
	createProcessingOptions(
		progressCallback?: (progress: ProcessingProgress) => void,
		priority = 1,
		timeout = 60000
	): ProcessingOptions {
		return {
			priority,
			timeout,
			onProgress: progressCallback
		};
	},

	/**
	 * Validate image data before processing
	 */
	validateImageData(imageData: ImageData): { valid: boolean; error?: string } {
		if (!imageData) {
			return { valid: false, error: 'ImageData is null or undefined' };
		}

		if (!imageData.data || !imageData.width || !imageData.height) {
			return { valid: false, error: 'ImageData is missing required properties' };
		}

		if (imageData.width <= 0 || imageData.height <= 0) {
			return { valid: false, error: 'ImageData dimensions must be positive' };
		}

		const expectedLength = imageData.width * imageData.height * 4;
		if (imageData.data.length !== expectedLength) {
			return { valid: false, error: 'ImageData buffer length does not match dimensions' };
		}

		return { valid: true };
	}
};

// Default export for easy access
export default ConverterService;
