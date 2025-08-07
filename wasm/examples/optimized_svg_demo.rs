use vec2art::algorithms::SvgPath;
use vec2art::svg_builder::{
    generate_optimized_svg_from_paths, 
    OptimizedSvgBuilder, 
    optimization_utils,
};
use std::fs;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    env_logger::init();

    println!("🎨 Optimized SVG Builder Demonstration");
    println!("=====================================");

    // Create sample paths that would benefit from optimization
    let paths = create_sample_paths();
    
    println!("📊 Original Statistics:");
    println!("  • Total paths: {}", paths.len());
    println!("  • Total nodes: {}", optimization_utils::count_svg_nodes(&paths));
    println!("  • Complexity score: {:.2}", optimization_utils::calculate_complexity_score(&paths));

    // Generate regular SVG
    let regular_svg = generate_regular_svg(&paths, 400, 300);
    
    // Generate optimized SVG
    let optimized_svg = generate_optimized_svg_from_paths(&paths, 400, 300);
    
    // Create advanced optimized SVG with custom settings
    let mut advanced_builder = OptimizedSvgBuilder::new(400, 300)
        .with_css_classes(true)
        .with_precision(1)
        .with_merge_threshold(2.0);
    
    advanced_builder.add_consolidated_paths(paths.clone());
    let stats = advanced_builder.get_optimization_stats();
    let advanced_svg = advanced_builder.build_with_metadata(
        "Advanced Optimized SVG", 
        "Demonstrates path consolidation and CSS optimization"
    );

    println!("\n🔧 Optimization Results:");
    println!("  • Path groups: {}", stats.total_path_groups);
    println!("  • Individual paths: {}", stats.total_individual_paths);
    println!("  • Average paths per group: {:.1}", stats.average_paths_per_group);
    println!("  • Size reduction estimate: {:.1}%", 
        optimization_utils::estimate_size_reduction(&paths, &stats) * 100.0);

    // Save examples to files
    fs::write("examples/images_out/regular_demo.svg", regular_svg)?;
    fs::write("examples/images_out/optimized_demo.svg", optimized_svg)?;
    fs::write("examples/images_out/advanced_demo.svg", advanced_svg)?;

    println!("\n💾 Output files created:");
    println!("  • examples/images_out/regular_demo.svg");
    println!("  • examples/images_out/optimized_demo.svg");
    println!("  • examples/images_out/advanced_demo.svg");

    println!("\n✅ Optimization benefits:");
    println!("  • Reduced DOM elements for better browser performance");
    println!("  • Consolidated paths with shared styles");
    println!("  • CSS classes for repeated styles");
    println!("  • Optimized coordinate precision");
    println!("  • Merged continuous paths");

    Ok(())
}

/// Create sample paths that demonstrate optimization benefits
fn create_sample_paths() -> Vec<SvgPath> {
    let mut paths = Vec::new();

    // Create multiple paths with the same style (red stroke)
    for i in 0..10 {
        let mut path = SvgPath::new();
        path.points = vec![
            (10.0 + i as f32 * 20.0, 50.0),
            (15.0 + i as f32 * 20.0, 70.0),
            (20.0 + i as f32 * 20.0, 50.0),
        ];
        path.stroke_color = Some("#ff0000".to_string());
        path.fill_color = None;
        path.stroke_width = 2.0;
        paths.push(path);
    }

    // Create paths with another style (blue fill)
    for i in 0..5 {
        let mut path = SvgPath::new();
        path.points = vec![
            (50.0 + i as f32 * 40.0, 150.0),
            (70.0 + i as f32 * 40.0, 180.0),
            (90.0 + i as f32 * 40.0, 160.0),
            (80.0 + i as f32 * 40.0, 140.0),
        ];
        path.closed = true;
        path.stroke_color = None;
        path.fill_color = Some("#0066cc".to_string());
        path.stroke_width = 1.0;
        paths.push(path);
    }

    // Create continuous paths that can be merged
    let mut path1 = SvgPath::new();
    path1.points = vec![(100.0, 200.0), (150.0, 220.0)];
    path1.stroke_color = Some("#00aa00".to_string());
    path1.stroke_width = 3.0;
    paths.push(path1);

    let mut path2 = SvgPath::new();
    path2.points = vec![(150.0, 220.0), (200.0, 240.0)]; // Connects to path1
    path2.stroke_color = Some("#00aa00".to_string());
    path2.stroke_width = 3.0;
    paths.push(path2);

    let mut path3 = SvgPath::new();
    path3.points = vec![(200.0, 240.0), (250.0, 220.0)]; // Connects to path2
    path3.stroke_color = Some("#00aa00".to_string());
    path3.stroke_width = 3.0;
    paths.push(path3);

    // Add some complex paths with high precision coordinates
    for i in 0..8 {
        let mut path = SvgPath::new();
        let angle = i as f32 * std::f32::consts::PI / 4.0;
        path.points = vec![
            (200.0, 120.0),
            (200.0 + 30.0 * angle.cos(), 120.0 + 30.0 * angle.sin()),
        ];
        path.stroke_color = Some("#ff6600".to_string());
        path.stroke_width = 1.5;
        paths.push(path);
    }

    paths
}

/// Generate regular SVG for comparison
fn generate_regular_svg(paths: &[SvgPath], width: u32, height: u32) -> String {
    use vec2art::svg_builder::SvgBuilder;

    let mut builder = SvgBuilder::new(width, height)
        .with_metadata("Regular SVG", "Standard SVG without optimization");

    builder.add_paths(paths);
    builder.build()
}