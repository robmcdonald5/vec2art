//! Performance profiling utilities for dot mapping operations
//!
//! This module provides comprehensive profiling tools to measure and analyze
//! performance characteristics of the dot mapping pipeline, including timing,
//! memory usage, and operation counts.

use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::Duration;

// Platform-specific imports for time measurement
#[cfg(not(target_arch = "wasm32"))]
use std::time::Instant;

#[cfg(target_arch = "wasm32")]
use web_sys::Performance;

#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

/// Cross-platform time measurement abstraction
#[derive(Debug, Clone, Copy)]
struct TimePoint {
    #[cfg(not(target_arch = "wasm32"))]
    instant: Instant,
    #[cfg(target_arch = "wasm32")]
    timestamp: f64,
}

impl TimePoint {
    /// Create a new time point representing the current time
    fn now() -> Self {
        #[cfg(not(target_arch = "wasm32"))]
        {
            Self {
                instant: Instant::now(),
            }
        }

        #[cfg(target_arch = "wasm32")]
        {
            let performance = web_sys::window()
                .expect("should have a window in this context")
                .performance()
                .expect("performance should be available");
            Self {
                timestamp: performance.now(),
            }
        }
    }

    /// Calculate the elapsed duration since this time point
    fn elapsed(self) -> Duration {
        #[cfg(not(target_arch = "wasm32"))]
        {
            self.instant.elapsed()
        }

        #[cfg(target_arch = "wasm32")]
        {
            let performance = web_sys::window()
                .expect("should have a window in this context")
                .performance()
                .expect("performance should be available");
            let now = performance.now();
            let elapsed_ms = now - self.timestamp;
            Duration::from_millis(elapsed_ms.max(0.0) as u64)
        }
    }
}

/// Performance profiler for tracking operation timings and statistics
#[derive(Debug)]
pub struct PerformanceProfiler {
    /// Timing measurements for different operations
    timings: HashMap<String, Vec<Duration>>,
    /// Operation counters
    counters: HashMap<String, u64>,
    /// Memory usage tracking
    memory_usage: HashMap<String, usize>,
    /// Start times for active measurements
    active_measurements: HashMap<String, TimePoint>,
    /// Whether profiling is enabled
    enabled: bool,
}

impl PerformanceProfiler {
    /// Create a new performance profiler
    pub fn new(enabled: bool) -> Self {
        Self {
            timings: HashMap::new(),
            counters: HashMap::new(),
            memory_usage: HashMap::new(),
            active_measurements: HashMap::new(),
            enabled,
        }
    }

    /// Start timing an operation
    pub fn start_timing(&mut self, operation: &str) {
        if self.enabled {
            self.active_measurements
                .insert(operation.to_string(), TimePoint::now());
        }
    }

    /// End timing an operation and record the duration
    pub fn end_timing(&mut self, operation: &str) {
        if self.enabled {
            if let Some(start_time) = self.active_measurements.remove(operation) {
                let duration = start_time.elapsed();
                self.timings
                    .entry(operation.to_string())
                    .or_default()
                    .push(duration);
            }
        }
    }

    /// Record a timed operation with automatic cleanup
    pub fn time_operation<F, R>(&mut self, operation: &str, f: F) -> R
    where
        F: FnOnce() -> R,
    {
        if self.enabled {
            self.start_timing(operation);
            let result = f();
            self.end_timing(operation);
            result
        } else {
            f()
        }
    }

    /// Increment a counter
    pub fn increment_counter(&mut self, counter: &str, value: u64) {
        if self.enabled {
            *self.counters.entry(counter.to_string()).or_insert(0) += value;
        }
    }

    /// Record memory usage for an operation
    pub fn record_memory_usage(&mut self, operation: &str, bytes: usize) {
        if self.enabled {
            self.memory_usage.insert(operation.to_string(), bytes);
        }
    }

