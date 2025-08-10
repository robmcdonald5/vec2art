//! Gradient detection and analysis for color regions
//!
//! This module implements gradient detection using Principal Component Analysis (PCA)
//! to identify smooth color transitions that can be represented as SVG gradients.
//! 
//! Key features:
//! - PCA-based linear gradient detection with R² ≥ 0.85 threshold
//! - Radial gradient detection for radially symmetric patterns  
//! - Direction stability analysis for linear gradients
//! - Color stop optimization to minimize gradient complexity

use crate::algorithms::logo::Point;
use crate::algorithms::regions::Color;
use crate::error::VectorizeResult;
use std::collections::HashMap;

/// Configuration for gradient detection
#[derive(Debug, Clone)]
pub struct GradientConfig {
    /// Enable/disable gradient detection
    pub enabled: bool,
    /// R² threshold for accepting gradients (default 0.85)
    pub r_squared_threshold: f64,
    /// Maximum number of gradient stops to generate
    pub max_gradient_stops: usize,
    /// Minimum region area required for gradient analysis
    pub min_region_area: usize,
    /// Radial symmetry detection threshold
    pub radial_symmetry_threshold: f64,
    /// Enable enhanced PCA analysis with direction stability
    pub enhanced_pca: bool,
    /// Enable adaptive stop placement based on color quantiles
    pub adaptive_stops: bool,
    /// Color change threshold for stop placement (ΔE)
    pub color_change_threshold: f32,
    /// Direction stability threshold for linear gradients
    pub direction_stability_threshold: f64,
}

impl Default for GradientConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            r_squared_threshold: 0.85,
            max_gradient_stops: 8,
            min_region_area: 100,
            radial_symmetry_threshold: 0.8,
            enhanced_pca: true,
            adaptive_stops: true,
            color_change_threshold: 3.0, // ΔE threshold for meaningful color changes
            direction_stability_threshold: 0.9,
        }
    }
}

/// Types of gradients that can be detected
#[derive(Debug, Clone)]
pub enum GradientType {
    /// Linear gradient with direction vector and color stops
    Linear {
        /// Start point of the gradient line
        start: Point,
        /// End point of the gradient line
        end: Point,
        /// Color stops along the gradient
        stops: Vec<GradientStop>,
        /// Goodness of fit (R²)
        r_squared: f64,
    },
    /// Radial gradient with center and color stops
    Radial {
        /// Center point of the radial gradient
        center: Point,
        /// Radius of the gradient
        radius: f32,
        /// Color stops from center to edge
        stops: Vec<GradientStop>,
        /// Goodness of fit for radial symmetry
        r_squared: f64,
    },
    /// No gradient detected - use solid fill
    None,
}

/// A color stop in a gradient
#[derive(Debug, Clone)]
pub struct GradientStop {
    /// Position along gradient (0.0 to 1.0)
    pub offset: f32,
    /// Color at this position in LAB space
    pub color: (f32, f32, f32),
}

/// Result of gradient analysis for a region
#[derive(Debug, Clone)]
pub struct GradientAnalysis {
    /// Type of gradient detected
    pub gradient_type: GradientType,
    /// Whether gradient should be used over solid fill
    pub use_gradient: bool,
    /// Estimated file size reduction (bytes saved)
    pub size_benefit: i32,
}

