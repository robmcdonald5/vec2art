#!/usr/bin/env node

/**
 * Enhanced WASM rebuild script for Node.js
 * Provides complete automation of WASM build process with all import fixes
 * Can be run directly or integrated into npm scripts
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
  cyan: '\x1b[36m'
};

// Logging helpers
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.error(`${colors.red}❌ ${msg}${colors.reset}`)
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
 * Check and install prerequisites
 */
async function checkPrerequisites() {
  log.info('Checking prerequisites...');

  // Check for Rust
  if (!await commandExists('rustc')) {
    log.warning('Rust not found. Installing...');
    try {
      // Install Rust
      await execAsync('curl --proto \'=https\' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y');

      // Source cargo environment
      const cargoPath = `${process.env.HOME}/.cargo/bin`;
      process.env.PATH = `${cargoPath}:${process.env.PATH}`;

      // Add wasm32 target
      await execAsync('rustup target add wasm32-unknown-unknown');
      log.success('Rust installed');
    } catch (error) {
      log.error('Failed to install Rust: ' + error.message);
      process.exit(1);
    }
  }

  // Check for wasm-pack
  if (!await commandExists('wasm-pack')) {
    log.warning('wasm-pack not found. Installing...');
    try {
      await execAsync('curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh');
      log.success('wasm-pack installed');
    } catch (error) {
      // Fallback to cargo install
      try {
        await execAsync('cargo install wasm-pack');
        log.success('wasm-pack installed via cargo');
      } catch (fallbackError) {
        log.error('Failed to install wasm-pack');
        process.exit(1);
      }
    }
  }

  // Ensure tools are in PATH
  const cargoPath = `${process.env.HOME}/.cargo/bin`;
  if (!process.env.PATH.includes(cargoPath)) {
    process.env.PATH = `${cargoPath}:${process.env.PATH}`;
  }

  // Verify tools are available
  try {
    const { stdout: rustVersion } = await execAsync('rustc --version');
    const { stdout: wasmVersion } = await execAsync('wasm-pack --version');
    log.info(`Rust: ${rustVersion.trim()}`);
    log.info(`wasm-pack: ${wasmVersion.trim()}`);
  } catch (error) {
    log.error('Failed to verify build tools: ' + error.message);
    process.exit(1);
  }

  // Check for wasm32 target
  try {
    const { stdout } = await execAsync('rustup target list --installed');
    if (!stdout.includes('wasm32-unknown-unknown')) {
      log.warning('Installing wasm32-unknown-unknown target...');
      await execAsync('rustup target add wasm32-unknown-unknown');
      log.success('wasm32 target installed');
    }
  } catch (error) {
    log.error('Failed to check/install wasm32 target');
    process.exit(1);
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
    path.join(config.wasmDir, 'pkg')
  ];

  for (const dir of dirsToClean) {
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist, that's fine
    }
  }

  // Clean WASM files from frontend
  try {
    const files = await fs.readdir(config.frontendWasmDir);
    for (const file of files) {
      if (file.endsWith('.wasm') || file.endsWith('.js') || file.endsWith('.d.ts')) {
        await fs.unlink(path.join(config.frontendWasmDir, file));
      }
    }
  } catch (error) {
    // Directory might not exist yet
  }

  log.success('Clean complete');
}

/**
 * Build WASM module
 */
async function buildWasm() {
  log.info('Building WASM module...');

  const buildCmd = 'wasm-pack build --no-opt --target web --out-dir pkg --features wasm-base';

  try {
    const { stdout, stderr } = await execAsync(buildCmd, { cwd: config.wasmDir });

    if (config.verbose) {
      console.log(stdout);
      if (stderr) console.error(stderr);
    }

    log.success('WASM build complete');
  } catch (error) {
    log.error('Build failed!');
    console.error(error.message);
    process.exit(1);
  }
}

/**
 * Fix import paths in JavaScript files
 */
