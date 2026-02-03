"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { IoCalendarOutline, IoTimeOutline, IoPeopleOutline, IoArrowBack } from "react-icons/io5";
import api from "../../utils/api";
import Navbar from "../../components/Navbar";
import ProtectedRoute from "../../components/ProtectedRoute";

function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchMyAppointments();
  }, []);

  const fetchMyAppointments = async () => {
    try {
      const response = await api.get("/queue/my-appointments");
      setAppointments(response.data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to fetch appointments");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#A7AAE1] to-[#C5B0CD]">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-xl text-[#62109F]">Loading appointments...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#A7AAE1] to-[#C5B0CD]">
      <Navbar />
      <Toaster position="top-right" />
      
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 text-[#62109F] hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors cursor-pointer outline-none"
          >
            <IoArrowBack size={20} />
          </button>
          <h1 className="text-3xl font-bold text-[#62109F] flex items-center gap-3">
            <IoCalendarOutline size={32} />
            My Appointments
          </h1>
        </div>

        {appointments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-lg">
            <IoCalendarOutline size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Appointments Yet</h3>
            <p className="text-gray-500 mb-4">You haven't booked any appointments.</p>
            <button
              onClick={() => router.push('/user/dashboard')}
              className="px-4 py-2 bg-[#4D2FB2] text-white rounded-md hover:bg-[#62109F] transition-colors"
            >
              Browse Services
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {appointments.map((appointment) => (
              <div
                key={appointment._id}
                className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#62109F]">
                    {appointment.service.title}
                  </h3>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    Booked
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <IoCalendarOutline size={16} className="text-[#85409D]" />
                    <span className="text-sm text-gray-700">
                      {formatDate(appointment.date)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <IoTimeOutline size={16} className="text-[#85409D]" />
                    <span className="text-sm text-gray-700">
                      {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <IoPeopleOutline size={16} className="text-[#85409D]" />
                    <span className="text-sm text-gray-700">
                      {appointment.groupSize} people
                    </span>
                  </div>

                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Organizer:</p>
                    <p className="text-sm font-medium text-gray-800">
                      {appointment.service.organizer.name}
                    </p>
                  </div>

                  {appointment.memberNames && appointment.memberNames.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-600 mb-2">Group Members:</p>
                      <div className="flex flex-wrap gap-1">
                        {appointment.memberNames.map((name, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-[#F0F9FF] text-[#0EA5E9] rounded text-xs"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProtectedMyAppointments() {
  return (
    <ProtectedRoute allowedRoles={[3]}>
      <MyAppointments />
    </ProtectedRoute>
  );
}