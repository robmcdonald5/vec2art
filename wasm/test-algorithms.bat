@echo off
setlocal enabledelayedexpansion
color 0F

echo.
echo ================================================================================
echo  VEC2ART ALGORITHM TESTBED - Updated for Phase A
echo ================================================================================
echo Testing logo preset, photo preset, and trace-low algorithms on all test images
echo Updated to use new preset system for logo/regions algorithms
echo.

:: Configuration
set "OUTPUT_DIR=examples\images_out"
set "IMAGE_DIR=examples\images_in"
set "ITERATIONS=3"

:: Create output directory
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

:: Check prerequisites
echo [INFO] Checking prerequisites...
if not exist "Cargo.toml" (
    echo [ERROR] Not in wasm directory. Please run from wasm folder.
    pause
    exit /b 1
)

if not exist "%IMAGE_DIR%" (
    echo [ERROR] Image directory not found: %IMAGE_DIR%
    pause
    exit /b 1
)

echo [OK] Working directory confirmed
echo [OK] Image directory found: %IMAGE_DIR%

:: Count and list all available images
set /a IMAGE_COUNT=0
echo [INFO] Available images:
for %%F in ("%IMAGE_DIR%\*.png" "%IMAGE_DIR%\*.jpg" "%IMAGE_DIR%\*.jpeg" "%IMAGE_DIR%\*.webp") do (
    if exist "%%F" (
        set /a IMAGE_COUNT+=1
        echo   - %%~nxF
    )
)
echo [INFO] Found !IMAGE_COUNT! images to test

:: Build project
echo [INFO] Building project in release mode...
cargo build --release --bin vectorize-cli > build.log 2>&1
if errorlevel 1 (
    echo [ERROR] Build failed. Check build.log for details.
    type build.log
    pause
    exit /b 1
)
echo [OK] Project built successfully

:: Initialize counters
set /a TOTAL_TESTS=0
set /a SUCCESSFUL_TESTS=0
set /a FAILED_TESTS=0

:: Create report header
echo # vec2art Algorithm Test Report > "%OUTPUT_DIR%\report.md"
echo. >> "%OUTPUT_DIR%\report.md"
echo **Generated:** %DATE% %TIME% >> "%OUTPUT_DIR%\report.md"
echo. >> "%OUTPUT_DIR%\report.md"
echo ^| Image ^| Preset/Algorithm ^| Status ^| Time (s) ^| Warnings ^| Output Size ^| >> "%OUTPUT_DIR%\report.md"
echo ^|-------^|----------------^|--------^|----------^|----------^|-------------^| >> "%OUTPUT_DIR%\report.md"

echo.
echo ================================================================================
echo  TESTING ALGORITHMS
echo ================================================================================

