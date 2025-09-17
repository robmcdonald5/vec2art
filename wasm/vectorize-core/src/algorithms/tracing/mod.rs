//! Path tracing and curve fitting module
//!
//! This module contains algorithms for tracing paths, fitting curves,
//! and the main trace-low vectorization algorithm.

pub mod fit;
pub mod path_utils;
pub mod trace;
pub mod trace_low;

// Re-export commonly used types
pub use fit::{fit_beziers, CubicBezier, FitConfig};
pub use path_utils::*;
pub use trace::{trace_polylines, Point2F, Polyline, TraceConfig};
pub use trace_low::{
    vectorize_trace_low, vectorize_trace_low_with_gradients, EnhancedSvgResult, TraceBackend,
    TraceLowConfig,
};
