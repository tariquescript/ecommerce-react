/**
 * One button component, three visual ranks. Keeping variants in a single
 * component is what stops a design system drifting into fifteen button styles.
 */
export function Button({
  as: Tag = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  full = false,
  className = '',
  children,
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
      {...rest}
    >
      <span className="btn__label">{children}</span>
      {loading && <span className="btn__spinner" aria-hidden="true" />}
    </Tag>
  );
}
