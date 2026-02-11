#!/usr/bin/env node

/**
 * Image Optimization Script
 *
 * Optimizes images in public/images/ directory:
 * - Resizes to max 1600px width (for 2x retina at ~800px display)
 * - Converts to WebP format (90% smaller than JPEG)
 * - Compresses to 80% quality
 * - Preserves originals in original_images/ (outside public/ - never deployed)
 *
 * Usage:
 *   pnpm optimize:images              # Optimize all images
 *   pnpm optimize:images --force      # Re-optimize even if WebP exists
 */

import { copyFile, mkdir, readdir, stat } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const IMAGES_DIR = join(PROJECT_ROOT, "public/images");
const ORIGINAL_DIR = join(PROJECT_ROOT, "original_images");

// Configuration
const MAX_WIDTH = 1600; // For 2x retina displays at ~800px width
const QUALITY = 80; // WebP quality (80 = good balance)
const FORCE = process.argv.includes("--force");

// Image extensions to process
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png"];

/**
 * Recursively find all image files in a directory
 */
async function findImages(dir, images = []) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip the original directory to avoid processing backups
      if (entry.name !== "original") {
        await findImages(fullPath, images);
      }
    } else if (entry.isFile()) {
      const ext = extname(entry.name).toLowerCase();
      if (IMAGE_EXTENSIONS.includes(ext)) {
        images.push(fullPath);
      }
    }
  }

  return images;
}

/**
 * Optimize a single image
 */
async function optimizeImage(imagePath) {
  const ext = extname(imagePath);
  const baseName = basename(imagePath, ext);
  const dir = dirname(imagePath);
  const webpPath = join(dir, `${baseName}.webp`);

  // Skip if WebP already exists (unless --force)
  if (!FORCE) {
    try {
      await stat(webpPath);
      console.log(`⏭️  Skipping ${basename(imagePath)} (WebP exists)`);
      return { skipped: true };
    } catch {
      // WebP doesn't exist, continue
    }
  }

  // Get original size
  const originalStats = await stat(imagePath);
  const originalSizeKB = (originalStats.size / 1024).toFixed(0);

  // Create backup in original/ directory
  const relativePath = imagePath.replace(`${IMAGES_DIR}/`, "");
  const backupPath = join(ORIGINAL_DIR, relativePath);
  const backupDir = dirname(backupPath);

  await mkdir(backupDir, { recursive: true });

  try {
    await stat(backupPath);
  } catch {
    // Backup doesn't exist, create it
    await copyFile(imagePath, backupPath);
  }

  // Optimize and convert to WebP
  const image = sharp(imagePath);
  const metadata = await image.metadata();

  await image
    .resize({
      width: Math.min(metadata.width, MAX_WIDTH),
      withoutEnlargement: true,
    })
    .webp({ quality: QUALITY })
    .toFile(webpPath);

  // Get new size
  const newStats = await stat(webpPath);
  const newSizeKB = (newStats.size / 1024).toFixed(0);
  const savings = ((1 - newStats.size / originalStats.size) * 100).toFixed(0);

  console.log(
    `✅ ${basename(imagePath)} → ${baseName}.webp (${originalSizeKB}KB → ${newSizeKB}KB, ${savings}% smaller)`,
  );

  return {
    original: imagePath,
    optimized: webpPath,
    originalSize: originalStats.size,
    newSize: newStats.size,
    savings: Number(savings),
  };
}

/**
 * Main function
 */
async function main() {
  console.log("🖼️  Image Optimization Script\n");
  console.log(`📁 Scanning: ${IMAGES_DIR}`);
  console.log(`📐 Max width: ${MAX_WIDTH}px`);
  console.log(`🎨 Quality: ${QUALITY}%`);
  console.log(`💾 Backups: ${ORIGINAL_DIR}\n`);

  // Find all images
  const images = await findImages(IMAGES_DIR);

  if (images.length === 0) {
    console.log("❌ No images found");
    return;
  }

  console.log(`Found ${images.length} image(s)\n`);

  // Create original directory
  await mkdir(ORIGINAL_DIR, { recursive: true });

  // Optimize all images
  const results = [];
  for (const imagePath of images) {
    try {
      const result = await optimizeImage(imagePath);
      if (!result.skipped) {
        results.push(result);
      }
    } catch (error) {
      console.error(
        `❌ Error optimizing ${basename(imagePath)}:`,
        error.message,
      );
    }
  }

  // Summary
  if (results.length > 0) {
    const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
    const totalNew = results.reduce((sum, r) => sum + r.newSize, 0);
    const totalSavings = ((1 - totalNew / totalOriginal) * 100).toFixed(0);

    console.log(`\n📊 Summary:`);
    console.log(`   Optimized: ${results.length} image(s)`);
    console.log(`   Original: ${(totalOriginal / 1024 / 1024).toFixed(1)}MB`);
    console.log(`   Optimized: ${(totalNew / 1024 / 1024).toFixed(1)}MB`);
    console.log(`   Saved: ${totalSavings}%`);
  }

  console.log("\n✨ Done!");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
