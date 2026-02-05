// quick-queue/frontend/app/layout.js
"use client";

import "../i18n";
import { AuthProvider } from "./context/Authcontext";
import { LanguageProvider } from "./context/LanguageContext";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-white">
        <AuthProvider>
          <LanguageProvider>
            {children}
            <ToastContainer position="top-center" autoClose={1000} />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
