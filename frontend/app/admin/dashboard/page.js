// quick-queue/frontend/app/admin/dashboard/page.js

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar, Pie } from "react-chartjs-2";
import { 
  IoCash, 
  IoPeople, 
  IoStar,
  IoCalendar,
  IoCheckmarkCircle,
  IoTime
} from "react-icons/io5";
import api from "../../utils/api";
import Navbar from "../../components/Navbar";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useTheme } from "../../context/ThemeContext";
import { getThemeClass } from "../../config/colors";
import StatsCard from "../components/StatsCard";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function AdminDashboard() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const theme = getThemeClass(isDark);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get("/admin/analytics");
      setAnalytics(response.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error(t('admin.failedToFetchAnalytics') || "Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme.pageBg}`}>
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className={`text-xl ${theme.textAccent}`}>{t('admin.loadingDashboard')}</div>
        </div>
      </div>
    );
  }

  // Revenue Line Chart Data
  const revenueChartData = {
    labels: analytics?.revenue.byDay.map(d => new Date(d._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })) || [],
    datasets: [
      {
        label: t('admin.dailyRevenue'),
        data: analytics?.revenue.byDay.map(d => d.revenue) || [],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Bookings Bar Chart Data
  const bookingsChartData = {
    labels: [t('admin.today'), t('admin.thisWeek'), t('admin.thisMonth')],
    datasets: [
      {
        label: t('admin.bookings'),
        data: [
          analytics?.bookings.today || 0,
          analytics?.bookings.week || 0,
          analytics?.bookings.month || 0,
        ],
        backgroundColor: [
          'rgba(147, 51, 234, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
        ],
      },
    ],
  };

  // Booking Status Pie Chart Data
  const statusChartData = {
    labels: [t('admin.completed'), t('admin.currentlyServing'), t('admin.waiting')],
    datasets: [
      {
        data: [
          analytics?.bookings.completed || 0,
          analytics?.bookings.serving || 0,
          analytics?.bookings.waiting || 0,
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(251, 191, 36, 0.8)',
        ],
        borderWidth: 2,
        borderColor: isDark ? '#1e293b' : '#ffffff',
      },
    ],
  };

  // Service Type Chart Data
  const serviceTypeChartData = {
    labels: analytics?.bookingsByServiceType.map(s => s._id.charAt(0).toUpperCase() + s._id.slice(1)) || [],
    datasets: [
      {
        label: t('admin.bookingsByServiceType'),
        data: analytics?.bookingsByServiceType.map(s => s.count) || [],
        backgroundColor: [
          'rgba(147, 51, 234, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: isDark ? '#e2e8f0' : '#1e293b',
        },
      },
    },
    scales: {
      y: {
        ticks: {
          color: isDark ? '#94a3b8' : '#64748b',
        },
        grid: {
          color: isDark ? '#334155' : '#e2e8f0',
        },
      },
      x: {
        ticks: {
          color: isDark ? '#94a3b8' : '#64748b',
        },
        grid: {
          color: isDark ? '#334155' : '#e2e8f0',
        },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: isDark ? '#e2e8f0' : '#1e293b',
          padding: 15,
        },
      },
    },
  };

  return (
    <div className={`min-h-screen ${theme.pageBg}`}>
      <Navbar />

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${theme.textAccent} mb-2`}>
            {t('admin.dashboard')}
          </h1>
          <p className={`${theme.textSecondary}`}>
            {t('admin.welcomeBack')}
          </p>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title={t('admin.totalBookings')}
            value={analytics?.bookings.total || 0}
            icon={IoCalendar}
            color="purple"
            subtitle={`${analytics?.bookings.today || 0} ${t('admin.today')}`}
          />
          <StatsCard
            title={t('admin.totalRevenue')}
            value={`₹${analytics?.revenue.total || 0}`}
            icon={IoCash}
            color="green"
            subtitle={`₹${analytics?.revenue.today || 0} ${t('admin.today')}`}
          />
          <StatsCard
            title={t('admin.totalUsers')}
            value={analytics?.users.total || 0}
            icon={IoPeople}
            color="blue"
            subtitle={`${analytics?.users.organizers || 0} ${t('admin.organizers')}`}
          />
          <StatsCard
            title={t('admin.averageRating')}
            value={analytics?.ratings.average?.toFixed(1) || '0.0'}
            icon={IoStar}
            color="orange"
            subtitle={`${analytics?.ratings.totalReviews || 0} ${t('admin.reviewsCount')}`}
          />
        </div>

        {/* Booking Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`${theme.cardBg} rounded-lg shadow-lg p-6 border ${theme.border}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme.textSecondary} mb-1`}>{t('admin.completed')}</p>
                <p className={`text-2xl font-bold text-green-600`}>
                  {analytics?.bookings.completed || 0}
                </p>
              </div>
              <IoCheckmarkCircle size={40} className="text-green-600" />
            </div>
          </div>

          <div className={`${theme.cardBg} rounded-lg shadow-lg p-6 border ${theme.border}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme.textSecondary} mb-1`}>{t('admin.currentlyServing')}</p>
                <p className={`text-2xl font-bold text-blue-600`}>
                  {analytics?.bookings.serving || 0}
                </p>
              </div>
              <IoTime size={40} className="text-blue-600" />
            </div>
          </div>

          <div className={`${theme.cardBg} rounded-lg shadow-lg p-6 border ${theme.border}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme.textSecondary} mb-1`}>{t('admin.waiting')}</p>
                <p className={`text-2xl font-bold text-yellow-600`}>
                  {analytics?.bookings.waiting || 0}
                </p>
              </div>
              <IoTime size={40} className="text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Line Chart */}
          <div className={`${theme.cardBg} rounded-lg shadow-lg p-6 border ${theme.border}`}>
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>
              {t('admin.revenueTrend')}
            </h3>
            <div style={{ height: '300px' }}>
              <Line data={revenueChartData} options={chartOptions} />
            </div>
          </div>

          {/* Bookings Bar Chart */}
          <div className={`${theme.cardBg} rounded-lg shadow-lg p-6 border ${theme.border}`}>
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>
              {t('admin.bookingsOverview')}
            </h3>
            <div style={{ height: '300px' }}>
              <Bar data={bookingsChartData} options={chartOptions} />
            </div>
          </div>

          {/* Booking Status Pie Chart */}
          <div className={`${theme.cardBg} rounded-lg shadow-lg p-6 border ${theme.border}`}>
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>
              {t('admin.bookingStatusDistribution')}
            </h3>
            <div style={{ height: '300px' }}>
              <Pie data={statusChartData} options={pieOptions} />
            </div>
          </div>

          {/* Service Type Bar Chart */}
          <div className={`${theme.cardBg} rounded-lg shadow-lg p-6 border ${theme.border}`}>
            <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>
              {t('admin.bookingsByServiceType')}
            </h3>
            <div style={{ height: '300px' }}>
              <Bar data={serviceTypeChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={`${theme.cardBg} rounded-lg shadow-lg p-6 border ${theme.border}`}>
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>
            {t('admin.quickActions')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/admin/users')}
              className="px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300 cursor-pointer outline-none"
            >
              {t('admin.manageUsers')}
            </button>
            <button
              onClick={() => router.push('/admin/services')}
              className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 cursor-pointer outline-none"
            >
              {t('admin.manageServices')}
            </button>
            <button
              onClick={() => router.push('/admin/payments')}
              className="px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 cursor-pointer outline-none"
            >
              {t('admin.viewPayments')}
            </button>
            <button
              onClick={() => router.push('/admin/reviews')}
              className="px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 cursor-pointer outline-none"
            >
              {t('admin.manageReviews')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProtectedAdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={[1]}>
      <AdminDashboard />
    </ProtectedRoute>
  );
}
