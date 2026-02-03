"use client";
import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { IoArrowBack, IoCamera, IoPerson, IoMail, IoShield } from "react-icons/io5";
import api from "../utils/api";
import Navbar from "../components/Navbar";
import ProtectedRoute from "../components/ProtectedRoute";
import { AuthContext } from "../context/Authcontext";

function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });
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
      setFormData({ name: response.data.name, email: response.data.email });
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
      <div className="min-h-screen bg-gradient-to-br from-[#A7AAE1] to-[#C5B0CD]">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-xl text-[#62109F]">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#A7AAE1] to-[#C5B0CD]">
      <Navbar />
      
      <div className="max-w-xl mx-auto p-4">
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="mr-3 p-2 text-[#62109F] hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors cursor-pointer outline-none"
          >
            <IoArrowBack size={20} />
          </button>
          <h1 className="text-2xl font-bold text-[#62109F]">My Profile</h1>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-6">
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
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <IoPerson className="mr-2 text-[#85409D]" />
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4D2FB2] focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <IoMail className="mr-2 text-[#85409D]" />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4D2FB2] focus:border-transparent outline-none"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-gradient-to-r from-[#4D2FB2] to-[#62109F] text-white rounded-lg hover:from-[#62109F] hover:to-[#4D2FB2] transition-all cursor-pointer outline-none font-medium"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setFormData({ name: profile.name, email: profile.email });
                    setTempImage(null);
                    setTempImageFile(null);
                  }}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer outline-none font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <label className="flex items-center text-sm font-medium text-gray-600 mb-1">
                  <IoPerson className="mr-2 text-[#85409D]" />
                  Name
                </label>
                <p className="text-lg text-gray-900 font-medium">{profile?.name}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <label className="flex items-center text-sm font-medium text-gray-600 mb-1">
                  <IoMail className="mr-2 text-[#85409D]" />
                  Email
                </label>
                <p className="text-lg text-gray-900 font-medium">{profile?.email}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <label className="flex items-center text-sm font-medium text-gray-600 mb-1">
                  <IoShield className="mr-2 text-[#85409D]" />
                  Role
                </label>
                <span className="inline-block px-3 py-1 bg-gradient-to-r from-[#4D2FB2] to-[#85409D] text-white rounded-full text-sm font-medium">
                  {profile?.role === 2 ? "Organizer" : "User"}
                </span>
              </div>

              <button
                onClick={() => setEditing(true)}
                className="w-full py-2 bg-gradient-to-r from-[#4D2FB2] to-[#62109F] text-white rounded-lg hover:from-[#62109F] hover:to-[#4D2FB2] transition-all cursor-pointer outline-none font-medium mt-4"
              >
                Edit Profile
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