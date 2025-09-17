//! Gradient detection and analysis for SVG gradient generation
//!
//! This module analyzes color patterns in paths to detect and generate SVG gradients
//! for enhanced color rendering in vector output.

use crate::algorithms::{ColorSample, Point};
use std::collections::HashMap;

/// Point structure for gradient coordinates
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct GradientPoint {
    pub x: f32,
    pub y: f32,
}

impl GradientPoint {
    pub fn new(x: f32, y: f32) -> Self {
        Self { x, y }
    }
}

/// Color stop for gradient definitions
#[derive(Debug, Clone, PartialEq)]
pub struct GradientStop {
    /// Position along gradient (0.0-1.0)
    pub offset: f32,
    /// Color sample at this position
    pub color: ColorSample,
}

impl GradientStop {
    pub fn new(offset: f32, color: ColorSample) -> Self {
        Self { offset, color }
    }
}

/// Types of gradients that can be detected
#[derive(Debug, Clone, PartialEq)]
pub enum GradientType {
    /// Linear gradient from start to end point
    Linear {
        start: GradientPoint,
        end: GradientPoint,
        stops: Vec<GradientStop>,
        angle: f32,
    },
    /// Radial gradient centered at a point
    Radial {
        center: GradientPoint,
        radius: f32,
        stops: Vec<GradientStop>,
        focal_point: Option<GradientPoint>,
    },
}

/// Gradient analysis results for a path or region
#[derive(Debug, Clone)]
pub struct GradientAnalysis {
    /// Whether this region should use gradients
    pub use_gradient: bool,
    /// Type of gradient detected
    pub gradient_type: GradientType,
    /// Quality score of gradient detection (0.0-1.0)
    pub quality_score: f32,
    /// Complexity score (lower = simpler gradients)
    pub complexity_score: f32,
    /// Whether the gradient significantly improves visual quality
    pub improves_quality: bool,
}

/// Configuration for gradient detection
#[derive(Debug, Clone)]
pub struct GradientDetectionConfig {
    /// Minimum quality score to use gradients (0.0-1.0)
    pub min_quality_threshold: f32,
    /// Maximum complexity score to allow (0.0-1.0)
    pub max_complexity_threshold: f32,
    /// Minimum number of color samples to detect gradients
    pub min_samples_for_gradient: usize,
    /// Enable linear gradient detection
    pub enable_linear_gradients: bool,
    /// Enable radial gradient detection
    pub enable_radial_gradients: bool,
}

impl Default for GradientDetectionConfig {
    fn default() -> Self {
        Self {
            min_quality_threshold: 0.6,
            max_complexity_threshold: 0.8,
            min_samples_for_gradient: 3,
            enable_linear_gradients: true,
            enable_radial_gradients: true,
        }
    }
}

/// Analyze a path for gradient potential
pub fn analyze_path_for_gradients(
    path: &[Point],
    color_samples: &[ColorSample],
    config: &GradientDetectionConfig,
) -> Option<GradientAnalysis> {
    if color_samples.len() < config.min_samples_for_gradient {
        return None;
    }

    // Try linear gradient first
    if config.enable_linear_gradients {
        if let Some(analysis) = detect_linear_gradient(path, color_samples, config) {
            if analysis.quality_score >= config.min_quality_threshold
                && analysis.complexity_score <= config.max_complexity_threshold
            {
                return Some(analysis);
            }
        }
    }

    // Try radial gradient if linear failed or was disabled
    if config.enable_radial_gradients {
        if let Some(analysis) = detect_radial_gradient(path, color_samples, config) {
            if analysis.quality_score >= config.min_quality_threshold
                && analysis.complexity_score <= config.max_complexity_threshold
            {
                return Some(analysis);
            }
        }
    }

    None
}

