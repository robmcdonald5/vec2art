use crate::algorithms::ConversionAlgorithm;
use crate::error::{Result, Vec2ArtError};
use crate::svg_builder::{SvgBuilder, rgb_to_hex};
use crate::{ConversionParameters, ShapeType};
use image::{DynamicImage, Rgb, RgbImage};
use log::info;
use rand::prelude::*;
use rand::rngs::SmallRng;

pub struct GeometricFitter;

impl ConversionAlgorithm for GeometricFitter {
    fn convert(image: DynamicImage, params: ConversionParameters) -> Result<String> {
        match params {
            ConversionParameters::GeometricFitter {
                shape_types,
                max_shapes,
                population_size,
                generations,
                mutation_rate,
                target_fitness,
            } => {
                info!("Starting geometric fitting with {} shapes", max_shapes);
                
                let rgb_image = image.to_rgb8();
                let (width, height) = (image.width(), image.height());
                
                // Initialize genetic algorithm
                let mut ga = GeneticAlgorithm::new(
                    rgb_image,
                    shape_types,
                    max_shapes,
                    population_size,
                    mutation_rate,
                );
                
                // Evolve population
                let mut best_fitness = 0.0;
                for generation in 0..generations {
                    ga.evolve();
                    
                    let current_fitness = ga.best_fitness();
                    if current_fitness > best_fitness {
                        best_fitness = current_fitness;
                        info!("Generation {}: fitness = {:.4}", generation, best_fitness);
                    }
                    
                    if best_fitness >= target_fitness {
                        info!("Target fitness reached at generation {}", generation);
                        break;
                    }
                }
                
                // Get best solution
                let best_shapes = ga.get_best_solution();
                
                // Generate SVG
                let svg = generate_svg(&best_shapes, width, height);
                
                info!("Geometric fitting complete with {} shapes", best_shapes.len());
                Ok(svg)
            }
            _ => Err(Vec2ArtError::InvalidParameters(
                "GeometricFitter requires GeometricFitter parameters".to_string()
            ))
        }
    }
    
    fn description() -> &'static str {
        "Approximates images using geometric shapes via genetic algorithm"
    }
    
    fn estimate_time(_width: u32, _height: u32) -> u32 {
        // Rough estimate: ~5000ms for standard settings
        5000
    }
}

/// Shape representation for genetic algorithm
#[derive(Clone, Debug)]
struct Shape {
    shape_type: ShapeType,
    x: f32,
    y: f32,
    size1: f32,  // radius for circle, width for rectangle
    size2: f32,  // unused for circle, height for rectangle
    rotation: f32,
    color: Rgb<u8>,
    opacity: f32,
}

impl Shape {
    fn random(width: u32, height: u32, shape_types: &[ShapeType], rng: &mut SmallRng) -> Self {
        let shape_type = shape_types.choose(rng).unwrap().clone();
        
        Self {
            shape_type,
            x: rng.gen_range(0.0..width as f32),
            y: rng.gen_range(0.0..height as f32),
            size1: rng.gen_range(5.0..100.0),
            size2: rng.gen_range(5.0..100.0),
            rotation: rng.gen_range(0.0..360.0),
            color: Rgb([
                rng.gen_range(0..256) as u8,
                rng.gen_range(0..256) as u8,
                rng.gen_range(0..256) as u8,
            ]),
            opacity: rng.gen_range(0.3..1.0),
        }
    }
    
    fn mutate(&mut self, rate: f32, width: u32, height: u32, rng: &mut SmallRng) {
        if rng.gen::<f32>() < rate {
            self.x += rng.gen_range(-20.0..20.0);
            self.x = self.x.max(0.0).min(width as f32);
        }
        
        if rng.gen::<f32>() < rate {
            self.y += rng.gen_range(-20.0..20.0);
            self.y = self.y.max(0.0).min(height as f32);
        }
        
        if rng.gen::<f32>() < rate {
            self.size1 *= rng.gen_range(0.8..1.2);
            self.size1 = self.size1.max(2.0).min(200.0);
        }
        
        if rng.gen::<f32>() < rate {
            self.size2 *= rng.gen_range(0.8..1.2);
            self.size2 = self.size2.max(2.0).min(200.0);
        }
        
        if rng.gen::<f32>() < rate {
            self.rotation += rng.gen_range(-30.0..30.0);
        }
        
        if rng.gen::<f32>() < rate {
            let channel = rng.gen_range(0..3);
            let delta = rng.gen_range(-30..30) as i16;
            self.color[channel] = (self.color[channel] as i16 + delta)
                .max(0)
                .min(255) as u8;
        }
        
        if rng.gen::<f32>() < rate {
            self.opacity += rng.gen_range(-0.1..0.1);
            self.opacity = self.opacity.max(0.1).min(1.0);
        }
    }
}

