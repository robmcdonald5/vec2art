// Canny edge detector - Non-Maximum Suppression and Hysteresis Thresholding
// This shader performs the final steps of Canny edge detection

struct CannyParams {
    width: u32,
    height: u32,
    low_threshold: f32,
    high_threshold: f32,
}

@group(0) @binding(0) var<uniform> params: CannyParams;
@group(0) @binding(1) var<storage, read> gradient_magnitude: array<f32>;
@group(0) @binding(2) var<storage, read> gradient_direction: array<f32>;
@group(0) @binding(3) var<storage, read_write> edges: array<u32>; // 0=non-edge, 1=weak, 2=strong

const PI: f32 = 3.14159265359;

// Non-Maximum Suppression kernel
@compute @workgroup_size(16, 16, 1)
fn non_maximum_suppression(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let x = global_id.x;
    let y = global_id.y;
    
    // Check bounds
    if (x >= params.width || y >= params.height) {
        return;
    }
    
    // Skip border pixels
    if (x == 0u || x == params.width - 1u || y == 0u || y == params.height - 1u) {
        edges[y * params.width + x] = 0u;
        return;
    }
    
    let idx = y * params.width + x;
    let magnitude = gradient_magnitude[idx];
    var direction = gradient_direction[idx];
    
    // Normalize direction to [0, π]
    if (direction < 0.0) {
        direction = direction + PI;
    }
    
    // Quantize direction to 8 directions (0°, 45°, 90°, 135°)
    var neighbor1_mag: f32;
    var neighbor2_mag: f32;
    
    // Determine neighbors based on gradient direction
    if (direction < PI / 8.0 || direction >= 7.0 * PI / 8.0) {
        // Horizontal edge (check left and right)
        neighbor1_mag = gradient_magnitude[y * params.width + (x - 1u)];
        neighbor2_mag = gradient_magnitude[y * params.width + (x + 1u)];
    } else if (direction < 3.0 * PI / 8.0) {
        // Diagonal edge (check top-right and bottom-left)
        neighbor1_mag = gradient_magnitude[(y - 1u) * params.width + (x + 1u)];
        neighbor2_mag = gradient_magnitude[(y + 1u) * params.width + (x - 1u)];
    } else if (direction < 5.0 * PI / 8.0) {
        // Vertical edge (check top and bottom)
        neighbor1_mag = gradient_magnitude[(y - 1u) * params.width + x];
        neighbor2_mag = gradient_magnitude[(y + 1u) * params.width + x];
    } else {
        // Diagonal edge (check top-left and bottom-right)
        neighbor1_mag = gradient_magnitude[(y - 1u) * params.width + (x - 1u)];
        neighbor2_mag = gradient_magnitude[(y + 1u) * params.width + (x + 1u)];
    }
    
    // Suppress non-maximum pixels
    if (magnitude >= neighbor1_mag && magnitude >= neighbor2_mag) {
        // Apply double thresholding
        if (magnitude >= params.high_threshold) {
            edges[idx] = 2u; // Strong edge
        } else if (magnitude >= params.low_threshold) {
            edges[idx] = 1u; // Weak edge
        } else {
            edges[idx] = 0u; // Non-edge
        }
    } else {
        edges[idx] = 0u; // Suppressed
    }
}

// Hysteresis edge tracking - connects weak edges to strong edges
@compute @workgroup_size(16, 16, 1)
fn hysteresis_tracking(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let x = global_id.x;
    let y = global_id.y;
    
    // Check bounds
    if (x >= params.width || y >= params.height) {
        return;
    }
    
    let idx = y * params.width + x;
    
    // Only process weak edges
    if (edges[idx] != 1u) {
        return;
    }
    
    // Check 8-connected neighborhood for strong edges
    var has_strong_neighbor = false;
    
    for (var dy = -1; dy <= 1; dy = dy + 1) {
        for (var dx = -1; dx <= 1; dx = dx + 1) {
            if (dx == 0 && dy == 0) {
                continue;
            }
            
            let nx = i32(x) + dx;
            let ny = i32(y) + dy;
            
            // Check bounds
            if (nx >= 0 && nx < i32(params.width) && 
                ny >= 0 && ny < i32(params.height)) {
                let neighbor_idx = u32(ny) * params.width + u32(nx);
                if (edges[neighbor_idx] == 2u) {
                    has_strong_neighbor = true;
                    break;
                }
            }
        }
        if (has_strong_neighbor) {
            break;
        }
    }
    
    // Promote weak edge to strong if connected to strong edge
    if (has_strong_neighbor) {
        edges[idx] = 2u;
    }
}

// Final edge cleanup - converts to binary edge map
@compute @workgroup_size(256, 1, 1)
fn edge_cleanup(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let idx = global_id.x;
    
    if (idx >= params.width * params.height) {
        return;
    }
    
    // Convert to binary: strong edges become 1, everything else becomes 0
    edges[idx] = select(0u, 1u, edges[idx] == 2u);
}