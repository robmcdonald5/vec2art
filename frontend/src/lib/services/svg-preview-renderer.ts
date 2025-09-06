/**
 * Advanced SVG Preview Renderer
 * 
 * Implements performance-optimized rendering strategies for SVG previews:
 * 1. Canvas Preview Mode for SVGs >2,500 elements
 * 2. IMG Tag Fallback for pure display of complex SVGs
 * 3. Level-of-Detail Rendering system
 * 4. Spatial Indexing with R-tree for viewport culling
 * 5. WebGL acceleration for extremely large datasets
 */

import type { SvgComplexityMetrics } from './svg-performance-analyzer';
import { analyzeSvgComplexity, assessPerformance } from './svg-performance-analyzer';
// Object URL management handled with native browser API
import { gpuService } from './gpu-service';
import { SpatialIndex, type SpatialItem, type BoundingBox } from '$lib/utils/spatial-index';

export type RenderMode = 'svg-dom' | 'canvas' | 'img-fallback' | 'webgl' | 'webp';
export type DetailLevel = 'overview' | 'normal' | 'high';

export interface RenderStrategy {
  mode: RenderMode;
  detailLevel: DetailLevel;
  reason: string;
  estimatedPerformance: 'excellent' | 'good' | 'warning' | 'critical';
}

export interface ViewportBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}


export interface PreviewRenderOptions {
  width?: number;
  height?: number;
  viewport?: ViewportBounds;
  quality?: 'low' | 'medium' | 'high';
  enableSpatialCulling?: boolean;
  forceMode?: RenderMode;
}

export class SvgPreviewRenderer {
  private canvas?: HTMLCanvasElement;
  private ctx?: CanvasRenderingContext2D;
  private spatialIndex: SpatialIndex<SVGElement> = new SpatialIndex();
  private lastMetrics?: SvgComplexityMetrics;
  private cachedUrls: Map<string, string> = new Map();

  constructor() {}

  /**
   * Determine optimal rendering strategy based on SVG complexity and performance
   */
  analyzeRenderStrategy(
    svgContent: string,
    backend: string,
    options: PreviewRenderOptions = {}
  ): RenderStrategy {
    try {
      console.log('[SvgPreviewRenderer] Analyzing render strategy for:', { 
        contentLength: svgContent.length, 
        backend,
        options 
      });

      // Force mode override
      if (options.forceMode) {
        return {
          mode: options.forceMode,
          detailLevel: 'normal',
          reason: 'Forced by user preference',
          estimatedPerformance: 'good'
        };
      }

      const metrics = analyzeSvgComplexity(svgContent);
      const assessment = assessPerformance(metrics, backend as any);
      this.lastMetrics = metrics;
      
      console.log('[SvgPreviewRenderer] Analysis results:', { metrics, assessment });

    // Performance-based decision matrix
    const elementCount = metrics.elementCount;
    const complexity = metrics.estimatedRenderComplexity;

    // WebGL for extremely large datasets
    if (elementCount > 10000 && gpuService.isGpuAvailable()) {
      return {
        mode: 'webgl',
        detailLevel: 'high',
        reason: `WebGL recommended for ${elementCount} elements with GPU acceleration`,
        estimatedPerformance: assessment.severity === 'critical' ? 'warning' : 'good'
      };
    }

    // Canvas for large SVGs
    if (elementCount > 2500 || assessment.severity === 'critical') {
      return {
        mode: 'canvas',
        detailLevel: 'normal',
        reason: `Canvas rendering for ${elementCount} elements (${assessment.severity} complexity)`,
        estimatedPerformance: assessment.severity === 'critical' ? 'warning' : 'good'
      };
    }

    // IMG fallback for moderate complexity with pure display
    if (elementCount > 1500 || (complexity > 1000 && !options.viewport)) {
      return {
        mode: 'img-fallback',
        detailLevel: 'normal',
        reason: `IMG fallback for ${elementCount} elements (static display)`,
        estimatedPerformance: 'excellent'
      };
    }

    // SVG DOM for simple graphics
    const strategy = {
      mode: 'svg-dom' as const,
      detailLevel: 'high' as const,
      reason: `SVG DOM for ${elementCount} elements (optimal for interaction)`,
      estimatedPerformance: assessment.severity === 'good' ? 'excellent' as const : 'good' as const
    };
    
    console.log('[SvgPreviewRenderer] Selected strategy:', strategy);
    return strategy;
    
    } catch (error) {
      console.error('[SvgPreviewRenderer] Strategy analysis error:', error);
      // Fallback strategy
      return {
        mode: 'img-fallback',
        detailLevel: 'normal',
        reason: 'Fallback due to analysis error',
        estimatedPerformance: 'good'
      };
    }
  }

