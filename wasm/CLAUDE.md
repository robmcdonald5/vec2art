# wasm/CLAUDE.md

This document provides Rust/WASM-specific implementation guidelines for the vec2art core processing module.

## Essential Crates

### Core WASM Integration
* `wasm-bindgen` (0.2) - JavaScript interop and bindings
* `web-sys` - Web APIs access from Rust
* `js-sys` - JavaScript primitives and objects
* `serde` (1.0) + `serde-wasm-bindgen` - Parameter serialization between JS and Rust
* `console_error_panic_hook` - Better panic messages in browser console
* `wee_alloc` - Tiny memory allocator optimized for WASM

### Vectorization Algorithms
* `vtracer` - Native Rust vectorization with O(n) complexity
* `potrace` (via cc/bindgen) - Gold standard bi-level tracing
* `autotrace` (via cc/bindgen) - Centerline tracing support
* `image` (0.25) - Image decoding and basic operations
* `imageproc` - Advanced image processing (edge detection, filtering)

### Image Processing
* `palette` - Color manipulation, quantization, LAB color space
* `nalgebra` - Linear algebra for geometric calculations
* `euclid` - 2D geometry primitives
* `kdtree` or `rstar` - Spatial indexing for shape detection

### Performance & Parallelization
* `rayon` + `wasm-bindgen-rayon` - Thread pool for Web Workers
* `wasm-mt` - Low-level Web Worker management
* `packed_simd_2` - SIMD operations (when stable)
* `web-sys` with SharedArrayBuffer support

### SVG Generation & Optimization
* `svg` - Programmatic SVG document creation
* `lyon` - Path tessellation and Bezier curve fitting
* `kurbo` - 2D curves and paths (Bézier, arcs)
* `svgcleaner` - SVG optimization (or custom implementation)

### Utilities
* `getrandom` - WASM-compatible random number generation
* `log` + `console_log` - Logging to browser console
* `thiserror` - Error handling with proper error types
* `criterion` - Benchmarking for performance optimization

---

## Build Configuration

### Cargo.toml Optimization Profiles

```toml
# Base release profile
[profile.release]
opt-level = 3           # Maximum speed optimization
lto = true              # Link-time optimization
codegen-units = 1       # Single codegen unit for better optimization
strip = true            # Strip symbols
panic = "abort"         # Smaller binary, no unwinding

# Size-optimized profile for base binary
[profile.wasm-size]
inherits = "release"
opt-level = "z"         # Aggressive size optimization

# SIMD-enabled profile
[profile.wasm-simd]
inherits = "release"
opt-level = 3

# Parallel processing profile
[profile.wasm-parallel]
inherits = "release"
opt-level = 3

[profile.dev]
opt-level = 2           # Better performance during development
```

### Target-Specific Build Configuration

```toml
[target.wasm32-unknown-unknown]
rustflags = [
    "-C", "link-arg=--max-memory=4294967296",  # 4GB max memory
    "-C", "link-arg=--initial-memory=16777216", # 16MB initial
]

# For SIMD builds
[target.'cfg(simd)'.wasm32-unknown-unknown]
rustflags = [
    "-C", "target-feature=+simd128",
    "-C", "link-arg=--max-memory=4294967296",
]

# For parallel builds
[target.'cfg(parallel)'.wasm32-unknown-unknown]
rustflags = [
    "-C", "target-feature=+atomics,+bulk-memory,+mutable-globals",
    "-C", "link-arg=--shared-memory",
    "-C", "link-arg=--max-memory=4294967296",
]
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
basic = ["image/jpeg", "image/png", "vtracer"]
full = ["image/jpeg", "image/png", "image/webp", "image/gif", "vtracer", "potrace", "autotrace"]
simd = ["packed_simd_2"]
parallel = ["rayon", "wasm-bindgen-rayon"]
production = ["wee_alloc", "simd", "parallel"]
debug = ["console_error_panic_hook"]
potrace = ["cc", "bindgen"]
autotrace = ["cc", "bindgen"]
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

### SIMD Implementation

```rust
#[cfg(target_feature = "simd128")]
use std::arch::wasm32::*;

