//! Path tracing and curve fitting algorithms

pub mod fit;

#[cfg(test)]
mod fit_tests;

// Re-export main types
pub use fit::{
    Point2D,
    CubicBezier,
    fit_cubic_bezier,
    two_stage_fit,
    limit_curvature,
};