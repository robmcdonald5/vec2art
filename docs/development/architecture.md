# Architecture

System design and module structure of vec2art.

## Overview

vec2art uses a Rust/WebAssembly backend with a SvelteKit frontend. Processing happens entirely client-side for privacy and performance.

```
┌─────────────────────────────────────────────────────────┐
│                      Browser                            │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────┐ │
│  │   SvelteKit  │───▶│  Web Worker  │───▶│   WASM    │ │
│  │   Frontend   │◀───│              │◀───│  Module   │ │
│  └──────────────┘    └──────────────┘    └───────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Project Structure

```
vec2art/
├── frontend/               # SvelteKit 5 application
│   ├── src/
│   │   ├── routes/         # Page components
│   │   └── lib/
│   │       ├── components/ # UI components
│   │       ├── stores/     # Svelte stores (runes)
│   │       ├── services/   # Business logic
│   │       ├── wasm/       # WASM module files
│   │       └── workers/    # Web Worker scripts
│   └── static/             # Static assets
│
├── wasm/                   # Rust/WASM crates
│   ├── vectorize-core/     # Algorithm implementations
│   ├── vectorize-cli/      # Native CLI tool
│   └── vectorize-wasm/     # Browser WASM bindings
│
└── docs/                   # Documentation
```

## WASM Module Structure

### Crate Relationships

```
vectorize-core (lib)
    ├── Algorithms (edge, dots, centerline, superpixel)
    ├── Configuration system
    ├── SVG generation
    └── Image processing utilities

vectorize-cli (bin)
    └── Uses: vectorize-core
    └── Purpose: Native testing and benchmarking

vectorize-wasm (lib)
    └── Uses: vectorize-core
    └── Purpose: Browser WASM bindings
```

### Single-Threaded + Web Worker Design

The WASM module runs single-threaded for stability. Parallelism is achieved at the JavaScript level using Web Workers.

**Rationale:**

- Universal browser compatibility
- No Cross-Origin Isolation requirements
- Simplified deployment (no special headers)
- Stable processing without threading bugs

**Processing Flow:**

1. Main thread sends image data to Web Worker
2. Web Worker loads WASM module and processes image
3. Results returned to main thread via message passing
4. UI remains responsive during processing

## Frontend Architecture

### Technology Stack

| Layer      | Technology           |
| ---------- | -------------------- |
| Framework  | SvelteKit 5          |
| Language   | TypeScript           |
| Styling    | Tailwind CSS 4       |
| State      | Svelte 5 runes       |
| Validation | Zod                  |
| Storage    | Dexie.js (IndexedDB) |

### Key Directories

**`src/lib/components/`** - Reusable Svelte components organized by function:

- `ui/` - Base UI primitives (Button, Modal, Slider)
- `converter/` - Conversion interface components
- `landing/` - Homepage components

**`src/lib/stores/`** - Global state using Svelte 5 runes:

- `converter-state.svelte.ts` - Current conversion state
- `algorithm-config-store.svelte.ts` - Algorithm parameters
- `toast.svelte.ts` - Notification system

**`src/lib/services/`** - Business logic layer:

- `vectorizer-service.ts` - WASM processing orchestration
- `download-service.ts` - Export functionality
- `performance-monitor.ts` - Metrics tracking

**`src/lib/workers/`** - Web Worker scripts:

- `wasm-processor.worker.ts` - Main processing worker
- `svg-webp-converter.worker.ts` - Format conversion

### Configuration System

Type-safe configuration with automatic Rust-TypeScript synchronization:

```
Rust (source of truth)
    ↓ ts-rs generates
TypeScript types (generated/)
    ↓ transformer maps
Frontend config (AlgorithmConfig)
    ↓ toWasmConfig()
WASM JSON config (TraceLowConfig)
```

Single JSON configuration call replaces 50+ individual setter methods.

## Data Flow

### Image Processing

```
1. User uploads image
   └── FileDropzone validates format/size
       └── Stores in IndexedDB via Dexie

2. User configures algorithm
   └── UI updates AlgorithmConfigStore
       └── Config validated by Zod schema

3. Processing triggered
   └── VectorizerService posts to Web Worker
       └── Worker loads WASM, applies config
           └── WASM processes image
               └── SVG string returned

4. Result displayed
   └── SVG rendered in preview
       └── Export options available
```

### State Persistence

- Algorithm settings stored in localStorage
- Image history stored in IndexedDB
- Session state managed by Svelte stores

## Deployment

### Vercel Git Integration

- Push to `main` triggers production deployment
- Push to `dev` or feature branches triggers preview deployment
- GitHub Actions runs CI checks (lint, test, build)

### Required Headers

```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

Configured in `vercel.json` for WASM compatibility.

## Performance Considerations

### WASM Module Loading

Two builds are maintained:

- **SIMD-optimized**: For modern browsers (~6x faster)
- **Standard**: Fallback for older browsers (~4x faster)

Runtime detection selects the appropriate module.

### Memory Management

- Image data transferred to worker, not shared
- WASM memory freed after each processing operation
- Large images may require chunked processing

### Bundle Size

| Component              | Size           |
| ---------------------- | -------------- |
| SvelteKit bundle       | ~200KB gzipped |
| WASM module (SIMD)     | ~12MB          |
| WASM module (standard) | ~12MB          |

WASM modules loaded on-demand, not included in initial bundle.
