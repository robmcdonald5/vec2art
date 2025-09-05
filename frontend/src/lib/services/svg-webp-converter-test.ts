/**
 * Test file for SVG to WebP conversion optimization
 * 
 * This file demonstrates the performance improvements with OffscreenCanvas + Web Workers
 * and provides testing utilities for large SVG files.
 */

import { SvgToWebPConverter } from './svg-to-webp-converter';

// Generate a large test SVG for performance testing
export function generateLargeSvg(elementCount: number = 10000): string {
  const paths: string[] = [];
  const width = 2000;
  const height = 2000;
  
  // Generate random paths to simulate complex SVG
  for (let i = 0; i < elementCount; i++) {
    const x1 = Math.random() * width;
    const y1 = Math.random() * height;
    const x2 = Math.random() * width;
    const y2 = Math.random() * height;
    const cx = Math.random() * width;
    const cy = Math.random() * height;
    
    const hue = (i * 137.508) % 360; // Golden angle for color variation
    const color = `hsl(${hue}, 70%, 50%)`;
    
    // Mix of paths, circles, and lines for complexity
    if (i % 3 === 0) {
      paths.push(`<path d="M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}" stroke="${color}" stroke-width="2" fill="none"/>`);
    } else if (i % 3 === 1) {
      const r = Math.random() * 20 + 5;
      paths.push(`<circle cx="${x1}" cy="${y1}" r="${r}" fill="${color}" opacity="0.7"/>`);
    } else {
      paths.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1"/>`);
    }
  }
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f0f9ff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#e0e7ff;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  ${paths.join('\n  ')}
</svg>`;
}

// Performance testing utility
export async function performanceTest() {
  console.log('🚀 Starting SVG to WebP Performance Test');
  
  const converter = new SvgToWebPConverter();
  
  // Test with different SVG sizes
  const testSizes = [
    { name: 'Small (1K elements)', elements: 1000 },
    { name: 'Medium (5K elements)', elements: 5000 },
    { name: 'Large (10K elements)', elements: 10000 },
    { name: 'Very Large (25K elements)', elements: 25000 }
  ];
  
  const results: Array<{
    name: string;
    svgSize: number;
    workerTime: number;
    mainThreadTime: number;
    improvement: number;
    workerSuccess: boolean;
    mainThreadSuccess: boolean;
  }> = [];
  
  for (const test of testSizes) {
    console.log(`\n📊 Testing ${test.name}...`);
    
    const svgContent = generateLargeSvg(test.elements);
    const svgSize = svgContent.length;
    
    console.log(`   SVG size: ${Math.round(svgSize / 1024)}KB`);
    
    let workerTime = 0;
    let mainThreadTime = 0;
    let workerSuccess = false;
    let mainThreadSuccess = false;
    
    // Test with Web Worker (if supported)
    if (SvgToWebPConverter.isWorkerSupported()) {
      try {
        console.log('   Testing with OffscreenCanvas Web Worker...');
        
        const startTime = performance.now();
        
        const result = await converter.convertSvgToWebP(svgContent, {
          useWorker: true,
          quality: 0.8,
          maxWidth: 1024,
          maxHeight: 1024,
          onProgress: (stage, percent) => {
            if (percent % 20 === 0) {
              console.log(`     Worker: ${stage} (${percent}%)`);
            }
          }
        });
        
        workerTime = performance.now() - startTime;
        workerSuccess = true;
        
        console.log(`     ✅ Worker completed in ${Math.round(workerTime)}ms`);
        console.log(`     📈 Compression: ${result.compressionRatio}x`);
        console.log(`     💾 WebP size: ${Math.round(result.webpDataUrl.length / 1024)}KB`);
        
      } catch (error) {
        console.log(`     ❌ Worker failed: ${error}`);
        workerSuccess = false;
      }
    } else {
      console.log('   ⚠️ OffscreenCanvas Web Worker not supported');
    }
    
    // Test with main thread (fallback)
    try {
      console.log('   Testing with main thread fallback...');
      
      const startTime = performance.now();
      
      const result = await converter.convertSvgToWebP(svgContent, {
        useWorker: false,
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
        onProgress: (stage, percent) => {
          if (percent % 20 === 0) {
            console.log(`     Main thread: ${stage} (${percent}%)`);
          }
        }
      });
      
      mainThreadTime = performance.now() - startTime;
      mainThreadSuccess = true;
      
      console.log(`     ✅ Main thread completed in ${Math.round(mainThreadTime)}ms`);
      console.log(`     📈 Compression: ${result.compressionRatio}x`);
      
    } catch (error) {
      console.log(`     ❌ Main thread failed: ${error}`);
      mainThreadSuccess = false;
    }
    
    // Calculate improvement
    const improvement = workerSuccess && mainThreadSuccess 
      ? ((mainThreadTime - workerTime) / mainThreadTime) * 100
      : 0;
    
    results.push({
      name: test.name,
      svgSize,
      workerTime,
      mainThreadTime,
      improvement,
      workerSuccess,
      mainThreadSuccess
    });
    
    if (improvement > 0) {
      console.log(`   🎯 Performance improvement: ${improvement.toFixed(1)}%`);
    }
  }
  
  // Print summary
  console.log('\n📋 Performance Test Summary:');
  console.log('─'.repeat(80));
  console.log('Test Case'.padEnd(25) + 'SVG Size'.padEnd(12) + 'Worker'.padEnd(10) + 'Main Thread'.padEnd(12) + 'Improvement');
  console.log('─'.repeat(80));
  
  for (const result of results) {
    const svgSizeStr = `${Math.round(result.svgSize / 1024)}KB`;
    const workerStr = result.workerSuccess ? `${Math.round(result.workerTime)}ms` : 'Failed';
    const mainStr = result.mainThreadSuccess ? `${Math.round(result.mainThreadTime)}ms` : 'Failed';
    const improvementStr = result.improvement > 0 ? `+${result.improvement.toFixed(1)}%` : 'N/A';
    
    console.log(
      result.name.padEnd(25) + 
      svgSizeStr.padEnd(12) + 
      workerStr.padEnd(10) + 
      mainStr.padEnd(12) + 
      improvementStr
    );
  }
  
  console.log('─'.repeat(80));
  
  // Clean up
  converter.dispose();
  
  return results;
}

// Export for manual testing in browser console
if (typeof window !== 'undefined') {
  (window as any).testSvgWebPPerformance = performanceTest;
  (window as any).generateLargeSvg = generateLargeSvg;
  console.log('💡 Test functions available:');
  console.log('   window.testSvgWebPPerformance() - Run performance test');
  console.log('   window.generateLargeSvg(elementCount) - Generate test SVG');
}