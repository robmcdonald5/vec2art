# Vec2Art Converter Settings Test Matrix

## Overview
This document provides a comprehensive list of all settings available in the Vec2Art converter interface, their UI locations, parameter ranges, and how they map to the underlying WASM module. This serves as a testing checklist to ensure all settings are properly connected and functional.

## Implementation Status Review (2025-08-20)
After reviewing the WASM module implementation (`vectorize-wasm/src/lib.rs`) and core algorithms, the following findings were discovered:

### ✅ FULLY IMPLEMENTED SETTINGS
The following settings have complete WASM bindings and are working:
- All backend selections (edge, centerline, superpixel, dots)
- Core parameters: detail, stroke_width, multipass, noise_filtering
- Directional processing: reverse_pass, diagonal_pass
- Hand-drawn effects: hand_drawn_preset, custom_tremor, custom_variable_weights, custom_tapering
- Advanced edge: enable_etf_fdog, enable_flow_tracing, enable_bezier_fitting
- Dots backend: all parameters working
- Centerline backend: all parameters working
- Superpixel backend: all parameters working
- Performance: max_processing_time_ms, thread_count

### ⚠️ MISSING WASM BINDINGS
The following UI settings exist but lack WASM setter functions:
1. **`set_conservative_detail()`** - Parameter exists in ConfigBuilder but no WASM binding
2. **`set_aggressive_detail()`** - Parameter exists in ConfigBuilder but no WASM binding
3. **`set_directional_strength_threshold()`** - Parameter exists in ConfigBuilder but no WASM binding
4. **`set_optimize_svg()`** - Not implemented in core or WASM
5. **`set_include_metadata()`** - Not implemented in core or WASM
6. **`set_line_width()`** - UI uses this name but WASM expects `set_stroke_width()`

### 🔧 NAMING INCONSISTENCIES
1. **Line Width vs Stroke Width**: UI displays "Line Width" but internally uses `stroke_width`
2. **Tapering**: Called `set_custom_tapering()` in WASM, not `set_tapering()`
3. **Dot Density**: Maps to `set_dot_density()` but UI uses `dot_density_threshold`

### 🐛 LOGIC ISSUES TO FIX
1. **Conservative/Aggressive Detail**: These parameters are defined but never exposed through WASM
2. **Directional Threshold**: The parameter exists but has no setter function
3. **SVG Optimization**: UI has toggle but no backend implementation
4. **Metadata Inclusion**: UI has toggle but no backend implementation

## Quick Settings Panel

### 1. Algorithm Selection
- **UI Location**: Quick Settings > Algorithm dropdown
- **Options**: 
  - `edge` - Advanced edge detection with Canny algorithm
  - `centerline` - Zhang-Suen skeleton-based tracing
  - `superpixel` - SLIC region-based approach
  - `dots` - Adaptive stippling with content-aware placement
- **WASM Parameter**: `set_backend(backend: string)`
- **Default**: `edge`
- **Test Cases**:
  - [ ] Switch between all 4 algorithms
  - [ ] Verify backend-specific controls appear/disappear
  - [ ] Check preview updates with algorithm change

### 2. Style Preset
- **UI Location**: Quick Settings > Style Preset dropdown
- **Options**:
  - `sketch` - Edge backend with medium detail and hand-drawn style
  - `technical` - Centerline backend with precise extraction
  - `artistic` - Dots backend with colorful stippling
  - `poster` - Superpixel backend with bold regions
  - `comic` - Edge backend with strong hand-drawn effects
  - `custom` - User-defined settings
- **WASM Parameter**: `use_preset(preset: string)` + individual parameter overrides
- **Default**: `custom`
- **Test Cases**:
  - [ ] Select each preset and verify config changes
  - [ ] Verify preset switches backend automatically
  - [ ] Check that modifying any parameter switches to "custom"

