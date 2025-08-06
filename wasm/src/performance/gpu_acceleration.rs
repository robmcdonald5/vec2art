use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;
// WebGPU types may not be available in all versions of web-sys
// We'll use JsValue for now and cast when needed
use log::{info, warn};

/// GPU acceleration capabilities and interface
pub struct GpuAccelerator {
    device: Option<JsValue>,
    adapter: Option<JsValue>,
}

impl GpuAccelerator {
    /// Initialize GPU acceleration if WebGPU is available
    pub async fn new() -> Self {
        let (adapter, device) = Self::initialize_webgpu().await;
        
        if device.is_some() {
            info!("✅ GPU acceleration initialized successfully");
        } else {
            info!("❌ GPU acceleration not available, falling back to CPU processing");
        }
        
        Self { device, adapter }
    }
    
    /// Check if GPU acceleration is available
    pub fn is_available(&self) -> bool {
        self.device.is_some()
    }
    
    /// Initialize WebGPU adapter and device
    async fn initialize_webgpu() -> (Option<JsValue>, Option<JsValue>) {
        // Get navigator.gpu
        let window = match web_sys::window() {
            Some(window) => window,
            None => {
                warn!("No window object available");
                return (None, None);
            }
        };
        
        let navigator = window.navigator();
        
        // Check if GPU is available
        let gpu = match js_sys::Reflect::get(&navigator, &JsValue::from_str("gpu")) {
            Ok(gpu) if !gpu.is_undefined() => gpu,
            _ => {
                warn!("WebGPU not supported in this browser");
                return (None, None);
            }
        };
        
        // Request adapter
        let adapter_promise = match js_sys::Reflect::get(&gpu, &JsValue::from_str("requestAdapter")) {
            Ok(request_adapter_fn) => {
                let request_adapter = request_adapter_fn.dyn_into::<js_sys::Function>().unwrap();
                match request_adapter.call0(&gpu) {
                    Ok(promise) => promise,
                    Err(e) => {
                        warn!("Failed to request WebGPU adapter: {:?}", e);
                        return (None, None);
                    }
                }
            }
            Err(e) => {
                warn!("WebGPU requestAdapter not available: {:?}", e);
                return (None, None);
            }
        };
        
        // Await adapter
        let adapter = match JsFuture::from(js_sys::Promise::from(adapter_promise)).await {
            Ok(adapter) if !adapter.is_null() => Some(adapter),
            Ok(_) => {
                warn!("WebGPU adapter request returned null");
                None
            }
            Err(e) => {
                warn!("Failed to request WebGPU adapter: {:?}", e);
                None
            }
        };
        
        let adapter = match adapter {
            Some(adapter) => adapter,
            None => return (None, None),
        };
        
        // Request device using js_sys
        let device_promise = match js_sys::Reflect::get(&adapter, &JsValue::from_str("requestDevice")) {
            Ok(request_device_fn) => {
                let request_device = request_device_fn.dyn_into::<js_sys::Function>().unwrap();
                match request_device.call0(&adapter) {
                    Ok(promise) => promise,
                    Err(e) => {
                        warn!("Failed to request WebGPU device: {:?}", e);
                        return (Some(adapter), None);
                    }
                }
            }
            Err(e) => {
                warn!("WebGPU requestDevice not available: {:?}", e);
                return (Some(adapter), None);
            }
        };
        
        // Await device
        let device = match JsFuture::from(js_sys::Promise::from(device_promise)).await {
            Ok(device) => Some(device),
            Err(e) => {
                warn!("Failed to get WebGPU device: {:?}", e);
                None
            }
        };
        
        (Some(adapter), device)
    }
    
    /// Accelerate image processing operations using GPU compute shaders
    pub async fn process_image_gpu(
        &self,
        _image_data: &[u8],
        _width: u32,
        _height: u32,
        _operation: GpuOperation,
    ) -> Result<Vec<u8>, JsValue> {
        let _device = match &self.device {
            Some(device) => device,
            None => return Err(JsValue::from_str("GPU device not available")),
        };
        
        info!("🚀 Processing image on GPU...");
        
        // This is a placeholder implementation
        // Full WebGPU compute shader implementation would require:
        // 1. Creating compute shader modules
        // 2. Setting up buffer layouts
        // 3. Creating bind groups
        // 4. Dispatching compute work
        // 5. Reading back results
        
        // For now, return an error indicating the feature is not yet implemented
        Err(JsValue::from_str("GPU acceleration implementation is a work in progress"))
    }
    
