//! Artistic style presets for dot-based pixel mapping
//!
//! This module provides pre-configured artistic styles and effects to enhance the visual
//! appeal of dot mapping output. Each style preset offers distinct visual characteristics
//! with controlled randomness and variations for organic, hand-drawn effects.
//!
//! ## Available Styles
//!
//! - **FineStippling**: Very small, precise dots for technical illustrations
//! - **BoldPointillism**: Larger dots with artistic variation for poster effects
//! - **SketchStyle**: Medium dots with heavy jitter for hand-drawn feel
//! - **TechnicalDrawing**: Uniform, precise dots for engineering drawings
//! - **WatercolorEffect**: Large, soft dots with low opacity for layering effects

use crate::algorithms::dots::{Dot, DotConfig};
use rand::prelude::*;
use rand_chacha::ChaCha8Rng;

/// Artistic style presets for dot mapping
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DotStyle {
    /// Fine stippling style for detailed technical illustrations
    /// - Very small dots (0.3-1.0 radius)
    /// - High density for detailed areas
    /// - Minimal jitter for precision
    /// - High opacity (0.8-1.0)
    FineStippling,

    /// Bold pointillism style for artistic interpretation
    /// - Larger dots (1.5-4.0 radius)
    /// - Moderate density with clear spacing
    /// - Significant size variation for artistic interest
    /// - Variable opacity (0.6-1.0)
    BoldPointillism,

    /// Sketch style for loose, artistic illustrations
    /// - Medium dots (0.8-2.5 radius)
    /// - Heavy jitter for hand-drawn feel
    /// - Irregular opacity for organic texture
    /// - Significant position variation
    SketchStyle,

    /// Technical drawing style for precise documentation
    /// - Uniform dot sizes (0.5-1.5 radius)
    /// - No jitter for precision
    /// - Consistent opacity
    /// - Grid-aligned positioning preference
    TechnicalDrawing,

    /// Watercolor effect for artistic simulation
    /// - Large, soft dots (2.0-6.0 radius)
    /// - Low opacity (0.3-0.7) for layering effect
    /// - Significant position jitter for organic feel
    /// - Size variation for texture
    WatercolorEffect,
}

impl DotStyle {
    /// Get all available dot styles
    pub fn all_styles() -> Vec<DotStyle> {
        vec![
            DotStyle::FineStippling,
            DotStyle::BoldPointillism,
            DotStyle::SketchStyle,
            DotStyle::TechnicalDrawing,
            DotStyle::WatercolorEffect,
        ]
    }

    /// Get the name of the style as a string
    pub fn name(&self) -> &'static str {
        match self {
            DotStyle::FineStippling => "Fine Stippling",
            DotStyle::BoldPointillism => "Bold Pointillism",
            DotStyle::SketchStyle => "Sketch Style",
            DotStyle::TechnicalDrawing => "Technical Drawing",
            DotStyle::WatercolorEffect => "Watercolor Effect",
        }
    }

    /// Get the description of the style's artistic intent
    pub fn description(&self) -> &'static str {
        match self {
            DotStyle::FineStippling => "Precise, small dots ideal for technical illustrations and fine art reproduction. Minimal variation for maximum detail.",
            DotStyle::BoldPointillism => "Artistic interpretation with larger, varied dots creating visual interest through size and opacity variation.",
            DotStyle::SketchStyle => "Hand-drawn aesthetic with irregular positioning and opacity, perfect for artistic sketches and loose illustrations.",
            DotStyle::TechnicalDrawing => "Uniform, precise dots for engineering drawings and technical documentation. Consistent and reliable.",
            DotStyle::WatercolorEffect => "Soft, layered effect mimicking watercolor painting with large, translucent dots and organic positioning.",
        }
    }
}

/// Configuration for artistic jitter effects
#[derive(Debug, Clone)]
pub struct JitterConfig {
    /// Maximum position offset in pixels
    pub max_offset: f32,
    /// Random seed for deterministic results
    pub seed: u64,
    /// Whether to respect minimum distance constraints
    pub respect_spacing: bool,
}

impl Default for JitterConfig {
    fn default() -> Self {
        Self {
            max_offset: 1.0,
            seed: 42,
            respect_spacing: true,
        }
    }
}

