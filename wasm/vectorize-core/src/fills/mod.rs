//! Fill generation algorithms for SVG regions

pub mod gradients;

// Re-export main types
pub use gradients::{
    Gradient,
    GradientType,
    GradientStop,
    analyze_region_gradient_pca,
    analyze_regions_batch,
};