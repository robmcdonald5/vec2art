# Algorithm Validation Test Suite

This directory contains comprehensive testing infrastructure for validating all vectorization algorithms and their parameter combinations.

## Purpose

1. **Systematic Testing**: Test all backend algorithms with their full parameter sets
2. **WASM Function Validation**: Verify all WASM function calls are valid
3. **Parameter Range Testing**: Validate parameter constraints and interdependencies
4. **Regression Testing**: Ensure algorithm changes don't break existing functionality
5. **Performance Baseline**: Track processing times and output quality

## Test Structure

```
tests/algorithm-validation/
├── README.md                    # This file
├── run-validation.js           # Main test runner
├── algorithm-matrix.md         # Complete algorithm documentation
├── wasm-introspection.js       # WASM function discovery
├── test-configs/               # Test configuration files
│   ├── edge-backend.json
│   ├── centerline-backend.json
│   ├── superpixel-backend.json
│   └── dots-backend.json
├── test-images/                # Test input images
│   ├── simple-line.png         # Basic line art test
│   ├── complex-photo.jpg       # Complex photo test
│   ├── logo-test.png          # Logo/text test
│   └── geometric-shapes.png    # Geometric shapes test
├── outputs/                    # Test output directory
│   ├── results/               # Generated SVG outputs
│   ├── reports/               # Test result reports
│   └── baselines/             # Expected output baselines
└── lib/                       # Test utility functions
    ├── config-generator.js    # Generate test configurations
    ├── result-validator.js    # Validate test outputs
    └── report-generator.js    # Generate test reports
```

## Usage

```bash
# Run full algorithm validation suite
npm run test:algorithms

# Run specific backend tests
npm run test:algorithms -- --backend=edge

# Run with verbose output
npm run test:algorithms -- --verbose

# Generate algorithm documentation
npm run test:algorithms -- --docs-only

# Test specific parameter combinations
npm run test:algorithms -- --config=test-configs/edge-backend.json
```

## Test Categories

1. **Function Existence Tests**: Verify all WASM functions exist
2. **Parameter Validation Tests**: Test parameter ranges and constraints
3. **Backend Compatibility Tests**: Ensure parameters work with correct backends
4. **Integration Tests**: Test complete processing workflows
5. **Performance Tests**: Measure processing times and memory usage
6. **Quality Tests**: Validate SVG output structure and content

## Output Reports

- **HTML Report**: Visual comparison of outputs with baselines
- **JSON Report**: Machine-readable test results
- **Console Summary**: Quick pass/fail overview
- **Error Log**: Detailed error analysis for failures