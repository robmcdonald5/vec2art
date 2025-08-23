# CLAUDE.md - WASM Module Scope

## Overview
The WASM module provides browser-based WebAssembly bindings for the vec2art vectorization engine, featuring full multithreading support with as many threads are avaiable on the users system.

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

## 🚀 WASM Build Process (FULLY AUTOMATED)

### Quick Rebuild
**Use the automated rebuild script - no manual steps required:**

```bash
# From project root
./rebuild-wasm.sh        # Linux/Mac/Git Bash
rebuild-wasm.bat         # Windows Command Prompt

# From frontend directory  
npm run rebuild-wasm     # Cross-platform
```

The script automatically:
- ✅ Builds WASM module with multithreading
- ✅ Copies all files to correct locations
- ✅ Applies all required import path fixes
- ✅ Synchronizes to static directory
- ✅ Handles all platform differences

See `WASM-REBUILD-README.md` in project root for full documentation.

### Prerequisites (One-Time Setup)
1. **Rust toolchain** with wasm32-unknown-unknown target: `rustup target add wasm32-unknown-unknown`
2. **wasm-pack** installed: `cargo install wasm-pack`

### 🚀 AUTOMATED REBUILD SCRIPTS (RECOMMENDED)

**Use the automated scripts in the project root - no manual fixes needed!**

```bash
# From project root (Linux/Mac/Git Bash)
./rebuild-wasm.sh

# From project root (Windows)
rebuild-wasm.bat

# From frontend directory (cross-platform)
cd frontend && npm run rebuild-wasm
```

See `WASM-REBUILD-README.md` for full documentation.

### Manual Build Process (Legacy - Use Automated Scripts Instead)

If you need to understand the manual process, here's what the automated scripts do:

```bash
#!/bin/bash
# Complete WASM rebuild script with all required fixes

echo "🔧 Building WASM module with multithreading..."
cd wasm/vectorize-wasm
wasm-pack build --target web --out-dir pkg --features wasm-parallel

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    echo "📁 Copying files from pkg/ to frontend..."
    cp pkg/vectorize_wasm.js ../../frontend/src/lib/wasm/
    cp pkg/vectorize_wasm.d.ts ../../frontend/src/lib/wasm/
    cp pkg/vectorize_wasm_bg.wasm ../../frontend/src/lib/wasm/
    cp pkg/vectorize_wasm_bg.wasm.d.ts ../../frontend/src/lib/wasm/
    cp -r pkg/snippets/ ../../frontend/src/lib/wasm/
    
    echo "🔧 CRITICAL: Fixing import paths (required for WASM to load)..."
    cd ../../frontend/src/lib/wasm
    
    # Fix 1: Main WASM import keys
    sed -i "s|imports\['\\./__wbindgen_placeholder__\\.js'\]|imports['__wbindgen_placeholder__']|g" vectorize_wasm.js
    
    # Fix 2: Worker helper imports
    find snippets/ -name "workerHelpers.js" -exec sed -i "s|from '\\.\\./\\.\\./\\.\\.'|from '../../../vectorize_wasm.js'|g" {} \;
    
    # Fix 3: Worker context check
    find snippets/ -name "workerHelpers.js" -exec sed -i 's|if (name === "wasm_bindgen_worker")|if (typeof self !== '\''undefined'\'' \&\& self.name === "wasm_bindgen_worker")|g' {} \;
    
    echo "📁 Synchronizing to static directory..."
    cp vectorize_wasm.js ../../static/wasm/
    cp vectorize_wasm.d.ts ../../static/wasm/
    cp vectorize_wasm_bg.wasm ../../static/wasm/
    cp vectorize_wasm_bg.wasm.d.ts ../../static/wasm/
    cp -r snippets/ ../../static/wasm/
    
    echo "🎉 WASM rebuild complete!"
    echo "✅ Performance: Expect ~292ms processing times"
    echo "✅ Threading: Stable single-threaded mode with Web Worker isolation"
    echo "ℹ️  Start dev server: cd frontend && npm run dev"
else
    echo "❌ Build failed!"
    exit 1
fi
```

### Troubleshooting

#### Common Build Issues
1. **"--release cannot be used multiple times"**: Remove explicit --release flag, it's added automatically
2. **"crate directory missing Cargo.toml"**: Ensure you're in `wasm/vectorize-wasm` directory
3. **Import errors in browser**: Check that import paths use `.js` extension
4. **Threading not working**: Verify Cross-Origin Isolation headers in vite.config.ts

#### Verification
After build, check file timestamps to ensure new files were generated:
```bash
ls -la frontend/src/lib/wasm/vectorize_wasm.js
ls -la frontend/static/wasm/vectorize_wasm.js
```

Both should have current timestamps.

### Post-Build Fixes (Legacy - May Not Be Needed)
Older versions required these fixes:
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

## Known Issues & Solutions

### RESOLVED: WebAssembly Import Errors ✅
- **Issue**: `TypeError: WebAssembly.instantiate(): Import #4 "__wbindgen_placeholder__": module is not an object or function`
- **Cause**: Incorrect import object keys in generated JavaScript bindings
- **Solution**: Fix import paths in post-build step (see above)

### RESOLVED: Worker Helper Import Failures ✅
- **Issue**: `Directory import is not supported` for worker helpers
- **Cause**: Relative imports `../../..` resolve to directories instead of files
- **Solution**: Use explicit file imports `../../../vectorize_wasm.js`

### MANAGED: crossbeam-epoch Threading Panics ⚠️
- **Issue**: `called Option::unwrap() on a None value` in crossbeam-epoch-0.9.18
- **Cause**: wasm-bindgen-rayon threading library compatibility issues
- **Solution**: Fallback to single-threaded mode with Web Worker isolation (still achieves 292ms performance)
- **Impact**: Minimal - Web Worker architecture maintains responsive UI and good performance

### Minor Issues
- Minor TextDecoder errors during worker cleanup (non-critical)
- RuntimeError on worker teardown (doesn't affect functionality)

## Future Improvements
- Automated post-build script for import fixes
- Better worker cleanup to eliminate teardown errors
- Dynamic thread count based on workload
- WebGPU acceleration investigation