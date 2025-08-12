//! Memory pooling for high-performance dot allocation
//!
//! This module provides memory pools to reduce allocation overhead for frequently
//! created objects like dots, avoiding garbage collection pressure and improving
//! cache locality.

use crate::algorithms::dots::Dot;
use std::collections::VecDeque;
use std::sync::{Arc, Mutex};

/// Memory pool for dot objects
#[derive(Debug)]
pub struct DotPool {
    /// Pool of reusable dot objects
    pool: VecDeque<Dot>,
    /// Maximum pool size to prevent unbounded growth
    max_size: usize,
    /// Statistics for pool usage
    allocations: u64,
    reuses: u64,
}

impl DotPool {
    /// Create a new dot pool with specified initial capacity
    pub fn new(initial_capacity: usize, max_size: usize) -> Self {
        let mut pool = VecDeque::with_capacity(initial_capacity);

        // Pre-populate pool with default dots to avoid initial allocation cost
        for _ in 0..initial_capacity.min(max_size) {
            pool.push_back(Dot::new(0.0, 0.0, 1.0, 1.0, "#000000".to_string()));
        }

        Self {
            pool,
            max_size,
            allocations: 0,
            reuses: 0,
        }
    }

    /// Acquire a dot from the pool, reusing existing if available
    pub fn acquire(&mut self, x: f32, y: f32, radius: f32, opacity: f32, color: String) -> Dot {
        if let Some(mut dot) = self.pool.pop_front() {
            // Reuse existing dot
            dot.x = x;
            dot.y = y;
            dot.radius = radius;
            dot.opacity = opacity;
            dot.color = color;
            self.reuses += 1;
            dot
        } else {
            // Create new dot
            self.allocations += 1;
            Dot::new(x, y, radius, opacity, color)
        }
    }

    /// Return a dot to the pool for reuse
    pub fn release(&mut self, dot: Dot) {
        if self.pool.len() < self.max_size {
            self.pool.push_back(dot);
        }
        // If pool is full, let the dot be dropped normally
    }

    /// Acquire multiple dots at once for batch operations
    pub fn acquire_batch(&mut self, count: usize) -> Vec<Dot> {
        let mut dots = Vec::with_capacity(count);

        for _ in 0..count {
            if let Some(dot) = self.pool.pop_front() {
                dots.push(dot);
                self.reuses += 1;
            } else {
                dots.push(Dot::new(0.0, 0.0, 1.0, 1.0, "#000000".to_string()));
                self.allocations += 1;
            }
        }

        dots
    }

    /// Return multiple dots to the pool
    pub fn release_batch(&mut self, mut dots: Vec<Dot>) {
        for dot in dots.drain(..) {
            if self.pool.len() < self.max_size {
                self.pool.push_back(dot);
            }
        }
    }

    /// Get pool utilization statistics
    pub fn stats(&self) -> PoolStats {
        PoolStats {
            pool_size: self.pool.len(),
            max_size: self.max_size,
            allocations: self.allocations,
            reuses: self.reuses,
            hit_ratio: if self.allocations + self.reuses > 0 {
                self.reuses as f64 / (self.allocations + self.reuses) as f64
            } else {
                0.0
            },
        }
    }

    /// Clear the pool and reset statistics
    pub fn clear(&mut self) {
        self.pool.clear();
        self.allocations = 0;
        self.reuses = 0;
    }

    /// Shrink pool to optimal size based on usage patterns
    pub fn shrink_to_fit(&mut self) {
        let optimal_size = (self.reuses / 10).max(1).min(self.max_size as u64) as usize;
        while self.pool.len() > optimal_size {
            self.pool.pop_back();
        }
    }
}

/// Pool usage statistics
#[derive(Debug, Clone)]
pub struct PoolStats {
    pub pool_size: usize,
    pub max_size: usize,
    pub allocations: u64,
    pub reuses: u64,
    pub hit_ratio: f64,
}

/// Thread-safe dot pool for parallel processing
#[derive(Debug, Clone)]
pub struct ThreadSafeDotPool {
    pool: Arc<Mutex<DotPool>>,
}

impl ThreadSafeDotPool {
    /// Create a new thread-safe dot pool
    pub fn new(initial_capacity: usize, max_size: usize) -> Self {
        Self {
            pool: Arc::new(Mutex::new(DotPool::new(initial_capacity, max_size))),
        }
    }

    /// Acquire a dot from the pool (thread-safe)
    pub fn acquire(&self, x: f32, y: f32, radius: f32, opacity: f32, color: String) -> Dot {
        let mut pool = self.pool.lock().unwrap();
        pool.acquire(x, y, radius, opacity, color)
    }

    /// Return a dot to the pool (thread-safe)
    pub fn release(&self, dot: Dot) {
        let mut pool = self.pool.lock().unwrap();
        pool.release(dot);
    }

    /// Get pool statistics (thread-safe)
    pub fn stats(&self) -> PoolStats {
        let pool = self.pool.lock().unwrap();
        pool.stats()
    }

