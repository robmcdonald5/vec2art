/**
 * ServiceWorker Update Manager v3.0 - Proper Long-term Solution
 *
 * This replaces the aggressive update mechanisms with a smart, user-friendly system:
 * - Automatic update detection every 2 hours or on focus
 * - Smart activation timing (waits for user interaction)
 * - User notification system for available updates
 * - Graceful fallbacks for non-SW browsers
 *
 * PREVENTS: ServiceWorker interference with SvelteKit build assets
 * ENSURES: Critical fixes reach users within hours, not days
 */

import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export interface ServiceWorkerUpdateState {
	supported: boolean;
	registered: boolean;
	updateAvailable: boolean;
	installing: boolean;
	lastChecked: Date | null;
	version: string | null;
}

// Reactive store for update state
export const swUpdateState = writable<ServiceWorkerUpdateState>({
	supported: false,
	registered: false,
	updateAvailable: false,
	installing: false,
	lastChecked: null,
	version: null
});

class ServiceWorkerUpdateManager {
	private registration: ServiceWorkerRegistration | null = null;
	private updateCheckInterval: number | null = null;
	private isVisible = true;

	constructor() {
		if (browser) {
			this.initialize();
			this.setupVisibilityHandler();
		}
	}

	/**
	 * Initialize ServiceWorker registration and update checking
	 */
	private async initialize(): Promise<void> {
		if (!('serviceWorker' in navigator)) {
			console.log('[SW Update] ServiceWorker not supported');
			swUpdateState.update((state) => ({ ...state, supported: false }));
			return;
		}

		try {
			console.log('[SW Update] Initializing ServiceWorker update manager v3.0');

			// Register ServiceWorker
			this.registration = await navigator.serviceWorker.register('/service-worker.js', {
				updateViaCache: 'none' // Always check for updates
			});

			swUpdateState.update((state) => ({
				...state,
				supported: true,
				registered: true
			}));

			// Set up update event listeners
			this.setupUpdateListeners();

			// Initial update check
			await this.checkForUpdates();

			// Set up periodic update checks (every 2 hours)
			this.updateCheckInterval = window.setInterval(
				() => this.checkForUpdates(),
				2 * 60 * 60 * 1000
			);

			console.log('[SW Update] Update manager initialized successfully');
		} catch (error) {
			console.error('[SW Update] Failed to initialize:', error);
			swUpdateState.update((state) => ({ ...state, supported: false }));
		}
	}

	/**
	 * Set up ServiceWorker update event listeners
	 */
	private setupUpdateListeners(): void {
		if (!this.registration) return;

		// Listen for new ServiceWorker installing
		this.registration.addEventListener('updatefound', () => {
			console.log('[SW Update] New ServiceWorker found, installing...');

			swUpdateState.update((state) => ({ ...state, installing: true }));

			const installingWorker = this.registration!.installing;
			if (installingWorker) {
				installingWorker.addEventListener('statechange', () => {
					if (installingWorker.state === 'installed') {
						if (navigator.serviceWorker.controller) {
							// New version available
							console.log('[SW Update] New version ready to activate');
							swUpdateState.update((state) => ({
								...state,
								updateAvailable: true,
								installing: false
							}));

							// Notify user about available update
							this.notifyUpdateAvailable();
						} else {
							// First time install
							console.log('[SW Update] ServiceWorker installed for first time');
							swUpdateState.update((state) => ({ ...state, installing: false }));
						}
					}
				});
			}
		});

		// Listen for messages from ServiceWorker
		navigator.serviceWorker.addEventListener('message', (event) => {
			if (event.data?.type === 'SW_CRITICAL_UPDATE_ACTIVE') {
				console.log('[SW Update] Critical update activated:', event.data);
				swUpdateState.update((state) => ({
					...state,
					version: event.data.version,
					updateAvailable: false
				}));
			}
		});
	}

	/**
	 * Handle page visibility changes to check for updates when user returns
	 */
	private setupVisibilityHandler(): void {
		document.addEventListener('visibilitychange', () => {
			const wasVisible = this.isVisible;
			this.isVisible = !document.hidden;

			// Check for updates when page becomes visible again
			if (!wasVisible && this.isVisible) {
				console.log('[SW Update] Page became visible, checking for updates');
				this.checkForUpdates();
			}
		});
	}

	/**
	 * Manually check for ServiceWorker updates
	 */
	public async checkForUpdates(): Promise<void> {
		if (!this.registration) {
			console.warn('[SW Update] No registration available for update check');
			return;
		}

		try {
			console.log('[SW Update] Checking for updates...');

			await this.registration.update();

			swUpdateState.update((state) => ({
				...state,
				lastChecked: new Date()
			}));

			console.log('[SW Update] Update check completed');
		} catch (error) {
			console.error('[SW Update] Update check failed:', error);
		}
	}

	/**
	 * Activate waiting ServiceWorker (apply available update)
	 */
	public async activateUpdate(): Promise<void> {
		if (!this.registration?.waiting) {
			console.warn('[SW Update] No waiting ServiceWorker to activate');
			return;
		}

		try {
			console.log('[SW Update] Activating new ServiceWorker...');

			// Tell the waiting ServiceWorker to skip waiting and activate
			this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

			// Wait for the new ServiceWorker to take control
			await new Promise<void>((resolve) => {
				navigator.serviceWorker.addEventListener('controllerchange', () => {
					console.log('[SW Update] New ServiceWorker took control');
					resolve();
				});

				// Fallback timeout
				setTimeout(resolve, 5000);
			});

			swUpdateState.update((state) => ({
				...state,
				updateAvailable: false,
				version: '3.1'
			}));

			// Reload page to use new ServiceWorker
			window.location.reload();
		} catch (error) {
			console.error('[SW Update] Failed to activate update:', error);
		}
	}

	/**
	 * Show user-friendly update notification
	 */
	private notifyUpdateAvailable(): void {
		// This could trigger a toast, modal, or banner
		console.log('[SW Update] 🔄 Update available - user should be notified');

		// Dispatch custom event for UI components to listen to
		window.dispatchEvent(
			new CustomEvent('sw-update-available', {
				detail: { version: '3.1' }
			})
		);
	}

	/**
	 * Clean up resources
	 */
	public destroy(): void {
		if (this.updateCheckInterval) {
			clearInterval(this.updateCheckInterval);
			this.updateCheckInterval = null;
		}
	}
}

// Singleton instance
const updateManager = new ServiceWorkerUpdateManager();

// Export for manual control
export const serviceWorkerUpdateManager = updateManager;

// Export convenience functions
export async function checkForServiceWorkerUpdates(): Promise<void> {
	return updateManager.checkForUpdates();
}

export async function activateServiceWorkerUpdate(): Promise<void> {
	return updateManager.activateUpdate();
}

// Clean up on page unload
if (browser) {
	window.addEventListener('beforeunload', () => {
		updateManager.destroy();
	});
}

/**
 * React to ServiceWorker updates with user-friendly UI
 * Usage in components:
 *
 * ```svelte
 * <script>
 * import { swUpdateState } from '$lib/services/service-worker-update-manager';
 *
 * $: if ($swUpdateState.updateAvailable) {
 *   // Show update notification
 * }
 * </script>
 * ```
 */