### 3. Detail Level
- **UI Location**: Quick Settings > Detail Level slider
- **Range**: 1-10 (UI) → 0.1-1.0 (internal)
- **WASM Parameter**: `set_detail(value: number)`
- **Default**: 6 (UI) → 0.6 (internal)
- **Test Cases**:
  - [ ] Drag slider from min to max
  - [ ] Verify value display updates
  - [ ] Check preview responds to changes

### 4. Line Width
- **UI Location**: Quick Settings > Line Width slider
- **Range**: 0.5-5.0 px
- **WASM Parameter**: `set_stroke_width(value: number)`
- **Default**: 2.0 px
- **Note**: UI displays as `line_width` but maps to `stroke_width` internally
- **Test Cases**:
  - [ ] Adjust from thin to thick
  - [ ] Verify pixel value display
  - [ ] Check line thickness in preview

## Advanced Settings Panel

### Performance Configuration

#### 5. Performance Mode
- **UI Location**: Advanced Settings > Performance > Performance Mode buttons
- **Options**:
  - `economy` - Minimal CPU usage (2-4 threads)
  - `balanced` - Optimal speed/resource balance (4-8 threads)
  - `performance` - Maximum speed (8-12 threads)
  - `custom` - Manual thread count selection
- **WASM Parameter**: Thread pool configuration via `initThreadPool(count)`
- **Default**: `balanced`
- **Test Cases**:
  - [ ] Select each performance mode
  - [ ] Verify thread count updates
  - [ ] Check custom mode enables thread slider
  - [ ] Monitor actual thread usage during processing

#### 6. Custom Thread Count
- **UI Location**: Advanced Settings > Performance > Thread Configuration (when custom mode)
- **Range**: 1 to navigator.hardwareConcurrency (system cores)
- **WASM Parameter**: `resizeThreadPool(count)` or reinit
- **Default**: 4-8 depending on system
- **Test Cases**:
  - [ ] Only visible in custom mode
  - [ ] Slider range matches system capabilities
  - [ ] Thread count persists across conversions

### Parameter Panel (Algorithm-Agnostic)

#### 7. Detail Level (Advanced)
- **UI Location**: Advanced Settings > Parameter Panel > Detail Level
- **Range**: 1-10 (UI) → 0.1-1.0 (internal)
- **WASM Parameter**: `set_detail(value: number)`
- **Note**: Duplicates Quick Settings control for convenience
- **Test Cases**:
  - [ ] Syncs with Quick Settings slider
  - [ ] Both controls update same value

#### 8. Stroke Width (Advanced)
- **UI Location**: Advanced Settings > Parameter Panel > Stroke Width
- **Range**: 0.5-5.0 px
- **WASM Parameter**: `set_stroke_width(value: number)`
- **Note**: Duplicates Quick Settings control
- **Test Cases**:
  - [ ] Syncs with Quick Settings slider
  - [ ] Displays as stroke_width (not line_width)

#### 9. Smoothness (Edge Backend Only)
- **UI Location**: Advanced Settings > Parameter Panel > Smoothness
- **Range**: 1-10 (UI) → inverted to roughness internally
- **WASM Parameters**: 
  - `set_custom_tremor(strength)` - maps to (10-smoothness)/9 * 0.5
  - `set_custom_variable_weights(weight)` - maps to (10-smoothness)/9
- **Default**: 5 (UI)
- **Test Cases**:
  - [ ] Only visible for edge backend
  - [ ] High smoothness = low tremor/weights
  - [ ] Low smoothness = high tremor/weights

#### 10. Hand-drawn Style (Edge Backend Only)
- **UI Location**: Advanced Settings > Parameter Panel > Hand-drawn Style dropdown
- **Options**: `none`, `subtle`, `medium`, `strong`, `sketchy`
- **WASM Parameter**: `set_hand_drawn_preset(preset: string)`
- **Default**: `medium`
- **Test Cases**:
  - [ ] Only visible for edge backend
  - [ ] Each preset produces different line character
  - [ ] Interacts correctly with smoothness setting