/// Configuration for size variation effects
#[derive(Debug, Clone)]
pub struct SizeVariationConfig {
    /// Variation factor (0.0 = no variation, 1.0 = full range)
    pub variation_factor: f32,
    /// Random seed for deterministic results
    pub seed: u64,
    /// Minimum size as factor of original (0.0-1.0)
    pub min_factor: f32,
    /// Maximum size as factor of original (1.0+)
    pub max_factor: f32,
}

impl Default for SizeVariationConfig {
    fn default() -> Self {
        Self {
            variation_factor: 0.3,
            seed: 42,
            min_factor: 0.7,
            max_factor: 1.5,
        }
    }
}

/// Configuration for opacity variation effects
#[derive(Debug, Clone)]
pub struct OpacityVariationConfig {
    /// Variation factor (0.0 = no variation, 1.0 = full range)
    pub variation_factor: f32,
    /// Random seed for deterministic results
    pub seed: u64,
    /// Minimum opacity (0.0-1.0)
    pub min_opacity: f32,
    /// Maximum opacity (0.0-1.0)
    pub max_opacity: f32,
}

impl Default for OpacityVariationConfig {
    fn default() -> Self {
        Self {
            variation_factor: 0.3,
            seed: 42,
            min_opacity: 0.3,
            max_opacity: 1.0,
        }
    }
}

/// Apply a style preset to a dot configuration
///
/// This function modifies the provided DotConfig to match the characteristics
/// of the specified artistic style. Each style has been carefully tuned to
/// produce distinct visual results.
///
/// # Arguments
/// * `config` - Mutable reference to dot configuration to modify
/// * `style` - The artistic style to apply
pub fn apply_style_preset(config: &mut DotConfig, style: DotStyle) {
    match style {
        DotStyle::FineStippling => {
            config.min_radius = 0.3;
            config.max_radius = 1.0;
            config.density_threshold = 0.05; // High density
            config.spacing_factor = 1.2; // Close spacing
            config.adaptive_sizing = true;
        }

        DotStyle::BoldPointillism => {
            config.min_radius = 1.5;
            config.max_radius = 4.0;
            config.density_threshold = 0.15; // Moderate density
            config.spacing_factor = 2.0; // Clear spacing
            config.adaptive_sizing = true;
        }

        DotStyle::SketchStyle => {
            config.min_radius = 0.8;
            config.max_radius = 2.5;
            config.density_threshold = 0.1;
            config.spacing_factor = 1.8; // Some variation in spacing
            config.adaptive_sizing = true;
        }

        DotStyle::TechnicalDrawing => {
            config.min_radius = 0.5;
            config.max_radius = 1.5;
            config.density_threshold = 0.2; // More selective
            config.spacing_factor = 2.5; // Uniform spacing
            config.adaptive_sizing = false; // Uniform sizing
        }

        DotStyle::WatercolorEffect => {
            config.min_radius = 2.0;
            config.max_radius = 6.0;
            config.density_threshold = 0.08; // Allow more variation
            config.spacing_factor = 1.5; // Allow overlap for layering
            config.adaptive_sizing = true;
        }
    }
}

/// Add artistic jitter to dot positions for organic, hand-drawn effects
///
/// Applies controlled randomness to dot positions while optionally respecting
/// minimum distance constraints to prevent clustering.
///
/// # Arguments
/// * `dots` - Mutable reference to vector of dots to modify
/// * `amount` - Jitter amount in pixels (0.0 = no jitter)
///
/// # Examples
/// ```
/// use vectorize_core::algorithms::dots::Dot;
/// use vectorize_core::algorithms::dot_styles::add_artistic_jitter;
///
/// let mut dots = vec![
///     Dot::new(10.0, 10.0, 1.0, 1.0, "#000000".to_string()),
///     Dot::new(20.0, 20.0, 1.0, 1.0, "#000000".to_string()),
/// ];
///
/// add_artistic_jitter(&mut dots, 2.0);
/// // Dots now have slight random position offsets
/// ```
pub fn add_artistic_jitter(dots: &mut Vec<Dot>, amount: f32) {
    if amount <= 0.0 || dots.is_empty() {
        return;
    }

    let config = JitterConfig {
        max_offset: amount,
        ..Default::default()
    };

    add_artistic_jitter_with_config(dots, &config);
}

