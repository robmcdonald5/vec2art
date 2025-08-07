use log::info;
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

pub mod algorithms;
pub mod benchmarks;
pub mod error;
pub mod image_utils;
pub mod memory_monitor;
pub mod performance;
pub mod svg_builder;
pub mod utils;
pub mod zero_copy;

// External algorithm integrations (C libraries)
#[cfg(any(feature = "potrace", feature = "autotrace"))]
pub mod external;

// Optional: Use tracing allocator for debug builds
#[cfg(feature = "debug-memory")]
#[global_allocator]
static GLOBAL_ALLOCATOR: wasm_tracing_allocator::WasmTracingAllocator<std::alloc::System> =
    wasm_tracing_allocator::WasmTracingAllocator(std::alloc::System);

// Optional: Use smaller allocator in production (but not if debug-memory is enabled)
#[cfg(all(feature = "wee_alloc", not(feature = "debug-memory")))]
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
    info!(
        "Capabilities: threads={}, parallel={}, gpu={}",
        capabilities.logical_processors,
        capabilities.can_use_parallel_processing(),
        capabilities.can_use_gpu_acceleration()
    );

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

    // Initialize memory monitoring
    if let Err(e) =
        memory_monitor::init_memory_monitor_with_budget(memory_monitor::MAX_MEMORY_BUDGET_MB)
    {
        info!("Memory monitor initialization failed: {:?}", e);
    } else {
        info!(
            "Memory monitor initialized with {} MB budget",
            memory_monitor::MAX_MEMORY_BUDGET_MB
        );
    }

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
    #[cfg(feature = "potrace")]
    Potrace {
        threshold: f32,
        curve_smoothing: f32,
        corner_threshold: f32,
        optimize_curves: bool,
        turdsize: f32, // Speckle filter size
    },
    #[cfg(feature = "autotrace")]
    AutotraceOutline {
        corner_threshold: f32,
        line_threshold: f32,
        despeckle_level: f32,
        filter_iterations: u32,
    },
    #[cfg(feature = "autotrace")]
    AutotraceCenterline {
        corner_threshold: f32,
        line_threshold: f32,
        despeckle_level: f32,
        preserve_width: bool,
        filter_iterations: u32,
    },
    Hybrid {
        // Automatic algorithm selection
        preprocessing: PreprocessingOptions,
    },
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

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
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
pub fn convert_native(
    image_bytes: &[u8],
    params_json: &str,
) -> Result<String, Box<dyn std::error::Error>> {
    info!("Starting image conversion with {} bytes", image_bytes.len());

    // Parse parameters
    let params: ConversionParameters = serde_json::from_str(params_json)?;

    // Load and validate image
    let image = image_utils::load_image(image_bytes)?;

    info!("Image loaded: {}x{}", image.width(), image.height());

    // Check memory budget before processing
    let algorithm_name = match &params {
        ConversionParameters::EdgeDetector { .. } => "edge_detector",
        ConversionParameters::PathTracer { .. } => "path_tracer",
        ConversionParameters::GeometricFitter { .. } => "geometric_fitter",
        #[cfg(feature = "vtracer-support")]
        ConversionParameters::VTracer { .. } => "vtracer",
        #[cfg(feature = "potrace")]
        ConversionParameters::Potrace { .. } => "potrace",
        #[cfg(feature = "autotrace")]
        ConversionParameters::AutotraceOutline { .. } => "autotrace_outline",
        #[cfg(feature = "autotrace")]
        ConversionParameters::AutotraceCenterline { .. } => "autotrace_centerline",
        ConversionParameters::Hybrid { .. } => "hybrid",
    };

    // Estimate memory requirements and check budget
    let estimated_memory = memory_monitor::MemoryMonitor::estimate_image_memory_requirements(
        image.width(),
        image.height(),
        algorithm_name,
    );

    memory_monitor::check_memory_for_operation(
        estimated_memory,
        "image_conversion",
        algorithm_name,
    )
    .map_err(|e| Box::new(e) as Box<dyn std::error::Error>)?;

    info!(
        "Memory check passed: estimated {} MB for {}x{} image",
        estimated_memory / (1024 * 1024),
        image.width(),
        image.height()
    );

    // Apply adaptive processing based on memory situation and image size
    let adaptive_params = memory_monitor::get_adaptive_parameters();
    let size_adaptation = memory_monitor::AdaptiveParameters::should_degrade_for_size(
        image.width(),
        image.height(),
        algorithm_name,
    );

    let final_adaptive = size_adaptation.unwrap_or(adaptive_params);
    let adapted_params = memory_monitor::adapt_conversion_parameters(params, &final_adaptive);

    if !matches!(
        final_adaptive.quality,
        memory_monitor::ProcessingQuality::High
    ) {
        info!(
            "Applied adaptive processing: quality={:?}, max_colors={}, max_shapes={}",
            final_adaptive.quality, final_adaptive.max_colors, final_adaptive.max_shapes
        );
    }

    // Convert based on algorithm
    let svg = match adapted_params {
        ConversionParameters::EdgeDetector { .. } => {
            algorithms::edge_detector::convert(image, adapted_params)?
        }
        ConversionParameters::PathTracer { .. } => {
            algorithms::path_tracer::convert(image, adapted_params)?
        }
        ConversionParameters::GeometricFitter { .. } => {
            return Err("GeometricFitter is disabled pending major refactor - use EdgeDetector or PathTracer instead".into());
        }
        #[cfg(feature = "vtracer-support")]
        ConversionParameters::VTracer { .. } => {
            algorithms::vtracer_wrapper::VTracerWrapper::convert(image, adapted_params)?
        }
        #[cfg(feature = "potrace")]
        ConversionParameters::Potrace { .. } => {
            // Convert using Potrace external library
            #[cfg(any(feature = "potrace", feature = "autotrace"))]
            {
                let external = external::ExternalAlgorithms::new();
                let paths = external.convert_with_potrace(image, adapted_params)?;
                svg_builder::generate_svg_from_paths(&paths, image.width(), image.height())
            }
            #[cfg(not(any(feature = "potrace", feature = "autotrace")))]
            {
                return Err("Potrace support not compiled".into());
            }
        }
        #[cfg(feature = "autotrace")]
        ConversionParameters::AutotraceOutline { .. } => {
            #[cfg(any(feature = "potrace", feature = "autotrace"))]
            {
                let external = external::ExternalAlgorithms::new();
                let paths = external.convert_with_autotrace_outline(image, adapted_params)?;
                svg_builder::generate_svg_from_paths(&paths, image.width(), image.height())
            }
            #[cfg(not(any(feature = "potrace", feature = "autotrace")))]
            {
                return Err("Autotrace support not compiled".into());
            }
        }
        #[cfg(feature = "autotrace")]
        ConversionParameters::AutotraceCenterline { .. } => {
            #[cfg(any(feature = "potrace", feature = "autotrace"))]
            {
                let external = external::ExternalAlgorithms::new();
                let paths = external.convert_with_autotrace_centerline(image, adapted_params)?;
                svg_builder::generate_svg_from_paths(&paths, image.width(), image.height())
            }
            #[cfg(not(any(feature = "potrace", feature = "autotrace")))]
            {
                return Err("Autotrace support not compiled".into());
            }
        }
        ConversionParameters::Hybrid { .. } => {
            // Automatic algorithm selection - now includes external algorithms
            select_and_convert(image, adapted_params)?
        }
    };

    info!("Conversion complete, SVG size: {} chars", svg.len());
    Ok(svg)
}