/// Individual in the genetic algorithm population
#[derive(Clone)]
struct Individual {
    shapes: Vec<Shape>,
    fitness: f32,
}

impl Individual {
    fn new(shapes: Vec<Shape>) -> Self {
        Self {
            shapes,
            fitness: 0.0,
        }
    }
    
    fn render(&self, width: u32, height: u32) -> RgbImage {
        let mut image = RgbImage::new(width, height);
        
        // Start with white background
        for pixel in image.pixels_mut() {
            *pixel = Rgb([255, 255, 255]);
        }
        
        // Render each shape
        for shape in &self.shapes {
            render_shape(&mut image, shape);
        }
        
        image
    }
    
    fn calculate_fitness(&mut self, target: &RgbImage) {
        let rendered = self.render(target.width(), target.height());
        
        let mut total_diff = 0u64;
        for (p1, p2) in rendered.pixels().zip(target.pixels()) {
            for i in 0..3 {
                let diff = (p1[i] as i32 - p2[i] as i32).abs();
                total_diff += diff as u64;
            }
        }
        
        let max_diff = 255u64 * 3 * (target.width() * target.height()) as u64;
        self.fitness = 1.0 - (total_diff as f32 / max_diff as f32);
    }
}

/// Render a shape onto an image
fn render_shape(image: &mut RgbImage, shape: &Shape) {
    let (width, height) = (image.width(), image.height());
    
    match shape.shape_type {
        ShapeType::Circle => {
            render_circle(image, shape.x, shape.y, shape.size1, shape.color, shape.opacity);
        }
        ShapeType::Rectangle => {
            render_rectangle(
                image,
                shape.x,
                shape.y,
                shape.size1,
                shape.size2,
                shape.rotation,
                shape.color,
                shape.opacity,
            );
        }
        ShapeType::Triangle => {
            render_triangle(
                image,
                shape.x,
                shape.y,
                shape.size1,
                shape.rotation,
                shape.color,
                shape.opacity,
            );
        }
        ShapeType::Ellipse => {
            render_ellipse(
                image,
                shape.x,
                shape.y,
                shape.size1,
                shape.size2,
                shape.rotation,
                shape.color,
                shape.opacity,
            );
        }
    }
}

/// Render a circle
fn render_circle(image: &mut RgbImage, cx: f32, cy: f32, radius: f32, color: Rgb<u8>, opacity: f32) {
    let (width, height) = (image.width(), image.height());
    
    let min_x = (cx - radius).max(0.0) as u32;
    let max_x = (cx + radius).min(width as f32 - 1.0) as u32;
    let min_y = (cy - radius).max(0.0) as u32;
    let max_y = (cy + radius).min(height as f32 - 1.0) as u32;
    
    for y in min_y..=max_y {
        for x in min_x..=max_x {
            let dx = x as f32 - cx;
            let dy = y as f32 - cy;
            
            if dx * dx + dy * dy <= radius * radius {
                let pixel = image.get_pixel_mut(x, y);
                blend_pixel(pixel, color, opacity);
            }
        }
    }
}

