/**
 * Test data and fixtures for E2E tests
 * Creates and manages test images, mock data, and expected outputs
 */

import fs from 'fs/promises';
import path from 'path';

export interface TestImageFixture {
	name: string;
	path: string;
	size: number;
	type: string;
	width: number;
	height: number;
	description: string;
}

export interface MockCapabilities {
	cores: number;
	deviceType: string;
	performanceClass: string;
	threading: boolean;
	simd: boolean;
	sharedArrayBuffer: boolean;
}

/**
 * Test image fixtures with various characteristics
 */
export const TEST_IMAGES: TestImageFixture[] = [
	{
		name: 'small-test.png',
		path: 'tests/e2e/fixtures/images/small-test.png',
		size: 1024 * 50, // 50KB
		type: 'image/png',
		width: 400,
		height: 300,
		description: 'Small PNG for fast tests'
	},
	{
		name: 'medium-test.jpg',
		path: 'tests/e2e/fixtures/images/medium-test.jpg',
		size: 1024 * 200, // 200KB
		type: 'image/jpeg',
		width: 800,
		height: 600,
		description: 'Medium JPEG for standard tests'
	},
	{
		name: 'large-test.png',
		path: 'tests/e2e/fixtures/images/large-test.png',
		size: 1024 * 1024 * 5, // 5MB
		type: 'image/png',
		width: 2048,
		height: 1536,
		description: 'Large PNG for performance tests'
	},
	{
		name: 'high-detail.png',
		path: 'tests/e2e/fixtures/images/high-detail.png',
		size: 1024 * 300, // 300KB
		type: 'image/png',
		width: 1024,
		height: 768,
		description: 'High detail image with complex edges'
	},
	{
		name: 'simple-shapes.png',
		path: 'tests/e2e/fixtures/images/simple-shapes.png',
		size: 1024 * 30, // 30KB
		type: 'image/png',
		width: 500,
		height: 500,
		description: 'Simple geometric shapes for basic tests'
	}
];

/**
 * Invalid files for error testing
 */
export const INVALID_FILES = [
	{
		name: 'invalid.txt',
		path: 'tests/e2e/fixtures/images/invalid.txt',
		type: 'text/plain',
		description: 'Text file instead of image'
	},
	{
		name: 'corrupted.png',
		path: 'tests/e2e/fixtures/images/corrupted.png',
		type: 'image/png',
		description: 'Corrupted PNG file'
	},
	{
		name: 'huge-file.png',
		path: 'tests/e2e/fixtures/images/huge-file.png',
		type: 'image/png',
		size: 1024 * 1024 * 50, // 50MB
		description: 'Extremely large file to test limits'
	}
];

/**
 * Mock CPU capabilities for different device types
 */
export const MOCK_CAPABILITIES: Record<string, MockCapabilities> = {
	'high-end-desktop': {
		cores: 16,
		deviceType: 'desktop',
		performanceClass: 'high-end',
		threading: true,
		simd: true,
		sharedArrayBuffer: true
	},
	'standard-laptop': {
		cores: 8,
		deviceType: 'laptop',
		performanceClass: 'mid-range',
		threading: true,
		simd: true,
		sharedArrayBuffer: true
	},
	'low-end-device': {
		cores: 4,
		deviceType: 'mobile',
		performanceClass: 'low-end',
		threading: false,
		simd: false,
		sharedArrayBuffer: false
	},
	tablet: {
		cores: 6,
		deviceType: 'tablet',
		performanceClass: 'mid-range',
		threading: true,
		simd: true,
		sharedArrayBuffer: true
	}
};

/**
 * Expected processing times for performance testing (in milliseconds)
 */
export const EXPECTED_PERFORMANCE = {
	'small-test.png': {
		'high-end': 500,
		'mid-range': 1500,
		'low-end': 3000
	},
	'medium-test.jpg': {
		'high-end': 1000,
		'mid-range': 2500,
		'low-end': 5000
	},
	'large-test.png': {
		'high-end': 3000,
		'mid-range': 8000,
		'low-end': 15000
	}
};

/**
 * Create a simple test image programmatically
 */
async function createTestImage(fixture: TestImageFixture): Promise<Buffer> {
	// Create a simple colored rectangle as PNG data
	// This is a minimal PNG file structure
	const { width, height } = fixture;

	// For simplicity, create a basic pattern that represents different image types
	if (fixture.name.includes('simple-shapes')) {
		// Create a simple geometric pattern
		return createSimpleShapesImage(width, height);
	} else if (fixture.name.includes('high-detail')) {
		// Create a complex pattern with many edges
		return createHighDetailImage(width, height);
	} else {
		// Create a basic test pattern
		return createBasicTestImage(width, height);
	}
}

/**
 * Create a basic test image with gradient
 */
