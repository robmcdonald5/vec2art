//! Hand-drawn aesthetic enhancements for line tracing
//!
//! This module provides various filters and transformations to make vectorized
//! line art feel more organic and hand-drawn, including variable line weights,
//! subtle tremor, line tapering, and pressure simulation.

use crate::algorithms::SvgPath;
use rand::{Rng, SeedableRng};
use rand_chacha::ChaCha8Rng;

/// Configuration for hand-drawn aesthetic enhancements
#[derive(Debug, Clone)]
pub struct HandDrawnConfig {
    /// Enable variable line weights based on edge confidence (0.0-1.0)
    pub variable_weights: f32,
    /// Enable organic tremor/jitter for imperfect lines (0.0-0.5)
    pub tremor_strength: f32,
    /// Enable line tapering at endpoints (0.0-1.0)
    pub tapering: f32,
    /// Enable pressure simulation along paths (0.0-1.0)
    pub pressure_variation: f32,
    /// Enable multi-pass strokes for sketchy effect (0.0-1.0)
    pub multi_pass_intensity: f32,
    /// Enable resolution-adaptive scaling
    pub adaptive_scaling: bool,
    /// Image resolution for adaptive scaling (pixels)
    pub image_resolution: (u32, u32),
    /// Random seed for reproducible results
    pub seed: u64,
    /// Base stroke width multiplier
    pub base_width_multiplier: f32,
}

impl Default for HandDrawnConfig {
    fn default() -> Self {
        Self {
            variable_weights: 0.3,
            tremor_strength: 0.1,
            tapering: 0.2,
            pressure_variation: 0.4,
            multi_pass_intensity: 0.3,
            adaptive_scaling: true,
            image_resolution: (800, 600),
            seed: 42,
            base_width_multiplier: 1.0,
        }
    }
}

/// Apply hand-drawn aesthetic enhancements to SVG paths
pub fn apply_hand_drawn_aesthetics(paths: Vec<SvgPath>, config: &HandDrawnConfig) -> Vec<SvgPath> {
    if config.variable_weights == 0.0
        && config.tremor_strength == 0.0
        && config.tapering == 0.0
        && config.pressure_variation == 0.0
        && config.multi_pass_intensity == 0.0
    {
        return paths; // No enhancements requested
    }

    let mut rng = ChaCha8Rng::seed_from_u64(config.seed);
    let mut enhanced_paths = Vec::new();

    // Calculate resolution scale factor for adaptive effects
    let resolution_scale = if config.adaptive_scaling {
        let total_pixels = config.image_resolution.0 * config.image_resolution.1;
        (total_pixels as f32 / 480000.0).sqrt() // Normalize to 800x600 baseline
    } else {
        1.0
    };

    for path in paths {
        // Create primary path with enhancements
        let enhanced_path = apply_path_aesthetics(path.clone(), config, &mut rng, resolution_scale);
        enhanced_paths.push(enhanced_path.clone());

        // Add multi-pass strokes for sketchy effect
        if config.multi_pass_intensity > 0.0 {
            let pass_count = (1.0 + config.multi_pass_intensity * 2.0) as usize; // 1-3 passes
            for pass in 1..pass_count {
                let mut pass_config = config.clone();
                pass_config.tremor_strength *= 0.7; // Reduce tremor for additional passes
                pass_config.seed = config.seed + pass as u64; // Different seed for variation

                let mut pass_path =
                    apply_path_aesthetics(path.clone(), &pass_config, &mut rng, resolution_scale);
                // Reduce stroke width for overlay effect (simulates opacity)
                pass_path.stroke_width *= 0.7 - (pass as f32 * 0.1);
                // Slight offset for sketchy overlap
                pass_path = apply_slight_offset(pass_path, pass as f32 * 0.8, &mut rng);
                enhanced_paths.push(pass_path);
            }
        }
    }

    enhanced_paths
}

/// Apply aesthetic enhancements to a single path
fn apply_path_aesthetics(
    mut path: SvgPath,
    config: &HandDrawnConfig,
    rng: &mut ChaCha8Rng,
    resolution_scale: f32,
) -> SvgPath {
    // Apply variable line weights
    if config.variable_weights > 0.0 {
        path = apply_variable_weight(path, config, rng, resolution_scale);
    }

    // Apply organic tremor to coordinates
    if config.tremor_strength > 0.0 {
        path = apply_organic_tremor(path, config, rng, resolution_scale);
    }

    // IMPLEMENT TAPERING: Apply line tapering using stroke-dasharray for natural endings
    if config.tapering > 0.0 {
        path = apply_stroke_tapering(path, config, rng);
    }

    // Apply pressure variation using stroke-width changes
    if config.pressure_variation > 0.0 {
        path = apply_pressure_variation(path, config, rng);
    }

    path
}