#### 11. Noise Filtering
- **UI Location**: Advanced Settings > Parameter Panel > Noise Filtering checkbox
- **WASM Parameter**: `set_noise_filtering(enabled: boolean)`
- **Default**: `true`
- **Test Cases**:
  - [ ] Available for all backends
  - [ ] Toggle on/off affects output quality

### Backend-Specific Controls

#### Dots Backend Controls

##### 12. Dot Density
- **UI Location**: Advanced Settings > Parameter Panel > Stippling Controls > Dot Density
- **Range**: 1-10 (UI) → 0.15-0.05 (internal, inverted)
- **WASM Parameter**: `set_dot_density(threshold: number)`
- **Default**: 5 (UI) → 0.10 (internal)
- **Test Cases**:
  - [ ] Only visible for dots backend
  - [ ] Higher UI value = denser dots
  - [ ] Range properly inverted to threshold

##### 13. Preserve Colors
- **UI Location**: Advanced Settings > Parameter Panel > Stippling Controls > Preserve Colors
- **WASM Parameter**: `set_preserve_colors(enabled: boolean)`
- **Default**: `true`
- **Test Cases**:
  - [ ] Only visible for dots backend
  - [ ] Toggle between colored and monochrome dots

#### Superpixel Backend Controls

##### 14. Region Complexity
- **UI Location**: Advanced Settings > Parameter Panel > Region Controls > Region Complexity
- **Range**: 1-10 (UI) → 50-500 (internal)
- **WASM Parameter**: `set_num_superpixels(count: number)`
- **Default**: 3 (UI) → 185 (internal)
- **Test Cases**:
  - [ ] Only visible for superpixel backend
  - [ ] Higher value = more regions
  - [ ] Mapping: UI * 45 + 50

##### 15. Fill Regions
- **UI Location**: Advanced Settings > Parameter Panel > Region Controls > Fill Regions
- **WASM Parameter**: `set_fill_regions(enabled: boolean)`
- **Default**: `true`
- **Test Cases**:
  - [ ] Only visible for superpixel backend
  - [ ] Toggle between filled and outline-only

#### Centerline Backend Controls

##### 16. Adaptive Threshold
- **UI Location**: Advanced Settings > Parameter Panel > Precision Controls > Adaptive Threshold
- **WASM Parameter**: `set_enable_adaptive_threshold(enabled: boolean)`
- **Default**: `true`
- **Test Cases**:
  - [ ] Only visible for centerline backend
  - [ ] Affects extraction quality with varying lighting

### Advanced Controls Panel

#### Multi-pass Processing

##### 17. Enable Multi-pass
- **UI Location**: Advanced Settings > Advanced Controls > Multi-pass Processing
- **WASM Parameter**: `set_multipass(enabled: boolean)`
- **Default**: `true`
- **Test Cases**:
  - [ ] Available for all backends
  - [ ] Enables conservative detail slider when on
  - [ ] Roughly doubles processing time

##### 18. Conservative Detail
- **UI Location**: Advanced Settings > Advanced Controls > Multi-pass > Conservative Detail
- **Range**: 0.0-1.0
- **WASM Parameter**: `set_conservative_detail(value: number)`
- **Default**: Uses main detail level
- **Test Cases**:
  - [ ] Only visible when multipass enabled
  - [ ] Affects first pass threshold

#### Directional Processing (Edge Backend Only)

##### 19. Enable Reverse Pass
- **UI Location**: Advanced Settings > Advanced Controls > Directional Processing > Reverse Pass
- **WASM Parameter**: `set_reverse_pass(enabled: boolean)`
- **Default**: `false`
- **Test Cases**:
  - [ ] Only visible for edge backend
  - [ ] Processes right-to-left, bottom-to-top
  - [ ] Enables strength threshold when on