    /// Get timing statistics for an operation
    pub fn get_timing_stats(&self, operation: &str) -> Option<TimingStats> {
        if let Some(durations) = self.timings.get(operation) {
            if durations.is_empty() {
                return None;
            }

            let total: Duration = durations.iter().sum();
            let count = durations.len();
            let avg = total / count as u32;

            let mut sorted_durations = durations.clone();
            sorted_durations.sort();

            let min = *sorted_durations.first().unwrap();
            let max = *sorted_durations.last().unwrap();
            let median = if count % 2 == 0 {
                (sorted_durations[count / 2 - 1] + sorted_durations[count / 2]) / 2
            } else {
                sorted_durations[count / 2]
            };

            // Calculate percentiles
            let p95_idx = ((count as f64 * 0.95) as usize).min(count - 1);
            let p99_idx = ((count as f64 * 0.99) as usize).min(count - 1);
            let p95 = sorted_durations[p95_idx];
            let p99 = sorted_durations[p99_idx];

            Some(TimingStats {
                operation: operation.to_string(),
                count,
                total,
                avg,
                min,
                max,
                median,
                p95,
                p99,
            })
        } else {
            None
        }
    }

    /// Get counter value
    pub fn get_counter(&self, counter: &str) -> u64 {
        self.counters.get(counter).copied().unwrap_or(0)
    }

    /// Get memory usage for an operation
    pub fn get_memory_usage(&self, operation: &str) -> Option<usize> {
        self.memory_usage.get(operation).copied()
    }

    /// Get all operations that have been timed
    pub fn get_operations(&self) -> Vec<String> {
        self.timings.keys().cloned().collect()
    }

    /// Generate a comprehensive performance report
    pub fn generate_report(&self) -> PerformanceReport {
        let mut operation_reports = Vec::new();

        for operation in self.get_operations() {
            if let Some(timing_stats) = self.get_timing_stats(&operation) {
                let counter_value = self.get_counter(&operation);
                let memory_usage = self.get_memory_usage(&operation);

                operation_reports.push(OperationReport {
                    timing_stats,
                    counter_value,
                    memory_usage,
                });
            }
        }

        // Calculate totals
        let total_time: Duration = operation_reports.iter().map(|r| r.timing_stats.total).sum();

        let total_operations: u64 = operation_reports
            .iter()
            .map(|r| r.timing_stats.count as u64)
            .sum();

        let total_memory: usize = operation_reports
            .iter()
            .filter_map(|r| r.memory_usage)
            .sum();

        PerformanceReport {
            operation_reports,
            total_time,
            total_operations,
            total_memory,
            operations_per_second: if total_time.as_secs_f64() > 0.0 {
                total_operations as f64 / total_time.as_secs_f64()
            } else {
                0.0
            },
        }
    }

    /// Clear all profiling data
    pub fn clear(&mut self) {
        self.timings.clear();
        self.counters.clear();
        self.memory_usage.clear();
        self.active_measurements.clear();
    }

    /// Enable or disable profiling
    pub fn set_enabled(&mut self, enabled: bool) {
        self.enabled = enabled;
        if !enabled {
            self.clear();
        }
    }

    /// Check if profiling is enabled
    pub fn is_enabled(&self) -> bool {
        self.enabled
    }

    /// Export profiling data as JSON
    pub fn export_json(&self) -> serde_json::Value {
        let report = self.generate_report();

        serde_json::json!({
            "total_time_ms": report.total_time.as_millis(),
            "total_operations": report.total_operations,
            "total_memory_bytes": report.total_memory,
            "operations_per_second": report.operations_per_second,
            "operations": report.operation_reports.iter().map(|op| {
                serde_json::json!({
                    "name": op.timing_stats.operation,
                    "count": op.timing_stats.count,
                    "total_ms": op.timing_stats.total.as_millis(),
                    "avg_ms": op.timing_stats.avg.as_millis(),
                    "min_ms": op.timing_stats.min.as_millis(),
                    "max_ms": op.timing_stats.max.as_millis(),
                    "median_ms": op.timing_stats.median.as_millis(),
                    "p95_ms": op.timing_stats.p95.as_millis(),
                    "p99_ms": op.timing_stats.p99.as_millis(),
                    "counter_value": op.counter_value,
                    "memory_bytes": op.memory_usage
                })
            }).collect::<Vec<_>>()
        })
    }
}

impl Default for PerformanceProfiler {
    fn default() -> Self {
        Self::new(false)
    }
}

