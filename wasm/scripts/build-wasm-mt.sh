#!/usr/bin/env bash
# Multi-threaded WASM build script for vec2art line tracing engine
# Builds the vectorize-wasm crate with multi-threading support using SharedArrayBuffer and atomics

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

echo -e "${BLUE}=== vec2art Multi-threaded WASM Build Script ===${NC}"
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

# Check wasm-pack version (requires 0.12.0+ for proper SharedArrayBuffer support)
WASM_PACK_VERSION=$(wasm-pack --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
REQUIRED_VERSION="0.12.0"

if ! printf '%s\n%s\n' "$REQUIRED_VERSION" "$WASM_PACK_VERSION" | sort -V -C; then
    echo -e "${YELLOW}Warning: wasm-pack version $WASM_PACK_VERSION detected, recommended $REQUIRED_VERSION or higher${NC}"
    echo "Some multi-threading features may not work correctly with older versions"
fi

if [[ "${RUN_WASM_OPT}" == "true" ]] && ! command -v wasm-opt &> /dev/null; then
    echo -e "${YELLOW}Warning: wasm-opt not found, skipping optimization${NC}"
    echo "Install with: npm install -g binaryen"
    RUN_WASM_OPT="false"
fi

# Check for Node.js (needed for testing)
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    echo -e "${GREEN}✓ Node.js found (${NODE_VERSION})${NC}"
    
    # Check if Node.js version supports SharedArrayBuffer (16.0.0+)
    REQUIRED_NODE_VERSION="16.0.0"
    if ! printf '%s\n%s\n' "$REQUIRED_NODE_VERSION" "$NODE_VERSION" | sort -V -C; then
        echo -e "${YELLOW}Warning: Node.js ${NODE_VERSION} detected, SharedArrayBuffer requires ${REQUIRED_NODE_VERSION}+${NC}"
    fi
else
    echo -e "${YELLOW}Warning: Node.js not found, testing capabilities will be limited${NC}"
fi

echo -e "${GREEN}✓ All required tools available${NC}"

# Clean previous build
if [[ -d "${PKG_DIR}" ]]; then
    echo -e "${YELLOW}Cleaning previous build...${NC}"
    rm -rf "${PKG_DIR}"
fi

# Set up WASM target and flags
echo -e "${YELLOW}Setting up multi-threaded WASM build environment...${NC}"

# Ensure wasm32-unknown-unknown target is installed
rustup target add wasm32-unknown-unknown

# Set RUSTFLAGS for multi-threading support
export RUSTFLAGS=""

# Add atomics and bulk-memory support (required for SharedArrayBuffer)
export RUSTFLAGS="${RUSTFLAGS} -C target-feature=+atomics"
export RUSTFLAGS="${RUSTFLAGS} -C target-feature=+bulk-memory"
export RUSTFLAGS="${RUSTFLAGS} -C target-feature=+mutable-globals"

# Enable SIMD if requested
if [[ "${ENABLE_SIMD}" == "true" ]]; then
    export RUSTFLAGS="${RUSTFLAGS} -C target-feature=+simd128"
    echo -e "${GREEN}✓ SIMD enabled${NC}"
fi

# Add link arguments for SharedArrayBuffer
export RUSTFLAGS="${RUSTFLAGS} -C link-arg=--max-memory=4294967296"
export RUSTFLAGS="${RUSTFLAGS} -C link-arg=--import-memory"
export RUSTFLAGS="${RUSTFLAGS} -C link-arg=--export-memory"
export RUSTFLAGS="${RUSTFLAGS} -C link-arg=--shared-memory"

echo -e "${GREEN}✓ Multi-threading flags configured${NC}"
echo -e "  RUSTFLAGS: ${RUSTFLAGS}"

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

# Enable wasm-parallel feature for multi-threading
FEATURES="wasm-parallel"
if [[ "${ENABLE_SIMD}" == "true" ]]; then
    FEATURES="${FEATURES},simd"
fi

# Add features to wasm-pack command
WASM_PACK_ARGS+=("--" "--features" "${FEATURES}")

# Build with wasm-pack
echo -e "${YELLOW}Building multi-threaded WASM module...${NC}"
echo "Command: wasm-pack ${WASM_PACK_ARGS[*]}"

if wasm-pack "${WASM_PACK_ARGS[@]}"; then
    echo -e "${GREEN}✓ Multi-threaded WASM build successful${NC}"
else
    echo -e "${RED}✗ Multi-threaded WASM build failed${NC}"
    echo -e "${YELLOW}Troubleshooting tips:${NC}"
    echo "  - Ensure Rust nightly toolchain is installed: rustup install nightly"
    echo "  - Update wasm-pack: cargo install wasm-pack --force"
    echo "  - Check that vectorize-core supports wasm-parallel feature"
    exit 1
fi

# Run wasm-opt optimization if requested and available
if [[ "${RUN_WASM_OPT}" == "true" && "${BUILD_MODE}" == "release" ]]; then
    echo -e "${YELLOW}Optimizing multi-threaded WASM binary with wasm-opt...${NC}"
    
    WASM_FILE="${PKG_DIR}/vectorize_wasm_bg.wasm"
    
    if [[ -f "${WASM_FILE}" ]]; then
        # Create backup
        cp "${WASM_FILE}" "${WASM_FILE}.backup"
        
        # Optimize with wasm-opt (including threading-specific optimizations)
        if wasm-opt "${WASM_FILE}" -O3 \
            --enable-simd \
            --enable-bulk-memory \
            --enable-sign-ext \
            --enable-threads \
            --enable-tail-call \
            --enable-reference-types \
            -o "${WASM_FILE}"; then
            echo -e "${GREEN}✓ Multi-threaded WASM optimization successful${NC}"
            
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

# Verify threading capabilities in the built WASM
echo -e "${YELLOW}Verifying multi-threading capabilities...${NC}"

WASM_FILE="${PKG_DIR}/vectorize_wasm_bg.wasm"
if [[ -f "${WASM_FILE}" ]]; then
    # Check if SharedArrayBuffer imports/exports are present
    if command -v wasm-objdump &> /dev/null; then
        THREAD_FEATURES=$(wasm-objdump -x "${WASM_FILE}" | grep -i -E "(shared|memory|thread|atomic)" || true)
        if [[ -n "${THREAD_FEATURES}" ]]; then
            echo -e "${GREEN}✓ Threading features detected in WASM binary${NC}"
        else
            echo -e "${YELLOW}⚠ Warning: No threading features detected, binary may be single-threaded${NC}"
        fi
    else
        echo -e "${BLUE}ℹ Install wabt (wasm-objdump) to verify threading capabilities${NC}"
    fi
    
    # Check for specific threading imports in the JS binding
    JS_FILE="${PKG_DIR}/vectorize_wasm.js"
    if [[ -f "${JS_FILE}" ]] && grep -q "SharedArrayBuffer\|Worker\|atomics" "${JS_FILE}"; then
        echo -e "${GREEN}✓ Threading support detected in JavaScript bindings${NC}"
    else
        echo -e "${YELLOW}⚠ Warning: Limited threading support in JavaScript bindings${NC}"
    fi
else
    echo -e "${RED}✗ WASM file not found for verification${NC}"
fi

# Display build results
echo ""
echo -e "${GREEN}=== Multi-threaded Build Complete ===${NC}"

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
        echo -e "\n${BLUE}Multi-threading Usage:${NC}"
        echo -e "  Import in JavaScript: import * as wasm from './pkg/vectorize_wasm.js';"
        echo -e "  TypeScript definitions: ./pkg/vectorize_wasm.d.ts"
        echo -e "\n${YELLOW}⚠ Important: Multi-threaded WASM requires:${NC}"
        echo -e "  • HTTPS or localhost (for SharedArrayBuffer security requirements)"
        echo -e "  • Cross-Origin-Embedder-Policy: require-corp header"
        echo -e "  • Cross-Origin-Opener-Policy: same-origin header"
        echo -e "  • Browser with SharedArrayBuffer support (most modern browsers)"
        echo -e "\n${BLUE}Testing:${NC}"
        echo -e "  Run: ./scripts/test-wasm-mt.sh (when available)"
        echo -e "  Or serve with proper headers and test in browser manually"
    else
        echo -e "\n${RED}✗ Some essential files are missing${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ Package directory not found${NC}"
    exit 1
fi

echo -e "\n${GREEN}Multi-threaded WASM build completed successfully!${NC}"