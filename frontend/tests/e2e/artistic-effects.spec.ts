/**
 * Artistic Effects E2E Integration Tests
 * Tests independent Variable Line Weights, Tremor Strength, and Line Tapering controls
 */

import { test, expect } from '@playwright/test';
import { ConverterPage } from './utils/test-helpers';

test.describe('Artistic Effects Integration Tests', () => {
	let converterPage: ConverterPage;

	test.beforeEach(async ({ page }) => {
		converterPage = new ConverterPage(page);
		await converterPage.goto();
		await converterPage.waitForWasmLoad();
		
		// Use a simple test image
		await converterPage.uploadFile('small-test.png');
		
		// Ensure edge backend is selected (supports artistic effects)
		await converterPage.selectAlgorithm('edge');
	});

	test('artistic effects controls are visible and functional', async ({ page }) => {
		// Check that all three independent controls are visible
		const variableWeightsSlider = page.locator('input[id="variable_weights"]');
		const tremorSlider = page.locator('input[id="tremor_strength"]');  
		const taperingSlider = page.locator('input[id="tapering"]');
		
		await expect(variableWeightsSlider).toBeVisible();
		await expect(tremorSlider).toBeVisible();
		await expect(taperingSlider).toBeVisible();

		// Check slider ranges are correct
		await expect(variableWeightsSlider).toHaveAttribute('min', '0');
		await expect(variableWeightsSlider).toHaveAttribute('max', '1');
		await expect(tremorSlider).toHaveAttribute('min', '0');
		await expect(tremorSlider).toHaveAttribute('max', '0.5');
		await expect(taperingSlider).toHaveAttribute('min', '0');
		await expect(taperingSlider).toHaveAttribute('max', '1');
	});

	test('hand-drawn presets set individual effect values', async ({ page }) => {
		// Test that selecting a preset updates individual sliders
		await converterPage.setHandDrawnPreset('medium');
		
		// Check that individual sliders show the preset values
		const variableWeights = await page.locator('input[id="variable_weights"]').inputValue();
		const tremorStrength = await page.locator('input[id="tremor_strength"]').inputValue();
		const tapering = await page.locator('input[id="tapering"]').inputValue();
		
		// Medium preset should set specific values (from ParameterPanel.svelte)
		expect(parseFloat(variableWeights)).toBeCloseTo(0.3, 1);
		expect(parseFloat(tremorStrength)).toBeCloseTo(0.15, 2);
		expect(parseFloat(tapering)).toBeCloseTo(0.4, 1);
	});

	test('individual artistic effects can be adjusted independently', async ({ page }) => {
		// Start with 'none' preset (all zeros)
		await converterPage.setHandDrawnPreset('none');
		
		// Test Variable Line Weights independently
		await converterPage.setArtisticEffect('variable_weights', 0.7);
		
		let variableWeights = await page.locator('input[id="variable_weights"]').inputValue();
		let tremorStrength = await page.locator('input[id="tremor_strength"]').inputValue();
		let tapering = await page.locator('input[id="tapering"]').inputValue();
		
		expect(parseFloat(variableWeights)).toBe(0.7);
		expect(parseFloat(tremorStrength)).toBe(0.0); // Should remain unchanged
		expect(parseFloat(tapering)).toBe(0.0); // Should remain unchanged
		
		// Test Tremor Strength independently  
		await converterPage.setArtisticEffect('tremor_strength', 0.3);
		
		variableWeights = await page.locator('input[id="variable_weights"]').inputValue();
		tremorStrength = await page.locator('input[id="tremor_strength"]').inputValue();
		tapering = await page.locator('input[id="tapering"]').inputValue();
		
		expect(parseFloat(variableWeights)).toBe(0.7); // Should remain unchanged
		expect(parseFloat(tremorStrength)).toBe(0.3);
		expect(parseFloat(tapering)).toBe(0.0); // Should remain unchanged
		
		// Test Line Tapering independently
		await converterPage.setArtisticEffect('tapering', 0.8);
		
		variableWeights = await page.locator('input[id="variable_weights"]').inputValue();
		tremorStrength = await page.locator('input[id="tremor_strength"]').inputValue();
		tapering = await page.locator('input[id="tapering"]').inputValue();
		
		expect(parseFloat(variableWeights)).toBe(0.7); // Should remain unchanged
		expect(parseFloat(tremorStrength)).toBe(0.3); // Should remain unchanged
		expect(parseFloat(tapering)).toBe(0.8);
	});

	test('artistic effects work with preset "none"', async ({ page }) => {
		// This tests the Phase 5 fix: custom effects should work even with preset "none"
		await converterPage.setHandDrawnPreset('none');
		
		// Set custom artistic effects
		await converterPage.setArtisticEffect('variable_weights', 0.5);
		await converterPage.setArtisticEffect('tremor_strength', 0.2);
		await converterPage.setArtisticEffect('tapering', 0.6);
		
		// Process image and check for successful completion
		await converterPage.convertImage();
		
		// Verify that processing completed (no errors)
		const processingTime = await converterPage.getProcessingTime();
		expect(processingTime).toBeGreaterThan(0);
		
		// Check that download button becomes available
		await expect(converterPage.downloadButton).toBeVisible();
		
		// Check that we get console logs indicating artistic effects were applied
		const consoleLogs = await page.evaluate(() => {
			return window.testLogs?.filter(log => 
				log.includes('Setting tremor strength') || 
				log.includes('Setting variable weights') || 
				log.includes('Setting tapering') ||
				log.includes('Applying independent artistic effects')
			) || [];
		});
		
		// At least one of the artistic effects should have been logged
		expect(consoleLogs.length).toBeGreaterThanOrEqual(1);
	});

	test('artistic effects produce different SVG outputs', async ({ page }) => {
		// Test 1: No artistic effects
		await converterPage.setHandDrawnPreset('none');
		await converterPage.convertImage();
		
		let svgContent = await page.evaluate(() => {
			const svgElement = document.querySelector('[data-testid="svg-preview"] svg');
			return svgElement?.outerHTML || '';
		});
		
		const noEffectsSvg = svgContent;
		expect(noEffectsSvg).toBeTruthy();
		expect(noEffectsSvg).toContain('<svg');
		
		// Test 2: Strong artistic effects
		await converterPage.setArtisticEffect('variable_weights', 1.0);
		await converterPage.setArtisticEffect('tremor_strength', 0.5);
		await converterPage.setArtisticEffect('tapering', 1.0);
		
		await converterPage.convertImage();
		
		svgContent = await page.evaluate(() => {
			const svgElement = document.querySelector('[data-testid="svg-preview"] svg');
			return svgElement?.outerHTML || '';
		});
		
		const strongEffectsSvg = svgContent;
		expect(strongEffectsSvg).toBeTruthy();
		expect(strongEffectsSvg).toContain('<svg');
		
		// The SVGs should be different (artistic effects should change the output)
		expect(strongEffectsSvg).not.toBe(noEffectsSvg);
		
		// Strong effects might produce different stroke patterns
		// (This is a heuristic test - exact differences depend on the image and algorithm)
		const noEffectsPathCount = (noEffectsSvg.match(/<path/g) || []).length;
		const strongEffectsPathCount = (strongEffectsSvg.match(/<path/g) || []).length;
		
		// At minimum, both should have some paths
		expect(noEffectsPathCount).toBeGreaterThan(0);
		expect(strongEffectsPathCount).toBeGreaterThan(0);
	});

	test('validation prevents invalid artistic effect values', async ({ page }) => {
		// Test that UI prevents invalid values (this tests frontend validation)
		
		// Try to set values outside valid ranges
		const variableWeightsSlider = page.locator('input[id="variable_weights"]');
		const tremorSlider = page.locator('input[id="tremor_strength"]');
		
		// Try to set variable weights > 1.0 (should be clamped)
		await variableWeightsSlider.fill('1.5');
		await variableWeightsSlider.blur();
		const clampedVariableWeights = await variableWeightsSlider.inputValue();
		expect(parseFloat(clampedVariableWeights)).toBeLessThanOrEqual(1.0);
		
		// Try to set tremor > 0.5 (should be clamped)
		await tremorSlider.fill('0.8');
		await tremorSlider.blur();
		const clampedTremor = await tremorSlider.inputValue();
		expect(parseFloat(clampedTremor)).toBeLessThanOrEqual(0.5);
	});

	test('performance remains acceptable with artistic effects', async ({ page }) => {
		// Enable all artistic effects at maximum
		await converterPage.setArtisticEffect('variable_weights', 1.0);
		await converterPage.setArtisticEffect('tremor_strength', 0.5);
		await converterPage.setArtisticEffect('tapering', 1.0);
		
		const startTime = Date.now();
		await converterPage.convertImage();
		const endTime = Date.now();
		
		const processingTime = endTime - startTime;
		
		// Processing should complete within reasonable time (5 seconds for simple test image)
		expect(processingTime).toBeLessThan(5000);
		
		// Verify successful completion
		await expect(converterPage.downloadButton).toBeVisible();
	});

	test('console logs show artistic effects configuration', async ({ page }) => {
		// Clear any existing logs
		await page.evaluate(() => { window.testLogs = []; });
		
		// Set up console log capture
		page.on('console', (msg) => {
			if (msg.type() === 'log' && msg.text().includes('[Worker]')) {
				window.testLogs = window.testLogs || [];
				window.testLogs.push(msg.text());
			}
		});
		
		// Set custom artistic effects
		await converterPage.setArtisticEffect('variable_weights', 0.7);
		await converterPage.setArtisticEffect('tremor_strength', 0.3);
		await converterPage.setArtisticEffect('tapering', 0.9);
		
		await converterPage.convertImage();
		
		// Check for specific worker logs that show artistic effects are being applied
		const logs = await page.evaluate(() => window.testLogs || []);
		const relevantLogs = logs.filter(log => 
			log.includes('Setting tremor strength: 0.3') ||
			log.includes('Setting variable weights: 0.7') ||
			log.includes('Setting tapering: 0.9')
		);
		
		// At least some of the artistic effect settings should be logged
		expect(relevantLogs.length).toBeGreaterThan(0);
	});
});