/// Detect linear gradient patterns in a path
fn detect_linear_gradient(
    path: &[Point],
    color_samples: &[ColorSample],
    _config: &GradientDetectionConfig,
) -> Option<GradientAnalysis> {
    if path.len() < 2 || color_samples.len() < 2 {
        return None;
    }

    // Calculate path bounds
    let mut min_x = f32::MAX;
    let mut max_x = f32::MIN;
    let mut min_y = f32::MAX;
    let mut max_y = f32::MIN;

    for point in path {
        min_x = min_x.min(point.x);
        max_x = max_x.max(point.x);
        min_y = min_y.min(point.y);
        max_y = max_y.max(point.y);
    }

    // Determine primary gradient direction
    let width = max_x - min_x;
    let height = max_y - min_y;

    let (start, end, angle) = if width > height {
        // Horizontal gradient
        (
            GradientPoint::new(min_x, (min_y + max_y) * 0.5),
            GradientPoint::new(max_x, (min_y + max_y) * 0.5),
            0.0,
        )
    } else {
        // Vertical gradient
        (
            GradientPoint::new((min_x + max_x) * 0.5, min_y),
            GradientPoint::new((min_x + max_x) * 0.5, max_y),
            90.0,
        )
    };

    // Create gradient stops from color samples
    let mut stops = Vec::new();
    for (i, sample) in color_samples.iter().enumerate() {
        let offset = i as f32 / (color_samples.len() - 1) as f32;
        stops.push(GradientStop::new(offset, sample.clone()));
    }

    // Calculate quality and complexity scores
    let quality_score = calculate_linear_gradient_quality(color_samples);
    let complexity_score = calculate_gradient_complexity(&stops);

    Some(GradientAnalysis {
        use_gradient: true,
        gradient_type: GradientType::Linear {
            start,
            end,
            stops,
            angle,
        },
        quality_score,
        complexity_score,
        improves_quality: quality_score > 0.5,
    })
}

/// Detect radial gradient patterns in a path
fn detect_radial_gradient(
    path: &[Point],
    color_samples: &[ColorSample],
    _config: &GradientDetectionConfig,
) -> Option<GradientAnalysis> {
    if path.len() < 3 || color_samples.len() < 2 {
        return None;
    }

    // Calculate path centroid
    let mut center_x = 0.0;
    let mut center_y = 0.0;
    for point in path {
        center_x += point.x;
        center_y += point.y;
    }
    center_x /= path.len() as f32;
    center_y /= path.len() as f32;

    // Calculate maximum radius
    let mut max_radius: f32 = 0.0;
    for point in path {
        let dx = point.x - center_x;
        let dy = point.y - center_y;
        let radius = (dx * dx + dy * dy).sqrt();
        max_radius = max_radius.max(radius);
    }

    let center = GradientPoint::new(center_x, center_y);

    // Create gradient stops from color samples
    let mut stops = Vec::new();
    for (i, sample) in color_samples.iter().enumerate() {
        let offset = i as f32 / (color_samples.len() - 1) as f32;
        stops.push(GradientStop::new(offset, sample.clone()));
    }

    // Calculate quality and complexity scores
    let quality_score = calculate_radial_gradient_quality(color_samples, max_radius);
    let complexity_score = calculate_gradient_complexity(&stops);

    Some(GradientAnalysis {
        use_gradient: true,
        gradient_type: GradientType::Radial {
            center,
            radius: max_radius,
            stops,
            focal_point: None,
        },
        quality_score,
        complexity_score,
        improves_quality: quality_score > 0.5,
    })
}

/// Calculate quality score for linear gradients
fn calculate_linear_gradient_quality(color_samples: &[ColorSample]) -> f32 {
    if color_samples.len() < 2 {
        return 0.0;
    }

    // Check color variation - more variation = better gradient candidate
    let mut total_distance = 0.0;
    for i in 1..color_samples.len() {
        let prev = &color_samples[i - 1];
        let curr = &color_samples[i];
        total_distance += calculate_color_distance_perceptual(prev, curr);
    }

    // Normalize based on number of samples
    let avg_distance = total_distance / (color_samples.len() - 1) as f32;

    // Quality is higher with more color variation but not too chaotic
    (avg_distance / 100.0).clamp(0.0, 1.0)
}

/// Calculate quality score for radial gradients
fn calculate_radial_gradient_quality(color_samples: &[ColorSample], radius: f32) -> f32 {
    if color_samples.len() < 2 {
        return 0.0;
    }

    let linear_quality = calculate_linear_gradient_quality(color_samples);

    // Radial gradients work better with larger areas
    let size_bonus = (radius / 100.0).clamp(0.0, 0.3);

    (linear_quality + size_bonus).clamp(0.0, 1.0)
}

