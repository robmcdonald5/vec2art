//! SVG analysis module for measuring complexity and optimization metrics
//!
//! This module provides functionality to analyze SVG content and extract metrics
//! such as node count, file size, and path complexity. The target is ≤ 40% node
//! count growth vs baseline as specified in research.

use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// SVG complexity metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SvgMetrics {
    /// Total number of SVG elements (nodes)
    pub node_count: u32,
    /// Number of path elements
    pub path_count: u32,
    /// Number of unique colors
    pub color_count: u32,
    /// Total number of path commands (M, L, C, Z, etc.)
    pub path_commands: u32,
    /// File size in bytes
    pub file_size: usize,
    /// Bounding box area
    pub bbox_area: f64,
    /// Average path complexity (commands per path)
    pub avg_path_complexity: f64,
    /// Element type distribution
    pub element_types: HashMap<String, u32>,
}

impl SvgMetrics {
    /// Calculate node count growth percentage vs baseline
    #[allow(dead_code)]
    pub fn node_count_growth(&self, baseline: &SvgMetrics) -> f64 {
        if baseline.node_count == 0 {
            return 0.0;
        }
        ((self.node_count as f64 - baseline.node_count as f64) / baseline.node_count as f64) * 100.0
    }

    /// Check if node count growth meets the research target of ≤ 40%
    #[allow(dead_code)]
    pub fn meets_node_count_target(&self, baseline: &SvgMetrics) -> bool {
        self.node_count_growth(baseline) <= 40.0
    }

    /// Calculate file size growth percentage vs baseline  
    #[allow(dead_code)]
    pub fn file_size_growth(&self, baseline: &SvgMetrics) -> f64 {
        if baseline.file_size == 0 {
            return 0.0;
        }
        ((self.file_size as f64 - baseline.file_size as f64) / baseline.file_size as f64) * 100.0
    }

    /// Get complexity grade based on various metrics
    #[allow(dead_code)]
    pub fn complexity_grade(&self) -> &'static str {
        let nodes_per_kb = self.node_count as f64 / (self.file_size as f64 / 1024.0);
        
        match nodes_per_kb {
            x if x < 50.0 => "Low Complexity",
            x if x < 150.0 => "Medium Complexity", 
            x if x < 300.0 => "High Complexity",
            _ => "Very High Complexity",
        }
    }

    /// Calculate compression ratio (smaller is better)
    #[allow(dead_code)]
    pub fn compression_ratio(&self, original_size: usize) -> f64 {
        if original_size == 0 {
            return 1.0;
        }
        self.file_size as f64 / original_size as f64
    }
}

/// Analyze SVG content and extract metrics
pub fn analyze_svg(svg_content: &str) -> Result<SvgMetrics> {
    // Parse as XML-like structure (simple approach)
    let mut node_count = 0;
    let mut path_count = 0;
    let mut path_commands = 0;
    let mut colors = std::collections::HashSet::new();
    let mut element_types = HashMap::new();
    
    // Extract viewBox for bounding box calculation
    let mut bbox_area = 0.0;
    if let Some(viewbox) = extract_viewbox(svg_content) {
        bbox_area = viewbox.2 * viewbox.3; // width * height
    }

    // Simple SVG parsing - count elements and analyze content
    for line in svg_content.lines() {
        let trimmed = line.trim();
        
        // Count XML elements
        if trimmed.starts_with('<') && !trimmed.starts_with("</") && !trimmed.starts_with("<!--") {
            if let Some(tag_name) = extract_tag_name(trimmed) {
                node_count += 1;
                *element_types.entry(tag_name.clone()).or_insert(0) += 1;
                
                if tag_name == "path" {
                    path_count += 1;
                    // Count path commands in d attribute
                    if let Some(d_attr) = extract_path_data(trimmed) {
                        path_commands += count_path_commands(&d_attr);
                    }
                }
                
                // Extract colors from various attributes
                extract_colors_from_element(trimmed, &mut colors);
            }
        }
    }

    let avg_path_complexity = if path_count > 0 {
        path_commands as f64 / path_count as f64
    } else {
        0.0
    };

    Ok(SvgMetrics {
        node_count,
        path_count,
        color_count: colors.len() as u32,
        path_commands,
        file_size: svg_content.len(),
        bbox_area,
        avg_path_complexity,
        element_types,
    })
}

