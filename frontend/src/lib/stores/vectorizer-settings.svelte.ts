/**
 * Unified Vectorizer Settings Store
 * Manages preset selection, manual overrides, and final configuration
 */

import type { StylePreset } from '$lib/presets/types';
import type { VectorizerConfig, VectorizerBackend } from '$lib/types/vectorizer';
import { presetToVectorizerConfig, mergeWithUserConfig } from '$lib/presets/converter';
import { DEFAULT_CONFIG, getDefaultConfigForBackend } from '$lib/types/vectorizer';

export type SettingsMode = 'preset' | 'manual' | 'hybrid';

export class VectorizerSettingsStore {
	// Core state - start in manual mode since presets aren't ready yet
	mode = $state<SettingsMode>('manual');
	selectedPreset = $state<StylePreset | null>(null);
	manualOverrides = $state<Partial<VectorizerConfig>>({});

	// Derived final configuration
	finalConfig = $derived.by((): VectorizerConfig => {
		switch (this.mode) {
			case 'preset':
				return this.selectedPreset ? presetToVectorizerConfig(this.selectedPreset) : DEFAULT_CONFIG;

			case 'manual': {
				// Use backend-specific defaults when in manual mode
				const backend = this.manualOverrides.backend || 'edge';
				const baseConfig = getDefaultConfigForBackend(backend);
				return { ...baseConfig, ...this.manualOverrides };
			}

			case 'hybrid':
				if (this.selectedPreset) {
					const baseConfig = presetToVectorizerConfig(this.selectedPreset);
					return mergeWithUserConfig(baseConfig, this.manualOverrides);
				}
				// Use backend-specific defaults as fallback
				const backend = this.manualOverrides.backend || 'edge';
				const baseConfig = getDefaultConfigForBackend(backend);
				return { ...baseConfig, ...this.manualOverrides };

			default:
				return DEFAULT_CONFIG;
		}
	});

	// UI state
	showAdvancedSettings = $state(false);
	expandedSections = $state<Set<string>>(new Set(['core']));

	/**
	 * Select a preset and switch to preset mode
	 */
	selectPreset(preset: StylePreset | null) {
		this.selectedPreset = preset;
		if (preset) {
			this.mode = 'preset';
			// Clear manual overrides when switching to pure preset mode
			this.manualOverrides = {};
		} else {
			this.mode = 'manual';
		}
	}

	/**
	 * Switch to hybrid mode (preset base + manual overrides)
	 */
	enableHybridMode() {
		if (this.selectedPreset) {
			this.mode = 'hybrid';
		}
	}

	/**
	 * Switch to full manual mode
	 */
	enableManualMode() {
		this.mode = 'manual';
		this.selectedPreset = null;
	}

	/**
	 * Update a specific parameter (triggers hybrid mode if preset selected)
	 */
	updateParameter<K extends keyof VectorizerConfig>(key: K, value: VectorizerConfig[K]) {
		// Special handling for backend changes
		if (key === 'backend' && value !== this.finalConfig.backend) {
			const newBackend = value as VectorizerBackend;
			const backendDefaults = getDefaultConfigForBackend(newBackend);
			
			// Apply backend-specific defaults for critical settings
			// Only apply if not already explicitly set by user
			const updatedOverrides: Partial<VectorizerConfig> = {
				...this.manualOverrides,
				[key]: value
			};
			
			// Apply backend-specific defaults if not already overridden
			if (!('preserve_colors' in this.manualOverrides)) {
				updatedOverrides.preserve_colors = backendDefaults.preserve_colors;
			}
			if (!('stroke_width' in this.manualOverrides)) {
				updatedOverrides.stroke_width = backendDefaults.stroke_width;
			}
			if (!('detail' in this.manualOverrides)) {
				updatedOverrides.detail = backendDefaults.detail;
			}
			
			this.manualOverrides = updatedOverrides;
		} else {
			this.manualOverrides = {
				...this.manualOverrides,
				[key]: value
			};
		}

		// Auto-switch to hybrid mode if we have a preset selected
		if (this.selectedPreset && this.mode === 'preset') {
			this.mode = 'hybrid';
		} else if (!this.selectedPreset) {
			this.mode = 'manual';
		}
	}

	/**
	 * Batch update multiple parameters
	 */
	updateParameters(updates: Partial<VectorizerConfig>) {
		this.manualOverrides = {
			...this.manualOverrides,
			...updates
		};

		// Auto-switch modes as needed
		if (this.selectedPreset && this.mode === 'preset') {
			this.mode = 'hybrid';
		} else if (!this.selectedPreset) {
			this.mode = 'manual';
		}
	}

	/**
	 * Reset to preset defaults (clears manual overrides)
	 */
	resetToPreset() {
		this.manualOverrides = {};
		this.mode = this.selectedPreset ? 'preset' : 'manual';
	}

	/**
	 * Toggle advanced settings visibility
	 */
	toggleAdvancedSettings() {
		this.showAdvancedSettings = !this.showAdvancedSettings;
	}

	/**
	 * Toggle section expansion
	 */
	toggleSection(section: string) {
		const newExpanded = new Set(this.expandedSections);
		if (newExpanded.has(section)) {
			newExpanded.delete(section);
		} else {
			newExpanded.add(section);
		}
		this.expandedSections = newExpanded;
	}

	/**
	 * Get parameter sections based on current backend
	 */
	getParameterSections(): ParameterSection[] {
		const backend = this.finalConfig.backend;
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
						parameters: [
							'noise_filter_spatial_sigma',
							'noise_filter_range_sigma'
						]
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
						parameters: [
							'enable_width_modulation',
							'edt_radius_ratio',
							'width_modulation_range'
						]
					},
					{
						id: 'centerline-smoothing',
						title: 'Path Smoothing',
						description: 'Simplify and smooth generated paths',
						parameters: [
							'douglas_peucker_epsilon',
							'adaptive_simplification',
							'use_optimized'
						]
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
}

export interface ParameterSection {
	id: string;
	title: string;
	description: string;
	parameters: (keyof VectorizerConfig)[];
	condition?: boolean;
}

// Global instance
export const vectorizerSettings = new VectorizerSettingsStore();
