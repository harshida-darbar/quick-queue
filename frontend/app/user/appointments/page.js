"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { IoCalendarOutline, IoTimeOutline, IoPeopleOutline, IoArrowBack } from "react-icons/io5";
import api from "../../utils/api";
import Navbar from "../../components/Navbar";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useTheme } from "../../context/ThemeContext";
import { getThemeClass } from "../../config/colors";

function MyAppointments() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const theme = getThemeClass(isDark);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchMyAppointments();
  }, []);

  const fetchMyAppointments = async () => {
    try {
      const response = await api.get("/queue/my-appointments");
      setAppointments(response.data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to fetch appointments");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
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
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.back()}
            className={`mr-4 p-2 ${theme.textAccent} rounded-lg transition-colors cursor-pointer outline-none ${isDark ? 'hover:bg-slate-700' : 'hover:bg-white hover:bg-opacity-20'}`}
          >
            <IoArrowBack size={20} />
          </button>
          <h1 className={`text-3xl font-bold ${theme.textAccent} flex items-center gap-3`}>
            <IoCalendarOutline size={32} />
            {t('navbar.myAppointments')}
          </h1>
        </div>

        {appointments.length === 0 ? (
          <div className={`text-center py-12 ${theme.cardBg} rounded-lg shadow-lg`}>
            <IoCalendarOutline size={64} className={`mx-auto ${theme.textMuted} mb-4`} />
            <h3 className={`text-xl font-semibold ${theme.textSecondary} mb-2`}>{t('appointments.noAppointments')}</h3>
            <p className={`${theme.textMuted} mb-4`}>{t('appointments.noAppointmentsDesc')}</p>
            <button
              onClick={() => router.push('/user/dashboard')}
              className="px-4 py-2 bg-[#4D2FB2] text-white rounded-md hover:bg-[#62109F] transition-colors"
            >
              {t('appointments.browseServices')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {appointments.map((appointment) => (
              <div
                key={appointment._id}
                className={`${theme.cardBg} rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-6`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${theme.textAccent}`}>
                    {appointment.service.title}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
                    {t('appointments.booked')}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <IoCalendarOutline size={16} className={theme.textSecondary} />
                    <span className={`text-sm ${theme.textSecondary}`}>
                      {formatDate(appointment.date)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <IoTimeOutline size={16} className={theme.textSecondary} />
                    <span className={`text-sm ${theme.textSecondary}`}>
                      {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <IoPeopleOutline size={16} className={theme.textSecondary} />
                    <span className={`text-sm ${theme.textSecondary}`}>
                      {appointment.groupSize} {t('appointments.people')}
                    </span>
                  </div>

                  <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
                    <p className={`text-xs ${theme.textMuted} mb-1`}>{t('appointments.organizer')}:</p>
                    <p className={`text-sm font-medium ${theme.textPrimary}`}>
                      {appointment.service.organizer.name}
                    </p>
                  </div>

                  {appointment.memberNames && appointment.memberNames.length > 0 && (
                    <div className="mt-3">
                      <p className={`text-xs ${theme.textMuted} mb-2`}>{t('appointments.groupMembers')}:</p>
                      <div className="flex flex-wrap gap-1">
                        {appointment.memberNames.map((name, index) => (
                          <span
                            key={index}
                            className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-[#F0F9FF] text-[#0EA5E9]'}`}
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProtectedMyAppointments() {
  return (
    <ProtectedRoute allowedRoles={[3]}>
      <MyAppointments />
    </ProtectedRoute>
  );
}