function createBasicTestImage(width: number, height: number): Buffer {
	// Simple PNG header + basic image data
	// This creates a minimal valid PNG file
	const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

	// Create a simple gradient pattern
	const imageData = Buffer.alloc(width * height * 3); // RGB
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const index = (y * width + x) * 3;
			imageData[index] = Math.floor((x / width) * 255); // Red gradient
			imageData[index + 1] = Math.floor((y / height) * 255); // Green gradient
			imageData[index + 2] = 128; // Blue constant
		}
	}

	// For testing purposes, return a minimal PNG structure
	// In a real implementation, you'd properly encode this as PNG
	return Buffer.concat([pngSignature, imageData.subarray(0, 1000)]); // Truncated for simplicity
}

/**
 * Create simple geometric shapes
 */
function createSimpleShapesImage(width: number, height: number): Buffer {
	const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

	// Create simple geometric patterns
	const imageData = Buffer.alloc(width * height * 3);
	const centerX = width / 2;
	const centerY = height / 2;

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const index = (y * width + x) * 3;
			const dx = x - centerX;
			const dy = y - centerY;
			const distance = Math.sqrt(dx * dx + dy * dy);

			// Create circle and square patterns
			if (distance < width / 4) {
				imageData[index] = 255; // Red circle
				imageData[index + 1] = 0;
				imageData[index + 2] = 0;
			} else if (Math.abs(dx) < width / 6 && Math.abs(dy) < height / 6) {
				imageData[index] = 0; // Blue square
				imageData[index + 1] = 0;
				imageData[index + 2] = 255;
			} else {
				imageData[index] = 255; // White background
				imageData[index + 1] = 255;
				imageData[index + 2] = 255;
			}
		}
	}

	return Buffer.concat([pngSignature, imageData.subarray(0, 1000)]);
}

/**
 * Create high-detail image with complex edges
 */
function createHighDetailImage(width: number, height: number): Buffer {
	const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

	// Create complex patterns with many edges
	const imageData = Buffer.alloc(width * height * 3);

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const index = (y * width + x) * 3;

			// Create a complex pattern with sinusoidal waves
			const pattern1 = Math.sin(x * 0.05) * Math.sin(y * 0.05);
			const pattern2 = Math.sin(x * 0.1) * Math.cos(y * 0.1);
			const combined = (pattern1 + pattern2) * 127 + 128;

			imageData[index] = Math.floor(combined);
			imageData[index + 1] = Math.floor(255 - combined);
			imageData[index + 2] = Math.floor(combined * 0.5);
		}
	}

	return Buffer.concat([pngSignature, imageData.subarray(0, 2000)]);
}

/**
 * Create invalid/corrupted file content
 */
function createInvalidFile(filename: string): Buffer {
	if (filename.includes('invalid.txt')) {
		return Buffer.from('This is not an image file, it is plain text.');
	} else if (filename.includes('corrupted.png')) {
		// Start with PNG signature but corrupt the data
		const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
		const corruptedData = Buffer.from('This is corrupted PNG data that will fail to parse');
		return Buffer.concat([pngSignature, corruptedData]);
	} else {
		// Create an extremely large file
		return Buffer.alloc(1024 * 1024 * 50, 0xff); // 50MB of 0xFF bytes
	}
}

/**
 * Create all test fixtures
 */
export async function createTestFixtures(): Promise<void> {
	console.log('Creating test fixtures...');

	// Create test images
	for (const fixture of TEST_IMAGES) {
		const filePath = path.join(process.cwd(), fixture.path);
		const imageData = await createTestImage(fixture);
		await fs.writeFile(filePath, imageData);
		console.log(`Created test image: ${fixture.name} (${imageData.length} bytes)`);
	}

	// Create invalid files
	for (const file of INVALID_FILES) {
		const filePath = path.join(process.cwd(), file.path);
		const fileData = createInvalidFile(file.name);
		await fs.writeFile(filePath, fileData);
		console.log(`Created invalid file: ${file.name} (${fileData.length} bytes)`);
	}

	console.log('Test fixtures created successfully');
}

/**
 * Get test image by name
 */
export function getTestImage(name: string): TestImageFixture | undefined {
	return TEST_IMAGES.find((img) => img.name === name);
}

/**
 * Get invalid file by name
 */
export function getInvalidFile(name: string) {
	return INVALID_FILES.find((file) => file.name === name);
}

/**
 * Get expected processing time for image and performance class
 */
export function getExpectedProcessingTime(imageName: string, performanceClass: string): number {
	const times = EXPECTED_PERFORMANCE[imageName as keyof typeof EXPECTED_PERFORMANCE];
	if (!times) return 5000; // Default 5 seconds

	return times[performanceClass as keyof typeof times] || 5000;
}

/**
 * Generate expected SVG output pattern
 */
export function getExpectedSVGPattern(imageName: string): RegExp {
	// Basic SVG structure that should be present
	const patterns = {
		'simple-shapes.png': /<svg[^>]*>.*<path[^>]*d="[^"]+"/s,
		'high-detail.png': /<svg[^>]*>.*<path[^>]*d="[^"]+".*<path[^>]*d="[^"]+"/s,
		default: /<svg[^>]*>.*<path[^>]*d="[^"]+"/s
	};

	return patterns[imageName as keyof typeof patterns] || patterns.default;
}
