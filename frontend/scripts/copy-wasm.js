#!/usr/bin/env node

/**
 * WASM Copy Script for Vercel Builds
 *
 * This script copies WASM files from the single source of truth (src/lib/wasm/)
 * to the locations needed for the build:
 * - src/lib/wasm/pkg-simd/ (for SIMD loader)
 * - static/wasm/ (for static serving)
 *
 * This allows us to only commit one copy of WASM files while still
 * having all necessary copies at build time.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m'
};

function log(msg) {
  console.log(`${colors.blue}[copy-wasm]${colors.reset} ${msg}`);
}

function success(msg) {
  console.log(`${colors.green}[copy-wasm] ✓${colors.reset} ${msg}`);
}

// Source directory (the one copy we commit to git)
const srcDir = path.join(__dirname, '..', 'src', 'lib', 'wasm');

// Files to copy
const wasmFiles = [
  'vectorize_wasm.js',
  'vectorize_wasm.d.ts',
  'vectorize_wasm_bg.wasm',
  'vectorize_wasm_bg.wasm.d.ts',
  '__wbindgen_placeholder__.js'
];

// Additional files/directories to copy
const additionalItems = [
  'snippets',
  'worker-load.js',
  'worker-load.d.ts',
  'wasm-memory-init.ts',
  'simd-detector.ts',
  'loader.ts',
  'init.ts',
  'index.ts',
  'loadWasm.ts'
];

/**
 * Copy a file if it exists
 */
function copyFileIfExists(src, dest) {
  try {
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      return true;
    }
  } catch (err) {
    console.warn(`Warning: Could not copy ${src}: ${err.message}`);
  }
  return false;
}

/**
 * Copy a directory recursively
 */
function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;

  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Main execution
 */
function main() {
  log('Copying WASM files for build...');

  // Verify source directory exists
  if (!fs.existsSync(srcDir)) {
    console.error(`Error: Source directory not found: ${srcDir}`);
    process.exit(1);
  }

  // Verify main WASM file exists
  const mainWasm = path.join(srcDir, 'vectorize_wasm_bg.wasm');
  if (!fs.existsSync(mainWasm)) {
    console.error(`Error: Main WASM file not found: ${mainWasm}`);
    console.error('Please run "npm run build:wasm" first to generate WASM files.');
    process.exit(1);
  }

  // 1. Create pkg-simd directory and copy WASM files
  const pkgSimdDir = path.join(srcDir, 'pkg-simd');
  log(`Creating ${path.relative(process.cwd(), pkgSimdDir)}/`);
  fs.mkdirSync(pkgSimdDir, { recursive: true });

  for (const file of wasmFiles) {
    const src = path.join(srcDir, file);
    const dest = path.join(pkgSimdDir, file);
    if (copyFileIfExists(src, dest)) {
      log(`  Copied ${file}`);
    }
  }
  success('pkg-simd/ created');

  // 2. Create static/wasm directory
  const staticWasmDir = path.join(__dirname, '..', 'static', 'wasm');
  log(`Creating ${path.relative(process.cwd(), staticWasmDir)}/`);
  fs.mkdirSync(staticWasmDir, { recursive: true });

  // Copy main WASM files to static
  for (const file of wasmFiles) {
    const src = path.join(srcDir, file);
    const dest = path.join(staticWasmDir, file);
    if (copyFileIfExists(src, dest)) {
      log(`  Copied ${file}`);
    }
  }

  // Copy additional files to static
  for (const item of additionalItems) {
    const src = path.join(srcDir, item);
    const dest = path.join(staticWasmDir, item);

    if (fs.existsSync(src)) {
      const stat = fs.statSync(src);
      if (stat.isDirectory()) {
        copyDirRecursive(src, dest);
        log(`  Copied ${item}/`);
      } else {
        fs.copyFileSync(src, dest);
        log(`  Copied ${item}`);
      }
    }
  }

  // 3. Create pkg-simd in static/wasm as well
  const staticPkgSimdDir = path.join(staticWasmDir, 'pkg-simd');
  fs.mkdirSync(staticPkgSimdDir, { recursive: true });
  for (const file of wasmFiles) {
    const src = path.join(srcDir, file);
    const dest = path.join(staticPkgSimdDir, file);
    copyFileIfExists(src, dest);
  }
  log('  Created pkg-simd/ in static');

  success('static/wasm/ created');

  // Summary
  const wasmSize = fs.statSync(mainWasm).size;
  const sizeMB = (wasmSize / (1024 * 1024)).toFixed(1);
  console.log('');
  success(`WASM files copied successfully (${sizeMB} MB)`);
}

main();
