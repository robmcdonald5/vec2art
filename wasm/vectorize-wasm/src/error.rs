//! Error handling system for WebAssembly threading failures
//!
//! This module provides comprehensive error types and recovery strategies for
//! threading failures in WebAssembly environments, with detailed error context
//! and actionable suggestions for developers.

use serde::{Deserialize, Serialize};
use std::fmt;
use wasm_bindgen::prelude::*;

/// Comprehensive error types for threading failures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ThreadingError {
    /// Thread pool initialization failed
    ThreadPoolInitError {
        reason: String,
        retry_count: u32,
        max_retries: u32,
        last_error: String,
    },
    /// SharedArrayBuffer is not available or cannot be used
    SharedArrayBufferError {
        available: bool,
        can_instantiate: bool,
        browser_info: String,
        suggestions: Vec<String>,
    },
    /// Cross-Origin Isolation is not properly configured
    CrossOriginIsolationError {
        current_state: bool,
        missing_headers: Vec<String>,
        recommendations: Vec<String>,
    },
    /// Browser compatibility issues
    BrowserCompatibilityError {
        user_agent: String,
        missing_features: Vec<String>,
        supported_alternatives: Vec<String>,
    },
    /// Generic threading operation failure
    ThreadingOperationError {
        operation: String,
        error_message: String,
        recovery_strategy: RecoveryStrategy,
    },
    /// Thread pool is in failed state
    ThreadPoolFailedState {
        failure_reason: String,
        fallback_available: bool,
        performance_impact: f32,
    },
}

/// Recovery strategies for different error types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RecoveryStrategy {
    /// Retry with exponential backoff
    RetryWithBackoff {
        base_delay_ms: u64,
        max_retries: u32,
        current_retry: u32,
    },
    /// Fall back to single-threaded execution
    FallbackToSingleThreaded {
        reason: String,
        performance_impact: f32,
    },
    /// Reduce thread count and retry
    ReduceThreadCount {
        current_threads: usize,
        suggested_threads: usize,
    },
    /// Wait for environment change
    WaitForEnvironmentChange {
        missing_requirement: String,
        check_interval_ms: u64,
    },
    /// No recovery possible
    NoRecoveryAvailable {
        reason: String,
        alternatives: Vec<String>,
    },
}

/// Threading error context with detailed information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorContext {
    pub error: ThreadingError,
    pub timestamp: String,
    pub environment_info: EnvironmentInfo,
    pub attempted_solutions: Vec<String>,
    pub recovery_suggestions: Vec<String>,
}

/// Environment information for error context
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnvironmentInfo {
    pub environment_type: String,
    pub user_agent: Option<String>,
    pub hardware_concurrency: Option<u32>,
    pub shared_array_buffer_available: bool,
    pub cross_origin_isolated: bool,
    pub web_workers_available: bool,
    pub atomics_available: bool,
}

/// WASM-bindgen wrapper for ThreadingError
#[wasm_bindgen]
pub struct WasmThreadingError {
    inner: ThreadingError,
    context: ErrorContext,
}

#[wasm_bindgen]
impl WasmThreadingError {
    /// Get error type as string
    #[wasm_bindgen(getter)]
    pub fn error_type(&self) -> String {
        match &self.inner {
            ThreadingError::ThreadPoolInitError { .. } => "ThreadPoolInitError".to_string(),
            ThreadingError::SharedArrayBufferError { .. } => "SharedArrayBufferError".to_string(),
            ThreadingError::CrossOriginIsolationError { .. } => {
                "CrossOriginIsolationError".to_string()
            }
            ThreadingError::BrowserCompatibilityError { .. } => {
                "BrowserCompatibilityError".to_string()
            }
            ThreadingError::ThreadingOperationError { .. } => "ThreadingOperationError".to_string(),
            ThreadingError::ThreadPoolFailedState { .. } => "ThreadPoolFailedState".to_string(),
        }
    }

    /// Get error message
    #[wasm_bindgen(getter)]
    pub fn message(&self) -> String {
        format!("{}", self.inner)
    }

    /// Get recovery suggestions
    #[wasm_bindgen(getter)]
    pub fn recovery_suggestions(&self) -> Vec<JsValue> {
        self.context
            .recovery_suggestions
            .iter()
            .map(|s| JsValue::from_str(s))
            .collect()
    }

