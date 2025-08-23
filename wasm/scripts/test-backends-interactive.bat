@echo off
setlocal enabledelayedexpansion

:: Handle command line arguments
set "AUTO_MODE="
set "AUTO_SELECTION="

if /i "%1"=="--all-dots" (
    set "AUTO_MODE=true"
    set "AUTO_SELECTION=2ABCDEFHJ"
    echo Running in automated mode: ALL dot mapping methods on ALL images
) else if /i "%1"=="--all-dot" (
    echo ERROR: Invalid flag '--all-dot'. Did you mean '--all-dots'?
    echo.
    echo Usage: test-backends-interactive.bat [OPTIONS]
    echo   --all-dots    Run ALL dot mapping methods on ALL images
    echo   --all-line    Run ALL line tracing methods on ALL images
    echo   --help        Show help message
    echo.
    pause
    exit /b 1
) else if /i "%1"=="--all-line" (
    set "AUTO_MODE=true"
    set "AUTO_SELECTION=1MNOP"
    echo Running in automated mode: ALL line tracing methods on ALL images
) else if /i "%1"=="--all-lines" (
    echo ERROR: Invalid flag '--all-lines'. Did you mean '--all-line'?
    echo.
    echo Usage: test-backends-interactive.bat [OPTIONS]
    echo   --all-dots    Run ALL dot mapping methods on ALL images
    echo   --all-line    Run ALL line tracing methods on ALL images
    echo   --help        Show help message
    echo.
    pause
    exit /b 1
) else if /i "%1"=="--help" (
    echo.
    echo Usage: test-backends-interactive.bat [OPTIONS]
    echo.
    echo OPTIONS:
    echo   --all-dots    Run ALL dot mapping methods on ALL images automatically
    echo   --all-line    Run ALL line tracing methods on ALL images automatically
    echo   --help        Show this help message
    echo.
    echo Examples:
    echo   scripts\test-backends-interactive.bat
    echo   scripts\test-backends-interactive.bat --all-dots
    echo   scripts\test-backends-interactive.bat --all-line
    echo.
    pause
    exit /b 0
) else if not "%1"=="" (
    echo ERROR: Unknown option '%1'
    echo.
    echo Usage: test-backends-interactive.bat [OPTIONS]
    echo   --all-dots    Run ALL dot mapping methods on ALL images
    echo   --all-line    Run ALL line tracing methods on ALL images
    echo   --help        Show help message
    echo.
    pause
    exit /b 1
)

:: Ensure we're in the correct directory
cd /d "%~dp0.."

echo.
echo ================================================================================
if "!AUTO_MODE!"=="true" (
    echo  VEC2ART AUTOMATED TEST SUITE - !AUTO_SELECTION!
) else (
    echo  VEC2ART INTERACTIVE BACKEND TEST SUITE
)
echo ================================================================================
if "!AUTO_MODE!"=="true" (
    echo Running automated tests on ALL images with pre-selected algorithms.
    echo Selection: !AUTO_SELECTION!
    if "!AUTO_SELECTION!"=="2ABCDEFHJ" (
        echo Methods: ALL dot mapping styles with colors and adaptive sizing
    ) else if "!AUTO_SELECTION!"=="1MNOP" (
        echo Methods: ALL line tracing methods (Basic, High Detail, Multipass, Directional)
    )
)
if "!AUTO_MODE!" neq "true" (
    echo This interactive mode lets you choose which algorithms to test for each image.
    echo You can test different combinations of backends, densities, and artistic styles.
)
echo Current directory: %CD%
echo.

:: Build first
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
if not exist "examples\outputs\centerline_tracing" mkdir "examples\outputs\centerline_tracing"
if not exist "examples\outputs\superpixel_regions" mkdir "examples\outputs\superpixel_regions"
if not exist "examples\performance_reports" mkdir "examples\performance_reports"

:: Get list of available images
echo.
echo ================================================================================
echo  AVAILABLE TEST IMAGES
echo ================================================================================
echo.
set imageCount=0
for %%f in (examples\images_in\*.png examples\images_in\*.webp examples\images_in\*.jpg) do (
    set /a imageCount+=1
    set "image!imageCount!=%%f"
    echo [!imageCount!] %%~nxf
)

if %imageCount%==0 (
    echo No images found in examples\images_in\
    pause
    exit /b 1
)

echo.
echo ================================================================================
echo  INTERACTIVE IMAGE PROCESSING
echo ================================================================================
echo.

