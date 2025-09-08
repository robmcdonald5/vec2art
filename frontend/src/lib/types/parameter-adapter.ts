/**
 * Parameter Adapter - Bridge between legacy and generated types
 * 
 * This adapter provides a smooth transition from the legacy VectorizerConfig
 * to the generated parameter types from Rust. It handles:
 * - Parameter name mapping (stroke_width <-> stroke_px_at_1080p)
 * - Type conversion and validation using generated metadata
 * - Backend-specific parameter filtering
 */

import type { VectorizerConfig as LegacyConfig } from './vectorizer';
import type { 
  VectorizerConfig as GeneratedConfig,
  VectorizerBackend,
  EdgeBackendConfig,
  CenterlineBackendConfig,
  SuperpixelBackendConfig,
  DotsBackendConfig,
  PARAMETER_METADATA,
  ParameterMetadata
} from './generated-parameters';
import { 
  getParametersForBackend,
  getParameterMetadata,
  validateParameter 
} from './generated-parameters';

/**
 * Parameter mapping between legacy and generated names
 */
const PARAMETER_NAME_MAPPING = {
  // Legacy -> Generated
  stroke_width: 'stroke_px_at_1080p',
  window_size: 'adaptive_threshold_window_size',
  sensitivity_k: 'adaptive_threshold_k',
  reverse_pass: 'enable_reverse_pass',
  diagonal_pass: 'enable_diagonal_pass',
  multipass: 'enable_multipass',
  
  // Generated -> Legacy (reverse mapping)
  stroke_px_at_1080p: 'stroke_width',
  adaptive_threshold_window_size: 'window_size',
  adaptive_threshold_k: 'sensitivity_k',
  enable_reverse_pass: 'reverse_pass',
  enable_diagonal_pass: 'diagonal_pass',
  enable_multipass: 'multipass',
} as const;

/**
 * Convert legacy config to generated config format
 */
