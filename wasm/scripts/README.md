# vec2art WASM Build and Testing Scripts

This directory contains build scripts and testing infrastructure for the vec2art WebAssembly module, supporting both single-threaded and multi-threaded WASM builds.

## 📁 Scripts Overview

### Build Scripts

| Script              | Platform         | Threading | Description                                           |
| ------------------- | ---------------- | --------- | ----------------------------------------------------- |
| `build-wasm.sh`     | Unix/Linux/macOS | Single    | Standard WASM build for maximum browser compatibility |
| `build-wasm.ps1`    | Windows          | Single    | PowerShell version of standard WASM build             |
| `build-wasm-mt.sh`  | Unix/Linux/macOS | Multi     | Advanced WASM build with SharedArrayBuffer support    |
| `build-wasm-mt.ps1` | Windows          | Multi     | PowerShell version of multi-threaded WASM build       |

### Testing Scripts

| Script            | Platform         | Description                                         |
| ----------------- | ---------------- | --------------------------------------------------- |
| `test-wasm-mt.sh` | Unix/Linux/macOS | Comprehensive testing suite for multi-threaded WASM |

## 🚀 Quick Start

### Prerequisites

**Required Tools:**

- [Rust](https://rustup.rs/) (latest stable + nightly for multi-threading)
- [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/) (v0.12.0+)
- [Node.js](https://nodejs.org/) (v16.0.0+ for SharedArrayBuffer support)

**Optional Tools:**

- [Binaryen](https://github.com/WebAssembly/binaryen) (`wasm-opt` for optimization)
- [WABT](https://github.com/WebAssembly/wabt) (`wasm-objdump` for inspection)

### Installation

```bash
# Install Rust and wasm-pack
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# Install Node.js dependencies for testing
cd wasm/vectorize-wasm/tests
npm install

# Install optional optimization tools
npm install -g binaryen  # Provides wasm-opt
```

## 🔧 Build Instructions

### Single-threaded WASM (Recommended for Production)

**Unix/Linux/macOS:**

```bash
# Default release build with SIMD
./scripts/build-wasm.sh

# Debug build without optimization
./scripts/build-wasm.sh debug false false

# Custom build options
./scripts/build-wasm.sh release true true
#                        ^mode  ^SIMD ^wasm-opt
```

**Windows:**

```powershell
# Default release build with SIMD
.\scripts\build-wasm.ps1

# Debug build without optimization
.\scripts\build-wasm.ps1 -BuildMode debug -EnableSIMD $false -RunWasmOpt $false

# Custom build options
.\scripts\build-wasm.ps1 -BuildMode release -EnableSIMD $true -RunWasmOpt $true
```

### Multi-threaded WASM (Advanced)

**Unix/Linux/macOS:**

```bash
# Default multi-threaded build
./scripts/build-wasm-mt.sh

# Debug build for development
./scripts/build-wasm-mt.sh debug

# Full optimization build
./scripts/build-wasm-mt.sh release true true
```

**Windows:**

```powershell
# Default multi-threaded build
.\scripts\build-wasm-mt.ps1

# Debug build for development
.\scripts\build-wasm-mt.ps1 -BuildMode debug

# Full optimization build
.\scripts\build-wasm-mt.ps1 -BuildMode release -EnableSIMD $true -RunWasmOpt $true
```

## 🧪 Testing Multi-threaded WASM

### Automated Testing

```bash
# Run comprehensive test suite
./scripts/test-wasm-mt.sh

# Use custom port and interactive mode
./scripts/test-wasm-mt.sh 8080 false

# Test on different port
./scripts/test-wasm-mt.sh 3000 true
```

### Manual Testing

1. **Start the test server:**

   ```bash
   cd wasm/vectorize-wasm/tests
   npm start
   ```

2. **Open browser and navigate to:**

   ```
   http://localhost:8080/threading-test.html
   ```

3. **Run the tests:**
   - Click "Load WASM Module"
   - Click "Test Capabilities"
   - Click "Run Threading Tests"
   - Click "Performance Benchmark"

## 🏗️ Build Configuration

### Feature Flags

| Feature           | Single-threaded | Multi-threaded | Description             |
| ----------------- | --------------- | -------------- | ----------------------- |
| `simd`            | ✅ Optional     | ✅ Optional    | SIMD acceleration       |
| `wasm-parallel`   | ❌              | ✅ Required    | Multi-threading support |
| `single-threaded` | ✅ Default      | ❌             | Compatibility mode      |

### Environment Variables

**Single-threaded builds:**

```bash
export RUSTFLAGS="-C target-feature=+simd128"
```

**Multi-threaded builds:**

```bash
export RUSTFLAGS="-C target-feature=+atomics -C target-feature=+bulk-memory -C target-feature=+mutable-globals -C target-feature=+simd128 -C link-arg=--max-memory=4294967296 -C link-arg=--import-memory -C link-arg=--export-memory -C link-arg=--shared-memory"
```

### Output Directories

- **Single-threaded:** `wasm/vectorize-wasm/pkg/`
- **Multi-threaded:** `wasm/vectorize-wasm/pkg/` (overwrites single-threaded)
- **Test artifacts:** `wasm/vectorize-wasm/tests/test-report.txt`

## 🌐 Browser Requirements

### Single-threaded WASM

- **Supported:** All modern browsers
- **Requirements:** WebAssembly support
- **Headers:** None required

### Multi-threaded WASM

- **Supported:** Chrome 68+, Firefox 79+, Safari 15.2+, Edge 79+
- **Requirements:**
  - SharedArrayBuffer support
  - Secure context (HTTPS or localhost)
  - Proper CORS headers
- **Headers:**
  ```
  Cross-Origin-Embedder-Policy: require-corp
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: cross-origin
  ```

## 🔍 Troubleshooting

### Common Issues

**"wasm-pack command not found"**

```bash
# Install wasm-pack
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
source ~/.bashrc  # or restart terminal
```

**"SharedArrayBuffer is not defined"**

- Ensure proper COOP/COEP headers are set
- Use HTTPS or localhost
- Check browser compatibility

**"Target wasm32-unknown-unknown not installed"**

```bash
rustup target add wasm32-unknown-unknown
```

**Multi-threading build fails**

```bash
# Install nightly Rust for advanced features
rustup install nightly
rustup default nightly
```

**"Cannot find wasm-opt"**

```bash
npm install -g binaryen
```

### Performance Issues

**Large WASM binary size:**

- Ensure `wasm-opt` is running
- Check feature flags (disable unused features)
- Use release builds for production

**Slow compilation:**

- Use debug builds during development
- Enable parallel compilation: `export CARGO_BUILD_JOBS=4`

### Network Issues

**CORS errors:**

- Use the provided test server
- Ensure proper headers are set
- Check browser console for specific errors

**Module loading failures:**

- Verify WASM files exist in pkg/ directory
- Check network tab for 404 errors
- Ensure proper MIME types are set

## 📊 Performance Optimization

### Build Optimizations

1. **Release builds:**

   ```bash
   ./scripts/build-wasm-mt.sh release
   ```

2. **wasm-opt optimization:**

   ```bash
   wasm-opt pkg/vectorize_wasm_bg.wasm -O3 --enable-simd --enable-threads -o optimized.wasm
   ```

3. **Size analysis:**
   ```bash
   wasm-objdump -x pkg/vectorize_wasm_bg.wasm | grep -E "(import|export|section)"
   ```

### Runtime Optimizations

1. **Thread pool sizing:**
   - Use `navigator.hardwareConcurrency` to detect available cores
   - Test different thread counts for your workload

2. **Memory management:**
   - Pre-allocate SharedArrayBuffers
   - Reuse memory buffers between calls

3. **Workload distribution:**
   - Profile your specific image processing tasks
   - Balance work chunks to avoid thread starvation

## 🚀 Deployment

### Production Checklist

- [ ] Use single-threaded build for maximum compatibility
- [ ] Enable wasm-opt optimization
- [ ] Test on target browsers
- [ ] Set proper MIME types on server
- [ ] Enable gzip compression for WASM files
- [ ] Implement proper error handling

### Multi-threading Deployment

- [ ] Verify COOP/COEP headers are properly set
- [ ] Test SharedArrayBuffer availability
- [ ] Implement fallback to single-threaded mode
- [ ] Monitor browser compatibility
- [ ] Set up performance monitoring

### CDN Considerations

- Set proper cache headers for WASM files
- Ensure CORS is configured correctly
- Test loading from different origins

## 📚 Additional Resources

- [WebAssembly Documentation](https://webassembly.org/)
- [wasm-pack Book](https://rustwasm.github.io/docs/wasm-pack/)
- [SharedArrayBuffer Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer)
- [Rust and WebAssembly Book](https://rustwasm.github.io/docs/book/)

## 🤝 Contributing

When adding new build scripts or tests:

1. Follow the existing naming convention
2. Include proper error handling and logging
3. Add comprehensive help messages
4. Update this README with new instructions
5. Test on multiple platforms when possible

## 📄 License

These scripts are part of the vec2art project and are licensed under MIT OR Apache-2.0.
