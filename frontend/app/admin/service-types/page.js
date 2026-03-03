// quick-queue/frontend/app/admin/service-types/page.js

"use client";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import {
  IoAddCircle,
  IoTrash,
  IoCreate,
  IoClose,
  IoCheckmarkCircle,
  IoCloseCircle,
} from "react-icons/io5";
import { FaBuilding, FaHospital, FaUtensils, FaCut, FaDumbbell, FaFilm } from "react-icons/fa";
import api from "../../utils/api";
import Navbar from "../../components/Navbar";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useTheme } from "../../context/ThemeContext";
import { getThemeClass } from "../../config/colors";

function ServiceTypesManagement() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const theme = getThemeClass(isDark);

  const [serviceTypes, setServiceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "building",
    isActive: true,
  });

  const iconOptions = [
    { value: "building", label: "Building", icon: FaBuilding },
    { value: "hospital", label: "Hospital", icon: FaHospital },
    { value: "restaurant", label: "Restaurant", icon: FaUtensils },
    { value: "salon", label: "Salon", icon: FaCut },
    { value: "gym", label: "Gym", icon: FaDumbbell },
    { value: "cinema", label: "Cinema", icon: FaFilm },
  ];

  useEffect(() => {
    fetchServiceTypes();
  }, []);

  const fetchServiceTypes = async () => {
    try {
      const response = await api.get("/service-types/admin");
      setServiceTypes(response.data);
    } catch (error) {
      console.error("Error fetching service types:", error);
      toast.error("Failed to fetch service types");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Service type name is required");
      return;
    }

    try {
      if (editingType) {
        await api.put(`/service-types/${editingType._id}`, formData);
        toast.success("Service type updated successfully");
      } else {
        await api.post("/service-types", formData);
        toast.success("Service type created successfully");
      }

      setShowModal(false);
      setEditingType(null);
      setFormData({ name: "", description: "", icon: "building", isActive: true });
      fetchServiceTypes();
    } catch (error) {
      console.error("Error saving service type:", error);
      toast.error(error.response?.data?.message || "Failed to save service type");
    }
  };

  const handleEdit = (type) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      description: type.description || "",
      icon: type.icon || "building",
      isActive: type.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this service type?")) return;

    try {
      await api.delete(`/service-types/${id}`);
      toast.success("Service type deleted successfully");
      fetchServiceTypes();
    } catch (error) {
      console.error("Error deleting service type:", error);
      toast.error("Failed to delete service type");
    }
  };

  const getIconComponent = (iconName) => {
    const iconOption = iconOptions.find((opt) => opt.value === iconName);
    const IconComponent = iconOption ? iconOption.icon : FaBuilding;
    return <IconComponent size={24} className="text-purple-600" />;
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

      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${theme.textAccent} mb-2`}>
              Service Types Management
            </h1>
            <p className={`${theme.textSecondary}`}>
              Manage service types that organizers can use when creating services
            </p>
          </div>
          <button
            onClick={() => {
              setEditingType(null);
              setFormData({ name: "", description: "", icon: "building", isActive: true });
              setShowModal(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-[#4D2FB2] to-[#62109F] text-white rounded-lg hover:from-[#62109F] hover:to-[#8C00FF] transition-all duration-300 cursor-pointer outline-none flex items-center gap-2"
          >
            <IoAddCircle size={20} />
            Add Service Type
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={`${theme.cardBg} rounded-lg shadow p-4 border ${theme.border}`}>
            <p className={`text-sm ${theme.textSecondary} mb-1`}>Total Types</p>
            <p className={`text-2xl font-bold ${theme.textAccent}`}>{serviceTypes.length}</p>
          </div>
          <div className={`${theme.cardBg} rounded-lg shadow p-4 border ${theme.border}`}>
            <p className={`text-sm ${theme.textSecondary} mb-1`}>Active</p>
            <p className={`text-2xl font-bold text-green-600`}>
              {serviceTypes.filter((t) => t.isActive).length}
            </p>
          </div>
          <div className={`${theme.cardBg} rounded-lg shadow p-4 border ${theme.border}`}>
            <p className={`text-sm ${theme.textSecondary} mb-1`}>Inactive</p>
            <p className={`text-2xl font-bold text-red-600`}>
              {serviceTypes.filter((t) => !t.isActive).length}
            </p>
          </div>
        </div>

        {/* Service Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {serviceTypes.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className={`${theme.textSecondary}`}>No service types found</p>
            </div>
          ) : (
            serviceTypes.map((type) => (
              <div
                key={type._id}
                className={`${theme.cardBg} rounded-lg shadow-lg p-6 border ${theme.border} hover:shadow-xl transition-shadow`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getIconComponent(type.icon)}
                    <div>
                      <h3 className={`text-lg font-bold ${theme.textAccent}`}>{type.name}</h3>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mt-1 ${
                          type.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {type.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>

                {type.description && (
                  <p className={`text-sm ${theme.textSecondary} mb-4`}>{type.description}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(type)}
                    className="flex-1 px-3 py-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 transition-colors cursor-pointer outline-none text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <IoCreate size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(type._id)}
                    className="flex-1 px-3 py-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 transition-colors cursor-pointer outline-none text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <IoTrash size={16} />
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div className={`${theme.cardBg} rounded-lg shadow-2xl max-w-md w-full`}>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 flex items-center justify-between rounded-t-lg">
              <h3 className="text-xl font-bold">
                {editingType ? "Edit Service Type" : "Add Service Type"}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingType(null);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors cursor-pointer outline-none"
              >
                <IoClose size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>
                  Service Type Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Hospital, Restaurant, Salon"
                  className={`w-full px-4 py-2 rounded-lg border ${theme.border} ${theme.inputBg} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  required
                />
              </div>

              <div className="mb-4">
                <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this service type"
                  rows={3}
                  className={`w-full px-4 py-2 rounded-lg border ${theme.border} ${theme.inputBg} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                />
              </div>

              <div className="mb-4">
                <label className={`block text-sm font-medium ${theme.textPrimary} mb-2`}>
                  Icon
                </label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${theme.border} ${theme.inputBg} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer`}
                >
                  {iconOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                  />
                  <span className={`text-sm ${theme.textPrimary}`}>Active</span>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingType(null);
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg border ${theme.border} ${theme.textPrimary} hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer outline-none`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-[#4D2FB2] to-[#62109F] text-white hover:from-[#62109F] hover:to-[#8C00FF] transition-all duration-300 cursor-pointer outline-none"
                >
                  {editingType ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProtectedServiceTypesManagement() {
  return (
    <ProtectedRoute allowedRoles={[1]}>
      <ServiceTypesManagement />
    </ProtectedRoute>
  );
}
