//! GPU algorithm selection and performance optimization
//!
//! This module provides intelligent algorithm selection between GPU and CPU
//! based on image characteristics, hardware capabilities, and performance metrics.

use crate::gpu::device::GpuDevice;
use crate::gpu::processor::{GpuProcessor, GpuProcessorConfig};
use image::{ImageBuffer, Luma, Rgba};
use std::sync::Arc;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AlgorithmSelectorError {
    #[error("GPU not available or failed to initialize")]
    GpuNotAvailable,
    #[error("Unsupported algorithm: {0}")]
    UnsupportedAlgorithm(String),
    #[error("Performance measurement failed: {0}")]
    PerformanceMeasurementFailed(String),
}

/// Supported algorithms for GPU acceleration
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GpuAlgorithm {
    EdgeDetection,
    Stippling,
    GaussianBlur,
    Superpixels,
}

/// Processing strategy recommendation
#[derive(Debug, Clone, PartialEq)]
pub enum ProcessingStrategy {
    /// Use GPU for processing
    GpuPreferred {
        algorithm: GpuAlgorithm,
        expected_speedup: f32,
    },
    /// Use CPU for processing
    CpuOnly {
        reason: String,
    },
    /// Use GPU with CPU fallback
    GpuWithFallback {
        algorithm: GpuAlgorithm,
        fallback_reason: String,
    },
}

/// Image characteristics used for algorithm selection
#[derive(Debug, Clone)]
pub struct ImageCharacteristics {
    pub width: u32,
    pub height: u32,
    pub pixel_count: u64,
    pub aspect_ratio: f32,
    pub estimated_complexity: f32, // 0.0 to 1.0
    pub has_high_detail: bool,
    pub has_smooth_regions: bool,
}

impl ImageCharacteristics {
    /// Analyze image characteristics for algorithm selection
    pub fn analyze_grayscale(image: &ImageBuffer<Luma<u8>, Vec<u8>>) -> Self {
        let width = image.width();
        let height = image.height();
        let pixel_count = (width * height) as u64;
        let aspect_ratio = width as f32 / height as f32;

        // Simple complexity estimation based on local variance
        let mut total_variance = 0.0;
        let mut high_detail_pixels = 0;
        let mut smooth_pixels = 0;

        for y in 1..height - 1 {
            for x in 1..width - 1 {
                let center = image.get_pixel(x, y)[0] as f32;
                let neighbors = [
                    image.get_pixel(x - 1, y)[0] as f32,
                    image.get_pixel(x + 1, y)[0] as f32,
                    image.get_pixel(x, y - 1)[0] as f32,
                    image.get_pixel(x, y + 1)[0] as f32,
                ];

                let variance = neighbors
                    .iter()
                    .map(|&n| (n - center).powi(2))
                    .sum::<f32>()
                    / 4.0;

                total_variance += variance;

                if variance > 100.0 {
                    high_detail_pixels += 1;
                } else if variance < 10.0 {
                    smooth_pixels += 1;
                }
            }
        }

        let total_analyzed = ((width - 2) * (height - 2)) as u64;
        let estimated_complexity = (total_variance / (total_analyzed as f32 * 255.0)).min(1.0);
        let has_high_detail = high_detail_pixels > total_analyzed / 4;
        let has_smooth_regions = smooth_pixels > total_analyzed / 3;

        Self {
            width,
            height,
            pixel_count,
            aspect_ratio,
            estimated_complexity,
            has_high_detail,
            has_smooth_regions,
        }
    }

    /// Analyze RGB image characteristics
    pub fn analyze_color(image: &ImageBuffer<Rgba<u8>, Vec<u8>>) -> Self {
        // Convert to grayscale for analysis
        let gray: ImageBuffer<Luma<u8>, Vec<u8>> = ImageBuffer::from_fn(
            image.width(),
            image.height(),
            |x, y| {
                let pixel = image.get_pixel(x, y);
                let gray = (0.299 * pixel[0] as f32 + 0.587 * pixel[1] as f32 + 0.114 * pixel[2] as f32) as u8;
                Luma([gray])
            },
        );
        Self::analyze_grayscale(&gray)
    }
}

