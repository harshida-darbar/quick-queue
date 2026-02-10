"use client";
import { useState, useContext } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../context/Authcontext";
import { useTheme } from "../context/ThemeContext";
import { getThemeClass } from "../config/colors";
import { DarkModeSwitch } from "react-toggle-dark-mode";
import NotificationBell from "@/components/notifications/NotificationBell";

export default function Navbar() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const theme = getThemeClass(isDark);

  const handleLogout = () => {
    logout();
    setShowLogoutModal(false);
    router.push("/login");
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  if (!user) return null;

  return (
    <>
      <nav className={`${theme.navbar} shadow-lg border-b ${theme.border}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-2 sm:space-x-3">
                {/* Logo */}
                <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#85409D] to-[#62109F] rounded-lg shadow-lg">
                  <svg
                    className="w-4 h-4 sm:w-6 sm:h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h1 className={`text-lg sm:text-2xl font-bold ${theme.textAccent}`}>
                  Quick
                  <span className={theme.textAccent}>
                    Queue
                  </span>
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Theme Toggle */}
              <DarkModeSwitch
                checked={isDark}
                onChange={toggleTheme}
                size={20}
                sunColor="#FCD34D"
                moonColor="#E5E7EB"
              />

              {/* Notification Bell - Only for users (role 3) */}
         

              {/* Language Dropdown - Hidden on small screens */}
              <div className="relative hidden sm:block">
                <button 
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  className={`flex items-center space-x-1 rounded-lg px-2 sm:px-3 py-1 transition-colors cursor-pointer outline-none ${
                    isDark 
                      ? 'bg-white/10 hover:bg-white/20' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  <span className={`text-xs sm:text-sm ${theme.textPrimary}`}>
                    {i18n.language === "hi" ? "हिंदी" : "EN"}
                  </span>
                  <svg
                    className={`w-3 h-3 ${theme.textPrimary}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {showLanguageDropdown && (
                  <div className={`absolute right-0 mt-2 w-32 ${theme.cardBg} rounded-md shadow-lg border ${theme.border} py-1 z-50 outline-none`}>
                    <button
                      onClick={() => {
                        i18n.changeLanguage("en");
                        setShowLanguageDropdown(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm cursor-pointer transition-colors outline-none ${
                        i18n.language === "en"
                          ? "bg-[#62109F] text-white outline-none"
                          : `${theme.textPrimary} hover:bg-[#B7A3E3] hover:text-white outline-none`
                      }`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => {
                        i18n.changeLanguage("hi");
                        setShowLanguageDropdown(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm cursor-pointer transition-colors outline-none ${
                        i18n.language === "hi"
                          ? "bg-[#62109F] text-white outline-none"
                          : `${theme.textPrimary} hover:bg-[#B7A3E3] hover:text-white outline-none`
                      }`}
                    >
                      हिंदी
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`flex items-center space-x-2 ${theme.textPrimary} hover:text-[#8B5CF6] transition-colors cursor-pointer outline-none`}
                >
                  {/* Mobile - Show avatar only */}
                  <div className="md:hidden">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-[#85409D] flex items-center justify-center">
                      {user.profileImage ? (
                        <img
                          src={`http://localhost:5000/api/profile/image/${user.profileImage}`}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium text-white">
                          {user.name?.charAt(0)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Desktop User Info */}
                  <div className="hidden md:flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-[#85409D] flex items-center justify-center">
                      {user.profileImage ? (
                        <img
                          src={`http://localhost:5000/api/profile/image/${user.profileImage}`}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium text-white">
                          {user.name?.charAt(0)}
                        </span>
                      )}
                    </div>
                    <span className="font-medium">{user.name}</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {showDropdown && (
                  <div className={`absolute right-0 mt-2 w-48 ${theme.cardBg} rounded-md shadow-lg border ${theme.border} py-1 z-50`}>
                    {/* Language options for mobile */}
                    <div className={`sm:hidden border-b ${theme.border} pb-2 mb-2`}>
                      <button
                        onClick={() => {
                          i18n.changeLanguage("en");
                          setShowDropdown(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                          i18n.language === "en"
                            ? "bg-[#62109F] text-white"
                            : `${theme.textPrimary} hover:bg-[#B7A3E3] hover:text-white`
                        }`}
                      >
                        English
                      </button>
                      <button
                        onClick={() => {
                          i18n.changeLanguage("hi");
                          setShowDropdown(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                          i18n.language === "hi"
                            ? "bg-[#62109F] text-white"
                            : `${theme.textPrimary} hover:bg-[#B7A3E3] hover:text-white`
                        }`}
                      >
                        हिंदी
                      </button>
                    </div>
                    {(user.role === 2 || user.role === 3) && (
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          router.push("/profile");
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm ${theme.textPrimary} hover:bg-[#B7A3E3] hover:text-white transition-colors cursor-pointer outline-none`}
                      >
                        {t("navbar.myProfile")}
                      </button>
                    )}
                    {user.role === 3 && (
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          router.push("/user/appointments");
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm ${theme.textPrimary} hover:bg-[#B7A3E3] hover:text-white transition-colors cursor-pointer outline-none`}
                      >
                        {t("navbar.myAppointments")}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        setShowLogoutModal(true);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm ${theme.textPrimary} hover:bg-[#B7A3E3] hover:text-white transition-colors cursor-pointer outline-none`}
                    >
                      {t("navbar.logout")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 backdrop-blur-lg flex items-center justify-center z-50">
          <div className={`${theme.cardBg} rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl border border-[#B7A3E3]`}>
            <h2 className={`text-xl font-bold ${theme.textAccent} mb-4`}>
              {t("navbar.confirmLogout")}
            </h2>
            <p className={`${theme.textSecondary} mb-6`}>
              {t("navbar.logoutMessage")}
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className={`px-4 py-2 ${theme.textSecondary} border ${theme.border} rounded-md hover:bg-gray-50 transition-colors cursor-pointer outline-none`}
              >
                {t("navbar.cancel")}
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-[#62109F] text-white rounded-md hover:bg-[#4D2FB2] transition-colors cursor-pointer outline-none"
              >
                {t("navbar.logout")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
