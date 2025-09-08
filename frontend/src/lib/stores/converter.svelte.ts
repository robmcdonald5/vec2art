/**
 * Unified Converter Store - Backwards Compatibility Layer
 * 
 * This store provides a unified interface that maintains backwards compatibility
 * with existing components while delegating to the new functionally-separated stores.
 * This prevents breaking changes during the architectural refactoring.
 */

import type {
	VectorizerState,
	VectorizerConfig,
	VectorizerError,
	ProcessingResult,
	ProcessingProgress,
	WasmCapabilityReport,
	VectorizerPreset,
	VectorizerBackend
} from '$lib/types/vectorizer';

import { converterWasm } from './converter-wasm.svelte';
import { converterSettings, type SettingsMode } from './converter-settings.svelte';
import { converterState } from './converter-state.svelte';

interface InitializationOptions {
	threadCount?: number;
	autoInitThreads?: boolean;
}

/**
 * Unified Converter Store
 * 
 * Provides backwards compatibility by coordinating the three specialized stores:
 * - converterWasm: WASM lifecycle management
 * - converterSettings: Parameter and preset management  
 * - converterState: Image processing and results
 */
export class ConverterStore {
	
	/**
	 * BACKWARDS COMPATIBILITY: State getter that rebuilds the original VectorizerState interface
	 */
	get state(): VectorizerState {
		return {
			is_processing: converterState.isProcessing,
			is_initialized: converterWasm.isInitialized,
			has_error: converterWasm.hasError || converterState.hasError,
			error: converterWasm.error || converterState.error,
			current_progress: converterState.currentProgress,
			last_result: converterState.lastResult,
			batch_results: converterState.batchResults,
			config: converterSettings.config,
			capabilities: converterWasm.capabilities,
			input_image: converterState.inputImage,
			input_file: converterState.inputFile,
			input_images: converterState.inputImages,
			input_files: converterState.inputFiles,
			current_image_index: converterState.currentImageIndex
		};
	}

	// BACKWARDS COMPATIBILITY: Direct property getters
	get isProcessing(): boolean { return converterState.isProcessing; }
	get isInitialized(): boolean { return converterWasm.isInitialized; }
	get hasError(): boolean { return converterWasm.hasError || converterState.hasError; }
	get error(): VectorizerError | undefined { return converterWasm.error || converterState.error; }
	get isPanicked(): boolean { return converterWasm.isPanicked; }
	get isRecovering(): boolean { return converterWasm.isRecovering; }
	get recoveryAttempts(): number { return converterWasm.recoveryAttempts; }
	get config(): VectorizerConfig { return converterSettings.config; }
	get capabilities(): WasmCapabilityReport | undefined { return converterWasm.capabilities; }
	get currentProgress(): ProcessingProgress | undefined { return converterState.currentProgress; }
	get lastResult(): ProcessingResult | undefined { return converterState.lastResult; }
	get inputImage(): ImageData | undefined { return converterState.inputImage; }
	get inputFile(): File | undefined { return converterState.inputFile; }
	get inputImages(): ImageData[] { return converterState.inputImages; }
	get inputFiles(): File[] { return converterState.inputFiles; }
	get currentImageIndex(): number { return converterState.currentImageIndex; }
	get currentInputImage(): ImageData | undefined { return converterState.currentInputImage; }
	get currentInputFile(): File | undefined { return converterState.currentInputFile; }
	get batchResults(): ProcessingResult[] { return converterState.batchResults; }
	get hasMultipleImages(): boolean { return converterState.hasMultipleImages; }
	get wasmLoaded(): boolean { return converterWasm.wasmLoaded; }
	get threadsInitialized(): boolean { return converterWasm.threadsInitialized; }
	get requestedThreadCount(): number { return converterWasm.requestedThreadCount; }
	get algorithmConfigs(): Record<VectorizerBackend, VectorizerConfig> { return converterSettings.algorithmConfigs; }
	get vectorizerService() { return converterWasm.vectorizerService; }

	// Settings store compatibility
	get mode(): SettingsMode { return converterSettings.mode; }
	get selectedPreset() { return converterSettings.selectedPreset; }
	get manualOverrides() { return converterSettings.manualOverrides; }
	get finalConfig() { return converterSettings.finalConfig; }
	get showAdvancedSettings(): boolean { return converterSettings.showAdvancedSettings; }
	get expandedSections(): Set<string> { return converterSettings.expandedSections; }

	/**
	 * WASM MANAGEMENT - Delegate to converterWasm store
	 */
	async initialize(options?: InitializationOptions): Promise<void> {
		return await converterWasm.initialize(options);
	}

	async initializeThreads(threadCount?: number): Promise<boolean> {
		return await converterWasm.initializeThreads(threadCount);
	}

	setPerformanceMode(mode: 'economy' | 'balanced' | 'performance' | 'custom'): void {
		converterWasm.setPerformanceMode(mode);
	}

	async emergencyRecovery(): Promise<void> {
		return await converterWasm.emergencyRecovery();
	}

	cleanup(): void {
		converterWasm.cleanup();
	}

