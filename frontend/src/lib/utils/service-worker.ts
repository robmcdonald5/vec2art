import { browser } from '$app/environment';

export async function registerServiceWorker() {
	if (!browser || !('serviceWorker' in navigator)) {
		return;
	}

	try {
		const registration = await navigator.serviceWorker.register('/sw.js', {
			scope: '/'
		});

		console.log('Service Worker registered successfully:', registration);

		// Check for updates periodically (every hour)
		setInterval(() => {
			registration.update();
		}, 60 * 60 * 1000);

		// Handle updates
		registration.addEventListener('updatefound', () => {
			const newWorker = registration.installing;
			if (!newWorker) return;

			newWorker.addEventListener('statechange', () => {
				if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
					// New service worker available, could show update notification
					console.log('New service worker available, refresh to update');
				}
			});
		});
	} catch (error) {
		console.error('Service Worker registration failed:', error);
	}
}

export async function clearServiceWorkerCache(): Promise<void> {
	if (!browser || !('serviceWorker' in navigator)) {
		return;
	}

	const registration = await navigator.serviceWorker.ready;
	if (!registration.active) return;

	return new Promise((resolve) => {
		const messageChannel = new MessageChannel();
		messageChannel.port1.onmessage = (event) => {
			console.log('Cache cleared:', event.data);
			resolve();
		};

		registration.active!.postMessage(
			{ action: 'clearCache' },
			[messageChannel.port2]
		);
	});
}

export async function getServiceWorkerCacheSize(): Promise<{
	cacheSize: number;
	imageCacheSize: number;
	totalSize: number;
} | null> {
	if (!browser || !('serviceWorker' in navigator)) {
		return null;
	}

	const registration = await navigator.serviceWorker.ready;
	if (!registration.active) return null;

	return new Promise((resolve) => {
		const messageChannel = new MessageChannel();
		messageChannel.port1.onmessage = (event) => {
			resolve(event.data);
		};

		registration.active!.postMessage(
			{ action: 'getCacheSize' },
			[messageChannel.port2]
		);
	});
}