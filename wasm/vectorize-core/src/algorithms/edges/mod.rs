//! Edge detection and flow analysis module
//!
//! This module contains algorithms for edge detection, ETF (Edge Tangent Flow),
//! and gradient analysis for edge-based vectorization.

pub mod edges;
pub mod etf;
pub mod gradients;

// Re-export commonly used types
pub use edges::{
    apply_nms, compute_fdog, compute_multi_direction_edges, compute_xdog, hysteresis_threshold,
    EdgeResponse, FdogConfig, MultiDirectionEdges, NmsConfig, XdogConfig,
};
pub use etf::{compute_etf, EtfConfig, EtfField};
pub use gradients::{
    analyze_image_gradients, analyze_image_gradients_with_config, calculate_gradient_magnitude,
    calculate_local_variance, GradientAnalysis, GradientConfig,
};
