// Gaussian blur compute shader for edge detection preprocessing
// This shader applies a Gaussian blur filter to smooth the image before edge detection

struct Params {
    width: u32,
    height: u32,
    sigma: f32,
    kernel_size: u32,
}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> input_image: array<f32>;
@group(0) @binding(2) var<storage, read_write> output_image: array<f32>;

// Shared memory for caching image tiles
var<workgroup> tile: array<f32, 324>; // 18x18 for 16x16 workgroup with 1-pixel border

@compute @workgroup_size(16, 16, 1)
fn gaussian_blur_main(@builtin(global_invocation_id) global_id: vec3<u32>,
                     @builtin(local_invocation_id) local_id: vec3<u32>,
                     @builtin(workgroup_id) workgroup_id: vec3<u32>) {
    let gid = global_id.xy;
    let lid = local_id.xy;
    
    // Check bounds
    if (gid.x >= params.width || gid.y >= params.height) {
        return;
    }
    
    // Calculate Gaussian kernel (simplified 5x5 for now)
    // In production, this would be precomputed and passed as uniform
    let kernel_5x5: array<f32, 25> = array<f32, 25>(
        0.003765, 0.015019, 0.023792, 0.015019, 0.003765,
        0.015019, 0.059912, 0.094907, 0.059912, 0.015019,
        0.023792, 0.094907, 0.150342, 0.094907, 0.023792,
        0.015019, 0.059912, 0.094907, 0.059912, 0.015019,
        0.003765, 0.015019, 0.023792, 0.015019, 0.003765
    );
    
    let radius = 2u;
    var sum = 0.0;
    
    // Apply convolution
    for (var dy = 0u; dy < 5u; dy = dy + 1u) {
        for (var dx = 0u; dx < 5u; dx = dx + 1u) {
            let x = i32(gid.x) + i32(dx) - i32(radius);
            let y = i32(gid.y) + i32(dy) - i32(radius);
            
            // Clamp to image bounds
            let cx = clamp(x, 0, i32(params.width) - 1);
            let cy = clamp(y, 0, i32(params.height) - 1);
            
            let idx = u32(cy) * params.width + u32(cx);
            let kernel_idx = dy * 5u + dx;
            
            sum = sum + input_image[idx] * kernel_5x5[kernel_idx];
        }
    }
    
    let output_idx = gid.y * params.width + gid.x;
    output_image[output_idx] = sum;
}

// Separable Gaussian blur for better performance (horizontal pass)
@compute @workgroup_size(256, 1, 1)
fn gaussian_blur_horizontal(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let pixel_id = global_id.x;
    let y = pixel_id / params.width;
    let x = pixel_id % params.width;
    
    if (y >= params.height) {
        return;
    }
    
    // 1D Gaussian kernel (to be combined with vertical pass)
    let kernel_1d: array<f32, 5> = array<f32, 5>(
        0.06136, 0.24477, 0.38774, 0.24477, 0.06136
    );
    
    var sum = 0.0;
    let radius = 2;
    
    for (var i = -radius; i <= radius; i = i + 1) {
        let sample_x = clamp(i32(x) + i, 0, i32(params.width) - 1);
        let idx = y * params.width + u32(sample_x);
        sum = sum + input_image[idx] * kernel_1d[u32(i + radius)];
    }
    
    output_image[pixel_id] = sum;
}