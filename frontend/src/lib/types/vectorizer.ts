/**
 * TypeScript interfaces for WASM vectorizer integration
 */

export type VectorizerBackend = 'edge' | 'centerline' | 'superpixel' | 'dots';

export type VectorizerPreset = 
  | 'sketch'
  | 'line_art'
  | 'technical'
  | 'bold_artistic'
  | 'dense_stippling'
  | 'fine_stippling'
  | 'sparse_dots'
  | 'pointillism';

export interface VectorizerConfig {
  // Core settings
  backend: VectorizerBackend;
  preset?: VectorizerPreset;
  detail: number; // 1-10
  stroke_width: number; // 0.5-5.0
  
  // Multi-pass processing
  multipass: boolean;
  noise_filtering: boolean;
  reverse_pass: boolean;
  diagonal_pass: boolean;
  
  // Artistic effects
  hand_drawn_style: boolean;
  variable_weights: boolean;
  tremor_effects: boolean;
  enable_etf_fdog: boolean;
  enable_flow_tracing: boolean;
  enable_bezier_fitting: boolean;
  
  // Dots-specific settings
  dot_density?: number; // 0.1-2.0
  dot_size_range?: [number, number]; // [min, max] sizes
  preserve_colors?: boolean;
  adaptive_sizing?: boolean;
  background_tolerance?: number; // 0.0-1.0
  
  // Performance settings
  max_processing_time_ms?: number;
  thread_count?: number;
}

export interface ProcessingProgress {
  stage: string;
  progress: number; // 0-100
  elapsed_ms: number;
  estimated_remaining_ms?: number;
}

export interface ProcessingResult {
  svg: string;
  processing_time_ms: number;
  config_used: VectorizerConfig;
  statistics?: {
    input_dimensions: [number, number];
    paths_generated: number;
    dots_generated?: number;
    compression_ratio: number;
  };
}

export interface VectorizerError {
  type: 'config' | 'processing' | 'memory' | 'threading' | 'unknown';
  message: string;
  details?: string;
}

export interface WasmCapabilityReport {
  threading_supported: boolean;
  shared_array_buffer_available: boolean;
  cross_origin_isolated: boolean;
  hardware_concurrency: number;
  missing_requirements: string[];
  recommendations: string[];
}

export interface VectorizerState {
  // Processing state
  is_processing: boolean;
  is_initialized: boolean;
  has_error: boolean;
  error?: VectorizerError;
  
  // Current operation
  current_progress?: ProcessingProgress;
  last_result?: ProcessingResult;
  
  // Configuration
  config: VectorizerConfig;
  capabilities?: WasmCapabilityReport;
  
  // Input image
  input_image?: ImageData;
  input_file?: File;
}

// Web Worker message types
export interface WorkerMessage {
  id: string;
  type: 'init' | 'process' | 'progress' | 'result' | 'error' | 'capabilities';
}

export interface WorkerInitMessage extends WorkerMessage {
  type: 'init';
  config?: Partial<VectorizerConfig>;
}

export interface WorkerProcessMessage extends WorkerMessage {
  type: 'process';
  image_data: ImageData;
  config: VectorizerConfig;
}

export interface WorkerProgressMessage extends WorkerMessage {
  type: 'progress';
  progress: ProcessingProgress;
}

export interface WorkerResultMessage extends WorkerMessage {
  type: 'result';
  result: ProcessingResult;
}

export interface WorkerErrorMessage extends WorkerMessage {
  type: 'error';
  error: VectorizerError;
}

export interface WorkerCapabilitiesMessage extends WorkerMessage {
  type: 'capabilities';
  capabilities: WasmCapabilityReport;
}

export type WorkerMessageType = 
  | WorkerInitMessage 
  | WorkerProcessMessage 
  | WorkerProgressMessage 
  | WorkerResultMessage 
  | WorkerErrorMessage 
  | WorkerCapabilitiesMessage;

// Default configurations
export const DEFAULT_CONFIG: VectorizerConfig = {
  backend: 'edge',
  detail: 5,
  stroke_width: 1.0,
  multipass: true,
  noise_filtering: true,
  reverse_pass: false,
  diagonal_pass: false,
  hand_drawn_style: true,
  variable_weights: false,
  tremor_effects: false,
  enable_etf_fdog: false,
  enable_flow_tracing: false,
  enable_bezier_fitting: true,
  max_processing_time_ms: 30000, // 30 seconds
};

export const BACKEND_DESCRIPTIONS: Record<VectorizerBackend, string> = {
  edge: 'Advanced edge detection with Canny algorithm. Best for detailed line art, drawings, and complex imagery.',
  centerline: 'Zhang-Suen skeleton-based tracing. Ideal for bold shapes, logos, text, and high-contrast imagery.',
  superpixel: 'SLIC region-based approach. Perfect for stylized art, abstract representations, and color-rich images.',
  dots: 'Adaptive stippling with content-aware placement. Great for artistic effects, texture emphasis, and vintage styles.'
};

export const PRESET_DESCRIPTIONS: Record<VectorizerPreset, string> = {
  sketch: 'Hand-drawn sketch style with organic irregularities',
  line_art: 'Clean, precise line art with consistent strokes',
  technical: 'Technical drawing style with precise, uniform lines',
  bold_artistic: 'Bold, expressive artistic style with dramatic effects',
  dense_stippling: 'Dense stippling pattern for rich textures',
  fine_stippling: 'Fine, detailed stippling for subtle effects',
  sparse_dots: 'Sparse dot pattern for minimalist aesthetics',
  pointillism: 'Pointillism style with color-aware dot placement'
};