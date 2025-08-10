@echo off

echo.
echo ================================================================================
echo  VEC2ART LINE TRACING COMPARISON TEST
echo ================================================================================
echo Testing single-pass vs multi-pass line tracing
echo Focus: Show improvement in test1 recognizability
echo.

:: Build first
echo Building project...
cargo build --release --bin vectorize-cli
if errorlevel 1 (
    echo Build failed!
    pause
    exit /b 1
)

:: Create output directory
if not exist "examples\images_out" mkdir "examples\images_out"

echo.
echo ================================================================================
echo  TESTING test1.png - The Problem Image (QUALITY FOCUS)
echo ================================================================================

echo Testing single-pass on test1...
cargo run --release --bin vectorize-cli -- trace-low "examples\images_in\test1.png" "examples\images_out\test1-single.svg" --backend edge --detail 0.3

echo Testing multi-pass on test1...
cargo run --release --bin vectorize-cli -- trace-low "examples\images_in\test1.png" "examples\images_out\test1-multi.svg" --backend edge --detail 0.3 --multipass

echo Testing DIRECTIONAL multi-pass on test1 (MAXIMUM QUALITY)...
cargo run --release --bin vectorize-cli -- trace-low "examples\images_in\test1.png" "examples\images_out\test1-directional.svg" --backend edge --detail 0.3 --multipass --enable-reverse --enable-diagonal --directional-threshold 0.2

echo Testing DIRECTIONAL + HAND-DRAWN on test1 (ARTISTIC QUALITY)...
cargo run --release --bin vectorize-cli -- trace-low "examples\images_in\test1.png" "examples\images_out\test1-artistic.svg" --backend edge --detail 0.3 --multipass --enable-reverse --enable-diagonal --directional-threshold 0.2 --hand-drawn medium

echo.
echo ================================================================================
echo  TESTING test2.png - Portrait Test
echo ================================================================================

echo Testing single-pass on test2...
cargo run --release --bin vectorize-cli -- trace-low "examples\images_in\test2.png" "examples\images_out\test2-single.svg" --backend edge --detail 0.3

echo Testing multi-pass on test2...
cargo run --release --bin vectorize-cli -- trace-low "examples\images_in\test2.png" "examples\images_out\test2-multi.svg" --backend edge --detail 0.3 --multipass

echo Testing DIRECTIONAL multi-pass on test2...
cargo run --release --bin vectorize-cli -- trace-low "examples\images_in\test2.png" "examples\images_out\test2-directional.svg" --backend edge --detail 0.3 --multipass --enable-reverse --enable-diagonal --directional-threshold 0.2

echo Testing SKETCHY hand-drawn on test2 (ARTISTIC PORTRAIT)...
cargo run --release --bin vectorize-cli -- trace-low "examples\images_in\test2.png" "examples\images_out\test2-sketchy.svg" --backend edge --detail 0.3 --multipass --enable-reverse --enable-diagonal --directional-threshold 0.2 --hand-drawn sketchy

echo.
echo ================================================================================
echo  TESTING test3.png - Geometric/Architecture Test  
echo ================================================================================

echo Testing single-pass on test3...
cargo run --release --bin vectorize-cli -- trace-low "examples\images_in\test3.png" "examples\images_out\test3-single.svg" --backend edge --detail 0.3

echo Testing multi-pass on test3...
cargo run --release --bin vectorize-cli -- trace-low "examples\images_in\test3.png" "examples\images_out\test3-multi.svg" --backend edge --detail 0.3 --multipass

echo Testing DIRECTIONAL multi-pass on test3...
cargo run --release --bin vectorize-cli -- trace-low "examples\images_in\test3.png" "examples\images_out\test3-directional.svg" --backend edge --detail 0.3 --multipass --enable-reverse --enable-diagonal --directional-threshold 0.2

echo.
echo ================================================================================
echo  RESULTS ANALYSIS
echo ================================================================================

echo Generated files in examples\images_out\:
dir "examples\images_out\test1-*.svg" "examples\images_out\test2-*.svg" "examples\images_out\test3-*.svg" /b 2>nul

echo.
echo QUALITY PROGRESSION TEST:
echo.
echo TEST1 (Problem Image - Low Recognizability):
echo   test1-single.svg      : Basic edge detection
echo   test1-multi.svg       : Conservative + Aggressive passes  
echo   test1-directional.svg : + Reverse + Diagonal passes (SHOULD SOLVE RECOGNIZABILITY!)
echo   test1-artistic.svg    : + Hand-drawn medium aesthetics (organic feel)
echo.
echo TEST2 (Portrait):
echo   test2-single.svg      : Basic tracing
echo   test2-multi.svg       : Enhanced dual-pass
echo   test2-directional.svg : Maximum quality with all directional passes
echo   test2-sketchy.svg     : + Sketchy hand-drawn aesthetics (artistic portrait)
echo.
echo TEST3 (Geometric/Architecture):
echo   test3-single.svg      : Standard processing
echo   test3-multi.svg       : Dual-pass enhancement
echo   test3-directional.svg : Full directional multi-pass for precision
echo.
echo KEY EXPECTATION: test1-directional.svg should show DRAMATIC improvement over previous versions!
echo Open the SVG files to compare the quality progression!
pause