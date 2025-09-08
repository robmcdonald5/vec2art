import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Path to SVG files (now in lib directory, not static)
const SVG_BASE_PATH = join(process.cwd(), 'src', 'lib', 'gallery-svgs', 'after');

export const GET: RequestHandler = async ({ params, setHeaders }) => {
	const { category, filename } = params;
	
	// Validate inputs to prevent directory traversal
	if (!category || !filename) {
		throw error(400, 'Invalid request parameters');
	}
	
	// Ensure filename ends with .svg
	if (!filename.endsWith('.svg')) {
		throw error(400, 'Invalid file type - only SVG files are supported');
	}
	
	// Sanitize inputs to prevent directory traversal attacks
	const sanitizedCategory = category.replace(/[^a-z0-9-]/gi, '');
	const sanitizedFilename = filename.replace(/[^a-z0-9-().]/gi, '');
	
	// Construct the file path
	const filePath = join(SVG_BASE_PATH, sanitizedCategory, sanitizedFilename);
	
	// Check if file exists
	if (!existsSync(filePath)) {
		throw error(404, `SVG file not found: ${category}/${filename}`);
	}
	
	try {
		// Read the SVG file
		const svgContent = await readFile(filePath, 'utf-8');
		
		// Set appropriate headers for caching and content type
		setHeaders({
			'Content-Type': 'image/svg+xml',
			'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
			'X-Content-Type-Options': 'nosniff'
		});
		
		return new Response(svgContent);
	} catch (err) {
		console.error('Error reading SVG file:', err);
		throw error(500, 'Failed to load SVG file');
	}
};