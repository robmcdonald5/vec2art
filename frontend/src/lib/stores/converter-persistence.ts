/**
 * Converter State Persistence Store
 * Lightweight client-side storage using localStorage only
 * No server costs - all data stored in user's browser
 */

import { browser } from '$app/environment';
import type { VectorizerConfig, ProcessingResult } from '$lib/types/vectorizer';

// Storage keys
const STORAGE_KEYS = {
	CONFIG: 'vec2art_converter_config',
	PRESET: 'vec2art_converter_preset',
	PERFORMANCE: 'vec2art_performance_mode',
	THREAD_COUNT: 'vec2art_thread_count',
	FILES_METADATA: 'vec2art_files_metadata', // Store file info, not actual files
	IMAGE_URLS: 'vec2art_image_urls', // Store original image URLs for display
	RESULTS: 'vec2art_results', // Store SVG results (text, so efficient)
	CURRENT_INDEX: 'vec2art_current_index',
	AUTO_SAVE: 'vec2art_auto_save_enabled',
	LAST_VISITED: 'vec2art_last_visited'
} as const;

// Simplified file metadata (no actual file content)
export interface FileMetadata {
	name: string;
	size: number;
	type: string;
	lastModified: number;
}

interface StoredState {
	config: VectorizerConfig;
	preset: string;
	performanceMode: string;
	threadCount: number;
	filesMetadata: FileMetadata[];
	imageUrls: (string | null)[]; // Data URLs for original images
	results: (string | null)[]; // SVG strings or null
	currentIndex: number;
	timestamp: number;
}

class ConverterPersistence {
	private autoSaveEnabled = true;
	private maxStorageSize = 5 * 1024 * 1024; // 5MB limit for localStorage

	constructor() {
		if (browser) {
			this.loadAutoSavePreference();
			this.cleanupOldData();
		}
	}

	/**
	 * Save converter configuration
	 */
	saveConfig(config: VectorizerConfig): boolean {
		if (!browser) {
			console.log('🚫 [DEBUG] saveConfig: Not in browser environment');
			return false;
		}

		try {
			const configStr = JSON.stringify(config);
			console.log('💾 [DEBUG] saveConfig: Saving config to', STORAGE_KEYS.CONFIG, ':', configStr);
			localStorage.setItem(STORAGE_KEYS.CONFIG, configStr);
			console.log('✅ [DEBUG] saveConfig: Successfully saved');
			return true;
		} catch (error) {
			console.error('❌ [DEBUG] saveConfig: Failed to save config:', error);
			return false;
		}
	}

	/**
	 * Load converter configuration
	 */
	loadConfig(): VectorizerConfig | null {
		if (!browser) {
			console.log('🚫 [DEBUG] loadConfig: Not in browser environment');
			return null;
		}

		try {
			console.log('🔍 [DEBUG] loadConfig: Loading from', STORAGE_KEYS.CONFIG);
			const stored = localStorage.getItem(STORAGE_KEYS.CONFIG);
			console.log('📄 [DEBUG] loadConfig: Raw stored value:', stored);
			const result = stored ? JSON.parse(stored) : null;
			console.log('📋 [DEBUG] loadConfig: Parsed result:', result);
			return result;
		} catch (error) {
			console.error('❌ [DEBUG] loadConfig: Failed to load config:', error);
			return null;
		}
	}

	/**
	 * Save preset selection
	 */
	savePreset(preset: string): void {
		if (!browser) return;
		localStorage.setItem(STORAGE_KEYS.PRESET, preset);
	}

	/**
	 * Load preset selection
	 */
	loadPreset(): string | null {
		if (!browser) return null;
		return localStorage.getItem(STORAGE_KEYS.PRESET);
	}

	/**
	 * Save performance settings
	 */
	savePerformanceSettings(mode: string, threadCount: number): void {
		if (!browser) return;
		localStorage.setItem(STORAGE_KEYS.PERFORMANCE, mode);
		localStorage.setItem(STORAGE_KEYS.THREAD_COUNT, threadCount.toString());
	}

	/**
	 * Load performance settings
	 */
	loadPerformanceSettings(): { mode: string | null; threadCount: number } {
		if (!browser) return { mode: null, threadCount: 4 };

		return {
			mode: localStorage.getItem(STORAGE_KEYS.PERFORMANCE),
			threadCount: parseInt(localStorage.getItem(STORAGE_KEYS.THREAD_COUNT) || '4', 10)
		};
	}

	/**
	 * Save file metadata (not actual files - user will need to re-upload)
	 */
	saveFilesMetadata(files: File[]): void {
		if (!browser) return;

		const metadata: FileMetadata[] = files.map((file) => ({
			name: file.name,
			size: file.size,
			type: file.type,
			lastModified: file.lastModified
		}));

		try {
			localStorage.setItem(STORAGE_KEYS.FILES_METADATA, JSON.stringify(metadata));
		} catch (error) {
			console.warn('Failed to save file metadata:', error);
		}
	}

