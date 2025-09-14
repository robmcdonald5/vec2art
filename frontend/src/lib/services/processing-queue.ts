/**
 * ProcessingQueue - Priority-based queue for image processing tasks
 *
 * Simple, focused queue implementation for the refactored service layer
 * with priority support and efficient dequeuing.
 */

import type { QueueItem, ProcessingQueueConfig } from '../types/service-types';

/**
 * ProcessingQueue class
 */
export class ProcessingQueue {
	private config: ProcessingQueueConfig;
	private queue: QueueItem[] = [];
	private itemMap: Map<string, QueueItem> = new Map();

	constructor(config: ProcessingQueueConfig) {
		this.config = {
			enablePriority: true,
			maxSize: 100,
			...config
		};
	}

	/**
	 * Add an item to the queue
	 */
	async enqueue(item: QueueItem): Promise<void> {
		if (this.queue.length >= (this.config.maxSize ?? 100)) {
			throw new Error(`Queue is full (max size: ${this.config.maxSize})`);
		}

		// Add timestamp if not present
		if (!item.timestamp) {
			item.timestamp = Date.now();
		}

		// Add to map for quick lookup
		this.itemMap.set(item.id, item);

		// Insert based on priority if enabled
		if (this.config.enablePriority) {
			this.insertByPriority(item);
		} else {
			this.queue.push(item);
		}
	}

	/**
	 * Remove and return the next item from the queue
	 */
	async dequeue(): Promise<QueueItem | null> {
		const item = this.queue.shift();
		if (item) {
			this.itemMap.delete(item.id);
		}
		return item || null;
	}

	/**
	 * Peek at the next item without removing it
	 */
	peek(): QueueItem | null {
		return this.queue[0] || null;
	}

	/**
	 * Remove a specific item from the queue
	 */
	remove(id: string): boolean {
		const item = this.itemMap.get(id);
		if (!item) {
			return false;
		}

		const index = this.queue.indexOf(item);
		if (index !== -1) {
			this.queue.splice(index, 1);
			this.itemMap.delete(id);
			return true;
		}

		return false;
	}

	/**
	 * Update the priority of an item in the queue
	 */
	updatePriority(id: string, priority: number): boolean {
		const item = this.itemMap.get(id);
		if (!item) {
			return false;
		}

		// Remove from current position
		const index = this.queue.indexOf(item);
		if (index !== -1) {
			this.queue.splice(index, 1);

			// Update priority
			item.priority = priority;

			// Re-insert at correct position
			this.insertByPriority(item);
			return true;
		}

		return false;
	}

	/**
	 * Get the current queue size
	 */
	size(): number {
		return this.queue.length;
	}

	/**
	 * Check if the queue is empty
	 */
	isEmpty(): boolean {
		return this.queue.length === 0;
	}

	/**
	 * Check if the queue is full
	 */
	isFull(): boolean {
		return this.queue.length >= (this.config.maxSize ?? 100);
	}

	/**
	 * Clear all items from the queue
	 */
	clear(): void {
		this.queue = [];
		this.itemMap.clear();
	}

	/**
	 * Get all items in the queue (for inspection)
	 */
	getItems(): QueueItem[] {
		return [...this.queue];
	}

	/**
	 * Get queue statistics
	 */
	getStats(): {
		size: number;
		maxSize: number;
		oldestItem: number | null;
		priorityDistribution: Record<number, number>;
	} {
		const oldestItem =
			this.queue.length > 0 ? Math.min(...this.queue.map((item) => item.timestamp || 0)) : null;

		const priorityDistribution: Record<number, number> = {};
		for (const item of this.queue) {
			const priority = item.priority || 0;
			priorityDistribution[priority] = (priorityDistribution[priority] || 0) + 1;
		}

		return {
			size: this.queue.length,
			maxSize: this.config.maxSize ?? 100,
			oldestItem,
			priorityDistribution
		};
	}

	/**
	 * Insert an item into the queue based on priority
	 */
	private insertByPriority(item: QueueItem): void {
		// Higher priority numbers go first
		let insertIndex = 0;
		while (
			insertIndex < this.queue.length &&
			(this.queue[insertIndex].priority || 0) >= (item.priority || 0)
		) {
			insertIndex++;
		}
		this.queue.splice(insertIndex, 0, item);
	}
}