async function fixImports() {
  log.info('Applying comprehensive import fixes...');

  // Fix main JavaScript file
  const jsFile = path.join(config.frontendWasmDir, 'vectorize_wasm.js');

  try {
    let content = await fs.readFile(jsFile, 'utf8');

    // Fix import statements
    content = content.replace(/from '__wbindgen_placeholder__'/g, "from './__wbindgen_placeholder__.js'");
    content = content.replace(/imports\['\.\/\_\_wbindgen\_placeholder\_\_\.js'\]/g, "imports['__wbindgen_placeholder__']");
    content = content.replace(/import \* as wbg from '__wbindgen_placeholder__'/g, "import * as wbg from './__wbindgen_placeholder__.js'");

    await fs.writeFile(jsFile, content);
    log.success('Main imports fixed');
  } catch (error) {
    log.warning('Could not fix main imports: ' + error.message);
  }

  // Fix worker helpers in snippets
  const snippetsDir = path.join(config.frontendWasmDir, 'snippets');

  try {
    const files = await findFiles(snippetsDir, '.js');

    for (const file of files) {
      let content = await fs.readFile(file, 'utf8');

      // Fix relative imports
      content = content.replace(/from '\.\.\/\.\.\/\.\.\/'/g, "from '../../../vectorize_wasm.js'");
      content = content.replace(/from '\.\.\/\.\.\/\.\.'/g, "from '../../../vectorize_wasm.js'");

      // Fix worker context checks
      content = content.replace(/if \(name === "wasm_bindgen_worker"\)/g, 'if (typeof self !== "undefined" && self.name === "wasm_bindgen_worker")');

      // Fix URL imports
      content = content.replace(/new URL\('vectorize_wasm_bg\.wasm', import\.meta\.url\)/g, "new URL('./vectorize_wasm_bg.wasm', import.meta.url)");

      await fs.writeFile(file, content);
    }

    if (files.length > 0) {
      log.success('Worker helpers fixed');
    }
  } catch (error) {
    // Snippets directory might not exist
  }

  // Fix TypeScript import paths in generated types
  try {
    const typesDir = path.join('frontend', 'src', 'lib', 'types', 'generated');
    const typesFiles = await fs.readdir(typesDir);

    for (const file of typesFiles.filter(f => f.endsWith('.ts'))) {
      const filePath = path.join(typesDir, file);
      let content = await fs.readFile(filePath, 'utf8');

      // Fix any incorrect relative paths that go up directories
      // This catches both types of incorrect paths in one comprehensive regex:
      // - "..\\..\\..\\..\\..\\wasm\\vectorize-wasm\\bindings\\FileName"
      // - "..\\..\\..\\..\\..\\..\\frontend\\src\\lib\\types\\generated\\FileName"
      // All should become: "./FileName"
      content = content.replace(/"\.\.[\\\/]+.*[\\\/]([^\\\/\\"]+)"/g, '"./$1"');

      await fs.writeFile(filePath, content);
    }

    log.success('TypeScript imports fixed');
  } catch (error) {
    log.warning('Could not fix TypeScript imports: ' + error.message);
  }

  // Clean TypeScript definitions
  const dtsFile = path.join(config.frontendWasmDir, 'vectorize_wasm.d.ts');

  try {
    let content = await fs.readFile(dtsFile, 'utf8');

    // Remove corrupted definitions
    content = content.replace(/readonly _ZN.*\$.*E:.*\n/g, '');
    content = content.replace(/^\s*readonly.*\$.*:.*$/gm, '');

    // Fix malformed generics
    content = content.replace(/<\s*>/g, '<unknown>');

    await fs.writeFile(dtsFile, content);
    log.success('TypeScript definitions cleaned');
  } catch (error) {
    log.warning('Could not clean TypeScript definitions: ' + error.message);
  }
}

/**
 * Create placeholder file
 */