/// Analyze a region for gradient patterns
///
/// This function performs comprehensive gradient analysis:
/// 1. Collects pixel positions and colors within the region
/// 2. Applies PCA to find principal direction of color variation
/// 3. Fits linear color model and calculates R²
/// 4. Tests for radial symmetry patterns
/// 5. Generates optimized gradient stops
///
/// # Arguments
/// * `pixels` - Pixel coordinates belonging to this region
/// * `colors` - Color values for all pixels in the image
/// * `dimensions` - Image dimensions (width, height)
/// * `config` - Gradient detection configuration
///
/// # Returns
/// * `VectorizeResult<GradientAnalysis>` - Analysis result or error
pub fn analyze_region_gradient(
    pixels: &[(u32, u32)],
    colors: &[Color],
    dimensions: (u32, u32),
    config: &GradientConfig,
) -> VectorizeResult<GradientAnalysis> {
    if !config.enabled || pixels.len() < config.min_region_area {
        return Ok(GradientAnalysis {
            gradient_type: GradientType::None,
            use_gradient: false,
            size_benefit: 0,
        });
    }

    let (width, _height) = dimensions;
    
    // Collect pixel positions and LAB colors
    let mut pixel_data = Vec::new();
    for &(x, y) in pixels {
        let pixel_idx = (y * width + x) as usize;
        if pixel_idx < colors.len() {
            let lab = colors[pixel_idx].to_lab();
            pixel_data.push(PixelData {
                x: x as f32,
                y: y as f32,
                l: lab.0,
                a: lab.1,
                b: lab.2,
            });
        }
    }

    if pixel_data.is_empty() {
        return Ok(GradientAnalysis {
            gradient_type: GradientType::None,
            use_gradient: false,
            size_benefit: 0,
        });
    }

    // Try linear gradient detection first
    let linear_result = detect_linear_gradient(&pixel_data, config)?;
    
    // Try radial gradient detection
    let radial_result = detect_radial_gradient(&pixel_data, config)?;
    
    // Choose the best gradient based on R² values
    let best_gradient = match (&linear_result.gradient_type, &radial_result.gradient_type) {
        (GradientType::Linear { r_squared: linear_r2, .. }, GradientType::Radial { r_squared: radial_r2, .. }) => {
            if linear_r2 > radial_r2 {
                linear_result
            } else {
                radial_result
            }
        },
        (GradientType::Linear { .. }, _) => linear_result,
        (_, GradientType::Radial { .. }) => radial_result,
        _ => GradientAnalysis {
            gradient_type: GradientType::None,
            use_gradient: false,
            size_benefit: 0,
        },
    };

    Ok(best_gradient)
}

/// Pixel data for gradient analysis
#[derive(Debug, Clone)]
struct PixelData {
    x: f32,
    y: f32,
    l: f32,
    a: f32,
    b: f32,
}

/// Detect linear gradient using enhanced PCA analysis
fn detect_linear_gradient(
    pixels: &[PixelData],
    config: &GradientConfig,
) -> VectorizeResult<GradientAnalysis> {
    if pixels.len() < 3 {
        return Ok(GradientAnalysis {
            gradient_type: GradientType::None,
            use_gradient: false,
            size_benefit: 0,
        });
    }

    // Calculate centroids
    let n = pixels.len() as f32;
    let x_mean = pixels.iter().map(|p| p.x).sum::<f32>() / n;
    let y_mean = pixels.iter().map(|p| p.y).sum::<f32>() / n;
    let l_mean = pixels.iter().map(|p| p.l).sum::<f32>() / n;
    let a_mean = pixels.iter().map(|p| p.a).sum::<f32>() / n;
    let b_mean = pixels.iter().map(|p| p.b).sum::<f32>() / n;

    // Enhanced PCA analysis considering both spatial and color variance
    let (principal_x, principal_y, eigenvalue_ratio) = if config.enhanced_pca {
        enhanced_pca_analysis(pixels, x_mean, y_mean, l_mean, a_mean, b_mean)?
    } else {
        basic_pca_analysis(pixels, x_mean, y_mean)?
    };

    // Direction stability check for enhanced PCA
    if config.enhanced_pca && eigenvalue_ratio < config.direction_stability_threshold {
        return Ok(GradientAnalysis {
            gradient_type: GradientType::None,
            use_gradient: false,
            size_benefit: 0,
        });
    }

    // Project pixels onto principal axis
    let mut projections = Vec::new();
    let mut min_proj = f32::INFINITY;
    let mut max_proj = f32::NEG_INFINITY;

    for pixel in pixels {
        let dx = pixel.x - x_mean;
        let dy = pixel.y - y_mean;
        let projection = dx * principal_x + dy * principal_y;
        
        projections.push((projection, (pixel.l, pixel.a, pixel.b)));
        min_proj = min_proj.min(projection);
        max_proj = max_proj.max(projection);
    }

    if (max_proj - min_proj).abs() < 1e-6 {
        return Ok(GradientAnalysis {
            gradient_type: GradientType::None,
            use_gradient: false,
            size_benefit: 0,
        });
    }

    // Fit linear models for L, A, B channels along principal axis
    let (l_slope, l_intercept, l_r2) = linear_regression(&projections.iter().map(|(proj, (l, _, _))| (*proj, *l)).collect::<Vec<_>>());
    let (a_slope, a_intercept, a_r2) = linear_regression(&projections.iter().map(|(proj, (_, a, _))| (*proj, *a)).collect::<Vec<_>>());
    let (b_slope, b_intercept, b_r2) = linear_regression(&projections.iter().map(|(proj, (_, _, b))| (*proj, *b)).collect::<Vec<_>>());

    // Enhanced R² calculation with perceptual weighting
    let combined_r2 = if config.enhanced_pca {
        // Weight L channel more heavily as it's more perceptually important
        l_r2 * 0.6 + a_r2 * 0.2 + b_r2 * 0.2
    } else {
        (l_r2 + a_r2 + b_r2) / 3.0
    };

    if combined_r2 < config.r_squared_threshold {
        return Ok(GradientAnalysis {
            gradient_type: GradientType::None,
            use_gradient: false,
            size_benefit: 0,
        });
    }

    // Generate gradient stops with adaptive placement
    let stops = if config.adaptive_stops {
        generate_adaptive_linear_gradient_stops(
            &projections,
            min_proj, max_proj,
            l_slope, l_intercept,
            a_slope, a_intercept,
            b_slope, b_intercept,
            config.max_gradient_stops,
            config.color_change_threshold,
        )
    } else {
        generate_linear_gradient_stops(
            min_proj, max_proj,
            l_slope, l_intercept,
            a_slope, a_intercept,
            b_slope, b_intercept,
            config.max_gradient_stops,
        )
    };

    // Calculate start and end points in image coordinates
    let start = Point {
        x: x_mean + min_proj * principal_x,
        y: y_mean + min_proj * principal_y,
    };
    let end = Point {
        x: x_mean + max_proj * principal_x,
        y: y_mean + max_proj * principal_y,
    };

    // Estimate size benefit (rough calculation)
    let solid_fill_size = 20; // Approximate bytes for solid fill
    let gradient_size = 50 + stops.len() * 25; // Base + stops
    let size_benefit = solid_fill_size as i32 - gradient_size as i32;

    Ok(GradientAnalysis {
        gradient_type: GradientType::Linear {
            start,
            end,
            stops,
            r_squared: combined_r2,
        },
        use_gradient: combined_r2 >= config.r_squared_threshold,
        size_benefit,
    })
}

