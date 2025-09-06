/**
 * Algorithm-Specific Style Preset Configurations
 * Each preset is designed for specific algorithms based on research of their strengths
 */

import type {
	StylePreset,
	PresetCollection,
	EdgePreset,
	CenterlinePreset,
	DotsPreset,
	SuperpixelPreset
} from './types';

// ==============================================
// CENTERLINE ALGORITHM PRESETS
// Best for: Logos, text, simple shapes, technical drawings
// ==============================================

/**
 * Corporate Logo Preset - CENTERLINE ALGORITHM
 * Optimized for clean, precise logo extraction with skeleton-based tracing
 */
const corporateLogoPreset: CenterlinePreset = {
	metadata: {
		id: 'corporate-logo',
		name: 'Corporate Logo',
		category: 'professional',
		description:
			'Clean, precise logo extraction using centerline skeleton tracing. Perfect for brand assets and simple graphics.',
		icon: 'Building2',
		bestFor: ['Company logos', 'Brand marks', 'Simple icons', 'Letterheads'],
		features: ['Skeleton extraction', 'Clean paths', 'High precision', 'Scalable vectors'],
		marketSegment: 'corporate',
		complexity: 'simple',
		estimatedTime: '<1s'
	},
	backend: 'centerline',
	config: {
		outputFormat: 'svg',
		scale: 1.0,
		blur: 0.3,
		details: 'medium'
	},
	overrides: {
		centerline: {
			threshold: 0.4,
			minPathLength: 8,
			smoothing: 0.9,
			precision: 'high'
		},
		handDrawn: {
			tremor: 0,
			variableWeight: false,
			tapering: false
		}
	},
	centerlineSpecific: {
		precision: 'maximum',
		contentType: 'logo',
		optimization: 'quality'
	}
};

/**
 * Technical Drawing Preset - CENTERLINE ALGORITHM
 * Optimized for CAD drawings, blueprints, and technical documentation
 */
const technicalDrawingPreset: CenterlinePreset = {
	metadata: {
		id: 'technical-drawing',
		name: 'Technical Drawing',
		category: 'professional',
		description:
			'Precise line extraction for engineering drawings, CAD files, and technical documentation.',
		icon: 'Ruler',
		bestFor: ['CAD drawings', 'Blueprints', 'Technical diagrams', 'Engineering schematics'],
		features: ['High precision', 'Uniform lines', 'Technical accuracy', 'Clean extraction'],
		marketSegment: 'technical',
		complexity: 'simple',
		estimatedTime: '<1s'
	},
	backend: 'centerline',
	config: {
		outputFormat: 'svg',
		scale: 1.0,
		blur: 0.2,
		details: 'high'
	},
	overrides: {
		centerline: {
			threshold: 0.3,
			minPathLength: 12,
			smoothing: 0.5,
			precision: 'high'
		},
		handDrawn: {
			tremor: 0,
			variableWeight: false,
			tapering: false
		}
	},
	centerlineSpecific: {
		precision: 'maximum',
		contentType: 'technical',
		optimization: 'quality'
	}
};

/**
 * Text & Typography Preset - CENTERLINE ALGORITHM
 * Specialized for text extraction and typography conversion
 */
const textTypographyPreset: CenterlinePreset = {
	metadata: {
		id: 'text-typography',
		name: 'Text & Typography',
		category: 'professional',
		description: 'Precise text and typography extraction with optimal character recognition.',
		icon: 'Type',
		bestFor: ['Text extraction', 'Typography', 'Signage', 'Document conversion'],
		features: ['Character precision', 'Text optimization', 'Font preservation', 'Clean letters'],
		marketSegment: 'corporate',
		complexity: 'simple',
		estimatedTime: '<1s'
	},
	backend: 'centerline',
	config: {
		outputFormat: 'svg',
		scale: 1.0,
		blur: 0.1,
		details: 'high'
	},
	overrides: {
		centerline: {
			threshold: 0.35,
			minPathLength: 6,
			smoothing: 0.7,
			precision: 'high'
		},
		handDrawn: {
			tremor: 0,
			variableWeight: false,
			tapering: false
		}
	},
	centerlineSpecific: {
		precision: 'maximum',
		contentType: 'text',
		optimization: 'quality'
	}
};

