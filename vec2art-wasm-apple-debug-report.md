# vec2art WASM on Apple Browsers — Debug & Remediation Report

_Last updated: 2025-09-13 (America/Chicago)_

## TL;DR

Your converter breaks on iPhone/iPad/Mac because Safari/WebKit enforces extra constraints that your current WASM/worker setup is likely violating. The most common causes:

1. Missing cross-origin isolation headers (needed for threads/`SharedArrayBuffer`).  
2. Wrong `.wasm` MIME type (`application/wasm`) causing `instantiateStreaming` to fail.  
3. Using **module workers** and/or **OffscreenCanvas** on older iOS Safari (pre-16.4) without fallbacks.  
4. A strict CSP that blocks WASM instantiation.

**Fix pack to ship now (order matters):**

- Add **COOP/COEP** headers and correct `.wasm` MIME (via `vercel.json`).  
- Use a **robust WASM loader** (streaming with fallback).  
- Add **module-worker** and **OffscreenCanvas** feature detection with fallbacks.  
- Loosen CSP just enough to confirm/not block WASM.  
- If fronted by **Cloudflare**, ensure headers pass through; test with “DNS only” (grey cloud).

---

## 1) Symptom Profile

- Works on Windows (Firefox/Chromium) and Android.  
- Fails on iOS/iPadOS/macOS Safari; **one iPhone 11 user works** → likely on iOS 16.4+ (module workers + OffscreenCanvas OK), others are older or missing isolation headers.

---

## 2) Root-Cause Candidates (Apple-specific)

### A. Threads / `SharedArrayBuffer` require cross-origin isolation
- If you use Rayon/multithreaded WASM now or soon, you **must** set both:
  - `Cross-Origin-Opener-Policy: same-origin`
  - `Cross-Origin-Embedder-Policy: require-corp` (or `credentialless` as an alternative)
- Without them, iOS/macOS Safari disables `SharedArrayBuffer`, and thread startup fails (often silently).

### B. `.wasm` must be served with `Content-Type: application/wasm`
- Safari will throw when using `WebAssembly.instantiateStreaming(fetch("*.wasm"))` if the MIME is wrong.
- Always provide a non-streaming fallback (`arrayBuffer()` → `instantiate`).

### C. Module Workers & OffscreenCanvas support differences
- **Module workers** are reliable only on iOS **16.4+**. Older iOS will break on `{ type: "module" }`.
- **OffscreenCanvas** is also only safe on iOS **16.4+**. Use runtime guards and fall back to main-thread canvas when necessary.

### D. CSP may block WASM
- Strict `Content-Security-Policy` may require `'wasm-unsafe-eval'` (or older `'unsafe-eval'`) in `script-src`.
- Worker loading can also be blocked by `worker-src` if too strict.

---

## 3) Concrete Fixes (Copy-Paste Ready)

### 3.1 `vercel.json` (place at repo root)

