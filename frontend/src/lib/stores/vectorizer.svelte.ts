/**
 * Svelte stores for vectorizer state management
 * Using SvelteKit 5 runes for reactive state management
 */

import { browser } from '$app/environment';
import { vectorizerService } from '$lib/services/vectorizer-service';
import type {
  VectorizerState,
  VectorizerConfig,
  VectorizerError,
  ProcessingResult,
  ProcessingProgress,
  WasmCapabilityReport,
  DEFAULT_CONFIG
} from '$lib/types/vectorizer';
import { DEFAULT_CONFIG as defaultConfig } from '$lib/types/vectorizer';

class VectorizerStore {
  // Core state using SvelteKit 5 runes
  private _state = $state<VectorizerState>({
    is_processing: false,
    is_initialized: false,
    has_error: false,
    error: undefined,
    current_progress: undefined,
    last_result: undefined,
    config: { ...defaultConfig },
    capabilities: undefined,
    input_image: undefined,
    input_file: undefined
  });

  // Getters for reactive access
  get state(): VectorizerState {
    return this._state;
  }

  get isProcessing(): boolean {
    return this._state.is_processing;
  }

  get isInitialized(): boolean {
    return this._state.is_initialized;
  }

  get hasError(): boolean {
    return this._state.has_error;
  }

  get error(): VectorizerError | undefined {
    return this._state.error;
  }

  get config(): VectorizerConfig {
    return this._state.config;
  }

  get capabilities(): WasmCapabilityReport | undefined {
    return this._state.capabilities;
  }

  get currentProgress(): ProcessingProgress | undefined {
    return this._state.current_progress;
  }

  get lastResult(): ProcessingResult | undefined {
    return this._state.last_result;
  }

  get inputImage(): ImageData | undefined {
    return this._state.input_image;
  }

  get inputFile(): File | undefined {
    return this._state.input_file;
  }