##### 20. Enable Diagonal Pass
- **UI Location**: Advanced Settings > Advanced Controls > Directional Processing > Diagonal Pass
- **WASM Parameter**: `set_diagonal_pass(enabled: boolean)`
- **Default**: `false`
- **Test Cases**:
  - [ ] Only visible for edge backend
  - [ ] Processes diagonally
  - [ ] Enables strength threshold when on

##### 21. Directional Strength Threshold
- **UI Location**: Advanced Settings > Advanced Controls > Directional > Strength Threshold
- **Range**: 0.0-1.0
- **WASM Parameter**: `set_directional_strength_threshold(value: number)`
- **Default**: 0.3
- **Test Cases**:
  - [ ] Only visible when reverse or diagonal pass enabled
  - [ ] 0.0 = always run, 1.0 = never run

#### Artistic Effects (Edge Backend Only)

##### 22. Variable Line Weights
- **UI Location**: Advanced Settings > Advanced Controls > Artistic Effects > Variable Line Weights
- **Range**: 0.0-1.0
- **WASM Parameter**: `set_custom_variable_weights(value: number)`
- **Default**: 0.0
- **Test Cases**:
  - [ ] Only visible for edge backend
  - [ ] Creates dynamic line thickness variation

##### 23. Tremor Strength
- **UI Location**: Advanced Settings > Advanced Controls > Artistic Effects > Tremor Strength
- **Range**: 0.0-0.5
- **WASM Parameter**: `set_custom_tremor(value: number)`
- **Default**: 0.0
- **Test Cases**:
  - [ ] Only visible for edge backend
  - [ ] Adds organic line jitter

##### 24. Line Tapering
- **UI Location**: Advanced Settings > Advanced Controls > Artistic Effects > Line Tapering
- **Range**: 0.0-1.0
- **WASM Parameter**: `set_tapering(value: number)`
- **Default**: 0.0
- **Test Cases**:
  - [ ] Only visible for edge backend
  - [ ] Tapers line endpoints

#### Advanced Edge Detection (Edge Backend Only)

##### 25. Enable ETF/FDoG Processing
- **UI Location**: Advanced Settings > Advanced Controls > Advanced Edge Detection > ETF/FDoG
- **WASM Parameter**: `set_enable_etf_fdog(enabled: boolean)`
- **Default**: `false`
- **Note**: Auto-enables flow tracing when turned on
- **Test Cases**:
  - [ ] Only visible for edge backend
  - [ ] Improves coherent edge detection
  - [ ] Increases processing time 20-50%

##### 26. Enable Flow-Guided Tracing
- **UI Location**: Advanced Settings > Advanced Controls > Advanced Edge Detection > Flow Tracing
- **WASM Parameter**: `set_enable_flow_tracing(enabled: boolean)`
- **Default**: `false`
- **Test Cases**:
  - [ ] Only visible for edge backend
  - [ ] Creates smoother, more coherent paths
  - [ ] Required for ETF/FDoG and Bezier fitting

#### Advanced Dots Controls (Dots Backend Only)

##### 27. Adaptive Dot Sizing
- **UI Location**: Advanced Settings > Advanced Controls > Advanced Stippling > Adaptive Sizing
- **WASM Parameter**: `set_adaptive_sizing(enabled: boolean)`
- **Default**: `true`
- **Test Cases**:
  - [ ] Only visible for dots backend
  - [ ] Varies dot size based on image variance

##### 28. Poisson Disk Sampling
- **UI Location**: Advanced Settings > Advanced Controls > Advanced Stippling > Poisson Disk
- **WASM Parameter**: `set_poisson_disk_sampling(enabled: boolean)`
- **Default**: `false`
- **Test Cases**:
  - [ ] Only visible for dots backend
  - [ ] Even distribution vs random placement

#### Advanced Superpixel Controls (Superpixel Backend Only)

