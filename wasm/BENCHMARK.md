# Comprehensive Benchmark Suite

This document describes the comprehensive benchmark suite for the vec2art vectorization algorithms, designed to validate the research targets:

- **SSIM Target**: ≥ 0.92 for visual quality
- **Node Count Target**: ≤ 40% growth vs baseline
- **Performance**: Similar or better runtime performance

## Features

The benchmark suite provides:

1. **SSIM (Structural Similarity Index) Calculation**: Measures visual quality between original and SVG-rendered result
2. **SVG Analysis**: Counts nodes, paths, colors, file size, and other complexity metrics
3. **Performance Timing**: Multiple-iteration timing measurements with statistical analysis
4. **Configuration Testing**: Automated testing of different algorithm parameters
5. **Baseline Comparison**: Compare current results against previous benchmark runs
6. **Debug Images**: Save original and rendered images for visual inspection

## Usage

### Basic Comprehensive Benchmark

Run the full benchmark suite on test images:

```bash
# Test with a single image
cargo run --bin vectorize-cli comprehensive-bench -i test_image.png

# Test with multiple images
cargo run --bin vectorize-cli comprehensive-bench -i image1.png image2.png image3.png

# Test with all images in a directory
cargo run --bin vectorize-cli comprehensive-bench -i test_images/

# Specify output directory and number of iterations
cargo run --bin vectorize-cli comprehensive-bench -i test_images/ -o results/ --iterations 20
```

### Advanced Options

```bash
# Disable debug image generation (faster)
cargo run --bin vectorize-cli comprehensive-bench -i test_images/ --no-debug-images

# Compare against baseline results
cargo run --bin vectorize-cli comprehensive-bench -i test_images/ --baseline previous_results/benchmark_report.json
```

## Output

The benchmark suite generates several output files:

1. **`benchmark_report.json`**: Complete results in JSON format for programmatic use
2. **`benchmark_summary.txt`**: Human-readable summary of results
3. **`debug_images/`**: Original and rendered images for visual comparison (if enabled)

### Console Output

The benchmark displays real-time progress and a comprehensive summary:

```
=== COMPREHENSIVE BENCHMARK RESULTS ===
Total Tests: 40
Tests Passed: 32 (80.0% pass rate)
Average SSIM: 0.887 (target ≥ 0.92)
Average Node Growth: 23.4% (target ≤ 40%)
Average Processing Time: 1.234s

=== RESEARCH TARGETS ===
SSIM Target (≥ 0.92): 67.5% pass rate
Node Count Target (≤ 40% growth): 95.0% pass rate

=== TOP PERFORMING CONFIGURATIONS ===
1. test1 | regions | high_precision | SSIM: 0.952 | Time: 0.89s
2. test2 | logo | default | SSIM: 0.946 | Time: 0.12s
3. test3 | regions | lab_colorspace | SSIM: 0.941 | Time: 1.45s
4. test1 | logo | precision | SSIM: 0.938 | Time: 0.15s
5. test4 | regions | default | SSIM: 0.934 | Time: 0.67s
```

## Algorithm Configurations Tested

### Logo Algorithm Variants
- **default**: Standard configuration
- **high_quality**: Lower tolerances, curve fitting enabled
- **fast**: Higher tolerances, curve fitting disabled  
- **precision**: Very low tolerances for maximum accuracy

### Regions Algorithm Variants
- **default**: Standard configuration
- **few_colors**: 8 colors for simple posterization
- **many_colors**: 32 colors with reduced iterations
- **lab_colorspace**: Uses LAB color space instead of RGB
- **high_precision**: Lower tolerances, curve fitting enabled

## Metrics Explained

### SSIM (Structural Similarity Index)
- Range: 0.0 to 1.0 (higher is better)
- Target: ≥ 0.92
- Measures perceptual similarity between original and SVG-rendered result
- Considers luminance, contrast, and structure components

### Node Count Growth
- Percentage increase in SVG elements vs baseline
- Target: ≤ 40% growth
- Measures complexity/file size impact of algorithm changes

### Performance Timing
- Multiple iterations with statistical analysis (mean, min, max, std dev)
- Throughput measured in megapixels per second
- Helps identify performance regressions

## Integration with Development Workflow

### Pre-commit Validation
Run benchmarks before major algorithm changes:

```bash
# Quick validation on key test images
cargo run --bin vectorize-cli comprehensive-bench -i key_test_images/ --iterations 5

# Full validation before release
cargo run --bin vectorize-cli comprehensive-bench -i full_test_suite/ --iterations 20
```

### Baseline Management
Create a baseline after validating improvements:

```bash
# After confirming good results
cp results/benchmark_report.json baselines/v1.2.0_baseline.json

# Compare future changes against this baseline
cargo run --bin vectorize-cli comprehensive-bench -i test_images/ --baseline baselines/v1.2.0_baseline.json
```

### CI/CD Integration
The benchmark suite is designed for automated testing:

1. JSON output format for programmatic parsing
2. Exit codes indicate pass/fail status
3. Configurable pass/fail thresholds
4. Fast execution with minimal iterations for CI

## Interpreting Results

### Research Target Compliance
- **SSIM ≥ 0.92**: Visual quality meets perceptual similarity requirements
- **Node Count ≤ 40% growth**: Complexity remains manageable for web use
- **Both targets met**: Configuration is ready for production

### Performance Analysis
- **Throughput trends**: Compare megapixels/second across configurations
- **Timing consistency**: Low standard deviation indicates stable performance
- **Memory efficiency**: Larger images should scale reasonably

### Configuration Selection
Use the benchmark results to select optimal configurations:
- **High SSIM**: Prioritize visual quality
- **Low node count**: Prioritize file size/complexity
- **Fast processing**: Prioritize performance
- **Balanced**: Consider all factors with weighting

## Troubleshooting

### Common Issues

**Low SSIM scores**: 
- Check debug images for visual artifacts
- Consider algorithm-specific tuning parameters
- Verify image preprocessing quality

**High node count growth**:
- Review path simplification settings
- Check color quantization effectiveness
- Consider curve fitting optimizations

**Slow performance**:
- Profile specific algorithm bottlenecks
- Check memory allocation patterns
- Consider parallel processing opportunities

### Debug Mode
Enable debug image output to visually inspect results:
- Original image
- SVG-rendered result  
- Grayscale versions used for SSIM calculation
- Side-by-side comparison

This helps identify specific quality issues and guides algorithm improvements.