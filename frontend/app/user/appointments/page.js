// quick-queue/frontend/app/user/appointments/page.js

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { IoCalendarOutline, IoTimeOutline, IoPeopleOutline, IoArrowBack, IoCheckmarkCircle, IoCloseCircle, IoRefreshCircle, IoDownloadOutline, IoWarning } from "react-icons/io5";
import api from "../../utils/api";
import Navbar from "../../components/Navbar";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useTheme } from "../../context/ThemeContext";
import { getThemeClass } from "../../config/colors";

function MyAppointments() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const theme = getThemeClass(isDark);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'past', or 'cancelled'
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchMyAppointments();
  }, []);

  const fetchMyAppointments = async () => {
    try {
      const response = await api.get("/queue/my-appointments");
      setAppointments(response.data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to fetch appointments");
    } finally {
      setLoading(false);
    }
  };

  const isUpcoming = (appointment) => {
    if (!appointment.date) return false;
    
    const now = new Date();
    const appointmentDate = new Date(appointment.date);
    
    // If has end time, check if end time has passed
    if (appointment.endTime) {
      const [hours, minutes] = appointment.endTime.split(':');
      appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      return now < appointmentDate;
    }
    
    // Otherwise just check date
    appointmentDate.setHours(23, 59, 59, 999);
    return now < appointmentDate;
  };

  const upcomingAppointments = appointments.filter(app => isUpcoming(app) && app.status !== 'cancelled');
  const pastAppointments = appointments.filter(app => !isUpcoming(app) && app.status !== 'cancelled');
  const cancelledAppointments = appointments.filter(app => app.status === 'cancelled');

  const handleCancelClick = (appointment) => {
    // Check if appointment is within 1 hour
    if (appointment.date && appointment.startTime) {
      const now = new Date();
      const appointmentDate = new Date(appointment.date);
      const [hours, minutes] = appointment.startTime.split(':');
      appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const timeDiff = appointmentDate - now;
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      const minutesLeft = Math.floor(timeDiff / (1000 * 60));
      
      if (hoursDiff < 1) {
        if (minutesLeft <= 0) {
          toast.error("Cannot cancel appointment. The appointment time has already started or passed.");
        } else if (minutesLeft === 1) {
          toast.error("Cannot cancel appointment. Only 1 minute is left before the appointment starts.");
        } else {
          toast.error(`Cannot cancel appointment. Only ${minutesLeft} minutes left before the appointment starts.`);
        }
        return;
      }
    }
    
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };

  const handleCancelAppointment = async () => {
    try {
      const response = await api.delete(`/queue/appointments/${selectedAppointment._id}`);
      
      // Show refund information
      const { refundPercentage, refundAmount, refundMessage, originalAmount } = response.data;
      
      if (refundPercentage > 0) {
        toast.success(
          `Appointment cancelled successfully! ${refundMessage}: ₹${refundAmount.toFixed(2)} will be refunded (Original: ₹${originalAmount})`,
          { autoClose: 5000 }
        );
      } else {
        toast.success(
          `Appointment cancelled successfully! ${refundMessage}`,
          { autoClose: 5000 }
        );
      }
      
      setShowCancelModal(false);
      setSelectedAppointment(null);
      fetchMyAppointments();
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast.error(error.response?.data?.message || "Failed to cancel appointment");
    }
  };

  const handleDownloadRefundInvoice = (appointment) => {
    console.log('Full appointment object:', JSON.stringify(appointment, null, 2)); // Full debug
    
    const service = appointment.queue || appointment.service;
    let originalAmount = appointment.paymentAmount || 0;
    let refundAmount = appointment.refundAmount || 0;
    let refundPercentage = appointment.refundPercentage || 0;
    
    // If refund data is missing (old cancelled appointments), calculate it now
    if (refundPercentage === 0 && appointment.date && appointment.startTime) {
      // Use current time as cancellation time if cancelledAt is missing
      const cancelTime = appointment.cancelledAt ? new Date(appointment.cancelledAt) : new Date();
      const appointmentDate = new Date(appointment.date);
      const [hours, minutes] = appointment.startTime.split(':');
      appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const timeDiff = appointmentDate - cancelTime;
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      console.log('Calculating refund:', { cancelTime, appointmentDate, hoursDiff });
      
      if (hoursDiff >= 24) {
        refundPercentage = 50;
      } else if (hoursDiff >= 12) {
        refundPercentage = 25;
      } else if (hoursDiff >= 6) {
        refundPercentage = 10;
      }
      
      refundAmount = (originalAmount * refundPercentage) / 100;
    }
    
    console.log('Final refund data:', { originalAmount, refundAmount, refundPercentage }); // Debug log
    
    // Format dates properly
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (e) {
        return 'N/A';
      }
    };

    const formatDateOnly = (dateString) => {
      if (!dateString) return 'N/A';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric'
        });
      } catch (e) {
        return 'N/A';
      }
    };
    
    // Use updatedAt or current time for cancelled date if cancelledAt is missing
    const cancelledDate = appointment.cancelledAt || appointment.updatedAt || new Date().toISOString();
    const bookingDate = appointment.createdAt || new Date(appointment.date).toISOString();
    
    console.log('Date values:', {
      cancelledAt: appointment.cancelledAt,
      updatedAt: appointment.updatedAt,
      createdAt: appointment.createdAt,
      date: appointment.date,
      finalCancelledDate: cancelledDate,
      finalBookingDate: bookingDate
    });
    
    // Generate invoice number if not present
    let invoiceNum = appointment.invoiceNumber;
    if (!invoiceNum) {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      invoiceNum = `REF-${dateStr}-${randomNum}`;
    }
    
    const invoiceWindow = window.open('', '_blank');
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Refund Invoice - ${service?.title || 'Service'}</title>
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
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
          }
          .header h1 { 
            font-size: 26px;
            margin-bottom: 6px;
            letter-spacing: 2px;
          }
          .refund-badge {
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
            color: #ef4444;
            margin-bottom: 8px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
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
          .refund-box {
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
            padding: 12px;
            border-radius: 10px;
            margin-top: 5px;
          }
          .refund-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
            font-size: 13px;
          }
          .refund-row.total {
            font-size: 17px;
            font-weight: bold;
            color: #10b981;
            padding-top: 8px;
            border-top: 2px solid #fca5a5;
            margin-top: 5px;
          }
          .cancelled-notice {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 12px;
            margin-bottom: 12px;
            border-radius: 4px;
          }
          .cancelled-notice p {
            color: #92400e;
            font-size: 13px;
            margin-bottom: 4px;
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
            <h1>REFUND INVOICE</h1>
            <div class="refund-badge">✓ Cancelled & Refunded</div>
            <div class="invoice-number">Invoice #: ${invoiceNum}</div>
          </div>
          
          <div class="content">
            <div class="cancelled-notice">
              <p><strong>Appointment Cancelled</strong></p>
              <p>Cancelled on: ${formatDate(cancelledDate)}</p>
            </div>

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
                ${appointment.tokenNumber ? `
                  <div class="info-item">
                    <div class="info-label">Token Number</div>
                    <div class="info-value" style="color: #ef4444; font-size: 20px;">#${appointment.tokenNumber}</div>
                  </div>
                ` : ''}
                ${service?.address ? `
                  <div class="info-item" style="grid-column: 1 / -1;">
                    <div class="info-label">Location</div>
                    <div class="info-value">${service.address}</div>
                  </div>
                ` : ''}
              </div>
            </div>

            <div class="section">
              <div class="section-title">Original Booking Details</div>
              <div class="info-grid">
                ${appointment.date ? `
                  <div class="info-item">
                    <div class="info-label">Booked Date</div>
                    <div class="info-value">${formatDateOnly(appointment.date)}</div>
                  </div>
                ` : ''}
                ${appointment.startTime ? `
                  <div class="info-item">
                    <div class="info-label">Time Slot</div>
                    <div class="info-value">${appointment.startTime} - ${appointment.endTime || 'N/A'}</div>
                  </div>
                ` : ''}
                <div class="info-item">
                  <div class="info-label">Group Size</div>
                  <div class="info-value">${appointment.groupSize || 1} ${appointment.groupSize === 1 ? 'Person' : 'People'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Booking Date</div>
                  <div class="info-value">${formatDateOnly(bookingDate)}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Refund Information</div>
              <div class="refund-box">
                <div class="refund-row">
                  <span>Original Amount:</span>
                  <span>₹${originalAmount.toFixed(2)}</span>
                </div>
                <div class="refund-row">
                  <span>Refund Percentage:</span>
                  <span>${refundPercentage}%</span>
                </div>
                <div class="refund-row">
                  <span>Cancellation Fee:</span>
                  <span>₹${(originalAmount - refundAmount).toFixed(2)}</span>
                </div>
                <div class="refund-row total">
                  <span>Refund Amount:</span>
                  <span>₹${refundAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>This is a system-generated refund invoice</p>
            <p style="margin-top: 5px;">Generated on ${new Date().toLocaleString()}</p>
          </div>

          <div class="no-print" style="text-align: center; padding: 20px;">
            <button onclick="window.print()" style="padding: 12px 30px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 500;">
              Download Refund Invoice (PDF)
            </button>
          </div>
        </div>
      </body>
      </html>
    `;
    
    invoiceWindow.document.write(invoiceHTML);
    invoiceWindow.document.close();
  };

  const handleRebookClick = (appointment) => {
    // Navigate to dashboard to browse services
    router.push('/user/dashboard');
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
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

  const displayedAppointments = activeTab === 'upcoming' ? upcomingAppointments : activeTab === 'past' ? pastAppointments : cancelledAppointments;

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
            <IoCalendarOutline size={32} />
            {t('navbar.myAppointments')}
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 outline-none cursor-pointer ${
              activeTab === 'upcoming'
                ? 'bg-gradient-to-r from-[#62109F] to-[#8C00FF] text-white shadow-lg'
                : `${theme.cardBg} ${theme.textSecondary} hover:opacity-80`
            }`}
          >
            Upcoming ({upcomingAppointments.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 outline-none cursor-pointer ${
              activeTab === 'past'
                ? 'bg-gradient-to-r from-[#62109F] to-[#8C00FF] text-white shadow-lg'
                : `${theme.cardBg} ${theme.textSecondary} hover:opacity-80`
            }`}
          >
            Past ({pastAppointments.length})
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 outline-none cursor-pointer ${
              activeTab === 'cancelled'
                ? 'bg-gradient-to-r from-[#62109F] to-[#8C00FF] text-white shadow-lg'
                : `${theme.cardBg} ${theme.textSecondary} hover:opacity-80`
            }`}
          >
            Cancelled ({cancelledAppointments.length})
          </button>
        </div>

        {/* Cancellation Policy Notice for Upcoming Tab */}
        {activeTab === 'upcoming' && upcomingAppointments.length > 0 && (
          <div className={`mb-6 p-4 rounded-lg border-l-4 border-yellow-500 ${isDark ? 'bg-yellow-900/20' : 'bg-yellow-50'}`}>
            <div className="flex items-start gap-3">
              <IoWarning className="text-yellow-500 text-2xl flex-shrink-0 mt-0.5" />
              <div>
                <p className={`font-semibold ${theme.textPrimary} mb-1`}>Cancellation & Refund Policy</p>
                <p className={`text-sm ${theme.textSecondary} mb-2`}>
                  Refunds are calculated based on when you cancel:
                </p>
                <ul className={`text-sm ${theme.textSecondary} space-y-1 ml-4`}>
                  <li>• Cancel 24+ hours before: <span className="font-semibold text-green-600">50% refund</span></li>
                  <li>• Cancel 12-24 hours before: <span className="font-semibold text-blue-600">25% refund</span></li>
                  <li>• Cancel 6-12 hours before: <span className="font-semibold text-orange-600">10% refund</span></li>
                  <li>• Cancel less than 6 hours before: <span className="font-semibold text-red-600">No refund</span></li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {displayedAppointments.length === 0 ? (
          <div className={`text-center py-12 ${theme.cardBg} rounded-lg shadow-lg`}>
            <IoCalendarOutline size={64} className={`mx-auto ${theme.textMuted} mb-4`} />
            <h3 className={`text-xl font-semibold ${theme.textSecondary} mb-2`}>
              {activeTab === 'upcoming' ? 'No Upcoming Appointments' : 'No Past Appointments'}
            </h3>
            <p className={`${theme.textMuted} mb-4`}>
              {activeTab === 'upcoming' ? t('appointments.noAppointmentsDesc') : 'You have no past appointments yet.'}
            </p>
            {activeTab === 'upcoming' && (
              <button
                onClick={() => router.push('/user/dashboard')}
                className="px-4 py-2 bg-[#4D2FB2] text-white rounded-md hover:bg-[#62109F] transition-colors cursor-pointer outline-none"
              >
                {t('appointments.browseServices')}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedAppointments.map((appointment) => (
              <div
                key={appointment._id}
                className={`${theme.cardBg} rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-6 border ${isDark ? 'border-slate-700' : 'border-gray-200'}`}
              >
                <div 
                  onClick={() => router.push(`/user/appointments/${appointment._id}`)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-semibold ${theme.textAccent}`}>
                      {appointment.queue?.title || appointment.service?.title || 'Service'}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      activeTab === 'cancelled' 
                        ? (isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800')
                        : (isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800')
                    }`}>
                      {activeTab === 'cancelled' ? 'Cancelled' : t('appointments.booked')}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {appointment.date && (
                      <div className="flex items-center gap-3">
                        <IoCalendarOutline size={16} className={theme.textSecondary} />
                        <span className={`text-sm ${theme.textSecondary}`}>
                          {formatDate(appointment.date)}
                        </span>
                      </div>
                    )}
                    
                    {appointment.tokenNumber && (
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${theme.textAccent}`}>
                          Token #{appointment.tokenNumber}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          appointment.status === 'complete' ? 'bg-green-100 text-green-800' :
                          appointment.status === 'serving' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {appointment.status}
                        </span>
                      </div>
                    )}

                    {appointment.startTime && appointment.endTime && (
                      <div className="flex items-center gap-3">
                        <IoTimeOutline size={16} className={theme.textSecondary} />
                        <span className={`text-sm ${theme.textSecondary}`}>
                          {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <IoPeopleOutline size={16} className={theme.textSecondary} />
                      <span className={`text-sm ${theme.textSecondary}`}>
                        {appointment.groupSize} {t('appointments.people')}
                      </span>
                    </div>

                    {/* Payment Status */}
                    {appointment.paymentStatus && (
                      <div className="flex items-center gap-2 mt-3">
                        <IoCheckmarkCircle size={18} className="text-green-500" />
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          Payment: {appointment.paymentStatus === 'completed' ? 'Paid' : appointment.paymentStatus}
                        </span>
                      </div>
                    )}

                    {(appointment.queue?.organizer || appointment.service?.organizer) && (
                      <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
                        <p className={`text-xs ${theme.textMuted} mb-1`}>{t('appointments.organizer')}:</p>
                        <p className={`text-sm font-medium ${theme.textPrimary}`}>
                          {appointment.queue?.organizer?.name || appointment.service?.organizer?.name}
                        </p>
                      </div>
                    )}

                    {appointment.memberNames && appointment.memberNames.length > 0 && (
                      <div className="mt-3">
                        <p className={`text-xs ${theme.textMuted} mb-2`}>{t('appointments.groupMembers')}:</p>
                        <div className="flex flex-wrap gap-1">
                          {appointment.memberNames.map((name, index) => (
                            <span
                              key={index}
                              className={`px-2 py-1 rounded text-xs ${isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-[#F0F9FF] text-[#0EA5E9]'}`}
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>              
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex gap-2">
                  {activeTab === 'cancelled' ? (
                    <button
                      onClick={() => handleDownloadRefundInvoice(appointment)}
                      className="w-full px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-md hover:from-green-600 hover:to-green-700 transition-all duration-300 text-sm cursor-pointer outline-none flex items-center justify-center gap-2"
                    >
                      <IoDownloadOutline size={16} />
                      Refund Invoice
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => router.push(`/user/appointments/${appointment._id}`)}
                        className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-sm cursor-pointer outline-none flex items-center justify-center gap-2"
                      >
                        <IoDownloadOutline size={16} />
                        Invoice
                      </button>
                      
                      {activeTab === 'upcoming' && (
                        <button
                          onClick={() => handleCancelClick(appointment)}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-md hover:from-red-600 hover:to-red-700 transition-all duration-300 text-sm cursor-pointer outline-none flex items-center justify-center gap-2"
                        >
                          <IoCloseCircle size={16} />
                          Cancel
                        </button>
                      )}
                      
                      {activeTab === 'past' && (
                        <button
                          onClick={() => handleRebookClick(appointment)}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-[#62109F] to-[#8C00FF] text-white rounded-md hover:from-[#8C00FF] hover:to-[#6F00FF] transition-all duration-300 text-sm cursor-pointer outline-none flex items-center justify-center gap-2"
                        >
                          <IoRefreshCircle size={16} />
                          Rebook
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && selectedAppointment && (
        <div className="fixed inset-0 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div className={`${theme.cardBg} rounded-lg p-6 w-full max-w-md shadow-2xl`}>
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>
              Cancel Appointment
            </h3>
            <p className={`${theme.textSecondary} mb-4`}>
              Are you sure you want to cancel your appointment for <strong>{selectedAppointment.queue?.title || selectedAppointment.service?.title}</strong>?
            </p>
            
            {/* Refund Information */}
            {selectedAppointment.date && selectedAppointment.startTime && (() => {
              const now = new Date();
              const appointmentDate = new Date(selectedAppointment.date);
              const [hours, minutes] = selectedAppointment.startTime.split(':');
              appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
              const timeDiff = appointmentDate - now;
              const hoursDiff = timeDiff / (1000 * 60 * 60);
              
              let refundPercentage = 0;
              let refundColor = 'text-red-600';
              
              if (hoursDiff >= 24) {
                refundPercentage = 50;
                refundColor = 'text-green-600';
              } else if (hoursDiff >= 12) {
                refundPercentage = 25;
                refundColor = 'text-blue-600';
              } else if (hoursDiff >= 6) {
                refundPercentage = 10;
                refundColor = 'text-orange-600';
              }
              
              const paymentAmount = selectedAppointment.paymentAmount || 0;
              const refundAmount = (paymentAmount * refundPercentage) / 100;
              
              return (
                <div className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                  <p className={`text-sm ${theme.textSecondary} mb-2`}>Refund Information:</p>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-sm ${theme.textPrimary}`}>Original Amount:</span>
                    <span className={`font-semibold ${theme.textPrimary}`}>₹{paymentAmount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${theme.textPrimary}`}>Refund ({refundPercentage}%):</span>
                    <span className={`font-bold text-lg ${refundColor}`}>₹{refundAmount.toFixed(2)}</span>
                  </div>
                </div>
              );
            })()}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedAppointment(null);
                }}
                className={`px-4 py-2 ${theme.textSecondary} border ${theme.border} rounded-md hover:opacity-80 transition-colors cursor-pointer outline-none`}
              >
                No, Keep It
              </button>
              <button
                onClick={handleCancelAppointment}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors cursor-pointer outline-none"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProtectedMyAppointments() {
  return (
    <ProtectedRoute allowedRoles={[3]}>
      <MyAppointments />
    </ProtectedRoute>
  );
}