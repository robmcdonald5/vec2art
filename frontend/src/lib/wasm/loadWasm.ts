// src/lib/wasm/loadWasm.ts
export async function loadWasm(
	url: string,
	wasmJs?: any
): Promise<WebAssembly.WebAssemblyInstantiatedSource> {
	// Create proper imports object if wasmJs module is provided
	const imports = wasmJs ? wasmJs.__wbindgen_wasm_module || {} : {};

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
