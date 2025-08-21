#!/bin/bash
# WASM Rebuild Script with Web Worker Support
# This script rebuilds the WASM module and applies all necessary fixes

set -e  # Exit on error

echo "🔧 WASM Rebuild Script for Web Worker Pattern"
echo "============================================="
echo ""

# Navigate to WASM directory
cd vectorize-wasm

echo "📦 Building WASM module with parallel features..."
wasm-pack build --target web --out-dir pkg --features wasm-parallel

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    echo "📁 Copying files to frontend..."
    # Copy to lib/wasm for imports
    cp -r pkg/* ../../frontend/src/lib/wasm/
    
    # Copy to static/wasm for worker access
    cp -r pkg/* ../../frontend/static/wasm/
    
    echo "🔧 Applying critical import path fixes..."
    
    # Fix import path in lib/wasm
    cd ../../frontend/src/lib/wasm
    
    # Fix Line ~2: import path
    sed -i "s|from '__wbindgen_placeholder__'|from './__wbindgen_placeholder__.js'|g" vectorize_wasm.js
    
    # Fix Line ~8702: imports object key
    sed -i "s|imports\['./__wbindgen_placeholder__.js'\]|imports['__wbindgen_placeholder__']|g" vectorize_wasm.js
    
    # Fix worker helper
    if [ -d "snippets" ]; then
        for helper in snippets/wasm-bindgen-rayon-*/src/workerHelpers.js; do
            if [ -f "$helper" ]; then
                sed -i "s|if (name === \"wasm_bindgen_worker\")|if (typeof self !== 'undefined' \&\& self.name === \"wasm_bindgen_worker\")|g" "$helper"
            fi
        done
    fi
    
    # Apply same fixes to static/wasm
    cd ../../static/wasm
    
    sed -i "s|from '__wbindgen_placeholder__'|from './__wbindgen_placeholder__.js'|g" vectorize_wasm.js
    sed -i "s|imports\['./__wbindgen_placeholder__.js'\]|imports['__wbindgen_placeholder__']|g" vectorize_wasm.js
    
    if [ -d "snippets" ]; then
        for helper in snippets/wasm-bindgen-rayon-*/src/workerHelpers.js; do
            if [ -f "$helper" ]; then
                sed -i "s|if (name === \"wasm_bindgen_worker\")|if (typeof self !== 'undefined' \&\& self.name === \"wasm_bindgen_worker\")|g" "$helper"
            fi
        done
    fi
    
    echo "✅ All fixes applied!"
    echo ""
    echo "🎉 WASM REBUILD COMPLETE!"
    echo ""
    echo "📋 Verification Checklist:"
    echo "  ✓ WASM built with --features wasm-parallel"
    echo "  ✓ Files copied to frontend/src/lib/wasm/"
    echo "  ✓ Files copied to frontend/static/wasm/"
    echo "  ✓ Import paths fixed in vectorize_wasm.js"
    echo "  ✓ Worker helper fixed in workerHelpers.js"
    echo ""
    echo "🧪 Ready to test at: http://localhost:5173/converter"
    echo ""
    echo "Expected behavior:"
    echo "  - No browser freezing on page load"
    echo "  - WASM initializes in Web Worker"
    echo "  - Threading works without UI blocking"
    echo "  - Image processing remains responsive"
else
    echo "❌ Build failed!"
    exit 1
fi