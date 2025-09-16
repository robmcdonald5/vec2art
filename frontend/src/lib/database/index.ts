/**
 * Vec2Art Database - IndexedDB Schema using Dexie.js
 *
 * Provides persistent storage for images and processing results
 * with automatic fallback to memory storage if IndexedDB is unavailable.
 */

import Dexie, { type EntityTable } from 'dexie';

/**
 * Interface for stored image records
 */
export interface StoredImage {
	id?: number;
	name: string;
	type: string;
	size: number;
	data: ArrayBuffer; // Binary image data
	width: number;
	height: number;
	created: Date;
	lastModified: Date;
}

/**
 * Interface for processing session metadata
 */
export interface ProcessingSession {
	id?: number;
	imageIds: number[]; // Array of image IDs in this session
	currentIndex: number;
	algorithm: string;
	created: Date;
	lastModified: Date;
}

/**
 * Interface for processed SVG results (optional storage)
 */
export interface ProcessedResult {
	id?: number;
	imageId: number; // Foreign key to StoredImage
	svgData: string;
	algorithm: string;
	parameters: Record<string, any>;
	processingTimeMs: number;
	pathCount: number;
	created: Date;
}

/**
 * Vec2Art Database class extending Dexie
 */
class Vec2ArtDatabase extends Dexie {
	images!: EntityTable<StoredImage, 'id'>;
	sessions!: EntityTable<ProcessingSession, 'id'>;
	results!: EntityTable<ProcessedResult, 'id'>;

	constructor() {
		super('Vec2ArtDB');

		// Define database schema
		this.version(1).stores({
			// Images table with auto-incrementing ID and indexes
			images: '++id, name, type, created, lastModified',

			// Sessions table for managing batch processing state
			sessions: '++id, created, lastModified',

			// Results table with foreign key to images
			results: '++id, imageId, algorithm, created'
		});
	}

	/**
	 * Clear all stored data
	 */
	async clearAll(): Promise<void> {
		await this.transaction('rw', this.images, this.sessions, this.results, async () => {
			await this.images.clear();
			await this.sessions.clear();
			await this.results.clear();
		});
	}

	/**
	 * Get storage statistics
	 */
	async getStorageStats(): Promise<{
		imageCount: number;
		totalSize: number;
		oldestImage: Date | null;
		newestImage: Date | null;
	}> {
		const images = await this.images.toArray();

		if (images.length === 0) {
			return {
				imageCount: 0,
				totalSize: 0,
				oldestImage: null,
				newestImage: null
			};
		}

		const totalSize = images.reduce((sum, img) => sum + img.size, 0);
		const dates = images.map((img) => img.created.getTime());

		return {
			imageCount: images.length,
			totalSize,
			oldestImage: new Date(Math.min(...dates)),
			newestImage: new Date(Math.max(...dates))
		};
	}

	/**
	 * Clean up old data if storage quota is exceeded
	 * Removes images older than specified days
	 */
	async cleanupOldData(daysToKeep: number = 7): Promise<number> {
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

		const oldImages = await this.images.where('created').below(cutoffDate).toArray();

		const imageIds = oldImages.map((img) => img.id!);

		if (imageIds.length > 0) {
			await this.transaction('rw', this.images, this.results, async () => {
				// Delete old images
				await this.images.bulkDelete(imageIds);

				// Delete associated results
				await this.results.where('imageId').anyOf(imageIds).delete();
			});
		}

		return imageIds.length;
	}
}

// Export database instance
export const db = new Vec2ArtDatabase();

/**
 * Check if IndexedDB is available and working
 */
export async function isIndexedDBAvailable(): Promise<boolean> {
	if (!('indexedDB' in window)) {
		return false;
	}

	try {
		// Try to open a test database using native IndexedDB API
		return new Promise((resolve) => {
			const request = window.indexedDB.open('__test_db__', 1);

			request.onsuccess = () => {
				// Close and delete the test database
				const db = request.result;
				db.close();
				window.indexedDB.deleteDatabase('__test_db__');
				resolve(true);
			};

			request.onerror = () => {
				console.warn('IndexedDB test failed:', request.error);
				resolve(false);
			};

			request.onblocked = () => {
				console.warn('IndexedDB test blocked');
				resolve(false);
			};
		});
	} catch (error) {
		console.warn('IndexedDB test failed:', error);
		return false;
	}
}

/**
 * Request persistent storage permission (Chrome/Edge)
 */
export async function requestPersistentStorage(): Promise<boolean> {
	if ('storage' in navigator && 'persist' in navigator.storage) {
		try {
			const isPersisted = await navigator.storage.persist();
			console.log('Persistent storage:', isPersisted ? 'granted' : 'denied');
			return isPersisted;
		} catch (error) {
			console.warn('Failed to request persistent storage:', error);
		}
	}
	return false;
}

/**
 * Get storage quota information
 */
export async function getStorageQuota(): Promise<{
	usage: number;
	quota: number;
	percentage: number;
}> {
	if ('storage' in navigator && 'estimate' in navigator.storage) {
		const estimate = await navigator.storage.estimate();
		return {
			usage: estimate.usage || 0,
			quota: estimate.quota || 0,
			percentage: ((estimate.usage || 0) / (estimate.quota || 1)) * 100
		};
	}

	return { usage: 0, quota: 0, percentage: 0 };
}
