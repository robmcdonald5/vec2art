#!/bin/bash

# iPhone Production Issue Test Runner
# Tests for production-specific issues that aren't related to caching
# Focus: HTTPS, serverless cold starts, Safari limitations, network issues

echo "🏭 Starting iPhone Production Issue Test Suite"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TESTS_DIR="tests/e2e"
OUTPUT_DIR="tests/reports/iphone-production"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")

mkdir -p "$OUTPUT_DIR"

echo -e "${BLUE}📁 Output directory: $OUTPUT_DIR${NC}"

# Start dev server if needed
echo -e "${BLUE}🚀 Checking dev server...${NC}"
if ! curl -s http://localhost:5173 > /dev/null; then
    echo -e "${YELLOW}⚠️  Starting dev server...${NC}"
    npm run dev &
    DEV_SERVER_PID=$!
    sleep 10
else
    echo -e "${GREEN}✅ Dev server running${NC}"
fi

echo -e "\n${BLUE}🧪 Running iPhone Production Tests${NC}"
echo "===================================="

# Test Suite 1: Production Environment Issues
echo -e "\n${YELLOW}🏭 Test 1: iPhone Production Environment Issues${NC}"
npx playwright test iphone-production-environment.spec.ts \
    --reporter=line \
    --output="$OUTPUT_DIR/environment-$TIMESTAMP" \
    --project=webkit > "$OUTPUT_DIR/environment-$TIMESTAMP.log" 2>&1

