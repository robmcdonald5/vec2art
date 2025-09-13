import { describe, it, expect } from 'vitest';
import { SvgPerformanceAnalyzer, BACKEND_PERFORMANCE_THRESHOLDS } from './svg-performance-analyzer';

describe('SvgPerformanceAnalyzer', () => {
	describe('analyzeSvgComplexity', () => {
		it('should analyze simple SVG with circles', () => {
			const svg = `
				<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
					<circle cx="50" cy="50" r="20" fill="red" />
					<circle cx="25" cy="25" r="10" fill="blue" />
					<circle cx="75" cy="75" r="15" fill="green" />
				</svg>
			`;

			const metrics = SvgPerformanceAnalyzer.analyzeSvgComplexity(svg);

			expect(metrics.circleCount).toBe(3);
			expect(metrics.pathCount).toBe(0);
			expect(metrics.elementCount).toBe(3);
			expect(metrics.totalElements).toBe(3);
			expect(metrics.estimatedRenderComplexity).toBe(3); // 3 circles * 1 complexity each
		});

		it('should analyze SVG with paths', () => {
			const svg = `
				<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
					<path d="M10,10 L90,90" stroke="black" />
					<path d="M10,90 L90,10" stroke="red" />
				</svg>
			`;

			const metrics = SvgPerformanceAnalyzer.analyzeSvgComplexity(svg);

			expect(metrics.pathCount).toBe(2);
			expect(metrics.circleCount).toBe(0);
			expect(metrics.elementCount).toBe(2);
			expect(metrics.estimatedRenderComplexity).toBe(6); // 2 paths * 3 complexity each
		});

		it('should analyze SVG with symbol reuse', () => {
			const svg = `
				<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
					<defs>
						<symbol id="dot" viewBox="0 0 2 2">
							<circle cx="1" cy="1" r="1" fill="black" />
						</symbol>
					</defs>
					<use href="#dot" x="10" y="10" />
					<use href="#dot" x="20" y="20" />
					<use href="#dot" x="30" y="30" />
				</svg>
			`;

			const metrics = SvgPerformanceAnalyzer.analyzeSvgComplexity(svg);

			expect(metrics.symbolCount).toBe(1);
			expect(metrics.useCount).toBe(3);
			expect(metrics.circleCount).toBe(1); // Inside the symbol
			expect(metrics.elementCount).toBe(1); // Only the circle counts as render element
			expect(metrics.totalElements).toBe(5); // 1 circle + 1 symbol + 3 uses
		});

		it('should handle malformed SVG with regex fallback', () => {
			const svg = `
				<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
					<circle cx="50" cy="50" r="20" fill="red" />
					<path d="M10,10 L90,90" stroke="black" />
					<!-- This is malformed but should still be counted -->
					<unclosed-tag>
				</svg>
			`;

			const metrics = SvgPerformanceAnalyzer.analyzeSvgComplexity(svg);

			// Should still count elements correctly via regex
			expect(metrics.circleCount).toBe(1);
			expect(metrics.pathCount).toBe(1);
			expect(metrics.elementCount).toBe(2);
		});
	});

	describe('assessPerformance', () => {
		it('should assess good performance for low element count', () => {
			const metrics = {
				elementCount: 100,
				pathCount: 50,
				circleCount: 50,
				rectCount: 0,
				groupCount: 0,
				symbolCount: 0,
				useCount: 0,
				totalElements: 100,
				estimatedRenderComplexity: 200,
				fileSizeBytes: 1024
			};

			const assessment = SvgPerformanceAnalyzer.assessPerformance(metrics, 'dots');

			expect(assessment.severity).toBe('good');
			expect(assessment.recommendations).toHaveLength(1);
			expect(assessment.recommendations[0]).toBe('Performance is optimal for preview');
			expect(assessment.estimatedPreviewFps).toBeGreaterThan(50);
		});

		it('should assess warning performance for medium element count', () => {
			const metrics = {
				elementCount: 2000, // Above dots warning threshold (1500)
				pathCount: 0,
				circleCount: 2000,
				rectCount: 0,
				groupCount: 0,
				symbolCount: 0,
				useCount: 0,
				totalElements: 2000,
				estimatedRenderComplexity: 2000,
				fileSizeBytes: 1024 * 100
			};

			const assessment = SvgPerformanceAnalyzer.assessPerformance(metrics, 'dots');

			expect(assessment.severity).toBe('warning');
			expect(assessment.recommendations.length).toBeGreaterThan(1);
			expect(assessment.recommendations[0]).toContain('dot density threshold');
		});

		it('should assess critical performance for high element count', () => {
			const metrics = {
				elementCount: 3000, // Above dots critical threshold (2500)
				pathCount: 0,
				circleCount: 3000,
				rectCount: 0,
				groupCount: 0,
				symbolCount: 0,
				useCount: 0,
				totalElements: 3000,
				estimatedRenderComplexity: 3000,
				fileSizeBytes: 1024 * 1024 // 1MB
			};

			const assessment = SvgPerformanceAnalyzer.assessPerformance(metrics, 'dots');

			expect(assessment.severity).toBe('critical');
			expect(assessment.recommendations).toContain(
				'Preview may be very slow - consider lower quality settings'
			);
			expect(assessment.optimizationPotential).toBe(0.8);
		});

		it('should provide backend-specific recommendations', () => {
			const metrics = {
				elementCount: 2000,
				pathCount: 2000,
				circleCount: 0,
				rectCount: 0,
				groupCount: 0,
				symbolCount: 0,
				useCount: 0,
				totalElements: 2000,
				estimatedRenderComplexity: 6000,
				fileSizeBytes: 1024 * 100
			};

			const edgeAssessment = SvgPerformanceAnalyzer.assessPerformance(metrics, 'edge');
			const dotsAssessment = SvgPerformanceAnalyzer.assessPerformance(metrics, 'dots');

			// Edge backend should have path-specific recommendations
			expect(edgeAssessment.recommendations.some((r) => r.includes('detail level'))).toBe(true);
			expect(edgeAssessment.recommendations.some((r) => r.includes('stroke width'))).toBe(true);

			// Dots assessment would be warning (2000 > 1500 but < 2500), edge is also warning (2000 = 2000)
			expect(edgeAssessment.severity).toBe('warning');
			expect(dotsAssessment.severity).toBe('warning');
		});
	});

	describe('performance thresholds', () => {
		it('should have correct thresholds for each backend', () => {
			expect(BACKEND_PERFORMANCE_THRESHOLDS.dots.warning).toBe(1500);
			expect(BACKEND_PERFORMANCE_THRESHOLDS.dots.critical).toBe(2500);

			expect(BACKEND_PERFORMANCE_THRESHOLDS.edge.warning).toBe(2000);
			expect(BACKEND_PERFORMANCE_THRESHOLDS.edge.critical).toBe(3000);
		});

		it('should correctly check budget exceedance', () => {
			expect(SvgPerformanceAnalyzer.exceedsPerformanceBudget(1000, 'dots', 'warning')).toBe(false);
			expect(SvgPerformanceAnalyzer.exceedsPerformanceBudget(1600, 'dots', 'warning')).toBe(true);
			expect(SvgPerformanceAnalyzer.exceedsPerformanceBudget(1600, 'dots', 'critical')).toBe(false);
			expect(SvgPerformanceAnalyzer.exceedsPerformanceBudget(2600, 'dots', 'critical')).toBe(true);
		});
	});

	describe('utility functions', () => {
		it('should estimate memory usage', () => {
			const metrics = {
				elementCount: 100,
				pathCount: 100,
				circleCount: 0,
				rectCount: 0,
				groupCount: 10,
				symbolCount: 0,
				useCount: 0,
				totalElements: 110, // 100 elements + 10 groups
				estimatedRenderComplexity: 300,
				fileSizeBytes: 1024
			};

			const memoryEstimate = SvgPerformanceAnalyzer.estimateMemoryUsage(metrics);

			// Should be approximately: (110 * 1024) + 1024 = 113,664 bytes
			expect(memoryEstimate).toBeGreaterThan(110000);
			expect(memoryEstimate).toBeLessThan(120000);
		});

		it('should format element count correctly', () => {
			expect(SvgPerformanceAnalyzer.formatElementCount(500)).toBe('500');
			expect(SvgPerformanceAnalyzer.formatElementCount(1500)).toBe('1.5K');
			expect(SvgPerformanceAnalyzer.formatElementCount(1000000)).toBe('1.0M');
		});

		it('should return correct status colors', () => {
			expect(SvgPerformanceAnalyzer.getPerformanceStatusColor('good')).toBe('text-green-600');
			expect(SvgPerformanceAnalyzer.getPerformanceStatusColor('warning')).toBe('text-yellow-600');
			expect(SvgPerformanceAnalyzer.getPerformanceStatusColor('critical')).toBe('text-red-600');
		});
	});
});
