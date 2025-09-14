/**
 * Converter Settings Store
 *
 * Handles parameter management, presets, validation, and UI organization.
 * Merged from vectorizer-settings.svelte.ts and configuration parts of vectorizer.svelte.ts
 * to create a single source of truth for all parameter-related functionality.
 */

import type { StylePreset } from '$lib/presets/types';
import type { VectorizerConfiguration } from '$lib/types/worker-protocol';
import { VectorizerBackend } from '$lib/types/worker-protocol';
import { presetToVectorizerConfig, mergeWithUserConfig } from '$lib/presets/converter';
import {
	legacyToModern,
	modernToLegacy,
	DEFAULT_MODERN_CONFIG,
	getDefaultConfigForBackend as getModernDefaultForBackend,
	type LegacyVectorizerConfig
} from '$lib/utils/config-converter';

// Legacy compatibility constants
export const DEFAULT_CONFIG: VectorizerConfig = modernToLegacy(DEFAULT_MODERN_CONFIG);

export function getDefaultConfigForBackend(backend: any): VectorizerConfig {
	// Convert backend string to modern enum, get modern config, then convert back
	const modernBackend =
		backend === 'edge'
			? VectorizerBackend.EDGE
			: backend === 'centerline'
				? VectorizerBackend.CENTERLINE
				: backend === 'superpixel'
					? VectorizerBackend.SUPERPIXEL
					: backend === 'dots'
						? VectorizerBackend.DOTS
						: VectorizerBackend.EDGE;
	return modernToLegacy(getModernDefaultForBackend(modernBackend));
}

export const PRESET_CONFIGS: Record<string, Partial<VectorizerConfig>> = {
	sketch: {
		backend: 'edge',
		detail: 0.6,
		stroke_width: 1.5,
		hand_drawn_preset: 'subtle',
		pass_count: 2,
		multipass: true,
		multipass_mode: 'auto',
		noise_filtering: true,
		variable_weights: 0.3,
		tremor_strength: 0.1,
		tapering: 0.2,
		enable_etf_fdog: false,
		enable_flow_tracing: false,
		enable_bezier_fitting: false
	},
	technical: {
		backend: 'centerline',
		detail: 0.6,
		stroke_width: 1.0,
		hand_drawn_preset: 'none',
		pass_count: 1,
		multipass: false,
		multipass_mode: 'auto',
		noise_filtering: true,
		enable_etf_fdog: false,
		enable_flow_tracing: false,
		enable_bezier_fitting: false
	},
	artistic: {
		backend: 'dots',
		detail: 0.3,
		stroke_width: 1.0,
		preserve_colors: true,
		multipass: false,
		multipass_mode: 'auto',
		pass_count: 1,
		enable_etf_fdog: false,
		enable_flow_tracing: false,
		enable_bezier_fitting: false
	},
	poster: {
		backend: 'superpixel',
		detail: 0.2,
		stroke_width: 1.5,
		preserve_colors: true,
		multipass: false,
		multipass_mode: 'auto',
		pass_count: 1,
		enable_etf_fdog: false,
		enable_flow_tracing: false,
		enable_bezier_fitting: false
	},
	comic: {
		backend: 'edge',
		detail: 0.7,
		stroke_width: 1.5,
		hand_drawn_preset: 'medium',
		pass_count: 2,
		multipass: true,
		multipass_mode: 'auto',
		preserve_colors: true,
		enable_etf_fdog: false,
		enable_flow_tracing: false,
		enable_bezier_fitting: false
	}
};

// Phase 3: Import performance optimization utilities
import {
	ParameterDiffer,
	globalParameterUpdateManager,
	type ParameterDelta
} from '$lib/utils/parameter-diff';
import { globalValidationCache } from '$lib/utils/validation-cache';

// Bridge legacy and modern config types
export type VectorizerConfig = LegacyVectorizerConfig;

// Parameter validation and conversion utilities
function validateConfig(config: VectorizerConfig): { isValid: boolean; errors: string[] } {
	const errors: string[] = [];

	// Basic validation - more comprehensive validation will come from generated metadata
	if (config.detail < 0.1 || config.detail > 1.0) {
		errors.push('Detail must be between 0.1 and 1.0');
	}

	if (config.stroke_width < 0.5 || config.stroke_width > 10.0) {
		errors.push('Stroke width must be between 0.5 and 10.0');
	}

	return {
		isValid: errors.length === 0,
		errors
	};
}

