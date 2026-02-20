// quick-queue/frontend/app/admin/appointments/page.js

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { FaCalendarAlt, FaUsers, FaDownload } from "react-icons/fa";
import api from "../../utils/api";
import Navbar from "../../components/Navbar";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useTheme } from "../../context/ThemeContext";
import { getThemeClass } from "../../config/colors";

function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const { t } = useTranslation();
  const router = useRouter();
  const { isDark } = useTheme();
  const theme = getThemeClass(isDark);

  useEffect(() => {
    fetchAllAppointments();
  }, []);

  const fetchAllAppointments = async () => {
    try {
      const response = await api.get("/admin/appointments");
      console.log('Admin appointments response:', response.data);
      console.log('Appointment statuses:', response.data.map(a => ({ id: a._id, status: a.status })));
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
    if (appointment.endTime) {
      const [hours, minutes] = appointment.endTime.split(':');
      appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      return now < appointmentDate;
    }
    appointmentDate.setHours(23, 59, 59, 999);
    return now < appointmentDate;
  };

  const upcomingAppointments = appointments.filter(app => {
    const isCancelled = app.status === 'cancelled';
    return !isCancelled && isUpcoming(app);
  });
  const pastAppointments = appointments.filter(app => {
    const isCancelled = app.status === 'cancelled';
    return !isCancelled && !isUpcoming(app);
  });
  const cancelledAppointments = appointments.filter(app => app.status === 'cancelled');

  const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A';
    const [hours, minutes] = timeStr.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleDownloadRefundInvoice = (appointment) => {
    const service = appointment.queue || appointment.service;
    let originalAmount = appointment.paymentAmount || 0;
    let refundAmount = appointment.refundAmount || 0;
    let refundPercentage = appointment.refundPercentage || 0;

    if (refundPercentage === 0 && appointment.date && appointment.startTime) {
      const cancelTime = appointment.cancelledAt ? new Date(appointment.cancelledAt) : new Date();
      const appointmentDate = new Date(appointment.date);
      const [hours, minutes] = appointment.startTime.split(':');
      appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      const timeDiff = appointmentDate - cancelTime;
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      if (hoursDiff >= 24) refundPercentage = 50;
      else if (hoursDiff >= 12) refundPercentage = 25;
      else if (hoursDiff >= 6) refundPercentage = 10;
      refundAmount = (originalAmount * refundPercentage) / 100;
    }

    const formatDateWithTime = (dateString) => {
      if (!dateString) return 'N/A';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', month: 'short', day: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
      } catch (e) { return 'N/A'; }
    };

    const formatDateOnly = (dateString) => {
      if (!dateString) return 'N/A';
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      } catch (e) { return 'N/A'; }
    };

    const cancelledDate = appointment.cancelledAt || appointment.updatedAt || new Date().toISOString();
    const bookingDate = appointment.createdAt || new Date(appointment.date).toISOString();
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
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 15px 10px; max-width: 900px; margin: 0 auto; background: #f5f5f5; }
          .invoice-container { background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
          .header { text-align: center; padding: 18px 15px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; }
          .header h1 { font-size: 26px; margin-bottom: 6px; letter-spacing: 2px; }
          .refund-badge { display: inline-block; background: #10b981; color: white; padding: 5px 14px; border-radius: 20px; font-size: 12px; margin-top: 6px; }
          .invoice-number { color: rgba(255,255,255,0.9); font-size: 12px; margin-top: 6px; }
          .content { padding: 18px; }
          .section { margin-bottom: 12px; padding-bottom: 10px; border-bottom: 2px solid #f0f0f0; }
          .section:last-child { border-bottom: none; margin-bottom: 0; }
          .section-title { font-size: 15px; font-weight: 600; color: #ef4444; margin-bottom: 8px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          .info-item { display: flex; flex-direction: column; }
          .info-label { font-size: 10px; color: #6b7280; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
          .info-value { font-size: 13px; color: #1f2937; font-weight: 500; }
          .refund-box { background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); padding: 12px; border-radius: 10px; margin-top: 5px; }
          .refund-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; }
          .refund-row.total { font-size: 17px; font-weight: bold; color: #10b981; padding-top: 8px; border-top: 2px solid #fca5a5; margin-top: 5px; }
          .cancelled-notice { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin-bottom: 12px; border-radius: 4px; }
          .cancelled-notice p { color: #92400e; font-size: 13px; margin-bottom: 4px; }
          .footer { text-align: center; padding: 6px; color: #6b7280; font-size: 10px; background: #f9fafb; }
          @media print { body { background: white; padding: 0; } .no-print { display: none; } .invoice-container { box-shadow: none; } }
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
              <p>Cancelled on: ${formatDateWithTime(cancelledDate)}</p>
            </div>
            <div class="section">
              <div class="section-title">Service Details</div>
              <div class="info-grid">
                <div class="info-item"><div class="info-label">Service Name</div><div class="info-value">${service?.title || 'N/A'}</div></div>
                <div class="info-item"><div class="info-label">Service Type</div><div class="info-value" style="text-transform: capitalize;">${service?.serviceType || 'N/A'}</div></div>
                <div class="info-item"><div class="info-label">Customer</div><div class="info-value">${appointment.user?.name || 'N/A'}</div></div>
                ${service?.address ? `<div class="info-item" style="grid-column: 1 / -1;"><div class="info-label">Location</div><div class="info-value">${service.address}</div></div>` : ''}
              </div>
            </div>
            <div class="section">
              <div class="section-title">Original Booking Details</div>
              <div class="info-grid">
                ${appointment.date ? `<div class="info-item"><div class="info-label">Booked Date</div><div class="info-value">${formatDateOnly(appointment.date)}</div></div>` : ''}
                ${appointment.startTime ? `<div class="info-item"><div class="info-label">Time Slot</div><div class="info-value">${formatTime(appointment.startTime)} - ${formatTime(appointment.endTime || 'N/A')}</div></div>` : ''}
                <div class="info-item"><div class="info-label">Group Size</div><div class="info-value">${appointment.groupSize || 1} ${appointment.groupSize === 1 ? 'Person' : 'People'}</div></div>
                <div class="info-item"><div class="info-label">Booking Date</div><div class="info-value">${formatDateOnly(bookingDate)}</div></div>
              </div>
            </div>
            <div class="section">
              <div class="section-title">Refund Information</div>
              <div class="refund-box">
                <div class="refund-row"><span>Original Amount:</span><span>₹${originalAmount.toFixed(2)}</span></div>
                <div class="refund-row"><span>Refund Percentage:</span><span>${refundPercentage}%</span></div>
                <div class="refund-row"><span>Cancellation Fee:</span><span>₹${(originalAmount - refundAmount).toFixed(2)}</span></div>
                <div class="refund-row total"><span>Refund Amount:</span><span>₹${refundAmount.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
          <div class="footer">
            <p>This is a system-generated refund invoice</p>
            <p style="margin-top: 5px;">Generated on ${new Date().toLocaleString()}</p>
          </div>
          <div class="no-print" style="text-align: center; padding: 20px;">
            <button onclick="window.print()" style="padding: 12px 30px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 500;">Download Refund Invoice (PDF)</button>
          </div>
        </div>
      </body>
      </html>
    `;
    invoiceWindow.document.write(invoiceHTML);
    invoiceWindow.document.close();
  };

  const handleDownloadInvoice = (appointment) => {
    const service = appointment.queue || appointment.service;
    const pricePerPerson = (appointment.paymentAmount || 0) / (appointment.groupSize || 1);
    const totalAmount = appointment.paymentAmount || 0;
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
        <title>Invoice - ${service?.title || 'Service'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 15px 10px; max-width: 900px; margin: 0 auto; background: #f5f5f5; }
          .invoice-container { background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
          .header { text-align: center; padding: 18px 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
          .header h1 { font-size: 26px; margin-bottom: 6px; letter-spacing: 2px; }
          .payment-badge { display: inline-block; background: #10b981; color: white; padding: 5px 14px; border-radius: 20px; font-size: 12px; margin-top: 6px; }
          .invoice-number { color: rgba(255,255,255,0.9); font-size: 12px; margin-top: 6px; }
          .content { padding: 18px; }
          .section { margin-bottom: 12px; padding-bottom: 10px; border-bottom: 2px solid #f0f0f0; }
          .section:last-child { border-bottom: none; margin-bottom: 0; }
          .section-title { font-size: 15px; font-weight: 600; color: #667eea; margin-bottom: 8px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
          .info-item { display: flex; flex-direction: column; }
          .info-label { font-size: 10px; color: #6b7280; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
          .info-value { font-size: 13px; color: #1f2937; font-weight: 500; }
          .members-list { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px; }
          .member-badge { background: #ede9fe; color: #7c3aed; padding: 2px 8px; border-radius: 20px; font-size: 11px; }
          .payment-box { background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%); padding: 12px; border-radius: 10px; margin-top: 5px; }
          .payment-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; }
          .payment-row.total { font-size: 17px; font-weight: bold; color: #667eea; padding-top: 8px; border-top: 2px solid #c4b5fd; margin-top: 5px; }
          .footer { text-align: center; padding: 6px; color: #6b7280; font-size: 10px; background: #f9fafb; }
          @media print { body { background: white; padding: 0; } .no-print { display: none; } .invoice-container { box-shadow: none; } }
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
                <div class="info-item"><div class="info-label">Service Name</div><div class="info-value">${service?.title || 'N/A'}</div></div>
                <div class="info-item"><div class="info-label">Service Type</div><div class="info-value" style="text-transform: capitalize;">${service?.serviceType || 'N/A'}</div></div>
                <div class="info-item"><div class="info-label">Customer</div><div class="info-value">${appointment.user?.name || 'N/A'}</div></div>
                ${service?.address ? `<div class="info-item" style="grid-column: 1 / -1;"><div class="info-label">Location</div><div class="info-value">${service.address}</div></div>` : ''}
              </div>
            </div>
            <div class="section">
              <div class="section-title">Booking Details</div>
              <div class="info-grid">
                ${appointment.date ? `<div class="info-item"><div class="info-label">Appointment Date</div><div class="info-value">${formatDate(appointment.date)}</div></div>` : ''}
                ${appointment.startTime && appointment.endTime ? `<div class="info-item"><div class="info-label">Appointment Time</div><div class="info-value">${formatTime(appointment.startTime)} - ${formatTime(appointment.endTime)}</div></div>` : ''}
                <div class="info-item"><div class="info-label">Group Size</div><div class="info-value">${appointment.groupSize} ${appointment.groupSize === 1 ? 'Person' : 'People'}</div></div>
                ${appointment.createdAt ? `<div class="info-item"><div class="info-label">Booked Date</div><div class="info-value">${formatDate(appointment.createdAt)}</div></div>` : ''}
                ${appointment.createdAt ? `<div class="info-item"><div class="info-label">Booked Time</div><div class="info-value">${new Date(appointment.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</div></div>` : ''}
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
                <div class="payment-row"><span>Price per person:</span><span>₹${pricePerPerson.toFixed(2)}</span></div>
                <div class="payment-row"><span>Number of people:</span><span>× ${appointment.groupSize}</span></div>
                <div class="payment-row"><span>Payment Status:</span><span style="color: #10b981;">✓ Paid</span></div>
                <div class="payment-row total"><span>Total Amount:</span><span>₹${totalAmount}</span></div>
              </div>
            </div>
          </div>
          <div class="footer">
            <p>Thank you for choosing our service!</p>
            <p style="margin-top: 5px;">Invoice generated on ${new Date().toLocaleString()}</p>
          </div>
          <div class="no-print" style="text-align: center; padding: 20px;">
            <button onclick="window.print()" style="padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 500;">Download Invoice (PDF)</button>
          </div>
        </div>
      </body>
      </html>
    `;
    invoiceWindow.document.write(invoiceHTML);
    invoiceWindow.document.close();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'booked': case 'confirmed':
        return `bg-blue-100 ${isDark ? 'bg-blue-900/30' : ''} text-blue-800 ${isDark ? 'text-blue-300' : ''}`;
      case 'completed':
        return `bg-green-100 ${isDark ? 'bg-green-900/30' : ''} text-green-800 ${isDark ? 'text-green-300' : ''}`;
      case 'cancelled':
        return `bg-red-100 ${isDark ? 'bg-red-900/30' : ''} text-red-800 ${isDark ? 'text-red-300' : ''}`;
      default:
        return `bg-gray-100 ${isDark ? 'bg-gray-700' : ''} text-gray-800 ${isDark ? 'text-gray-300' : ''}`;
    }
  };

  if (loading) {
    return (
      <div className={theme.pageBg}>
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className={`text-xl ${theme.textPrimary}`}>{t('common.loading')}</div>
        </div>
      </div>
    );
  }

  const displayedAppointments = activeTab === 'upcoming' ? upcomingAppointments : activeTab === 'past' ? pastAppointments : cancelledAppointments;

  return (
    <div className={theme.pageBg}>
      <Navbar />
      <div className="max-w-7xl mx-auto p-6">
        <h1 className={`text-3xl font-bold ${theme.textPrimary} mb-6 flex items-center gap-3`}>
          <FaCalendarAlt size={32} />
          All Appointments
        </h1>

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

        {/* Appointments Table */}
        {displayedAppointments.length === 0 ? (
          <div className={`text-center py-12 ${theme.cardBg} rounded-lg shadow-lg`}>
            <FaCalendarAlt size={48} className={`mx-auto ${theme.textMuted} mb-4`} />
            <h3 className={`text-xl font-semibold ${theme.textSecondary} mb-2`}>
              No {activeTab} appointments
            </h3>
            <p className={theme.textMuted}>There are no {activeTab} appointments at the moment.</p>
          </div>
        ) : (
          <div className={`${theme.cardBg} rounded-lg shadow-lg overflow-hidden`}>
            <table className="w-full">
              <thead className="bg-gradient-to-r from-[#4D2FB2] to-[#62109F] text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date & Time</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Service</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Customer</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Organizer</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Group</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Amount</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {displayedAppointments
                  .sort((a, b) => {
                    const dateA = new Date(`${a.date}T${a.startTime || '00:00'}`);
                    const dateB = new Date(`${b.date}T${b.startTime || '00:00'}`);
                    return dateB - dateA;
                  })
                  .map((appointment, index) => (
                    <tr key={appointment._id} className={`hover:bg-gray-50 ${isDark ? 'hover:bg-gray-700' : ''} ${index % 2 === 0 ? `${theme.cardBg}` : `bg-gray-25 ${isDark ? 'bg-slate-700' : ''}`}`}>
                      <td className="px-4 py-4">
                        <div>
                          <p className={`font-medium ${theme.textPrimary} text-sm`}>{formatDate(appointment.date)}</p>
                          {appointment.startTime && appointment.endTime ? (
                            <p className={`text-sm ${theme.textSecondary}`}>{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</p>
                          ) : (
                            <p className={`text-sm ${theme.textSecondary}`}>Time not specified</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className={`font-medium ${theme.textPrimary} text-sm`}>{appointment.queue?.title || appointment.service?.title || 'N/A'}</p>
                        <p className={`text-xs ${theme.textSecondary} capitalize`}>{appointment.queue?.serviceType || appointment.service?.serviceType || 'N/A'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-[#85409D] flex items-center justify-center mr-2">
                            {appointment.user?.profileImage ? (
                              <img src={`http://localhost:5000/api/profile/image/${appointment.user.profileImage}`} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-medium text-white">{appointment.user?.name?.charAt(0) || 'U'}</span>
                            )}
                          </div>
                          <span className={`font-medium ${theme.textPrimary} text-sm`}>{appointment.user?.name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-sm ${theme.textPrimary}`}>{appointment.queue?.organizer?.name || appointment.service?.organizer?.name || 'N/A'}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center">
                          <FaUsers className="text-[#85409D] dark:text-purple-400 mr-1 text-sm" />
                          <span className={`font-medium ${theme.textPrimary} text-sm`}>{appointment.groupSize}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`font-medium ${theme.textPrimary} text-sm`}>₹{appointment.paymentAmount || 0}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(appointment.status)}`}>
                          {appointment.status || 'booked'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => appointment.status === 'cancelled' ? handleDownloadRefundInvoice(appointment) : handleDownloadInvoice(appointment)}
                          className={`p-2 ${appointment.status === 'cancelled' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg transition-colors cursor-pointer outline-none`}
                          title={appointment.status === 'cancelled' ? 'Download Refund Invoice' : 'Download Invoice'}
                        >
                          <FaDownload size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProtectedAdminAppointmentsPage() {
  return (
    <ProtectedRoute allowedRoles={[1]}>
      <AdminAppointmentsPage />
    </ProtectedRoute>
  );
}
