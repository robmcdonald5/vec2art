# Phase A Benchmark Harness

Comprehensive benchmark validation system for Phase A improvements as specified in the vec2art roadmap. This harness validates that the vectorization algorithms meet the quality, performance, and accuracy targets defined for production readiness.

## Roadmap Compliance Targets

The Phase A benchmark validates three core metrics against roadmap specifications:

### 1. Color Accuracy (ΔE*)
- **Target**: Median ΔE* (LAB) ≤ 6.0
- **Method**: CIE76 ΔE calculation in perceptually uniform LAB color space
- **Formula**: `ΔE = √((L₂-L₁)² + (a₂-a₁)² + (b₂-b₁)²)`
- **Measurement**: Per-pixel comparison between original and SVG-rasterized images

### 2. Visual Quality (SSIM)
- **Target**: Structural Similarity ≥ 0.93
- **Method**: Grayscale SSIM calculation
- **Components**: Luminance, contrast, and structure similarity
- **Window**: 11×11 sliding window analysis

### 3. Performance (Runtime)
- **Target**: Processing time ≤ 2.5s for 1024px images
- **Method**: Wall-clock timing across multiple iterations
- **Statistics**: Median, mean, standard deviation, throughput (MP/s)

## Algorithm Presets Tested

The benchmark evaluates multiple algorithm configurations representing Phase A improvements:

### Logo Mode
- **logo_default**: Standard logo vectorization with primitive detection
- **logo_high_precision**: Enhanced accuracy (ε=0.5px, curve_tolerance=0.8)

### Regions Mode (Phase A Focus)
- **regions_photo**: High-fidelity photographic vectorization
  - 24 colors, LAB color space, ΔE merging (2.0), gradients enabled
- **regions_posterized**: Stylized posterization
  - 12 colors, higher ΔE threshold (3.0), no gradients

### Trace-Low Mode
- **trace_low_edge**: Fast edge detection for sparse outlines

## Usage

### Basic Benchmark Run
```bash
cargo run --bin vectorize-cli phase-a-bench
```

### With Custom Parameters
```bash
cargo run --bin vectorize-cli phase-a-bench \
  --examples-dir ./examples \
  --output ./phase_a_results \
  --iterations 10 \
  --delta-e-threshold 5.0 \
  --ssim-threshold 0.95 \
  --timing-threshold 2.0
```

### Disable Debug Images
```bash
cargo run --bin vectorize-cli phase-a-bench \
  --no-debug-images \
  --output ./production_results
```

## Test Images

The benchmark auto-discovers test images from `examples/images_in/`:

| Image | Category | Purpose |
|-------|----------|---------|
| test1.png, test2.png, test3.png | Photos | Photographic fidelity testing |
| test_shapes.png | Icons | Geometric shape accuracy |
| test_gradient.png | Gradients | Smooth color transition handling |
| test_checkerboard.png | Patterns | High-contrast pattern preservation |
| Pirate-Flag.png | Logo | Binary logo vectorization |
| Little-Red-Devil.webp | Illustration | Complex illustration handling |
| Peileppe_Rogue_character.webp | Character | Detailed character art |

## Output Files

### JSON Report (`phase_a_benchmark_report.json`)
Complete benchmark results with full configuration snapshots, timing data, and quality metrics for programmatic analysis.

### CSV Export (`phase_a_benchmark_results.csv`)
Analysis-ready tabular data with columns:
- Image metadata (name, category, dimensions)
- Algorithm configuration (preset, parameters)
- Quality metrics (ΔE median/mean/p95, SSIM components)
- Performance data (timing, throughput)
- Pass/fail status for each target

### Human-Readable Summary (`phase_a_benchmark_summary.txt`)
Executive summary with:
- Overall pass rates by target
- Per-algorithm performance breakdown
- Top failures for improvement focus
- Roadmap compliance assessment

