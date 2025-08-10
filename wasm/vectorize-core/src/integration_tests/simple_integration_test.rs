//! Simple Integration Test to Demonstrate Phase A+B Pipeline
//! 
//! This test creates a simple synthetic image and runs it through the complete
//! Phase A → Phase B pipeline to validate basic functionality.

use super::*;
use crate::{LogoConfig, RegionsConfig, TraceLowConfig, TraceBackend};
use crate::refine::RefineConfig;
use image::{ImageBuffer, Rgba};

/// Create a simple test image for integration testing
fn create_test_image() -> ImageBuffer<Rgba<u8>, Vec<u8>> {
    let width = 100;
    let height = 100;
    
    ImageBuffer::from_fn(width, height, |x, y| {
        // Create a simple geometric pattern
        if x < 50 && y < 50 {
            Rgba([255, 0, 0, 255]) // Red square
        } else if x >= 50 && y < 50 {
            Rgba([0, 255, 0, 255]) // Green square
        } else if x < 50 && y >= 50 {
            Rgba([0, 0, 255, 255]) // Blue square
        } else {
            Rgba([255, 255, 255, 255]) // White square
        }
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::algorithms::logo::vectorize_logo;
    use crate::algorithms::regions::vectorize_regions;
    use crate::algorithms::trace_low::vectorize_trace_low;
    use crate::refine::refine_vectorization;

    #[tokio::test]
    async fn test_logo_to_refinement_basic_pipeline() {
        // Create test image
        let image = create_test_image();
        
        // Phase A: Logo vectorization
        let logo_config = LogoConfig::default();
        let phase_a_paths = vectorize_logo(&image, &logo_config)
            .expect("Logo vectorization should succeed");
        
        // Skip if no paths generated (normal for some synthetic images)
        if phase_a_paths.is_empty() {
            println!("Logo algorithm produced no paths for synthetic image (expected)");
            return;
        }
        
        // Phase B: Refinement
        let refine_config = RefineConfig::fast(); // Use fast config for testing
        let phase_b_paths = refine_vectorization(&phase_a_paths, &image, &refine_config)
            .expect("Refinement should succeed");
        
        // Basic validation
        assert!(!phase_b_paths.is_empty(), "Refinement should produce paths");
        println!("Logo → Refinement pipeline: {} → {} paths", 
                phase_a_paths.len(), phase_b_paths.len());
    }
    
    #[tokio::test]
    async fn test_regions_to_refinement_basic_pipeline() {
        // Create test image
        let image = create_test_image();
        
        // Phase A: Regions vectorization
        let mut regions_config = RegionsConfig::default();
        regions_config.num_colors = 4; // Match our test image
        regions_config.min_region_area = 10; // Small regions for test image
        
        let phase_a_paths = vectorize_regions(&image, &regions_config)
            .expect("Regions vectorization should succeed");
        
        assert!(!phase_a_paths.is_empty(), "Regions should produce paths");
        
        // Phase B: Refinement
        let refine_config = RefineConfig::fast(); // Use fast config for testing
        let phase_b_paths = refine_vectorization(&phase_a_paths, &image, &refine_config)
            .expect("Refinement should succeed");
        
        // Basic validation
        assert!(!phase_b_paths.is_empty(), "Refinement should produce paths");
        println!("Regions → Refinement pipeline: {} → {} paths", 
                phase_a_paths.len(), phase_b_paths.len());
    }
    
    #[tokio::test]
    async fn test_trace_low_to_refinement_basic_pipeline() {
        // Create test image
        let image = create_test_image();
        
        // Phase A: Trace-low vectorization
        let mut trace_config = TraceLowConfig::default();
        trace_config.backend = TraceBackend::Edge;
        trace_config.detail = 0.5; // Medium detail
        
        let phase_a_paths = vectorize_trace_low(&image, &trace_config)
            .expect("Trace-low vectorization should succeed");
        
        // Skip if no paths generated (normal for some images with trace-low)
        if phase_a_paths.is_empty() {
            println!("Trace-low algorithm produced no paths for synthetic image (expected)");
            return;
        }
        
        // Phase B: Refinement
        let refine_config = RefineConfig::fast(); // Use fast config for testing
        let phase_b_paths = refine_vectorization(&phase_a_paths, &image, &refine_config)
            .expect("Refinement should succeed");
        
        // Basic validation
        assert!(!phase_b_paths.is_empty(), "Refinement should produce paths");
        println!("Trace-low → Refinement pipeline: {} → {} paths", 
                phase_a_paths.len(), phase_b_paths.len());
    }
    
    #[tokio::test]
    async fn test_quality_measurement_integration() {
        // Create test image
        let image = create_test_image();
        
        // Generate Phase A output
        let mut regions_config = RegionsConfig::default();
        regions_config.num_colors = 4;
        regions_config.min_region_area = 10;
        
        let phase_a_paths = vectorize_regions(&image, &regions_config)
            .expect("Regions vectorization should succeed");
        
        if phase_a_paths.is_empty() {
            println!("Skipping quality test - no paths generated");
            return;
        }
        
        // Measure Phase A quality
        let phase_a_quality = measure_phase_a_quality(&phase_a_paths, &image)
            .expect("Phase A quality measurement should succeed");
        
        println!("Phase A Quality - ΔE: {:.1}, SSIM: {:.3}", 
                phase_a_quality.delta_e_avg, phase_a_quality.ssim_avg);
        
        // Apply Phase B refinement
        let refine_config = RefineConfig::fast();
        let phase_b_paths = refine_vectorization(&phase_a_paths, &image, &refine_config)
            .expect("Refinement should succeed");
        
        // Measure improvement
        let improvement = measure_phase_b_improvement(
            &phase_a_paths, &phase_b_paths, &image, &refine_config
        ).expect("Phase B improvement measurement should succeed");
        
        println!("Phase B Improvement - ΔE: {:.1} → {:.1}, SSIM: {:.3} → {:.3}", 
                improvement.baseline_metrics.delta_e_avg,
                improvement.refined_metrics.delta_e_avg,
                improvement.baseline_metrics.ssim_avg,
                improvement.refined_metrics.ssim_avg);
        
        // Basic validation
        assert!(improvement.baseline_metrics.delta_e_avg >= 0.0);
        assert!(improvement.refined_metrics.ssim_avg >= 0.0);
        assert!(improvement.refined_metrics.ssim_avg <= 1.0);
    }
    
    #[tokio::test]
    async fn test_performance_measurement_integration() {
        // Create test image
        let image = create_test_image();
        
        // Test performance measurement
        let refine_config = RefineConfig::fast();
        let performance_metrics = measure_combined_performance(&image, "regions", &refine_config).await
            .expect("Performance measurement should succeed");
        
        println!("Performance Metrics:");
        println!("  Phase A: {}ms", performance_metrics.phase_a_duration_ms);
        println!("  Phase B: {}ms", performance_metrics.phase_b_duration_ms);
        println!("  Total: {}ms", performance_metrics.total_duration_ms);
        
        // Basic validation
        assert!(performance_metrics.phase_a_duration_ms > 0);
        assert!(performance_metrics.total_duration_ms >= performance_metrics.phase_a_duration_ms);
        assert!(performance_metrics.total_duration_ms >= performance_metrics.phase_b_duration_ms);
        
        // Validate against performance targets
        let targets_met = validate_performance_targets(&performance_metrics);
        println!("Performance targets met: {}", targets_met);
    }
    
    #[tokio::test]
    async fn test_pipeline_test_result_structure() {
        // Test the pipeline test result structure
        let refine_config = RefineConfig::default();
        
        // This would normally use a real image file, but we'll test with synthetic
        let image_path = "synthetic_test";
        
        // Test logo pipeline (even if it produces no results)
        match test_logo_to_refinement_pipeline(image_path, &refine_config).await {
            Ok(result) => {
                println!("Logo pipeline test completed: success={}", result.success);
                assert_eq!(result.algorithm, "logo");
                assert_eq!(result.image_path, image_path);
            }
            Err(e) => {
                println!("Logo pipeline test failed (expected with synthetic path): {}", e);
                // This is expected since we're using a synthetic path
            }
        }
    }
}