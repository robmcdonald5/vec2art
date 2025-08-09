//! Main refinement loop and convergence control for Phase B
//! 
//! This module implements the core refinement loop that orchestrates the
//! error-driven improvement process until quality targets are met or
//! time/iteration budgets are exhausted.

use crate::algorithms::logo::SvgPath;
use crate::config::SvgConfig;
use crate::refine::{
    rasterize::{rasterize_svg_paths, RasterError},
    error::{compute_tile_errors, TileAnalysisConfig},
    actions::{apply_refinement_actions, RefinementContext},
};
use crate::error::VectorizeResult;
use image::{ImageBuffer, Rgba};
use serde::{Deserialize, Serialize};
use std::time::{Duration, Instant};
use thiserror::Error;

/// Errors that can occur during refinement loop
#[derive(Error, Debug)]
pub enum RefineError {
    #[error("Rasterization failed: {0}")]
    Rasterization(#[from] RasterError),
    
    #[error("Time budget exceeded: {elapsed_ms}ms > {budget_ms}ms")]
    TimeBudgetExceeded { elapsed_ms: u64, budget_ms: u64 },
    
    #[error("Convergence detection failed")]
    ConvergenceFailed,
    
    #[error("Invalid configuration: {0}")]
    InvalidConfig(String),
}

/// Main configuration for Phase B refinement
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RefineConfig {
    /// Maximum refinement iterations (roadmap: 2-3)
    pub max_iterations: u32,
    
    /// Maximum total refinement time in milliseconds (roadmap: 600ms)
    pub max_time_ms: u64,
    
    /// Target ΔE threshold for convergence (roadmap: 6.0)
    pub target_delta_e: f64,
    
    /// Target SSIM threshold for convergence (roadmap: 0.93)
    pub target_ssim: f64,
    
    /// Error analysis tile size in pixels (roadmap: 32)
    pub tile_size: u32,
    
    /// Maximum tiles to process per iteration (roadmap: 5-8)
    pub max_tiles_per_iteration: u32,
    
    /// Error plateau threshold for early termination (roadmap: 0.5)
    pub error_plateau_threshold: f64,
}

impl Default for RefineConfig {
    fn default() -> Self {
        Self {
            max_iterations: 2,           // Conservative default per roadmap
            max_time_ms: 600,           // Roadmap requirement
            target_delta_e: 6.0,       // Roadmap quality target
            target_ssim: 0.93,         // Roadmap quality target
            tile_size: 32,             // Roadmap specification
            max_tiles_per_iteration: 5, // Conservative default
            error_plateau_threshold: 0.5, // Roadmap specification
        }
    }
}

impl RefineConfig {
    /// Validate refinement configuration
    pub fn validate(&self) -> Result<(), String> {
        if self.max_iterations == 0 {
            return Err("Max iterations must be at least 1".to_string());
        }
        if self.max_iterations > 10 {
            return Err("Max iterations should not exceed 10 for reasonable performance".to_string());
        }
        if self.max_time_ms == 0 {
            return Err("Time budget must be positive".to_string());
        }
        if self.max_time_ms > 5000 {
            return Err("Time budget should not exceed 5000ms for reasonable performance".to_string());
        }
        if self.target_delta_e <= 0.0 {
            return Err("Target ΔE must be positive".to_string());
        }
        if self.target_ssim <= 0.0 || self.target_ssim >= 1.0 {
            return Err("Target SSIM must be between 0.0 and 1.0".to_string());
        }
        if self.tile_size < 4 || self.tile_size > 128 {
            return Err("Tile size must be between 4 and 128 pixels".to_string());
        }
        if self.max_tiles_per_iteration == 0 {
            return Err("Must process at least 1 tile per iteration".to_string());
        }
        if self.error_plateau_threshold < 0.0 {
            return Err("Error plateau threshold must be non-negative".to_string());
        }
        
        Ok(())
    }
}

/// Budget tracking for refinement process
#[derive(Debug, Clone)]
pub struct RefinementBudget {
    pub max_iterations: u32,
    pub max_time_ms: u64,
    pub target_delta_e: f64,
    pub target_ssim: f64,
    pub plateau_threshold: f64,
}

impl From<&RefineConfig> for RefinementBudget {
    fn from(config: &RefineConfig) -> Self {
        Self {
            max_iterations: config.max_iterations,
            max_time_ms: config.max_time_ms,
            target_delta_e: config.target_delta_e,
            target_ssim: config.target_ssim,
            plateau_threshold: config.error_plateau_threshold,
        }
    }
}

/// Convergence state tracking
#[derive(Debug, Clone)]
pub struct ConvergenceState {
    pub iteration: u32,
    pub start_time: Instant,
    pub current_delta_e: f64,
    pub current_ssim: f64,
    pub previous_delta_e: f64,
    pub has_converged: bool,
    pub convergence_reason: String,
}

impl ConvergenceState {
    /// Create new convergence state
    pub fn new() -> Self {
        Self {
            iteration: 0,
            start_time: Instant::now(),
            current_delta_e: f64::INFINITY,
            current_ssim: 0.0,
            previous_delta_e: f64::INFINITY,
            has_converged: false,
            convergence_reason: String::new(),
        }
    }
    
