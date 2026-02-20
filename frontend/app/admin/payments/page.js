// quick-queue/frontend/app/admin/payments/page.js

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  IoCash,
  IoSearch,
  IoFilter,
  IoDownload,
  IoCheckmarkCircle,
  IoTime,
  IoCalendar,
  IoCard,
  IoPeople,
} from "react-icons/io5";
import api from "../../utils/api";
import Navbar from "../../components/Navbar";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useTheme } from "../../context/ThemeContext";
import { getThemeClass } from "../../config/colors";

function PaymentsManagement() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const theme = getThemeClass(isDark);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("appointments"); // 'appointments' or 'services'
  const [appointmentPayments, setAppointmentPayments] = useState([]);
  const [queuePayments, setQueuePayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => {
    fetchAllPayments();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [appointmentPayments, queuePayments, activeTab, searchTerm, statusFilter, dateFilter]);

  const fetchAllPayments = async () => {
    try {
      // Fetch both appointment and queue payments
      const [appointmentsRes, queueRes] = await Promise.all([
        api.get("/admin/payments"),
        api.get("/admin/payments/queue")
      ]);
      
      const appointmentsData = Array.isArray(appointmentsRes.data) ? appointmentsRes.data : [];
      const queueData = Array.isArray(queueRes.data) ? queueRes.data : [];
      
      setAppointmentPayments(appointmentsData);
      setQueuePayments(queueData);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to fetch payments");
      setAppointmentPayments([]);
      setQueuePayments([]);
    } finally {
      setLoading(false);
    }
  };

  const filterPayments = () => {
    // Get payments based on active tab
    const payments = activeTab === "appointments" ? appointmentPayments : queuePayments;
    
    if (!Array.isArray(payments)) {
      setFilteredPayments([]);
      return;
    }

    let filtered = [...payments];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((payment) => payment.paymentStatus === statusFilter);
    }

    // Filter by date
    if (dateFilter !== "all") {
      const now = new Date();
      filtered = filtered.filter((payment) => {
        const paymentDate = new Date(payment.paymentDate);
        switch (dateFilter) {
          case "today":
            return paymentDate.toDateString() === now.toDateString();
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return paymentDate >= weekAgo;
          case "month":
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return paymentDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (payment) =>
          payment.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.service?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPayments(filtered);
  };

  const calculateTotalRevenue = () => {
    const payments = activeTab === "appointments" ? appointmentPayments : queuePayments;
    if (!Array.isArray(payments)) return 0;
    return payments
      .filter((p) => p.paymentStatus === "completed")
      .reduce((sum, p) => sum + (p.paymentAmount || 0), 0);
  };

  const exportToCSV = () => {
    const headers = activeTab === "services" 
      ? ["Date", "Invoice", "Token", "User", "Service", "Amount", "Status", "Method", "Queue Status"]
      : ["Date", "Invoice", "User", "Service", "Amount", "Status", "Method"];
    
    const rows = filteredPayments.map((payment) => {
      const baseRow = [
        new Date(payment.paymentDate).toLocaleDateString(),
        payment.invoiceNumber || "N/A",
      ];
      
      if (activeTab === "services") {
        baseRow.push(`#${payment.tokenNumber || "N/A"}`);
      }
      
      baseRow.push(
        payment.user?.name || "Unknown",
        payment.service?.title || "Unknown",
        `₹${payment.paymentAmount || 0}`,
        payment.paymentStatus || "pending",
        payment.paymentMethod || "N/A"
      );
      
      if (activeTab === "services") {
        baseRow.push(payment.status || "N/A");
      }
      
      return baseRow;
    });

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Payments exported successfully");
  };

  const getStatusBadge = (status) => {
    const badges = {
      completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return badges[status] || badges.pending;
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

  return (
    <div className={`min-h-screen ${theme.pageBg}`}>
      <Navbar />

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <IoCash size={32} className="text-purple-600" />
                <h1 className={`text-3xl font-bold ${theme.textAccent}`}>
                  {t("admin.payments")}
                </h1>
              </div>
              <p className={`${theme.textSecondary}`}>
                Track all payment transactions across the platform
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

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("appointments")}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 outline-none cursor-pointer ${
              activeTab === "appointments"
                ? "bg-gradient-to-r from-[#62109F] to-[#8C00FF] text-white shadow-lg"
                : `${theme.cardBg} ${theme.textSecondary} hover:opacity-80`
            }`}
          >
            Appointments ({appointmentPayments.length})
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 outline-none cursor-pointer ${
              activeTab === "services"
                ? "bg-gradient-to-r from-[#62109F] to-[#8C00FF] text-white shadow-lg"
                : `${theme.cardBg} ${theme.textSecondary} hover:opacity-80`
            }`}
          >
            Services ({queuePayments.length})
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`${theme.cardBg} rounded-lg shadow p-4 border ${theme.border}`}>
            <p className={`text-sm ${theme.textSecondary} mb-1`}>Total Revenue</p>
            <p className={`text-2xl font-bold text-green-600`}>₹{calculateTotalRevenue()}</p>
          </div>
          <div className={`${theme.cardBg} rounded-lg shadow p-4 border ${theme.border}`}>
            <p className={`text-sm ${theme.textSecondary} mb-1`}>Total Transactions</p>
            <p className={`text-2xl font-bold ${theme.textAccent}`}>
              {activeTab === "appointments" ? appointmentPayments.length : queuePayments.length}
            </p>
          </div>
          <div className={`${theme.cardBg} rounded-lg shadow p-4 border ${theme.border}`}>
            <p className={`text-sm ${theme.textSecondary} mb-1`}>Completed</p>
            <p className={`text-2xl font-bold text-green-600`}>
              {activeTab === "appointments" 
                ? appointmentPayments.filter((p) => p.paymentStatus === "completed").length 
                : queuePayments.filter((p) => p.paymentStatus === "completed").length}
            </p>
          </div>
          <div className={`${theme.cardBg} rounded-lg shadow p-4 border ${theme.border}`}>
            <p className={`text-sm ${theme.textSecondary} mb-1`}>Pending</p>
            <p className={`text-2xl font-bold text-yellow-600`}>
              {activeTab === "appointments" 
                ? appointmentPayments.filter((p) => p.paymentStatus === "pending").length 
                : queuePayments.filter((p) => p.paymentStatus === "pending").length}
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
                placeholder="Search by user, service, or invoice..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${theme.border} ${theme.inputBg} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <IoFilter size={20} className={theme.textSecondary} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${theme.border} ${theme.inputBg} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer`}
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${theme.border} ${theme.inputBg} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer`}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <p className={`text-sm ${theme.textSecondary}`}>
              Showing {filteredPayments.length} of {activeTab === "appointments" ? appointmentPayments.length : queuePayments.length} transactions
            </p>
          </div>
        </div>

        {/* Payments Table */}
        <div className={`${theme.cardBg} rounded-lg shadow-lg overflow-hidden border ${theme.border}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Invoice</th>
                  {activeTab === "services" && (
                    <th className="px-6 py-4 text-left text-sm font-semibold">Token</th>
                  )}
                  <th className="px-6 py-4 text-left text-sm font-semibold">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Service</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Method</th>
                  {activeTab === "services" && (
                    <th className="px-6 py-4 text-left text-sm font-semibold">Queue Status</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === "services" ? "9" : "7"} className="px-6 py-12 text-center">
                      <p className={`${theme.textSecondary}`}>No payments found</p>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment, index) => (
                    <tr
                      key={payment._id || index}
                      className={`${theme.cardBg} hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <IoCalendar size={16} className={theme.textSecondary} />
                          <span className={`text-sm ${theme.textPrimary}`}>
                            {new Date(payment.paymentDate).toLocaleDateString()}
                          </span>
                        </div>
                        <p className={`text-xs ${theme.textSecondary}`}>
                          {new Date(payment.paymentDate).toLocaleTimeString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className={`text-sm font-mono ${theme.textPrimary}`}>
                          {payment.invoiceNumber || "N/A"}
                        </p>
                      </td>
                      {activeTab === "services" && (
                        <td className="px-6 py-4">
                          <span className={`text-sm font-bold ${theme.textAccent}`}>
                            #{payment.tokenNumber || "N/A"}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <p className={`text-sm font-medium ${theme.textPrimary}`}>
                          {payment.user?.name || "Unknown"}
                        </p>
                        <p className={`text-xs ${theme.textSecondary}`}>
                          {payment.user?.email || "No email"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className={`text-sm ${theme.textPrimary}`}>
                          {payment.service?.title || "Unknown Service"}
                        </p>
                        <p className={`text-xs ${theme.textSecondary}`}>
                          {payment.service?.serviceType || "N/A"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className={`text-sm font-bold text-green-600`}>
                          ₹{payment.paymentAmount || 0}
                        </p>
                        {payment.groupSize > 1 && (
                          <p className={`text-xs ${theme.textSecondary}`}>
                            ₹{payment.pricePerPerson || 0} × {payment.groupSize} people
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                            payment.paymentStatus
                          )}`}
                        >
                          {payment.paymentStatus === "completed" && <IoCheckmarkCircle size={14} />}
                          {payment.paymentStatus === "pending" && <IoTime size={14} />}
                          {payment.paymentStatus?.charAt(0).toUpperCase() +
                            payment.paymentStatus?.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <IoCard size={16} className={theme.textSecondary} />
                          <span className={`text-sm ${theme.textPrimary} capitalize`}>
                            {payment.paymentMethod || "N/A"}
                          </span>
                        </div>
                      </td>
                      {activeTab === "services" && (
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              payment.status === "serving"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                : payment.status === "waiting"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : payment.status === "complete"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                            }`}
                          >
                            {payment.status?.charAt(0).toUpperCase() + payment.status?.slice(1) || "N/A"}
                          </span>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProtectedPaymentsManagement() {
  return (
    <ProtectedRoute allowedRoles={[1]}>
      <PaymentsManagement />
    </ProtectedRoute>
  );
}
