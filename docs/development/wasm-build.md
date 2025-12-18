# WASM Build

Compiling the WebAssembly module from Rust.

## Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add WASM target
rustup target add wasm32-unknown-unknown

# Install wasm-pack
cargo install wasm-pack
```

## Build Commands

Run from the `frontend/` directory:

### Standard Build (Recommended)

```bash
npm run build:wasm
```

Complete rebuild with TypeScript type generation:

- Generates TypeScript types from Rust structs
- Builds WASM module
- Copies files to `src/lib/wasm/` and `static/wasm/`
- Applies import path fixes automatically

### Fast Build

```bash
npm run build:wasm:no-types
```

Skips type generation. Use when only algorithm code changed.

### Clean Build

```bash
npm run build:wasm:clean
```

Clears all caches and rebuilds from scratch. Use when builds behave unexpectedly.

### Dual Build

```bash
npm run build:wasm:dual
```

Builds both SIMD-optimized and standard modules:

- `pkg-simd/` - SIMD-optimized for modern browsers
- `pkg/` - Standard fallback

## Build Output

Files are copied to two locations:

**`src/lib/wasm/`** - Production imports

```
vectorize_wasm.js          # JavaScript bindings
vectorize_wasm.d.ts        # TypeScript definitions
vectorize_wasm_bg.wasm     # WASM binary
__wbindgen_placeholder__.js
snippets/                  # wasm-bindgen helpers
```

**`static/wasm/`** - Static serving with correct MIME types

Both locations contain identical files.

## TypeScript Generation

Types are generated from Rust structs using ts-rs:

```bash
# Included in build:wasm, or run separately:
npm run generate:types
```

Output: `src/lib/types/generated/`

- `TraceLowConfig.ts` - Main configuration type
- `TraceBackend.ts` - Algorithm enum
- Other parameter types

## Manual Build Process

If npm scripts fail, build manually:

```bash
# From wasm/vectorize-wasm/
wasm-pack build --target web --out-dir pkg

# Copy to frontend
cp -r pkg/* ../../frontend/src/lib/wasm/
cp -r pkg/* ../../frontend/static/wasm/
```

### Import Fixes

wasm-pack generates imports that may need fixing:

**Fix 1: Bare specifier**

```javascript
// Change
from '__wbindgen_placeholder__'
// To
from './__wbindgen_placeholder__.js'
```

**Fix 2: Worker context check**

```javascript
// Change
if (name === "wasm_bindgen_worker")
// To
if (typeof self !== 'undefined' && self.name === "wasm_bindgen_worker")
```

The npm scripts apply these fixes automatically.

## Troubleshooting

### Build Errors

| Error                                | Solution                                       |
| ------------------------------------ | ---------------------------------------------- |
| "crate directory missing Cargo.toml" | Run from `wasm/vectorize-wasm/`                |
| "wasm-pack not found"                | Run `cargo install wasm-pack`                  |
| "target not installed"               | Run `rustup target add wasm32-unknown-unknown` |

### Runtime Errors

| Error                              | Solution                             |
| ---------------------------------- | ------------------------------------ |
| "WebAssembly.instantiate() failed" | Check import path fixes applied      |
| "SharedArrayBuffer not defined"    | Check Cross-Origin Isolation headers |
| "name is not defined"              | Apply worker context fix             |

### Verification

Check file timestamps after build:

```bash
ls -la frontend/src/lib/wasm/vectorize_wasm.js
ls -la frontend/static/wasm/vectorize_wasm.js
```

Both should show current timestamps.

## Cargo Configuration

### wasm/vectorize-wasm/Cargo.toml

Key settings:

```toml
[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
wasm-bindgen = "0.2"
vectorize-core = { path = "../vectorize-core" }

[features]
default = ["console_error_panic_hook"]
```

### Feature Flags

| Feature                    | Purpose                          |
| -------------------------- | -------------------------------- |
| `console_error_panic_hook` | Better panic messages in browser |
| `console_log`              | Enable browser console logging   |
| `generate-ts`              | TypeScript type generation       |

## Performance Optimization

### wasm-opt

Production builds use wasm-opt for size reduction:

```bash
wasm-opt -O3 vectorize_wasm_bg.wasm -o optimized.wasm
```

Not required for development builds.

### SIMD

SIMD builds require:

```toml
[target.wasm32-unknown-unknown]
rustflags = ["-C", "target-feature=+simd128"]
```

Check browser support before enabling.
