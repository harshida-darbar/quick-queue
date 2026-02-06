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
    
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('theme');
    let shouldBeDark = false;
    
    if (savedTheme) {
      shouldBeDark = savedTheme === 'dark';
    } else {
      // Only check system preference if no saved theme
      shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    setIsDark(shouldBeDark);
  }, []);

  useEffect(() => {
    if (mounted) {
      console.log('ThemeContext useEffect - isDark:', isDark, 'mounted:', mounted);
      document.documentElement.classList.toggle('dark', isDark);
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      console.log('Applied classes:', document.documentElement.className);
    }
  }, [isDark, mounted]);

  const toggleTheme = () => {
    console.log('toggleTheme called - current isDark:', isDark, 'mounted:', mounted);
    if (mounted) {
      setIsDark(prev => {
        console.log('setIsDark - prev:', prev, 'new:', !prev);
        return !prev;
      });
    }
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
};