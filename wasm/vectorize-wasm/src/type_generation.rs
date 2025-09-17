//! Module to trigger TypeScript generation from ts-rs annotated types
//!
//! This module exists solely to trigger the TypeScript generation
//! process when running `cargo test --features generate-ts`.

#[cfg(test)]
mod tests {
    #[cfg(feature = "generate-ts")]
    use ts_rs::TS;
    use vectorize_core::algorithms::tracing::trace_low::{
        BackgroundRemovalAlgorithm, SuperpixelInitPattern, TraceBackend, TraceLowConfig,
    };
    use vectorize_core::algorithms::visual::color_processing::ColorSamplingMethod;

    #[test]
    #[cfg(feature = "generate-ts")]
    fn generate_typescript_types() {
        // Export TypeScript types to the configured directory
        TraceLowConfig::export().expect("Failed to export TraceLowConfig");
        TraceBackend::export().expect("Failed to export TraceBackend");
        BackgroundRemovalAlgorithm::export().expect("Failed to export BackgroundRemovalAlgorithm");
        SuperpixelInitPattern::export().expect("Failed to export SuperpixelInitPattern");
        ColorSamplingMethod::export().expect("Failed to export ColorSamplingMethod");

        println!("TypeScript generation completed successfully");
    }

    #[test]
    #[cfg(not(feature = "generate-ts"))]
    fn generate_typescript_types() {
        println!("TypeScript generation skipped (generate-ts feature not enabled)");
    }
}