@echo off
setlocal enabledelayedexpansion

:: Parse command line arguments
set "MODE=%1"

:: Show help
if /i "%MODE%"=="--help" (
    echo.
    echo Usage: test-dot-mapping-auto.bat [OPTIONS]
    echo.
    echo OPTIONS:
    echo   --all-dots           Run basic dot mapping methods on ALL images (6 tests per image^)
    echo   --all-dots-full      Run COMPREHENSIVE dot mapping on ALL images (18+ tests per image^)
    echo   --all-line           Run basic line tracing methods on ALL images (6 tests per image^)
    echo   --all-line-full      Run COMPREHENSIVE line tracing on ALL images (15 tests per image^)
    echo   --all-line-artistic  Run artistic line tracing variations (8 tests per image^)
    echo   --help               Show this help message
    echo.
    echo Examples:
    echo   scripts\test-dot-mapping-auto.bat --all-dots
    echo   scripts\test-dot-mapping-auto.bat --all-dots-full
    echo   scripts\test-dot-mapping-auto.bat --all-line
    echo.
    pause
    exit /b 0
)

:: Move to wasm directory
cd /d "%~dp0.."

:: Show header
echo.
echo ================================================================================
if /i "%MODE%"=="--all-dots" (
    echo  VEC2ART AUTOMATED DOT MAPPING TEST - BASIC
) else if /i "%MODE%"=="--all-dots-full" (
    echo  VEC2ART AUTOMATED DOT MAPPING TEST - COMPREHENSIVE
) else if /i "%MODE%"=="--all-line" (
    echo  VEC2ART AUTOMATED LINE TRACING TEST - BASIC
) else if /i "%MODE%"=="--all-line-full" (
    echo  VEC2ART AUTOMATED LINE TRACING TEST - COMPREHENSIVE  
) else if /i "%MODE%"=="--all-line-artistic" (
    echo  VEC2ART AUTOMATED LINE TRACING TEST - ARTISTIC
) else (
    echo  VEC2ART INTERACTIVE TEST MODE
    echo.
    echo This is a simplified automated script.
    echo For interactive mode, use test-dot-mapping-interactive.bat
    echo.
    pause
    exit /b 0
)
echo ================================================================================
echo Current directory: %CD%
echo.

:: Build project
echo Building project...
cargo build --release --bin vectorize-cli
if errorlevel 1 (
    echo Build failed!
    pause
    exit /b 1
)

:: Create output directories
if not exist "examples\outputs\dot_mapping" mkdir "examples\outputs\dot_mapping"
if not exist "examples\outputs\line_tracing" mkdir "examples\outputs\line_tracing"

:: Execute based on mode
if /i "%MODE%"=="--all-dots" (
    call :runBasicDots
) else if /i "%MODE%"=="--all-dots-full" (
    call :runFullDots
) else if /i "%MODE%"=="--all-line" (
    call :runBasicLine
) else if /i "%MODE%"=="--all-line-full" (
    call :runFullLine
) else if /i "%MODE%"=="--all-line-artistic" (
    call :runArtisticLine
)

echo.
echo ================================================================================
echo  TESTING COMPLETED SUCCESSFULLY
echo ================================================================================

pause
exit /b 0

