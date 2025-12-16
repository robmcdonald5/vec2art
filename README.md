# vec2art

<div align="center">
  <img src="frontend/static/vec2art-logo.svg" alt="vec2art logo" width="200" height="200" />

  <h3>Browser-Based Image-to-SVG Vectorization</h3>

[![License: Custom Non-Commercial](https://img.shields.io/badge/License-Custom%20Non--Commercial-orange.svg)](LICENSE)
[![WebAssembly](https://img.shields.io/badge/WebAssembly-Powered-654ff0.svg)](https://webassembly.org/)
[![Rust](https://img.shields.io/badge/Rust-Performance-dea584.svg)](https://www.rust-lang.org/)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-5.0-ff3e00.svg)](https://kit.svelte.dev/)

</div>

## Overview

vec2art transforms raster images into scalable vector graphics using high-performance Rust algorithms compiled to WebAssembly. All processing happens locally in your browser - no uploads, no cloud, no tracking.

Four vectorization algorithms are available, each optimized for different image types: edge detection for line art, stippling for portraits, centerline extraction for logos, and superpixel segmentation for abstract styles.

## Quick Start

```bash
# Clone and install
git clone https://github.com/yourusername/vec2art.git
cd vec2art/frontend
npm install

# Build WASM module
npm run build:wasm

# Start development server
npm run dev
```

Visit `http://localhost:5173` to use the application.

## Documentation

| Section                                                 | Description                         |
| ------------------------------------------------------- | ----------------------------------- |
| [Getting Started](docs/getting-started/installation.md) | Installation and first steps        |
| [Algorithms](docs/algorithms/overview.md)               | Algorithm comparison and parameters |
| [Development](docs/development/architecture.md)         | Architecture and contribution guide |
| [Reference](docs/reference/parameters.md)               | Complete API documentation          |

## Technology

- **Processing**: Rust compiled to WebAssembly
- **Frontend**: SvelteKit 5, TypeScript, Tailwind CSS 4
- **Architecture**: Single-threaded WASM with Web Worker parallelism

## Performance

| Metric              | Value         |
| ------------------- | ------------- |
| Typical processing  | < 1.5 seconds |
| Memory usage        | < 40MB        |
| WASM initialization | ~50ms         |

Tested on 2048x2048 images.

## Browser Support

| Browser         | Status                       |
| --------------- | ---------------------------- |
| Chrome/Edge 90+ | Supported                    |
| Firefox 89+     | Supported                    |
| Safari 15+      | Limited (memory constraints) |
| Mobile Chrome   | Supported                    |
| Mobile Safari   | Limited                      |

## License

Custom Non-Commercial License. See [LICENSE](LICENSE) for details.

- Source code viewing and study permitted
- Personal and educational use permitted
- Commercial use requires permission
- Redistribution not permitted

## Credits

Built with [Rust](https://www.rust-lang.org/), [WebAssembly](https://webassembly.org/), [SvelteKit](https://kit.svelte.dev/), and [Tailwind CSS](https://tailwindcss.com/).

---

<div align="center">
  <p>2025 Joshua McDonald. All rights reserved.</p>
</div>
