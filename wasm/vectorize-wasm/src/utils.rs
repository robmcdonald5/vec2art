//! Utility functions for WebAssembly integration

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
    
    #[wasm_bindgen(js_namespace = console)]
    fn time(s: &str);
    
    #[wasm_bindgen(js_namespace = console)]
    fn timeEnd(s: &str);
}

/// Set up better panic messages in debug mode
pub fn set_panic_hook() {
    // When the `console_error_panic_hook` feature is enabled, we can call the
    // `set_panic_hook` function at least once during initialization, and then
    // we will get better error messages if our code ever panics.
    //
    // For more details see
    // https://github.com/rustwasm/console_error_panic_hook#readme
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

/// Start a console timer with the given name
pub fn console_time(name: &str) {
    time(name);
}

/// End a console timer with the given name
pub fn console_time_end(name: &str) {
    timeEnd(name);
}

/// Log a message to the browser console
#[allow(dead_code)]
pub fn console_log(message: &str) {
    log(message);
}

/// A macro to provide `println!(..)`-style syntax for `console.log` logging.
#[allow(unused_macros)]
macro_rules! console_log_macro {
    ( $( $t:tt )* ) => {
        crate::utils::console_log(&format!( $( $t )* ));
    }
}

#[allow(unused_imports)]
pub(crate) use console_log_macro as console_log;