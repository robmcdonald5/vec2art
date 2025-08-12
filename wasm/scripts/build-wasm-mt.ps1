# Multi-threaded WASM build script for vec2art line tracing engine (PowerShell)
# Builds the vectorize-wasm crate with multi-threading support using SharedArrayBuffer and atomics

param(
    [Parameter(Position=0)]
    [ValidateSet("debug", "release")]
    [string]$BuildMode = "release",
    
    [Parameter(Position=1)]
    [bool]$EnableSIMD = $true,
    
    [Parameter(Position=2)]
    [bool]$RunWasmOpt = $true
)

$ErrorActionPreference = "Stop"

# Configuration
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$WasmCrateDir = Join-Path $ProjectRoot "vectorize-wasm"
$PkgDir = Join-Path $WasmCrateDir "pkg"

Write-Host "=== vec2art Multi-threaded WASM Build Script ===" -ForegroundColor Blue
Write-Host "Project root: $ProjectRoot"
Write-Host "WASM crate: $WasmCrateDir"
Write-Host "Build mode: $BuildMode"
Write-Host "Enable SIMD: $EnableSIMD"
Write-Host "Run wasm-opt: $RunWasmOpt"
Write-Host ""

# Check for required tools
Write-Host "Checking required tools..." -ForegroundColor Yellow

try {
    $WasmPackVersion = (wasm-pack --version | Select-String -Pattern '\d+\.\d+\.\d+').Matches[0].Value
    Write-Host "✓ wasm-pack found ($WasmPackVersion)" -ForegroundColor Green
    
    # Check wasm-pack version (requires 0.12.0+ for proper SharedArrayBuffer support)
    $RequiredVersion = [Version]"0.12.0"
    $CurrentVersion = [Version]$WasmPackVersion
    
    if ($CurrentVersion -lt $RequiredVersion) {
        Write-Host "⚠ Warning: wasm-pack version $WasmPackVersion detected, recommended $RequiredVersion or higher" -ForegroundColor Yellow
        Write-Host "Some multi-threading features may not work correctly with older versions"
    }
} catch {
    Write-Host "✗ Error: wasm-pack is not installed" -ForegroundColor Red
    Write-Host "Install from: https://rustwasm.github.io/wasm-pack/installer/"
    exit 1
}

if ($RunWasmOpt) {
    try {
        $null = Get-Command wasm-opt -ErrorAction Stop
        Write-Host "✓ wasm-opt found" -ForegroundColor Green
    } catch {
        Write-Host "⚠ Warning: wasm-opt not found, skipping optimization" -ForegroundColor Yellow
        Write-Host "Install with: npm install -g binaryen"
        $RunWasmOpt = $false
    }
}