:: Process each image interactively
for /l %%i in (1,1,%imageCount%) do (
    call :processImage "!image%%i!" %%i
)

echo.
echo ================================================================================
if "!AUTO_MODE!"=="true" (
    echo  AUTOMATED TESTING COMPLETED
) else (
    echo  INTERACTIVE TESTING COMPLETED
)
echo ================================================================================
echo.
echo Test Summary:
echo - All selected tests have been completed
echo - Output directories: 
echo   examples\outputs\dot_mapping\ (dots backend)
echo   examples\outputs\line_tracing\ (edge backend)
echo   examples\outputs\centerline_tracing\ (centerline backend)
echo   examples\outputs\superpixel_regions\ (superpixel backend)
echo - Generated files follow the naming pattern: {imageName}-{testNumber}-{method}-{style}.svg
echo.
echo Generated Files:
for %%f in (examples\outputs\dot_mapping\*.svg examples\outputs\line_tracing\*.svg examples\outputs\centerline_tracing\*.svg examples\outputs\superpixel_regions\*.svg) do (
    echo   %%~nxf
)
echo.
if "!AUTO_MODE!" neq "true" (
    set /p "openDir=Open output directory in Explorer? (y/n): "
    if /i "!openDir!"=="y" (
        start "" "examples\outputs"
    )
)
echo.
if "!AUTO_MODE!"=="true" (
    echo Automated testing completed successfully!
) else (
    echo Thank you for using the Interactive Backend Test Suite!
)
pause
exit /b 0

:: Function to process a single image with user choices
:processImage
set "imagePath=%~1"
set "imageNum=%~2"
set "imageName=%~n1"
set "testCount=0"

echo.
echo ********************************************************************************
echo  PROCESSING: %imageName%
echo ********************************************************************************
echo Image path: %imagePath%
echo.

:: Handle automated vs interactive mode
if "!AUTO_MODE!"=="true" (
    echo Auto-testing %imageName% with selection: !AUTO_SELECTION!
    set "selections=!AUTO_SELECTION!"
    goto :skipSelection
)

:: Interactive mode - ask if user wants to test this image
set /p "testImage=Do you want to test %imageName%? (y/n): "
if /i "!testImage!" neq "y" (
    echo Skipping %imageName%
    exit /b 0
)

:getSelections

echo.
echo Available test methods for %imageName%:
echo.
echo ================================================================================
echo  QUICK OPTIONS
echo ================================================================================
echo [ALL]  = Run ALL available methods (~15+ tests, 5-10 minutes per image)
echo [EDGE] = Run ALL edge backend methods (4 tests, ~30 seconds per image)
echo [DOTS] = Run ALL dots backend methods with colors (8 tests, 2-5 minutes per image)
echo [FAST] = Run fast methods only (2 tests, ~15 seconds per image)
echo.
echo ================================================================================
echo  BACKEND OPTIONS
echo ================================================================================
echo [1] Edge Backend (Traditional line tracing)
echo [2] Dots Backend (All dot mapping options below)
echo [3] Centerline Backend (Skeleton-based line extraction)
echo [4] Superpixel Backend (Region-based line art)
echo.
echo ================================================================================
echo  DOT MAPPING DENSITY STYLES (if Dots Backend selected)
echo ================================================================================
echo [A] Ultra Fine Stippling    (density: 0.05, size: 0.2-0.8px)
echo [B] Fine Stippling          (density: 0.08, size: 0.3-1.5px)  
echo [C] Medium Artistic         (density: 0.15, size: 1.0-3.0px)
echo [D] Bold Pointillism        (density: 0.20, size: 1.5-4.0px)
echo [E] Large Artistic          (density: 0.25, size: 2.0-5.0px)
echo [F] Sparse Dramatic         (density: 0.40, size: 3.0-6.0px)
echo.
echo ================================================================================
echo  DOT MAPPING COLOR OPTIONS (if Dots Backend selected)
echo ================================================================================
echo [G] Monochrome (black dots)
echo [H] Preserve Colors (colorful stippling/pointillism)
echo.
echo ================================================================================
echo  DOT MAPPING TECHNICAL OPTIONS (if Dots Backend selected)
echo ================================================================================
echo [I] Standard Processing
echo [J] Adaptive Sizing (varies dot size based on image complexity)
echo [K] Strict Background (low tolerance for clean images)
echo [L] Permissive Background (high tolerance for textured images)
echo.
echo ================================================================================
echo  ADVANCED EDGE OPTIONS (if Edge Backend selected)
echo ================================================================================
echo [M] Basic Edge Detection    (detail: 0.3)
echo [N] High Detail Edge        (detail: 0.4)
echo [O] Multipass Edge          (enhanced quality)
echo [P] Directional Multipass   (maximum quality with reverse/diagonal passes)
echo.
echo ================================================================================
echo  CENTERLINE OPTIONS (if Centerline Backend selected)
echo ================================================================================
echo [Q] Basic Centerline        (skeleton-based tracing)
echo [R] High Detail Centerline  (enhanced skeleton extraction)
echo.
echo ================================================================================
echo  SUPERPIXEL OPTIONS (if Superpixel Backend selected)
echo ================================================================================
echo [S] Basic Superpixel        (region-based line art)
echo [T] Detailed Superpixel     (high-resolution regions)
echo.
echo ================================================================================
echo  SELECTION EXAMPLES
echo ================================================================================
echo Edge Backend Examples:
echo   "1M"     = Edge backend with Basic detection
echo   "1MNO"   = Edge backend with Basic, High Detail, and Multipass
echo   "1P"     = Edge backend with advanced Directional Multipass
echo.
echo Dots Backend Examples:
echo   "2C"     = Dots backend with Medium Artistic (basic)
echo   "2CHJ"   = Dots with Medium Artistic + Preserve Colors + Adaptive Sizing
echo   "2ABCHIJK" = Multiple dot styles with all color/technical options
echo.
echo Centerline Backend Examples:
echo   "3Q"     = Centerline backend with Basic skeleton tracing
echo   "3QR"    = Centerline with both Basic and High Detail
echo.
echo Superpixel Backend Examples:
echo   "4S"     = Superpixel backend with Basic regions
echo   "4ST"    = Superpixel with both Basic and Detailed regions
echo.
echo Combined Examples:
echo   "12CH"   = Both Edge AND Dots backends with color preservation
echo   "1234MNACHJ" = All backends with multiple options
echo   "13QM"   = Edge and Centerline backends with basic options
echo.
echo Enter 'h' for help, or your selections:
set /p "selections=Your choices: "

