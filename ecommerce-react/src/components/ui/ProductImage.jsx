import { useState } from 'react';
import { resolveProductImage } from '../../lib/images/resolve.js';

/**
 * Responsive product image.
 *
 * Serves AVIF → WebP → JPEG from a pre-built size ladder, paints the product's
 * dominant colour plus a 155-byte blur placeholder immediately, then cross-fades
 * the real file in. Width/height are always declared, so the grid never shifts.
 */
export function ProductImage({
  src,
  alt,
  sizes,
  priority = false,
  className = '',
  ...rest
}) {
  const [loaded, setLoaded] = useState(false);
  const image = resolveProductImage(src, sizes ? { sizes } : undefined);

  return (
    <span
      className={`product-image ${loaded ? 'is-loaded' : ''} ${className}`}
      style={{
        '--img-color': image.color,
        '--img-lqip': image.lqip ? `url("${image.lqip}")` : 'none',
      }}
    >
      <picture>
        {image.sources.map((source) => (
          <source key={source.type} type={source.type} srcSet={source.srcSet} sizes={image.sizes} />
        ))}
        <img
          src={image.fallback}
          srcSet={image.fallbackSrcSet}
          sizes={image.sizes}
          alt={alt}
          width={720}
          height={720}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding={priority ? 'sync' : 'async'}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
          {...rest}
        />
      </picture>
    </span>
  );
}