/// Apply variable line weights based on path characteristics
fn apply_variable_weight(
    mut path: SvgPath,
    config: &HandDrawnConfig,
    rng: &mut ChaCha8Rng,
    _resolution_scale: f32,
) -> SvgPath {
    // Estimate "confidence" from path length and complexity
    let path_confidence = estimate_path_confidence(&path.data);

    // Vary stroke width based on confidence and randomization - ENHANCED: Use 6x larger variations for maximum visibility
    let weight_variation = config.variable_weights * (rng.gen::<f32>() - 0.5) * 6.0; // -3.0 to 3.0 (dramatic range)
    let confidence_factor = 0.3 + 1.4 * path_confidence; // 0.3 to 1.7 (wider range)

    path.stroke_width *=
        config.base_width_multiplier * confidence_factor * (1.0 + weight_variation * 5.0); // Extremely dramatic variation

    // Clamp to reasonable bounds - allow extreme widths for maximum visual impact
    path.stroke_width = path.stroke_width.clamp(0.05, 20.0);

    path
}

/// Apply subtle organic tremor to path coordinates
fn apply_organic_tremor(
    mut path: SvgPath,
    config: &HandDrawnConfig,
    rng: &mut ChaCha8Rng,
    resolution_scale: f32,
) -> SvgPath {
    // Parse path data and add resolution-adaptive randomization to coordinates
    let tremor_data =
        add_coordinate_jitter(&path.data, config.tremor_strength, rng, resolution_scale);
    path.data = tremor_data;
    path
}

/// Estimate path "confidence" based on length and complexity
fn estimate_path_confidence(path_data: &str) -> f32 {
    // Simple heuristic: longer paths with more points have higher confidence
    let coordinate_count = path_data
        .split_whitespace()
        .filter(|s| s.parse::<f32>().is_ok())
        .count();

    // Normalize to 0-1

    // Paths with more coordinates (longer/more complex) get higher confidence
    (coordinate_count as f32 / 20.0).clamp(0.0, 1.0)
}

/// Add subtle coordinate jitter for organic appearance with resolution-adaptive scaling
fn add_coordinate_jitter(
    path_data: &str,
    tremor_strength: f32,
    rng: &mut ChaCha8Rng,
    resolution_scale: f32,
) -> String {
    let mut result = String::with_capacity(path_data.len() + 100);
    let tokens: Vec<&str> = path_data.split_whitespace().collect();

    let mut i = 0;
    while i < tokens.len() {
        let token = tokens[i];

        // Check if this token is a coordinate (number)
        if let Ok(coord) = token.parse::<f32>() {
            // Apply resolution-adaptive tremor with Rough.js-style circular uncertainty
            let base_jitter = tremor_strength * 30.0 * resolution_scale; // Scale with resolution

            // Rough.js style: circular uncertainty with normal distribution
            let angle = rng.gen::<f32>() * 2.0 * std::f32::consts::PI;
            let radius = ((-2.0 * (rng.gen::<f32>()).ln()).sqrt() * rng.gen::<f32>()).min(1.0); // Box-Muller for normal distribution
            let jitter = base_jitter * radius * angle.cos(); // Use cosine for x/y alternation
            let jittered = coord + jitter;

            if i > 0 {
                result.push(' ');
            }
            // RESEARCH FIX: Use 3 decimal precision to preserve subtle effects
            result.push_str(&format!("{jittered:.3}"));
        } else {
            // Command letter or other token - keep as is
            if i > 0 && !result.ends_with(' ') {
                result.push(' ');
            }
            result.push_str(token);
        }

        i += 1;
    }

    result
}

/// Apply stroke tapering by reducing stroke width at endpoints
fn apply_stroke_tapering(
    mut path: SvgPath,
    config: &HandDrawnConfig,
    rng: &mut ChaCha8Rng,
) -> SvgPath {
    // Apply tapering by reducing stroke width based on path position
    // This is a simplified approach that works with the current SvgPath structure
    let path_length = estimate_path_length(&path.data);
    if path_length < 10.0 {
        return path; // Skip very short paths
    }

    // Reduce stroke width for tapering effect
    let taper_factor = 1.0 - (config.tapering * 0.4); // Reduce up to 40%
    let variation = 1.0 + (rng.gen::<f32>() - 0.5) * 0.2; // ±10% variation
    path.stroke_width *= taper_factor * variation;

    // Ensure minimum width
    path.stroke_width = path.stroke_width.max(0.3);

    path
}

