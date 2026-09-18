import { createContext, useContext } from 'react';

/**
 * Context lives apart from the provider component so the provider module has
 * only component exports — that is what keeps React Fast Refresh working.
 */
export const ThemeContext = createContext(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
