//! Performance optimization module for dot-based pixel mapping
//!
//! This module provides comprehensive performance optimizations including:
//! - Memory pooling for frequently allocated objects
//! - Spatial indexing for efficient proximity queries
//! - SIMD optimizations for mathematical operations
//! - Performance profiling and benchmarking utilities
//! - Optimized parallel processing strategies

pub mod memory_pool;
pub mod parallel_utils;
pub mod profiler;
pub mod simd_ops;
pub mod spatial_index;

use crate::execution::current_num_threads;
use std::time::Duration;

/// Performance configuration for dot mapping operations
#[derive(Debug, Clone)]
pub struct PerformanceConfig {
    /// Enable memory pooling for dot allocation
    pub use_memory_pooling: bool,
    /// Enable SIMD optimizations where available
    pub use_simd: bool,
    /// Enable spatial indexing for collision detection
    pub use_spatial_indexing: bool,
    /// Parallel processing threshold (pixel count)
    pub parallel_threshold: usize,
    /// Number of worker threads for parallel operations
    pub num_threads: Option<usize>,
    /// Enable performance profiling
    pub enable_profiling: bool,
}

impl Default for PerformanceConfig {
    fn default() -> Self {
        Self {
            use_memory_pooling: true,
            use_simd: true,
            use_spatial_indexing: true,
            parallel_threshold: 10000,
            num_threads: None, // Use execution abstraction default
            enable_profiling: false,
        }
    }
}

/// High-performance alternatives configuration
pub struct OptimizationLevel {
    /// Conservative: Safe optimizations with minimal risk
    pub conservative: PerformanceConfig,
    /// Aggressive: All optimizations enabled for maximum performance
    pub aggressive: PerformanceConfig,
    /// Memory optimized: Focus on reducing memory allocations
    pub memory_optimized: PerformanceConfig,
    /// CPU optimized: Focus on computational efficiency
    pub cpu_optimized: PerformanceConfig,
}

impl Default for OptimizationLevel {
    fn default() -> Self {
        Self {
            conservative: PerformanceConfig {
                use_memory_pooling: true,
                use_simd: false, // Conservative: avoid potential compatibility issues
                use_spatial_indexing: true,
                parallel_threshold: 50000, // Higher threshold
                num_threads: None,
                enable_profiling: false,
            },
            aggressive: PerformanceConfig {
                use_memory_pooling: true,
                use_simd: true,
                use_spatial_indexing: true,
                parallel_threshold: 1000, // Lower threshold for more parallelization
                num_threads: None,
                enable_profiling: false,
            },
            memory_optimized: PerformanceConfig {
                use_memory_pooling: true,
                use_simd: false, // SIMD might use more memory
                use_spatial_indexing: true,
                parallel_threshold: 25000,
                num_threads: Some(2), // Fewer threads to reduce memory pressure
                enable_profiling: false,
            },
            cpu_optimized: PerformanceConfig {
                use_memory_pooling: true,
                use_simd: true,
                use_spatial_indexing: true,
                parallel_threshold: 5000,
                num_threads: None, // Use all available cores from execution abstraction
                enable_profiling: false,
            },
        }
    }
}

/// Global performance statistics
#[derive(Debug, Clone, Default)]
pub struct PerformanceStats {
    pub total_operations: u64,
    pub total_time: Duration,
    pub memory_allocations: u64,
    pub cache_hits: u64,
    pub cache_misses: u64,
    pub simd_operations: u64,
    pub parallel_operations: u64,
}

impl PerformanceStats {
    /// Calculate operations per second
    pub fn ops_per_second(&self) -> f64 {
        if self.total_time.is_zero() {
            0.0
        } else {
            self.total_operations as f64 / self.total_time.as_secs_f64()
        }
    }

    /// Calculate cache hit ratio
    pub fn cache_hit_ratio(&self) -> f64 {
        let total_cache_ops = self.cache_hits + self.cache_misses;
        if total_cache_ops == 0 {
            0.0
        } else {
            self.cache_hits as f64 / total_cache_ops as f64
        }
    }

    /// Calculate average operation time
    pub fn avg_operation_time(&self) -> Duration {
        if self.total_operations == 0 {
            Duration::ZERO
        } else {
            self.total_time / self.total_operations as u32
        }
    }

    /// Merge with other stats
    pub fn merge(&mut self, other: &PerformanceStats) {
        self.total_operations += other.total_operations;
        self.total_time += other.total_time;
        self.memory_allocations += other.memory_allocations;
        self.cache_hits += other.cache_hits;
        self.cache_misses += other.cache_misses;
        self.simd_operations += other.simd_operations;
        self.parallel_operations += other.parallel_operations;
    }
}

/// Performance optimizations utility functions
pub struct PerformanceUtils;

