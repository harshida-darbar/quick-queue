"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Image from "next/image";
import { FaHospital, FaUtensils, FaCut, FaBuilding, FaTimes } from "react-icons/fa";
import { useFormik } from "formik";
import * as Yup from "yup";
import api from "../../utils/api";
import Navbar from "../../components/Navbar";
import ProtectedRoute from "../../components/ProtectedRoute";

function UserDashboard() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await api.get("/queue/services");
      const servicesWithStatus = await Promise.all(
        response.data.map(async (service) => {
          try {
            const statusResponse = await api.get(`/queue/services/${service._id}/status`);
            return { ...service, userStatus: statusResponse.data.status ? statusResponse.data : null };
          } catch (error) {
            return { ...service, userStatus: null };
          }
        })
      );
      setServices(servicesWithStatus);
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

  const joinFormik = useFormik({
    initialValues: {
      groupSize: 1,
      memberNames: [''],
    },
    validationSchema: Yup.object({
      groupSize: Yup.number()
        .min(1, "Group size must be at least 1")
        .max(selectedService?.maxCapacity || 20, `Group size cannot exceed service capacity of ${selectedService?.maxCapacity || 20} people`)
        .required("Group size is required"),
      memberNames: Yup.array().of(
        Yup.string().required("Name is required")
      ),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await api.post(`/queue/services/${selectedService._id}/join`, {
          groupSize: values.groupSize,
          memberNames: values.memberNames.slice(0, values.groupSize),
        });
        toast.success(`Successfully joined queue for ${values.groupSize} people!`);
        setShowJoinForm(false);
        setSelectedService(null);
        joinFormik.resetForm();
        fetchServices();
      } catch (error) {
        console.error("Error joining queue:", error);
        toast.error(error.response?.data?.message || "Failed to join queue");
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleJoinClick = (service, e) => {
    e.stopPropagation();
    setSelectedService(service);
    setShowJoinForm(true);
  };

  const handleCardClick = async (service) => {
    try {
      const response = await api.get(`/queue/services/${service._id}/status`);
      const { status, tokenNumber, waitingAhead } = response.data;
      
      let message = '';
      if (status === 'serving') {
        message = `🟢 You are currently being served! Token #${tokenNumber}`;
        toast.success(message);
      } else if (status === 'waiting') {
        message = `🟡 You are in waiting list. Token #${tokenNumber}. ${waitingAhead} people ahead of you.`;
        toast(message, { icon: '⏳' });
      } else if (status === 'complete') {
        message = `✅ Your service is completed! Token #${tokenNumber}`;
        toast.success(message);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('You have not joined this queue yet. Click "Join Queue" to join.');
      } else {
        toast.error('Failed to get queue status');
      }
    }
  };

  const handleGroupSizeChange = (e) => {
    const newSize = parseInt(e.target.value) || 1;
    
    // Check if group size exceeds service capacity
    if (newSize > selectedService?.maxCapacity) {
      toast.error(`service capacity of ${selectedService.maxCapacity} people`);
      return;
    }
    
    const newNames = Array(newSize).fill('').map((_, i) => 
      joinFormik.values.memberNames[i] || ''
    );
    joinFormik.setFieldValue('groupSize', newSize);
    joinFormik.setFieldValue('memberNames', newNames);
  };

  const getServiceIcon = (type) => {
    const iconProps = { size: 32, className: "text-[#62109F]" };
    switch (type) {
      case "hospital": return <FaHospital {...iconProps} />;
      case "restaurant": return <FaUtensils {...iconProps} />;
      case "salon": return <FaCut {...iconProps} />;
      default: return <FaBuilding {...iconProps} />;
    }
  };

  const getButtonText = (service) => {
    if (service.isFull) {
      return "Join Queue";
    }
    
    const serviceType = service.serviceType.toLowerCase();
    const buttonMapping = {
      hospital: "Book Appointment",
      clinic: "Book Appointment",
      doctor: "Book Appointment",
      restaurant: "Book Table",
      cafe: "Book Table",
      salon: "Book Slot",
      spa: "Book Slot",
      gym: "Book Session",
      bank: "Get Token",
      atm: "Get Token",
      library: "Reserve Seat",
      cinema: "Book Ticket",
      theater: "Book Ticket",
      carwash: "Book Service",
      mechanic: "Book Service",
      dentist: "Book Appointment",
      pharmacy: "Get Medicine"
    };
    
    return buttonMapping[serviceType] || `Book ${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#A7AAE1] to-[#C5B0CD]">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-xl text-[#62109F]">Loading services...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#A7AAE1] to-[#C5B0CD]">
      <Navbar />
      <Toaster position="top-right" />
      
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-[#62109F] mb-8">Available Services</h1>
        
        {services.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#62109F] text-lg font-medium">No active services available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service._id}
                className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full cursor-pointer"
                onClick={() => handleCardClick(service)}
              >
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center mb-4">
                    {getServiceIcon(service.serviceType)}
                    <div className="ml-3">
                      <h3 className="text-xl font-semibold text-[#62109F]">{service.title}</h3>
                      <p className="text-sm text-[#85409D] capitalize">{service.serviceType}</p>
                    </div>
                  </div>
                  
                  {service.photo && (
                    <div className="relative w-full h-32 mb-4">
                      <Image 
                        src={service.photo} 
                        alt={service.title}
                        fill
                        className="object-cover rounded-lg"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}
                  
                  <p className="text-gray-600 mb-4 flex-1 min-h-[3rem]">{service.description}</p>
                  
                  <div className="flex justify-between items-center mb-4 mt-auto">
                    <div className="text-sm text-[#85409D]">
                      <span className="font-medium">Capacity:</span> {service.servingCapacity || 0}/{service.maxCapacity}
                    </div>
                    <div className="text-sm text-[#85409D]">
                      <span className="font-medium">Waiting:</span> {service.waitingCount}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      service.isFull 
                        ? "bg-red-100 text-red-800" 
                        : "bg-green-100 text-green-800"
                    }`}>
                      {service.isFull ? "Full" : "Available"}
                    </div>
                    
                    {service.userStatus ? (
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        service.userStatus.status === 'serving' ? 'bg-green-100 text-green-800' :
                        service.userStatus.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {service.userStatus.status === 'serving' ? `🟢 Serving #${service.userStatus.tokenNumber}` :
                         service.userStatus.status === 'waiting' ? `🟡 Waiting #${service.userStatus.tokenNumber}` :
                         `✅ Complete #${service.userStatus.tokenNumber}`}
                      </div>
                    ) : (
                      <button 
                        onClick={(e) => handleJoinClick(service, e)}
                        className="bg-gradient-to-r from-[#4D2FB2] to-[#62109F] text-white px-4 py-2 rounded-md hover:from-[#62109F] hover:to-[#8C00FF] transition-all duration-300 cursor-pointer outline-none"
                      >
                        {getButtonText(service)}
                      </button>
                    )}
                  </div>
                  
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Join Queue Modal */}
        {showJoinForm && selectedService && (
          <div className="fixed inset-0 backdrop-blur-lg flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[#62109F]">
                  Join {selectedService.title}
                </h2>
                <button
                  onClick={() => {
                    setShowJoinForm(false);
                    setSelectedService(null);
                    joinFormik.resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700 outline-none cursor-pointer"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              <form onSubmit={joinFormik.handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How many people in your group?
                  </label>
                  <input
                    name="groupSize"
                    type="number"
                    min="1"
                    max={selectedService?.maxCapacity || 20}
                    value={joinFormik.values.groupSize}
                    onChange={handleGroupSizeChange}
                    onBlur={joinFormik.handleBlur}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2]"
                  />
                  {joinFormik.touched.groupSize && joinFormik.errors.groupSize && (
                    <div className="text-red-500 text-sm mt-1">
                      {joinFormik.errors.groupSize}
                    </div>
                  )}
                </div>

                {/* Member Names */}
                {joinFormik.values.groupSize > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter names for all members:
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {Array.from({ length: joinFormik.values.groupSize }, (_, index) => (
                        <input
                          key={index}
                          type="text"
                          placeholder={`Person ${index + 1} name`}
                          value={joinFormik.values.memberNames[index] || ''}
                          onChange={(e) => {
                            const newNames = [...joinFormik.values.memberNames];
                            newNames[index] = e.target.value;
                            joinFormik.setFieldValue('memberNames', newNames);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2]"
                        />
                      ))}
                    </div>
                    {joinFormik.touched.memberNames && joinFormik.errors.memberNames && (
                      <div className="text-red-500 text-sm mt-1">
                        All names are required
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-gray-50 p-3 rounded-md mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Service:</span> {selectedService.title}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Current Queue:</span> {selectedService.servingCapacity || 0}/{selectedService.maxCapacity} capacity used, {selectedService.waitingCount} waiting
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowJoinForm(false);
                      setSelectedService(null);
                      joinFormik.resetForm();
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors outline-none cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={joinFormik.isSubmitting}
                    className="px-4 py-2 bg-[#4D2FB2] text-white rounded-md hover:bg-[#62109F] transition-colors disabled:opacity-50 outline-none cursor-pointer"
                  >
                    {joinFormik.isSubmitting ? "Joining..." : "Join Queue"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProtectedUserDashboard() {
  return (
    <ProtectedRoute allowedRoles={[3]}>
      <UserDashboard />
    </ProtectedRoute>
  );
}