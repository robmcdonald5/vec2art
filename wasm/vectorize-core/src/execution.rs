//! Execution strategy abstraction layer for three-tier parallel/single-threaded processing
//!
//! This module provides a unified interface for parallel and single-threaded execution,
//! allowing the same code to run efficiently across three execution tiers through
//! conditional compilation:
//!
//! ## Execution Tiers
//! 1. **Native Parallel**: Use rayon on native targets with `parallel` feature
//! 2. **WASM Parallel**: Use wasm-bindgen-rayon on WASM targets with `wasm-parallel` feature  
//! 3. **Single-threaded Fallback**: Sequential execution when neither parallel feature is enabled
//!
//! ## Features
//! - **Fork-Join Operations**: `join`, `join3` for parallel task execution
//! - **Scoped Parallelism**: `scope` for controlled parallel execution contexts
//! - **Iterator Bridges**: `par_bridge` for converting sequential iterators
//! - **Mutable Operations**: `process_chunks_mut`, `par_sort` for in-place operations  
//! - **Advanced Patterns**: `par_windows`, `par_extend`, `reduce` for complex algorithms
//! - **Helper Macros**: `par_iter_if_available!`, `maybe_par!` for conditional parallelism
//! - **Thread Pool Management**: Scoped thread pool configuration
//!
//! All functions automatically select the appropriate execution strategy based on the
//! target architecture and enabled features, providing seamless parallel execution
//! across native and WebAssembly environments.

use std::cmp::Ord;
use std::marker::PhantomData;

// Regular rayon traits needed for parallel operations (may be unused in single-threaded builds)
#[cfg(any(feature = "parallel", feature = "wasm-parallel"))]
#[allow(unused_imports)]
use rayon::iter::{
    IndexedParallelIterator, IntoParallelIterator, IntoParallelRefIterator,
    IntoParallelRefMutIterator, ParallelExtend, ParallelIterator,
};
#[cfg(any(feature = "parallel", feature = "wasm-parallel"))]
#[allow(unused_imports)]
use rayon::slice::{ParallelSlice, ParallelSliceMut};

/// Helper function to execute parallel processing with automatic feature selection
///
/// Execution strategy tiers:
/// 1. Native parallel: Use rayon when on native targets with parallel feature
/// 2. WASM parallel: Use wasm-bindgen-rayon when on WASM with wasm-parallel feature
/// 3. Single-threaded fallback: Use sequential processing
pub fn execute_parallel<I, F, R>(items: I, func: F) -> Vec<R>
where
    I: IntoIterator,
    I::Item: Send + Sync,
    F: Fn(I::Item) -> R + Send + Sync,
    R: Send,
{
    // Tier 1: Native parallel with rayon
    #[cfg(all(feature = "parallel", not(target_arch = "wasm32")))]
    {
        use rayon::prelude::*;
        items
            .into_iter()
            .collect::<Vec<_>>()
            .into_par_iter()
            .map(func)
            .collect()
    }
    // Tier 2: WASM parallel with wasm-bindgen-rayon
    #[cfg(all(feature = "wasm-parallel", target_arch = "wasm32"))]
    {
        items
            .into_iter()
            .collect::<Vec<_>>()
            .into_par_iter()
            .map(func)
            .collect()
    }
    // Tier 3: Single-threaded fallback
    #[cfg(not(any(
        all(feature = "parallel", not(target_arch = "wasm32")),
        all(feature = "wasm-parallel", target_arch = "wasm32")
    )))]
    {
        items.into_iter().map(func).collect()
    }
}

/// Helper function to execute parallel filter_map with automatic feature selection
pub fn execute_parallel_filter_map<I, F, R>(items: I, func: F) -> Vec<R>
where
    I: IntoIterator,
    I::Item: Send + Sync,
    F: Fn(I::Item) -> Option<R> + Send + Sync,
    R: Send,
{
    // Tier 1: Native parallel with rayon
    #[cfg(all(feature = "parallel", not(target_arch = "wasm32")))]
    {
        use rayon::prelude::*;
        items
            .into_iter()
            .collect::<Vec<_>>()
            .into_par_iter()
            .filter_map(func)
            .collect()
    }
    // Tier 2: WASM parallel with wasm-bindgen-rayon
    #[cfg(all(feature = "wasm-parallel", target_arch = "wasm32"))]
    {
        items
            .into_iter()
            .collect::<Vec<_>>()
            .into_par_iter()
            .filter_map(func)
            .collect()
    }
    // Tier 3: Single-threaded fallback
    #[cfg(not(any(
        all(feature = "parallel", not(target_arch = "wasm32")),
        all(feature = "wasm-parallel", target_arch = "wasm32")
    )))]
    {
        items.into_iter().filter_map(func).collect()
    }
}

