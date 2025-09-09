/**
 * LEGACY COMPATIBILITY: Vectorizer Settings Store
 *
 * This file maintains backwards compatibility by re-exporting from the new
 * converter-settings store. The original settings functionality has been
 * merged and enhanced in the new functionally separated architecture.
 */

// Re-export main functionality from the new settings store
export {
	converterSettings as vectorizerSettings,
	type SettingsMode,
	type ParameterSection
} from './converter-settings.svelte';

// Also export the class if needed
export { ConverterSettingsStore as VectorizerSettingsStore } from './converter-settings.svelte';

/**
 * ARCHITECTURAL NOTE:
 *
 * The original vectorizer-settings.svelte.ts (395 lines) handled:
 * - Preset management (preset/manual/hybrid modes)
 * - Parameter updates and backend switching
 * - UI organization (sections, advanced settings)
 * - Backend-specific defaults
 *
 * This functionality has been merged with parameter validation and normalization
 * from the old vectorizer.svelte.ts into a unified converter-settings.svelte.ts
 * that provides a single source of truth for all parameter-related concerns.
 *
 * New features added during consolidation:
 * ✅ Parameter normalization (from vectorizer.svelte.ts)
 * ✅ Comprehensive validation with detailed error reporting
 * ✅ Per-algorithm configuration management
 * ✅ Enhanced backend switching logic
 * ✅ Better error recovery suggestions
 */
