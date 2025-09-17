/**
 * Algorithm Configuration Store - Single Source of Truth
 *
 * This store manages all algorithm configurations with direct binding to UI components.
 * Each algorithm has its own typed configuration with no translation layers.
 *
 * Architecture:
 * - One store per algorithm with specific configuration
 * - Direct binding to UI components
 * - Single WASM boundary crossing using batch API
 * - Real-time validation using WASM validate method
 */

import { browser } from '$app/environment';
import type {
	EdgeConfig,
	CenterlineConfig,
	SuperpixelConfig,
	DotsConfig,
	AlgorithmConfig,
	AlgorithmType
} from '$lib/types/algorithm-configs';

// Default configurations for each algorithm
const DEFAULT_CONFIGS: Record<AlgorithmType, AlgorithmConfig> = {
	edge: {
		algorithm: 'edge',
		detail: 0.5,
		strokeWidth: 1.2,
		preserveColors: false,
		enableMultipass: false,
		passCount: 1,
		enableReversePass: false,
		enableDiagonalPass: false,
		directionalStrengthThreshold: 0.3,
		enableEtfFdog: false,
		etfRadius: 4,
		etfIterations: 4,
		etfCoherencyTau: 0.2,
		fdogSigmaS: 0.8,
		fdogSigmaC: 1.6,
		fdogTau: 0.7,
		nmsLow: 0.04,
		nmsHigh: 0.08,
		enableFlowTracing: false,
		traceMinGrad: 0.02,
		traceMinCoherency: 0.05,
		traceMaxGap: 8,
		traceMaxLen: 10000,
		enableBezierFitting: false,
		fitLambdaCurv: 0.01,
		fitMaxErr: 2.0,
		fitSplitAngle: 32.0,
		noiseFiltering: false,
		noiseFilterSpatialSigma: 1.2,
		noiseFilterRangeSigma: 50.0,
		enableBackgroundRemoval: false,
		backgroundRemovalStrength: 0.5,
		backgroundRemovalAlgorithm: 'auto',
		linePreserveColors: false,
		lineColorAccuracy: 0.7,
		maxColorsPerPath: 3,
		colorTolerance: 0.15,
		handDrawnPreset: 'none',
		handDrawnVariableWeights: 0.0,
		handDrawnTremorStrength: 0.0,
		handDrawnTapering: 0.0
	} as EdgeConfig,

	centerline: {
		algorithm: 'centerline',
		detail: 0.5,
		strokeWidth: 1.2,
		enableMultipass: false,
		passCount: 1,
		enableAdaptiveThreshold: true,
		adaptiveThresholdWindowSize: 31,
		adaptiveThresholdK: 0.4,
		adaptiveThresholdUseOptimized: true,
		enableDistanceTransformCenterline: false,
		minBranchLength: 8.0,
		douglasPeuckerEpsilon: 1.0,
		enableWidthModulation: false,
		widthMultiplier: 1.0,
		widthSmoothing: 0.3,
		noiseFiltering: false,
		noiseFilterSpatialSigma: 1.2,
		noiseFilterRangeSigma: 50.0,
		enableBackgroundRemoval: false,
		backgroundRemovalStrength: 0.5,
		backgroundRemovalAlgorithm: 'auto',
		linePreserveColors: false,
		lineColorAccuracy: 0.7,
		maxColorsPerPath: 3,
		colorTolerance: 0.15,
		handDrawnPreset: 'none',
		handDrawnVariableWeights: 0.0,
		handDrawnTremorStrength: 0.0,
		handDrawnTapering: 0.0
	} as CenterlineConfig,

	superpixel: {
		algorithm: 'superpixel',
		detail: 0.5,
		strokeWidth: 1.5,
		numSuperpixels: 275,
		superpixelCompactness: 10.0,
		superpixelSlicIterations: 10,
		superpixelInitializationPattern: 'poisson',
		superpixelFillRegions: true,
		superpixelStrokeRegions: true,
		superpixelStrokeWidth: 1.5,
		superpixelSimplifyBoundaries: true,
		superpixelBoundaryEpsilon: 1.0,
		superpixelPreserveColors: true,
		superpixelMinRegionSize: 10,
		superpixelMergeThreshold: 0.1,
		superpixelEnforceConnectivity: true,
		enablePaletteReduction: false,
		paletteTargetColors: 16,
		paletteMethod: 'kmeans',
		paletteDithering: false,
		enableBackgroundRemoval: false,
		backgroundRemovalStrength: 0.5,
		backgroundRemovalAlgorithm: 'auto'
	} as SuperpixelConfig,

	dots: {
		algorithm: 'dots',
		detail: 0.5,
		strokeWidth: 1.0,
		dotDensityThreshold: 0.1,
		dotSpacing: 5.0,
		dotPoissonDiskSampling: false,
		dotGridPattern: 'random',
		dotMinRadius: 0.5,
		dotMaxRadius: 3.0,
		dotAdaptiveSizing: true,
		dotGradientBasedSizing: false,
		dotSizeVariation: 0.3,
		dotPreserveColors: true,
		dotBackgroundTolerance: 0.1,
		dotOpacity: 1.0,
		dotShape: 'circle',
		dotHighDetailDensity: 0.8,
		dotLowDetailDensity: 0.2,
		dotTransitionSmoothness: 0.5,
		enableBackgroundRemoval: false,
		backgroundRemovalStrength: 0.5,
		backgroundRemovalAlgorithm: 'auto'
	} as DotsConfig
};