/// Helper function to execute parallel chunks processing with automatic feature selection
pub fn execute_parallel_chunks<I, F, R>(items: I, chunk_size: usize, func: F) -> Vec<R>
where
    I: IntoIterator,
    I::Item: Send + Sync,
    F: Fn(&[I::Item]) -> R + Send + Sync,
    R: Send,
{
    let vec: Vec<_> = items.into_iter().collect();

    // Tier 1: Native parallel with rayon
    #[cfg(all(feature = "parallel", not(target_arch = "wasm32")))]
    {
        use rayon::prelude::*;
        vec.par_chunks(chunk_size).map(func).collect()
    }
    // Tier 2: WASM parallel with wasm-bindgen-rayon
    #[cfg(all(feature = "wasm-parallel", target_arch = "wasm32"))]
    {
        vec.par_chunks(chunk_size).map(func).collect()
    }
    // Tier 3: Single-threaded fallback
    #[cfg(not(any(
        all(feature = "parallel", not(target_arch = "wasm32")),
        all(feature = "wasm-parallel", target_arch = "wasm32")
    )))]
    {
        vec.chunks(chunk_size).map(func).collect()
    }
}

/// Thread pool configuration abstraction
#[derive(Debug, Clone, Default)]
pub struct ThreadPoolConfig {
    pub num_threads: Option<usize>,
    pub stack_size: Option<usize>,
    pub thread_name: Option<String>,
}

/// Execute operation with a scoped thread pool
///
/// # Example
/// ```
/// use vectorize_core::execution::{ThreadPoolConfig, with_thread_pool};
/// let config = ThreadPoolConfig {
///     num_threads: Some(4),
///     ..Default::default()
/// };
/// let result = with_thread_pool(&config, || {
///     // Heavy parallel computation here
///     42
/// });
/// ```
pub fn with_thread_pool<F, R>(config: &ThreadPoolConfig, f: F) -> R
where
    F: FnOnce() -> R + Send,
    R: Send,
{
    // Tier 1: Native parallel with rayon
    #[cfg(all(feature = "parallel", not(target_arch = "wasm32")))]
    {
        let mut builder = rayon::ThreadPoolBuilder::new();

        if let Some(num_threads) = config.num_threads {
            builder = builder.num_threads(num_threads);
        }

        if let Some(stack_size) = config.stack_size {
            builder = builder.stack_size(stack_size);
        }

        if let Some(ref name) = config.thread_name {
            let name_clone = name.clone();
            builder = builder.thread_name(move |i| format!("{name_clone}-{i}"));
        }

        match builder.build() {
            Ok(pool) => pool.install(f),
            Err(_) => f(), // Fallback to current thread on error
        }
    }
    // Tier 2 & 3: WASM parallel and single-threaded both use direct execution
    // WASM-specific thread pool management is handled separately in threading.rs
    #[cfg(not(all(feature = "parallel", not(target_arch = "wasm32"))))]
    {
        let _ = config; // Suppress unused warning
        f()
    }
}

/// Get the current number of threads available
///
/// # Example
/// ```
/// use vectorize_core::execution::current_num_threads;
/// let threads = current_num_threads();
/// println!("Using {} threads", threads);
/// ```
pub fn current_num_threads() -> usize {
    // Tier 1: Native parallel with rayon
    #[cfg(all(feature = "parallel", not(target_arch = "wasm32")))]
    {
        rayon::current_num_threads()
    }
    // Tier 2: WASM parallel - use navigator.hardwareConcurrency or fallback
    #[cfg(all(feature = "wasm-parallel", target_arch = "wasm32"))]
    {
        // Try to get hardware concurrency from the browser
        #[cfg(feature = "web-sys")]
        {
            if let Some(window) = web_sys::window() {
                let concurrency = window.navigator().hardware_concurrency();
                return concurrency as usize;
            }
        }
        // Fallback to reasonable WASM default (assume 2-4 cores for typical browsers)
        4
    }
    // Tier 3: Single-threaded fallback
    #[cfg(not(any(
        all(feature = "parallel", not(target_arch = "wasm32")),
        all(feature = "wasm-parallel", target_arch = "wasm32")
    )))]
    {
        1
    }
}

/// Configure thread pool (no-op for single-threaded)
pub fn configure_thread_pool(config: &ThreadPoolConfig) {
    // Tier 1: Native parallel with rayon
    #[cfg(all(feature = "parallel", not(target_arch = "wasm32")))]
    {
        if let Some(num_threads) = config.num_threads {
            rayon::ThreadPoolBuilder::new()
                .num_threads(num_threads)
                .build_global()
                .ok(); // Ignore errors for now, use default if configuration fails
        }
    }
    // Tier 2: WASM parallel - delegate to WASM-specific thread pool management
    #[cfg(all(feature = "wasm-parallel", target_arch = "wasm32"))]
    {
        // WASM thread pool configuration is handled by the WASM wrapper layer
        // This is intentionally a no-op here to maintain API compatibility
        let _ = config; // Suppress unused warning
    }
    // Tier 3: No-op for single-threaded builds
}

// ==============================================================================
// Fork-Join Pattern
// ==============================================================================

