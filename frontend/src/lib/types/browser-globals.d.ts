/**
 * Browser Global Type Definitions
 *
 * Ensures all browser APIs and DOM globals are properly typed
 * across the entire frontend codebase.
 */

/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="webworker" />

declare global {
	// Ensure browser globals are available
	const window: Window & typeof globalThis;
	const document: Document;
	const navigator: Navigator;
	const location: Location;
	const history: History;
	const localStorage: Storage;
	const sessionStorage: Storage;
	const console: Console;
	const fetch: typeof globalThis.fetch;

	// Canvas and Image APIs
	const Image: typeof globalThis.Image;
	const ImageData: typeof globalThis.ImageData;
	const CanvasRenderingContext2D: typeof globalThis.CanvasRenderingContext2D;
	const HTMLCanvasElement: typeof globalThis.HTMLCanvasElement;

	// File and Blob APIs
	const File: typeof globalThis.File;
	const Blob: typeof globalThis.Blob;
	const FileReader: typeof globalThis.FileReader;
	const FormData: typeof globalThis.FormData;
	const URLSearchParams: typeof globalThis.URLSearchParams;

	// Events
	const Event: typeof globalThis.Event;
	const CustomEvent: typeof globalThis.CustomEvent;
	const MouseEvent: typeof globalThis.MouseEvent;
	const KeyboardEvent: typeof globalThis.KeyboardEvent;
	const DragEvent: typeof globalThis.DragEvent;
	const ProgressEvent: typeof globalThis.ProgressEvent;

	// Web APIs
	const requestAnimationFrame: typeof globalThis.requestAnimationFrame;
	const cancelAnimationFrame: typeof globalThis.cancelAnimationFrame;
	const setTimeout: typeof globalThis.setTimeout;
	const clearTimeout: typeof globalThis.clearTimeout;
	const setInterval: typeof globalThis.setInterval;
	const clearInterval: typeof globalThis.clearInterval;

	// Performance APIs
	const performance: Performance;
	const PerformanceNavigationTiming: typeof globalThis.PerformanceNavigationTiming;
	const PerformanceObserver: typeof globalThis.PerformanceObserver;

	// Modern Web APIs
	const requestIdleCallback: typeof globalThis.requestIdleCallback;
	const cancelIdleCallback: typeof globalThis.cancelIdleCallback;
	const screen: Screen;

	// Worker APIs
	const Worker: typeof globalThis.Worker;
	const SharedWorker: typeof globalThis.SharedWorker;
	const MessageChannel: typeof globalThis.MessageChannel;

	// URL and Object URL APIs
	const URL: typeof globalThis.URL;

	// DOM Node types
	const Node: typeof globalThis.Node;
	const Element: typeof globalThis.Element;
	const HTMLElement: typeof globalThis.HTMLElement;
	const HTMLImageElement: typeof globalThis.HTMLImageElement;
	const HTMLInputElement: typeof globalThis.HTMLInputElement;
	const HTMLTextAreaElement: typeof globalThis.HTMLTextAreaElement;
	const HTMLSelectElement: typeof globalThis.HTMLSelectElement;
	const HTMLButtonElement: typeof globalThis.HTMLButtonElement;
	const HTMLFormElement: typeof globalThis.HTMLFormElement;

	// Extended Window interface for custom properties
	interface Window {
		// Performance monitoring
		__VEC2ART_PERFORMANCE_MONITOR__?: any;

		// Development tools
		__VEC2ART_DEV_TOOLS__?: any;

		// Analytics
		gtag?: (...args: any[]) => void;
		dataLayer?: any[];

		// Error tracking
		__VEC2ART_ERROR_TRACKER__?: any;

		// WASM loading state
		__WASM_LOADING__?: boolean;
		__WASM_READY__?: boolean;

		// Testing utilities
		__VEC2ART_TEST_UTILS__?: any;
	}

	// Extend Navigator for GPU and other modern APIs
	interface Navigator {
		gpu?: GPU;
		deviceMemory?: number;
		hardwareConcurrency: number;
		userAgentData?: {
			brands: Array<{ brand: string; version: string }>;
			mobile: boolean;
			platform: string;
		};
	}

	// Extend HTMLElement for Svelte actions
	interface HTMLElement {
		// Svelte action return types
		__svelte_action__?: {
			destroy?: () => void;
			update?: (params?: any) => void;
		};
	}

	// Event handler types
	type EventHandler<T = Event> = (event: T) => void | Promise<void>;
	type MouseEventHandler = EventHandler<MouseEvent>;
	type KeyboardEventHandler = EventHandler<KeyboardEvent>;
	type DragEventHandler = EventHandler<DragEvent>;
	type ChangeEventHandler = EventHandler<
		Event & { target: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement }
	>;

	// File drag and drop types
	interface DragEvent {
		dataTransfer: DataTransfer | null;
	}

	interface DataTransfer {
		files: FileList;
		items: DataTransferItemList;
		types: readonly string[];
		getData(format: string): string;
		setData(format: string, data: string): void;
	}

	interface DataTransferItem {
		kind: string;
		type: string;
		getAsFile(): File | null;
		getAsString(callback: (data: string) => void): void;
	}

	interface DataTransferItemList {
		readonly length: number;
		[index: number]: DataTransferItem;
		add(data: string, type?: string): DataTransferItem | null;
		add(data: File): DataTransferItem | null;
		remove(index: number): void;
		clear(): void;
	}

	// Canvas types for image processing
	interface CanvasImageSource {
		// Union of all possible canvas image sources
	}

	// Blob constructor for file downloads
	interface BlobPropertyBag {
		type?: string;
		endings?: 'transparent' | 'native';
	}

	// File system types
	interface FileSystemFileHandle {
		getFile(): Promise<File>;
		createWritable(): Promise<FileSystemWritableFileStream>;
	}

	interface FileSystemWritableFileStream {
		write(data: BufferSource | Blob | string): Promise<void>;
		close(): Promise<void>;
	}

	// Web Worker global types
	interface WorkerGlobalScope {
		postMessage(message: any, transfer?: Transferable[]): void;
		onmessage: ((this: WorkerGlobalScope, ev: MessageEvent) => any) | null;
		onerror: ((this: WorkerGlobalScope, ev: ErrorEvent) => any) | null;
		onmessageerror: ((this: WorkerGlobalScope, ev: MessageEvent) => any) | null;
	}

	// Idle callback types
	interface IdleDeadline {
		didTimeout: boolean;
		timeRemaining(): number;
	}

	type IdleRequestCallback = (deadline: IdleDeadline) => void;

	function requestIdleCallback(callback: IdleRequestCallback, options?: IdleRequestOptions): number;
	function cancelIdleCallback(handle: number): void;

	interface IdleRequestOptions {
		timeout?: number;
	}
}

// Type utilities for better type safety
export type Awaitable<T> = T | Promise<T>;
export type MaybePromise<T> = T | Promise<T>;
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type MaybeNull<T> = T | null | undefined;

// Event utilities
export type ExtractEventTarget<T> = T extends Event ? T['target'] : never;
export type ExtractEventDetail<T> = T extends CustomEvent<infer U> ? U : never;

// File utilities
export type AcceptedImageTypes =
	| 'image/png'
	| 'image/jpeg'
	| 'image/jpg'
	| 'image/webp'
	| 'image/gif'
	| 'image/bmp'
	| 'image/svg+xml';
export type FileExtension = `.${string}`;
export type MimeType = `${string}/${string}`;

export {};
