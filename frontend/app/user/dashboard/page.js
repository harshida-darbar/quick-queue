// quick-queue/frontend/app/user/dashboard/page.js
"use client";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import { useAuth } from "@/app/context/Authcontext";
import api from "@/app/utils/api";
import React, { useState, useEffect } from "react";
import { FaUserAlt } from "react-icons/fa";
import { toast } from "react-toastify";

function UserDashboard() {
  const { user, logout } = useAuth();
  const [showDropDown, setShowDropDown] = useState(false);
  const [logoutPopup, setLogoutPopup] = useState(false);
  const [queues, setQueues] = useState([]);
  const [myQueueId, setMyQueueId] = useState(null);

  useEffect(() => {
    api.get("/queue/active").then((res) => setQueues(res.data));
  }, []);

  const joinQueue = async (id) => {
    const res = await api.post(`/queue/${id}/join`);
    toast.success(`Your token: ${res.data.token}`);
    setMyQueueId(id);
  };

  useEffect(() => {
    loadQueues();

    const interval = setInterval(loadQueues, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadQueues = async () => {
    const res = await api.get("/queue/active");
    setQueues(res.data);
  };

  useEffect(() => {
  if (!myQueueId) return;

  const interval = setInterval(async () => {
    const res = await api.get(`/queue/${myQueueId}/my-token`);

    if (res.data.myStatus === "served") {
      toast.success("🎉 It's your turn! Please proceed.");
      clearInterval(interval);
    }
  }, 4000);

  return () => clearInterval(interval);
}, [myQueueId]);

  return (
    <ProtectedRoute allowedRoles={[3]}>
      <div className="min-h-screen flex flex-col bg-[#F6F3FB]">
        {/* Navbar */}
        <nav className="bg-gradient-to-r from-[#7132CA] to-[#8C00FF] text-white flex items-center justify-between px-6 py-4 shadow-md">
          <h1 className="text-2xl font-bold">Quick Queue - User Dashboard</h1>

          {/* User Box */}
          <div className="relative">
            <button
              onClick={() => setShowDropDown(!showDropDown)}
              className="flex items-center gap-2 border border-[#BB8ED0] bg-white px-4 py-2 rounded-lg cursor-pointer outline-none text-[#7132CA] font-semibold hover:bg-[#BB8ED0] hover:text-white transition"
            >
              <FaUserAlt />
              <span className="capitalize">{user?.name || user?.email}</span>
            </button>

            {/* Dropdown */}
            {showDropDown && (
              <div className="absolute right-0 mt-2 w-32 bg-white text-black rounded-lg shadow-lg z-20">
                <button
                  onClick={() => {
                    setShowDropDown(false);
                    setLogoutPopup(true);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 outline-none cursor-pointer rounded-lg"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-gradient-to-r from-[#7F55B1] to-[#B153D7] text-white shadow">
              <h2 className="text-lg font-semibold mb-2">My Queues</h2>
              <p>View and manage your active queues here.</p>
            </div>
            <div className="p-6 rounded-xl bg-gradient-to-r from-[#725CAD] to-[#C47BE4] text-white shadow">
              <h2 className="text-lg font-semibold mb-2">History</h2>
              <p>See your completed queue history.</p>
            </div>
            <div className="p-6 rounded-xl bg-gradient-to-r from-[#85409D] to-[#8C00FF] text-white shadow">
              <h2 className="text-lg font-semibold mb-2">Profile</h2>
              <p>Manage your profile information.</p>
            </div>
          </div>
          {queues.map((q) => (
            <div
              key={q._id}
              className="bg-white rounded-xl shadow-md p-5 flex flex-col gap-3 mt-4"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-semibold text-[#7132CA]">
                    {q.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {/* Current Token: {q.tokens?.length || 0} */}
                    People Waiting: {q.waitingCount}
                  </p>
                </div>

                <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700">
                  Active
                </span>
              </div>

              <button
                onClick={() => joinQueue(q._id)}
                className="self-start bg-gradient-to-r from-[#7132CA] to-[#8C00FF] text-white px-5 py-2 rounded-lg font-medium hover:opacity-90 transition"
              >
                Join Queue
              </button>
            </div>
          ))}
        </main>

        {/* Footer */}
        <footer className="bg-[#7132CA] text-white py-4 text-center mt-auto">
          &copy; {new Date().getFullYear()} Quick Queue. All rights reserved.
        </footer>
      </div>

      {logoutPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 animate-fadeIn">
            <h2 className="text-xl font-semibold text-[#7132CA] mb-3">
              Confirm Logout
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to logout?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setLogoutPopup(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 outline-none hover:bg-gray-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 rounded-lg outline-none bg-gradient-to-r from-[#7132CA] to-[#8C00FF] text-white cursor-pointer font-semibold hover:opacity-90"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}

export default UserDashboard;
