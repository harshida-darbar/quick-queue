"use client";
import { useState } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import { useAuth } from "../context/Authcontext";

export default function AdminLayout({ children }) {
  const { logout } = useAuth();

  const [showLogoutPopup, setShowLogoutPopup] = useState(false);

  return (
    <ProtectedRoute allowedRoles={[1]}>
      <div className="flex min-h-screen bg-[#F6F3FB]">
        
        {/* Sidebar */}
        <aside className="w-64 bg-[#b24ef5] text-white p-6 hidden md:flex flex-col">
          <h2 className="text-2xl font-bold mb-8">Admin Panel</h2>

          <ul className="space-y-4 text-sm font-medium flex-1">
            <li className="cursor-pointer hover:text-[#BB8ED0] transition">
              Dashboard
            </li>
            <li className="cursor-pointer hover:text-[#BB8ED0] transition">
              Users
            </li>
            <li className="cursor-pointer hover:text-[#BB8ED0] transition">
              Organizers
            </li>
          </ul>

          {/* Logout Button */}
          <button
            onClick={() => setShowLogoutPopup(true)}
            className="border border-white px-6 py-2 rounded-lg cursor-pointer outline-none hover:bg-white hover:text-[#b24ef5] transition"
          >
            Logout
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="bg-white rounded-2xl shadow-md p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Logout Confirmation Popup */}
      {showLogoutPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold text-[#7132CA] mb-3">
              Confirm Logout
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to logout?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutPopup(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 outline-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#7132CA] to-[#8C00FF] text-white font-semibold hover:opacity-90 outline-none cursor-pointer"
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