// ==============================================
// EDGE ALGORITHM PRESETS
// Best for: Photos, detailed illustrations, complex line art
// ==============================================

/**
 * Photo to Sketch Preset - EDGE ALGORITHM
 * Optimized for converting photographs to detailed pencil-like sketches
 */
const photoToSketchPreset: EdgePreset = {
	metadata: {
		id: 'photo-to-sketch',
		name: 'Photo to Sketch',
		category: 'artistic',
		description:
			'Transform photos into detailed pencil sketches using advanced edge detection. Perfect for portraits and complex images.',
		icon: 'Image',
		bestFor: ['Portrait photos', 'Landscape photos', 'Complex images', 'Realistic sketches'],
		features: [
			'Photo optimization',
			'Natural shading',
			'Detail preservation',
			'Multi-pass processing'
		],
		marketSegment: 'general',
		complexity: 'medium',
		estimatedTime: '<2s'
	},
	backend: 'edge',
	config: {
		outputFormat: 'svg',
		scale: 1.0,
		blur: 0.8,
		edgeEnhancement: 0.15,
		details: 'high'
	},
	overrides: {
		edgeDetection: {
			lowThreshold: 0.1,
			highThreshold: 0.25,
			multiPass: true,
			passes: ['standard', 'reverse']
		},
		handDrawn: {
			tremor: 0.3,
			variableWeight: true,
			tapering: true,
			minWeight: 0.8,
			maxWeight: 2.2
		}
	},
	edgeSpecific: {
		complexity: 'photo',
		multiPassOptimal: true,
		handDrawnLevel: 'subtle'
	}
};

/**
 * Hand-Drawn Illustration Preset - EDGE ALGORITHM
 * Creates natural, artistic line work with organic variations
 */
const handDrawnIllustrationPreset: EdgePreset = {
	metadata: {
		id: 'hand-drawn-illustration',
		name: 'Hand-Drawn Illustration',
		category: 'artistic',
		description:
			'Natural, artistic line work with organic variations that mimics hand-drawn illustrations. Great for creative projects.',
		icon: 'Pencil',
		bestFor: ['Illustrations', 'Artistic portraits', 'Creative artwork', 'Expressive sketches'],
		features: [
			'Natural tremor',
			'Variable line weights',
			'Organic tapering',
			'Artistic expression'
		],
		marketSegment: 'creative',
		complexity: 'medium',
		estimatedTime: '<1.5s'
	},
	backend: 'edge',
	config: {
		outputFormat: 'svg',
		scale: 1.0,
		blur: 0.7,
		edgeEnhancement: 0.1,
		details: 'medium'
	},
	overrides: {
		edgeDetection: {
			lowThreshold: 0.08,
			highThreshold: 0.2,
			multiPass: true,
			passes: ['standard', 'reverse', 'diagonal']
		},
		handDrawn: {
			tremor: 0.6,
			variableWeight: true,
			tapering: true,
			minWeight: 0.5,
			maxWeight: 3.0
		}
	},
	edgeSpecific: {
		complexity: 'illustration',
		multiPassOptimal: true,
		handDrawnLevel: 'medium'
	}
};

/**
 * Detailed Line Art Preset - EDGE ALGORITHM
 * Maximum detail extraction for complex artwork and detailed drawings
 */