function normalizeConfig(config: Partial<VectorizerConfig>): VectorizerConfig {
	// Ensure all required fields have valid values
	return {
		...DEFAULT_CONFIG,
		...config,
		// Clamp values to valid ranges
		detail: Math.max(0.1, Math.min(1.0, config.detail ?? DEFAULT_CONFIG.detail)),
		stroke_width: Math.max(0.5, Math.min(10.0, config.stroke_width ?? DEFAULT_CONFIG.stroke_width))
	};
}

export type SettingsMode = 'preset' | 'manual' | 'hybrid';

export interface ParameterSection {
	id: string;
	title: string;
	description: string;
	parameters: (keyof VectorizerConfig)[];
	condition?: boolean;
}

interface SettingsState {
	// Core configuration state
	config: VectorizerConfig;
	mode: SettingsMode;
	selectedPreset: StylePreset | null;
	manualOverrides: Partial<VectorizerConfig>;

	// UI state
	showAdvancedSettings: boolean;
	expandedSections: Set<string>;

	// Per-algorithm configuration state to prevent slider overlap/sharing
	algorithmConfigs: Record<VectorizerBackend, VectorizerConfig>;
}

export class ConverterSettingsStore {
	private _state = $state<SettingsState>({
		// Start in manual mode since presets aren't ready yet
		mode: 'manual',
		selectedPreset: null,
		manualOverrides: {},
		config: { ...DEFAULT_CONFIG },

		// UI state
		showAdvancedSettings: false,
		expandedSections: new Set(['core']),

		// Per-algorithm configuration state - use centralized defaults
		algorithmConfigs: {
			edge: getDefaultConfigForBackend('edge'),
			centerline: getDefaultConfigForBackend('centerline'),
			superpixel: getDefaultConfigForBackend('superpixel'),
			dots: getDefaultConfigForBackend('dots')
		}
	});

	// Derived final configuration - CRITICAL: This maintains backwards compatibility
	finalConfig = $derived.by((): VectorizerConfig => {
		switch (this._state.mode) {
			case 'preset':
				return this._state.selectedPreset
					? presetToVectorizerConfig(this._state.selectedPreset)
					: DEFAULT_CONFIG;

			case 'manual': {
				// Use backend-specific defaults when in manual mode
				const backend = this._state.manualOverrides.backend || 'edge';
				const baseConfig = getDefaultConfigForBackend(backend);
				return { ...baseConfig, ...this._state.manualOverrides };
			}

			case 'hybrid':
				if (this._state.selectedPreset) {
					const baseConfig = presetToVectorizerConfig(this._state.selectedPreset);
					return mergeWithUserConfig(baseConfig, this._state.manualOverrides);
				}
				// Use backend-specific defaults as fallback
				const backend = this._state.manualOverrides.backend || 'edge';
				const baseConfig = getDefaultConfigForBackend(backend);
				return { ...baseConfig, ...this._state.manualOverrides };

			default:
				return DEFAULT_CONFIG;
		}
	});

	// Public getters
	get mode(): SettingsMode {
		return this._state.mode;
	}

	get selectedPreset(): StylePreset | null {
		return this._state.selectedPreset;
	}

	get manualOverrides(): Partial<VectorizerConfig> {
		return this._state.manualOverrides;
	}

	get config(): VectorizerConfig {
		return this._state.config;
	}

	get showAdvancedSettings(): boolean {
		return this._state.showAdvancedSettings;
	}

	get expandedSections(): Set<string> {
		return this._state.expandedSections;
	}

	get algorithmConfigs(): Record<VectorizerBackend, VectorizerConfig> {
		return this._state.algorithmConfigs;
	}

	/**
	 * PRESET MANAGEMENT (from vectorizer-settings.svelte.ts)
	 */

	/**
	 * Select a preset and switch to preset mode
	 */
	selectPreset(preset: StylePreset | null): void {
		this._state.selectedPreset = preset;
		if (preset) {
			this._state.mode = 'preset';
			// Clear manual overrides when switching to pure preset mode
			this._state.manualOverrides = {};
			this._state.config = presetToVectorizerConfig(preset);
		} else {
			this._state.mode = 'manual';
			this._state.config = { ...this._state.algorithmConfigs[this._state.config.backend] };
		}
		console.log(
			`[ConverterSettingsStore] Selected preset: ${preset?.metadata?.name || 'none'}, mode: ${this._state.mode}`
		);
	}

