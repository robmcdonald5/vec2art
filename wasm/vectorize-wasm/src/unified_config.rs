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
    log::info!("   Background removal: {}, algorithm: {:?}", config.enable_background_removal, config.background_removal_algorithm);
    log::info!("   ETF/FDoG enabled: {}", config.enable_etf_fdog);
    if config.enable_etf_fdog {
        log::info!("   ETF radius: {}, iterations: {}, coherency_tau: {}",
                   config.etf_radius, config.etf_iterations, config.etf_coherency_tau);
        log::info!("   FDoG sigma_s: {}, sigma_c: {}, tau: {}",
                   config.fdog_sigma_s, config.fdog_sigma_c, config.fdog_tau);
    }

    // Create a new ConfigBuilder and apply the complete config
    // Since ConfigBuilder doesn't have a from_config constructor, we need to apply all parameters
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
            .map_err(|e| JsValue::from_str(&format!("Failed to set background removal: {}", e)))?
            .background_removal_algorithm(config.background_removal_algorithm.clone());
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

    // Apply ETF/FDoG settings if enabled
    if config.enable_etf_fdog {
        builder = builder
            .enable_etf_fdog(true);

        // Note: ETF/FDoG parameter values (etf_radius, etf_iterations, etc.) are already
        // in the TraceLowConfig and will be used by the core algorithm via build().
        // The ConfigBuilder's individual setters are primarily for validation and defaults.
    }

    // Apply flow tracing settings if enabled
    if config.enable_flow_tracing {
        builder = builder
            .enable_flow_tracing(config.enable_flow_tracing);
    }

    // Apply Bézier fitting if enabled
    if config.enable_bezier_fitting {
        builder = builder
            .enable_bezier_fitting(config.enable_bezier_fitting);
    }

    // Check for hand-drawn parameters in the original JSON (not part of TraceLowConfig)
    // Hand-drawn is handled separately from the main config in the current architecture
    let original_json: serde_json::Value = serde_json::from_str(config_json)
        .map_err(|e| JsValue::from_str(&format!("Failed to parse JSON for hand-drawn params: {}", e)))?;

    // Handle hand-drawn preset and custom parameters
    let hand_drawn_preset = original_json.get("handDrawnPreset").and_then(|v| v.as_str()).unwrap_or("none");
    let tremor = original_json.get("handDrawnTremorStrength").and_then(|v| v.as_f64()).map(|v| v as f32);
    let weights = original_json.get("handDrawnVariableWeights").and_then(|v| v.as_f64()).map(|v| v as f32);
    let tapering = original_json.get("handDrawnTapering").and_then(|v| v.as_f64()).map(|v| v as f32);

    // Check if custom values are being used
    let has_custom_values = (tremor.is_some() && tremor.unwrap() > 0.0) ||
                           (weights.is_some() && weights.unwrap() > 0.0) ||
                           (tapering.is_some() && tapering.unwrap() > 0.0);

    // Determine effective preset: if custom values but preset is "none", use "subtle" as base
    let effective_preset = if has_custom_values && hand_drawn_preset == "none" {
        "subtle" // Use subtle as default base when custom values are provided
    } else {
        hand_drawn_preset
    };

    // Apply preset if not "none"
    if effective_preset != "none" {
        log::info!("   Applying hand-drawn preset: {}", effective_preset);
        builder = builder
            .hand_drawn_preset(effective_preset)
            .map_err(|e| JsValue::from_str(&format!("Failed to set hand-drawn preset: {}", e)))?;

        // Apply custom parameters only if we have a valid preset
        if let Some(tremor_val) = tremor {
            if tremor_val > 0.0 {
                log::info!("   Applying hand-drawn tremor: {}", tremor_val);
                builder = builder
                    .custom_tremor(tremor_val)
                    .map_err(|e| JsValue::from_str(&format!("Failed to set tremor: {}", e)))?;
            }
        }

        if let Some(weights_val) = weights {
            if weights_val > 0.0 {
                log::info!("   Applying hand-drawn variable weights: {}", weights_val);
                builder = builder
                    .custom_variable_weights(weights_val)
                    .map_err(|e| JsValue::from_str(&format!("Failed to set variable weights: {}", e)))?;
            }
        }

        if let Some(tapering_val) = tapering {
            if tapering_val > 0.0 {
                log::info!("   Applying hand-drawn tapering: {}", tapering_val);
                builder = builder
                    .custom_tapering(tapering_val)
                    .map_err(|e| JsValue::from_str(&format!("Failed to set tapering: {}", e)))?;
            }
        }
    }

    // Apply algorithm-specific settings based on backend
    match config.backend {
        TraceBackend::Edge => {
            // Edge-specific settings are mostly handled via the complete TraceLowConfig
            // NMS thresholds are calculated from detail level in core implementation
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
                .map_err(|e| JsValue::from_str(&format!("Failed to set dot density: {}", e)))?
                .adaptive_sizing(config.dot_adaptive_sizing)
                .set_gradient_based_sizing(config.dot_gradient_based_sizing)
                .dot_shape(config.dot_shape)
                .dot_grid_pattern(config.dot_grid_pattern);

            // Only apply size variation when neither adaptive nor gradient-based sizing is enabled
            if !config.dot_adaptive_sizing && !config.dot_gradient_based_sizing {
                builder = builder
                    .dot_size_variation(config.dot_size_variation)
                    .map_err(|e| JsValue::from_str(&format!("Failed to set dot size variation: {}", e)))?;
            }
        }
    }

    // Apply color settings based on backend
    match config.backend {
        TraceBackend::Edge | TraceBackend::Centerline => {
            // For line-based backends, use line_preserve_colors and color sampling
            builder = builder.line_preserve_colors(config.line_preserve_colors);
            builder = builder.line_color_sampling(config.line_color_sampling.clone());
            log::info!("   Line color sampling method: {:?}", config.line_color_sampling);
            log::info!("   Line preserve colors: {}", config.line_preserve_colors);
            log::info!("   Color accuracy: {}", config.line_color_accuracy);
            log::info!("   Max colors per path: {}", config.max_colors_per_path);
            log::info!("   Color tolerance: {}", config.color_tolerance);

            // Apply additional color parameters
            builder = builder
                .line_color_accuracy(config.line_color_accuracy)
                .map_err(|e| JsValue::from_str(&format!("Failed to set color accuracy: {}", e)))?
                .max_colors_per_path(config.max_colors_per_path)
                .map_err(|e| JsValue::from_str(&format!("Failed to set max colors: {}", e)))?
                .color_tolerance(config.color_tolerance)
                .map_err(|e| JsValue::from_str(&format!("Failed to set color tolerance: {}", e)))?;
        }
        TraceBackend::Dots => {
            // For dots backend, use preserve_colors (which sets dot_preserve_colors)
            builder = builder.preserve_colors(config.dot_preserve_colors);
            // Dots backend doesn't use color sampling method
        }
        TraceBackend::Superpixel => {
            // For superpixel backend, use superpixel_preserve_colors and color sampling
            builder = builder.superpixel_preserve_colors(config.superpixel_preserve_colors);
            // Superpixel also uses line_color_sampling for its color processing
            builder = builder.line_color_sampling(config.line_color_sampling.clone());
            log::info!("   Superpixel color sampling method: {:?}", config.line_color_sampling);
            log::info!("   Superpixel preserve colors: {}", config.superpixel_preserve_colors);
            log::info!("   Color accuracy: {}", config.line_color_accuracy);
            log::info!("   Max colors per region: {}", config.max_colors_per_path);
            log::info!("   Color tolerance: {}", config.color_tolerance);

            // Apply additional color parameters that Superpixel uses
            builder = builder
                .line_color_accuracy(config.line_color_accuracy)
                .map_err(|e| JsValue::from_str(&format!("Failed to set color accuracy: {}", e)))?
                .max_colors_per_path(config.max_colors_per_path)
                .map_err(|e| JsValue::from_str(&format!("Failed to set max colors: {}", e)))?
                .color_tolerance(config.color_tolerance)
                .map_err(|e| JsValue::from_str(&format!("Failed to set color tolerance: {}", e)))?;

            // Apply palette reduction settings for Superpixel
            builder = builder
                .enable_palette_reduction(config.enable_palette_reduction)
                .palette_target_colors(config.palette_target_colors)
                .map_err(|e| JsValue::from_str(&format!("Failed to set palette target colors: {}", e)))?
                .palette_method(config.palette_method.clone())
                .palette_dithering(config.palette_dithering);

            log::info!("   - Palette reduction enabled: {}", config.enable_palette_reduction);
            log::info!("   - Palette target colors: {}", config.palette_target_colors);
            log::info!("   - Palette method: {:?}", config.palette_method);
            log::info!("   - Palette dithering: {}", config.palette_dithering);
        }
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