const detailedLineArtPreset: EdgePreset = {
	metadata: {
		id: 'detailed-line-art',
		name: 'Detailed Line Art',
		category: 'artistic',
		description:
			'Maximum detail extraction for complex artwork. Uses multi-pass edge detection for comprehensive line capture.',
		icon: 'Pen',
		bestFor: ['Complex drawings', 'Detailed artwork', 'Intricate designs', 'Fine illustrations'],
		features: ['Maximum detail', 'Multi-pass processing', 'Comprehensive lines', 'High precision'],
		marketSegment: 'creative',
		complexity: 'medium',
		estimatedTime: '<2.5s'
	},
	backend: 'edge',
	config: {
		outputFormat: 'svg',
		scale: 1.0,
		blur: 0.5,
		edgeEnhancement: 0.2,
		details: 'very-high'
	},
	overrides: {
		edgeDetection: {
			lowThreshold: 0.05,
			highThreshold: 0.18,
			multiPass: true,
			passes: ['standard', 'reverse', 'diagonal']
		},
		handDrawn: {
			tremor: 0.2,
			variableWeight: true,
			tapering: false,
			minWeight: 0.7,
			maxWeight: 1.8
		}
	},
	edgeSpecific: {
		complexity: 'illustration',
		multiPassOptimal: true,
		handDrawnLevel: 'subtle'
	}
};

// ==============================================
// DOTS ALGORITHM PRESETS
// Best for: Stippling, pointillism, artistic textures, vintage effects
// ==============================================

/**
 * Fine Pointillism Preset - DOTS ALGORITHM
 * Neo-impressionist pointillism with fine color dots and artistic blending
 */
const finePointillismPreset: DotsPreset = {
	metadata: {
		id: 'fine-pointillism',
		name: 'Fine Pointillism',
		category: 'artistic',
		description:
			'Neo-impressionist pointillism effect with fine dots and color mixing. Perfect for artistic prints and fine art.',
		icon: 'Sparkles',
		bestFor: ['Fine art', 'Portraits', 'Landscapes', 'Artistic prints'],
		features: ['Color preservation', 'Fine dots', 'Artistic texture', 'Impressionist style'],
		marketSegment: 'creative',
		complexity: 'medium',
		estimatedTime: '<2s'
	},
	backend: 'dots',
	config: {
		outputFormat: 'svg',
		scale: 1.0,
		blur: 0.4,
		edgeEnhancement: 0.1,
		details: 'high'
	},
	overrides: {
		dots: {
			minSize: 0.5,
			maxSize: 2.0,
			density: 0.9,
			colorMode: 'color',
			pattern: 'stipple'
		}
	},
	dotsSpecific: {
		style: 'pointillism',
		density: 'fine',
		colorMode: 'color'
	}
};

/**
 * Vintage Stippling Preset - DOTS ALGORITHM
 * Classic newspaper and print production stippling effects
 */
const vintageStipplingPreset: DotsPreset = {
	metadata: {
		id: 'vintage-stippling',
		name: 'Vintage Stippling',
		category: 'vintage',
		description:
			'Classic stippling and halftone effects reminiscent of vintage newspaper prints. Great for retro designs.',
		icon: 'Newspaper',
		bestFor: ['Retro designs', 'Print production', 'Vintage aesthetics', 'Screen printing'],
		features: ['Halftone patterns', 'Vintage feel', 'Print-ready', 'Monochrome optimization'],
		marketSegment: 'print',
		complexity: 'simple',
		estimatedTime: '<1.5s'
	},
	backend: 'dots',
	config: {
		outputFormat: 'svg',
		scale: 1.0,
		blur: 0.5,
		details: 'medium'
	},
	overrides: {
		dots: {
			minSize: 1.5,
			maxSize: 4.0,
			density: 0.7,
			colorMode: 'monochrome',
			pattern: 'halftone'
		}
	},
	dotsSpecific: {
		style: 'halftone',
		density: 'medium',
		colorMode: 'monochrome'
	}
};

/**
 * Artistic Stippling Preset - DOTS ALGORITHM
 * Modern artistic stippling with adaptive dot placement
 */
const artisticStipplingPreset: DotsPreset = {
	metadata: {
		id: 'artistic-stippling',
		name: 'Artistic Stippling',
		category: 'artistic',
		description:
			'Modern artistic stippling with adaptive dot placement. Creates unique textural effects with variable dot sizes.',
		icon: 'Circle',
		bestFor: ['Modern art', 'Textural effects', 'Creative projects', 'Artistic expression'],
		features: ['Adaptive sizing', 'Variable density', 'Creative placement', 'Modern aesthetic'],
		marketSegment: 'creative',
		complexity: 'medium',
		estimatedTime: '<1.8s'
	},
	backend: 'dots',
	config: {
		outputFormat: 'svg',
		scale: 1.0,
		blur: 0.6,
		details: 'medium'
	},
	overrides: {
		dots: {
			minSize: 0.8,
			maxSize: 3.5,
			density: 0.6,
			colorMode: 'color',
			pattern: 'stipple'
		}
	},
	dotsSpecific: {
		style: 'artistic',
		density: 'medium',
		colorMode: 'color'
	}
};