	/**
	 * Switch to hybrid mode (preset base + manual overrides)
	 */
	enableHybridMode(): void {
		if (this._state.selectedPreset) {
			this._state.mode = 'hybrid';
			console.log('[ConverterSettingsStore] Enabled hybrid mode');
		}
	}

	/**
	 * Switch to full manual mode
	 */
	enableManualMode(): void {
		this._state.mode = 'manual';
		this._state.selectedPreset = null;
		this._state.config = { ...this._state.algorithmConfigs[this._state.config.backend] };
		console.log('[ConverterSettingsStore] Enabled manual mode');
	}

	/**
	 * Use a preset configuration (from vectorizer.svelte.ts)
	 */
	usePreset(preset: keyof typeof PRESET_CONFIGS): void {
		if (preset && PRESET_CONFIGS[preset]) {
			this.updateConfig({ preset, ...PRESET_CONFIGS[preset] });
		}
	}

	/**
	 * Reset to preset defaults (clears manual overrides)
	 */
	resetToPreset(): void {
		this._state.manualOverrides = {};
		this._state.mode = this._state.selectedPreset ? 'preset' : 'manual';
		if (this._state.selectedPreset) {
			this._state.config = presetToVectorizerConfig(this._state.selectedPreset);
		} else {
			this._state.config = { ...this._state.algorithmConfigs[this._state.config.backend] };
		}
		console.log('[ConverterSettingsStore] Reset to preset defaults');
	}

	/**
	 * PARAMETER MANAGEMENT (merged from both stores)
	 */

	/**
	 * Update a specific parameter (triggers hybrid mode if preset selected)
	 * Enhanced version from vectorizer-settings.svelte.ts
	 */
	updateParameter<K extends keyof VectorizerConfig>(key: K, value: VectorizerConfig[K]): void {
		// Special handling for backend changes
		if (key === 'backend' && value !== this._state.config.backend) {
			const newBackend = value as VectorizerBackend;
			const backendDefaults = getDefaultConfigForBackend(newBackend);

			// Save current config state to the current algorithm
			this._state.algorithmConfigs[this._state.config.backend] = { ...this._state.config };

			// Apply backend-specific defaults for critical settings
			// Only apply if not already explicitly set by user
			const updatedOverrides: Partial<VectorizerConfig> = {
				...this._state.manualOverrides,
				[key]: value
			};

			// Apply backend-specific defaults if not already overridden
			if (!('preserve_colors' in this._state.manualOverrides)) {
				updatedOverrides.preserve_colors = backendDefaults.preserve_colors;
			}
			if (!('stroke_width' in this._state.manualOverrides)) {
				updatedOverrides.stroke_width = backendDefaults.stroke_width;
			}
			if (!('detail' in this._state.manualOverrides)) {
				updatedOverrides.detail = backendDefaults.detail;
			}

			this._state.manualOverrides = updatedOverrides;

			// Switch to the new algorithm's config
			const newAlgorithmConfig = { ...this._state.algorithmConfigs[newBackend] };
			// Apply any additional updates from the current call
			const otherUpdates = { ...updatedOverrides };
			delete otherUpdates.backend; // Remove backend from other updates

			this._state.config = { ...newAlgorithmConfig, ...otherUpdates };
			console.log(
				`[ConverterSettingsStore] Switched to ${newBackend} algorithm config:`,
				this._state.config
			);
		} else {
			// Apply parameter normalization before updating config
			const normalizedValue = this.normalizeParameterValue(key, value);

			// Same algorithm, just update the current config and save to algorithm state
			this._state.manualOverrides = {
				...this._state.manualOverrides,
				[key]: normalizedValue
			};
			this._state.config = { ...this._state.config, [key]: normalizedValue };
			this._state.algorithmConfigs[this._state.config.backend] = { ...this._state.config };
		}

		// Auto-switch to hybrid mode if we have a preset selected
		if (this._state.selectedPreset && this._state.mode === 'preset') {
			this._state.mode = 'hybrid';
		} else if (!this._state.selectedPreset) {
			this._state.mode = 'manual';
		}
	}

