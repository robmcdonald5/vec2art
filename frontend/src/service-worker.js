/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

// PROPER LONG-TERM FIX v3.0 - Smart ServiceWorker with reduced scope
// Only caches truly static assets, lets SvelteKit handle dynamic builds
// Auto-update system with intelligent version checking
// Build timestamp: 2025-01-14

import { build, files, version } from '$service-worker';

const sw = /** @type {ServiceWorkerGlobalScope} */ (/** @type {unknown} */ (self));

// Early exit for development environment to prevent import errors
if (typeof location !== 'undefined' && location.hostname === 'localhost') {
	console.log('[SW] Development mode detected, service worker disabled');
}

// SMART VERSIONED CACHING v3.0 - Automatic cache invalidation
const SW_VERSION = '3.1.0'; // FORCE CACHE BUST - Updated to ensure Vercel serves new SW
const VERSION_HASH = `${version}-${SW_VERSION}`; // Combined SvelteKit + SW version

const ASSETS_CACHE = `vec2art-assets-v${VERSION_HASH}`;
const RUNTIME_CACHE = `vec2art-runtime-v${VERSION_HASH}`;
const IMAGE_CACHE = `vec2art-images-v1`; // Persistent across versions - user content
const WASM_CACHE = `vec2art-wasm-v${VERSION_HASH}`; // Auto-invalidate WASM on updates

console.log(`[SW] v${SW_VERSION} initializing with version hash: ${VERSION_HASH}`);

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

			// Smart activation - immediate for critical fixes, controlled otherwise
			await sw.skipWaiting();

			console.log(`[SW] v${SW_VERSION} installed successfully with hash: ${VERSION_HASH}`);
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
						// AGGRESSIVE v3.1: Force delete ALL old caches except current VERSION_HASH
						// This fixes Vercel deployment staleness by ensuring complete cache refresh
						return (
							name.startsWith('vec2art-') && !name.includes(VERSION_HASH) && name !== IMAGE_CACHE // Only preserve user images
						);
					})
					.map((name) => {
						console.log(`[SW] Deleting old cache: ${name}`);
						return caches.delete(name);
					})
			);

			// CRITICAL: Take control of all clients immediately to apply worker fix
			await sw.clients.claim();

			console.log(
				`[SW] v${SW_VERSION} VERCEL DEPLOYMENT FIX: ServiceWorker activated and claimed all clients`
			);

			// Notify all clients that the v3.1 fix is active
			const clients = await sw.clients.matchAll();
			clients.forEach((client) => {
				client.postMessage({
					type: 'SW_CRITICAL_UPDATE_ACTIVE',
					version: SW_VERSION,
					fix: 'ServiceWorker v3.1 - Vercel cache refresh and worker loading fix applied'
				});
			});
		})()
	);
});

// SMART FETCH HANDLER - Reduced scope, let SvelteKit handle dynamic assets
sw.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);

	// Skip non-GET requests
	if (event.request.method !== 'GET') return;

	// Skip cross-origin requests
	if (url.origin !== location.origin) return;

	// CRITICAL: Let SvelteKit handle its own build assets (/_app/immutable/*)
	// This prevents ServiceWorker interference with dynamic builds like workers
	if (url.pathname.startsWith('/_app/immutable/')) {
		console.log(`[SW] Bypassing SvelteKit build asset: ${url.pathname}`);
		return; // Let browser handle directly with SvelteKit's caching
	}

	// Handle only specific static resources that benefit from SW caching
	if (url.pathname.startsWith('/wasm/') && !url.pathname.includes('immutable')) {
		// Static WASM files only (not build artifacts)
		event.respondWith(handleWASM(event.request));
	} else if (url.pathname.startsWith('/gallery/') || isImageRequest(url.pathname)) {
		// User images and gallery - cache first with network update
		event.respondWith(handleImages(event.request));
	} else if (url.pathname.startsWith('/api/')) {
		// API requests - network first, cache fallback for offline
		event.respondWith(handleAPI(event.request));
	} else if (STATIC_ASSETS.includes(url.pathname)) {
		// Only truly static assets from files array
		event.respondWith(handleStatic(event.request));
	}
	// Everything else: Let browser handle naturally (no SW interference)
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

	// NEW v3.1: AGGRESSIVE VERCEL CACHE CLEARING for deployment staleness
	if (event.data?.type === 'FORCE_VERCEL_CACHE_REFRESH') {
		event.waitUntil(
			(async () => {
				console.log('[SW] v3.1 FORCE clearing ALL caches for Vercel deployment refresh');

				// Nuclear option: Delete ALL vec2art caches except user images
				const cacheNames = await caches.keys();
				const deletePromises = cacheNames
					.filter((name) => name.startsWith('vec2art-') && name !== IMAGE_CACHE)
					.map((name) => {
						console.log(`[SW] FORCE deleting cache: ${name}`);
						return caches.delete(name);
					});

				await Promise.all(deletePromises);
				console.log('[SW] v3.1 ALL caches cleared - forcing complete refresh');

				// Notify client that nuclear refresh is complete
				const clients = await sw.clients.matchAll();
				clients.forEach((client) => {
					client.postMessage({ type: 'VERCEL_CACHE_REFRESH_COMPLETE' });
				});
			})()
		);
	}
});
