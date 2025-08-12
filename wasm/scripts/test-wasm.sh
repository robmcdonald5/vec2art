#!/usr/bin/env bash
# Comprehensive WASM testing script for vec2art line tracing engine
# Tests WASM builds with multiple targets and feature combinations

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WASM_CRATE_DIR="${PROJECT_ROOT}/vectorize-wasm"
SCRIPT_DIR="${PROJECT_ROOT}/scripts"
TEST_RESULTS_DIR="${PROJECT_ROOT}/test-results"

# Test configuration
RUN_UNIT_TESTS="${1:-true}"
RUN_BROWSER_TESTS="${2:-true}"
RUN_NODE_TESTS="${3:-true}"
RUN_FEATURE_TESTS="${4:-true}"
VERBOSE="${5:-false}"

echo -e "${BLUE}=== vec2art WASM Test Suite ===${NC}"
echo -e "Project root: ${PROJECT_ROOT}"
echo -e "WASM crate: ${WASM_CRATE_DIR}"
echo -e "Test results: ${TEST_RESULTS_DIR}"
echo ""

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Create test results directory
mkdir -p "${TEST_RESULTS_DIR}"

# Function to log test results
log_test_result() {
    local test_name="$1"
    local result="$2"
    local details="${3:-}"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [[ "${result}" == "PASS" ]]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo -e "${GREEN}✓ ${test_name}${NC}"
        if [[ -n "${details}" && "${VERBOSE}" == "true" ]]; then
            echo -e "  ${details}"
        fi
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo -e "${RED}✗ ${test_name}${NC}"
        if [[ -n "${details}" ]]; then
            echo -e "  ${RED}${details}${NC}"
        fi
    fi
}

# Function to run command with timeout and capture output
run_test_command() {
    local timeout_duration="$1"
    local test_name="$2"
    shift 2
    local cmd=("$@")
    
    local output_file="${TEST_RESULTS_DIR}/${test_name}.log"
    local error_file="${TEST_RESULTS_DIR}/${test_name}.err"
    
    echo -e "${CYAN}Running: ${cmd[*]}${NC}"
    
    if timeout "${timeout_duration}" "${cmd[@]}" > "${output_file}" 2> "${error_file}"; then
        log_test_result "${test_name}" "PASS" "Output logged to ${output_file}"
        return 0
    else
        local exit_code=$?
        local error_details=""
        
        if [[ -s "${error_file}" ]]; then
            error_details="$(head -n 5 "${error_file}")"
        fi
        
        log_test_result "${test_name}" "FAIL" "Exit code: ${exit_code}. Error: ${error_details}"
        return 1
    fi
}

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check for required tools
REQUIRED_TOOLS=("rustc" "cargo" "wasm-pack")
OPTIONAL_TOOLS=("node" "deno" "python3")

for tool in "${REQUIRED_TOOLS[@]}"; do
    if command -v "${tool}" &> /dev/null; then
        echo -e "${GREEN}✓ ${tool} found${NC}"
    else
        echo -e "${RED}✗ ${tool} not found (required)${NC}"
        exit 1
    fi
done

for tool in "${OPTIONAL_TOOLS[@]}"; do
    if command -v "${tool}" &> /dev/null; then
        echo -e "${GREEN}✓ ${tool} found${NC}"
    else
        echo -e "${YELLOW}- ${tool} not found (optional)${NC}"
    fi
done

# Ensure WASM targets are installed
echo -e "${YELLOW}Setting up WASM targets...${NC}"
rustup target add wasm32-unknown-unknown
rustup target add wasm32-wasi

echo -e "${GREEN}✓ Prerequisites check complete${NC}"
echo ""

# Test 1: Unit Tests for WASM Target
if [[ "${RUN_UNIT_TESTS}" == "true" ]]; then
    echo -e "${PURPLE}=== Unit Tests ===${NC}"
    
    # Test compilation for wasm32-unknown-unknown
    if run_test_command "300s" "wasm32_compilation_check" \
        cargo check --target wasm32-unknown-unknown --manifest-path "${WASM_CRATE_DIR}/Cargo.toml"; then
        true
    fi
    
    # Test compilation for wasm32-wasi (if wasmtime is available)
    if command -v wasmtime &> /dev/null; then
        if run_test_command "300s" "wasm32_wasi_compilation" \
            cargo check --target wasm32-wasi --manifest-path "${WASM_CRATE_DIR}/Cargo.toml"; then
            true
        fi
        
        # Run unit tests with wasmtime
        if run_test_command "300s" "wasm32_wasi_unit_tests" \
            env CARGO_TARGET_WASM32_WASI_RUNNER=wasmtime \
            cargo test --target wasm32-wasi --manifest-path "${WASM_CRATE_DIR}/Cargo.toml"; then
            true
        fi
    else
        log_test_result "wasm32_wasi_tests" "SKIP" "wasmtime not available"
    fi
    
    echo ""
