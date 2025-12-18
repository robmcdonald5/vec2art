/**
 * V8/WebAssembly SIMD feature detection
 * Based on wasm-feature-detect library and V8 best practices
 *
 * SIMD support timeline:
 * - Chrome 91+ (May 2021)
 * - Firefox 89+ (June 2021)
 * - Safari 16.4+ (March 2023)
 * - Edge 91+ (May 2021)
 */

/**
 * Detects SIMD support using WebAssembly.validate()
 * This is the V8-recommended approach for feature detection
 */
export async function detectSimdSupport(): Promise<boolean> {
	try {
		// Minimal WASM module with SIMD instruction (v128.const)
		// This byte sequence represents a valid WASM module that uses SIMD
		const simdTestModule = new Uint8Array([
			0,
			97,
			115,
			109,
			1,
			0,
			0,
			0, // WASM header
			1,
			5,
			1,
			96,
			0,
			1,
			123, // Type section: function returning v128
			3,
			2,
			1,
			0, // Function section
			10,
			10,
			1,
			8,
			0,
			65,
			0,
			253,
			15,
			253,
			98,
			11 // Code: v128.const
		]);

		// V8-optimized: synchronous validation is fastest
		return WebAssembly.validate(simdTestModule);
	} catch (error) {
		console.warn('[SIMD Detection] Failed:', error);
		return false;
	}
}

/**
 * Browser detection for debugging and analytics
 */
function getBrowserInfo(): { browser: string; version: string } {
	const ua = navigator.userAgent;

	// Safari detection (important for SIMD support)
	if (ua.includes('Safari') && !ua.includes('Chrome')) {
		const match = ua.match(/Version\/(\d+\.\d+)/);
		return {
			browser: 'Safari',
			version: match ? match[1] : 'unknown'
		};
	}

	// Chrome/Edge
	if (ua.includes('Chrome')) {
		const match = ua.match(/Chrome\/(\d+)/);
		return {
			browser: ua.includes('Edg') ? 'Edge' : 'Chrome',
			version: match ? match[1] : 'unknown'
		};
	}

	// Firefox
	if (ua.includes('Firefox')) {
		const match = ua.match(/Firefox\/(\d+)/);
		return {
			browser: 'Firefox',
			version: match ? match[1] : 'unknown'
		};
	}

	return { browser: 'Unknown', version: 'unknown' };
}

/**
 * Complete SIMD detection with browser info
 */
export async function getSimdInfo(): Promise<{
	supported: boolean;
	browser: string;
	version: string;
	recommendation: 'simd' | 'standard';
}> {
	const supported = await detectSimdSupport();
	const { browser, version } = getBrowserInfo();

	return {
		supported,
		browser,
		version,
		recommendation: supported ? 'simd' : 'standard'
	};
}

/**
 * Log SIMD detection results for debugging
 */
export function logSimdInfo(info: {
	supported: boolean;
	browser: string;
	version: string;
	recommendation: 'simd' | 'standard';
}): void {
	console.log('[WASM SIMD] Detection results:', {
		supported: info.supported,
		browser: `${info.browser} ${info.version}`,
		module: info.recommendation === 'simd' ? 'pkg-simd/' : 'standard',
		performance: info.supported ? 'SIMD optimized' : 'standard'
	});

	// Warn about Safari < 16.4
	if (info.browser === 'Safari' && !info.supported) {
		console.warn(
			'[WASM SIMD] Safari < 16.4 detected - using standard WASM module. ' +
				'For best performance, update to Safari 16.4+ or use Chrome/Firefox.'
		);
	}
}
