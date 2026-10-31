/**
 * Copies the font subsets the app serves out of node_modules and into
 * public/. Run after bumping either @fontsource-variable/funnel-* package.
 *
 *   node scripts/sync-fonts.mjs
 */
import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const FONTS = [
  ['funnel-display', 'funnel-display-latin-wght-normal.woff2', 'funnel-display-latin.woff2'],
  ['funnel-sans', 'funnel-sans-latin-wght-normal.woff2', 'funnel-sans-latin.woff2'],
];

for (const [pkg, file, target] of FONTS) {
  const from = path.join(root, `node_modules/@fontsource-variable/${pkg}/files/${file}`);
  const to = path.join(root, 'public/fonts', target);
  await mkdir(path.dirname(to), { recursive: true });
  await copyFile(from, to);
  console.log(`synced ${path.relative(root, to)}`);
}