    /// Get attempted solutions
    #[wasm_bindgen(getter)]
    pub fn attempted_solutions(&self) -> Vec<JsValue> {
        self.context
            .attempted_solutions
            .iter()
            .map(|s| JsValue::from_str(s))
            .collect()
    }

    /// Get environment information as JSON
    #[wasm_bindgen(getter)]
    pub fn environment_info(&self) -> Result<String, JsValue> {
        serde_json::to_string(&self.context.environment_info)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Check if recovery is possible
    #[wasm_bindgen(getter)]
    pub fn is_recoverable(&self) -> bool {
        match &self.inner {
            ThreadingError::ThreadPoolInitError {
                retry_count,
                max_retries,
                ..
            } => retry_count < max_retries,
            ThreadingError::SharedArrayBufferError { .. } => false,
            ThreadingError::CrossOriginIsolationError { .. } => false,
            ThreadingError::BrowserCompatibilityError { .. } => false,
            ThreadingError::ThreadingOperationError {
                recovery_strategy, ..
            } => !matches!(
                recovery_strategy,
                RecoveryStrategy::NoRecoveryAvailable { .. }
            ),
            ThreadingError::ThreadPoolFailedState {
                fallback_available, ..
            } => *fallback_available,
        }
    }

    /// Get expected performance impact (0.0 = no impact, 1.0 = severe impact)
    #[wasm_bindgen(getter)]
    pub fn performance_impact(&self) -> f32 {
        match &self.inner {
            ThreadingError::ThreadPoolInitError { .. } => 0.7,
            ThreadingError::SharedArrayBufferError { .. } => 0.8,
            ThreadingError::CrossOriginIsolationError { .. } => 0.8,
            ThreadingError::BrowserCompatibilityError { .. } => 0.9,
            ThreadingError::ThreadingOperationError {
                recovery_strategy, ..
            } => match recovery_strategy {
                RecoveryStrategy::FallbackToSingleThreaded {
                    performance_impact, ..
                } => *performance_impact,
                _ => 0.5,
            },
            ThreadingError::ThreadPoolFailedState {
                performance_impact, ..
            } => *performance_impact,
        }
    }
}

impl fmt::Display for ThreadingError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ThreadingError::ThreadPoolInitError {
                reason,
                retry_count,
                max_retries,
                last_error,
            } => {
                write!(
                    f,
                    "Thread pool initialization failed: {} (retry {}/{}) - Last error: {}",
                    reason, retry_count, max_retries, last_error
                )
            }
            ThreadingError::SharedArrayBufferError {
                available,
                can_instantiate,
                browser_info,
                ..
            } => {
                write!(
                    f,
                    "SharedArrayBuffer error: available={}, can_instantiate={}, browser={}",
                    available, can_instantiate, browser_info
                )
            }
            ThreadingError::CrossOriginIsolationError {
                current_state,
                missing_headers,
                ..
            } => {
                write!(
                    f,
                    "Cross-Origin Isolation error: enabled={}, missing headers: {}",
                    current_state,
                    missing_headers.join(", ")
                )
            }
            ThreadingError::BrowserCompatibilityError {
                user_agent,
                missing_features,
                ..
            } => {
                write!(
                    f,
                    "Browser compatibility error: {} - Missing features: {}",
                    user_agent,
                    missing_features.join(", ")
                )
            }
            ThreadingError::ThreadingOperationError {
                operation,
                error_message,
                ..
            } => {
                write!(
                    f,
                    "Threading operation '{}' failed: {}",
                    operation, error_message
                )
            }
            ThreadingError::ThreadPoolFailedState {
                failure_reason,
                fallback_available,
                ..
            } => {
                write!(
                    f,
                    "Thread pool failed: {} (fallback available: {})",
                    failure_reason, fallback_available
                )
            }
        }
    }
}

impl std::error::Error for ThreadingError {}

/// Error recovery manager for handling threading failures
pub struct ErrorRecoveryManager {
    #[allow(dead_code)]
    max_retries: u32,
    #[allow(dead_code)]
    base_delay_ms: u64,
    #[allow(dead_code)]
    retry_counts: std::collections::HashMap<String, u32>,
}

impl ErrorRecoveryManager {
    /// Create new error recovery manager
    pub fn new(max_retries: u32, base_delay_ms: u64) -> Self {
        Self {
            max_retries,
            base_delay_ms,
            retry_counts: std::collections::HashMap::new(),
        }
    }

