use wasm_bindgen::prelude::*;
use js_sys;
use std::sync::Arc;
use std::cell::RefCell;

/// Zero-copy vectorization engine with optimized memory handling
#[wasm_bindgen]
pub struct VectorizationEngine {
    shared_memory: Option<Arc<js_sys::ArrayBuffer>>,
    image_buffer: RefCell<Option<Vec<u8>>>,
    width: u32,
    height: u32,
}

#[wasm_bindgen]
impl VectorizationEngine {
    /// Create a new vectorization engine
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        VectorizationEngine {
            shared_memory: None,
            image_buffer: RefCell::new(None),
            width: 0,
            height: 0,
        }
    }
    
    /// Set shared memory buffer for zero-copy operations
    #[wasm_bindgen]
    pub fn set_shared_memory(&mut self, buffer: js_sys::ArrayBuffer) {
        let byte_length = buffer.byte_length();
        self.shared_memory = Some(Arc::new(buffer));
        log::info!("ArrayBuffer set with {} bytes", byte_length);
    }
    
    /// Check if shared memory is available
    #[wasm_bindgen]
    pub fn has_shared_memory(&self) -> bool {
        self.shared_memory.is_some()
    }
    
    /// Load image from shared memory or regular array
    #[wasm_bindgen]
    pub fn load_image(&mut self, width: u32, height: u32, offset: usize, length: usize) -> Result<(), JsValue> {
        self.width = width;
        self.height = height;
        
        if let Some(ref shared_buffer) = self.shared_memory {
            // Zero-copy: create a view into shared memory
            let array = js_sys::Uint8Array::new_with_byte_offset_and_length(
                shared_buffer.as_ref(),
                offset as u32,
                length as u32,
            );
            
            // Copy to internal buffer for processing
            // Note: In a true zero-copy implementation, we'd work directly with the view
            let mut buffer = vec![0u8; length];
            array.copy_to(&mut buffer);
            
            *self.image_buffer.borrow_mut() = Some(buffer);
            
            log::info!("Image loaded from ArrayBuffer: {}x{}", width, height);
            Ok(())
        } else {
            Err(JsValue::from_str("ArrayBuffer not initialized"))
        }
    }
    
    /// Load image from regular Uint8Array (fallback)
    #[wasm_bindgen]
    pub fn load_image_fallback(&mut self, data: &[u8], width: u32, height: u32) -> Result<(), JsValue> {
        self.width = width;
        self.height = height;
        *self.image_buffer.borrow_mut() = Some(data.to_vec());
        
        log::info!("Image loaded via fallback: {}x{}", width, height);
        Ok(())
    }
    
    /// Convert with progress callback
    #[wasm_bindgen]
    pub fn convert_with_progress(
        &self,
        params_json: &str,
        progress_callback: &js_sys::Function,
    ) -> Result<String, JsValue> {
        use crate::{ConversionParameters, image_utils};
        
        // Parse parameters
        let params: ConversionParameters = serde_json::from_str(params_json)
            .map_err(|e| JsValue::from_str(&format!("Invalid parameters: {}", e)))?;
        
        // Get image buffer
        let image_buffer = self.image_buffer.borrow();
        let buffer = image_buffer.as_ref()
            .ok_or_else(|| JsValue::from_str("No image loaded"))?;
        
        // Report progress: Loading
        let _ = progress_callback.call1(&JsValue::NULL, &JsValue::from_f64(0.1));
        
        // Load image
        let image = image_utils::load_image(buffer)
            .map_err(|e| JsValue::from(e))?;
        
        // Report progress: Pre-processing
        let _ = progress_callback.call1(&JsValue::NULL, &JsValue::from_f64(0.3));
        
        // Convert based on algorithm with progress reporting
        let svg = match params {
            ConversionParameters::EdgeDetector { .. } => {
                let _ = progress_callback.call1(&JsValue::NULL, &JsValue::from_f64(0.5));
                let result = crate::algorithms::edge_detector::convert(image, params)?;
                let _ = progress_callback.call1(&JsValue::NULL, &JsValue::from_f64(0.9));
                result
            },
            ConversionParameters::PathTracer { .. } => {
                let _ = progress_callback.call1(&JsValue::NULL, &JsValue::from_f64(0.5));
                let result = crate::algorithms::path_tracer::convert(image, params)?;
                let _ = progress_callback.call1(&JsValue::NULL, &JsValue::from_f64(0.9));
                result
            },
            ConversionParameters::GeometricFitter { .. } => {
                // Genetic algorithm progress is harder to predict
                let result = crate::algorithms::geometric_fitter::convert(image, params)?;
                let _ = progress_callback.call1(&JsValue::NULL, &JsValue::from_f64(0.9));
                result
            },
            #[cfg(feature = "vtracer-support")]
            ConversionParameters::VTracer { .. } => {
                let _ = progress_callback.call1(&JsValue::NULL, &JsValue::from_f64(0.5));
                let result = crate::algorithms::vtracer_wrapper::VTracerWrapper::convert(image, params)?;
                let _ = progress_callback.call1(&JsValue::NULL, &JsValue::from_f64(0.9));
                result
            },
            ConversionParameters::Hybrid { .. } => {
                let _ = progress_callback.call1(&JsValue::NULL, &JsValue::from_f64(0.4));
                let result = crate::select_and_convert(image, params)?;
                let _ = progress_callback.call1(&JsValue::NULL, &JsValue::from_f64(0.9));
                result
            },
            #[cfg(feature = "potrace")]
            ConversionParameters::Potrace { .. } => {
                let _ = progress_callback.call1(&JsValue::NULL, &JsValue::from_f64(0.5));
                #[cfg(any(feature = "potrace", feature = "autotrace"))]
                {
                    let external = crate::external::ExternalAlgorithms::new();
                    let paths = external.convert_with_potrace(image, params)?;
                    let result = crate::svg_builder::generate_svg_from_paths(&paths, image.width(), image.height());
                    let _ = progress_callback.call1(&JsValue::NULL, &JsValue::from_f64(0.9));
                    result
                }
                #[cfg(not(any(feature = "potrace", feature = "autotrace")))]
                {
                    return Err(JsValue::from_str("Potrace support not compiled"));
                }
            },
            #[cfg(feature = "autotrace")]
            ConversionParameters::AutotraceOutline { .. } => {
                let _ = progress_callback.call1(&JsValue::NULL, &JsValue::from_f64(0.5));
                #[cfg(any(feature = "potrace", feature = "autotrace"))]
                {
                    let external = crate::external::ExternalAlgorithms::new();
                    let paths = external.convert_with_autotrace_outline(image, params)?;
                    let result = crate::svg_builder::generate_svg_from_paths(&paths, image.width(), image.height());
                    let _ = progress_callback.call1(&JsValue::NULL, &JsValue::from_f64(0.9));
                    result
                }
                #[cfg(not(any(feature = "potrace", feature = "autotrace")))]
                {
                    return Err(JsValue::from_str("Autotrace support not compiled"));
                }
            },
            #[cfg(feature = "autotrace")]
            ConversionParameters::AutotraceCenterline { .. } => {
                let _ = progress_callback.call1(&JsValue::NULL, &JsValue::from_f64(0.5));
                #[cfg(any(feature = "potrace", feature = "autotrace"))]
                {
                    let external = crate::external::ExternalAlgorithms::new();
                    let paths = external.convert_with_autotrace_centerline(image, params)?;
                    let result = crate::svg_builder::generate_svg_from_paths(&paths, image.width(), image.height());
                    let _ = progress_callback.call1(&JsValue::NULL, &JsValue::from_f64(0.9));
                    result
                }
                #[cfg(not(any(feature = "potrace", feature = "autotrace")))]
                {
                    return Err(JsValue::from_str("Autotrace support not compiled"));
                }
            },
        };
        
        // Report completion
        let _ = progress_callback.call1(&JsValue::NULL, &JsValue::from_f64(1.0));
        
        Ok(svg)
    }
    
    /// Get image analysis for algorithm recommendation
    #[wasm_bindgen]
    pub fn analyze_image(&self) -> Result<String, JsValue> {
        use crate::algorithms::vtracer_wrapper::HybridVectorizer;
        
        let image_buffer = self.image_buffer.borrow();
        let buffer = image_buffer.as_ref()
            .ok_or_else(|| JsValue::from_str("No image loaded"))?;
        
        let image = crate::image_utils::load_image(buffer)
            .map_err(|e| JsValue::from(e))?;
        
        let analysis = HybridVectorizer::analyze_image(&image);
        let recommended = HybridVectorizer::select_algorithm(&analysis);
        
        let result = serde_json::json!({
            "width": analysis.width,
            "height": analysis.height,
            "pixels": analysis.pixels,
            "colorCount": analysis.color_count,
            "isBilevel": analysis.is_bilevel,
            "isGrayscale": analysis.is_grayscale,
            "edgeDensity": analysis.edge_density,
            "hasThinLines": analysis.has_thin_lines,
            "hasSolidRegions": analysis.has_solid_regions,
            "isPhotographic": analysis.is_photographic,
            "recommendedAlgorithm": format!("{:?}", recommended),
        });
        
        Ok(result.to_string())
    }
    
    /// Clear internal buffers
    #[wasm_bindgen]
    pub fn clear(&mut self) {
        *self.image_buffer.borrow_mut() = None;
        self.width = 0;
        self.height = 0;
        log::info!("Engine buffers cleared");
    }
}

/// Initialize Web Workers for parallel processing
#[wasm_bindgen]
pub async fn init_workers(_count: usize) -> Result<(), JsValue> {
    #[cfg(feature = "parallel")]
    {
        use wasm_bindgen_rayon::init_thread_pool;
        init_thread_pool(_count);
        log::info!("Initialized {} worker threads", _count);
        Ok(())
    }
    
    #[cfg(not(feature = "parallel"))]
    {
        log::warn!("Parallel processing not enabled in build");
        Err(JsValue::from_str("Parallel processing not enabled"))
    }
}

/// Check if SIMD is supported
#[wasm_bindgen]
pub fn check_simd_support() -> bool {
    // Check for SIMD support at runtime
    // This would need actual feature detection in production
    cfg!(target_feature = "simd128")
}

/// Memory usage statistics
#[wasm_bindgen]
pub fn get_memory_stats() -> String {
    // Memory API not available in current web-sys version
    // This would require the experimental Memory API
    serde_json::json!({
        "error": "Memory API not available in current build",
        "note": "Enable experimental features for memory statistics"
    }).to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_engine_creation() {
        let engine = VectorizationEngine::new();
        assert!(!engine.has_shared_memory());
    }
}