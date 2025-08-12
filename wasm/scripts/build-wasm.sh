#!/usr/bin/env bash
# Single-threaded WASM build script for vec2art line tracing engine
# Builds the vectorize-wasm crate with optimizations for browser deployment
#
# NOTE: This script builds SINGLE-THREADED WASM for maximum browser compatibility.
# For MULTI-THREADED WASM with SharedArrayBuffer support, use: ./build-wasm-mt.sh

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WASM_CRATE_DIR="${PROJECT_ROOT}/vectorize-wasm"
PKG_DIR="${WASM_CRATE_DIR}/pkg"

# Default build mode
BUILD_MODE="${1:-release}"
ENABLE_SIMD="${2:-true}"
RUN_WASM_OPT="${3:-true}"

echo -e "${BLUE}=== vec2art Single-threaded WASM Build Script ===${NC}"
echo -e "Project root: ${PROJECT_ROOT}"
echo -e "WASM crate: ${WASM_CRATE_DIR}"
echo -e "Build mode: ${BUILD_MODE}"
echo -e "Enable SIMD: ${ENABLE_SIMD}"
echo -e "Run wasm-opt: ${RUN_WASM_OPT}"
echo ""

# Validate build mode
if [[ "${BUILD_MODE}" != "debug" && "${BUILD_MODE}" != "release" ]]; then
    echo -e "${RED}Error: Build mode must be 'debug' or 'release'${NC}"
    exit 1
fi

# Check for required tools
echo -e "${YELLOW}Checking required tools...${NC}"

if ! command -v wasm-pack &> /dev/null; then
    echo -e "${RED}Error: wasm-pack is not installed${NC}"
    echo "Install with: curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh"
    exit 1
fi

if [[ "${RUN_WASM_OPT}" == "true" ]] && ! command -v wasm-opt &> /dev/null; then
    echo -e "${YELLOW}Warning: wasm-opt not found, skipping optimization${NC}"
    echo "Install with: npm install -g binaryen"
    RUN_WASM_OPT="false"
fi

echo -e "${GREEN}✓ All required tools available${NC}"

# Clean previous build
if [[ -d "${PKG_DIR}" ]]; then
    echo -e "${YELLOW}Cleaning previous build...${NC}"
    rm -rf "${PKG_DIR}"
fi

# Set up WASM target and flags
echo -e "${YELLOW}Setting up WASM build environment...${NC}"

# Ensure wasm32-unknown-unknown target is installed
rustup target add wasm32-unknown-unknown

# Prepare wasm-pack command
WASM_PACK_ARGS=(
    "build"
    "--target" "web"
    "--out-dir" "pkg"
    "${WASM_CRATE_DIR}"
)

# Add build mode
if [[ "${BUILD_MODE}" == "release" ]]; then
    WASM_PACK_ARGS+=("--release")
else
    WASM_PACK_ARGS+=("--dev")
fi

# Set up feature flags and environment
export RUSTFLAGS=""
FEATURES=""

# Enable SIMD if requested
if [[ "${ENABLE_SIMD}" == "true" ]]; then
    export RUSTFLAGS="${RUSTFLAGS} -C target-feature=+simd128"
    FEATURES="simd"
    echo -e "${GREEN}✓ SIMD enabled${NC}"
fi

# Add features to wasm-pack command if any
if [[ -n "${FEATURES}" ]]; then
    WASM_PACK_ARGS+=("--" "--features" "${FEATURES}")
fi

# Build with wasm-pack
echo -e "${YELLOW}Building single-threaded WASM module...${NC}"
echo "Command: wasm-pack ${WASM_PACK_ARGS[*]}"

if wasm-pack "${WASM_PACK_ARGS[@]}"; then
    echo -e "${GREEN}✓ WASM build successful${NC}"
else
    echo -e "${RED}✗ WASM build failed${NC}"
    exit 1
fi

