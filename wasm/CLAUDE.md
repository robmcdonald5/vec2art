# wasm/CLAUDE.md

This document provides Rust/WASM-specific implementation guidelines for the vec2art core processing module.

## Essential Crates

### Core WASM Integration
* `wasm-bindgen` (0.2) - JavaScript interop and bindings
* `web-sys` - Web APIs access from Rust
* `js-sys` - JavaScript primitives and objects
* `serde` (1.0) + `serde-wasm-bindgen` - Parameter serialization between JS and Rust
* `console_error_panic_hook` - Better panic messages in browser console
* `wee_alloc` - Tiny memory allocator optimized for WASM (optional)

### Image Processing & Algorithms
* `image` (0.25) - Image decoding and basic operations
* `imageproc` - Advanced image processing algorithms (edge detection, filtering)
* `palette` - Color manipulation, quantization, and color space conversions
* `nalgebra` or `cgmath` - Linear algebra for geometric calculations
* `kdtree` or `rstar` - Spatial indexing for efficient shape detection
* `rayon` + `wasm-bindgen-rayon` - Parallel processing support in WASM

### SVG Generation
* `svg` - Programmatic SVG document creation
* `lyon` - Path tessellation and geometric algorithms
* `kurbo` - 2D curves and paths (Bézier, arcs, etc.)
* `resvg` (optional) - SVG simplification and optimization

### Utilities
* `getrandom` - WASM-compatible random number generation
* `log` + `console_log` - Logging to browser console
* `thiserror` - Error handling with proper error types

---

## Build Configuration

### Cargo.toml Optimization Profiles

```toml
[profile.release]
opt-level = "z"          # Optimize for size (critical for web delivery)
lto = true              # Link-time optimization
codegen-units = 1       # Single codegen unit for better optimization
strip = true            # Strip symbols
panic = "abort"         # Smaller binary, no unwinding

[profile.dev]
opt-level = 1           # Some optimization even in dev for reasonable performance

[profile.wasm-dev]
inherits = "dev"
opt-level = 2           # Better performance during development
```

### Memory Configuration

```rust
// In lib.rs - Use smaller allocator for WASM
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// Configure memory growth
#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();
}
```

### Feature Flags

```toml
[features]
default = ["basic"]
basic = ["image/jpeg", "image/png"]
full = ["image/jpeg", "image/png", "image/webp", "image/gif"]
production = ["wee_alloc"]
debug = ["console_error_panic_hook"]
```

---

## Error Handling

### Custom Error Types

```rust
use thiserror::Error;
use wasm_bindgen::JsValue;

#[derive(Error, Debug)]
pub enum Vec2ArtError {
    #[error("Invalid image format: {0}")]
    InvalidFormat(String),
    
    #[error("Image too large: {width}x{height} exceeds maximum")]
    ImageTooLarge { width: u32, height: u32 },
    
    #[error("Processing failed: {0}")]
    ProcessingError(String),
    
    #[error("Invalid parameters: {0}")]
    InvalidParameters(String),
}

// Convert to JsValue for JavaScript
impl From<Vec2ArtError> for JsValue {
    fn from(error: Vec2ArtError) -> Self {
        JsValue::from_str(&error.to_string())
    }
}
```

### Panic Handling

```rust
// In lib.rs
#[wasm_bindgen(start)]
pub fn init_panic_hook() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}
```

---

## Memory Management

### Resource Limits

```rust
const MAX_IMAGE_WIDTH: u32 = 4096;
const MAX_IMAGE_HEIGHT: u32 = 4096;
const MAX_IMAGE_PIXELS: u32 = MAX_IMAGE_WIDTH * MAX_IMAGE_HEIGHT;

pub fn validate_image_size(width: u32, height: u32) -> Result<(), Vec2ArtError> {
    if width * height > MAX_IMAGE_PIXELS {
        return Err(Vec2ArtError::ImageTooLarge { width, height });
    }
    Ok(())
}
```

### Memory Cleanup Patterns

```rust
// Use RAII and explicit drops for large allocations
pub fn process_image(data: Vec<u8>) -> Result<String, Vec2ArtError> {
    let image = decode_image(data)?;
    let processed = convert_to_svg(image)?;
    
    // Explicitly drop large intermediate data
    drop(image);
    
    Ok(processed)
}

// For JavaScript-managed resources
#[wasm_bindgen]
pub struct ImageProcessor {
    data: Option<Vec<u8>>,
}

#[wasm_bindgen]
impl ImageProcessor {
    pub fn clear(&mut self) {
        self.data = None; // Allow JS GC to reclaim
    }
}
```

---

## Performance Optimization

### SIMD Support (Future)

```rust
// When SIMD becomes stable in WASM
#[cfg(target_feature = "simd128")]
use std::arch::wasm32::*;

// Design code to be SIMD-ready
fn process_pixels(pixels: &[u8]) {
    pixels.chunks_exact(4).for_each(|chunk| {
        // RGBA processing
    });
}
```

### Parallel Processing

```rust
// Setup for wasm-bindgen-rayon
pub use wasm_bindgen_rayon::init_thread_pool;

#[wasm_bindgen]
pub fn init_workers(num_threads: usize) -> Result<(), JsValue> {
    init_thread_pool(num_threads);
    Ok(())
}

// Use rayon for parallel operations
use rayon::prelude::*;

fn parallel_process(data: &[u8]) -> Vec<u8> {
    data.par_chunks(1024)
        .flat_map(|chunk| process_chunk(chunk))
        .collect()
}
```

