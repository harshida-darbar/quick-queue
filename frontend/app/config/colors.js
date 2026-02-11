// quick-queue/frontend/app/config/colors.js

// Theme Configuration - Change colors here to update entire app
export const themeConfig = {
  light: {
    '--color-primary': '#4D2FB2',
    '--color-primary-hover': '#62109F',
    '--color-secondary': '#85409D',
    '--color-bg-from': '#E0E7FF',
    '--color-bg-to': '#C7D2FE',
    '--color-surface': '#FFFFFF',
    '--color-text': '#1F2937',
    '--color-text-secondary': '#6B7280',
    '--color-text-accent': '#62109F',
    '--color-border': '#E5E7EB',
  },
  dark: {
    '--color-primary': '#C47BE4',
    '--color-primary-hover': '#B7A3E3',
    '--color-secondary': '#8B5CF6',
    '--color-bg-from': '#2D1B69',
    '--color-bg-to': '#4C1D95',
    '--color-surface': '#1E293B',
    '--color-text': '#FFFFFF',
    '--color-text-secondary': '#D1D5DB',
    '--color-text-accent': '#C47BE4',
    '--color-border': '#4B5563',
  }
};

// Theme 
export const getThemeClass = (isDark) => ({
  // Page backgrounds
  pageBg: isDark 
    ? 'bg-gradient-to-br from-[#2D1B69] to-[#4C1D95]' 
    : 'bg-gradient-to-br from-[#A7AAE1] to-[#C5B0CD] min-h-screen',
    // : 'bg-gradient-to-br from-blue-50 to-indigo-100',
  
  // Card backgrounds
  cardBg: isDark ? 'bg-slate-800' : 'bg-white',
  
  // Text colors
  textPrimary: isDark ? 'text-white' : 'text-purple-900',
  textSecondary: isDark ? 'text-gray-300' : 'text-gray-600',
  textAccent: isDark ? 'text-purple-300' : 'text-[#62109F]',
  textMuted: isDark ? 'text-gray-400' : 'text-gray-500',
  
  // Borders
  border: isDark ? 'border-gray-600' : 'border-gray-200',
  
  // Buttons
  btnPrimary: 'bg-gradient-to-r from-[#4D2FB2] to-[#62109F] hover:from-[#62109F] hover:to-[#8C00FF] text-white',
  btnSecondary: 'bg-gradient-to-r from-[#85409D] to-[#C47BE4] hover:from-[#C47BE4] hover:to-[#B7A3E3] text-white',
  
  // Input fields
  input: isDark 
    ? 'bg-slate-700 text-white border-gray-600' 
    : 'bg-white text-gray-900 border-gray-300',
  
  // Navbar
  navbar: isDark 
    ? 'bg-gradient-to-r from-[#574964] to-[#4D2FB2]' 
    : 'bg-white',
  
  // Status
  statusSuccess: isDark 
    ? 'bg-green-900/30 text-green-200 border-green-700' 
    : 'bg-green-100 text-green-800 border-green-200',
  statusWarning: isDark 
    ? 'bg-yellow-900/30 text-yellow-200 border-yellow-700' 
    : 'bg-yellow-100 text-yellow-800 border-yellow-200',
  statusError: isDark 
    ? 'bg-red-900/30 text-red-200 border-red-700' 
    : 'bg-red-100 text-red-800 border-red-200',
});

export default themeConfig;
