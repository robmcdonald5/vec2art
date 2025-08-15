# Testing Guide - vec2art Frontend

This document provides comprehensive guidance on using all available testing tools, testbeds, and development utilities in the vec2art frontend application.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Unit Testing (Vitest)](#unit-testing-vitest)
- [E2E Testing (Playwright)](#e2e-testing-playwright)
- [Component Documentation (Storybook)](#component-documentation-storybook)
- [Accessibility Testing](#accessibility-testing)
- [Performance Testing](#performance-testing)
- [WASM Testing](#wasm-testing)
- [Static Analysis](#static-analysis)
- [CI/CD Testing](#cicd-testing)
- [Test Utilities](#test-utilities)
- [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
# Run all unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run accessibility tests
npm run test:accessibility

# Generate coverage report
npm run test:coverage
```

## 🧪 Unit Testing (Vitest)

### Overview
We use Vitest for fast unit and component testing with comprehensive coverage reporting.

### Available Commands

#### Basic Testing
```bash
# Run all unit tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for specific file
npm test -- smart-performance-selector

# Run tests matching pattern
npm test -- --grep "CPU detection"
```

#### Coverage Reports
```bash
# Generate HTML coverage report
npm run test:coverage

# View coverage in browser
open coverage/index.html
```

### Test Files Location
```
src/
├── lib/
│   ├── components/ui/*.test.ts        # Component tests
│   ├── utils/*.test.ts                # Utility function tests
│   ├── stores/*.test.ts               # Store tests
│   └── wasm/*.test.ts                 # WASM integration tests
└── routes/*/*.test.ts                 # Page component tests
```

### Writing Tests

#### Component Test Example
```typescript
import { render, screen } from '@testing-library/svelte';
import { expect, test } from 'vitest';
import MyComponent from './MyComponent.svelte';

test('should render correctly', () => {
  render(MyComponent, { props: { title: 'Test' } });
  expect(screen.getByText('Test')).toBeInTheDocument();
});
```

#### Store Test Example
```typescript
import { describe, it, expect } from 'vitest';
import { myStore } from './myStore.svelte.js';

describe('myStore', () => {
  it('should update state correctly', () => {
    myStore.setValue('test');
    expect(myStore.value).toBe('test');
  });
});
```

### Coverage Thresholds
- **Global**: 80% statements, branches, functions, lines
- **Utils**: 95% (critical utility functions)
- **Components**: 90% (UI components)

## 🎭 E2E Testing (Playwright)

### Overview
Playwright provides comprehensive end-to-end testing across multiple browsers and devices.

### Available Commands

#### Basic E2E Testing
```bash
# Run all E2E tests
npm run test:e2e

# Run tests in specific browser
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox
npm run test:e2e -- --project=webkit

# Run tests in headed mode (visible browser)
npm run test:e2e -- --headed

# Run specific test file
npm run test:e2e -- core-workflow.spec.ts

# Debug mode (interactive)
npm run test:e2e -- --debug
```

#### Test Suites
```bash
# Core functionality tests
npm run test:e2e:core

# WASM integration tests
npm run test:e2e:wasm

# Accessibility tests
npm run test:e2e:accessibility

# Performance tests
npm run test:e2e:performance

# Cross-platform tests
npm run test:e2e:cross-platform

# Error handling tests
npm run test:e2e:errors

# Smoke tests (quick validation)
npm run test:smoke
```

#### Device Testing
```bash
# Mobile testing
npm run test:e2e -- --project=mobile-chrome
npm run test:e2e -- --project=mobile-safari

# Tablet testing
npm run test:e2e -- --project=tablet-chrome

# Low-end device simulation
npm run test:e2e -- --project=low-end-device

# High-DPI testing
npm run test:e2e -- --project=high-dpi
```

### Test Files
```
tests/
├── e2e/
│   ├── core-workflow.spec.ts         # Main user workflows
│   ├── wasm-integration.spec.ts      # WASM functionality
│   ├── accessibility.spec.ts         # A11y compliance
│   ├── performance.spec.ts           # Performance benchmarks
│   ├── cross-platform.spec.ts       # Device compatibility
│   └── error-handling.spec.ts       # Error scenarios
├── utils/
│   ├── test-helpers.ts               # Shared test utilities
│   └── page-objects.ts               # Page object models
└── accessibility.spec.ts             # Accessibility smoke tests
```

### Writing E2E Tests

#### Basic Test Structure
```typescript
import { test, expect } from '@playwright/test';

test('user can upload and convert image', async ({ page }) => {
  await page.goto('/converter');
  
  // Upload file
  await page.setInputFiles('input[type="file"]', 'test-image.png');
  
  // Wait for processing
  await page.waitForSelector('.processing-complete');
  
  // Verify result
  await expect(page.locator('.svg-preview')).toBeVisible();
});
```

#### Using Page Objects
```typescript
import { ConverterPage } from '../utils/page-objects';

test('converter workflow', async ({ page }) => {
  const converterPage = new ConverterPage(page);
  
  await converterPage.goto();
  await converterPage.uploadImage('test.png');
  await converterPage.selectAlgorithm('edge');
  await converterPage.startConversion();
  
  await expect(converterPage.resultPreview).toBeVisible();
});
```

### Browser Configuration

#### Supported Browsers
- **Chromium**: Latest Chrome/Edge features, WASM multithreading
- **Firefox**: Cross-browser compatibility testing
- **WebKit**: Safari compatibility (desktop)
- **Mobile Chrome**: Android device simulation
- **Mobile Safari**: iOS device simulation

#### WASM-Specific Settings
```typescript
// Chromium with WASM threading support
use: {
  launchOptions: {
    args: [
      '--enable-features=SharedArrayBuffer',
      '--enable-unsafe-webassembly',
      '--js-flags=--experimental-wasm-threads'
    ]
  }
}
```

## 📚 Component Documentation (Storybook)

### Overview
Storybook provides interactive component documentation and visual testing.

### Available Commands

#### Development
```bash
# Start Storybook development server
npm run storybook

# Build static Storybook
npm run storybook:build

# Preview built Storybook
npm run storybook:preview
```

#### Testing
```bash
# Run Storybook tests (via Vitest)
npm run test:storybook

# Visual regression testing
npm run storybook:test
```

### Story Files Location
```
src/
└── stories/
    ├── design-system/
    │   ├── colors.stories.ts
    │   ├── typography.stories.ts
    │   └── spacing.stories.ts
    ├── form-components/
    │   ├── file-dropzone.stories.ts
    │   └── smart-performance-selector.stories.ts
    └── ui-components/
        ├── button.stories.ts
        ├── modal.stories.ts
        └── progress-bar.stories.ts
```

### Writing Stories

#### Basic Story Example
```typescript
import type { Meta, StoryObj } from '@storybook/svelte';
import Button from '../lib/components/ui/button.svelte';

const meta: Meta<Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'default',
    children: 'Click me'
  }
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary button'
  }
};
```

#### Interactive Stories with Controls
```typescript
export const Interactive: Story = {
  args: {
    variant: 'default',
    size: 'default',
    disabled: false,
    children: 'Interactive button'
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive']
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg']
    }
  }
};
```

### Storybook Features

#### Accessibility Testing
- Built-in a11y addon for WCAG compliance
- Color contrast checking
- Keyboard navigation testing

#### Theme Testing
- Light/dark theme switcher
- Responsive design testing
- Multi-device preview

#### Documentation
- Auto-generated prop tables
- Interactive controls
- Code examples
- Design tokens

## ♿ Accessibility Testing

### Overview
Comprehensive accessibility testing using axe-core and manual testing procedures.

### Automated A11y Testing

#### Axe-Core Integration
```bash
# Run accessibility tests
npm run test:accessibility

# Run with specific rules
npm run test:accessibility -- --grep "color-contrast"
```

#### Storybook A11y Addon
```bash
# Start Storybook with a11y panel
npm run storybook
# Navigate to a11y tab in addon panel
```

### Manual Testing Procedures

#### Keyboard Navigation
```bash
# Test keyboard-only navigation
npm run test:e2e -- accessibility.spec.ts --grep "keyboard"
```

#### Screen Reader Testing
1. Enable screen reader (NVDA, JAWS, VoiceOver)
2. Navigate through application
3. Verify content is properly announced
4. Test form interactions

#### Focus Management
- Verify visible focus indicators
- Test focus trap in modals
- Ensure logical tab order

### Accessibility Guidelines

#### WCAG 2.1 AA Compliance
- **Level A**: Basic accessibility
- **Level AA**: Standard accessibility (target)
- **Level AAA**: Enhanced accessibility

#### Key Requirements
- Color contrast ratio ≥ 4.5:1
- Keyboard accessible
- Screen reader compatible
- Focus management
- Semantic HTML structure

## ⚡ Performance Testing

### Overview
Performance testing includes Web Vitals monitoring, WASM benchmarks, and load testing.

### Performance Commands

#### Web Vitals Testing
```bash
# Run performance tests
npm run test:e2e:performance

# Lighthouse CI
npm run lighthouse
```

#### WASM Performance Testing
```bash
# WASM benchmark tests
npm run test:wasm:performance

# Threading performance
npm run test:wasm:threading
```

### Performance Metrics

#### Core Web Vitals
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

#### Custom Metrics
- **WASM Load Time**: < 3s
- **Thread Init Time**: < 1s
- **Image Processing**: < 5s (typical image)

### Performance Budgets
```typescript
const performanceBudgets = {
  lcp: 2500,           // 2.5 seconds
  fid: 100,            // 100 milliseconds
  cls: 0.1,            // 0.1 cumulative shift
  wasmLoadTime: 3000,  // 3 seconds
  processingTime: 5000 // 5 seconds
};
```

### Performance Testing Tools

#### Built-in Performance Monitor
```typescript
import { PerformanceMonitor } from '$lib/services/performance-monitor';

const monitor = new PerformanceMonitor();
monitor.startTracking();
// ... perform actions
const metrics = monitor.getMetrics();
```

#### Lighthouse Integration
```bash
# Run Lighthouse audit
npm run lighthouse:audit

# Generate performance report
npm run performance:report
```

## 🦀 WASM Testing

### Overview
Specialized testing for WebAssembly module integration and multithreading functionality.

### WASM Test Commands

#### Basic WASM Testing
```bash
# WASM integration tests
npm run test:wasm

# Threading tests
npm run test:wasm:threading

# Performance benchmarks
npm run test:wasm:performance
```

#### Manual WASM Testing
```bash
# Open WASM test page
npm run dev
# Navigate to /static/wasm-comprehensive-test.html
```

### WASM Test Files
```
src/lib/wasm/
├── loader.test.ts                # WASM loader tests
├── index.test.ts                 # Alternative loader tests
├── core-functionality.test.ts    # Core WASM features
└── worker-load.test.ts           # Web Worker tests
```

### WASM Testing Scenarios

#### Thread Pool Initialization
```typescript
test('should initialize thread pool', async () => {
  const wasm = await loadVectorizer();
  const success = await wasm.initThreadPool(8);
  expect(success).toBe(true);
  expect(wasm.get_thread_count()).toBe(8);
});
```

#### Cross-Origin Isolation
```typescript
test('should support SharedArrayBuffer', () => {
  expect(window.crossOriginIsolated).toBe(true);
  expect(typeof SharedArrayBuffer).toBe('function');
});
```

#### Algorithm Testing
```typescript
test('should process image with edge algorithm', async () => {
  const vectorizer = new WasmVectorizer();
  const result = await vectorizer.process(imageData, {
    backend: 'edge',
    preset: 'default'
  });
  expect(result).toBeTruthy();
});
```

### WASM Testing Checklist

#### Browser Compatibility
- ✅ Chrome/Chromium (full multithreading)
- ✅ Firefox (multithreading with flags)
- ✅ Safari/WebKit (single-threaded fallback)
- ✅ Mobile browsers (limited threading)

#### Feature Support
- ✅ WebAssembly basic support
- ✅ WebAssembly SIMD
- ✅ SharedArrayBuffer
- ✅ Cross-Origin Isolation
- ✅ Web Workers

## 🔍 Static Analysis

### Overview
Code quality and static analysis tools for maintaining high code standards.

### Linting and Formatting

#### ESLint
```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Check specific files
npx eslint src/lib/components/ui/button.svelte
```

#### Prettier
```bash
# Check formatting
npm run format:check

# Apply formatting
npm run format

# Format specific files
npx prettier --write src/lib/components/ui/
```

#### TypeScript
```bash
# Type checking
npm run type-check

# SvelteKit sync and check
npm run check

# Watch mode for development
npm run check:watch
```

### Code Quality Rules

#### ESLint Configuration
- **@typescript-eslint**: TypeScript-specific rules
- **eslint-plugin-svelte**: Svelte component rules
- **@typescript-eslint/recommended**: Recommended TypeScript rules

#### Prettier Configuration
- **Tab width**: 2 spaces
- **Line length**: 100 characters
- **Semicolons**: Always
- **Quotes**: Single quotes
- **Trailing commas**: ES5

## 🔄 CI/CD Testing

### Overview
Automated testing in GitHub Actions with comprehensive quality gates.

### CI Workflows

#### Frontend CI Pipeline
```bash
# Simulates CI environment locally
NODE_ENV=test CI=true npm run ci:test
```

#### Workflow Files
```
.github/workflows/
├── frontend-ci.yml       # Main CI pipeline
├── e2e-tests.yml         # E2E testing matrix
└── storybook.yml         # Storybook deployment
```

### CI Test Stages

#### 1. Quality Gates
```bash
npm run format:check    # Code formatting
npm run lint           # Linting
npm run type-check     # TypeScript
```

#### 2. Unit Testing
```bash
npm run test:coverage  # Unit tests with coverage
```

#### 3. Build Verification
```bash
npm run build          # Production build
```

#### 4. E2E Testing
```bash
npm run test:e2e       # Cross-browser E2E tests
```

#### 5. Accessibility Audit
```bash
npm run test:accessibility  # A11y compliance
```

### CI Environment Variables
```bash
CI=true                 # CI environment flag
NODE_ENV=test          # Test environment
COVERAGE_THRESHOLD=80  # Coverage requirement
```

## 🛠️ Test Utilities

### Overview
Shared utilities and helpers for consistent testing patterns.

### Test Setup Files
```
tests/
├── setup.ts              # Global test setup
├── test-utils.ts          # Shared utilities
└── mocks/
    ├── browser-mocks.ts   # Browser API mocks
    ├── wasm-mocks.ts      # WASM module mocks
    └── component-mocks.ts # Component mocks
```

### Common Test Utilities

#### Component Testing Helpers
```typescript
import { createMockCapabilities } from '@tests/test-utils';

// Create mock CPU capabilities
const capabilities = createMockCapabilities({
  cores: 8,
  threading: true
});
```

#### WASM Testing Helpers
```typescript
import { mockWasmModule } from '@tests/mocks/wasm-mocks';

// Mock WASM module for testing
vi.mock('./vectorize_wasm.js', () => mockWasmModule);
```

#### Browser API Mocking
```typescript
import { mockNavigator } from '@tests/mocks/browser-mocks';

// Mock navigator properties
mockNavigator({
  hardwareConcurrency: 8,
  userAgent: 'test-browser'
});
```

### Custom Matchers

#### Accessibility Matchers
```typescript
expect(element).toBeAccessible();
expect(element).toHaveValidAria();
```

#### Performance Matchers
```typescript
expect(duration).toBeFasterThan(1000);
expect(metrics).toMeetWebVitals();
```

## 🚨 Troubleshooting

### Common Issues

#### Test Failures

**WASM Module Loading**
```bash
# Issue: WASM module fails to load
# Solution: Check cross-origin isolation
npm run dev -- --https
```

**Threading Tests Fail**
```bash
# Issue: Threading not supported
# Solution: Enable browser flags
chromium --enable-features=SharedArrayBuffer
```

**E2E Tests Timeout**
```bash
# Issue: Tests timeout waiting for WASM
# Solution: Increase timeout or use headed mode
npm run test:e2e -- --timeout=90000 --headed
```

#### Development Issues

**Type Errors in Tests**
```bash
# Issue: TypeScript errors in test files
# Solution: Check tsconfig.json excludes
# Ensure test files are excluded from main build
```

**Mock Module Issues**
```bash
# Issue: vi.mock not working
# Solution: Ensure mock is defined before import
# Use vi.hoisted() for complex mocks
```

**Coverage Issues**
```bash
# Issue: Low coverage on components
# Solution: Test component props and events
# Add integration tests for user interactions
```

### Debug Commands

#### Verbose Testing
```bash
# Detailed test output
npm test -- --reporter=verbose

# Debug specific test
npm test -- --grep "CPU detection" --reporter=verbose
```

#### Browser DevTools
```bash
# E2E with browser open
npm run test:e2e -- --headed --debug

# Pause on first line
npm run test:e2e -- --debug
```

#### Coverage Analysis
```bash
# Generate detailed coverage
npm run test:coverage -- --reporter=html --reporter=lcov

# View uncovered lines
open coverage/index.html
```

### Performance Optimization

#### Test Performance
```bash
# Run tests in parallel
npm test -- --pool=threads

# Limit test files
npm test src/lib/components

# Skip slow tests in development
npm test -- --exclude="**/*.slow.test.ts"
```

#### CI Optimization
```bash
# Cache dependencies
# (configured in GitHub Actions)

# Parallel E2E testing
npm run test:e2e -- --workers=2
```

## 📖 Additional Resources

### Documentation Links
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Storybook Documentation](https://storybook.js.org/)
- [Testing Library](https://testing-library.com/)

### Best Practices
- Write tests first (TDD approach)
- Test behavior, not implementation
- Use page objects for E2E tests
- Mock external dependencies
- Maintain high test coverage
- Run tests in CI/CD pipeline

### Contributing
When adding new features:
1. Write unit tests for logic
2. Add component tests for UI
3. Create E2E tests for workflows
4. Update Storybook documentation
5. Ensure accessibility compliance
6. Check performance impact

---

## 🎯 Quick Reference

### Most Common Commands
```bash
# Development testing
npm test                    # Unit tests
npm run test:watch         # Watch mode
npm run storybook          # Component docs

# Quality assurance
npm run lint               # Code linting
npm run type-check         # TypeScript
npm run test:coverage      # Coverage report

# End-to-end testing
npm run test:e2e           # Full E2E suite
npm run test:accessibility # A11y tests
npm run test:e2e:core      # Core workflows

# CI simulation
npm run ci:test            # Full CI pipeline
```

This testing guide provides comprehensive coverage of all testing tools and utilities available in the vec2art frontend. Each tool serves a specific purpose in ensuring code quality, functionality, and user experience.