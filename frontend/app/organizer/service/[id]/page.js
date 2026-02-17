// quick-queue/frontend/app/organizer/service/[id]/page.js

"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { FaHospital, FaUtensils, FaCut, FaBuilding, FaDownload } from "react-icons/fa";
import api from "../../../utils/api";
import Navbar from "../../../components/Navbar";
import StarRating from "../../../components/StarRating";
import { IoArrowBack } from "react-icons/io5";
import { useTheme } from "../../../context/ThemeContext";
import { getThemeClass } from "../../../config/colors";

export default function ServiceManagement({ params }) {
  const resolvedParams = use(params);
  const [service, setService] = useState(null);
  const [servingUsers, setServingUsers] = useState([]);
  const [waitingUsers, setWaitingUsers] = useState([]);
  const [completedUsers, setCompletedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const { t } = useTranslation();
  const router = useRouter();
  const { isDark } = useTheme();
  const theme = getThemeClass(isDark);
  

  useEffect(() => {
    fetchServiceDetails();
    fetchReviews();
    const interval = setInterval(fetchServiceDetails, 5000);
    return () => clearInterval(interval);
  }, [resolvedParams.id]);

  const fetchServiceDetails = async () => {
    try {
      const response = await api.get(`/queue/services/${resolvedParams.id}`);
      console.log('Service data:', response.data.service);
      console.log('Serving capacity:', response.data.service.servingCapacity);
      setService(response.data.service);
      setServingUsers(response.data.servingUsers);
      setWaitingUsers(response.data.waitingUsers);
      setCompletedUsers(response.data.completedUsers || []);
    } catch (error) {
      console.error("Error fetching service details:", error);
      toast.error("Failed to fetch service details");
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await api.get(`/reviews/queue/${resolvedParams.id}?limit=100`);
      setReviews(response.data.reviews || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleMoveToServing = async (entryId) => {
    try {
      await api.patch(`/queue/services/${resolvedParams.id}/serving`, {
        entryId,
      });
      toast.success("User moved to serving!");
      fetchServiceDetails();
    } catch (error) {
      console.error("Error moving to serving:", error);
      toast.error(
        error.response?.data?.message || "Error moving user to serving",
      );
    }
  };

  const handleMoveToWaiting = async (entryId) => {
    try {
      await api.patch(`/queue/services/${resolvedParams.id}/waiting`, {
        entryId,
      });
      toast.success("User moved to waiting!");
      fetchServiceDetails();
    } catch (error) {
      console.error("Error moving to waiting:", error);
      toast.error("Error moving user to waiting");
    }
  };

  const handleMarkComplete = async (entryId) => {
    const entry = servingUsers.find(u => u._id === entryId);
    setSelectedEntry(entry);
    setShowConfirmModal(true);
  };

  const confirmComplete = async () => {
    try {
      await api.patch(`/queue/services/${resolvedParams.id}/complete`, {
        entryId: selectedEntry._id,
      });
      toast.success("User marked as complete!");
      setShowConfirmModal(false);
      setSelectedEntry(null);
      fetchServiceDetails();
    } catch (error) {
      console.error("Error marking complete:", error);
      toast.error("Error marking user as complete");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDownloadQueueInvoice = (entry) => {
    const pricePerPerson = (service?.price || 0) / (entry.groupSize || 1);
    const totalAmount = entry.paymentAmount || service?.price || 0;
    
    // Generate invoice number if not present
    let invoiceNum = entry.invoiceNumber;
    if (!invoiceNum) {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      invoiceNum = `INV-${dateStr}-${randomNum}`;
    }
    
    const invoiceWindow = window.open('', '_blank');
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${service?.title || 'Service'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            padding: 15px 10px; 
            max-width: 900px; 
            margin: 0 auto;
            background: #f5f5f5;
          }
          .invoice-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header { 
            text-align: center; 
            padding: 18px 15px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .header h1 { 
            font-size: 26px;
            margin-bottom: 6px;
            letter-spacing: 2px;
          }
          .payment-badge {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 5px 14px;
            border-radius: 20px;
            font-size: 12px;
            margin-top: 6px;
          }
          .invoice-number {
            color: rgba(255,255,255,0.9);
            font-size: 12px;
            margin-top: 6px;
          }
          .content { padding: 18px; }
          .section { 
            margin-bottom: 12px;
            padding-bottom: 10px;
            border-bottom: 2px solid #f0f0f0;
          }
          .section:last-child { border-bottom: none; margin-bottom: 0; }
          .section-title { 
            font-size: 15px;
            font-weight: 600;
            color: #667eea;
            margin-bottom: 8px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 8px;
          }
          .info-item {
            display: flex;
            flex-direction: column;
          }
          .info-label {
            font-size: 10px;
            color: #6b7280;
            margin-bottom: 2px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .info-value {
            font-size: 13px;
            color: #1f2937;
            font-weight: 500;
          }
          .members-list {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            margin-top: 5px;
          }
          .member-badge {
            background: #ede9fe;
            color: #7c3aed;
            padding: 2px 8px;
            border-radius: 20px;
            font-size: 11px;
          }
          .payment-box {
            background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
            padding: 12px;
            border-radius: 10px;
            margin-top: 5px;
          }
          .payment-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
            font-size: 13px;
          }
          .payment-row.total {
            font-size: 17px;
            font-weight: bold;
            color: #667eea;
            padding-top: 8px;
            border-top: 2px solid #c4b5fd;
            margin-top: 5px;
          }
          .footer {
            text-align: center;
            padding: 6px;
            color: #6b7280;
            font-size: 10px;
            background: #f9fafb;
          }
          @media print {
            body { background: white; padding: 0; }
            .no-print { display: none; }
            .invoice-container { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <h1>BOOKING INVOICE</h1>
            <div class="payment-badge">✓ Payment Confirmed</div>
            <div class="invoice-number">Invoice #: ${invoiceNum}</div>
          </div>
          
          <div class="content">
            <div class="section">
              <div class="section-title">Service Details</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Service Name</div>
                  <div class="info-value">${service?.title || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Service Type</div>
                  <div class="info-value" style="text-transform: capitalize;">${service?.serviceType || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Token Number</div>
                  <div class="info-value" style="color: #667eea; font-size: 20px;">#${entry.tokenNumber}</div>
                </div>
                ${service?.address ? `
                  <div class="info-item" style="grid-column: 1 / -1;">
                    <div class="info-label">Location</div>
                    <div class="info-value">${service.address}</div>
                  </div>
                ` : ''}
              </div>
            </div>

            <div class="section">
              <div class="section-title">Booking Details</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Booked Date</div>
                  <div class="info-value">${formatDate(entry.createdAt)}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Booked Time</div>
                  <div class="info-value">${new Date(entry.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Group Size</div>
                  <div class="info-value">${entry.groupSize} ${entry.groupSize === 1 ? 'Person' : 'People'}</div>
                </div>
                ${entry.memberNames && entry.memberNames.length > 0 ? `
                  <div class="info-item" style="grid-column: 1 / -1;">
                    <div class="info-label">Members</div>
                    <div class="members-list">
                      ${entry.memberNames.map(name => `<span class="member-badge">${name}</span>`).join('')}
                    </div>
                  </div>
                ` : ''}
              </div>
            </div>

            <div class="section">
              <div class="section-title">Payment Information</div>
              <div class="payment-box">
                <div class="payment-row">
                  <span>Price per person:</span>
                  <span>₹${pricePerPerson.toFixed(2)}</span>
                </div>
                <div class="payment-row">
                  <span>Number of people:</span>
                  <span>× ${entry.groupSize}</span>
                </div>
                <div class="payment-row">
                  <span>Payment Status:</span>
                  <span style="color: #10b981;">✓ Paid</span>
                </div>
                <div class="payment-row total">
                  <span>Total Amount:</span>
                  <span>₹${totalAmount}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for choosing our service!</p>
            <p style="margin-top: 5px;">Invoice generated on ${new Date().toLocaleString()}</p>
          </div>

          <div class="no-print" style="text-align: center; padding: 20px;">
            <button onclick="window.print()" style="padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 500;">
              Download Invoice (PDF)
            </button>
          </div>
        </div>
      </body>
      </html>
    `;
    
    invoiceWindow.document.write(invoiceHTML);
    invoiceWindow.document.close();
  };

  const getServiceIcon = (type) => {
    const iconProps = { size: 32, className: `text-[#62109F] ${theme.textPrimary}` };
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

  if (loading) {
    return (
      <div className={theme.pageBg}>
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className={`text-xl ${theme.textPrimary}`}>
            Loading service management...
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className={theme.pageBg}>
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className={`text-xl ${theme.statusError}`}>Service not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className={theme.pageBg}>
      <Navbar />

      <div className="max-w-6xl mx-auto p-6">
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              {getServiceIcon(service.serviceType)}
              <div className="ml-4">
                <h1 className={`text-2xl font-bold ${theme.textPrimary}`}>
                  {service.title}
                </h1>
                <p className={`${theme.textSecondary} capitalize`}>
                  {service.serviceType}
                </p>
              </div>
            </div>
            <div
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                service.status === "active"
                  ? `bg-green-100 ${isDark ? 'bg-green-900/30' : ''} text-green-800 ${isDark ? 'text-green-300' : ''} capitalize`
                  : `bg-gray-100 ${isDark ? 'bg-gray-700' : ''} text-gray-800 ${isDark ? 'text-gray-300' : ''} capitalize`
              }`}
            >
              {t(`organizer.${service.status}`)}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gradient-to-br from-[#B7A3E3] to-[#C47BE4] rounded-lg">
              <div className="text-2xl font-bold text-white">
                {service.servingCapacity || 0}
              </div>
              <div className="text-sm text-white opacity-90">
                {t('organizer.peopleServing')}
              </div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-[#85409D] to-[#C47BE4] rounded-lg">
              <div className="text-2xl font-bold text-white">
                {waitingUsers.length}
              </div>
              <div className="text-sm text-white opacity-90">{t('organizer.groupsWaiting')}</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-[#4D2FB2] to-[#62109F] rounded-lg">
              <div className="text-2xl font-bold text-white">
                {service.maxCapacity}
              </div>
              <div className="text-sm text-white opacity-90">{t('organizer.maxCapacity')}</div>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-[#6F00FF] to-[#8C00FF] rounded-lg">
              <div className="text-2xl font-bold text-white">
                {service.maxCapacity - (service.servingCapacity || 0)}
              </div>
              <div className="text-sm text-white opacity-90">
                {t('organizer.availableSpots')}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Waiting List */}
          <div className={`${theme.cardBg} rounded-lg shadow-lg p-6`}>
            <h2 className={`text-xl font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
              <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
              {t('organizer.waitingList')} ({waitingUsers.length})
            </h2>

            {waitingUsers.length === 0 ? (
              <p className={`${theme.textMuted} text-center py-8`}>
                {t('organizer.noOneWaiting')}
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {waitingUsers.map((entry, index) => (
                  <div
                    key={entry._id}
                    className={`p-4 bg-yellow-50 ${isDark ? 'bg-yellow-900/20' : ''} rounded-lg border border-yellow-200 ${isDark ? 'border-yellow-700' : ''}`}
                  >
                    <div className="mb-3">
                      <div className={`font-semibold ${theme.textPrimary}`}>
                        {t('organizer.token')} #{entry.tokenNumber}
                      </div>
                      <div className={`text-sm ${theme.textSecondary}`}>
                        {entry.user?.name || 'Unknown User'}
                      </div>
                      <div className={`text-xs ${theme.textMuted}`}>
                        {t('organizer.position')}: {index + 1}
                      </div>
                      {entry.memberNames && entry.memberNames.length > 0 && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          {t('organizer.group')}: {entry.memberNames.join(", ")} (
                          {entry.groupSize} {t('organizer.people')})
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => handleMoveToServing(entry._id)}
                        disabled={(service.servingCapacity || 0) + entry.groupSize > service.maxCapacity}
                        className={`px-3 py-2 rounded-md transition-all duration-300 text-sm cursor-pointer outline-none ${
                          (service.servingCapacity || 0) + entry.groupSize > service.maxCapacity
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
                        }`}
                      >
                        {t('organizer.startServing')} ({entry.groupSize} {t('organizer.people')})
                      </button>
                      <button
                        onClick={() => handleDownloadQueueInvoice(entry)}
                        className="px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-sm cursor-pointer outline-none flex items-center justify-center gap-2"
                      >
                        <FaDownload size={12} />
                        {t('appointments.invoice')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Currently Serving */}
          <div className={`${theme.cardBg} rounded-lg shadow-lg p-6`}>
            <h2 className={`text-xl font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              {t('organizer.currentlyServing')} ({service.servingCapacity || 0}/{service.maxCapacity} {t('organizer.people')})
            </h2>

            {servingUsers.length === 0 ? (
              <p className={`${theme.textMuted} text-center py-8`}>
                No one is currently being served
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {servingUsers.map((entry) => (
                  <div
                    key={entry._id}
                    className={`p-4 bg-green-50 ${isDark ? 'bg-green-900/20' : ''} rounded-lg border border-green-200 ${isDark ? 'border-green-700' : ''}`}
                  >
                    <div className="mb-3">
                      <div className={`font-semibold ${theme.textPrimary}`}>
                        {t('organizer.token')} #{entry.tokenNumber}
                      </div>
                      <div className={`text-sm ${theme.textSecondary}`}>
                        {entry.user?.name || 'Unknown User'}
                      </div>
                      <div className={`text-xs ${theme.textMuted}`}>
                        {entry.user?.email || 'No email'}
                      </div>
                      {entry.memberNames && entry.memberNames.length > 0 && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          {t('organizer.group')}: {entry.memberNames.join(", ")} (
                          {entry.groupSize} {t('organizer.people')})
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => handleMarkComplete(entry._id)}
                        className="px-3 py-2 bg-gradient-to-r from-[#62109F] to-[#8C00FF] text-white rounded-md hover:from-[#8C00FF] hover:to-[#6F00FF] transition-all duration-300 text-sm cursor-pointer outline-none"
                      >
                        {t('organizer.complete')}
                      </button>
                      <button
                        onClick={() => handleDownloadQueueInvoice(entry)}
                        className="px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-sm cursor-pointer outline-none flex items-center justify-center gap-2"
                      >
                        <FaDownload size={12} />
                        {t('appointments.invoice')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Users */}
          <div className={`${theme.cardBg} rounded-lg shadow-lg p-6`}>
            <h2 className={`text-xl font-semibold ${theme.textPrimary} mb-4 flex items-center`}>
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
              {t('organizer.completed')} ({completedUsers.length})
            </h2>

            {completedUsers.length === 0 ? (
              <p className={`${theme.textMuted} text-center py-8`}>
                {t('organizer.noCompletedYet')}
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {completedUsers.map((entry) => (
                  <div
                    key={entry._id}
                    className={`p-4 bg-blue-50 ${isDark ? 'bg-blue-900/20' : ''} rounded-lg border border-blue-200 ${isDark ? 'border-blue-700' : ''}`}
                  >
                    <div>
                      <div className={`font-semibold ${theme.textPrimary}`}>
                        {t('organizer.token')} #{entry.tokenNumber}
                      </div>
                      <div className={`text-sm ${theme.textSecondary}`}>
                        {entry.user?.name || 'Unknown User'}
                      </div>
                      <div className={`text-xs ${theme.textMuted}`}>
                        {entry.user?.email || 'No email'}
                      </div>
                      {entry.memberNames && entry.memberNames.length > 0 && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          {t('organizer.complete')}: {entry.memberNames.join(", ")} (
                          {entry.groupSize} {t('organizer.people')})
                        </div>
                      )}
                      <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                        ✅ {t('organizer.completedAt')}{" "}
                        {new Date(entry.updatedAt).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadQueueInvoice(entry)}
                      className="mt-3 w-full px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-sm cursor-pointer outline-none flex items-center justify-center gap-2"
                    >
                      <FaDownload size={12} />
                      {t('appointments.invoice')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className={`mt-6 ${theme.cardBg} rounded-lg shadow-lg p-6`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-xl font-semibold ${theme.textPrimary}`}>
              {t('appointments.reviews')}
            </h3>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className={`text-3xl font-bold ${theme.textAccent}`}>
                  {service.averageRating ? service.averageRating.toFixed(1) : '0.0'}
                </div>
                <StarRating rating={service.averageRating || 0} size={20} />
                <div className={`text-sm ${theme.textMuted} mt-1`}>
                  {service.totalReviews || 0} {service.totalReviews === 1 ? t('appointments.review') : t('appointments.reviews')}
                </div>
              </div>
            </div>
          </div>

          {reviewsLoading ? (
            <div className={`text-center py-8 ${theme.textSecondary}`}>
              Loading reviews...
            </div>
          ) : reviews.length === 0 ? (
            <div className={`text-center py-8 ${theme.textMuted}`}>
              {t('appointments.noReviews')}
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {reviews.slice(0, 3).map((review) => (
                  <div
                    key={review._id}
                    className={`p-4 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {review.user?.profileImage ? (
                          <img
                            src={`http://localhost:5000${review.user.profileImage}`}
                            alt={review.user.name}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-[#62109F] to-[#8C00FF] flex items-center justify-center text-white font-semibold ${review.user?.profileImage ? 'hidden' : ''}`}>
                          {review.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className={`font-semibold ${theme.textPrimary}`}>
                            {review.user?.name || 'Anonymous'}
                          </div>
                          <div className="flex items-center gap-2">
                            <StarRating rating={review.rating} size={16} />
                            <span className={`text-xs ${theme.textMuted}`}>
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {review.review && (
                      <p className={`${theme.textSecondary} text-sm mt-2 ml-13`}>
                        {review.review}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              
              {reviews.length > 3 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => router.push(`/user/reviews/${resolvedParams.id}`)}
                    className="px-6 py-2 bg-gradient-to-r from-[#62109F] to-[#8C00FF] text-white rounded-lg hover:from-[#8C00FF] hover:to-[#6F00FF] transition-all duration-300 cursor-pointer outline-none"
                  >
                    {t('appointments.seeAllReviews')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className={`mt-6 ${theme.cardBg} rounded-lg shadow-lg p-6`}>
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>
            {t('organizer.quickActions')}
          </h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className={theme.textSecondary}>
              <span className="font-medium">{t('organizer.totalPeople')}:</span>{" "}
              {(service.servingCapacity || 0) + waitingUsers.reduce((sum, user) => sum + user.groupSize, 0)} {t('organizer.people')}
            </div>
            <div className={theme.textSecondary}>
              <span className="font-medium">{t('organizer.capacityUsage')}:</span>{" "}
              {Math.round(((service.servingCapacity || 0) / service.maxCapacity) * 100)}%
            </div>
            <div className={theme.textSecondary}>
              <span className="font-medium">{t('organizer.status')}:</span>
              <span
                className={`ml-1 font-semibold ${
                  (service.servingCapacity || 0) >= service.maxCapacity
                    ? theme.statusError
                    : theme.statusSuccess
                }`}
              >
                {(service.servingCapacity || 0) >= service.maxCapacity
                  ? t('organizer.full')
                  : t('organizer.available')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedEntry && (
        <div className="fixed inset-0 backdrop-blur-lg flex items-center justify-center z-50">
          <div className={`${theme.cardBg} rounded-lg p-6 w-full max-w-md shadow-2xl`}>
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>
              {t('organizer.confirmCompletion')}
            </h3>
            <p className={`${theme.textSecondary} mb-6`}>
              {t('organizer.confirmCompletionMessage')} <strong>{selectedEntry.user?.name || 'Unknown User' }</strong> ({t('organizer.token')} #{selectedEntry.tokenNumber}) as complete?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedEntry(null);
                }}
                className={`px-4 py-2 ${theme.textSecondary} ${theme.border}border border-gray-300 hover:bg-gray-400 rounded-md hover:opacity-80 transition-colors cursor-pointer outline-none`}
              >
               {t('organizer.noCancel')}
              </button>
              <button
                onClick={confirmComplete}
                className="px-4 py-2 bg-[#62109F] text-white rounded-md hover:bg-[#8C00FF] transition-colors cursor-pointer outline-none"
              >
                {t('organizer.yesComplete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
