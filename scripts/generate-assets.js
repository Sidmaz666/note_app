#!/usr/bin/env node

/**
 * Generate all app icons and splash screens from SVG source
 * This script automatically creates all required assets for production
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available, if not, provide instructions
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('❌ Error: sharp package is required to generate assets.');
  console.log('\n📦 Installing dependencies...');
  console.log('Run: npm install --save-dev sharp');
  process.exit(1);
}

const ASSETS_DIR = path.join(__dirname, '..', 'assets', 'images');
// Try both possible locations for the SVG
const SVG_PATH = fs.existsSync(path.join(__dirname, '..', 'assets', 'images', 'icon.svg'))
  ? path.join(__dirname, '..', 'assets', 'images', 'icon.svg')
  : path.join(__dirname, '..', 'assets', 'icon.svg');

// Ensure assets directory exists
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

// Color scheme for the app
const COLORS = {
  primary: '#3B82F6',      // Blue
  background: '#E6F4FE',   // Light blue background
  white: '#FFFFFF',
  black: '#000000',
  gray: '#9CA3AF',
};

async function generateIcon(size, outputPath, backgroundColor = null) {
  try {
    let image = sharp(SVG_PATH).resize(size, size);
    
    if (backgroundColor) {
      // Create a background and composite the icon on top
      const background = sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: backgroundColor
        }
      });
      
      const icon = await image.toBuffer();
      await background
        .composite([{ input: icon, blend: 'over' }])
        .png()
        .toFile(outputPath);
    } else {
      await image.png().toFile(outputPath);
    }
    
    console.log(`✅ Generated: ${path.basename(outputPath)} (${size}x${size})`);
  } catch (error) {
    console.error(`❌ Error generating ${outputPath}:`, error.message);
    throw error;
  }
}

async function generateFavicon() {
  const sizes = [16, 32, 48, 64, 128, 256];
  const faviconPath = path.join(ASSETS_DIR, 'favicon.png');
  
  // Generate largest favicon (256x256)
  await generateIcon(256, faviconPath);
  console.log(`✅ Generated favicon.png (256x256)`);
}

async function generateSplashIcon() {
  // Splash icon should be larger and centered
  const size = 512;
  const splashPath = path.join(ASSETS_DIR, 'splash-icon.png');
  
  await generateIcon(size, splashPath);
  console.log(`✅ Generated splash-icon.png (${size}x${size})`);
}

async function generateMainIcon() {
  // Main app icon - 1024x1024, no transparency
  const size = 1024;
  const iconPath = path.join(ASSETS_DIR, 'icon.png');
  
  await generateIcon(size, iconPath, COLORS.white);
  console.log(`✅ Generated icon.png (${size}x${size})`);
}

async function generateAndroidIcons() {
  const size = 1024;
  
  // Android adaptive icon foreground (with transparency)
  const foregroundPath = path.join(ASSETS_DIR, 'android-icon-foreground.png');
  await generateIcon(size, foregroundPath);
  
  // Android adaptive icon background (solid color)
  const backgroundPath = path.join(ASSETS_DIR, 'android-icon-background.png');
  const background = sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: COLORS.background
    }
  });
  await background.png().toFile(backgroundPath);
  console.log(`✅ Generated android-icon-background.png (${size}x${size})`);
  
  // Android monochrome icon (white icon on transparent)
  const monochromePath = path.join(ASSETS_DIR, 'android-icon-monochrome.png');
  // For monochrome, we'll use a simplified version
  // In a real scenario, you'd want a simpler, single-color version
  await generateIcon(size, monochromePath);
  console.log(`✅ Generated android-icon-monochrome.png (${size}x${size})`);
}

async function main() {
  console.log('🎨 Generating app assets from SVG...\n');
  
  if (!fs.existsSync(SVG_PATH)) {
    console.error(`❌ Error: SVG source not found at ${SVG_PATH}`);
    console.log('Please ensure assets/icon.svg exists.');
    process.exit(1);
  }
  
  try {
    await generateMainIcon();
    await generateAndroidIcons();
    await generateSplashIcon();
    await generateFavicon();
    
    console.log('\n✨ All assets generated successfully!');
    console.log('\n📁 Generated files:');
    console.log('  - icon.png (1024x1024)');
    console.log('  - android-icon-foreground.png (1024x1024)');
    console.log('  - android-icon-background.png (1024x1024)');
    console.log('  - android-icon-monochrome.png (1024x1024)');
    console.log('  - splash-icon.png (512x512)');
    console.log('  - favicon.png (256x256)');
    console.log('\n🚀 Your app is ready for production!');
  } catch (error) {
    console.error('\n❌ Error generating assets:', error);
    process.exit(1);
  }
}

main();
