use std::env;

fn main() {
    // Detect if we're building with multi-threading support
    let is_parallel = env::var("CARGO_FEATURE_WASM_PARALLEL").is_ok();
    let target = env::var("TARGET").unwrap_or_default();
    let is_wasm = target.contains("wasm32");

    if is_wasm {
        if is_parallel {
            // Multi-threaded WASM build configuration
            println!("cargo:rustc-cfg=wasm_parallel");

            // Set atomics and shared memory target features for wasm-bindgen-rayon
            println!("cargo:rustc-env=RUSTFLAGS=-C target-feature=+atomics,+bulk-memory,+mutable-globals");

            // Shared memory configuration for wasm-bindgen-rayon
            println!("cargo:rustc-link-arg=--shared-memory");
            println!("cargo:rustc-link-arg=--import-memory");
            println!("cargo:rustc-link-arg=--export-memory");
            println!("cargo:rustc-link-arg=--max-memory=2147483648"); // 2GB max memory

            println!("cargo:warning=Building with multi-threaded WASM support - requires atomics and shared memory");
            println!("cargo:warning=Make sure to build with: RUSTFLAGS='-C target-feature=+atomics,+bulk-memory,+mutable-globals'");
        } else {
            // Single-threaded WASM build configuration
            println!("cargo:rustc-cfg=wasm_single_threaded");
            println!("cargo:warning=Building with single-threaded WASM support");
        }

        // Common WASM optimizations
        println!("cargo:rustc-link-arg=--no-entry");
        println!("cargo:rustc-link-arg=--export-dynamic");
    }

    // Set build-time environment variables for runtime detection
    println!(
        "cargo:rustc-env=WASM_PARALLEL={}",
        if is_parallel { "1" } else { "0" }
    );
    println!("cargo:rustc-env=BUILD_TARGET={target}");

    // Rerun build script if these environment variables change
    println!("cargo:rerun-if-env-changed=CARGO_FEATURE_WASM_PARALLEL");
    println!("cargo:rerun-if-env-changed=TARGET");
    println!("cargo:rerun-if-env-changed=RUSTFLAGS");
}
