//! Resolution-aware processing for performance optimization
//!
//! This module provides adaptive resolution processing to maintain performance targets
//! while preserving visual quality through intelligent scaling and parameter adjustment.

use crate::error::{VectorizeError, VectorizeResult};
use crate::config::{RegionsConfig, LogoConfig, Epsilon};
use crate::TraceLowConfig;
use image::RgbaImage;

/// Resolution processing strategy for different image sizes
#[derive(Debug, Clone, Copy)]
pub enum ResolutionStrategy {
    /// Process at full resolution (small images)
    FullResolution,
    /// Process at reduced resolution with quality preservation
    AdaptiveDownscale { scale_factor: f32 },
    /// Aggressive downscaling for very large images
    AggressiveDownscale { scale_factor: f32 },
}

/// Resolution management configuration
#[derive(Debug, Clone)]
pub struct ResolutionConfig {
    /// Maximum processing dimension before triggering downscaling
    pub max_processing_size: u32,
    /// Aggressive downscaling threshold 
    pub aggressive_threshold: u32,
    /// Target processing time in seconds
    pub target_processing_time: f64,
    /// Quality preservation mode
    pub preserve_quality: bool,
}

impl Default for ResolutionConfig {
    fn default() -> Self {
        Self {
            max_processing_size: 2048,  // Start downscaling at 2K
            aggressive_threshold: 3072,  // Aggressive at 3K+
            target_processing_time: 2.5,
            preserve_quality: true,
        }
    }
}

/// Resolution analysis result
#[derive(Debug, Clone)]
pub struct ResolutionAnalysis {
    pub original_dimensions: (u32, u32),
    pub processing_dimensions: (u32, u32),
    pub scale_factor: f32,
    pub strategy: ResolutionStrategy,
    pub estimated_complexity: f64,
    pub parameter_adjustments: ParameterAdjustments,
}

/// Parameter adjustments for scaled processing
#[derive(Debug, Clone)]
pub struct ParameterAdjustments {
    /// Epsilon scaling for path simplification
    pub epsilon_scale: f64,
    /// SLIC step size adjustment
    pub slic_step_adjustment: f64,
    /// Iteration count adjustment for algorithms
    pub iteration_adjustment: f64,
    /// Quality threshold adjustments
    pub quality_threshold_adjustment: f64,
}

impl Default for ParameterAdjustments {
    fn default() -> Self {
        Self {
            epsilon_scale: 1.0,
            slic_step_adjustment: 1.0,
            iteration_adjustment: 1.0,
            quality_threshold_adjustment: 1.0,
        }
    }
}

/// Analyze image resolution and determine optimal processing strategy
pub fn analyze_resolution_requirements(
    image: &RgbaImage,
    config: &ResolutionConfig,
) -> ResolutionAnalysis {
    let (width, height) = image.dimensions();
    let max_dimension = width.max(height);
    
    // Calculate processing complexity estimate
    let complexity = calculate_processing_complexity(width, height);
    
    let (strategy, processing_dimensions, scale_factor) = if max_dimension <= config.max_processing_size {
        // Small image - process at full resolution
        (ResolutionStrategy::FullResolution, (width, height), 1.0)
    } else if max_dimension <= config.aggressive_threshold {
        // Medium-large image - adaptive downscaling
        let scale = config.max_processing_size as f32 / max_dimension as f32;
        let new_width = (width as f32 * scale) as u32;
        let new_height = (height as f32 * scale) as u32;
        (
            ResolutionStrategy::AdaptiveDownscale { scale_factor: scale },
            (new_width, new_height),
            scale,
        )
    } else {
        // Very large image - aggressive downscaling 
        let target_size = (config.max_processing_size as f32 * 0.75) as u32; // 75% of max for safety
        let scale = target_size as f32 / max_dimension as f32;
        let new_width = (width as f32 * scale) as u32;
        let new_height = (height as f32 * scale) as u32;
        (
            ResolutionStrategy::AggressiveDownscale { scale_factor: scale },
            (new_width, new_height),
            scale,
        )
    };
    
    // Calculate parameter adjustments based on scaling
    let parameter_adjustments = calculate_parameter_adjustments(scale_factor, &strategy, config);
    
    log::info!(
        "Resolution analysis: {}x{} -> {}x{} (scale: {:.3}, strategy: {:?}, complexity: {:.2})",
        width, height, processing_dimensions.0, processing_dimensions.1, scale_factor, strategy, complexity
    );
    
    ResolutionAnalysis {
        original_dimensions: (width, height),
        processing_dimensions,
        scale_factor,
        strategy,
        estimated_complexity: complexity,
        parameter_adjustments,
    }
}

