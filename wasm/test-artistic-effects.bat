@echo off
REM =============================================================================
REM Artistic Effects Comparison Test Suite
REM Tests to definitively determine if hand-drawn effects are being applied
REM =============================================================================

echo ===========================================================================
echo ARTISTIC EFFECTS TEST SUITE - Testing None vs Sketchy Presets
echo ===========================================================================
echo.

REM Create output directories
echo Creating output directories...
mkdir examples\outputs\debug_artistic_effects 2>nul
mkdir examples\outputs\debug_artistic_effects\none 2>nul
mkdir examples\outputs\debug_artistic_effects\subtle 2>nul
mkdir examples\outputs\debug_artistic_effects\medium 2>nul
mkdir examples\outputs\debug_artistic_effects\strong 2>nul
mkdir examples\outputs\debug_artistic_effects\sketchy 2>nul
mkdir examples\outputs\debug_artistic_effects\analysis 2>nul

echo.
echo ===========================================================================
echo TEST 1: Simple Checkerboard Pattern (Most visible effects)
echo ===========================================================================

REM Test with checkerboard - simple geometry should show effects most clearly
echo Testing checkerboard with NONE preset...
cd vectorize-cli
cargo run --release --bin vectorize-cli -- trace-low ^
  --hand-drawn none ^
  --detail 0.3 ^
  --stroke-width 2.0 ^
  --stats ..\examples\outputs\debug_artistic_effects\analysis\checkerboard_none_stats.csv ^
  ..\examples\images_in\test_checkerboard.png ^
  ..\examples\outputs\debug_artistic_effects\none\checkerboard.svg

echo Testing checkerboard with SUBTLE preset...
cargo run --release --bin vectorize-cli -- trace-low ^
  --hand-drawn subtle ^
  --detail 0.3 ^
  --stroke-width 2.0 ^
  --stats ..\examples\outputs\debug_artistic_effects\analysis\checkerboard_subtle_stats.csv ^
  ..\examples\images_in\test_checkerboard.png ^
  ..\examples\outputs\debug_artistic_effects\subtle\checkerboard.svg

echo Testing checkerboard with MEDIUM preset...
cargo run --release --bin vectorize-cli -- trace-low ^
  --hand-drawn medium ^
  --detail 0.3 ^
  --stroke-width 2.0 ^
  --stats ..\examples\outputs\debug_artistic_effects\analysis\checkerboard_medium_stats.csv ^
  ..\examples\images_in\test_checkerboard.png ^
  ..\examples\outputs\debug_artistic_effects\medium\checkerboard.svg

echo Testing checkerboard with STRONG preset...
cargo run --release --bin vectorize-cli -- trace-low ^
  --hand-drawn strong ^
  --detail 0.3 ^
  --stroke-width 2.0 ^
  --stats ..\examples\outputs\debug_artistic_effects\analysis\checkerboard_strong_stats.csv ^
  ..\examples\images_in\test_checkerboard.png ^
  ..\examples\outputs\debug_artistic_effects\strong\checkerboard.svg

echo Testing checkerboard with SKETCHY preset...
cargo run --release --bin vectorize-cli -- trace-low ^
  --hand-drawn sketchy ^
  --detail 0.3 ^
  --stroke-width 2.0 ^
  --stats ..\examples\outputs\debug_artistic_effects\analysis\checkerboard_sketchy_stats.csv ^
  ..\examples\images_in\test_checkerboard.png ^
  ..\examples\outputs\debug_artistic_effects\sketchy\checkerboard.svg
cd ..

echo.
echo ===========================================================================
echo TEST 2: Complex Image (anime-girl.png)
echo ===========================================================================

cd vectorize-cli
echo Testing anime-girl with NONE preset...
cargo run --release --bin vectorize-cli -- trace-low ^
  --hand-drawn none ^
  --detail 0.5 ^
  --stroke-width 1.5 ^
  --stats ..\examples\outputs\debug_artistic_effects\analysis\anime_none_stats.csv ^
  ..\examples\images_in\anime-girl.png ^
  ..\examples\outputs\debug_artistic_effects\none\anime-girl.svg