/// GPU algorithm selector with performance tracking
pub struct GpuAlgorithmSelector {
    gpu_processor: Option<Arc<GpuProcessor>>,
    performance_history: Vec<PerformanceRecord>,
}

#[derive(Debug, Clone)]
struct PerformanceRecord {
    algorithm: GpuAlgorithm,
    image_size: (u32, u32),
    #[allow(dead_code)]
    gpu_time_ms: f32,
    #[allow(dead_code)]
    cpu_time_ms: Option<f32>,
    speedup: f32,
}

impl GpuAlgorithmSelector {
    /// Create new algorithm selector
    pub fn new() -> Self {
        Self {
            gpu_processor: None,
            performance_history: Vec::new(),
        }
    }

    /// Initialize with GPU device
    pub async fn with_gpu(device: Arc<GpuDevice>) -> Self {
        let gpu_processor = Some(Arc::new(GpuProcessor::new(
            (*device).clone(),
            GpuProcessorConfig::default(),
        )));

        Self {
            gpu_processor,
            performance_history: Vec::new(),
        }
    }

    /// Check if GPU is available
    pub fn is_gpu_available(&self) -> bool {
        self.gpu_processor.is_some()
    }

    /// Select optimal processing strategy for given image and algorithm
    pub fn select_strategy(
        &self,
        characteristics: &ImageCharacteristics,
        algorithm: GpuAlgorithm,
    ) -> ProcessingStrategy {
        // Check if GPU is available
        if self.gpu_processor.is_none() {
            return ProcessingStrategy::CpuOnly {
                reason: "GPU not available".to_string(),
            };
        }

        let gpu_processor = self.gpu_processor.as_ref().unwrap();

        // Check if image size is suitable for GPU processing
        if !gpu_processor.should_use_gpu(characteristics.width, characteristics.height) {
            return ProcessingStrategy::CpuOnly {
                reason: format!(
                    "Image too small ({} pixels) for GPU efficiency",
                    characteristics.pixel_count
                ),
            };
        }

        // Algorithm-specific recommendations
        match algorithm {
            GpuAlgorithm::EdgeDetection => {
                self.select_edge_detection_strategy(characteristics)
            }
            GpuAlgorithm::Stippling => {
                self.select_stippling_strategy(characteristics)
            }
            GpuAlgorithm::GaussianBlur => {
                self.select_gaussian_blur_strategy(characteristics)
            }
            GpuAlgorithm::Superpixels => {
                self.select_superpixels_strategy(characteristics)
            }
        }
    }

    /// Select strategy for edge detection
    fn select_edge_detection_strategy(&self, characteristics: &ImageCharacteristics) -> ProcessingStrategy {
        // Edge detection benefits greatly from GPU parallelization
        let expected_speedup = if characteristics.pixel_count > 4_000_000 {
            // Very large images: 5-15x speedup
            10.0
        } else if characteristics.pixel_count > 1_000_000 {
            // Large images: 3-8x speedup
            5.0
        } else {
            // Medium images: 2-4x speedup
            2.5
        };

        // Additional speedup for high-detail images
        let complexity_bonus = if characteristics.has_high_detail {
            1.5
        } else {
            1.0
        };

        ProcessingStrategy::GpuPreferred {
            algorithm: GpuAlgorithm::EdgeDetection,
            expected_speedup: expected_speedup * complexity_bonus,
        }
    }

    /// Select strategy for stippling
    fn select_stippling_strategy(&self, characteristics: &ImageCharacteristics) -> ProcessingStrategy {
        // Stippling is highly parallelizable and benefits from GPU
        let expected_speedup = if characteristics.pixel_count > 2_000_000 {
            // Large images: 8-20x speedup due to independent pixel processing
            12.0
        } else if characteristics.pixel_count > 500_000 {
            // Medium images: 4-10x speedup
            6.0
        } else {
            // Small images: 2-5x speedup
            3.0
        };

        ProcessingStrategy::GpuPreferred {
            algorithm: GpuAlgorithm::Stippling,
            expected_speedup,
        }
    }