/// Detect radial gradient by analyzing color variation from center
fn detect_radial_gradient(
    pixels: &[PixelData],
    config: &GradientConfig,
) -> VectorizeResult<GradientAnalysis> {
    if pixels.len() < 5 {
        return Ok(GradientAnalysis {
            gradient_type: GradientType::None,
            use_gradient: false,
            size_benefit: 0,
        });
    }

    // Find geometric center
    let n = pixels.len() as f32;
    let center_x = pixels.iter().map(|p| p.x).sum::<f32>() / n;
    let center_y = pixels.iter().map(|p| p.y).sum::<f32>() / n;

    // Calculate distances from center and colors
    let mut distance_colors = Vec::new();
    let mut max_distance = 0.0f32;

    for pixel in pixels {
        let dx = pixel.x - center_x;
        let dy = pixel.y - center_y;
        let distance = (dx * dx + dy * dy).sqrt();
        
        distance_colors.push((distance, (pixel.l, pixel.a, pixel.b)));
        max_distance = max_distance.max(distance);
    }

    if max_distance < 1e-6 {
        return Ok(GradientAnalysis {
            gradient_type: GradientType::None,
            use_gradient: false,
            size_benefit: 0,
        });
    }

    // Normalize distances to [0, 1]
    for (distance, _) in &mut distance_colors {
        *distance /= max_distance;
    }

    // Fit linear models for L, A, B channels along radial distance
    let (l_slope, l_intercept, l_r2) = linear_regression(&distance_colors.iter().map(|(d, (l, _, _))| (*d, *l)).collect::<Vec<_>>());
    let (a_slope, a_intercept, a_r2) = linear_regression(&distance_colors.iter().map(|(d, (_, a, _))| (*d, *a)).collect::<Vec<_>>());
    let (b_slope, b_intercept, b_r2) = linear_regression(&distance_colors.iter().map(|(d, (_, _, b))| (*d, *b)).collect::<Vec<_>>());

    // Combined R² for radial symmetry
    let combined_r2 = (l_r2 + a_r2 + b_r2) / 3.0;

    if combined_r2 < config.radial_symmetry_threshold.min(config.r_squared_threshold) {
        return Ok(GradientAnalysis {
            gradient_type: GradientType::None,
            use_gradient: false,
            size_benefit: 0,
        });
    }

    // Generate radial gradient stops
    let stops = generate_radial_gradient_stops(
        l_slope, l_intercept,
        a_slope, a_intercept,
        b_slope, b_intercept,
        config.max_gradient_stops,
    );

    // Estimate size benefit
    let solid_fill_size = 20;
    let gradient_size = 60 + stops.len() * 25; // Radial gradients are slightly larger
    let size_benefit = solid_fill_size as i32 - gradient_size as i32;

    Ok(GradientAnalysis {
        gradient_type: GradientType::Radial {
            center: Point { x: center_x, y: center_y },
            radius: max_distance,
            stops,
            r_squared: combined_r2,
        },
        use_gradient: combined_r2 >= config.r_squared_threshold,
        size_benefit,
    })
}

