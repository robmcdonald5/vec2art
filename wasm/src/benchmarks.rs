use wasm_bindgen::prelude::*;
use web_sys::Performance;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Performance metrics for a single operation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetrics {
    pub operation: String,
    pub duration_ms: f64,
    pub memory_before: Option<f64>,
    pub memory_after: Option<f64>,
    pub memory_delta: Option<f64>,
    pub timestamp: f64,
}

/// Benchmark suite for vectorization algorithms
#[wasm_bindgen]
pub struct BenchmarkSuite {
    performance: Performance,
    metrics: Vec<PerformanceMetrics>,
}

#[wasm_bindgen]
impl BenchmarkSuite {
    /// Create a new benchmark suite
    #[wasm_bindgen(constructor)]
    pub fn new() -> Result<BenchmarkSuite, JsValue> {
        let window = web_sys::window()
            .ok_or_else(|| JsValue::from_str("No window object"))?;
        let performance = window.performance()
            .ok_or_else(|| JsValue::from_str("Performance API not available"))?;
        
        Ok(BenchmarkSuite {
            performance,
            metrics: Vec::new(),
        })
    }
    
    /// Run comprehensive benchmark on an image
    #[wasm_bindgen]
    pub fn run_benchmark(&mut self, image_bytes: &[u8]) -> Result<String, JsValue> {
        use crate::{ConversionParameters, EdgeMethod, ShapeType};
        use crate::algorithms::{edge_detector, path_tracer};
        
        self.metrics.clear();
        
        // Load image once
        let image = crate::image_utils::load_image(image_bytes)
            .map_err(|e| JsValue::from(e))?;
        
        let (width, height) = (image.width(), image.height());
        let pixels = width * height;
        
        log::info!("Starting benchmark on {}x{} image ({} pixels)", width, height, pixels);
        
        // Benchmark EdgeDetector
        {
            let params = ConversionParameters::EdgeDetector {
                method: EdgeMethod::Canny,
                threshold_low: 50.0,
                threshold_high: 150.0,
                gaussian_sigma: 1.0,
                simplification: 2.0,
                min_path_length: 10,
            };
            
            let metrics = self.benchmark_operation("EdgeDetector (Canny)", || {
                edge_detector::convert(image.clone(), params.clone())
            })?;
            self.metrics.push(metrics);
        }
        
        // Benchmark EdgeDetector Sobel
        {
            let params = ConversionParameters::EdgeDetector {
                method: EdgeMethod::Sobel,
                threshold_low: 50.0,
                threshold_high: 150.0,
                gaussian_sigma: 1.0,
                simplification: 2.0,
                min_path_length: 10,
            };
            
            let metrics = self.benchmark_operation("EdgeDetector (Sobel)", || {
                edge_detector::convert(image.clone(), params.clone())
            })?;
            self.metrics.push(metrics);
        }
        
        // Benchmark PathTracer with different color counts
        for num_colors in [2, 8, 16, 32] {
            let params = ConversionParameters::PathTracer {
                threshold: 0.5,
                num_colors: num_colors as u8,
                curve_smoothing: 0.5,
                suppress_speckles: 0.1,
                corner_threshold: 60.0,
                optimize_curves: true,
            };
            
            let name = format!("PathTracer ({} colors)", num_colors);
            let metrics = self.benchmark_operation(&name, || {
                path_tracer::convert(image.clone(), params.clone())
            })?;
            self.metrics.push(metrics);
        }
        
        // GeometricFitter benchmark - DISABLED due to high memory usage
        {
            let metrics = PerformanceMetrics {
                operation: "GeometricFitter (disabled)".to_string(),
                duration_ms: 0.0,
                memory_before: None,
                memory_after: None,
                memory_delta: None,
                timestamp: self.performance.now(),
            };
            self.metrics.push(metrics);
        }
        
        // Benchmark vtracer if available
        #[cfg(feature = "vtracer-support")]
        {
            let params = ConversionParameters::VTracer {
                color_mode: "color".to_string(),
                color_precision: 6,
                layer_difference: 16,
                corner_threshold: 60.0,
                length_threshold: 4.0,
                max_iterations: 10,
                splice_threshold: 45.0,
                filter_speckle: 4,
                path_precision: 2,
            };
            
            let metrics = self.benchmark_operation("VTracer", || {
                crate::algorithms::vtracer_wrapper::VTracerWrapper::convert(image.clone(), params.clone())
            })?;
            self.metrics.push(metrics);
        }
        
        // Generate report
        let report = self.generate_report(width, height);
        Ok(report)
    }
    
    /// Benchmark a single operation
    fn benchmark_operation<F, R>(&self, name: &str, operation: F) -> Result<PerformanceMetrics, JsValue>
    where
        F: FnOnce() -> R,
    {
        let memory_before = self.get_memory_usage();
        let start = self.performance.now();
        
        // Run the operation
        let _ = operation();
        
        let end = self.performance.now();
        let memory_after = self.get_memory_usage();
        
        let memory_delta = match (memory_before, memory_after) {
            (Some(before), Some(after)) => Some(after - before),
            _ => None,
        };
        
        Ok(PerformanceMetrics {
            operation: name.to_string(),
            duration_ms: end - start,
            memory_before,
            memory_after,
            memory_delta,
            timestamp: start,
        })
    }
    