export function legacyToGenerated(legacyConfig: LegacyConfig): Partial<GeneratedConfig> {
  const generated: Partial<GeneratedConfig> = {};
  
  // Map core parameters with name changes
  if (legacyConfig.stroke_width !== undefined) {
    generated.stroke_px_at_1080p = legacyConfig.stroke_width;
  }
  
  if (legacyConfig.detail !== undefined) {
    generated.detail = legacyConfig.detail;
  }
  
  // Map centerline parameters
  if (legacyConfig.window_size !== undefined) {
    generated.adaptive_threshold_window_size = legacyConfig.window_size;
  }
  
  if (legacyConfig.sensitivity_k !== undefined) {
    generated.adaptive_threshold_k = legacyConfig.sensitivity_k;
  }
  
  if (legacyConfig.enable_adaptive_threshold !== undefined) {
    generated.enable_adaptive_threshold = legacyConfig.enable_adaptive_threshold;
  }
  
  if (legacyConfig.douglas_peucker_epsilon !== undefined) {
    generated.douglas_peucker_epsilon = legacyConfig.douglas_peucker_epsilon;
  }
  
  if (legacyConfig.min_branch_length !== undefined) {
    generated.min_branch_length = legacyConfig.min_branch_length;
  }
  
  if (legacyConfig.enable_width_modulation !== undefined) {
    generated.enable_width_modulation = legacyConfig.enable_width_modulation;
  }
  
  // Map edge parameters
  if (legacyConfig.multipass !== undefined) {
    generated.enable_multipass = legacyConfig.multipass;
  }
  
  if (legacyConfig.pass_count !== undefined) {
    generated.pass_count = legacyConfig.pass_count;
  }
  
  if (legacyConfig.reverse_pass !== undefined) {
    generated.enable_reverse_pass = legacyConfig.reverse_pass;
  }
  
  if (legacyConfig.diagonal_pass !== undefined) {
    generated.enable_diagonal_pass = legacyConfig.diagonal_pass;
  }
  
  if (legacyConfig.directional_strength_threshold !== undefined) {
    generated.directional_strength_threshold = legacyConfig.directional_strength_threshold;
  }
  
  // Map noise filtering parameters
  if (legacyConfig.noise_filtering !== undefined) {
    generated.noise_filtering = legacyConfig.noise_filtering;
  }
  
  if (legacyConfig.noise_filter_spatial_sigma !== undefined) {
    generated.noise_filter_spatial_sigma = legacyConfig.noise_filter_spatial_sigma;
  }
  
  if (legacyConfig.noise_filter_range_sigma !== undefined) {
    generated.noise_filter_range_sigma = legacyConfig.noise_filter_range_sigma;
  }
  
  // Map superpixel parameters
  if (legacyConfig.num_superpixels !== undefined) {
    generated.num_superpixels = legacyConfig.num_superpixels;
  }
  
  if (legacyConfig.compactness !== undefined) {
    generated.superpixel_compactness = legacyConfig.compactness;
  }
  
  if (legacyConfig.slic_iterations !== undefined) {
    generated.superpixel_slic_iterations = legacyConfig.slic_iterations;
  }
  
  if (legacyConfig.superpixel_initialization_pattern !== undefined) {
    generated.superpixel_initialization_pattern = legacyConfig.superpixel_initialization_pattern;
  }
  
  if (legacyConfig.fill_regions !== undefined) {
    generated.superpixel_fill_regions = legacyConfig.fill_regions;
  }
  
  if (legacyConfig.stroke_regions !== undefined) {
    generated.superpixel_stroke_regions = legacyConfig.stroke_regions;
  }
  
  if (legacyConfig.simplify_boundaries !== undefined) {
    generated.superpixel_simplify_boundaries = legacyConfig.simplify_boundaries;
  }
  
  if (legacyConfig.boundary_epsilon !== undefined) {
    generated.superpixel_boundary_epsilon = legacyConfig.boundary_epsilon;
  }
  
  if (legacyConfig.preserve_colors !== undefined && legacyConfig.backend === 'superpixel') {
    generated.superpixel_preserve_colors = legacyConfig.preserve_colors;
  }
  
  // Map dots parameters
  if (legacyConfig.dot_density_threshold !== undefined) {
    generated.dot_density_threshold = legacyConfig.dot_density_threshold;
  }
  
  if (legacyConfig.min_radius !== undefined) {
    generated.dot_min_radius = legacyConfig.min_radius;
  }
  
  if (legacyConfig.max_radius !== undefined) {
    generated.dot_max_radius = legacyConfig.max_radius;
  }
  
  if (legacyConfig.adaptive_sizing !== undefined) {
    generated.dot_adaptive_sizing = legacyConfig.adaptive_sizing;
  }
  
  if (legacyConfig.background_tolerance !== undefined) {
    generated.dot_background_tolerance = legacyConfig.background_tolerance;
  }
  
  if (legacyConfig.poisson_disk_sampling !== undefined) {
    generated.dot_poisson_disk_sampling = legacyConfig.poisson_disk_sampling;
  }
  
  if (legacyConfig.gradient_based_sizing !== undefined) {
    generated.dot_gradient_based_sizing = legacyConfig.gradient_based_sizing;
  }
  
  if (legacyConfig.preserve_colors !== undefined && legacyConfig.backend === 'dots') {
    generated.dot_preserve_colors = legacyConfig.preserve_colors;
  }
  
  // Map processing time
  if (legacyConfig.max_processing_time_ms !== undefined) {
    generated.max_processing_time_ms = legacyConfig.max_processing_time_ms;
  }
  
  return generated;
}

/**
 * Convert generated config to legacy config format
 */
