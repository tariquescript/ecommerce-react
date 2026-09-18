/**
 * One IntersectionObserver for every entrance animation on the page.
 *
 * The grid can hold 42 cards; giving each its own observer would mean 42
 * observers competing for the same scroll. They all share this one instead.
 */
const REVEALED = 'is-visible';

let observer = null;

function reveal(element) {
  element.classList.add(REVEALED);
}

function getObserver() {
  if (observer) return observer;
  if (typeof IntersectionObserver === 'undefined') return null;

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        reveal(entry.target);
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -6% 0px', threshold: 0.04 }
  );

  return observer;
}

/**
 * @param {Element} element
 * @returns {() => void} cleanup
 */
export function observeReveal(element) {
  const io = getObserver();

  // No observer support, or the element is already on screen before layout
  // settles — either way it must never be left invisible.
  if (!io) {
    reveal(element);
    return () => {};
  }

  io.observe(element);
  return () => io.unobserve(element);
}
