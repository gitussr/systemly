// Derives src/assets/logo-dark.png from src/assets/logo.png:
// neutral (charcoal) pixels become light text, the green dot is kept as-is.
// Run: node scripts/make-dark-logo.mjs
import sharp from 'sharp';

const LIGHT = [0xe6, 0xec, 0xef];
const { data, info } = await sharp('src/assets/logo.png').ensureAlpha().raw().toBuffer({ resolveWithObject: true });

for (let i = 0; i < data.length; i += 4) {
  const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
  const saturation = Math.max(r, g, b) - Math.min(r, g, b);
  if (saturation < 40) {
    data[i] = LIGHT[0];
    data[i + 1] = LIGHT[1];
    data[i + 2] = LIGHT[2];
  }
}

await sharp(data, { raw: info }).png().toFile('src/assets/logo-dark.png');
console.log('wrote src/assets/logo-dark.png');