  /**
   * Initialize the vectorizer system
   */
  async initialize(): Promise<void> {
    if (!browser) {
      return; // No-op in SSR
    }

    if (this._state.is_initialized) {
      return; // Already initialized
    }

    try {
      this.clearError();
      
      // Initialize the service
      await vectorizerService.initialize();
      
      // Get capabilities using the simple check
      const caps = await vectorizerService.checkCapabilities();
      this._state.capabilities = caps;
      this._state.is_initialized = true;

    } catch (error) {
      this.setError({
        type: 'unknown',
        message: 'Failed to initialize vectorizer',
        details: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<VectorizerConfig>): void {
    this._state.config = { ...this._state.config, ...updates };
    this.clearError(); // Clear any previous config errors
  }

  /**
   * Reset configuration to defaults
   */
  resetConfig(): void {
    this._state.config = { ...defaultConfig };
    this.clearError();
  }

  /**
   * Use a preset configuration
   */
  usePreset(preset: VectorizerConfig['preset']): void {
    const presetConfigs: Record<NonNullable<VectorizerConfig['preset']>, Partial<VectorizerConfig>> = {
      sketch: {
        preset: 'sketch',
        backend: 'edge',
        detail: 6,
        hand_drawn_style: true,
        tremor_effects: true,
        variable_weights: true,
        multipass: true
      },
      line_art: {
        preset: 'line_art',
        backend: 'edge',
        detail: 7,
        hand_drawn_style: false,
        tremor_effects: false,
        variable_weights: false,
        enable_bezier_fitting: true
      },
      technical: {
        preset: 'technical',
        backend: 'centerline',
        detail: 8,
        hand_drawn_style: false,
        tremor_effects: false,
        variable_weights: false,
        stroke_width: 0.8
      },
      bold_artistic: {
        preset: 'bold_artistic',
        backend: 'edge',
        detail: 5,
        hand_drawn_style: true,
        tremor_effects: true,
        variable_weights: true,
        stroke_width: 1.5
      },
      dense_stippling: {
        preset: 'dense_stippling',
        backend: 'dots',
        dot_density: 1.5,
        preserve_colors: true,
        adaptive_sizing: true
      },
      fine_stippling: {
        preset: 'fine_stippling',
        backend: 'dots',
        dot_density: 0.8,
        dot_size_range: [0.5, 2.0],
        preserve_colors: false
      },
      sparse_dots: {
        preset: 'sparse_dots',
        backend: 'dots',
        dot_density: 0.3,
        dot_size_range: [1.0, 4.0],
        adaptive_sizing: false
      },
      pointillism: {
        preset: 'pointillism',
        backend: 'dots',
        dot_density: 1.2,
        preserve_colors: true,
        adaptive_sizing: true,
        dot_size_range: [0.8, 3.0]
      }
    };

    if (preset && presetConfigs[preset]) {
      this.updateConfig(presetConfigs[preset]);
    }
  }

  /**
   * Set input image from File
   */
  async setInputFile(file: File): Promise<void> {
    try {
      this.clearError();
      this._state.input_file = file;

      // Convert file to ImageData
      const imageData = await this.fileToImageData(file);
      this._state.input_image = imageData;

    } catch (error) {
      this.setError({
        type: 'unknown',
        message: 'Failed to load image file',
        details: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Set input image directly from ImageData
   */
  setInputImage(imageData: ImageData): void {
    this._state.input_image = imageData;
    this._state.input_file = undefined; // Clear file if setting raw ImageData
    this.clearError();
  }

  /**
   * Process the current input image
   */
  async processImage(): Promise<ProcessingResult> {
    if (!this._state.is_initialized) {
      throw new Error('Vectorizer not initialized');
    }

    if (!this._state.input_image) {
      throw new Error('No input image set');
    }

    try {
      this._state.is_processing = true;
      this._state.current_progress = undefined;
      this.clearError();

      const result = await vectorizerService.processImage(
        this._state.input_image,
        this._state.config,
        (progress) => {
          this._state.current_progress = progress;
        }
      );

      this._state.last_result = result;
      return result;

    } catch (error) {
      const processingError = error as VectorizerError;
      this.setError(processingError);
      throw error;
    } finally {
      this._state.is_processing = false;
      this._state.current_progress = undefined;
    }
  }

  /**
   * Clear the current input
   */
  clearInput(): void {
    this._state.input_image = undefined;
    this._state.input_file = undefined;
    this._state.last_result = undefined;
    this.clearError();
  }

  /**
   * Clear the last result
   */
  clearResult(): void {
    this._state.last_result = undefined;
  }

  /**
   * Set error state
   */
  private setError(error: VectorizerError): void {
    this._state.error = error;
    this._state.has_error = true;
    
    // Log error for debugging
    console.error('Vectorizer error:', error);
    
    // Auto-clear certain types of errors after a delay
    if (error.type === 'config') {
      setTimeout(() => {
        if (this._state.error === error) {
          this.clearError();
        }
      }, 10000); // Clear config errors after 10 seconds
    }
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this._state.error = undefined;
    this._state.has_error = false;
  }

  /**
   * Retry the last failed operation
   */
  async retryLastOperation(): Promise<void> {
    if (!this._state.has_error) {
      return;
    }

    this.clearError();

    // Determine what to retry based on current state
    if (this._state.input_image && !this._state.is_initialized) {
      // Retry initialization
      await this.initialize();
    } else if (this._state.input_image && this._state.is_initialized) {
      // Retry processing
      await this.processImage();
    }
  }

  /**
   * Reset the entire state to initial values
   */
  reset(): void {
    this._state.is_processing = false;
    this._state.current_progress = undefined;
    this._state.last_result = undefined;
    this._state.input_image = undefined;
    this._state.input_file = undefined;
    this.clearError();
    this.resetConfig();
  }

  /**
   * Get user-friendly error message
   */
  getErrorMessage(error?: VectorizerError): string {
    const err = error || this._state.error;
    if (!err) return '';

    const baseMessages: Record<VectorizerError['type'], string> = {
      config: 'Configuration error. Please check your settings and try again.',
      processing: 'Processing failed. The image might be too complex or corrupted.',
      memory: 'Not enough memory to process this image. Try a smaller image or reduce quality settings.',
      threading: 'Multi-threading setup failed. Processing will continue in single-threaded mode.',
      unknown: 'An unexpected error occurred. Please try again.'
    };

    let message = baseMessages[err.type] || baseMessages.unknown;

    // Add specific guidance based on error details
    if (err.details) {
      if (err.details.includes('SharedArrayBuffer')) {
        message += ' Note: Multi-threading requires HTTPS and specific CORS headers.';
      } else if (err.details.includes('memory') || err.details.includes('allocation')) {
        message += ' Try reducing the image size or detail level.';
      } else if (err.details.includes('timeout')) {
        message += ' The operation took too long. Try reducing complexity or increasing the timeout.';
      }
    }

    return message;
  }

  /**
   * Get recovery suggestions for current error
   */
  getRecoverySuggestions(): string[] {
    if (!this._state.error) return [];

    const suggestions: string[] = [];

    switch (this._state.error.type) {
      case 'config':
        suggestions.push('Reset to default settings');
        suggestions.push('Try a different algorithm or preset');
        break;

      case 'processing':
        suggestions.push('Try a smaller image (reduce resolution)');
        suggestions.push('Lower the detail level');
        suggestions.push('Use a simpler algorithm like "centerline"');
        break;

      case 'memory':
        suggestions.push('Reduce image size before uploading');
        suggestions.push('Lower quality settings');
        suggestions.push('Close other browser tabs to free memory');
        break;

      case 'threading':
        suggestions.push('Processing will continue in single-threaded mode');
        suggestions.push('For faster processing, serve over HTTPS with proper CORS headers');
        break;

      case 'unknown':
        suggestions.push('Refresh the page and try again');
        suggestions.push('Check browser console for more details');
        suggestions.push('Try a different image or settings');
        break;
    }

    return suggestions;
  }

  /**
   * Get processing statistics
   */
  getStats(): {
    processing_time?: number;
    input_size?: string;
    output_size?: string;
    compression_ratio?: number;
  } {
    if (!this._state.last_result) {
      return {};
    }

    const result = this._state.last_result;
    const stats: any = {
      processing_time: result.processing_time_ms
    };

    if (result.statistics) {
      const [width, height] = result.statistics.input_dimensions;
      stats.input_size = `${width}×${height}`;
      stats.compression_ratio = result.statistics.compression_ratio;
      
      // Estimate output size
      const svgSize = new TextEncoder().encode(result.svg).length;
      stats.output_size = this.formatFileSize(svgSize);
    }

    return stats;
  }

  /**
   * Check if current configuration is valid for processing
   */
  isConfigValid(): boolean {
    const config = this._state.config;
    
    // Basic validation
    if (config.detail < 1 || config.detail > 10) return false;
    if (config.stroke_width < 0.1 || config.stroke_width > 10) return false;
    
    // Backend-specific validation
    if (config.backend === 'dots') {
      if (config.dot_density !== undefined && (config.dot_density < 0.1 || config.dot_density > 3.0)) {
        return false;
      }
      if (config.background_tolerance !== undefined && (config.background_tolerance < 0 || config.background_tolerance > 1)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    workerManager.cleanup();
    this._state.is_initialized = false;
    this.clearInput();
    this.clearError();
  }

  // Helper methods
  private async fileToImageData(file: File): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        try {
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          resolve(imageData);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}

// Export singleton instance
export const vectorizerStore = new VectorizerStore();