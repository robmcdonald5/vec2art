// Sobel edge detection compute shader
// Calculates gradient magnitude and direction using Sobel operators

struct Params {
    width: u32,
    height: u32,
    threshold: f32,
    _padding: u32,
}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> input_image: array<f32>;
@group(0) @binding(2) var<storage, read_write> gradient_magnitude: array<f32>;
@group(0) @binding(3) var<storage, read_write> gradient_direction: array<f32>;

// Sobel X kernel: [-1, 0, 1; -2, 0, 2; -1, 0, 1]
// Sobel Y kernel: [-1, -2, -1; 0, 0, 0; 1, 2, 1]

@compute @workgroup_size(16, 16, 1)
fn sobel_edge_detection(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let x = global_id.x;
    let y = global_id.y;
    
    // Check bounds
    if (x >= params.width || y >= params.height) {
        return;
    }
    
    // Skip border pixels
    if (x == 0u || x == params.width - 1u || y == 0u || y == params.height - 1u) {
        let idx = y * params.width + x;
        gradient_magnitude[idx] = 0.0;
        gradient_direction[idx] = 0.0;
        return;
    }
    
    // Sample 3x3 neighborhood
    let idx00 = (y - 1u) * params.width + (x - 1u);
    let idx01 = (y - 1u) * params.width + x;
    let idx02 = (y - 1u) * params.width + (x + 1u);
    let idx10 = y * params.width + (x - 1u);
    let idx11 = y * params.width + x;
    let idx12 = y * params.width + (x + 1u);
    let idx20 = (y + 1u) * params.width + (x - 1u);
    let idx21 = (y + 1u) * params.width + x;
    let idx22 = (y + 1u) * params.width + (x + 1u);
    
    let p00 = input_image[idx00];
    let p01 = input_image[idx01];
    let p02 = input_image[idx02];
    let p10 = input_image[idx10];
    let p12 = input_image[idx12];
    let p20 = input_image[idx20];
    let p21 = input_image[idx21];
    let p22 = input_image[idx22];
    
    // Apply Sobel operators
    let gx = -p00 + p02 - 2.0 * p10 + 2.0 * p12 - p20 + p22;
    let gy = -p00 - 2.0 * p01 - p02 + p20 + 2.0 * p21 + p22;
    
    // Calculate gradient magnitude
    let magnitude = sqrt(gx * gx + gy * gy);
    
    // Calculate gradient direction (in radians)
    // Add small epsilon to avoid division by zero
    let direction = atan2(gy, gx + 0.00001);
    
    // Store results
    let output_idx = y * params.width + x;
    gradient_magnitude[output_idx] = magnitude;
    gradient_direction[output_idx] = direction;
}

// Optimized version using shared memory for better cache locality
var<workgroup> tile: array<f32, 324>; // 18x18 for 16x16 workgroup with 1-pixel border

@compute @workgroup_size(16, 16, 1)
fn sobel_edge_detection_optimized(
    @builtin(global_invocation_id) global_id: vec3<u32>,
    @builtin(local_invocation_id) local_id: vec3<u32>,
    @builtin(workgroup_id) workgroup_id: vec3<u32>
) {
    let gid = global_id.xy;
    let lid = local_id.xy;
    let wid = workgroup_id.xy;
    
    // Load tile into shared memory (including borders)
    let tile_size = 18u;
    let tile_x = lid.x + 1u;
    let tile_y = lid.y + 1u;
    
    // Each thread loads its pixel plus border pixels cooperatively
    let global_x = wid.x * 16u + lid.x;
    let global_y = wid.y * 16u + lid.y;
    
    if (global_x < params.width && global_y < params.height) {
        tile[tile_y * tile_size + tile_x] = input_image[global_y * params.width + global_x];
        
        // Load borders cooperatively
        if (lid.x == 0u && global_x > 0u) {
            tile[tile_y * tile_size + 0u] = input_image[global_y * params.width + global_x - 1u];
        }
        if (lid.x == 15u && global_x < params.width - 1u) {
            tile[tile_y * tile_size + 17u] = input_image[global_y * params.width + global_x + 1u];
        }
        if (lid.y == 0u && global_y > 0u) {
            tile[0u * tile_size + tile_x] = input_image[(global_y - 1u) * params.width + global_x];
        }
        if (lid.y == 15u && global_y < params.height - 1u) {
            tile[17u * tile_size + tile_x] = input_image[(global_y + 1u) * params.width + global_x];
        }
    }
    
    // Synchronize to ensure all shared memory is loaded
    workgroupBarrier();
    
    // Check bounds
    if (gid.x >= params.width || gid.y >= params.height) {
        return;
    }
    
    // Skip border pixels
    if (gid.x == 0u || gid.x == params.width - 1u || 
        gid.y == 0u || gid.y == params.height - 1u) {
        let idx = gid.y * params.width + gid.x;
        gradient_magnitude[idx] = 0.0;
        gradient_direction[idx] = 0.0;
        return;
    }
    
    // Sample from shared memory
    let p00 = tile[(tile_y - 1u) * tile_size + (tile_x - 1u)];
    let p01 = tile[(tile_y - 1u) * tile_size + tile_x];
    let p02 = tile[(tile_y - 1u) * tile_size + (tile_x + 1u)];
    let p10 = tile[tile_y * tile_size + (tile_x - 1u)];
    let p12 = tile[tile_y * tile_size + (tile_x + 1u)];
    let p20 = tile[(tile_y + 1u) * tile_size + (tile_x - 1u)];
    let p21 = tile[(tile_y + 1u) * tile_size + tile_x];
    let p22 = tile[(tile_y + 1u) * tile_size + (tile_x + 1u)];
    
    // Apply Sobel operators
    let gx = -p00 + p02 - 2.0 * p10 + 2.0 * p12 - p20 + p22;
    let gy = -p00 - 2.0 * p01 - p02 + p20 + 2.0 * p21 + p22;
    
    // Calculate gradient magnitude and direction
    let magnitude = sqrt(gx * gx + gy * gy);
    let direction = atan2(gy, gx + 0.00001);
    
    // Store results
    let output_idx = gid.y * params.width + gid.x;
    gradient_magnitude[output_idx] = magnitude;
    gradient_direction[output_idx] = direction;
}