	/**
	 * Batch update multiple parameters with validation
	 */
	updateParameters(updates: Partial<VectorizerConfig>): void {
		// Validate the updates first
		const testConfig = { ...this.finalConfig, ...updates };
		const validation = validateConfig(testConfig);

		if (!validation.isValid) {
			console.warn('[ConverterSettingsStore] Validation errors:', validation.errors);
			// Continue with normalization to fix invalid values
		}

		// Apply normalization to all updates
		const normalizedUpdates = this.normalizeConfig(updates);

		// If backend is changing, use the special backend handling
		if (normalizedUpdates.backend && normalizedUpdates.backend !== this._state.config.backend) {
			// Handle backend change specially
			this.updateParameter('backend', normalizedUpdates.backend);
			// Remove backend from remaining updates
			const remainingUpdates = { ...normalizedUpdates };
			delete remainingUpdates.backend;

			// Apply remaining updates
			if (Object.keys(remainingUpdates).length > 0) {
				this._state.manualOverrides = {
					...this._state.manualOverrides,
					...remainingUpdates
				};
				this._state.config = { ...this._state.config, ...remainingUpdates };
				this._state.algorithmConfigs[this._state.config.backend] = { ...this._state.config };
			}
		} else {
			// Normal batch update
			this._state.manualOverrides = {
				...this._state.manualOverrides,
				...normalizedUpdates
			};
			this._state.config = { ...this._state.config, ...normalizedUpdates };
			this._state.algorithmConfigs[this._state.config.backend] = { ...this._state.config };
		}

		// Auto-switch modes as needed
		if (this._state.selectedPreset && this._state.mode === 'preset') {
			this._state.mode = 'hybrid';
		} else if (!this._state.selectedPreset) {
			this._state.mode = 'manual';
		}

		console.log('[ConverterSettingsStore] Batch parameter update:', normalizedUpdates);
	}

	/**
	 * Update configuration with normalization (from vectorizer.svelte.ts)
	 * This is the main entry point that other stores will use
	 */
	updateConfig(updates: Partial<VectorizerConfig>): void {
		this.updateParameters(updates);
	}

	/**
	 * Reset configuration to defaults - resets current algorithm config only
	 */
	resetConfig(): void {
		const currentBackend = this._state.config.backend;
		const defaultAlgorithmConfig = getDefaultConfigForBackend(currentBackend);
		this._state.config = { ...defaultAlgorithmConfig };
		this._state.algorithmConfigs[currentBackend] = { ...defaultAlgorithmConfig };
		this._state.manualOverrides = {};
		this._state.mode = 'manual';
		this._state.selectedPreset = null;
		console.log(`[ConverterSettingsStore] Reset ${currentBackend} config to defaults`);
	}

	/**
	 * Reset all algorithm configurations to their defaults
	 */
	resetAllAlgorithmConfigs(): void {
		this._state.algorithmConfigs.edge = getDefaultConfigForBackend('edge');
		this._state.algorithmConfigs.centerline = getDefaultConfigForBackend('centerline');
		this._state.algorithmConfigs.superpixel = getDefaultConfigForBackend('superpixel');
		this._state.algorithmConfigs.dots = getDefaultConfigForBackend('dots');
		// Update current config to match current backend
		this._state.config = { ...this._state.algorithmConfigs[this._state.config.backend] };
		this._state.manualOverrides = {};
		this._state.mode = 'manual';
		this._state.selectedPreset = null;
		console.log('[ConverterSettingsStore] Reset all algorithm configs to defaults');
	}

	/**
	 * PARAMETER NORMALIZATION (from vectorizer.svelte.ts)
	 */

	/**
	 * Normalize a single parameter value
	 */
	private normalizeParameterValue<K extends keyof VectorizerConfig>(
		key: K,
		value: VectorizerConfig[K]
	): VectorizerConfig[K] {
		// For complex normalization that depends on image dimensions or other config,
		// we'll normalize the entire config. For now, basic type checking.
		const singleParamConfig = { [key]: value } as Partial<VectorizerConfig>;
		const normalized = this.normalizeConfig(singleParamConfig);
		return normalized[key] as VectorizerConfig[K];
	}