export function generatedToLegacy(generatedConfig: Partial<GeneratedConfig>, backend: VectorizerBackend): Partial<LegacyConfig> {
  const legacy: Partial<LegacyConfig> = { backend };
  
  // Map core parameters with name changes
  if (generatedConfig.stroke_px_at_1080p !== undefined) {
    legacy.stroke_width = generatedConfig.stroke_px_at_1080p;
  }
  
  if (generatedConfig.detail !== undefined) {
    legacy.detail = generatedConfig.detail;
  }
  
  // Map centerline parameters
  if (generatedConfig.adaptive_threshold_window_size !== undefined) {
    legacy.window_size = generatedConfig.adaptive_threshold_window_size;
  }
  
  if (generatedConfig.adaptive_threshold_k !== undefined) {
    legacy.sensitivity_k = generatedConfig.adaptive_threshold_k;
  }
  
  if (generatedConfig.enable_adaptive_threshold !== undefined) {
    legacy.enable_adaptive_threshold = generatedConfig.enable_adaptive_threshold;
  }
  
  if (generatedConfig.douglas_peucker_epsilon !== undefined) {
    legacy.douglas_peucker_epsilon = generatedConfig.douglas_peucker_epsilon;
  }
  
  if (generatedConfig.min_branch_length !== undefined) {
    legacy.min_branch_length = generatedConfig.min_branch_length;
  }
  
  if (generatedConfig.enable_width_modulation !== undefined) {
    legacy.enable_width_modulation = generatedConfig.enable_width_modulation;
  }
  
  // Map edge parameters
  if (generatedConfig.enable_multipass !== undefined) {
    legacy.multipass = generatedConfig.enable_multipass;
  }
  
  if (generatedConfig.pass_count !== undefined) {
    legacy.pass_count = generatedConfig.pass_count;
  }
  
  if (generatedConfig.enable_reverse_pass !== undefined) {
    legacy.reverse_pass = generatedConfig.enable_reverse_pass;
  }
  
  if (generatedConfig.enable_diagonal_pass !== undefined) {
    legacy.diagonal_pass = generatedConfig.enable_diagonal_pass;
  }
  
  if (generatedConfig.directional_strength_threshold !== undefined) {
    legacy.directional_strength_threshold = generatedConfig.directional_strength_threshold;
  }
  
  // Map noise filtering parameters
  if (generatedConfig.noise_filtering !== undefined) {
    legacy.noise_filtering = generatedConfig.noise_filtering;
  }
  
  if (generatedConfig.noise_filter_spatial_sigma !== undefined) {
    legacy.noise_filter_spatial_sigma = generatedConfig.noise_filter_spatial_sigma;
  }
  
  if (generatedConfig.noise_filter_range_sigma !== undefined) {
    legacy.noise_filter_range_sigma = generatedConfig.noise_filter_range_sigma;
  }
  
  // Map superpixel parameters
  if (generatedConfig.num_superpixels !== undefined) {
    legacy.num_superpixels = generatedConfig.num_superpixels;
  }
  
  if (generatedConfig.superpixel_compactness !== undefined) {
    legacy.compactness = generatedConfig.superpixel_compactness;
  }
  
  if (generatedConfig.superpixel_slic_iterations !== undefined) {
    legacy.slic_iterations = generatedConfig.superpixel_slic_iterations;
  }
  
  if (generatedConfig.superpixel_initialization_pattern !== undefined) {
    legacy.superpixel_initialization_pattern = generatedConfig.superpixel_initialization_pattern;
  }
  
  if (generatedConfig.superpixel_fill_regions !== undefined) {
    legacy.fill_regions = generatedConfig.superpixel_fill_regions;
  }
  
  if (generatedConfig.superpixel_stroke_regions !== undefined) {
    legacy.stroke_regions = generatedConfig.superpixel_stroke_regions;
  }
  
  if (generatedConfig.superpixel_simplify_boundaries !== undefined) {
    legacy.simplify_boundaries = generatedConfig.superpixel_simplify_boundaries;
  }
  
  if (generatedConfig.superpixel_boundary_epsilon !== undefined) {
    legacy.boundary_epsilon = generatedConfig.superpixel_boundary_epsilon;
  }
  
  if (generatedConfig.superpixel_preserve_colors !== undefined) {
    legacy.preserve_colors = generatedConfig.superpixel_preserve_colors;
  }
  
  // Map dots parameters
  if (generatedConfig.dot_density_threshold !== undefined) {
    legacy.dot_density_threshold = generatedConfig.dot_density_threshold;
  }
  
  if (generatedConfig.dot_min_radius !== undefined) {
    legacy.min_radius = generatedConfig.dot_min_radius;
  }
  
  if (generatedConfig.dot_max_radius !== undefined) {
    legacy.max_radius = generatedConfig.dot_max_radius;
  }
  
  if (generatedConfig.dot_adaptive_sizing !== undefined) {
    legacy.adaptive_sizing = generatedConfig.dot_adaptive_sizing;
  }
  
  if (generatedConfig.dot_background_tolerance !== undefined) {
    legacy.background_tolerance = generatedConfig.dot_background_tolerance;
  }
  
  if (generatedConfig.dot_poisson_disk_sampling !== undefined) {
    legacy.poisson_disk_sampling = generatedConfig.dot_poisson_disk_sampling;
  }
  
  if (generatedConfig.dot_gradient_based_sizing !== undefined) {
    legacy.gradient_based_sizing = generatedConfig.dot_gradient_based_sizing;
  }
  
  if (generatedConfig.dot_preserve_colors !== undefined) {
    legacy.preserve_colors = generatedConfig.dot_preserve_colors;
  }
  
  // Map processing time
  if (generatedConfig.max_processing_time_ms !== undefined) {
    legacy.max_processing_time_ms = generatedConfig.max_processing_time_ms;
  }
  
  return legacy;
}

