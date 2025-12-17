/**
 * TypeScript declarations for worker-load.js
 */

export interface WasmModule {
	WasmVectorizer: any;
	[key: string]: any;
}

export declare function initializeWasm(): Promise<WasmModule>;