echo Testing anime-girl with SKETCHY preset...
cargo run --release --bin vectorize-cli -- trace-low ^
  --hand-drawn sketchy ^
  --detail 0.5 ^
  --stroke-width 1.5 ^
  --stats ..\examples\outputs\debug_artistic_effects\analysis\anime_sketchy_stats.csv ^
  ..\examples\images_in\anime-girl.png ^
  ..\examples\outputs\debug_artistic_effects\sketchy\anime-girl.svg
cd ..

echo.
echo ===========================================================================
echo TEST 3: Custom Tremor and Variable Weights (Override test)
echo ===========================================================================

cd vectorize-cli
echo Testing with custom tremor=0.0 (should be identical to none)...
cargo run --release --bin vectorize-cli -- trace-low ^
  --tremor 0.0 ^
  --variable-weights 0.0 ^
  --detail 0.3 ^
  --stroke-width 2.0 ^
  ..\examples\images_in\test_checkerboard.png ^
  ..\examples\outputs\debug_artistic_effects\analysis\custom_zero.svg

echo Testing with maximum custom tremor=0.5...
cargo run --release --bin vectorize-cli -- trace-low ^
  --tremor 0.5 ^
  --variable-weights 1.0 ^
  --detail 0.3 ^
  --stroke-width 2.0 ^
  ..\examples\images_in\test_checkerboard.png ^
  ..\examples\outputs\debug_artistic_effects\analysis\custom_max.svg
cd ..

echo.
echo ===========================================================================
echo TEST 4: Different Detail Levels (to see if effects scale)
echo ===========================================================================

cd vectorize-cli
echo Testing LOW detail (0.1) with NONE...
cargo run --release --bin vectorize-cli -- trace-low ^
  --hand-drawn none ^
  --detail 0.1 ^
  --stroke-width 3.0 ^
  ..\examples\images_in\Little-Red-Devil.webp ^
  ..\examples\outputs\debug_artistic_effects\analysis\devil_low_none.svg

echo Testing LOW detail (0.1) with SKETCHY...
cargo run --release --bin vectorize-cli -- trace-low ^
  --hand-drawn sketchy ^
  --detail 0.1 ^
  --stroke-width 3.0 ^
  ..\examples\images_in\Little-Red-Devil.webp ^
  ..\examples\outputs\debug_artistic_effects\analysis\devil_low_sketchy.svg

echo Testing HIGH detail (0.9) with NONE...
cargo run --release --bin vectorize-cli -- trace-low ^
  --hand-drawn none ^
  --detail 0.9 ^
  --stroke-width 1.0 ^
  ..\examples\images_in\Little-Red-Devil.webp ^
  ..\examples\outputs\debug_artistic_effects\analysis\devil_high_none.svg

echo Testing HIGH detail (0.9) with SKETCHY...
cargo run --release --bin vectorize-cli -- trace-low ^
  --hand-drawn sketchy ^
  --detail 0.9 ^
  --stroke-width 1.0 ^
  ..\examples\images_in\Little-Red-Devil.webp ^
  ..\examples\outputs\debug_artistic_effects\analysis\devil_high_sketchy.svg
cd ..

echo.
echo ===========================================================================
echo ANALYSIS PHASE - Extracting Metrics
echo ===========================================================================

echo Generating file size comparison...
powershell -Command "Get-ChildItem -Path 'examples\outputs\debug_artistic_effects\*\*.svg' -Recurse | Select-Object Name, Length, Directory | Format-Table -AutoSize" > examples\outputs\debug_artistic_effects\analysis\file_sizes.txt

echo.
echo ===========================================================================
echo Tests Complete! Check outputs in:
echo   examples\outputs\debug_artistic_effects\
echo.
echo Visual comparison files:
echo   - none\checkerboard.svg vs sketchy\checkerboard.svg
echo   - none\anime-girl.svg vs sketchy\anime-girl.svg
echo.
echo Analysis files in:
echo   examples\outputs\debug_artistic_effects\analysis\
echo ===========================================================================