### Debug Images (`debug_images/`)
Visual validation artifacts:
- `{image}_{preset}_original.png`: Source image
- `{image}_{preset}_rendered.png`: SVG-rasterized result
- `{image}_{preset}.svg`: Generated SVG file

## Implementation Architecture

### Core Components

1. **PhaseABenchmarkSuite**: Main orchestrator
   - Auto-discovers test images
   - Manages algorithm presets
   - Coordinates measurement and reporting

2. **ΔE Calculation**: LAB color space accuracy
   - RGB→LAB conversion using D65 illuminant
   - Per-pixel ΔE computation with statistical analysis
   - Median as primary target metric (robust to outliers)

3. **SVG Rasterization**: resvg + tiny-skia pipeline
   - Accurate SVG-to-bitmap conversion
   - Maintains original image dimensions
   - Handles gradients, paths, and complex SVG features

4. **SSIM Computation**: Structural similarity analysis
   - 11×11 sliding window with proper boundary handling
   - Luminance, contrast, structure component breakdown
   - Grayscale conversion for focus on structural fidelity

5. **Statistical Timing**: Robust performance measurement
   - Multiple iterations for statistical stability
   - Median timing (robust to system noise)
   - Throughput calculation in megapixels/second

### Quality Validation Logic

```rust
// Target validation
let meets_delta_e_target = delta_e_metrics.median_delta_e <= 6.0;
let meets_ssim_target = ssim_result.ssim >= 0.93;
let meets_timing_target = timing_metrics.median_time <= 2.5;
let overall_pass = meets_delta_e_target && meets_ssim_target && meets_timing_target;
```

## Integration with Existing Systems

### Telemetry Integration
The benchmark integrates with the existing telemetry system to:
- Capture configuration snapshots for reproducibility
- Log timing and quality metrics
- Enable historical trend analysis

### SVG Analysis
Leverages existing `svg_analysis.rs` module for:
- Path complexity metrics
- Node count analysis
- File size optimization tracking

### SSIM Module
Extends existing `ssim.rs` with:
- Enhanced grayscale conversion
- Debug image generation
- Comprehensive statistical reporting

## Interpreting Results

### Target Compliance
- **80%+ pass rate**: Excellent - exceeds roadmap targets
- **60-80% pass rate**: Good - meets roadmap expectations
- **<60% pass rate**: Needs improvement - investigate failures

### Performance Analysis
- **Throughput**: >0.4 MP/s indicates efficient processing
- **Timing Variance**: Low std dev suggests stable performance
- **Memory Usage**: Monitor through system telemetry

### Quality Insights
- **High ΔE**: Check color quantization and LAB conversion
- **Low SSIM**: Review structural preservation in edge detection
- **Timing Issues**: Profile algorithm bottlenecks

## Future Enhancements

### Baseline Comparison
- Load historical benchmark results for regression testing
- Automated performance trend analysis
- Quality improvement tracking over time

### Extended Metrics
- CIE2000 ΔE for improved perceptual accuracy
- Multi-scale SSIM for different detail levels
- Perceptual hash comparisons for structural similarity

### Automated CI Integration
- Automated benchmark runs on algorithm changes
- Performance regression detection
- Quality threshold enforcement in CI pipeline

## Troubleshooting

### Common Issues

**No test images found**
- Ensure `examples/images_in/` directory exists
- Verify image file formats (PNG, JPG, WebP)
- Check file permissions

**SVG rasterization errors**
- Update resvg/tiny-skia dependencies
- Validate SVG syntax with external tools
- Check for complex SVG features not supported

**Memory issues with large images**
- Use `--no-debug-images` to reduce memory usage
- Process images sequentially rather than in parallel
- Implement image downsampling for memory-constrained environments

**Inconsistent timing results**
- Increase `--iterations` for more stable measurements
- Run on isolated system without background processes
- Use CPU affinity for consistent core assignment

This benchmark harness provides comprehensive validation that Phase A improvements meet the roadmap's ambitious quality and performance targets, ensuring production-ready vectorization capabilities.