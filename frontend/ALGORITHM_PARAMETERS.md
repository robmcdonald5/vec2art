# Algorithm Parameters Reference

This document provides a complete list of all configurable parameters ("knobs"/"sliders") for each conversion algorithm in the vec2art system. Use this reference when implementing UI controls for the conversion algorithms.

## Complete List of Configurable Parameters for Each Algorithm

### **1. Edge Backend (Traditional Line Tracing)**

The Edge backend is the primary line tracing algorithm that converts images into clean vector line art using edge detection and path tracing.

#### **Core Parameters**

- **Detail Level** (0.0-1.0) - Controls overall line density and sensitivity
  - 0.0-0.3: Sparse, clean lines
  - 0.4-0.6: Medium detail
  - 0.7-1.0: Dense, detailed output
- **Stroke Width** (0.5-5.0 px) - Base line thickness at 1080p reference
- **Noise Filtering** (on/off) - Content-aware noise reduction

#### **Multi-Pass Processing**

- **Enable Multipass** (on/off) - Dual-pass processing for enhanced quality
- **Conservative Detail** (0.0-1.0) - First pass threshold (optional override)
- **Aggressive Detail** (0.0-1.0) - Second pass threshold (optional override)

#### **Directional Processing**

- **Enable Reverse Pass** (on/off) - Right-to-left, bottom-to-top processing
- **Enable Diagonal Pass** (on/off) - Diagonal direction processing
- **Directional Strength Threshold** (0.0-1.0) - Skip if not beneficial

#### **Advanced Edge Detection (ETF/FDoG)**

- **Enable ETF/FDoG** (on/off) - Advanced edge tangent flow processing
- **ETF Radius** (2-8) - Coherency computation radius
- **ETF Iterations** (2-8) - Coherency refinement iterations
- **ETF Coherency Tau** (0.1-0.5) - Coherency threshold
- **FDoG Sigma S** (0.4-2.0) - Structure Gaussian width
- **FDoG Sigma C** (1.0-4.0) - Context Gaussian width
- **FDoG Tau** (0.5-1.0) - Edge threshold
- **NMS Low** (0.02-0.2) - Non-max suppression low threshold
- **NMS High** (0.1-0.4) - Non-max suppression high threshold

#### **Flow-Guided Tracing**

- **Enable Flow Tracing** (on/off) - Flow-guided polyline tracing
- **Trace Min Gradient** (0.02-0.2) - Minimum gradient magnitude
- **Trace Min Coherency** (0.05-0.3) - Minimum coherency for tracing
- **Trace Max Gap** (2-10 px) - Maximum gap size for bridging
- **Trace Max Length** (1000-50000) - Maximum polyline length

#### **Bézier Curve Fitting**

- **Enable Bézier Fitting** (on/off) - Smooth curve fitting
- **Fit Lambda Curvature** (0.01-0.1) - Curvature penalty coefficient
- **Fit Max Error** (0.5-2.0) - Maximum fitting error tolerance
- **Fit Split Angle** (15-60°) - Corner splitting angle threshold

#### **Hand-Drawn Aesthetics**

- **Hand-Drawn Preset** (none/subtle/medium/strong/sketchy)
  - **None**: Clean, precise lines
  - **Subtle**: Barely noticeable organic feel
  - **Medium**: Noticeable hand-drawn character
  - **Strong**: Obvious artistic style
  - **Sketchy**: Loose, sketchy appearance
- **Variable Weights** (0.0-1.0) - Line weight variation based on confidence
- **Tremor Strength** (0.0-0.5) - Organic line jitter and imperfection
- **Tapering** (0.0-1.0) - Line endpoint tapering for natural ends
- **Pressure Variation** (0.0-1.0) - Pressure simulation along paths
- **Base Width Multiplier** (0.5-2.0) - Overall width scaling

#### **Performance**

- **Max Processing Time** (500-5000 ms) - Time budget limit
- **Random Seed** (any integer) - Reproducible randomization

---

### **2. Centerline Backend (Skeleton Extraction)**

The Centerline backend extracts the skeletal structure of shapes, ideal for creating centerlines through thick strokes and shapes.

#### **Core Parameters**

- **Detail Level** (0.0-1.0) - Controls skeleton sensitivity and branch pruning
- **Stroke Width** (0.5-3.0 px) - Output line thickness

#### **Adaptive Thresholding**

