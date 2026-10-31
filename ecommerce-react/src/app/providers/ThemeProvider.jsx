import { useCallback, useEffect, useMemo, useState } from 'react';
import { ThemeContext } from './theme-context.js';

/** Versioned — see the bootstrap script in index.html for why. */
const STORAGE_KEY = 'ts-theme-v2';

/** Browser chrome follows the page: cobalt by day, deep ink by night. */
const CHROME = { light: '#2438f0', dark: '#0a0c24' };

/** Mirrors the inline bootstrap script in index.html, which runs before paint. */
function readInitialTheme() {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readInitialTheme);
  // Only persist once the visitor has actually chosen; until then the design's
  // own default (day) applies on every visit.
  const [chosen, setChosen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', CHROME[theme]);
    if (!chosen) return;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Private mode — the theme just won't persist.
    }
  }, [theme, chosen]);

  const toggle = useCallback(() => {
    setChosen(true);
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);
  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
