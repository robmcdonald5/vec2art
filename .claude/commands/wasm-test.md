---
description: Run WASM tests in different browsers
argument-hint: "[chrome|firefox|all]"
---

# Run WASM Tests

Execute WebAssembly tests in various browser environments.

## Chrome Tests (Headless)
```bash
wasm-pack test --headless --chrome
```

## Firefox Tests (Headless)
```bash
wasm-pack test --headless --firefox
```

## Chrome with Debug Output
```bash
wasm-pack test --chrome -- --nocapture
```

## Run Specific Test
```bash
wasm-pack test --chrome -- test_image_conversion
```

## All Browser Tests
```bash
wasm-pack test --headless --chrome && wasm-pack test --headless --firefox
```

## Unit Tests Only
```bash
cd wasm && cargo test
```

## Benchmarks
```bash
cd wasm && cargo bench
```