async function createPlaceholder() {
  log.info('Creating __wbindgen_placeholder__.js...');

  const placeholderContent = `// wasm-bindgen placeholder file
// Auto-generated by rebuild-wasm.js
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

  const placeholderPath = path.join(config.frontendWasmDir, '__wbindgen_placeholder__.js');
  await fs.writeFile(placeholderPath, placeholderContent);

  log.success('Placeholder file created');
}

/**
 * Copy files to destination
 */
async function copyFiles() {
  log.info('Copying files to frontend...');

  // Ensure directories exist
  await fs.mkdir(config.frontendWasmDir, { recursive: true });
  await fs.mkdir(config.staticWasmDir, { recursive: true });

  // Files to copy
  const files = [
    'vectorize_wasm.js',
    'vectorize_wasm.d.ts',
    'vectorize_wasm_bg.wasm',
    'vectorize_wasm_bg.wasm.d.ts'
  ];

  // Copy main files
  for (const file of files) {
    const src = path.join(config.wasmDir, 'pkg', file);
    const dest = path.join(config.frontendWasmDir, file);

    try {
      await fs.copyFile(src, dest);
    } catch (error) {
      log.error(`Failed to copy ${file}: ${error.message}`);
    }
  }

  // Copy snippets directory if it exists
  const snippetsSrc = path.join(config.wasmDir, 'pkg', 'snippets');
  const snippetsDest = path.join(config.frontendWasmDir, 'snippets');

  try {
    await copyDir(snippetsSrc, snippetsDest);
  } catch (error) {
    // Snippets might not exist
  }

  log.success('Files copied to frontend/src/lib/wasm/');

  // Sync to static directory
  log.info('Synchronizing to static directory...');
  await copyDir(config.frontendWasmDir, config.staticWasmDir);
  log.success('Files synchronized to frontend/static/wasm/');
}

/**
 * Verify the build
 */
async function verifyBuild() {
  log.info('Verifying build...');

  let errors = 0;

  // Check for required files
  const requiredFiles = [
    'vectorize_wasm.js',
    'vectorize_wasm.d.ts',
    'vectorize_wasm_bg.wasm',
    '__wbindgen_placeholder__.js'
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(config.frontendWasmDir, file);
    try {
      await fs.access(filePath);
    } catch {
      log.error(`Missing required file: ${file}`);
      errors++;
    }
  }

  // Check for unfixed imports
  try {
    const jsContent = await fs.readFile(path.join(config.frontendWasmDir, 'vectorize_wasm.js'), 'utf8');
    if (jsContent.includes("from '__wbindgen_placeholder__'")) {
      log.error('Unfixed imports found in vectorize_wasm.js');
      errors++;
    }
  } catch (error) {
    log.error('Could not verify imports');
    errors++;
  }

  if (errors > 0) {
    log.error(`Verification failed with ${errors} error(s)`);
    return false;
  }

  log.success('Build verification passed');
  return true;
}

/**
 * Helper: Find files recursively
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
 * Helper: Copy directory recursively
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
 * Main execution
 */
async function main() {
  console.log(`${colors.cyan}======================================`);
  console.log(`${colors.cyan}🚀 Enhanced WASM Rebuild Script (Node.js)${colors.reset}`);
  console.log(`${colors.cyan}======================================${colors.reset}`);
  console.log('');

  try {
    // Step 1: Prerequisites
    await checkPrerequisites();

    // Step 2: Clean (if requested)
    if (config.clean) {
      await cleanBuild();
    }

    // Step 3: Build
    await buildWasm();

    // Step 4: Copy files
    await copyFiles();

    // Step 5: Create placeholder
    await createPlaceholder();

    // Step 6: Fix imports
    await fixImports();

    // Step 7: Verify (unless skipped)
    if (!config.skipVerify) {
      const success = await verifyBuild();

      if (success) {
        console.log('');
        console.log(`${colors.green}======================================`);
        log.success('WASM rebuild complete!');
        console.log(`${colors.green}======================================${colors.reset}`);
        console.log('');
        log.info('Architecture: Single-threaded WASM + Web Worker');
        log.info('Files deployed to:');
        console.log('   • frontend/src/lib/wasm/ (source)');
        console.log('   • frontend/static/wasm/ (static serving)');
        console.log('');
        log.success('All import paths fixed automatically');
        log.success('Ready for testing!');
      } else {
        console.log('');
        log.error('Build completed with errors. Please review the output above.');
        process.exit(1);
      }
    } else {
      console.log('');
      log.success('Build complete (verification skipped)');
    }
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