	/**
	 * Normalize configuration parameters to ensure they're within valid ranges
	 * This prevents WASM parameter validation failures
	 * CRITICAL: Extracted from vectorizer.svelte.ts with all logic preserved
	 */
	normalizeConfig(config: Partial<VectorizerConfig>): Partial<VectorizerConfig> {
		const normalized = { ...config };

		// Universal parameter normalization
		if (typeof normalized.detail === 'number') {
			normalized.detail = Math.max(0, Math.min(1, normalized.detail));
		}
		if (typeof normalized.stroke_width === 'number') {
			// Apply intelligent scaling limit to prevent WASM crashes
			// Large images (>2x 1080p) can cause stroke scaling issues, so limit to 5.0 max
			// NOTE: We don't have direct access to image dimensions here, so use conservative limits
			normalized.stroke_width = Math.max(0.1, Math.min(10.0, normalized.stroke_width));
		}
		if (typeof normalized.pass_count === 'number') {
			normalized.pass_count = Math.max(1, Math.min(10, Math.round(normalized.pass_count)));
		}

		// Hand-drawn aesthetics normalization
		if (typeof normalized.variable_weights === 'number') {
			normalized.variable_weights = Math.max(0, Math.min(1, normalized.variable_weights));
		}
		if (typeof normalized.tremor_strength === 'number') {
			// CRITICAL: WASM validation limits tremor_strength to 0.0-0.5
			normalized.tremor_strength = Math.max(0, Math.min(0.5, normalized.tremor_strength));
		}
		if (typeof normalized.tapering === 'number') {
			normalized.tapering = Math.max(0, Math.min(1, normalized.tapering));
		}

		// Dots backend normalization
		if (normalized.backend === 'dots' || this._state.config.backend === 'dots') {
			if (typeof normalized.dot_density_threshold === 'number') {
				normalized.dot_density_threshold = Math.max(
					0,
					Math.min(1, normalized.dot_density_threshold)
				);
			}
			if (typeof normalized.background_tolerance === 'number') {
				normalized.background_tolerance = Math.max(0, Math.min(1, normalized.background_tolerance));
			}
			if (typeof normalized.min_radius === 'number') {
				normalized.min_radius = Math.max(0.2, Math.min(3, normalized.min_radius));
			}
			if (typeof normalized.max_radius === 'number') {
				normalized.max_radius = Math.max(0.5, Math.min(10, normalized.max_radius));
			}
			// Ensure min_radius < max_radius
			if (
				normalized.min_radius &&
				normalized.max_radius &&
				normalized.min_radius >= normalized.max_radius
			) {
				normalized.max_radius = normalized.min_radius + 0.5;
			}
		}

		// Centerline backend normalization
		if (normalized.backend === 'centerline' || this._state.config.backend === 'centerline') {
			if (typeof normalized.window_size === 'number') {
				normalized.window_size = Math.max(15, Math.min(50, normalized.window_size));
			}
			if (typeof normalized.sensitivity_k === 'number') {
				normalized.sensitivity_k = Math.max(0.1, Math.min(1, normalized.sensitivity_k));
			}
			if (typeof normalized.min_branch_length === 'number') {
				normalized.min_branch_length = Math.max(4, Math.min(24, normalized.min_branch_length));
			}
			if (typeof normalized.douglas_peucker_epsilon === 'number') {
				normalized.douglas_peucker_epsilon = Math.max(
					0.5,
					Math.min(3, normalized.douglas_peucker_epsilon)
				);
			}
		}

		// Superpixel backend normalization
		if (normalized.backend === 'superpixel' || this._state.config.backend === 'superpixel') {
			if (typeof normalized.num_superpixels === 'number') {
				normalized.num_superpixels = Math.max(
					20,
					Math.min(1000, Math.round(normalized.num_superpixels))
				);
			}
			if (typeof normalized.compactness === 'number') {
				normalized.compactness = Math.max(1, Math.min(50, normalized.compactness));
			}
			if (typeof normalized.slic_iterations === 'number') {
				normalized.slic_iterations = Math.max(
					5,
					Math.min(15, Math.round(normalized.slic_iterations))
				);
			}
			if (typeof normalized.boundary_epsilon === 'number') {
				normalized.boundary_epsilon = Math.max(0.5, Math.min(3, normalized.boundary_epsilon));
			}
		}

		// Performance settings normalization
		if (typeof normalized.max_processing_time_ms === 'number') {
			normalized.max_processing_time_ms = Math.max(1000, normalized.max_processing_time_ms);
		}
		if (typeof normalized.svg_precision === 'number') {
			normalized.svg_precision = Math.max(0, Math.min(4, Math.round(normalized.svg_precision)));
		}

		console.log('[ConverterSettingsStore] Parameter normalization applied:', {
			original: JSON.parse(JSON.stringify(config)),
			normalized: JSON.parse(JSON.stringify(normalized))
		});

		return normalized;
	}

	/**
	 * CONFIGURATION VALIDATION (from vectorizer.svelte.ts)
	 */

