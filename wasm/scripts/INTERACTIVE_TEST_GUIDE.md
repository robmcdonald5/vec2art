# 🎯 Interactive Dot Mapping Test Suite Guide

## Overview
The `test-dot-mapping-interactive.bat` script provides a user-friendly way to test different vectorization algorithms on your images. Instead of running all tests automatically, it lets you choose exactly which methods to test for each image.

## Quick Start

### Interactive Mode (Manual Control)
1. Run the script: `scripts\test-dot-mapping-interactive.bat`
2. The script will show all available images
3. For each image, choose whether to test it
4. Select which algorithms and styles you want to test
5. Watch the results generate in real-time

### Automated Mode (Batch Processing)
- **All Dot Mapping**: `scripts\test-dot-mapping-interactive.bat --all-dots`
- **All Line Tracing**: `scripts\test-dot-mapping-interactive.bat --all-line`
- **Help**: `scripts\test-dot-mapping-interactive.bat --help`

The automated modes will process ALL images with ALL methods of the specified type.

## Selection System

### Quick Options (Recommended)
- **`ALL`** = Run ALL available methods (~15+ tests, 5-10 minutes per image)
- **`EDGE`** = Run ALL edge backend methods (4 tests, ~30 seconds per image)  
- **`DOTS`** = Run ALL dots backend methods with colors (8 tests, 2-5 minutes per image)
- **`FAST`** = Run fast methods only (2 tests, ~15 seconds per image)

### Backend Selection (Manual Control)
- **`1`** = Edge Backend (traditional line tracing)
- **`2`** = Dots Backend (stippling/pointillism effects)

### Edge Backend Options (use with `1`)
- **`M`** = Basic Edge Detection (detail: 0.3, fast)
- **`N`** = High Detail Edge (detail: 0.4, more precise)  
- **`O`** = Multipass Edge (enhanced quality, slower)
- **`P`** = Directional Multipass (maximum quality, comprehensive)

### Dots Backend Density Styles (use with `2`)
- **`A`** = Ultra Fine Stippling (0.05 density, 0.2-0.8px dots)
- **`B`** = Fine Stippling (0.08 density, 0.3-1.5px dots)
- **`C`** = Medium Artistic (0.15 density, 1.0-3.0px dots)
- **`D`** = Bold Pointillism (0.20 density, 1.5-4.0px dots)
- **`E`** = Large Artistic (0.25 density, 2.0-5.0px dots)
- **`F`** = Sparse Dramatic (0.40 density, 3.0-6.0px dots)

### Dots Backend Color Options (use with `2`)
- **`G`** = Monochrome (black dots only)
- **`H`** = Preserve Colors (colorful stippling/pointillism)

### Dots Backend Technical Options (use with `2`)
- **`I`** = Standard Processing (default settings)
- **`J`** = Adaptive Sizing (varies dot size based on complexity)
- **`K`** = Strict Background (low tolerance, clean images)
- **`L`** = Permissive Background (high tolerance, textured images)

## Example Selections

### Quick Options (Easiest)
- **`ALL`** → Run every available method (comprehensive, time-intensive)
- **`EDGE`** → Test all edge tracing methods quickly
- **`DOTS`** → Test all dot mapping styles with colors
- **`FAST`** → Quick test with basic edge + medium dots

### Simple Examples
- **`1M`** → Edge backend with basic detection
- **`2C`** → Dots backend with medium artistic style
- **`2CH`** → Dots with medium style + preserve colors

### Complex Examples  
- **`1MNO`** → Edge backend with basic, high detail, and multipass
- **`2ACHJ`** → Dots with ultra fine + medium + colors + adaptive sizing
- **`12MNCH`** → Both edge AND dots backends with multiple options

### Comprehensive Testing
- **`ALL`** → Test everything available (recommended over manual comprehensive)
- **`12MNOPABCDEFGHIJKL`** → Manual version of ALL (same result, harder to type)
- **`2BDHJ`** → Good balance: fine + bold dots with colors and adaptive sizing

## Output Files
Generated files follow this naming pattern:
```
{imageName}-{testNumber}-{method}-{style}.svg
```

Examples:
- `test1-1-edge-basic.svg`
- `test1-2-dots-medium.svg` 
- `portrait-3-dots-bold.svg`

## Tips for Best Results

### Quick Recommendations by Use Case

**New Users / Exploration:**
- Use: `FAST` (quick overview of capabilities)
- Then: `ALL` on your favorite images (comprehensive comparison)

**Time-Constrained Testing:**
- Use: `EDGE` (fast, good for line art)
- Or: `DOTS` (artistic effects, moderate time)

**Maximum Quality Comparison:**
- Use: `ALL` (comprehensive testing, be patient)

### Manual Selection by Image Type

**For Portraits/Photos:**
- Use: `2BCHJ` (Fine stippling with colors and adaptive sizing)
- Or: `2DCHJ` (Bold pointillism with colors and adaptive sizing)

**For Technical Drawings:**
- Use: `1N` (High detail edge detection)
- Or: `2BK` (Fine stippling with strict background)

**For Logos/Graphics:**
- Use: `1O` (Multipass edge detection)
- Or: `2CL` (Medium dots with permissive background)

**For Artistic Effects:**
- Use: `2EH` (Large artistic dots with preserved colors)
- Or: `2FHJ` (Sparse dramatic with colors and adaptive sizing)

## Help System
- Type **`h`** when prompted for selections to see detailed help
- The script includes comprehensive examples and explanations
- All options are clearly documented within the interactive interface

## Output Management
- All generated SVG files go to `examples\outputs\dot_mapping\`
- The script offers to open the output directory when complete
- Files are automatically numbered to avoid conflicts
- Each test run creates uniquely named files

## Performance Notes
- Edge backend tests are generally faster (1-5 seconds)
- Dots backend tests can take longer, especially with adaptive sizing
- Ultra fine stippling (`A`) takes the longest due to high dot density
- Multipass and directional options significantly increase processing time

Enjoy experimenting with different artistic styles and technical approaches!