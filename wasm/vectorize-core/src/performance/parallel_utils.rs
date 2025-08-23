//! Parallel processing utilities optimized for dot mapping operations
//!
//! This module provides advanced parallel processing strategies, work distribution
//! algorithms, and load balancing for optimal performance across different
//! hardware configurations.
//!
//! Uses the execution abstraction layer for cross-platform compatibility.

use crate::execution::{
    current_num_threads, execute_parallel_chunks, with_thread_pool, ThreadPoolConfig,
};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;

// Removed unused rayon import - using execution abstraction instead

/// Configuration for parallel processing strategies
#[derive(Debug, Clone)]
pub struct ParallelConfig {
    /// Number of threads to use (None = use rayon default)
    pub num_threads: Option<usize>,
    /// Minimum work size before enabling parallelization
    pub min_parallel_size: usize,
    /// Chunk size strategy
    pub chunk_strategy: ChunkStrategy,
    /// Load balancing strategy
    pub load_balance_strategy: LoadBalanceStrategy,
    /// Enable work stealing
    pub work_stealing: bool,
}

impl Default for ParallelConfig {
    fn default() -> Self {
        Self {
            num_threads: None, // Use rayon default
            min_parallel_size: 1000,
            chunk_strategy: ChunkStrategy::Dynamic,
            load_balance_strategy: LoadBalanceStrategy::WorkStealing,
            work_stealing: true,
        }
    }
}

/// Strategies for determining optimal chunk sizes
#[derive(Debug, Clone, Copy)]
pub enum ChunkStrategy {
    /// Fixed chunk size
    Fixed(usize),
    /// Dynamic chunk size based on data size and thread count
    Dynamic,
    /// Adaptive chunk size that adjusts based on processing time
    Adaptive,
}

/// Load balancing strategies
#[derive(Debug, Clone, Copy)]
pub enum LoadBalanceStrategy {
    /// Simple even distribution
    EvenDistribution,
    /// Work stealing for dynamic load balancing
    WorkStealing,
    /// Weighted distribution based on processing complexity
    WeightedDistribution,
}

/// Parallel processing context with performance monitoring
pub struct ParallelContext {
    config: ParallelConfig,
    work_completed: AtomicUsize,
    total_work: AtomicUsize,
}

impl ParallelContext {
    /// Create a new parallel context
    pub fn new(config: ParallelConfig) -> Self {
        Self {
            config,
            work_completed: AtomicUsize::new(0),
            total_work: AtomicUsize::new(0),
        }
    }

    /// Calculate optimal chunk size based on data size and strategy
    pub fn calculate_chunk_size(&self, data_size: usize) -> usize {
        let num_threads = self.config.num_threads.unwrap_or_else(current_num_threads);

        match self.config.chunk_strategy {
            ChunkStrategy::Fixed(size) => size,
            ChunkStrategy::Dynamic => {
                // Target 4 chunks per thread for good load balancing
                let target_chunks = num_threads * 4;
                (data_size / target_chunks)
                    .max(1)
                    .min(data_size.max(1) / num_threads.max(1))
                    .max(1) // Ensure we never return 0
            }
            ChunkStrategy::Adaptive => {
                // Start with dynamic, can be adjusted based on runtime performance
                let base_chunk = data_size / (num_threads * 4);
                base_chunk.clamp(1, data_size.max(1) / 2).max(1) // Ensure never 0, min 1, max half data size
            }
        }
    }

    /// Check if parallel processing should be used
    pub fn should_use_parallel(&self, data_size: usize) -> bool {
        data_size >= self.config.min_parallel_size && current_num_threads() > 1
    }

    /// Record work completion for progress tracking
    pub fn record_work_completed(&self, amount: usize) {
        self.work_completed.fetch_add(amount, Ordering::Relaxed);
    }

    /// Set total work amount
    pub fn set_total_work(&self, total: usize) {
        self.total_work.store(total, Ordering::Relaxed);
        self.work_completed.store(0, Ordering::Relaxed);
    }

    /// Get current progress (0.0 to 1.0)
    pub fn get_progress(&self) -> f64 {
        let completed = self.work_completed.load(Ordering::Relaxed);
        let total = self.total_work.load(Ordering::Relaxed);
        if total == 0 {
            0.0
        } else {
            (completed as f64 / total as f64).min(1.0)
        }
    }
}

