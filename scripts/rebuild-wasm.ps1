# Enhanced WASM rebuild script for Windows PowerShell
# Eliminates ALL manual intervention for import fixes and build issues
# Run from project root: .\scripts\rebuild-wasm.ps1

param(
    [switch]$Clean = $false,
    [switch]$SkipVerify = $false
)

# Color functions
function Write-Info { Write-Host "ℹ️  $args" -ForegroundColor Blue }
function Write-Success { Write-Host "✅ $args" -ForegroundColor Green }
function Write-Warning { Write-Host "⚠️  $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "❌ $args" -ForegroundColor Red }

# Function to check prerequisites
function Test-Prerequisites {
    Write-Info "Checking prerequisites..."

    # Check for Rust
    if (-not (Get-Command rustc -ErrorAction SilentlyContinue)) {
        Write-Error "Rust is not installed. Please install from https://rustup.rs/"
        exit 1
    }

    # Check for wasm-pack
    if (-not (Get-Command wasm-pack -ErrorAction SilentlyContinue)) {
        Write-Warning "wasm-pack not found. Installing..."
        cargo install wasm-pack
    }

    # Check for wasm32 target
    $targets = rustup target list --installed
    if ($targets -notcontains "wasm32-unknown-unknown") {
        Write-Warning "Installing wasm32-unknown-unknown target..."
        rustup target add wasm32-unknown-unknown
    }

    Write-Success "Prerequisites check complete"
}

# Function to clean previous build artifacts
function Clear-BuildArtifacts {
    Write-Info "Cleaning previous build artifacts..."

    # Clean Rust target directory
    if (Test-Path "wasm\vectorize-wasm\target") {
        Remove-Item -Path "wasm\vectorize-wasm\target" -Recurse -Force
    }

    # Clean pkg directory
    if (Test-Path "wasm\vectorize-wasm\pkg") {
        Remove-Item -Path "wasm\vectorize-wasm\pkg" -Recurse -Force
    }

    # Clean frontend WASM files
    if (Test-Path "frontend\src\lib\wasm") {
        Get-ChildItem -Path "frontend\src\lib\wasm" -Include "*.wasm", "*.js", "*.d.ts" -Recurse | Remove-Item -Force
    }

    Write-Success "Clean complete"
}

# Function to build WASM module
function Build-WasmModule {
    Write-Info "Building WASM module..."

    Push-Location wasm\vectorize-wasm

    try {
        # Build with wasm-pack
        Write-Info "Running wasm-pack build..."
        $buildOutput = wasm-pack build --target web --out-dir pkg 2>&1

        if ($LASTEXITCODE -ne 0) {
            Write-Error "Build failed!"
            Write-Host $buildOutput
            exit 1
        }

        Write-Success "WASM build complete"
    }
    finally {
        Pop-Location
    }
}

# Function to fix import paths
function Repair-ImportPaths {
    Write-Info "Applying comprehensive import fixes..."

    $wasmDir = "frontend\src\lib\wasm"

    # Fix 1: Main import statement
    Write-Info "Fixing main import statements..."
    $jsFile = Join-Path $wasmDir "vectorize_wasm.js"

    if (Test-Path $jsFile) {
        $content = Get-Content $jsFile -Raw

        # Fix import at top of file
        $content = $content -replace "from '__wbindgen_placeholder__'", "from './__wbindgen_placeholder__.js'"

        # Fix import object keys
        $content = $content -replace "imports\['\./__wbindgen_placeholder__\.js'\]", "imports['__wbindgen_placeholder__']"

        # Fix any remaining bare imports
        $content = $content -replace "import \* as wbg from '__wbindgen_placeholder__'", "import * as wbg from './__wbindgen_placeholder__.js'"

        Set-Content -Path $jsFile -Value $content -NoNewline
        Write-Success "Main imports fixed"
    }

    # Fix 2: Worker helper imports
    $snippetsDir = Join-Path $wasmDir "snippets"
    if (Test-Path $snippetsDir) {
        Write-Info "Fixing worker helper imports..."

        Get-ChildItem -Path $snippetsDir -Filter "*.js" -Recurse | ForEach-Object {
            $content = Get-Content $_.FullName -Raw

            # Fix relative imports
            $content = $content -replace "from '\.\.\/\.\.\/\.\.\/'", "from '../../../vectorize_wasm.js'"
            $content = $content -replace "from '\.\.\/\.\.\/\.\.'", "from '../../../vectorize_wasm.js'"

            # Fix worker context checks
            $content = $content -replace 'if \(name === "wasm_bindgen_worker"\)', 'if (typeof self !== "undefined" && self.name === "wasm_bindgen_worker")'

            # Fix URL imports
            $content = $content -replace "new URL\('vectorize_wasm_bg\.wasm', import\.meta\.url\)", "new URL('./vectorize_wasm_bg.wasm', import.meta.url)"

            Set-Content -Path $_.FullName -Value $content -NoNewline
        }

        Write-Success "Worker helpers fixed"
    }

    # Fix 3: TypeScript definitions
    Write-Info "Cleaning TypeScript definitions..."
    $dtsFile = Join-Path $wasmDir "vectorize_wasm.d.ts"

    if (Test-Path $dtsFile) {
        $content = Get-Content $dtsFile -Raw

        # Remove corrupted symbol definitions
        $content = $content -replace 'readonly _ZN.*\$.*E:.*', ''
        $content = $content -replace '^\s*readonly.*\$.*:.*$', ''

        # Fix malformed generic types
        $content = $content -replace '<\s*>', '<unknown>'

        # Remove empty lines
        $content = $content -replace '(?m)^\s*$', ''

        Set-Content -Path $dtsFile -Value $content -NoNewline
        Write-Success "TypeScript definitions cleaned"
    }
}

# Function to create placeholder file
function New-PlaceholderFile {
    Write-Info "Creating __wbindgen_placeholder__.js..."

    $placeholderContent = @'
// wasm-bindgen placeholder file
// Auto-generated by rebuild-wasm.ps1
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
'@

    $placeholderPath = "frontend\src\lib\wasm\__wbindgen_placeholder__.js"
    Set-Content -Path $placeholderPath -Value $placeholderContent -NoNewline

    Write-Success "Placeholder file created"
}

# Function to copy files
function Copy-WasmFiles {
    Write-Info "Copying files to frontend..."

    # Ensure directories exist
    New-Item -ItemType Directory -Force -Path "frontend\src\lib\wasm" | Out-Null
    New-Item -ItemType Directory -Force -Path "frontend\static\wasm" | Out-Null

    # Copy main files
    Copy-Item "wasm\vectorize-wasm\pkg\vectorize_wasm.js" -Destination "frontend\src\lib\wasm\" -Force
    Copy-Item "wasm\vectorize-wasm\pkg\vectorize_wasm.d.ts" -Destination "frontend\src\lib\wasm\" -Force
    Copy-Item "wasm\vectorize-wasm\pkg\vectorize_wasm_bg.wasm" -Destination "frontend\src\lib\wasm\" -Force
    Copy-Item "wasm\vectorize-wasm\pkg\vectorize_wasm_bg.wasm.d.ts" -Destination "frontend\src\lib\wasm\" -Force

    # Copy snippets if they exist
    if (Test-Path "wasm\vectorize-wasm\pkg\snippets") {
        Copy-Item "wasm\vectorize-wasm\pkg\snippets" -Destination "frontend\src\lib\wasm\" -Recurse -Force
    }

    Write-Success "Files copied to frontend\src\lib\wasm\"

    # Sync to static directory
    Write-Info "Synchronizing to static directory..."
    Copy-Item "frontend\src\lib\wasm\*" -Destination "frontend\static\wasm\" -Recurse -Force

    Write-Success "Files synchronized to frontend\static\wasm\"
}

# Function to verify build
function Test-BuildIntegrity {
    Write-Info "Verifying build..."

    $errors = 0

    # Check for required files
    $requiredFiles = @(
        "vectorize_wasm.js",
        "vectorize_wasm.d.ts",
        "vectorize_wasm_bg.wasm",
        "__wbindgen_placeholder__.js"
    )

    foreach ($file in $requiredFiles) {
        $path = "frontend\src\lib\wasm\$file"
        if (-not (Test-Path $path)) {
            Write-Error "Missing required file: $file"
            $errors++
        }
    }

    # Check for unfixed imports
    $jsContent = Get-Content "frontend\src\lib\wasm\vectorize_wasm.js" -Raw -ErrorAction SilentlyContinue
    if ($jsContent -match "from '__wbindgen_placeholder__'") {
        Write-Error "Unfixed imports found in vectorize_wasm.js"
        $errors++
    }

    # Check for corrupted TypeScript definitions
    $dtsContent = Get-Content "frontend\src\lib\wasm\vectorize_wasm.d.ts" -Raw -ErrorAction SilentlyContinue
    if ($dtsContent -match "_ZN.*\$.*E:") {
        Write-Warning "Corrupted TypeScript definitions detected (non-critical)"
    }

    if ($errors -gt 0) {
        Write-Error "Verification failed with $errors error(s)"
        return $false
    }

    Write-Success "Build verification passed"
    return $true
}

# Main execution
function Main {
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "🚀 Enhanced WASM Rebuild Script (PowerShell)" -ForegroundColor Cyan
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""

    # Step 1: Prerequisites
    Test-Prerequisites

    # Step 2: Clean (if requested)
    if ($Clean) {
        Clear-BuildArtifacts
    }

    # Step 3: Build
    Build-WasmModule

    # Step 4: Copy files
    Copy-WasmFiles

    # Step 5: Create placeholder
    New-PlaceholderFile

    # Step 6: Fix imports
    Repair-ImportPaths

    # Step 7: Verify (unless skipped)
    if (-not $SkipVerify) {
        if (Test-BuildIntegrity) {
            Write-Host ""
            Write-Host "======================================" -ForegroundColor Green
            Write-Success "WASM rebuild complete!"
            Write-Host "======================================" -ForegroundColor Green
            Write-Host ""
            Write-Info "Architecture: Single-threaded WASM + Web Worker"
            Write-Info "Files deployed to:"
            Write-Host "   • frontend\src\lib\wasm\ (source)"
            Write-Host "   • frontend\static\wasm\ (static serving)"
            Write-Host ""
            Write-Success "All import paths fixed automatically"
            Write-Success "Ready for testing!"
        }
        else {
            Write-Host ""
            Write-Error "Build completed with errors. Please review the output above."
            exit 1
        }
    }
    else {
        Write-Host ""
        Write-Success "Build complete (verification skipped)"
    }
}

# Run main function
Main