// Grayscale conversion using SIMD
pub fn grayscale_simd(rgba_pixels: &[u8], output: &mut [u8]) {
    #[cfg(target_feature = "simd128")]
    {
        // Process 4 pixels at once
        let r_weight = f32x4_splat(0.299);
        let g_weight = f32x4_splat(0.587);
        let b_weight = f32x4_splat(0.114);
        
        for (chunk_in, chunk_out) in rgba_pixels.chunks_exact(16)
            .zip(output.chunks_exact_mut(4)) {
            
            // Load 4 RGBA pixels
            let pixels = v128_load(chunk_in.as_ptr() as *const v128);
            
            // Extract channels (complex but fast)
            let r = u8x16_swizzle(pixels, /* mask for R channel */);
            let g = u8x16_swizzle(pixels, /* mask for G channel */);
            let b = u8x16_swizzle(pixels, /* mask for B channel */);
            
            // Convert to f32 and compute luminance
            let r_f32 = f32x4_convert_u32x4(/* ... */);
            let g_f32 = f32x4_convert_u32x4(/* ... */);
            let b_f32 = f32x4_convert_u32x4(/* ... */);
            
            let lum = f32x4_add(
                f32x4_add(
                    f32x4_mul(r_f32, r_weight),
                    f32x4_mul(g_f32, g_weight)
                ),
                f32x4_mul(b_f32, b_weight)
            );
            
            // Convert back and store
            // ... conversion logic ...
        }
    }
    
    #[cfg(not(target_feature = "simd128"))]
    {
        // Fallback scalar implementation
        for (i, chunk) in rgba_pixels.chunks_exact(4).enumerate() {
            let gray = (0.299 * chunk[0] as f32 +
                       0.587 * chunk[1] as f32 +
                       0.114 * chunk[2] as f32) as u8;
            output[i] = gray;
        }
    }
}

// Color distance calculation using SIMD
pub fn color_distance_simd(pixels1: &[u8], pixels2: &[u8]) -> Vec<f32> {
    #[cfg(target_feature = "simd128")]
    {
        let mut distances = Vec::with_capacity(pixels1.len() / 4);
        
        for (p1, p2) in pixels1.chunks_exact(16).zip(pixels2.chunks_exact(16)) {
            // Process 4 RGB pixels at once
            let v1 = v128_load(p1.as_ptr() as *const v128);
            let v2 = v128_load(p2.as_ptr() as *const v128);
            
            // Calculate differences
            let diff = i16x8_sub_sat(
                u8x16_extend_low_u16x8(v1),
                u8x16_extend_low_u16x8(v2)
            );
            
            // Square differences
            let squared = i16x8_mul(diff, diff);
            
            // Sum and sqrt
            // ... implementation ...
        }
        
        distances
    }
    
    #[cfg(not(target_feature = "simd128"))]
    {
        // Scalar fallback
        pixels1.chunks_exact(3)
            .zip(pixels2.chunks_exact(3))
            .map(|(p1, p2)| {
                let dr = p1[0] as f32 - p2[0] as f32;
                let dg = p1[1] as f32 - p2[1] as f32;
                let db = p1[2] as f32 - p2[2] as f32;
                (dr * dr + dg * dg + db * db).sqrt()
            })
            .collect()
    }
}
```

### Parallel Processing Architecture

```rust
use wasm_bindgen::prelude::*;
use wasm_bindgen_rayon::init_thread_pool;
use rayon::prelude::*;
use web_sys::SharedArrayBuffer;

/// Initialize Web Worker pool for parallel processing
#[wasm_bindgen]
pub struct ParallelEngine {
    shared_memory: Option<SharedArrayBuffer>,
    tile_size: usize,
}

#[wasm_bindgen]
impl ParallelEngine {
    pub fn new(num_threads: usize) -> Result<ParallelEngine, JsValue> {
        init_thread_pool(num_threads);
        Ok(ParallelEngine {
            shared_memory: None,
            tile_size: 256, // Default tile size
        })
    }
    
    pub fn set_shared_memory(&mut self, buffer: SharedArrayBuffer) {
        self.shared_memory = Some(buffer);
    }
    
    /// Process image in parallel tiles
    pub fn process_tiled(&self, width: u32, height: u32) -> Vec<TileResult> {
        let tiles = self.generate_tiles(width, height);
        
        tiles.par_iter()
            .map(|tile| self.process_tile(tile))
            .collect()
    }
    
    fn generate_tiles(&self, width: u32, height: u32) -> Vec<Tile> {
        let mut tiles = Vec::new();
        let tile_size = self.tile_size as u32;
        
        for y in (0..height).step_by(tile_size as usize) {
            for x in (0..width).step_by(tile_size as usize) {
                tiles.push(Tile {
                    x,
                    y,
                    width: tile_size.min(width - x),
                    height: tile_size.min(height - y),
                });
            }
        }
        
        tiles
    }
    
