use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use log::info;
use web_sys::js_sys;
use std::sync::Arc;

pub mod error;
pub mod algorithms;
pub mod image_utils;
pub mod svg_builder;
pub mod utils;
pub mod performance;
pub mod zero_copy;
pub mod benchmarks;


// Optional: Use smaller allocator in production
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// Initialize panic hook for better error messages in browser console
#[wasm_bindgen(start)]
pub fn init() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
    
    console_log::init_with_level(log::Level::Debug).expect("Failed to initialize logger");
    
    // Initialize performance capabilities
    let capabilities = performance::initialize_capabilities();
    info!("Capabilities: threads={}, parallel={}, gpu={}", 
          capabilities.logical_processors,
          capabilities.can_use_parallel_processing(),
          capabilities.can_use_gpu_acceleration());
    
    // Initialize thread pool if parallel processing is available
    if let Err(e) = performance::init_thread_pool() {
        info!("Thread pool initialization failed: {:?}", e);
    }
    
    // Initialize GPU acceleration asynchronously (fire and forget)
    // Note: This spawns a background task since we can't await in the sync init function
    wasm_bindgen_futures::spawn_local(async {
        if let Err(e) = performance::gpu_acceleration::initialize_gpu().await {
            info!("GPU initialization failed: {:?}", e);
        }
    });
    
    info!("Vec2Art WASM module initialized");
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "algorithm")]
pub enum ConversionParameters {
    EdgeDetector {
        method: EdgeMethod,
        threshold_low: f32,
        threshold_high: f32,
        gaussian_sigma: f32,
        simplification: f32,
        min_path_length: u32,
    },
    PathTracer {
        threshold: f32,
        num_colors: u8,
        curve_smoothing: f32,
        suppress_speckles: f32,
        corner_threshold: f32,
        optimize_curves: bool,
    },
    GeometricFitter {
        shape_types: Vec<ShapeType>,
        max_shapes: u32,
        population_size: u32,
        generations: u32,
        mutation_rate: f32,
        target_fitness: f32,
    },
    #[cfg(feature = "vtracer-support")]
    VTracer {
        color_mode: String,
        color_precision: i32,
        layer_difference: i32,
        corner_threshold: f64,
        length_threshold: f64,
        max_iterations: i32,
        splice_threshold: f64,
        filter_speckle: u32,
        path_precision: u32,
    },
    Hybrid {
        // Automatic algorithm selection
        preprocessing: PreprocessingOptions,
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PreprocessingOptions {
    pub denoise: bool,
    pub noise_sigma: f32,
    pub color_quantization: bool,
    pub num_colors: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EdgeMethod {
    Canny,
    Sobel,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ShapeType {
    Circle,
    Rectangle,
    Triangle,
    Ellipse,
}

impl Default for ConversionParameters {
    fn default() -> Self {
        ConversionParameters::EdgeDetector {
            method: EdgeMethod::Canny,
            threshold_low: 50.0,
            threshold_high: 150.0,
            gaussian_sigma: 1.0,
            simplification: 2.0,
            min_path_length: 10,
        }
    }
}

/// Native conversion function for tests and examples
pub fn convert_native(image_bytes: &[u8], params_json: &str) -> Result<String, Box<dyn std::error::Error>> {
    info!("Starting image conversion with {} bytes", image_bytes.len());
    
    // Parse parameters
    let params: ConversionParameters = serde_json::from_str(params_json)?;
    
    // Load and validate image
    let image = image_utils::load_image(image_bytes)?;
    
    info!("Image loaded: {}x{}", image.width(), image.height());
    
    // Convert based on algorithm
    let svg = match params {
        ConversionParameters::EdgeDetector { .. } => {
            algorithms::edge_detector::convert(image, params)?
        },
        ConversionParameters::PathTracer { .. } => {
            algorithms::path_tracer::convert(image, params)?
        },
        ConversionParameters::GeometricFitter { .. } => {
            algorithms::geometric_fitter::convert(image, params)?
        },
        #[cfg(feature = "vtracer-support")]
        ConversionParameters::VTracer { .. } => {
            algorithms::vtracer_wrapper::VTracerWrapper::convert(image, params)?
        },
        ConversionParameters::Hybrid { .. } => {
            // Automatic algorithm selection
            select_and_convert(image, params)?
        },
    };
    
    info!("Conversion complete, SVG size: {} chars", svg.len());
    Ok(svg)
}

/// Main conversion function exposed to JavaScript
#[wasm_bindgen]
pub fn convert(image_bytes: &[u8], params_json: &str) -> Result<String, JsValue> {
    convert_native(image_bytes, params_json)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Automatic algorithm selection based on image analysis
fn select_and_convert(image: image::DynamicImage, params: ConversionParameters) -> error::Result<String> {
    use algorithms::vtracer_wrapper::HybridVectorizer;
    
    let analysis = HybridVectorizer::analyze_image(&image);
    let recommended = HybridVectorizer::select_algorithm(&analysis);
    
    info!("Image analysis: {:?}", analysis);
    info!("Recommended algorithm: {}", recommended);
    
    // Convert to appropriate parameters and process
    match recommended {
        algorithms::vtracer_wrapper::RecommendedAlgorithm::PathTracer => {
            let params = ConversionParameters::PathTracer {
                threshold: 0.5,
                num_colors: if analysis.color_count > 16 { 16 } else { analysis.color_count as u8 },
                curve_smoothing: 0.5,
                suppress_speckles: 0.1,
                corner_threshold: 60.0,
                optimize_curves: true,
            };
            algorithms::path_tracer::convert(image, params)
        },
        algorithms::vtracer_wrapper::RecommendedAlgorithm::EdgeDetector => {
            let params = ConversionParameters::EdgeDetector {
                method: EdgeMethod::Canny,
                threshold_low: 50.0,
                threshold_high: 150.0,
                gaussian_sigma: 1.0,
                simplification: 2.0,
                min_path_length: 10,
            };
            algorithms::edge_detector::convert(image, params)
        },
        _ => {
            // Default to path tracer
            let params = ConversionParameters::PathTracer {
                threshold: 0.5,
                num_colors: 8,
                curve_smoothing: 0.5,
                suppress_speckles: 0.1,
                corner_threshold: 60.0,
                optimize_curves: true,
            };
            algorithms::path_tracer::convert(image, params)
        }
    }
}

/// Native function to get default parameters for a specific algorithm
pub fn get_default_params_native(algorithm: &str) -> Result<String, Box<dyn std::error::Error>> {
    let params = match algorithm {
        "edge_detector" => ConversionParameters::EdgeDetector {
            method: EdgeMethod::Canny,
            threshold_low: 50.0,
            threshold_high: 150.0,
            gaussian_sigma: 1.0,
            simplification: 2.0,
            min_path_length: 10,
        },
        "path_tracer" => ConversionParameters::PathTracer {
            threshold: 0.5,
            num_colors: 8,
            curve_smoothing: 0.5,
            suppress_speckles: 0.1,
            corner_threshold: 60.0,
            optimize_curves: true,
        },
        "geometric_fitter" => ConversionParameters::GeometricFitter {
            shape_types: vec![ShapeType::Circle, ShapeType::Rectangle, ShapeType::Triangle],
            max_shapes: 100,
            population_size: 50,
            generations: 100,
            mutation_rate: 0.05,
            target_fitness: 0.95,
        },
        _ => return Err(format!("Unknown algorithm: {}", algorithm).into()),
    };
    
    Ok(serde_json::to_string(&params)?)
}

/// Get default parameters for a specific algorithm
#[wasm_bindgen]
pub fn get_default_params(algorithm: &str) -> Result<String, JsValue> {
    get_default_params_native(algorithm)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Get version information
#[wasm_bindgen]
pub fn get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Native function to validate image before processing
pub fn validate_image_native(image_bytes: &[u8]) -> Result<String, Box<dyn std::error::Error>> {
    let image = image_utils::load_image(image_bytes)?;
    
    let info = serde_json::json!({
        "width": image.width(),
        "height": image.height(),
        "pixels": image.width() * image.height(),
        "valid": true
    });
    
    Ok(info.to_string())
}

/// Validate image before processing
#[wasm_bindgen]
pub fn validate_image(image_bytes: &[u8]) -> Result<String, JsValue> {
    validate_image_native(image_bytes)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Get system performance capabilities
#[wasm_bindgen]
pub fn get_capabilities() -> String {
    let caps = performance::get_capabilities();
    let gpu_available = performance::gpu_acceleration::is_gpu_available();
    
    serde_json::json!({
        "webWorkersAvailable": caps.web_workers_available,
        "sharedArrayBufferAvailable": caps.shared_array_buffer_available,
        "webgpuAvailable": caps.webgpu_available,
        "gpuAcceleratorInitialized": gpu_available,
        "logicalProcessors": caps.logical_processors,
        "memoryLimitMB": caps.memory_limit_mb,
        "simdAvailable": caps.simd_available,
        "canUseParallelProcessing": caps.can_use_parallel_processing(),
        "canUseGpuAcceleration": caps.can_use_gpu_acceleration(),
        "recommendedThreadCount": caps.recommended_thread_count()
    }).to_string()
}