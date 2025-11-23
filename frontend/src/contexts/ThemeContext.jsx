import { createContext, useContext, useEffect, useState } from 'react';
import logger from '@/utils/logger';

const ThemeContext = createContext({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Safety check for browser environment
    if (typeof window === 'undefined') {
      return 'light';
    }
    
    try {
      // Check localStorage first
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        return savedTheme;
      }
      // Check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (error) {
      // If localStorage or matchMedia fails, default to light
      logger.warn('ThemeProvider: Error accessing theme preferences:', error);
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    try {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      
      // Save to localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('theme', theme);
      }
    } catch (error) {
      logger.warn('ThemeProvider: Error applying theme:', error);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

