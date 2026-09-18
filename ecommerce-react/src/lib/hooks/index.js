import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { observeReveal } from '../reveal.js';

export { useResource } from './useResource.js';

/** Trailing-edge debounce — keeps the search box from firing per keystroke. */
export function useDebouncedValue(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function useMediaQuery(query) {
  const subscribe = useCallback(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [query]
  );
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches
  );
  useEffect(() => subscribe(() => setMatches(window.matchMedia(query).matches)), [subscribe, query]);
  return matches;
}

export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');
export const useIsCoarsePointer = () => useMediaQuery('(pointer: coarse)');

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

/**
 * True once the browser has spare time — gates non-essential work
 * (the 3D scene) behind first paint.
 */
export function useIdle(delay = 1) {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    const schedule = window.requestIdleCallback ?? ((cb) => setTimeout(cb, 200));
    const cancel = window.cancelIdleCallback ?? clearTimeout;
    const handle = schedule(() => setIdle(true), { timeout: 2000 });
    return () => cancel(handle);
  }, [delay]);
  return idle;
}

/**
 * Should this device render the WebGL hero at all?
 * Bails on save-data, slow networks, reduced motion and low-core machines.
 */
export function useSupportsHeavyVisuals() {
  const reducedMotion = usePrefersReducedMotion();
  return useMemo(() => {
    if (reducedMotion) return false;
    if (typeof navigator === 'undefined') return false;
    const connection = navigator.connection;
    if (connection?.saveData) return false;
    if (connection?.effectiveType && /2g/.test(connection.effectiveType)) return false;
    if (typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency < 4) {
      return false;
    }
    return true;
  }, [reducedMotion]);
}
