// quick-queue/frontend/app/user/appointments/page.js

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { IoCalendarOutline, IoTimeOutline, IoPeopleOutline, IoArrowBack, IoCheckmarkCircle, IoCloseCircle, IoRefreshCircle, IoDownloadOutline, IoWarning } from "react-icons/io5";
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
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' or 'past'
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
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

  const isUpcoming = (appointment) => {
    if (!appointment.date) return false;
    
    const now = new Date();
    const appointmentDate = new Date(appointment.date);
    
    // If has end time, check if end time has passed
    if (appointment.endTime) {
      const [hours, minutes] = appointment.endTime.split(':');
      appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      return now < appointmentDate;
    }
    
    // Otherwise just check date
    appointmentDate.setHours(23, 59, 59, 999);
    return now < appointmentDate;
  };

  const upcomingAppointments = appointments.filter(isUpcoming);
  const pastAppointments = appointments.filter(app => !isUpcoming(app));

  const handleCancelClick = (appointment) => {
    // Check if appointment is within 1 hour
    if (appointment.date && appointment.startTime) {
      const now = new Date();
      const appointmentDate = new Date(appointment.date);
      const [hours, minutes] = appointment.startTime.split(':');
      appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const timeDiff = appointmentDate - now;
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      const minutesLeft = Math.floor(timeDiff / (1000 * 60));
      
      if (hoursDiff < 1) {
        if (minutesLeft <= 0) {
          toast.error("Cannot cancel appointment. The appointment time has already started or passed.");
        } else if (minutesLeft === 1) {
          toast.error("Cannot cancel appointment. Only 1 minute is left before the appointment starts.");
        } else {
          toast.error(`Cannot cancel appointment. Only ${minutesLeft} minutes left before the appointment starts.`);
        }
        return;
      }
    }
    
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };

  const handleCancelAppointment = async () => {
    try {
      await api.delete(`/queue/appointments/${selectedAppointment._id}`);
      toast.success("Appointment cancelled successfully");
      setShowCancelModal(false);
      setSelectedAppointment(null);
      fetchMyAppointments();
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast.error(error.response?.data?.message || "Failed to cancel appointment");
    }
  };

  const handleRebookClick = (appointment) => {
    // Navigate to dashboard to browse services
    router.push('/user/dashboard');
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

  const displayedAppointments = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;

  return (
    <div className={`min-h-screen ${theme.pageBg}`}>
      <Navbar />
      
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.push('/user/dashboard')}
            className={`p-2 ${theme.textAccent} rounded-lg transition-colors cursor-pointer outline-none ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-200'}`}
          >
            <IoArrowBack size={20} />
          </button>
          <h1 className={`text-3xl font-bold ${theme.textAccent} flex items-center gap-3 ml-2`}>
            <IoCalendarOutline size={32} />
            {t('navbar.myAppointments')}
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 outline-none cursor-pointer ${
              activeTab === 'upcoming'
                ? 'bg-gradient-to-r from-[#62109F] to-[#8C00FF] text-white shadow-lg'
                : `${theme.cardBg} ${theme.textSecondary} hover:opacity-80`
            }`}
          >
            Upcoming ({upcomingAppointments.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 outline-none cursor-pointer ${
              activeTab === 'past'
                ? 'bg-gradient-to-r from-[#62109F] to-[#8C00FF] text-white shadow-lg'
                : `${theme.cardBg} ${theme.textSecondary} hover:opacity-80`
            }`}
          >
            Past ({pastAppointments.length})
          </button>
        </div>

        {/* Cancellation Policy Notice for Upcoming Tab */}
        {activeTab === 'upcoming' && upcomingAppointments.length > 0 && (
          <div className={`mb-6 p-4 rounded-lg border-l-4 border-yellow-500 ${isDark ? 'bg-yellow-900/20' : 'bg-yellow-50'}`}>
            <div className="flex items-start gap-3">
              <IoWarning className="text-yellow-500 text-2xl flex-shrink-0 mt-0.5" />
              <div>
                <p className={`font-semibold ${theme.textPrimary} mb-1`}>Cancellation Policy</p>
                <p className={`text-sm ${theme.textSecondary}`}>
                  You can cancel your appointment anytime, but cancellations must be made at least 1 hour before your scheduled appointment time.
                </p>
              </div>
            </div>
          </div>
        )}

        {displayedAppointments.length === 0 ? (
          <div className={`text-center py-12 ${theme.cardBg} rounded-lg shadow-lg`}>
            <IoCalendarOutline size={64} className={`mx-auto ${theme.textMuted} mb-4`} />
            <h3 className={`text-xl font-semibold ${theme.textSecondary} mb-2`}>
              {activeTab === 'upcoming' ? 'No Upcoming Appointments' : 'No Past Appointments'}
            </h3>
            <p className={`${theme.textMuted} mb-4`}>
              {activeTab === 'upcoming' ? t('appointments.noAppointmentsDesc') : 'You have no past appointments yet.'}
            </p>
            {activeTab === 'upcoming' && (
              <button
                onClick={() => router.push('/user/dashboard')}
                className="px-4 py-2 bg-[#4D2FB2] text-white rounded-md hover:bg-[#62109F] transition-colors cursor-pointer outline-none"
              >
                {t('appointments.browseServices')}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedAppointments.map((appointment) => (
              <div
                key={appointment._id}
                >
                className={`${theme.cardBg} rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-6 border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}
                <div 
                  onClick={() => router.push(`/user/appointments/${appointment._id}`)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-semibold ${theme.textAccent}`}>
                      {appointment.queue?.title || appointment.service?.title || 'Service'}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
                      {t('appointments.booked')}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {appointment.date && (
                      <div className="flex items-center gap-3">
                        <IoCalendarOutline size={16} className={theme.textSecondary} />
                        <span className={`text-sm ${theme.textSecondary}`}>
                          {formatDate(appointment.date)}
                        </span>
                      </div>
                    )}
                    
                    {appointment.tokenNumber && (
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${theme.textAccent}`}>
                          Token #{appointment.tokenNumber}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          appointment.status === 'complete' ? 'bg-green-100 text-green-800' :
                          appointment.status === 'serving' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {appointment.status}
                        </span>
                      </div>
                    )}

                    {appointment.startTime && appointment.endTime && (
                      <div className="flex items-center gap-3">
                        <IoTimeOutline size={16} className={theme.textSecondary} />
                        <span className={`text-sm ${theme.textSecondary}`}>
                          {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <IoPeopleOutline size={16} className={theme.textSecondary} />
                      <span className={`text-sm ${theme.textSecondary}`}>
                        {appointment.groupSize} {t('appointments.people')}
                      </span>
                    </div>

                    {/* Payment Status */}
                    {appointment.paymentStatus && (
                      <div className="flex items-center gap-2 mt-3">
                        <IoCheckmarkCircle size={18} className="text-green-500" />
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          Payment: {appointment.paymentStatus === 'completed' ? 'Paid' : appointment.paymentStatus}
                        </span>
                      </div>
                    )}

                    {(appointment.queue?.organizer || appointment.service?.organizer) && (
                      <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
                        <p className={`text-xs ${theme.textMuted} mb-1`}>{t('appointments.organizer')}:</p>
                        <p className={`text-sm font-medium ${theme.textPrimary}`}>
                          {appointment.queue?.organizer?.name || appointment.service?.organizer?.name}
                        </p>
                      </div>
                    )}

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

                {/* Action Buttons */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => router.push(`/user/appointments/${appointment._id}`)}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-sm cursor-pointer outline-none flex items-center justify-center gap-2"
                  >
                    <IoDownloadOutline size={16} />
                    Invoice
                  </button>
                  
                  {activeTab === 'upcoming' && (
                    <>
                      <button
                        onClick={() => handleCancelClick(appointment)}
                        className="flex-1 px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-md hover:from-red-600 hover:to-red-700 transition-all duration-300 text-sm cursor-pointer outline-none flex items-center justify-center gap-2"
                      >
                        <IoCloseCircle size={16} />
                        Cancel
                      </button>
                    </>
                  )}
                  
                  {activeTab === 'past' && (
                    <button
                      onClick={() => handleRebookClick(appointment)}
                      className="flex-1 px-3 py-2 bg-gradient-to-r from-[#62109F] to-[#8C00FF] text-white rounded-md hover:from-[#8C00FF] hover:to-[#6F00FF] transition-all duration-300 text-sm cursor-pointer outline-none flex items-center justify-center gap-2"
                    >
                      <IoRefreshCircle size={16} />
                      Rebook
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && selectedAppointment && (
        <div className="fixed inset-0 backdrop-blur-lg flex items-center justify-center z-50">
          <div className={`${theme.cardBg} rounded-lg p-6 w-full max-w-md shadow-2xl`}>
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>
              Cancel Appointment
            </h3>
            <p className={`${theme.textSecondary} mb-6`}>
              Are you sure you want to cancel your appointment for <strong>{selectedAppointment.queue?.title || selectedAppointment.service?.title}</strong>?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedAppointment(null);
                }}
                className={`px-4 py-2 ${theme.textSecondary} border ${theme.border} rounded-md hover:opacity-80 transition-colors cursor-pointer outline-none`}
              >
                No, Keep It
              </button>
              <button
                onClick={handleCancelAppointment}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors cursor-pointer outline-none"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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