/**
 * Integration Test for Preset System
 * Validates that presets can be converted to WASM configs correctly
 */

import { getPresetById, presetToVectorizerConfig } from './index';
import type { VectorizerConfig } from '$lib/types/vectorizer';

// Test preset conversion functionality
export function testPresetIntegration(): boolean {
	console.log('🧪 Testing preset integration...');
	
	try {
		// Test 1: Get preset by ID
		const corporatePreset = getPresetById('corporate-logo');
		if (!corporatePreset) {
			console.error('❌ Failed to get corporate-logo preset');
			return false;
		}
		console.log('✅ Corporate logo preset found:', corporatePreset.metadata.name);
		
		// Test 2: Convert preset to WASM config
		const wasmConfig: VectorizerConfig = presetToVectorizerConfig(corporatePreset);
		
		// Validate required fields
		const requiredFields: (keyof VectorizerConfig)[] = [
			'backend', 
			'detail', 
			'stroke_width', 
			'hand_drawn_preset'
		];
		
		for (const field of requiredFields) {
			if (wasmConfig[field] === undefined) {
				console.error(`❌ Missing required field: ${field}`);
				return false;
			}
		}
		console.log('✅ WASM config generated with all required fields');
		
		// Test 3: Verify backend-specific parameters
		if (corporatePreset.backend === 'centerline') {
			if (wasmConfig.enable_adaptive_threshold === undefined) {
				console.error('❌ Missing centerline-specific parameters');
				return false;
			}
		}
		console.log('✅ Backend-specific parameters included');
		
		// Test 4: Test algorithm-specific presets
		const testPresets = [
			// CENTERLINE algorithm presets
			'technical-drawing',
			'text-typography',
			// EDGE algorithm presets
			'hand-drawn-illustration',
			'detailed-line-art',
			// DOTS algorithm presets
			'vintage-stippling',
			'artistic-stippling',
			// SUPERPIXEL algorithm presets
			'modern-abstract',
			'organic-abstract'
		];
		
		for (const presetId of testPresets) {
			const preset = getPresetById(presetId);
			if (!preset) {
				console.error(`❌ Missing preset: ${presetId}`);
				return false;
			}
			
			const config = presetToVectorizerConfig(preset);
			if (!config.backend || !config.detail) {
				console.error(`❌ Invalid config for preset: ${presetId}`);
				return false;
			}
		}
		console.log('✅ All algorithm-specific presets converted successfully');
		
		// Test 5: Verify algorithm-specific parameters
		const centerlinePreset = getPresetById('corporate-logo');
		if (centerlinePreset?.backend === 'centerline') {
			const centerlineConfig = presetToVectorizerConfig(centerlinePreset);
			if (centerlineConfig.enable_adaptive_threshold === undefined) {
				console.error('❌ Missing centerline-specific parameters in corporate logo');
				return false;
			}
		}
		console.log('✅ Algorithm-specific parameters validated');
		
		// Test 6: Verify performance settings
		if (!wasmConfig.thread_count || wasmConfig.thread_count < 1) {
			console.log('⚠️ Warning: No thread count set, may impact performance');
		}
		
		console.log('🎉 All preset integration tests passed!');
		console.log('Config sample:', {
			backend: wasmConfig.backend,
			detail: wasmConfig.detail,
			stroke_width: wasmConfig.stroke_width,
			multipass: wasmConfig.multipass,
			preserve_colors: wasmConfig.preserve_colors
		});
		
		return true;
		
	} catch (error) {
		console.error('❌ Preset integration test failed:', error);
		return false;
	}
}

// Export for potential browser console testing
if (typeof window !== 'undefined') {
	(window as any).testPresetIntegration = testPresetIntegration;
}