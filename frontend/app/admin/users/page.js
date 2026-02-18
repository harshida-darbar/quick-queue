// quick-queue/frontend/app/admin/users/page.js

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  IoPeople,
  IoSearch,
  IoTrash,
  IoEye,
  IoFilter,
  IoClose,
  IoCheckmarkCircle,
  IoPersonCircle,
  IoDownload,
} from "react-icons/io5";
import api from "../../utils/api";
import Navbar from "../../components/Navbar";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useTheme } from "../../context/ThemeContext";
import { getThemeClass } from "../../config/colors";

function UsersManagement() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const theme = getThemeClass(isDark);
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/admin/users");
      const usersData = Array.isArray(response.data) ? response.data : [];
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    if (!Array.isArray(users)) {
      setFilteredUsers([]);
      return;
    }

    let filtered = [...users];

    // Filter by role
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === parseInt(roleFilter));
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.phone?.includes(searchTerm)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success("User role updated successfully");
      fetchUsers();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update user role");
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await api.delete(`/admin/users/${userToDelete._id}`);
      toast.success("User deleted successfully");
      setShowDeleteModal(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error(error.response?.data?.message || "Failed to delete user");
    }
  };

  const exportToCSV = () => {
    if (!Array.isArray(filteredUsers) || filteredUsers.length === 0) {
      toast.error("No users to export");
      return;
    }

    const headers = ["Name", "Email", "Phone", "City", "Role", "Joined Date"];
    const rows = filteredUsers.map((user) => [
      user.name || "N/A",
      user.email || "N/A",
      user.phone || "N/A",
      user.city || "N/A",
      getRoleName(user.role),
      new Date(user.createdAt).toLocaleDateString(),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Users exported successfully");
  };

  const getRoleName = (role) => {
    switch (role) {
      case 1:
        return "Admin";
      case 2:
        return t("profile.organizer");
      case 3:
        return t("profile.user");
      default:
        return "Unknown";
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 1:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case 2:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case 3:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme.pageBg}`}>
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className={`text-xl ${theme.textAccent}`}>{t("common.loading")}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.pageBg}`}>
      <Navbar />

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <IoPeople size={32} className="text-purple-600" />
                <h1 className={`text-3xl font-bold ${theme.textAccent}`}>
                  {t("admin.users")}
                </h1>
              </div>
              <p className={`${theme.textSecondary}`}>
                Manage all users, organizers, and admins on the platform
              </p>
            </div>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 cursor-pointer outline-none flex items-center gap-2"
            >
              <IoDownload size={20} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`${theme.cardBg} rounded-lg shadow p-4 border ${theme.border}`}>
            <p className={`text-sm ${theme.textSecondary} mb-1`}>Total Users</p>
            <p className={`text-2xl font-bold ${theme.textAccent}`}>
              {Array.isArray(users) ? users.length : 0}
            </p>
          </div>
          <div className={`${theme.cardBg} rounded-lg shadow p-4 border ${theme.border}`}>
            <p className={`text-sm ${theme.textSecondary} mb-1`}>Admins</p>
            <p className={`text-2xl font-bold text-red-600`}>
              {Array.isArray(users) ? users.filter((u) => u.role === 1).length : 0}
            </p>
          </div>
          <div className={`${theme.cardBg} rounded-lg shadow p-4 border ${theme.border}`}>
            <p className={`text-sm ${theme.textSecondary} mb-1`}>Organizers</p>
            <p className={`text-2xl font-bold text-blue-600`}>
              {Array.isArray(users) ? users.filter((u) => u.role === 2).length : 0}
            </p>
          </div>
          <div className={`${theme.cardBg} rounded-lg shadow p-4 border ${theme.border}`}>
            <p className={`text-sm ${theme.textSecondary} mb-1`}>Users</p>
            <p className={`text-2xl font-bold text-green-600`}>
              {Array.isArray(users) ? users.filter((u) => u.role === 3).length : 0}
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className={`${theme.cardBg} rounded-lg shadow-lg p-6 mb-6 border ${theme.border}`}>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <IoSearch
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme.textSecondary}`}
                size={20}
              />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${theme.border} ${theme.inputBg} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <IoFilter size={20} className={theme.textSecondary} />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${theme.border} ${theme.inputBg} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer`}
              >
                <option value="all">All Roles</option>
                <option value="1">Admin</option>
                <option value="2">Organizer</option>
                <option value="3">User</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <p className={`text-sm ${theme.textSecondary}`}>
              Showing {filteredUsers.length} of {users.length} users
            </p>
          </div>
        </div>

        {/* Users Table */}
        <div className={`${theme.cardBg} rounded-lg shadow-lg overflow-hidden border ${theme.border}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Contact</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">City</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Joined</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <p className={`${theme.textSecondary}`}>No users found</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user._id}
                      className={`${theme.cardBg} hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.profileImage ? (
                            <img
                              src={`http://localhost:5000/api/profile/image/${user.profileImage}`}
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <IoPersonCircle size={40} className={theme.textSecondary} />
                          )}
                          <div>
                            <p className={`font-medium ${theme.textPrimary}`}>
                              {user.name || "N/A"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className={`text-sm ${theme.textPrimary}`}>{user.email}</p>
                        <p className={`text-xs ${theme.textSecondary}`}>
                          {user.phone || "No phone"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user._id, parseInt(e.target.value))}
                          disabled={user.role === 1}
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(
                            user.role
                          )} ${user.role === 1 ? "cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <option value={1}>Admin</option>
                          <option value={2}>Organizer</option>
                          <option value={3}>User</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <p className={`text-sm ${theme.textPrimary}`}>
                          {user.city || "Not provided"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className={`text-sm ${theme.textPrimary}`}>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDetailsModal(true);
                            }}
                            className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 transition-colors cursor-pointer outline-none"
                            title="View Details"
                          >
                            <IoEye size={18} />
                          </button>
                          {user.role !== 1 && (
                            <button
                              onClick={() => {
                                setUserToDelete(user);
                                setShowDeleteModal(true);
                              }}
                              className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 transition-colors cursor-pointer outline-none"
                              title="Delete User"
                            >
                              <IoTrash size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${theme.cardBg} rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold">User Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors cursor-pointer outline-none"
              >
                <IoClose size={24} />
              </button>
            </div>

            <div className="p-6">
              {/* Profile Section */}
              <div className="flex items-center gap-4 mb-6">
                {selectedUser.profileImage ? (
                  <img
                    src={`http://localhost:5000/api/profile/image/${selectedUser.profileImage}`}
                    alt={selectedUser.name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <IoPersonCircle size={80} className={theme.textSecondary} />
                )}
                <div>
                  <h4 className={`text-2xl font-bold ${theme.textAccent}`}>
                    {selectedUser.name || "N/A"}
                  </h4>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${getRoleBadgeColor(
                      selectedUser.role
                    )}`}
                  >
                    {getRoleName(selectedUser.role)}
                  </span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className={`text-sm ${theme.textSecondary} mb-1`}>Email</p>
                  <p className={`font-medium ${theme.textPrimary}`}>{selectedUser.email}</p>
                </div>
                <div>
                  <p className={`text-sm ${theme.textSecondary} mb-1`}>Phone</p>
                  <p className={`font-medium ${theme.textPrimary}`}>
                    {selectedUser.phone || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${theme.textSecondary} mb-1`}>City</p>
                  <p className={`font-medium ${theme.textPrimary}`}>
                    {selectedUser.city || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${theme.textSecondary} mb-1`}>Joined Date</p>
                  <p className={`font-medium ${theme.textPrimary}`}>
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${theme.cardBg} rounded-lg shadow-2xl max-w-md w-full p-6`}>
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
                <IoTrash size={32} className="text-red-600 dark:text-red-200" />
              </div>
              <h3 className={`text-xl font-bold ${theme.textAccent} mb-2`}>Delete User</h3>
              <p className={`${theme.textSecondary}`}>
                Are you sure you want to delete{" "}
                <span className="font-semibold">{userToDelete.name}</span>? This action cannot be
                undone.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                className={`flex-1 px-4 py-2 rounded-lg border ${theme.border} ${theme.textPrimary} hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer outline-none`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer outline-none"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProtectedUsersManagement() {
  return (
    <ProtectedRoute allowedRoles={[1]}>
      <UsersManagement />
    </ProtectedRoute>
  );
}
