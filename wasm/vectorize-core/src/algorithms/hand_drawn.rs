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
    // For now, just apply slight width reduction as a simple tapering effect
    // Full tapering would require SVG gradient strokes or path modification
    let taper_factor = 1.0 - (config.tapering * 0.2); // Reduce width by up to 20%

    SvgPath {
        stroke_width: path.stroke_width * taper_factor,
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
}
