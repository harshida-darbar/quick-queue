// quick-queue/frontend/app/organizer/dashboard/page.js

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import { FaHospital, FaUtensils, FaCut, FaBuilding, FaEdit, FaTrash, FaTimes, FaMapMarkerAlt } from "react-icons/fa";
import InfiniteScroll from 'react-infinite-scroll-component';
import api from "../../utils/api";
import Navbar from "../../components/Navbar";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useTheme } from "../../context/ThemeContext";
import { getThemeClass } from "../../config/colors";

const validationSchema = Yup.object({
  title: Yup.string().required("Title is required"),
  description: Yup.string().required("Description is required"),
  serviceType: Yup.string().required("Service type is required"),
  photo: Yup.string().url("Must be a valid URL"),
  address: Yup.string(),
  maxCapacity: Yup.number()
    .min(1, "Capacity must be at least 1")
    .required("Max capacity is required"),
  price: Yup.number()
    .min(0, "Price cannot be negative")
    .required("Price is required"),
  appointmentEnabled: Yup.boolean(),
});

function OrganizerDashboard() {
  const [services, setServices] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [availabilityWindows, setAvailabilityWindows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const servicesPerPage = 6;
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const theme = getThemeClass(isDark);
  const router = useRouter();

  const todayLocal = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const editFormik = useFormik({
    initialValues: {
      title: "",
      description: "",
      serviceType: "",
      photo: "",
      address: "",
      maxCapacity: 1,
      price: 0,
      appointmentEnabled: false,
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const serviceData = {
          ...values,
          availabilityWindows: values.appointmentEnabled ? availabilityWindows : []
        };
        await api.put(`/queue/services/${editingService._id}`, serviceData);
        toast.success("Service updated successfully!");
        setShowEditForm(false);
        setEditingService(null);
        setAvailabilityWindows([]);
        fetchServices(true);
      } catch (error) {
        console.error("Error updating service:", error);
        toast.error("Failed to update service");
      } finally {
        setSubmitting(false);
      }
    },
  });
  const formik = useFormik({
    initialValues: {
      title: "",
      description: "",
      serviceType: "",
      photo: "",
      address: "",
      maxCapacity: 1,
      price: 0,
      appointmentEnabled: false,
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const serviceData = {
          ...values,
          availabilityWindows: values.appointmentEnabled ? availabilityWindows : []
        };
        await api.post("/queue/services", serviceData);
        toast.success("Service created successfully!");
        setShowCreateForm(false);
        resetForm();
        setAvailabilityWindows([]);
        fetchServices();
      } catch (error) {
        console.error("Error creating service:", error);
        toast.error("Failed to create service");
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    fetchServices(true);
  }, []);

  const fetchServices = async (reset = false) => {
    if (!reset && loadingMore) return;
    
    try {
      if (!reset) setLoadingMore(true);
      
      const pageToFetch = reset ? 1 : currentPage;
      const params = new URLSearchParams();
      params.append('page', pageToFetch.toString());
      params.append('limit', servicesPerPage.toString());
      
      const response = await api.get(`/queue/my-services?${params.toString()}`);
      
      let fetchedServices, pages;
      if (Array.isArray(response.data)) {
        fetchedServices = response.data;
        pages = 1;
      } else {
        fetchedServices = response.data.services || [];
        pages = response.data.totalPages || 1;
      }
      
      if (reset) {
        setServices(fetchedServices);
        setCurrentPage(2);
      } else {
        setServices(prev => [...prev, ...fetchedServices]);
        setCurrentPage(prev => prev + 1);
      }
      
      setHasMore(pageToFetch < pages);
    } catch (error) {
      if (error.response?.status === 401) {
        router.push("/login");
        return;
      }
      console.error("Error fetching services:", error);
      toast.error("Failed to fetch services");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchMoreServices = () => {
    if (hasMore && !loadingMore) {
      fetchServices();
    }
  };

  const handleStartService = async (serviceId) => {
    try {
      await api.patch(`/queue/services/${serviceId}/start`);
      toast.success("Service started successfully!");
      fetchServices();
    } catch (error) {
      console.error("Error starting service:", error);
      toast.error("Failed to start service");
    }
  };

  const handleDeleteService = async () => {
    try {
      await api.delete(`/queue/services/${serviceToDelete._id}`);
      toast.success("Service deleted successfully!");
      setShowDeleteModal(false);
      setServiceToDelete(null);
      fetchServices(true);
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Failed to delete service");
    }
  };

  const openEditModal = (service) => {
    setEditingService(service);
    editFormik.setValues({
      title: service.title,
      description: service.description,
      serviceType: service.serviceType,
      photo: service.photo || "",
      address: service.address || "",
      maxCapacity: service.maxCapacity,
      price: service.price || 0,
      appointmentEnabled: service.appointmentEnabled || false,
    });
    setAvailabilityWindows(service.availabilityWindows || []);
    setShowEditForm(true);
  };

  const openDeleteModal = (service) => {
    setServiceToDelete(service);
    setShowDeleteModal(true);
  };

  const getServiceIcon = (type) => {
    const iconProps = { size: 32, className: theme.textAccent };
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

  const getButtonText = (service) => {
    const serviceType = service.serviceType.toLowerCase();
    const buttonMapping = {
      hospital: "manageAppointments",
      clinic: "manageAppointments",
      doctor: "manageAppointments",
      restaurant: "manageTables",
      cafe: "manageTables",
      salon: "manageSlots",
      spa: "manageSlots",
      gym: "manageSessions",
      bank: "manageTokens",
      atm: "manageTokens",
      library: "manageSeats",
      cinema: "manageTickets",
      theater: "manageTickets",
      carwash: "manageServices",
      mechanic: "manageServices",
      dentist: "manageAppointments",
      pharmacy: "manageQueue"
    };
    
    const translationKey = buttonMapping[serviceType] || "manageQueue";
    return t(`organizer.${translationKey}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "closed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    return t(`organizer.${status}`);
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
        <div className="flex justify-between items-center mb-8">
          <h1 className={`text-3xl font-bold ${theme.textAccent}`}>{t('dashboard.myServices')}</h1>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-[#4D2FB2] to-[#62109F] text-white px-6 py-2 rounded-lg hover:from-[#62109F] hover:to-[#8C00FF] transition-all duration-300 shadow-lg cursor-pointer outline-none"
          >
            {t('dashboard.createNewService')}
          </button>
        </div>

        {/* Create Service Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
            <div className={`${theme.cardBg} rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto`}>
              <h2 className={`text-xl font-bold mb-4 ${theme.textAccent}`}>
                {t('organizer.createNewService')}
              </h2>
              <form onSubmit={formik.handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>
                      {t('organizer.serviceTitle')}
                    </label>
                    <input
                      name="title"
                      type="text"
                      value={formik.values.title}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-3 py-2 border ${theme.border} rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2] ${theme.input}`}
                    />
                    {formik.touched.title && formik.errors.title && (
                      <div className="text-red-500 text-sm mt-1">
                        {formik.errors.title}
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>
                      {t('organizer.serviceType')}
                    </label>
                    <input
                      name="serviceType"
                      type="text"
                      placeholder={t('organizer.serviceTypePlaceholder')}
                      value={formik.values.serviceType}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-3 py-2 border ${theme.border} rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2] ${theme.input}`}
                    />
                    {formik.touched.serviceType && formik.errors.serviceType && (
                      <div className="text-red-500 text-sm mt-1">
                        {formik.errors.serviceType}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>
                    {t('organizer.description')}
                  </label>
                  <textarea
                    name="description"
                    rows="2"
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full px-3 py-2 border ${theme.border} rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2] ${theme.input}`}
                  />
                  {formik.touched.description && formik.errors.description && (
                    <div className="text-red-500 text-sm mt-1">
                      {formik.errors.description}
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>
                    Address
                  </label>
                  <textarea
                    name="address"
                    rows="2"
                    value={formik.values.address}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full px-3 py-2 border ${theme.border} rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2] ${theme.input}`}
                  />
                  {formik.touched.address && formik.errors.address && (
                    <div className="text-red-500 text-sm mt-1">
                      {formik.errors.address}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>
                      {t('organizer.photoUrl')}
                    </label>
                    <input
                      name="photo"
                      type="url"
                      value={formik.values.photo}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-3 py-2 border ${theme.border} rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2] ${theme.input}`}
                    />
                    {formik.touched.photo && formik.errors.photo && (
                      <div className="text-red-500 text-sm mt-1">
                        {formik.errors.photo}
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>
                      {t('organizer.maxCapacityLabel')}
                    </label>
                    <input
                      name="maxCapacity"
                      type="number"
                      min="1"
                      value={formik.values.maxCapacity}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-3 py-2 border ${theme.border} rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2] ${theme.input}`}
                    />
                    {formik.touched.maxCapacity && formik.errors.maxCapacity && (
                      <div className="text-red-500 text-sm mt-1">
                        {formik.errors.maxCapacity}
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>
                      Price (₹)
                    </label>
                    <input
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formik.values.price}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-3 py-2 border ${theme.border} rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2] ${theme.input}`}
                      placeholder="Enter price"
                    />
                    {formik.touched.price && formik.errors.price && (
                      <div className="text-red-500 text-sm mt-1">
                        {formik.errors.price}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="flex items-center space-x-2">
                    <input
                      name="appointmentEnabled"
                      type="checkbox"
                      checked={formik.values.appointmentEnabled}
                      onChange={formik.handleChange}
                      className="w-4 h-4 text-[#4D2FB2] border-gray-300 rounded focus:ring-[#4D2FB2]"
                    />
                    <span className={`text-sm font-medium ${theme.textPrimary}`}>
                      {t('organizer.enableAppointmentBooking')}
                    </span>
                  </label>
                  <p className={`text-xs ${theme.textMuted} mt-1`}>
                    {t('organizer.appointmentBookingDesc')}
                  </p>
                </div>

                {/* Availability Windows Section */}
                {formik.values.appointmentEnabled && (
                  <div className={`mb-6 p-4 border ${theme.border} rounded-lg`}>
                    <h4 className={`text-sm font-medium ${theme.textPrimary} mb-3`}>
                      {t('organizer.availabilityWindows')}
                    </h4>
                    <p className={`text-xs ${theme.textMuted} mb-3`}>
                      {t('organizer.availabilityDesc')}
                    </p>
                    
                    {availabilityWindows.length === 0 ? (
                      <p className={`text-xs ${theme.textMuted} mb-3`}>{t('organizer.noAvailabilityWindows')}</p>
                    ) : (
                      <div className="space-y-2 mb-3">
                        {availabilityWindows.map((window, index) => (
                          <div key={index} className={`flex items-center justify-between p-2 rounded ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
                            <span className={`text-sm ${theme.textPrimary}`}>
                              {window.date} | {window.startTime} - {window.endTime}
                            </span>
                            <button
                              type="button"
                              onClick={() => setAvailabilityWindows(availabilityWindows.filter((_, i) => i !== index))}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              {t('organizer.remove')}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 gap-2 mb-2">
                      <input
                        type="date"
                        id="windowDate"
                        min={todayLocal}
                        className={`px-2 py-1 border ${theme.border} rounded text-xs ${theme.input} [color-scheme:light] dark:[color-scheme:dark]`}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="time"
                        placeholder={t('organizer.startTime')}
                        id="windowStartTime"
                        className={`px-2 py-1 border ${theme.border} rounded text-xs ${theme.input} [color-scheme:light] dark:[color-scheme:dark]`}
                      />
                      <input
                        type="time"
                        placeholder={t('organizer.endTime')}
                        id="windowEndTime"
                        className={`px-2 py-1 border ${theme.border} rounded text-xs ${theme.input} [color-scheme:light] dark:[color-scheme:dark]`}
                      />
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        const date = document.getElementById('windowDate').value;
                        const startTime = document.getElementById('windowStartTime').value;
                        const endTime = document.getElementById('windowEndTime').value;

                        if (date && startTime && endTime) {
                          if (date < todayLocal) {
                            toast.error('Cannot select past dates. Please choose today or a future date.');
                            return;
                          }

                          if (startTime >= endTime) {
                            toast.error('End time must be after start time');
                            return;
                          }
                          setAvailabilityWindows([...availabilityWindows, { date, startTime, endTime }]);
                          document.getElementById('windowDate').value = '';
                          document.getElementById('windowStartTime').value = '';
                          document.getElementById('windowEndTime').value = '';
                        } else {
                          toast.error('Please fill all availability window fields');
                        }
                      }}
                      className="mt-2 px-3 py-1 bg-[#85409D] text-white rounded text-xs hover:bg-[#C47BE4]"
                    >
                      {t('organizer.addAvailabilityWindow')}
                    </button>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      formik.resetForm();
                    }}
                    className={`px-4 py-2 ${theme.textSecondary} border ${theme.border} rounded-md ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors cursor-pointer outline-none`}
                  >
                    {t('organizer.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={formik.isSubmitting}
                    className="px-4 py-2 bg-[#4D2FB2] text-white rounded-md hover:bg-[#62109F] transition-colors disabled:opacity-50 cursor-pointer outline-none"
                  >
                    {formik.isSubmitting ? t('organizer.creating') : t('organizer.createService')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Service Modal */}
        {showEditForm && editingService && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
            <div className={`${theme.cardBg} rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto`}>
              <h2 className={`text-xl font-bold mb-4 ${theme.textAccent}`}>
                {t('organizer.editService')}
              </h2>
              <form onSubmit={editFormik.handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>
                      {t('organizer.serviceTitle')}
                    </label>
                    <input
                      name="title"
                      type="text"
                      value={editFormik.values.title}
                      onChange={editFormik.handleChange}
                      onBlur={editFormik.handleBlur}
                      className={`w-full px-3 py-2 border ${theme.border} rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2] ${theme.input}`}
                    />
                    {editFormik.touched.title && editFormik.errors.title && (
                      <div className="text-red-500 text-sm mt-1">
                        {editFormik.errors.title}
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>
                      {t('organizer.serviceType')}
                    </label>
                    <input
                      name="serviceType"
                      type="text"
                      placeholder={t('organizer.serviceTypePlaceholder')}
                      value={editFormik.values.serviceType}
                      onChange={editFormik.handleChange}
                      onBlur={editFormik.handleBlur}
                      className={`w-full px-3 py-2 border ${theme.border} rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2] ${theme.input}`}
                    />
                    {editFormik.touched.serviceType && editFormik.errors.serviceType && (
                      <div className="text-red-500 text-sm mt-1">
                        {editFormik.errors.serviceType}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>
                    {t('organizer.description')}
                  </label>
                  <textarea
                    name="description"
                    rows="2"
                    value={editFormik.values.description}
                    onChange={editFormik.handleChange}
                    onBlur={editFormik.handleBlur}
                    className={`w-full px-3 py-2 border ${theme.border} rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2] ${theme.input}`}
                  />
                  {editFormik.touched.description && editFormik.errors.description && (
                    <div className="text-red-500 text-sm mt-1">
                      {editFormik.errors.description}
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>
                    Address
                  </label>
                  <textarea
                    name="address"
                    rows="2"
                    value={editFormik.values.address}
                    onChange={editFormik.handleChange}
                    onBlur={editFormik.handleBlur}
                    className={`w-full px-3 py-2 border ${theme.border} rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2] ${theme.input}`}
                  />
                  {editFormik.touched.address && editFormik.errors.address && (
                    <div className="text-red-500 text-sm mt-1">
                      {editFormik.errors.address}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>
                      {t('organizer.photoUrl')}
                    </label>
                    <input
                      name="photo"
                      type="url"
                      value={editFormik.values.photo}
                      onChange={editFormik.handleChange}
                      onBlur={editFormik.handleBlur}
                      className={`w-full px-3 py-2 border ${theme.border} rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2] ${theme.input}`}
                    />
                    {editFormik.touched.photo && editFormik.errors.photo && (
                      <div className="text-red-500 text-sm mt-1">
                        {editFormik.errors.photo}
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>
                      {t('organizer.maxCapacityLabel')}
                    </label>
                    <input
                      name="maxCapacity"
                      type="number"
                      min="1"
                      value={editFormik.values.maxCapacity}
                      onChange={editFormik.handleChange}
                      onBlur={editFormik.handleBlur}
                      className={`w-full px-3 py-2 border ${theme.border} rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2] ${theme.input}`}
                    />
                    {editFormik.touched.maxCapacity && editFormik.errors.maxCapacity && (
                      <div className="text-red-500 text-sm mt-1">
                        {editFormik.errors.maxCapacity}
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>
                      Price (₹)
                    </label>
                    <input
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={editFormik.values.price}
                      onChange={editFormik.handleChange}
                      onBlur={editFormik.handleBlur}
                      className={`w-full px-3 py-2 border ${theme.border} rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2] ${theme.input}`}
                      placeholder="Enter price"
                    />
                    {editFormik.touched.price && editFormik.errors.price && (
                      <div className="text-red-500 text-sm mt-1">
                        {editFormik.errors.price}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="flex items-center space-x-2">
                    <input
                      name="appointmentEnabled"
                      type="checkbox"
                      checked={editFormik.values.appointmentEnabled}
                      onChange={editFormik.handleChange}
                      className="w-4 h-4 text-[#4D2FB2] border-gray-300 rounded focus:ring-[#4D2FB2] outline-none"
                    />
                    <span className={`text-sm font-medium ${theme.textPrimary}`}>
                      {t('organizer.enableAppointmentBooking')}
                    </span>
                  </label>
                  <p className={`text-xs ${theme.textMuted} mt-1`}>
                    {t('organizer.appointmentBookingDesc')}
                  </p>
                </div>

                {/* Availability Windows Section */}
                {editFormik.values.appointmentEnabled && (
                  <div className={`mb-6 p-4 border ${theme.border} rounded-lg`}>
                    <h4 className={`text-sm font-medium ${theme.textPrimary} mb-3`}>
                      {t('organizer.availabilityWindows')}
                    </h4>
                    <p className={`text-xs ${theme.textMuted} mb-3`}>
                      {t('organizer.availabilityDesc')}
                    </p>
                    
                    {availabilityWindows.length === 0 ? (
                      <p className={`text-xs ${theme.textMuted} mb-3`}>{t('organizer.noAvailabilityWindows')}</p>
                    ) : (
                      <div className="space-y-2 mb-3">
                        {availabilityWindows.map((window, index) => (
                          <div key={index} className={`flex items-center justify-between p-2 rounded ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
                            <span className={`text-sm ${theme.textPrimary}`}>
                              {window.date} | {window.startTime} - {window.endTime}
                            </span>
                            <button
                              type="button"
                              onClick={() => setAvailabilityWindows(availabilityWindows.filter((_, i) => i !== index))}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              {t('organizer.remove')}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 gap-2 mb-2">
                      <input
                        type="date"
                        id="editWindowDate"
                        min={todayLocal}
                        className={`px-2 py-1 border ${theme.border} rounded text-xs ${theme.input} [color-scheme:light] dark:[color-scheme:dark]`}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="time"
                        placeholder={t('organizer.startTime')}
                        id="editWindowStartTime"
                        className={`px-2 py-1 border ${theme.border} rounded text-xs ${theme.input} [color-scheme:light] dark:[color-scheme:dark]`}
                      />
                      <input
                        type="time"
                        placeholder={t('organizer.endTime')}
                        id="editWindowEndTime"
                        className={`px-2 py-1 border ${theme.border} rounded text-xs ${theme.input} [color-scheme:light] dark:[color-scheme:dark]`}
                      />
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        const date = document.getElementById('editWindowDate').value;
                        const startTime = document.getElementById('editWindowStartTime').value;
                        const endTime = document.getElementById('editWindowEndTime').value;

                        if (date && startTime && endTime) {
                          if (date < todayLocal) {
                            toast.error('Cannot select past dates. Please choose today or a future date.');
                            return;
                          }

                          if (startTime >= endTime) {
                            toast.error('End time must be after start time');
                            return;
                          }
                          setAvailabilityWindows([...availabilityWindows, { date, startTime, endTime }]);
                          document.getElementById('editWindowDate').value = '';
                          document.getElementById('editWindowStartTime').value = '';
                          document.getElementById('editWindowEndTime').value = '';
                        } else {
                          toast.error('Please fill all availability window fields');
                        }
                      }}
                      className="mt-2 px-3 py-1 bg-[#85409D] text-white rounded text-xs hover:bg-[#C47BE4]"
                    >
                      {t('organizer.addAvailabilityWindow')}
                    </button>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingService(null);
                    }}
                    className={`px-4 py-2 ${theme.textSecondary} border ${theme.border} rounded-md ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors cursor-pointer outline-none`}
                  >
                    {t('organizer.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={editFormik.isSubmitting}
                    className="px-4 py-2 bg-[#4D2FB2] text-white rounded-md hover:bg-[#62109F] transition-colors disabled:opacity-50 cursor-pointer outline-none"
                  >
                    {editFormik.isSubmitting ? t('organizer.updating') : t('organizer.updateService')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && serviceToDelete && (
          <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
            <div className={`${theme.cardBg} rounded-lg p-6 w-full max-w-md`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-red-600 dark:text-red-400">
                  {t('organizer.deleteService')}
                </h2>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setServiceToDelete(null);
                  }}
                  className={`${theme.textMuted} hover:${theme.textPrimary} outline-none cursor-pointer`}
                >
                  <FaTimes size={20} />
                </button>
              </div>
              
              <div className="mb-6">
                <p className={`${theme.textSecondary} mb-2`}>
                  {t('organizer.deleteConfirmMessage')}
                </p>
                <div className={`border rounded-lg p-3 ${isDark ? 'bg-red-900/30 border-red-700' : 'bg-red-50 border-red-200'}`}>
                  <p className={`font-semibold ${isDark ? 'text-red-300' : 'text-red-800'}`}>{serviceToDelete.title}</p>
                  <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'} capitalize`}>{serviceToDelete.serviceType}</p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setServiceToDelete(null);
                  }}
                  className={`px-4 py-2 ${theme.textSecondary} border ${theme.border} rounded-md ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors cursor-pointer outline-none`}
                >
                  {t('organizer.cancel')}
                </button>
                <button
                  onClick={handleDeleteService}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors cursor-pointer outline-none"
                >
                  {t('organizer.deleteService')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Services Grid */}
        {services.length === 0 && !loading ? (
          <div className="text-center py-12">
            <p className={`${theme.textAccent} text-lg font-medium`}>
              {t('organizer.noServices')}
            </p>
            <p className={`${theme.textSecondary}`}>
              {t('organizer.createFirstService')}
            </p>
          </div>
        ) : (
          <InfiniteScroll
            dataLength={services.length}
            next={fetchMoreServices}
            hasMore={hasMore}
            loader={
              <div className="flex justify-center items-center py-8">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#62109F]"></div>
                  <span className="text-[#62109F] font-medium">Loading more services...</span>
                </div>
              </div>
            }
            endMessage={
              <div className="text-center py-8">
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#B7A3E3] to-[#C47BE4] text-white rounded-full">
                  <span className="text-sm font-medium"> You've seen all your services!</span>
                </div>
              </div>
            }
          >
            {/* create some testing and debug for services */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service, index) => {
                return (
                  <div
                    key={service._id}
                    className={`${theme.cardBg} rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full transform hover:scale-105`}
                  >
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <span className="text-4xl mr-3">
                            {getServiceIcon(service.serviceType)}
                          </span>
                          <div>
                            <h3 className={`text-xl font-semibold ${theme.textAccent}`}>
                              {service.title}
                            </h3>
                            <p className={`text-sm ${theme.textSecondary} capitalize`}>
                              {service.serviceType}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(service);
                            }}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors cursor-pointer"
                            title="Edit Service"
                          >
                            <FaEdit size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteModal(service);
                            }}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                            title="Delete Service"
                          >
                            <FaTrash size={16} />
                          </button>
                        </div>
                      </div>

                      {service.photo && (
                        <div className="relative w-full h-32 mb-4">
                          <Image
                            src={service.photo}
                            alt={service.title}
                            fill
                            className="object-cover rounded-lg"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        </div>
                      )}

                      <p className={`${theme.textSecondary} mb-2 flex-1 min-h-[3rem] line-clamp-3`}>
                        {service.description}
                      </p>

                      {service.address && (
                        <p className={`text-xs ${theme.textMuted} mb-4 line-clamp-2 flex items-start gap-1`}>
                          <FaMapMarkerAlt className="mt-0.5 flex-shrink-0" size={12} />
                          <span>{service.address}</span>
                        </p>
                      )}

                      <div className="flex justify-between items-center mb-4 mt-auto">
                        <div className={`text-sm ${theme.textMuted}`}>
                          <span className="font-medium">{t('organizer.capacity')}:</span>{" "}
                          {service.maxCapacity}
                        </div>
                        <div className={`text-sm font-semibold ${theme.textAccent}`}>
                          ₹{service.price || 0}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mb-4">
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(service.status)}`}
                        >
                          {getStatusText(service.status)}
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2">
                        {service.status === "inactive" && (
                          <button
                            onClick={() => handleStartService(service._id)}
                            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-md hover:from-green-600 hover:to-green-700 transition-all duration-300 cursor-pointer outline-none"
                          >
                            {t('organizer.startService')}
                          </button>
                        )}

                        <button
                          onClick={() =>
                            router.push(`/organizer/service/${service._id}`)
                          }
                          className="flex-1 bg-gradient-to-r from-[#4D2FB2] to-[#62109F] text-white px-4 py-2 rounded-md hover:from-[#62109F] hover:to-[#8C00FF] transition-all duration-300 cursor-pointer outline-none"
                        >
                          {getButtonText(service)}
                        </button>
                        
                        {service.appointmentEnabled && (
                          <button
                            onClick={() =>
                              router.push(`/organizer/appointments/${service._id}`)
                            }
                            className="flex-1 bg-gradient-to-r from-[#85409D] to-[#C47BE4] text-white px-4 py-2 rounded-md hover:from-[#C47BE4] hover:to-[#B7A3E3] transition-all duration-300 cursor-pointer outline-none"
                          >
                            {t('organizer.appointments')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </InfiniteScroll>
        )}

      </div>
    </div>
  );
}

export default function ProtectedOrganizerDashboard() {
  return (
    <ProtectedRoute allowedRoles={[2]}>
      <OrganizerDashboard />
    </ProtectedRoute>
  );
}


