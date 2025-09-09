# E2E Testing Documentation

This directory contains comprehensive end-to-end (E2E) tests for the vec2art frontend application using Playwright. The tests validate complete user workflows and ensure the application works correctly across different browsers, devices, and platforms.

## Test Structure

### Test Suites

1. **Core Workflow Tests** (`core-workflow.spec.ts`)
   - Complete image vectorization workflows
   - File upload, processing, and download
   - Algorithm and preset testing
   - Multi-file processing

2. **WASM Integration Tests** (`wasm-integration.spec.ts`)
   - WebAssembly module loading and initialization
   - Multithreading and performance scaling
   - Cross-origin isolation and SharedArrayBuffer
   - Memory management and cleanup

3. **Accessibility Tests** (`accessibility.spec.ts`)
   - Keyboard-only navigation
   - Screen reader announcements
   - WCAG compliance validation
   - Focus management during processing

4. **Error Handling Tests** (`error-handling.spec.ts`)
   - Invalid file upload handling
   - Network error recovery
   - WASM processing errors
   - Browser compatibility issues

5. **Performance Tests** (`performance.spec.ts`)
   - Core Web Vitals monitoring
   - Processing time benchmarks
   - Memory leak detection
   - Resource loading optimization

6. **Cross-Platform Tests** (`cross-platform.spec.ts`)
   - Mobile device workflows
   - Tablet interface optimization
   - Desktop high-performance features
   - Browser-specific testing

### Test Fixtures

- **Test Images**: Various sizes and formats in `fixtures/images/`
  - `small-test.png` - 50KB PNG for fast tests
  - `medium-test.jpg` - 200KB JPEG for standard tests
  - `large-test.png` - 5MB PNG for performance tests
  - `high-detail.png` - Complex edges for algorithm testing
  - `simple-shapes.png` - Basic geometric shapes

- **Invalid Files**: For error testing
  - `invalid.txt` - Text file instead of image
  - `corrupted.png` - Corrupted PNG data
  - `huge-file.png` - Extremely large file

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm ci

# Install Playwright browsers
npm run test:install
```

### Test Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test suites
npm run test:e2e:core         # Core workflow tests
npm run test:e2e:wasm         # WASM integration tests
npm run test:e2e:accessibility # Accessibility tests
npm run test:e2e:performance  # Performance tests
npm run test:e2e:errors       # Error handling tests
npm run test:e2e:cross-platform # Cross-platform tests

# Run on specific browsers
npm run test:e2e:chromium     # Chromium only
npm run test:e2e:firefox      # Firefox only
npm run test:e2e:webkit       # WebKit/Safari only

# Run on mobile devices
npm run test:e2e:mobile       # Mobile Chrome and Safari
npm run test:e2e:tablet       # Tablet interface

# Development and debugging
npm run test:e2e:headed       # Run with browser UI visible
npm run test:e2e:debug        # Debug mode with step-by-step execution
npm run test:e2e:ui           # Interactive UI mode

# CI/CD commands
npm run test:smoke            # Quick smoke tests for PRs
npm run test:ci:fast          # Fast CI tests (unit + smoke)
npm run test:ci:full          # Complete CI test suite
```

### Viewing Results

```bash
# Show HTML report
npm run test:report

# Show trace viewer for failed tests
npm run test:trace

# View test results in real-time
npm run test:e2e:ui
```

## Configuration

### Playwright Configuration (`playwright.config.ts`)

The configuration includes:

- **Multi-browser support**: Chromium, Firefox, WebKit
- **Device emulation**: Mobile, tablet, desktop, high-DPI
- **Extended timeouts**: For WASM operations (90 seconds)
- **Cross-origin isolation**: Headers for SharedArrayBuffer support
- **Performance monitoring**: Screenshots, videos, traces on failure

### Environment Variables

- `CI=true` - Enables CI-specific settings
- `NODE_ENV=production` - Uses production build for testing
- `PWTEST_SCREENSHOT=only-on-failure` - Screenshot capture mode
- `PWTEST_VIDEO=retain-on-failure` - Video recording mode

