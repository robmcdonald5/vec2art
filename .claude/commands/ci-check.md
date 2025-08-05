---
description: Run all CI checks locally before pushing
---

# Run CI Checks Locally

Execute all continuous integration checks locally to ensure code quality before pushing.

## Full CI Check
Run all checks in sequence:
```bash
echo "🔍 Running Rust format check..."
cd wasm && cargo fmt -- --check

echo "🔍 Running Rust linter..."
cargo clippy -- -D warnings

echo "🧪 Running Rust tests..."
cargo test

echo "🌐 Running WASM tests..."
wasm-pack test --headless --chrome

echo "🔍 Running frontend checks..."
cd ../frontend && npm run lint

echo "🧪 Running frontend tests..."
npm run test

echo "✅ All checks passed!"
```

## Rust Checks Only
```bash
cd wasm
cargo fmt -- --check
cargo clippy -- -D warnings
cargo test
wasm-pack test --headless --chrome
```

## Frontend Checks Only
```bash
cd frontend
npm run format -- --check
npm run lint
npm run test:unit
npm run check
```

## Quick Pre-Push Check
Fastest essential checks:
```bash
cd wasm && cargo fmt -- --check && cargo clippy -- -D warnings
cd ../frontend && npm run lint
```

## Fix Issues Automatically

### Format Rust Code
```bash
cd wasm && cargo fmt
```

### Format Frontend Code
```bash
cd frontend && npm run format
```

### Fix Linting Issues
```bash
cd frontend && npm run lint -- --fix
```