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

    println!("=== DEBUGGING ETF/FDoG ISSUE ===");

    // Load test image
    let img = ImageReader::open(input_path)?.decode()?;
    let rgba_img = img.to_rgba8();

    println!("Loaded image: {}x{}", rgba_img.width(), rgba_img.height());

    // Test traditional baseline
    let baseline_config = TraceLowConfig {
        backend: TraceBackend::Edge,
        detail: 0.3,
        enable_etf_fdog: false,
        ..Default::default()
    };

    let baseline_paths = vectorize_trace_low(&rgba_img, &baseline_config, None)?;
    println!(
        "Traditional baseline generated {} paths",
        baseline_paths.len()
    );

    // Test ETF/FDoG with debug
    let etf_config = TraceLowConfig {
        backend: TraceBackend::Edge,
        detail: 0.3,
        enable_etf_fdog: true,
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

    println!("Running ETF/FDoG with debug logging...");
    let etf_paths = vectorize_trace_low(&rgba_img, &etf_config, None)?;
    println!("ETF/FDoG generated {} paths", etf_paths.len());

    if etf_paths.is_empty() {
        println!("ERROR: ETF/FDoG produced no paths! Debugging step by step...");

        // Debug ETF/FDoG pipeline step by step
        let gray = GrayImage::from_fn(rgba_img.width(), rgba_img.height(), |x, y| {
            let pixel = rgba_img.get_pixel(x, y);
            let gray_value =
                (0.299 * pixel[0] as f32 + 0.587 * pixel[1] as f32 + 0.114 * pixel[2] as f32) as u8;
            image::Luma([gray_value])
        });
        println!(
            "1. Converted to grayscale: {}x{}",
            gray.width(),
            gray.height()
        );

        // ETF computation
        let etf_config_debug = EtfConfig {
            radius: 4,
            iters: 4,
            coherency_tau: 0.2,
            sigma: 1.0,
        };
        let etf_field = compute_etf(&gray, &etf_config_debug);
        println!("2. Computed ETF field");

        // FDoG computation
        let fdog_config = FdogConfig {
            sigma_s: 1.2,
            sigma_c: 2.0,
            passes: 1,
            tau: 0.90,
        };
        let edge_response = compute_fdog(&gray, &etf_field, &fdog_config);
        println!("3. Computed FDoG edge response");

        // Count non-zero edge responses
        let non_zero_edges = edge_response.magnitude.iter().filter(|&&x| x > 0.0).count();
        println!(
            "   Non-zero edge responses: {}/{}",
            non_zero_edges,
            edge_response.magnitude.len()
        );

        // NMS
        let nms_config = NmsConfig {
            low: 0.08,
            high: 0.16,
            smooth_before_nms: true,
            smooth_sigma: 0.8,
        };
        let nms_edges = apply_nms(&edge_response, &etf_field, &nms_config);
        println!("4. Applied NMS");

        let nms_non_zero = nms_edges.iter().filter(|&&x| x > 0.0).count();
        let nms_max = nms_edges.iter().fold(0.0f32, |a, &b| a.max(b));
        let nms_min_nonzero = nms_edges
            .iter()
            .filter(|&&x| x > 0.0)
            .fold(f32::MAX, |a, &b| a.min(b));
        println!(
            "   Non-zero NMS edges: {}/{}",
            nms_non_zero,
            nms_edges.len()
        );
        println!("   NMS value range: {nms_min_nonzero:.6} to {nms_max:.6}");

        // Hysteresis with corrected thresholds
        let low_thresh = nms_max * 0.1; // 10% of max
        let high_thresh = nms_max * 0.7; // 70% of max
        println!(
            "   Using corrected hysteresis thresholds: low={low_thresh:.6}, high={high_thresh:.6}"
        );

        let binary_edges = hysteresis_threshold(
            &nms_edges,
            edge_response.width,
            edge_response.height,
            low_thresh,
            high_thresh,
        );
        let hysteresis_edges = binary_edges.iter().filter(|&&x| x > 0.0).count();
        println!(
            "5. Applied hysteresis: {}/{} edges",
            hysteresis_edges,
            binary_edges.len()
        );

        if hysteresis_edges == 0 {
            println!("   PROBLEM: Still no edges after hysteresis thresholding!");
        } else {
            println!("   SUCCESS: Fixed the hysteresis threshold issue!");
        }
    }

    Ok(())
}