/// Optimized parallel iterator for pixel processing
pub struct PixelProcessor {
    context: Arc<ParallelContext>,
}

impl PixelProcessor {
    /// Create a new pixel processor
    pub fn new(config: ParallelConfig) -> Self {
        Self {
            context: Arc::new(ParallelContext::new(config)),
        }
    }

    /// Process pixels in parallel with optimal chunking
    pub fn process_pixels<F, R>(&self, width: u32, height: u32, processor: F) -> Vec<R>
    where
        F: Fn(u32, u32) -> R + Send + Sync,
        R: Send,
    {
        let total_pixels = (width * height) as usize;
        self.context.set_total_work(total_pixels);

        if !self.context.should_use_parallel(total_pixels) {
            // Sequential processing
            let mut results = Vec::with_capacity(total_pixels);
            for y in 0..height {
                for x in 0..width {
                    results.push(processor(x, y));
                    self.context.record_work_completed(1);
                }
            }
            return results;
        }

        // Parallel processing
        let chunk_size = self.context.calculate_chunk_size(total_pixels);
        let pixel_coords: Vec<(u32, u32)> = (0..height)
            .flat_map(|y| (0..width).map(move |x| (x, y)))
            .collect();

        let context = Arc::clone(&self.context);
        let results: Vec<R> = execute_parallel_chunks(pixel_coords, chunk_size, |chunk| {
            let chunk_results: Vec<R> = chunk.iter().map(|&(x, y)| processor(x, y)).collect();
            context.record_work_completed(chunk.len());
            chunk_results
        })
        .into_iter()
        .flatten()
        .collect();

        results
    }

    /// Process pixels with conditional parallel execution
    pub fn process_pixels_conditional<F, R>(
        &self,
        width: u32,
        height: u32,
        processor: F,
        parallel_threshold: Option<usize>,
    ) -> Vec<R>
    where
        F: Fn(u32, u32) -> R + Send + Sync + Clone,
        R: Send,
    {
        let total_pixels = (width * height) as usize;
        let threshold = parallel_threshold.unwrap_or(self.context.config.min_parallel_size);

        if total_pixels < threshold {
            // Always use sequential for small images
            let mut results = Vec::with_capacity(total_pixels);
            for y in 0..height {
                for x in 0..width {
                    results.push(processor(x, y));
                }
            }
            results
        } else {
            self.process_pixels(width, height, processor)
        }
    }

    /// Get current processing progress
    pub fn get_progress(&self) -> f64 {
        self.context.get_progress()
    }
}

/// Adaptive work distributor that adjusts chunk sizes based on performance
pub struct AdaptiveWorkDistributor {
    initial_chunk_size: usize,
    performance_history: Vec<f64>, // Operations per second history
    adaptation_factor: f64,
}

impl AdaptiveWorkDistributor {
    /// Create a new adaptive work distributor
    pub fn new(initial_chunk_size: usize) -> Self {
        Self {
            initial_chunk_size,
            performance_history: Vec::new(),
            adaptation_factor: 1.1, // 10% adjustment
        }
    }

    /// Calculate adaptive chunk size based on performance history
    pub fn calculate_adaptive_chunk_size(&self, data_size: usize, num_threads: usize) -> usize {
        if self.performance_history.len() < 2 {
            return self.initial_chunk_size;
        }

        // Analyze performance trend
        let recent_performance = self
            .performance_history
            .iter()
            .rev()
            .take(3)
            .copied()
            .collect::<Vec<f64>>();

        let _avg_recent = recent_performance.iter().sum::<f64>() / recent_performance.len() as f64;
        let trend = if recent_performance.len() >= 2 {
            recent_performance[0] - recent_performance[recent_performance.len() - 1]
        } else {
            0.0
        };

        // Adjust chunk size based on trend
        let adjustment = if trend > 0.0 {
            // Performance is improving, keep current strategy
            1.0
        } else if trend < 0.0 {
            // Performance is degrading, adjust chunk size
            if self.initial_chunk_size > 100 {
                1.0 / self.adaptation_factor // Reduce chunk size
            } else {
                self.adaptation_factor // Increase chunk size
            }
        } else {
            1.0 // No change
        };

        let base_chunk_size = data_size / (num_threads * 4);
        let adaptive_chunk = (self.initial_chunk_size as f64 * adjustment) as usize;

        adaptive_chunk.clamp(base_chunk_size / 4, base_chunk_size * 4)
    }