    /// Attempt to recover from a threading error
    #[allow(dead_code)]
    pub async fn recover_from_error(
        &mut self,
        error: &ThreadingError,
    ) -> Result<RecoveryAction, String> {
        match error {
            ThreadingError::ThreadPoolInitError { reason, .. } => {
                self.handle_thread_pool_init_error(reason).await
            }
            ThreadingError::SharedArrayBufferError { .. } => {
                Ok(RecoveryAction::FallbackToSingleThreaded {
                    reason: "SharedArrayBuffer not available".to_string(),
                })
            }
            ThreadingError::CrossOriginIsolationError { .. } => {
                Ok(RecoveryAction::FallbackToSingleThreaded {
                    reason: "Cross-Origin Isolation not enabled".to_string(),
                })
            }
            ThreadingError::BrowserCompatibilityError { .. } => {
                Ok(RecoveryAction::FallbackToSingleThreaded {
                    reason: "Browser compatibility issues".to_string(),
                })
            }
            ThreadingError::ThreadingOperationError {
                recovery_strategy, ..
            } => self.apply_recovery_strategy(recovery_strategy).await,
            ThreadingError::ThreadPoolFailedState {
                fallback_available, ..
            } => {
                if *fallback_available {
                    Ok(RecoveryAction::FallbackToSingleThreaded {
                        reason: "Thread pool failed".to_string(),
                    })
                } else {
                    Err("No fallback available".to_string())
                }
            }
        }
    }

    #[allow(dead_code)]
    async fn handle_thread_pool_init_error(
        &mut self,
        reason: &str,
    ) -> Result<RecoveryAction, String> {
        let retry_count = self.retry_counts.get(reason).unwrap_or(&0) + 1;
        self.retry_counts.insert(reason.to_string(), retry_count);

        if retry_count <= self.max_retries {
            let delay = self.base_delay_ms * (1 << (retry_count - 1)); // Exponential backoff
            Ok(RecoveryAction::RetryAfterDelay { delay_ms: delay })
        } else {
            Ok(RecoveryAction::FallbackToSingleThreaded {
                reason: format!(
                    "Max retries ({}) exceeded for: {}",
                    self.max_retries, reason
                ),
            })
        }
    }

    #[allow(dead_code)]
    async fn apply_recovery_strategy(
        &self,
        strategy: &RecoveryStrategy,
    ) -> Result<RecoveryAction, String> {
        match strategy {
            RecoveryStrategy::RetryWithBackoff {
                base_delay_ms,
                current_retry,
                max_retries,
            } => {
                if current_retry < max_retries {
                    let delay = base_delay_ms * (1 << current_retry);
                    Ok(RecoveryAction::RetryAfterDelay { delay_ms: delay })
                } else {
                    Ok(RecoveryAction::FallbackToSingleThreaded {
                        reason: "Max retries exceeded".to_string(),
                    })
                }
            }
            RecoveryStrategy::FallbackToSingleThreaded { reason, .. } => {
                Ok(RecoveryAction::FallbackToSingleThreaded {
                    reason: reason.clone(),
                })
            }
            RecoveryStrategy::ReduceThreadCount {
                suggested_threads, ..
            } => Ok(RecoveryAction::ReduceThreadCount {
                new_thread_count: *suggested_threads,
            }),
            RecoveryStrategy::WaitForEnvironmentChange {
                check_interval_ms, ..
            } => Ok(RecoveryAction::RetryAfterDelay {
                delay_ms: *check_interval_ms,
            }),
            RecoveryStrategy::NoRecoveryAvailable { reason, .. } => {
                Err(format!("No recovery available: {}", reason))
            }
        }
    }
}

/// Actions that can be taken to recover from errors
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub enum RecoveryAction {
    /// Retry the operation after a delay
    RetryAfterDelay { delay_ms: u64 },
    /// Fall back to single-threaded execution
    FallbackToSingleThreaded { reason: String },
    /// Reduce thread count and retry
    ReduceThreadCount { new_thread_count: usize },
    /// No action needed, continue normally
    Continue,
}

/// Create error context with current environment information
#[allow(dead_code)]
pub fn create_error_context(error: ThreadingError) -> ErrorContext {
    let environment_info = gather_environment_info();
    let recovery_suggestions = generate_recovery_suggestions(&error, &environment_info);

    ErrorContext {
        error,
        timestamp: js_sys::Date::new_0().to_iso_string().as_string().unwrap(),
        environment_info,
        attempted_solutions: Vec::new(),
        recovery_suggestions,
    }
}

