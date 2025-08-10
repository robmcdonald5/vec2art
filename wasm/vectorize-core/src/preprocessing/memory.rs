//! Memory pool optimization for performance-critical processing
//!
//! This module provides memory pool management to reduce allocation overhead
//! in performance-critical paths, especially for large image processing.

use std::sync::Mutex;
use once_cell::sync::Lazy;

/// Buffer types that can be pooled for reuse
#[derive(Debug, Clone, Copy)]
pub enum BufferType {
    /// LAB color space buffer for color conversion
    LabColors,
    /// SLIC cluster labels
    SlicLabels,
    /// SLIC distances buffer
    SlicDistances,
    /// General f32 temporary buffer
    TempF32,
    /// General u8 temporary buffer
    TempU8,
    /// General u32 temporary buffer
    TempU32,
}

/// Pool configuration for memory optimization
#[derive(Debug, Clone)]
pub struct PoolConfig {
    /// Maximum number of buffers to retain per type
    pub max_buffers_per_type: usize,
    /// Maximum buffer size to pool (in bytes)
    pub max_buffer_size: usize,
    /// Enable memory pool (can be disabled for debugging)
    pub enable_pooling: bool,
}

impl Default for PoolConfig {
    fn default() -> Self {
        Self {
            max_buffers_per_type: 8,     // Keep up to 8 buffers of each type
            max_buffer_size: 64_000_000, // 64MB max per buffer
            enable_pooling: true,
        }
    }
}

/// Memory pool for reusable buffers
struct BufferPool {
    lab_colors: Vec<Vec<(f32, f32, f32)>>,
    slic_labels: Vec<Vec<usize>>,
    slic_distances: Vec<Vec<f32>>,
    temp_f32: Vec<Vec<f32>>,
    temp_u8: Vec<Vec<u8>>,
    temp_u32: Vec<Vec<u32>>,
    config: PoolConfig,
}

impl BufferPool {
    fn new(config: PoolConfig) -> Self {
        Self {
            lab_colors: Vec::new(),
            slic_labels: Vec::new(),
            slic_distances: Vec::new(),
            temp_f32: Vec::new(),
            temp_u8: Vec::new(),
            temp_u32: Vec::new(),
            config,
        }
    }

    /// Get f32 buffer from pool
    fn get_f32_buffer(&mut self, min_capacity: usize) -> Vec<f32> {
        if !self.config.enable_pooling {
            let mut buffer = Vec::with_capacity(min_capacity);
            buffer.resize(min_capacity, 0.0);
            return buffer;
        }

        // Try to find suitable buffer
        for i in 0..self.temp_f32.len() {
            if self.temp_f32[i].capacity() >= min_capacity {
                let mut buffer = self.temp_f32.swap_remove(i);
                buffer.clear();
                buffer.resize(min_capacity, 0.0);
                return buffer;
            }
        }

        let mut buffer = Vec::with_capacity(min_capacity);
        buffer.resize(min_capacity, 0.0);
        buffer
    }

    /// Get usize buffer from pool (for SLIC labels)
    fn get_usize_buffer(&mut self, min_capacity: usize) -> Vec<usize> {
        if !self.config.enable_pooling {
            let mut buffer = Vec::with_capacity(min_capacity);
            buffer.resize(min_capacity, 0);
            return buffer;
        }

        for i in 0..self.slic_labels.len() {
            if self.slic_labels[i].capacity() >= min_capacity {
                let mut buffer = self.slic_labels.swap_remove(i);
                buffer.clear();
                buffer.resize(min_capacity, 0);
                return buffer;
            }
        }

        let mut buffer = Vec::with_capacity(min_capacity);
        buffer.resize(min_capacity, 0);
        buffer
    }

    /// Return f32 buffer to pool
    fn return_f32_buffer(&mut self, mut buffer: Vec<f32>) {
        if !self.config.enable_pooling {
            return;
        }

        let buffer_size = buffer.capacity() * std::mem::size_of::<f32>();
        if buffer_size > self.config.max_buffer_size {
            return;
        }

        buffer.clear();
        if self.temp_f32.len() < self.config.max_buffers_per_type {
            self.temp_f32.push(buffer);
        }
    }

    /// Return usize buffer to pool  
    fn return_usize_buffer(&mut self, mut buffer: Vec<usize>) {
        if !self.config.enable_pooling {
            return;
        }

        let buffer_size = buffer.capacity() * std::mem::size_of::<usize>();
        if buffer_size > self.config.max_buffer_size {
            return;
        }

        buffer.clear();
        if self.slic_labels.len() < self.config.max_buffers_per_type {
            self.slic_labels.push(buffer);
        }
    }