    /// Get GPU information for debugging
    pub fn get_gpu_info(&self) -> String {
        if let Some(adapter) = &self.adapter {
            // Try to get adapter info if available
            match js_sys::Reflect::get(adapter, &JsValue::from_str("info")) {
                Ok(info) if !info.is_undefined() => {
                    format!("GPU Adapter: {:?}", info)
                }
                _ => "GPU Adapter: Information not available".to_string()
            }
        } else {
            "GPU Adapter: Not available".to_string()
        }
    }
}

/// GPU processing operations that can be accelerated
#[derive(Debug, Clone)]
pub enum GpuOperation {
    /// Gaussian blur with specified sigma
    GaussianBlur { sigma: f32 },
    /// Sobel edge detection
    SobelEdgeDetection,
    /// Color quantization with k-means
    ColorQuantization { num_colors: u32 },
    /// Morphological operations (erosion, dilation)
    Morphological { operation: MorphOp },
}

/// Morphological operations
#[derive(Debug, Clone)]
pub enum MorphOp {
    Erosion,
    Dilation,
}

/// WebGPU compute shader source code for image processing
pub struct GpuShaders;

impl GpuShaders {
    /// Gaussian blur compute shader (WGSL)
    pub const GAUSSIAN_BLUR: &'static str = r#"
        @group(0) @binding(0) var<storage, read> input_image: array<u32>;
        @group(0) @binding(1) var<storage, read_write> output_image: array<u32>;
        @group(0) @binding(2) var<uniform> params: BlurParams;
        
        struct BlurParams {
            width: u32,
            height: u32,
            sigma: f32,
            kernel_size: u32,
        }
        
        @compute @workgroup_size(16, 16)
        fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
            let x = global_id.x;
            let y = global_id.y;
            
            if (x >= params.width || y >= params.height) {
                return;
            }
            
            let index = y * params.width + x;
            
            // Gaussian blur implementation would go here
            // For now, just copy the input to output
            output_image[index] = input_image[index];
        }
    "#;
    
    /// Sobel edge detection compute shader (WGSL)
    pub const SOBEL_EDGE_DETECTION: &'static str = r#"
        @group(0) @binding(0) var<storage, read> input_image: array<u32>;
        @group(0) @binding(1) var<storage, read_write> output_image: array<u32>;
        @group(0) @binding(2) var<uniform> params: SobelParams;
        
        struct SobelParams {
            width: u32,
            height: u32,
            threshold: f32,
        }
        
        @compute @workgroup_size(16, 16)
        fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
            let x = global_id.x;
            let y = global_id.y;
            
            if (x >= params.width || y >= params.height) {
                return;
            }
            
            // Skip edges
            if (x == 0 || y == 0 || x == params.width - 1 || y == params.height - 1) {
                output_image[y * params.width + x] = 0u;
                return;
            }
            
            // Sobel X kernel: [-1 0 1; -2 0 2; -1 0 1]
            // Sobel Y kernel: [-1 -2 -1; 0 0 0; 1 2 1]
            
            let idx = y * params.width + x;
            
            // Get surrounding pixels (simplified for grayscale)
            let tl = input_image[(y-1) * params.width + (x-1)] & 0xFFu;  // Top-left
            let tm = input_image[(y-1) * params.width + x] & 0xFFu;      // Top-middle
            let tr = input_image[(y-1) * params.width + (x+1)] & 0xFFu;  // Top-right
            let ml = input_image[y * params.width + (x-1)] & 0xFFu;      // Middle-left
            let mr = input_image[y * params.width + (x+1)] & 0xFFu;      // Middle-right
            let bl = input_image[(y+1) * params.width + (x-1)] & 0xFFu;  // Bottom-left
            let bm = input_image[(y+1) * params.width + x] & 0xFFu;      // Bottom-middle
            let br = input_image[(y+1) * params.width + (x+1)] & 0xFFu;  // Bottom-right
            
            // Calculate gradients
            let gx = (tr + 2u * mr + br) - (tl + 2u * ml + bl);
            let gy = (bl + 2u * bm + br) - (tl + 2u * tm + tr);
            
            // Calculate magnitude
            let magnitude = sqrt(f32(gx * gx + gy * gy));
            
            // Apply threshold
            let result = select(0u, 255u, magnitude > params.threshold);
            
            output_image[idx] = result | (result << 8) | (result << 16) | 0xFF000000u;
        }
    "#;
}

