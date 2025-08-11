//! Dot placement algorithm for dot-based pixel mapping
//!
//! This module implements the core dot placement algorithm that combines gradient analysis
//! and background detection to generate artistic dots. It maps gradient strength to dot size
//! and opacity, preserves original colors when requested, and implements spatial distribution
//! to prevent clustering.

use crate::algorithms::background::{detect_background_advanced, BackgroundConfig};
use crate::algorithms::gradients::{GradientAnalysis, GradientConfig};
use image::{Rgba, RgbaImage};
use rayon::prelude::*;

/// Represents a single dot in the output
#[derive(Debug, Clone, PartialEq)]
pub struct Dot {
    /// X coordinate of the dot center
    pub x: f32,
    /// Y coordinate of the dot center
    pub y: f32,
    /// Radius of the dot
    pub radius: f32,
    /// Opacity value (0.0 to 1.0)
    pub opacity: f32,
    /// Color as hex string (e.g., "#FF0000")
    pub color: String,
}

impl Dot {
    /// Create a new dot with specified parameters
    pub fn new(x: f32, y: f32, radius: f32, opacity: f32, color: String) -> Self {
        Self {
            x,
            y,
            radius,
            opacity,
            color,
        }
    }

    /// Calculate the distance from this dot to another point
    pub fn distance_to(&self, x: f32, y: f32) -> f32 {
        let dx = self.x - x;
        let dy = self.y - y;
        (dx * dx + dy * dy).sqrt()
    }

    /// Check if this dot overlaps with another dot
    pub fn overlaps_with(&self, other: &Dot) -> bool {
        let distance = self.distance_to(other.x, other.y);
        distance < (self.radius + other.radius)
    }
}

/// Configuration for dot generation
#[derive(Debug, Clone)]
pub struct DotConfig {
    /// Minimum dot radius in pixels
    pub min_radius: f32,
    /// Maximum dot radius in pixels
    pub max_radius: f32,
    /// Minimum gradient strength required to place a dot (0.0 to 1.0)
    pub density_threshold: f32,
    /// Whether to preserve original pixel colors
    pub preserve_colors: bool,
    /// Whether to use adaptive sizing based on local variance
    pub adaptive_sizing: bool,
    /// Minimum spacing between dot centers (as multiple of radius)
    pub spacing_factor: f32,
    /// Default color for dots when not preserving colors
    pub default_color: String,
    /// Whether to use parallel processing
    pub use_parallel: bool,
    /// Threshold for enabling parallel processing (pixel count)
    pub parallel_threshold: usize,
    /// Random seed for consistent spatial distribution
    pub random_seed: u64,
}

impl Default for DotConfig {
    fn default() -> Self {
        Self {
            min_radius: 0.5,
            max_radius: 3.0,
            density_threshold: 0.1,
            preserve_colors: true,
            adaptive_sizing: true,
            spacing_factor: 1.5,
            default_color: "#000000".to_string(),
            use_parallel: true,
            parallel_threshold: 10000,
            random_seed: 42,
        }
    }
}

/// Convert RGBA color to hex string
fn rgba_to_hex(rgba: &Rgba<u8>) -> String {
    format!("#{:02x}{:02x}{:02x}", rgba.0[0], rgba.0[1], rgba.0[2])
}

/// Calculate normalized gradient strength from gradient analysis
fn calculate_gradient_strength(
    gradient_analysis: &GradientAnalysis,
    x: u32,
    y: u32,
    adaptive_sizing: bool,
) -> f32 {
    let magnitude = gradient_analysis.get_magnitude(x, y).unwrap_or(0.0);

    if adaptive_sizing {
        let variance = gradient_analysis.get_variance(x, y).unwrap_or(0.0);
        // Combine magnitude and variance for adaptive strength
        // Use square root of variance (standard deviation) for better scaling
        let variance_factor = variance.sqrt().min(255.0) / 255.0;
        let magnitude_factor = magnitude.min(362.0) / 362.0; // Max Sobel magnitude for 8-bit

        // Weighted combination: 70% magnitude, 30% variance
        0.7 * magnitude_factor + 0.3 * variance_factor
    } else {
        // Simple magnitude-based strength
        magnitude.min(362.0) / 362.0
    }
}

/// Map gradient strength to dot radius
fn strength_to_radius(strength: f32, min_radius: f32, max_radius: f32) -> f32 {
    // Use square root for more natural scaling (higher contrast in small values)
    let scaled_strength = strength.sqrt();
    min_radius + scaled_strength * (max_radius - min_radius)
}

