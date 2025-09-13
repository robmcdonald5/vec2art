// GPU-accelerated stippling (dots) shader
// Converts image to stippled dots based on brightness and density

struct StipplingParams {
    width: u32,
    height: u32,
    dot_size: f32,
    density: f32,
}

@group(0) @binding(0) var<uniform> params: StipplingParams;
@group(0) @binding(1) var<storage, read> input_image: array<f32>; // Grayscale input
@group(0) @binding(2) var<storage, read_write> output_dots: array<u32>; // Dot positions as u32 packed coordinates

// Simple hash function for pseudorandom number generation
fn hash(p: vec2<u32>) -> u32 {
    var h = p.x ^ (p.y * 1597u);
    h = h ^ (h >> 13u);
    h = h * 1597u;
    h = h ^ (h >> 16u);
    return h;
}

// Convert hash to float [0, 1]
fn hash_to_float(h: u32) -> f32 {
    return f32(h & 0xFFFFFFu) / 16777216.0;
}

@compute @workgroup_size(16, 16, 1)
fn stippling_generate(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let x = global_id.x;
    let y = global_id.y;
    
    // Check bounds
    if (x >= params.width || y >= params.height) {
        return;
    }
    
    let idx = y * params.width + x;
    let brightness = input_image[idx];
    
    // Invert brightness (darker areas get more dots)
    let darkness = 1.0 - brightness;
    
    // Generate pseudorandom number based on position
    let random_val = hash_to_float(hash(vec2<u32>(x, y)));
    
    // Probability threshold based on darkness and density
    let threshold = darkness * params.density;
    
    // Place dot if random value is below threshold
    if (random_val < threshold) {
        // Pack coordinates into u32 (16 bits each)
        output_dots[idx] = (y << 16u) | x;
    } else {
        output_dots[idx] = 0xFFFFFFFFu; // No dot marker
    }
}

// Adaptive stippling - varies dot size based on image content
@compute @workgroup_size(16, 16, 1) 
fn adaptive_stippling(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let x = global_id.x;
    let y = global_id.y;
    
    if (x >= params.width || y >= params.height) {
        return;
    }
    
    let idx = y * params.width + x;
    let brightness = input_image[idx];
    
    // Calculate local contrast (simplified gradient)
    var contrast = 0.0;
    if (x > 0u && x < params.width - 1u && y > 0u && y < params.height - 1u) {
        let left = input_image[y * params.width + (x - 1u)];
        let right = input_image[y * params.width + (x + 1u)];
        let top = input_image[(y - 1u) * params.width + x];
        let bottom = input_image[(y + 1u) * params.width + x];
        
        let grad_x = abs(right - left) * 0.5;
        let grad_y = abs(bottom - top) * 0.5;
        contrast = sqrt(grad_x * grad_x + grad_y * grad_y);
    }
    
    let darkness = 1.0 - brightness;
    let random_val = hash_to_float(hash(vec2<u32>(x, y)));
    
    // Adaptive threshold: more dots in dark areas and high-contrast areas
    let threshold = (darkness * 0.7 + contrast * 0.3) * params.density;
    
    // Variable dot size based on darkness
    let dot_size_factor = u32(clamp(darkness * 3.0 + 1.0, 1.0, 4.0));
    
    if (random_val < threshold) {
        // Pack coordinates and size into u32 (10 bits x, 10 bits y, 4 bits size, 8 bits unused)
        output_dots[idx] = (dot_size_factor << 28u) | (y << 14u) | x;
    } else {
        output_dots[idx] = 0xFFFFFFFFu; // No dot marker
    }
}