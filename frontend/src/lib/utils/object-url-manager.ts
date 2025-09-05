/**
 * Object URL Manager
 * Utility for managing blob URLs with automatic cleanup to prevent memory leaks
 */

import { browser } from '$app/environment';

interface ManagedObjectURL {
	url: string;
	file: File;
	refCount: number;
	createdAt: number;
}

class ObjectURLManager {
	private urls = new Map<string, ManagedObjectURL>();
	private cleanupInterval: number | null = null;
	private readonly MAX_AGE = 60000; // 1 minute max age for URLs
	private readonly CLEANUP_INTERVAL = 30000; // Check every 30 seconds

	constructor() {
		if (browser) {
			this.startCleanupInterval();
		}
	}

	/**
	 * Create or reuse an object URL for a file
	 */
	createURL(file: File): string {
		if (!browser) return '';

		// Check if we already have a URL for this file
		const existingEntry = Array.from(this.urls.values()).find(entry => 
			entry.file === file || (
				entry.file.name === file.name && 
				entry.file.size === file.size &&
				entry.file.lastModified === file.lastModified
			)
		);

		if (existingEntry) {
			existingEntry.refCount++;
			return existingEntry.url;
		}

		// Create new URL
		const url = URL.createObjectURL(file);
		this.urls.set(url, {
			url,
			file,
			refCount: 1,
			createdAt: Date.now()
		});

		return url;
	}

	/**
	 * Release a reference to an object URL
	 */
	releaseURL(url: string): void {
		if (!browser || !url) return;

		const entry = this.urls.get(url);
		if (entry) {
			entry.refCount--;
			if (entry.refCount <= 0) {
				this.revokeURL(url);
			}
		}
	}

	/**
	 * Immediately revoke a URL and clean it up
	 */
	revokeURL(url: string): void {
		if (!browser || !url) return;

		const entry = this.urls.get(url);
		if (entry) {
			URL.revokeObjectURL(url);
			this.urls.delete(url);
		}
	}

	/**
	 * Clean up all URLs for a specific file
	 */
	revokeAllForFile(file: File): void {
		if (!browser) return;

		const urlsToRevoke: string[] = [];
		
		for (const [url, entry] of this.urls.entries()) {
			if (entry.file === file || (
				entry.file.name === file.name && 
				entry.file.size === file.size &&
				entry.file.lastModified === file.lastModified
			)) {
				urlsToRevoke.push(url);
			}
		}

		urlsToRevoke.forEach(url => this.revokeURL(url));
	}

	/**
	 * Clean up stale URLs
	 */
	private cleanup(): void {
		if (!browser) return;

		const now = Date.now();
		const urlsToRevoke: string[] = [];

		for (const [url, entry] of this.urls.entries()) {
			// Remove URLs that are too old or have no references
			if (now - entry.createdAt > this.MAX_AGE || entry.refCount <= 0) {
				urlsToRevoke.push(url);
			}
		}

		urlsToRevoke.forEach(url => this.revokeURL(url));
	}

	/**
	 * Start automatic cleanup interval
	 */
	private startCleanupInterval(): void {
		if (!browser || this.cleanupInterval !== null) return;

		this.cleanupInterval = window.setInterval(() => {
			this.cleanup();
		}, this.CLEANUP_INTERVAL);
	}

	/**
	 * Stop automatic cleanup
	 */
	destroy(): void {
		if (browser && this.cleanupInterval !== null) {
			window.clearInterval(this.cleanupInterval);
			this.cleanupInterval = null;
		}

		// Revoke all remaining URLs
		for (const url of this.urls.keys()) {
			this.revokeURL(url);
		}
	}

	/**
	 * Get stats for debugging
	 */
	getStats() {
		return {
			totalUrls: this.urls.size,
			urls: Array.from(this.urls.values()).map(entry => ({
				fileName: entry.file.name,
				fileSize: entry.file.size,
				refCount: entry.refCount,
				ageMs: Date.now() - entry.createdAt
			}))
		};
	}
}

// Create singleton instance
export const objectURLManager = new ObjectURLManager();

/**
 * Create a managed object URL for a file that will be automatically cleaned up
 * Use this in derived states or effects within Svelte components
 */
export function createManagedObjectURL(file: File | null): string | null {
	if (!file) return null;
	return objectURLManager.createURL(file);
}

/**
 * Release a managed object URL
 */
export function releaseManagedObjectURL(url: string | null): void {
	if (url) {
		objectURLManager.releaseURL(url);
	}
}