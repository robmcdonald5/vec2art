# Vercel 404 NOT_FOUND Error - Debug Log

**Status**: 🔴 ONGOING ISSUE  
**Error**: `404: NOT_FOUND Code: NOT_FOUND ID: cle1:cle1::2bv7v-1757631308775-b2bc97e85160`  
**Last Updated**: 2025-09-11  

## Problem Summary

The vec2art application builds successfully and deploys to Vercel, but all routes return 404 NOT_FOUND errors when accessed in production. The application works correctly in local development.

## Debugging Attempts History

### Attempt 1: Simplified SvelteKit Configuration
**Date**: Initial attempt  
**Issue**: Complex ISR and split function configuration suspected  
**Changes Made**:
- Removed ISR (Incremental Static Regeneration) configuration
- Removed split functions configuration  
- Removed memory configuration
- Added prerendering configuration with `entries: ['*', '/convert', '/vec2art']`
- Simplified CSP configuration

**File Modified**: `frontend/svelte.config.js`
**Result**: ❌ Still 404 errors
**Error**: "Cannot use 'fs' when deploying to Vercel Edge Functions"

### Attempt 2: Fixed Edge Functions Compatibility  
**Date**: Follow-up to Attempt 1  
**Issue**: Edge Functions cannot use Node.js filesystem APIs  
**Changes Made**:
- Switched from Edge Runtime to Node.js 20.x runtime
- This allows API endpoints to use `fs`, `path`, `process.cwd()` etc.

**File Modified**: `frontend/svelte.config.js`
```javascript
adapter: adapter({
  runtime: 'nodejs20.x',
  regions: ['iad1']
})
```
**Result**: ✅ Build succeeds, ❌ Still 404 errors

### Attempt 3: Corrected Output Directory
**Date**: Latest attempt  
**Issue**: Suspected wrong output directory in vercel.json  
**Research Finding**: `@sveltejs/adapter-vercel` outputs to `.vercel/output`, not `.svelte-kit/output`  
**Changes Made**:
- Changed `outputDirectory` in `vercel.json`
- From: `frontend/.svelte-kit/output`  
- To: `frontend/.vercel/output`

**File Modified**: `vercel.json`
**Result**: ❌ Still 404 errors  
**Latest Error ID**: `cle1:cle1::2bv7v-1757631308775-b2bc97e85160`

## Current Configuration State

