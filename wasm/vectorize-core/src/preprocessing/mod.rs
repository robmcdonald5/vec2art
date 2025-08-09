//! Enhanced preprocessing module for image filtering and preparation

pub mod denoise;

#[cfg(test)]
mod denoise_tests;

// Re-export main functions
pub use denoise::{guided_filter, bilateral_filter_enhanced};

// Include old preprocessing functions directly
mod old;
pub use old::*;