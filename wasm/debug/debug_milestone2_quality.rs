use image::GrayImage;
use image::ImageReader;
use vectorize_core::algorithms::edges::{
    apply_nms, compute_fdog, hysteresis_threshold, FdogConfig, NmsConfig,
};
use vectorize_core::algorithms::edges::etf::{compute_etf, EtfConfig};
use vectorize_core::{vectorize_trace_low, TraceBackend, TraceLowConfig};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    env_logger::init();

    let input_path = "examples/images_in/test1.png";

    println!("=== MILESTONE 2 QUALITY ANALYSIS ===");
    println!("Investigating why M2 algorithms produce poor results vs traditional");

    // Load and prepare image
    let img = ImageReader::open(input_path)?.decode()?;
    let rgba_img = img.to_rgba8();
    println!("Image: {}x{}", rgba_img.width(), rgba_img.height());

    // Convert to grayscale
    let gray = GrayImage::from_fn(rgba_img.width(), rgba_img.height(), |x, y| {
        let pixel = rgba_img.get_pixel(x, y);
        let gray_value =
            (0.299 * pixel[0] as f32 + 0.587 * pixel[1] as f32 + 0.114 * pixel[2] as f32) as u8;
        image::Luma([gray_value])
    });

    // Test 1: Traditional baseline for comparison
    println!("\n=== BASELINE: Traditional Edge Detection ===");
    let traditional_config = TraceLowConfig {
        backend: TraceBackend::Edge,
        detail: 0.3,
        enable_etf_fdog: false,
        ..Default::default()
    };
    let traditional_paths = vectorize_trace_low(&rgba_img, &traditional_config, None)?;
    println!("Traditional result: {} paths", traditional_paths.len());

    // Test 2: ETF/FDoG analysis - step by step
    println!("\n=== MILESTONE 2: ETF/FDoG Analysis ===");

    // Step 1: Compute ETF field
    let etf_config = EtfConfig {
        radius: 4,
        iters: 4,
        coherency_tau: 0.2,
        sigma: 1.0,
    };
    let etf_field = compute_etf(&gray, &etf_config);
    println!("✓ ETF field computed");

    // Step 2: Test multiple FDoG parameter sets
    println!("\n--- Testing FDoG Parameter Variations ---");

    let fdog_configs = vec![
        (
            "Current",
            FdogConfig {
                sigma_s: 1.2,
                sigma_c: 2.0,
                passes: 1,
                tau: 0.90,
            },
        ),
        (
            "More Sensitive",
            FdogConfig {
                sigma_s: 0.8,
                sigma_c: 1.6,
                passes: 1,
                tau: 0.70,
            },
        ),
        (
            "Less Sensitive",
            FdogConfig {
                sigma_s: 1.5,
                sigma_c: 2.5,
                passes: 1,
                tau: 0.95,
            },
        ),
        (
            "Academic",
            FdogConfig {
                sigma_s: 1.0,
                sigma_c: 1.6,
                passes: 1,
                tau: 0.80,
            },
        ),
    ];

    for (name, fdog_config) in &fdog_configs {
        let edge_response = compute_fdog(&gray, &etf_field, fdog_config);
        let non_zero = edge_response.magnitude.iter().filter(|&&x| x > 0.0).count();
        let max_response = edge_response
            .magnitude
            .iter()
            .fold(0.0f32, |a, &b| a.max(b));
        println!(
            "{}: {}/{} non-zero, max={:.4}",
            name,
            non_zero,
            edge_response.magnitude.len(),
            max_response
        );
    }

    // Step 3: Test different hysteresis threshold strategies
    println!("\n--- Testing Hysteresis Strategies ---");
    let fdog_config = &fdog_configs[0].1; // Use current config
    let edge_response = compute_fdog(&gray, &etf_field, fdog_config);

    // Apply NMS first
    let nms_config = NmsConfig::default();
    let nms_edges = apply_nms(&edge_response, &etf_field, &nms_config);
    let nms_non_zero = nms_edges.iter().filter(|&&x| x > 0.0).count();
    let nms_max = nms_edges.iter().fold(0.0f32, |a, &b| a.max(b));
    let nms_min_nonzero = nms_edges
        .iter()
        .filter(|&&x| x > 0.0)
        .fold(f32::MAX, |a, &b| a.min(b));

    println!(
        "After NMS: {}/{} edges, range: {:.6} to {:.6}",
        nms_non_zero,
        nms_edges.len(),
        nms_min_nonzero,
        nms_max
    );

    // Test different hysteresis strategies
    let hysteresis_strategies = vec![
        ("Current Adaptive", nms_max * 0.1, nms_max * 0.7),
        ("More Lenient", nms_max * 0.05, nms_max * 0.4),
        ("Very Lenient", nms_max * 0.02, nms_max * 0.2),
        ("Fixed Traditional", 0.08, 0.16), // Original fixed values
        ("Lower Fixed", 0.04, 0.08),
    ];

    for (name, low_thresh, high_thresh) in hysteresis_strategies {
        let binary_edges = hysteresis_threshold(
            &nms_edges,
            edge_response.width,
            edge_response.height,
            low_thresh,
            high_thresh,
        );
        let final_edges = binary_edges.iter().filter(|&&x| x > 0.0).count();
        println!("{name}: low={low_thresh:.4}, high={high_thresh:.4} -> {final_edges} final edges");
    }

    // Test 3: Full ETF/FDoG with most lenient settings
    println!("\n=== Testing ETF/FDoG with Optimized Parameters ===");
    let optimized_config = TraceLowConfig {
        backend: TraceBackend::Edge,
        detail: 0.3,
        enable_etf_fdog: true,
        enable_flow_tracing: false,
        // More sensitive FDoG
        fdog_sigma_s: 0.8,
        fdog_sigma_c: 1.6,
        fdog_tau: 0.70,
        // More lenient hysteresis (will be overridden by adaptive)
        nms_low: 0.04,
        nms_high: 0.08,
        ..Default::default()
    };
    let optimized_paths = vectorize_trace_low(&rgba_img, &optimized_config, None)?;
    println!(
        "Optimized ETF/FDoG: {} paths (vs {} traditional)",
        optimized_paths.len(),
        traditional_paths.len()
    );

    // Test 4: Flow tracing with very lenient parameters
    println!("\n=== Testing Flow Tracing with Lenient Parameters ===");
    let flow_config = TraceLowConfig {
        backend: TraceBackend::Edge,
        detail: 0.0, // Minimum filtering
        enable_etf_fdog: true,
        enable_flow_tracing: true,
        enable_bezier_fitting: false,
        // Optimized FDoG
        fdog_sigma_s: 0.8,
        fdog_sigma_c: 1.6,
        fdog_tau: 0.70,
        nms_low: 0.04,
        nms_high: 0.08,
        // Very lenient flow tracing
        trace_min_grad: 0.001,      // Much lower gradient requirement
        trace_min_coherency: 0.001, // Much lower coherency requirement
        trace_max_gap: 20,          // Much larger gaps allowed
        trace_max_len: 50_000,      // Much longer paths
        ..Default::default()
    };
    let flow_paths = vectorize_trace_low(&rgba_img, &flow_config, None)?;
    println!("Lenient flow tracing: {} paths", flow_paths.len());

    // Test 5: Complete pipeline with all optimizations
    println!("\n=== Complete Optimized Pipeline ===");
    let complete_config = TraceLowConfig {
        enable_bezier_fitting: true,
        fit_lambda_curv: 0.01, // Less restrictive curve fitting
        fit_max_err: 2.0,      // Allow more error
        ..flow_config
    };
    let complete_paths = vectorize_trace_low(&rgba_img, &complete_config, None)?;
    println!("Complete optimized: {} paths", complete_paths.len());

    println!("\n=== SUMMARY COMPARISON ===");
    println!("Traditional baseline:    {} paths", traditional_paths.len());
    println!("Current ETF/FDoG:        48 paths (from test output)");
    println!("Optimized ETF/FDoG:      {} paths", optimized_paths.len());
    println!("Current flow tracing:    1 paths (from test output)");
    println!("Optimized flow tracing:  {} paths", flow_paths.len());
    println!("Current complete:        15 paths (from test output)");
    println!("Optimized complete:      {} paths", complete_paths.len());

    if optimized_paths.len() > 200 {
        println!("\n✓ SUCCESS: Parameter optimization significantly improved results!");
    } else {
        println!("\n✗ FAILURE: Even optimized parameters don't match traditional quality");
        println!("This suggests fundamental algorithmic issues beyond parameter tuning");
    }

    Ok(())
}
