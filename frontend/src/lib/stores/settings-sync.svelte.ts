/**
 * Settings synchronization store for managing multi-image configuration states
 * Supports three modes: global, per-image-batch, and per-image-individual
 */

import { DEFAULT_CONFIG, type VectorizerConfig } from '$lib/types/vectorizer';
import type {
	SettingsSyncMode,
	SettingsSyncState,
	ConfigUpdateEvent,
	ModeSwitchOptions,
	ConvertConfig
} from '$lib/types/settings-sync';

/**
 * Settings sync store using Svelte 5 runes
 */
export class SettingsSyncStore {
	// Core reactive state
	private _syncMode = $state<SettingsSyncMode>('global');
	private _globalConfig = $state<VectorizerConfig>({ ...DEFAULT_CONFIG });
	private _imageConfigs = $state<Map<number, VectorizerConfig>>(new Map());
	private _currentImageIndex = $state<number>(0);
	private _lastGlobalConfig = $state<VectorizerConfig | undefined>(undefined);
	private _totalImages = $state<number>(0);

	constructor() {
		// Initialize with default global config
		this._globalConfig = { ...DEFAULT_CONFIG };
	}

	// Reactive getters
	get syncMode(): SettingsSyncMode {
		return this._syncMode;
	}

	get currentImageIndex(): number {
		return this._currentImageIndex;
	}

	get totalImages(): number {
		return this._totalImages;
	}

	get isPerImageMode(): boolean {
		return this._syncMode !== 'global';
	}

	get isBatchMode(): boolean {
		return this._syncMode === 'per-image-batch';
	}

	get isIndividualMode(): boolean {
		return this._syncMode === 'per-image-individual';
	}

	/**
	 * Get the effective config for the specified image based on current sync mode
	 */
	getCurrentConfig(imageIndex?: number): VectorizerConfig {
		const targetIndex = imageIndex ?? this._currentImageIndex;

		if (this._syncMode === 'global') {
			return this._globalConfig;
		} else {
			// Per-image modes: return individual config or create default if missing
			if (!this._imageConfigs.has(targetIndex)) {
				// Initialize with clean default config to prevent backend cross-contamination
				// CRITICAL: Always start with DEFAULT_CONFIG, never copy from other configs
				// that might have backend-specific settings from different algorithms
				const initialConfig = { ...DEFAULT_CONFIG };
				// CRITICAL: Create new Map to trigger Svelte 5 reactivity
				const newImageConfigs = new Map(this._imageConfigs);
				newImageConfigs.set(targetIndex, initialConfig);
				this._imageConfigs = newImageConfigs;
				console.log(
					`🛡️ Created clean config for image ${targetIndex} to prevent backend cross-contamination`
				);
			}
			return this._imageConfigs.get(targetIndex)!;
		}
	}

	/**
	 * Update config for the specified image based on current sync mode
	 */
	updateConfig(newConfig: VectorizerConfig, imageIndex?: number): void {
		const targetIndex = imageIndex ?? this._currentImageIndex;

		if (this._syncMode === 'global') {
			// Global mode: update global config
			this._globalConfig = { ...newConfig };
		} else {
			// Per-image modes: update specific image's config
			// CRITICAL: Create new Map to trigger Svelte 5 reactivity
			const newImageConfigs = new Map(this._imageConfigs);
			newImageConfigs.set(targetIndex, { ...newConfig });
			this._imageConfigs = newImageConfigs;
		}
	}