	/**
	 * Comprehensive configuration validation with detailed error reporting
	 * CRITICAL: Extracted from vectorizer.svelte.ts with all logic preserved
	 */
	validateConfig(): { isValid: boolean; errors: string[] } {
		const config = this._state.config;
		const errors: string[] = [];

		// Universal parameter validation (applies to all backends)
		if (config.detail < 0 || config.detail > 1) {
			errors.push('Detail level must be between 0.0 and 1.0');
		}
		if (config.stroke_width < 0.1 || config.stroke_width > 10) {
			errors.push('Stroke width must be between 0.1 and 10.0 pixels');
		}

		// Hand-drawn aesthetics validation (applies to all backends that support it)
		if (config.variable_weights < 0 || config.variable_weights > 1) {
			errors.push('Variable weights must be between 0.0 and 1.0');
		}
		if (config.tremor_strength < 0 || config.tremor_strength > 0.5) {
			errors.push('Tremor strength must be between 0.0 and 0.5');
		}
		if (config.tapering < 0 || config.tapering > 1) {
			errors.push('Tapering must be between 0.0 and 1.0');
		}

		// Backend-specific validation
		if (config.backend === 'edge') {
			// Note: Flow tracing dependencies are now auto-fixed by the service layer
			// So we don't need to error here, just warn
			if (config.enable_bezier_fitting && !config.enable_flow_tracing) {
				console.warn(
					'[ConverterSettingsStore] Bézier curve fitting works best with flow-guided tracing (will be auto-enabled)'
				);
			}
			if (config.enable_etf_fdog && !config.enable_flow_tracing) {
				console.warn(
					'[ConverterSettingsStore] ETF/FDoG edge detection works best with flow-guided tracing (will be auto-enabled)'
				);
			}
		}

		// Dots backend validation
		if (config.backend === 'dots') {
			const density = config.dot_density ?? config.dot_density_threshold;
			if (density !== undefined && (density < 0.0 || density > 1.0)) {
				errors.push('Dot density must be between 0.0 and 1.0');
			}
			if (
				config.background_tolerance !== undefined &&
				(config.background_tolerance < 0 || config.background_tolerance > 1)
			) {
				errors.push('Background tolerance must be between 0.0 and 1.0');
			}
			if (
				config.min_radius !== undefined &&
				config.max_radius !== undefined &&
				config.min_radius >= config.max_radius
			) {
				errors.push('Minimum dot radius must be smaller than maximum radius');
			}
			if (config.min_radius !== undefined && (config.min_radius < 0.2 || config.min_radius > 3.0)) {
				errors.push('Minimum dot radius must be between 0.2 and 3.0 pixels');
			}
			if (
				config.max_radius !== undefined &&
				(config.max_radius < 0.5 || config.max_radius > 10.0)
			) {
				errors.push('Maximum dot radius must be between 0.5 and 10.0 pixels');
			}
			// Hand-drawn effects don't really apply to dots (warn but don't error)
			if (
				config.hand_drawn_preset !== 'none' &&
				(config.variable_weights > 0 || config.tremor_strength > 0)
			) {
				console.warn(
					'[ConverterSettingsStore] Hand-drawn effects are not recommended for dots backend'
				);
			}
		}

		// Centerline backend validation
		if (config.backend === 'centerline') {
			if (
				config.window_size !== undefined &&
				(config.window_size < 15 || config.window_size > 50)
			) {
				errors.push('Adaptive threshold window size must be between 15 and 50 pixels');
			}
			if (
				config.sensitivity_k !== undefined &&
				(config.sensitivity_k < 0.1 || config.sensitivity_k > 1.0)
			) {
				errors.push('Sensitivity parameter must be between 0.1 and 1.0');
			}
			if (
				config.min_branch_length !== undefined &&
				(config.min_branch_length < 4 || config.min_branch_length > 24)
			) {
				errors.push('Minimum branch length must be between 4 and 24 pixels');
			}
			if (
				config.douglas_peucker_epsilon !== undefined &&
				(config.douglas_peucker_epsilon < 0.5 || config.douglas_peucker_epsilon > 3.0)
			) {
				errors.push('Douglas-Peucker epsilon must be between 0.5 and 3.0 pixels');
			}
			// Warn about edge-specific features being used with centerline
			if (config.enable_flow_tracing || config.enable_bezier_fitting || config.enable_etf_fdog) {
				errors.push(
					'Flow tracing, Bézier fitting, and ETF/FDoG are not applicable to centerline backend'
				);
			}
		}

		// Superpixel backend validation
		if (config.backend === 'superpixel') {
			if (
				config.num_superpixels !== undefined &&
				(config.num_superpixels < 20 || config.num_superpixels > 1000)
			) {
				errors.push('Number of superpixels must be between 20 and 1000');
			}
			if (config.compactness !== undefined && (config.compactness < 1 || config.compactness > 50)) {
				errors.push('Superpixel compactness must be between 1 and 50');
			}
			if (
				config.slic_iterations !== undefined &&
				(config.slic_iterations < 5 || config.slic_iterations > 15)
			) {
				errors.push('SLIC iterations must be between 5 and 15');
			}
			if (
				config.boundary_epsilon !== undefined &&
				(config.boundary_epsilon < 0.5 || config.boundary_epsilon > 3.0)
			) {
				errors.push('Boundary epsilon must be between 0.5 and 3.0 pixels');
			}
			// Warn about edge-specific features being used with superpixel
			if (config.enable_flow_tracing || config.enable_bezier_fitting || config.enable_etf_fdog) {
				errors.push(
					'Flow tracing, Bézier fitting, and ETF/FDoG are not applicable to superpixel backend'
				);
			}
		}

		// Performance constraints validation
		if (config.max_processing_time_ms !== undefined && config.max_processing_time_ms < 1000) {
			errors.push('Maximum processing time must be at least 1000ms (1 second)');
		}

		// Global output settings validation
		if (
			config.svg_precision !== undefined &&
			(config.svg_precision < 0 || config.svg_precision > 4)
		) {
			errors.push('SVG precision must be between 0 and 4 decimal places');
		}

		return {
			isValid: errors.length === 0,
			errors
		};
	}