## Test Utilities

### Page Objects

- **ConverterPage**: Main page object for converter interface
- **PerformanceMonitor**: Utilities for measuring Core Web Vitals
- **Test Helpers**: Common functions for file upload, WASM interaction

### Helper Functions

- `setupConsoleErrorTracking()` - Monitor console errors
- `checkCrossOriginIsolation()` - Verify COEP/COOP headers
- `navigateWithKeyboard()` - Simulate keyboard navigation
- `getMemoryUsage()` - Monitor memory consumption

## CI/CD Integration

### GitHub Actions Workflow

The E2E tests run automatically on:

- **Pull Requests**: Smoke tests for quick feedback
- **Push to main/develop**: Full test suite
- **Nightly schedule**: Complete regression testing
- **Manual dispatch**: Targeted test suite execution

### Test Matrix

- **Operating Systems**: Ubuntu, Windows, macOS
- **Browsers**: Chromium, Firefox, WebKit
- **Device Types**: Desktop, mobile, tablet, low-end devices
- **Test Categories**: Core, WASM, accessibility, performance

### Artifacts

Test results are uploaded as artifacts:

- HTML reports with screenshots and videos
- Performance metrics and trends
- Accessibility audit results
- Test trace files for debugging

## Performance Budgets

### Core Web Vitals Thresholds

- **LCP (Largest Contentful Paint)**: < 2.5 seconds
- **FCP (First Contentful Paint)**: < 1.8 seconds
- **CLS (Cumulative Layout Shift)**: < 0.1

### Processing Time Expectations

- **Small images (50KB)**: < 2 seconds
- **Medium images (200KB)**: < 5 seconds
- **Large images (5MB)**: < 15 seconds

### Memory Usage Limits

- **Memory leak threshold**: < 100MB increase after multiple operations
- **Mobile memory budget**: < 50MB increase on mobile devices

## Accessibility Compliance

### WCAG 2.1 Requirements

- **Keyboard Navigation**: All functionality accessible via keyboard
- **Screen Reader Support**: Proper ARIA labels and announcements
- **Focus Management**: Logical tab order and visible focus indicators
- **Color Contrast**: Sufficient contrast ratios for all text

### Accessibility Testing

- Form controls have proper labels
- Images have meaningful alt attributes
- Heading structure is logical and hierarchical
- Error messages are properly associated with form controls

## Troubleshooting

### Common Issues

1. **WASM Loading Failures**
   - Check cross-origin isolation headers
   - Verify WASM files are properly built
   - Ensure SharedArrayBuffer support

2. **Thread Initialization Timeouts**
   - Check browser thread support
   - Verify memory availability
   - Test with reduced thread count

3. **Mobile Test Failures**
   - Check touch event handling
   - Verify mobile-optimized UI elements
   - Test with appropriate memory constraints

4. **Accessibility Violations**
   - Run axe-core audits
   - Check keyboard navigation paths
   - Verify screen reader announcements

### Debug Commands

```bash
# Run specific test with debug output
npx playwright test tests/e2e/core-workflow.spec.ts --debug

# Run in headed mode to see browser
npx playwright test --headed

# Generate trace for failed test
npx playwright test --trace on

# Run with increased verbosity
npx playwright test --reporter=list
```

## Contributing

### Adding New Tests

1. Create test file in appropriate category directory
2. Use existing page objects and helpers
3. Follow naming convention: `feature-name.spec.ts`
4. Add appropriate test data to fixtures
5. Update CI workflow if needed

### Test Best Practices

- Use descriptive test names
- Keep tests independent and isolated
- Use page objects for UI interactions
- Add proper error handling and cleanup
- Include performance assertions where relevant
- Test both success and failure scenarios

### Performance Testing Guidelines

- Measure actual user impact
- Use realistic test data sizes
- Test across different device capabilities
- Monitor memory usage and cleanup
- Include Core Web Vitals measurements

For more information, see the main project documentation and Playwright's official guides.
