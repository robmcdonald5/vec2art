# vec2art Deployment Guide

This document explains how to deploy vec2art, which includes both a Rust WASM module and a SvelteKit frontend.

## Architecture Overview

vec2art consists of two main components that must be built together:

1. **WASM Module** (`wasm/vectorize-wasm/`) - Rust code compiled to WebAssembly
2. **Frontend** (`frontend/`) - SvelteKit application that uses the WASM module

## Local Development

### Prerequisites

- Node.js 20+
- Rust (stable toolchain)
- wasm-pack

### Building Locally

```bash
# Build WASM and frontend together
./rebuild-wasm.sh

# Or build frontend only (requires pre-built WASM)
cd frontend && npm run build:frontend-only
```

## GitHub Actions CI/CD

The CI/CD pipeline automatically builds both WASM and frontend components:

### Workflows

- **`frontend-ci.yml`** - Main CI pipeline with WASM + frontend build
- **`ci-minimal.yml`** - Fast feedback pipeline
- **`e2e-simple.yml`** - E2E tests with WASM build
- **`wasm-build.yml`** - WASM-specific build and testing

### Key Features

- ✅ Cross-platform builds (Ubuntu + Windows)
- ✅ Rust toolchain setup with wasm32 target
- ✅ wasm-pack installation and caching
- ✅ WASM build verification and testing
- ✅ Import path fixes applied automatically
- ✅ File synchronization to both source and static directories

## Vercel Deployment

### Automatic Deployment Setup

1. **Connect Repository**: Connect your GitHub repository to Vercel
2. **Framework Detection**: Vercel will automatically detect SvelteKit
3. **Build Configuration**: The `vercel.json` handles WASM building automatically

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Build Process

The deployment follows this sequence:

1. **Install Dependencies**: `npm ci` in frontend directory
2. **Build WASM**: `./scripts/vercel-build.sh` installs Rust tools and builds WASM
3. **Build Frontend**: SvelteKit build with pre-built WASM files
4. **Deploy**: Static files + serverless functions

### Configuration Files

- **`vercel.json`**: Main Vercel configuration with WASM headers and build setup
- **`scripts/vercel-build.sh`**: Deployment build script that installs Rust and builds WASM
- **`frontend/package.json`**: Build scripts that coordinate WASM + frontend builds

## Other Deployment Platforms

### Netlify

```bash
# Build command
chmod +x ./scripts/vercel-build.sh && ./scripts/vercel-build.sh && cd frontend && npm run build:frontend-only

# Publish directory
frontend/build
```

### Self-Hosted / VPS

```bash
# Prerequisites: Install Node.js 20+, Rust, wasm-pack

# Clone and build
git clone <repo>
cd vec2art
./rebuild-wasm.sh
cd frontend && npm ci && npm run build:frontend-only

# Serve build directory with your web server
# Ensure WASM files are served with correct MIME type
```

## Important Notes

### WASM File Requirements

- WASM files must be served with `Content-Type: application/wasm`
- WASM requires Cross-Origin Isolation headers for optimal performance
- Import paths are automatically fixed during build

### Cross-Origin Isolation

For best performance, serve with these headers:

```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

### Build Artifacts

The build process generates files in two locations:

- `frontend/src/lib/wasm/` - Source files for bundling
- `frontend/static/wasm/` - Static files for direct serving

### Troubleshooting

**Build Error: "Could not resolve ./**wbindgen_placeholder**.js"**

- Solution: Run `./rebuild-wasm.sh` to apply import path fixes

**Vercel Build Timeout**

- The WASM build can take 5-10 minutes on first deployment
- Subsequent deploys are faster due to caching

**Missing WASM Files**

- Ensure `./rebuild-wasm.sh` runs successfully
- Check that both `src/lib/wasm/` and `static/wasm/` have the files

**Rust Not Found on Deployment**

- The `scripts/vercel-build.sh` automatically installs Rust
- For other platforms, ensure Rust toolchain is available

## Performance Optimization

- WASM files are cached with `max-age=31536000` (1 year)
- Rust dependencies are cached in CI/CD
- Build artifacts are reused between deployments where possible

## Security

- No secrets or keys are included in WASM builds
- All build processes run in isolated environments
- CORS headers are properly configured for WASM execution
