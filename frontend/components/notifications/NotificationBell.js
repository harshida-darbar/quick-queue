'use client';
import { useState, useEffect } from 'react';
import { FaBell } from 'react-icons/fa';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/app/context/Authcontext';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { user, token } = useAuth();

  useEffect(() => {
    if (user && token) {
      fetchUnreadCount();
      fetchNotifications();

      const socket = getSocket();
      if (socket) {
        socket.on('notification', (notification) => {
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        });
      }

      return () => {
        if (socket) {
          socket.off('notification');
        }
      };
    }
  }, [user, token]);

  const fetchUnreadCount = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:5000/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (id) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:5000/api/notifications/read-all', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
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
        className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        <FaBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="p-4 text-center text-gray-500">No notifications</p>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif._id}
                onClick={() => !notif.isRead && markAsRead(notif._id)}
                className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${!notif.isRead ? 'bg-blue-50' : ''}`}
              >
                <p className="text-sm">{notif.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(notif.scheduledFor).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
