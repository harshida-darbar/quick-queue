// quick-queue/frontend/app/admin/services/page.js

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  IoBusinessOutline,
  IoSearch,
  IoTrash,
  IoEye,
  IoFilter,
  IoClose,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoPeople,
  IoCash,
  IoStar,
  IoCalendar,
  IoDownload,
} from "react-icons/io5";
import api from "../../utils/api";
import Navbar from "../../components/Navbar";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useTheme } from "../../context/ThemeContext";
import { getThemeClass } from "../../config/colors";

function ServicesManagement() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const theme = getThemeClass(isDark);
  const router = useRouter();

  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedService, setSelectedService] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    filterServices();
  }, [services, searchTerm, statusFilter, typeFilter]);

  const fetchServices = async () => {
    try {
      const response = await api.get("/admin/services");
      const servicesData = Array.isArray(response.data) ? response.data : [];
      setServices(servicesData);
      setFilteredServices(servicesData);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Failed to fetch services");
      setServices([]);
      setFilteredServices([]);
    } finally {
      setLoading(false);
    }
  };

  const filterServices = () => {
    if (!Array.isArray(services)) {
      setFilteredServices([]);
      return;
    }

    let filtered = [...services];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((service) => service.status === statusFilter);
    }

    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter((service) => service.serviceType === typeFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (service) =>
          service.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.serviceType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.organizer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredServices(filtered);
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete) return;

    try {
      await api.delete(`/admin/services/${serviceToDelete._id}`);
      toast.success("Service deleted successfully");
      setShowDeleteModal(false);
      setServiceToDelete(null);
      fetchServices();
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error(error.response?.data?.message || "Failed to delete service");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
      paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      closed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return badges[status] || badges.inactive;
  };

  const getUniqueServiceTypes = () => {
    if (!Array.isArray(services)) return [];
    const types = [...new Set(services.map((s) => s.serviceType))];
    return types.filter(Boolean);
  };

  const exportToCSV = () => {
    if (!Array.isArray(filteredServices) || filteredServices.length === 0) {
      toast.error("No services to export");
      return;
    }

    const headers = [
      "Title",
      "Type",
      "Status",
      "Organizer",
      "Price",
      "Capacity",
      "Rating",
      "Total Bookings",
      "Created Date",
    ];
    const rows = filteredServices.map((service) => [
      service.title || "N/A",
      service.serviceType || "N/A",
      service.status || "N/A",
      service.organizer?.name || "Unknown",
      `₹${service.price || 0}`,
      `${service.currentCapacity || 0}/${service.maxCapacity || 0}`,
      service.averageRating?.toFixed(1) || "0.0",
      service.totalBookings || 0,
      new Date(service.createdAt).toLocaleDateString(),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `services_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Services exported successfully");
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
                  {t("admin.services")}
                </h1>
              </div>
              <p className={`${theme.textSecondary}`}>
                Manage all services created by organizers on the platform
              </p>
            </div>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 cursor-pointer outline-none flex items-center gap-2"
            >
              <IoDownload size={20} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`${theme.cardBg} rounded-lg shadow p-4 border ${theme.border}`}>
            <p className={`text-sm ${theme.textSecondary} mb-1`}>Total Services</p>
            <p className={`text-2xl font-bold ${theme.textAccent}`}>
              {Array.isArray(services) ? services.length : 0}
            </p>
          </div>
          <div className={`${theme.cardBg} rounded-lg shadow p-4 border ${theme.border}`}>
            <p className={`text-sm ${theme.textSecondary} mb-1`}>Active</p>
            <p className={`text-2xl font-bold text-green-600`}>
              {Array.isArray(services) ? services.filter((s) => s.status === "active").length : 0}
            </p>
          </div>
          <div className={`${theme.cardBg} rounded-lg shadow p-4 border ${theme.border}`}>
            <p className={`text-sm ${theme.textSecondary} mb-1`}>Paused</p>
            <p className={`text-2xl font-bold text-yellow-600`}>
              {Array.isArray(services) ? services.filter((s) => s.status === "paused").length : 0}
            </p>
          </div>
          <div className={`${theme.cardBg} rounded-lg shadow p-4 border ${theme.border}`}>
            <p className={`text-sm ${theme.textSecondary} mb-1`}>Closed</p>
            <p className={`text-2xl font-bold text-red-600`}>
              {Array.isArray(services) ? services.filter((s) => s.status === "closed").length : 0}
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className={`${theme.cardBg} rounded-lg shadow-lg p-6 mb-6 border ${theme.border}`}>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <IoSearch
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme.textSecondary}`}
                size={20}
              />
              <input
                type="text"
                placeholder="Search by title, type, or organizer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${theme.border} ${theme.inputBg} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <IoFilter size={20} className={theme.textSecondary} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${theme.border} ${theme.inputBg} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer`}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="closed">Closed</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${theme.border} ${theme.inputBg} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer`}
            >
              <option value="all">All Types</option>
              {getUniqueServiceTypes().map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <p className={`text-sm ${theme.textSecondary}`}>
              Showing {filteredServices.length} of {services.length} services
            </p>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className={`${theme.textSecondary}`}>No services found</p>
            </div>
          ) : (
            filteredServices.map((service) => (
              <div
                key={service._id}
                className={`${theme.cardBg} rounded-lg shadow-lg overflow-hidden border ${theme.border} hover:shadow-xl transition-shadow`}
              >
                {/* Service Image */}
                <div className="relative h-48 bg-gradient-to-br from-purple-500 to-purple-600">
                  {service.photoUrl ? (
                    <img
                      src={service.photoUrl}
                      alt={service.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.querySelector('.fallback-icon').style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="fallback-icon w-full h-full flex items-center justify-center" style={{ display: service.photoUrl ? 'none' : 'flex' }}>
                    <IoBusinessOutline size={64} className="text-white/50" />
                  </div>
                  <span
                    className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                      service.status
                    )}`}
                  >
                    {service.status?.charAt(0).toUpperCase() + service.status?.slice(1)}
                  </span>
                </div>

                {/* Service Info */}
                <div className="p-4">
                  <h3 className={`text-lg font-bold ${theme.textAccent} mb-2 truncate`}>
                    {service.title}
                  </h3>
                  <p className={`text-sm ${theme.textSecondary} mb-3 line-clamp-2`}>
                    {service.description || "No description"}
                  </p>

                  {/* Service Type */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded text-xs font-medium">
                      {service.serviceType}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <IoPeople size={16} className={theme.textSecondary} />
                      <span className={`text-sm ${theme.textPrimary}`}>
                        {service.currentCapacity || 0}/{service.maxCapacity}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IoCash size={16} className={theme.textSecondary} />
                      <span className={`text-sm ${theme.textPrimary}`}>₹{service.price}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IoStar size={16} className="text-yellow-500" />
                      <span className={`text-sm ${theme.textPrimary}`}>
                        {service.averageRating?.toFixed(1) || "0.0"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IoCalendar size={16} className={theme.textSecondary} />
                      <span className={`text-sm ${theme.textPrimary}`}>
                        {service.totalBookings || 0}
                      </span>
                    </div>
                  </div>

                  {/* Organizer */}
                  <div className={`text-xs ${theme.textSecondary} mb-4`}>
                    By: {service.organizer?.name || "Unknown"}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedService(service);
                        setShowDetailsModal(true);
                      }}
                      className="flex-1 px-3 py-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 transition-colors cursor-pointer outline-none text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <IoEye size={16} />
                      View
                    </button>
                    <button
                      onClick={() => {
                        setServiceToDelete(service);
                        setShowDeleteModal(true);
                      }}
                      className="flex-1 px-3 py-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 transition-colors cursor-pointer outline-none text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <IoTrash size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Service Details Modal */}
      {showDetailsModal && selectedService && (
        <div className="fixed inset-0 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div
            className={`${theme.cardBg} rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto`}
          >
            <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold">Service Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors cursor-pointer outline-none"
              >
                <IoClose size={24} />
              </button>
            </div>

            <div className="p-6">
              {/* Service Image */}
              {selectedService.photoUrl && (
                <img
                  src={selectedService.photoUrl}
                  alt={selectedService.title}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}

              {/* Title and Status */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className={`text-2xl font-bold ${theme.textAccent} mb-2`}>
                    {selectedService.title}
                  </h4>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                      selectedService.status
                    )}`}
                  >
                    {selectedService.status?.charAt(0).toUpperCase() +
                      selectedService.status?.slice(1)}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <p className={`text-sm ${theme.textSecondary} mb-1`}>Description</p>
                <p className={`${theme.textPrimary}`}>
                  {selectedService.description || "No description provided"}
                </p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className={`text-sm ${theme.textSecondary} mb-1`}>Service Type</p>
                  <p className={`font-medium ${theme.textPrimary}`}>
                    {selectedService.serviceType}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${theme.textSecondary} mb-1`}>Price</p>
                  <p className={`font-medium ${theme.textPrimary}`}>₹{selectedService.price}</p>
                </div>
                <div>
                  <p className={`text-sm ${theme.textSecondary} mb-1`}>Capacity</p>
                  <p className={`font-medium ${theme.textPrimary}`}>
                    {selectedService.currentCapacity || 0} / {selectedService.maxCapacity}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${theme.textSecondary} mb-1`}>Average Rating</p>
                  <p className={`font-medium ${theme.textPrimary}`}>
                    {selectedService.averageRating?.toFixed(1) || "0.0"} ⭐ (
                    {selectedService.totalReviews || 0} reviews)
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${theme.textSecondary} mb-1`}>Total Bookings</p>
                  <p className={`font-medium ${theme.textPrimary}`}>
                    {selectedService.totalBookings || 0}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${theme.textSecondary} mb-1`}>Location</p>
                  <p className={`font-medium ${theme.textPrimary}`}>
                    {selectedService.location || "Not specified"}
                  </p>
                </div>
              </div>

              {/* Organizer Info */}
              <div className={`border-t ${theme.border} pt-4`}>
                <p className={`text-sm ${theme.textSecondary} mb-2`}>Organizer Information</p>
                <div className="flex items-center gap-3">
                  <div>
                    <p className={`font-medium ${theme.textPrimary}`}>
                      {selectedService.organizer?.name || "Unknown"}
                    </p>
                    <p className={`text-sm ${theme.textSecondary}`}>
                      {selectedService.organizer?.email || "No email"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Appointment Booking Info */}
              {selectedService.appointmentBooking && (
                <div className={`border-t ${theme.border} pt-4 mt-4`}>
                  <p className={`text-sm ${theme.textSecondary} mb-2`}>Appointment Booking</p>
                  <div className="flex items-center gap-2">
                    <IoCheckmarkCircle size={20} className="text-green-600" />
                    <span className={`${theme.textPrimary}`}>Enabled</span>
                  </div>
                  {selectedService.availabilityWindows?.length > 0 && (
                    <div className="mt-2">
                      <p className={`text-xs ${theme.textSecondary} mb-1`}>
                        Availability Windows:
                      </p>
                      {selectedService.availabilityWindows.map((window, idx) => (
                        <p key={idx} className={`text-sm ${theme.textPrimary}`}>
                          {window.startTime} - {window.endTime}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && serviceToDelete && (
        <div className="fixed inset-0 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div className={`${theme.cardBg} rounded-lg shadow-2xl max-w-md w-full p-6`}>
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
                <IoTrash size={32} className="text-red-600 dark:text-red-200" />
              </div>
              <h3 className={`text-xl font-bold ${theme.textAccent} mb-2`}>Delete Service</h3>
              <p className={`${theme.textSecondary}`}>
                Are you sure you want to delete{" "}
                <span className="font-semibold">{serviceToDelete.title}</span>? This action cannot
                be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setServiceToDelete(null);
                }}
                className={`flex-1 px-4 py-2 rounded-lg border ${theme.border} ${theme.textPrimary} hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer outline-none`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteService}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer outline-none"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProtectedServicesManagement() {
  return (
    <ProtectedRoute allowedRoles={[1]}>
      <ServicesManagement />
    </ProtectedRoute>
  );
}