:: Test each image
for %%F in ("%IMAGE_DIR%\*.png" "%IMAGE_DIR%\*.jpg" "%IMAGE_DIR%\*.jpeg" "%IMAGE_DIR%\*.webp") do (
    if exist "%%F" (
        set "IMAGE_NAME=%%~nF"
        set "IMAGE_PATH=%%F"
        echo.
        echo [INFO] Testing image: !IMAGE_NAME!
        
        :: Test Logo Algorithm
        echo [TEST] Logo algorithm...
        set "LOGO_OUTPUT=%OUTPUT_DIR%\!IMAGE_NAME!-logo.svg"
        
        :: Measure time and run command
        set "START_TIME=!TIME!"
        cargo run --release --bin vectorize-cli -- preset "!IMAGE_PATH!" "!LOGO_OUTPUT!" logo > "%OUTPUT_DIR%\!IMAGE_NAME!-logo.log" 2>&1
        set "LOGO_EXIT_CODE=!ERRORLEVEL!"
        set "END_TIME=!TIME!"
        
        :: Calculate execution time (simplified)
        call :calculate_time_diff "!START_TIME!" "!END_TIME!" LOGO_DURATION
        
        :: Count warnings
        findstr /c:"WARN" "%OUTPUT_DIR%\!IMAGE_NAME!-logo.log" > "%OUTPUT_DIR%\temp_count.txt"
        for /f %%c in ('find /c /v "" ^< "%OUTPUT_DIR%\temp_count.txt"') do set "LOGO_WARNINGS=%%c"
        if !LOGO_WARNINGS! EQU 0 set "LOGO_WARNINGS=0"
        del "%OUTPUT_DIR%\temp_count.txt" 2>nul
        
        :: Check if output file exists and get size
        if exist "!LOGO_OUTPUT!" (
            for %%A in ("!LOGO_OUTPUT!") do set "LOGO_SIZE=%%~zA"
            set "LOGO_STATUS=SUCCESS"
            set /a SUCCESSFUL_TESTS+=1
            echo [OK] Logo completed - Time: !LOGO_DURATION!s, Warnings: !LOGO_WARNINGS!, Size: !LOGO_SIZE! bytes
        ) else (
            set "LOGO_SIZE=0"
            set "LOGO_STATUS=FAILED"
            set /a FAILED_TESTS+=1
            echo [ERROR] Logo failed - Exit code: !LOGO_EXIT_CODE!, Warnings: !LOGO_WARNINGS!
        )
        set /a TOTAL_TESTS+=1
        
        :: Add to report
        echo !IMAGE_NAME! ^| logo-preset ^| !LOGO_STATUS! ^| !LOGO_DURATION! ^| !LOGO_WARNINGS! ^| !LOGO_SIZE! ^| >> "%OUTPUT_DIR%\report.md"
        
        :: Test Photo Preset (was Regions Algorithm)
        echo [TEST] Photo preset (adaptive SLIC + Wu quantization)...
        set "REGIONS_OUTPUT=%OUTPUT_DIR%\!IMAGE_NAME!-photo.svg"
        
        :: Measure time and run command
        set "START_TIME=!TIME!"
        cargo run --release --bin vectorize-cli -- preset "!IMAGE_PATH!" "!REGIONS_OUTPUT!" photo > "%OUTPUT_DIR%\!IMAGE_NAME!-photo.log" 2>&1
        set "REGIONS_EXIT_CODE=!ERRORLEVEL!"
        set "END_TIME=!TIME!"
        
        :: Calculate execution time (simplified)
        call :calculate_time_diff "!START_TIME!" "!END_TIME!" REGIONS_DURATION
        
        :: Count warnings
        findstr /c:"WARN" "%OUTPUT_DIR%\!IMAGE_NAME!-photo.log" > "%OUTPUT_DIR%\temp_count.txt"
        for /f %%c in ('find /c /v "" ^< "%OUTPUT_DIR%\temp_count.txt"') do set "REGIONS_WARNINGS=%%c"
        if !REGIONS_WARNINGS! EQU 0 set "REGIONS_WARNINGS=0"
        del "%OUTPUT_DIR%\temp_count.txt" 2>nul
        
        :: Check if output file exists and get size
        if exist "!REGIONS_OUTPUT!" (
            for %%A in ("!REGIONS_OUTPUT!") do set "REGIONS_SIZE=%%~zA"
            set "REGIONS_STATUS=SUCCESS"
            set /a SUCCESSFUL_TESTS+=1
            echo [OK] Photo preset completed - Time: !REGIONS_DURATION!s, Warnings: !REGIONS_WARNINGS!, Size: !REGIONS_SIZE! bytes
        ) else (
            set "REGIONS_SIZE=0"
            set "REGIONS_STATUS=FAILED"
            set /a FAILED_TESTS+=1
            echo [ERROR] Photo preset failed - Exit code: !REGIONS_EXIT_CODE!, Warnings: !REGIONS_WARNINGS!
        )
        set /a TOTAL_TESTS+=1
        
        :: Add to report
        echo !IMAGE_NAME! ^| photo-preset ^| !REGIONS_STATUS! ^| !REGIONS_DURATION! ^| !REGIONS_WARNINGS! ^| !REGIONS_SIZE! ^| >> "%OUTPUT_DIR%\report.md"
        
        :: Test Trace-Low Algorithm (Edge backend)
        echo [TEST] Trace-low edge algorithm...
        set "TRACE_OUTPUT=%OUTPUT_DIR%\!IMAGE_NAME!-trace-edge.svg"
        
        :: Measure time and run command
        set "START_TIME=!TIME!"
        cargo run --release --bin vectorize-cli -- trace-low "!IMAGE_PATH!" "!TRACE_OUTPUT!" --backend edge --detail 0.3 > "%OUTPUT_DIR%\!IMAGE_NAME!-trace.log" 2>&1
        set "TRACE_EXIT_CODE=!ERRORLEVEL!"
        set "END_TIME=!TIME!"
        
        :: Calculate execution time
        call :calculate_time_diff "!START_TIME!" "!END_TIME!" TRACE_DURATION
        
        :: Count warnings
        findstr /c:"WARN" "%OUTPUT_DIR%\!IMAGE_NAME!-trace.log" > "%OUTPUT_DIR%\temp_count.txt"
        for /f %%c in ('find /c /v "" ^< "%OUTPUT_DIR%\temp_count.txt"') do set "TRACE_WARNINGS=%%c"
        if !TRACE_WARNINGS! EQU 0 set "TRACE_WARNINGS=0"
        del "%OUTPUT_DIR%\temp_count.txt" 2>nul
        
        :: Check if output file exists and get size
        if exist "!TRACE_OUTPUT!" (
            for %%A in ("!TRACE_OUTPUT!") do set "TRACE_SIZE=%%~zA"
            set "TRACE_STATUS=SUCCESS"
            set /a SUCCESSFUL_TESTS+=1
            echo [OK] Trace-low completed - Time: !TRACE_DURATION!s, Warnings: !TRACE_WARNINGS!, Size: !TRACE_SIZE! bytes
        ) else (
            set "TRACE_SIZE=0"
            set "TRACE_STATUS=FAILED"
            set /a FAILED_TESTS+=1
            echo [ERROR] Trace-low failed - Exit code: !TRACE_EXIT_CODE!, Warnings: !TRACE_WARNINGS!
        )
        set /a TOTAL_TESTS+=1
        
        :: Add to report
        echo !IMAGE_NAME! ^| trace-edge ^| !TRACE_STATUS! ^| !TRACE_DURATION! ^| !TRACE_WARNINGS! ^| !TRACE_SIZE! ^| >> "%OUTPUT_DIR%\report.md"
        
        :: Warning analysis
        if !LOGO_WARNINGS! GTR 50 (
            echo [WARNING] High warning count for logo algorithm: !LOGO_WARNINGS!
            echo [WARNING] This indicates Moore neighborhood infinite loop issues
        )
    )
)

