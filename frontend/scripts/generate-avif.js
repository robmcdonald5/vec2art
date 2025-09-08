#!/usr/bin/env node

import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GALLERY_DIR = path.join(__dirname, '..', 'static', 'gallery');
const BEFORE_DIR = path.join(GALLERY_DIR, 'before');
const AFTER_WEBP_DIR = path.join(GALLERY_DIR, 'after-webp');

// Convert image to AVIF format
async function convertToAvif(inputPath, outputPath) {
  try {
    await sharp(inputPath)
      .avif({ 
        quality: 80,  // Good balance of quality and size
        effort: 6,    // Higher effort for better compression
        chromaSubsampling: '4:2:0'
      })
      .toFile(outputPath);
    
    return true;
  } catch (error) {
    console.error(`Error converting ${inputPath}:`, error.message);
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

// Process directory
async function processDirectory(dirPath, outputDirName) {
  console.log(`\n📁 Processing ${dirPath}...`);
  
  const categories = await fs.readdir(dirPath);
  let totalConverted = 0;
  let totalSaved = 0;
  
  for (const category of categories) {
    const categoryPath = path.join(dirPath, category);
    const stats = await fs.stat(categoryPath);
    
    if (!stats.isDirectory()) continue;
    
    // Create output directory
    const outputCategoryPath = path.join(GALLERY_DIR, outputDirName, category);
    await fs.mkdir(outputCategoryPath, { recursive: true });
    
    const files = await fs.readdir(categoryPath);
    const imageFiles = files.filter(f => 
      f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.webp')
    );
    
    console.log(`  📂 ${category} (${imageFiles.length} images to convert)`);
    
    for (const file of imageFiles) {
      const inputPath = path.join(categoryPath, file);
      const outputFile = file.replace(/\.(png|jpg|jpeg|webp)$/i, '.avif');
      const outputPath = path.join(outputCategoryPath, outputFile);
      
      // Skip if AVIF already exists
      try {
        await fs.access(outputPath);
        console.log(`    ⏭️  ${outputFile} (already exists)`);
        continue;
      } catch {
        // File doesn't exist, proceed with conversion
      }
      
      const success = await convertToAvif(inputPath, outputPath);
      
      if (success) {
        const originalSize = await getFileSize(inputPath);
        const avifSize = await getFileSize(outputPath);
        
        // Parse sizes for comparison
        const getBytes = (sizeStr) => {
          const match = sizeStr.match(/(\d+\.?\d*)\s*(\w+)/);
          if (!match) return 0;
          const [, num, unit] = match;
          const multiplier = unit === 'MB' ? 1024 * 1024 : unit === 'KB' ? 1024 : 1;
          return parseFloat(num) * multiplier;
        };
        
        const originalBytes = getBytes(originalSize);
        const avifBytes = getBytes(avifSize);
        const savedBytes = originalBytes - avifBytes;
        const savedPercent = Math.round((savedBytes / originalBytes) * 100);
        
        totalSaved += savedBytes;
        totalConverted++;
        
        console.log(`    ✅ ${file} → ${outputFile}`);
        console.log(`       ${originalSize} → ${avifSize} (${savedPercent}% smaller)`);
      } else {
        console.log(`    ❌ Failed: ${file}`);
      }
    }
  }
  
  return { totalConverted, totalSaved };
}

// Main function
async function main() {
  console.log('🎨 Starting AVIF generation for gallery images...');
  console.log('This will create AVIF versions alongside existing formats.');
  
  // Process before images
  const beforeResults = await processDirectory(BEFORE_DIR, 'before-avif');
  
  // Process after-webp images (convert WebP to AVIF for even better compression)
  const afterResults = await processDirectory(AFTER_WEBP_DIR, 'after-avif');
  
  const totalConverted = beforeResults.totalConverted + afterResults.totalConverted;
  const totalSaved = beforeResults.totalSaved + afterResults.totalSaved;
  
  console.log('\n✨ AVIF generation complete!');
  console.log(`📊 Total images converted: ${totalConverted}`);
  console.log(`💾 Total space saved: ${(totalSaved / 1024 / 1024).toFixed(2)} MB`);
  console.log('\n📝 Note: Update your image components to serve AVIF with WebP/JPEG fallbacks.');
}

// Run the conversion
main().catch(console.error);