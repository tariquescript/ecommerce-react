/**
 * Writes the build-time catalogue snapshot the storefront paints on its first
 * frame (see `seed()` in src/lib/api/client.js).
 *
 * The source is the API's own seed data, so the snapshot and the server agree
 * on every product id — and generating it needs no network access. Re-run it
 * whenever ecommerce-backend/defaultData/defaultProducts.js changes:
 *
 *   npm run catalog:snapshot
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.resolve(root, '../ecommerce-backend/defaultData/defaultProducts.js');
const target = path.join(root, 'src/lib/api/catalog.snapshot.json');

const { defaultProducts } = await import(pathToFileURL(source).href);

// Only the fields the storefront reads — no timestamps or internals.
const products = defaultProducts.map(({ id, image, name, rating, priceCents, keywords }) => ({
  id,
  image,
  name,
  rating,
  priceCents,
  keywords,
}));

await writeFile(target, `${JSON.stringify(products)}\n`);
console.log(`wrote ${products.length} products to ${path.relative(root, target)}`);
