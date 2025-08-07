use crate::algorithms::SvgPath;
use svg::node::element::path::Data;
use svg::node::element::{Circle, Ellipse, Group, Path, Polygon, Rectangle, Style};
use svg::Document;
use std::collections::HashMap;
use std::fmt::Write;

/// Builder for creating SVG documents
pub struct SvgBuilder {
    document: Document,
    width: u32,
    height: u32,
}

/// Optimized SVG builder with path consolidation and style optimization
pub struct OptimizedSvgBuilder {
    width: u32,
    height: u32,
    paths_by_style: HashMap<String, Vec<String>>,
    use_css_classes: bool,
    precision: usize,
    merge_threshold: f32,
}

impl SvgBuilder {
    /// Create a new SVG builder with specified dimensions
    pub fn new(width: u32, height: u32) -> Self {
        let document = Document::new()
            .set("width", width)
            .set("height", height)
            .set("viewBox", format!("0 0 {} {}", width, height))
            .set("xmlns", "http://www.w3.org/2000/svg")
            .set("xmlns:xlink", "http://www.w3.org/1999/xlink");

        Self {
            document,
            width,
            height,
        }
    }

    /// Add metadata to the SVG
    pub fn with_metadata(mut self, title: &str, description: &str) -> Self {
        use svg::node::element::{Description, Title};

        self.document = self
            .document
            .add(Title::new(title))
            .add(Description::new().add(svg::node::Text::new(description)));

        self
    }

    /// Add a background rectangle
    pub fn with_background(mut self, color: &str) -> Self {
        let rect = Rectangle::new()
            .set("x", 0)
            .set("y", 0)
            .set("width", self.width)
            .set("height", self.height)
            .set("fill", color);

        self.document = self.document.add(rect);
        self
    }

    /// Add a path element from SvgPath structure
    pub fn add_path(&mut self, svg_path: &SvgPath) -> &mut Self {
        if svg_path.points.is_empty() {
            return self;
        }

        let path_data = svg_path.to_path_data();

        let mut path = Path::new()
            .set("d", path_data)
            .set("stroke-width", svg_path.stroke_width);

        if let Some(ref stroke) = svg_path.stroke_color {
            path = path.set("stroke", stroke.as_str());
        } else {
            path = path.set("stroke", "none");
        }

        if let Some(ref fill) = svg_path.fill_color {
            path = path.set("fill", fill.as_str());
        } else {
            path = path.set("fill", "none");
        }

        self.document = self.document.clone().add(path);
        self
    }

    /// Add multiple paths at once
    pub fn add_paths(&mut self, paths: &[SvgPath]) -> &mut Self {
        for path in paths {
            self.add_path(path);
        }
        self
    }

    /// Add a polyline from points
    pub fn add_polyline(
        &mut self,
        points: &[(f32, f32)],
        stroke: &str,
        stroke_width: f32,
    ) -> &mut Self {
        if points.is_empty() {
            return self;
        }

        let points_str = points
            .iter()
            .map(|(x, y)| format!("{:.2},{:.2}", x, y))
            .collect::<Vec<_>>()
            .join(" ");

        let polyline = svg::node::element::Polyline::new()
            .set("points", points_str)
            .set("stroke", stroke)
            .set("stroke-width", stroke_width)
            .set("fill", "none");

        self.document = self.document.clone().add(polyline);
        self
    }

    /// Add a circle
    pub fn add_circle(&mut self, cx: f32, cy: f32, r: f32, fill: &str, opacity: f32) -> &mut Self {
        let circle = Circle::new()
            .set("cx", cx)
            .set("cy", cy)
            .set("r", r)
            .set("fill", fill)
            .set("opacity", opacity);

        self.document = self.document.clone().add(circle);
        self
    }

    /// Add a rectangle
    pub fn add_rectangle(
        &mut self,
        x: f32,
        y: f32,
        width: f32,
        height: f32,
        fill: &str,
        opacity: f32,
    ) -> &mut Self {
        let rect = Rectangle::new()
            .set("x", x)
            .set("y", y)
            .set("width", width)
            .set("height", height)
            .set("fill", fill)
            .set("opacity", opacity);

        self.document = self.document.clone().add(rect);
        self
    }

