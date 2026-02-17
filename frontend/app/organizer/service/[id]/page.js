// quick-queue/frontend/app/organizer/service/[id]/page.js

"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { FaHospital, FaUtensils, FaCut, FaBuilding } from "react-icons/fa";
import api from "../../../utils/api";
import Navbar from "../../../components/Navbar";
import { IoArrowBack } from "react-icons/io5";
import { useTheme } from "../../../context/ThemeContext";
import { getThemeClass } from "../../../config/colors";

export default function ServiceManagement({ params }) {
  const resolvedParams = use(params);
  const [service, setService] = useState(null);
  const [servingUsers, setServingUsers] = useState([]);
  const [waitingUsers, setWaitingUsers] = useState([]);
  const [completedUsers, setCompletedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const { t } = useTranslation();
  const router = useRouter();
  const { isDark } = useTheme();
  const theme = getThemeClass(isDark);
  

  useEffect(() => {
    fetchServiceDetails();
    const interval = setInterval(fetchServiceDetails, 5000);
    return () => clearInterval(interval);
  }, [resolvedParams.id]);

  const fetchServiceDetails = async () => {
    try {
      const response = await api.get(`/queue/services/${resolvedParams.id}`);
      console.log('Service data:', response.data.service);
      console.log('Serving capacity:', response.data.service.servingCapacity);
      setService(response.data.service);
      setServingUsers(response.data.servingUsers);
      setWaitingUsers(response.data.waitingUsers);
      setCompletedUsers(response.data.completedUsers || []);
    } catch (error) {
      console.error("Error fetching service details:", error);
      toast.error("Failed to fetch service details");
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToServing = async (entryId) => {
    try {
      await api.patch(`/queue/services/${resolvedParams.id}/serving`, {
        entryId,
      });
      toast.success("User moved to serving!");
      fetchServiceDetails();
    } catch (error) {
      console.error("Error moving to serving:", error);
      toast.error(
        error.response?.data?.message || "Error moving user to serving",
      );
    }
  };

  const handleMoveToWaiting = async (entryId) => {
    try {
      await api.patch(`/queue/services/${resolvedParams.id}/waiting`, {
        entryId,
      });
      toast.success("User moved to waiting!");
      fetchServiceDetails();
    } catch (error) {
      console.error("Error moving to waiting:", error);
      toast.error("Error moving user to waiting");
    }
  };

  const handleMarkComplete = async (entryId) => {
    const entry = servingUsers.find(u => u._id === entryId);
    setSelectedEntry(entry);
    setShowConfirmModal(true);
  };

  const confirmComplete = async () => {
    try {
      await api.patch(`/queue/services/${resolvedParams.id}/complete`, {
        entryId: selectedEntry._id,
      });
      toast.success("User marked as complete!");
      setShowConfirmModal(false);
      setSelectedEntry(null);
      fetchServiceDetails();
    } catch (error) {
      console.error("Error marking complete:", error);
      toast.error("Error marking user as complete");
    }
  };

  const getServiceIcon = (type) => {
    const iconProps = { size: 32, className: `text-[#62109F] ${theme.textPrimary}` };
    switch (type) {
      case "hospital":
        return <FaHospital {...iconProps} />;
      case "restaurant":
        return <FaUtensils {...iconProps} />;
      case "salon":
        return <FaCut {...iconProps} />;
      default:
        return <FaBuilding {...iconProps} />;
    }
  };

  if (loading) {
    return (
      <div className={theme.pageBg}>
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className={`text-xl ${theme.textPrimary}`}>
            Loading service management...
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className={theme.pageBg}>
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className={`text-xl ${theme.statusError}`}>Service not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className={theme.pageBg}>
      <Navbar />

      <div className="max-w-6xl mx-auto p-6">
        <button
          onClick={() => router.back()}
          className={`mb-6 flex items-center font-medium outline-none`}
        >
          <div className={`p-2 ${theme.textAccent} rounded-lg transition-colors cursor-pointer ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-200'}`}>
            <IoArrowBack size={20} />
          </div>
          <span className={`ml-2 ${theme.textAccent}`}>{t('organizer.backToDashboard')}</span>
        </button>

        {/* Service Header */}
        <div className={`${theme.cardBg} rounded-lg shadow-lg p-6 mb-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              {getServiceIcon(service.serviceType)}
              <div className="ml-4">
                <h1 className={`text-2xl font-bold ${theme.textPrimary}`}>
                  {service.title}
                </h1>
                <p className={`${theme.textSecondary} capitalize`}>
                  {service.serviceType}
                </p>
              </div>
            </div>
            <div
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                service.status === "active"
                  ? `bg-green-100 ${isDark ? 'bg-green-900/30' : ''} text-green-800 ${isDark ? 'text-green-300' : ''} capitalize`
                  : `bg-gray-100 ${isDark ? 'bg-gray-700' : ''} text-gray-800 ${isDark ? 'text-gray-300' : ''} capitalize`
              }`}
            >
              {t(`organizer.${service.status}`)}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gradient-to-br from-[#B7A3E3] to-[#C47BE4] rounded-lg">
              <div className="text-2xl font-bold text-white">
                {service.servingCapacity || 0}
              </div>
              <div className="text-sm text-white opacity-90">
                {t('organizer.peopleServing')}
              </div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-[#85409D] to-[#C47BE4] rounded-lg">
              <div className="text-2xl font-bold text-white">
                {waitingUsers.length}
              </div>
              <div className="text-sm text-white opacity-90">{t('organizer.groupsWaiting')}</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-[#4D2FB2] to-[#62109F] rounded-lg">
              <div className="text-2xl font-bold text-white">
                {service.maxCapacity}
              </div>
              <div className="text-sm text-white opacity-90">{t('organizer.maxCapacity')}</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-[#6F00FF] to-[#8C00FF] rounded-lg">
              <div className="text-2xl font-bold text-white">
                {service.maxCapacity - (service.servingCapacity || 0)}
              </div>
              <div className="text-sm text-white opacity-90">
                {t('organizer.availableSpots')}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Waiting List */}
          <div className={`${theme.cardBg} rounded-lg shadow-lg p-6`}>
            <h2 className={`text-xl font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
              <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
              {t('organizer.waitingList')} ({waitingUsers.length})
            </h2>

            {waitingUsers.length === 0 ? (
              <p className={`${theme.textMuted} text-center py-8`}>
                {t('organizer.noOneWaiting')}
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {waitingUsers.map((entry, index) => (
                  <div
                    key={entry._id}
                    className={`p-4 bg-yellow-50 ${isDark ? 'bg-yellow-900/20' : ''} rounded-lg border border-yellow-200 ${isDark ? 'border-yellow-700' : ''}`}
                  >
                    <div className="mb-3">
                      <div className={`font-semibold ${theme.textPrimary}`}>
                        {t('organizer.token')} #{entry.tokenNumber}
                      </div>
                      <div className={`text-sm ${theme.textSecondary}`}>
                        {entry.user?.name || 'Unknown User'}
                      </div>
                      <div className={`text-xs ${theme.textMuted}`}>
                        {t('organizer.position')}: {index + 1}
                      </div>
                      {entry.memberNames && entry.memberNames.length > 0 && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          {t('organizer.group')}: {entry.memberNames.join(", ")} (
                          {entry.groupSize} {t('organizer.people')})
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => handleMoveToServing(entry._id)}
                        disabled={(service.servingCapacity || 0) + entry.groupSize > service.maxCapacity}
                        className={`px-3 py-2 rounded-md transition-all duration-300 text-sm cursor-pointer outline-none ${
                          (service.servingCapacity || 0) + entry.groupSize > service.maxCapacity
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
                        }`}
                      >
                        {t('organizer.startServing')} ({entry.groupSize} {t('organizer.people')})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Currently Serving */}
          <div className={`${theme.cardBg} rounded-lg shadow-lg p-6`}>
            <h2 className={`text-xl font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              {t('organizer.currentlyServing')} ({service.servingCapacity || 0}/{service.maxCapacity} {t('organizer.people')})
            </h2>

            {servingUsers.length === 0 ? (
              <p className={`${theme.textMuted} text-center py-8`}>
                No one is currently being served
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {servingUsers.map((entry) => (
                  <div
                    key={entry._id}
                    className={`p-4 bg-green-50 ${isDark ? 'bg-green-900/20' : ''} rounded-lg border border-green-200 ${isDark ? 'border-green-700' : ''}`}
                  >
                    <div className="mb-3">
                      <div className={`font-semibold ${theme.textPrimary}`}>
                        {t('organizer.token')} #{entry.tokenNumber}
                      </div>
                      <div className={`text-sm ${theme.textSecondary}`}>
                        {entry.user?.name || 'Unknown User'}
                      </div>
                      <div className={`text-xs ${theme.textMuted}`}>
                        {entry.user?.email || 'No email'}
                      </div>
                      {entry.memberNames && entry.memberNames.length > 0 && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          {t('organizer.group')}: {entry.memberNames.join(", ")} (
                          {entry.groupSize} {t('organizer.people')})
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col space-y-2">
                      
                      <button
                        onClick={() => handleMarkComplete(entry._id)}
                        className="px-3 py-2 bg-gradient-to-r from-[#62109F] to-[#8C00FF] text-white rounded-md hover:from-[#8C00FF] hover:to-[#6F00FF] transition-all duration-300 text-sm  cursor-pointer outline-none"
                      >
                        {t('organizer.complete')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Users */}
          <div className={`${theme.cardBg} rounded-lg shadow-lg p-6`}>
            <h2 className={`text-xl font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
              {t('organizer.completed')} ({completedUsers.length})
            </h2>

            {completedUsers.length === 0 ? (
              <p className={`${theme.textMuted} text-center py-8`}>
                {t('organizer.noCompletedYet')}
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {completedUsers.map((entry) => (
                  <div
                    key={entry._id}
                    className={`p-4 bg-blue-50 ${isDark ? 'bg-blue-900/20' : ''} rounded-lg border border-blue-200 ${isDark ? 'border-blue-700' : ''}`}
                  >
                    <div>
                      <div className={`font-semibold ${theme.textPrimary}`}>
                        {t('organizer.token')} #{entry.tokenNumber}
                      </div>
                      <div className={`text-sm ${theme.textSecondary}`}>
                        {entry.user?.name || 'Unknown User'}
                      </div>
                      <div className={`text-xs ${theme.textMuted}`}>
                        {entry.user?.email || 'No email'}
                      </div>
                      {entry.memberNames && entry.memberNames.length > 0 && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          {t('organizer.complete')}: {entry.memberNames.join(", ")} (
                          {entry.groupSize} {t('organizer.people')})
                        </div>
                      )}
                      <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                        ✅ {t('organizer.completedAt')}{" "}
                        {new Date(entry.updatedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className={`mt-6 ${theme.cardBg} rounded-lg shadow-lg p-6`}>
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>
            {t('organizer.quickActions')}
          </h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className={theme.textSecondary}>
              <span className="font-medium">{t('organizer.totalPeople')}:</span>{" "}
              {(service.servingCapacity || 0) + waitingUsers.reduce((sum, user) => sum + user.groupSize, 0)} {t('organizer.people')}
            </div>
            <div className={theme.textSecondary}>
              <span className="font-medium">{t('organizer.capacityUsage')}:</span>{" "}
              {Math.round(((service.servingCapacity || 0) / service.maxCapacity) * 100)}%
            </div>
            <div className={theme.textSecondary}>
              <span className="font-medium">{t('organizer.status')}:</span>
              <span
                className={`ml-1 font-semibold ${
                  (service.servingCapacity || 0) >= service.maxCapacity
                    ? theme.statusError
                    : theme.statusSuccess
                }`}
              >
                {(service.servingCapacity || 0) >= service.maxCapacity
                  ? t('organizer.full')
                  : t('organizer.available')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedEntry && (
        <div className="fixed inset-0 backdrop-blur-lg flex items-center justify-center z-50">
          <div className={`${theme.cardBg} rounded-lg p-6 w-full max-w-md shadow-2xl`}>
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>
              {t('organizer.confirmCompletion')}
            </h3>
            <p className={`${theme.textSecondary} mb-6`}>
              {t('organizer.confirmCompletionMessage')} <strong>{selectedEntry.user?.name || 'Unknown User' }</strong> ({t('organizer.token')} #{selectedEntry.tokenNumber}) as complete?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedEntry(null);
                }}
                className={`px-4 py-2 ${theme.textSecondary} ${theme.border}border border-gray-300 hover:bg-gray-400 rounded-md hover:opacity-80 transition-colors cursor-pointer outline-none`}
              >
               {t('organizer.noCancel')}
              </button>
              <button
                onClick={confirmComplete}
                className="px-4 py-2 bg-[#62109F] text-white rounded-md hover:bg-[#8C00FF] transition-colors cursor-pointer outline-none"
              >
                {t('organizer.yesComplete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