    /// Get statistics about pool usage
    fn get_stats(&self) -> PoolStats {
        PoolStats {
            lab_colors_count: self.lab_colors.len(),
            slic_labels_count: self.slic_labels.len(),
            slic_distances_count: self.slic_distances.len(),
            temp_f32_count: self.temp_f32.len(),
            temp_u8_count: self.temp_u8.len(),
            temp_u32_count: self.temp_u32.len(),
            total_buffers: self.lab_colors.len() + self.slic_labels.len() + self.slic_distances.len() 
                         + self.temp_f32.len() + self.temp_u8.len() + self.temp_u32.len(),
        }
    }
}

/// Statistics about memory pool usage
#[derive(Debug, Clone)]
pub struct PoolStats {
    pub lab_colors_count: usize,
    pub slic_labels_count: usize,
    pub slic_distances_count: usize,
    pub temp_f32_count: usize,
    pub temp_u8_count: usize,
    pub temp_u32_count: usize,
    pub total_buffers: usize,
}

/// Global memory pool instance
static BUFFER_POOL: Lazy<Mutex<BufferPool>> = Lazy::new(|| {
    Mutex::new(BufferPool::new(PoolConfig::default()))
});

/// Get SLIC distances buffer from pool
pub fn get_pooled_f32_buffer(min_capacity: usize) -> Vec<f32> {
    match BUFFER_POOL.lock() {
        Ok(mut pool) => pool.get_f32_buffer(min_capacity),
        Err(_) => {
            log::warn!("Buffer pool lock failed, falling back to direct allocation");
            let mut buffer = Vec::with_capacity(min_capacity);
            buffer.resize(min_capacity, 0.0);
            buffer
        }
    }
}

/// Return f32 buffer to pool for reuse
pub fn return_pooled_f32_buffer(buffer: Vec<f32>) {
    if let Ok(mut pool) = BUFFER_POOL.lock() {
        pool.return_f32_buffer(buffer);
    }
}

/// Get SLIC labels buffer from pool  
pub fn get_pooled_usize_buffer(min_capacity: usize) -> Vec<usize> {
    match BUFFER_POOL.lock() {
        Ok(mut pool) => pool.get_usize_buffer(min_capacity),
        Err(_) => {
            log::warn!("Buffer pool lock failed, falling back to direct allocation");
            let mut buffer = Vec::with_capacity(min_capacity);
            buffer.resize(min_capacity, 0);
            buffer
        }
    }
}

/// Return usize buffer to pool for reuse
pub fn return_pooled_usize_buffer(buffer: Vec<usize>) {
    if let Ok(mut pool) = BUFFER_POOL.lock() {
        pool.return_usize_buffer(buffer);
    }
}

/// Get specialized LAB color buffer
pub fn get_lab_colors_buffer(pixel_count: usize) -> Vec<(f32, f32, f32)> {
    let mut buffer = Vec::with_capacity(pixel_count);
    buffer.resize(pixel_count, (0.0, 0.0, 0.0));
    buffer
}

/// Return LAB color buffer to pool
pub fn return_lab_colors_buffer(buffer: Vec<(f32, f32, f32)>) {
    // For now, just drop it since the type is complex
    drop(buffer);
}

/// Get SLIC labels buffer from pool
pub fn get_slic_labels_buffer(pixel_count: usize) -> Vec<usize> {
    get_pooled_usize_buffer(pixel_count)
}

/// Return SLIC labels buffer to pool
pub fn return_slic_labels_buffer(buffer: Vec<usize>) {
    return_pooled_usize_buffer(buffer);
}

/// Get SLIC distances buffer from pool
pub fn get_slic_distances_buffer(pixel_count: usize) -> Vec<f32> {
    get_pooled_f32_buffer(pixel_count)
}

/// Return SLIC distances buffer to pool
pub fn return_slic_distances_buffer(buffer: Vec<f32>) {
    return_pooled_f32_buffer(buffer);
}

/// Get temporary f32 buffer from pool
pub fn get_temp_f32_buffer(size: usize) -> Vec<f32> {
    get_pooled_f32_buffer(size)
}

/// Return temporary f32 buffer to pool
pub fn return_temp_f32_buffer(buffer: Vec<f32>) {
    return_pooled_f32_buffer(buffer);
}

/// Get current pool statistics
pub fn get_pool_stats() -> PoolStats {
    match BUFFER_POOL.lock() {
        Ok(pool) => pool.get_stats(),
        Err(_) => PoolStats {
            lab_colors_count: 0,
            slic_labels_count: 0,
            slic_distances_count: 0,
            temp_f32_count: 0,
            temp_u8_count: 0,
            temp_u32_count: 0,
            total_buffers: 0,
        }
    }
}

/// Clear all pooled buffers (for debugging/testing)
pub fn clear_pool() {
    if let Ok(mut pool) = BUFFER_POOL.lock() {
        pool.lab_colors.clear();
        pool.slic_labels.clear();
        pool.slic_distances.clear();
        pool.temp_f32.clear();
        pool.temp_u8.clear();
        pool.temp_u32.clear();
        log::debug!("Memory pool cleared");
    }
}

