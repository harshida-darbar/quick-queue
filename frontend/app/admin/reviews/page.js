// quick-queue/frontend/app/admin/reviews/page.js

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  IoStar,
  IoSearch,
  IoFilter,
  IoTrash,
  IoClose,
  IoStarOutline,
  IoDownload,
} from "react-icons/io5";
import api from "../../utils/api";
import Navbar from "../../components/Navbar";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useTheme } from "../../context/ThemeContext";
import { getThemeClass } from "../../config/colors";
import StarRating from "../../components/StarRating";

function ReviewsManagement() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const theme = getThemeClass(isDark);
  const router = useRouter();

  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    filterReviews();
  }, [reviews, searchTerm, ratingFilter]);

  const fetchReviews = async () => {
    try {
      const response = await api.get("/admin/reviews");
      const reviewsData = Array.isArray(response.data) ? response.data : [];
      setReviews(reviewsData);
      setFilteredReviews(reviewsData);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Failed to fetch reviews");
      setReviews([]);
      setFilteredReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const filterReviews = () => {
    if (!Array.isArray(reviews)) {
      setFilteredReviews([]);
      return;
    }

    let filtered = [...reviews];

    // Filter by rating
    if (ratingFilter !== "all") {
      const rating = parseInt(ratingFilter);
      filtered = filtered.filter((review) => Math.floor(review.rating) === rating);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (review) =>
          review.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          review.service?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          review.reviewText?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredReviews(filtered);
  };

  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;

    try {
      await api.delete(`/admin/reviews/${reviewToDelete._id}`);
      toast.success("Review deleted successfully");
      setShowDeleteModal(false);
      setReviewToDelete(null);
      fetchReviews();
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error(error.response?.data?.message || "Failed to delete review");
    }
  };

  const calculateAverageRating = () => {
    if (!Array.isArray(reviews) || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (!Array.isArray(reviews)) return distribution;
    
    reviews.forEach((review) => {
      const rating = Math.floor(review.rating);
      if (distribution[rating] !== undefined) {
        distribution[rating]++;
      }
    });
    return distribution;
  };

  const exportToCSV = () => {
    if (!Array.isArray(filteredReviews) || filteredReviews.length === 0) {
      toast.error("No reviews to export");
      return;
    }

    const headers = ["User", "Email", "Service", "Rating", "Review", "Date"];
    const rows = filteredReviews.map((review) => [
      review.user?.name || "Unknown",
      review.user?.email || "N/A",
      review.service?.title || "Unknown Service",
      review.rating.toFixed(1),
      review.reviewText ? `"${review.reviewText.replace(/"/g, '""')}"` : "No review text",
      new Date(review.createdAt).toLocaleDateString(),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reviews_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Reviews exported successfully");
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

  const ratingDistribution = getRatingDistribution();

  return (
    <div className={`min-h-screen ${theme.pageBg}`}>
      <Navbar />

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <IoStar size={32} className="text-purple-600" />
                <h1 className={`text-3xl font-bold ${theme.textAccent}`}>
                  {t("admin.reviews")}
                </h1>
              </div>
              <p className={`${theme.textSecondary}`}>
                Manage all reviews and ratings across the platform
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className={`${theme.cardBg} rounded-lg shadow p-4 border ${theme.border}`}>
            <p className={`text-sm ${theme.textSecondary} mb-1`}>Total Reviews</p>
            <p className={`text-2xl font-bold ${theme.textAccent}`}>
              {Array.isArray(reviews) ? reviews.length : 0}
            </p>
          </div>
          <div className={`${theme.cardBg} rounded-lg shadow p-4 border ${theme.border}`}>
            <p className={`text-sm ${theme.textSecondary} mb-1`}>Average Rating</p>
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-bold text-yellow-600`}>{calculateAverageRating()}</p>
              <IoStar size={24} className="text-yellow-500" />
            </div>
          </div>
          <div className={`${theme.cardBg} rounded-lg shadow p-4 border ${theme.border}`}>
            <p className={`text-sm ${theme.textSecondary} mb-1`}>5 Stars</p>
            <p className={`text-2xl font-bold text-green-600`}>{ratingDistribution[5]}</p>
          </div>
          <div className={`${theme.cardBg} rounded-lg shadow p-4 border ${theme.border}`}>
            <p className={`text-sm ${theme.textSecondary} mb-1`}>4 Stars</p>
            <p className={`text-2xl font-bold text-blue-600`}>{ratingDistribution[4]}</p>
          </div>
          <div className={`${theme.cardBg} rounded-lg shadow p-4 border ${theme.border}`}>
            <p className={`text-sm ${theme.textSecondary} mb-1`}>≤3 Stars</p>
            <p className={`text-2xl font-bold text-orange-600`}>
              {ratingDistribution[3] + ratingDistribution[2] + ratingDistribution[1]}
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
                placeholder="Search by user, service, or review text..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${theme.border} ${theme.inputBg} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
            </div>

            {/* Rating Filter */}
            <div className="flex items-center gap-2">
              <IoFilter size={20} className={theme.textSecondary} />
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${theme.border} ${theme.inputBg} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer`}
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <p className={`text-sm ${theme.textSecondary}`}>
              Showing {filteredReviews.length} of {reviews.length} reviews
            </p>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 gap-4">
          {filteredReviews.length === 0 ? (
            <div className="text-center py-12">
              <p className={`${theme.textSecondary}`}>No reviews found</p>
            </div>
          ) : (
            filteredReviews.map((review) => (
              <div
                key={review._id}
                className={`${theme.cardBg} rounded-lg shadow-lg p-6 border ${theme.border} hover:shadow-xl transition-shadow`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    {/* User Info */}
                    <div className="flex items-center gap-3 mb-2">
                      <div>
                        <p className={`font-semibold ${theme.textPrimary}`}>
                          {review.user?.name || "Unknown User"}
                        </p>
                        <p className={`text-xs ${theme.textSecondary}`}>
                          {review.user?.email || "No email"}
                        </p>
                      </div>
                    </div>

                    {/* Service Info */}
                    <p className={`text-sm ${theme.textSecondary} mb-3`}>
                      Service: <span className={`font-medium ${theme.textPrimary}`}>
                        {review.service?.title || "Unknown Service"}
                      </span>
                    </p>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-3">
                      <StarRating rating={review.rating} size={20} />
                      <span className={`text-sm font-semibold ${theme.textPrimary}`}>
                        {review.rating.toFixed(1)}
                      </span>
                    </div>

                    {/* Review Text */}
                    {review.reviewText && (
                      <p className={`${theme.textPrimary} mb-3`}>
                        "{review.reviewText}"
                      </p>
                    )}

                    {/* Date */}
                    <p className={`text-xs ${theme.textSecondary}`}>
                      {new Date(review.createdAt).toLocaleDateString()} at{" "}
                      {new Date(review.createdAt).toLocaleTimeString()}
                    </p>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => {
                      setReviewToDelete(review);
                      setShowDeleteModal(true);
                    }}
                    className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 transition-colors cursor-pointer outline-none"
                    title="Delete Review"
                  >
                    <IoTrash size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && reviewToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${theme.cardBg} rounded-lg shadow-2xl max-w-md w-full p-6`}>
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
                <IoTrash size={32} className="text-red-600 dark:text-red-200" />
              </div>
              <h3 className={`text-xl font-bold ${theme.textAccent} mb-2`}>Delete Review</h3>
              <p className={`${theme.textSecondary} mb-4`}>
                Are you sure you want to delete this review by{" "}
                <span className="font-semibold">{reviewToDelete.user?.name}</span>? This action
                cannot be undone.
              </p>
              {reviewToDelete.reviewText && (
                <div className={`text-left p-3 rounded-lg bg-gray-100 dark:bg-gray-800 mb-4`}>
                  <p className={`text-sm ${theme.textPrimary} italic`}>
                    "{reviewToDelete.reviewText}"
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setReviewToDelete(null);
                }}
                className={`flex-1 px-4 py-2 rounded-lg border ${theme.border} ${theme.textPrimary} hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer outline-none`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteReview}
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

export default function ProtectedReviewsManagement() {
  return (
    <ProtectedRoute allowedRoles={[1]}>
      <ReviewsManagement />
    </ProtectedRoute>
  );
}