    /// Add a triangle (as polygon)
    pub fn add_triangle(
        &mut self,
        p1: (f32, f32),
        p2: (f32, f32),
        p3: (f32, f32),
        fill: &str,
        opacity: f32,
    ) -> &mut Self {
        let points = format!(
            "{:.2},{:.2} {:.2},{:.2} {:.2},{:.2}",
            p1.0, p1.1, p2.0, p2.1, p3.0, p3.1
        );

        let polygon = Polygon::new()
            .set("points", points)
            .set("fill", fill)
            .set("opacity", opacity);

        self.document = self.document.clone().add(polygon);
        self
    }

    /// Add an ellipse
    pub fn add_ellipse(
        &mut self,
        cx: f32,
        cy: f32,
        rx: f32,
        ry: f32,
        fill: &str,
        opacity: f32,
    ) -> &mut Self {
        let ellipse = Ellipse::new()
            .set("cx", cx)
            .set("cy", cy)
            .set("rx", rx)
            .set("ry", ry)
            .set("fill", fill)
            .set("opacity", opacity);

        self.document = self.document.clone().add(ellipse);
        self
    }

    /// Add a group element
    pub fn start_group(&mut self, id: Option<&str>) -> GroupBuilder {
        GroupBuilder::new(self, id)
    }

    /// Add a Bezier curve path
    pub fn add_bezier_curve(
        &mut self,
        start: (f32, f32),
        control1: (f32, f32),
        control2: (f32, f32),
        end: (f32, f32),
        stroke: &str,
        stroke_width: f32,
    ) -> &mut Self {
        let data = Data::new()
            .move_to(start)
            .cubic_curve_to((control1, control2, end));

        let path = Path::new()
            .set("d", data)
            .set("stroke", stroke)
            .set("stroke-width", stroke_width)
            .set("fill", "none");

        self.document = self.document.clone().add(path);
        self
    }

    /// Add a quadratic Bezier curve
    pub fn add_quadratic_bezier(
        &mut self,
        start: (f32, f32),
        control: (f32, f32),
        end: (f32, f32),
        stroke: &str,
        stroke_width: f32,
    ) -> &mut Self {
        let data = Data::new()
            .move_to(start)
            .quadratic_curve_to((control, end));

        let path = Path::new()
            .set("d", data)
            .set("stroke", stroke)
            .set("stroke-width", stroke_width)
            .set("fill", "none");

        self.document = self.document.clone().add(path);
        self
    }

    /// Build the final SVG string
    pub fn build(self) -> String {
        self.document.to_string()
    }
}

/// Builder for SVG groups
pub struct GroupBuilder<'a> {
    parent: &'a mut SvgBuilder,
    group: Group,
}

impl<'a> GroupBuilder<'a> {
    fn new(parent: &'a mut SvgBuilder, id: Option<&str>) -> Self {
        let mut group = Group::new();

        if let Some(id) = id {
            group = group.set("id", id);
        }

        Self { parent, group }
    }

    /// Set transform on the group
    pub fn with_transform(mut self, transform: &str) -> Self {
        self.group = self.group.set("transform", transform);
        self
    }

    /// Set opacity on the group
    pub fn with_opacity(mut self, opacity: f32) -> Self {
        self.group = self.group.set("opacity", opacity);
        self
    }

    /// Add a path to the group
    pub fn add_path(mut self, svg_path: &SvgPath) -> Self {
        if svg_path.points.is_empty() {
            return self;
        }

        let path_data = svg_path.to_path_data();

        let mut path = Path::new()
            .set("d", path_data)
            .set("stroke-width", svg_path.stroke_width);

        if let Some(ref stroke) = svg_path.stroke_color {
            path = path.set("stroke", stroke.as_str());
        } else {
            path = path.set("stroke", "none");
        }

        if let Some(ref fill) = svg_path.fill_color {
            path = path.set("fill", fill.as_str());
        } else {
            path = path.set("fill", "none");
        }

        self.group = self.group.add(path);
        self
    }

    /// Finish the group and add it to the document
    pub fn end_group(self) -> &'a mut SvgBuilder {
        self.parent.document = self.parent.document.clone().add(self.group);
        self.parent
    }
}