/// Add artistic jitter with detailed configuration
pub fn add_artistic_jitter_with_config(dots: &mut Vec<Dot>, config: &JitterConfig) {
    if config.max_offset <= 0.0 || dots.is_empty() {
        return;
    }

    let mut rng = ChaCha8Rng::seed_from_u64(config.seed);

    // If we need to respect spacing, we need to check distances
    if config.respect_spacing {
        // Apply jitter while checking minimum distances
        let original_positions: Vec<(f32, f32)> = dots.iter().map(|d| (d.x, d.y)).collect();
        let original_radii: Vec<f32> = dots.iter().map(|d| d.radius).collect();

        for i in 0..dots.len() {
            let mut attempts = 0;
            let max_attempts = 20;

            while attempts < max_attempts {
                // Generate random offset
                let offset_x = rng.gen_range(-config.max_offset..=config.max_offset);
                let offset_y = rng.gen_range(-config.max_offset..=config.max_offset);

                let new_x = original_positions[i].0 + offset_x;
                let new_y = original_positions[i].1 + offset_y;

                // Check if new position maintains minimum distance
                let mut valid = true;
                for j in 0..dots.len() {
                    if i != j {
                        let current_other_x = if j < i {
                            dots[j].x
                        } else {
                            original_positions[j].0
                        };
                        let current_other_y = if j < i {
                            dots[j].y
                        } else {
                            original_positions[j].1
                        };

                        let dx = new_x - current_other_x;
                        let dy = new_y - current_other_y;
                        let distance = (dx * dx + dy * dy).sqrt();
                        let min_distance = (original_radii[i] + original_radii[j]) * 1.2; // Small buffer

                        if distance < min_distance {
                            valid = false;
                            break;
                        }
                    }
                }

                if valid {
                    dots[i].x = new_x;
                    dots[i].y = new_y;
                    break;
                }

                attempts += 1;
            }
        }
    } else {
        // Simple jitter without distance checking
        for dot in dots.iter_mut() {
            let offset_x = rng.gen_range(-config.max_offset..=config.max_offset);
            let offset_y = rng.gen_range(-config.max_offset..=config.max_offset);

            dot.x += offset_x;
            dot.y += offset_y;
        }
    }
}

/// Add size variation to dots for artistic enhancement
///
/// Applies random variation to dot radii within the specified factor range.
/// Uses normal distribution for natural-looking variation.
///
/// # Arguments
/// * `dots` - Mutable reference to vector of dots to modify
/// * `variation_factor` - Amount of variation (0.0 = no variation, 1.0 = maximum variation)
///
/// # Examples
/// ```
/// use vectorize_core::algorithms::dots::Dot;
/// use vectorize_core::algorithms::dot_styles::add_size_variation;
///
/// let mut dots = vec![
///     Dot::new(10.0, 10.0, 2.0, 1.0, "#000000".to_string()),
///     Dot::new(20.0, 20.0, 2.0, 1.0, "#000000".to_string()),
/// ];
///
/// add_size_variation(&mut dots, 0.3);
/// // Dots now have varied radii around their original sizes
/// ```
pub fn add_size_variation(dots: &mut Vec<Dot>, variation_factor: f32) {
    let config = SizeVariationConfig {
        variation_factor,
        ..Default::default()
    };

    add_size_variation_with_config(dots, &config);
}

/// Add size variation with detailed configuration
pub fn add_size_variation_with_config(dots: &mut Vec<Dot>, config: &SizeVariationConfig) {
    if config.variation_factor <= 0.0 || dots.is_empty() {
        return;
    }

    let mut rng = ChaCha8Rng::seed_from_u64(config.seed);

    for dot in dots.iter_mut() {
        let original_radius = dot.radius;

        // Generate variation factor using normal distribution around 1.0
        let std_dev = config.variation_factor * 0.33; // Scale for reasonable variation
        let variation: f32 = rng.sample(rand_distr::Normal::new(1.0, std_dev).unwrap());

        // Clamp to configured bounds
        let variation_clamped = variation.max(config.min_factor).min(config.max_factor);

        dot.radius = original_radius * variation_clamped;
    }
}

