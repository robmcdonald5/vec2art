/**
 * Style Presets System - Main Export
 * Central export point for all preset-related functionality
 */

// Export all types
export type {
	StylePreset,
	PresetMetadata,
	PresetCategory,
	MarketSegment,
	PresetCollection
} from './types';

// Export preset configurations
export {
	presetCollection,
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
	organicAbstractPreset,
	// Utility functions
	getPresetById,
	getPresetsByAlgorithm,
	getRecommendedPresets
} from './presets';

// Export utility functions
export { validatePreset, getPresetsByCategory, getPresetsByMarket } from './types';

// Export converter utilities
export {
	presetToProcessConfig,
	presetToVectorizerConfig,
	getOptimalPreset,
	isPresetCompatible,
	mergeWithUserConfig
} from './converter';

// Default export of preset collection for convenience
import { presetCollection } from './presets';
export default presetCollection;
