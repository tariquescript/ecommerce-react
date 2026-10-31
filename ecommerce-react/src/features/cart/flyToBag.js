/**
 * Flies a copy of a product photo from the card into the header's bag.
 *
 * Two nested elements carry the motion: the outer moves horizontally with an
 * even ease, the inner vertically with a sharper one. Composed, that traces a
 * real curved arc — keyframing a single transform would only ever draw
 * straight lines between points. Everything runs on the Web Animations API,
 * so it is compositor-only (transform + opacity) and needs no library.
 *
 * Purely decorative: the cart update never waits on it.
 */
const DURATION = 720;

export function flyToBag(source, tint) {
  const target = document.querySelector('[data-bag-target]');
  const image = source?.querySelector('img');
  if (!image || !target || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const from = image.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  if (!from.width || !to.width) return;

  const size = Math.min(from.width, from.height, 132);
  const left = from.left + from.width / 2 - size / 2;
  const top = from.top + from.height / 2 - size / 2;
  const dx = to.left + to.width / 2 - (left + size / 2);
  const dy = to.top + to.height / 2 - (top + size / 2);

  const outer = document.createElement('div');
  outer.className = 'fly';
  outer.style.cssText = `left:${left}px;top:${top}px;width:${size}px;height:${size}px`;

  const inner = document.createElement('div');
  inner.className = 'fly__inner';
  inner.style.backgroundImage = `url("${image.currentSrc || image.src}")`;
  if (tint) inner.style.backgroundColor = tint;

  outer.append(inner);
  document.body.append(outer);

  outer.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${dx}px)` }], {
    duration: DURATION,
    easing: 'cubic-bezier(0.4, 0, 0.6, 1)',
    fill: 'forwards',
  });

  const flight = inner.animate(
    [
      { transform: 'translateY(0) scale(1) rotate(0deg)', borderRadius: '22%', opacity: 1 },
      { transform: `translateY(${dy * 0.35 - 40}px) scale(0.62) rotate(-10deg)`, borderRadius: '40%', opacity: 1, offset: 0.4 },
      { transform: `translateY(${dy}px) scale(0.14) rotate(14deg)`, borderRadius: '50%', opacity: 0.5 },
    ],
    { duration: DURATION, easing: 'cubic-bezier(0.3, 0.7, 0.4, 1)', fill: 'forwards' }
  );

  flight.finished
    .then(() => {
      target.animate(
        [
          { transform: 'scale(1)' },
          { transform: 'scale(1.16) rotate(-4deg)' },
          { transform: 'scale(0.94) rotate(2deg)' },
          { transform: 'scale(1)' },
        ],
        { duration: 460, easing: 'ease-out' }
      );
    })
    .catch(() => {})
    .finally(() => outer.remove());
}
