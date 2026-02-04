"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Image from "next/image";
import { FaHospital, FaUtensils, FaCut, FaBuilding, FaTimes, FaSearch, FaFilter } from "react-icons/fa";
import { useFormik } from "formik";
import * as Yup from "yup";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import api from "../../utils/api";
import Navbar from "../../components/Navbar";
import ProtectedRoute from "../../components/ProtectedRoute";
import { IoBulbOutline, IoCalendarOutline, IoPeopleOutline, IoTimeOutline, IoClipboardOutline } from "react-icons/io5";

function UserDashboard() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [selectedCalendarSlot, setSelectedCalendarSlot] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [serviceTypes, setServiceTypes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const servicesPerPage = 6;
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
      if (!selectedCalendarSlot) {
        toast.error('Please select a time slot from the calendar');
        return;
      }
      
      try {
        await api.post(`/queue/appointments`, {
          queueId: selectedService._id,
          groupSize: values.groupSize,
          memberNames: values.memberNames.slice(0, values.groupSize).map(name => name.trim()),
          date: selectedCalendarSlot.date,
          startTime: selectedCalendarSlot.startTime,
          endTime: selectedCalendarSlot.endTime
        });
        
        toast.success(`Appointment booked successfully for ${values.groupSize} people!`);
        setShowAppointmentForm(false);
        setSelectedService(null);
        setSelectedCalendarSlot(null);
        setCalendarEvents([]);
        appointmentFormik.resetForm();
        fetchServices();
      } catch (error) {
        console.error('Error booking appointment:', error);
        if (error.response?.status === 409) {
          toast.error('This time slot was just booked by someone else. Please select another time.');
          // Refresh calendar events
          handleAppointmentClick(selectedService, { stopPropagation: () => {} });
        } else {
          toast.error(error.response?.data?.message || 'Failed to book appointment');
        }
      }
    },
  });
  const router = useRouter();

  useEffect(() => {
    fetchServices();
    fetchServiceTypes();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchServices();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterType]);

  useEffect(() => {
    fetchServices();
  }, [currentPage]);

  const fetchServices = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterType && filterType !== 'all') {
        if (filterType === 'available') {
          params.append('available', 'true');
        } else {
          params.append('serviceType', filterType);
        }
      }
      params.append('page', currentPage.toString());
      params.append('limit', servicesPerPage.toString());
      
      const response = await api.get(`/queue/services?${params.toString()}`);
      
      let fetchedServices, pages;
      if (Array.isArray(response.data)) {
        fetchedServices = response.data;
        pages = 1;
      } else {
        fetchedServices = response.data.services || [];
        pages = response.data.totalPages || 1;
      }
      
      const servicesWithStatus = await Promise.all(
        fetchedServices.map(async (service) => {
          try {
            const statusResponse = await api.get(`/queue/services/${service._id}/status`);
            return { ...service, userStatus: statusResponse.data.status ? statusResponse.data : null };
          } catch (error) {
            return { ...service, userStatus: null };
          }
        })
      );
      setServices(servicesWithStatus);
      setTotalPages(pages);
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

  const fetchServiceTypes = async () => {
    try {
      const response = await api.get("/queue/service-types");
      setServiceTypes(response.data);
    } catch (error) {
      console.error("Error fetching service types:", error);
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
    
    // Load availability windows and booked slots
    try {
      const response = await api.get(`/queue/services/${service._id}/availability`);
      const { availabilityWindows, bookedSlots } = response.data;
      
      console.log('Raw availability data:', { availabilityWindows, bookedSlots }); // Debug log
      
      // Convert to calendar events
      const events = [];
      
      // Add availability windows as background events
      availabilityWindows.forEach(window => {
        // Parse date properly - window.date might be a Date object or string
        let dateStr;
        if (typeof window.date === 'string') {
          dateStr = window.date.split('T')[0]; // Get YYYY-MM-DD part
        } else {
          dateStr = new Date(window.date).toISOString().split('T')[0];
        }
        
        console.log('Processing window:', { date: dateStr, startTime: window.startTime, endTime: window.endTime }); // Debug log
        
        events.push({
          id: `availability-${window._id}`,
          title: 'Available',
          start: `${dateStr}T${window.startTime}`,
          end: `${dateStr}T${window.endTime}`,
          display: 'background',
          backgroundColor: '#E0F2FE',
          borderColor: '#0EA5E9'
        });
      });
      
      // Add booked slots as events
      bookedSlots.forEach(slot => {
        let dateStr;
        if (typeof slot.date === 'string') {
          dateStr = slot.date.split('T')[0];
        } else {
          dateStr = new Date(slot.date).toISOString().split('T')[0];
        }
        
        events.push({
          id: `booked-${slot._id}`,
          title: `Booked (${slot.groupSize} people)`,
          start: `${dateStr}T${slot.startTime}`,
          end: `${dateStr}T${slot.endTime}`,
          backgroundColor: '#FEE2E2',
          borderColor: '#EF4444',
          textColor: '#DC2626'
        });
      });
      
      console.log('Final calendar events:', events); // Debug log
      setCalendarEvents(events);
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast.error('Failed to load availability');
    }
    
    setShowAppointmentForm(true);
  };

  const handleDateSelect = (selectInfo) => {
    const start = new Date(selectInfo.start);
    const end = new Date(start.getTime() + 30 * 60000); // Add 30 minutes
    
    // Check if selected time is within availability window
    const isAvailable = calendarEvents.some(event => 
      event.display === 'background' && 
      new Date(event.start) <= start && 
      new Date(event.end) >= end
    );
    
    if (!isAvailable) {
      toast.error('Please select a time within the available window');
      return;
    }
    
    // Check for conflicts with booked slots
    const hasConflict = calendarEvents.some(event => 
      event.id.startsWith('booked-') && 
      new Date(event.start) < end && 
      new Date(event.end) > start
    );
    
    if (hasConflict) {
      toast.error('This time slot is already booked. Please select another time.');
      return;
    }
    
    setSelectedCalendarSlot({
      start: start.toISOString(),
      end: end.toISOString(),
      startTime: start.toTimeString().slice(0, 5),
      endTime: end.toTimeString().slice(0, 5),
      date: start.toISOString().split('T')[0]
    });
    
    toast.success(`Selected: ${start.toTimeString().slice(0, 5)} - ${end.toTimeString().slice(0, 5)}`);
  };

  const handleCardClick = (service, e) => {
    // Only navigate if clicking on the card itself, not buttons
    if (e.target.closest('button')) {
      return;
    }
    console.log('Navigating to service:', service._id);
    router.push(`/user/service/${service._id}`);
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
      
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-[#62109F] mb-8">Available Services</h1>
        
        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4D2FB2] focus:border-transparent outline-none bg-white shadow-sm"
            />
          </div>
          
          {/* Filter Dropdown */}
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4D2FB2] focus:border-transparent outline-none bg-white shadow-sm cursor-pointer min-w-[160px]"
            >
              <option value="all">All Services</option>
              <option value="available">Available Only</option>
              {serviceTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {services.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#62109F] text-lg font-medium">
              {searchTerm || filterType !== 'all' ? 'No services found matching your criteria' : 'No active services available'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
              <div
                key={service._id}
                className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full cursor-pointer"
                onClick={(e) => handleCardClick(service, e)}
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
                      <span className="font-medium">{service.isFull ? 'Capacity:' : 'Availability:'}</span> {service.servingCapacity || 0}/{service.maxCapacity}
                    </div>
                    <div className="text-sm text-[#85409D]">
                      <span className="font-medium">Waiting:</span> {service.waitingCount}
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-3">
                    {/* Status Badge Row */}
                    <div className="flex justify-between items-center">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        service.isFull 
                          ? "bg-red-100 text-red-800" 
                          : "bg-green-100 text-green-800"
                      }`}>
                        {service.isFull ? "Full" : "Available"}
                      </div>
                      
                      {service.userStatus && (
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          service.userStatus.status === 'serving' ? 'bg-green-100 text-green-800' :
                          service.userStatus.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {service.userStatus.status === 'serving' ? `🟢 Serving #${service.userStatus.tokenNumber}` :
                           service.userStatus.status === 'waiting' ? `🟡 Waiting #${service.userStatus.tokenNumber}` :
                           `✅ Complete #${service.userStatus.tokenNumber}`}
                        </div>
                      )}
                    </div>
                    
                    {/* Buttons Row */}
                    {(!service.userStatus || service.userStatus.status === 'complete') && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button 
                          onClick={(e) => handleJoinClick(service, e)}
                          className="flex-1 bg-gradient-to-r from-[#4D2FB2] to-[#62109F] text-white px-3 py-2 text-sm rounded-md hover:from-[#62109F] hover:to-[#8C00FF] transition-all duration-300 cursor-pointer outline-none"
                        >
                          {getButtonText(service)}
                        </button>
                        
                        <button 
                          onClick={(e) => handleAppointmentClick(service, e)}
                          className="flex-1 bg-gradient-to-r from-[#85409D] to-[#C47BE4] text-white px-3 py-2 text-sm rounded-md hover:from-[#C47BE4] hover:to-[#B7A3E3] transition-all duration-300 cursor-pointer outline-none"
                        >
                          Book Appointment
                        </button>
                      </div>
                    )}
                  </div>
                  
                </div>
              </div>
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-8 space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white text-[#62109F] border border-[#62109F] rounded-lg hover:bg-[#62109F] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      currentPage === page
                        ? 'bg-[#62109F] text-white'
                        : 'bg-white text-[#62109F] border border-[#62109F] hover:bg-[#62109F] hover:text-white'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white text-[#62109F] border border-[#62109F] rounded-lg hover:bg-[#62109F] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
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
          <div className="fixed inset-0 backdrop-blur-lg flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg z-10">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-[#62109F] flex items-center gap-2">
                    <IoCalendarOutline size={20} className="text-[#62109F]" />
                    Book Appointment - {selectedService.title}
                  </h2>
                  <button
                    onClick={() => {
                      setShowAppointmentForm(false);
                      setSelectedService(null);
                      setAvailableSlots([]);
                    }}
                    className="text-gray-500 hover:text-gray-700 outline-none cursor-pointer p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <FaTimes size={18} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Group Size and Names Form */}
                <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-base font-semibold text-[#62109F] mb-3 flex items-center gap-2">
                    <IoPeopleOutline size={18} className="text-[#62109F]" />
                    Booking Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Group Size
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2] text-sm"
                      />
                      {appointmentFormik.touched.groupSize && appointmentFormik.errors.groupSize && (
                        <div className="text-red-500 text-xs mt-1">
                          {appointmentFormik.errors.groupSize}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Member Names
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-32 overflow-y-auto">
                      {Array.from({ length: appointmentFormik.values.groupSize }, (_, index) => (
                        <input
                          key={index}
                          type="text"
                          placeholder={`Person ${index + 1} name`}
                          value={appointmentFormik.values.memberNames[index] || ''}
                          onChange={(e) => {
                            const newNames = [...appointmentFormik.values.memberNames];
                            newNames[index] = e.target.value;
                            appointmentFormik.setFieldValue('memberNames', newNames);
                          }}
                          onBlur={() => appointmentFormik.setFieldTouched(`memberNames[${index}]`, true)}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2] text-sm"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-base font-semibold text-[#62109F] mb-3 flex items-center gap-2">
                    <IoTimeOutline size={18} className="text-[#62109F]" />
                    Select Your Appointment Time
                  </h3>
                  
                  {selectedCalendarSlot && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 font-medium text-sm">
                        ✅ Selected: {selectedCalendarSlot.startTime} - {selectedCalendarSlot.endTime}
                      </p>
                    </div>
                  )}
                  
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <FullCalendar
                      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                      initialView="timeGridWeek"
                      headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek'
                      }}
                      events={calendarEvents}
                      selectable={true}
                      selectMirror={true}
                      select={handleDateSelect}
                      height={350}
                      slotMinTime="08:00:00"
                      slotMaxTime="20:00:00"
                      slotDuration="00:30:00"
                      snapDuration="00:30:00"
                      allDaySlot={false}
                      eventDisplay="block"
                      eventTextColor="#ffffff"
                      selectConstraint={{
                        start: '08:00',
                        end: '20:00'
                      }}
                      businessHours={{
                        daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
                        startTime: '08:00',
                        endTime: '20:00'
                      }}
                      eventClassNames="cursor-pointer"
                      dayHeaderClassNames="bg-[#F8F6FF] text-[#62109F] font-medium text-sm"
                      eventBackgroundColor="#62109F"
                      eventBorderColor="#4D2FB2"
                      selectColor="#C47BE4"
                      titleFormat={{ year: 'numeric', month: 'short', day: 'numeric' }}
                      dayHeaderFormat={{ weekday: 'short' }}
                      slotLabelFormat={{
                        hour: 'numeric',
                        minute: '2-digit',
                        omitZeroMinute: false,
                        meridiem: 'short'
                      }}
                      scrollTime="09:00:00"
                      scrollTimeReset={false}
                      nowIndicator={true}
                      slotEventOverlap={false}
                      eventOverlap={false}
                      expandRows={true}
                    />
                  </div>
                  
                  {/* Available Time Windows Display */}
                  <div className="mt-4 p-4 bg-gradient-to-r from-[#E0F2FE] to-[#F0F9FF] rounded-lg border border-blue-200">
                    <h4 className="text-sm font-semibold text-[#0EA5E9] mb-3 flex items-center gap-2">
                      <IoClipboardOutline size={16} className="text-[#0EA5E9]" />
                      Available Time Windows
                    </h4>
                    {calendarEvents.filter(event => event.display === 'background').length > 0 ? (
                      <div className="space-y-2">
                        {calendarEvents
                          .filter(event => event.display === 'background')
                          .map((event, index) => {
                            const startDateTime = event.start;
                            const endDateTime = event.end;
                            const datePart = startDateTime.split('T')[0];
                            const startTimePart = startDateTime.split('T')[1];
                            const endTimePart = endDateTime.split('T')[1];
                            
                            const [year, month, day] = datePart.split('-');
                            const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                            
                            const formattedDate = dateObj.toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            });
                            
                            const formatTime = (timeStr) => {
                              const [hours, minutes] = timeStr.split(':');
                              const hour24 = parseInt(hours);
                              const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
                              const ampm = hour24 >= 12 ? 'PM' : 'AM';
                              return `${hour12}:${minutes} ${ampm}`;
                            };
                            
                            const startTime = formatTime(startTimePart);
                            const endTime = formatTime(endTimePart);
                            
                            // Check if this window has any booked slots
                            const hasBookedSlots = calendarEvents.some(bookedEvent => 
                              bookedEvent.id.startsWith('booked-') &&
                              bookedEvent.start.split('T')[0] === datePart
                            );
                            
                            return (
                              <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-blue-100">
                                <div className="flex items-center space-x-3">
                                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                  <div>
                                    <p className="font-medium text-gray-800 text-sm">{formattedDate}</p>
                                    <p className="text-xs text-gray-600">{startTime} - {endTime}</p>
                                  </div>
                                </div>
                                <div className="text-xs text-blue-600 font-medium">
                                  {hasBookedSlots ? 'Partially Booked' : 'Available'}
                                </div>
                              </div>
                            );
                          })
                        }
                      </div>
                    ) : (
                      <div className="text-center py-3">
                        <p className="text-gray-600 text-sm">No availability windows set by organizer.</p>
                        <p className="text-xs text-gray-500 mt-1">Please contact the service provider.</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-600">
                    <div className="flex items-center justify-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
                        <span>Available</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                        <span>Booked</span>
                      </div>
                    </div>
                    <p className="mt-2 text-center">
                      Click and drag on the calendar to select a 30-minute slot.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-200">
                  <div className="bg-gradient-to-r from-[#B7A3E3] to-[#C47BE4] p-3 rounded-lg flex-1">
                    <h4 className="font-semibold text-white mb-1 text-sm flex items-center gap-2">
                      <IoBulbOutline size={18} className="text-yellow-400"/>
                      Quick Tips
                    </h4>
                    <ul className="text-white text-xs space-y-1">
                      <li>• Select time slot above</li>
                      <li>• Arrive 5 minutes early</li>
                      <li>• No waiting in line!</li>
                    </ul>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setShowAppointmentForm(false);
                        setSelectedService(null);
                        setAvailableSlots([]);
                      }}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer outline-none text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={appointmentFormik.handleSubmit}
                      disabled={appointmentFormik.isSubmitting || !selectedCalendarSlot}
                      className="px-4 py-2 bg-[#4D2FB2] text-white rounded-md hover:bg-[#62109F] transition-colors disabled:opacity-50 cursor-pointer outline-none text-sm"
                    >
                      {appointmentFormik.isSubmitting ? "Booking..." : "Book Appointment"}
                    </button>
                  </div>
                </div>
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