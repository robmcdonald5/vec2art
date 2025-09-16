/**
 * Image Persistence Service
 *
 * Handles storing and retrieving images using IndexedDB with automatic
 * fallback to in-memory storage if IndexedDB is unavailable.
 */

import { browser } from '$app/environment';
import {
	db,
	type StoredImage,
	type ProcessingSession,
	isIndexedDBAvailable,
	requestPersistentStorage,
	getStorageQuota
} from '$lib/database';

export interface ImagePersistenceResult {
	success: boolean;
	imageIds?: number[];
	sessionId?: number;
	error?: string;
}

/**
 * In-memory fallback storage for when IndexedDB is unavailable
 */
class MemoryStorage {
	private images = new Map<number, StoredImage>();
	private sessions = new Map<number, ProcessingSession>();
	private nextId = 1;
	private nextSessionId = 1;

	async addImage(image: Omit<StoredImage, 'id'>): Promise<number> {
		const id = this.nextId++;
		this.images.set(id, { ...image, id });
		return id;
	}

	async addSession(session: Omit<ProcessingSession, 'id'>): Promise<number> {
		const id = this.nextSessionId++;
		this.sessions.set(id, { ...session, id });
		return id;
	}

	async getImage(id: number): Promise<StoredImage | undefined> {
		return this.images.get(id);
	}

	async getSession(id: number): Promise<ProcessingSession | undefined> {
		return this.sessions.get(id);
	}

	async getLatestSession(): Promise<ProcessingSession | undefined> {
		const sessions = Array.from(this.sessions.values());
		return sessions.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())[0];
	}

	async updateSession(id: number, updates: Partial<ProcessingSession>): Promise<void> {
		const session = this.sessions.get(id);
		if (session) {
			this.sessions.set(id, { ...session, ...updates, lastModified: new Date() });
		}
	}

	async deleteImage(id: number): Promise<void> {
		this.images.delete(id);
	}

	async deleteSession(id: number): Promise<void> {
		this.sessions.delete(id);
	}

	async clear(): Promise<void> {
		this.images.clear();
		this.sessions.clear();
		this.nextId = 1;
		this.nextSessionId = 1;
	}

	getStats() {
		return {
			imageCount: this.images.size,
			sessionCount: this.sessions.size
		};
	}
}

/**
 * Main Image Persistence Service
 */
class ImagePersistenceService {
	private memoryStorage = new MemoryStorage();
	private useIndexedDB = false;
	private initialized = false;

	/**
	 * Initialize the persistence service
	 */
	async initialize(): Promise<boolean> {
		if (!browser || this.initialized) {
			return this.useIndexedDB;
		}

		try {
			this.useIndexedDB = await isIndexedDBAvailable();

			if (this.useIndexedDB) {
				console.log('[ImagePersistence] IndexedDB available, using persistent storage');

				// Don't request persistent storage automatically - it shows a popup
				// Users can still use IndexedDB without persistent storage
				// await requestPersistentStorage();

				// Check storage quota
				const quota = await getStorageQuota();
				console.log(
					`[ImagePersistence] Storage quota: ${(quota.usage / 1024 / 1024).toFixed(2)}MB / ${(
						quota.quota /
						1024 /
						1024 /
						1024
					).toFixed(2)}GB (${quota.percentage.toFixed(2)}%)`
				);

				// Clean up old data if needed (older than 7 days by default)
				const cleaned = await db.cleanupOldData(7);
				if (cleaned > 0) {
					console.log(`[ImagePersistence] Cleaned up ${cleaned} old images`);
				}
			} else {
				console.warn('[ImagePersistence] IndexedDB unavailable, using in-memory storage');
			}
		} catch (error) {
			console.error('[ImagePersistence] Failed to initialize IndexedDB:', error);
			this.useIndexedDB = false;
		}

		this.initialized = true;
		return this.useIndexedDB;
	}

	/**
	 * Convert File to StoredImage format
	 */
	private async fileToStoredImage(file: File): Promise<Omit<StoredImage, 'id'>> {
		const arrayBuffer = await file.arrayBuffer();

		// Get image dimensions
		const blob = new Blob([arrayBuffer], { type: file.type });
		const bitmap = await createImageBitmap(blob);

		return {
			name: file.name,
			type: file.type,
			size: file.size,
			data: arrayBuffer,
			width: bitmap.width,
			height: bitmap.height,
			created: new Date(),
			lastModified: new Date(file.lastModified)
		};
	}

	/**
	 * Convert StoredImage back to File
	 */
	private storedImageToFile(storedImage: StoredImage): File {
		return new File([storedImage.data], storedImage.name, {
			type: storedImage.type,
			lastModified: storedImage.lastModified.getTime()
		});
	}

