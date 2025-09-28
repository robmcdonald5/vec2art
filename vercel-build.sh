#!/bin/bash

# Vercel-specific build script that uses pre-built WASM artifacts
# This avoids build-time WASM compilation in Vercel's environment

echo "🚀 Vercel Build: Using pre-built WASM artifacts"

# Change to frontend directory
cd frontend

# Verify WASM artifacts exist
if [ ! -f "src/lib/wasm/vectorize_wasm.wasm" ]; then
    echo "⚠️  WASM artifacts missing, attempting minimal rebuild..."

    # Try to copy from static if they exist there
    if [ -f "static/wasm/vectorize_wasm_bg.wasm" ]; then
        echo "📦 Copying WASM artifacts from static directory..."
        mkdir -p src/lib/wasm
        cp static/wasm/* src/lib/wasm/ 2>/dev/null || true
    else
        echo "❌ No WASM artifacts found. Build may fail."
    fi
else
    echo "✅ WASM artifacts found"
fi

# Build frontend only
echo "🔨 Building SvelteKit application..."
npm run build:frontend-only

echo "✅ Vercel build complete"