/// Execute two operations potentially in parallel
///
/// # Example
/// ```
/// use vectorize_core::execution::join;
/// let (result1, result2) = join(
///     || heavy_computation_1(),
///     || heavy_computation_2()
/// );
/// ```
pub fn join<A, B, RA, RB>(op_a: A, op_b: B) -> (RA, RB)
where
    A: FnOnce() -> RA + Send,
    B: FnOnce() -> RB + Send,
    RA: Send,
    RB: Send,
{
    // Tier 1: Native parallel with rayon
    #[cfg(all(feature = "parallel", not(target_arch = "wasm32")))]
    {
        rayon::join(op_a, op_b)
    }
    // Tier 2: WASM parallel with wasm-bindgen-rayon
    #[cfg(all(feature = "wasm-parallel", target_arch = "wasm32"))]
    {
        rayon::join(op_a, op_b)
    }
    // Tier 3: Single-threaded fallback
    #[cfg(not(any(
        all(feature = "parallel", not(target_arch = "wasm32")),
        all(feature = "wasm-parallel", target_arch = "wasm32")
    )))]
    {
        let result_a = op_a();
        let result_b = op_b();
        (result_a, result_b)
    }
}

/// Execute three operations potentially in parallel
///
/// # Example
/// ```
/// use vectorize_core::execution::join3;
/// let (r1, r2, r3) = join3(
///     || computation_1(),
///     || computation_2(),
///     || computation_3()
/// );
/// ```
pub fn join3<A, B, C, RA, RB, RC>(op_a: A, op_b: B, op_c: C) -> (RA, RB, RC)
where
    A: FnOnce() -> RA + Send,
    B: FnOnce() -> RB + Send,
    C: FnOnce() -> RC + Send,
    RA: Send,
    RB: Send,
    RC: Send,
{
    // Tier 1: Native parallel with rayon
    #[cfg(all(feature = "parallel", not(target_arch = "wasm32")))]
    {
        let ((result_a, result_b), result_c) = rayon::join(|| rayon::join(op_a, op_b), op_c);
        (result_a, result_b, result_c)
    }
    // Tier 2: WASM parallel with wasm-bindgen-rayon
    #[cfg(all(feature = "wasm-parallel", target_arch = "wasm32"))]
    {
        let ((result_a, result_b), result_c) = rayon::join(|| rayon::join(op_a, op_b), op_c);
        (result_a, result_b, result_c)
    }
    // Tier 3: Single-threaded fallback
    #[cfg(not(any(
        all(feature = "parallel", not(target_arch = "wasm32")),
        all(feature = "wasm-parallel", target_arch = "wasm32")
    )))]
    {
        let result_a = op_a();
        let result_b = op_b();
        let result_c = op_c();
        (result_a, result_b, result_c)
    }
}

// ==============================================================================
// Scoped Parallelism
// ==============================================================================

/// Scoped parallel execution context  
/// Simplified implementation for API compatibility
pub struct ParallelScope {
    _phantom: PhantomData<()>,
}

impl ParallelScope {
    /// Spawn a task in the scope (simplified implementation)
    /// For now, operations run immediately in the current thread
    pub fn spawn<F>(&self, op: F)
    where
        F: FnOnce(),
    {
        // For now, run operations immediately
        op();
    }
}

/// Execute operations within a scoped parallel context
/// For now, this is a simplified implementation that doesn't provide true scoped parallelism
/// but ensures API compatibility for future migration.
///
/// # Example
/// ```
/// use vectorize_core::execution::scope;
/// let mut data = vec![1, 2, 3, 4];
/// scope(|_s| {
///     // Operations run sequentially for now
///     data[0] *= 2;
///     data[1] *= 2;
/// });
/// ```
pub fn scope<F, R>(f: F) -> R
where
    F: FnOnce(&ParallelScope) -> R,
    R: Send,
{
    let scope = ParallelScope {
        _phantom: PhantomData,
    };
    f(&scope)
}

// ==============================================================================
// Iterator Bridges
// ==============================================================================

/// Bridge sequential iterators to parallel processing
///
/// # Example
/// ```
/// use vectorize_core::execution::par_bridge;
/// let result: Vec<_> = par_bridge(0..1000)
///     .map(|x| x * x)
///     .collect();
/// ```
pub fn par_bridge<I>(iter: I) -> ExecutionIter<I>
where
    I: IntoIterator,
{
    ExecutionIter::new(iter)
}

// ==============================================================================
// Mutable Operations
// ==============================================================================

/// Process mutable chunks in parallel
///
/// # Example
/// ```
/// use vectorize_core::execution::process_chunks_mut;
/// let mut data = vec![1, 2, 3, 4, 5, 6];
/// process_chunks_mut(&mut data, 2, |chunk| {
///     chunk.iter_mut().for_each(|x| *x *= 2);
/// });
/// ```
pub fn process_chunks_mut<T, F>(data: &mut [T], chunk_size: usize, f: F)
where
    T: Send + Sync,
    F: Fn(&mut [T]) + Send + Sync,
{
    // Tier 1: Native parallel with rayon
    #[cfg(all(feature = "parallel", not(target_arch = "wasm32")))]
    {
        use rayon::prelude::*;
        data.par_chunks_mut(chunk_size).for_each(f);
    }
    // Tier 2: WASM parallel with wasm-bindgen-rayon
    #[cfg(all(feature = "wasm-parallel", target_arch = "wasm32"))]
    {
        data.par_chunks_mut(chunk_size).for_each(f);
    }
    // Tier 3: Single-threaded fallback
    #[cfg(not(any(
        all(feature = "parallel", not(target_arch = "wasm32")),
        all(feature = "wasm-parallel", target_arch = "wasm32")
    )))]
    {
        data.chunks_mut(chunk_size).for_each(f);
    }
}