    /// Record performance measurement
    pub fn record_performance(&mut self, ops_per_second: f64) {
        self.performance_history.push(ops_per_second);

        // Keep only recent history
        if self.performance_history.len() > 10 {
            self.performance_history.remove(0);
        }
    }

    /// Reset performance history
    pub fn reset(&mut self) {
        self.performance_history.clear();
    }
}

/// Parallel gradient calculation with optimized memory access patterns
pub fn parallel_gradient_calculation<F>(
    data: &[u8],
    width: usize,
    height: usize,
    gradient_fn: F,
    config: &ParallelConfig,
) -> Vec<f32>
where
    F: Fn(&[u8], usize, usize, usize, usize) -> f32 + Send + Sync + Clone,
{
    let total_pixels = width * height;

    if total_pixels < config.min_parallel_size {
        // Sequential processing
        let mut results = Vec::with_capacity(total_pixels);
        for y in 0..height {
            for x in 0..width {
                results.push(gradient_fn(data, width, height, x, y));
            }
        }
        return results;
    }

    // Parallel processing with row-wise distribution for better cache locality
    let chunk_size = ParallelContext::new(config.clone()).calculate_chunk_size(height);
    let rows: Vec<usize> = (0..height).collect();

    execute_parallel_chunks(rows, chunk_size, |row_chunk| {
        let mut results = Vec::with_capacity(row_chunk.len() * width);
        for &y in row_chunk {
            for x in 0..width {
                results.push(gradient_fn(data, width, height, x, y));
            }
        }
        results
    })
    .into_iter()
    .flatten()
    .collect()
}

/// Parallel color distance calculation with SIMD-friendly data layout
pub fn parallel_color_distances<F>(
    colors1: &[(u8, u8, u8)],
    colors2: &[(u8, u8, u8)],
    distance_fn: F,
    config: &ParallelConfig,
) -> Vec<f32>
where
    F: Fn(&(u8, u8, u8), &(u8, u8, u8)) -> f32 + Send + Sync,
{
    let data_len = colors1.len().min(colors2.len());

    if data_len < config.min_parallel_size {
        return colors1
            .iter()
            .zip(colors2.iter())
            .map(|(c1, c2)| distance_fn(c1, c2))
            .collect();
    }

    let chunk_size = ParallelContext::new(config.clone()).calculate_chunk_size(data_len);
    type ColorPair = ((u8, u8, u8), (u8, u8, u8));
    let paired_data: Vec<ColorPair> = colors1
        .iter()
        .zip(colors2.iter())
        .map(|(c1, c2)| (*c1, *c2))
        .collect();

    execute_parallel_chunks(paired_data, chunk_size, |chunk| {
        chunk
            .iter()
            .map(|(c1, c2)| distance_fn(c1, c2))
            .collect::<Vec<f32>>()
    })
    .into_iter()
    .flatten()
    .collect()
}

/// Parallel dot collision detection with spatial partitioning
pub fn parallel_spatial_queries<T, F>(
    items: &[T],
    query_fn: F,
    config: &ParallelConfig,
) -> Vec<bool>
where
    T: Send + Sync,
    F: Fn(&T, &[T]) -> bool + Send + Sync,
{
    let data_len = items.len();

    if data_len < config.min_parallel_size {
        return items.iter().map(|item| query_fn(item, items)).collect();
    }

    let chunk_size = ParallelContext::new(config.clone()).calculate_chunk_size(data_len);
    let indices: Vec<usize> = (0..data_len).collect();

    execute_parallel_chunks(indices, chunk_size, |chunk_indices| {
        chunk_indices
            .iter()
            .map(|&i| query_fn(&items[i], items))
            .collect::<Vec<bool>>()
    })
    .into_iter()
    .flatten()
    .collect()
}

/// Thread pool manager for fine-grained control over parallel execution
pub struct ThreadPoolManager {
    config: ParallelConfig,
    thread_config: ThreadPoolConfig,
}

