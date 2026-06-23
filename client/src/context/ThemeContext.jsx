import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { checkFeatureFlag } from '../api/client';

export const THEME_FLAG_KEY = 'theme_toggle';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'dark');
  const [themeToggleEnabled, setThemeToggleEnabled] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const checkThemeFlag = useCallback(async (orgId) => {
    if (!orgId) {
      setThemeToggleEnabled(false);
      return false;
    }
    try {
      const result = await checkFeatureFlag(orgId, THEME_FLAG_KEY);
      setThemeToggleEnabled(result.isEnabled);
      return result.isEnabled;
    } catch {
      setThemeToggleEnabled(false);
      return false;
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, themeToggleEnabled, checkThemeFlag }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
