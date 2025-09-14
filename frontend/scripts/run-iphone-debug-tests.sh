#!/bin/bash

# iPhone Debug Test Runner
# Runs comprehensive iPhone Safari tests to identify real user issues

echo "🍎 Starting iPhone Debug Test Suite"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
TESTS_DIR="tests/e2e"
OUTPUT_DIR="tests/reports/iphone-debug"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo -e "${BLUE}📁 Creating test output directory: $OUTPUT_DIR${NC}"

# Start dev server if not running
echo -e "${BLUE}🚀 Checking if dev server is running...${NC}"
if ! curl -s http://localhost:5173 > /dev/null; then
    echo -e "${YELLOW}⚠️  Dev server not running, starting...${NC}"
    npm run dev &
    DEV_SERVER_PID=$!
    echo "Waiting for dev server to start..."
    sleep 10
else
    echo -e "${GREEN}✅ Dev server is running${NC}"
fi

echo -e "\n${BLUE}🧪 Running iPhone Debug Tests${NC}"
echo "==============================="

# Test 1: Realistic iPhone Simulation
echo -e "\n${YELLOW}📱 Test 1: Realistic iPhone Safari Environment${NC}"
npx playwright test realistic-iphone-simulation.spec.ts \
    --reporter=line \
    --output="$OUTPUT_DIR/realistic-iphone-$TIMESTAMP" \
    --project=webkit > "$OUTPUT_DIR/realistic-iphone-$TIMESTAMP.log" 2>&1

REALISTIC_EXIT_CODE=$?
if [ $REALISTIC_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Realistic iPhone test completed${NC}"
else
    echo -e "${RED}❌ Realistic iPhone test failed (exit code: $REALISTIC_EXIT_CODE)${NC}"
fi

# Test 2: Vercel CDN Cache Issues
echo -e "\n${YELLOW}🌐 Test 2: Vercel CDN iPhone Cache Issues${NC}"
npx playwright test vercel-cdn-iphone-cache.spec.ts \
    --reporter=line \
    --output="$OUTPUT_DIR/cdn-cache-$TIMESTAMP" \
    --project=webkit > "$OUTPUT_DIR/cdn-cache-$TIMESTAMP.log" 2>&1

CDN_EXIT_CODE=$?
if [ $CDN_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ CDN cache test completed${NC}"
else
    echo -e "${RED}❌ CDN cache test failed (exit code: $CDN_EXIT_CODE)${NC}"
fi

# Test 3: Original iPhone Crash Test (for comparison)
echo -e "\n${YELLOW}💥 Test 3: Original iPhone Crash Investigation${NC}"
npx playwright test iphone-crash-test.spec.ts \
    --reporter=line \
    --output="$OUTPUT_DIR/crash-test-$TIMESTAMP" \
    --project=webkit > "$OUTPUT_DIR/crash-test-$TIMESTAMP.log" 2>&1

CRASH_EXIT_CODE=$?
if [ $CRASH_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Crash test completed${NC}"
else
    echo -e "${RED}❌ Crash test failed (exit code: $CRASH_EXIT_CODE)${NC}"
fi

# Generate summary report
echo -e "\n${BLUE}📊 Generating iPhone Debug Summary${NC}"
cat << EOF > "$OUTPUT_DIR/iphone-debug-summary-$TIMESTAMP.md"
# iPhone Debug Test Summary - $TIMESTAMP

## Test Results

### 1. Realistic iPhone Safari Environment
- **Status**: $([ $REALISTIC_EXIT_CODE -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")
- **Exit Code**: $REALISTIC_EXIT_CODE
- **Log**: realistic-iphone-$TIMESTAMP.log
- **Purpose**: Simulate real iPhone Safari constraints (memory, network, Safari quirks)

### 2. Vercel CDN Cache Issues
- **Status**: $([ $CDN_EXIT_CODE -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")
- **Exit Code**: $CDN_EXIT_CODE
- **Log**: cdn-cache-$TIMESTAMP.log
- **Purpose**: Simulate stale WASM from Vercel CDN edge locations

### 3. Original iPhone Crash Test
- **Status**: $([ $CRASH_EXIT_CODE -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")
- **Exit Code**: $CRASH_EXIT_CODE
- **Log**: crash-test-$TIMESTAMP.log
- **Purpose**: Memory and threading crash investigation

## Overall Assessment

**Total Tests**: 3
**Passed**: $(( (REALISTIC_EXIT_CODE == 0) + (CDN_EXIT_CODE == 0) + (CRASH_EXIT_CODE == 0) ))
**Failed**: $(( (REALISTIC_EXIT_CODE != 0) + (CDN_EXIT_CODE != 0) + (CRASH_EXIT_CODE != 0) ))

## Key Insights

- If **Realistic iPhone test FAILED**: iPhone Safari constraints are causing issues
- If **CDN Cache test FAILED**: Vercel edge caching is serving stale/broken WASM
- If **Crash test FAILED**: Memory/threading issues detected
- If **All tests PASSED**: Issue may be in production-only conditions

## Next Steps

1. Check individual test logs for detailed error messages
2. Look for patterns across all three test types
3. If CDN test fails, recommend immediate Vercel CDN purge
4. If realistic test fails, investigate iPhone Safari compatibility issues
5. If crash test fails, review memory management and threading architecture

## Raw Logs Location

All detailed logs are available in: \`$OUTPUT_DIR/\`

EOF

# Display summary
echo -e "\n${BLUE}📋 iPhone Debug Test Summary${NC}"
echo "============================="
cat "$OUTPUT_DIR/iphone-debug-summary-$TIMESTAMP.md"

# Display key findings from logs
echo -e "\n${BLUE}🔍 Key Findings from Logs${NC}"
echo "=========================="

# Extract critical errors from logs
if [ -f "$OUTPUT_DIR/realistic-iphone-$TIMESTAMP.log" ]; then
    echo -e "${YELLOW}Realistic iPhone Test Errors:${NC}"
    grep -i "critical\|error\|crash\|failed" "$OUTPUT_DIR/realistic-iphone-$TIMESTAMP.log" | head -5
fi

if [ -f "$OUTPUT_DIR/cdn-cache-$TIMESTAMP.log" ]; then
    echo -e "${YELLOW}CDN Cache Test Errors:${NC}"
    grep -i "critical\|error\|stale\|cache" "$OUTPUT_DIR/cdn-cache-$TIMESTAMP.log" | head -5
fi

if [ -f "$OUTPUT_DIR/crash-test-$TIMESTAMP.log" ]; then
    echo -e "${YELLOW}Crash Test Errors:${NC}"
    grep -i "crash\|memory\|thread" "$OUTPUT_DIR/crash-test-$TIMESTAMP.log" | head -5
fi

# Clean up dev server if we started it
if [ -n "$DEV_SERVER_PID" ]; then
    echo -e "\n${BLUE}🛑 Stopping dev server${NC}"
    kill $DEV_SERVER_PID
fi

echo -e "\n${GREEN}🎉 iPhone Debug Test Suite Complete!${NC}"
echo -e "${BLUE}📁 Full results available in: $OUTPUT_DIR${NC}"
echo -e "${BLUE}📋 Summary report: $OUTPUT_DIR/iphone-debug-summary-$TIMESTAMP.md${NC}"

# Exit with combined status
if [ $REALISTIC_EXIT_CODE -eq 0 ] && [ $CDN_EXIT_CODE -eq 0 ] && [ $CRASH_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ All iPhone tests passed - investigating other factors needed${NC}"
    exit 0
else
    echo -e "${RED}❌ Some iPhone tests failed - issues detected that explain user reports${NC}"
    exit 1
fi