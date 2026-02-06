'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme');
    const shouldBeDark = savedTheme === 'dark';
    console.log('Initial theme:', savedTheme, 'shouldBeDark:', shouldBeDark);
    setIsDark(shouldBeDark);
  }, []);

  useEffect(() => {
    if (mounted) {
      console.log('Applying theme - isDark:', isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
        console.log('Added dark class');
      } else {
        document.documentElement.classList.remove('dark');
        console.log('Removed dark class');
      }
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      console.log('HTML classes:', document.documentElement.className);
    }
  }, [isDark, mounted]);

  const toggleTheme = () => {
    console.log('Toggle called - current isDark:', isDark);
    setIsDark(prev => {
      console.log('Setting isDark from', prev, 'to', !prev);
      return !prev;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
};
