//! WebAssembly threading support using wasm-bindgen-rayon
//!
//! This module provides thread pool initialization and management for WebAssembly
//! environments that support SharedArrayBuffer and atomics. It gracefully falls
//! back to single-threaded execution when threading is not available.

use wasm_bindgen::prelude::*;

/// Thread pool initialization state
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ThreadPoolState {
    /// Threading is not supported (no SharedArrayBuffer or atomics)
    NotSupported,
    /// Threading is supported but not initialized
    Supported,
    /// Thread pool is initialized and ready
    #[allow(dead_code)]
    Initialized,
    /// Thread pool initialization failed
    #[allow(dead_code)]
    Failed,
}

/// Global thread pool state tracking
static mut THREAD_POOL_STATE: ThreadPoolState = ThreadPoolState::Supported;

/// Initialize the WASM thread pool with the specified number of threads
///
/// This returns a JavaScript Promise that must be awaited before using parallel functions.
///
/// # Arguments
/// * `num_threads` - Number of threads to use. If None, uses browser's hardware concurrency
///
/// # Returns
/// * `JsValue` containing a Promise that resolves when initialization is complete
///
/// # Safety
/// This function modifies global state and should only be called once during module initialization
#[cfg(all(target_arch = "wasm32", feature = "wasm-parallel"))]
#[wasm_bindgen]
pub fn init_thread_pool(num_threads: Option<usize>) -> JsValue {
    // Check if SharedArrayBuffer is available
    if !is_shared_array_buffer_supported() {
        unsafe {
            THREAD_POOL_STATE = ThreadPoolState::NotSupported;
        }
        log::info!("SharedArrayBuffer not supported, using single-threaded execution");
        // Return resolved promise for compatibility
        return js_sys::Promise::resolve(&JsValue::from_str("single-threaded")).into();
    }

    let thread_count = num_threads.unwrap_or_else(get_available_parallelism);

    log::info!(
        "Initializing WASM thread pool with {} threads",
        thread_count
    );

    // Initialize wasm-bindgen-rayon thread pool and return the promise
    let promise = wasm_bindgen_rayon::init_thread_pool(thread_count);

    // Mark as initialized (will be confirmed when promise resolves)
    unsafe {
        THREAD_POOL_STATE = ThreadPoolState::Initialized;
    }

    log::info!(
        "WASM thread pool initialization started with {} threads",
        thread_count
    );

    promise.into()
}

/// Initialize the WASM thread pool (no-op when threading is not enabled)
#[cfg(not(all(target_arch = "wasm32", feature = "wasm-parallel")))]
#[wasm_bindgen]
pub fn init_thread_pool(_num_threads: Option<usize>) -> JsValue {
    unsafe {
        THREAD_POOL_STATE = ThreadPoolState::NotSupported;
    }
    log::info!("WASM parallel feature not enabled, using single-threaded execution");
    // Return resolved promise for compatibility
    #[cfg(target_arch = "wasm32")]
    return js_sys::Promise::resolve(&JsValue::from_str("single-threaded")).into();

    #[cfg(not(target_arch = "wasm32"))]
    return JsValue::from_str("single-threaded");
}

/// Get the current thread pool status
pub fn get_thread_pool_status() -> ThreadPoolState {
    unsafe { THREAD_POOL_STATE }
}

/// Check if threading is currently active and functional
pub fn is_threading_active() -> bool {
    matches!(get_thread_pool_status(), ThreadPoolState::Initialized)
}

/// Get the number of threads available for parallel processing
///
/// # Returns
/// * Number of threads available, or 1 if threading is not supported/active
pub fn get_thread_count() -> usize {
    if is_threading_active() {
        get_available_parallelism()
    } else {
        1
    }
}

/// Detect the number of logical processors available from the browser
///
/// # Returns
/// * Number of logical processors, with a reasonable fallback of 4
pub fn get_available_parallelism() -> usize {
    // Try to get hardware concurrency from the browser
    #[cfg(target_arch = "wasm32")]
    {
        if let Some(window) = web_sys::window() {
            let concurrency = window.navigator().hardware_concurrency() as usize;
            if concurrency > 0 {
                // Clamp to reasonable bounds (1-16 threads for WASM)
                return std::cmp::max(1, std::cmp::min(16, concurrency));
            }
        }
    }

    // Fallback to reasonable default for WASM environments
    4
}

