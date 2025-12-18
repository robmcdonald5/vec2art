# vec2art Documentation

Browser-based image-to-SVG vectorization using Rust and WebAssembly.

## Quick Links

| Section                                            | Description                         |
| -------------------------------------------------- | ----------------------------------- |
| [Getting Started](getting-started/installation.md) | Installation and setup              |
| [Algorithms](algorithms/overview.md)               | Vectorization algorithm reference   |
| [Development](development/architecture.md)         | Architecture and contribution guide |
| [Reference](reference/parameters.md)               | Complete parameter documentation    |

## Getting Started

- [Installation](getting-started/installation.md) - Prerequisites and setup
- [Quick Start](getting-started/quick-start.md) - First vectorization
- [Browser Support](getting-started/browser-support.md) - Compatibility matrix

## Algorithms

- [Overview](algorithms/overview.md) - Algorithm comparison and selection guide
- [Edge Detection](algorithms/edge-detection.md) - Canny-based line extraction
- [Dots/Stippling](algorithms/dots-stippling.md) - Adaptive stippling effects
- [Centerline](algorithms/centerline.md) - Zhang-Suen skeleton extraction
- [Superpixel](algorithms/superpixel.md) - SLIC region segmentation

## Development

- [Architecture](development/architecture.md) - System design and module structure
- [WASM Build](development/wasm-build.md) - Compiling the WebAssembly module
- [Frontend Guide](development/frontend-guide.md) - SvelteKit development patterns
- [Testing](development/testing.md) - Test suites and CI pipeline
- [Deployment](development/deployment.md) - Vercel deployment configuration

## Reference

- [Parameters](reference/parameters.md) - Complete parameter reference for all algorithms
- [API](reference/api.md) - WASM module API documentation

## Contributing

See [Contributing Guide](contributing.md) for development setup, code style, and PR process.