/// Perform linear regression and return slope, intercept, and R²
fn linear_regression(data: &[(f32, f32)]) -> (f32, f32, f64) {
    let n = data.len() as f32;
    if n < 2.0 {
        return (0.0, 0.0, 0.0);
    }

    let sum_x = data.iter().map(|(x, _)| *x).sum::<f32>();
    let sum_y = data.iter().map(|(_, y)| *y).sum::<f32>();
    let sum_xx = data.iter().map(|(x, _)| x * x).sum::<f32>();
    let sum_xy = data.iter().map(|(x, y)| x * y).sum::<f32>();
    let sum_yy = data.iter().map(|(_, y)| y * y).sum::<f32>();

    let mean_x = sum_x / n;
    let mean_y = sum_y / n;

    let numerator = sum_xy - n * mean_x * mean_y;
    let denominator = sum_xx - n * mean_x * mean_x;

    if denominator.abs() < 1e-6 {
        return (0.0, mean_y, 0.0);
    }

    let slope = numerator / denominator;
    let intercept = mean_y - slope * mean_x;

    // Calculate R²
    let ss_tot = sum_yy - n * mean_y * mean_y;
    if ss_tot < 1e-6 {
        return (slope, intercept, 1.0); // Perfect fit if no variation
    }

    let mut ss_res = 0.0f32;
    for (x, y) in data {
        let predicted = slope * x + intercept;
        let residual = y - predicted;
        ss_res += residual * residual;
    }

    let r_squared = ((ss_tot - ss_res) / ss_tot).max(0.0) as f64;
    (slope, intercept, r_squared)
}

/// Generate optimized gradient stops for linear gradients
fn generate_linear_gradient_stops(
    min_proj: f32,
    max_proj: f32,
    l_slope: f32, l_intercept: f32,
    a_slope: f32, a_intercept: f32,
    b_slope: f32, b_intercept: f32,
    max_stops: usize,
) -> Vec<GradientStop> {
    let mut stops = Vec::new();
    let range = max_proj - min_proj;

    if range < 1e-6 {
        // Single color
        stops.push(GradientStop {
            offset: 0.0,
            color: (l_intercept, a_intercept, b_intercept),
        });
        return stops;
    }

    // Generate evenly spaced stops
    let num_stops = max_stops.min(8).max(2);
    for i in 0..num_stops {
        let t = i as f32 / (num_stops - 1) as f32;
        let proj_value = min_proj + t * range;
        
        let l = l_slope * proj_value + l_intercept;
        let a = a_slope * proj_value + a_intercept;
        let b = b_slope * proj_value + b_intercept;
        
        stops.push(GradientStop {
            offset: t,
            color: (l, a, b),
        });
    }

    stops
}

/// Generate optimized gradient stops for radial gradients
fn generate_radial_gradient_stops(
    l_slope: f32, l_intercept: f32,
    a_slope: f32, a_intercept: f32,
    b_slope: f32, b_intercept: f32,
    max_stops: usize,
) -> Vec<GradientStop> {
    let mut stops = Vec::new();
    let num_stops = max_stops.min(8).max(2);

    for i in 0..num_stops {
        let t = i as f32 / (num_stops - 1) as f32;
        
        let l = l_slope * t + l_intercept;
        let a = a_slope * t + a_intercept;
        let b = b_slope * t + b_intercept;
        
        stops.push(GradientStop {
            offset: t,
            color: (l, a, b),
        });
    }

    stops
}

/// Generate unique gradient ID for SVG
pub fn generate_gradient_id(region_id: usize, gradient_type: &str) -> String {
    format!("gradient-{}-{}", gradient_type, region_id)
}