	/**
	 * Switch to a new sync mode with proper data migration
	 */
	switchMode(newMode: SettingsSyncMode, options: ModeSwitchOptions = {}): boolean {
		if (newMode === this._syncMode) return true;

		const oldMode = this._syncMode;

		// Handle mode-specific transitions
		if (
			oldMode === 'global' &&
			(newMode === 'per-image-batch' || newMode === 'per-image-individual')
		) {
			// Global → Per-Image: Store global config for potential restoration
			this._lastGlobalConfig = { ...this._globalConfig };

			if (options.initializeFromGlobal !== false) {
				// CRITICAL: Only copy truly universal settings, NOT backend-specific ones
				// Backend-specific parameters (multipass, reverse_pass, etc.) must not leak between images
				const coreConfig = {
					backend: this._globalConfig.backend,
					preset: this._globalConfig.preset,
					detail: this._globalConfig.detail,
					stroke_width: this._globalConfig.stroke_width,
					noise_filtering: this._globalConfig.noise_filtering,
					// REMOVED: multipass, pass_count, multipass_mode - these are edge-backend specific!
					hand_drawn_preset: this._globalConfig.hand_drawn_preset,
					variable_weights: this._globalConfig.variable_weights,
					tremor_strength: this._globalConfig.tremor_strength,
					tapering: this._globalConfig.tapering,
					preserve_colors: this._globalConfig.preserve_colors,
					svg_precision: this._globalConfig.svg_precision,
					optimize_svg: this._globalConfig.optimize_svg,
					include_metadata: this._globalConfig.include_metadata
				};

				// CRITICAL: Create new Map to trigger Svelte 5 reactivity
				const newImageConfigs = new Map<number, VectorizerConfig>();
				for (let i = 0; i < this._totalImages; i++) {
					// Start with clean default config and only apply safe core settings
					const cleanConfig = { ...DEFAULT_CONFIG, ...coreConfig };
					newImageConfigs.set(i, cleanConfig);
				}
				this._imageConfigs = newImageConfigs;
				console.log(
					`🛡️ Mode switch ${oldMode} → ${newMode}: Initialized ${this._totalImages} images with clean core config`
				);
			}
		} else if (
			(oldMode === 'per-image-batch' || oldMode === 'per-image-individual') &&
			newMode === 'global'
		) {
			// Per-Image → Global: Option to preserve current image's config
			if (options.preserveCurrentConfig && this._imageConfigs.has(this._currentImageIndex)) {
				this._globalConfig = { ...this._imageConfigs.get(this._currentImageIndex)! };
			} else if (this._lastGlobalConfig) {
				// Restore previous global config
				this._globalConfig = { ...this._lastGlobalConfig };
			}

			// Clear per-image configs to save memory (optional)
			if (options.confirmDataLoss !== false) {
				this._imageConfigs.clear();
			}
		}
		// Batch ↔ Individual: No config changes needed, just behavior changes

		this._syncMode = newMode;
		return true;
	}

	/**
	 * Set the current image index and update UI state
	 */
	setCurrentImageIndex(index: number): void {
		if (index >= 0 && index < this._totalImages) {
			this._currentImageIndex = index;
		}
	}

	/**
	 * Handle image addition - initialize config for new image
	 */
	handleImageAdded(imageIndex: number, totalImages: number): void {
		this._totalImages = totalImages;

		if (this._syncMode !== 'global') {
			// Per-image modes: initialize new image with clean default config
			// CRITICAL: Always use DEFAULT_CONFIG to prevent backend cross-contamination
			// Never copy from existing image configs that might have different backend settings
			const initConfig = { ...DEFAULT_CONFIG };

			// CRITICAL: Create new Map to trigger Svelte 5 reactivity
			const newImageConfigs = new Map<number, VectorizerConfig>();

			// Copy existing configs, shifting indices as needed
			for (const [index, config] of this._imageConfigs.entries()) {
				if (index < imageIndex) {
					// Configs before the insertion point stay the same
					newImageConfigs.set(index, config);
				} else {
					// Configs at or after the insertion point get shifted up by 1
					newImageConfigs.set(index + 1, config);
				}
			}

			// Add the new image config at the specified index
			newImageConfigs.set(imageIndex, initConfig);
			this._imageConfigs = newImageConfigs;

			console.log(
				`🛡️ Added image ${imageIndex} with clean default config to prevent cross-contamination`
			);
		}
	}

