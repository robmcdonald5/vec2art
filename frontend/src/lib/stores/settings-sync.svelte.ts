/**
 * Settings synchronization store for managing multi-image configuration states
 * Supports three modes: global, per-image-batch, and per-image-individual
 */

import { DEFAULT_CONFIG, type VectorizerConfig } from '$lib/types/vectorizer';
import type {
	SettingsSyncMode,
	SettingsSyncState,
	ConfigUpdateEvent,
	ModeSwitchOptions,
	ConvertConfig
} from '$lib/types/settings-sync';

/**
 * Settings sync store using Svelte 5 runes
 */
export class SettingsSyncStore {
	// Core reactive state
	private _syncMode = $state<SettingsSyncMode>('global');
	private _globalConfig = $state<VectorizerConfig>({ ...DEFAULT_CONFIG });
	private _imageConfigs = $state<Map<number, VectorizerConfig>>(new Map());
	private _currentImageIndex = $state<number>(0);
	private _lastGlobalConfig = $state<VectorizerConfig | undefined>(undefined);
	private _totalImages = $state<number>(0);

	constructor() {
		// Initialize with default global config
		this._globalConfig = { ...DEFAULT_CONFIG };
	}

	// Reactive getters
	get syncMode(): SettingsSyncMode {
		return this._syncMode;
	}

	get currentImageIndex(): number {
		return this._currentImageIndex;
	}

	get totalImages(): number {
		return this._totalImages;
	}

	get isPerImageMode(): boolean {
		return this._syncMode !== 'global';
	}

	get isBatchMode(): boolean {
		return this._syncMode === 'per-image-batch';
	}

	get isIndividualMode(): boolean {
		return this._syncMode === 'per-image-individual';
	}

	/**
	 * Get the effective config for the specified image based on current sync mode
	 */
	getCurrentConfig(imageIndex?: number): VectorizerConfig {
		const targetIndex = imageIndex ?? this._currentImageIndex;

		if (this._syncMode === 'global') {
			return this._globalConfig;
		} else {
			// Per-image modes: return individual config or create default if missing
			if (!this._imageConfigs.has(targetIndex)) {
				// Initialize with global config if available, otherwise default
				const initialConfig = this._lastGlobalConfig 
					? { ...this._lastGlobalConfig }
					: { ...this._globalConfig };
				this._imageConfigs.set(targetIndex, initialConfig);
			}
			return this._imageConfigs.get(targetIndex)!;
		}
	}

	/**
	 * Update config for the specified image based on current sync mode
	 */
	updateConfig(newConfig: VectorizerConfig, imageIndex?: number): void {
		const targetIndex = imageIndex ?? this._currentImageIndex;

		if (this._syncMode === 'global') {
			// Global mode: update global config
			this._globalConfig = { ...newConfig };
		} else {
			// Per-image modes: update specific image's config
			this._imageConfigs.set(targetIndex, { ...newConfig });
		}
	}

	/**
	 * Switch to a new sync mode with proper data migration
	 */
	switchMode(newMode: SettingsSyncMode, options: ModeSwitchOptions = {}): boolean {
		if (newMode === this._syncMode) return true;

		const oldMode = this._syncMode;

		// Handle mode-specific transitions
		if (oldMode === 'global' && (newMode === 'per-image-batch' || newMode === 'per-image-individual')) {
			// Global → Per-Image: Copy global config to all images
			this._lastGlobalConfig = { ...this._globalConfig };
			
			if (options.initializeFromGlobal !== false) {
				for (let i = 0; i < this._totalImages; i++) {
					this._imageConfigs.set(i, { ...this._globalConfig });
				}
			}
		} 
		else if ((oldMode === 'per-image-batch' || oldMode === 'per-image-individual') && newMode === 'global') {
			// Per-Image → Global: Option to preserve current image's config
			if (options.preserveCurrentConfig && this._imageConfigs.has(this._currentImageIndex)) {
				this._globalConfig = { ...this._imageConfigs.get(this._currentImageIndex)! };
			} else if (this._lastGlobalConfig) {
				// Restore previous global config
				this._globalConfig = { ...this._lastGlobalConfig };
			}
			
			// Clear per-image configs to save memory (optional)
			if (options.confirmDataLoss !== false) {
				this._imageConfigs.clear();
			}
		}
		// Batch ↔ Individual: No config changes needed, just behavior changes

		this._syncMode = newMode;
		return true;
	}

	/**
	 * Set the current image index and update UI state
	 */
	setCurrentImageIndex(index: number): void {
		if (index >= 0 && index < this._totalImages) {
			this._currentImageIndex = index;
		}
	}

