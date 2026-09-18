import manifest from './manifest.json';

/**
 * The API returns legacy paths like "images/products/straw-sunhat.jpg".
 * The build pipeline emits an AVIF/WebP/JPEG ladder under /media/products,
 * so this maps one onto the other and hands back everything <picture> needs.
 */
const BASE = '/media/products';

export function resolveProductImage(src, { sizes = '(max-width: 640px) 45vw, 280px' } = {}) {
  const slug = src?.split('/').pop()?.replace(/\.(jpe?g|png)$/i, '') ?? '';
  const entry = manifest[slug];

  if (!entry) {
    // Unknown product (e.g. new API data) — fall back to the original asset.
    return { fallback: src, sources: [], sizes, color: 'var(--img-bg)', lqip: null };
  }

  const srcSet = (ext) => entry.widths.map((w) => `${BASE}/${slug}-${w}.${ext} ${w}w`).join(', ');

  return {
    sources: [
      { type: 'image/avif', srcSet: srcSet('avif') },
      { type: 'image/webp', srcSet: srcSet('webp') },
    ],
    fallback: `${BASE}/${slug}-400.jpg`,
    fallbackSrcSet: srcSet('jpg'),
    sizes,
    color: entry.color,
    lqip: entry.lqip,
  };
}

/** Used to <link rel="preload"> the first row of the grid. */
export function preloadCandidates(products, count = 4) {
  return products.slice(0, count).map((p) => resolveProductImage(p.image));
}
