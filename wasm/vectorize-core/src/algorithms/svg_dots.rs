//! SVG dot renderer for dot-based pixel mapping
//!
//! This module converts Dot structures into optimized SVG output. It provides functionality for
//! generating SVG circle elements, grouping similar colors for optimization, and producing
//! compact SVG output with proper coordinate scaling.

use crate::algorithms::dots::Dot;
use crate::algorithms::{SvgElementType, SvgPath};
use std::fmt::Write;

/// Configuration for SVG dot rendering
#[derive(Debug, Clone)]
pub struct SvgDotConfig {
    /// Group dots with similar colors into SVG groups for file size optimization
    pub group_similar_colors: bool,
    /// Include opacity attributes in the SVG output
    pub use_opacity: bool,
    /// Generate compact output with minimal whitespace
    pub compact_output: bool,
    /// Decimal precision for coordinates and radii
    pub precision: u8,
    /// Color similarity threshold for grouping (0.0 to 1.0)
    pub color_similarity_threshold: f32,
    /// Minimum opacity threshold to include dots
    pub min_opacity_threshold: f32,
}

impl Default for SvgDotConfig {
    fn default() -> Self {
        Self {
            group_similar_colors: true,
            use_opacity: true,
            compact_output: false,
            precision: 2,
            color_similarity_threshold: 0.95,
            min_opacity_threshold: 0.1,
        }
    }
}

/// SVG element for a single dot
#[derive(Debug, Clone, PartialEq)]
pub struct SvgElement {
    /// Element type (always Circle for dots)
    pub element_type: SvgElementType,
    /// Fill color as hex string
    pub fill: String,
    /// Opacity value (0.0 to 1.0)
    pub opacity: f32,
}

impl SvgElement {
    /// Create a new SVG circle element from a dot
    pub fn from_dot(dot: &Dot) -> Self {
        Self {
            element_type: SvgElementType::Circle {
                cx: dot.x,
                cy: dot.y,
                r: dot.radius,
            },
            fill: dot.color.clone(),
            opacity: dot.opacity,
        }
    }
}

/// Convert dots to individual SVG elements
///
/// Transforms a slice of Dot structures into SVG circle elements without any grouping
/// or optimization. Each dot becomes a separate SVG element.
///
/// # Arguments
/// * `dots` - Slice of dots to convert
///
/// # Returns
/// Vector of SVG elements, one per dot
pub fn dots_to_svg_elements(dots: &[Dot]) -> Vec<SvgElement> {
    dots.iter()
        .filter(|dot| dot.opacity > 0.0 && dot.radius > 0.0)
        .map(SvgElement::from_dot)
        .collect()
}

/// Generate optimized SVG string from dots with default configuration
///
/// Convenience function that applies reasonable defaults for most use cases.
/// Uses color grouping and opacity support for optimal file size and visual quality.
///
/// # Arguments
/// * `dots` - Slice of dots to convert
///
/// # Returns
/// Complete SVG string ready for output
pub fn optimize_dot_svg(dots: &[Dot]) -> String {
    let config = SvgDotConfig::default();
    dots_to_svg_with_config(dots, &config)
}

