/**
 * Pan/Zoom Synchronization Store
 *
 * Manages synchronized pan/zoom state between before/after image panels
 * using Svelte 5 runes for reactive state management with persistence.
 */

import { converterPersistence } from './converter-persistence';

export interface PanZoomState {
	scale: number;
	x: number;
	y: number;
}

export interface PanZoomSyncStore {
	// Current pan/zoom states
	readonly originalState: PanZoomState;
	readonly convertedState: PanZoomState;
	readonly isSyncEnabled: boolean;

	// Control functions
	updateOriginalState: (state: PanZoomState) => void;
	updateConvertedState: (state: PanZoomState) => void;
	syncStates: (sourceState: PanZoomState) => void;
	toggleSync: () => void;
	resetStates: () => void;
	preserveStates: () => void;
	restoreStates: () => void;
	// Failsafe recovery
	recoverFromCorruption: () => void;
}

const defaultState: PanZoomState = { scale: 1, x: 0, y: 0 };

/**
 * Validate pan/zoom state and return a safe version
 * This prevents UI from getting stuck in invalid states
 */
function validatePanZoomState(state: PanZoomState, fallbackState?: PanZoomState): PanZoomState {
	// Check for invalid values that can break the UI
	const isInvalid = 
		!state ||
		typeof state.scale !== 'number' ||
		typeof state.x !== 'number' ||
		typeof state.y !== 'number' ||
		!isFinite(state.scale) ||
		!isFinite(state.x) ||
		!isFinite(state.y) ||
		state.scale <= 0 ||
		state.scale < 0.5 || // Reject overly zoomed out states (less than 50%)
		state.scale > 10 || // Reject overly zoomed in states (more than 1000%)
		Math.abs(state.x) > 10000 || // Extreme pan protection  
		Math.abs(state.y) > 10000;

	if (isInvalid) {
		console.warn('🚨 [PanZoomStore] INVALID STATE DETECTED - RESETTING TO DEFAULT:', {
			invalid: state,
			fallback: fallbackState || defaultState,
			reasons: {
				notObject: !state,
				invalidScale: typeof state.scale !== 'number' || !isFinite(state.scale) || state.scale <= 0 || state.scale < 0.5 || state.scale > 10,
				invalidX: typeof state.x !== 'number' || !isFinite(state.x) || Math.abs(state.x) > 10000,
				invalidY: typeof state.y !== 'number' || !isFinite(state.y) || Math.abs(state.y) > 10000
			}
		});
		console.trace('🚨 [PanZoomStore] Stack trace for invalid state:');
		return fallbackState || defaultState;
	}

	console.log('✅ [PanZoomStore] State validation passed:', state);
	return state;
}

/**
 * Create a pan/zoom synchronization store with update deduplication and persistence
 */
