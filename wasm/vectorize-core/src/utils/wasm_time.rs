//! WASM-compatible timing utilities
//!
//! This module provides cross-platform timing functionality that works
//! in both native and WebAssembly environments.

use std::time::Duration;

// Platform-specific imports for time measurement
#[cfg(not(target_arch = "wasm32"))]
use std::time::Instant as StdInstant;

#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

/// Cross-platform time measurement abstraction
#[derive(Debug, Clone, Copy)]
pub struct Instant {
    #[cfg(not(target_arch = "wasm32"))]
    inner: StdInstant,
    #[cfg(target_arch = "wasm32")]
    timestamp: f64,
}

impl Instant {
    /// Create a new instant representing the current time
    pub fn now() -> Self {
        #[cfg(not(target_arch = "wasm32"))]
        {
            Self {
                inner: StdInstant::now(),
            }
        }

        #[cfg(target_arch = "wasm32")]
        {
            // Use performance.now() if available, otherwise use Date.now()
            let timestamp = if let Some(window) = web_sys::window() {
                if let Some(performance) = window.performance() {
                    performance.now()
                } else {
                    js_sys::Date::now()
                }
            } else {
                // Fallback for web workers or other contexts
                js_sys::Date::now()
            };
            
            Self { timestamp }
        }
    }

    /// Calculate the elapsed duration since this instant
    pub fn elapsed(self) -> Duration {
        #[cfg(not(target_arch = "wasm32"))]
        {
            self.inner.elapsed()
        }

        #[cfg(target_arch = "wasm32")]
        {
            let now = if let Some(window) = web_sys::window() {
                if let Some(performance) = window.performance() {
                    performance.now()
                } else {
                    js_sys::Date::now()
                }
            } else {
                js_sys::Date::now()
            };
            
            let elapsed_ms = (now - self.timestamp).max(0.0);
            Duration::from_millis(elapsed_ms as u64)
        }
    }

    /// Calculate the duration between two instants
    pub fn duration_since(&self, earlier: Instant) -> Duration {
        #[cfg(not(target_arch = "wasm32"))]
        {
            self.inner.duration_since(earlier.inner)
        }

        #[cfg(target_arch = "wasm32")]
        {
            let diff_ms = (self.timestamp - earlier.timestamp).max(0.0);
            Duration::from_millis(diff_ms as u64)
        }
    }

    /// Check if this instant is later than another
    pub fn checked_duration_since(&self, earlier: Instant) -> Option<Duration> {
        #[cfg(not(target_arch = "wasm32"))]
        {
            self.inner.checked_duration_since(earlier.inner)
        }

        #[cfg(target_arch = "wasm32")]
        {
            let diff_ms = self.timestamp - earlier.timestamp;
            if diff_ms >= 0.0 {
                Some(Duration::from_millis(diff_ms as u64))
            } else {
                None
            }
        }
    }

    /// Get the timestamp as milliseconds (mainly for debugging)
    #[cfg(target_arch = "wasm32")]
    pub fn as_millis(&self) -> f64 {
        self.timestamp
    }
}

/// Measure the time taken by a closure
pub fn measure_time<F, R>(f: F) -> (R, Duration)
where
    F: FnOnce() -> R,
{
    let start = Instant::now();
    let result = f();
    let elapsed = start.elapsed();
    (result, elapsed)
}

/// Measure the time taken by a closure and log it
pub fn measure_and_log<F, R>(operation: &str, f: F) -> R
where
    F: FnOnce() -> R,
{
    let (result, elapsed) = measure_time(f);
    log::debug!("{} took {:.2}ms", operation, elapsed.as_millis());
    result
}

/// Create a simple timer that can be used to measure elapsed time
pub struct Timer {
    start: Instant,
}

impl Timer {
    /// Create a new timer starting now
    pub fn new() -> Self {
        Self {
            start: Instant::now(),
        }
    }

    /// Get the elapsed time since the timer was created
    pub fn elapsed(&self) -> Duration {
        self.start.elapsed()
    }

    /// Get elapsed time in milliseconds as f64
    pub fn elapsed_ms(&self) -> f64 {
        self.elapsed().as_millis() as f64
    }

    /// Reset the timer to the current time
    pub fn reset(&mut self) {
        self.start = Instant::now();
    }
}

impl Default for Timer {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::thread;

    #[test]
    fn test_instant_now() {
        let instant1 = Instant::now();
        thread::sleep(Duration::from_millis(1));
        let instant2 = Instant::now();
        
        assert!(instant2.elapsed() < instant1.elapsed());
    }

    #[test]
    fn test_instant_elapsed() {
        let instant = Instant::now();
        thread::sleep(Duration::from_millis(10));
        let elapsed = instant.elapsed();
        
        // Should be at least 10ms, but allow for some variance
        assert!(elapsed >= Duration::from_millis(5));
        assert!(elapsed < Duration::from_millis(100));
    }

    #[test]
    fn test_duration_since() {
        let instant1 = Instant::now();
        thread::sleep(Duration::from_millis(5));
        let instant2 = Instant::now();
        
        let duration = instant2.duration_since(instant1);
        assert!(duration >= Duration::from_millis(1));
        assert!(duration < Duration::from_millis(50));
    }

    #[test]
    fn test_measure_time() {
        let (result, duration) = measure_time(|| {
            thread::sleep(Duration::from_millis(10));
            42
        });
        
        assert_eq!(result, 42);
        assert!(duration >= Duration::from_millis(5));
    }

    #[test]
    fn test_timer() {
        let mut timer = Timer::new();
        thread::sleep(Duration::from_millis(10));
        
        let elapsed = timer.elapsed();
        assert!(elapsed >= Duration::from_millis(5));
        
        timer.reset();
        let elapsed_after_reset = timer.elapsed();
        assert!(elapsed_after_reset < elapsed);
    }
}