/// Render a rectangle
fn render_rectangle(
    image: &mut RgbImage,
    cx: f32,
    cy: f32,
    width: f32,
    height: f32,
    rotation: f32,
    color: Rgb<u8>,
    opacity: f32,
) {
    let angle = rotation.to_radians();
    let cos_a = angle.cos();
    let sin_a = angle.sin();
    
    let half_width = width / 2.0;
    let half_height = height / 2.0;
    
    // Calculate bounding box
    let corners = [
        (-half_width, -half_height),
        (half_width, -half_height),
        (half_width, half_height),
        (-half_width, half_height),
    ];
    
    let mut min_x = f32::MAX;
    let mut max_x = f32::MIN;
    let mut min_y = f32::MAX;
    let mut max_y = f32::MIN;
    
    for &(x, y) in &corners {
        let rx = x * cos_a - y * sin_a + cx;
        let ry = x * sin_a + y * cos_a + cy;
        min_x = min_x.min(rx);
        max_x = max_x.max(rx);
        min_y = min_y.min(ry);
        max_y = max_y.max(ry);
    }
    
    let img_width = image.width();
    let img_height = image.height();
    
    let min_x = min_x.max(0.0) as u32;
    let max_x = max_x.min(img_width as f32 - 1.0) as u32;
    let min_y = min_y.max(0.0) as u32;
    let max_y = max_y.min(img_height as f32 - 1.0) as u32;
    
    for y in min_y..=max_y {
        for x in min_x..=max_x {
            // Transform point to rectangle's local coordinates
            let dx = x as f32 - cx;
            let dy = y as f32 - cy;
            
            let local_x = dx * cos_a + dy * sin_a;
            let local_y = -dx * sin_a + dy * cos_a;
            
            if local_x.abs() <= half_width && local_y.abs() <= half_height {
                let pixel = image.get_pixel_mut(x, y);
                blend_pixel(pixel, color, opacity);
            }
        }
    }
}

/// Render a triangle
fn render_triangle(
    image: &mut RgbImage,
    cx: f32,
    cy: f32,
    size: f32,
    rotation: f32,
    color: Rgb<u8>,
    opacity: f32,
) {
    let angle = rotation.to_radians();
    let cos_a = angle.cos();
    let sin_a = angle.sin();
    
    // Triangle vertices in local coordinates
    let vertices = [
        (0.0, -size),
        (-size * 0.866, size * 0.5),
        (size * 0.866, size * 0.5),
    ];
    
    // Transform vertices to world coordinates
    let mut world_vertices = Vec::new();
    for &(x, y) in &vertices {
        let wx = x * cos_a - y * sin_a + cx;
        let wy = x * sin_a + y * cos_a + cy;
        world_vertices.push((wx, wy));
    }
    
    // Calculate bounding box
    let min_x = world_vertices.iter().map(|v| v.0).fold(f32::MAX, f32::min).max(0.0) as u32;
    let max_x = world_vertices.iter().map(|v| v.0).fold(f32::MIN, f32::max).min(image.width() as f32 - 1.0) as u32;
    let min_y = world_vertices.iter().map(|v| v.1).fold(f32::MAX, f32::min).max(0.0) as u32;
    let max_y = world_vertices.iter().map(|v| v.1).fold(f32::MIN, f32::max).min(image.height() as f32 - 1.0) as u32;
    
    for y in min_y..=max_y {
        for x in min_x..=max_x {
            if point_in_triangle(x as f32, y as f32, &world_vertices) {
                let pixel = image.get_pixel_mut(x, y);
                blend_pixel(pixel, color, opacity);
            }
        }
    }
}

/// Render an ellipse
fn render_ellipse(
    image: &mut RgbImage,
    cx: f32,
    cy: f32,
    rx: f32,
    ry: f32,
    rotation: f32,
    color: Rgb<u8>,
    opacity: f32,
) {
    let angle = rotation.to_radians();
    let cos_a = angle.cos();
    let sin_a = angle.sin();
    
    let max_radius = rx.max(ry);
    let min_x = (cx - max_radius).max(0.0) as u32;
    let max_x = (cx + max_radius).min(image.width() as f32 - 1.0) as u32;
    let min_y = (cy - max_radius).max(0.0) as u32;
    let max_y = (cy + max_radius).min(image.height() as f32 - 1.0) as u32;
    
    for y in min_y..=max_y {
        for x in min_x..=max_x {
            // Transform point to ellipse's local coordinates
            let dx = x as f32 - cx;
            let dy = y as f32 - cy;
            
            let local_x = dx * cos_a + dy * sin_a;
            let local_y = -dx * sin_a + dy * cos_a;
            
            // Check if point is inside ellipse
            if (local_x * local_x) / (rx * rx) + (local_y * local_y) / (ry * ry) <= 1.0 {
                let pixel = image.get_pixel_mut(x, y);
                blend_pixel(pixel, color, opacity);
            }
        }
    }
}

