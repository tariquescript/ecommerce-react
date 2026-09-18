import { useCallback, useEffect, useMemo, useState } from 'react';
import { ThemeContext } from './theme-context.js';

const STORAGE_KEY = 'ts-theme';

/** Mirrors the inline bootstrap script in index.html, which runs before paint. */
function readInitialTheme() {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    // Keeps the browser chrome (address bar, overscroll) in step with the page.
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'light' ? '#fbfaf8' : '#08090b');
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Private mode — the theme just won't persist.
    }
  }, [theme]);

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);
  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
