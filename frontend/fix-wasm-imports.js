#!/usr/bin/env node

// Script to fix bare specifier imports in wasm-bindgen generated files
// This addresses the "__wbindgen_placeholder__" bare specifier issue

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const wasmDirs = [
    'src/lib/wasm',
    'src/lib/wasm/pkg', 
    'static/wasm'
];

function fixWasmImports() {
    console.log('🔧 Fixing WASM import issues...\n');
    
    let filesFixed = 0;
    
    for (const dir of wasmDirs) {
        const wasmJsPath = path.join(dir, 'vectorize_wasm.js');
        const placeholderPath = path.join(dir, '__wbindgen_placeholder__.js');
        
        // Check if WASM JS file exists
        if (fs.existsSync(wasmJsPath)) {
            console.log(`📁 Processing: ${wasmJsPath}`);
            
            // Read and fix the file
            let content = fs.readFileSync(wasmJsPath, 'utf8');
            const originalContent = content;
            
            // Fix bare specifier imports to use relative paths
            content = content.replace(
                /import \* as __wbg_star0 from '__wbindgen_placeholder__';/g,
                "import * as __wbg_star0 from './__wbindgen_placeholder__.js';"
            );
            
            // Fix relative workerHelpers import to absolute path
            content = content.replace(
                /import { startWorkers } from '\.\/snippets\/([^']+)';/g,
                "import { startWorkers } from '/wasm/snippets/$1';"
            );
            
            // Write back if changed
            if (content !== originalContent) {
                fs.writeFileSync(wasmJsPath, content, 'utf8');
                console.log(`  ✅ Fixed bare specifier import`);
                filesFixed++;
            } else {
                console.log(`  ℹ️ No changes needed`);
            }
            
            // Ensure placeholder file exists with proper stub functions
            if (!fs.existsSync(placeholderPath)) {
                const placeholderContent = `// wasm-bindgen placeholder file
// This file provides stub implementations for wasm-bindgen functions when not using a bundler
// Required for direct browser usage with --target web builds

// Core wasm-bindgen functions that WASM modules expect
export function __wbindgen_describe() {
    // Stub implementation - returns empty descriptor
    return 0;
}

export function __wbindgen_describe_closure() {
    // Stub implementation for closure descriptions
    return 0;
}

export function __wbindgen_string_new() {
    // Stub implementation for string creation
    return 0;
}

export function __wbindgen_number_new() {
    // Stub implementation for number creation  
    return 0;
}

export function __wbindgen_boolean_new() {
    // Stub implementation for boolean creation
    return 0;
}

export function __wbindgen_object_drop_ref() {
    // Stub implementation for object cleanup
}

export function __wbindgen_cb_drop() {
    // Stub implementation for callback cleanup
    return 0;
}

// Export empty default for compatibility
export default {};`;
                
                fs.writeFileSync(placeholderPath, placeholderContent, 'utf8');
                console.log(`  ✅ Created placeholder file with stub functions`);
                filesFixed++;
            } else {
                console.log(`  ✅ Placeholder file exists`);
            }
            
        } else {
            console.log(`📁 Skipping: ${wasmJsPath} (not found)`);
        }
        
        console.log('');
    }
    
    console.log(`🎉 Fix complete! ${filesFixed} files processed.\n`);
    console.log('💡 Run this script after each WASM rebuild to fix import issues.');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    fixWasmImports();
}

export { fixWasmImports };