// Create stores for each algorithm using Svelte 5 runes
class AlgorithmConfigStore {
	// Use $state for reactive state
	private configs = $state<Record<AlgorithmType, AlgorithmConfig>>({ ...DEFAULT_CONFIGS });
	public currentAlgorithm = $state<AlgorithmType>('edge');
	private validationErrors = $state<string[]>([]);
	private validationWarnings = $state<string[]>([]);
	private isInitialized = $state<boolean>(false);

	// Derived values for current active configuration using $derived
	public currentConfig = $derived(this.configs[this.currentAlgorithm]);

	// Derived values for individual algorithm configs
	public edge = $derived(this.configs.edge as EdgeConfig);
	public centerline = $derived(this.configs.centerline as CenterlineConfig);
	public superpixel = $derived(this.configs.superpixel as SuperpixelConfig);
	public dots = $derived(this.configs.dots as DotsConfig);

	constructor() {
		console.log(
			'[AlgorithmConfigStore] Constructor - browser:',
			browser,
			'localStorage available:',
			typeof localStorage !== 'undefined'
		);
		// Load saved configurations from localStorage only in browser
		if (browser) {
			console.log('[AlgorithmConfigStore] Loading saved configs...');
			this.loadSavedConfigs();
			this.loadSavedActiveAlgorithm();
		}
		this.isInitialized = true;
	}

	/**
	 * Initialize the store (for async setup if needed)
	 */
	async initialize(): Promise<void> {
		// For now this is synchronous, but could load from remote config in future
		this.isInitialized = true;
		return Promise.resolve();
	}

	/**
	 * Set the active algorithm
	 */
	setActiveAlgorithm(algorithm: AlgorithmType) {
		this.currentAlgorithm = algorithm;
		this.saveActiveAlgorithm(algorithm);
	}

	/**
	 * Set the current algorithm (alias for runes compatibility)
	 */
	setCurrentAlgorithm(algorithm: AlgorithmType) {
		this.setActiveAlgorithm(algorithm);
	}

	/**
	 * Get the active algorithm
	 */
	getActiveAlgorithm(): AlgorithmType {
		return this.currentAlgorithm;
	}

	/**
	 * Update configuration for a specific algorithm
	 */
	updateConfig(algorithm: AlgorithmType, updates: Partial<AlgorithmConfig>) {
		this.configs = {
			...this.configs,
			[algorithm]: {
				...this.configs[algorithm],
				...updates
			} as AlgorithmConfig
		};
		this.saveConfigs(this.configs);
	}

	/**
	 * Update current active configuration
	 */
	updateCurrentConfig(updates: Partial<AlgorithmConfig>) {
		const algorithm = this.getActiveAlgorithm();

		// Check for hand-drawn slider changes and auto-switch to custom if needed
		for (const paramName in updates) {
			this.switchToCustomIfNeeded(paramName);
		}

		this.updateConfig(algorithm, updates);
	}

	/**
	 * Get configuration for a specific algorithm
	 */
	getConfig(algorithm: AlgorithmType): AlgorithmConfig {
		return this.configs[algorithm];
	}

	/**
	 * Get current active configuration
	 */
	getCurrentConfig(): AlgorithmConfig {
		const algorithm = this.getActiveAlgorithm();
		return this.getConfig(algorithm);
	}

	/**
	 * Reset configuration for a specific algorithm to defaults
	 */
	resetConfig(algorithm: AlgorithmType) {
		this.configs = {
			...this.configs,
			[algorithm]: { ...DEFAULT_CONFIGS[algorithm] }
		};
		this.saveConfigs(this.configs);
	}

	/**
	 * Reset all configurations to defaults
	 */
	resetAllConfigs() {
		this.configs = { ...DEFAULT_CONFIGS };
		this.saveConfigs(DEFAULT_CONFIGS);
	}

