// quick-queue/frontend/app/organizer/dashboard/page.js
"use client";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import OrganizerQueues from "../components/OrganizerQueues";
import { useAuth } from "@/app/context/Authcontext";
import React, { useState } from "react";
import { IoBusinessOutline } from "react-icons/io5";

function OrganizerDashboard() {
  const { user, logout } = useAuth();
  const [showDropDown, setShowDropDown] = useState(false);
  const [logoutPopup, setLogoutPopup] = useState(false);

  return (
    <ProtectedRoute allowedRoles={[2]}>
      <div className="min-h-screen flex flex-col bg-[#F6F3FB]">
        {/* NAVBAR */}
        <nav className="bg-gradient-to-r from-[#7132CA] to-[#8C00FF] text-white px-6 py-4 flex items-center justify-between shadow-md">
          <h1 className="text-2xl font-bold tracking-wide">
            Quick Queue · Organizer
          </h1>

          {/* Organizer Box */}
          <div className="relative">
            <button
              onClick={() => setShowDropDown(!showDropDown)}
              className="flex items-center gap-2 border border-[#BB8ED0] bg-white px-4 py-2 rounded-lg cursor-pointer outline-none text-[#7132CA] font-semibold hover:bg-[#BB8ED0] hover:text-white transition"
            >
              <IoBusinessOutline size={20} />
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
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer rounded-lg"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* LEFT: QUEUE MANAGER */}
            <div className="md:col-span-3">
              <OrganizerQueues />
            </div>

            {/* Card 1 */}
            <div className="p-6 rounded-xl bg-gradient-to-r from-[#7F55B1] to-[#B153D7] text-white shadow">
              <h2 className="text-lg font-semibold mb-2">Manage Queues</h2>
              <p>Create, start, pause, and close queues in real-time.</p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-xl bg-gradient-to-r from-[#725CAD] to-[#C47BE4] text-white shadow">
              <h2 className="text-lg font-semibold mb-2">Appointments</h2>
              <p>View and manage customer appointments.</p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-xl bg-gradient-to-r from-[#85409D] to-[#8C00FF] text-white shadow">
              <h2 className="text-lg font-semibold mb-2">Analytics</h2>
              <p>Track queue performance and customer insights.</p>
            </div>
          </div>
        </main>

        {/* FOOTER */}
        <footer className="bg-[#7132CA] text-white py-4 text-center">
          © {new Date().getFullYear()} Quick Queue · Organizer Panel
        </footer>
      </div>
      {/* Logout Confirmation Popup */}
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
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#7132CA] to-[#8C00FF] text-white cursor-pointer font-semibold hover:opacity-90"
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

export default OrganizerDashboard;
