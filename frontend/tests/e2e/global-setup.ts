/**
 * Global setup for Playwright E2E tests
 * Handles test data preparation and environment setup
 */

import { FullConfig } from '@playwright/test';
import { createTestFixtures } from './fixtures/test-data';
import fs from 'fs/promises';
import path from 'path';

async function globalSetup(config: FullConfig) {
	console.log('Setting up E2E test environment...');

	try {
		// Ensure test directories exist
		const testDirs = ['tests/e2e/fixtures/images', 'tests/e2e/fixtures/outputs', 'test-results'];

		for (const dir of testDirs) {
			const fullPath = path.join(process.cwd(), dir);
			await fs.mkdir(fullPath, { recursive: true });
			console.log(`Created test directory: ${dir}`);
		}

		// Create test fixtures
		await createTestFixtures();
		console.log('Test fixtures created successfully');

		// Verify web server configuration
		const baseURL = config.projects[0]?.use?.baseURL;
		console.log(`Tests will run against: ${baseURL}`);

		// Environment validation
		const requiredEnvVars = ['NODE_ENV'];
		for (const envVar of requiredEnvVars) {
			if (!process.env[envVar]) {
				console.warn(`Warning: ${envVar} environment variable not set`);
			}
		}

		console.log('E2E test environment setup complete');
	} catch (error) {
		console.error('Failed to set up E2E test environment:', error);
		throw error;
	}
}

export default globalSetup;
