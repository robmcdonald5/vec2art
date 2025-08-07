use svg::Document;
use svg::node::element::{Circle, Group, Path, Polygon, Rectangle, Ellipse};
use svg::node::element::path::Data;
use crate::algorithms::SvgPath;

/// Builder for creating SVG documents
pub struct SvgBuilder {
    document: Document,
    width: u32,
    height: u32,
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
        use svg::node::element::{Title, Description};
        
        self.document = self.document
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
    pub fn add_polyline(&mut self, points: &[(f32, f32)], stroke: &str, stroke_width: f32) -> &mut Self {
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
    pub fn add_rectangle(&mut self, x: f32, y: f32, width: f32, height: f32, fill: &str, opacity: f32) -> &mut Self {
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
    pub fn add_triangle(&mut self, p1: (f32, f32), p2: (f32, f32), p3: (f32, f32), fill: &str, opacity: f32) -> &mut Self {
        let points = format!("{:.2},{:.2} {:.2},{:.2} {:.2},{:.2}", 
                           p1.0, p1.1, p2.0, p2.1, p3.0, p3.1);
        
        let polygon = Polygon::new()
            .set("points", points)
            .set("fill", fill)
            .set("opacity", opacity);
        
        self.document = self.document.clone().add(polygon);
        self
    }
    
    /// Add an ellipse
    pub fn add_ellipse(&mut self, cx: f32, cy: f32, rx: f32, ry: f32, fill: &str, opacity: f32) -> &mut Self {
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
    pub fn add_bezier_curve(&mut self, start: (f32, f32), control1: (f32, f32), control2: (f32, f32), end: (f32, f32), stroke: &str, stroke_width: f32) -> &mut Self {
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
    pub fn add_quadratic_bezier(&mut self, start: (f32, f32), control: (f32, f32), end: (f32, f32), stroke: &str, stroke_width: f32) -> &mut Self {
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
pub fn create_linear_gradient(id: &str, color1: &str, color2: &str) -> svg::node::element::LinearGradient {
    use svg::node::element::{LinearGradient, Stop};
    
    LinearGradient::new()
        .set("id", id)
        .add(Stop::new().set("offset", "0%").set("stop-color", color1))
        .add(Stop::new().set("offset", "100%").set("stop-color", color2))
}

/// Generate SVG string from a collection of SvgPath objects
pub fn generate_svg_from_paths(paths: &[SvgPath], width: u32, height: u32) -> String {
    let mut builder = SvgBuilder::new(width, height)
        .with_metadata("Vec2Art External Algorithm", "Vector graphics generated by external algorithm");
    
    builder.add_paths(paths);
    builder.build()
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_svg_builder_basic() {
        let svg = SvgBuilder::new(100, 100)
            .with_background("#ffffff")
            .build();
        
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
}