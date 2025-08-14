# Rust + WASM (SvelteKit/Vite) — Fixing `LinkError: import object field '__wbindgen_describe' is not a Function` and Enabling Threads

This guide turns the previous troubleshooting notes into a single, copy‑pasteable reference. It explains why your module fails to link, how to fix the wasm‑bindgen wiring in SvelteKit/Vite, and how to enable Rayon threads **after** the link error is resolved.

---

## Symptoms (from your logs)

```
[WASM] Initializing module... 
Failed to get subsystem status for purpose 
Object { rejected: true, message: "UNSUPPORTED_OS" }
[WASM] Failed to initialize: LinkError: import object field '__wbindgen_describe' is not a Function
Vectorizer error: { type: "unknown", message: "Failed to initialize vectorizer", details: "[object Object]" }
Failed to initialize vectorizer: { type: "unknown", message: "Failed to initialize WASM module", details: "import object field '__wbindgen_describe' is not a Function" }
```

- The **fatal** error is the `LinkError ... '__wbindgen_describe' is not a Function` line.
- The `UNSUPPORTED_OS` line is most likely a **browser extension content‑script** complaining and is unrelated to the wasm failure.

---

## Root Cause (why this happens)

Your `.wasm` binary is being instantiated **without** the JavaScript glue that `wasm-bindgen` generates. That glue defines the `__wbindgen_*` imports (such as `__wbindgen_describe`). If you:
- directly call `WebAssembly.instantiate*` on the raw `.wasm`, **or**
- use a generic bundler WASM plugin that auto-instantiates the raw `.wasm`, **or**
- mix incompatible versions of the `wasm-bindgen` crate and CLI,

then the required JS shim never runs and the linker can’t find `__wbindgen_describe`.

**Bottom line:** you must import and run the **generated wasm‑bindgen JS module** and let its default `init` function wire everything up before you call any exported Rust functions.

---

## What to Change (quick list)

1) **Build for the browser with wasm‑pack**  
   Use `--target web` so you get an **ESM** module and its associated glue:
   ```bash
   wasm-pack build --release --target web --out-dir ../../frontend/src/lib/wasm/pkg
   ```

2) **Import the generated JS module (not the .wasm) and call its default `init`**  
   This is what provides `__wbindgen_*` functions at link time.

3) **Client‑only init in SvelteKit**  
   Only initialize in the browser (e.g., inside `onMount`). Avoid SSR import of WASM glue.

4) **Pass a resolvable WASM URL to `init`**  
   With bundlers, use `new URL('./pkg/your_bg.wasm', import.meta.url)`.

5) **Remove auto‑instantiate WASM plugins for this crate**  
   Those bypass the wasm‑bindgen shim and recreate the error.

6) **Pin matching `wasm-bindgen` versions**  
   Ensure the crate version in `Cargo.lock` matches the CLI/wasm‑pack version you’re using.

7) *(Later, for threading)* **Enable cross‑origin isolation** & rebuild `std` with atomics.  
   Do this **after** the link error is fixed (see “After it links: enabling Rayon threads”).

---

## Drop‑in Patch (minimal working pieces)

### 1) Build command
From your Rust crate (adjust paths as needed):
```bash
cd wasm/vectorize-wasm
wasm-pack build --release --target web --out-dir ../../frontend/src/lib/wasm/pkg
```

This emits three key files into `frontend/src/lib/wasm/pkg/`:
- `vectorize_wasm.js` (ESM entry; re‑exported bindings)
- `vectorize_wasm_bg.wasm` (the binary)
- `vectorize_wasm_bg.wasm.d.ts` (if TypeScript types are enabled)

### 2) Client‑side loader (`frontend/src/lib/wasm/loader.ts`)
```ts
import { browser } from '$app/environment';

// NOTE: Adjust the import path if your output directory differs.
const wasmJs = () => import('./pkg/vectorize_wasm.js');

let ready: Promise<any> | null = null;

export async function loadVectorizer() {
  if (!browser) throw new Error('WASM must load in the browser');
  if (!ready) {
    ready = (async () => {
      const mod = await wasmJs();
      // IMPORTANT: call the default export to initialize the wasm-bindgen glue
      await mod.default(new URL('./pkg/vectorize_wasm_bg.wasm', import.meta.url));
      return mod;
    })();
  }
  return ready;
}
```

### 3) Use it from Svelte (client only), e.g. in a page component
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { loadVectorizer } from '$lib/wasm/loader';

  let status = 'loading...';
  let error: string | null = null;

  onMount(async () => {
    try {
      const wasm = await loadVectorizer();
      // Example: call an exported function now that the module is initialized
      // const result = wasm.some_export(...);
      status = 'wasm ready';
    } catch (e) {
      error = (e as Error).message;
      status = 'failed';
    }
  });
