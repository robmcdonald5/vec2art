/**
 * LEGACY COMPATIBILITY: Vectorizer Store
 * 
 * This file maintains backwards compatibility by re-exporting the new
 * unified converter store. The original 1,527-line monolithic store
 * has been refactored into functionally separated stores.
 * 
 * This ensures existing imports continue to work without modification.
 */

// Re-export everything from the new unified store
export * from './converter.svelte';

// Maintain the original export name for full backwards compatibility
export { vectorizerStore } from './converter.svelte';

/**
 * ARCHITECTURAL NOTE:
 * 
 * The original vectorizer.svelte.ts (1,527 lines) suffered from "abstraction layering syndrome" -
 * it was doing EVERYTHING:
 * - WASM lifecycle management
 * - Parameter validation and normalization  
 * - Image processing and batch processing
 * - Error recovery and panic detection
 * - File management and conversion
 * - Statistics and utilities
 * 
 * This has been refactored into clean functional separation:
 * - converter-wasm.svelte.ts: WASM lifecycle and recovery (300-400 lines)
 * - converter-settings.svelte.ts: Parameters, presets, validation (400-500 lines)
 * - converter-state.svelte.ts: Processing, files, results (800-900 lines)
 * - converter.svelte.ts: Unified backwards-compatible interface
 * 
 * Benefits:
 * ✅ Easier to test each concern independently
 * ✅ Clear boundaries and responsibilities
 * ✅ Reduced complexity in each store
 * ✅ All functionality preserved
 * ✅ Backwards compatibility maintained
 * ✅ Better maintainability and debugging
 */