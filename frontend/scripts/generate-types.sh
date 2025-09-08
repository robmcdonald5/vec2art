#!/bin/bash

# Generate TypeScript types from Rust parameter registry
# This script regenerates the frontend type definitions from the Rust backend

echo "🔄 Generating TypeScript types from Rust parameter registry..."

# Navigate to the Rust core directory
cd ../wasm/vectorize-core

# Generate types using our Rust binary
cargo run --bin generate-types --quiet -- ../../frontend/src/lib/types/generated-parameters.ts

# Check if generation was successful
if [ $? -eq 0 ]; then
    echo "✅ TypeScript types generated successfully to: src/lib/types/generated-parameters.ts"
    echo "📄 File contains:"
    echo "   • VectorizerConfig interface with all parameters"
    echo "   • Backend-specific configuration interfaces"
    echo "   • Runtime parameter metadata"
    echo "   • Utility functions for validation"
else
    echo "❌ Failed to generate TypeScript types"
    exit 1
fi

# Return to frontend directory
cd ../../frontend

echo "🏁 Type generation complete!"