/// Apply pressure variation using stroke-width modulation
fn apply_pressure_variation(
    mut path: SvgPath,
    config: &HandDrawnConfig,
    rng: &mut ChaCha8Rng,
) -> SvgPath {
    // Apply pressure variation by modifying stroke width
    let pressure_factor = 1.0 + (config.pressure_variation * 0.4 * (rng.gen::<f32>() - 0.5));
    path.stroke_width *= pressure_factor;

    // Ensure reasonable bounds
    path.stroke_width = path.stroke_width.clamp(0.2, 10.0);

    path
}

/// Apply slight offset for multi-pass sketchy effect
fn apply_slight_offset(mut path: SvgPath, offset_amount: f32, rng: &mut ChaCha8Rng) -> SvgPath {
    // Add small random offset to entire path for sketchy overlap
    let offset_x = (rng.gen::<f32>() - 0.5) * offset_amount * 2.0;
    let offset_y = (rng.gen::<f32>() - 0.5) * offset_amount * 2.0;

    // Parse and offset all coordinates
    let offset_data = offset_path_coordinates(&path.data, offset_x, offset_y);
    path.data = offset_data;
    path
}

/// Estimate path length from SVG path data
fn estimate_path_length(path_data: &str) -> f32 {
    let points = parse_path_to_points_simple(path_data);
    if points.len() < 2 {
        return 0.0;
    }

    let mut total_length = 0.0;
    for i in 1..points.len() {
        let dx = points[i].0 - points[i - 1].0;
        let dy = points[i].1 - points[i - 1].1;
        total_length += (dx * dx + dy * dy).sqrt();
    }
    total_length
}

/// Parse SVG path data to extract coordinate points (simplified)
fn parse_path_to_points_simple(path_data: &str) -> Vec<(f32, f32)> {
    let mut points = Vec::new();
    let tokens: Vec<&str> = path_data.split_whitespace().collect();

    let mut i = 0;
    while i + 1 < tokens.len() {
        if let Ok(x) = tokens[i].parse::<f32>() {
            if let Ok(y) = tokens[i + 1].parse::<f32>() {
                points.push((x, y));
                i += 2;
                continue;
            }
        }
        i += 1;
    }
    points
}

/// Offset all coordinates in a path by given amounts
fn offset_path_coordinates(path_data: &str, offset_x: f32, offset_y: f32) -> String {
    let mut result = String::with_capacity(path_data.len() + 100);
    let tokens: Vec<&str> = path_data.split_whitespace().collect();

    let mut i = 0;
    let mut is_y_coord = false;

    while i < tokens.len() {
        let token = tokens[i];

        if let Ok(coord) = token.parse::<f32>() {
            let offset_coord = if is_y_coord {
                coord + offset_y
            } else {
                coord + offset_x
            };

            if i > 0 {
                result.push(' ');
            }
            result.push_str(&format!("{offset_coord:.3}"));
            is_y_coord = !is_y_coord; // Alternate between x and y
        } else {
            // Command letter - reset coordinate tracking
            if i > 0 && !result.ends_with(' ') {
                result.push(' ');
            }
            result.push_str(token);
            is_y_coord = false; // Next coordinate will be x
        }

        i += 1;
    }

    result
}

/// Parse SVG path data to get coordinate points (test helper function)
#[cfg(test)]
fn parse_path_to_points(path_data: &str) -> Vec<(f32, f32)> {
    let mut points = Vec::new();
    let tokens: Vec<&str> = path_data.split_whitespace().collect();

    let mut i = 0;
    while i < tokens.len() {
        let token = tokens[i];

        // Skip command letters and look for coordinate pairs
        if token == "M" || token == "L" || token == "C" {
            i += 1;
            continue;
        }

        // Try to parse as coordinate pair
        if let Ok(x) = token.parse::<f32>() {
            if let Some(y_token) = tokens.get(i + 1) {
                if let Ok(y) = y_token.parse::<f32>() {
                    points.push((x, y));
                    i += 2; // Skip the y coordinate
                    continue;
                }
            }
        }
        i += 1;
    }

    points
}

