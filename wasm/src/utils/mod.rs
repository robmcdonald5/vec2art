pub mod convolution;
pub mod geometry;
pub mod color;

use web_sys::console;

/// Macro for logging to browser console
#[macro_export]
macro_rules! console_log {
    ($($t:tt)*) => {
        web_sys::console::log_1(&format!($($t)*).into());
    }
}

/// Measure performance of an operation
pub fn measure_operation<T, F: FnOnce() -> T>(name: &str, operation: F) -> T {
    let window = web_sys::window().unwrap();
    let performance = window.performance().unwrap();
    
    let start = performance.now();
    let result = operation();
    let end = performance.now();
    
    console::log_1(&format!("{} took {:.2} ms", name, end - start).into());
    result
}

/// Yield control back to the browser event loop (for async operations)
pub async fn yield_to_browser() {
    use wasm_bindgen_futures::js_sys::Promise;
    use wasm_bindgen::JsValue;
    
    let promise = Promise::resolve(&JsValue::NULL);
    wasm_bindgen_futures::JsFuture::from(promise).await.unwrap();
}