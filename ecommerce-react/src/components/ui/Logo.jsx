/**
 * The TariqueScript monogram, redrawn from the original raster logo as three
 * vector paths — pixel-faithful, 1 KB inline, and it follows the theme. It
 * sits on a rounded "price sticker" chip, the storefront's recurring motif.
 */
export function Logo({ className = '' }) {
  return (
    <span className={`logo ${className}`}>
      <span className="logo__chip" aria-hidden="true">
        <svg className="logo__mark" viewBox="0 0 281 291" width="17" height="18" fill="currentColor">
          <path d="M0 0h281v41H0z" />
          <path d="M162 58h119v43h-72v102l-47 29V58Z" />
          <path d="M0 58h146v203l-46 30V101H0V58Z" />
        </svg>
      </span>
      <span className="logo__word">TariqueScript</span>
    </span>
  );
}
