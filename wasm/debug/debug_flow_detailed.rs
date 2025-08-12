use image::GrayImage;
use image::ImageReader;
use vectorize_core::algorithms::edges::{
    apply_nms, compute_fdog, hysteresis_threshold, FdogConfig, NmsConfig,
};
use vectorize_core::algorithms::etf::{compute_etf, EtfConfig};
use vectorize_core::algorithms::trace::{trace_polylines, TraceConfig};
// Removed unused imports

fn main() -> Result<(), Box<dyn std::error::Error>> {
    env_logger::init();

    let input_path = "examples/images_in/test1.png";

    println!("=== DETAILED FLOW-TRACING DEBUG ===");

    // Load and prepare image
    let img = ImageReader::open(input_path)?.decode()?;
    let rgba_img = img.to_rgba8();
    println!("Loaded image: {}x{}", rgba_img.width(), rgba_img.height());

    // Convert to grayscale (same as in trace_low.rs)
    let gray = GrayImage::from_fn(rgba_img.width(), rgba_img.height(), |x, y| {
        let pixel = rgba_img.get_pixel(x, y);
        let gray_value =
            (0.299 * pixel[0] as f32 + 0.587 * pixel[1] as f32 + 0.114 * pixel[2] as f32) as u8;
        image::Luma([gray_value])
    });

    // Step 1: Compute ETF field
    println!("\n=== Step 1: Computing ETF Field ===");
    let etf_config = EtfConfig {
        radius: 4,
        iters: 4,
        coherency_tau: 0.2,
        sigma: 1.0,
    };
    let etf_field = compute_etf(&gray, &etf_config);
    println!("✓ ETF field computed");

    // Step 2: Compute FDoG edge response
    println!("\n=== Step 2: Computing FDoG Edge Response ===");
    let fdog_config = FdogConfig {
        sigma_s: 1.2,
        sigma_c: 2.0,
        passes: 1,
        tau: 0.90,
    };
    let edge_response = compute_fdog(&gray, &etf_field, &fdog_config);
    let non_zero_edges = edge_response.magnitude.iter().filter(|&&x| x > 0.0).count();
    println!(
        "✓ FDoG computed: {}/{} non-zero responses",
        non_zero_edges,
        edge_response.magnitude.len()
    );

    // Step 3: Apply NMS
    println!("\n=== Step 3: Applying NMS ===");
    let nms_config = NmsConfig {
        low: 0.08,
        high: 0.16,
        smooth_before_nms: true,
        smooth_sigma: 0.8,
    };
    let nms_edges = apply_nms(&edge_response, &etf_field, &nms_config);
    let nms_non_zero = nms_edges.iter().filter(|&&x| x > 0.0).count();
    let nms_max = nms_edges.iter().fold(0.0f32, |a, &b| a.max(b));
    println!(
        "✓ NMS applied: {}/{} non-zero edges, max value: {:.6}",
        nms_non_zero,
        nms_edges.len(),
        nms_max
    );

    // Step 4: Apply hysteresis with fixed thresholds
    println!("\n=== Step 4: Applying Hysteresis ===");
    let adaptive_low = nms_max * 0.1;
    let adaptive_high = nms_max * 0.7;
    println!("Using adaptive thresholds: low={adaptive_low:.6}, high={adaptive_high:.6}");

    let binary_edges = hysteresis_threshold(
        &nms_edges,
        edge_response.width,
        edge_response.height,
        adaptive_low,
        adaptive_high,
    );
    let hysteresis_edges = binary_edges.iter().filter(|&&x| x > 0.0).count();
    println!(
        "✓ Hysteresis applied: {}/{} binary edges",
        hysteresis_edges,
        binary_edges.len()
    );

    if hysteresis_edges == 0 {
        println!("✗ ERROR: No edges after hysteresis - cannot proceed with flow tracing");
        return Ok(());
    }

    // Step 5: Convert binary edges to GrayImage for tracing
    println!("\n=== Step 5: Preparing Binary Edge Image ===");
    let binary_image = GrayImage::from_fn(edge_response.width, edge_response.height, |x, y| {
        let idx = (y * edge_response.width + x) as usize;
        let value = if binary_edges[idx] > 0.0 { 255 } else { 0 };
        image::Luma([value])
    });
    let edge_pixels = binary_image.pixels().filter(|p| p[0] > 0).count();
    println!("✓ Binary edge image created: {edge_pixels} edge pixels");

    // Step 6: Flow-guided tracing
    println!("\n=== Step 6: Flow-Guided Tracing ===");
    let trace_config = TraceConfig {
        min_grad: 0.08,
        min_coherency: 0.15,
        max_gap: 4,
        max_len: 10_000,
        ..Default::default()
    };
    println!(
        "Trace config: min_grad={}, min_coherency={}, max_gap={}, max_len={}",
        trace_config.min_grad,
        trace_config.min_coherency,
        trace_config.max_gap,
        trace_config.max_len
    );

    let traced_polylines = trace_polylines(&binary_image, &etf_field, &trace_config);
    println!(
        "✓ Flow tracing result: {} polylines",
        traced_polylines.len()
    );

    if traced_polylines.is_empty() {
        println!("✗ ERROR: Flow tracing produced no polylines!");

        // Try with looser parameters
        println!("\n=== Retry with Looser Parameters ===");
        let loose_trace_config = TraceConfig {
            min_grad: 0.01,      // Much lower
            min_coherency: 0.01, // Much lower
            max_gap: 10,         // Higher
            max_len: 10_000,
            ..Default::default()
        };
        println!(
            "Trying looser config: min_grad={}, min_coherency={}, max_gap={}",
            loose_trace_config.min_grad,
            loose_trace_config.min_coherency,
            loose_trace_config.max_gap
        );

        let loose_polylines = trace_polylines(&binary_image, &etf_field, &loose_trace_config);
        println!("Loose tracing result: {} polylines", loose_polylines.len());

        if !loose_polylines.is_empty() {
            println!("✓ SUCCESS: Looser parameters produced polylines!");
            println!("CONCLUSION: Flow tracing parameters are too strict for this image.");
        } else {
            println!("✗ STILL NO POLYLINES: Problem may be in trace_polylines implementation or edge preparation.");
        }
    } else {
        println!("✓ Flow tracing worked! Analyzing polyline details:");

        // Calculate polyline lengths before and after Douglas-Peucker
        use vectorize_core::algorithms::path_utils::douglas_peucker_simplify;
        let dp_epsilon = 0.5; // Small epsilon for testing

        for (i, polyline) in traced_polylines.iter().take(5).enumerate() {
            // Original length
            let mut original_length = 0.0;
            for j in 1..polyline.len() {
                let dx = polyline[j].x - polyline[j - 1].x;
                let dy = polyline[j].y - polyline[j - 1].y;
                original_length += (dx * dx + dy * dy).sqrt();
            }

            // Convert to internal Point format
            let converted: Vec<vectorize_core::algorithms::Point> = polyline
                .iter()
                .map(|pt| vectorize_core::algorithms::Point::new(pt.x, pt.y))
                .collect();

            // Apply Douglas-Peucker
            let simplified = douglas_peucker_simplify(&converted, dp_epsilon);

            // Calculate simplified length
            let mut simplified_length = 0.0;
            for j in 1..simplified.len() {
                let dx = simplified[j].x - simplified[j - 1].x;
                let dy = simplified[j].y - simplified[j - 1].y;
                simplified_length += (dx * dx + dy * dy).sqrt();
            }

            println!(
                "  Polyline {}: {} -> {} points, {:.2} -> {:.2} px",
                i,
                polyline.len(),
                simplified.len(),
                original_length,
                simplified_length
            );
        }

        // Calculate minimum stroke length threshold for comparison
        let detail = 0.3;
        let min_stroke_length_px = 10.0 + 40.0 * detail;
        println!();
        println!("Minimum stroke length threshold: {min_stroke_length_px:.1} px");

        let short_polylines = traced_polylines
            .iter()
            .filter(|polyline| {
                let mut length = 0.0;
                for j in 1..polyline.len() {
                    let dx = polyline[j].x - polyline[j - 1].x;
                    let dy = polyline[j].y - polyline[j - 1].y;
                    length += (dx * dx + dy * dy).sqrt();
                }
                length < min_stroke_length_px
            })
            .count();

        println!(
            "Polylines shorter than threshold: {}/{}",
            short_polylines,
            traced_polylines.len()
        );
        println!("✗ CONCLUSION: Most/all flow-traced polylines are being filtered out due to minimum length requirement!");
    }

    Ok(())
}
