#!/bin/bash
# Complete WASM rebuild script with all required fixes
# Run from project root: ./rebuild-wasm.sh

set -e  # Exit on any error

echo "🔧 Building WASM module with multithreading..."
cd wasm/vectorize-wasm

# Build the WASM module
wasm-pack build --target web --out-dir pkg --features wasm-parallel

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    echo "📁 Copying files from pkg/ to frontend..."
    cp pkg/vectorize_wasm.js ../../frontend/src/lib/wasm/
    cp pkg/vectorize_wasm.d.ts ../../frontend/src/lib/wasm/
    cp pkg/vectorize_wasm_bg.wasm ../../frontend/src/lib/wasm/
    cp pkg/vectorize_wasm_bg.wasm.d.ts ../../frontend/src/lib/wasm/
    cp -r pkg/snippets/ ../../frontend/src/lib/wasm/
    
    echo "🔧 CRITICAL: Applying all required import fixes..."
    cd ../../frontend/src/lib/wasm
    
    # Fix 1a: Import statement at top of file
    echo "  → Fixing import statement..."
    sed -i "s|from '__wbindgen_placeholder__'|from './__wbindgen_placeholder__.js'|g" vectorize_wasm.js
    
    # Fix 1b: Main WASM import keys in imports object
    echo "  → Fixing import object keys..."
    sed -i "s|imports\\['\\./__wbindgen_placeholder__\\.js'\\]|imports['__wbindgen_placeholder__']|g" vectorize_wasm.js
    
    # Fix 2: Worker helper imports
    echo "  → Fixing worker helper imports..."
    find snippets/ -name "workerHelpers.js" -exec sed -i "s|from '\\.\\.\\/\\.\\.\\/\\.\\.'|from '../../../vectorize_wasm.js'|g" {} \;
    
    # Fix 3: Worker context check
    echo "  → Fixing worker context check..."
    find snippets/ -name "workerHelpers.js" -exec sed -i 's|if (name === "wasm_bindgen_worker")|if (typeof self !== '\''undefined'\'' \&\& self.name === "wasm_bindgen_worker")|g' {} \;
    
    # Fix 4: Clean up corrupted TypeScript definitions (wasm-bindgen bug with complex symbols)
    echo "  → Cleaning TypeScript definitions..."
    if grep -q "_ZN.*\$.*E:" vectorize_wasm.d.ts; then
        echo "    ⚠️  Detected corrupted TypeScript definitions, fixing..."
        # Remove problematic symbol definitions that cause TypeScript parsing errors
        sed -i '/readonly _ZN.*\$.*E:/d' vectorize_wasm.d.ts
        # Also remove any malformed interface entries
        sed -i '/^[[:space:]]*readonly.*\$.*:.*$/d' vectorize_wasm.d.ts
        echo "    ✅ TypeScript definitions cleaned"
    else
        echo "    ✅ TypeScript definitions are clean"
    fi
    
    echo "📁 Synchronizing to static directory..."
    cd ../../../
    mkdir -p static/wasm
    cp -r src/lib/wasm/* static/wasm/
    
    echo "🎉 WASM rebuild complete with all fixes applied!"
    echo "✅ All import paths fixed automatically"
    echo "✅ Worker helpers fixed"
    echo "✅ Files synchronized to static directory"
    echo ""
    echo "ℹ️  Changes deployed to:"
    echo "   • frontend/src/lib/wasm/ (source)"
    echo "   • frontend/static/wasm/ (static serving)"
    echo ""
    echo "🚀 Ready to test!"
else
    echo "❌ Build failed!"
    exit 1
fi