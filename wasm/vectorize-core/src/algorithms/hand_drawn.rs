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
    {
        return paths; // No enhancements requested
    }

    let mut rng = ChaCha8Rng::seed_from_u64(config.seed);

    paths
        .into_iter()
        .map(|path| apply_path_aesthetics(path, config, &mut rng))
        .collect()
}

/// Apply aesthetic enhancements to a single path
fn apply_path_aesthetics(
    mut path: SvgPath,
    config: &HandDrawnConfig,
    rng: &mut ChaCha8Rng,
) -> SvgPath {
    // Apply variable line weights
    if config.variable_weights > 0.0 {
        path = apply_variable_weight(path, config, rng);
    }

    // Apply organic tremor to coordinates
    if config.tremor_strength > 0.0 {
        path = apply_organic_tremor(path, config, rng);
    }

    // Apply line tapering (requires SVG 2.0 or custom implementation)
    if config.tapering > 0.0 {
        path = apply_line_tapering(path, config, rng);
    }

    path
}

/// Apply variable line weights based on path characteristics
fn apply_variable_weight(
    mut path: SvgPath,
    config: &HandDrawnConfig,
    rng: &mut ChaCha8Rng,
) -> SvgPath {
    // Estimate "confidence" from path length and complexity
    let path_confidence = estimate_path_confidence(&path.data);

    // Vary stroke width based on confidence and randomization
    let weight_variation = config.variable_weights * (rng.gen::<f32>() - 0.5) * 2.0; // -1.0 to 1.0
    let confidence_factor = 0.7 + 0.6 * path_confidence; // 0.7 to 1.3

    path.stroke_width *=
        config.base_width_multiplier * confidence_factor * (1.0 + weight_variation);

    // Clamp to reasonable bounds
    path.stroke_width = path.stroke_width.clamp(0.3, 4.0);

    path
}

/// Apply subtle organic tremor to path coordinates
fn apply_organic_tremor(
    mut path: SvgPath,
    config: &HandDrawnConfig,
    rng: &mut ChaCha8Rng,
) -> SvgPath {
    // Parse path data and add subtle randomization to coordinates
    let tremor_data = add_coordinate_jitter(&path.data, config.tremor_strength, rng);
    path.data = tremor_data;
    path
}

