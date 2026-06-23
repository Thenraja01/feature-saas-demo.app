// context/ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { checkFeatureFlag } from '../api/featureFlag.js';

export const THEME_FLAG_KEY = 'theme_toggle';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'dark';
  });

  const [themeToggleEnabled, setThemeToggleEnabled] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const checkThemeFlag = async (orgId) => {
    if (!orgId) {
      setThemeToggleEnabled(false);
      return;
    }
    try {
      const result = await checkFeatureFlag(orgId, THEME_FLAG_KEY);
      setThemeToggleEnabled(result.isEnabled || false);
    } catch (error) {
      console.error('Error checking theme flag:', error);
      setThemeToggleEnabled(false);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, checkThemeFlag, themeToggleEnabled }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
