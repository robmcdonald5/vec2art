# Single-threaded WASM build script for vec2art line tracing engine (PowerShell)
# Builds the vectorize-wasm crate with optimizations for browser deployment
#
# NOTE: This script builds SINGLE-THREADED WASM for maximum browser compatibility.
# For MULTI-THREADED WASM with SharedArrayBuffer support, use: ./build-wasm-mt.ps1

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

Write-Host "=== vec2art Single-threaded WASM Build Script ===" -ForegroundColor Blue
Write-Host "Project root: $ProjectRoot"
Write-Host "WASM crate: $WasmCrateDir"
Write-Host "Build mode: $BuildMode"
Write-Host "Enable SIMD: $EnableSIMD"
Write-Host "Run wasm-opt: $RunWasmOpt"
Write-Host ""

# Check for required tools
Write-Host "Checking required tools..." -ForegroundColor Yellow

try {
    $null = Get-Command wasm-pack -ErrorAction Stop
    Write-Host "✓ wasm-pack found" -ForegroundColor Green
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

Write-Host "✓ All required tools available" -ForegroundColor Green

# Clean previous build
if (Test-Path $PkgDir) {
    Write-Host "Cleaning previous build..." -ForegroundColor Yellow
    Remove-Item $PkgDir -Recurse -Force
}

# Set up WASM target and flags
Write-Host "Setting up WASM build environment..." -ForegroundColor Yellow

# Ensure wasm32-unknown-unknown target is installed
& rustup target add wasm32-unknown-unknown

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

# Set up feature flags and environment
$env:RUSTFLAGS = ""
$Features = @()

# Enable SIMD if requested
if ($EnableSIMD) {
    $env:RUSTFLAGS = "$($env:RUSTFLAGS) -C target-feature=+simd128"
    $Features += "simd"
    Write-Host "✓ SIMD enabled" -ForegroundColor Green
}

# Add features to wasm-pack command if any
if ($Features.Count -gt 0) {
    $WasmPackArgs += @("--", "--features", ($Features -join ","))
}

# Build with wasm-pack
Write-Host "Building single-threaded WASM module..." -ForegroundColor Yellow
Write-Host "Command: wasm-pack $($WasmPackArgs -join ' ')"

try {
    & wasm-pack @WasmPackArgs
    Write-Host "✓ WASM build successful" -ForegroundColor Green
} catch {
    Write-Host "✗ WASM build failed" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

# Run wasm-opt optimization if requested and available
if ($RunWasmOpt -and ($BuildMode -eq "release")) {
    Write-Host "Optimizing WASM binary with wasm-opt..." -ForegroundColor Yellow
    
    $WasmFile = Join-Path $PkgDir "vectorize_wasm_bg.wasm"
    
    if (Test-Path $WasmFile) {
        # Create backup
        $BackupFile = "$WasmFile.backup"
        Copy-Item $WasmFile $BackupFile
        
        # Optimize with wasm-opt
        try {
            & wasm-opt $WasmFile -O3 --enable-simd --enable-bulk-memory --enable-sign-ext -o $WasmFile
            Write-Host "✓ WASM optimization successful" -ForegroundColor Green
            
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

# Display build results
Write-Host ""
Write-Host "=== Build Complete ===" -ForegroundColor Green

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
        Write-Host "Usage:" -ForegroundColor Blue
        Write-Host "  Import in JavaScript: import * as wasm from './pkg/vectorize_wasm.js';"
        Write-Host "  TypeScript definitions available in: ./pkg/vectorize_wasm.d.ts"
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
Write-Host "Single-threaded WASM build completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "For multi-threaded WASM with SharedArrayBuffer support:" -ForegroundColor Blue
Write-Host "  Run: ./build-wasm-mt.ps1"
Write-Host "  Note: Requires HTTPS and specific headers for browser compatibility"