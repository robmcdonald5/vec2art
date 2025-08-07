use wasm_bindgen::prelude::*;
use web_sys::Window;
use log::info;

pub mod parallel_edge_detector;
pub mod parallel_path_tracer;
pub mod parallel_geometric_fitter;
pub mod gpu_acceleration;

/// Performance optimization capabilities available in the current environment
#[derive(Debug, Clone)]
pub struct Capabilities {
    /// Whether the browser supports Web Workers for multi-threading
    pub web_workers_available: bool,
    /// Whether SharedArrayBuffer is available for parallel processing
    pub shared_array_buffer_available: bool,
    /// Whether WebGPU is available for GPU acceleration
    pub webgpu_available: bool,
    /// Number of logical processors/cores available
    pub logical_processors: u32,
    /// Estimated memory limit for WASM module (in MB)
    pub memory_limit_mb: u32,
    /// Whether SIMD128 is supported
    pub simd_available: bool,
}

impl Capabilities {
    /// Detect current system capabilities
    pub fn detect() -> Self {
        let window = web_sys::window();
        let mut capabilities = Self::default();
        
        if let Some(window) = window {
            // Check for Web Workers support
            capabilities.web_workers_available = Self::check_web_workers(&window);
            
            // Check for SharedArrayBuffer support
            capabilities.shared_array_buffer_available = Self::check_shared_array_buffer(&window);
            
            // Check for WebGPU support
            capabilities.webgpu_available = Self::check_webgpu(&window);
            
            // Estimate logical processors (navigator.hardwareConcurrency)
            capabilities.logical_processors = Self::detect_logical_processors(&window);
            
            // Estimate memory limit
            capabilities.memory_limit_mb = Self::estimate_memory_limit(&window);
            
            // Check SIMD support
            capabilities.simd_available = Self::check_simd_support();
        }
        
        info!("Detected capabilities: {:?}", capabilities);
        capabilities
    }
    
    /// Check if Web Workers are supported
    fn check_web_workers(_window: &Window) -> bool {
        // Try to access the Worker constructor
        js_sys::eval("typeof Worker !== 'undefined'").is_ok()
    }
    
    /// Check if SharedArrayBuffer is supported
    fn check_shared_array_buffer(_window: &Window) -> bool {
        // SharedArrayBuffer availability check
        js_sys::eval("typeof SharedArrayBuffer !== 'undefined'")
            .map(|val| val.as_bool().unwrap_or(false))
            .unwrap_or(false)
    }
    
    /// Check if WebGPU is supported
    fn check_webgpu(window: &Window) -> bool {
        // Check if navigator.gpu exists
        let navigator = window.navigator();
        js_sys::Reflect::has(&navigator, &JsValue::from_str("gpu"))
            .unwrap_or(false)
    }
    
    /// Detect number of logical processors
    fn detect_logical_processors(window: &Window) -> u32 {
        let navigator = window.navigator();
        // Try to get hardwareConcurrency
        if let Ok(concurrency) = js_sys::Reflect::get(&navigator, &JsValue::from_str("hardwareConcurrency")) {
            if let Some(num) = concurrency.as_f64() {
                return num as u32;
            }
        }
        
        // Default to 4 if detection fails
        4
    }
    
    /// Estimate available memory limit
    fn estimate_memory_limit(window: &Window) -> u32 {
        // Try to get memory info if available
        let navigator = window.navigator();
        if let Ok(memory) = js_sys::Reflect::get(&navigator, &JsValue::from_str("deviceMemory")) {
            if let Some(gb) = memory.as_f64() {
                // Convert to MB and use a conservative 25% for WASM
                return ((gb * 1024.0) * 0.25) as u32;
            }
        }
        
        // Conservative default: 512MB
        512
    }
    
    /// Check SIMD support (compile-time for now, runtime detection is complex)
    fn check_simd_support() -> bool {
        // WASM SIMD is still not universally supported
        // For now, return false - can be enabled manually if needed
        false
    }
    
    /// Recommend optimal thread count for parallel processing
    pub fn recommended_thread_count(&self) -> usize {
        if !self.web_workers_available || !self.shared_array_buffer_available {
            return 1; // Single-threaded fallback
        }
        
        // Use number of cores, but cap at 8 for reasonable performance
        (self.logical_processors as usize).min(8).max(1)
    }
    