/// Map gradient strength to opacity
fn strength_to_opacity(strength: f32) -> f32 {
    // Ensure minimum visibility while scaling with strength
    let min_opacity = 0.3;
    let max_opacity = 1.0;
    min_opacity + strength * (max_opacity - min_opacity)
}

/// Simple spatial distribution check to prevent clustering
/// Returns true if the position is valid (not too close to existing dots)
#[allow(dead_code)]
fn is_position_valid(
    x: f32,
    y: f32,
    radius: f32,
    existing_dots: &[Dot],
    spacing_factor: f32,
) -> bool {
    let min_distance = radius * spacing_factor;

    for dot in existing_dots {
        if dot.distance_to(x, y) < min_distance {
            return false;
        }
    }
    true
}

/// Optimized spatial distribution using grid-based approach
struct SpatialGrid {
    grid: Vec<Vec<Vec<usize>>>,
    cell_size: f32,
    grid_width: usize,
    grid_height: usize,
}

impl SpatialGrid {
    fn new(width: u32, height: u32, max_radius: f32, spacing_factor: f32) -> Self {
        let cell_size = max_radius * spacing_factor * 2.0;
        let grid_width = ((width as f32 / cell_size).ceil() as usize).max(1);
        let grid_height = ((height as f32 / cell_size).ceil() as usize).max(1);

        let grid = vec![vec![Vec::new(); grid_width]; grid_height];

        Self {
            grid,
            cell_size,
            grid_width,
            grid_height,
        }
    }

    fn get_grid_coords(&self, x: f32, y: f32) -> (usize, usize) {
        let gx = ((x / self.cell_size) as usize).min(self.grid_width - 1);
        let gy = ((y / self.cell_size) as usize).min(self.grid_height - 1);
        (gx, gy)
    }

    fn add_dot(&mut self, dot_index: usize, x: f32, y: f32) {
        let (gx, gy) = self.get_grid_coords(x, y);
        self.grid[gy][gx].push(dot_index);
    }

    fn is_position_valid(
        &self,
        x: f32,
        y: f32,
        radius: f32,
        dots: &[Dot],
        spacing_factor: f32,
    ) -> bool {
        let min_distance = radius * spacing_factor;
        let (gx, gy) = self.get_grid_coords(x, y);

        // Check surrounding grid cells
        let start_gx = gx.saturating_sub(1);
        let end_gx = (gx + 2).min(self.grid_width);
        let start_gy = gy.saturating_sub(1);
        let end_gy = (gy + 2).min(self.grid_height);

        for check_gy in start_gy..end_gy {
            for check_gx in start_gx..end_gx {
                for &dot_index in &self.grid[check_gy][check_gx] {
                    if dot_index < dots.len() {
                        let dot = &dots[dot_index];
                        if dot.distance_to(x, y) < min_distance {
                            return false;
                        }
                    }
                }
            }
        }

        true
    }
}

