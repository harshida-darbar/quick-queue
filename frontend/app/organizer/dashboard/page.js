"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast, { Toaster } from "react-hot-toast";
import Image from "next/image";
import { FaHospital, FaUtensils, FaCut, FaBuilding } from "react-icons/fa";
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
  const [loading, setLoading] = useState(true);
  const [availabilityWindows, setAvailabilityWindows] = useState([]);
  const router = useRouter();

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
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await api.get("/queue/my-services");
      setServices(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        router.push("/login");
        return;
      }
      console.error("Error fetching services:", error);
      toast.error("Failed to fetch services");
    } finally {
      setLoading(false);
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

  const getServiceIcon = (type) => {
    const iconProps = { size: 32, className: "text-[#62109F]" };
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
      hospital: "Manage Appointments",
      clinic: "Manage Appointments",
      doctor: "Manage Appointments",
      restaurant: "Manage Tables",
      cafe: "Manage Tables",
      salon: "Manage Slots",
      spa: "Manage Slots",
      gym: "Manage Sessions",
      bank: "Manage Tokens",
      atm: "Manage Tokens",
      library: "Manage Seats",
      cinema: "Manage Tickets",
      theater: "Manage Tickets",
      carwash: "Manage Services",
      mechanic: "Manage Services",
      dentist: "Manage Appointments",
      pharmacy: "Manage Queue"
    };
    
    return buttonMapping[serviceType] || "Manage Queue";
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#B7A3E3] to-[#C5B0CD]">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-xl text-[#62109F]">Loading services...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#B7A3E3] to-[#C5B0CD]">
      <Navbar />
      <Toaster position="top-right" />

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#62109F]">My Services</h1>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-[#4D2FB2] to-[#62109F] text-white px-6 py-2 rounded-lg hover:from-[#62109F] hover:to-[#8C00FF] transition-all duration-300 shadow-lg cursor-pointer outline-none"
          >
            Create New Service
          </button>
        </div>

        {/* Create Service Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-[#B7A3E3] bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4 text-[#62109F]">
                Create New Service
              </h2>
              <form onSubmit={formik.handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Title
                  </label>
                  <input
                    name="title"
                    type="text"
                    value={formik.values.title}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2]"
                  />
                  {formik.touched.title && formik.errors.title && (
                    <div className="text-red-500 text-sm mt-1">
                      {formik.errors.title}
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows="3"
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2]"
                  />
                  {formik.touched.description && formik.errors.description && (
                    <div className="text-red-500 text-sm mt-1">
                      {formik.errors.description}
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Type
                  </label>
                  <input
                    name="serviceType"
                    type="text"
                    placeholder="e.g., restaurant, hospital, salon, gym, etc."
                    value={formik.values.serviceType}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2]"
                  />
                  {formik.touched.serviceType && formik.errors.serviceType && (
                    <div className="text-red-500 text-sm mt-1">
                      {formik.errors.serviceType}
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photo URL (optional)
                  </label>
                  <input
                    name="photo"
                    type="url"
                    value={formik.values.photo}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2]"
                  />
                  {formik.touched.photo && formik.errors.photo && (
                    <div className="text-red-500 text-sm mt-1">
                      {formik.errors.photo}
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Capacity
                  </label>
                  <input
                    name="maxCapacity"
                    type="number"
                    min="1"
                    value={formik.values.maxCapacity}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2]"
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
                    <span className="text-sm font-medium text-gray-700">
                      Enable Appointment Booking
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Allow users to book specific time slots in advance
                  </p>
                </div>

                {/* Availability Windows Section */}
                {formik.values.appointmentEnabled && (
                  <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Availability Windows
                    </h4>
                    <p className="text-xs text-gray-500 mb-3">
                      Set time windows when appointments are available (e.g., 4:00 PM - 7:00 PM). Users can book 30-minute slots within these windows.
                    </p>
                    
                    {availabilityWindows.length === 0 ? (
                      <p className="text-xs text-gray-500 mb-3">No availability windows added yet</p>
                    ) : (
                      <div className="space-y-2 mb-3">
                        {availabilityWindows.map((window, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <span className="text-sm">
                              {window.date} | {window.startTime} - {window.endTime}
                            </span>
                            <button
                              type="button"
                              onClick={() => setAvailabilityWindows(availabilityWindows.filter((_, i) => i !== index))}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 gap-2 mb-2">
                      <input
                        type="date"
                        id="windowDate"
                        className="px-2 py-1 border border-gray-300 rounded text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="time"
                        placeholder="Start Time"
                        id="windowStartTime"
                        className="px-2 py-1 border border-gray-300 rounded text-xs"
                      />
                      <input
                        type="time"
                        placeholder="End Time"
                        id="windowEndTime"
                        className="px-2 py-1 border border-gray-300 rounded text-xs"
                      />
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        const date = document.getElementById('windowDate').value;
                        const startTime = document.getElementById('windowStartTime').value;
                        const endTime = document.getElementById('windowEndTime').value;
                        
                        if (date && startTime && endTime) {
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
                      Add Availability Window
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
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer outline-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formik.isSubmitting}
                    className="px-4 py-2 bg-[#4D2FB2] text-white rounded-md hover:bg-[#62109F] transition-colors disabled:opacity-50 cursor-pointer outline-none"
                  >
                    {formik.isSubmitting ? "Creating..." : "Create Service"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Services Grid */}
        {services.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#62109F] text-lg font-medium">
              No services created yet
            </p>
            <p className="text-[#85409D]">
              Create your first service to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service._id}
                className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full"
              >
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center mb-4">
                    <span className="text-4xl mr-3">
                      {getServiceIcon(service.serviceType)}
                    </span>
                    <div>
                      <h3 className="text-xl font-semibold text-[#62109F]">
                        {service.title}
                      </h3>
                      <p className="text-sm text-[#85409D] capitalize">
                        {service.serviceType}
                      </p>
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

                  <p className="text-gray-600 mb-4 flex-1 min-h-[3rem] line-clamp-3">
                    {service.description}
                  </p>

                  <div className="flex justify-between items-center mb-4 mt-auto">
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">Capacity:</span>{" "}
                      {service.maxCapacity}
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(service.status)}`}
                    >
                      {service.status}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    {service.status === "inactive" && (
                      <button
                        onClick={() => handleStartService(service._id)}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-md hover:from-green-600 hover:to-green-700 transition-all duration-300"
                      >
                        Start Service
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
                        Appointments
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
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