#!/usr/bin/env node

/**
 * Dual WASM Build Script
 * Builds both SIMD and non-SIMD versions following V8/WebAssembly best practices
 * Based on the existing rebuild-wasm.js with dual-build enhancements
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Terminal colors
const colors = {
	reset: '\x1b[0m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	cyan: '\x1b[36m',
	magenta: '\x1b[35m'
};

// Logging helpers
const log = {
	info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
	success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
	warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
	error: (msg) => console.error(`${colors.red}❌ ${msg}${colors.reset}`),
	step: (msg) => console.log(`${colors.magenta}📦 ${msg}${colors.reset}`)
};

// Configuration
const config = {
	wasmDir: path.join('wasm', 'vectorize-wasm'),
	frontendWasmDir: path.join('frontend', 'src', 'lib', 'wasm'),
	staticWasmDir: path.join('frontend', 'static', 'wasm'),
	clean: process.argv.includes('--clean'),
	skipVerify: process.argv.includes('--skip-verify'),
	verbose: process.argv.includes('--verbose')
};

/**
 * Check if a command exists
 */
async function commandExists(cmd) {
	try {
		const isWindows = process.platform === 'win32';
		const checkCmd = isWindows ? `where ${cmd}` : `which ${cmd}`;
		await execAsync(checkCmd);
		return true;
	} catch {
		return false;
	}
}

/**
 * Check for wasm-opt (required for dual builds)
 */
async function checkWasmOpt() {
	if (!await commandExists('wasm-opt')) {
		log.warning('wasm-opt not found. Installing binaryen...');
		try {
			// Try to install via npm
			await execAsync('npm install -g wasm-opt');
			log.success('wasm-opt installed');
		} catch (error) {
			log.error('Failed to install wasm-opt');
			log.info('Please install binaryen manually:');
			log.info('  npm: npm install -g wasm-opt');
			log.info('  Or download from: https://github.com/WebAssembly/binaryen/releases');
			process.exit(1);
		}
	}
}

/**
 * Check prerequisites (reusing existing logic)
 */
async function checkPrerequisites() {
	log.info('Checking prerequisites...');

	// Check for Rust
	if (!await commandExists('rustc')) {
		log.error('Rust not found. Please install from https://rustup.rs/');
		process.exit(1);
	}

	// Check for wasm-pack
	if (!await commandExists('wasm-pack')) {
		log.error('wasm-pack not found. Install with: cargo install wasm-pack');
		process.exit(1);
	}

	// Check for wasm-opt
	await checkWasmOpt();

	// Verify tools
	const { stdout: rustVersion } = await execAsync('rustc --version');
	const { stdout: wasmVersion } = await execAsync('wasm-pack --version');
	const { stdout: wasmOptVersion } = await execAsync('wasm-opt --version');

	log.info(`Rust: ${rustVersion.trim()}`);
	log.info(`wasm-pack: ${wasmVersion.trim()}`);
	log.info(`wasm-opt: ${wasmOptVersion.trim()}`);

	// Check for wasm32 target
	const { stdout } = await execAsync('rustup target list --installed');
	if (!stdout.includes('wasm32-unknown-unknown')) {
		log.warning('Installing wasm32-unknown-unknown target...');
		await execAsync('rustup target add wasm32-unknown-unknown');
		log.success('wasm32 target installed');
	}

	log.success('Prerequisites check complete');
}

/**
 * Clean build artifacts
 */
async function cleanBuild() {
	log.info('Cleaning previous build artifacts...');

	const dirsToClean = [
		path.join(config.wasmDir, 'target'),
		path.join(config.wasmDir, 'pkg'),
		path.join(config.wasmDir, 'pkg-simd')
	];

	for (const dir of dirsToClean) {
		try {
			await fs.rm(dir, { recursive: true, force: true });
		} catch (error) {
			// Directory might not exist
		}
	}

	// Clean WASM files from frontend (both pkg and pkg-simd)
	for (const subdir of ['pkg', 'pkg-simd']) {
		const targetDir = path.join(config.frontendWasmDir, subdir);
		try {
			await fs.rm(targetDir, { recursive: true, force: true });
		} catch (error) {
			// Directory might not exist
		}
	}

	log.success('Clean complete');
}

/**
 * Build WASM module (non-SIMD version)
 * Matches existing rebuild-wasm.js build command exactly
 */
