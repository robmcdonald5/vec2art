/**
 * Service Worker Client Utilities
 * Provides methods to interact with the service worker for cache management
 * CRITICAL: Used to ensure iPhone users receive latest fixes by forcing cache refresh
 */

import { browser } from '$app/environment';

export interface ServiceWorkerClient {
	isSupported(): boolean;
	isRegistered(): boolean;
	clearCache(): Promise<void>;
	forceCriticalRefresh(): Promise<void>;
	skipWaiting(): Promise<void>;
}

class ServiceWorkerClientImpl implements ServiceWorkerClient {
	private registration: ServiceWorkerRegistration | null = null;

	constructor() {
		this.initializeRegistration();
	}

	private async initializeRegistration(): Promise<void> {
		if (!browser) return;

		try {
			if ('serviceWorker' in navigator) {
				this.registration = await navigator.serviceWorker.ready;
			}
		} catch (error) {
			console.warn('[SW Client] Failed to get service worker registration:', error);
		}
	}

	/**
	 * Check if service workers are supported in this browser
	 */
	public isSupported(): boolean {
		return browser && 'serviceWorker' in navigator;
	}

	/**
	 * Check if a service worker is currently registered
	 */
	public isRegistered(): boolean {
		return this.registration !== null;
	}

	/**
	 * Clear all caches - useful for debugging
	 */
	public async clearCache(): Promise<void> {
		if (!this.isSupported()) {
			console.warn('[SW Client] Service workers not supported');
			return;
		}

		await this.ensureRegistration();

		if (this.registration?.active) {
			console.log('[SW Client] Clearing all caches');
			this.registration.active.postMessage({ type: 'CLEAR_CACHE' });
		}
	}

	/**
	 * CRITICAL: Force refresh of critical files (WASM, JS) to ensure iPhone users get fixes
	 * This should be called when we detect iPhone users might have stale code
	 */
	public async forceCriticalRefresh(): Promise<void> {
		if (!this.isSupported()) {
			console.warn('[SW Client] Service workers not supported');
			return;
		}

		await this.ensureRegistration();

		if (this.registration?.active) {
			console.log('[SW Client] 🚨 Forcing critical file refresh for iPhone fix deployment');

			// Set up listener for completion
			const refreshPromise = new Promise<void>((resolve) => {
				const messageHandler = (event: MessageEvent) => {
					if (event.data?.type === 'CRITICAL_REFRESH_COMPLETE') {
						console.log('[SW Client] ✅ Critical refresh completed');
						navigator.serviceWorker.removeEventListener('message', messageHandler);
						resolve();
					}
				};

				navigator.serviceWorker.addEventListener('message', messageHandler);

				// Timeout after 10 seconds
				setTimeout(() => {
					console.warn('[SW Client] Critical refresh timeout');
					navigator.serviceWorker.removeEventListener('message', messageHandler);
					resolve();
				}, 10000);
			});

			// Send the refresh message
			this.registration.active.postMessage({ type: 'FORCE_REFRESH_CRITICAL' });

			// Wait for completion
			await refreshPromise;
		}
	}

	/**
	 * Skip waiting and activate new service worker immediately
	 */
	public async skipWaiting(): Promise<void> {
		if (!this.isSupported()) {
			console.warn('[SW Client] Service workers not supported');
			return;
		}

		await this.ensureRegistration();

		if (this.registration?.waiting) {
			console.log('[SW Client] Activating new service worker');
			this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
		}
	}

	private async ensureRegistration(): Promise<void> {
		if (!this.registration && this.isSupported()) {
			await this.initializeRegistration();
		}
	}
}

// Singleton instance
const serviceWorkerClient = new ServiceWorkerClientImpl();

export { serviceWorkerClient };

// Convenience functions
export function clearServiceWorkerCache(): Promise<void> {
	return serviceWorkerClient.clearCache();
}

export function forceCriticalRefresh(): Promise<void> {
	return serviceWorkerClient.forceCriticalRefresh();
}

export function isServiceWorkerSupported(): boolean {
	return serviceWorkerClient.isSupported();
}

/**
 * CRITICAL FUNCTION: Detect and fix iPhone cache issues
 * This function should be called on app startup to ensure iPhone users get the latest fixes
 */
export async function detectAndFixiPhoneCacheIssues(): Promise<void> {
	if (!browser) return;

	// Detect iOS Safari
	const isIOSSafari =
		/iPad|iPhone|iPod/.test(navigator.userAgent) &&
		/^((?!chrome|android).)*safari/i.test(navigator.userAgent);

	if (isIOSSafari) {
		console.log('[SW Client] 📱 iOS Safari detected - checking for cache issues');

		// Check if this might be a user with stale cached code
		// We can detect this by checking for the threading architecture fix
		try {
			// Try to check if we have the old broken code
			const hasOldCode = localStorage.getItem('vec2art-had-threading-crash') === 'true';

			if (hasOldCode) {
				console.log('[SW Client] 🚨 Detected potential stale code on iPhone - forcing refresh');
				await forceCriticalRefresh();

				// Clear the flag after forcing refresh
				localStorage.setItem('vec2art-had-threading-crash', 'false');
			}
		} catch (error) {
			console.warn('[SW Client] Could not check cache issues:', error);
		}
	}
}

/**
 * Mark that a threading crash occurred (to detect stale code later)
 */
export function markThreadingCrash(): void {
	if (browser) {
		localStorage.setItem('vec2art-had-threading-crash', 'true');
	}
}
