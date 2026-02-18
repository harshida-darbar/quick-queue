// quick-queue/frontend/app/user/wishlist/page.js

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import { IoHeart, IoArrowBack } from "react-icons/io5";
import { FaHospital, FaUtensils, FaCut, FaBuilding, FaMapMarkerAlt, FaStar } from "react-icons/fa";
import api from "../../utils/api";
import Navbar from "../../components/Navbar";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useTheme } from "../../context/ThemeContext";
import { getThemeClass } from "../../config/colors";

function Wishlist() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const theme = getThemeClass(isDark);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const response = await api.get("/wishlist");
      setWishlist(response.data);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      toast.error("Failed to fetch wishlist");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (serviceId, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/wishlist/${serviceId}`);
      toast.success("Removed from wishlist");
      fetchWishlist();
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toast.error("Failed to remove from wishlist");
    }
  };

  const getServiceIcon = (type) => {
    const iconProps = { size: 32, className: theme.textAccent };
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

  const getButtonText = (serviceType) => {
    const buttonTexts = {
      hospital: t("dashboard.getMedicine"),
      restaurant: t("dashboard.bookTable"),
      salon: t("dashboard.bookSlot"),
      gym: t("dashboard.bookSession"),
      theater: t("dashboard.bookTicket"),
      default: t("dashboard.bookService"),
    };
    return buttonTexts[serviceType] || buttonTexts.default;
  };

  const handleCardClick = (service, e) => {
    if (e.target.closest('button')) return;
    router.push(`/user/service/${service._id}`);
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme.pageBg}`}>
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className={`text-xl ${theme.textAccent}`}>{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.pageBg}`}>
      <Navbar />
      
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.push('/user/dashboard')}
            className={`p-2 ${theme.textAccent} rounded-lg transition-colors cursor-pointer outline-none ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-200'}`}
          >
            <IoArrowBack size={20} />
          </button>
          <h1 className={`text-3xl font-bold ${theme.textAccent} flex items-center gap-3 ml-2`}>
            <IoHeart size={32} />
            Saved Services
          </h1>
        </div>

        {wishlist.length === 0 ? (
          <div className={`text-center py-12 ${theme.cardBg} rounded-lg shadow-lg`}>
            <IoHeart size={64} className={`mx-auto ${theme.textMuted} mb-4`} />
            <h3 className={`text-xl font-semibold ${theme.textSecondary} mb-2`}>No Saved Services</h3>
            <p className={`${theme.textMuted} mb-4`}>You haven't saved any services yet.</p>
            <button
              onClick={() => router.push('/user/dashboard')}
              className="px-4 py-2 bg-[#4D2FB2] text-white rounded-md hover:bg-[#62109F] transition-colors cursor-pointer outline-none"
            >
              Browse Services
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((item) => {
              const service = item.service;
              return (
                <div
                  key={item._id}
                  className={`${theme.cardBg} rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full cursor-pointer transform hover:scale-105 relative`}
                  onClick={(e) => handleCardClick(service, e)}
                >
                  {/* Heart Icon to Remove */}
                  <button
                    onClick={(e) => handleRemoveFromWishlist(service._id, e)}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors z-10 cursor-pointer outline-none"
                  >
                    <IoHeart size={24} className="text-red-500" />
                  </button>

                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center mb-4">
                      {getServiceIcon(service.serviceType)}
                      <div className="ml-3">
                        <h3 className={`text-xl font-semibold ${theme.textAccent}`}>
                          {service.title}
                        </h3>
                        <p className={`text-sm ${theme.textSecondary} capitalize`}>
                          {service.serviceType}
                        </p>
                      </div>
                    </div>

                    {service.photo && (
                      <div className="relative w-full h-32 mb-4">
                        <Image
                          src={service.photo}
                          alt={service.title}
                          fill
                          className="object-cover rounded-lg"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      </div>
                    )}

                    <p className={`${theme.textSecondary} mb-2 flex-1 min-h-[3rem]`}>
                      {service.description}
                    </p>

                    {/* Rating Display */}
                    <div className={`mb-3 p-2 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                      {service.totalReviews > 0 ? (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <FaStar className="text-yellow-500" size={14} />
                            <span className={`font-bold ${theme.textPrimary} text-sm`}>
                              {service.averageRating?.toFixed(1)}
                            </span>
                          </div>
                          <span className={`text-xs ${theme.textMuted}`}>
                            ({service.totalReviews} {service.totalReviews === 1 ? t('appointments.review') : t('appointments.reviews')})
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <FaStar className={`${theme.textMuted}`} size={14} />
                          <span className={`text-xs ${theme.textMuted}`}>{t('appointments.noReviewsYet')}</span>
                        </div>
                      )}
                    </div>

                    {service.address && (
                      <p className={`text-xs ${theme.textMuted} mb-4 line-clamp-2 flex items-start gap-1`}>
                        <FaMapMarkerAlt className="mt-0.5 flex-shrink-0" size={12} />
                        <span>{service.address}</span>
                      </p>
                    )}

                    <div className={`flex items-center justify-between mb-4 p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                      <div>
                        <p className={`text-xs ${theme.textMuted}`}>
                          {t("dashboard.availability")}
                        </p>
                        <p className={`text-sm font-semibold ${theme.textPrimary}`}>
                          {service.servingCapacity || 0}/{service.maxCapacity}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${theme.textMuted}`}>
                          {t("dashboard.waiting")}
                        </p>
                        <p className={`text-sm font-semibold ${theme.textPrimary}`}>
                          {service.waitingCount || 0}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-2xl font-bold ${theme.textAccent}`}>
                        ₹{service.price}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          service.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {service.status === "active"
                          ? t("dashboard.available")
                          : t("dashboard.full")}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/user/service/${service._id}`);
                        }}
                        className="w-full px-4 py-2 bg-gradient-to-r from-[#62109F] to-[#8C00FF] text-white rounded-md hover:from-[#8C00FF] hover:to-[#6F00FF] transition-all duration-300 cursor-pointer outline-none"
                      >
                        {getButtonText(service.serviceType)}
                      </button>

                      {service.appointmentBookingEnabled && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/user/service/${service._id}`);
                          }}
                          className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md hover:from-blue-600 hover:to-blue-700 transition-all duration-300 cursor-pointer outline-none"
                        >
                          {t("dashboard.bookAppointment")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProtectedWishlist() {
  return (
    <ProtectedRoute allowedRoles={[3]}>
      <Wishlist />
    </ProtectedRoute>
  );
}