/// Check if SharedArrayBuffer is supported in the current environment
///
/// This is required for multi-threading in WebAssembly
#[cfg(all(target_arch = "wasm32", feature = "wasm-parallel"))]
fn is_shared_array_buffer_supported() -> bool {
    use js_sys::*;

    // Check if SharedArrayBuffer constructor is available
    let global = js_sys::global();
    let shared_array_buffer = Reflect::get(&global, &JsValue::from_str("SharedArrayBuffer"));

    match shared_array_buffer {
        Ok(val) => !val.is_undefined(),
        Err(_) => false,
    }
}

/// Check if SharedArrayBuffer is supported (always false when threading is not enabled)
#[cfg(not(all(target_arch = "wasm32", feature = "wasm-parallel")))]
fn is_shared_array_buffer_supported() -> bool {
    false
}

/// Force single-threaded mode (for debugging or fallback)
///
/// This function can be called to disable threading even if it's supported
pub fn force_single_threaded() {
    unsafe {
        THREAD_POOL_STATE = ThreadPoolState::NotSupported;
    }
    log::info!("Forced single-threaded execution mode");
}

/// Get diagnostic information about the threading environment
pub fn get_threading_info() -> String {
    let status = get_thread_pool_status();
    let thread_count = get_thread_count();
    let shared_array_buffer = is_shared_array_buffer_supported();
    let hardware_concurrency = get_available_parallelism();

    format!(
        "WASM Threading Info:\n\
         - Status: {:?}\n\
         - Active Threads: {}\n\
         - SharedArrayBuffer: {}\n\
         - Hardware Concurrency: {}\n\
         - Feature 'wasm-parallel': {}",
        status,
        thread_count,
        shared_array_buffer,
        hardware_concurrency,
        cfg!(feature = "wasm-parallel")
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use wasm_bindgen_test::*;

    #[wasm_bindgen_test]
    fn test_get_available_parallelism() {
        let parallelism = get_available_parallelism();
        assert!(parallelism >= 1);
        assert!(parallelism <= 16); // Should be clamped to reasonable bounds
    }

    #[wasm_bindgen_test]
    fn test_thread_pool_state_default() {
        // Default state should be Supported (until initialization is attempted)
        let state = get_thread_pool_status();
        assert!(matches!(
            state,
            ThreadPoolState::Supported | ThreadPoolState::NotSupported
        ));
    }

    #[wasm_bindgen_test]
    fn test_force_single_threaded() {
        force_single_threaded();
        assert_eq!(get_thread_pool_status(), ThreadPoolState::NotSupported);
        assert!(!is_threading_active());
        assert_eq!(get_thread_count(), 1);
    }

    #[wasm_bindgen_test]
    fn test_threading_info() {
        let info = get_threading_info();
        assert!(info.contains("WASM Threading Info:"));
        assert!(info.contains("Status:"));
        assert!(info.contains("Active Threads:"));
    }

    #[cfg(all(target_arch = "wasm32", feature = "wasm-parallel"))]
    #[wasm_bindgen_test]
    fn test_init_thread_pool() {
        // Test initialization with default thread count
        let result = init_thread_pool(None);

        // Should succeed regardless of SharedArrayBuffer support
        assert!(result.is_ok());

        // State should be either Initialized or NotSupported
        let state = get_thread_pool_status();
        assert!(matches!(
            state,
            ThreadPoolState::Initialized | ThreadPoolState::NotSupported
        ));
    }

    #[cfg(all(target_arch = "wasm32", feature = "wasm-parallel"))]
    #[wasm_bindgen_test]
    fn test_init_thread_pool_with_specific_count() {
        // Test initialization with specific thread count
        let result = init_thread_pool(Some(2));

        // Should succeed regardless of SharedArrayBuffer support
        assert!(result.is_ok());
    }
}