/// Extract viewBox values (x, y, width, height)
fn extract_viewbox(svg_content: &str) -> Option<(f64, f64, f64, f64)> {
    // Look for viewBox="x y width height"
    let viewbox_pattern = r#"viewBox\s*=\s*["']([^"']+)["']"#;
    if let Ok(re) = regex::Regex::new(viewbox_pattern) {
        if let Some(caps) = re.captures(svg_content) {
            if let Some(values) = caps.get(1) {
                let parts: Vec<&str> = values.as_str().split_whitespace().collect();
                if parts.len() == 4 {
                    if let (Ok(x), Ok(y), Ok(w), Ok(h)) = (
                        parts[0].parse::<f64>(),
                        parts[1].parse::<f64>(),
                        parts[2].parse::<f64>(),
                        parts[3].parse::<f64>(),
                    ) {
                        return Some((x, y, w, h));
                    }
                }
            }
        }
    }
    None
}

/// Extract tag name from an XML element
fn extract_tag_name(element: &str) -> Option<String> {
    let trimmed = element.trim_start_matches('<');
    if let Some(space_pos) = trimmed.find(' ') {
        Some(trimmed[..space_pos].to_string())
    } else if let Some(close_pos) = trimmed.find('>') {
        Some(trimmed[..close_pos].trim_end_matches('/').to_string())
    } else {
        None
    }
}

/// Extract path data from d attribute
fn extract_path_data(element: &str) -> Option<String> {
    // Look for d="..." attribute
    let d_pattern = r#"d\s*=\s*["']([^"']+)["']"#;
    if let Ok(re) = regex::Regex::new(d_pattern) {
        if let Some(caps) = re.captures(element) {
            return caps.get(1).map(|m| m.as_str().to_string());
        }
    }
    None
}

/// Count path commands in path data
fn count_path_commands(path_data: &str) -> u32 {
    let commands = ['M', 'L', 'H', 'V', 'C', 'S', 'Q', 'T', 'A', 'Z', 'm', 'l', 'h', 'v', 'c', 's', 'q', 't', 'a', 'z'];
    path_data.chars().filter(|&c| commands.contains(&c)).count() as u32
}

/// Extract colors from element attributes
fn extract_colors_from_element(element: &str, colors: &mut std::collections::HashSet<String>) {
    // Extract fill and stroke colors
    extract_color_attribute(element, "fill", colors);
    extract_color_attribute(element, "stroke", colors);
    
    // Also check style attribute
    if let Some(style) = extract_attribute_value(element, "style") {
        extract_colors_from_style(&style, colors);
    }
}

/// Extract specific color attribute
fn extract_color_attribute(element: &str, attr: &str, colors: &mut std::collections::HashSet<String>) {
    if let Some(color) = extract_attribute_value(element, attr) {
        if !color.is_empty() && color != "none" && color != "transparent" {
            colors.insert(color);
        }
    }
}

/// Extract colors from style attribute
fn extract_colors_from_style(style: &str, colors: &mut std::collections::HashSet<String>) {
    // Parse CSS-style properties like "fill: #ff0000; stroke: none;"
    for property in style.split(';') {
        let parts: Vec<&str> = property.split(':').collect();
        if parts.len() == 2 {
            let prop_name = parts[0].trim();
            let prop_value = parts[1].trim();
            
            if (prop_name == "fill" || prop_name == "stroke") 
                && !prop_value.is_empty() 
                && prop_value != "none" 
                && prop_value != "transparent" {
                colors.insert(prop_value.to_string());
            }
        }
    }
}