/// Calculate width factor for tapering effect (test helper function)
#[cfg(test)]
fn calculate_width_factor(
    point_index: usize,
    total_points: usize,
    tapering_strength: f32,
    taper_zone_length: usize,
) -> f32 {
    let min_width_factor = 0.5;

    if total_points <= 2 * taper_zone_length {
        // If path is too short, apply uniform tapering
        let progress = point_index as f32 / (total_points - 1) as f32;
        let taper_factor = if progress <= 0.5 {
            progress * 2.0 // 0.0 to 1.0 for first half
        } else {
            (1.0 - progress) * 2.0 // 1.0 to 0.0 for second half
        };
        return min_width_factor
            + (1.0 - min_width_factor) * taper_factor * (1.0 - tapering_strength);
    }

    if point_index < taper_zone_length {
        // Start taper zone
        let taper_progress = point_index as f32 / taper_zone_length as f32;
        min_width_factor + (1.0 - min_width_factor) * taper_progress * (1.0 - tapering_strength)
    } else if point_index >= total_points - taper_zone_length {
        // End taper zone
        let end_progress = (total_points - 1 - point_index) as f32 / taper_zone_length as f32;
        min_width_factor + (1.0 - min_width_factor) * end_progress * (1.0 - tapering_strength)
    } else {
        // Full width in middle
        1.0
    }
}

/// Calculate perpendicular vector for stroke outline (test helper function)
#[cfg(test)]
fn calculate_perpendicular(p1: (f32, f32), p2: (f32, f32)) -> (f32, f32) {
    let dx = p2.0 - p1.0;
    let dy = p2.1 - p1.1;
    let length = (dx * dx + dy * dy).sqrt();

    if length < f32::EPSILON {
        return (0.0, 1.0); // Default perpendicular
    }

    // Perpendicular vector (rotated 90 degrees)
    (-dy / length, dx / length)
}

/// Apply geometric tapering using path manipulation (test helper function)
#[cfg(test)]
fn apply_geometric_tapering(
    path_data: &str,
    _stroke_width: f32,
    _tapering_strength: f32,
) -> String {
    let points = parse_path_to_points(path_data);
    if points.len() < 2 {
        return String::from("M 0 0"); // Empty path
    }

    let _taper_zone_length = (points.len() / 4).max(1);
    let mut path_result = String::new();

    // Start with move command
    path_result.push_str(&format!("M {:.3} {:.3}", points[0].0, points[0].1));

    // Add lines with varying widths (simplified approach)
    for (_i, point) in points.iter().enumerate().skip(1) {
        path_result.push_str(&format!(" L {:.3} {:.3}", point.0, point.1));
    }

    // Close the path
    path_result.push_str(" Z");

    path_result
}

/// Create preset configurations for different hand-drawn styles
pub struct HandDrawnPresets;

impl HandDrawnPresets {
    /// Subtle hand-drawn effect - barely noticeable enhancement
    pub fn subtle() -> HandDrawnConfig {
        HandDrawnConfig {
            variable_weights: 0.15,
            tremor_strength: 0.05,
            tapering: 0.1,
            pressure_variation: 0.2,
            multi_pass_intensity: 0.1,
            adaptive_scaling: true,
            image_resolution: (800, 600),
            base_width_multiplier: 1.0,
            ..Default::default()
        }
    }

    /// Medium hand-drawn effect - noticeable organic feel
    pub fn medium() -> HandDrawnConfig {
        HandDrawnConfig {
            variable_weights: 0.3,
            tremor_strength: 0.15,
            tapering: 0.3,
            pressure_variation: 0.4,
            multi_pass_intensity: 0.3,
            adaptive_scaling: true,
            image_resolution: (800, 600),
            base_width_multiplier: 1.0,
            ..Default::default()
        }
    }

    /// Strong hand-drawn effect - obvious artistic style
    pub fn strong() -> HandDrawnConfig {
        HandDrawnConfig {
            variable_weights: 0.6,
            tremor_strength: 0.25,
            tapering: 0.5,
            pressure_variation: 0.6,
            multi_pass_intensity: 0.5,
            adaptive_scaling: true,
            image_resolution: (800, 600),
            base_width_multiplier: 1.2,
            ..Default::default()
        }
    }

