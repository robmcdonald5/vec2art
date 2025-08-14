# CLAUDE.md - WASM Module Scope

## Overview
The WASM module provides browser-based WebAssembly bindings for the vec2art vectorization engine, featuring full multithreading support with up to 12 parallel threads.

## Current Status
✅ **Multithreading Complete** - Full parallel processing with SharedArrayBuffer and Web Workers
✅ **State Management Fixed** - Proper promise-based initialization with accurate state tracking
✅ **Browser Integration** - Working in SvelteKit frontend with Cross-Origin Isolation

## Architecture

### Module Structure
```
wasm/
├── vectorize-core/     # Core algorithms (shared with native)
├── vectorize-cli/      # CLI tool (native only)
└── vectorize-wasm/     # WASM bindings and threading
    ├── src/
    │   ├── lib.rs      # Main WASM interface
    │   └── threading.rs # Thread pool management
    └── Cargo.toml      # Dependencies and features
```

### Threading System

#### Initialization Flow
1. Browser checks for Cross-Origin Isolation (COEP/COOP headers)
2. Verifies SharedArrayBuffer availability
3. Calls `initThreadPool(threadCount)` returning a Promise
4. On success: calls `confirm_threading_success()`
5. On failure: calls `mark_threading_failed()` and falls back to single-threaded

#### Key Functions
- `initThreadPool(threads: number)` - Initialize thread pool with specified count
- `confirm_threading_success()` - Mark threading as successfully initialized
- `mark_threading_failed()` - Mark threading as failed
- `get_thread_count()` - Get active thread count
- `is_threading_supported()` - Check if threading is active
- `get_threading_info()` - Get detailed threading status

#### State Management
```rust
enum ThreadPoolState {
    NotSupported,  // No SharedArrayBuffer
    Supported,     // Available but not initialized
    Initialized,   // Successfully initialized
    Failed,        // Initialization failed
}
```

## Build Process

### Development Build
```bash
cd wasm/vectorize-wasm
wasm-pack build --target web --out-dir ../../frontend/src/lib/wasm --features wasm-parallel
```

### Production Build
```bash
RUSTFLAGS='-C target-feature=+atomics,+bulk-memory,+mutable-globals' \
wasm-pack build --target web --out-dir ../../frontend/src/lib/wasm \
--features wasm-parallel --release
```

### Post-Build Fixes
After each build, the following manual fixes are required:
1. Fix bare specifier import: `'__wbindgen_placeholder__'` → `'./__wbindgen_placeholder__.js'`
2. Fix worker helper: `if (name === "wasm_bindgen_worker")` → `if (typeof self !== 'undefined' && self.name === "wasm_bindgen_worker")`

## Dependencies

### Key Crates
- `wasm-bindgen` - JavaScript bindings
- `wasm-bindgen-rayon` - Threading support
- `web-sys` - Browser API access
- `js-sys` - JavaScript types
- `vectorize-core` - Core algorithms

### Features
- `wasm-parallel` - Enable multithreading support
- `console_log` - Enable browser console logging
- `console_error_panic_hook` - Better panic messages

## Critical Issues Resolved

### 1. Threading State Management Bug
**Problem**: Thread pool marked as initialized before Promise resolved
**Solution**: Removed premature state change, added confirmation functions

### 2. Import Path Issues
**Problem**: Bare specifier imports failed in browser
**Solution**: Fixed to use relative paths with file extensions

### 3. Worker Context Errors
**Problem**: `name` variable undefined outside Worker context
**Solution**: Added typeof check for self and self.name

### 4. Time Implementation
**Problem**: std::time::Instant not available in WASM
**Solution**: Created cross-platform wasm_time abstraction using Performance API

## Frontend Integration

### Required Headers (vite.config.ts)
```javascript
headers: {
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin'
}
```

### Initialization (loader.ts)
```typescript
const promise = wasmJs.initThreadPool(threadCount);
await promise;
wasmJs.confirm_threading_success();
```

## Performance Metrics
- **Thread Count**: 12 threads (hardware dependent)
- **Processing Time**: <1.5s for typical images
- **Initialization**: ~100ms thread pool setup
- **Memory**: SharedArrayBuffer enabled for zero-copy transfers

## Known Issues
- Minor TextDecoder errors during worker cleanup (non-critical)
- RuntimeError on worker teardown (doesn't affect functionality)

## Future Improvements
- Automated post-build script for import fixes
- Better worker cleanup to eliminate teardown errors
- Dynamic thread count based on workload
- WebGPU acceleration investigation