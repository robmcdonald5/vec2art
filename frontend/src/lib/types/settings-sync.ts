/**
 * Settings synchronization types and interfaces for multi-image configuration management
 */

import type { VectorizerConfig } from './vectorizer';

/**
 * Settings synchronization modes
 */
export type SettingsSyncMode = 'global' | 'per-image-batch' | 'per-image-individual';

/**
 * Configuration for a specific image with metadata
 */
export interface ImageConfig {
	imageIndex: number;
	config: VectorizerConfig;
	lastModified: Date;
	isDirty: boolean; // Track if config differs from default
}

/**
 * Core state for settings synchronization
 */
export interface SettingsSyncState {
	syncMode: SettingsSyncMode;
	globalConfig: VectorizerConfig; // Used in Mode 1 (global)
	imageConfigs: Map<number, VectorizerConfig>; // Used in Mode 2 & 3 (per-image)
	currentImageIndex: number;
	lastGlobalConfig?: VectorizerConfig; // Backup when switching from global to per-image
}

/**
 * Configuration update event
 */
export interface ConfigUpdateEvent {
	imageIndex: number;
	config: VectorizerConfig;
	syncMode: SettingsSyncMode;
}

/**
 * Mode switching options
 */
export interface ModeSwitchOptions {
	preserveCurrentConfig?: boolean; // When switching to global, use current image's config
	confirmDataLoss?: boolean; // Show confirmation if per-image configs will be lost
	initializeFromGlobal?: boolean; // When switching to per-image, copy global to all images
}

/**
 * Settings sync mode metadata
 */
export interface SettingsSyncModeInfo {
	id: SettingsSyncMode;
	name: string;
	description: string;
	icon: string; // Lucide icon name
	convertBehavior: 'all' | 'current';
	settingsBehavior: 'shared' | 'individual';
}

/**
 * Convert operation configuration based on sync mode
 */
export interface ConvertConfig {
	mode: SettingsSyncMode;
	imageIndices: number[]; // Which images to convert
	configMap: Map<number, VectorizerConfig>; // Config for each image
}

/**
 * Settings sync mode definitions with metadata
 */
export const SETTINGS_SYNC_MODES: Record<SettingsSyncMode, SettingsSyncModeInfo> = {
	global: {
		id: 'global',
		name: 'Global Sync',
		description:
			'All images share identical settings. Changes apply to every image. Converting processes all images together using the same configuration.',
		icon: 'Globe',
		convertBehavior: 'all',
		settingsBehavior: 'shared'
	},
	'per-image-batch': {
		id: 'per-image-batch',
		name: 'Individual Sync',
		description:
			'Each image has its own independent settings. Navigate between images to configure each separately. Converting processes all images together, each with its own settings.',
		icon: 'Layers',
		convertBehavior: 'all',
		settingsBehavior: 'individual'
	},
	'per-image-individual': {
		id: 'per-image-individual',
		name: 'Individual Convert',
		description:
			'Each image has independent settings like Individual Sync, but converting only processes the currently selected image instead of all images.',
		icon: 'Focus',
		convertBehavior: 'current',
		settingsBehavior: 'individual'
	}
} as const;

/**
 * Default settings sync state
 */
export const DEFAULT_SETTINGS_SYNC_STATE: SettingsSyncState = {
	syncMode: 'global',
	globalConfig: {} as VectorizerConfig, // Will be initialized with DEFAULT_CONFIG
	imageConfigs: new Map(),
	currentImageIndex: 0
};