	/**
	 * SETTINGS MANAGEMENT - Delegate to converterSettings store
	 */
	updateConfig(updates: Partial<VectorizerConfig>): void {
		converterSettings.updateConfig(updates);
	}

	updateParameter<K extends keyof VectorizerConfig>(key: K, value: VectorizerConfig[K]): void {
		converterSettings.updateParameter(key, value);
	}

	updateParameters(updates: Partial<VectorizerConfig>): void {
		converterSettings.updateParameters(updates);
	}

	resetConfig(): void {
		converterSettings.resetConfig();
	}

	resetAllAlgorithmConfigs(): void {
		converterSettings.resetAllAlgorithmConfigs();
	}

	usePreset(preset: VectorizerPreset): void {
		converterSettings.usePreset(preset);
	}

	normalizeConfig(config: Partial<VectorizerConfig>): Partial<VectorizerConfig> {
		return converterSettings.normalizeConfig(config);
	}

	validateConfig(): { isValid: boolean; errors: string[] } {
		return converterSettings.validateConfig();
	}

	isConfigValid(): boolean {
		return converterSettings.isConfigValid();
	}

	// Settings store specific methods
	selectPreset(preset: any): void {
		converterSettings.selectPreset(preset);
	}

	enableHybridMode(): void {
		converterSettings.enableHybridMode();
	}

	enableManualMode(): void {
		converterSettings.enableManualMode();
	}

	resetToPreset(): void {
		converterSettings.resetToPreset();
	}

	toggleAdvancedSettings(): void {
		converterSettings.toggleAdvancedSettings();
	}

	toggleSection(section: string): void {
		converterSettings.toggleSection(section);
	}

	getParameterSections() {
		return converterSettings.getParameterSections();
	}

	/**
	 * IMAGE PROCESSING - Delegate to converterState store
	 */
	async setInputFile(file: File): Promise<void> {
		return await converterState.setInputFile(file);
	}

	setInputImage(imageData: ImageData): void {
		converterState.setInputImage(imageData);
	}

	async setInputFiles(files: File[]): Promise<void> {
		return await converterState.setInputFiles(files);
	}

	setCurrentImageIndex(index: number): void {
		converterState.setCurrentImageIndex(index);
	}

	async processImage(): Promise<ProcessingResult> {
		return await converterState.processImage();
	}

	async processBatch(
		onProgress?: (imageIndex: number, totalImages: number, progress: ProcessingProgress) => void
	): Promise<ProcessingResult[]> {
		return await converterState.processBatch(onProgress);
	}

	clearInput(): void {
		converterState.clearInput();
	}

	clearResult(): void {
		converterState.clearResult();
	}

	abortProcessing(): void {
		converterState.abortProcessing();
	}

	async forceReset(): Promise<void> {
		return await converterState.forceReset();
	}

	async retryLastOperation(): Promise<void> {
		return await converterState.retryLastOperation();
	}

	/**
	 * ERROR HANDLING - Coordinate across stores
	 */
	clearError(): void {
		converterWasm.clearError();
		converterState.clearError();
	}

	getErrorMessage(error?: VectorizerError): string {
		// Try WASM store first (for panic conditions), then state store
		return converterWasm.getErrorMessage(error) || converterState.getErrorMessage(error);
	}

	getRecoverySuggestions(): string[] {
		// Combine suggestions from all stores
		const wasmSuggestions = converterWasm.getRecoverySuggestions();
		const stateSuggestions = converterState.getRecoverySuggestions();
		const settingsSuggestions = converterSettings.getRecoverySuggestions();
		
		return [...wasmSuggestions, ...stateSuggestions, ...settingsSuggestions];
	}

	/**
	 * STATISTICS AND UTILITIES
	 */
	getStats() {
		return converterState.getStats();
	}

	/**
	 * UNIFIED RESET - Coordinate across all stores
	 */
	reset(): void {
		converterState.reset();
		converterSettings.resetAllAlgorithmConfigs();
		// Note: We don't reset WASM initialization, just clear errors
		converterWasm.clearError();
		console.log('[ConverterStore] Unified reset complete');
	}

	/**
	 * BACKWARDS COMPATIBILITY: Deprecated methods that still exist in components
	 */

	// These methods are preserved for compatibility but delegate to appropriate stores
	private _getDefaultConfigForBackend(backend: VectorizerBackend): VectorizerConfig {
		// This was a private method in the old store - maintain for internal use
		const { getDefaultConfigForBackend } = require('$lib/types/vectorizer');
		return getDefaultConfigForBackend(backend);
	}

	// Legacy file helper - maintain for backwards compatibility
	private async fileToImageData(file: File): Promise<ImageData> {
		// This functionality is now encapsulated in converterState.setInputFile()
		// but we maintain it here for any remaining direct calls
		await converterState.setInputFile(file);
		return converterState.inputImage!;
	}

	private formatFileSize(bytes: number): string {
		// This is now handled in converterState.getStats() but maintain for compatibility
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}
}

// Export singleton instance for backwards compatibility
export const vectorizerStore = new ConverterStore();

// Also export the new stores for components that want to use them directly
export { converterWasm, converterSettings, converterState };

// Export types
export type { SettingsMode } from './converter-settings.svelte';