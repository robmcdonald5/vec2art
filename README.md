# vec2art
### **High-Performance Browser-Based SVG Art Generation**

A high-performance, browser-based tool that converts raster images (JPG, PNG, WebP) into stylized SVG art using Rust-powered WebAssembly, prioritizing client-side performance with CPU multithreading.

## 🚀 Current Status

**Phase 1: Native Core Development** ✅ **COMPLETE** (Core Structure)
- ✅ Cargo workspace with `vectorize-core`, `vectorize-cli`, `vectorize-wasm` crates
- ✅ Complete module structure and public APIs
- ✅ Preprocessing pipeline (placeholder implementations)
- ✅ Logo/Line-Art and Color Regions algorithms (placeholders)
- ✅ SVG generation and path optimization
- ✅ CLI interface with convert, batch, and benchmark commands
- ✅ WASM bindings with JavaScript-compatible API
- ✅ Build configuration for native and WebAssembly targets

**Next Steps:**
- Implement actual algorithm logic (currently placeholders)
- Add comprehensive testing with golden SVG snapshots
- Performance optimization and profiling

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

1. **Logo/Line-Art Mode** — Binary tracing for high-contrast images
2. **Color Regions Mode** — Quantization-based posterization for photos
3. **Edge/Centerline Mode** — Stroke-based rendering (planned)
4. **Stylized Modes** — Creative effects like low-poly, stipple (planned)

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
cargo wasm-build

# Run CLI
cargo run --bin vectorize-cli -- --help
```

### Testing

```bash
# Unit tests
cargo test --workspace

# Benchmarks
cargo bench --workspace

# CLI conversion example
cargo run --bin vectorize-cli convert input.png output.svg --mode logo
```

## 📋 Development Roadmap

- [x] **Phase 1**: Core Rust library with CLI (structure complete)
- [ ] **Phase 2**: WebAssembly integration with threading
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

---

*This project is in active development. The core structure is complete and algorithm implementation is in progress.*