</script>

{#if error}
  <p class="text-red-500">Error: {error}</p>
{:else}
  <p>{status}</p>
{/if}
```

### 4) (Optional) Vite dev headers for future threading
If you’ll use Rayon/web threads later, set cross‑origin isolation headers in dev so `SharedArrayBuffer` is available:
```ts
// vite.config.ts
import { defineConfig } from "vite";
// You can also use a plugin like vite-plugin-cross-origin-isolation
export default defineConfig({
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      // Use one of the two COEP options below:
      "Cross-Origin-Embedder-Policy": "require-corp"
      // or: "Cross-Origin-Embedder-Policy": "credentialless"
    }
  }
});
```

### 5) Remove conflicting WASM plugins
If you had a Vite/Svelte plugin that auto-instantiates `.wasm`, disable it for this crate. The wasm-bindgen JS module should control loading/initialization.

### 6) Keep versions aligned
- Update `wasm-bindgen` crate in `Cargo.toml` and `Cargo.lock`.
- Ensure your installed `wasm-bindgen-cli`/`wasm-pack` matches that version.

---

## After it links: enabling Rayon threads (Step Two)

Once the link error is gone and your exports run on the main thread, you can enable multithreading:

1) **Cross‑origin isolation**  
   Your page must return these headers so `window.crossOriginIsolated === true`:
   - `Cross-Origin-Opener-Policy: same-origin`
   - `Cross-Origin-Embedder-Policy: require-corp` **or** `credentialless`

2) **Rebuild `std` with atomics for wasm32 (usually nightly toolchain)**  
   Example `.cargo/config.toml`:
   ```toml
   [build]
   target = "wasm32-unknown-unknown"

   [unstable]
   build-std = ["std", "panic_abort"]

   [target.wasm32-unknown-unknown]
   rustflags = [
     "-C", "target-feature=+atomics,+bulk-memory,+mutable-globals"
   ]
   ```

3) **Initialize the Rayon pool once, early**  
   Example `Cargo.toml` and `lib.rs` snippets:

   `Cargo.toml`
   ```toml
   [package]
   name = "rayon_wasm_demo"
   version = "0.1.0"
   edition = "2021"

   [lib]
   crate-type = ["cdylib"]

   [dependencies]
   wasm-bindgen = "0.2"
   rayon = "1.10"
   wasm-bindgen-rayon = "1.2"

   [profile.release]
   opt-level = "s"
   ```

   `src/lib.rs`
   ```rust
   use wasm_bindgen::prelude::*;
   use rayon::prelude::*;

   #[wasm_bindgen(start)]
   pub async fn start() {
       // Initialize the thread pool before any Rayon use
       wasm_bindgen_rayon::init_thread_pool(
           std::cmp::max(1, js_sys::global().unchecked_into::<web_sys::WorkerNavigator>().hardware_concurrency() as usize)
       ).await.unwrap();
   }

   #[wasm_bindgen]
   pub fn sum_squares(n: u32) -> u64 {
       (0..n as u64).into_par_iter().map(|x| x * x).sum()
   }
   ```

4) **Bindgen output for the web target**  
   When you run `wasm-bindgen` directly, use `--target web` (or keep using `wasm-pack build --target web`).

5) **Verify SAB availability**  
   Open DevTools console and confirm:
   ```js
   window.crossOriginIsolated === true
   ```
   If `false`, your headers are not set correctly yet.

---

## Five‑Minute Sanity Checks

- **Check the page isolation:** `window.crossOriginIsolated` must be `true` for threads; otherwise Rayon will fail to initialize.
- **Check the build flags:** ensure `+atomics,+bulk-memory,+mutable-globals` are present and you’re rebuilding `std` for `wasm32-unknown-unknown` when enabling threads.
- **Ensure glue is called:** your app should import the generated `vectorize_wasm.js` and call its default export with a resolvable WASM URL **before** using any exports.

---

## Appendix: Minimal Flow Summary

1. Build your crate with wasm‑pack and `--target web` → get ESM JS + `.wasm`.
2. In SvelteKit, `import()` the generated JS **on the client** and `await mod.default(url)`.
3. Use exported functions normally.
4. (Optional for threads) Add COOP/COEP headers, rebuild `std` with atomics, and call `wasm_bindgen_rayon::init_thread_pool()` once at startup.

---

**Note on the `UNSUPPORTED_OS` log:** It’s almost certainly from a separate extension content‑script and not relevant to the wasm linking failure. Focus on the `__wbindgen_describe` error first.