:: Function: Basic Dot Mapping
:runBasicDots
echo Running basic dot mapping on all images...
for %%f in (examples\images_in\*.png examples\images_in\*.webp examples\images_in\*.jpg) do (
    set "imageName=%%~nf"
    echo Processing: !imageName! - Basic Dot Mapping
    
    :: Test 1: Ultra Fine
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\outputs\dot_mapping\!imageName!-1-dots-ultra-fine.svg" --backend dots --dot-density 0.05 --dot-size-range "0.2,0.8" --preserve-colors --adaptive-sizing
    
    :: Test 2: Fine  
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\outputs\dot_mapping\!imageName!-2-dots-fine.svg" --backend dots --dot-density 0.08 --dot-size-range "0.3,1.5" --preserve-colors --adaptive-sizing
    
    :: Test 3: Medium
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\outputs\dot_mapping\!imageName!-3-dots-medium.svg" --backend dots --dot-density 0.15 --dot-size-range "1.0,3.0" --preserve-colors --adaptive-sizing
    
    :: Test 4: Bold
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\outputs\dot_mapping\!imageName!-4-dots-bold.svg" --backend dots --dot-density 0.20 --dot-size-range "1.5,4.0" --preserve-colors --adaptive-sizing
    
    :: Test 5: Large  
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\outputs\dot_mapping\!imageName!-5-dots-large.svg" --backend dots --dot-density 0.25 --dot-size-range "2.0,5.0" --preserve-colors --adaptive-sizing
    
    :: Test 6: Sparse
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\outputs\dot_mapping\!imageName!-6-dots-sparse.svg" --backend dots --dot-density 0.40 --dot-size-range "3.0,6.0" --preserve-colors --adaptive-sizing
    
    echo Completed: !imageName! - 6 basic dot tests
)
exit /b 0

:: Function: Full Dot Mapping  
:runFullDots
echo Running comprehensive dot mapping on all images...
echo WARNING: This generates 18+ tests per image!
for %%f in (examples\images_in\*.png examples\images_in\*.webp examples\images_in\*.jpg) do (
    set "imageName=%%~nf"
    echo Processing: !imageName! - Comprehensive Dot Mapping
    
    :: Colorful Adaptive (3 tests)
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\outputs\dot_mapping\!imageName!-01-dots-ultra-fine-color-adaptive.svg" --backend dots --dot-density 0.05 --dot-size-range "0.2,0.8" --preserve-colors --adaptive-sizing
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\outputs\dot_mapping\!imageName!-02-dots-fine-color-adaptive.svg" --backend dots --dot-density 0.08 --dot-size-range "0.3,1.5" --preserve-colors --adaptive-sizing  
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\outputs\dot_mapping\!imageName!-03-dots-medium-color-adaptive.svg" --backend dots --dot-density 0.15 --dot-size-range "1.0,3.0" --preserve-colors --adaptive-sizing
    
    :: Monochrome Adaptive (3 tests)
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\outputs\dot_mapping\!imageName!-04-dots-ultra-fine-mono-adaptive.svg" --backend dots --dot-density 0.05 --dot-size-range "0.2,0.8" --adaptive-sizing
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\outputs\dot_mapping\!imageName!-05-dots-fine-mono-adaptive.svg" --backend dots --dot-density 0.08 --dot-size-range "0.3,1.5" --adaptive-sizing
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\outputs\dot_mapping\!imageName!-06-dots-medium-mono-adaptive.svg" --backend dots --dot-density 0.15 --dot-size-range "1.0,3.0" --adaptive-sizing
    
    :: Colorful Fixed (3 tests)
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\outputs\dot_mapping\!imageName!-07-dots-ultra-fine-color-fixed.svg" --backend dots --dot-density 0.05 --dot-size-range "0.5,0.5" --preserve-colors
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\outputs\dot_mapping\!imageName!-08-dots-fine-color-fixed.svg" --backend dots --dot-density 0.08 --dot-size-range "1.0,1.0" --preserve-colors
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\outputs\dot_mapping\!imageName!-09-dots-medium-color-fixed.svg" --backend dots --dot-density 0.15 --dot-size-range "2.0,2.0" --preserve-colors
    
    :: Monochrome Fixed (3 tests)
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\outputs\dot_mapping\!imageName!-10-dots-ultra-fine-mono-fixed.svg" --backend dots --dot-density 0.05 --dot-size-range "0.5,0.5"
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\outputs\dot_mapping\!imageName!-11-dots-fine-mono-fixed.svg" --backend dots --dot-density 0.08 --dot-size-range "1.0,1.0"
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\outputs\dot_mapping\!imageName!-12-dots-medium-mono-fixed.svg" --backend dots --dot-density 0.15 --dot-size-range "2.0,2.0"
    
    :: Background Variations (2 tests)
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\outputs\dot_mapping\!imageName!-13-dots-medium-strict-bg.svg" --backend dots --dot-density 0.15 --dot-size-range "1.0,3.0" --preserve-colors --adaptive-sizing --background-tolerance 0.05
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\outputs\dot_mapping\!imageName!-14-dots-medium-permissive-bg.svg" --backend dots --dot-density 0.15 --dot-size-range "1.0,3.0" --preserve-colors --adaptive-sizing --background-tolerance 0.3
    
    :: Extreme Variations (4 tests)
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\outputs\dot_mapping\!imageName!-15-dots-bold-color-adaptive.svg" --backend dots --dot-density 0.20 --dot-size-range "1.5,4.0" --preserve-colors --adaptive-sizing
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\outputs\dot_mapping\!imageName!-16-dots-large-mono-fixed.svg" --backend dots --dot-density 0.25 --dot-size-range "3.0,3.1"
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\outputs\dot_mapping\!imageName!-17-dots-sparse-permissive.svg" --backend dots --dot-density 0.40 --dot-size-range "3.0,6.0" --preserve-colors --adaptive-sizing --background-tolerance 0.3
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\outputs\dot_mapping\!imageName!-18-dots-extra-dense-mono-strict.svg" --backend dots --dot-density 0.03 --dot-size-range "0.2,0.6" --background-tolerance 0.05
    
    echo Completed: !imageName! - 18 comprehensive dot tests
)
exit /b 0