### Chunked Processing

```rust
// Process large images in chunks to avoid blocking
#[wasm_bindgen]
pub async fn process_large_image(
    data: Vec<u8>,
    chunk_size: usize,
) -> Result<String, JsValue> {
    let chunks = data.chunks(chunk_size);
    let mut results = Vec::new();
    
    for chunk in chunks {
        let result = process_chunk(chunk)?;
        results.push(result);
        
        // Yield to browser
        yield_to_browser().await;
    }
    
    Ok(combine_results(results))
}

async fn yield_to_browser() {
    use wasm_bindgen_futures::js_sys::Promise;
    let promise = Promise::resolve(&JsValue::NULL);
    wasm_bindgen_futures::JsFuture::from(promise).await.unwrap();
}
```

### Progress Reporting

```rust
// Callback pattern for long operations
#[wasm_bindgen]
pub fn convert_with_progress(
    image_bytes: &[u8],
    params: ConversionParameters,
    on_progress: &js_sys::Function,
) -> Result<String, JsValue> {
    let total_steps = 100;
    
    for step in 0..total_steps {
        // Report progress to JavaScript
        let progress = JsValue::from(step as f64 / total_steps as f64);
        on_progress.call1(&JsValue::NULL, &progress)?;
        
        // Do work...
    }
    
    Ok(svg_string)
}
```

---

## Testing

### WASM Testing Infrastructure

```toml
# In Cargo.toml
[dev-dependencies]
wasm-bindgen-test = "0.3"
criterion = { version = "0.5", features = ["html_reports"] }
```

### Test Structure

```rust
// tests/web.rs
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
fn test_image_conversion() {
    // Test implementation
}
```

### Benchmarking

```rust
// benches/conversion.rs
use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn benchmark_path_tracer(c: &mut Criterion) {
    let image_data = include_bytes!("../tests/fixtures/test.jpg");
    
    c.bench_function("path_tracer_1080p", |b| {
        b.iter(|| {
            convert(black_box(image_data), Default::default())
        });
    });
}

criterion_group!(benches, benchmark_path_tracer);
criterion_main!(benches);
```

---

## Debugging

### Console Logging

```rust
use web_sys::console;

macro_rules! console_log {
    ($($t:tt)*) => {
        console::log_1(&format!($($t)*).into());
    }
}

// Usage
console_log!("Processing image: {}x{}", width, height);
```

### Performance Profiling

```rust
use web_sys::Performance;

fn measure_operation<T, F: FnOnce() -> T>(name: &str, operation: F) -> T {
    let window = web_sys::window().unwrap();
    let performance = window.performance().unwrap();
    
    let start = performance.now();
    let result = operation();
    let end = performance.now();
    
    console_log!("{} took {} ms", name, end - start);
    result
}
```

---

## Algorithm Module Structure

Each algorithm in `src/algorithms/` should follow this pattern:

```rust
// src/algorithms/path_tracer.rs
use crate::error::Vec2ArtError;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PathTracerParams {
    pub num_colors: u8,
    pub curve_smoothing: f32,
    pub suppress_speckles: f32,
}

pub trait ConversionAlgorithm {
    type Params;
    
    fn convert(
        image: &DynamicImage,
        params: Self::Params,
    ) -> Result<String, Vec2ArtError>;
    
    fn default_params() -> Self::Params;
}

pub struct PathTracer;

impl ConversionAlgorithm for PathTracer {
    type Params = PathTracerParams;
    
    fn convert(
        image: &DynamicImage,
        params: Self::Params,
    ) -> Result<String, Vec2ArtError> {
        // Implementation
    }
    
    fn default_params() -> Self::Params {
        PathTracerParams {
            num_colors: 8,
            curve_smoothing: 0.5,
            suppress_speckles: 0.1,
        }
    }
}
```

---

## Development Commands

### Build Commands
```bash
# Development build
wasm-pack build --dev --target web --out-dir ../frontend/src/lib/wasm

# Production build
wasm-pack build --release --target web --out-dir ../frontend/src/lib/wasm

# Optimized production
wasm-pack build --release --target web --out-dir ../frontend/src/lib/wasm
wasm-opt -Oz ../frontend/src/lib/wasm/vec2art_bg.wasm -o ../frontend/src/lib/wasm/vec2art_bg.wasm
```

### Testing Commands
```bash
# Unit tests
cargo test

# WASM tests in browser
wasm-pack test --headless --chrome
wasm-pack test --headless --firefox

# Debug tests
wasm-pack test --chrome -- --nocapture
```

### Analysis Commands
```bash
# Binary size analysis
twiggy top -n 20 ../frontend/src/lib/wasm/vec2art_bg.wasm
twiggy dominators ../frontend/src/lib/wasm/vec2art_bg.wasm

# Remove dead code
wasm-snip --snip-rust-fmt-code --snip-rust-panicking-code input.wasm -o output.wasm
```

### Development Tools
```bash
# Auto-rebuild
cargo watch -c -w src -x "build --target wasm32-unknown-unknown"

# Format and lint
cargo fmt
cargo clippy -- -D warnings

# Benchmarks
cargo bench
```