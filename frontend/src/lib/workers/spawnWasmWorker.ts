// src/lib/workers/spawnWasmWorker.ts
import { supportsModuleWorkers } from './workerSupport';

// IMPORTANT: provide both bundles at build time
// - /workers/wasm-processor.worker.js (module)
// - /workers/wasm-processor.legacy.js (classic)

export function spawnWasmWorker(): Worker {
	if (supportsModuleWorkers()) {
		return new Worker(new URL('/workers/wasm-processor.worker.js', import.meta.url), {
			type: 'module'
		});
	}
	// Classic worker (no "type: module")
	return new Worker(new URL('/workers/wasm-processor.legacy.js', import.meta.url));
}
