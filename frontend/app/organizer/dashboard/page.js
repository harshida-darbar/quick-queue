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
});

function OrganizerDashboard() {
  const [services, setServices] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const formik = useFormik({
    initialValues: {
      title: "",
      description: "",
      serviceType: "",
      photo: "",
      maxCapacity: 10,
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        await api.post("/queue/services", values);
        toast.success("Service created successfully!");
        setShowCreateForm(false);
        resetForm();
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
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
              >
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

                <p className="text-gray-600 mb-4 line-clamp-2">
                  {service.description}
                </p>

                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Capacity:</span>{" "}
                    {service.maxCapacity}
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}
                  >
                    {service.status}
                  </div>
                </div>

                <div className="flex space-x-2">
                  {service.status === "inactive" && (
                    <button
                      onClick={() => handleStartService(service._id)}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-4 rounded-md hover:from-green-600 hover:to-green-700 transition-all duration-300"
                    >
                      Start Service
                    </button>
                  )}

                  <button
                    onClick={() =>
                      router.push(`/organizer/service/${service._id}`)
                    }
                    className="flex-1 bg-gradient-to-r from-[#4D2FB2] to-[#62109F] text-white py-2 px-4 rounded-md hover:from-[#62109F] hover:to-[#8C00FF] transition-all duration-300 cursor-pointer outline-none"
                  >
                    Manage
                  </button>
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