    /// Check if parallel processing is viable
    pub fn can_use_parallel_processing(&self) -> bool {
        self.web_workers_available && self.shared_array_buffer_available
    }
    
    /// Check if GPU acceleration is viable
    pub fn can_use_gpu_acceleration(&self) -> bool {
        self.webgpu_available
    }
}

impl Default for Capabilities {
    fn default() -> Self {
        Self {
            web_workers_available: false,
            shared_array_buffer_available: false,
            webgpu_available: false,
            logical_processors: 1,
            memory_limit_mb: 256,
            simd_available: false,
        }
    }
}

/// Global capabilities instance
static mut CAPABILITIES: Option<Capabilities> = None;

/// Initialize and cache capabilities detection
#[allow(static_mut_refs)]
pub fn initialize_capabilities() -> &'static Capabilities {
    unsafe {
        if CAPABILITIES.is_none() {
            CAPABILITIES = Some(Capabilities::detect());
        }
        CAPABILITIES.as_ref().unwrap()
    }
}

/// Get cached capabilities
pub fn get_capabilities() -> &'static Capabilities {
    unsafe {
        #[allow(static_mut_refs)]
        {
            static DEFAULT_CAPABILITIES: Capabilities = Capabilities {
                web_workers_available: false,
                shared_array_buffer_available: false,
                webgpu_available: false,
                logical_processors: 1,
                memory_limit_mb: 256,
                simd_available: false,
            };
            
            CAPABILITIES.as_ref().unwrap_or(&DEFAULT_CAPABILITIES)
        }
    }
}

/// Performance timer for benchmarking optimizations
pub struct PerfTimer {
    start_time: f64,
    label: String,
}

impl PerfTimer {
    pub fn new(label: &str) -> Self {
        let start_time = if let Some(window) = web_sys::window() {
            if let Some(performance) = window.performance() {
                performance.now()
            } else {
                0.0
            }
        } else {
            0.0
        };
        
        Self {
            start_time,
            label: label.to_string(),
        }
    }
    
    pub fn elapsed(&self) -> f64 {
        if let Some(window) = web_sys::window() {
            if let Some(performance) = window.performance() {
                performance.now() - self.start_time
            } else {
                0.0
            }
        } else {
            0.0
        }
    }
}

impl Drop for PerfTimer {
    fn drop(&mut self) {
        let elapsed = self.elapsed();
        info!("⏱️  {}: {:.2}ms", self.label, elapsed);
    }
}

/// Macro for easy performance timing
#[macro_export]
macro_rules! perf_time {
    ($label:expr, $block:block) => {
        {
            let _timer = crate::performance::PerfTimer::new($label);
            $block
        }
    };
}

pub use perf_time;

/// Initialize parallel processing thread pool if available
#[cfg(feature = "parallel")]
pub fn init_thread_pool() -> Result<(), JsValue> {
    let capabilities = get_capabilities();
    
    if capabilities.can_use_parallel_processing() {
        let thread_count = capabilities.recommended_thread_count();
        info!("Initializing thread pool with {} threads", thread_count);
        
        // Initialize rayon thread pool for WASM
        wasm_bindgen_rayon::init_thread_pool(thread_count);
        Ok(())
    } else {
        info!("Parallel processing not available, using single-threaded mode");
        Ok(())
    }
}

#[cfg(not(feature = "parallel"))]
pub fn init_thread_pool() -> Result<(), JsValue> {
    info!("Parallel processing feature not enabled, using single-threaded mode");
    Ok(())
}

/// Adaptive chunk size calculation for parallel processing
pub fn calculate_optimal_chunk_size(total_items: usize, thread_count: usize) -> usize {
    if thread_count <= 1 {
        return total_items; // Single chunk for single-threaded
    }
    
    // Calculate base chunk size
    let base_chunk_size = (total_items + thread_count - 1) / thread_count;
    
    // Ensure minimum chunk size to avoid overhead
    let min_chunk_size = 100;
    let max_chunk_size = 10000;
    
    base_chunk_size.max(min_chunk_size).min(max_chunk_size)
}