/// Main conversion function exposed to JavaScript
#[wasm_bindgen]
pub fn convert(image_bytes: &[u8], params_json: &str) -> Result<String, JsValue> {
    convert_native(image_bytes, params_json).map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Automatic algorithm selection based on image analysis
fn select_and_convert(
    image: image::DynamicImage,
    _params: ConversionParameters,
) -> error::Result<String> {
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
                num_colors: if analysis.color_count > 16 {
                    16
                } else {
                    analysis.color_count as u8
                },
                curve_smoothing: 0.5,
                suppress_speckles: 0.1,
                corner_threshold: 60.0,
                optimize_curves: true,
            };
            algorithms::path_tracer::convert(image, params)
        }
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
        }
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
        "geometric_fitter" => return Err("GeometricFitter is disabled pending major refactor - use edge_detector or path_tracer instead".into()),
        #[cfg(feature = "potrace")]
        "potrace" => ConversionParameters::Potrace {
            threshold: 0.5,
            curve_smoothing: 0.2,
            corner_threshold: 60.0,
            optimize_curves: true,
            turdsize: 2.0, // Filter speckles smaller than 2 pixels
        },
        #[cfg(feature = "autotrace")]
        "autotrace_outline" => ConversionParameters::AutotraceOutline {
            corner_threshold: 60.0,
            line_threshold: 0.5,
            despeckle_level: 2.0,
            filter_iterations: 4,
        },
        #[cfg(feature = "autotrace")]
        "autotrace_centerline" => ConversionParameters::AutotraceCenterline {
            corner_threshold: 60.0,
            line_threshold: 0.5,
            despeckle_level: 2.0,
            preserve_width: true,
            filter_iterations: 4,
        },
        _ => return Err(format!("Unknown algorithm: {}", algorithm).into()),
    };

    Ok(serde_json::to_string(&params)?)
}

