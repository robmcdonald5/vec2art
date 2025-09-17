//! Dots and stippling algorithms module
//!
//! This module contains algorithms for generating dots, stippling effects,
//! and background analysis for dot-based vectorization.

pub mod adaptive_dots;
pub mod background;
pub mod dot_styles;
pub mod dots;
pub mod dots_optimized;
pub mod svg_dots;

// Re-export commonly used types
pub use adaptive_dots::{
    analyze_image_regions, apply_adaptive_density, calculate_adaptive_density,
    generate_adaptive_dots, poisson_disk_sampling, smooth_density_transitions, AdaptiveConfig,
    Region,
};
pub use background::{
    calculate_color_similarity, detect_background_advanced, detect_background_mask, rgba_to_lab,
    BackgroundConfig, LabColor,
};
pub use dot_styles::{
    add_artistic_jitter, add_opacity_variation, add_size_variation, apply_artistic_effects,
    apply_grid_alignment, apply_style_preset, get_style_parameters, DotStyle, JitterConfig,
    OpacityVariationConfig, SizeVariationConfig,
};
pub use dots::{
    generate_dots, generate_dots_auto_background, generate_dots_from_image, Dot, DotConfig,
};
pub use dots_optimized::{
    analyze_gradients_optimized, detect_background_optimized, generate_dots_optimized_pipeline,
    OptimizedDotConfig, OptimizedDotGenerator,
};
pub use svg_dots::{
    dots_to_svg_elements, dots_to_svg_paths, dots_to_svg_with_config, generate_dot_svg_document,
    optimize_dot_svg, SvgDotConfig, SvgElement,
};
