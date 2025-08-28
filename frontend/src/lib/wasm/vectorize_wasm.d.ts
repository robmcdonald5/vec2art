/* tslint:disable */
/* eslint-disable */
/**
 * Check comprehensive browser capabilities for WebAssembly threading
 *
 * This function performs a detailed analysis of the browser environment to determine
 * if WebAssembly multi-threading is supported and provides diagnostic information
 * about any missing requirements.
 */
export function check_threading_requirements(): WasmCapabilityReport;
/**
 * Get a list of missing requirements for WebAssembly threading
 *
 * Returns an empty array if all requirements are met.
 */
export function get_missing_requirements(): any[];
/**
 * Check if Cross-Origin Isolation is enabled
 *
 * This is a quick check for the most common reason threading doesn't work.
 */
export function is_cross_origin_isolated(): boolean;
/**
 * Check if SharedArrayBuffer is supported and functional
 */
export function is_shared_array_buffer_supported(): boolean;
/**
 * Check if we're running in a Node.js environment
 */
export function is_nodejs_environment(): boolean;
/**
 * Get the detected environment type as a string
 */
export function get_environment_type(): string;
/**
 * Force refresh of capability cache
 *
 * This can be useful if the environment changes during runtime
 * (e.g., headers are modified via service worker)
 */
export function refresh_capability_cache(): void;
/**
 * Get a human-readable summary of threading requirements
 */
export function get_threading_requirements_summary(): string;
/**
 * Provide actionable recommendations for enabling threading
 */
export function get_threading_recommendations(): any[];
/**
 * Initialize the WASM thread pool with the specified number of threads
 *
 * This returns a JavaScript Promise that must be awaited before using parallel functions.
 *
 * # Arguments
 * * `num_threads` - Number of threads to use. If None, uses browser's hardware concurrency
 *
 * # Returns
 * * `JsValue` containing a Promise that resolves when initialization is complete
 *
 * # Safety
 * This function modifies global state and should only be called once during module initialization
 */
export function init_thread_pool(num_threads?: number | null): any;
/**
 * Confirm successful thread pool initialization
 *
 * This should be called by JavaScript when the initThreadPool promise resolves successfully
 */
export function confirm_threading_success(): void;
/**
 * Mark thread pool initialization failure
 *
 * This should be called by JavaScript when the initThreadPool promise rejects
 */
export function mark_threading_failed(): void;
/**
 * Initialize the wasm module with basic setup
 */
export function init(): void;
/**
 * Initialize the thread pool for WASM parallel processing
 * This must be called from JavaScript before using any parallel functions
 */
export function start(): Promise<void>;
/**
 * Get available backends for trace-low algorithm
 */
export function get_available_backends(): any[];
/**
 * Get available presets for configuration
 */
export function get_available_presets(): any[];
/**
 * Get description for a specific preset
 */
export function get_preset_description(preset: string): string;
/**
 * Reset thread pool state to prevent memory corruption in high multipass scenarios
 * Perform complete thread pool reset to prevent memory corruption in high multipass scenarios
 * This performs a complete reset by forcing re-initialization of the wasm-bindgen-rayon thread pool
 */
export function reset_thread_pool(): any;
/**
 * Cleanup and reset thread pool after intensive operations
 * This helps prevent the "every other failure" issue with high pass counts
 */
export function cleanup_after_multipass(): any;
/**
 * Legacy function - use initThreadPool() directly from JavaScript instead
 * This is kept for compatibility but just logs a warning
 */
export function init_threading(_num_threads?: number | null): any;
/**
 * Check if threading is supported and active in the current environment
 *
 * # Returns
 * * `true` if multi-threading is available and working, `false` otherwise
 */
export function is_threading_supported(): boolean;
/**
 * Get the current number of threads available for parallel processing
 *
 * # Returns
 * * Number of threads available (1 if single-threaded)
 */
export function get_thread_count(): number;
/**
 * Get the browser's hardware concurrency (logical processor count)
 *
 * # Returns
 * * Number of logical processors available to the browser
 */
export function get_hardware_concurrency(): number;
/**
 * Get detailed information about the threading environment
 *
 * # Returns
 * * Diagnostic string with threading details
 */
export function get_threading_info(): string;
/**
 * Force single-threaded execution (for debugging or fallback)
 *
 * This disables threading even if it's supported and can be useful
 * for debugging or ensuring consistent behavior across environments
 */
export function force_single_threaded(): void;
/**
 * Function exposed as `initThreadPool` to JS (see the main docs).
 *
 * Normally, you'd invoke this function from JS to initialize the thread pool.
 * However, if you strongly prefer, you can use [wasm-bindgen-futures](https://rustwasm.github.io/wasm-bindgen/reference/js-promises-and-rust-futures.html) to invoke and await this function from Rust.
 *
 * Note that doing so comes with extra initialization and Wasm size overhead for the JS<->Rust Promise integration.
 */
export function initThreadPool(num_threads: number): Promise<any>;
export function wbg_rayon_start_worker(receiver: number): void;
/**
 * Available backends for JavaScript interaction
 */
export enum WasmBackend {
  Edge = 0,
  Centerline = 1,
  Superpixel = 2,
  Dots = 3,
}
/**
 * Available presets for JavaScript interaction
 */
export enum WasmPreset {
  LineArt = 0,
  Sketch = 1,
  Technical = 2,
  DenseStippling = 3,
  Pointillism = 4,
  SparseDots = 5,
  FineStippling = 6,
  BoldArtistic = 7,
}
/**
 * WASM-bindgen wrapper for CapabilityReport with proper getter methods
 */
export class WasmCapabilityReport {
  private constructor();
  free(): void;
  readonly threading_supported: boolean;
  readonly shared_array_buffer: boolean;
  readonly cross_origin_isolated: boolean;
  readonly web_workers: boolean;
  readonly proper_headers: boolean;
  readonly environment_type: string;
  readonly missing_requirements: any[];
  readonly diagnostics: any[];
  readonly is_node_js: boolean;
  readonly atomics_supported: boolean;
}
/**
 * Progress information passed to JavaScript callbacks
 */
export class WasmProgress {
  private constructor();
  free(): void;
  readonly percent: number;
  readonly message: string;
  readonly stage: string;
}
/**
 * WASM-bindgen wrapper for ThreadingError
 */
export class WasmThreadingError {
  private constructor();
  free(): void;
  /**
   * Get error type as string
   */
  readonly error_type: string;
  /**
   * Get error message
   */
  readonly message: string;
  /**
   * Get recovery suggestions
   */
  readonly recovery_suggestions: any[];
  /**
   * Get attempted solutions
   */
  readonly attempted_solutions: any[];
  /**
   * Get environment information as JSON
   */
  readonly environment_info: string;
  /**
   * Check if recovery is possible
   */
  readonly is_recoverable: boolean;
  /**
   * Get expected performance impact (0.0 = no impact, 1.0 = severe impact)
   */
  readonly performance_impact: number;
}
/**
 * Main WebAssembly vectorizer struct wrapping ConfigBuilder
 */
export class WasmVectorizer {
  free(): void;
  /**
   * Create a new WasmVectorizer with default configuration
   */
  constructor();
  /**
   * Apply a preset configuration by name
   * Available presets: "line_art", "sketch", "technical", "dots_dense", "dots_pointillism", "dots_sparse", "dots_fine", "dots_bold"
   */
  use_preset(preset: string): void;
  /**
   * Set the tracing backend: "edge", "centerline", "superpixel", or "dots"
   */
  set_backend(backend: string): void;
  /**
   * Get the current backend
   */
  get_backend(): string;
  /**
   * Set detail level (0.0 = sparse, 1.0 = detailed)
   */
  set_detail(detail: number): void;
  /**
   * Get current detail level
   */
  get_detail(): number;
  /**
   * Set stroke width at 1080p reference resolution
   */
  set_stroke_width(width: number): void;
  /**
   * Get current stroke width
   */
  get_stroke_width(): number;
  /**
   * Enable or disable multipass processing
   */
  set_multipass(enabled: boolean): void;
  /**
   * Get multipass setting
   */
  get_multipass(): boolean;
  /**
   * Set number of processing passes (1-10)
   */
  set_pass_count(count: number): void;
  /**
   * Get number of processing passes
   */
  get_pass_count(): number;
  /**
   * Enable or disable noise filtering
   */
  set_noise_filtering(enabled: boolean): void;
  /**
   * Enable or disable reverse pass
   */
  set_reverse_pass(enabled: boolean): void;
  /**
   * Enable or disable diagonal pass
   */
  set_diagonal_pass(enabled: boolean): void;
  /**
   * Set conservative detail level for first pass in multipass processing
   */
  set_conservative_detail(detail: number): void;
  /**
   * Set aggressive detail level for second pass in multipass processing
   */
  set_aggressive_detail(detail: number): void;
  /**
   * Set directional strength threshold for directional passes
   */
  set_directional_strength_threshold(threshold: number): void;
  /**
   * Set dot density (0.0 = very sparse, 1.0 = very dense)
   */
  set_dot_density(density: number): void;
  /**
   * Set dot size range with minimum and maximum radius
   */
  set_dot_size_range(min_radius: number, max_radius: number): void;
  /**
   * Enable or disable color preservation in dots
   */
  set_preserve_colors(enabled: boolean): void;
  /**
   * Enable or disable color preservation in line tracing (edge/centerline backends)
   */
  set_line_preserve_colors(enabled: boolean): void;
  /**
   * Set color accuracy for line tracing (0.0 = fast, 1.0 = accurate)
   */
  set_line_color_accuracy(accuracy: number): void;
  /**
   * Set maximum colors per path segment for line tracing
   */
  set_max_colors_per_path(max_colors: number): void;
  /**
   * Set color tolerance for clustering (0.0-1.0)
   */
  set_color_tolerance(tolerance: number): void;
  /**
   * Enable or disable adaptive dot sizing
   */
  set_adaptive_sizing(enabled: boolean): void;
  /**
   * Enable or disable Poisson disk sampling for natural dot distribution
   */
  set_poisson_disk_sampling(enabled: boolean): void;
  /**
   * Enable or disable gradient-based sizing for dot scaling based on local image gradients
   */
  set_gradient_based_sizing(enabled: boolean): void;
  /**
   * Set background tolerance for automatic background detection
   */
  set_background_tolerance(tolerance: number): void;
  /**
   * Enable or disable background removal preprocessing
   */
  enable_background_removal(enabled: boolean): void;
  /**
   * Set background removal strength (0.0-1.0)
   */
  set_background_removal_strength(strength: number): void;
  /**
   * Set background removal algorithm: "otsu", "adaptive", or "auto"
   */
  set_background_removal_algorithm(algorithm: string): void;
  /**
   * Set background removal threshold override (0-255)
   */
  set_background_removal_threshold(threshold?: number | null): void;
  /**
   * Set hand-drawn preset: "none", "subtle", "medium", "strong", or "sketchy"
   */
  set_hand_drawn_preset(preset: string): void;
  /**
   * Set custom tremor strength (overrides preset)
   */
  set_custom_tremor(tremor: number): void;
  /**
   * Set custom variable weights (overrides preset)
   */
  set_custom_variable_weights(weights: number): void;
  /**
   * Set custom tapering strength (overrides preset)
   */
  set_custom_tapering(tapering: number): void;
  /**
   * Enable ETF/FDoG advanced edge detection
   */
  set_enable_etf_fdog(enabled: boolean): void;
  /**
   * Enable flow-guided tracing (requires ETF/FDoG)
   */
  set_enable_flow_tracing(enabled: boolean): void;
  /**
   * Enable Bézier curve fitting (requires flow tracing)
   */
  set_enable_bezier_fitting(enabled: boolean): void;
  /**
   * Set maximum processing time in milliseconds
   */
  set_max_processing_time_ms(time_ms: bigint): void;
  /**
   * Set spatial sigma for bilateral noise filtering (0.5-5.0, higher = more smoothing)
   */
  set_noise_filter_spatial_sigma(sigma: number): void;
  /**
   * Set range sigma for bilateral noise filtering (10.0-100.0, higher = less edge preservation)
   */
  set_noise_filter_range_sigma(sigma: number): void;
  /**
   * Enable or disable adaptive thresholding for centerline backend
   */
  set_enable_adaptive_threshold(enabled: boolean): void;
  /**
   * Set window size for adaptive thresholding (15-50 pixels)
   */
  set_window_size(size: number): void;
  /**
   * Set sensitivity parameter k for Sauvola thresholding (0.1-1.0)
   */
  set_sensitivity_k(k: number): void;
  /**
   * Set minimum branch length for centerline tracing (4-24 pixels)
   */
  set_min_branch_length(length: number): void;
  /**
   * Set Douglas-Peucker epsilon for path simplification (0.5-3.0)
   */
  set_douglas_peucker_epsilon(epsilon: number): void;
  /**
   * Enable or disable width modulation for centerline SVG strokes
   */
  set_enable_width_modulation(enabled: boolean): void;
  /**
   * Enable or disable Distance Transform-based centerline algorithm (default: false)
   * When enabled, uses the high-performance Distance Transform algorithm instead of traditional skeleton thinning
   * This provides 5-10x performance improvement with better quality results
   */
  set_enable_distance_transform_centerline(enabled: boolean): void;
  /**
   * Set number of superpixels to generate (20-1000)
   */
  set_num_superpixels(num: number): void;
  /**
   * Set SLIC compactness parameter (1.0-50.0)
   * Higher values create more regular shapes, lower values follow color similarity more closely
   */
  set_compactness(compactness: number): void;
  /**
   * Set SLIC iterations for convergence (5-15)
   */
  set_slic_iterations(iterations: number): void;
  /**
   * Set superpixel initialization pattern: "square", "hexagonal", or "poisson"
   */
  set_initialization_pattern(pattern: string): void;
  /**
   * Enable or disable filled superpixel regions
   */
  set_fill_regions(enabled: boolean): void;
  /**
   * Enable or disable superpixel region boundary strokes
   */
  set_stroke_regions(enabled: boolean): void;
  /**
   * Enable or disable color preservation in superpixel regions
   */
  set_superpixel_preserve_colors(enabled: boolean): void;
  /**
   * Enable or disable boundary path simplification
   */
  set_simplify_boundaries(enabled: boolean): void;
  /**
   * Set boundary simplification tolerance (0.5-3.0)
   */
  set_boundary_epsilon(epsilon: number): void;
  /**
   * Set maximum image size before automatic resizing (512-8192 pixels)
   * Images larger than this will be automatically resized to prevent memory/timeout issues
   */
  set_max_image_size(size: number): void;
  /**
   * Get current maximum image size setting
   */
  get_max_image_size(): number;
  /**
   * Set SVG coordinate precision in decimal places (0-4)
   * Higher precision = larger file size but better quality. 0 = integers only.
   */
  set_svg_precision(precision: number): void;
  /**
   * Get current SVG precision setting
   */
  get_svg_precision(): number;
  /**
   * Enable or disable SVG output optimization (NOT YET IMPLEMENTED)
   * This is a placeholder for future implementation
   */
  set_optimize_svg(_enabled: boolean): void;
  /**
   * Enable or disable metadata inclusion in SVG output (NOT YET IMPLEMENTED)
   * This is a placeholder for future implementation
   */
  set_include_metadata(_enabled: boolean): void;
  /**
   * Set the thread count for this vectorizer instance
   * Note: Thread pool must be initialized from JavaScript using initThreadPool()
   */
  set_thread_count(thread_count?: number | null): void;
  /**
   * Get the current thread count for this vectorizer
   */
  get_thread_count(): number;
  /**
   * Validate current configuration
   */
  validate_config(): void;
  /**
   * Vectorize an image with the current configuration
   */
  vectorize(image_data: ImageData): string;
  /**
   * Vectorize an image with progress callbacks
   */
  vectorize_with_progress(image_data: ImageData, callback?: Function | null): string;
  /**
   * Export current configuration as JSON string
   */
  export_config(): string;
  /**
   * Import configuration from JSON string
   */
  import_config(json: string): void;
}
export class wbg_rayon_PoolBuilder {
  private constructor();
  free(): void;
  numThreads(): number;
  receiver(): number;
  build(): void;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly _ZN4core3fmt9Formatter9write_str17h932d0930c4ad7d8eE: (a: number, b: number, c: number) => number;
  readonly _ZN10serde_json5error5Error6syntax17h2a258a7a176bf02aE: (a: number, b: number, c: number) => number;
  readonly _ZN10serde_json2de12ParserNumber12invalid_type17h67a391251abb5327E: (a: number, b: number, c: number) => number;
  readonly _RNvCsihszUHWOIem_7___rustc35___rust_no_alloc_shim_is_unstable_v2: () => void;
  readonly _ZN20wasm_bindgen_futures4task11multithread4Task5spawn17h1d725e6495f92ca2E: (a: number, b: number) => void;
  readonly _ZN12wasm_bindgen9throw_str17h6d4ad651ebd09ea3E: (a: number, b: number) => void;
  readonly _ZN5alloc5alloc18handle_alloc_error17hf70105a0c42a0dd4E: (a: number, b: number) => void;
  readonly _ZN7web_sys6window17hc2180cfb2f6dc4e6E: (a: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window9navigator17ha2d6c49e724089eaE: (a: number) => number;
  readonly _ZN7web_sys8features13gen_Navigator9Navigator20hardware_concurrency17h063edb2e652240c9E: (a: number) => number;
  readonly _ZN4core9panicking11panic_const28panic_const_async_fn_resumed17h75f6db5d0f1d2c79E: (a: number) => void;
  readonly _ZN3log13__private_api3loc17h703b27f6bb7c0615E: (a: number) => number;
  readonly _ZN18wasm_bindgen_rayon16init_thread_pool17h3fc5e98a93b26b43E: (a: number) => number;
  readonly _ZN5alloc3fmt6format12format_inner17habfac04d281bd51bE: (a: number, b: number) => void;
  readonly _ZN6js_sys8Function5call117h67e42dc3513dd88bE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys4Date3now17hf2638de2a21ab902E: () => number;
  readonly _ZN3std3sys4sync4once5futex4Once4call17h4b4834d523028c7fE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN3std3sys4sync5mutex5futex5Mutex14lock_contended17h204338f26049a66fE: (a: number) => void;
  readonly _ZN3std3sys4sync5mutex5futex5Mutex4wake17ha26fb44b183fe9e8E: (a: number) => void;
  readonly _ZN4core6option13unwrap_failed17h7133f3b8ad3376bdE: (a: number) => void;
  readonly _ZN3std9panicking8set_hook17h25a14f0d444c7f33E: (a: number, b: number) => void;
  readonly _ZN4core3fmt5write17hf3dbeaa21c9e46a1E: (a: number, b: number, c: number) => number;
  readonly _ZN24console_error_panic_hook4hook17h902e2bf8c43d2d16E: (a: number) => void;
  readonly _ZN5alloc7raw_vec12handle_error17h7f4b2a30dbb79ac6E: (a: number, b: number, c: number) => void;
  readonly _ZN4core6option13expect_failed17hfa664a15d2e9a65eE: (a: number, b: number, c: number) => void;
  readonly _ZN4core9panicking9panic_fmt17hc7c5a037bbc4396cE: (a: number, b: number) => void;
  readonly _ZN10serde_json5error10make_error17hc64b9d8e9dc97408E: (a: number) => number;
  readonly _ZN4core3fmt9Formatter25debug_tuple_field1_finish17hc8c085dab670456aE: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly _ZN3ryu6pretty8format3217he566f4d871da3489E: (a: number, b: number) => number;
  readonly _ZN4core3fmt9Formatter26debug_struct_fields_finish17h6b98c7cdd5adbcf3E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
  readonly __wbg_wasmcapabilityreport_free: (a: number, b: number) => void;
  readonly _ZN12wasm_bindgen4__rt10throw_null17h51a8c58d33b5fef2E: () => void;
  readonly wasmcapabilityreport_threading_supported: (a: number) => number;
  readonly _ZN12wasm_bindgen4__rt11borrow_fail17h4cad8814100317c8E: () => void;
  readonly wasmcapabilityreport_shared_array_buffer: (a: number) => number;
  readonly wasmcapabilityreport_cross_origin_isolated: (a: number) => number;
  readonly wasmcapabilityreport_web_workers: (a: number) => number;
  readonly wasmcapabilityreport_proper_headers: (a: number) => number;
  readonly wasmcapabilityreport_environment_type: (a: number) => [number, number];
  readonly wasmcapabilityreport_missing_requirements: (a: number) => [number, number];
  readonly wasmcapabilityreport_diagnostics: (a: number) => [number, number];
  readonly wasmcapabilityreport_is_node_js: (a: number) => number;
  readonly wasmcapabilityreport_atomics_supported: (a: number) => number;
  readonly _ZN12wasm_bindgen4__rt19link_mem_intrinsics17hf993705fd8f0050fE: () => void;
  readonly _ZN6js_sys17SharedArrayBuffer3new17hfde9a360d085a0e7E: (a: number) => number;
  readonly check_threading_requirements: () => number;
  readonly get_missing_requirements: () => [number, number];
  readonly is_cross_origin_isolated: () => number;
  readonly is_shared_array_buffer_supported: () => number;
  readonly is_nodejs_environment: () => number;
  readonly get_environment_type: () => [number, number];
  readonly refresh_capability_cache: () => void;
  readonly get_threading_requirements_summary: () => [number, number];
  readonly get_threading_recommendations: () => [number, number];
  readonly __wbg_wasmthreadingerror_free: (a: number, b: number) => void;
  readonly wasmthreadingerror_error_type: (a: number) => [number, number];
  readonly wasmthreadingerror_message: (a: number) => [number, number];
  readonly wasmthreadingerror_recovery_suggestions: (a: number) => [number, number];
  readonly wasmthreadingerror_attempted_solutions: (a: number) => [number, number];
  readonly wasmthreadingerror_environment_info: (a: number) => [number, number, number, number];
  readonly _ZN4core6result13unwrap_failed17h6a1a21cb3f58f69dE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly wasmthreadingerror_is_recoverable: (a: number) => number;
  readonly wasmthreadingerror_performance_impact: (a: number) => number;
  readonly init_thread_pool: (a: number) => any;
  readonly confirm_threading_success: () => void;
  readonly mark_threading_failed: () => void;
  readonly init: () => void;
  readonly _ZN3log10set_logger17h9ff39ec5a8b630bdE: (a: number, b: number) => number;
  readonly _ZN3std3sys6random11unsupported19hashmap_random_keys17h7abee37d30eaeff4E: (a: number) => void;
  readonly start: () => any;
  readonly _ZN6js_sys7Promise3new17haa7569aba5b25b24E: (a: number, b: number) => number;
  readonly __wbg_wasmprogress_free: (a: number, b: number) => void;
  readonly _ZN18serde_wasm_bindgen16static_str_to_js17h32493e727cf61ddbE: (a: number, b: number) => number;
  readonly _ZN18serde_wasm_bindgen9ObjectExt3set17ha669f4d7baa56893E: (a: number, b: number, c: number) => void;
  readonly wasmprogress_percent: (a: number) => number;
  readonly wasmprogress_message: (a: number) => [number, number];
  readonly wasmprogress_stage: (a: number) => [number, number];
  readonly _ZN4core9panicking5panic17hcd0d1d68e119afb1E: (a: number, b: number, c: number) => void;
  readonly __wbg_wasmvectorizer_free: (a: number, b: number) => void;
  readonly wasmvectorizer_new: () => number;
  readonly wasmvectorizer_use_preset: (a: number, b: number, c: number) => [number, number];
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder10for_sketch17hfea2ed3d4cc63ae0E: (a: number) => void;
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder19for_dense_stippling17h495b56119934b7c6E: (a: number) => void;
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder15for_pointillism17h96c903f76c56fd96E: (a: number) => void;
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder17for_bold_artistic17hd66d0c991f3c3e00E: (a: number) => void;
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder15for_sparse_dots17h673c9e7272b10a74E: (a: number) => void;
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder18for_fine_stippling17h5bf829fbc2f1c6caE: (a: number) => void;
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder13for_technical17hd82378c903a5a649E: (a: number) => void;
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder12for_line_art17h078018cf08148629E: (a: number) => void;
  readonly wasmvectorizer_set_backend: (a: number, b: number, c: number) => [number, number];
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder15backend_by_name17h0ac065afa1e8567eE: (a: number, b: number, c: number, d: number) => void;
  readonly wasmvectorizer_get_backend: (a: number) => [number, number];
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder5build17h8acdc648941f597fE: (a: number, b: number) => void;
  readonly wasmvectorizer_set_detail: (a: number, b: number) => [number, number];
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder6detail17h62a0c5ae318484b2E: (a: number, b: number, c: number) => void;
  readonly wasmvectorizer_get_detail: (a: number) => number;
  readonly wasmvectorizer_set_stroke_width: (a: number, b: number) => [number, number];
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder12stroke_width17h47310364ffa752e1E: (a: number, b: number, c: number) => void;
  readonly wasmvectorizer_get_stroke_width: (a: number) => number;
  readonly wasmvectorizer_set_multipass: (a: number, b: number) => void;
  readonly wasmvectorizer_get_multipass: (a: number) => number;
  readonly wasmvectorizer_set_pass_count: (a: number, b: number) => [number, number];
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder10pass_count17ha76193bae2d21f82E: (a: number, b: number, c: number) => void;
  readonly wasmvectorizer_get_pass_count: (a: number) => number;
  readonly wasmvectorizer_set_noise_filtering: (a: number, b: number) => void;
  readonly wasmvectorizer_set_reverse_pass: (a: number, b: number) => void;
  readonly wasmvectorizer_set_diagonal_pass: (a: number, b: number) => void;
  readonly wasmvectorizer_set_conservative_detail: (a: number, b: number) => [number, number];
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder19conservative_detail17h2cb9164408ebb974E: (a: number, b: number, c: number, d: number) => void;
  readonly wasmvectorizer_set_aggressive_detail: (a: number, b: number) => [number, number];
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder17aggressive_detail17hfc34b1ff283d0cdaE: (a: number, b: number, c: number, d: number) => void;
  readonly wasmvectorizer_set_directional_strength_threshold: (a: number, b: number) => [number, number];
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder21directional_threshold17h69b6bb9425e728c6E: (a: number, b: number, c: number) => void;
  readonly wasmvectorizer_set_dot_density: (a: number, b: number) => [number, number];
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder11dot_density17hbf35ba1c4453b962E: (a: number, b: number, c: number) => void;
  readonly wasmvectorizer_set_dot_size_range: (a: number, b: number, c: number) => [number, number];
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder14dot_size_range17hba8141a23edc284eE: (a: number, b: number, c: number, d: number) => void;
  readonly wasmvectorizer_set_preserve_colors: (a: number, b: number) => void;
  readonly wasmvectorizer_set_line_preserve_colors: (a: number, b: number) => void;
  readonly wasmvectorizer_set_line_color_accuracy: (a: number, b: number) => [number, number];
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder19line_color_accuracy17h53c1ec4ef3c5d791E: (a: number, b: number, c: number) => void;
  readonly wasmvectorizer_set_max_colors_per_path: (a: number, b: number) => [number, number];
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder19max_colors_per_path17h4dce558850debb27E: (a: number, b: number, c: number) => void;
  readonly wasmvectorizer_set_color_tolerance: (a: number, b: number) => [number, number];
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder15color_tolerance17h0f3803f430e1ff13E: (a: number, b: number, c: number) => void;
  readonly wasmvectorizer_set_adaptive_sizing: (a: number, b: number) => void;
  readonly wasmvectorizer_set_poisson_disk_sampling: (a: number, b: number) => void;
  readonly wasmvectorizer_set_gradient_based_sizing: (a: number, b: number) => void;
  readonly wasmvectorizer_set_background_tolerance: (a: number, b: number) => [number, number];
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder20background_tolerance17h481803f892f5d51dE: (a: number, b: number, c: number) => void;
  readonly wasmvectorizer_enable_background_removal: (a: number, b: number) => void;
  readonly wasmvectorizer_set_background_removal_strength: (a: number, b: number) => [number, number];
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder27background_removal_strength17haaa38534dcf65423E: (a: number, b: number, c: number) => void;
  readonly wasmvectorizer_set_background_removal_algorithm: (a: number, b: number, c: number) => [number, number];
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder36background_removal_algorithm_by_name17h20798272089dec47E: (a: number, b: number, c: number, d: number) => void;
  readonly wasmvectorizer_set_background_removal_threshold: (a: number, b: number) => void;
  readonly wasmvectorizer_set_hand_drawn_preset: (a: number, b: number, c: number) => [number, number];
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder17hand_drawn_preset17h299f443d79eb784aE: (a: number, b: number, c: number, d: number) => void;
  readonly wasmvectorizer_set_custom_tremor: (a: number, b: number) => [number, number];
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder13custom_tremor17h7ed6e5ab627cd732E: (a: number, b: number, c: number) => void;
  readonly wasmvectorizer_set_custom_variable_weights: (a: number, b: number) => [number, number];
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder23custom_variable_weights17h8fafbefa8208400aE: (a: number, b: number, c: number) => void;
  readonly wasmvectorizer_set_custom_tapering: (a: number, b: number) => [number, number];
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder15custom_tapering17hb8cfcbb7118d5894E: (a: number, b: number, c: number) => void;
  readonly wasmvectorizer_set_enable_etf_fdog: (a: number, b: number) => void;
  readonly wasmvectorizer_set_enable_flow_tracing: (a: number, b: number) => void;
  readonly wasmvectorizer_set_enable_bezier_fitting: (a: number, b: number) => void;
  readonly wasmvectorizer_set_max_processing_time_ms: (a: number, b: bigint) => [number, number];
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder22max_processing_time_ms17h25ec99a8c87a0891E: (a: number, b: number, c: bigint) => void;
  readonly wasmvectorizer_set_noise_filter_spatial_sigma: (a: number, b: number) => [number, number];
  readonly wasmvectorizer_set_noise_filter_range_sigma: (a: number, b: number) => [number, number];
  readonly wasmvectorizer_set_enable_adaptive_threshold: (a: number, b: number) => void;
  readonly wasmvectorizer_set_window_size: (a: number, b: number) => [number, number];
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder11window_size17hb9ba829623a38827E: (a: number, b: number, c: number) => void;
  readonly wasmvectorizer_set_sensitivity_k: (a: number, b: number) => [number, number];
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder13sensitivity_k17h3e8ec826cbdae3b0E: (a: number, b: number, c: number) => void;
  readonly wasmvectorizer_set_min_branch_length: (a: number, b: number) => [number, number];
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder17min_branch_length17hdad668e096f13e81E: (a: number, b: number, c: number) => void;
  readonly wasmvectorizer_set_douglas_peucker_epsilon: (a: number, b: number) => [number, number];
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder23douglas_peucker_epsilon17h719e05d5d424b5cfE: (a: number, b: number, c: number) => void;
  readonly wasmvectorizer_set_enable_width_modulation: (a: number, b: number) => void;
  readonly wasmvectorizer_set_enable_distance_transform_centerline: (a: number, b: number) => void;
  readonly wasmvectorizer_set_num_superpixels: (a: number, b: number) => [number, number];
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder15num_superpixels17h2a329c889a507df5E: (a: number, b: number, c: number) => void;
  readonly wasmvectorizer_set_compactness: (a: number, b: number) => [number, number];
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder11compactness17h6d32652ee2d0aff2E: (a: number, b: number, c: number) => void;
  readonly wasmvectorizer_set_slic_iterations: (a: number, b: number) => [number, number];
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder15slic_iterations17hda242c2cafb6d2f1E: (a: number, b: number, c: number) => void;
  readonly wasmvectorizer_set_initialization_pattern: (a: number, b: number, c: number) => [number, number];
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder22initialization_pattern17he97704d443300149E: (a: number, b: number, c: number, d: number) => void;
  readonly wasmvectorizer_set_fill_regions: (a: number, b: number) => void;
  readonly wasmvectorizer_set_stroke_regions: (a: number, b: number) => void;
  readonly wasmvectorizer_set_superpixel_preserve_colors: (a: number, b: number) => void;
  readonly wasmvectorizer_set_simplify_boundaries: (a: number, b: number) => void;
  readonly wasmvectorizer_set_boundary_epsilon: (a: number, b: number) => [number, number];
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder16boundary_epsilon17h609f45ff3c7ee410E: (a: number, b: number, c: number) => void;
  readonly wasmvectorizer_set_max_image_size: (a: number, b: number) => [number, number];
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder14max_image_size17h74bcad998ac03818E: (a: number, b: number, c: number) => void;
  readonly wasmvectorizer_get_max_image_size: (a: number) => number;
  readonly wasmvectorizer_set_svg_precision: (a: number, b: number) => [number, number];
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder13svg_precision17h74ec964d62f55b4fE: (a: number, b: number, c: number) => void;
  readonly wasmvectorizer_get_svg_precision: (a: number) => number;
  readonly wasmvectorizer_set_optimize_svg: (a: number, b: number) => [number, number];
  readonly wasmvectorizer_set_include_metadata: (a: number, b: number) => [number, number];
  readonly wasmvectorizer_set_thread_count: (a: number, b: number) => [number, number];
  readonly wasmvectorizer_get_thread_count: (a: number) => number;
  readonly wasmvectorizer_validate_config: (a: number) => [number, number];
  readonly wasmvectorizer_vectorize: (a: number, b: any) => [number, number, number, number];
  readonly _ZN7web_sys8features13gen_ImageData9ImageData5width17h1f874537144486bbE: (a: number) => number;
  readonly _ZN7web_sys8features13gen_ImageData9ImageData6height17h99ea94a7f22865cdE: (a: number) => number;
  readonly _ZN7web_sys8features13gen_ImageData9ImageData4data17h29a3ee6c1289c9b0E: (a: number, b: number) => void;
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder21build_with_hand_drawn17hdd9cdbf6b7f7329aE: (a: number, b: number) => void;
  readonly _ZN14vectorize_core24vectorize_trace_low_rgba17h00267c346d814f5dE: (a: number, b: number, c: number, d: number) => void;
  readonly wasmvectorizer_vectorize_with_progress: (a: number, b: any, c: number) => [number, number, number, number];
  readonly wasmvectorizer_export_config: (a: number) => [number, number, number, number];
  readonly wasmvectorizer_import_config: (a: number, b: number, c: number) => [number, number];
  readonly get_available_backends: () => [number, number];
  readonly get_available_presets: () => [number, number];
  readonly get_preset_description: (a: number, b: number) => [number, number, number, number];
  readonly reset_thread_pool: () => any;
  readonly cleanup_after_multipass: () => any;
  readonly _ZN6js_sys7Reflect3get17h9f231f3f6515690fE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys8Function5call017he002be47f570c1c1E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys7Promise7resolve17h3c5c2c06e48ac7beE: (a: number) => number;
  readonly init_threading: (a: number) => any;
  readonly is_threading_supported: () => number;
  readonly get_thread_count: () => number;
  readonly get_hardware_concurrency: () => number;
  readonly get_threading_info: () => [number, number];
  readonly force_single_threaded: () => void;
  readonly _RNvCsihszUHWOIem_7___rustc26___rust_alloc_error_handler: (a: number, b: number) => void;
  readonly _RNvCsihszUHWOIem_7___rustc8___rg_oom: (a: number, b: number) => void;
  readonly _RNvCsihszUHWOIem_7___rustc42___rust_alloc_error_handler_should_panic_v2: () => number;
  readonly _ZN18serde_wasm_bindgen2de12convert_pair17hebe5d6d877722c95E: (a: number, b: number) => void;
  readonly _ZN18serde_wasm_bindgen2de12Deserializer17as_object_entries17h831d2ab356fd7b10E: (a: number, b: number) => void;
  readonly _ZN18serde_wasm_bindgen2de12Deserializer10is_nullish17h22e54d459d903940E: (a: number) => number;
  readonly _ZN18serde_wasm_bindgen2de12Deserializer8as_bytes17h6800978fe0f71dcbE: (a: number, b: number) => void;
  readonly _ZN18serde_wasm_bindgen2de12Deserializer13invalid_type_17h6fc8b0865ae7d16eE: (a: number, b: number, c: number) => number;
  readonly _ZN18serde_wasm_bindgen2de12Deserializer15as_safe_integer17h2f4bfc87884c5622E: (a: number, b: number) => void;
  readonly _ZN3std3sys12thread_local11destructors4list8register17hbaf31a7f988cbb13E: (a: number, b: number) => void;
  readonly _ZN9hashbrown3raw11Fallibility9alloc_err17h74fb1a7fb61ccb58E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN9hashbrown3raw11Fallibility17capacity_overflow17ha3dc53e5c84cffb7E: (a: number, b: number) => void;
  readonly _ZN6js_sys5Array3get17hc1df1704f6612de5E: (a: number, b: number) => number;
  readonly _ZN6js_sys6Object7entries17h2994120e28f8b613E: (a: number) => number;
  readonly _ZN6js_sys10Uint8Array6to_vec17h216151696b265bcbE: (a: number, b: number) => void;
  readonly _ZN6js_sys10Uint8Array3new17h022a379bd550b847E: (a: number) => number;
  readonly _ZN6js_sys6Number15is_safe_integer17h237dc184995b0ce8E: (a: number) => number;
  readonly _ZN18serde_wasm_bindgen3ser13MapSerializer3new17h684cb88535a69bc1E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys3Map3new17hc61789bc4f8c6f01E: () => number;
  readonly _ZN6js_sys6Object3new17h02ba89f39fcc1d79E: () => number;
  readonly _ZN18serde_wasm_bindgen3ser16ObjectSerializer3new17hee6d9b5f0c493fdeE: (a: number, b: number) => void;
  readonly _ZN6js_sys8JsString16from_code_point117h1ab9d73b93467990E: (a: number, b: number) => void;
  readonly _ZN6js_sys10Uint8Array4view17hf86c89b758e78899E: (a: number, b: number) => number;
  readonly _ZN6js_sys5Array4from17h5dea1c76cbe9fe1cE: (a: number) => number;
  readonly _ZN6js_sys5Array3new17hda9860877b2b0b9dE: () => number;
  readonly _ZN4core4cell22panic_already_borrowed17ha9ae3040ce5e1820E: (a: number) => void;
  readonly _ZN3std6thread5local18panic_access_error17h9ba446b0e8b312ebE: (a: number) => void;
  readonly _ZN18serde_wasm_bindgen9ObjectExt16get_with_ref_key17he1ddd56d02dda320E: (a: number, b: number) => number;
  readonly _ZN7web_sys8features11gen_console7console7error_117h24eb4f23ae623504E: (a: number) => void;
  readonly _ZN7web_sys8features11gen_console7console6warn_117h563f15714313a012E: (a: number) => void;
  readonly _ZN7web_sys8features11gen_console7console6info_117h26bf27823c6cc9c8E: (a: number) => void;
  readonly _ZN7web_sys8features11gen_console7console5log_117h5dced8f4ee3faab6E: (a: number) => void;
  readonly _ZN7web_sys8features11gen_console7console7debug_117h8736e4d3e23ce236E: (a: number) => void;
  readonly _ZN7web_sys8features16gen_MessageEvent12MessageEvent4data17hb41786223a0799efE: (a: number) => number;
  readonly _ZN6js_sys6global17hf742b8cc0412e5faE: () => number;
  readonly _ZN4core4cell30panic_already_mutably_borrowed17h792cb6da088651b3E: (a: number) => void;
  readonly _ZN6js_sys7Promise5then217h9dea8a1177b5a2ceE: (a: number, b: number, c: number) => number;
  readonly _ZN7web_sys8features10gen_Worker6Worker3new17h9a379fc747b82a21E: (a: number, b: number, c: number) => void;
  readonly _ZN12wasm_bindgen9throw_val17he9f5e98f901e6092E: (a: number) => void;
  readonly _ZN7web_sys8features10gen_Worker6Worker13set_onmessage17h65c8902fbdf88fa9E: (a: number, b: number) => void;
  readonly _ZN12wasm_bindgen6memory17h125a9185f0f7025eE: () => number;
  readonly _ZN6js_sys5Array3of317ha219ea51c2842bc1E: (a: number, b: number, c: number) => number;
  readonly _ZN7web_sys8features10gen_Worker6Worker12post_message17hbfd86653dd0c7588E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys7Promise4then17h675fc078c47f66aeE: (a: number, b: number) => number;
  readonly _ZN6js_sys11WebAssembly6Memory6buffer17hee2a0a3914bc4351E: (a: number) => number;
  readonly _ZN6js_sys10Int32Array3new17hbc01eec81e247aa1E: (a: number) => number;
  readonly __wbg_wbg_rayon_poolbuilder_free: (a: number, b: number) => void;
  readonly wbg_rayon_poolbuilder_numThreads: (a: number) => number;
  readonly wbg_rayon_poolbuilder_receiver: (a: number) => number;
  readonly _ZN18wasm_bindgen_rayon21wbg_rayon_PoolBuilder5build17hb3aaeb59bb02a830E: (a: number) => void;
  readonly wbg_rayon_poolbuilder_build: (a: number) => void;
  readonly _ZN10rayon_core5sleep5Sleep3new17he1ddf669d28fc188E: (a: number, b: number) => void;
  readonly _ZN3std4time7Instant3now17he752285c168063c4E: (a: number) => void;
  readonly _ZN17crossbeam_channel7context7Context3new17h59fac89e985c6907E: () => number;
  readonly _ZN10rayon_core8registry12WorkerThread11set_current17h6759a506b5537d4fE: (a: number) => void;
  readonly _ZN9wasm_sync7backend7Condvar10notify_all17h14f7491c86967a47E: (a: number) => void;
  readonly _ZN4core9panicking18panic_bounds_check17hbc194e6c4cf551e0E: (a: number, b: number, c: number) => void;
  readonly _ZN3std3sys3pal4wasm5futex10futex_wake17hcbfec2ea9c399f10E: (a: number) => number;
  readonly _ZN3std6thread4park17h5bda71e6fb982fc1E: () => void;
  readonly _ZN3std6thread12park_timeout17h735f2f2a6b147717E: (a: bigint, b: number) => void;
  readonly _ZN17crossbeam_channel5utils11sleep_until17h1813c1a771f2bb9fE: (a: bigint, b: number) => void;
  readonly _ZN3std6thread5sleep17h4d1ddb194629fb11E: (a: bigint, b: number) => void;
  readonly _ZN3std6thread7current7current17hf6402712cd342f5fE: () => number;
  readonly _ZN10rayon_core8registry8Registry17wait_until_primed17h5dc5fb38f7b6f13eE: (a: number) => void;
  readonly _ZN12wasm_bindgen6module17h624d5a6c12dac6b1E: () => number;
  readonly initThreadPool: (a: number) => any;
  readonly _ZN18wasm_bindgen_rayon22wbg_rayon_start_worker17h675a1fcb5aaa2799E: (a: number) => void;
  readonly _ZN10rayon_core8registry13ThreadBuilder3run17h8c2d145740e1e083E: (a: number) => void;
  readonly wbg_rayon_start_worker: (a: number) => void;
  readonly _ZN17crossbeam_channel7channel5after17h559e8dd8a0348b1cE: (a: number, b: bigint, c: number) => void;
  readonly _ZN3std4time7Instant11checked_add17h4ad8c91cecf38e07E: (a: number, b: number, c: bigint, d: number) => void;
  readonly _ZN17crossbeam_channel7channel2at17h0a3d0aa27cfa419aE: (a: number, b: bigint, c: number) => void;
  readonly _ZN17crossbeam_channel7channel4tick17hef0fb89156f5b2acE: (a: number, b: bigint, c: number) => void;
  readonly _ZN17crossbeam_channel6select10run_select17h27e143cea3add584E: (a: number, b: number, c: number, d: bigint, e: number, f: number) => void;
  readonly _ZN17crossbeam_channel6select6Select3new17h759ac0c197449cc6E: (a: number) => void;
  readonly _ZN17crossbeam_channel6select6Select10new_biased17h3aa609570182ed5cE: (a: number) => void;
  readonly _ZN17crossbeam_channel6select6Select6remove17h9ab43a809efeeb13E: (a: number, b: number) => void;
  readonly _ZN17crossbeam_channel6select6Select10try_select17he1d47ee9196ef9dbE: (a: number, b: number) => void;
  readonly _ZN17crossbeam_channel6select6Select6select17h0e258a1a88c67ba7E: (a: number, b: number) => void;
  readonly _ZN17crossbeam_channel6select6Select14select_timeout17hb3d96866d9e2609aE: (a: number, b: number, c: bigint, d: number) => void;
  readonly _ZN17crossbeam_channel6select6Select15select_deadline17h5c124ac556be1477E: (a: number, b: number, c: bigint, d: number) => void;
  readonly _ZN17crossbeam_channel6select6Select9try_ready17hf29954ff92114196E: (a: number, b: number) => void;
  readonly _ZN17crossbeam_channel6select6Select5ready17hf25682294645ebfaE: (a: number) => number;
  readonly _ZN17crossbeam_channel6select6Select13ready_timeout17hdce4aaf223dbc1b2E: (a: number, b: number, c: bigint, d: number) => void;
  readonly _ZN17crossbeam_channel6select6Select14ready_deadline17hd910ca58b3992c67E: (a: number, b: number, c: bigint, d: number) => void;
  readonly _ZN4core3fmt9Formatter3pad17h0b9c451863f7661eE: (a: number, b: number, c: number) => number;
  readonly _ZN14vectorize_core10algorithms4dots10background11rgba_to_lab17hb071c134b85737d3E: (a: number, b: number) => void;
  readonly _ZN14vectorize_core10algorithms5edges5edges12compute_fdog17h3cfec32b5b31e5ebE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14regex_automata4util4iter8Searcher30handle_overlapping_empty_match17h4b792df19d83e69dE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN4core5slice4sort6stable14driftsort_main17h22dc28eda24fe70dE: (a: number, b: number, c: number) => void;
  readonly _ZN4core5slice4sort6stable14driftsort_main17h2b8f5b85f35f67e5E: (a: number, b: number, c: number) => void;
  readonly _ZN4core5slice4sort6stable14driftsort_main17h34ed13287357b2bcE: (a: number, b: number, c: number) => void;
  readonly _ZN4core5slice4sort6stable14driftsort_main17h38acc9e184d4282bE: (a: number, b: number, c: number) => void;
  readonly _ZN4core5slice4sort6stable14driftsort_main17h3c1b05e827c71739E: (a: number, b: number, c: number) => void;
  readonly _ZN4core5slice4sort6stable14driftsort_main17h6e307c59f91cec75E: (a: number, b: number, c: number) => void;
  readonly _ZN4core5slice4sort6stable14driftsort_main17haebb1f2471e44639E: (a: number, b: number, c: number) => void;
  readonly _ZN4core5slice4sort6stable14driftsort_main17hb0759aeb74123a3dE: (a: number, b: number, c: number) => void;
  readonly _ZN4core5slice4sort6stable14driftsort_main17hba2cae209d067a29E: (a: number, b: number, c: number) => void;
  readonly _ZN4core5slice4sort6stable14driftsort_main17hccffd8f26598b2adE: (a: number, b: number, c: number) => void;
  readonly _ZN4core5slice4sort6stable14driftsort_main17he4984af8b35e2748E: (a: number, b: number, c: number) => void;
  readonly _ZN4core5slice4sort6stable9quicksort9quicksort17hff05d520cf2cec04E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN4core5slice4sort6stable9quicksort9quicksort17h51355c0bfa325462E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN4core5slice4sort6stable9quicksort9quicksort17h92e7b1736b4bb854E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN4core5slice4sort6stable9quicksort9quicksort17h8fb71111be8ded8eE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN4core5slice4sort6stable9quicksort9quicksort17h202a13732d073353E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN4core5slice4sort6stable9quicksort9quicksort17h23332c06af63d6b6E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN4core5slice4sort6stable9quicksort9quicksort17h20dcc08976470a4cE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN4core5slice4sort6stable9quicksort9quicksort17hcaf09798943b25feE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN4core5slice4sort6stable9quicksort9quicksort17hc16da42ce641c8a9E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN4core5slice4sort6stable9quicksort9quicksort17h209f8f8b35985645E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN4core5slice4sort6stable9quicksort9quicksort17h529855ddc247dfe6E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN4core5slice4sort8unstable7ipnsort17h62eee69c612a20c2E: (a: number, b: number, c: number) => void;
  readonly _ZN4core5slice4sort8unstable8heapsort8heapsort17hb5599b96809b4751E: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core10algorithms5edges9gradients28calculate_gradient_magnitude17h964a49dffe7fe030E: (a: number, b: number, c: number) => number;
  readonly _ZN14vectorize_core10algorithms5edges9gradients24calculate_local_variance17h31b18558838ce2c4E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN14vectorize_core10algorithms10centerline18distance_transform32DistanceFieldCenterlineExtractor19extract_centerlines17hdc04717e436d65ecE: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core10algorithms10centerline29distance_transform_centerline36DistanceTransformCenterlineAlgorithm3new17h7fb3b2b943902408E: (a: number) => void;
  readonly _ZN14vectorize_core10algorithms10centerline29distance_transform_centerline36DistanceTransformCenterlineAlgorithm30with_high_performance_settings17hcf6ca8adec73afbfE: (a: number) => void;
  readonly _ZN14vectorize_core5utils9wasm_time7Instant3now17h2846df4e75480ecdE: () => number;
  readonly _ZN14vectorize_core5utils9wasm_time7Instant7elapsed17h438489329dad894eE: (a: number, b: number) => void;
  readonly _ZN14vectorize_core10algorithms10centerline28CompositeCenterlineAlgorithm16high_performance17hb14146354f18e8e2E: (a: number) => void;
  readonly _ZN14vectorize_core10algorithms10centerline28CompositeCenterlineAlgorithm12high_quality17h4c2c006dff45d6d2E: (a: number) => void;
  readonly _ZN14vectorize_core10algorithms4dots13adaptive_dots21analyze_image_regions17h91a9b90ecc6419deE: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core10algorithms4dots13adaptive_dots26calculate_adaptive_density17h6a7c8295a9bb7aabE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core10algorithms4dots13adaptive_dots22apply_adaptive_density17h2fec62c76fddd3e6E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core10algorithms4dots13adaptive_dots21poisson_disk_sampling17h020e30c0a1474076E: (a: number, b: number) => void;
  readonly _ZN14vectorize_core10algorithms4dots13adaptive_dots26smooth_density_transitions17hbd4b6f1fe20cd272E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN14vectorize_core10algorithms4dots13adaptive_dots22generate_adaptive_dots17h2e5385a2e4a99753E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN14vectorize_core10algorithms4dots10background26detect_background_advanced17h62f73d01de4ad7a4E: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core10algorithms4dots4dots13generate_dots17h54b55f2f0f0fdd62E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN14vectorize_core10algorithms4dots10background8LabColor11distance_to17h1427fb18f1fb9350E: (a: number, b: number) => number;
  readonly _ZN14vectorize_core10algorithms4dots10background26calculate_color_similarity17h6669a0ddd7c2b388E: (a: number, b: number) => number;
  readonly _ZN14vectorize_core10algorithms4dots10background18sample_edge_pixels17h0ffd33fb5f8a670bE: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core10algorithms4dots10background22detect_background_mask17hb2402f46c074a710E: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core10algorithms4dots10dot_styles8DotStyle10all_styles17h99b49f2354db9cdcE: (a: number) => void;
  readonly _ZN14vectorize_core10algorithms4dots10dot_styles19add_artistic_jitter17h6de4bc80497fe9c6E: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core10algorithms4dots10dot_styles31add_artistic_jitter_with_config17hf5ca3d6fbd40975dE: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core10algorithms4dots10dot_styles18add_size_variation17h8054d2d33c02e23cE: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core10algorithms4dots10dot_styles30add_size_variation_with_config17h9345343c455bc70fE: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core10algorithms4dots10dot_styles21add_opacity_variation17hb1161651607b8cd1E: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core10algorithms4dots10dot_styles33add_opacity_variation_with_config17h030183191acb7531E: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core10algorithms4dots10dot_styles22apply_artistic_effects17h42be73ec78bdf2cbE: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core10algorithms4dots10dot_styles20apply_grid_alignment17h7acc335e0d41aea3E: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core10algorithms4dots4dots3Dot11distance_to17h23e4971c912418d2E: (a: number, b: number, c: number) => number;
  readonly _ZN14vectorize_core10algorithms4dots4dots3Dot13overlaps_with17hd1ec4514653ca32bE: (a: number, b: number) => number;
  readonly _ZN14vectorize_core10algorithms4dots4dots29generate_dots_auto_background17h4f793de8f0da7892E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core10algorithms4dots4dots34generate_dots_with_smart_filtering17hda903a15410eacbfE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN14vectorize_core10algorithms4dots4dots24generate_dots_from_image17h5996367cb09dd3a0E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN14vectorize_core10algorithms5edges9gradients35analyze_image_gradients_with_config17he330dca01b2a17e8E: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core10algorithms4dots14dots_optimized21OptimizedDotGenerator3new17h3cf1f84c058e1afcE: (a: number, b: number) => void;
  readonly _ZN14vectorize_core11performance11memory_pool7DotPool3new17h72d4f304814d1656E: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core10algorithms4dots14dots_optimized21OptimizedDotGenerator23generate_dots_optimized17hf6432bfc716ac5d6E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN14vectorize_core11performance8profiler19PerformanceProfiler12start_timing17h5ba51db106486b1bE: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core11performance14parallel_utils15ParallelContext20calculate_chunk_size17h31c11e3ff034ec0aE: (a: number, b: number) => number;
  readonly _ZN14vectorize_core11performance8profiler19PerformanceProfiler10end_timing17h5ed3c1e2d64b318eE: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core11performance8profiler19PerformanceProfiler17increment_counter17h26e2bc977960e296E: (a: number, b: number, c: number, d: bigint) => void;
  readonly _ZN14vectorize_core11performance13spatial_index11SpatialGrid3new17h86fd2c0d64666a1cE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN14vectorize_core11performance13spatial_index11SpatialGrid17is_position_valid17h8e5fd8d16ee08803E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
  readonly _ZN14vectorize_core11performance8profiler19PerformanceProfiler19record_memory_usage17h805932a85f39295cE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core10algorithms4dots14dots_optimized21OptimizedDotGenerator22get_performance_report17h8ca6385e147838bcE: (a: number, b: number) => void;
  readonly _ZN14vectorize_core11performance8profiler19PerformanceProfiler15generate_report17h396f08fa96f117aeE: (a: number, b: number) => void;
  readonly _ZN14vectorize_core10algorithms4dots14dots_optimized21OptimizedDotGenerator22clear_performance_data17h2c505f9b1005af33E: (a: number) => void;
  readonly _ZN14vectorize_core11performance8profiler19PerformanceProfiler5clear17h55b352d461b8ef45E: (a: number) => void;
  readonly _ZN14vectorize_core11performance11memory_pool11PoolManager9clear_all17h75bac5e36c90362cE: (a: number) => void;
  readonly _ZN14vectorize_core10algorithms4dots14dots_optimized27analyze_gradients_optimized17h1f1dc3129b94bd42E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core10algorithms4dots14dots_optimized27detect_background_optimized17h513982f373299624E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core11performance8simd_ops19simd_color_distance17h2c0058e2c02c8130E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN14vectorize_core10algorithms4dots14dots_optimized32generate_dots_optimized_pipeline17hea6fd840f36f0d1fE: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core10algorithms4dots8svg_dots10SvgElement8from_dot17h309416d517022f70E: (a: number, b: number) => void;
  readonly _ZN14vectorize_core10algorithms4dots8svg_dots20dots_to_svg_elements17h0a29f103c346a189E: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core10algorithms4dots8svg_dots16optimize_dot_svg17ha6d1026ffc4ef23dE: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core10algorithms4dots8svg_dots23dots_to_svg_with_config17h0e4ffc35b22f5db8E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core10algorithms4dots8svg_dots17dots_to_svg_paths17h2b8773577d6ddb2fE: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core10algorithms4dots8svg_dots25generate_dot_svg_document17h98d40d8051817626E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN14vectorize_core3svg21generate_svg_document17h571773c87cc80eb2E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN14vectorize_core10algorithms5edges5edges12EdgeResponse3new17hd963ee92cb7ee7baE: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core10algorithms5edges5edges12EdgeResponse13get_magnitude17h310a92722efb0dd4E: (a: number, b: number, c: number) => number;
  readonly _ZN14vectorize_core10algorithms5edges5edges12EdgeResponse15get_orientation17ha30683b7981b5e04E: (a: number, b: number, c: number) => number;
  readonly _ZN14vectorize_core10algorithms5edges5edges12compute_xdog17hf99486290e5360f1E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core10algorithms5edges5edges9apply_nms17h2fddfab1b52c4309E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core10algorithms5edges5edges20hysteresis_threshold17h46fbdb5b9749eea0E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN14vectorize_core10algorithms5edges5edges29compute_multi_direction_edges17hf92d3aa8dbe991dbE: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN14vectorize_core10algorithms5edges3etf11compute_etf17h621990564b5bc638E: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core10algorithms5edges3etf8EtfField3new17hb90f04c3b2b40ee1E: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core10algorithms5edges3etf8EtfField11get_tangent17hb5ac93a4e603ae4cE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core10algorithms5edges3etf8EtfField13get_coherency17heb82262b10e5cff7E: (a: number, b: number, c: number) => number;
  readonly _ZN14vectorize_core10algorithms5edges3etf8EtfField11set_tangent17hf25e77d3e5ec6986E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN14vectorize_core10algorithms5edges3etf8EtfField13set_coherency17h9cda34631c100951E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core10algorithms5edges9gradients16GradientAnalysis21get_gradient_strength17h3821b58b8ec6a83aE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core10algorithms5edges9gradients23analyze_image_gradients17h45d283776280b8cbE: (a: number, b: number) => void;
  readonly _ZN14vectorize_core10algorithms7tracing3fit11CubicBezier9curvature17he6bad6f81c49ceebE: (a: number, b: number) => number;
  readonly _ZN14vectorize_core10algorithms7tracing3fit11CubicBezier16to_svg_path_data17h8a4bedfb68ad7198E: (a: number, b: number) => void;
  readonly _ZN14vectorize_core10algorithms7tracing3fit11fit_beziers17h3da9c6e1b761d1a0E: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core10algorithms7tracing10path_utils33calculate_douglas_peucker_epsilon17h5d47a0127594a78bE: (a: number, b: number, c: number) => number;
  readonly _ZN14vectorize_core10algorithms7tracing10path_utils24douglas_peucker_simplify17h8c91138716db8931E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core10algorithms7tracing10path_utils27visvalingam_whyatt_simplify17h3194a098afe0df52E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core10algorithms7tracing10path_utils11smooth_path17h51d7a43695c04b34E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core10algorithms7tracing10path_utils21calculate_path_length17hf4bdc19bdccc433dE: (a: number, b: number) => number;
  readonly _ZN14vectorize_core10algorithms7tracing10path_utils13resample_path17hdd0a9f194071699bE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core10algorithms7tracing10path_utils11CubicBezier14to_svg_command17heb2178deff69cb22E: (a: number, b: number) => void;
  readonly _ZN14vectorize_core10algorithms7tracing10path_utils26schneider_fit_cubic_bezier17h878f572b563fd92bE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN14vectorize_core10algorithms7tracing10path_utils27fitting_results_to_svg_path17h3d68169eb624ca6fE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN14vectorize_core10algorithms7tracing5trace15trace_polylines17h9db30912d0c43a3aE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core10algorithms7tracing9trace_low16ThresholdMapping3new17h132ac75241bf4a5bE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core10algorithms7tracing9trace_low34vectorize_trace_low_with_gradients17h7a209eb2bb97554aE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core10algorithms7tracing9trace_low19vectorize_trace_low17h2995960890203114E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core10algorithms6visual16color_processing19extract_path_colors17h319e187b26878095E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => void;
  readonly _ZN14vectorize_core10algorithms6visual18gradient_detection26analyze_path_for_gradients17h0a8b996a72bc7ee4E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN14vectorize_core10algorithms7tracing9trace_low31vectorize_trace_low_single_pass17he3637ea1798c1394E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core10algorithms7tracing9trace_low29vectorize_trace_low_multipass17he2b8b0b5b5e16bedE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core10algorithms7tracing9trace_low31vectorize_trace_low_directional17h6b80c00a7d2b64ddE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core10algorithms6visual10hand_drawn27apply_hand_drawn_aesthetics17h817838de435238e6E: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core10algorithms6visual16color_processing11rgba_to_hex17h31b4212dab3090bbE: (a: number, b: number) => void;
  readonly _ZN14vectorize_core10algorithms6visual16color_processing20reduce_color_palette17h629f371ab0148972E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN14vectorize_core10algorithms6visual18gradient_detection20generate_gradient_id17hd7e94dd7b2a0b2c1E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core10algorithms6visual18gradient_detection27analyze_paths_for_gradients17hd341d33b4e9f5a86E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core10algorithms6visual10simd_color30simd_k_means_palette_reduction17h03f67ab28bb61baaE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN14vectorize_core10algorithms6visual10simd_color30simd_analyze_gradient_strength17hd0c31eeab5f2d6a9E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core10algorithms6visual10simd_color13get_simd_info17hc94b447429629ac9E: (a: number) => void;
  readonly _ZN14vectorize_core10algorithms5Point11distance_to17hd886e9a5362c9443E: (a: number, b: number) => number;
  readonly _ZN14vectorize_core10algorithms7SvgPath3new17h5cf429456c40fdb7E: (a: number, b: number) => void;
  readonly _ZN14vectorize_core10algorithms7SvgPath10new_stroke17h456a8942e0b3d966E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN14vectorize_core10algorithms7SvgPath8new_fill17h5191c8030249b21aE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core6config10validation25validate_image_dimensions17h9799fd1d074606a8E: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core6config10validation20validate_color_count17hb982374b6676e0e7E: (a: number, b: number) => void;
  readonly _ZN14vectorize_core6config10validation19validate_iterations17hc88f3d506b073c14E: (a: number, b: number) => void;
  readonly _ZN14vectorize_core6config10validation18validate_tolerance17h6f2b5820cb9492deE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core6config10validation19validate_fdog_sigma17hfb97c7116371ca39E: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core6config10validation23validate_nms_thresholds17h358ac11c8e126427E: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core6config10validation23validate_dot_size_range17hb844117477d70e01E: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core6config10validation26validate_superpixel_config17hef2aae32891d2ea0E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN4core5slice5index24slice_end_index_len_fail17h26e926f109887fb8E: (a: number, b: number, c: number) => void;
  readonly _ZN4core5slice5index22slice_index_order_fail17he4708bd4c2f516cbE: (a: number, b: number, c: number) => void;
  readonly _ZN4core9panicking11panic_const23panic_const_div_by_zero17hadb41165406a8978E: (a: number) => void;
  readonly _ZN4core9panicking11panic_const24panic_const_div_overflow17hf9a642922c7f86c1E: (a: number) => void;
  readonly _ZN10rayon_core5sleep5Sleep16wake_any_threads17h091d46a21695233eE: (a: number, b: number) => void;
  readonly _ZN10rayon_core8registry12WorkerThread15wait_until_cold17h968ba44cca656cd1E: (a: number, b: number) => void;
  readonly _ZN10rayon_core6unwind16resume_unwinding17h2eef89f0859872e0E: (a: number, b: number) => void;
  readonly _ZN15crossbeam_epoch7default9collector17h10edca161a1a3063E: () => number;
  readonly _ZN15crossbeam_epoch9collector9Collector8register17h94aca60094aa3892E: (a: number) => number;
  readonly _ZN15crossbeam_epoch8internal5Local8finalize17hcd72099eaa3e6ac7E: (a: number) => void;
  readonly _ZN15crossbeam_epoch8internal6Global7collect17h2ce9df89fba1ccccE: (a: number, b: number) => void;
  readonly _ZN10rayon_core8registry8Registry6inject17h091696970915cd77E: (a: number, b: number, c: number) => void;
  readonly _ZN10rayon_core5latch9LockLatch14wait_and_reset17h8a9d9724bc9a392aE: (a: number) => void;
  readonly _ZN3ryu6pretty8format6417h6ad0ae7200794b51E: (a: number, b: number) => number;
  readonly _ZN10serde_json5error5Error2io17h78dd7cb349a27903E: (a: number) => number;
  readonly _ZN4core9panicking13assert_failed17hbfa1b7070975591bE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN14regex_automata4util4iter8Searcher30handle_overlapping_empty_match17h1c7b5b0212e8f28eE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN4core9panicking11panic_const23panic_const_rem_by_zero17he42be7a45c0afe69E: (a: number) => void;
  readonly _ZN15crossbeam_epoch8internal5Local5defer17h615be4a1b94be655E: (a: number, b: number, c: number) => void;
  readonly _ZN15crossbeam_epoch5guard5Guard5flush17h3f8e17c196451585E: (a: number) => void;
  readonly _ZN4core3fmt9Formatter26debug_struct_field4_finish17hdfda7b088257dd4cE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number, p: number, q: number, r: number, s: number) => number;
  readonly _ZN4core3fmt9Formatter26debug_struct_field5_finish17ha0929c67fee5a987E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number, p: number, q: number, r: number, s: number, t: number, u: number, v: number, w: number) => number;
  readonly _ZN4core3fmt9Formatter10debug_list17h06ef3d176c90a32dE: (a: number, b: number) => void;
  readonly _ZN4core3fmt8builders9DebugList5entry17h0af2d11058999768E: (a: number, b: number, c: number) => number;
  readonly _ZN4core3fmt8builders9DebugList6finish17hc3efdb82b57d5467E: (a: number) => number;
  readonly _ZN4core5slice4sort6shared9smallsort22panic_on_ord_violation17hf1535a93019eda64E: () => void;
  readonly _ZN4core5slice4sort6stable5drift11sqrt_approx17hebcbb4730a989df3E: (a: number) => number;
  readonly _ZN4core5slice5index26slice_start_index_len_fail17h84ec159b6c9fabe4E: (a: number, b: number, c: number) => void;
  readonly _ZN4core3fmt9Formatter11debug_tuple17h1f8e7fe6ac09417cE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN4core3fmt8builders10DebugTuple5field17h4dadac17f2bd0e57E: (a: number, b: number, c: number) => number;
  readonly _ZN4core3fmt8builders10DebugTuple6finish17hf160e4b642315f3eE: (a: number) => number;
  readonly _ZN5image8imageops6sample15lanczos3_kernel17hec290f9ba8e606ebE: (a: number) => number;
  readonly _ZN10rayon_core19current_num_threads17h3daee437f370af43E: () => number;
  readonly _ZN10rayon_core8registry15global_registry17h7393adf5a8c92629E: () => number;
  readonly _ZN14regex_automata4meta5regex5Regex15create_captures17h5f18796fbabcb8c2E: (a: number, b: number) => void;
  readonly _ZN4core3str16slice_error_fail17h105a77752e5b85e3E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN6chrono5naive8datetime13NaiveDateTime22overflowing_add_offset17h15895ba76110eb5fE: (a: number, b: number, c: number) => void;
  readonly _ZN4core5slice6memchr14memchr_aligned17h2aad6fc1e8ecef89E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN10rayon_core8registry8Registry26notify_worker_latch_is_set17had8c07f41b03d795E: (a: number, b: number) => void;
  readonly _ZN4core3fmt9Formatter12debug_struct17h2ec86bdcb61371d8E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN4core3fmt8builders11DebugStruct5field17h7af8f834b7a74880E: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly _ZN4core3fmt8builders11DebugStruct6finish17h59295de558e93902E: (a: number) => number;
  readonly _ZN9rand_core11SeedableRng13seed_from_u645pcg3217hed2c090c2053825dE: (a: number) => number;
  readonly _ZN11rand_chacha4guts10read_u32le17hc646db53164223daE: (a: number, b: number) => number;
  readonly _ZN4core5slice5index29slice_end_index_overflow_fail17h6b3c204b38da1968E: (a: number) => void;
  readonly _ZN5image8dynimage12DynamicImage8to_luma817h64eb1b41abdcf337E: (a: number, b: number) => void;
  readonly _ZN4rand4rngs6thread10thread_rng17h6f426c4d1ff27123E: () => number;
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder26dot_size_range_from_string17h6fb03b8523fc0925E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder21palette_target_colors17h0dc01eca6657681dE: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder18available_backends17h07ce91be556e15e5E: (a: number) => void;
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder28available_hand_drawn_presets17h900670cfdbea3b34E: (a: number) => void;
  readonly _ZN14vectorize_core14config_builder13ConfigBuilder27get_backend_recommendations17hb7b6fdff1c59aaa3E: (a: number, b: number) => void;
  readonly _ZN14vectorize_core5error10validation25validate_image_dimensions17h751b764f10681508E: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core5error10validation20validate_color_count17hcacd4df6c08953dfE: (a: number, b: number) => void;
  readonly _ZN14vectorize_core5error10validation19validate_iterations17h085dd82287be1874E: (a: number, b: number) => void;
  readonly _ZN14vectorize_core5error10validation18validate_tolerance17h3387cbfd01e22b8dE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core5error10validation23check_memory_allocation17h10e24ce2539cef37E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core9execution19current_num_threads17h3c776f712465c553E: () => number;
  readonly _ZN14vectorize_core9execution19should_use_parallel17h248af52dd71920e0E: (a: number, b: number) => number;
  readonly _ZN14vectorize_core11performance11memory_pool7DotPool7acquire17h0a8a715f1be1ba5aE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN14vectorize_core11performance11memory_pool7DotPool7release17h4af516074f892d71E: (a: number, b: number) => void;
  readonly _ZN14vectorize_core11performance11memory_pool7DotPool13acquire_batch17h0046e36bfde169c8E: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core11performance11memory_pool7DotPool13release_batch17h25d44812e0cadf94E: (a: number, b: number) => void;
  readonly _ZN14vectorize_core11performance11memory_pool7DotPool5clear17h813276f1854d7e80E: (a: number) => void;
  readonly _ZN14vectorize_core11performance11memory_pool7DotPool13shrink_to_fit17h1709c5bc463b4c28E: (a: number) => void;
  readonly _ZN14vectorize_core11performance11memory_pool17ThreadSafeDotPool3new17h45bcf389f029ba86E: (a: number, b: number) => number;
  readonly _ZN14vectorize_core11performance11memory_pool17ThreadSafeDotPool7acquire17h353f35ca3207785fE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN14vectorize_core11performance11memory_pool17ThreadSafeDotPool7release17he21cd53796c7556fE: (a: number, b: number) => void;
  readonly _ZN14vectorize_core11performance11memory_pool17ThreadSafeDotPool5stats17hd0da0c4e00539453E: (a: number, b: number) => void;
  readonly _ZN14vectorize_core11performance11memory_pool17ThreadSafeDotPool5clear17h37e1254ae1f65f55E: (a: number) => void;
  readonly _ZN14vectorize_core11performance11memory_pool11PoolManager3new17h25830c13005018dcE: (a: number) => void;
  readonly _ZN14vectorize_core11performance11memory_pool11PoolManager22get_or_create_vec_pool17h46e378d15fcad463E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN14vectorize_core11performance11memory_pool11PoolManager14combined_stats17h7832bcb2d8fd5141E: (a: number, b: number) => void;
  readonly _ZN14vectorize_core11performance11memory_pool11PoolManager12optimize_all17h49e6e7433393c113E: (a: number) => void;
  readonly _ZN14vectorize_core11performance14parallel_utils15ParallelContext19should_use_parallel17hbbc945f7e69dcf71E: (a: number, b: number) => number;
  readonly _ZN14vectorize_core11performance14parallel_utils15ParallelContext21record_work_completed17h87a01d109528514cE: (a: number, b: number) => void;
  readonly _ZN14vectorize_core11performance14parallel_utils15ParallelContext14set_total_work17h8303f87cc93b6631E: (a: number, b: number) => void;
  readonly _ZN14vectorize_core11performance14parallel_utils15ParallelContext12get_progress17h15c998acd82a5edfE: (a: number) => number;
  readonly _ZN14vectorize_core11performance14parallel_utils14PixelProcessor3new17h588924538d3093f4E: (a: number) => number;
  readonly _ZN14vectorize_core11performance14parallel_utils14PixelProcessor12get_progress17hd3c452aef2e116c0E: (a: number) => number;
  readonly _ZN14vectorize_core11performance14parallel_utils23AdaptiveWorkDistributor29calculate_adaptive_chunk_size17hbbcd943ee25c59bcE: (a: number, b: number, c: number) => number;
  readonly _ZN14vectorize_core11performance14parallel_utils23AdaptiveWorkDistributor18record_performance17hc4aa9ab15a346c78E: (a: number, b: number) => void;
  readonly _ZN14vectorize_core11performance14parallel_utils17ThreadPoolManager3new17h60c01c693f09856bE: (a: number, b: number) => void;
  readonly _ZN14vectorize_core11performance14parallel_utils17ThreadPoolManager5stats17h45a6298b5790028fE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window11performance17h33fb49a5a1ce44e0E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features15gen_Performance11Performance3now17h63390dc93c124248E: (a: number) => number;
  readonly _ZN14vectorize_core11performance8profiler19PerformanceProfiler3new17h29cf9eb9139f07f0E: (a: number, b: number) => void;
  readonly _ZN14vectorize_core11performance8profiler19PerformanceProfiler16get_timing_stats17h8dcb4fd84de79fa8E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core11performance8profiler19PerformanceProfiler11get_counter17hbb9e71269ba49aa6E: (a: number, b: number, c: number) => bigint;
  readonly _ZN14vectorize_core11performance8profiler19PerformanceProfiler16get_memory_usage17h45315b518b7f8833E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core11performance8profiler19PerformanceProfiler14get_operations17hcd279694c2300f48E: (a: number, b: number) => void;
  readonly _ZN14vectorize_core11performance8profiler19PerformanceProfiler11set_enabled17hb1acf16b2f02481eE: (a: number, b: number) => void;
  readonly _ZN14vectorize_core11performance8profiler19PerformanceProfiler11export_json17h7fdc25e4df545473E: (a: number, b: number) => void;
  readonly _ZN14vectorize_core11performance8profiler17PerformanceReport17slowest_operation17h2568f92e89b72ccdE: (a: number) => number;
  readonly _ZN14vectorize_core11performance8profiler17PerformanceReport30operations_exceeding_threshold17h0d6daf19c48dd864E: (a: number, b: number, c: bigint, d: number) => void;
  readonly _ZN14vectorize_core11performance8profiler17PerformanceReport7summary17hf3e51d16472a45a4E: (a: number, b: number) => void;
  readonly _ZN14vectorize_core11performance8profiler18ThreadSafeProfiler3new17h071d3e63ea0ac1eeE: (a: number) => number;
  readonly _ZN14vectorize_core11performance8profiler18ThreadSafeProfiler12start_timing17h2eefbb33180c974aE: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core11performance8profiler18ThreadSafeProfiler10end_timing17h40ef09edd1b7a52aE: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core11performance8profiler18ThreadSafeProfiler17increment_counter17hfe3813df4ea86d56E: (a: number, b: number, c: number, d: bigint) => void;
  readonly _ZN14vectorize_core11performance8profiler18ThreadSafeProfiler15generate_report17he8276185ffff3201E: (a: number, b: number) => void;
  readonly _ZN14vectorize_core11performance8profiler18ThreadSafeProfiler5clear17h8fb5491160653cf9E: (a: number) => void;
  readonly _ZN14vectorize_core11performance8profiler11ScopedTimer3new17h694f445826c9e36cE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core11performance8simd_ops23simd_gradient_magnitude17hf54deb37b7595027E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN14vectorize_core11performance8simd_ops23simd_distances_to_point17hce37809540b137bcE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN14vectorize_core11performance8simd_ops27get_available_simd_features17h741b52297e458ad1E: (a: number) => void;
  readonly _ZN14vectorize_core11performance13spatial_index11SpatialGrid7add_dot17h526d480453368a82E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core11performance13spatial_index11SpatialGrid10remove_dot17h1db052777a0e4b63E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN14vectorize_core11performance13spatial_index11SpatialGrid19find_dots_in_radius17h058e220f6ab6e603E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN14vectorize_core11performance13spatial_index11SpatialGrid17get_cell_contents17ha1a27c99d930d63eE: (a: number, b: number, c: number) => number;
  readonly _ZN14vectorize_core11performance13spatial_index11SpatialGrid5stats17hb30f4cdeef6bc838E: (a: number, b: number) => void;
  readonly _ZN14vectorize_core11performance13spatial_index11SpatialGrid13shrink_to_fit17h0919670beff428aaE: (a: number) => void;
  readonly _ZN14vectorize_core11performance13spatial_index11SpatialGrid25optimize_for_distribution17h575f518703f8ea73E: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core11performance13spatial_index8QuadTree6insert17hb4931004990d1f70E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN14vectorize_core11performance13spatial_index8QuadTree12query_radius17hb0f6597a798f6969E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN14vectorize_core11performance13spatial_index8QuadTree5clear17h78d0915b6eb9b74eE: (a: number) => void;
  readonly _ZN14vectorize_core11performance13spatial_index8QuadTree5count17h76759b0511673a4cE: (a: number) => number;
  readonly _ZN14vectorize_core11performance16PerformanceStats18avg_operation_time17h3cb16887c4360580E: (a: number, b: number) => void;
  readonly _ZN14vectorize_core11performance16PerformanceStats5merge17h02aa4c1380df9fd4E: (a: number, b: number) => void;
  readonly _ZN14vectorize_core11performance16PerformanceUtils18optimal_chunk_size17hd98f1a07804e6e13E: (a: number, b: number) => number;
  readonly _ZN14vectorize_core11performance16PerformanceUtils36calculate_optimal_parallel_threshold17h1f3d2b5536208bb4E: () => number;
  readonly _ZN14vectorize_core13preprocessing3old12resize_image17h56182b516b50cce3E: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core13preprocessing3old17rgba_to_grayscale17hc55581d4562b7ab7E: (a: number, b: number) => void;
  readonly _ZN14vectorize_core13preprocessing3old22standardize_image_size17h334e42a1c37475edE: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core13preprocessing3old12fast_denoise17h6270e5ad0a0515a4E: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core13preprocessing3old13gaussian_blur17hbd7709a455ed8816E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN14vectorize_core13preprocessing3old19preprocess_for_logo17hd637b596aeee02abE: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core13preprocessing3old22preprocess_for_regions17hdd0aa9bdca40e2e2E: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core13preprocessing3old15apply_threshold17h9fad7dd49bd64213E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core13preprocessing3old24calculate_otsu_threshold17h675a0c90cf5b4a20E: (a: number, b: number) => number;
  readonly _ZN14vectorize_core13preprocessing3old10rgb_to_lab17h66c9208059bef408E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core13preprocessing3old10lab_to_rgb17h11c196d9b10849cdE: (a: number, b: number, c: number) => number;
  readonly _ZN14vectorize_core13preprocessing3old16bilateral_filter17hd5b23767ba2567ebE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core13preprocessing18background_removal24apply_background_removal17h64b759179be8488bE: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core13preprocessing23test_background_removal17create_test_image17ha88fec8cb23b0f35E: (a: number) => void;
  readonly _ZN14vectorize_core13preprocessing23test_background_removal28test_otsu_background_removal17h808fb39b3ebe8e9dE: (a: number) => void;
  readonly _ZN3std2io5stdio6_print17hf9e3545393ba8ed8E: (a: number) => void;
  readonly _ZN14vectorize_core13preprocessing23test_background_removal32test_adaptive_background_removal17hf88a63a82a2aa822E: (a: number) => void;
  readonly _ZN14vectorize_core13preprocessing23test_background_removal28test_auto_background_removal17h5c1c599c76f31d76E: (a: number) => void;
  readonly _ZN14vectorize_core13preprocessing23test_background_removal33analyze_background_removal_effect17hdd9c4f3c5a0fa046E: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core13preprocessing23test_background_removal22run_comprehensive_test17h24c01acc7d703517E: (a: number) => void;
  readonly _ZN14vectorize_core13preprocessing31analyze_resolution_requirements17h0026ad85e84cffb4E: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core13preprocessing27apply_resolution_processing17hd0e728fef4020783E: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core13preprocessing23adjust_trace_low_config17hb5e0bf223ca7affbE: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core13preprocessing21scale_svg_coordinates17h726eef57b0f91db1E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core3svg13optimize_data17ha53eb7bb4808ddfbE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core3svg10minify_svg17hc00f7a8764ad478aE: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core3svg20optimize_colored_svg17ha8e19a74af617c02E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN5regex5regex6string5Regex3new17h2f2c0ce420b931e3E: (a: number, b: number, c: number) => void;
  readonly _ZN5regex6escape17h7c35ac8fbb1bbdebE: (a: number, b: number, c: number) => void;
  readonly _ZN4core3str7pattern11StrSearcher3new17h5d8bed8e1fa66af4E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN14vectorize_core3svg18validate_svg_paths17h0563813007d50e02E: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core3svg16create_rectangle17ha1f7d82e73938589E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN14vectorize_core3svg13create_circle17h59405c935762836eE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN14vectorize_core13svg_gradients36generate_svg_document_with_gradients17h3cfda7b0a17e2b80E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
  readonly _ZN14vectorize_core13svg_gradients46generate_optimized_svg_document_with_gradients17h695ba9d43a46c94fE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => void;
  readonly _ZN14vectorize_core9telemetry15write_json_dump17hf6942781aaedf99aE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14vectorize_core9telemetry15append_runs_csv17ha4506edc14b44431E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6chrono6offset3utc3Utc3now17hf434da1a088b59d3E: (a: number) => void;
  readonly _ZN14vectorize_core9telemetry9make_dump17h4ac68616cc561d7bE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number) => void;
  readonly _ZN14vectorize_core5utils9wasm_time7Instant14duration_since17h5fa2b3ab0283fe1bE: (a: number, b: number, c: number) => void;
  readonly _ZN14vectorize_core5utils9wasm_time5Timer3new17hb8cffdfe6042117bE: () => number;
  readonly _ZN14vectorize_core5utils9wasm_time5Timer7elapsed17h47c59a6aa4295cc6E: (a: number, b: number) => void;
  readonly _ZN14vectorize_core5utils9wasm_time5Timer10elapsed_ms17h635a1cde736592beE: (a: number) => number;
  readonly _ZN14vectorize_core5utils9wasm_time5Timer5reset17h657c57eb6cd6aaa2E: (a: number) => void;
  readonly _ZN14vectorize_core13preprocessing3old12lab_distance17hbe9bf446e1e161ecE: (a: number, b: number) => number;
  readonly _ZN14vectorize_core10algorithms10centerline18distance_transform32DistanceFieldCenterlineExtractor3new17h7dbab923a0aa04baE: (a: number) => void;
  readonly _RNvCsihszUHWOIem_7___rustc20___rust_panic_cleanup: (a: number, b: number) => void;
  readonly _RNvCsihszUHWOIem_7___rustc18___rust_start_panic: (a: number, b: number) => number;
  readonly _ZN10rand_distr8binomial10f64_to_i6417h3efb4378a5ba3baaE: (a: number) => bigint;
  readonly _ZN10rand_distr9geometric9Geometric3new17h1946bcc9ca65e433E: (a: number, b: number) => void;
  readonly _ZN10rand_distr14hypergeometric15ln_of_factorial17h2c85591927849733E: (a: number) => number;
  readonly _ZN10rand_distr14hypergeometric14Hypergeometric3new17h144328bb9b6459a5E: (a: number, b: bigint, c: bigint, d: bigint) => void;
  readonly _ZN6chrono6format4Item8to_owned17h2d5fef8f5c029421E: (a: number, b: number) => void;
  readonly _ZN6chrono10time_delta9TimeDelta16num_microseconds17h5579f0f592914e0bE: (a: number, b: number) => void;
  readonly _ZN6chrono10time_delta9TimeDelta15num_nanoseconds17hbc93164577767608E: (a: number, b: number) => void;
  readonly _ZN6chrono10time_delta9TimeDelta11checked_mul17h40594b25d991b55aE: (a: number, b: number, c: number) => void;
  readonly _ZN6chrono10time_delta9TimeDelta11checked_div17h5ef3dc7dff7473ebE: (a: number, b: number, c: number) => void;
  readonly _ZN6chrono10time_delta9TimeDelta6to_std17h88ca8c8ba1a46096E: (a: number, b: number) => void;
  readonly _ZN6chrono5naive4date9NaiveDate25from_num_days_from_ce_opt17h5d2cd79c7d284aceE: (a: number) => number;
  readonly _ZN6chrono5naive8datetime13NaiveDateTime18checked_add_offset17hc96066d436795c32E: (a: number, b: number, c: number) => void;
  readonly _ZN6chrono6format6parsed6Parsed29to_naive_datetime_with_offset17h292a846010d1da63E: (a: number, b: number, c: number) => void;
  readonly _ZN6chrono5naive8datetime13NaiveDateTime18checked_sub_offset17hd9fe9d14188fea87E: (a: number, b: number, c: number) => void;
  readonly _ZN6chrono6format4scan10nanosecond17h2981a107199984a5E: (a: number, b: number, c: number) => void;
  readonly _ZN6chrono6format10formatting11format_item17h163113ea22d92186E: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly _ZN6chrono6format6parsed6Parsed13to_naive_date17h811f2d230a996f74E: (a: number, b: number) => void;
  readonly _ZN6chrono5naive4date9NaiveDate15from_isoywd_opt17hb106a40b83cd28c6E: (a: number, b: number, c: number) => number;
  readonly _ZN6chrono6format6parsed6Parsed13to_naive_time17hab822bfbe605ae63E: (a: number, b: number) => void;
  readonly _ZN6chrono5naive8datetime13NaiveDateTime18checked_sub_signed17h6fb50d00caba4717E: (a: number, b: number, c: bigint, d: number) => void;
  readonly _ZN6chrono6format6parsed6Parsed11to_datetime17h56ce2708ac040c99E: (a: number, b: number) => void;
  readonly _ZN6chrono6format5parse13parse_rfc282217he4b322fc8cec5644E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6chrono6format4scan13short_weekday17h529e9e7ed3582faeE: (a: number, b: number, c: number) => void;
  readonly _ZN6chrono6format4scan12short_month017hdd05722a72080007E: (a: number, b: number, c: number) => void;
  readonly _ZN6chrono6format5parse21parse_rfc3339_relaxed17hd4a2d94290c376ffE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6chrono6format4scan20short_or_long_month017hf9578e241b4d706dE: (a: number, b: number, c: number) => void;
  readonly _ZN6chrono6format4scan16nanosecond_fixed17h9c7c9892ab48f54cE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6chrono6format4scan21short_or_long_weekday17h961e472c99583c3fE: (a: number, b: number, c: number) => void;
  readonly _ZN6chrono6format4scan14colon_or_space17h5927a3cf419c44f6E: (a: number, b: number, c: number) => void;
  readonly _ZN6chrono6format4scan15timezone_offset6digits17h7f7341d662f1923cE: (a: number, b: number) => number;
  readonly _ZN6chrono6format8strftime13StrftimeItems5parse17hc37c36220de44cfcE: (a: number, b: number) => void;
  readonly _ZN6chrono6format8strftime13StrftimeItems14parse_to_owned17hf034938c5fc56326E: (a: number, b: number) => void;
  readonly _ZN6chrono5naive4date9NaiveDate8from_mdf17hb4560675230abb81E: (a: number, b: number) => number;
  readonly _ZN6chrono5naive4date9NaiveDate8from_ymd17h1c8377b20cd454ffE: (a: number, b: number, c: number) => number;
  readonly _ZN6chrono6expect18panic_cold_display17h6ae9b9a6b8498f3bE: (a: number, b: number) => void;
  readonly _ZN6chrono5naive4date9NaiveDate12from_ymd_opt17h3b27a51aa3e57be8E: (a: number, b: number, c: number) => number;
  readonly _ZN6chrono5naive4date9NaiveDate7from_yo17hafc0d811584356b6E: (a: number, b: number) => number;
  readonly _ZN6chrono5naive4date9NaiveDate11from_yo_opt17hf80fbbb47dd5b769E: (a: number, b: number) => number;
  readonly _ZN6chrono5naive4date9NaiveDate11from_isoywd17he1631eb5703955beE: (a: number, b: number, c: number) => number;
  readonly _ZN6chrono5naive4date9NaiveDate21from_weekday_of_month17h420d5434c0331df9E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6chrono5naive4date9NaiveDate25from_weekday_of_month_opt17hf2dfad8cdfa70fd9E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6chrono5naive4date9NaiveDate14parse_from_str17h0c85c85e3c474ec0E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN6chrono5naive4date9NaiveDate19parse_and_remainder17hcdca02fb327b6622E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN6chrono5naive4date9NaiveDate18checked_add_months17h9eb76679f33cf9f5E: (a: number, b: number) => number;
  readonly _ZN6chrono5naive4date9NaiveDate11diff_months17h7df3432da0db3348E: (a: number, b: number) => number;
  readonly _ZN6chrono5naive4date9NaiveDate18checked_sub_months17hf72106cf6b19dd2cE: (a: number, b: number) => number;
  readonly _ZN6chrono5naive4date9NaiveDate16checked_add_days17ha82f6f940d1cf348E: (a: number, b: bigint) => number;
  readonly _ZN6chrono5naive4date9NaiveDate8add_days17h557eb01490a372ebE: (a: number, b: number) => number;
  readonly _ZN6chrono5naive4date9NaiveDate16checked_sub_days17h002bfd50dfb51826E: (a: number, b: bigint) => number;
  readonly _ZN6chrono5naive4date9NaiveDate18checked_add_signed17hfbcd628b94e6e901E: (a: number, b: bigint, c: number) => number;
  readonly _ZN6chrono5naive4date9NaiveDate18checked_sub_signed17h9f5e029765ea1318E: (a: number, b: bigint, c: number) => number;
  readonly _ZN6chrono5naive4date9NaiveDate21signed_duration_since17h064bab8f8c1bbca3E: (a: number, b: number, c: number) => void;
  readonly _ZN6chrono5naive4date9NaiveDate11years_since17h8c37b2991033ca26E: (a: number, b: number, c: number) => void;
  readonly _ZN6chrono5naive4date11cycle_to_yo17h79634824bcc46bdbE: (a: number, b: number) => void;
  readonly _ZN6chrono5naive4date11yo_to_cycle17h5d1357d10c2d3785E: (a: number, b: number) => number;
  readonly _ZN6chrono5naive4date13div_mod_floor17h4f5b886a8d94549aE: (a: number, b: number, c: number) => void;
  readonly _ZN6chrono5naive8datetime13NaiveDateTime14parse_from_str17hd02dbcdb9d94c1e9E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN6chrono5naive8datetime13NaiveDateTime19parse_and_remainder17ha9c3a0e5346f6c59E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN6chrono5naive8datetime13NaiveDateTime18checked_add_signed17ha198667432a56818E: (a: number, b: number, c: bigint, d: number) => void;
  readonly _ZN6chrono5naive8datetime13NaiveDateTime18checked_add_months17hf84ae2a3f31302f2E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys4Date3new17h4c38b058c674ab61E: (a: number) => number;
  readonly _ZN6js_sys4Date19get_timezone_offset17h93e45b6a18af7617E: (a: number) => number;
  readonly _ZN3std4time10SystemTime14duration_since17h71b8588c8e766672E: (a: number, b: number, c: bigint, d: number) => void;
  readonly _ZN6js_sys4Date8get_time17h87ed1bf2e79bf6a3E: (a: number) => number;
  readonly _ZN4core7unicode12unicode_data11conversions8to_lower17hf3f20a052b6aad35E: (a: number, b: number) => void;
  readonly _ZN6chrono5naive8datetime13NaiveDateTime18checked_sub_months17h573599575aac12c7E: (a: number, b: number, c: number) => void;
  readonly _ZN6chrono5naive8datetime13NaiveDateTime16checked_add_days17h357537b382c7648aE: (a: number, b: number, c: bigint) => void;
  readonly _ZN6chrono5naive8datetime13NaiveDateTime16checked_sub_days17h4a87dad32738c116E: (a: number, b: number, c: bigint) => void;
  readonly _ZN6chrono5naive8datetime13NaiveDateTime21signed_duration_since17hc7472b34fd875f9eE: (a: number, b: number, c: number) => void;
  readonly _ZN6chrono5naive7isoweek7IsoWeek8from_yof17hb2e692021126ebc1E: (a: number, b: number, c: number) => number;
  readonly _ZN6chrono5naive4time9NaiveTime14parse_from_str17h637b0978d0629fccE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN6chrono5naive4time9NaiveTime19parse_and_remainder17h91141d5c173e8e1cE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN6chrono5naive4time9NaiveTime22overflowing_add_signed17h95eaf77b1fe648e1E: (a: number, b: number, c: bigint, d: number) => void;
  readonly _ZN6chrono5naive4time9NaiveTime21signed_duration_since17hdf3395d45a136fc6E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN6chrono5naive4time9NaiveTime22overflowing_add_offset17hf507ecbe7ad7b9fdE: (a: number, b: number, c: number) => void;
  readonly _ZN6chrono5naive4time9NaiveTime22overflowing_sub_offset17h990666a88650a52aE: (a: number, b: number, c: number) => void;
  readonly _ZN6chrono6offset5fixed11FixedOffset4east17h8f28a7a5d117e87dE: (a: number) => number;
  readonly _ZN6chrono6offset5fixed11FixedOffset4west17h3af7e24b52426747E: (a: number) => number;
  readonly _ZN6chrono6offset5local5Local5today17h5a5c7fce33ad924cE: (a: number) => void;
  readonly _ZN6chrono6offset5local5Local3now17h02442b29d0169ca6E: (a: number) => void;
  readonly _ZN6js_sys4Date5new_017hf83dbc81565cac22E: () => number;
  readonly _ZN6js_sys4Date34new_with_year_month_day_hr_min_sec17hebe94eb09c8bd821E: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly _ZN6chrono6offset3utc3Utc5today17he98973676304a1b6E: () => number;
  readonly _ZN6chrono11weekday_set10WeekdaySet6insert17h41eddf95c597577dE: (a: number, b: number) => number;
  readonly _ZN6chrono11weekday_set10WeekdaySet6remove17hcc6f35c3ea091cd7E: (a: number, b: number) => number;
  readonly _ZN6chrono11weekday_set10WeekdaySet5first17h23144d17b5717cbeE: (a: number) => number;
  readonly _ZN6chrono11weekday_set10WeekdaySet4last17hd2eed0b39971506bE: (a: number) => number;
  readonly _ZN6chrono11weekday_set10WeekdaySet8is_empty17hc9f171b340bfc64cE: (a: number) => number;
  readonly _ZN6chrono11weekday_set10WeekdaySet3len17hcd2a629137bb3a0dE: (a: number) => number;
  readonly _ZN6chrono5month5Month8num_days17h4055b478d3583b3cE: (a: number, b: number, c: number) => void;
  readonly _ZN5regex8builders6string12RegexBuilder5build17h6472b68a7a53e02cE: (a: number, b: number) => void;
  readonly _ZN5regex8builders6string15RegexSetBuilder5build17h740db5843e590788E: (a: number, b: number) => void;
  readonly _ZN5regex8builders5bytes12RegexBuilder3new17haf1d0fc3414be56bE: (a: number, b: number, c: number) => void;
  readonly _ZN5regex8builders5bytes12RegexBuilder5build17hf7140e8bf392cd25E: (a: number, b: number) => void;
  readonly _ZN5regex8builders5bytes12RegexBuilder15line_terminator17h3e853a3e33b1d840E: (a: number, b: number) => number;
  readonly _ZN5regex8builders5bytes12RegexBuilder10size_limit17ha4a481b0f6a594d5E: (a: number, b: number) => number;
  readonly _ZN5regex8builders5bytes12RegexBuilder14dfa_size_limit17h7c9e36133bc84691E: (a: number, b: number) => number;
  readonly _ZN5regex8builders5bytes15RegexSetBuilder5build17h308c2928e82dd896E: (a: number, b: number) => void;
  readonly _ZN14regex_automata4util10primitives9PatternID4iter17h0f85f8dc5dfb128bE: (a: number, b: number) => void;
  readonly _ZN12regex_syntax3ast5parse6Parser5parse17h9cf7c669aa129389E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN12regex_syntax3hir9translate10Translator9translate17h11baec0d0ce7df28E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN14regex_automata4meta5regex9RegexInfo3new17h705974356962b620E: (a: number, b: number, c: number) => number;
  readonly _ZN14regex_automata4meta8strategy3new17h308dabdcc5f8af12E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN5alloc4sync32arcinner_layout_for_value_layout17h459a21aefb5e0247E: (a: number, b: number, c: number) => void;
  readonly _ZN14regex_automata4meta5regex7Builder9configure17h2a8f608f9a3cc76bE: (a: number, b: number) => number;
  readonly _ZN14regex_automata4meta5regex7Builder6syntax17h6202446830384b55E: (a: number, b: number) => number;
  readonly _ZN14regex_automata4meta5regex7Builder5build17h226c50e8cdaa8e7cE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN5regex9find_byte9find_byte17h9b8872c21c766377E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN5regex5regex5bytes5Regex3new17h416d0cdf49a6d7d5E: (a: number, b: number, c: number) => void;
  readonly _ZN4core3fmt9Formatter9debug_map17h4ae0d4dd8afea31cE: (a: number, b: number) => void;
  readonly _ZN4core3fmt8builders8DebugMap5entry17h530dbc36a1805c51E: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly _ZN4core3fmt8builders8DebugMap6finish17h1529451a3eb9a8caE: (a: number) => number;
  readonly _ZN14regex_automata4util8captures8Captures17get_group_by_name17hf5e52bf98d09028bE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14regex_automata4util8captures8Captures22interpolate_bytes_into17h93d6866e6ce077b2E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN14regex_automata4util8captures8Captures23interpolate_string_into17hf7fb64e3da4a2f7dE: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN5regex8regexset5bytes8RegexSet5empty17h1b60046471d73c0dE: (a: number) => void;
  readonly _ZN14regex_automata4util6search10PatternSet8contains17hd99a5744da0e358bE: (a: number, b: number) => number;
  readonly _ZN5regex8regexset6string8RegexSet5empty17h138fb8fbb979333bE: (a: number) => void;
  readonly _ZN12regex_syntax6escape17hb225cd04a97b7f05E: (a: number, b: number, c: number) => void;
  readonly _ZN5regex8builders6string15RegexSetBuilder15line_terminator17hfb5e9f10daf66f93E: (a: number, b: number) => number;
  readonly _ZN5regex8builders6string15RegexSetBuilder10size_limit17he4fb467b6917cdc5E: (a: number, b: number) => number;
  readonly _ZN5regex8builders6string15RegexSetBuilder14dfa_size_limit17haf4c40bab9fde6c5E: (a: number, b: number) => number;
  readonly _ZN5regex8builders6string12RegexBuilder15line_terminator17h04d6e79d2d57c713E: (a: number, b: number) => number;
  readonly _ZN5regex8builders6string12RegexBuilder10size_limit17he091659bf8c3c2baE: (a: number, b: number) => number;
  readonly _ZN5regex8builders6string12RegexBuilder14dfa_size_limit17h196c3b1280aabbb1E: (a: number, b: number) => number;
  readonly _ZN5regex8builders5bytes15RegexSetBuilder15line_terminator17h50ef5eae4594d947E: (a: number, b: number) => number;
  readonly _ZN5regex8builders5bytes15RegexSetBuilder10size_limit17h9a2fafbe83e0a06dE: (a: number, b: number) => number;
  readonly _ZN5regex8builders5bytes15RegexSetBuilder14dfa_size_limit17hd9048b4db4223962E: (a: number, b: number) => number;
  readonly _ZN5regex8builders6string12RegexBuilder3new17hc6df4e3e97812ad1E: (a: number, b: number, c: number) => void;
  readonly _ZN14regex_automata3nfa8thompson8compiler8Compiler5c_cap17h63fbbfcab5dc65b7E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN14regex_automata3nfa8thompson7builder7Builder5patch17h2932fd741c0d45fdE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN12aho_corasick3nfa13noncontiguous8Compiler3new17hb3bfb12c62d10698E: (a: number, b: number) => void;
  readonly _ZN12aho_corasick3nfa13noncontiguous3NFA11alloc_state17h598a676f78418ad8E: (a: number, b: number, c: number) => void;
  readonly _ZN12aho_corasick3nfa13noncontiguous8Compiler27init_unanchored_start_state17h473be5ad6dd9e626E: (a: number, b: number) => void;
  readonly _ZN12aho_corasick3nfa13noncontiguous8Compiler19add_dead_state_loop17h33ac941ccaf5dc29E: (a: number, b: number) => void;
  readonly _ZN12aho_corasick4util8alphabet12ByteClassSet12byte_classes17h5a2b89e18463bda2E: (a: number, b: number) => void;
  readonly _ZN12aho_corasick3nfa13noncontiguous8Compiler24set_anchored_start_state17h7baad7c4e8f00a35E: (a: number, b: number) => void;
  readonly _ZN12aho_corasick3nfa13noncontiguous8Compiler31add_unanchored_start_state_loop17h0191e07a590db401E: (a: number) => void;
  readonly _ZN12aho_corasick3nfa13noncontiguous8Compiler7densify17h548f98524adf93c7E: (a: number, b: number) => void;
  readonly _ZN12aho_corasick3nfa13noncontiguous8Compiler24fill_failure_transitions17hc888a96cdee622deE: (a: number, b: number) => void;
  readonly _ZN12aho_corasick3nfa13noncontiguous8Compiler35close_start_state_loop_for_leftmost17hbe715b42c0cc5445E: (a: number) => void;
  readonly _ZN12aho_corasick3nfa13noncontiguous8Compiler7shuffle17hf59bbf16a8d5a4f0E: (a: number) => void;
  readonly _ZN12aho_corasick4util9prefilter7Builder5build17hbabaf1268470de30E: (a: number, b: number) => void;
  readonly _ZN12aho_corasick4util9prefilter7Builder3add17h1649a203296f2d41E: (a: number, b: number, c: number) => void;
  readonly _ZN12aho_corasick4util8alphabet12ByteClassSet9set_range17hdd96b14a9d95de63E: (a: number, b: number, c: number) => void;
  readonly _ZN12aho_corasick3nfa13noncontiguous3NFA10iter_trans17h31d888bcd56b3e2cE: (a: number, b: number, c: number) => void;
  readonly _ZN12aho_corasick3nfa13noncontiguous3NFA14add_transition17h066fa9f8d8a7ba07E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN12aho_corasick3nfa13noncontiguous3NFA9add_match17h3dcf1413cfd0738aE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN12aho_corasick9automaton24try_find_overlapping_fwd17hf0376796b3446925E: (a: number, b: number, c: number) => number;
  readonly _ZN12aho_corasick9automaton24try_find_overlapping_fwd17ha3b562c111ad2b43E: (a: number, b: number, c: number) => number;
  readonly _ZN12aho_corasick9automaton24try_find_overlapping_fwd17hce1e1fa5cb019b07E: (a: number, b: number, c: number) => number;
  readonly _ZN12aho_corasick9automaton12try_find_fwd17h752f534c7824ddb9E: (a: number, b: number, c: number) => void;
  readonly _ZN12aho_corasick9automaton12try_find_fwd17h5488a1b42c6400b8E: (a: number, b: number, c: number) => void;
  readonly _ZN12aho_corasick9automaton12try_find_fwd17hdc48107e56a574d0E: (a: number, b: number, c: number) => void;
  readonly _ZN12regex_syntax3hir17ClassUnicodeRange3new17hd7916d191fc1eb63E: (a: number, b: number, c: number) => void;
  readonly _ZN12regex_syntax3hir15ClassBytesRange3new17he8489d8ddd46a0ffE: (a: number, b: number, c: number) => void;
  readonly _ZN12regex_syntax3hir12ClassUnicode6negate17h7f5ecff3f5cdf9dfE: (a: number) => void;
  readonly _ZN12regex_syntax3hir10ClassBytes6negate17ha78e61d361a33f5cE: (a: number) => void;
  readonly _ZN12regex_syntax3hir5Class7literal17h0606a926bc04d9e7E: (a: number, b: number) => void;
  readonly _ZN12regex_syntax3hir10Properties5empty17he42dc02aefff67efE: () => number;
  readonly _ZN12regex_syntax3hir10Properties7literal17h7bc0c067daab3aeeE: (a: number) => number;
  readonly _ZN12regex_syntax3hir10Properties5class17hcfd9b7067a596821E: (a: number) => number;
  readonly _ZN12regex_syntax3hir10ClassBytes5empty17hab7930e7647b1c88E: (a: number) => void;
  readonly _ZN4core5slice4sort6stable14driftsort_main17hb4ed02eda5c8e75fE: (a: number, b: number, c: number) => void;
  readonly _ZN4core5slice4sort6stable14driftsort_main17hcaf3d4488c0ebebaE: (a: number, b: number, c: number) => void;
  readonly _ZN4core3fmt9Formatter9debug_set17ha3e7ef802c6f8ee3E: (a: number, b: number) => void;
  readonly _ZN4core3fmt8builders8DebugSet5entry17hac40c6acd20dddf1E: (a: number, b: number, c: number) => number;
  readonly _ZN4core3fmt8builders8DebugSet6finish17hd31fbe5bd9639eefE: (a: number) => number;
  readonly _ZN4core3fmt9Formatter26debug_struct_field2_finish17h29b8c43c96265af5E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number) => number;
  readonly _ZN4core3fmt9Formatter26debug_struct_field1_finish17h2cc0103c10460de4E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
  readonly _ZN4core3fmt9Formatter26debug_struct_field3_finish17h08b038852a0ec93eE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number) => number;
  readonly _ZN4core5slice4sort6stable14driftsort_main17h5dc25084c0ab1883E: (a: number, b: number, c: number) => void;
  readonly _ZN4core5slice4sort6stable9quicksort9quicksort17h5d384128d9f11eceE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN4core9panicking13assert_failed17h41603dd9b559847eE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN4core9panicking19assert_failed_inner17h9f8bd615dc9fd7aaE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN4core9panicking13assert_failed17h838b124f2427c2b9E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN6memchr6memmem8searcher22searcher_kind_one_byte17h254af5d3c29e0914E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN4core9panicking13assert_failed17h55a73ed679b94a89E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN6memchr4arch3all6twoway6Suffix7forward17h78f79b5f5a890d4cE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6memchr4arch3all6twoway5Shift7forward17h16a487ad57d510b2E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN6memchr6memmem8searcher21searcher_kind_two_way17hcde80562d571b5dcE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN6memchr6memmem8searcher36searcher_kind_two_way_with_prefilter17h1c0aae55e040654eE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN6memchr6memmem8searcher21searcher_kind_simd12817h6277df3d2804a3acE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN6memchr6memmem8searcher22prefilter_kind_simd12817hf1ceb88a07d1fd3fE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN12aho_corasick4util5error10MatchError24invalid_input_unanchored17hd1e1d98d97b8995fE: () => number;
  readonly _ZN12aho_corasick4util5error10MatchError22invalid_input_anchored17h9fd4ca748a2c49e5E: () => number;
  readonly _ZN12aho_corasick3nfa13noncontiguous3NFA12iter_matches17h7bc23aa9ce22c8acE: (a: number, b: number, c: number) => void;
  readonly _ZN14regex_automata3dfa7onepass7Builder3new17h3fdb52ff24f60f5eE: (a: number) => void;
  readonly _ZN14regex_automata3dfa7onepass7Builder5build17h3f5f91f17ab9aff3E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14regex_automata3dfa7onepass7Builder14build_from_nfa17h65113c5ae792f1b6E: (a: number, b: number, c: number) => void;
  readonly _ZN14regex_automata3dfa7onepass7Builder9configure17hd393783cf9be3f61E: (a: number, b: number) => number;
  readonly _ZN14regex_automata3dfa7onepass7Builder6syntax17h08e62b7553c4af70E: (a: number, b: number) => number;
  readonly _ZN14regex_automata3dfa7onepass7Builder8thompson17hc5dd61587cecd229E: (a: number, b: number) => number;
  readonly _ZN14regex_automata3dfa7onepass3DFA12new_from_nfa17he19af99a34d8b1b8E: (a: number, b: number) => void;
  readonly _ZN14regex_automata3dfa7onepass3DFA12always_match17h8c6c387351ef328cE: (a: number) => void;
  readonly _ZN14regex_automata3nfa8thompson3nfa3NFA12always_match17hba3746aeacb1d771E: () => number;
  readonly _ZN14regex_automata3dfa7onepass3DFA11never_match17h6897389255beb9c8E: (a: number) => void;
  readonly _ZN14regex_automata3nfa8thompson3nfa3NFA11never_match17h6bc73c094f355ba3E: () => number;
  readonly _ZN14regex_automata3dfa7onepass3DFA20try_search_slots_imp17h2b67748bfcd89bbdE: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN14regex_automata3dfa7onepass5Cache3new17h92c90f68cda9097cE: (a: number, b: number) => void;
  readonly _ZN14regex_automata3dfa7onepass5Cache5reset17h8fabeedc24f533d1E: (a: number, b: number) => void;
  readonly _ZN14regex_automata6hybrid3dfa3DFA3new17h342f525a8184de1dE: (a: number, b: number, c: number) => void;
  readonly _ZN14regex_automata6hybrid3dfa7Builder14build_from_nfa17haf1224cde1e787d6E: (a: number, b: number, c: number) => void;
  readonly _ZN14regex_automata6hybrid3dfa3DFA12always_match17h07fd917992a63384E: (a: number) => void;
  readonly _ZN14regex_automata6hybrid3dfa3DFA11never_match17h09639dab181d6495E: (a: number) => void;
  readonly _ZN14regex_automata6hybrid3dfa3DFA7builder17hb5662c8026247943E: (a: number) => void;
  readonly _ZN14regex_automata6hybrid3dfa3DFA12create_cache17hbbe58b1c97dec16cE: (a: number, b: number) => void;
  readonly _ZN14regex_automata6hybrid3dfa5Cache3new17h86dc62d625736dd0E: (a: number, b: number) => void;
  readonly _ZN14regex_automata6hybrid3dfa3DFA11reset_cache17he524a824519fa452E: (a: number, b: number) => void;
  readonly _ZN14regex_automata6hybrid3dfa4Lazy16cache_next_state17h57271dad9a31898bE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14regex_automata4util8alphabet4Unit3eoi17h24a3b13f189728e0E: (a: number) => number;
  readonly _ZN14regex_automata6hybrid3dfa5Cache5reset17h714f3f8ec3da6e50E: (a: number, b: number) => void;
  readonly _ZN14regex_automata6hybrid3dfa4Lazy17cache_start_group17he7cb44d32045edc1E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN14regex_automata6hybrid3dfa7LazyRef16get_cached_state17h9473503e2dd50ccbE: (a: number, b: number) => number;
  readonly _ZN14regex_automata6hybrid3dfa7LazyRef7dead_id17h7a034a2cc895fc7dE: (a: number) => number;
  readonly _ZN14regex_automata6hybrid3dfa6Config9prefilter17h87e390d295880e61E: (a: number, b: number, c: number) => void;
  readonly _ZN14regex_automata6hybrid3dfa6Config4quit17h854b0fb77d750559E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14regex_automata6hybrid3dfa6Config8get_quit17h33a42d88b5dd8714E: (a: number, b: number) => number;
  readonly _ZN14regex_automata6hybrid3dfa6Config26get_minimum_cache_capacity17h38e6a5cbc20b4ed9E: (a: number, b: number, c: number) => void;
  readonly _ZN14regex_automata6hybrid3dfa7Builder3new17h970f3dc05cfbab5cE: (a: number) => void;
  readonly _ZN14regex_automata6hybrid3dfa7Builder5build17h080beca09e94538bE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14regex_automata6hybrid3dfa7Builder9configure17hbbbffc8c1d88082fE: (a: number, b: number) => number;
  readonly _ZN14regex_automata6hybrid3dfa7Builder6syntax17h4445a0246e440716E: (a: number, b: number) => number;
  readonly _ZN14regex_automata6hybrid3dfa7Builder8thompson17hd737f2bdaa79756bE: (a: number, b: number) => number;
  readonly _ZN14regex_automata6hybrid3dfa34skip_empty_utf8_splits_overlapping17h0055e49512811a02E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN14regex_automata6hybrid6search20find_overlapping_fwd17h0c03623f9924933cE: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN14regex_automata6hybrid5regex5Regex3new17h23fb7d9a0a6178aaE: (a: number, b: number, c: number) => void;
  readonly _ZN14regex_automata6hybrid5regex7Builder5build17h0794730d575bb386E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14regex_automata6hybrid5regex5Regex7builder17h8ef3cca190c82526E: (a: number) => void;
  readonly _ZN14regex_automata6hybrid5regex5Regex12create_cache17h53f2e4259cb82c3fE: (a: number, b: number) => void;
  readonly _ZN14regex_automata6hybrid5regex5Regex11reset_cache17h72b89734a088fc60E: (a: number, b: number) => void;
  readonly _ZN14regex_automata6hybrid6search8find_fwd17hacbce31e5f7a8417E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14regex_automata4util5empty15skip_splits_fwd17h203510df116a3322E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN14regex_automata6hybrid6search8find_rev17haa1f1c680f3ca964E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14regex_automata4util5empty15skip_splits_rev17hdef56779c4b178f8E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN14regex_automata6hybrid5regex5Regex11pattern_len17hd00ca9aaf25ce36fE: (a: number) => number;
  readonly _ZN14regex_automata6hybrid5regex5Cache3new17hb1781ad6b5862411E: (a: number, b: number) => void;
  readonly _ZN14regex_automata6hybrid5regex5Cache5reset17h657a66112cf3f35eE: (a: number, b: number) => void;
  readonly _ZN14regex_automata6hybrid5regex5Cache12memory_usage17h7bfe1e6bf106f846E: (a: number) => number;
  readonly _ZN14regex_automata6hybrid5regex7Builder3new17he662e80c4c22a899E: (a: number) => void;
  readonly _ZN14regex_automata6hybrid5regex7Builder6syntax17he663845cff0bd183E: (a: number, b: number) => number;
  readonly _ZN14regex_automata6hybrid5regex7Builder8thompson17hccecc4cf6e8f0882E: (a: number, b: number) => number;
  readonly _ZN14regex_automata6hybrid5regex7Builder3dfa17h612d233d804b6b06E: (a: number, b: number) => number;
  readonly _ZN14regex_automata4util6search10MatchError7gave_up17h0fb91975f5956aefE: (a: number) => number;
  readonly _ZN14regex_automata4util6search10MatchError4quit17hc199d12ea8566bacE: (a: number, b: number) => number;
  readonly _ZN14regex_automata4util11determinize5state5State13match_pattern17hacaaafecfddd1653E: (a: number, b: number) => number;
  readonly _ZN14regex_automata6hybrid6search20find_overlapping_rev17hc0dc9a83db650d64E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN14regex_automata4meta7limited26hybrid_try_search_half_rev17hb064b11aa207fdd2E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN14regex_automata4meta5regex5Regex3new17h6d341517c11ca5d6E: (a: number, b: number, c: number) => void;
  readonly _ZN14regex_automata4meta5regex5Regex12create_cache17ha826fb95f7588f90E: (a: number, b: number) => void;
  readonly _ZN14regex_automata4meta5regex5Regex12captures_len17h79fd77a8f1ea88ffE: (a: number) => number;
  readonly _ZN14regex_automata4meta5regex5Cache3new17h54d63d37b2cbc1b3E: (a: number, b: number) => void;
  readonly _ZN14regex_automata4meta5regex5Cache5reset17h829c7c53574c5f55E: (a: number, b: number) => void;
  readonly _ZN14regex_automata4meta5regex5Cache12memory_usage17h232ad26d2658f385E: (a: number) => number;
  readonly _ZN14regex_automata4meta5regex6Config9prefilter17h96d0de0b2a2810caE: (a: number, b: number, c: number) => void;
  readonly _ZN14regex_automata4meta5regex7Builder14build_from_hir17h0399ffcb7b2ef88eE: (a: number, b: number, c: number) => void;
  readonly _ZN12regex_syntax3hir7literal9Extractor7extract17h88bb11d1b0d54ae0E: (a: number, b: number, c: number) => void;
  readonly _ZN12regex_syntax3hir7literal3Seq22optimize_by_preference17hfdc6a34e58041814E: (a: number, b: number) => void;
  readonly _ZN14regex_automata4util9prefilter9Prefilter11from_choice17h7bd21f51a3456551E: (a: number, b: number, c: number) => void;
  readonly _ZN12regex_syntax3hir10Properties4look17ha6bc6f1031469bdcE: (a: number) => number;
  readonly _ZN12regex_syntax3hir10Repetition4with17hcf7e6fb0d3994c01E: (a: number, b: number, c: number) => void;
  readonly _ZN12regex_syntax3hir10Properties10repetition17h7da00713423277faE: (a: number) => number;
  readonly _ZN12regex_syntax3hir3Hir6concat17hf931ce694bd8147fE: (a: number, b: number) => void;
  readonly _ZN12regex_syntax3hir3Hir11alternation17h38d922f1a0291f62E: (a: number, b: number) => void;
  readonly _ZN14regex_automata4meta6stopat26hybrid_try_search_half_fwd17h529d863e3e53d3edE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN12aho_corasick11ahocorasick18AhoCorasickBuilder10build_auto17h387984d877ea4b39E: (a: number, b: number, c: number) => void;
  readonly _ZN12aho_corasick3nfa10contiguous7Builder24build_from_noncontiguous17hc07890795313c7a9E: (a: number, b: number, c: number) => void;
  readonly _ZN12aho_corasick3dfa7Builder24build_from_noncontiguous17hb387b0660b81181dE: (a: number, b: number, c: number) => void;
  readonly _ZN12regex_syntax3hir3Hir9into_kind17h41bd7654133232f3E: (a: number, b: number) => void;
  readonly _ZN14regex_automata3nfa8thompson8compiler8Compiler3new17h7253b1d3a441a888E: (a: number) => void;
  readonly _ZN14regex_automata3nfa8thompson8compiler8Compiler9configure17hc0c6eff6f98d92e0E: (a: number, b: number) => number;
  readonly _ZN12aho_corasick11ahocorasick11AhoCorasick12memory_usage17hc88a1596fa64997eE: (a: number) => number;
  readonly _ZN14regex_automata4meta8strategy4Core13search_nofail17h0c0f919e760b011bE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14regex_automata4meta8strategy4Core18search_half_nofail17h0c30a9dcc4da86ffE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14regex_automata4meta8strategy4Core19search_slots_nofail17h49f5d5b3cee9f6a2E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN14regex_automata4meta8strategy4Core15is_match_nofail17h9b763e442502f7f7E: (a: number, b: number, c: number) => number;
  readonly _ZN14regex_automata3nfa8thompson6pikevm6PikeVM21which_overlapping_imp17he46d8ae26f94f712E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14regex_automata4meta8wrappers18ReverseHybridCache5reset17hea7dfa4978d62b4eE: (a: number, b: number) => void;
  readonly _ZN14regex_automata4meta8wrappers6PikeVM12create_cache17h44505f18ef3805daE: (a: number, b: number) => void;
  readonly _ZN14regex_automata4meta8wrappers11PikeVMCache5reset17h2abbd9562a4ef5fcE: (a: number, b: number) => void;
  readonly _ZN14regex_automata4meta8wrappers23BoundedBacktrackerCache5reset17he17845ce04cc1a28E: (a: number, b: number) => void;
  readonly _ZN14regex_automata4meta8wrappers7OnePass12create_cache17h17f7bd146f423616E: (a: number, b: number) => void;
  readonly _ZN14regex_automata4meta8wrappers12OnePassCache5reset17h4fb8f2f5bb157490E: (a: number, b: number) => void;
  readonly _ZN14regex_automata4meta8wrappers6Hybrid12create_cache17hfe8cabcfda576be2E: (a: number, b: number) => void;
  readonly _ZN14regex_automata4meta8wrappers11HybridCache5reset17hf6a7a88e9df41d20E: (a: number, b: number) => void;
  readonly _ZN14regex_automata4meta8wrappers13ReverseHybrid12create_cache17h4d445d62648df8c4E: (a: number, b: number) => void;
  readonly _ZN14regex_automata3nfa8thompson9backtrack20min_visited_capacity17h1c71a22625dd2059E: (a: number, b: number) => number;
  readonly _ZN14regex_automata3nfa8thompson9backtrack6Config9prefilter17h2bb327c4dcca971bE: (a: number, b: number, c: number) => void;
  readonly _ZN14regex_automata3nfa8thompson9backtrack7Builder3new17hd44ddfa96a476b5cE: (a: number) => void;
  readonly _ZN14regex_automata3nfa8thompson9backtrack7Builder5build17h36dada1a98bb1afdE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14regex_automata3nfa8thompson9backtrack7Builder14build_from_nfa17hdf5e1652efff4dfcE: (a: number, b: number, c: number) => void;
  readonly _ZN14regex_automata3nfa8thompson9backtrack7Builder9configure17h2963ecf2d7ce948dE: (a: number, b: number) => number;
  readonly _ZN14regex_automata3nfa8thompson9backtrack7Builder6syntax17ha370b3682374f834E: (a: number, b: number) => number;
  readonly _ZN14regex_automata3nfa8thompson9backtrack7Builder8thompson17h5d918dfa1a94ee34E: (a: number, b: number) => number;
  readonly _ZN14regex_automata3nfa8thompson9backtrack18BoundedBacktracker3new17h4e5b1eb2a968bd98E: (a: number, b: number, c: number) => void;
  readonly _ZN14regex_automata3nfa8thompson9backtrack18BoundedBacktracker12new_from_nfa17h72c96db9451b1d93E: (a: number, b: number) => void;
  readonly _ZN14regex_automata3nfa8thompson9backtrack18BoundedBacktracker12always_match17h9e70bc250754544dE: (a: number) => void;
  readonly _ZN14regex_automata3nfa8thompson9backtrack18BoundedBacktracker11never_match17h28cf1f8f53fc5881E: (a: number) => void;
  readonly _ZN14regex_automata3nfa8thompson9backtrack18BoundedBacktracker7builder17hb7ebb3e0d06c0bd2E: (a: number) => void;
  readonly _ZN14regex_automata3nfa8thompson9backtrack18BoundedBacktracker15create_captures17h487edf1a2266dd30E: (a: number, b: number) => void;
  readonly _ZN14regex_automata3nfa8thompson9backtrack18BoundedBacktracker20try_search_slots_imp17h3e19e5e9f9f0a0a8E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN14regex_automata4util5empty15skip_splits_fwd17hb843267489388ebdE: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN14regex_automata4util6search10MatchError17haystack_too_long17h59a5677efe9383efE: (a: number) => number;
  readonly _ZN14regex_automata3nfa8thompson9backtrack8div_ceil17he4fcc6f83b3f047dE: (a: number, b: number) => number;
  readonly _ZN14regex_automata3nfa8thompson7builder7Builder5clear17hdb76d47dc53ce39dE: (a: number) => void;
  readonly _ZN14regex_automata3nfa8thompson7builder7Builder5build17h8168fb5884c3a2d6E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14regex_automata4util8captures14GroupInfoInner15add_first_group17h7f05a8f5484d9055E: (a: number, b: number) => void;
  readonly _ZN14regex_automata3nfa8thompson7builder7Builder13start_pattern17h1e1489ce4d1a4f79E: (a: number, b: number) => void;
  readonly _ZN14regex_automata3nfa8thompson7builder7Builder14finish_pattern17h33289173de1e38a0E: (a: number, b: number, c: number) => void;
  readonly _ZN14regex_automata3nfa8thompson7builder7Builder18current_pattern_id17h479bcb39f6f6a698E: (a: number) => number;
  readonly _ZN14regex_automata3nfa8thompson7builder7Builder9add_empty17ha7a1dbf1be692514E: (a: number, b: number) => void;
  readonly _ZN14regex_automata3nfa8thompson7builder7Builder9add_union17h60375c1bc9f9c7c9E: (a: number, b: number, c: number) => void;
  readonly _ZN14regex_automata3nfa8thompson7builder7Builder17add_union_reverse17habb4b3ef870fca89E: (a: number, b: number, c: number) => void;
  readonly _ZN14regex_automata3nfa8thompson7builder7Builder9add_range17he3805141025c051cE: (a: number, b: number, c: number) => void;
  readonly _ZN14regex_automata3nfa8thompson7builder7Builder10add_sparse17h090e3a40bfc31f3eE: (a: number, b: number, c: number) => void;
  readonly _ZN14regex_automata3nfa8thompson7builder7Builder8add_look17hcd9d526580939dabE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14regex_automata3nfa8thompson7builder7Builder17add_capture_start17h61f8706a6233918eE: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN14regex_automata3nfa8thompson7builder7Builder15add_capture_end17h68052929c4a262f3E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14regex_automata3nfa8thompson7builder7Builder8add_fail17hbadcce2a273ec4c9E: (a: number, b: number) => void;
  readonly _ZN14regex_automata3nfa8thompson7builder7Builder9add_match17hdb50042ca14b03dbE: (a: number, b: number) => void;
  readonly _ZN14regex_automata3nfa8thompson8compiler8Compiler5build17h6bf852c30cba69ebE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN12regex_syntax6parser13ParserBuilder5build17h4e9797b3b303801cE: (a: number, b: number) => void;
  readonly _ZN12regex_syntax6parser6Parser5parse17h128329bdff62c7e4E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14regex_automata3nfa8thompson8compiler8Compiler10c_at_least17h42b9aa16ef2b6bf6E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN14regex_automata3nfa8thompson8compiler8Compiler5patch17hc39638ba3a04d950E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14regex_automata3nfa8thompson8compiler8Compiler14build_from_hir17h1993a30997dba78eE: (a: number, b: number, c: number) => void;
  readonly _ZN14regex_automata3nfa8thompson8compiler8Compiler6syntax17he52568158b6ea3caE: (a: number, b: number) => number;
  readonly _ZN12regex_syntax4utf813Utf8Sequences3new17h576ac398c143d925E: (a: number, b: number, c: number) => void;
  readonly _ZN12regex_syntax4utf812Utf8Sequence7reverse17hb03754cf8e457e02E: (a: number) => void;
  readonly _ZN14regex_automata3nfa8thompson8compiler8Compiler9add_union17ha273ac6c8066a919E: (a: number, b: number) => void;
  readonly _ZN14regex_automata3nfa8thompson8compiler8Compiler9add_empty17hb05c9eef0aea87b3E: (a: number, b: number) => void;
  readonly _ZN14regex_automata3nfa8thompson8compiler8Compiler7c_empty17hdd5315827f9a6054E: (a: number, b: number) => void;
  readonly _ZN14regex_automata3nfa8thompson8compiler8Compiler6c_fail17hb3515c5f6f307396E: (a: number, b: number) => void;
  readonly _ZN14regex_automata3nfa8thompson8compiler8Compiler13start_pattern17hb42aeeb0969ea27bE: (a: number, b: number) => void;
  readonly _ZN14regex_automata3nfa8thompson8compiler8Compiler14finish_pattern17h9ea57440756a2fa0E: (a: number, b: number, c: number) => void;
  readonly _ZN14regex_automata3nfa8thompson8compiler8Compiler9add_match17h8302af34ac2aa886E: (a: number, b: number) => void;
  readonly _ZN14regex_automata3nfa8thompson3nfa3NFA3new17h41a7544a3b527dfcE: (a: number, b: number, c: number) => void;
  readonly _ZN14regex_automata3nfa8thompson3nfa3NFA8compiler17h3eac450752d34b4aE: (a: number) => void;
  readonly _ZN14regex_automata3nfa8thompson3nfa3NFA8patterns17hfa00fdd62c05672eE: (a: number, b: number) => void;
  readonly _ZN14regex_automata3nfa8thompson6pikevm6Config9prefilter17h62aed67f0615c450E: (a: number, b: number, c: number) => void;
  readonly _ZN14regex_automata3nfa8thompson6pikevm7Builder3new17h473259860756451bE: (a: number) => void;
  readonly _ZN14regex_automata3nfa8thompson6pikevm7Builder5build17ha1a660ac52dac4c2E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14regex_automata3nfa8thompson6pikevm7Builder14build_from_nfa17hbb724c0d16a2ff58E: (a: number, b: number, c: number) => void;
  readonly _ZN14regex_automata3nfa8thompson6pikevm7Builder9configure17he8d0c664ef36fc8eE: (a: number, b: number) => number;
  readonly _ZN14regex_automata3nfa8thompson6pikevm7Builder6syntax17h8dd7b36bcdf9f513E: (a: number, b: number) => number;
  readonly _ZN14regex_automata3nfa8thompson6pikevm7Builder8thompson17h176ffc5dea3acd35E: (a: number, b: number) => number;
  readonly _ZN14regex_automata3nfa8thompson6pikevm6PikeVM3new17h02e2eaf548b1e703E: (a: number, b: number, c: number) => void;
  readonly _ZN14regex_automata3nfa8thompson6pikevm6PikeVM12new_from_nfa17hc66c557b93fdd85eE: (a: number, b: number) => void;
  readonly _ZN14regex_automata3nfa8thompson6pikevm6PikeVM12always_match17h003ccbf3c3229999E: (a: number) => void;
  readonly _ZN14regex_automata3nfa8thompson6pikevm6PikeVM11never_match17hc98bb571a5d69a7bE: (a: number) => void;
  readonly _ZN14regex_automata3nfa8thompson6pikevm6PikeVM7builder17h8517fd0da4849407E: (a: number) => void;
  readonly _ZN14regex_automata3nfa8thompson6pikevm6PikeVM15create_captures17he438104a63c4794bE: (a: number, b: number) => void;
  readonly _ZN14regex_automata3nfa8thompson6pikevm6PikeVM12create_cache17ha58c2bf89490345eE: (a: number, b: number) => void;
  readonly _ZN14regex_automata3nfa8thompson6pikevm6PikeVM11reset_cache17ha454e0956b232fbdE: (a: number, b: number) => void;
  readonly _ZN14regex_automata3nfa8thompson6pikevm6PikeVM16search_slots_imp17hb1e2fca1094c9d57E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN14regex_automata4util5empty15skip_splits_fwd17hc0b2db82c5e2e12bE: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN14regex_automata3nfa8thompson6pikevm5Cache3new17ha23cedee66724b5eE: (a: number, b: number) => void;
  readonly _ZN14regex_automata3nfa8thompson6pikevm5Cache5reset17h3d7571d83d38ba32E: (a: number, b: number) => void;
  readonly _ZN14regex_automata4util8alphabet4Unit12is_word_byte17hcf89a5e34775d344E: (a: number) => number;
  readonly _ZN14regex_automata4util8alphabet7ByteSet8contains17h8072e2c0068faeb6E: (a: number, b: number) => number;
  readonly _ZN14regex_automata4util8captures8Captures3all17h74f9b76fd7d47724E: (a: number, b: number) => void;
  readonly _ZN14regex_automata4util8captures8Captures7matches17h27ae333db3e432c2E: (a: number, b: number) => void;
  readonly _ZN14regex_automata4util8captures8Captures4iter17h1b55f3bf5b0d7550E: (a: number, b: number) => void;
  readonly _ZN14regex_automata4util8captures8Captures9group_len17h696e809b74780c09E: (a: number) => number;
  readonly _ZN14regex_automata4util8captures8Captures18interpolate_string17h3cd9a17b6bc703a5E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN14regex_automata4util11interpolate12find_cap_ref17h778d189fabb964c6E: (a: number, b: number, c: number) => void;
  readonly _ZN14regex_automata4util8captures8Captures17interpolate_bytes17hfd95e2a17e104e25E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN14regex_automata4util8captures9GroupInfo5empty17h6935935ec5d1a63dE: () => number;
  readonly _ZN14regex_automata4util8captures14GroupInfoInner17fixup_slot_ranges17hdf7949f4134e5ec2E: (a: number, b: number) => void;
  readonly _ZN14regex_automata4util8captures14GroupInfoError9duplicate17hcddf2e84acc2fd7eE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN4core5ascii14escape_default17h16edcba941486858E: (a: number, b: number) => void;
  readonly _ZN4core3str8converts9from_utf817hf7105bff613ea8b3E: (a: number, b: number, c: number) => void;
  readonly _ZN4core7unicode12unicode_data15grapheme_extend11lookup_slow17hce4f4e31304ea3a0E: (a: number) => number;
  readonly _ZN4core7unicode9printable12is_printable17h5944e2f10c2bc859E: (a: number) => number;
  readonly _ZN12regex_syntax21try_is_word_character17h3639ddb7a11f5c3eE: (a: number) => number;
  readonly _ZN12aho_corasick11ahocorasick28enforce_anchored_consistency17h39a7c55c7708a993E: (a: number, b: number) => number;
  readonly _ZN12aho_corasick6packed7pattern8Patterns5reset17h93a019b32fa100dcE: (a: number) => void;
  readonly _ZN12aho_corasick6packed7pattern8Patterns3add17h477c17a818019852E: (a: number, b: number, c: number) => void;
  readonly _ZN12aho_corasick6packed3api7Builder5build17h75c4fa34d16aacc8E: (a: number, b: number) => void;
  readonly _ZN12aho_corasick6packed9rabinkarp9RabinKarp7find_at17hc6f844912efcec17E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN12aho_corasick6packed3api8Searcher12find_in_slow17haa497278d41c94beE: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN14regex_automata4util9prefilter9Prefilter15from_hir_prefix17h693c65da5888419cE: (a: number, b: number, c: number) => void;
  readonly _ZN14regex_automata4util6syntax5parse17hd2e71c27175fc3caE: (a: number, b: number, c: number) => void;
  readonly _ZN14regex_automata4util6syntax10parse_with17h6b7473552e868f22E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN14regex_automata4util11determinize5state5State9match_len17ha5747a089eb04167E: (a: number) => number;
  readonly _ZN14regex_automata4util6search10PatternSet3new17hb5ede6163dc4fcdcE: (a: number, b: number) => void;
  readonly _ZN14regex_automata4util6search10PatternSet6insert17h506d8d1829ce2217E: (a: number, b: number) => number;
  readonly _ZN14regex_automata4util6search10PatternSet10try_insert17h47c9dc3e0d84922fE: (a: number, b: number, c: number) => void;
  readonly _ZN14regex_automata4util6search10MatchError3new17hd26a7b11ed13fcaaE: (a: number) => number;
  readonly _ZN14regex_automata4util6search10MatchError20unsupported_anchored17h2e400645813bc696E: (a: number, b: number) => number;
  readonly _ZN4core3fmt9Formatter25debug_tuple_field2_finish17hfa2e91caca265e51E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
  readonly _ZN4core3fmt9Formatter25debug_tuple_field3_finish17ha223c4219634fdb8E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => number;
  readonly _ZN14regex_automata4util10primitives7StateID4iter17h3fb2f1fb8588178dE: (a: number, b: number) => void;
  readonly _ZN4core5slice4sort6stable14driftsort_main17h28fd565590f462a2E: (a: number, b: number, c: number) => void;
  readonly _ZN4core5slice4sort6stable14driftsort_main17hac930f2fab428459E: (a: number, b: number, c: number) => void;
  readonly _ZN4core5slice4sort6stable9quicksort9quicksort17h8c25985cbac9443fE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN4core5slice4sort6stable9quicksort9quicksort17h65c0005c6edf1808E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN4core9panicking13assert_failed17hbe0a452d1253fd74E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN4core9panicking13assert_failed17he61f063c6b413b32E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN12aho_corasick11ahocorasick11AhoCorasick10match_kind17h744ef81ec3574735E: (a: number) => number;
  readonly _ZN12aho_corasick11ahocorasick11AhoCorasick15min_pattern_len17h5860791b3548ee69E: (a: number) => number;
  readonly _ZN12aho_corasick11ahocorasick11AhoCorasick15max_pattern_len17hfa3d84a5886e27beE: (a: number) => number;
  readonly _ZN12aho_corasick11ahocorasick11AhoCorasick12patterns_len17h6c4250f6b63af525E: (a: number) => number;
  readonly _ZN5alloc6string6String15from_utf8_lossy17h6f400f91ec26d976E: (a: number, b: number, c: number) => void;
  readonly _ZN12aho_corasick4util6buffer6Buffer3new17h81d05831929263b6E: (a: number, b: number) => void;
  readonly _ZN12aho_corasick4util6buffer6Buffer11free_buffer17h2e87fa7ef5925820E: (a: number, b: number) => void;
  readonly _ZN12aho_corasick4util6buffer6Buffer4roll17h6ca21c4e1fff8b3eE: (a: number) => void;
  readonly _ZN12aho_corasick4util5error10MatchError3new17h1923018eec215753E: (a: number, b: number) => number;
  readonly _ZN12aho_corasick4util5error10MatchError18unsupported_stream17h40a3d453e071779fE: (a: number) => number;
  readonly _ZN12aho_corasick4util5error10MatchError23unsupported_overlapping17hc5af8958b7f4b4fbE: (a: number) => number;
  readonly _ZN12aho_corasick4util5error10MatchError17unsupported_empty17h2c43556cf0d943f0E: () => number;
  readonly _ZN12aho_corasick4util10primitives9PatternID4iter17hc8f939001fd87eddE: (a: number, b: number) => void;
  readonly _ZN12aho_corasick4util10primitives7StateID4iter17hae65d4f7d86c87a1E: (a: number, b: number) => void;
  readonly _ZN4core5slice4sort6stable14driftsort_main17h017349554b2accc8E: (a: number, b: number, c: number) => void;
  readonly _ZN4core5slice4sort6stable9quicksort9quicksort17hae3a3f6ce0e40a50E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN4core5slice4sort6stable9quicksort9quicksort17hed6b80a0e5f42f36E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN4core5slice4sort6stable9quicksort9quicksort17h591f32c36619f2d7E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN4core9panicking13assert_failed17he8c256cba95efde2E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN12regex_syntax3ast5parse6Parser3new17h0e3353a4a41d03f9E: (a: number) => void;
  readonly _ZN12regex_syntax3ast5parse6Parser19parse_with_comments17h03bf310fa3aad48dE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN4core3str5count23char_count_general_case17h104fa44a6d2a3f88E: (a: number, b: number) => number;
  readonly _ZN12regex_syntax3ast6Concat8into_ast17hf18d3c233416c378E: (a: number, b: number) => void;
  readonly _ZN12regex_syntax3ast11Alternation8into_ast17h982c130536e491b4E: (a: number, b: number) => void;
  readonly _ZN12regex_syntax3ast3Ast10repetition17h72c9275b20c6ff05E: (a: number, b: number) => void;
  readonly _ZN12regex_syntax3ast3Ast5empty17h645b50f2517228f4E: (a: number, b: number) => void;
  readonly _ZN4core7unicode12unicode_data10alphabetic6lookup17h3e24749e2e134a05E: (a: number) => number;
  readonly _ZN4core7unicode12unicode_data1n6lookup17h4aa972c5a4fe2c38E: (a: number) => number;
  readonly _ZN12regex_syntax3ast14ClassAsciiKind9from_name17hd35cf99766926556E: (a: number, b: number) => number;
  readonly _ZN12regex_syntax3ast7visitor11HeapVisitor3pop17hbdd2402899aef136E: (a: number, b: number, c: number) => void;
  readonly _ZN12regex_syntax3ast7visitor11HeapVisitor12induct_class17hf1e2cdaa01c5e6d2E: (a: number, b: number, c: number) => void;
  readonly _ZN12regex_syntax3ast7visitor11HeapVisitor9pop_class17h90e38f7cbba34375E: (a: number, b: number, c: number) => void;
  readonly _ZN12regex_syntax5error5Spans6notate17h6eec578b1a6260d7E: (a: number, b: number) => void;
  readonly _ZN12regex_syntax3ast3Ast5flags17h6cba4082b84fd7b0E: (a: number, b: number) => void;
  readonly _ZN12regex_syntax3ast3Ast7literal17hb2e9343f387d2cf8E: (a: number, b: number) => void;
  readonly _ZN12regex_syntax3ast3Ast3dot17h5612672f8d409d47E: (a: number, b: number) => void;
  readonly _ZN12regex_syntax3ast3Ast9assertion17h912652b1b9d874d4E: (a: number, b: number) => void;
  readonly _ZN12regex_syntax3ast3Ast13class_unicode17h978c63b074bb1a39E: (a: number, b: number) => void;
  readonly _ZN12regex_syntax3ast3Ast10class_perl17hbc0cdb4dcc557411E: (a: number, b: number) => void;
  readonly _ZN12regex_syntax3ast3Ast15class_bracketed17hb706b077277de237E: (a: number, b: number) => void;
  readonly _ZN12regex_syntax3ast3Ast5group17hc0187a257b0159c8E: (a: number, b: number) => void;
  readonly _ZN12regex_syntax3ast3Ast11alternation17hb04bdbae77f9e272E: (a: number, b: number) => void;
  readonly _ZN12regex_syntax3ast3Ast6concat17hd1f24d176d734dbaE: (a: number, b: number) => void;
  readonly _ZN12regex_syntax3ast8ClassSet4span17hbfaa3925eb8b0798E: (a: number) => number;
  readonly _ZN12regex_syntax3ast13ClassSetUnion4push17had16389730511ef4E: (a: number, b: number) => void;
  readonly _ZN12regex_syntax3ast13ClassSetUnion9into_item17ha3be078b8a44dbedE: (a: number, b: number) => void;
  readonly _ZN12regex_syntax3ast5Flags8add_item17h72ee98dc71f863d1E: (a: number, b: number, c: number) => void;
  readonly _ZN12regex_syntax5error5Spans3add17he70bc2859fbff590E: (a: number, b: number) => void;
  readonly _ZN12regex_syntax5error11repeat_char17h88021e1dc4b62cf7E: (a: number, b: number, c: number) => void;
  readonly _ZN12regex_syntax3hir7literal3Seq14cross_preamble17h242dbcd05b0ec73aE: (a: number, b: number, c: number) => void;
  readonly _ZN12regex_syntax3hir7literal14PreferenceTrie8minimize17h310f6b185073a99eE: (a: number, b: number) => void;
  readonly _ZN4core9panicking13assert_failed17h97b00d91dc0ebbfbE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN12regex_syntax3hir7literal4rank17h49581356bb5c0eeaE: (a: number) => number;
  readonly _ZN12regex_syntax3hir10Properties7capture17ha4af8e8b680c5351E: (a: number) => number;
  readonly _ZN12regex_syntax3hir10ClassBytes16case_fold_simple17he6f54542f9bf6062E: (a: number) => void;
  readonly _ZN12regex_syntax3hir10ClassBytes4push17he427ba654340e720E: (a: number, b: number, c: number) => void;
  readonly _ZN12regex_syntax3hir12ClassUnicode20symmetric_difference17h3043e4b025dfed5fE: (a: number, b: number) => void;
  readonly _ZN12regex_syntax3hir10ClassBytes20symmetric_difference17hbb92c19f16e2de42E: (a: number, b: number) => void;
  readonly _ZN12regex_syntax3hir7visitor11HeapVisitor6induct17h4c7547f588774aabE: (a: number, b: number, c: number) => void;
  readonly _ZN12regex_syntax3hir7visitor11HeapVisitor3pop17hd5b267fa25064ac9E: (a: number, b: number, c: number) => void;
  readonly _ZN12regex_syntax3hir12ClassUnicode7literal17h79bb00a6f3fc87d9E: (a: number, b: number) => void;
  readonly _ZN12regex_syntax3hir10ClassBytes16to_unicode_class17h1638a08571206c72E: (a: number, b: number) => void;
  readonly _ZN12regex_syntax3hir12ClassUnicode13to_byte_class17hf7a5cc40b5191efaE: (a: number, b: number) => void;
  readonly _ZN4core3str5count14do_count_chars17h797d8345c9d56a7cE: (a: number, b: number) => number;
  readonly _ZN12regex_syntax3hir5Class16case_fold_simple17hafb333e7f85f9911E: (a: number) => void;
  readonly _ZN12regex_syntax3hir5Class20try_case_fold_simple17he3aebd7fe4e1a05cE: (a: number) => number;
  readonly _ZN12regex_syntax3hir5Class6negate17hd3678fd95f91ebf9E: (a: number) => void;
  readonly _ZN12regex_syntax3hir5Class11minimum_len17h3440f9a5e8b06fa2E: (a: number, b: number) => void;
  readonly _ZN12regex_syntax3hir5Class11maximum_len17h40c98fdb558f3376E: (a: number, b: number) => void;
  readonly _ZN12regex_syntax3hir12ClassUnicode5empty17hace275d17faed5feE: (a: number) => void;
  readonly _ZN12regex_syntax3hir12ClassUnicode4push17hfe906fb958ad7407E: (a: number, b: number, c: number) => void;
  readonly _ZN12regex_syntax3hir12ClassUnicode16case_fold_simple17hb5897cdbd2275d49E: (a: number) => void;
  readonly _ZN12regex_syntax3hir12ClassUnicode20try_case_fold_simple17he9c6c8c59eb98841E: (a: number) => number;
  readonly _ZN12regex_syntax3hir12ClassUnicode5union17he4af8b2d5a228107E: (a: number, b: number) => void;
  readonly _ZN12regex_syntax3hir12ClassUnicode9intersect17h30c50ed1aba8e895E: (a: number, b: number) => void;
  readonly _ZN12regex_syntax3hir12ClassUnicode10difference17h4345d6e46972d212E: (a: number, b: number) => void;
  readonly _ZN4core7unicode12unicode_data2cc6lookup17h59c8f1f5eee7ca81E: (a: number) => number;
  readonly _ZN12regex_syntax3hir10ClassBytes5union17h008e91b55f6ee6f6E: (a: number, b: number) => void;
  readonly _ZN12regex_syntax3hir10ClassBytes9intersect17h2503fb35a844386aE: (a: number, b: number) => void;
  readonly _ZN12regex_syntax3hir10ClassBytes10difference17hbc5519ffd9035cdfE: (a: number, b: number) => void;
  readonly _ZN12regex_syntax3hir10ClassBytes7literal17h72082fa7f624756fE: (a: number, b: number) => void;
  readonly _ZN12regex_syntax3hir15ClassBytesRange3len17h7618b723a9826a8eE: (a: number) => number;
  readonly _ZN12regex_syntax6parser5parse17h24f285fe9273abc2E: (a: number, b: number, c: number) => void;
  readonly _ZN12regex_syntax6parser6Parser3new17h7fffdb2240d0eddfE: (a: number) => void;
  readonly _ZN12regex_syntax4utf812Utf8Sequence7matches17h06ebd63d9e30404dE: (a: number, b: number, c: number) => number;
  readonly _ZN12regex_syntax4utf813Utf8Sequences5reset17h80a0ffa3e46b622bE: (a: number, b: number, c: number) => void;
  readonly _ZN12regex_syntax11escape_into17hfab8c226153b9dd9E: (a: number, b: number, c: number) => void;
  readonly _ZN12regex_syntax17is_word_character17h22c7bcfcb650478dE: (a: number) => number;
  readonly _ZN9rand_core5impls19fill_via_u32_chunks17he01a9b8f37687d2cE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN3std2io5error5Error3new17h954fce0398dfea85E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN3std2io5error5Error4_new17h85adc1493e481290E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN9rand_core5impls19fill_via_u64_chunks17hf78d3eca71e1abacE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN9getrandom3imp15getrandom_inner17he974e98b640fde9aE: (a: number, b: number) => number;
  readonly _ZN3std2io5error5Error3new17h45069c8d6efa932aE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys10Uint8Array15new_with_length17h85802d3bc8c04b00E: (a: number) => number;
  readonly _ZN6js_sys10Uint8Array12view_mut_raw17hd0b77a10ed6f2c5dE: (a: number, b: number) => number;
  readonly _ZN6js_sys10Uint8Array8subarray17h2402a80fba4a2cecE: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys10Uint8Array15raw_copy_to_ptr17h957847d5eeca4012E: (a: number, b: number) => void;
  readonly _ZN10image_webp7huffman11HuffmanTree20read_symbol_slowpath17ha5c132c9034954e0E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN10image_webp7huffman11HuffmanTree20read_symbol_slowpath17hba8d50109ec53736E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN4core5slice4sort8unstable7ipnsort17ha8fc1a1eb0861506E: (a: number, b: number, c: number) => void;
  readonly _ZN4core5slice4sort8unstable8heapsort8heapsort17hbd5c0cb02a7ce184E: (a: number, b: number, c: number) => void;
  readonly _ZN4core9panicking13assert_failed17ha3434d290263053dE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN10image_webp3vp820init_top_macroblocks17he7520087db03f0d8E: (a: number, b: number) => void;
  readonly _ZN10image_webp22vp8_arithmetic_decoder17ArithmeticDecoder4init17hfd195b4000b1f4aaE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN10image_webp22vp8_arithmetic_decoder17ArithmeticDecoder12read_literal17hef53a3fdc19ae539E: (a: number, b: number) => number;
  readonly _ZN10image_webp22vp8_arithmetic_decoder17ArithmeticDecoder9read_flag17h393700c6c0df6010E: (a: number) => number;
  readonly _ZN10image_webp22vp8_arithmetic_decoder17ArithmeticDecoder26read_optional_signed_value17h3be473f0c14b224eE: (a: number, b: number) => number;
  readonly _ZN10image_webp22vp8_arithmetic_decoder17ArithmeticDecoder30read_with_tree_with_first_node17hb256280f7015c7abE: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN10image_webp22vp8_arithmetic_decoder17ArithmeticDecoder9read_bool17he617ebc61ce7476eE: (a: number, b: number) => number;
  readonly _ZN10image_webp9transform7iwht4x417h74984759623cef87E: (a: number, b: number) => void;
  readonly _ZN10image_webp9transform7idct4x417h298c8b6cc6125a4aE: (a: number, b: number) => void;
  readonly _ZN10image_webp3vp818create_border_luma17h5cf593ad6d8d0181E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
  readonly _ZN10image_webp3vp813predict_vpred17h3439be8e22e8a757E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN10image_webp3vp813predict_hpred17h556f62204e22450aE: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN10image_webp3vp814predict_tmpred17hbe1ee5895379ffa3E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN10image_webp3vp811predict_4x417h85d0e68ad1308dd7E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN10image_webp3vp814predict_dcpred17h9e3511655eb090f5E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN10image_webp3vp811add_residue17h665c51be6b32472dE: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN10image_webp3vp820create_border_chroma17h3bc939ed771fb727E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN10image_webp3vp817set_chroma_border17h325e0a1f56329125E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN10image_webp11loop_filter14simple_segment17h1e53f9271c8c3129E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN10image_webp11loop_filter17macroblock_filter17h54c40d40924fbe92E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN10image_webp11loop_filter15subblock_filter17hba0066b4be7d76a4E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN10image_webp22vp8_arithmetic_decoder17ArithmeticDecoder3new17h3cba1d8c6406ecabE: (a: number) => void;
  readonly _ZN10image_webp18lossless_transform25apply_predictor_transform17hb27a92ba52d09cbaE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
  readonly _ZN10image_webp18lossless_transform21apply_color_transform17hf975a17b5e5ab279E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN10image_webp18lossless_transform30apply_subtract_green_transform17h4f64c5a96cab9a63E: (a: number, b: number) => void;
  readonly _ZN10image_webp18lossless_transform30apply_color_indexing_transform17hcf75b36bf0d881bdE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN10image_webp7huffman11HuffmanTree14build_implicit17he943d78acf1da3feE: (a: number, b: number) => void;
  readonly _ZN10image_webp7huffman11HuffmanTree14build_two_node17h12667fad633d8466E: (a: number, b: number, c: number) => void;
  readonly _ZN10image_webp8lossless11HuffmanInfo14get_huff_index17hf06976245dbbe5daE: (a: number, b: number, c: number) => number;
  readonly _ZN3std2io5error5Error3new17h99e95ab5d36cdba4E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN3exr4meta6header6Header19max_block_byte_size17h0b72c2e7282e5dcfE: (a: number) => number;
  readonly _ZN12jpeg_decoder7decoder8lossless22compute_image_lossless17h34d83a7ac40de71dE: (a: number, b: number, c: number) => void;
  readonly _ZN12jpeg_decoder7decoder13compute_image17ha70c0cffdf818b01E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN12jpeg_decoder6marker6Marker7from_u817hb527c874894e0ffaE: (a: number, b: number) => void;
  readonly _ZN12jpeg_decoder7huffman25fill_default_mjpeg_tables17hd9012d075da787e3E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN12jpeg_decoder7huffman12HuffmanTable3new17hdca1db09121661afE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN12jpeg_decoder6parser9parse_sof19panic_cold_explicit17hca5fd01eb44ab6f8E: (a: number) => void;
  readonly _ZN12jpeg_decoder6parser9parse_sof19panic_cold_explicit17h5887859fab601726E: (a: number) => void;
  readonly _ZN12jpeg_decoder6parser9parse_sof19panic_cold_explicit17h3d977fdb4604aeb9E: (a: number) => void;
  readonly _ZN12jpeg_decoder6parser22update_component_sizes17h3a0d14536e2ca7fcE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN12jpeg_decoder9upsampler9Upsampler3new17hc6c6949e68b32ac1E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN3exr4meta6header15ImageAttributes3new17h4aa73e2aa43ebaa3E: (a: number, b: number) => void;
  readonly _ZN3exr4meta17missing_attribute17h6b8e041f82387a18E: (a: number, b: number, c: number) => void;
  readonly _ZN3exr4meta19compute_chunk_count17hdd5391fcf2f9d318E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN3exr4meta9attribute4Text8as_slice17h20f4a7fca74c59dfE: (a: number, b: number) => void;
  readonly _ZN3exr4meta9attribute9BlockType5parse17h16f565d04d933de3E: (a: number, b: number) => void;
  readonly _ZN3exr4meta9attribute11ChannelList3new17h9372bc8e06822cffE: (a: number, b: number) => void;
  readonly _ZN3exr4meta9attribute8TimeCode14from_tv60_time17h3c53bbefd54ec952E: (a: number, b: number, c: number) => void;
  readonly _ZN3exr4meta6header6Header22get_block_data_indices17h2d27e6aaf18f64faE: (a: number, b: number, c: number) => void;
  readonly _ZN3exr4meta6header6Header36get_absolute_block_pixel_coordinates17hca2772452fb0926dE: (a: number, b: number, c: number) => void;
  readonly _ZN3exr11compression11Compression24decompress_image_section17hd247741dcb325bbcE: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN3gif6reader7decoder13DecodingError6format17hbabd8ce336052fb2E: (a: number, b: number, c: number) => void;
  readonly _ZN3gif6reader7decoder16StreamingDecoder6update17hbe632cfe549d3416E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN3png7decoder6stream16StreamingDecoder6update17ha09705fdbf4b5f50E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN3png7decoder12SubframeInfo3new17h1add976e787aaa22E: (a: number, b: number) => void;
  readonly _ZN3png6common4Info17bpp_in_prediction17h6779ce06ee842254E: (a: number) => number;
  readonly _ZN3png6common9ColorType25raw_row_length_from_width17hd91ee34d3f7ea841E: (a: number, b: number, c: number) => number;
  readonly _ZN3png7decoder18unfiltering_buffer17UnfilteringBuffer10as_mut_vec17hd7bcdde4159f5808E: (a: number) => number;
  readonly _ZN3png7decoder18unfiltering_buffer17UnfilteringBuffer17unfilter_curr_row17h7e7ce03c9d58cf86E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN3png7decoder18unfiltering_buffer17UnfilteringBuffer8prev_row17hc2b388d8ab10f13eE: (a: number, b: number) => void;
  readonly _ZN3png7decoder9transform19create_transform_fn17h998334177f0901a3E: (a: number, b: number, c: number) => void;
  readonly _ZN9crc32fast6Hasher6update17h33ea5b1430ab6e25E: (a: number, b: number, c: number) => void;
  readonly _ZN3std4sync4mpmc7context7Context3new17h27650c4e2c2050d3E: () => number;
  readonly _ZN3std6thread6Thread4park17hb164a0fab6826644E: (a: number) => void;
  readonly _ZN3std6thread6Thread12park_timeout17h1c62f27df0a9ac7bE: (a: number, b: bigint, c: number) => void;
  readonly _ZN4tiff7decoder3ifd5Value12into_u64_vec17h8a01242ba1f7dddcE: (a: number, b: number) => void;
  readonly _ZN4tiff7decoder3ifd5Entry3new17hbe5fb5d22323e5bcE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN4tiff7decoder3ifd5Value8into_u3217h04aa10fcdc1e9b7dE: (a: number, b: number) => void;
  readonly _ZN4tiff7decoder3ifd5Value8into_u1617h65a8db08dcb744a0E: (a: number, b: number) => void;
  readonly _ZN4tiff7decoder3ifd5Value11into_u8_vec17hababf02f3775501fE: (a: number, b: number) => void;
  readonly _ZN4tiff7decoder5image14TileAttributes10tiles_down17h5511ecb039281a8aE: (a: number) => number;
  readonly _ZN4tiff7decoder5image14TileAttributes12tiles_across17hdb29bf080f2a991dE: (a: number) => number;
  readonly _ZN4tiff7decoder3ifd5Entry1r17hd06aeed5a16f9c27E: (a: number, b: number, c: number) => void;
  readonly _ZN4core3fmt9Formatter25debug_tuple_field5_finish17h668e69945018891eE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number) => number;
  readonly _ZN5alloc6string6String11try_reserve17hc42ad22c5af74b57E: (a: number, b: number, c: number) => void;
  readonly _ZN5weezl6decode7Decoder12decode_bytes17h4aebbcd7cdd1b809E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN3std2io5error5Error3new17hd3c9ac0f3bb90612E: (a: number, b: number) => void;
  readonly _ZN10rayon_core8registry8Registry9terminate17h8999bce5d94e82aaE: (a: number) => void;
  readonly _ZN8bytemuck8internal20something_went_wrong17h8ce431ad3140ff3eE: (a: number, b: number, c: number) => void;
  readonly _ZN12simd_adler327Adler325write17haffa46248249821aE: (a: number, b: number, c: number) => void;
  readonly _ZN12simd_adler323imp4wasm3imp6update17h89c82a1452650908E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN4core5alloc6layout6Layout19is_size_align_valid17hda547468a67126a5E: (a: number, b: number) => number;
  readonly _ZN9zune_jpeg6worker8upsample17h5e42fa9e840d58c2E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN9zune_jpeg6worker13color_convert17hcf52fa669f9987fcE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => void;
  readonly _ZN9zune_jpeg4misc22calculate_padded_width17h6af2ecde84caa1e8E: (a: number, b: number) => number;
  readonly _ZN9zune_jpeg9bitstream9BitStream16decode_mcu_block17hef007b0702819077E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
  readonly _ZN9zune_jpeg4misc25fill_default_mjpeg_tables17h22a59748357df597E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN9zune_jpeg9upsampler6scalar17upsample_vertical17h017870e9dc69343dE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => void;
  readonly _ZN9zune_jpeg9upsampler6scalar19upsample_horizontal17h55f910ce67a83b5dE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => void;
  readonly _ZN9zune_jpeg9upsampler6scalar11upsample_hv17h4cb65ab89df066a9E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => void;
  readonly _ZN9zune_jpeg9upsampler6scalar16upsample_generic17hfeacf86914e8d9c8E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => void;
  readonly _ZN9zune_jpeg10components10Components23setup_upsample_scanline17hbcf071a9d4ffff25E: (a: number) => void;
  readonly _ZN9zune_jpeg7huffman12HuffmanTable3new17h7c0e5009a214edceE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN9zune_jpeg6errors18UnsupportedSchemes8from_int17h378df1b442ea6795E: (a: number) => number;
  readonly _ZN9zune_jpeg9bitstream9BitStream7get_bit17h091248fcc111cad7E: (a: number) => number;
  readonly _ZN5image5error16UnsupportedError4kind17h6afff52d4e9b6dfcE: (a: number, b: number) => void;
  readonly _ZN5image5error16UnsupportedError11format_hint17ha93e707e7d19a843E: (a: number, b: number) => void;
  readonly _ZN5image5error13DecodingError11format_hint17ha5a7c1a0b3a4290dE: (a: number, b: number) => void;
  readonly _ZN5image5error14ParameterError4kind17h155da60a6a95217cE: (a: number, b: number) => void;
  readonly _ZN5image5error10LimitError4kind17hf9685b0bb93b4627E: (a: number, b: number) => void;
  readonly _ZN3std4path4Path9extension17h6ba28c58cfde8d2cE: (a: number, b: number, c: number) => void;
  readonly _ZN5image8imageops9fast_blur15boxes_for_gauss17h1e15ae8d5515125bE: (a: number, b: number, c: number) => void;
  readonly _ZN5image8imageops6sample8gaussian17h0398e6dc5355b49cE: (a: number, b: number) => number;
  readonly _ZN5image8imageops6sample15gaussian_kernel17hd51b22842c787a90E: (a: number) => number;
  readonly _ZN5image8imageops6sample17catmullrom_kernel17h473b2c3a2711ecc1E: (a: number) => number;
  readonly _ZN5image8imageops6sample15triangle_kernel17h4a4e9eacdf5664fdE: (a: number) => number;
  readonly _ZN5image8imageops14overlay_bounds17h6d66c80382a3cc77E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN5image8imageops18overlay_bounds_ext17h8e1a2c806c48ec9fE: (a: number, b: number, c: number, d: number, e: number, f: bigint, g: bigint) => void;
  readonly _ZN5image4flat12SampleLayout16row_major_packed17ha315f679eb42de07E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN5image4flat12SampleLayout19column_major_packed17h0701c44c4a5f9715E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN5image4flat12SampleLayout10min_length17h4720bccd462d3d59E: (a: number, b: number) => void;
  readonly _ZN5image4flat12SampleLayout4fits17h0a0714010552fd9fE: (a: number, b: number) => number;
  readonly _ZN5image4flat12SampleLayout19has_aliased_samples17hd41dc2584a755644E: (a: number) => number;
  readonly _ZN5image4flat12SampleLayout9is_normal17h4af6e428e785eb8bE: (a: number, b: number) => number;
  readonly _ZN5image4flat12SampleLayout5index17h489dc526a8e8fff0E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN5image4flat12SampleLayout21index_ignoring_bounds17hea0a0cb45175f2a9E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN5image4flat23panic_cwh_out_of_bounds17h58479165046a9038E: (a: number, b: number, c: number) => void;
  readonly _ZN5image4flat25panic_pixel_out_of_bounds17hd2f133915cb74013E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN5image6codecs3bmp7decoder18check_for_overflow17h4ec27b19109bddfeE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN5image6codecs3bmp7decoder8Bitfield4read17h83e61434ed29bd33E: (a: number, b: number) => number;
  readonly _ZN5image6codecs3bmp7decoder9Bitfields9from_mask17h9a788dcc1ae8e0c5E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN5image6codecs3bmp7encoder29get_unsupported_error_message17he30f15fb5a998bbaE: (a: number, b: number, c: number) => void;
  readonly _ZN5image6codecs3bmp7encoder14get_pixel_info17h80924d654fd05fe7E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN5image6codecs3dds6Header11from_reader17hfb0e6f64505a8a6aE: (a: number, b: number, c: number) => void;
  readonly _ZN5image6codecs3dds10DX10Header11from_reader17h68206df2b436db76E: (a: number, b: number, c: number) => void;
  readonly _ZN5image6codecs3dxt15decode_dxt1_row17h4492dba8c43029e1E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN5image6codecs3dxt15decode_dxt3_row17ha1d05a80a512719cE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN5image6codecs3dxt15decode_dxt5_row17hec1b3015dfe0d070E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN3gif6reader7decoder16StreamingDecoder17current_frame_mut17h3f69c369999a48e2E: (a: number, b: number) => number;
  readonly _ZN3gif6reader9converter14PixelConverter16read_into_buffer17h01e3b18b673afbdaE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN5image6codecs3hdr7decoder11HdrMetadata18update_header_info17h519685a144ce808fE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN5image6codecs3hdr7decoder21parse_dimensions_line17ha427fe48506017b9E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN5image6codecs3hdr7encoder12rle_compress17hff022953f5c4de44E: (a: number, b: number, c: number) => void;
  readonly _ZN5image6codecs3hdr7encoder8to_rgbe817h21578df370d74e8aE: (a: number) => number;
  readonly _ZN5image6codecs3ico7decoder10best_entry17h7e9df2a2848310d7E: (a: number, b: number) => void;
  readonly _ZN5image6codecs3ico7encoder8IcoFrame6as_png17h80378c669100ea7aE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN4core9panicking13assert_failed17hd24f5b96ecbcd5c6E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN9zune_jpeg4idct6scalar8idct_int17h0c1d90ba00c38f34E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN5image8metadata11Orientation15from_exif_chunk17hce572e3d11b77a01E: (a: number, b: number) => number;
  readonly _ZN5image6codecs4jpeg7encoder17build_jfif_header17hfbda7228a4ee0f47E: (a: number, b: number) => void;
  readonly _ZN5image6codecs4jpeg7encoder18build_frame_header17h14ab79684967b1eaE: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN5image6codecs4jpeg7encoder17build_scan_header17h8d17a215e4d02539E: (a: number, b: number, c: number) => void;
  readonly _ZN5image6codecs4jpeg7encoder21build_huffman_segment17he386710bf958dd8eE: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN5image6codecs4jpeg7encoder26build_quantization_segment17he75a3f377208e523E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN5image6codecs4jpeg9transform4fdct17h7993800eca4bed5fE: (a: number, b: number) => void;
  readonly _ZN3exr4meta9attribute11ChannelList25channels_with_byte_offset17h7712eb16b7c11339E: (a: number, b: number) => void;
  readonly _ZN3exr4meta6header6Header25blocks_increasing_y_order17h44719ae5e08e9aafE: (a: number, b: number) => void;
  readonly _ZN10rayon_core8registry8Registry25increment_terminate_count17h12201807d4f57101E: (a: number) => void;
  readonly _ZN10rayon_core8registry8Registry14inject_or_push17h5c1212357c5c534fE: (a: number, b: number, c: number) => void;
  readonly _ZN3std7process5abort17h6fcbe785a1d08c57E: () => void;
  readonly _ZN5image6codecs7openexr12to_image_err17h1af119e2411b0363E: (a: number, b: number) => void;
  readonly _ZN3png7decoder6stream16StreamingDecoder3new17h0c6648fe1ce30dfbE: (a: number) => void;
  readonly _ZN3png6common4Info22checked_raw_row_length17hdb6618939e91c227E: (a: number, b: number) => void;
  readonly _ZN3png6common4Info25raw_row_length_from_width17hf1ebb1b675f674dfE: (a: number, b: number) => number;
  readonly _ZN3png5adam711expand_pass17hd6ef345dc8faeea8E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN3png13text_metadata17encode_iso_8859_117h7515940414c06c40E: (a: number, b: number, c: number) => void;
  readonly _ZN6flate23mem8Compress3new17h26c24b5028729123E: (a: number, b: number, c: number) => void;
  readonly _ZN3png7encoder11PartialInfo25raw_row_length_from_width17h9e6292667ec95f5dE: (a: number, b: number) => number;
  readonly _ZN3png7encoder11PartialInfo17bpp_in_prediction17hf8c331b6ac4fdd80E: (a: number) => number;
  readonly _ZN3png6filter6filter17h2ff48cecf4b576f4E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => number;
  readonly _ZN5image6codecs3pnm7decoder12HeaderReader21read_arbitrary_header23parse_single_value_line17hf4178b3eae7864a2E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN5image6codecs3pnm7encoder17CheckedDimensions18check_header_color17haef617691a35e8a8E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN5image6codecs3pnm7encoder18CheckedHeaderColor19check_sample_values17h7f9f922c3b2997afE: (a: number, b: number, c: number) => void;
  readonly _ZN5image6codecs3pnm7encoder13CheckedHeader12write_header17h600c85090641bf67E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN5image6codecs3pnm6header9PnmHeader5write17h2aec2fc557183ce4E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN5image6codecs3pnm7encoder13TupleEncoding11write_image17hb826feaec4d3c696E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN5image6codecs3qoi14decoding_error17ha8a3006ef47cc14bE: (a: number, b: number) => void;
  readonly _ZN5image6codecs3qoi14encoding_error17h07e4415c1cc7bf2fE: (a: number, b: number) => void;
  readonly _ZN5image6codecs3tga7decoder8ColorMap11from_reader17h52416cce0925d720E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN5image6codecs3tga6header6Header11from_reader17h67412e5fdaf215dfE: (a: number, b: number, c: number) => void;
  readonly _ZN5image6codecs3tga6header6Header8write_to17h2a5e1f90895668c9E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN5image6codecs4tiff19check_sample_format17hdfc5d6904ff9e89fE: (a: number, b: number) => void;
  readonly _ZN4tiff7decoder14DecodingResult7new_f6417h69c425991eea9dc0E: (a: number, b: number, c: number) => void;
  readonly _ZN4tiff7decoder14DecodingResult7new_u6417h47434f90e64a5f7aE: (a: number, b: number, c: number) => void;
  readonly _ZN4tiff7decoder14DecodingResult7new_i6417hf9c09b1acd0a22d2E: (a: number, b: number, c: number) => void;
  readonly _ZN4tiff7decoder14DecodingResult7new_f3217hcb90aba3eacbfb2eE: (a: number, b: number, c: number) => void;
  readonly _ZN4tiff7decoder14DecodingResult6new_u817hfa9524d391771068E: (a: number, b: number, c: number) => void;
  readonly _ZN4tiff7decoder14DecodingResult7new_u1617hbe27a25b519e25c9E: (a: number, b: number, c: number) => void;
  readonly _ZN4tiff7decoder14DecodingResult7new_u3217h897f0a9118be01c6E: (a: number, b: number, c: number) => void;
  readonly _ZN4tiff7decoder14DecodingResult6new_i817h157fa631f4df85f6E: (a: number, b: number, c: number) => void;
  readonly _ZN4tiff7decoder14DecodingResult7new_i1617h012538ee05e12025E: (a: number, b: number, c: number) => void;
  readonly _ZN4tiff7decoder14DecodingResult7new_i3217ha8af9a84234425adE: (a: number, b: number, c: number) => void;
  readonly _ZN4tiff7decoder5image5Image16chunk_dimensions17hd5cd3775a0db8107E: (a: number, b: number) => void;
  readonly _ZN4tiff7decoder14DecodingResult9as_buffer17hd42bcfdcf389eb65E: (a: number, b: number, c: number) => void;
  readonly _ZN4tiff7decoder5image5Image9colortype17hc3d5c10d3fcec5b6E: (a: number, b: number) => void;
  readonly _ZN4tiff7decoder5image5Image21chunk_data_dimensions17h9a92a0c7a14eae9bE: (a: number, b: number, c: number) => void;
  readonly _ZN5weezl6decode7Decoder21with_tiff_size_switch17hc92b0c0185343b48E: (a: number, b: number, c: number) => void;
  readonly _ZN6flate23mem10Decompress3new17h669d4f2206016cd7E: (a: number, b: number) => void;
  readonly _ZN4tiff7decoder14DecodingBuffer12as_bytes_mut17h74f0fed699424f1fE: (a: number, b: number) => void;
  readonly _ZN4tiff7decoder14DecodingBuffer8subrange17h83f1c6183d087ac4E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN4tiff7decoder26fix_endianness_and_predict17h3c531b68a3da714dE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN4tiff7decoder13invert_colors17hdbcfb136bb25fd66E: (a: number, b: number, c: number) => void;
  readonly _ZN4tiff7decoder14fp_predict_f3217h9696c9fcc467aa45E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN4tiff7decoder14fp_predict_f6417he5ff9c914f367024E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN5image6codecs4tiff11cmyk_to_rgb17h028dde7f8b8cf9f8E: (a: number, b: number) => number;
  readonly _ZN5image6codecs4tiff15u8_slice_as_u1617h50c9f2cc617475adE: (a: number, b: number, c: number) => void;
  readonly _ZN10image_webp3vp85Frame8fill_rgb17hb1a85742e2c27e3aE: (a: number, b: number, c: number) => void;
  readonly _ZN10image_webp3vp85Frame9fill_rgba17h2c7e25e85851233cE: (a: number, b: number, c: number) => void;
  readonly _ZN10image_webp8extended19get_alpha_predictor17h1983257f119c020bE: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly _ZN10image_webp8extended15composite_frame17hbcb9c1fb8ddd10c1E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number, p: number, q: number) => void;
  readonly _ZN5image9animation6Frames14collect_frames17h47c08a060bdcb58dE: (a: number, b: number, c: number) => void;
  readonly _ZN5image9animation5Delay19from_numer_denom_ms17h4806d88ad0d9635fE: (a: number, b: number, c: number) => void;
  readonly _ZN4core9panicking13assert_failed17ha85dc49b1de14073E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN5image9animation5Delay24from_saturating_duration17haaaa3597fdf7cb2fE: (a: number, b: bigint, c: number) => void;
  readonly _ZN5image8dynimage12DynamicImage7to_rgb817ha9083340cd42bdfcE: (a: number, b: number) => void;
  readonly _ZN5image8dynimage12DynamicImage8to_rgba817hf5438ff931824cddE: (a: number, b: number) => void;
  readonly _ZN5image8dynimage12DynamicImage14to_luma_alpha817hcfe1a01185ffcbf7E: (a: number, b: number) => void;
  readonly _ZN5image8dynimage12DynamicImage8to_rgb1617h2ba546359c63daacE: (a: number, b: number) => void;
  readonly _ZN5image8dynimage12DynamicImage9to_rgba1617h9a4e017f1d3d1390E: (a: number, b: number) => void;
  readonly _ZN5image8dynimage12DynamicImage9to_luma1617h01caebf7892a1a78E: (a: number, b: number) => void;
  readonly _ZN5image8dynimage12DynamicImage15to_luma_alpha1617hd5295db114be0bbdE: (a: number, b: number) => void;
  readonly _ZN5image8dynimage12DynamicImage10to_rgba32f17h04d782aed9db402bE: (a: number, b: number) => void;
  readonly _ZN5image5color17ExtendedColorType11buffer_size17h12d9b1fb35a8ce7eE: (a: number, b: number, c: number, d: number) => bigint;
  readonly _ZN5image8dynimage12DynamicImage3new17h18e5218aa1cb33f1E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN5image8dynimage12DynamicImage9new_luma817h4570c30e2e403546E: (a: number, b: number, c: number) => void;
  readonly _ZN5image8dynimage12DynamicImage11new_luma_a817h03aa9a18d467a0f6E: (a: number, b: number, c: number) => void;
  readonly _ZN5image8dynimage12DynamicImage8new_rgb817hced0254c5d752b32E: (a: number, b: number, c: number) => void;
  readonly _ZN5image8dynimage12DynamicImage9new_rgba817h129176c95538329cE: (a: number, b: number, c: number) => void;
  readonly _ZN5image8dynimage12DynamicImage10new_luma1617hdb2dfa800216ede0E: (a: number, b: number, c: number) => void;
  readonly _ZN5image8dynimage12DynamicImage12new_luma_a1617h034fa22d498444caE: (a: number, b: number, c: number) => void;
  readonly _ZN5image8dynimage12DynamicImage9new_rgb1617hdfe89d53c8582e55E: (a: number, b: number, c: number) => void;
  readonly _ZN5image8dynimage12DynamicImage10new_rgba1617h05277e8e77a13016E: (a: number, b: number, c: number) => void;
  readonly _ZN5image8dynimage12DynamicImage10new_rgb32f17h93fcbaaeee616f45E: (a: number, b: number, c: number) => void;
  readonly _ZN5image8dynimage12DynamicImage11new_rgba32f17h9157a15fe670032aE: (a: number, b: number, c: number) => void;
  readonly _ZN5image8dynimage12DynamicImage9to_rgb32f17h94bdf9fa158cf846E: (a: number, b: number) => void;
  readonly _ZN5image8dynimage12DynamicImage10to_luma32f17hf5a2a9a5a16ba145E: (a: number, b: number) => void;
  readonly _ZN5image8dynimage12DynamicImage16to_luma_alpha32f17h34f136a406388dccE: (a: number, b: number) => void;
  readonly _ZN5image8dynimage12DynamicImage9into_rgb817h7a5aa84d31b3091cE: (a: number, b: number) => void;
  readonly _ZN5image8dynimage12DynamicImage10into_rgb1617h3388096bb9491943E: (a: number, b: number) => void;
  readonly _ZN5image8dynimage12DynamicImage11into_rgb32f17h42a016ed85e076f9E: (a: number, b: number) => void;
  readonly _ZN5image8dynimage12DynamicImage10into_rgba817h51eca1c0f52b305cE: (a: number, b: number) => void;
  readonly _ZN5image8dynimage12DynamicImage11into_rgba1617h78ccef66d8fdbaa0E: (a: number, b: number) => void;
  readonly _ZN5image8dynimage12DynamicImage12into_rgba32f17h40938cd0458102c0E: (a: number, b: number) => void;
  readonly _ZN5image8dynimage12DynamicImage10into_luma817h44999e383b75f13fE: (a: number, b: number) => void;
  readonly _ZN5image8dynimage12DynamicImage11into_luma1617hfd2bd2481ded5f4eE: (a: number, b: number) => void;
  readonly _ZN5image8dynimage12DynamicImage16into_luma_alpha817hd8c58d4301b0565bE: (a: number, b: number) => void;
  readonly _ZN5image8dynimage12DynamicImage17into_luma_alpha1617h90ea031d55637679E: (a: number, b: number) => void;
  readonly _ZN5image8dynimage12DynamicImage4crop17h02a5ccdc32d33949E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN5image8dynimage12DynamicImage8crop_imm17h3015e91df82b0b1cE: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN5image8dynimage12DynamicImage18as_flat_samples_u817h1c5b2e29b2bd1b1dE: (a: number, b: number) => void;
  readonly _ZN5image8dynimage12DynamicImage19as_flat_samples_u1617hc7a83a6d18f95f52E: (a: number, b: number) => void;
  readonly _ZN5image8dynimage12DynamicImage19as_flat_samples_f3217h88dc48f7adb44d39E: (a: number, b: number) => void;
  readonly _ZN5image8dynimage12DynamicImage8as_bytes17h67c64ae0b8345f88E: (a: number, b: number) => void;
  readonly _ZN5image8dynimage12DynamicImage11inner_bytes17h0d1543d917c44221E: (a: number, b: number) => void;
  readonly _ZN5image8dynimage12DynamicImage10into_bytes17hf7e1dd64c6047a3aE: (a: number, b: number) => void;
  readonly _ZN5image8dynimage12DynamicImage9grayscale17h23fa5d5cd85d2f5bE: (a: number, b: number) => void;
  readonly _ZN5image8dynimage12DynamicImage6invert17h23c266af5a8de724E: (a: number) => void;
  readonly _ZN5image8dynimage12DynamicImage6resize17had322350087138c7E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN5image8dynimage12DynamicImage12resize_exact17h0180e6af6e7852c9E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN5image8dynimage12DynamicImage9thumbnail17h6969dc8f31fdb78eE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN5image8dynimage12DynamicImage15thumbnail_exact17hbfcd933f89750253E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN5image8dynimage12DynamicImage14resize_to_fill17hed9bd76599cf84f6E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN5image8dynimage12DynamicImage4blur17h63b6be83adc0ba66E: (a: number, b: number, c: number) => void;
  readonly _ZN5image8dynimage12DynamicImage9fast_blur17hf2ff624d1bab8ca1E: (a: number, b: number, c: number) => void;
  readonly _ZN5image8dynimage12DynamicImage9unsharpen17h9bdc3ebc5417a268E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN5image8dynimage12DynamicImage9filter3x317h554042f16deafe3eE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN5image8dynimage12DynamicImage15adjust_contrast17h8cc315efdc4d8d27E: (a: number, b: number, c: number) => void;
  readonly _ZN5image8dynimage12DynamicImage8brighten17ha8b47c2c3f0ee7e3E: (a: number, b: number, c: number) => void;
  readonly _ZN5image8dynimage12DynamicImage9huerotate17hcb09acd4838384caE: (a: number, b: number, c: number) => void;
  readonly _ZN5image8dynimage12DynamicImage5flipv17h7c13daa3ff2b7e9fE: (a: number, b: number) => void;
  readonly _ZN5image8dynimage12DynamicImage5fliph17h89f8a831544975acE: (a: number, b: number) => void;
  readonly _ZN5image8dynimage12DynamicImage8rotate9017h097882c70066d831E: (a: number, b: number) => void;
  readonly _ZN5image8dynimage12DynamicImage9rotate18017h17c54a8794a3fea4E: (a: number, b: number) => void;
  readonly _ZN5image8dynimage12DynamicImage9rotate27017h4c0fdb17d26ff6f9E: (a: number, b: number) => void;
  readonly _ZN5image8dynimage12DynamicImage17apply_orientation17hd7302e8c9b77838eE: (a: number, b: number) => void;
  readonly _ZN5image8dynimage16load_from_memory17h5b1023609a9d666eE: (a: number, b: number, c: number) => void;
  readonly _ZN5image5image11ImageFormat14from_extension5inner17hb4e63a1655eb9f4fE: (a: number, b: number) => number;
  readonly _ZN5image5image11ImageFormat9from_path5inner17he68bb035ad41bdd3E: (a: number, b: number, c: number) => void;
  readonly _ZN5image12image_reader14free_functions16save_buffer_impl17h214cf7f92dbe0473E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => void;
  readonly _ZN5image12image_reader14free_functions12guess_format17h48e6488ad1b8c0f3E: (a: number, b: number, c: number) => void;
  readonly _ZN5image12image_reader14free_functions17guess_format_impl17h660611979f09e41dE: (a: number, b: number) => number;
  readonly _ZN3gif6reader7decoder16StreamingDecoder12with_options17hb89e40151bffcb1fE: (a: number, b: number) => void;
  readonly _ZN3gif6reader9converter14PixelConverter18set_global_palette17h9720b364cdcbbeeaE: (a: number, b: number) => void;
  readonly _ZN3exr4meta8MetaData8validate17h93836e32e926742bE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN3exr4meta9attribute11ChannelList21find_index_of_channel17ha0b33c1f776d1122E: (a: number, b: number, c: number) => void;
  readonly _ZN5image12image_reader6Limits14reserve_buffer17h130ab1f957ed6515E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN5image12image_reader6Limits4free17h7b54b25261dbfab6E: (a: number, b: bigint) => void;
  readonly _ZN5image12image_reader6Limits10free_usize17hb100222a27afe5bcE: (a: number, b: number) => void;
  readonly _ZN5image5utils24check_dimension_overflow17hed2e4a8830273f16E: (a: number, b: number, c: number) => number;
  readonly _ZN4core9panicking14panic_explicit17h98b268a97a0bc82aE: (a: number) => void;
  readonly _ZN5image5error13EncodingError11format_hint17h40976ccac8442d59E: (a: number, b: number) => void;
  readonly _ZN4core5slice4sort8unstable7ipnsort17h46f8b5c247da0784E: (a: number, b: number, c: number) => void;
  readonly _ZN4core5slice4sort8unstable8heapsort8heapsort17hd6fdf35a7e4bb74bE: (a: number, b: number, c: number) => void;
  readonly _ZN10image_webp7encoder18build_huffman_tree17h049576d4fb78af0cE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
  readonly _ZN10image_webp7encoder16length_to_symbol17h9f8e3dda145e17cdE: (a: number, b: number) => void;
  readonly _ZN4core3num9int_log1030panic_for_nonpositive_argument17h62dc2089d154c46cE: (a: number) => void;
  readonly _ZN3std2io5error5Error3new17h9228582a9a3e51d2E: (a: number, b: number, c: number) => void;
  readonly _ZN4core9panicking13assert_failed17h0bff20c50d0a0367E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN3png5adam79Adam7Info3new17ha9061c22ffe70d9eE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN3std9panicking11begin_panic17he47336bd9def0cf6E: (a: number, b: number, c: number) => void;
  readonly _ZN3png6common11ScaledFloat8in_range17h101892ae4ec396b1E: (a: number) => number;
  readonly _ZN3png6common11ScaledFloat5exact17h3e67f7cfd3b3c132E: (a: number) => number;
  readonly _ZN3png6common11ScaledFloat3new17ha627ad7ec0da142fE: (a: number) => number;
  readonly _ZN3png6common20SourceChromaticities3new17h1098910f7467782fE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => void;
  readonly _ZN3png6common4Info9raw_bytes17h63938cea34735d1cE: (a: number) => number;
  readonly _ZN3png6common4Info14raw_row_length17h08aae2d33e0d2508E: (a: number) => number;
  readonly _ZN3png6common4Info15set_source_srgb17h2786dff4c27c3226E: (a: number, b: number) => void;
  readonly _ZN3png7decoder6stream16StreamingDecoder16new_with_options17heb11ee42c2ea4c7aE: (a: number, b: number) => void;
  readonly _ZN8fdeflate10decompress12Decompressor3new17h5eb15cd739fb2ac0E: (a: number) => void;
  readonly _ZN3png7decoder6stream16StreamingDecoder5reset17h8c09fb130c11469bE: (a: number) => void;
  readonly _ZN8fdeflate10decompress12Decompressor4read17hbee13f4f694d2652E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
  readonly _ZN8fdeflate10decompress25decompress_to_vec_bounded17h10ba7fe2f2cb2b2bE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN3png7encoder11PartialInfo14raw_row_length17h62bc0e196ddae5deE: (a: number) => number;
  readonly _ZN3png13text_metadata22encode_iso_8859_1_into17hc368dfff13fdcc67E: (a: number, b: number, c: number) => number;
  readonly _ZN3png13text_metadata9ZTXtChunk15decompress_text17hd57a42ab9deb9c74E: (a: number, b: number) => void;
  readonly _ZN3png13text_metadata9ZTXtChunk26decompress_text_with_limit17h60b74a2d7bb56548E: (a: number, b: number, c: number) => void;
  readonly _ZN3png13text_metadata9ZTXtChunk8get_text17hc247ae00bdd4d2b7E: (a: number, b: number) => void;
  readonly _ZN8fdeflate10decompress17decompress_to_vec17h8d12cc3ef7f8f6cdE: (a: number, b: number, c: number) => void;
  readonly _ZN3png13text_metadata9ZTXtChunk13compress_text17hd31a882f2a3f2cdcE: (a: number, b: number) => void;
  readonly _ZN3png13text_metadata9ITXtChunk15decompress_text17h32a18b09640e71eeE: (a: number, b: number) => void;
  readonly _ZN3png13text_metadata9ITXtChunk26decompress_text_with_limit17hd6ce518625d33a5dE: (a: number, b: number, c: number) => void;
  readonly _ZN3png13text_metadata9ITXtChunk8get_text17h240fd700be5c2d74E: (a: number, b: number) => void;
  readonly _ZN3png13text_metadata9ITXtChunk13compress_text17hab86c1b0eac8516fE: (a: number, b: number) => void;
  readonly _ZN3png6common20SourceChromaticities11to_be_bytes17h4d037642ab409c4cE: (a: number, b: number) => void;
  readonly _ZN8fdeflate8compress15compress_to_vec17h6d44d703929675aeE: (a: number, b: number, c: number) => void;
  readonly _ZN8fdeflate20compute_code_lengths17h24df0229de3c89e7E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
  readonly _ZN4core9panicking13assert_failed17h20c23b9dac3e62d5E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN12zune_inflate7decoder14DeflateDecoder11decode_zlib17h302611b7bd12212aE: (a: number, b: number) => void;
  readonly _ZN3exr11compression11Compression22compress_image_section17hcab42155f5540405E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN11miniz_oxide7deflate20compress_to_vec_zlib17h3d83570fbeb63503E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN3exr4meta9attribute13IntegerBounds3end17h53b929e1b5d9a325E: (a: number, b: number) => void;
  readonly _ZN3exr4meta9attribute4Text20from_slice_unchecked17h6298c0a73b5e6985E: (a: number, b: number, c: number) => void;
  readonly _ZN3exr4meta9attribute4Text8validate17h45d4f731173239baE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN3exr4meta9attribute4Text25null_terminated_byte_size17hc293ecd869af3cdbE: (a: number) => number;
  readonly _ZN3exr4meta9attribute4Text19i32_sized_byte_size17h54337b6a593d7b20E: (a: number) => number;
  readonly _ZN3exr4meta9attribute4Text5bytes17hccdc995dfcfeeea6E: (a: number, b: number) => void;
  readonly _ZN3exr4meta9attribute4Text5chars17h6c2c4473cc2ffe54E: (a: number, b: number) => void;
  readonly _ZN3exr4meta9attribute4Text2eq17h5ed4c4b96a46c07aE: (a: number, b: number, c: number) => number;
  readonly _ZN3exr4meta9attribute4Text19eq_case_insensitive17hf6eb1d78c33f69a3E: (a: number, b: number, c: number) => number;
  readonly _ZN3exr4meta9attribute13IntegerBounds3max17h1b98493e0c7d32ceE: (a: number, b: number) => void;
  readonly _ZN3exr4meta9attribute13IntegerBounds11with_origin17h19ab8c046b8a3b4aE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN3exr4meta9attribute13IntegerBounds8contains17h1791584df2534b2eE: (a: number, b: number) => number;
  readonly _ZN3exr4meta9attribute18ChannelDescription28guess_quantization_linearity17h7ef9c9fca892a12fE: (a: number) => number;
  readonly _ZN3exr4meta9attribute18ChannelDescription17subsampled_pixels17hb42a32bbfdbce40bE: (a: number, b: number, c: number) => number;
  readonly _ZN3exr4meta9attribute18ChannelDescription21subsampled_resolution17h915760ad79de053bE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN3exr4meta9attribute18ChannelDescription9byte_size17h047ff82598df7685E: (a: number) => number;
  readonly _ZN3exr4meta9attribute18ChannelDescription8validate17he7f06bb19158a9f5E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN4core9panicking11panic_const24panic_const_rem_overflow17he6a53a821b805558E: (a: number) => void;
  readonly _ZN3exr4meta9attribute11ChannelList9byte_size17h9b5a73f7d09ad94dE: (a: number) => number;
  readonly _ZN3exr4meta9attribute11ChannelList8validate17h604558652a92030aE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN3exr4meta9attribute8TimeCode8validate17h605fedb8be8971dbE: (a: number, b: number, c: number) => void;
  readonly _ZN3exr4meta9attribute8TimeCode21pack_time_as_tv60_u3217h3f7c1fc854fba5fcE: (a: number, b: number) => void;
  readonly _ZN3exr4meta9attribute8TimeCode21pack_time_as_tv50_u3217h26ef9246e8903837E: (a: number, b: number) => void;
  readonly _ZN3exr4meta9attribute8TimeCode14from_tv50_time17h059619115709be4eE: (a: number, b: number, c: number) => void;
  readonly _ZN3exr4meta9attribute8TimeCode23pack_time_as_film24_u3217hebfefae3d40e67b8E: (a: number, b: number) => void;
  readonly _ZN3exr4meta9attribute8TimeCode16from_film24_time17hc8c461b0a543b285E: (a: number, b: number, c: number) => void;
  readonly _ZN3exr4meta9attribute8TimeCode21pack_user_data_as_u3217h3dd45a095c57e1f9E: (a: number) => number;
  readonly _ZN3exr4meta9attribute7Preview8validate17h2b2a2bdad4254947E: (a: number, b: number, c: number) => void;
  readonly _ZN3exr4meta9attribute9byte_size17h8842d617056d5d89E: (a: number, b: number) => number;
  readonly _ZN3exr4meta9attribute14AttributeValue9byte_size17hacfc0b5dad6e9c90E: (a: number) => number;
  readonly _ZN3exr4meta9attribute8validate17hf324300b54fc6dd2E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN3exr4meta9attribute14AttributeValue8validate17hd99a66f48f944c04E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN3exr4meta9attribute14AttributeValue9kind_name17h7b78d53c82d22d1dE: (a: number, b: number) => void;
  readonly _ZN3exr4meta9attribute14AttributeValue9into_text17h76c20b78a7a9553aE: (a: number, b: number) => void;
  readonly _ZN3exr4meta6header6Header13with_encoding17h07b25d20a41f4dcdE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN3exr4meta6header6Header15with_attributes17h35572145e68b23b2E: (a: number, b: number, c: number) => void;
  readonly _ZN3exr4meta6header6Header22with_shared_attributes17hc4abbfe86f97273cE: (a: number, b: number, c: number) => void;
  readonly _ZN3exr4meta6header6Header24enumerate_ordered_blocks17h8c688190acf015c7E: (a: number, b: number) => void;
  readonly _ZN3exr4meta6header6Header25blocks_increasing_y_order8tiles_of15divide_and_rest17h0183a921827f65ffE: (a: number, b: number, c: number) => void;
  readonly _ZN3exr4meta6header6Header39get_block_data_window_pixel_coordinates17h1b60bc4eac48a18dE: (a: number, b: number, c: number) => void;
  readonly _ZN3exr4meta6header6Header36get_scan_line_block_tile_coordinates17h09e3d114e088ad92E: (a: number, b: number, c: number) => void;
  readonly _ZN3exr4meta6header6Header17total_pixel_bytes17h350041462c18c605E: (a: number) => number;
  readonly _ZN3exr4meta6header6Header20max_pixel_file_bytes17h7fa7ee861e8878b6E: (a: number) => number;
  readonly _ZN3exr4meta6header6Header8validate17hd90152ad960c3ddeE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN3exr4meta19compute_block_count17ha944d8fedfcb75caE: (a: number, b: number) => number;
  readonly _ZN3exr4meta19compute_level_count17h6d242821e0be5d4cE: (a: number, b: number) => number;
  readonly _ZN3exr4meta18compute_level_size17hf8ce583c0bd00f01E: (a: number, b: number, c: number) => number;
  readonly _ZN3exr4meta14rip_map_levels17h57d97efe53099537E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN3exr4meta14mip_map_levels17h8c3f5941ea359a78E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN3exr4meta15rip_map_indices17h9de15093fef214e1E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN3exr4meta15mip_map_indices17he1f6e61563491fd7E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN3exr4meta8MetaData38enumerate_ordered_header_block_indices17h95cbec1e157a1f60E: (a: number, b: number) => void;
  readonly _ZN3exr5image11FlatSamples19value_by_flat_index17h68f9d78955b000d8E: (a: number, b: number, c: number) => void;
  readonly _ZN3exr5block6reader22validate_offset_tables17h19f20697af092229E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN3exr5block5chunk15TileCoordinates15to_data_indices17h84d8abe8f053ddb1E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN3exr5block5chunk15TileCoordinates19to_absolute_indices17h8535ed3bdb63bb13E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN3exr5block17UncompressedBlock5lines17hc5dafbce350a36a7E: (a: number, b: number, c: number) => void;
  readonly _ZN12zune_inflate7decoder14DeflateDecoder14decode_deflate17hcc61ecb9b6ef94e6E: (a: number, b: number) => void;
  readonly _ZN12zune_inflate7encoder14DeflateEncoder3new17h3c37b32e38cf9302E: (a: number, b: number, c: number) => void;
  readonly _ZN12zune_inflate7encoder14DeflateEncoder16new_with_options17hf3bf974bf199679cE: (a: number, b: number, c: number) => void;
  readonly _ZN12zune_inflate7encoder14DeflateEncoder14encode_deflate17hf69eae5cf992eb1aE: (a: number) => void;
  readonly _ZN12zune_inflate7encoder14DeflateEncoder11encode_zlib17habd9edee31021d92E: (a: number, b: number) => void;
  readonly _ZN3std2io5error5Error3new17hde5242198e08eeafE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN4core5slice4sort8unstable7ipnsort17h3e43643d4a8b89a1E: (a: number, b: number, c: number) => void;
  readonly _ZN4core5slice4sort8unstable8heapsort8heapsort17h26f2700786333d3bE: (a: number, b: number, c: number) => void;
  readonly _ZN3gif6common5Frame9from_rgba17hb6b3eb7071493704E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN3gif6common5Frame15from_rgba_speed17h74489112c822e2d5E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN11color_quant8NeuQuant3new17hb4139e9da2d6cc6bE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN11color_quant8NeuQuant15search_netindex17h5c65e6e1e6611f13E: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly _ZN11color_quant8NeuQuant13color_map_rgb17h353fc5a0f67b43ecE: (a: number, b: number) => void;
  readonly _ZN3gif6common5Frame8from_rgb17hc6d85f7b1597842fE: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN3gif6common5Frame14from_rgb_speed17h58245cc1da3b68fdE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN3gif6reader7decoder12FrameDecoder36decode_lzw_encoded_frame_into_buffer17h00ed7256559027e7E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN5weezl6decode7Decoder3new17hcb1155a3da1d0b34E: (a: number, b: number, c: number) => void;
  readonly _ZN5weezl6decode7Decoder5reset17hd6539cbf14f7eeb8E: (a: number) => void;
  readonly _ZN3gif6reader7decoder16StreamingDecoder3new17hfce6abb0ad5eec34E: (a: number) => void;
  readonly _ZN5weezl6decode7Decoder9has_ended17h34bf1d9c529637c5E: (a: number) => number;
  readonly _ZN3gif6reader7decoder16StreamingDecoder13current_frame17h2478007719eccba5E: (a: number, b: number) => number;
  readonly _ZN3gif6reader9converter14PixelConverter17check_buffer_size17h84909b604ab32226E: (a: number, b: number, c: number) => void;
  readonly _ZN3gif6reader9converter14PixelConverter11fill_buffer17h61f5500cdff471c0E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN3gif7encoder10lzw_encode17h3ec231c94f7444e6E: (a: number, b: number, c: number) => void;
  readonly _ZN5weezl6encode7Encoder3new17h835ec64125db4690E: (a: number, b: number, c: number) => void;
  readonly _ZN5weezl6encode7IntoVec10encode_all17hdd15f7710259b5dfE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN3gif7encoder9flag_size17h2179cc658ce06a55E: (a: number) => number;
  readonly _ZN11color_quant8NeuQuant4init17h7cc6e9094372ed4eE: (a: number, b: number, c: number) => void;
  readonly _ZN11color_quant8NeuQuant14color_map_rgba17h3f27f5def4136adaE: (a: number, b: number) => void;
  readonly _ZN4core5slice4sort8unstable7ipnsort17he8670c2a4a6309e2E: (a: number, b: number, c: number) => void;
  readonly _ZN4core5slice4sort8unstable8heapsort8heapsort17h8157a6518e5dd201E: (a: number, b: number, c: number) => void;
  readonly _ZN9av1_grain6create28generate_photon_noise_params17hc281881e857b724cE: (a: number, b: bigint, c: bigint, d: number) => void;
  readonly _ZN9av1_grain6create24write_film_grain_segment17he57a147fad9449b2E: (a: number, b: number) => number;
  readonly _ZN9av1_grain6create16TransferFunction9to_linear17h18a328ae91594f89E: (a: number, b: number) => number;
  readonly _ZN9av1_grain6create16TransferFunction11from_linear17h940f52ac6a267f97E: (a: number, b: number) => number;
  readonly _ZN9av1_grain4diff13DiffGenerator3new17h88f07685f7071d40E: (a: number, b: bigint, c: bigint, d: number, e: number) => void;
  readonly _ZN9av1_grain4diff13DiffGenerator6finish17hac84ff992e77de7aE: (a: number, b: number) => void;
  readonly _ZN9av1_grain4diff13DiffGenerator19diff_frame_internal17hc3a616774ab84234E: (a: number, b: number, c: number) => number;
  readonly _ZN9av1_grain5parse17parse_grain_table17h6fe1c493647f861cE: (a: number, b: number, c: number) => void;
  readonly _ZN6anyhow5error9ErrorImpl5error17h113788221ee345b5E: (a: number, b: number) => void;
  readonly _ZN8arrayvec8arrayvec12extend_panic17h744c8d6ece19cde4E: (a: number) => void;
  readonly _ZN3std9backtrace9Backtrace7capture17hca97208cbf9cfc09E: (a: number) => void;
  readonly _ZN6anyhow7nightly21request_ref_backtrace17hc0b6d406f077f060E: (a: number, b: number) => number;
  readonly _ZN6anyhow5error9ErrorImpl7provide17h6f59eceed2532ae1E: (a: number, b: number, c: number) => void;
  readonly _ZN3nom5error12error_to_u3217hfa60f79df368bb61E: (a: number) => number;
  readonly _ZN3nom5error9ErrorKind11description17h344c3c77835813fbE: (a: number, b: number) => void;
  readonly _ZN6anyhow6ensure6render17he9d815dde4f083fcE: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly _ZN6anyhow4kind5Boxed3new17h5b9f705561c074b2E: (a: number, b: number) => number;
  readonly _ZN3std3sys9backtrace28__rust_begin_short_backtrace17h564bb1e07638d60fE: (a: number) => void;
  readonly _ZN3std3sys9backtrace28__rust_begin_short_backtrace17h65cf29aae3809d53E: (a: number) => void;
  readonly _ZN3std6thread9spawnhook15ChildSpawnHooks3run17hf2e31462fadba6fdE: (a: number) => void;
  readonly _ZN4core3fmt8builders11DebugStruct21finish_non_exhaustive17h2c0bc4a0359a16aeE: (a: number) => number;
  readonly _ZN3std6thread6Thread5cname17h0d00514fa30990a0E: (a: number, b: number) => void;
  readonly _ZN3std6thread6scoped9ScopeData29decrement_num_running_threads17h138c7e4afb96534eE: (a: number, b: number) => void;
  readonly _ZN4core3fmt17pointer_fmt_inner17h1a4127772b2d06ffE: (a: number, b: number) => number;
  readonly _ZN10rayon_core3job7JobFifo4push17hde5308698e5a39f8E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN10rayon_core4join23join_recover_from_panic17h7f6a6449166734b6E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN3std3sys4sync7condvar5futex7Condvar4wait17h5fd75e3f48866727E: (a: number, b: number) => void;
  readonly _ZN10rayon_core5latch10CountLatch10with_count17ha59e6cae8802dd85E: (a: number, b: number, c: number) => void;
  readonly _ZN10rayon_core5latch10CountLatch4wait17h16d9d0f5a2246c06E: (a: number, b: number) => void;
  readonly _ZN3std6thread7Builder4name17hd82d58de1a16e1deE: (a: number, b: number, c: number) => void;
  readonly _ZN3std6thread8ThreadId3new17h90ef22580ddcd4caE: () => bigint;
  readonly _ZN3std6thread6Thread3new17h706ad929a439590aE: (a: bigint, b: number) => number;
  readonly _ZN3std6thread9spawnhook15run_spawn_hooks17ha24bb8f1637b2601E: (a: number, b: number) => void;
  readonly _ZN3std6thread6Thread4name17h75ad3c144182dd29E: (a: number, b: number) => void;
  readonly _ZN3std3sys3pal4wasm6thread6Thread3new17h55a8edc10d3d4243E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN10rayon_core8registry8Registry7current17hd4a4b0ad9917d307E: () => number;
  readonly _ZN10rayon_core8registry8Registry14current_thread17h7e1c80fb7d7561e5E: (a: number) => number;
  readonly _ZN10rayon_core5scope5Scope3new17hd783309970cf1cf4E: (a: number, b: number, c: number) => void;
  readonly _ZN10rayon_core5scope9ScopeFifo3new17he7478daa162e4f46E: (a: number, b: number, c: number) => void;
  readonly _ZN10rayon_core5scope9ScopeBase12job_panicked17h39904bc066b7a170E: (a: number, b: number, c: number) => void;
  readonly _ZN10rayon_core5scope9ScopeBase21maybe_propagate_panic17h854f3cbd07507b02E: (a: number) => void;
  readonly _ZN10rayon_core5sleep5Sleep26notify_worker_latch_is_set17hc6ba56e904706b7dE: (a: number, b: number) => void;
  readonly _ZN9wasm_sync7backend7Condvar10notify_one17hb0a26ce0c3e385ebE: (a: number) => void;
  readonly _ZN10rayon_core11thread_pool10ThreadPool3new17hbcf3e36d84257b68E: (a: number, b: number) => void;
  readonly _ZN10rayon_core11thread_pool10ThreadPool9yield_now17hca7dce8b292c39b8E: (a: number) => number;
  readonly _ZN10rayon_core11thread_pool10ThreadPool11yield_local17h9767fdcbf57c5843E: (a: number) => number;
  readonly _ZN10rayon_core11thread_pool9yield_now17h481a5e0001fca8a8E: () => number;
  readonly _ZN10rayon_core11thread_pool11yield_local17h5c105d5e3bddf0beE: () => number;
  readonly _ZN3std5panic13resume_unwind17h64f50cd44574b422E: (a: number, b: number) => void;
  readonly _ZN3std2io5stdio7_eprint17h9ae0efb38ef9f6d9E: (a: number) => void;
  readonly _ZN10rayon_core13Configuration5build17hefdb5bf9f67d7424E: (a: number, b: number) => void;
  readonly _ZN10rayon_core10initialize17h52e84739ecd91159E: (a: number, b: number) => void;
  readonly _ZN3std4sync6poison7condvar7Condvar10notify_one17hb0f446fc8515dcfaE: (a: number) => void;
  readonly _ZN3std4sync6poison7condvar7Condvar10notify_all17h79d7d08099a33cc9E: (a: number) => void;
  readonly _ZN7web_sys8features17gen_WorkerOptions13WorkerOptions3new17hb09692750cc11f93E: () => number;
  readonly _ZN7web_sys8features17gen_WorkerOptions13WorkerOptions4name17h1c7c101f59799ac0E: (a: number, b: number, c: number) => number;
  readonly _ZN7web_sys8features17gen_WorkerOptions13WorkerOptions5type_17hd859b62b0ed4c866E: (a: number, b: number) => number;
  readonly _ZN7web_sys8features9gen_Event5Event5type_17h878ab8492d08d31aE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features9gen_Event5Event6target17h57e3043527b17334E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features9gen_Event5Event14current_target17hef490e71be7b1961E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features9gen_Event5Event11event_phase17h806cd425204747aaE: (a: number) => number;
  readonly _ZN7web_sys8features9gen_Event5Event7bubbles17h7d1d9388a1633d0fE: (a: number) => number;
  readonly _ZN7web_sys8features9gen_Event5Event10cancelable17h864f3b120ff1715bE: (a: number) => number;
  readonly _ZN7web_sys8features9gen_Event5Event17default_prevented17h6256fdac85dc887dE: (a: number) => number;
  readonly _ZN7web_sys8features9gen_Event5Event8composed17h4fd57206e4278678E: (a: number) => number;
  readonly _ZN7web_sys8features9gen_Event5Event10is_trusted17h5a36c94788e906caE: (a: number) => number;
  readonly _ZN7web_sys8features9gen_Event5Event10time_stamp17h4f11701c540fd41aE: (a: number) => number;
  readonly _ZN7web_sys8features9gen_Event5Event13cancel_bubble17hb9e707d1f5a733d9E: (a: number) => number;
  readonly _ZN7web_sys8features9gen_Event5Event17set_cancel_bubble17h8b30adf39a836a35E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features9gen_Event5Event3new17h15f28a059fc1deb4E: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features9gen_Event5Event13composed_path17h12aced4d95db3617E: (a: number) => number;
  readonly _ZN7web_sys8features9gen_Event5Event10init_event17h55d112f5c11eb3f1E: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features9gen_Event5Event23init_event_with_bubbles17h66751e7f577fadbeE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features9gen_Event5Event38init_event_with_bubbles_and_cancelable17hf72249b191d3aa1fE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN7web_sys8features9gen_Event5Event15prevent_default17h770b4543eb371777E: (a: number) => void;
  readonly _ZN7web_sys8features9gen_Event5Event26stop_immediate_propagation17h60079fa5145c23c4E: (a: number) => void;
  readonly _ZN7web_sys8features9gen_Event5Event16stop_propagation17h3e383674a84896a3E: (a: number) => void;
  readonly _ZN7web_sys8features15gen_EventTarget11EventTarget3new17h95f3a795f2057d34E: (a: number) => void;
  readonly _ZN7web_sys8features15gen_EventTarget11EventTarget32add_event_listener_with_callback17hf4be6278e33c60c3E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN7web_sys8features15gen_EventTarget11EventTarget41add_event_listener_with_callback_and_bool17hdaba769b8e411e51E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features15gen_EventTarget11EventTarget61add_event_listener_with_callback_and_bool_and_wants_untrusted17h834ad63f69d2d626E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN7web_sys8features15gen_EventTarget11EventTarget14dispatch_event17he5d518ae426e5bc8E: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features15gen_EventTarget11EventTarget35remove_event_listener_with_callback17ha830fffd0dc943eaE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN7web_sys8features15gen_EventTarget11EventTarget44remove_event_listener_with_callback_and_bool17hccb4d8f2fd39af43E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features13gen_ImageData9ImageData11new_with_sw17h5185289f494ecbe3E: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features13gen_ImageData9ImageData25new_with_u8_clamped_array17ha0dc2a57424960e6E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features13gen_ImageData9ImageData28new_with_js_u8_clamped_array17hf190e05b01333b25E: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features13gen_ImageData9ImageData32new_with_u8_clamped_array_and_sh17h7262f29e1ad4a0c5E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN7web_sys8features13gen_ImageData9ImageData35new_with_js_u8_clamped_array_and_sh17h40f276e22ca7a8dfE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features16gen_MessageEvent12MessageEvent6origin17h92b26b577e55b152E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features16gen_MessageEvent12MessageEvent13last_event_id17h619543ee35c7afe6E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features16gen_MessageEvent12MessageEvent6source17hf2adaf1664907c3eE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features16gen_MessageEvent12MessageEvent5ports17hd1b716c8781985a1E: (a: number) => number;
  readonly _ZN7web_sys8features16gen_MessageEvent12MessageEvent3new17h875614cb25216cf0E: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features16gen_MessageEvent12MessageEvent18init_message_event17haa0975be69d8b377E: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features16gen_MessageEvent12MessageEvent31init_message_event_with_bubbles17hdb6d9afff1dc04b8E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features16gen_MessageEvent12MessageEvent46init_message_event_with_bubbles_and_cancelable17h4659a893208cebc3E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN7web_sys8features16gen_MessageEvent12MessageEvent55init_message_event_with_bubbles_and_cancelable_and_data17hbd84491efe59f2c0E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features16gen_MessageEvent12MessageEvent66init_message_event_with_bubbles_and_cancelable_and_data_and_origin17hebc222a3393e973bE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
  readonly _ZN7web_sys8features16gen_MessageEvent12MessageEvent84init_message_event_with_bubbles_and_cancelable_and_data_and_origin_and_last_event_id17he0cb65aa114d9dfbE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => void;
  readonly _ZN7web_sys8features16gen_MessageEvent12MessageEvent99init_message_event_with_bubbles_and_cancelable_and_data_and_origin_and_last_event_id_and_opt_window17h5ab86bbf127bf015E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number) => void;
  readonly _ZN7web_sys8features16gen_MessageEvent12MessageEvent109init_message_event_with_bubbles_and_cancelable_and_data_and_origin_and_last_event_id_and_opt_window_and_ports17h34b3a13f31c161d4E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number) => void;
  readonly _ZN7web_sys8features13gen_Navigator9Navigator12do_not_track17h3376a69aa7a56a2fE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features13gen_Navigator9Navigator16max_touch_points17h55e5233fa4c70519E: (a: number) => number;
  readonly _ZN7web_sys8features13gen_Navigator9Navigator18active_vr_displays17hfd1224e5b9356e46E: (a: number) => number;
  readonly _ZN7web_sys8features13gen_Navigator9Navigator13device_memory17h145d8e43e1d5fbe4E: (a: number) => number;
  readonly _ZN7web_sys8features13gen_Navigator9Navigator13app_code_name17he40bbb99259a8974E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features13gen_Navigator9Navigator8app_name17hb56921be3b960218E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features13gen_Navigator9Navigator11app_version17hce3e7f47fd9c9e9aE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features13gen_Navigator9Navigator8platform17he2cf0a66a67a33d5E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features13gen_Navigator9Navigator10user_agent17hf4abad544b83aaedE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features13gen_Navigator9Navigator7product17h8a21f0ac5e523f2cE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features13gen_Navigator9Navigator8language17hc0b4e98734eb2710E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features13gen_Navigator9Navigator9languages17h124d5e8635c1827fE: (a: number) => number;
  readonly _ZN7web_sys8features13gen_Navigator9Navigator7on_line17h906ce59c6e6b01fcE: (a: number) => number;
  readonly _ZN7web_sys8features13gen_Navigator9Navigator9can_share17h46809368a13ab33fE: (a: number) => number;
  readonly _ZN7web_sys8features13gen_Navigator9Navigator12get_gamepads17h74a4c1d2a5fc5089E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features13gen_Navigator9Navigator15get_vr_displays17hc1089bc1c8e77695E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features13gen_Navigator9Navigator19request_midi_access17haea230bbc688ef4aE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features13gen_Navigator9Navigator31request_media_key_system_access17h3921bd7c75da3d16E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN7web_sys8features13gen_Navigator9Navigator11send_beacon17h60ac550abd8d67d2E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features13gen_Navigator9Navigator34send_beacon_with_opt_buffer_source17hcfd9030e56d58526E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN7web_sys8features13gen_Navigator9Navigator29send_beacon_with_opt_u8_array17h891bfa84439f3c96E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features13gen_Navigator9Navigator32send_beacon_with_opt_js_u8_array17h4b9f86ded083391dE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN7web_sys8features13gen_Navigator9Navigator24send_beacon_with_opt_str17h93966dea70bc0f24E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features13gen_Navigator9Navigator5share17hca370707039f1fe9E: (a: number) => number;
  readonly _ZN7web_sys8features13gen_Navigator9Navigator21vibrate_with_duration17h1a6336fa089fd344E: (a: number, b: number) => number;
  readonly _ZN7web_sys8features13gen_Navigator9Navigator20vibrate_with_pattern17h8743e8b15b28bbd8E: (a: number, b: number) => number;
  readonly _ZN7web_sys8features13gen_Navigator9Navigator24register_content_handler17h30b2aea75bd6ecebE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
  readonly _ZN7web_sys8features13gen_Navigator9Navigator25register_protocol_handler17h3046a04e46e8b420E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
  readonly _ZN7web_sys8features13gen_Navigator9Navigator13taint_enabled17h625b92caa6e5cc62E: (a: number) => number;
  readonly _ZN7web_sys8features15gen_Performance11Performance11time_origin17h0d2cdfba254ed7c8E: (a: number) => number;
  readonly _ZN7web_sys8features15gen_Performance11Performance26onresourcetimingbufferfull17hba9e30c5e7a4ab8eE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features15gen_Performance11Performance30set_onresourcetimingbufferfull17h7de8cc1084b2b94cE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features15gen_Performance11Performance11clear_marks17h871fbbf6ba44835cE: (a: number) => void;
  readonly _ZN7web_sys8features15gen_Performance11Performance26clear_marks_with_mark_name17h3da0d193ae88e901E: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features15gen_Performance11Performance14clear_measures17h6e34ac74052d42a8E: (a: number) => void;
  readonly _ZN7web_sys8features15gen_Performance11Performance32clear_measures_with_measure_name17hbef57bd90e71aea1E: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features15gen_Performance11Performance22clear_resource_timings17h4ea9e7a39347fb28E: (a: number) => void;
  readonly _ZN7web_sys8features15gen_Performance11Performance11get_entries17h94dc5e522b3611cfE: (a: number) => number;
  readonly _ZN7web_sys8features15gen_Performance11Performance19get_entries_by_name17h59ad8c8df00c7622E: (a: number, b: number, c: number) => number;
  readonly _ZN7web_sys8features15gen_Performance11Performance35get_entries_by_name_with_entry_type17hd65e47a8f0616bcaE: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly _ZN7web_sys8features15gen_Performance11Performance19get_entries_by_type17hf69e9197eb423550E: (a: number, b: number, c: number) => number;
  readonly _ZN7web_sys8features15gen_Performance11Performance4mark17h86b4af44dfab2dc6E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features15gen_Performance11Performance7measure17h0db1127722e4df18E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features15gen_Performance11Performance23measure_with_start_mark17hf9de8bf7ed6417aeE: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features15gen_Performance11Performance36measure_with_start_mark_and_end_mark17h090abfe41ed6f8cdE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
  readonly _ZN7web_sys8features15gen_Performance11Performance34measure_user_agent_specific_memory17h82bd285b4953397fE: (a: number) => number;
  readonly _ZN7web_sys8features15gen_Performance11Performance31set_resource_timing_buffer_size17h012115da0223cf00E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features15gen_Performance11Performance7to_json17h73b17b63f54bd708E: (a: number) => number;
  readonly _ZN7web_sys8features20gen_PerformanceEntry16PerformanceEntry4name17hfed1728fea6e0ce7E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features20gen_PerformanceEntry16PerformanceEntry10entry_type17hfb76077ee7ad2cedE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features20gen_PerformanceEntry16PerformanceEntry10start_time17h6ebbab3811041ffdE: (a: number) => number;
  readonly _ZN7web_sys8features20gen_PerformanceEntry16PerformanceEntry8duration17h4b13be02f94f2811E: (a: number) => number;
  readonly _ZN7web_sys8features20gen_PerformanceEntry16PerformanceEntry7to_json17h9d83f088b24dc402E: (a: number) => number;
  readonly _ZN7web_sys8features10gen_Window6Window6window17ha8613e3fad33ba60E: (a: number) => number;
  readonly _ZN7web_sys8features10gen_Window6Window5self_17hf5f73c4b47d01a03E: (a: number) => number;
  readonly _ZN7web_sys8features10gen_Window6Window4name17hdcff8f400ba571e1E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window8set_name17h006a6693d405b95eE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window6status17h479ced72dab909ffE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window10set_status17h45aa9892a4ddfc9dE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window6closed17hd098b802b886a102E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window5event17h2e40b14abbb4c742E: (a: number) => number;
  readonly _ZN7web_sys8features10gen_Window6Window6frames17h0fdab97a06da31ecE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window6length17h5d11d7c988824e25E: (a: number) => number;
  readonly _ZN7web_sys8features10gen_Window6Window3top17h0a53b551ee21753fE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window6opener17hb2bdde77ed9965b5E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window10set_opener17h056fb29f625e6a87E: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window6parent17h80d94eff9804ed2cE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window14onappinstalled17he035e9dc6ba8059eE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window18set_onappinstalled17h40ba27836ea838b4E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window11inner_width17h85c6b8f189409ccbE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window15set_inner_width17hc42db502bdf13047E: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window12inner_height17he4ea33d148ae2598E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window16set_inner_height17h0ce3dd85dc5699eeE: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window8scroll_x17h462ca4b27a3bd4b5E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window13page_x_offset17h33da1eeb5b76af13E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window8scroll_y17h83f1515af7dae47fE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window13page_y_offset17hdce682bba3667d38E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window8screen_x17h3a49723c5eb2e24fE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window12set_screen_x17h8418ce658a037dd6E: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window8screen_y17h110832fbc092c19eE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window12set_screen_y17h3bf9de293c414657E: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window11outer_width17hc0709437df0ecf9eE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window15set_outer_width17h3dbef081e48b3495E: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window12outer_height17hd2dc232983d7c04bE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window16set_outer_height17hc3fd82d1e0897f85E: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window18device_pixel_ratio17hea34999cd0eb6835E: (a: number) => number;
  readonly _ZN7web_sys8features10gen_Window6Window11orientation17hc784c2de24c6781cE: (a: number) => number;
  readonly _ZN7web_sys8features10gen_Window6Window19onorientationchange17ha67bfa520eab7327E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window23set_onorientationchange17h558b54f0c86dab8dE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window18onvrdisplayconnect17hb4bfade3b29efd13E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window22set_onvrdisplayconnect17h331975fda8b73fecE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window21onvrdisplaydisconnect17h386c9b067f4c5775E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window25set_onvrdisplaydisconnect17h79bf1a47b5fadc51E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window19onvrdisplayactivate17h3d415ad9be0aeac5E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window23set_onvrdisplayactivate17h876b6c09f940c488E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window21onvrdisplaydeactivate17hb6242e929d88c9a4E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window25set_onvrdisplaydeactivate17hc8b1c39a325c0275E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window24onvrdisplaypresentchange17h6cb4ff5a69fe4652E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window28set_onvrdisplaypresentchange17h2d6c9f447ce75cacE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window7onabort17ha7d54112be7117c3E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window11set_onabort17ha2bdd5ccce6d8efdE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window6onblur17h5766d1ea800e06b9E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window10set_onblur17ha2f8bfb1e375e853E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window7onfocus17hc7959dab18c403f6E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window11set_onfocus17h5fd98352311e6c64E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window10onauxclick17h11ca45abc962a421E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window14set_onauxclick17hc011966db904054fE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window14onbeforetoggle17h18055e0ce820a33dE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window18set_onbeforetoggle17h9290355893ccfaffE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window9oncanplay17h03d4a943c752b555E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window13set_oncanplay17h6dc6ab9316bd8ed1E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window16oncanplaythrough17hf5cd7247076e6c24E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window20set_oncanplaythrough17hf94d5fe2a60d0332E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window8onchange17h34bf753470d76703E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window12set_onchange17h96c59d3eb0b7fd90E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window7onclick17hda2d6e860848e13aE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window11set_onclick17hdcfdc1f7f3d7095cE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window7onclose17hc281d75fb4e8f429E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window11set_onclose17h515a07b8818b9459E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window13oncontextmenu17h0a5bf4b1213b5119E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window17set_oncontextmenu17h4aeb83a4887c3c15E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window10ondblclick17h85d41ab89e3b6f59E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window14set_ondblclick17h5f3eadd3be412f17E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window6ondrag17hf72428e6bc00630aE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window10set_ondrag17h42bc2d68e1f00f84E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window9ondragend17hdbcbb024b143a4d2E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window13set_ondragend17hffd4f6e357a16cf8E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window11ondragenter17hf544c314f1d153c3E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window15set_ondragenter17h0a8d121e44569b32E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window10ondragexit17h6de597792d2e45e3E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window14set_ondragexit17h1245d3b0c78dd799E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window11ondragleave17h479f661b5eb54ea0E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window15set_ondragleave17h9622c84389c027f0E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window10ondragover17hbeecd8e2b450911eE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window14set_ondragover17hb34c35a361e336c1E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window11ondragstart17hfba0a3c980de4dd9E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window15set_ondragstart17hb906540b951c0761E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window6ondrop17h207b334de09a07f1E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window10set_ondrop17h52be75a565098f7cE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window16ondurationchange17h63b337962bbec2ccE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window20set_ondurationchange17h709d519191821cccE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window9onemptied17h6dd876b3a866f6e3E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window13set_onemptied17h31bea90cda1e82a7E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window7onended17h6c12a6487aebe5a6E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window11set_onended17h44914a59bd514042E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window7oninput17hcc3ffa459b2e965bE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window11set_oninput17h62a2795632e1f3feE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window9oninvalid17h8849685736ba5e48E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window13set_oninvalid17h7f95ca3b248cd915E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window9onkeydown17h57bac3aab1bb8771E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window13set_onkeydown17h8e23b08b4cddfdcfE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window10onkeypress17hde58c7e31e1a29aeE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window14set_onkeypress17hf1f91bc3fee77454E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window7onkeyup17hc51558a6c8cb3c66E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window11set_onkeyup17hcb5351a383c0e49bE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window6onload17h81937fc34fc48f52E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window10set_onload17hf662758d0b031a7fE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window12onloadeddata17h58919c6098ef4bffE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window16set_onloadeddata17h7126192fc0d1a76dE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window16onloadedmetadata17h4de97ccd70365b4bE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window20set_onloadedmetadata17h1a99af41e890232eE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window9onloadend17h450a29d162ee8177E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window13set_onloadend17h4f1509d214dbcaccE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window11onloadstart17hbeeb63925feebeb2E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window15set_onloadstart17hd9609895dc5ab239E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window11onmousedown17h9836caf1f40eb25dE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window15set_onmousedown17h5b5dd0a980512e26E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window12onmouseenter17h89c84b9796dbbfaaE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window16set_onmouseenter17hc9a6a5d92da39468E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window12onmouseleave17hc7626c449f8dc672E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window16set_onmouseleave17hb7939444d14086a0E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window11onmousemove17h66dd36a6b24b9b1aE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window15set_onmousemove17hb69b04c92cb9d8efE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window10onmouseout17h45014acb7c7c85efE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window14set_onmouseout17hc96919815c82a41bE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window11onmouseover17h7bc974dcc2f83df2E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window15set_onmouseover17h9b5e482b9d0883afE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window9onmouseup17h728bea5bc3fe58d5E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window13set_onmouseup17hc4809e96e0b7f649E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window7onwheel17h1659fa3743e84f2cE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window11set_onwheel17hd1fe6d5cf18026a7E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window7onpause17h2044f6215de251d7E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window11set_onpause17h2b52017223f803f6E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window6onplay17h908c312fe3ea4c32E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window10set_onplay17h01f37795904f966eE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window9onplaying17h1cfab107bbe97f47E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window13set_onplaying17hcc3e68be34823283E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window10onprogress17hf1f82b61ed1d4829E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window14set_onprogress17h4112f17735fb23a4E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window12onratechange17h0412d8f3388be08eE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window16set_onratechange17h89871e85195c5a28E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window7onreset17ha1250708f10edbbcE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window11set_onreset17hfce5281e9160def8E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window8onresize17hcf2dcc7a503e27f0E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window12set_onresize17h4e6e852a7387f4b1E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window8onscroll17h0d3709ea17510c79E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window12set_onscroll17h3f2a5881709b2a5eE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window8onseeked17h104039e90d334a78E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window12set_onseeked17hda4096f8c5489debE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window9onseeking17hac09817fc3347413E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window13set_onseeking17h611c694fc8a90f74E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window8onselect17h689451f129cadfd0E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window12set_onselect17h458f3466804edfccE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window6onshow17h7e3485fbb6967424E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window10set_onshow17hd98489d765841f8aE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window9onstalled17h0c58616745aabc7fE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window13set_onstalled17h0ccefa4bdeba8168E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window8onsubmit17h575d0dae2fa7ad43E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window12set_onsubmit17h2838c979805b921dE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window9onsuspend17he55d62350641acb1E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window13set_onsuspend17h99b3c2a4d158866eE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window12ontimeupdate17h42165ab12aa1ecb5E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window16set_ontimeupdate17h3bb2e1a48058d3f8E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window14onvolumechange17h3da62ab947a58749E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window18set_onvolumechange17h00194aa05be99e29E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window9onwaiting17hbeff1ce652c2f41cE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window13set_onwaiting17h6bf277c1f6e66cd6E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window13onselectstart17hbe4ff1bf490d9f07E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window17set_onselectstart17he783f542c249c131E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window8ontoggle17h23d297a8b7963ef1E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window12set_ontoggle17h680458b9c4e1105fE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window15onpointercancel17hbc1bad72a7506a09E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window19set_onpointercancel17h5164e8d51195322eE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window13onpointerdown17h069a2538f7981b84E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window17set_onpointerdown17hce655463e8306d36E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window11onpointerup17hcc4ca2ec9355e865E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window15set_onpointerup17h80353cfff9e3f733E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window13onpointermove17h09ea65240a5b0531E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window17set_onpointermove17heed59d495c95ec7eE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window12onpointerout17haae769f4320f69faE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window16set_onpointerout17h76e0182b4a84ef01E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window13onpointerover17h513a7d0d240eb53aE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window17set_onpointerover17h3247b389c0639f97E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window14onpointerenter17hdf38fd71593f2bdfE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window18set_onpointerenter17habae09fa8bbd49f2E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window14onpointerleave17hfe78a9989dc1209fE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window18set_onpointerleave17h3e6d278bad30c6e9E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window19ongotpointercapture17h7da94b4774f690d1E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window23set_ongotpointercapture17hf7567509878cdfe1E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window20onlostpointercapture17h68e8ddcf13752a1aE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window24set_onlostpointercapture17h81adb2a4bc765a86E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window17onanimationcancel17h38de3d03780e5da9E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window21set_onanimationcancel17hef2f13707a55c408E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window14onanimationend17hea22f5d45af3a49eE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window18set_onanimationend17hff4cdd24a138cdcdE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window20onanimationiteration17hd31b64a73b884ac5E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window24set_onanimationiteration17h38986061ddaa6a28E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window16onanimationstart17hd7e76fa8d41219abE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window20set_onanimationstart17ha4b5e0e3c5caf628E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window18ontransitioncancel17h711849aad9349706E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window22set_ontransitioncancel17ha5f8dd16de346082E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window15ontransitionend17h7a82549f41fed5d2E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window19set_ontransitionend17h4001e9beadef1b28E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window15ontransitionrun17hf14c46ece37cf5baE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window19set_ontransitionrun17h0090e9999445098bE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window17ontransitionstart17h9c7e0400d9e454cfE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window21set_ontransitionstart17hc1ddb6fb92076a2eE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window20onwebkitanimationend17haecac7fb15f16514E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window24set_onwebkitanimationend17h9b17667616acf2a2E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window26onwebkitanimationiteration17h13cd922a3bc8e47eE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window30set_onwebkitanimationiteration17hd04566152740255fE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window22onwebkitanimationstart17h897ce4a342edbf2cE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window26set_onwebkitanimationstart17hfe7f251bac61218eE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window21onwebkittransitionend17h8c120911c89b31a8E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window25set_onwebkittransitionend17hde862152d59bce6bE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window7onerror17haf2ca95eb555b78cE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window11set_onerror17hb469f2045e001e50E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window12ontouchstart17h5282427d0ae00b6aE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window16set_ontouchstart17ha5f12f36b133aaf8E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window10ontouchend17h9a8394684d07c845E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window14set_ontouchend17hd83ee52282c5e412E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window11ontouchmove17hd193c93512730c23E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window15set_ontouchmove17h6bebe8d5bdb7f93cE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window13ontouchcancel17h5d5237fa37614cf0E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window17set_ontouchcancel17h1d79e954f4dfb828E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window12onafterprint17h506e75b6e752f9baE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window16set_onafterprint17h20e4d513dd805d69E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window13onbeforeprint17h708b46b456e707e9E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window17set_onbeforeprint17h14d2d5f49764cc00E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window14onbeforeunload17hacca4cbf0cdd083eE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window18set_onbeforeunload17hdce29a644ac449e0E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window12onhashchange17h1dafb90f1429a157E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window16set_onhashchange17h9a52200aed815a72E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window16onlanguagechange17he1a44ee7ff96cb3cE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window20set_onlanguagechange17hf3eaf46e585e93f3E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window9onmessage17h88534a752e3335c7E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window13set_onmessage17h4e98dfb7b653b27bE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window14onmessageerror17h8876eeb31bf327abE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window18set_onmessageerror17h0a5cc060bd809f21E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window9onoffline17h675e3f5b20628e14E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window13set_onoffline17h3d2d23f853a35344E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window8ononline17ha2a7759e31192306E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window12set_ononline17hf98665e37dc49c98E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window10onpagehide17h2037ca1f0dc56519E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window14set_onpagehide17hadaf8ef51b412e14E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window10onpageshow17h79d8cc456ca223acE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window14set_onpageshow17hc26cf6d8c6b71936E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window10onpopstate17h693744e4ff94a160E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window14set_onpopstate17h814088b03f5316afE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window9onstorage17he63eb62d693d7d7aE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window13set_onstorage17hc0032d2bfeace728E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window8onunload17h60cfa91dd34c16bcE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window12set_onunload17h1ecce12250b59775E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window18ongamepadconnected17h956ce3d837110504E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window22set_ongamepadconnected17hb47faab3f0e75d2aE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window21ongamepaddisconnected17h56e23a7f1d3cdc8dE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window25set_ongamepaddisconnected17hbd9b200496fea5f3E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window6origin17h536c71f3977e4c88E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window17is_secure_context17h94fb0b7efcad9d4bE: (a: number) => number;
  readonly _ZN7web_sys8features10gen_Window6Window5alert17hc7a171f903fe3e7dE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window18alert_with_message17hba70bc38b2a796dfE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window4blur17h7630d85441b6ca37E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window20cancel_idle_callback17h85ac82edf31b21f4E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window14capture_events17had707c4e5df9e2bdE: (a: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window5close17h019daf37f38c18feE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window7confirm17h8bcf1adfc48d7631E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window20confirm_with_message17h5ed71cbfd80535e1E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window5focus17h71eb3f03edeb9ca9E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window7move_by17hf6c7e2998c285109E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window7move_to17h3fe3d5ec6abb2956E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window4open17hcfa32abe80ec5110E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window13open_with_url17h446bf24e8a6fbc7dE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window24open_with_url_and_target17h7f019c43284a2fcbE: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window37open_with_url_and_target_and_features17h6a2450fef54f9555E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window12post_message17h07e504a19d2d9e50E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window26post_message_with_transfer17h8c9947de62f922bdE: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window5print17h41abca0b79289241E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window6prompt17hc38799a551f5a380E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window19prompt_with_message17ha674d50e5edb613aE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window31prompt_with_message_and_default17h87a29383a7ad4c73E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window17query_local_fonts17h1a7bb42bc3555cb1E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window14release_events17h47446cdee9bfc128E: (a: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window21request_idle_callback17hab25c3e047b7da66E: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window9resize_by17h0037bc5ba547c3f5E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window9resize_to17h866a4ccfe3ce7db0E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window19scroll_with_x_and_y17hd5bdb61ca163e541E: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window6scroll17h22b0a7b7a914f237E: (a: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window22scroll_by_with_x_and_y17h4b8757fd593482a2E: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window9scroll_by17h070a38e935962242E: (a: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window22scroll_to_with_x_and_y17hc35aefadd7fdd00fE: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window9scroll_to17h5757ec953f7a6e8fE: (a: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window21show_directory_picker17h5979f3dac92dba00E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window21show_open_file_picker17hff69f11bf4950723E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window21show_save_file_picker17hfd31d7add767bde5E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window4stop17hd81543bad4cfcc4dE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window3get17h57a1845c36ddfb97E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window22cancel_animation_frame17ha5fc14c01319d884E: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window23request_animation_frame17hb4feac865494ffb9E: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window4atob17h41e09b53802cd106E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window4btoa17hf7e1c95e7ffe03a9E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window14clear_interval17h5b82fcdc95e0563fE: (a: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window26clear_interval_with_handle17he1e97630cebbd284E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window13clear_timeout17h089fd1b34b025453E: (a: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window25clear_timeout_with_handle17hccf55873feb05482E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window35create_image_bitmap_with_image_data17h539c38489e4d448fE: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window71create_image_bitmap_with_image_data_and_a_sx_and_a_sy_and_a_sw_and_a_sh17h4bc73878f871c894E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window14fetch_with_str17h3c9cbfd42ac93d83E: (a: number, b: number, c: number) => number;
  readonly _ZN7web_sys8features10gen_Window6Window15queue_microtask17h65c503fd52115929E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window26set_interval_with_callback17h5f2929d22fe98764E: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window52set_interval_with_callback_and_timeout_and_arguments17hef9d04889a7670feE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window54set_interval_with_callback_and_timeout_and_arguments_017h91c78503a313a43cE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window54set_interval_with_callback_and_timeout_and_arguments_117h6b6278f6d768c473E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window54set_interval_with_callback_and_timeout_and_arguments_217h0b5f3355875926ceE: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window54set_interval_with_callback_and_timeout_and_arguments_317h295fdbc1b491c75bE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window54set_interval_with_callback_and_timeout_and_arguments_417h96692846e43d127bE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window54set_interval_with_callback_and_timeout_and_arguments_517hb19b6041313b00b4E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window54set_interval_with_callback_and_timeout_and_arguments_617h3fd41de912746730E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window54set_interval_with_callback_and_timeout_and_arguments_717h6c543db7c53ef009E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window21set_interval_with_str17h292034c6a92f977aE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window44set_interval_with_str_and_timeout_and_unused17hd8a282acc2586c92E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window46set_interval_with_str_and_timeout_and_unused_017hb2702ec2fbdb0d64E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window46set_interval_with_str_and_timeout_and_unused_117h0520ede89d607861E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window46set_interval_with_str_and_timeout_and_unused_217hfacbbd607caeb606E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window46set_interval_with_str_and_timeout_and_unused_317h6e135ef415de8cadE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window46set_interval_with_str_and_timeout_and_unused_417h81cf8ecfe59f2010E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window46set_interval_with_str_and_timeout_and_unused_517h17b497fea31c9034E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window46set_interval_with_str_and_timeout_and_unused_617hfb9b8bf0485f0507E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window46set_interval_with_str_and_timeout_and_unused_717ha45a0c48d5da3e4cE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window25set_timeout_with_callback17h9e1af4c1ea879e62E: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window51set_timeout_with_callback_and_timeout_and_arguments17hb7adeb64cde618baE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window53set_timeout_with_callback_and_timeout_and_arguments_017h7d054342f7a38026E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window53set_timeout_with_callback_and_timeout_and_arguments_117hcf614d64411b5e8fE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window53set_timeout_with_callback_and_timeout_and_arguments_217h175b1acbbc1083ceE: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window53set_timeout_with_callback_and_timeout_and_arguments_317h97213254830978feE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window53set_timeout_with_callback_and_timeout_and_arguments_417h2d5beb3d88efe596E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window53set_timeout_with_callback_and_timeout_and_arguments_517h1dbfde26f71c6541E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window53set_timeout_with_callback_and_timeout_and_arguments_617hcb474b9ea93970c9E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window53set_timeout_with_callback_and_timeout_and_arguments_717hda35a3bb3416c577E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window20set_timeout_with_str17h439e89f6d80a6b5eE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window43set_timeout_with_str_and_timeout_and_unused17ha0d29be21250b318E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window45set_timeout_with_str_and_timeout_and_unused_017ha325ba1d71921d33E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window45set_timeout_with_str_and_timeout_and_unused_117h0a083300523df2feE: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window45set_timeout_with_str_and_timeout_and_unused_217h59af890f64e6da68E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window45set_timeout_with_str_and_timeout_and_unused_317h4fcf0932d6c30712E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window45set_timeout_with_str_and_timeout_and_unused_417h10178a2d3ab5caa9E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window45set_timeout_with_str_and_timeout_and_unused_517h801156e7ef3720f5E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window45set_timeout_with_str_and_timeout_and_unused_617ha3bb77ea52572a9dE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number) => void;
  readonly _ZN7web_sys8features10gen_Window6Window45set_timeout_with_str_and_timeout_and_unused_717h4e7c69018b9e5f5aE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number) => void;
  readonly _ZN7web_sys8features10gen_Worker6Worker9onmessage17h873d7ceb7161b07bE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Worker6Worker14onmessageerror17h68ea2b23a93d2b38E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Worker6Worker18set_onmessageerror17h92d6f476b62b7f8dE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Worker6Worker7onerror17h98f2aafd6a0f1595E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Worker6Worker11set_onerror17h906dd268ba31f46cE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features10gen_Worker6Worker16new_with_options17h2575d85b9f9840e3E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features10gen_Worker6Worker26post_message_with_transfer17h3377bd6f4f8af4d8E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features10gen_Worker6Worker9terminate17hb60b1c04be64bbcaE: (a: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope5self_17h7ee20d457f975645E: (a: number) => number;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope7onerror17hb93957e130da203aE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope11set_onerror17hcb46ace032e4b6e8E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope9onoffline17h444fe53b452564f2E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope13set_onoffline17h6811f23d6617a58aE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope8ononline17h2ec4bc7317dc87d2E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope12set_ononline17h93e26a311480c513E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope11performance17h8148e79b188d966dE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope6origin17hc4b408545a51ed0cE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope17is_secure_context17h6ed9285bdf251342E: (a: number) => number;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope14import_scripts17h1e2d82f6519f039bE: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope16import_scripts_017h8436a3c568dda749E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope16import_scripts_117haf6a9f8499088d59E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope16import_scripts_217h27a5a3dc66b0068fE: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope16import_scripts_317h47fc569cab913dafE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope16import_scripts_417h5f68769ccb052814E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope16import_scripts_517he0d09dc59296e6a6E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope16import_scripts_617h1abbbf6f05a5d7e3E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope16import_scripts_717hbe97502f5ce9c6c8E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number, p: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope4atob17h9d460a4b39bb2a4eE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope4btoa17h4d6643b9f9251c31E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope14clear_interval17hf6f0a4292860be28E: (a: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope26clear_interval_with_handle17hd12f8bc88a93404aE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope13clear_timeout17h496d58ae272971f9E: (a: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope25clear_timeout_with_handle17h9ba55f283a869e90E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope35create_image_bitmap_with_image_data17hb3c94b41ce57f6f4E: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope71create_image_bitmap_with_image_data_and_a_sx_and_a_sy_and_a_sw_and_a_sh17h06fe68201f29c52eE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope14fetch_with_str17h5064d8df2ec8f74fE: (a: number, b: number, c: number) => number;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope15queue_microtask17h8e838b8d71a70916E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope26set_interval_with_callback17h9ac42080f95df58aE: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope52set_interval_with_callback_and_timeout_and_arguments17hf1b22f961d4f6128E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope54set_interval_with_callback_and_timeout_and_arguments_017hd64ad49bd191df7eE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope54set_interval_with_callback_and_timeout_and_arguments_117hc78fe75e6cffb65bE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope54set_interval_with_callback_and_timeout_and_arguments_217hf1fdf961e5092bcbE: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope54set_interval_with_callback_and_timeout_and_arguments_317h92626ac58f06beadE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope54set_interval_with_callback_and_timeout_and_arguments_417heb5cdc005fea7eeeE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope54set_interval_with_callback_and_timeout_and_arguments_517hd41673449b96d60eE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope54set_interval_with_callback_and_timeout_and_arguments_617h734dec7df9d7714fE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope54set_interval_with_callback_and_timeout_and_arguments_717hf2b53d879e937676E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope21set_interval_with_str17ha95f43fb30750422E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope44set_interval_with_str_and_timeout_and_unused17h795b071abbcbaee7E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope46set_interval_with_str_and_timeout_and_unused_017hc2f62353f4d6fd30E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope46set_interval_with_str_and_timeout_and_unused_117hd8b9093decfb9d05E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope46set_interval_with_str_and_timeout_and_unused_217hd5cfc0669b0aba13E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope46set_interval_with_str_and_timeout_and_unused_317hb7317a9c982d58cfE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope46set_interval_with_str_and_timeout_and_unused_417h990c9831e4c8d3e4E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope46set_interval_with_str_and_timeout_and_unused_517hba8ff406781dbe41E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope46set_interval_with_str_and_timeout_and_unused_617h79d8de68af2dca8bE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope46set_interval_with_str_and_timeout_and_unused_717hf0ae9b4a5ad93adeE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope25set_timeout_with_callback17h4834916972993ac9E: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope51set_timeout_with_callback_and_timeout_and_arguments17h58425ba4f6019f98E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope53set_timeout_with_callback_and_timeout_and_arguments_017h7153a6f07467a21aE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope53set_timeout_with_callback_and_timeout_and_arguments_117he7fa153de2975805E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope53set_timeout_with_callback_and_timeout_and_arguments_217hdc43395cebebd205E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope53set_timeout_with_callback_and_timeout_and_arguments_317hbf0cd75a017ccf40E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope53set_timeout_with_callback_and_timeout_and_arguments_417h752cca8a91e2a65aE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope53set_timeout_with_callback_and_timeout_and_arguments_517hc974d2538c2e7a23E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope53set_timeout_with_callback_and_timeout_and_arguments_617hce8df8c528acabddE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope53set_timeout_with_callback_and_timeout_and_arguments_717hf7ac1a6ab03ba418E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope20set_timeout_with_str17h0155a3062389cc69E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope43set_timeout_with_str_and_timeout_and_unused17he91771b24321078cE: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope45set_timeout_with_str_and_timeout_and_unused_017hfbab6ded0253598bE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope45set_timeout_with_str_and_timeout_and_unused_117h898c93a14ad9ea8eE: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope45set_timeout_with_str_and_timeout_and_unused_217ha948ed280e5d698dE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope45set_timeout_with_str_and_timeout_and_unused_317he63341d5ec4612cbE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope45set_timeout_with_str_and_timeout_and_unused_417hbbcc00c6048474bfE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope45set_timeout_with_str_and_timeout_and_unused_517he2d91a6375091bb5E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope45set_timeout_with_str_and_timeout_and_unused_617ha63e15da49e6194dE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number) => void;
  readonly _ZN7web_sys8features21gen_WorkerGlobalScope17WorkerGlobalScope45set_timeout_with_str_and_timeout_and_unused_717h2fcd282e540e41a8E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number) => void;
  readonly _ZN7web_sys8features17gen_WorkerOptions13WorkerOptions8get_name17h6aad12a83db9bbeaE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features17gen_WorkerOptions13WorkerOptions8set_name17h6708f7c3a00dec9bE: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features17gen_WorkerOptions13WorkerOptions8get_type17h9290c5a216298e4eE: (a: number) => number;
  readonly _ZN7web_sys8features17gen_WorkerOptions13WorkerOptions8set_type17hcf70b2885ba4f028E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features14gen_WorkerType10WorkerType13from_js_value17h4c9c63852411233cE: (a: number) => number;
  readonly _ZN7web_sys8features11gen_console7console6assert17hcef63833261780f5E: () => void;
  readonly _ZN7web_sys8features11gen_console7console30assert_with_condition_and_data17hcb6ad26a7dc1ede7E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features11gen_console7console32assert_with_condition_and_data_017h245307122a73630eE: (a: number) => void;
  readonly _ZN7web_sys8features11gen_console7console32assert_with_condition_and_data_117h435d89448ffb3e75E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features11gen_console7console32assert_with_condition_and_data_217hd83d19db2036c99fE: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features11gen_console7console32assert_with_condition_and_data_317h44be4962969722a8E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features11gen_console7console32assert_with_condition_and_data_417hb87de7e7a21a2abbE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN7web_sys8features11gen_console7console32assert_with_condition_and_data_517h23e04fd19b4e698bE: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features11gen_console7console32assert_with_condition_and_data_617h499c62c2d9750930E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN7web_sys8features11gen_console7console32assert_with_condition_and_data_717haa5fb1ad0dbbaab0E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
  readonly _ZN7web_sys8features11gen_console7console5clear17h328ac00ca2d17e2cE: () => void;
  readonly _ZN7web_sys8features11gen_console7console5count17h3a0fa3cf77c04c7eE: () => void;
  readonly _ZN7web_sys8features11gen_console7console16count_with_label17h3ba4a8d444652993E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features11gen_console7console11count_reset17hdbb03b80947dba45E: () => void;
  readonly _ZN7web_sys8features11gen_console7console22count_reset_with_label17h75df83a2d8fe1f58E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features11gen_console7console5debug17h2c6aedf6a88e98e4E: (a: number) => void;
  readonly _ZN7web_sys8features11gen_console7console7debug_017h82ae396b1be254d2E: () => void;
  readonly _ZN7web_sys8features11gen_console7console7debug_217h8f4ff05d6665bdd4E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features11gen_console7console7debug_317h0b108d6855c43d90E: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features11gen_console7console7debug_417hb18ca73374332b44E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features11gen_console7console7debug_517hdedc5d228d2c2180E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN7web_sys8features11gen_console7console7debug_617h6e187e7465153b82E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features11gen_console7console7debug_717h897de4e837065572E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN7web_sys8features11gen_console7console3dir17h6d0788dc7143c850E: (a: number) => void;
  readonly _ZN7web_sys8features11gen_console7console5dir_017h03e34299f8908257E: () => void;
  readonly _ZN7web_sys8features11gen_console7console5dir_117he677bec5a78acaa2E: (a: number) => void;
  readonly _ZN7web_sys8features11gen_console7console5dir_217h7c14dfa8c3148880E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features11gen_console7console5dir_317hc998c53b2d0b805fE: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features11gen_console7console5dir_417hb84ca56bb53e316fE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features11gen_console7console5dir_517h1401c60c16be48c8E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN7web_sys8features11gen_console7console5dir_617h6c0f751684cec9a6E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features11gen_console7console5dir_717heaa90a19ad955768E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN7web_sys8features11gen_console7console6dirxml17h89248a93ad36b309E: (a: number) => void;
  readonly _ZN7web_sys8features11gen_console7console8dirxml_017h5ad953da707a7557E: () => void;
  readonly _ZN7web_sys8features11gen_console7console8dirxml_117h95e20f974ea66bd0E: (a: number) => void;
  readonly _ZN7web_sys8features11gen_console7console8dirxml_217hddf8f13d1aa268dfE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features11gen_console7console8dirxml_317h7f55f746c92a583bE: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features11gen_console7console8dirxml_417h4c708c866dcc67cdE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features11gen_console7console8dirxml_517h64a8e67b894a2ea9E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN7web_sys8features11gen_console7console8dirxml_617h7f5088d9ac3ca124E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features11gen_console7console8dirxml_717h2e434add1c0de5c6E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN7web_sys8features11gen_console7console5error17h827d19625db35842E: (a: number) => void;
  readonly _ZN7web_sys8features11gen_console7console7error_017h43fa3e1186ad1229E: () => void;
  readonly _ZN7web_sys8features11gen_console7console7error_217h99d2c53660318d73E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features11gen_console7console7error_317h87b5a6e39dc64a0eE: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features11gen_console7console7error_417h82ca2b6396f1c91eE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features11gen_console7console7error_517ha9509d7bad8d8f0fE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN7web_sys8features11gen_console7console7error_617he9fd87cbaeab87e6E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features11gen_console7console7error_717h368da4cb36ff8a6cE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN7web_sys8features11gen_console7console9exception17hfb00f8899990c9ffE: (a: number) => void;
  readonly _ZN7web_sys8features11gen_console7console11exception_017h5f370129612c51c5E: () => void;
  readonly _ZN7web_sys8features11gen_console7console11exception_117h92a634f62f9c4215E: (a: number) => void;
  readonly _ZN7web_sys8features11gen_console7console11exception_217hda17bcae2614ba7fE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features11gen_console7console11exception_317hfa0914d57dbbe5fcE: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features11gen_console7console11exception_417h76b75833e5bb7883E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features11gen_console7console11exception_517hd08b7bc3ab8e660eE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN7web_sys8features11gen_console7console11exception_617h214201d0c3b6b75bE: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features11gen_console7console11exception_717hb9c0b9d5b9c59b81E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN7web_sys8features11gen_console7console5group17h1948749c44f171f2E: (a: number) => void;
  readonly _ZN7web_sys8features11gen_console7console7group_017h2354c430fbc5a6e2E: () => void;
  readonly _ZN7web_sys8features11gen_console7console7group_117h77fda61f17194a58E: (a: number) => void;
  readonly _ZN7web_sys8features11gen_console7console7group_217hf4ab68c3ee59845eE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features11gen_console7console7group_317h24464754677293bdE: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features11gen_console7console7group_417h3818790bbae633ddE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features11gen_console7console7group_517h46eb45b5ab2339daE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN7web_sys8features11gen_console7console7group_617h9b46c9da1eac2b7cE: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features11gen_console7console7group_717ha18734c4d3aba3e5E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN7web_sys8features11gen_console7console15group_collapsed17hed9e7c2c94563f18E: (a: number) => void;
  readonly _ZN7web_sys8features11gen_console7console17group_collapsed_017h8b72e90ced09e96aE: () => void;
  readonly _ZN7web_sys8features11gen_console7console17group_collapsed_117hce9b3c9914e75e30E: (a: number) => void;
  readonly _ZN7web_sys8features11gen_console7console17group_collapsed_217hcd4576a8c80cc4eaE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features11gen_console7console17group_collapsed_317h5d2683d57518a9abE: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features11gen_console7console17group_collapsed_417h8a587f0041bca07fE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features11gen_console7console17group_collapsed_517h09859ae193e7885bE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN7web_sys8features11gen_console7console17group_collapsed_617h3c31bf78c5ce3249E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features11gen_console7console17group_collapsed_717hcb9a5928eca69efeE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN7web_sys8features11gen_console7console9group_end17hb0f37a540ae622fbE: () => void;
  readonly _ZN7web_sys8features11gen_console7console4info17heea5a5baa4f45d18E: (a: number) => void;
  readonly _ZN7web_sys8features11gen_console7console6info_017h0dc4a828f3e12fc0E: () => void;
  readonly _ZN7web_sys8features11gen_console7console6info_217h8a72ed0a6ea9c6afE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features11gen_console7console6info_317h2ac07573b5dd56c0E: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features11gen_console7console6info_417h5a281addea532af9E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features11gen_console7console6info_517hf986b644ea16ad47E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN7web_sys8features11gen_console7console6info_617h61b87c1e357d805cE: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features11gen_console7console6info_717h127f0265b5dd7831E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN7web_sys8features11gen_console7console3log17h3628dec7eab0c186E: (a: number) => void;
  readonly _ZN7web_sys8features11gen_console7console5log_017h85a9ec1058416387E: () => void;
  readonly _ZN7web_sys8features11gen_console7console5log_217h7a39bbb31d04491bE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features11gen_console7console5log_317hc00038e5f47bb957E: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features11gen_console7console5log_417hffd3f93c549ff011E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features11gen_console7console5log_517h181cd86f2f287ed4E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN7web_sys8features11gen_console7console5log_617h132527abf99e1bdbE: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features11gen_console7console5log_717hbff5ceab6d7dd384E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN7web_sys8features11gen_console7console7profile17h6320f65ac933b9dcE: (a: number) => void;
  readonly _ZN7web_sys8features11gen_console7console9profile_017hd5e33ce57046db54E: () => void;
  readonly _ZN7web_sys8features11gen_console7console9profile_117h5c3ac04b0869ff10E: (a: number) => void;
  readonly _ZN7web_sys8features11gen_console7console9profile_217h91fa00b21964f8f6E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features11gen_console7console9profile_317hba47f0e6275fbd6aE: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features11gen_console7console9profile_417h22a8f23729e05c98E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features11gen_console7console9profile_517h69347fefd0f1c060E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN7web_sys8features11gen_console7console9profile_617h9b3a57e7a7ad0a84E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features11gen_console7console9profile_717h666c69e13b4a35a4E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN7web_sys8features11gen_console7console11profile_end17h221015aaaecd2640E: (a: number) => void;
  readonly _ZN7web_sys8features11gen_console7console13profile_end_017h150b6502a6a926caE: () => void;
  readonly _ZN7web_sys8features11gen_console7console13profile_end_117h9d66526f0c100ca2E: (a: number) => void;
  readonly _ZN7web_sys8features11gen_console7console13profile_end_217h94a2a28c2f7e84aeE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features11gen_console7console13profile_end_317h49b119a5c0455667E: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features11gen_console7console13profile_end_417h67ecd5038b5de7d6E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features11gen_console7console13profile_end_517hfae1d97bd7cf549fE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN7web_sys8features11gen_console7console13profile_end_617h9b422db17cd88c41E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features11gen_console7console13profile_end_717h04669c11bdb24428E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN7web_sys8features11gen_console7console5table17hd46471b0cff784baE: (a: number) => void;
  readonly _ZN7web_sys8features11gen_console7console7table_017h39a0d8d6d474ee56E: () => void;
  readonly _ZN7web_sys8features11gen_console7console7table_117h4cf9195ab6c46deaE: (a: number) => void;
  readonly _ZN7web_sys8features11gen_console7console7table_217h9ddb6d9246231fb8E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features11gen_console7console7table_317h42fc150aae3c858aE: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features11gen_console7console7table_417h55586edc2448cecdE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features11gen_console7console7table_517h188d32d48668891eE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN7web_sys8features11gen_console7console7table_617h17423abef2602471E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features11gen_console7console7table_717h9c4353e7641f292bE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN7web_sys8features11gen_console7console4time17h719e2c9f582ae333E: () => void;
  readonly _ZN7web_sys8features11gen_console7console15time_with_label17hddc90819ef08a3e1E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features11gen_console7console8time_end17had52673d327015deE: () => void;
  readonly _ZN7web_sys8features11gen_console7console19time_end_with_label17h2e70a30c6e0ccb5eE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features11gen_console7console8time_log17hc9d5b376d1abe4f4E: () => void;
  readonly _ZN7web_sys8features11gen_console7console28time_log_with_label_and_data17h0e203bc6515b6599E: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features11gen_console7console30time_log_with_label_and_data_017h7b191aad002d74caE: (a: number, b: number) => void;
  readonly _ZN7web_sys8features11gen_console7console30time_log_with_label_and_data_117h1ff207a3b3dc50e5E: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features11gen_console7console30time_log_with_label_and_data_217h0f9c21eb0a45feceE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features11gen_console7console30time_log_with_label_and_data_317hf29663cbda05f757E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN7web_sys8features11gen_console7console30time_log_with_label_and_data_417h82bf32d9fc125af7E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features11gen_console7console30time_log_with_label_and_data_517h497d5b8b7919fd32E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN7web_sys8features11gen_console7console30time_log_with_label_and_data_617h42d4f4c5e98aea7bE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
  readonly _ZN7web_sys8features11gen_console7console30time_log_with_label_and_data_717he8b08eb18d284a05E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => void;
  readonly _ZN7web_sys8features11gen_console7console10time_stamp17h8d9f581c4f228bbaE: () => void;
  readonly _ZN7web_sys8features11gen_console7console20time_stamp_with_data17h9d5c55f50e3876ffE: (a: number) => void;
  readonly _ZN7web_sys8features11gen_console7console5trace17hcf170168cb986950E: (a: number) => void;
  readonly _ZN7web_sys8features11gen_console7console7trace_017hed675db0973b02a3E: () => void;
  readonly _ZN7web_sys8features11gen_console7console7trace_117h9ce3e5d0a5df767cE: (a: number) => void;
  readonly _ZN7web_sys8features11gen_console7console7trace_217hd097abf57d0f9e50E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features11gen_console7console7trace_317h4e5be363a3ea7fabE: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features11gen_console7console7trace_417h56db6b6254360c1cE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features11gen_console7console7trace_517ha0a594fd1e29c657E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN7web_sys8features11gen_console7console7trace_617hedc5ee77c86c9974E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features11gen_console7console7trace_717h48d1f7f38cf119bfE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN7web_sys8features11gen_console7console4warn17hfe10b1b77a93939dE: (a: number) => void;
  readonly _ZN7web_sys8features11gen_console7console6warn_017h849787f54cf262f3E: () => void;
  readonly _ZN7web_sys8features11gen_console7console6warn_217h778dad197b35b3a2E: (a: number, b: number) => void;
  readonly _ZN7web_sys8features11gen_console7console6warn_317hbe294111e68d3490E: (a: number, b: number, c: number) => void;
  readonly _ZN7web_sys8features11gen_console7console6warn_417ha9048092c088847aE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN7web_sys8features11gen_console7console6warn_517hdc6a9072c73bfed2E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN7web_sys8features11gen_console7console6warn_617hfe76562bc1967451E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN7web_sys8features11gen_console7console6warn_717hce7b83f11633494aE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN6js_sys5Array4iter17h090ca6805c7544c1E: (a: number, b: number) => void;
  readonly _ZN6js_sys5Array6to_vec17hfe28459a9beed9beE: (a: number, b: number) => void;
  readonly _ZN6js_sys6BigInt11checked_div17hb3d3917f3dc9ef91E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys6BigInt3abs17h398a8c00b0657c19E: (a: number, b: number) => void;
  readonly _ZN6js_sys8Function8try_from17hfe25452aaa021040E: (a: number) => number;
  readonly _ZN6js_sys8Iterator19looks_like_iterator17h06a8c8fac69bf1deE: (a: number) => number;
  readonly _ZN6js_sys8try_iter17h0a9b61d49f45ed95E: (a: number, b: number) => void;
  readonly _ZN6js_sys6Object8try_from17hcae72659f9e818abE: (a: number) => number;
  readonly _ZN6js_sys8JsString8try_from17h4931b83587f56bb2E: (a: number) => number;
  readonly _ZN6js_sys8JsString14is_valid_utf1617h9516436bc9b62ea6E: (a: number) => number;
  readonly _ZN6js_sys8JsString4iter17h5ed85a4bf3db0786E: (a: number, b: number) => void;
  readonly _ZN6js_sys8JsString7as_char17h907fdafe4fda9ab0E: (a: number) => number;
  readonly _ZN6js_sys10decode_uri17he9f6c321981964e0E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys20decode_uri_component17hbfd87a54c832f84eE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys10encode_uri17hfb3841379f377483E: (a: number, b: number) => number;
  readonly _ZN6js_sys20encode_uri_component17h60813d87b42772cbE: (a: number, b: number) => number;
  readonly _ZN6js_sys4eval17h6878cca1b33fbe66E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys9is_finite17h2501e03de687aa18E: (a: number) => number;
  readonly _ZN6js_sys9parse_int17h3bef73ade1164a12E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys11parse_float17h6dc312d581be4d14E: (a: number, b: number) => number;
  readonly _ZN6js_sys6escape17had45e7c451f31910E: (a: number, b: number) => number;
  readonly _ZN6js_sys8unescape17h2f7c697949671e5eE: (a: number, b: number) => number;
  readonly _ZN6js_sys5Array15new_with_length17he21e44595540c965E: (a: number) => number;
  readonly _ZN6js_sys5Array2at17hffd7afe4c2f6b611E: (a: number, b: number) => number;
  readonly _ZN6js_sys5Array3set17hbb2322c5e79a6a7aE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys5Array6delete17ha276560d86c9423cE: (a: number, b: number) => void;
  readonly _ZN6js_sys5Array11copy_within17h37366a397dc77714E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys5Array6concat17h1a8135654e26f246E: (a: number, b: number) => number;
  readonly _ZN6js_sys5Array5every17h45c6f788dce5cec2E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys5Array4fill17hc9167ee63a59a1fcE: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys5Array6filter17hece1899f266e69a3E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys5Array4find17hfce3e7ac8efc3a1eE: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys5Array10find_index17h9eef7105d6ba164dE: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys5Array9find_last17h2e7e30c4f3b7e9aeE: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys5Array15find_last_index17h1cdb295126a85e53E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys5Array4flat17h9e046baec8d6d175E: (a: number, b: number) => number;
  readonly _ZN6js_sys5Array8flat_map17hfcfe1057204d2764E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys5Array8for_each17hef0d89af3f869c5cE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys5Array8includes17hf54fbe56bcde0385E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys5Array8index_of17h994381bf22ebd623E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys5Array8is_array17h1d5b12a41f7d7026E: (a: number) => number;
  readonly _ZN6js_sys5Array4join17h1c8497bf859ceb5aE: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys5Array13last_index_of17h00d10d911029bb56E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys5Array6length17h97e9d25f624ce84aE: (a: number) => number;
  readonly _ZN6js_sys5Array10set_length17h3bcf4a2cadba93ebE: (a: number, b: number) => void;
  readonly _ZN6js_sys5Array3map17h40d01978b8096bc6E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys5Array3of117h5edbdd3c704386d6E: (a: number) => number;
  readonly _ZN6js_sys5Array3of217h497ecf2b09fc6ecfE: (a: number, b: number) => number;
  readonly _ZN6js_sys5Array3of417h9a0455b9691f4a34E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys5Array3of517h478f82c962845fbfE: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly _ZN6js_sys5Array3pop17he48e6201de4b7843E: (a: number) => number;
  readonly _ZN6js_sys5Array4push17h978a2ba976275da5E: (a: number, b: number) => number;
  readonly _ZN6js_sys5Array6reduce17h484f0020d25c7f1aE: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys5Array12reduce_right17hb501cebc6790650bE: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys5Array7reverse17h0183b93a51b490bdE: (a: number) => number;
  readonly _ZN6js_sys5Array5shift17hee278f9fed8d0a82E: (a: number) => number;
  readonly _ZN6js_sys5Array5slice17h8667901f74373a0fE: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys5Array4some17hbdc35710ebb74ba6E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys5Array4sort17h5e27472e5ef23497E: (a: number) => number;
  readonly _ZN6js_sys5Array6splice17hacf18561e860dcdbE: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys5Array16to_locale_string17h838c378d78cf32a0E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys5Array9to_string17h58bf8c4572e9016cE: (a: number) => number;
  readonly _ZN6js_sys5Array7unshift17h178862079a2479e8E: (a: number, b: number) => number;
  readonly _ZN6js_sys11ArrayBuffer3new17hebc03bf6f3d5d17bE: (a: number) => number;
  readonly _ZN6js_sys11ArrayBuffer11byte_length17hffaad9dca72306c7E: (a: number) => number;
  readonly _ZN6js_sys11ArrayBuffer7is_view17h0647d592e847fe15E: (a: number) => number;
  readonly _ZN6js_sys11ArrayBuffer5slice17h1d370ccc49e874ffE: (a: number, b: number) => number;
  readonly _ZN6js_sys11ArrayBuffer14slice_with_end17hb8ea289175425a41E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys17SharedArrayBuffer11byte_length17ha62f985e318a4091E: (a: number) => number;
  readonly _ZN6js_sys17SharedArrayBuffer5slice17h06f52d1cc4146b57E: (a: number, b: number) => number;
  readonly _ZN6js_sys17SharedArrayBuffer14slice_with_end17h463efc817fbeecb4E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys5Array4keys17h0b27f37881464856E: (a: number) => number;
  readonly _ZN6js_sys5Array7entries17h8f87cf59a2d2716aE: (a: number) => number;
  readonly _ZN6js_sys5Array6values17heb49d7f236caa37fE: (a: number) => number;
  readonly _ZN6js_sys7Atomics3add17h9a952f6d54c332aeE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys7Atomics10add_bigint17hb7d34b21c808a829E: (a: number, b: number, c: number, d: bigint) => void;
  readonly _ZN6js_sys7Atomics3and17h5ee51928b7680e99E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys7Atomics10and_bigint17h4bac5f15fd458354E: (a: number, b: number, c: number, d: bigint) => void;
  readonly _ZN6js_sys7Atomics16compare_exchange17h3280bd6396d20234E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN6js_sys7Atomics23compare_exchange_bigint17h77dfa034c75c3a96E: (a: number, b: number, c: number, d: bigint, e: bigint) => void;
  readonly _ZN6js_sys7Atomics8exchange17hafda986d4a5f7c0eE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys7Atomics15exchange_bigint17hfce2f525dff94179E: (a: number, b: number, c: number, d: bigint) => void;
  readonly _ZN6js_sys7Atomics12is_lock_free17hfcf5e165eafea76aE: (a: number) => number;
  readonly _ZN6js_sys7Atomics4load17h5ca8bb4db56ab3ecE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys7Atomics11load_bigint17h4f67c1f24c6d8f2fE: (a: number, b: number, c: bigint) => void;
  readonly _ZN6js_sys7Atomics6notify17h654c82551b506af7E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys7Atomics17notify_with_count17h4dec6f28005a5afbE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys7Atomics2or17h38db4deb6e86a5fbE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys7Atomics9or_bigint17hbf3defecc63ade19E: (a: number, b: number, c: number, d: bigint) => void;
  readonly _ZN6js_sys7Atomics5store17h7a13f0de691166daE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys7Atomics12store_bigint17h32b49461d51f18efE: (a: number, b: number, c: number, d: bigint) => void;
  readonly _ZN6js_sys7Atomics3sub17he8e0b1a7be85fcbcE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys7Atomics10sub_bigint17h9125a01342abd091E: (a: number, b: number, c: number, d: bigint) => void;
  readonly _ZN6js_sys7Atomics4wait17h71e2b4ac86847f39E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys7Atomics11wait_bigint17h9545adbdafa4ffd4E: (a: number, b: number, c: number, d: bigint) => void;
  readonly _ZN6js_sys7Atomics17wait_with_timeout17hdc4d6053d0b03f92E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN6js_sys7Atomics24wait_with_timeout_bigint17h5e7281a3c4fc9862E: (a: number, b: number, c: number, d: bigint, e: number) => void;
  readonly _ZN6js_sys7Atomics10wait_async17h917dcea13a70339dE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys7Atomics17wait_async_bigint17h44e29f086d42b821E: (a: number, b: number, c: number, d: bigint) => void;
  readonly _ZN6js_sys7Atomics23wait_async_with_timeout17haabe32bbea205555E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN6js_sys7Atomics30wait_async_with_timeout_bigint17h01735ebf95814bd7E: (a: number, b: number, c: number, d: bigint, e: number) => void;
  readonly _ZN6js_sys7Atomics3xor17hb7e600c2058705e4E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys7Atomics10xor_bigint17he9a896d80ad1fb00E: (a: number, b: number, c: number, d: bigint) => void;
  readonly _ZN6js_sys10new_bigint17h40677a79cd01843dE: (a: number, b: number) => void;
  readonly _ZN6js_sys20new_bigint_unchecked17h7f9246e2dae685b2E: (a: number) => number;
  readonly _ZN6js_sys6BigInt8as_int_n17h670670c63b63b74eE: (a: number, b: number) => number;
  readonly _ZN6js_sys6BigInt9as_uint_n17hefaa26d73ba09570E: (a: number, b: number) => number;
  readonly _ZN6js_sys6BigInt16to_locale_string17hc437d9dadcc02abaE: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys6BigInt9to_string17h6bee5a4fe015d599E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys6BigInt19to_string_unchecked17h0dafd53d7a84e3e3E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys6BigInt8value_of17h959f92ff34bb182aE: (a: number, b: number) => number;
  readonly _ZN6js_sys7Boolean3new17hfc2675f80cb113beE: (a: number) => number;
  readonly _ZN6js_sys7Boolean8value_of17hb946ae87929b42c4E: (a: number) => number;
  readonly _ZN6js_sys8DataView3new17hc71bc03f0b5e4336E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys8DataView28new_with_shared_array_buffer17hfe0080fa0784c237E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys8DataView6buffer17hf5c0a7407489b4d9E: (a: number) => number;
  readonly _ZN6js_sys8DataView11byte_length17haeb9f29357711865E: (a: number) => number;
  readonly _ZN6js_sys8DataView11byte_offset17h9419181693b971f6E: (a: number) => number;
  readonly _ZN6js_sys8DataView8get_int817hef038ce6d1c268daE: (a: number, b: number) => number;
  readonly _ZN6js_sys8DataView9get_uint817h678ea9dfae612a5fE: (a: number, b: number) => number;
  readonly _ZN6js_sys8DataView9get_int1617h5d0a2ff4f486a583E: (a: number, b: number) => number;
  readonly _ZN6js_sys8DataView16get_int16_endian17h0bd7d31c25792fc9E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys8DataView10get_uint1617hbc5c02f8d647eec1E: (a: number, b: number) => number;
  readonly _ZN6js_sys8DataView17get_uint16_endian17h297aa5d123090034E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys8DataView9get_int3217h5acd2fb030e3f209E: (a: number, b: number) => number;
  readonly _ZN6js_sys8DataView16get_int32_endian17hd7ae19dc9d8562faE: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys8DataView10get_uint3217h531f7bac2474f9d5E: (a: number, b: number) => number;
  readonly _ZN6js_sys8DataView17get_uint32_endian17hb44cc30a8ca8624dE: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys8DataView11get_float3217hbb5d4917d6f53ce1E: (a: number, b: number) => number;
  readonly _ZN6js_sys8DataView18get_float32_endian17h7b57582880aeff12E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys8DataView11get_float6417h204b49d73114c849E: (a: number, b: number) => number;
  readonly _ZN6js_sys8DataView18get_float64_endian17h86b495dc5690d4c9E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys8DataView8set_int817h241c82ef6b09cba9E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys8DataView9set_uint817he7e0831af496de43E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys8DataView9set_int1617h3e81fc590e8d90b0E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys8DataView16set_int16_endian17hb89348c7aa4192fbE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys8DataView10set_uint1617hfc5cebdb36499860E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys8DataView17set_uint16_endian17h5ec6994df5383936E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys8DataView9set_int3217hecd0f03fd885dce4E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys8DataView16set_int32_endian17heb36fecbb5bbb738E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys8DataView10set_uint3217h4be20ce5af500239E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys8DataView17set_uint32_endian17h2abfa3c4b6c1656cE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys8DataView11set_float3217h85b02d4f1bb824bbE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys8DataView18set_float32_endian17h9bd2ae333257d279E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys8DataView11set_float6417haa056ba85d5463e7E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys8DataView18set_float64_endian17hbce535b0fc96ed4bE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys5Error3new17hffb86d77ff238cdeE: (a: number, b: number) => number;
  readonly _ZN6js_sys5Error16new_with_options17h62a7bb3ebc753fd0E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys5Error5cause17h6f7d41e9703ff592E: (a: number) => number;
  readonly _ZN6js_sys5Error9set_cause17hf1044f4a0ebf63fbE: (a: number, b: number) => void;
  readonly _ZN6js_sys5Error7message17h0d9beea52c89817fE: (a: number) => number;
  readonly _ZN6js_sys5Error11set_message17he6d63e739c04f84cE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys5Error4name17hf61ccf57acc0fd6dE: (a: number) => number;
  readonly _ZN6js_sys5Error8set_name17h8aef60332708f0b9E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys5Error9to_string17h8f8358c65378741dE: (a: number) => number;
  readonly _ZN6js_sys9EvalError3new17h443c550ab9174bd2E: (a: number, b: number) => number;
  readonly _ZN6js_sys8Function13new_with_args17h1be4195b7065db39E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys8Function11new_no_args17h30106782280dab89E: (a: number, b: number) => number;
  readonly _ZN6js_sys8Function5apply17h592f75203771995fE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys8Function5call217h0a75591a25e9ee36E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN6js_sys8Function5call317h0f62120def11bfc7E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN6js_sys8Function4bind17hbba4f1422ba2282eE: (a: number, b: number) => number;
  readonly _ZN6js_sys8Function5bind017h735d315d388e58ffE: (a: number, b: number) => number;
  readonly _ZN6js_sys8Function5bind117haeab2161fb17c16cE: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys8Function5bind217hd310d94e804e901aE: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys8Function5bind317h46ae9c74d4418d52E: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly _ZN6js_sys8Function6length17hef01f2ddd3bdb3ceE: (a: number) => number;
  readonly _ZN6js_sys8Function4name17hed642e0fab1d3173E: (a: number) => number;
  readonly _ZN6js_sys8Function9to_string17h5dddc9418ee39105E: (a: number) => number;
  readonly _ZN6js_sys9Generator4next17h1a62235adbe0ded6E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys9Generator7return_17hc216f35e2f73e320E: (a: number, b: number) => number;
  readonly _ZN6js_sys9Generator5throw17h01194ff702849da1E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys3Map5clear17hb498f506eb1fc05aE: (a: number) => void;
  readonly _ZN6js_sys3Map6delete17h2fc2250789dab18bE: (a: number, b: number) => number;
  readonly _ZN6js_sys3Map8for_each17hd4a500ce05c9b97aE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys3Map3get17hed70ca2a623adfbcE: (a: number, b: number) => number;
  readonly _ZN6js_sys3Map3has17h3f61390e23ac8317E: (a: number, b: number) => number;
  readonly _ZN6js_sys3Map3set17h13fbb4d94cd6f7baE: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys3Map4size17h7a6ee32f1a5beeb7E: (a: number) => number;
  readonly _ZN6js_sys3Map7entries17h9c7afad5f4ee2d9cE: (a: number) => number;
  readonly _ZN6js_sys3Map4keys17h4b738790ea0b6cbaE: (a: number) => number;
  readonly _ZN6js_sys3Map6values17h091c95a2c3e526daE: (a: number) => number;
  readonly _ZN6js_sys8Iterator4next17h55d62b8d3e8aa68cE: (a: number, b: number) => void;
  readonly _ZN6js_sys13AsyncIterator4next17h954848e13f782196E: (a: number, b: number) => void;
  readonly _ZN6js_sys12IteratorNext4done17h780fce3ecde56cf1E: (a: number) => number;
  readonly _ZN6js_sys12IteratorNext5value17h9f52e68967b21202E: (a: number) => number;
  readonly _ZN6js_sys4Math3abs17he4293e0da8e23b55E: (a: number) => number;
  readonly _ZN6js_sys4Math4acos17h8c466b988b376a35E: (a: number) => number;
  readonly _ZN6js_sys4Math5acosh17ha9d4350cb3d30495E: (a: number) => number;
  readonly _ZN6js_sys4Math4asin17h6b246b54c404def0E: (a: number) => number;
  readonly _ZN6js_sys4Math5asinh17h17d77842bb3536a3E: (a: number) => number;
  readonly _ZN6js_sys4Math4atan17h66b05d0c7746a7c3E: (a: number) => number;
  readonly _ZN6js_sys4Math5atan217ha2e8e9edffa9dfddE: (a: number, b: number) => number;
  readonly _ZN6js_sys4Math5atanh17hca4384adfc02d8c0E: (a: number) => number;
  readonly _ZN6js_sys4Math4cbrt17h6c13befeed67e37dE: (a: number) => number;
  readonly _ZN6js_sys4Math4ceil17hee2331803fa57d04E: (a: number) => number;
  readonly _ZN6js_sys4Math5clz3217h82c1a7317fd9f935E: (a: number) => number;
  readonly _ZN6js_sys4Math3cos17h9c2e78972e94a7f6E: (a: number) => number;
  readonly _ZN6js_sys4Math4cosh17hc58a99088e8aa215E: (a: number) => number;
  readonly _ZN6js_sys4Math3exp17h08fcda8d3e7b4584E: (a: number) => number;
  readonly _ZN6js_sys4Math5expm117h6279716e914dc64fE: (a: number) => number;
  readonly _ZN6js_sys4Math5floor17he127082ecaf9320aE: (a: number) => number;
  readonly _ZN6js_sys4Math6fround17h000266443e27d61cE: (a: number) => number;
  readonly _ZN6js_sys4Math5hypot17hfe376caaa2441a97E: (a: number, b: number) => number;
  readonly _ZN6js_sys4Math4imul17h8bb07c2bf5ec6a64E: (a: number, b: number) => number;
  readonly _ZN6js_sys4Math3log17he5ebe6a2e0973c50E: (a: number) => number;
  readonly _ZN6js_sys4Math5log1017h31d73aea00699656E: (a: number) => number;
  readonly _ZN6js_sys4Math5log1p17h78e32c0a2ce0247dE: (a: number) => number;
  readonly _ZN6js_sys4Math4log217h85b979c1826e231bE: (a: number) => number;
  readonly _ZN6js_sys4Math3max17hdfc57fc07dc4248dE: (a: number, b: number) => number;
  readonly _ZN6js_sys4Math3min17hb56c933c40abcd38E: (a: number, b: number) => number;
  readonly _ZN6js_sys4Math3pow17ha31d018725738b49E: (a: number, b: number) => number;
  readonly _ZN6js_sys4Math6random17h304180a4d867e972E: () => number;
  readonly _ZN6js_sys4Math5round17h6ccb417696032e84E: (a: number) => number;
  readonly _ZN6js_sys4Math4sign17h2a7279de2ff46d44E: (a: number) => number;
  readonly _ZN6js_sys4Math3sin17h8d9f0dea2fa55a44E: (a: number) => number;
  readonly _ZN6js_sys4Math4sinh17h79187ba14ae166daE: (a: number) => number;
  readonly _ZN6js_sys4Math4sqrt17h28ae4ffd29fa18d1E: (a: number) => number;
  readonly _ZN6js_sys4Math3tan17h8e6121f8aa2aba9eE: (a: number) => number;
  readonly _ZN6js_sys4Math4tanh17h02e480a3a63ad4e9E: (a: number) => number;
  readonly _ZN6js_sys4Math5trunc17h29832d75131fea41E: (a: number) => number;
  readonly _ZN6js_sys6Number9is_finite17h9901426fd31ffce0E: (a: number) => number;
  readonly _ZN6js_sys6Number10is_integer17h1c06a59f5c22e8afE: (a: number) => number;
  readonly _ZN6js_sys6Number6is_nan17h74be088f8baa82bdE: (a: number) => number;
  readonly _ZN6js_sys6Number3new17h086341f649fce1e1E: (a: number) => number;
  readonly _ZN6js_sys6Number12new_from_str17hf79feb11090f9da8E: (a: number, b: number) => number;
  readonly _ZN6js_sys6Number9parse_int17hd8de4e79cf12db4dE: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys6Number11parse_float17h030728b0af82e6dbE: (a: number, b: number) => number;
  readonly _ZN6js_sys6Number16to_locale_string17h21cddc83331eb07fE: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys6Number12to_precision17h08919b7a7031ea4cE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys6Number8to_fixed17h7ac222e0e88623c7E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys6Number14to_exponential17h323c315b1d42d0c2E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys6Number9to_string17h9514215d54bcf920E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys6Number8value_of17heaf8f62d1b8357eeE: (a: number) => number;
  readonly _ZN6js_sys4Date8get_date17h3dde4d6f1dcb3198E: (a: number) => number;
  readonly _ZN6js_sys4Date7get_day17h7b1bea4a11086ef7E: (a: number) => number;
  readonly _ZN6js_sys4Date13get_full_year17h66a4726b283eec79E: (a: number) => number;
  readonly _ZN6js_sys4Date9get_hours17h5b2d900305fd9f9bE: (a: number) => number;
  readonly _ZN6js_sys4Date16get_milliseconds17hbaf49ffd7d3e218bE: (a: number) => number;
  readonly _ZN6js_sys4Date11get_minutes17h0744e5982fccc9b4E: (a: number) => number;
  readonly _ZN6js_sys4Date9get_month17h7e7b8b5c0cb41970E: (a: number) => number;
  readonly _ZN6js_sys4Date11get_seconds17h0fce81771afe142bE: (a: number) => number;
  readonly _ZN6js_sys4Date12get_utc_date17hc3e6c5648f301febE: (a: number) => number;
  readonly _ZN6js_sys4Date11get_utc_day17hf41462d8a97c3bbfE: (a: number) => number;
  readonly _ZN6js_sys4Date17get_utc_full_year17h75a062693c338ba2E: (a: number) => number;
  readonly _ZN6js_sys4Date13get_utc_hours17h09554739520610d0E: (a: number) => number;
  readonly _ZN6js_sys4Date20get_utc_milliseconds17h30d598b8c4f4b99cE: (a: number) => number;
  readonly _ZN6js_sys4Date15get_utc_minutes17haf0e0cf8ef5f8063E: (a: number) => number;
  readonly _ZN6js_sys4Date13get_utc_month17haeb90d19d26910c8E: (a: number) => number;
  readonly _ZN6js_sys4Date15get_utc_seconds17h3eaec35e44efddceE: (a: number) => number;
  readonly _ZN6js_sys4Date19new_with_year_month17h38bdf46babb4829eE: (a: number, b: number) => number;
  readonly _ZN6js_sys4Date23new_with_year_month_day17hea9c422ca90105b5E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys4Date26new_with_year_month_day_hr17hd9c7e8251bd5b345E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys4Date30new_with_year_month_day_hr_min17h00bd76843ddd840aE: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly _ZN6js_sys4Date40new_with_year_month_day_hr_min_sec_milli17h888c968549a66cb9E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
  readonly _ZN6js_sys4Date5parse17h49e30f79363ba33fE: (a: number, b: number) => number;
  readonly _ZN6js_sys4Date8set_date17he4bc2967ebdf6b7cE: (a: number, b: number) => number;
  readonly _ZN6js_sys4Date13set_full_year17h4577224f90abcedfE: (a: number, b: number) => number;
  readonly _ZN6js_sys4Date24set_full_year_with_month17hc33649944a8c3ac9E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys4Date29set_full_year_with_month_date17hd9d46d224baf28c8E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys4Date9set_hours17h8e49e6d3bbd9ac3eE: (a: number, b: number) => number;
  readonly _ZN6js_sys4Date16set_milliseconds17h3e09460460aa04c6E: (a: number, b: number) => number;
  readonly _ZN6js_sys4Date11set_minutes17hc46f776cdc9e095dE: (a: number, b: number) => number;
  readonly _ZN6js_sys4Date9set_month17h3865fe4ac4a2c12eE: (a: number, b: number) => number;
  readonly _ZN6js_sys4Date11set_seconds17h71baf1125e6db69aE: (a: number, b: number) => number;
  readonly _ZN6js_sys4Date8set_time17hac58ccaff489df60E: (a: number, b: number) => number;
  readonly _ZN6js_sys4Date12set_utc_date17hb1a8c4da3c9bfca5E: (a: number, b: number) => number;
  readonly _ZN6js_sys4Date17set_utc_full_year17hf41a8657f78403dcE: (a: number, b: number) => number;
  readonly _ZN6js_sys4Date28set_utc_full_year_with_month17h71a6034cf7c96e5fE: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys4Date33set_utc_full_year_with_month_date17h86946c07bcbc82acE: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys4Date13set_utc_hours17hc5a1fa34abecd656E: (a: number, b: number) => number;
  readonly _ZN6js_sys4Date20set_utc_milliseconds17h09a45b6608ad3cffE: (a: number, b: number) => number;
  readonly _ZN6js_sys4Date15set_utc_minutes17h542c2c48fb31af6bE: (a: number, b: number) => number;
  readonly _ZN6js_sys4Date13set_utc_month17h934bb11f35ada046E: (a: number, b: number) => number;
  readonly _ZN6js_sys4Date15set_utc_seconds17h72ddcef928ce77d7E: (a: number, b: number) => number;
  readonly _ZN6js_sys4Date14to_date_string17h3d858818609e6772E: (a: number) => number;
  readonly _ZN6js_sys4Date13to_iso_string17h8c81dd6c41dc1b60E: (a: number) => number;
  readonly _ZN6js_sys4Date7to_json17h89d092135152b3a8E: (a: number) => number;
  readonly _ZN6js_sys4Date21to_locale_date_string17ha2ec2baa22cb1602E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys4Date16to_locale_string17h1f515fcefd2429caE: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys4Date21to_locale_time_string17h6bc75bbeeb35bffdE: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys4Date34to_locale_time_string_with_options17h6f65cab1a0e71022E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys4Date9to_string17hfeacf13503bdc20fE: (a: number) => number;
  readonly _ZN6js_sys4Date14to_time_string17h26903e5c898037beE: (a: number) => number;
  readonly _ZN6js_sys4Date13to_utc_string17h9101d5ded806d512E: (a: number) => number;
  readonly _ZN6js_sys4Date3utc17h22e3b7ede499ec70E: (a: number, b: number) => number;
  readonly _ZN6js_sys4Date8value_of17hffca6c3b881a5a61E: (a: number) => number;
  readonly _ZN6js_sys6Object6assign17he10036b3b7d14784E: (a: number, b: number) => number;
  readonly _ZN6js_sys6Object7assign217h6620693e046a4dbcE: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys6Object7assign317hf90e5ada6fa6a405E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys6Object11constructor17h814f4d78799b9e83E: (a: number) => number;
  readonly _ZN6js_sys6Object6create17ha79397b303136c42E: (a: number) => number;
  readonly _ZN6js_sys6Object15define_property17h752e345879c11d27E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys6Object17define_properties17h4beb72090ad139baE: (a: number, b: number) => number;
  readonly _ZN6js_sys6Object6freeze17he948b51c88377544E: (a: number) => number;
  readonly _ZN6js_sys6Object12from_entries17hc866f9ca2402cfbbE: (a: number, b: number) => void;
  readonly _ZN6js_sys6Object27get_own_property_descriptor17h03a98848d96e1d33E: (a: number, b: number) => number;
  readonly _ZN6js_sys6Object28get_own_property_descriptors17h9235ee69fbe3bdddE: (a: number) => number;
  readonly _ZN6js_sys6Object22get_own_property_names17he5e4fe913f5c9365E: (a: number) => number;
  readonly _ZN6js_sys6Object24get_own_property_symbols17h4b67d15ad48f5f67E: (a: number) => number;
  readonly _ZN6js_sys6Object16get_prototype_of17h46be3d51f18ab533E: (a: number) => number;
  readonly _ZN6js_sys6Object16has_own_property17hd4b7f00addc1e260E: (a: number, b: number) => number;
  readonly _ZN6js_sys6Object7has_own17h3109778ed31644e9E: (a: number, b: number) => number;
  readonly _ZN6js_sys6Object2is17hc3d1548c8a3a8900E: (a: number, b: number) => number;
  readonly _ZN6js_sys6Object13is_extensible17hde1efd8d35bf3c0aE: (a: number) => number;
  readonly _ZN6js_sys6Object9is_frozen17he04f6284e248fe7eE: (a: number) => number;
  readonly _ZN6js_sys6Object9is_sealed17ha2f15c4f3a53ac1fE: (a: number) => number;
  readonly _ZN6js_sys6Object15is_prototype_of17h903db3de781d6a42E: (a: number, b: number) => number;
  readonly _ZN6js_sys6Object4keys17h001f974538ac6905E: (a: number) => number;
  readonly _ZN6js_sys6Object18prevent_extensions17h5274f556ccae46b5E: (a: number) => void;
  readonly _ZN6js_sys6Object22property_is_enumerable17h9319acb4752fa30aE: (a: number, b: number) => number;
  readonly _ZN6js_sys6Object4seal17hdd15b85a0aadd046E: (a: number) => number;
  readonly _ZN6js_sys6Object16set_prototype_of17h1419378a72a95e12E: (a: number, b: number) => number;
  readonly _ZN6js_sys6Object16to_locale_string17hb0f84f837fb98fefE: (a: number) => number;
  readonly _ZN6js_sys6Object9to_string17h02b05c0c373f5decE: (a: number) => number;
  readonly _ZN6js_sys6Object8value_of17h14bcee026aabd900E: (a: number) => number;
  readonly _ZN6js_sys6Object6values17ha76ee30ec8930c43E: (a: number) => number;
  readonly _ZN6js_sys5Proxy3new17h8c2f632eaca617e5E: (a: number, b: number) => number;
  readonly _ZN6js_sys5Proxy9revocable17h15012d899d2648e0E: (a: number, b: number) => number;
  readonly _ZN6js_sys10RangeError3new17h95862c0d2137041cE: (a: number, b: number) => number;
  readonly _ZN6js_sys14ReferenceError3new17hd1775036b775d419E: (a: number, b: number) => number;
  readonly _ZN6js_sys7Reflect5apply17h6f8666e0a5a72be4E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys7Reflect9construct17h002afe28a47dbcd9E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys7Reflect25construct_with_new_target17h701e1f075e815a21E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys7Reflect15define_property17h1f5d6271734eef0eE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys7Reflect15delete_property17hbb327bd34e6f42edE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys7Reflect7get_f6417h181fced2f6739bd8E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys7Reflect7get_u3217h30a6990ba73e52feE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys7Reflect27get_own_property_descriptor17hb27b56a6a7e19965E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys7Reflect16get_prototype_of17h92928ce78ae169aaE: (a: number, b: number) => void;
  readonly _ZN6js_sys7Reflect3has17h17228c77b0015cc0E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys7Reflect13is_extensible17hd7a65f492cb4f9e2E: (a: number, b: number) => void;
  readonly _ZN6js_sys7Reflect8own_keys17h335dc5b29723f9c7E: (a: number, b: number) => void;
  readonly _ZN6js_sys7Reflect18prevent_extensions17h281f1a5795cffc64E: (a: number, b: number) => void;
  readonly _ZN6js_sys7Reflect3set17h3092a6302a618095E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys7Reflect7set_f6417h073e40f02b8a7761E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys7Reflect7set_u3217hc04b086d68403396E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys7Reflect17set_with_receiver17h6b8cbd9a6fe0aa39E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN6js_sys7Reflect16set_prototype_of17hd5c7872c9a16b2ceE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys6RegExp4exec17ha0ea2c1dca01ac1eE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys6RegExp5flags17h77e975baa469c756E: (a: number) => number;
  readonly _ZN6js_sys6RegExp6global17hbe7a393f9e5c1951E: (a: number) => number;
  readonly _ZN6js_sys6RegExp11ignore_case17he15db5e614abf177E: (a: number) => number;
  readonly _ZN6js_sys6RegExp5input17h5f35714e05856cb5E: () => number;
  readonly _ZN6js_sys6RegExp10last_index17h7e6ee159fd30738cE: (a: number) => number;
  readonly _ZN6js_sys6RegExp14set_last_index17h1ac387a74482cc2fE: (a: number, b: number) => void;
  readonly _ZN6js_sys6RegExp10last_match17hef91e7e69b347741E: () => number;
  readonly _ZN6js_sys6RegExp10last_paren17ha85e0f5e2b460ec8E: () => number;
  readonly _ZN6js_sys6RegExp12left_context17h29ef49ffa942cd13E: () => number;
  readonly _ZN6js_sys6RegExp9multiline17h810c534bcca33769E: (a: number) => number;
  readonly _ZN6js_sys6RegExp2n117h0fc36adf3b080c3cE: () => number;
  readonly _ZN6js_sys6RegExp2n217hbf07fa7343fa106bE: () => number;
  readonly _ZN6js_sys6RegExp2n317hbe9f9a736c6a6f90E: () => number;
  readonly _ZN6js_sys6RegExp2n417h717b01749cb756c5E: () => number;
  readonly _ZN6js_sys6RegExp2n517h02c1200c94ff0606E: () => number;
  readonly _ZN6js_sys6RegExp2n617hd5e2b7db6715d592E: () => number;
  readonly _ZN6js_sys6RegExp2n717hbda3952d4c9bac85E: () => number;
  readonly _ZN6js_sys6RegExp2n817hda8d91867c73c958E: () => number;
  readonly _ZN6js_sys6RegExp2n917h341b4567d3e3a0c7E: () => number;
  readonly _ZN6js_sys6RegExp3new17hdd4a7b4126c9c086E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys6RegExp10new_regexp17he1efb035111e6f8aE: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys6RegExp13right_context17hfd9e76a95ef0b546E: () => number;
  readonly _ZN6js_sys6RegExp6source17hcfb24dbcb268cc35E: (a: number) => number;
  readonly _ZN6js_sys6RegExp6sticky17hbf4041dc80f59faeE: (a: number) => number;
  readonly _ZN6js_sys6RegExp4test17hd02041cc929b8740E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys6RegExp9to_string17h9bdb53c94bf31bbcE: (a: number) => number;
  readonly _ZN6js_sys6RegExp7unicode17h007199710f4052d7E: (a: number) => number;
  readonly _ZN6js_sys3Set3add17h75236c879d51abaeE: (a: number, b: number) => number;
  readonly _ZN6js_sys3Set5clear17h8a1f9b4ba10c1458E: (a: number) => void;
  readonly _ZN6js_sys3Set6delete17h4cfa801f6c02b371E: (a: number, b: number) => number;
  readonly _ZN6js_sys3Set8for_each17h829fdc45b8bbacb4E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys3Set3has17h09a1128f8e4f0f82E: (a: number, b: number) => number;
  readonly _ZN6js_sys3Set3new17h6ab01bdfd98a2806E: (a: number) => number;
  readonly _ZN6js_sys3Set4size17hf3efb4e5dd827829E: (a: number) => number;
  readonly _ZN6js_sys3Set7entries17h83f1a8ee8cf6f99cE: (a: number) => number;
  readonly _ZN6js_sys3Set4keys17h851f27afa7dbeed4E: (a: number) => number;
  readonly _ZN6js_sys3Set6values17hdf65a978184c7608E: (a: number) => number;
  readonly _ZN6js_sys11SyntaxError3new17hdc2acc00c7d2f38dE: (a: number, b: number) => number;
  readonly _ZN6js_sys9TypeError3new17h954ee6126185fa1dE: (a: number, b: number) => number;
  readonly _ZN6js_sys8UriError3new17h7488c9c6b8cd7bb4E: (a: number, b: number) => number;
  readonly _ZN6js_sys7WeakMap3new17h8e367f1c78e4a53cE: () => number;
  readonly _ZN6js_sys7WeakMap3set17hddfc0fb273bec77dE: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys7WeakMap3get17h9d28b9fec1add59aE: (a: number, b: number) => number;
  readonly _ZN6js_sys7WeakMap3has17h4b6c99bd4639e7abE: (a: number, b: number) => number;
  readonly _ZN6js_sys7WeakMap6delete17h8e2747f348100f59E: (a: number, b: number) => number;
  readonly _ZN6js_sys7WeakSet3new17hc37d227948f4702fE: () => number;
  readonly _ZN6js_sys7WeakSet3has17h981618870d82e14bE: (a: number, b: number) => number;
  readonly _ZN6js_sys7WeakSet3add17hb6f5839620df2142E: (a: number, b: number) => number;
  readonly _ZN6js_sys7WeakSet6delete17h54912c03af301702E: (a: number, b: number) => number;
  readonly _ZN6js_sys11WebAssembly7compile17h8c3efc3facd8c94dE: (a: number) => number;
  readonly _ZN6js_sys11WebAssembly17compile_streaming17hf5dc59426f90fb5cE: (a: number) => number;
  readonly _ZN6js_sys11WebAssembly18instantiate_buffer17h0d9bfb53e3c0a4e5E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys11WebAssembly18instantiate_module17h09fc0366c747e510E: (a: number, b: number) => number;
  readonly _ZN6js_sys11WebAssembly21instantiate_streaming17h556ea5062a81c938E: (a: number, b: number) => number;
  readonly _ZN6js_sys11WebAssembly8validate17h7a46fb5bdae39c5aE: (a: number, b: number) => void;
  readonly _ZN6js_sys11WebAssembly12CompileError3new17hc859aca7e30f462fE: (a: number, b: number) => number;
  readonly _ZN6js_sys11WebAssembly8Instance3new17h177572000dc4178fE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys11WebAssembly8Instance7exports17hc970643ae202ec90E: (a: number) => number;
  readonly _ZN6js_sys11WebAssembly9LinkError3new17h635defa954b946e8E: (a: number, b: number) => number;
  readonly _ZN6js_sys11WebAssembly12RuntimeError3new17hff0006f24af5abdfE: (a: number, b: number) => number;
  readonly _ZN6js_sys11WebAssembly6Module3new17hdda14d72d39c1aa1E: (a: number, b: number) => void;
  readonly _ZN6js_sys11WebAssembly6Module15custom_sections17hf26df6b73bfef884E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys11WebAssembly6Module7exports17h32c85c30a533b139E: (a: number) => number;
  readonly _ZN6js_sys11WebAssembly6Module7imports17h9dd63bd8b8f3eed7E: (a: number) => number;
  readonly _ZN6js_sys11WebAssembly5Table3new17hb016336fef1a47a0E: (a: number, b: number) => void;
  readonly _ZN6js_sys11WebAssembly5Table6length17h1a2298b11eee1d11E: (a: number) => number;
  readonly _ZN6js_sys11WebAssembly5Table3get17h208e9ce8693eea3eE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys11WebAssembly5Table4grow17haac20cef83d7e1eaE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys11WebAssembly5Table3set17h2d46b17c9d368df2E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys11WebAssembly3Tag3new17h72e524da88665646E: (a: number, b: number) => void;
  readonly _ZN6js_sys11WebAssembly9Exception3new17haf96bf5bdf3d7cf8E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys11WebAssembly9Exception16new_with_options17h08723896b09a65ffE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys11WebAssembly9Exception2is17h70c56709fffb9bbaE: (a: number, b: number) => number;
  readonly _ZN6js_sys11WebAssembly9Exception7get_arg17h79713c89e79b8d8cE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys11WebAssembly6Global3new17h5a9a11e8541d2269E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys11WebAssembly6Global5value17haaba307499979d00E: (a: number) => number;
  readonly _ZN6js_sys11WebAssembly6Global9set_value17h2609db1e4e0cf5dcE: (a: number, b: number) => void;
  readonly _ZN6js_sys11WebAssembly6Memory3new17h9c722c198f40ad0bE: (a: number, b: number) => void;
  readonly _ZN6js_sys11WebAssembly6Memory4grow17h99be421e88fe786aE: (a: number, b: number) => number;
  readonly _ZN6js_sys4JSON5parse17ha545aaefd43dfbefE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys4JSON9stringify17h36da7804b7d666a2E: (a: number, b: number) => void;
  readonly _ZN6js_sys4JSON23stringify_with_replacer17hf16101fbed85fb43E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys4JSON33stringify_with_replacer_and_space17hd8815c04910ae934E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys8JsString6length17h943e7f58b390ae80E: (a: number) => number;
  readonly _ZN6js_sys8JsString2at17h6ee36fc496865651E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys8JsString7char_at17hfa8c386676c662f1E: (a: number, b: number) => number;
  readonly _ZN6js_sys8JsString12char_code_at17h5c168a88e91ad61eE: (a: number, b: number) => number;
  readonly _ZN6js_sys8JsString13code_point_at17hbb34031e62cee2f1E: (a: number, b: number) => number;
  readonly _ZN6js_sys8JsString6concat17hefc47c0118e36163E: (a: number, b: number) => number;
  readonly _ZN6js_sys8JsString9ends_with17h42d9464c8ead2076E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys8JsString14from_char_code17h939588d43f4640b5E: (a: number, b: number) => number;
  readonly _ZN6js_sys8JsString15from_char_code117ha3fd2a463ed88ec3E: (a: number) => number;
  readonly _ZN6js_sys8JsString15from_char_code217h0c903b2542561cd0E: (a: number, b: number) => number;
  readonly _ZN6js_sys8JsString15from_char_code317hb6c2866a0331d10fE: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys8JsString15from_char_code417h8bf09b5e540f3da0E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys8JsString15from_char_code517hdd6753ff41b19243E: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly _ZN6js_sys8JsString15from_code_point17had5e1285e2f9f607E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys8JsString16from_code_point217h0619bef9b9119fdaE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys8JsString16from_code_point317h5ec646b41a51ab99E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys8JsString16from_code_point417hd31732f63bfd8b37E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN6js_sys8JsString16from_code_point517h38ed197aec748adfE: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN6js_sys8JsString8includes17h89570557581c5c1eE: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys8JsString8index_of17h0deb7a3db92e23e8E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys8JsString13last_index_of17hb214b403bad94bd6E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys8JsString14locale_compare17h5d13cb5d965c3b6bE: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly _ZN6js_sys8JsString6match_17h97e49729cf46e423E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys8JsString9match_all17h6bfd344aa347d39eE: (a: number, b: number) => number;
  readonly _ZN6js_sys8JsString9normalize17h8f280b9ca46b6b8fE: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys8JsString7pad_end17hdeca0ff6e7d164f2E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys8JsString9pad_start17h6f414314b3eab1cfE: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys8JsString6repeat17h30a76c9551072891E: (a: number, b: number) => number;
  readonly _ZN6js_sys8JsString7replace17h8772946b6822d708E: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly _ZN6js_sys8JsString21replace_with_function17ha1ad1c4a2b544be2E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys8JsString18replace_by_pattern17h625a0a7d7f00846cE: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys8JsString32replace_by_pattern_with_function17hef546631d7c06a0cE: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys8JsString11replace_all17h6976d42e900d013dE: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly _ZN6js_sys8JsString25replace_all_with_function17hed7284e33b89fdb4E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys8JsString22replace_all_by_pattern17h688b4d7a320ff0faE: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys8JsString36replace_all_by_pattern_with_function17h1e43ea695c93c6ecE: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys8JsString6search17ha82c3848c0fd911dE: (a: number, b: number) => number;
  readonly _ZN6js_sys8JsString5slice17h62c20cd7144f4180E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys8JsString5split17h8a69afd24587d57bE: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys8JsString11split_limit17hfd9d1269ef1494a1E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys8JsString16split_by_pattern17h38807d3b74d0d3bfE: (a: number, b: number) => number;
  readonly _ZN6js_sys8JsString22split_by_pattern_limit17hddd1d68bbc5829c0E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys8JsString11starts_with17hf406cda327aa75a0E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys8JsString9substring17h5ab37ebda34ca2c3E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys8JsString6substr17h761fc1b3c73496acE: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys8JsString20to_locale_lower_case17h6d56edbe4fcb3141E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys8JsString20to_locale_upper_case17heebccd9efefcd14cE: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys8JsString13to_lower_case17hf0cf3fa67d433a63E: (a: number) => number;
  readonly _ZN6js_sys8JsString9to_string17h570c7c852c5b49d6E: (a: number) => number;
  readonly _ZN6js_sys8JsString13to_upper_case17hb2dc775469fe15deE: (a: number) => number;
  readonly _ZN6js_sys8JsString4trim17hf3c0f26aec807561E: (a: number) => number;
  readonly _ZN6js_sys8JsString8trim_end17h913c104f1d63b5d0E: (a: number) => number;
  readonly _ZN6js_sys8JsString10trim_right17hca27dc6b6ead3d12E: (a: number) => number;
  readonly _ZN6js_sys8JsString10trim_start17h30ead94dcc3652c8E: (a: number) => number;
  readonly _ZN6js_sys8JsString9trim_left17h42ac83d40cc24b38E: (a: number) => number;
  readonly _ZN6js_sys8JsString8value_of17h17183175d6cc5539E: (a: number) => number;
  readonly _ZN6js_sys8JsString3raw17h029aeab702fdd539E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys8JsString5raw_017h0d0dd42d359cb043E: (a: number, b: number) => void;
  readonly _ZN6js_sys8JsString5raw_117hb18d3d8c89315ee3E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys8JsString5raw_217he171d310bd735043E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN6js_sys8JsString5raw_317hfe5f2c9b8392aa96E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
  readonly _ZN6js_sys8JsString5raw_417h5461727b46579ed8E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => void;
  readonly _ZN6js_sys8JsString5raw_517h58db8ee222a8bf6fE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number) => void;
  readonly _ZN6js_sys8JsString5raw_617h7f6482a6e9ccd8a4E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number) => void;
  readonly _ZN6js_sys8JsString5raw_717hbd0b0b360bbe0f9cE: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number, p: number) => void;
  readonly _ZN6js_sys6Symbol12has_instance17hefdab58581bdc5e0E: () => number;
  readonly _ZN6js_sys6Symbol20is_concat_spreadable17h01c80f9f5e782ea0E: () => number;
  readonly _ZN6js_sys6Symbol14async_iterator17hb1a271d49abb65edE: () => number;
  readonly _ZN6js_sys6Symbol8iterator17h88076609b72ed93aE: () => number;
  readonly _ZN6js_sys6Symbol6match_17hc875c9567d558efdE: () => number;
  readonly _ZN6js_sys6Symbol7replace17h01c254cb2d04a6ffE: () => number;
  readonly _ZN6js_sys6Symbol6search17hb7ae0c746c968ea3E: () => number;
  readonly _ZN6js_sys6Symbol7species17h7eca6f1ff104e6abE: () => number;
  readonly _ZN6js_sys6Symbol5split17hb1cd618a2ae6d27aE: () => number;
  readonly _ZN6js_sys6Symbol12to_primitive17hddd782ecc1a7a206E: () => number;
  readonly _ZN6js_sys6Symbol13to_string_tag17hff54d014081adc10E: () => number;
  readonly _ZN6js_sys6Symbol4for_17h412a61f84baa0a0dE: (a: number, b: number) => number;
  readonly _ZN6js_sys6Symbol7key_for17hd1d1845ce61c3120E: (a: number) => number;
  readonly _ZN6js_sys6Symbol9to_string17h16615047fb859468E: (a: number) => number;
  readonly _ZN6js_sys6Symbol11unscopables17hb85a0d341f82afd3E: () => number;
  readonly _ZN6js_sys6Symbol8value_of17h158da9e4309d6b73E: (a: number) => number;
  readonly _ZN6js_sys4Intl21get_canonical_locales17hbdbf5dbd1569ad17E: (a: number) => number;
  readonly _ZN6js_sys4Intl8Collator3new17h9777c1947d61493fE: (a: number, b: number) => number;
  readonly _ZN6js_sys4Intl8Collator7compare17h3b5dd46b5431ea18E: (a: number) => number;
  readonly _ZN6js_sys4Intl8Collator16resolved_options17hf96d100141f9fad3E: (a: number) => number;
  readonly _ZN6js_sys4Intl8Collator20supported_locales_of17h787324cd9ad0b6bbE: (a: number, b: number) => number;
  readonly _ZN6js_sys4Intl14DateTimeFormat3new17hbcfe8e8d7420cf35E: (a: number, b: number) => number;
  readonly _ZN6js_sys4Intl14DateTimeFormat6format17h37ef2c74abbb242aE: (a: number) => number;
  readonly _ZN6js_sys4Intl14DateTimeFormat15format_to_parts17hbee1d24f240fbcf5E: (a: number, b: number) => number;
  readonly _ZN6js_sys4Intl14DateTimeFormat16resolved_options17h43fac7d963d50815E: (a: number) => number;
  readonly _ZN6js_sys4Intl14DateTimeFormat20supported_locales_of17h403532e2b543c2b1E: (a: number, b: number) => number;
  readonly _ZN6js_sys4Intl12NumberFormat3new17h3d7814c3ae7fffa1E: (a: number, b: number) => number;
  readonly _ZN6js_sys4Intl12NumberFormat6format17h998ce3ac56e309d0E: (a: number) => number;
  readonly _ZN6js_sys4Intl12NumberFormat15format_to_parts17h3c61100a78e41f1dE: (a: number, b: number) => number;
  readonly _ZN6js_sys4Intl12NumberFormat16resolved_options17h105c7d48f6fb7ebeE: (a: number) => number;
  readonly _ZN6js_sys4Intl12NumberFormat20supported_locales_of17he9ed4e67062209d8E: (a: number, b: number) => number;
  readonly _ZN6js_sys4Intl11PluralRules3new17h301c8aa199a8a8a5E: (a: number, b: number) => number;
  readonly _ZN6js_sys4Intl11PluralRules16resolved_options17h09ce138e7fbdedddE: (a: number) => number;
  readonly _ZN6js_sys4Intl11PluralRules6select17h7e497345f4515e14E: (a: number, b: number) => number;
  readonly _ZN6js_sys4Intl11PluralRules20supported_locales_of17h808e9949a8fb185dE: (a: number, b: number) => number;
  readonly _ZN6js_sys4Intl18RelativeTimeFormat3new17hb2212ba56e48a9c1E: (a: number, b: number) => number;
  readonly _ZN6js_sys4Intl18RelativeTimeFormat6format17h1eed1121e303940aE: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys4Intl18RelativeTimeFormat15format_to_parts17h12fb252b04812c27E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys4Intl18RelativeTimeFormat16resolved_options17he444348173fd0863E: (a: number) => number;
  readonly _ZN6js_sys4Intl18RelativeTimeFormat20supported_locales_of17h55ac5c17f6895a54E: (a: number, b: number) => number;
  readonly _ZN6js_sys7Promise3all17hfc9bcc5d4fa2b5baE: (a: number) => number;
  readonly _ZN6js_sys7Promise11all_settled17h34b096862f81f4a1E: (a: number) => number;
  readonly _ZN6js_sys7Promise3any17h7b34320a0fef548fE: (a: number) => number;
  readonly _ZN6js_sys7Promise4race17h7cb625347be24e44E: (a: number) => number;
  readonly _ZN6js_sys7Promise6reject17h05e8f9ae8eb52217E: (a: number) => number;
  readonly _ZN6js_sys7Promise5catch17hf71ec3d161283e01E: (a: number, b: number) => number;
  readonly _ZN6js_sys7Promise7finally17hd4f77431bc75c4cfE: (a: number, b: number) => number;
  readonly _ZN6js_sys9Int8Array4view17hcf613724a3b94355E: (a: number, b: number) => number;
  readonly _ZN6js_sys9Int8Array12view_mut_raw17hd07c465a729ed803E: (a: number, b: number) => number;
  readonly _ZN6js_sys9Int8Array15raw_copy_to_ptr17h1dd9a62a3f69136aE: (a: number, b: number) => void;
  readonly _ZN6js_sys9Int8Array7copy_to17hb0c4f58aecb2dc0bE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys9Int8Array14copy_to_uninit17h5739a9531ca1eb9fE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys9Int8Array9copy_from17h5340df1a21e8fb36E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys9Int8Array6to_vec17h8b7ade96cf2430fcE: (a: number, b: number) => void;
  readonly _ZN6js_sys10Int16Array4view17h556f5e75eb5b9560E: (a: number, b: number) => number;
  readonly _ZN6js_sys10Int16Array12view_mut_raw17h2fb24d1f1ae2edbbE: (a: number, b: number) => number;
  readonly _ZN6js_sys10Int16Array15raw_copy_to_ptr17h303a199a56ed2610E: (a: number, b: number) => void;
  readonly _ZN6js_sys10Int16Array7copy_to17h7e9bb6871ac334bdE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys10Int16Array14copy_to_uninit17h443a2ed0936d9deaE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys10Int16Array9copy_from17he7c0abe140688b68E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys10Int16Array6to_vec17h9ed953c27fd4ae1eE: (a: number, b: number) => void;
  readonly _ZN6js_sys10Int32Array4view17hff5801b711ad3d92E: (a: number, b: number) => number;
  readonly _ZN6js_sys10Int32Array12view_mut_raw17hca149e7eb36674cdE: (a: number, b: number) => number;
  readonly _ZN6js_sys10Int32Array15raw_copy_to_ptr17h39fd8ca669f70384E: (a: number, b: number) => void;
  readonly _ZN6js_sys10Int32Array7copy_to17h4ed7e84d887d8489E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys10Int32Array14copy_to_uninit17hb0245506a4bfcff9E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys10Int32Array9copy_from17hc9e8561dbf2500bbE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys10Int32Array6to_vec17he749286ab9055dbaE: (a: number, b: number) => void;
  readonly _ZN6js_sys10Uint8Array7copy_to17h0df339e265494475E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys10Uint8Array14copy_to_uninit17h1bf840c21d219a58E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys10Uint8Array9copy_from17h58c7b675d4213c48E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys17Uint8ClampedArray4view17hdc39ffa532205930E: (a: number, b: number) => number;
  readonly _ZN6js_sys17Uint8ClampedArray12view_mut_raw17ha55e60ad1aca83e8E: (a: number, b: number) => number;
  readonly _ZN6js_sys17Uint8ClampedArray15raw_copy_to_ptr17h8c420356cad0dcb8E: (a: number, b: number) => void;
  readonly _ZN6js_sys17Uint8ClampedArray7copy_to17he594ecb4750e2ed9E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys17Uint8ClampedArray14copy_to_uninit17hb671ce9e68c5bd02E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys17Uint8ClampedArray9copy_from17h05df06c56b5ec8e3E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys17Uint8ClampedArray6to_vec17ha9fd1b066beca3c9E: (a: number, b: number) => void;
  readonly _ZN6js_sys11Uint16Array4view17h50aa7d3979e55d62E: (a: number, b: number) => number;
  readonly _ZN6js_sys11Uint16Array12view_mut_raw17h62967ff8ab631fb4E: (a: number, b: number) => number;
  readonly _ZN6js_sys11Uint16Array15raw_copy_to_ptr17h6311893ac97962afE: (a: number, b: number) => void;
  readonly _ZN6js_sys11Uint16Array7copy_to17h131d639d9ffd3da0E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys11Uint16Array14copy_to_uninit17hda0596bd7fa9cceaE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys11Uint16Array9copy_from17hf4dd97f21f8e3e21E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys11Uint16Array6to_vec17hd0284294221e00fdE: (a: number, b: number) => void;
  readonly _ZN6js_sys11Uint32Array4view17hc875a4c4582d2e8bE: (a: number, b: number) => number;
  readonly _ZN6js_sys11Uint32Array12view_mut_raw17he4b12daa83bbbe27E: (a: number, b: number) => number;
  readonly _ZN6js_sys11Uint32Array15raw_copy_to_ptr17hebd71cd04e99c951E: (a: number, b: number) => void;
  readonly _ZN6js_sys11Uint32Array7copy_to17habb7fa84507039ebE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys11Uint32Array14copy_to_uninit17hdaa768e1090b10feE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys11Uint32Array9copy_from17h3b179fc8e37f7f4aE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys11Uint32Array6to_vec17h805a043ff0ea9befE: (a: number, b: number) => void;
  readonly _ZN6js_sys12Float32Array4view17hfd8c192cca9f5902E: (a: number, b: number) => number;
  readonly _ZN6js_sys12Float32Array12view_mut_raw17hcf5869b765a0902eE: (a: number, b: number) => number;
  readonly _ZN6js_sys12Float32Array15raw_copy_to_ptr17h9d5808efc0ced11fE: (a: number, b: number) => void;
  readonly _ZN6js_sys12Float32Array7copy_to17h540af7e74e7a74d2E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys12Float32Array14copy_to_uninit17h978470fd11d56cd2E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys12Float32Array9copy_from17h0f098b65c5f99eb7E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys12Float32Array6to_vec17hc18ad38c83818251E: (a: number, b: number) => void;
  readonly _ZN6js_sys12Float64Array4view17hbcc9b14b1ccd496cE: (a: number, b: number) => number;
  readonly _ZN6js_sys12Float64Array12view_mut_raw17hf59030a6c9652e23E: (a: number, b: number) => number;
  readonly _ZN6js_sys12Float64Array15raw_copy_to_ptr17hf73e6aafb2337882E: (a: number, b: number) => void;
  readonly _ZN6js_sys12Float64Array7copy_to17h20b8fff89a2392d8E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys12Float64Array14copy_to_uninit17h7bc7e048f9bef4e3E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys12Float64Array9copy_from17h7bd990ccd41a909aE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys12Float64Array6to_vec17h2145f1832d5eb2fcE: (a: number, b: number) => void;
  readonly _ZN6js_sys13BigInt64Array4view17hd5eefbf66faad68bE: (a: number, b: number) => number;
  readonly _ZN6js_sys13BigInt64Array12view_mut_raw17h37260f4c886d6a89E: (a: number, b: number) => number;
  readonly _ZN6js_sys13BigInt64Array15raw_copy_to_ptr17h19df4df749174540E: (a: number, b: number) => void;
  readonly _ZN6js_sys13BigInt64Array7copy_to17he4d7f02ce042ca7bE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys13BigInt64Array14copy_to_uninit17h56f4f24ffb3170e7E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys13BigInt64Array9copy_from17hfef436b2c8cffe5dE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys13BigInt64Array6to_vec17h6e6501060c808c7bE: (a: number, b: number) => void;
  readonly _ZN6js_sys14BigUint64Array4view17h3d0697fcb3c9ff71E: (a: number, b: number) => number;
  readonly _ZN6js_sys14BigUint64Array12view_mut_raw17h14082db1add418a0E: (a: number, b: number) => number;
  readonly _ZN6js_sys14BigUint64Array15raw_copy_to_ptr17h38943688678b4b85E: (a: number, b: number) => void;
  readonly _ZN6js_sys14BigUint64Array7copy_to17h914a91f2817e397dE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys14BigUint64Array14copy_to_uninit17hbedb51e8525f3285E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6js_sys14BigUint64Array9copy_from17hf7803087457127e8E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys14BigUint64Array6to_vec17h507a6376e594b8f5E: (a: number, b: number) => void;
  readonly _ZN6js_sys9Int8Array3new17h37729ff96dc1ca2bE: (a: number) => number;
  readonly _ZN6js_sys9Int8Array15new_with_length17he4aa12ef40386e1bE: (a: number) => number;
  readonly _ZN6js_sys9Int8Array20new_with_byte_offset17h8a089abcc8f78462E: (a: number, b: number) => number;
  readonly _ZN6js_sys9Int8Array31new_with_byte_offset_and_length17h0db74348aec697efE: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys9Int8Array4fill17h85a6e12aad115b47E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys9Int8Array6buffer17hf491b08dc0fb9e8eE: (a: number) => number;
  readonly _ZN6js_sys9Int8Array8subarray17he2cedbc4df93c74aE: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys9Int8Array5slice17h542584b53a0cc6beE: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys9Int8Array8for_each17h0389a02ef231f362E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys9Int8Array6length17h1eb6df60815b9f2dE: (a: number) => number;
  readonly _ZN6js_sys9Int8Array11byte_length17ha5cfb2701756dcbdE: (a: number) => number;
  readonly _ZN6js_sys9Int8Array11byte_offset17hafe9d0c215339425E: (a: number) => number;
  readonly _ZN6js_sys9Int8Array3set17h84ec7996b4b0fd61E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys9Int8Array2at17he96be8785218b3ebE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys9Int8Array11copy_within17h760ab9ea42d1d355E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys9Int8Array9get_index17hc2ea6e5eed70ebb2E: (a: number, b: number) => number;
  readonly _ZN6js_sys9Int8Array9set_index17h61e44a01d39b0266E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys10Int16Array3new17h7ac9f89ac8b6b119E: (a: number) => number;
  readonly _ZN6js_sys10Int16Array15new_with_length17h534dd20b729fc8c4E: (a: number) => number;
  readonly _ZN6js_sys10Int16Array20new_with_byte_offset17haf83cab8f85f4d51E: (a: number, b: number) => number;
  readonly _ZN6js_sys10Int16Array31new_with_byte_offset_and_length17h80fa12142a57f70fE: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys10Int16Array4fill17hecc0fb05ef24ee53E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys10Int16Array6buffer17hb34449e6a913c75dE: (a: number) => number;
  readonly _ZN6js_sys10Int16Array8subarray17h0aa4acbf3a08c415E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys10Int16Array5slice17h5bcb14737c0c6a89E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys10Int16Array8for_each17h704e997ef0dfd345E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys10Int16Array6length17h27b83d3f6b1f233dE: (a: number) => number;
  readonly _ZN6js_sys10Int16Array11byte_length17h9587e1d9189abf2cE: (a: number) => number;
  readonly _ZN6js_sys10Int16Array11byte_offset17h1cafd5f81a1b6440E: (a: number) => number;
  readonly _ZN6js_sys10Int16Array3set17h1fad6297fd370690E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys10Int16Array2at17h18a6088dfea5760bE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys10Int16Array11copy_within17h18a76051d5a15ba8E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys10Int16Array9get_index17h59b7dab7b4edfac7E: (a: number, b: number) => number;
  readonly _ZN6js_sys10Int16Array9set_index17hafd3c35fbd59a9a7E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys10Int32Array15new_with_length17h6d5b747e66a9911fE: (a: number) => number;
  readonly _ZN6js_sys10Int32Array20new_with_byte_offset17h1cd2ab180a12cfb4E: (a: number, b: number) => number;
  readonly _ZN6js_sys10Int32Array31new_with_byte_offset_and_length17h4614dc60a66ad396E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys10Int32Array4fill17h2711af354ed040feE: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys10Int32Array6buffer17he4e26a5085145539E: (a: number) => number;
  readonly _ZN6js_sys10Int32Array8subarray17he6e3e8cfaa4f4ae0E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys10Int32Array5slice17h1f32a966d440d5b4E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys10Int32Array8for_each17h9c499acbbc0abc7fE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys10Int32Array6length17hae04b7f08f063ce3E: (a: number) => number;
  readonly _ZN6js_sys10Int32Array11byte_length17hbe5bc1477ad522baE: (a: number) => number;
  readonly _ZN6js_sys10Int32Array11byte_offset17h9819218711f24caaE: (a: number) => number;
  readonly _ZN6js_sys10Int32Array3set17h5e91fe2aa89b8f82E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys10Int32Array2at17h987f75a3ee1ff8d8E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys10Int32Array11copy_within17h0204244c2394cde5E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys10Int32Array9get_index17hc46e06fb68a5d478E: (a: number, b: number) => number;
  readonly _ZN6js_sys10Int32Array9set_index17h4a9d8fdabb8d6c8fE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys10Uint8Array20new_with_byte_offset17h0c74dcbe01c2c0fcE: (a: number, b: number) => number;
  readonly _ZN6js_sys10Uint8Array31new_with_byte_offset_and_length17h9bc44b8cdc6c58b1E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys10Uint8Array4fill17hff471d24dea334cfE: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys10Uint8Array6buffer17hc413a231b3f50915E: (a: number) => number;
  readonly _ZN6js_sys10Uint8Array5slice17h940778ab28833579E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys10Uint8Array8for_each17h07ba6a35b40bd3f1E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys10Uint8Array6length17h17c15d62472cc1f7E: (a: number) => number;
  readonly _ZN6js_sys10Uint8Array11byte_length17h0583d07583933d8dE: (a: number) => number;
  readonly _ZN6js_sys10Uint8Array11byte_offset17h3c56d3c124d087c8E: (a: number) => number;
  readonly _ZN6js_sys10Uint8Array3set17hcf29389bc82aa621E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys10Uint8Array2at17h7f570f20acdfda2fE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys10Uint8Array11copy_within17hf4dacd1fb25bea2eE: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys10Uint8Array9get_index17h3f27c5c76b3b20aeE: (a: number, b: number) => number;
  readonly _ZN6js_sys10Uint8Array9set_index17h317b59c51fdfc336E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys17Uint8ClampedArray3new17hf7763ddf160b6d09E: (a: number) => number;
  readonly _ZN6js_sys17Uint8ClampedArray15new_with_length17h1716728443775bebE: (a: number) => number;
  readonly _ZN6js_sys17Uint8ClampedArray20new_with_byte_offset17h41635ed4b3b98212E: (a: number, b: number) => number;
  readonly _ZN6js_sys17Uint8ClampedArray31new_with_byte_offset_and_length17h4ec1646223834f5eE: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys17Uint8ClampedArray4fill17hc47ea20225c4ba28E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys17Uint8ClampedArray6buffer17hc1ac53aaaabfffb6E: (a: number) => number;
  readonly _ZN6js_sys17Uint8ClampedArray8subarray17h338a70eeafd7fe18E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys17Uint8ClampedArray5slice17h44f717d021f49d17E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys17Uint8ClampedArray8for_each17h1c75cb929c443ed2E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys17Uint8ClampedArray6length17h42bd8ae700ac78dfE: (a: number) => number;
  readonly _ZN6js_sys17Uint8ClampedArray11byte_length17hbc0699389b0f407eE: (a: number) => number;
  readonly _ZN6js_sys17Uint8ClampedArray11byte_offset17haa82caa92876773cE: (a: number) => number;
  readonly _ZN6js_sys17Uint8ClampedArray3set17h32c644397b238a07E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys17Uint8ClampedArray2at17ha28d432ccdee21a4E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys17Uint8ClampedArray11copy_within17hd2d7d93c9b5ea519E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys17Uint8ClampedArray9get_index17h5be0f43914191694E: (a: number, b: number) => number;
  readonly _ZN6js_sys17Uint8ClampedArray9set_index17he243f7115c37a3d1E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys11Uint16Array3new17h31435d104776a0cbE: (a: number) => number;
  readonly _ZN6js_sys11Uint16Array15new_with_length17h1f46f7e1846a663dE: (a: number) => number;
  readonly _ZN6js_sys11Uint16Array20new_with_byte_offset17h4848b7e35bf23948E: (a: number, b: number) => number;
  readonly _ZN6js_sys11Uint16Array31new_with_byte_offset_and_length17hb0b1024dc29e5735E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys11Uint16Array4fill17h58b13cba4ed01ab4E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys11Uint16Array6buffer17h62fd5db45c3fcb61E: (a: number) => number;
  readonly _ZN6js_sys11Uint16Array8subarray17h19dde81f11934646E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys11Uint16Array5slice17h70c34be5b1106d2eE: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys11Uint16Array8for_each17h5ad5a9768a8de998E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys11Uint16Array6length17hf5be6f7d977d8f41E: (a: number) => number;
  readonly _ZN6js_sys11Uint16Array11byte_length17h080d1904821e87d4E: (a: number) => number;
  readonly _ZN6js_sys11Uint16Array11byte_offset17h207c9146e91803b2E: (a: number) => number;
  readonly _ZN6js_sys11Uint16Array3set17hcb611b85b829ef6fE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys11Uint16Array2at17ha054cb04ab113c76E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys11Uint16Array11copy_within17h14bf84c7671820e2E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys11Uint16Array9get_index17h0ea247d2ffc33fb7E: (a: number, b: number) => number;
  readonly _ZN6js_sys11Uint16Array9set_index17h7f03e97e252eddfdE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys11Uint32Array3new17hee27df7909918b3bE: (a: number) => number;
  readonly _ZN6js_sys11Uint32Array15new_with_length17hf4d83981e618235fE: (a: number) => number;
  readonly _ZN6js_sys11Uint32Array20new_with_byte_offset17h872b4ce386eb334dE: (a: number, b: number) => number;
  readonly _ZN6js_sys11Uint32Array31new_with_byte_offset_and_length17hcb34ce7e7e8c48b3E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys11Uint32Array4fill17h62095a636d8f797cE: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys11Uint32Array6buffer17h7fdc9eb25edfd566E: (a: number) => number;
  readonly _ZN6js_sys11Uint32Array8subarray17h1d014f9cdcf36393E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys11Uint32Array5slice17h57342a409e4815e2E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys11Uint32Array8for_each17hfc86fc847295d618E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys11Uint32Array6length17h7caeefeb090ec423E: (a: number) => number;
  readonly _ZN6js_sys11Uint32Array11byte_length17h24ece18162f1c7caE: (a: number) => number;
  readonly _ZN6js_sys11Uint32Array11byte_offset17h2c7fa65f9cb5189aE: (a: number) => number;
  readonly _ZN6js_sys11Uint32Array3set17h883b4eaabdd4b0b4E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys11Uint32Array2at17h8ed16712d443c7baE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys11Uint32Array11copy_within17h7c50fa5c4f729d24E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys11Uint32Array9get_index17h4fd07fa393ca7f38E: (a: number, b: number) => number;
  readonly _ZN6js_sys11Uint32Array9set_index17h7a649706c7845d4eE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys12Float32Array3new17h074d22d0339370a0E: (a: number) => number;
  readonly _ZN6js_sys12Float32Array15new_with_length17hc801e3ee43746e6aE: (a: number) => number;
  readonly _ZN6js_sys12Float32Array20new_with_byte_offset17h636c9cb5adc76568E: (a: number, b: number) => number;
  readonly _ZN6js_sys12Float32Array31new_with_byte_offset_and_length17h94b75acba82c9055E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys12Float32Array4fill17h79a8a86beba603d3E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys12Float32Array6buffer17hed4d8d6c31ba4181E: (a: number) => number;
  readonly _ZN6js_sys12Float32Array8subarray17h9b26dd24d2fd2a39E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys12Float32Array5slice17h8aedfcab54a23b0eE: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys12Float32Array8for_each17h195e31842a3b0225E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys12Float32Array6length17h3c98718ce958660fE: (a: number) => number;
  readonly _ZN6js_sys12Float32Array11byte_length17ha743d8b34d355983E: (a: number) => number;
  readonly _ZN6js_sys12Float32Array11byte_offset17hccd762ca56963577E: (a: number) => number;
  readonly _ZN6js_sys12Float32Array3set17hc26abe8153c01c14E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys12Float32Array2at17h485ec95e74e497e3E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys12Float32Array11copy_within17hfd39554614a68aebE: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys12Float32Array9get_index17hba0e842165902eb0E: (a: number, b: number) => number;
  readonly _ZN6js_sys12Float32Array9set_index17h5a0d6ba187d2b9e0E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys12Float64Array3new17h48dc6c5926dfa846E: (a: number) => number;
  readonly _ZN6js_sys12Float64Array15new_with_length17hee973bc5dcf0690eE: (a: number) => number;
  readonly _ZN6js_sys12Float64Array20new_with_byte_offset17h2ef3aaeeeb2ce87cE: (a: number, b: number) => number;
  readonly _ZN6js_sys12Float64Array31new_with_byte_offset_and_length17h57e09e9e6d4665daE: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys12Float64Array4fill17h5df456f4661cc564E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys12Float64Array6buffer17h0c31105dde973429E: (a: number) => number;
  readonly _ZN6js_sys12Float64Array8subarray17h5a8a1ce5ca0ae604E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys12Float64Array5slice17he2b459d47578adb6E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys12Float64Array8for_each17hd1a82dc12aaee31dE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys12Float64Array6length17h752de3b22de026e7E: (a: number) => number;
  readonly _ZN6js_sys12Float64Array11byte_length17h3dac633312290394E: (a: number) => number;
  readonly _ZN6js_sys12Float64Array11byte_offset17hf19925bba643dce3E: (a: number) => number;
  readonly _ZN6js_sys12Float64Array3set17h4ec3e06a5c76bc1aE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys12Float64Array2at17h11ef3b13057bf468E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys12Float64Array11copy_within17h18ccebaea462ac5bE: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys12Float64Array9get_index17heb364960e25a97e5E: (a: number, b: number) => number;
  readonly _ZN6js_sys12Float64Array9set_index17h6acc7a46a378567cE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys13BigInt64Array3new17h13ce023a4968d369E: (a: number) => number;
  readonly _ZN6js_sys13BigInt64Array15new_with_length17h48733c89e499ffacE: (a: number) => number;
  readonly _ZN6js_sys13BigInt64Array20new_with_byte_offset17h4339beec2d9a8960E: (a: number, b: number) => number;
  readonly _ZN6js_sys13BigInt64Array31new_with_byte_offset_and_length17h448e46a6412658aeE: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys13BigInt64Array4fill17h0710c11737ee045aE: (a: number, b: bigint, c: number, d: number) => number;
  readonly _ZN6js_sys13BigInt64Array6buffer17he1d86911d592d2cbE: (a: number) => number;
  readonly _ZN6js_sys13BigInt64Array8subarray17h36d157e6352d36c8E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys13BigInt64Array5slice17hff2f0c4b524261b6E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys13BigInt64Array8for_each17h85c7f5fc42c0aa76E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys13BigInt64Array6length17h8a72f30454789d0eE: (a: number) => number;
  readonly _ZN6js_sys13BigInt64Array11byte_length17h2509791e3f8c7177E: (a: number) => number;
  readonly _ZN6js_sys13BigInt64Array11byte_offset17hfbcce7657728a124E: (a: number) => number;
  readonly _ZN6js_sys13BigInt64Array3set17h4e1765ee700341d3E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys13BigInt64Array2at17hdf195c0df8214297E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys13BigInt64Array11copy_within17hbf2981bfafb46311E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys13BigInt64Array9get_index17hdadb11c7b9d719f1E: (a: number, b: number) => bigint;
  readonly _ZN6js_sys13BigInt64Array9set_index17hafc0f12ed97542ebE: (a: number, b: number, c: bigint) => void;
  readonly _ZN6js_sys14BigUint64Array3new17he88a8efa62dec0e4E: (a: number) => number;
  readonly _ZN6js_sys14BigUint64Array15new_with_length17h257a01fc42b1ba1dE: (a: number) => number;
  readonly _ZN6js_sys14BigUint64Array20new_with_byte_offset17ha74fc27349b04083E: (a: number, b: number) => number;
  readonly _ZN6js_sys14BigUint64Array31new_with_byte_offset_and_length17h37e6e7fd938cb53aE: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys14BigUint64Array4fill17h4b46eb0f4ae6cd7dE: (a: number, b: bigint, c: number, d: number) => number;
  readonly _ZN6js_sys14BigUint64Array6buffer17h61537d9a59ce2c83E: (a: number) => number;
  readonly _ZN6js_sys14BigUint64Array8subarray17h9d67f5d88ace71adE: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys14BigUint64Array5slice17h699a8d892d09bb08E: (a: number, b: number, c: number) => number;
  readonly _ZN6js_sys14BigUint64Array8for_each17h8e818a10d778433dE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys14BigUint64Array6length17h98cf08770d18eba3E: (a: number) => number;
  readonly _ZN6js_sys14BigUint64Array11byte_length17h7660a4810fb93074E: (a: number) => number;
  readonly _ZN6js_sys14BigUint64Array11byte_offset17hfb26c18c7a38fca1E: (a: number) => number;
  readonly _ZN6js_sys14BigUint64Array3set17h696e1344252b0b21E: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys14BigUint64Array2at17hca86d2015587a3eeE: (a: number, b: number, c: number) => void;
  readonly _ZN6js_sys14BigUint64Array11copy_within17h09b2248a4adf2d28E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN6js_sys14BigUint64Array9get_index17he41affdb747dc814E: (a: number, b: number) => bigint;
  readonly _ZN6js_sys14BigUint64Array9set_index17hc0569a9818df521eE: (a: number, b: number, c: bigint) => void;
  readonly _ZN15crossbeam_epoch9collector9Collector3new17h9e5022e53c821fc5E: () => number;
  readonly _ZN15crossbeam_epoch5guard5Guard5repin17h58a4552c0c72cd22E: (a: number) => void;
  readonly _ZN15crossbeam_epoch7default17default_collector17hb02e98c70099e578E: () => number;
  readonly _ZN15crossbeam_utils4sync6parker6Parker3new17h59b8772d6605d0c9E: () => number;
  readonly _ZN15crossbeam_utils4sync6parker6Parker4park17h98f679798ffaab4cE: (a: number) => void;
  readonly _ZN15crossbeam_utils4sync6parker6Parker12park_timeout17h9d25a551eecbc29dE: (a: number, b: bigint, c: number) => void;
  readonly _ZN15crossbeam_utils4sync6parker6Parker13park_deadline17h603d2e929f5ed801E: (a: number, b: bigint, c: number) => void;
  readonly _ZN15crossbeam_utils4sync6parker6Parker8from_raw17h72e650331d02afb5E: (a: number) => number;
  readonly _ZN15crossbeam_utils4sync6parker8Unparker6unpark17hccb607ccd4b172d0E: (a: number) => void;
  readonly _ZN15crossbeam_utils4sync12sharded_lock14thread_indices17hce2943f94a32a441E: () => number;
  readonly _ZN15crossbeam_utils4sync10wait_group9WaitGroup3new17h5e134bd062ac57d0E: () => number;
  readonly _ZN15crossbeam_utils4sync10wait_group9WaitGroup4wait17heabd392a5a0f30e9E: (a: number) => void;
  readonly _ZN15crossbeam_utils6thread19ScopedThreadBuilder4name17h8abad0ecf923aca5E: (a: number, b: number, c: number) => void;
  readonly _ZN3std3sys4sync7condvar5futex7Condvar12wait_timeout17h1639606d81437a17E: (a: number, b: number, c: bigint, d: number) => number;
  readonly _ZN3std9panicking11panic_count17is_zero_slow_path17he4a6bce38e805500E: () => number;
  readonly _ZN15crossbeam_utils4sync6parker8Unparker8from_raw17hccc51b0909df836fE: (a: number) => number;
  readonly _ZN3log5Level6as_str17hfd0bc4f8ad7b7225E: (a: number, b: number) => void;
  readonly _ZN3log11LevelFilter6as_str17h045461478f0db2acE: (a: number, b: number) => void;
  readonly _ZN3log15set_logger_racy17hea7ca213c2d8ff5eE: (a: number, b: number) => number;
  readonly _ZN3log6logger17hed524707d0aba53bE: (a: number) => void;
  readonly _ZN4tiff7decoder3ifd5Value7into_u817h7164ffec953a482fE: (a: number, b: number) => void;
  readonly _ZN4tiff7decoder3ifd5Value8into_i3217hb4d46890b7f430dcE: (a: number, b: number) => void;
  readonly _ZN4tiff7decoder3ifd5Value8into_u6417h389c6730c53b6ba7E: (a: number, b: number) => void;
  readonly _ZN4tiff7decoder3ifd5Value8into_i6417hdf67373adeb05fbcE: (a: number, b: number) => void;
  readonly _ZN4tiff7decoder3ifd5Value8into_f3217heb05dc1e533676d0E: (a: number, b: number) => void;
  readonly _ZN4tiff7decoder3ifd5Value8into_f6417h130edff7e473e6c2E: (a: number, b: number) => void;
  readonly _ZN4tiff7decoder3ifd5Value11into_string17h8ad2e44286955b87E: (a: number, b: number) => void;
  readonly _ZN4tiff7decoder3ifd5Value12into_u32_vec17hdec5aab27040eb91E: (a: number, b: number) => void;
  readonly _ZN4tiff7decoder3ifd5Value12into_u16_vec17h76943d99502fe3ffE: (a: number, b: number) => void;
  readonly _ZN4tiff7decoder3ifd5Value12into_i32_vec17hb89065e3db0b5fc8E: (a: number, b: number) => void;
  readonly _ZN4tiff7decoder3ifd5Value12into_f32_vec17h94825f16c0ece339E: (a: number, b: number) => void;
  readonly _ZN4tiff7decoder3ifd5Value12into_f64_vec17hf206021f21a9cde2E: (a: number, b: number) => void;
  readonly _ZN4tiff7decoder3ifd5Value12into_i64_vec17h3b354dda789fb7b7E: (a: number, b: number) => void;
  readonly _ZN4tiff7decoder5image5Image16chunk_file_range17h4bc05b7f6b3fa1d1E: (a: number, b: number, c: number) => void;
  readonly _ZN3std2io5error5Error3new17h2fd8efdc68fe6200E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN3std2io5error5Error3new17h9ae3405a87d202d5E: (a: number, b: number) => void;
  readonly _ZN6flate23crc3Crc6update17h565ee03cd1a0c2eeE: (a: number, b: number, c: number) => void;
  readonly _ZN6flate23crc3Crc7combine17h21a91339278c5690E: (a: number, b: number) => void;
  readonly _ZN9crc32fast6Hasher7combine17h14e92a5674f96c01E: (a: number, b: number) => void;
  readonly _ZN11miniz_oxide7inflate6stream12InflateState9new_boxed17h0e1454731f39e26fE: (a: number) => number;
  readonly _ZN11miniz_oxide7inflate6stream7inflate17hbfe5d3721c653e91E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN11miniz_oxide7deflate4core15CompressorOxide20set_format_and_level17h3d5c40a53dd3a506E: (a: number, b: number, c: number) => void;
  readonly _ZN11miniz_oxide7deflate6stream7deflate17h64d61313722f3ba1E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN11miniz_oxide7deflate4core15CompressorOxide5reset17hd5c0b7a18f336d5cE: (a: number) => void;
  readonly _ZN6flate22gz7bufread4copy17hbf28297cf5c08d24E: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly _ZN6flate22gz8GzHeader17mtime_as_datetime17hc9f06ec12dc8f562E: (a: number, b: number) => void;
  readonly _ZN6flate22gz10bad_header17hf5ce482c7943eb24E: (a: number) => void;
  readonly _ZN6flate22gz7corrupt17h6a0993b95016694aE: (a: number) => void;
  readonly _ZN6flate22gz9GzBuilder11into_header17h730197c3c3dfd6f4E: (a: number, b: number, c: number) => void;
  readonly _ZN6flate23mem8Compress5reset17h8b5977344243e237E: (a: number) => void;
  readonly _ZN6flate23mem8Compress8compress17he2e0fb9f382d323dE: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly _ZN6flate23mem8Compress12compress_vec17hc15537440ed83516E: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly _ZN6flate23mem10Decompress10decompress17h96ff2dff45ece131E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN6flate23mem10Decompress14decompress_vec17hcc85e065c42aff19E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN11miniz_oxide7deflate4core15CompressorOxide3new17h793bf91b03243401E: (a: number, b: number) => void;
  readonly _ZN11miniz_oxide7deflate4core15CompressorOxide21set_compression_level17h22e1b967fc443514E: (a: number, b: number) => void;
  readonly _ZN11miniz_oxide7deflate4core15CompressorOxide25set_compression_level_raw17h3984d6e0af0ee34fE: (a: number, b: number) => void;
  readonly _ZN11miniz_oxide7deflate4core8compress17h9d8e6a617771c8f4E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN11miniz_oxide7deflate4core14compress_inner17h1b0f03e2114e1557E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN11miniz_oxide7deflate4core33create_comp_flags_from_zip_params17h18ed52fbddc4431bE: (a: number, b: number, c: number) => number;
  readonly _ZN11miniz_oxide7deflate15compress_to_vec17h0557fec5d4086376E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN11miniz_oxide7inflate4core10decompress17h6f04553b3d651185E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
  readonly _ZN11miniz_oxide7inflate6stream12InflateState26new_boxed_with_window_bits17h29c38b669138b5c0E: (a: number) => number;
  readonly _ZN11miniz_oxide7inflate23decompress_to_vec_inner17hdae8d38b45d99907E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN11miniz_oxide6shared14update_adler3217h270ba089d9ffebd6E: (a: number, b: number, c: number) => number;
  readonly _ZN12simd_adler323imp6scalar6update17h1ace4c10a7620aa4E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN9crc32fast4hash17hc760c348fbef7f45E: (a: number, b: number) => number;
  readonly _ZN5weezl6decode13Configuration3new17h851c2e6c26a6f22fE: (a: number, b: number) => number;
  readonly _ZN5weezl6decode13Configuration21with_tiff_size_switch17h1e219e1741842b30E: (a: number, b: number) => number;
  readonly _ZN5weezl6decode13Configuration5build17h042a8f21b554c4b2E: (a: number, b: number) => void;
  readonly _ZN5weezl6decode7Decoder6decode17hfbeaf6d36eebb17dE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN5weezl6decode7IntoVec6decode17hfd13fd8a93069039E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN5weezl6decode7IntoVec10decode_all17h685ff823485b90e3E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN5weezl6decode5Table4init17ha7ca916bf3b530acE: (a: number, b: number) => void;
  readonly _ZN5weezl6decode6Buffer16fill_reconstruct17hab64447989622158E: (a: number, b: number, c: number) => number;
  readonly _ZN5weezl6decode5Table12derive_burst17hfde0ce4153e19c78E: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN5weezl6decode6Buffer10fill_cscsc17h9c8d426436a896c9E: (a: number) => number;
  readonly _ZN5weezl6decode6Buffer6buffer17h44bfb0415b2f4b84E: (a: number, b: number) => void;
  readonly _ZN5weezl6decode5Table2at17hb5263a07c595635eE: (a: number, b: number) => number;
  readonly _ZN5weezl6decode5Table6derive17h52bb75ada4e348eaE: (a: number, b: number, c: number) => void;
  readonly _ZN5weezl6decode5Table11reconstruct17hf96cd665d3630fb5E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN5weezl6encode13Configuration3new17hc750eeae2c4d0a87E: (a: number, b: number) => number;
  readonly _ZN5weezl6encode13Configuration21with_tiff_size_switch17hf1a6038ecf1654a2E: (a: number, b: number) => number;
  readonly _ZN5weezl6encode13Configuration5build17h0b0fe9256a2f66d8E: (a: number, b: number) => void;
  readonly _ZN5weezl6encode7Encoder21with_tiff_size_switch17h3d3b77190bda5f57E: (a: number, b: number, c: number) => void;
  readonly _ZN5weezl6encode7Encoder6encode17h0aa4445220ce1418E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN5weezl6encode7Encoder6finish17hbd820a9d49eb2a03E: (a: number) => void;
  readonly _ZN5weezl6encode7IntoVec6encode17h844886d0cd540d91E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN5weezl6encode4Tree7iterate17hf9fb61293af87b51E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN5weezl6encode4Tree5reset17h804996c3974958c5E: (a: number, b: number) => void;
  readonly _ZN5weezl6encode7Encoder12encode_bytes17h39c1f82c6740cf2fE: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly _ZN5weezl6encode7Encoder5reset17h80d3b1e2d4f85ca5E: (a: number) => void;
  readonly _ZN3std3sys9backtrace28__rust_begin_short_backtrace17h2d5da660f7e4ea22E: (a: number) => void;
  readonly _ZN3std3sys9backtrace28__rust_begin_short_backtrace17ha436e9c18c52291eE: (a: number, b: number) => void;
  readonly _ZN12jpeg_decoder6worker9immediate15ImmediateWorker15start_immediate17h5502040178d21b6cE: (a: number, b: number) => void;
  readonly _ZN12jpeg_decoder6worker9immediate15ImmediateWorker20append_row_immediate17he88030a67982543bE: (a: number, b: number) => void;
  readonly _ZN12jpeg_decoder6parser9FrameInfo16update_idct_size17h98307c24f55aa0b9E: (a: number, b: number, c: number) => void;
  readonly _ZN12jpeg_decoder6worker9immediate15ImmediateWorker20get_result_immediate17h4e7f04753f8a47f5E: (a: number, b: number, c: number) => void;
  readonly _ZN12wasm_bindgen4__rt29encode_u32_to_fixed_len_bytes17hd8fe8a168a376a1aE: (a: number, b: number) => void;
  readonly _ZN12wasm_bindgen7JsValue6symbol17hf48748398fed7753E: (a: number, b: number) => number;
  readonly _ZN12wasm_bindgen17bigint_get_as_i6417h5e55f3904b2977c6E: (a: number, b: number) => void;
  readonly _ZN12wasm_bindgen5throw17he2080be55ae274d0E: (a: number, b: number) => void;
  readonly _ZN12wasm_bindgen22anyref_heap_live_count17hfea942be20bbf6caE: () => number;
  readonly _ZN12wasm_bindgen7exports17h31e3f1d7cbdda094E: () => number;
  readonly _ZN12wasm_bindgen14function_table17h45c10f0f345a3416E: () => number;
  readonly _ZN12wasm_bindgen25externref_heap_live_count17h9a809cc8102316b4E: () => number;
  readonly _ZN3std2io5error5Error3new17h3ad89f7bc9ee31dfE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN3std2io5error5Error3new17h4a2fd2aaa71f6232E: (a: number, b: number, c: number) => void;
  readonly _ZN10serde_json5error5Error13io_error_kind17hffa7a17c914c628eE: (a: number) => number;
  readonly _ZN10serde_json3map5Entry3key17hc86c29c99c00aeafE: (a: number) => number;
  readonly _ZN10serde_json3map5Entry9or_insert17h3ec832b310f98ffaE: (a: number, b: number) => number;
  readonly _ZN10serde_json3ser20key_must_be_a_string17h8d5fb3849256f300E: () => number;
  readonly _ZN10serde_json3ser24float_key_must_be_finite17hef88c42f4a0915f6E: () => number;
  readonly _ZN10serde_json5value5Value7pointer17he3bcb6dc1233dd8cE: (a: number, b: number, c: number) => number;
  readonly _ZN10serde_json5value5Value11pointer_mut17h5e4a7238b860806fE: (a: number, b: number, c: number) => number;
  readonly _ZN10serde_json6number6Number8from_f6417hf9ae68aa36117e9bE: (a: number, b: number) => void;
  readonly _ZN10serde_json4read22decode_four_hex_digits17h070f574f86c1b9ebE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN10serde_json5value3ser20key_must_be_a_string17h302adfa603bc9e43E: () => number;
  readonly _ZN6memchr4arch3all6memchr3One4iter17h22f25cd9c0f7621cE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6memchr4arch3all6memchr3Two4iter17h816498a11e4a2ed3E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6memchr4arch3all6memchr5Three4iter17h8070cbbbcc247ac3E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6memchr4arch3all9rabinkarp12is_equal_raw17ha66a70fb28e09c79E: (a: number, b: number, c: number) => number;
  readonly _ZN6memchr4arch3all6twoway5Shift7reverse17h81f1b55d9f912d16E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN6memchr4arch3all6twoway6Suffix7reverse17ha3197bdb016779b3E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN6memchr6memmem8searcher23prefilter_kind_fallback17had94fd6073152bc6E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN5serde6format3Buf6as_str17h6b330576f57db871E: (a: number, b: number) => void;
  readonly _ZN5serde9__private2de7content7Content6as_str17hc52680d64612c569E: (a: number, b: number) => void;
  readonly _ZN5serde9__private2de19flat_map_take_entry17h6a792fa746602c87E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN5serde9__private6string15from_utf8_lossy17h51a1989249cfd146E: (a: number, b: number, c: number) => void;
  readonly _ZN3std9panicking12default_hook17h992b603d1a90e5d2E: (a: number) => void;
  readonly _ZN8dlmalloc8dlmalloc5Chunk11plus_offset17h260ce02c97d95d0eE: (a: number, b: number) => number;
  readonly _ZN8dlmalloc8dlmalloc5Chunk12minus_offset17h7478f9a4e9fa39f8E: (a: number, b: number) => number;
  readonly _ZN8dlmalloc8dlmalloc5Chunk20set_free_with_pinuse17h2b4cfbf97dd507e3E: (a: number, b: number, c: number) => void;
  readonly _ZN8dlmalloc8dlmalloc5Chunk33set_size_and_pinuse_of_free_chunk17haeaf480b0e264b76E: (a: number, b: number) => void;
  readonly _ZN8dlmalloc8dlmalloc5Chunk8from_mem17h00d8c7428492c9b7E: (a: number) => number;
  readonly _ZN8dlmalloc8dlmalloc7Segment3top17h58113290d60d3233E: (a: number) => number;
  readonly _ZN8dlmalloc8dlmalloc5Chunk20set_inuse_and_pinuse17hc6ffc99fdef3c240E: (a: number, b: number) => void;
  readonly _ZN8dlmalloc8dlmalloc5Chunk6to_mem17hc713863128edf4a1E: (a: number) => number;
  readonly _ZN8dlmalloc8dlmalloc7Segment5holds17hfc998ea191f60effE: (a: number, b: number) => number;
  readonly _ZN8dlmalloc8dlmalloc5Chunk9set_inuse17h0a4ea447f8569fa0E: (a: number, b: number) => void;
  readonly _RNvCsihszUHWOIem_7___rustc12___rust_abort: () => void;
  readonly _ZN3std2rt19lang_start_internal17hde9f516dceac42deE: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly _ZN3std6thread6scoped9ScopeData29increment_num_running_threads17heb9d7e2cf02e8c09E: (a: number) => void;
  readonly _ZN3std6thread7current18current_or_unnamed17h84b62ca044ddec0cE: () => number;
  readonly _ZN3std6thread8sleep_ms17h3051878d965b1dd8E: (a: number) => void;
  readonly _ZN3std6thread11sleep_until17h496f60bdfad5ce4bE: (a: bigint, b: number) => void;
  readonly _ZN3std6thread15park_timeout_ms17h046ad4a55f99e9a3E: (a: number) => void;
  readonly _ZN5alloc3ffi5c_str7CString19_from_vec_unchecked17h2afe20e5cc2a8115E: (a: number, b: number) => void;
  readonly _ZN3std6thread6Thread8from_raw17hfecda47cadbf044aE: (a: number) => number;
  readonly _ZN14rustc_demangle12try_demangle17h95ca93a6f780c3a3E: (a: number, b: number, c: number) => void;
  readonly _ZN3std9backtrace9Backtrace13force_capture17h0e54b86d9cd8b758E: (a: number) => void;
  readonly _ZN3std9backtrace9Backtrace6frames17h264e302ef4729671E: (a: number, b: number) => void;
  readonly _ZN3std3env4vars17h2ecd63901d8760c7E: () => void;
  readonly _ZN3std3env7vars_os17hddef6a54decc6e99E: () => void;
  readonly _ZN3std3env8temp_dir17h0cc783081e9f1a7aE: (a: number) => void;
  readonly _ZN3std3ffi6os_str8OsString17into_boxed_os_str17h4544589fbbdbb992E: (a: number, b: number) => void;
  readonly _ZN3std3ffi6os_str5OsStr14into_os_string17h27a2becc6b8ac08cE: (a: number, b: number, c: number) => void;
  readonly _ZN3std3ffi6os_str5OsStr18to_ascii_lowercase17haae1ffa40d6eda1aE: (a: number, b: number, c: number) => void;
  readonly _ZN3std3ffi6os_str5OsStr18to_ascii_uppercase17h81f8df2d61f63d3bE: (a: number, b: number, c: number) => void;
  readonly _ZN3std2fs10DirBuilder7_create17h36fa8c4b7bdedb84E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN3std2io8buffered9bufreader6buffer6Buffer9backshift17h1b70fb889dd6409dE: (a: number) => void;
  readonly _ZN3std2io5stdio5stdin17hdd6bd17434b65087E: () => number;
  readonly _ZN3std2io5stdio5Stdin4lock17ha1b114b245488099E: (a: number) => number;
  readonly _ZN3std2io5stdio5Stdin9read_line17hfbbb007529fa147aE: (a: number, b: number, c: number) => void;
  readonly _ZN3std2io5stdio5Stdin5lines17hb771cd6bf6a1ec3bE: (a: number) => number;
  readonly _ZN3std2io5stdio6stdout17h5a66fc8298998110E: () => number;
  readonly _ZN4core5slice6memchr7memrchr17h763396fe77209727E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN3std2io5stdio6Stderr4lock17h379ed0d3a8f83c94E: (a: number) => number;
  readonly _ZN3std2io5stdio18set_output_capture17h08003b593225b698E: (a: number) => number;
  readonly _ZN3std2io5stdio22try_set_output_capture17h6ee1657e5b793877E: (a: number, b: number) => void;
  readonly _ZN3std2io5stdio23attempt_print_to_stderr17h2ac3bb4c2ab74529E: (a: number) => void;
  readonly _ZN3std5panic12always_abort17h51a5d829fc22e895E: () => void;
  readonly _ZN3std5panic19set_backtrace_style17hcf55a2ae1f2180caE: (a: number) => void;
  readonly _ZN3std5panic19get_backtrace_style17h7df841cd08bde88dE: () => number;
  readonly _ZN3std4path10Components7as_path17h77a88b46a6d2390aE: (a: number, b: number) => void;
  readonly _ZN3std4path18compare_components17h5bd191def22f608fE: (a: number, b: number) => number;
  readonly _ZN3std4path7PathBuf5_push17hc7246741efa5fa5aE: (a: number, b: number, c: number) => void;
  readonly _ZN3std4path7PathBuf3pop17h3a76b11db9dfebbaE: (a: number) => number;
  readonly _ZN3std3sys6os_str5bytes5Slice21check_public_boundary9slow_path17h5ffba61afb7f7531E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN3std4path7PathBuf14_set_file_name17hcc9aa7b372a3d7e7E: (a: number, b: number, c: number) => void;
  readonly _ZN3std4path7PathBuf14_set_extension17h0b23cea0e6523012E: (a: number, b: number, c: number) => number;
  readonly _ZN3std4path7PathBuf14_add_extension17h0d08a1b6df6fac94E: (a: number, b: number, c: number) => number;
  readonly _ZN3std4path4Path11to_path_buf17h45c4e599c6a9ec66E: (a: number, b: number, c: number) => void;
  readonly _ZN3std4path4Path11is_absolute17h608ecda0c97d4669E: (a: number, b: number) => number;
  readonly _ZN3std4path4Path6parent17h22cd2b30d3b774ddE: (a: number, b: number, c: number) => void;
  readonly _ZN3std4path4Path9file_name17h7a6b51c9db36ed27E: (a: number, b: number, c: number) => void;
  readonly _ZN3std4path4Path13_strip_prefix17hf8e7a0e9c1b8b7d4E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN3std4path4Path12_starts_with17hf2bffaeff767c564E: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN3std4path4Path10_ends_with17h798509a0101d4f3fE: (a: number, b: number, c: number, d: number) => number;
  readonly _ZN3std4path4Path9file_stem17hd1c36b8c4f4b2094E: (a: number, b: number, c: number) => void;
  readonly _ZN3std4path4Path11file_prefix17hc5e5f63678750654E: (a: number, b: number, c: number) => void;
  readonly _ZN3std4path4Path5_join17haf6acafda88954deE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN3std4path4Path15_with_file_name17hfd192f1f0588f98dE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN3std4path4Path15_with_extension17h4ad564df4285882bE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN3std4path4Path10components17hf856811759968461E: (a: number, b: number, c: number) => void;
  readonly _ZN3std4path4Path19normalize_lexically17h6d0db63dee065055E: (a: number, b: number, c: number) => void;
  readonly _ZN3std4path4Path10is_symlink17h77fcadecfc5b3582E: (a: number, b: number) => number;
  readonly _ZN3std7process7Command9env_clear17h16e7c0f07a78dd97E: (a: number) => number;
  readonly _ZN3std7process7Command11get_program17h9c0abbb0e3944fedE: (a: number, b: number) => void;
  readonly _ZN3std7process7Command8get_args17h685ca4bb2faaa16dE: (a: number, b: number) => void;
  readonly _ZN3std7process7Command15get_current_dir17h7341f81c4c7f49efE: (a: number, b: number) => void;
  readonly _ZN3std7process8ExitCode12exit_process17hc25718bff357f146E: (a: number) => void;
  readonly _ZN3std7process4exit17h60dd79245b625a24E: (a: number) => void;
  readonly _ZN3std7process2id17h5274363bb9f1b299E: () => number;
  readonly _ZN3std4sync6poison4once4Once4wait17h5f8a36f33cc0c527E: (a: number) => void;
  readonly _ZN3std4sync6poison4once4Once10wait_force17h4682147575e9a78aE: (a: number) => void;
  readonly _ZN3std4sync7barrier7Barrier4wait17h5d0b1998d6293497E: (a: number) => number;
  readonly _ZN3std4sync9lazy_lock14panic_poisoned17h70c8f1d922bf9b76E: () => void;
  readonly _ZN3std4time7Instant14duration_since17he9bbf30d122b8f2dE: (a: number, b: number, c: bigint, d: number) => void;
  readonly _ZN3std4time7Instant22checked_duration_since17h8e7fb3a94554d3b1E: (a: number, b: number, c: bigint, d: number) => void;
  readonly _ZN3std4time7Instant7elapsed17h2b0210b981c8cfceE: (a: number, b: number) => void;
  readonly _ZN3std4time10SystemTime3now17h18a65f8f234a4718E: (a: number) => void;
  readonly _ZN3std4time10SystemTime7elapsed17h5643019de03cc6cdE: (a: number, b: number) => void;
  readonly _ZN3std4time10SystemTime11checked_add17h287adfa2f64056b6E: (a: number, b: number, c: bigint, d: number) => void;
  readonly _ZN3std4time10SystemTime11checked_sub17h201ea8fd97c98875E: (a: number, b: number, c: bigint, d: number) => void;
  readonly _ZN3std3sys9backtrace4lock17h9f431b15c318988eE: () => number;
  readonly _ZN3std3sys9backtrace26__rust_end_short_backtrace17h16599ba74d37abf9E: (a: number) => void;
  readonly _ZN3std3sys9backtrace26__rust_end_short_backtrace17hbc4dbca3a5d02012E: (a: number) => void;
  readonly _ZN3std3sys2fs6rename17h201be32cbfa9bba1E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN3std3sys2fs10remove_dir17h1c01f260f8380169E: (a: number, b: number, c: number) => void;
  readonly _ZN3std3sys2fs15set_permissions17h2228f008588183dcE: (a: number, b: number, c: number) => void;
  readonly _ZN3std3sys2fs12canonicalize17h6b97ac0e1fe79425E: (a: number, b: number, c: number) => void;
  readonly _ZN3std3sys7process3env10CommandEnv3set17h88bbe9a4c71affeeE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN3std3sys7process3env10CommandEnv6remove17h737e767f4935dacfE: (a: number, b: number, c: number) => void;
  readonly _ZN3std10sys_common4wtf87Wtf8Buf25push_code_point_unchecked17hb9739e1473215e1eE: (a: number, b: number) => void;
  readonly _ZN3std10sys_common4wtf816slice_error_fail17h30c89af0c16b2d81E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN3std5alloc20set_alloc_error_hook17h510131ed6901009cE: (a: number) => void;
  readonly _ZN3std5alloc21take_alloc_error_hook17hb11be0e978f937c9E: () => number;
  readonly _RNvCsihszUHWOIem_7___rustc11___rdl_alloc: (a: number, b: number) => number;
  readonly _RNvCsihszUHWOIem_7___rustc13___rdl_dealloc: (a: number, b: number, c: number) => void;
  readonly _RNvCsihszUHWOIem_7___rustc13___rdl_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly _RNvCsihszUHWOIem_7___rustc18___rdl_alloc_zeroed: (a: number, b: number) => number;
  readonly _ZN3std3sys4sync6rwlock5futex6RwLock15write_contended17h4152feed2acdf368E: (a: number) => void;
  readonly _ZN3std3sys4sync6rwlock5futex6RwLock22wake_writer_or_readers17hcdb9c6c30d19e116E: (a: number, b: number) => void;
  readonly _ZN3std9panicking9take_hook17heed9074fc75ff950E: (a: number) => void;
  readonly _ZN3std9panicking14payload_as_str17h54b35bc96a4e5ccbE: (a: number, b: number, c: number) => void;
  readonly _ZN3std9panicking11panic_count8increase17h9dcc42776c7f8274E: (a: number) => number;
  readonly _ZN3std9panicking11panic_count19finished_panic_hook17h6880f37f0d6939bbE: () => void;
  readonly _ZN3std9panicking11panic_count8decrease17h2cacaf7e4a8ae246E: () => void;
  readonly _ZN3std9panicking11panic_count9get_count17h6435fc4a67399633E: () => number;
  readonly _ZN3std9panicking12catch_unwind7cleanup17h44a1b04f97d483ffE: (a: number, b: number) => void;
  readonly _RNvCsihszUHWOIem_7___rustc17rust_begin_unwind: (a: number) => void;
  readonly _ZN3std9panicking15panic_with_hook17h67c8bd6c7b3fa9eeE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN3std3sys4sync6rwlock5futex6RwLock14read_contended17hc4ed977bf6dde8fcE: (a: number) => void;
  readonly _RNvCsihszUHWOIem_7___rustc10rust_panic: (a: number, b: number) => void;
  readonly _ZN3std3sys3pal4wasm2os11split_paths17hc6ad7bc23c2456d3E: (a: number, b: number) => void;
  readonly _ZN3std3sys3pal4wasm5futex14futex_wake_all17hf617ffb66ba6426aE: (a: number) => void;
  readonly _ZN3std3sys5alloc4wasm4lock4lock17h7c3026534fadb7b1E: () => void;
  readonly _ZN3std3sys3net10connection11unsupported11TcpListener4bind17he63ffe93f6680a31E: (a: number, b: number) => void;
  readonly _ZN3std3sys4path4unix8absolute17h3d327d0e6cc2ea31E: (a: number, b: number, c: number) => void;
  readonly _ZN3std3sys7process11unsupported7Command3new17h916506d023ea042bE: (a: number, b: number, c: number) => void;
  readonly _ZN3std3sys7process11unsupported7Command3arg17h09a63633c4299026E: (a: number, b: number, c: number) => void;
  readonly _ZN3std3sys7process11unsupported7Command3cwd17he54535738905b153E: (a: number, b: number, c: number) => void;
  readonly _ZN3std5alloc8rust_oom17h5cdefc33f08a64ccE: (a: number, b: number) => void;
  readonly _ZN3std4path4Path13into_path_buf17h3641c297568c7b14E: (a: number, b: number, c: number) => void;
  readonly _ZN3std2io5stdio6Stdout4lock17h469733df1b099254E: (a: number) => number;
  readonly _ZN3std4path4Path7is_file17hd721d9eaf74c0129E: (a: number, b: number) => number;
  readonly _ZN3std4path4Path6is_dir17h7883c13c2cd2935dE: (a: number, b: number) => number;
  readonly _ZN3std4time7Instant11checked_sub17h62ca8338d8def98dE: (a: number, b: number, c: bigint, d: number) => void;
  readonly _ZN3std3sys2fs11remove_file17h8f23c8dee80fc34cE: (a: number, b: number, c: number) => void;
  readonly _ZN3std3sys2fs8metadata17h4f8a4dccadbb1802E: (a: number, b: number, c: number) => void;
  readonly _ZN3std3sys2fs16symlink_metadata17h1aca0b17225885daE: (a: number, b: number, c: number) => void;
  readonly _ZN3std4time7Instant25saturating_duration_since17h28461ec4444f76d4E: (a: number, b: number, c: bigint, d: number) => void;
  readonly _ZN3std9panicking11panic_count16set_always_abort17hb6e962ad78573aa7E: () => void;
  readonly _RNvCsihszUHWOIem_7___rustc17___rust_drop_panic: () => void;
  readonly _RNvCsihszUHWOIem_7___rustc24___rust_foreign_exception: () => void;
  readonly rust_eh_personality: () => void;
  readonly _ZN3std3sys3net10connection11unsupported9TcpStream7connect17h561f6b3af949be20E: (a: number, b: number) => void;
  readonly _ZN3std3sys3net10connection11unsupported9UdpSocket4bind17hc31d4145a5e5febdE: (a: number, b: number) => void;
  readonly _ZN3std3sys2fs9read_link17h91c368366d3b7c1bE: (a: number, b: number, c: number) => void;
  readonly _ZN3std3sys2fs7symlink17h93e0c67a039fe8deE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN3std3sys2fs9hard_link17hea354853e5ab4fefE: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN8dlmalloc8dlmalloc5Chunk4next17hdbac6e8647f4aa4dE: (a: number) => number;
  readonly _ZN8dlmalloc8dlmalloc5Chunk4prev17h0f9351e18a7aa116E: (a: number) => number;
  readonly _ZN14rustc_demangle8demangle17ha605161f74989c33E: (a: number, b: number, c: number) => void;
  readonly _ZN4core3str6traits23str_index_overflow_fail17h061ffb5fce85a7d4E: (a: number) => void;
  readonly _ZN5alloc5alloc18handle_alloc_error8ct_error17h9b012661526bf750E: (a: number, b: number) => void;
  readonly _RNvCsihszUHWOIem_7___rustc9___rdl_oom: (a: number, b: number) => void;
  readonly _ZN4core9panicking18panic_nounwind_fmt17h6cc96e40ce945d69E: (a: number, b: number, c: number) => void;
  readonly _ZN5alloc3ffi5c_str19FromVecWithNulError8as_bytes17hd105300075980d36E: (a: number, b: number) => void;
  readonly _ZN5alloc3ffi5c_str7CString18from_vec_unchecked17h28e67d6a8805c018E: (a: number, b: number) => void;
  readonly _ZN5alloc3ffi5c_str7CString8from_raw17h83d5f5d8f971acb1E: (a: number, b: number) => void;
  readonly _ZN5alloc3ffi5c_str7CString11into_string17h2c4e3e78f521672fE: (a: number, b: number, c: number) => void;
  readonly _ZN5alloc3ffi5c_str7CString10into_bytes17h45ee3a987bb38462E: (a: number, b: number, c: number) => void;
  readonly _ZN5alloc3ffi5c_str7CString19into_bytes_with_nul17h58fe68e9c7e96f54E: (a: number, b: number, c: number) => void;
  readonly _ZN5alloc3ffi5c_str7CString27from_vec_with_nul_unchecked17h0c156c3ed53cea4bE: (a: number, b: number) => void;
  readonly _ZN5alloc3ffi5c_str7CString17from_vec_with_nul17h0b758c7a3cc43e14E: (a: number, b: number) => void;
  readonly _ZN5alloc2rc32rc_inner_layout_for_value_layout17h0c45bbe481cfb46bE: (a: number, b: number, c: number) => void;
  readonly _ZN4core7unicode12unicode_data14case_ignorable6lookup17hc4af9f54d06bd8d6E: (a: number) => number;
  readonly _ZN4core7unicode12unicode_data5cased6lookup17hb47fbdd0854cd4d2E: (a: number) => number;
  readonly _ZN4core7unicode12unicode_data11conversions8to_upper17he0038022d57b3316E: (a: number, b: number) => void;
  readonly _ZN5alloc6string6String21from_utf8_lossy_owned17hf6415207f8b788daE: (a: number, b: number) => void;
  readonly _ZN5alloc6string6String10from_utf1617h784c6e52bcf2e025E: (a: number, b: number, c: number) => void;
  readonly _ZN5alloc6string6String12from_utf16le17hf4606f40a801e2a9E: (a: number, b: number, c: number) => void;
  readonly _ZN5alloc6string6String18from_utf16le_lossy17h41e340d615196fb0E: (a: number, b: number, c: number) => void;
  readonly _ZN5alloc6string6String12from_utf16be17h3bed736eb3cfd6e5E: (a: number, b: number, c: number) => void;
  readonly _ZN5alloc6string6String18from_utf16be_lossy17h44be668108563682E: (a: number, b: number, c: number) => void;
  readonly _ZN5alloc6string6String17try_reserve_exact17h2099dd4422df0f72E: (a: number, b: number, c: number) => void;
  readonly _ZN5alloc6string13FromUtf8Error8as_bytes17hd1a4094e38e63319E: (a: number, b: number) => void;
  readonly _ZN5alloc6string13FromUtf8Error15into_utf8_lossy17h1bac4962a11c5c17E: (a: number, b: number) => void;
  readonly _ZN5alloc6string5Drain6as_str17h534333174de5a944E: (a: number, b: number) => void;
  readonly _ZN5alloc3ffi5c_str7CString16into_boxed_c_str17h65fe0f83a13ab302E: (a: number, b: number, c: number) => void;
  readonly _ZN4core3num7dec2flt11decimal_seq10DecimalSeq4trim17he8127ee8e6b097e7E: (a: number) => void;
  readonly _ZN4core3num7dec2flt11decimal_seq10DecimalSeq5round17h034523f03222289eE: (a: number) => bigint;
  readonly _ZN4core3num7dec2flt11decimal_seq10DecimalSeq10left_shift17hcc4fc184b2cdbbc9E: (a: number, b: number) => void;
  readonly _ZN4core3num7dec2flt11decimal_seq10DecimalSeq11right_shift17hb50f6b0d3a2cdbb4E: (a: number, b: number) => void;
  readonly _ZN4core3num7dec2flt11decimal_seq17parse_decimal_seq17h27db4c3adbc072deE: (a: number, b: number, c: number) => void;
  readonly _ZN4core3num7dec2flt6lemire22compute_product_approx17h05d593d527470d99E: (a: number, b: bigint, c: bigint, d: number) => void;
  readonly _ZN4core3num7dec2flt5parse12parse_number17hefdcdf5ed4be52b6E: (a: number, b: number, c: number) => void;
  readonly _ZN4core3num9diy_float2Fp3mul17h10ce0626ae7ddc11E: (a: number, b: bigint, c: number, d: bigint, e: number) => void;
  readonly _ZN4core3num9diy_float2Fp9normalize17h392e94f3151446feE: (a: number, b: bigint, c: number) => void;
  readonly _ZN4core3num9diy_float2Fp12normalize_to17h5c0b241c3c392febE: (a: number, b: bigint, c: number, d: number) => void;
  readonly _ZN4core3num7flt2dec9estimator23estimate_scaling_factor17h46611c29c7535d44E: (a: bigint, b: number) => number;
  readonly _ZN4core3num7flt2dec8strategy6dragon9mul_pow1017ha2852af84ac6c981E: (a: number, b: number) => number;
  readonly _ZN4core3num6bignum8Big32x408mul_pow217h1e1a4e76b43fbd7bE: (a: number, b: number) => number;
  readonly _ZN4core3num7flt2dec8strategy6dragon15format_shortest17hbe8f67d595ba335eE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN4core3num7flt2dec8strategy6dragon12format_exact17h9c1fe7f3be1c8253E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN4core3num7flt2dec8strategy5grisu12cached_power17h030d9e873b02f7f6E: (a: number, b: number, c: number) => void;
  readonly _ZN4core3num7flt2dec8strategy5grisu19format_shortest_opt17ha25ba4147ec7947cE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN4core3num7flt2dec8strategy5grisu15format_shortest17h71acf65e2e21b23aE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN4core3num7flt2dec8strategy5grisu16format_exact_opt17hd2008b8e869415f4E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN4core3num7flt2dec8strategy5grisu12format_exact17h8bc92cdbf71c5b59E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN4core3num7flt2dec8round_up17h6cef3090bbc49106E: (a: number, b: number, c: number) => void;
  readonly _ZN4core3num7flt2dec17digits_to_dec_str17h75100ff6ba8fdba1E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly _ZN4core3num7flt2dec17digits_to_exp_str17hbfd4db94d75c8cc4E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
  readonly _ZN4core3num3fmt4Part5write17had26616261a324b0E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN4core3num3fmt9Formatted3len17h8161c88fb996c010E: (a: number) => number;
  readonly _ZN4core3num3fmt9Formatted5write17hf0558c5879fa1315E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN4core3num8int_sqrt27panic_for_negative_argument17h279db528adf23969E: (a: number) => void;
  readonly _ZN4core3num14overflow_panic3add17h02429f699498a5a1E: (a: number) => void;
  readonly _ZN4core3num14overflow_panic3sub17h3ff280d45a0ce5c6E: (a: number) => void;
  readonly _ZN4core3num14overflow_panic3mul17hfe28a79f05aae4e5E: (a: number) => void;
  readonly _ZN4core3num14overflow_panic3div17hdf1bd204e231e4fcE: (a: number) => void;
  readonly _ZN4core3num14overflow_panic3rem17h66e2332184b1b203E: (a: number) => void;
  readonly _ZN4core3num14overflow_panic3neg17hf77c9ca99a45cf7bE: (a: number) => void;
  readonly _ZN4core3num14overflow_panic3shr17h3d7553636f9003caE: (a: number) => void;
  readonly _ZN4core3num14overflow_panic3shl17hda08226969630f2eE: (a: number) => void;
  readonly _ZN4core3num22from_ascii_radix_panic17h9655dd6e1a6bfc8cE: (a: number, b: number) => void;
  readonly _ZN4core3num22from_ascii_radix_panic8do_panic7runtime17h465929c3a7372d3fE: (a: number, b: number) => void;
  readonly _ZN4core3fmt9Formatter12pad_integral17hd2c09e900454fc43E: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly _ZN4core4cell4lazy14panic_poisoned17hef05ebb9c6bc904fE: () => void;
  readonly _ZN4core4cell22panic_already_borrowed8do_panic7runtime17h0ea7b8c6033d7d94E: (a: number) => void;
  readonly _ZN4core4cell30panic_already_mutably_borrowed8do_panic7runtime17h11ec2ea0dcf5d84eE: (a: number) => void;
  readonly _ZN4core3ffi5c_str4CStr20from_bytes_until_nul17hf1fead23abcd6af3E: (a: number, b: number, c: number) => void;
  readonly _ZN4core3ffi5c_str4CStr19from_bytes_with_nul17hee3b684f189a9480E: (a: number, b: number, c: number) => void;
  readonly _ZN4core3ffi5c_str4CStr6to_str17h305b7696ef7728f4E: (a: number, b: number, c: number) => void;
  readonly _ZN4core9panicking14panic_nounwind17ha2f6cf863949945dE: (a: number, b: number) => void;
  readonly _ZN4core9panicking26panic_nounwind_nobacktrace17h541ce3811325e63fE: (a: number, b: number) => void;
  readonly _ZN4core9panicking36panic_misaligned_pointer_dereference17h6f2d29303428650fE: (a: number, b: number, c: number) => void;
  readonly _ZN4core9panicking30panic_null_pointer_dereference17h0bfddbbb4f6b83d3E: (a: number) => void;
  readonly _ZN4core9panicking31panic_invalid_enum_construction17h6c9934c5ba4ab05dE: (a: bigint, b: bigint, c: number) => void;
  readonly _ZN4core9panicking19panic_cannot_unwind17h7eb886a02454738eE: () => void;
  readonly _ZN4core9panicking16panic_in_cleanup17h84ddd47349a6fcc5E: () => void;
  readonly _ZN4core9panicking15const_panic_fmt17hd09e5692482440aaE: (a: number) => void;
  readonly _ZN4core3fmt8builders10PadAdapter4wrap17h59606281ed5765eeE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN4core3fmt8builders10DebugTuple21finish_non_exhaustive17haf4de6dbf2954d29E: (a: number) => number;
  readonly _ZN4core3fmt8builders8DebugSet21finish_non_exhaustive17h4d17ffdf167c5c3bE: (a: number) => number;
  readonly _ZN4core3fmt8builders9DebugList21finish_non_exhaustive17h46fe2f42044a53efE: (a: number) => number;
  readonly _ZN4core3fmt8builders8DebugMap3key17ha7daed5b54e457c0E: (a: number, b: number, c: number) => number;
  readonly _ZN4core3fmt8builders8DebugMap5value17hc0a7be13bc8473edE: (a: number, b: number, c: number) => number;
  readonly _ZN4core3fmt8builders8DebugMap21finish_non_exhaustive17h35d24fe55fc10198E: (a: number) => number;
  readonly _ZN4core3fmt3num19slice_buffer_to_str17h205e663527684231E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN4core3fmt17FormattingOptions8get_fill17h3a57853f27f102c3E: (a: number) => number;
  readonly _ZN4core3fmt9Formatter4fill17h5c017d540b2b4970E: (a: number) => number;
  readonly _ZN4core3fmt9Formatter25debug_tuple_field4_finish17h1c4f68f33c57e9d0E: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number) => number;
  readonly _ZN4core3fmt9Formatter25debug_tuple_fields_finish17hd2d8a2235adf091fE: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly _ZN4core5slice5index26slice_start_index_len_fail8do_panic7runtime17h91b31580085af38fE: (a: number, b: number, c: number) => void;
  readonly _ZN4core5slice5index24slice_end_index_len_fail8do_panic7runtime17h54be4091b17afb98E: (a: number, b: number, c: number) => void;
  readonly _ZN4core5slice5index22slice_index_order_fail8do_panic7runtime17h8c295dfef115f366E: (a: number, b: number, c: number) => void;
  readonly _ZN4core5slice5index31slice_start_index_overflow_fail17h0f079d18f03b4b96E: (a: number) => void;
  readonly _ZN4core5slice5index10into_range17he9f49a291c537965E: (a: number, b: number, c: number) => void;
  readonly _ZN4core5slice5index16into_slice_range17h9657c2fcfb98c4d4E: (a: number, b: number, c: number) => void;
  readonly _ZN4core3str8converts13from_utf8_mut17h842b25d8dcf7eeb3E: (a: number, b: number, c: number) => void;
  readonly _ZN4core3str19slice_error_fail_rt17h2016a2c8fb2c2a73E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN4core3str19slice_error_fail_ct17hb8fe7739699064a9E: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly _ZN4core3num6bignum8Big32x408from_u6417he8d9352468befe28E: (a: number, b: bigint) => void;
  readonly _ZN4core3num6bignum8Big32x406digits17h439e100a29e69b1bE: (a: number, b: number) => void;
  readonly _ZN4core3num6bignum8Big32x407get_bit17h649e57c3b54edd93E: (a: number, b: number) => number;
  readonly _ZN4core3num6bignum8Big32x407is_zero17h5ee65df3324a1786E: (a: number) => number;
  readonly _ZN4core3num6bignum8Big32x4010bit_length17h1220fc2b25bb4321E: (a: number) => number;
  readonly _ZN4core3num6bignum8Big32x403add17h943ad6a4b6478821E: (a: number, b: number) => number;
  readonly _ZN4core3num6bignum8Big32x409add_small17he4c8f91cc741e2e5E: (a: number, b: number) => number;
  readonly _ZN4core3num6bignum8Big32x403sub17h1899eaa4c835faf3E: (a: number, b: number) => number;
  readonly _ZN4core3num6bignum8Big32x409mul_small17hc9d4a3a06b7b01b9E: (a: number, b: number) => number;
  readonly _ZN4core3num6bignum8Big32x408mul_pow517h8543ec293e5d60e7E: (a: number, b: number) => number;
  readonly _ZN4core3num6bignum8Big32x4010mul_digits17h74ae8507a9405643E: (a: number, b: number, c: number) => number;
  readonly _ZN4core3num6bignum8Big32x4013div_rem_small17h8d1a0dcfed4eb525E: (a: number, b: number, c: number) => void;
  readonly _ZN4core3num6bignum8Big32x407div_rem17h331340579868ac54E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN4core3num6bignum5tests6Big8x38from_u6417hd8ebd23ea9a717bfE: (a: number, b: bigint) => void;
  readonly _ZN4core3num6bignum5tests6Big8x36digits17hc934adfb356b4affE: (a: number, b: number) => void;
  readonly _ZN4core3num6bignum5tests6Big8x37get_bit17hb1c83df69cd2c159E: (a: number, b: number) => number;
  readonly _ZN4core3num6bignum5tests6Big8x37is_zero17hbd53b7f665a1f5c5E: (a: number) => number;
  readonly _ZN4core3num6bignum5tests6Big8x310bit_length17hf4057adf4e9c95caE: (a: number) => number;
  readonly _ZN4core3num6bignum5tests6Big8x33add17h66ede8aa870f6ee1E: (a: number, b: number) => number;
  readonly _ZN4core3num6bignum5tests6Big8x39add_small17hef862da904b3f513E: (a: number, b: number) => number;
  readonly _ZN4core3num6bignum5tests6Big8x33sub17h46355d9554b0e5dfE: (a: number, b: number) => number;
  readonly _ZN4core3num6bignum5tests6Big8x39mul_small17h0ebdeb6325d78c6fE: (a: number, b: number) => number;
  readonly _ZN4core3num6bignum5tests6Big8x38mul_pow217hc2bfe99763af287bE: (a: number, b: number) => number;
  readonly _ZN4core3num6bignum5tests6Big8x38mul_pow517h0f898b3701f5c642E: (a: number, b: number) => number;
  readonly _ZN4core3num6bignum5tests6Big8x310mul_digits17h526dd5de2dca6fcbE: (a: number, b: number, c: number) => number;
  readonly _ZN4core3num6bignum5tests6Big8x313div_rem_small17h3acbef63c1279a8fE: (a: number, b: number, c: number) => void;
  readonly _ZN4core3num6bignum5tests6Big8x37div_rem17h8fe020d789813827E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN4core10intrinsics3mir11PtrMetadata19panic_cold_explicit17hd0f36c68791b8d80E: (a: number) => void;
  readonly _ZN4core4char7methods15encode_utf8_raw8do_panic7runtime17h604a683c28506845E: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN4core4char7methods16encode_utf16_raw8do_panic7runtime17hde5b474ca6c13a3dE: (a: number, b: number, c: number, d: number) => void;
  readonly _ZN4core9panicking11panic_const24panic_const_add_overflow17h4b68cbd6e1153f17E: (a: number) => void;
  readonly _ZN4core9panicking11panic_const24panic_const_sub_overflow17h5cc8b537ad92574bE: (a: number) => void;
  readonly _ZN4core9panicking11panic_const24panic_const_mul_overflow17h42360e00fc6b6804E: (a: number) => void;
  readonly _ZN4core9panicking11panic_const24panic_const_neg_overflow17h6d7c5e0072bfda08E: (a: number) => void;
  readonly _ZN4core9panicking11panic_const24panic_const_shr_overflow17h040793e2fb313c67E: (a: number) => void;
  readonly _ZN4core9panicking11panic_const24panic_const_shl_overflow17h89d357b039a541e8E: (a: number) => void;
  readonly _ZN4core9panicking11panic_const29panic_const_coroutine_resumed17h8fba4ae43fb829ddE: (a: number) => void;
  readonly _ZN4core9panicking11panic_const32panic_const_async_gen_fn_resumed17hc5b75ff85b5d722bE: (a: number) => void;
  readonly _ZN4core9panicking11panic_const23panic_const_gen_fn_none17h1768b04e023f7f73E: (a: number) => void;
  readonly _ZN4core9panicking11panic_const35panic_const_coroutine_resumed_panic17h0ddbacc29855af2fE: (a: number) => void;
  readonly _ZN4core9panicking11panic_const34panic_const_async_fn_resumed_panic17h7313a94d007c26daE: (a: number) => void;
  readonly _ZN4core9panicking11panic_const38panic_const_async_gen_fn_resumed_panic17h9f231a8163947a4bE: (a: number) => void;
  readonly _ZN4core9panicking11panic_const29panic_const_gen_fn_none_panic17hfcf213e586aa65cfE: (a: number) => void;
  readonly _ZN4core9panicking11panic_const34panic_const_coroutine_resumed_drop17hfb44f12fb333d11eE: (a: number) => void;
  readonly _ZN4core9panicking11panic_const33panic_const_async_fn_resumed_drop17ha4e9b4fe2b972011E: (a: number) => void;
  readonly _ZN4core9panicking11panic_const37panic_const_async_gen_fn_resumed_drop17h4e696f57159d2cd9E: (a: number) => void;
  readonly _ZN4core9panicking11panic_const28panic_const_gen_fn_none_drop17hb1d0aa9bbabcdf4fE: (a: number) => void;
  readonly _ZN4core7unicode12unicode_data9lowercase6lookup17ha7dd40b41cfda729E: (a: number) => number;
  readonly _ZN4core7unicode12unicode_data9uppercase6lookup17ha52521afc7ac15f7E: (a: number) => number;
  readonly _ZN4core10intrinsics3mir17UnwindUnreachable19panic_cold_explicit17h7d612b5d58bff500E: (a: number) => void;
  readonly _ZN4core10intrinsics3mir15UnwindTerminate19panic_cold_explicit17he564ea0a633814c6E: (a: number) => void;
  readonly _ZN4core10intrinsics3mir14UnwindContinue19panic_cold_explicit17hef65dd0487753c22E: (a: number) => void;
  readonly _ZN4core10intrinsics3mir8ReturnTo19panic_cold_explicit17hafb350228624b7f4E: (a: number) => void;
  readonly _ZN4core10intrinsics3mir6Return19panic_cold_explicit17hddeb868d66b46323E: (a: number) => void;
  readonly _ZN4core10intrinsics3mir4Goto19panic_cold_explicit17hb68c7fee3b711833E: (a: number) => void;
  readonly _ZN4core10intrinsics3mir13UnwindCleanup19panic_cold_explicit17h0a46a989e2968fb9E: (a: number) => void;
  readonly _ZN4core10intrinsics3mir4Drop19panic_cold_explicit17hf951d266c1bc503aE: (a: number) => void;
  readonly _ZN4core10intrinsics3mir4Call19panic_cold_explicit17hce12728d5d490a06E: (a: number) => void;
  readonly _ZN4core10intrinsics3mir8TailCall19panic_cold_explicit17h61c6aa73e22c0de7E: (a: number) => void;
  readonly _ZN4core10intrinsics3mir12UnwindResume19panic_cold_explicit17h265ea0334823187eE: (a: number) => void;
  readonly _ZN4core10intrinsics3mir11Unreachable19panic_cold_explicit17h817196ca1f314c11E: (a: number) => void;
  readonly _ZN4core10intrinsics3mir11StorageLive19panic_cold_explicit17h101acb4a3c48f991E: (a: number) => void;
  readonly _ZN4core10intrinsics3mir6Assume19panic_cold_explicit17ha4c0a3ef7d0ab638E: (a: number) => void;
  readonly _ZN4core10intrinsics3mir6Deinit19panic_cold_explicit17h8821a6d6a113e18eE: (a: number) => void;
  readonly _ZN4core10intrinsics3mir7Checked19panic_cold_explicit17haadadb8f67f34a65E: (a: number) => void;
  readonly _ZN4core10intrinsics3mir3Len19panic_cold_explicit17h6a20705bd2b12232E: (a: number) => void;
  readonly _ZN4core10intrinsics3mir11StorageDead19panic_cold_explicit17h4f03ad580db4cbd9E: (a: number) => void;
  readonly _ZN4core10intrinsics3mir12CopyForDeref19panic_cold_explicit17h12340271ced3f730E: (a: number) => void;
  readonly _ZN4core10intrinsics3mir5Retag19panic_cold_explicit17h0e30842f8cfc2ae6E: (a: number) => void;
  readonly _ZN4core10intrinsics3mir4Move19panic_cold_explicit17h5326dc951f498992E: (a: number) => void;
  readonly _ZN4core10intrinsics3mir6Static19panic_cold_explicit17h63a7d89e4889243bE: (a: number) => void;
  readonly _ZN4core10intrinsics3mir9StaticMut19panic_cold_explicit17hf3bd458cc1f0ce39E: (a: number) => void;
  readonly _ZN4core10intrinsics3mir12Discriminant19panic_cold_explicit17h0387759acb66b2c4E: (a: number) => void;
  readonly _ZN4core10intrinsics3mir15SetDiscriminant19panic_cold_explicit17h05d710644e134288E: (a: number) => void;
  readonly _ZN4core10intrinsics3mir6Offset19panic_cold_explicit17h75126e8013850b92E: (a: number) => void;
  readonly _ZN4core10intrinsics3mir5Field19panic_cold_explicit17h03cdfac3f512b3cbE: (a: number) => void;
  readonly _ZN4core10intrinsics3mir7Variant19panic_cold_explicit17h3dd3f5c158c7fe27E: (a: number) => void;
  readonly _ZN4core10intrinsics3mir13CastTransmute19panic_cold_explicit17hbba41c5a597517eaE: (a: number) => void;
  readonly _ZN4core10intrinsics3mir12CastPtrToPtr19panic_cold_explicit17hbf06f1de59939b78E: (a: number) => void;
  readonly _ZN4core10intrinsics3mir21__internal_make_place19panic_cold_explicit17hc6e07624c1709ce6E: (a: number) => void;
  readonly _ZN4core10intrinsics3mir11__debuginfo19panic_cold_explicit17h9fc84bd6bf961d2cE: (a: number) => void;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_2: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_export_6: WebAssembly.Table;
  readonly __externref_heap_live_count: () => number;
  readonly __externref_drop_slice: (a: number, b: number) => void;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly closure86_externref_shim: (a: number, b: number, c: any) => void;
  readonly closure1884_externref_shim: (a: number, b: number, c: any, d: number, e: any) => number;
  readonly closure1885_externref_shim_multivalue_shim: (a: number, b: number, c: any, d: number, e: any) => [number, number];
  readonly closure1886_externref_shim: (a: number, b: number, c: any, d: number, e: any) => void;
  readonly closure1887_externref_shim: (a: number, b: number, c: any, d: number, e: any) => any;
  readonly closure1888_externref_shim: (a: number, b: number, c: any, d: any, e: number, f: any) => any;
  readonly closure1889_externref_shim: (a: number, b: number, c: any) => number;
  readonly closure1890_externref_shim: (a: number, b: number, c: any, d: any) => void;
  readonly closure1886_externref_shim19: (a: number, b: number, c: any, d: any, e: any) => void;
  readonly closure1891_externref_shim: (a: number, b: number, c: number, d: number, e: any) => void;
  readonly closure1892_externref_shim: (a: number, b: number, c: number, d: number, e: any) => void;
  readonly closure1886_externref_shim22: (a: number, b: number, c: number, d: number, e: any) => void;
  readonly closure1891_externref_shim23: (a: number, b: number, c: number, d: number, e: any) => void;
  readonly closure1892_externref_shim24: (a: number, b: number, c: number, d: number, e: any) => void;
  readonly closure1886_externref_shim25: (a: number, b: number, c: number, d: number, e: any) => void;
  readonly closure1893_externref_shim: (a: number, b: number, c: number, d: number, e: any) => void;
  readonly closure1894_externref_shim: (a: number, b: number, c: number, d: number, e: any) => void;
  readonly closure1895_externref_shim: (a: number, b: number, c: bigint, d: number, e: any) => void;
  readonly closure1895_externref_shim29: (a: number, b: number, c: bigint, d: number, e: any) => void;
  readonly __wbindgen_thread_destroy: (a?: number, b?: number, c?: number) => void;
  readonly __wbindgen_start: (a: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput, memory?: WebAssembly.Memory, thread_stack_size?: number }} module - Passing `SyncInitInput` directly is deprecated.
* @param {WebAssembly.Memory} memory - Deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput, memory?: WebAssembly.Memory, thread_stack_size?: number } | SyncInitInput, memory?: WebAssembly.Memory): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput>, memory?: WebAssembly.Memory, thread_stack_size?: number }} module_or_path - Passing `InitInput` directly is deprecated.
* @param {WebAssembly.Memory} memory - Deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput>, memory?: WebAssembly.Memory, thread_stack_size?: number } | InitInput | Promise<InitInput>, memory?: WebAssembly.Memory): Promise<InitOutput>;