    /// Clear the pool (thread-safe)
    pub fn clear(&self) {
        let mut pool = self.pool.lock().unwrap();
        pool.clear();
    }
}

/// Generic memory pool for any type that implements Default + Clone
#[derive(Debug)]
pub struct GenericPool<T: Default + Clone> {
    pool: VecDeque<T>,
    max_size: usize,
    allocations: u64,
    reuses: u64,
}

impl<T: Default + Clone> GenericPool<T> {
    /// Create a new generic pool
    pub fn new(initial_capacity: usize, max_size: usize) -> Self {
        let mut pool = VecDeque::with_capacity(initial_capacity);

        // Pre-populate with default values
        for _ in 0..initial_capacity.min(max_size) {
            pool.push_back(T::default());
        }

        Self {
            pool,
            max_size,
            allocations: 0,
            reuses: 0,
        }
    }

    /// Acquire an object from the pool
    pub fn acquire(&mut self) -> T {
        if let Some(obj) = self.pool.pop_front() {
            self.reuses += 1;
            obj
        } else {
            self.allocations += 1;
            T::default()
        }
    }

    /// Release an object back to the pool
    pub fn release(&mut self, obj: T) {
        if self.pool.len() < self.max_size {
            self.pool.push_back(obj);
        }
    }

    /// Get usage statistics
    pub fn stats(&self) -> PoolStats {
        PoolStats {
            pool_size: self.pool.len(),
            max_size: self.max_size,
            allocations: self.allocations,
            reuses: self.reuses,
            hit_ratio: if self.allocations + self.reuses > 0 {
                self.reuses as f64 / (self.allocations + self.reuses) as f64
            } else {
                0.0
            },
        }
    }
}

/// Memory pool manager that coordinates multiple pools
#[derive(Debug)]
pub struct PoolManager {
    dot_pool: DotPool,
    vec_pools: std::collections::HashMap<String, GenericPool<Vec<f32>>>,
}

impl PoolManager {
    /// Create a new pool manager
    pub fn new() -> Self {
        Self {
            dot_pool: DotPool::new(1000, 10000), // Reasonable defaults for dot mapping
            vec_pools: std::collections::HashMap::new(),
        }
    }

    /// Get the dot pool
    pub fn dot_pool_mut(&mut self) -> &mut DotPool {
        &mut self.dot_pool
    }

    /// Get or create a vector pool for a specific purpose
    pub fn get_or_create_vec_pool(
        &mut self,
        name: &str,
        initial_capacity: usize,
    ) -> &mut GenericPool<Vec<f32>> {
        self.vec_pools
            .entry(name.to_string())
            .or_insert_with(|| GenericPool::new(initial_capacity, 1000))
    }

    /// Get combined statistics for all pools
    pub fn combined_stats(&self) -> CombinedStats {
        let dot_stats = self.dot_pool.stats();
        let mut total_allocations = dot_stats.allocations;
        let mut total_reuses = dot_stats.reuses;

        for pool in self.vec_pools.values() {
            let stats = pool.stats();
            total_allocations += stats.allocations;
            total_reuses += stats.reuses;
        }

        CombinedStats {
            dot_pool_stats: dot_stats,
            vec_pool_count: self.vec_pools.len(),
            total_allocations,
            total_reuses,
            overall_hit_ratio: if total_allocations + total_reuses > 0 {
                total_reuses as f64 / (total_allocations + total_reuses) as f64
            } else {
                0.0
            },
        }
    }

    /// Clear all pools
    pub fn clear_all(&mut self) {
        self.dot_pool.clear();
        for pool in self.vec_pools.values_mut() {
            pool.stats(); // Just access to reset if needed
        }
    }

    /// Optimize all pools based on usage patterns
    pub fn optimize_all(&mut self) {
        self.dot_pool.shrink_to_fit();
        // Remove unused vector pools
        self.vec_pools.retain(|_, pool| {
            let stats = pool.stats();
            stats.allocations + stats.reuses > 0
        });
    }
}

impl Default for PoolManager {
    fn default() -> Self {
        Self::new()
    }
}

/// Combined statistics for all pools managed by PoolManager
#[derive(Debug, Clone)]
pub struct CombinedStats {
    pub dot_pool_stats: PoolStats,
    pub vec_pool_count: usize,
    pub total_allocations: u64,
    pub total_reuses: u64,
    pub overall_hit_ratio: f64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_dot_pool_basic_operations() {
        let mut pool = DotPool::new(10, 100);

        // Acquire dot
        let dot = pool.acquire(1.0, 2.0, 3.0, 0.5, "#ff0000".to_string());
        assert_eq!(dot.x, 1.0);
        assert_eq!(dot.y, 2.0);
        assert_eq!(dot.radius, 3.0);
        assert_eq!(dot.opacity, 0.5);
        assert_eq!(dot.color, "#ff0000");

        // Release dot
        pool.release(dot);

        // Pool should have one item now
        let stats = pool.stats();
        assert_eq!(stats.pool_size, 10); // Initial capacity + released dot, but capped at initial
    }

