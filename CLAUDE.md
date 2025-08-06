# CLAUDE.md (Local Scope: vec2art)

This file provides **project‑specific** guidance for the **vec2art** project. It covers architecture, tech stack, directory structure, development phases, and custom commands. Refer to the **global `CLAUDE.md`** for cross‑project best practices and agent workflows.

---

## Project Overview

`vec2art` is a browser‑based tool that converts raster images (JPG, PNG, WebP) into stylized SVG art via a Rust‑powered WebAssembly (WASM) module, prioritizing client‑side performance and privacy.

---

## Technology Stack

### Core Processing (Rust/WASM)
- **Language:** Rust  
- **Compilation Target:** WebAssembly  
- **Build Tools:** `wasm-pack`, `cargo`, `wasm-opt`  
- **Key Purpose:** Image processing algorithms & SVG generation

### Frontend (SvelteKit)
- **Framework:** SvelteKit 5 + Tailwind CSS 4  
- **Language:** TypeScript  
- **Package Manager:** `npm`  
- **Testing:** `vitest` (unit), `playwright` (E2E)

---

## Directory Structure

```
vec2art/
├── .claude/
│   └── commands/          # Custom slash commands for common workflows
├── .github/
│   └── workflows/         # CI/CD pipelines (e.g., test-and-lint.yml)
├── frontend/              # SvelteKit application
│   ├── src/
│   │   ├── lib/           # Shared components and utilities
│   │   │   └── wasm/      # The compiled WASM module and its JS bindings
│   │   ├── routes/        # SvelteKit pages
│   │   └── app.html       # HTML template
│   ├── package.json
│   ├── svelte.config.js
│   └── CLAUDE.md          # Frontend-specific guidelines
├── wasm/                  # Rust WebAssembly module
│   ├── src/
│   │   ├── algorithms/    # Conversion algorithm modules
│   │   └── lib.rs         # Main Rust entry point and wasm-bindgen definitions
│   ├── Cargo.toml
│   └── CLAUDE.md          # Rust/WASM-specific guidelines
└── README.md
```

---

## Professional Setup & Workflow

### Dependency Management
* **Rust/WASM**: `cargo` is the source of truth. Dependencies in `wasm/Cargo.toml`, locked in `wasm/Cargo.lock`.
* **SvelteKit**: `npm` is the source of truth. Dependencies in `frontend/package.json`, locked in `frontend/package-lock.json`.

### Code Quality & Formatting
* **Rust**: `rustfmt` for formatting, `clippy` for linting
* **SvelteKit/TypeScript**: `Prettier` for formatting, `ESLint` for linting

### Git & Commit Conventions
Follow **Conventional Commits** specification:
* `feat:` New feature
* `fix:` Bug fix
* `docs:` Documentation changes
* `test:` Test additions or changes
* `refactor:` Code refactoring
* `perf:` Performance improvements
* `chore:` Maintenance tasks

Examples: `feat: add geometric fitter algorithm`, `fix: correct SVG download filename`

### CI/CD Pipeline (GitHub Actions)
Every PR against `main` must pass:
1. **Format Check**: `cargo fmt --check`, `npm run format-check`
2. **Lint Check**: `cargo clippy`, `npm run lint`
3. **Tests**: `cargo test`, `wasm-pack test`, `npm run test`

---

## Phased Development Workflow

### Phase 1: Core Algorithm Development (**CURRENT PHASE**)
**Goal**: Build and test core conversion algorithms in Rust/WASM
1. Implement `PathTracer` algorithm (MVP)
2. Test-driven development with `cargo test`
3. Define parameter structs for JS interop via `serde`

### Phase 2: Frontend Scaffolding & MVP Integration
**Goal**: Working single-image editor with `PathTracer`
1. Build UI components: file input, control panel, preview
2. TypeScript/WASM integration layer
3. Complete flow: upload → process → download

### Phase 3: Feature Expansion
**Goal**: Additional algorithms and multi-image blending
1. Add `GeometricFitter` and `EdgeDetector` algorithms
2. Implement compositional (layer-based) blending
3. Advanced blending modes (style transfer)

### Phase 4: Polish & Deploy
**Goal**: Production-ready application
1. End-to-end testing with Playwright
2. WASM optimization for size and speed
3. Deploy to static hosting (Vercel/Cloudflare Pages)

---

## Core WASM Module Interface

The primary interface between JavaScript and Rust:

```rust
#[wasm_bindgen]
pub fn convert(image_bytes: &[u8], params: ConversionParameters) -> Result<String, JsValue>
```

* **Input**: Raw image bytes and conversion parameters
* **Output**: SVG string or error
* **Details**: See `wasm/CLAUDE.md` for implementation

---

## Quick Commands

Use slash commands for common workflows:
* `/setup-project` - Initial project setup with all tools
* `/wasm-build [dev|prod]` - Build WASM module
* `/wasm-test [chrome|firefox]` - Run WASM tests
* `/analyze-wasm` - Analyze binary size
* `/ci-check` - Run all CI checks locally

See `.claude/commands/` for all available commands.