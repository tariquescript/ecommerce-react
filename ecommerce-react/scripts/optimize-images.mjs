/**
 * Build-time image pipeline.
 *
 * Source photography ships as 720x720 JPEGs (~330 KB each). The grid renders them
 * at ~280 CSS px, so we emit a responsive AVIF/WebP ladder plus a JPEG fallback,
 * and inline a 16px blur placeholder so cards paint instantly on a cold cache.
 *
 *   node scripts/optimize-images.mjs [--force]
 */
import { mkdir, readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIR = path.join(root, 'art-source/products');
const LEGACY_DIR = path.join(root, 'public/images/products');
const OUT_DIR = path.join(root, 'public/media/products');
const MANIFEST = path.join(root, 'src/lib/images/manifest.json');

const WIDTHS = [240, 400, 720];
const FORCE = process.argv.includes('--force');

const ENCODERS = [
  ['avif', (p) => p.avif({ quality: 52, effort: 6, chromaSubsampling: '4:2:0' })],
  ['webp', (p) => p.webp({ quality: 74, effort: 6, smartSubsample: true })],
  ['jpg', (p) => p.jpeg({ quality: 76, progressive: true, mozjpeg: true })],
];

const bytes = (n) => `${(n / 1024).toFixed(0)} KB`;

async function resolveSources() {
  // Originals live in art-source/ (not deployed). First run migrates them out of public/.
  if (!existsSync(SOURCE_DIR) && existsSync(LEGACY_DIR)) {
    await mkdir(SOURCE_DIR, { recursive: true });
    const legacy = (await readdir(LEGACY_DIR)).filter((f) => /\.(jpe?g|png)$/i.test(f));
    for (const file of legacy) {
      await writeFile(path.join(SOURCE_DIR, file), await readFile(path.join(LEGACY_DIR, file)));
    }
    console.log(`→ migrated ${legacy.length} originals to art-source/products/`);
  }
  const files = (await readdir(SOURCE_DIR)).filter((f) => /\.(jpe?g|png)$/i.test(f));
  return files.sort();
}

async function main() {
  const files = await resolveSources();
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(path.dirname(MANIFEST), { recursive: true });

  const manifest = {};
  let sourceBytes = 0;
  let outputBytes = 0;

  for (const file of files) {
    const slug = file.replace(/\.(jpe?g|png)$/i, '');
    const src = path.join(SOURCE_DIR, file);
    sourceBytes += (await stat(src)).size;

    const input = sharp(src).rotate();
    const { width: srcWidth } = await input.metadata();

    for (const width of WIDTHS) {
      if (width > srcWidth) continue;
      for (const [ext, encode] of ENCODERS) {
        const out = path.join(OUT_DIR, `${slug}-${width}.${ext}`);
        if (FORCE || !existsSync(out)) {
          await encode(
            sharp(src).rotate().resize(width, width, { fit: 'cover', position: 'centre' })
          ).toFile(out);
        }
        outputBytes += (await stat(out)).size;
      }
    }

    // 16px blur placeholder, inlined into the manifest as a data URI.
    const lqip = await sharp(src).resize(16, 16, { fit: 'cover' }).webp({ quality: 28 }).toBuffer();
    // Average colour drives the card background before any bytes arrive.
    const { dominant } = await sharp(src).stats();
    const hex = `#${[dominant.r, dominant.g, dominant.b]
      .map((c) => c.toString(16).padStart(2, '0'))
      .join('')}`;

    manifest[slug] = {
      widths: WIDTHS.filter((w) => w <= srcWidth),
      color: hex,
      lqip: `data:image/webp;base64,${lqip.toString('base64')}`,
    };
  }

  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);

  const manifestSize = (await stat(MANIFEST)).size;
  console.log(`\n  images     ${files.length}`);
  console.log(`  source     ${bytes(sourceBytes)}`);
  console.log(`  generated  ${bytes(outputBytes)} across ${WIDTHS.length} widths x 3 formats`);
  console.log(`  manifest   ${bytes(manifestSize)}`);
  const perCard = outputBytes / files.length / WIDTHS.length / 3;
  console.log(`  ~${bytes(perCard)} per rendered card (avif @ 400w)\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
