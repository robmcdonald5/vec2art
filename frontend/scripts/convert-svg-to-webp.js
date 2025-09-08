#!/usr/bin/env node

import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GALLERY_DIR = path.join(__dirname, '..', 'static', 'gallery');
const SVG_DIR = path.join(GALLERY_DIR, 'after');
const WEBP_DIR = path.join(GALLERY_DIR, 'after-webp');
const MANIFEST_PATH = path.join(GALLERY_DIR, 'manifest.json');

// Algorithm mapping
const ALGORITHM_MAP = {
  'edgetracing': 'Edge Detection',
  'stippling': 'Dots',
  'superpixel': 'Superpixel',
  'centerline': 'Centerline'
};

// Parse algorithm from filename
function parseAlgorithm(filename) {
  const match = filename.match(/\(([^)]+)\)\.svg$/);
  return match ? match[1] : 'unknown';
}

// Get clean title from filename
function getTitle(filename) {
  return filename
    .replace(/\([^)]+\)\.svg$/, '')
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Convert SVG to WebP
async function convertSvgToWebp(svgPath, webpPath) {
  try {
    // Read SVG file
    const svgBuffer = await fs.readFile(svgPath);
    
    // Convert to WebP with optimal settings
    await sharp(svgBuffer, { density: 150 })
      .resize(1200, null, { 
        withoutEnlargement: true,
        fit: 'inside'
      })
      .webp({ 
        quality: 85,
        effort: 6
      })
      .toFile(webpPath);
    
    return true;
  } catch (error) {
    console.error(`Error converting ${svgPath}:`, error.message);
    return false;
  }
}

// Get file size in human readable format
async function getFileSize(filePath) {
  try {
    const stats = await fs.stat(filePath);
    const bytes = stats.size;
    const sizes = ['B', 'KB', 'MB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  } catch {
    return 'N/A';
  }
}

// Get image dimensions
async function getImageDimensions(imagePath) {
  try {
    const metadata = await sharp(imagePath).metadata();
    return `${metadata.width}x${metadata.height}`;
  } catch {
    return '1200x900'; // Default dimensions
  }
}

// Process all images
async function processGallery() {
  console.log('🎨 Starting SVG to WebP conversion...\n');
  
  // Create WebP directory structure
  const categories = await fs.readdir(SVG_DIR);
  const manifest = {
    generated: new Date().toISOString(),
    totalImages: 0,
    categories: {},
    items: []
  };
  
  let itemId = 1;
  
  for (const category of categories) {
    const categoryPath = path.join(SVG_DIR, category);
    const stats = await fs.stat(categoryPath);
    
    if (!stats.isDirectory()) continue;
    
    // Create WebP category directory
    const webpCategoryPath = path.join(WEBP_DIR, category);
    await fs.mkdir(webpCategoryPath, { recursive: true });
    
    // Get all SVG files in category
    const svgFiles = await fs.readdir(categoryPath);
    const svgFilesFiltered = svgFiles.filter(f => f.endsWith('.svg'));
    
    if (!manifest.categories[category]) {
      manifest.categories[category] = {
        name: category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' '),
        count: 0
      };
    }
    
    console.log(`📁 Processing ${category} (${svgFilesFiltered.length} files)...`);
    
    for (const svgFile of svgFilesFiltered) {
      const svgPath = path.join(categoryPath, svgFile);
      const webpFile = svgFile.replace('.svg', '.webp');
      const webpPath = path.join(webpCategoryPath, webpFile);
      
      // Convert SVG to WebP
      const success = await convertSvgToWebp(svgPath, webpPath);
      
      if (success) {
        const algorithm = parseAlgorithm(svgFile);
        const title = getTitle(svgFile);
        const baseName = svgFile.replace(/\([^)]+\)\.svg$/, '');
        
        // Find matching before image
        const beforeDir = path.join(GALLERY_DIR, 'before', category);
        let beforeImage = null;
        let beforeImagePath = null;
        
        try {
          const beforeFiles = await fs.readdir(beforeDir);
          
          // Try exact match first
          let matchingBefore = beforeFiles.find(f => {
            const nameWithoutExt = f.replace(/\.[^.]+$/, '');
            return nameWithoutExt === baseName && (f.endsWith('.avif') || f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.webp') || f.endsWith('.jpeg'));
          });
          
          // If no exact match, try prefix match
          if (!matchingBefore) {
            matchingBefore = beforeFiles.find(f => 
              f.startsWith(baseName) && (f.endsWith('.avif') || f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.webp') || f.endsWith('.jpeg'))
            );
          }
          
          if (matchingBefore) {
            beforeImage = `/gallery/before/${category}/${matchingBefore}`;
            beforeImagePath = path.join(beforeDir, matchingBefore);
          }
        } catch {
          // Before directory might not exist for this category
        }
        
        // Get file sizes and dimensions
        const afterSize = await getFileSize(webpPath);
        const svgSize = await getFileSize(svgPath);
        const dimensions = await getImageDimensions(webpPath);
        
        // Add to manifest
        const item = {
          id: itemId++,
          title: title,
          algorithm: ALGORITHM_MAP[algorithm] || algorithm,
          algorithmKey: algorithm,
          category: category,
          beforeImage: beforeImage || `/gallery-stock-before.png`,
          afterImage: `/gallery/after-webp/${category}/${webpFile}`,
          afterSvg: `/gallery/after/${category}/${svgFile}`,
          dimensions: dimensions,
          fileSize: afterSize,
          svgSize: svgSize
        };
        
        manifest.items.push(item);
        manifest.categories[category].count++;
        console.log(`  ✅ ${svgFile} → ${webpFile} (${afterSize})`);
      } else {
        console.log(`  ❌ Failed: ${svgFile}`);
      }
    }
  }
  
  manifest.totalImages = manifest.items.length;
  
  // Write manifest file
  await fs.writeFile(
    MANIFEST_PATH, 
    JSON.stringify(manifest, null, 2),
    'utf-8'
  );
  
  console.log('\n✨ Conversion complete!');
  console.log(`📊 Total images processed: ${manifest.totalImages}`);
  console.log(`📄 Manifest saved to: ${MANIFEST_PATH}`);
  console.log('\n📁 Categories:');
  for (const [cat, info] of Object.entries(manifest.categories)) {
    console.log(`  • ${info.name}: ${info.count} images`);
  }
}

// Run the conversion
processGallery().catch(console.error);