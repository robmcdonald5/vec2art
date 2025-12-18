# Testing

Test suites and CI pipeline configuration.

## Overview

| Type          | Tool                  | Location                          |
| ------------- | --------------------- | --------------------------------- |
| Unit tests    | Vitest                | `src/**/*.test.ts`                |
| E2E tests     | Playwright            | `tests/e2e/`                      |
| Accessibility | axe-core + Playwright | `tests/e2e/accessibility.spec.ts` |

## Quick Start

```bash
cd frontend

# Unit tests
npm test

# E2E tests
npm run test:e2e

# All checks
npm run lint && npm run check && npm test
```

## Unit Testing (Vitest)

### Running Tests

```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage report
npm test -- component-name # Run specific test
```

### Writing Tests

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/svelte";
import Component from "./Component.svelte";

describe("Component", () => {
  it("renders correctly", () => {
    render(Component, { props: { title: "Test" } });
    expect(screen.getByText("Test")).toBeInTheDocument();
  });
});
```

### Store Tests

```typescript
import { describe, it, expect } from "vitest";
import { algorithmConfigStore } from "./algorithm-config-store.svelte";

describe("algorithmConfigStore", () => {
  it("updates algorithm", () => {
    algorithmConfigStore.setAlgorithm("dots");
    expect(algorithmConfigStore.getConfig().algorithm).toBe("dots");
  });
});
```

### Coverage Thresholds

- Global: 80% statements, branches, functions, lines
- Utils: 95% (critical functions)
- Components: 90% (UI components)

## E2E Testing (Playwright)

### Running Tests

```bash
npm run test:e2e                    # All browsers
npm run test:e2e -- --project=chromium  # Chrome only
npm run test:e2e -- --headed        # Visible browser
npm run test:e2e -- --debug         # Debug mode
```

### Test Structure

```typescript
import { test, expect } from "@playwright/test";

test("user can upload and convert", async ({ page }) => {
  await page.goto("/converter");

  // Upload file
  await page.setInputFiles('input[type="file"]', "test.png");

  // Wait for processing
  await page.waitForSelector(".processing-complete");

  // Verify result
  await expect(page.locator(".svg-preview")).toBeVisible();
});
```

### Test Files

```
tests/
├── e2e/
│   ├── core-workflow.spec.ts    # Main user flows
│   ├── accessibility.spec.ts    # A11y compliance
│   └── error-handling.spec.ts   # Error scenarios
└── fixtures/
    └── images/                  # Test images
```

## Accessibility Testing

```bash
npm run test:accessibility
```

Uses axe-core integration with Playwright:

```typescript
import { injectAxe, checkA11y } from "axe-playwright";

test("page is accessible", async ({ page }) => {
  await page.goto("/converter");
  await injectAxe(page);
  await checkA11y(page);
});
```

### WCAG Compliance

Target: WCAG 2.1 AA

Requirements:

- Color contrast ratio >= 4.5:1
- Keyboard accessible
- Screen reader compatible
- Visible focus indicators

## CI Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
jobs:
  quality:
    steps:
      - run: npm run format:check
      - run: npm run lint
      - run: npm run check
      - run: npm run test:coverage
      - run: npm run build
```

### Local CI Simulation

```bash
# Quick validation
npm run format:check && npm run lint && npm run check

# Full validation
npm run format:check && npm run lint && npm run check && npm run test:coverage && npm run build
```

## WASM Testing

```bash
npm run test:wasm
```

Tests WASM module integration:

```typescript
import { describe, it, expect } from "vitest";
import { loadVectorizer } from "$lib/wasm/loader";

describe("WASM module", () => {
  it("loads successfully", async () => {
    const vectorizer = await loadVectorizer();
    expect(vectorizer).toBeDefined();
  });

  it("processes image", async () => {
    const vectorizer = await loadVectorizer();
    const result = await vectorizer.process(testImageData, config);
    expect(result).toContain("<svg");
  });
});
```

## Mocking

### WASM Module

```typescript
vi.mock("$lib/wasm/loader", () => ({
  loadVectorizer: vi.fn().mockResolvedValue({
    process: vi.fn().mockResolvedValue("<svg></svg>"),
  }),
}));
```

### Browser APIs

```typescript
// Mock navigator
Object.defineProperty(navigator, "hardwareConcurrency", {
  value: 8,
  writable: true,
});
```

## Troubleshooting

| Issue                | Solution                             |
| -------------------- | ------------------------------------ |
| WASM tests fail      | Check Cross-Origin Isolation headers |
| E2E tests timeout    | Increase timeout or use `--headed`   |
| Coverage too low     | Add tests for uncovered branches     |
| Type errors in tests | Check tsconfig includes test files   |

## Performance Testing

```bash
npm run test:e2e:performance
```

Metrics tracked:

- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1
- WASM load time: < 3s
- Processing time: < 5s typical

## Test Utilities

### Common Helpers

```typescript
// tests/utils/test-helpers.ts
export function createMockImageData(width: number, height: number) {
  return new ImageData(width, height);
}

export function createMockConfig(overrides = {}) {
  return {
    algorithm: "edge",
    detail: 0.5,
    strokeWidth: 1.0,
    ...overrides,
  };
}
```

### Custom Matchers

```typescript
expect(element).toBeAccessible();
expect(duration).toBeFasterThan(1000);
```