export function createPanZoomSyncStore(): PanZoomSyncStore {
	// Load initial state from persistence if available
	const persistedState = converterPersistence.loadPanZoomState();
	console.log('🔍 [PanZoomStore] Loading persisted state:', persistedState);
	console.log('🔍 [PanZoomStore] Default state:', defaultState);
	
	let originalState = $state<PanZoomState>(persistedState?.originalState || { ...defaultState });
	let convertedState = $state<PanZoomState>(persistedState?.convertedState || { ...defaultState });
	let isSyncEnabled = $state(persistedState?.isSyncEnabled ?? true);
	
	console.log('🔍 [PanZoomStore] Final initial states:', {
		original: originalState,
		converted: convertedState,
		syncEnabled: isSyncEnabled
	});

	// Preserved states for maintaining zoom/pan during conversions
	let preservedOriginalState: PanZoomState | null = null;
	let preservedConvertedState: PanZoomState | null = null;

	// Function to save current state to persistence
	const saveState = () => {
		converterPersistence.savePanZoomState({
			originalState: { ...originalState },
			convertedState: { ...convertedState },
			isSyncEnabled
		});
	};

	return {
		get originalState() {
			return originalState;
		},

		get convertedState() {
			return convertedState;
		},

		get isSyncEnabled() {
			return isSyncEnabled;
		},

		updateOriginalState(newState: PanZoomState) {
			// Validate state with fallback to default only (no cross-referencing to avoid loops)
			const safeState = validatePanZoomState(newState);
			
			console.log('[PanZoomStore] updateOriginalState:', {
				input: newState,
				validated: safeState,
				syncEnabled: isSyncEnabled
			});
			
			originalState = { ...safeState };

			// If sync is enabled, update converted state too
			if (isSyncEnabled) {
				convertedState = { ...safeState };
				console.log('[PanZoomStore] Sync enabled - also updated converted state to:', $state.snapshot(convertedState));
			}

			// Save state to persistence (debounced)
			setTimeout(saveState, 0);
		},

		updateConvertedState(newState: PanZoomState) {
			// Validate state with fallback to default only (no cross-referencing to avoid loops)
			const safeState = validatePanZoomState(newState);
			
			console.log('[PanZoomStore] updateConvertedState:', {
				input: newState,
				validated: safeState,
				syncEnabled: isSyncEnabled
			});
			
			convertedState = { ...safeState };

			// If sync is enabled, update original state too
			if (isSyncEnabled) {
				originalState = { ...safeState };
				console.log('[PanZoomStore] Sync enabled - also updated original state to:', $state.snapshot(originalState));
			}

			// Save state to persistence (debounced)
			setTimeout(saveState, 0);
		},

		syncStates(sourceState: PanZoomState) {
			// Validate the source state before applying it to both panels
			const safeState = validatePanZoomState(sourceState);
			
			console.log('[PanZoomStore] syncStates:', {
				input: sourceState,
				validated: safeState,
				prevOriginal: $state.snapshot(originalState),
				prevConverted: $state.snapshot(convertedState)
			});
			
			originalState = { ...safeState };
			convertedState = { ...safeState };

			// Save state to persistence
			saveState();
		},

		toggleSync() {
			console.log('[PanZoomStore] toggleSync:', {
				previousSync: isSyncEnabled,
				originalState: $state.snapshot(originalState),
				convertedState: $state.snapshot(convertedState)
			});
			
			isSyncEnabled = !isSyncEnabled;

			// When enabling sync, sync to the original state
			if (isSyncEnabled) {
				convertedState = { ...originalState };
				console.log('[PanZoomStore] Sync enabled - synced converted to original:', $state.snapshot(convertedState));
			}

			// Save state to persistence
			saveState();
		},

		resetStates() {
			originalState = { ...defaultState };
			convertedState = { ...defaultState };
			
			// Save state to persistence
			saveState();
		},

		preserveStates() {
			// Save current states before conversion/re-render
			preservedOriginalState = { ...originalState };
			preservedConvertedState = { ...convertedState };
			console.log('[PanZoomStore] States preserved:', {
				original: preservedOriginalState,
				converted: preservedConvertedState,
				syncEnabled: isSyncEnabled
			});
		},

		restoreStates() {
			// Restore saved states after conversion/re-render with validation
			if (preservedOriginalState) {
				const safeOriginalState = validatePanZoomState(preservedOriginalState);
				originalState = { ...safeOriginalState };
			}

			if (preservedConvertedState) {
				// Handle different sync modes appropriately
				if (isSyncEnabled) {
					// In sync mode, use the original state for both
					const sourceState = preservedOriginalState || preservedConvertedState;
					const safeState = validatePanZoomState(sourceState);
					convertedState = { ...safeState };
				} else {
					// In independent mode, preserve each state separately
					const safeConvertedState = validatePanZoomState(preservedConvertedState);
					convertedState = { ...safeConvertedState };
				}
			} else if (preservedOriginalState) {
				// Pre-conversion state: inherit from original regardless of sync mode
				// This handles the case where preview doesn't exist yet
				const safeState = validatePanZoomState(preservedOriginalState);
				convertedState = { ...safeState };
			}

			console.log('[PanZoomStore] States restored:', {
				original: $state.snapshot(originalState),
				converted: $state.snapshot(convertedState),
				syncEnabled: isSyncEnabled
			});
		},

		recoverFromCorruption() {
			console.warn('[PanZoomStore] Manual recovery triggered - resetting to safe defaults');
			
			// Force validation of current states
			const safeOriginal = validatePanZoomState(originalState);
			const safeConverted = validatePanZoomState(convertedState);
			
			// If both states are corrupted, reset completely
			if (safeOriginal === defaultState && safeConverted === defaultState) {
				console.warn('[PanZoomStore] Both states corrupted, performing full reset');
				originalState = { ...defaultState };
				convertedState = { ...defaultState };
			} else {
				// Use whichever state is valid, or sync them
				originalState = { ...safeOriginal };
				convertedState = { ...safeConverted };
			}
			
			// Clear any corrupted preserved states
			preservedOriginalState = null;
			preservedConvertedState = null;
			
			console.log('[PanZoomStore] Recovery complete:', {
				original: $state.snapshot(originalState),
				converted: $state.snapshot(convertedState)
			});
		}
	};
}

// Global store instance for the converter
export const panZoomStore = createPanZoomSyncStore();