- **Enable Adaptive Threshold** (on/off) - Use adaptive vs global Otsu thresholding
- **Window Size** (25-35 px) - Adaptive threshold window size
- **Sensitivity K** (0.3-0.5) - Sauvola threshold parameter
- **Use Optimized** (on/off) - Integral image optimization for speed

#### **Morphological Processing**

- **Noise Filtering** (on/off) - Pre-processing cleanup with open+close operations
- **Morphology Type** (open+close) - Gap bridging strategy

#### **Skeleton Processing**

- **Thinning Algorithm** (Guo-Hall) - Skeleton extraction method (improved over Zhang-Suen)
- **Min Branch Length** (4-24 px) - Pruning threshold for small branches
- **Micro-Loop Removal** (8-16 px) - Remove tiny cycles that create "hairballs"

#### **EDT-Based Enhancements**

- **Enable Width Modulation** (on/off) - Variable stroke width based on distance transform
- **EDT Radius Ratio** (0.5-0.9) - Branch pruning ratio threshold based on thickness
- **Width Modulation Range** (0.6-1.8x) - Width variation limits for natural appearance

#### **Path Connectivity**

- **Max Join Distance** (3-10 px) - Endpoint bridging distance for reconnecting breaks
- **Max Join Angle** (15-45°) - Tangent alignment threshold for smart bridging
- **EDT Bridge Check** (on/off) - Prevent invalid bridges through background areas

#### **Simplification**

- **Douglas-Peucker Epsilon** (0.5-3.0 px) - Path simplification tolerance
- **Adaptive Simplification** (on/off) - Curvature-aware simplification (preserves curves)

---

### **3. Dots Backend (Stippling/Pointillism)**

The Dots backend creates artistic stippling and pointillism effects by placing dots based on image content and gradients.

#### **Core Parameters**

- **Dot Density Threshold** (0.0-1.0) - Gradient strength required for dot placement
  - **0.05-0.2**: Dense stippling with fine detail
  - **0.3-0.5**: Medium density for balanced effect
  - **0.6-1.0**: Sparse artistic style with bold impact

#### **Dot Sizing**

- **Min Radius** (0.2-3.0 px) - Minimum dot size
- **Max Radius** (0.5-10.0 px) - Maximum dot size
- **Adaptive Sizing** (on/off) - Variance-based size adjustment for detail areas

#### **Color & Style**

- **Preserve Colors** (on/off) - Colorful stippling vs monochrome dots
- **Background Tolerance** (0.0-1.0) - Background detection sensitivity
  - **0.05-0.15**: Clean backgrounds, strict detection
  - **0.2-0.4**: Textured backgrounds, permissive detection

#### **Distribution**

- **Poisson Disk Sampling** (on/off) - Even distribution vs random placement
- **Min Distance Factor** (0.5-2.0) - Dot spacing control
- **Grid Resolution** (0.5-2.0) - Sampling grid density

#### **Artistic Effects**

- **Gradient-Based Sizing** (on/off) - Scale dot size by edge strength
- **Local Variance Scaling** (on/off) - Detail-aware sizing based on image variance
- **Color Clustering** (on/off) - Group similar colors for artistic coherence
- **Opacity Variation** (0.5-1.0) - Dot transparency range for depth

---

### **4. Superpixel Backend (Region-Based Segmentation)**

The Superpixel backend creates artistic region-based representations by segmenting the image into coherent areas and tracing their boundaries.

#### **Core Parameters**

- **Detail Level** (0.0-1.0) - Controls number of regions (inversely related)
- **Stroke Width** (0.5-3.0 px) - Region boundary thickness

#### **Segmentation**

- **Number of Superpixels** (50-500) - Target region count for segmentation
- **Compactness** (5-30) - Region shape regularity vs color fidelity
- **SLIC Iterations** (5-15) - Convergence iterations for quality

#### **Region Processing**

- **Min Region Size** (10-100 px²) - Merge small regions threshold
- **Color Distance** (10-50) - Merge similar colors threshold
- **Spatial Distance Weight** (0.5-2.0) - Position vs color importance

#### **Output Style**

- **Fill Regions** (on/off) - Filled regions vs outline only
- **Stroke Regions** (on/off) - Add region boundaries
- **Simplify Boundaries** (on/off) - Smooth region edges for cleaner look
- **Boundary Epsilon** (0.5-3.0 px) - Boundary simplification tolerance

---

## Global Parameters (All Backends)

### **Output Control**