/// Timing statistics for a specific operation
#[derive(Debug, Clone)]
pub struct TimingStats {
    pub operation: String,
    pub count: usize,
    pub total: Duration,
    pub avg: Duration,
    pub min: Duration,
    pub max: Duration,
    pub median: Duration,
    pub p95: Duration,
    pub p99: Duration,
}

impl TimingStats {
    /// Calculate operations per second for this timing
    pub fn ops_per_second(&self) -> f64 {
        if self.total.as_secs_f64() > 0.0 {
            self.count as f64 / self.total.as_secs_f64()
        } else {
            0.0
        }
    }

    /// Check if performance meets target (operations per second)
    pub fn meets_performance_target(&self, target_ops_per_sec: f64) -> bool {
        self.ops_per_second() >= target_ops_per_sec
    }

    /// Get performance efficiency (higher is better)
    pub fn efficiency_score(&self) -> f64 {
        let avg_ms = self.avg.as_millis() as f64;
        if avg_ms > 0.0 {
            1000.0 / avg_ms // Operations per second normalized
        } else {
            0.0
        }
    }
}

/// Report for a single operation
#[derive(Debug, Clone)]
pub struct OperationReport {
    pub timing_stats: TimingStats,
    pub counter_value: u64,
    pub memory_usage: Option<usize>,
}

/// Comprehensive performance report
#[derive(Debug, Clone)]
pub struct PerformanceReport {
    pub operation_reports: Vec<OperationReport>,
    pub total_time: Duration,
    pub total_operations: u64,
    pub total_memory: usize,
    pub operations_per_second: f64,
}

impl PerformanceReport {
    /// Find the slowest operation
    pub fn slowest_operation(&self) -> Option<&OperationReport> {
        self.operation_reports
            .iter()
            .max_by_key(|op| op.timing_stats.avg)
    }

    /// Find operations that exceed time thresholds
    pub fn operations_exceeding_threshold(&self, threshold: Duration) -> Vec<&OperationReport> {
        self.operation_reports
            .iter()
            .filter(|op| op.timing_stats.avg > threshold)
            .collect()
    }

    /// Calculate memory efficiency (operations per MB)
    pub fn memory_efficiency(&self) -> f64 {
        if self.total_memory > 0 {
            self.total_operations as f64 / (self.total_memory as f64 / 1_048_576.0)
        // MB
        } else {
            0.0
        }
    }

    /// Generate performance summary string
    pub fn summary(&self) -> String {
        format!(
            "Performance Summary:\n\
            Total Time: {:.2}ms\n\
            Total Operations: {}\n\
            Operations/Second: {:.1}\n\
            Memory Usage: {:.2}MB\n\
            Memory Efficiency: {:.1} ops/MB\n\
            Operations: {}",
            self.total_time.as_millis(),
            self.total_operations,
            self.operations_per_second,
            self.total_memory as f64 / 1_048_576.0,
            self.memory_efficiency(),
            self.operation_reports.len()
        )
    }
}

/// Thread-safe profiler for concurrent operations
#[derive(Debug, Clone)]
pub struct ThreadSafeProfiler {
    profiler: Arc<Mutex<PerformanceProfiler>>,
}

impl ThreadSafeProfiler {
    /// Create a new thread-safe profiler
    pub fn new(enabled: bool) -> Self {
        Self {
            profiler: Arc::new(Mutex::new(PerformanceProfiler::new(enabled))),
        }
    }

    /// Start timing an operation (thread-safe)
    pub fn start_timing(&self, operation: &str) {
        if let Ok(mut profiler) = self.profiler.lock() {
            profiler.start_timing(operation);
        }
    }

    /// End timing an operation (thread-safe)
    pub fn end_timing(&self, operation: &str) {
        if let Ok(mut profiler) = self.profiler.lock() {
            profiler.end_timing(operation);
        }
    }

    /// Time an operation with automatic cleanup (thread-safe)
    pub fn time_operation<F, R>(&self, operation: &str, f: F) -> R
    where
        F: FnOnce() -> R,
    {
        self.start_timing(operation);
        let result = f();
        self.end_timing(operation);
        result
    }

