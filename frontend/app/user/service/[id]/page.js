// quick-queue/frontend/app/user/service/[id]/page.js

"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import { FaHospital, FaUtensils, FaCut, FaBuilding, FaStar } from "react-icons/fa";
import ReactStars from "react-rating-stars-component";
import api from "../../../utils/api";
import Navbar from "../../../components/Navbar";
import { IoArrowBack } from "react-icons/io5";
import { useTheme } from "../../../context/ThemeContext";
import { getThemeClass } from "../../../config/colors";

export default function ServiceDetails({ params }) {
  const resolvedParams = use(params);
  const { isDark } = useTheme();
  const theme = getThemeClass(isDark);
  const { t } = useTranslation();
  const [service, setService] = useState(null);
  const [servingUsers, setServingUsers] = useState([]);
  const [waitingUsers, setWaitingUsers] = useState([]);
  const [userStatus, setUserStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userCompletedAppointments, setUserCompletedAppointments] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetchServiceDetails();
    fetchUserStatus();
    fetchReviews();
    fetchUserCompletedAppointments();
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

  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      const response = await api.get(`/reviews/queue/${resolvedParams.id}`);
      setReviews(response.data.reviews || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchUserCompletedAppointments = async () => {
    try {
      const response = await api.get('/queue/my-interactions');
      console.log('All user interactions:', response.data);
      console.log('Current service ID:', resolvedParams.id);
      
      const now = new Date();
      
      // Check both booked appointments AND queue entries
      const completed = response.data.filter(interaction => {
        console.log('Checking interaction:', interaction._id, 'Queue ID:', interaction.queue?._id, 'Status:', interaction.status, 'Type:', interaction.type);
        
        // Must be for this service
        if (interaction.queue?._id !== resolvedParams.id) {
          console.log('Queue ID does not match');
          return false;
        }
        
        // Check if status is completed
        if (interaction.status === 'complete' || interaction.status === 'completed') {
          console.log('Status is complete/completed');
          return true;
        }
        
        // For appointments with time slots, check if end time has passed
        if (interaction.type === 'appointment' && interaction.endTime && interaction.date) {
          const [hours, minutes] = interaction.endTime.split(':');
          const endDateTime = new Date(interaction.date);
          endDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          const isPast = now > endDateTime;
          console.log('End time check:', endDateTime, 'Is past:', isPast);
          return isPast;
        }
        
        console.log('No match found');
        return false;
      });
      
      console.log('Completed interactions:', completed);
      setUserCompletedAppointments(completed);
    } catch (error) {
      console.error("Error fetching user interactions:", error);
    }
  };

  const handleSubmitReview = async () => {
    console.log('Submit review clicked, rating:', rating);
    
    if (rating === 0) {
      toast.error(t('appointments.pleaseSelectRating'));
      return;
    }

    if (userCompletedAppointments.length === 0) {
      toast.error(t('appointments.mustCompleteAppointment'));
      return;
    }

    setSubmittingReview(true);
    try {
      console.log('Submitting review with data:', {
        queueId: resolvedParams.id,
        appointmentId: userCompletedAppointments[0]._id,
        rating: rating,
        review: reviewText,
      });
      
      const response = await api.post("/reviews/submit", {
        queueId: resolvedParams.id,
        appointmentId: userCompletedAppointments[0]._id,
        rating: rating,
        review: reviewText,
      });

      console.log('Review submitted successfully:', response.data);
      toast.success(t('appointments.reviewSubmitted'));
      setShowReviewForm(false);
      setRating(0);
      setReviewText("");
      fetchReviews();
      fetchServiceDetails();
    } catch (error) {
      console.error("Error submitting review:", error);
      console.error("Error response:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
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
          className={`mb-6 ${theme.textAccent} flex items-center font-medium outline-none`}
        >
          <IoArrowBack size={20} className="mr-1 cursor-pointer hover:bg-white hover:bg-opacity-20 rounded-lg"/> {t('organizer.backToDashboard')}
        </button>

        {/* Service Header */}
        <div className={`${theme.cardBg} rounded-lg shadow-lg p-6 mb-6`}>
          <div className="flex items-center mb-4">
            {getServiceIcon(service.serviceType)}
            <div className="ml-4">
              <h1 className={`text-3xl font-bold ${theme.textPrimary}`}>{service.title}</h1>
              <p className={`text-lg ${theme.textSecondary} capitalize`}>{service.serviceType}</p>
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
          
          <p className={`${theme.textSecondary} mb-6`}>{service.description}</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-gradient-to-br from-[#B7A3E3] to-[#C47BE4] rounded-lg">
              <div className="text-2xl font-bold text-white">{servingUsers.length}</div>
              <div className="text-sm text-white opacity-90">{t('dashboard.serving')}</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-[#85409D] to-[#C47BE4] rounded-lg">
              <div className="text-2xl font-bold text-white">{waitingUsers.length}</div>
              <div className="text-sm text-white opacity-90">{t('dashboard.waiting')}</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-[#4D2FB2] to-[#62109F] rounded-lg">
              <div className="text-2xl font-bold text-white">{service.maxCapacity}</div>
              <div className="text-sm text-white opacity-90">{t('organizer.maxCapacity')}</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-[#6F00FF] to-[#8C00FF] rounded-lg">
              <div className="text-2xl font-bold text-white">
                {servingUsers.length >= service.maxCapacity ? t('dashboard.full') : t('dashboard.available')}
              </div>
              <div className="text-sm text-white opacity-90">{t('organizer.status')}</div>
            </div>
          </div>

          {/* User Status */}
          {userStatus ? (
            <div className={`p-4 rounded-lg mb-6 border-2 ${getStatusColor(userStatus.status)}`}>
              <h3 className="font-semibold mb-2">{t('organizer.status')}</h3>
              <div className="flex justify-between items-center">
                <div>
                  <p>{t('organizer.token')}: <span className="font-bold">#{userStatus.tokenNumber}</span></p>
                  <p>{t('organizer.status')}: <span className="font-bold capitalize">{userStatus.status}</span></p>
                  {userStatus.status === 'waiting' && (
                    <p>{t('organizer.peopleServing')}: <span className="font-bold">{userStatus.waitingAhead}</span></p>
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
                {joining ? t('forms.joining') : t('dashboard.joinQueue')}
              </button>
            </div>
          )}
        </div>

        {/* Currently Serving */}
        <div className={`${theme.cardBg} rounded-lg shadow-lg p-6 mb-6`}>
          <h2 className={`text-xl font-semibold ${theme.textPrimary} mb-4`}>{t('organizer.currentlyServing')}</h2>
          {servingUsers.length === 0 ? (
            <p className={theme.textMuted}>{t('organizer.noOneServing')}</p>
          ) : (
            <div className="space-y-2">
              {servingUsers.map((entry, index) => (
                <div key={entry._id} className={`flex justify-between items-center p-3 ${theme.statusSuccess} rounded-lg border`}>
                  <div>
                    <span className={`font-medium ${theme.textPrimary}`}>{t('organizer.token')} #{entry.tokenNumber}</span>
                    <span className={`${theme.textSecondary} ml-2`}>{entry.user?.name || t('organizer.unknownUser')}</span>
                  </div>
                  <span className="px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs">
                    {t('dashboard.serving')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Waiting List */}
        <div className={`${theme.cardBg} rounded-lg shadow-lg p-6 mb-6`}>
          <h2 className={`text-xl font-semibold ${theme.textPrimary} mb-4`}>{t('organizer.waitingList')}</h2>
          {waitingUsers.length === 0 ? (
            <p className={theme.textMuted}>{t('organizer.noOneWaiting')}</p>
          ) : (
            <div className="space-y-2">
              {waitingUsers.map((entry, index) => (
                <div key={entry._id} className={`flex justify-between items-center p-3 ${theme.statusWarning} rounded-lg border`}>
                  <div>
                    <span className={`font-medium ${theme.textPrimary}`}>{t('organizer.token')} #{entry.tokenNumber}</span>
                    <span className={`${theme.textSecondary} ml-2`}>{entry.user?.name || t('organizer.unknownUser')}</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`text-sm ${theme.textMuted} mr-2`}>{t('organizer.position')}: {index + 1}</span>
                    <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs">
                      {t('dashboard.waiting')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reviews Section - Always visible */}
        <div className={`${theme.cardBg} rounded-lg shadow-lg p-6`}>
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h2 className={`text-2xl font-semibold ${theme.textPrimary} mb-4`}>{t('appointments.reviews')}</h2>
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
            
            {/* Only show Write Review button if user has completed appointment */}
            {userCompletedAppointments.length > 0 && !showReviewForm && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="px-4 py-2 bg-gradient-to-r from-[#4D2FB2] to-[#62109F] text-white rounded-lg hover:from-[#62109F] hover:to-[#8C00FF] transition-all duration-300 font-medium text-sm flex items-center gap-2 cursor-pointer"
              >
                <FaStar size={14} /> {t('appointments.writeReview')}
              </button>
            )}
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <div className={`mb-6 p-6 rounded-xl border-2 ${isDark ? 'border-purple-700 bg-purple-900/20' : 'border-purple-200 bg-purple-50'}`}>
              <h3 className={`text-lg font-bold ${theme.textPrimary} mb-4`}>{t('appointments.rateService')}</h3>
              
              <div className="mb-4">
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                  {t('appointments.yourRating')} *
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <FaStar
                        size={40}
                        className={star <= rating ? 'text-yellow-500' : isDark ? 'text-gray-600' : 'text-gray-300'}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className={`text-sm ${theme.textMuted} mt-2`}>
                    {rating} {rating === 1 ? 'star' : 'stars'} selected
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                  {t('appointments.writeReview')}
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder={t('appointments.reviewPlaceholder')}
                  rows={4}
                  maxLength={500}
                  className={`w-full px-4 py-3 rounded-lg border ${theme.border} ${theme.cardBg} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                />
                <p className={`text-xs ${theme.textMuted} mt-1`}>{reviewText.length}/500</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSubmitReview}
                  disabled={submittingReview || rating === 0}
                  className="flex-1 py-3 bg-gradient-to-r from-[#4D2FB2] to-[#62109F] text-white rounded-lg hover:from-[#62109F] hover:to-[#8C00FF] transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submittingReview ? t('appointments.submittingReview') : t('appointments.submitReview')}
                </button>
                <button
                  onClick={() => {
                    setShowReviewForm(false);
                    setRating(0);
                    setReviewText("");
                  }}
                  disabled={submittingReview}
                  className={`px-6 py-3 border ${theme.border} rounded-lg ${theme.textSecondary} hover:${theme.textAccent} transition-colors disabled:opacity-50 cursor-pointer`}>
                  {t('forms.cancel')}
                </button>
              </div>
            </div>
          )}

          {/* Reviews List */}
          {reviewsLoading ? (
            <div className="text-center py-8">
              <div className={`text-lg ${theme.textMuted}`}>{t('common.loading')}</div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8">
              <FaStar className={`mx-auto mb-3 ${theme.textMuted}`} size={48} />
              <p className={`text-lg ${theme.textMuted}`}>{t('appointments.noReviewsYet')}</p>
              <p className={`text-sm ${theme.textMuted} mt-1`}>{t('appointments.beFirstToReview')}</p>
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
                          <ReactStars
                            count={5}
                            value={review.rating}
                            size={16}
                            activeColor="#ffd700"
                            color={isDark ? '#4a5568' : '#e2e8f0'}
                            edit={false}
                          />
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
