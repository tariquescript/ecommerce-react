/**
 * Copies the single font subset the app serves out of node_modules and into
 * public/. Run after bumping @fontsource-variable/inter.
 *
 *   node scripts/sync-fonts.mjs
 */
import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const from = path.join(root, 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2');
const to = path.join(root, 'public/fonts/inter-var-latin.woff2');

await mkdir(path.dirname(to), { recursive: true });
await copyFile(from, to);
console.log(`synced ${path.relative(root, to)}`);