	/**
	 * Handle image addition - initialize config for new image
	 */
	handleImageAdded(imageIndex: number, totalImages: number): void {
		this._totalImages = totalImages;

		if (this._syncMode !== 'global') {
			// Per-image modes: initialize new image with current global or current image's config
			const initConfig = this._imageConfigs.has(this._currentImageIndex)
				? { ...this._imageConfigs.get(this._currentImageIndex)! }
				: { ...this._globalConfig };
			
			this._imageConfigs.set(imageIndex, initConfig);

			// Shift existing configs if needed (if image inserted, not appended)
			const configsToShift = new Map<number, VectorizerConfig>();
			for (const [index, config] of this._imageConfigs.entries()) {
				if (index >= imageIndex && index !== imageIndex) {
					configsToShift.set(index + 1, config);
					this._imageConfigs.delete(index);
				}
			}
			for (const [index, config] of configsToShift.entries()) {
				this._imageConfigs.set(index, config);
			}
		}
	}

	/**
	 * Handle image removal - clean up config storage
	 */
	handleImageRemoved(imageIndex: number, totalImages: number): void {
		this._totalImages = totalImages;

		if (this._syncMode !== 'global') {
			// Remove config for deleted image
			this._imageConfigs.delete(imageIndex);

			// Shift remaining configs down
			const configsToShift = new Map<number, VectorizerConfig>();
			for (const [index, config] of this._imageConfigs.entries()) {
				if (index > imageIndex) {
					configsToShift.set(index - 1, config);
					this._imageConfigs.delete(index);
				}
			}
			for (const [index, config] of configsToShift.entries()) {
				this._imageConfigs.set(index, config);
			}

			// Adjust current index if needed
			if (this._currentImageIndex >= imageIndex && this._currentImageIndex > 0) {
				this._currentImageIndex = Math.min(this._currentImageIndex - 1, totalImages - 1);
			}
		}
	}

	/**
	 * Get convert configuration based on current sync mode
	 */
	getConvertConfig(): ConvertConfig {
		const configMap = new Map<number, VectorizerConfig>();

		if (this._syncMode === 'global') {
			// Global mode: all images get same config
			for (let i = 0; i < this._totalImages; i++) {
				configMap.set(i, this._globalConfig);
			}
			return {
				mode: this._syncMode,
				imageIndices: Array.from({ length: this._totalImages }, (_, i) => i),
				configMap
			};
		} 
		else if (this._syncMode === 'per-image-batch') {
			// Batch mode: all images with their individual configs
			for (let i = 0; i < this._totalImages; i++) {
				configMap.set(i, this.getCurrentConfig(i));
			}
			return {
				mode: this._syncMode,
				imageIndices: Array.from({ length: this._totalImages }, (_, i) => i),
				configMap
			};
		} 
		else {
			// Individual mode: only current image
			configMap.set(this._currentImageIndex, this.getCurrentConfig(this._currentImageIndex));
			return {
				mode: this._syncMode,
				imageIndices: [this._currentImageIndex],
				configMap
			};
		}
	}

	/**
	 * Reset all configs to defaults
	 */
	resetConfigs(): void {
		this._globalConfig = { ...DEFAULT_CONFIG };
		this._imageConfigs.clear();
		this._lastGlobalConfig = undefined;

		// Re-initialize per-image configs if in per-image mode
		if (this._syncMode !== 'global') {
			for (let i = 0; i < this._totalImages; i++) {
				this._imageConfigs.set(i, { ...DEFAULT_CONFIG });
			}
		}
	}

	/**
	 * Get summary statistics for debugging/UI purposes
	 */
	getStatistics() {
		return {
			syncMode: this._syncMode,
			totalImages: this._totalImages,
			currentImageIndex: this._currentImageIndex,
			perImageConfigCount: this._imageConfigs.size,
			hasLastGlobalConfig: !!this._lastGlobalConfig,
			memoryUsage: {
				globalConfig: JSON.stringify(this._globalConfig).length,
				imageConfigs: Array.from(this._imageConfigs.values())
					.map(config => JSON.stringify(config).length)
					.reduce((sum, size) => sum + size, 0)
			}
		};
	}

	/**
	 * Initialize store with total images count
	 */
	initialize(totalImages: number, currentIndex: number = 0): void {
		this._totalImages = totalImages;
		this._currentImageIndex = Math.min(currentIndex, totalImages - 1);
		
		// Initialize per-image configs if in per-image mode
		if (this._syncMode !== 'global') {
			for (let i = 0; i < totalImages; i++) {
				if (!this._imageConfigs.has(i)) {
					this._imageConfigs.set(i, { ...this._globalConfig });
				}
			}
		}
	}
}

/**
 * Global instance of the settings sync store
 */
export const settingsSyncStore = new SettingsSyncStore();