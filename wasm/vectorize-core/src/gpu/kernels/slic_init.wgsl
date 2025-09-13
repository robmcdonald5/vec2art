// SLIC Superpixel Initialization Shader
// Initializes cluster centers for SLIC segmentation

struct SlicParams {
    width: u32,
    height: u32,
    num_segments_x: u32,
    num_segments_y: u32,
    compactness: f32,
    iteration: u32,
    _padding: u32,
    _padding2: u32,
}

struct ClusterCenter {
    x: f32,
    y: f32,
    l: f32,  // LAB color space
    a: f32,
    b: f32,
    count: u32,
    _padding: u32,
    _padding2: u32,
}

@group(0) @binding(0) var<uniform> params: SlicParams;
@group(0) @binding(1) var<storage, read> input_image: array<vec4<f32>>; // RGBA
@group(0) @binding(2) var<storage, read_write> cluster_centers: array<ClusterCenter>;

// Convert RGB to LAB color space (simplified)
fn rgb_to_lab(rgb: vec3<f32>) -> vec3<f32> {
    // Simplified conversion for GPU efficiency
    // In production, use proper color space conversion
    
    // Normalize RGB to [0, 1] if needed
    let r = rgb.x;
    let g = rgb.y;
    let b = rgb.z;
    
    // Convert to XYZ (simplified)
    let x = 0.412453 * r + 0.357580 * g + 0.180423 * b;
    let y = 0.212671 * r + 0.715160 * g + 0.072169 * b;
    let z = 0.019334 * r + 0.119193 * g + 0.950227 * b;
    
    // Convert XYZ to LAB (simplified)
    let fx = select(pow((x + 0.055) / 1.055, 2.4), x / 12.92, x > 0.04045);
    let fy = select(pow((y + 0.055) / 1.055, 2.4), y / 12.92, y > 0.04045);
    let fz = select(pow((z + 0.055) / 1.055, 2.4), z / 12.92, z > 0.04045);
    
    let l = 116.0 * fy - 16.0;
    let a = 500.0 * (fx - fy);
    let b_val = 200.0 * (fy - fz);
    
    return vec3<f32>(l, a, b_val);
}

// Initialize cluster centers on a regular grid
@compute @workgroup_size(64, 1, 1)
fn init_cluster_centers(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let cluster_id = global_id.x;
    let total_clusters = params.num_segments_x * params.num_segments_y;
    
    if (cluster_id >= total_clusters) {
        return;
    }
    
    // Calculate grid position
    let cluster_x = cluster_id % params.num_segments_x;
    let cluster_y = cluster_id / params.num_segments_x;
    
    // Calculate step sizes
    let step_x = f32(params.width) / f32(params.num_segments_x);
    let step_y = f32(params.height) / f32(params.num_segments_y);
    
    // Initial center position (grid center)
    let center_x = (f32(cluster_x) + 0.5) * step_x;
    let center_y = (f32(cluster_y) + 0.5) * step_y;
    
    // Sample color at center
    let px = u32(center_x);
    let py = u32(center_y);
    
    if (px < params.width && py < params.height) {
        let idx = py * params.width + px;
        let color = input_image[idx];
        let lab = rgb_to_lab(color.xyz);
        
        // Initialize cluster center
        cluster_centers[cluster_id].x = center_x;
        cluster_centers[cluster_id].y = center_y;
        cluster_centers[cluster_id].l = lab.x;
        cluster_centers[cluster_id].a = lab.y;
        cluster_centers[cluster_id].b = lab.z;
        cluster_centers[cluster_id].count = 0u;
    }
}

// Perturb cluster centers to lowest gradient position in 3x3 neighborhood
@compute @workgroup_size(64, 1, 1)
fn perturb_centers(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let cluster_id = global_id.x;
    let total_clusters = params.num_segments_x * params.num_segments_y;
    
    if (cluster_id >= total_clusters) {
        return;
    }
    
    var center = cluster_centers[cluster_id];
    let cx = u32(center.x);
    let cy = u32(center.y);
    
    var min_gradient = 999999.0;
    var best_x = cx;
    var best_y = cy;
    
    // Search 3x3 neighborhood for lowest gradient
    for (var dy = -1; dy <= 1; dy = dy + 1) {
        for (var dx = -1; dx <= 1; dx = dx + 1) {
            let nx = i32(cx) + dx;
            let ny = i32(cy) + dy;
            
            // Check bounds
            if (nx > 0 && nx < i32(params.width) - 1 && 
                ny > 0 && ny < i32(params.height) - 1) {
                
                let idx = u32(ny) * params.width + u32(nx);
                
                // Calculate gradient (simple difference)
                let idx_left = u32(ny) * params.width + u32(nx - 1);
                let idx_right = u32(ny) * params.width + u32(nx + 1);
                let idx_top = u32(ny - 1) * params.width + u32(nx);
                let idx_bottom = u32(ny + 1) * params.width + u32(nx);
                
                let color_center = input_image[idx].xyz;
                let color_left = input_image[idx_left].xyz;
                let color_right = input_image[idx_right].xyz;
                let color_top = input_image[idx_top].xyz;
                let color_bottom = input_image[idx_bottom].xyz;
                
                let dx_color = color_right - color_left;
                let dy_color = color_bottom - color_top;
                
                let gradient = length(dx_color) + length(dy_color);
                
                if (gradient < min_gradient) {
                    min_gradient = gradient;
                    best_x = u32(nx);
                    best_y = u32(ny);
                }
            }
        }
    }
    
    // Update center to lowest gradient position
    if (best_x < params.width && best_y < params.height) {
        let idx = best_y * params.width + best_x;
        let color = input_image[idx];
        let lab = rgb_to_lab(color.xyz);
        
        cluster_centers[cluster_id].x = f32(best_x);
        cluster_centers[cluster_id].y = f32(best_y);
        cluster_centers[cluster_id].l = lab.x;
        cluster_centers[cluster_id].a = lab.y;
        cluster_centers[cluster_id].b = lab.z;
    }
}