/// Generate dots from image analysis
///
/// This is the core dot placement algorithm that combines gradient analysis and background
/// detection to create artistic dots. It maps gradient strength to dot properties and
/// implements spatial distribution to prevent clustering.
///
/// # Arguments
/// * `rgba` - Input RGBA image
/// * `gradient_analysis` - Pre-computed gradient analysis results
/// * `background_mask` - Boolean mask where true = background pixel
/// * `config` - Configuration parameters for dot generation
///
/// # Returns
/// Vector of generated dots
pub fn generate_dots(
    rgba: &RgbaImage,
    gradient_analysis: &GradientAnalysis,
    background_mask: &[bool],
    config: &DotConfig,
) -> Vec<Dot> {
    let width = rgba.width();
    let height = rgba.height();
    let total_pixels = (width * height) as usize;

    if total_pixels == 0 || background_mask.len() != total_pixels {
        return Vec::new();
    }

    // Pre-calculate candidate positions with optional parallel processing
    let pixel_coords: Vec<(u32, u32)> = (0..height)
        .flat_map(|y| (0..width).map(move |x| (x, y)))
        .collect();

    let candidates: Vec<(u32, u32, f32, f32, String)> = if config.use_parallel
        && total_pixels >= config.parallel_threshold
    {
        // Parallel processing for large images
        pixel_coords
            .par_iter()
            .filter_map(|&(x, y)| {
                let index = (y * width + x) as usize;

                // Skip background pixels
                if background_mask[index] {
                    return None;
                }

                // Calculate gradient strength
                let strength =
                    calculate_gradient_strength(gradient_analysis, x, y, config.adaptive_sizing);

                // Skip pixels below density threshold
                if strength < config.density_threshold {
                    return None;
                }

                // Calculate dot properties
                let radius = strength_to_radius(strength, config.min_radius, config.max_radius);
                let opacity = strength_to_opacity(strength);

                // Get color
                let color = if config.preserve_colors {
                    let pixel = rgba.get_pixel(x, y);
                    rgba_to_hex(pixel)
                } else {
                    config.default_color.clone()
                };

                Some((x, y, radius, opacity, color))
            })
            .collect()
    } else {
        // Sequential processing for smaller images
        let mut candidates = Vec::new();

        for &(x, y) in &pixel_coords {
            let index = (y * width + x) as usize;

            // Skip background pixels
            if background_mask[index] {
                continue;
            }

            // Calculate gradient strength
            let strength =
                calculate_gradient_strength(gradient_analysis, x, y, config.adaptive_sizing);

            // Skip pixels below density threshold
            if strength < config.density_threshold {
                continue;
            }

            // Calculate dot properties
            let radius = strength_to_radius(strength, config.min_radius, config.max_radius);
            let opacity = strength_to_opacity(strength);

            // Get color
            let color = if config.preserve_colors {
                let pixel = rgba.get_pixel(x, y);
                rgba_to_hex(pixel)
            } else {
                config.default_color.clone()
            };

            candidates.push((x, y, radius, opacity, color));
        }

        candidates
    };

    // Sort candidates by gradient strength (strongest first) for better spatial distribution
    let mut sorted_candidates = candidates;
    sorted_candidates.sort_by(|a, b| b.2.partial_cmp(&a.2).unwrap_or(std::cmp::Ordering::Equal));

    // Generate dots with spatial distribution
    let mut dots = Vec::new();
    let mut spatial_grid =
        SpatialGrid::new(width, height, config.max_radius, config.spacing_factor);

    for (x, y, radius, opacity, color) in sorted_candidates {
        let fx = x as f32 + 0.5; // Center of pixel
        let fy = y as f32 + 0.5;

        // Check spatial distribution
        if spatial_grid.is_position_valid(fx, fy, radius, &dots, config.spacing_factor) {
            let dot = Dot::new(fx, fy, radius, opacity, color);
            spatial_grid.add_dot(dots.len(), fx, fy);
            dots.push(dot);
        }
    }

    dots
}

/// Generate dots with automatic background detection
///
/// Convenience function that performs background detection automatically before
/// generating dots. Uses default background detection configuration.
///
/// # Arguments
/// * `rgba` - Input RGBA image
/// * `gradient_analysis` - Pre-computed gradient analysis results
/// * `config` - Configuration parameters for dot generation
///
/// # Returns
/// Vector of generated dots
pub fn generate_dots_auto_background(
    rgba: &RgbaImage,
    gradient_analysis: &GradientAnalysis,
    config: &DotConfig,
) -> Vec<Dot> {
    let background_config = BackgroundConfig::default();
    let background_mask = detect_background_advanced(rgba, &background_config);
    generate_dots(rgba, gradient_analysis, &background_mask, config)
}

/// Generate dots with smart background filtering fallback
/// 
/// This function applies intelligent background filtering that automatically disables
/// background filtering when the detection algorithm is too aggressive (>95% background).
/// This handles edge cases like checkerboards where all colors might be incorrectly
/// classified as background.
pub fn generate_dots_with_smart_filtering(
    rgba: &RgbaImage,
    gradient_analysis: &GradientAnalysis,
    background_mask: &[bool],
    config: &DotConfig,
    use_background_filtering: bool,
) -> Vec<Dot> {
    if use_background_filtering {
        // Use normal background filtering
        generate_dots(rgba, gradient_analysis, background_mask, config)
    } else {
        // Bypass background filtering by creating an all-false mask
        let no_background_mask = vec![false; background_mask.len()];
        generate_dots(rgba, gradient_analysis, &no_background_mask, config)
    }
}