/// Parallel sort with fallback to sequential
///
/// # Example
/// ```
/// use vectorize_core::execution::par_sort;
/// let mut data = vec![3, 1, 4, 1, 5, 9];
/// par_sort(&mut data);
/// assert_eq!(data, vec![1, 1, 3, 4, 5, 9]);
/// ```
pub fn par_sort<T>(data: &mut [T])
where
    T: Ord + Send,
{
    // Tier 1: Native parallel with rayon
    #[cfg(all(feature = "parallel", not(target_arch = "wasm32")))]
    {
        use rayon::prelude::*;
        data.par_sort();
    }
    // Tier 2: WASM parallel with wasm-bindgen-rayon
    #[cfg(all(feature = "wasm-parallel", target_arch = "wasm32"))]
    {
        data.par_sort();
    }
    // Tier 3: Single-threaded fallback
    #[cfg(not(any(
        all(feature = "parallel", not(target_arch = "wasm32")),
        all(feature = "wasm-parallel", target_arch = "wasm32")
    )))]
    {
        data.sort();
    }
}

/// Parallel sort by comparison function
///
/// # Example
/// ```
/// use vectorize_core::execution::par_sort_by;
/// let mut data = vec![3.1, 1.2, 4.0];
/// par_sort_by(&mut data, |a, b| a.partial_cmp(b).unwrap());
/// ```
pub fn par_sort_by<T, F>(data: &mut [T], compare: F)
where
    T: Send,
    F: Fn(&T, &T) -> std::cmp::Ordering + Sync,
{
    // Tier 1: Native parallel with rayon
    #[cfg(all(feature = "parallel", not(target_arch = "wasm32")))]
    {
        use rayon::prelude::*;
        data.par_sort_by(compare);
    }
    // Tier 2: WASM parallel with wasm-bindgen-rayon
    #[cfg(all(feature = "wasm-parallel", target_arch = "wasm32"))]
    {
        data.par_sort_by(compare);
    }
    // Tier 3: Single-threaded fallback
    #[cfg(not(any(
        all(feature = "parallel", not(target_arch = "wasm32")),
        all(feature = "wasm-parallel", target_arch = "wasm32")
    )))]
    {
        data.sort_by(compare);
    }
}

// ==============================================================================
// Advanced Patterns
// ==============================================================================

/// Process sliding windows in parallel
///
/// # Example
/// ```
/// use vectorize_core::execution::par_windows;
/// let data = vec![1, 2, 3, 4, 5];
/// let sums = par_windows(&data, 3, |window| window.iter().sum::<i32>());
/// assert_eq!(sums, vec![6, 9, 12]); // [1+2+3, 2+3+4, 3+4+5]
/// ```
pub fn par_windows<T, F, R>(data: &[T], window_size: usize, f: F) -> Vec<R>
where
    T: Send + Sync,
    F: Fn(&[T]) -> R + Send + Sync,
    R: Send,
{
    // Tier 1: Native parallel with rayon
    #[cfg(all(feature = "parallel", not(target_arch = "wasm32")))]
    {
        use rayon::prelude::*;
        data.par_windows(window_size).map(f).collect()
    }
    // Tier 2: WASM parallel with wasm-bindgen-rayon
    #[cfg(all(feature = "wasm-parallel", target_arch = "wasm32"))]
    {
        data.par_windows(window_size).map(f).collect()
    }
    // Tier 3: Single-threaded fallback
    #[cfg(not(any(
        all(feature = "parallel", not(target_arch = "wasm32")),
        all(feature = "wasm-parallel", target_arch = "wasm32")
    )))]
    {
        data.windows(window_size).map(f).collect()
    }
}

/// Parallel collection extension
///
/// # Example
/// ```
/// use vectorize_core::execution::par_extend;
/// let mut vec = vec![1, 2];
/// par_extend(&mut vec, vec![3, 4, 5]);
/// assert_eq!(vec, vec![1, 2, 3, 4, 5]);
/// ```
pub fn par_extend<T, I>(vec: &mut Vec<T>, items: I)
where
    T: Send,
    I: IntoIterator<Item = T> + Send,
    I::Item: Send,
{
    // Tier 1: Native parallel with rayon
    #[cfg(all(feature = "parallel", not(target_arch = "wasm32")))]
    {
        use rayon::prelude::*;
        vec.par_extend(items.into_iter().collect::<Vec<_>>());
    }
    // Tier 2: WASM parallel with wasm-bindgen-rayon
    #[cfg(all(feature = "wasm-parallel", target_arch = "wasm32"))]
    {
        vec.par_extend(items.into_iter().collect::<Vec<_>>());
    }
    // Tier 3: Single-threaded fallback
    #[cfg(not(any(
        all(feature = "parallel", not(target_arch = "wasm32")),
        all(feature = "wasm-parallel", target_arch = "wasm32")
    )))]
    {
        vec.extend(items);
    }
}

