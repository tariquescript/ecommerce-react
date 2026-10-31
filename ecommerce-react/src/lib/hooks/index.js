import { useEffect, useRef } from 'react';
import { observeReveal } from '../reveal.js';

export { useResource } from './useResource.js';

/** Adds `.is-visible` the first time an element scrolls into view. */
export function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const node = ref.current;
    return node ? observeReveal(node) : undefined;
  }, []);
  return ref;
}

/** Freezes the page behind a drawer/modal without the usual scrollbar jump. */
export function useLockBodyScroll(locked) {
  useEffect(() => {
    if (!locked) return undefined;
    const { overflow, paddingRight } = document.body.style;
    const gutter = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (gutter > 0) document.body.style.paddingRight = `${gutter}px`;
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, [locked]);
}

/** Esc-to-close, wired once per open overlay. */
export function useEscapeKey(onEscape, active = true) {
  useEffect(() => {
    if (!active) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onEscape();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onEscape, active]);
}
