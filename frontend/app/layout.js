// quick-queue/frontend/app/layout.js

"use client";

import "./globals.css";
import I18nProvider from "./providers/I18nProvider";
import ThemeProvider from "./providers/ThemeProvider";
import { AuthProvider } from "./context/Authcontext";
import { LanguageProvider } from "./context/LanguageContext";
import NotificationProvider from "@/components/notifications/NotificationProvider";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "./context/Authcontext";

function LayoutContent({ children }) {
  const { user } = useAuth();
  
  console.log('👤 LayoutContent user:', user);
  console.log('👤 User ID being passed:', user?.id);
  
  return (
    <NotificationProvider userId={user?.id}>
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

