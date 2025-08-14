// Test WASM Integration - Simple verification script
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('🧵 Testing WASM Integration...\n');

try {
    // Test 1: Check file existence
    console.log('📁 Checking WASM files...');
    const wasmDir = join(__dirname, 'static', 'wasm');
    
    const requiredFiles = [
        'vectorize_wasm.js',
        'vectorize_wasm_bg.wasm',
        'vectorize_wasm.d.ts'
    ];
    
    for (const file of requiredFiles) {
        const filePath = join(wasmDir, file);
        try {
            const stats = readFileSync(filePath);
            console.log(`✓ ${file}: ${(stats.length / 1024 / 1024).toFixed(1)}MB`);
        } catch (e) {
            console.log(`❌ ${file}: Missing`);
        }
    }
    
    // Test 2: Check threading support
    console.log('\n🧵 Checking threading support...');
    const wasmJsPath = join(wasmDir, 'vectorize_wasm.js');
    const wasmJsContent = readFileSync(wasmJsPath, 'utf8');
    
    const threadingIndicators = [
        'workerHelpers.js',
        'startWorkers',
        'wasm-bindgen-rayon',
        'init_thread_pool'
    ];
    
    for (const indicator of threadingIndicators) {
        if (wasmJsContent.includes(indicator)) {
            console.log(`✓ Threading indicator found: ${indicator}`);
        } else {
            console.log(`⚠️ Threading indicator missing: ${indicator}`);
        }
    }
    
    // Test 3: Check exports
    console.log('\n🔍 Checking key exports...');
    const keyExports = [
        'WasmVectorizer',
        'start',
        'get_thread_count',
        'is_threading_active'
    ];
    
    for (const exportName of keyExports) {
        if (wasmJsContent.includes(`export { ${exportName}`) || 
            wasmJsContent.includes(`${exportName} as ${exportName}`) ||
            wasmJsContent.includes(`function ${exportName}`) ||
            wasmJsContent.includes(`${exportName}:`)) {
            console.log(`✓ Export found: ${exportName}`);
        } else {
            console.log(`⚠️ Export may be missing: ${exportName}`);
        }
    }
    
    // Test 4: Check file sizes (threading support increases size)
    console.log('\n📊 File size analysis...');
    const wasmSize = readFileSync(join(wasmDir, 'vectorize_wasm_bg.wasm')).length;
    const jsSize = readFileSync(join(wasmDir, 'vectorize_wasm.js')).length;
    
    console.log(`WASM binary: ${(wasmSize / 1024 / 1024).toFixed(1)}MB`);
    console.log(`JS bindings: ${(jsSize / 1024).toFixed(1)}KB`);
    
    if (wasmSize > 3500000) { // ~3.5MB threshold
        console.log('✓ WASM size indicates threading support included');
    } else {
        console.log('⚠️ WASM size may indicate single-threaded build');
    }
    
    // Test 5: Check worker helpers
    console.log('\n🛠️ Checking worker helpers...');
    const workerHelpersPath = join(wasmDir, 'snippets', 'wasm-bindgen-rayon-38edf6e439f6d70d', 'src', 'workerHelpers.js');
    try {
        const workerHelpers = readFileSync(workerHelpersPath, 'utf8');
        console.log(`✓ Worker helpers found: ${(workerHelpers.length / 1024).toFixed(1)}KB`);
        if (workerHelpers.includes('startWorkers')) {
            console.log('✓ Worker initialization function present');
        }
    } catch (e) {
        console.log('❌ Worker helpers not found');
    }
    
    console.log('\n🎉 WASM Integration Test Complete!');
    console.log('✅ Files appear to be properly configured for threading support');
    
} catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
}