    fn process_tile(&self, tile: &Tile) -> TileResult {
        // Process individual tile
        // This runs in parallel across Web Workers
        TileResult {
            tile: tile.clone(),
            paths: vec![], // Vectorization results
        }
    }
}

#[derive(Clone)]
struct Tile {
    x: u32,
    y: u32,
    width: u32,
    height: u32,
}

struct TileResult {
    tile: Tile,
    paths: Vec<SvgPath>,
}

/// Parallel color quantization using rayon
pub fn parallel_quantize(image: &DynamicImage, num_colors: usize) -> Vec<Rgb<u8>> {
    let pixels: Vec<_> = image.to_rgb8().pixels().cloned().collect();
    
    // Parallel k-means clustering
    let mut centers: Vec<Lab> = (0..num_colors)
        .into_par_iter()
        .map(|i| {
            let idx = i * pixels.len() / num_colors;
            rgb_to_lab(&pixels[idx])
        })
        .collect();
    
    for _ in 0..10 {
        // Assign pixels to clusters in parallel
        let assignments: Vec<usize> = pixels
            .par_iter()
            .map(|pixel| {
                let lab = rgb_to_lab(pixel);
                find_nearest_center(&lab, &centers)
            })
            .collect();
        
        // Update centers in parallel
        centers = (0..num_colors)
            .into_par_iter()
            .map(|i| {
                let cluster_pixels: Vec<_> = pixels.iter()
                    .zip(&assignments)
                    .filter(|(_, &a)| a == i)
                    .map(|(p, _)| rgb_to_lab(p))
                    .collect();
                
                if cluster_pixels.is_empty() {
                    centers[i]
                } else {
                    compute_mean(&cluster_pixels)
                }
            })
            .collect();
    }
    
    centers.into_iter().map(lab_to_rgb).collect()
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

## Advanced Algorithm Architecture

### Modular Pipeline Implementation

```rust
use crate::error::Vec2ArtError;
use serde::{Deserialize, Serialize};

/// Main vectorization pipeline
pub struct VectorizationPipeline {
    preprocessor: Box<dyn Preprocessor>,
    vectorizer: Box<dyn Vectorizer>,
    postprocessor: Box<dyn Postprocessor>,
    optimizer: SvgOptimizer,
}

impl VectorizationPipeline {
    pub fn convert(
        &self,
        image: DynamicImage,
        params: &ConversionParameters,
    ) -> Result<String, Vec2ArtError> {
        // Stage 1: Pre-processing
        let processed = self.preprocessor.process(&image, params)?;
        
        // Stage 2: Vectorization
        let paths = self.vectorizer.vectorize(&processed, params)?;
        
        // Stage 3: Post-processing
        let optimized_paths = self.postprocessor.process(paths, params)?;
        
        // Stage 4: SVG generation
        let svg = self.optimizer.generate_svg(optimized_paths, params)?;
        
        Ok(svg)
    }
}

/// Pre-processing trait
pub trait Preprocessor: Send + Sync {
    fn process(
        &self,
        image: &DynamicImage,
        params: &ConversionParameters,
    ) -> Result<ProcessedImage, Vec2ArtError>;
}

/// Advanced pre-processor with full pipeline
pub struct AdvancedPreprocessor {
    noise_reducer: NoiseReducer,
    quantizer: ColorQuantizer,
    thresholder: AdaptiveThresholder,
}

impl Preprocessor for AdvancedPreprocessor {
    fn process(
        &self,
        image: &DynamicImage,
        params: &ConversionParameters,
    ) -> Result<ProcessedImage, Vec2ArtError> {
        let mut processed = image.clone();
        
        // Apply Gaussian blur for noise reduction
        if params.denoise {
            processed = self.noise_reducer.reduce(&processed, params.noise_sigma)?;
        }
        
        // Color quantization for multi-color images
        if params.num_colors > 0 {
            let palette = self.quantizer.quantize(&processed, params.num_colors)?;
            processed = apply_palette(&processed, &palette)?;
        }
        
        // Adaptive thresholding for bi-level conversion
        if params.use_threshold {
            processed = self.thresholder.threshold(&processed)?;
        }
        
        Ok(ProcessedImage {
            data: processed,
            metadata: ImageMetadata {
                original_size: (image.width(), image.height()),
                palette: self.quantizer.get_palette(),
            },
        })
    }
}

/// Vectorizer trait for different algorithms
pub trait Vectorizer: Send + Sync {
    fn vectorize(
        &self,
        image: &ProcessedImage,
        params: &ConversionParameters,
    ) -> Result<Vec<VectorPath>, Vec2ArtError>;
    
    fn supports_color(&self) -> bool;
    fn supports_centerline(&self) -> bool;
    fn complexity(&self) -> AlgorithmComplexity;
}

/// Hybrid vectorizer that can use multiple algorithms
pub struct HybridVectorizer {
    potrace: Option<PotraceVectorizer>,
    vtracer: VtracerVectorizer,
    autotrace: Option<AutotraceVectorizer>,
}

impl HybridVectorizer {
    pub fn select_best(
        &self,
        image: &ProcessedImage,
        params: &ConversionParameters,
    ) -> Box<dyn Vectorizer> {
        // Heuristic selection based on image characteristics
        if params.centerline_mode {
            if let Some(ref autotrace) = self.autotrace {
                return Box::new(autotrace.clone());
            }
        }
        
        if image.is_bilevel() && self.potrace.is_some() {
            Box::new(self.potrace.as_ref().unwrap().clone())
        } else {
            Box::new(self.vtracer.clone())
        }
    }
}

/// Post-processor for path optimization
pub struct AdvancedPostprocessor {
    simplifier: DouglasPeuckerSimplifier,
    curve_fitter: BezierCurveFitter,
    merger: PathMerger,
}

impl Postprocessor for AdvancedPostprocessor {
    fn process(
        &self,
        paths: Vec<VectorPath>,
        params: &ConversionParameters,
    ) -> Result<Vec<VectorPath>, Vec2ArtError> {
        let mut optimized = paths;
        
        // Simplify paths
        optimized = self.simplifier.simplify(optimized, params.simplification_epsilon)?;
        
        // Fit Bezier curves
        if params.use_curves {
            optimized = self.curve_fitter.fit(optimized, params.curve_tolerance)?;
        }
        
        // Merge similar paths
        optimized = self.merger.merge(optimized)?;
        
        Ok(optimized)
    }
}
```

### Algorithm-Specific Implementations

```rust
/// Potrace integration (compiled from C)
#[cfg(feature = "potrace")]
pub struct PotraceVectorizer {
    handle: *mut potrace_state_t,
}

#[cfg(feature = "potrace")]
impl Vectorizer for PotraceVectorizer {
    fn vectorize(
        &self,
        image: &ProcessedImage,
        params: &ConversionParameters,
    ) -> Result<Vec<VectorPath>, Vec2ArtError> {
        unsafe {
            // Call Potrace C functions via FFI
            let bitmap = create_potrace_bitmap(&image.data)?;
            let trace_params = potrace_params_from_config(params);
            
            potrace_trace(self.handle, bitmap, trace_params)?;
            
            let paths = extract_potrace_paths(self.handle)?;
            Ok(paths)
        }
    }
    
    fn supports_color(&self) -> bool { false }
    fn supports_centerline(&self) -> bool { false }
    fn complexity(&self) -> AlgorithmComplexity { 
        AlgorithmComplexity::Quadratic // O(n²) for curve fitting
    }
}

/// vtracer integration (native Rust)
pub struct VtracerVectorizer;

impl Vectorizer for VtracerVectorizer {
    fn vectorize(
        &self,
        image: &ProcessedImage,
        params: &ConversionParameters,
    ) -> Result<Vec<VectorPath>, Vec2ArtError> {
        // Use vtracer crate directly
        let config = vtracer::Config {
            input_size: image.data.dimensions(),
            color_mode: vtracer::ColorMode::Color,
            filter_speckle: params.suppress_speckles as usize,
            color_precision: params.color_precision,
            layer_difference: params.layer_difference,
            corner_threshold: params.corner_threshold,
            length_threshold: params.length_threshold,
            splice_threshold: params.splice_threshold,
            max_iterations: params.max_iterations,
        };
        
        let paths = vtracer::trace(&image.data, config)?;
        Ok(convert_vtracer_paths(paths))
    }
    
    fn supports_color(&self) -> bool { true }
    fn supports_centerline(&self) -> bool { false }
    fn complexity(&self) -> AlgorithmComplexity { 
        AlgorithmComplexity::Linear // O(n) throughout
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