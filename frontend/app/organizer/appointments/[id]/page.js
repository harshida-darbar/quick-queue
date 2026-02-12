// quick-queue/frontend/app/organizer/appointments/[id]/page.js

"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { FaArrowLeft, FaCalendarAlt, FaUsers, FaPhoneAlt, FaMapMarkerAlt } from "react-icons/fa";
import api from "../../../utils/api";
import Navbar from "../../../components/Navbar";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useTheme } from "../../../context/ThemeContext";
import { getThemeClass } from "../../../config/colors";

function AppointmentsPage() {
  const [service, setService] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const { isDark } = useTheme();
  const theme = getThemeClass(isDark);

  const serviceId = params.id;

  useEffect(() => {
    if (serviceId) {
      fetchServiceAndAppointments();
    }
  }, [serviceId]);

  const fetchServiceAndAppointments = async () => {
    try {
      // Fetch service details
      const serviceResponse = await api.get(`/queue/services/${serviceId}`);
      setService(serviceResponse.data.service);

      // Fetch service availability to get booked slots
      const availabilityResponse = await api.get(`/queue/services/${serviceId}/availability`);
      const { bookedSlots } = availabilityResponse.data;
      
      console.log('Raw booked slots:', bookedSlots);
      
      // Transform booked slots into appointments format with user data
      const appointmentsData = await Promise.all(
        bookedSlots.map(async (slot) => {
          console.log('Processing slot:', slot);
          
          let userName = 'Unknown User';
          let userProfileImage = slot.bookedUserProfileImage;
          
          // Always fetch user data from API since bookedUserName is just 'User'
          if (slot.bookedBy) {
            try {
              console.log('Fetching user data for ID:', slot.bookedBy);
              const userResponse = await api.get(`/queue/user/${slot.bookedBy}`);
              console.log('User response:', userResponse.data);
              userName = userResponse.data.name || 'Unknown User';
              userProfileImage = userResponse.data.profileImage;
            } catch (error) {
              console.error('Error fetching user data:', error);
            }
          }
          
          const appointmentData = {
            ...slot,
            id: slot._id,
            user: {
              id: slot.bookedBy,
              name: userName,
              profileImage: userProfileImage
            }
          };
          
          console.log('Final appointment data:', appointmentData);
          return appointmentData;
        })
      );

      console.log('All appointments data:', appointmentsData);
      setAppointments(appointmentsData);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to fetch appointments");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleUserClick = async (userId) => {
    try {
      const response = await api.get(`/queue/user/${userId}`);
      setSelectedUser(response.data);
      setShowUserModal(true);
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast.error("Failed to fetch user details");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'booked':
        return `bg-blue-100 ${isDark ? 'bg-blue-900/30' : ''} text-blue-800 ${isDark ? 'text-blue-300' : ''}`;
      case 'completed':
        return `bg-green-100 ${isDark ? 'bg-green-900/30' : ''} text-green-800 ${isDark ? 'text-green-300' : ''}`;
      case 'cancelled':
        return `bg-red-100 ${isDark ? 'bg-red-900/30' : ''} text-red-800 ${isDark ? 'text-red-300' : ''}`;
      default:
        return `bg-gray-100 ${isDark ? 'bg-gray-700' : ''} text-gray-800 ${isDark ? 'text-gray-300' : ''}`;
    }
  };

  if (loading) {
    return (
      <div className={theme.pageBg}>
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className={`text-xl ${theme.textPrimary}`}>{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={theme.pageBg}>
      <Navbar />

      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.back()}
            className={`mr-4 p-2 ${theme.textAccent} hover:opacity-80 rounded-lg transition-colors cursor-pointer outline-none`}
          >
            <FaArrowLeft size={20} />
          </button> 
          <div>
            <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>
             {t('organizer.appointmentsTitle')} - {service?.title}
            </h1>
            <p className={`${theme.textSecondary} capitalize`}>{service?.serviceType}</p>
          </div>
        </div>

        {/* Appointments Table */}
        {appointments.length === 0 ? (
          <div className={`text-center py-12 ${theme.cardBg} rounded-lg shadow-lg`}>
            <FaCalendarAlt size={48} className={`mx-auto ${theme.textMuted} mb-4`} />
            <h3 className={`text-xl font-semibold ${theme.textSecondary} mb-2`}>{t('organizer.noAppointmentsYet')}</h3>
            <p className={theme.textMuted}>{t('organizer.noAppointmentsDesc')}</p>
          </div>
        ) : (
          <div className={`${theme.cardBg} rounded-lg shadow-lg overflow-hidden`}>
            <div className="">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[#4D2FB2] to-[#62109F] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">{t('organizer.dateTime')}</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">{t('organizer.bookedBy')}</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">{t('organizer.group')}</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">{t('organizer.members')}</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">{t('organizer.status')}</th>
                  </tr>
                </thead>
                <tbody className="">
                  {appointments
                    .sort((a, b) => new Date(`${a.date}T${a.startTime}`) - new Date(`${b.date}T${b.startTime}`))
                    .map((appointment, index) => (
                      <tr key={appointment.id} className={`hover:bg-gray-50 ${isDark ? 'hover:bg-gray-700' : ''} ${index % 2 === 0 ? `${theme.cardBg}` : `bg-gray-25 ${isDark ? 'bg-slate-700' : ''}`}`}>
                        <td className="px-4 py-4">
                          <div>
                            <p className={`font-medium ${theme.textPrimary} text-sm`}>
                              {new Date(appointment.date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                            <p className={`text-sm ${theme.textSecondary}`}>
                              {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div 
                            className={`flex items-center cursor-pointer hover:bg-gray-100 ${isDark ? 'hover:bg-gray-600' : ''} p-2 rounded-lg transition-colors`}
                            onClick={() => handleUserClick(appointment.user.id)}
                          >
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-[#85409D] flex items-center justify-center mr-3">
                              {appointment.user.profileImage ? (
                                <img
                                  src={`http://localhost:5000/api/profile/image/${appointment.user.profileImage}`}
                                  alt="Profile"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-medium text-white">
                                  {appointment.user.name?.charAt(0)}
                                </span>
                              )}
                            </div>
                            <span className={`font-medium ${theme.textPrimary} text-sm`}>{appointment.user.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            <FaUsers className="text-[#85409D] dark:text-purple-400 mr-2 text-sm" />
                            <span className={`font-medium ${theme.textPrimary} text-sm`}>{appointment.groupSize} {t('organizer.people')}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1">
                            {appointment.memberNames.slice(0, 3).map((name, idx) => (
                              <span
                                key={idx}
                                className={`px-2 py-1 bg-[#F0F9FF] ${isDark ? 'bg-blue-900/30' : ''} text-[#0EA5E9] ${isDark ? 'text-blue-300' : ''} rounded text-xs font-medium`}
                              >
                                {name}
                              </span>
                            ))}
                            {appointment.memberNames.length > 3 && (
                              <span className={`px-2 py-1 bg-gray-100 ${isDark ? 'bg-gray-700' : ''} ${theme.textSecondary} rounded text-xs font-medium`}>
                                +{appointment.memberNames.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(appointment.status)}`}>
                            {t(`organizer.${appointment.status}`)}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary */}
        {appointments.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-[#4D2FB2] to-[#62109F] rounded-lg p-6 text-white">
            <h3 className="text-xl font-semibold mb-4">{t('organizer.appointmentsSummary')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{appointments.length}</p>
                <p className="text-sm opacity-90">{t('organizer.totalAppointments')}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {appointments.filter(apt => apt.status === 'booked').length}
                </p>
                <p className="text-sm opacity-90">{t('organizer.confirmed')}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {appointments.reduce((sum, apt) => sum + apt.groupSize, 0)}
                </p>
                <p className="text-sm opacity-90">{t('organizer.totalPeople')}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 backdrop-blur-lg flex items-center justify-center z-50">
          <div className={`${theme.cardBg} rounded-lg p-4 w-full max-w-sm mx-4 shadow-2xl ${theme.border}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-bold ${theme.textPrimary}`}>{t('organizer.userDetails')}</h2>
              <button
                onClick={() => setShowUserModal(false)}
                className={`${theme.textMuted} hover:opacity-80 text-xl font-bold outline-none cursor-pointer`}
              >
                ×
              </button>
            </div>
            
            <div className="flex flex-col items-center mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-[#85409D] flex items-center justify-center mb-3">
                {selectedUser.profileImage ? (
                  <img
                    src={`http://localhost:5000/api/profile/image/${selectedUser.profileImage}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold text-white">
                    {selectedUser.name?.charAt(0)}
                  </span>
                )}
              </div>
              
              <div className="text-center">
                <h3 className={`text-base font-semibold ${theme.textPrimary}`}>{selectedUser.name}</h3>
                <p className={`${theme.textSecondary} text-sm`}>{selectedUser.email}</p>
                <span className={`inline-block mt-1 px-2 py-1 bg-[#B7A3E3] ${isDark ? 'bg-purple-900/30' : ''} text-[#62109F] ${isDark ? 'text-purple-300' : ''} rounded-full text-xs font-medium`}>
                  {selectedUser.role === 2 ? t('organizer.organizer') : t('organizer.user')}
                </span>
              </div>
            </div>
            
            {/* Contact Information */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm">
                <FaPhoneAlt className="text-[#85409D] dark:text-purple-400 mr-2 w-3" />
                <span className={`${theme.textSecondary} min-w-[45px]`}>{t('organizer.phone')}:</span>
                <span className={`${theme.textPrimary} font-medium`}>{selectedUser.phone || t('organizer.notProvided')}</span>
              </div>
              <div className="flex items-center text-sm">
                <FaMapMarkerAlt className="text-[#85409D] dark:text-purple-400 mr-2 w-3" />
                <span className={`${theme.textSecondary} min-w-[45px]`}>{t('organizer.city')}:</span>
                <span className={`${theme.textPrimary} font-medium`}>{selectedUser.city || t('organizer.notProvided')}</span>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowUserModal(false)}
                className="px-3 py-1.5 bg-[#62109F] text-white rounded-md hover:bg-[#4D2FB2] transition-colors outline-none cursor-pointer text-sm"
              >
                {t('organizer.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProtectedAppointmentsPage() {
  return (
    <ProtectedRoute allowedRoles={[2]}>
      <AppointmentsPage />
    </ProtectedRoute>
  );
}