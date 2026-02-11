import { readFileSync, writeFileSync } from "fs";
import sharp from "sharp";

// Read the icon PNG
const iconBuffer = readFileSync("public/icon.png");

// Generate multiple sizes for ICO (16x16, 32x32, 48x48)
const sizes = [16, 32, 48];
const images = await Promise.all(
  sizes.map((size) =>
    sharp(iconBuffer).resize(size, size).toFormat("png").toBuffer(),
  ),
);

// For now, just use the 32x32 version as favicon.ico
// (ICO format is complex, but modern browsers accept PNG with .ico extension)
await sharp(iconBuffer)
  .resize(32, 32)
  .toFormat("png")
  .toFile("public/favicon.ico");

console.log("✓ Generated favicon.ico");