/// Helper function to convert RGB to hex color string
pub fn rgb_to_hex(r: u8, g: u8, b: u8) -> String {
    format!("#{:02x}{:02x}{:02x}", r, g, b)
}

/// Helper function to create a gradient definition
pub fn create_linear_gradient(
    id: &str,
    color1: &str,
    color2: &str,
) -> svg::node::element::LinearGradient {
    use svg::node::element::{LinearGradient, Stop};

    LinearGradient::new()
        .set("id", id)
        .add(Stop::new().set("offset", "0%").set("stop-color", color1))
        .add(Stop::new().set("offset", "100%").set("stop-color", color2))
}

/// Generate SVG string from a collection of SvgPath objects
pub fn generate_svg_from_paths(paths: &[SvgPath], width: u32, height: u32) -> String {
    let mut builder = SvgBuilder::new(width, height).with_metadata(
        "Vec2Art External Algorithm",
        "Vector graphics generated by external algorithm",
    );

    builder.add_paths(paths);
    builder.build()
}

/// Generate optimized SVG string with path consolidation
pub fn generate_optimized_svg_from_paths(paths: &[SvgPath], width: u32, height: u32) -> String {
    let mut builder = OptimizedSvgBuilder::new(width, height)
        .with_css_classes(true)
        .with_precision(2)
        .with_merge_threshold(1.0);

    builder.add_consolidated_paths(paths.to_vec());
    builder.build_with_metadata(
        "Vec2Art Optimized",
        "Optimized vector graphics with consolidated paths",
    )
}

impl OptimizedSvgBuilder {
    /// Create a new optimized SVG builder
    pub fn new(width: u32, height: u32) -> Self {
        Self {
            width,
            height,
            paths_by_style: HashMap::new(),
            use_css_classes: true,
            precision: 2,
            merge_threshold: 1.0,
        }
    }

    /// Enable or disable CSS classes for style optimization
    pub fn with_css_classes(mut self, use_css: bool) -> Self {
        self.use_css_classes = use_css;
        self
    }

    /// Set coordinate precision (decimal places)
    pub fn with_precision(mut self, precision: usize) -> Self {
        self.precision = precision;
        self
    }

    /// Set threshold for merging nearby path endpoints
    pub fn with_merge_threshold(mut self, threshold: f32) -> Self {
        self.merge_threshold = threshold;
        self
    }

    /// Add consolidated paths with style optimization
    pub fn add_consolidated_paths(&mut self, paths: Vec<SvgPath>) -> &mut Self {
        // Group paths by style
        let grouped_paths = self.group_paths_by_style(paths);
        
        // Process each style group
        for (style_key, style_paths) in grouped_paths {
            // Merge continuous paths within this style group
            let merged_paths = self.merge_continuous_paths(&style_paths);
            
            // Convert to path data strings with optimized coordinates
            let path_data_strings: Vec<String> = merged_paths
                .iter()
                .map(|path| self.optimize_path_data(path))
                .filter(|data| !data.is_empty())
                .collect();
            
            if !path_data_strings.is_empty() {
                self.paths_by_style.insert(style_key, path_data_strings);
            }
        }
        self
    }

    /// Group paths by their style attributes
    fn group_paths_by_style(&self, paths: Vec<SvgPath>) -> HashMap<String, Vec<SvgPath>> {
        let mut grouped = HashMap::new();
        
        for path in paths {
            let style_key = self.create_style_key(&path);
            grouped.entry(style_key).or_insert_with(Vec::new).push(path);
        }
        
        grouped
    }

    /// Create a unique style key for grouping
    fn create_style_key(&self, path: &SvgPath) -> String {
        let stroke = path.stroke_color.as_deref().unwrap_or("none");
        let fill = path.fill_color.as_deref().unwrap_or("none");
        let stroke_width = path.stroke_width;
        
        format!("s:{};f:{};w:{}", stroke, fill, stroke_width)
    }

