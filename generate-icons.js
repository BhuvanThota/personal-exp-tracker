// Script to generate PWA icons by resizing an existing PNG
// Requires: npm install sharp
// Run with: node generate-icons.js

// eslint-disable-next-line @typescript-eslint/no-require-imports
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sharp = require('sharp');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

// Source image
const src = path.join(__dirname, 'public', 'android-chrome-512x512.png');

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Additional Apple-specific sizes
const appleSizes = [180, 167];

// Output directory
const publicDir = path.join(__dirname, 'public');

if (!fs.existsSync(src)) {
  console.error(`Source image not found: ${src}`);
  console.error('Please ensure you have android-chrome-512x512.png in your public directory');
  process.exit(1);
}

(async () => {
  try {
    // Generate standard PWA icons
    for (const size of sizes) {
      const outPath = path.join(publicDir, `icon-${size}x${size}.png`);
      await sharp(src)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .toFile(outPath);
      console.log(`✓ Created ${outPath}`);
    }

    // Generate Apple-specific icons
    for (const size of appleSizes) {
      const outPath = path.join(publicDir, `icon-${size}x${size}.png`);
      await sharp(src)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .toFile(outPath);
      console.log(`✓ Created ${outPath} (Apple)`);
    }

    // Generate favicons
    await sharp(src).resize(32, 32).toFile(path.join(publicDir, 'favicon-32x32.png'));
    await sharp(src).resize(16, 16).toFile(path.join(publicDir, 'favicon-16x16.png'));
    console.log('✓ Favicons created');

    // Generate a maskable icon (with padding for Android adaptive icons)
    const maskablePath = path.join(publicDir, 'icon-512x512-maskable.png');
    await sharp(src)
      .resize(384, 384, {
        fit: 'contain',
        background: { r: 59, g: 130, b: 246, alpha: 1 } // Your theme color
      })
      .extend({
        top: 64,
        bottom: 64,
        left: 64,
        right: 64,
        background: { r: 59, g: 130, b: 246, alpha: 1 }
      })
      .toFile(maskablePath);
    console.log('✓ Created maskable icon');

    console.log('\n✅ Icon generation complete!');
    console.log('All icons have been generated successfully.');
    
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
})();