/// Check if a point is inside a triangle using barycentric coordinates
fn point_in_triangle(px: f32, py: f32, vertices: &[(f32, f32)]) -> bool {
    let (x1, y1) = vertices[0];
    let (x2, y2) = vertices[1];
    let (x3, y3) = vertices[2];
    
    let denominator = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
    if denominator.abs() < 0.0001 {
        return false;
    }
    
    let a = ((y2 - y3) * (px - x3) + (x3 - x2) * (py - y3)) / denominator;
    let b = ((y3 - y1) * (px - x3) + (x1 - x3) * (py - y3)) / denominator;
    let c = 1.0 - a - b;
    
    a >= 0.0 && b >= 0.0 && c >= 0.0
}

/// Blend a pixel with a color using alpha blending
fn blend_pixel(pixel: &mut Rgb<u8>, color: Rgb<u8>, opacity: f32) {
    for i in 0..3 {
        let old = pixel[i] as f32;
        let new = color[i] as f32;
        pixel[i] = (old * (1.0 - opacity) + new * opacity) as u8;
    }
}

/// Genetic algorithm for shape fitting
struct GeneticAlgorithm {
    population: Vec<Individual>,
    target_image: RgbImage,
    shape_types: Vec<ShapeType>,
    max_shapes: u32,
    mutation_rate: f32,
    rng: SmallRng,
}

impl GeneticAlgorithm {
    fn new(
        target_image: RgbImage,
        shape_types: Vec<ShapeType>,
        max_shapes: u32,
        population_size: u32,
        mutation_rate: f32,
    ) -> Self {
        let mut rng = SmallRng::from_entropy();
        let (width, height) = (target_image.width(), target_image.height());
        
        // Initialize random population
        let mut population = Vec::new();
        for _ in 0..population_size {
            let num_shapes = rng.gen_range(1..=max_shapes);
            let mut shapes = Vec::new();
            
            for _ in 0..num_shapes {
                shapes.push(Shape::random(width, height, &shape_types, &mut rng));
            }
            
            let mut individual = Individual::new(shapes);
            individual.calculate_fitness(&target_image);
            population.push(individual);
        }
        
        // Sort by fitness
        population.sort_by(|a, b| b.fitness.partial_cmp(&a.fitness).unwrap());
        
        Self {
            population,
            target_image,
            shape_types,
            max_shapes,
            mutation_rate,
            rng,
        }
    }
    
    fn evolve(&mut self) {
        let pop_size = self.population.len();
        let elite_size = pop_size / 4;
        let mut new_population = Vec::new();
        
        // Keep elite individuals
        for i in 0..elite_size {
            new_population.push(self.population[i].clone());
        }
        
        // Generate offspring
        while new_population.len() < pop_size {
            // Tournament selection
            let parent1 = self.tournament_select();
            let parent2 = self.tournament_select();
            
            // Crossover
            let mut child = self.crossover(&parent1, &parent2);
            
            // Mutation
            self.mutate(&mut child);
            
            // Calculate fitness
            child.calculate_fitness(&self.target_image);
            
            new_population.push(child);
        }
        
        // Sort by fitness
        new_population.sort_by(|a, b| b.fitness.partial_cmp(&a.fitness).unwrap());
        
        self.population = new_population;
    }
    
    fn tournament_select(&mut self) -> Individual {
        let tournament_size = 3;
        let mut best: Option<Individual> = None;
        
        for _ in 0..tournament_size {
            let idx = self.rng.gen_range(0..self.population.len());
            let individual = &self.population[idx];
            
            if best.is_none() || individual.fitness > best.as_ref().unwrap().fitness {
                best = Some(individual.clone());
            }
        }
        
        best.unwrap()
    }
    
    fn crossover(&mut self, parent1: &Individual, parent2: &Individual) -> Individual {
        let mut child_shapes = Vec::new();
        
        // Uniform crossover
        let max_len = parent1.shapes.len().max(parent2.shapes.len());
        for i in 0..max_len {
            if self.rng.gen_bool(0.5) {
                if i < parent1.shapes.len() {
                    child_shapes.push(parent1.shapes[i].clone());
                }
            } else {
                if i < parent2.shapes.len() {
                    child_shapes.push(parent2.shapes[i].clone());
                }
            }
        }
        
        // Ensure we don't exceed max shapes
        if child_shapes.len() > self.max_shapes as usize {
            child_shapes.truncate(self.max_shapes as usize);
        }
        
        Individual::new(child_shapes)
    }
    