	/**
	 * Save original image URLs for display after page refresh
	 */
	async saveImageUrls(files: File[]): Promise<boolean> {
		if (!browser) return false;

		try {
			const imageUrls: (string | null)[] = [];

			for (const file of files) {
				if (file.type.startsWith('image/')) {
					// Convert image to data URL for storage
					const dataUrl = await this.fileToDataUrl(file);
					imageUrls.push(dataUrl);
				} else {
					imageUrls.push(null);
				}
			}

			const data = JSON.stringify(imageUrls);

			// Check size before saving
			if (data.length > this.maxStorageSize) {
				console.warn('Image URLs too large for localStorage, saving partial');
				// Save only first few that fit
				const partial = imageUrls.slice(0, Math.floor(imageUrls.length / 2));
				localStorage.setItem(STORAGE_KEYS.IMAGE_URLS, JSON.stringify(partial));
				return false;
			}

			localStorage.setItem(STORAGE_KEYS.IMAGE_URLS, data);
			return true;
		} catch (error) {
			console.warn('Failed to save image URLs:', error);
			return false;
		}
	}

	/**
	 * Convert File to data URL
	 */
	private fileToDataUrl(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	}

	/**
	 * Load file metadata
	 */
	loadFilesMetadata(): FileMetadata[] {
		if (!browser) return [];

		try {
			const stored = localStorage.getItem(STORAGE_KEYS.FILES_METADATA);
			return stored ? JSON.parse(stored) : [];
		} catch (error) {
			console.error('Failed to load file metadata:', error);
			return [];
		}
	}

	/**
	 * Load original image URLs
	 */
	loadImageUrls(): (string | null)[] {
		if (!browser) return [];

		try {
			const stored = localStorage.getItem(STORAGE_KEYS.IMAGE_URLS);
			return stored ? JSON.parse(stored) : [];
		} catch (error) {
			console.error('Failed to load image URLs:', error);
			return [];
		}
	}

