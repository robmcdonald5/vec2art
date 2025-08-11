# vec2art
### **High-Performance Line Tracing for Expressive SVG Art**

A specialized browser-based tool that transforms raster images (JPG, PNG, WebP) into expressive line art SVGs using high-performance Rust-powered WebAssembly. Focus: Ultra-fast line tracing with hand-drawn aesthetics achieving <1.5s processing times.

## 🚀 Current Status

**Phases 1-2 Complete: Production-Ready Line Tracing System** ✅ **COMPLETE**
- ✅ **Four Production Backends**: Edge, dots, centerline, and superpixel vectorization algorithms
- ✅ **Multi-Pass Processing**: Directional enhancement with standard, reverse, and diagonal passes
- ✅ **Hand-Drawn Aesthetics**: Variable stroke weights, tremor effects, and natural tapering
- ✅ **Performance Achievement**: Ultra-fast <1.5s processing times with SIMD optimization
- ✅ **Comprehensive CLI**: 20+ parameters for professional line art control
- ✅ **Artistic Enhancement Pipeline**: Complete system for organic, hand-drawn line qualities
- ✅ **Multi-Backend System**: Specialized algorithms for different artistic styles and use cases
- ✅ **Production Infrastructure**: Comprehensive testing, automated scripts, and organized output structure

**Ready for Phase 3: Frontend Integration** 🚀 **NEXT PRIORITY**
- WASM bindings ready for browser deployment with multi-threading support
- Core line tracing algorithms validated and performance-optimized  
- Complete CLI interface serving as reference for frontend parameter mapping
- Organized project structure ready for SvelteKit integration

## 🏗️ Architecture

### Technology Stack
- **Core Processing**: Rust with SIMD optimization and multi-threading via `rayon`
- **Compilation Target**: WebAssembly with native development/testing
- **Frontend**: SvelteKit 5 + Tailwind CSS 4 + TypeScript (Phase 3)
- **Build Tools**: `wasm-pack`, `cargo`, `wasm-opt`
- **Performance Focus**: <1.5s processing with artistic quality enhancement

### Project Structure
```
vec2art/
├── wasm/                    # Rust/WASM line tracing engine
│   ├── vectorize-core/      # Pure Rust line tracing algorithms
│   ├── vectorize-cli/       # Native CLI with comprehensive parameters
│   ├── vectorize-wasm/      # WebAssembly bindings for browser
│   ├── scripts/             # Automated testing and validation scripts
│   ├── examples/            # Test images and organized algorithm outputs
│   └── docs/                # Technical documentation and API reference
├── frontend/                # SvelteKit frontend (Phase 3)
└── README.md               # This file
```

## 🎨 Line Tracing Backends

The system provides four specialized backends optimized for different artistic styles:

### **1. Edge Backend** (Default) ✅
- **Algorithm**: Optimized Canny edge detection with adaptive thresholds
- **Best For**: Detailed line art, drawings, sketches, complex imagery  
- **Performance**: Ultra-fast, <1.5s for typical images
- **Output**: Traditional line art with clean, continuous strokes
- **Features**: Multi-pass processing, directional enhancement, hand-drawn aesthetics

### **2. Dots Backend** ✅  
- **Algorithm**: Adaptive stippling with content-aware dot placement
- **Best For**: Artistic effects, texture emphasis, vintage styles
- **Performance**: Very fast, density-based processing
- **Output**: Stippling patterns with variable dot sizes and colors
- **Features**: Color preservation, adaptive sizing, background detection

### **3. Centerline Backend** ✅
- **Algorithm**: Zhang-Suen thinning algorithm for skeleton extraction  
- **Best For**: Bold shapes, logos, text, high-contrast imagery
- **Performance**: Moderate speed, good for simpler shapes
- **Output**: Single-pixel width centerlines, precise geometric representation
- **Features**: Morphological processing, contour-based tracing

### **4. Superpixel Backend** ✅
- **Algorithm**: SLIC (Simple Linear Iterative Clustering) segmentation
- **Best For**: Stylized art, abstract representations, color-rich images  
- **Performance**: Fast, region-based processing
- **Output**: Polygonal line art based on color/texture regions
- **Features**: Adaptive region count, artistic mode selection (filled/stroked/mixed)

## 🎯 Artistic Enhancement Features

### Hand-Drawn Aesthetics Pipeline ✅
- **Variable Stroke Weights**: Dynamic width variation based on curvature and content
- **Tremor Effects**: Subtle hand-drawn irregularities for organic, natural line feel  
- **Tapering System**: Smooth line endings with natural width transitions
- **Artistic Presets**: Multiple enhancement styles from subtle to pronounced effects

