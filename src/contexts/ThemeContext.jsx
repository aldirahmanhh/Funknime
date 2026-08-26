import { createContext, useContext, useMemo } from 'react';

/**
 * MrFunk ships ONE signature dark theme (DESIGN.md §0).
 * The context is kept as a thin compatibility layer so any consumer
 * of useTheme() keeps working; setTheme is a documented no-op.
 */
const ThemeContext = createContext(null);

const STORAGE_KEY = 'funknime-theme';
const THEME = 'dark';

if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-theme', THEME);
}

export const ThemeProvider = ({ children }) => {
  const value = useMemo(
    () => ({
      theme: THEME,
      themes: [THEME],
      setTheme: () => {},
    }),
    []
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
