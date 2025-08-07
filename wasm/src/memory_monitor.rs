use log::{error, info, warn};
use serde::{Deserialize, Serialize};
use std::collections::VecDeque;
use std::sync::{Arc, Mutex};

// WASM-specific imports
#[cfg(target_arch = "wasm32")]
use web_sys;

use crate::error::{Result, Vec2ArtError};

// Memory budget constants based on research
pub const MAX_MEMORY_BUDGET_MB: usize = 100; // Conservative limit for mobile browsers
pub const MEMORY_WARNING_THRESHOLD_MB: usize = 80; // 80% warning
pub const MEMORY_CRITICAL_THRESHOLD_MB: usize = 95; // 95% critical

// Default memory limits for different processing types
pub const IMAGE_BUFFER_LIMIT_MB: usize = 30; // Max memory for image buffers
pub const ALGORITHM_WORK_LIMIT_MB: usize = 40; // Max memory for algorithm working data
pub const SVG_OUTPUT_LIMIT_MB: usize = 20; // Max memory for SVG generation

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryAllocation {
    pub timestamp: f64,
    pub size_bytes: usize,
    pub operation: String,
    pub algorithm: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryBudget {
    pub max_budget_mb: usize,
    pub current_usage_mb: usize,
    pub remaining_mb: usize,
    pub warning_threshold_mb: usize,
    pub critical_threshold_mb: usize,
}

impl MemoryBudget {
    pub fn new(max_budget_mb: usize) -> Self {
        Self {
            max_budget_mb,
            current_usage_mb: 0,
            remaining_mb: max_budget_mb,
            warning_threshold_mb: (max_budget_mb * 80) / 100,
            critical_threshold_mb: (max_budget_mb * 95) / 100,
        }
    }

    pub fn update_usage(&mut self, current_usage_mb: usize) {
        self.current_usage_mb = current_usage_mb;
        self.remaining_mb = if current_usage_mb > self.max_budget_mb {
            0
        } else {
            self.max_budget_mb - current_usage_mb
        };
    }

    pub fn is_at_warning_threshold(&self) -> bool {
        self.current_usage_mb >= self.warning_threshold_mb
    }

    pub fn is_at_critical_threshold(&self) -> bool {
        self.current_usage_mb >= self.critical_threshold_mb
    }

    pub fn is_over_budget(&self) -> bool {
        self.current_usage_mb > self.max_budget_mb
    }

    pub fn can_allocate(&self, additional_mb: usize) -> bool {
        self.current_usage_mb + additional_mb <= self.max_budget_mb
    }
}

pub struct MemoryMonitor {
    initial_memory: usize,
    peak_memory: usize,
    allocations: Arc<Mutex<VecDeque<MemoryAllocation>>>,
    budget: Arc<Mutex<MemoryBudget>>,
}

impl MemoryMonitor {
    pub fn new() -> Self {
        let initial_memory = Self::get_current_memory_usage();

        Self {
            initial_memory,
            peak_memory: initial_memory,
            allocations: Arc::new(Mutex::new(VecDeque::with_capacity(1000))),
            budget: Arc::new(Mutex::new(MemoryBudget::new(MAX_MEMORY_BUDGET_MB))),
        }
    }

    pub fn with_custom_budget(budget_mb: usize) -> Self {
        let initial_memory = Self::get_current_memory_usage();

        Self {
            initial_memory,
            peak_memory: initial_memory,
            allocations: Arc::new(Mutex::new(VecDeque::with_capacity(1000))),
            budget: Arc::new(Mutex::new(MemoryBudget::new(budget_mb))),
        }
    }

    /// Get current memory usage in bytes
    /// Uses WASM memory API when available, falls back to system memory on native
    pub fn get_current_memory_usage() -> usize {
        #[cfg(target_arch = "wasm32")]
        {
            // Get WASM memory usage - simplified approach
            // In WASM, we can approximate memory usage based on page count
            use wasm_bindgen::memory;
            let mem = memory();

            // Try to get memory size from buffer (if available)
            match js_sys::Reflect::get(&mem, &"buffer".into()) {
                Ok(buffer) => {
                    if let Ok(byte_length) = js_sys::Reflect::get(&buffer, &"byteLength".into()) {
                        if let Some(length) = byte_length.as_f64() {
                            return length as usize;
                        }
                    }
                }
                Err(_) => {}
            }

            // Fallback: estimate based on typical WASM initial memory
            // WASM modules typically start with 1MB (16 pages) and grow from there
            16 * 64 * 1024 // 1MB default estimate
        }

        #[cfg(not(target_arch = "wasm32"))]
        {
            // Native fallback - use a reasonable estimate for testing
            // We can't easily get actual memory usage on native, so use a mock value
            // that allows tests to run without panicking

            // Try to get system memory usage if available (Unix/Linux)
            #[cfg(unix)]
            {
                use std::fs;
                if let Ok(status) = fs::read_to_string("/proc/self/status") {
                    for line in status.lines() {
                        if line.starts_with("VmRSS:") {
                            if let Some(kb_str) = line.split_whitespace().nth(1) {
                                if let Ok(kb) = kb_str.parse::<usize>() {
                                    return kb * 1024; // Convert KB to bytes
                                }
                            }
                        }
                    }
                }
            }

            // Windows or fallback - use a reasonable mock value for testing
            // This allows tests to run without causing memory monitor failures
            // Start with a base of 10MB and add some variation based on thread ID
            let base_memory = 10 * 1024 * 1024; // 10MB base
            let thread_id = std::thread::current().id();
            let variation = (format!("{:?}", thread_id).len() % 5) * 1024 * 1024; // 0-4MB variation
            base_memory + variation
        }
    }

    /// Get current memory usage in MB
    pub fn get_current_memory_mb(&self) -> usize {
        Self::get_current_memory_usage() / (1024 * 1024)
    }

    /// Record a memory allocation
    pub fn record_allocation(&mut self, size_bytes: usize, operation: &str, algorithm: &str) {
        let timestamp = self.get_current_timestamp();

        let allocation = MemoryAllocation {
            timestamp,
            size_bytes,
            operation: operation.to_string(),
            algorithm: algorithm.to_string(),
        };

        if let Ok(mut allocations) = self.allocations.lock() {
            allocations.push_back(allocation);
            // Keep only last 1000 allocations to prevent memory leak
            if allocations.len() > 1000 {
                allocations.pop_front();
            }
        }

        // Update current memory usage
        self.update_memory_usage();
    }

    /// Update current memory usage and budget
    pub fn update_memory_usage(&mut self) {
        let current_memory = Self::get_current_memory_usage();
        let current_memory_mb = current_memory / (1024 * 1024);

        // Update peak memory
        if current_memory > self.peak_memory {
            self.peak_memory = current_memory;
        }

        // Update budget
        if let Ok(mut budget) = self.budget.lock() {
            budget.update_usage(current_memory_mb);

            // Log warnings if thresholds are exceeded
            if budget.is_over_budget() {
                error!(
                    "Memory budget exceeded: {} MB > {} MB",
                    current_memory_mb, budget.max_budget_mb
                );
            } else if budget.is_at_critical_threshold() {
                warn!(
                    "Memory usage critical: {} MB ({}%)",
                    current_memory_mb,
                    (current_memory_mb * 100) / budget.max_budget_mb
                );
            } else if budget.is_at_warning_threshold() {
                warn!(
                    "Memory usage high: {} MB ({}%)",
                    current_memory_mb,
                    (current_memory_mb * 100) / budget.max_budget_mb
                );
            }
        }
    }

    /// Check if a memory allocation is allowed
    pub fn can_allocate(&self, size_bytes: usize) -> bool {
        let size_mb = size_bytes / (1024 * 1024);
        if let Ok(budget) = self.budget.lock() {
            budget.can_allocate(size_mb)
        } else {
            false
        }
    }

    /// Pre-allocate and check memory for an operation
    pub fn check_memory_for_operation(
        &mut self,
        estimated_bytes: usize,
        operation: &str,
        algorithm: &str,
    ) -> Result<()> {
        if !self.can_allocate(estimated_bytes) {
            return Err(Vec2ArtError::MemoryExhausted {
                requested: estimated_bytes / (1024 * 1024),
                available: self.get_remaining_memory_mb(),
            });
        }

        self.record_allocation(estimated_bytes, operation, algorithm);
        Ok(())
    }

    /// Get remaining memory budget in MB
    pub fn get_remaining_memory_mb(&self) -> usize {
        if let Ok(budget) = self.budget.lock() {
            budget.remaining_mb
        } else {
            0
        }
    }

    /// Get current memory budget
    pub fn get_budget(&self) -> MemoryBudget {
        if let Ok(budget) = self.budget.lock() {
            budget.clone()
        } else {
            MemoryBudget::new(MAX_MEMORY_BUDGET_MB)
        }
    }

    /// Set new memory budget
    pub fn set_budget(&mut self, budget_mb: usize) -> Result<()> {
        if budget_mb < 50 {
            return Err(Vec2ArtError::InvalidParameters(
                "Memory budget must be at least 50MB".to_string(),
            ));
        }

        if let Ok(mut budget) = self.budget.lock() {
            *budget = MemoryBudget::new(budget_mb);
            budget.update_usage(self.get_current_memory_mb());
            info!("Memory budget set to {} MB", budget_mb);
        }

        Ok(())
    }

    /// Get memory statistics
    pub fn get_memory_stats(&self) -> MemoryStats {
        let current_memory = Self::get_current_memory_usage();
        let budget = self.get_budget();

        let allocation_count = if let Ok(allocations) = self.allocations.lock() {
            allocations.len()
        } else {
            0
        };

        MemoryStats {
            initial_memory_bytes: self.initial_memory,
            current_memory_bytes: current_memory,
            peak_memory_bytes: self.peak_memory,
            current_memory_mb: current_memory / (1024 * 1024),
            peak_memory_mb: self.peak_memory / (1024 * 1024),
            budget,
            allocation_count,
            memory_growth_bytes: current_memory.saturating_sub(self.initial_memory),
        }
    }

    /// Get recent memory allocations
    pub fn get_recent_allocations(&self, limit: usize) -> Vec<MemoryAllocation> {
        if let Ok(allocations) = self.allocations.lock() {
            allocations.iter().rev().take(limit).cloned().collect()
        } else {
            Vec::new()
        }
    }

    /// Clear allocation history (useful for memory management)
    pub fn clear_allocation_history(&mut self) {
        if let Ok(mut allocations) = self.allocations.lock() {
            allocations.clear();
        }
    }

    /// Force garbage collection if available (browser-specific)
    pub fn suggest_gc(&self) {
        // Note: In browsers, we can't force GC directly from WASM
        // This is a hint that could be used by the JavaScript side
        info!("Suggesting garbage collection due to high memory usage");
    }

    /// Estimate memory requirements for image processing
    pub fn estimate_image_memory_requirements(width: u32, height: u32, algorithm: &str) -> usize {
        let pixels = (width * height) as usize;
        let base_image_size = pixels * 4; // RGBA bytes

        // Algorithm-specific multipliers based on analysis
        let multiplier = match algorithm {
            "edge_detector" => 3.5,    // Original + edges + gradients
            "path_tracer" => 4.0,      // Original + quantized + contours + paths
            "geometric_fitter" => 2.5, // Original + edges + shapes (optimized)
            "vtracer" => 3.0,          // VTracer internal buffers
            _ => 3.0,                  // Default conservative estimate
        };

        (base_image_size as f64 * multiplier) as usize
    }

    /// Check if image can be processed within memory budget
    pub fn can_process_image(&self, width: u32, height: u32, algorithm: &str) -> bool {
        let estimated_memory = Self::estimate_image_memory_requirements(width, height, algorithm);
        let estimated_mb = estimated_memory / (1024 * 1024);

        if let Ok(budget) = self.budget.lock() {
            budget.can_allocate(estimated_mb)
        } else {
            false
        }
    }

    /// Get current timestamp for allocation tracking
    /// Uses browser performance API in WASM, system time on native
    fn get_current_timestamp(&self) -> f64 {
        #[cfg(target_arch = "wasm32")]
        {
            web_sys::window()
                .and_then(|w| w.performance())
                .map(|p| p.now())
                .unwrap_or(0.0)
        }

        #[cfg(not(target_arch = "wasm32"))]
        {
            // Native fallback - use system time
            use std::time::{SystemTime, UNIX_EPOCH};
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .map(|d| d.as_millis() as f64)
                .unwrap_or(0.0)
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryStats {
    pub initial_memory_bytes: usize,
    pub current_memory_bytes: usize,
    pub peak_memory_bytes: usize,
    pub current_memory_mb: usize,
    pub peak_memory_mb: usize,
    pub budget: MemoryBudget,
    pub allocation_count: usize,
    pub memory_growth_bytes: usize,
}

// Global memory monitor instance
use std::sync::OnceLock;
static GLOBAL_MEMORY_MONITOR: OnceLock<Arc<Mutex<MemoryMonitor>>> = OnceLock::new();

/// Get the global memory monitor
pub fn get_global_memory_monitor() -> Arc<Mutex<MemoryMonitor>> {
    GLOBAL_MEMORY_MONITOR
        .get_or_init(|| Arc::new(Mutex::new(MemoryMonitor::new())))
        .clone()
}

/// Initialize global memory monitor with custom budget
pub fn init_memory_monitor_with_budget(budget_mb: usize) -> Result<()> {
    if let Ok(mut monitor) = get_global_memory_monitor().lock() {
        monitor.set_budget(budget_mb)?;
        info!(
            "Global memory monitor initialized with {} MB budget",
            budget_mb
        );
    }
    Ok(())
}

/// Convenience function to check memory before operation
pub fn check_memory_for_operation(
    estimated_bytes: usize,
    operation: &str,
    algorithm: &str,
) -> Result<()> {
    if let Ok(mut monitor) = get_global_memory_monitor().lock() {
        monitor.check_memory_for_operation(estimated_bytes, operation, algorithm)
    } else {
        Err(Vec2ArtError::MemoryError)
    }
}

/// Convenience function to record allocation
pub fn record_allocation(size_bytes: usize, operation: &str, algorithm: &str) {
    if let Ok(mut monitor) = get_global_memory_monitor().lock() {
        monitor.record_allocation(size_bytes, operation, algorithm);
    }
}

/// Convenience function to get memory stats
pub fn get_memory_stats() -> Option<MemoryStats> {
    if let Ok(monitor) = get_global_memory_monitor().lock() {
        Some(monitor.get_memory_stats())
    } else {
        None
    }
}

// ============================================================================
// Memory-Aware Adaptive Processing
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProcessingQuality {
    High,
    Medium,
    Low,
    Emergency, // Minimal processing to prevent crashes
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdaptiveParameters {
    pub quality: ProcessingQuality,
    pub max_colors: usize,
    pub max_shapes: u32,
    pub simplification_factor: f32,
    pub skip_optimizations: bool,
    pub enable_chunked_processing: bool,
    pub chunk_size: usize,
}

impl Default for AdaptiveParameters {
    fn default() -> Self {
        Self {
            quality: ProcessingQuality::High,
            max_colors: 256,
            max_shapes: 100,
            simplification_factor: 1.0,
            skip_optimizations: false,
            enable_chunked_processing: false,
            chunk_size: 1000,
        }
    }
}

impl AdaptiveParameters {
    /// Get parameters based on current memory situation
    pub fn from_memory_budget(budget: &MemoryBudget) -> Self {
        let usage_percent = (budget.current_usage_mb * 100) / budget.max_budget_mb;

        match usage_percent {
            0..=50 => Self {
                quality: ProcessingQuality::High,
                max_colors: 256,
                max_shapes: 100,
                simplification_factor: 1.0,
                skip_optimizations: false,
                enable_chunked_processing: false,
                chunk_size: 1000,
            },
            51..=75 => Self {
                quality: ProcessingQuality::Medium,
                max_colors: 64,
                max_shapes: 50,
                simplification_factor: 1.5,
                skip_optimizations: false,
                enable_chunked_processing: true,
                chunk_size: 500,
            },
            76..=90 => Self {
                quality: ProcessingQuality::Low,
                max_colors: 16,
                max_shapes: 25,
                simplification_factor: 2.0,
                skip_optimizations: true,
                enable_chunked_processing: true,
                chunk_size: 200,
            },
            _ => Self {
                quality: ProcessingQuality::Emergency,
                max_colors: 4,
                max_shapes: 10,
                simplification_factor: 3.0,
                skip_optimizations: true,
                enable_chunked_processing: true,
                chunk_size: 100,
            },
        }
    }

    /// Check if processing should be degraded based on memory
    pub fn should_degrade_for_size(width: u32, height: u32, _algorithm: &str) -> Option<Self> {
        let pixels = (width * height) as usize;

        // Large image adaptive parameters
        if pixels > 4_000_000 {
            // > 4MP
            Some(Self {
                quality: ProcessingQuality::Medium,
                max_colors: 32,
                max_shapes: 30,
                simplification_factor: 2.0,
                skip_optimizations: false,
                enable_chunked_processing: true,
                chunk_size: 300,
            })
        } else if pixels > 8_000_000 {
            // > 8MP
            Some(Self {
                quality: ProcessingQuality::Low,
                max_colors: 16,
                max_shapes: 20,
                simplification_factor: 3.0,
                skip_optimizations: true,
                enable_chunked_processing: true,
                chunk_size: 200,
            })
        } else {
            None
        }
    }
}

/// Get adaptive processing parameters based on current memory usage
pub fn get_adaptive_parameters() -> AdaptiveParameters {
    if let Ok(monitor) = get_global_memory_monitor().lock() {
        let budget = monitor.get_budget();

        if budget.is_over_budget() || budget.is_at_critical_threshold() {
            warn!("Memory usage critical, using emergency processing parameters");
            AdaptiveParameters::from_memory_budget(&budget)
        } else if budget.is_at_warning_threshold() {
            warn!("Memory usage high, degrading processing quality");
            AdaptiveParameters::from_memory_budget(&budget)
        } else {
            AdaptiveParameters::default()
        }
    } else {
        AdaptiveParameters::default()
    }
}

/// Check if processing should continue or be terminated for memory safety
pub fn should_continue_processing() -> bool {
    if let Ok(monitor) = get_global_memory_monitor().lock() {
        let budget = monitor.get_budget();

        if budget.is_over_budget() {
            error!("Memory budget exceeded, terminating processing");
            return false;
        }

        if budget.current_usage_mb > (budget.max_budget_mb * 98) / 100 {
            error!("Memory usage at 98% capacity, terminating for safety");
            return false;
        }

        true
    } else {
        // If we can't access the monitor, be conservative
        false
    }
}

/// Apply adaptive processing to conversion parameters
pub fn adapt_conversion_parameters(
    params: crate::ConversionParameters,
    adaptive: &AdaptiveParameters,
) -> crate::ConversionParameters {
    match params {
        crate::ConversionParameters::PathTracer {
            threshold,
            num_colors,
            curve_smoothing,
            suppress_speckles,
            corner_threshold,
            optimize_curves,
        } => crate::ConversionParameters::PathTracer {
            threshold,
            num_colors: (adaptive.max_colors.min(num_colors as usize)) as u8,
            curve_smoothing,
            suppress_speckles,
            corner_threshold,
            optimize_curves: !adaptive.skip_optimizations && optimize_curves,
        },
        crate::ConversionParameters::GeometricFitter {
            shape_types,
            max_shapes,
            population_size,
            generations,
            mutation_rate,
            target_fitness,
        } => crate::ConversionParameters::GeometricFitter {
            shape_types,
            max_shapes: adaptive.max_shapes.min(max_shapes),
            population_size,
            generations,
            mutation_rate,
            target_fitness,
        },
        crate::ConversionParameters::EdgeDetector {
            method,
            threshold_low,
            threshold_high,
            gaussian_sigma,
            simplification,
            min_path_length,
        } => crate::ConversionParameters::EdgeDetector {
            method,
            threshold_low,
            threshold_high,
            gaussian_sigma,
            simplification: simplification * adaptive.simplification_factor,
            min_path_length,
        },
        // Pass through other parameter types unchanged
        other => other,
    }
}
