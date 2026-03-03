// quick-queue/frontend/app/layout.js

"use client";

import "./globals.css";
import I18nProvider from "./providers/I18nProvider";
import ThemeProvider from "./providers/ThemeProvider";
import { AuthProvider } from "./context/Authcontext";
import { LanguageProvider } from "./context/LanguageContext";
import NotificationProvider from "@/components/notifications/NotificationProvider";
import FirebaseToken from "@/components/notifications/FirebaseToken";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "./context/Authcontext";
import Head from "next/head";

function LayoutContent({ children }) {
  const { user } = useAuth();
  
  console.log('👤 LayoutContent user:', user);
  console.log('👤 User ID being passed:', user?.id);
  
  return (
    <NotificationProvider userId={user?.id}>
      <FirebaseToken />
      <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 dark:from-[#2D1B69] dark:to-[#4C1D95] text-gray-900 dark:text-white">
        {children}
      </div>
      <ToastContainer position="top-center" autoClose={1000} />
    </NotificationProvider>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Quick Queue - Smart Queue Management</title>
        <meta name="description" content="Quick Queue - Efficient queue and appointment management system" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
      </head>
      <body>
        <ThemeProvider>
          <I18nProvider>
            <AuthProvider>
              <LanguageProvider>
                <LayoutContent>{children}</LayoutContent>
              </LanguageProvider>
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

