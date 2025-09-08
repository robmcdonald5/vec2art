/**
 * Parameter Adapter Tests
 * 
 * Tests the parameter mapping and validation between legacy and generated types
 */

import { describe, it, expect } from 'vitest';
import type { VectorizerConfig } from './vectorizer';
import { 
  legacyToGenerated, 
  generatedToLegacy, 
  validateLegacyConfig,
  processConfigWithGenerated
} from './parameter-adapter';
import { validateParameter } from './generated-parameters';

describe('Parameter Adapter', () => {
  describe('Parameter Name Mapping', () => {
    it('should map stroke_width to stroke_px_at_1080p', () => {
      const legacy: VectorizerConfig = {
        backend: 'edge',
        stroke_width: 2.5,
        detail: 0.8,
        noise_filtering: false,
        multipass: false,
        pass_count: 1,
        multipass_mode: 'auto',
        reverse_pass: false,
        diagonal_pass: false,
        enable_etf_fdog: false,
        enable_flow_tracing: false,
        enable_bezier_fitting: false,
        hand_drawn_preset: 'none',
        variable_weights: 0,
        tremor_strength: 0,
        tapering: 0,
        preserve_colors: false
      };

      const generated = legacyToGenerated(legacy);
      
      expect(generated.stroke_px_at_1080p).toBe(2.5);
      expect(generated.detail).toBe(0.8);
    });

    it('should reverse map stroke_px_at_1080p to stroke_width', () => {
      const generated = {
        stroke_px_at_1080p: 3.0,
        detail: 0.6,
        noise_filtering: true,
        enable_multipass: false
      };

      const legacy = generatedToLegacy(generated, 'edge');
      
      expect(legacy.stroke_width).toBe(3.0);
      expect(legacy.detail).toBe(0.6);
      expect(legacy.noise_filtering).toBe(true);
      expect(legacy.backend).toBe('edge');
    });
  });

  describe('Backend-Specific Parameter Mapping', () => {
    it('should map centerline-specific parameters', () => {
      const legacy: VectorizerConfig = {
        backend: 'centerline',
        stroke_width: 1.0,
        detail: 0.6,
        noise_filtering: false,
        multipass: false,
        pass_count: 1,
        multipass_mode: 'auto',
        reverse_pass: false,
        diagonal_pass: false,
        enable_etf_fdog: false,
        enable_flow_tracing: false,
        enable_bezier_fitting: false,
        hand_drawn_preset: 'none',
        variable_weights: 0,
        tremor_strength: 0,
        tapering: 0,
        preserve_colors: false,
        window_size: 35,
        sensitivity_k: 0.4,
        enable_adaptive_threshold: true,
        douglas_peucker_epsilon: 1.5,
        min_branch_length: 10
      };

      const generated = legacyToGenerated(legacy);
      
      expect(generated.adaptive_threshold_window_size).toBe(35);
      expect(generated.adaptive_threshold_k).toBe(0.4);
      expect(generated.enable_adaptive_threshold).toBe(true);
      expect(generated.douglas_peucker_epsilon).toBe(1.5);
      expect(generated.min_branch_length).toBe(10);
    });

    it('should map superpixel-specific parameters', () => {
      const legacy: VectorizerConfig = {
        backend: 'superpixel',
        stroke_width: 1.5,
        detail: 0.2,
        noise_filtering: false,
        multipass: false,
        pass_count: 1,
        multipass_mode: 'auto',
        reverse_pass: false,
        diagonal_pass: false,
        enable_etf_fdog: false,
        enable_flow_tracing: false,
        enable_bezier_fitting: false,
        hand_drawn_preset: 'none',
        variable_weights: 0,
        tremor_strength: 0,
        tapering: 0,
        preserve_colors: true,
        num_superpixels: 300,
        compactness: 15,
        slic_iterations: 12,
        superpixel_initialization_pattern: 'hexagonal',
        fill_regions: true,
        stroke_regions: false,
        simplify_boundaries: true,
        boundary_epsilon: 2.0
      };

      const generated = legacyToGenerated(legacy);
      
      expect(generated.num_superpixels).toBe(300);
      expect(generated.superpixel_compactness).toBe(15);
      expect(generated.superpixel_slic_iterations).toBe(12);
      expect(generated.superpixel_initialization_pattern).toBe('hexagonal');
      expect(generated.superpixel_fill_regions).toBe(true);
      expect(generated.superpixel_stroke_regions).toBe(false);
      expect(generated.superpixel_simplify_boundaries).toBe(true);
      expect(generated.superpixel_boundary_epsilon).toBe(2.0);
      expect(generated.superpixel_preserve_colors).toBe(true);
    });

    it('should map dots-specific parameters', () => {
      const legacy: VectorizerConfig = {
        backend: 'dots',
        stroke_width: 2.0,
        detail: 0.8,
        noise_filtering: false,
        multipass: false,
        pass_count: 1,
        multipass_mode: 'auto',
        reverse_pass: false,
        diagonal_pass: false,
        enable_etf_fdog: false,
        enable_flow_tracing: false,
        enable_bezier_fitting: false,
        hand_drawn_preset: 'none',
        variable_weights: 0,
        tremor_strength: 0,
        tapering: 0,
        preserve_colors: true,
        dot_density_threshold: 0.15,
        min_radius: 0.8,
        max_radius: 4.0,
        adaptive_sizing: true,
        background_tolerance: 0.2,
        poisson_disk_sampling: true,
        gradient_based_sizing: false
      };

      const generated = legacyToGenerated(legacy);
      
      expect(generated.dot_density_threshold).toBe(0.15);
      expect(generated.dot_min_radius).toBe(0.8);
      expect(generated.dot_max_radius).toBe(4.0);
      expect(generated.dot_adaptive_sizing).toBe(true);
      expect(generated.dot_background_tolerance).toBe(0.2);
      expect(generated.dot_poisson_disk_sampling).toBe(true);
      expect(generated.dot_gradient_based_sizing).toBe(false);
      expect(generated.dot_preserve_colors).toBe(true);
    });
  });

  describe('Parameter Validation', () => {
    it('should validate parameters using generated metadata', () => {
      // Test valid detail value
      const validDetail = validateParameter('detail', 0.5);
      expect(validDetail.valid).toBe(true);

      // Test invalid detail value (out of range)
      const invalidDetail = validateParameter('detail', 1.5);
      expect(invalidDetail.valid).toBe(false);
      expect(invalidDetail.error).toContain('must be between 0 and 1');

      // Test valid stroke width
      const validStroke = validateParameter('stroke_px_at_1080p', 2.0);
      expect(validStroke.valid).toBe(true);

      // Test invalid stroke width (out of range)
      const invalidStroke = validateParameter('stroke_px_at_1080p', 25.0);
      expect(invalidStroke.valid).toBe(false);
      expect(invalidStroke.error).toContain('must be between 0.1 and 20');
    });

    it('should validate enum parameters', () => {
      // Valid enum value
      const validEnum = validateParameter('superpixel_initialization_pattern', 'poisson');
      expect(validEnum.valid).toBe(true);

      // Invalid enum value
      const invalidEnum = validateParameter('superpixel_initialization_pattern', 'invalid');
      expect(invalidEnum.valid).toBe(false);
      expect(invalidEnum.error).toContain('must be one of');
    });

    it('should validate boolean parameters', () => {
      // Valid boolean
      const validBool = validateParameter('noise_filtering', true);
      expect(validBool.valid).toBe(true);

      // Invalid boolean
      const invalidBool = validateParameter('noise_filtering', 'true');
      expect(invalidBool.valid).toBe(false);
      expect(invalidBool.error).toContain('must be a boolean');
    });
  });

  describe('Full Configuration Processing', () => {
    it('should process a complete edge backend configuration', () => {
      const config: VectorizerConfig = {
        backend: 'edge',
        stroke_width: 1.5,
        detail: 0.8,
        noise_filtering: true,
        noise_filter_spatial_sigma: 1.0,
        noise_filter_range_sigma: 75.0,
        multipass: true,
        pass_count: 2,
        multipass_mode: 'auto',
        reverse_pass: false,
        diagonal_pass: false,
        enable_etf_fdog: false,
        enable_flow_tracing: false,
        enable_bezier_fitting: false,
        hand_drawn_preset: 'subtle',
        variable_weights: 0.3,
        tremor_strength: 0.1,
        tapering: 0.2,
        preserve_colors: false
      };

      const result = processConfigWithGenerated(config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.generatedConfig.stroke_px_at_1080p).toBe(1.5);
      expect(result.generatedConfig.detail).toBe(0.8);
      expect(result.generatedConfig.noise_filtering).toBe(true);
      expect(result.generatedConfig.enable_multipass).toBe(true);
      expect(result.generatedConfig.pass_count).toBe(2);
      expect(result.backendConfig).toBeDefined();
    });

    it('should detect validation errors', () => {
      const invalidConfig: VectorizerConfig = {
        backend: 'edge',
        stroke_width: -1.0, // Invalid: negative value
        detail: 2.0, // Invalid: out of range
        noise_filtering: false,
        multipass: false,
        pass_count: 1,
        multipass_mode: 'auto',
        reverse_pass: false,
        diagonal_pass: false,
        enable_etf_fdog: false,
        enable_flow_tracing: false,
        enable_bezier_fitting: false,
        hand_drawn_preset: 'none',
        variable_weights: 0,
        tremor_strength: 0,
        tapering: 0,
        preserve_colors: false
      };

      const result = processConfigWithGenerated(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Check that we get specific validation errors
      const errorMessages = result.errors.map(e => e.message).join(' ');
      expect(errorMessages).toContain('must be between');
    });

    it('should provide parameter metadata', () => {
      const config: VectorizerConfig = {
        backend: 'centerline',
        stroke_width: 1.0,
        detail: 0.6,
        noise_filtering: false,
        multipass: false,
        pass_count: 1,
        multipass_mode: 'auto',
        reverse_pass: false,
        diagonal_pass: false,
        enable_etf_fdog: false,
        enable_flow_tracing: false,
        enable_bezier_fitting: false,
        hand_drawn_preset: 'none',
        variable_weights: 0,
        tremor_strength: 0,
        tapering: 0,
        preserve_colors: false,
        enable_adaptive_threshold: true
      };

      const result = processConfigWithGenerated(config);
      
      expect(result.metadata).toBeDefined();
      expect(Object.keys(result.metadata).length).toBeGreaterThan(0);
      expect(result.metadata.detail).toBeDefined();
      expect(result.metadata.stroke_px_at_1080p).toBeDefined();
      expect(result.metadata.enable_adaptive_threshold).toBeDefined();
    });
  });
});