:: Handle help
if /i "!selections!"=="h" (
    call :showHelp
    goto :getSelections
)

:: Handle quick options
if /i "!selections!"=="all" (
    echo.
    echo WARNING: ALL option will run 20+ comprehensive tests on this image.
    echo Estimated time: 7-12 minutes depending on image size and complexity.
    echo This includes:
    echo   - 4 Edge backend methods (Basic, High Detail, Multipass, Directional)
    echo   - 6 Dots density styles (Ultra Fine to Sparse Dramatic)
    echo   - 2 Centerline backend methods (Basic, High Detail)
    echo   - 2 Superpixel backend methods (Basic, Detailed)
    echo   - Multiple color and technical option combinations
    echo.
    set /p "confirmAll=Continue with comprehensive testing? (y/n): "
    if /i "!confirmAll!" neq "y" (
        echo Cancelled. Please select specific methods instead.
        goto :getSelections
    )
    set "selections=1234MNOPQRSTABCDEFGHIJKL"
    echo.
    echo Running ALL available methods - this will take several minutes...
    echo.
)
if /i "!selections!"=="edge" (
    set "selections=1MNOP"
    echo.
    echo Running ALL edge backend methods...
    echo.
)
if /i "!selections!"=="dots" (
    set "selections=2ABCDEFHJ"
    echo.
    echo Running ALL dots backend methods with color variants...
    echo.
)
if /i "!selections!"=="fast" (
    set "selections=1M2CJ"
    echo.
    echo Running FAST methods only...
    echo.
)

if "!selections!"=="" (
    echo No selections made, skipping %imageName%
    exit /b 0
)

:skipSelection

:: Parse selections and execute tests
set "edgeSelected=false"
set "dotsSelected=false"
set "centerlineSelected=false"
set "superpixelSelected=false"

:: Debug output for automated mode
if "!AUTO_MODE!"=="true" (
    echo [DEBUG] Automated mode - selections: !selections!
)

:: Handle case where user enters just "2" (dots only) without style options
if "!selections!"=="2" (
    echo.
    echo You selected Dots backend but no specific styles. Using default Medium Artistic with colors.
    set "selections=2CHJ"
    echo.
)

:: Handle case where user enters just "1" (edge only) without options  
if "!selections!"=="1" (
    echo.
    echo You selected Edge backend but no specific options. Using default Basic Edge Detection.
    set "selections=1M"
    echo.
)