/// Enhanced PCA analysis considering both spatial and color variance
fn enhanced_pca_analysis(
    pixels: &[PixelData],
    x_mean: f32, y_mean: f32,
    l_mean: f32, a_mean: f32, b_mean: f32,
) -> VectorizeResult<(f32, f32, f64)> {
    let n = pixels.len() as f32;
    
    // Build combined spatial-color covariance matrix (5x5)
    // We'll focus on the spatial part but weight by color variance
    let mut spatial_cov = [[0.0f32; 2]; 2]; // 2x2 for x,y
    
    // Calculate spatial covariance weighted by color intensity
    for pixel in pixels {
        let dx = pixel.x - x_mean;
        let dy = pixel.y - y_mean;
        let dl = pixel.l - l_mean;
        let da = pixel.a - a_mean;
        let db = pixel.b - b_mean;
        
        // Color variance (using ΔE approximation)
        let color_var = (dl * dl + da * da + db * db).sqrt();
        
        // Weight spatial covariance by color variance to emphasize areas with color changes
        let weight = (1.0 + color_var * 0.1).min(3.0); // Cap the weight
        
        spatial_cov[0][0] += dx * dx * weight;
        spatial_cov[0][1] += dx * dy * weight;
        spatial_cov[1][0] += dx * dy * weight;
        spatial_cov[1][1] += dy * dy * weight;
    }
    
    // Normalize
    for i in 0..2 {
        for j in 0..2 {
            spatial_cov[i][j] /= n;
        }
    }
    
    // Find eigenvalues and eigenvectors of the spatial covariance matrix
    let xx = spatial_cov[0][0];
    let xy = spatial_cov[0][1];
    let yy = spatial_cov[1][1];
    
    let trace = xx + yy;
    let det = xx * yy - xy * xy;
    let discriminant = trace * trace - 4.0 * det;
    
    if discriminant < 0.0 {
        return Ok((1.0, 0.0, 0.0)); // Default to horizontal direction
    }
    
    let sqrt_discriminant = discriminant.sqrt();
    let eigenvalue1 = (trace + sqrt_discriminant) / 2.0;
    let eigenvalue2 = (trace - sqrt_discriminant) / 2.0;
    
    // Calculate eigenvalue ratio for direction stability
    let eigenvalue_ratio = if eigenvalue1 > 1e-6 {
        (eigenvalue1 - eigenvalue2) / eigenvalue1
    } else {
        0.0
    };
    
    // Principal direction (eigenvector for largest eigenvalue)
    let (principal_x, principal_y) = if xy.abs() > 1e-6 {
        let vx = eigenvalue1 - yy;
        let vy = xy;
        let norm = (vx * vx + vy * vy).sqrt();
        if norm > 1e-6 {
            (vx / norm, vy / norm)
        } else {
            (1.0, 0.0)
        }
    } else if xx > yy {
        (1.0, 0.0)
    } else {
        (0.0, 1.0)
    };
    
    Ok((principal_x, principal_y, eigenvalue_ratio as f64))
}

/// Basic PCA analysis using only spatial coordinates (original implementation)
fn basic_pca_analysis(
    pixels: &[PixelData],
    x_mean: f32, y_mean: f32,
) -> VectorizeResult<(f32, f32, f64)> {
    let n = pixels.len() as f32;
    let mut xx = 0.0f32;
    let mut xy = 0.0f32;
    let mut yy = 0.0f32;

    for pixel in pixels {
        let dx = pixel.x - x_mean;
        let dy = pixel.y - y_mean;
        
        xx += dx * dx;
        xy += dx * dy;
        yy += dy * dy;
    }

    xx /= n;
    xy /= n;
    yy /= n;

    // Find eigenvalues and eigenvectors of the covariance matrix
    let trace = xx + yy;
    let det = xx * yy - xy * xy;
    let discriminant = trace * trace - 4.0 * det;

    if discriminant < 0.0 {
        return Ok((1.0, 0.0, 0.0));
    }

    let sqrt_discriminant = discriminant.sqrt();
    let eigenvalue1 = (trace + sqrt_discriminant) / 2.0;
    let eigenvalue2 = (trace - sqrt_discriminant) / 2.0;
    
    let eigenvalue_ratio = if eigenvalue1 > 1e-6 {
        (eigenvalue1 - eigenvalue2) / eigenvalue1
    } else {
        0.0
    };

    // Principal direction (eigenvector for largest eigenvalue)
    let (principal_x, principal_y) = if xy.abs() > 1e-6 {
        let vx = eigenvalue1 - yy;
        let vy = xy;
        let norm = (vx * vx + vy * vy).sqrt();
        if norm > 1e-6 {
            (vx / norm, vy / norm)
        } else {
            (1.0, 0.0)
        }
    } else if xx > yy {
        (1.0, 0.0)
    } else {
        (0.0, 1.0)
    };
    
    Ok((principal_x, principal_y, eigenvalue_ratio as f64))
}