	/**
	 * Handle image removal - clean up config storage
	 */
	handleImageRemoved(imageIndex: number, totalImages: number): void {
		this._totalImages = totalImages;

		if (this._syncMode !== 'global') {
			// CRITICAL: Create new Map to trigger Svelte 5 reactivity
			const newImageConfigs = new Map<number, VectorizerConfig>();

			// Copy configs, shifting indices down for configs after the removed index
			for (const [index, config] of this._imageConfigs.entries()) {
				if (index < imageIndex) {
					// Configs before the removed index stay the same
					newImageConfigs.set(index, config);
				} else if (index > imageIndex) {
					// Configs after the removed index get shifted down by 1
					newImageConfigs.set(index - 1, config);
				}
				// Skip the config at the removed index (effectively deleting it)
			}

			this._imageConfigs = newImageConfigs;

			// Adjust current index if needed
			if (this._currentImageIndex >= imageIndex && this._currentImageIndex > 0) {
				this._currentImageIndex = Math.min(this._currentImageIndex - 1, totalImages - 1);
			}
		}
	}

	/**
	 * Get convert configuration based on current sync mode
	 */
	getConvertConfig(): ConvertConfig {
		const configMap = new Map<number, VectorizerConfig>();

		if (this._syncMode === 'global') {
			// Global mode: all images get same config
			for (let i = 0; i < this._totalImages; i++) {
				configMap.set(i, this._globalConfig);
			}
			return {
				mode: this._syncMode,
				imageIndices: Array.from({ length: this._totalImages }, (_, i) => i),
				configMap
			};
		} else if (this._syncMode === 'per-image-batch') {
			// Batch mode: all images with their individual configs
			for (let i = 0; i < this._totalImages; i++) {
				configMap.set(i, this.getCurrentConfig(i));
			}
			return {
				mode: this._syncMode,
				imageIndices: Array.from({ length: this._totalImages }, (_, i) => i),
				configMap
			};
		} else {
			// Individual mode: only current image
			configMap.set(this._currentImageIndex, this.getCurrentConfig(this._currentImageIndex));
			return {
				mode: this._syncMode,
				imageIndices: [this._currentImageIndex],
				configMap
			};
		}
	}

	/**
	 * Reset all configs to defaults
	 */
	resetConfigs(): void {
		this._globalConfig = { ...DEFAULT_CONFIG };
		this._lastGlobalConfig = undefined;

		// Re-initialize per-image configs if in per-image mode
		if (this._syncMode !== 'global') {
			// CRITICAL: Create new Map to trigger Svelte 5 reactivity
			const newImageConfigs = new Map<number, VectorizerConfig>();
			for (let i = 0; i < this._totalImages; i++) {
				newImageConfigs.set(i, { ...DEFAULT_CONFIG });
			}
			this._imageConfigs = newImageConfigs;
		} else {
			// In global mode, just create empty Map
			this._imageConfigs = new Map();
		}
	}

	/**
	 * Get summary statistics for debugging/UI purposes
	 */
	getStatistics() {
		return {
			syncMode: this._syncMode,
			totalImages: this._totalImages,
			currentImageIndex: this._currentImageIndex,
			perImageConfigCount: this._imageConfigs.size,
			hasLastGlobalConfig: !!this._lastGlobalConfig,
			memoryUsage: {
				globalConfig: JSON.stringify(this._globalConfig).length,
				imageConfigs: Array.from(this._imageConfigs.values())
					.map((config) => JSON.stringify(config).length)
					.reduce((sum, size) => sum + size, 0)
			}
		};
	}

