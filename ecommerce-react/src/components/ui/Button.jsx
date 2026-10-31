/**
 * One button component, four visual ranks. Keeping variants in a single
 * component is what stops a design system drifting into fifteen button styles.
 *
 * On hover a fill blooms out from the exact point the cursor entered, and
 * drains back toward where it left. The pointer position is written straight
 * to CSS custom properties — no React state, so no re-render per mouse move.
 */
function trackPointer(event) {
  const el = event.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty('--mx', `${event.clientX - rect.left}px`);
  el.style.setProperty('--my', `${event.clientY - rect.top}px`);
}

export function Button({
  as: Tag = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  full = false,
  className = '',
  children,
  onPointerEnter,
  onPointerLeave,
  ...rest
}) {
  return (
    <Tag
      className={[
        'btn',
        `btn--${variant}`,
        `btn--${size}`,
        full ? 'btn--full' : '',
        loading ? 'is-loading' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-busy={loading || undefined}
      onPointerEnter={(event) => {
        trackPointer(event);
        onPointerEnter?.(event);
      }}
      onPointerLeave={(event) => {
        trackPointer(event);
        onPointerLeave?.(event);
      }}
      {...rest}
    >
      <span className="btn__label">{children}</span>
      {loading && <span className="btn__spinner" aria-hidden="true" />}
    </Tag>
  );
}
