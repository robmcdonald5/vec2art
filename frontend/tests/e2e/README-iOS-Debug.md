# iOS/Safari WASM Debugging Guide

## Problem
The converter is failing on iPhones but working on Android devices. This indicates Safari-specific WebAssembly issues.

## Debugging Tools Created

### 1. Safari-Specific E2E Test Suite
**File:** `safari-wasm-debug.spec.ts`

Run locally:
```bash
# Run on local Safari/WebKit
npm run test:e2e -- safari-wasm-debug.spec.ts --project=webkit

# Run with headed mode to see what happens
npm run test:e2e -- safari-wasm-debug.spec.ts --project=webkit --headed
```

### 2. Error Reporting Service
**File:** `src/lib/services/error-reporter.ts`

This service automatically captures:
- WASM initialization errors
- Memory allocation failures
- Console logs before/after errors
- Device and browser capabilities
- Network request failures

### 3. iOS Compatibility Service
**File:** `src/lib/services/ios-compatibility.ts`

Automatically detects iOS/Safari and applies workarounds:
- Disables threading on iOS Safari
- Limits memory allocation
- Provides fallback configurations
- Shows user warnings

### 4. Debug Panel UI
**File:** `src/lib/components/debug/DebugPanel.svelte`

Access the debug panel by:
1. Adding a debug button to your UI
2. Press keyboard shortcut (if implemented)
3. URL parameter: `?debug=true`

The panel shows:
- System information
- Error reports with full details
- WASM status and capabilities
- iOS/Safari compatibility info
- Export error reports as JSON

## How to Use

### Step 1: Run Local Tests
```bash
cd frontend
npm run test:e2e -- safari-wasm-debug.spec.ts --project=webkit
```

### Step 2: Test on Real iOS Devices (BrowserStack)
```bash
# Set up BrowserStack credentials
export BROWSERSTACK_USERNAME=your_username
export BROWSERSTACK_ACCESS_KEY=your_access_key

# Install BrowserStack SDK
npm install --save-dev browserstack-node-sdk

# Run tests on real iOS devices
npx browserstack-node-sdk playwright test safari-wasm-debug.spec.ts
```

### Step 3: Analyze Results
The tests will output:
- Device capabilities
- WASM loading status
- Memory limits
- Threading support
- Detailed error messages

## Common iOS/Safari Issues

### 1. SharedArrayBuffer Not Available
- **Cause:** iOS Safari requires COEP/COOP headers
- **Fix:** Already configured in vite.config.ts
- **Fallback:** Automatically disabled threading

### 2. Memory Growth Restrictions
- **Cause:** iOS Safari has issues with ALLOW_MEMORY_GROWTH
- **Fix:** iOS compatibility service limits memory
- **Fallback:** Uses fixed memory allocation

### 3. WebAssembly Instantiation Failures
- **Cause:** Memory limits or security restrictions
- **Fix:** Reduced memory footprint for iOS
- **Fallback:** Simplified algorithms

## Integration Instructions

### 1. Add Error Reporter to App
```typescript
// In +layout.svelte or app initialization
import { errorReporter } from '$lib/services/error-reporter';
import { iosCompatibility } from '$lib/services/ios-compatibility';

onMount(() => {
  // Initialize error reporting
  errorReporter.setup();

  // Check iOS compatibility
  iosCompatibility.logCompatibilityInfo();

  // Show warning if needed
  if (iosCompatibility.shouldShowWarning()) {
    const message = iosCompatibility.getWarningMessage();
    // Show toast or alert to user
  }
});
```

### 2. Apply iOS Workarounds to WASM
```typescript
// In loader.ts or WASM initialization
import { applyIOSWorkarounds } from '$lib/services/ios-compatibility';

let wasmConfig = {
  threadCount: 12,
  memoryPages: 256,
  // ... other config
};

// Apply iOS-specific workarounds
wasmConfig = applyIOSWorkarounds(wasmConfig);
```

### 3. Add Debug Panel to UI
```svelte
<!-- In your main layout or converter page -->
<script>
  import DebugPanel from '$lib/components/debug/DebugPanel.svelte';

  let showDebug = $state(false);

  // Show debug panel with keyboard shortcut
  function handleKeydown(e: KeyboardEvent) {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      showDebug = !showDebug;
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if showDebug}
  <DebugPanel bind:isOpen={showDebug} />
{/if}
```

## Quick Fixes to Try

### 1. Disable Threading for iOS
In `loader.ts`:
```typescript
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
if (isIOS) {
  options.initializeThreads = false;
  options.threadCount = 1;
}
```

### 2. Reduce Memory Allocation
In WASM initialization:
```typescript
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const memoryPages = isIOS ? 128 : 256; // 8MB vs 16MB
```

### 3. Add User Warning
Show a message to iOS users:
```typescript
if (isIOSSafari()) {
  toastStore.warning(
    'Limited support on iOS Safari. Processing may be slower.',
    { duration: 5000 }
  );
}
```

## Next Steps

1. **Deploy with Debug Mode**: Add the debug panel to production temporarily
2. **Collect User Reports**: Ask iOS users to export debug reports
3. **Analyze Patterns**: Look for common failure points
4. **Apply Targeted Fixes**: Based on specific error patterns
5. **Test on Real Devices**: Use BrowserStack for comprehensive testing

## Support Links

- [WebAssembly on iOS Safari](https://webkit.org/blog/7846/webassembly-in-webkit/)
- [SharedArrayBuffer Requirements](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer)
- [BrowserStack Playwright Docs](https://www.browserstack.com/docs/automate/playwright)