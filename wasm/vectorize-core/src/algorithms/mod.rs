//! Vectorization algorithms module
//!
//! This module contains all the vectorization algorithms and related utilities.

pub mod logo;
pub mod regions;
pub mod path_utils;
pub mod primitives;
pub mod gradient_detection;
pub mod trace_low;
pub mod image_analysis;

// Re-export commonly used types
pub use logo::{SvgPath, SvgElementType, Point, Contour};
pub use regions::{Color, vectorize_regions};
pub use gradient_detection::{GradientConfig, GradientType, GradientAnalysis, analyze_region_gradient};
pub use trace_low::{TraceBackend, TraceLowConfig, vectorize_trace_low};
pub use image_analysis::{analyze_image_content};