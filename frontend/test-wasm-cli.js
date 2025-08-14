/**
 * CLI test for WASM integration
 * Run with: node test-wasm-cli.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testWasmModule() {
    console.log('🧪 Testing WASM Module Integration...\n');
    
    try {
        // Check if WASM package exists
        const pkgPath = path.join(__dirname, '../wasm/vectorize-wasm/pkg');
        
        if (!fs.existsSync(pkgPath)) {
            throw new Error('WASM package not found at expected path');
        }
        
        console.log('✅ WASM package found');
        
        // Check for required files
        const requiredFiles = [
            'vectorize_wasm.js',
            'vectorize_wasm_bg.wasm',
            'vectorize_wasm.d.ts',
            'package.json'
        ];
        
        for (const file of requiredFiles) {
            const filePath = path.join(pkgPath, file);
            if (!fs.existsSync(filePath)) {
                throw new Error(`Missing required file: ${file}`);
            }
            const stats = fs.statSync(filePath);
            console.log(`✅ ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
        }
        
        // Load and check package.json
        const packageJson = JSON.parse(
            fs.readFileSync(path.join(pkgPath, 'package.json'), 'utf-8')
        );
        
        console.log(`\n📦 Package: ${packageJson.name} v${packageJson.version}`);
        console.log(`📝 Module: ${packageJson.module}`);
        console.log(`🔧 Types: ${packageJson.types}`);
        
        // Check WASM file size
        const wasmPath = path.join(pkgPath, 'vectorize_wasm_bg.wasm');
        const wasmStats = fs.statSync(wasmPath);
        const wasmSizeMB = wasmStats.size / (1024 * 1024);
        
        console.log(`\n🎯 WASM Module Size: ${wasmSizeMB.toFixed(2)} MB`);
        
        if (wasmSizeMB > 5) {
            console.log('⚠️  Warning: WASM module is larger than 5MB, may affect loading time');
        }
        
        // Check TypeScript definitions
        const dtsContent = fs.readFileSync(
            path.join(pkgPath, 'vectorize_wasm.d.ts'), 
            'utf-8'
        );
        
        const exports = dtsContent.match(/export \w+/g) || [];
        console.log(`\n📚 TypeScript Exports: ${exports.length} definitions`);
        
        // Check for key exports
        const keyExports = ['WasmVectorizer', 'WasmBackend', 'WasmPreset'];
        for (const exportName of keyExports) {
            if (dtsContent.includes(`export ${exportName}`) || 
                dtsContent.includes(`class ${exportName}`)) {
                console.log(`✅ Found ${exportName}`);
            } else {
                console.log(`❌ Missing ${exportName}`);
            }
        }
        
        // Check for threading support functions
        const threadingFunctions = [
            'init_threading',
            'is_threading_supported',
            'get_thread_count'
        ];
        
        console.log('\n🔄 Threading Support:');
        for (const func of threadingFunctions) {
            if (dtsContent.includes(func)) {
                console.log(`✅ ${func}()`);
            } else {
                console.log(`❌ ${func}() not found`);
            }
        }
        
        console.log('\n✨ WASM module integration test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run the test
testWasmModule();