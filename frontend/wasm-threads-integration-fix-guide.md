# WASM Threads Integration — Fix Guide (Vite + SvelteKit + wasm-bindgen + Rayon)

This doc turns the analysis into a concrete, step‑by‑step plan to fix your multithreaded WASM setup.

> **TL;DR**
> 1) App is **not cross‑origin isolated** (no COOP/COEP) → `SharedArrayBuffer` disabled → **no WASM threads**.
> 2) Your wasm-bindgen output was built for **bundlers**, so the browser hits a **`__wbindgen_placeholder__` bare specifier** when loading directly. Build for **`web`** instead.
> 3) After loading, explicitly **call `initThreadPool(...)`** or Rayon stays single‑threaded.

---

## Symptoms

- Test page shows `crossOriginIsolated: false`, `sharedArrayBuffer: false`.
- HTTP headers panel: COOP/COEP not set.
- Console: **The specifier `__wbindgen_placeholder__` was a bare specifier...**

---

## Root Causes

1. **No cross‑origin isolation** → browser hides `SharedArrayBuffer` → threads unavailable.
2. **Bundler vs web target mismatch** → generated JS imports `__wbindgen_placeholder__`, which only bundlers rewrite.
3. **No Rayon init** → you must call `initThreadPool(n)` from JS after `init()`.

---

## Fix Steps

### A) Build the Rust crate for browsers (not bundlers)

**macOS / Linux**
```bash
cd wasm/vectorize-wasm
cargo clean
export RUSTFLAGS='-C target-feature=+atomics,+bulk-memory,+mutable-globals'
wasm-pack build --release --target web
```

**Windows (PowerShell)**
```powershell
cd wasm\vectorize-wasm
cargo clean
$env:RUSTFLAGS='-C target-feature=+atomics,+bulk-memory,+mutable-globals'
wasm-pack build --release --target web
```

Copy artifacts where the frontend expects them (pick one canonical place to avoid stale copies):
```bash
# from wasm/vectorize-wasm
cp -v pkg/* ../../frontend/static/wasm/
```

> Why: `--target web` emits ESM that loads `*_bg.wasm` via `new URL(..., import.meta.url)` and does **not** use the bundler-only placeholder.

### B) Enable COOP/COEP so the page is cross-origin isolated

**`frontend/vite.config.ts`**
```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  server: { headers: { 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp' } },
  preview:{ headers: { 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp' } },
  assetsInclude: ['**/*.wasm']
});
```

**`frontend/src/hooks.server.ts`** (ensures headers in prod)
```ts
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event, { filterSerializedResponseHeaders: (n) => n === 'content-type' });
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  return response;
};
```

Check in console:
```js
window.crossOriginIsolated === true
typeof SharedArrayBuffer === 'function'
```

> Note: With COEP `require-corp`, third‑party fonts/images/iframes need proper CORS/CORP or must be same‑origin.

### C) Initialize Rayon’s thread pool from JS

**`frontend/src/lib/wasm/init.ts`**
```ts
export async function initWasm() {
  const { threads } = await import('wasm-feature-detect');
  const init = (await import('/wasm/vectorize_wasm.js')).default as any;
  const { initThreadPool } = await import('/wasm/vectorize_wasm.js');
  await init(new URL('/wasm/vectorize_wasm_bg.wasm', import.meta.url));
  if ((await threads()) && (globalThis as any).crossOriginIsolated) {
    await initThreadPool(navigator.hardwareConcurrency ?? 4);
  }
}
```

### D) Update your static tester to use the `web` build

**`frontend/static/wasm-comprehensive-test.html`**
```html
<!doctype html>
<meta charset="utf-8" />
<title>Comprehensive WASM Test</title>
<script type="module">
  console.log('crossOriginIsolated:', crossOriginIsolated);
  console.log('SharedArrayBuffer:', typeof SharedArrayBuffer !== 'undefined');
  import init, { initThreadPool } from '/wasm/vectorize_wasm.js';
  try {
    await init(new URL('/wasm/vectorize_wasm_bg.wasm', import.meta.url));
    if (crossOriginIsolated) {
      await initThreadPool(navigator.hardwareConcurrency ?? 4);
      console.log('Thread pool initialized');
    } else {
      console.warn('Not cross-origin isolated; running single-threaded');
    }
  } catch (e) { console.error('WASM load failed:', e); }
</script>
```

---

## Verification Checklist

- [ ] `window.crossOriginIsolated === true`
- [ ] `SharedArrayBuffer` exists in the console
- [ ] No `__wbindgen_placeholder__` error in the console
- [ ] CPU usage spreads across cores during heavy compute
- [ ] `initThreadPool` resolves without throwing

---

## Common Gotchas

- **Assets blocked under COEP:** host fonts/images locally or add CORS/CORP.
- **Multiple copies of `pkg/`:** keep one canonical location (e.g., `/static/wasm/`).
- **Workers:** create with `new URL('./worker.ts', import.meta.url)` and `{ type: 'module' }` so Vite resolves paths and headers apply.
- **Fallback:** optionally ship a single‑threaded path for non‑isolated contexts.

---

## Optional: scripts

**`package.json`**
```json
{
  "scripts": {
    "wasm:build": "cd wasm/vectorize-wasm && cross-env RUSTFLAGS=\"-C target-feature=+atomics,+bulk-memory,+mutable-globals\" wasm-pack build --release --target web && cpy wasm/vectorize-wasm/pkg/* ../frontend/static/wasm/",
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

**Minimal Rayon test (Rust)**
```rust
use wasm_bindgen::prelude::*;
use rayon::prelude::*;

#[wasm_bindgen]
pub fn sum_parallel(n: u32) -> u64 {
    (0..n as u64).into_par_iter().sum::<u64>()
}
```

**Minimal TS usage**
```ts
import init, { initThreadPool, sum_parallel } from '/wasm/vectorize_wasm.js';
await init(new URL('/wasm/vectorize_wasm_bg.wasm', import.meta.url));
if (crossOriginIsolated) {
  await initThreadPool(navigator.hardwareConcurrency ?? 4);
}
console.time('sum');
console.log(sum_parallel(200_000_000));
console.timeEnd('sum');
```