##### 29. Region Shape (Compactness)
- **UI Location**: Advanced Settings > Advanced Controls > Advanced Regions > Region Shape
- **Range**: 5-30
- **WASM Parameter**: `set_compactness(value: number)`
- **Default**: 20
- **Test Cases**:
  - [ ] Only visible for superpixel backend
  - [ ] 5 = irregular/accurate, 30 = regular/smooth

##### 30. Simplify Boundaries
- **UI Location**: Advanced Settings > Advanced Controls > Advanced Regions > Simplify Boundaries
- **WASM Parameter**: `set_simplify_boundaries(enabled: boolean)`
- **Default**: `true`
- **Test Cases**:
  - [ ] Only visible for superpixel backend
  - [ ] Smooths region edges

#### Performance & Output Settings

##### 31. Optimize SVG Output
- **UI Location**: Advanced Settings > Advanced Controls > Performance & Output > Optimize SVG
- **WASM Parameter**: `set_optimize_svg(enabled: boolean)`
- **Default**: `true`
- **Test Cases**:
  - [ ] Available for all backends
  - [ ] Reduces file size

##### 32. Include Processing Metadata
- **UI Location**: Advanced Settings > Advanced Controls > Performance & Output > Include Metadata
- **WASM Parameter**: `set_include_metadata(enabled: boolean)`
- **Default**: `false`
- **Test Cases**:
  - [ ] Available for all backends
  - [ ] Embeds settings in SVG

##### 33. Max Processing Time
- **UI Location**: Advanced Settings > Advanced Controls > Performance & Output > Max Processing Time
- **Range**: 5-120 seconds (5000-120000 ms)
- **WASM Parameter**: `set_max_processing_time_ms(value: number)`
- **Default**: 30 seconds (30000 ms)
- **Test Cases**:
  - [ ] Available for all backends
  - [ ] Processing stops at timeout

## UI State Management

### Settings Persistence
- [ ] Settings persist across page refreshes (localStorage)
- [ ] Settings reset when switching presets
- [ ] Custom mode activates when any parameter modified

### Visual Feedback
- [ ] Progressive sliders show fill percentage
- [ ] Active sections highlighted with ring
- [ ] Disabled controls properly grayed out
- [ ] Check marks appear for enabled features

### Responsive Behavior
- [ ] Controls adapt to mobile screens
- [ ] Touch-friendly slider controls
- [ ] Tooltips work on hover/tap

## WASM Integration Points

### Configuration Flow
1. UI Change → `onConfigChange()` callback
2. Config validation in `VectorizerService`
3. Auto-fixes applied (hand-drawn preset, flow tracing)
4. Individual WASM setter calls
5. Processing with configured parameters

### Critical Validation Rules
1. **Hand-drawn effects require preset**: If `variable_weights`, `tremor_strength`, or `tapering` > 0, then `hand_drawn_preset` must not be "none"
2. **ETF/FDoG requires flow tracing**: If `enable_etf_fdog` is true, then `enable_flow_tracing` must be true
3. **Bezier fitting requires flow tracing**: If `enable_bezier_fitting` is true, then `enable_flow_tracing` must be true

### Parameter Mapping Issues to Test
- [ ] `line_width` (UI) → `stroke_width` (WASM)
- [ ] `detail` range conversion: 1-10 (UI) → 0.1-1.0 (internal)
- [ ] `smoothness` inversion to roughness parameters
- [ ] `dot_density` inversion: high UI = low threshold
- [ ] `region_count` scaling: 1-10 → 50-500

## Testing Checklist Summary

### Quick Smoke Test (5 min)
1. [ ] Load an image
2. [ ] Try each algorithm
3. [ ] Try each preset
4. [ ] Adjust detail and line width
5. [ ] Convert and download

### Comprehensive Test (30 min)
1. [ ] Test all Quick Settings controls
2. [ ] Test all Performance modes
3. [ ] Test each backend's specific controls
4. [ ] Test all Advanced Controls sections
5. [ ] Verify parameter persistence
6. [ ] Check responsive design
7. [ ] Validate WASM parameter mapping