	/**
	 * Export configuration as JSON for WASM using the new unified config system
	 * This is the single point where configuration is converted for WASM consumption
	 */
	async exportConfigForWasm(): Promise<string> {
		const config = this.getCurrentConfig();
		// Use the new config transformer to convert to WASM format
		const { toWasmConfig } = await import('$lib/types/config-transformer');
		const wasmConfig = toWasmConfig(config);
		return JSON.stringify(wasmConfig);
	}

	/**
	 * Get configuration as WASM config object (synchronous)
	 * This returns the current config in frontend format - transformation happens in the worker
	 */
	getConfigForWasm(): AlgorithmConfig {
		return this.getCurrentConfig();
	}

	/**
	 * Import configuration from JSON
	 */
	async importConfig(algorithm: AlgorithmType, jsonConfig: string) {
		try {
			const config = JSON.parse(jsonConfig);
			// Check if this is a WASM format config and transform it back
			if (config.backend && config.stroke_px_at_1080p !== undefined) {
				// This looks like a WASM config, transform it back
				const { fromWasmConfig } = await import('$lib/types/config-transformer');
				const frontendConfig = fromWasmConfig(config);
				this.updateConfig(algorithm, frontendConfig);
			} else {
				// This is already frontend format
				this.updateConfig(algorithm, config);
			}
		} catch (error) {
			console.error('Failed to import configuration:', error);
			throw new Error(`Invalid configuration JSON: ${error}`);
		}
	}

	/**
	 * Validate configuration using WASM validator
	 * Returns true if valid, false otherwise
	 */
	async validateConfig(vectorizer: any): Promise<boolean> {
		try {
			const configJson = await this.exportConfigForWasm();
			const validationResult = await vectorizer.validate_config_json(configJson);
			const validation = JSON.parse(validationResult);

			this.validationErrors = validation.errors || [];
			this.validationWarnings = validation.warnings || [];

			return validation.valid;
		} catch (error) {
			console.error('Configuration validation failed:', error);
			this.validationErrors = [`Validation error: ${error}`];
			return false;
		}
	}

	/**
	 * Get validation errors
	 */
	getValidationErrors(): string[] {
		return this.validationErrors;
	}

	/**
	 * Get validation warnings
	 */
	getValidationWarnings(): string[] {
		return this.validationWarnings;
	}

	/**
	 * Apply configuration presets
	 */
	applyPreset(algorithm: AlgorithmType, preset: string) {
		const presets: Record<string, Partial<AlgorithmConfig>> = {
			'line-art': {
				detail: 0.7,
				strokeWidth: 1.2,
				enableMultipass: true,
				passCount: 2
			},
			technical: {
				detail: 0.8,
				strokeWidth: 1.0,
				enableMultipass: false
			},
			artistic: {
				detail: 0.6,
				strokeWidth: 1.5,
				handDrawnPreset: 'medium'
			},
			stippling: {
				detail: 0.5,
				dotDensityThreshold: 0.15,
				dotPoissonDiskSampling: true
			}
		};

		if (presets[preset]) {
			this.updateConfig(algorithm, presets[preset]);
		}
	}

	/**
	 * Save configurations to localStorage
	 */
	private saveConfigs(configs: Record<AlgorithmType, AlgorithmConfig>) {
		if (!browser || typeof localStorage === 'undefined') return;
		try {
			localStorage.setItem('vec2art-algorithm-configs', JSON.stringify(configs));
		} catch (error) {
			console.warn('Failed to save configurations to localStorage:', error);
		}
	}

	/**
	 * Load configurations from localStorage
	 */
	private loadSavedConfigs() {
		console.log(
			'[AlgorithmConfigStore] loadSavedConfigs - browser:',
			browser,
			'localStorage:',
			typeof localStorage
		);
		if (!browser || typeof localStorage === 'undefined') {
			console.log('[AlgorithmConfigStore] Skipping localStorage load - SSR mode');
			return;
		}
		try {
			console.log('[AlgorithmConfigStore] Attempting to load from localStorage...');
			const saved = localStorage.getItem('vec2art-algorithm-configs');
			if (saved) {
				const configs = JSON.parse(saved);
				// Merge with defaults to ensure all fields are present
				const mergedConfigs: Record<AlgorithmType, AlgorithmConfig> = {} as any;
				for (const algorithm of ['edge', 'centerline', 'superpixel', 'dots'] as AlgorithmType[]) {
					mergedConfigs[algorithm] = {
						...DEFAULT_CONFIGS[algorithm],
						...(configs[algorithm] || {})
					} as AlgorithmConfig;
				}
				this.configs = mergedConfigs;
				console.log('[AlgorithmConfigStore] Successfully loaded saved configs');
			}
		} catch (error) {
			console.warn('[AlgorithmConfigStore] Failed to load saved configurations:', error);
		}
	}

