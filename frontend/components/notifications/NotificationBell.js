'use client';
import { useState, useEffect } from 'react';
import { FaBell } from 'react-icons/fa';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/app/context/Authcontext';
import { toast } from 'react-toastify';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();
  const [token, setToken] = useState(null);

  // Get token from localStorage
  useEffect(() => {
    const storage = localStorage.getItem('quick-queue');
    if (storage) {
      const parsed = JSON.parse(storage);
      setToken(parsed.token);
    }
  }, []);

  useEffect(() => {
    console.log(' NotificationBell mounted, user:', user?.id, 'token:', !!token);
    
    if (user && token) {
      fetchUnreadCount();
      fetchNotifications();

      // Listen for custom window event dispatched by socket.js
      const handleNewNotification = (event) => {
        const notification = event.detail;
        console.log(' NotificationBell received:', notification);
        
        // Check if notification already exists to prevent duplicates
        let isNewNotification = false;
        setNotifications(prev => {
          const exists = prev.some(n => 
            (n._id && n._id === notification.id) || 
            (n.id && n.id === notification.id)
          );
          
          if (exists) {
            console.log(' Notification already exists, skipping duplicate');
            return prev;
          }
          
          isNewNotification = true;
          // Add new notification at the beginning with isRead: false
          return [{ ...notification, isRead: false, _id: notification.id }, ...prev];
        });
        
        // Only increment count if it's actually a new notification
        if (isNewNotification) {
          console.log(' Incrementing unread count');
          setUnreadCount(prev => prev + 1);
        }
        
        // Show toast notification using react-toastify
        toast.success(notification.message, {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      };

      console.log(' NotificationBell: Event listener added');
      window.addEventListener('new-notification', handleNewNotification);

      return () => {
        console.log(' NotificationBell: Event listener removed');
        window.removeEventListener('new-notification', handleNewNotification);
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
        if (data.success) {
          // Only show notifications that were sent (isSent: true)
          // And only from the last 2 hours to show only current appointment notifications
          const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
          const recentSentNotifications = data.notifications.filter(n => 
            n.isSent && new Date(n.createdAt) > twoHoursAgo
          );
          setNotifications(recentSentNotifications);
        }
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
        // Handle both _id and id properties
        setNotifications(prev => prev.map(n => 
          (n._id === id || n.id === id) ? { ...n, isRead: true } : n
        ));
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
                key={notif._id || notif.id}
                onClick={() => !notif.isRead && markAsRead(notif._id || notif.id)}
                className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${!notif.isRead ? 'bg-blue-50' : ''}`}
              >
                <p className="text-sm">{notif.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(notif.scheduledFor || notif.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