/// Calculate complexity score for gradient (lower = simpler)
fn calculate_gradient_complexity(stops: &[GradientStop]) -> f32 {
    // Complexity based on number of stops and color variation
    let stop_complexity = (stops.len() as f32 / 10.0).clamp(0.0, 1.0);

    // Add variation complexity
    let mut variation_complexity = 0.0;
    if stops.len() > 1 {
        for i in 1..stops.len() {
            let distance =
                calculate_color_distance_perceptual(&stops[i - 1].color, &stops[i].color);
            variation_complexity += distance;
        }
        variation_complexity =
            (variation_complexity / (stops.len() - 1) as f32 / 100.0).clamp(0.0, 1.0);
    }

    (stop_complexity + variation_complexity) * 0.5
}

/// Calculate perceptual color distance between two color samples
fn calculate_color_distance_perceptual(color1: &ColorSample, color2: &ColorSample) -> f32 {
    // Extract RGBA values
    let rgba1 = color1.color;
    let rgba2 = color2.color;

    // Simple Euclidean distance in RGB space (could be improved with LAB color space)
    let dr = rgba1[0] as f32 - rgba2[0] as f32;
    let dg = rgba1[1] as f32 - rgba2[1] as f32;
    let db = rgba1[2] as f32 - rgba2[2] as f32;

    (dr * dr + dg * dg + db * db).sqrt()
}

/// Generate unique gradient ID for SVG
pub fn generate_gradient_id(region_id: usize, gradient_type: &str) -> String {
    format!("gradient_{}__{}", gradient_type, region_id)
}

/// Batch analyze multiple paths for gradients
pub fn analyze_paths_for_gradients(
    paths_and_colors: &[(Vec<Point>, Vec<ColorSample>)],
    config: &GradientDetectionConfig,
) -> HashMap<usize, GradientAnalysis> {
    let mut results = HashMap::new();

    for (i, (path, colors)) in paths_and_colors.iter().enumerate() {
        if let Some(analysis) = analyze_path_for_gradients(path, colors, config) {
            results.insert(i, analysis);
        }
    }

    results
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_color_sample(r: u8, g: u8, b: u8) -> ColorSample {
        use image::Rgba;
        ColorSample {
            position: 0.0,
            color: Rgba([r, g, b, 255]),
            weight: 1.0,
        }
    }

    #[test]
    fn test_linear_gradient_detection() {
        let path = vec![Point::new(0.0, 50.0), Point::new(100.0, 50.0)];

        let colors = vec![
            create_test_color_sample(255, 0, 0),
            create_test_color_sample(0, 255, 0),
            create_test_color_sample(0, 0, 255),
        ];

        let config = GradientDetectionConfig::default();
        let analysis = detect_linear_gradient(&path, &colors, &config);

        assert!(analysis.is_some());
        let analysis = analysis.unwrap();

        match analysis.gradient_type {
            GradientType::Linear { stops, angle, .. } => {
                assert_eq!(stops.len(), 3);
                assert_eq!(angle, 0.0); // Horizontal gradient
            }
            _ => panic!("Expected linear gradient"),
        }
    }

    #[test]
    fn test_radial_gradient_detection() {
        let path = vec![
            Point::new(50.0, 50.0),
            Point::new(100.0, 50.0),
            Point::new(75.0, 100.0),
        ];

        let colors = vec![
            create_test_color_sample(255, 255, 255),
            create_test_color_sample(128, 128, 128),
            create_test_color_sample(0, 0, 0),
        ];

        let config = GradientDetectionConfig::default();
        let analysis = detect_radial_gradient(&path, &colors, &config);

        assert!(analysis.is_some());
        let analysis = analysis.unwrap();

        match analysis.gradient_type {
            GradientType::Radial { stops, .. } => {
                assert_eq!(stops.len(), 3);
            }
            _ => panic!("Expected radial gradient"),
        }
    }

    #[test]
    fn test_color_distance_calculation() {
        let red = create_test_color_sample(255, 0, 0);
        let blue = create_test_color_sample(0, 0, 255);
        let distance = calculate_color_distance_perceptual(&red, &blue);

        assert!(distance > 0.0);
        assert!(distance > 200.0); // Red to blue should have significant distance
    }

    #[test]
    fn test_gradient_id_generation() {
        let id = generate_gradient_id(42, "linear");
        assert_eq!(id, "gradient_linear__42");
    }
}
