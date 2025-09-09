# 🎯 VEC2ART Complete Testing Guide

## Overview

This guide covers both automated and interactive testing scripts for the vec2art project. The system supports 4 production backends with comprehensive testing capabilities.

---

## 📋 Automated Testing: `test-backends-auto.bat`

For quick, comprehensive testing without manual intervention.

### **Available Flags:**

#### **`--all-dots`** (Basic Dot Mapping)

- **Tests per image**: 6
- **Time per image**: 2-3 minutes
- **Output folder**: `dot_mapping/`
- **Includes**: Ultra Fine, Fine, Medium, Bold, Large, Sparse densities
- **Features**: All tests use color preservation and adaptive sizing
- **Best for**: Quick dot mapping overview

#### **`--all-dots-full`** (Comprehensive Dot Mapping)

- **Tests per image**: 18
- **Time per image**: 8-12 minutes
- **Output folder**: `dot_mapping/`
- **Includes**:
  - Colorful Adaptive (3 tests)
  - Monochrome Adaptive (3 tests)
  - Colorful Fixed (3 tests) - Nearly-fixed dot sizes for consistent appearance
  - Monochrome Fixed (3 tests) - Nearly-fixed dot sizes for consistent appearance
  - Background Variations (2 tests)
  - Extreme Variations (4 tests)
- **Best for**: Complete dot mapping analysis

#### **`--all-line`** (Basic Line Tracing)

- **Tests per image**: 6 (covers all 4 backends)
- **Time per image**: 1-2 minutes
- **Output folders**: `line_tracing/`, `centerline_tracing/`, `superpixel_regions/`
- **Includes**:
  - Edge backend: Basic, High Detail, Multipass, Directional
  - Centerline backend: Basic skeleton extraction
  - Superpixel backend: Basic region-based
- **Best for**: Quick overview of all backends

#### **`--all-line-full`** (Comprehensive Line Tracing)

- **Tests per image**: 15
- **Time per image**: 5-8 minutes
- **Output folders**: `line_tracing/`, `centerline_tracing/`, `superpixel_regions/`
- **Includes**:
  - Basic Edge Tests (4 tests)
  - Multipass Tests (2 tests)
  - Hand-drawn Artistic Tests (4 tests: subtle, medium, strong, sketchy)
  - Advanced Combinations (3 tests)
  - New Backend Tests (2 tests: centerline, superpixel)
- **Best for**: Complete line tracing analysis

#### **`--all-line-artistic`** (Artistic Line Tracing)

- **Tests per image**: 8
- **Time per image**: 3-5 minutes
- **Output folder**: `line_tracing/`
- **Includes**:
  - Basic Hand-drawn Variants (4 tests)
  - Multipass with Artistic Effects (2 tests)
  - Advanced Directional with Artistic Effects (2 tests)
- **Best for**: Hand-drawn aesthetic comparison

#### **Usage Examples:**

```batch
# Quick testing
scripts\test-backends-auto.bat --all-line

# Comprehensive analysis
scripts\test-backends-auto.bat --all-line-full
scripts\test-backends-auto.bat --all-dots-full

# Artistic focus
scripts\test-backends-auto.bat --all-line-artistic

# Help
scripts\test-backends-auto.bat --help
```

---

## 🎮 Interactive Testing: `test-backends-interactive.bat`

For manual control and custom algorithm combinations.

### **Automated Modes (Batch Processing)**

- **All Dot Mapping**: `scripts\test-backends-interactive.bat --all-dots`
- **All Line Tracing**: `scripts\test-backends-interactive.bat --all-line`
- **Help**: `scripts\test-backends-interactive.bat --help`

### **Interactive Mode (Manual Control)**

1. Run: `scripts\test-backends-interactive.bat`
2. Choose images to test
3. Select algorithm combinations using the selection system below

---

## 🔧 Interactive Selection System

### **Quick Options (Recommended)**

- **`ALL`** = Run ALL available methods (~20+ tests, 7-12 minutes per image)
- **`EDGE`** = Run ALL edge backend methods (4 tests, ~30 seconds per image)
- **`DOTS`** = Run ALL dots backend methods with colors (8 tests, 2-5 minutes per image)
- **`FAST`** = Run fast methods only (2 tests, ~15 seconds per image)

### **Backend Selection**

- **`1`** = Edge Backend (traditional line tracing)
- **`2`** = Dots Backend (stippling/pointillism effects)
- **`3`** = Centerline Backend (skeleton-based line extraction)
- **`4`** = Superpixel Backend (region-based line art)

### **Edge Backend Options** (use with `1`)

- **`M`** = Basic Edge Detection (detail: 0.3, fast)
- **`N`** = High Detail Edge (detail: 0.4, more precise)
- **`O`** = Multipass Edge (enhanced quality, slower)
- **`P`** = Directional Multipass (maximum quality, comprehensive)

### **Centerline Backend Options** (use with `3`)

- **`Q`** = Basic Centerline (skeleton-based tracing)
- **`R`** = High Detail Centerline (enhanced skeleton extraction)

### **Superpixel Backend Options** (use with `4`)

- **`S`** = Basic Superpixel (region-based line art)
- **`T`** = Detailed Superpixel (high-resolution regions)

### **Dots Backend Density Styles** (use with `2`)

- **`A`** = Ultra Fine Stippling (0.05 density, 0.2-0.8px dots)
- **`B`** = Fine Stippling (0.08 density, 0.3-1.5px dots)
- **`C`** = Medium Artistic (0.15 density, 1.0-3.0px dots)
- **`D`** = Bold Pointillism (0.20 density, 1.5-4.0px dots)
- **`E`** = Large Artistic (0.25 density, 2.0-5.0px dots)
- **`F`** = Sparse Dramatic (0.40 density, 3.0-6.0px dots)

