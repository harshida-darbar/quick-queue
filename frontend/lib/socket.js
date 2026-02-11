// quick-queue/frontend/lib/socket.js

import { io } from 'socket.io-client';

let socket = null;

export const initSocket = (userId) => {
  if (!socket) {
    console.log('Initializing Socket.IO connection...');
    socket = io('http://localhost:5000', {
      withCredentials: true,
      transports: ['websocket', 'polling'], // Try both transports
    });

    socket.on('connect', () => {
      console.log(' Socket connected:', socket.id);
      if (userId) {
        socket.emit('join', userId);
        console.log('Joined room for user:', userId);
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('notification', (notification) => {
      console.log(' Notification received:', notification);
      
      // Dispatch custom event for NotificationBell to listen
      if (typeof window !== 'undefined') {
        console.log(' Dispatching new-notification event');
        const event = new CustomEvent('new-notification', { 
          detail: notification 
        });
        window.dispatchEvent(event);
        console.log(' Event dispatched');
      }
    });

    socket.on('connect_error', (error) => {
      console.error(' Socket connection error:', error);
    });
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    console.log(' Disconnecting socket...');
    socket.disconnect();
    socket = null;
  }
};
