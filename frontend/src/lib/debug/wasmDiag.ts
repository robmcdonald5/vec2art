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
