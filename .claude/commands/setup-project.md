---
description: Initial project setup with all required tools
---

# Project Setup

Set up the vec2art project with all required tools and dependencies.

## Install Rust Tools
```bash
cargo install wasm-pack
cargo install twiggy
cargo install wasm-snip
cargo install cargo-watch
```

## Install Node Tools
```bash
npm install -g wasm-opt
```

## Initialize Frontend
```bash
cd frontend && npm install
```

## Verify Installation
```bash
wasm-pack --version
cargo --version
npm --version
```