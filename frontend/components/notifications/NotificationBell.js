// quick-queue/feontend/components/notifications/NotificationBell.js

"use client";
import { useState, useEffect } from "react";
import { FaBell } from "react-icons/fa";
import { useAuth } from "@/app/context/Authcontext";
import { toast } from "react-toastify";
import { useTheme } from "@/app/context/ThemeContext";
import { getThemeClass } from "@/app/config/colors";
import { FaTimes } from "react-icons/fa";

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();
  const [token, setToken] = useState(null);
  const { isDark } = useTheme();
  const theme = getThemeClass(isDark);

  // Get token from localStorage
  useEffect(() => {
    const storage = localStorage.getItem("quick-queue");
    if (storage) {
      const parsed = JSON.parse(storage);
      setToken(parsed.token);
    }
  }, []);

  useEffect(() => {
    if (user && token) {
      fetchUnreadCount();
      fetchNotifications();

      const handleNewNotification = (event) => {
        const notification = event.detail;

        let isNewNotification = false;
        setNotifications((prev) => {
          const exists = prev.some(
            (n) =>
              (n._id && n._id === notification.id) ||
              (n.id && n.id === notification.id),
          );

          if (exists) {
            return prev;
          }

          isNewNotification = true;
          return [
            { ...notification, isRead: false, _id: notification.id },
            ...prev,
          ];
        });

        if (isNewNotification) {
          setUnreadCount((prev) => prev + 1);
        }

        toast.success(notification.message, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      };  

      window.addEventListener("new-notification", handleNewNotification);

      return () => {
        window.removeEventListener("new-notification", handleNewNotification);
      };
    }
  }, [user, token]);

  const fetchUnreadCount = async () => {
    if (!token) return;
    try {
      const res = await fetch(
        "http://localhost:5000/api/notifications/unread-count",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success) setUnreadCount(data.count);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5000/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Only show notifications that were sent (isSent: true)
          // And only from the last 2 hours to show only current appointment notifications
          const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
          const recentSentNotifications = data.notifications.filter(
            (n) => n.isSent && new Date(n.createdAt) > twoHoursAgo,
          );
          setNotifications(recentSentNotifications);
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markAsRead = async (id) => {
    if (!token) return;
    try {
      const res = await fetch(
        `http://localhost:5000/api/notifications/${id}/read`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        // Handle both _id and id properties
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === id || n.id === id ? { ...n, isRead: true } : n,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;
    try {
      const res = await fetch(
        "http://localhost:5000/api/notifications/read-all",
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // Show bell icon for all authenticated users, but only fetch data if token exists
  if (!user) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => token && setShowDropdown(!showDropdown)}
        className={`relative p-2 ${theme.textPrimary} hover:opacity-80 transition-colors cursor-pointer`}
      >
        <FaBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* 🔥 BACKDROP */}
      {showDropdown && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}

      {/* 🔔 DROPDOWN */}
      {showDropdown && (
        <div
          className={`absolute right-0 mt-2 w-80 ${theme.cardBg} 
        rounded-lg shadow-xl border ${theme.border} 
        z-[60] max-h-96 overflow-y-auto`}
        >
          <div
            className={`p-3 border-b ${theme.border} flex justify-between items-center`}
          >
            <h3 className={`font-semibold ${theme.textPrimary}`}>
              Notifications
            </h3>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Mark all read
                </button>
              )}

              <button
                onClick={() => setShowDropdown(false)}
                className={`${theme.textSecondary} hover:text-red-500 transition-colors cursor-pointer`}
              >
                <FaTimes size={14} />
              </button>
            </div>
          </div>
          {notifications.length === 0 ? (
            <p className={`p-4 text-center ${theme.textSecondary}`}>
              No notifications
            </p>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif._id || notif.id}
                onClick={() =>
                  !notif.isRead && markAsRead(notif._id || notif.id)
                }
                className={`p-3 border-b ${theme.border} hover:bg-opacity-50 cursor-pointer ${
                  !notif.isRead
                    ? isDark
                      ? "bg-purple-900/30"
                      : "bg-blue-50"
                    : ""
                }`}
              >
                <p className={`text-sm ${theme.textPrimary}`}>
                  {notif.message}
                </p>
                <p className={`text-xs ${theme.textSecondary} mt-1`}>
                  {new Date(
                    notif.scheduledFor || notif.createdAt,
                  ).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
