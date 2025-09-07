#!/bin/bash
# Vercel Deployment Build Script
# This script ensures WASM is built before the frontend build on Vercel
set -e

echo "🚀 Starting Vercel deployment build process..."

# Check if we're in the correct directory
if [ ! -f "rebuild-wasm.sh" ]; then
    echo "❌ rebuild-wasm.sh not found. Make sure this script is run from the project root."
    exit 1
fi

# Install Rust and wasm-pack if not available
if ! command -v rustc &> /dev/null; then
    echo "🦀 Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source $HOME/.cargo/env
    rustup target add wasm32-unknown-unknown
fi

if ! command -v wasm-pack &> /dev/null; then
    echo "📦 Installing wasm-pack..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Ensure tools are in PATH
export PATH="$HOME/.cargo/bin:$PATH"

# Verify tools are available
echo "🔍 Verifying build tools..."
rustc --version
wasm-pack --version

# Build WASM
echo "🔧 Building WASM module..."
chmod +x ./rebuild-wasm.sh
./rebuild-wasm.sh

# Verify WASM files exist
echo "✅ Verifying WASM build output..."
required_files=(
    "frontend/src/lib/wasm/vectorize_wasm.js"
    "frontend/src/lib/wasm/vectorize_wasm_bg.wasm"
    "frontend/static/wasm/vectorize_wasm.js"
    "frontend/static/wasm/vectorize_wasm_bg.wasm"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Required file missing: $file"
        exit 1
    fi
    echo "✅ $file exists"
done

echo "🎉 WASM build completed successfully for Vercel deployment!"