- **SVG Precision** (0-4 decimal places) - Coordinate precision for file size vs quality
- **Optimize SVG** (on/off) - Output optimization and cleanup
- **Include Metadata** (on/off) - Embed processing information in SVG

### **Performance**

- **Thread Count** (1-16) - Parallel processing threads (auto-detect recommended)
- **Max Image Size** (512-8192 px) - Resolution limits for processing
- **Memory Budget** (100-2000 MB) - Memory constraints for large images

---

## Recommended UI Implementation

### **Essential Controls (Always Visible)**

1. **Backend Selection** - Dropdown or tabs (Edge/Centerline/Dots/Superpixel)
2. **Detail Level** - Slider (0-100%) with visual preview
3. **Stroke Width** - Slider (0.5-5.0 px)
4. **Hand-Drawn Style** - Dropdown (None/Subtle/Medium/Strong/Sketchy) for Edge backend

### **Advanced Controls (Collapsible Sections)**

#### **Edge Backend Advanced**

- **Multi-pass Processing** - Toggle with sub-options
- **Directional Passes** - Checkboxes for reverse/diagonal
- **Noise Filtering** - Toggle
- **Advanced Edge Detection** - Collapsible group with ETF/FDoG parameters

#### **Centerline Backend Advanced**

- **Adaptive Threshold** - Toggle with window size slider
- **Width Modulation** - Toggle for natural stroke variation
- **Bridge Distance** - Slider (3-10 px) for gap reconnection
- **Simplification** - Adaptive vs fixed simplification toggle

#### **Dots Backend Advanced**

- **Density Control** - Slider (0-100%) with visual density preview
- **Size Range** - Dual slider for min/max dot sizes
- **Color Options** - Toggle for preserve colors + adaptive sizing
- **Distribution** - Poisson sampling toggle

#### **Superpixel Backend Advanced**

- **Region Count** - Slider (50-500) with live preview
- **Compactness** - Slider (5-30) affecting shape vs color
- **Output Style** - Toggles for fill/stroke modes
- **Merge Threshold** - Slider for similar region merging

### **Preset Configurations for Quick Start**

#### **Sketch Preset**

- Backend: Edge
- Detail: 0.4
- Hand-drawn: Medium
- Multipass: Enabled
- Use case: Converting photos to sketch-like line art

#### **Technical Preset**

- Backend: Centerline
- Detail: 0.3
- Hand-drawn: None
- Adaptive threshold: Enabled
- Use case: Technical drawings, logos, precise line extraction

#### **Artistic Preset**

- Backend: Dots
- Density: 0.15
- Preserve colors: Enabled
- Adaptive sizing: Enabled
- Use case: Artistic stippling and pointillism effects

#### **Poster Preset**

- Backend: Superpixel
- Region count: 150
- Fill regions: Enabled
- Compactness: 20
- Use case: Poster-style region art with bold shapes

#### **Comic Preset**

- Backend: Edge
- Detail: 0.5
- Hand-drawn: Strong
- Directional passes: Enabled
- Use case: Comic book style line art with character

---

## Parameter Relationships and Tips

### **Performance vs Quality Trade-offs**

- Higher detail levels increase processing time exponentially
- Multi-pass processing roughly doubles processing time but significantly improves quality
- Advanced features (ETF/FDoG, flow tracing) add 20-50% processing time

### **Image Type Recommendations**

- **Photos**: Edge backend with noise filtering and medium detail
- **Line Art**: Centerline backend with adaptive threshold
- **Logos**: Centerline backend with high precision, no hand-drawn effects
- **Artistic Images**: Dots backend with color preservation
- **High Contrast**: Superpixel backend with moderate region count

### **Common Parameter Combinations**

- **Clean Vector Conversion**: Edge backend, detail 0.3, no hand-drawn, multipass off
- **Artistic Line Art**: Edge backend, detail 0.4, hand-drawn medium, multipass on
- **Technical Drawings**: Centerline backend, detail 0.3, adaptive threshold, width modulation off
- **Fine Stippling**: Dots backend, density 0.1, small size range (0.3-1.5), preserve colors
- **Bold Pointillism**: Dots backend, density 0.3, large size range (2.0-6.0), preserve colors

### **Accessibility Considerations**

- Provide visual previews for sliders when possible
- Use descriptive labels and tooltips for technical parameters
- Group related parameters logically
- Offer presets for users who don't want to adjust individual parameters
- Implement real-time preview updates for immediate feedback

This comprehensive parameter reference should provide everything needed to implement a full-featured UI for the vec2art conversion algorithms.
