# vec2art Algorithm Testbed (Batch Script)

Simple, reliable Windows batch script for automated algorithm testing.

## Quick Start

```cmd
cd C:\Users\McDon\Repos\vec2art\wasm
test-algorithms.bat
```

## Features

- ✅ **Universal Compatibility**: Pure Windows batch script, no PowerShell issues
- ✅ **Automated Testing**: Tests both logo and regions algorithms on all images
- ✅ **Performance Measurement**: Basic timing and warning count analysis
- ✅ **Clear Output**: Color-coded console output with status indicators
- ✅ **Report Generation**: Creates markdown report with results table
- ✅ **Issue Detection**: Identifies high warning counts (Moore neighborhood problems)

## What It Tests

Automatically processes all images in `examples/images_in/`:
- `test1.png` - Complex image (will show Moore neighborhood issues)
- `test2.png` - Intermediate complexity
- `test3.png` - Color photograph
- `test_checkerboard.png` - Geometric pattern
- `test_gradient.png` - Gradient transitions
- `test_shapes.png` - Simple shapes

## Output Files

Creates `test-results/` directory with:
- `{image}-logo.svg` - Logo algorithm outputs
- `{image}-regions.svg` - Regions algorithm outputs
- `{image}-logo.log` - Detailed logs for logo tests
- `{image}-regions.log` - Detailed logs for regions tests
- `report.md` - Summary report with results table

## Expected Results

**Before Suzuki-Abe Implementation:**
- Logo algorithm: High warning counts on complex images
- Regions algorithm: Fast, reliable performance
- Overall: Demonstrates need for Phase 1.5 improvements

**Console Output Example:**
```
================================================================================
 VEC2ART ALGORITHM TESTBED
================================================================================

[OK] Working directory confirmed
[OK] Image directory found: examples\images_in
[OK] Project built successfully

================================================================================
 TESTING ALGORITHMS
================================================================================

[INFO] Testing image: test_shapes
[TEST] Logo algorithm...
[OK] Logo completed - Time: 1s, Warnings: 0, Size: 2048 bytes
[TEST] Regions algorithm...
[OK] Regions completed - Time: 1s, Warnings: 0, Size: 3072 bytes

[INFO] Testing image: test1
[TEST] Logo algorithm...
[OK] Logo completed - Time: 5s, Warnings: 342, Size: 1024 bytes
[WARNING] High warning count for logo algorithm: 342
[WARNING] This indicates Moore neighborhood infinite loop issues
```

## Report Format

The script generates a markdown table in `test-results/report.md`:

| Image | Algorithm | Status | Time (s) | Warnings | Output Size |
|-------|-----------|--------|----------|----------|-------------|
| test_shapes | logo | SUCCESS | 1 | 0 | 2048 |
| test_shapes | regions | SUCCESS | 1 | 0 | 3072 |
| test1 | logo | SUCCESS | 5 | 342 | 1024 |
| test1 | regions | SUCCESS | 1 | 0 | 4096 |

## Issue Detection

The script automatically identifies problems:
- **High Warning Count**: > 50 warnings indicates algorithm issues
- **Failed Tests**: Missing output files or non-zero exit codes
- **Moore Neighborhood Issues**: Excessive warnings in logo algorithm

## Troubleshooting

**Build Issues:**
```cmd
cargo clean
cargo build --release --bin vectorize-cli
```

**Missing Images:**
Ensure you're in the `wasm/` directory and `examples/images_in/` exists.

**Permission Issues:**
Unlike PowerShell, batch scripts don't have execution policy restrictions.

## Integration

Use this testbed to:
1. **Establish Baseline**: Document current performance before Phase 1.5
2. **Validate Improvements**: Test Suzuki-Abe implementation results
3. **Regression Testing**: Ensure changes don't break working functionality
4. **Performance Tracking**: Monitor algorithm improvements over time

This simple, reliable testbed provides essential validation for the Phase 1.5 Suzuki-Abe implementation without complexity or compatibility issues.