# Run wasm-opt optimization if requested and available
if [[ "${RUN_WASM_OPT}" == "true" && "${BUILD_MODE}" == "release" ]]; then
    echo -e "${YELLOW}Optimizing WASM binary with wasm-opt...${NC}"
    
    WASM_FILE="${PKG_DIR}/vectorize_wasm_bg.wasm"
    
    if [[ -f "${WASM_FILE}" ]]; then
        # Create backup
        cp "${WASM_FILE}" "${WASM_FILE}.backup"
        
        # Optimize with wasm-opt
        if wasm-opt "${WASM_FILE}" -O3 --enable-simd --enable-bulk-memory --enable-sign-ext -o "${WASM_FILE}"; then
            echo -e "${GREEN}✓ WASM optimization successful${NC}"
            
            # Show size comparison
            ORIGINAL_SIZE=$(stat -f%z "${WASM_FILE}.backup" 2>/dev/null || stat -c%s "${WASM_FILE}.backup" 2>/dev/null || echo "unknown")
            OPTIMIZED_SIZE=$(stat -f%z "${WASM_FILE}" 2>/dev/null || stat -c%s "${WASM_FILE}" 2>/dev/null || echo "unknown")
            
            if [[ "${ORIGINAL_SIZE}" != "unknown" && "${OPTIMIZED_SIZE}" != "unknown" ]]; then
                echo "  Original size:  $(numfmt --to=iec ${ORIGINAL_SIZE})"
                echo "  Optimized size: $(numfmt --to=iec ${OPTIMIZED_SIZE})"
                
                if [[ "${ORIGINAL_SIZE}" -gt "${OPTIMIZED_SIZE}" ]]; then
                    SAVINGS=$((ORIGINAL_SIZE - OPTIMIZED_SIZE))
                    PERCENT=$((SAVINGS * 100 / ORIGINAL_SIZE))
                    echo -e "${GREEN}  Savings: $(numfmt --to=iec ${SAVINGS}) (${PERCENT}%)${NC}"
                fi
            fi
            
            # Remove backup
            rm "${WASM_FILE}.backup"
        else
            echo -e "${YELLOW}Warning: wasm-opt failed, using unoptimized binary${NC}"
            mv "${WASM_FILE}.backup" "${WASM_FILE}"
        fi
    else
        echo -e "${YELLOW}Warning: WASM file not found for optimization${NC}"
    fi
fi

# Display build results
echo ""
echo -e "${GREEN}=== Build Complete ===${NC}"

if [[ -d "${PKG_DIR}" ]]; then
    echo -e "Package directory: ${PKG_DIR}"
    
    # List generated files
    echo -e "\nGenerated files:"
    ls -la "${PKG_DIR}"
    
    # Show WASM file size
    WASM_FILE="${PKG_DIR}/vectorize_wasm_bg.wasm"
    if [[ -f "${WASM_FILE}" ]]; then
        WASM_SIZE=$(stat -f%z "${WASM_FILE}" 2>/dev/null || stat -c%s "${WASM_FILE}" 2>/dev/null || echo "0")
        echo -e "\n${BLUE}WASM binary size: $(numfmt --to=iec ${WASM_SIZE})${NC}"
    fi
    
    # Validate essential files
    REQUIRED_FILES=("vectorize_wasm.js" "vectorize_wasm_bg.wasm" "vectorize_wasm.d.ts")
    ALL_PRESENT=true
    
    echo -e "\nValidating generated files:"
    for file in "${REQUIRED_FILES[@]}"; do
        if [[ -f "${PKG_DIR}/${file}" ]]; then
            echo -e "${GREEN}✓ ${file}${NC}"
        else
            echo -e "${RED}✗ ${file} (missing)${NC}"
            ALL_PRESENT=false
        fi
    done
    
    if [[ "${ALL_PRESENT}" == "true" ]]; then
        echo -e "\n${GREEN}✓ All essential files generated successfully${NC}"
        echo -e "\n${BLUE}Usage:${NC}"
        echo -e "  Import in JavaScript: import * as wasm from './pkg/vectorize_wasm.js';"
        echo -e "  TypeScript definitions available in: ./pkg/vectorize_wasm.d.ts"
    else
        echo -e "\n${RED}✗ Some essential files are missing${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ Package directory not found${NC}"
    exit 1
fi

echo -e "\n${GREEN}Single-threaded WASM build completed successfully!${NC}"
echo -e "\n${BLUE}For multi-threaded WASM with SharedArrayBuffer support:${NC}"
echo -e "  Run: ./build-wasm-mt.sh"
echo -e "  Note: Requires HTTPS and specific headers for browser compatibility"