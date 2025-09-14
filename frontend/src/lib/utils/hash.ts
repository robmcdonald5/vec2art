/**
 * Hash utility functions
 *
 * Simple, fast hashing for cache keys and data fingerprinting.
 */

/**
 * Create a simple hash from a string
 * Uses djb2 algorithm for speed and reasonable distribution
 */
export function createHash(str: string): string {
	let hash = 5381;
	for (let i = 0; i < str.length; i++) {
		hash = (hash << 5) + hash + str.charCodeAt(i);
		hash = hash & 0xffffffff; // Convert to 32-bit integer
	}
	return hash.toString(36); // Convert to base36 for shorter string
}

/**
 * Create a hash from an object
 */
export function hashObject(obj: any): string {
	return createHash(JSON.stringify(obj));
}

/**
 * Create a hash from binary data
 */
export function hashBinary(data: Uint8Array | ArrayBuffer): string {
	const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : data;

	// Sample the data for efficiency
	const sampleSize = Math.min(1000, bytes.length);
	const step = Math.max(1, Math.floor(bytes.length / sampleSize));

	let hash = 5381;
	for (let i = 0; i < bytes.length; i += step) {
		hash = (hash << 5) + hash + bytes[i];
		hash = hash & 0xffffffff;
	}

	return hash.toString(36);
}

/**
 * Combine multiple hashes into one
 */
export function combineHashes(...hashes: string[]): string {
	return createHash(hashes.join('-'));
}
