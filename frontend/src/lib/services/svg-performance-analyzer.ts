/**
 * SVG Performance Analyzer
 * Analyzes SVG complexity and provides performance metrics for preview optimization
 */

export interface SvgComplexityMetrics {
	elementCount: number;
	pathCount: number;
	circleCount: number;
	rectCount: number;
	groupCount: number;
	symbolCount: number;
	useCount: number;
	totalElements: number;
	estimatedRenderComplexity: number;
	fileSizeBytes: number;
	compressionRatio?: number;
}

export interface PerformanceThresholds {
	warning: number;
	critical: number;
}

export interface BackendThresholds {
	dots: PerformanceThresholds;
	edge: PerformanceThresholds;
	centerline: PerformanceThresholds;
	superpixel: PerformanceThresholds;
}

export interface PerformanceAssessment {
	severity: 'good' | 'warning' | 'critical';
	metrics: SvgComplexityMetrics;
	recommendations: string[];
	estimatedPreviewFps: number;
	optimizationPotential: number; // 0-1 scale
}

/**
 * Performance thresholds based on research
 * Research shows ~2,500 DOM elements cause significant slowdown
 */
export const BACKEND_PERFORMANCE_THRESHOLDS: BackendThresholds = {
	dots: {
		warning: 1500,  // Dots are simple circles but numerous
		critical: 2500
	},
	edge: {
		warning: 2000,  // Paths are more complex but fewer
		critical: 3000
	},
	centerline: {
		warning: 2000,  // Similar complexity to edge
		critical: 3000
	},
	superpixel: {
		warning: 1800,  // Polygonal paths, moderate complexity
		critical: 2800
	}
};

/**
 * SVG Performance Analyzer Class
 */
export class SvgPerformanceAnalyzer {
	/**
	 * Parse and analyze SVG complexity
	 */
	static analyzeSvgComplexity(svg: string): SvgComplexityMetrics {
		// Parse SVG to count elements
		const parser = new DOMParser();
		const doc = parser.parseFromString(svg, 'image/svg+xml');
		
		// Check for parser errors
		const parserError = doc.querySelector('parsererror');
		if (parserError) {
			console.warn('SVG parsing error:', parserError.textContent);
			// Fallback to regex-based counting
			return this.analyzeSvgWithRegex(svg);
		}

		const svgElement = doc.documentElement;
		
		// Count different element types
		const pathCount = svgElement.querySelectorAll('path').length;
		const circleCount = svgElement.querySelectorAll('circle').length;
		const rectCount = svgElement.querySelectorAll('rect').length;
		const groupCount = svgElement.querySelectorAll('g').length;
		const symbolCount = svgElement.querySelectorAll('symbol').length;
		const useCount = svgElement.querySelectorAll('use').length;
		const lineCount = svgElement.querySelectorAll('line').length;
		const polylineCount = svgElement.querySelectorAll('polyline').length;
		const polygonCount = svgElement.querySelectorAll('polygon').length;
		const ellipseCount = svgElement.querySelectorAll('ellipse').length;

		// Calculate element counts
		const elementCount = pathCount + circleCount + rectCount + lineCount + 
			polylineCount + polygonCount + ellipseCount;
		const totalElements = elementCount + groupCount + symbolCount + useCount;

		// Estimate render complexity (weighted by element type complexity)
		const estimatedRenderComplexity = 
			pathCount * 3 +        // Paths are most complex
			circleCount * 1 +      // Circles are simple
			rectCount * 1 +        // Rectangles are simple
			lineCount * 1 +        // Lines are simple
			polylineCount * 2 +    // Polylines are moderately complex
			polygonCount * 2 +     // Polygons are moderately complex
			ellipseCount * 1.5 +   // Ellipses are slightly more complex than circles
			groupCount * 0.1 +     // Groups add minimal complexity
			useCount * 0.5;        // Use elements are efficient

		return {
			elementCount,
			pathCount,
			circleCount,
			rectCount,
			groupCount,
			symbolCount,
			useCount,
			totalElements,
			estimatedRenderComplexity,
			fileSizeBytes: new Blob([svg]).size
		};
	}

	/**
	 * Fallback regex-based analysis for malformed SVGs
	 */
	private static analyzeSvgWithRegex(svg: string): SvgComplexityMetrics {
		const pathCount = (svg.match(/<path\s/g) || []).length;
		const circleCount = (svg.match(/<circle\s/g) || []).length;
		const rectCount = (svg.match(/<rect\s/g) || []).length;
		const groupCount = (svg.match(/<g\s/g) || []).length;
		const symbolCount = (svg.match(/<symbol\s/g) || []).length;
		const useCount = (svg.match(/<use\s/g) || []).length;
		const lineCount = (svg.match(/<line\s/g) || []).length;
		const polylineCount = (svg.match(/<polyline\s/g) || []).length;
		const polygonCount = (svg.match(/<polygon\s/g) || []).length;
		const ellipseCount = (svg.match(/<ellipse\s/g) || []).length;

		const elementCount = pathCount + circleCount + rectCount + lineCount + 
			polylineCount + polygonCount + ellipseCount;
		const totalElements = elementCount + groupCount + symbolCount + useCount;

		const estimatedRenderComplexity = 
			pathCount * 3 + circleCount * 1 + rectCount * 1 + lineCount * 1 +
			polylineCount * 2 + polygonCount * 2 + ellipseCount * 1.5 +
			groupCount * 0.1 + useCount * 0.5;

		return {
			elementCount,
			pathCount,
			circleCount,
			rectCount,
			groupCount,
			symbolCount,
			useCount,
			totalElements,
			estimatedRenderComplexity,
			fileSizeBytes: new Blob([svg]).size
		};
	}