/// Parallel reduction operation
///
/// # Example
/// ```
/// use vectorize_core::execution::reduce;
/// let data = vec![1, 2, 3, 4, 5];
/// let sum = reduce(&data, 0, |a, b| a + b);
/// assert_eq!(sum, 15);
/// ```
pub fn reduce<T, F>(data: &[T], identity: T, op: F) -> T
where
    T: Copy + Send + Sync,
    F: Fn(T, T) -> T + Send + Sync,
{
    // Tier 1: Native parallel with rayon
    #[cfg(all(feature = "parallel", not(target_arch = "wasm32")))]
    {
        use rayon::prelude::*;
        data.par_iter().copied().reduce(|| identity, op)
    }
    // Tier 2: WASM parallel with wasm-bindgen-rayon
    #[cfg(all(feature = "wasm-parallel", target_arch = "wasm32"))]
    {
        data.par_iter().copied().reduce(|| identity, op)
    }
    // Tier 3: Single-threaded fallback
    #[cfg(not(any(
        all(feature = "parallel", not(target_arch = "wasm32")),
        all(feature = "wasm-parallel", target_arch = "wasm32")
    )))]
    {
        data.iter().copied().fold(identity, op)
    }
}

// ==============================================================================
// Helper Macros
// ==============================================================================

/// Conditional parallel iteration macro
///
/// # Example
/// ```
/// use vectorize_core::par_iter_if_available;
/// let data = vec![1, 2, 3, 4];
/// let result: Vec<_> = par_iter_if_available!(data).map(|x| x * 2).collect();
/// ```
#[macro_export]
macro_rules! par_iter_if_available {
    ($items:expr) => {{
        // Tier 1: Native parallel with rayon
        #[cfg(all(feature = "parallel", not(target_arch = "wasm32")))]
        {
            use rayon::prelude::*;
            $items.into_par_iter()
        }
        // Tier 2: WASM parallel with wasm-bindgen-rayon
        #[cfg(all(feature = "wasm-parallel", target_arch = "wasm32"))]
        {
            use wasm_bindgen_rayon::prelude::*;
            $items.into_par_iter()
        }
        // Tier 3: Single-threaded fallback
        #[cfg(not(any(
            all(feature = "parallel", not(target_arch = "wasm32")),
            all(feature = "wasm-parallel", target_arch = "wasm32")
        )))]
        {
            $items.into_iter()
        }
    }};
}

/// Wrap expressions for conditional parallelism
///
/// # Example
/// ```
/// use vectorize_core::maybe_par;
/// let data = vec![1, 2, 3, 4];
/// let result: Vec<_> = maybe_par!(data.iter()).map(|&x| x * 2).collect();
/// ```
#[macro_export]
macro_rules! maybe_par {
    ($expr:expr) => {{
        // Tier 1: Native parallel with rayon
        #[cfg(all(feature = "parallel", not(target_arch = "wasm32")))]
        {
            use rayon::prelude::*;
            $expr.into_par_iter()
        }
        // Tier 2: WASM parallel with wasm-bindgen-rayon
        #[cfg(all(feature = "wasm-parallel", target_arch = "wasm32"))]
        {
            use wasm_bindgen_rayon::prelude::*;
            $expr.into_par_iter()
        }
        // Tier 3: Single-threaded fallback
        #[cfg(not(any(
            all(feature = "parallel", not(target_arch = "wasm32")),
            all(feature = "wasm-parallel", target_arch = "wasm32")
        )))]
        {
            $expr.into_iter()
        }
    }};
}

// ==============================================================================
// Thread Pool Management
// ==============================================================================

/// Execution iterator wrapper that provides a unified interface
pub struct ExecutionIter<I> {
    items: I,
    _marker: PhantomData<()>,
}

impl<I> ExecutionIter<I> {
    pub fn new(items: I) -> Self {
        Self {
            items,
            _marker: PhantomData,
        }
    }

    /// Map function with execution strategy
    pub fn map<F, R>(self, func: F) -> Vec<R>
    where
        I: IntoIterator,
        I::Item: Send + Sync,
        F: Fn(I::Item) -> R + Send + Sync,
        R: Send,
    {
        execute_parallel(self.items, func)
    }

    /// Filter map function with execution strategy
    pub fn filter_map<F, R>(self, func: F) -> Vec<R>
    where
        I: IntoIterator,
        I::Item: Send + Sync,
        F: Fn(I::Item) -> Option<R> + Send + Sync,
        R: Send,
    {
        execute_parallel_filter_map(self.items, func)
    }
}