:: Function: Basic Line Tracing
:runBasicLine
echo Running basic line tracing on all images...
for %%f in (examples\images_in\*.png examples\images_in\*.webp examples\images_in\*.jpg) do (
    set "imageName=%%~nf"
    echo Processing: !imageName! - Basic Line Tracing
    
    :: Test 1: Basic
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\outputs\line_tracing\!imageName!-1-edge-basic.svg" --backend edge --detail 0.3
    
    :: Test 2: High Detail
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\outputs\line_tracing\!imageName!-2-edge-detail.svg" --backend edge --detail 0.4
    
    :: Test 3: Multipass
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\outputs\line_tracing\!imageName!-3-edge-multipass.svg" --backend edge --detail 0.3 --multipass
    
    :: Test 4: Directional
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\outputs\line_tracing\!imageName!-4-edge-directional.svg" --backend edge --detail 0.3 --multipass --enable-reverse --enable-diagonal
    
    :: Test 5: Centerline Backend
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\outputs\line_tracing\!imageName!-5-centerline-basic.svg" --backend centerline --detail 0.3
    
    :: Test 6: Superpixel Backend
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\outputs\line_tracing\!imageName!-6-superpixel-basic.svg" --backend superpixel --detail 0.3
    
    echo Completed: !imageName! - 6 basic line tests
)
exit /b 0

