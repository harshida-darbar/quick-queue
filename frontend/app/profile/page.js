"use client";
import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { IoArrowBack, IoCamera, IoPerson, IoMail, IoShield, IoCall, IoLocation } from "react-icons/io5";
import api from "../utils/api";
import Navbar from "../components/Navbar";
import ProtectedRoute from "../components/ProtectedRoute";
import { AuthContext } from "../context/Authcontext";
import { useTheme } from "../context/ThemeContext";
import { getThemeClass } from "../config/colors";

function ProfilePage() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const theme = getThemeClass(isDark);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", city: "" });
  const [tempImage, setTempImage] = useState(null); // Temporary image preview
  const [tempImageFile, setTempImageFile] = useState(null); // Temporary image file
  const { updateUser } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get("/profile");
      setProfile(response.data);
      setFormData({ name: response.data.name, email: response.data.email, phone: response.data.phone || "", city: response.data.city || "" });
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    // Create preview URL for temporary display
    const previewUrl = URL.createObjectURL(file);
    setTempImage(previewUrl);
    setTempImageFile(file);
    
    // Don't upload yet - just show preview
    toast.success("Image selected! Click 'Save Changes' to update.");
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("email", formData.email);
      submitData.append("phone", formData.phone);
      submitData.append("city", formData.city);
      
      // Add image file if selected
      if (tempImageFile) {
        submitData.append("profileImage", tempImageFile);
      }
      
      const response = await api.put("/profile", submitData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      setProfile(response.data.user);
      updateUser(response.data.user); // Update AuthContext NOW
      setEditing(false);
      setTempImage(null); // Clear temp image
      setTempImageFile(null); // Clear temp file
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme.pageBg}`}>
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className={`text-xl ${theme.textAccent}`}>Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.pageBg}`}>
      <Navbar />
      
      <div className="max-w-xl mx-auto p-4">
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className={`mr-3 p-2 ${theme.textAccent} rounded-lg transition-colors cursor-pointer outline-none ${isDark ? 'hover:bg-slate-700' : 'hover:bg-white hover:bg-opacity-20'}`}
          >
            <IoArrowBack size={20} />
          </button>
          <h1 className={`text-2xl font-bold ${theme.textAccent}`}>{t('navbar.myProfile')}</h1>
        </div>

        <div className={`${theme.cardBg} rounded-xl shadow-xl p-6`}>
          {/* Profile Image Section */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-r from-[#4D2FB2] to-[#85409D] flex items-center justify-center shadow-lg">
                {tempImage ? (
                  <img
                    src={tempImage}
                    alt="Profile Preview"
                    className="w-full h-full object-cover"
                  />
                ) : profile?.profileImage ? (
                  <img
                    src={`http://localhost:5000/api/profile/image/${profile.profileImage}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-white">
                    {profile?.name?.charAt(0)}
                  </span>
                )}
              </div>
              
              <label className="absolute -bottom-1 -right-1 bg-[#4D2FB2] p-2 rounded-full cursor-pointer hover:bg-[#62109F] transition-colors shadow-lg">
                <IoCamera size={16} className="text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
            
            {uploading && (
              <p className="text-sm text-[#85409D] mt-2">Uploading...</p>
            )}
          </div>

          {/* Profile Info Section */}
          {editing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className={`flex items-center text-sm font-medium ${theme.textPrimary} mb-1`}>
                  <IoPerson className={`mr-2 ${theme.textSecondary}`} />
                  {t('profile.name')}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border ${theme.border} rounded-lg focus:ring-2 focus:ring-[#4D2FB2] focus:border-transparent outline-none ${theme.input}`}
                  required
                />
              </div>

              <div>
                <label className={`flex items-center text-sm font-medium ${theme.textPrimary} mb-1`}>
                  <IoMail className={`mr-2 ${theme.textSecondary}`} />
                  {t('profile.email')}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-3 py-2 border ${theme.border} rounded-lg focus:ring-2 focus:ring-[#4D2FB2] focus:border-transparent outline-none ${theme.input}`}
                  required
                />
              </div>

              <div>
                <label className={`flex items-center text-sm font-medium ${theme.textPrimary} mb-1`}>
                  <IoCall className={`mr-2 ${theme.textSecondary}`} />
                  {t('profile.phone')}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-3 py-2 border ${theme.border} rounded-lg focus:ring-2 focus:ring-[#4D2FB2] focus:border-transparent outline-none ${theme.input}`}
                  required
                />
              </div>

              <div>
                <label className={`flex items-center text-sm font-medium ${theme.textPrimary} mb-1`}>
                  <IoLocation className={`mr-2 ${theme.textSecondary}`} />
                  {t('profile.city')}
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className={`w-full px-3 py-2 border ${theme.border} rounded-lg focus:ring-2 focus:ring-[#4D2FB2] focus:border-transparent outline-none ${theme.input}`}
                  required
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-gradient-to-r from-[#4D2FB2] to-[#62109F] text-white rounded-lg hover:from-[#62109F] hover:to-[#4D2FB2] transition-all cursor-pointer outline-none font-medium"
                >
                  {t('profile.saveChanges')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setFormData({ name: profile.name, email: profile.email, phone: profile.phone || "", city: profile.city || "" });
                    setTempImage(null);
                    setTempImageFile(null);
                  }}
                  className={`flex-1 py-2 border ${theme.border} ${theme.textPrimary} rounded-lg transition-colors cursor-pointer outline-none font-medium ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-50'}`}
                >
                  {t('profile.cancel')}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className={`rounded-lg p-3 ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
                <label className={`flex items-center text-sm font-medium ${theme.textSecondary} mb-1`}>
                  <IoPerson className={`mr-2 ${theme.textSecondary}`} />
                  {t('profile.name')}
                </label>
                <p className={`text-lg ${theme.textPrimary} font-medium`}>{profile?.name}</p>
              </div>

              <div className={`rounded-lg p-3 ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
                <label className={`flex items-center text-sm font-medium ${theme.textSecondary} mb-1`}>
                  <IoMail className={`mr-2 ${theme.textSecondary}`} />
                  {t('profile.email')}
                </label>
                <p className={`text-lg ${theme.textPrimary} font-medium`}>{profile?.email}</p>
              </div>

              <div className={`rounded-lg p-3 ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
                <label className={`flex items-center text-sm font-medium ${theme.textSecondary} mb-1`}>
                  <IoCall className={`mr-2 ${theme.textSecondary}`} />
                  {t('profile.phone')}
                </label>
                <p className={`text-lg ${theme.textPrimary} font-medium`}>{profile?.phone || t('profile.notProvided')}</p>
              </div>

              <div className={`rounded-lg p-3 ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
                <label className={`flex items-center text-sm font-medium ${theme.textSecondary} mb-1`}>
                  <IoLocation className={`mr-2 ${theme.textSecondary}`} />
                  {t('profile.city')}
                </label>
                <p className={`text-lg ${theme.textPrimary} font-medium`}>{profile?.city || t('profile.notProvided')}</p>
              </div>

              <div className={`rounded-lg p-3 ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
                <label className={`flex items-center text-sm font-medium ${theme.textSecondary} mb-1`}>
                  <IoShield className={`mr-2 ${theme.textSecondary}`} />
                  {t('profile.role')}
                </label>
                <span className="inline-block px-3 py-1 bg-gradient-to-r from-[#4D2FB2] to-[#85409D] text-white rounded-full text-sm font-medium">
                  {profile?.role === 2 ? t('profile.organizer') : t('profile.user')}
                </span>
              </div>

              <button
                onClick={() => setEditing(true)}
                className="w-full py-2 bg-gradient-to-r from-[#4D2FB2] to-[#62109F] text-white rounded-lg hover:from-[#62109F] hover:to-[#4D2FB2] transition-all cursor-pointer outline-none font-medium mt-4"
              >
                {t('profile.editProfile')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProtectedProfilePage() {
  return (
    <ProtectedRoute allowedRoles={[2, 3]}>
      <ProfilePage />
    </ProtectedRoute>
  );
}