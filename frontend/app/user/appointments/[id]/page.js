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
      console.log('Appointment data:', response.data);
      console.log('Payment status:', response.data.paymentStatus);
      console.log('Payment amount:', response.data.paymentAmount);
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
    if (!appointment) return;

    const pricePerPerson = (appointment.paymentAmount || 0) / (appointment.groupSize || 1);
    const totalAmount = appointment.paymentAmount || 0;

    // Generate invoice number if not present
    let invoiceNum = appointment.invoiceNumber;
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
        <title>Invoice - ${appointment.queue?.title || 'Service'}</title>
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
              <div class="info-grid" style="grid-template-columns: 1fr 1fr ${isQueueEntry && appointment.tokenNumber ? '1fr' : ''};">
                <div class="info-item">
                  <div class="info-label">Service Name</div>
                  <div class="info-value">${appointment.queue?.title || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Service Type</div>
                  <div class="info-value" style="text-transform: capitalize;">${appointment.queue?.serviceType || 'N/A'}</div>
                </div>
                ${isQueueEntry && appointment.tokenNumber ? `
                <div class="info-item">
                  <div class="info-label">Token Number</div>
                  <div class="info-value" style="color: #667eea; font-size: 20px;">#${appointment.tokenNumber}</div>
                </div>
                ` : ''}
                ${appointment.queue?.address ? `
                  <div class="info-item" style="grid-column: 1 / -1;">
                    <div class="info-label">Location</div>
                    <div class="info-value">${appointment.queue.address}</div>
                  </div>
                ` : ''}
              </div>
            </div>

            <div class="section">
              <div class="section-title">Booking Details</div>
              <div class="info-grid" style="grid-template-columns: 1fr 1fr 1fr;">
                ${appointment.date ? `
                <div class="info-item">
                  <div class="info-label">${isQueueEntry ? 'Service Date' : 'Appointment Date'}</div>
                  <div class="info-value">${formatDate(appointment.date)}</div>
                </div>
                ` : ''}
                ${appointment.startTime && appointment.endTime ? `
                <div class="info-item">
                  <div class="info-label">${isQueueEntry ? 'Service Time' : 'Appointment Time'}</div>
                  <div class="info-value">${formatTime(appointment.startTime)} - ${formatTime(appointment.endTime)}</div>
                </div>
                ` : ''}
                <div class="info-item">
                  <div class="info-label">Group Size</div>
                  <div class="info-value">${appointment.groupSize} ${appointment.groupSize === 1 ? 'Person' : 'People'}</div>
                </div>
                ${appointment.createdAt ? `
                <div class="info-item">
                  <div class="info-label">Booked Date</div>
                  <div class="info-value">${formatDate(appointment.createdAt)}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Booked Time</div>
                  <div class="info-value">${new Date(appointment.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
                </div>
                ` : ''}
                ${appointment.memberNames && appointment.memberNames.length > 0 ? `
                  <div class="info-item" style="grid-column: 1 / -1;">
                    <div class="info-label">Members</div>
                    <div class="members-list">
                      ${appointment.memberNames.map(name => `<span class="member-badge">${name}</span>`).join('')}
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
                  <span>× ${appointment.groupSize}</span>
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
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className={theme.textSecondary}>{t('appointments.pricePerPerson')}:</span>
                  <span className={theme.textPrimary}>₹{((appointment.paymentAmount || 0) / (appointment.groupSize || 1)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className={theme.textSecondary}>{t('appointments.numberOfPeople')}:</span>
                  <span className={theme.textPrimary}>× {appointment.groupSize}</span>
                </div>
                <div className={`flex justify-between items-center pt-2 border-t ${isDark ? 'border-purple-700' : 'border-purple-200'}`}>
                  <span className={`text-sm font-semibold ${theme.textSecondary}`}>{t('appointments.totalAmount')}:</span>
                  <span className={`text-2xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                    ₹{appointment.paymentAmount || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Booked Date/Time */}
            {appointment.createdAt && (
              <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
                <p className={`text-xs ${theme.textMuted} mb-2`}>{t('appointments.bookingCreated')}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className={`text-xs ${theme.textMuted} mb-1`}>{t('appointments.bookedDate')}</p>
                    <p className={`text-sm font-semibold ${theme.textPrimary}`}>{formatDate(appointment.createdAt)}</p>
                  </div>
                  <div>
                    <p className={`text-xs ${theme.textMuted} mb-1`}>{t('appointments.bookedTime')}</p>
                    <p className={`text-sm font-semibold ${theme.textPrimary}`}>
                      {new Date(appointment.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3 mt-4">
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
            <FaDownload size={14} /> {t('appointments.invoice')}
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
