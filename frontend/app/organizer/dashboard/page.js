"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import { FaHospital, FaUtensils, FaCut, FaBuilding, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import InfiniteScroll from 'react-infinite-scroll-component';
import api from "../../utils/api";
import Navbar from "../../components/Navbar";
import ProtectedRoute from "../../components/ProtectedRoute";

const validationSchema = Yup.object({
  title: Yup.string().required("Title is required"),
  description: Yup.string().required("Description is required"),
  serviceType: Yup.string().required("Service type is required"),
  photo: Yup.string().url("Must be a valid URL"),
  maxCapacity: Yup.number()
    .min(1, "Capacity must be at least 1")
    .required("Max capacity is required"),
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
  const router = useRouter();

  const editFormik = useFormik({
    initialValues: {
      title: "",
      description: "",
      serviceType: "",
      photo: "",
      maxCapacity: 1,
      appointmentEnabled: false,
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await api.put(`/queue/services/${editingService._id}`, values);
        toast.success("Service updated successfully!");
        setShowEditForm(false);
        setEditingService(null);
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
      maxCapacity: 10,
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
      maxCapacity: service.maxCapacity,
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
    const iconProps = { size: 32, className: "text-[#62109F] dark:text-white" };
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
      <div className="min-h-screen bg-gradient-to-br from-[#B7A3E3] to-[#C5B0CD] dark:from-[#2D1B69] dark:to-[#4C1D95]">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-xl text-[#62109F] dark:text-purple-200">{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#B7A3E3] to-[#C5B0CD] dark:from-[#2D1B69] dark:to-[#4C1D95]">
      <Navbar />

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#62109F] dark:text-purple-200">{t('dashboard.myServices')}</h1>
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
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4 text-[#62109F] dark:text-white">
                {t('organizer.createNewService')}
              </h2>
              <form onSubmit={formik.handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    {t('organizer.serviceTitle')}
                  </label>
                  <input
                    name="title"
                    type="text"
                    value={formik.values.title}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2] bg-white dark:bg-slate-700 dark:text-white"
                  />
                  {formik.touched.title && formik.errors.title && (
                    <div className="text-red-500 text-sm mt-1">
                      {formik.errors.title}
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    {t('organizer.description')}
                  </label>
                  <textarea
                    name="description"
                    rows="3"
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2] bg-white dark:bg-slate-700 dark:text-white"
                  />
                  {formik.touched.description && formik.errors.description && (
                    <div className="text-red-500 text-sm mt-1">
                      {formik.errors.description}
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    {t('organizer.serviceType')}
                  </label>
                  <input
                    name="serviceType"
                    type="text"
                    placeholder={t('organizer.serviceTypePlaceholder')}
                    value={formik.values.serviceType}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2] bg-white dark:bg-slate-700 dark:text-white"
                  />
                  {formik.touched.serviceType && formik.errors.serviceType && (
                    <div className="text-red-500 text-sm mt-1">
                      {formik.errors.serviceType}
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    {t('organizer.photoUrl')}
                  </label>
                  <input
                    name="photo"
                    type="url"
                    value={formik.values.photo}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2] bg-white dark:bg-slate-700 dark:text-white"
                  />
                  {formik.touched.photo && formik.errors.photo && (
                    <div className="text-red-500 text-sm mt-1">
                      {formik.errors.photo}
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    {t('organizer.maxCapacityLabel')}
                  </label>
                  <input
                    name="maxCapacity"
                    type="number"
                    min="1"
                    value={formik.values.maxCapacity}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2] bg-white dark:bg-slate-700 dark:text-white"
                  />
                  {formik.touched.maxCapacity && formik.errors.maxCapacity && (
                    <div className="text-red-500 text-sm mt-1">
                      {formik.errors.maxCapacity}
                    </div>
                  )}
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
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {t('organizer.enableAppointmentBooking')}
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('organizer.appointmentBookingDesc')}
                  </p>
                </div>

                {/* Availability Windows Section */}
                {formik.values.appointmentEnabled && (
                  <div className="mb-6 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                      {t('organizer.availabilityWindows')}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      {t('organizer.availabilityDesc')}
                    </p>
                    
                    {availabilityWindows.length === 0 ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{t('organizer.noAvailabilityWindows')}</p>
                    ) : (
                      <div className="space-y-2 mb-3">
                        {availabilityWindows.map((window, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-slate-700 p-2 rounded">
                            <span className="text-sm text-gray-700 dark:text-gray-200">
                              {window.date} | {window.startTime} - {window.endTime}
                            </span>
                            <button
                              type="button"
                              onClick={() => setAvailabilityWindows(availabilityWindows.filter((_, i) => i !== index))}
                              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs"
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
                        min={new Date().toISOString().split('T')[0]}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-slate-700 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="time"
                        placeholder={t('organizer.startTime')}
                        id="windowStartTime"
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-slate-700 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                      />
                      <input
                        type="time"
                        placeholder={t('organizer.endTime')}
                        id="windowEndTime"
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-slate-700 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                      />
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        const date = document.getElementById('windowDate').value;
                        const startTime = document.getElementById('windowStartTime').value;
                        const endTime = document.getElementById('windowEndTime').value;
                        
                        if (date && startTime && endTime) {
                          const selectedDate = new Date(date);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          
                          if (selectedDate < today) {
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
                    className="px-4 py-2 text-gray-600 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer outline-none"
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
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4 text-[#62109F] dark:text-white">
                {t('organizer.editService')}
              </h2>
              <form onSubmit={editFormik.handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    {t('organizer.serviceTitle')}
                  </label>
                  <input
                    name="title"
                    type="text"
                    value={editFormik.values.title}
                    onChange={editFormik.handleChange}
                    onBlur={editFormik.handleBlur}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2] bg-white dark:bg-slate-700 dark:text-white"
                  />
                  {editFormik.touched.title && editFormik.errors.title && (
                    <div className="text-red-500 text-sm mt-1">
                      {editFormik.errors.title}
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    {t('organizer.description')}
                  </label>
                  <textarea
                    name="description"
                    rows="3"
                    value={editFormik.values.description}
                    onChange={editFormik.handleChange}
                    onBlur={editFormik.handleBlur}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2] bg-white dark:bg-slate-700 dark:text-white"
                  />
                  {editFormik.touched.description && editFormik.errors.description && (
                    <div className="text-red-500 text-sm mt-1">
                      {editFormik.errors.description}
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    {t('organizer.serviceType')}
                  </label>
                  <input
                    name="serviceType"
                    type="text"
                    placeholder={t('organizer.serviceTypePlaceholder')}
                    value={editFormik.values.serviceType}
                    onChange={editFormik.handleChange}
                    onBlur={editFormik.handleBlur}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2] bg-white dark:bg-slate-700 dark:text-white"
                  />
                  {editFormik.touched.serviceType && editFormik.errors.serviceType && (
                    <div className="text-red-500 text-sm mt-1">
                      {editFormik.errors.serviceType}
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    {t('organizer.photoUrl')}
                  </label>
                  <input
                    name="photo"
                    type="url"
                    value={editFormik.values.photo}
                    onChange={editFormik.handleChange}
                    onBlur={editFormik.handleBlur}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2] bg-white dark:bg-slate-700 dark:text-white"
                  />
                  {editFormik.touched.photo && editFormik.errors.photo && (
                    <div className="text-red-500 text-sm mt-1">
                      {editFormik.errors.photo}
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    {t('organizer.maxCapacityLabel')}
                  </label>
                  <input
                    name="maxCapacity"
                    type="number"
                    min="1"
                    value={editFormik.values.maxCapacity}
                    onChange={editFormik.handleChange}
                    onBlur={editFormik.handleBlur}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2] bg-white dark:bg-slate-700 dark:text-white"
                  />
                  {editFormik.touched.maxCapacity && editFormik.errors.maxCapacity && (
                    <div className="text-red-500 text-sm mt-1">
                      {editFormik.errors.maxCapacity}
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <label className="flex items-center space-x-2">
                    <input
                      name="appointmentEnabled"
                      type="checkbox"
                      checked={editFormik.values.appointmentEnabled}
                      onChange={editFormik.handleChange}
                      className="w-4 h-4 text-[#4D2FB2] border-gray-300 rounded focus:ring-[#4D2FB2]"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {t('organizer.enableAppointmentBooking')}
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('organizer.appointmentBookingDesc')}
                  </p>
                </div>

                {/* Availability Windows Section */}
                {editFormik.values.appointmentEnabled && (
                  <div className="mb-6 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                      {t('organizer.availabilityWindows')}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      {t('organizer.availabilityDesc')}
                    </p>
                    
                    {availabilityWindows.length === 0 ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{t('organizer.noAvailabilityWindows')}</p>
                    ) : (
                      <div className="space-y-2 mb-3">
                        {availabilityWindows.map((window, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-slate-700 p-2 rounded">
                            <span className="text-sm text-gray-700 dark:text-gray-200">
                              {window.date} | {window.startTime} - {window.endTime}
                            </span>
                            <button
                              type="button"
                              onClick={() => setAvailabilityWindows(availabilityWindows.filter((_, i) => i !== index))}
                              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs"
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
                        min={new Date().toISOString().split('T')[0]}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-slate-700 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="time"
                        placeholder={t('organizer.startTime')}
                        id="editWindowStartTime"
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-slate-700 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                      />
                      <input
                        type="time"
                        placeholder={t('organizer.endTime')}
                        id="editWindowEndTime"
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-slate-700 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                      />
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        const date = document.getElementById('editWindowDate').value;
                        const startTime = document.getElementById('editWindowStartTime').value;
                        const endTime = document.getElementById('editWindowEndTime').value;
                        
                        if (date && startTime && endTime) {
                          const selectedDate = new Date(date);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          
                          if (selectedDate < today) {
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
                    className="px-4 py-2 text-gray-600 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer outline-none"
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
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-red-600 dark:text-red-400">
                  {t('organizer.deleteService')}
                </h2>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setServiceToDelete(null);
                  }}
                  className="text-gray-500 dark:text-gray-200 hover:text-gray-700 dark:hover:text-gray-300 outline-none cursor-pointer"
                >
                  <FaTimes size={20} />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  {t('organizer.deleteConfirmMessage')}
                </p>
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-3">
                  <p className="font-semibold text-red-800 dark:text-red-300">{serviceToDelete.title}</p>
                  <p className="text-sm text-red-600 dark:text-red-400 capitalize">{serviceToDelete.serviceType}</p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setServiceToDelete(null);
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer outline-none"
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
            <p className="text-[#62109F] dark:text-purple-200 text-lg font-medium">
              {t('organizer.noServices')}
            </p>
            <p className="text-[#85409D] dark:text-purple-300">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service, index) => {
                return (
                  <div
                    key={service._id}
                    className="bg-white dark:bg-slate-800 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full transform hover:scale-105"
                  >
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <span className="text-4xl mr-3">
                            {getServiceIcon(service.serviceType)}
                          </span>
                          <div>
                            <h3 className="text-xl font-semibold text-[#62109F] dark:text-white">
                              {service.title}
                            </h3>
                            <p className="text-sm text-[#85409D] dark:text-purple-300 capitalize">
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

                      <p className="text-gray-600 dark:text-gray-300 mb-4 flex-1 min-h-[3rem] line-clamp-3">
                        {service.description}
                      </p>

                      <div className="flex justify-between items-center mb-4 mt-auto">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-medium">{t('organizer.capacity')}:</span>{" "}
                          {service.maxCapacity}
                        </div>
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
                            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-md hover:from-green-600 hover:to-green-700 transition-all duration-300"
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