  /**
   * Render SVG using Canvas for high-performance rasterization
   */
  async renderToCanvas(
    svgContent: string,
    options: PreviewRenderOptions = {}
  ): Promise<{ canvas: HTMLCanvasElement; dataUrl: string }> {
    console.log('[SvgPreviewRenderer] Starting canvas render with:', { 
      contentLength: svgContent.length,
      options 
    });
    
    const width = options.width || 800;
    const height = options.height || 600;

    // Create or reuse canvas
    if (!this.canvas) {
      console.log('[SvgPreviewRenderer] Creating new canvas element');
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d') || undefined;
    }

    if (!this.ctx) {
      throw new Error('Canvas 2D context not available');
    }

    this.canvas.width = width;
    this.canvas.height = height;

    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);
    console.log('[SvgPreviewRenderer] Canvas prepared:', { width, height });

    try {
      // Create SVG blob and load as image
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
      const svgUrl = URL.createObjectURL(svgBlob);

      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load SVG'));
        img.src = svgUrl;
      });

      // Draw SVG to canvas with quality settings
      const quality = options.quality || 'medium';
      this.ctx!.imageSmoothingEnabled = quality !== 'low';
      this.ctx!.imageSmoothingQuality = quality === 'high' ? 'high' : 'medium';

      // Calculate scaling to fit canvas
      const scaleX = width / img.width;
      const scaleY = height / img.height;
      const scale = Math.min(scaleX, scaleY);
      
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const offsetX = (width - scaledWidth) / 2;
      const offsetY = (height - scaledHeight) / 2;

      this.ctx!.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

      // Cleanup
      URL.revokeObjectURL(svgUrl);

      return {
        canvas: this.canvas,
        dataUrl: this.canvas.toDataURL('image/png', quality === 'high' ? 0.9 : 0.7)
      };
    } catch (error) {
      console.error('Canvas rendering failed:', error);
      throw error;
    }
  }

  /**
   * Create IMG fallback for pure display performance
   */
  createImgFallback(svgContent: string): string {
    try {
      console.log('[SvgPreviewRenderer] Creating IMG fallback for SVG length:', svgContent.length);
      
      const svgHash = this.hashString(svgContent);
      console.log('[SvgPreviewRenderer] SVG hash calculated:', svgHash);
      
      // Check cache first
      if (this.cachedUrls.has(svgHash)) {
        const cachedUrl = this.cachedUrls.get(svgHash)!;
        console.log('[SvgPreviewRenderer] Using cached URL:', !!cachedUrl);
        return cachedUrl;
      }

      // Create blob URL
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
      console.log('[SvgPreviewRenderer] SVG blob created, size:', svgBlob.size);
      
      const url = URL.createObjectURL(svgBlob);
      console.log('[SvgPreviewRenderer] URL created:', !!url);
      
      // Cache for reuse
      this.cachedUrls.set(svgHash, url);
      console.log('[SvgPreviewRenderer] URL cached, returning:', !!url);
      
      return url;
    } catch (error) {
      console.error('[SvgPreviewRenderer] IMG fallback creation failed:', error);
      throw error;
    }
  }

  /**
   * Level-of-Detail rendering based on zoom level
   */
  getLevelOfDetail(viewport: ViewportBounds): DetailLevel {
    const { scale } = viewport;
    
    if (scale < 0.5) return 'overview';
    if (scale > 2.0) return 'high';
    return 'normal';
  }

  /**
   * Build spatial index for viewport culling
   */
  buildSpatialIndex(svgContent: string): void {
    this.spatialIndex.clear();

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgContent, 'image/svg+xml');
      const root = doc.documentElement;

      // Extract all renderable elements with bounds
      const elements = root.querySelectorAll('path, circle, rect, ellipse, line, polyline, polygon, text, image, use, g');
      
      elements.forEach((element, index) => {
        try {
          const bbox = this.calculateElementBounds(element as SVGElement);
          if (bbox) {
            const spatialItem: SpatialItem<SVGElement> = {
              id: `element-${index}`,
              bounds: bbox,
              data: element as SVGElement
            };
            this.spatialIndex.insert(spatialItem);
          }
        } catch (error) {
          // Skip elements that can't be measured
          console.debug('Failed to measure element:', element.tagName, error);
        }
      });

      const stats = this.spatialIndex.getStats();
      console.log(`[SvgPreviewRenderer] Built spatial index:`, stats);
    } catch (error) {
      console.error('Failed to build spatial index:', error);
    }
  }

  /**
   * Perform viewport culling using spatial index
   */
  cullByViewport(viewport: ViewportBounds): {
    visible: SpatialItem<SVGElement>[];
    cullStats: {
      totalCount: number;
      visibleCount: number;
      cullPercentage: number;
    }
  } {
    const viewportBounds: BoundingBox = {
      x: viewport.x,
      y: viewport.y,
      width: viewport.width,
      height: viewport.height
    };

    const result = this.spatialIndex.queryViewport(viewportBounds);
    
    console.log(`[SvgPreviewRenderer] Viewport culling: ${result.visibleCount}/${result.totalCount} visible (${result.cullPercentage}% culled)`);
    
    return {
      visible: result.items,
      cullStats: {
        totalCount: result.totalCount,
        visibleCount: result.visibleCount,
        cullPercentage: result.cullPercentage
      }
    };
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    lastMetrics?: SvgComplexityMetrics;
    spatialIndex: any;
    cachedUrls: number;
    gpuAvailable: boolean;
  } {
    let gpuAvailable = false;
    try {
      gpuAvailable = gpuService.isGpuAvailable();
    } catch (error) {
      console.warn('[SvgPreviewRenderer] GPU service error:', error);
      // Try to initialize GPU service if not ready
      gpuService.initialize().catch(err => {
        console.warn('[SvgPreviewRenderer] GPU initialization failed:', err);
      });
    }
    
    return {
      lastMetrics: this.lastMetrics,
      spatialIndex: this.spatialIndex.getStats(),
      cachedUrls: this.cachedUrls.size,
      gpuAvailable
    };
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    // Release cached URLs
    for (const url of this.cachedUrls.values()) {
      URL.revokeObjectURL(url);
    }
    this.cachedUrls.clear();
    
    // Clear spatial index
    this.spatialIndex.clear();
    
    // Clear metrics
    this.lastMetrics = undefined;
  }

  // Helper methods
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  private calculateElementBounds(element: SVGElement): { x: number; y: number; width: number; height: number } | null {
    try {
      // Try to get bounding box - this works for most SVG elements
      if ('getBBox' in element) {
        const bbox = (element as any).getBBox();
        return {
          x: bbox.x,
          y: bbox.y,
          width: bbox.width,
          height: bbox.height
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  private calculateElementComplexity(element: SVGElement): number {
    const tagName = element.tagName.toLowerCase();
    
    // Complexity weights based on rendering cost
    const complexity = {
      'path': 3,
      'circle': 1,
      'ellipse': 1,
      'rect': 1,
      'line': 1,
      'polyline': 2,
      'polygon': 2,
      'text': 2,
      'image': 1,
      'use': 1,
      'g': 0.5
    };

    let baseComplexity = complexity[tagName as keyof typeof complexity] || 1;
    
    // Add complexity for gradients, patterns, filters
    if (element.style.fill && element.style.fill.includes('url(')) baseComplexity += 2;
    if (element.style.stroke && element.style.stroke.includes('url(')) baseComplexity += 1;
    if (element.getAttribute('filter')) baseComplexity += 3;
    if (element.getAttribute('transform')) baseComplexity += 0.5;
    
    return baseComplexity;
  }
}

// Global instance with lazy initialization
let _svgPreviewRenderer: SvgPreviewRenderer | null = null;

export const svgPreviewRenderer = new Proxy({} as SvgPreviewRenderer, {
  get(target, prop) {
    try {
      if (!_svgPreviewRenderer) {
        console.log('[SvgPreviewRenderer] Initializing service...');
        _svgPreviewRenderer = new SvgPreviewRenderer();
      }
      const value = (_svgPreviewRenderer as any)[prop];
      if (typeof value === 'function') {
        return value.bind(_svgPreviewRenderer);
      }
      return value;
    } catch (error) {
      console.error('[SvgPreviewRenderer] Proxy access error:', error);
      throw error;
    }
  }
});