/// Calculate processing complexity estimate based on dimensions
fn calculate_processing_complexity(width: u32, height: u32) -> f64 {
    let pixel_count = width as f64 * height as f64;
    let megapixels = pixel_count / 1_000_000.0;
    
    // Empirical complexity model based on SLIC and Wu quantization
    // SLIC: O(pixels * centers * iterations) ≈ O(pixels^1.5)
    // Wu: O(pixels * colors) ≈ O(pixels * log(pixels))
    let slic_complexity = megapixels.powf(1.5);
    let wu_complexity = megapixels * megapixels.log2();
    
    (slic_complexity + wu_complexity) / 2.0
}

/// Calculate parameter adjustments for scaled processing
fn calculate_parameter_adjustments(
    scale_factor: f32,
    strategy: &ResolutionStrategy,
    config: &ResolutionConfig,
) -> ParameterAdjustments {
    if scale_factor >= 1.0 {
        // No scaling - no adjustments needed
        return ParameterAdjustments::default();
    }
    
    // Base adjustments on scale factor
    let epsilon_scale = scale_factor as f64; // Scale epsilon proportionally
    let slic_step_adjustment = scale_factor as f64; // Scale SLIC step proportionally
    
    // Adjust iteration counts - fewer iterations for smaller images can maintain quality
    let iteration_adjustment = match strategy {
        ResolutionStrategy::FullResolution => 1.0,
        ResolutionStrategy::AdaptiveDownscale { .. } => {
            // Slight reduction for adaptive scaling
            (0.85 + 0.15 * scale_factor).max(0.7)
        },
        ResolutionStrategy::AggressiveDownscale { .. } => {
            // More aggressive iteration reduction
            (0.7 + 0.3 * scale_factor).max(0.5)
        },
    };
    
    // Quality thresholds may need slight adjustment for scaled processing
    let quality_threshold_adjustment = if config.preserve_quality {
        // Stricter thresholds to maintain quality despite scaling
        1.0 / (1.0 + 0.2 * (1.0 - scale_factor))
    } else {
        // Relaxed thresholds for performance
        1.0 + 0.1 * (1.0 - scale_factor)
    };
    
    ParameterAdjustments {
        epsilon_scale,
        slic_step_adjustment,
        iteration_adjustment: iteration_adjustment as f64,
        quality_threshold_adjustment: quality_threshold_adjustment as f64,
    }
}

/// Apply resolution-aware processing to an image
pub fn apply_resolution_processing(
    image: &RgbaImage,
    analysis: &ResolutionAnalysis,
) -> VectorizeResult<RgbaImage> {
    match analysis.strategy {
        ResolutionStrategy::FullResolution => {
            // No scaling needed
            Ok(image.clone())
        },
        ResolutionStrategy::AdaptiveDownscale { .. } | 
        ResolutionStrategy::AggressiveDownscale { .. } => {
            // Scale image to processing dimensions using high-quality filtering
            let (new_width, new_height) = analysis.processing_dimensions;
            
            log::debug!(
                "Scaling image from {}x{} to {}x{} using Lanczos3 filter",
                image.width(), image.height(), new_width, new_height
            );
            
            let scaled = image::imageops::resize(
                image,
                new_width,
                new_height,
                image::imageops::FilterType::Lanczos3, // High-quality downsampling
            );
            
            Ok(scaled)
        }
    }
}