/// Generate SVG string from dots with custom configuration
///
/// Main function for converting dots to SVG with full control over output format.
/// Supports color grouping, opacity handling, and compact output generation.
///
/// # Arguments
/// * `dots` - Slice of dots to convert
/// * `config` - Configuration for SVG generation
///
/// # Returns
/// Complete SVG string with all dots rendered as circles
pub fn dots_to_svg_with_config(dots: &[Dot], config: &SvgDotConfig) -> String {
    if dots.is_empty() {
        return String::new();
    }

    // Filter dots by minimum opacity threshold
    let filtered_dots: Vec<&Dot> = dots
        .iter()
        .filter(|dot| dot.opacity >= config.min_opacity_threshold && dot.radius > 0.0)
        .collect();

    if filtered_dots.is_empty() {
        return String::new();
    }

    // Calculate bounding box
    let (min_x, min_y, max_x, max_y) = calculate_bounding_box(&filtered_dots);
    let width = (max_x - min_x).ceil() as u32;
    let height = (max_y - min_y).ceil() as u32;

    let mut svg = String::new();

    // SVG header
    if config.compact_output {
        write!(
            &mut svg,
            r#"<svg width="{}" height="{}" viewBox="{:.prec$} {:.prec$} {:.prec$} {:.prec$}" xmlns="http://www.w3.org/2000/svg">"#,
            width,
            height,
            min_x,
            min_y,
            max_x - min_x,
            max_y - min_y,
            prec = config.precision as usize
        ).unwrap();
    } else {
        writeln!(
            &mut svg,
            r#"<svg width="{}" height="{}" viewBox="{:.prec$} {:.prec$} {:.prec$} {:.prec$}" xmlns="http://www.w3.org/2000/svg">"#,
            width,
            height,
            min_x,
            min_y,
            max_x - min_x,
            max_y - min_y,
            prec = config.precision as usize
        ).unwrap();
    }

    // Generate SVG content
    if config.group_similar_colors && filtered_dots.len() > 1 {
        generate_grouped_svg_content(&filtered_dots, config, &mut svg);
    } else {
        generate_individual_svg_content(&filtered_dots, config, &mut svg);
    }

    // SVG footer
    svg.push_str("</svg>");

    svg
}

/// Calculate bounding box for all dots including their radii
fn calculate_bounding_box(dots: &[&Dot]) -> (f32, f32, f32, f32) {
    if dots.is_empty() {
        return (0.0, 0.0, 0.0, 0.0);
    }

    let first_dot = dots[0];
    let mut min_x = first_dot.x - first_dot.radius;
    let mut min_y = first_dot.y - first_dot.radius;
    let mut max_x = first_dot.x + first_dot.radius;
    let mut max_y = first_dot.y + first_dot.radius;

    for dot in dots.iter().skip(1) {
        min_x = min_x.min(dot.x - dot.radius);
        min_y = min_y.min(dot.y - dot.radius);
        max_x = max_x.max(dot.x + dot.radius);
        max_y = max_y.max(dot.y + dot.radius);
    }

    (min_x, min_y, max_x, max_y)
}