    /// Merge paths that share endpoints or are within threshold distance
    pub fn merge_continuous_paths(&self, paths: &[SvgPath]) -> Vec<SvgPath> {
        if paths.is_empty() {
            return Vec::new();
        }

        let mut merged = Vec::new();
        let mut used = vec![false; paths.len()];
        
        for i in 0..paths.len() {
            if used[i] || paths[i].points.is_empty() {
                continue;
            }
            
            let mut current_path = paths[i].clone();
            used[i] = true;
            
            // Try to extend this path with compatible paths
            let mut extended = true;
            while extended {
                extended = false;
                
                for j in 0..paths.len() {
                    if used[j] || paths[j].points.is_empty() {
                        continue;
                    }
                    
                    if self.can_merge_paths(&current_path, &paths[j]) {
                        current_path = self.merge_two_paths(current_path, &paths[j]);
                        used[j] = true;
                        extended = true;
                        break;
                    }
                }
            }
            
            merged.push(current_path);
        }
        
        merged
    }

    /// Check if two paths can be merged (share endpoints within threshold)
    fn can_merge_paths(&self, path1: &SvgPath, path2: &SvgPath) -> bool {
        if path1.points.is_empty() || path2.points.is_empty() {
            return false;
        }
        
        let p1_start = path1.points[0];
        let p1_end = path1.points[path1.points.len() - 1];
        let p2_start = path2.points[0];
        let p2_end = path2.points[path2.points.len() - 1];
        
        let threshold = self.merge_threshold;
        
        // Check if any endpoints are close enough to merge
        self.distance(p1_end, p2_start) < threshold ||
        self.distance(p1_end, p2_end) < threshold ||
        self.distance(p1_start, p2_start) < threshold ||
        self.distance(p1_start, p2_end) < threshold
    }

    /// Calculate distance between two points
    fn distance(&self, p1: (f32, f32), p2: (f32, f32)) -> f32 {
        ((p1.0 - p2.0).powi(2) + (p1.1 - p2.1).powi(2)).sqrt()
    }

    /// Merge two compatible paths
    fn merge_two_paths(&self, mut path1: SvgPath, path2: &SvgPath) -> SvgPath {
        if path2.points.is_empty() {
            return path1;
        }
        
        let p1_start = path1.points[0];
        let p1_end = path1.points[path1.points.len() - 1];
        let p2_start = path2.points[0];
        let p2_end = path2.points[path2.points.len() - 1];
        
        let threshold = self.merge_threshold;
        
        // Determine the best way to connect the paths
        if self.distance(p1_end, p2_start) < threshold {
            // path1.end -> path2.start: append path2 points (skip first)
            path1.points.extend_from_slice(&path2.points[1..]);
        } else if self.distance(p1_end, p2_end) < threshold {
            // path1.end -> path2.end: append reversed path2 points (skip last)
            let mut reversed = path2.points.clone();
            reversed.reverse();
            path1.points.extend_from_slice(&reversed[1..]);
        } else if self.distance(p1_start, p2_start) < threshold {
            // path2.start -> path1.start: prepend reversed path2 points (skip last)
            let mut reversed = path2.points.clone();
            reversed.reverse();
            reversed.extend_from_slice(&path1.points[1..]);
            path1.points = reversed;
        } else if self.distance(p1_start, p2_end) < threshold {
            // path2.end -> path1.start: prepend path2 points (skip last)
            let mut new_points = path2.points.clone();
            new_points.extend_from_slice(&path1.points[1..]);
            path1.points = new_points;
        }
        
        path1
    }

    /// Optimize path data string with precision control and relative commands
    fn optimize_path_data(&self, path: &SvgPath) -> String {
        if path.points.is_empty() {
            return String::new();
        }

        let mut path_data = String::new();
        let (x, y) = path.points[0];
        let _ = write!(path_data, "M{:.prec$},{:.prec$}", x, y, prec = self.precision);

        // Use relative line commands for better compression
        let mut last_x = x;
        let mut last_y = y;
        
        for &(x, y) in &path.points[1..] {
            let dx = x - last_x;
            let dy = y - last_y;
            
            // Use relative commands if the delta is reasonable
            if dx.abs() < 1000.0 && dy.abs() < 1000.0 {
                let _ = write!(path_data, "l{:.prec$},{:.prec$}", dx, dy, prec = self.precision);
            } else {
                let _ = write!(path_data, "L{:.prec$},{:.prec$}", x, y, prec = self.precision);
            }
            
            last_x = x;
            last_y = y;
        }

        if path.closed {
            path_data.push('Z');
        }

        path_data
    }


