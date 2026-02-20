// quick-queue/frontend/app/admin/layout.js
"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { 
  IoStatsChart, 
  IoPeople, 
  IoBusinessOutline, 
  IoCash, 
  IoStar,
  IoCalendarOutline,
  IoMenu,
  IoClose
} from "react-icons/io5";
import ProtectedRoute from "../components/ProtectedRoute";
import { useTheme } from "../context/ThemeContext";
import { getThemeClass } from "../config/colors";

export default function AdminLayout({ children }) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const theme = getThemeClass(isDark);
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    {
      name: t('admin.dashboard'),
      path: '/admin/dashboard',
      icon: IoStatsChart,
    },
    {
      name: t('admin.users'),
      path: '/admin/users',
      icon: IoPeople,
    },
    {
      name: t('admin.services'),
      path: '/admin/services',
      icon: IoBusinessOutline,
    },
    {
      name: 'Appointments',
      path: '/admin/appointments',
      icon: IoCalendarOutline,
    },
    {
      name: t('admin.payments'),
      path: '/admin/payments',
      icon: IoCash,
    },
    {
      name: t('admin.reviews'),
      path: '/admin/reviews',
      icon: IoStar,
    },
  ];

  const isActive = (path) => pathname === path;

  return (
    <ProtectedRoute allowedRoles={[1]}>
      <div className={`flex min-h-screen ${theme.pageBg}`}>
        
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg ${theme.cardBg} ${theme.textPrimary} cursor-pointer outline-none`}
        >
          {sidebarOpen ? <IoClose size={24} /> : <IoMenu size={24} />}
        </button>

        {/* Sidebar */}
        <aside className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          fixed md:static
          w-64 h-screen
          bg-gradient-to-b from-[#62109F] to-[#8C00FF]
          text-white
          p-6
          flex flex-col
          transition-transform duration-300
          z-40
          shadow-2xl
        `}>
          {/* Logo/Title */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Admin Panel</h2>
            <p className="text-sm text-purple-200">Quick Queue Management</p>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => {
                        router.push(item.path);
                        setSidebarOpen(false);
                      }}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-lg
                        transition-all duration-200 cursor-pointer outline-none
                        ${active 
                          ? 'bg-white text-[#62109F] shadow-lg font-semibold' 
                          : 'hover:bg-white/10 text-white'
                        }
                      `}
                    >
                      <Icon size={20} />
                      <span>{item.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer Info */}
          <div className="mt-auto pt-6 border-t border-white/20">
            <p className="text-xs text-purple-200 text-center">
              © 2026 Quick Queue
            </p>
            <p className="text-xs text-purple-300 text-center mt-1">
              Admin Panel v1.0
            </p>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="md:hidden fixed inset-0 bg-black/50 z-30"
          />
        )}

        {/* Main Content */}
        <main className="flex-1 md:ml-0 w-full">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