/// Generate SVG content with color grouping for optimization
fn generate_grouped_svg_content(dots: &[&Dot], config: &SvgDotConfig, svg: &mut String) {
    // Group dots by similar colors
    let color_groups = group_dots_by_color(dots, config.color_similarity_threshold);

    for (base_color, group_dots) in color_groups {
        if group_dots.is_empty() {
            continue;
        }

        // Start group
        if config.compact_output {
            write!(svg, r#"<g fill="{base_color}">"#).unwrap();
        } else {
            writeln!(svg, r#"  <g fill="{base_color}">"#).unwrap();
        }

        // Add all dots in this color group
        for dot in group_dots {
            write_circle_element(dot, config, svg, true);
        }

        // End group
        if config.compact_output {
            svg.push_str("</g>");
        } else {
            svg.push_str("  </g>\n");
        }
    }
}

/// Generate SVG content without grouping (individual dots)
fn generate_individual_svg_content(dots: &[&Dot], config: &SvgDotConfig, svg: &mut String) {
    for dot in dots {
        write_circle_element(dot, config, svg, false);
    }
}

/// Write a single circle element to the SVG string
fn write_circle_element(dot: &Dot, config: &SvgDotConfig, svg: &mut String, in_group: bool) {
    let indent = if config.compact_output {
        ""
    } else if in_group {
        "    "
    } else {
        "  "
    };

    write!(
        svg,
        r#"{}<circle cx="{:.prec$}" cy="{:.prec$}" r="{:.prec$}""#,
        indent,
        dot.x,
        dot.y,
        dot.radius,
        prec = config.precision as usize
    )
    .unwrap();

    // Add fill if not in a group
    if !in_group {
        write!(svg, r#" fill="{}""#, dot.color).unwrap();
    }

    // Add opacity if enabled and not full opacity
    if config.use_opacity && (dot.opacity - 1.0).abs() > 0.01 {
        write!(
            svg,
            r#" opacity="{:.prec$}""#,
            dot.opacity,
            prec = config.precision as usize
        )
        .unwrap();
    }

    if config.compact_output {
        svg.push_str("/>");
    } else {
        svg.push_str(" />\n");
    }
}

/// Group dots by similar colors for optimization
fn group_dots_by_color<'a>(
    dots: &'a [&'a Dot],
    similarity_threshold: f32,
) -> Vec<(String, Vec<&'a Dot>)> {
    let mut color_groups: Vec<(String, Vec<&'a Dot>)> = Vec::new();

    for &dot in dots {
        let mut found_group = false;

        // Try to find an existing similar color group
        for (base_color, group) in &mut color_groups {
            if colors_are_similar(base_color, &dot.color, similarity_threshold) {
                group.push(dot);
                found_group = true;
                break;
            }
        }

        // Create new group if no similar color found
        if !found_group {
            color_groups.push((dot.color.clone(), vec![dot]));
        }
    }

    // Sort groups by size (largest first) for better optimization
    color_groups.sort_by(|a, b| b.1.len().cmp(&a.1.len()));

    color_groups
}

/// Check if two hex colors are similar based on threshold
fn colors_are_similar(color1: &str, color2: &str, threshold: f32) -> bool {
    if color1 == color2 {
        return true;
    }

    if threshold >= 1.0 {
        return true; // All colors considered similar
    }

    if threshold <= 0.0 {
        return color1 == color2; // Only exact matches
    }

    // Parse hex colors
    let rgb1 = parse_hex_color(color1);
    let rgb2 = parse_hex_color(color2);

    if let (Some((r1, g1, b1)), Some((r2, g2, b2))) = (rgb1, rgb2) {
        // Calculate color distance in RGB space
        let dr = (r1 as f32 - r2 as f32) / 255.0;
        let dg = (g1 as f32 - g2 as f32) / 255.0;
        let db = (b1 as f32 - b2 as f32) / 255.0;

        let distance = (dr * dr + dg * dg + db * db).sqrt();
        let max_distance = 3f32.sqrt(); // Maximum possible distance in RGB space

        let similarity = 1.0 - (distance / max_distance);
        similarity >= threshold
    } else {
        false // Could not parse colors
    }
}

/// Parse hex color string to RGB values
fn parse_hex_color(hex: &str) -> Option<(u8, u8, u8)> {
    if !hex.starts_with('#') || hex.len() != 7 {
        return None;
    }

    let hex = &hex[1..]; // Remove '#'

    // Validate hex characters before parsing
    if !hex.chars().all(|c| c.is_ascii_hexdigit()) {
        return None;
    }

    let r = u8::from_str_radix(&hex[0..2], 16).ok()?;
    let g = u8::from_str_radix(&hex[2..4], 16).ok()?;
    let b = u8::from_str_radix(&hex[4..6], 16).ok()?;

    Some((r, g, b))
}

/// Convert dots to SvgPath structures for integration with existing SVG infrastructure
///
/// This function converts dots to the existing SvgPath format used throughout the codebase,
/// enabling integration with existing SVG generation and processing pipelines.
///
/// # Arguments
/// * `dots` - Slice of dots to convert
///
/// # Returns
/// Vector of SvgPath structures compatible with existing SVG generation functions
pub fn dots_to_svg_paths(dots: &[Dot]) -> Vec<SvgPath> {
    dots.iter()
        .filter(|dot| dot.opacity > 0.0 && dot.radius > 0.0)
        .map(|dot| {
            SvgPath {
                data: String::new(), // Not used for circles
                fill: dot.color.clone(),
                stroke: "none".to_string(),
                stroke_width: 0.0,
                element_type: SvgElementType::Circle {
                    cx: dot.x,
                    cy: dot.y,
                    r: dot.radius,
                },
            }
        })
        .collect()
}

/// Generate complete SVG document from dots using existing infrastructure
///
/// This function integrates with the existing SVG generation system in svg.rs,
/// allowing dots to be rendered using the same pipeline as other vectorization results.
///
/// # Arguments
/// * `dots` - Slice of dots to render
/// * `width` - SVG viewport width
/// * `height` - SVG viewport height
/// * `svg_config` - SVG generation configuration from the main SVG module
///
/// # Returns
/// Complete SVG document string
pub fn generate_dot_svg_document(
    dots: &[Dot],
    width: u32,
    height: u32,
    svg_config: &crate::config::SvgConfig,
) -> String {
    let svg_paths = dots_to_svg_paths(dots);
    crate::svg::generate_svg_document(&svg_paths, width, height, svg_config)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Create test dots for validation
    fn create_test_dots() -> Vec<Dot> {
        vec![
            Dot::new(10.0, 10.0, 2.0, 1.0, "#ff0000".to_string()),
            Dot::new(20.0, 20.0, 1.5, 0.8, "#00ff00".to_string()),
            Dot::new(30.0, 30.0, 3.0, 0.6, "#0000ff".to_string()),
            Dot::new(40.0, 40.0, 2.5, 0.4, "#ff0000".to_string()), // Similar to first
        ]
    }

    /// Create large test dataset
    fn create_large_test_dots() -> Vec<Dot> {
        (0..100)
            .map(|i| {
                let x = (i % 10) as f32 * 10.0;
                let y = (i / 10) as f32 * 10.0;
                let color = match i % 3 {
                    0 => "#ff0000",
                    1 => "#00ff00",
                    _ => "#0000ff",
                };
                Dot::new(x, y, 2.0, 0.8, color.to_string())
            })
            .collect()
    }

    #[test]
    fn test_svg_element_from_dot() {
        let dot = Dot::new(25.0, 35.0, 3.5, 0.75, "#123456".to_string());
        let element = SvgElement::from_dot(&dot);

        assert_eq!(element.fill, "#123456");
        assert_eq!(element.opacity, 0.75);

        if let SvgElementType::Circle { cx, cy, r } = element.element_type {
            assert_eq!(cx, 25.0);
            assert_eq!(cy, 35.0);
            assert_eq!(r, 3.5);
        } else {
            panic!("Expected Circle element type");
        }
    }

    #[test]
    fn test_dots_to_svg_elements() {
        let dots = create_test_dots();
        let elements = dots_to_svg_elements(&dots);

        assert_eq!(elements.len(), 4);

        // Test first element
        assert_eq!(elements[0].fill, "#ff0000");
        assert_eq!(elements[0].opacity, 1.0);
        if let SvgElementType::Circle { cx, cy, r } = elements[0].element_type {
            assert_eq!(cx, 10.0);
            assert_eq!(cy, 10.0);
            assert_eq!(r, 2.0);
        } else {
            panic!("Expected Circle element type");
        }
    }

    #[test]
    fn test_dots_to_svg_elements_filtering() {
        let mut dots = create_test_dots();
        // Add invalid dots
        dots.push(Dot::new(50.0, 50.0, 0.0, 1.0, "#ffffff".to_string())); // Zero radius
        dots.push(Dot::new(60.0, 60.0, 2.0, 0.0, "#ffffff".to_string())); // Zero opacity

        let elements = dots_to_svg_elements(&dots);

        // Should filter out invalid dots
        assert_eq!(elements.len(), 4); // Original 4 valid dots
    }

    #[test]
    fn test_calculate_bounding_box() {
        let dots = create_test_dots();
        let dot_refs: Vec<&Dot> = dots.iter().collect();
        let (min_x, min_y, max_x, max_y) = calculate_bounding_box(&dot_refs);

        // Dot positions: (10,10,r2), (20,20,r1.5), (30,30,r3), (40,40,r2.5)
        // Bounds: (8,8) to (42.5,42.5)
        assert_eq!(min_x, 8.0); // 10 - 2
        assert_eq!(min_y, 8.0); // 10 - 2
        assert_eq!(max_x, 42.5); // 40 + 2.5
        assert_eq!(max_y, 42.5); // 40 + 2.5
    }

    #[test]
    fn test_calculate_bounding_box_empty() {
        let dots: Vec<&Dot> = Vec::new();
        let (min_x, min_y, max_x, max_y) = calculate_bounding_box(&dots);
        assert_eq!((min_x, min_y, max_x, max_y), (0.0, 0.0, 0.0, 0.0));
    }

    #[test]
    fn test_parse_hex_color() {
        assert_eq!(parse_hex_color("#ff0000"), Some((255, 0, 0)));
        assert_eq!(parse_hex_color("#00ff00"), Some((0, 255, 0)));
        assert_eq!(parse_hex_color("#0000ff"), Some((0, 0, 255)));
        assert_eq!(parse_hex_color("#123456"), Some((18, 52, 86)));

        // Invalid formats
        assert_eq!(parse_hex_color("ff0000"), None); // Missing #
        assert_eq!(parse_hex_color("#ff00"), None); // Too short
        assert_eq!(parse_hex_color("#ff0000x"), None); // Too long
        assert_eq!(parse_hex_color("#ggffff"), None); // Invalid hex
    }

    #[test]
    fn test_colors_are_similar() {
        // Identical colors
        assert!(colors_are_similar("#ff0000", "#ff0000", 0.5));

        // Very similar colors (high threshold)
        assert!(colors_are_similar("#ff0000", "#fe0000", 0.99));

        // Different colors (low threshold)
        assert!(!colors_are_similar("#ff0000", "#00ff00", 0.5));

        // Edge cases
        assert!(colors_are_similar("#ff0000", "#00ff00", 1.0)); // Threshold 1.0 = all similar
        assert!(!colors_are_similar("#ff0000", "#fe0000", 0.0)); // Threshold 0.0 = exact match only

        // Invalid colors
        assert!(!colors_are_similar("invalid", "#ff0000", 0.5));
        assert!(!colors_are_similar("#ff0000", "invalid", 0.5));
    }

    #[test]
    fn test_group_dots_by_color() {
        let dots = create_test_dots();
        let dot_refs: Vec<&Dot> = dots.iter().collect();

        // High similarity threshold should group similar colors
        let groups = group_dots_by_color(&dot_refs, 0.99);

        // Two red dots should be grouped, plus blue and green = 3 groups
        assert_eq!(groups.len(), 3);

        // Verify total dots count is preserved
        let total_dots: usize = groups.iter().map(|(_, group)| group.len()).sum();
        assert_eq!(total_dots, 4);

        // Find red group (should have 2 dots)
        let red_group = groups.iter().find(|(color, _)| color == "#ff0000").unwrap();
        assert_eq!(red_group.1.len(), 2);

        // Low similarity threshold should create separate groups (exact match only)
        let groups_low = group_dots_by_color(&dot_refs, 0.0);

        // The test dots have two identical red colors, so at 0.0 threshold we should have 3 groups, not 4
        assert_eq!(groups_low.len(), 3); // Two red dots in one group, plus green and blue
    }

    #[test]
    fn test_optimize_dot_svg() {
        let dots = create_test_dots();
        let svg = optimize_dot_svg(&dots);

        // Should contain SVG structure
        assert!(svg.contains("<svg"));
        assert!(svg.contains("</svg>"));
        assert!(svg.contains("xmlns=\"http://www.w3.org/2000/svg\""));

        // Should contain circle elements
        assert!(svg.contains("<circle"));
        assert!(svg.contains("cx=\""));
        assert!(svg.contains("cy=\""));
        assert!(svg.contains("r=\""));

        // Should contain colors
        assert!(svg.contains("#ff0000") || svg.contains("fill=\"#ff0000\""));
        assert!(svg.contains("#00ff00") || svg.contains("fill=\"#00ff00\""));
        assert!(svg.contains("#0000ff") || svg.contains("fill=\"#0000ff\""));
    }

    #[test]
    fn test_dots_to_svg_with_config_empty() {
        let dots: Vec<Dot> = Vec::new();
        let config = SvgDotConfig::default();
        let svg = dots_to_svg_with_config(&dots, &config);

        assert!(svg.is_empty());
    }

    #[test]
    fn test_dots_to_svg_with_config_filtering() {
        let dots = vec![
            Dot::new(10.0, 10.0, 2.0, 1.0, "#ff0000".to_string()),
            Dot::new(20.0, 20.0, 1.5, 0.05, "#00ff00".to_string()), // Below threshold
        ];

        let config = SvgDotConfig {
            min_opacity_threshold: 0.1,
            ..Default::default()
        };

        let svg = dots_to_svg_with_config(&dots, &config);

        // Should only contain the first dot
        assert!(svg.contains("#ff0000"));
        assert!(!svg.contains("#00ff00"));
    }

    #[test]
    fn test_dots_to_svg_with_config_compact() {
        let dots = vec![Dot::new(10.0, 10.0, 2.0, 1.0, "#ff0000".to_string())];

        let config_compact = SvgDotConfig {
            compact_output: true,
            ..Default::default()
        };

        let config_normal = SvgDotConfig {
            compact_output: false,
            ..Default::default()
        };

        let svg_compact = dots_to_svg_with_config(&dots, &config_compact);
        let svg_normal = dots_to_svg_with_config(&dots, &config_normal);

        // Compact should be smaller
        assert!(svg_compact.len() < svg_normal.len());

        // Compact should not contain newlines (except in viewBox values)
        let compact_content = svg_compact.replace(
            svg_compact
                .split("viewBox=")
                .nth(1)
                .unwrap()
                .split('"')
                .next()
                .unwrap(),
            "",
        );
        assert!(!compact_content.contains('\n'));
    }

    #[test]
    fn test_dots_to_svg_with_config_grouping() {
        let dots = vec![
            Dot::new(10.0, 10.0, 2.0, 1.0, "#ff0000".to_string()),
            Dot::new(20.0, 20.0, 1.5, 0.8, "#ff0000".to_string()), // Same color
            Dot::new(30.0, 30.0, 3.0, 0.6, "#00ff00".to_string()),
        ];

        let config_grouped = SvgDotConfig {
            group_similar_colors: true,
            ..Default::default()
        };

        let config_individual = SvgDotConfig {
            group_similar_colors: false,
            ..Default::default()
        };

        let svg_grouped = dots_to_svg_with_config(&dots, &config_grouped);
        let svg_individual = dots_to_svg_with_config(&dots, &config_individual);

        // Grouped should contain <g> elements
        assert!(svg_grouped.contains("<g fill="));
        assert!(svg_grouped.contains("</g>"));

        // Individual should not contain <g> elements
        assert!(!svg_individual.contains("<g"));
        assert!(!svg_individual.contains("</g>"));
    }

    #[test]
    fn test_dots_to_svg_with_config_opacity() {
        let dots = vec![Dot::new(10.0, 10.0, 2.0, 0.5, "#ff0000".to_string())];

        let config_opacity = SvgDotConfig {
            use_opacity: true,
            ..Default::default()
        };

        let config_no_opacity = SvgDotConfig {
            use_opacity: false,
            ..Default::default()
        };

        let svg_opacity = dots_to_svg_with_config(&dots, &config_opacity);
        let svg_no_opacity = dots_to_svg_with_config(&dots, &config_no_opacity);

        // With opacity should contain opacity attribute
        assert!(svg_opacity.contains("opacity="));

        // Without opacity should not contain opacity attribute
        assert!(!svg_no_opacity.contains("opacity="));
    }

    #[test]
    fn test_dots_to_svg_with_config_precision() {
        let dots = vec![Dot::new(
            10.123456,
            20.789012,
            2.345678,
            1.0,
            "#ff0000".to_string(),
        )];

        let config_low = SvgDotConfig {
            precision: 1,
            ..Default::default()
        };

        let config_high = SvgDotConfig {
            precision: 4,
            ..Default::default()
        };

        let svg_low = dots_to_svg_with_config(&dots, &config_low);
        let svg_high = dots_to_svg_with_config(&dots, &config_high);

        // Low precision should have fewer decimal places
        assert!(svg_low.contains("10.1"));
        assert!(svg_low.contains("20.8"));
        assert!(svg_low.contains("2.3"));

        // High precision should have more decimal places
        assert!(svg_high.contains("10.1235"));
        assert!(svg_high.contains("20.7890"));
        assert!(svg_high.contains("2.3457"));
    }

    #[test]
    fn test_dots_to_svg_paths() {
        let dots = create_test_dots();
        let paths = dots_to_svg_paths(&dots);

        assert_eq!(paths.len(), 4);

        // Test first path
        assert_eq!(paths[0].fill, "#ff0000");
        assert_eq!(paths[0].stroke, "none");
        assert_eq!(paths[0].stroke_width, 0.0);
        assert!(paths[0].data.is_empty()); // Not used for circles

        if let SvgElementType::Circle { cx, cy, r } = paths[0].element_type {
            assert_eq!(cx, 10.0);
            assert_eq!(cy, 10.0);
            assert_eq!(r, 2.0);
        } else {
            panic!("Expected Circle element type");
        }
    }

    #[test]
    fn test_dots_to_svg_paths_filtering() {
        let mut dots = create_test_dots();
        dots.push(Dot::new(50.0, 50.0, 0.0, 1.0, "#ffffff".to_string())); // Zero radius
        dots.push(Dot::new(60.0, 60.0, 2.0, 0.0, "#ffffff".to_string())); // Zero opacity

        let paths = dots_to_svg_paths(&dots);

        // Should filter out invalid dots
        assert_eq!(paths.len(), 4);
    }

    #[test]
    fn test_svg_dot_config_defaults() {
        let config = SvgDotConfig::default();

        assert!(config.group_similar_colors);
        assert!(config.use_opacity);
        assert!(!config.compact_output);
        assert_eq!(config.precision, 2);
        assert_eq!(config.color_similarity_threshold, 0.95);
        assert_eq!(config.min_opacity_threshold, 0.1);
    }

    #[test]
    fn test_large_dataset_performance() {
        let dots = create_large_test_dots();
        let config = SvgDotConfig::default();

        // This should complete without panic or excessive memory usage
        let svg = dots_to_svg_with_config(&dots, &config);

        assert!(svg.contains("<svg"));
        assert!(svg.contains("</svg>"));
        assert!(svg.len() > 1000); // Should generate substantial content

        // Should use grouping for efficiency
        assert!(svg.contains("<g fill="));
    }

    #[test]
    fn test_edge_cases() {
        // Single dot
        let single_dot = vec![Dot::new(0.0, 0.0, 1.0, 1.0, "#000000".to_string())];
        let svg = optimize_dot_svg(&single_dot);
        assert!(svg.contains("<circle"));

        // Very small dot - use opacity above min_opacity_threshold (0.1)
        let tiny_dot = vec![Dot::new(0.0, 0.0, 0.01, 0.5, "#000000".to_string())];
        let svg_tiny = optimize_dot_svg(&tiny_dot);
        assert!(svg_tiny.contains("r=\"0.01\""));

        // Very large coordinates
        let large_dot = vec![Dot::new(1000.0, 2000.0, 10.0, 1.0, "#ffffff".to_string())];
        let svg_large = optimize_dot_svg(&large_dot);
        assert!(svg_large.contains("cx=\"1000"));
        assert!(svg_large.contains("cy=\"2000"));
    }
}