	/**
	 * Save active algorithm to localStorage
	 */
	private saveActiveAlgorithm(algorithm: AlgorithmType) {
		if (!browser || typeof localStorage === 'undefined') return;
		try {
			localStorage.setItem('vec2art-active-algorithm', algorithm);
		} catch (error) {
			console.warn('Failed to save active algorithm to localStorage:', error);
		}
	}

	/**
	 * Load active algorithm from localStorage
	 */
	private loadSavedActiveAlgorithm() {
		if (!browser || typeof localStorage === 'undefined') return;
		try {
			const saved = localStorage.getItem('vec2art-active-algorithm');
			if (saved && ['edge', 'centerline', 'superpixel', 'dots'].includes(saved)) {
				this.currentAlgorithm = saved as AlgorithmType;
			}
		} catch (error) {
			console.warn('Failed to load saved active algorithm:', error);
		}
	}

	/**
	 * Hand-drawn preset value mappings
	 */
	private handDrawnPresetValues = {
		none: { handDrawnTremorStrength: 0.0, handDrawnVariableWeights: 0.0, handDrawnTapering: 0.0 },
		subtle: { handDrawnTremorStrength: 0.1, handDrawnVariableWeights: 0.1, handDrawnTapering: 0.1 },
		medium: { handDrawnTremorStrength: 0.3, handDrawnVariableWeights: 0.3, handDrawnTapering: 0.2 },
		strong: {
			handDrawnTremorStrength: 0.45,
			handDrawnVariableWeights: 0.5,
			handDrawnTapering: 0.4
		},
		sketchy: {
			handDrawnTremorStrength: 0.5,
			handDrawnVariableWeights: 0.7,
			handDrawnTapering: 0.6
		},
		custom: { handDrawnTremorStrength: 0.0, handDrawnVariableWeights: 0.0, handDrawnTapering: 0.0 } // Custom preserves current values
	};

	/**
	 * Apply hand-drawn preset values to sliders
	 */
	applyHandDrawnPreset(preset: string) {
		if (preset in this.handDrawnPresetValues) {
			const currentConfig = this.getCurrentConfig();

			// Update the config with preset values for edge/centerline algorithms
			if (currentConfig.algorithm === 'edge' || currentConfig.algorithm === 'centerline') {
				if (preset === 'custom') {
					// For custom preset, only update the preset itself, preserve current slider values
					this.updateCurrentConfig({
						handDrawnPreset: preset as any
					});
				} else {
					// For named presets, apply the preset values to sliders
					const values =
						this.handDrawnPresetValues[preset as keyof typeof this.handDrawnPresetValues];
					this.updateCurrentConfig({
						handDrawnPreset: preset as any,
						handDrawnTremorStrength: values.handDrawnTremorStrength,
						handDrawnVariableWeights: values.handDrawnVariableWeights,
						handDrawnTapering: values.handDrawnTapering
					});
				}
			}
		}
	}

	/**
	 * Auto-switch to custom preset when sliders are manually adjusted
	 */
	private switchToCustomIfNeeded(parameterName: string) {
		const handDrawnSliders = [
			'handDrawnTremorStrength',
			'handDrawnVariableWeights',
			'handDrawnTapering'
		];

		if (handDrawnSliders.includes(parameterName)) {
			const currentConfig = this.getCurrentConfig();

			// Only auto-switch if current preset is not already 'custom' and not 'none'
			if (currentConfig.algorithm === 'edge' || currentConfig.algorithm === 'centerline') {
				const edgeConfig = currentConfig as any;
				if (
					edgeConfig.handDrawnPreset &&
					edgeConfig.handDrawnPreset !== 'custom' &&
					edgeConfig.handDrawnPreset !== 'none'
				) {
					this.updateCurrentConfig({
						handDrawnPreset: 'custom' as any
					});
				}
			}
		}
	}

	/**
	 * Get a reactive reference to a specific algorithm config
	 * This returns the config object that will automatically update
	 */
	getReactiveConfig(algorithm: AlgorithmType) {
		return () => this.configs[algorithm];
	}
}

// Export singleton instance
export const algorithmConfigStore = new AlgorithmConfigStore();

// Export convenient access methods
export const {
	setActiveAlgorithm,
	updateConfig,
	updateCurrentConfig,
	getConfig,
	getCurrentConfig,
	resetConfig,
	resetAllConfigs,
	exportConfigForWasm,
	importConfig,
	validateConfig,
	applyPreset
} = algorithmConfigStore;