:: Function: Full Line Tracing
:runFullLine
echo Running comprehensive line tracing on all images...
echo WARNING: This generates 15 tests per image!
for %%f in (examples\\images_in\\*.png examples\\images_in\\*.webp examples\\images_in\\*.jpg) do (
    set "imageName=%%~nf"
    echo Processing: !imageName! - Comprehensive Line Tracing
    
    :: === Basic Edge Tests (4 tests) ===
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\\outputs\\line_tracing\\!imageName!-01-edge-basic.svg" --backend edge --detail 0.3
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\\outputs\\line_tracing\\!imageName!-02-edge-detail.svg" --backend edge --detail 0.4
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\\outputs\\line_tracing\\!imageName!-03-edge-noise-filtered.svg" --backend edge --detail 0.3 --noise-filtering
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\\outputs\\line_tracing\\!imageName!-04-edge-thick.svg" --backend edge --detail 0.4 --stroke-width 2.0
    
    :: === Multipass Tests (2 tests) ===
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\\outputs\\line_tracing\\!imageName!-05-edge-multipass.svg" --backend edge --detail 0.3 --multipass
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\\outputs\\line_tracing\\!imageName!-06-edge-directional.svg" --backend edge --detail 0.3 --multipass --enable-reverse --enable-diagonal
    
    :: === Hand-drawn Artistic Tests (4 tests) ===
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\\outputs\\line_tracing\\!imageName!-07-edge-subtle.svg" --backend edge --detail 0.3 --hand-drawn subtle
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\\outputs\\line_tracing\\!imageName!-08-edge-medium.svg" --backend edge --detail 0.3 --hand-drawn medium
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\\outputs\\line_tracing\\!imageName!-09-edge-strong.svg" --backend edge --detail 0.3 --hand-drawn strong
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\\outputs\\line_tracing\\!imageName!-10-edge-sketchy.svg" --backend edge --detail 0.3 --hand-drawn sketchy
    
    :: === Advanced Combinations (3 tests) ===
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\\outputs\\line_tracing\\!imageName!-11-edge-multipass-medium.svg" --backend edge --detail 0.3 --multipass --hand-drawn medium
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\\outputs\\line_tracing\\!imageName!-12-edge-directional-sketchy.svg" --backend edge --detail 0.3 --multipass --enable-reverse --enable-diagonal --hand-drawn sketchy
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\\outputs\\line_tracing\\!imageName!-13-edge-filtered-medium.svg" --backend edge --detail 0.4 --noise-filtering --hand-drawn medium
    
    :: === New Backend Tests (2 tests) ===
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\\outputs\\line_tracing\\!imageName!-14-centerline-basic.svg" --backend centerline --detail 0.3
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\\outputs\\line_tracing\\!imageName!-15-superpixel-basic.svg" --backend superpixel --detail 0.3
    
    echo Completed: !imageName! - 15 comprehensive line tests
)
exit /b 0

:: Function: Artistic Line Tracing  
:runArtisticLine
echo Running artistic line tracing on all images...
echo WARNING: This generates 8+ tests per image!
for %%f in (examples\\images_in\\*.png examples\\images_in\\*.webp examples\\images_in\\*.jpg) do (
    set "imageName=%%~nf"
    echo Processing: !imageName! - Artistic Line Tracing
    
    :: === Basic Hand-drawn Variants (4 tests) ===
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\\outputs\\line_tracing\\!imageName!-01-edge-subtle.svg" --backend edge --detail 0.3 --hand-drawn subtle
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\\outputs\\line_tracing\\!imageName!-02-edge-medium.svg" --backend edge --detail 0.3 --hand-drawn medium
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\\outputs\\line_tracing\\!imageName!-03-edge-strong.svg" --backend edge --detail 0.3 --hand-drawn strong
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\\outputs\\line_tracing\\!imageName!-04-edge-sketchy.svg" --backend edge --detail 0.3 --hand-drawn sketchy
    
    :: === Multipass with Artistic Effects (2 tests) ===
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\\outputs\\line_tracing\\!imageName!-05-edge-multipass-medium.svg" --backend edge --detail 0.3 --multipass --hand-drawn medium
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\\outputs\\line_tracing\\!imageName!-06-edge-multipass-strong.svg" --backend edge --detail 0.3 --multipass --hand-drawn strong
    
    :: === Advanced Directional with Artistic Effects (2 tests) ===
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\\outputs\\line_tracing\\!imageName!-07-edge-directional-subtle.svg" --backend edge --detail 0.3 --multipass --enable-reverse --enable-diagonal --hand-drawn subtle
    cargo run --release --bin vectorize-cli -- trace-low "%%f" "examples\\outputs\\line_tracing\\!imageName!-08-edge-directional-sketchy.svg" --backend edge --detail 0.3 --multipass --enable-reverse --enable-diagonal --hand-drawn sketchy
    
    echo Completed: !imageName! - 8 artistic line tests
)
exit /b 0