### Edge Cases to Test
1. [ ] Switching backends resets backend-specific settings
2. [ ] Preset changes override all custom settings
3. [ ] Thread count limitations on different devices
4. [ ] Processing timeout behavior
5. [ ] Invalid parameter combinations handled gracefully

## Known Issues / Bugs to Verify

1. **Potential Mapping Issues**:
   - Line width vs stroke width naming inconsistency
   - Detail level range conversion accuracy
   - Smoothness to roughness parameter inversion

2. **Backend Availability**:
   - Some WASM functions may not be implemented (`safeCall` wrapper handles this)
   - Centerline and Superpixel backends have limited parameter support

3. **Threading State**:
   - Thread pool initialization may fail on some browsers
   - Fallback to single-threaded mode should work

4. **UI State Bugs**:
   - Settings may not persist correctly
   - Preset switching might not update all controls
   - Custom mode detection might be inconsistent

## Next Steps

### Immediate Fixes Required

#### 1. Add Missing WASM Bindings
Add the following setter functions to `vectorize-wasm/src/lib.rs`:
```rust
// Missing multipass detail controls
#[wasm_bindgen]
pub fn set_conservative_detail(&mut self, detail: f32) -> Result<(), JsValue>
pub fn set_aggressive_detail(&mut self, detail: f32) -> Result<(), JsValue>

// Missing directional threshold
#[wasm_bindgen]
pub fn set_directional_strength_threshold(&mut self, threshold: f32) -> Result<(), JsValue>
```

#### 2. Fix Function Names in VectorizerService
Update `vectorizer-service.ts` to use correct WASM function names:
- Change `safeCall('set_tapering', ...)` to `safeCall('set_custom_tapering', ...)`
- Ensure `line_width` maps to `set_stroke_width()` not a non-existent `set_line_width()`

#### 3. Remove or Implement Missing Features
Either:
- **Option A**: Remove "Optimize SVG Output" and "Include Processing Metadata" toggles from UI
- **Option B**: Implement these features in the Rust core and add WASM bindings

#### 4. Fix Parameter Mappings
Ensure the following mappings are correct:
- `dot_density_threshold` (UI) → `set_dot_density()` (WASM)
- `line_width` (UI) → `set_stroke_width()` (WASM)
- `tapering` (UI) → `set_custom_tapering()` (WASM)

### Testing Plan with Playwright MCP

1. **Quick Smoke Test** (5 min)
   - Load an image
   - Try each algorithm
   - Try each preset
   - Adjust detail and line width
   - Convert and download

2. **Parameter Verification Test** (15 min)
   - Enable console logging in VectorizerService
   - Test each parameter individually
   - Verify WASM setter is called with correct value
   - Check for any "function not found" warnings

3. **Comprehensive Test** (30 min)
   - Test all Quick Settings controls
   - Test all Performance modes
   - Test each backend's specific controls
   - Test all Advanced Controls sections
   - Verify parameter persistence
   - Check responsive design
   - Validate WASM parameter mapping

### Expected Failures
Based on the code review, these tests will likely fail:
1. ❌ Conservative Detail slider (missing WASM binding)
2. ❌ Directional Strength Threshold slider (missing WASM binding)
3. ❌ Optimize SVG toggle (no implementation)
4. ❌ Include Metadata toggle (no implementation)
5. ⚠️ Tapering slider (wrong function name in service)

### Console Warnings to Watch For
When testing, monitor browser console for:
- `[VectorizerService] Function set_conservative_detail not available in WASM module`
- `[VectorizerService] Function set_directional_strength_threshold not available in WASM module`
- `[VectorizerService] Function set_optimize_svg not available in WASM module`
- `[VectorizerService] Function set_include_metadata not available in WASM module`