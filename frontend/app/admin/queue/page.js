// quick-queue/frontend/app/admin/queue/page.js

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  IoBusinessOutline,
  IoSearch,
  IoPeople,
  IoTime,
  IoCheckmarkCircle,
  IoRefresh,
} from "react-icons/io5";
import api from "../../utils/api";
import Navbar from "../../components/Navbar";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useTheme } from "../../context/ThemeContext";
import { getThemeClass } from "../../config/colors";

function QueueManagement() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const theme = getThemeClass(isDark);
  const router = useRouter();

  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("serving"); // serving, waiting, completed

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (selectedService) {
      fetchQueueData(selectedService._id);
      // Auto-refresh every 10 seconds
      const interval = setInterval(() => {
        fetchQueueData(selectedService._id);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [selectedService]);

  const fetchServices = async () => {
    try {
      const response = await api.get("/admin/services");
      const servicesData = Array.isArray(response.data) ? response.data : [];
      setServices(servicesData);
      if (servicesData.length > 0) {
        setSelectedService(servicesData[0]);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Failed to fetch services");
    } finally {
      setLoading(false);
    }
  };

  const fetchQueueData = async (serviceId) => {
    try {
      const response = await api.get(`/queue/services/${serviceId}`);
      setQueueData(response.data);
    } catch (error) {
      console.error("Error fetching queue data:", error);
    }
  };

  const handleRefresh = () => {
    if (selectedService) {
      fetchQueueData(selectedService._id);
      toast.success("Queue data refreshed");
    }
  };

  const filteredServices = services.filter((service) =>
    service.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDisplayData = () => {
    if (!queueData) return [];
    switch (activeTab) {
      case "serving":
        return queueData.servingUsers || [];
      case "waiting":
        return queueData.waitingUsers || [];
      case "completed":
        return queueData.completedUsers || [];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme.pageBg}`}>
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className={`text-xl ${theme.textAccent}`}>{t("common.loading")}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.pageBg}`}>
      <Navbar />

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <IoBusinessOutline size={32} className="text-purple-600" />
                <h1 className={`text-3xl font-bold ${theme.textAccent}`}>
                  Live Queue Management
                </h1>
              </div>
              <p className={`${theme.textSecondary}`}>
                Monitor real-time queue status across all services
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 cursor-pointer outline-none flex items-center gap-2"
            >
              <IoRefresh size={20} />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Services List */}
          <div className={`lg:col-span-1 ${theme.cardBg} rounded-lg shadow-lg p-4 border ${theme.border} h-fit`}>
            <h3 className={`text-lg font-bold ${theme.textAccent} mb-4`}>Services</h3>
            
            {/* Search */}
            <div className="relative mb-4">
              <IoSearch
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme.textSecondary}`}
                size={16}
              />
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 rounded-lg border ${theme.border} ${theme.inputBg} ${theme.textPrimary} text-sm focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
            </div>

            {/* Services List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredServices.map((service) => (
                <div
                  key={service._id}
                  onClick={() => setSelectedService(service)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    selectedService?._id === service._id
                      ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white"
                      : `${theme.cardBg} hover:bg-gray-100 dark:hover:bg-gray-700`
                  }`}
                >
                  <p className={`text-sm font-semibold ${selectedService?._id === service._id ? "text-white" : theme.textPrimary}`}>
                    {service.title}
                  </p>
                  <p className={`text-xs ${selectedService?._id === service._id ? "text-white/80" : theme.textSecondary}`}>
                    {service.serviceType}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs ${selectedService?._id === service._id ? "text-white/90" : theme.textSecondary}`}>
                      {service.currentCapacity || 0}/{service.maxCapacity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Queue Details */}
          <div className="lg:col-span-3">
            {selectedService && queueData ? (
              <>
                {/* Service Info */}
                <div className={`${theme.cardBg} rounded-lg shadow-lg p-6 mb-6 border ${theme.border}`}>
                  <h2 className={`text-2xl font-bold ${theme.textAccent} mb-4`}>
                    {selectedService.title}
                  </h2>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className={`p-4 rounded-lg ${isDark ? "bg-blue-900/30" : "bg-blue-50"}`}>
                      <p className={`text-sm ${theme.textSecondary} mb-1`}>Currently Serving</p>
                      <p className={`text-2xl font-bold text-blue-600`}>
                        {queueData.servingCount || 0}
                      </p>
                      <p className={`text-xs ${theme.textSecondary}`}>
                        {queueData.service?.servingCapacity || 0}/{queueData.service?.maxCapacity || 0} capacity
                      </p>
                    </div>
                    <div className={`p-4 rounded-lg ${isDark ? "bg-yellow-900/30" : "bg-yellow-50"}`}>
                      <p className={`text-sm ${theme.textSecondary} mb-1`}>Waiting</p>
                      <p className={`text-2xl font-bold text-yellow-600`}>
                        {queueData.waitingCount || 0}
                      </p>
                    </div>
                    <div className={`p-4 rounded-lg ${isDark ? "bg-green-900/30" : "bg-green-50"}`}>
                      <p className={`text-sm ${theme.textSecondary} mb-1`}>Completed</p>
                      <p className={`text-2xl font-bold text-green-600`}>
                        {queueData.completedCount || 0}
                      </p>
                    </div>
                    <div className={`p-4 rounded-lg ${isDark ? "bg-purple-900/30" : "bg-purple-50"}`}>
                      <p className={`text-sm ${theme.textSecondary} mb-1`}>Status</p>
                      <p className={`text-lg font-bold ${queueData.isFull ? "text-red-600" : "text-green-600"}`}>
                        {queueData.isFull ? "Full" : "Available"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6">
                  <button
                    onClick={() => setActiveTab("serving")}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 outline-none cursor-pointer ${
                      activeTab === "serving"
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                        : `${theme.cardBg} ${theme.textSecondary} hover:opacity-80`
                    }`}
                  >
                    Serving ({queueData.servingCount || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab("waiting")}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 outline-none cursor-pointer ${
                      activeTab === "waiting"
                        ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg"
                        : `${theme.cardBg} ${theme.textSecondary} hover:opacity-80`
                    }`}
                  >
                    Waiting ({queueData.waitingCount || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab("completed")}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 outline-none cursor-pointer ${
                      activeTab === "completed"
                        ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg"
                        : `${theme.cardBg} ${theme.textSecondary} hover:opacity-80`
                    }`}
                  >
                    Completed ({queueData.completedCount || 0})
                  </button>
                </div>

                {/* Users List */}
                <div className={`${theme.cardBg} rounded-lg shadow-lg overflow-hidden border ${theme.border}`}>
                  {getDisplayData().length === 0 ? (
                    <div className="p-12 text-center">
                      <p className={`${theme.textSecondary}`}>
                        No users in {activeTab} status
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className={`${activeTab === "serving" ? "bg-blue-500" : activeTab === "waiting" ? "bg-yellow-500" : "bg-green-500"} text-white`}>
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Token</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold">User</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Group Size</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Members</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Payment</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {getDisplayData().map((entry) => (
                            <tr
                              key={entry._id}
                              className={`${theme.cardBg} hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors`}
                            >
                              <td className="px-6 py-4">
                                <span className={`text-lg font-bold ${theme.textAccent}`}>
                                  #{entry.tokenNumber}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <p className={`text-sm font-medium ${theme.textPrimary}`}>
                                  {entry.user?.name || "Unknown"}
                                </p>
                                <p className={`text-xs ${theme.textSecondary}`}>
                                  {entry.user?.email || "No email"}
                                </p>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <IoPeople size={16} className={theme.textSecondary} />
                                  <span className={`text-sm ${theme.textPrimary}`}>
                                    {entry.groupSize || 1}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1">
                                  {entry.memberNames?.slice(0, 3).map((name, idx) => (
                                    <span
                                      key={idx}
                                      className={`px-2 py-1 rounded text-xs ${isDark ? "bg-purple-900/30 text-purple-300" : "bg-purple-100 text-purple-800"}`}
                                    >
                                      {name}
                                    </span>
                                  ))}
                                  {entry.memberNames?.length > 3 && (
                                    <span className={`px-2 py-1 rounded text-xs ${theme.textSecondary}`}>
                                      +{entry.memberNames.length - 3}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  {entry.paymentStatus === "completed" ? (
                                    <>
                                      <IoCheckmarkCircle size={16} className="text-green-500" />
                                      <span className={`text-sm font-bold text-green-600`}>
                                        ₹{entry.paymentAmount || 0}
                                      </span>
                                    </>
                                  ) : (
                                    <span className={`text-sm ${theme.textSecondary}`}>
                                      Pending
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <IoTime size={16} className={theme.textSecondary} />
                                  <span className={`text-xs ${theme.textSecondary}`}>
                                    {new Date(entry.createdAt).toLocaleTimeString()}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className={`${theme.cardBg} rounded-lg shadow-lg p-12 text-center border ${theme.border}`}>
                <p className={`${theme.textSecondary}`}>Select a service to view queue details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProtectedQueueManagement() {
  return (
    <ProtectedRoute allowedRoles={[1]}>
      <QueueManagement />
    </ProtectedRoute>
  );
}
