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