/// Scale SVG coordinates back to original resolution
pub fn scale_svg_coordinates(
    svg_content: &str,
    analysis: &ResolutionAnalysis,
) -> VectorizeResult<String> {
    if analysis.scale_factor >= 1.0 {
        // No scaling needed
        return Ok(svg_content.to_string());
    }
    
    let inverse_scale = 1.0 / analysis.scale_factor;
    
    // Parse and scale SVG viewBox and path coordinates
    let scaled_svg = scale_svg_viewbox_and_paths(svg_content, inverse_scale)?;
    
    log::debug!(
        "Scaled SVG coordinates by factor {:.3} from processing to original resolution",
        inverse_scale
    );
    
    Ok(scaled_svg)
}

/// Scale SVG viewBox and path coordinates
fn scale_svg_viewbox_and_paths(svg_content: &str, scale_factor: f32) -> VectorizeResult<String> {
    use regex::Regex;
    
    let mut result = svg_content.to_string();
    
    // Scale viewBox attribute
    let viewbox_re = Regex::new(r#"viewBox="([^"]+)""#)
        .map_err(|e| VectorizeError::algorithm_error(format!("Regex error: {}", e)))?;
    
    if let Some(caps) = viewbox_re.captures(&result) {
        let viewbox = &caps[1];
        let parts: Vec<f32> = viewbox
            .split_whitespace()
            .filter_map(|s| s.parse().ok())
            .collect();
        
        if parts.len() == 4 {
            let scaled_viewbox = format!(
                "{} {} {} {}",
                parts[0] * scale_factor,
                parts[1] * scale_factor,
                parts[2] * scale_factor,
                parts[3] * scale_factor
            );
            result = result.replace(&format!("viewBox=\"{}\"", viewbox), &format!("viewBox=\"{}\"", scaled_viewbox));
        }
    }
    
    // Scale path coordinates (simplified scaling - in production, would use proper SVG parser)
    let path_re = Regex::new(r#"d="([^"]+)""#)
        .map_err(|e| VectorizeError::algorithm_error(format!("Regex error: {}", e)))?;
    
    for caps in path_re.captures_iter(svg_content) {
        let path_data = &caps[1];
        let scaled_path = scale_path_data(path_data, scale_factor)?;
        result = result.replace(&format!("d=\"{}\"", path_data), &format!("d=\"{}\"", scaled_path));
    }
    
    Ok(result)
}

/// Scale individual path data coordinates
fn scale_path_data(path_data: &str, scale_factor: f32) -> VectorizeResult<String> {
    use regex::Regex;
    
    // Match numeric values in path data
    let number_re = Regex::new(r"-?\d+(?:\.\d+)?")
        .map_err(|e| VectorizeError::algorithm_error(format!("Regex error: {}", e)))?;
    
    let result = number_re.replace_all(path_data, |caps: &regex::Captures| {
        if let Ok(num) = caps[0].parse::<f32>() {
            format!("{:.2}", num * scale_factor)
        } else {
            caps[0].to_string()
        }
    });
    
    Ok(result.to_string())
}

/// Apply parameter adjustments to RegionsConfig
pub fn adjust_regions_config(
    config: &RegionsConfig,
    adjustments: &ParameterAdjustments,
) -> RegionsConfig {
    let mut adjusted = config.clone();
    
    // Scale SLIC step size proportionally
    adjusted.slic_step_px = (adjusted.slic_step_px as f64 * adjustments.slic_step_adjustment) as u32;
    adjusted.slic_step_px = adjusted.slic_step_px.max(8); // Minimum step size
    
    // Reduce SLIC iterations for scaled images
    adjusted.slic_iterations = (adjusted.slic_iterations as f64 * adjustments.iteration_adjustment) as u32;
    adjusted.slic_iterations = adjusted.slic_iterations.max(3).min(15); // Clamp to reasonable range
    
    // Adjust simplification epsilon
    adjusted.simplification_epsilon = match adjusted.simplification_epsilon {
        Epsilon::Pixels(px) => Epsilon::Pixels(px * adjustments.epsilon_scale),
        Epsilon::DiagFrac(frac) => Epsilon::DiagFrac(frac), // Keep fraction unchanged
    };
    
    // Adjust quality thresholds
    adjusted.merge_threshold *= adjustments.quality_threshold_adjustment;
    adjusted.de_merge_threshold *= adjustments.quality_threshold_adjustment;
    adjusted.de_split_threshold *= adjustments.quality_threshold_adjustment;
    
    log::debug!(
        "Adjusted regions config: step_px {} -> {}, iterations {} -> {}, epsilon scale {:.3}",
        config.slic_step_px, adjusted.slic_step_px,
        config.slic_iterations, adjusted.slic_iterations,
        adjustments.epsilon_scale
    );
    
    adjusted
}

/// Apply parameter adjustments to LogoConfig  
pub fn adjust_logo_config(
    config: &LogoConfig,
    adjustments: &ParameterAdjustments,
) -> LogoConfig {
    let mut adjusted = config.clone();
    
    // Adjust simplification epsilon
    adjusted.simplification_epsilon = match adjusted.simplification_epsilon {
        Epsilon::Pixels(px) => Epsilon::Pixels(px * adjustments.epsilon_scale),
        Epsilon::DiagFrac(frac) => Epsilon::DiagFrac(frac), // Keep fraction unchanged
    };
    
    // Adjust curve tolerance for scaled processing
    adjusted.curve_tolerance *= adjustments.epsilon_scale;
    
    log::debug!(
        "Adjusted logo config: epsilon scale {:.3}, curve tolerance scale {:.3}",
        adjustments.epsilon_scale, adjustments.epsilon_scale
    );
    
    adjusted
}

/// Apply parameter adjustments to TraceLowConfig
pub fn adjust_trace_low_config(
    config: &TraceLowConfig,
    adjustments: &ParameterAdjustments,
) -> TraceLowConfig {
    let mut adjusted = config.clone();
    
    // Scale stroke width proportionally to maintain visual consistency
    adjusted.stroke_px_at_1080p *= adjustments.epsilon_scale as f32;
    
    log::debug!(
        "Adjusted trace-low config: stroke scale {:.3}",
        adjustments.epsilon_scale
    );
    
    adjusted
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_resolution_analysis_small_image() {
        let image = RgbaImage::new(512, 512);
        let config = ResolutionConfig::default();
        let analysis = analyze_resolution_requirements(&image, &config);
        
        assert_eq!(analysis.original_dimensions, (512, 512));
        assert_eq!(analysis.processing_dimensions, (512, 512));
        assert_eq!(analysis.scale_factor, 1.0);
        matches!(analysis.strategy, ResolutionStrategy::FullResolution);
    }
    
    #[test]
    fn test_resolution_analysis_large_image() {
        let image = RgbaImage::new(3000, 2000);
        let config = ResolutionConfig::default();
        let analysis = analyze_resolution_requirements(&image, &config);
        
        assert_eq!(analysis.original_dimensions, (3000, 2000));
        assert!(analysis.processing_dimensions.0 <= config.max_processing_size);
        assert!(analysis.scale_factor < 1.0);
        matches!(analysis.strategy, ResolutionStrategy::AdaptiveDownscale { .. });
    }
    
    #[test]
    fn test_parameter_adjustments() {
        let adjustments = calculate_parameter_adjustments(
            0.5,
            &ResolutionStrategy::AdaptiveDownscale { scale_factor: 0.5 },
            &ResolutionConfig::default(),
        );
        
        assert_eq!(adjustments.epsilon_scale, 0.5);
        assert_eq!(adjustments.slic_step_adjustment, 0.5);
        assert!(adjustments.iteration_adjustment < 1.0);
    }
    
    #[test]
    fn test_complexity_calculation() {
        let complexity_small = calculate_processing_complexity(512, 512);
        let complexity_large = calculate_processing_complexity(2048, 2048);
        
        assert!(complexity_large > complexity_small);
        assert!(complexity_large / complexity_small > 10.0); // Should be significantly higher
    }
}