//! Execution abstraction layer for single-threaded WASM + Web Worker architecture
//!
//! This module provides a unified interface for execution that was previously complex
//! parallel/single-threaded, now simplified for our single-threaded WASM + Web Worker
//! architecture. All functions provide sequential execution with the same API as before
//! for backward compatibility.
//!
//! ## Architecture
//! - **Single-threaded WASM**: All processing runs single-threaded in WASM module
//! - **Web Worker parallelism**: JavaScript-level parallelism through Web Workers
//! - **Stable & reliable**: No complex threading or SharedArrayBuffer requirements

use std::cmp::Ord;
use std::marker::PhantomData;
use std::sync::atomic::{AtomicBool, Ordering};

/// Algorithm types for configuration (threading no longer used)
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AlgorithmType {
    EdgeDetection,
    Centerline,
    Superpixel,
    Dots,
}

/// Threading configuration (simplified for single-threaded mode)
#[derive(Debug, Clone, Default)]
pub struct ThreadingConfig {
    pub edge_detection_enabled: bool,
    pub centerline_enabled: bool,
    pub superpixel_enabled: bool,
    pub dots_enabled: bool,
}

impl ThreadingConfig {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn is_enabled_for(&self, algorithm: AlgorithmType) -> bool {
        match algorithm {
            AlgorithmType::EdgeDetection => self.edge_detection_enabled,
            AlgorithmType::Centerline => self.centerline_enabled,
            AlgorithmType::Superpixel => self.superpixel_enabled,
            AlgorithmType::Dots => self.dots_enabled,
        }
    }

    pub fn enable_for(mut self, algorithm: AlgorithmType) -> Self {
        match algorithm {
            AlgorithmType::EdgeDetection => self.edge_detection_enabled = true,
            AlgorithmType::Centerline => self.centerline_enabled = true,
            AlgorithmType::Superpixel => self.superpixel_enabled = true,
            AlgorithmType::Dots => self.dots_enabled = true,
        }
        self
    }

    /// Create safe defaults for single-threaded mode
    pub fn safe_defaults() -> Self {
        Self::new()
    }
}

/// Simple threading state tracking
static THREADING_FAILED: AtomicBool = AtomicBool::new(false);

/// Threading errors (simplified)
#[derive(Debug, Clone)]
pub enum ThreadingError {
    NotSupported,
    Panic,
}

impl std::fmt::Display for ThreadingError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ThreadingError::NotSupported => {
                write!(f, "Threading not supported in single-threaded mode")
            }
            ThreadingError::Panic => write!(f, "Operation panicked"),
        }
    }
}

impl std::error::Error for ThreadingError {}

/// Mark threading as failed (no-op in single-threaded mode)
pub fn mark_threading_failed() {
    THREADING_FAILED.store(true, Ordering::Relaxed);
}

/// Check if threading has failed (always false in single-threaded mode)
pub fn has_threading_failed() -> bool {
    false
}

/// Confirm threading success (no-op in single-threaded mode)
pub fn confirm_threading_success() {
    THREADING_FAILED.store(false, Ordering::Relaxed);
}

/// Single-threaded execution - no parallel imports needed
///
/// Execute with thread safety and automatic fallback
pub fn with_thread_safe_execution<F, R>(f: F) -> Result<R, ThreadingError>
where
    F: FnOnce() -> R + Send + 'static,
    R: Send + 'static,
{
    #[cfg(feature = "enhanced-error-handling")]
    {
        // Try to catch panics in operations
        match std::panic::catch_unwind(std::panic::AssertUnwindSafe(f)) {
            Ok(result) => Ok(result),
            Err(panic_err) => {
                log::warn!("Operation panicked: {:?}", panic_err);
                mark_threading_failed();
                Err(ThreadingError::Panic)
            }
        }
    }
    #[cfg(not(feature = "enhanced-error-handling"))]
    {
        // Direct execution without panic handling
        Ok(f())
    }
}

/// Enhanced execute_parallel with algorithm-specific configuration
pub fn execute_algorithm_parallel<I, F, R>(
    algorithm: AlgorithmType,
    items: I,
    func: F,
    config: &ThreadingConfig,
) -> Vec<R>
where
    I: IntoIterator,
    I::Item: Send + Sync,
    F: Fn(I::Item) -> R + Send + Sync,
    R: Send,
{
    // Log which algorithm is being used (config is ignored in single-threaded mode)
    log::debug!("Using single-threaded execution for {:?}", algorithm);
    let _ = config; // Suppress unused warning
    items.into_iter().map(func).collect()
}

/// Check if threading is supported in the current environment
/// Always returns false for single-threaded WASM + Web Worker architecture
pub fn is_threading_supported() -> bool {
    false
}

