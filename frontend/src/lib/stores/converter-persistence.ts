/**
 * Simple persistence utilities for converter state
 * Replacement for legacy converter-persistence module
 */

export interface PanZoomState {
	originalState?: { x: number; y: number; scale: number };
	convertedState?: { x: number; y: number; scale: number };
	isSyncEnabled?: boolean;
	// Legacy properties for backwards compatibility
	x?: number;
	y?: number;
	scale?: number;
}

export const converterPersistence = {
	loadPanZoomState(): PanZoomState | null {
		try {
			const stored = localStorage.getItem('vec2art-pan-zoom');
			return stored ? JSON.parse(stored) : null;
		} catch {
			return null;
		}
	},

	savePanZoomState(state: PanZoomState): void {
		try {
			localStorage.setItem('vec2art-pan-zoom', JSON.stringify(state));
		} catch {
			// Ignore storage errors
		}
	}
};