/// Generate adaptive gradient stops based on color distribution quantiles
fn generate_adaptive_linear_gradient_stops(
    projections: &[(f32, (f32, f32, f32))],
    min_proj: f32,
    max_proj: f32,
    l_slope: f32, l_intercept: f32,
    a_slope: f32, a_intercept: f32,
    b_slope: f32, b_intercept: f32,
    max_stops: usize,
    color_change_threshold: f32,
) -> Vec<GradientStop> {
    let mut stops = Vec::new();
    let range = max_proj - min_proj;

    if range < 1e-6 {
        // Single color
        stops.push(GradientStop {
            offset: 0.0,
            color: (l_intercept, a_intercept, b_intercept),
        });
        return stops;
    }

    // Sort projections by position
    let mut sorted_projections = projections.to_vec();
    sorted_projections.sort_by(|a, b| a.0.partial_cmp(&b.0).unwrap());
    
    // Start with the endpoints
    stops.push(GradientStop {
        offset: 0.0,
        color: (
            l_slope * min_proj + l_intercept,
            a_slope * min_proj + a_intercept,
            b_slope * min_proj + b_intercept,
        ),
    });
    
    // Add intermediate stops based on color change analysis
    let mut current_color = stops[0].color;
    let mut last_offset = 0.0;
    
    // Divide the range into segments and check for significant color changes
    let segments = (max_stops - 1).max(10); // Use more segments for analysis
    
    for i in 1..segments {
        let t = i as f32 / segments as f32;
        let proj_value = min_proj + t * range;
        let test_color = (
            l_slope * proj_value + l_intercept,
            a_slope * proj_value + a_intercept,
            b_slope * proj_value + b_intercept,
        );
        
        // Calculate ΔE between current and test color
        let delta_e = lab_distance_simple(current_color, test_color);
        
        // Add stop if color change is significant and we haven't reached max stops
        if delta_e > color_change_threshold && stops.len() < max_stops && (t - last_offset) > 0.1 {
            stops.push(GradientStop {
                offset: t,
                color: test_color,
            });
            current_color = test_color;
            last_offset = t;
        }
    }
    
    // Always end with the final color
    if stops.len() == 1 || stops[stops.len() - 1].offset < 1.0 {
        stops.push(GradientStop {
            offset: 1.0,
            color: (
                l_slope * max_proj + l_intercept,
                a_slope * max_proj + a_intercept,
                b_slope * max_proj + b_intercept,
            ),
        });
    }
    
    // Ensure we don't have too many stops
    if stops.len() > max_stops {
        // Keep the most important stops (largest color changes)
        optimize_gradient_stops(stops, max_stops)
    } else {
        stops
    }
}

/// Simple LAB distance calculation for gradient analysis
fn lab_distance_simple(color1: (f32, f32, f32), color2: (f32, f32, f32)) -> f32 {
    let dl = color1.0 - color2.0;
    let da = color1.1 - color2.1;
    let db = color1.2 - color2.2;
    (dl * dl + da * da + db * db).sqrt()
}

/// Optimize gradient stops by removing less important ones
fn optimize_gradient_stops(stops: Vec<GradientStop>, max_stops: usize) -> Vec<GradientStop> {
    if stops.len() <= max_stops {
        return stops;
    }
    
    // Keep the first and last stops always
    let first = stops[0].clone();
    let last = stops[stops.len() - 1].clone();
    
    // Calculate importance scores for intermediate stops
    let mut scored_stops = Vec::new();
    for i in 1..stops.len()-1 {
        let prev_color = stops[i-1].color;
        let curr_color = stops[i].color;
        let next_color = stops[i+1].color;
        
        // Importance is based on color change before and after
        let change_before = lab_distance_simple(prev_color, curr_color);
        let change_after = lab_distance_simple(curr_color, next_color);
        let importance = change_before + change_after;
        
        scored_stops.push((importance, i, stops[i].clone()));
    }
    
    // Sort by importance (descending)
    scored_stops.sort_by(|a, b| b.0.partial_cmp(&a.0).unwrap());
    
    // Take the most important intermediate stops
    let mut result = vec![first];
    for i in 0..(max_stops - 2).min(scored_stops.len()) {
        result.push(scored_stops[i].2.clone());
    }
    result.push(last);
    
    // Sort by offset to maintain order
    result.sort_by(|a, b| a.offset.partial_cmp(&b.offset).unwrap());
    result
}

