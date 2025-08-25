#!/usr/bin/env node

/**
 * Fix WASM TypeScript definitions by quoting Rust mangled symbols
 * Based on Rust symbol mangling where $LT$ = < and $GT$ = >
 */

const fs = require('fs');
const path = require('path');

const WASM_TYPES_PATH = path.join(__dirname, '..', 'src', 'lib', 'wasm', 'vectorize_wasm.d.ts');

try {
	let content = fs.readFileSync(WASM_TYPES_PATH, 'utf8');

	console.log('🔧 Fixing WASM TypeScript definitions...');

	// Count problematic lines before fix
	const beforeCount = (content.match(/readonly [^"]*\$LT\$.*\$GT\$[^:]*:/g) || []).length;
	console.log(`   Found ${beforeCount} problematic symbol definitions`);

	// Fix: Quote property names containing Rust mangled symbols ($LT$, $GT$, etc.)
	// Only quote properties that actually contain $ symbols (mangled symbols)
	content = content.replace(/readonly ([_a-zA-Z][^:]*\$[^:]*): /g, 'readonly "$1": ');

	// Count fixed lines
	const afterCount = (content.match(/readonly "[^"]*\$[^"]*": /g) || []).length;

	fs.writeFileSync(WASM_TYPES_PATH, content);

	console.log(`✅ Fixed ${afterCount} TypeScript symbol definitions`);
	console.log('   Rust mangled symbols ($LT$, $GT$) are now properly quoted');
} catch (error) {
	console.error('❌ Error fixing WASM types:', error.message);
	process.exit(1);
}
