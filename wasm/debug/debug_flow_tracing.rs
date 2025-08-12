use image::ImageReader;
use std::fs;
use vectorize_core::config::SvgConfig;
use vectorize_core::svg::generate_svg_document;
use vectorize_core::{vectorize_trace_low, TraceBackend, TraceLowConfig};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    env_logger::init();

    let input_path = "examples/images_in/test1.png";
    let output_dir = "examples/outputs/test_outputs";

    println!("=== DEBUGGING FLOW-TRACING 0 PATHS ISSUE ===");

    // Load test image
    let img = ImageReader::open(input_path)?.decode()?;
    let rgba_img = img.to_rgba8();

    println!("Loaded image: {}x{}", rgba_img.width(), rgba_img.height());
    fs::create_dir_all(output_dir)?;
    let svg_config = SvgConfig::default();

    // Test 3: Flow-guided tracing only (produces 0 paths)
    println!("\n=== Test 3: Flow-Guided Tracing Only (PROBLEM) ===");
    let flow_tracing_config = TraceLowConfig {
        backend: TraceBackend::Edge,
        detail: 0.3,
        stroke_px_at_1080p: 1.2,
        enable_etf_fdog: true,        // Must enable ETF/FDoG for flow tracing
        enable_flow_tracing: true,    // Enable flow tracing
        enable_bezier_fitting: false, // No Bézier fitting
        // ETF/FDoG parameters (same as working configs)
        etf_radius: 4,
        etf_iterations: 4,
        etf_coherency_tau: 0.2,
        fdog_sigma_s: 1.2,
        fdog_sigma_c: 2.0,
        fdog_tau: 0.90,
        nms_low: 0.08,
        nms_high: 0.16,
        // Flow tracing parameters
        trace_min_grad: 0.08,
        trace_min_coherency: 0.15,
        trace_max_gap: 4,
        trace_max_len: 10_000,
        ..Default::default()
    };

    println!("Config details:");
    println!(
        "  ETF/FDoG: enabled={}, radius={}, iterations={}",
        flow_tracing_config.enable_etf_fdog,
        flow_tracing_config.etf_radius,
        flow_tracing_config.etf_iterations
    );
    println!(
        "  Flow tracing: enabled={}, min_grad={}, min_coherency={}, max_gap={}",
        flow_tracing_config.enable_flow_tracing,
        flow_tracing_config.trace_min_grad,
        flow_tracing_config.trace_min_coherency,
        flow_tracing_config.trace_max_gap
    );
    println!(
        "  Bézier: enabled={}",
        flow_tracing_config.enable_bezier_fitting
    );

    let flow_tracing_paths = vectorize_trace_low(&rgba_img, &flow_tracing_config)?;
    println!("✗ Generated {} paths (PROBLEM!)", flow_tracing_paths.len());

    // Test 4: Complete pipeline (produces 15 paths)
    println!("\n=== Test 4: Complete Pipeline (WORKS) ===");
    let full_pipeline_config = TraceLowConfig {
        backend: TraceBackend::Edge,
        detail: 0.3,
        stroke_px_at_1080p: 1.2,
        enable_etf_fdog: true,       // Enable ETF/FDoG
        enable_flow_tracing: true,   // Enable flow tracing
        enable_bezier_fitting: true, // Enable Bézier fitting
        // ETF/FDoG parameters (identical)
        etf_radius: 4,
        etf_iterations: 4,
        etf_coherency_tau: 0.2,
        fdog_sigma_s: 1.2,
        fdog_sigma_c: 2.0,
        fdog_tau: 0.90,
        nms_low: 0.08,
        nms_high: 0.16,
        // Flow tracing parameters (identical)
        trace_min_grad: 0.08,
        trace_min_coherency: 0.15,
        trace_max_gap: 4,
        trace_max_len: 10_000,
        // Bézier fitting parameters
        fit_lambda_curv: 0.02,
        fit_max_err: 0.8,
        fit_split_angle: 32.0,
        ..Default::default()
    };

    println!("Config details:");
    println!(
        "  ETF/FDoG: enabled={}, radius={}, iterations={}",
        full_pipeline_config.enable_etf_fdog,
        full_pipeline_config.etf_radius,
        full_pipeline_config.etf_iterations
    );
    println!(
        "  Flow tracing: enabled={}, min_grad={}, min_coherency={}, max_gap={}",
        full_pipeline_config.enable_flow_tracing,
        full_pipeline_config.trace_min_grad,
        full_pipeline_config.trace_min_coherency,
        full_pipeline_config.trace_max_gap
    );
    println!(
        "  Bézier: enabled={}, lambda_curv={}, max_err={}",
        full_pipeline_config.enable_bezier_fitting,
        full_pipeline_config.fit_lambda_curv,
        full_pipeline_config.fit_max_err
    );

    let full_pipeline_paths = vectorize_trace_low(&rgba_img, &full_pipeline_config)?;
    println!("✓ Generated {} paths (WORKS!)", full_pipeline_paths.len());

    // Test 5: Try looser flow tracing parameters
    println!("\n=== Test 5: Flow-Guided with Looser Parameters ===");
    let loose_flow_config = TraceLowConfig {
        backend: TraceBackend::Edge,
        detail: 0.3,
        stroke_px_at_1080p: 1.2,
        enable_etf_fdog: true,
        enable_flow_tracing: true,
        enable_bezier_fitting: false,
        // ETF/FDoG parameters (same)
        etf_radius: 4,
        etf_iterations: 4,
        etf_coherency_tau: 0.2,
        fdog_sigma_s: 1.2,
        fdog_sigma_c: 2.0,
        fdog_tau: 0.90,
        nms_low: 0.08,
        nms_high: 0.16,
        // Looser flow tracing parameters
        trace_min_grad: 0.02,      // Lower minimum gradient (was 0.08)
        trace_min_coherency: 0.05, // Lower minimum coherency (was 0.15)
        trace_max_gap: 8,          // Larger gap tolerance (was 4)
        trace_max_len: 10_000,     // Same max length
        ..Default::default()
    };

    println!("Trying looser parameters:");
    println!("  trace_min_grad: 0.02 (was 0.08)");
    println!("  trace_min_coherency: 0.05 (was 0.15)");
    println!("  trace_max_gap: 8 (was 4)");

    let loose_flow_paths = vectorize_trace_low(&rgba_img, &loose_flow_config)?;
    println!("Result: {} paths", loose_flow_paths.len());

    println!("\n=== ANALYSIS ===");
    println!(
        "Flow-tracing only (strict):  {} paths",
        flow_tracing_paths.len()
    );
    println!(
        "Flow-tracing only (loose):   {} paths",
        loose_flow_paths.len()
    );
    println!(
        "Complete pipeline:           {} paths",
        full_pipeline_paths.len()
    );
    println!();
    println!("HYPOTHESIS: Flow tracing may require Bézier fitting to produce valid paths,");
    println!("or the flow tracing parameters are too strict for this test image.");

    // Save debug outputs
    if !flow_tracing_paths.is_empty() {
        let svg_content = generate_svg_document(
            &flow_tracing_paths,
            rgba_img.width(),
            rgba_img.height(),
            &svg_config,
        );
        fs::write(format!("{output_dir}/debug_flow_strict.svg"), svg_content)?;
    }

    if !loose_flow_paths.is_empty() {
        let svg_content = generate_svg_document(
            &loose_flow_paths,
            rgba_img.width(),
            rgba_img.height(),
            &svg_config,
        );
        fs::write(format!("{output_dir}/debug_flow_loose.svg"), svg_content)?;
    }

    Ok(())
}