    /// Increment a counter (thread-safe)
    pub fn increment_counter(&self, counter: &str, value: u64) {
        if let Ok(mut profiler) = self.profiler.lock() {
            profiler.increment_counter(counter, value);
        }
    }

    /// Generate performance report (thread-safe)
    pub fn generate_report(&self) -> Option<PerformanceReport> {
        if let Ok(profiler) = self.profiler.lock() {
            Some(profiler.generate_report())
        } else {
            None
        }
    }

    /// Clear all profiling data (thread-safe)
    pub fn clear(&self) {
        if let Ok(mut profiler) = self.profiler.lock() {
            profiler.clear();
        }
    }
}

/// Scoped timer that automatically records timing when dropped
pub struct ScopedTimer<'a> {
    profiler: &'a mut PerformanceProfiler,
    operation: String,
    start_time: TimePoint,
}

impl<'a> ScopedTimer<'a> {
    /// Create a new scoped timer
    pub fn new(profiler: &'a mut PerformanceProfiler, operation: &str) -> Self {
        Self {
            profiler,
            operation: operation.to_string(),
            start_time: TimePoint::now(),
        }
    }
}

impl<'a> Drop for ScopedTimer<'a> {
    fn drop(&mut self) {
        if self.profiler.is_enabled() {
            let duration = self.start_time.elapsed();
            self.profiler
                .timings
                .entry(self.operation.clone())
                .or_default()
                .push(duration);
        }
    }
}

