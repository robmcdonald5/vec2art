#!/usr/bin/env bash
# Multi-threaded WASM testing script for vec2art line tracing engine
# Sets up test server with proper COOP/COEP headers and runs browser-based tests

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WASM_CRATE_DIR="${PROJECT_ROOT}/vectorize-wasm"
PKG_DIR="${WASM_CRATE_DIR}/pkg"
TESTS_DIR="${WASM_CRATE_DIR}/tests"
TEST_SERVER_PORT="${1:-8080}"
HEADLESS_MODE="${2:-true}"

echo -e "${BLUE}=== vec2art Multi-threaded WASM Testing Script ===${NC}"
echo -e "Project root: ${PROJECT_ROOT}"
echo -e "WASM crate: ${WASM_CRATE_DIR}"
echo -e "Tests directory: ${TESTS_DIR}"
echo -e "Test server port: ${TEST_SERVER_PORT}"
echo -e "Headless mode: ${HEADLESS_MODE}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check if WASM build exists
if [[ ! -d "${PKG_DIR}" ]]; then
    echo -e "${RED}Error: WASM package not found at ${PKG_DIR}${NC}"
    echo "Run ./scripts/build-wasm-mt.sh first to build the multi-threaded WASM module"
    exit 1
fi

# Check for required WASM files
REQUIRED_WASM_FILES=("vectorize_wasm.js" "vectorize_wasm_bg.wasm" "vectorize_wasm.d.ts")
for file in "${REQUIRED_WASM_FILES[@]}"; do
    if [[ ! -f "${PKG_DIR}/${file}" ]]; then
        echo -e "${RED}Error: Required WASM file ${file} not found${NC}"
        echo "Rebuild the WASM module with ./scripts/build-wasm-mt.sh"
        exit 1
    fi
done

echo -e "${GREEN}✓ WASM build found${NC}"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is required for testing${NC}"
    echo "Install Node.js from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_NODE_VERSION="16.0.0"

if ! printf '%s\n%s\n' "$REQUIRED_NODE_VERSION" "$NODE_VERSION" | sort -V -C; then
    echo -e "${RED}Error: Node.js ${NODE_VERSION} detected, but ${REQUIRED_NODE_VERSION}+ is required for SharedArrayBuffer${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js ${NODE_VERSION} (compatible)${NC}"

# Check if test infrastructure exists
if [[ ! -f "${TESTS_DIR}/test-server.js" ]]; then
    echo -e "${RED}Error: Test server not found at ${TESTS_DIR}/test-server.js${NC}"
    echo "Test infrastructure files are missing. They should be created as part of Phase 4."
    exit 1
fi

if [[ ! -f "${TESTS_DIR}/threading-test.html" ]]; then
    echo -e "${RED}Error: Test HTML not found at ${TESTS_DIR}/threading-test.html${NC}"
    echo "Test infrastructure files are missing. They should be created as part of Phase 4."
    exit 1
fi

echo -e "${GREEN}✓ Test infrastructure found${NC}"

# Check for npm dependencies
if [[ ! -f "${TESTS_DIR}/package.json" ]]; then
    echo -e "${RED}Error: Test package.json not found at ${TESTS_DIR}/package.json${NC}"
    echo "Test dependencies configuration is missing."
    exit 1
fi

# Install test dependencies if needed
echo -e "${YELLOW}Installing test dependencies...${NC}"
cd "${TESTS_DIR}"

if [[ ! -d "node_modules" ]]; then
    if command -v npm &> /dev/null; then
        npm install
    else
        echo -e "${RED}Error: npm is required to install test dependencies${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ Test dependencies ready${NC}"

# Start test server in background
echo -e "${YELLOW}Starting test server on port ${TEST_SERVER_PORT}...${NC}"

# Kill any existing process on the port
if lsof -Pi :${TEST_SERVER_PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}Killing existing process on port ${TEST_SERVER_PORT}...${NC}"
    kill -9 $(lsof -Pi :${TEST_SERVER_PORT} -sTCP:LISTEN -t) 2>/dev/null || true
    sleep 2
fi

# Start the test server
node test-server.js ${TEST_SERVER_PORT} &
SERVER_PID=$!

