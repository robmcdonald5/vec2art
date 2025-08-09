//! Path tracing and curve fitting algorithms

pub mod fit;

// Re-export main types
pub use fit::{
    Point2D,
    CubicBezier,
    fit_cubic_bezier,
    two_stage_fit,
    limit_curvature,
};