impl ThreadPoolManager {
    /// Create a new thread pool manager
    pub fn new(config: ParallelConfig) -> Self {
        let thread_config = ThreadPoolConfig {
            num_threads: config.num_threads,
            stack_size: None,
            thread_name: Some("dot-mapping-worker".to_string()),
        };

        Self {
            config,
            thread_config,
        }
    }

    /// Execute work on the managed thread pool
    pub fn execute<F, R>(&self, work: F) -> R
    where
        F: FnOnce() -> R + Send,
        R: Send,
    {
        with_thread_pool(&self.thread_config, work)
    }

    /// Get thread pool statistics
    pub fn stats(&self) -> ThreadPoolStats {
        let num_threads = current_num_threads();

        ThreadPoolStats {
            num_threads,
            has_dedicated_pool: self.config.num_threads.is_some(),
            work_stealing_enabled: self.config.work_stealing,
        }
    }
}

/// Thread pool statistics
#[derive(Debug, Clone)]
pub struct ThreadPoolStats {
    pub num_threads: usize,
    pub has_dedicated_pool: bool,
    pub work_stealing_enabled: bool,
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{Duration, Instant};

    #[test]
    fn test_parallel_config_defaults() {
        let config = ParallelConfig::default();
        assert!(config.num_threads.is_none());
        assert_eq!(config.min_parallel_size, 1000);
        assert!(matches!(config.chunk_strategy, ChunkStrategy::Dynamic));
        assert!(config.work_stealing);
    }

    #[test]
    fn test_parallel_context_chunk_calculation() {
        let config = ParallelConfig::default();
        let context = ParallelContext::new(config);

        let chunk_size = context.calculate_chunk_size(10000);
        assert!(chunk_size > 0);
        assert!(chunk_size <= 10000);
    }

    #[test]
    fn test_parallel_context_progress_tracking() {
        let config = ParallelConfig::default();
        let context = ParallelContext::new(config);

        context.set_total_work(100);
        assert_eq!(context.get_progress(), 0.0);

        context.record_work_completed(50);
        assert_eq!(context.get_progress(), 0.5);

        context.record_work_completed(50);
        assert_eq!(context.get_progress(), 1.0);
    }

    #[test]
    fn test_pixel_processor() {
        let config = ParallelConfig {
            min_parallel_size: 0, // Force parallel processing
            ..Default::default()
        };
        let processor = PixelProcessor::new(config);

        let width = 10u32;
        let height = 10u32;

        let results = processor.process_pixels(width, height, |x, y| (x + y) as usize);

        assert_eq!(results.len(), 100);
        assert_eq!(results[0], 0); // (0,0)
        assert_eq!(results[11], 2); // (1,1)
        assert_eq!(results[99], 18); // (9,9)
    }

    #[test]
    fn test_pixel_processor_sequential_threshold() {
        let config = ParallelConfig {
            min_parallel_size: 1000, // High threshold
            ..Default::default()
        };
        let processor = PixelProcessor::new(config);

        let results = processor.process_pixels(5u32, 5u32, |x, y| x + y);
        assert_eq!(results.len(), 25);
    }

    #[test]
    fn test_adaptive_work_distributor() {
        let mut distributor = AdaptiveWorkDistributor::new(100);

        // Initial chunk size should be based on initial value
        let chunk_size = distributor.calculate_adaptive_chunk_size(10000, 4);
        assert!(chunk_size > 0);

        // Record performance and check adaptation
        distributor.record_performance(1000.0);
        distributor.record_performance(900.0); // Declining performance

        let new_chunk_size = distributor.calculate_adaptive_chunk_size(10000, 4);
        // Should adapt based on performance trend
        assert!(new_chunk_size != chunk_size);
    }

    #[test]
    fn test_parallel_gradient_calculation() {
        let data = vec![0u8, 128, 255, 128, 64, 192, 32, 160, 96];
        let width = 3;
        let height = 3;
        let config = ParallelConfig::default();

        let results = parallel_gradient_calculation(
            &data,
            width,
            height,
            |data, w, h, x, y| {
                // Simple gradient calculation
                if x > 0 && x < w - 1 && y > 0 && y < h - 1 {
                    let idx = y * w + x;
                    data[idx] as f32
                } else {
                    0.0
                }
            },
            &config,
        );

        assert_eq!(results.len(), 9);
    }