/// Add opacity variation to dots for depth and texture effects
///
/// Applies random variation to dot opacity values while ensuring they
/// remain within valid range (0.0-1.0).
///
/// # Arguments
/// * `dots` - Mutable reference to vector of dots to modify
/// * `variation_factor` - Amount of variation (0.0 = no variation, 1.0 = maximum variation)
///
/// # Examples
/// ```
/// use vectorize_core::algorithms::dots::Dot;
/// use vectorize_core::algorithms::dot_styles::add_opacity_variation;
///
/// let mut dots = vec![
///     Dot::new(10.0, 10.0, 1.0, 1.0, "#000000".to_string()),
///     Dot::new(20.0, 20.0, 1.0, 0.8, "#000000".to_string()),
/// ];
///
/// add_opacity_variation(&mut dots, 0.2);
/// // Dots now have varied opacity for depth effect
/// ```
pub fn add_opacity_variation(dots: &mut Vec<Dot>, variation_factor: f32) {
    let config = OpacityVariationConfig {
        variation_factor,
        ..Default::default()
    };

    add_opacity_variation_with_config(dots, &config);
}

/// Add opacity variation with detailed configuration
pub fn add_opacity_variation_with_config(dots: &mut Vec<Dot>, config: &OpacityVariationConfig) {
    if config.variation_factor <= 0.0 || dots.is_empty() {
        return;
    }

    let mut rng = ChaCha8Rng::seed_from_u64(config.seed);

    for dot in dots.iter_mut() {
        // Generate random opacity within configured range
        let opacity_range = config.max_opacity - config.min_opacity;
        let base_opacity = config.min_opacity;

        // Apply variation factor to scale the randomness
        let variation = rng.gen::<f32>() * config.variation_factor;
        let new_opacity = base_opacity + (opacity_range * variation);

        // Ensure opacity stays within valid bounds
        dot.opacity = new_opacity.max(0.0).min(1.0);
    }
}

/// Apply all artistic effects for a specific style
///
/// This is a convenience function that applies all the appropriate artistic
/// effects (jitter, size variation, opacity variation) for the specified style
/// with pre-configured parameters optimized for that style.
///
/// # Arguments
/// * `dots` - Mutable reference to vector of dots to modify
/// * `style` - The artistic style to apply effects for
///
/// # Examples
/// ```
/// use vectorize_core::algorithms::dots::Dot;
/// use vectorize_core::algorithms::dot_styles::{apply_artistic_effects, DotStyle};
///
/// let mut dots = vec![
///     Dot::new(10.0, 10.0, 1.0, 1.0, "#000000".to_string()),
///     Dot::new(20.0, 20.0, 1.0, 1.0, "#000000".to_string()),
/// ];
///
/// apply_artistic_effects(&mut dots, DotStyle::SketchStyle);
/// // Dots now have sketch-style artistic effects applied
/// ```
pub fn apply_artistic_effects(dots: &mut Vec<Dot>, style: DotStyle) {
    match style {
        DotStyle::FineStippling => {
            // Minimal effects for precision
            add_size_variation_with_config(
                dots,
                &SizeVariationConfig {
                    variation_factor: 0.1,
                    min_factor: 0.9,
                    max_factor: 1.1,
                    ..Default::default()
                },
            );
            add_opacity_variation_with_config(
                dots,
                &OpacityVariationConfig {
                    variation_factor: 0.1,
                    min_opacity: 0.8,
                    max_opacity: 1.0,
                    ..Default::default()
                },
            );
            // No jitter for fine stippling
        }

        DotStyle::BoldPointillism => {
            // Significant artistic variation
            add_artistic_jitter_with_config(
                dots,
                &JitterConfig {
                    max_offset: 0.8,
                    respect_spacing: true,
                    ..Default::default()
                },
            );
            add_size_variation_with_config(
                dots,
                &SizeVariationConfig {
                    variation_factor: 0.4,
                    min_factor: 0.6,
                    max_factor: 1.6,
                    ..Default::default()
                },
            );
            add_opacity_variation_with_config(
                dots,
                &OpacityVariationConfig {
                    variation_factor: 0.4,
                    min_opacity: 0.6,
                    max_opacity: 1.0,
                    ..Default::default()
                },
            );
        }

        DotStyle::SketchStyle => {
            // Heavy jitter for hand-drawn feel
            add_artistic_jitter_with_config(
                dots,
                &JitterConfig {
                    max_offset: 1.5,
                    respect_spacing: false, // Allow more organic placement
                    ..Default::default()
                },
            );
            add_size_variation_with_config(
                dots,
                &SizeVariationConfig {
                    variation_factor: 0.5,
                    min_factor: 0.5,
                    max_factor: 1.8,
                    ..Default::default()
                },
            );
            add_opacity_variation_with_config(
                dots,
                &OpacityVariationConfig {
                    variation_factor: 0.6,
                    min_opacity: 0.4,
                    max_opacity: 1.0,
                    ..Default::default()
                },
            );
        }

        DotStyle::TechnicalDrawing => {
            // No artistic effects for precision
            // Keep dots exactly as generated
        }

        DotStyle::WatercolorEffect => {
            // Organic, soft effects
            add_artistic_jitter_with_config(
                dots,
                &JitterConfig {
                    max_offset: 2.0,
                    respect_spacing: false, // Allow overlap for layering
                    ..Default::default()
                },
            );
            add_size_variation_with_config(
                dots,
                &SizeVariationConfig {
                    variation_factor: 0.4,
                    min_factor: 0.7,
                    max_factor: 1.4,
                    ..Default::default()
                },
            );
            add_opacity_variation_with_config(
                dots,
                &OpacityVariationConfig {
                    variation_factor: 0.5,
                    min_opacity: 0.3,
                    max_opacity: 0.7,
                    ..Default::default()
                },
            );
        }
    }
}

