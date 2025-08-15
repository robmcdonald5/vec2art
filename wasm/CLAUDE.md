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

### Prerequisites
1. **Rust toolchain** with wasm32-unknown-unknown target installed
2. **wasm-pack** installed (`cargo install wasm-pack`)
3. Navigate to the WASM directory: `cd wasm/vectorize-wasm`
4. Ensure you have the correct directory structure with `Cargo.toml`

### Development Build
```bash
cd wasm/vectorize-wasm
wasm-pack build --target web --out-dir ../../../frontend/src/lib/wasm --features wasm-parallel
```

### Production Build (Recommended)
```bash
# Navigate to WASM directory
cd wasm/vectorize-wasm

# Build with multithreading - RUSTFLAGS are set in .cargo/config.toml
wasm-pack build --target web --out-dir ../../../frontend/src/lib/wasm --features wasm-parallel

# Note: Do NOT add --release flag as it conflicts with internal release flag
```

### 🚨 Critical Build Details

#### RUSTFLAGS Configuration
The required RUSTFLAGS are already configured in `.cargo/config.toml`:
```toml
[target.wasm32-unknown-unknown]
rustflags = [
  "-C", "target-feature=+atomics,+bulk-memory,+mutable-globals"
]
```
**Do NOT** set RUSTFLAGS environment variable - it conflicts with the config file.

#### Output Directory
- Build outputs to: `wasm/vectorize-wasm/pkg/`
- Files must be copied to: `frontend/src/lib/wasm/` 
- Then synchronized to: `frontend/static/wasm/`

### Post-Build Steps (Required)

#### 1. Copy Files from pkg/ to Frontend
```bash
# Copy main WASM files
cp wasm/vectorize-wasm/pkg/vectorize_wasm.js frontend/src/lib/wasm/
cp wasm/vectorize-wasm/pkg/vectorize_wasm.d.ts frontend/src/lib/wasm/
cp wasm/vectorize-wasm/pkg/vectorize_wasm_bg.wasm frontend/src/lib/wasm/
cp wasm/vectorize-wasm/pkg/vectorize_wasm_bg.wasm.d.ts frontend/src/lib/wasm/

# Copy worker snippets
cp -r wasm/vectorize-wasm/pkg/snippets/ frontend/src/lib/wasm/
```

#### 2. Fix Import Paths (Usually Required)
Check and fix in `frontend/src/lib/wasm/vectorize_wasm.js`:
```javascript
// BEFORE (broken):
import * as __wbg_star0 from '__wbindgen_placeholder__';

// AFTER (fixed):
import * as __wbg_star0 from './__wbindgen_placeholder__.js';
```

#### 3. Synchronize to Static Directory
```bash
# Copy files to static serving location
cp frontend/src/lib/wasm/vectorize_wasm.js frontend/static/wasm/
cp frontend/src/lib/wasm/vectorize_wasm.d.ts frontend/static/wasm/
cp frontend/src/lib/wasm/vectorize_wasm_bg.wasm frontend/static/wasm/
cp frontend/src/lib/wasm/vectorize_wasm_bg.wasm.d.ts frontend/static/wasm/
cp -r frontend/src/lib/wasm/snippets/ frontend/static/wasm/
```

### Complete Build Script
```bash
#!/bin/bash
# Complete WASM rebuild script

echo "🔧 Building WASM module with multithreading..."
cd wasm/vectorize-wasm
wasm-pack build --target web --out-dir ../../../frontend/src/lib/wasm --features wasm-parallel

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    echo "📁 Copying files from pkg/ to frontend..."
    cp pkg/vectorize_wasm.js ../../frontend/src/lib/wasm/
    cp pkg/vectorize_wasm.d.ts ../../frontend/src/lib/wasm/
    cp pkg/vectorize_wasm_bg.wasm ../../frontend/src/lib/wasm/
    cp pkg/vectorize_wasm_bg.wasm.d.ts ../../frontend/src/lib/wasm/
    cp -r pkg/snippets/ ../../frontend/src/lib/wasm/
    
    echo "🔧 Fixing import paths..."
    cd ../../frontend/src/lib/wasm
    sed -i "s|'__wbindgen_placeholder__'|'./__wbindgen_placeholder__.js'|g" vectorize_wasm.js
    
    echo "📁 Synchronizing to static directory..."
    cp vectorize_wasm.js ../../static/wasm/
    cp vectorize_wasm.d.ts ../../static/wasm/
    cp vectorize_wasm_bg.wasm ../../static/wasm/
    cp vectorize_wasm_bg.wasm.d.ts ../../static/wasm/
    cp -r snippets/ ../../static/wasm/
    
    echo "🎉 WASM rebuild complete!"
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

## Known Issues
- Minor TextDecoder errors during worker cleanup (non-critical)
- RuntimeError on worker teardown (doesn't affect functionality)

## Future Improvements
- Automated post-build script for import fixes
- Better worker cleanup to eliminate teardown errors
- Dynamic thread count based on workload
- WebGPU acceleration investigation