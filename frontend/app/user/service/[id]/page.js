"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Image from "next/image";
import { FaHospital, FaUtensils, FaCut, FaBuilding } from "react-icons/fa";
import api from "../../../utils/api";
import Navbar from "../../../components/Navbar";
import { IoArrowBack } from "react-icons/io5";

export default function ServiceDetails({ params }) {
  const resolvedParams = use(params);
  const [service, setService] = useState(null);
  const [servingUsers, setServingUsers] = useState([]);
  const [waitingUsers, setWaitingUsers] = useState([]);
  const [userStatus, setUserStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchServiceDetails();
    fetchUserStatus();
  }, [resolvedParams.id]);

  const fetchServiceDetails = async () => {
    try {
      const response = await api.get(`/queue/services/${resolvedParams.id}`);
      setService(response.data.service);
      setServingUsers(response.data.servingUsers);
      setWaitingUsers(response.data.waitingUsers);
    } catch (error) {
      console.error("Error fetching service details:", error);
      toast.error("Failed to fetch service details");
    }
  };

  const fetchUserStatus = async () => {
    try {
      const response = await api.get(`/queue/services/${resolvedParams.id}/status`);
      setUserStatus(response.data);
    } catch (error) {
      setUserStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinQueue = async () => {
    setJoining(true);
    try {
      const response = await api.post(`/queue/services/${resolvedParams.id}/join`);
      
      if (response.data.status === 'serving') {
        toast.success(response.data.message);
      } else {
        toast.warning(response.data.message);
      }

      await fetchServiceDetails();
      await fetchUserStatus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error joining queue');
    } finally {
      setJoining(false);
    }
  };

  const getServiceIcon = (type) => {
    const iconProps = { size: 48, className: "text-[#62109F]" };
    switch (type) {
      case "hospital": return <FaHospital {...iconProps} />;
      case "restaurant": return <FaUtensils {...iconProps} />;
      case "salon": return <FaCut {...iconProps} />;
      default: return <FaBuilding {...iconProps} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "serving": return "bg-green-100 text-green-800 border-green-200";
      case "waiting": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "complete": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#A7AAE1] to-[#C5B0CD]">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-xl text-[#62109F]">Loading service details...</div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#A7AAE1] to-[#C5B0CD]">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-xl text-red-600">Service not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#A7AAE1] to-[#C5B0CD]">
      <Navbar />
      
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={() => router.back()}
          className="mb-6 text-[#4D2FB2] hover:text-[#62109F] flex items-center font-medium outline-none"
        >
          <IoArrowBack size={20} className="mr-1 cursor-pointer hover:bg-white hover:bg-opacity-20 rounded-lg"/> Back to Services
        </button>

        {/* Service Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            {getServiceIcon(service.serviceType)}
            <div className="ml-4">
              <h1 className="text-3xl font-bold text-[#62109F]">{service.title}</h1>
              <p className="text-lg text-[#85409D] capitalize">{service.serviceType}</p>
            </div>
          </div>
          
          {service.photo && (
            <div className="relative w-full h-48 mb-4">
              <Image 
                src={service.photo} 
                alt={service.title}
                fill
                className="object-cover rounded-lg"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          )}
          
          <p className="text-gray-700 mb-6">{service.description}</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-gradient-to-br from-[#B7A3E3] to-[#C47BE4] rounded-lg">
              <div className="text-2xl font-bold text-white">{servingUsers.length}</div>
              <div className="text-sm text-white opacity-90">Group Serving</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-[#85409D] to-[#C47BE4] rounded-lg">
              <div className="text-2xl font-bold text-white">{waitingUsers.length}</div>
              <div className="text-sm text-white opacity-90">Waiting</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-[#4D2FB2] to-[#62109F] rounded-lg">
              <div className="text-2xl font-bold text-white">{service.maxCapacity}</div>
              <div className="text-sm text-white opacity-90">Max Capacity</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-[#6F00FF] to-[#8C00FF] rounded-lg">
              <div className={`text-2xl font-bold text-white`}>
                {servingUsers.length >= service.maxCapacity ? 'FULL' : 'OPEN'}
              </div>
              <div className="text-sm text-white opacity-90">Status</div>
            </div>
          </div>

          {/* User Status */}
          {userStatus ? (
            <div className={`p-4 rounded-lg mb-6 border-2 ${getStatusColor(userStatus.status)}`}>
              <h3 className="font-semibold mb-2">Your Status</h3>
              <div className="flex justify-between items-center">
                <div>
                  <p>Token Number: <span className="font-bold">#{userStatus.tokenNumber}</span></p>
                  <p>Status: <span className="font-bold capitalize">{userStatus.status}</span></p>
                  {userStatus.status === 'waiting' && (
                    <p>People ahead: <span className="font-bold">{userStatus.waitingAhead}</span></p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <button
                onClick={handleJoinQueue}
                disabled={joining}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                  joining 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-[#4D2FB2] to-[#62109F] hover:from-[#62109F] hover:to-[#8C00FF] text-white shadow-lg'
                }`}
              >
                {joining ? 'Joining...' : 'Join Queue'}
              </button>
            </div>
          )}
        </div>

        {/* Currently Serving */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-[#62109F] mb-4">Currently Serving Group</h2>
          {servingUsers.length === 0 ? (
            <p className="text-gray-500">No one is currently being served</p>
          ) : (
            <div className="space-y-2">
              {servingUsers.map((entry, index) => (
                <div key={entry._id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <span className="font-medium text-[#62109F]">Token #{entry.tokenNumber}</span>
                    <span className="text-gray-600 ml-2">{entry.user.name}</span>
                  </div>
                  <span className="px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs">
                    Serving
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Waiting List */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-[#62109F] mb-4">Waiting List</h2>
          {waitingUsers.length === 0 ? (
            <p className="text-gray-500">No one is waiting</p>
          ) : (
            <div className="space-y-2">
              {waitingUsers.map((entry, index) => (
                <div key={entry._id} className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div>
                    <span className="font-medium text-[#62109F]">Token #{entry.tokenNumber}</span>
                    <span className="text-gray-600 ml-2">{entry.user.name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-2">Position: {index + 1}</span>
                    <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs">
                      Waiting
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}