# Check for Node.js (needed for testing)
try {
    $NodeVersion = (node --version).TrimStart('v')
    Write-Host "✓ Node.js found ($NodeVersion)" -ForegroundColor Green
    
    # Check if Node.js version supports SharedArrayBuffer (16.0.0+)
    $RequiredNodeVersion = [Version]"16.0.0"
    $CurrentNodeVersion = [Version]$NodeVersion
    
    if ($CurrentNodeVersion -lt $RequiredNodeVersion) {
        Write-Host "⚠ Warning: Node.js $NodeVersion detected, SharedArrayBuffer requires $RequiredNodeVersion+" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Warning: Node.js not found, testing capabilities will be limited" -ForegroundColor Yellow
}

Write-Host "✓ All required tools available" -ForegroundColor Green

# Clean previous build
if (Test-Path $PkgDir) {
    Write-Host "Cleaning previous build..." -ForegroundColor Yellow
    Remove-Item $PkgDir -Recurse -Force
}

# Set up WASM target and flags
Write-Host "Setting up multi-threaded WASM build environment..." -ForegroundColor Yellow

# Ensure wasm32-unknown-unknown target is installed
& rustup target add wasm32-unknown-unknown

# Set RUSTFLAGS for multi-threading support (overrides .cargo/config.toml)
$rustflags = @()

# Core optimization flags
$rustflags += "-C", "opt-level=3"
$rustflags += "--cfg", "web_sys_unstable_apis"

# Add atomics and bulk-memory support (required for SharedArrayBuffer)
$rustflags += "-C", "target-feature=+atomics,+bulk-memory,+mutable-globals"

# Enable SIMD if requested
if ($EnableSIMD) {
    $rustflags[-1] = $rustflags[-1] + ",+simd128"  # Append to target-feature
    Write-Host "✓ SIMD enabled" -ForegroundColor Green
}

# Add link arguments for SharedArrayBuffer
$rustflags += "-C", "link-arg=--max-memory=4294967296"
$rustflags += "-C", "link-arg=--import-memory"
$rustflags += "-C", "link-arg=--export-memory"
$rustflags += "-C", "link-arg=--shared-memory"

# Set environment variable (space-separated)
$env:RUSTFLAGS = $rustflags -join " "

Write-Host "✓ Multi-threading flags configured" -ForegroundColor Green
Write-Host "  RUSTFLAGS: $($env:RUSTFLAGS)"

# Prepare wasm-pack command
$WasmPackArgs = @(
    "build"
    "--target"
    "web"
    "--out-dir"
    "pkg"
    $WasmCrateDir
)

# Add build mode
if ($BuildMode -eq "release") {
    $WasmPackArgs += "--release"
} else {
    $WasmPackArgs += "--dev"
}

# Enable wasm-parallel feature for multi-threading
$Features = @("wasm-parallel")
if ($EnableSIMD) {
    $Features += "simd"
}

# Add features and build-std flag for proper atomics support
$WasmPackArgs += @("--", "--features", ($Features -join ","), "-Z", "build-std=panic_abort,std")

# Build with wasm-pack using the nightly toolchain
Write-Host "Building multi-threaded WASM module..." -ForegroundColor Yellow
Write-Host "Command: rustup run nightly wasm-pack $($WasmPackArgs -join ' ')"

try {
    & rustup run nightly wasm-pack @WasmPackArgs
    Write-Host "✓ Multi-threaded WASM build successful" -ForegroundColor Green
} catch {
    Write-Host "✗ Multi-threaded WASM build failed" -ForegroundColor Red
    Write-Host "Troubleshooting tips:" -ForegroundColor Yellow
    Write-Host "  - Ensure Rust nightly toolchain is installed: rustup install nightly"
    Write-Host "  - Update wasm-pack: cargo install wasm-pack --force"
    Write-Host "  - Check that vectorize-core supports wasm-parallel feature"
    Write-Host $_.Exception.Message
    exit 1
}

# Run wasm-opt optimization if requested and available
if ($RunWasmOpt -and ($BuildMode -eq "release")) {
    Write-Host "Optimizing multi-threaded WASM binary with wasm-opt..." -ForegroundColor Yellow
    
    $WasmFile = Join-Path $PkgDir "vectorize_wasm_bg.wasm"
    
    if (Test-Path $WasmFile) {
        # Create backup
        $BackupFile = "$WasmFile.backup"
        Copy-Item $WasmFile $BackupFile
        
        # Optimize with wasm-opt (including threading-specific optimizations)
        try {
            & wasm-opt $WasmFile -O3 `
                --enable-simd `
                --enable-bulk-memory `
                --enable-sign-ext `
                --enable-threads `
                --enable-tail-call `
                --enable-reference-types `
                -o $WasmFile
            Write-Host "✓ Multi-threaded WASM optimization successful" -ForegroundColor Green
            
            # Show size comparison
            try {
                $OriginalSize = (Get-Item $BackupFile).Length
                $OptimizedSize = (Get-Item $WasmFile).Length
                
                Write-Host "  Original size:  $([math]::Round($OriginalSize / 1KB, 2)) KB"
                Write-Host "  Optimized size: $([math]::Round($OptimizedSize / 1KB, 2)) KB"
                
                if ($OriginalSize -gt $OptimizedSize) {
                    $Savings = $OriginalSize - $OptimizedSize
                    $Percent = [math]::Round(($Savings * 100 / $OriginalSize), 1)
                    Write-Host "  Savings: $([math]::Round($Savings / 1KB, 2)) KB ($Percent%)" -ForegroundColor Green
                }
            } catch {
                Write-Host "  Size comparison not available"
            }
            
            # Remove backup
            Remove-Item $BackupFile
        } catch {
            Write-Host "⚠ Warning: wasm-opt failed, using unoptimized binary" -ForegroundColor Yellow
            Move-Item $BackupFile $WasmFile -Force
        }
    } else {
        Write-Host "⚠ Warning: WASM file not found for optimization" -ForegroundColor Yellow
    }
}

# Verify threading capabilities in the built WASM
Write-Host "Verifying multi-threading capabilities..." -ForegroundColor Yellow

$WasmFile = Join-Path $PkgDir "vectorize_wasm_bg.wasm"
if (Test-Path $WasmFile) {
    # Check if SharedArrayBuffer imports/exports are present
    try {
        $null = Get-Command wasm-objdump -ErrorAction Stop
        $ThreadFeatures = & wasm-objdump -x $WasmFile | Select-String -Pattern "(shared|memory|thread|atomic)" -AllMatches
        if ($ThreadFeatures.Count -gt 0) {
            Write-Host "✓ Threading features detected in WASM binary" -ForegroundColor Green
        } else {
            Write-Host "⚠ Warning: No threading features detected, binary may be single-threaded" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "ℹ Install wabt (wasm-objdump) to verify threading capabilities" -ForegroundColor Blue
    }
    
    # Check for specific threading imports in the JS binding
    $JSFile = Join-Path $PkgDir "vectorize_wasm.js"
    if ((Test-Path $JSFile) -and (Select-String -Path $JSFile -Pattern "(SharedArrayBuffer|Worker|atomics)" -Quiet)) {
        Write-Host "✓ Threading support detected in JavaScript bindings" -ForegroundColor Green
    } else {
        Write-Host "⚠ Warning: Limited threading support in JavaScript bindings" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ WASM file not found for verification" -ForegroundColor Red
}

# Display build results
Write-Host ""
Write-Host "=== Multi-threaded Build Complete ===" -ForegroundColor Green

if (Test-Path $PkgDir) {
    Write-Host "Package directory: $PkgDir"
    
    # List generated files
    Write-Host ""
    Write-Host "Generated files:"
    Get-ChildItem $PkgDir | Format-Table Name, Length, LastWriteTime -AutoSize
    
    # Show WASM file size
    $WasmFile = Join-Path $PkgDir "vectorize_wasm_bg.wasm"
    if (Test-Path $WasmFile) {
        $WasmSize = (Get-Item $WasmFile).Length
        Write-Host ""
        Write-Host "WASM binary size: $([math]::Round($WasmSize / 1KB, 2)) KB" -ForegroundColor Blue
    }
    
    # Validate essential files
    $RequiredFiles = @("vectorize_wasm.js", "vectorize_wasm_bg.wasm", "vectorize_wasm.d.ts")
    $AllPresent = $true
    
    Write-Host ""
    Write-Host "Validating generated files:"
    foreach ($file in $RequiredFiles) {
        $filePath = Join-Path $PkgDir $file
        if (Test-Path $filePath) {
            Write-Host "✓ $file" -ForegroundColor Green
        } else {
            Write-Host "✗ $file (missing)" -ForegroundColor Red
            $AllPresent = $false
        }
    }
    
    if ($AllPresent) {
        Write-Host ""
        Write-Host "✓ All essential files generated successfully" -ForegroundColor Green
        Write-Host ""
        Write-Host "Multi-threading Usage:" -ForegroundColor Blue
        Write-Host "  Import in JavaScript: import * as wasm from './pkg/vectorize_wasm.js';"
        Write-Host "  TypeScript definitions: ./pkg/vectorize_wasm.d.ts"
        Write-Host ""
        Write-Host "⚠ Important: Multi-threaded WASM requires:" -ForegroundColor Yellow
        Write-Host "  • HTTPS or localhost (for SharedArrayBuffer security requirements)"
        Write-Host "  • Cross-Origin-Embedder-Policy: require-corp header"
        Write-Host "  • Cross-Origin-Opener-Policy: same-origin header"
        Write-Host "  • Browser with SharedArrayBuffer support (most modern browsers)"
        Write-Host ""
        Write-Host "Testing:" -ForegroundColor Blue
        Write-Host "  Run: ./scripts/test-wasm-mt.sh (when available)"
        Write-Host "  Or serve with proper headers and test in browser manually"
    } else {
        Write-Host ""
        Write-Host "✗ Some essential files are missing" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✗ Package directory not found" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Multi-threaded WASM build completed successfully!" -ForegroundColor Green