// ==============================================
// SUPERPIXEL ALGORITHM PRESETS
// Best for: Geometric art, posters, abstract designs, bold regions
// ==============================================

/**
 * Modern Abstract Preset - SUPERPIXEL ALGORITHM
 * Bold geometric shapes perfect for modern art and contemporary designs
 */
const modernAbstractPreset: SuperpixelPreset = {
	metadata: {
		id: 'modern-abstract',
		name: 'Modern Abstract',
		category: 'modern',
		description:
			'Bold, geometric shapes perfect for modern posters and contemporary art. Creates stylized regions with color preservation.',
		icon: 'Shapes',
		bestFor: ['Posters', 'Modern art', 'Album covers', 'Digital graphics'],
		features: ['Geometric shapes', 'Bold regions', 'Color preservation', 'Stylized output'],
		marketSegment: 'digital',
		complexity: 'simple',
		estimatedTime: '<1.5s'
	},
	backend: 'superpixel',
	config: {
		outputFormat: 'svg',
		scale: 1.0,
		blur: 0.3,
		details: 'low'
	},
	overrides: {
		superpixel: {
			regionCount: 50,
			compactness: 10,
			colorSpace: 'lab',
			borderEmphasis: true
		}
	},
	superpixelSpecific: {
		style: 'geometric',
		regionSize: 'medium',
		colorPreservation: 'high'
	}
};

/**
 * Minimalist Poster Preset - SUPERPIXEL ALGORITHM
 * Ultra-simplified shapes and limited colors for striking minimalist designs
 */
const minimalistPosterPreset: SuperpixelPreset = {
	metadata: {
		id: 'minimalist-poster',
		name: 'Minimalist Poster',
		category: 'modern',
		description:
			'Ultra-simplified shapes and limited colors for striking minimalist designs. Perfect for clean, impactful visuals.',
		icon: 'Square',
		bestFor: ['Minimalist art', 'Posters', 'App icons', 'Brand graphics'],
		features: ['Minimal detail', 'Bold shapes', 'Limited colors', 'High impact'],
		marketSegment: 'digital',
		complexity: 'simple',
		estimatedTime: '<1s'
	},
	backend: 'superpixel',
	config: {
		outputFormat: 'svg',
		scale: 0.8,
		blur: 0.5,
		details: 'low'
	},
	overrides: {
		superpixel: {
			regionCount: 20,
			compactness: 20,
			colorSpace: 'lab',
			borderEmphasis: false
		}
	},
	superpixelSpecific: {
		style: 'poster',
		regionSize: 'large',
		colorPreservation: 'stylized'
	}
};

/**
 * Organic Abstract Preset - SUPERPIXEL ALGORITHM
 * Natural, flowing regions perfect for organic abstract art
 */
const organicAbstractPreset: SuperpixelPreset = {
	metadata: {
		id: 'organic-abstract',
		name: 'Organic Abstract',
		category: 'modern',
		description:
			'Natural, flowing regions that create organic abstract compositions. Great for nature-inspired digital art.',
		icon: 'Waves',
		bestFor: ['Abstract art', 'Nature photos', 'Organic designs', 'Fluid compositions'],
		features: ['Organic shapes', 'Natural flow', 'Smooth regions', 'Artistic interpretation'],
		marketSegment: 'creative',
		complexity: 'simple',
		estimatedTime: '<1.2s'
	},
	backend: 'superpixel',
	config: {
		outputFormat: 'svg',
		scale: 1.0,
		blur: 0.4,
		details: 'medium'
	},
	overrides: {
		superpixel: {
			regionCount: 80,
			compactness: 5,
			colorSpace: 'lab',
			borderEmphasis: false
		}
	},
	superpixelSpecific: {
		style: 'organic',
		regionSize: 'small',
		colorPreservation: 'medium'
	}
};

