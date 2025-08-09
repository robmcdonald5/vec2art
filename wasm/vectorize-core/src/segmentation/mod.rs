//! Advanced segmentation algorithms

pub mod rag;
pub mod adaptive_quantization;

// Re-export main types
pub use rag::{
    RegionAdjacencyGraph,
    RegionProperties,
    delta_e_predicate,
    gradient_aware_predicate,
};

pub use adaptive_quantization::{
    AdaptiveQuantizationConfig,
    QuantizationResult,
    adaptive_kmeans_quantization,
    apply_adaptive_quantization,
};