/// Create an execution iterator
///
/// # Example
/// ```
/// use vectorize_core::execution::par_iter;
/// let result: Vec<_> = par_iter(vec![1, 2, 3, 4])
///     .map(|x| x * 2);
/// assert_eq!(result, vec![2, 4, 6, 8]);
/// ```
pub fn par_iter<I>(items: I) -> ExecutionIter<I> {
    ExecutionIter::new(items)
}

/// Process iterator with mutable access to each element
///
/// # Example
/// ```
/// use vectorize_core::execution::par_iter_mut;
/// let mut data = vec![1, 2, 3, 4];
/// par_iter_mut(&mut data, |x| *x *= 2);
/// assert_eq!(data, vec![2, 4, 6, 8]);
/// ```
pub fn par_iter_mut<T, F>(data: &mut [T], f: F)
where
    T: Send + Sync,
    F: Fn(&mut T) + Send + Sync,
{
    // Tier 1: Native parallel with rayon
    #[cfg(all(feature = "parallel", not(target_arch = "wasm32")))]
    {
        use rayon::prelude::*;
        data.par_iter_mut().for_each(f);
    }
    // Tier 2: WASM parallel with wasm-bindgen-rayon
    #[cfg(all(feature = "wasm-parallel", target_arch = "wasm32"))]
    {
        data.par_iter_mut().for_each(f);
    }
    // Tier 3: Single-threaded fallback
    #[cfg(not(any(
        all(feature = "parallel", not(target_arch = "wasm32")),
        all(feature = "wasm-parallel", target_arch = "wasm32")
    )))]
    {
        data.iter_mut().for_each(f);
    }
}

/// Parallel zip two iterators
///
/// # Example
/// ```
/// use vectorize_core::execution::par_zip;
/// let a = vec![1, 2, 3];
/// let b = vec![4, 5, 6];
/// let result = par_zip(a, b, |x, y| x + y);
/// assert_eq!(result, vec![5, 7, 9]);
/// ```
pub fn par_zip<A, B, F, R>(a: Vec<A>, b: Vec<B>, f: F) -> Vec<R>
where
    A: Send + Sync,
    B: Send + Sync,
    F: Fn(A, B) -> R + Send + Sync,
    R: Send,
{
    // Tier 1: Native parallel with rayon
    #[cfg(all(feature = "parallel", not(target_arch = "wasm32")))]
    {
        use rayon::prelude::*;
        a.into_par_iter()
            .zip(b.into_par_iter())
            .map(|(x, y)| f(x, y))
            .collect()
    }
    // Tier 2: WASM parallel with wasm-bindgen-rayon
    #[cfg(all(feature = "wasm-parallel", target_arch = "wasm32"))]
    {
        a.into_par_iter()
            .zip(b.into_par_iter())
            .map(|(x, y)| f(x, y))
            .collect()
    }
    // Tier 3: Single-threaded fallback
    #[cfg(not(any(
        all(feature = "parallel", not(target_arch = "wasm32")),
        all(feature = "wasm-parallel", target_arch = "wasm32")
    )))]
    {
        a.into_iter()
            .zip(b.into_iter())
            .map(|(x, y)| f(x, y))
            .collect()
    }
}

/// Parallel enumeration with indices
///
/// # Example
/// ```
/// use vectorize_core::execution::par_enumerate;
/// let data = vec!["a", "b", "c"];
/// let result = par_enumerate(data, |i, x| format!("{}: {}", i, x));
/// assert_eq!(result, vec!["0: a".to_string(), "1: b".to_string(), "2: c".to_string()]);
/// ```
pub fn par_enumerate<T, F, R>(data: Vec<T>, f: F) -> Vec<R>
where
    T: Send + Sync,
    F: Fn(usize, T) -> R + Send + Sync,
    R: Send,
{
    // Tier 1: Native parallel with rayon
    #[cfg(all(feature = "parallel", not(target_arch = "wasm32")))]
    {
        use rayon::prelude::*;
        data.into_par_iter()
            .enumerate()
            .map(|(i, x)| f(i, x))
            .collect()
    }
    // Tier 2: WASM parallel with wasm-bindgen-rayon
    #[cfg(all(feature = "wasm-parallel", target_arch = "wasm32"))]
    {
        data.into_par_iter()
            .enumerate()
            .map(|(i, x)| f(i, x))
            .collect()
    }
    // Tier 3: Single-threaded fallback
    #[cfg(not(any(
        all(feature = "parallel", not(target_arch = "wasm32")),
        all(feature = "wasm-parallel", target_arch = "wasm32")
    )))]
    {
        data.into_iter().enumerate().map(|(i, x)| f(i, x)).collect()
    }
}

