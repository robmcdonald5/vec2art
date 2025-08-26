/**
 * Style Preset Type Definitions
 * Defines the structure and types for artistic style presets in vec2art
 */

import type { VectorizerBackend, VectorizerConfig } from '$lib/types/vectorizer';

export interface PresetMetadata {
	id: string;
	name: string;
	category: PresetCategory;
	description: string;
	icon?: string; // Icon name from lucide-svelte
	bestFor: string[];
	features: string[];
	marketSegment: MarketSegment;
	complexity: 'simple' | 'medium' | 'complex';
	estimatedTime: string; // e.g., "<1.5s", "<2s"
}

export type PresetCategory = 
	| 'professional'    // Corporate, technical, precision-focused
	| 'artistic'        // Creative, expressive, stylized
	| 'vintage'         // Retro, classic effects
	| 'modern'          // Contemporary, digital art
	| 'experimental';   // Advanced, unique effects

export type MarketSegment = 
	| 'corporate'       // Business, branding, logos
	| 'technical'       // Engineering, CAD, architecture
	| 'creative'        // Artists, illustrators, designers
	| 'print'           // Print production, screen printing
	| 'digital'         // Web, apps, digital media
	| 'general';        // General purpose, all users

// Preset configuration interface (separate from WASM config)
export interface PresetConfig {
	// Core settings that will be mapped to VectorizerConfig
	details?: 'low' | 'medium' | 'high' | 'very-high';
	strokeWidth?: number;
	blur?: number;
	edgeEnhancement?: number;
	
	// Processing settings
	multipass?: boolean;
	passCount?: number;
	
	// Output settings  
	outputFormat?: 'svg';
	scale?: number;
}

export interface StylePreset {
	metadata: PresetMetadata;
	backend: VectorizerBackend;
	config: PresetConfig;
	// Optional overrides for specific parameters
	overrides?: {
		// Edge backend specific
		edgeDetection?: {
			lowThreshold?: number;
			highThreshold?: number;
			multiPass?: boolean;
			passes?: ('standard' | 'reverse' | 'diagonal')[];
		};
		// Artistic effects
		handDrawn?: {
			tremor?: number;
			variableWeight?: boolean;
			tapering?: boolean;
			minWeight?: number;
			maxWeight?: number;
		};
		// Dots backend specific
		dots?: {
			minSize?: number;
			maxSize?: number;
			density?: number;
			colorMode?: 'monochrome' | 'color' | 'limited';
			pattern?: 'poisson' | 'halftone' | 'stipple';
		};
		// Superpixel backend specific
		superpixel?: {
			regionCount?: number;
			compactness?: number;
			colorSpace?: 'rgb' | 'lab';
			borderEmphasis?: boolean;
		};
		// Centerline backend specific
		centerline?: {
			threshold?: number;
			minPathLength?: number;
			smoothing?: number;
			precision?: 'low' | 'medium' | 'high';
		};
	};
}

export interface PresetCollection {
	version: string;
	presets: StylePreset[];
	// Organize by algorithm backend for algorithm-specific presets
	byAlgorithm: {
		[K in VectorizerBackend]: string[]; // Array of preset IDs
	};
	// Keep categories for UI organization within algorithms
	categories: {
		[K in PresetCategory]: string[]; // Array of preset IDs
	};
}

// Algorithm-specific preset organization
export type AlgorithmPresets = {
	edge: EdgePreset[];
	centerline: CenterlinePreset[];  
	dots: DotsPreset[];
	superpixel: SuperpixelPreset[];
};

// Algorithm-specific preset interfaces
export interface EdgePreset extends StylePreset {
	backend: 'edge';
	edgeSpecific: {
		complexity: 'photo' | 'sketch' | 'illustration' | 'technical';
		multiPassOptimal: boolean;
		handDrawnLevel: 'none' | 'subtle' | 'medium' | 'strong';
	};
}

export interface CenterlinePreset extends StylePreset {
	backend: 'centerline';
	centerlineSpecific: {
		precision: 'standard' | 'high' | 'maximum';
		contentType: 'logo' | 'text' | 'simple-shapes' | 'technical';
		optimization: 'speed' | 'quality';
	};
}

export interface DotsPreset extends StylePreset {
	backend: 'dots';
	dotsSpecific: {
		style: 'stippling' | 'pointillism' | 'halftone' | 'artistic';
		density: 'fine' | 'medium' | 'coarse';
		colorMode: 'monochrome' | 'color' | 'adaptive';
	};
}

export interface SuperpixelPreset extends StylePreset {
	backend: 'superpixel';
	superpixelSpecific: {
		style: 'geometric' | 'organic' | 'poster' | 'abstract';
		regionSize: 'small' | 'medium' | 'large';
		colorPreservation: 'high' | 'medium' | 'stylized';
	};
}

// Preset validation
export function validatePreset(preset: StylePreset): boolean {
	// Basic validation - ensure required fields exist
	if (!preset.metadata?.id || !preset.backend || !preset.config) {
		return false;
	}
	
	// Backend-specific validation
	switch (preset.backend) {
		case 'edge':
		case 'centerline':
		case 'dots':  
		case 'superpixel':
			return true; // All backends are supported
		default:
			return false;
	}
}

// Get presets by category
export function getPresetsByCategory(
	collection: PresetCollection,
	category: PresetCategory
): StylePreset[] {
	const presetIds = collection.categories[category] || [];
	return collection.presets.filter(p => presetIds.includes(p.metadata.id));
}

// Get presets by market segment
export function getPresetsByMarket(
	presets: StylePreset[],
	segment: MarketSegment
): StylePreset[] {
	return presets.filter(p => p.metadata.marketSegment === segment);
}