	/**
	 * Check if current configuration is valid for processing (legacy method)
	 */
	isConfigValid(): boolean {
		return this.validateConfig().isValid;
	}

	/**
	 * UI MANAGEMENT (from vectorizer-settings.svelte.ts)
	 */

	/**
	 * Toggle advanced settings visibility
	 */
	toggleAdvancedSettings(): void {
		this._state.showAdvancedSettings = !this._state.showAdvancedSettings;
		console.log(`[ConverterSettingsStore] Advanced settings: ${this._state.showAdvancedSettings}`);
	}

	/**
	 * Toggle section expansion
	 */
	toggleSection(section: string): void {
		const newExpanded = new Set(this._state.expandedSections);
		if (newExpanded.has(section)) {
			newExpanded.delete(section);
		} else {
			newExpanded.add(section);
		}
		this._state.expandedSections = newExpanded;
		console.log(
			`[ConverterSettingsStore] Section '${section}' ${newExpanded.has(section) ? 'expanded' : 'collapsed'}`
		);
	}

	/**
	 * Get parameter sections based on current backend
	 * CRITICAL: Extracted from vectorizer-settings.svelte.ts with all logic preserved
	 */
	getParameterSections(): ParameterSection[] {
		const backend = this._state.config.backend;
		const sections: ParameterSection[] = [
			{
				id: 'core',
				title: 'Core Settings',
				description: 'Essential processing parameters',
				parameters: ['detail', 'stroke_width', 'noise_filtering']
			},
			{
				id: 'multipass',
				title: 'Multi-pass Processing',
				description: 'Directional processing for enhanced quality',
				parameters: ['multipass', 'pass_count', 'reverse_pass', 'diagonal_pass'],
				condition: backend === 'edge'
			},
			{
				id: 'artistic',
				title: 'Artistic Effects',
				description: 'Hand-drawn aesthetics and styling',
				parameters: ['hand_drawn_preset', 'variable_weights', 'tremor_strength', 'tapering']
			}
		];

		// Add backend-specific sections
		switch (backend) {
			case 'edge':
				sections.push(
					{
						id: 'advanced-edge',
						title: 'Advanced Edge Detection',
						description: 'ETF/FDoG edge enhancement algorithms',
						parameters: [
							'enable_etf_fdog',
							'etf_radius',
							'etf_iterations',
							'etf_coherency_tau',
							'fdog_sigma_s',
							'fdog_sigma_c',
							'fdog_tau',
							'nms_low',
							'nms_high'
						]
					},
					{
						id: 'flow-tracing',
						title: 'Flow-guided Tracing',
						description: 'Advanced flow-based line tracing',
						parameters: [
							'enable_flow_tracing',
							'trace_min_gradient',
							'trace_min_coherency',
							'trace_max_gap',
							'trace_max_length'
						]
					},
					{
						id: 'bezier-fitting',
						title: 'Bézier Curve Fitting',
						description: 'Smooth curve generation from traced lines',
						parameters: [
							'enable_bezier_fitting',
							'fit_lambda_curvature',
							'fit_max_error',
							'fit_split_angle'
						]
					},
					{
						id: 'noise-filtering-advanced',
						title: 'Advanced Noise Filtering',
						description: 'Fine-tune noise reduction parameters',
						parameters: ['noise_filter_spatial_sigma', 'noise_filter_range_sigma']
					},
					{
						id: 'multipass-advanced',
						title: 'Advanced Multi-pass',
						description: 'Fine-tune multi-pass processing behavior',
						parameters: [
							'multipass_mode',
							'conservative_detail',
							'aggressive_detail',
							'directional_strength_threshold'
						]
					}
				);
				break;

			case 'dots':
				sections.push(
					{
						id: 'dots-basic',
						title: 'Basic Stippling',
						description: 'Dot placement and sizing parameters',
						parameters: [
							'dot_density_threshold',
							'min_radius',
							'max_radius',
							'adaptive_sizing',
							'dot_initialization_pattern'
						]
					},
					{
						id: 'dots-advanced',
						title: 'Advanced Stippling',
						description: 'Advanced dot placement and appearance',
						parameters: [
							'background_tolerance',
							'poisson_disk_sampling',
							'min_distance_factor',
							'grid_resolution',
							'gradient_based_sizing',
							'local_variance_scaling',
							'color_clustering',
							'opacity_variation'
						]
					}
				);
				break;

			case 'superpixel':
				sections.push(
					{
						id: 'superpixel-basic',
						title: 'Basic Region Settings',
						description: 'Core superpixel segmentation parameters',
						parameters: [
							'num_superpixels',
							'compactness',
							'slic_iterations',
							'superpixel_initialization_pattern'
						]
					},
					{
						id: 'superpixel-advanced',
						title: 'Advanced Region Settings',
						description: 'Fine-tune region boundaries and processing',
						parameters: [
							'min_region_size',
							'color_distance',
							'spatial_distance_weight',
							'fill_regions',
							'stroke_regions',
							'simplify_boundaries',
							'boundary_epsilon'
						]
					}
				);
				break;

			case 'centerline':
				sections.push(
					{
						id: 'centerline-basic',
						title: 'Basic Centerline',
						description: 'Core skeleton extraction parameters',
						parameters: [
							'enable_adaptive_threshold',
							'window_size',
							'sensitivity_k',
							'thinning_algorithm'
						]
					},
					{
						id: 'centerline-filtering',
						title: 'Branch Processing',
						description: 'Filter and process skeleton branches',
						parameters: [
							'min_branch_length',
							'micro_loop_removal',
							'max_join_distance',
							'max_join_angle',
							'edt_bridge_check'
						]
					},
					{
						id: 'centerline-modulation',
						title: 'Width Modulation',
						description: 'Variable width line generation',
						parameters: ['enable_width_modulation', 'edt_radius_ratio', 'width_modulation_range']
					},
					{
						id: 'centerline-smoothing',
						title: 'Path Smoothing',
						description: 'Simplify and smooth generated paths',
						parameters: ['douglas_peucker_epsilon', 'adaptive_simplification', 'use_optimized']
					}
				);
				break;
		}

		// Color settings section
		sections.push({
			id: 'color',
			title: 'Color Processing',
			description: 'Color preservation and sampling settings',
			parameters: ['preserve_colors', 'color_sampling', 'color_accuracy']
		});

		return sections.filter((section) => !section.condition || section.condition);
	}

	/**
	 * Get recovery suggestions for configuration errors
	 */
	getRecoverySuggestions(): string[] {
		const validation = this.validateConfig();
		if (validation.isValid) return [];

		const suggestions: string[] = [];

		// Configuration-specific suggestions
		suggestions.push('Reset to default settings');
		suggestions.push('Try a different algorithm or preset');

		// Backend-specific suggestions based on current backend
		const backend = this._state.config.backend;
		if (backend === 'dots' && validation.errors.some((e) => e.includes('radius'))) {
			suggestions.push('Adjust dot size settings - ensure minimum < maximum');
		}
		if (backend === 'centerline' && validation.errors.some((e) => e.includes('branch'))) {
			suggestions.push('Adjust branch filtering settings');
		}
		if (backend === 'superpixel' && validation.errors.some((e) => e.includes('superpixels'))) {
			suggestions.push('Adjust number of regions or compactness');
		}

		return suggestions;
	}
}

// Export singleton instance
export const converterSettings = new ConverterSettingsStore();
