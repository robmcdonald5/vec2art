/**
 * Deployment Version Detection System
 * Helps identify when iPhone users have stale code from Vercel CDN caching
 */

import { browser } from '$app/environment';

// This will be updated with each deployment to help track version mismatches
export const DEPLOYMENT_VERSION = '2025-01-13-iphone-fix-v2';
export const DEPLOYMENT_TIMESTAMP = Date.now();

interface VersionInfo {
	version: string;
	timestamp: number;
	userAgent: string;
	isIOSSafari: boolean;
	deploymentAge: number;
}

/**
 * Get current deployment version information
 */
export function getVersionInfo(): VersionInfo {
	const isIOSSafari =
		browser &&
		/iPad|iPhone|iPod/.test(navigator.userAgent) &&
		/^((?!chrome|android).)*safari/i.test(navigator.userAgent);

	return {
		version: DEPLOYMENT_VERSION,
		timestamp: DEPLOYMENT_TIMESTAMP,
		userAgent: browser ? navigator.userAgent : 'server',
		isIOSSafari,
		deploymentAge: Date.now() - DEPLOYMENT_TIMESTAMP
	};
}

/**
 * Check if the current client has a version mismatch (indicating stale cache)
 */
export function checkVersionMismatch(): boolean {
	if (!browser) return false;

	const storedVersion = localStorage.getItem('vec2art-deployment-version');
	const currentVersion = DEPLOYMENT_VERSION;

	// If no stored version, this is first visit
	if (!storedVersion) {
		localStorage.setItem('vec2art-deployment-version', currentVersion);
		return false;
	}

	// Check if versions match
	const hasMismatch = storedVersion !== currentVersion;

	if (hasMismatch) {
		console.log(`[Version] Version mismatch detected!`);
		console.log(`[Version] Stored: ${storedVersion}`);
		console.log(`[Version] Current: ${currentVersion}`);

		// Update stored version
		localStorage.setItem('vec2art-deployment-version', currentVersion);
	}

	return hasMismatch;
}

/**
 * Log version information for debugging
 */
export function logVersionInfo(): void {
	if (!browser) return;

	const info = getVersionInfo();
	console.log(`[Version] Deployment Info:`, info);

	if (info.isIOSSafari) {
		console.log(`[Version] 📱 iPhone user detected - monitoring for cache issues`);

		// Log additional debugging info for iPhone users
		const cacheInfo = {
			hasThreadingCrashFlag: localStorage.getItem('vec2art-had-threading-crash') === 'true',
			storedVersion: localStorage.getItem('vec2art-deployment-version'),
			deploymentAge: info.deploymentAge,
			pageLoadTime: Date.now()
		};

		console.log(`[Version] 📱 iPhone Debug Info:`, cacheInfo);
	}
}

/**
 * Force version update and cache clear for iPhone users
 */
export async function forceVersionUpdate(): Promise<void> {
	if (!browser) return;

	console.log('[Version] 🔄 Forcing version update');

	// Clear all version-related storage
	localStorage.removeItem('vec2art-deployment-version');
	localStorage.removeItem('vec2art-had-threading-crash');

	// Set new version
	localStorage.setItem('vec2art-deployment-version', DEPLOYMENT_VERSION);

	console.log('[Version] ✅ Version update complete');
}
