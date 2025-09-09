import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readFile } from 'fs/promises';
import path, { join, normalize, relative } from 'path';
import { existsSync } from 'fs';
import { dev } from '$app/environment';

// Path to SVG files (now in lib directory, not static)
const SVG_BASE_PATH = join(process.cwd(), 'src', 'lib', 'gallery-svgs', 'after');

// Allowed categories to prevent accessing arbitrary directories
const ALLOWED_CATEGORIES = [
	'animals',
	'anime',
	'art',
	'cinema',
	'gaming',
	'history',
	'portraits-fictional',
	'portraits-real'
];

// Simple SVG sanitization - removes potentially dangerous elements
function sanitizeSVG(svgContent: string): string {
	// Remove script tags
	svgContent = svgContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

	// Remove event handlers
	svgContent = svgContent.replace(/on\w+\s*=\s*"[^"]*"/gi, '');
	svgContent = svgContent.replace(/on\w+\s*=\s*'[^']*'/gi, '');

	// Remove javascript: URLs
	svgContent = svgContent.replace(/javascript:/gi, '');

	// Remove data: URLs that could contain scripts
	svgContent = svgContent.replace(/data:text\/html[^"']*/gi, '');

	// Remove foreignObject elements which can contain HTML
	svgContent = svgContent.replace(/<foreignObject\b[^>]*>.*?<\/foreignObject>/gis, '');

	// Remove use elements that reference external resources
	svgContent = svgContent.replace(/<use\s+.*?xlink:href\s*=\s*["'][^#][^"']*["'][^>]*>/gi, '');

	return svgContent;
}

export const GET: RequestHandler = async ({ params, setHeaders, url }) => {
	const { category, filename } = params;

	// Validate inputs to prevent directory traversal
	if (!category || !filename) {
		throw error(400, 'Invalid request parameters');
	}

	// Validate category is in allowed list
	if (!ALLOWED_CATEGORIES.includes(category)) {
		throw error(403, 'Access to this category is not allowed');
	}

	// Ensure filename ends with .svg
	if (!filename.endsWith('.svg')) {
		throw error(400, 'Invalid file type - only SVG files are supported');
	}

	// Strict sanitization - only allow specific characters
	const sanitizedCategory = category.replace(/[^a-z0-9-]/gi, '');
	const sanitizedFilename = filename.replace(/[^a-z0-9-().]/gi, '');

	// Additional validation
	if (sanitizedCategory !== category || sanitizedFilename !== filename) {
		throw error(400, 'Invalid characters in request');
	}

	// Construct and normalize the file path
	const requestedPath = normalize(join(SVG_BASE_PATH, sanitizedCategory, sanitizedFilename));

	// Ensure the resolved path is within the base directory
	const relativePath = relative(SVG_BASE_PATH, requestedPath);
	if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
		throw error(403, 'Access denied');
	}

	// Check if file exists
	if (!existsSync(requestedPath)) {
		throw error(404, `SVG file not found: ${category}/${filename}`);
	}

	try {
		// Read the SVG file
		let svgContent = await readFile(requestedPath, 'utf-8');

		// Sanitize SVG content to remove potentially dangerous elements
		svgContent = sanitizeSVG(svgContent);

		// Determine if this is a download request
		const isDownload = url.searchParams.has('download');

		// Set appropriate headers for security and caching
		const headers: Record<string, string> = {
			'Content-Type': 'image/svg+xml',
			'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
			'X-Content-Type-Options': 'nosniff',
			'X-Frame-Options': 'DENY', // Prevent SVG from being embedded in iframes
			'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox"
		};

		// Force download if requested
		if (isDownload) {
			headers['Content-Disposition'] = `attachment; filename="${sanitizedFilename}"`;
		} else {
			// For inline viewing, use restrictive CSP
			headers['Content-Disposition'] = 'inline';
		}

		// Add CORS headers for same-origin only
		headers['Cross-Origin-Resource-Policy'] = 'same-origin';

		setHeaders(headers);

		return new Response(svgContent);
	} catch (err) {
		// Don't expose internal error details in production
		if (!dev) {
			console.error('Error reading SVG file:', err);
			throw error(500, 'Failed to load SVG file');
		} else {
			console.error('Error reading SVG file:', err);
			throw error(
				500,
				`Failed to load SVG file: ${err instanceof Error ? err.message : 'Unknown error'}`
			);
		}
	}
};