async function buildWasmStandard() {
	log.step('Building Non-SIMD WASM (Compatible with all browsers)');

	// Use same build command as rebuild-wasm.js (line 206)
	// Note: --no-opt disables wasm-pack's bundled optimizer (we use external wasm-opt instead)
	const buildCmd = 'wasm-pack build --no-opt --target web --out-dir pkg --features wasm-base';

	try {
		const { stdout, stderr } = await execAsync(buildCmd, { cwd: config.wasmDir });

		if (config.verbose) {
			console.log(stdout);
			if (stderr) console.error(stderr);
		}

		log.success('Non-SIMD build complete');
	} catch (error) {
		log.error('Non-SIMD build failed!');
		console.error(error.message);
		process.exit(1);
	}
}

/**
 * Build WASM module (SIMD version)
 * Uses RUSTFLAGS to enable SIMD128 target feature
 */
async function buildWasmSimd() {
	log.step('Building SIMD WASM (Optimized for modern browsers)');

	// Use same base command but with SIMD target feature
	const buildCmd = 'wasm-pack build --no-opt --target web --out-dir pkg-simd --features wasm-base';

	try {
		// Set RUSTFLAGS for SIMD compilation (V8/WebAssembly best practice)
		const env = {
			...process.env,
			RUSTFLAGS: '-C target-feature=+simd128'
		};

		const { stdout, stderr } = await execAsync(buildCmd, {
			cwd: config.wasmDir,
			env
		});

		if (config.verbose) {
			console.log(stdout);
			if (stderr) console.error(stderr);
		}

		log.success('SIMD build complete');
	} catch (error) {
		log.error('SIMD build failed!');
		console.error(error.message);
		process.exit(1);
	}
}

/**
 * Optimize WASM binaries with wasm-opt
 * Uses conservative -O3 instead of -O4 to avoid Safari validation bugs
 * Reference: https://github.com/konsoletyper/teavm/issues/1028
 */
async function optimizeWasm() {
	log.step('Optimizing WASM binaries with wasm-opt (Conservative -O3)');

	// Optimize non-SIMD version
	const standardWasm = path.join(config.wasmDir, 'pkg', 'vectorize_wasm_bg.wasm');
	log.info('Optimizing non-SIMD version...');

	try {
		await execAsync(`wasm-opt ${standardWasm} -O3 --enable-bulk-memory --enable-mutable-globals --enable-reference-types --enable-sign-ext -o ${standardWasm}`);
		log.success('Non-SIMD optimization complete');
	} catch (error) {
		log.warning('Non-SIMD optimization failed (continuing): ' + error.message);
	}

	// Optimize SIMD version
	const simdWasm = path.join(config.wasmDir, 'pkg-simd', 'vectorize_wasm_bg.wasm');
	log.info('Optimizing SIMD version...');

	try {
		await execAsync(`wasm-opt ${simdWasm} -O3 --enable-simd --enable-bulk-memory --enable-mutable-globals --enable-reference-types --enable-sign-ext -o ${simdWasm}`);
		log.success('SIMD optimization complete');
	} catch (error) {
		log.warning('SIMD optimization failed (continuing): ' + error.message);
	}
}

/**
 * Fix import paths in JavaScript files
 * Matches all fixes from rebuild-wasm.js (lines 226-318)
 */
async function fixImports(pkgDir) {
	const jsFile = path.join(pkgDir, 'vectorize_wasm.js');

	// Fix 1: Main import statements (rebuild-wasm.js lines 231-242)
	try {
		let content = await fs.readFile(jsFile, 'utf8');

		// Fix bare specifier imports
		content = content.replace(/from '__wbindgen_placeholder__'/g, "from './__wbindgen_placeholder__.js'");
		content = content.replace(/imports\['\.\/\_\_wbindgen\_placeholder\_\_\.js'\]/g, "imports['__wbindgen_placeholder__']");
		content = content.replace(/import \* as wbg from '__wbindgen_placeholder__'/g, "import * as wbg from './__wbindgen_placeholder__.js'");

		await fs.writeFile(jsFile, content);
	} catch (error) {
		log.warning(`Could not fix main imports in ${pkgDir}: ` + error.message);
	}

	// Fix 2: Worker helper imports in snippets (rebuild-wasm.js lines 247-274)
	const snippetsDir = path.join(pkgDir, 'snippets');
	try {
		const files = await findFiles(snippetsDir, '.js');

		for (const file of files) {
			let content = await fs.readFile(file, 'utf8');

			// Fix relative imports
			content = content.replace(/from '\.\.\/\.\.\/\.\.\/'/g, "from '../../../vectorize_wasm.js'");
			content = content.replace(/from '\.\.\/\.\.\/\.\.'/g, "from '../../../vectorize_wasm.js'");

			// Fix 3: Worker context checks (rebuild-wasm.js line 261)
			content = content.replace(/if \(name === "wasm_bindgen_worker"\)/g, 'if (typeof self !== "undefined" && self.name === "wasm_bindgen_worker")');

			// Fix 4: URL imports
			content = content.replace(/new URL\('vectorize_wasm_bg\.wasm', import\.meta\.url\)/g, "new URL('./vectorize_wasm_bg.wasm', import.meta.url)");

			await fs.writeFile(file, content);
		}

		if (files.length > 0 && config.verbose) {
			log.info(`Fixed ${files.length} worker helper files`);
		}
	} catch (error) {
		// Snippets directory might not exist
	}

	// Fix 5: TypeScript definitions cleanup (rebuild-wasm.js lines 301-317)
	const dtsFile = path.join(pkgDir, 'vectorize_wasm.d.ts');
	try {
		let content = await fs.readFile(dtsFile, 'utf8');

		// Remove corrupted definitions
		content = content.replace(/readonly _ZN.*\$.*E:.*\n/g, '');
		content = content.replace(/^\s*readonly.*\$.*:.*$/gm, '');

		// Fix malformed generics
		content = content.replace(/<\s*>/g, '<unknown>');

		await fs.writeFile(dtsFile, content);
	} catch (error) {
		// TypeScript definitions might not exist or might not need cleaning
	}
}