:: Handle case where user enters just "3" (centerline only) without options  
if "!selections!"=="3" (
    echo.
    echo You selected Centerline backend but no specific options. Using default Basic Centerline.
    set "selections=3Q"
    echo.
)

:: Handle case where user enters just "4" (superpixel only) without options  
if "!selections!"=="4" (
    echo.
    echo You selected Superpixel backend but no specific options. Using default Basic Superpixel.
    set "selections=4S"
    echo.
)

:: Check if backends are selected using string substitution
set "tempSel=!selections!"
if not "!tempSel:1=!"=="!tempSel!" set "edgeSelected=true"
if not "!tempSel:2=!"=="!tempSel!" set "dotsSelected=true"
if not "!tempSel:3=!"=="!tempSel!" set "centerlineSelected=true"
if not "!tempSel:4=!"=="!tempSel!" set "superpixelSelected=true"

:: Debug output for automated mode
if "!AUTO_MODE!"=="true" (
    echo [DEBUG] edgeSelected: !edgeSelected!, dotsSelected: !dotsSelected!, centerlineSelected: !centerlineSelected!, superpixelSelected: !superpixelSelected!
)

if "!edgeSelected!"=="false" if "!dotsSelected!"=="false" if "!centerlineSelected!"=="false" if "!superpixelSelected!"=="false" (
    echo Error: You must select at least one backend (1=Edge, 2=Dots, 3=Centerline, 4=Superpixel)
    if "!AUTO_MODE!"=="true" (
        echo Invalid automated selection: !AUTO_SELECTION!
        exit /b 1
    ) else (
        goto :getSelections
    )
)

echo.
echo Processing %imageName% with selected methods...
echo.

:: Execute Edge Backend tests
if "!edgeSelected!"=="true" (
    call :runEdgeTests "%imagePath%" "%imageName%" "!selections!"
)

:: Execute Dots Backend tests  
if "!dotsSelected!"=="true" (
    call :runDotsTests "%imagePath%" "%imageName%" "!selections!"
)

:: Execute Centerline Backend tests  
if "!centerlineSelected!"=="true" (
    call :runCenterlineTests "%imagePath%" "%imageName%" "!selections!"
)

:: Execute Superpixel Backend tests  
if "!superpixelSelected!"=="true" (
    call :runSuperpixelTests "%imagePath%" "%imageName%" "!selections!"
)

:: Show progress in automated mode
if "!AUTO_MODE!"=="true" (
    echo ----------------------------------------
    echo Completed: %imageName% - !testCount! tests generated
    echo ----------------------------------------
)

echo.
echo Completed processing %imageName%
echo.
exit /b 0

:: Function to show detailed help
:showHelp
echo.
echo ================================================================================
echo  DETAILED HELP
echo ================================================================================
echo.
echo BACKEND SELECTION (Required - choose at least one):
echo   1 = Edge Backend (traditional line tracing)
echo   2 = Dots Backend (stippling/pointillism effects)
echo   3 = Centerline Backend (skeleton-based line extraction)
echo   4 = Superpixel Backend (region-based line art)
echo.
echo EDGE BACKEND OPTIONS (use with 1):
echo   M = Basic Edge Detection (detail: 0.3, fast)
echo   N = High Detail Edge (detail: 0.4, more precise)
echo   O = Multipass Edge (enhanced quality, slower)
echo   P = Directional Multipass (maximum quality, comprehensive)
echo.
echo CENTERLINE BACKEND OPTIONS (use with 3):
echo   Q = Basic Centerline (skeleton-based tracing)
echo   R = High Detail Centerline (enhanced skeleton extraction)
echo.
echo SUPERPIXEL BACKEND OPTIONS (use with 4):
echo   S = Basic Superpixel (region-based line art)
echo   T = Detailed Superpixel (high-resolution regions)
echo.
echo DOT BACKEND DENSITY STYLES (use with 2):
echo   A = Ultra Fine Stippling (0.05 density, 0.2-0.8px dots)
echo   B = Fine Stippling (0.08 density, 0.3-1.5px dots)
echo   C = Medium Artistic (0.15 density, 1.0-3.0px dots)
echo   D = Bold Pointillism (0.20 density, 1.5-4.0px dots)
echo   E = Large Artistic (0.25 density, 2.0-5.0px dots)
echo   F = Sparse Dramatic (0.40 density, 3.0-6.0px dots)
echo.
echo DOT BACKEND COLOR OPTIONS (use with 2):
echo   G = Monochrome (black dots only)
echo   H = Preserve Colors (colorful stippling/pointillism)
echo.
echo DOT BACKEND TECHNICAL OPTIONS (use with 2):
echo   I = Standard Processing (default settings)
echo   J = Adaptive Sizing (varies dot size based on complexity)
echo   K = Strict Background (low tolerance, clean images)
echo   L = Permissive Background (high tolerance, textured images)
echo.
echo QUICK OPTIONS:
echo   ALL    = Run every available method (comprehensive testing)
echo   EDGE   = Run all edge backend methods (1MNOP)
echo   DOTS   = Run all dots backend methods with colors (2ABCDEFHJ)
echo   FAST   = Run fast methods only (1M + 2CJ)
echo.
echo COMBINATION EXAMPLES:
echo   "1M"      = Edge backend, basic detection
echo   "2CH"     = Dots backend, medium artistic, preserve colors
echo   "3Q"      = Centerline backend, basic skeleton
echo   "4S"      = Superpixel backend, basic regions
echo   "2ACHJ"   = Dots with ultra fine + medium + colors + adaptive
echo   "1234MNQSCH" = All backends with multiple options
echo   "13MQ"    = Edge and Centerline with basic options
echo.
echo Press any key to continue...
pause >nul
echo.
exit /b 0

