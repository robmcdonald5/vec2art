/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

// CRITICAL UPDATE v2.1 - Forces browser to recognize ServiceWorker changes
// This version fixes ServiceWorker interference with SvelteKit workers
// Build timestamp: 2025-01-14

import { build, files, version } from '$service-worker';

const sw = /** @type {ServiceWorkerGlobalScope} */ (/** @type {unknown} */ (self));

// Early exit for development environment to prevent import errors
if (typeof location !== 'undefined' && location.hostname === 'localhost') {
	console.log('[SW] Development mode detected, service worker disabled');
}

// Create a unique cache name for this deployment
// CRITICAL: WASM cache now uses version to ensure iPhone users get latest fixes
const ASSETS_CACHE = `vec2art-assets-v${version}`;
const RUNTIME_CACHE = `vec2art-runtime-v${version}`;
const IMAGE_CACHE = `vec2art-images-v1`; // Persistent across versions
const WASM_CACHE = `vec2art-wasm-v${version}`; // FIXED: Now version-aware to prevent stale code

// Assets to cache
const STATIC_ASSETS = [
	...build, // All built assets
	...files // All static files
];

// Install event - cache all static assets
sw.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			// Cache all static assets
			const cache = await caches.open(ASSETS_CACHE);
			await cache.addAll(STATIC_ASSETS);

			// Cache critical WASM files
			const wasmCache = await caches.open(WASM_CACHE);
			const wasmFiles = [
				'/wasm/vectorize_wasm.js',
				'/wasm/vectorize_wasm_bg.wasm',
				'/wasm/__wbindgen_placeholder__.js'
			];

			// Try to cache WASM files, but don't fail if they're not available
			for (const file of wasmFiles) {
				try {
					await wasmCache.add(file);
				} catch (error) {
					console.warn(`Failed to cache WASM file ${file}:`, error);
				}
			}

			// CRITICAL: Force immediate activation to push worker fix to users
			await sw.skipWaiting();

			console.log(
				'[SW] v2.1 CRITICAL UPDATE: ServiceWorker worker fix installed - forcing activation'
			);
		})()
	);
});

// Activate event - clean up old caches
sw.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			// Delete old caches
			const cacheNames = await caches.keys();
			await Promise.all(
				cacheNames
					.filter((name) => {
						// Keep only image cache and current version caches
						// CRITICAL: Delete old WASM caches (including persistent v1) to ensure iPhone users get fixes
						return (
							name.startsWith('vec2art-') && !name.includes(version) && name !== IMAGE_CACHE
							// REMOVED: name !== WASM_CACHE - now WASM cache is versioned and old ones should be deleted
						);
					})
					.map((name) => {
						console.log(`[SW] Deleting old cache: ${name}`);
						return caches.delete(name);
					})
			);

			// CRITICAL: Take control of all clients immediately to apply worker fix
			await sw.clients.claim();

			console.log('[SW] v2.1 CRITICAL UPDATE: ServiceWorker activated and claimed all clients');

			// Notify all clients that the critical fix is active
			const clients = await sw.clients.matchAll();
			clients.forEach((client) => {
				client.postMessage({
					type: 'SW_CRITICAL_UPDATE_ACTIVE',
					version: '2.1',
					fix: 'ServiceWorker worker loading fix applied'
				});
			});
		})()
	);
});

// Fetch event - serve from cache when possible
sw.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);

	// Skip non-GET requests
	if (event.request.method !== 'GET') return;

	// Skip cross-origin requests (except for CDN resources)
	if (url.origin !== location.origin && !url.hostname.includes('vercel')) return;

	// Handle different types of resources
	if (url.pathname.startsWith('/wasm/')) {
		// WASM files - cache first, network fallback
		event.respondWith(handleWASM(event.request));
	} else if (url.pathname.includes('/workers/') || url.pathname.endsWith('.worker.js')) {
		// CRITICAL FIX: Handle SvelteKit worker files (including wasm-processor.worker-*.js)
		event.respondWith(handleWorkers(event.request));
	} else if (url.pathname.startsWith('/gallery/') || isImageRequest(url.pathname)) {
		// Images - cache first with network update
		event.respondWith(handleImages(event.request));
	} else if (url.pathname.startsWith('/api/')) {
		// API requests - network first, cache fallback
		event.respondWith(handleAPI(event.request));
	} else if (STATIC_ASSETS.includes(url.pathname)) {
		// Static assets - cache only
		event.respondWith(handleStatic(event.request));
	} else {
		// Everything else - stale while revalidate
		event.respondWith(handleDefault(event.request));
	}
});

// Handle WASM files - cache first strategy
async function handleWASM(/** @type {Request} */ request) {
	const cache = await caches.open(WASM_CACHE);
	const cached = await cache.match(request);

	if (cached) {
		return cached;
	}

	try {
		const response = await fetch(request);
		if (response.ok) {
			cache.put(request, response.clone());
		}
		return response;
	} catch (error) {
		console.error('Failed to fetch WASM file:', error);
		return new Response('WASM file not available', { status: 503 });
	}
}