/**
 * Validate a legacy config using generated parameter metadata
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Array<{ field: string; message: string }>;
  warnings: Array<{ field: string; message: string }>;
  sanitized: Partial<GeneratedConfig>;
}

export function validateLegacyConfig(legacyConfig: LegacyConfig): ValidationResult {
  const errors: Array<{ field: string; message: string }> = [];
  const warnings: Array<{ field: string; message: string }> = [];
  
  // Convert to generated format for validation
  const generatedConfig = legacyToGenerated(legacyConfig);
  const sanitized: Partial<GeneratedConfig> = {};
  
  // Validate each parameter using generated metadata
  for (const [paramName, value] of Object.entries(generatedConfig)) {
    if (value === undefined) continue;
    
    const validation = validateParameter(paramName, value);
    if (!validation.valid && validation.error) {
      errors.push({ field: paramName, message: validation.error });
    } else {
      // Parameter is valid, include in sanitized config
      (sanitized as any)[paramName] = value;
    }
  }
  
  // Backend-specific validation
  if (legacyConfig.backend) {
    const applicableParams = getParametersForBackend(legacyConfig.backend);
    
    // Check for inapplicable parameters
    for (const [paramName, value] of Object.entries(generatedConfig)) {
      if (value === undefined) continue;
      
      if (!applicableParams.includes(paramName)) {
        warnings.push({ 
          field: paramName, 
          message: `Parameter '${paramName}' is not applicable to ${legacyConfig.backend} backend` 
        });
      }
    }
    
    // Check for missing required parameters
    for (const paramName of applicableParams) {
      const metadata = getParameterMetadata(paramName);
      const requires = (metadata as any)?.requires;
      if (requires && Array.isArray(requires)) {
        const hasRequiredDeps = requires.every((dep: string) => 
          (generatedConfig as any)[dep] !== undefined
        );
        
        if ((generatedConfig as any)[paramName] !== undefined && !hasRequiredDeps) {
          warnings.push({
            field: paramName,
            message: `Parameter '${paramName}' requires: ${requires.join(', ')}`
          });
        }
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitized
  };
}

/**
 * Get backend-specific config using generated types
 */
export function getBackendSpecificConfig(
  config: Partial<GeneratedConfig>, 
  backend: VectorizerBackend
): EdgeBackendConfig | CenterlineBackendConfig | SuperpixelBackendConfig | DotsBackendConfig {
  const applicableParams = getParametersForBackend(backend);
  const backendConfig: any = {};
  
  for (const paramName of applicableParams) {
    if ((config as any)[paramName] !== undefined) {
      backendConfig[paramName] = (config as any)[paramName];
    }
  }
  
  // Add required fields that might be missing
  backendConfig.stroke_px_at_1080p = backendConfig.stroke_px_at_1080p ?? 1.5;
  backendConfig.detail = backendConfig.detail ?? 0.8;
  backendConfig.max_processing_time_ms = backendConfig.max_processing_time_ms ?? 180000;
  
  return backendConfig;
}

/**
 * Enhanced configuration pipeline using generated types
 */
export interface EnhancedConfigResult {
  isValid: boolean;
  legacyConfig: LegacyConfig;
  generatedConfig: Partial<GeneratedConfig>;
  backendConfig: EdgeBackendConfig | CenterlineBackendConfig | SuperpixelBackendConfig | DotsBackendConfig;
  errors: Array<{ field: string; message: string }>;
  warnings: Array<{ field: string; message: string }>;
  metadata: { [key: string]: ParameterMetadata };
}

export function processConfigWithGenerated(legacyConfig: LegacyConfig): EnhancedConfigResult {
  const validation = validateLegacyConfig(legacyConfig);
  const generatedConfig = validation.sanitized;
  const backendConfig = getBackendSpecificConfig(generatedConfig, legacyConfig.backend);
  
  // Collect metadata for all applicable parameters
  const applicableParams = getParametersForBackend(legacyConfig.backend);
  const metadata: { [key: string]: ParameterMetadata } = {};
  for (const paramName of applicableParams) {
    const paramMetadata = getParameterMetadata(paramName);
    if (paramMetadata) {
      metadata[paramName] = paramMetadata;
    }
  }
  
  return {
    isValid: validation.isValid,
    legacyConfig,
    generatedConfig,
    backendConfig,
    errors: validation.errors,
    warnings: validation.warnings,
    metadata
  };
}