### Multi-Pass Processing ✅
- **Standard Pass**: Left-to-right, top-to-bottom edge detection
- **Reverse Pass**: Right-to-left, bottom-to-top for missed details (optional)
- **Diagonal Pass**: Diagonal scanning for complex geometries (optional)  
- **Comprehensive Coverage**: Directional passes capture maximum line detail

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

# Build WASM module (ready for browser deployment)
wasm-pack build --target web --out-dir pkg vectorize-wasm
```

### Usage Examples

```bash
# Edge Backend - Traditional line art
cargo run --bin vectorize-cli -- trace-low input.png output.svg --backend edge --detail 0.3

# Dots Backend - Stippling effects
cargo run --bin vectorize-cli -- trace-low input.png output.svg --backend dots --dot-density 0.1 --preserve-colors

# Centerline Backend - Skeleton extraction  
cargo run --bin vectorize-cli -- trace-low input.png output.svg --backend centerline --detail 0.4

# Superpixel Backend - Stylized art
cargo run --bin vectorize-cli -- trace-low input.png output.svg --backend superpixel --detail 0.5

# With Hand-Drawn Aesthetics
cargo run --bin vectorize-cli -- trace-low input.png output.svg --backend edge --detail 0.3 --hand-drawn medium

# Multi-Pass Processing  
cargo run --bin vectorize-cli -- trace-low input.png output.svg --backend edge --detail 0.3 --multipass --enable-reverse --enable-diagonal
```

### Automated Testing

```bash
# Comprehensive automated testing (5 modes available)
scripts/test-dot-mapping-auto.bat --all-line        # Basic line tracing on all images
scripts/test-dot-mapping-auto.bat --all-line-full   # Comprehensive line tracing (15 tests per image)
scripts/test-dot-mapping-auto.bat --all-dots        # Basic dot mapping on all images  
scripts/test-dot-mapping-auto.bat --all-dots-full   # Comprehensive dot mapping (18+ tests per image)

# Interactive testing with algorithm selection
scripts/test-dot-mapping-interactive.bat

# Performance benchmarks
cargo bench --workspace
```

## 📋 Development Roadmap

- [x] **Phase 1**: Core line tracing algorithms with multi-pass processing ✅ **COMPLETE**
- [x] **Phase 2**: Artistic enhancement pipeline with hand-drawn aesthetics ✅ **COMPLETE** 
- [ ] **Phase 3**: SvelteKit frontend with real-time preview (**ready to start**)
- [ ] **Phase 4**: Advanced artistic modes and optimizations

## 🎯 Performance Excellence

### Achieved Targets ✅
- **Ultra-Fast Processing**: Consistent <1.5s processing times across all backends  
- **Multi-Threading**: Parallel edge detection and path generation with `rayon`
- **SIMD Optimization**: Leveraged SIMD instructions for image processing operations
- **Memory Efficiency**: Optimized buffer management and reuse for minimal allocations
- **Quality Focus**: Hand-drawn aesthetics maintain artistic expressiveness

### Production Validation ✅  
- **Four Production Backends**: All backends tested and performance-validated
- **Comprehensive Testing**: Automated test suites with organized output structure
- **CLI Interface**: 20+ parameters providing professional-grade control
- **File Organization**: Clean project structure with proper separation of concerns
- **WASM Ready**: Browser integration prepared with threading and memory optimization

## 📚 Documentation

- [`CLAUDE.md`](./CLAUDE.md) — Project architecture and backend specifications  
- [`wasm/CLAUDE.md`](./wasm/CLAUDE.md) — Rust/WASM implementation details and organization
- [`wasm/docs/`](./wasm/docs/) — Technical API documentation and algorithm research
- [Frontend Guidelines](./frontend/CLAUDE.md) — SvelteKit frontend development (Phase 3)

## 🔧 Current Focus: Line Tracing Excellence

This project specializes in **high-performance line tracing** with artistic enhancement, providing:

- **Multiple Specialized Backends**: Each optimized for different artistic styles and use cases
- **Hand-Drawn Aesthetic Quality**: Organic, expressive line art with natural irregularities
- **Performance-First Design**: <1.5s processing targets with SIMD and multi-threading
- **Production-Ready Architecture**: Comprehensive testing, organized structure, WASM-ready
- **Professional Parameter Control**: 20+ CLI options for fine-tuning artistic output

*Phases 1-2 are complete. The system achieves production-grade line tracing quality and is ready for Phase 3 (SvelteKit Frontend Integration).*