    fn mutate(&mut self, individual: &mut Individual) {
        let (width, height) = (self.target_image.width(), self.target_image.height());
        
        // Mutate existing shapes
        for shape in &mut individual.shapes {
            shape.mutate(self.mutation_rate, width, height, &mut self.rng);
        }
        
        // Add new shape
        if self.rng.gen::<f32>() < self.mutation_rate * 0.1 {
            if individual.shapes.len() < self.max_shapes as usize {
                individual.shapes.push(Shape::random(width, height, &self.shape_types, &mut self.rng));
            }
        }
        
        // Remove random shape
        if self.rng.gen::<f32>() < self.mutation_rate * 0.1 {
            if individual.shapes.len() > 1 {
                let idx = self.rng.gen_range(0..individual.shapes.len());
                individual.shapes.remove(idx);
            }
        }
    }
    
    fn best_fitness(&self) -> f32 {
        self.population[0].fitness
    }
    
    fn get_best_solution(&self) -> Vec<Shape> {
        self.population[0].shapes.clone()
    }
}

/// Generate SVG from shapes
fn generate_svg(shapes: &[Shape], width: u32, height: u32) -> String {
    let mut builder = SvgBuilder::new(width, height)
        .with_metadata("Vec2Art Geometric Fitter", "Geometrically fitted vector graphics")
        .with_background("#ffffff");
    
    for shape in shapes {
        let color = rgb_to_hex(shape.color[0], shape.color[1], shape.color[2]);
        
        match shape.shape_type {
            ShapeType::Circle => {
                builder.add_circle(shape.x, shape.y, shape.size1, &color, shape.opacity);
            }
            ShapeType::Rectangle => {
                // For rotated rectangles, we'd need to add transform support to the builder
                // For now, just render axis-aligned
                builder.add_rectangle(
                    shape.x - shape.size1 / 2.0,
                    shape.y - shape.size2 / 2.0,
                    shape.size1,
                    shape.size2,
                    &color,
                    shape.opacity,
                );
            }
            ShapeType::Triangle => {
                // Calculate triangle vertices
                let angle = shape.rotation.to_radians();
                let cos_a = angle.cos();
                let sin_a = angle.sin();
                
                let v1 = (0.0, -shape.size1);
                let v2 = (-shape.size1 * 0.866, shape.size1 * 0.5);
                let v3 = (shape.size1 * 0.866, shape.size1 * 0.5);
                
                let p1 = (
                    v1.0 * cos_a - v1.1 * sin_a + shape.x,
                    v1.0 * sin_a + v1.1 * cos_a + shape.y,
                );
                let p2 = (
                    v2.0 * cos_a - v2.1 * sin_a + shape.x,
                    v2.0 * sin_a + v2.1 * cos_a + shape.y,
                );
                let p3 = (
                    v3.0 * cos_a - v3.1 * sin_a + shape.x,
                    v3.0 * sin_a + v3.1 * cos_a + shape.y,
                );
                
                builder.add_triangle(p1, p2, p3, &color, shape.opacity);
            }
            ShapeType::Ellipse => {
                builder.add_ellipse(
                    shape.x,
                    shape.y,
                    shape.size1,
                    shape.size2,
                    &color,
                    shape.opacity,
                );
            }
        }
    }
    
    builder.build()
}

pub fn convert(image: DynamicImage, params: ConversionParameters) -> Result<String> {
    GeometricFitter::convert(image, params)
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_geometric_fitter_creation() {
        let params = ConversionParameters::GeometricFitter {
            shape_types: vec![ShapeType::Circle, ShapeType::Rectangle],
            max_shapes: 10,
            population_size: 10,
            generations: 5,
            mutation_rate: 0.1,
            target_fitness: 0.9,
        };
        
        // Create a simple test image
        let img = DynamicImage::new_rgb8(100, 100);
        let result = GeometricFitter::convert(img, params);
        
        assert!(result.is_ok());
        let svg = result.unwrap();
        assert!(svg.contains("<svg"));
        assert!(svg.contains("</svg>"));
    }
}