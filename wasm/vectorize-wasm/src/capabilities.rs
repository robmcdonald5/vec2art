//! Browser capability detection for WebAssembly multi-threading
//!
//! This module provides comprehensive detection of browser capabilities required for
//! WebAssembly multi-threading support, including SharedArrayBuffer, Cross-Origin
//! Isolation, and proper COOP/COEP headers.

// Removed unused imports to eliminate eval warnings
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

/// Detailed capability report for WebAssembly threading requirements
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CapabilityReport {
    /// Whether all requirements for threading are met
    pub threading_supported: bool,
    /// Whether SharedArrayBuffer is available
    pub shared_array_buffer: bool,
    /// Whether Cross-Origin Isolation is enabled
    pub cross_origin_isolated: bool,
    /// Whether Web Workers are supported
    pub web_workers: bool,
    /// Whether proper COOP/COEP headers are detected
    pub proper_headers: bool,
    /// Browser/environment type detection
    pub environment_type: String,
    /// List of missing requirements (empty if all supported)
    pub missing_requirements: Vec<String>,
    /// Detailed diagnostic messages
    pub diagnostics: Vec<String>,
    /// Whether we're running in a Node.js environment
    pub is_node_js: bool,
    /// Whether atomics are supported
    pub atomics_supported: bool,
}

/// WASM-bindgen wrapper for CapabilityReport with proper getter methods
#[wasm_bindgen]
pub struct WasmCapabilityReport {
    inner: CapabilityReport,
}

#[wasm_bindgen]
impl WasmCapabilityReport {
    #[wasm_bindgen(getter)]
    pub fn threading_supported(&self) -> bool {
        self.inner.threading_supported
    }

    #[wasm_bindgen(getter)]
    pub fn shared_array_buffer(&self) -> bool {
        self.inner.shared_array_buffer
    }

    #[wasm_bindgen(getter)]
    pub fn cross_origin_isolated(&self) -> bool {
        self.inner.cross_origin_isolated
    }

    #[wasm_bindgen(getter)]
    pub fn web_workers(&self) -> bool {
        self.inner.web_workers
    }

    #[wasm_bindgen(getter)]
    pub fn proper_headers(&self) -> bool {
        self.inner.proper_headers
    }