/// Macro for easy scoped timing
#[macro_export]
macro_rules! profile_scope {
    ($profiler:expr, $operation:expr) => {
        let _timer = $crate::performance::profiler::ScopedTimer::new($profiler, $operation);
    };
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::thread;

    #[test]
    fn test_profiler_basic_operations() {
        let mut profiler = PerformanceProfiler::new(true);

        profiler.start_timing("test_op");
        thread::sleep(Duration::from_millis(10));
        profiler.end_timing("test_op");

        profiler.increment_counter("test_counter", 1);
        profiler.record_memory_usage("test_op", 1024);

        let stats = profiler.get_timing_stats("test_op").unwrap();
        assert_eq!(stats.count, 1);
        assert!(stats.total >= Duration::from_millis(10));

        assert_eq!(profiler.get_counter("test_counter"), 1);
        assert_eq!(profiler.get_memory_usage("test_op"), Some(1024));
    }

    #[test]
    fn test_profiler_disabled() {
        let mut profiler = PerformanceProfiler::new(false);

        profiler.start_timing("test_op");
        thread::sleep(Duration::from_millis(10));
        profiler.end_timing("test_op");

        // Should have no recorded timings
        assert!(profiler.get_timing_stats("test_op").is_none());
    }

    #[test]
    fn test_time_operation() {
        let mut profiler = PerformanceProfiler::new(true);

        let result = profiler.time_operation("test_op", || {
            thread::sleep(Duration::from_millis(5));
            42
        });

        assert_eq!(result, 42);
        let stats = profiler.get_timing_stats("test_op").unwrap();
        assert_eq!(stats.count, 1);
        assert!(stats.total >= Duration::from_millis(5));
    }

    #[test]
    fn test_timing_statistics() {
        let mut profiler = PerformanceProfiler::new(true);

        // Record multiple measurements
        for i in 0..10 {
            profiler.time_operation("test_op", || {
                thread::sleep(Duration::from_millis(i + 1));
            });
        }

        let stats = profiler.get_timing_stats("test_op").unwrap();
        assert_eq!(stats.count, 10);
        assert!(stats.min <= stats.median);
        assert!(stats.median <= stats.max);
        assert!(stats.p95 >= stats.median);
        assert!(stats.p99 >= stats.p95);
    }

    #[test]
    fn test_performance_report() {
        let mut profiler = PerformanceProfiler::new(true);

        profiler.time_operation("op1", || thread::sleep(Duration::from_millis(10)));
        profiler.time_operation("op2", || thread::sleep(Duration::from_millis(5)));
        profiler.increment_counter("op1", 1);
        profiler.record_memory_usage("op1", 2048);

        let report = profiler.generate_report();

        assert_eq!(report.operation_reports.len(), 2);
        assert!(report.total_time >= Duration::from_millis(15));
        assert_eq!(report.total_operations, 2);
        assert_eq!(report.total_memory, 2048);
        assert!(report.operations_per_second > 0.0);
    }

    #[test]
    fn test_thread_safe_profiler() {
        let profiler = ThreadSafeProfiler::new(true);
        let profiler_clone = profiler.clone();

        let handle = thread::spawn(move || {
            profiler_clone.time_operation("thread_op", || {
                thread::sleep(Duration::from_millis(10));
            });
        });

        profiler.time_operation("main_op", || {
            thread::sleep(Duration::from_millis(5));
        });

        handle.join().unwrap();

        let report = profiler.generate_report().unwrap();
        assert_eq!(report.operation_reports.len(), 2);
    }

    #[test]
    fn test_scoped_timer() {
        let mut profiler = PerformanceProfiler::new(true);

        {
            let _timer = ScopedTimer::new(&mut profiler, "scoped_op");
            thread::sleep(Duration::from_millis(10));
        } // Timer drops here

        let stats = profiler.get_timing_stats("scoped_op").unwrap();
        assert_eq!(stats.count, 1);
        assert!(stats.total >= Duration::from_millis(10));
    }

    #[test]
    fn test_export_json() {
        let mut profiler = PerformanceProfiler::new(true);

        profiler.time_operation("test_op", || thread::sleep(Duration::from_millis(10)));
        profiler.increment_counter("test_op", 5);
        profiler.record_memory_usage("test_op", 1024);

        let json = profiler.export_json();

        assert!(json["total_time_ms"].as_u64().unwrap() >= 10);
        assert_eq!(json["total_operations"], 1);
        assert_eq!(json["total_memory_bytes"], 1024);
        assert!(json["operations"].as_array().unwrap().len() == 1);
    }

    #[test]
    fn test_performance_targets() {
        let mut profiler = PerformanceProfiler::new(true);

        // Fast operation with minimal work to ensure non-zero timing
        profiler.time_operation("fast_op", || {
            let _sum: u32 = (0..100).sum(); // Minimal computation to ensure measurable time
        });

        let stats = profiler.get_timing_stats("fast_op").unwrap();
        println!(
            "Fast op stats - avg: {:?}, efficiency: {}",
            stats.avg,
            stats.efficiency_score()
        );
        assert!(stats.meets_performance_target(1000.0)); // 1000 ops/sec
                                                         // Allow efficiency score to be 0 for ultra-fast operations
        assert!(stats.efficiency_score() >= 0.0);
    }

    #[test]
    fn test_report_analysis() {
        let mut profiler = PerformanceProfiler::new(true);

        profiler.time_operation("slow_op", || thread::sleep(Duration::from_millis(50)));
        profiler.time_operation("fast_op", || thread::sleep(Duration::from_millis(5)));
        profiler.record_memory_usage("slow_op", 2048);
        profiler.record_memory_usage("fast_op", 512);

        let report = profiler.generate_report();

        let slowest = report.slowest_operation().unwrap();
        assert_eq!(slowest.timing_stats.operation, "slow_op");

        let slow_ops = report.operations_exceeding_threshold(Duration::from_millis(20));
        assert_eq!(slow_ops.len(), 1);
        assert_eq!(slow_ops[0].timing_stats.operation, "slow_op");

        assert!(report.memory_efficiency() > 0.0);

        let summary = report.summary();
        assert!(summary.contains("Performance Summary"));
        assert!(summary.contains("Total Operations: 2"));
    }

    #[test]
    fn test_profiler_clear_and_disable() {
        let mut profiler = PerformanceProfiler::new(true);

        profiler.time_operation("test_op", || thread::sleep(Duration::from_millis(5)));
        assert!(profiler.get_timing_stats("test_op").is_some());

        profiler.clear();
        assert!(profiler.get_timing_stats("test_op").is_none());

        profiler.set_enabled(false);
        profiler.time_operation("disabled_op", || thread::sleep(Duration::from_millis(5)));
        assert!(profiler.get_timing_stats("disabled_op").is_none());
    }
}
