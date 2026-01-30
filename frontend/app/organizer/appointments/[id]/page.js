"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { FaPlus, FaTrash, FaCalendarAlt, FaClock, FaArrowLeft } from "react-icons/fa";
import api from "../../../utils/api";
import Navbar from "../../../components/Navbar";
import ProtectedRoute from "../../../components/ProtectedRoute";

function AppointmentManagement() {
  const [service, setService] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlot, setNewSlot] = useState({
    date: "",
    startTime: "",
    endTime: "",
    capacity: 1
  });
  
  const router = useRouter();
  const params = useParams();
  const serviceId = params.id;

  useEffect(() => {
    if (serviceId) {
      fetchServiceData();
    }
  }, [serviceId]);

  const fetchServiceData = async () => {
    try {
      const serviceRes = await api.get(`/queue/services/${serviceId}`);
      setService(serviceRes.data.service);
      
      // Get appointments for this service
      const appointmentsRes = await api.get(`/queue/services/${serviceId}/appointments`);
      setAppointments(appointmentsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load appointment data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTimeSlot = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/queue/services/${serviceId}/timeslots`, newSlot);
      toast.success("Time slot added successfully!");
      setShowAddSlot(false);
      setNewSlot({ date: "", startTime: "", endTime: "", capacity: 1 });
      fetchServiceData();
    } catch (error) {
      console.error("Error adding time slot:", error);
      toast.error("Failed to add time slot");
    }
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      await api.delete(`/queue/timeslots/${slotId}`);
      toast.success("Time slot deleted successfully!");
      fetchServiceData();
    } catch (error) {
      console.error("Error deleting time slot:", error);
      toast.error("Failed to delete time slot");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#B7A3E3] to-[#C5B0CD]">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-xl text-[#62109F]">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#B7A3E3] to-[#C5B0CD]">
      <Navbar />
      <Toaster position="top-right" />
      
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <button
            onClick={() => router.push('/organizer/dashboard')}
            className="flex items-center space-x-2 text-[#62109F] hover:text-[#8C00FF] transition-colors mb-4  cursor-pointer outline-none"
          >
            <FaArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
          
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#62109F]">
                Appointment Management
              </h1>
              <p className="text-[#85409D]">{service?.title}</p>
            </div>
            <button
              onClick={() => setShowAddSlot(true)}
              className="bg-gradient-to-r from-[#4D2FB2] to-[#62109F] text-white px-4 sm:px-6 py-2 rounded-lg hover:from-[#62109F] hover:to-[#8C00FF] transition-all duration-300 flex items-center justify-center space-x-2 w-full sm:w-auto  cursor-pointer outline-none"
            >
              <FaPlus size={16} />
              <span className="hidden sm:inline">Add Time Slot</span>
              <span className="sm:hidden">Add Slot</span>
            </button>
          </div>
        </div>

        {/* Add Time Slot Modal */}
        {showAddSlot && (
          <div className="fixed inset-0 backdrop-blur-lg flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold mb-4 text-[#62109F]">Add Time Slot</h2>
              <form onSubmit={handleAddTimeSlot}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newSlot.date}
                    onChange={(e) => setNewSlot({...newSlot, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2]"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={newSlot.startTime}
                      onChange={(e) => setNewSlot({...newSlot, startTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={newSlot.endTime}
                      onChange={(e) => setNewSlot({...newSlot, endTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2]"
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newSlot.capacity}
                    onChange={(e) => setNewSlot({...newSlot, capacity: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4D2FB2]"
                    required
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddSlot(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer outline-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#4D2FB2] text-white rounded-md hover:bg-[#62109F] cursor-pointer outline-none"
                  >
                    Add Slot
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Appointments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {service?.timeSlots?.map((slot) => {
            const slotAppointments = appointments.filter(apt => 
              apt.startTime === slot.startTime && 
              apt.endTime === slot.endTime &&
              new Date(apt.date).toDateString() === new Date(slot.date).toDateString()
            );
            const bookedCount = slotAppointments.reduce((sum, apt) => sum + apt.groupSize, 0);
            
            return (
              <div key={slot._id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-2">
                    <FaCalendarAlt className="text-[#62109F]" />
                    <span className="font-semibold text-[#62109F]">
                      {new Date(slot.date).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteSlot(slot._id)}
                    className="text-red-500 hover:text-red-700 cursor-pointer"
                  >
                    <FaTrash size={16} />
                  </button>
                </div>
                
                <div className="flex items-center space-x-2 mb-2">
                  <FaClock className="text-[#85409D]" />
                  <span className="text-gray-700">
                    {slot.startTime} - {slot.endTime}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  Booked: {bookedCount}/{slot.capacity} people
                </div>
                
                <div className={`mb-3 px-3 py-1 rounded-full text-xs font-medium ${
                  bookedCount >= slot.capacity 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {bookedCount >= slot.capacity ? 'Full' : 'Available'}
                </div>
                
                {/* Show booked appointments */}
                {slotAppointments.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Bookings:</h4>
                    <div className="space-y-1">
                      {slotAppointments.map((apt) => (
                        <div key={apt._id} className="text-xs bg-gray-50 p-2 rounded">
                          <div className="font-medium">{apt.memberNames.join(', ')}</div>
                          <div className="text-gray-500">Group of {apt.groupSize}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {(!service?.timeSlots || service.timeSlots.length === 0) && (
          <div className="text-center py-12">
            <p className="text-[#62109F] text-lg font-medium">
              No time slots created yet
            </p>
            <p className="text-[#85409D]">
              Add time slots to allow appointment bookings
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProtectedAppointmentManagement() {
  return (
    <ProtectedRoute allowedRoles={[2]}>
      <AppointmentManagement />
    </ProtectedRoute>
  );
}