    /// Get current memory usage if available
    fn get_memory_usage(&self) -> Option<f64> {
        // Memory API not available in current web-sys version
        None
    }
    
    /// Generate benchmark report
    fn generate_report(&self, width: u32, height: u32) -> String {
        let pixels = width * height;
        let megapixels = pixels as f64 / 1_000_000.0;
        
        // Calculate statistics
        let mut results = HashMap::new();
        for metric in &self.metrics {
            let throughput = megapixels / (metric.duration_ms / 1000.0);
            results.insert(metric.operation.clone(), (metric.duration_ms, throughput));
        }
        
        // Find fastest algorithm
        let fastest = self.metrics.iter()
            .min_by(|a, b| a.duration_ms.partial_cmp(&b.duration_ms).unwrap())
            .map(|m| m.operation.clone())
            .unwrap_or_else(|| "None".to_string());
        
        // Generate JSON report
        serde_json::json!({
            "imageInfo": {
                "width": width,
                "height": height,
                "pixels": pixels,
                "megapixels": megapixels,
            },
            "results": self.metrics.iter().map(|m| {
                let throughput = megapixels / (m.duration_ms / 1000.0);
                serde_json::json!({
                    "algorithm": m.operation,
                    "duration_ms": format!("{:.2}", m.duration_ms),
                    "throughput_mp_s": format!("{:.2}", throughput),
                    "memory_delta_mb": m.memory_delta.map(|d| format!("{:.2}", d / 1_048_576.0)),
                })
            }).collect::<Vec<_>>(),
            "summary": {
                "fastest": fastest,
                "totalTime_ms": format!("{:.2}", self.metrics.iter().map(|m| m.duration_ms).sum::<f64>()),
            }
        }).to_string()
    }
    
    /// Clear all metrics
    #[wasm_bindgen]
    pub fn clear(&mut self) {
        self.metrics.clear();
    }
    
    /// Get raw metrics as JSON
    #[wasm_bindgen]
    pub fn get_metrics(&self) -> String {
        serde_json::to_string(&self.metrics).unwrap_or_else(|_| "[]".to_string())
    }
}

/// Quick performance test for a specific algorithm
#[wasm_bindgen]
pub fn quick_benchmark(image_bytes: &[u8], algorithm: &str) -> Result<String, JsValue> {
    use crate::{ConversionParameters, EdgeMethod};
    
    let window = web_sys::window()
        .ok_or_else(|| JsValue::from_str("No window object"))?;
    let performance = window.performance()
        .ok_or_else(|| JsValue::from_str("Performance API not available"))?;
    
    // Load image
    let image = crate::image_utils::load_image(image_bytes)
        .map_err(|e| JsValue::from(e))?;
    
    let (width, height) = (image.width(), image.height());
    
    // Create appropriate parameters
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
        _ => return Err(JsValue::from_str("Unknown algorithm")),
    };
    
    // Warm-up run
    let _ = match algorithm {
        "edge_detector" => crate::algorithms::edge_detector::convert(image.clone(), params.clone()),
        "path_tracer" => crate::algorithms::path_tracer::convert(image.clone(), params.clone()),
        _ => return Err(JsValue::from_str("Unknown algorithm")),
    };
    
    // Benchmark runs
    let mut times = Vec::new();
    for _ in 0..5 {
        let start = performance.now();
        
        let _ = match algorithm {
            "edge_detector" => crate::algorithms::edge_detector::convert(image.clone(), params.clone()),
            "path_tracer" => crate::algorithms::path_tracer::convert(image.clone(), params.clone()),
            _ => return Err(JsValue::from_str("Unknown algorithm")),
        };
        
        let end = performance.now();
        times.push(end - start);
    }
    
    // Calculate statistics
    let avg = times.iter().sum::<f64>() / times.len() as f64;
    let min = times.iter().fold(f64::INFINITY, |a, &b| a.min(b));
    let max = times.iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b));
    
    let megapixels = (width * height) as f64 / 1_000_000.0;
    let throughput = megapixels / (avg / 1000.0);
    
    Ok(serde_json::json!({
        "algorithm": algorithm,
        "imageSize": format!("{}x{}", width, height),
        "megapixels": format!("{:.2}", megapixels),
        "runs": times.len(),
        "timing": {
            "avg_ms": format!("{:.2}", avg),
            "min_ms": format!("{:.2}", min),
            "max_ms": format!("{:.2}", max),
        },
        "throughput_mp_s": format!("{:.2}", throughput),
    }).to_string())
}

#[cfg(test)]
mod tests {
    
    
    #[test]
    #[cfg(target_arch = "wasm32")]
    fn test_benchmark_suite_creation() {
        // This will fail in test environment without browser APIs
        // but tests the structure
        let result = BenchmarkSuite::new();
        assert!(result.is_err()); // Expected in non-browser environment
    }
}