    /// Parse style key back into components
    fn parse_style_key(&self, style_key: &str) -> StyleAttributes {
        let parts: Vec<&str> = style_key.split(';').collect();
        let mut stroke = "none";
        let mut fill = "none";
        let mut stroke_width = 1.0;
        
        for part in parts {
            if let Some(value) = part.strip_prefix("s:") {
                stroke = value;
            } else if let Some(value) = part.strip_prefix("f:") {
                fill = value;
            } else if let Some(value) = part.strip_prefix("w:") {
                if let Ok(width) = value.parse::<f32>() {
                    stroke_width = width;
                }
            }
        }
        
        StyleAttributes {
            stroke: stroke.to_string(),
            fill: fill.to_string(),
            stroke_width,
        }
    }

    /// Generate CSS styles from a style class map
    fn generate_css_styles_from_map(&self, style_classes: &HashMap<String, String>) -> String {
        if !self.use_css_classes || style_classes.is_empty() {
            return String::new();
        }
        
        let mut css = String::new();
        css.push_str("<style><![CDATA[");
        
        for (style_key, class_name) in style_classes {
            let style_attrs = self.parse_style_key(style_key);
            let _ = write!(css, ".{} {{", class_name);
            
            if style_attrs.stroke != "none" {
                let _ = write!(css, "stroke:{};", style_attrs.stroke);
            }
            if style_attrs.fill != "none" {
                let _ = write!(css, "fill:{};", style_attrs.fill);
            }
            if style_attrs.stroke_width != 1.0 {
                let _ = write!(css, "stroke-width:{};", style_attrs.stroke_width);
            }
            
            css.push('}');
        }
        
        css.push_str("]]></style>");
        css
    }

    /// Build the optimized SVG with metadata
    pub fn build_with_metadata(self, title: &str, description: &str) -> String {
        // Prepare CSS classes first to avoid borrowing issues
        let mut style_classes = HashMap::new();
        let mut class_counter = 0;
        
        for style_key in self.paths_by_style.keys() {
            if self.use_css_classes {
                class_counter += 1;
                let class_name = format!("p{}", class_counter);
                style_classes.insert(style_key.clone(), class_name);
            }
        }
        let mut document = Document::new()
            .set("width", self.width)
            .set("height", self.height)
            .set("viewBox", format!("0 0 {} {}", self.width, self.height))
            .set("xmlns", "http://www.w3.org/2000/svg");

        // Add metadata
        use svg::node::element::{Description, Title};
        document = document
            .add(Title::new(title))
            .add(Description::new().add(svg::node::Text::new(description)));

        // Add CSS styles if enabled
        if self.use_css_classes && !style_classes.is_empty() {
            let css_styles = self.generate_css_styles_from_map(&style_classes);
            if !css_styles.is_empty() {
                let style_element = Style::new(css_styles);
                document = document.add(style_element);
            }
        }

        // Add consolidated paths
        for (style_key, path_data_list) in &self.paths_by_style {
            if path_data_list.is_empty() {
                continue;
            }

            // Create a single compound path for all paths with this style
            let compound_path_data = path_data_list.join(" ");
            let mut path_element = Path::new().set("d", compound_path_data);

            if self.use_css_classes {
                // Use CSS class
                if let Some(class_name) = style_classes.get(style_key) {
                    path_element = path_element.set("class", class_name.as_str());
                }
            } else {
                // Use inline styles
                let style_attrs = self.parse_style_key(style_key);
                
                if style_attrs.stroke != "none" {
                    path_element = path_element.set("stroke", style_attrs.stroke);
                } else {
                    path_element = path_element.set("stroke", "none");
                }
                
                if style_attrs.fill != "none" {
                    path_element = path_element.set("fill", style_attrs.fill);
                } else {
                    path_element = path_element.set("fill", "none");
                }
                
                path_element = path_element.set("stroke-width", style_attrs.stroke_width);
            }

            document = document.add(path_element);
        }

        document.to_string()
    }

    /// Build the optimized SVG without metadata
    pub fn build(self) -> String {
        self.build_with_metadata("Optimized SVG", "Generated with path consolidation")
    }