ENV_EXIT_CODE=$?
if [ $ENV_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Environment test completed${NC}"
else
    echo -e "${RED}❌ Environment test failed (exit: $ENV_EXIT_CODE)${NC}"
fi

# Test Suite 2: Production-Specific Errors
echo -e "\n${YELLOW}💥 Test 2: iPhone Production Errors${NC}"
npx playwright test iphone-production-errors.spec.ts \
    --reporter=line \
    --output="$OUTPUT_DIR/errors-$TIMESTAMP" \
    --project=webkit > "$OUTPUT_DIR/errors-$TIMESTAMP.log" 2>&1

ERRORS_EXIT_CODE=$?
if [ $ERRORS_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Production errors test completed${NC}"
else
    echo -e "${RED}❌ Production errors test failed (exit: $ERRORS_EXIT_CODE)${NC}"
fi

# Test Suite 3: Simple iPhone Debug (baseline)
echo -e "\n${YELLOW}🍎 Test 3: Simple iPhone Debug (baseline)${NC}"
npx playwright test simple-iphone-debug.spec.ts \
    --reporter=line \
    --output="$OUTPUT_DIR/baseline-$TIMESTAMP" \
    --project=webkit > "$OUTPUT_DIR/baseline-$TIMESTAMP.log" 2>&1

BASELINE_EXIT_CODE=$?
if [ $BASELINE_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Baseline test completed${NC}"
else
    echo -e "${RED}❌ Baseline test failed (exit: $BASELINE_EXIT_CODE)${NC}"
fi

# Generate comprehensive analysis report
echo -e "\n${BLUE}📊 Analyzing Results${NC}"

cat << EOF > "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"
# iPhone Production Issue Analysis - $TIMESTAMP

## Executive Summary

**Purpose**: Identify production-specific iPhone issues that occur even with fresh cache/cookies.
**Focus**: HTTPS, serverless functions, Safari limitations, network conditions, memory pressure.

## Test Results

### 1. Production Environment Test
- **Status**: $([ $ENV_EXIT_CODE -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")
- **Exit Code**: $ENV_EXIT_CODE
- **Focus**: HTTPS/HTTP differences, memory pressure, WASM compatibility
- **Log**: environment-$TIMESTAMP.log

### 2. Production Errors Test
- **Status**: $([ $ERRORS_EXIT_CODE -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")
- **Exit Code**: $ERRORS_EXIT_CODE
- **Focus**: Cold starts, CSP errors, Safari-specific failures
- **Log**: errors-$TIMESTAMP.log

### 3. Baseline iPhone Test
- **Status**: $([ $BASELINE_EXIT_CODE -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED")
- **Exit Code**: $BASELINE_EXIT_CODE
- **Focus**: Basic iPhone functionality (control test)
- **Log**: baseline-$TIMESTAMP.log

## Analysis Matrix

| Test Type | Result | Significance |
|-----------|---------|--------------|
| Baseline | $([ $BASELINE_EXIT_CODE -eq 0 ] && echo "PASS" || echo "FAIL") | $([ $BASELINE_EXIT_CODE -eq 0 ] && echo "iPhone simulation works locally" || echo "Basic iPhone functionality broken") |
| Environment | $([ $ENV_EXIT_CODE -eq 0 ] && echo "PASS" || echo "FAIL") | $([ $ENV_EXIT_CODE -eq 0 ] && echo "No environment issues detected" || echo "Production environment causes iPhone issues") |
| Errors | $([ $ERRORS_EXIT_CODE -eq 0 ] && echo "PASS" || echo "FAIL") | $([ $ERRORS_EXIT_CODE -eq 0 ] && echo "No production-specific errors" || echo "Production triggers iPhone-specific errors") |

## Key Insights

EOF

# Add insights based on test results
if [ $BASELINE_EXIT_CODE -eq 0 ] && [ $ENV_EXIT_CODE -ne 0 ]; then
    echo "- ✅ **Local iPhone works**, ❌ **Production environment breaks** → Production-specific issue" >> "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"
elif [ $BASELINE_EXIT_CODE -eq 0 ] && [ $ERRORS_EXIT_CODE -ne 0 ]; then
    echo "- ✅ **Basic functionality works**, ❌ **Production errors detected** → Error-specific issue" >> "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"
elif [ $BASELINE_EXIT_CODE -ne 0 ]; then
    echo "- ❌ **Baseline fails** → Fundamental iPhone compatibility issue" >> "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"
else
    echo "- ✅ **All tests pass** → Issue may be in real device/network conditions not simulated" >> "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"
fi

cat << EOF >> "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"

## Detailed Error Analysis

EOF

# Extract key errors from each log
echo "### Environment Test Errors" >> "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"
if [ -f "$OUTPUT_DIR/environment-$TIMESTAMP.log" ]; then
    echo '```' >> "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"
    grep -i "critical\|error\|fail\|memory\|timeout" "$OUTPUT_DIR/environment-$TIMESTAMP.log" | head -10 >> "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"
    echo '```' >> "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"
else
    echo "No environment test log found" >> "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"
fi

echo -e "\n### Production Errors Test Errors" >> "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"
if [ -f "$OUTPUT_DIR/errors-$TIMESTAMP.log" ]; then
    echo '```' >> "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"
    grep -i "critical\|error\|fail\|cold start\|csp" "$OUTPUT_DIR/errors-$TIMESTAMP.log" | head -10 >> "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"
    echo '```' >> "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"
else
    echo "No production errors test log found" >> "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"
fi

echo -e "\n### Baseline Test Status" >> "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"
if [ -f "$OUTPUT_DIR/baseline-$TIMESTAMP.log" ]; then
    echo '```' >> "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"
    grep -i "iphone debug report\|overall.*status\|success\|fail" "$OUTPUT_DIR/baseline-$TIMESTAMP.log" | head -5 >> "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"
    echo '```' >> "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"
else
    echo "No baseline test log found" >> "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"
fi

cat << EOF >> "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"

## Recommendations

Based on the test results:

EOF

# Generate specific recommendations
TOTAL_FAILURES=$(( (ENV_EXIT_CODE != 0) + (ERRORS_EXIT_CODE != 0) + (BASELINE_EXIT_CODE != 0) ))

if [ $TOTAL_FAILURES -eq 0 ]; then
    echo "1. **All simulations pass** - The issue may require testing with:" >> "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"
    echo "   - Real iPhone device against production URL" >> "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"
    echo "   - Different iPhone models/iOS versions" >> "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"
    echo "   - Real cellular networks vs WiFi" >> "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"
elif [ $BASELINE_EXIT_CODE -ne 0 ]; then
    echo "1. **Critical**: Fix baseline iPhone compatibility issues first" >> "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"
    echo "2. Review WASM loading and initialization for iPhone Safari" >> "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"
elif [ $ENV_EXIT_CODE -ne 0 ]; then
    echo "1. **Production Environment Issue**: Focus on HTTPS, memory, or Safari compatibility" >> "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"
    echo "2. Review production-specific constraints affecting iPhone" >> "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"
elif [ $ERRORS_EXIT_CODE -ne 0 ]; then
    echo "1. **Production Error Issue**: Check serverless cold starts, CSP policies, Safari limits" >> "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"
    echo "2. Monitor production error rates for iPhone users" >> "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"
fi

echo -e "\n## Next Steps" >> "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"
echo "1. Review detailed logs in: \`$OUTPUT_DIR/\`" >> "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"
echo "2. Test against actual production URL if possible" >> "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"
echo "3. Consider testing with real iPhone device" >> "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"
echo "4. Monitor production error logs for iPhone-specific patterns" >> "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"

# Display results
echo -e "\n${BLUE}📋 Production Issue Analysis Complete${NC}"
echo "======================================"
cat "$OUTPUT_DIR/production-analysis-$TIMESTAMP.md"

echo -e "\n${BLUE}🔍 Quick Error Scan${NC}"
echo "=================="

# Quick scan for critical issues
echo -e "${YELLOW}Critical Issues Found:${NC}"
find "$OUTPUT_DIR" -name "*.log" -exec grep -l "CRITICAL\|Critical\|critical" {} \; | while read logfile; do
    echo -e "${RED}📄 $logfile${NC}"
    grep -i "critical" "$logfile" | head -3
done

echo -e "\n${YELLOW}Memory Issues:${NC}"
find "$OUTPUT_DIR" -name "*.log" -exec grep -l "memory\|Memory\|OutOfMemory" {} \; | while read logfile; do
    echo -e "${RED}🧠 $logfile${NC}"
    grep -i "memory" "$logfile" | head -2
done

echo -e "\n${YELLOW}WASM Issues:${NC}"
find "$OUTPUT_DIR" -name "*.log" -exec grep -l "WASM\|WebAssembly" {} \; | while read logfile; do
    echo -e "${RED}🧩 $logfile${NC}"
    grep -i "wasm.*error\|wasm.*fail" "$logfile" | head -2
done

# Cleanup
if [ -n "$DEV_SERVER_PID" ]; then
    echo -e "\n${BLUE}🛑 Stopping dev server${NC}"
    kill $DEV_SERVER_PID
fi

echo -e "\n${GREEN}🎉 iPhone Production Test Suite Complete!${NC}"
echo -e "${BLUE}📁 Full analysis: $OUTPUT_DIR/production-analysis-$TIMESTAMP.md${NC}"

# Exit with appropriate code
if [ $TOTAL_FAILURES -eq 0 ]; then
    echo -e "${GREEN}✅ All production tests passed${NC}"
    exit 0
else
    echo -e "${RED}❌ $TOTAL_FAILURES production test(s) failed${NC}"
    exit 1
fi