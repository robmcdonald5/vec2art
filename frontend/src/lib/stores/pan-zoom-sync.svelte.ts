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
}

const defaultState: PanZoomState = { scale: 1, x: 0, y: 0 };

/**
 * Create a pan/zoom synchronization store
 */
export function createPanZoomSyncStore(): PanZoomSyncStore {
	let originalState = $state<PanZoomState>({ ...defaultState });
	let convertedState = $state<PanZoomState>({ ...defaultState });
	let isSyncEnabled = $state(true);

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
		}
	};
}

// Global store instance for the converter
export const panZoomStore = createPanZoomSyncStore();