import { flushSync } from 'react-dom';

const MARGIN = 240;

/** Names only the elements near the viewport — a tile far off screen gains nothing from morphing. */
function nameVisible(container) {
  const bottom = window.innerHeight + MARGIN;
  for (const el of container.querySelectorAll('[data-vt]')) {
    const rect = el.getBoundingClientRect();
    if (rect.bottom > -MARGIN && rect.top < bottom) el.style.viewTransitionName = el.dataset.vt;
  }
}

/**
 * Runs a React state update as a View Transition, so elements marked
 * `data-vt="unique-name"` glide from their old position to their new one —
 * filtering and re-sorting the grid becomes a layout animation for free.
 *
 * Names are applied only for the duration of the transition. Leaving 42 tiles
 * permanently named would make every route change snapshot them one by one.
 * The `vt-morph` class tells the CSS to hold the rest of the page still.
 *
 * Falls back to a plain update without the API or with reduced motion.
 */
export function morph(container, update) {
  if (
    !container ||
    typeof document.startViewTransition !== 'function' ||
    // A background tab paints no frames, so there is nothing to capture.
    document.visibilityState !== 'visible' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    update();
    return;
  }

  const root = document.documentElement;
  nameVisible(container);
  root.classList.add('vt-morph');

  const transition = document.startViewTransition(() => {
    flushSync(update);
    nameVisible(container);
  });

  transition.finished.finally(() => {
    root.classList.remove('vt-morph');
    for (const el of container.querySelectorAll('[data-vt]')) el.style.viewTransitionName = '';
  });
}
