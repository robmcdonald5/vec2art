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
