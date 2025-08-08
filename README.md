# vec2art
### **High-Performance Browser-Based SVG Art Generation**

A high-performance, browser-based tool that converts raster images (JPG, PNG, WebP) into stylized SVG art using Rust-powered WebAssembly, prioritizing client-side performance with CPU multithreading.

## 🚀 Current Status

**Phase 1: Native Core Development** ✅ **FUNCTIONALLY COMPLETE**
- ✅ Cargo workspace with `vectorize-core`, `vectorize-cli`, `vectorize-wasm` crates
- ✅ Complete module structure and public APIs
- ✅ Preprocessing pipeline with unified image standardization (max 512x512)
- ✅ Logo/Line-Art algorithm (functional but with contour tracing issues)
- ✅ Color Regions algorithm with **major performance breakthrough** (50-130s → <1s)
- ✅ SVG generation and path optimization
- ✅ CLI interface with positional argument parsing
- ✅ WASM bindings with production-ready JavaScript API
- ✅ Build configuration for native and WebAssembly targets

**⚠️ Critical Issue Identified:**
- **Moore Neighborhood Infinite Loops**: Logo algorithm experiences infinite loops on complex images
- **Research Complete**: Suzuki-Abe algorithm identified as industry-standard replacement

**Phase 1.5: Critical Algorithm Fix** 🚧 **IN PROGRESS**
- Replace Moore neighborhood with Suzuki-Abe contour detection
- Eliminate infinite loops while maintaining performance
- Use `imageproc::find_contours_with_threshold()` for robust implementation

## 🏗️ Architecture

### Technology Stack
- **Core Processing**: Rust with WebAssembly compilation
- **Frontend**: SvelteKit 5 + Tailwind CSS 4 + TypeScript (planned)
- **Build Tools**: `wasm-pack`, `cargo`, `wasm-opt`
- **Performance**: Multi-threading via `rayon`, SIMD optimization

### Project Structure
```
vec2art/
├── wasm/                    # Rust/WASM processing engine
│   ├── vectorize-core/      # Pure Rust algorithms library
│   ├── vectorize-cli/       # Native CLI for development
│   └── vectorize-wasm/      # WebAssembly bindings
├── frontend/                # SvelteKit frontend (planned)
└── docs/                    # Documentation
```

## 🎨 Vectorization Modes

1. **Logo/Line-Art Mode** — Binary tracing for high-contrast images (⚠️ contour tracing fix needed)
2. **Color Regions Mode** — Quantization-based posterization for photos (✅ optimized, <1s processing)
3. **Edge/Centerline Mode** — Stroke-based rendering (planned)
4. **Stylized Modes** — Creative effects like low-poly, stipple (planned)

### Performance Metrics
- **Regions Algorithm**: Dramatically optimized from 50-130s to <1s processing time
- **Image Processing**: Standardized at max 512x512 resolution for consistent performance
- **Parallel K-means**: Multi-threaded implementation with significant speedups

## 🛠️ Development

### Prerequisites
- Rust toolchain (stable)
- `wasm-pack` for WebAssembly builds

### Building

```bash
# Navigate to workspace
cd wasm

# Build all crates
cargo build --workspace

# Run tests
cargo test --workspace

# Build WASM module
wasm-pack build --target web --out-dir pkg vectorize-wasm

# Run CLI with positional arguments
cargo run --bin vectorize-cli -- convert input.png output.svg --mode logo
cargo run --bin vectorize-cli -- convert input.png output.svg --mode regions
```

### Testing

```bash
# Unit tests
cargo test --workspace

# Performance benchmarks (shows <1s regions processing)
cargo bench --workspace

# CLI conversion examples with positional arguments
cargo run --bin vectorize-cli -- convert input.png output.svg --mode logo
cargo run --bin vectorize-cli -- convert input.png output.svg --mode regions
cargo run --bin vectorize-cli -- benchmark input.png --iterations 5
```

## 📋 Development Roadmap

- [x] **Phase 1**: Core Rust library with CLI (functionally complete)
- [🚧] **Phase 1.5**: Critical contour tracing fix (Suzuki-Abe implementation)
- [ ] **Phase 2**: WebAssembly integration with threading (infrastructure ready)
- [ ] **Phase 3**: SvelteKit frontend with real-time preview
- [ ] **Phase 4**: Advanced algorithms and optimizations

## 📚 Documentation

- [`CLAUDE.md`](./CLAUDE.md) — Project architecture and development guidelines  
- [`TODO.md`](./TODO.md) — Detailed development tasks and progress
- [`wasm/CLAUDE.md`](./wasm/CLAUDE.md) — Rust/WASM implementation details
- [`frontend/CLAUDE.md`](./frontend/CLAUDE.md) — SvelteKit frontend guidelines

## 🎯 Performance Goals

- **Primary Focus**: Multi-threaded CPU processing
- **SIMD Optimization**: Leverage SIMD instructions where available
- **Memory Efficiency**: Zero-copy operations and buffer reuse
- **Progressive Enhancement**: Optional GPU acceleration as future enhancement

### Achieved Performance
- **✅ Regions Algorithm**: 50-130x speed improvement (50-130s → <1s)
- **✅ Unified Preprocessing**: Consistent image standardization at 512x512 max
- **✅ Parallel K-means**: Multi-threaded implementation with significant speedups

## ⚠️ Known Issues

### Critical Issue
- **Moore Neighborhood Infinite Loops**: Logo algorithm experiences infinite loops on complex real-world images
  - **Symptoms**: 300+ "cannot trace boundary" warnings, processing hangs
  - **Root Cause**: Moore neighborhood algorithm inadequate for complex topological scenarios
  - **Solution**: Suzuki-Abe algorithm via `imageproc::find_contours_with_threshold()`
  - **Status**: Research complete, implementation in Phase 1.5

### Resolved Issues
- **✅ Regions Performance**: Resolved 50-130s processing time (now <1s)
- **✅ CLI Argument Parsing**: Resolved to use positional arguments
- **✅ WASM Build System**: Production-ready with proper optimization flags

---

## 🔍 Research-Backed Development

This project leverages specialized research agents for critical algorithm decisions:
- **4 Research Agents** analyzed contour tracing algorithms
- **Evidence-Based Solutions** for Moore neighborhood infinite loop issues
- **Performance Validation** through comprehensive benchmarking
- **Industry Standards** adoption (Suzuki-Abe algorithm)

*This project is in active development. Phase 1 is functionally complete with working algorithms. Phase 1.5 addresses critical algorithm robustness issues before proceeding to WASM integration.*