/// Configure the memory pool
pub fn configure_pool(config: PoolConfig) {
    if let Ok(mut pool) = BUFFER_POOL.lock() {
        pool.config = config;
        log::info!("Memory pool reconfigured: {:?}", pool.config);
    }
}

/// Wrapper for zero-copy processing operations
pub struct ProcessingBuffers {
    lab_buffer: Option<Vec<(f32, f32, f32)>>,
    labels_buffer: Option<Vec<usize>>,
    distances_buffer: Option<Vec<f32>>,
    temp_f32_buffer: Option<Vec<f32>>,
}

impl ProcessingBuffers {
    /// Create a new processing buffers set
    pub fn new() -> Self {
        Self {
            lab_buffer: None,
            labels_buffer: None,
            distances_buffer: None,
            temp_f32_buffer: None,
        }
    }

    /// Get or create LAB buffer
    pub fn get_lab_buffer(&mut self, pixel_count: usize) -> &mut Vec<(f32, f32, f32)> {
        if self.lab_buffer.is_none() {
            self.lab_buffer = Some(get_lab_colors_buffer(pixel_count));
        }
        self.lab_buffer.as_mut().unwrap()
    }

    /// Get or create labels buffer
    pub fn get_labels_buffer(&mut self, pixel_count: usize) -> &mut Vec<usize> {
        if self.labels_buffer.is_none() {
            self.labels_buffer = Some(get_slic_labels_buffer(pixel_count));
        }
        let buffer = self.labels_buffer.as_mut().unwrap();
        if buffer.len() < pixel_count {
            buffer.resize(pixel_count, 0);
        }
        buffer
    }

    /// Get or create distances buffer
    pub fn get_distances_buffer(&mut self, pixel_count: usize) -> &mut Vec<f32> {
        if self.distances_buffer.is_none() {
            self.distances_buffer = Some(get_slic_distances_buffer(pixel_count));
        }
        let buffer = self.distances_buffer.as_mut().unwrap();
        if buffer.len() < pixel_count {
            buffer.resize(pixel_count, f32::INFINITY);
        }
        buffer
    }

    /// Get or create temporary f32 buffer
    pub fn get_temp_f32_buffer(&mut self, size: usize) -> &mut Vec<f32> {
        if self.temp_f32_buffer.is_none() {
            self.temp_f32_buffer = Some(get_temp_f32_buffer(size));
        }
        let buffer = self.temp_f32_buffer.as_mut().unwrap();
        if buffer.len() < size {
            buffer.resize(size, 0.0);
        }
        buffer
    }
}

impl Drop for ProcessingBuffers {
    fn drop(&mut self) {
        // Return all buffers to pools
        if let Some(buffer) = self.lab_buffer.take() {
            return_lab_colors_buffer(buffer);
        }
        if let Some(buffer) = self.labels_buffer.take() {
            return_slic_labels_buffer(buffer);
        }
        if let Some(buffer) = self.distances_buffer.take() {
            return_slic_distances_buffer(buffer);
        }
        if let Some(buffer) = self.temp_f32_buffer.take() {
            return_temp_f32_buffer(buffer);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_buffer_pool_basic() {
        clear_pool();
        
        let buffer1: Vec<f32> = get_pooled_f32_buffer(1000);
        assert_eq!(buffer1.len(), 1000);
        
        return_pooled_f32_buffer(buffer1);
        
        let stats = get_pool_stats();
        assert_eq!(stats.temp_f32_count, 1);
        
        let buffer2: Vec<f32> = get_pooled_f32_buffer(1000);
        assert_eq!(buffer2.len(), 1000);
        
        let stats = get_pool_stats();
        assert_eq!(stats.temp_f32_count, 0); // Buffer was reused
    }

    #[test]
    fn test_processing_buffers() {
        let mut buffers = ProcessingBuffers::new();
        
        let _lab_buf = buffers.get_lab_buffer(1000);
        let _labels_buf = buffers.get_labels_buffer(1000);
        let _distances_buf = buffers.get_distances_buffer(1000);
        
        // Buffers should be returned to pool when dropped
        drop(buffers);
        
        let stats = get_pool_stats();
        assert!(stats.total_buffers >= 2); // At least labels and distances were pooled
    }

    #[test]
    fn test_pool_configuration() {
        let config = PoolConfig {
            max_buffers_per_type: 4,
            max_buffer_size: 1000,
            enable_pooling: true,
        };
        
        configure_pool(config);
        
        let buffer: Vec<f32> = get_pooled_f32_buffer(100);
        return_pooled_f32_buffer(buffer);
        
        let stats = get_pool_stats();
        assert!(stats.temp_f32_count <= 4);
    }
}