    #[test]
    fn test_parallel_color_distances() {
        let colors1 = vec![(255, 0, 0), (0, 255, 0), (0, 0, 255)];
        let colors2 = vec![(255, 0, 0), (128, 255, 0), (0, 0, 128)];
        let config = ParallelConfig {
            min_parallel_size: 0, // Force parallel
            ..Default::default()
        };

        let distances = parallel_color_distances(
            &colors1,
            &colors2,
            |c1, c2| {
                let dr = (c1.0 as f32) - (c2.0 as f32);
                let dg = (c1.1 as f32) - (c2.1 as f32);
                let db = (c1.2 as f32) - (c2.2 as f32);
                (dr * dr + dg * dg + db * db).sqrt()
            },
            &config,
        );

        assert_eq!(distances.len(), 3);
        assert_eq!(distances[0], 0.0); // Same color
        assert!(distances[1] > 0.0); // Different colors
        assert!(distances[2] > 0.0);
    }

    #[test]
    fn test_parallel_spatial_queries() {
        let items = vec![1, 2, 3, 4, 5];
        let config = ParallelConfig {
            min_parallel_size: 0, // Force parallel
            ..Default::default()
        };

        let results = parallel_spatial_queries(
            &items,
            |item, all_items| *item > all_items.len() / 2, // Item value > half of array length
            &config,
        );

        assert_eq!(results.len(), 5);
        assert!(!results[0]); // 1 <= 2.5
        assert!(!results[1]); // 2 <= 2.5
        assert!(results[2]); // 3 > 2.5
        assert!(results[3]); // 4 > 2.5
        assert!(results[4]); // 5 > 2.5
    }

    #[test]
    fn test_thread_pool_manager() {
        let config = ParallelConfig {
            num_threads: Some(2),
            ..Default::default()
        };
        let manager = ThreadPoolManager::new(config);

        let result = manager.execute(|| {
            #[cfg(feature = "parallel")]
            {
                use rayon::prelude::*;
                (0..1000).into_par_iter().sum::<usize>()
            }
            #[cfg(not(feature = "parallel"))]
            {
                (0..1000).sum::<usize>()
            }
        });

        assert_eq!(result, 499500);

        let stats = manager.stats();
        assert!(stats.has_dedicated_pool);
        assert!(stats.work_stealing_enabled);
    }

    #[test]
    fn test_chunk_strategies() {
        let config_fixed = ParallelConfig {
            chunk_strategy: ChunkStrategy::Fixed(100),
            ..Default::default()
        };
        let context_fixed = ParallelContext::new(config_fixed);
        assert_eq!(context_fixed.calculate_chunk_size(10000), 100);

        let config_dynamic = ParallelConfig {
            chunk_strategy: ChunkStrategy::Dynamic,
            ..Default::default()
        };
        let context_dynamic = ParallelContext::new(config_dynamic);
        let dynamic_chunk = context_dynamic.calculate_chunk_size(10000);
        assert!(dynamic_chunk > 0 && dynamic_chunk <= 10000);

        let config_adaptive = ParallelConfig {
            chunk_strategy: ChunkStrategy::Adaptive,
            ..Default::default()
        };
        let context_adaptive = ParallelContext::new(config_adaptive);
        let adaptive_chunk = context_adaptive.calculate_chunk_size(10000);
        assert!((100..=5000).contains(&adaptive_chunk));
    }

    #[test]
    fn test_performance_measurement() {
        let config = ParallelConfig::default();
        let processor = PixelProcessor::new(config);

        let start = Instant::now();
        let _results = processor.process_pixels(100u32, 100u32, |x, y| {
            // Simulate some work
            (x * y) % 1000
        });
        let duration = start.elapsed();

        // Should complete reasonably quickly
        assert!(duration < Duration::from_secs(1));
    }

    #[test]
    fn test_conditional_parallel_execution() {
        let config = ParallelConfig {
            min_parallel_size: 100,
            ..Default::default()
        };
        let processor = PixelProcessor::new(config);

        // Small image - should use sequential
        let small_results =
            processor.process_pixels_conditional(5u32, 5u32, |x, y| x + y, Some(30));
        assert_eq!(small_results.len(), 25);

        // Large image - should use parallel
        let large_results =
            processor.process_pixels_conditional(20u32, 20u32, |x, y| x + y, Some(30));
        assert_eq!(large_results.len(), 400);
    }
}
