# Installation

## End Users

vec2art runs in your browser. No installation required.

Visit the live application at [vec2art.vercel.app](https://vec2art.vercel.app) to start converting images.

## Developers

### Prerequisites

- Node.js 18+
- npm
- Rust toolchain (stable)
- wasm-pack

```bash
# Install wasm-pack
cargo install wasm-pack

# Add WASM target
rustup target add wasm32-unknown-unknown
```

### Setup

```bash
# Clone repository
git clone https://github.com/yourusername/vec2art.git
cd vec2art

# Install frontend dependencies
cd frontend
npm install

# Build WASM module
npm run build:wasm

# Start development server
npm run dev
```

The application runs at `http://localhost:5173`.

### Production Build

```bash
cd frontend
npm run build
npm run preview
```

## Project Structure

```
vec2art/
├── frontend/          # SvelteKit application
├── wasm/
│   ├── vectorize-core/    # Rust algorithms
│   ├── vectorize-cli/     # Native CLI tool
│   └── vectorize-wasm/    # WASM bindings
└── docs/              # Documentation
```

## Next Steps

- [Quick Start](quick-start.md) - Run your first vectorization
- [WASM Build](../development/wasm-build.md) - Detailed build instructions
