@echo off
setlocal enabledelayedexpansion
echo 🎨 Vec2Art Image Conversion
echo ===========================

REM Create directories if they don't exist
if not exist examples\images_in mkdir examples\images_in
if not exist examples\images_out mkdir examples\images_out

set "input_dir=examples\images_in"
set "output_dir=examples\images_out"

echo Input folder:  %input_dir%
echo Output folder: %output_dir%
echo.

REM Check if input directory has any images
set "found_images=false"
for %%f in ("%input_dir%\*.jpg" "%input_dir%\*.jpeg" "%input_dir%\*.png" "%input_dir%\*.webp") do (
    if exist "%%f" set "found_images=true"
)

if "!found_images!"=="false" (
    echo ⚠️  No images found in %input_dir%
    echo    Supported formats: .jpg, .jpeg, .png, .webp
    echo    Please add some test images and run again.
    echo.
    echo 💡 You can also run test_runner.bat to generate sample images first.
    pause
    exit /b
)

echo 🎯 Converting all images...
echo ===========================

REM Process each image file
for %%f in ("%input_dir%\*.jpg" "%input_dir%\*.jpeg" "%input_dir%\*.png" "%input_dir%\*.webp") do (
    if exist "%%f" (
        echo.
        echo 🖼️  Processing: %%~nxf
        echo ────────────────────────────────
        
        REM Get base filename without extension
        set "basename=%%~nf"
        
        echo   Edge Detection...
        cargo run --example test_conversion "%%f" edge_detector "%output_dir%\!basename!_edges.svg" >nul 2>&1
        if !errorlevel! equ 0 (
            echo     ✅ Generated !basename!_edges.svg
        ) else (
            echo     ❌ Failed
        )
        
        echo   Path Tracing...
        cargo run --example test_conversion "%%f" path_tracer "%output_dir%\!basename!_paths.svg" >nul 2>&1
        if !errorlevel! equ 0 (
            echo     ✅ Generated !basename!_paths.svg
        ) else (
            echo     ❌ Failed
        )
        
        echo   Geometric Fitting...
        cargo run --example test_conversion "%%f" geometric_fitter "%output_dir%\!basename!_geometric.svg" >nul 2>&1
        if !errorlevel! equ 0 (
            echo     ✅ Generated !basename!_geometric.svg
        ) else (
            echo     ❌ Failed
        )
    )
)

echo.
echo 📊 Conversion Complete!
echo ======================
echo Generated SVG files in %output_dir%:
if exist "%output_dir%\*.svg" (
    for %%f in ("%output_dir%\*.svg") do echo   - %%~nxf
) else (
    echo   ^(No SVG files generated^)
)

echo.
echo ✅ Done! Open the .svg files in a browser to view results.
pause