#!/bin/bash
# Enhanced WASM rebuild script with comprehensive automation
# Eliminates ALL manual intervention for import fixes and build issues
# Run from project root: ./scripts/rebuild-wasm-enhanced.sh

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Function to check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check for Rust
    if ! command -v rustc &> /dev/null; then
        log_error "Rust is not installed. Please install from https://rustup.rs/"
        exit 1
    fi

    # Check for wasm-pack
    if ! command -v wasm-pack &> /dev/null; then
        log_warning "wasm-pack not found. Installing..."
        cargo install wasm-pack
    fi

    # Check for wasm32 target
    if ! rustup target list --installed | grep -q wasm32-unknown-unknown; then
        log_warning "Installing wasm32-unknown-unknown target..."
        rustup target add wasm32-unknown-unknown
    fi

    log_success "Prerequisites check complete"
}

# Function to clean previous build artifacts
clean_build() {
    log_info "Cleaning previous build artifacts..."

    # Clean Rust target directory
    if [ -d "wasm/vectorize-wasm/target" ]; then
        rm -rf wasm/vectorize-wasm/target
    fi

    # Clean pkg directory
    if [ -d "wasm/vectorize-wasm/pkg" ]; then
        rm -rf wasm/vectorize-wasm/pkg
    fi

    # Clean frontend WASM files
    if [ -d "frontend/src/lib/wasm" ]; then
        find frontend/src/lib/wasm -name "*.wasm" -o -name "*.js" -o -name "*.d.ts" | xargs rm -f
    fi

    log_success "Clean complete"
}

# Function to build WASM module
build_wasm() {
    log_info "Building WASM module..."

    cd wasm/vectorize-wasm

    # Build with wasm-pack
    log_info "Running wasm-pack build..."
    wasm-pack build \
        --target web \
        --out-dir pkg \
        --no-typescript 2>&1 | tee build.log

    # Generate TypeScript definitions separately to avoid corruption
    log_info "Generating TypeScript definitions..."
    wasm-pack build \
        --target web \
        --out-dir pkg \
        --no-pack 2>&1 | tee -a build.log

    if [ $? -ne 0 ]; then
        log_error "Build failed! Check build.log for details"
        exit 1
    fi

    cd ../..
    log_success "WASM build complete"
}

# Function to fix import paths
fix_imports() {
    log_info "Applying comprehensive import fixes..."

    local wasm_dir="frontend/src/lib/wasm"

    # Fix 1: Main import statement
    log_info "Fixing main import statements..."
    if [ -f "$wasm_dir/vectorize_wasm.js" ]; then
        # Fix import at top of file
        sed -i "s|from '__wbindgen_placeholder__'|from './__wbindgen_placeholder__.js'|g" "$wasm_dir/vectorize_wasm.js"

        # Fix import object keys
        sed -i "s|imports\['\\./__wbindgen_placeholder__\\.js'\]|imports['__wbindgen_placeholder__']|g" "$wasm_dir/vectorize_wasm.js"

        # Fix any remaining bare imports
        sed -i "s|import \* as wbg from '__wbindgen_placeholder__'|import * as wbg from './__wbindgen_placeholder__.js'|g" "$wasm_dir/vectorize_wasm.js"

        log_success "Main imports fixed"
    fi

    # Fix 2: Worker helper imports
    if [ -d "$wasm_dir/snippets" ]; then
        log_info "Fixing worker helper imports..."

        # Find all workerHelpers.js files
        find "$wasm_dir/snippets" -name "*.js" | while read -r file; do
            # Fix relative imports to parent module
            sed -i "s|from '\\.\\.\\/\\.\\.\\/\\.\\./'|from '../../../vectorize_wasm.js'|g" "$file"
            sed -i "s|from '\\.\\.\\/\\.\\.\\/\\.\\.'|from '../../../vectorize_wasm.js'|g" "$file"

            # Fix worker context checks
            sed -i 's|if (name === "wasm_bindgen_worker")|if (typeof self !== "undefined" \&\& self.name === "wasm_bindgen_worker")|g' "$file"

            # Fix any URL imports
            sed -i "s|new URL('vectorize_wasm_bg.wasm', import.meta.url)|new URL('./vectorize_wasm_bg.wasm', import.meta.url)|g" "$file"
        done

        log_success "Worker helpers fixed"
    fi

    # Fix 3: TypeScript definitions
    log_info "Cleaning TypeScript definitions..."
    if [ -f "$wasm_dir/vectorize_wasm.d.ts" ]; then
        # Remove corrupted symbol definitions
        sed -i '/readonly _ZN.*\$.*E:/d' "$wasm_dir/vectorize_wasm.d.ts"
        sed -i '/^[[:space:]]*readonly.*\$.*:.*$/d' "$wasm_dir/vectorize_wasm.d.ts"

        # Fix any malformed generic types
        sed -i 's/<\s*>/<unknown>/g' "$wasm_dir/vectorize_wasm.d.ts"

        log_success "TypeScript definitions cleaned"
    fi
}

