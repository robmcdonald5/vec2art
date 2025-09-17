//! Unified Configuration Interface for WASM
//!
//! This module provides a single, clean interface for applying configuration
//! from the frontend, replacing 50+ individual setter methods with one
//! JSON-based configuration method.

use serde_json;
use vectorize_core::{
    algorithms::tracing::trace_low::{TraceLowConfig, TraceBackend},
    config_builder::ConfigBuilder,
};
use wasm_bindgen::prelude::*;

/// Apply complete configuration from JSON
///
/// This is the ONLY configuration method needed - replaces all individual setters
///
/// # Arguments
/// * `config_json` - JSON string containing TraceLowConfig
///
/// # Example
/// ```javascript
/// const config = {
///     backend: "Edge",
///     detail: 5.0,
///     stroke_px_at_1080p: 2.0,
///     noise_filtering: true,
///     enable_background_removal: false,
///     // ... all other fields
/// };
/// vectorizer.apply_config_json(JSON.stringify(config));
/// ```
pub fn apply_config_json(
    config_builder: &mut ConfigBuilder,
    config_json: &str
) -> Result<(), JsValue> {
    // Parse JSON into TraceLowConfig
    let config: TraceLowConfig = serde_json::from_str(config_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid config JSON: {}", e)))?;

    log::info!("🔧 Applying unified config with backend: {:?}", config.backend);
    log::info!("   Detail: {}, Stroke: {}", config.detail, config.stroke_px_at_1080p);
    log::info!("   Noise filtering: {}", config.noise_filtering);
    log::info!("   Background removal: {}", config.enable_background_removal);

    // Create a new ConfigBuilder from the TraceLowConfig
    let mut builder = ConfigBuilder::new();

    // Apply core settings
    builder = builder
        .backend(config.backend.clone())
        .detail(config.detail)
        .map_err(|e| JsValue::from_str(&format!("Failed to set detail: {}", e)))?
        .stroke_width(config.stroke_px_at_1080p)
        .map_err(|e| JsValue::from_str(&format!("Failed to set stroke width: {}", e)))?;

    // Apply preprocessing settings
    builder = builder
        .noise_filtering(config.noise_filtering);

    if config.enable_background_removal {
        builder = builder
            .background_removal(config.enable_background_removal)
            .background_removal_strength(config.background_removal_strength)
            .map_err(|e| JsValue::from_str(&format!("Failed to set background removal: {}", e)))?;
    }

    // Apply multi-pass settings
    if config.enable_multipass {
        builder = builder
            .multipass(true)
            .pass_count(config.pass_count)
            .map_err(|e| JsValue::from_str(&format!("Failed to set multipass: {}", e)))?;

        if let Some(conservative) = config.conservative_detail {
            builder = builder.conservative_detail(Some(conservative))
                .map_err(|e| JsValue::from_str(&format!("Failed to set conservative detail: {}", e)))?;
        }

        if let Some(aggressive) = config.aggressive_detail {
            builder = builder.aggressive_detail(Some(aggressive))
                .map_err(|e| JsValue::from_str(&format!("Failed to set aggressive detail: {}", e)))?;
        }
    }

    // Apply directional pass settings
    builder = builder
        .reverse_pass(config.enable_reverse_pass)
        .diagonal_pass(config.enable_diagonal_pass);

    // Apply algorithm-specific settings based on backend
    match config.backend {
        TraceBackend::Edge => {
            // Edge-specific settings will be handled directly by the core algorithm
            // NMS thresholds are currently calculated from detail level in core implementation
        }
        TraceBackend::Centerline => {
            builder = builder
                .enable_adaptive_threshold(config.enable_adaptive_threshold)
                .window_size(config.adaptive_threshold_window_size)
                .map_err(|e| JsValue::from_str(&format!("Failed to set window size: {}", e)))?
                .sensitivity_k(config.adaptive_threshold_k)
                .map_err(|e| JsValue::from_str(&format!("Failed to set sensitivity: {}", e)))?;
        }
        TraceBackend::Superpixel => {
            builder = builder
                .num_superpixels(config.num_superpixels)
                .map_err(|e| JsValue::from_str(&format!("Failed to set superpixels: {}", e)))?
                .compactness(config.superpixel_compactness)
                .map_err(|e| JsValue::from_str(&format!("Failed to set compactness: {}", e)))?
                .slic_iterations(config.superpixel_slic_iterations)
                .map_err(|e| JsValue::from_str(&format!("Failed to set iterations: {}", e)))?;
        }
        TraceBackend::Dots => {
            builder = builder
                .dot_size_range(config.dot_min_radius, config.dot_max_radius)
                .map_err(|e| JsValue::from_str(&format!("Failed to set dot size: {}", e)))?
                .dot_density(config.dot_density_threshold)
                .map_err(|e| JsValue::from_str(&format!("Failed to set dot density: {}", e)))?;
        }
    }

    // Apply color settings based on backend
    match config.backend {
        TraceBackend::Edge | TraceBackend::Centerline => {
            // For line-based backends, use line_preserve_colors
            builder = builder.line_preserve_colors(config.line_preserve_colors);
        }
        TraceBackend::Dots => {
            // For dots backend, use preserve_colors (which sets dot_preserve_colors)
            builder = builder.preserve_colors(config.dot_preserve_colors);
        }
        TraceBackend::Superpixel => {
            // For superpixel backend, use superpixel_preserve_colors
            builder = builder.superpixel_preserve_colors(config.superpixel_preserve_colors);
        }
    }

    // Apply advanced settings if enabled
    if config.enable_etf_fdog {
        builder = builder
            .enable_etf_fdog(true);
    }

    // Replace the config_builder
    *config_builder = builder;

    log::info!("✅ Unified config applied successfully");
    Ok(())
}

/// Get the current configuration as JSON
///
/// Returns the complete TraceLowConfig as a JSON string
pub fn get_config_json(config_builder: &ConfigBuilder) -> Result<String, JsValue> {
    // Build the config to get current state
    let config = config_builder.clone().build()
        .map_err(|e| JsValue::from_str(&format!("Failed to build config: {}", e)))?;

    // Convert to JSON
    let json = serde_json::to_string_pretty(&config)
        .map_err(|e| JsValue::from_str(&format!("Failed to serialize config: {}", e)))?;

    Ok(json)
}

/// Validate configuration JSON without applying it
///
/// Useful for frontend validation before processing
pub fn validate_config_json(config_json: &str) -> Result<bool, JsValue> {
    // Try to parse the JSON
    match serde_json::from_str::<TraceLowConfig>(config_json) {
        Ok(config) => {
            // Additional validation logic could go here
            log::info!("✅ Config validation successful for backend: {:?}", config.backend);
            Ok(true)
        }
        Err(e) => {
            log::warn!("❌ Config validation failed: {}", e);
            Err(JsValue::from_str(&format!("Invalid config: {}", e)))
        }
    }
}

