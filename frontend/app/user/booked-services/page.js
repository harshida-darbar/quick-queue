// quick-queue/frontend/app/user/booked-services/page.js

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { FaTicketAlt, FaCalendarAlt, FaClock, FaUsers, FaMapMarkerAlt } from "react-icons/fa";
import { IoArrowBack } from "react-icons/io5";
import api from "../../utils/api";
import Navbar from "../../components/Navbar";
import { useTheme } from "../../context/ThemeContext";
import { getThemeClass } from "../../config/colors";

export default function MyBookedServices() {
  const { isDark } = useTheme();
  const theme = getThemeClass(isDark);
  const { t } = useTranslation();
  const [queueEntries, setQueueEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchQueueEntries();
  }, []);

  const fetchQueueEntries = async () => {
    try {
      const response = await api.get("/queue/my-queue-entries");
      console.log("Queue entries:", response.data);
      setQueueEntries(response.data);
    } catch (error) {
      console.error("Error fetching queue entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTicket = (entry) => {
    router.push(`/user/booked-services/${entry._id}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "serving":
        return isDark ? "bg-green-900/30 text-green-300 border-green-700" : "bg-green-100 text-green-800 border-green-200";
      case "waiting":
        return isDark ? "bg-yellow-900/30 text-yellow-300 border-yellow-700" : "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "completed":
      case "complete":
        return isDark ? "bg-blue-900/30 text-blue-300 border-blue-700" : "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return isDark ? "bg-gray-700 text-gray-300 border-gray-600" : "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme.pageBg}`}>
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className={`text-xl ${theme.textAccent}`}>{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.pageBg}`}>
      <Navbar />
      
      <div className="max-w-6xl mx-auto p-6">
        <button
          onClick={() => router.push("/user/dashboard")}
          className={`mb-6 flex items-center font-medium outline-none`}
        >
          <div className={`p-2 ${theme.textAccent} rounded-lg transition-colors cursor-pointer ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-200'}`}>
            <IoArrowBack size={20} />
          </div>
          <span className={`ml-2 ${theme.textAccent}`}>{t('organizer.backToDashboard')}</span>
        </button>

        <div className="flex items-center gap-3 mb-6">
          <FaTicketAlt className={theme.textAccent} size={32} />
          <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>
            {t('navbar.myBookedServices')}
          </h1>
        </div>

        {queueEntries.length === 0 ? (
          <div className={`${theme.cardBg} rounded-lg shadow-lg p-12 text-center`}>
            <FaTicketAlt className={`mx-auto mb-4 ${theme.textMuted}`} size={64} />
            <p className={`text-xl ${theme.textMuted}`}>{t('appointments.noBookedServices')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {queueEntries.map((entry) => (
              <div
                key={entry._id}
                onClick={() => handleViewTicket(entry)}
                className={`${theme.cardBg} rounded-lg shadow-lg p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border ${theme.border}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${theme.textAccent}`}>
                    {entry.queue?.title || 'Service'}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(entry.status)}`}>
                    {entry.status}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FaTicketAlt className={theme.textMuted} size={16} />
                    <span className={`text-sm ${theme.textSecondary}`}>
                      {t('organizer.token')}: <span className="font-bold">#{entry.tokenNumber}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className={theme.textMuted} size={16} />
                    <span className={`text-sm ${theme.textSecondary}`}>
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <FaClock className={theme.textMuted} size={16} />
                    <span className={`text-sm ${theme.textSecondary}`}>
                      {new Date(entry.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <FaUsers className={theme.textMuted} size={16} />
                    <span className={`text-sm ${theme.textSecondary}`}>
                      {entry.groupSize} {entry.groupSize === 1 ? 'person' : 'people'}
                    </span>
                  </div>

                  {entry.queue?.address && (
                    <div className="flex items-start gap-2">
                      <FaMapMarkerAlt className={`${theme.textMuted} mt-1`} size={16} />
                      <span className={`text-sm ${theme.textSecondary}`}>
                        {entry.queue.address}
                      </span>
                    </div>
                  )}
                </div>

                <div className={`mt-4 pt-4 border-t ${theme.border} text-center`}>
                  <span className={`text-xs ${theme.textMuted}`}>
                    {t('appointments.clickToViewTicket')} →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
