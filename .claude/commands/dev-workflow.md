---
description: Common development workflows and commands
---

# Development Workflow

Common commands for day-to-day development on vec2art.

## Start Development Environment

### Full Stack Development
```bash
# Terminal 1: Auto-rebuild WASM
cd wasm && cargo watch -c -w src -x "build --target wasm32-unknown-unknown"

# Terminal 2: Frontend dev server
cd frontend && npm run dev
```

### WASM Development Only
```bash
cd wasm
cargo watch -c -w src -x test
```

### Frontend Development Only
```bash
cd frontend && npm run dev
```

## Common Tasks

### Add a New Algorithm
1. Create algorithm module:
```bash
touch wasm/src/algorithms/new_algorithm.rs
```

2. Add to lib.rs:
```rust
mod algorithms;
pub use algorithms::new_algorithm::*;
```

3. Test the algorithm:
```bash
cd wasm && cargo test new_algorithm
```

### Update Dependencies

Rust dependencies:
```bash
cd wasm
cargo update
cargo outdated  # Check for outdated deps
```

Frontend dependencies:
```bash
cd frontend
npm update
npm outdated  # Check for outdated deps
```

### Debug WASM in Browser
```bash
# Build with debug symbols
wasm-pack build wasm --dev --target web --out-dir ../frontend/src/lib/wasm -- --features console_error_panic_hook

# Start frontend with source maps
cd frontend && npm run dev
```

## Performance Profiling

### Benchmark Rust Code
```bash
cd wasm && cargo bench
```

### Profile Frontend Bundle
```bash
cd frontend
npm run build -- --analyze
```

### Memory Usage Analysis
```bash
# Build and analyze
wasm-pack build wasm --release --target web --out-dir ../frontend/src/lib/wasm
twiggy top -n 50 frontend/src/lib/wasm/vec2art_bg.wasm
```

## Troubleshooting

### Clean Build
```bash
# Clean Rust build
cd wasm && cargo clean

# Clean frontend build
cd frontend && rm -rf .svelte-kit build node_modules/.vite

# Fresh install
cd frontend && npm ci
```

### Reset Everything
```bash
# Complete reset
rm -rf wasm/target frontend/node_modules frontend/.svelte-kit frontend/build
cd frontend && npm install
cd ../wasm && cargo build
```