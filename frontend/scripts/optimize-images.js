/**
 * Image Optimization Script for echodraft
 * 
 * This script helps optimize images for better SEO and page load performance.
 * To use this script, you'll need to install the following packages:
 * 
 * npm install sharp imagemin imagemin-mozjpeg imagemin-pngquant
 * 
 * Then run: node scripts/optimize-images.js
 */

const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');

const PUBLIC_DIR = path.join(__dirname, '../public');
const IMAGE_DIRS = [
  path.join(PUBLIC_DIR, 'images')
];

// Image sizes for responsive images
const SIZES = [
  { width: 1200, suffix: 'large' },
  { width: 800, suffix: 'medium' },
  { width: 400, suffix: 'small' }
];

async function processImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const baseName = path.basename(filePath, ext);
  const dirName = path.dirname(filePath);
  
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
    console.log(`Skipping non-image file: ${filePath}`);
    return;
  }
  
  console.log(`Processing: ${filePath}`);
  
  try {
    // Create responsive versions
    for (const size of SIZES) {
      const outputPath = path.join(dirName, `${baseName}-${size.suffix}${ext}`);
      
      await sharp(filePath)
        .resize(size.width)
        .toFile(outputPath);
      
      // Compress the resized image
      await imagemin([outputPath], {
        destination: dirName,
        plugins: [
          imageminMozjpeg({ quality: 80 }),
          imageminPngquant({ quality: [0.6, 0.8] })
        ]
      });
      
      console.log(`Created: ${outputPath}`);
    }
    
    // Compress the original image
    await imagemin([filePath], {
      destination: dirName,
      plugins: [
        imageminMozjpeg({ quality: 85 }),
        imageminPngquant({ quality: [0.7, 0.9] })
      ]
    });
    
    console.log(`Optimized original: ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

async function processDirectory(directory) {
  try {
    const files = await fs.readdir(directory);
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isDirectory()) {
        await processDirectory(filePath);
      } else {
        await processImage(filePath);
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${directory}:`, error);
  }
}

async function main() {
  console.log('Starting image optimization...');
  
  for (const dir of IMAGE_DIRS) {
    console.log(`Processing directory: ${dir}`);
    await processDirectory(dir);
  }
  
  console.log('Image optimization complete!');
}

main().catch(console.error);
