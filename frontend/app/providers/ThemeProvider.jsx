// quick-queue/frontend/app/proiders/ThemeProviders.jsx

"use client";

import { ThemeProvider as ContextThemeProvider } from "../context/ThemeContext";

export default function ThemeProvider({ children }) {
  return (
    <ContextThemeProvider>
      {children}
    </ContextThemeProvider>
  );
}