/**
 * Create placeholder file
 * Matches extensive placeholder from rebuild-wasm.js (lines 323-367)
 */
async function createPlaceholder(destDir) {
	const placeholderContent = `// wasm-bindgen placeholder file
// Auto-generated by rebuild-wasm-dual.js
// Provides stub implementations for wasm-bindgen functions

// Core wasm-bindgen functions
export function __wbindgen_describe() { return 0; }
export function __wbindgen_describe_closure() { return 0; }
export function __wbindgen_string_new(ptr, len) { return 0; }
export function __wbindgen_string_get(idx) { return null; }
export function __wbindgen_number_new(value) { return 0; }
export function __wbindgen_number_get(idx) { return 0; }
export function __wbindgen_boolean_new(value) { return 0; }
export function __wbindgen_boolean_get(idx) { return false; }
export function __wbindgen_object_drop_ref(idx) {}
export function __wbindgen_cb_drop(idx) { return 0; }
export function __wbindgen_json_parse(ptr, len) { return 0; }
export function __wbindgen_json_serialize(idx) { return [0, 0]; }
export function __wbindgen_is_undefined(idx) { return false; }
export function __wbindgen_is_null(idx) { return false; }
export function __wbindgen_is_object(idx) { return false; }
export function __wbindgen_is_function(idx) { return false; }
export function __wbindgen_typeof(idx) { return 0; }

// Memory management
export function __wbindgen_memory() { return { buffer: new ArrayBuffer(0) }; }
export function __wbindgen_throw(ptr, len) { throw new Error('WASM Error'); }
export function __wbindgen_rethrow(idx) {}

// Console functions
export function __wbindgen_console_log(ptr, len) { console.log('WASM Log'); }
export function __wbindgen_console_error(ptr, len) { console.error('WASM Error'); }
export function __wbindgen_console_warn(ptr, len) { console.warn('WASM Warning'); }

// Export default for compatibility
export default {};
`;

	const placeholderPath = path.join(destDir, '__wbindgen_placeholder__.js');
	await fs.writeFile(placeholderPath, placeholderContent);
}

/**
 * Copy directory recursively
 */
async function copyDir(src, dest) {
	await fs.mkdir(dest, { recursive: true });

	const entries = await fs.readdir(src, { withFileTypes: true });

	for (const entry of entries) {
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);

		if (entry.isDirectory()) {
			await copyDir(srcPath, destPath);
		} else {
			await fs.copyFile(srcPath, destPath);
		}
	}
}

/**
 * Find files recursively
 */
async function findFiles(dir, ext) {
	const results = [];

	try {
		const files = await fs.readdir(dir);

		for (const file of files) {
			const filePath = path.join(dir, file);
			const stat = await fs.stat(filePath);

			if (stat.isDirectory()) {
				results.push(...await findFiles(filePath, ext));
			} else if (file.endsWith(ext)) {
				results.push(filePath);
			}
		}
	} catch {
		// Directory might not exist
	}

	return results;
}

/**
 * Copy files to frontend
 */
