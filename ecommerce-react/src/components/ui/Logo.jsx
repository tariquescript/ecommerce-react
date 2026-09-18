/**
 * The TariqueScript monogram, redrawn from the original raster logo as three
 * vector paths — pixel-faithful, 1 KB inline, and it follows the theme.
 */
export function Logo({ compact = false, className = '' }) {
  return (
    <span className={`logo ${className}`} aria-label="TariqueScript — home">
      <svg
        className="logo__mark"
        viewBox="0 0 281 291"
        width="26"
        height="27"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M0 0h281v41H0z" />
        <path d="M162 58h119v43h-72v102l-47 29V58Z" />
        <path d="M0 58h146v203l-46 30V101H0V58Z" />
      </svg>
      {!compact && (
        <span className="logo__word">
          Tarique<span className="logo__word-accent">Script</span>
        </span>
      )}
    </span>
  );
}
