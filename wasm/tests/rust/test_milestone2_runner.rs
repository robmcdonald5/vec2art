use image::ImageReader;
use std::fs;
use vectorize_core::config::SvgConfig;
use vectorize_core::svg::generate_svg_document;
use vectorize_core::{vectorize_trace_low, TraceBackend, TraceLowConfig};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Configure logging
    env_logger::init();

    let input_path = "examples/images_in/test1.png";
    let output_dir = "examples/outputs/test_outputs";

    println!("=== MILESTONE 2: ADVANCED LINE TRACING ALGORITHMS TEST ===");
    println!("Input: {input_path}");

    // Ensure output directory exists
    fs::create_dir_all(output_dir)?;

    // Load test image
    let img = ImageReader::open(input_path)?.decode()?;
    let rgba_img = img.to_rgba8();

    println!("Loaded image: {}x{}", rgba_img.width(), rgba_img.height());

    // Test 1: Baseline traditional edge detection
    println!("\n=== Test 1: Traditional Edge Detection (Baseline) ===");
    let baseline_config = TraceLowConfig {
        backend: TraceBackend::Edge,
        detail: 0.3,
        stroke_px_at_1080p: 1.2,
        enable_etf_fdog: false,
        enable_flow_tracing: false,
        enable_bezier_fitting: false,
        ..Default::default()
    };

    let baseline_paths = vectorize_trace_low(&rgba_img, &baseline_config)?;
    let baseline_output = format!("{output_dir}/test1-5-milestone2-baseline.svg");
    let svg_config = SvgConfig::default();
    let svg_content = generate_svg_document(
        &baseline_paths,
        rgba_img.width(),
        rgba_img.height(),
        &svg_config,
    );
    fs::write(&baseline_output, svg_content)?;
    println!(
        "✓ Generated {} paths -> {}",
        baseline_paths.len(),
        baseline_output
    );

    // Test 2: ETF/FDoG enhanced edge detection
    println!("\n=== Test 2: ETF/FDoG Enhanced Edge Detection ===");
    let etf_fdog_config = TraceLowConfig {
        backend: TraceBackend::Edge,
        detail: 0.3,
        stroke_px_at_1080p: 1.2,
        enable_etf_fdog: true,
        enable_flow_tracing: false,
        enable_bezier_fitting: false,
        etf_radius: 4,
        etf_iterations: 4,
        etf_coherency_tau: 0.2,
        fdog_sigma_s: 1.2,
        fdog_sigma_c: 2.0,
        fdog_tau: 0.90,
        nms_low: 0.08,
        nms_high: 0.16,
        ..Default::default()
    };

    let etf_fdog_paths = vectorize_trace_low(&rgba_img, &etf_fdog_config)?;
    let etf_fdog_output = format!("{output_dir}/test1-6-milestone2-etf-fdog.svg");
    let svg_content = generate_svg_document(
        &etf_fdog_paths,
        rgba_img.width(),
        rgba_img.height(),
        &svg_config,
    );
    fs::write(&etf_fdog_output, svg_content)?;
    println!(
        "✓ Generated {} paths -> {}",
        etf_fdog_paths.len(),
        etf_fdog_output
    );

    // Test 3: Flow-guided polyline tracing (use lower detail to reduce min_stroke_length filtering)
    println!("\n=== Test 3: Flow-Guided Polyline Tracing ===");
    let flow_tracing_config = TraceLowConfig {
        backend: TraceBackend::Edge,
        detail: 0.0, // Minimum detail = 10.0 + 40.0 * 0.0 = 10px min length
        stroke_px_at_1080p: 1.2,
        enable_etf_fdog: true,
        enable_flow_tracing: true,
        enable_bezier_fitting: false,
        trace_min_grad: 0.02, // Lower gradient threshold to follow weaker edges
        trace_min_coherency: 0.05, // Lower coherency requirement
        trace_max_gap: 8,     // Allow larger gaps to connect segments
        trace_max_len: 10_000,
        ..Default::default()
    };

    let flow_tracing_paths = vectorize_trace_low(&rgba_img, &flow_tracing_config)?;
    let flow_tracing_output = format!("{output_dir}/test1-7-milestone2-flow-tracing.svg");
    let svg_content = generate_svg_document(
        &flow_tracing_paths,
        rgba_img.width(),
        rgba_img.height(),
        &svg_config,
    );
    fs::write(&flow_tracing_output, svg_content)?;
    println!(
        "✓ Generated {} paths -> {}",
        flow_tracing_paths.len(),
        flow_tracing_output
    );

    // Test 4: Complete Milestone 2 pipeline (ETF + Flow + Bézier)
    println!("\n=== Test 4: Complete Milestone 2 Pipeline ===");
    let full_pipeline_config = TraceLowConfig {
        backend: TraceBackend::Edge,
        detail: 0.3,
        stroke_px_at_1080p: 1.2,
        enable_etf_fdog: true,
        enable_flow_tracing: true,
        enable_bezier_fitting: true,
        trace_min_grad: 0.08,
        trace_min_coherency: 0.15,
        trace_max_gap: 4,
        trace_max_len: 10_000,
        fit_lambda_curv: 0.02,
        fit_max_err: 0.8,
        fit_split_angle: 32.0,
        ..Default::default()
    };

    let full_pipeline_paths = vectorize_trace_low(&rgba_img, &full_pipeline_config)?;
    let full_pipeline_output = format!("{output_dir}/test1-8-milestone2-full-pipeline.svg");
    let svg_content = generate_svg_document(
        &full_pipeline_paths,
        rgba_img.width(),
        rgba_img.height(),
        &svg_config,
    );
    fs::write(&full_pipeline_output, svg_content)?;
    println!(
        "✓ Generated {} paths -> {}",
        full_pipeline_paths.len(),
        full_pipeline_output
    );

    println!("\n=== MILESTONE 2 SUMMARY ===");
    println!(
        "Traditional baseline:        {} paths",
        baseline_paths.len()
    );
    println!("ETF/FDoG enhanced:          {} paths", etf_fdog_paths.len());
    println!(
        "Flow-guided tracing:        {} paths",
        flow_tracing_paths.len()
    );
    println!(
        "Complete Milestone 2:       {} paths",
        full_pipeline_paths.len()
    );
    println!("\n✓ All Milestone 2 algorithms tested successfully!");
    println!("Check the '{output_dir}' directory for output SVG files.");
    println!("Files: test1-5-milestone2-baseline.svg through test1-8-milestone2-full-pipeline.svg");

    Ok(())
}
