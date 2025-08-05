---
description: Analyze WASM binary size and find optimization opportunities
---

# Analyze WASM Binary

Tools for analyzing and optimizing the WebAssembly binary size.

## Size Analysis

### Top Functions by Size
```bash
twiggy top -n 20 frontend/src/lib/wasm/vec2art_bg.wasm
```

### Dominator Tree
Shows which functions contribute most to binary size:
```bash
twiggy dominators frontend/src/lib/wasm/vec2art_bg.wasm
```

### Size Diff Between Builds
```bash
twiggy diff old.wasm new.wasm
```

## Optimization

### Remove Dead Code
```bash
wasm-snip --snip-rust-fmt-code --snip-rust-panicking-code frontend/src/lib/wasm/vec2art_bg.wasm -o optimized.wasm
```

### Aggressive Optimization with wasm-opt
```bash
# Size optimization
wasm-opt -Oz frontend/src/lib/wasm/vec2art_bg.wasm -o optimized.wasm

# Speed optimization
wasm-opt -O3 frontend/src/lib/wasm/vec2art_bg.wasm -o optimized.wasm

# Size and speed balanced
wasm-opt -O2 frontend/src/lib/wasm/vec2art_bg.wasm -o optimized.wasm
```

## Detailed Analysis

### Monos (Monomorphized Functions)
```bash
twiggy monos frontend/src/lib/wasm/vec2art_bg.wasm
```

### Paths to a Function
```bash
twiggy paths frontend/src/lib/wasm/vec2art_bg.wasm "function_name"
```