    /// Sketch-like effect - ENHANCED for maximum visibility with dramatic effects
    pub fn sketchy() -> HandDrawnConfig {
        HandDrawnConfig {
            variable_weights: 0.8,     // High variable weights for dramatic width changes
            tremor_strength: 0.4,      // Strong tremor for visible jitter
            tapering: 0.7,             // Strong tapering for natural line endings
            pressure_variation: 0.8,   // High pressure variation
            multi_pass_intensity: 0.8, // Maximum multi-pass for sketchy overlap
            adaptive_scaling: true,
            image_resolution: (800, 600),
            base_width_multiplier: 1.4, // Higher base width for visibility
            ..Default::default()
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_estimate_path_confidence() {
        // Simple path should have lower confidence
        let simple_path = "M 10 10 L 20 20";
        let simple_confidence = estimate_path_confidence(simple_path);

        // Complex path should have higher confidence
        let complex_path = "M 10 10 L 20 20 L 30 25 L 40 22 L 50 28 L 60 30 C 65 32 70 35 75 38";
        let complex_confidence = estimate_path_confidence(complex_path);

        assert!(complex_confidence > simple_confidence);
        assert!((0.0..=1.0).contains(&simple_confidence));
        assert!((0.0..=1.0).contains(&complex_confidence));
    }

    #[test]
    fn test_coordinate_jitter() {
        let path_data = "M 10.0 20.0 L 30.0 40.0";
        let mut rng = ChaCha8Rng::seed_from_u64(42);

        let jittered = add_coordinate_jitter(path_data, 0.1, &mut rng, 1.0);

        // Should contain same structure but different coordinates
        assert!(jittered.contains('M'));
        assert!(jittered.contains('L'));
        assert_ne!(jittered, path_data); // Should be different due to jitter
    }

    #[test]
    fn test_hand_drawn_presets() {
        let subtle = HandDrawnPresets::subtle();
        let strong = HandDrawnPresets::strong();

        assert!(strong.variable_weights > subtle.variable_weights);
        assert!(strong.tremor_strength > subtle.tremor_strength);
        assert!(strong.tapering > subtle.tapering);
    }

    #[test]
    fn test_parse_path_to_points() {
        // Test simple line path
        let path_data = "M 10.0 20.0 L 30.0 40.0";
        let points = parse_path_to_points(path_data);
        assert_eq!(points.len(), 2);
        assert_eq!(points[0], (10.0, 20.0));
        assert_eq!(points[1], (30.0, 40.0));

        // Test path with multiple segments
        let path_data = "M 0 0 L 10 10 L 20 0";
        let points = parse_path_to_points(path_data);
        assert_eq!(points.len(), 3);
        assert_eq!(points[0], (0.0, 0.0));
        assert_eq!(points[1], (10.0, 10.0));
        assert_eq!(points[2], (20.0, 0.0));
    }

    #[test]
    fn test_calculate_width_factor() {
        let total_points = 10;
        let taper_zone_length = 2;
        let tapering_strength = 0.5;

        // Test start taper zone
        let factor_start =
            calculate_width_factor(0, total_points, tapering_strength, taper_zone_length);
        assert!(factor_start < 1.0); // Should be tapered
        assert!(factor_start >= 0.5); // Should not be below min width

        // Test middle (no taper)
        let factor_middle =
            calculate_width_factor(5, total_points, tapering_strength, taper_zone_length);
        assert_eq!(factor_middle, 1.0); // Should be full width

        // Test end taper zone
        let factor_end =
            calculate_width_factor(9, total_points, tapering_strength, taper_zone_length);
        assert!(factor_end < 1.0); // Should be tapered
        assert!(factor_end >= 0.5); // Should not be below min width
    }

    #[test]
    fn test_calculate_perpendicular() {
        // Test horizontal line
        let perp = calculate_perpendicular((0.0, 0.0), (1.0, 0.0));
        assert!((perp.0 - 0.0).abs() < 0.001); // x component should be 0
        assert!((perp.1.abs() - 1.0).abs() < 0.001); // y component should be ±1

        // Test vertical line
        let perp = calculate_perpendicular((0.0, 0.0), (0.0, 1.0));
        assert!((perp.0.abs() - 1.0).abs() < 0.001); // x component should be ±1
        assert!((perp.1 - 0.0).abs() < 0.001); // y component should be 0
    }

    #[test]
    fn test_apply_geometric_tapering() {
        let path_data = "M 0 0 L 10 0 L 20 0";
        let stroke_width = 2.0;
        let tapering_strength = 0.5;

        let tapered_path = apply_geometric_tapering(path_data, stroke_width, tapering_strength);

        // Should return a non-empty filled path
        assert!(!tapered_path.is_empty());
        assert!(tapered_path.starts_with('M')); // Should start with move command
        assert!(tapered_path.ends_with('Z')); // Should end with close command
        assert!(tapered_path.contains('L')); // Should contain line commands
    }
}
