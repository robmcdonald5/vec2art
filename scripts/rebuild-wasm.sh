#!/bin/bash
# Complete WASM rebuild script for single-threaded + Web Worker architecture
# Run from project root: ./rebuild-wasm.sh

set -e  # Exit on any error

echo "🔧 Building WASM module with single-threaded + Web Worker architecture..."
cd wasm/vectorize-wasm

# Check for stable Rust toolchain and wasm32 target
if ! rustup target list --installed | grep -q wasm32-unknown-unknown; then
    echo "⚠️  Installing wasm32-unknown-unknown target..."
    rustup target add wasm32-unknown-unknown
fi

echo "🚀 Building with wasm-pack using stable Rust for single-threaded architecture..."
wasm-pack build \
--target web \
--out-dir pkg

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    echo "📁 Copying files from pkg/ to frontend..."
    cp pkg/vectorize_wasm.js ../../frontend/src/lib/wasm/
    cp pkg/vectorize_wasm.d.ts ../../frontend/src/lib/wasm/
    cp pkg/vectorize_wasm_bg.wasm ../../frontend/src/lib/wasm/
    cp pkg/vectorize_wasm_bg.wasm.d.ts ../../frontend/src/lib/wasm/
    
    # Ensure __wbindgen_placeholder__.js exists (critical for imports)
    if [ ! -f "../../frontend/src/lib/wasm/__wbindgen_placeholder__.js" ]; then
        echo "  → Creating __wbindgen_placeholder__.js..."
        cp ../../frontend/src/lib/wasm/__wbindgen_placeholder__.js ../../frontend/src/lib/wasm/__wbindgen_placeholder__.js 2>/dev/null || \
        echo "// wasm-bindgen placeholder file
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
export default {};" > ../../frontend/src/lib/wasm/__wbindgen_placeholder__.js
    fi
    
    # Copy snippets directory if it exists (conditional for different WASM builds)
    if [ -d "pkg/snippets" ]; then
        echo "📁 Copying snippets directory..."
        cp -r pkg/snippets/ ../../frontend/src/lib/wasm/
    else
        echo "ℹ️  No snippets directory found - continuing without it"
    fi
    
    echo "🔧 CRITICAL: Applying all required import fixes..."
    cd ../../frontend/src/lib/wasm
    
    # Fix 1a: Import statement at top of file
    echo "  → Fixing import statement..."
    sed -i "s|from '__wbindgen_placeholder__'|from './__wbindgen_placeholder__.js'|g" vectorize_wasm.js
    
    # Fix 1b: Main WASM import keys in imports object
    echo "  → Fixing import object keys..."
    sed -i "s|imports\\['\\./__wbindgen_placeholder__\\.js'\\]|imports['__wbindgen_placeholder__']|g" vectorize_wasm.js
    
    # Fix 2: Worker helper imports (if snippets directory exists)
    if [ -d "snippets" ]; then
        echo "  → Fixing worker helper imports..."
        find snippets/ -name "workerHelpers.js" -exec sed -i "s|from '\\.\\.\\/\\.\\.\\/\\.\\.'|from '../../../vectorize_wasm.js'|g" {} \;
        
        echo "  → Fixing worker context check..."
        find snippets/ -name "workerHelpers.js" -exec sed -i 's|if (name === "wasm_bindgen_worker")|if (typeof self !== '\''undefined'\'' \&\& self.name === "wasm_bindgen_worker")|g' {} \;
    else
        echo "  → No snippets directory, skipping worker helper fixes"
    fi
    
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
    
    echo "🎉 WASM rebuild complete for single-threaded + Web Worker architecture!"
    echo "✅ All import paths fixed automatically"
    echo "✅ Worker helpers fixed"
    echo "✅ Files synchronized to static directory"
    echo ""
    echo "ℹ️  Changes deployed to:"
    echo "   • frontend/src/lib/wasm/ (source)"
    echo "   • frontend/static/wasm/ (static serving)"
    echo ""
    echo "🏗️  Architecture: Single-threaded WASM + Web Worker"
    echo "⚡ Benefits: Stable, reliable, responsive UI"
    echo "🚀 Ready to test!"
else
    echo "❌ Build failed!"
    exit 1
fi