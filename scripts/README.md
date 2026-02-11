# Image Optimization

## Overview

This script optimizes images for web delivery to improve page load times and SEO rankings.

## What It Does

1. **Backs up originals** → Copies original images to `original_images/` (outside `public/` - never deployed)
2. **Resizes** → Max width of 1600px (perfect for 2x retina displays at ~800px)
3. **Converts to WebP** → Modern format that's ~90% smaller than JPEG
4. **Compresses** → 80% quality (indistinguishable from original to human eye)

## Usage

```bash
# Optimize all images (skips already-optimized)
pnpm optimize:images

# Force re-optimization of all images
pnpm optimize:images --force
```

## Results

Expected savings:
- **Before:** 4-8MB per image
- **After:** 100-300KB per image
- **Total savings:** ~95% smaller

## When to Run

Run this script whenever you:
- Add new product images
- Replace existing images
- Notice slow page load times

## After Optimization

After running the script, update your code to reference `.webp` files instead of `.jpg`:

```tsx
// Before
src="/images/product/vests.jpg"

// After
src="/images/product/vests.webp"
```

## Backup Recovery

Original images are preserved in `original_images/` (outside `public/` directory) and excluded from git via `.gitignore`.

This ensures:
- ✅ Originals are never part of the build
- ✅ Originals are never deployed
- ✅ No wasted bandwidth serving unused files

To restore an original:
```bash
cp original_images/product/image.jpg public/images/product/image.jpg
pnpm optimize:images --force  # Re-optimize
```