:: Function to run Edge Backend tests
:runEdgeTests
set "imagePath=%~1"
set "imageName=%~2"  
set "selections=%~3"

echo Running Edge Backend tests...

:: Basic Edge Detection [M]
echo %selections% | findstr /i "M" >nul && (
    set /a testCount+=1
    echo [!testCount!] %imageName% - Basic Edge Detection
    cargo run --release --bin vectorize-cli -- trace-low "%imagePath%" "examples\outputs\line_tracing\%imageName%-!testCount!-edge-basic.svg" --backend edge --detail 0.3
)

:: High Detail Edge [N]  
echo %selections% | findstr /i "N" >nul && (
    set /a testCount+=1
    echo [!testCount!] %imageName% - High Detail Edge
    cargo run --release --bin vectorize-cli -- trace-low "%imagePath%" "examples\outputs\line_tracing\%imageName%-!testCount!-edge-detail.svg" --backend edge --detail 0.4
)

:: Multipass Edge [O]
echo %selections% | findstr /i "O" >nul && (
    set /a testCount+=1
    echo [!testCount!] %imageName% - Multipass Edge
    cargo run --release --bin vectorize-cli -- trace-low "%imagePath%" "examples\outputs\line_tracing\%imageName%-!testCount!-edge-multipass.svg" --backend edge --detail 0.3 --multipass
)

:: Directional Multipass [P]
echo %selections% | findstr /i "P" >nul && (
    set /a testCount+=1
    echo [!testCount!] %imageName% - Directional Multipass Edge
    cargo run --release --bin vectorize-cli -- trace-low "%imagePath%" "examples\outputs\line_tracing\%imageName%-!testCount!-edge-directional.svg" --backend edge --detail 0.3 --multipass --enable-reverse --enable-diagonal
)

exit /b 0

:: Function to run Dots Backend tests
:runDotsTests
set "imagePath=%~1"
set "imageName=%~2"
set "selections=%~3"

echo Running Dots Backend tests...

:: Determine color and technical options
set "colorOpt="
set "adaptiveOpt="
set "backgroundOpt="

echo %selections% | findstr /i "H" >nul && set "colorOpt=--preserve-colors"
echo %selections% | findstr /i "J" >nul && set "adaptiveOpt=--adaptive-sizing" 
echo %selections% | findstr /i "K" >nul && set "backgroundOpt=--background-tolerance 0.05"
echo %selections% | findstr /i "L" >nul && set "backgroundOpt=--background-tolerance 0.3"

:: Ultra Fine Stippling [A]
echo %selections% | findstr /i "A" >nul && (
    set /a testCount+=1
    echo [!testCount!] %imageName% - Ultra Fine Stippling
    cargo run --release --bin vectorize-cli -- trace-low "%imagePath%" "examples\outputs\dot_mapping\%imageName%-!testCount!-dots-ultra-fine.svg" --backend dots --dot-density 0.05 --dot-size-range "0.2,0.8" !colorOpt! !adaptiveOpt! !backgroundOpt!
)

