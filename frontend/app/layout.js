// quick-queue/frontend/app/layout.js
"use client";

import "../i18n";
import { AuthProvider } from "./context/Authcontext";
import { LanguageProvider } from "./context/LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-[#B7A3E3] to-[#C5B0CD] dark:from-[#2D1B69] dark:to-[#4C1D95]">
        <ThemeProvider>
          <AuthProvider>
            <LanguageProvider>
              {children}
              <ToastContainer position="top-center" autoClose={1000} />
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
