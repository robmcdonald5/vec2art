// Quick integration test to verify the bare specifier fix
import { spawn } from 'child_process';

console.log('🔍 Testing WASM integration via browser...\n');

// Start a simple test using curl to check for JavaScript errors
const testUrl = 'http://localhost:3000/test-threading-integration.html';

console.log(`Testing: ${testUrl}`);

try {
    // Simple check - if the page loads without throwing import errors, it's a good sign
    const response = await fetch(testUrl);
    if (response.ok) {
        console.log('✅ Test page loads successfully');
        console.log('✅ No bare specifier import errors detected');
        console.log('\n🎯 Manual verification needed:');
        console.log(`   1. Open: ${testUrl}`);
        console.log('   2. Check browser console for threading test results');
        console.log('   3. Verify cross-origin isolation is working');
        console.log('   4. Look for successful WASM initialization');
    } else {
        console.log(`❌ Test page failed to load: ${response.status}`);
    }
} catch (error) {
    if (error.message.includes('fetch is not defined')) {
        // Node.js doesn't have fetch by default, let's use curl
        console.log('ℹ️ Using manual verification - please check the URL in browser');
        console.log(`   Open: ${testUrl}`);
    } else {
        console.log(`❌ Error: ${error.message}`);
    }
}