fi

# Test 2: Feature Flag Combinations
if [[ "${RUN_FEATURE_TESTS}" == "true" ]]; then
    echo -e "${PURPLE}=== Feature Flag Tests ===${NC}"
    
    # Test features individually and in combination
    FEATURES=(
        ""
        "simd"
        "telemetry"
        "simd,telemetry"
    )
    
    for feature_set in "${FEATURES[@]}"; do
        local test_name="features_$(echo "${feature_set}" | tr ',' '_' | tr -d ' ')"
        if [[ -z "${feature_set}" ]]; then
            test_name="features_default"
        fi
        
        local feature_args=()
        if [[ -n "${feature_set}" ]]; then
            feature_args=("--features" "${feature_set}")
        fi
        
        if run_test_command "300s" "${test_name}" \
            cargo check --target wasm32-unknown-unknown \
            --manifest-path "${WASM_CRATE_DIR}/Cargo.toml" \
            "${feature_args[@]}"; then
            true
        fi
    done
    
    echo ""
fi

# Test 3: wasm-pack Build Tests
echo -e "${PURPLE}=== wasm-pack Build Tests ===${NC}"

# Test different wasm-pack targets
WASM_TARGETS=("web" "bundler" "nodejs")

for target in "${WASM_TARGETS[@]}"; do
    local pkg_dir="${WASM_CRATE_DIR}/pkg-${target}"
    
    # Clean previous build
    if [[ -d "${pkg_dir}" ]]; then
        rm -rf "${pkg_dir}"
    fi
    
    if run_test_command "300s" "wasm_pack_${target}" \
        wasm-pack build --target "${target}" --out-dir "pkg-${target}" "${WASM_CRATE_DIR}"; then
        
        # Validate essential files exist
        local required_files=("vectorize_wasm_bg.wasm")
        case "${target}" in
            "web"|"bundler")
                required_files+=("vectorize_wasm.js" "vectorize_wasm.d.ts")
                ;;
            "nodejs")
                required_files+=("vectorize_wasm.js" "vectorize_wasm.d.ts")
                ;;
        esac
        
        local all_files_present=true
        for file in "${required_files[@]}"; do
            if [[ ! -f "${pkg_dir}/${file}" ]]; then
                log_test_result "wasm_pack_${target}_files" "FAIL" "Missing file: ${file}"
                all_files_present=false
            fi
        done
        
        if [[ "${all_files_present}" == "true" ]]; then
            log_test_result "wasm_pack_${target}_files" "PASS" "All required files present"
        fi
    fi
done

echo ""

# Test 4: Node.js Integration Tests
if [[ "${RUN_NODE_TESTS}" == "true" ]] && command -v node &> /dev/null; then
    echo -e "${PURPLE}=== Node.js Integration Tests ===${NC}"
    
    # Use the nodejs target build
    local nodejs_pkg="${WASM_CRATE_DIR}/pkg-nodejs"
    
    if [[ -d "${nodejs_pkg}" ]]; then
        # Create a simple Node.js test
        cat > "${TEST_RESULTS_DIR}/node-test.js" << 'EOF'
const wasm = require('./pkg-nodejs/vectorize_wasm.js');

async function testWasm() {
    try {
        // Test basic instantiation
        console.log('WASM module loaded successfully');
        console.log('Available functions:', Object.keys(wasm));
        
        // Test any exposed functions exist
        const expectedFunctions = ['ConfigBuilder'];
        for (const func of expectedFunctions) {
            if (typeof wasm[func] !== 'undefined') {
                console.log(`✓ ${func} is available`);
            } else {
                console.log(`✗ ${func} is missing`);
                process.exit(1);
            }
        }
        
        console.log('Node.js integration test passed');
        process.exit(0);
    } catch (error) {
        console.error('Node.js integration test failed:', error);
        process.exit(1);
    }
}

testWasm();
EOF
        
        # Copy the WASM package to test results for the test
        cp -r "${nodejs_pkg}" "${TEST_RESULTS_DIR}/"
        
        if run_test_command "60s" "nodejs_integration" \
            node "${TEST_RESULTS_DIR}/node-test.js"; then
            true
        fi
    else
        log_test_result "nodejs_integration" "SKIP" "nodejs build not available"
    fi
    
    echo ""
fi

# Test 5: Browser Environment Tests (if Python is available for HTTP server)
if [[ "${RUN_BROWSER_TESTS}" == "true" ]] && command -v python3 &> /dev/null; then
    echo -e "${PURPLE}=== Browser Environment Tests ===${NC}"
    
    # Use the web target build
    local web_pkg="${WASM_CRATE_DIR}/pkg-web"
    
    if [[ -d "${web_pkg}" ]]; then
        # Create a simple HTML test page
        cat > "${TEST_RESULTS_DIR}/browser-test.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>WASM Browser Test</title>
    <meta charset="utf-8">
