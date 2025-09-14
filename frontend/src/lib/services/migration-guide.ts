/**
 * Migration Guide for Refactored Architecture
 *
 * This module provides comprehensive migration utilities and examples
 * for transitioning from the old WasmWorkerService to the new
 * ServiceContainer-based architecture.
 */

import { ServiceContainer, MigrationHelper } from './index';
import type { VectorizerConfiguration } from '../types/worker-protocol';
import type { ProcessingOptions } from '../types/service-types';
import type { VectorizerConfig } from '../types/vectorizer';
import type { ProcessingProgress as LegacyProcessingProgress } from '../types/vectorizer';

/**
 * Convert VectorizerConfiguration to VectorizerConfig
 */
function convertToLegacyConfig(config: VectorizerConfiguration): VectorizerConfig {
	return {
		backend: config.backend as any,
		detail: config.detail,
		stroke_width: config.strokeWidth,
		noise_filtering: config.noiseFiltering,
		multipass: config.multipass,
		pass_count: config.passCount || (config.multipass ? 2 : 1),
		multipass_mode: 'auto',
		reverse_pass: config.reversePass || false,
		diagonal_pass: config.diagonalPass || false,
		enable_etf_fdog: false,
		svg_precision: config.svgPrecision || 2,
		enable_bezier_fitting: true,
		hand_drawn_preset: 'none',
		variable_weights: 0.3,
		tremor_strength: 0.0,
		tapering: 0.5,
		enable_flow_tracing: false
	};
}

/**
 * Convert modern ProcessingProgress callback to legacy format
 */
function convertProgressCallback(
	modernCallback?: (progress: import('../types/service-types').ProcessingProgress) => void
): ((progress: LegacyProcessingProgress) => void) | undefined {
	if (!modernCallback) return undefined;

	return (legacyProgress: LegacyProcessingProgress) => {
		const modernProgress: import('../types/service-types').ProcessingProgress = {
			stage: legacyProgress.stage,
			percent: legacyProgress.progress,
			message: legacyProgress.message || '',
			estimatedTimeRemaining: legacyProgress.estimated_remaining_ms
		};
		modernCallback(modernProgress);
	};
}

/**
 * Migration Examples and Patterns
 */
export class MigrationExamples {
	/**
	 * OLD: Direct WasmWorkerService usage
	 */
	static oldPattern_ProcessImage = `
    // OLD PATTERN (with bandaid fixes)
    import { wasmWorkerService } from '$lib/services/wasm-worker-service';

    try {
      const result = await wasmWorkerService.processImage(
        imageData,
        config,
        {
          onProgress: (progress) => console.log(progress),
          priority: 1,
          timeout: 60000
        }
      );
      console.log('Processed:', result);
    } catch (error) {
      console.error('Processing failed:', error);
    }
  `;

	/**
	 * NEW: ServiceContainer-based approach
	 */
	static newPattern_ProcessImage = `
    // NEW PATTERN (clean architecture)
    import { ServiceContainer } from '$lib/services';

    const container = ServiceContainer.getInstance();
    await container.initialize();

    const vectorizer = container.getVectorizerService();

    try {
      const result = await vectorizer.processImage(
        imageData,
        config,
        {
          onProgress: (progress) => console.log(progress),
          priority: 1,
          timeout: 60000
        }
      );
      console.log('Processed:', result);
    } catch (error) {
      console.error('Processing failed:', error);
    }
  `;

	/**
	 * Migration function for component-level usage
	 */
	static async migrateComponent(oldServiceUsage: () => Promise<any>): Promise<any> {
		if (MigrationHelper.shouldUseLegacyService()) {
			console.warn('[Migration] Using legacy service (feature flag enabled)');
			return await oldServiceUsage();
		}

		if (!(await MigrationHelper.isNewArchitectureReady())) {
			console.warn('[Migration] New architecture not ready, falling back to legacy');
			return await oldServiceUsage();
		}

		// Use new architecture
		const container = await MigrationHelper.migrateFromLegacy();
		const vectorizer = container.getVectorizerService();

		return vectorizer;
	}
}

/**
 * Progressive Migration Strategy
 */
export class ProgressiveMigration {
	private static migrationState = {
		phase: 'not-started' as 'not-started' | 'partial' | 'complete',
		components: new Set<string>(),
		errors: [] as Array<{ component: string; error: string; timestamp: number }>
	};

	/**
	 * Register a component as migrated
	 */
	static registerMigratedComponent(componentName: string): void {
		this.migrationState.components.add(componentName);
		console.log(`[Migration] Component migrated: ${componentName}`);

		// Update migration phase
		if (this.migrationState.components.size > 0) {
			this.migrationState.phase = 'partial';
		}
	}

	/**
	 * Report migration error
	 */
	static reportMigrationError(componentName: string, error: string): void {
		this.migrationState.errors.push({
			component: componentName,
			error,
			timestamp: Date.now()
		});
		console.error(`[Migration] Error in ${componentName}: ${error}`);
	}

	/**
	 * Get migration status
	 */
	static getMigrationStatus() {
		return {
			...this.migrationState,
			migratedComponents: Array.from(this.migrationState.components),
			errorCount: this.migrationState.errors.length,
			recentErrors: this.migrationState.errors
				.filter((e) => Date.now() - e.timestamp < 300000) // Last 5 minutes
				.slice(-5)
		};
	}

