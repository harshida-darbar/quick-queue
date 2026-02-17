// quick-queue/frontend/app/user/booked-services/[id]/page.js

"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { FaTicketAlt, FaCalendarAlt, FaClock, FaUsers, FaMapMarkerAlt, FaMoneyBillWave, FaFileInvoice, FaCheckCircle } from "react-icons/fa";
import { IoArrowBack } from "react-icons/io5";
import { toast } from "react-toastify";
import api from "../../../utils/api";
import Navbar from "../../../components/Navbar";
import { useTheme } from "../../../context/ThemeContext";
import { getThemeClass } from "../../../config/colors";

export default function BookedServiceTicket({ params }) {
  const resolvedParams = use(params);
  const { isDark } = useTheme();
  const theme = getThemeClass(isDark);
  const { t } = useTranslation();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchEntryDetails();
  }, [resolvedParams.id]);

  const fetchEntryDetails = async () => {
    try {
      const response = await api.get(`/queue/queue-entry/${resolvedParams.id}`);
      console.log("Entry details:", response.data);
      setEntry(response.data);
    } catch (error) {
      console.error("Error fetching entry details:", error);
      toast.error("Failed to fetch ticket details");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (!entry) return;

    const pricePerPerson = (entry.paymentAmount || 0) / (entry.groupSize || 1);
    const totalAmount = entry.paymentAmount || 0;

    const invoiceWindow = window.open('', '_blank');
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${entry.queue?.title}</title>
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
            ${entry.invoiceNumber ? `<div class="invoice-number">Invoice #: ${entry.invoiceNumber}</div>` : ''}
          </div>
          
          <div class="content">
            <div class="section">
              <div class="section-title">Service Details</div>
              <div class="info-grid" style="grid-template-columns: 1fr 1fr 1fr;">
                <div class="info-item">
                  <div class="info-label">Service Name</div>
                  <div class="info-value">${entry.queue?.title || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Service Type</div>
                  <div class="info-value" style="text-transform: capitalize;">${entry.queue?.serviceType || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Token Number</div>
                  <div class="info-value" style="color: #667eea; font-size: 20px;">#${entry.tokenNumber}</div>
                </div>
                ${entry.queue?.address ? `
                  <div class="info-item" style="grid-column: 1 / -1;">
                    <div class="info-label">Location</div>
                    <div class="info-value">${entry.queue.address}</div>
                  </div>
                ` : ''}
              </div>
            </div>

            <div class="section">
              <div class="section-title">Booking Details</div>
              <div class="info-grid" style="grid-template-columns: 1fr 1fr 1fr;">
                <div class="info-item">
                  <div class="info-label">Booked Date</div>
                  <div class="info-value">${new Date(entry.createdAt).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</div>
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

  if (!entry) {
    return (
      <div className={`min-h-screen ${theme.pageBg}`}>
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-xl text-red-600">{t('appointments.appointmentNotFound')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.pageBg}`}>
      <Navbar />
      
      <div className="max-w-3xl mx-auto p-6">
        <button
          onClick={() => router.push("/user/booked-services")}
          className={`mb-6 ${theme.textAccent} flex items-center font-medium outline-none`}
        >
          <IoArrowBack size={20} className="mr-1 cursor-pointer hover:bg-white hover:bg-opacity-20 rounded-lg p-1" />
          {t('appointments.backToBookedServices')}
        </button>

        {/* Ticket Card */}
        <div className={`${theme.cardBg} rounded-xl shadow-2xl overflow-hidden`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-[#4D2FB2] to-[#62109F] p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-1">{entry.queue?.title}</h1>
                <p className="text-purple-200 capitalize">{entry.queue?.serviceType}</p>
              </div>
              <FaTicketAlt size={48} className="opacity-80" />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Token Number */}
            <div className={`p-4 rounded-lg ${isDark ? 'bg-purple-900/30' : 'bg-purple-50'} text-center`}>
              <p className={`text-sm ${theme.textMuted} mb-1`}>{t('organizer.token')}</p>
              <p className={`text-4xl font-bold ${theme.textAccent}`}>#{entry.tokenNumber}</p>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <FaCalendarAlt className={theme.textMuted} />
                  <span className={`text-sm font-medium ${theme.textSecondary}`}>{t('appointments.date')}</span>
                </div>
                <p className={`font-semibold ${theme.textPrimary}`}>
                  {new Date(entry.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <FaClock className={theme.textMuted} />
                  <span className={`text-sm font-medium ${theme.textSecondary}`}>{t('appointments.time')}</span>
                </div>
                <p className={`font-semibold ${theme.textPrimary}`}>
                  {new Date(entry.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>

            {/* Group Details */}
            <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-2">
                <FaUsers className={theme.textMuted} />
                <span className={`text-sm font-medium ${theme.textSecondary}`}>{t('appointments.groupMembers')}</span>
              </div>
              <p className={`font-semibold ${theme.textPrimary} mb-2`}>
                {entry.groupSize} {entry.groupSize === 1 ? 'person' : 'people'}
              </p>
              {entry.memberNames && entry.memberNames.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {entry.memberNames.map((name, index) => (
                    <span
                      key={index}
                      className={`px-3 py-1 rounded-full text-sm ${isDark ? 'bg-purple-900/50 text-purple-200' : 'bg-purple-100 text-purple-800'}`}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Location */}
            {entry.queue?.address && (
              <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <FaMapMarkerAlt className={theme.textMuted} />
                  <span className={`text-sm font-medium ${theme.textSecondary}`}>{t('appointments.location')}</span>
                </div>
                <p className={`${theme.textPrimary}`}>{entry.queue.address}</p>
              </div>
            )}

            {/* Payment Details */}
            <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2 mb-3">
                <FaMoneyBillWave className={theme.textMuted} />
                <span className={`text-sm font-medium ${theme.textSecondary}`}>{t('appointments.paymentDetails')}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={theme.textSecondary}>{t('appointments.pricePerPerson')}:</span>
                  <span className={`font-semibold ${theme.textPrimary}`}>₹{((entry.paymentAmount || 0) / (entry.groupSize || 1)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className={theme.textSecondary}>{t('appointments.numberOfPeople')}:</span>
                  <span className={`font-semibold ${theme.textPrimary}`}>× {entry.groupSize}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t ${theme.border}">
                  <span className={theme.textSecondary}>{t('appointments.totalAmount')}:</span>
                  <span className={`font-bold text-lg ${theme.textPrimary}`}>₹{entry.paymentAmount || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={theme.textSecondary}>{t('appointments.status')}:</span>
                  <span className="flex items-center gap-2">
                    <FaCheckCircle className="text-green-500" />
                    <span className="text-green-500 font-semibold">{t('appointments.paid')}</span>
                  </span>
                </div>
                {entry.invoiceNumber && (
                  <div className="flex justify-between">
                    <span className={theme.textSecondary}>Invoice #:</span>
                    <span className={`font-mono ${theme.textPrimary}`}>{entry.invoiceNumber}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 gap-3 pt-4">
              <button
                onClick={handleDownloadInvoice}
                className="flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-[#4D2FB2] to-[#62109F] text-white rounded-lg hover:from-[#62109F] hover:to-[#8C00FF] transition-all duration-300 font-medium cursor-pointer"
              >
                <FaFileInvoice />
                {t('appointments.invoice')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
