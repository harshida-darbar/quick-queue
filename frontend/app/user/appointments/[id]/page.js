"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { FaArrowLeft, FaCalendarAlt, FaClock, FaUsers, FaMapMarkerAlt, FaCheckCircle, FaMoneyBillWave, FaDownload } from "react-icons/fa";
import api from "../../../utils/api";
import Navbar from "../../../components/Navbar";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { useTheme } from "../../../context/ThemeContext";
import { getThemeClass } from "../../../config/colors";

function AppointmentDetail() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const theme = getThemeClass(isDark);
  const router = useRouter();
  const params = useParams();
  const appointmentId = params.id;

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointmentDetails();
  }, [appointmentId]);

  const fetchAppointmentDetails = async () => {
    try {
      const response = await api.get(`/queue/appointments/${appointmentId}`);
      setAppointment(response.data);
    } catch (error) {
      console.error("Error fetching appointment:", error);
      toast.error("Failed to load appointment details");
    } finally {
      setLoading(false);
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

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const isQueueEntry = appointment?.type === 'queue' || appointment?.tokenNumber;

  const handleDownloadInvoice = () => {
    // Get translated text
    const downloadBtnText = t('appointments.downloadInvoicePDF');
    
    // Generate invoice number if not present (for old bookings)
    let invoiceNum = appointment.invoiceNumber;
    if (!invoiceNum) {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      invoiceNum = `INV-${dateStr}-${randomNum}`;
    }
    
    console.log('Invoice number:', invoiceNum);
    
    // Create a printable invoice
    const printWindow = window.open('', '_blank');
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${appointment.queue?.title || 'Service'}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
            font-size: 13px;
          }
          .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px solid #4D2FB2;
            padding-bottom: 10px;
          }
          .header h1 {
            color: #4D2FB2;
            margin: 0;
            font-size: 28px;
          }
          .success-badge {
            background: #10B981;
            color: white;
            padding: 4px 12px;
            border-radius: 15px;
            display: inline-block;
            margin-top: 5px;
            font-size: 12px;
          }
          .section {
            margin: 12px 0;
            padding: 10px;
            background: #f9fafb;
            border-radius: 6px;
          }
          .section-title {
            font-weight: bold;
            color: #4D2FB2;
            margin-bottom: 8px;
            font-size: 14px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            color: #6b7280;
            font-size: 12px;
          }
          .detail-value {
            font-weight: 600;
            color: #111827;
            font-size: 12px;
            text-align: right;
          }
          .payment-section {
            background: #f3e8ff;
            border: 2px solid #a855f7;
            margin-top: 12px;
          }
          .total-amount {
            font-size: 20px;
            color: #7c3aed;
            font-weight: bold;
          }
          .footer {
            margin-top: 15px;
            text-align: center;
            color: #6b7280;
            font-size: 11px;
          }
          .download-btn {
            background: linear-gradient(to right, #4D2FB2, #62109F);
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            margin: 15px auto;
            display: block;
          }
          .download-btn:hover {
            background: linear-gradient(to right, #62109F, #8C00FF);
          }
          @media print {
            body { 
              padding: 15px;
              font-size: 12px;
            }
            .download-btn { display: none; }
            .section {
              margin: 10px 0;
              padding: 8px;
            }
            .header {
              margin-bottom: 12px;
              padding-bottom: 8px;
            }
            .header h1 {
              font-size: 24px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>BOOKING INVOICE</h1>
          <div class="success-badge">✓ Payment Confirmed</div>
          <p style="margin-top: 8px; color: #6b7280; font-size: 12px;">Invoice #: ${invoiceNum}</p>
        </div>

        <div class="section">
          <div class="section-title">Service Details</div>
          <div class="detail-row">
            <span class="detail-label">Service Name:</span>
            <span class="detail-value">${appointment.queue?.title || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Service Type:</span>
            <span class="detail-value">${appointment.queue?.serviceType || 'N/A'}</span>
          </div>
          ${appointment.queue?.address ? `
          <div class="detail-row">
            <span class="detail-label">Location:</span>
            <span class="detail-value">${appointment.queue.address}</span>
          </div>
          ` : ''}
        </div>

        ${isQueueEntry && appointment.tokenNumber ? `
        <div class="section">
          <div class="section-title">Token Information</div>
          <div class="detail-row">
            <span class="detail-label">Token Number:</span>
            <span class="detail-value">#${appointment.tokenNumber}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value">${appointment.status === 'serving' ? 'Being Served' : appointment.status === 'waiting' ? 'Waiting' : 'Complete'}</span>
          </div>
        </div>
        ` : ''}

        <div class="section">
          <div class="section-title">Booking Details</div>
          ${appointment.date ? `
          <div class="detail-row">
            <span class="detail-label">Date:</span>
            <span class="detail-value">${formatDate(appointment.date)}</span>
          </div>
          ` : ''}
          ${appointment.startTime && appointment.endTime ? `
          <div class="detail-row">
            <span class="detail-label">Time:</span>
            <span class="detail-value">${formatTime(appointment.startTime)} - ${formatTime(appointment.endTime)}</span>
          </div>
          ` : ''}
          ${isQueueEntry && !appointment.date && appointment.createdAt ? `
          <div class="detail-row">
            <span class="detail-label">Joined On:</span>
            <span class="detail-value">${formatDate(appointment.createdAt)}</span>
          </div>
          ` : ''}
          <div class="detail-row">
            <span class="detail-label">Group Size:</span>
            <span class="detail-value">${appointment.groupSize} ${appointment.groupSize === 1 ? 'Person' : 'People'}</span>
          </div>
          ${appointment.memberNames && appointment.memberNames.length > 0 ? `
          <div class="detail-row">
            <span class="detail-label">Members:</span>
            <span class="detail-value">${appointment.memberNames.join(', ')}</span>
          </div>
          ` : ''}
        </div>

        <div class="section payment-section">
          <div class="section-title">Payment Information</div>
          <div class="detail-row">
            <span class="detail-label">Payment Status:</span>
            <span class="detail-value">${appointment.paymentStatus === 'completed' ? '✓ Paid' : 'Pending'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label" style="font-size: 14px;">Total Amount:</span>
            <span class="total-amount">₹${appointment.paymentAmount || 0}</span>
          </div>
        </div>

        <button class="download-btn" onclick="window.print()">${downloadBtnText}</button>

        <div class="footer">
          <p>Thank you for choosing our service!</p>
          <p>Invoice generated on ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme.pageBg}`}>
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className={`text-xl ${theme.textAccent}`}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className={`min-h-screen ${theme.pageBg}`}>
        <Navbar />
        <div className="max-w-3xl mx-auto p-6">
          <div className={`text-center ${theme.textAccent}`}>
            <p className="text-xl mb-4">{t('appointments.appointmentNotFound')}</p>
            <button
              onClick={() => router.push("/user/appointments")}
              className="px-4 py-2 bg-[#4D2FB2] text-white rounded-md hover:bg-[#62109F]"
            >
              {t('appointments.backToAppointmentsBtn')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.pageBg}`}>
      <Navbar />

      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => router.push("/user/appointments")}
            className={`p-2 ${theme.textAccent} rounded-lg transition-colors cursor-pointer outline-none ${isDark ? 'hover:bg-slate-700' : 'hover:bg-white hover:bg-opacity-20'}`}
          >
            <FaArrowLeft size={16} />
          </button>
          <span className={theme.textSecondary}>{t('appointments.backToAppointments')}</span>
        </div>

        {/* Success Banner */}
        <div className={`mb-4 p-4 rounded-lg ${isDark ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-300'}`}>
          <div className="flex items-center gap-3">
            <FaCheckCircle className="text-green-600 text-2xl flex-shrink-0" />
            <div>
              <h2 className={`text-lg font-bold ${isDark ? 'text-green-300' : 'text-green-800'}`}>
                {t('appointments.bookingConfirmed')}
              </h2>
              <p className={`text-sm ${isDark ? 'text-green-200' : 'text-green-700'}`}>
                {t('appointments.paymentSuccessful')}
              </p>
            </div>
          </div>
        </div>

        {/* Main Ticket Card */}
        <div className={`${theme.cardBg} rounded-xl shadow-2xl overflow-hidden mb-4`}>
          {/* Header Section */}
          <div className="bg-gradient-to-r from-[#4D2FB2] to-[#62109F] p-6 text-white">
            <h1 className="text-2xl font-bold mb-1">
              {appointment.queue?.title || "Service"}
            </h1>
            <p className="text-sm opacity-90 capitalize">
              {appointment.queue?.serviceType || "Service"}
            </p>
          </div>

          {/* Ticket Details */}
          <div className="p-6 space-y-4">
            {/* Token Number (for queue entries) */}
            {isQueueEntry && appointment.tokenNumber && (
              <div className="text-center py-4 border-b border-dashed border-gray-300">
                <p className={`text-sm ${theme.textMuted} mb-1`}>{t('appointments.tokenNumber')}</p>
                <p className={`text-4xl font-bold ${theme.textAccent}`}>
                  #{appointment.tokenNumber}
                </p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                  appointment.status === 'serving'
                    ? 'bg-green-100 text-green-800'
                    : appointment.status === 'waiting'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800'
                }`}>
                  {appointment.status === 'serving' ? `🟢 ${t('appointments.beingServed')}` : 
                   appointment.status === 'waiting' ? `🟡 ${t('appointments.waiting')}` : 
                   `✅ ${t('appointments.complete')}`}
                </span>
              </div>
            )}

            {/* Date & Time Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Date */}
              {appointment.date && (
                <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <FaCalendarAlt className={theme.textAccent} size={16} />
                    <p className={`text-xs ${theme.textMuted}`}>{t('appointments.date')}</p>
                  </div>
                  <p className={`text-sm font-semibold ${theme.textPrimary}`}>
                    {formatDate(appointment.date)}
                  </p>
                </div>
              )}

              {/* Time */}
              {appointment.startTime && appointment.endTime && (
                <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <FaClock className={theme.textAccent} size={16} />
                    <p className={`text-xs ${theme.textMuted}`}>{t('appointments.time')}</p>
                  </div>
                  <p className={`text-sm font-semibold ${theme.textPrimary}`}>
                    {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                  </p>
                </div>
              )}

              {/* Joined Date (for queue entries without appointment time) */}
              {isQueueEntry && !appointment.date && appointment.createdAt && (
                <div className={`p-3 rounded-lg col-span-2 ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <FaCalendarAlt className={theme.textAccent} size={16} />
                    <p className={`text-xs ${theme.textMuted}`}>{t('appointments.joinedOn')}</p>
                  </div>
                  <p className={`text-sm font-semibold ${theme.textPrimary}`}>
                    {formatDate(appointment.createdAt)}
                  </p>
                </div>
              )}
            </div>

            {/* Group Size & Members */}
            <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <FaUsers className={theme.textAccent} size={16} />
                <p className={`text-sm font-semibold ${theme.textPrimary}`}>
                  {appointment.groupSize} {appointment.groupSize === 1 ? t('appointments.person') : t('appointments.people')}
                </p>
              </div>
              {appointment.memberNames && appointment.memberNames.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {appointment.memberNames.map((name, index) => (
                    <span
                      key={index}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-slate-600 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Location */}
            {appointment.queue?.address && (
              <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
                <div className="flex items-start gap-2">
                  <FaMapMarkerAlt className={`${theme.textAccent} mt-0.5`} size={16} />
                  <div>
                    <p className={`text-xs ${theme.textMuted} mb-1`}>{t('appointments.location')}</p>
                    <p className={`text-sm ${theme.textPrimary}`}>
                      {appointment.queue.address}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Details */}
            <div className={`p-4 rounded-lg border-2 ${isDark ? 'bg-purple-900/20 border-purple-700' : 'bg-purple-50 border-purple-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FaMoneyBillWave className={isDark ? 'text-purple-400' : 'text-purple-600'} size={16} />
                  <p className={`text-sm font-semibold ${theme.textPrimary}`}>{t('appointments.paymentDetails')}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  appointment.paymentStatus === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {appointment.paymentStatus === 'completed' ? `✓ ${t('appointments.paid')}` : t('appointments.pending')}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className={`text-sm ${theme.textSecondary}`}>{t('appointments.totalAmount')}</span>
                <span className={`text-2xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                  ₹{appointment.paymentAmount || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => router.push("/user/appointments")}
            className="px-4 py-3 bg-gradient-to-r from-[#4D2FB2] to-[#62109F] text-white rounded-lg hover:from-[#62109F] hover:to-[#8C00FF] transition-all duration-300 font-medium text-sm cursor-pointer"
          >
            {t('appointments.allBookings')}
          </button>
          <button
            onClick={handleDownloadInvoice}
            className="px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 font-medium text-sm flex items-center justify-center gap-2 cursor-pointer"
          >   
            <FaDownload size={14} /> {t('organizer.invoice')}
          </button>
          <button
            onClick={() => router.push("/user/dashboard")}
            className={`px-4 py-3 border ${theme.border} rounded-lg ${theme.textSecondary} hover:${theme.textAccent} transition-colors font-medium text-sm cursor-pointer`}
          >
            {t('appointments.browseServices')}
          </button>
        </div>
        
      </div>
    </div>
  );
}

export default function ProtectedAppointmentDetail() {
  return (
    <ProtectedRoute allowedRoles={[3]}>
      <AppointmentDetail />
    </ProtectedRoute>
  );
}