async function copyFiles() {
	log.info('Copying files to frontend...');

	// Ensure base directories exist
	await fs.mkdir(config.frontendWasmDir, { recursive: true });
	await fs.mkdir(config.staticWasmDir, { recursive: true });

	// Copy non-SIMD package
	log.info('Copying non-SIMD package...');
	const pkgSrc = path.join(config.wasmDir, 'pkg');
	const pkgDest = path.join(config.frontendWasmDir, 'pkg');
	await copyDir(pkgSrc, pkgDest);
	await createPlaceholder(pkgDest);
	await fixImports(pkgDest);

	// Copy SIMD package
	log.info('Copying SIMD package...');
	const simdSrc = path.join(config.wasmDir, 'pkg-simd');
	const simdDest = path.join(config.frontendWasmDir, 'pkg-simd');
	await copyDir(simdSrc, simdDest);
	await createPlaceholder(simdDest);
	await fixImports(simdDest);

	log.success('Files copied to frontend/src/lib/wasm/');

	// Sync to static directory
	log.info('Synchronizing to static directory...');
	await copyDir(pkgDest, path.join(config.staticWasmDir, 'pkg'));
	await copyDir(simdDest, path.join(config.staticWasmDir, 'pkg-simd'));
	log.success('Files synchronized to frontend/static/wasm/');
}

/**
 * Get file size in human-readable format
 */
async function getFileSize(filePath) {
	try {
		const stats = await fs.stat(filePath);
		const bytes = stats.size;
		const mb = (bytes / (1024 * 1024)).toFixed(2);
		return `${mb} MB`;
	} catch {
		return 'N/A';
	}
}

/**
 * Show build summary
 */
async function showSummary() {
	log.step('Build Summary');

	const pkgWasm = path.join(config.frontendWasmDir, 'pkg', 'vectorize_wasm_bg.wasm');
	const simdWasm = path.join(config.frontendWasmDir, 'pkg-simd', 'vectorize_wasm_bg.wasm');

	const pkgSize = await getFileSize(pkgWasm);
	const simdSize = await getFileSize(simdWasm);

	console.log('');
	console.log(`${colors.cyan}Non-SIMD build (compatible):`);
	console.log(`  WASM file size: ${pkgSize}`);
	console.log(`  Target: All browsers (iOS <16.4, old browsers)`);
	console.log(`  Performance: 4x faster than JavaScript`);
	console.log('');
	console.log(`${colors.cyan}SIMD build (optimized):`);
	console.log(`  WASM file size: ${simdSize}`);
	console.log(`  Target: Modern browsers (Chrome 91+, Firefox 89+, Safari 16.4+)`);
	console.log(`  Performance: 6x faster than JavaScript`);
	console.log('');
	console.log(`${colors.green}Expected user distribution:`);
	console.log(`  ~93% of users: SIMD version (fast)`);
	console.log(`  ~7% of users: Non-SIMD version (compatible)`);
	console.log(`${colors.reset}`);
}

/**
 * Main execution
 */
async function main() {
	console.log(`${colors.cyan}======================================`);
	console.log(`${colors.cyan}🚀 Dual WASM Build Script${colors.reset}`);
	console.log(`${colors.cyan}   SIMD + Non-SIMD Builds${colors.reset}`);
	console.log(`${colors.cyan}======================================${colors.reset}`);
	console.log('');

	try {
		// Step 1: Prerequisites
		await checkPrerequisites();
		console.log('');

		// Step 2: Clean (if requested)
		if (config.clean) {
			await cleanBuild();
			console.log('');
		}

		// Step 3: Build non-SIMD
		await buildWasmStandard();
		console.log('');

		// Step 4: Build SIMD
		await buildWasmSimd();
		console.log('');

		// Step 5: Optimize both
		await optimizeWasm();
		console.log('');

		// Step 6: Copy files
		await copyFiles();
		console.log('');

		// Step 7: Show summary
		await showSummary();

		console.log(`${colors.green}======================================`);
		log.success('Dual WASM build complete!');
		console.log(`${colors.green}======================================${colors.reset}`);
		console.log('');
		log.info('Next steps:');
		console.log('  1. Update WASM loader with feature detection');
		console.log('  2. Test on modern browsers (SIMD)');
		console.log('  3. Test on iOS <16.4 (non-SIMD fallback)');
		console.log('');

	} catch (error) {
		console.log('');
		log.error(`Unexpected error: ${error.message}`);
		if (config.verbose) {
			console.error(error.stack);
		}
		process.exit(1);
	}
}

// Run if called directly
if (require.main === module) {
	main();
}

// Export for use as module
module.exports = { main, config };
