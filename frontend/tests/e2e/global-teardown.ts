/**
 * Global teardown for Playwright E2E tests
 * Handles cleanup and result processing
 */

import { FullConfig } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

async function globalTeardown(_config: FullConfig) {
	console.log('Tearing down E2E test environment...');

	try {
		// Clean up temporary test files
		const tempDirs = ['tests/e2e/fixtures/outputs'];

		for (const dir of tempDirs) {
			const fullPath = path.join(process.cwd(), dir);
			try {
				const files = await fs.readdir(fullPath);
				for (const file of files) {
					if (file.startsWith('temp-') || file.startsWith('test-output-')) {
						await fs.unlink(path.join(fullPath, file));
					}
				}
				console.log(`Cleaned up temporary files in: ${dir}`);
			} catch (_error) {
				// Directory might not exist, which is fine
				console.log(`Skipped cleanup for: ${dir} (directory not found)`);
			}
		}

		// Generate test summary if in CI
		if (process.env.CI) {
			const resultsPath = path.join(process.cwd(), 'test-results', 'results.json');
			try {
				const results = await fs.readFile(resultsPath, 'utf8');
				const parsed = JSON.parse(results);

				console.log('=== E2E Test Results Summary ===');
				console.log(`Total tests: ${parsed.stats?.expected || 0}`);
				console.log(`Passed: ${parsed.stats?.passed || 0}`);
				console.log(`Failed: ${parsed.stats?.failed || 0}`);
				console.log(`Skipped: ${parsed.stats?.skipped || 0}`);
				console.log(`Duration: ${parsed.stats?.duration || 0}ms`);
			} catch (_error) {
				console.log('Could not generate test summary (results file not found)');
			}
		}

		console.log('E2E test environment teardown complete');
	} catch (_error) {
		console.error('Error during teardown:', error);
		// Don't throw - teardown failures shouldn't fail the build
	}
}

export default globalTeardown;
