#!/bin/bash

# =============================================================================
# Artistic Effects Comparison Test Suite (Unix/Linux/Mac)
# Tests to definitively determine if hand-drawn effects are being applied
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}==========================================================================="
echo "ARTISTIC EFFECTS TEST SUITE - Testing None vs Sketchy Presets"
echo -e "===========================================================================${NC}\n"

# Create output directories
echo "Creating output directories..."
mkdir -p examples/outputs/debug_artistic_effects/{none,subtle,medium,strong,sketchy,analysis}

echo -e "\n${CYAN}==========================================================================="
echo "TEST 1: Simple Checkerboard Pattern (Most visible effects)"
echo -e "===========================================================================${NC}"

# Function to run CLI test
run_test() {
    local preset=$1
    local input=$2
    local output=$3
    local stats=$4
    local detail=${5:-0.3}
    local stroke=${6:-2.0}
    
    echo -e "${YELLOW}Testing with ${preset} preset...${NC}"
    cd vectorize-cli
    cargo run --release --bin vectorize-cli -- trace-low \
        --hand-drawn "$preset" \
        --detail "$detail" \
        --stroke-width "$stroke" \
        --stats "$stats" \
        "$input" \
        "$output"
    cd ..
}

# Test checkerboard with all presets
for preset in none subtle medium strong sketchy; do
    run_test "$preset" \
        "../examples/images_in/test_checkerboard.png" \
        "../examples/outputs/debug_artistic_effects/${preset}/checkerboard.svg" \
        "../examples/outputs/debug_artistic_effects/analysis/checkerboard_${preset}_stats.csv"
done

echo -e "\n${CYAN}==========================================================================="
echo "TEST 2: Complex Image (anime-girl.png)"
echo -e "===========================================================================${NC}"

# Test complex image
run_test "none" \
    "../examples/images_in/anime-girl.png" \
    "../examples/outputs/debug_artistic_effects/none/anime-girl.svg" \
    "../examples/outputs/debug_artistic_effects/analysis/anime_none_stats.csv" \
    0.5 1.5

run_test "sketchy" \
    "../examples/images_in/anime-girl.png" \
    "../examples/outputs/debug_artistic_effects/sketchy/anime-girl.svg" \
    "../examples/outputs/debug_artistic_effects/analysis/anime_sketchy_stats.csv" \
    0.5 1.5

echo -e "\n${CYAN}==========================================================================="
echo "TEST 3: Custom Tremor and Variable Weights (Override test)"
echo -e "===========================================================================${NC}"

# Test with custom parameters
echo -e "${YELLOW}Testing with custom tremor=0.0 (should be identical to none)...${NC}"
cd vectorize-cli
cargo run --release --bin vectorize-cli -- trace-low \
    --tremor 0.0 \
    --variable-weights 0.0 \
    --detail 0.3 \
    --stroke-width 2.0 \
    ../examples/images_in/test_checkerboard.png \
    ../examples/outputs/debug_artistic_effects/analysis/custom_zero.svg

echo -e "${YELLOW}Testing with maximum custom tremor=0.5...${NC}"
cargo run --release --bin vectorize-cli -- trace-low \
    --tremor 0.5 \
    --variable-weights 1.0 \
    --detail 0.3 \
    --stroke-width 2.0 \
    ../examples/images_in/test_checkerboard.png \
    ../examples/outputs/debug_artistic_effects/analysis/custom_max.svg
cd ..

echo -e "\n${CYAN}==========================================================================="
echo "TEST 4: Different Detail Levels (to see if effects scale)"
echo -e "===========================================================================${NC}"

# Test with different detail levels
for detail_type in low high; do
    if [ "$detail_type" = "low" ]; then
        detail=0.1
        stroke=3.0
    else
        detail=0.9
        stroke=1.0
    fi
    
    for preset in none sketchy; do
        echo -e "${YELLOW}Testing ${detail_type} detail (${detail}) with ${preset}...${NC}"
        cd vectorize-cli
        cargo run --release --bin vectorize-cli -- trace-low \
            --hand-drawn "$preset" \
            --detail "$detail" \
            --stroke-width "$stroke" \
            ../examples/images_in/Little-Red-Devil.webp \
            ../examples/outputs/debug_artistic_effects/analysis/devil_${detail_type}_${preset}.svg
        cd ..
    done
done

echo -e "\n${CYAN}==========================================================================="
echo "ANALYSIS PHASE - Extracting Metrics"
echo -e "===========================================================================${NC}"