	/**
	 * Initialize store with total images count
	 */
	initialize(totalImages: number, currentIndex: number = 0): void {
		this._totalImages = totalImages;
		this._currentImageIndex = Math.min(currentIndex, totalImages - 1);

		// Initialize per-image configs if in per-image mode
		if (this._syncMode !== 'global') {
			// CRITICAL: Create new Map to trigger Svelte 5 reactivity
			const newImageConfigs = new Map(this._imageConfigs);
			let mapChanged = false;

			for (let i = 0; i < totalImages; i++) {
				if (!newImageConfigs.has(i)) {
					// Always use clean default config for safety
					newImageConfigs.set(i, { ...DEFAULT_CONFIG });
					mapChanged = true;
				}
			}

			// Only update the Map if changes were made
			if (mapChanged) {
				this._imageConfigs = newImageConfigs;
			}
		}
	}

	/**
	 * Validate and clean configs to prevent backend cross-contamination
	 * Call this method periodically or when suspicious behavior is detected
	 */
	validateAndCleanConfigs(): { cleaned: number; issues: string[] } {
		const issues: string[] = [];
		let cleaned = 0;

		// Define backend-specific setting groups
		const backendSpecificSettings = {
			edge: [
				'enable_flow_tracing',
				'enable_bezier_fitting',
				'enable_etf_fdog',
				'trace_min_gradient',
				'trace_min_coherency',
				'trace_max_gap',
				'trace_max_length',
				'fit_lambda_curvature',
				'fit_max_error',
				'fit_split_angle',
				'etf_radius',
				'etf_iterations',
				'etf_coherency_tau',
				'fdog_sigma_s',
				'fdog_sigma_c',
				'fdog_tau',
				'nms_low',
				'nms_high'
			],
			centerline: [
				'enable_adaptive_threshold',
				'window_size',
				'sensitivity_k',
				'use_optimized',
				'thinning_algorithm',
				'min_branch_length',
				'micro_loop_removal',
				'enable_width_modulation',
				'edt_radius_ratio',
				'width_modulation_range',
				'max_join_distance',
				'max_join_angle',
				'edt_bridge_check',
				'douglas_peucker_epsilon',
				'adaptive_simplification'
			],
			dots: [
				'dot_density_threshold',
				'dot_density',
				'dot_size_range',
				'min_radius',
				'max_radius',
				'adaptive_sizing',
				'background_tolerance',
				'poisson_disk_sampling',
				'min_distance_factor',
				'grid_resolution',
				'gradient_based_sizing',
				'local_variance_scaling',
				'color_clustering',
				'opacity_variation'
			],
			superpixel: [
				'num_superpixels',
				'compactness',
				'slic_iterations',
				'min_region_size',
				'color_distance',
				'spatial_distance_weight',
				'fill_regions',
				'stroke_regions',
				'simplify_boundaries',
				'boundary_epsilon'
			]
		};

		const checkConfig = (config: VectorizerConfig, context: string) => {
			const currentBackend = config.backend;
			let configCleaned = false;

			// Check if this config has settings from other backends
			for (const [backend, settings] of Object.entries(backendSpecificSettings)) {
				if (backend !== currentBackend) {
					for (const setting of settings) {
						if ((config as any)[setting] !== undefined && (config as any)[setting] !== false) {
							issues.push(
								`${context}: Found ${backend} setting '${setting}' in ${currentBackend} config`
							);
							// Clean the contaminated setting
							(config as any)[setting] = undefined;
							configCleaned = true;
						}
					}
				}
			}

			return configCleaned;
		};

		// Check global config
		if (checkConfig(this._globalConfig, 'Global config')) {
			cleaned++;
		}

		// Check all per-image configs
		for (const [imageIndex, config] of this._imageConfigs.entries()) {
			if (checkConfig(config, `Image ${imageIndex} config`)) {
				cleaned++;
			}
		}

		if (issues.length > 0) {
			console.warn(
				`🛡️ Settings validation found ${issues.length} cross-contamination issues, cleaned ${cleaned} configs:`,
				issues
			);
		}

		return { cleaned, issues };
	}
}

/**
 * Global instance of the settings sync store
 */
export const settingsSyncStore = new SettingsSyncStore();