/// Execute processing using single-threaded approach (WASM + Web Worker architecture)
/// Simple sequential processing for optimal stability
pub fn execute_parallel<I, F, R>(items: I, func: F) -> Vec<R>
where
    I: IntoIterator,
    I::Item: Send + Sync,
    F: Fn(I::Item) -> R + Send + Sync,
    R: Send,
{
    items.into_iter().map(func).collect()
}

/// Execute filter_map using single-threaded approach (WASM + Web Worker architecture)
pub fn execute_parallel_filter_map<I, F, R>(items: I, func: F) -> Vec<R>
where
    I: IntoIterator,
    I::Item: Send + Sync,
    F: Fn(I::Item) -> Option<R> + Send + Sync,
    R: Send,
{
    items.into_iter().filter_map(func).collect()
}

/// Execute chunks processing using single-threaded approach (WASM + Web Worker architecture)
pub fn execute_parallel_chunks<I, F, R>(items: I, chunk_size: usize, func: F) -> Vec<R>
where
    I: IntoIterator,
    I::Item: Send + Sync,
    F: Fn(&[I::Item]) -> R + Send + Sync,
    R: Send,
{
    let vec: Vec<_> = items.into_iter().collect();
    vec.chunks(chunk_size).map(func).collect()
}

/// Thread pool configuration abstraction
#[derive(Debug, Clone, Default)]
pub struct ThreadPoolConfig {
    pub num_threads: Option<usize>,
    pub stack_size: Option<usize>,
    pub thread_name: Option<String>,
}

/// Execute operation directly (single-threaded WASM + Web Worker architecture)
/// Thread pool config is ignored in single-threaded mode
pub fn with_thread_pool<F, R>(config: &ThreadPoolConfig, f: F) -> R
where
    F: FnOnce() -> R + Send,
    R: Send,
{
    let _ = config; // Config ignored in single-threaded mode
    f()
}

/// Get the current number of threads available
/// Always returns 1 for single-threaded WASM + Web Worker architecture
pub fn current_num_threads() -> usize {
    1
}

/// Configure thread pool (no-op for single-threaded WASM + Web Worker architecture)
pub fn configure_thread_pool(_config: &ThreadPoolConfig) {
    // No-op in single-threaded mode
}

// ==============================================================================
// Fork-Join Pattern
// ==============================================================================

/// Execute two operations sequentially (single-threaded WASM + Web Worker architecture)
pub fn join<A, B, RA, RB>(op_a: A, op_b: B) -> (RA, RB)
where
    A: FnOnce() -> RA + Send,
    B: FnOnce() -> RB + Send,
    RA: Send,
    RB: Send,
{
    let result_a = op_a();
    let result_b = op_b();
    (result_a, result_b)
}

/// Execute three operations sequentially (single-threaded WASM + Web Worker architecture)
pub fn join3<A, B, C, RA, RB, RC>(op_a: A, op_b: B, op_c: C) -> (RA, RB, RC)
where
    A: FnOnce() -> RA + Send,
    B: FnOnce() -> RB + Send,
    C: FnOnce() -> RC + Send,
    RA: Send,
    RB: Send,
    RC: Send,
{
    let result_a = op_a();
    let result_b = op_b();
    let result_c = op_c();
    (result_a, result_b, result_c)
}

// ==============================================================================
// Scoped Parallelism
// ==============================================================================

/// Scoped execution context (simplified for single-threaded mode)
pub struct ParallelScope {
    _phantom: PhantomData<()>,
}

impl ParallelScope {
    /// Spawn a task in the scope (runs immediately in single-threaded mode)
    pub fn spawn<F>(&self, op: F)
    where
        F: FnOnce(),
    {
        op();
    }
}

/// Execute operations within a scoped context (single-threaded mode)
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

/// Bridge iterators to execution processing (single-threaded)
pub fn par_bridge<I>(iter: I) -> ExecutionIter<I>
where
    I: IntoIterator,
{
    ExecutionIter::new(iter)
}

/// Execution iterator wrapper (single-threaded implementation)
pub struct ExecutionIter<I> {
    iter: I,
}

impl<I> ExecutionIter<I> {
    pub fn new(iter: I) -> Self {
        Self { iter }
    }
}

impl<I> ExecutionIter<I>
where
    I: IntoIterator,
{
    pub fn map<F, R>(self, func: F) -> Vec<R>
    where
        F: Fn(I::Item) -> R,
    {
        self.iter.into_iter().map(func).collect()
    }

    pub fn filter_map<F, R>(self, func: F) -> Vec<R>
    where
        F: Fn(I::Item) -> Option<R>,
    {
        self.iter.into_iter().filter_map(func).collect()
    }

    pub fn collect<C>(self) -> C
    where
        C: FromIterator<I::Item>,
    {
        self.iter.into_iter().collect()
    }
}

// ==============================================================================
// Mutable Operations
// ==============================================================================