    /// Get statistics about the optimization
    pub fn get_optimization_stats(&self) -> OptimizationStats {
        let total_path_groups = self.paths_by_style.len();
        let total_individual_paths: usize = self.paths_by_style.values()
            .map(|paths| paths.len())
            .sum();
        
        OptimizationStats {
            total_path_groups,
            total_individual_paths,
            average_paths_per_group: if total_path_groups > 0 {
                total_individual_paths as f32 / total_path_groups as f32
            } else {
                0.0
            },
        }
    }

    /// Advanced path optimization with curve fitting
    pub fn optimize_with_curves(mut self, curve_tolerance: f32) -> Self {
        // This could be extended to detect and convert line segments to curves
        // For now, it's a placeholder for future curve optimization
        self.merge_threshold = curve_tolerance;
        self
    }
}

/// Helper struct for style attributes
#[derive(Debug, Clone)]
struct StyleAttributes {
    stroke: String,
    fill: String,
    stroke_width: f32,
}

/// Statistics about SVG optimization
#[derive(Debug, Clone)]
pub struct OptimizationStats {
    pub total_path_groups: usize,
    pub total_individual_paths: usize,
    pub average_paths_per_group: f32,
}

/// Utility functions for SVG optimization analysis
pub mod optimization_utils {
    use super::*;

    /// Estimate SVG file size reduction from path consolidation
    pub fn estimate_size_reduction(original_paths: &[SvgPath], optimized_stats: &OptimizationStats) -> f32 {
        let original_elements = original_paths.len();
        let optimized_elements = optimized_stats.total_path_groups;
        
        if original_elements > 0 {
            1.0 - (optimized_elements as f32 / original_elements as f32)
        } else {
            0.0
        }
    }

    /// Count total SVG nodes in original paths
    pub fn count_svg_nodes(paths: &[SvgPath]) -> usize {
        paths.iter().map(|p| p.points.len()).sum()
    }

