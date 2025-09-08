/**
 * Modern Pan/Zoom Store - Ground-up redesign
 * 
 * Built with Svelte 5 runes for optimal performance and maintainability.
 * Uses CSS transforms with GPU acceleration for smooth interactions.
 * Implements robust validation and clean architectural patterns.
 */

import { converterPersistence } from './converter-persistence';

export interface Transform {
	x: number;
	y: number;
	scale: number;
}

export interface PanZoomConfig {
	syncEnabled: boolean;
	minScale: number;
	maxScale: number;
	maxPan: number;
	smoothingFactor: number;
}

const DEFAULT_TRANSFORM: Transform = { x: 0, y: 0, scale: 1 };
const DEFAULT_CONFIG: PanZoomConfig = {
	syncEnabled: true,
	minScale: 0.5,
	maxScale: 10,
	maxPan: 10000,
	smoothingFactor: 800
};

/**
 * Validate and constrain transform values to prevent UI issues
 */
function validateTransform(transform: Transform, config: PanZoomConfig): Transform {
	return {
		x: Math.max(-config.maxPan, Math.min(config.maxPan, transform.x || 0)),
		y: Math.max(-config.maxPan, Math.min(config.maxPan, transform.y || 0)),
		scale: Math.max(config.minScale, Math.min(config.maxScale, transform.scale || 1))
	};
}

/**
 * Modern Pan/Zoom Store using Svelte 5 runes
 */
export class ModernPanZoomStore {
	private _state = $state({
		original: { ...DEFAULT_TRANSFORM },
		converted: { ...DEFAULT_TRANSFORM },
		config: { ...DEFAULT_CONFIG },
		isDragging: false,
		activePanel: null as 'original' | 'converted' | null
	});

	constructor() {
		// Load persisted state with validation
		this.loadPersistedState();
	}

	// Reactive getters
	get originalState() { return this._state.original; }
	get convertedState() { return this._state.converted; }
	get syncEnabled() { return this._state.config.syncEnabled; }
	get isDragging() { return this._state.isDragging; }
	get activePanel() { return this._state.activePanel; }

	// Derived transform strings for CSS
	get originalTransform() {
		const { x, y, scale } = this._state.original;
		return `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
	}

	get convertedTransform() {
		const { x, y, scale } = this._state.converted;
		return `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
	}

	/**
	 * Update a specific panel's transform
	 */
	updatePanel(panel: 'original' | 'converted', updates: Partial<Transform>) {
		const currentTransform = this._state[panel];
		const newTransform = { ...currentTransform, ...updates };
		const validatedTransform = validateTransform(newTransform, this._state.config);

		// Update the target panel
		Object.assign(this._state[panel], validatedTransform);

		// Sync to other panel if enabled
		if (this._state.config.syncEnabled) {
			const otherPanel = panel === 'original' ? 'converted' : 'original';
			Object.assign(this._state[otherPanel], validatedTransform);
		}

		// Persist changes
		this.persistState();
	}

	/**
	 * Set dragging state for the active panel
	 */
	setDragging(isDragging: boolean, panel?: 'original' | 'converted') {
		this._state.isDragging = isDragging;
		this._state.activePanel = isDragging ? (panel || null) : null;
	}

	/**
	 * Toggle synchronization between panels
	 */
	toggleSync() {
		this._state.config.syncEnabled = !this._state.config.syncEnabled;
		
		// When enabling sync, sync converted to original
		if (this._state.config.syncEnabled) {
			Object.assign(this._state.converted, this._state.original);
		}

		this.persistState();
	}

	/**
	 * Reset both panels to default state
	 */
	resetAll() {
		Object.assign(this._state.original, DEFAULT_TRANSFORM);
		Object.assign(this._state.converted, DEFAULT_TRANSFORM);
		this.persistState();
	}

	/**
	 * Reset a specific panel
	 */
	resetPanel(panel: 'original' | 'converted') {
		Object.assign(this._state[panel], DEFAULT_TRANSFORM);
		
		if (this._state.config.syncEnabled) {
			const otherPanel = panel === 'original' ? 'converted' : 'original';
			Object.assign(this._state[otherPanel], DEFAULT_TRANSFORM);
		}

		this.persistState();
	}