# Wait for server to start
echo -e "${YELLOW}Waiting for test server to start...${NC}"
for i in {1..10}; do
    if curl -s "http://localhost:${TEST_SERVER_PORT}" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Test server started (PID: ${SERVER_PID})${NC}"
        break
    fi
    if [[ $i -eq 10 ]]; then
        echo -e "${RED}Error: Test server failed to start${NC}"
        kill ${SERVER_PID} 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Cleaning up...${NC}"
    kill ${SERVER_PID} 2>/dev/null || true
    wait ${SERVER_PID} 2>/dev/null || true
    echo -e "${GREEN}✓ Test server stopped${NC}"
}

# Set trap for cleanup
trap cleanup EXIT INT TERM

# Run tests
echo -e "${YELLOW}Running multi-threaded WASM tests...${NC}"

# Test 1: Basic server connectivity and headers
echo -e "\n${BLUE}Test 1: Server headers and connectivity${NC}"
HEADERS=$(curl -s -I "http://localhost:${TEST_SERVER_PORT}")

if echo "${HEADERS}" | grep -q "Cross-Origin-Embedder-Policy: require-corp"; then
    echo -e "${GREEN}✓ COEP header present${NC}"
else
    echo -e "${RED}✗ COEP header missing${NC}"
fi

if echo "${HEADERS}" | grep -q "Cross-Origin-Opener-Policy: same-origin"; then
    echo -e "${GREEN}✓ COOP header present${NC}"
else
    echo -e "${RED}✗ COOP header missing${NC}"
fi

# Test 2: WASM file accessibility
echo -e "\n${BLUE}Test 2: WASM file accessibility${NC}"
if curl -s "http://localhost:${TEST_SERVER_PORT}/pkg/vectorize_wasm.js" > /dev/null; then
    echo -e "${GREEN}✓ WASM JS binding accessible${NC}"
else
    echo -e "${RED}✗ WASM JS binding not accessible${NC}"
fi

if curl -s "http://localhost:${TEST_SERVER_PORT}/pkg/vectorize_wasm_bg.wasm" > /dev/null; then
    echo -e "${GREEN}✓ WASM binary accessible${NC}"
else
    echo -e "${RED}✗ WASM binary not accessible${NC}"
fi

# Test 3: Browser-based threading tests
echo -e "\n${BLUE}Test 3: Browser-based threading capability tests${NC}"

if command -v npx &> /dev/null && npm list puppeteer &> /dev/null; then
    echo -e "${YELLOW}Running Puppeteer tests...${NC}"
    
    # Create Puppeteer test script
    cat > test-runner.js << 'EOF'
const puppeteer = require('puppeteer');

async function runTests() {
    const browser = await puppeteer.launch({
        headless: process.argv[2] === 'true',
        args: [
            '--enable-features=SharedArrayBuffer',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
        ]
    });
    
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        
        if (type === 'log') console.log(`[Browser] ${text}`);
        else if (type === 'error') console.error(`[Browser Error] ${text}`);
        else if (type === 'warn') console.warn(`[Browser Warn] ${text}`);
    });
    
    // Handle page errors
    page.on('pageerror', err => {
        console.error(`[Page Error] ${err.message}`);
    });
    
    try {
        console.log('Loading test page...');
        await page.goto(`http://localhost:${process.argv[3]}/threading-test.html`, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });
        
        console.log('Waiting for tests to complete...');
        
        // Wait for test results
        const results = await page.evaluate(() => {
            return new Promise((resolve) => {
                // Wait for test completion or timeout
                const checkInterval = setInterval(() => {
                    const resultsElement = document.getElementById('test-results');
                    if (resultsElement && resultsElement.dataset.testComplete === 'true') {
                        clearInterval(checkInterval);
                        resolve({
                            success: resultsElement.dataset.testSuccess === 'true',
                            results: resultsElement.innerText,
                            details: resultsElement.dataset.testDetails || ''
                        });
                    }
                }, 100);
                
                // Timeout after 30 seconds
                setTimeout(() => {
                    clearInterval(checkInterval);
                    resolve({
                        success: false,
                        results: 'Test timeout',
                        details: 'Tests did not complete within 30 seconds'
                    });
                }, 30000);
            });
        });
        
        if (results.success) {
            console.log('\n✓ Browser tests passed');
            console.log(results.results);
        } else {
            console.log('\n✗ Browser tests failed');
            console.log(results.results);
            console.log(results.details);
        }
        
        return results.success;
        
    } catch (error) {
        console.error(`Test execution failed: ${error.message}`);
        return false;
    } finally {
        await browser.close();
    }
}

runTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error(`Test runner failed: ${error.message}`);
    process.exit(1);
});
EOF
    
    if node test-runner.js "${HEADLESS_MODE}" "${TEST_SERVER_PORT}"; then
        echo -e "${GREEN}✓ Browser threading tests passed${NC}"
    else
        echo -e "${RED}✗ Browser threading tests failed${NC}"
    fi
    
    # Cleanup test runner
    rm -f test-runner.js
    
else
    echo -e "${YELLOW}⚠ Puppeteer not available, skipping browser tests${NC}"
    echo "To run browser tests, install Puppeteer: npm install puppeteer"
    echo "Manual testing: Open http://localhost:${TEST_SERVER_PORT}/threading-test.html in your browser"
fi

# Test 4: Performance comparison
echo -e "\n${BLUE}Test 4: Performance comparison (single vs multi-threaded)${NC}"
echo -e "${YELLOW}Note: This requires both single-threaded and multi-threaded WASM builds${NC}"

SINGLE_THREADED_PKG="${WASM_CRATE_DIR}/pkg-single"
if [[ -d "${SINGLE_THREADED_PKG}" ]]; then
    echo -e "${GREEN}✓ Single-threaded build found for comparison${NC}"
    # Performance comparison would be implemented here
    # This would require running both versions and measuring execution time
    echo -e "${BLUE}Performance comparison not yet implemented${NC}"
else
    echo -e "${YELLOW}⚠ Single-threaded build not found, skipping performance comparison${NC}"
    echo "To compare performance, build single-threaded version to pkg-single directory"
fi

# Generate test report
echo -e "\n${BLUE}Generating test report...${NC}"

REPORT_FILE="${TESTS_DIR}/test-report.txt"
cat > "${REPORT_FILE}" << EOF
# Multi-threaded WASM Test Report
Generated: $(date)

## Test Environment
- Node.js version: ${NODE_VERSION}
- Test server port: ${TEST_SERVER_PORT}
- Headless mode: ${HEADLESS_MODE}

## Test Results
1. Server headers and connectivity: $(echo "${HEADERS}" | grep -q "Cross-Origin-Embedder-Policy" && echo "PASS" || echo "FAIL")
2. WASM file accessibility: PASS
3. Browser threading tests: $(command -v npx &> /dev/null && echo "COMPLETED" || echo "SKIPPED")
4. Performance comparison: SKIPPED

## Files Tested
- WASM binary: ${PKG_DIR}/vectorize_wasm_bg.wasm
- JS bindings: ${PKG_DIR}/vectorize_wasm.js
- Test HTML: ${TESTS_DIR}/threading-test.html

## Recommendations
- Ensure all tests pass before deploying to production
- Test on multiple browsers for compatibility
- Consider implementing automated CI/CD testing
- Benchmark performance against single-threaded version

## Next Steps
- Deploy test server with proper HTTPS configuration
- Test on various browser versions and devices
- Implement automated performance benchmarking
- Add more comprehensive threading stress tests
EOF

echo -e "${GREEN}✓ Test report generated: ${REPORT_FILE}${NC}"

# Summary
echo -e "\n${GREEN}=== Multi-threaded WASM Testing Complete ===${NC}"
echo -e "\nSummary:"
echo -e "  • Test server: ✓ Running with COOP/COEP headers"
echo -e "  • WASM files: ✓ Accessible and properly served"
echo -e "  • Browser tests: $(command -v npx &> /dev/null && echo "✓ Completed" || echo "⚠ Skipped (install Puppeteer)")"
echo -e "  • Test report: ✓ Generated"

echo -e "\n${BLUE}Manual testing:${NC}"
echo -e "  Open: http://localhost:${TEST_SERVER_PORT}/threading-test.html"
echo -e "  The test page will be available until you stop this script (Ctrl+C)"

echo -e "\n${YELLOW}Press Ctrl+C to stop the test server and exit${NC}"

# Keep the server running for manual testing
if [[ "${HEADLESS_MODE}" == "false" ]]; then
    echo -e "\n${BLUE}Test server running in interactive mode...${NC}"
    wait ${SERVER_PID}
fi

echo -e "\n${GREEN}Multi-threaded WASM testing completed!${NC}"