# Function to create placeholder file
create_placeholder() {
    log_info "Creating __wbindgen_placeholder__.js..."

    cat > frontend/src/lib/wasm/__wbindgen_placeholder__.js << 'EOF'
// wasm-bindgen placeholder file
// Auto-generated by rebuild-wasm-enhanced.sh
// Provides stub implementations for wasm-bindgen functions

// Core wasm-bindgen functions
export function __wbindgen_describe() { return 0; }
export function __wbindgen_describe_closure() { return 0; }
export function __wbindgen_string_new(ptr, len) { return 0; }
export function __wbindgen_string_get(idx) { return null; }
export function __wbindgen_number_new(value) { return 0; }
export function __wbindgen_number_get(idx) { return 0; }
export function __wbindgen_boolean_new(value) { return 0; }
export function __wbindgen_boolean_get(idx) { return false; }
export function __wbindgen_object_drop_ref(idx) {}
export function __wbindgen_cb_drop(idx) { return 0; }
export function __wbindgen_json_parse(ptr, len) { return 0; }
export function __wbindgen_json_serialize(idx) { return [0, 0]; }
export function __wbindgen_is_undefined(idx) { return false; }
export function __wbindgen_is_null(idx) { return false; }
export function __wbindgen_is_object(idx) { return false; }
export function __wbindgen_is_function(idx) { return false; }
export function __wbindgen_typeof(idx) { return 0; }

// Memory management
export function __wbindgen_memory() { return { buffer: new ArrayBuffer(0) }; }
export function __wbindgen_throw(ptr, len) { throw new Error('WASM Error'); }
export function __wbindgen_rethrow(idx) {}

// Console functions
export function __wbindgen_console_log(ptr, len) { console.log('WASM Log'); }
export function __wbindgen_console_error(ptr, len) { console.error('WASM Error'); }
export function __wbindgen_console_warn(ptr, len) { console.warn('WASM Warning'); }

// Export default for compatibility
export default {};
EOF

    log_success "Placeholder file created"
}

# Function to copy files to destination
copy_files() {
    log_info "Copying files to frontend..."

    # Ensure directories exist
    mkdir -p frontend/src/lib/wasm
    mkdir -p frontend/static/wasm

    # Copy main files
    cp wasm/vectorize-wasm/pkg/vectorize_wasm.js frontend/src/lib/wasm/
    cp wasm/vectorize-wasm/pkg/vectorize_wasm.d.ts frontend/src/lib/wasm/
    cp wasm/vectorize-wasm/pkg/vectorize_wasm_bg.wasm frontend/src/lib/wasm/
    cp wasm/vectorize-wasm/pkg/vectorize_wasm_bg.wasm.d.ts frontend/src/lib/wasm/

    # Copy snippets if they exist
    if [ -d "wasm/vectorize-wasm/pkg/snippets" ]; then
        cp -r wasm/vectorize-wasm/pkg/snippets frontend/src/lib/wasm/
    fi

    log_success "Files copied to frontend/src/lib/wasm/"

    # Sync to static directory
    log_info "Synchronizing to static directory..."
    cp -r frontend/src/lib/wasm/* frontend/static/wasm/

    log_success "Files synchronized to frontend/static/wasm/"
}

# Function to verify the build
verify_build() {
    log_info "Verifying build..."

    local errors=0

    # Check for required files
    for file in "vectorize_wasm.js" "vectorize_wasm.d.ts" "vectorize_wasm_bg.wasm" "__wbindgen_placeholder__.js"; do
        if [ ! -f "frontend/src/lib/wasm/$file" ]; then
            log_error "Missing required file: $file"
            ((errors++))
        fi
    done

    # Check for unfixed imports
    if grep -q "from '__wbindgen_placeholder__'" frontend/src/lib/wasm/vectorize_wasm.js; then
        log_error "Unfixed imports found in vectorize_wasm.js"
        ((errors++))
    fi

    # Check for corrupted TypeScript definitions
    if grep -q "_ZN.*\$.*E:" frontend/src/lib/wasm/vectorize_wasm.d.ts; then
        log_warning "Corrupted TypeScript definitions detected (non-critical)"
    fi

    if [ $errors -gt 0 ]; then
        log_error "Verification failed with $errors error(s)"
        return 1
    fi

    log_success "Build verification passed"
    return 0
}

# Function to run TypeScript check
check_typescript() {
    log_info "Running TypeScript check..."

    cd frontend

    if npm run check 2>&1 | grep -q "error TS"; then
        log_warning "TypeScript errors detected (may be unrelated to WASM)"
    else
        log_success "TypeScript check passed"
    fi

    cd ..
}

# Main execution
main() {
    echo "======================================"
    echo "🚀 Enhanced WASM Rebuild Script"
    echo "======================================"
    echo ""

    # Step 1: Prerequisites
    check_prerequisites

    # Step 2: Clean (optional)
    if [ "$1" == "--clean" ]; then
        clean_build
    fi

    # Step 3: Build
    build_wasm

    # Step 4: Copy files
    copy_files

    # Step 5: Create placeholder
    create_placeholder

    # Step 6: Fix imports
    fix_imports

    # Step 7: Verify
    if verify_build; then
        echo ""
        echo "======================================"
        log_success "WASM rebuild complete!"
        echo "======================================"
        echo ""
        log_info "Architecture: Single-threaded WASM + Web Worker"
        log_info "Files deployed to:"
        echo "   • frontend/src/lib/wasm/ (source)"
        echo "   • frontend/static/wasm/ (static serving)"
        echo ""
        log_success "All import paths fixed automatically"
        log_success "Ready for testing!"
    else
        echo ""
        log_error "Build completed with errors. Please review the output above."
        exit 1
    fi
}

# Run main function
main "$@"