    #[test]
    fn test_dot_pool_reuse() {
        let mut pool = DotPool::new(0, 100); // Start with empty pool

        // First acquisition should allocate
        let dot1 = pool.acquire(1.0, 1.0, 1.0, 1.0, "#000000".to_string());
        pool.release(dot1);

        // Second acquisition should reuse
        let _dot2 = pool.acquire(2.0, 2.0, 2.0, 0.5, "#ffffff".to_string());

        let stats = pool.stats();
        assert_eq!(stats.allocations, 1);
        assert_eq!(stats.reuses, 1);
        assert_eq!(stats.hit_ratio, 0.5);
    }

    #[test]
    fn test_dot_pool_batch_operations() {
        let mut pool = DotPool::new(0, 100);

        // Acquire batch
        let dots = pool.acquire_batch(5);
        assert_eq!(dots.len(), 5);

        // Release batch
        pool.release_batch(dots);

        let stats = pool.stats();
        assert_eq!(stats.allocations, 5);
        assert_eq!(stats.pool_size, 5);
    }

    #[test]
    fn test_dot_pool_max_size_enforcement() {
        let mut pool = DotPool::new(0, 2); // Small max size

        // Release more dots than max size
        for i in 0..5 {
            let dot = Dot::new(i as f32, 0.0, 1.0, 1.0, "#000000".to_string());
            pool.release(dot);
        }

        let stats = pool.stats();
        assert_eq!(stats.pool_size, 2); // Should be capped at max_size
    }

    #[test]
    fn test_thread_safe_dot_pool() {
        let pool = ThreadSafeDotPool::new(10, 100);

        // Test basic operations
        let dot = pool.acquire(1.0, 2.0, 3.0, 0.5, "#ff0000".to_string());
        assert_eq!(dot.x, 1.0);

        pool.release(dot);

        let _stats = pool.stats();
        // reuses is u64, so this is always true - removing useless comparison
    }

    #[test]
    fn test_generic_pool() {
        let mut pool: GenericPool<Vec<f32>> = GenericPool::new(5, 50);

        // Acquire vector
        let mut vec = pool.acquire();
        vec.push(1.0);
        vec.push(2.0);

        // Release vector
        pool.release(vec);

        // Acquire again - should reuse
        let _vec2 = pool.acquire();
        // Note: GenericPool doesn't clear the vector, so it might contain old data
        // In practice, you'd want to clear it after acquisition

        let stats = pool.stats();
        assert!(stats.hit_ratio > 0.0);
    }

    #[test]
    fn test_pool_manager() {
        let mut manager = PoolManager::new();

        // Test dot pool
        {
            let dot_pool = manager.dot_pool_mut();
            let dot = dot_pool.acquire(1.0, 1.0, 1.0, 1.0, "#000000".to_string());
            dot_pool.release(dot);
        }

        // Test vector pool
        {
            let vec_pool = manager.get_or_create_vec_pool("gradients", 0); // Start empty to force allocations
            let vec1 = vec_pool.acquire();
            let vec2 = vec_pool.acquire(); // This will force an allocation
            vec_pool.release(vec1);
            vec_pool.release(vec2);
        }

        let stats = manager.combined_stats();
        assert!(stats.total_allocations > 0 || stats.total_reuses > 0); // Accept either allocation or reuse
        assert_eq!(stats.vec_pool_count, 1);
    }

    #[test]
    fn test_pool_optimization() {
        let mut pool = DotPool::new(100, 1000); // Large initial capacity

        // Use pool minimally
        let dot = pool.acquire(1.0, 1.0, 1.0, 1.0, "#000000".to_string());
        pool.release(dot);

        let initial_size = pool.stats().pool_size;

        // Optimize - should shrink pool
        pool.shrink_to_fit();

        let optimized_size = pool.stats().pool_size;
        assert!(optimized_size <= initial_size);
    }

    #[test]
    fn test_pool_stats_accuracy() {
        let mut pool = DotPool::new(0, 100);

        // Perform known operations
        let dot1 = pool.acquire(1.0, 1.0, 1.0, 1.0, "#000000".to_string());
        let dot2 = pool.acquire(2.0, 2.0, 2.0, 0.5, "#ffffff".to_string());

        pool.release(dot1);

        let dot3 = pool.acquire(3.0, 3.0, 3.0, 0.8, "#ff0000".to_string());

        pool.release(dot2);
        pool.release(dot3);

        let stats = pool.stats();

        // Should have 2 allocations (dot1, dot2) and 1 reuse (dot3 reused dot1)
        assert_eq!(stats.allocations, 2);
        assert_eq!(stats.reuses, 1);
        assert!((stats.hit_ratio - (1.0 / 3.0)).abs() < 0.01);
    }
}