/// Process chunks mutably (single-threaded)
pub fn process_chunks_mut<T, F>(data: &mut [T], chunk_size: usize, func: F)
where
    F: Fn(&mut [T]),
{
    for chunk in data.chunks_mut(chunk_size) {
        func(chunk);
    }
}

/// Sort data (single-threaded)
pub fn par_sort<T>(data: &mut [T])
where
    T: Ord + Send,
{
    data.sort();
}

/// Sort data by key (single-threaded)
pub fn par_sort_by<T, F>(data: &mut [T], compare: F)
where
    T: Send,
    F: Fn(&T, &T) -> std::cmp::Ordering + Sync,
{
    data.sort_by(compare);
}

/// Sort data by key function (single-threaded)
pub fn par_sort_by_key<T, K, F>(data: &mut [T], key: F)
where
    T: Send,
    K: Ord,
    F: Fn(&T) -> K,
{
    data.sort_by_key(key);
}

/// Extend collection (single-threaded)
pub fn par_extend<T, I>(vec: &mut Vec<T>, iter: I)
where
    T: Send,
    I: IntoIterator<Item = T>,
{
    vec.extend(iter);
}

/// Reduce operation (single-threaded)
pub fn reduce<T, F>(slice: &[T], identity: T, func: F) -> T
where
    T: Send + Clone,
    F: Fn(&T, &T) -> T + Send + Sync,
{
    slice.iter().fold(identity, |acc, item| func(&acc, item))
}

// ==============================================================================
// Window Operations
// ==============================================================================

/// Process windows (single-threaded)
pub fn par_windows<T, F, R>(data: &[T], window_size: usize, func: F) -> Vec<R>
where
    T: Send + Sync,
    F: Fn(&[T]) -> R + Send + Sync,
    R: Send,
{
    data.windows(window_size).map(func).collect()
}

/// Process overlapping windows (single-threaded)
pub fn par_windows_with_overlap<T, F, R>(
    data: &[T],
    window_size: usize,
    overlap: usize,
    func: F,
) -> Vec<R>
where
    T: Send + Sync,
    F: Fn(&[T]) -> R + Send + Sync,
    R: Send,
{
    let step = window_size - overlap;
    let mut results = Vec::new();
    let mut i = 0;

    while i + window_size <= data.len() {
        results.push(func(&data[i..i + window_size]));
        i += step;
    }

    results
}

// ==============================================================================
// Advanced Patterns
// ==============================================================================

/// Batch process items (single-threaded)
pub fn batch_process<T, F, R>(items: Vec<T>, batch_size: usize, func: F) -> Vec<R>
where
    T: Send + Sync,
    F: Fn(&[T]) -> R + Send + Sync,
    R: Send,
{
    items.chunks(batch_size).map(func).collect()
}

/// Pipeline operations (single-threaded)
pub fn pipeline<T, F1, F2, R1, R2>(items: Vec<T>, stage1: F1, stage2: F2) -> Vec<R2>
where
    T: Send + Sync,
    F1: Fn(T) -> R1 + Send + Sync,
    F2: Fn(R1) -> R2 + Send + Sync,
    R1: Send + Sync,
    R2: Send,
{
    items.into_iter().map(stage1).map(stage2).collect()
}

/// Map-reduce pattern (single-threaded)
pub fn map_reduce<T, M, R, F, G>(items: Vec<T>, map_func: M, reduce_func: R, identity: G) -> G
where
    T: Send + Sync,
    M: Fn(T) -> G + Send + Sync,
    R: Fn(G, G) -> G + Send + Sync,
    G: Send + Clone,
{
    items.into_iter().map(map_func).fold(identity, reduce_func)
}

// ==============================================================================
// Additional API Compatibility Functions
// ==============================================================================

/// Parallel iterator (single-threaded implementation)
pub fn par_iter<T>(items: &[T]) -> std::slice::Iter<'_, T> {
    items.iter()
}

/// Parallel mutable iterator (single-threaded implementation)
pub fn par_iter_mut<T>(items: &mut [T]) -> std::slice::IterMut<'_, T> {
    items.iter_mut()
}

/// Parallel enumerate (single-threaded implementation)
pub fn par_enumerate<T>(items: &[T]) -> std::iter::Enumerate<std::slice::Iter<'_, T>> {
    items.iter().enumerate()
}

/// Parallel zip (single-threaded implementation)
pub fn par_zip<'a, T, U>(
    a: &'a [T],
    b: &'a [U],
) -> std::iter::Zip<std::slice::Iter<'a, T>, std::slice::Iter<'a, U>> {
    a.iter().zip(b.iter())
}

/// Check if parallel processing should be used (always false in single-threaded mode)
pub fn should_use_parallel(_size: usize, _threshold: usize) -> bool {
    false
}