/// Analyze multiple regions for gradient patterns
pub fn analyze_regions_gradients(
    regions: &HashMap<usize, Vec<(u32, u32)>>,
    colors: &[Color],
    dimensions: (u32, u32),
    config: &GradientConfig,
) -> VectorizeResult<HashMap<usize, GradientAnalysis>> {
    let mut results = HashMap::new();

    for (&region_id, pixels) in regions {
        let analysis = analyze_region_gradient(pixels, colors, dimensions, config)?;
        results.insert(region_id, analysis);
    }

    Ok(results)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_linear_regression() {
        // Perfect linear relationship: y = 2x + 1
        let data = vec![(0.0, 1.0), (1.0, 3.0), (2.0, 5.0), (3.0, 7.0)];
        let (slope, intercept, r2) = linear_regression(&data);
        
        assert!((slope - 2.0).abs() < 0.01, "Slope should be ~2.0, got {}", slope);
        assert!((intercept - 1.0).abs() < 0.01, "Intercept should be ~1.0, got {}", intercept);
        assert!(r2 > 0.99, "R² should be near 1.0 for perfect fit, got {}", r2);
    }

    #[test]
    fn test_gradient_config_default() {
        let config = GradientConfig::default();
        assert!(config.enabled);
        assert_eq!(config.r_squared_threshold, 0.85);
        assert_eq!(config.max_gradient_stops, 8);
    }

    #[test]
    fn test_generate_gradient_id() {
        let id = generate_gradient_id(42, "linear");
        assert_eq!(id, "gradient-linear-42");
        
        let id = generate_gradient_id(123, "radial");
        assert_eq!(id, "gradient-radial-123");
    }

    #[test]
    fn test_gradient_stop_generation() {
        let stops = generate_linear_gradient_stops(
            0.0, 10.0,  // min_proj, max_proj
            1.0, 50.0,  // L: slope, intercept
            0.5, 0.0,   // A: slope, intercept
            -0.2, 10.0, // B: slope, intercept
            4,          // max_stops
        );
        
        assert_eq!(stops.len(), 4);
        assert!((stops[0].offset - 0.0).abs() < 0.01);
        assert!((stops[3].offset - 1.0).abs() < 0.01);
        
        // Check first stop color (at min_proj = 0.0)
        assert!((stops[0].color.0 - 50.0).abs() < 0.01); // L = 1.0 * 0.0 + 50.0
        
        // Check last stop color (at max_proj = 10.0)
        assert!((stops[3].color.0 - 60.0).abs() < 0.01); // L = 1.0 * 10.0 + 50.0
    }

    #[test]
    fn test_analyze_region_gradient_disabled() {
        let pixels = vec![(0, 0), (1, 1), (2, 2)];
        let colors = vec![
            Color::Lab(50.0, 0.0, 0.0),
            Color::Lab(60.0, 0.0, 0.0),
            Color::Lab(70.0, 0.0, 0.0),
        ];
        let dimensions = (3, 3);
        
        let mut config = GradientConfig::default();
        config.enabled = false;
        
        let result = analyze_region_gradient(&pixels, &colors, dimensions, &config).unwrap();
        
        assert!(matches!(result.gradient_type, GradientType::None));
        assert!(!result.use_gradient);
    }

    #[test]
    fn test_analyze_region_gradient_too_small() {
        let pixels = vec![(0, 0), (1, 1)]; // Only 2 pixels
        let colors = vec![
            Color::Lab(50.0, 0.0, 0.0),
            Color::Lab(60.0, 0.0, 0.0),
        ];
        let dimensions = (2, 2);
        
        let mut config = GradientConfig::default();
        config.min_region_area = 10; // Require at least 10 pixels
        
        let result = analyze_region_gradient(&pixels, &colors, dimensions, &config).unwrap();
        
        assert!(matches!(result.gradient_type, GradientType::None));
        assert!(!result.use_gradient);
    }
}