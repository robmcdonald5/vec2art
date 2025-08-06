@echo off
setlocal enabledelayedexpansion

REM Ensure we're running from the wasm directory
if not exist Cargo.toml (
    echo Error: This script must be run from the wasm directory
    echo Please navigate to the wasm folder and run this script again
    pause
    exit /b 1
)

echo 🧪 Vec2Art Algorithm Testing Suite
echo ==================================

REM Create directories (relative to wasm folder - these are the correct paths)
if not exist examples mkdir examples
if not exist examples\images_in mkdir examples\images_in
if not exist examples\images_out mkdir examples\images_out

echo 📸 Creating sample test images in examples\images_in...
cargo test --example test_conversion test_create_sample_images

echo.
echo 🧪 Running unit tests...
cargo test

echo.
echo 🔄 Running integration tests...
cargo test --test integration_tests

echo.
echo 🎯 Processing all images in examples\images_in...
echo ================================================

set "input_dir=examples\images_in"
set "output_dir=examples\images_out"

REM Check if input directory has any images
set "found_images=false"
for %%f in ("%input_dir%\*.jpg" "%input_dir%\*.jpeg" "%input_dir%\*.png" "%input_dir%\*.webp") do (
    if exist "%%f" set "found_images=true"
)

if "%found_images%"=="false" (
    echo ⚠️  No images found in %input_dir%
    echo    Supported formats: .jpg, .jpeg, .png, .webp
    echo    Please add some test images and run again.
    goto :summary
)

REM Process each image file
for %%f in ("%input_dir%\*.jpg" "%input_dir%\*.jpeg" "%input_dir%\*.png" "%input_dir%\*.webp") do (
    if exist "%%f" (
        echo.
        echo 🖼️  Processing: %%~nxf
        echo ────────────────────────────────
        
        REM Get base filename without extension
        set "basename=%%~nf"
        
        echo   Edge Detection...
        cargo run --example test_conversion "%%f" edge_detector "%output_dir%\!basename!_edges.svg" 2>nul
        if errorlevel 1 (
            echo     ❌ Failed
        ) else (
            echo     ✅ Generated !basename!_edges.svg
        )
        
        echo   Path Tracing...
        cargo run --example test_conversion "%%f" path_tracer "%output_dir%\!basename!_paths.svg" 2>nul
        if errorlevel 1 (
            echo     ❌ Failed
        ) else (
            echo     ✅ Generated !basename!_paths.svg
        )
        
        echo   Geometric Fitting ^(quick mode^)...
        cargo run --example test_conversion "%%f" geometric_fitter "%output_dir%\!basename!_geometric.svg" 2>nul
        if errorlevel 1 (
            echo     ❌ Failed
        ) else (
            echo     ✅ Generated !basename!_geometric.svg
        )
    )
)

:summary
echo.
echo 📊 Results Summary:
echo ==================
echo Input folder:  %input_dir%
echo Output folder: %output_dir%
echo.
echo Generated SVG files:
if exist "%output_dir%\*.svg" (
    for %%f in ("%output_dir%\*.svg") do echo   - %%~nxf
) else (
    echo   ^(No SVG files generated^)
)
echo.
echo Unit test outputs:
if exist "test_*.svg" (
    for %%f in ("test_*.svg") do echo   - %%~nxf
) else (
    echo   ^(No unit test SVG files found^)
)

echo.
echo ✅ Testing complete! Open the .svg files in a browser to view results.
echo 💡 Tip: Add your own images to examples\images_in\ and run this script again.
pause