// ==============================================
// ALGORITHM-ORGANIZED PRESET COLLECTION
// ==============================================

/**
 * Algorithm-Organized Preset Collection
 * Organized by algorithm compatibility for optimal performance
 */
export const presetCollection: PresetCollection = {
	version: '1.0.0',
	presets: [
		// CENTERLINE Algorithm Presets (3 total)
		corporateLogoPreset,
		technicalDrawingPreset,
		textTypographyPreset,

		// EDGE Algorithm Presets (3 total)
		photoToSketchPreset,
		handDrawnIllustrationPreset,
		detailedLineArtPreset,

		// DOTS Algorithm Presets (3 total)
		finePointillismPreset,
		vintageStipplingPreset,
		artisticStipplingPreset,

		// SUPERPIXEL Algorithm Presets (3 total)
		modernAbstractPreset,
		minimalistPosterPreset,
		organicAbstractPreset
	],

	// Algorithm-based organization for UI filtering
	byAlgorithm: {
		centerline: ['corporate-logo', 'technical-drawing', 'text-typography'],
		edge: ['photo-to-sketch', 'hand-drawn-illustration', 'detailed-line-art'],
		dots: ['fine-pointillism', 'vintage-stippling', 'artistic-stippling'],
		superpixel: ['modern-abstract', 'minimalist-poster', 'organic-abstract']
	},

	// Category-based organization for traditional UI grouping
	categories: {
		professional: ['corporate-logo', 'technical-drawing', 'text-typography'],
		artistic: [
			'photo-to-sketch',
			'hand-drawn-illustration',
			'detailed-line-art',
			'fine-pointillism',
			'artistic-stippling'
		],
		vintage: ['vintage-stippling'],
		modern: ['modern-abstract', 'minimalist-poster', 'organic-abstract'],
		experimental: []
	}
};

// Export individual presets for direct access
export {
	// CENTERLINE Algorithm Presets
	corporateLogoPreset,
	technicalDrawingPreset,
	textTypographyPreset,

	// EDGE Algorithm Presets
	photoToSketchPreset,
	handDrawnIllustrationPreset,
	detailedLineArtPreset,

	// DOTS Algorithm Presets
	finePointillismPreset,
	vintageStipplingPreset,
	artisticStipplingPreset,

	// SUPERPIXEL Algorithm Presets
	modernAbstractPreset,
	minimalistPosterPreset,
	organicAbstractPreset
};

// Helper function to get preset by ID
export function getPresetById(id: string): StylePreset | undefined {
	return presetCollection.presets.find((p) => p.metadata.id === id);
}

// Get presets by algorithm (new primary access method)
export function getPresetsByAlgorithm(
	algorithm: 'centerline' | 'edge' | 'dots' | 'superpixel'
): StylePreset[] {
	const presetIds = presetCollection.byAlgorithm[algorithm] || [];
	return presetCollection.presets.filter((p) => presetIds.includes(p.metadata.id));
}

// Get recommended presets for an image type (cross-algorithm recommendations)
export function getRecommendedPresets(
	imageType: 'photo' | 'logo' | 'drawing' | 'text'
): StylePreset[] {
	switch (imageType) {
		case 'photo':
			// Photos work best with EDGE algorithms, also DOTS for artistic effects
			return [photoToSketchPreset, handDrawnIllustrationPreset, finePointillismPreset];
		case 'logo':
			// Logos work best with CENTERLINE for precision, SUPERPIXEL for modern styles
			return [corporateLogoPreset, textTypographyPreset, minimalistPosterPreset];
		case 'drawing':
			// Drawings work well with EDGE for detail, DOTS for artistic effects
			return [handDrawnIllustrationPreset, detailedLineArtPreset, vintageStipplingPreset];
		case 'text':
			// Text works best with CENTERLINE algorithms for precision
			return [textTypographyPreset, technicalDrawingPreset, corporateLogoPreset];
		default:
			return presetCollection.presets;
	}
}