:: Fine Stippling [B]
echo %selections% | findstr /i "B" >nul && (
    set /a testCount+=1
    echo [!testCount!] %imageName% - Fine Stippling
    cargo run --release --bin vectorize-cli -- trace-low "%imagePath%" "examples\outputs\dot_mapping\%imageName%-!testCount!-dots-fine.svg" --backend dots --dot-density 0.08 --dot-size-range "0.3,1.5" !colorOpt! !adaptiveOpt! !backgroundOpt!
)

:: Medium Artistic [C]
echo %selections% | findstr /i "C" >nul && (
    set /a testCount+=1
    echo [!testCount!] %imageName% - Medium Artistic
    cargo run --release --bin vectorize-cli -- trace-low "%imagePath%" "examples\outputs\dot_mapping\%imageName%-!testCount!-dots-medium.svg" --backend dots --dot-density 0.15 --dot-size-range "1.0,3.0" !colorOpt! !adaptiveOpt! !backgroundOpt!
)

:: Bold Pointillism [D]
echo %selections% | findstr /i "D" >nul && (
    set /a testCount+=1
    echo [!testCount!] %imageName% - Bold Pointillism  
    cargo run --release --bin vectorize-cli -- trace-low "%imagePath%" "examples\outputs\dot_mapping\%imageName%-!testCount!-dots-bold.svg" --backend dots --dot-density 0.20 --dot-size-range "1.5,4.0" !colorOpt! !adaptiveOpt! !backgroundOpt!
)

:: Large Artistic [E]
echo %selections% | findstr /i "E" >nul && (
    set /a testCount+=1
    echo [!testCount!] %imageName% - Large Artistic
    cargo run --release --bin vectorize-cli -- trace-low "%imagePath%" "examples\outputs\dot_mapping\%imageName%-!testCount!-dots-large.svg" --backend dots --dot-density 0.25 --dot-size-range "2.0,5.0" !colorOpt! !adaptiveOpt! !backgroundOpt!
)

:: Sparse Dramatic [F]
echo %selections% | findstr /i "F" >nul && (
    set /a testCount+=1
    echo [!testCount!] %imageName% - Sparse Dramatic
    cargo run --release --bin vectorize-cli -- trace-low "%imagePath%" "examples\outputs\dot_mapping\%imageName%-!testCount!-dots-sparse.svg" --backend dots --dot-density 0.40 --dot-size-range "3.0,6.0" !colorOpt! !adaptiveOpt! !backgroundOpt!
)

exit /b 0

:: Function to run Centerline Backend tests
:runCenterlineTests
set "imagePath=%~1"
set "imageName=%~2"
set "selections=%~3"

echo Running Centerline Backend tests...

:: Basic Centerline [Q]
echo %selections% | findstr /i "Q" >nul && (
    set /a testCount+=1
    echo [!testCount!] %imageName% - Basic Centerline
    cargo run --release --bin vectorize-cli -- trace-low "%imagePath%" "examples\outputs\centerline_tracing\%imageName%-!testCount!-centerline-basic.svg" --backend centerline --detail 0.3
)

:: High Detail Centerline [R]
echo %selections% | findstr /i "R" >nul && (
    set /a testCount+=1
    echo [!testCount!] %imageName% - High Detail Centerline
    cargo run --release --bin vectorize-cli -- trace-low "%imagePath%" "examples\outputs\centerline_tracing\%imageName%-!testCount!-centerline-detail.svg" --backend centerline --detail 0.4
)

exit /b 0

:: Function to run Superpixel Backend tests
:runSuperpixelTests
set "imagePath=%~1"
set "imageName=%~2"
set "selections=%~3"

echo Running Superpixel Backend tests...

:: Basic Superpixel [S]
echo %selections% | findstr /i "S" >nul && (
    set /a testCount+=1
    echo [!testCount!] %imageName% - Basic Superpixel
    cargo run --release --bin vectorize-cli -- trace-low "%imagePath%" "examples\outputs\superpixel_regions\%imageName%-!testCount!-superpixel-basic.svg" --backend superpixel --detail 0.3
)

:: Detailed Superpixel [T]
echo %selections% | findstr /i "T" >nul && (
    set /a testCount+=1
    echo [!testCount!] %imageName% - Detailed Superpixel
    cargo run --release --bin vectorize-cli -- trace-low "%imagePath%" "examples\outputs\superpixel_regions\%imageName%-!testCount!-superpixel-detail.svg" --backend superpixel --detail 0.4
)

exit /b 0