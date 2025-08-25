/**
 * Shared Props Interfaces for vec2art Components
 * Eliminates duplication across component Props interfaces
 */

import type { ProcessingProgress, ProcessingResult } from './vectorizer';
import type { FileMetadata } from '$lib/stores/converter-persistence';
import type { VectorizerConfig, VectorizerPreset } from './vectorizer';
import type { SettingsSyncMode } from './settings-sync';
import type { PerformanceMode } from '../utils/performance-monitor';

// File/Image Data - used across converter components
export interface FileDataProps {
	files: File[];
	originalImageUrls: (string | null)[];
	filesMetadata: FileMetadata[];
	currentImageIndex: number;
	currentProgress?: ProcessingProgress;
	results?: (ProcessingResult | null)[];
	previewSvgUrls?: (string | null)[];
}

// File Upload - used by upload components
export interface FileUploadProps {
	accept?: string;
	maxSize?: number; // in bytes
	onFilesSelect?: (files: File[]) => void;
	disabled?: boolean;
}

// Single file upload variant
export interface SingleFileUploadProps {
	accept?: string;
	maxSize?: number; // in bytes
	onFileSelect?: (file: File) => void;
	disabled?: boolean;
	currentFile?: File | null;
}

// Configuration Props - used by settings components
export interface ConfigurationProps {
	config: VectorizerConfig;
	selectedPreset: VectorizerPreset | 'custom';
}

// Performance Props - used by performance components
export interface PerformanceProps {
	performanceMode?: PerformanceMode;
	threadCount?: number;
	threadsInitialized?: boolean;
}

// Processing Control Props - used by converter interface components
export interface ProcessingControlProps {
	canConvert: boolean;
	canDownload: boolean;
	isProcessing: boolean;
	isPanicked?: boolean;
}

// Settings Sync Props - used by components that handle settings sync
export interface SettingsSyncProps {
	settingsSyncMode?: SettingsSyncMode;
	onSettingsModeChange?: (mode: SettingsSyncMode) => void;
}

// UI Component Base Props - used by basic UI components
export interface UIComponentProps {
	class?: string;
	children?: any;
}

// Modal Props - used by modal-like components
export interface ModalProps {
	open: boolean;
	onClose: () => void;
}

// Action Handler Props - used by components with common actions
export interface ActionHandlerProps {
	onConvert?: () => void;
	onDownload?: () => void;
	onReset?: () => void;
	onAbort?: () => void;
	onAddMore?: () => void;
	onRemove?: () => void;
}

// Callback Props - common callback patterns
export interface CallbackProps {
	onImageIndexChange?: (index: number) => void;
	onRemoveFile?: (index: number) => void;
	onEmergencyRecovery?: () => void;
}

// Combined Props for main converter components
export interface ConverterComponentProps
	extends FileDataProps,
		ProcessingControlProps,
		ActionHandlerProps,
		CallbackProps,
		SettingsSyncProps {}