### vercel.json
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "chmod +x scripts/vercel-build.sh && ./scripts/vercel-build.sh && cd frontend && npm run build:frontend-only",
  "devCommand": "cd frontend && npm run dev",
  "installCommand": "cd frontend && npm ci",
  "outputDirectory": "frontend/.vercel/output",
  "framework": "sveltekit",
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/wasm/(.*)",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/wasm"
        },
        {
          "key": "Cross-Origin-Resource-Policy",
          "value": "cross-origin"
        }
      ]
    }
  ]
}
```

### svelte.config.js
```javascript
export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      runtime: 'nodejs20.x',
      regions: ['iad1']
    }),
    prerender: {
      entries: [
        '*', // Prerender all discoverable pages
        '/convert', // Ensure redirect pages are handled
        '/vec2art'
      ],
      handleMissingId: 'warn',
      handleHttpError: 'warn'
    },
    serviceWorker: {
      register: process.env.NODE_ENV === 'production'
    },
    csp: {
      mode: 'hash',
      directives: {
        'script-src': ['self', 'unsafe-eval', 'https://va.vercel-scripts.com'],
        'style-src': ['self', 'unsafe-inline'],
        'connect-src': ['self'],
        'img-src': ['self', 'data:', 'https:', 'blob:'],
        'font-src': ['self', 'data:'],
        'worker-src': ['self', 'blob:'],
        'object-src': ['none'],
        'base-uri': ['self']
      }
    }
  }
};
```

### Routes Structure
```
frontend/src/routes/
├── +page.svelte (/)
├── +layout.svelte
├── converter/+page.svelte (/converter)
├── gallery/+page.svelte (/gallery)
├── about/+page.svelte (/about)
├── contact/+page.svelte (/contact)
├── convert/+page.ts (redirects to /converter)
├── vec2art/+page.ts (redirects to /converter)
└── api/svg/[category]/[filename]/+server.ts
```

## Build Output Analysis

### Local Build Success
- ✅ `npm run build:frontend-only` completes successfully
- ✅ Creates `frontend/.vercel/output/` with `/functions` and `/static` directories
- ✅ No TypeScript errors
- ✅ All routes accessible in local development

### Vercel Build Success  
- ✅ Build command executes successfully on Vercel
- ✅ No build errors reported
- ✅ Deployment shows as successful
- ❌ All routes return 404 in production

## Theories to Investigate

### Theory 1: vercel.json Interference
**Hypothesis**: The custom `vercel.json` configuration might be interfering with SvelteKit's built-in routing.  
**Evidence**: SvelteKit docs suggest minimal vercel.json configuration.  
**Next Step**: Try removing vercel.json entirely and let SvelteKit handle deployment.

### Theory 2: Prerendering Configuration Issue
**Hypothesis**: The prerender configuration might be causing routing conflicts.  
**Evidence**: Prerendering `*` (all pages) might conflict with server-side API routes.  
**Next Step**: Adjust prerender configuration to exclude API routes.

### Theory 3: Framework Detection Issue
**Hypothesis**: Vercel might not be correctly detecting this as a SvelteKit application.  
**Evidence**: Custom build commands might override framework detection.  
**Next Step**: Simplify to standard SvelteKit deployment pattern.

### Theory 4: Static vs Dynamic Route Conflict
**Hypothesis**: Mix of static prerendered pages and dynamic API routes causing conflicts.  
**Evidence**: API routes require server-side execution, prerendered routes are static.  
**Next Step**: Review which routes should be prerendered vs server-side.

## Next Debugging Steps

1. **Remove vercel.json entirely** - Let SvelteKit adapter handle everything
2. **Simplify build process** - Use standard SvelteKit build without custom scripts  
3. **Review prerender configuration** - Ensure API routes aren't being prerendered
4. **Test with minimal configuration** - Strip down to bare essentials
5. **Check Vercel function logs** - Look for server-side errors
6. **Verify route handlers** - Ensure all routes have proper handlers

## Resources Referenced

- [SvelteKit Vercel Adapter Docs](https://svelte.dev/docs/kit/adapter-vercel)
- [Vercel SvelteKit Integration](https://vercel.com/docs/frameworks/full-stack/sveltekit)
- [Vercel Error Documentation](https://vercel.com/docs/errors#not-found)

## Debugging Attempt 4: Remove vercel.json (Theory 1)
**Date**: 2025-09-11 (latest)  
**Issue**: Custom vercel.json might interfere with SvelteKit's automatic deployment  
**Theory**: Let @sveltejs/adapter-vercel handle everything automatically  
**Changes Made**:
- ✅ Backed up `vercel.json` as `vercel.json.backup`
- ✅ Deleted `vercel.json` entirely
- ✅ Verified build still works: `npm run build:frontend-only` successful  
- ✅ Verified WASM headers handled in `hooks.server.ts` (lines 46-48)
- ⚠️ Missing `Cross-Origin-Resource-Policy: cross-origin` header (was in vercel.json)

**Build Output**: Still creates `frontend/.vercel/output/` correctly
**Push Status**: ✅ Committed and pushed - deployment in progress

**Additional Fix Applied**:
- ✅ Added missing `Cross-Origin-Resource-Policy: cross-origin` header to `hooks.server.ts` 
- This ensures WASM multithreading works properly without vercel.json

**Result**: ❌ **FAILED - NEW ERROR**
- Build Error: `Could not resolve entry module "index.html"`
- Vercel deployment failed during build phase
- Error: `Error: Command "vite build" exited with 1`

**Analysis**: Removing vercel.json entirely caused Vercel to lose SvelteKit context and try to build as a generic Vite app, looking for index.html instead of using SvelteKit's build process.

## WASM Header Analysis
The removed vercel.json had WASM-specific headers:
```json
{
  "source": "/wasm/(.*)",
  "headers": [
    {"key": "Content-Type", "value": "application/wasm"},
    {"key": "Cross-Origin-Resource-Policy", "value": "cross-origin"}
  ]
}
```

Current hooks.server.ts handles:
```javascript
if (url.startsWith('/wasm/') || url.endsWith('.wasm')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    response.headers.set('Content-Type', 'application/wasm'); // ✅ Covered
    // ❌ Missing: Cross-Origin-Resource-Policy: cross-origin
}
```

**Potential Next Step**: If Theory 1 fails, add missing CORS header to hooks.server.ts

## Debugging Attempt 5: Minimal vercel.json (Theory 2)
**Date**: 2025-09-11 (immediately after Theory 1 failure)  
**Issue**: Complete vercel.json removal breaks framework detection  
**Theory**: Vercel needs minimal framework hint but not complex overrides  
**Changes Made**:
- ✅ Created minimal vercel.json with only framework detection:
  ```json
  {
    "framework": "sveltekit"
  }
  ```
- ✅ No custom buildCommand, outputDirectory, or other overrides
- ✅ Let SvelteKit adapter handle all deployment logic automatically

**Reasoning**: 
- Theory 1 proved vercel.json IS needed for framework detection
- But complex configuration was likely the problem
- This provides minimal framework hint without interference

**Result**: ❌ **FAILED - BUILD ERROR**
- Build Error: `sh: line 1: svelte-kit: command not found`
- Error: `Command "svelte-kit build" exited with 127`

**Analysis**: Minimal vercel.json caused Vercel to use default SvelteKit build command `svelte-kit build` instead of our custom build process. But `svelte-kit` CLI is deprecated in favor of `vite build` in SvelteKit 2.x.

## 🚨 CRITICAL DISCOVERY: Node.js Version Mismatch
**Found**: Vercel project settings show Node.js 22.x, but our config specifies 20.x
- `svelte.config.js`: `runtime: 'nodejs20.x'`
- Vercel Project Settings: `Node.js 22.x`

**Impact**: This mismatch could cause:
- Runtime incompatibilities
- Build environment differences  
- Route handler failures
- Deployment inconsistencies

**Options**:
1. **Update svelte.config.js to Node.js 22.x** (recommended - latest)
2. **Change Vercel settings to Node.js 20.x** (match current config)

## Debugging Attempt 6: Correct Build Commands (Theory 3)
**Date**: 2025-09-11 (immediately after Theory 2 failure)  
**Issue**: Minimal vercel.json uses deprecated `svelte-kit build` command  
**Theory**: Need proper build commands but minimal configuration  
**Root Cause**: SvelteKit 2.x uses `vite build`, not `svelte-kit build`

**Changes Made**:
```json
{
  "framework": "sveltekit",
  "buildCommand": "cd frontend && npm run build:frontend-only",
  "installCommand": "cd frontend && npm ci", 
  "outputDirectory": "frontend/.vercel/output"
}
```

**Key Insights**:
- ✅ Keep framework detection: `"framework": "sveltekit"`
- ✅ Specify correct build command (not deprecated svelte-kit CLI)
- ✅ Keep working outputDirectory from previous attempts
- ✅ Combined with Node.js 22.x runtime alignment
- ❌ Removed: regions, complex headers (let SvelteKit handle)

**Result**: ❌ **FAILED - WASM BUILD ERROR**
- Build Error: `Could not resolve "./__wbindgen_placeholder__.js" from "src/lib/wasm/vectorize_wasm.js"`
- This is the WASM bindgen placeholder issue we solve locally with `rebuild-wasm.sh`
- Vercel build environment doesn't run our local WASM fixing scripts

**Analysis**: The 404 issue might actually be secondary to WASM build failure. If WASM modules fail to build/load, routes depending on them could return 404s.

## Debugging Attempt 7: WASM Build Integration (Theory 4)
**Date**: 2025-09-11 (after Theory 3 WASM failure)  
**Issue**: `__wbindgen_placeholder__.js` error - WASM bindgen placeholder not resolved  
**Root Cause Discovery**: Vercel community shows same issue - WASM must be built BEFORE frontend build

**Research Findings**:
- Same error reported by other SvelteKit + Rust WASM + Vercel users
- Solution: Move generated `pkg` to `$lib` directory and import from there
- Alternative: Ensure WASM is built before frontend build process
- The issue is that normal `wasm-pack` output doesn't work in Vercel's build environment

**Changes Made**:
```json
{
  "buildCommand": "chmod +x scripts/vercel-build.sh && ./scripts/vercel-build.sh && cd frontend && npm run build:frontend-only"
}
```

**This approach**:
- ✅ Runs our existing `vercel-build.sh` script that builds WASM correctly
- ✅ Applies all WASM bindgen placeholder fixes automatically  
- ✅ Ensures WASM files exist before SvelteKit build attempts to bundle them
- ✅ Uses our proven local build process that works

**Combined Fixes**:
- ✅ Node.js 22.x runtime alignment
- ✅ Correct framework detection
- ✅ Proper WASM build integration
- ✅ Correct output directory configuration

**Result**: 🔄 **TESTING IN PROGRESS**

---

**Status**: 🔄 Testing Theory 4 - WASM build integration + all previous fixes