/// Apply line tapering for natural start/end points
fn apply_line_tapering(path: SvgPath, config: &HandDrawnConfig, _rng: &mut ChaCha8Rng) -> SvgPath {
    if config.tapering == 0.0 {
        return path;
    }

    // Parse path and apply geometric tapering by converting to stroked paths
    let tapered_data = apply_geometric_tapering(&path.data, path.stroke_width, config.tapering);
    
    SvgPath {
        data: tapered_data,
        // Convert to filled path since we're creating the stroke geometry
        fill: path.stroke.clone(),
        stroke: "none".to_string(),
        stroke_width: 0.0,
        ..path
    }
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

/// Add subtle coordinate jitter for organic appearance
fn add_coordinate_jitter(path_data: &str, tremor_strength: f32, rng: &mut ChaCha8Rng) -> String {
    let mut result = String::with_capacity(path_data.len() + 100);
    let tokens: Vec<&str> = path_data.split_whitespace().collect();

    let mut i = 0;
    while i < tokens.len() {
        let token = tokens[i];

        // Check if this token is a coordinate (number)
        if let Ok(coord) = token.parse::<f32>() {
            // Add subtle tremor (typically 0.5-2.0 pixels)
            let jitter = tremor_strength * 5.0 * (rng.gen::<f32>() - 0.5) * 2.0; // -tremor to +tremor
            let jittered = coord + jitter;

            if i > 0 {
                result.push(' ');
            }
            result.push_str(&format!("{jittered:.2}"));
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

/// Apply geometric tapering by converting strokes to filled paths with variable width
fn apply_geometric_tapering(path_data: &str, stroke_width: f32, tapering_strength: f32) -> String {
    // Parse path into coordinate points
    let path_points = parse_path_to_points(path_data);
    if path_points.len() < 2 {
        return path_data.to_string(); // Can't taper single point or empty path
    }

    // Calculate taper zones (20% of path length on each end by default)
    let taper_zone_length = (path_points.len() as f32 * 0.2).max(2.0) as usize;
    
    // Generate variable width stroke outlines
    let left_outline = generate_stroke_outline(&path_points, stroke_width, tapering_strength, true, taper_zone_length);
    let right_outline = generate_stroke_outline(&path_points, stroke_width, tapering_strength, false, taper_zone_length);
    
    // Create filled path from both outlines
    create_filled_path_from_outlines(&left_outline, &right_outline)
}

/// Parse SVG path data into a series of (x, y) coordinate points
fn parse_path_to_points(path_data: &str) -> Vec<(f32, f32)> {
    let mut points = Vec::new();
    let tokens: Vec<&str> = path_data.split_whitespace().collect();
    
    let mut i = 0;
    let mut current_x = 0.0;
    let mut current_y = 0.0;
    
    while i < tokens.len() {
        let token = tokens[i];
        
        match token {
            "M" | "L" => {
                // Absolute move/line commands - expect x,y coordinates
                if i + 2 < tokens.len() {
                    if let (Ok(x), Ok(y)) = (tokens[i + 1].parse::<f32>(), tokens[i + 2].parse::<f32>()) {
                        current_x = x;
                        current_y = y;
                        points.push((current_x, current_y));
                        i += 3;
                        continue;
                    }
                }
                i += 1;
            }
            "l" => {
                // Relative line command - expect dx,dy coordinates
                if i + 2 < tokens.len() {
                    if let (Ok(dx), Ok(dy)) = (tokens[i + 1].parse::<f32>(), tokens[i + 2].parse::<f32>()) {
                        current_x += dx;
                        current_y += dy;
                        points.push((current_x, current_y));
                        i += 3;
                        continue;
                    }
                }
                i += 1;
            }
            "C" => {
                // Cubic Bézier curve - approximate with line segments
                if i + 6 < tokens.len() {
                    if let (Ok(x1), Ok(y1), Ok(x2), Ok(y2), Ok(x), Ok(y)) = (
                        tokens[i + 1].parse::<f32>(),
                        tokens[i + 2].parse::<f32>(),
                        tokens[i + 3].parse::<f32>(),
                        tokens[i + 4].parse::<f32>(),
                        tokens[i + 5].parse::<f32>(),
                        tokens[i + 6].parse::<f32>()
                    ) {
                        // Approximate curve with multiple line segments
                        let start = (current_x, current_y);
                        let end = (x, y);
                        let ctrl1 = (x1, y1);
                        let ctrl2 = (x2, y2);
                        
                        // Sample curve at regular intervals
                        for t in 1..=8 {
                            let t_norm = t as f32 / 8.0;
                            let point = cubic_bezier_point(start, ctrl1, ctrl2, end, t_norm);
                            points.push(point);
                        }
                        
                        current_x = x;
                        current_y = y;
                        i += 7;
                        continue;
                    }
                }
                i += 1;
            }
            "Z" | "z" => {
                // Close path - add line back to start if needed
                if !points.is_empty() && points.last() != Some(&points[0]) {
                    points.push(points[0]);
                }
                i += 1;
            }
            _ => {
                // Try to parse as standalone coordinate
                if let Ok(coord) = token.parse::<f32>() {
                    // This might be part of an implicit command sequence
                    if i + 1 < tokens.len() {
                        if let Ok(y_coord) = tokens[i + 1].parse::<f32>() {
                            current_x = coord;
                            current_y = y_coord;
                            points.push((current_x, current_y));
                            i += 2;
                            continue;
                        }
                    }
                }
                i += 1;
            }
        }
    }
    
    points
}

/// Calculate a point on a cubic Bézier curve
fn cubic_bezier_point(start: (f32, f32), ctrl1: (f32, f32), ctrl2: (f32, f32), end: (f32, f32), t: f32) -> (f32, f32) {
    let t2 = t * t;
    let t3 = t2 * t;
    let mt = 1.0 - t;
    let mt2 = mt * mt;
    let mt3 = mt2 * mt;
    
    let x = mt3 * start.0 + 3.0 * mt2 * t * ctrl1.0 + 3.0 * mt * t2 * ctrl2.0 + t3 * end.0;
    let y = mt3 * start.1 + 3.0 * mt2 * t * ctrl1.1 + 3.0 * mt * t2 * ctrl2.1 + t3 * end.1;
    
    (x, y)
}

/// Generate stroke outline on one side with tapering
fn generate_stroke_outline(
    points: &[(f32, f32)], 
    base_width: f32, 
    tapering_strength: f32, 
    left_side: bool,
    taper_zone_length: usize
) -> Vec<(f32, f32)> {
    if points.len() < 2 {
        return Vec::new();
    }
    
    let mut outline = Vec::new();
    let point_count = points.len();
    
    for i in 0..point_count {
        let current = points[i];
        
        // Calculate width with tapering
        let width_factor = calculate_width_factor(i, point_count, tapering_strength, taper_zone_length);
        let half_width = (base_width * width_factor) / 2.0;
        
        // Calculate perpendicular direction
        let normal = if i == 0 && point_count > 1 {
            // Use direction to next point for first point
            calculate_perpendicular(current, points[i + 1])
        } else if i == point_count - 1 && point_count > 1 {
            // Use direction from previous point for last point
            calculate_perpendicular(points[i - 1], current)
        } else if point_count > 2 && i > 0 && i < point_count - 1 {
            // Use average of previous and next directions for middle points
            let prev_normal = calculate_perpendicular(points[i - 1], current);
            let next_normal = calculate_perpendicular(current, points[i + 1]);
            let avg_x = (prev_normal.0 + next_normal.0) / 2.0;
            let avg_y = (prev_normal.1 + next_normal.1) / 2.0;
            let length = (avg_x * avg_x + avg_y * avg_y).sqrt();
            if length > 0.0 {
                (avg_x / length, avg_y / length)
            } else {
                prev_normal
            }
        } else {
            (0.0, 1.0) // Default normal
        };
        
        // Calculate outline point
        let side_multiplier = if left_side { -1.0 } else { 1.0 };
        let outline_point = (
            current.0 + normal.0 * half_width * side_multiplier,
            current.1 + normal.1 * half_width * side_multiplier,
        );
        
        outline.push(outline_point);
    }
    
    outline
}

/// Calculate width factor with tapering at endpoints
fn calculate_width_factor(index: usize, total_points: usize, tapering_strength: f32, taper_zone_length: usize) -> f32 {
    if total_points <= 1 {
        return 1.0;
    }
    
    let min_width_factor = 1.0 - tapering_strength;
    
    // Calculate distance from nearest endpoint
    let distance_from_start = index;
    let distance_from_end = total_points - 1 - index;
    let min_distance_from_endpoint = distance_from_start.min(distance_from_end);
    
    if min_distance_from_endpoint >= taper_zone_length {
        // Outside taper zone - full width
        1.0
    } else {
        // Inside taper zone - interpolate between min and full width
        let taper_progress = min_distance_from_endpoint as f32 / taper_zone_length as f32;
        min_width_factor + (1.0 - min_width_factor) * taper_progress
    }
}

/// Calculate perpendicular unit vector from one point to another
fn calculate_perpendicular(from: (f32, f32), to: (f32, f32)) -> (f32, f32) {
    let dx = to.0 - from.0;
    let dy = to.1 - from.1;
    let length = (dx * dx + dy * dy).sqrt();
    
    if length == 0.0 {
        return (0.0, 1.0); // Default perpendicular
    }
    
    // Perpendicular is (-dy, dx) normalized
    (-dy / length, dx / length)
}

/// Create filled SVG path from left and right outlines
fn create_filled_path_from_outlines(left_outline: &[(f32, f32)], right_outline: &[(f32, f32)]) -> String {
    if left_outline.is_empty() || right_outline.is_empty() {
        return String::new();
    }
    
    let mut path = String::new();
    
    // Start with left outline
    path.push_str(&format!("M {:.2} {:.2}", left_outline[0].0, left_outline[0].1));
    
    for point in left_outline.iter().skip(1) {
        path.push_str(&format!(" L {:.2} {:.2}", point.0, point.1));
    }
    
    // Connect to right outline at the end
    if let Some(last_right) = right_outline.last() {
        path.push_str(&format!(" L {:.2} {:.2}", last_right.0, last_right.1));
    }
    
    // Trace back along right outline in reverse
    for point in right_outline.iter().rev().skip(1) {
        path.push_str(&format!(" L {:.2} {:.2}", point.0, point.1));
    }
    
    // Close path
    path.push_str(" Z");
    
    path
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
            base_width_multiplier: 1.0,
            ..Default::default()
        }
    }

    /// Medium hand-drawn effect - noticeable organic feel
    pub fn medium() -> HandDrawnConfig {
        HandDrawnConfig {
            variable_weights: 0.3,
            tremor_strength: 0.1,
            tapering: 0.2,
            pressure_variation: 0.4,
            base_width_multiplier: 1.0,
            ..Default::default()
        }
    }

    /// Strong hand-drawn effect - obvious artistic style
    pub fn strong() -> HandDrawnConfig {
        HandDrawnConfig {
            variable_weights: 0.5,
            tremor_strength: 0.2,
            tapering: 0.4,
            pressure_variation: 0.6,
            base_width_multiplier: 1.1,
            ..Default::default()
        }
    }

    /// Sketch-like effect - loose, sketchy appearance
    pub fn sketchy() -> HandDrawnConfig {
        HandDrawnConfig {
            variable_weights: 0.6,
            tremor_strength: 0.3,
            tapering: 0.3,
            pressure_variation: 0.7,
            base_width_multiplier: 1.2,
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

        let jittered = add_coordinate_jitter(path_data, 0.1, &mut rng);

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
        let factor_start = calculate_width_factor(0, total_points, tapering_strength, taper_zone_length);
        assert!(factor_start < 1.0); // Should be tapered
        assert!(factor_start >= 0.5); // Should not be below min width
        
        // Test middle (no taper)
        let factor_middle = calculate_width_factor(5, total_points, tapering_strength, taper_zone_length);
        assert_eq!(factor_middle, 1.0); // Should be full width
        
        // Test end taper zone
        let factor_end = calculate_width_factor(9, total_points, tapering_strength, taper_zone_length);
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
