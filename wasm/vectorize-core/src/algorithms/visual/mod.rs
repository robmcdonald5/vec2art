//! Visual processing and enhancement module
//!
//! This module contains algorithms for color processing, SIMD operations,
//! gradient detection, and hand-drawn aesthetic enhancements.

pub mod color_processing;
pub mod gradient_detection;
pub mod hand_drawn;
pub mod simd_color;

// Re-export commonly used types
pub use color_processing::{
    extract_path_colors, reduce_color_palette, rgba_to_hex, ColorSample, ColorSamplingMethod,
    PathColorInfo,
};
pub use gradient_detection::{
    analyze_path_for_gradients, analyze_paths_for_gradients, generate_gradient_id,
    GradientAnalysis, GradientDetectionConfig, GradientPoint,
    GradientStop, GradientType,
};

// Re-export GradientAnalysis as GradientDetectionAnalysis for backward compatibility
pub use gradient_detection::GradientAnalysis as GradientDetectionAnalysis;
pub use hand_drawn::{apply_hand_drawn_aesthetics, HandDrawnConfig, HandDrawnPresets};
pub use simd_color::{
    get_simd_info, is_simd_available, simd_analyze_gradient_strength,
    simd_k_means_palette_reduction,
};