### **Dots Backend Color Options** (use with `2`)

- **`G`** = Monochrome (black dots only)
- **`H`** = Preserve Colors (colorful stippling/pointillism)

### **Dots Backend Technical Options** (use with `2`)

- **`I`** = Standard Processing (default settings)
- **`J`** = Adaptive Sizing (varies dot size based on complexity)
- **`K`** = Strict Background (low tolerance, clean images)
- **`L`** = Permissive Background (high tolerance, textured images)

---

## 📝 Selection Examples

### **Simple Examples**

- **`1M`** → Edge backend with basic detection
- **`2C`** → Dots backend with medium artistic style
- **`3Q`** → Centerline backend with basic skeleton
- **`4S`** → Superpixel backend with basic regions

### **Multi-Backend Examples**

- **`12CH`** → Both Edge AND Dots backends with color preservation
- **`1234MNQSCH`** → All backends with multiple options
- **`13QM`** → Edge and Centerline backends with basic options

### **Advanced Dot Combinations**

- **`2ACHJ`** → Dots with ultra fine + medium + colors + adaptive sizing
- **`2BDHJ`** → Fine + bold dots with colors and adaptive sizing
- **`2ABCDEFHJ`** → All dot densities with colors and adaptive sizing

### **Edge Backend Combinations**

- **`1MNO`** → Edge with basic, high detail, and multipass
- **`1P`** → Edge with advanced directional multipass
- **`1MNOP`** → All edge detection methods

### **Comprehensive Testing**

- **`ALL`** → Test everything available (recommended)
- **`1234MNOPQRSTABCDEFGHIJKL`** → Manual version of ALL (same result)

---

## 📁 Output Organization

### **File Naming Pattern**

```
{imageName}-{testNumber}-{method}-{style}.svg
```

**Examples:**

- `test1-1-edge-basic.svg`
- `test1-2-dots-medium.svg`
- `portrait-3-centerline-basic.svg`
- `logo-4-superpixel-detail.svg`

### **Output Folders**

- **`examples/outputs/line_tracing/`** → Edge backend results
- **`examples/outputs/dot_mapping/`** → Dots backend results
- **`examples/outputs/centerline_tracing/`** → Centerline backend results
- **`examples/outputs/superpixel_regions/`** → Superpixel backend results

---

## 🚀 Quick Start Recommendations

### **New Users**

1. Start with: `FAST` (quick overview)
2. Then try: `EDGE` (traditional line art)
3. Explore: `DOTS` (artistic effects)

### **Time-Constrained Testing**

- **Quick**: Use automated `--all-line` (6 tests, 1-2 min per image)
- **Moderate**: Use interactive `EDGE` or `DOTS`
- **Comprehensive**: Use automated `--all-line-full` (15 tests, 5-8 min per image)

### **By Image Type**

**Portraits/Photos:**

- Use: `2BCHJ` (Fine stippling with colors and adaptive sizing)
- Or: `2DCHJ` (Bold pointillism with colors and adaptive sizing)

**Technical Drawings:**

- Use: `1N` (High detail edge detection)
- Or: `3R` (High detail centerline)

**Logos/Graphics:**

- Use: `1O` (Multipass edge detection)
- Or: `4S` (Basic superpixel regions)

**Artistic Effects:**

- Use: `2EH` (Large artistic dots with preserved colors)
- Or: `2FHJ` (Sparse dramatic with colors and adaptive sizing)

---

## ⚡ Performance Notes

### **Processing Times (per image)**

- **Edge Backend**: 1-5 seconds (fastest)
- **Dots Backend**: 10-120 seconds (depends on density)
- **Centerline Backend**: 5-15 seconds (moderate)
- **Superpixel Backend**: 5-20 seconds (moderate)

### **Memory Usage**

- **Ultra Fine Stippling (`A`)**: Highest memory usage
- **Multipass/Directional**: 2-3x processing time
- **Adaptive Sizing**: +20-50% processing time
- **Color Preservation**: Minimal overhead

### **Quality vs Speed**

- **Fastest**: `1M` (Basic edge)
- **Best Quality**: `1P` (Directional multipass edge)
- **Best Artistic**: `2EHJ` (Large dots with colors and adaptive sizing)
- **Most Comprehensive**: `ALL` (everything)

---

## 🎯 Backend Comparison

| Backend        | Output Type     | Best For                       | Speed  | Artistic Style         |
| -------------- | --------------- | ------------------------------ | ------ | ---------------------- |
| **Edge**       | Line paths      | Technical drawings, sketches   | Fast   | Clean, precise lines   |
| **Dots**       | Circle elements | Artistic effects, textures     | Slow   | Stippling, pointillism |
| **Centerline** | Skeleton paths  | Logos, bold shapes             | Medium | Technical, geometric   |
| **Superpixel** | Filled regions  | Cell-shaded art, illustrations | Medium | Flat color regions     |

---

## 💡 Tips for Best Results

1. **Start Simple**: Use quick options before diving into manual combinations
2. **Match to Content**: Different backends work better for different image types
3. **Consider Time**: Dots backend with fine densities can take several minutes
4. **Experiment**: The interactive mode is perfect for finding optimal settings
5. **Use Help**: Type `h` in interactive mode for detailed explanations

Enjoy exploring the artistic possibilities of vec2art's powerful vectorization system!
