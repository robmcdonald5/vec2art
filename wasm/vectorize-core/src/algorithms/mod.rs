//! Vectorization algorithms module
//!
//! This module contains all the vectorization algorithms and related utilities.

pub mod logo;
pub mod regions;
pub mod path_utils;
pub mod primitives;
pub mod gradient_detection;

// Re-export commonly used types
pub use logo::{SvgPath, SvgElementType, Point, Contour};
pub use regions::{Color, vectorize_regions};
pub use gradient_detection::{GradientConfig, GradientType, GradientAnalysis, analyze_region_gradient};