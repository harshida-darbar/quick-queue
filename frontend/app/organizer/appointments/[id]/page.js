"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { FaArrowLeft, FaCalendarAlt, FaUsers, FaUser } from "react-icons/fa";
import api from "../../../utils/api";
import Navbar from "../../../components/Navbar";
import ProtectedRoute from "../../../components/ProtectedRoute";

function AppointmentsPage() {
  const [service, setService] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const router = useRouter();
  const params = useParams();

  const serviceId = params.id;

  useEffect(() => {
    if (serviceId) {
      fetchServiceAndAppointments();
    }
  }, [serviceId]);

  const fetchServiceAndAppointments = async () => {
    try {
      // Fetch service details
      const serviceResponse = await api.get(`/queue/services/${serviceId}`);
      setService(serviceResponse.data.service);

      // Fetch service availability to get booked slots
      const availabilityResponse = await api.get(`/queue/services/${serviceId}/availability`);
      const { bookedSlots } = availabilityResponse.data;
      
      // Transform booked slots into appointments format
      const appointmentsData = bookedSlots.map(slot => ({
        ...slot,
        id: slot._id,
        user: {
          id: slot.bookedBy,
          name: slot.bookedUserName,
          profileImage: slot.bookedUserProfileImage
        }
      }));

      setAppointments(appointmentsData);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to fetch appointments");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleUserClick = async (userId) => {
    try {
      const response = await api.get(`/queue/user/${userId}`);
      setSelectedUser(response.data);
      setShowUserModal(true);
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast.error("Failed to fetch user details");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'booked':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#B7A3E3] to-[#C5B0CD]">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-xl text-[#62109F]">Loading appointments...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#B7A3E3] to-[#C5B0CD]">
      <Navbar />
      <Toaster position="top-right" />

      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 text-[#62109F] hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors cursor-pointer outline-none"
          >
            <FaArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-[#62109F]">
             Appointments - {service?.title}
            </h1>
            <p className="text-[#85409D] capitalize">{service?.serviceType}</p>
          </div>
        </div>

        {/* Appointments Table */}
        {appointments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-lg">
            <FaCalendarAlt size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Appointments Yet</h3>
            <p className="text-gray-500">Users haven't booked any appointments for this service.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[#4D2FB2] to-[#62109F] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Date & Time</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Booked By</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Group</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Members</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {appointments
                    .sort((a, b) => new Date(`${a.date}T${a.startTime}`) - new Date(`${b.date}T${b.startTime}`))
                    .map((appointment, index) => (
                      <tr key={appointment.id} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {new Date(appointment.date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div 
                            className="flex items-center cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors"
                            onClick={() => handleUserClick(appointment.user.id)}
                          >
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-[#85409D] flex items-center justify-center mr-3">
                              {appointment.user.profileImage ? (
                                <img
                                  src={`http://localhost:5000/api/profile/image/${appointment.user.profileImage}`}
                                  alt="Profile"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-medium text-white">
                                  {appointment.user.name?.charAt(0)}
                                </span>
                              )}
                            </div>
                            <span className="font-medium text-gray-900 text-sm">{appointment.user.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            <FaUsers className="text-[#85409D] mr-2 text-sm" />
                            <span className="font-medium text-gray-900 text-sm">{appointment.groupSize} people</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1">
                            {appointment.memberNames.slice(0, 3).map((name, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-[#F0F9FF] text-[#0EA5E9] rounded text-xs font-medium"
                              >
                                {name}
                              </span>
                            ))}
                            {appointment.memberNames.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                                +{appointment.memberNames.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary */}
        {appointments.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-[#4D2FB2] to-[#62109F] rounded-lg p-6 text-white">
            <h3 className="text-xl font-semibold mb-4">📊 Appointments Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{appointments.length}</p>
                <p className="text-sm opacity-90">Total Appointments</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {appointments.filter(apt => apt.status === 'booked').length}
                </p>
                <p className="text-sm opacity-90">Confirmed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {appointments.reduce((sum, apt) => sum + apt.groupSize, 0)}
                </p>
                <p className="text-sm opacity-90">Total People</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 backdrop-blur-lg flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl border border-[#B7A3E3]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#62109F]">User Details</h2>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold outline-none cursor-pointer"
              >
                ×
              </button>
            </div>
            
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-[#85409D] flex items-center justify-center mb-4">
                {selectedUser.profileImage ? (
                  <img
                    src={`http://localhost:5000/api/profile/image/${selectedUser.profileImage}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-white">
                    {selectedUser.name?.charAt(0)}
                  </span>
                )}
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{selectedUser.name}</h3>
                <p className="text-gray-600 text-sm mb-2">{selectedUser.email}</p>
                <span className="px-3 py-1 bg-[#B7A3E3] text-[#62109F] rounded-full text-xs font-medium">
                  {selectedUser.role === 2 ? 'Organizer' : 'User'}
                </span>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowUserModal(false)}
                className="px-4 py-2 bg-[#62109F] text-white rounded-md hover:bg-[#4D2FB2] transition-colors outline-none cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProtectedAppointmentsPage() {
  return (
    <ProtectedRoute allowedRoles={[2]}>
      <AppointmentsPage />
    </ProtectedRoute>
  );
}