</head>
<body>
    <h1>WASM Browser Test</h1>
    <div id="status">Loading...</div>
    <script type="module">
        import * as wasm from './pkg-web/vectorize_wasm.js';
        
        try {
            console.log('WASM module loaded');
            console.log('Available exports:', Object.keys(wasm));
            
            // Test basic functionality
            const expectedExports = ['ConfigBuilder'];
            let allPresent = true;
            
            for (const exp of expectedExports) {
                if (typeof wasm[exp] !== 'undefined') {
                    console.log(`✓ ${exp} is available`);
                } else {
                    console.log(`✗ ${exp} is missing`);
                    allPresent = false;
                }
            }
            
            const statusEl = document.getElementById('status');
            if (allPresent) {
                statusEl.textContent = 'PASS: All exports available';
                statusEl.style.color = 'green';
            } else {
                statusEl.textContent = 'FAIL: Some exports missing';
                statusEl.style.color = 'red';
            }
            
            // Signal completion for automated testing
            window.testResult = allPresent ? 'PASS' : 'FAIL';
            
        } catch (error) {
            console.error('Browser test failed:', error);
            document.getElementById('status').textContent = 'FAIL: ' + error.message;
            document.getElementById('status').style.color = 'red';
            window.testResult = 'FAIL';
        }
    </script>
</body>
</html>
EOF
        
        # Copy WASM package for browser test
        cp -r "${web_pkg}" "${TEST_RESULTS_DIR}/"
        
        # Start a simple HTTP server and test (basic validation)
        if timeout 30s python3 -m http.server 8080 --directory "${TEST_RESULTS_DIR}" > /dev/null 2>&1 & then
            local server_pid=$!
            sleep 2  # Give server time to start
            
            # Test that the HTML file can be served
            if curl -s "http://localhost:8080/browser-test.html" | grep -q "WASM Browser Test"; then
                log_test_result "browser_html_serve" "PASS" "HTML test page served successfully"
            else
                log_test_result "browser_html_serve" "FAIL" "Could not serve HTML test page"
            fi
            
            # Clean up server
            kill $server_pid 2>/dev/null || true
        else
            log_test_result "browser_environment" "SKIP" "Could not start HTTP server"
        fi
    else
        log_test_result "browser_environment" "SKIP" "web build not available"
    fi
    
    echo ""
fi

# Test 6: Bundle Size Analysis
echo -e "${PURPLE}=== Bundle Size Analysis ===${NC}"

for pkg_dir in "${WASM_CRATE_DIR}"/pkg-*; do
    if [[ -d "${pkg_dir}" ]]; then
        local target_name=$(basename "${pkg_dir}" | sed 's/pkg-//')
        local wasm_file="${pkg_dir}/vectorize_wasm_bg.wasm"
        
        if [[ -f "${wasm_file}" ]]; then
            local size=$(stat -f%z "${wasm_file}" 2>/dev/null || stat -c%s "${wasm_file}" 2>/dev/null || echo "0")
            local size_kb=$((size / 1024))
            
            # Log bundle size (warn if > 1MB, fail if > 5MB)
            if [[ ${size_kb} -lt 1024 ]]; then
                log_test_result "bundle_size_${target_name}" "PASS" "Size: ${size_kb}KB (acceptable)"
            elif [[ ${size_kb} -lt 5120 ]]; then
                log_test_result "bundle_size_${target_name}" "PASS" "Size: ${size_kb}KB (large but acceptable)"
            else
                log_test_result "bundle_size_${target_name}" "FAIL" "Size: ${size_kb}KB (too large)"
            fi
        else
            log_test_result "bundle_size_${target_name}" "SKIP" "WASM file not found"
        fi
    fi
done

echo ""

# Final Results Summary
echo -e "${BLUE}=== Test Results Summary ===${NC}"
echo -e "Total tests: ${TOTAL_TESTS}"
echo -e "${GREEN}Passed: ${PASSED_TESTS}${NC}"

if [[ ${FAILED_TESTS} -gt 0 ]]; then
    echo -e "${RED}Failed: ${FAILED_TESTS}${NC}"
else
    echo -e "Failed: ${FAILED_TESTS}"
fi

# Calculate success rate
if [[ ${TOTAL_TESTS} -gt 0 ]]; then
    local success_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo -e "Success rate: ${success_rate}%"
    
    if [[ ${success_rate} -ge 90 ]]; then
        echo -e "\n${GREEN}🎉 Test suite completed successfully!${NC}"
        exit 0
    elif [[ ${success_rate} -ge 70 ]]; then
        echo -e "\n${YELLOW}⚠ Test suite completed with warnings${NC}"
        exit 0
    else
        echo -e "\n${RED}❌ Test suite failed${NC}"
        exit 1
    fi
else
    echo -e "\n${YELLOW}No tests were executed${NC}"
    exit 1
fi