impl PerformanceUtils {
    /// Determine optimal chunk size for parallel processing based on image size
    pub fn optimal_chunk_size(total_pixels: usize, num_threads: usize) -> usize {
        let base_chunk_size = 1000; // Minimum chunk size
        let target_chunks_per_thread = 4; // Allow for load balancing
        let ideal_chunk_size = total_pixels / (num_threads * target_chunks_per_thread);
        ideal_chunk_size.max(base_chunk_size).min(10000) // Cap at reasonable maximum
    }

    /// Estimate memory usage for dot mapping operation
    pub fn estimate_memory_usage(
        width: u32,
        height: u32,
        estimated_dots: usize,
        config: &PerformanceConfig,
    ) -> usize {
        let total_pixels = (width * height) as usize;

        // Base memory usage
        let mut memory = 0;

        // Gradient analysis
        memory += total_pixels * 8; // magnitude and variance (f32 each)

        // Background mask
        memory += total_pixels; // bool array

        // Dots storage
        memory += estimated_dots * 64; // Estimated Dot struct size

        // Spatial indexing overhead
        if config.use_spatial_indexing {
            let grid_cells = (width / 10) * (height / 10); // Rough estimate
            memory += grid_cells as usize * 16; // Vec<usize> per cell
        }

        // Memory pool overhead
        if config.use_memory_pooling {
            memory += estimated_dots * 64; // Pool pre-allocation
        }

        memory
    }

    /// Check if SIMD is available and beneficial for the given data size
    pub fn should_use_simd(data_size: usize) -> bool {
        // SIMD is beneficial for larger datasets
        // Also check if SIMD is available on the target architecture
        data_size >= 256 && cfg!(target_feature = "sse2")
    }

    /// Calculate optimal parallel threshold based on system capabilities
    pub fn calculate_optimal_parallel_threshold() -> usize {
        let num_cpus = current_num_threads();
        let base_threshold = 1000;

        // Scale threshold based on CPU count
        // More CPUs can handle smaller work units efficiently
        #[cfg(feature = "parallel")]
        {
            match num_cpus {
                1 => usize::MAX, // Disable parallelization on single core
                2..=4 => base_threshold * 10,
                5..=8 => base_threshold * 5,
                9..=16 => base_threshold * 2,
                _ => base_threshold,
            }
        }
        #[cfg(not(feature = "parallel"))]
        {
            usize::MAX // Disable parallelization in single-threaded mode
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_performance_config_defaults() {
        let config = PerformanceConfig::default();
        assert!(config.use_memory_pooling);
        assert!(config.use_simd);
        assert!(config.use_spatial_indexing);
        assert_eq!(config.parallel_threshold, 10000);
        assert!(!config.enable_profiling);
    }

    #[test]
    fn test_optimization_levels() {
        let levels = OptimizationLevel::default();

        // Conservative should have higher thresholds
        assert!(levels.conservative.parallel_threshold > levels.aggressive.parallel_threshold);

        // Aggressive should enable all optimizations
        assert!(levels.aggressive.use_simd);
        assert!(levels.aggressive.use_spatial_indexing);
        assert!(levels.aggressive.use_memory_pooling);
    }

    #[test]
    fn test_performance_stats() {
        let stats = PerformanceStats {
            total_operations: 1000,
            total_time: Duration::from_secs(2),
            cache_hits: 80,
            cache_misses: 20,
            ..Default::default()
        };

        assert_eq!(stats.ops_per_second(), 500.0);
        assert_eq!(stats.cache_hit_ratio(), 0.8);
        assert_eq!(stats.avg_operation_time(), Duration::from_millis(2));
    }

    #[test]
    fn test_optimal_chunk_size() {
        let chunk_size = PerformanceUtils::optimal_chunk_size(100000, 4);
        assert!(chunk_size >= 1000);
        assert!(chunk_size <= 10000);

        // Should scale with thread count
        let chunk_size_more_threads = PerformanceUtils::optimal_chunk_size(100000, 8);
        assert!(chunk_size_more_threads <= chunk_size);
    }

    #[test]
    fn test_memory_estimation() {
        let config = PerformanceConfig::default();
        let memory = PerformanceUtils::estimate_memory_usage(500, 500, 1000, &config);

        // Should account for all major components
        assert!(memory > 250000 * 8); // At least gradient analysis memory
        assert!(memory < 10_000_000); // Reasonable upper bound
    }

    #[test]
    fn test_simd_availability_check() {
        // Small data shouldn't use SIMD
        assert!(!PerformanceUtils::should_use_simd(100));

        // Large data should use SIMD if available
        let should_use = PerformanceUtils::should_use_simd(10000);
        // Result depends on target architecture
        #[cfg(target_feature = "sse2")]
        assert!(should_use);
        #[cfg(not(target_feature = "sse2"))]
        assert!(!should_use);
    }

    #[test]
    fn test_parallel_threshold_calculation() {
        let threshold = PerformanceUtils::calculate_optimal_parallel_threshold();
        assert!(threshold >= 1000);

        // Should be finite (not disabled)
        assert!(threshold < usize::MAX);
    }
}
