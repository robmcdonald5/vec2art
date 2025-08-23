//! Modular centerline extraction algorithms
//!
//! This module provides a trait-based architecture for centerline extraction,
//! allowing different algorithms to be composed and compared easily.

pub mod thresholding;
pub mod thinning;
pub mod distance_transform;
pub mod distance_transform_centerline;
pub mod extraction;
pub mod simplification;
pub mod preprocessing;

use crate::algorithms::{Point, SvgPath};
use crate::error::VectorizeError;
use crate::TraceLowConfig;
use image::{GrayImage, ImageBuffer, Rgba};

/// Main trait for complete centerline extraction algorithms
pub trait CenterlineAlgorithm {
    /// Extract centerlines from an RGBA image
    fn extract_centerlines(
        &self,
        image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
        config: &TraceLowConfig,
    ) -> Result<Vec<SvgPath>, VectorizeError>;
    
    /// Get algorithm name for logging/debugging
    fn name(&self) -> &'static str;
    
    /// Get expected performance characteristics
    fn performance_profile(&self) -> PerformanceProfile;
}

/// Performance characteristics of an algorithm
#[derive(Debug, Clone)]
pub struct PerformanceProfile {
    pub complexity: Complexity,
    pub memory_usage: MemoryUsage,
    pub parallelizable: bool,
    pub simd_optimized: bool,
}

#[derive(Debug, Clone)]
pub enum Complexity {
    Linear,          // O(n)
    LogLinear,       // O(n log n) 
    Quadratic,       // O(n²)
    Variable,        // Depends on image content
}

#[derive(Debug, Clone)]
pub enum MemoryUsage {
    Low,             // ~1x image size
    Medium,          // ~2-4x image size
    High,            // >4x image size
}

/// Trait for binarization/thresholding algorithms
pub trait ThresholdingStrategy {
    fn threshold(&self, gray: &GrayImage, config: &TraceLowConfig) -> Result<GrayImage, VectorizeError>;
    fn name(&self) -> &'static str;
}

/// Trait for thinning/skeletonization algorithms  
pub trait ThinningStrategy {
    fn thin(&self, binary: &GrayImage) -> Result<GrayImage, VectorizeError>;
    fn name(&self) -> &'static str;
    fn preserves_topology(&self) -> bool;
}

/// Trait for distance transform algorithms
pub trait DistanceTransformStrategy {
    fn compute_distance_transform(&self, binary: &GrayImage) -> Result<Vec<Vec<f32>>, VectorizeError>;
    fn name(&self) -> &'static str;
}

/// Trait for polyline extraction from skeletons
pub trait ExtractionStrategy {
    fn extract_polylines(&self, skeleton: &GrayImage) -> Result<Vec<Vec<Point>>, VectorizeError>;
    fn name(&self) -> &'static str;
}

/// Trait for path simplification algorithms
pub trait SimplificationStrategy {
    fn simplify_paths(
        &self, 
        paths: Vec<Vec<Point>>, 
        epsilon: f32,
        config: &TraceLowConfig
    ) -> Result<Vec<Vec<Point>>, VectorizeError>;
    fn name(&self) -> &'static str;
}

/// Trait for preprocessing (noise reduction, morphology)
pub trait PreprocessingStrategy {
    fn preprocess(&self, binary: &GrayImage, config: &TraceLowConfig) -> Result<GrayImage, VectorizeError>;
    fn name(&self) -> &'static str;
}

/// Composite centerline algorithm that uses strategy pattern
pub struct CompositeCenterlineAlgorithm {
    pub thresholding: Box<dyn ThresholdingStrategy + Send + Sync>,
    pub preprocessing: Box<dyn PreprocessingStrategy + Send + Sync>,
    pub thinning: Box<dyn ThinningStrategy + Send + Sync>,
    pub extraction: Box<dyn ExtractionStrategy + Send + Sync>,
    pub simplification: Box<dyn SimplificationStrategy + Send + Sync>,
    pub distance_transform: Option<Box<dyn DistanceTransformStrategy + Send + Sync>>,
    pub name: String,
}