/// Apply grid alignment for technical drawing style
///
/// Adjusts dot positions to align with a regular grid, useful for technical
/// drawing applications where precision and alignment are important.
///
/// # Arguments
/// * `dots` - Mutable reference to vector of dots to modify
/// * `grid_size` - Grid cell size in pixels
pub fn apply_grid_alignment(dots: &mut Vec<Dot>, grid_size: f32) {
    if grid_size <= 0.0 {
        return;
    }

    for dot in dots.iter_mut() {
        // Round to nearest grid point
        dot.x = (dot.x / grid_size).round() * grid_size;
        dot.y = (dot.y / grid_size).round() * grid_size;
    }
}

/// Get recommended parameters for a specific style
///
/// Returns the optimal jitter, size variation, and opacity variation amounts
/// for the specified style as a tuple (jitter, size_var, opacity_var).
pub fn get_style_parameters(style: DotStyle) -> (f32, f32, f32) {
    match style {
        DotStyle::FineStippling => (0.0, 0.1, 0.1),
        DotStyle::BoldPointillism => (0.8, 0.4, 0.4),
        DotStyle::SketchStyle => (1.5, 0.5, 0.6),
        DotStyle::TechnicalDrawing => (0.0, 0.0, 0.0),
        DotStyle::WatercolorEffect => (2.0, 0.4, 0.5),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Helper function to create test dots
    fn create_test_dots() -> Vec<Dot> {
        vec![
            Dot::new(10.0, 10.0, 2.0, 1.0, "#000000".to_string()),
            Dot::new(20.0, 20.0, 2.0, 0.8, "#ff0000".to_string()),
            Dot::new(30.0, 30.0, 1.5, 0.9, "#00ff00".to_string()),
            Dot::new(40.0, 40.0, 2.5, 0.7, "#0000ff".to_string()),
        ]
    }

    #[test]
    fn test_dot_style_all_styles() {
        let styles = DotStyle::all_styles();
        assert_eq!(styles.len(), 5);

        // Ensure all expected styles are present
        assert!(styles.contains(&DotStyle::FineStippling));
        assert!(styles.contains(&DotStyle::BoldPointillism));
        assert!(styles.contains(&DotStyle::SketchStyle));
        assert!(styles.contains(&DotStyle::TechnicalDrawing));
        assert!(styles.contains(&DotStyle::WatercolorEffect));
    }

    #[test]
    fn test_dot_style_names() {
        assert_eq!(DotStyle::FineStippling.name(), "Fine Stippling");
        assert_eq!(DotStyle::BoldPointillism.name(), "Bold Pointillism");
        assert_eq!(DotStyle::SketchStyle.name(), "Sketch Style");
        assert_eq!(DotStyle::TechnicalDrawing.name(), "Technical Drawing");
        assert_eq!(DotStyle::WatercolorEffect.name(), "Watercolor Effect");
    }

    #[test]
    fn test_dot_style_descriptions() {
        // Ensure all styles have non-empty descriptions
        for style in DotStyle::all_styles() {
            let description = style.description();
            assert!(!description.is_empty());
            assert!(description.len() > 20); // Reasonable length
        }
    }

    #[test]
    fn test_apply_style_preset_fine_stippling() {
        let mut config = DotConfig::default();
        apply_style_preset(&mut config, DotStyle::FineStippling);

        assert_eq!(config.min_radius, 0.3);
        assert_eq!(config.max_radius, 1.0);
        assert_eq!(config.density_threshold, 0.05);
        assert_eq!(config.spacing_factor, 1.2);
        assert!(config.adaptive_sizing);
    }

    #[test]
    fn test_apply_style_preset_bold_pointillism() {
        let mut config = DotConfig::default();
        apply_style_preset(&mut config, DotStyle::BoldPointillism);

        assert_eq!(config.min_radius, 1.5);
        assert_eq!(config.max_radius, 4.0);
        assert_eq!(config.density_threshold, 0.15);
        assert_eq!(config.spacing_factor, 2.0);
        assert!(config.adaptive_sizing);
    }

    #[test]
    fn test_apply_style_preset_sketch_style() {
        let mut config = DotConfig::default();
        apply_style_preset(&mut config, DotStyle::SketchStyle);

        assert_eq!(config.min_radius, 0.8);
        assert_eq!(config.max_radius, 2.5);
        assert_eq!(config.density_threshold, 0.1);
        assert_eq!(config.spacing_factor, 1.8);
        assert!(config.adaptive_sizing);
    }

    #[test]
    fn test_apply_style_preset_technical_drawing() {
        let mut config = DotConfig::default();
        apply_style_preset(&mut config, DotStyle::TechnicalDrawing);

        assert_eq!(config.min_radius, 0.5);
        assert_eq!(config.max_radius, 1.5);
        assert_eq!(config.density_threshold, 0.2);
        assert_eq!(config.spacing_factor, 2.5);
        assert!(!config.adaptive_sizing); // Technical should be uniform
    }

    #[test]
    fn test_apply_style_preset_watercolor_effect() {
        let mut config = DotConfig::default();
        apply_style_preset(&mut config, DotStyle::WatercolorEffect);

        assert_eq!(config.min_radius, 2.0);
        assert_eq!(config.max_radius, 6.0);
        assert_eq!(config.density_threshold, 0.08);
        assert_eq!(config.spacing_factor, 1.5);
        assert!(config.adaptive_sizing);
    }

    #[test]
    fn test_add_artistic_jitter_basic() {
        let mut dots = create_test_dots();
        let original_positions: Vec<(f32, f32)> = dots.iter().map(|d| (d.x, d.y)).collect();

        add_artistic_jitter(&mut dots, 1.0);

        // Positions should have changed (with very high probability)
        let mut changed_count = 0;
        for (i, dot) in dots.iter().enumerate() {
            if (dot.x - original_positions[i].0).abs() > 0.01
                || (dot.y - original_positions[i].1).abs() > 0.01
            {
                changed_count += 1;
            }
        }

        // At least half should have changed with jitter amount of 1.0
        assert!(changed_count >= dots.len() / 2);
    }

    #[test]
    fn test_add_artistic_jitter_zero_amount() {
        let mut dots = create_test_dots();
        let original_positions: Vec<(f32, f32)> = dots.iter().map(|d| (d.x, d.y)).collect();

        add_artistic_jitter(&mut dots, 0.0);

        // Positions should not change
        for (i, dot) in dots.iter().enumerate() {
            assert_eq!(dot.x, original_positions[i].0);
            assert_eq!(dot.y, original_positions[i].1);
        }
    }

    #[test]
    fn test_add_artistic_jitter_empty_dots() {
        let mut dots = Vec::new();
        add_artistic_jitter(&mut dots, 1.0);
        assert!(dots.is_empty());
    }

    #[test]
    fn test_add_size_variation_basic() {
        let mut dots = create_test_dots();
        let original_radii: Vec<f32> = dots.iter().map(|d| d.radius).collect();

        add_size_variation(&mut dots, 0.3);

        // Radii should have changed (with very high probability)
        let mut changed_count = 0;
        for (i, dot) in dots.iter().enumerate() {
            if (dot.radius - original_radii[i]).abs() > 0.01 {
                changed_count += 1;
            }
        }

        // Most should have changed
        assert!(changed_count >= dots.len() / 2);

        // All radii should still be positive
        for dot in &dots {
            assert!(dot.radius > 0.0);
        }
    }

    #[test]
    fn test_add_size_variation_zero_factor() {
        let mut dots = create_test_dots();
        let original_radii: Vec<f32> = dots.iter().map(|d| d.radius).collect();

        add_size_variation(&mut dots, 0.0);

        // Radii should not change
        for (i, dot) in dots.iter().enumerate() {
            assert_eq!(dot.radius, original_radii[i]);
        }
    }

    #[test]
    fn test_add_opacity_variation_basic() {
        let mut dots = create_test_dots();
        let original_opacities: Vec<f32> = dots.iter().map(|d| d.opacity).collect();

        add_opacity_variation(&mut dots, 0.3);

        // Opacities should have changed (with very high probability)
        let mut changed_count = 0;
        for (i, dot) in dots.iter().enumerate() {
            if (dot.opacity - original_opacities[i]).abs() > 0.01 {
                changed_count += 1;
            }
        }

        // Most should have changed
        assert!(changed_count >= dots.len() / 2);

        // All opacities should be within valid range
        for dot in &dots {
            assert!(dot.opacity >= 0.0 && dot.opacity <= 1.0);
        }
    }

    #[test]
    fn test_add_opacity_variation_zero_factor() {
        let mut dots = create_test_dots();
        let original_opacities: Vec<f32> = dots.iter().map(|d| d.opacity).collect();

        add_opacity_variation(&mut dots, 0.0);

        // Opacities should not change
        for (i, dot) in dots.iter().enumerate() {
            assert_eq!(dot.opacity, original_opacities[i]);
        }
    }

    #[test]
    fn test_apply_artistic_effects_fine_stippling() {
        let mut dots = create_test_dots();
        let original_positions: Vec<(f32, f32)> = dots.iter().map(|d| (d.x, d.y)).collect();

        apply_artistic_effects(&mut dots, DotStyle::FineStippling);

        // Fine stippling should have minimal jitter (positions should be unchanged)
        for (i, dot) in dots.iter().enumerate() {
            assert_eq!(dot.x, original_positions[i].0);
            assert_eq!(dot.y, original_positions[i].1);
        }

        // Should have minimal variations in size and opacity
        for dot in &dots {
            assert!(dot.radius > 0.0);
            assert!(dot.opacity >= 0.0 && dot.opacity <= 1.0);
        }
    }

    #[test]
    fn test_apply_artistic_effects_sketch_style() {
        let mut dots = create_test_dots();
        let original_positions: Vec<(f32, f32)> = dots.iter().map(|d| (d.x, d.y)).collect();

        apply_artistic_effects(&mut dots, DotStyle::SketchStyle);

        // Sketch style should have significant jitter
        let mut position_changed_count = 0;
        for (i, dot) in dots.iter().enumerate() {
            if (dot.x - original_positions[i].0).abs() > 0.1
                || (dot.y - original_positions[i].1).abs() > 0.1
            {
                position_changed_count += 1;
            }
        }

        // Most positions should change with sketch style
        assert!(position_changed_count >= dots.len() / 2);

        // All properties should still be valid
        for dot in &dots {
            assert!(dot.radius > 0.0);
            assert!(dot.opacity >= 0.0 && dot.opacity <= 1.0);
        }
    }

    #[test]
    fn test_apply_artistic_effects_technical_drawing() {
        let mut dots = create_test_dots();
        let original_dots = dots.clone();

        apply_artistic_effects(&mut dots, DotStyle::TechnicalDrawing);

        // Technical drawing should have no effects (dots unchanged)
        for (i, dot) in dots.iter().enumerate() {
            assert_eq!(dot.x, original_dots[i].x);
            assert_eq!(dot.y, original_dots[i].y);
            assert_eq!(dot.radius, original_dots[i].radius);
            assert_eq!(dot.opacity, original_dots[i].opacity);
        }
    }

    #[test]
    fn test_apply_grid_alignment() {
        let mut dots = vec![
            Dot::new(10.3, 15.7, 1.0, 1.0, "#000000".to_string()),
            Dot::new(22.1, 27.9, 1.0, 1.0, "#000000".to_string()),
        ];

        apply_grid_alignment(&mut dots, 5.0);

        // Should align to 5-pixel grid
        assert_eq!(dots[0].x, 10.0); // 10.3 rounds to 10.0
        assert_eq!(dots[0].y, 15.0); // 15.7 rounds to 15.0
        assert_eq!(dots[1].x, 20.0); // 22.1 rounds to 20.0
        assert_eq!(dots[1].y, 30.0); // 27.9 rounds to 30.0
    }

    #[test]
    fn test_apply_grid_alignment_zero_size() {
        let mut dots = create_test_dots();
        let original_positions: Vec<(f32, f32)> = dots.iter().map(|d| (d.x, d.y)).collect();

        apply_grid_alignment(&mut dots, 0.0);

        // Positions should not change with zero grid size
        for (i, dot) in dots.iter().enumerate() {
            assert_eq!(dot.x, original_positions[i].0);
            assert_eq!(dot.y, original_positions[i].1);
        }
    }

    #[test]
    fn test_get_style_parameters() {
        let (jitter, size_var, opacity_var) = get_style_parameters(DotStyle::FineStippling);
        assert_eq!(jitter, 0.0);
        assert_eq!(size_var, 0.1);
        assert_eq!(opacity_var, 0.1);

        let (jitter, size_var, opacity_var) = get_style_parameters(DotStyle::SketchStyle);
        assert_eq!(jitter, 1.5);
        assert_eq!(size_var, 0.5);
        assert_eq!(opacity_var, 0.6);

        let (jitter, size_var, opacity_var) = get_style_parameters(DotStyle::TechnicalDrawing);
        assert_eq!(jitter, 0.0);
        assert_eq!(size_var, 0.0);
        assert_eq!(opacity_var, 0.0);
    }

    #[test]
    fn test_config_defaults() {
        let jitter_config = JitterConfig::default();
        assert_eq!(jitter_config.max_offset, 1.0);
        assert_eq!(jitter_config.seed, 42);
        assert!(jitter_config.respect_spacing);

        let size_config = SizeVariationConfig::default();
        assert_eq!(size_config.variation_factor, 0.3);
        assert_eq!(size_config.seed, 42);
        assert_eq!(size_config.min_factor, 0.7);
        assert_eq!(size_config.max_factor, 1.5);

        let opacity_config = OpacityVariationConfig::default();
        assert_eq!(opacity_config.variation_factor, 0.3);
        assert_eq!(opacity_config.seed, 42);
        assert_eq!(opacity_config.min_opacity, 0.3);
        assert_eq!(opacity_config.max_opacity, 1.0);
    }

    #[test]
    fn test_deterministic_effects() {
        let mut dots1 = create_test_dots();
        let mut dots2 = dots1.clone();

        // Apply same effects with same seed
        add_artistic_jitter(&mut dots1, 1.0);
        add_artistic_jitter(&mut dots2, 1.0);

        // Results should be identical (deterministic)
        for (d1, d2) in dots1.iter().zip(dots2.iter()) {
            assert!((d1.x - d2.x).abs() < 0.001);
            assert!((d1.y - d2.y).abs() < 0.001);
        }
    }

    #[test]
    fn test_comprehensive_style_effects() {
        // Test that each style produces distinct results
        let base_dots = create_test_dots();

        for style in DotStyle::all_styles() {
            let mut dots = base_dots.clone();
            apply_artistic_effects(&mut dots, style);

            // All dots should remain valid after effects
            for dot in &dots {
                assert!(dot.radius > 0.0, "Invalid radius for style {:?}", style);
                assert!(
                    dot.opacity >= 0.0 && dot.opacity <= 1.0,
                    "Invalid opacity for style {:?}",
                    style
                );
                // Positions can be anywhere (jitter may move them)
            }
        }
    }
}
