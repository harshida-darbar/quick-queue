"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import { FaHospital, FaUtensils, FaCut, FaBuilding } from "react-icons/fa";
import api from "../../../utils/api";
import Navbar from "../../../components/Navbar";
import { IoArrowBack } from "react-icons/io5";
import { useTheme } from "../../../context/ThemeContext";
import { getThemeClass } from "../../../config/colors";

export default function ServiceDetails({ params }) {
  const resolvedParams = use(params);
  const { isDark } = useTheme();
  const theme = getThemeClass(isDark);
  const { t } = useTranslation();
  const [service, setService] = useState(null);
  const [servingUsers, setServingUsers] = useState([]);
  const [waitingUsers, setWaitingUsers] = useState([]);
  const [userStatus, setUserStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchServiceDetails();
    fetchUserStatus();
  }, [resolvedParams.id]);

  const fetchServiceDetails = async () => {
    try {
      const response = await api.get(`/queue/services/${resolvedParams.id}`);
      setService(response.data.service);
      setServingUsers(response.data.servingUsers);
      setWaitingUsers(response.data.waitingUsers);
    } catch (error) {
      console.error("Error fetching service details:", error);
      toast.error("Failed to fetch service details");
    }
  };

  const fetchUserStatus = async () => {
    try {
      const response = await api.get(`/queue/services/${resolvedParams.id}/status`);
      setUserStatus(response.data);
    } catch (error) {
      setUserStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinQueue = async () => {
    setJoining(true);
    try {
      const response = await api.post(`/queue/services/${resolvedParams.id}/join`);
      
      if (response.data.status === 'serving') {
        toast.success(response.data.message);
      } else {
        toast.warning(response.data.message);
      }

      await fetchServiceDetails();
      await fetchUserStatus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error joining queue');
    } finally {
      setJoining(false);
    }
  };

  const getServiceIcon = (type) => {
    const iconProps = { size: 48, className: "text-[#62109F]" };
    switch (type) {
      case "hospital": return <FaHospital {...iconProps} />;
      case "restaurant": return <FaUtensils {...iconProps} />;
      case "salon": return <FaCut {...iconProps} />;
      default: return <FaBuilding {...iconProps} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "serving": return "bg-green-100 text-green-800 border-green-200";
      case "waiting": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "complete": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
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

  if (!service) {
    return (
      <div className={`min-h-screen ${theme.pageBg}`}>
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-xl text-red-600">{t('organizer.noServices')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.pageBg}`}>
      <Navbar />
      
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={() => router.back()}
          className={`mb-6 ${theme.textAccent} flex items-center font-medium outline-none`}
        >
          <IoArrowBack size={20} className="mr-1 cursor-pointer hover:bg-white hover:bg-opacity-20 rounded-lg"/> {t('organizer.backToDashboard')}
        </button>

        {/* Service Header */}
        <div className={`${theme.cardBg} rounded-lg shadow-lg p-6 mb-6`}>
          <div className="flex items-center mb-4">
            {getServiceIcon(service.serviceType)}
            <div className="ml-4">
              <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>{service.title}</h1>
              <p className={`text-lg ${theme.textSecondary} capitalize`}>{service.serviceType}</p>
            </div>
          </div>
          
          {service.photo && (
            <div className="relative w-full h-48 mb-4">
              <Image 
                src={service.photo} 
                alt={service.title}
                fill
                className="object-cover rounded-lg"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          )}
          
          <p className={`${theme.textSecondary} mb-6`}>{service.description}</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-gradient-to-br from-[#B7A3E3] to-[#C47BE4] rounded-lg">
              <div className="text-2xl font-bold text-white">{servingUsers.length}</div>
              <div className="text-sm text-white opacity-90">{t('dashboard.serving')}</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-[#85409D] to-[#C47BE4] rounded-lg">
              <div className="text-2xl font-bold text-white">{waitingUsers.length}</div>
              <div className="text-sm text-white opacity-90">{t('dashboard.waiting')}</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-[#4D2FB2] to-[#62109F] rounded-lg">
              <div className="text-2xl font-bold text-white">{service.maxCapacity}</div>
              <div className="text-sm text-white opacity-90">{t('organizer.maxCapacity')}</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-[#6F00FF] to-[#8C00FF] rounded-lg">
              <div className="text-2xl font-bold text-white">
                {servingUsers.length >= service.maxCapacity ? t('dashboard.full') : t('dashboard.available')}
              </div>
              <div className="text-sm text-white opacity-90">{t('organizer.status')}</div>
            </div>
          </div>

          {/* User Status */}
          {userStatus ? (
            <div className={`p-4 rounded-lg mb-6 border-2 ${getStatusColor(userStatus.status)}`}>
              <h3 className="font-semibold mb-2">{t('organizer.status')}</h3>
              <div className="flex justify-between items-center">
                <div>
                  <p>{t('organizer.token')}: <span className="font-bold">#{userStatus.tokenNumber}</span></p>
                  <p>{t('organizer.status')}: <span className="font-bold capitalize">{userStatus.status}</span></p>
                  {userStatus.status === 'waiting' && (
                    <p>{t('organizer.peopleServing')}: <span className="font-bold">{userStatus.waitingAhead}</span></p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <button
                onClick={handleJoinQueue}
                disabled={joining}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                  joining 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-[#4D2FB2] to-[#62109F] hover:from-[#62109F] hover:to-[#8C00FF] text-white shadow-lg'
                }`}
              >
                {joining ? t('forms.joining') : t('dashboard.joinQueue')}
              </button>
            </div>
          )}
        </div>

        {/* Currently Serving */}
        <div className={`${theme.cardBg} rounded-lg shadow-lg p-6 mb-6`}>
          <h2 className={`text-xl font-semibold ${theme.textPrimary} mb-4`}>{t('organizer.currentlyServing')}</h2>
          {servingUsers.length === 0 ? (
            <p className={theme.textMuted}>{t('organizer.noOneServing')}</p>
          ) : (
            <div className="space-y-2">
              {servingUsers.map((entry, index) => (
                <div key={entry._id} className={`flex justify-between items-center p-3 ${theme.statusSuccess} rounded-lg border`}>
                  <div>
                    <span className={`font-medium ${theme.textPrimary}`}>{t('organizer.token')} #{entry.tokenNumber}</span>
                    <span className={`${theme.textSecondary} ml-2`}>{entry.user?.name || t('organizer.unknownUser')}</span>
                  </div>
                  <span className="px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs">
                    {t('dashboard.serving')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Waiting List */}
        <div className={`${theme.cardBg} rounded-lg shadow-lg p-6`}>
          <h2 className={`text-xl font-semibold ${theme.textPrimary} mb-4`}>{t('organizer.waitingList')}</h2>
          {waitingUsers.length === 0 ? (
            <p className={theme.textMuted}>{t('organizer.noOneWaiting')}</p>
          ) : (
            <div className="space-y-2">
              {waitingUsers.map((entry, index) => (
                <div key={entry._id} className={`flex justify-between items-center p-3 ${theme.statusWarning} rounded-lg border`}>
                  <div>
                    <span className={`font-medium ${theme.textPrimary}`}>{t('organizer.token')} #{entry.tokenNumber}</span>
                    <span className={`${theme.textSecondary} ml-2`}>{entry.user?.name || t('organizer.unknownUser')}</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`text-sm ${theme.textMuted} mr-2`}>{t('organizer.position')}: {index + 1}</span>
                    <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs">
                      {t('dashboard.waiting')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
