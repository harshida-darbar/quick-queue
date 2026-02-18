// quick-queue/frontend/app/admin/components/StatsCard.js

"use client";
import { useTheme } from "../../context/ThemeContext";
import { getThemeClass } from "../../config/colors";

export default function StatsCard({ title, value, icon: Icon, color, subtitle }) {
  const { isDark } = useTheme();
  const theme = getThemeClass(isDark);

  const colorClasses = {
    purple: "from-purple-500 to-purple-600",
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    orange: "from-orange-500 to-orange-600",
    red: "from-red-500 to-red-600",
    pink: "from-pink-500 to-pink-600",
  };

  return (
    <div className={`${theme.cardBg} rounded-lg shadow-lg p-6 border ${theme.border}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-gradient-to-r ${colorClasses[color] || colorClasses.purple}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
      <h3 className={`text-sm font-medium ${theme.textSecondary} mb-1`}>{title}</h3>
      <p className={`text-3xl font-bold ${theme.textPrimary}`}>{value}</p>
      {subtitle && (
        <p className={`text-xs ${theme.textMuted} mt-2`}>{subtitle}</p>
      )}
    </div>
  );
}
