"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { FaHospital, FaUtensils, FaCut, FaBuilding } from "react-icons/fa";
import api from "../../../utils/api";
import Navbar from "../../../components/Navbar";
import { IoArrowBack } from "react-icons/io5";

export default function ServiceManagement({ params }) {
  const resolvedParams = use(params);
  const [service, setService] = useState(null);
  const [servingUsers, setServingUsers] = useState([]);
  const [waitingUsers, setWaitingUsers] = useState([]);
  const [completedUsers, setCompletedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchServiceDetails();
    const interval = setInterval(fetchServiceDetails, 5000);
    return () => clearInterval(interval);
  }, [resolvedParams.id]);

  const fetchServiceDetails = async () => {
    try {
      const response = await api.get(`/queue/services/${resolvedParams.id}`);
      console.log('Service data:', response.data.service);
      console.log('Serving capacity:', response.data.service.servingCapacity);
      setService(response.data.service);
      setServingUsers(response.data.servingUsers);
      setWaitingUsers(response.data.waitingUsers);
      setCompletedUsers(response.data.completedUsers || []);
    } catch (error) {
      console.error("Error fetching service details:", error);
      toast.error("Failed to fetch service details");
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToServing = async (entryId) => {
    try {
      await api.patch(`/queue/services/${resolvedParams.id}/serving`, {
        entryId,
      });
      toast.success("User moved to serving!");
      fetchServiceDetails();
    } catch (error) {
      console.error("Error moving to serving:", error);
      toast.error(
        error.response?.data?.message || "Error moving user to serving",
      );
    }
  };

  const handleMoveToWaiting = async (entryId) => {
    try {
      await api.patch(`/queue/services/${resolvedParams.id}/waiting`, {
        entryId,
      });
      toast.success("User moved to waiting!");
      fetchServiceDetails();
    } catch (error) {
      console.error("Error moving to waiting:", error);
      toast.error("Error moving user to waiting");
    }
  };

  const handleMarkComplete = async (entryId) => {
    const entry = servingUsers.find(u => u._id === entryId);
    setSelectedEntry(entry);
    setShowConfirmModal(true);
  };

  const confirmComplete = async () => {
    try {
      await api.patch(`/queue/services/${resolvedParams.id}/complete`, {
        entryId: selectedEntry._id,
      });
      toast.success("User marked as complete!");
      setShowConfirmModal(false);
      setSelectedEntry(null);
      fetchServiceDetails();
    } catch (error) {
      console.error("Error marking complete:", error);
      toast.error("Error marking user as complete");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#B7A3E3] to-[#C5B0CD]">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-xl text-[#62109F]">
            Loading service management...
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#B7A3E3] to-[#C5B0CD]">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-xl text-red-600">Service not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#B7A3E3] to-[#C5B0CD]">
      <Navbar />

      <div className="max-w-6xl mx-auto p-6">
        <button
          onClick={() => router.back()}
          className="mb-6 text-[#4D2FB2] hover:text-[#62109F] flex items-center font-medium outline-none"
        >
          <IoArrowBack size={20} className="cursor-pointer"/> Back to Dashboard
        </button>

        {/* Service Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              {getServiceIcon(service.serviceType)}
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-[#62109F]">
                  {service.title}
                </h1>
                <p className="text-[#85409D] capitalize">
                  {service.serviceType}
                </p>
              </div>
            </div>
            <div
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                service.status === "active"
                  ? "bg-green-100 text-green-800 capitalize"
                  : "bg-gray-100 text-gray-800 capitalize"
              }`}
            >
              {service.status}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gradient-to-br from-[#B7A3E3] to-[#C47BE4] rounded-lg">
              <div className="text-2xl font-bold text-white">
                {service.servingCapacity || 0}
              </div>
              <div className="text-sm text-white opacity-90">
                People Serving
              </div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-[#85409D] to-[#C47BE4] rounded-lg">
              <div className="text-2xl font-bold text-white">
                {waitingUsers.length}
              </div>
              <div className="text-sm text-white opacity-90">Groups Waiting</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-[#4D2FB2] to-[#62109F] rounded-lg">
              <div className="text-2xl font-bold text-white">
                {service.maxCapacity}
              </div>
              <div className="text-sm text-white opacity-90">Max Capacity</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-[#6F00FF] to-[#8C00FF] rounded-lg">
              <div className="text-2xl font-bold text-white">
                {service.maxCapacity - (service.servingCapacity || 0)}
              </div>
              <div className="text-sm text-white opacity-90">
                Available Spots
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Waiting List */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-[#62109F] mb-4 flex items-center">
              <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
              Waiting List ({waitingUsers.length})
            </h2>

            {waitingUsers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No one is waiting
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {waitingUsers.map((entry, index) => (
                  <div
                    key={entry._id}
                    className="p-4 bg-yellow-50 rounded-lg border border-yellow-200"
                  >
                    <div className="mb-3">
                      <div className="font-semibold text-[#62109F]">
                        Token #{entry.tokenNumber}
                      </div>
                      <div className="text-sm text-gray-600">
                        {entry.user?.name || 'Unknown User'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Position: {index + 1}
                      </div>
                      {entry.memberNames && entry.memberNames.length > 0 && (
                        <div className="text-xs text-blue-600 mt-1">
                          Group: {entry.memberNames.join(", ")} (
                          {entry.groupSize} people)
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => handleMoveToServing(entry._id)}
                        disabled={(service.servingCapacity || 0) + entry.groupSize > service.maxCapacity}
                        className={`px-3 py-2 rounded-md transition-all duration-300 text-sm cursor-pointer outline-none ${
                          (service.servingCapacity || 0) + entry.groupSize > service.maxCapacity
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
                        }`}
                      >
                        Start Serving ({entry.groupSize} people)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Currently Serving */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-[#62109F] mb-4 flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              Currently Serving ({service.servingCapacity || 0}/{service.maxCapacity} people)
            </h2>

            {servingUsers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No one is currently being served
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {servingUsers.map((entry) => (
                  <div
                    key={entry._id}
                    className="p-4 bg-green-50 rounded-lg border border-green-200"
                  >
                    <div className="mb-3">
                      <div className="font-semibold text-[#62109F]">
                        Token #{entry.tokenNumber}
                      </div>
                      <div className="text-sm text-gray-600">
                        {entry.user?.name || 'Unknown User'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {entry.user?.email || 'No email'}
                      </div>
                      {entry.memberNames && entry.memberNames.length > 0 && (
                        <div className="text-xs text-blue-600 mt-1">
                          Group: {entry.memberNames.join(", ")} (
                          {entry.groupSize} people)
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col space-y-2">
                      
                      <button
                        onClick={() => handleMarkComplete(entry._id)}
                        className="px-3 py-2 bg-gradient-to-r from-[#62109F] to-[#8C00FF] text-white rounded-md hover:from-[#8C00FF] hover:to-[#6F00FF] transition-all duration-300 text-sm  cursor-pointer outline-none"
                      >
                        Complete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Users */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-[#62109F] mb-4 flex items-center">
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
              Completed ({completedUsers.length})
            </h2>

            {completedUsers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No completed services yet
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {completedUsers.map((entry) => (
                  <div
                    key={entry._id}
                    className="p-4 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <div>
                      <div className="font-semibold text-[#62109F]">
                        Token #{entry.tokenNumber}
                      </div>
                      <div className="text-sm text-gray-600">
                        {entry.user?.name || 'Unknown User'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {entry.user?.email || 'No email'}
                      </div>
                      {entry.memberNames && entry.memberNames.length > 0 && (
                        <div className="text-xs text-blue-600 mt-1">
                          Group: {entry.memberNames.join(", ")} (
                          {entry.groupSize} people)
                        </div>
                      )}
                      <div className="text-xs text-green-600 mt-1">
                        ✅ Completed at{" "}
                        {new Date(entry.updatedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-[#62109F] mb-4">
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="text-[#85409D]">
              <span className="font-medium">Total People:</span>{" "}
              {(service.servingCapacity || 0) + waitingUsers.reduce((sum, user) => sum + user.groupSize, 0)} people
            </div>
            <div className="text-[#85409D]">
              <span className="font-medium">Capacity Usage:</span>{" "}
              {Math.round(((service.servingCapacity || 0) / service.maxCapacity) * 100)}%
            </div>
            <div className="text-[#85409D]">
              <span className="font-medium">Status:</span>
              <span
                className={`ml-1 font-semibold ${
                  (service.servingCapacity || 0) >= service.maxCapacity
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {(service.servingCapacity || 0) >= service.maxCapacity
                  ? "Full"
                  : "Available"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedEntry && (
        <div className="fixed inset-0 backdrop-blur-lg flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold text-[#62109F] mb-4">
              Confirm Completion
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to mark <strong>{selectedEntry.user?.name || 'Unknown User'}</strong> (Token #{selectedEntry.tokenNumber}) as complete?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedEntry(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer outline-none"
              >
                No, Cancel
              </button>
              <button
                onClick={confirmComplete}
                className="px-4 py-2 bg-[#62109F] text-white rounded-md hover:bg-[#8C00FF] transition-colors cursor-pointer outline-none"
              >
                Yes, Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
