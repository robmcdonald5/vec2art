---
description: Build WASM module for development or production
argument-hint: "[dev|prod|optimize]"
---

# Build WASM Module

Build the Rust WebAssembly module for different environments.

## Development Build
Quick build with debug symbols for development:
```bash
wasm-pack build wasm --dev --target web --out-dir ../frontend/src/lib/wasm
```

## Production Build
Optimized build for production:
```bash
wasm-pack build wasm --release --target web --out-dir ../frontend/src/lib/wasm
```

## Optimized Production Build
Maximum optimization with wasm-opt:
```bash
wasm-pack build wasm --release --target web --out-dir ../frontend/src/lib/wasm
wasm-opt -Oz ../frontend/src/lib/wasm/vec2art_bg.wasm -o ../frontend/src/lib/wasm/vec2art_bg.wasm
```

## Build with Features
```bash
# With all image formats
wasm-pack build wasm --release --target web --out-dir ../frontend/src/lib/wasm -- --features "full"

# Production mode with wee_alloc
wasm-pack build wasm --release --target web --out-dir ../frontend/src/lib/wasm -- --features "production"
```