	/**
	 * Assess overall performance based on backend and complexity
	 */
	static assessPerformance(
		metrics: SvgComplexityMetrics,
		backend: keyof BackendThresholds
	): PerformanceAssessment {
		const thresholds = BACKEND_PERFORMANCE_THRESHOLDS[backend];
		const elementCount = metrics.elementCount;

		// Determine severity
		let severity: 'good' | 'warning' | 'critical';
		if (elementCount >= thresholds.critical) {
			severity = 'critical';
		} else if (elementCount >= thresholds.warning) {
			severity = 'warning';
		} else {
			severity = 'good';
		}

		// Generate recommendations
		const recommendations = this.generateRecommendations(metrics, backend, severity);

		// Estimate preview FPS (rough approximation)
		const estimatedPreviewFps = Math.max(
			5, // Minimum 5 FPS
			60 - Math.floor((elementCount / 100) * 2) // Decrease from 60 FPS
		);

		// Calculate optimization potential
		const optimizationPotential = severity === 'critical' ? 0.8 :
			severity === 'warning' ? 0.5 : 0.2;

		return {
			severity,
			metrics,
			recommendations,
			estimatedPreviewFps,
			optimizationPotential
		};
	}

	/**
	 * Generate performance recommendations based on metrics and backend
	 */
	private static generateRecommendations(
		metrics: SvgComplexityMetrics,
		backend: keyof BackendThresholds,
		severity: 'good' | 'warning' | 'critical'
	): string[] {
		const recommendations: string[] = [];

		if (severity === 'good') {
			return ['Performance is optimal for preview'];
		}

		// Backend-specific recommendations
		if (backend === 'dots') {
			recommendations.push('Increase dot density threshold to reduce dot count');
			if (metrics.circleCount > 3000) {
				recommendations.push('Consider disabling adaptive sizing');
			}
			if (metrics.circleCount > 5000) {
				recommendations.push('Try edge or centerline backend instead');
			}
			if (metrics.symbolCount === 0 && metrics.circleCount > 1000) {
				recommendations.push('Enable symbol reuse optimization');
			}
		} else if (backend === 'edge') {
			recommendations.push('Reduce detail level to simplify paths');
			recommendations.push('Increase stroke width to merge nearby paths');
			if (metrics.pathCount > 1000) {
				recommendations.push('Enable path simplification');
			}
		} else if (backend === 'centerline') {
			recommendations.push('Reduce detail level for simpler shapes');
			recommendations.push('Increase morphological threshold');
			if (metrics.pathCount > 800) {
				recommendations.push('Consider increasing minimum path length');
			}
		} else if (backend === 'superpixel') {
			recommendations.push('Reduce superpixel count for fewer regions');
			recommendations.push('Increase compactness for simpler shapes');
			if (metrics.pathCount > 500) {
				recommendations.push('Use higher region merging threshold');
			}
		}

		// General recommendations
		if (severity === 'critical') {
			recommendations.push('Preview may be very slow - consider lower quality settings');
			if (metrics.fileSizeBytes > 1024 * 1024) { // > 1MB
				recommendations.push('Large file size may cause memory issues');
			}
		}

		// File size recommendations
		if (metrics.fileSizeBytes > 512 * 1024) { // > 512KB
			recommendations.push('Consider enabling SVG minification');
		}

		return recommendations;
	}

	/**
	 * Get performance thresholds for a specific backend
	 */
	static getThresholds(backend: keyof BackendThresholds): PerformanceThresholds {
		return BACKEND_PERFORMANCE_THRESHOLDS[backend];
	}

	/**
	 * Check if SVG exceeds performance budget
	 */
	static exceedsPerformanceBudget(
		elementCount: number,
		backend: keyof BackendThresholds,
		budgetType: 'warning' | 'critical' = 'warning'
	): boolean {
		const thresholds = this.getThresholds(backend);
		return elementCount >= thresholds[budgetType];
	}

	/**
	 * Estimate memory usage for SVG rendering
	 */
	static estimateMemoryUsage(metrics: SvgComplexityMetrics): number {
		// Rough estimation: each DOM element uses ~1KB of memory
		// This is a simplified estimate for performance warnings
		const domElementMemory = metrics.totalElements * 1024; // 1KB per element
		const svgDataMemory = metrics.fileSizeBytes;
		
		return domElementMemory + svgDataMemory;
	}

	/**
	 * Get performance status color for UI
	 */
	static getPerformanceStatusColor(severity: 'good' | 'warning' | 'critical'): string {
		switch (severity) {
			case 'good': return 'text-green-600';
			case 'warning': return 'text-yellow-600';
			case 'critical': return 'text-red-600';
		}
	}

	/**
	 * Format element count for display
	 */
	static formatElementCount(count: number): string {
		if (count < 1000) return count.toString();
		if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
		return `${(count / 1000000).toFixed(1)}M`;
	}
}

// Export convenience functions
export const analyzeSvgComplexity = SvgPerformanceAnalyzer.analyzeSvgComplexity.bind(SvgPerformanceAnalyzer);
export const assessPerformance = SvgPerformanceAnalyzer.assessPerformance.bind(SvgPerformanceAnalyzer);
export const getThresholds = SvgPerformanceAnalyzer.getThresholds.bind(SvgPerformanceAnalyzer);
export const exceedsPerformanceBudget = SvgPerformanceAnalyzer.exceedsPerformanceBudget.bind(SvgPerformanceAnalyzer);