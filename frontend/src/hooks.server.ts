import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { dev } from '$app/environment';

// Debug logging - only enabled in development
const debugLogging: Handle = async ({ event, resolve }) => {
	// Skip verbose logging in production to avoid performance overhead
	if (dev) {
		console.log(`[DEBUG] ${event.request.method} ${event.url.pathname}`);
	}
	return resolve(event);
};

// Security headers middleware
const securityHeaders: Handle = async ({ event, resolve }) => {
	const response = await resolve(event, {
		filterSerializedResponseHeaders: (name) => name === 'content-type'
	});

	// Note: Cross-Origin Isolation headers removed - not needed for single-threaded WASM + Web Worker architecture
	// Our WASM module runs single-threaded and doesn't require SharedArrayBuffer support

	// Security headers for production
	if (!dev) {
		// Prevent clickjacking attacks
		response.headers.set('X-Frame-Options', 'SAMEORIGIN');

		// Prevent MIME type sniffing
		response.headers.set('X-Content-Type-Options', 'nosniff');

		// Enable HSTS for HTTPS enforcement
		response.headers.set(
			'Strict-Transport-Security',
			'max-age=31536000; includeSubDomains; preload'
		);

		// Prevent information disclosure
		response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
		response.headers.set('X-DNS-Prefetch-Control', 'off');
		response.headers.set('X-Download-Options', 'noopen');
		response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

		// Content Security Policy optimized for Safari WASM compatibility
		// Safari requires 'wasm-unsafe-eval' for WebAssembly
		const userAgent = event.request.headers.get('user-agent') || '';
		const isSafari = /Safari/.test(userAgent) && !/Chrome|Chromium/.test(userAgent);

		response.headers.set(
			'Content-Security-Policy',
			[
				"default-src 'self'",
				// Safari needs 'wasm-unsafe-eval', others use 'unsafe-eval' as fallback
				`script-src 'self' 'unsafe-inline' ${isSafari ? "'wasm-unsafe-eval'" : "'unsafe-eval' 'wasm-unsafe-eval'"} blob: data: https://challenges.cloudflare.com`,
				// Workers also need wasm-unsafe-eval for Safari to load WASM in worker context
				`worker-src 'self' blob: data: ${isSafari ? "'wasm-unsafe-eval'" : ''}`,
				"object-src 'none'",
				"style-src 'self' 'unsafe-inline'", // Allow inline styles
				"img-src 'self' data: blob: https:", // Allow images
				"font-src 'self' data:",
				"connect-src 'self' https: wss: ws: https://challenges.cloudflare.com", // Allow API connections and Turnstile
				"media-src 'self' blob: data:",
				"frame-src 'self' https://challenges.cloudflare.com", // Allow Turnstile iframe
				"base-uri 'self'"
			].join('; ')
		);

		// Permissions Policy (formerly Feature Policy)
		response.headers.set(
			'Permissions-Policy',
			'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
		);
	}

	// Cache control for different resource types
	const url = event.url.pathname;

	// Safari-optimized WASM file handling
	if (url.startsWith('/wasm/') || url.endsWith('.wasm')) {
		// Safari needs specific MIME type and headers
		response.headers.set('Content-Type', 'application/wasm');
		// Safari-friendly cache control
		response.headers.set('Cache-Control', 'public, max-age=3600, must-revalidate');
		// Allow cross-origin for Safari
		response.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
		response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
		// Vary on Accept-Encoding for Safari compression issues
		response.headers.set('Vary', 'Accept-Encoding');
		// Add proper ETag based on file content
		response.headers.set('ETag', `"wasm-v${process.env.npm_package_version || '1.0.0'}"`);
	} else if (url.match(/\.(jpg|jpeg|png|gif|webp|avif|svg|ico)$/i)) {
		response.headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
	} else if (url.match(/\.(js|css)$/i) && url.includes('_app/')) {
		// Vite-generated assets with hashes
		response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
	} else if (url.match(/\.(woff|woff2|ttf|otf|eot)$/i)) {
		response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
	}

	return response;
};

// Rate limiting for API endpoints
const rateLimiting: Handle = async ({ event, resolve }) => {
	// Only apply to API routes
	if (event.url.pathname.startsWith('/api/')) {
		// Get client identifier (IP in production, would need proper implementation)
		const _clientId = event.getClientAddress();

		// TODO: Implement actual rate limiting with Redis/Upstash
		// For now, just add rate limit headers
		const response = await resolve(event);
		response.headers.set('X-RateLimit-Limit', '100');
		response.headers.set('X-RateLimit-Remaining', '99');
		response.headers.set('X-RateLimit-Reset', new Date(Date.now() + 60000).toISOString());

		return response;
	}

	return resolve(event);
};

// Request sanitization and validation
const requestSanitization: Handle = async ({ event, resolve }) => {
	// SVG downloads now use static files directly - no API endpoint needed

	return resolve(event);
};

// Performance monitoring
const performanceMonitoring: Handle = async ({ event, resolve }) => {
	const start = Date.now();

	const response = await resolve(event);

	const duration = Date.now() - start;
	response.headers.set('Server-Timing', `total;dur=${duration}`);

	// Log slow requests in production
	if (!dev && duration > 1000) {
		console.warn(`Slow request: ${event.url.pathname} took ${duration}ms`);
	}

	return response;
};

// Combine all middleware - DEBUG FIRST to verify function invocation
export const handle = sequence(
	debugLogging,
	securityHeaders,
	rateLimiting,
	requestSanitization,
	performanceMonitoring
);