    /// Select strategy for Gaussian blur
    fn select_gaussian_blur_strategy(&self, characteristics: &ImageCharacteristics) -> ProcessingStrategy {
        // Gaussian blur is memory bandwidth bound, good GPU candidate
        let _expected_speedup = if characteristics.pixel_count > 1_000_000 {
            4.0
        } else {
            2.0
        };

        ProcessingStrategy::GpuWithFallback {
            algorithm: GpuAlgorithm::GaussianBlur,
            fallback_reason: "Gaussian blur implementation not yet complete".to_string(),
        }
    }

    /// Select strategy for superpixels
    fn select_superpixels_strategy(&self, characteristics: &ImageCharacteristics) -> ProcessingStrategy {
        // Superpixels (SLIC) can benefit from GPU but has sequential components
        if characteristics.pixel_count > 2_000_000 {
            ProcessingStrategy::GpuPreferred {
                algorithm: GpuAlgorithm::Superpixels,
                expected_speedup: 3.0,
            }
        } else {
            ProcessingStrategy::CpuOnly {
                reason: "SLIC superpixels more efficient on CPU for smaller images".to_string(),
            }
        }
    }

    /// Record performance measurement for future optimization
    pub fn record_performance(
        &mut self,
        algorithm: GpuAlgorithm,
        image_size: (u32, u32),
        gpu_time_ms: f32,
        cpu_time_ms: Option<f32>,
    ) {
        let speedup = cpu_time_ms.map_or(1.0, |cpu| cpu / gpu_time_ms);

        let record = PerformanceRecord {
            algorithm,
            image_size,
            gpu_time_ms,
            cpu_time_ms,
            speedup,
        };

        self.performance_history.push(record);

        // Keep only recent records to prevent unbounded growth
        if self.performance_history.len() > 100 {
            self.performance_history.remove(0);
        }
    }

    /// Get average speedup for given algorithm and image size range
    pub fn get_historical_speedup(
        &self,
        algorithm: GpuAlgorithm,
        pixel_count: u64,
    ) -> Option<f32> {
        let relevant_records: Vec<&PerformanceRecord> = self
            .performance_history
            .iter()
            .filter(|record| {
                record.algorithm == algorithm &&
                {
                    let record_pixels = (record.image_size.0 * record.image_size.1) as u64;
                    // Within 2x size range
                    record_pixels >= pixel_count / 2 && record_pixels <= pixel_count * 2
                }
            })
            .collect();

        if relevant_records.is_empty() {
            None
        } else {
            let avg_speedup = relevant_records
                .iter()
                .map(|record| record.speedup)
                .sum::<f32>()
                / relevant_records.len() as f32;
            Some(avg_speedup)
        }
    }

    /// Get performance summary
    pub fn get_performance_summary(&self) -> String {
        if self.performance_history.is_empty() {
            return "No performance data available".to_string();
        }

        let mut summary = String::new();
        summary.push_str("GPU Performance Summary:\n");

        for algorithm in [
            GpuAlgorithm::EdgeDetection,
            GpuAlgorithm::Stippling,
            GpuAlgorithm::GaussianBlur,
            GpuAlgorithm::Superpixels,
        ] {
            let records: Vec<&PerformanceRecord> = self
                .performance_history
                .iter()
                .filter(|r| r.algorithm == algorithm)
                .collect();

            if !records.is_empty() {
                let avg_speedup = records.iter().map(|r| r.speedup).sum::<f32>() / records.len() as f32;
                summary.push_str(&format!("  {:?}: {:.2}x speedup ({} samples)\n", 
                    algorithm, avg_speedup, records.len()));
            }
        }

        summary
    }
}

impl Default for GpuAlgorithmSelector {
    fn default() -> Self {
        Self::new()
    }
}