/// GPU-accelerated image processing functions
impl GpuAccelerator {
    /// Apply Gaussian blur using GPU compute shader
    pub async fn gaussian_blur_gpu(
        &self,
        image_data: &[u8],
        width: u32,
        height: u32,
        sigma: f32,
    ) -> Result<Vec<u8>, JsValue> {
        self.process_image_gpu(
            image_data,
            width,
            height,
            GpuOperation::GaussianBlur { sigma },
        ).await
    }
    
    /// Apply Sobel edge detection using GPU compute shader
    pub async fn sobel_edge_detection_gpu(
        &self,
        image_data: &[u8],
        width: u32,
        height: u32,
    ) -> Result<Vec<u8>, JsValue> {
        self.process_image_gpu(
            image_data,
            width,
            height,
            GpuOperation::SobelEdgeDetection,
        ).await
    }
    
    /// Apply color quantization using GPU compute shader
    pub async fn color_quantization_gpu(
        &self,
        image_data: &[u8],
        width: u32,
        height: u32,
        num_colors: u32,
    ) -> Result<Vec<u8>, JsValue> {
        self.process_image_gpu(
            image_data,
            width,
            height,
            GpuOperation::ColorQuantization { num_colors },
        ).await
    }
}

/// Global GPU accelerator instance
static mut GPU_ACCELERATOR: Option<GpuAccelerator> = None;

/// Initialize GPU accelerator
pub async fn initialize_gpu() -> Result<(), JsValue> {
    unsafe {
        if GPU_ACCELERATOR.is_none() {
            let accelerator = GpuAccelerator::new().await;
            let is_available = accelerator.is_available();
            
            if is_available {
                info!("🎮 GPU acceleration initialized successfully");
                info!("🔍 {}", accelerator.get_gpu_info());
            } else {
                info!("💻 GPU acceleration not available, using CPU fallback");
            }
            
            GPU_ACCELERATOR = Some(accelerator);
        }
    }
    Ok(())
}

/// Get global GPU accelerator instance
pub fn get_gpu_accelerator() -> Option<&'static GpuAccelerator> {
    unsafe { GPU_ACCELERATOR.as_ref() }
}

/// Check if GPU acceleration is available globally
pub fn is_gpu_available() -> bool {
    match get_gpu_accelerator() {
        Some(accelerator) => accelerator.is_available(),
        None => false,
    }
}

/// Utility function to determine optimal processing method
pub fn recommend_processing_method(
    image_size: u32,
    operation_complexity: f32,
) -> ProcessingMethod {
    let capabilities = crate::performance::get_capabilities();
    
    // For very large images or complex operations, prefer GPU if available
    if image_size > 4_000_000 || operation_complexity > 0.8 {
        if is_gpu_available() {
            return ProcessingMethod::Gpu;
        }
    }
    
    // For medium-sized images, prefer parallel CPU processing
    if image_size > 1_000_000 && capabilities.can_use_parallel_processing() {
        return ProcessingMethod::ParallelCpu;
    }
    
    // For small images, single-threaded CPU is fine
    ProcessingMethod::SingleThreadCpu
}

/// Processing method recommendation
#[derive(Debug, Clone, PartialEq)]
pub enum ProcessingMethod {
    SingleThreadCpu,
    ParallelCpu,
    Gpu,
}

impl ProcessingMethod {
    pub fn description(&self) -> &'static str {
        match self {
            ProcessingMethod::SingleThreadCpu => "Single-threaded CPU processing",
            ProcessingMethod::ParallelCpu => "Multi-threaded CPU processing",
            ProcessingMethod::Gpu => "GPU-accelerated processing",
        }
    }
}