    #[wasm_bindgen(getter)]
    pub fn environment_type(&self) -> String {
        self.inner.environment_type.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn missing_requirements(&self) -> Vec<JsValue> {
        self.inner
            .missing_requirements
            .iter()
            .map(|s| JsValue::from_str(s))
            .collect()
    }

    #[wasm_bindgen(getter)]
    pub fn diagnostics(&self) -> Vec<JsValue> {
        self.inner
            .diagnostics
            .iter()
            .map(|s| JsValue::from_str(s))
            .collect()
    }

    #[wasm_bindgen(getter)]
    pub fn is_node_js(&self) -> bool {
        self.inner.is_node_js
    }

    #[wasm_bindgen(getter)]
    pub fn atomics_supported(&self) -> bool {
        self.inner.atomics_supported
    }
}

/// Cached capability detection results to avoid repeated expensive checks
static mut CACHED_CAPABILITY_REPORT: Option<CapabilityReport> = None;
static mut CACHE_INITIALIZED: bool = false;

/// JavaScript helper functions using wasm-bindgen extern imports
#[wasm_bindgen]
extern "C" {
    /// Check if SharedArrayBuffer constructor exists
    #[wasm_bindgen(js_namespace = ["globalThis"], js_name = "SharedArrayBuffer", catch)]
    fn get_shared_array_buffer_constructor() -> Result<JsValue, JsValue>;

    /// Check if Worker constructor exists
    #[wasm_bindgen(js_namespace = ["globalThis"], js_name = "Worker", catch)]
    fn get_worker_constructor() -> Result<JsValue, JsValue>;

    /// Check if Atomics exists
    #[wasm_bindgen(js_namespace = ["globalThis"], js_name = "Atomics", catch)]
    fn get_atomics() -> Result<JsValue, JsValue>;

    /// Check if crossOriginIsolated exists and is true
    #[wasm_bindgen(js_namespace = ["globalThis"], js_name = "crossOriginIsolated", catch)]
    fn get_cross_origin_isolated() -> Result<JsValue, JsValue>;

    /// Check if process exists (Node.js detection)
    #[wasm_bindgen(js_namespace = ["globalThis"], js_name = "process", catch)]
    fn get_process() -> Result<JsValue, JsValue>;

    /// Check if window exists (browser detection)
    #[wasm_bindgen(js_namespace = ["globalThis"], js_name = "window", catch)]
    fn get_window() -> Result<JsValue, JsValue>;

    /// Check if Deno exists
    #[wasm_bindgen(js_namespace = ["globalThis"], js_name = "Deno", catch)]
    fn get_deno() -> Result<JsValue, JsValue>;
}

/// Check comprehensive browser capabilities for WebAssembly threading
///
/// This function performs a detailed analysis of the browser environment to determine
/// if WebAssembly multi-threading is supported and provides diagnostic information
/// about any missing requirements.
#[wasm_bindgen]
pub fn check_threading_requirements() -> WasmCapabilityReport {
    // Check if we have cached results
    unsafe {
        if CACHE_INITIALIZED {
            if let Some(ref cached_report) = CACHED_CAPABILITY_REPORT {
                return WasmCapabilityReport {
                    inner: cached_report.clone(),
                };
            }
        }
    }

    let mut diagnostics = Vec::new();
    let mut missing_requirements = Vec::new();

    // Detect environment type
    let environment_type = detect_environment_type();
    let is_node_js = is_nodejs_env();

    diagnostics.push(format!("Environment detected: {}", environment_type));
    if is_node_js {
        diagnostics.push("Node.js environment detected".to_string());
    }

    // Check SharedArrayBuffer availability
    let shared_array_buffer =
        check_shared_array_buffer() && test_shared_array_buffer_instantiation();
    if shared_array_buffer {
        diagnostics.push("SharedArrayBuffer is available and functional".to_string());
    } else {
        missing_requirements.push("SharedArrayBuffer".to_string());
        diagnostics
            .push("SharedArrayBuffer is not available or cannot be instantiated".to_string());

        if is_node_js {
            diagnostics.push(
                "For Node.js, ensure you're running with --experimental-wasm-threads".to_string(),
            );
        } else {
            diagnostics.push(
                "SharedArrayBuffer requires Cross-Origin Isolation (COOP/COEP headers)".to_string(),
            );
        }
    }

    // Check Cross-Origin Isolation
    let cross_origin_isolated = check_cross_origin_isolated();
    if cross_origin_isolated {
        diagnostics.push("Cross-Origin Isolation is enabled".to_string());
    } else {
        if !is_node_js {
            missing_requirements.push("Cross-Origin Isolation".to_string());
            diagnostics.push("Cross-Origin Isolation is not enabled".to_string());
            diagnostics.push("Add COOP: Cross-Origin-Opener-Policy: same-origin".to_string());
            diagnostics.push("Add COEP: Cross-Origin-Embedder-Policy: require-corp".to_string());
        }
    }

    // Check Web Workers support
    let web_workers = check_web_workers();
    if web_workers {
        diagnostics.push("Web Workers are supported".to_string());
    } else {
        if !is_node_js {
            missing_requirements.push("Web Workers".to_string());
            diagnostics.push("Web Workers are not supported".to_string());
        }
    }

    // Check Atomics support
    let atomics_supported = check_atomics();
    if atomics_supported {
        diagnostics.push("Atomics API is available".to_string());
    } else {
        missing_requirements.push("Atomics".to_string());
        diagnostics.push("Atomics API is not available".to_string());
    }

    // Check COOP/COEP headers indirectly
    let proper_headers = check_coop_coep_headers();
    if proper_headers {
        diagnostics.push("COOP/COEP headers appear to be correctly configured".to_string());
    } else {
        if !is_node_js {
            missing_requirements.push("COOP/COEP Headers".to_string());
            diagnostics.push("COOP/COEP headers may not be correctly configured".to_string());
        }
    }

    // Additional browser-specific checks
    if check_chrome_memory_api() {
        diagnostics.push(
            "Chrome-specific memory API detected (performance.measureUserAgentSpecificMemory)"
                .to_string(),
        );
    }

    // Determine overall threading support
    let threading_supported = if is_node_js {
        // For Node.js, we need SharedArrayBuffer and Atomics
        shared_array_buffer && atomics_supported
    } else {
        // For browsers, we need all the requirements
        shared_array_buffer
            && cross_origin_isolated
            && web_workers
            && atomics_supported
            && proper_headers
    };

    if threading_supported {
        diagnostics.push("✓ All requirements met - WebAssembly threading is supported".to_string());
    } else {
        diagnostics
            .push("✗ WebAssembly threading is not supported in this environment".to_string());
        diagnostics.push(format!(
            "Missing requirements: {}",
            missing_requirements.join(", ")
        ));
    }

    let report = CapabilityReport {
        threading_supported,
        shared_array_buffer,
        cross_origin_isolated,
        web_workers,
        proper_headers,
        environment_type,
        missing_requirements,
        diagnostics,
        is_node_js,
        atomics_supported,
    };

    // Cache the results
    unsafe {
        CACHED_CAPABILITY_REPORT = Some(report.clone());
        CACHE_INITIALIZED = true;
    }

    WasmCapabilityReport { inner: report }
}

/// Get a list of missing requirements for WebAssembly threading
///
/// Returns an empty array if all requirements are met.
#[wasm_bindgen]
pub fn get_missing_requirements() -> Vec<JsValue> {
    let report = check_threading_requirements();
    report.missing_requirements()
}

/// Check if Cross-Origin Isolation is enabled
///
/// This is a quick check for the most common reason threading doesn't work.
#[wasm_bindgen]
pub fn is_cross_origin_isolated() -> bool {
    check_cross_origin_isolated()
}

/// Check if SharedArrayBuffer is supported and functional
#[wasm_bindgen]
pub fn is_shared_array_buffer_supported() -> bool {
    check_shared_array_buffer() && test_shared_array_buffer_instantiation()
}

/// Check if we're running in a Node.js environment
#[wasm_bindgen]
pub fn is_nodejs_environment() -> bool {
    is_nodejs_env()
}

/// Get the detected environment type as a string
#[wasm_bindgen]
pub fn get_environment_type() -> String {
    detect_environment_type()
}

// Helper functions for capability detection

fn check_shared_array_buffer() -> bool {
    get_shared_array_buffer_constructor().is_ok()
}

fn test_shared_array_buffer_instantiation() -> bool {
    // Test by trying to directly create a SharedArrayBuffer
    // Use a try/catch approach via wasm_bindgen
    std::panic::catch_unwind(|| {
        js_sys::SharedArrayBuffer::new(1);
    })
    .is_ok()
}

fn check_cross_origin_isolated() -> bool {
    if let Ok(isolated) = get_cross_origin_isolated() {
        isolated.as_bool().unwrap_or(false)
    } else {
        false
    }
}

fn check_web_workers() -> bool {
    get_worker_constructor().is_ok()
}

fn check_atomics() -> bool {
    get_atomics().is_ok()
}

fn is_nodejs_env() -> bool {
    // Simple check - if we have a process object, assume Node.js
    // This avoids reflection while maintaining functionality
    get_process().is_ok()
}

fn detect_environment_type() -> String {
    if get_window().is_ok() {
        "browser".to_string()
    } else if is_nodejs_env() {
        "nodejs".to_string()
    } else if get_deno().is_ok() {
        "deno".to_string()
    } else {
        // Simplified check - just return unknown for non-standard environments
        // This avoids reflection while maintaining the diagnostic flow
        "unknown".to_string()
    }
}

fn check_coop_coep_headers() -> bool {
    // This is a best-effort check since we can't directly access headers
    // If cross-origin isolation is enabled, headers are likely correct
    check_cross_origin_isolated()
}

fn check_chrome_memory_api() -> bool {
    // Simplified check - assume Chrome memory API is not critical for our diagnostics
    // This avoids reflection while maintaining the diagnostic flow
    false
}

/// Force refresh of capability cache
///
/// This can be useful if the environment changes during runtime
/// (e.g., headers are modified via service worker)
#[wasm_bindgen]
pub fn refresh_capability_cache() {
    unsafe {
        CACHED_CAPABILITY_REPORT = None;
        CACHE_INITIALIZED = false;
    }
}

/// Get a human-readable summary of threading requirements
#[wasm_bindgen]
pub fn get_threading_requirements_summary() -> String {
    let report = check_threading_requirements();

    if report.threading_supported() {
        "✓ WebAssembly threading is fully supported in this environment.".to_string()
    } else {
        let mut summary = String::new();
        summary.push_str("✗ WebAssembly threading is not supported. Missing requirements:\n\n");

        let missing = report.missing_requirements();
        for requirement in missing {
            if let Some(req_str) = requirement.as_string() {
                summary.push_str(&format!("• {}\n", req_str));
            }
        }

        summary.push_str("\n");

        if !report.is_node_js() {
            summary.push_str("To enable WebAssembly threading in browsers:\n");
            summary.push_str("1. Add HTTP headers to your server:\n");
            summary.push_str("   Cross-Origin-Opener-Policy: same-origin\n");
            summary.push_str("   Cross-Origin-Embedder-Policy: require-corp\n");
            summary.push_str("2. Serve your site over HTTPS\n");
            summary.push_str("3. Ensure all cross-origin resources have CORP headers\n");
        } else {
            summary.push_str("To enable WebAssembly threading in Node.js:\n");
            summary.push_str("1. Run with: node --experimental-wasm-threads your-script.js\n");
            summary.push_str("2. Ensure your WASM module was built with threading support\n");
        }

        summary
    }
}

/// Provide actionable recommendations for enabling threading
#[wasm_bindgen]
pub fn get_threading_recommendations() -> Vec<JsValue> {
    let report = check_threading_requirements();
    let mut recommendations = Vec::new();

    if report.threading_supported() {
        recommendations.push("Threading is already fully supported!".to_string());
        return recommendations
            .into_iter()
            .map(|s| JsValue::from_str(&s))
            .collect();
    }

    if !report.shared_array_buffer() {
        if report.is_node_js() {
            recommendations.push(
                "Enable SharedArrayBuffer in Node.js with --experimental-wasm-threads flag"
                    .to_string(),
            );
        } else {
            recommendations.push(
                "Enable SharedArrayBuffer by adding Cross-Origin Isolation headers".to_string(),
            );
        }
    }

    if !report.cross_origin_isolated() && !report.is_node_js() {
        recommendations.push("Add Cross-Origin-Opener-Policy: same-origin header".to_string());
        recommendations.push("Add Cross-Origin-Embedder-Policy: require-corp header".to_string());
        recommendations.push("Serve your application over HTTPS".to_string());
    }

    if !report.web_workers() && !report.is_node_js() {
        recommendations
            .push("Ensure Web Workers are not blocked by Content Security Policy".to_string());
    }

    if !report.atomics_supported() {
        recommendations
            .push("Update to a browser/Node.js version that supports Atomics".to_string());
    }

    if !report.proper_headers() && !report.is_node_js() {
        recommendations
            .push("Verify COOP/COEP headers are correctly configured on your server".to_string());
        recommendations
            .push("Check that crossOriginIsolated returns true in browser console".to_string());
    }

    recommendations
        .into_iter()
        .map(|s| JsValue::from_str(&s))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use wasm_bindgen_test::*;

    #[wasm_bindgen_test]
    fn test_capability_detection() {
        let report = check_threading_requirements();

        // Report should always be valid
        assert!(!report.environment_type().is_empty());

        // Should have some diagnostics
        assert!(!report.diagnostics().is_empty());

        // Missing requirements should be consistent with threading_supported
        if report.threading_supported() {
            assert!(report.missing_requirements().is_empty());
        } else {
            assert!(!report.missing_requirements().is_empty());
        }
    }

    #[wasm_bindgen_test]
    fn test_environment_detection() {
        let env_type = get_environment_type();
        assert!(!env_type.is_empty());

        // Should be one of the known environment types
        assert!(matches!(
            env_type.as_str(),
            "browser" | "webworker" | "nodejs" | "deno" | "unknown"
        ));
    }

    #[wasm_bindgen_test]
    fn test_caching() {
        // First call
        let report1 = check_threading_requirements();

        // Second call should return cached results
        let report2 = check_threading_requirements();

        // Results should be identical
        assert_eq!(report1.threading_supported(), report2.threading_supported());
        assert_eq!(report1.environment_type(), report2.environment_type());

        // Test cache refresh
        refresh_capability_cache();
        let report3 = check_threading_requirements();

        // Should still be consistent after refresh
        assert_eq!(report1.threading_supported(), report3.threading_supported());
    }

    #[wasm_bindgen_test]
    fn test_utility_functions() {
        // These should not panic
        let _missing = get_missing_requirements();
        let _isolated = is_cross_origin_isolated();
        let _sab = is_shared_array_buffer_supported();
        let _nodejs = is_nodejs_environment();
        let _summary = get_threading_requirements_summary();
        let _recommendations = get_threading_recommendations();

        // Summary should not be empty
        assert!(!get_threading_requirements_summary().is_empty());
    }

    #[wasm_bindgen_test]
    fn test_capability_report_getters() {
        let report = check_threading_requirements();

        // Test that getters work
        let _ = report.threading_supported();
        let _ = report.shared_array_buffer();
        let _ = report.cross_origin_isolated();
        let _ = report.web_workers();
        let _ = report.proper_headers();
        let _ = report.environment_type();
        let _ = report.missing_requirements();
        let _ = report.diagnostics();
        let _ = report.is_node_js();
        let _ = report.atomics_supported();
    }
}
