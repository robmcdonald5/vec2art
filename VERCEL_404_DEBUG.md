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

---

**Status**: Ready for next debugging attempt - Theory 1 (Remove vercel.json)