    /// Update metrics after an iteration
    pub fn update_metrics(&mut self, delta_e: f64, ssim: f64) {
        self.previous_delta_e = self.current_delta_e;
        self.current_delta_e = delta_e;
        self.current_ssim = ssim;
        self.iteration += 1;
    }
    
    /// Get elapsed time since start
    pub fn elapsed(&self) -> Duration {
        self.start_time.elapsed()
    }
}

/// Check convergence criteria and determine if refinement should stop
/// 
/// Implements multi-criteria stopping conditions from the roadmap:
/// - Error plateau detection
/// - Time budget exceeded  
/// - Iteration limit reached
/// - Quality target achieved
/// 
/// # Arguments
/// * `state` - Current convergence state (will be modified)
/// * `budget` - Refinement budget and targets
/// 
/// # Returns
/// * `bool` - True if refinement should stop
pub fn check_convergence(
    state: &mut ConvergenceState,
    budget: &RefinementBudget,
) -> bool {
    // Time budget exceeded
    if state.elapsed() > Duration::from_millis(budget.max_time_ms) {
        state.convergence_reason = format!(
            "Time budget exceeded: {}ms > {}ms",
            state.elapsed().as_millis(),
            budget.max_time_ms
        );
        state.has_converged = true;
        return true;
    }
    
    // Iteration limit reached
    if state.iteration >= budget.max_iterations {
        state.convergence_reason = format!(
            "Max iterations reached: {} >= {}",
            state.iteration,
            budget.max_iterations
        );
        state.has_converged = true;
        return true;
    }
    
    // Quality target achieved
    if state.current_delta_e <= budget.target_delta_e && state.current_ssim >= budget.target_ssim {
        state.convergence_reason = format!(
            "Quality target achieved: ΔE={:.1} ≤ {:.1}, SSIM={:.3} ≥ {:.3}",
            state.current_delta_e, budget.target_delta_e,
            state.current_ssim, budget.target_ssim
        );
        state.has_converged = true;
        return true;
    }
    
    // Error plateau detected (only check after first iteration)
    if state.iteration > 0 {
        let improvement = state.previous_delta_e - state.current_delta_e;
        if improvement < budget.plateau_threshold {
            state.convergence_reason = format!(
                "Error plateau detected: improvement={:.2} < {:.2}",
                improvement, budget.plateau_threshold
            );
            state.has_converged = true;
            return true;
        }
    }
    
    false
}

/// Main Phase B refinement pipeline
/// 
/// Implements the complete error-driven refinement loop:
/// 1. Rasterize current SVG to match original resolution
/// 2. Compute per-tile error (ΔE + SSIM)
/// 3. Select worst tiles for refinement
/// 4. Apply local actions (add control point, split region, upgrade fill)
/// 5. Check convergence, repeat if necessary
/// 6. Return refined paths
/// 
/// # Arguments
/// * `paths` - SVG paths from Phase A vectorization
/// * `original_image` - Original input image for comparison
/// * `config` - Refinement configuration and quality targets
/// 
/// # Returns
/// * `VectorizeResult<Vec<SvgPath>>` - Refined SVG paths with improved quality
/// 
/// # Quality Targets
/// * ΔE ≤ 6.0 - Perceptual color difference in LAB space
/// * SSIM ≥ 0.93 - Structural similarity (grayscale)
/// * ≤ 600ms - Total refinement time budget
pub fn refine_svg_paths(
    paths: &[SvgPath],
    original_image: &ImageBuffer<Rgba<u8>, Vec<u8>>,
    config: &RefineConfig,
) -> VectorizeResult<Vec<SvgPath>> {
    // Validate configuration
    if let Err(e) = config.validate() {
        return Err(crate::error::VectorizeError::config_error(e));
    }
    
    log::info!("Starting Phase B refinement: max_iterations={}, time_budget={}ms", 
               config.max_iterations, config.max_time_ms);
    
    let mut refined_paths = paths.to_vec();
    let budget = RefinementBudget::from(config);
    let mut state = ConvergenceState::new();
    let svg_config = SvgConfig::default();
    
    // Main refinement loop
    while !check_convergence(&mut state, &budget) {
        let iteration_start = Instant::now();
        
        log::debug!("Starting refinement iteration {}", state.iteration + 1);
        
        // Step 1: Rasterize current SVG
        let rasterized_image = rasterize_svg_paths(
            &refined_paths,
            original_image.width(),
            original_image.height(),
            &svg_config,
        ).map_err(|e| crate::error::VectorizeError::algorithm_error(format!("Rasterization failed: {}", e)))?;
        
        // Step 2: Compute tile errors
        let tile_config = TileAnalysisConfig {
            tile_size: config.tile_size,
            max_tiles_per_iteration: config.max_tiles_per_iteration as usize,
            delta_e_threshold: config.target_delta_e,
            ssim_threshold: config.target_ssim,
            use_content_weighting: true,
        };
        
        let tile_errors = compute_tile_errors(
            original_image,
            &rasterized_image,
            &tile_config,
        ).map_err(|e| crate::error::VectorizeError::algorithm_error(format!("Tile analysis failed: {}", e)))?;
        
        if tile_errors.is_empty() {
            log::info!("No tiles require refinement, quality target achieved");
            state.convergence_reason = "No tiles require refinement".to_string();
            state.has_converged = true;
            break;
        }
        
        // Calculate overall metrics for convergence checking
        let avg_delta_e = tile_errors.iter().map(|t| t.delta_e_avg).sum::<f64>() / tile_errors.len() as f64;
        let avg_ssim = tile_errors.iter().map(|t| t.ssim).sum::<f64>() / tile_errors.len() as f64;
        
        log::debug!("Iteration {}: {} tiles need refinement, avg ΔE={:.1}, avg SSIM={:.3}",
                   state.iteration + 1, tile_errors.len(), avg_delta_e, avg_ssim);
        
        // Step 3: Apply refinement actions
        let remaining_time = Duration::from_millis(budget.max_time_ms)
            .saturating_sub(state.elapsed());
        
        let mut context = RefinementContext {
            paths: refined_paths.clone(),
            original_image: original_image.clone(),
            rasterized_image,
            width: original_image.width(),
            height: original_image.height(),
        };
        
        let action_results = apply_refinement_actions(
            &tile_errors,
            &mut context,
            remaining_time,
        )?;
        
        // Step 4: Update paths if actions succeeded
        let successful_actions = action_results.iter().filter(|r| r.success).count();
        if successful_actions > 0 {
            refined_paths = context.paths;
            log::debug!("Applied {} successful refinement actions", successful_actions);
        } else {
            log::debug!("No successful actions applied, may converge due to plateau");
        }
        
        // Step 5: Update convergence state
        state.update_metrics(avg_delta_e, avg_ssim);
        
        let iteration_time = iteration_start.elapsed();
        log::debug!("Iteration {} completed in {:?}", state.iteration, iteration_time);
    }
    
    // Log final convergence status
    log::info!("Phase B refinement completed: {}, iterations={}, elapsed={:?}",
              state.convergence_reason, state.iteration, state.elapsed());
    
    Ok(refined_paths)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::algorithms::logo::{SvgPath, SvgElementType};

    #[test]
    fn test_refine_config_validation() {
        let mut config = RefineConfig::default();
        assert!(config.validate().is_ok());
        
        // Test invalid iterations
        config.max_iterations = 0;
        assert!(config.validate().is_err());
        
        config.max_iterations = 20; // Too many
        assert!(config.validate().is_err());
        
        // Reset and test invalid time budget
        config = RefineConfig::default();
        config.max_time_ms = 0;
        assert!(config.validate().is_err());
    }
    
    #[test]
    fn test_convergence_state() {
        let mut state = ConvergenceState::new();
        assert_eq!(state.iteration, 0);
        assert!(!state.has_converged);
        
        state.update_metrics(8.0, 0.90);
        assert_eq!(state.iteration, 1);
        assert_eq!(state.current_delta_e, 8.0);
        assert_eq!(state.current_ssim, 0.90);
    }
    
    #[test]
    fn test_check_convergence_quality_target() {
        let mut state = ConvergenceState::new();
        state.current_delta_e = 5.0;
        state.current_ssim = 0.95;
        
        let budget = RefinementBudget {
            max_iterations: 5,
            max_time_ms: 1000,
            target_delta_e: 6.0,
            target_ssim: 0.93,
            plateau_threshold: 0.5,
        };
        
        // Should converge due to quality target
        assert!(check_convergence(&mut state, &budget));
        assert!(state.has_converged);
        assert!(state.convergence_reason.contains("Quality target achieved"));
    }
    
    #[test]
    fn test_check_convergence_max_iterations() {
        let mut state = ConvergenceState::new();
        state.iteration = 5;
        
        let budget = RefinementBudget {
            max_iterations: 5,
            max_time_ms: 10000,
            target_delta_e: 3.0,  // Very strict, won't be achieved
            target_ssim: 0.99,
            plateau_threshold: 0.5,
        };
        
        // Should converge due to max iterations
        assert!(check_convergence(&mut state, &budget));
        assert!(state.convergence_reason.contains("Max iterations reached"));
    }
    
    #[test]
    fn test_refine_svg_paths_empty_input() {
        // Test with empty paths
        let paths = vec![];
        let image = ImageBuffer::new(100, 100);
        let config = RefineConfig::default();
        
        let result = refine_svg_paths(&paths, &image, &config);
        // Should succeed but return empty paths
        assert!(result.is_ok());
        assert!(result.unwrap().is_empty());
    }
}