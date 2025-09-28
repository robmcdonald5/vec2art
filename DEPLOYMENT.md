# Deployment Architecture

## Overview

The vec2art project uses **Vercel Git Integration** for automatic deployments, following Vercel's official recommendations for SvelteKit applications.

## Architecture

### CI/CD Pipeline

1. **GitHub Actions** (`.github/workflows/ci.yml`)
   - ✅ Quality checks (linting, formatting, type checking)
   - ✅ Unit and component tests with coverage
   - ✅ Build validation (ensures project compiles)
   - ❌ **No deployment** (handled by Vercel)

2. **Vercel Git Integration**
   - ✅ Automatic deployments from Git pushes
   - ✅ Preview deployments for all branches
   - ✅ Production deployments from `main` branch
   - ✅ Source-based builds with full optimization

### Branch Strategy

- `main` → **Production** deployment (vec2art.vercel.app)
- `dev` → **Preview** deployment (automatic preview URL)
- Feature branches → **Preview** deployments (automatic preview URLs)

## Configuration

### SvelteKit Adapter (`svelte.config.js`)
```javascript
adapter: adapter({
  runtime: 'nodejs20.x',
  regions: ['iad1'],
  memory: 1024,
  maxDuration: 30
})
```

### Vercel Settings (`vercel.json`)
- Git deployments: **Enabled**
- Cross-Origin Isolation: **Enabled** (required for WASM)
- Security headers: **Configured**

## Benefits of This Architecture

1. **Reliability** - Fewer failure points than custom GitHub Actions deployment
2. **Performance** - Vercel's optimizations work best with source access
3. **Features** - Full Skew Protection, Preview URLs, Edge Functions
4. **Maintenance** - Less custom workflow code to maintain
5. **Official Support** - Vercel's recommended approach for SvelteKit

## Local Development

```bash
# Development server
npm run dev

# Production build test
npm run build
npm run preview

# Required before commits
npx prettier --write .
```

## Troubleshooting

- **CI failing?** Check `.github/workflows/ci.yml` logs
- **Deployment failing?** Check Vercel dashboard deployment logs
- **WASM issues?** Verify Cross-Origin headers in `vercel.json`
- **Type errors?** Run `npm run build:wasm` to rebuild WASM types

## Migration Notes

**Previous architecture**: GitHub Actions built artifacts and deployed with `--prebuilt`
**Current architecture**: GitHub Actions for CI only + Vercel Git Integration for deployment

This change eliminates `.vc-config.json` errors and provides better SvelteKit compatibility.