    /// Calculate complexity score for paths (higher = more complex)
    pub fn calculate_complexity_score(paths: &[SvgPath]) -> f32 {
        if paths.is_empty() {
            return 0.0;
        }

        let total_points: usize = paths.iter().map(|p| p.points.len()).sum();
        let avg_points_per_path = total_points as f32 / paths.len() as f32;
        let path_count_factor = (paths.len() as f32).log2();
        
        avg_points_per_path * path_count_factor
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_svg_builder_basic() {
        let svg = SvgBuilder::new(100, 100).with_background("#ffffff").build();

        assert!(svg.contains("width=\"100\""));
        assert!(svg.contains("height=\"100\""));
        assert!(svg.contains("#ffffff"));
    }

    #[test]
    fn test_rgb_to_hex() {
        assert_eq!(rgb_to_hex(255, 0, 0), "#ff0000");
        assert_eq!(rgb_to_hex(0, 255, 0), "#00ff00");
        assert_eq!(rgb_to_hex(0, 0, 255), "#0000ff");
        assert_eq!(rgb_to_hex(128, 128, 128), "#808080");
    }

    #[test]
    fn test_optimized_svg_builder() {
        let mut path1 = SvgPath::new();
        path1.points = vec![(0.0, 0.0), (10.0, 10.0)];
        path1.stroke_color = Some("#ff0000".to_string());
        
        let mut path2 = SvgPath::new();
        path2.points = vec![(20.0, 20.0), (30.0, 30.0)];
        path2.stroke_color = Some("#ff0000".to_string());
        
        let mut builder = OptimizedSvgBuilder::new(100, 100)
            .with_css_classes(true);
        builder.add_consolidated_paths(vec![path1, path2]);
        let svg = builder.build();
        
        assert!(svg.contains("width=\"100\""));
        assert!(svg.contains("height=\"100\""));
    }

    #[test]
    fn test_path_merging() {
        let builder = OptimizedSvgBuilder::new(100, 100).with_merge_threshold(2.0);
        
        let mut path1 = SvgPath::new();
        path1.points = vec![(0.0, 0.0), (10.0, 10.0)];
        
        let mut path2 = SvgPath::new();
        path2.points = vec![(10.0, 10.0), (20.0, 20.0)]; // Connects to path1
        
        let paths = vec![path1, path2];
        let merged = builder.merge_continuous_paths(&paths);
        
        assert_eq!(merged.len(), 1, "Should merge connected paths");
        assert_eq!(merged[0].points.len(), 3, "Merged path should have 3 points");
    }

    #[test]
    fn test_style_grouping() {
        let builder = OptimizedSvgBuilder::new(100, 100);
        
        let mut path1 = SvgPath::new();
        path1.stroke_color = Some("#ff0000".to_string());
        path1.fill_color = Some("#00ff00".to_string());
        
        let mut path2 = SvgPath::new();
        path2.stroke_color = Some("#ff0000".to_string());
        path2.fill_color = Some("#00ff00".to_string());
        
        let mut path3 = SvgPath::new();
        path3.stroke_color = Some("#0000ff".to_string());
        
        let grouped = builder.group_paths_by_style(vec![path1, path2, path3]);
        
        assert_eq!(grouped.len(), 2, "Should create 2 style groups");
    }

    #[test]
    fn test_optimized_path_data() {
        let builder = OptimizedSvgBuilder::new(100, 100).with_precision(1);
        
        let mut path = SvgPath::new();
        path.points = vec![(0.0, 0.0), (1.5, 2.7), (3.1, 4.9)];
        
        let optimized = builder.optimize_path_data(&path);
        
        assert!(optimized.starts_with("M0.0,0.0"), "Should start with move command");
        assert!(optimized.contains("l1.5,2.7"), "Should use relative line commands");
        assert_eq!(optimized.matches('.').count(), 6, "Should have correct precision");
    }

    #[test]
    fn test_generate_optimized_svg() {
        let mut path1 = SvgPath::new();
        path1.points = vec![(0.0, 0.0), (10.0, 10.0)];
        path1.stroke_color = Some("#ff0000".to_string());
        
        let mut path2 = SvgPath::new();
        path2.points = vec![(20.0, 20.0), (30.0, 30.0)];
        path2.stroke_color = Some("#ff0000".to_string());
        
        let svg = generate_optimized_svg_from_paths(&[path1, path2], 100, 100);
        
        assert!(svg.contains("Vec2Art Optimized"));
        assert!(svg.contains("width=\"100\""));
        assert!(svg.contains("height=\"100\""));
        assert!(svg.contains("#ff0000"));
    }

    #[test]
    fn test_optimization_stats() {
        let mut builder = OptimizedSvgBuilder::new(100, 100);
        
        // Create multiple paths with same style
        let mut path1 = SvgPath::new();
        path1.points = vec![(0.0, 0.0), (10.0, 10.0)];
        path1.stroke_color = Some("#ff0000".to_string());
        
        let mut path2 = SvgPath::new();
        path2.points = vec![(20.0, 20.0), (30.0, 30.0)];
        path2.stroke_color = Some("#ff0000".to_string());
        
        let mut path3 = SvgPath::new();
        path3.points = vec![(40.0, 40.0), (50.0, 50.0)];
        path3.stroke_color = Some("#00ff00".to_string());
        
        builder.add_consolidated_paths(vec![path1, path2, path3]);
        let stats = builder.get_optimization_stats();
        
        assert_eq!(stats.total_path_groups, 2, "Should create 2 style groups");
        assert!(stats.average_paths_per_group > 0.0, "Should have positive average");
    }

    #[test]
    fn test_optimization_utils() {
        use optimization_utils::*;
        
        let mut paths = Vec::new();
        for i in 0..5 {
            let mut path = SvgPath::new();
            path.points = vec![(i as f32, 0.0), (i as f32 + 1.0, 1.0)];
            paths.push(path);
        }
        
        let stats = OptimizationStats {
            total_path_groups: 2,
            total_individual_paths: 5,
            average_paths_per_group: 2.5,
        };
        
        let reduction = estimate_size_reduction(&paths, &stats);
        assert!(reduction > 0.0, "Should show some size reduction");
        
        let node_count = count_svg_nodes(&paths);
        assert_eq!(node_count, 10, "Should count all points in all paths");
        
        let complexity = calculate_complexity_score(&paths);
        assert!(complexity > 0.0, "Should have positive complexity score");
    }
}