	/**
	 * Save SVG results (these are text, so relatively small)
	 */
	saveResults(results: (ProcessingResult | null)[]): boolean {
		if (!browser) return false;

		try {
			// Extract just the SVG strings (or null for unprocessed)
			const svgs = results.map((r) => r?.svg || null);
			const data = JSON.stringify(svgs);

			// Check size before saving (localStorage has ~5-10MB limit)
			if (data.length > this.maxStorageSize) {
				console.warn('Results too large for localStorage, saving partial');
				// Save only first few results that fit
				const partial = svgs.slice(0, Math.floor(svgs.length / 2));
				localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(partial));
				return false;
			}

			localStorage.setItem(STORAGE_KEYS.RESULTS, data);
			return true;
		} catch (error) {
			console.warn('Failed to save results:', error);
			// Try to save at least config if results are too large
			this.clearResults();
			return false;
		}
	}

	/**
	 * Load SVG results
	 */
	loadResults(): (ProcessingResult | null)[] {
		if (!browser) return [];

		try {
			const stored = localStorage.getItem(STORAGE_KEYS.RESULTS);
			if (!stored) return [];

			const svgs: (string | null)[] = JSON.parse(stored);
			// IMPORTANT: Don't filter out nulls - preserve array positions for multi-image support
			return svgs.map((svg) => (svg ? { svg, error: null } : null)) as (ProcessingResult | null)[];
		} catch (error) {
			console.error('Failed to load results:', error);
			return [];
		}
	}

	/**
	 * Save current image index
	 */
	saveCurrentIndex(index: number): void {
		if (!browser) return;
		localStorage.setItem(STORAGE_KEYS.CURRENT_INDEX, index.toString());
	}

	/**
	 * Load current image index
	 */
	loadCurrentIndex(): number {
		if (!browser) return 0;
		const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_INDEX);
		return stored ? parseInt(stored, 10) : 0;
	}

	/**
	 * Save complete state (convenience method)
	 */
	saveCompleteState(state: {
		config: VectorizerConfig;
		preset: string;
		performanceMode: string;
		threadCount: number;
		files: File[];
		results: (ProcessingResult | null)[];
		currentIndex: number;
	}): boolean {
		if (!browser || !this.autoSaveEnabled) return false;

		try {
			// Save each component
			this.saveConfig(state.config);
			this.savePreset(state.preset);
			this.savePerformanceSettings(state.performanceMode, state.threadCount);
			this.saveFilesMetadata(state.files);
			const resultsSaved = this.saveResults(state.results);
			this.saveCurrentIndex(state.currentIndex);

			// Update last visited timestamp
			localStorage.setItem(STORAGE_KEYS.LAST_VISITED, Date.now().toString());

			return resultsSaved;
		} catch (error) {
			console.error('Failed to save complete state:', error);
			return false;
		}
	}

	/**
	 * Load complete state
	 */
	loadCompleteState(): Partial<StoredState> | null {
		if (!browser) return null;

		try {
			const config = this.loadConfig();
			const preset = this.loadPreset();
			const { mode: performanceMode, threadCount } = this.loadPerformanceSettings();
			const filesMetadata = this.loadFilesMetadata();
			const imageUrls = this.loadImageUrls();
			const results = this.loadResults();
			const currentIndex = this.loadCurrentIndex();

			// Check if we have any meaningful state to restore
			if (!config && filesMetadata.length === 0) {
				return null;
			}

			return {
				config: config || undefined,
				preset: preset || 'artistic',
				performanceMode: performanceMode || 'balanced',
				threadCount,
				filesMetadata,
				imageUrls,
				results: results.map((r) => r?.svg || null),
				currentIndex,
				timestamp: parseInt(localStorage.getItem(STORAGE_KEYS.LAST_VISITED) || '0', 10)
			};
		} catch (error) {
			console.error('Failed to load complete state:', error);
			return null;
		}
	}

	/**
	 * Check if there's recoverable state
	 */
	hasRecoverableState(): boolean {
		if (!browser) {
			console.log('🚫 [DEBUG] hasRecoverableState: Not in browser environment');
			return false;
		}

		const hasConfig = !!localStorage.getItem(STORAGE_KEYS.CONFIG);
		const hasFiles = !!localStorage.getItem(STORAGE_KEYS.FILES_METADATA);
		const hasImageUrls = !!localStorage.getItem(STORAGE_KEYS.IMAGE_URLS);
		const hasResults = !!localStorage.getItem(STORAGE_KEYS.RESULTS);

		console.log(
			'🔍 [DEBUG] hasRecoverableState: hasConfig=',
			hasConfig,
			'hasFiles=',
			hasFiles,
			'hasImageUrls=',
			hasImageUrls,
			'hasResults=',
			hasResults
		);

		return hasConfig || hasFiles || hasImageUrls || hasResults;
	}

	/**
	 * Get time since last visit
	 */
	getTimeSinceLastVisit(): number | null {
		if (!browser) return null;

		const lastVisited = localStorage.getItem(STORAGE_KEYS.LAST_VISITED);
		if (!lastVisited) return null;

		return Date.now() - parseInt(lastVisited, 10);
	}

	/**
	 * Clear results only (keep config)
	 */
	clearResults(): void {
		if (!browser) return;
		localStorage.removeItem(STORAGE_KEYS.RESULTS);
	}

	/**
	 * Clear files metadata
	 */
	clearFiles(): void {
		if (!browser) return;
		localStorage.removeItem(STORAGE_KEYS.FILES_METADATA);
		localStorage.removeItem(STORAGE_KEYS.IMAGE_URLS);
		localStorage.removeItem(STORAGE_KEYS.RESULTS);
		localStorage.removeItem(STORAGE_KEYS.CURRENT_INDEX);
	}

	/**
	 * Clear all converter data (but keep preferences)
	 */
	clearConverterData(): void {
		if (!browser) return;

		// Clear data but keep preferences
		this.clearFiles();
		localStorage.removeItem(STORAGE_KEYS.CONFIG);
		localStorage.removeItem(STORAGE_KEYS.PRESET);
		localStorage.removeItem(STORAGE_KEYS.LAST_VISITED);
	}

	/**
	 * Clear everything (full reset)
	 */
	clearAll(): void {
		if (!browser) return;

		// Clear all vec2art keys
		Object.values(STORAGE_KEYS).forEach((key) => {
			localStorage.removeItem(key);
		});
	}

	/**
	 * Enable/disable auto-save
	 */
	setAutoSave(enabled: boolean): void {
		if (!browser) return;

		this.autoSaveEnabled = enabled;
		localStorage.setItem(STORAGE_KEYS.AUTO_SAVE, enabled.toString());
	}

	/**
	 * Load auto-save preference
	 */
	private loadAutoSavePreference(): void {
		if (!browser) return;

		const stored = localStorage.getItem(STORAGE_KEYS.AUTO_SAVE);
		this.autoSaveEnabled = stored !== 'false'; // Default to true
	}

	/**
	 * Check if auto-save is enabled
	 */
	isAutoSaveEnabled(): boolean {
		return this.autoSaveEnabled;
	}

	/**
	 * Cleanup old data (called on init)
	 */
	private cleanupOldData(): void {
		if (!browser) return;

		const lastVisited = this.getTimeSinceLastVisit();

		// Clear data if older than 30 days
		if (lastVisited && lastVisited > 30 * 24 * 60 * 60 * 1000) {
			console.log('Clearing old converter data (>30 days)');
			this.clearConverterData();
		}
	}

	/**
	 * Get storage usage estimate
	 */
	getStorageEstimate(): { used: number; total: number } {
		if (!browser) return { used: 0, total: 0 };

		let used = 0;
		Object.values(STORAGE_KEYS).forEach((key) => {
			const value = localStorage.getItem(key);
			if (value) {
				used += value.length + key.length;
			}
		});

		// localStorage typically has 5-10MB limit
		return {
			used,
			total: this.maxStorageSize
		};
	}
}

// Export singleton instance
export const converterPersistence = new ConverterPersistence();
