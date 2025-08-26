/**
 * Unified Vectorizer Settings Store
 * Manages preset selection, manual overrides, and final configuration
 */

import type { StylePreset } from '$lib/presets/types';
import type { VectorizerConfig } from '$lib/types/vectorizer';
import { presetToVectorizerConfig, mergeWithUserConfig } from '$lib/presets/converter';
import { DEFAULT_CONFIG } from '$lib/types/vectorizer';

export type SettingsMode = 'preset' | 'manual' | 'hybrid';

export class VectorizerSettingsStore {
	// Core state
	mode = $state<SettingsMode>('preset');
	selectedPreset = $state<StylePreset | null>(null);
	manualOverrides = $state<Partial<VectorizerConfig>>({});
	
	// Derived final configuration
	finalConfig = $derived.by((): VectorizerConfig => {
		switch (this.mode) {
			case 'preset':
				return this.selectedPreset 
					? presetToVectorizerConfig(this.selectedPreset)
					: DEFAULT_CONFIG;
					
			case 'manual':
				return { ...DEFAULT_CONFIG, ...this.manualOverrides };
				
			case 'hybrid':
				if (this.selectedPreset) {
					const baseConfig = presetToVectorizerConfig(this.selectedPreset);
					return mergeWithUserConfig(baseConfig, this.manualOverrides);
				}
				return { ...DEFAULT_CONFIG, ...this.manualOverrides };
				
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
	updateParameter<K extends keyof VectorizerConfig>(
		key: K, 
		value: VectorizerConfig[K]
	) {
		this.manualOverrides = {
			...this.manualOverrides,
			[key]: value
		};
		
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
			case 'dots':
				sections.push({
					id: 'dots',
					title: 'Stippling & Dots',
					description: 'Dot placement and sizing parameters',
					parameters: ['dot_density_threshold', 'min_radius', 'max_radius', 'adaptive_sizing', 'poisson_disk_sampling']
				});
				break;
				
			case 'superpixel':
				sections.push({
					id: 'superpixel',
					title: 'Region Settings',
					description: 'Superpixel segmentation parameters',
					parameters: ['num_superpixels', 'compactness', 'fill_regions', 'stroke_regions']
				});
				break;
				
			case 'centerline':
				sections.push({
					id: 'centerline',
					title: 'Centerline Extraction',
					description: 'Skeleton tracing parameters',
					parameters: ['enable_adaptive_threshold', 'window_size', 'min_branch_length', 'douglas_peucker_epsilon']
				});
				break;
		}
		
		// Color settings section
		sections.push({
			id: 'color',
			title: 'Color Processing',
			description: 'Color preservation and sampling settings',
			parameters: ['preserve_colors', 'color_sampling', 'color_accuracy']
		});
		
		return sections.filter(section => !section.condition || section.condition);
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