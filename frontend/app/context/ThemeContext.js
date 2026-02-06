'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import themeConfig from '../config/colors';

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
    setIsDark(shouldBeDark);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      
      // Apply CSS variables from config
      const colors = isDark ? themeConfig.dark : themeConfig.light;
      Object.entries(colors).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value);
      });
    }
  }, [isDark, mounted]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
};