// CRITICAL FIX: Handle SvelteKit worker files - network first, no caching for dynamic builds
async function handleWorkers(/** @type {Request} */ request) {
	try {
		// Workers should always be fresh to prevent stale code issues
		const response = await fetch(request, {
			cache: 'no-cache' // Force fresh fetch
		});

		if (response.ok) {
			console.log(`[SW] Successfully loaded worker: ${request.url}`);
			return response;
		} else {
			console.error(
				`[SW] Worker load failed: ${response.status} ${response.statusText} for ${request.url}`
			);
			return response;
		}
	} catch (error) {
		console.error(`[SW] Worker fetch error for ${request.url}:`, error);
		// Return a more descriptive error response
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		return new Response(
			`Worker load failed: ${errorMessage}. This may be due to ServiceWorker interference.`,
			{
				status: 503,
				statusText: 'Worker Load Failed'
			}
		);
	}
}

// Handle image requests - cache first with background update
async function handleImages(/** @type {Request} */ request) {
	const cache = await caches.open(IMAGE_CACHE);
	const cached = await cache.match(request);

	// Return cached version immediately if available
	if (cached) {
		// Update cache in background
		fetch(request)
			.then((response) => {
				if (response.ok) {
					cache.put(request, response);
				}
			})
			.catch(() => {
				// Ignore errors in background update
			});

		return cached;
	}

	// No cache, fetch from network
	try {
		const response = await fetch(request);
		if (response.ok) {
			cache.put(request, response.clone());
		}
		return response;
	} catch (err) {
		console.error('Image handling error:', err);
		return new Response('Image not available', { status: 503 });
	}
}

// Handle API requests - network first strategy
async function handleAPI(/** @type {Request} */ request) {
	const cache = await caches.open(RUNTIME_CACHE);

	try {
		const response = await fetch(request);
		if (response.ok) {
			// Cache successful API responses
			cache.put(request, response.clone());
		}
		return response;
	} catch (err) {
		console.error('API request error:', err);
		// Network failed, try cache
		const cached = await cache.match(request);
		if (cached) {
			return cached;
		}
		return new Response('API not available', { status: 503 });
	}
}

// Handle static assets - cache only
async function handleStatic(/** @type {Request} */ request) {
	const cache = await caches.open(ASSETS_CACHE);
	const cached = await cache.match(request);

	if (cached) {
		return cached;
	}

	// Should not happen as these are pre-cached
	return fetch(request);
}

// Handle default requests - stale while revalidate
async function handleDefault(/** @type {Request} */ request) {
	const cache = await caches.open(RUNTIME_CACHE);
	const cached = await cache.match(request);

	// Return cached version immediately if available
	if (cached) {
		// Update cache in background
		fetch(request)
			.then((response) => {
				if (response.ok) {
					cache.put(request, response);
				}
			})
			.catch(() => {
				// Ignore errors in background update
			});

		return cached;
	}

	// No cache, fetch from network
	try {
		const response = await fetch(request);
		if (response.ok) {
			cache.put(request, response.clone());
		}
		return response;
	} catch (err) {
		console.error('Resource fetch error:', err);
		return new Response('Resource not available', { status: 503 });
	}
}

// Helper function to check if a path is an image
function isImageRequest(/** @type {string} */ pathname) {
	const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg', '.ico'];
	return imageExtensions.some((ext) => pathname.toLowerCase().endsWith(ext));
}

// Listen for messages from the client
sw.addEventListener('message', (event) => {
	if (event.data?.type === 'SKIP_WAITING') {
		sw.skipWaiting();
	}

	if (event.data?.type === 'CLEAR_CACHE') {
		event.waitUntil(
			caches.keys().then((cacheNames) => {
				console.log('[SW] Clearing all caches for fresh start');
				return Promise.all(
					cacheNames
						.filter((name) => name.startsWith('vec2art-'))
						.map((name) => {
							console.log(`[SW] Force deleting cache: ${name}`);
							return caches.delete(name);
						})
				);
			})
		);
	}

	// CRITICAL: Force refresh for iPhone crash fixes
	if (event.data?.type === 'FORCE_REFRESH_CRITICAL') {
		event.waitUntil(
			(async () => {
				console.log('[SW] Force refreshing critical files for iPhone fix deployment');

				// Delete WASM and runtime caches to force fresh fetch
				await caches.delete(WASM_CACHE);
				await caches.delete(RUNTIME_CACHE);
				await caches.delete(ASSETS_CACHE);

				console.log('[SW] Critical caches cleared - fresh files will be fetched');

				// Notify client that refresh is complete
				const clients = await sw.clients.matchAll();
				clients.forEach((client) => {
					client.postMessage({ type: 'CRITICAL_REFRESH_COMPLETE' });
				});
			})()
		);
	}
});
