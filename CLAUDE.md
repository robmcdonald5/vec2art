# CLAUDE.md

---

# GENERAL RULES

## Agentic Workflow Principles

1. **Outline**
  When prompted break up the task at hand into a `todo list`.

2. **Deligate**
  Task sub-agents with completing these `todo` tasks using `@'relevant-agent-name'` call(s).

3. **Analyze**
  When a sub-agent is done outputting, analyze what it did and decide if the output is good or if the agent needs re-tasked with new instructions.

4. **Summarize**
  When `todo list` is completed do an overview of what was completed and output succinctly what was accomplished.

---

## Quality & Standards
  All agents when completing tasks musk follow these standards.

- **Formatting**  
  Apply language‑specific formatters (e.g., `rustfmt`, `prettier`, `black`, `autopep8`, etc..) and enforce them in CI.

- **Linting**  
  Run linters (e.g., `clippy`, `eslint`, `flake8`, etc..) on all code changes.

- **Testing**  
  Maintain automated unit and integration tests that maintain high relevant coverage.

- **Documentation**  
  As architecture of the project updates `CLAUDE.md` files need to continue to be updated inclduing this document.
  Large full project scope architecture changes should be kept and continually updated in the `Full Project Scope` section of this CLAUDE.md document.
  Local scope changes such as specific changes to parts of the code base that only affect a certain subset of the project should be put in localscope CLAUDE.md files in subfolders Examples of this are: `frontend`, `backend`, `wasm`, etc.. 

---

## CLAUDE.md Maintenance

- **Updates**  
  - Modify **this** global section when adjusting cross‑project rules.  
  - Modify or create scope level `CLAUDE.md` files for project specific updates.

---

## Project Overview

`vec2art` is a browser‑based tool that converts raster images (JPG, PNG, WebP) into stylized SVG art via a Rust‑powered WebAssembly (WASM) module, prioritizing client‑side performance. The end goal is to get high performance conversions with just CPU multithreading. GPU acceleration will be an optional addition.

---

## Technology Stack

### Core Processing (Rust/WASM)
- **Language:** Rust (other languages such as C can be used if proper wrappers exist to integrate into Rust)
- **Compilation Target:** WebAssembly (this is an endgoal, all testing should be done natively and run locally on PC)
- **Build Tools:** `wasm-pack`, `cargo`, `wasm-opt`  
- **Key Purpose:** Image processing algorithms & SVG generation

### Frontend (SvelteKit)
- **Framework:** SvelteKit 5 + Tailwind CSS 4  
- **Language:** TypeScript  
- **Package Manager:** `npm`  
- **Testing:** `vitest` (unit), `playwright` (E2E)

---

## High-Level Architecture

### Module Structure
- **`vectorize-core/`** — Pure Rust library containing all vectorization algorithms, platform-agnostic
- **`vectorize-cli/`** — Native CLI for development, benchmarking, and golden SVG snapshot testing
- **`vectorize-wasm/`** — Thin WebAssembly wrapper using `wasm-bindgen` for browser integration

### Vectorization Modes
The system supports multiple algorithmic approaches for different artistic styles and use cases:

1. **Logo/Line-Art Mode** — Binary tracing for high-contrast images (logos, sketches, scans)
2. **Color Regions Mode** — Quantization/superpixel-based posterization for photos and illustrations
3. **Edge/Centerline Mode** — Stroke-based rendering for drawn/outline effects
4. **Stylized Modes** — Creative effects including low-poly, stipple, and halftone patterns

### Processing Pipeline
1. **Input Processing** — Accept raster images (PNG, JPG, WebP)
2. **Preprocessing** — Resize, denoise, colorspace conversion as needed
3. **Vectorization** — Apply selected algorithm(s) to generate paths
4. **Curve Fitting** — Simplify and smooth paths using RDP/VW algorithms with Bézier fitting
5. **SVG Generation** — Output optimized, lightweight SVG with configurable quality settings

### Performance Strategy
- **CPU Optimization** — Primary focus on multi-threaded CPU processing using `rayon`
- **SIMD Support** — Leverage SIMD instructions where available (native and WASM)
- **Memory Management** — Zero-copy I/O, buffer reuse, and careful allocation strategies
- **Progressive Enhancement** — Optional GPU acceleration as future enhancement

### Development Phases
- **Phase 1: Native Core** — Build and test algorithms as native Rust library
- **Phase 2: WASM Integration** — Wrap core library for browser deployment
- **Phase 3: Frontend** — SvelteKit interface with real-time preview and export