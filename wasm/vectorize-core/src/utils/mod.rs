//! Utility modules for core vectorization algorithms

pub mod wasm_time;

// Re-export commonly used time types for convenience
pub use wasm_time::{measure_and_log, measure_time, Instant, Timer};