	/**
	 * Save single image
	 */
	async saveImage(file: File): Promise<number> {
		await this.initialize();

		const storedImage = await this.fileToStoredImage(file);

		if (this.useIndexedDB) {
			try {
				return await db.images.add(storedImage);
			} catch (error) {
				console.error('[ImagePersistence] Failed to save to IndexedDB:', error);
				// Fall back to memory storage
				return await this.memoryStorage.addImage(storedImage);
			}
		} else {
			return await this.memoryStorage.addImage(storedImage);
		}
	}

	/**
	 * Save multiple images as a session
	 */
	async saveImageSession(files: File[]): Promise<ImagePersistenceResult> {
		await this.initialize();

		try {
			const imageIds: number[] = [];

			// Convert and save all images
			for (const file of files) {
				const id = await this.saveImage(file);
				imageIds.push(id);
			}

			// Create a processing session
			const session: Omit<ProcessingSession, 'id'> = {
				imageIds,
				currentIndex: 0,
				algorithm: 'edge', // Default algorithm
				created: new Date(),
				lastModified: new Date()
			};

			let sessionId: number;

			if (this.useIndexedDB) {
				try {
					sessionId = await db.sessions.add(session);
				} catch (error) {
					console.error('[ImagePersistence] Failed to save session to IndexedDB:', error);
					sessionId = await this.memoryStorage.addSession(session);
				}
			} else {
				sessionId = await this.memoryStorage.addSession(session);
			}

			console.log(`[ImagePersistence] Saved session ${sessionId} with ${imageIds.length} images`);

			return {
				success: true,
				imageIds,
				sessionId
			};
		} catch (error) {
			console.error('[ImagePersistence] Failed to save image session:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}
	}

	/**
	 * Load the latest session
	 */
	async loadLatestSession(): Promise<{
		files: File[];
		currentIndex: number;
		sessionId: number;
	} | null> {
		await this.initialize();

		try {
			let session: ProcessingSession | undefined;

			if (this.useIndexedDB) {
				// Get the most recent session
				const sessions = await db.sessions.orderBy('lastModified').reverse().limit(1).toArray();
				session = sessions[0];
			} else {
				session = await this.memoryStorage.getLatestSession();
			}

			if (!session) {
				console.log('[ImagePersistence] No saved sessions found');
				return null;
			}

			// Load all images from the session
			const files: File[] = [];

			for (const imageId of session.imageIds) {
				let storedImage: StoredImage | undefined;

				if (this.useIndexedDB) {
					storedImage = await db.images.get(imageId);
				} else {
					storedImage = await this.memoryStorage.getImage(imageId);
				}

				if (storedImage) {
					files.push(this.storedImageToFile(storedImage));
				}
			}

			if (files.length === 0) {
				console.log('[ImagePersistence] Session found but no images could be loaded');
				return null;
			}

			console.log(`[ImagePersistence] Loaded session ${session.id} with ${files.length} images`);

			return {
				files,
				currentIndex: session.currentIndex,
				sessionId: session.id!
			};
		} catch (error) {
			console.error('[ImagePersistence] Failed to load session:', error);
			return null;
		}
	}

	/**
	 * Update the current index of a session
	 */
	async updateSessionIndex(sessionId: number, currentIndex: number): Promise<void> {
		if (this.useIndexedDB) {
			await db.sessions.update(sessionId, { currentIndex, lastModified: new Date() });
		} else {
			await this.memoryStorage.updateSession(sessionId, { currentIndex });
		}
	}

	/**
	 * Clear all stored data
	 */
	async clearAll(): Promise<void> {
		if (this.useIndexedDB) {
			await db.clearAll();
		}
		await this.memoryStorage.clear();
		console.log('[ImagePersistence] Cleared all stored data');
	}

	/**
	 * Get storage statistics
	 */
	async getStats(): Promise<any> {
		if (this.useIndexedDB) {
			return await db.getStorageStats();
		} else {
			return this.memoryStorage.getStats();
		}
	}

	/**
	 * Request persistent storage (shows browser permission popup)
	 * Only call this when user has important data worth protecting
	 */
	async requestPersistentStorageIfNeeded(): Promise<boolean> {
		// Only request if we have significant data stored
		const stats = await this.getStats();

		// Only request if user has multiple images or has been using the app actively
		if (stats.imageCount > 3) {
			console.log('[ImagePersistence] Requesting persistent storage for user data protection');
			return await requestPersistentStorage();
		}

		return false;
	}
}

// Export singleton instance
export const imagePersistence = new ImagePersistenceService();