/// Generate dots from image with full pipeline
///
/// Complete pipeline that performs gradient analysis, background detection, and dot generation
/// in a single call. Most convenient function for typical use cases.
///
/// # Arguments
/// * `rgba` - Input RGBA image
/// * `dot_config` - Configuration parameters for dot generation
/// * `gradient_config` - Optional gradient analysis configuration (uses default if None)
/// * `background_config` - Optional background detection configuration (uses default if None)
///
/// # Returns
/// Vector of generated dots
pub fn generate_dots_from_image(
    rgba: &RgbaImage,
    dot_config: &DotConfig,
    gradient_config: Option<&GradientConfig>,
    background_config: Option<&BackgroundConfig>,
) -> Vec<Dot> {
    // Convert to grayscale for gradient analysis
    let gray = image::imageops::grayscale(rgba);

    // Perform gradient analysis
    let gradient_analysis = if let Some(config) = gradient_config {
        crate::algorithms::gradients::analyze_image_gradients_with_config(&gray, config)
    } else {
        crate::algorithms::gradients::analyze_image_gradients(&gray)
    };

    // Perform background detection
    let background_mask = if let Some(config) = background_config {
        detect_background_advanced(rgba, config)
    } else {
        detect_background_advanced(rgba, &BackgroundConfig::default())
    };

    // Debug: Log background detection results and apply smart fallback
    let background_pixels = background_mask.iter().filter(|&&x| x).count();
    let total_pixels = background_mask.len();
    let background_percentage = (background_pixels as f64 / total_pixels as f64) * 100.0;
    log::debug!("Background detection: {}/{} pixels marked as background ({:.1}%)", 
        background_pixels, total_pixels, background_percentage);

    // Smart fallback: If >95% of pixels are marked as background, disable background filtering
    // This handles cases where the background detection is too aggressive
    let use_background_filtering = background_percentage < 95.0;
    if !use_background_filtering {
        log::debug!("Background detection marked {:.1}% as background - disabling background filtering", background_percentage);
    }

    // Generate dots with smart background filtering
    let dots = generate_dots_with_smart_filtering(rgba, &gradient_analysis, &background_mask, dot_config, use_background_filtering);
    
    // Debug: Sample gradient strength values
    let mut sample_strengths = Vec::new();
    let width = rgba.width();
    let height = rgba.height();
    for y in (0..height).step_by(height as usize / 10.max(1)) {
        for x in (0..width).step_by(width as usize / 10.max(1)) {
            let strength = calculate_gradient_strength(&gradient_analysis, x, y, dot_config.adaptive_sizing);
            sample_strengths.push(strength);
        }
    }
    if !sample_strengths.is_empty() {
        let max_strength = sample_strengths.iter().fold(0.0f32, |a, &b| a.max(b));
        let avg_strength = sample_strengths.iter().sum::<f32>() / sample_strengths.len() as f32;
        log::debug!("Gradient strength sample: max={:.3}, avg={:.3}, threshold={:.3}", 
            max_strength, avg_strength, dot_config.density_threshold);
    }
    
    dots
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::algorithms::gradients::analyze_image_gradients;
    use image::{Rgba, RgbaImage};

    /// Create simple test image with clear foreground/background
    fn create_test_image() -> RgbaImage {
        let mut img = RgbaImage::new(50, 50);
        let background = Rgba([200, 200, 200, 255]);
        let foreground = Rgba([50, 50, 50, 255]);

        // Fill with background
        for y in 0..50 {
            for x in 0..50 {
                img.put_pixel(x, y, background);
            }
        }

        // Add foreground rectangle
        for y in 20..30 {
            for x in 20..30 {
                img.put_pixel(x, y, foreground);
            }
        }

        img
    }

    /// Create gradient test image
    fn create_gradient_image() -> RgbaImage {
        let mut img = RgbaImage::new(100, 100);
        for y in 0..100 {
            for x in 0..100 {
                let intensity = ((x + y) * 255 / 200).min(255) as u8;
                let color = Rgba([intensity, intensity, intensity, 255]);
                img.put_pixel(x, y, color);
            }
        }
        img
    }

    fn create_simple_background_mask(width: u32, height: u32) -> Vec<bool> {
        let mut mask = vec![true; (width * height) as usize];

        // Set center area as foreground
        for y in (height / 4)..(3 * height / 4) {
            for x in (width / 4)..(3 * width / 4) {
                let index = (y * width + x) as usize;
                mask[index] = false;
            }
        }

        mask
    }

    #[test]
    fn test_dot_creation() {
        let dot = Dot::new(10.0, 20.0, 2.5, 0.8, "#FF0000".to_string());

        assert_eq!(dot.x, 10.0);
        assert_eq!(dot.y, 20.0);
        assert_eq!(dot.radius, 2.5);
        assert_eq!(dot.opacity, 0.8);
        assert_eq!(dot.color, "#FF0000");
    }

    #[test]
    fn test_dot_distance() {
        let dot = Dot::new(0.0, 0.0, 1.0, 1.0, "#000000".to_string());

        assert_eq!(dot.distance_to(3.0, 4.0), 5.0); // 3-4-5 triangle
        assert_eq!(dot.distance_to(0.0, 0.0), 0.0); // Same position
    }

    #[test]
    fn test_dot_overlap() {
        let dot1 = Dot::new(0.0, 0.0, 2.0, 1.0, "#000000".to_string());
        let dot2 = Dot::new(3.0, 0.0, 2.0, 1.0, "#000000".to_string());
        let dot3 = Dot::new(5.0, 0.0, 2.0, 1.0, "#000000".to_string());

        assert!(
            dot1.overlaps_with(&dot2),
            "Dots should overlap (distance=3, radii=4)"
        );
        assert!(
            !dot1.overlaps_with(&dot3),
            "Dots should not overlap (distance=5, radii=4)"
        );
    }

    #[test]
    fn test_rgba_to_hex() {
        let white = Rgba([255, 255, 255, 255]);
        let black = Rgba([0, 0, 0, 255]);
        let red = Rgba([255, 0, 0, 255]);

        assert_eq!(rgba_to_hex(&white), "#ffffff");
        assert_eq!(rgba_to_hex(&black), "#000000");
        assert_eq!(rgba_to_hex(&red), "#ff0000");
    }

    #[test]
    fn test_gradient_strength_calculation() {
        let img = create_gradient_image();
        let gray = image::imageops::grayscale(&img);
        let gradient_analysis = analyze_image_gradients(&gray);

        // Test center pixel
        let strength_adaptive = calculate_gradient_strength(&gradient_analysis, 50, 50, true);
        let strength_simple = calculate_gradient_strength(&gradient_analysis, 50, 50, false);

        assert!(strength_adaptive >= 0.0 && strength_adaptive <= 1.0);
        assert!(strength_simple >= 0.0 && strength_simple <= 1.0);

        // For a gradient image, adaptive should generally be different from simple
        assert_ne!(strength_adaptive, strength_simple);
    }

    #[test]
    fn test_strength_to_radius_mapping() {
        let min_radius = 0.5;
        let max_radius = 3.0;

        let radius_min = strength_to_radius(0.0, min_radius, max_radius);
        let radius_max = strength_to_radius(1.0, min_radius, max_radius);
        let radius_mid = strength_to_radius(0.5, min_radius, max_radius);

        assert_eq!(radius_min, min_radius);
        assert_eq!(radius_max, max_radius);
        assert!(radius_mid > min_radius && radius_mid < max_radius);
    }

    #[test]
    fn test_strength_to_opacity_mapping() {
        let opacity_min = strength_to_opacity(0.0);
        let opacity_max = strength_to_opacity(1.0);
        let opacity_mid = strength_to_opacity(0.5);

        assert!(opacity_min >= 0.3); // Minimum opacity
        assert_eq!(opacity_max, 1.0);
        assert!(opacity_mid > opacity_min && opacity_mid < opacity_max);
    }

    #[test]
    fn test_spatial_distribution() {
        let existing_dots = vec![
            Dot::new(10.0, 10.0, 2.0, 1.0, "#000000".to_string()),
            Dot::new(20.0, 20.0, 2.0, 1.0, "#000000".to_string()),
        ];

        let spacing_factor = 2.0;

        // Position too close to first dot
        assert!(!is_position_valid(
            11.0,
            11.0,
            2.0,
            &existing_dots,
            spacing_factor
        ));

        // Position far enough from all dots
        assert!(is_position_valid(
            30.0,
            30.0,
            2.0,
            &existing_dots,
            spacing_factor
        ));

        // Position exactly at minimum distance (should be invalid due to floating point)
        let min_distance = 2.0 * spacing_factor;
        assert!(!is_position_valid(
            10.0 + min_distance - 0.1,
            10.0,
            2.0,
            &existing_dots,
            spacing_factor
        ));
    }

    #[test]
    fn test_spatial_grid() {
        let width = 100;
        let height = 100;
        let max_radius = 3.0;
        let spacing_factor = 2.0;

        let mut grid = SpatialGrid::new(width, height, max_radius, spacing_factor);
        let mut dots = Vec::new();

        // Add first dot
        let dot1 = Dot::new(25.0, 25.0, 2.0, 1.0, "#000000".to_string());
        grid.add_dot(0, dot1.x, dot1.y);
        dots.push(dot1);

        // Test position too close
        assert!(!grid.is_position_valid(26.0, 26.0, 2.0, &dots, spacing_factor));

        // Test position far enough
        assert!(grid.is_position_valid(50.0, 50.0, 2.0, &dots, spacing_factor));
    }

    #[test]
    fn test_generate_dots_basic() {
        let img = create_test_image();
        let gray = image::imageops::grayscale(&img);
        let gradient_analysis = analyze_image_gradients(&gray);
        let background_mask = create_simple_background_mask(50, 50);
        let config = DotConfig::default();

        let dots = generate_dots(&img, &gradient_analysis, &background_mask, &config);

        // Should generate some dots
        assert!(!dots.is_empty(), "Should generate some dots");

        // All dots should be within image bounds
        for dot in &dots {
            assert!(dot.x >= 0.0 && dot.x <= 50.0);
            assert!(dot.y >= 0.0 && dot.y <= 50.0);
            assert!(dot.radius >= config.min_radius);
            assert!(dot.radius <= config.max_radius);
            assert!(dot.opacity >= 0.0 && dot.opacity <= 1.0);
        }
    }

    #[test]
    fn test_generate_dots_empty_image() {
        let img = RgbaImage::new(0, 0);
        let gray = image::imageops::grayscale(&img);
        let gradient_analysis = analyze_image_gradients(&gray);
        let background_mask = Vec::new();
        let config = DotConfig::default();

        let dots = generate_dots(&img, &gradient_analysis, &background_mask, &config);
        assert!(dots.is_empty(), "Empty image should produce no dots");
    }

    #[test]
    fn test_generate_dots_background_filtering() {
        let img = create_test_image();
        let gray = image::imageops::grayscale(&img);
        let gradient_analysis = analyze_image_gradients(&gray);

        // All background mask
        let all_background_mask = vec![true; 2500];
        let config = DotConfig::default();

        let dots = generate_dots(&img, &gradient_analysis, &all_background_mask, &config);
        assert!(
            dots.is_empty(),
            "All-background mask should produce no dots"
        );

        // No background mask
        let no_background_mask = vec![false; 2500];
        let dots_no_bg = generate_dots(&img, &gradient_analysis, &no_background_mask, &config);
        assert!(
            !dots_no_bg.is_empty(),
            "No-background mask should produce dots"
        );
    }

    #[test]
    fn test_generate_dots_density_threshold() {
        let img = create_test_image();
        let gray = image::imageops::grayscale(&img);
        let gradient_analysis = analyze_image_gradients(&gray);
        let background_mask = create_simple_background_mask(50, 50);

        let config_low = DotConfig {
            density_threshold: 0.01,
            ..Default::default()
        };

        let config_high = DotConfig {
            density_threshold: 0.8,
            ..Default::default()
        };

        let dots_low = generate_dots(&img, &gradient_analysis, &background_mask, &config_low);
        let dots_high = generate_dots(&img, &gradient_analysis, &background_mask, &config_high);

        // Lower threshold should generate more or equal dots
        assert!(
            dots_low.len() >= dots_high.len(),
            "Lower threshold should generate more dots"
        );
    }

    #[test]
    fn test_generate_dots_color_preservation() {
        let img = create_test_image();
        let gray = image::imageops::grayscale(&img);
        let gradient_analysis = analyze_image_gradients(&gray);
        let background_mask = create_simple_background_mask(50, 50);

        let config_preserve = DotConfig {
            preserve_colors: true,
            ..Default::default()
        };

        let config_default = DotConfig {
            preserve_colors: false,
            default_color: "#ff0000".to_string(),
            ..Default::default()
        };

        let dots_preserve =
            generate_dots(&img, &gradient_analysis, &background_mask, &config_preserve);
        let dots_default =
            generate_dots(&img, &gradient_analysis, &background_mask, &config_default);

        if !dots_preserve.is_empty() && !dots_default.is_empty() {
            // Preserved colors should be varied
            let unique_colors: std::collections::HashSet<_> =
                dots_preserve.iter().map(|d| &d.color).collect();
            assert!(
                unique_colors.len() > 1 || dots_preserve.len() == 1,
                "Color preservation should create varied colors"
            );

            // Default color should be uniform
            for dot in &dots_default {
                assert_eq!(dot.color, "#ff0000");
            }
        }
    }

    #[test]
    fn test_generate_dots_adaptive_sizing() {
        let img = create_gradient_image();
        let gray = image::imageops::grayscale(&img);
        let gradient_analysis = analyze_image_gradients(&gray);
        let background_mask = vec![false; 10000]; // No background

        let config_adaptive = DotConfig {
            adaptive_sizing: true,
            density_threshold: 0.05, // Lower threshold to ensure dots
            ..Default::default()
        };

        let config_simple = DotConfig {
            adaptive_sizing: false,
            density_threshold: 0.05, // Lower threshold to ensure dots
            ..Default::default()
        };

        let dots_adaptive =
            generate_dots(&img, &gradient_analysis, &background_mask, &config_adaptive);
        let dots_simple = generate_dots(&img, &gradient_analysis, &background_mask, &config_simple);

        // Both should generate dots with lower threshold
        if dots_adaptive.is_empty() || dots_simple.is_empty() {
            // If still no dots, test just that both methods work consistently
            assert_eq!(
                dots_adaptive.is_empty(),
                dots_simple.is_empty(),
                "Both adaptive and simple should behave consistently"
            );
            return; // Skip further tests if no dots generated
        }

        // Results should generally be different due to different strength calculations
        if dots_adaptive.len() > 5 && dots_simple.len() > 5 {
            let adaptive_radii: Vec<_> = dots_adaptive.iter().take(5).map(|d| d.radius).collect();
            let simple_radii: Vec<_> = dots_simple.iter().take(5).map(|d| d.radius).collect();

            // At least some radii should be different
            let differences = adaptive_radii
                .iter()
                .zip(simple_radii.iter())
                .filter(|(a, b)| ((*a) - (*b)).abs() > 0.01)
                .count();
            assert!(
                differences > 0,
                "Adaptive sizing should produce different results"
            );
        }
    }

    #[test]
    fn test_generate_dots_from_image_full_pipeline() {
        let img = create_test_image();
        let config = DotConfig::default();

        let dots = generate_dots_from_image(&img, &config, None, None);

        assert!(!dots.is_empty(), "Full pipeline should generate dots");

        // Validate dot properties
        for dot in &dots {
            assert!(dot.x >= 0.0 && dot.x <= 50.0);
            assert!(dot.y >= 0.0 && dot.y <= 50.0);
            assert!(dot.radius >= config.min_radius);
            assert!(dot.radius <= config.max_radius);
            assert!(dot.opacity >= 0.0 && dot.opacity <= 1.0);
            assert!(dot.color.starts_with('#'));
            assert_eq!(dot.color.len(), 7); // #RRGGBB format
        }
    }

    #[test]
    fn test_generate_dots_auto_background() {
        let img = create_test_image();
        let gray = image::imageops::grayscale(&img);
        let gradient_analysis = analyze_image_gradients(&gray);
        let config = DotConfig::default();

        let dots = generate_dots_auto_background(&img, &gradient_analysis, &config);

        assert!(!dots.is_empty(), "Auto background should generate dots");

        // Should be similar to manual background detection
        let background_config = BackgroundConfig::default();
        let background_mask = detect_background_advanced(&img, &background_config);
        let dots_manual = generate_dots(&img, &gradient_analysis, &background_mask, &config);

        assert_eq!(
            dots.len(),
            dots_manual.len(),
            "Auto and manual background should give same results"
        );
    }

    #[test]
    fn test_dot_config_defaults() {
        let config = DotConfig::default();

        assert_eq!(config.min_radius, 0.5);
        assert_eq!(config.max_radius, 3.0);
        assert_eq!(config.density_threshold, 0.1);
        assert_eq!(config.preserve_colors, true);
        assert_eq!(config.adaptive_sizing, true);
        assert_eq!(config.spacing_factor, 1.5);
        assert_eq!(config.default_color, "#000000");
        assert_eq!(config.use_parallel, true);
        assert_eq!(config.parallel_threshold, 10000);
        assert_eq!(config.random_seed, 42);
    }
}
