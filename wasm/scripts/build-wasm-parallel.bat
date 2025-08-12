@echo off
echo Building WASM with multi-threading support...
set RUSTFLAGS=-C target-feature=+atomics,+bulk-memory,+mutable-globals
cargo build --target wasm32-unknown-unknown --features wasm-parallel %*