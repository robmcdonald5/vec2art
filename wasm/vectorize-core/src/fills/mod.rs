//! Fill generation algorithms for SVG regions

pub mod gradients;

#[cfg(test)]
mod gradients_tests;

// Re-export main types
pub use gradients::{
    Gradient,
    GradientType,
    GradientStop,
    analyze_region_gradient_pca,
    analyze_regions_batch,
};