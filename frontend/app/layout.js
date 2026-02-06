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
    <html lang="en" className="">
      <body>
        <ThemeProvider>
          <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 dark:from-[#2D1B69] dark:to-[#4C1D95] text-gray-900 dark:text-white">
            <AuthProvider>
              <LanguageProvider>
                {children}
                <ToastContainer position="top-center" autoClose={1000} />
              </LanguageProvider>
            </AuthProvider>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