/// Check if parallel processing should be used based on data size
///
/// # Example
/// ```
/// use vectorize_core::execution::should_use_parallel;
/// let large_data_size = 100_000;
/// let small_data_size = 100;
/// assert!(should_use_parallel(large_data_size, 1000));
/// assert!(!should_use_parallel(small_data_size, 1000));
/// ```
pub fn should_use_parallel(data_size: usize, threshold: usize) -> bool {
    // Tier 1: Native parallel with rayon
    #[cfg(all(feature = "parallel", not(target_arch = "wasm32")))]
    {
        data_size >= threshold && current_num_threads() > 1
    }
    // Tier 2: WASM parallel with wasm-bindgen-rayon
    #[cfg(all(feature = "wasm-parallel", target_arch = "wasm32"))]
    {
        data_size >= threshold && current_num_threads() > 1
    }
    // Tier 3: Single-threaded fallback
    #[cfg(not(any(
        all(feature = "parallel", not(target_arch = "wasm32")),
        all(feature = "wasm-parallel", target_arch = "wasm32")
    )))]
    {
        let _ = (data_size, threshold); // Suppress unused warnings
        false
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_execution_strategy_basic() {
        let items = vec![1, 2, 3, 4, 5];
        let result = execute_parallel(items.clone(), |x| x * 2);
        assert_eq!(result, vec![2, 4, 6, 8, 10]);
    }

    #[test]
    fn test_execution_filter_map() {
        let items = vec![1, 2, 3, 4, 5];
        let result =
            execute_parallel_filter_map(items, |x| if x % 2 == 0 { Some(x * 2) } else { None });
        assert_eq!(result, vec![4, 8]);
    }

    #[test]
    fn test_execution_chunks() {
        let items = vec![1, 2, 3, 4, 5, 6];
        let result = execute_parallel_chunks(items, 2, |chunk| chunk.iter().sum::<i32>());
        assert_eq!(result, vec![3, 7, 11]); // [1+2, 3+4, 5+6]
    }

    #[test]
    fn test_par_iter_wrapper() {
        let items = vec![1, 2, 3, 4];
        let result = par_iter(items).map(|x| x * 3);
        assert_eq!(result, vec![3, 6, 9, 12]);
    }

    #[test]
    fn test_par_iter_filter_map() {
        let items = vec![1, 2, 3, 4, 5];
        let result = par_iter(items).filter_map(|x| if x > 3 { Some(x * 2) } else { None });
        assert_eq!(result, vec![8, 10]);
    }

    #[test]
    fn test_thread_pool_config() {
        let config = ThreadPoolConfig::default();
        assert!(config.num_threads.is_none());

        let config_with_threads = ThreadPoolConfig {
            num_threads: Some(4),
            stack_size: None,
            thread_name: None,
        };
        assert_eq!(config_with_threads.num_threads, Some(4));

        // Test configure function doesn't panic
        configure_thread_pool(&config);
        configure_thread_pool(&config_with_threads);
    }

    #[test]
    fn test_execute_parallel_basic() {
        let items = vec![1, 2, 3];
        let result = execute_parallel(items, |x| x * 2);
        assert_eq!(result, vec![2, 4, 6]);
    }

    // ==============================================================================
    // New Function Tests
    // ==============================================================================

    #[test]
    fn test_par_iter_mut() {
        let mut data = vec![1, 2, 3, 4];
        par_iter_mut(&mut data, |x| *x *= 2);
        assert_eq!(data, vec![2, 4, 6, 8]);
    }

    #[test]
    fn test_par_zip() {
        let a = vec![1, 2, 3];
        let b = vec![4, 5, 6];
        let result = par_zip(a, b, |x, y| x + y);
        assert_eq!(result, vec![5, 7, 9]);
    }

    #[test]
    fn test_par_enumerate() {
        let data = vec!["a", "b", "c"];
        let result = par_enumerate(data, |i, x| format!("{i}: {x}"));
        assert_eq!(
            result,
            vec!["0: a".to_string(), "1: b".to_string(), "2: c".to_string()]
        );
    }

    #[test]
    fn test_should_use_parallel() {
        assert!(should_use_parallel(100_000, 1000));
        assert!(!should_use_parallel(100, 1000));

        // Test edge cases
        assert!(should_use_parallel(1000, 1000)); // Equal to threshold should use parallel
        assert!(should_use_parallel(1001, 1000)); // Just above threshold
    }

    // ==============================================================================
    // Fork-Join Tests
    // ==============================================================================

    #[test]
    fn test_join() {
        let (result1, result2) = join(
            || {
                std::thread::sleep(std::time::Duration::from_millis(1));
                42
            },
            || {
                std::thread::sleep(std::time::Duration::from_millis(1));
                24
            },
        );
        assert_eq!(result1, 42);
        assert_eq!(result2, 24);
    }

    #[test]
    fn test_join3() {
        let (r1, r2, r3) = join3(|| 1 + 1, || 2 + 2, || 3 + 3);
        assert_eq!(r1, 2);
        assert_eq!(r2, 4);
        assert_eq!(r3, 6);
    }

    // ==============================================================================
    // Scoped Parallelism Tests
    // ==============================================================================

    #[test]
    fn test_scope() {
        let mut data = vec![1, 2, 3, 4];
        let expected = vec![2, 4, 9, 12];

        // Test scope with simple operations that don't require lifetime handling
        scope(|_s| {
            // Modify data directly without spawn for testing
            data[0] *= 2;
            data[1] *= 2;
            data[2] *= 3;
            data[3] *= 3;
        });

        assert_eq!(data, expected);
    }

    // ==============================================================================
    // Iterator Bridge Tests
    // ==============================================================================

    #[test]
    fn test_par_bridge() {
        let result = par_bridge(0..5).map(|x| x * x);
        assert_eq!(result, vec![0, 1, 4, 9, 16]);
    }

    // ==============================================================================
    // Mutable Operations Tests
    // ==============================================================================

    #[test]
    fn test_process_chunks_mut() {
        let mut data = vec![1, 2, 3, 4, 5, 6];
        process_chunks_mut(&mut data, 2, |chunk| {
            chunk.iter_mut().for_each(|x| *x *= 2);
        });
        assert_eq!(data, vec![2, 4, 6, 8, 10, 12]);
    }

    #[test]
    fn test_par_sort() {
        let mut data = vec![3, 1, 4, 1, 5, 9, 2, 6];
        par_sort(&mut data);
        assert_eq!(data, vec![1, 1, 2, 3, 4, 5, 6, 9]);
    }

    #[test]
    fn test_par_sort_by() {
        let mut data = vec![3.1, 1.2, 4.0, 1.1];
        par_sort_by(&mut data, |a, b| a.partial_cmp(b).unwrap());
        assert_eq!(data, vec![1.1, 1.2, 3.1, 4.0]);
    }

    // ==============================================================================
    // Advanced Patterns Tests
    // ==============================================================================

    #[test]
    fn test_par_windows() {
        let data = vec![1, 2, 3, 4, 5];
        let sums = par_windows(&data, 3, |window| window.iter().sum::<i32>());
        assert_eq!(sums, vec![6, 9, 12]); // [1+2+3, 2+3+4, 3+4+5]
    }

    #[test]
    fn test_par_extend() {
        let mut vec = vec![1, 2];
        par_extend(&mut vec, vec![3, 4, 5]);
        assert_eq!(vec, vec![1, 2, 3, 4, 5]);
    }

    #[test]
    fn test_reduce() {
        let data = vec![1, 2, 3, 4, 5];
        let sum = reduce(&data, 0, |a, b| a + b);
        assert_eq!(sum, 15);

        let max = reduce(&data, 0, |a, b| a.max(b));
        assert_eq!(max, 5);
    }

    // ==============================================================================
    // Thread Pool Management Tests
    // ==============================================================================

    #[test]
    fn test_with_thread_pool() {
        let config = ThreadPoolConfig {
            num_threads: Some(2),
            stack_size: Some(1024 * 1024),
            thread_name: Some("test".to_string()),
        };

        let result = with_thread_pool(&config, || {
            let sum: i32 = (0..100).map(|x| x * x).sum();
            sum
        });

        assert_eq!(result, 328350); // Sum of squares from 0 to 99
    }

    #[test]
    fn test_current_num_threads() {
        let threads = current_num_threads();
        assert!(threads >= 1);
    }

    #[test]
    fn test_thread_pool_config_enhanced() {
        let config = ThreadPoolConfig::default();
        assert!(config.num_threads.is_none());
        assert!(config.stack_size.is_none());
        assert!(config.thread_name.is_none());

        let config_with_options = ThreadPoolConfig {
            num_threads: Some(4),
            stack_size: Some(1024 * 1024),
            thread_name: Some("test-worker".to_string()),
        };
        assert_eq!(config_with_options.num_threads, Some(4));
        assert_eq!(config_with_options.stack_size, Some(1024 * 1024));
        assert_eq!(
            config_with_options.thread_name,
            Some("test-worker".to_string())
        );

        // Test configure function doesn't panic
        configure_thread_pool(&config);
        configure_thread_pool(&config_with_options);
    }

    // ==============================================================================
    // Macro Tests
    // ==============================================================================

    #[test]
    fn test_par_iter_if_available_macro() {
        let data = vec![1, 2, 3, 4];
        #[cfg(feature = "parallel")]
        {
            use rayon::prelude::*;
            let result: Vec<_> = par_iter_if_available!(data).map(|x| x * 2).collect();
            assert_eq!(result, vec![2, 4, 6, 8]);
        }
        #[cfg(not(feature = "parallel"))]
        {
            let result: Vec<_> = par_iter_if_available!(data).map(|x| x * 2).collect();
            assert_eq!(result, vec![2, 4, 6, 8]);
        }
    }

    #[test]
    fn test_maybe_par_macro() {
        let data = vec![1, 2, 3, 4];
        #[cfg(feature = "parallel")]
        {
            use rayon::prelude::*;
            let result: Vec<_> = maybe_par!(data).map(|x| x * 2).collect();
            assert_eq!(result, vec![2, 4, 6, 8]);
        }
        #[cfg(not(feature = "parallel"))]
        {
            let result: Vec<_> = maybe_par!(data).map(|x| x * 2).collect();
            assert_eq!(result, vec![2, 4, 6, 8]);
        }
    }
}
