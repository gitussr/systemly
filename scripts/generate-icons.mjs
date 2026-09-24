// Generates the favicon and app icons from app-icon.png (the brand mark, transparent 512×512).
// The mark is placed on white so it stays visible on dark tab bars and home screens.
// Run: node scripts/generate-icons.mjs
import sharp from 'sharp';

const SOURCE = 'app-icon.png';
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

/**
 * @param size   output size in px
 * @param scale  share of the canvas the mark's height may use
 * @param radius corner radius as a share of the size (0 = square, for platforms that mask icons)
 */
async function icon(file, size, scale, radius = 0) {
  const inner = Math.round(size * scale);
  const mark = await sharp(SOURCE).trim().resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  let image = sharp({ create: { width: size, height: size, channels: 4, background: WHITE } }).composite([
    { input: mark, gravity: 'center' },
  ]);
  if (radius > 0) {
    const r = Math.round(size * radius);
    const mask = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" fill="#fff"/></svg>`,
    );
    image = sharp(await image.png().toBuffer()).composite([{ input: mask, blend: 'dest-in' }]);
  }
  await image.png({ compressionLevel: 9 }).toFile(file);
  console.log(`wrote ${file}`);
}

await icon('public/favicon-32.png', 32, 0.82, 0.18);
await icon('public/favicon-48.png', 48, 0.82, 0.18);
await icon('public/icons/icon-192.png', 192, 0.76, 0.18);
await icon('public/icons/icon-512.png', 512, 0.76, 0.18);
await icon('public/icons/icon-maskable-512.png', 512, 0.6);
await icon('public/icons/apple-touch-icon.png', 180, 0.72);
