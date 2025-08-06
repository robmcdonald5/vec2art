use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use log::info;

pub mod error;
pub mod algorithms;
pub mod image_utils;
pub mod svg_builder;
pub mod utils;


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
    }
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

/// Main conversion function exposed to JavaScript
#[wasm_bindgen]
pub fn convert(image_bytes: &[u8], params_json: &str) -> Result<String, JsValue> {
    info!("Starting image conversion with {} bytes", image_bytes.len());
    
    // Parse parameters
    let params: ConversionParameters = serde_json::from_str(params_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid parameters: {}", e)))?;
    
    // Load and validate image
    let image = image_utils::load_image(image_bytes)
        .map_err(|e| JsValue::from(e))?;
    
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
    };
    
    info!("Conversion complete, SVG size: {} chars", svg.len());
    Ok(svg)
}

/// Get default parameters for a specific algorithm
#[wasm_bindgen]
pub fn get_default_params(algorithm: &str) -> Result<String, JsValue> {
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
        _ => return Err(JsValue::from_str(&format!("Unknown algorithm: {}", algorithm))),
    };
    
    serde_json::to_string(&params)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

/// Get version information
#[wasm_bindgen]
pub fn get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Validate image before processing
#[wasm_bindgen]
pub fn validate_image(image_bytes: &[u8]) -> Result<String, JsValue> {
    let image = image_utils::load_image(image_bytes)
        .map_err(|e| JsValue::from(e))?;
    
    let info = serde_json::json!({
        "width": image.width(),
        "height": image.height(),
        "pixels": image.width() * image.height(),
        "valid": true
    });
    
    Ok(info.to_string())
}