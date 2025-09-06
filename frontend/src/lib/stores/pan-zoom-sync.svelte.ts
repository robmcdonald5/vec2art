/**
 * Pan/Zoom Synchronization Store
 *
 * Manages synchronized pan/zoom state between before/after image panels
 * using Svelte 5 runes for reactive state management.
 */

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
}

const defaultState: PanZoomState = { scale: 1, x: 0, y: 0 };

/**
 * Create a pan/zoom synchronization store
 */
export function createPanZoomSyncStore(): PanZoomSyncStore {
	let originalState = $state<PanZoomState>({ ...defaultState });
	let convertedState = $state<PanZoomState>({ ...defaultState });
	let isSyncEnabled = $state(true);

	// Preserved states for maintaining zoom/pan during conversions
	let preservedOriginalState: PanZoomState | null = null;
	let preservedConvertedState: PanZoomState | null = null;

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
			originalState = { ...newState };

			// If sync is enabled, update converted state too
			if (isSyncEnabled) {
				convertedState = { ...newState };
			}
		},

		updateConvertedState(newState: PanZoomState) {
			convertedState = { ...newState };

			// If sync is enabled, update original state too
			if (isSyncEnabled) {
				originalState = { ...newState };
			}
		},

		syncStates(sourceState: PanZoomState) {
			const newState = { ...sourceState };
			originalState = newState;
			convertedState = newState;
		},

		toggleSync() {
			isSyncEnabled = !isSyncEnabled;

			// When enabling sync, sync to the original state
			if (isSyncEnabled) {
				convertedState = { ...originalState };
			}
		},

		resetStates() {
			originalState = { ...defaultState };
			convertedState = { ...defaultState };
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
			// Restore saved states after conversion/re-render
			if (preservedOriginalState) {
				originalState = { ...preservedOriginalState };
			}

			if (preservedConvertedState) {
				// Handle different sync modes appropriately
				if (isSyncEnabled) {
					// In sync mode, use the original state for both
					convertedState = { ...(preservedOriginalState || preservedConvertedState) };
				} else {
					// In independent mode, preserve each state separately
					convertedState = { ...preservedConvertedState };
				}
			} else if (preservedOriginalState) {
				// Pre-conversion state: inherit from original regardless of sync mode
				// This handles the case where preview doesn't exist yet
				convertedState = { ...preservedOriginalState };
			}

			console.log('[PanZoomStore] States restored:', {
				original: $state.snapshot(originalState),
				converted: $state.snapshot(convertedState),
				syncEnabled: isSyncEnabled
			});
		}
	};
}

// Global store instance for the converter
export const panZoomStore = createPanZoomSyncStore();