	/**
	 * Complete migration
	 */
	static completeMigration(): void {
		this.migrationState.phase = 'complete';
		console.log('[Migration] All components successfully migrated to new architecture');
	}
}

/**
 * Component Migration Helpers
 */
export class ComponentMigrationHelpers {
	/**
	 * Svelte store migration helper
	 */
	static createMigratedStore<T>(
		storeName: string,
		initialValue: T,
		legacyInitializer: () => T,
		newInitializer: () => Promise<T>
	) {
		return {
			subscribe: (callback: (value: T) => void) => {
				// Implementation would depend on Svelte store pattern
				console.log(`[Migration] Store ${storeName} being migrated`);

				// Try new architecture first
				newInitializer()
					.then((value) => {
						ProgressiveMigration.registerMigratedComponent(`store:${storeName}`);
						callback(value);
					})
					.catch((error) => {
						ProgressiveMigration.reportMigrationError(`store:${storeName}`, error.message);
						const fallbackValue = legacyInitializer();
						callback(fallbackValue);
					});

				return () => {}; // Unsubscribe function
			}
		};
	}

	/**
	 * Component lifecycle migration
	 */
	static async migrateComponentLifecycle(
		componentName: string,
		onMount: () => Promise<void>,
		onDestroy: () => Promise<void>
	) {
		try {
			// Initialize new architecture
			if (await MigrationHelper.isNewArchitectureReady()) {
				const container = ServiceContainer.getInstance();
				await container.initialize();

				ProgressiveMigration.registerMigratedComponent(componentName);
				await onMount();
			} else {
				throw new Error('New architecture not ready');
			}
		} catch (error) {
			ProgressiveMigration.reportMigrationError(
				componentName,
				error instanceof Error ? error.message : 'Unknown error'
			);

			// Fallback to legacy lifecycle
			await onMount();
		}

		return {
			destroy: async () => {
				try {
					const container = ServiceContainer.getInstance();
					await container.shutdown();
					await onDestroy();
				} catch {
					await onDestroy();
				}
			}
		};
	}
}

/**
 * API Compatibility Layer
 */
export class CompatibilityLayer {
	/**
	 * Provides old API compatible with new architecture
	 */
	static createLegacyCompatibleAPI() {
		return {
			async processImage(
				imageData: ImageData,
				config: VectorizerConfiguration,
				options?: ProcessingOptions
			) {
				try {
					const container = ServiceContainer.getInstance();
					await container.initialize();

					const vectorizer = container.getVectorizerService();
					return await vectorizer.processImage(imageData, config, options);
				} catch (error) {
					// Fallback to legacy service
					console.warn('[Compatibility] Falling back to legacy service:', error);

					const { WasmWorkerService } = await import('./wasm-worker-service');
					const legacyService = WasmWorkerService.getInstance();
					const legacyConfig = convertToLegacyConfig(config);
					return await legacyService.processImage(
						imageData,
						legacyConfig,
						convertProgressCallback(options?.onProgress)
					);
				}
			},

			async getCapabilities() {
				try {
					const container = ServiceContainer.getInstance();
					const workerPool = container.getWorkerPool();
					return workerPool.getCapabilities();
				} catch {
					// Return basic capabilities as fallback
					return {
						maxWorkers: 1,
						threadingSupported: false,
						wasmAvailable: true
					};
				}
			},

			getStats() {
				try {
					const container = ServiceContainer.getInstance();
					return container.getHealthStatus();
				} catch {
					return {
						ready: false,
						error: 'New architecture not available'
					};
				}
			}
		};
	}
}

/**
 * Migration Validator
 */
export class MigrationValidator {
	/**
	 * Validate that migration was successful
	 */
	static async validateMigration(): Promise<{
		success: boolean;
		issues: string[];
		recommendations: string[];
	}> {
		const issues: string[] = [];
		const recommendations: string[] = [];

		try {
			// Check if new architecture is working
			const container = ServiceContainer.getInstance();
			await container.initialize();

			const health = container.getHealthStatus();

			if (health.workerPool.readyWorkers === 0) {
				issues.push('No workers available in worker pool');
				recommendations.push('Check worker script path and initialization');
			}

			if (health.errors.totalErrors > 0) {
				issues.push(`${health.errors.totalErrors} errors detected`);
				recommendations.push('Review error service logs for specific issues');
			}

			// Check migration status
			const migrationStatus = ProgressiveMigration.getMigrationStatus();

			if (migrationStatus.phase === 'not-started') {
				issues.push('Migration not started');
				recommendations.push('Begin component migration process');
			}

			if (migrationStatus.errorCount > 0) {
				issues.push(`${migrationStatus.errorCount} migration errors`);
				recommendations.push('Review migration errors and implement fallbacks');
			}

			await container.shutdown();

			return {
				success: issues.length === 0,
				issues,
				recommendations
			};
		} catch (error) {
			return {
				success: false,
				issues: [`Migration validation failed: ${error}`],
				recommendations: ['Check service initialization and dependencies']
			};
		}
	}
}

/**
 * Default export for easy access
 */
export default {
	MigrationExamples,
	ProgressiveMigration,
	ComponentMigrationHelpers,
	CompatibilityLayer,
	MigrationValidator
};
