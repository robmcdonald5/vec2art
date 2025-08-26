/**
 * Algorithm-Specific Preset System Tests
 */

import { describe, it, expect } from 'vitest';
import { 
	presetCollection, 
	getPresetById, 
	getPresetsByAlgorithm,
	getRecommendedPresets 
} from './presets';
import { presetToVectorizerConfig } from './converter';

describe('Algorithm-Specific Preset System', () => {
	it('should have all algorithm-specific presets organized correctly', () => {
		// Verify we have presets for each algorithm
		expect(presetCollection.byAlgorithm.centerline.length).toBeGreaterThan(0);
		expect(presetCollection.byAlgorithm.edge.length).toBeGreaterThan(0);
		expect(presetCollection.byAlgorithm.dots.length).toBeGreaterThan(0);
		expect(presetCollection.byAlgorithm.superpixel.length).toBeGreaterThan(0);

		// Verify all preset IDs can be found
		Object.values(presetCollection.byAlgorithm).flat().forEach(presetId => {
			expect(getPresetById(presetId)).toBeDefined();
		});
	});

	it('should return algorithm-specific presets correctly', () => {
		const centerlinePresets = getPresetsByAlgorithm('centerline');
		const edgePresets = getPresetsByAlgorithm('edge');
		const dotsPresets = getPresetsByAlgorithm('dots');
		const superpixelPresets = getPresetsByAlgorithm('superpixel');

		// Verify each algorithm has at least 2 presets
		expect(centerlinePresets.length).toBeGreaterThanOrEqual(2);
		expect(edgePresets.length).toBeGreaterThanOrEqual(2);
		expect(dotsPresets.length).toBeGreaterThanOrEqual(2);
		expect(superpixelPresets.length).toBeGreaterThanOrEqual(2);

		// Verify all presets have correct backend
		centerlinePresets.forEach(preset => expect(preset.backend).toBe('centerline'));
		edgePresets.forEach(preset => expect(preset.backend).toBe('edge'));
		dotsPresets.forEach(preset => expect(preset.backend).toBe('dots'));
		superpixelPresets.forEach(preset => expect(preset.backend).toBe('superpixel'));
	});

	it('should convert presets to WASM config correctly', () => {
		const testPresets = [
			'corporate-logo',      // CENTERLINE
			'photo-to-sketch',     // EDGE
			'artistic-stippling',  // DOTS
			'modern-abstract'      // SUPERPIXEL
		];

		testPresets.forEach(presetId => {
			const preset = getPresetById(presetId);
			expect(preset).toBeDefined();
			
			if (preset) {
				const config = presetToVectorizerConfig(preset);
				
				// Verify basic required fields
				expect(config.backend).toBe(preset.backend);
				expect(typeof config.detail).toBe('number');
				expect(config.detail).toBeGreaterThan(0);
				expect(config.detail).toBeLessThanOrEqual(1);
				expect(typeof config.stroke_width).toBe('number');
				expect(config.stroke_width).toBeGreaterThan(0);
			}
		});
	});

	it('should provide appropriate recommendations for image types', () => {
		const photoRecommendations = getRecommendedPresets('photo');
		const logoRecommendations = getRecommendedPresets('logo');
		const textRecommendations = getRecommendedPresets('text');

		// Verify recommendations exist
		expect(photoRecommendations.length).toBeGreaterThan(0);
		expect(logoRecommendations.length).toBeGreaterThan(0);
		expect(textRecommendations.length).toBeGreaterThan(0);

		// Verify photo recommendations include edge-based presets
		expect(photoRecommendations.some(p => p.backend === 'edge')).toBe(true);

		// Verify logo recommendations include centerline presets
		expect(logoRecommendations.some(p => p.backend === 'centerline')).toBe(true);

		// Verify text recommendations include centerline presets
		expect(textRecommendations.some(p => p.backend === 'centerline')).toBe(true);
	});

	it('should have valid preset metadata', () => {
		presetCollection.presets.forEach(preset => {
			// Verify required metadata fields
			expect(preset.metadata.id).toBeTruthy();
			expect(preset.metadata.name).toBeTruthy();
			expect(preset.metadata.category).toBeTruthy();
			expect(preset.metadata.description).toBeTruthy();
			expect(preset.metadata.marketSegment).toBeTruthy();
			expect(preset.metadata.complexity).toBeTruthy();
			expect(preset.metadata.estimatedTime).toBeTruthy();
			expect(Array.isArray(preset.metadata.bestFor)).toBe(true);
			expect(Array.isArray(preset.metadata.features)).toBe(true);
			expect(preset.metadata.bestFor.length).toBeGreaterThan(0);
			expect(preset.metadata.features.length).toBeGreaterThan(0);

			// Verify backend field matches the algorithm-specific organization
			expect(['centerline', 'edge', 'dots', 'superpixel']).toContain(preset.backend);
		});
	});

	it('should have algorithm-specific preset types with required fields', () => {
		const centerlinePresets = getPresetsByAlgorithm('centerline');
		const edgePresets = getPresetsByAlgorithm('edge');
		const dotsPresets = getPresetsByAlgorithm('dots');
		const superpixelPresets = getPresetsByAlgorithm('superpixel');

		// Verify centerline-specific presets have the right algorithm-specific fields
		centerlinePresets.forEach(preset => {
			if ('centerlineSpecific' in preset) {
				expect(preset.centerlineSpecific.precision).toBeTruthy();
				expect(preset.centerlineSpecific.contentType).toBeTruthy();
				expect(preset.centerlineSpecific.optimization).toBeTruthy();
			}
		});

		// Verify edge-specific presets have the right algorithm-specific fields
		edgePresets.forEach(preset => {
			if ('edgeSpecific' in preset) {
				expect(preset.edgeSpecific.complexity).toBeTruthy();
				expect(typeof preset.edgeSpecific.multiPassOptimal).toBe('boolean');
				expect(preset.edgeSpecific.handDrawnLevel).toBeTruthy();
			}
		});

		// Similar checks for dots and superpixel presets
		dotsPresets.forEach(preset => {
			if ('dotsSpecific' in preset) {
				expect(preset.dotsSpecific.style).toBeTruthy();
				expect(preset.dotsSpecific.density).toBeTruthy();
				expect(preset.dotsSpecific.colorMode).toBeTruthy();
			}
		});

		superpixelPresets.forEach(preset => {
			if ('superpixelSpecific' in preset) {
				expect(preset.superpixelSpecific.style).toBeTruthy();
				expect(preset.superpixelSpecific.regionSize).toBeTruthy();
				expect(preset.superpixelSpecific.colorPreservation).toBeTruthy();
			}
		});
	});
});