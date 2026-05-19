import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'funknime-theme';
const VALID_THEMES = ['dark', 'minimal', 'neobrutalism'];
const DEFAULT_THEME = 'dark';

const readInitialTheme = () => {
  try {
    const saved = typeof window !== 'undefined'
      ? window.localStorage.getItem(STORAGE_KEY)
      : null;
    if (saved && VALID_THEMES.includes(saved)) return saved;
  } catch {
    // localStorage may be unavailable (private mode)
  }
  return DEFAULT_THEME;
};

// Set <html data-theme> as early as possible to avoid flash
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-theme', readInitialTheme());
}

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(readInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage may be unavailable (private mode)
    }
  }, [theme]);

  const setTheme = (next) => {
    if (VALID_THEMES.includes(next)) setThemeState(next);
  };

  const value = { theme, setTheme, themes: VALID_THEMES };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