impl CompositeCenterlineAlgorithm {
    pub fn new(name: impl Into<String>) -> Self {
        Self {
            thresholding: Box::new(thresholding::SauvolaThresholding::default()),
            preprocessing: Box::new(preprocessing::MorphologicalPreprocessing::default()),
            thinning: Box::new(thinning::GuoHallThinning::default()),
            extraction: Box::new(extraction::JunctionAwareExtraction::default()),
            simplification: Box::new(simplification::AdaptiveSimplification::default()),
            distance_transform: None,
            name: name.into(),
        }
    }
    
    /// Create a high-performance variant optimized for speed
    pub fn high_performance() -> Self {
        let mut algo = Self::new("HighPerformance");
        algo.thresholding = Box::new(thresholding::BradleyRothThresholding::default());
        algo.thinning = Box::new(thinning::DistanceTransformThinning::default());
        algo.distance_transform = Some(Box::new(distance_transform::FelzenszwalbHuttenlocher::default()));
        algo
    }
    
    /// Create a high-quality variant optimized for quality
    pub fn high_quality() -> Self {
        let mut algo = Self::new("HighQuality");
        algo.preprocessing = Box::new(preprocessing::AdvancedPreprocessing::default());
        algo.simplification = Box::new(simplification::CurvatureAwareSimplification::default());
        algo
    }
}

impl CenterlineAlgorithm for CompositeCenterlineAlgorithm {
    fn extract_centerlines(
        &self,
        image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
        config: &TraceLowConfig,
    ) -> Result<Vec<SvgPath>, VectorizeError> {
        log::info!("Starting {} centerline extraction", self.name);
        let start_time = crate::utils::Instant::now();
        
        // Phase 1: Convert to grayscale
        let gray = rgba_to_gray(image);
        
        // Phase 2: Apply thresholding strategy
        let binary = self.thresholding.threshold(&gray, config)?;
        
        // Phase 3: Preprocessing (noise reduction, morphology)  
        let processed = self.preprocessing.preprocess(&binary, config)?;
        
        // Phase 4: Thinning/skeletonization
        let skeleton = self.thinning.thin(&processed)?;
        
        // Phase 5: Extract polylines
        let polylines = self.extraction.extract_polylines(&skeleton)?;
        
        // Phase 6: Simplification
        let epsilon = calculate_epsilon(image, config);
        let simplified = self.simplification.simplify_paths(polylines, epsilon, config)?;
        
        // Phase 7: Convert to SVG paths
        let svg_paths = polylines_to_svg_paths(simplified, image, config)?;
        
        let elapsed = start_time.elapsed();
        log::info!("{} centerline extraction completed in {:.1}ms", self.name, elapsed.as_secs_f64() * 1000.0);
        
        Ok(svg_paths)
    }
    
    fn name(&self) -> &'static str {
        // We need to return a static str, so let's use a match or return a default
        "CompositeCenterlineAlgorithm"
    }
    
    fn performance_profile(&self) -> PerformanceProfile {
        PerformanceProfile {
            complexity: if self.distance_transform.is_some() { 
                Complexity::Linear 
            } else { 
                Complexity::Variable 
            },
            memory_usage: MemoryUsage::Medium,
            parallelizable: true,
            simd_optimized: false, // Will be true after SIMD implementation
        }
    }
}

// Re-export the new distance transform algorithm
pub use distance_transform_centerline::DistanceTransformCenterlineAlgorithm;

// Helper functions that will be implemented
fn rgba_to_gray(image: &ImageBuffer<Rgba<u8>, Vec<u8>>) -> GrayImage {
    // Implementation will be moved from trace_low.rs
    todo!("Move implementation from trace_low.rs")
}

fn calculate_epsilon(image: &ImageBuffer<Rgba<u8>, Vec<u8>>, config: &TraceLowConfig) -> f32 {
    // Implementation will be moved from trace_low.rs
    todo!("Move implementation from trace_low.rs") 
}

fn polylines_to_svg_paths(
    polylines: Vec<Vec<Point>>, 
    image: &ImageBuffer<Rgba<u8>, Vec<u8>>, 
    config: &TraceLowConfig
) -> Result<Vec<SvgPath>, VectorizeError> {
    // Implementation will be moved from trace_low.rs
    todo!("Move implementation from trace_low.rs")
}