> Ensures **cross-origin isolation** and correct **.wasm MIME**.

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
        { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" }
      ]
    },
    {
      "source": "/(.*)\.wasm",
      "headers": [
        { "key": "Content-Type", "value": "application/wasm" },
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

> If third-party subresources get blocked by COEP, either proxy them through your domain (so they’re same-origin) **or** try `Cross-Origin-Embedder-Policy: credentialless` and ensure you’re not sending credentials to those origins.

---

### 3.2 Robust WASM Loader (TypeScript utility)

> Handles streaming on modern engines; falls back for Safari/mis-MIME cases.

```ts
// src/lib/wasm/loadWasm.ts
export async function loadWasm(
  url: string,
  imports: WebAssembly.Imports = {}
): Promise<WebAssembly.WebAssemblyInstantiatedSource> {
  if ('instantiateStreaming' in WebAssembly) {
    try {
      // @ts-ignore - TS doesn't narrow this correctly
      return await WebAssembly.instantiateStreaming(fetch(url), imports);
    } catch (err) {
      console.warn('[WASM] Streaming failed; falling back to ArrayBuffer:', err);
    }
  }
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`[WASM] fetch failed: ${resp.status} ${resp.statusText}`);
  const bytes = await resp.arrayBuffer();
  return await WebAssembly.instantiate(bytes, imports);
}
```

Usage example:

```ts
import { loadWasm } from '$lib/wasm/loadWasm';

const { instance, module } = await loadWasm('/vectorize_wasm_bg.wasm', {
  env: { /* ...imports... */ }
});
```

---

### 3.3 Worker Creation with Safari Fallbacks

> Detect **module worker** support and provide a classic worker fallback.  
> Also guard **OffscreenCanvas** use.

```ts
// src/lib/workers/workerSupport.ts
export function supportsModuleWorkers(): boolean {
  try {
    // If this throws, module workers are not supported
    const blob = new Blob([''], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    new Worker(url, { type: 'module' });
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

export function hasOffscreenCanvas(): boolean {
  return typeof (globalThis as any).OffscreenCanvas === 'function';
}

export const isCrossOriginIsolated = (globalThis as any).crossOriginIsolated === true;
export const hasSharedArrayBuffer = typeof (globalThis as any).SharedArrayBuffer === 'function';
```

```ts
// src/lib/workers/spawnWasmWorker.ts
import { supportsModuleWorkers } from './workerSupport';

// IMPORTANT: provide both bundles at build time
// - /workers/wasm-processor.worker.js (module)
// - /workers/wasm-processor.legacy.js (classic)

export function spawnWasmWorker(): Worker {
  if (supportsModuleWorkers()) {
    return new Worker(new URL('/workers/wasm-processor.worker.js', import.meta.url), { type: 'module' });
  }
  // Classic worker (no "type: module")
  return new Worker(new URL('/workers/wasm-processor.legacy.js', import.meta.url));
}
```

In render code:

```ts
import { hasOffscreenCanvas } from '$lib/workers/workerSupport';

// Use OffscreenCanvas only when present
const canUseOffscreen = hasOffscreenCanvas();
if (canUseOffscreen) {
  // create OffscreenCanvas and pass to worker
} else {
  // render on a visible <canvas> on the main thread (fallback path)
}
```

> **Build note (Vite/SvelteKit):** ensure your bundler emits **both** worker outputs (module & classic). One approach is to keep a classic worker entry that avoids ESM `import` syntax and is built to an IIFE/UMD target.

---

### 3.4 Minimal CSP for Validation

> Only if you’ve enabled a strict CSP and suspect it’s blocking WASM. Add temporarily to verify; then tighten.

```
Content-Security-Policy:
  script-src 'self' 'wasm-unsafe-eval';
  worker-src 'self' blob:;
```

- Keep it as strict as your app allows; the goal is to confirm whether CSP is the blocker.

---

### 3.5 Cloudflare Fronting (If Applicable)

- For testing, set your DNS record to **DNS only** (grey cloud) to ensure headers arrive unchanged.  
- Disable features that may alter response headers/scripts (e.g., Rocket Loader, script transforms) during debugging.  
- Once headers are confirmed passed through, you can re-enable proxy features incrementally.

---

## 4) Drop-in Diagnostics (Temporary UI / Console Table)

> Add this to a debug route or behind a “Diagnostics” toggle. Ask failing users to share the output.

```ts
// src/lib/debug/wasmDiag.ts
export function wasmDiagnostics() {
  const diag = {
    ua: navigator.userAgent,
    crossOriginIsolated: (globalThis as any).crossOriginIsolated === true,
    hasSharedArrayBuffer: typeof (globalThis as any).SharedArrayBuffer === 'function',
    hasInstantiateStreaming: 'instantiateStreaming' in WebAssembly,
    moduleWorkers: (() => {
      try {
        const blob = new Blob([''], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        new Worker(url, { type: 'module' });
        URL.revokeObjectURL(url);
        return true;
      } catch {
        return false;
      }
    })(),
    offscreenCanvas: typeof (globalThis as any).OffscreenCanvas === 'function'
  };
  console.table(diag);
  return diag;
}
```

**Interpretation:**

- If `crossOriginIsolated: false` **and** you use threads → your headers are missing/blocked.  
- If `hasInstantiateStreaming: true` but instantiation throws → MIME likely wrong; rely on the fallback.  
- If `moduleWorkers: false` or `offscreenCanvas: false` on failing iOS → ship the fallbacks above.

---

## 5) Step-by-Step Remediation Plan

1. **Add `vercel.json` headers** and redeploy.  
2. **Confirm headers** reach the browser:
   - In Safari devtools → Network → your HTML → **Headers** tab should show COOP/COEP.
   - Or run:  
     ```
     curl -I https://your-domain.tld/ | grep -E "Cross-Origin-(Opener|Embedder)-Policy|Content-Type"
     ```
3. **Ship the robust WASM loader** and switch code to use it.  
4. **Add worker/Offscreen feature detection & fallbacks**; build both worker variants.  
5. **Temporarily relax CSP** (if present) to test; then restrict gradually.  
6. If fronted by **Cloudflare**, retest with **DNS only** (grey cloud). When stable, re-enable proxy features one by one.

---

## 6) Test Matrix (Fill This Out While Verifying)

| Platform/Browser        | Version      | COI (true?) | .wasm MIME ok? | Module Worker | OffscreenCanvas | Result |
|-------------------------|--------------|-------------|----------------|---------------|-----------------|--------|
| iPhone 11 (iOS 17/18)   | Safari       |             |                |               |                 |        |
| iPhone X (iOS 15.x)     | Safari       |             |                |               |                 |        |
| iPad (iPadOS 16.3)      | Safari       |             |                |               |                 |        |
| macOS (Safari 17+)      | Safari       |             |                |               |                 |        |
| Android Pixel 7         | Chrome 126+  |             |                |               |                 | ✅     |
| Windows 11              | Edge 126+    |             |                |               |                 | ✅     |
| Windows 11              | Firefox 128+ |             |                |               |                 | ✅     |

> _Tip:_ Prioritize iOS **16.4+** and **15.x** to catch both sides of the module-worker/OffscreenCanvas divide.

---

## 7) Optional: Structured Logging to Catch Failures

```ts
function logWasmEvent(kind: string, detail: Record<string, any> = {}) {
  // Replace with your telemetry (Sentry, Posthog, homegrown)
  console.info('[WASM-EVENT]', kind, { ts: Date.now(), ...detail });
}

try {
  const m = await loadWasm('/vectorize_wasm_bg.wasm', {});
  logWasmEvent('wasm_loaded', { streaming: 'instantiateStreaming' in WebAssembly });
} catch (e: any) {
  logWasmEvent('wasm_load_error', { message: e?.message, name: e?.name });
}
```

Capture **userAgent**, **diag flags** (from §4), and the **network response headers** for the `.wasm` request.

---

## 8) “PR Skeleton” (What to include)

- `vercel.json` (headers for COOP/COEP and `.wasm` MIME).  
- `src/lib/wasm/loadWasm.ts` (robust loader).  
- `src/lib/workers/workerSupport.ts` + `spawnWasmWorker.ts` (feature detection + spawn helper).  
- Adjust build to emit **both** worker variants (module + classic).  
- Guarded OffscreenCanvas usage path.  
- Optional diagnostics route/component and logging hooks.

---

## 9) Notes Specific to SvelteKit + Vite

- Put static, fetchable assets (like `.wasm`) behind predictable URLs (e.g., `static/` or via adapter output) so your `vercel.json` `.wasm` header rule applies.  
- If you use SvelteKit CSP, ensure it doesn’t block WASM while debugging (`kit.csp` or HTTP headers).  
- Vite can build **classic workers** by providing a separate entry that avoids ESM imports and targeting an IIFE/UMD output; keep worker code minimal.

---

## 10) Quick “Why One iPhone 11 Works”

Likely that device runs **iOS 16.4+** (or 17/18), where module workers + OffscreenCanvas are supported—and/or it’s hitting a path that doesn’t require threads. Other devices/versions are missing either cross-origin isolation or those features, hence failure.

---

## 11) Success Criteria

- All iOS/iPadOS Safari versions ≥ **16.4** load and run the converter.  
- Older iOS gracefully falls back (no module workers; no OffscreenCanvas).  
- No CSP or Cloudflare feature silently strips headers or blocks WASM.  
- Diagnostics panel shows:
  - `crossOriginIsolated: true` (if you intend to use threads), or you avoid threads entirely.
  - `.wasm` requests with `Content-Type: application/wasm`.  
  - Worker path chosen matches device capabilities.

---

### Appendix: Minimal User Instructions (to collect debug info)

1. Open the site on your iPhone/iPad.  
2. Tap the **Diagnostics** toggle (or open `/debug`).  
3. Screenshot the console table (or copy JSON).  
4. Share iOS version (Settings → General → About).  
