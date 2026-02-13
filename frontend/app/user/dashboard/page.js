// quick-queue/frontend/app/user/dashboard/page.js

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import {
  FaHospital,
  FaUtensils,
  FaCut,
  FaBuilding,
  FaTimes,
  FaSearch,
  FaFilter,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { useFormik } from "formik";
import * as Yup from "yup";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import InfiniteScroll from "react-infinite-scroll-component";
import api from "../../utils/api";
import Navbar from "../../components/Navbar";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useTheme } from "../../context/ThemeContext";
import { getThemeClass } from "../../config/colors";
import {
  IoBulbOutline,
  IoCalendarOutline,
  IoPeopleOutline,
  IoTimeOutline,
  IoClipboardOutline,
} from "react-icons/io5";

function UserDashboard() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const theme = getThemeClass(isDark);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [selectedCalendarSlot, setSelectedCalendarSlot] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [serviceTypes, setServiceTypes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const servicesPerPage = 6;
  
  const appointmentFormik = useFormik({
    initialValues: {
      groupSize: 1,
      memberNames: [""],
    },
    validationSchema: Yup.object({
      groupSize: Yup.number()
        .min(1, "Group size must be at least 1")
        .max(
          selectedService?.maxCapacity || 20,
          `Group size cannot exceed ${selectedService?.maxCapacity || 20}`,
        )
        .required("Group size is required"),
      memberNames: Yup.array().of(Yup.string().required("Name is required")),
    }),
    onSubmit: async (values) => {
      if (!selectedCalendarSlot) {
        toast.error("Please select a time slot from the calendar");
        return;
      }

      try {
        await api.post(`/queue/appointments`, {
          queueId: selectedService._id,
          groupSize: values.groupSize,
          memberNames: values.memberNames
            .slice(0, values.groupSize)
            .map((name) => name.trim()),
          date: selectedCalendarSlot.date,
          startTime: selectedCalendarSlot.startTime,
          endTime: selectedCalendarSlot.endTime,
        });

        toast.success(
          `Appointment booked successfully for ${values.groupSize} people!`,
        );
        setShowAppointmentForm(false);
        setSelectedService(null);
        setSelectedCalendarSlot(null);
        setCalendarEvents([]);
        appointmentFormik.resetForm();
        fetchServices();
      } catch (error) {
        console.error("Error booking appointment:", error);
        if (error.response?.status === 409) {
          toast.error(
            "This time slot was just booked by someone else. Please select another time.",
          );
          // Refresh calendar events
          handleAppointmentClick(selectedService, {
            stopPropagation: () => {},
          });
        } else {
          toast.error(
            error.response?.data?.message || "Failed to book appointment",
          );
        }
      }
    },
  });
  const router = useRouter();

  useEffect(() => {
    fetchServices(true);
    fetchServiceTypes();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      setServices([]);
      setHasMore(true);
      fetchServices(true);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterType]);

  const fetchServices = async (reset = false) => {
    if (!reset && loadingMore) return;

    try {
      if (!reset) setLoadingMore(true);

      const pageToFetch = reset ? 1 : currentPage;
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (filterType && filterType !== "all") {
        if (filterType === "available") {
          params.append("available", "true");
        } else {
          params.append("serviceType", filterType);
        }
      }
      params.append("page", pageToFetch.toString());
      params.append("limit", servicesPerPage.toString());

      const response = await api.get(`/queue/services?${params.toString()}`);

      const fetchedServices = response.data.services;
      const totalPages = response.data.totalPages;

      const servicesWithStatus = await Promise.all(
        fetchedServices.map(async (service) => {
          try {
            const statusResponse = await api.get(
              `/queue/services/${service._id}/status`,
            );
            return {
              ...service,
              userStatus: statusResponse.data.status
                ? statusResponse.data
                : null,
            };
          } catch (error) {
            return { ...service, userStatus: null };
          }
        }),
      );

      if (reset) {
        setServices(servicesWithStatus);
        setCurrentPage(2);
      } else {
        setServices((prev) => [...prev, ...servicesWithStatus]);
        setCurrentPage((prev) => prev + 1);
      }

      setHasMore(pageToFetch < totalPages);
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
      memberNames: [""],
    },
    validationSchema: Yup.object({
      groupSize: Yup.number()
        .min(1, "Group size must be at least 1")
        .max(
          selectedService?.maxCapacity || 20,
          `Group size cannot exceed service capacity of ${selectedService?.maxCapacity || 20} people`,
        )
        .required("Group size is required"),
      memberNames: Yup.array().of(Yup.string().required("Name is required")),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await api.post(`/queue/services/${selectedService._id}/join`, {
          groupSize: values.groupSize,
          memberNames: values.memberNames.slice(0, values.groupSize),
        });
        
        const buttonText = getButtonText(selectedService);
        const successMessage = buttonText === "Join Queue" 
          ? `Successfully joined queue for ${values.groupSize} people!`
          : `Successfully ${buttonText.toLowerCase()}ed for ${values.groupSize} people!`;
        
        toast.success(successMessage);
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
      const response = await api.get(
        `/queue/services/${service._id}/availability`,
      );
      const { availabilityWindows, bookedSlots } = response.data;

      console.log("Raw availability data:", {
        availabilityWindows,
        bookedSlots,
      }); // Debug log

      // Convert to calendar events
      const events = [];
      const now = new Date();

      // Add availability windows as full background blocks (not split into slots)
      availabilityWindows.forEach((window) => {
        // Parse date properly
        let dateStr;
        if (typeof window.date === "string") {
          dateStr = window.date.split("T")[0];
        } else {
          dateStr = new Date(window.date).toISOString().split("T")[0];
        }

        // Ensure time is in HH:mm format (24-hour)
        const startTime = window.startTime.length === 5 ? window.startTime : window.startTime.padStart(5, '0');
        const endTime = window.endTime.length === 5 ? window.endTime : window.endTime.padStart(5, '0');

        const windowStart = new Date(`${dateStr}T${startTime}:00`);
        const windowEnd = new Date(`${dateStr}T${endTime}:00`);

        // Only show if window end is in the future
        if (windowEnd > now) {
          // Adjust start time if it's in the past
          const displayStart = windowStart < now ? now : windowStart;
          
          console.log("Processing window:", {
            date: dateStr,
            startTime: startTime,
            endTime: endTime,
            displayStart: displayStart.toISOString(),
            displayEnd: windowEnd.toISOString()
          });

          events.push({
            id: `availability-${window._id}`,
            title: "Available",
            start: displayStart.toISOString(),
            end: windowEnd.toISOString(),
            display: "background",
            backgroundColor: "#E0F2FE",
            borderColor: "#0EA5E9",
          });
        }
      });

      // Add booked slots as events
      bookedSlots.forEach((slot) => {
        let dateStr;
        if (typeof slot.date === "string") {
          dateStr = slot.date.split("T")[0];
        } else {
          dateStr = new Date(slot.date).toISOString().split("T")[0];
        }

        // Ensure time is in HH:mm format (24-hour)
        const startTime = slot.startTime.length === 5 ? slot.startTime : slot.startTime.padStart(5, '0');
        const endTime = slot.endTime.length === 5 ? slot.endTime : slot.endTime.padStart(5, '0');

        // Convert to 12-hour format
        const format12Hour = (timeStr) => {
          const [hours, minutes] = timeStr.split(':');
          const hour = parseInt(hours);
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
          return `${hour12}:${minutes} ${ampm}`;
        };

        const startTime12 = format12Hour(startTime);
        const endTime12 = format12Hour(endTime);

        console.log("Booked slot:", {
          date: dateStr,
          startTime: startTime,
          endTime: endTime,
          groupSize: slot.groupSize,
          bookedBy: slot.bookedUserName
        });

        events.push({
          id: `booked-${slot._id}`,
          title: `${startTime12} - ${endTime12}`,
          start: `${dateStr}T${startTime}:00`,
          end: `${dateStr}T${endTime}:00`,
          backgroundColor: "#EF4444",
          borderColor: "#DC2626",
          textColor: "#FFFFFF",
          display: "block",
          classNames: ['booked-event'],
          displayEventTime: false
        });
      });

      console.log("Final calendar events:", events); // Debug log
      setCalendarEvents(events);
    } catch (error) {
      console.error("Error fetching availability:", error);
      toast.error("Failed to load availability");
    }

    setShowAppointmentForm(true);
  };

  const handleDateSelect = (selectInfo) => {
    const start = new Date(selectInfo.start);
    const end = new Date(start.getTime() + 30 * 60000); // Add 30 minutes
    const now = new Date();

    // Check if selected time is in the past
    if (start < now) {
      toast.error("Cannot book appointments in the past. Please select a future time slot.");
      return;
    }

    // Check if selected time is within availability window
    const isAvailable = calendarEvents.some(
      (event) =>
        event.display === "background" &&
        new Date(event.start) <= start &&
        new Date(event.end) >= end,
    );

    if (!isAvailable) {
      toast.error("Please select a time within the available window");
      return;
    }

    // Check for conflicts with booked slots
    const hasConflict = calendarEvents.some(
      (event) =>
        event.id.startsWith("booked-") &&
        new Date(event.start) < end &&
        new Date(event.end) > start,
    );

    if (hasConflict) {
      toast.error(
        "This time slot is already booked. Please select another time.",
      );
      return;
    }

    const startTimeStr = start.toTimeString().slice(0, 5);
    const endTimeStr = end.toTimeString().slice(0, 5);

    // Convert to 12-hour format
    const format12Hour = (timeStr) => {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${hour12}:${minutes} ${ampm}`;
    };

    const startTime12 = format12Hour(startTimeStr);
    const endTime12 = format12Hour(endTimeStr);

    setSelectedCalendarSlot({
      start: start.toISOString(),
      end: end.toISOString(),
      startTime: startTimeStr,
      endTime: endTimeStr,
      date: start.toISOString().split("T")[0],
    });

    // Remove any existing selected event and add new one
    const updatedEvents = calendarEvents.filter(event => event.id !== 'selected-slot');
    updatedEvents.push({
      id: 'selected-slot',
      title: `${startTime12} - ${endTime12}`,
      start: start.toISOString(),
      end: end.toISOString(),
      backgroundColor: '#7c3aed',
      borderColor: '#6d28d9',
      textColor: '#ffffff',
      display: 'block',
      classNames: ['selected-event'],
      displayEventTime: false
    });
    setCalendarEvents(updatedEvents);

    toast.success(
      `Selected: ${startTime12} - ${endTime12}`,
    );
  };

  const handleCardClick = (service, e) => {
    // Only navigate if clicking on the card itself, not buttons
    if (e.target.closest("button")) {
      return;
    }
    console.log("Navigating to service:", service._id);
    router.push(`/user/service/${service._id}`);
  };

  const handleGroupSizeChange = (e) => {
    const newSize = parseInt(e.target.value) || 1;

    // Check if group size exceeds service capacity
    if (newSize > selectedService?.maxCapacity) {
      toast.error(`service capacity of ${selectedService.maxCapacity} people`);
      return;
    }

    const newNames = Array(newSize)
      .fill("")
      .map((_, i) => joinFormik.values.memberNames[i] || "");
    joinFormik.setFieldValue("groupSize", newSize);
    joinFormik.setFieldValue("memberNames", newNames);
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
    if ((service.servingCapacity || 0) >= service.maxCapacity) {
      return t('dashboard.joinQueue');
    }

    const serviceType = service.serviceType.toLowerCase();
    const buttonMapping = {
      hospital: t('dashboard.bookAppointment'),
      clinic: t('dashboard.bookAppointment'),
      doctor: t('dashboard.bookAppointment'),
      restaurant: t('dashboard.bookTable'),
      cafe: t('dashboard.bookTable'),
      salon: t('dashboard.bookSlot'),
      spa: t('dashboard.bookSlot'),
      gym: t('dashboard.bookSession'),
      bank: t('dashboard.getToken'),
      atm: t('dashboard.getToken'),
      library: t('dashboard.reserveSeat'),
      cinema: t('dashboard.bookTicket'),
      theater: t('dashboard.bookTicket'),
      carwash: t('dashboard.bookService'),
      mechanic: t('dashboard.bookService'),
      dentist: t('dashboard.bookAppointment'),
      pharmacy: t('dashboard.getMedicine'),
    };

    return buttonMapping[serviceType] || t('dashboard.bookAppointment');
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
        <h1 className={`text-3xl font-bold ${theme.textAccent} mb-8`}>
          {t('dashboard.availableServices')}
        </h1>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <FaSearch
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder={t('dashboard.searchServices')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.trim())}
              className={`w-full pl-10 pr-4 py-3 border ${theme.border} rounded-lg focus:ring-2 focus:ring-[#4D2FB2] focus:border-transparent outline-none ${theme.input} shadow-sm`}
            />
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <FaFilter
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={14}
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`pl-10 pr-8 py-3 border ${theme.border} rounded-lg focus:ring-2 focus:ring-[#4D2FB2] focus:border-transparent outline-none ${theme.input} shadow-sm cursor-pointer min-w-[160px]`}
            >
              <option value="all" className={theme.cardBg}>{t('dashboard.allServices')}</option>
              {serviceTypes.map((type) => (
                <option key={type} value={type} className={theme.cardBg}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {services.length === 0 && !loading ? (
          <div className="text-center py-12">
            <p className={`${theme.textAccent} text-lg font-medium`}>
              {searchTerm || filterType !== "all"
                ? "No services found matching your criteria"
                : "No active services available"}
            </p>
          </div>
        ) : (
          <InfiniteScroll
            dataLength={services.length}
            next={fetchMoreServices}
            scrollThreshold={0.8}
            hasMore={hasMore}
            loader={
              <div className="flex justify-center items-center py-8">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#62109F]"></div>
                  <span className="text-[#62109F] font-medium">
                    Loading more services...
                  </span>
                </div>
              </div>
            }
            endMessage={
              <div className="text-center py-8">
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#B7A3E3] to-[#C47BE4] text-white rounded-full">
                  <span className="text-sm font-medium">
                    {" "}
                    You've seen all services!
                  </span>
                </div>
              </div>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service, index) => {
                return (
                  <div
                    key={service._id}
                    className={`${theme.cardBg} rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full cursor-pointer transform hover:scale-105`}
                    onClick={(e) => handleCardClick(service, e)}
                  >
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center mb-4">
                        {getServiceIcon(service.serviceType)}
                        <div className="ml-3">
                          <h3 className={`text-xl font-semibold ${theme.textAccent}`}>
                            {service.title}
                          </h3>
                          <p className={`text-sm ${theme.textSecondary} capitalize`}>
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

                      <p className={`${theme.textSecondary} mb-2 flex-1 min-h-[3rem]`}>
                        {service.description}
                      </p>

                      {service.address && (
                        <p className={`text-xs ${theme.textMuted} mb-4 line-clamp-2 flex items-start gap-1`}>
                          <FaMapMarkerAlt className="mt-0.5 flex-shrink-0" size={12} />
                          <span>{service.address}</span>
                        </p>
                      )}

                      <div className="flex justify-between items-center mb-4 mt-auto">
                        <div className={`text-sm ${theme.textSecondary}`}>
                          <span className="font-medium">
                            {(service.servingCapacity || 0) >= service.maxCapacity ? t('dashboard.capacity') : t('dashboard.availability')}:
                          </span>{" "}
                          {service.servingCapacity || 0}/{service.maxCapacity}
                        </div>
                        <div className={`text-sm ${theme.textSecondary}`}>
                          <span className="font-medium">{t('dashboard.waiting')}:</span>{" "}
                          {service.waitingCount}
                        </div>
                      </div>

                      <div className="flex justify-between items-center mb-3">
                        <div className={`text-lg font-bold ${theme.textAccent}`}>
                          ₹{service.price || 0}
                        </div>
                      </div>

                      <div className="flex flex-col space-y-3">
                        {/* Status Badge Row */}
                        <div className="flex justify-between items-center">
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              (service.servingCapacity || 0) >= service.maxCapacity
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {(service.servingCapacity || 0) >= service.maxCapacity ? t('dashboard.full') : t('dashboard.available')}
                          </div>

                          {service.userStatus && (
                            <div
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                service.userStatus.status === "serving"
                                  ? "bg-green-100 text-green-800"
                                  : service.userStatus.status === "waiting"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {service.userStatus.status === "serving"
                                ? `🟢 ${t('dashboard.serving')} #${service.userStatus.tokenNumber}`
                                : service.userStatus.status === "waiting"
                                  ? `🟡 ${t('dashboard.waiting')} #${service.userStatus.tokenNumber}`
                                  : `✅ ${t('dashboard.complete')} #${service.userStatus.tokenNumber}`}
                            </div>
                          )}
                        </div>

                        {/* Buttons Row */}
                        {(!service.userStatus ||
                          service.userStatus.status === "complete") && (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={(e) => handleJoinClick(service, e)}
                              className="flex-1 bg-gradient-to-r from-[#4D2FB2] to-[#62109F] text-white px-3 py-2 text-sm rounded-md hover:from-[#62109F] hover:to-[#8C00FF] transition-all duration-300 cursor-pointer outline-none"
                            >
                              {getButtonText(service)}
                            </button>

                            <button
                              onClick={(e) =>
                                handleAppointmentClick(service, e)
                              }
                              className="flex-1 bg-gradient-to-r from-[#85409D] to-[#C47BE4] text-white px-3 py-2 text-sm rounded-md hover:from-[#C47BE4] hover:to-[#B7A3E3] transition-all duration-300 cursor-pointer outline-none"
                            >
                              {t('dashboard.bookAppointment')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </InfiniteScroll>
        )}

        {/* Join Queue Modal */}
        {showJoinForm && selectedService && (
          <div className="fixed inset-0 backdrop-blur-lg flex items-center justify-center z-50">
            <div className={`${theme.cardBg} rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-xl font-bold ${theme.textAccent}`}>
                  Join {selectedService.title}
                </h2>
                <button
                  onClick={() => {
                    setShowJoinForm(false);
                    setSelectedService(null);
                    joinFormik.resetForm(); 
                  }}
                  className={`${theme.textMuted} hover:${theme.textPrimary} outline-none cursor-pointer`}
                >
                  <FaTimes size={20} />
                </button>
              </div>

              <form onSubmit={joinFormik.handleSubmit}>
                <div className="mb-4">
                  <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>
                    {t('forms.howManyPeople')}
                  </label>
                  <input
                    name="groupSize"
                    type="number"
                    min="1"
                    max={selectedService?.maxCapacity || 20}
                    value={joinFormik.values.groupSize}
                    onChange={handleGroupSizeChange}
                    onBlur={joinFormik.handleBlur}
                    className={`w-full px-3 py-2 border ${theme.border} rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2] ${theme.input}`}
                  />
                  {joinFormik.touched.groupSize &&
                    joinFormik.errors.groupSize && (
                      <div className="text-red-500 text-sm mt-1">
                        {joinFormik.errors.groupSize}
                      </div>
                    )}
                </div>

                {/* Member Names */}
                {joinFormik.values.groupSize > 0 && (
                  <div className="mb-4">
                    <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>
                      {t('forms.enterNames')}
                    </label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {Array.from(
                        { length: joinFormik.values.groupSize },
                        (_, index) => (
                          <div key={index}>
                            <input
                              type="text"
                              placeholder={`Person ${index + 1} name`}
                              value={joinFormik.values.memberNames[index] || ""}
                              onChange={(e) => {
                                const newNames = [
                                  ...joinFormik.values.memberNames,
                                ];
                                newNames[index] = e.target.value;
                                joinFormik.setFieldValue(
                                  "memberNames",
                                  newNames,
                                );
                              }}
                              onBlur={() =>
                                joinFormik.setFieldTouched(
                                  `memberNames[${index}]`,
                                  true,
                                )
                              }
                              className={`w-full px-3 py-2 border ${theme.border} rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2] ${theme.input}`}
                            />
                            {joinFormik.touched.memberNames?.[index] &&
                              joinFormik.errors.memberNames?.[index] && (
                                <div className="text-red-500 text-sm mt-1">
                                  Name is required
                                </div>
                              )}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

                <div className={`${isDark ? 'bg-slate-700' : 'bg-gray-50'} p-3 rounded-md mb-4`}>
                  <p className={`text-sm ${theme.textSecondary}`}>
                    <span className="font-medium">{t('forms.service')}:</span>{" "}
                    {selectedService.title}
                  </p>
                  <p className={`text-sm ${theme.textSecondary}`}>
                    <span className="font-medium">{t('forms.currentQueue')}:</span>{" "}
                    {selectedService.servingCapacity || 0}/
                    {selectedService.maxCapacity} {t('forms.capacityUsed')},{" "}
                    {selectedService.waitingCount} {t('forms.waiting')}
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
                    className={`px-4 py-2 ${theme.textSecondary} border ${theme.border} rounded-md transition-colors outline-none cursor-pointer ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                  >
                    {t('forms.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={joinFormik.isSubmitting}
                    className="px-4 py-2 bg-[#4D2FB2] text-white rounded-md hover:bg-[#62109F] transition-colors disabled:opacity-50 outline-none cursor-pointer"
                  >
                    {joinFormik.isSubmitting
                      ? t('forms.joining')
                      : getButtonText(selectedService)}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Appointment Booking Modal */}
        {showAppointmentForm && selectedService && (
          <div className="fixed inset-0 backdrop-blur-lg flex items-center justify-center z-50 p-4">
            <div className={`${theme.cardBg} rounded-lg w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl`}>
              <div className={`sticky top-0 ${theme.cardBg} border-b ${theme.border} px-6 py-4 rounded-t-lg z-10`}>
                <div className="flex justify-between items-center">
                  <h2 className={`text-xl font-bold ${theme.textAccent} flex items-center gap-2`}>
                    <IoCalendarOutline size={20} className={theme.textAccent} />
                   {t('dashboard.bookAppointment')} - {selectedService.title}
                  </h2>
                  <button
                    onClick={() => {
                      setShowAppointmentForm(false);
                      setSelectedService(null);
                      setAvailableSlots([]);
                    }}
                    className={`${theme.textMuted} hover:${theme.textPrimary} outline-none cursor-pointer p-2 rounded-full transition-colors ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
                  >
                    <FaTimes size={18} />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Group Size and Names Form */}
                <div className={`mb-6 ${isDark ? 'bg-slate-700' : 'bg-gray-50'} p-4 rounded-lg`}>
                  <h3 className={`text-base font-semibold ${theme.textAccent} mb-3 flex items-center gap-2`}>
                    <IoPeopleOutline size={18} className={theme.textAccent} />
                    {t('forms.bookingDetails')}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>
                        {t('forms.groupSize')}
                      </label>
                      <input
                        name="groupSize"
                        type="number"
                        min="1"
                        max={selectedService?.maxCapacity || 20}
                        value={appointmentFormik.values.groupSize}
                        onChange={(e) => {
                          const newSize = parseInt(e.target.value) || 1;
                          const newNames = Array(newSize)
                            .fill("")
                            .map(
                              (_, i) =>
                                appointmentFormik.values.memberNames[i] || "",
                            );
                          appointmentFormik.setFieldValue("groupSize", newSize);
                          appointmentFormik.setFieldValue(
                            "memberNames",
                            newNames,
                          );
                        }}
                        onBlur={appointmentFormik.handleBlur}
                        className={`w-full px-3 py-2 border ${theme.border} rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2] text-sm ${theme.input}`}
                      />
                      {appointmentFormik.touched.groupSize &&
                        appointmentFormik.errors.groupSize && (
                          <div className="text-red-500 text-xs mt-1">
                            {appointmentFormik.errors.groupSize}
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>
                      {t('forms.memberNames')}
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-32 overflow-y-auto">
                      {Array.from(
                        { length: appointmentFormik.values.groupSize },
                        (_, index) => (
                          <input
                            key={index}
                            type="text"
                            placeholder={`Person ${index + 1} name`}
                            value={
                              appointmentFormik.values.memberNames[index] || ""
                            }
                            onChange={(e) => {
                              const newNames = [
                                ...appointmentFormik.values.memberNames,
                              ];
                              newNames[index] = e.target.value;
                              appointmentFormik.setFieldValue(
                                "memberNames",
                                newNames,
                              );
                            }}
                            onBlur={() =>
                              appointmentFormik.setFieldTouched(
                                `memberNames[${index}]`,
                                true,
                              )
                            }
                            className={`px-3 py-2 border ${theme.border} rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2] text-sm ${theme.input}`}
                          />
                        ),
                      )}
                    </div>
                  </div>
                </div>
 
                <div className="mb-6">
                  <h3 className={`text-base font-semibold ${theme.textAccent} mb-3 flex items-center gap-2`}>
                    <IoTimeOutline size={18} className={theme.textAccent} />
                    {t('forms.selectAppointmentTime')}
                  </h3>

                  {selectedCalendarSlot && (
                    <div className={`mb-4 p-3 border rounded-lg ${isDark ? 'bg-green-900/30 border-green-700 text-white' : 'bg-green-50 border-green-200 text-green-800'}`}>
                      <p className="font-medium text-sm">
                        ✅ {t('forms.selected')}: {selectedCalendarSlot.startTime} -{" "}
                        {selectedCalendarSlot.endTime}
                      </p>
                    </div>
                  )}

                  <div className={`border ${theme.border} rounded-lg overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-white'}`}>
                    <style jsx global>{`
                      /* Booked slots styling - red background */
                      .fc-event.booked-event {
                        background-color: #EF4444 !important;
                        border-color: #DC2626 !important;
                        color: white !important;
                      }
                      
                      .fc-event.booked-event .fc-event-time {
                        display: none !important;
                      }
                      
                      .fc-event.booked-event .fc-event-title {
                        font-size: 11px !important;
                        font-weight: 700 !important;
                        color: white !important;
                        text-align: center !important;
                        white-space: nowrap !important;
                        overflow: visible !important;
                        line-height: 1.2 !important;
                      }
                      
                      .fc-event.booked-event .fc-event-main {
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        height: 100% !important;
                        white-space: nowrap !important;
                        padding: 2px 4px !important;
                      }
                      
                      .dark .fc-event.booked-event {
                        background-color: #DC2626 !important;
                        border-color: #B91C1C !important;
                        color: white !important;
                      }

                      /* Selected slot styling - purple with white text */
                      .fc-event.selected-event {
                        background-color: #7c3aed !important;
                        border-color: #6d28d9 !important;
                        color: white !important;
                        border-width: 2px !important;
                      }
                      
                      .fc-event.selected-event .fc-event-time {
                        display: none !important;
                      }
                      
                      .fc-event.selected-event .fc-event-title {
                        font-size: 11px !important;
                        font-weight: 700 !important;
                        color: white !important;
                        text-align: center !important;
                        white-space: nowrap !important;
                        overflow: visible !important;
                        line-height: 1.2 !important;
                      }
                      
                      .fc-event.selected-event .fc-event-main {
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        height: 100% !important;
                        white-space: nowrap !important;
                        padding: 2px 4px !important;
                      }
                      
                      .dark .fc-event.selected-event {
                        background-color: #7c3aed !important;
                        border-color: #6d28d9 !important;
                        color: white !important;
                      }

                      .dark .fc-theme-standard .fc-scrollgrid {
                        border-color: #4b5563;
                      }
                      .dark .fc-theme-standard th,
                      .dark .fc-theme-standard td {
                        border-color: #4b5563;
                      }
                      .dark .fc-theme-standard .fc-scrollgrid-sync-table {
                        background-color: #374151;
                      }
                      .dark .fc-col-header-cell {
                        background-color: #374151 !important;
                        color: white !important;
                      }
                      .dark .fc-timegrid-slot-label {
                        color: white !important;
                      }
                      .dark .fc-toolbar-title {
                        color: white !important;
                      }
                      .dark .fc-button {
                        background-color: #6366f1 !important;
                        border-color: #6366f1 !important;
                        color: white !important;
                      }
                      .dark .fc-button:hover {
                        background-color: #4f46e5 !important;
                      }
                      .dark .fc-timegrid-axis {
                        background-color: #374151;
                      }
                      .dark .fc-timegrid-slot {
                        border-color: #4b5563;
                      }
                      .dark .fc-event {
                        background-color: #7f1d1d !important;
                        border-color: #dc2626 !important;
                        color: #fecaca !important;
                      }
                      
                      /* Event text styling */
                      .fc-timegrid-event {
                        font-size: 14px !important;
                        font-weight: 700 !important;
                        padding: 6px 8px !important;
                      }
                      .fc-event-time {
                        font-size: 13px !important;
                        font-weight: 700 !important;
                        display: block !important;
                        color: white !important;
                      }
                      .fc-event-title {
                        font-size: 14px !important;
                        font-weight: 700 !important;
                        display: block !important;
                        margin-top: 2px !important;
                        color: white !important;
                      }
                      .fc-event-main {
                        color: white !important;
                      }
                    `}</style>
                    <FullCalendar
                      plugins={[
                        dayGridPlugin,
                        timeGridPlugin,
                        interactionPlugin,
                      ]}
                      initialView="timeGridWeek"
                      headerToolbar={{
                        left: "prev,next today",
                        center: "title",
                        right: "dayGridMonth,timeGridWeek",
                      }}
                      events={calendarEvents}
                      selectable={true}
                      selectMirror={true}
                      select={handleDateSelect}
                      height={500}
                      slotMinTime="08:00:00"
                      slotMaxTime="20:00:00"
                      slotDuration="00:15:00"
                      snapDuration="00:05:00"
                      allDaySlot={false}
                      eventDisplay="block"
                      eventTextColor="#ffffff"
                      selectConstraint={{
                        start: "08:00",
                        end: "20:00",
                      }}
                      businessHours={{
                        daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
                        startTime: "08:00",
                        endTime: "20:00",
                      }}
                      eventClassNames="cursor-pointer"
                      dayHeaderClassNames="bg-[#F8F6FF] text-[#62109F] font-medium text-sm"
                      eventBackgroundColor="#62109F"
                      eventBorderColor="#4D2FB2"
                      titleFormat={{
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }}
                      dayHeaderFormat={{ weekday: "short" }}
                      slotLabelFormat={{
                        hour: "numeric",
                        minute: "2-digit",
                        omitZeroMinute: false,
                        meridiem: "short",
                      }}
                      eventTimeFormat={{
                        hour: "2-digit",
                        minute: "2-digit",
                        meridiem: false,
                        hour12: false
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
                  <div className={`mt-4 p-4 bg-gradient-to-r rounded-lg border ${isDark ? 'from-blue-900/30 to-blue-800/30 border-blue-700' : 'from-[#E0F2FE] to-[#F0F9FF] border-blue-200'}`}>
                    <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-blue-300' : 'text-[#0EA5E9]'}`}>
                      <IoClipboardOutline
                        size={16}
                        className={isDark ? 'text-blue-300' : 'text-[#0EA5E9]'}
                      />
                      {t('forms.availableTimeWindows')}
                    </h4>
                    {(() => {
                      // Generate 30-minute slots from availability windows
                      const availableSlots = [];
                      const now = new Date();
                      
                      calendarEvents
                        .filter((event) => event.display === "background")
                        .forEach((window) => {
                          const windowStart = new Date(window.start);
                          const windowEnd = new Date(window.end);
                          
                          // Generate 30-min slots
                          let currentSlotStart = new Date(windowStart);
                          
                          while (currentSlotStart < windowEnd) {
                            const currentSlotEnd = new Date(currentSlotStart.getTime() + 30 * 60000);
                            
                            // Only include future slots
                            if (currentSlotEnd > now) {
                              // Check if this slot overlaps with any booked slot
                              const hasConflict = calendarEvents.some(
                                (bookedEvent) =>
                                  bookedEvent.id.startsWith("booked-") &&
                                  new Date(bookedEvent.start) < currentSlotEnd &&
                                  new Date(bookedEvent.end) > currentSlotStart
                              );
                              
                              if (!hasConflict) {
                                availableSlots.push({
                                  start: currentSlotStart,
                                  end: currentSlotEnd
                                });
                              }
                            }
                            
                            currentSlotStart = currentSlotEnd;
                          }
                        });

                      return availableSlots.length > 0 ? (
                        <div className="space-y-2">
                          {availableSlots.map((slot, index) => {
                            const startDate = slot.start;
                            const endDate = slot.end;

                            const formattedDate = startDate.toLocaleDateString(
                              "en-US",
                              {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              },
                            );

                            const formatTime = (date) => {
                              const hours = date.getHours();
                              const minutes = date.getMinutes();
                              const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
                              const ampm = hours >= 12 ? "PM" : "AM";
                              const minutesStr = minutes.toString().padStart(2, '0');
                              return `${hour12}:${minutesStr} ${ampm}`;
                            };

                            const startTime = formatTime(startDate);
                            const endTime = formatTime(endDate);

                            return (
                              <div
                                key={index}
                                className={`flex items-center justify-between p-3 rounded-lg shadow-sm border ${isDark ? 'bg-slate-600 border-blue-700' : 'bg-white border-blue-100'}`}
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                  <div>
                                    <p className={`font-medium text-sm ${theme.textPrimary}`}>
                                      {formattedDate}
                                    </p>
                                    <p className={`text-xs ${theme.textPrimary}`}>
                                      {startTime} - {endTime}
                                    </p>
                                  </div>
                                </div>
                                <div className={`text-xs font-medium ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                                  {t('forms.available')}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-3">
                          <p className={`${theme.textSecondary} text-sm`}>
                            {t('organizer.noAvailabilityWindows')}
                          </p>
                          <p className={`text-xs ${theme.textMuted} mt-1`}>
                            {t('organizer.pleaseContact')}
                          </p>
                        </div>
                      );
                    })()}
                  </div>

                  <div className={`mt-3 text-xs ${theme.textSecondary}`}>
                    <div className="flex items-center justify-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
                        <span>{t('forms.available')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                        <span>{t('forms.booked')}</span>
                      </div>
                    </div>
                    <p className="mt-2 text-center">
                      {t('forms.clickDrag')}
                    </p>
                  </div>
                </div>

                <div className={`flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t ${theme.border}`}>
                  <div className={`bg-gradient-to-r p-3 rounded-lg flex-1 ${isDark ? 'from-slate-700 to-slate-600' : 'from-[#B7A3E3] to-[#C47BE4]'}`}>
                    <h4 className="font-semibold text-white mb-1 text-sm flex items-center gap-2">
                      <IoBulbOutline size={18} className={isDark ? 'text-yellow-300' : 'text-yellow-400'} />
                      {t('forms.quickTips')}
                    </h4>
                    <ul className={`text-xs space-y-1 ${isDark ? 'text-gray-200' : 'text-white'}`}>
                      <li>• {t('forms.selectTimeSlot')}</li>
                      <li>• {t('forms.arriveEarly')}</li>
                      <li>• {t('forms.noWaiting')}</li>
                    </ul>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setShowAppointmentForm(false);
                        setSelectedService(null);
                        setAvailableSlots([]);
                      }}
                      className={`px-4 py-2 ${theme.textSecondary} border ${theme.border} rounded-md transition-colors cursor-pointer outline-none text-sm ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-50'}`}
                    >
                      {t('forms.cancel')}
                    </button>
                    <button
                      onClick={appointmentFormik.handleSubmit}
                      disabled={
                        appointmentFormik.isSubmitting || !selectedCalendarSlot
                      }
                      className="px-4 py-2 bg-[#402597] text-white rounded-md hover:bg-[#62109F] transition-colors disabled:opacity-50 cursor-pointer outline-none text-sm"
                    >
                      {appointmentFormik.isSubmitting
                        ? t('forms.booking')
                        : t('dashboard.bookAppointment')}
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