/// Gather current environment information
#[allow(dead_code)]
pub fn gather_environment_info() -> EnvironmentInfo {
    let environment_type = if let Some(_window) = web_sys::window() {
        "browser".to_string()
    } else {
        "unknown".to_string()
    };

    let user_agent = web_sys::window().and_then(|w| w.navigator().user_agent().ok());

    let hardware_concurrency =
        web_sys::window().and_then(|w| Some(w.navigator().hardware_concurrency() as u32));

    // Check capabilities using existing capability detection
    let shared_array_buffer_available = check_shared_array_buffer_simple();
    let cross_origin_isolated = check_cross_origin_isolated_simple();
    let web_workers_available = check_web_workers_simple();
    let atomics_available = check_atomics_simple();

    EnvironmentInfo {
        environment_type,
        user_agent,
        hardware_concurrency,
        shared_array_buffer_available,
        cross_origin_isolated,
        web_workers_available,
        atomics_available,
    }
}

/// Generate recovery suggestions based on error and environment
#[allow(dead_code)]
pub fn generate_recovery_suggestions(error: &ThreadingError, env: &EnvironmentInfo) -> Vec<String> {
    let mut suggestions = Vec::new();

    match error {
        ThreadingError::ThreadPoolInitError { .. } => {
            suggestions.push("Try reducing the number of threads".to_string());
            suggestions.push("Check browser console for detailed error messages".to_string());
            suggestions
                .push("Verify SharedArrayBuffer and Cross-Origin Isolation support".to_string());
        }
        ThreadingError::SharedArrayBufferError { .. } => {
            if env.environment_type == "browser" {
                suggestions.push("Add Cross-Origin-Opener-Policy: same-origin header".to_string());
                suggestions
                    .push("Add Cross-Origin-Embedder-Policy: require-corp header".to_string());
                suggestions.push("Serve your application over HTTPS".to_string());
                suggestions.push("Check if your browser supports SharedArrayBuffer".to_string());
            } else {
                suggestions.push("Run Node.js with --experimental-wasm-threads flag".to_string());
            }
        }
        ThreadingError::CrossOriginIsolationError { .. } => {
            suggestions.push("Configure COOP and COEP headers on your server".to_string());
            suggestions.push("Ensure all cross-origin resources have CORP headers".to_string());
            suggestions.push("Test in a supported browser environment".to_string());
        }
        ThreadingError::BrowserCompatibilityError { .. } => {
            suggestions.push("Update to a newer browser version".to_string());
            suggestions.push("Use a browser that supports WebAssembly threading".to_string());
            suggestions.push("Consider providing a single-threaded fallback".to_string());
        }
        _ => {
            suggestions.push("Check browser developer console for more details".to_string());
            suggestions.push("Try refreshing the page".to_string());
        }
    }

    suggestions
}

// Simple capability checks for error context
#[allow(dead_code)]
fn check_shared_array_buffer_simple() -> bool {
    use js_sys::Reflect;
    let global = js_sys::global();
    if let Ok(sab) = Reflect::get(&global, &JsValue::from_str("SharedArrayBuffer")) {
        !sab.is_undefined()
    } else {
        false
    }
}

#[allow(dead_code)]
fn check_cross_origin_isolated_simple() -> bool {
    let global = js_sys::global();
    if let Ok(coi) = js_sys::Reflect::get(&global, &JsValue::from_str("crossOriginIsolated")) {
        coi.as_bool().unwrap_or(false)
    } else {
        false
    }
}

#[allow(dead_code)]
fn check_web_workers_simple() -> bool {
    let global = js_sys::global();
    if let Ok(worker) = js_sys::Reflect::get(&global, &JsValue::from_str("Worker")) {
        !worker.is_undefined()
    } else {
        false
    }
}

#[allow(dead_code)]
fn check_atomics_simple() -> bool {
    let global = js_sys::global();
    if let Ok(atomics) = js_sys::Reflect::get(&global, &JsValue::from_str("Atomics")) {
        !atomics.is_undefined()
    } else {
        false
    }
}