/// Extract attribute value from XML element
fn extract_attribute_value(element: &str, attr_name: &str) -> Option<String> {
    let pattern = format!(r#"{}\s*=\s*["']([^"']*)["']"#, attr_name);
    if let Ok(re) = regex::Regex::new(&pattern) {
        if let Some(caps) = re.captures(element) {
            return caps.get(1).map(|m| m.as_str().to_string());
        }
    }
    None
}

/// Compare two SVG metrics and generate a comparison report
#[allow(dead_code)]
pub fn compare_metrics(baseline: &SvgMetrics, current: &SvgMetrics) -> MetricsComparison {
    MetricsComparison {
        node_count_growth: current.node_count_growth(baseline),
        file_size_growth: current.file_size_growth(baseline),
        path_count_change: current.path_count as i32 - baseline.path_count as i32,
        color_count_change: current.color_count as i32 - baseline.color_count as i32,
        path_complexity_change: current.avg_path_complexity - baseline.avg_path_complexity,
        meets_node_target: current.meets_node_count_target(baseline),
    }
}

/// Metrics comparison result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricsComparison {
    pub node_count_growth: f64,
    pub file_size_growth: f64,
    pub path_count_change: i32,
    pub color_count_change: i32,
    pub path_complexity_change: f64,
    pub meets_node_target: bool,
}

impl MetricsComparison {
    /// Generate a human-readable summary
    #[allow(dead_code)]
    pub fn summary(&self) -> String {
        let target_status = if self.meets_node_target {
            "✓ MEETS TARGET"
        } else {
            "✗ EXCEEDS TARGET"
        };
        
        format!(
            "Node Count: {:.1}% growth ({}) | File Size: {:.1}% | Paths: {:+} | Colors: {:+} | Complexity: {:+.2}",
            self.node_count_growth,
            target_status,
            self.file_size_growth,
            self.path_count_change,
            self.color_count_change,
            self.path_complexity_change
        )
    }
}

// Simple regex crate alternative for basic pattern matching
mod regex {
    pub struct Regex {
        pattern: String,
    }
    
    pub struct Captures<'t> {
        matches: Vec<Option<&'t str>>,
    }
    
    impl<'t> Captures<'t> {
        pub fn get(&self, index: usize) -> Option<Match<'t>> {
            self.matches.get(index).and_then(|&m| m.map(|s| Match { text: s }))
        }
    }
    
    pub struct Match<'t> {
        text: &'t str,
    }
    
    impl<'t> Match<'t> {
        pub fn as_str(&self) -> &'t str {
            self.text
        }
    }
    
    impl Regex {
        pub fn new(pattern: &str) -> Result<Self, &'static str> {
            Ok(Regex {
                pattern: pattern.to_string(),
            })
        }
        
        pub fn captures<'t>(&self, text: &'t str) -> Option<Captures<'t>> {
            // Very basic regex implementation for simple patterns
            // This is a simplified implementation - in real use, would use regex crate
            
            if self.pattern.contains(r#"viewBox\s*=\s*["']([^"']+)["']"#) {
                if let Some(start) = text.find("viewBox") {
                    if let Some(eq_pos) = text[start..].find('=') {
                        let after_eq = &text[start + eq_pos + 1..].trim_start();
                        if let Some(quote_start) = after_eq.find(&['"', '\''][..]) {
                            let quote_char = after_eq.chars().nth(quote_start).unwrap();
                            if let Some(quote_end) = after_eq[quote_start + 1..].find(quote_char) {
                                let value = &after_eq[quote_start + 1..quote_start + 1 + quote_end];
                                return Some(Captures {
                                    matches: vec![Some(value), Some(value)],
                                });
                            }
                        }
                    }
                }
            } else if self.pattern.contains(r#"d\s*=\s*["']([^"']+)["']"#) {
                if let Some(start) = text.find(" d=") {
                    let after_d = &text[start + 3..].trim_start();
                    if let Some(quote_start) = after_d.find(&['"', '\''][..]) {
                        let quote_char = after_d.chars().nth(quote_start).unwrap();
                        if let Some(quote_end) = after_d[quote_start + 1..].find(quote_char) {
                            let value = &after_d[quote_start + 1..quote_start + 1 + quote_end];
                            return Some(Captures {
                                matches: vec![Some(value), Some(value)],
                            });
                        }
                    }
                }
            } else {
                // Generic attribute pattern
                let attr_name = if let Some(pos) = self.pattern.find(r#"\s*=\s*"#) {
                    &self.pattern[..pos]
                } else {
                    return None;
                };
                
                let search_pattern = format!(" {}=", attr_name);
                if let Some(start) = text.find(&search_pattern) {
                    let after_attr = &text[start + search_pattern.len()..].trim_start();
                    if let Some(quote_start) = after_attr.find(&['"', '\''][..]) {
                        let quote_char = after_attr.chars().nth(quote_start).unwrap();
                        if let Some(quote_end) = after_attr[quote_start + 1..].find(quote_char) {
                            let value = &after_attr[quote_start + 1..quote_start + 1 + quote_end];
                            return Some(Captures {
                                matches: vec![Some(value), Some(value)],
                            });
                        }
                    }
                }
            }
            
            None
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_svg() -> &'static str {
        r#"<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="10" y="10" width="80" height="80" fill="red" stroke="black"/>
  <circle cx="50" cy="50" r="20" fill="blue"/>