# File size comparison
echo -e "${YELLOW}Generating file size comparison...${NC}"
ls -lh examples/outputs/debug_artistic_effects/*/*.svg > examples/outputs/debug_artistic_effects/analysis/file_sizes.txt

# Quick diff analysis
echo -e "${YELLOW}Performing quick diff analysis...${NC}"
if command -v diff &> /dev/null; then
    echo "Diff between none and sketchy (checkerboard):" > examples/outputs/debug_artistic_effects/analysis/diff_analysis.txt
    diff -u examples/outputs/debug_artistic_effects/none/checkerboard.svg \
            examples/outputs/debug_artistic_effects/sketchy/checkerboard.svg \
            >> examples/outputs/debug_artistic_effects/analysis/diff_analysis.txt 2>&1 || true
fi

# Extract stroke-width values
echo -e "${YELLOW}Extracting stroke-width values...${NC}"
for file in examples/outputs/debug_artistic_effects/*/*.svg; do
    echo "File: $file" >> examples/outputs/debug_artistic_effects/analysis/stroke_widths.txt
    grep -o 'stroke-width="[^"]*"' "$file" | head -5 >> examples/outputs/debug_artistic_effects/analysis/stroke_widths.txt 2>/dev/null || true
    echo "" >> examples/outputs/debug_artistic_effects/analysis/stroke_widths.txt
done

# Count paths and calculate metrics
echo -e "${YELLOW}Counting paths and calculating metrics...${NC}"
for preset in none sketchy; do
    file="examples/outputs/debug_artistic_effects/${preset}/checkerboard.svg"
    if [ -f "$file" ]; then
        echo "=== ${preset} ===" >> examples/outputs/debug_artistic_effects/analysis/path_counts.txt
        echo "Path count: $(grep -c '<path' "$file" 2>/dev/null || echo 0)" >> examples/outputs/debug_artistic_effects/analysis/path_counts.txt
        echo "File size: $(wc -c < "$file") bytes" >> examples/outputs/debug_artistic_effects/analysis/path_counts.txt
        echo "Line count: $(wc -l < "$file")" >> examples/outputs/debug_artistic_effects/analysis/path_counts.txt
        echo "Curve commands (C,S,Q,T): $(grep -o '[CSQT]' "$file" 2>/dev/null | wc -l || echo 0)" >> examples/outputs/debug_artistic_effects/analysis/path_counts.txt
        echo "" >> examples/outputs/debug_artistic_effects/analysis/path_counts.txt
    fi
done

# Run Python analysis if available
if command -v python3 &> /dev/null; then
    echo -e "\n${YELLOW}Running Python analysis...${NC}"
    python3 analyze-svg-differences.py 2>/dev/null || echo "Python analysis skipped (script may need adjustments)"
fi

echo -e "\n${GREEN}==========================================================================="
echo "Tests Complete! Check outputs in:"
echo "  examples/outputs/debug_artistic_effects/"
echo ""
echo "Visual comparison files:"
echo "  - none/checkerboard.svg vs sketchy/checkerboard.svg"
echo "  - none/anime-girl.svg vs sketchy/anime-girl.svg"
echo ""
echo "Analysis files in:"
echo "  examples/outputs/debug_artistic_effects/analysis/"
echo ""
echo "Quick verification commands:"
echo "  # Compare file sizes:"
echo "  ls -l examples/outputs/debug_artistic_effects/none/checkerboard.svg examples/outputs/debug_artistic_effects/sketchy/checkerboard.svg"
echo ""
echo "  # Check for differences:"
echo "  diff examples/outputs/debug_artistic_effects/none/checkerboard.svg examples/outputs/debug_artistic_effects/sketchy/checkerboard.svg | head -20"
echo -e "===========================================================================${NC}"

# Quick automated check
echo -e "\n${CYAN}QUICK AUTOMATED CHECK:${NC}"
if [ -f "examples/outputs/debug_artistic_effects/none/checkerboard.svg" ] && \
   [ -f "examples/outputs/debug_artistic_effects/sketchy/checkerboard.svg" ]; then
    
    size1=$(wc -c < "examples/outputs/debug_artistic_effects/none/checkerboard.svg")
    size2=$(wc -c < "examples/outputs/debug_artistic_effects/sketchy/checkerboard.svg")
    
    if [ "$size1" -eq "$size2" ]; then
        echo -e "${RED}⚠️  WARNING: File sizes are IDENTICAL ($size1 bytes)${NC}"
        echo -e "${RED}   This suggests artistic effects may not be working!${NC}"
    else
        echo -e "${GREEN}✓ File sizes differ: none=$size1 bytes, sketchy=$size2 bytes${NC}"
        diff_percent=$(( (size2 - size1) * 100 / size1 ))
        echo -e "${GREEN}  Difference: ${diff_percent}%${NC}"
    fi
    
    # Check if files are identical
    if diff -q "examples/outputs/debug_artistic_effects/none/checkerboard.svg" \
               "examples/outputs/debug_artistic_effects/sketchy/checkerboard.svg" > /dev/null 2>&1; then
        echo -e "${RED}⚠️  WARNING: Files are IDENTICAL!${NC}"
        echo -e "${RED}   Artistic effects are definitely NOT being applied!${NC}"
    else
        echo -e "${GREEN}✓ Files have differences - effects may be working${NC}"
    fi
fi