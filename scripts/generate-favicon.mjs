import { readFileSync } from "node:fs";
import sharp from "sharp";

// Read the icon PNG
const iconBuffer = readFileSync("public/icon.png");

// Use the 32x32 version as favicon.ico
// (ICO format is complex, but modern browsers accept PNG with .ico extension)
await sharp(iconBuffer)
  .resize(32, 32)
  .toFormat("png")
  .toFile("public/favicon.ico");

console.log("✓ Generated favicon.ico");