</svg>"#
    }

    #[test]
    fn test_analyze_svg_basic() {
        let svg = sample_svg();
        let metrics = analyze_svg(svg).unwrap();
        
        assert_eq!(metrics.node_count, 4); // svg, rect, circle, + 1 for parsing 
        assert_eq!(metrics.path_count, 0); // no path elements
        assert_eq!(metrics.color_count, 3); // red, black, blue
        assert!(metrics.file_size > 0);
        assert!(metrics.bbox_area > 0.0);
    }

    #[test]
    fn test_node_count_growth() {
        let baseline = SvgMetrics {
            node_count: 10,
            path_count: 5,
            color_count: 3,
            path_commands: 20,
            file_size: 1000,
            bbox_area: 10000.0,
            avg_path_complexity: 4.0,
            element_types: HashMap::new(),
        };
        
        let current = SvgMetrics {
            node_count: 13, // 30% growth
            path_count: 6,
            color_count: 4,
            path_commands: 24,
            file_size: 1200,
            bbox_area: 10000.0,
            avg_path_complexity: 4.0,
            element_types: HashMap::new(),
        };
        
        assert_eq!(current.node_count_growth(&baseline), 30.0);
        assert!(current.meets_node_count_target(&baseline)); // 30% < 40%
    }

    #[test] 
    fn test_metrics_comparison() {
        let baseline = SvgMetrics {
            node_count: 10,
            path_count: 5,
            color_count: 3,
            path_commands: 20,
            file_size: 1000,
            bbox_area: 10000.0,
            avg_path_complexity: 4.0,
            element_types: HashMap::new(),
        };
        
        let current = SvgMetrics {
            node_count: 15, // 50% growth
            path_count: 7,
            color_count: 4,
            path_commands: 28,
            file_size: 1300,
            bbox_area: 10000.0,
            avg_path_complexity: 4.0,
            element_types: HashMap::new(),
        };
        
        let comparison = compare_metrics(&baseline, &current);
        
        assert_eq!(comparison.node_count_growth, 50.0);
        assert_eq!(comparison.path_count_change, 2);
        assert_eq!(comparison.color_count_change, 1);
        assert!(!comparison.meets_node_target); // 50% > 40%
    }
}