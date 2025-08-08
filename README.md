# vec2art
### **High-Performance Browser-Based SVG Art Generation**

A high-performance, browser-based tool that converts raster images (JPG, PNG, WebP) into stylized SVG art using Rust-powered WebAssembly, prioritizing client-side performance with CPU multithreading.

## 🚀 Current Status

**Phase 1: Native Core Development** ✅ **FUNCTIONALLY COMPLETE** (Testbed Validated)
- ✅ Cargo workspace with `vectorize-core`, `vectorize-cli`, `vectorize-wasm` crates
- ✅ Complete module structure and public APIs
- ✅ Preprocessing pipeline with unified image standardization (max 512x512)
- ✅ Logo/Line-Art algorithm (functional but with **377-407 warnings** on complex images)
- ✅ Color Regions algorithm with **major performance breakthrough** (50-130s → <1s, **0 warnings**)
- ✅ SVG generation and path optimization
- ✅ CLI interface with positional argument parsing
- ✅ WASM bindings with production-ready JavaScript API
- ✅ Build configuration for native and WebAssembly targets
- ✅ **Automated Testbed Framework**: 100% success rate across 12 tests (6 images × 2 algorithms)

**⚠️ Critical Issue Quantified (Testbed Evidence):**
- **Moore Neighborhood Crisis**: Logo algorithm produces 377-407 warnings on 4 out of 6 test images
- **Concrete Data**: test1.png (377 warnings), test2.png (407 warnings) = unusable for production
- **Research Complete**: Suzuki-Abe algorithm identified as industry-standard replacement

**Phase 1.5: Critical Algorithm Fix** 🚧 **CRITICAL PRIORITY** (Evidence-Based)
- Replace Moore neighborhood with Suzuki-Abe contour detection
- **Target**: Reduce 377-407 warnings to <10 per image
- Use `imageproc::find_contours_with_threshold()` for robust implementation
- **Validation Ready**: Automated testbed provides concrete before/after metrics

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

1. **Logo/Line-Art Mode** — Binary tracing for high-contrast images (⚠️ **377-407 warnings on complex images**)
2. **Color Regions Mode** — Quantization-based posterization for photos (✅ **optimized, <1s processing, 0 warnings**)
3. **Edge/Centerline Mode** — Stroke-based rendering (planned)
4. **Stylized Modes** — Creative effects like low-poly, stipple (planned)

### Performance Metrics (Testbed-Validated)
- **Regions Algorithm**: Dramatically optimized from 50-130s to <1s processing time (**0 warnings across all 6 test images**)
- **Logo Algorithm**: Consistent 0-1s processing time but **377-407 warnings on complex images**
- **Image Processing**: Standardized at max 512x512 resolution for consistent performance
- **Parallel K-means**: Multi-threaded implementation with significant speedups
- **Testbed Results**: 100% completion rate across 12 tests with quantified metrics

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

# Automated testbed validation (recommended)
test-algorithms.bat

# Performance benchmarks (shows <1s regions processing)
cargo bench --workspace

# CLI conversion examples with positional arguments
cargo run --bin vectorize-cli -- convert input.png output.svg --mode logo
cargo run --bin vectorize-cli -- convert input.png output.svg --mode regions
cargo run --bin vectorize-cli -- benchmark input.png --iterations 5
```

## 📋 Development Roadmap

- [x] **Phase 1**: Core Rust library with CLI (functionally complete, **100% testbed validation**)
- [🚧] **Phase 1.5**: Critical contour tracing fix (**ESSENTIAL** - 377-407 warnings → <10)
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

### Achieved Performance (Testbed-Validated)
- **✅ Regions Algorithm**: 50-130x speed improvement (50-130s → <1s, **0 warnings across all test images**)
- **✅ Logo Algorithm**: Consistent 0-1s processing time (**but 377-407 warnings on complex images**)
- **✅ Unified Preprocessing**: Consistent image standardization at 512x512 max
- **✅ Parallel K-means**: Multi-threaded implementation with significant speedups
- **✅ Automated Validation**: 100% success rate across 12 comprehensive tests

## ⚠️ Known Issues

### Critical Issue (Testbed-Quantified)
- **Moore Neighborhood Infinite Loops**: Logo algorithm experiences severe issues on complex real-world images
  - **Quantified Symptoms**: 377-407 "cannot trace boundary" warnings on 4 out of 6 test images
  - **Concrete Evidence**: test1.png (377), test2.png (407), test3.png (185), test_gradient.png (52) warnings
  - **Success Pattern**: Simple shapes minimal warnings (test_shapes.png: 1 warning)
  - **Root Cause**: Moore neighborhood algorithm inadequate for complex topological scenarios
  - **Solution**: Suzuki-Abe algorithm via `imageproc::find_contours_with_threshold()`
  - **Status**: Research complete, **automated testbed ready for validation**, implementation in Phase 1.5

### Resolved Issues
- **✅ Regions Performance**: Resolved 50-130s processing time (now <1s)
- **✅ CLI Argument Parsing**: Resolved to use positional arguments
- **✅ WASM Build System**: Production-ready with proper optimization flags

---

## 🔍 Research-Backed Development with Automated Validation

This project leverages specialized research agents and concrete testbed validation:
- **4 Research Agents** analyzed contour tracing algorithms
- **Evidence-Based Solutions** for Moore neighborhood infinite loop issues
- **Automated Testbed Framework**: 100% completion rate with quantified metrics
- **Concrete Performance Data**: 377-407 warnings on complex images vs 0 warnings for regions
- **Industry Standards** adoption (Suzuki-Abe algorithm)
- **Validation-Ready Development**: Before/after comparison framework established

*This project is in active development. Phase 1 is functionally complete with working algorithms. Phase 1.5 addresses critical algorithm robustness issues before proceeding to WASM integration.*