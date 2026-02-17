// quick-queue/frontend/app/user/reviews/[id]/page.js

"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { FaStar } from "react-icons/fa";
import api from "../../../utils/api";
import Navbar from "../../../components/Navbar";
import StarRating from "../../../components/StarRating";
import { IoArrowBack } from "react-icons/io5";
import { useTheme } from "../../../context/ThemeContext";
import { getThemeClass } from "../../../config/colors";

export default function AllReviews({ params }) {
  const resolvedParams = use(params);
  const { isDark } = useTheme();
  const theme = getThemeClass(isDark);
  const { t } = useTranslation();
  const [service, setService] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchServiceAndReviews();
  }, [resolvedParams.id]);

  const fetchServiceAndReviews = async () => {
    try {
      const [serviceResponse, reviewsResponse] = await Promise.all([
        api.get(`/queue/services/${resolvedParams.id}`),
        api.get(`/reviews/queue/${resolvedParams.id}`)
      ]);
      
      setService(serviceResponse.data.service);
      setReviews(reviewsResponse.data.reviews || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
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

  if (!service) {
    return (
      <div className={`min-h-screen ${theme.pageBg}`}>
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-xl text-red-600">{t('organizer.noServices')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.pageBg}`}>
      <Navbar />
      
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={() => router.back()}
          className={`mb-6 flex items-center font-medium outline-none`}
        >
          <div className={`p-2 ${theme.textAccent} rounded-lg transition-colors cursor-pointer ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-200'}`}>
            <IoArrowBack size={20} />
          </div>
          <span className={`ml-2 ${theme.textAccent}`}>{t('organizer.backToDashboard')}</span>
        </button>

        {/* Service Header */}
        <div className={`${theme.cardBg} rounded-lg shadow-lg p-6 mb-6`}>
          <h1 className={`text-3xl font-bold ${theme.textPrimary} mb-2`}>{service.title}</h1>
          <p className={`text-lg ${theme.textSecondary} capitalize mb-4`}>{service.serviceType}</p>
          
          {service.totalReviews > 0 && (
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className={`text-5xl font-bold ${theme.textPrimary} mb-2`}>
                  {service.averageRating?.toFixed(1) || '0.0'}
                </div>
                <div className="flex items-center justify-center mb-1">
                  {[...Array(5)].map((_, i) => (
                    <FaStar 
                      key={i} 
                      className={i < Math.round(service.averageRating) ? 'text-yellow-500' : isDark ? 'text-gray-600' : 'text-gray-300'} 
                      size={20} 
                    />
                  ))}
                </div>
                <div className={`text-sm ${theme.textMuted}`}>
                  {service.totalReviews} {service.totalReviews === 1 ? t('appointments.review') : t('appointments.reviews')}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* All Reviews */}
        <div className={`${theme.cardBg} rounded-lg shadow-lg p-6`}>
          <h2 className={`text-2xl font-semibold ${theme.textPrimary} mb-6`}>
            {t('appointments.allReviews')} ({reviews.length})
          </h2>
          
          {reviews.length === 0 ? (
            <div className="text-center py-8">
              <FaStar className={`mx-auto mb-3 ${theme.textMuted}`} size={48} />
              <p className={`text-lg ${theme.textMuted}`}>{t('appointments.noReviewsYet')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review._id} className={`p-4 rounded-lg border ${theme.border} ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-purple-700' : 'bg-purple-200'} flex items-center justify-center`}>
                        <span className={`font-bold ${isDark ? 'text-purple-200' : 'text-purple-700'}`}>
                          {review.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className={`font-semibold ${theme.textPrimary}`}>{review.user?.name || 'Anonymous'}</p>
                        <div className="flex items-center gap-2">
                          <StarRating rating={review.rating} size={16} editable={false} />
                          <span className={`text-xs ${theme.textMuted}`}>
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {review.review && (
                    <p className={`${theme.textSecondary} mt-2 ml-13`}>{review.review}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