	/**
	 * Zoom in/out on a specific panel
	 */
	zoom(panel: 'original' | 'converted', factor: number, center?: { x: number; y: number }) {
		const current = this._state[panel];
		const newScale = Math.max(this._state.config.minScale, 
			Math.min(this._state.config.maxScale, current.scale * factor));
		
		if (newScale === current.scale) return; // No change needed
		
		if (center) {
			// Zoom towards the specified point (like mouse wheel zoom)
			const scaleRatio = newScale / current.scale;
			const newX = center.x - scaleRatio * (center.x - current.x);
			const newY = center.y - scaleRatio * (center.y - current.y);
			
			this.updatePanel(panel, { scale: newScale, x: newX, y: newY });
		} else {
			// Zoom towards viewport center (for button-based zoom)
			// This assumes a standard viewport size - we'll improve this in the component
			const viewportCenterX = 0; // Will be overridden by component
			const viewportCenterY = 0; // Will be overridden by component
			
			const scaleRatio = newScale / current.scale;
			const newX = viewportCenterX - scaleRatio * (viewportCenterX - current.x);
			const newY = viewportCenterY - scaleRatio * (viewportCenterY - current.y);
			
			this.updatePanel(panel, { scale: newScale, x: newX, y: newY });
		}
	}
	
	/**
	 * Zoom towards viewport center (for button-based zoom)
	 */
	zoomToViewportCenter(panel: 'original' | 'converted', factor: number, viewportRect: DOMRect) {
		const current = this._state[panel];
		const newScale = Math.max(this._state.config.minScale, 
			Math.min(this._state.config.maxScale, current.scale * factor));
		
		if (newScale === current.scale) return; // No change needed
		
		// Calculate viewport center relative to the container
		const centerX = viewportRect.width / 2;
		const centerY = viewportRect.height / 2;
		
		// Zoom towards viewport center
		const scaleRatio = newScale / current.scale;
		const newX = centerX - scaleRatio * (centerX - current.x);
		const newY = centerY - scaleRatio * (centerY - current.y);
		
		this.updatePanel(panel, { scale: newScale, x: newX, y: newY });
	}

	/**
	 * Pan a specific panel
	 */
	pan(panel: 'original' | 'converted', deltaX: number, deltaY: number) {
		const current = this._state[panel];
		this.updatePanel(panel, {
			x: current.x + deltaX,
			y: current.y + deltaY
		});
	}

	/**
	 * Update configuration
	 */
	updateConfig(updates: Partial<PanZoomConfig>) {
		Object.assign(this._state.config, updates);
		
		// Re-validate current transforms with new constraints
		this._state.original = validateTransform(this._state.original, this._state.config);
		this._state.converted = validateTransform(this._state.converted, this._state.config);
		
		this.persistState();
	}

	/**
	 * Preserve current state (for use during image conversion)
	 */
	preserveState() {
		// Store current state in a temporary location
		const stateToPreserve = {
			originalState: { ...this._state.original },
			convertedState: { ...this._state.converted },
			syncEnabled: this._state.config.syncEnabled
		};
		
		// Save to session storage for recovery
		if (typeof window !== 'undefined') {
			sessionStorage.setItem('panZoomPreserved', JSON.stringify(stateToPreserve));
		}
	}

	/**
	 * Restore previously preserved state
	 */
	restoreState() {
		if (typeof window === 'undefined') return;
		
		try {
			const preserved = sessionStorage.getItem('panZoomPreserved');
			if (preserved) {
				const state = JSON.parse(preserved);
				
				this._state.original = validateTransform(state.originalState || DEFAULT_TRANSFORM, this._state.config);
				this._state.converted = validateTransform(state.convertedState || DEFAULT_TRANSFORM, this._state.config);
				this._state.config.syncEnabled = state.syncEnabled ?? true;
				
				// Clean up preserved state
				sessionStorage.removeItem('panZoomPreserved');
				
				this.persistState();
			}
		} catch (error) {
			console.warn('Failed to restore preserved pan/zoom state:', error);
		}
	}

	/**
	 * Load persisted state from localStorage
	 */
	private loadPersistedState() {
		try {
			const persisted = converterPersistence.loadPanZoomState();
			
			if (persisted) {
				// Validate and apply persisted transforms
				this._state.original = validateTransform(
					persisted.originalState || DEFAULT_TRANSFORM, 
					this._state.config
				);
				this._state.converted = validateTransform(
					persisted.convertedState || DEFAULT_TRANSFORM, 
					this._state.config
				);
				this._state.config.syncEnabled = persisted.isSyncEnabled ?? true;

				console.log('✅ Pan/zoom state loaded from persistence:', {
					original: this._state.original,
					converted: this._state.converted,
					syncEnabled: this._state.config.syncEnabled
				});
			}
		} catch (error) {
			console.warn('Failed to load persisted pan/zoom state:', error);
			// Fall back to defaults (already set in constructor)
		}
	}

	/**
	 * Persist current state to localStorage
	 */
	private persistState() {
		try {
			converterPersistence.savePanZoomState({
				originalState: { ...this._state.original },
				convertedState: { ...this._state.converted },
				isSyncEnabled: this._state.config.syncEnabled
			});
		} catch (error) {
			console.warn('Failed to persist pan/zoom state:', error);
		}
	}
}

// Global store instance
export const modernPanZoomStore = new ModernPanZoomStore();