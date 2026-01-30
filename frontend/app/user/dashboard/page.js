"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Image from "next/image";
import { FaHospital, FaUtensils, FaCut, FaBuilding, FaTimes, FaCheck } from "react-icons/fa";
import { useFormik } from "formik";
import * as Yup from "yup";
import api from "../../utils/api";
import Navbar from "../../components/Navbar";
import ProtectedRoute from "../../components/ProtectedRoute";

function UserDashboard() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [checkedTimeSlots, setCheckedTimeSlots] = useState(new Set());
  const appointmentFormik = useFormik({
    initialValues: {
      groupSize: 1,
      memberNames: [''],
    },
    validationSchema: Yup.object({
      groupSize: Yup.number()
        .min(1, "Group size must be at least 1")
        .max(selectedService?.maxCapacity || 20, `Group size cannot exceed ${selectedService?.maxCapacity || 20}`)
        .required("Group size is required"),
      memberNames: Yup.array().of(
        Yup.string().required("Name is required")
      ),
    }),
    onSubmit: async (values) => {
      if (!selectedTimeSlot) {
        toast.error('Please select a time slot');
        return;
      }
      
      try {
        await api.post(`/queue/appointments`, {
          queueId: selectedService._id,
          timeSlotId: selectedTimeSlot._id,
          groupSize: values.groupSize,
          memberNames: values.memberNames.slice(0, values.groupSize).map(name => name.trim()),
          date: selectedTimeSlot.date,
          startTime: selectedTimeSlot.startTime,
          endTime: selectedTimeSlot.endTime
        });
        
        toast.success(`Appointment booked successfully for ${values.groupSize} people!`);
        setShowAppointmentForm(false);
        setSelectedService(null);
        setAvailableSlots([]);
        setSelectedTimeSlot(null);
        appointmentFormik.resetForm();
        fetchServices();
      } catch (error) {
        console.error('Error booking appointment:', error);
        toast.error(error.response?.data?.message || 'Failed to book appointment');
      }
    },
  });
  const [bookedCounts, setBookedCounts] = useState({});
  const [appointmentGroupSize, setAppointmentGroupSize] = useState(1);
  const [appointmentNames, setAppointmentNames] = useState(['']);
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

  const handleAppointmentClick = async (service, e) => {
    e.stopPropagation();
    setSelectedService(service);
    setAppointmentGroupSize(1);
    setAppointmentNames(['']);
    
    // Use actual time slots from the service (created by organizer)
    console.log('Service data:', service); // Debug log
    const serviceSlots = service.timeSlots || [];
    console.log('Time slots:', serviceSlots); // Debug log
    setAvailableSlots(serviceSlots);
    
    // Get booked counts for each slot
    const counts = {};
    try {
      const appointmentsRes = await api.get(`/queue/services/${service._id}/appointments`);
      const appointments = appointmentsRes.data;
      
      serviceSlots.forEach(slot => {
        const slotAppointments = appointments.filter(apt => 
          apt.startTime === slot.startTime && 
          apt.endTime === slot.endTime &&
          new Date(apt.date).toDateString() === new Date(slot.date).toDateString()
        );
        counts[slot._id] = slotAppointments.reduce((sum, apt) => sum + apt.groupSize, 0);
      });
      setBookedCounts(counts);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
    
    setShowAppointmentForm(true);
  };

  const handleAppointmentGroupSizeChange = (e) => {
    const newSize = parseInt(e.target.value) || 1;
    
    if (newSize > selectedService?.maxCapacity) {
      toast.error(`Group size cannot exceed service capacity of ${selectedService.maxCapacity} people`);
      return;
    }
    
    setAppointmentGroupSize(newSize);
    const newNames = Array(newSize).fill('').map((_, i) => appointmentNames[i] || '');
    setAppointmentNames(newNames);
  };

  const handleTimeSlotCheckbox = (slotId, e) => {
    e.stopPropagation();
    const newChecked = new Set(checkedTimeSlots);
    if (newChecked.has(slotId)) {
      newChecked.delete(slotId);
    } else {
      newChecked.add(slotId);
    }
    setCheckedTimeSlots(newChecked);
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
                      <div className="flex flex-col space-y-1">
                        <button 
                          onClick={(e) => handleJoinClick(service, e)}
                          className="bg-gradient-to-r from-[#4D2FB2] to-[#62109F] text-white px-3 py-1.5 text-sm rounded-md hover:from-[#62109F] hover:to-[#8C00FF] transition-all duration-300 cursor-pointer outline-none"
                        >
                          {getButtonText(service)}
                        </button>
                        
                        {/* Temporarily show appointment button for all services for testing */}
                        {true && (
                          <button 
                            onClick={(e) => handleAppointmentClick(service, e)}
                            className="bg-gradient-to-r from-[#85409D] to-[#C47BE4] text-white px-3 py-1.5 text-sm rounded-md hover:from-[#C47BE4] hover:to-[#B7A3E3] transition-all duration-300 cursor-pointer outline-none"
                          >
                            📅 Book Appointment
                          </button>
                        )}
                      </div>
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
                        <div key={index}>
                          <input
                            type="text"
                            placeholder={`Person ${index + 1} name`}
                            value={joinFormik.values.memberNames[index] || ''}
                            onChange={(e) => {
                              const newNames = [...joinFormik.values.memberNames];
                              newNames[index] = e.target.value;
                              joinFormik.setFieldValue('memberNames', newNames);
                            }}
                            onBlur={() => joinFormik.setFieldTouched(`memberNames[${index}]`, true)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2]"
                          />
                          {joinFormik.touched.memberNames?.[index] && joinFormik.errors.memberNames?.[index] && (
                            <div className="text-red-500 text-sm mt-1">
                              Name is required
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
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
                    {joinFormik.isSubmitting ? "Joining..." : getButtonText(selectedService)}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Appointment Booking Modal */}
        {showAppointmentForm && selectedService && (
          <div className="fixed inset-0 backdrop-blur-lg flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#62109F]">
                  📅 Book Appointment - {selectedService.title}
                </h2>
                <button
                  onClick={() => {
                    setShowAppointmentForm(false);
                    setSelectedService(null);
                    setAvailableSlots([]);
                  }}
                  className="text-gray-500 hover:text-gray-700 outline-none cursor-pointer"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              {/* Group Size and Names Form */}
              <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-[#62109F] mb-4">
                  Booking Details
                </h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How many people in your group?
                  </label>
                  <input
                    name="groupSize"
                    type="number"
                    min="1"
                    max={selectedService?.maxCapacity || 20}
                    value={appointmentFormik.values.groupSize}
                    onChange={(e) => {
                      const newSize = parseInt(e.target.value) || 1;
                      const newNames = Array(newSize).fill('').map((_, i) => appointmentFormik.values.memberNames[i] || '');
                      appointmentFormik.setFieldValue('groupSize', newSize);
                      appointmentFormik.setFieldValue('memberNames', newNames);
                    }}
                    onBlur={appointmentFormik.handleBlur}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2]"
                  />
                  {appointmentFormik.touched.groupSize && appointmentFormik.errors.groupSize && (
                    <div className="text-red-500 text-sm mt-1">
                      {appointmentFormik.errors.groupSize}
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter names for all members:
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {Array.from({ length: appointmentFormik.values.groupSize }, (_, index) => (
                      <div key={index}>
                        <input
                          type="text"
                          placeholder={`Person ${index + 1} name`}
                          value={appointmentFormik.values.memberNames[index] || ''}
                          onChange={(e) => {
                            const newNames = [...appointmentFormik.values.memberNames];
                            newNames[index] = e.target.value;
                            appointmentFormik.setFieldValue('memberNames', newNames);
                          }}
                          onBlur={() => appointmentFormik.setFieldTouched(`memberNames[${index}]`, true)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2]"
                        />
                        {appointmentFormik.touched.memberNames?.[index] && appointmentFormik.errors.memberNames?.[index] && (
                          <div className="text-red-500 text-sm mt-1">
                            {appointmentFormik.errors.memberNames[index]}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#62109F] mb-4">
                  Select Time Slot
                </h3>
                
                {availableSlots.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No time slots available</p>
                    <p className="text-xs text-gray-400 mt-1">The organizer hasn't set up appointment times yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableSlots.map((slot, index) => {
                      const bookedCount = bookedCounts[slot._id] || 0;
                      const isSelected = selectedTimeSlot?._id === slot._id;
                      const isFull = bookedCount >= slot.capacity;
                      
                      return (
                        <div 
                          key={index} 
                          className={`border-2 ${isSelected ? 'border-[#62109F] bg-[#F3F0FF]' : 'border-[#4D2FB2] bg-[#F8F6FF]'} ${isFull ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#F0EDFF] cursor-pointer'} rounded-lg p-4 transition-all duration-300 relative`}
                          onClick={() => {
                            if (!isFull) {
                              setSelectedTimeSlot(slot);
                              toast.success(`Selected: ${slot.startTime} - ${slot.endTime}`);
                            } else {
                              toast.error('This time slot is full');
                            }
                          }}
                        >
                          {/* Checkbox for slot selection */}
                          <div 
                            className="absolute -top-1 right-1 cursor-pointer p-1"
                            onClick={(e) => handleTimeSlotCheckbox(slot._id, e)}
                          >
                            <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all duration-200 ${
                              checkedTimeSlots.has(slot._id) 
                                ? 'bg-[#62109F] border-[#62109F]' 
                                : 'border-gray-400 hover:border-[#62109F]'
                            }`}>
                              {checkedTimeSlots.has(slot._id) && (
                                <FaCheck className="text-white text-xs" />
                              )}
                            </div>
                          </div>
                          
                          {/* Checkmark for selected slot */}
                          {isSelected && (
                            <div className="absolute -top-1 right-7 w-6 h-6 bg-[#62109F] rounded-full flex items-center justify-center">
                              <FaCheck className="text-white text-xs" />
                            </div>
                          )}
                          
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-semibold text-[#62109F]">
                              Time Slot {index + 1}
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              isFull ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {isFull ? 'Full' : 'Available'}
                            </div>
                          </div>
                          
                          <div className="text-lg font-medium text-gray-700 mb-1">
                            {slot.startTime} - {slot.endTime}
                          </div>
                          
                          <div className="text-sm text-gray-600">
                            Booked: {bookedCount}/{slot.capacity} people
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>


              <div className="flex justify-end space-x-3 mb-4">
                <button
                  onClick={() => {
                    setShowAppointmentForm(false);
                    setSelectedService(null);
                    setAvailableSlots([]);
                  }}
                  className="px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors  cursor-pointer outline-none"
                >
                  Cancel
                </button>
                <button
                  onClick={appointmentFormik.handleSubmit}
                  disabled={appointmentFormik.isSubmitting}
                  className="px-6 py-2 bg-[#4D2FB2] text-white rounded-md hover:bg-[#62109F] transition-colors disabled:opacity-50  cursor-pointer outline-none"
                >
                  {appointmentFormik.isSubmitting ? "Booking..." : "Book Appointment"}
                </button>
              </div>

              <div className="bg-gradient-to-r from-[#B7A3E3] to-[#C47BE4] p-4 rounded-lg">
                <h4 className="font-semibold text-white mb-2">
                  How Appointment Booking Works
                </h4>
                <ul className="text-white text-sm space-y-1">
                  <li>• Select your preferred time slot above</li>
                  <li>• Confirm your booking details</li>
                  <li>• Arrive 5 minutes before your scheduled time</li>
                  <li>• No waiting in line - direct service!</li>
                </ul>
              </div>
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