/// Create specific error types with context
#[allow(dead_code)]
pub fn create_thread_pool_init_error(
    reason: String,
    retry_count: u32,
    max_retries: u32,
    last_error: String,
) -> WasmThreadingError {
    let error = ThreadingError::ThreadPoolInitError {
        reason,
        retry_count,
        max_retries,
        last_error,
    };
    let context = create_error_context(error.clone());
    WasmThreadingError {
        inner: error,
        context,
    }
}

#[allow(dead_code)]
pub fn create_shared_array_buffer_error(
    available: bool,
    can_instantiate: bool,
    browser_info: String,
) -> WasmThreadingError {
    let suggestions = vec![
        "Add COOP and COEP headers to enable SharedArrayBuffer".to_string(),
        "Serve your application over HTTPS".to_string(),
        "Check browser compatibility".to_string(),
    ];

    let error = ThreadingError::SharedArrayBufferError {
        available,
        can_instantiate,
        browser_info,
        suggestions,
    };
    let context = create_error_context(error.clone());
    WasmThreadingError {
        inner: error,
        context,
    }
}

#[allow(dead_code)]
pub fn create_cross_origin_isolation_error(
    current_state: bool,
    missing_headers: Vec<String>,
) -> WasmThreadingError {
    let recommendations = vec![
        "Configure Cross-Origin-Opener-Policy: same-origin".to_string(),
        "Configure Cross-Origin-Embedder-Policy: require-corp".to_string(),
        "Ensure all resources have proper CORP headers".to_string(),
    ];

    let error = ThreadingError::CrossOriginIsolationError {
        current_state,
        missing_headers,
        recommendations,
    };
    let context = create_error_context(error.clone());
    WasmThreadingError {
        inner: error,
        context,
    }
}

#[allow(dead_code)]
pub fn create_browser_compatibility_error(
    user_agent: String,
    missing_features: Vec<String>,
) -> WasmThreadingError {
    let supported_alternatives = vec![
        "Chrome 79+ with proper headers".to_string(),
        "Firefox 72+ with proper headers".to_string(),
        "Safari 15+ with proper headers".to_string(),
    ];

    let error = ThreadingError::BrowserCompatibilityError {
        user_agent,
        missing_features,
        supported_alternatives,
    };
    let context = create_error_context(error.clone());
    WasmThreadingError {
        inner: error,
        context,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_threading_error_display() {
        let error = ThreadingError::ThreadPoolInitError {
            reason: "SharedArrayBuffer not available".to_string(),
            retry_count: 1,
            max_retries: 3,
            last_error: "Constructor failed".to_string(),
        };

        let display = format!("{}", error);
        assert!(display.contains("Thread pool initialization failed"));
        assert!(display.contains("retry 1/3"));
    }

    #[test]
    fn test_error_recovery_manager() {
        let manager = ErrorRecoveryManager::new(3, 1000);

        let _error = ThreadingError::SharedArrayBufferError {
            available: false,
            can_instantiate: false,
            browser_info: "Chrome 80".to_string(),
            suggestions: vec![],
        };

        // This is a placeholder test since we can't use async in wasm-bindgen tests easily
        // The actual async recovery would be tested in integration tests
        assert_eq!(manager.max_retries, 3);
        assert_eq!(manager.base_delay_ms, 1000);
    }

    #[test]
    fn test_environment_info_gathering() {
        let env_info = gather_environment_info();

        // Environment type should be detected
        assert!(!env_info.environment_type.is_empty());

        // Capabilities should be checked
        // These will vary based on test environment
        let _sab = env_info.shared_array_buffer_available;
        let _coi = env_info.cross_origin_isolated;
        let _workers = env_info.web_workers_available;
        let _atomics = env_info.atomics_available;
    }

    #[test]
    fn test_recovery_suggestions() {
        let env = EnvironmentInfo {
            environment_type: "browser".to_string(),
            user_agent: Some("Chrome/80".to_string()),
            hardware_concurrency: Some(4),
            shared_array_buffer_available: false,
            cross_origin_isolated: false,
            web_workers_available: true,
            atomics_available: true,
        };

        let error = ThreadingError::SharedArrayBufferError {
            available: false,
            can_instantiate: false,
            browser_info: "Chrome 80".to_string(),
            suggestions: vec![],
        };

        let suggestions = generate_recovery_suggestions(&error, &env);
        assert!(!suggestions.is_empty());
        assert!(suggestions.iter().any(|s| s.contains("Cross-Origin")));
    }
}