echo.
echo ================================================================================
echo  TEST RESULTS SUMMARY
echo ================================================================================

echo Total Tests: !TOTAL_TESTS!
echo Successful: !SUCCESSFUL_TESTS!
echo Failed: !FAILED_TESTS!

if !TOTAL_TESTS! GTR 0 (
    set /a SUCCESS_RATE=!SUCCESSFUL_TESTS!*100/!TOTAL_TESTS!
    echo Success Rate: !SUCCESS_RATE!%%
)

:: Add summary to report
echo. >> "%OUTPUT_DIR%\report.md"
echo ## Summary >> "%OUTPUT_DIR%\report.md"
echo. >> "%OUTPUT_DIR%\report.md"
echo - **Total Tests:** !TOTAL_TESTS! >> "%OUTPUT_DIR%\report.md"
echo - **Successful:** !SUCCESSFUL_TESTS! >> "%OUTPUT_DIR%\report.md"
echo - **Failed:** !FAILED_TESTS! >> "%OUTPUT_DIR%\report.md"
if !TOTAL_TESTS! GTR 0 (
    echo - **Success Rate:** !SUCCESS_RATE!%% >> "%OUTPUT_DIR%\report.md"
)

echo.
echo [INFO] Detailed logs available in: %OUTPUT_DIR%
echo [INFO] Test report generated: %OUTPUT_DIR%\report.md

:: Performance Analysis
echo.
echo ================================================================================
echo  PERFORMANCE ANALYSIS
echo ================================================================================

echo [INFO] Checking for high warning counts (legacy Moore neighborhood issues)...
set /a HIGH_WARNING_COUNT=0
for %%F in ("%OUTPUT_DIR%\*-logo.log") do (
    findstr /c:"WARN" "%%F" > "%OUTPUT_DIR%\temp_count.txt"
    for /f %%c in ('find /c /v "" ^< "%OUTPUT_DIR%\temp_count.txt"') do (
        if %%c GTR 50 (
            set /a HIGH_WARNING_COUNT+=1
            echo [WARNING] %%~nF has %%c warnings - Moore neighborhood issues detected
        )
    )
    del "%OUTPUT_DIR%\temp_count.txt" 2>nul
)

if !HIGH_WARNING_COUNT! GTR 0 (
    echo.
    echo [CRITICAL] !HIGH_WARNING_COUNT! logo tests show excessive warnings
    echo [RECOMMENDATION] Legacy issues - Phase A adaptive algorithms should resolve this
    echo [NOTE] Phase A production-ready algorithms with adaptive parameters implemented
) else (
    echo [OK] No excessive warning patterns detected
)

:: Final status
echo.
if !FAILED_TESTS! GTR 0 (
    echo [RESULT] SOME TESTS FAILED - Check logs for details
    exit /b 1
) else (
    echo [RESULT] ALL TESTS COMPLETED SUCCESSFULLY
    exit /b 0
)

:: Time calculation function (simplified)
:calculate_time_diff
set "START=%~1"
set "END=%~2"
:: Simple duration calculation (seconds only for simplicity)
:: Extract seconds from HH:MM:SS.mm format
for /f "tokens=1,2,3 delims=:." %%a in ("%START%") do (
    set /a "START_SEC=%%a*3600+%%b*60+%%c"
)
for /f "tokens=1,2,3 delims=:." %%a in ("%END%") do (
    set /a "END_SEC=%%a*3600+%%b*60+%%c"
)
set /a "DIFF_SEC=END_SEC-START_SEC"
if !DIFF_SEC! LSS 0 set /a "DIFF_SEC+=86400"
set "%~3=!DIFF_SEC!"
goto :eof