/// Get default parameters for a specific algorithm
#[wasm_bindgen]
pub fn get_default_params(algorithm: &str) -> Result<String, JsValue> {
    get_default_params_native(algorithm).map_err(|e| JsValue::from_str(&e.to_string()))
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
    validate_image_native(image_bytes).map_err(|e| JsValue::from_str(&e.to_string()))
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
    })
    .to_string()
}

// ============================================================================
// Memory Monitoring WASM Bindings
// ============================================================================

/// Get current WASM memory usage in MB
#[wasm_bindgen]
pub fn get_memory_usage() -> Result<String, JsValue> {
    let current_mb = memory_monitor::MemoryMonitor::get_current_memory_usage() / (1024 * 1024);
    let result = serde_json::json!({
        "currentMemoryMB": current_mb,
        "currentMemoryBytes": memory_monitor::MemoryMonitor::get_current_memory_usage()
    });

    serde_json::to_string(&result).map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Set maximum memory budget in MB
#[wasm_bindgen]
pub fn set_memory_budget(budget_mb: usize) -> Result<(), JsValue> {
    memory_monitor::init_memory_monitor_with_budget(budget_mb)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Get detailed memory statistics
#[wasm_bindgen]
pub fn get_memory_stats() -> Result<String, JsValue> {
    match memory_monitor::get_memory_stats() {
        Some(stats) => serde_json::to_string(&stats).map_err(|e| JsValue::from_str(&e.to_string())),
        None => Err(JsValue::from_str("Failed to get memory statistics")),
    }
}

/// Check if an image can be processed within memory budget
#[wasm_bindgen]
pub fn can_process_image(width: u32, height: u32, algorithm: &str) -> bool {
    if let Ok(monitor) = memory_monitor::get_global_memory_monitor().lock() {
        monitor.can_process_image(width, height, algorithm)
    } else {
        false
    }
}

/// Get estimated memory requirements for image processing
#[wasm_bindgen]
pub fn estimate_memory_requirements(width: u32, height: u32, algorithm: &str) -> usize {
    memory_monitor::MemoryMonitor::estimate_image_memory_requirements(width, height, algorithm)
        / (1024 * 1024)
}

/// Clear memory allocation history (for debugging/memory management)
#[wasm_bindgen]
pub fn clear_memory_history() {
    if let Ok(mut monitor) = memory_monitor::get_global_memory_monitor().lock() {
        monitor.clear_allocation_history();
    }
}

/// Suggest garbage collection (browser-specific)
#[wasm_bindgen]
pub fn suggest_gc() {
    if let Ok(monitor) = memory_monitor::get_global_memory_monitor().lock() {
        monitor.suggest_gc();
    }
}

/// Get adaptive processing parameters based on current memory usage
#[wasm_bindgen]
pub fn get_adaptive_parameters() -> Result<String, JsValue> {
    let params = memory_monitor::get_adaptive_parameters();
    serde_json::to_string(&params).map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Check if processing should continue (memory safety check)
#[wasm_bindgen]
pub fn should_continue_processing() -> bool {
    memory_monitor::should_continue_processing()
}
